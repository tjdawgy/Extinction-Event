// v3.00 (batch 6j): the switches-on counterparts of the tests held off with pin6j (tests/load-sim.js). Each checks, with every
// switch on (the new-game default), the intent of the pinned test under batch 6j's rules.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

// rework-2b's "switch: per game; b2b off plays the v2.82 units": held b6j off because b6j sets the Titan's reach. With b6j on, a
// b2b-off game still plays UDEF's Titan but for b6j's values, a b2b-on game the batch 2b Titan with b6j's reach; UDEF untouched.
test('switch counterpart (rework-2b): with b6j on the Titan plays b2b\'s definition (or UDEF\'s) with b6j\'s values; UDEF untouched', () => {
  const s = loadSim();
  const on = s.rangeGame({ factions: ['lastfist', 'bloomhost'] }), off = s.rangeGame({ factions: ['lastfist', 'bloomhost'], rework: { b2b: false } });
  assert.ok(s.rwB6j(on) && s.rwB6j(off));
  const J = s.B6J.unit.titan || {};
  for (const [k, v] of Object.entries(J)) { assert.strictEqual(s.rwD(on, 'titan')[k], v, 'on: ' + k); assert.strictEqual(s.rwD(off, 'titan')[k], v, 'b2b off: ' + k); }
  assert.ok(s.rwD(on, 'titan').breach && !s.rwD(off, 'titan').breach, 'b2b decides the breach');
  assert.strictEqual(s.UDEF.titan.range, 190, 'UDEF itself unchanged');
  const r1 = s.rangeUnit(on, 1, 'ruinmaw', 900, 0), r0 = s.rangeUnit(off, 1, 'ruinmaw', 900, 0);
  assert.strictEqual(r1.maxHp, s.RUIN.hp); assert.strictEqual(r0.maxHp, s.UDEF.ruinmaw.hp);
});
