// Commander abilities (Step 6): rules, effects, fog limits, save/resume and AI use. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
// A quiet match: AI off, plenty of money, the given game time already played
function quiet(t = 130) {
  const g = sim.newGame('normal');
  for (const s of [0, 1]) { g.sides[s].aiT = 1e9; g.sides[s].stance = 'hold'; }
  g.t = t; g.sides[0].res.c = g.sides[0].res.e = 5000;
  return g;
}
const hold = (e, u, v) => { e.holdU = u; e.holdV = v; e.cd = 1e6; return e; }; // units stay put and hold fire
const factory = g => { for (const k of ['barracks', 'factory']) { sim.tryBuild(g, 0, k); for (const b of g.ents) if (b.type === k) { b.built = true; b.progress = 1; } } };
const seeAll = g => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } };

test('cost, cooldown, unlock, countdown and resources are enforced', () => {
  const g = sim.newGame('normal', { countdown: 3 });
  assert.strictEqual(sim.abilityCheck(g, 0, 'shield').msg, 'Wait for GO');
  step(g, 3.1);
  assert.match(sim.abilityCheck(g, 0, 'shield').msg, /ready in 6\d s/);
  step(g, 61);
  g.sides[0].res.c = 50;
  assert.match(sim.abilityCheck(g, 0, 'shield').msg, /Need 25 more credits/);
  g.sides[0].res.c = 500; g.sides[0].res.e = 10;
  assert.match(sim.abilityCheck(g, 0, 'shield').msg, /Need 65 more energy/);
  g.sides[0].res.e = 500;
  assert.ok(sim.abilityCheck(g, 0, 'shield').ok);
  assert.match(sim.abilityCheck(g, 0, 'strike').msg, /needs a War Factory/);
  const r = sim.useAbility(g, 0, 'shield', 400, 0);
  assert.ok(r.ok, r.msg);
  assert.strictEqual(g.sides[0].res.c, 425); assert.strictEqual(g.sides[0].res.e, 425);
  assert.match(sim.abilityCheck(g, 0, 'shield').msg, /ready in 50 s/);
});

test('targeting: Shield and Repair only on ground in view; Orbital Strike on explored ground only', () => {
  const g = quiet();
  assert.match(sim.useAbility(g, 0, 'shield', 1000, 0).msg, /needs ground you can see/);
  assert.match(sim.useAbility(g, 0, 'repair', 1000, 0).msg, /needs ground you can see/);
  factory(g); g.sides[0].res.c = g.sides[0].res.e = 5000;
  assert.match(sim.useAbility(g, 0, 'strike', 1000, 0).msg, /explored ground/);
  g.fog[0].exp[sim.cellOf(1000)] = 1; // explored but not in view: allowed
  assert.ok(sim.useAbility(g, 0, 'strike', 1000, 0).ok);
  assert.ok(sim.useAbility(g, 0, 'shield', 300, 0).ok, 'own base is in view');
});

test('Emergency Shield: 40% less damage for 7 s, follows the unit, never extended', () => {
  const g = quiet();
  const a = hold(sim.spawnUnit(g, 0, 'tank', 400, 0), 400, 0), b = hold(sim.spawnUnit(g, 0, 'tank', 700, 0), 700, 0);
  sim.updateVision(g);
  assert.ok(sim.useAbility(g, 0, 'shield', 400, 0).ok);
  assert.ok(a.shT > g.t && !(b.shT > g.t), 'only units inside the circle');
  const hp = a.hp; sim.damage(g, a, 100, 'orbital', 1);
  assert.ok(Math.abs(hp - a.hp - 60) < 1e-6, `took ${hp - a.hp}`);
  const until = a.shT;
  g.sides[0].ab.shield = 0; // even with the cooldown skipped, a second cast doesn't extend it
  assert.ok(sim.useAbility(g, 0, 'shield', 400, 0).ok);
  assert.strictEqual(a.shT, until);
  step(g, 7.1);
  const hp2 = a.hp; sim.damage(g, a, 100, 'orbital', 1);
  assert.ok(Math.abs(hp2 - a.hp - 100) < 1e-6, 'expired');
});

test('Orbital Strike: 3 s warning, 280 at the centre to 140 at the edge, ground only, enemies only, shielded HQ immune', () => {
  const g = quiet(); seeAll(g);
  factory(g); g.sides[0].res.c = g.sides[0].res.e = 5000;
  const c = hold(sim.spawnUnit(g, 1, 'titan', 1000, 0), 1000, 0), e = hold(sim.spawnUnit(g, 1, 'titan', 1060, 0), 1060, 0);
  const air = hold(sim.spawnUnit(g, 1, 'aircraft', 1000, 0), 1000, 0), mine = hold(sim.spawnUnit(g, 0, 'titan', 1000, 20), 1000, 20);
  const hp = [c.hp, e.hp, air.hp, mine.hp];
  assert.ok(sim.useAbility(g, 0, 'strike', 1000, 0).ok);
  step(g, 2.9);
  assert.strictEqual(c.hp, hp[0], 'nothing before the delay');
  step(g, 0.2);
  const dc = hp[0] - c.hp, de = hp[1] - e.hp;
  assert.ok(Math.abs(dc - 280) < 1, `centre ${dc}`);
  assert.ok(de > 140 && de < 190, `near the edge ${de}`);
  assert.strictEqual(air.hp, hp[2], 'aircraft are not hit');
  assert.strictEqual(mine.hp, hp[3], 'own units are not hit');
  // the enemy HQ is shielded while its other buildings stand
  g.sides[0].ab.strike = 0; g.sides[1].res.c = 1e4; sim.tryBuild(g, 1, 'refinery'); step(g, 0.1);
  const hq = g.sides[1].hq, hqHp = hq.hp;
  assert.ok(hq.shielded);
  assert.ok(sim.useAbility(g, 0, 'strike', hq.u, hq.v).ok); step(g, 3.2);
  assert.strictEqual(hq.hp, hqHp);
});

