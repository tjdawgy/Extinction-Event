// Strategy balance and the strategy triangle (v2.42, audit phase 7b; audit/strategy-report.md). The BALANCE7B layer (numbers
// only, setBalance7b(false) restores v2.41), the AI rules breakout and adapt (Hard only), the flood dial, the hard241
// preset, and the scripted strategy bots (audit/sim/strat.js).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const at = (s, path) => path.split('.').reduce((o, k) => o[k], { UDEF: s.UDEF, BDEF: s.BDEF, BDEF_BH: s.BDEF_BH, BDEF_AX: s.BDEF_AX, DMG: s.DMG, NODE_INC: s.NODE_INC });

test('BALANCE7B: on at load; setBalance7b(false) restores every v2.41 value and true puts the layer back; setBalance(false) turns it off too', () => {
  const s = loadSim();
  assert.strictEqual(s.BALANCE7B.on, true);
  const on = s.BALANCE7B.patches.map(([p]) => JSON.stringify(at(s, p)));
  s.BALANCE7B.patches.forEach(([p, v], i) => assert.strictEqual(on[i], JSON.stringify(v), p));
  s.setBalance7b(false);
  s.BALANCE7B.patches.forEach(([p], i) => assert.strictEqual(JSON.stringify(at(s, p)), JSON.stringify(s.BALANCE7B.orig[i]), p));
  // spot checks against v2.41's numbers
  assert.strictEqual(JSON.stringify([s.BDEF.refinery.cost.c, s.BDEF.hq.gun[1].dmg, s.UDEF.rifle.cost.c, s.NODE_INC.c, s.BDEF_AX.turret.gun[1].dmg]), '[150,32,50,3,30]');
  assert.strictEqual(s.BDEF.hq.tiers[1], 'Turret 32 damage, 390 range, 2,800 HP');
  s.setBalance7b(true);
  assert.strictEqual(JSON.stringify([s.BDEF.refinery.cost.c, s.BDEF.hq.gun[1].dmg, s.UDEF.rifle.cost.c, s.NODE_INC.c]), '[175,16,45,4]');
  assert.strictEqual(s.BDEF.hq.tiers[1], 'Turret 16 damage, 390 range, 2,800 HP', 'the description follows the live number');
  assert.strictEqual(s.BDEF_BH.refinery.cost.c, 175, 'a shared cost object: every faction');
  s.setBalance(false); assert.strictEqual(s.BALANCE7B.on, false); assert.strictEqual(s.UDEF.tank.cost.c, 200, 'v2.38');
  s.setBalance(true); assert.strictEqual(s.BALANCE7B.on, true); assert.strictEqual(s.UDEF.tank.cost.c, 280);
});

test('the new rules are off in Default (Easy and Normal play the v2.41 AI on the new numbers); Hard has them; hard241 is v2.41 Hard', () => {
  const s = loadSim({ random: mulberry(3) }), A = s.AI_PRESETS;
  for (const k of ['breakout', 'adapt']) { assert.strictEqual(A.default.fix[k], false, k); assert.strictEqual(A.hard.fix[k], true, k); assert.strictEqual(A.hard241.fix[k], false, k); }
  for (const k in s.HARD_FIX) assert.strictEqual(A.hard241.fix[k], true, k);
  for (const f of ['lastfist', 'bloomhost', 'axiarchs']) assert.strictEqual(JSON.stringify(A.hard241.byFac[f].kinds), '["boomer"]');
});

test('the Hard preset varies its opening across matches (several kinds per faction)', () => {
  const s = loadSim({ random: mulberry(12) });
  for (const f of ['lastfist', 'bloomhost', 'axiarchs']) {
    const kinds = new Set(s.AI_PRESETS.hard.byFac[f].kinds);
    assert.ok(kinds.size >= 2, `${f}: ${[...kinds]}`);
    const seen = new Set(); for (let i = 0; i < 60; i++) seen.add(s.rollPersona(undefined, 'hard', f, 'hard').kind);
    assert.strictEqual(JSON.stringify([...seen].sort()), JSON.stringify([...kinds].sort()), f);
  }
});

test('breakout: camped on by a stronger army, Hard holds deep under its HQ gun, does not push, and puts up a Turret', () => {
  const s = loadSim({ random: mulberry(5) });
  const g = s.newGame('hard', { factions: ['lastfist', 'lastfist'] }); g.countdown = 0; g.t = 200;
  const side = g.sides[1], hq = s.hqU(1);
  side.res.c = side.res.e = 2000;
  for (const t of ['barracks', 'refinery']) { s.tryBuild(g, 1, t); }
  for (const b of g.ents) if (b.kind === 'b') { b.built = true; b.progress = 1; b.hp = b.maxHp; }
  for (let i = 0; i < 3; i++) s.spawnUnit(g, 1, 'rifle', hq - 280, 0);
  for (let i = 0; i < 8; i++) s.spawnUnit(g, 0, 'tank', hq - 430 - i * 5, 0); // a camp just outside the gun, in sight
  for (let i = 0; i < 30 * 8; i++) { s.update(g, 1 / 30); for (const e of g.ents) if (e.side === 0 && e.kind === 'u') { e.u = Math.min(e.u, hq - 430); e.cd = 9; } }
  assert.ok(side.boHold, 'holding');
  assert.strictEqual(side.defU, hq - 140, 'rallies deep under the gun');
  assert.notStrictEqual(side.stance, 'attack', 'no push into the camp');
  assert.ok(g.ents.some(e => e.side === 1 && e.type === 'turret'), 'a Turret is up or going up');
});

test('the strategy bots play full matches (Rush against Turtle, Contain against a standard opening) through the player controls', () => {
  const { runMatch } = require('../audit/sim/match');
  const r = runMatch({ seed: 3, diff: 'hard', maxT: 1800, sides: [{ faction: 'bloomhost', bot: 'strat', botOpts: { opener: 'rush' } }, { faction: 'axiarchs', bot: 'strat', botOpts: { opener: 'turtle' } }] });
  assert.ok(r.t <= 1800 && r.sides[0].bot.firstAttack > 0 && r.sides[0].bot.firstAttack < 200, `the rush went in early (${r.sides[0].bot.firstAttack})`);
  assert.ok((r.sides[1].buildings.turret || 0) >= 1, 'the turtle built a Turret');
  const c = runMatch({ seed: 4, diff: 'hard', maxT: 1800, sides: [{ faction: 'lastfist', bot: 'strat', botOpts: { opener: 'contain' } }, { faction: 'lastfist', bot: 'strat', botOpts: { opener: 'standard' } }] });
  assert.ok(c.sides[0].bot.contain >= 1, 'the contain parked');
  assert.ok(c.winner >= -1);
});
