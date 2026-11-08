// v2.66 (Phase 1, Split Army, docs/SPLIT_ARMY.md): squads are lanes. Per-squad orders and flags, moving units between
// squads, where new units go, aircraft following their squad over the ridge, and nothing new on Classic. The browser
// side (the squad column, long-press menus, minimap badges, the first-time tip) is in tests/split-army-ui.test.js.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const quiet = (map = 'twolane') => { const g = sim.newGame('normal', { map, seed: 7, factions: ['lastfist', 'lastfist'] }); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9; g.ents = g.ents.filter(e => e.kind !== 'u'); return g; };
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 60); i++) sim.update(g, sim.TICK); };
const laneY = (k, x) => sim.laneY(sim.cur().MAP.lanes[k], x);
test.afterEach(() => sim.useMap('classic'));

test('a squad order moves only that squad: North attacks along its lane while South holds', () => {
  const g = quiet();
  const us = [0, 1, 2, 3].map(() => sim.spawnUnit(g, 0, 'rifle', 470, 0)); // alternate: N, S, N, S
  assert.deepStrictEqual(us.map(u => u.lane), [0, 1, 0, 1]);
  assert.ok(sim.giveOrder(g, 0, 'lane', 1, 'hold').ok); assert.ok(sim.giveOrder(g, 0, 'lane', 0, 'attack').ok);
  const s0 = us.map(u => u.u); step(g, 15);
  assert.ok(us[0].u > s0[0] + 250 && us[2].u > s0[2] + 250, `North pushes (${us[0].u.toFixed(0)})`);
  assert.ok(Math.abs(us[1].u - s0[1]) < 10 && Math.abs(us[3].u - s0[3]) < 10, 'South holds');
  for (const u of [us[0], us[2]]) assert.ok(Math.abs(u.v - laneY(0, u.u)) < 120, 'on the north lane');
});

test('each lane has its own Forward flag; a squad rallies to its own flag, the army to both', () => {
  const g = quiet(), R = sim.rallyOf(g, 0);
  const fN = sim.flagPt(g, 0, 'fwd', 0), fS = sim.flagPt(g, 0, 'fwd', 1), b = sim.flagPt(g, 0, 'def', 0);
  assert.ok(Math.abs(fN[1] - laneY(0, R.fwd)) < 1e-9 && Math.abs(fS[1] - laneY(1, R.fwd)) < 1e-9, 'Forward flags on their lanes');
  assert.strictEqual(b[1], 0, 'the Base flag in the middle, where the lanes leave the base');
  const us = [0, 1, 2, 3].map(() => sim.spawnUnit(g, 0, 'rifle', 470, 0));
  let r = sim.useRally(g, 0, 'fwd', 1); assert.ok(r.ok && /South squad/.test(r.msg));
  assert.strictEqual(sim.sqFlag(R, 1), 'fwd'); assert.strictEqual(sim.sqFlag(R, 0), 'def');
  step(g, 14);
  for (const u of us.filter(x => x.lane === 1)) assert.ok(Math.hypot(u.u - fS[0], u.v - fS[1]) < 70, 'South at its Forward flag');
  for (const u of us.filter(x => x.lane === 0)) assert.ok(u.u < fN[0] - 150, 'North stayed home');
  r = sim.useRally(g, 0, 'fwd'); assert.ok(r.ok && /^Army/.test(r.msg)); step(g, 14);
  for (const u of us) { const f = sim.flagPt(g, 0, 'fwd', u.lane); assert.ok(Math.hypot(u.u - f[0], u.v - f[1]) < 70, 'everyone at their own lane\'s flag'); }
  sim.setRally(g, 0, 'fwd', R.fwd - 60); step(g, 6);
  for (const u of us) { const f = sim.flagPt(g, 0, 'fwd', u.lane); assert.ok(Math.hypot(u.u - f[0], u.v - f[1]) < 70, 'and they follow the moved flag'); }
});

