#!/usr/bin/env node
// Phase 4 validation: Default-vs-Default mirrors (crashes, endings, side balance, unit usage) and Default vs Legacy for
// every faction pairing. Writes audit/validation.md and audit/sim/out/validation.json.
//   node audit/sim/validate.js [--mirror=100] [--vs=40] [--jobs=4]
const fs = require('fs');
const path = require('path');
const { runSet } = require('./run');
const { loadSim } = require('./load');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const FAC = ['lastfist', 'bloomhost', 'axiarchs'], NAME = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' };
const pct = (a, b) => b ? Math.round(1000 * a / b) / 10 : 0;
const mmss = t => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;

(async () => {
  const nM = +(arg('mirror') || 100), nV = +(arg('vs') || 40), jobs = +(arg('jobs') || 4), t0 = Date.now(), out = { mirror: {}, vs: {}, crashes: [] };
  const S = loadSim(1);
  const play = async (a, b, n, seed) => { try { return await runSet({ a, b, n, seed, jobs }); } catch (e) { out.crashes.push(`${a} vs ${b}: ${e.message}`); return null; } };
  for (const f of FAC) out.mirror[f] = await play(`${f}:default:random`, `${f}:default:random`, nM, 10000 + FAC.indexOf(f) * 1000);
  for (const a of FAC) for (const b of FAC) out.vs[`${a}-${b}`] = await play(`${a}:default:random`, `${b}:legacy:random`, nV, 20000 + FAC.indexOf(a) * 1000 + FAC.indexOf(b) * 100);
  const L = [];
  L.push('# Phase 4 validation (v2.38)', '', `Run with \`node audit/sim/validate.js --mirror=${nM} --vs=${nV}\`. Hard difficulty, random personalities, real SIM, seeded. A match still going at 20:00 is a draw. Sides alternate (A on the left in even matches, on the right in odd ones). ${((Date.now() - t0) / 60000).toFixed(0)} minutes on ${jobs} processes.`, '');
  L.push(`Crashes: **${out.crashes.length}**${out.crashes.length ? ' — ' + out.crashes.join('; ') : ''}.`, '');
  L.push('## Default vs Default (mirror)', '', '| Faction | Matches | Side A wins | Side B wins | Draws (20:00) | Ended | Average length | Left side wins |', '|---|---|---|---|---|---|---|---|');
  for (const f of FAC) { const r = out.mirror[f]; if (!r) continue; const s = r.summary, left = r.matches.filter(m => m.winner === 0).length;
    L.push(`| ${NAME[f]} | ${s.n} | ${s.wins.A} (${s.winRateA}%) | ${s.wins.B} (${s.winRateB}%) | ${s.wins.draw} (${s.draws}%) | ${s.n - s.timeouts} | ${mmss(s.avgLength)} | ${pct(left, s.n - s.wins.draw)}% of decided |`); }
  L.push('', '## Default vs Legacy', '', 'Rows: the Default side\'s faction; columns: the Legacy side\'s faction. Each cell: Default wins – Legacy wins – draws, and Default\'s share of the decided matches.', '');
  L.push(`| Default \\ Legacy | ${FAC.map(f => NAME[f]).join(' | ')} |`, `|---|${FAC.map(() => '---').join('|')}|`);
  let dw = 0, lw = 0, dr = 0;
  for (const a of FAC) L.push(`| ${NAME[a]} | ${FAC.map(b => { const r = out.vs[`${a}-${b}`]; if (!r) return 'crash'; const w = r.summary.wins; dw += w.A; lw += w.B; dr += w.draw; return `${w.A}–${w.B}–${w.draw} (${pct(w.A, w.A + w.B)}%)`; }).join(' | ')} |`);
  L.push('', `Overall: Default ${dw}, Legacy ${lw}, draws ${dr} (Default ${pct(dw, dw + lw)}% of decided matches).`, '');
  L.push('## Unit usage (Default, mirror matches)', '', `Share of Default sides (2 per mirror match, ${nM * 2} per faction) that trained each unit at least once; total trained in brackets. Flagged: under 5%.`, '');
  out.usage = {};
  for (const f of FAC) {
    const r = out.mirror[f]; if (!r) continue;
    const sides = r.matches.flatMap(m => [m.A, m.B]), units = Object.keys(S.UDEF).filter(t => (S.UDEF[t].fac || 'lastfist') === f && !S.UDEF[t].noTrain);
    L.push(`**${NAME[f]}**`, '', '| Unit | Sides that trained it | Trained | |', '|---|---|---|---|');
    for (const t of units) { const k = sides.filter(s => s.trained[t] > 0).length, tot = sides.reduce((a, s) => a + (s.trained[t] || 0), 0), p = pct(k, sides.length); out.usage[t] = p;
      L.push(`| ${S.UDEF[t].name} | ${p}% | ${tot} | ${p < 5 ? '**under 5%**' : ''} |`); }
    L.push('');
  }
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'out', 'validation.json'), JSON.stringify({ crashes: out.crashes, usage: out.usage, mirror: Object.fromEntries(FAC.map(f => [f, out.mirror[f] && out.mirror[f].summary])), vs: Object.fromEntries(Object.entries(out.vs).map(([k, v]) => [k, v && v.summary])) }, null, 1));
  fs.writeFileSync(path.join(__dirname, '..', 'validation.md'), L.join('\n') + '\n');
  console.log(L.join('\n'));
})().catch(e => { console.error(e); process.exit(1); });
