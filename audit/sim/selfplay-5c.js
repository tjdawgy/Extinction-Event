// v2.90 (faction rework batch 5c: Axiarch art, the Needlewing AI fix, the Medevac rename): Hard vs Hard self-play on Classic,
// Two-Lane and Three-Lane, all six faction pairings (side order counts), to the end (or maxT). Normal play: no forced paths, no
// spawned units.
//   node audit/sim/selfplay-5c.js [seed] [maxT]               b5c on: per match the Bloomhost AI's Bloomspire roll (side.sw5c:
//        swarm / apex, and whether enemy air was expected when it rolled), the Bloomspire path it built, Needlewings trained and their
//        strikes on aircraft (side.sw5 needleAir), quills at aircraft, enemy aircraft trained, the winner.
//   node audit/sim/selfplay-5c.js [seed] [maxT] --identity [--ref old.html]   b5c off on this build against another build's SIM
//        (default v2.89's index.html from git, 2d80977): the match state (serialize, less the match log and stats) hashed every 100
//        ticks; every hash, the winner and the end time must match, and neither run may throw (as audit/sim/selfplay-5a.js).
// Runs 4 matches at a time.
const { fork, execSync } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
if (process.argv[2] === '--one') {
  const [map, f0, f1, seed, maxT, ident, file] = process.argv.slice(3);
  const { loadSim } = require('./load');
  const run = (f, off) => {
    const S = loadSim(+seed, f ? { file: f } : {}); if (off && S.REWORK) S.REWORK.b5c = false;
    let err = null, g, hs = [], k = 0; const paths = new Set();
    try {
      g = S.newGame('hard', { seed: +seed, map, autoPlayer: true, autoDiff: 'hard', factions: [f0, f1] }); g.countdown = 0;
      while (!g.over && g.t < +maxT) {
        S.update(g, 1 / 30); g.events.length = 0;
        if (++k % 100 === 0) {
          if (ident === '1') { const o = JSON.parse(S.serialize(g, {})); delete o.log; delete o.stats; hs.push(crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 12)); }
          for (const e of g.ents) if (e.kind === 'b' && e.hp > 0 && e.path && e.type === 'techlab' && g.sides[e.side].faction === 'bloomhost') paths.add(e.path === 'A' ? 'Swarm Bloom' : 'Apex Bloom');
        }
      }
    } catch (e) { err = String(e && e.stack || e); }
    const bh = g ? [0, 1].find(s => g.sides[s].faction === 'bloomhost') : undefined, B = bh != null ? g.sides[bh] : null, tr = bh != null ? g.log.tot[bh].trained : {};
    const foeAir = g && bh != null ? Object.entries(g.log.tot[1 - bh].trained).filter(([t]) => S.UDEF[t].air && S.UDEF[t].weapon).reduce((a, [, c]) => a + c, 0) : 0;
    return { t: g ? Math.round(g.t * 100) / 100 : 0, over: !!(g && g.over), winner: g ? g.winner : null, hs, err, ver: S.VERSION, rw: g && g.rw,
      bh: B ? { roll: B.sw5c || {}, paths: [...paths], needle: tr.needlewing || 0, cloud: tr.cloudwing || 0, needleAir: (B.sw5 || {}).needleAir || 0, quillAir: (B.sw5 || {}).quillAir || 0, foeAir } : null };
  };
  if (ident === '1') {
    const a = run(null, true), b = run(file, false);
    const same = a.t === b.t && a.winner === b.winner && a.hs.length === b.hs.length && a.hs.every((h, i) => h === b.hs[i]);
    process.send({ map, f: [f0, f1], t: a.t, winner: a.winner, checks: a.hs.length, same, err: a.err || b.err, vers: [a.ver, b.ver], b5c: a.rw && a.rw.b5c });
  } else { const a = run(null, false); process.send({ map, f: [f0, f1], t: a.t, winner: a.winner, over: a.over, err: a.err, b5c: a.rw && a.rw.b5c, bh: a.bh }); }
  process.exit(0);
}
const pos = process.argv.slice(2).filter((x, i, A) => !x.startsWith('--') && A[i - 1] !== '--ref');
const seed = +(pos[0] || 7), maxT = +(pos[1] || 1700), ident = process.argv.includes('--identity') ? '1' : '0';
let ref = process.argv.includes('--ref') ? path.resolve(process.argv[process.argv.indexOf('--ref') + 1]) : '';
if (ident === '1' && !ref) { ref = path.join(os.tmpdir(), 'ee-v289-index.html'); fs.writeFileSync(ref, execSync('git show 2d80977:index.html', { cwd: path.join(__dirname, '..', '..'), maxBuffer: 1 << 26 })); }
const F = ['lastfist', 'bloomhost', 'axiarchs'], jobs = [];
for (const map of ['classic', 'twolane', 'threelane']) for (const a of F) for (const b of F) if (a !== b) jobs.push([map, a, b]);
const out = []; let next = 0, live = 0;
function go() {
  while (live < 4 && next < jobs.length) {
    const [map, a, b] = jobs[next++]; live++;
    const c = fork(__filename, ['--one', map, a, b, String(seed), String(maxT), ident, ref]);
    c.on('message', m => { out.push(m); console.log(JSON.stringify(m)); });
    c.on('exit', () => { live--; if (out.length === jobs.length) done(); else go(); });
  }
}
function done() {
  const nm = m => m.winner == null || m.winner < 0 ? 'draw/unfinished' : m.f[m.winner];
  out.sort((x, y) => (x.map + x.f).localeCompare(y.map + y.f));
  if (ident === '1') {
    console.log(`errors: ${out.filter(m => m.err).length} of ${out.length} | identical to the reference: ${out.filter(m => m.same).length} of ${out.length} | state checks: ${out.reduce((a, m) => a + m.checks, 0)} | b5c off in every run: ${out.every(m => m.b5c === false)}`);
    for (const m of out) console.log(`${m.map.padEnd(9)} ${m.f.join(' vs ').padEnd(22)} ${String(m.t).padStart(7)} s  winner ${nm(m)}${m.same ? '' : '  DIFFERENT'}`);
    return;
  }
  console.log(`errors: ${out.filter(m => m.err).length} of ${out.length} | b5c on in every match: ${out.every(m => m.b5c === true)}`);
  console.log('map       match                  end (s)  Bloomspire roll (air expected)  built           Needlewings  strikes on aircraft  quills at aircraft  enemy aircraft trained  winner');
  const T = { swarm: 0, apex: 0, none: 0, airExp: 0, needle: 0, needleAir: 0, nMatch: 0, wins: 0, losses: 0, draws: 0 };
  for (const m of out.filter(m => m.bh)) {
    const r = m.bh.roll, roll = r.swarm ? 'Swarm Bloom' : r.apex ? 'Apex Bloom' : '(no T2 Bloomspire)';
    if (r.swarm) T.swarm++; else if (r.apex) T.apex++; else T.none++; if (r.airExp) T.airExp++;
    T.needle += m.bh.needle; T.needleAir += m.bh.needleAir; if (m.bh.needleAir) T.nMatch++;
    const w = nm(m); if (w === 'bloomhost') T.wins++; else if (w === 'draw/unfinished') T.draws++; else T.losses++;
    console.log(`${m.map.padEnd(9)} ${m.f.join(' vs ').padEnd(22)} ${String(m.t).padStart(7)}  ${(roll + (r.swarm || r.apex ? (r.airExp ? ' (yes)' : ' (no)') : '')).padEnd(31)} ${(m.bh.paths.join(', ') || '-').padEnd(15)} ${String(m.bh.needle).padStart(11)}  ${String(m.bh.needleAir).padStart(19)}  ${String(m.bh.quillAir).padStart(18)}  ${String(m.bh.foeAir).padStart(22)}  ${w}`);
  }
  console.log(`Bloomspire rolls: Swarm Bloom ${T.swarm}, Apex Bloom ${T.apex}, no T2 Bloomspire ${T.none} (air expected at ${T.airExp} of the rolls) | Needlewings trained ${T.needle}, strikes on aircraft ${T.needleAir} in ${T.nMatch} matches | Bloomhost won ${T.wins}, lost ${T.losses}, draws/unfinished ${T.draws} of ${T.wins + T.losses + T.draws}`);
  for (const m of out.filter(m => !m.bh)) console.log(`${m.map.padEnd(9)} ${m.f.join(' vs ').padEnd(22)} ${String(m.t).padStart(7)}  (no Bloomhost)  winner ${nm(m)}`);
}
go();
