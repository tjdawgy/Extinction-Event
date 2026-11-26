// Batch 6g (v2.97): the before/after tables from audit/sim/audit6a.js runs made with the batch 6g counters (EE_B6G).
//   node audit/sim/b6g-report.js <before matches.jsonl> <after matches.jsonl> [title]
// Prints Markdown: Axiarch warp-ins (dying within 15 s, arriving within 150 of an enemy or in a weapon's reach) per map, side
// kind (AI or the scripted player) and source (base or forward Gate); node play per faction (forward-pad buildings, captures,
// retakes, enemy pad buildings destroyed, how long fortified and unfortified holds lasted, nodes held at 6/10/14 min); base
// attacks standing past the enemy HQ (6f's edge counters); results.
const fs = require('fs');
const [A, B, title] = process.argv.slice(2);
const read = f => fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const runs = [['before', read(A)], ['after', read(B)]];
const pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '-';
const out = [`# ${title || 'Batch 6g before / after'}`, '', `before: ${A} (${runs[0][1].length} matches); after: ${B} (${runs[1][1].length} matches)`, ''];
out.push('## Axiarch warp-ins', '', '| run | map | who | warp-ins | died within 15 s | within 150 of an enemy | in an enemy weapon\'s reach | from a forward Gate (died) |', '|---|---|---|---|---|---|---|---|');
for (const [nm, L] of runs) for (const map of ['classic', 'twolane', 'threelane', 'all']) for (const who of ['AI', 'player']) {
  const o = { w: 0, d: 0, n: 0, r: 0, f: 0, fd: 0, k: 0 };
  for (const m of L) { if (map !== 'all' && m.map !== map) continue; m.sides.forEach((sd, s) => { if (sd.fac !== 'axiarchs') return; const isP = m.b6gP !== undefined && +m.b6gP === s; if ((who === 'player') !== isP) return; const b = m.b6g[s]; o.k++; o.w += b.warps; o.d += b.warpD15; o.n += b.warpNear150; o.r += b.warpInR; o.f += b.warpFwd; o.fd += b.warpFwdD15; }); }
  if (o.k) out.push(`| ${nm} | ${map} | ${who} (${o.k} sides) | ${o.w} | ${o.d} (${pct(o.d, o.w)}) | ${pct(o.n, o.w)} | ${pct(o.r, o.w)} | ${o.f} (${o.fd}) |`);
}
out.push('', '## Node play per faction (per side and match)', '', '| run | faction | sides | pad buildings built | of them turrets | captures | retakes | enemy pad buildings destroyed | fortified holds: n, mean s | unfortified holds: n, mean s | nodes held at 6 / 10 / 14 min |', '|---|---|---|---|---|---|---|---|---|---|---|');
for (const [nm, L] of runs) for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) {
  const o = { k: 0, fp: 0, tu: 0, c: 0, r: 0, kd: 0, sf: 0, hf: 0, su: 0, hu: 0, ctl: [[], [], []] };
  for (const m of L) m.sides.forEach((sd, s) => { if (sd.fac !== fac || m.map === 'classic') return; const b = m.b6g[s]; o.k++; o.fp += b.fpBuilt; o.tu += (b.fpTypes.turret || 0); o.c += b.caps; o.r += b.retakes; o.kd += b.fpKilled; o.sf += b.spellsF; o.hf += b.holdF; o.su += b.spellsU; o.hu += b.holdU; [6, 10, 14].forEach((mi, i) => { if (b.ctl[mi] != null) o.ctl[i].push(b.ctl[mi]); }); });
  if (!o.k) continue;
  const f = x => (x / o.k).toFixed(2), mean = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-';
  out.push(`| ${nm} | ${fac} | ${o.k} | ${f(o.fp)} | ${f(o.tu)} | ${f(o.c)} | ${f(o.r)} | ${f(o.kd)} | ${o.sf}, ${o.sf ? Math.round(o.hf / o.sf) : '-'} | ${o.su}, ${o.su ? Math.round(o.hu / o.su) : '-'} | ${o.ctl.map(mean).join(' / ')} |`);
}
out.push('', '(lane maps only: Classic has no forward pad; Last Fist node bunkers are left out of "pad buildings")', '');
const grp = L => { const o = { n: 0, won: 0, guns: 0, v: 0, gv: 0 }; for (const m of L) m.sides.forEach((sd, s) => { if (sd.fac !== 'bloomhost') return; for (const x of m.b6g[s].grp || []) { if (!x.guns) continue; o.n++; o.won += x.won ? 1 : 0; o.v += x.v; o.gv += x.gunHp; } }); return o; };
out.push('## Bloomhost groups sent at a node an enemy gun covers', '', '| run | groups | node taken | mean group value | mean gun health there |', '|---|---|---|---|---|');
for (const [nm, L] of runs) { const o = grp(L); out.push(`| ${nm} | ${o.n} | ${o.won} (${pct(o.won, o.n)}) | ${o.n ? Math.round(o.v / o.n) : '-'} | ${o.n ? Math.round(o.gv / o.n) : '-'} |`); }
out.push('', '## Base attacks standing past the enemy HQ (6f\'s counters: half the ground army over 100 beyond it, 20 s or more)', '', '| run | sides with an edge stand | seconds | of them with nothing in sight |', '|---|---|---|---|');
for (const [nm, L] of runs) { let n = 0, t = 0, idle = 0; for (const m of L) for (const sd of m.sides) { const z = sd.ser || {}; if ((z.edge || 0) >= 20) { n++; t += z.edge; idle += z.edgeIdle || 0; } } out.push(`| ${nm} | ${n} | ${t} | ${idle} |`); }
out.push('', '## Results', '', '| run | faction | won-lost-drawn |', '|---|---|---|');
for (const [nm, L] of runs) for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) { let w = 0, l = 0, d = 0; for (const m of L) m.sides.forEach((sd, s) => { if (sd.fac !== fac) return; if (m.winner == null || m.winner < 0) d++; else if (m.winner === s) w++; else l++; }); if (w + l + d) out.push(`| ${nm} | ${fac} | ${w}-${l}-${d} |`); }
console.log(out.join('\n'));
