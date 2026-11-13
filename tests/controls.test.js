// v2.73 (docs/CONTROLS.md): direct control in the SIM; v2.76: the refinements after the Three-Lane playtest. The player's
// side (side.direct) gives each unit its own order: move to a spot (stopping to fight what it meets, then Hold there),
// attack a target (then Hold), Attack down a lane (the one picked, else its own), Hold, Retreat to the base rally point
// (holding fire, ignoring enemies). Nothing moves on its own: new units gather at the base rally point and hold, a forward
// Barracks' units beside it, each in its own space. Units heal at the base rally point and held depots only. Old orders
// and v2.73-v2.75's lane flags map onto the new ones. Control groups are saved with the match. A side without direct
// control (the AI) is untouched. The browser side is in tests/controls-ui.test.js.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
test.afterEach(() => sim.useMap('classic'));
const mk = (map = 'classic', fac = 'lastfist') => { const g = sim.newGame('normal', { map, seed: 7, factions: [fac, 'lastfist'] }); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9; return g; };
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 60); i++) sim.update(g, sim.TICK); };
const ids = us => us.map(u => u.id);
const near = (u, x, y, r) => Math.hypot(u.u - x, u.v - y) <= r;
const scr = (a, b) => Math.hypot(a.u - b.u, (a.v - b.v) * 0.5); // apart as on screen (DY 0.5)
function spacedOut(us, msg) { // no two units on the same spot: at least their footprints apart (a little slack for the last step)
  for (let i = 0; i < us.length; i++) for (let j = i + 1; j < us.length; j++) {
    const a = us[i], b = us[j]; if (!!sim.UDEF[a.type].air !== !!sim.UDEF[b.type].air) continue;
    const need = sim.ctlFoot(a.type) + sim.ctlFoot(b.type);
    assert.ok(scr(a, b) >= need - 2, `${msg}: units ${a.id} and ${b.id} ${scr(a, b).toFixed(1)} apart (need ${need})`);
  }
}
const tough = e => { e.hp = e.maxHp = 1e6; return e; };

test('direct control: the state is created then (control groups, no lane flags or active lane); the AI side is untouched', () => {
  const g = mk();
  assert.strictEqual(g.sides[0].direct, undefined);
  assert.ok(!sim.command(g, 0, [], 'hold').ok, 'refused without direct control');
  assert.ok(sim.directControl(g, 0)); assert.ok(!sim.directControl(g, 0), 'once');
  const S = g.sides[0];
  assert.strictEqual(JSON.stringify(S.groups), '[[],[],[]]'); assert.strictEqual(S.flags, undefined); assert.strictEqual(S.active, undefined); assert.strictEqual(S.laneNew, undefined);
  assert.strictEqual(g.sides[1].direct, undefined); assert.strictEqual(g.sides[1].groups, undefined, 'the AI side is untouched');
  for (const map of ['classic', 'twolane', 'threelane']) {
    const h = mk(map), B = sim.ctlBase(0), m = sim.MAPS[map];
    assert.deepStrictEqual([B.u, B.v], [...m.bases[0].rally], `${map}: the base rally point is the map's rally point`);
    assert.deepStrictEqual([sim.ctlBase(1).u, sim.ctlBase(1).v], [...m.bases[1].rally]); void h;
  }
});

