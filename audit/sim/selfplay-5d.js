// v2.91 (faction rework batch 5d: every building redrawn; art only): Hard vs Hard self-play on Classic, Two-Lane and Three-Lane,
// all six faction pairings (side order counts), seed 7, each match on this build and on v2.90's index.html (1b8c40f, or --ref),
// with REWORK.b5c set the same way in both: the match state (serialize, less the match log and stats) hashed every 100 ticks;
// every hash, the winner and the end time must match, and neither run may throw (as audit/sim/selfplay-5a.js and -5c.js).
//   node audit/sim/selfplay-5d.js [seed] [maxT] --b5c off|on [--ref old.html]
// Runs 4 matches at a time.
const { fork, execSync } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
if (process.argv[2] === '--one') {
  const [map, f0, f1, seed, maxT, b5c, file] = process.argv.slice(3);
  const { loadSim } = require('./load');
  const run = f => {
    const S = loadSim(+seed, f ? { file: f } : {}); if (S.REWORK) S.REWORK.b5c = b5c === 'on';
    let err = null, g, hs = [], k = 0;
    try {
      g = S.newGame('hard', { seed: +seed, map, autoPlayer: true, autoDiff: 'hard', factions: [f0, f1] }); g.countdown = 0;
      while (!g.over && g.t < +maxT) {
        S.update(g, 1 / 30); g.events.length = 0;
        if (++k % 100 === 0) { const o = JSON.parse(S.serialize(g, {})); delete o.log; delete o.stats; hs.push(crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 12)); }
      }
    } catch (e) { err = String(e && e.stack || e); }
    return { t: g ? Math.round(g.t * 100) / 100 : 0, winner: g ? g.winner : null, hs, err, ver: S.VERSION, b5c: g && g.rw && g.rw.b5c };
  };
  const a = run(null), b = run(file);
  const same = a.t === b.t && a.winner === b.winner && a.hs.length === b.hs.length && a.hs.every((h, i) => h === b.hs[i]);
  process.send({ map, f: [f0, f1], t: a.t, winner: a.winner, checks: a.hs.length, same, err: a.err || b.err, vers: [a.ver, b.ver], b5c: [a.b5c, b.b5c] });
  process.exit(0);
}
const pos = process.argv.slice(2).filter((x, i, A) => !x.startsWith('--') && A[i - 1] !== '--ref' && A[i - 1] !== '--b5c');
const seed = +(pos[0] || 7), maxT = +(pos[1] || 1700), b5c = process.argv.includes('--b5c') ? process.argv[process.argv.indexOf('--b5c') + 1] : 'on';
let ref = process.argv.includes('--ref') ? path.resolve(process.argv[process.argv.indexOf('--ref') + 1]) : '';
if (!ref) { ref = path.join(os.tmpdir(), 'ee-v290-index.html'); fs.writeFileSync(ref, execSync('git show 1b8c40f:index.html', { cwd: path.join(__dirname, '..', '..'), maxBuffer: 1 << 26 })); }
const F = ['lastfist', 'bloomhost', 'axiarchs'], jobs = [];
for (const map of ['classic', 'twolane', 'threelane']) for (const a of F) for (const b of F) if (a !== b) jobs.push([map, a, b]);
const out = []; let next = 0, live = 0;
function go() {
  while (live < 4 && next < jobs.length) {
    const [map, a, b] = jobs[next++]; live++;
    const c = fork(__filename, ['--one', map, a, b, String(seed), String(maxT), b5c, ref]);
    c.on('message', m => { out.push(m); console.log(JSON.stringify(m)); });
    c.on('exit', () => { live--; if (out.length === jobs.length) done(); else go(); });
  }
}
function done() {
  const nm = m => m.winner == null || m.winner < 0 ? 'draw/unfinished' : m.f[m.winner];
  out.sort((x, y) => (x.map + x.f).localeCompare(y.map + y.f));
  console.log(`b5c ${b5c} | errors: ${out.filter(m => m.err).length} of ${out.length} | identical to the reference: ${out.filter(m => m.same).length} of ${out.length} | state checks: ${out.reduce((a, m) => a + m.checks, 0)} | b5c ${b5c} in every run: ${out.every(m => m.b5c.every(x => !!x === (b5c === 'on')))} | versions ${out[0].vers.join(' vs ')}`);
  for (const m of out) console.log(`${m.map.padEnd(9)} ${m.f.join(' vs ').padEnd(22)} ${String(m.t).padStart(7)} s  winner ${nm(m)}${m.same ? '' : '  DIFFERENT'}${m.err ? '  ERROR' : ''}`);
}
go();
