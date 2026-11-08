#!/usr/bin/env node
// v2.67: side and faction win shares from a ladder.js --json file (any map). In ladder.js match i gives side A the
// faction F[i % 3] and side B F[floor(i / 3) % 3], and A plays on the left (side 0) on even matches.
//   node audit/sim/shares.js out.json [set]      (set: e.g. hard-hard; default every set in the file)
// Prints, per set: wins by spawn side (left / right / draws) and each faction's share ((wins + draws/2) / games) over
// its cross-faction matches (mirrors left out), with the mirror results apart.
const fs = require('fs');
const F = ['lastfist', 'bloomhost', 'axiarchs'];
const [file, only] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const [set, row] of Object.entries(data)) {
  if (only && set !== only) continue;
  const side = [0, 0, 0], fac = {}, mir = {};
  row.matches.forEach((m, i) => {
    const aLeft = i % 2 === 0, fa = F[i % 3], fb = F[Math.floor(i / 3) % 3];
    if (m.r === 0) side[2]++; else if ((m.r > 0) === aLeft) side[0]++; else side[1]++;
    const add = (f, w) => { const o = fac[f] || (fac[f] = { w: 0, d: 0, l: 0 }); o[w]++; };
    if (fa === fb) { const o = mir[fa] || (mir[fa] = { a: 0, b: 0, d: 0 }); o[m.r > 0 ? 'a' : m.r < 0 ? 'b' : 'd']++; return; }
    if (m.r > 0) { add(fa, 'w'); add(fb, 'l'); } else if (m.r < 0) { add(fa, 'l'); add(fb, 'w'); } else { add(fa, 'd'); add(fb, 'd'); }
  });
  const n = row.matches.length, pct = x => (100 * x).toFixed(1) + '%';
  console.log(`${set} (${n} matches): left ${side[0]}, right ${side[1]}, draws ${side[2]}; left share of decided ${pct(side[0] / Math.max(1, side[0] + side[1]))}`);
  for (const f of F) if (fac[f]) { const o = fac[f], g = o.w + o.d + o.l; console.log(`  ${f}: ${o.w}–${o.l}–${o.d} cross-faction, share ${pct((o.w + o.d / 2) / g)}`); }
  for (const f of F) if (mir[f]) console.log(`  ${f} mirror (A–B–draw): ${mir[f].a}–${mir[f].b}–${mir[f].d}`);
}
