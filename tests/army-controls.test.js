// v2.62 (Phase 1, army controls on Classic): two rally flags and Send damaged home. SIM only; the browser side is in
// tests/army-controls-ui.test.js.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const quiet = () => { const g = sim.newGame('normal', { seed: 2, factions: ['lastfist', 'lastfist'] }); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9; return g; };
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 60); i++) sim.update(g, sim.TICK); };

test('until the player uses them there are no flags in the state, and the rally point is the map\'s', () => {
  const g = quiet();
  assert.strictEqual(g.sides[0].rally, undefined);
  assert.strictEqual(sim.rallyU(0, g), sim.MAP.bases[0].rally[0]);
  assert.strictEqual(sim.rallyU(0, g), sim.rallyU(0));
});

test('Rally: one tap makes a flag the rally point and sends the whole army there; it holds there', () => {
  const g = quiet(), us = [];
  for (let i = 0; i < 4; i++) us.push(sim.spawnUnit(g, 0, 'rifle', 420 + i * 10, 0));
  const r = sim.useRally(g, 0, 'fwd');
  assert.ok(r.ok && g.sides[0].rally.at === 'fwd');
  const F = g.sides[0].rally.fwd;
  assert.strictEqual(F, sim.hqU(0) + sim.RALLY.fwdOut);
  assert.strictEqual(sim.rallyU(0, g), F, 'new units gather at the active flag');
  step(g, 12);
  for (const u of us) assert.ok(Math.abs(u.u - F) < 70, `at the forward flag (${Math.round(u.u)} vs ${F})`);
  sim.useRally(g, 0, 'def'); step(g, 12);
  for (const u of us) assert.ok(Math.abs(u.u - g.sides[0].rally.def) < 70, 'back at the base flag');
});

test('moving a flag: kept between the base and just past the centre; the army at that flag follows it', () => {
  const g = quiet(), u = sim.spawnUnit(g, 0, 'rifle', 450, 0);
  sim.useRally(g, 0, 'fwd');
  sim.setRally(g, 0, 'fwd', 99999); assert.strictEqual(g.sides[0].rally.fwd, sim.L / 2 + sim.RALLY.past, 'not past the centre + RALLY.past');
  sim.setRally(g, 0, 'def', -500); assert.strictEqual(g.sides[0].rally.def, sim.hqU(0) + sim.RALLY.min, 'not behind the HQ');
  sim.setRally(g, 0, 'fwd', 700); step(g, 10);
  assert.ok(Math.abs(u.u - 700) < 70, `followed its flag (${Math.round(u.u)})`);
  assert.ok(!sim.setRally(g, 0, 'west', 700).ok);
});

test('Send damaged home: under the threshold only; they go to the base flag holding fire, heal there and rejoin', () => {
  const g = quiet(); sim.setStance(g, 0, 'attack');
  const hurt = sim.spawnUnit(g, 0, 'tank', 900, 0), fine = sim.spawnUnit(g, 0, 'tank', 900, 10);
  hurt.hp = hurt.maxHp * (sim.DAMAGED.thr - 0.1); fine.hp = fine.maxHp * (sim.DAMAGED.thr + 0.1);
  const r = sim.sendDamagedHome(g, 0);
  assert.strictEqual(r.n, 1); assert.ok(hurt.medHome && !fine.medHome);
  const foe = sim.spawnUnit(g, 1, 'rifle', 960, 0); foe.holdU = 960; foe.holdV = 0; foe.cd = 1e9;
  step(g, 1); assert.strictEqual(hurt.tgt, 0, 'holds its fire on the way');
  sim.kill(g, foe, 0);
  step(g, 30);
  assert.ok(Math.abs(hurt.u - sim.homeFlagU(g, 0)) < 60, `at the base flag (${Math.round(hurt.u)})`);
  let t = 0; while (hurt.medHome && t < 60) { step(g, 0.5); t += 0.5; }
  assert.ok(!hurt.medHome && hurt.hp >= hurt.maxHp * sim.DAMAGED.done, `healed and rejoined (${Math.round(100 * hurt.hp / hurt.maxHp)}% after ${t} s)`);
  step(g, 8); assert.ok(hurt.u > sim.homeFlagU(g, 0) + 100, 'back on Attack with the army');
  assert.ok(!sim.sendDamagedHome(g, 0).ok, 'nobody left to send');
});

test('the AI never has flags or sends units home (it doesn\'t use the controls yet)', () => {
  const g = sim.newGame('hard', { seed: 5, autoPlayer: true, autoDiff: 'hard' });
  for (let i = 0; i < 60 * 240; i++) sim.update(g, sim.TICK);
  assert.ok(!g.sides[0].rally && !g.sides[1].rally);
  assert.ok(!g.ents.some(e => e.medHome));
});