test('new units gather at the base rally point, each in its own space, and wait on Hold; a forward Barracks\' units beside it', () => {
  for (const map of ['classic', 'threelane']) {
    const g = mk(map); sim.directControl(g, 0); g.sides[0].res.c = 1e5; g.sides[0].res.e = 1e5;
    assert.ok(sim.tryBuild(g, 0, 'barracks', 0).ok); assert.ok(sim.tryBuild(g, 0, 'barracks', 1).ok);
    for (const B of g.ents.filter(e => e.kind === 'b' && e.side === 0 && e.type === 'barracks')) { B.built = true; B.progress = 1; B.hp = B.maxHp; }
    for (let i = 0; i < 10; i++) { const r = sim.tryTrain(g, 0, 'rifle'); assert.ok(r.ok, r.msg); }
    step(g, 60);
    const us = g.ents.filter(e => e.kind === 'u' && e.side === 0), R = sim.ctlBase(0);
    assert.ok(us.length >= 8, `${map}: trained ${us.length}`);
    for (const u of us) { assert.strictEqual(u.po.o, 'hold', `${map}: waiting on Hold`); assert.ok(near(u, R.u, R.v, 110), `${map}: at the base rally point (${u.u | 0},${u.v | 0})`); }
    spacedOut(us, `${map} rally point`);
    const at = us.map(u => [u.u, u.v]); step(g, 20); us.forEach((u, i) => assert.ok(Math.hypot(u.u - at[i][0], u.v - at[i][1]) < 1, 'nothing moves on its own'));
  }
  const g = mk('threelane'); sim.directControl(g, 0); g.sides[0].res.c = 1e5; g.sides[0].res.e = 1e5;
  const k = sim.cur().FWD_PADS.findIndex(p => p.at[0] < 1150 && p.at[1] < -300), node = g.nodes[sim.cur().FWD_PADS[k].node]; node.owner = 0;
  const slot = sim.FWD_SLOT + k; assert.ok(sim.tryBuild(g, 0, 'barracks', slot).ok);
  const FB = g.ents.find(e => e.kind === 'b' && e.side === 0 && e.slot === slot); FB.built = true; FB.progress = 1; FB.hp = FB.maxHp;
  FB.queue.push('rifle', 'rifle', 'rifle'); step(g, 30);
  const fu = g.ents.filter(e => e.kind === 'u' && e.side === 0);
  assert.strictEqual(fu.length, 3);
  for (const u of fu) { assert.ok(u.po.o === 'hold' && near(u, FB.u, FB.v, 110), `beside the forward Barracks (${u.u | 0},${u.v | 0} vs ${FB.u},${FB.v})`); assert.strictEqual(u.lane, 0); assert.strictEqual(u.fwdHome, undefined); }
  spacedOut(fu, 'beside a forward Barracks');
});

test('a tapped spot: they spread into their own spaces there, stop to fight enemies they meet on the way, then hold', () => {
  const g = mk(); sim.directControl(g, 0);
  const us = [0, 1, 2, 3, 4, 5].map(i => sim.spawnUnit(g, 0, i < 4 ? 'rifle' : 'tank', 450, 0)); // all on one spot
  const r = sim.command(g, 0, ids(us), 'go', 760, 20);
  assert.ok(r.ok && r.n === 6, r.msg);
  spacedOut(us.map(u => ({ ...u, u: u.po.u, v: u.po.v })), 'the spots given');
  for (const u of us) assert.ok(near({ u: u.po.u, v: u.po.v }, 760, 20, 80));
  const foe = tough(sim.spawnUnit(g, 1, 'rifle', 600, 0)); g.sides[1].stance = 'hold'; foe.holdU = 600; foe.holdV = 0; foe.dmg = 0;
  let shot = false; for (let i = 0; i < 60 * 6; i++) { sim.update(g, sim.TICK); if (us.some(u => u.po.o === 'go' && u.tgt === foe.id)) shot = true; }
  assert.ok(shot, 'they fight the enemy they meet on the way');
  assert.ok(us.every(u => u.u < 700), 'and stop for it'); foe.hp = 0; step(g, 15);
  for (const u of us) { assert.strictEqual(u.po.o, 'hold', 'arrived: Hold'); assert.ok(near(u, u.holdU, u.holdV, 12)); }
  spacedOut(us, 'arrived');
});

