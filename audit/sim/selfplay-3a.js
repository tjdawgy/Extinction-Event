// v2.84 (faction rework batch 3a): Hard vs Hard self-play on Classic, Two-Lane and Three-Lane, all six faction pairings
// (side order counts), to the end (or maxT). Counts the batch 3a events the AI produced (latch, hatch, chain, blinkHome,
// swap, devour) and the four units trained. Usage: node audit/sim/selfplay-3a.js [seed] [maxT]  (runs 4 matches at a time)
const { fork } = require('child_process');
const path = require('path');
const KEYS = ['latch', 'hatch', 'chain', 'blinkHome', 'swap', 'devour'], UNITS = ['leaper', 'riftstalker', 'parallax', 'ravager'];
if (process.argv[2] === '--one') {
  const [map, f0, f1, seed, maxT] = process.argv.slice(3);
  const { loadSim } = require('./load');
  const S = loadSim(+seed);
  let err = null, n = {}, g;
  try {
    g = S.newGame('hard', { seed: +seed, map, autoPlayer: true, autoDiff: 'hard', factions: [f0, f1] }); g.countdown = 0;
    while (!g.over && g.t < +maxT) { S.update(g, 1 / 30); for (const e of g.events) if (KEYS.includes(e.type)) n[e.type] = (n[e.type] || 0) + 1; g.events.length = 0; }
  } catch (e) { err = String(e && e.stack || e); }
  const tr = {}; if (g) for (const s of [0, 1]) for (const t of UNITS) { const k = g.log.tot[s].trained[t]; if (k) tr[t] = (tr[t] || 0) + k; }
  process.send({ map, f: [f0, f1], t: g ? Math.round(g.t) : 0, over: g && g.over, winner: g ? g.winner : null, n, tr, err });
  process.exit(0);
}
const seed = +(process.argv[2] || 7), maxT = +(process.argv[3] || 1700);
const F = ['lastfist', 'bloomhost', 'axiarchs'], jobs = [];
for (const map of ['classic', 'twolane', 'threelane']) for (const a of F) for (const b of F) if (a !== b) jobs.push([map, a, b]);
const out = []; let next = 0, live = 0;
function go() {
  while (live < 4 && next < jobs.length) {
    const [map, a, b] = jobs[next++]; live++;
    const c = fork(__filename, ['--one', map, a, b, String(seed), String(maxT)]);
    c.on('message', m => { out.push(m); console.log(JSON.stringify(m)); });
    c.on('exit', () => { live--; if (out.length === jobs.length) done(); else go(); });
  }
}
function done() {
  const tot = {}, tr = {};
  for (const m of out) { for (const k in m.n) tot[k] = (tot[k] || 0) + m.n[k]; for (const k in m.tr) tr[k] = (tr[k] || 0) + m.tr[k]; }
  console.log('errors:', out.filter(m => m.err).length, 'of', out.length, '| events:', JSON.stringify(tot), '| trained:', JSON.stringify(tr));
  for (const k of KEYS) console.log(k, 'in', out.filter(m => m.n[k]).length, 'matches');
}
go();
