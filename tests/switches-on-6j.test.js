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

// rework-5b's "Spitter: volleys of 3 quills ... 6 each": held b6j off because b6j's quill is B6J.unit.spitter.dmg. With every switch
// on: the same volleys, timing, aircraft first and 1.5× to aircraft, at b6j's damage.
test('Spitter counterpart (rework-5b): volleys of 3 quills 0.12 s apart every 1.2 s at b6j\'s damage, aircraft first, 1.5× to aircraft', () => {
  const s = loadSim(), D = s.B6J.unit.spitter.dmg;
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] }); assert.ok(s.rwB6j(g));
  const S = s.rangeUnit(g, 0, 'spitter', 500, 0), R = s.rangeUnit(g, 1, 'rifle', 600, 0), G = s.rangeUnit(g, 1, 'aircraft', 620, 10);
  for (const e of [S, R, G]) { e.hp = e.maxHp = 1e6; } S.cd = 0; g.sides[1].hush = true;
  const shots = [], seen = new Set();
  for (let i = 0; i < 60 * 3.7; i++) { s.rangeStep(g); for (const p of g.projs) if (p.weapon === 'quill' && !seen.has(p)) { seen.add(p); shots.push({ t: g.t, tgt: p.target, dmg: p.dmg }); } }
  assert.ok(shots.length >= 9 && shots.length <= 10, `three volleys (${shots.length})`);
  assert.ok(shots.every(x => x.tgt === G), 'the aircraft first');
  assert.ok(Math.abs(shots[1].t - shots[0].t - 0.12) < 0.02, 'quills 0.12 s apart');
  assert.ok(shots.every(x => Math.abs(x.dmg - D) < 1e-9), 'b6j\'s quill damage');
  const h0 = G.hp; s.damage(g, G, D, 'quill', 0); assert.ok(Math.abs(h0 - G.hp - D * 1.5 * (1 + s.corrNow(G, g.t))) < 1e-6, '1.5× to aircraft');
});

// rework-6d's "b6d: its four values play when on": held b6j off because b6j sets the Tank's damage on top of b6d's. With every switch
// on: the Tank plays b6j's damage, b6d's Artillery salvo and Shardling health still play, and the Codex shows b6j's Tank.
test('b6d counterpart (rework-6d): with b6j on the Tank plays b6j\'s damage over b6d\'s; b6d\'s other values still play', () => {
  const sim = loadSim(), g = sim.newGame('normal', { seed: 5 });
  assert.strictEqual(sim.rwD(g, 'tank').dmg, sim.B6J.unit.tank.dmg); assert.notStrictEqual(sim.B6J.unit.tank.dmg, sim.B6D.unit.tank.dmg);
  assert.strictEqual(sim.rwD(g, 'artillery').dmg, sim.B6D.unit.artillery.dmg);
  const sh = sim.spawnUnit(g, 0, 'shardling', 500, 0); assert.strictEqual(sh.maxHp, sim.B6D.unit.shardling.hp);
  assert.strictEqual(sim.rwShow(null, 'tank').dmg, sim.B6J.unit.tank.dmg, 'the Codex: the game default');
});
