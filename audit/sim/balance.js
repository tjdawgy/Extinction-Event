#!/usr/bin/env node
// Phase 5 balance runs: Default AI, every faction pairing, a 30-minute cap (the Extinction Event's 27:00 limit always
// decides first, so nothing reaches it), endings reported separately (HQ destroyed before 20:00, in the storm, on score,
// true draws). Optional per-personality sets (both sides the same personality) and damage diagnostics.
//   node audit/sim/balance.js [--n=60] [--mirror=30] [--persona=20] [--seed=50000] [--jobs=4] [--diag] [--tag=base] [--code="..."]
// code: an experiment's SIM changes, run in every match before it starts (tuning rounds are tried this way first)
// Writes audit/sim/out/balance-<tag>.json and .md.
const fs = require('fs');
const path = require('path');
const { runSet } = require('./run');
const { loadSim } = require('./load');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const FAC = ['lastfist', 'bloomhost', 'axiarchs'], NAME = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' };
const PERS = ['aggressor', 'turtle', 'economist', 'trickster'];
const PAIRS = [['lastfist', 'bloomhost'], ['lastfist', 'axiarchs'], ['bloomhost', 'axiarchs']];
const pct = (a, b) => b ? Math.round(1000 * a / b) / 10 : 0;
const mmss = t => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;

// Ending of one match: 'hq' (an HQ fell before 20:00), 'late' (decided after 20:00: an HQ fell in the storm or the score), 'draw'
const ending = m => m.result === 'draw' ? 'draw' : m.t < 1200 ? 'hq' : 'late';
function compact(set) { // what a pairing needs for the report
  const ms = set.matches, out = { n: ms.length, A: set.A.faction, B: set.B.faction, wins: { A: 0, B: 0, draw: 0 }, by20: { A: 0, B: 0, open: 0 }, endings: { hq: 0, late: 0, draw: 0 }, len: 0 };
  for (const m of ms) {
    out.wins[m.result]++; out.endings[ending(m)]++; out.len += m.t / ms.length;
    if (m.t < 1200 && m.result !== 'draw') out.by20[m.result]++; else out.by20.open++;
  }
  out.len = Math.round(out.len);
  return out;
}

// Unit presence in winning armies, per faction, over every set given (alive at the end of a match the side won)
function unitWin(sets, S) {
  const out = {};
  for (const f of FAC) {
    const units = Object.keys(S.UDEF).filter(t => (S.UDEF[t].fac || 'lastfist') === f && !S.UDEF[t].noTrain);
    let wins = 0, sides = 0; const inWin = {}, trainedWin = {}, trained = {};
    for (const set of sets) for (const m of set.matches) for (const k of ['A', 'B']) {
      const sd = m[k]; if (sd.faction !== f) continue;
      sides++; for (const t in sd.trained) trained[t] = (trained[t] || 0) + 1;
      if (m.result !== k) continue;
      wins++;
      for (const t in sd.alive) inWin[t] = (inWin[t] || 0) + 1;
      for (const t in sd.trained) trainedWin[t] = (trainedWin[t] || 0) + 1;
    }
    out[f] = { wins, sides, units: Object.fromEntries(units.map(t => [t, { alive: pct(inWin[t] || 0, wins), trained: pct(trainedWin[t] || 0, wins), any: pct(trained[t] || 0, sides) }])) };
  }
  return out;
}

async function balance({ n = 60, mirror = 30, persona = 20, seed = 50000, jobs = 4, diag = false, tag = 'base', code } = {}) {
  const t0 = Date.now(), res = { tag, version: loadSim(1).VERSION, cross: {}, mirror: {}, persona: {} }, sets = [];
  const side = (f, p = 'random') => ({ faction: f, ai: 'default', persona: p });
  for (const [a, b] of PAIRS) { const st = await runSet({ a: side(a), b: side(b), n, seed: seed + 100 * FAC.indexOf(a) + 10 * FAC.indexOf(b), jobs, maxT: 1800, diag, code }); sets.push(st); res.cross[`${a}-${b}`] = compact(st); res.cross[`${a}-${b}`].set = st; }
  if (mirror) for (const f of FAC) { const st = await runSet({ a: side(f), b: side(f), n: mirror, seed: seed + 1000 + 100 * FAC.indexOf(f), jobs, maxT: 1800, diag, code }); res.mirror[f] = compact(st); res.mirror[f].set = st; }
  if (persona) for (const p of PERS) for (const [a, b] of PAIRS) { const st = await runSet({ a: side(a, p), b: side(b, p), n: persona, seed: seed + 2000 + 100 * PERS.indexOf(p) + 10 * FAC.indexOf(a) + FAC.indexOf(b), jobs, maxT: 1800, diag, code }); sets.push(st); res.persona[`${p}:${a}-${b}`] = compact(st); res.persona[`${p}:${a}-${b}`].set = st; }
  res.unitWin = unitWin(sets, loadSim(1));
  res.minutes = Math.round((Date.now() - t0) / 60000);
  return res;
}

