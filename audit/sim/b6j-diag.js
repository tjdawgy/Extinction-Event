// v3.00 (batch 6j, Part B/C): per faction and personality, from a persona-balanced self-play run (audit/sim/selfplay-6c.js):
// results, build (Tech Lab, Turrets, Refineries), tier times, first attack, attacks, army and income over time, upgrade spend,
// units trained, signature buildings. node audit/sim/b6j-diag.js <run dir> [faction]
const fs = require('fs'), path = require('path');
const dir = process.argv[2], only = process.argv[3];
const ms = fs.readFileSync(path.join(dir, 'matches.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
const med = a => { const b = a.filter(x => x != null).sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : null; };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const G = {};
for (const m of ms) m.sides.forEach((s, i) => {
  if (only && s.fac !== only) return;
  const k = s.fac + ' ' + s.persona, R = G[k] || (G[k] = { n: 0, w: 0, l: 0, d: 0, tl: 0, tlT2: 0, t3: 0, tur: [], ref: [], fa: [], att: [], a6: [], a9: [], a12: [], c3: [], c6: [], c9: [], up: [], un: {}, sig: 0, len: [], t2: [], wonLen: [], lostLen: [] });
  R.n++; const won = m.winner === i, lost = m.winner === 1 - i; if (won) R.w++; else if (lost) R.l++; else R.d++;
  const b = s.ser.bBuilt || {}; if (b.techlab) R.tl++; R.tur.push(b.turret || 0); R.ref.push(b.refinery || 0); if (b.sigA || b.sigB) R.sig++;
  if ((s.paths || []).some(p => p.type === 'techlab')) R.tlT2++;
  if (s.tier3 != null) R.t3++; R.t2.push(s.tier2); R.fa.push(s.ser.firstAttack); R.att.push(s.ser.attacks);
  const A = s.ser.army10 || [], C = s.ser.c10 || []; R.a6.push(A[36]); R.a9.push(A[54]); R.a12.push(A[72]); R.c3.push(C[18]); R.c6.push(C[36]); R.c9.push(C[54]);
  R.up.push(s.spentUp ? s.spentUp[0] + s.spentUp[1] : 0); R.len.push(m.t); (won ? R.wonLen : lost ? R.lostLen : []).push(m.t);
  for (const [t, n] of Object.entries(s.trained || {})) R.un[t] = (R.un[t] || 0) + n;
});
const f = x => x == null ? '-' : Math.round(x);
console.log('faction persona | W-L-D win% | TechLab built / TL path / tier3 | turrets refineries | first attack, attacks | army 6/9/12 min | credits/10s 3/6/9 | upgrades spent | sig | top units per side');
for (const [k, R] of Object.entries(G).sort()) {
  const top = Object.entries(R.un).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([t, n]) => `${t} ${(n / R.n).toFixed(1)}`).join(', ');
  console.log(`${k} | ${R.w}-${R.l}-${R.d} ${f(100 * R.w / R.n)}% | ${R.tl}/${R.n} ${R.tlT2} ${R.t3} | ${mean(R.tur).toFixed(1)} ${mean(R.ref).toFixed(1)} | ${f(med(R.fa))} s, ${mean(R.att).toFixed(1)} | ${f(med(R.a6))} ${f(med(R.a9))} ${f(med(R.a12))} | ${f(med(R.c3))} ${f(med(R.c6))} ${f(med(R.c9))} | ${f(mean(R.up))} | ${R.sig} | ${top}`);
}
