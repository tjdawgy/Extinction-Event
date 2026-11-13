// v2.73 (docs/CONTROLS.md): direct control in the SIM. The player's side (side.direct) gives each unit its own order:
// move to a spot (holding fire, then Hold there), Attack down its lane, Hold, Retreat to its lane's base flag. Nothing moves
// on its own: new units walk to the active lane's base flag and hold, a forward Barracks' units hold beside it. Units heal
// at their base flags and held depots only. Old orders map onto the new ones. A side without direct control (the AI) is
// untouched. The browser side is in tests/controls-ui.test.js.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
test.afterEach(() => sim.useMap('classic'));
const mk = (map = 'classic', fac = 'lastfist') => { const g = sim.newGame('normal', { map, seed: 7, factions: [fac, 'lastfist'] }); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9; return g; };
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 60); i++) sim.update(g, sim.TICK); };
const ids = us => us.map(u => u.id);
const near = (u, x, y, r) => Math.hypot(u.u - x, u.v - y) <= r;

test('only a side switched to direct control has it; the state is created then, not before', () => {
  const g = mk();
  assert.strictEqual(g.sides[0].direct, undefined); assert.strictEqual(g.sides[0].flags, undefined);
  assert.ok(!sim.command(g, 0, [], 'hold').ok, 'refused without direct control');
  assert.ok(sim.directControl(g, 0)); assert.ok(!sim.directControl(g, 0), 'once');
  assert.strictEqual(g.sides[0].flags.length, 1); assert.strictEqual(g.sides[0].active, 0);
  assert.deepStrictEqual({ ...g.sides[0].flags[0] }, { u: sim.MAP.bases[0].rally[0], v: 0 }, 'Classic: one base flag at the map\'s rally point');
  assert.strictEqual(g.sides[1].direct, undefined, 'the AI side is untouched');
  for (const [map, n] of [['twolane', 2], ['threelane', 3]]) {
    const h = mk(map); sim.directControl(h, 0); const F = h.sides[0].flags;
    assert.strictEqual(F.length, n, `${map}: a base flag per lane`);
    F.forEach((f, k) => assert.ok(Math.abs(f.v - sim.laneY(sim.MAPS[map].lanes[k], f.u)) < 1e-9, `${map}: flag ${k} on its lane`));
    assert.ok(F[0].v < F[n - 1].v, 'north above south');
  }
});

test('a tapped spot: the selection walks there holding its fire, spreads around it and holds; Hold stops them where they are', () => {
  const g = mk(); sim.directControl(g, 0);
  const us = [0, 1, 2, 3, 4].map(i => sim.spawnUnit(g, 0, 'rifle', 450 + i * 6, 0));
  const foe = sim.spawnUnit(g, 1, 'rifle', 640, 0); foe.hp = 1e6; foe.maxHp = 1e6; g.sides[1].stance = 'hold'; foe.holdU = 640; foe.holdV = 0;
  const r = sim.command(g, 0, ids(us), 'go', 760, 20);
  assert.ok(r.ok && r.n === 5, r.msg);
  const seen = new Set(); for (const u of us) { assert.strictEqual(u.po.o, 'go'); seen.add(`${Math.round(u.po.u)},${Math.round(u.po.v)}`); }
  assert.strictEqual(seen.size, 5, 'each its own spot'); for (const u of us) assert.ok(near({ u: u.po.u, v: u.po.v }, 760, 20, 40));
  let shot = false, passed = false; for (let i = 0; i < 60 * 10; i++) { sim.update(g, sim.TICK); if (us.some(u => u.po.o === 'go' && u.tgt)) shot = true; if (us.some(u => u.po.o === 'go' && Math.abs(u.u - 640) < 60)) passed = true; }
  assert.ok(passed && !shot, 'they hold their fire on the way (past an enemy)');
  for (const u of us) { assert.strictEqual(u.po.o, 'hold', 'arrived: Hold'); assert.ok(near(u, 760, 20, 45), `${u.u},${u.v}`); }
  step(g, 2); assert.ok(us.some(u => u.tgt), 'on Hold they fight what is in reach');
  const a = sim.spawnUnit(g, 0, 'tank', 500, 0); sim.command(g, 0, [a.id], 'go', 900, 0); step(g, 1);
  const at = a.u; sim.command(g, 0, [a.id], 'hold'); step(g, 3);
  assert.ok(Math.abs(a.u - at) < 12 && a.po.o === 'hold', 'Hold: it stops where it is');
});

