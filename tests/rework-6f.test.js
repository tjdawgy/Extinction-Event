// v2.96 (batch 6f, docs/FACTION_REWORK.md "Batch 6f"): base attacks for every AI (REWORK.b6fai) and the Axiarch energy
// conversion undone, with the player's default warp point beside the base rally point (REWORK.b6f), src/sim/rework-6f.js.
// Fingerprints (FP_V296A, FP_V296) are in tests/determinism.test.js.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');
const sim = loadSim();
const J = x => x === undefined ? x : JSON.parse(JSON.stringify(x));
const same = (a, b, m) => assert.deepStrictEqual(J(a), J(b), m);
const game = (rework, o = {}) => sim.newGame(o.diff || 'hard', Object.assign({ seed: 5, factions: ['axiarchs', 'lastfist'], rework }, o));
const AX = Object.keys(sim.UDEF).filter(t => sim.UDEF[t].fac === 'axiarchs' && sim.UDEF[t].cost && sim.UDEF[t].cost.c + sim.UDEF[t].cost.e > 0);

test('b6fai and b6f are on by default, saved per game, and left out of a save when off', () => {
  const r = sim.rwInit(); assert.ok(r.b6fai && r.b6f);
  const on = JSON.parse(sim.serialize(game(), {})), off = JSON.parse(sim.serialize(game({ b6fai: false, b6f: false }), {}));
  assert.ok(on.rw.b6fai && on.rw.b6f);
  assert.ok(!('b6fai' in off.rw) && !('b6f' in off.rw), 'an off save is a v2.95 save');
  const b = sim.deserialize(JSON.stringify(off)); assert.ok(!b.rw.b6fai && !b.rw.b6f);
  const c = sim.deserialize(JSON.stringify(on)); assert.ok(c.rw.b6fai && c.rw.b6f);
  const old = Object.assign({}, on); old.rw = Object.assign({}, on.rw); delete old.rw.b6fai; delete old.rw.b6f; // a v2.95 save
  const d = sim.deserialize(JSON.stringify(old)); assert.ok(!d.rw.b6fai && !d.rw.b6f, 'a v2.95 save resumes with both off');
});

test('b6f: every Axiarch unit costs v2.94\'s price again (UDEF); the Marine stays 48 and the Riftstalker\'s shields 160 (b6e)', () => {
  const on = game(), off = game({ b6f: false });
  for (const t of AX) {
    same(sim.rwD(on, t).cost, sim.UDEF[t].cost, `${t}: v2.94's price`); same(sim.trainCost(on, t), sim.UDEF[t].cost, t);
    if (sim.B6E.cost[t]) same(sim.rwD(off, t).cost, sim.B6E.cost[t], `${t}: b6f off keeps b6e's conversion`);
  }
  same(sim.rwD(on, 'rifle').cost, { c: 48, e: 0 }, 'the Marine 48');
  assert.strictEqual(sim.spawnUnit(on, 0, 'riftstalker', 300, 0).maxShp, 160, 'the Riftstalker 160');
  same(sim.echoCost('lancer', on), { c: 60, e: 23 }, 'an echo: half v2.94\'s price');
  same(sim.rwShow(null, 'lancer').cost, sim.UDEF.lancer.cost, 'the Codex shows v2.94\'s price');
  same(sim.rwShow(null, 'riftstalker').shp, 160); same(sim.rwShow(null, 'rifle').cost, { c: 48, e: 0 });
  same(sim.rwShow(off, 'lancer').cost, sim.B6E.cost.lancer, 'an info card shows its own game\'s price');
  // with b6e off, b6f changes nothing (v2.94's prices either way)
  for (const t of [...AX, 'rifle']) same(sim.rwD(game({ b6e: false }), t).cost, sim.rwD(game({ b6e: false, b6f: false }), t).cost, t);
});

test('b6f: a sold queue refunds v2.94\'s price', () => {
  const g = game(undefined, { seed: 7 }); g.countdown = 0;
  const s = 0, side = g.sides[s];
  sim.tryBuild(g, s, 'barracks'); for (const e of g.ents) if (e.kind === 'b' && e.side === s) { e.built = true; e.hp = e.maxHp; }
  side.res.c = 5000; side.res.e = 5000;
  assert.ok(sim.tryTrain(g, s, 'shardling').ok && sim.tryTrain(g, s, 'shardling').ok);
  const k = sim.UDEF.shardling.cost; assert.strictEqual(5000 - side.res.c, 2 * k.c);
  const b = g.ents.find(e => e.kind === 'b' && e.side === s && e.queue && e.queue.length);
  const c0 = side.res.c, sv = sim.sellValue(b); sim.trySell(g, s, b); sim.trySell(g, s, b);
  assert.strictEqual(side.res.c - c0 - sv.c, b.queue.length ? 0 : 2 * k.c);
});