test('Repair Pulse: 6%/s for 6 s on units and finished buildings; paid Repair is not doubled; capped at full HP', () => {
  const g = quiet();
  const t = hold(sim.spawnUnit(g, 0, 'tank', 400, 0), 400, 0); t.hp = 100;
  sim.tryBuild(g, 0, 'refinery', 0); sim.tryBuild(g, 0, 'barracks', 1);
  const [ref, bar] = ['refinery', 'barracks'].map(k => g.ents.find(e => e.type === k));
  ref.built = true; ref.progress = 1; ref.hp = 100; ref.lastHit = g.t;
  bar.built = true; bar.progress = 1; bar.hp = 100; bar.lastHit = g.t; bar.repair = 1e4; // paid Repair running
  sim.updateVision(g);
  const at = { u: (ref.u + bar.u + 400) / 3, v: 0 };
  for (const e of [t, ref, bar]) assert.ok(Math.hypot(e.u - at.u, e.v - at.v) - (e.half || 0) <= 120, `${e.type} inside`);
  assert.ok(sim.useAbility(g, 0, 'repair', at.u, at.v).ok);
  const h0 = [t.hp, ref.hp, bar.hp];
  step(g, 3);
  assert.ok(Math.abs(t.hp - h0[0] - 560 * 0.18) < 3, `tank +${t.hp - h0[0]}`);
  assert.ok(Math.abs(ref.hp - h0[1] - ref.maxHp * 0.18) < 3, `refinery +${ref.hp - h0[1]}`);
  assert.ok(Math.abs(bar.hp - h0[2] - bar.maxHp * 0.18) < 3, `paid Repair alone (not doubled): +${bar.hp - h0[2]}`);
  step(g, 10);
  assert.ok(t.hp <= t.maxHp);
  assert.ok(Math.abs(t.hp - h0[0] - 560 * 0.36) < 4, 'stops after 6 s');
});

test('save and resume mid-cooldown and mid-effect; a v7 save starts each ability on its first cooldown', () => {
  const g = quiet(); seeAll(g);
  factory(g); g.sides[0].res.c = g.sides[0].res.e = 5000;
  const u = hold(sim.spawnUnit(g, 0, 'tank', 400, 0), 400, 0), foe = hold(sim.spawnUnit(g, 1, 'titan', 1000, 0), 1000, 0);
  sim.useAbility(g, 0, 'shield', 400, 0); sim.useAbility(g, 0, 'strike', 1000, 0);
  step(g, 1);
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.ok(g2.sides[0].ab.shield - g2.t > 48 && g2.sides[0].ab.strike - g2.t > 98, 'cooldowns kept');
  const u2 = g2.ents.find(e => e.id === u.id), f2 = g2.ents.find(e => e.id === foe.id), hp = f2.hp;
  assert.ok(u2.shT > g2.t, 'shield kept');
  assert.strictEqual(g2.abil.filter(a => a.k === 'strike').length, 1, 'pending strike kept');
  step(g2, 2.2);
  assert.ok(hp - f2.hp > 270, 'the strike still lands after loading');
  // migration
  const o = JSON.parse(sim.serialize(quiet(500), {})); o.v = 7; delete o.abil; for (const sd of o.sides) delete sd.ab;
  const g3 = sim.deserialize(JSON.stringify(o));
  assert.ok(g3, 'v7 save loads');
  assert.strictEqual(g3.abil.length, 0);
  assert.strictEqual(g3.sides[0].ab.shield, 560); assert.strictEqual(g3.sides[0].ab.strike, 620);
});

test('the AI uses abilities under the same rules, each personality in its own way', () => {
  const use = {}, strikeDef = {};
  for (const kind of ['aggressor', 'turtle', 'economist', 'trickster']) {
    use[kind] = { shield: 0, strike: 0, repair: 0 }; strikeDef[kind] = 0;
    for (let m = 0; m < 3; m++) {
      const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: kind, autoPersona: 'turtle' });
      const orig = g.sides[1].res; // the AI pays: resources can never go negative from an ability
      for (let i = 0; i < 30 * 900 && !g.over; i++) { sim.update(g, 1 / 30); assert.ok(orig.c > -1e-6 && orig.e > -1e-6); }
      const a = g.sides[1].aiLog.abil || {};
      for (const k of ['shield', 'strike', 'repair']) use[kind][k] += a[k] || 0;
      strikeDef[kind] += a.strikeDef || 0;
    }
  }
  for (const kind of Object.keys(use)) assert.ok(use[kind].shield + use[kind].strike + use[kind].repair > 0, `${kind} used abilities: ${JSON.stringify(use[kind])}`);
  assert.ok(strikeDef.aggressor > 0, `the Aggressor strikes defences (${strikeDef.aggressor})`);
  // Easy never uses the Orbital Strike
  const g = sim.newGame('easy', {}); g.sides[0].aiT = 1e9;
  const gE = sim.newGame('easy', { autoPlayer: true, autoDiff: 'easy' });
  for (let i = 0; i < 30 * 900 && !gE.over; i++) sim.update(gE, 1 / 30);
  assert.strictEqual((gE.sides[1].aiLog.abil || {}).strike || 0, 0);
});