test('melee units close on an enemy they meet on the way; Hold spreads stacked units apart where they stand', () => {
  const g = mk('classic', 'bloomhost'); sim.directControl(g, 0);
  const sk = sim.spawnUnit(g, 0, 'ravager', 450, 0);
  const foe = tough(sim.spawnUnit(g, 1, 'rifle', 640, 60)); g.sides[1].stance = 'hold'; foe.holdU = 640; foe.holdV = 60;
  sim.command(g, 0, [sk.id], 'go', 900, -40);
  let hit = false; for (let i = 0; i < 60 * 12; i++) { sim.update(g, sim.TICK); if (sk.tgt === foe.id) hit = true; }
  assert.ok(hit, 'the melee unit stopped to fight on the way');
  const h = mk(); sim.directControl(h, 0);
  const st = [0, 1, 2, 3].map(() => sim.spawnUnit(h, 0, 'rifle', 700, 10));
  sim.command(h, 0, ids(st), 'hold'); step(h, 4);
  for (const u of st) { assert.strictEqual(u.po.o, 'hold'); assert.ok(near(u, 700, 10, 60), 'near where they stood'); }
  spacedOut(st, 'Hold');
});

test('Retreat: back to the base rally point holding fire and ignoring enemies, each in its own space, then Hold', () => {
  const g = mk('threelane'); sim.directControl(g, 0);
  const us = [sim.spawnUnit(g, 0, 'rifle', 900, -400), sim.spawnUnit(g, 0, 'rifle', 900, 0), sim.spawnUnit(g, 0, 'tank', 900, 380), sim.spawnUnit(g, 0, 'ravager', 920, 0)];
  const foe = tough(sim.spawnUnit(g, 1, 'rifle', 860, -400)); g.sides[1].stance = 'hold'; foe.holdU = 860; foe.holdV = -400; void foe;
  sim.command(g, 0, ids(us), 'retreat');
  let shot = false; for (let i = 0; i < 60 * 40 && us.some(u => u.po.o === 'retreat'); i++) { sim.update(g, sim.TICK); if (us.some(u => u.tgt)) shot = true; }
  assert.ok(!shot, 'retreating units hold their fire');
  const R = sim.ctlBase(0);
  for (const u of us) { assert.strictEqual(u.po.o, 'hold'); assert.ok(near(u, R.u, R.v, 80), `at the base rally point (${u.u | 0},${u.v | 0})`); assert.ok(!sim.navShut(u.u, u.v)); }
  spacedOut(us, 'retreated');
});

test('Attack: down the lane picked (or each unit\'s own); on Classic down the single lane', () => {
  const g = mk('threelane'); sim.directControl(g, 0);
  const n = sim.spawnUnit(g, 0, 'rifle', 900, -400), c = sim.spawnUnit(g, 0, 'rifle', 900, 0), s = sim.spawnUnit(g, 0, 'tank', 900, 380);
  n.lane = 2; c.lane = 0; // wrong on purpose: without a lane the order takes the lane each is in
  sim.command(g, 0, ids([n, c, s]), 'attack');
  assert.deepStrictEqual([n.lane, c.lane, s.lane], [0, 1, 2], 'the lane each is in');
  step(g, 8);
  assert.ok(n.u > 1000 && Math.abs(n.v + 400) < 130, `north kept to the north lane (${n.u | 0}, ${n.v | 0})`);
  assert.ok(c.u > 1000 && Math.abs(c.v) < 130, 'centre in the centre lane'); assert.ok(s.u > 1000 && Math.abs(s.v - 400) < 130, 'south in the south');
  const h = mk('threelane'); sim.directControl(h, 0);
  const R = sim.ctlBase(0), us = [0, 1, 2, 3].map(i => sim.spawnUnit(h, 0, 'rifle', R.u + i * 10, R.v));
  assert.ok(!sim.command(h, 0, ids(us), 'attack', 3).ok, 'no lane 3');
  const r = sim.command(h, 0, ids(us), 'attack', 2); assert.ok(r.ok && /south/.test(r.msg), r.msg);
  for (const u of us) assert.strictEqual(u.lane, 2);
  step(h, 25); for (const u of us) assert.ok(u.u > 900 && Math.abs(u.v - 400) < 130 && !sim.navShut(u.u, u.v), `down the south lane (${u.u | 0}, ${u.v | 0})`);
  const x = sim.spawnUnit(h, 0, 'rifle', 1000, -400); sim.command(h, 0, [x.id], 'attack', 1); step(h, 30);
  assert.ok(Math.abs(x.v) < 130 && x.u > 1000 && !sim.navShut(x.u, x.v), `from the north lane over to the centre (${x.u | 0}, ${x.v | 0})`);
  const k = mk(); sim.directControl(k, 0); const a = sim.spawnUnit(k, 0, 'rifle', 400, 30); sim.command(k, 0, [a.id], 'attack'); step(k, 6);
  assert.ok(a.u > 600, 'Classic: down the single lane');
});

