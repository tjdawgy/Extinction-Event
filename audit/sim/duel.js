#!/usr/bin/env node
// Controlled fights (Phase 5): two armies of given units meet in the open middle of the lane, no AI, no buildings in
// reach, both on Attack. Reports the winner and the value left. Armies are sized to equal value (credits + energy) or to
// equal supply. Each fight runs over several seeds (unit spread and shot timing vary).
//   node audit/sim/duel.js --a=rifle --b=skitterling [--value=1500 | --pop=24] [--n=10] [--tier=1]
// a/b may be a mix: rifle:3,heavy:1 (weights by value share).
const { loadSim } = require('../../tests/load-sim');
const { mulberry } = require('./load');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
function army(U, spec, value, pop) {
  const parts = spec.split(',').map(x => { const [t, w = 1] = x.split(':'); return [t, +w]; }), W = parts.reduce((a, p) => a + p[1], 0), out = [];
  for (const [t, w] of parts) { const d = U[t], per = value ? (d.cost.c + d.cost.e) : d.pop; const n = Math.max(1, Math.round((value || pop) * w / W / per)); for (let i = 0; i < n; i++) out.push(t); }
  return out;
}
function fight(aSpec, bSpec, { value, pop, seed, facA, facB, maxT = 120 }) {
  const sim = loadSim({ random: mulberry(seed) }), U = sim.UDEF;
  const g = sim.newGame('normal', { factions: [facA, facB] }); g.countdown = 0;
  for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 0; }
  for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); }
  const A = army(U, aSpec, value, pop), B = army(U, bSpec, value, pop), mk = [[], []];
  A.forEach((t, i) => mk[0].push(sim.spawnUnit(g, 0, t, 700 - (i % 6) * 14 - Math.random() * 8, -60 + (Math.floor(i / 6) % 8) * 17)));
  B.forEach((t, i) => mk[1].push(sim.spawnUnit(g, 1, t, 1000 + (i % 6) * 14 + Math.random() * 8, -60 + (Math.floor(i / 6) % 8) * 17)));
  sim.setStance(g, 0, 'attack'); sim.setStance(g, 1, 'attack');
  const val = s => mk[s].filter(e => e.hp > 0 && !e.dead).reduce((a, e) => a + U[e.type].cost.c + U[e.type].cost.e, 0);
  const v0 = [val(0), val(1)];
  for (let i = 0; i < maxT * 30; i++) {
    sim.update(g, 1 / 30);
    if (i % 15 === 0 && (!val(0) || !val(1))) break;
    // keep the fight in the open: nobody walks into a base
  }
  return { v0, v: [val(0), val(1)], n: [A.length, B.length] };
}
module.exports = { fight };
if (require.main === module) {
  const a = arg('a'), b = arg('b'), n = +(arg('n') || 10), value = arg('pop') ? 0 : +(arg('value') || 1500), pop = +(arg('pop') || 0);
  const facOf = sp => { const sim = loadSim(); const t = sp.split(',')[0].split(':')[0]; return sim.UDEF[t].fac || 'lastfist'; };
  const fa = facOf(a), fb = facOf(b); let wa = 0, wb = 0, la = 0, lb = 0, nn;
  for (let i = 0; i < n; i++) { const r = fight(a, b, { value, pop, seed: 100 + i, facA: fa, facB: fb }); nn = r.n; if (r.v[0] > r.v[1]) wa++; else if (r.v[1] > r.v[0]) wb++; la += r.v[0] / r.v0[0]; lb += r.v[1] / r.v0[1]; }
  console.log(`${a} (${nn[0]}) vs ${b} (${nn[1]}) at ${value ? 'value ' + value : 'supply ' + pop}: ${wa}-${wb}, value kept ${Math.round(100 * la / n)}% vs ${Math.round(100 * lb / n)}%`);
}