const hashRun = (rework, map, secs, fac = ['lastfist', 'bloomhost']) => {
  const s2 = loadSim({ random: (() => { let a = 99; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })() });
  const g = s2.newGame('hard', { seed: 11, map, autoPlayer: true, autoDiff: 'hard', factions: fac, rework }); g.countdown = 0;
  for (let i = 0; i < 60 * secs && !g.over; i++) { s2.update(g, s2.TICK); g.events.length = 0; }
  const o = JSON.parse(s2.serialize(g, {})); delete o.log; delete o.stats; delete o.rw;
  return { h: crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex'), g, s2 };
};

test('b6fai: an AI\'s all-in base attack walks to the enemy HQ and 60 past it, never to the map\'s edge (v2.95: the edge)', () => {
  // the enemy base emptied but for its HQ, made untargetable and quiet, so the walk alone decides where the unit ends
  for (const map of ['classic', 'twolane', 'threelane']) for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) for (const rw of [undefined, { b6fai: false, b6elane: false }]) {
    sim.useMap(map);
    const g = game(rw, { map, factions: [fac, 'lastfist'], autoPlayer: true, autoDiff: 'hard' }); g.countdown = 0;
    for (const s of g.sides) s.aiT = 1e9;
    g.ents = g.ents.filter(e => !(e.side === 1 && e.kind === 'b' && e.type !== 'hq'));
    g.ents.find(e => e.side === 1 && e.type === 'hq').gone = true; g.sides[1].hush = true;
    const sd = g.sides[0]; sd.stance = 'attack'; sd.pushTo = null; sd.pushMode = 'all';
    const u = sim.spawnUnit(g, 0, fac === 'lastfist' ? 'rifle' : fac === 'bloomhost' ? 'skitterling' : 'shardling', sim.hqU(1) - 200, 0);
    for (let i = 0; i < 60 * 40; i++) sim.update(g, sim.TICK);
    if (!rw) { assert.strictEqual(sim.end6f(g, 0), sim.hqU(1) + 60); assert.ok(Math.abs(u.u - (sim.hqU(1) + 60)) < 25, `${map} ${fac}: at the enemy HQ (${Math.round(u.u)}, HQ ${sim.hqU(1)})`); }
    else assert.ok(u.u > sim.hqU(1) + 180, `${map} ${fac}, b6fai off: the map\'s edge (${Math.round(u.u)})`);
  }
  sim.useMap('classic');
});

test('b6fai off: Classic plays exactly as v2.95; on, it changes only what happens after a base attack starts', () => {
  const a = hashRun({ b6fai: false }, 'classic', 200), b = hashRun({ b6fai: false, b6f: false }, 'classic', 200);
  assert.strictEqual(a.h, b.h, 'b6f has no effect on a Last Fist vs Bloomhost match (no Axiarchs, no player)');
});

test('b6f (Part C): a player with no warp point of its own warps in beside the base rally point; a set point and the AI unchanged', () => {
  const run = (rw, direct, setAt) => {
    const g = game(rw, { factions: ['axiarchs', 'lastfist'] }); g.countdown = 0;
    if (direct) sim.directControl(g, 0);
    for (const s of g.sides) s.aiT = 1e9;
    for (const i of [0, 1]) { g.nodes[i].owner = 0; g.nodes[i].prog = 100; } // its own node and the centre: field patches out in the lane
    for (let i = 0; i < 60 * 40; i++) sim.update(g, sim.TICK); // the field grows
    if (setAt) assert.ok(sim.setWarp(g, 0, setAt.u, setAt.v).ok);
    sim.startWarp(g, 0, 'shardling');
    return { g, w: g.warps.at(-1), front: sim.defaultWarp(g, 0), base: sim.ctlBase(0) };
  };
  const p = run(undefined, true), near = sim.warp6f(p.g, 0), d = (a, b) => Math.hypot(a.u - b.u, a.v - b.v);
  assert.ok(d(p.w, near) < 60 && d(near, p.base) < d(p.front, p.base) - 150, `the field spot nearest the base rally point: ${JSON.stringify([p.w.u, p.w.v])}, rally ${JSON.stringify(p.base)}, front ${JSON.stringify(p.front)}`);
  assert.ok(sim.onField(p.g, 0, p.w.u, p.w.v));
  same([sim.warpAt(p.g, 0).u, sim.warpAt(p.g, 0).v].map(Math.round), [sim.warp6f(p.g, 0).u, sim.warp6f(p.g, 0).v].map(Math.round), 'the mark the player sees is that point');
  const q = run({ b6f: false }, true);
  assert.ok(Math.hypot(q.w.u - q.front.u, q.w.v - q.front.v) < 60, 'b6f off: the field\'s front edge (v2.95)');
  const a = run(undefined, false);
  assert.ok(Math.hypot(a.w.u - a.front.u, a.w.v - a.front.v) < 60, 'an AI side keeps v2.95\'s default');
  const at = { u: sim.hqU(0) + 150, v: 10 }, sp = run(undefined, true, at);
  assert.ok(Math.hypot(sp.w.u - at.u, sp.w.v - at.v) < 60, 'a point the player set is kept');
});