test('a target: they go and attack it (fighting what they meet), then hold where they are; only enemies you can see', () => {
  const g = mk(); sim.directControl(g, 0);
  const us = [0, 1, 2].map(i => sim.spawnUnit(g, 0, 'tank', 600 + i * 8, 0));
  const t = sim.spawnUnit(g, 1, 'rifle', 820, 40); g.sides[1].stance = 'hold'; t.holdU = 900; t.holdV = 40; t.dmg = 0;
  const other = sim.spawnUnit(g, 1, 'rifle', 900, -40); other.holdU = 900; other.holdV = -40;
  sim.updateVision(g);
  assert.ok(!sim.command(g, 0, ids(us), 'target', us[1].id).ok, 'not your own unit');
  const vis = sim.command(g, 0, ids(us), 'target', t.id); assert.ok(vis.ok, vis.msg);
  for (const u of us) assert.deepStrictEqual([u.po.o, u.po.id], ['target', t.id]);
  let first = null; for (let i = 0; i < 60 * 30 && t.hp > 0; i++) { sim.update(g, sim.TICK); if (!first && us.some(u => u.tgt)) first = us.find(u => u.tgt).tgt; }
  assert.strictEqual(first, t.id, 'the target first'); assert.ok(t.hp <= 0, 'killed');
  step(g, 3); for (const u of us) { assert.strictEqual(u.po.o, 'hold', 'then Hold'); assert.ok(u.u < 820, 'where they are, not on past it'); }
  spacedOut(us, 'after the target');
  // a building
  const h = mk(); sim.directControl(h, 0); h.sides[1].res.c = 1e5;
  assert.ok(sim.tryBuild(h, 1, 'barracks', 0).ok); const B = h.ents.find(e => e.kind === 'b' && e.side === 1 && e.type === 'barracks'); B.built = true; B.progress = 1; B.hp = 300;
  const ts = [0, 1, 2, 3].map(i => sim.spawnUnit(h, 0, 'tank', B.u - 170 - i * 10, 0)); for (const u of ts) u.hp = u.maxHp = 1e6;
  sim.updateVision(h);
  const fog = sim.command(h, 0, ids(ts), 'target', h.sides[1].hq.id); void fog;
  assert.ok(sim.command(h, 0, ids(ts), 'target', B.id).ok);
  for (let i = 0; i < 60 * 40 && B.hp > 0; i++) sim.update(h, sim.TICK);
  assert.ok(B.hp <= 0, 'the building is destroyed'); step(h, 6); for (const u of ts) assert.ok(u.po.o === 'hold' || (u.po.o === 'go' && u.tgt), `hold, or fighting what is in reach a step from its spot (${u.u | 0},${u.v | 0} ${JSON.stringify(u.po)})`);
  // out of sight: refused
  const k = mk(); sim.directControl(k, 0); const me = sim.spawnUnit(k, 0, 'rifle', 400, 0), far = sim.spawnUnit(k, 1, 'rifle', 1200, 0); sim.updateVision(k);
  assert.ok(!sim.command(k, 0, [me.id], 'target', far.id).ok, 'an enemy you can\'t see');
  // a relic guard
  const r = mk('threelane'); sim.directControl(r, 0); const gd = r.guards[0], at = sim.spawnUnit(r, 0, 'tank', gd.u - 200, gd.v); sim.updateVision(r);
  assert.ok(sim.command(r, 0, [at.id], 'target', gd.id).ok, 'a relic guard can be targeted');
});

