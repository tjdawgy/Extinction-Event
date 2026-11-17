// v2.87 (faction rework batch 4b): Hard vs Hard self-play on Classic, Two-Lane and Three-Lane, all six faction pairings
// (side order counts), to the end (or maxT). Counts what the AI did with batch 4b's five units (bombing runs and turns,
// pustules stuck and burst into Mites, Repair clearing them, Worldrender landings and take-offs, Voidcarrier bolts, judgement
// beams and failed shots), the units trained and the paths taken. --force: every AI side rolls its Tech Lab path toward the
// batch's units (Last Fist Air Power, Bloomhost Apex Bloom, Axiarch Ascendant Calculus; the forcePath hook) and gets two of each of
// its faction's batch units (with two Interceptors for Last Fist) at 7:00, which the AI then commands, so all five appear.
// Usage: node audit/sim/selfplay-4b.js [seed] [maxT] [--force]  (runs 4 matches at a time)
const { fork } = require('child_process');
const KEYS = ['run', 'pustule', 'pusburst', 'pusclear', 'land', 'landed', 'takeoff', 'judge', 'sovfail', 'hop'], UNITS = ['leviathan', 'interceptor', 'broodtyrant', 'worldrender', 'voidcarrier', 'sovereign'];
if (process.argv[2] === '--one') {
  const [map, f0, f1, seed, maxT, force] = process.argv.slice(3);
  const { loadSim } = require('./load');
  const S = loadSim(+seed);
  let err = null, n = {}, g; const paths = new Set();
  try {
    g = S.newGame('hard', { seed: +seed, map, autoPlayer: true, autoDiff: 'hard', factions: [f0, f1] }); g.countdown = 0;
    if (force === '1') g.forcePath = [0, 1].map(s => ({ techlab: g.sides[s].faction === 'lastfist' ? 'A' : 'B' })); // the game's test hook (aiPickPath)
    const FU = { lastfist: ['leviathan', 'leviathan', 'interceptor', 'interceptor'], bloomhost: ['broodtyrant', 'broodtyrant', 'worldrender', 'worldrender'], axiarchs: ['voidcarrier', 'voidcarrier', 'sovereign', 'sovereign'] }; let seeded = false;
    const vb = new Set();
    let k = 0;
    while (!g.over && g.t < +maxT) {
      if (force === '1' && !seeded && g.t >= 420) { seeded = true; for (const s of [0, 1]) for (const t of FU[g.sides[s].faction]) S.spawnUnit(g, s, t, S.rallyU(s, g), 0); } // and two of each of its faction's batch units at 7:00, in the AI's hands
      S.update(g, 1 / 30);
      for (const e of g.events) if (KEYS.includes(e.type)) { n[e.type] = (n[e.type] || 0) + 1; if (e.type === 'judge' && e.b) n.judgeB = (n.judgeB || 0) + 1; if (e.type === 'pusburst') n.mites = (n.mites || 0) + e.n; }
      for (const p of g.projs) if (p.weapon === 'vbolt' && !vb.has(p)) { vb.add(p); n.vbolt = (n.vbolt || 0) + 1; }
      if (vb.size > 5000) vb.clear();
      g.events.length = 0;
      if (++k % 15 === 0) for (const e of g.ents) if (e.kind === 'b' && e.hp > 0 && e.path && ['barracks', 'factory', 'techlab'].includes(e.type)) paths.add(`${g.sides[e.side].faction}:${e.type}:${e.path}`);
    }
  } catch (e) { err = String(e && e.stack || e); }
  const tr = {}; if (g) for (const s of [0, 1]) for (const t of UNITS) { const c = g.log.tot[s].trained[t]; if (c) tr[t] = (tr[t] || 0) + c; }
  process.send({ map, f: [f0, f1], t: g ? Math.round(g.t) : 0, over: g && g.over, winner: g ? g.winner : null, n, tr, paths: [...paths], err });
  process.exit(0);
}
const seed = +(process.argv[2] || 7), maxT = +(process.argv[3] || 1700), force = process.argv.includes('--force') ? '1' : '0';
const F = ['lastfist', 'bloomhost', 'axiarchs'], jobs = [];
for (const map of ['classic', 'twolane', 'threelane']) for (const a of F) for (const b of F) if (a !== b) jobs.push([map, a, b]);
const out = []; let next = 0, live = 0;
function go() {
  while (live < 4 && next < jobs.length) {
    const [map, a, b] = jobs[next++]; live++;
    const c = fork(__filename, ['--one', map, a, b, String(seed), String(maxT), force]);
    c.on('message', m => { out.push(m); console.log(JSON.stringify(m)); });
    c.on('exit', () => { live--; if (out.length === jobs.length) done(); else go(); });
  }
}
function done() {
  const tot = {}, tr = {}, paths = new Set();
  for (const m of out) { for (const k in m.n) tot[k] = (tot[k] || 0) + m.n[k]; for (const k in m.tr) tr[k] = (tr[k] || 0) + m.tr[k]; for (const p of m.paths) paths.add(p); }
  console.log('errors:', out.filter(m => m.err).length, 'of', out.length, '| events:', JSON.stringify(tot), '| trained:', JSON.stringify(tr));
  for (const k of [...KEYS, 'judgeB', 'mites', 'vbolt']) console.log(k, 'in', out.filter(m => m.n[k]).length, 'matches');
  const miss = []; for (const f of F) for (const b of ['barracks', 'factory', 'techlab']) for (const p of ['A', 'B']) if (!paths.has(`${f}:${b}:${p}`)) miss.push(`${f}:${b}:${p}`);
  console.log('paths taken:', [...paths].sort().join(' '), '| never:', miss.join(' ') || 'none');
}
go();
