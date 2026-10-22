// Step 3 rebalance: no AI advantages, node placement, HQ weapon, and the AI's decision rules
const test = require('node:test');
const assert = require('node:assert');
const { loadSim, readHtml } = require('./load-sim');

const sim = loadSim();
const STEP = 1 / 30;
const run = (g, sec) => { for (let i = Math.round(sec / STEP); i > 0; i--) sim.update(g, STEP); };

test('no secret AI advantages: same start and income on every difficulty', () => {
  for (const d of ['easy', 'normal', 'hard']) {
    const g = sim.newGame(d);
    assert.deepStrictEqual([g.sides[0].res.c, g.sides[0].res.e, g.sides[1].res.c, g.sides[1].res.e], [300, 60, 300, 60], d);
    const a = sim.income(g, 0), b = sim.income(g, 1);
    assert.deepStrictEqual([a.c, a.e], [b.c, b.e], `${d}: equal income`);
    for (const k of ['inc', 'bonus']) assert.ok(!(k in sim.DIFF[d]), `${d} has no ${k}`);
  }
  assert.doesNotMatch(readHtml(), /g\.diff\.inc|\.bonus\b/);
});

test('the outer field nodes sit inside each HQ\'s T1 gun range', () => {
  assert.deepStrictEqual([...sim.NODE_U], [600, 850, 1100]);
  for (const s of [0, 1]) assert.ok(Math.abs(sim.NODE_U[s ? 2 : 0] - sim.hqU(s)) <= sim.BDEF.hq.gun[1].range);
});

test('the HQ has its own weapon: 0.9x vs light armor; the Heavy trooper\'s rockets are unchanged', () => {
  for (let t = 1; t <= 3; t++) assert.strictEqual(sim.BDEF.hq.gun[t].weapon, 'hqgun');
  assert.deepStrictEqual({ ...sim.DMG.hqgun }, { light: 0.9, heavy: 1.0, vehicle: 1.6, air: 1.3, building: 1.0 });
  assert.strictEqual(sim.DMG.rocket.light, 0.6);
  assert.strictEqual(sim.UDEF.heavy.weapon, 'rocket');
  assert.deepStrictEqual({ ...sim.UDEF.rifle }.hp, 70, 'Riflemen unchanged');
});

const rushAt = (g, n, u) => { for (let i = 0; i < n; i++) { const e = sim.spawnUnit(g, 0, 'rifle', u + i * 4, 0); e.holdU = e.u; e.holdV = e.v; } g.sides[0].stance = 'hold'; };
// Build a base for side s with the AI frozen; types in order, each finished before the next (so requirements are met)
function base(g, s, types) {
  const side = g.sides[s], keep = side.aiT; side.aiT = 1e9;
  for (const t of types) { side.res.c += 1000; side.res.e += 500; assert.ok(sim.tryBuild(g, s, t).ok, t); run(g, sim.BDEF[t].time + 0.5); }
  side.aiT = keep;
}
const ai = (g, sec) => { g.sides[1].aiT = 0; run(g, sec); };

test('an AI that spots an infantry rush builds a Turret (on its front pad when free) and a War Factory', () => {
  const g = sim.newGame('hard'); g.sides[0].aiT = 1e9;
  base(g, 1, ['barracks', 'refinery']);
  g.sides[1].res.c = 2000; g.sides[1].res.e = 500;
  rushAt(g, 10, 1000); // 10 Riflemen at the AI's doorstep
  ai(g, 6);
  const tur = g.ents.find(e => e.side === 1 && e.type === 'turret');
  assert.ok(tur, 'Turret'); assert.strictEqual(tur.slot, 4, 'front pad');
  assert.ok(g.ents.some(e => e.side === 1 && e.type === 'factory'), 'War Factory');
});

test('a couple of scouting Riflemen do not trigger the rush response', () => {
  const g = sim.newGame('hard'); g.sides[0].aiT = 1e9;
  base(g, 1, ['barracks', 'refinery']);
  g.sides[1].res.c = 2000; g.sides[1].res.e = 500;
  rushAt(g, 2, 1000);
  ai(g, 6);
  assert.ok(!g.ents.some(e => e.side === 1 && e.type === 'turret'));
});

test('Hard holds upgrades while threatened; Easy keeps spending on them', () => {
  for (const [d, expectUpgrade] of [['hard', false], ['easy', true]]) {
    let upgraded = false;
    for (let attempt = 0; attempt < 3 && upgraded !== expectUpgrade; attempt++) { // Easy skips upgrades at random half the time
      const g = sim.newGame(d); g.sides[0].aiT = 1e9;
      base(g, 1, ['barracks', 'refinery', 'refinery', 'reactor', 'reactor', 'habitat', 'factory']);
      const side = g.sides[1]; g.t = Math.max(g.t, 300);
      rushAt(g, 10, 1000);
      upgraded = false;
      for (let i = 0; i < 25 * 30; i++) { side.res.c = 600; side.res.e = 200; side.aiT = Math.min(side.aiT, sim.DIFF[d].delay); sim.update(g, STEP); if (g.ents.some(e => e.side === 1 && e.kind === 'b' && e.upgrading)) upgraded = true; }
    }
    assert.strictEqual(upgraded, expectUpgrade, `${d}: upgraded under threat = ${upgraded}`);
  }
});

test('an AI with no Habitat and no free pad sells a spare building to rebuild one', () => {
  const g = sim.newGame('normal'); g.sides[0].aiT = 1e9;
  base(g, 1, ['barracks', 'refinery', 'refinery', 'refinery', 'reactor', 'reactor', 'factory', 'turret']);
  const side = g.sides[1]; side.res.e = 1000; side.res.c = 500;
  assert.ok(side.slots.every(Boolean) && !g.ents.some(e => e.side === 1 && e.type === 'habitat'), 'all pads full, no Habitat');
  ai(g, 3);
  assert.ok(g.ents.some(e => e.side === 1 && e.type === 'habitat'), 'Habitat rebuilt');
  assert.strictEqual(g.ents.filter(e => e.side === 1 && e.type === 'reactor' && e.hp > 0).length, 1, 'a spare Reactor was sold for the room');
});

test('enemy Interceptors do not set off an Interceptor race, and count little toward army strength', () => {
  const g = sim.newGame('hard'); g.sides[0].aiT = 1e9;
  base(g, 1, ['barracks', 'refinery', 'factory', 'techlab', 'habitat']);
  const side = g.sides[1]; side.res.c = side.res.e = 1e5;
  side.aiT = 1e9; assert.ok(sim.tryUpgrade(g, 1, g.ents.find(e => e.side === 1 && e.type === 'techlab')).ok); run(g, 21);
  for (let i = 0; i < 6; i++) { const e = sim.spawnUnit(g, 0, 'interceptor', 900 + i * 5, 0); e.holdU = e.u; e.holdV = e.v; }
  g.sides[0].stance = 'hold';
  const eye = sim.spawnUnit(g, 1, 'rifle', 1000, 0); eye.holdU = 1000; eye.holdV = 0; // the AI sees them
  ai(g, 40);
  const made = g.ents.filter(e => e.side === 1 && e.type === 'interceptor').length;
  assert.ok(made <= 1, `AI built ${made} Interceptors against Interceptors`);
  const unit = t => ({ type: t });
  assert.strictEqual(sim.armyValue([unit('interceptor')]), (175 + 80 * 1.5) * 0.25);
  assert.strictEqual(sim.armyValue([unit('tank')]), 200 + 40 * 1.5);
});
