// Batch 6e (v2.95), Part A1: how each AI spreads its army over the lanes (read only: nothing here changes play).
// Runs the lane-map half of the persona-balanced design (audit/sim/selfplay-6c.js: Two-Lane and Three-Lane, every ordered
// faction pairing, every personality pair; the same seeds) and records, per side, every 10 game seconds: stance, its army
// value per lane by position and by assignment (u.lane), the enemy's per lane by position, node owners; and every unit
// it loses (time, value, lane, its own and the enemy's army value within LOCAL of the spot, both sides' totals), every
// building it loses (time, type, lane, forward pad or not).
//   node audit/sim/lanes6e.js [--out dir] [--rw b6elane=1] [--jobs 4] [--maps twolane,threelane] [--facs axiarchs]
// Writes <out>/lanes.jsonl (resumable); audit/sim/lanes6e-report.js makes the tables.
const { fork } = require('child_process'), fs = require('fs'), path = require('path');
const LOCAL = 300;
if (process.argv[2] === '--one') {
  const [map, f0, f1, seed, maxT, rwArg, p0, p1] = process.argv.slice(3);
  const RW = {}; for (const kv of (rwArg || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); RW[k] = v !== '0' && v !== 'false'; }
  const { loadSim } = require('./load');
  const INSTR = `(function(){ const T = this.__sim.tr6e = { loss: [[], []], bl: [[], []] }; const kl = kill, sp = spawnUnit, BORN = new WeakMap();
    spawnUnit = function (g) { const u = sp.apply(this, arguments); BORN.set(u, g.t); return u; };
    kill = function (g, e, by, weapon) {
      if (!e.dead && (e.side === 0 || e.side === 1) && !g.range) {
        const s = e.side, ln = e.v !== undefined ? laneOfPt(e.u, e.v) : -1;
        if (e.kind === 'u' && !e.temp) {
          const v = armyValue([e]); let own = 0, foe = 0, tOwn = 0, tFoe = 0;
          for (const x of g.ents) { if (x.kind !== 'u' || x.hp <= 0 || x.dead || x === e || x.temp || UDEF[x.type].support) continue; const a = armyValue([x]);
            if (x.side === s) tOwn += a; else if (x.side === 1 - s) tFoe += a; else continue;
            if (Math.hypot(x.u - e.u, (x.v - e.v)) < ${LOCAL}) { if (x.side === s) own += a; else foe += a; } }
          const gr = g.ents.filter(x => x.kind === 'u' && x.side === s && x.hp > 0 && x !== e && !x.temp && !UDEF[x.type].air && !UDEF[x.type].support).map(x => Math.abs(x.u - hqU(s))).sort((a, b) => a - b), med = gr.length ? gr[gr.length >> 1] : -1;
          const wp = facOf(g.sides[s].faction) === 'axiarchs' ? warpPoint(g, s) : null;
          // [t, value, lane, own within LOCAL (with it), enemy within LOCAL, own total, enemy total, from own HQ, type, age, own ground median from HQ, warp point from own HQ (Axiarchs), from the warp point, stance]
          T.loss[s].push([Math.round(g.t), Math.round(v), ln, Math.round(own + v), Math.round(foe), Math.round(tOwn + v), Math.round(tFoe), Math.round(Math.abs(e.u - hqU(s))), e.type, Math.round(g.t - (BORN.get(e) ?? 0)), Math.round(med), wp ? Math.round(Math.abs(wp.u - hqU(s))) : -1, wp ? Math.round(Math.hypot(e.u - wp.u, e.v - wp.v)) : -1, g.sides[s].stance]);
        } else if (e.kind === 'b') T.bl[s].push([Math.round(g.t), e.type, ln, e.slot >= FWD_SLOT ? 1 : 0, Math.round(Math.abs(e.u - hqU(s)))]);
      }
      return kl.apply(this, arguments);
    };
    Object.assign(this.__sim, { laneOfPt, rwD, warpPoint });
  }).call(this);`;
  const S = loadSim(+seed, { instrument: INSTR }); Object.assign(S.REWORK, RW);
  const g = S.newGame('hard', { seed: +seed, map, autoPlayer: true, autoDiff: 'hard', factions: [f0, f1], autoPersona: p0 || undefined, persona: p1 || undefined }); g.countdown = 0;
  const nl = S.cur().MAP.lanes.length, ser = [[], []]; let k = 0, err = null;
  const busyOf = side => new Set([side.scoutId, ...(side.capT ? side.capT.ids : []), ...(side.capT2 ? side.capT2.ids : []), ...(side.raid ? side.raid.ids : []), ...(side.relicG ? side.relicG.ids : [])]);
  try {
    while (!g.over && g.t < +maxT) {
      S.update(g, S.TICK); g.events.length = 0;
      if (++k % 600 === 0) for (let s = 0; s < 2; s++) {
        const sd = g.sides[s], busy = busyOf(sd), pos = Array(nl).fill(0), asg = Array(nl).fill(0), en = Array(nl).fill(0), home = Array(nl).fill(0); let air = 0, side = 0;
        for (const e of g.ents) {
          if (e.kind !== 'u' || e.hp <= 0 || e.temp || S.UDEF[e.type].support) continue;
          const v = S.armyValue([e]), ln = S.laneOfPt(e.u, e.v);
          if (e.side === s) { if (busy.has(e.id)) { side += v; continue; } if (S.UDEF[e.type].air) { air += v; continue; } pos[ln] += v; if (e.lane != null) asg[e.lane] += v; if (Math.abs(e.u - S.hqU(s)) < 450) home[ln] += v; }
          else if (e.side === 1 - s) en[ln] += v;
        }
        ser[s].push({ t: Math.round(g.t), st: sd.stance, pm: sd.pushMode || null, pos: pos.map(Math.round), asg: asg.map(Math.round), en: en.map(Math.round), home: home.map(Math.round), air: Math.round(air), busy: Math.round(side), nodes: g.nodes.map(n => n.owner), wp: S.facOf(sd.faction) === 'axiarchs' ? Math.round(Math.abs(S.warpPoint(g, s).u - S.hqU(s))) : null, med: (() => { const xs = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && !e.temp && !S.UDEF[e.type].air && !S.UDEF[e.type].support && !busy.has(e.id)).map(e => Math.abs(e.u - S.hqU(s))).sort((a, b) => a - b); return xs.length ? Math.round(xs[xs.length >> 1]) : null; })(), fc: sd.la ? sd.la.fc ?? null : null, fsw: sd.la ? sd.la.fsw || 0 : 0, lnNew: sd.laneNew ?? null, atk: sd.atkLane ?? null });
      }
    }
  } catch (e) { err = String(e && e.stack || e); }
  const T = S.tr6e;
  process.send({ map, f: [f0, f1], seed: +seed, t: Math.round(g.t), winner: g.over ? g.winner : null, how: g.result ? g.result.how : null, err, rw: g.rw, nl,
    sides: [0, 1].map(s => ({ fac: g.sides[s].faction, persona: g.sides[s].persona ? g.sides[s].persona.kind : null, ser: ser[s], loss: T.loss[s], bl: T.bl[s], peak: g.log.tot[s] ? undefined : undefined })) });
  process.exit(0);
}
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const F = ['lastfist', 'bloomhost', 'axiarchs'], P = ['boomer', 'economist', 'turtle'], ALLMAPS = ['classic', 'twolane', 'threelane'];
const MAPS = arg('maps', 'twolane,threelane').split(','), facs = arg('facs', '') ? arg('facs').split(',') : null;
const out = arg('out', path.join(__dirname, '..', 'logs-p1', 'lanes6e-base')), J = +arg('jobs', '4'), rw = arg('rw', ''), maxT = arg('maxT', '1700');
fs.mkdirSync(out, { recursive: true });
const jobs = [];
for (const map of MAPS) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (a !== b) for (let pa = 0; pa < 3; pa++) for (let pb = 0; pb < 3; pb++) {
  const [lo, hi, plo, phi] = a < b ? [a, b, pa, pb] : [b, a, pb, pa];
  const pairIdx = lo === 0 ? hi - 1 : 2, seed = 600 + pairIdx * 27 + ALLMAPS.indexOf(map) * 9 + plo * 3 + phi; // the selfplay-6c seeds
  if (facs && !facs.includes(F[a]) && !facs.includes(F[b])) continue;
  jobs.push({ map, f0: F[a], f1: F[b], p0: P[pa], p1: P[pb], seed });
}
const file = path.join(out, 'lanes.jsonl'), done = new Set();
const key = j => [j.map, j.f0, j.f1, j.seed, j.p0, j.p1].join();
if (fs.existsSync(file)) for (const l of fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)) { const m = JSON.parse(l); done.add([m.map, m.f[0], m.f[1], m.seed, m.sides[0].persona, m.sides[1].persona].join()); }
const todo = jobs.filter(j => !done.has(key(j)));
console.log(`${jobs.length} matches, ${todo.length} to run${rw ? ', rw ' + rw : ''}`);
let next = 0, n = 0, live = 0; const t0 = Date.now();
(function go() {
  while (live < J && next < todo.length) {
    const j = todo[next++]; live++;
    const c = fork(__filename, ['--one', j.map, j.f0, j.f1, String(j.seed), maxT, rw, j.p0, j.p1]);
    c.on('message', m => { fs.appendFileSync(file, JSON.stringify(m) + '\n'); n++; console.log(`${n}/${todo.length} ${((Date.now() - t0) / 60000).toFixed(1)} min ${m.map} ${m.f.join(' vs ')} ${j.p0}/${j.p1} ${m.t} s winner ${m.winner == null || m.winner < 0 ? 'none' : m.f[m.winner]}${m.err ? ' ERROR ' + m.err.slice(0, 200) : ''}`); });
    c.on('exit', () => { live--; go(); });
  }
})();
