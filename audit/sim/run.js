#!/usr/bin/env node
// Match runner: N headless matches of one AI against another, in parallel, then a JSON file and a markdown summary.
//   node audit/sim/run.js --a=lastfist:default:random --b=bloomhost:legacy:random --n=40 [--seed=1] [--jobs=4]
//                         [--diff=hard] [--maxT=1200] [--out=audit/sim/out/name]
// A side is faction:preset:personality (preset default|legacy; personality aggressor|turtle|economist|trickster|random).
// Match i uses seed + i; A takes side 0 on even matches and side 1 on odd ones, so neither side's position counts.
// As a module: runSet(opts) → { matches, summary } (used by validate.js).
const { fork } = require('child_process');
const fs = require('fs');
const path = require('path');

const parseSide = str => { const [faction, ai = 'default', persona = 'random'] = String(str).split(':'); return { faction, ai, persona }; };
const label = x => `${x.faction}:${x.ai}:${x.persona}`;

// Runs the given match specs on `jobs` worker processes; each worker plays matches one after another
function runSpecs(specs, jobs = 4, onDone) {
  return new Promise((resolve, reject) => {
    const out = new Array(specs.length), workers = []; let next = 0, done = 0;
    if (!specs.length) return resolve(out);
    const stop = () => { for (const w of workers) if (w.connected) w.kill(); };
    const spawn = () => {
      if (next >= specs.length) return;
      const w = fork(path.join(__dirname, 'worker.js')); workers.push(w);
      const feed = () => { if (next < specs.length) { const i = next++; w.send({ i, spec: specs[i] }); } else if (w.connected) w.kill(); };
      w.on('message', m => {
        if (m.error) { stop(); return reject(new Error(`match ${m.i} (seed ${specs[m.i].seed}): ${m.error}`)); }
        out[m.i] = m.res; done++; if (onDone) onDone(done, specs.length);
        if (done === specs.length) { stop(); resolve(out); } else feed();
      });
      w.on('error', e => { stop(); reject(e); });
      feed();
    };
    for (let k = 0; k < Math.min(jobs, specs.length); k++) spawn();
  });
}

