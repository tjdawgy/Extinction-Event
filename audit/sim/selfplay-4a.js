// v2.86 (faction rework batch 4a): Hard vs Hard self-play on Classic, Two-Lane and Three-Lane, all six faction pairings
// (side order counts), to the end (or maxT). Counts what the AI did with batch 4a's five units (pins, marks, acid pools,
// salvos and how many opened on a vehicle, hops, shots that lost a hopping Wraithwing, raids), the units trained, and every
// production path taken (Part 0: each path of each production building at least once per faction).
// Usage: node audit/sim/selfplay-4a.js [seed] [maxT]  (runs 4 matches at a time)
const { fork } = require('child_process');
const KEYS = ['pin', 'mark', 'pool', 'salvo', 'hop', 'raid'], UNITS = ['sniper', 'marksman', 'bilecaster', 'aircraft', 'wraithwing'];
if (process.argv[2] === '--one') {
  const [map, f0, f1, seed, maxT] = process.argv.slice(3);
  const { loadSim } = require('./load');
  const S = loadSim(+seed);
  let err = null, n = {}, g; const paths = new Set();
  try {
    g = S.newGame('hard', { seed: +seed, map, autoPlayer: true, autoDiff: 'hard', factions: [f0, f1] }); g.countdown = 0;
    let k = 0;
    while (!g.over && g.t < +maxT) {
      S.update(g, 1 / 30);
      for (const e of g.events) if (KEYS.includes(e.type)) { n[e.type] = (n[e.type] || 0) + 1; if (e.type === 'salvo' && e.veh) n.salvoVeh = (n.salvoVeh || 0) + 1; if (e.type === 'hop' && e.miss) n.missed = (n.missed || 0) + e.miss; }
      g.events.length = 0;
      if (++k % 15 === 0) for (const e of g.ents) if (e.kind === 'b' && e.hp > 0 && e.path && ['barracks', 'factory', 'techlab'].includes(e.type)) paths.add(`${g.sides[e.side].faction}:${e.type}:${e.path}`);
    }
  } catch (e) { err = String(e && e.stack || e); }
  const tr = {}; if (g) for (const s of [0, 1]) for (const t of UNITS) { const c = g.log.tot[s].trained[t]; if (c) tr[t] = (tr[t] || 0) + c; }
  process.send({ map, f: [f0, f1], t: g ? Math.round(g.t) : 0, over: g && g.over, winner: g ? g.winner : null, n, tr, paths: [...paths], err });
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
  const tot = {}, tr = {}, paths = new Set();
  for (const m of out) { for (const k in m.n) tot[k] = (tot[k] || 0) + m.n[k]; for (const k in m.tr) tr[k] = (tr[k] || 0) + m.tr[k]; for (const p of m.paths) paths.add(p); }
  console.log('errors:', out.filter(m => m.err).length, 'of', out.length, '| events:', JSON.stringify(tot), '| trained:', JSON.stringify(tr));
  for (const k of [...KEYS, 'salvoVeh', 'missed']) console.log(k, 'in', out.filter(m => m.n[k]).length, 'matches');
  const miss = []; for (const f of F) for (const b of ['barracks', 'factory', 'techlab']) for (const p of ['A', 'B']) if (!paths.has(`${f}:${b}:${p}`)) miss.push(`${f}:${b}:${p}`);
  console.log('paths taken:', [...paths].sort().join(' '), '| never:', miss.join(' ') || 'none');
}
go();
