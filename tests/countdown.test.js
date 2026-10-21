// Match-start countdown and HQ readouts (SIM side; the browser test covers the DOM)
const test = require('node:test');
const assert = require('node:assert');
const { loadSim, readHtml } = require('./load-sim');

const sim = loadSim();
const STEP = 1 / 30;
const run = (g, sec) => { for (let i = Math.round(sec / STEP); i > 0; i--) sim.update(g, STEP); };
// SIM objects come from a vm sandbox (own Object.prototype), so copy them before deepStrictEqual
const quietAI = g => { g.sides[1].aiT = 1e9; }; // keep the enemy AI out of mechanics tests

test('countdown defaults to 0 and is 3 seconds in the SIM', () => {
  assert.strictEqual(sim.newGame('normal').countdown, 0);
  assert.strictEqual(sim.COUNTDOWN, 3);
  assert.strictEqual(sim.newGame('normal', { countdown: 4.5 }).countdown, 4.5);
});

test('during the countdown the player can queue, but nothing progresses and the AI waits', () => {
  const g = sim.newGame('hard', { countdown: 3 });
  assert.ok(sim.tryBuild(g, 0, 'barracks').ok, 'build can be queued during the countdown');
  const rifle = sim.spawnUnit(g, 0, 'rifle', 800, 0), foe = sim.spawnUnit(g, 1, 'rifle', 860, 0);
  sim.setStance(g, 0, 'attack');
  const res = [g.sides[0].res.c, g.sides[0].res.e, g.sides[1].res.c, g.sides[1].res.e];
  const barracks = g.ents.find(e => e.type === 'barracks'), hp0 = barracks.hp, aiT = g.sides[1].aiT;
  run(g, 2.9);
  assert.strictEqual(g.t, 0, 'match clock has not started');
  assert.deepStrictEqual([g.sides[0].res.c, g.sides[0].res.e, g.sides[1].res.c, g.sides[1].res.e], res, 'no income');
  assert.strictEqual(barracks.progress, 0); assert.strictEqual(barracks.hp, hp0);
  assert.strictEqual(sim.countB(g, 1, 'barracks') + g.ents.filter(e => e.side === 1 && e.kind === 'b').length, 1, 'AI built nothing (only its HQ)');
  assert.strictEqual(g.sides[1].aiT, aiT, 'AI timer frozen');
  assert.deepStrictEqual([rifle.u, foe.u, rifle.hp, foe.hp], [800, 860, 70, 70], 'no movement or damage');
  assert.strictEqual(g.projs.length, 0, 'no shots fired');
  assert.ok(g.nodes.every(n => n.prog === 0), 'no node capture');
  assert.ok(!g.events.some(e => e.type === 'go'));
});

test('production, upgrades, repair and regen are frozen too, and resume at GO', () => {
  const g = sim.newGame('normal'); quietAI(g);
  sim.tryBuild(g, 0, 'barracks'); run(g, 15);
  const side = g.sides[0], hq = side.hq, barracks = g.ents.find(e => e.type === 'barracks' && e.built);
  side.res.c = side.res.e = 5000;
  assert.ok(sim.tryTrain(g, 0, 'rifle').ok);
  assert.ok(sim.tryUpgrade(g, 0, hq).ok);
  barracks.hp = barracks.maxHp / 2; assert.ok(sim.tryRepair(g, 0, barracks).ok);
  hq.hp = hq.maxHp / 2; hq.lastHit = -99; // would self-repair
  g.countdown = 3;
  const snap = () => [barracks.prodT, barracks.queue.length, hq.upProg, barracks.hp, hq.hp];
  const before = snap();
  run(g, 2.9);
  assert.deepStrictEqual(snap(), before);
  run(g, 1.2);
  const after = snap();
  assert.ok(after[0] > 0 && after[2] > 0 && after[3] > before[3] && after[4] > before[4], 'everything moves again after GO');
});

test('the match clock starts at GO and the AI only starts deciding then', () => {
  const g = sim.newGame('normal', { countdown: 3 });
  run(g, 3);
  assert.strictEqual(g.countdown, 0);
  assert.strictEqual(g.events.filter(e => e.type === 'go').length, 1, 'one GO event');
  assert.strictEqual(g.t, 0);
  assert.strictEqual(g.ents.filter(e => e.side === 1 && e.kind === 'b').length, 1, 'AI still has only its HQ at GO');
  run(g, 2);
  assert.ok(Math.abs(g.t - 2) < STEP * 1.5, `clock counts from GO (${g.t})`);
  assert.ok(g.ents.filter(e => e.side === 1 && e.kind === 'b').length > 1, 'AI builds after GO');
});

test('HQ readouts: exposed, shielded, damaged and destroyed', () => {
  const g = sim.newGame('normal', { countdown: 3 });
  for (const s of [0, 1]) assert.deepStrictEqual({ ...sim.hqStatus(g, s) }, { hp: 2800, maxHp: 2800, frac: 1, state: 'exposed' }, 'no other buildings yet');
  sim.tryBuild(g, 0, 'refinery'); sim.update(g, STEP);
  assert.strictEqual(sim.hqStatus(g, 0).state, 'shielded', 'shield goes up as soon as another building stands, even during the countdown');
  assert.strictEqual(sim.hqStatus(g, 1).state, 'exposed');
  const hq1 = g.sides[1].hq;
  sim.damage(g, hq1, 700, 'cannon', 0); // 700 × 1.3 vs buildings
  assert.strictEqual(sim.hqStatus(g, 1).hp, 2800 - 910);
  assert.ok(Math.abs(sim.hqStatus(g, 1).frac - 1890 / 2800) < 1e-9);
  sim.kill(g, hq1, 0);
  assert.deepStrictEqual({ ...sim.hqStatus(g, 1) }, { hp: 0, maxHp: 2800, frac: 0, state: 'destroyed' });
  assert.ok(g.over && g.winner === 0);
});

test('the countdown is not saved: a restored match does not replay it', () => {
  const g = sim.newGame('normal', { countdown: 4.5 });
  sim.tryBuild(g, 0, 'barracks');
  run(g, 1);
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.strictEqual(g2.countdown, 0);
  assert.strictEqual(g2.t, 0);
  assert.ok(g2.ents.some(e => e.type === 'barracks'), 'queued build survives');
  assert.match(readHtml(), /pauseGame\(true\); \/\/ a restored match waits for the player to tap Resume/);
});