// Faction totals over every cross-faction set given: wins, losses, draws
function factionTotals(rows) {
  const T = Object.fromEntries(FAC.map(f => [f, { w: 0, l: 0, d: 0 }]));
  for (const r of rows) { T[r.A].w += r.wins.A; T[r.A].l += r.wins.B; T[r.B].w += r.wins.B; T[r.B].l += r.wins.A; T[r.A].d += r.wins.draw; T[r.B].d += r.wins.draw; }
  return T;
}
function markdown(res) {
  const L = [], row = (k, r) => `| ${k} | ${r.n} | ${r.wins.A}–${r.wins.B}–${r.wins.draw} | **${pct(r.wins.A, r.wins.A + r.wins.B)}%** | ${r.by20.A}–${r.by20.B} (${r.by20.open} open at 20:00, ${pct(r.by20.open, r.n)}%) | ${r.endings.hq} / ${r.endings.late} / ${r.endings.draw} | ${mmss(r.len)} |`;
  const head = ['| Pairing (A vs B) | Matches | A–B–draw (final) | A share of decided | By 20:00: A–B | Endings: HQ <20:00 / after 20:00 / draw | Mean length |', '|---|---|---|---|---|---|---|'];
  L.push(`## Balance run "${res.tag}" (v${res.version})`, '', `Default AI on Hard, maxT 30:00 (the 27:00 Extinction limit decides every match first), ${res.minutes} minutes on 4 processes.`, '');
  L.push('### Cross-faction, random personalities', '', ...head);
  for (const k in res.cross) L.push(row(`${NAME[res.cross[k].A]} vs ${NAME[res.cross[k].B]}`, res.cross[k]));
  const T = factionTotals(Object.values(res.cross));
  L.push('', '| Faction | Wins | Losses | Draws | Win share of decided |', '|---|---|---|---|---|');
  for (const f of FAC) L.push(`| ${NAME[f]} | ${T[f].w} | ${T[f].l} | ${T[f].d} | **${pct(T[f].w, T[f].w + T[f].l)}%** |`);
  if (Object.keys(res.mirror).length) { L.push('', '### Mirrors', '', ...head); for (const f in res.mirror) L.push(row(NAME[f], res.mirror[f])); }
  if (Object.keys(res.persona).length) {
    L.push('', '### Per personality (both sides the same personality)', '', ...head);
    for (const k in res.persona) { const [p] = k.split(':'); L.push(row(`${p}: ${NAME[res.persona[k].A]} vs ${NAME[res.persona[k].B]}`, res.persona[k])); }
    const T2 = factionTotals(Object.values(res.persona));
    L.push('', '| Faction (personality sets) | Wins | Losses | Draws | Win share of decided |', '|---|---|---|---|---|');
    for (const f of FAC) L.push(`| ${NAME[f]} | ${T2[f].w} | ${T2[f].l} | ${T2[f].d} | **${pct(T2[f].w, T2[f].w + T2[f].l)}%** |`);
  }
  L.push('', '### Units in winning armies (cross-faction and personality sets)', '', 'alive: share of that faction\'s wins where the unit was alive at the end; trained: share of its wins where it was trained at all; any: share of all its sides that trained it. Flags: alive or trained > 70% (**high**), trained < 10% (**low**).', '');
  for (const f of FAC) {
    const U = res.unitWin[f]; L.push(`**${NAME[f]}** (${U.wins} wins over ${U.sides} sides)`, '', '| Unit | alive in wins | trained in wins | any side | |', '|---|---|---|---|---|');
    for (const t in U.units) { const u = U.units[t]; L.push(`| ${t} | ${u.alive}% | ${u.trained}% | ${u.any}% | ${u.trained > 70 ? '**high**' : u.trained < 10 ? '**low**' : ''} |`); }
    L.push('');
  }
  return L.join('\n');
}
module.exports = { balance, markdown, factionTotals, compact, FAC, PAIRS, PERS };

if (require.main === module) (async () => {
  const res = await balance({ n: +(arg('n') || 60), mirror: +(arg('mirror') ?? 30), persona: +(arg('persona') ?? 20), seed: +(arg('seed') || 50000), jobs: +(arg('jobs') || 4), diag: process.argv.includes('--diag'), tag: arg('tag') || 'base', code: arg('code') });
  const dir = path.join(__dirname, 'out'); fs.mkdirSync(dir, { recursive: true });
  const strip = o => { const c = {}; for (const k in o) { const { set, ...r } = o[k]; c[k] = Object.assign(r, { matches: set.matches.map(m => ({ seed: m.seed, t: m.t, how: m.how, result: m.result, aSide: m.aSide, A: m.A, B: m.B, samples: m.samples })) }); } return c; };
  fs.writeFileSync(path.join(dir, `balance-${res.tag}.json`), JSON.stringify({ tag: res.tag, version: res.version, minutes: res.minutes, cross: strip(res.cross), mirror: strip(res.mirror), persona: strip(res.persona), unitWin: res.unitWin }));
  const md = markdown(res); fs.writeFileSync(path.join(dir, `balance-${res.tag}.md`), md); console.log(md);
})().catch(e => { console.error(e); process.exit(1); });