// Build the specs for an A-vs-B set, play them, and re-express each result from A's and B's point of view
async function runSet({ a, b, n = 20, seed = 1, jobs = 4, diff = 'hard', maxT = 1200, quiet = false, diag = false, code }) {
  const A = typeof a === 'string' ? parseSide(a) : a, B = typeof b === 'string' ? parseSide(b) : b;
  const specs = [];
  for (let i = 0; i < n; i++) specs.push({ seed: seed + i, diff, maxT, diag, code, sides: i % 2 ? [B, A] : [A, B], aSide: i % 2 ? 1 : 0 });
  const t0 = Date.now();
  const res = await runSpecs(specs, jobs, quiet ? null : (d, N) => process.stderr.write(`\r${label(A)} vs ${label(B)}: ${d}/${N}`));
  if (!quiet) process.stderr.write(` (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
  const matches = res.map((r, i) => { const as = specs[i].aSide; return Object.assign(r, { aSide: as, A: r.sides[as], B: r.sides[1 - as], result: r.winner < 0 ? 'draw' : r.winner === as ? 'A' : 'B' }); });
  return { A, B, matches, summary: summarize(A, B, matches) };
}

// ---------- Aggregation ----------
const pct = (x, n) => n ? Math.round(1000 * x / n) / 10 : 0;
function summarize(A, B, ms) {
  const n = ms.length, wins = { A: 0, B: 0, draw: 0 };
  for (const m of ms) wins[m.result]++;
  const side = k => {
    const units = {}, lost = {}, present = {}, inWin = {};
    let earned = 0, spent = 0, wonN = 0;
    for (const m of ms) {
      const s = m[k];
      for (const t in s.trained) { units[t] = (units[t] || 0) + s.trained[t]; present[t] = (present[t] || 0) + 1; }
      for (const t in s.lost) lost[t] = (lost[t] || 0) + s.lost[t];
      earned += s.earned[0]; spent += s.spent[0];
      if (m.result === k) { wonN++; for (const t in s.alive) inWin[t] = (inWin[t] || 0) + 1; }
    }
    return { units, lost, present, inWin, wonN, earned: Math.round(earned / n), spent: Math.round(spent / n) };
  };
  const curves = k => { // means at each minute mark over the matches still running then: bank, credits earned so far, army value, nodes held
    const out = {};
    for (const t of [120, 300, 600, 900, 1200]) {
      const pts = [];
      for (const m of ms) {
        if (m.t < t - 30) continue;
        const sm = m.samples.filter(x => x.t <= t).pop(); if (!sm) continue;
        pts.push([sm, k === 'A' ? m.aSide : 1 - m.aSide]);
      }
      if (!pts.length) continue;
      const avg = f => Math.round(pts.reduce((a, [sm, si]) => a + f(sm, si), 0) / pts.length);
      out[t] = { matches: pts.length, bank: avg((sm, si) => sm.bank[si]), earned: avg((sm, si) => sm.earned[si]), army: avg((sm, si) => sm.army[si]),
        nodes: Math.round(100 * pts.reduce((a, [sm, si]) => a + sm.nodes.filter(o => o === si).length, 0) / pts.length) / 100 };
    }
    return out;
  };
  const len = ms.map(m => m.t);
  return { n, wins, winRateA: pct(wins.A, n), winRateB: pct(wins.B, n), draws: pct(wins.draw, n), timeouts: ms.filter(m => m.timeout).length,
    avgLength: Math.round(len.reduce((a, b) => a + b, 0) / n), A: side('A'), B: side('B'), curves: { A: curves('A'), B: curves('B') } };
}

const mmss = t => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;
function markdown(set) {
  const { A, B, summary: S } = set, L = [];
  L.push(`## ${label(A)} vs ${label(B)}`, '');
  L.push(`${S.n} matches · A wins **${S.wins.A}** (${S.winRateA}%) · B wins **${S.wins.B}** (${S.winRateB}%) · draws ${S.wins.draw} (${S.timeouts} reached the 20-minute limit) · average length ${mmss(S.avgLength)}`, '');
  for (const k of ['A', 'B']) {
    const s = S[k], X = k === 'A' ? A : B, types = Object.keys(s.units).sort((a, b) => s.units[b] - s.units[a]);
    L.push(`**${k}: ${label(X)}** · credits earned ${s.earned}, spent ${s.spent} (mean per match)`, '');
    L.push('| Unit | Built (total) | Lost (total) | In % of matches | In % of its winning armies |', '|---|---|---|---|---|');
    for (const t of types) L.push(`| ${t} | ${s.units[t]} | ${s.lost[t] || 0} | ${pct(s.present[t], S.n)} | ${s.wonN ? pct(s.inWin[t] || 0, s.wonN) : '–'} |`);
    L.push('');
    L.push('| Minute | Bank | Credits earned | Army value | Nodes held |', '|---|---|---|---|---|');
    for (const t in S.curves[k]) { const c = S.curves[k][t]; L.push(`| ${t / 60} | ${c.bank} | ${c.earned} | ${c.army} | ${c.nodes} |`); }
    L.push('');
  }
  return L.join('\n');
}

module.exports = { runSet, runSpecs, summarize, markdown, parseSide, label };

if (require.main === module) {
  const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
  (async () => {
    const set = await runSet({ a: arg('a') || 'lastfist:default:random', b: arg('b') || 'lastfist:legacy:random', n: +(arg('n') || 20), seed: +(arg('seed') || 1), jobs: +(arg('jobs') || 4), diff: arg('diff') || 'hard', maxT: +(arg('maxT') || 1200) });
    const out = arg('out') || path.join(__dirname, 'out', `${label(set.A)}_vs_${label(set.B)}`.replace(/:/g, '-'));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out + '.json', JSON.stringify({ A: set.A, B: set.B, summary: set.summary, matches: set.matches }, null, 1));
    fs.writeFileSync(out + '.md', markdown(set));
    console.log(markdown(set).split('\n').slice(0, 3).join('\n'));
    console.log(`→ ${out}.json, ${out}.md`);
  })().catch(e => { console.error(e); process.exit(1); });
}
