// v2.85 (faction rework batch 3b): Hard vs Hard self-play on Classic, Two-Lane and Three-Lane, all six faction pairings
// (side order counts), to the end (or maxT). Counts what the AI did with batch 3b's four units (charges, barrier blocks and
// breaks, parries, Bulwark braces and creep regeneration) and the Riftstalker's blink home (Part 0, batch 3a), and the
// units trained. Usage: node audit/sim/selfplay-3b.js [seed] [maxT] [predator]  (runs 4 matches at a time). predator: every
// Bloomhost side's Evolution Chamber takes Predator Evolution (g.forcePath, the test hook), so its Dreadthorns get trained; the
// Bloomhost AI otherwise takes Burrowing Evolution on its one Evolution Chamber (the AI's path choice, unchanged)
const { fork } = require('child_process');
const KEYS = ['charge', 'chargeEnd', 'barrierBreak', 'parry', 'blinkHome', 'chain', 'leap'], UNITS = ['dreadthorn', 'bastion', 'shardling', 'bulwark', 'riftstalker'];
if (process.argv[2] === '--one') {
  const [map, f0, f1, seed, maxT, pred] = process.argv.slice(3);
  const { loadSim } = require('./load');
  const S = loadSim(+seed);
  let err = null, n = {}, g; const braces = new Set(), regen = new Set();
  try {
    g = S.newGame('hard', { seed: +seed, map, autoPlayer: true, autoDiff: 'hard', factions: [f0, f1] }); g.countdown = 0;
    if (pred === 'predator') g.forcePath = [f0, f1].map(f => f === 'bloomhost' ? { factory: 'B' } : {});
    let k = 0;
    while (!g.over && g.t < +maxT) {
      S.update(g, 1 / 30); for (const e of g.events) if (KEYS.includes(e.type)) n[e.type] = (n[e.type] || 0) + 1; g.events.length = 0;
      if (++k % 15 === 0) for (const e of g.ents) if (e.type === 'bulwark' && e.hp > 0) { if (e.braceT > g.t) braces.add(e.id + ':' + e.braceT.toFixed(3)); if (g.t - (e.bkRg ?? -9) < 0.1) regen.add(e.id + ':' + Math.floor(g.t / 5)); }
    }
  } catch (e) { err = String(e && e.stack || e); }
  n.brace = braces.size; n.regen5s = regen.size; // braces; Bulwark-5s spells regenerating on creep
  if (g) for (const s of [0, 1]) { const b = g.log.tot[s].bwBlk; if (b) n.blocked = Math.round((n.blocked || 0) + b); }
  const tr = {}; if (g) for (const s of [0, 1]) for (const t of UNITS) { const c = g.log.tot[s].trained[t]; if (c) tr[t] = (tr[t] || 0) + c; }
  process.send({ map, f: [f0, f1], t: g ? Math.round(g.t) : 0, over: g && g.over, winner: g ? g.winner : null, n, tr, err });
  process.exit(0);
}
const seed = +(process.argv[2] || 7), maxT = +(process.argv[3] || 1700), pred = process.argv[4] || '';
const F = ['lastfist', 'bloomhost', 'axiarchs'], jobs = [];
for (const map of ['classic', 'twolane', 'threelane']) for (const a of F) for (const b of F) if (a !== b) jobs.push([map, a, b]);
const out = []; let next = 0, live = 0;
function go() {
  while (live < 4 && next < jobs.length) {
    const [map, a, b] = jobs[next++]; live++;
    const c = fork(__filename, ['--one', map, a, b, String(seed), String(maxT), pred]);
    c.on('message', m => { out.push(m); console.log(JSON.stringify(m)); });
    c.on('exit', () => { live--; if (out.length === jobs.length) done(); else go(); });
  }
}
function done() {
  const tot = {}, tr = {};
  for (const m of out) { for (const k in m.n) tot[k] = (tot[k] || 0) + m.n[k]; for (const k in m.tr) tr[k] = (tr[k] || 0) + m.tr[k]; }
  console.log('errors:', out.filter(m => m.err).length, 'of', out.length, '| events:', JSON.stringify(tot), '| trained:', JSON.stringify(tr));
  for (const k of [...KEYS, 'brace', 'regen5s', 'blocked']) console.log(k, 'in', out.filter(m => m.n[k]).length, 'matches');
}
go();
