#!/usr/bin/env node
// Phase 7b: analysis of a diag7b run (out/diag7b-<tag>.json): per faction in cross-faction Greedy games, the economy and
// army curves, the value each weapon killed against the value of that unit type lost, and how the matches ended.
const fs = require('fs'), path = require('path');
const tag = process.argv[2] || 'base', ms = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', `diag7b-${tag}.json`)));
const { loadSim } = require('./load'); const S = loadSim(1); const U = S.UDEF;
const W2U = {}; for (const t in U) if (U[t].weapon && !W2U[U[t].weapon]) W2U[U[t].weapon] = t;
const byF = {};
for (const m of ms) for (let s = 0; s < 2; s++) {
  const me = m.sides[s], op = m.sides[1 - s], F = me.faction + ' vs ' + op.faction, o = byF[F] = byF[F] || { n: 0, w: 0, t: [], earned: {}, army: {}, killW: {}, lostT: {}, trained: {}, salv: 0, nodes: 0 };
  o.n++; if (m.winner === s) o.w++; o.t.push(m.t); o.salv += me.salvage; o.nodes += me.nodeTime;
  for (const x of m.samples) { if (x.t % 60) continue; (o.earned[x.t] = o.earned[x.t] || []).push(x.earned[s]); (o.army[x.t] = o.army[x.t] || []).push(x.army[s]); }
  for (const w in me.diag.kills) o.killW[w] = (o.killW[w] || 0) + me.diag.kills[w].reduce((a, b) => a + b, 0);
  for (const t in me.lost) o.lostT[t] = (o.lostT[t] || 0) + me.lost[t] * (U[t].cost.c + U[t].cost.e);
  for (const t in me.trained) o.trained[t] = (o.trained[t] || 0) + me.trained[t] * (U[t].cost.c + U[t].cost.e);
}
const avg = a => a && a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : '-';
for (const F in byF) {
  const o = byF[F];
  console.log(`\n== ${F}: won ${o.w}/${o.n}, median end ${Math.round(o.t.sort((a, b) => a - b)[o.n >> 1])} s, Salvage ${Math.round(o.salv / o.n)}/match, node-seconds ${Math.round(o.nodes / o.n)}`);
  console.log('  earned  ' + [60, 120, 180, 240, 300, 360].map(t => `${t / 60}m ${avg(o.earned[t])}`).join('  '));
  console.log('  army    ' + [60, 120, 180, 240, 300, 360].map(t => `${t / 60}m ${avg(o.army[t])}`).join('  '));
  const rows = Object.keys(Object.assign({}, o.trained)).map(t => { const w = U[t].weapon, k = o.killW[w] || 0; return [t, Math.round(o.trained[t] / o.n), Math.round((o.lostT[t] || 0) / o.n), Math.round(k / o.n), ((k + 1) / ((o.lostT[t] || 0) + 1)).toFixed(2)]; });
  console.log('  unit: value trained / lost / killed per match, killed÷lost');
  for (const r of rows.sort((a, b) => b[1] - a[1])) console.log(`    ${r[0].padEnd(12)} ${String(r[1]).padStart(5)} ${String(r[2]).padStart(5)} ${String(r[3]).padStart(5)}  ${r[4]}`);
  const other = Object.entries(o.killW).filter(([w]) => !Object.keys(o.trained).some(t => U[t].weapon === w)).map(([w, k]) => `${w} ${Math.round(k / o.n)}`);
  console.log('  other kills/match: ' + other.join(', '));
}
