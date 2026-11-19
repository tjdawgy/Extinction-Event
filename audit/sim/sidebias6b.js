// Batch 6b, Part A1 (side bias, diagnosis): Hard vs Hard matches with one candidate cause taken out at a time. A candidate
// is removed by a small text patch to the SIM source (index.html's SIM section, loaded into a fresh VM per match by
// load.js, nothing written back), so every number here comes from the real game with exactly one thing changed:
//   none      the game as built
//   ai        the two AIs run in a seeded random order each tick (the game runs side 1's first, then side 0's) and both
//             start their decision clock at 1 s (the game: side 0 at 1 s, side 1 at 1.5 s)
//   order     the unit and building update loop runs in a seeded random order each tick (the game: the entity list's order)
//   b6side    the game's own fix, newGame(…, { rework: { b6side: true } }), once the build has it (and b6side0: forced off)
// Mirror matches by default (each faction against itself), so any difference between the sides is bias, not matchup.
// Per match it records the winner and length, and per side: income per minute in the first 3/6/10 minutes, army value at
// 4 and 8 minutes, node-seconds held per node, the time of its first T2 building, the first unit lost, and every unit lost.
//   node audit/sim/sidebias6b.js --abl none,ai,order [--maps twolane,threelane] [--seeds 1-10] [--facs mirror|all]
//        [--jobs 4] [--maxT 1700] [--out dir]   writes <out>/<abl>.jsonl and prints a summary per ablation and map
const { fork } = require('child_process'), fs = require('fs'), path = require('path');
const PATCH = {
  none: [],
  ai: [
    ['aiUpdate(g, 1, dt); aiSpotter(g, 1);\n  if (g.auto) { aiUpdate(g, 0, dt); aiSpotter(g, 0); }',
     'if (__dg.r() < 0.5) { aiUpdate(g, 1, dt); aiSpotter(g, 1); if (g.auto) { aiUpdate(g, 0, dt); aiSpotter(g, 0); } } else { if (g.auto) { aiUpdate(g, 0, dt); aiSpotter(g, 0); } aiUpdate(g, 1, dt); aiSpotter(g, 1); }'],
    ['aiT: 1 + s * 0.5,', 'aiT: 1,'],
  ],
  order: [
    ['  for (let i = 0; i < n; i++) {\n    const e = g.ents[i];\n    if (e.hp <= 0) continue;\n    if (e.kind === \'b\')',
     '  const __o = []; for (let i = 0; i < n; i++) __o.push(g.ents[i]); for (let i = n - 1; i > 0; i--) { const j = Math.floor(__dg.r() * (i + 1)); const t = __o[i]; __o[i] = __o[j]; __o[j] = t; }\n  for (let i = 0; i < n; i++) {\n    const e = __o[i];\n    if (e.hp <= 0) continue;\n    if (e.kind === \'b\')'],
  ],
  b6side: [], b6side0: [],
};
const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
if (args[0] === '--one') {
  const [abl, map, f0, f1, seed, maxT] = args.slice(1);
  const { simSource, mulberry } = require('./load'), vm = require('vm');
  let src = simSource();
  for (const [a, b] of PATCH[abl] || []) { if (!src.includes(a)) throw new Error(`patch ${abl}: text not found: ${a.slice(0, 60)}`); src = src.replace(a, b); }
  const ctx = vm.createContext({ console });
  vm.runInContext(`Math.random = (${mulberry.toString()})(${+seed});`, ctx);
  vm.runInContext(`const __dg = { r: (${mulberry.toString()})(${+seed * 7919 + 1}) };\n${src}\n;this.__sim = { newGame, update, TICK, VERSION, UDEF };`, ctx, { filename: 'sim' });
  const S = ctx.__sim, rw = abl === 'b6side' ? { b6side: true } : abl === 'b6side0' ? { b6side: false } : undefined;
  const g = S.newGame('hard', { seed: +seed, map, autoPlayer: true, autoDiff: 'hard', factions: [f0, f1], rework: rw }); g.countdown = 0;
  const R = { nodeT: [{}, {}], t2: [null, null], firstLoss: [null, null], army: [[], []], err: null };
  let k = 0;
  try {
    while (!g.over && g.t < +maxT) {
      S.update(g, S.TICK); g.events.length = 0; k++;
      if (k % 60 === 0) {
        for (const n of g.nodes) if (n.owner === 0 || n.owner === 1) R.nodeT[n.owner][n.id] = (R.nodeT[n.owner][n.id] || 0) + 1;
        for (let s = 0; s < 2; s++) {
          if (R.t2[s] == null && g.ents.some(e => e.kind === 'b' && e.side === s && e.type !== 'hq' && e.built && e.tier >= 2)) R.t2[s] = g.t;
          if (R.firstLoss[s] == null && g.sides[s].stats.lost > 0) R.firstLoss[s] = g.t;
        }
      }
    }
  } catch (e) { R.err = String(e && e.stack || e); }
  const st = g.stats.sides, inc = (s, m) => st[s].c.slice(0, m * 6).reduce((a, x) => a + x, 0) / m, arm = (s, m) => st[s].army[m * 6 - 1] ?? null;
  process.send({ abl, map, f: [f0, f1], seed: +seed, t: Math.round(g.t), winner: g.over ? g.winner : null, how: g.result ? g.result.how : null, err: R.err, ver: S.VERSION,
    sides: [0, 1].map(s => ({ inc3: inc(s, 3), inc6: inc(s, 6), inc10: inc(s, 10), army4: arm(s, 4), army8: arm(s, 8), t2: R.t2[s], firstLoss: R.firstLoss[s], nodeT: R.nodeT[s], lost: g.sides[s].stats.lost, kills: g.sides[s].stats.kills, persona: g.sides[s].persona && g.sides[s].persona.kind })) });
  process.exit(0);
}
const rng = s => { const [a, b] = s.split('-').map(Number); const o = []; for (let i = a; i <= (b ?? a); i++) o.push(i); return o; };
const ABL = arg('abl', 'none').split(','), MAPS = arg('maps', 'twolane,threelane').split(','), SEEDS = rng(arg('seeds', '1-10')), JOBS = +arg('jobs', 4), MAXT = arg('maxT', '1700');
const F = ['lastfist', 'bloomhost', 'axiarchs'], PAIRS = arg('facs', 'mirror') === 'all' ? F.flatMap(a => F.map(b => [a, b])) : F.map(a => [a, a]);
const OUT = arg('out', path.join(__dirname, '..', 'logs-p1', 'sidebias6b'));
fs.mkdirSync(OUT, { recursive: true });
const jobs = [];
for (const abl of ABL) for (const map of MAPS) for (const seed of SEEDS) for (const [a, b] of PAIRS) jobs.push([abl, map, a, b, seed]);
const files = {}; for (const abl of ABL) { files[abl] = path.join(OUT, abl + '.jsonl'); }
const done = new Set(); for (const abl of ABL) if (fs.existsSync(files[abl])) for (const l of fs.readFileSync(files[abl], 'utf8').trim().split('\n').filter(Boolean)) { const m = JSON.parse(l); done.add([m.abl, m.map, m.f[0], m.f[1], m.seed].join('|')); }
const todo = jobs.filter(j => !done.has(j.join('|')));
let next = 0, run = 0; const t0 = Date.now();
function launch() {
  while (run < JOBS && next < todo.length) {
    const j = todo[next++]; run++;
    const c = fork(__filename, ['--one', ...j.map(String), MAXT]);
    c.on('message', m => { fs.appendFileSync(files[m.abl], JSON.stringify(m) + '\n'); console.log(`${m.abl} ${m.map} ${m.f.join('-')} s${m.seed}: ${m.winner} ${m.how} ${m.t}s${m.err ? ' ERR' : ''} (${Math.round((Date.now() - t0) / 1000)}s)`); });
    c.on('exit', () => { run--; if (next < todo.length) launch(); else if (!run) summary(); });
  }
}
function summary() {
  for (const abl of ABL) {
    if (!fs.existsSync(files[abl])) continue;
    const L = fs.readFileSync(files[abl], 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
    for (const map of [...MAPS, 'all']) {
      const M = L.filter(m => map === 'all' || m.map === map); if (!M.length) continue;
      const w = [0, 0], d = M.filter(m => m.winner !== 0 && m.winner !== 1).length; for (const m of M) if (m.winner === 0 || m.winner === 1) w[m.winner]++;
      const av = f => [0, 1].map(s => Math.round(M.reduce((a, m) => a + (f(m.sides[s]) || 0), 0) / M.length));
      console.log(`${abl.padEnd(7)} ${map.padEnd(9)} n ${M.length}: side0 ${w[0]}, side1 ${w[1]}, draws ${d}; side1 of decided ${w[0] + w[1] ? Math.round(100 * w[1] / (w[0] + w[1])) : '-'}%; income/min 0-3 ${av(s => s.inc3)}, 0-6 ${av(s => s.inc6)}, 0-10 ${av(s => s.inc10)}; army 4:00 ${av(s => s.army4)}, 8:00 ${av(s => s.army8)}; errors ${M.filter(m => m.err).length}`);
    }
  }
}
if (args.includes('--summary')) summary(); else if (!todo.length) summary(); else launch();
