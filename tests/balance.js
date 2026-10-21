// Balance runner: win counts over N matches, with timeouts and the longest match (30-minute cap).
//   node tests/balance.js [matches=20] [players=ai,rush,turtle] [diffs=easy,normal,hard]
// "ai" is AI vs AI: side 0 is the auto-player (Normal brain, no bonus), side 1 the AI at that difficulty.
const { loadSim } = require('./load-sim');
const { playMatch, STEP } = require('./bots');

const sim = loadSim();
const n = +(process.argv[2] || 20);
const players = (process.argv[3] || 'ai,rush,turtle').split(',');
const diffs = (process.argv[4] || 'easy,normal,hard').split(',');
const MAX_T = 1800;
const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

function aiMatch(diff) {
  const g = sim.newGame(diff, { autoPlayer: true });
  while (!g.over && g.t < MAX_T) sim.update(g, STEP);
  return { winner: g.over ? g.winner : -1, t: g.t };
}

console.log(`${n} matches each, ${MAX_T / 60}-minute cap\n`);
console.log('player  difficulty  side-0 wins  AI wins  timeouts  median  longest');
for (const p of players) for (const diff of diffs) {
  let w = 0, l = 0, to = 0; const len = [];
  for (let i = 0; i < n; i++) {
    const r = p === 'ai' ? aiMatch(diff) : playMatch(sim, diff, p, { maxT: MAX_T });
    if (r.winner === 0) w++; else if (r.winner === 1) l++; else to++;
    len.push(r.t);
  }
  len.sort((a, b) => a - b);
  console.log(`${p.padEnd(8)}${diff.padEnd(12)}${String(w).padStart(11)}${String(l).padStart(9)}${String(to).padStart(10)}  ${fmt(len[len.length >> 1]).padStart(6)}  ${fmt(len[len.length - 1]).padStart(7)}`);
}
