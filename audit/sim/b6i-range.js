// Batch 6i (v2.99): Test Range measurements for the Bloomhost air rework (b6i) and the under-fire response rework (b6iresp), on the
// real SIM (rangeGame, rangeUnits, rangeBuilding, the sides' Hold and Attack modes and the real commands), over seeds.
//   node audit/sim/b6i-range.js [--seeds 20] [--only name,name] [--html file] [--out audit/logs-p1/b6i/range.md]
const { loadSim } = require('./load'), fs = require('fs'), path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('seeds', '20'), ONLY = arg('only', null);
const H = `this.__sim.R6 = { rangeGame, rangeUnits, rangeUnit, rangeBuilding, rangeStep, rangeOrders, TICK, command, ctlEnt, B6I, B6H, DY };`;
const OFF = { b6i: false, b6iresp: false }, RESP_OFF = { b6iresp: false };
function run(name, rw, seed, sc) {
  const S = loadSim(seed, { instrument: H, file: arg('html') }), R = S.R6;
  const g = R.rangeGame({ seed, factions: sc.f, rework: Object.assign({}, S.REWORK, rw) });
  const U = sc.place(R, g, S); g.sides[0].mode = sc.m0; g.sides[1].mode = sc.m1;
  if (sc.hush) g.sides[sc.hush - 1].hush = true;
  if (sc.manual) for (const s of sc.manual) g.sides[s].manual = true;
  let t = 0; const st = {};
  while (t < sc.T) { if (sc.tick) sc.tick(R, g, U, t, st, S); R.rangeStep(g); t += R.TICK; if (sc.done && sc.done(g, U, t, st)) break; }
  const tag = Object.keys(rw).length ? Object.entries(rw).map(([k, v]) => `${k} ${v ? 'on' : 'off'}`).join(', ') : 'every switch on';
  return Object.assign({ name, seed, rw: tag }, sc.read(g, U, t, st, S));
}
const alive = (g, us) => us.filter(e => e.hp > 0 && g.ents.includes(e) && !e.dead).length;
const hpOf = us => Math.round(us.reduce((a, e) => a + Math.max(0, e.hp), 0));
const ids = us => us.map(e => e.id);
const val = (S, us) => us.reduce((a, e) => a + S.UDEF[e.type].cost.c + S.UDEF[e.type].cost.e, 0);
const both = (g, A, B) => alive(g, A) === 0 || alive(g, B) === 0;
// fights: who is left, how long it took
const fight = (f, m0, m1, T, placeA, placeB, extra = {}) => Object.assign({ f, m0, m1, T,
  place: (R, g) => ({ a: placeA(R, g), b: placeB(R, g) }),
  done: (g, U) => both(g, U.a, U.b),
  read: (g, U, t, st, S) => ({ t: Math.round(t), aLeft: alive(g, U.a), aHp: hpOf(U.a), bLeft: alive(g, U.b), bHp: hpOf(U.b), win: alive(g, U.b) === 0 && alive(g, U.a) > 0 ? 1 : 0, aVal: Math.round(val(S, U.a)), bVal: Math.round(val(S, U.b)) }) }, extra);
