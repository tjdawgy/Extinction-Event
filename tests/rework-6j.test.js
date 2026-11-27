// v3.00 (batch 6j): the playtest fixes (REWORK.b6jfix) and the AI fixes and balance (REWORK.b6j), src/sim/rework-6j.js. Each
// fix on the real SIM; both switches off play as v2.99 (FP_V299 and every older set in tests/determinism.test.js; FP_V300 there).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');
const sim = loadSim();
const ON = { b6jfix: true, b6j: true }, OFF = { b6jfix: false, b6j: false };
const game = (rw, f = ['bloomhost', 'lastfist'], o = {}) => { const g = sim.newGame('hard', Object.assign({ seed: 9, factions: f, rework: Object.assign({}, sim.REWORK, rw) }, o)); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9; return g; };
const J = x => JSON.parse(JSON.stringify(x));
const run = (g, s) => { for (let i = 0; i < Math.round(s * 60); i++) sim.update(g, sim.TICK); };

test('switches: on by default, saved only when on; both off is a v2.99 save', () => {
  const r = sim.rwInit(); assert.ok(r.b6jfix && r.b6j);
  const o = JSON.parse(sim.serialize(game(OFF), {}));
  for (const k of ['b6jfix', 'b6j']) assert.ok(!(k in (o.rw || {})), k + ' left out of an off save');
  const g2 = game({}), o2 = JSON.parse(sim.serialize(g2, {}));
  for (const k of ['b6jfix', 'b6j']) assert.strictEqual(o2.rw[k], true);
  const g3 = sim.deserialize(sim.serialize(g2, {})); assert.ok(g3.rw.b6jfix && g3.rw.b6j, 'loaded back on');
});

// A2: three Queens on a target order, packed together, enemies in range: Mites hatch in front of each, clear of her body; no
// Queen is pushed, none loses her order or target. With b6jfix off (v2.99) the other Queens' Mites shove them aside.
function queens(rw) {
  const g = game(rw); sim.directControl(g, 0); sim.setStance(g, 1, 'hold');
  const qs = [[900, 0], [912, 14], [905, -16]].map(([u, v]) => { const q = sim.spawnUnit(g, 0, 'queen', u, v); sim.ctlHold(q, u, v); return q; });
  const es = [0, 1, 2].map(i => { const e = sim.spawnUnit(g, 1, 'heavy', 1035 + i * 8, (i - 1) * 20); e.holdU = e.u; e.holdV = e.v; e.hp = e.maxHp = 1e6; return e; });
  run(g, 1 / 60); sim.updateVision(g);
  assert.ok(sim.command(g, 0, qs.map(q => q.id), 'target', es[0].id).ok);
  const p0 = qs.map(q => [q.u, q.v]), seen = new Set(), R = { births: 0, minD: 1e9, ahead: 0, orderLost: 0 };
  for (let i = 0; i < 60 * 20; i++) {
    const before = qs.map(q => ({ u: q.u, v: q.v, po: JSON.stringify(q.po) }));
    run(g, 1 / 60);
    for (const m of g.ents) if (m.qm && !seen.has(m.id)) {
      seen.add(m.id); R.births++; const k = qs.findIndex(q => q.id === m.qm), Q = qs[k];
      R.minD = Math.min(R.minD, Math.hypot(m.u - Q.u, (m.v - Q.v) * sim.DY)); if (m.u > Q.u) R.ahead++;
    }
    qs.forEach(q => { if (q.po.o !== 'target' || q.po.id !== es[0].id) R.orderLost++; });
  }
  R.drift = Math.max(...qs.map((q, k) => Math.hypot(q.u - p0[k][0], q.v - p0[k][1])));
  return R;
}
test('A2: a Queen\'s Mites hatch in front of her, never push her, never change her order (b6jfix); off: v2.99 pushed her', () => {
  const on = queens(ON), off = queens(OFF);
  assert.ok(on.births >= 15, JSON.stringify(on));
  assert.strictEqual(on.ahead, on.births, 'every Mite toward her target');
  assert.ok(on.minD >= 17, 'clear of her body: ' + on.minD);
  assert.ok(on.drift < 3, 'not pushed: ' + on.drift);
  assert.strictEqual(on.orderLost, 0);
  assert.ok(off.drift > 10 && off.minD < 10, 'v2.99: ' + JSON.stringify(off));
});
test('A2: in the body pass a Mite takes the whole push from its own side (mitePush6j)', () => {
  const g = game(ON), q = sim.spawnUnit(g, 0, 'queen', 900, 0), m = sim.spawnUnit(g, 0, 'mite', 902, 0), e = sim.spawnUnit(g, 1, 'mite', 905, 0);
  assert.strictEqual(sim.mitePush6j(g, m, q), 1); assert.strictEqual(sim.mitePush6j(g, q, m), 2); assert.strictEqual(sim.mitePush6j(g, q, e), 0, 'not an enemy');
  assert.strictEqual(sim.mitePush6j(game(OFF), m, q), 0);
});

