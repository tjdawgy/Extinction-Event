// v2.89 (batch 5a: Last Fist art and the Marine rename, no gameplay change): Hard vs Hard self-play on Classic, Two-Lane and
// Three-Lane, all six faction pairings (side order counts), to the end (or maxT), each match played twice: once on this
// build's SIM and once on another build's (default: v2.88's index.html from git, a965561). The match state (serialize, less
// the match log and stats, which hold display text such as unit names) is hashed every 100 ticks; every hash, the winner and
// the end time must be identical, and neither run may throw.
// Usage: node audit/sim/selfplay-5a.js [seed] [maxT] [--ref path/to/old/index.html]   (runs 4 matches at a time)
const { fork, execSync } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
if (process.argv[2] === '--one') {
  const [map, f0, f1, seed, maxT, file] = process.argv.slice(3);
  const { loadSim } = require('./load');
  const run = f => {
    const S = loadSim(+seed, f ? { file: f } : {}); let err = null, g, hs = [], k = 0;
    try {
      g = S.newGame('hard', { seed: +seed, map, autoPlayer: true, autoDiff: 'hard', factions: [f0, f1] }); g.countdown = 0;
      while (!g.over && g.t < +maxT) {
        S.update(g, 1 / 30); g.events.length = 0;
        if (++k % 100 === 0) { const o = JSON.parse(S.serialize(g, {})); delete o.log; delete o.stats; hs.push(crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 12)); }
      }
    } catch (e) { err = String(e && e.stack || e); }
    return { t: g ? Math.round(g.t * 100) / 100 : 0, over: !!(g && g.over), winner: g ? g.winner : null, hs, err, ver: S.VERSION };
  };
  const a = run(null), b = run(file);
  const same = a.t === b.t && a.winner === b.winner && a.hs.length === b.hs.length && a.hs.every((h, i) => h === b.hs[i]);
  process.send({ map, f: [f0, f1], t: a.t, winner: a.winner, over: a.over, checks: a.hs.length, same, err: a.err || b.err, vers: [a.ver, b.ver] });
  process.exit(0);
}
const pos = process.argv.slice(2).filter((x, i, A) => !x.startsWith('--') && A[i - 1] !== '--ref');
const seed = +(pos[0] || 7), maxT = +(pos[1] || 1700);
let ref = process.argv.includes('--ref') ? path.resolve(process.argv[process.argv.indexOf('--ref') + 1]) : null;
if (!ref) { ref = path.join(os.tmpdir(), 'ee-v288-index.html'); fs.writeFileSync(ref, execSync('git show a965561:index.html', { cwd: path.join(__dirname, '..', '..'), maxBuffer: 1 << 26 })); }
const F = ['lastfist', 'bloomhost', 'axiarchs'], jobs = [];
for (const map of ['classic', 'twolane', 'threelane']) for (const a of F) for (const b of F) if (a !== b) jobs.push([map, a, b]);
const out = []; let next = 0, live = 0;
function go() {
  while (live < 4 && next < jobs.length) {
    const [map, a, b] = jobs[next++]; live++;
    const c = fork(__filename, ['--one', map, a, b, String(seed), String(maxT), ref]);
    c.on('message', m => { out.push(m); console.log(JSON.stringify(m)); });
    c.on('exit', () => { live--; if (out.length === jobs.length) done(); else go(); });
  }
}
function done() {
  const nm = m => m.winner == null || m.winner < 0 ? 'draw/unfinished' : m.f[m.winner];
  console.log(`errors: ${out.filter(m => m.err).length} of ${out.length} | identical to the reference: ${out.filter(m => m.same).length} of ${out.length} | state checks: ${out.reduce((a, m) => a + m.checks, 0)}`);
  for (const m of out.sort((x, y) => (x.map + x.f).localeCompare(y.map + y.f))) console.log(`${m.map.padEnd(9)} ${m.f.join(' vs ').padEnd(22)} ${String(m.t).padStart(7)} s  winner ${nm(m)}${m.same ? '' : '  DIFFERENT'}`);
}
go();
