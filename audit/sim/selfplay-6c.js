// Batch 6c (v2.93), Part A1: persona-balanced Hard vs Hard self-play. Since batch 6b each AI's personality is rolled from
// its own stream (seed and faction), so a run over a few seeds gives each faction only a handful of personality draws. This
// design sets the personalities from the harness instead (newGame's autoPersona / persona options; no game code changes):
// every faction plays every personality of Hard's pool (the union of its per-faction kinds: boomer, economist, turtle)
// equally often, against every personality of the other faction, on every map, against every opponent faction, from both
// sides: 3 maps × 6 ordered faction pairings × 3 × 3 personality pairs = 162 matches. A match and its mirror (the same two
// factions with the same personalities, sides swapped) share a seed. Every REWORK switch at its default unless --rw says.
//   node audit/sim/selfplay-6c.js [--out dir] [--rw b6hq=0,b6c=0] [--jobs 4] [--maxT 1700] [--maps classic,twolane,threelane]
// Each match runs through audit/sim/audit6a.js --one (the 6a instrumentation: tiers, paths, units, damage, kills).
// Writes <out>/matches.jsonl (resumable); audit/sim/selfplay-6c-report.js makes the tables.
const { fork } = require('child_process'), fs = require('fs'), path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const F = ['lastfist', 'bloomhost', 'axiarchs'], P = ['boomer', 'economist', 'turtle'];
const MAPS = arg('maps', 'classic,twolane,threelane').split(','), ALLMAPS = ['classic', 'twolane', 'threelane'];
const out = arg('out', path.join(__dirname, '..', 'logs-p1', 'selfplay6c-a1')), maxT = arg('maxT', '1700'), J = +arg('jobs', '4'), rw = arg('rw', '');
fs.mkdirSync(out, { recursive: true });
const jobs = [];
for (const map of MAPS) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (a !== b) for (let pa = 0; pa < 3; pa++) for (let pb = 0; pb < 3; pb++) {
  // the seed belongs to the unordered pairing, the map and each faction's personality, so a match and its mirror share it
  const [lo, hi, plo, phi] = a < b ? [a, b, pa, pb] : [b, a, pb, pa];
  const pairIdx = lo === 0 ? hi - 1 : 2; // LF-BH 0, LF-AX 1, BH-AX 2
  const seed = 600 + pairIdx * 27 + ALLMAPS.indexOf(map) * 9 + plo * 3 + phi;
  jobs.push({ map, f0: F[a], f1: F[b], p0: P[pa], p1: P[pb], seed });
}
const key = j => [j.map, j.f0, j.f1, j.seed, j.p0, j.p1].join();
const file = path.join(out, 'matches.jsonl'), done = new Set();
if (fs.existsSync(file)) for (const l of fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)) { const m = JSON.parse(l); done.add([m.map, m.f[0], m.f[1], m.seed, m.sides[0].persona, m.sides[1].persona].join()); }
const todo = jobs.filter(j => !done.has(key(j)));
console.log(`${jobs.length} matches, ${jobs.length - todo.length} already in ${file}, ${todo.length} to run, ${J} at a time${rw ? ', rw ' + rw : ''}`);
let next = 0, n = 0, live = 0; const t0 = Date.now();
function go() {
  while (live < J && next < todo.length) {
    const j = todo[next++]; live++;
    const c = fork(path.join(__dirname, 'audit6a.js'), ['--one', j.map, j.f0, j.f1, String(j.seed), maxT, '0', rw, j.p0, j.p1]);
    c.on('message', m => { m.design = '6c-persona'; fs.appendFileSync(file, JSON.stringify(m) + '\n'); n++;
      console.log(`${n}/${todo.length} ${((Date.now() - t0) / 60000).toFixed(1)} min  ${m.map} ${m.f.join(' vs ')} (${j.p0}/${j.p1}) seed ${m.seed}: ${m.t} s, winner ${m.winner == null || m.winner < 0 ? 'none' : m.f[m.winner]}${m.how ? ' (' + m.how + ')' : ''}${m.err ? ' ERROR ' + m.err.slice(0, 200) : ''}`); });
    c.on('exit', () => { live--; go(); });
  }
}
go();
