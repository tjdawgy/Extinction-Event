// v2.69 (Phase 1, base-breaking): the rules that let a winning army finish a base (BREAK in src/sim/game.js, aiBreak in
// src/sim/ai.js): the AI's base attack (mass at the edge of the HQ gun, siege first, aim at what holds the shield up),
// defences failing as the storm nears, rubble on a destroyed building's pad, and the HQ shield tied to production.
// Each part switches off on its own; the tests switch each one on or off themselves and put it back.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const B = sim.BREAK, keep = JSON.parse(JSON.stringify({ ai: B.ai.on, power: B.power.on, rubble: B.rubble.on, prod: B.prod.on }));
const set = o => { for (const k in o) B[k].on = o[k]; };
test.afterEach(() => { set(keep); sim.useMap('classic'); });
const setup = (map = 'classic') => { const g = sim.newGame('hard', { map, seed: 5, factions: ['lastfist', 'lastfist'] }); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9; return g; };
const built = (g, s, type, slot) => { g.sides[s].res.c = 9e4; g.sides[s].res.e = 9e4; const r = sim.tryBuild(g, s, type, slot); assert.ok(r.ok, r.msg); const b = g.ents.filter(e => e.kind === 'b' && e.side === s && e.type === type).pop(); b.built = true; b.hp = b.maxHp; return b; };

test('power failing: building guns lose a step each minute from 15:00 to the floor, the same for both sides; never in the tutorial or switched off', () => {
  set({ power: true });
  const g = setup(), W = B.power;
  g.t = W.from - 1; assert.strictEqual(sim.powMul(g), 1);
  g.t = W.from; assert.strictEqual(sim.powMul(g), 1 - W.step);
  g.t = W.from + 61; assert.ok(Math.abs(sim.powMul(g) - (1 - 2 * W.step)) < 1e-9);
  g.t = W.from + 3600; assert.strictEqual(sim.powMul(g), W.floor);
  const t = built(g, 0, 'turret');
  assert.strictEqual(sim.outMul(g, t), W.floor, 'a Turret fires at the reduced power');
  assert.strictEqual(sim.outMul(g, g.sides[1].hq), W.floor, 'and the other side\'s HQ gun the same');
  g.noStorm = true; assert.strictEqual(sim.powMul(g), 1, 'the tutorial has no storm and no failing power');
  g.noStorm = false; set({ power: false }); assert.strictEqual(sim.powMul(g), 1);
});

test('power failing: a Turret\'s shot does less damage, and the AI counts failing guns for less', () => {
  const shot = on => {
    set({ power: on });
    const g = setup(); g.t = 1150;
    const t = built(g, 0, 'turret'), u = sim.spawnUnit(g, 1, 'tank', t.u + 100, t.v), hp = u.hp;
    sim.fire(g, t, u, sim.BDEF.turret.gun[1]);
    for (let i = 0; i < 120; i++) sim.update(g, sim.TICK);
    return { dmg: hp - u.hp, def: sim.knownDefense(g, 1) };
  };
  const off = shot(false), on = shot(true);
  assert.ok(off.dmg > 0 && Math.abs(on.dmg / off.dmg - B.power.floor) < 0.15, `${on.dmg} vs ${off.dmg}`);
  assert.ok(on.def < off.def, 'the known HQ gun is worth less to the attacker');
});

test('rubble: a destroyed building\'s pad can\'t be built on until it clears; other pads still can; a sold building leaves none', () => {
  set({ rubble: true });
  const g = setup(); g.t = 400;
  const b = built(g, 0, 'refinery', 3);
  sim.kill(g, b, 1);
  assert.ok(sim.rubbleAt(g, 0, 3) && !sim.padOpen(g, 0, 3));
  const r = sim.tryBuild(g, 0, 'reactor', 3); assert.ok(!r.ok && /Rubble/.test(r.msg), r.msg);
  assert.ok(sim.tryBuild(g, 0, 'reactor').ok, 'another pad');
  assert.notStrictEqual(g.ents.filter(e => e.type === 'reactor').pop().slot, 3);
  g.t += B.rubble.t + 0.1; assert.ok(sim.padOpen(g, 0, 3) && sim.tryBuild(g, 0, 'reactor', 3).ok, 'cleared');
  const sold = built(g, 0, 'habitat', 5); sim.trySell(g, 0, sold); assert.ok(!sim.rubbleAt(g, 0, 5), 'selling leaves no rubble');
  set({ rubble: false }); const h = setup(); const c = built(h, 0, 'refinery', 3); sim.kill(h, c, 1); assert.ok(sim.tryBuild(h, 0, 'reactor', 3).ok, 'off: rebuilt at once');
});

