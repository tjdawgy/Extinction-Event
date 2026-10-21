// Balance runner: scripted bots vs the built-in AI, reported as win counts.
//   node tests/balance.js [matches=20] [bots=rush,turtle] [diffs=easy,normal,hard]
const { loadSim } = require('./load-sim');
const { playMatch } = require('./bots');

const sim = loadSim();
const n = +(process.argv[2] || 20);
const bots = (process.argv[3] || 'rush,turtle').split(',');
const diffs = (process.argv[4] || 'easy,normal,hard').split(',');
const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

console.log(`Bot vs AI, ${n} matches each (30-minute cap)\n`);
console.log('bot     difficulty  bot wins  AI wins  timeouts  median length');
for (const bot of bots) for (const diff of diffs) {
  let w = 0, l = 0, to = 0; const len = [];
  for (let i = 0; i < n; i++) {
    const r = playMatch(sim, diff, bot);
    if (r.winner === 0) w++; else if (r.winner === 1) l++; else to++;
    len.push(r.t);
  }
  len.sort((a, b) => a - b);
  console.log(`${bot.padEnd(8)}${diff.padEnd(12)}${String(w).padStart(8)}${String(l).padStart(9)}${String(to).padStart(10)}  ${fmt(len[len.length >> 1]).padStart(13)}`);
}
