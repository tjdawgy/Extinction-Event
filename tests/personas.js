// Personality measurements: results and behavior per personality, difficulty and opponent.
//   node tests/personas.js <matches> <row> [row...]
// Rows: <opponent>:<difficulty>:<persona>   opponent = a ladder bot (calibrated, stream, oldrush, turtle, defender, eco)
//       ai:<diffA>-<diffB>:<persona>         AI vs AI, both sides with that personality (sides swapped halfway); diffA is "a"
// Prints one line per row: wins, timeouts, and the AI's measured behavior (averages).
const { loadSim } = require('./load-sim');
const { playMatch, STEP, BOTS } = require('./bots');
const { CALIBRATED } = require('./rush-variants-list');
const sim = loadSim();
const BOT = {
  calibrated: ['rushx', CALIBRATED], stream: ['rushx', { order: ['barracks', 'barracks', 'barracks'] }], oldrush: ['rush'], turtle: ['turtle'],
  defender: ['defender', { plan: ['barracks', 'refinery', 'barracks', 'barracks', 'refinery', 'refinery', 'turret', 'factory'], riflesFirst: 20, holdDist: 380, holdMin: 12, attackArmy: 30 }],
  eco: ['turtle', { plan: ['refinery', 'refinery', 'barracks', 'refinery', 'reactor', 'factory', 'habitat', 'techlab'] }],
};
const n = +process.argv[2];
const fmt = t => t == null ? '-' : `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;

// play one match, tracking side `ai`'s behavior every tick
function track(g, ai, botFn) {
  const m = { refineries: 0, turrets: 0, nodeT: 0 };
  while (!g.over && g.t < 1800) {
    sim.update(g, STEP); if (botFn) botFn(g, 0, STEP);
    for (const e of g.events) if (e.type === 'built' && e.side === ai) { if (e.name === 'Refinery') m.refineries++; if (e.name === 'Turret') m.turrets++; }
    if (g.nodes.some(nd => nd.owner === ai)) m.nodeT += STEP;
    g.events.length = 0;
  }
  const log = g.sides[ai].aiLog || {};
  return { ...m, over: g.over, winner: g.winner, how: g.result && g.result.how, t: g.t, firstAttack: log.firstAttack, attacks: log.attacks || 0, feints: log.feints || 0, firstUpgrade: log.firstUpgrade, trained: log.trained || {}, abil: log.abil || {} };
}
for (const row of process.argv.slice(3)) {
  const [opp, diff, persona] = row.split(':');
  const R = { aiWins: 0, oppWins: 0, to: 0, draws: 0, score: 0, after26: 0, longest: 0, firstAttack: [], attacks: [], feints: [], ref: [], tur: [], node: [], up: [], mix: {}, ab: { shield: [], strike: [], repair: [], strikeDef: [] } };
  for (let i = 0; i < n; i++) {
    let r, aiSide;
    if (opp === 'ai') {
      const [a, b] = diff.split('-'), swap = i % 2 === 1;
      const g = sim.newGame(swap ? a : b, { autoPlayer: true, autoDiff: swap ? b : a, persona, autoPersona: persona });
      aiSide = swap ? 1 : 0; // the side playing difficulty a
      r = track(g, aiSide, null);
    } else {
      const g = sim.newGame(diff, { persona }); const [bot, opts] = BOT[opp];
      aiSide = 1; r = track(g, 1, BOTS[bot](sim, opts));
    }
    if (!r.over) R.to++; else if (r.winner < 0) R.draws++; else if (r.winner === aiSide) R.aiWins++; else R.oppWins++;
    if (r.how === 'score' || r.how === 'draw') R.score++;
    if (r.t > 1560) R.after26++;
    R.longest = Math.max(R.longest, r.t);
    if (r.firstAttack != null) R.firstAttack.push(r.firstAttack);
    for (const k in R.ab) R.ab[k].push(r.abil[k] || 0);
    R.attacks.push(r.attacks); R.feints.push(r.feints); R.ref.push(r.refineries); R.tur.push(r.turrets); R.node.push(r.nodeT); if (r.firstUpgrade != null) R.up.push(r.firstUpgrade);
    for (const k in r.trained) R.mix[k] = (R.mix[k] || 0) + r.trained[k];
  }
  const tot = Object.values(R.mix).reduce((a, b) => a + b, 0) || 1;
  const mix = Object.entries(R.mix).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${Math.round(100 * v / tot)}%`).join(' ');
  const who = opp === 'ai' ? `${diff.split('-')[0]} ${R.aiWins}-${R.oppWins} ${diff.split('-')[1]}` : `AI ${R.aiWins}-${R.oppWins} ${opp}`;
  console.log(`${row.padEnd(26)} ${who.padEnd(20)} timeouts ${R.to} longest ${fmt(R.longest)} score-decided ${R.score} draws ${R.draws} after 26:00 ${R.after26} | first attack ${fmt(avg(R.firstAttack))} attacks ${avg(R.attacks).toFixed(1)} feints ${avg(R.feints).toFixed(1)} refineries ${avg(R.ref).toFixed(1)} turrets ${avg(R.tur).toFixed(1)} node ${fmt(avg(R.node))} first upgrade ${fmt(avg(R.up))} | abilities shield ${avg(R.ab.shield).toFixed(1)} strike ${avg(R.ab.strike).toFixed(1)} (on defences ${avg(R.ab.strikeDef).toFixed(1)}) repair ${avg(R.ab.repair).toFixed(1)} | ${mix}`);
}
