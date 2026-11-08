// v2.63 (Phase 1, multi-lane engine): 2D grid fog, lanes, lane orders, true-distance capture and the save's map, on the
// TEST-ONLY two-lane map (tests/maps/twolane-test.js, loaded into the SIM's sandbox; never in the game). Two AIs playing
// it to the end is in tests/slow/multilane-match.test.js; Classic's identity with v2.60 is audit/sim/classic-identity.js.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadSim } = require('./load-sim');
const MAPDEF = require('./maps/twolane-test');

const sim = loadSim({ map: MAPDEF }), classic = loadSim();
const quiet = (S = sim) => { const g = S.newGame('normal', { seed: 3, factions: ['lastfist', 'lastfist'] }); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9; return g; };
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 60); i++) sim.update(g, sim.TICK); };
const clear = g => { g.ents = g.ents.filter(e => e.kind !== 'u'); };

test('the test map is valid, and only the test kit can load it: the game ships Classic alone', () => {
  assert.strictEqual(sim.validateMap(sim.MAP).length, 0, sim.validateMap(sim.MAP).join('; '));
  assert.strictEqual(sim.MAP.id, 'twolane-test');
  assert.ok(sim.MAP_2D && sim.MAP_LANED);
  assert.ok(!classic.MAP_2D && !classic.MAP_LANED && classic.MAP.id === 'classic');
  assert.strictEqual(Object.keys(classic.MAPS).join(), 'classic', 'no other map in the game');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(!html.includes('twolane-test'), 'the test map is not in index.html');
});

test('2D fog: a grid over the whole field; sight is a circle, so depth hides what a strip would show', () => {
  assert.strictEqual(sim.FOG_N, sim.FOG_NX * sim.FOG_NY);
  assert.ok(sim.FOG_NY > 1 && sim.FOG_CELL === 20);
  const g = quiet(); clear(g);
  const me = sim.spawnUnit(g, 0, 'rifle', 850, -260), far = sim.spawnUnit(g, 1, 'rifle', 850, 260), near = sim.spawnUnit(g, 1, 'rifle', 900, -230);
  sim.updateVision(g);
  assert.ok(sim.visibleTo(g, 0, near), 'an enemy beside it on its lane is seen');
  assert.ok(!sim.visibleTo(g, 0, far), 'an enemy at the same x on the other lane (520 deep) is not');
  assert.ok(g.fog[0].vis[sim.cellOf(850, -260)] && !g.fog[0].vis[sim.cellOf(850, 260)]);
  assert.ok(me.hp > 0);
});

test('targeting uses true distance: a unit on the other lane at the same x is out of reach', () => {
  const g = quiet(); clear(g);
  const a = sim.spawnUnit(g, 0, 'rifle', 850, -260), b = sim.spawnUnit(g, 1, 'rifle', 850, 260);
  assert.ok(sim.effDist(a, b) > 500);
  const hp = b.hp; step(g, 3);
  assert.strictEqual(b.hp, hp, 'no shots across the gap');
});

test('new units alternate between the lanes; each walks along its own lane to the far side', () => {
  const g = quiet(); clear(g);
  const us = [0, 1, 2, 3].map(i => sim.spawnUnit(g, 0, 'heavy', 300, 0));
  assert.deepStrictEqual(us.map(u => u.lane), [0, 1, 0, 1]);
  sim.setStance(g, 0, 'attack');
  let maxOff = 0;
  for (let t = 0; t < 60 * 60 && us.some(u => u.u < 1050); t++) {
    sim.update(g, sim.TICK);
    for (const u of us) if (u.u > 600 && u.u < 1100) maxOff = Math.max(maxOff, Math.abs(u.v - sim.laneY(sim.MAP.lanes[u.lane], u.u)));
  }
  assert.ok(maxOff <= sim.MAP.lanes[0].width / 2 + 1, `kept to the lane in the split (worst ${maxOff.toFixed(1)} off centre)`);
  for (const u of us) assert.ok(u.u >= 1050, 'made it past the split');
});

