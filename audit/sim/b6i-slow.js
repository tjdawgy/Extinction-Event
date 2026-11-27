// Batch 6i (v2.99): measures tests/slow/switches-on-6c.test.js's Two-Lane checks ("a watchtower was taken" in every match, "most decided by an HQ falling") over 20
// matches (seeds 520-539, the test's pairing rotation), every switch on against b6i and b6iresp off.
//   node audit/sim/b6i-slow.js [--from 0] [--to 20] [--off]   (one line of JSON per match)
const { loadSim } = require('../../tests/load-sim');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const from = +arg('from', '0'), to = +arg('to', '20'), off = process.argv.includes('--off');
const F = ['lastfist', 'bloomhost', 'axiarchs'];
for (let m = from; m < to; m++) {
  const sim = loadSim(); if (off) { sim.REWORK.b6i = false; sim.REWORK.b6iresp = false; }
  const k = m % 6, fac = [F[k % 3], F[(k + 1 + (k >> 2)) % 3]];
  const g = sim.newGame('hard', { map: 'twolane', seed: 520 + m, autoPlayer: true, autoDiff: 'hard', factions: k % 2 ? fac.reverse() : fac }); g.countdown = 0;
  const towers = new Set();
  for (let i = 0; i < 60 * (sim.EXT.limit + 5) && !g.over; i++) { sim.update(g, sim.TICK); g.events.length = 0; if (i % 300 === 0) for (const n of g.nodes) if (n.type === 'watchtower' && n.owner !== null) towers.add(n.owner); }
  console.log(JSON.stringify({ m, seed: 520 + m, off, f: g.sides.map(s => s.faction), t: Math.round(g.t), over: g.over, winner: g.winner, how: g.result ? g.result.how : null, hq: !!(g.winner >= 0 && g.result && g.result.how === 'hq'), tower: towers.size > 0 }));
}