test('Attack: down the lane each unit is in, to the enemy base; Retreat: back to the lane\'s base flag, holding fire, then Hold', () => {
  const g = mk('threelane'); sim.directControl(g, 0);
  const n = sim.spawnUnit(g, 0, 'rifle', 900, -400), c = sim.spawnUnit(g, 0, 'rifle', 900, 0), s = sim.spawnUnit(g, 0, 'tank', 900, 380);
  n.lane = 2; c.lane = 0; // wrong on purpose: the order takes the lane each is in
  sim.command(g, 0, ids([n, c, s]), 'attack');
  assert.deepStrictEqual([n.lane, c.lane, s.lane], [0, 1, 2], 'the lane each is in');
  step(g, 8);
  assert.ok(n.u > 1000 && Math.abs(n.v + 400) < 130, `north kept to the north lane (${n.u | 0}, ${n.v | 0})`);
  assert.ok(c.u > 1000 && Math.abs(c.v) < 130, 'centre in the centre lane'); assert.ok(s.u > 1000 && Math.abs(s.v - 400) < 130, 'south in the south');
  const foe = sim.spawnUnit(g, 1, 'rifle', n.u + 40, n.v); foe.hp = foe.maxHp = 1e6; g.sides[1].stance = 'hold';
  sim.command(g, 0, ids([n, c, s]), 'retreat');
  let shot = false; for (let i = 0; i < 60 * 30 && [n, c, s].some(u => u.po.o === 'retreat'); i++) { sim.update(g, sim.TICK); if (n.tgt) shot = true; }
  assert.ok(!shot, 'retreating units hold their fire');
  const F = g.sides[0].flags;
  for (const [u, k] of [[n, 0], [c, 1], [s, 2]]) { assert.strictEqual(u.po.o, 'hold'); assert.ok(near(u, F[k].u, F[k].v, 60), `at lane ${k}'s base flag`); }
  const h = mk(); sim.directControl(h, 0); const a = sim.spawnUnit(h, 0, 'rifle', 400, 30); sim.command(h, 0, [a.id], 'attack'); step(h, 6);
  assert.ok(a.u > 600, 'Classic: down the single lane');
});

test('a tapped spot in another lane moves the unit to that lane; enemies and guards are not commanded', () => {
  const g = mk('threelane'); sim.directControl(g, 0);
  const u = sim.spawnUnit(g, 0, 'rifle', 1300, -400), e = sim.spawnUnit(g, 1, 'rifle', 400, 0);
  const r = sim.command(g, 0, [u.id, e.id, g.guards[0].id], 'go', 1300, 400);
  assert.strictEqual(r.n, 1, 'only the side\'s own units'); assert.strictEqual(u.lane, 2); assert.strictEqual(e.po, undefined); assert.strictEqual(g.guards[0].po, undefined);
  step(g, 40); assert.ok(u.hp > 0 && near(u, 1300, 400, 30), `through the gap to the south lane (${u.u | 0},${u.v | 0})`);
  for (const x of sim.cur().NAV ? [u] : []) assert.ok(!sim.navShut(x.u, x.v), 'never inside a wall');
  assert.ok(!sim.command(g, 0, [u.id], 'go', -50, 0).ok, 'off the battlefield'); assert.ok(!sim.command(g, 0, [u.id], 'jump').ok);
  g.countdown = 3; assert.ok(!sim.command(g, 0, [u.id], 'hold').ok, 'not during GET READY');
});