test('lane orders: setLane moves units and new ones; giveOrder can hold one lane while the other attacks', () => {
  const g = quiet(); clear(g);
  const us = [0, 1, 2, 3].map(() => sim.spawnUnit(g, 0, 'rifle', 600, 0));
  let r = sim.setLane(g, 0, 'lane', 'south', 'north');
  assert.ok(r.ok && r.n === 2 && us.every(u => u.lane === 0));
  r = sim.setLane(g, 0, 'type', 'rifle', 1); assert.ok(r.ok && us.every(u => u.lane === 1));
  r = sim.setLane(g, 0, 'all', null, 'north'); assert.ok(r.ok && g.sides[0].laneNew === 0 && sim.spawnUnit(g, 0, 'rifle', 300, 0).lane === 0);
  assert.ok(!sim.setLane(g, 0, 'all', null, 'west').ok, 'an unknown lane is refused');
  assert.ok(!classic.setLane(quiet(classic), 0, 'all', null, 0).ok, 'Classic has one lane');
  us[0].lane = 0; us[1].lane = 1; us[2].lane = 0; us[3].lane = 1; // two on each lane
  assert.ok(sim.giveOrder(g, 0, 'lane', 'north', 'hold').ok);
  assert.ok(sim.giveOrder(g, 0, 'lane', 1, 'attack').ok);
  assert.ok(!classic.giveOrder(quiet(classic), 0, 'lane', 0, 'hold').ok, 'no lane orders on Classic');
  const x0 = us.map(u => u.u); step(g, 4);
  assert.ok(Math.abs(us[0].u - x0[0]) < 5 && Math.abs(us[2].u - x0[2]) < 5, 'north holds');
  assert.ok(us[1].u > x0[1] + 100 && us[3].u > x0[3] + 100, 'south attacks');
});

test('node capture uses true distance: troops on the other lane at the node\'s x do not take it', () => {
  const g = quiet(); clear(g);
  const n = g.nodes[1]; assert.deepStrictEqual([n.u, n.v], sim.MAP.nodes[1].at);
  for (let i = 0; i < 3; i++) { const u = sim.spawnUnit(g, 0, 'rifle', n.u, -n.v); sim.giveOrder(g, 0, 'type', 'rifle', 'hold'); u.holdU = u.u; u.holdV = u.v; }
  step(g, 2); assert.strictEqual(n.prog, 0, 'nothing from across the gap');
  const c = sim.spawnUnit(g, 0, 'rifle', n.u, n.v); c.holdU = c.u; c.holdV = c.v; step(g, 2);
  assert.ok(n.prog > 0, 'capturing from inside the zone');
});

test('the save records the map; a save from another map or map version is refused', () => {
  const g = quiet(); step(g, 1);
  const s = sim.serialize(g, {}), o = JSON.parse(s);
  assert.deepStrictEqual(o.map, { id: 'twolane-test', v: 1 });
  assert.ok(sim.deserialize(s), 'resumes on its own map');
  assert.strictEqual(classic.deserialize(s), null, 'not on Classic');
  assert.strictEqual(sim.deserialize(JSON.stringify(Object.assign({}, o, { map: { id: 'twolane-test', v: 2 } }))), null, 'not on another version');
  const cg = quiet(classic), co = JSON.parse(classic.serialize(cg, {}));
  assert.deepStrictEqual(co.map, { id: 'classic', v: 1 });
  delete co.map; co.v = 30; assert.ok(classic.deserialize(JSON.stringify(co)), 'a v30 save (before the map key) resumes on Classic');
  assert.strictEqual(sim.deserialize(JSON.stringify(co)), null, 'but not on another map');
});

test('Classic units carry no lane, and Classic orders and fog are unchanged in shape', () => {
  const g = quiet(classic), u = classic.spawnUnit(g, 0, 'rifle', 400, 0);
  assert.ok(!('lane' in u));
  assert.strictEqual(classic.FOG_NY, 1);
  assert.strictEqual(classic.cellOf(455), Math.floor(455 / classic.FOG_CELL));
});
