// v2.81 (docs/FACTION_REWORK.md batch 1): the Test Range's SIM side (src/sim/testrange.js). A range game is a normal game on
// the real SIM with the base taken out: no HQ in play, no nodes, no storm, no fog; it never ends. The same records placed
// with the same seed replay tick for tick (Reset), whether the units were placed as a group or one by one; a hushed side
// neither fires nor moves; Attack sends units at what they can hurt; Hold keeps them; every faction's every unit can be placed.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');
const sim = loadSim();
const hash = g => JSON.stringify(g.ents.map(e => [e.id, e.type, e.side, +e.u.toFixed(4), +e.v.toFixed(4), +e.hp.toFixed(4), +(e.shp || 0).toFixed(4)])) + '|' + g.rs + '|' + g.projs.length;
const steps = (g, s) => { for (let i = 0; i < Math.round(s * 60); i++) sim.rangeStep(g); };
function placeLive(seed) { // groups placed as the UI places them, recorded as the UI records them
  const g = sim.rangeGame({ seed, factions: ['lastfist', 'bloomhost'] }), items = [];
  for (const e of sim.rangeUnits(g, 0, 'artillery', 640, 0, 3)) items.push({ kind: 'u', side: 0, type: 'artillery', u: e.u, v: e.v });
  for (const e of sim.rangeUnits(g, 0, 'rifle', 700, 20, 5)) items.push({ kind: 'u', side: 0, type: 'rifle', u: e.u, v: e.v });
  for (const e of sim.rangeUnits(g, 1, 'skitterling', 1060, 0, 20)) items.push({ kind: 'u', side: 1, type: 'skitterling', u: e.u, v: e.v });
  sim.rangeBuilding(g, 1, 'bloomhost', 'turret', 1150, 0); items.push({ kind: 'b', side: 1, fac: 'bloomhost', type: 'turret', u: 1150, v: 0 });
  g.sides[0].mode = 'attack'; g.sides[1].mode = 'attack';
  return { g, items };
}
function rebuild(items, seed) { // what Reset does
  const g = sim.rangeGame({ seed, factions: ['lastfist', 'bloomhost'] });
  for (const it of items) it.kind === 'u' ? sim.rangeUnit(g, it.side, it.type, it.u, it.v) : sim.rangeBuilding(g, it.side, it.fac, it.type, it.u, it.v);
  g.sides[0].mode = 'attack'; g.sides[1].mode = 'attack';
  return g;
}

test('a range game: no HQ in play, no nodes, no storm, everything visible, never ends', () => {
  const g = sim.rangeGame({ seed: 3 });
  assert.ok(g.range && g.noStorm); assert.strictEqual(g.nodes.length, 0);
  assert.ok(!g.ents.some(e => e.type === 'hq'));
  sim.rangeUnits(g, 0, 'rifle', 640, 0, 3); sim.rangeUnits(g, 1, 'rifle', 1060, 0, 3);
  sim.update(g, sim.TICK);
  for (const e of g.ents) assert.ok(sim.visibleTo(g, 0, e) && sim.visibleTo(g, 1, e), 'no fog');
  g.t = sim.EXT.limit + 5; steps(g, 1); assert.strictEqual(g.over, false);
});

test('Reset replays exactly: live placement, and two rebuilds, stay identical tick for tick', () => {
  const { g: g0, items } = placeLive(11), g1 = rebuild(items, 11), g2 = rebuild(items, 11);
  assert.strictEqual(hash(g0), hash(g1)); assert.strictEqual(hash(g1), hash(g2));
  for (let k = 0; k < 40; k++) { steps(g0, 0.5); steps(g1, 0.5); steps(g2, 0.5); assert.strictEqual(hash(g0), hash(g1), `at ${(k + 1) / 2} s`); assert.strictEqual(hash(g1), hash(g2)); }
  const R = sim.rangeRead(g1);
  assert.ok(R.dmg[0] > 0 && R.dmg[1] > 0 && R.kills[0] > 0, 'they fought');
  const g3 = rebuild(items, 12); steps(g3, 20); assert.notStrictEqual(hash(g3), hash(g1), 'another seed plays differently');
});

test('a side that does not fight back neither fires nor moves; the other side wipes it and the time is recorded', () => {
  const g = sim.rangeGame({ seed: 5 });
  sim.rangeUnits(g, 0, 'tank', 640, 0, 3); const red = sim.rangeUnits(g, 1, 'rifle', 1000, 0, 5); sim.rangeBuilding(g, 1, 'lastfist', 'turret', 1100, 0);
  const at = red.map(e => [e.u, e.v]);
  g.sides[0].mode = 'attack'; g.sides[1].mode = 'attack'; g.sides[1].hush = true;
  steps(g, 3); red.forEach((e, i) => { if (e.hp > 0) assert.deepStrictEqual([e.u, e.v], at[i]); });
  steps(g, 60);
  const R = sim.rangeRead(g);
  assert.strictEqual(R.dmg[1], 0); assert.strictEqual(R.n[1], 0);
  assert.ok(R.wipe && R.wipe.side === 1 && R.wipe.t > 0); assert.strictEqual(R.kills[0], 6); // five units and the Turret
});

test('Hold keeps a side where it stands; Attack sends each unit at the nearest enemy it can hurt', () => {
  const g = sim.rangeGame({ seed: 9 });
  const blue = sim.rangeUnits(g, 0, 'rifle', 400, 0, 3), red = sim.rangeUnits(g, 1, 'interceptor', 1300, 0, 1).concat(sim.rangeUnits(g, 1, 'tank', 1300, 40, 1));
  steps(g, 3); for (const e of blue.concat(red)) assert.strictEqual(e.po.o, 'hold');
  sim.rangeMode(g, 1, 'attack');
  assert.strictEqual(red[1].po.o, 'target'); assert.ok(blue.some(b => b.id === red[1].po.id), 'the Tank goes for a Rifleman');
  assert.strictEqual(red[0].po.o, 'hold', 'an Interceptor hits only aircraft: nothing here to hurt, so it holds');
  const x0 = red[1].u; steps(g, 4); assert.ok(red[1].u < x0 - 20, 'the Tank advances');
  for (const e of blue) assert.strictEqual(e.po.o, 'hold');
});

test('every unit of every faction and both target buildings can be placed and fight', () => {
  for (const fac of sim.FACTION_KEYS) {
    const types = sim.rangeTypes(fac); assert.ok(types.length >= 13, fac);
    const g = sim.rangeGame({ seed: 1, factions: [fac, fac] });
    types.forEach((t, i) => sim.rangeUnits(g, 0, t, 300 + (i % 8) * 40, -60 + Math.floor(i / 8) * 60, 1));
    for (const r of sim.RANGE_B) sim.rangeBuilding(g, 1, fac, r, 1300 + sim.RANGE_B.indexOf(r) * 120, 0);
    sim.rangeUnits(g, 1, 'rifle', 1200, 0, 5);
    g.sides[0].mode = 'attack'; steps(g, 30);
    assert.ok(sim.rangeRead(g).dmg[0] > 0, fac);
  }
});
