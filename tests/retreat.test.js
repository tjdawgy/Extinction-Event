// Retreat (v2.35, audit phase 1): a retreating unit holds its fire until the retreat ends (back at the rally flag, or a new
// order); RETREAT.fire true is the v2.34 rule (firing on the move). SIM only.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const step = (sim, g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
function scene(sim) { // a Tank of yours mid-field, a tough enemy Tank beside it; AI off, the enemy holds
  const g = sim.newGame('normal');
  for (const s of [0, 1]) { g.sides[s].aiT = 1e9; g.sides[s].res.c = g.sides[s].res.e = 1e5; }
  g.t = 200;
  const mine = sim.spawnUnit(g, 0, 'tank', sim.L / 2, 0), foe = sim.spawnUnit(g, 1, 'tank', sim.L / 2 + 60, 0);
  foe.hp = foe.maxHp = 1e6; mine.hp = mine.maxHp = 1e6;
  sim.setStance(g, 1, 'hold');
  return { g, mine, foe };
}

test('a retreating unit never fires while it runs home; on Attack it fires', () => {
  const sim = loadSim(), { g, mine, foe } = scene(sim);
  sim.setStance(g, 0, 'retreat');
  step(sim, g, 1.5);
  assert.strictEqual(foe.hp, 1e6, 'no damage while retreating');
  assert.ok(!g.projs.some(p => p.side === 0), 'no shots in the air');
  assert.strictEqual(mine.tgt, 0, 'no target shown');
  assert.ok(Math.abs(mine.u - sim.rallyU(0)) > 12, 'still on its way home');
  sim.setStance(g, 0, 'attack'); mine.u = foe.u - 60;
  step(sim, g, 3);
  assert.ok(foe.hp < 1e6, 'the retreat is over: it fires again');
});

test('back at the rally flag the retreat is over: it fights there', () => {
  const sim = loadSim(), { g, mine, foe } = scene(sim);
  sim.setStance(g, 0, 'retreat');
  mine.u = sim.rallyU(0) + mine.rallyOff * 1; foe.u = mine.u + 60; // at home already, an enemy in range
  step(sim, g, 3);
  assert.ok(foe.hp < 1e6);
});

test('RETREAT.fire true restores the v2.34 rule (firing on the move)', () => {
  const sim = loadSim(); sim.RETREAT.fire = true;
  const { g, foe } = scene(sim);
  sim.setStance(g, 0, 'retreat');
  step(sim, g, 3);
  assert.ok(foe.hp < 1e6);
});