test('spots are never inside a wall or off the map, wherever the tap lands', () => {
  const g = mk('threelane'); sim.directControl(g, 0);
  const us = []; for (let i = 0; i < 30; i++) us.push(sim.spawnUnit(g, 0, i % 5 ? 'rifle' : 'tank', 700 + (i % 6) * 8, -10 + (i % 4) * 8));
  for (const [x, y] of [[880, -200], [830, -130], [1100, -280], [700, -540], [10, 0]]) {
    assert.ok(sim.command(g, 0, ids(us), 'go', x, y).ok);
    for (const u of us) { assert.ok(!sim.navShut(u.po.u, u.po.v), `(${x},${y}): spot ${u.po.u | 0},${u.po.v | 0} in a wall`); assert.ok(u.po.u >= 0 && u.po.u <= sim.cur().L && Math.abs(u.po.v) <= 560); }
    spacedOut(us.map(u => ({ ...u, u: u.po.u, v: u.po.v })), `spots at ${x},${y}`);
  }
});

test('healing: at the base rally point and at a held depot after being moved there, not elsewhere', () => {
  const g = mk('threelane'); sim.directControl(g, 0); g.t = 300;
  const R = sim.ctlBase(0), dep = g.nodes.find(n => n.type === 'repair' && n.v < 0);
  const a = sim.spawnUnit(g, 0, 'tank', 900, -400), b = sim.spawnUnit(g, 0, 'tank', 900, -380), c = sim.spawnUnit(g, 0, 'tank', 900, -360);
  for (const u of [a, b, c]) { u.hp = u.maxHp * 0.3; u.lastHurt = -99; }
  sim.command(g, 0, [a.id], 'retreat'); sim.command(g, 0, [b.id], 'go', dep.u, dep.v);
  step(g, 3); assert.ok(c.hp <= c.maxHp * 0.3 + 1e-9, 'not healing out in the field'); assert.strictEqual(c.po.o, 'hold', 'and not sent anywhere');
  for (let i = 0; i < 60 * 20 && b.po.o !== 'hold'; i++) sim.update(g, sim.TICK);
  assert.ok(near(b, dep.u, dep.v, 40), 'at the depot'); dep.owner = null; const hb0 = b.hp; sim.updateRepair(g, 2); sim.updateBaseHeal(g, 2); assert.strictEqual(b.hp, hb0, 'a depot nobody holds heals nothing');
  dep.owner = 0; dep.prog = 100; const hb = b.hp; step(g, 5); assert.ok(b.hp > hb + b.maxHp * 0.1, 'a held depot heals');
  for (let i = 0; i < 60 * 40 && a.po.o !== 'hold'; i++) sim.update(g, sim.TICK);
  assert.ok(near(a, R.u, R.v, 60), 'arrived at the base rally point');
  step(g, 10); assert.ok(a.hp > a.maxHp * 0.5, `the base rally point heals (${(a.hp / a.maxHp).toFixed(2)})`);
  step(g, 30); assert.strictEqual(a.hp, a.maxHp, 'to full'); assert.strictEqual(a.po.o, 'hold', 'and stays');
  a.hp = a.maxHp * 0.5; a.lastHurt = g.t; const h0 = a.hp; step(g, 2); assert.strictEqual(a.hp, h0, 'not while under fire');
  const R1 = sim.ctlBase(1), e = sim.spawnUnit(g, 1, 'tank', R1.u, R1.v); e.hp = e.maxHp / 2; e.lastHurt = -99;
  sim.updateBaseHeal(g, 5); assert.strictEqual(e.hp, e.maxHp / 2, 'the AI side gets no rally-point healing');
});

