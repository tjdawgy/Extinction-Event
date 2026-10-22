// Rush calibration: Rifleman-rush variants against an AI difficulty.
//   node tests/rush-variants.js [matches=20] [difficulty=hard] [name filters...]
const { loadSim } = require('./load-sim');
const { playMatch } = require('./bots');
const sim = loadSim();
const { VARIANTS } = require('./rush-variants-list');
const n = +(process.argv[2] || 20), diff = process.argv[3] || 'hard';
const pick = process.argv.slice(4);
const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
console.log(`Rush variants vs ${diff} AI, ${n} matches each\n`);
for (const [name, [bot, opts]] of Object.entries(VARIANTS)) {
  if (pick.length && !pick.some(p => name.includes(p))) continue;
  let w = 0, l = 0, to = 0; const winT = [];
  for (let i = 0; i < n; i++) { const r = playMatch(sim, diff, bot, { botOpts: opts }); if (r.winner === 0) { w++; winT.push(r.t); } else if (r.winner === 1) l++; else to++; }
  winT.sort((a, b) => a - b);
  console.log(`${name.padEnd(36)} rush wins ${String(w).padStart(2)}  AI wins ${String(l).padStart(2)}  timeouts ${to}${winT.length ? '  median win ' + fmt(winT[winT.length >> 1]) : ''}`);
}
