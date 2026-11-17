// v2.88 (faction rework batch 5b, the Bloomhost swarm pass): Hard vs Hard self-play on Classic, Two-Lane and Three-Lane, all six
// faction pairings (side order counts), to the end (or maxT). Counts what the Bloomhost AI did with the swarm (side.sw5, kept by
// the SIM: broods hatched and refunded Skitterlings, units reaching full swarm surge, kill frenzies and the units in them, Spitter
// quills and volleys, quills and Needlewing strikes on aircraft), the Bloomhost units trained, its Larva Pit and Bloomspire paths,
// and the most Bloomhost units it had alive at once.
// --force: every Bloomhost AI takes Acidic Evolution and Swarm Bloom (the forcePath hook), and at 7:00 each side gets air to fight:
// the Bloomhost side 4 Needlewings and 2 Spitters, the other side 2 of its faction's ground-attack flyers (Gunships, Wraithwings),
// which the AIs then command, so the anti-air answers show.
// Usage: node audit/sim/selfplay-5b.js [seed] [maxT] [--force]  (runs 4 matches at a time)
const { fork } = require('child_process');
const KEYS = ['broods', 'hatched', 'refund', 'surgeMax', 'frenzy', 'frenzyUnits', 'quill', 'quillAir', 'volleys', 'needleAir'], UNITS = ['skitterling', 'spitter', 'needlewing', 'cloudwing', 'razorwing', 'thornback', 'dreadthorn'];
if (process.argv[2] === '--one') {
  const [map, f0, f1, seed, maxT, force] = process.argv.slice(3);
  const { loadSim } = require('./load');
  const S = loadSim(+seed);
  let err = null, n = {}, g, peak = 0; const paths = new Set();
  try {
    g = S.newGame('hard', { seed: +seed, map, autoPlayer: true, autoDiff: 'hard', factions: [f0, f1] }); g.countdown = 0;
    if (force === '1') g.forcePath = [0, 1].map(s => g.sides[s].faction === 'bloomhost' ? { barracks: 'B', techlab: 'A' } : {});
    const FU = { lastfist: ['aircraft', 'aircraft'], axiarchs: ['wraithwing', 'wraithwing'], bloomhost: ['needlewing', 'needlewing', 'needlewing', 'needlewing', 'spitter', 'spitter'] }; let seeded = false;
    let k = 0;
    while (!g.over && g.t < +maxT) {
      if (force === '1' && !seeded && g.t >= 420) { seeded = true; for (const s of [0, 1]) for (const t of FU[g.sides[s].faction]) S.spawnUnit(g, s, t, S.rallyU(s, g), 0); }
      S.update(g, 1 / 30);
      g.events.length = 0;
      if (++k % 15 === 0) {
        for (const e of g.ents) if (e.kind === 'b' && e.hp > 0 && e.path && ['barracks', 'factory', 'techlab'].includes(e.type)) paths.add(`${g.sides[e.side].faction}:${e.type}:${e.path}`);
        for (const s of [0, 1]) if (g.sides[s].faction === 'bloomhost') peak = Math.max(peak, g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0).length);
      }
    }
  } catch (e) { err = String(e && e.stack || e); }
  const tr = {}; if (g) for (const s of [0, 1]) { if (g.sides[s].faction !== 'bloomhost') continue; for (const t of UNITS) { const c = g.log.tot[s].trained[t]; if (c) tr[t] = (tr[t] || 0) + c; } const c = g.sides[s].sw5 || {}; for (const k of KEYS) if (c[k]) n[k] = (n[k] || 0) + c[k]; }
  const air = g ? [0, 1].some(s => g.sides[s].faction !== 'bloomhost' && Object.keys(g.log.tot[s].trained).some(t => S.UDEF[t].air && S.UDEF[t].weapon)) : false;
  process.send({ map, f: [f0, f1], t: g ? Math.round(g.t) : 0, over: g && g.over, winner: g ? g.winner : null, n, tr, peak, air, paths: [...paths], err });
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
  console.log('errors:', out.filter(m => m.err).length, 'of', out.length, '| swarm:', JSON.stringify(tot), '| Bloomhost trained:', JSON.stringify(tr));
  for (const k of KEYS) console.log(k, 'in', out.filter(m => m.n[k]).length, 'matches');
  const bh = out.filter(m => m.f.includes('bloomhost')); console.log('Bloomhost wins', bh.filter(m => m.winner != null && m.f[m.winner] === 'bloomhost').length, 'of', bh.length, '| draws/unfinished', bh.filter(m => m.winner == null || m.winner < 0).length, '| enemy trained ground-attack aircraft in', bh.filter(m => m.air).length);
  console.log('paths taken:', [...paths].sort().join(' '));
}
go();