test('the HQ shield drops once no production building stands in the base, and comes back with a new one', () => {
  set({ prod: true });
  const g = setup();
  built(g, 0, 'refinery'); sim.refreshShields(g);
  assert.ok(!g.sides[0].hq.shielded, 'a Refinery alone holds no shield up');
  const bar = built(g, 0, 'barracks'); sim.refreshShields(g); assert.ok(g.sides[0].hq.shielded);
  sim.kill(g, bar, 1); sim.refreshShields(g); assert.ok(!g.sides[0].hq.shielded, 'its last production building gone');
  for (const t of ['factory', 'techlab']) { const g2 = setup(); built(g2, 0, 'refinery'); const b0 = built(g2, 0, 'barracks'); built(g2, 0, t); sim.kill(g2, b0, 1); sim.refreshShields(g2); assert.ok(g2.sides[0].hq.shielded, t); }
  set({ prod: false }); const h = setup(); built(h, 0, 'refinery'); sim.refreshShields(h); assert.ok(h.sides[0].hq.shielded, 'off: any building holds it up');
});

test('the AI base attack gathers just outside the enemy HQ gun, goes in together (siege units first), and gathers again for the next wave', () => {
  set({ ai: true });
  const g = setup(); g.t = 700;
  const side = g.sides[1]; side.stance = 'attack'; side.pushTo = null; side.pushMode = 'all';
  const mine = []; for (let i = 0; i < 6; i++) mine.push(sim.spawnUnit(g, 1, i < 2 ? 'artillery' : 'tank', 1300 - i * 5, 0));
  sim.aiBreak(g, 1, mine);
  const gun = sim.BDEF.hq.gun[1], stage = sim.hqU(0) + gun.range + B.ai.gap;
  assert.ok(side.bbOn && Math.abs(side.bbStage - stage) < 1e-6, `stage ${side.bbStage}`);
  const u = mine[3]; for (let i = 0; i < 1500; i++) sim.updateUnit(g, u, [], sim.TICK);
  assert.ok(Math.abs(u.u - stage) < 80, `walks to the stage, not into the gun (${u.u.toFixed(0)})`);
  for (const m of mine) m.u = stage + 10;
  sim.aiBreak(g, 1, mine);
  assert.strictEqual(side.bbStage, null, 'gathered: in it goes');
  assert.ok(side.bbLead !== null, 'siege units lead');
  const tank = mine[4]; tank.u = stage + 5; for (let i = 0; i < 60; i++) sim.updateUnit(g, tank, [], sim.TICK);
  assert.ok(Math.abs(tank.u - stage) <= 70, `the rest wait a moment at the stage (${tank.u.toFixed(0)} vs ${stage})`);
  g.t += B.ai.lead + 1; sim.aiBreak(g, 1, mine); assert.strictEqual(side.bbLead, null);
  // the wave inside is spent and a new one is worth enough: gather again
  for (const m of mine) m.hp = 0;
  const wave = []; for (let i = 0; i < 8; i++) wave.push(sim.spawnUnit(g, 1, 'tank', 1400, 0));
  sim.aiBreak(g, 1, wave); assert.strictEqual(side.bbStage, stage, 'the next wave masses first');
  side.stance = 'retreat'; sim.aiBreak(g, 1, wave); assert.ok(!side.bbOn && side.bbStage === null, 'no base attack, no stage');
});

test('an AI base attack aims at the buildings that hold the shield up (production first with the shield rule), then the bare HQ', () => {
  const g = setup();
  const ref = built(g, 0, 'refinery', 4), foe = sim.spawnUnit(g, 0, 'rifle', ref.u + 20, ref.v + 10);
  const me = sim.spawnUnit(g, 1, 'tank', ref.u + 120, ref.v);
  for (const s of [0, 1]) g.fog[s].vis.fill(1);
  const foes = g.ents.filter(e => e.side === 0 && e.hp > 0); sim.indexFoes(foes, sim.TICK);
  const pick = on => { set({ ai: on }); g.sides[1].bbOn = on; return sim.acquire(g, me, sim.UDEF.tank, foes).best; };
  assert.strictEqual(pick(false), foe, 'normally a unit before a building');
  assert.strictEqual(pick(true), ref, 'breaking a base: the shield first');
  set({ prod: true }); assert.ok(sim.bbFocus({ type: 'barracks', slot: 0 }) > sim.bbFocus({ type: 'refinery', slot: 0 }));
  assert.strictEqual(sim.bbFocus({ type: 'turret', slot: sim.FWD_SLOT }), 0, 'a forward building holds no shield');
});
