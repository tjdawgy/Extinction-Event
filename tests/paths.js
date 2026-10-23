// Forced-path matrix (upgrade trees): for each personality, AI vs AI with the same personality and difficulty, one side
// forced onto path A and the other onto path B for a building (sides swapped halfway). Reports wins per path and each
// unit's share of units trained (by count and by value). Targets: no path above about 60% wins, no unit above about 30%.
//   node tests/paths.js [matches=40] [building=barracks] [difficulty=hard] [personas...]
const { loadSim } = require('./load-sim');
const sim = loadSim();
const n = +(process.argv[2] || 40), bt = process.argv[3] || 'barracks', diff = process.argv[4] || 'hard';
const kinds = process.argv.slice(5).length ? process.argv.slice(5) : ['aggressor', 'turtle', 'economist', 'trickster'];
const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const share = (o, val) => { const tot = Object.keys(o).reduce((a, k) => a + o[k] * val(k), 0) || 1; return Object.keys(o).sort((a, b) => o[b] * val(b) - o[a] * val(a)).map(k => `${k} ${(100 * o[k] * val(k) / tot).toFixed(0)}%`).join(' '); };
const all = { A: {}, B: {} };
for (const kind of kinds) {
  const w = { A: 0, B: 0, draw: 0 }, units = { A: {}, B: {} };
  let to = 0, longest = 0;
  for (let m = 0; m < n; m++) {
    const aSide = m < n / 2 ? 0 : 1, fp = [{}, {}]; fp[aSide][bt] = 'A'; fp[1 - aSide][bt] = 'B';
    const g = sim.newGame(diff, { autoPlayer: true, autoDiff: diff, persona: kind, autoPersona: kind, forcePath: fp });
    for (let i = 0; i < 30 * 1800 && !g.over; i++) sim.update(g, 1 / 30);
    if (!g.over) to++;
    longest = Math.max(longest, g.t);
    if (g.winner === aSide) w.A++; else if (g.winner === 1 - aSide) w.B++; else w.draw++;
    for (const s of [0, 1]) { const p = s === aSide ? 'A' : 'B'; for (const [k, v] of Object.entries(g.log.tot[s].trained)) { units[p][k] = (units[p][k] || 0) + v; all[p][k] = (all[p][k] || 0) + v; } }
  }
  const T = sim.TREES[bt];
  console.log(`${kind.padEnd(10)} ${diff}: ${T.A.name} ${w.A} - ${w.B} ${T.B.name}${w.draw ? ` (draws ${w.draw})` : ''}  timeouts ${to} longest ${fmt(longest)}`);
  for (const p of ['A', 'B']) console.log(`   ${p} units by count: ${share(units[p], () => 1)}`);
}
const val = k => sim.UDEF[k].cost.c + sim.UDEF[k].cost.e;
for (const p of ['A', 'B']) console.log(`ALL ${p}: by count ${share(all[p], () => 1)} | by value ${share(all[p], val)}`);
