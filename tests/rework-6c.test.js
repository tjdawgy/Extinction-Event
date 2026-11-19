// v2.93 (batch 6c, docs/FACTION_REWORK.md "Batch 6c"): the HQ shield rule (REWORK.b6hq) and the first unit tuning (REWORK.b6c),
// src/sim/rework-6c.js. Fingerprints (FP_V293H, FP_V293) are in tests/determinism.test.js.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');
const sim = loadSim();
const setup = (rework, map = 'classic') => { const g = sim.newGame('hard', { map, seed: 5, factions: ['lastfist', 'lastfist'], rework }); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9; return g; };
const built = (g, s, type, slot) => { g.sides[s].res.c = 9e4; g.sides[s].res.e = 9e4; const r = sim.tryBuild(g, s, type, slot); assert.ok(r.ok, r.msg); const b = g.ents.filter(e => e.kind === 'b' && e.side === s && e.type === type).pop(); b.built = true; b.hp = b.maxHp; return b; };

test('b6hq and b6c are on by default, saved per game, and left out of a save when off', () => {
  const r = sim.rwInit(); assert.ok(r.b6hq && r.b6c);
  const on = JSON.parse(sim.serialize(setup(), {})), off = JSON.parse(sim.serialize(setup({ b6hq: false, b6c: false }), {}));
  assert.ok(on.rw.b6hq && on.rw.b6c);
  assert.ok(!('b6hq' in off.rw) && !('b6c' in off.rw), 'an off save is a v2.92 save');
  const back = sim.deserialize(JSON.stringify(off)); assert.ok(!back.rw.b6hq && !back.rw.b6c);
  const back2 = sim.deserialize(JSON.stringify(on)); assert.ok(back2.rw.b6hq && back2.rw.b6c);
});

test('b6hq: any other finished building holds the HQ shield up, for both sides; it drops when none is left and comes back', () => {
  for (const s of [0, 1]) {
    const g = setup(); sim.refreshShields(g);
    assert.ok(!g.sides[s].hq.shielded, 'nothing else built: no shield');
    const ref = built(g, s, 'refinery'); sim.refreshShields(g);
    assert.ok(g.sides[s].hq.shielded, `side ${s}: a Refinery alone holds it up (v2.92 asked for a production building)`);
    assert.strictEqual(sim.hqHolders(g, s), 1);
    const hab = built(g, s, 'habitat'); sim.refreshShields(g); assert.strictEqual(sim.hqHolders(g, s), 2);
    sim.kill(g, ref, 1 - s); sim.refreshShields(g); assert.ok(g.sides[s].hq.shielded, 'one still standing');
    sim.kill(g, hab, 1 - s); sim.refreshShields(g); assert.ok(!g.sides[s].hq.shielded, 'none left: down');
    const t = built(g, s, 'turret'); sim.refreshShields(g); assert.ok(g.sides[s].hq.shielded, 'a finished building again: up');
    assert.ok(!g.sides[1 - s].hq.shielded, 'the other side is not affected');
    void t;
  }
  // off: v2.92's rule (a production building needed, BREAK.prod)
  const h = setup({ b6hq: false }); built(h, 0, 'refinery'); sim.refreshShields(h); assert.ok(!h.sides[0].hq.shielded, 'off: a Refinery alone does not');
});

test('b6hq: buildings under construction, node bunkers and forward-pad buildings never hold the shield up', () => {
  const g = setup(); g.sides[0].res.c = 9e4;
  assert.ok(sim.tryBuild(g, 0, 'barracks').ok); sim.refreshShields(g);
  const b = g.ents.find(e => e.kind === 'b' && e.side === 0 && e.type === 'barracks'); assert.ok(!b.built);
  assert.ok(!g.sides[0].hq.shielded, 'still being built: no shield'); assert.strictEqual(sim.hqHolders(g, 0), 0);
  b.built = true; b.progress = 1; b.hp = b.maxHp; sim.refreshShields(g);
  assert.ok(g.sides[0].hq.shielded, 'finished: up');
  // a node bunker (Last Fist Fortification Depot)
  const fake = { kind: 'b', side: 0, type: 'bunker', slot: -1, hp: 100, built: true };
  assert.ok(!sim.hqHolds(fake), 'a node bunker does not hold it'); assert.ok(!sim.hqHolds(Object.assign({}, fake, { type: 'turret', slot: sim.FWD_SLOT })), 'a forward-pad building does not');
  assert.ok(sim.hqHolds(Object.assign({}, fake, { type: 'sigA', slot: sim.SIG_SLOT })), 'a signature building does');
  // on a lane map: a finished forward-pad Turret alone leaves the HQ open
  const g3 = setup({}, 'twolane'); const n = g3.nodes[sim.cur().FWD_PADS[0].node]; n.owner = 0;
  g3.sides[0].res.c = 9e4; g3.sides[0].res.e = 9e4; const r = sim.tryBuild(g3, 0, 'turret', sim.FWD_SLOT); assert.ok(r.ok, r.msg);
  const fw = g3.ents.find(e => e.kind === 'b' && e.slot === sim.FWD_SLOT); fw.built = true; fw.hp = fw.maxHp; sim.refreshShields(g3);
  assert.ok(!g3.sides[0].hq.shielded, 'a forward-pad building alone: no shield');
  sim.useMap('classic');
});

