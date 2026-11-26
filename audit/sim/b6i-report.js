// Batch 6i (v2.99): the Bloomhost air tables for a self-play run (audit/sim/selfplay-6c.js with EE_B6H=1; the batch 6i counters
// side.i6 and side.r6i in each side's record, audit/sim/audit6a.js). Per Bloomhost side: the air units trained by personality,
// how often a side reached the Blightwing and the Skywyrm (trained one) and when, the Bloomspire's tier and path, Snatches, meals,
// drops, Rends, tendril drags, jaws bites, spew landings, Gnatcloud damage, Blight hits and the Mites born from Blight, Razorwing
// raids; the 6h swarm metrics; Chitin Wardens trained; under-fire charges (b6iresp) per side, every faction.
//   node audit/sim/b6i-report.js <dir> [--out file]
const fs = require('fs'), path = require('path');
const dir = process.argv[2], oi = process.argv.indexOf('--out');
const M = fs.readFileSync(path.join(dir, 'matches.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
const out = [], say = (...a) => out.push(...a), avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0, f1 = x => x.toFixed(1);
const mmss = s => s == null ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const med = a => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
const B = [];
for (const m of M) m.sides.forEach((sd, i) => { if (sd.fac === 'bloomhost') B.push({ m, sd, i, h: ((m.b6h || [])[i] || {}).h6 || {}, d: ((m.b6h || [])[i] || {}).dmg || { melee: 0, other: 0 }, x: sd.i6 || {} }); });
say(`## Batch 6i Bloomhost air: ${path.basename(dir)} (${M.length} matches, ${B.length} Bloomhost sides)`, '');
const T = ['razor6', 'gnatcloud', 'blightwing', 'talonmaw', 'skywyrm', 'bulwark'];
say('### Air units trained per Bloomhost side and match (Razorwings: birds, three a flock), by personality', '', '| personality | sides | ' + T.join(' | ') + ' |', '|' + ['---', '---', ...T].map(() => '---').join('|') + '|');
for (const p of ['boomer', 'economist', 'turtle', 'all']) { const S = B.filter(b => p === 'all' || b.sd.persona === p); say(`| ${p} | ${S.length} | ${T.map(t => f1(avg(S.map(b => (b.sd.trained || {})[t] || 0)))).join(' | ')} |`); }
say('', '### Tier-3 air: Bloomhost sides that trained a Blightwing or a Skywyrm', '', '| personality | sides | any T3 aircraft | Blightwing | Skywyrm | either | median first T3 aircraft | path Swarm / Apex |', '|---|---|---|---|---|---|---|---|');
for (const p of ['boomer', 'economist', 'turtle', 'all']) {
  const S = B.filter(b => p === 'all' || b.sd.persona === p), has = t => S.filter(b => (b.sd.trained || {})[t]).length;
  const sp = S.map(b => (b.sd.paths || []).find(x => x.type === 'techlab')).filter(Boolean);
  const lab3 = S.filter(b => (b.sd.trained || {}).blightwing || (b.sd.trained || {}).skywyrm).length;
  say(`| ${p} | ${S.length} | ${S.filter(b => b.sd.t3air != null).length} | ${has('blightwing')} | ${has('skywyrm')} | ${lab3} (${Math.round(100 * lab3 / Math.max(1, S.length))}%) | ${mmss(med(S.map(b => b.sd.t3air).filter(v => v != null)))} | ${sp.filter(x => x.path === 'A').length} / ${sp.filter(x => x.path === 'B').length} |`);
}
say('', 'Every faction, sides that trained a tier-3 aircraft (any): ' + ['lastfist', 'bloomhost', 'axiarchs'].map(f => { const S = M.flatMap(m => m.sides).filter(s => s.fac === f); return `${f} ${S.filter(s => s.t3air != null).length} of ${S.length}`; }).join(', ') + '.');
say('', '### Air mechanics (per Bloomhost side and match)', '', '| metric | mean |', '|---|---|');
for (const [nm, f] of [['Gnatcloud damage dealt', b => b.x.gnat || 0], ['units blighted (cone hits)', b => b.x.blight || 0], ['Mites born from Blight', b => b.x.bMites || 0], ['Snatches', b => b.x.snatch || 0], ['snatched units eaten', b => b.x.eaten || 0], ['snatched units dropped', b => b.x.drops || 0], ['Rends', b => b.x.rend || 0], ['tendril drags', b => b.x.tendril || 0], ['jaws bites', b => b.x.jaws || 0], ['acid spews landed', b => b.x.spewB || 0], ['Razorwing raids', b => b.x.raids || 0]]) say(`| ${nm} | ${f1(avg(B.map(f)))} |`);
say('', '### The 6h swarm metrics (per Bloomhost side and match)', '', '| metric | mean |', '|---|---|');
say(`| peak Bloomhost units alive | ${f1(avg(B.map(b => b.h.peak || 0)))} |`);
const mel = B.reduce((a, b) => a + b.d.melee, 0), oth = B.reduce((a, b) => a + b.d.other, 0);
say(`| share of Bloomhost unit damage dealt by melee units | ${(100 * mel / Math.max(1, mel + oth)).toFixed(1)}% |`);
for (const [nm, f] of [['Mites spawned (all sources)', b => b.h.mites || 0], ['of them by Queens', b => b.h.qMites || 0], ['of them by Blight', b => b.x.bMites || 0], ['damage prevented by Chitin Warden auras', b => b.h.ward || 0], ['Pounces', b => b.h.pounce || 0], ['Tunnel trips (units)', b => b.h.tunnel || 0]]) say(`| ${nm} | ${f1(avg(B.map(f)))} |`);
say('', '### Under-fire charges (b6iresp) per side and match', '', '| faction | charges |', '|---|---|');
for (const f of ['lastfist', 'bloomhost', 'axiarchs']) { const S = M.flatMap(m => m.sides).filter(s => s.fac === f); say(`| ${f} | ${f1(avg(S.map(s => (s.r6i || {}).charge || 0)))} |`); }
say('', '### Units trained per type (all factions, per side and match)', '');
const all = {}, n = {}; for (const m of M) for (const sd of m.sides) { n[sd.fac] = (n[sd.fac] || 0) + 1; for (const [t, c] of Object.entries(sd.trained || {})) all[sd.fac + ':' + t] = (all[sd.fac + ':' + t] || 0) + c; }
say('| faction | unit | per side and match |', '|---|---|---|');
for (const key of Object.keys(all).sort()) { const [fa, t] = key.split(':'); say(`| ${fa} | ${t} | ${f1(all[key] / n[fa])} |`); }
if (oi > 0) fs.writeFileSync(process.argv[oi + 1], out.join('\n') + '\n');
console.log(out.join('\n'));