test('enemies, guards and other sides\' units are never commanded; orders refused off the field and before GO', () => {
  const g = mk('threelane'); sim.directControl(g, 0);
  const u = sim.spawnUnit(g, 0, 'rifle', 1300, -400), e = sim.spawnUnit(g, 1, 'rifle', 400, 0);
  const r = sim.command(g, 0, [u.id, e.id, g.guards[0].id], 'go', 1300, 400);
  assert.strictEqual(r.n, 1); assert.strictEqual(u.lane, 2); assert.strictEqual(e.po, undefined); assert.strictEqual(g.guards[0].po, undefined);
  step(g, 40); assert.ok(u.hp > 0 && near(u, 1300, 400, 40), `through the gap to the south lane (${u.u | 0},${u.v | 0})`);
  assert.ok(!sim.command(g, 0, [u.id], 'go', -50, 0).ok, 'off the battlefield'); assert.ok(!sim.command(g, 0, [u.id], 'jump').ok);
  g.countdown = 3; assert.ok(!sim.command(g, 0, [u.id], 'hold').ok, 'not during GET READY');
});

test('Axiarch warp-ins hold where they arrive, stepping apart', () => {
  const g = mk('twolane', 'axiarchs'); sim.directControl(g, 0);
  const a = sim.spawnUnit(g, 0, 'shardling', 600, -150); assert.strictEqual(a.po.o, 'hold'); assert.strictEqual(a.holdU, 600);
  const us = [0, 1, 2, 3].map(() => { const x = sim.spawnUnit(g, 0, 'shardling', 600, -150); sim.arriveOrders(g, x); return x; });
  step(g, 3); for (const x of us) { assert.strictEqual(x.po.o, 'hold'); assert.ok(near(x, 600, -150, 60)); }
  spacedOut([a, ...us], 'warp-ins');
});

test('control groups: saved from living own units, the dead drop out, nothing is added, and they survive save and load', () => {
  const g = mk(); sim.directControl(g, 0);
  const us = [0, 1, 2, 3].map(i => sim.spawnUnit(g, 0, 'rifle', 500 + i * 20, 0)), foe = sim.spawnUnit(g, 1, 'rifle', 900, 0);
  assert.ok(!sim.setGroup(g, 0, 3, ids(us)).ok, 'three slots'); assert.ok(!sim.setGroup(g, 0, 0, [foe.id]).ok, 'only your own units');
  const r = sim.setGroup(g, 0, 1, [...ids(us), foe.id]); assert.ok(r.ok && r.n === 4, r.msg);
  us[0].hp = 0; step(g, 0.1);
  assert.deepStrictEqual([...sim.groupUnits(g, 0, 1).map(e => e.id)], ids(us.slice(1)), 'the dead drop out'); assert.strictEqual(g.sides[0].groups[1].length, 3);
  sim.spawnUnit(g, 0, 'rifle', 520, 0); assert.strictEqual(sim.groupUnits(g, 0, 1).length, 3, 'new units are never added');
  const h = sim.deserialize(sim.serialize(g, {})); sim.directControl(h, 0);
  assert.deepStrictEqual([...h.sides[0].groups[1]], ids(us.slice(1)), 'saved with the match'); assert.strictEqual(h.sides[0].groups[0].length, 0);
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
  const U = id => h.ents.find(x => x.id === id), S = h.sides[0], R = sim.ctlBase(0);
  assert.deepStrictEqual([U(a.id).po.o, U(b.id).po.o, U(c.id).po.o, U(d.id).po.o, U(e.id).po.o], ['attack', 'hold', 'retreat', 'retreat', 'go']);
  assert.strictEqual(U(b.id).holdU, 620); assert.strictEqual(U(d.id).medHome, 0);
  assert.ok(near({ u: U(c.id).po.u, v: U(c.id).po.v }, R.u, R.v, 60), 'Retreat: to the base rally point');
  assert.strictEqual(S.rally, undefined); assert.strictEqual(S.active, undefined); assert.strictEqual(S.flags, undefined); assert.strictEqual(S.laneNew, undefined);
  assert.ok(!S.orders.all && !Object.keys(S.orders.types).length && !(S.orders.lanes && Object.keys(S.orders.lanes).length), 'the old orders are cleared');
  const z = sim.deserialize(sim.serialize(h, {})); assert.strictEqual(z.sides[0].direct, true); assert.strictEqual(z.ents.find(x => x.id === b.id).po.o, 'hold', 'a direct match saves and resumes as it is');
});