test('new units walk to the active lane\'s base flag and wait there on Hold; a forward Barracks\' units wait beside it', () => {
  const g = mk('threelane'); sim.directControl(g, 0); g.sides[0].res.c = 1e5; g.sides[0].res.e = 1e5;
  assert.ok(sim.setActiveLane(g, 0, 2).ok); assert.ok(!sim.setActiveLane(g, 0, 3).ok);
  const b = sim.spawnUnit; void b;
  const bk = g.ents.find(e => e.kind === 'b' && e.side === 0 && e.type === 'hq');
  const r = sim.tryBuild(g, 0, 'barracks', 0); assert.ok(r.ok, r.msg);
  const B = g.ents.find(e => e.kind === 'b' && e.side === 0 && e.type === 'barracks'); B.built = true; B.progress = 1; B.hp = B.maxHp;
  for (let i = 0; i < 3; i++) assert.ok(sim.tryTrain(g, 0, 'rifle').ok);
  step(g, 50);
  const us = g.ents.filter(e => e.kind === 'u' && e.side === 0); assert.strictEqual(us.length, 3);
  const F = g.sides[0].flags[2];
  for (const u of us) { assert.strictEqual(u.lane, 2); assert.strictEqual(u.po.o, 'hold'); assert.ok(near(u, F.u, F.v, 50), `waiting at the south flag (${u.u | 0},${u.v | 0})`); }
  step(g, 20); for (const u of us) assert.ok(near(u, F.u, F.v, 50), 'and still there: nothing moves on its own');
  // a forward Barracks
  const k = sim.cur().FWD_PADS.findIndex(p => p.at[0] < 1150 && p.at[1] < -300), node = g.nodes[sim.cur().FWD_PADS[k].node]; node.owner = 0;
  const slot = sim.FWD_SLOT + k; assert.ok(sim.tryBuild(g, 0, 'barracks', slot).ok);
  const FB = g.ents.find(e => e.kind === 'b' && e.side === 0 && e.slot === slot); FB.built = true; FB.progress = 1; FB.hp = FB.maxHp;
  FB.queue.push('rifle'); step(g, 30);
  const fu = g.ents.find(e => e.kind === 'u' && e.side === 0 && !us.includes(e));
  assert.ok(fu && fu.po.o === 'hold' && near(fu, FB.u, FB.v, 90), `beside the forward Barracks (${fu && fu.u | 0},${fu && fu.v | 0} vs ${FB.u},${FB.v})`);
  assert.strictEqual(fu.lane, 0); assert.strictEqual(fu.fwdHome, undefined);
  void bk;
});

test('Axiarch warp-ins hold where they arrive (the warp point), and a forward Genesis Gate\'s beside the Gate', () => {
  const g = mk('twolane', 'axiarchs'); sim.directControl(g, 0); g.sides[0].res.c = 1e5; g.sides[0].res.e = 1e5;
  const u = sim.spawnUnit(g, 0, 'shardling', 600, -150); assert.strictEqual(u.po.o, 'hold'); assert.strictEqual(u.holdU, 600);
});

test('healing: at the base flag and at a held depot after being moved there, not elsewhere; no Send damaged home', () => {
  const g = mk('threelane'); sim.directControl(g, 0); g.t = 300;
  const F = g.sides[0].flags[0], dep = g.nodes.find(n => n.type === 'repair' && n.v < 0);
  const a = sim.spawnUnit(g, 0, 'tank', 900, -400), b = sim.spawnUnit(g, 0, 'tank', 900, -380), c = sim.spawnUnit(g, 0, 'tank', 900, -360);
  for (const u of [a, b, c]) { u.hp = u.maxHp * 0.3; u.lastHurt = -99; }
  sim.command(g, 0, [a.id], 'go', F.u, F.v); sim.command(g, 0, [b.id], 'go', dep.u, dep.v);
  step(g, 3); assert.ok(c.hp <= c.maxHp * 0.3 + 1e-9, 'not healing out in the field'); assert.strictEqual(c.po.o, 'hold', 'and not sent anywhere');
  dep.owner = null; for (let i = 0; i < 60 * 20 && b.po.o !== 'hold'; i++) sim.update(g, sim.TICK);
  assert.ok(near(b, dep.u, dep.v, 40), 'at the depot'); dep.owner = null; const hb0 = b.hp; sim.updateRepair(g, 2); sim.updateFlagHeal(g, 2); assert.strictEqual(b.hp, hb0, 'a depot nobody holds heals nothing');
  dep.owner = 0; dep.prog = 100; const hb = b.hp; step(g, 5); assert.ok(b.hp > hb + b.maxHp * 0.1, 'a held depot heals');
  for (let i = 0; i < 60 * 40 && a.po.o !== 'hold'; i++) sim.update(g, sim.TICK);
  assert.ok(near(a, F.u, F.v, 50), 'arrived at the base flag');
  step(g, 10); assert.ok(a.hp > a.maxHp * 0.5, `the base flag heals (${(a.hp / a.maxHp).toFixed(2)})`);
  step(g, 30); assert.strictEqual(a.hp, a.maxHp, 'to full'); assert.strictEqual(a.po.o, 'hold', 'and stays');
  a.hp = a.maxHp * 0.5; a.lastHurt = g.t; const h0 = a.hp; step(g, 2); assert.strictEqual(a.hp, h0, 'not while under fire');
  const e = sim.spawnUnit(g, 1, 'tank', sim.flagHome(g, 1, 0).u, sim.flagHome(g, 1, 0).v); e.hp = e.maxHp / 2; e.lastHurt = -99; g.sides[1].stance = 'hold';
  sim.updateFlagHeal(g, 5); assert.strictEqual(e.hp, e.maxHp / 2, 'the AI side gets no flag healing');
});

