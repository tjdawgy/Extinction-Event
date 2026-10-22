// Difficulty decision: the same bots and AI-vs-AI runs with the AI's income/start bonuses as they are now
// ("current") and with them removed ("no-bonus": every difficulty earns ×1 and starts with 300/60).
// The override is applied to the SIM loaded in this test only; the game is unchanged.
//   node tests/difficulty-options.js [matches=20] [current|no-bonus] [players=calibrated,turtle,ai]
const { loadSim } = require('./load-sim');
const { playMatch, STEP } = require('./bots');
const { CALIBRATED } = require('./rush-variants-list');
const n = +(process.argv[2] || 20), mode = process.argv[3] || 'current';
const players = (process.argv[4] || 'calibrated,turtle,ai').split(',');
const sim = loadSim();
if (mode === 'no-bonus') for (const k in sim.DIFF) { sim.DIFF[k].inc = 1; sim.DIFF[k].bonus = 0; }
const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
console.log(`mode: ${mode}  (${Object.entries(sim.DIFF).map(([k, d]) => `${k} income x${d.inc} start +${d.bonus}`).join(', ')}), ${n} matches each`);
for (const p of players) for (const diff of ['easy', 'normal', 'hard']) {
  let w = 0, l = 0, to = 0, longest = 0;
  for (let i = 0; i < n; i++) {
    let r;
    if (p === 'ai') { const g = sim.newGame(diff, { autoPlayer: true }); while (!g.over && g.t < 1800) sim.update(g, STEP); r = { winner: g.over ? g.winner : -1, t: g.t }; }
    else r = playMatch(sim, diff, p === 'calibrated' ? 'rushx' : p, { botOpts: p === 'calibrated' ? CALIBRATED : undefined });
    if (r.winner === 0) w++; else if (r.winner === 1) l++; else to++;
    longest = Math.max(longest, r.t);
  }
  console.log(`${mode.padEnd(9)} ${p.padEnd(11)} ${diff.padEnd(7)} side-0 wins ${String(w).padStart(2)}  AI wins ${String(l).padStart(2)}  timeouts ${to}  longest ${fmt(longest)}`);
}
