// Step 4: hidden AI personalities
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const STEP = 1 / 30;
const run = (g, sec) => { for (let i = Math.round(sec / STEP); i > 0; i--) sim.update(g, STEP); };

test('every personality exists at every difficulty; each match rolls one; it can be forced for tests', () => {
  assert.deepStrictEqual([...sim.PERSONAS], ['aggressor', 'turtle', 'economist', 'trickster']);
  for (const d of ['easy', 'normal', 'hard']) for (const p of sim.PERSONAS) {
    const g = sim.newGame(d, { persona: p });
    assert.strictEqual(g.sides[1].persona.kind, p);
    run(g, 20); // plays without errors
  }
  const seen = new Set(); for (let i = 0; i < 60; i++) seen.add(sim.newGame('normal').sides[1].persona.kind);
  assert.strictEqual(seen.size, 4, 'random rolls cover all four');
});

test('personalities vary within their style from match to match', () => {
  for (const p of sim.PERSONAS) {
    const rolls = Array.from({ length: 12 }, () => sim.rollPersona(p));
    const sig = new Set(rolls.map(r => JSON.stringify([r.wave.toFixed(3), r.fieldEdge, r.attackEdge, r.upShift, r.feint, r.deadline, r.plan])));
    assert.ok(sig.size > 1, `${p} varies`);
    assert.ok(rolls.every(r => r.kind === p));
  }
});

test('style: build plans and priorities differ as designed', () => {
  const r = k => sim.rollPersona(k);
  assert.ok(r('turtle').plan.includes('turret'), 'Turtle plans a Turret');
  for (const k of ['aggressor', 'economist', 'trickster']) assert.ok(!r(k).plan.includes('turret'), `${k} only builds Turrets reactively`);
  assert.ok(r('aggressor').plan.slice(0, 4).filter(t => t === 'barracks').length === 2, 'Aggressor: two Barracks early');
  assert.ok(r('economist').plan.slice(0, 4).filter(t => t === 'refinery').length === 3, 'Economist: three Refineries first');
  assert.ok(r('economist').upShift < 0 && r('aggressor').upShift > 0, 'upgrade timing');
  assert.ok(r('trickster').feint > 0 && r('aggressor').feint === 0);
  assert.ok(r('turtle').deadline < 900, 'a Turtle has an attack deadline');
});

test('adapting: an Aggressor whose base attacks fail twice turns to economy for a while', () => {
  const g = sim.newGame('normal', { persona: 'aggressor' }); g.sides[0].aiT = 1e9; g.t = 400;
  const side = g.sides[1];
  for (let i = 0; i < 4; i++) sim.spawnUnit(g, 1, 'tank', 1200 - i * 5, 0);
  for (let k = 0; k < 2; k++) {
    side.stance = 'attack'; side.pushTo = null; side.pushMode = 'all'; side.stanceAt = g.t - 20; side.launchV = 1040;
    for (let i = 0; i < 8; i++) g.fog[1].intel[9000 + i] = { type: 'titan', u: 700, t: g.t };
    side.aiT = 0; sim.aiUpdate(g, 1, STEP);
    assert.strictEqual(side.stance, 'retreat');
  }
  assert.ok(side.moodUntil > g.t + 170, 'economy mood for 3–4 minutes');
});

