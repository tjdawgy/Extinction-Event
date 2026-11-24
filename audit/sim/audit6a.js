// Batch 6a (balance audit, v2.91, measurement only): large Hard vs Hard self-play. All six faction pairings (both side
// orders, so spawn side is covered), Classic, Two-Lane and Three-Lane, seeds 7-11: 90 matches, every REWORK switch at its
// default (on), normal play (nothing forced or spawned), stepped at the game's own TICK (1/60 s) to the end (or maxT).
// Per match it records the winner and how, the length, per side: tier times (the first non-HQ building to finish T2 and
// T3, the first unit of a T3 unlock, the first T3 aircraft), path picks per building (the first path each building role
// took, and every one taken), units trained per type, credits+energy spent per type, and (audit/sim/audit6a-instrument.js)
// damage dealt, kills and killed value per unit or building type.
//   node audit/sim/audit6a.js [--seeds 7-11] [--maps classic,twolane,threelane] [--maxT 1700] [--jobs 4] [--out dir] [--rw b6art=0,b6side=1]
//        writes <out>/matches.jsonl (one line per match) and prints progress; audit/sim/audit6a-report.js makes the tables.
//   node audit/sim/audit6a.js --identity [--seeds 7] [--maps classic]   each match twice, with and without the
//        instrumentation, the state hashed every 100 ticks: they must be identical (the counters change nothing).
const { fork } = require('child_process'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const INSTR = require('./audit6a-instrument');
if (process.argv[2] === '--one') {
  const [map, f0, f1, seed, maxT, ident, rwArg, p0, p1] = process.argv.slice(3); // v2.93 (batch 6c): p0, p1 force each side's personality (audit only: newGame's autoPersona / persona options)
  const RW = {}; for (const kv of (rwArg || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); RW[k] = v !== '0' && v !== 'false'; } // v2.92 (batch 6b): --rw b6art=0 etc.
  const { loadSim } = require('./load');
  const play = instr => {
    const S = loadSim(+seed, instr ? { instrument: INSTR } : {}); Object.assign(S.REWORK, RW); if (process.env.EE_B6C && S.B6C) Object.assign(S.B6C, JSON.parse(process.env.EE_B6C)); for (const [k, V] of [['EE_B6AI', S.B6AI], ['EE_B6D', S.B6D]]) if (process.env[k] && V) { const o = JSON.parse(process.env[k]); for (const f in o) if (o[f] && typeof o[f] === 'object' && !Array.isArray(o[f]) && V[f]) Object.assign(V[f], o[f]); else V[f] = o[f]; } // v2.94: EE_B6AI='{"eco":{"cap":500}}' tries batch 6d values // v2.93: EE_B6C='{"latchDps":20}' tries batch 6c numbers
    const g = S.newGame('hard', { seed: +seed, map, autoPlayer: true, autoDiff: 'hard', factions: [f0, f1], autoPersona: p0 || undefined, persona: p1 || undefined }); g.countdown = 0;
    const R = { tier: [{}, {}], paths: [{}, {}], t3u: [null, null], t3air: [null, null], peakUnits: [0, 0] };
    let k = 0, err = null; const hs = [];
    const T3 = new Set(), T2 = new Set();
    for (const t of S.UNIT_ORDER) { const tr = S.treeOf(S.UDEF[t].fac || 'lastfist', S.UDEF[t].from); if (!tr) continue; for (const P of ['A', 'B']) tr[P].steps.forEach((st, i) => { if (st && st.unlock && st.unlock.includes(t)) (i >= 3 ? T3 : T2).add(t); }); }
    const seen = [new Set(), new Set()];
    // v2.94 (batch 6d, A1): per-side time series read once a game second (read only: nothing here changes play). idle: seconds
    // a finished production building stood with an empty queue (not upgrading) while its side had supply room; float: seconds
    // with 1000+ credits banked; atk: seconds the side's stance was attack; per minute: bank, army value, own HQ-side share
    const PROD = new Set(['barracks', 'factory', 'techlab']);
    R.ser = [0, 1].map(() => ({ idle: 0, idleB: 0, float: 0, float2: 0, atk: 0, armyM: [], bankM: [], incM: [], popM: [], eM: [] })); // eM (v2.95, batch 6e B2): energy banked each minute
    try {
      while (!g.over && g.t < +maxT) {
        S.update(g, S.TICK);
        g.events.length = 0;
        if (++k % 60 === 0) { // once a game second
          const n = [0, 0];
          for (const e of g.ents) {
            if (e.hp <= 0) continue;
            if (e.kind === 'u') { n[e.side]++; if (!seen[e.side].has(e.id)) { seen[e.side].add(e.id); if (T3.has(e.type) && !e.temp) { if (R.t3u[e.side] == null) R.t3u[e.side] = g.t; if (S.UDEF[e.type].air && R.t3air[e.side] == null) R.t3air[e.side] = g.t; } } continue; }
            if (e.kind !== 'b' || !e.built || e.type === 'hq') continue;
            const T = R.tier[e.side]; for (const tt of [2, 3]) if (e.tier >= tt && T[tt] == null) T[tt] = g.t;
            if (e.path) { const P = R.paths[e.side], key = e.type + ':' + e.id; if (!P[key]) P[key] = { type: e.type, path: e.path, t: g.t, name: (S.treeOf(g.sides[e.side].faction, e.type) || {})[e.path]?.name || e.path }; }
          }
          for (let s = 0; s < 2; s++) R.peakUnits[s] = Math.max(R.peakUnits[s], n[s]);
          for (let s = 0; s < 2; s++) {
            const Z = R.ser[s], sd = g.sides[s], room = S.popUsed(g, s) < S.popCap(g, s) - 2;
            let pb = 0, ib = 0; for (const b of g.ents) if (b.kind === 'b' && b.side === s && b.hp > 0 && b.built && PROD.has(b.type)) { pb++; if (!b.queue.length && !b.upgrading && room) ib++; }
            if (ib) Z.idle++; Z.idleB += ib; if (sd.res.c >= 1000) Z.float++; if (sd.res.c >= 2000) Z.float2++; if (sd.stance === 'attack') Z.atk++;
            if (k % 3600 === 0) { const inc = S.income(g, s); Z.bankM.push(Math.round(sd.res.c)); Z.eM.push(Math.round(sd.res.e)); Z.incM.push(Math.round(inc.c + inc.e)); Z.popM.push([S.popUsed(g, s), S.popCap(g, s)]);
              let v = 0; for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && !e.temp) { const c = S.rwD(g, e.type).cost; v += c.c + c.e; } Z.armyM.push(v); }
          }
        }
        if (ident === '1' && k % 100 === 0) { const o = JSON.parse(S.serialize(g, {})); delete o.log; delete o.stats; hs.push(crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 12)); }
      }
    } catch (e) { err = String(e && e.stack || e); }
    return { S, g, R, err, hs };
  };
  if (ident === '1') {
    const a = play(false), b = play(true);
    const same = a.g.t === b.g.t && a.g.winner === b.g.winner && a.hs.length === b.hs.length && a.hs.every((h, i) => h === b.hs[i]);
    process.send({ map, f: [f0, f1], seed: +seed, t: a.g.t, winner: a.g.winner, checks: a.hs.length, same, err: a.err || b.err });
    process.exit(0);
  }
  const { S, g, R, err } = play(true);
  const A = S.a6, sides = [0, 1].map(s => {
    const tot = g.log.tot[s], fac = g.sides[s].faction, trained = tot.trained, spentBy = {};
    for (const [t, n] of Object.entries(trained)) { const c = S.rwD(g, t).cost; spentBy[t] = n * (c.c + c.e); }
    const paths = Object.values(R.paths[s]).map(p => ({ type: p.type, path: p.path, name: p.name, t: Math.round(p.t) }));
    return { fac, trained, lost: tot.lost, spentBy, spentU: tot.spent.u, spentB: tot.spent.b, spentUp: tot.spent.up, earn: tot.earn,
      dmg: A.dmg[s], dmgB: A.dmgB[s], mat: A.mat ? A.mat[s] : null, kills: A.kills[s], kval: A.kval[s], tier2: R.tier[s][2] ?? null, tier3: R.tier[s][3] ?? null,
      t3unit: R.t3u[s], t3air: R.t3air[s], paths, peak: R.peakUnits[s], persona: g.sides[s].persona ? g.sides[s].persona.kind : null, salv: [tot.salv || 0, tot.salvE || 0, tot.od || 0], // v2.94: Salvage credits, energy, Overdrive starts
      ser: Object.assign(R.ser[s], { strat: (g.stats.sides[s].strat || []), bBuilt: g.stats.sides[s].bBuilt, firstAttack: (g.sides[s].aiLog || {}).firstAttack ?? null, attacks: (g.sides[s].aiLog || {}).attacks || 0, c10: g.stats.sides[s].c, e10: g.stats.sides[s].e, army10: g.stats.sides[s].army }), paths0: g.sides[s].persona ? g.sides[s].persona.paths : null, bLost: tot.bLost };
  });
  (process.send ? process.send.bind(process) : m => console.log(JSON.stringify(m)))({ b6c: S.B6C ? Object.assign({}, S.B6C) : null, map, f: [f0, f1], seed: +seed, t: Math.round(g.t * 10) / 10, over: !!g.over, winner: g.over ? g.winner : null, how: g.result ? g.result.how : null,
    by: g.result ? g.result.by || g.result.reason || null : null, err, ver: S.VERSION, rw: g.rw, sides });
  process.exit(0);
}
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const ident = process.argv.includes('--identity') ? '1' : '0';
const sr = arg('seeds', ident === '1' ? '7' : '7-11').split('-').map(Number), seeds = []; for (let s = sr[0]; s <= (sr[1] ?? sr[0]); s++) seeds.push(s);
const maps = arg('maps', ident === '1' ? 'classic' : 'classic,twolane,threelane').split(','), maxT = arg('maxT', '1700'), J = +arg('jobs', '4');
const out = arg('out', path.join(__dirname, '..', 'logs-p1', 'audit6a-v291'));
fs.mkdirSync(out, { recursive: true });
const F = ['lastfist', 'bloomhost', 'axiarchs'], jobs = [];
for (const seed of seeds) for (const map of maps) for (const a of F) for (const b of F) if (a !== b) jobs.push([map, a, b, seed]);
const file = path.join(out, ident === '1' ? 'identity.jsonl' : 'matches.jsonl');
const done = new Set(); if (ident !== '1' && fs.existsSync(file)) for (const l of fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)) { const m = JSON.parse(l); done.add([m.map, m.f[0], m.f[1], m.seed].join()); }
const todo = jobs.filter(j => !done.has(j.join()));
console.log(`${jobs.length} matches, ${jobs.length - todo.length} already in ${file}, ${todo.length} to run, ${J} at a time`);
let next = 0, live = 0, n = 0; const t0 = Date.now();
function go() {
  while (live < J && next < todo.length) {
    const [map, a, b, seed] = todo[next++]; live++;
    const c = fork(__filename, ['--one', map, a, b, String(seed), maxT, ident, arg('rw', '')]);
    c.on('message', m => { fs.appendFileSync(file, JSON.stringify(m) + '\n'); n++;
      console.log(`${n}/${todo.length} ${((Date.now() - t0) / 60000).toFixed(1)} min  ${m.map} ${m.f.join(' vs ')} seed ${m.seed}: ${m.t} s, winner ${m.winner == null || m.winner < 0 ? 'none' : m.f[m.winner]}${m.how ? ' (' + m.how + ')' : ''}${ident === '1' ? (m.same ? ' identical' : ' DIFFERENT') : ''}${m.err ? ' ERROR ' + m.err.slice(0, 200) : ''}`); });
    c.on('exit', () => { live--; go(); });
  }
}
go();