test('a v2.73-v2.75 save: its lane flags and active lane are removed; retreating units head for the base rally point', () => {
  const g = mk('threelane'); sim.directControl(g, 0);
  const S = g.sides[0], a = sim.spawnUnit(g, 0, 'rifle', 900, -400), b = sim.spawnUnit(g, 0, 'tank', 520, -200), c = sim.spawnUnit(g, 0, 'rifle', 700, 0);
  // what v2.75 left in a save: a base flag per lane, the active lane, units retreating to a flag (no spot), one holding at a flag
  S.flags = [{ u: 500, v: -150 }, { u: 500, v: 0 }, { u: 500, v: 150 }]; S.active = 2; S.laneNew = 2; delete S.groups;
  a.po = { o: 'retreat' }; b.holdU = 520; b.holdV = -150; b.po = { o: 'hold' }; c.po = { o: 'attack' };
  const h = sim.deserialize(sim.serialize(g, {})); assert.ok(h, 'it loads');
  assert.strictEqual(sim.directControl(h, 0), false, 'already under direct control');
  const H = h.sides[0], U = id => h.ents.find(x => x.id === id), R = sim.ctlBase(0);
  assert.strictEqual(H.flags, undefined); assert.strictEqual(H.active, undefined); assert.strictEqual(H.laneNew, undefined); assert.strictEqual(JSON.stringify(H.groups), '[[],[],[]]');
  assert.strictEqual(U(a.id).po.o, 'retreat'); assert.ok(near({ u: U(a.id).po.u, v: U(a.id).po.v }, R.u, R.v, 60), 'to the base rally point');
  assert.deepStrictEqual([U(b.id).po.o, U(b.id).holdU], ['hold', 520], 'holding by a flag: stays'); assert.strictEqual(U(c.id).po.o, 'attack');
  step(h, 40); assert.strictEqual(U(a.id).po.o, 'hold'); assert.ok(near(U(a.id), R.u, R.v, 60));
});

test('v2.77: units on the move pass relic guards by (unless one is their target); Attack to another lane crosses over', () => {
  const g = mk('threelane'); sim.directControl(g, 0);
  const us = [[740, 400], [760, 380], [780, 410]].map(([u, v]) => tough(sim.spawnUnit(g, 0, 'rifle', u, v)));
  sim.command(g, 0, ids(us), 'attack', 0);
  let shotGuard = false; for (let i = 0; i < 60 * 40; i++) { sim.update(g, sim.TICK); if (us.some(u => g.guards.some(x => x.id === u.tgt))) shotGuard = true; }
  assert.ok(!shotGuard, 'no stopping for the relic guards on the way');
  for (const u of us) assert.ok(u.u > 1100 && u.v < -300 && u.po.o === 'attack' && u.po.ju == null, `crossed to the north lane and went down it (${u.u | 0},${u.v | 0})`);
  const h = mk('threelane'); sim.directControl(h, 0); const gd = h.guards[0], t = tough(sim.spawnUnit(h, 0, 'tank', gd.u - 160, gd.v)); sim.updateVision(h);
  sim.command(h, 0, [t.id], 'target', gd.id); let hit = false; for (let i = 0; i < 60 * 10; i++) { sim.update(h, sim.TICK); if (t.tgt === gd.id) hit = true; }
  assert.ok(hit, 'a targeted guard is fought');
});
