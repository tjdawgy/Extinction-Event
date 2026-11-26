// Batch 6h (v2.98): the Bloomhost swarm and new-unit tables for a self-play run (audit/sim/selfplay-6c.js with EE_B6H=1, the
// batch 6h counters in each match's b6h record). Per Bloomhost side: peak Bloomhost units alive (sampled every tick by update6h),
// the share of Bloomhost damage dealt by melee units, Mites spawned (the Brood Mound, the Queen, pustules), damage the Wardens'
// auras took off, Pounces, Leaper landing stuns, Broodback bursts, Tunnel trips, production rallied to a Ruinmaw, eruptions,
// swallows; the new units trained per match, by personality; openers by personality; units trained per type (every faction).
//   node audit/sim/b6h-report.js <dir> [--out file]
const fs = require('fs'), path = require('path');
const dir = process.argv[2], oi = process.argv.indexOf('--out');
const M = fs.readFileSync(path.join(dir, 'matches.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
const out = [], say = s => out.push(s), avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0, f1 = x => x.toFixed(1);
const B = [];
for (const m of M) m.sides.forEach((sd, i) => { if (sd.fac === 'bloomhost') B.push({ m, sd, i, h: ((m.b6h || [])[i] || {}).h6 || {}, d: ((m.b6h || [])[i] || {}).dmg || { melee: 0, other: 0 } }); });
say(`## Batch 6h swarm metrics: ${path.basename(dir)} (${M.length} matches, ${B.length} Bloomhost sides)`, '');
const k = (f) => f1(avg(B.map(f)));
say('| metric (per Bloomhost side and match) | mean |', '|---|---|');
say(`| peak Bloomhost units alive | ${k(b => b.h.peak || 0)} |`);
const mel = B.reduce((a, b) => a + b.d.melee, 0), oth = B.reduce((a, b) => a + b.d.other, 0);
say(`| share of Bloomhost unit damage dealt by melee units | ${(100 * mel / Math.max(1, mel + oth)).toFixed(1)}% |`);
for (const [nm, f] of [['Mites spawned (all sources)', b => b.h.mites || 0], ['of them by Queens', b => b.h.qMites || 0], ['damage prevented by Chitin Warden auras', b => b.h.ward || 0], ['Pounces', b => b.h.pounce || 0], ['enemy units stunned by Leaper landings', b => b.h.stun || 0], ['Skitterlings from Broodback bursts', b => b.h.burst || 0], ['Bile Blooms', b => b.h.blooms || 0], ['Tunnel trips (units)', b => b.h.tunnel || 0], ['units rallied to a Ruinmaw', b => b.h.rallyU || 0], ['Ruinmaw eruptions', b => b.h.erupt || 0], ['units swallowed', b => b.h.swallow || 0], ['Queens pulled back when focused', b => b.h.qBack || 0]]) say(`| ${nm} | ${k(f)} |`);
say('', '### New and reworked Bloomhost units trained per match, by personality', '');
const T = ['skitterling', 'spitter', 'queen', 'leaper', 'ravager', 'bilecaster', 'bulwark', 'broodback', 'gorebore', 'ruinmaw', 'dreadthorn'];
say('| personality | sides | ' + T.join(' | ') + ' | matches with a Tunnel |', '|' + ['---', '---', ...T, '---'].map(() => '---').join('|') + '|');
for (const p of ['boomer', 'economist', 'turtle', 'all']) {
  const S = B.filter(b => p === 'all' || b.sd.persona === p);
  say(`| ${p} | ${S.length} | ${T.map(t => f1(avg(S.map(b => (b.sd.trained || {})[t] || 0)))).join(' | ')} | ${S.filter(b => (b.h.tunnel || 0) > 0).length} |`);
}
say('', '### Openers by personality (first 5:00)', '', '| personality | swarm | spit | mixed | win rate when spit |', '|---|---|---|---|---|');
for (const p of ['boomer', 'economist', 'turtle']) {
  const S = B.filter(b => b.sd.persona === p), c = o => S.filter(b => b.h.open === o).length, sp = S.filter(b => b.h.open === 'spit');
  say(`| ${p} | ${c('swarm')} | ${c('spit')} | ${c('mixed')} | ${sp.length ? Math.round(100 * sp.filter(b => b.m.winner === b.i).length / sp.length) + '%' : '-'} |`);
}
say('', '### Units trained per type (all factions, per side and match)', '');
const all = {}, n = {}; for (const m of M) for (const sd of m.sides) { n[sd.fac] = (n[sd.fac] || 0) + 1; for (const [t, c] of Object.entries(sd.trained || {})) all[sd.fac + ':' + t] = (all[sd.fac + ':' + t] || 0) + c; }
say('| faction | unit | per side and match |', '|---|---|---|');
for (const key of Object.keys(all).sort()) { const [fa, t] = key.split(':'); say(`| ${fa} | ${t} | ${f1(all[key] / n[fa])} |`); }
if (oi > 0) fs.writeFileSync(process.argv[oi + 1], out.join('\n') + '\n');
console.log(out.join('\n'));
