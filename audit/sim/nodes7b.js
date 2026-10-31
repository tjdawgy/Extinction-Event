#!/usr/bin/env node
// Phase 7b: node control against the result, from a stratrun JSON (out/strat-<set>-<tag>.json): for each match, the nodes
// each side held at a mark (4 and 6 minutes, matches still running), and the win rate by nodes held; then the same by the
// difference in node-seconds over the match.  node audit/sim/nodes7b.js field-fin
const fs = require('fs'), path = require('path');
const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', `strat-${process.argv[2] || 'field-fin'}.json`)));
for (const mark of [240, 360]) {
  const by = {};
  for (const r of d.res) { if (r.winner < 0) continue; const x = r.samples.find(q => q.t >= mark); if (!x || r.t < mark + 30) continue;
    for (const s of [0, 1]) { const n = x.nodes.filter(o => o === s).length, k = by[n] = by[n] || [0, 0]; k[r.winner === s ? 0 : 1]++; } }
  console.log(`nodes held at ${mark / 60}:00 → wins-losses: ` + Object.keys(by).sort().map(n => `${n}: ${by[n][0]}-${by[n][1]} (${Math.round(100 * by[n][0] / (by[n][0] + by[n][1]))}%)`).join(', '));
}
const lead = {};
for (const r of d.res) { if (r.winner < 0) continue; const a = r.sides[0].nodeTime, b = r.sides[1].nodeTime, k = Math.abs(a - b) < 60 ? 'even (<60 s)' : (a > b) === (r.winner === 0) ? 'more node time won' : 'less node time won'; lead[k] = (lead[k] || 0) + 1; }
console.log('node-seconds over the match:', JSON.stringify(lead));