test('moving a squad to the other lane: it walks round (never through the ridge) and takes the other lane\'s orders', () => {
  const g = quiet(), us = [0, 1, 2, 3].map(() => sim.spawnUnit(g, 0, 'rifle', 470, 0));
  sim.giveOrder(g, 0, 'lane', 0, 'attack'); step(g, 6); // North walks out along its lane
  sim.giveOrder(g, 0, 'lane', 1, 'hold');
  const north = us.filter(u => u.lane === 0), r = sim.setLane(g, 0, 'lane', 0, 1);
  assert.ok(r.ok && r.n === north.length && us.every(u => u.lane === 1), 'all in South now');
  sim.giveOrder(g, 0, 'lane', 1, 'attack');
  let inside = 0; for (let t = 0; t < 30 * 60; t++) { sim.update(g, sim.TICK); for (const u of north) if (sim.navShut(u.u, u.v)) inside++; }
  assert.strictEqual(inside, 0);
  for (const u of north) assert.ok(u.u > 650 && u.v > 120, `out on the south lane now (${u.u.toFixed(0)}, ${u.v.toFixed(0)})`);
});

test('where new units go: North, South or alternating; a unit type to one lane', () => {
  const g = quiet();
  assert.ok(sim.setLaneNew(g, 0, 1).ok); assert.deepStrictEqual([0, 1, 2].map(() => sim.spawnUnit(g, 0, 'rifle', 470, 0).lane), [1, 1, 1]);
  assert.ok(sim.setLaneNew(g, 0, null).ok); const a = [0, 1, 2, 3].map(() => sim.spawnUnit(g, 0, 'rifle', 470, 0).lane); assert.ok(a.includes(0) && a.includes(1), 'alternating again');
  assert.ok(!sim.setLaneNew(g, 0, 'west').ok);
  const t = sim.spawnUnit(g, 0, 'tank', 470, 0), r = sim.setLane(g, 0, 'type', 'rifle', 'north');
  assert.ok(r.ok && g.ents.filter(e => e.type === 'rifle').every(e => e.lane === 0) && t.lane !== undefined);
});

test('aircraft belong to a squad, follow its orders, and fly straight over the ridge', () => {
  const g = quiet();
  sim.setLaneNew(g, 0, 1); const a = sim.spawnUnit(g, 0, 'aircraft', 470, 0); assert.strictEqual(a.lane, 1);
  sim.giveOrder(g, 0, 'lane', 0, 'hold'); sim.giveOrder(g, 0, 'lane', 1, 'attack'); step(g, 6);
  assert.ok(a.u > 700 && Math.abs(a.v - laneY(1, a.u)) < 130, `over the south lane (${a.u.toFixed(0)}, ${a.v.toFixed(0)})`);
  sim.setLane(g, 0, 'lane', 1, 0); sim.giveOrder(g, 0, 'lane', 0, 'attack'); let overRidge = false; for (let t = 0; t < 16 * 60; t++) { sim.update(g, sim.TICK); if (sim.navShut(a.u, a.v)) overRidge = true; }
  assert.ok(overRidge && a.v < -120, 'it crossed straight over the ridge to the north lane');
});

test('a move order onto the ridge goes to the nearest open ground', () => {
  const g = quiet(); sim.spawnUnit(g, 0, 'rifle', 470, 0);
  sim.giveOrder(g, 0, 'all', null, 'move', 800, 0);
  const o = g.sides[0].orders.all; assert.ok(!sim.navShut(o.u, o.v) && Math.hypot(o.u - 800, o.v) < 200);
});

test('Classic: no squads and nothing new for the player', () => {
  const g = quiet('classic');
  assert.ok(!sim.setLaneNew(g, 0, 0).ok);
  assert.ok(!('lane' in sim.spawnUnit(g, 0, 'rifle', 470, 0)));
  const r = sim.useRally(g, 0, 'fwd'); assert.ok(r.ok && g.sides[0].orders.all.o === 'move' && g.sides[0].orders.all.v === 0 && !g.sides[0].rally.sq);
});