const SC = {
  // 1) three Razorwing flocks (450 credits, 150 energy) against equal-cost Last Fist aircraft, both attacking
  flocksGs: fight(['bloomhost', 'lastfist'], 'attack', 'attack', 60, (R, g) => R.rangeUnits(g, 0, 'razorwing', 600, 0, 3), (R, g) => R.rangeUnits(g, 1, 'aircraft', 900, 0, 2)),
  flocksIc: fight(['bloomhost', 'lastfist'], 'attack', 'attack', 60, (R, g) => R.rangeUnits(g, 0, 'razorwing', 600, 0, 3), (R, g) => R.rangeUnits(g, 1, 'interceptor', 900, 0, 3)),
  // 2) a Gnatcloud attacking 10 Marines (holding), then the same with a Tank among them (its shells' splash)
  gnat: fight(['bloomhost', 'lastfist'], 'attack', 'hold', 60, (R, g) => R.rangeUnits(g, 0, 'needlewing', 640, 0, 1), (R, g) => R.rangeUnits(g, 1, 'rifle', 820, 0, 10),
    { read: (g, U, t, st, S) => ({ t: Math.round(t), cloud: alive(g, U.a), cloudHp: hpOf(U.a), marines: alive(g, U.b), marineHp: hpOf(U.b), eaten: Math.round((g.sides[0].i6 || {}).gnat || 0) }) }),
  gnatTank: { f: ['bloomhost', 'lastfist'], m0: 'attack', m1: 'hold', T: 60,
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'needlewing', 640, 0, 1), b: R.rangeUnits(g, 1, 'rifle', 820, 0, 10), k: R.rangeUnits(g, 1, 'tank', 860, 0, 1) }),
    done: (g, U) => both(g, U.a, U.b.concat(U.k)),
    read: (g, U, t) => ({ t: Math.round(t), cloud: alive(g, U.a), cloudHp: hpOf(U.a), marines: alive(g, U.b), marineHp: hpOf(U.b), tank: alive(g, U.k), eaten: Math.round((g.sides[0].i6 || {}).gnat || 0) }) },
  // 3) two Blightwings behind 8 Skitterlings (4 broods... 2 broods) attacking 10 Marines: Mites born from blighted kills
  blight: { f: ['bloomhost', 'lastfist'], m0: 'attack', m1: 'hold', T: 60,
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'cloudwing', 560, 0, 2).concat(R.rangeUnits(g, 0, 'skitterling', 620, 0, 8)), b: R.rangeUnits(g, 1, 'rifle', 820, 0, 10) }),
    tick: (R, g, U, t, st) => { st.mx = Math.max(st.mx || 0, g.ents.filter(e => e.side === 0 && e.type === 'mite' && e.hp > 0).length); st.bl = Math.max(st.bl || 0, g.ents.filter(e => e.side === 1 && e.bl6T > g.t).length); },
    done: (g, U) => alive(g, U.b) === 0 || alive(g, U.a) === 0,
    read: (g, U, t, st) => { const h = g.sides[0].i6 || {}; return { t: Math.round(t), marines: alive(g, U.b), blighted: h.blight || 0, blightedMax: st.bl || 0, mitesBorn: h.bMites || 0, mitesAliveMax: st.mx || 0, bloomhostLeft: alive(g, U.a) }; } },
  // 4) a Talonmaw against 8 Marines (Snatch and its heal), and against a Tank (Rend)
  talonMar: { f: ['bloomhost', 'lastfist'], m0: 'attack', m1: 'hold', T: 60,
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'broodtyrant', 640, 0, 1), b: R.rangeUnits(g, 1, 'rifle', 820, 0, 8) }),
    tick: (R, g, U, t, st) => { st.min = Math.min(st.min ?? 1e9, U.a[0].hp); },
    done: (g, U) => both(g, U.a, U.b),
    read: (g, U, t, st) => { const h = g.sides[0].i6 || {}; return { t: Math.round(t), talon: alive(g, U.a), talonHp: hpOf(U.a), lowest: Math.round(st.min), marines: alive(g, U.b), snatches: h.snatch || 0, eaten: h.eaten || 0, drops: h.drops || 0 }; } },
  talonTank: { f: ['bloomhost', 'lastfist'], m0: 'attack', m1: 'hold', T: 60,
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'broodtyrant', 640, 0, 1), b: R.rangeUnits(g, 1, 'tank', 820, 0, 1) }),
    done: (g, U) => both(g, U.a, U.b),
    read: (g, U, t) => { const h = g.sides[0].i6 || {}; return { t: Math.round(t), talon: alive(g, U.a), talonHp: hpOf(U.a), tank: alive(g, U.b), rends: h.rend || 0 }; } },
  // the same Tank with a Talonmaw and 8 Skitterlings (Rend's +15% for Bloomhost) against 8 Skitterlings alone
  rendSwarm: { f: ['bloomhost', 'lastfist'], m0: 'attack', m1: 'hold', T: 60,
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'broodtyrant', 640, 0, 1).concat(R.rangeUnits(g, 0, 'skitterling', 660, 0, 2)), b: R.rangeUnits(g, 1, 'tank', 820, 0, 2) }),
    done: (g, U) => both(g, U.a, U.b),
    read: (g, U, t) => { const h = g.sides[0].i6 || {}; return { t: Math.round(t), tanks: alive(g, U.b), rends: h.rend || 0, bloomhostLeft: alive(g, U.a) }; } },
  // 5) a Skywyrm against a turreted node (a T1 Turret and a T1 Refinery on the ground), and pulling an aircraft with its tendrils
  wyrmNode: { f: ['bloomhost', 'lastfist'], m0: 'attack', m1: 'hold', T: 120,
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'worldrender', 560, 0, 1), t1: R.rangeBuilding(g, 1, 'lastfist', 'turret', 900, -30), t2: R.rangeBuilding(g, 1, 'lastfist', 'turret', 900, 40), r: R.rangeBuilding(g, 1, 'lastfist', 'refinery', 960, 0) }),
    tick: (R, g, U, t, st) => { for (const k of ['t1', 't2', 'r']) if (U[k].hp <= 0 && st[k] == null) st[k] = +t.toFixed(1); },
    done: (g, U) => alive(g, U.a) === 0 || (U.t1.hp <= 0 && U.t2.hp <= 0 && U.r.hp <= 0),
    read: (g, U, t, st) => { for (const k of ['t1', 't2', 'r']) if (U[k].hp <= 0 && st[k] == null) st[k] = +t.toFixed(1); return { t: Math.round(t), wyrm: alive(g, U.a), wyrmHp: hpOf(U.a), turret1: st.t1 ?? '-', turret2: st.t2 ?? '-', refinery: st.r ?? '-', turretsDownAt: st.t1 != null && st.t2 != null ? Math.max(st.t1, st.t2) : '-' }; } },
  wyrmAir: { f: ['bloomhost', 'lastfist'], m0: 'hold', m1: 'attack', T: 60,
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'worldrender', 600, 0, 1), b: R.rangeUnits(g, 1, 'aircraft', 820, 0, 2) }),
    done: (g, U) => both(g, U.a, U.b),
    read: (g, U, t) => { const h = g.sides[0].i6 || {}; return { t: Math.round(t), wyrm: alive(g, U.a), wyrmHp: hpOf(U.a), gunships: alive(g, U.b), tendrils: h.tendril || 0, jaws: h.jaws || 0 }; } },
  // 6) responses: Tanks on Hold hit by aircraft that they can't shoot (they should stay)
  respTankAir: { f: ['lastfist', 'axiarchs'], m0: 'hold', m1: 'attack', T: 25,
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'tank', 600, 0, 4), b: R.rangeUnits(g, 1, 'prismwing', 860, 0, 2) }),
    tick: (R, g, U, t, st) => { if (!st.p) st.p = U.a.map(e => [e.u, e.v]); U.a.forEach((e, i) => { if (e.hp > 0) st.m = Math.max(st.m || 0, Math.hypot(e.u - st.p[i][0], e.v - st.p[i][1])); }); },
    read: (g, U, t, st) => ({ tanks: alive(g, U.a), maxMoved: Math.round(st.m || 0) }) },
  // Marines on Hold shelled by Artillery from beyond their reach + 80 (they should not move)
  respArt: { f: ['lastfist', 'lastfist'], m0: 'hold', m1: 'hold', T: 25,
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'rifle', 600, 0, 6), b: R.rangeUnits(g, 1, 'artillery', 980, 0, 1) }),
    tick: (R, g, U, t, st) => { if (!st.p) st.p = U.a.map(e => [e.u, e.v]); U.a.forEach((e, i) => { if (e.hp > 0) st.m = Math.max(st.m || 0, Math.hypot(e.u - st.p[i][0], e.v - st.p[i][1])); }); },
    read: (g, U, t, st) => ({ marines: alive(g, U.a), marineHp: hpOf(U.a), maxMoved: Math.round(st.m || 0), artDist: 380 }) },
  // a melee unit on Hold (a Skitterling brood) hit by a Marine within 100: it charges, then walks back to its spot
  respMelee: { f: ['bloomhost', 'lastfist'], m0: 'hold', m1: 'hold', T: 25,
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'ravager', 600, 0, 1), b: R.rangeUnits(g, 1, 'rifle', 695, 0, 1) }),
    tick: (R, g, U, t, st) => { const e = U.a[0]; if (!st.p) st.p = [e.u, e.v]; const d = Math.hypot(e.u - st.p[0], e.v - st.p[1]); st.m = Math.max(st.m || 0, d); if (U.b[0].hp <= 0 && st.k == null) st.k = +t.toFixed(1); st.end = d; },
    read: (g, U, t, st) => ({ marine: alive(g, U.b), killedAt: st.k ?? '-', maxMoved: Math.round(st.m || 0), endFromSpot: Math.round(st.end || 0) }) },
};
const rows = [];
const want = n => !ONLY || ONLY.split(',').includes(n);
for (let s = 1; s <= N; s++) {
  for (const k of ['flocksGs', 'flocksIc', 'gnat', 'gnatTank', 'blight', 'talonMar', 'talonTank', 'rendSwarm', 'wyrmNode', 'wyrmAir']) if (want(k)) rows.push(run(k, {}, 7100 + s, SC[k]));
  if (want('flocksGs')) rows.push(run('flocksGs', OFF, 7100 + s, SC.flocksGs)); // v2.98: three single Razorwings (720) in their place
  if (want('wyrmNode')) rows.push(run('wyrmNode', OFF, 7100 + s, SC.wyrmNode)); // v2.98: a Worldrender in its place
  for (const k of ['respTankAir', 'respArt', 'respMelee']) if (want(k)) { rows.push(run(k, {}, 7200 + s, SC[k])); rows.push(run(k, RESP_OFF, 7200 + s, SC[k])); }
}
const by = {}; for (const r of rows) (by[r.name + ' (' + r.rw + ')'] || (by[r.name + ' (' + r.rw + ')'] = [])).push(r);
const mean = a => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : null;
const lines = [`# Batch 6i Test Range measurements (${N} seeds each)`, ''];
for (const k in by) {
  const R = by[k], keys = Object.keys(R[0]).filter(x => !['name', 'seed', 'rw'].includes(x));
  lines.push(`## ${k}`, '', '| ' + keys.join(' | ') + ' |', '|' + keys.map(() => '---').join('|') + '|');
  lines.push('| ' + keys.map(x => { const v = R.map(r => r[x]).filter(v => typeof v === 'number'); return v.length ? 'mean ' + mean(v) : ''; }).join(' | ') + ' |');
  for (const r of R.slice(0, 5)) lines.push('| ' + keys.map(x => r[x] == null ? '-' : String(r[x])).join(' | ') + ' |');
  if (R.length > 5) lines.push(`(first 5 of ${R.length} seeds shown)`);
  lines.push('');
}
const out = arg('out', null);
if (out) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, lines.join('\n') + '\n'); fs.writeFileSync(out.replace(/\.md$/, '.json'), JSON.stringify(rows)); }
console.log(lines.join('\n'));