test('b6hq: an AI base attack aims at every building that holds the shield alike (production or not); off it favours production', () => {
  const g = setup(), ref = built(g, 0, 'refinery'), bar = built(g, 0, 'barracks');
  assert.strictEqual(sim.bbFocus(ref, g), sim.bbFocus(bar, g), 'on: a Refinery is as much a target as a Barracks');
  assert.ok(sim.bbFocus(ref, g) > sim.BREAK.ai.focus, 'and more than a building still under construction');
  const h = setup({ b6hq: false }), ref2 = built(h, 0, 'refinery'), bar2 = built(h, 0, 'barracks');
  assert.ok(sim.bbFocus(bar2, h) > sim.bbFocus(ref2, h), 'off: v2.92 favours production buildings');
});

test('b6hq: the shield text follows the switch', () => {
  assert.match(sim.hqShieldTxt({ b6hq: true }), /any other finished building/);
  assert.match(sim.hqShieldTxt({ b6hq: false }), /production building/);
  assert.match(sim.BDEF.hq.desc, /any other finished building/);
});

test('b6c: off plays v2.92\'s numbers; on, the tuned ones (barrier, brood price, Leviathan bombs, latch, Riftstalker blade)', () => {
  const off = setup({ b6c: false }), on = setup();
  assert.strictEqual(sim.trainCost(off, 'skitterling').c, sim.BROOD.cost);
  assert.strictEqual(sim.trainCost(on, 'skitterling').c, sim.B6C.broodCost);
  assert.strictEqual(sim.rwD(off, 'leviathan').dmg, sim.UDEF.leviathan.dmg);
  assert.strictEqual(sim.rwD(on, 'leviathan').dmg, sim.B6C.levDmg);
  assert.strictEqual(sim.rwD(off, 'riftstalker').dmg, sim.UDEF.riftstalker.dmg);
  assert.strictEqual(sim.rwD(on, 'riftstalker').dmg, sim.B6C.rsDmg);
  assert.strictEqual(sim.barHp(off), sim.BAR.hp); assert.strictEqual(sim.barHp(on), sim.B6C.barHp);
  assert.strictEqual(sim.latchDps(off), sim.LATCH.dps); assert.strictEqual(sim.latchDps(on), sim.B6C.latchDps);
  assert.strictEqual(sim.rwD(on, 'skitterling').cost.c * sim.BROOD.n, sim.B6C.broodCost, 'the per-Skitterling price follows');
  // a Bastion's barrier starts at the tuned health
  const g = sim.rangeGame({ seed: 3, factions: ['axiarchs', 'lastfist'] }); const b = sim.rangeUnit(g, 0, 'bastion', 500, 0); sim.rangeStep(g);
  assert.strictEqual(b.bwHp, sim.B6C.barHp);
  const g2 = sim.rangeGame({ seed: 3, factions: ['axiarchs', 'lastfist'], rework: { b6c: false } }); const b2 = sim.rangeUnit(g2, 0, 'bastion', 500, 0); sim.rangeStep(g2);
  assert.strictEqual(b2.bwHp, sim.BAR.hp);
});

test('Part C: with the player on the right (g.me 1) the AI plays the left side normally at the chosen difficulty; the player\'s side holds, gets no AI', () => {
  const s = loadSim({ random: (a => () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(9) });
  const g = s.newGame('hard', { seed: 21, me: 1, factions: ['bloomhost', 'lastfist'] }); g.countdown = 0;
  assert.strictEqual(g.me, 1); assert.ok(g.sides[0].persona && !g.sides[1].persona, 'the AI (left) has a personality, the player (right) none');
  assert.strictEqual(g.sides[1].stance, 'hold'); assert.strictEqual(g.sides[0].stance, 'retreat');
  assert.strictEqual(s.aiDiff(g, 0).label, 'Hard'); assert.ok(s.playerSide(g, 1) && !s.playerSide(g, 0));
  for (let i = 0; i < 60 * 360; i++) { s.update(g, s.TICK); g.events.length = 0; }
  const b = s => g.ents.filter(e => e.kind === 'b' && e.side === s && e.type !== 'hq').length, u = s => g.ents.filter(e => e.kind === 'u' && e.side === s).length;
  assert.ok(b(0) >= 4 && u(0) >= 5, `the AI on the left built ${b(0)} buildings and has ${u(0)} units`);
  assert.strictEqual(b(1), 0, 'nothing builds for the idle player'); assert.strictEqual(u(1), 0);
  const o = JSON.parse(s.serialize(g, {})); assert.strictEqual(o.me, 1); assert.strictEqual(s.deserialize(JSON.stringify(o)).me, 1, 'a save keeps the side');
  const g0 = s.newGame('hard', { seed: 21 }); assert.ok(!('me' in g0) && !('me' in JSON.parse(s.serialize(g0, {}))), 'the default side leaves no trace');
});