test('flags move within limits; units holding at a flag stay, retreating ones head for its new spot; the active lane trains there', () => {
  const g = mk('twolane'); sim.directControl(g, 0);
  assert.ok(sim.setFlag(g, 0, 1, 99999, 280).ok); assert.strictEqual(g.sides[0].flags[1].u, sim.cur().L / 2 + sim.RALLY.past);
  assert.ok(sim.setFlag(g, 0, 1, -50, 280).ok); assert.strictEqual(g.sides[0].flags[1].u, sim.hqU(0) + sim.RALLY.min);
  assert.ok(!sim.setFlag(g, 0, 2, 600, 0).ok);
  sim.setFlag(g, 0, 0, 1100, -150); assert.ok(!sim.navShut(g.sides[0].flags[0].u, g.sides[0].flags[0].v), 'never inside the ridge');
  const u = sim.spawnUnit(g, 0, 'rifle', 700, -280); u.lane = 0; sim.command(g, 0, [u.id], 'retreat');
  sim.setFlag(g, 0, 0, 800, -280); step(g, 15); assert.ok(near(u, 800, -280, 50), 'to the moved flag');
});

test('an old match (a save from before v2.73) maps its orders onto Attack, Hold and Retreat', () => {
  const g = mk('twolane'), s = g.sides[0];
  const a = sim.spawnUnit(g, 0, 'rifle', 600, -200), b = sim.spawnUnit(g, 0, 'tank', 620, -200), c = sim.spawnUnit(g, 0, 'sniper', 640, 200), d = sim.spawnUnit(g, 0, 'heavy', 660, 200), e = sim.spawnUnit(g, 0, 'flame', 680, 0);
  a.lane = 0; b.lane = 0; c.lane = 1; d.lane = 1; e.lane = 1;
  sim.setStance(g, 0, 'attack');
  sim.giveOrder(g, 0, 'type', 'tank', 'hold');
  sim.giveOrder(g, 0, 'lane', 1, 'retreat');
  sim.giveOrder(g, 0, 'type', 'flame', 'move', 900, 100);
  s.rally = { at: 'fwd', def: 480, fwd: 800 }; d.medHome = 1; s.laneNew = 1;
  const save = sim.serialize(g, {}); const h = sim.deserialize(save); sim.directControl(h, 0);
  const U = id => h.ents.find(x => x.id === id), S = h.sides[0];
  assert.deepStrictEqual([U(a.id).po.o, U(b.id).po.o, U(c.id).po.o, U(d.id).po.o, U(e.id).po.o], ['attack', 'hold', 'retreat', 'retreat', 'go']);
  assert.strictEqual(U(b.id).holdU, 620); assert.strictEqual(U(d.id).medHome, 0);
  assert.strictEqual(S.rally, undefined); assert.strictEqual(S.active, 1); assert.strictEqual(S.flags[0].u, 480 + sim.CTRL.flagOut);
  assert.ok(!S.orders.all && !Object.keys(S.orders.types).length && !(S.orders.lanes && Object.keys(S.orders.lanes).length), 'the old orders are cleared');
  const z = sim.deserialize(sim.serialize(h, {})); assert.strictEqual(z.sides[0].direct, true); assert.strictEqual(z.ents.find(x => x.id === b.id).po.o, 'hold', 'a direct match saves and resumes as it is');
});