// A3: on a lane map the aiming tap reaches every lane; Emergency Brood takes any lane too (abilityCheck)
test('A3: the aiming tap reaches the whole depth of a lane map; Emergency Brood on any lane (b6jfix); Classic unchanged', () => {
  for (const map of ['twolane', 'threelane']) {
    const g = game(ON, ['bloomhost', 'lastfist'], { map }); const H = sim.cur().MAP.size.h / 2;
    assert.strictEqual(sim.aimV6j(g), H); assert.strictEqual(sim.aimV6j(game(OFF, undefined, { map })), 240);
    g.fog[0].exp.fill(1); g.fog[0].vis.fill(1); g.sides[0].res.c = g.sides[0].res.e = 9999; g.t = 400; g.sides[0].hq.tier = 3; for (const k in g.sides[0].ab) g.sides[0].ab[k] = 0;
    for (const ln of sim.cur().MAP.lanes) { const v = sim.laneY(ln, 1050); assert.ok(sim.abilityCheck(g, 0, 'brood', 1050, v).ok, map + ' ' + ln.id + ' ' + v); }
    const off = game(OFF, ['bloomhost', 'lastfist'], { map }); off.fog[0].exp.fill(1); off.fog[0].vis.fill(1); off.sides[0].res.c = off.sides[0].res.e = 9999; off.t = 400; off.sides[0].hq.tier = 3; for (const k in off.sides[0].ab) off.sides[0].ab[k] = 0;
    const outer = sim.cur().MAP.lanes.map(ln => sim.laneY(ln, 1050)).filter(v => Math.abs(v) > 200);
    for (const v of outer) assert.ok(!sim.abilityCheck(off, 0, 'brood', 1050, v).ok, 'v2.99: only the middle of the map');
  }
  assert.strictEqual(sim.aimV6j(game(ON, undefined, { map: 'classic' })), 240, 'Classic');
});

// A5: a Larva Pit sold with a brood queued refunds the brood
test('A5: selling a Larva Pit with a queued brood refunds the whole brood (b6jfix); off: one Skitterling\'s price', () => {
  const got = rw => {
    const g = game(rw), b = sim.mkBuilding(g, 0, 'barracks', 0); b.built = true; b.progress = 1; g.sides[0].res.c = 5000; g.sides[0].res.e = 500;
    assert.ok(sim.tryTrain(g, 0, 'skitterling').ok); const c0 = g.sides[0].res.c; b.queue.unshift('rifle'); b.queue.shift(); // the brood is queued
    const sell = sim.sellValue(b).c; sim.trySell(g, 0, b); return g.sides[0].res.c - c0 - sell;
  };
  assert.strictEqual(got(ON), sim.broodCost({ rw: Object.assign({}, sim.REWORK) }));
  assert.ok(got(OFF) < sim.broodCost({ rw: Object.assign({}, sim.REWORK) }) / 2);
});

// B1: the siege line needs 2+ Artillery that reach a known enemy building from it; Titans no longer count
test('B1: a siege needs Artillery within reach of a known enemy building (siegeN6j); Titans alone: none', () => {
  const g = game(ON, ['lastfist', 'axiarchs']), s = 0, line = sim.hqU(1) - 555;
  const ti = [0, 1].map(i => sim.spawnUnit(g, s, 'titan', 1500 + i * 10, 0)), ar = [0, 1].map(i => sim.spawnUnit(g, s, 'artillery', 1500, i * 10));
  assert.strictEqual(sim.siegeN6j(g, s, ti, line, 2), 0, 'Titans only');
  g.fog[s].ghosts = {}; assert.strictEqual(sim.siegeN6j(g, s, ar, line, 2), 0, 'nothing known in reach');
  g.fog[s].ghosts[1] = { id: 1, type: 'turret', side: 1, u: line + 300, v: 0, half: 20 }; assert.strictEqual(sim.siegeN6j(g, s, ar.concat(ti), line, 4), 2);
  g.fog[s].ghosts[1].u = line + 600; assert.strictEqual(sim.siegeN6j(g, s, ar, line, 2), 0, 'beyond reach');
  assert.strictEqual(sim.siegeN6j(game(OFF, ['lastfist', 'axiarchs']), s, ti, line, 2), 2, 'v2.99 counted Titans');
});
test('B1: the Last Fist Turtle\'s plan ends with a Tech Lab (b6j); off: none', () => {
  for (const [rw, want] of [[ON, true], [OFF, false]]) {
    const g = game(rw, ['axiarchs', 'lastfist'], { persona: 'turtle' }), P = g.sides[1].persona;
    assert.strictEqual(P.kind, 'turtle'); assert.strictEqual(sim.plan6i(g, 1, P).includes('techlab'), want);
  }
});
// B2: the air building's T2 and T3 first from 8:00 with three Refineries and the credits
test('B2: tier-3 air first from 8:00 with its air building, three Refineries and the credits (air6j); off: none', () => {
  const g = game(ON, ['lastfist', 'axiarchs']); g.t = 500; g.sides[0].res.c = 2000;
  const T = sim.mkBuilding(g, 0, 'techlab', 0); T.built = true; T.progress = 1; T.tier = 2; T.path = 'A';
  assert.deepStrictEqual(J(sim.air6j(g, 0)), [], 'no Refineries');
  for (let k = 1; k <= 3; k++) { const r = sim.mkBuilding(g, 0, 'refinery', k); r.built = true; r.progress = 1; }
  assert.deepStrictEqual(J(sim.air6j(g, 0)), [['techlab', 2], ['techlab', 3]]);
  g.t = 400; assert.deepStrictEqual(J(sim.air6j(g, 0)), [], 'before 8:00'); g.t = 500; g.sides[0].res.c = 10; assert.deepStrictEqual(J(sim.air6j(g, 0)), [], 'no credits');
  const o = game(OFF, ['lastfist', 'axiarchs']); o.t = 500; assert.deepStrictEqual(J(sim.air6j(o, 0)), []);
});
test('B3: a Skywyrm joins a node assault from 30% health (wyrm6j)', () => {
  const g = game(ON), w = sim.spawnUnit(g, 0, 'skywyrm', 900, 0); w.hp = w.maxHp * 0.35;
  assert.ok(sim.wyrm6j(g, w)); w.hp = w.maxHp * 0.2; assert.ok(!sim.wyrm6j(g, w)); w.hp = w.maxHp * 0.35; assert.ok(!sim.wyrm6j(game(OFF), w));
});
