// Batch 6g (v2.97): the scenario runs behind the before/after numbers (audit/logs-p1/b6g/). Each match runs through
// audit/sim/audit6a.js --one with the batch 6g counters (EE_B6G, audit/sim/b6g-instrument.js).
//   node audit/sim/b6g-scen.js --set nodes  [--rw b6g=0] [--out dir] [--jobs 3]   Last Fist vs Bloomhost on Two-Lane and Three-Lane,
//        both sides, every personality pair (36): the Last Fist side takes its own half's nodes and turrets every forward pad it
//        holds as soon as it can pay (EE_B6G_FORCE=lfturret, audit only; the Last Fist AI's own logic is untouched)
//   node audit/sim/b6g-scen.js --set player [--rw b6g=0] ...   an Axiarch scripted player (EE_B6G_PLAYER: the AI's macro, the
//        units under direct control: Attack when the AI attacks, Retreat when it stops) on the left against Last Fist and
//        Bloomhost on every map and every enemy personality (18)
// EE_HTML=<file> runs another build (the v2.96 baseline). Writes <out>/matches.jsonl (resumable).
const { fork } = require('child_process'), fs = require('fs'), path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const set = arg('set', 'nodes'), rw = arg('rw', ''), J = +arg('jobs', '3'), P = ['boomer', 'economist', 'turtle'];
const out = arg('out', path.join(__dirname, '..', 'logs-p1', 'b6g', set + (rw.includes('b6g=0') ? '-before' : '-after')));
fs.mkdirSync(out, { recursive: true });
const jobs = [];
if (set === 'nodes') { let k = 0; for (const map of ['twolane', 'threelane']) for (const lfSide of [0, 1]) for (const pl of P) for (const pb of P) { const seed = 700 + (k++ % 18); jobs.push({ map, f0: lfSide ? 'bloomhost' : 'lastfist', f1: lfSide ? 'lastfist' : 'bloomhost', p0: lfSide ? pb : pl, p1: lfSide ? pl : pb, seed, env: { EE_B6G_FORCE: 'lfturret' } }); } }
if (set === 'player') { let k = 0; for (const map of ['classic', 'twolane', 'threelane']) for (const opp of ['lastfist', 'bloomhost']) for (const pb of P) jobs.push({ map, f0: 'axiarchs', f1: opp, p0: 'economist', p1: pb, seed: 800 + k++, env: { EE_B6G_PLAYER: '0' } }); }
const key = j => [j.map, j.f0, j.f1, j.seed, j.p0, j.p1].join();
const file = path.join(out, 'matches.jsonl'), done = new Set();
if (fs.existsSync(file)) for (const l of fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)) { const m = JSON.parse(l); done.add([m.map, m.f[0], m.f[1], m.seed, m.sides[0].persona, m.sides[1].persona].join()); }
const todo = jobs.filter(j => !done.has(key(j)));
console.log(`${set}: ${jobs.length} matches, ${todo.length} to run, ${J} at a time${rw ? ', rw ' + rw : ''}${process.env.EE_HTML ? ', build ' + process.env.EE_HTML : ''}`);
let next = 0, n = 0, live = 0; const t0 = Date.now();
(function go() {
  while (live < J && next < todo.length) {
    const j = todo[next++]; live++;
    const c = fork(path.join(__dirname, 'audit6a.js'), ['--one', j.map, j.f0, j.f1, String(j.seed), '1700', '0', rw, j.p0, j.p1], { env: Object.assign({}, process.env, { EE_B6G: '1' }, j.env) });
    c.on('message', m => { m.set = set; fs.appendFileSync(file, JSON.stringify(m) + '\n'); n++; console.log(`${n}/${todo.length} ${((Date.now() - t0) / 60000).toFixed(1)} min ${m.map} ${m.f.join(' vs ')} seed ${m.seed}: ${m.t} s, winner ${m.winner == null || m.winner < 0 ? 'none' : m.f[m.winner]}${m.err ? ' ERROR ' + m.err.slice(0, 200) : ''}`); });
    c.on('exit', () => { live--; go(); });
  }
})();
