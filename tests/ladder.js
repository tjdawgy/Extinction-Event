// Difficulty ladder and balance tables.
//   node tests/ladder.js [matches=20] [rows...]
// Rows: ai:easy-normal, ai:normal-hard, ai:easy-hard (AI vs AI, sides swapped halfway),
//       <bot>:<difficulty> for bots calibrated, stream, oldrush, turtle, defender, eco.
const { loadSim } = require('./load-sim');
const { playMatch, STEP } = require('./bots');
const { CALIBRATED } = require('./rush-variants-list');
const sim = loadSim();
const n = +(process.argv[2] || 20);
const BOT = {
  calibrated: ['rushx', CALIBRATED],
  stream: ['rushx', { order: ['barracks', 'barracks', 'barracks'] }],
  oldrush: ['rush'],
  turtle: ['turtle'],
  defender: ['defender', { plan: ['barracks', 'refinery', 'barracks', 'barracks', 'refinery', 'refinery', 'turret', 'factory'], riflesFirst: 20, holdDist: 380, holdMin: 12, attackArmy: 30 }],
  // economic expansion: three Refineries before anything else, then the turtle's tech and army
  eco: ['turtle', { plan: ['refinery', 'refinery', 'barracks', 'refinery', 'reactor', 'factory', 'habitat', 'techlab'] }],
  passive: ['turtle', { attackFill: 0.95 }], // never really attacks (kept to show the stalemate it causes)
};
const ROWS = process.argv.slice(3).length ? process.argv.slice(3) : ['ai:easy-normal', 'ai:normal-hard', 'ai:easy-hard',
  ...['calibrated', 'stream', 'turtle', 'defender'].flatMap(b => ['easy', 'normal', 'hard'].map(d => `${b}:${d}`))];
const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
for (const row of ROWS) {
  const [kind, arg] = row.split(':');
  let a = 0, b = 0, to = 0, longest = 0, draw = 0, byScore = 0, storm = 0, after26 = 0; // v2.6: how the Extinction Event ended matches
  for (let i = 0; i < n; i++) {
    let winner, t, res;
    if (kind === 'ai') {
      const [x, y] = arg.split('-'), swap = i % 2 === 1; // x is "a"; alternate sides
      const g = sim.newGame(swap ? x : y, { autoPlayer: true, autoDiff: swap ? y : x });
      while (!g.over && g.t < 1800) sim.update(g, STEP);
      t = g.t; res = g; winner = !g.over ? -1 : g.winner < 0 ? -2 : (g.winner === (swap ? 1 : 0) ? 0 : 1); // 0 = x won, -2 = draw
    } else {
      const [bot, opts] = BOT[kind];
      const r = playMatch(sim, arg, bot, { botOpts: opts }); winner = r.g.over && r.winner < 0 ? -2 : r.winner; t = r.t; res = r.g;
    }
    if (winner === 0) a++; else if (winner === 1) b++; else if (winner === -2) draw++; else to++;
    const how = res.result && res.result.how;
    if (how === 'score' || how === 'draw') byScore++; else if (how === 'storm') storm++;
    if (t > 1560) after26++;
    longest = Math.max(longest, t);
  }
  const [la, lb] = kind === 'ai' ? arg.split('-') : [kind, `AI ${arg}`];
  console.log(`${row.padEnd(18)} ${la} ${a} - ${b} ${lb}   timeouts ${to}   longest ${fmt(longest)}   storm-ended ${storm} score-decided ${byScore} draws ${draw} after 26:00 ${after26}`);
}