test('adapting: an outgunned Economist drops greed and defends (no upgrades or tech, trains units)', () => {
  const g = sim.newGame('normal', { persona: 'economist' }); g.sides[0].aiT = 1e9; g.t = 400;
  const side = g.sides[1]; side.aiT = 1e9;
  for (const t of ['barracks', 'refinery', 'refinery', 'reactor', 'habitat']) { side.res.c += 600; side.res.e += 300; sim.tryBuild(g, 1, t); run(g, 15); }
  g.t = Math.max(g.t, 400); side.res.c = 900; side.res.e = 300;
  for (let i = 0; i < 12; i++) { const e = sim.spawnUnit(g, 0, 'heavy', 1000 + i * 5, 0); e.holdU = e.u; e.holdV = 0; } // a strong army at its doorstep
  g.sides[0].stance = 'hold';
  let upgraded = false, trained = 0;
  for (let i = 0; i < 10 * 30; i++) { side.aiT = Math.min(side.aiT, 1); sim.update(g, STEP); if (g.ents.some(e => e.side === 1 && e.kind === 'b' && e.upgrading)) upgraded = true; }
  trained = Object.values(side.aiLog.trained).reduce((a, b) => a + b, 0);
  assert.ok(!upgraded, 'no upgrades while outgunned');
  assert.ok(!g.ents.some(e => e.side === 1 && e.type === 'techlab'), 'no tech');
  assert.ok(trained > 0, 'trains units');
});

test('Trickster feints pull back without counting as a failed attack', () => {
  const g = sim.newGame('normal', { persona: 'trickster' }); g.sides[0].aiT = 1e9; g.t = 300;
  const side = g.sides[1]; side.persona.feint = 1; // force a feint for the test
  for (let i = 0; i < 8; i++) sim.spawnUnit(g, 1, 'tank', 1200 - i * 5, 0);
  side.stanceAt = g.t - 30; side.aiT = 0; sim.aiUpdate(g, 1, STEP);
  assert.strictEqual(side.stance, 'attack');
  assert.ok(side.feintUntil > g.t, 'this push is a feint');
  g.t = side.feintUntil + 0.1; side.aiT = 0; sim.aiUpdate(g, 1, STEP);
  assert.strictEqual(side.stance, 'retreat', 'pulled back');
  assert.ok(!side.failV, 'not a failed attack');
  assert.strictEqual(side.aiLog.feints, 1);
  // two feints in a row, then a real push
  side.feintStreak = 2; side.stanceAt = g.t - 30; side.aiT = 0; sim.aiUpdate(g, 1, STEP);
  assert.ok(side.stance === 'attack' && !side.feintUntil, 'the third push is real');
});

test('a Turtle attacks after its deadline even without a big edge; the ability hook is called', () => {
  // v2.40: v2.39's rule, on the v239 preset. The Default AI's engage rule (v2.40) keeps even a Turtle past its deadline out of
  // a fight its strength doesn't win (below); before 18:00 (the late dial) it waits for the edge
  const turtle = (ai, mine, foes) => {
    const g = sim.newGame('normal', { persona: 'turtle', ai }); g.sides[0].aiT = 1e9;
    const side = g.sides[1]; g.t = side.persona.deadline + 1;
    for (let i = 0; i < mine; i++) sim.spawnUnit(g, 1, 'tank', 1200 - i * 5, 0);
    for (let i = 0; i < foes; i++) g.fog[1].intel[9000 + i] = { type: 'tank', u: 700, t: g.t };
    side.stanceAt = g.t - 30; side.aiT = 0; sim.aiUpdate(g, 1, STEP);
    return side.stance;
  };
  assert.strictEqual(turtle('v239', 4, 4), 'attack', 'v2.39: about even is enough after the deadline');
  assert.strictEqual(turtle('default', 8, 2), 'attack', 'Default: after the deadline with the edge (its strength against theirs plus the HQ gun)');
  assert.strictEqual(typeof sim.aiAbility, 'function');
});

test('the personality is saved with the match; older saves get one', () => {
  const g = sim.newGame('hard', { persona: 'economist' }); run(g, 5);
  const before = JSON.stringify(g.sides[1].persona);
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.strictEqual(JSON.stringify(g2.sides[1].persona), before, 'same personality and rolled values after resume');
  const o = JSON.parse(sim.serialize(g, {})); delete o.sides[1].persona; o.v = 6;
  const g6 = sim.deserialize(JSON.stringify(o));
  assert.ok(g6 && sim.PERSONAS.includes(g6.sides[1].persona.kind), 'v6 save gets a random personality');
});
