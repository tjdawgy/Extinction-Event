// Batch 6e (v2.95): the slow test that failed with b6elane and b6e on (Three-Lane: "both sides used all three lanes"), measured
// over 20 matches with the switches on and off, to tell seed variance, an intended effect and a regression apart (a copy of
// audit/sim/slow6d.js with batch 6e's switch sets). Each match plays exactly what its test plays, with a
// different seed; per match it prints the facts the test checks.
//   node audit/sim/slow6e.js --kind corrosive|threelane|axpaths [--n 20] [--seed0 S] [--jobs 4] [--out dir]
//   kinds: corrosive  tests/slow/ai-stats.test.js "Bloomhost AI (Turtle) uses all three of its abilities" (Default AI, Classic)
//          threelane  tests/slow/threelane-match.test.js (Hard vs Hard on Three-Lane, the pairing cycle of the test)
//          axpaths    tests/ax-trees.test.js "the AI maps its Last Fist paths onto the Axiarchs" (re-run with every switch on in
//                     tests/slow/switches-on-6c.test.js): one match per seed and persona (economist, trickster)
// Each runs under four switch sets: on (every switch), lane0 (b6elane off), e0 (b6e off), off (both off). Writes <out>/<kind>.jsonl.
const { fork } = require('child_process'), fs = require('fs'), path = require('path');
const CFG = { on: {}, lane0: { b6elane: false }, e0: { b6e: false }, off: { b6elane: false, b6e: false } };
if (process.argv[2] === '--one') {
  const [kind, seed, cfg] = process.argv.slice(3);
  const { loadSim } = require('../../tests/load-sim');
  const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rw = CFG[cfg]; let r;
  if (kind === 'corrosive') { // ai-stats: playN(N, 100, { persona: 'turtle', autoPersona: 'turtle', factions: ['lastfist', 'bloomhost'] }, 1200)
    const S = require('./load').loadSim(+seed); Object.assign(S.REWORK, rw);
    const g = S.newGame('hard', { autoPlayer: true, autoDiff: 'hard', ai: 'default', autoAi: 'default', persona: 'turtle', autoPersona: 'turtle', factions: ['lastfist', 'bloomhost'] }); g.countdown = 0;
    while (!g.over && g.t < 1200) { S.update(g, 1 / 30); g.events.length = 0; }
    const ab = g.sides[1].aiLog.abil || {};
    r = { frenzy: ab.frenzy || 0, corrosive: ab.corrosive || 0, brood: ab.brood || 0, t: Math.round(g.t), winner: g.winner };
  } else if (kind === 'threelane') {
    const sim = loadSim(); Object.assign(sim.REWORK, rw); const F = ['lastfist', 'bloomhost', 'axiarchs'], m = +seed % 6;
    const fac = [F[m % 3], F[(m + 1 + (m >> 2)) % 3]];
    const g = sim.newGame('hard', { map: 'threelane', seed: +seed, autoPlayer: true, autoDiff: 'hard', factions: m % 2 ? fac.reverse() : fac }); g.countdown = 0;
    const lanes = [new Set(), new Set()], centre = new Set(), towers = new Set(); let fwd = 0, inside = 0, two = 0;
    for (let i = 0; i < 60 * (sim.EXT.limit + 5) && !g.over; i++) {
      sim.update(g, sim.TICK); g.events.length = 0;
      if (i % 300 === 0) {
        for (const e of g.ents) {
          if (e.kind === 'u' && e.hp > 0 && e.lane != null && e.u > 700 && e.u < 1600) lanes[e.side].add(e.lane);
          if (e.kind === 'u' && e.hp > 0 && !sim.UDEF[e.type].air && !e.leaping && sim.navShut(e.u, e.v)) inside++;
          if (e.kind === 'b' && e.slot >= sim.FWD_SLOT) fwd++;
        }
        if (g.nodes[1].owner !== null) centre.add(g.nodes[1].owner);
        for (const n of g.nodes) if (n.type === 'watchtower' && n.owner !== null) towers.add(n.owner);
        if (g.sides.some(s => s.capT && s.capT2)) two++;
      }
    }
    r = { f: g.sides.map(s => s.faction), over: g.over, t: Math.round(g.t), lanes: lanes.map(L => [...L].sort().join('')), all3: lanes.every(L => L.size === 3), centre: centre.size, towers: towers.size, inside, fwd: fwd > 0, two: two > 0, hq: g.winner >= 0 && g.result && g.result.how === 'hq' };
  } else { // axpaths: ax-trees.test.js:150 with every switch held on except the config's
    const persona = +seed % 2 ? 'trickster' : 'economist', S = loadSim({ random: mul(+seed) }); Object.assign(S.REWORK, rw);
    const g = S.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona, autoPersona: 'turtle', factions: ['lastfist', 'axiarchs'] });
    const paths = new Set(); for (let i = 0; i < 30 * 1700 && !g.over; i++) { S.update(g, 1 / 30); for (const e of g.ents) if (e.side === 1 && e.kind === 'b' && e.path) paths.add(e.type + e.path); g.events.length = 0; }
    r = { persona, over: g.over, t: Math.round(g.t), winner: g.winner, paths: [...paths].sort(), turtle0: g.sides[0].persona.kind, b6: !!g.sides[0].persona.b6, trained: Object.keys(g.sides[1].aiLog.trained) };
  }
  process.send(Object.assign({ kind, seed: +seed, cfg }, r)); process.exit(0);
}
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const kind = arg('kind'), N = +arg('n', 20), J = +arg('jobs', 4), out = arg('out', path.join(__dirname, '..', 'logs-p1', 'slow6e'));
const seed0 = +arg('seed0', { corrosive: 100, threelane: 600, axpaths: 1 }[kind]);
fs.mkdirSync(out, { recursive: true }); const file = path.join(out, kind + '.jsonl');
const done = new Set(); if (fs.existsSync(file)) for (const l of fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)) { const m = JSON.parse(l); done.add(m.seed + m.cfg); }
const jobs = []; for (let i = 0; i < N; i++) for (const c of Object.keys(CFG)) if (!done.has(seed0 + i + c)) jobs.push([seed0 + i, c]);
let next = 0, live = 0; console.log(`${kind}: ${jobs.length} matches to run`);
(function go() { while (live < J && next < jobs.length) { const [s, c] = jobs[next++]; live++; const p = fork(__filename, ['--one', kind, String(s), c]); p.on('message', m => { fs.appendFileSync(file, JSON.stringify(m) + '\n'); console.log(JSON.stringify(m).slice(0, 200)); }); p.on('exit', () => { live--; go(); }); } })();
