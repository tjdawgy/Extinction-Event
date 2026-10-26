// Bloomhost commander abilities and temporary units (v2.20): one shared cooldown for Frenzy Bloom, Emergency Brood and
// Corrosive Bloom; unlocks and costs mirrored from Last Fist; temporary Skitterlings (lifetime, no supply, cap, removed on
// expiry, at match end and kept correctly through save and load); the spore cloud's damage and corrosion under the
// 25% cap; the match log; the AI casting all three. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const A = sim.ABIL;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'bloomhost', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); g.t = 200; return g; };
const ready = (g, s = 0) => { for (const k in g.sides[s].ab) g.sides[s].ab[k] = 0; };
const seeAll = g => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } };
const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; return e; };
const hqT2 = (g, s = 0) => { g.sides[s].hq.tier = 2; };

test('costs, cooldowns and unlocks mirror Last Fist (Frenzy ↔ Shield, Brood ↔ Repair Pulse, Corrosive ↔ Orbital Strike); one shared cooldown locks all three', () => {
  for (const [b, l] of [['frenzy', 'shield'], ['brood', 'repair'], ['corrosive', 'strike']]) {
    assert.strictEqual(A[b].like, l);
    assert.deepStrictEqual([A[b].cost.c, A[b].cost.e, A[b].cd, A[b].first, A[b].req, A[b].reqTier], [A[l].cost.c, A[l].cost.e, A[l].cd, A[l].first, A[l].req, A[l].reqTier], b);
  }
  const g = quiet(); seeAll(g);
  assert.match(sim.abilityCheck(g, 0, 'corrosive').msg, /needs your Command HQ T2|needs your Hive T2/);
  hqT2(g); ready(g);
  const sk = put(g, 0, 'skitterling', 400, 0);
  assert.ok(sim.useAbility(g, 0, 'frenzy', 400, 0).ok);
  for (const k of ['frenzy', 'brood', 'corrosive']) assert.match(sim.abilityCheck(g, 0, k).msg, /Shared cooldown: abilities ready in 50 s/, k);
  assert.strictEqual(g.sides[0].res.c, 9000 - A.frenzy.cost.c);
  ready(g); assert.ok(sim.useAbility(g, 0, 'corrosive', 900, 0).ok);
  for (const k of ['frenzy', 'brood', 'corrosive']) assert.match(sim.abilityCheck(g, 0, k).msg, /Shared cooldown: abilities ready in 100 s/, k);
  g.sides[1].ab = { shield: 0, strike: 0, repair: 0 }; assert.ok(sim.abilityCheck(g, 1, 'shield').ok, 'the other side is not locked');
});

test('Frenzy Bloom: faster movement and attacks for 7 s for Bloomhost units in the circle; no health; nothing for others', () => {
  const g = quiet('bloomhost', 'bloomhost'); seeAll(g); ready(g);
  const a = put(g, 0, 'skitterling', 400, 0), far = put(g, 0, 'skitterling', 700, 0), foe = put(g, 1, 'skitterling', 410, 0);
  const hp = a.maxHp; assert.ok(sim.useAbility(g, 0, 'frenzy', 400, 0).ok);
  assert.ok(a.frzT > g.t && !(far.frzT > g.t) && !(foe.frzT > g.t)); assert.strictEqual(a.maxHp, hp);
  a.holdU = 600; a.cd = 1; foe.hp = 0; sim.update(g, 0.1); g.ents = g.ents.filter(e => e.hp > 0);
  const dt = 0.1, u0 = a.u; sim.update(g, dt);
  assert.ok(Math.abs((a.u - u0) / dt - sim.UDEF.skitterling.speed * A.frenzy.speed) < 1, `speed ${((a.u - u0) / dt).toFixed(1)}`);
  assert.ok(Math.abs(a.cd - (1 - 0.2 * A.frenzy.rate)) < 1e-6, 'cooldown runs 35% faster');
  step(g, A.frenzy.dur); assert.ok(!(a.frzT > g.t), 'over after 7 s');
});

test('Emergency Brood: after a 2 s warning, 5 temporary Skitterlings: no supply, at most 8, gone after 20 s without counting as losses', () => {
  const g = quiet(); seeAll(g); ready(g);
  const used = sim.popUsed(g, 0);
  assert.ok(sim.useAbility(g, 0, 'brood', 500, 0).ok);
  step(g, A.brood.delay - 0.1); assert.strictEqual(g.ents.filter(e => e.temp).length, 0, 'nothing before landing');
  step(g, 0.2);
  const t1 = g.ents.filter(e => e.kind === 'u' && e.temp);
  assert.strictEqual(t1.length, A.brood.n); assert.ok(t1.every(e => e.type === 'skitterling' && Math.abs(e.temp - (g.t + A.brood.life)) < 0.3));
  assert.strictEqual(sim.popUsed(g, 0), used, 'no supply');
  ready(g); assert.ok(sim.useAbility(g, 0, 'brood', 520, 30).ok); step(g, A.brood.delay + 0.1);
  assert.strictEqual(g.ents.filter(e => e.temp).length, sim.TEMP.max, 'capped at 8');
  const lost0 = Object.values(g.log.tot[0].lost).reduce((a, b) => a + b, 0);
  step(g, A.brood.life + 1);
  assert.strictEqual(g.ents.filter(e => e.temp).length, 0, 'all expired');
  assert.strictEqual(Object.values(g.log.tot[0].lost).reduce((a, b) => a + b, 0), lost0, 'expiry is not a loss');
  assert.match(sim.logText(g, { version: sim.VERSION, diff: 'Normal', persona: 'x', result: 'x' }), /Emergency Brood: 5 Skitterlings hatched/);
});

test('Emergency Brood targeting: visible lane ground only, clear of enemies; it never lands a creature on an enemy', () => {
  const g = quiet(); seeAll(g); ready(g);
  assert.match(sim.abilityCheck(g, 0, 'brood', 500, 200).msg, /open ground on the lane/);
  const foe = put(g, 1, 'rifle', 800, 0); foe.cd = 1e6;
  assert.match(sim.abilityCheck(g, 0, 'brood', 820, 0).msg, /clear of enemies/);
  g.fog[0].vis.fill(0); g.fog[0].vis[sim.cellOf(300)] = 1;
  assert.match(sim.abilityCheck(g, 0, 'brood', 1000, 0).msg, /needs ground you can see/);
  seeAll(g); assert.ok(sim.useAbility(g, 0, 'brood', 900, 0).ok);
  const late = put(g, 1, 'tank', 922, 0); late.cd = 1e6; // an enemy walks onto one of the landing spots during the warning
  step(g, A.brood.delay + 0.05);
  const temps = g.ents.filter(e => e.temp);
  assert.ok(temps.length === A.brood.n - 1 && temps.every(e => Math.hypot(e.u - late.u, e.v - late.v) >= 21), `${temps.length} landed, none on the Tank`);
});

test('temporary units: removed at the end of the match; kept with their expiry through save and load; never carried into a new match', () => {
  const g = quiet(); seeAll(g); ready(g); sim.useAbility(g, 0, 'brood', 500, 0); step(g, A.brood.delay + 0.1);
  const ids = g.ents.filter(e => e.temp).map(e => [e.id, e.temp]);
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(g2.ents.filter(e => e.temp).map(e => [e.id, e.temp]))), JSON.parse(JSON.stringify(ids)), 'same creatures, same expiry');
  assert.strictEqual(sim.popUsed(g2, 0), sim.popUsed(g, 0));
  step(g2, A.brood.life + 1); assert.strictEqual(g2.ents.filter(e => e.temp).length, 0, 'they still expire after loading');
  sim.useAbility(g, 0, 'brood', 600, 0); ready(g); step(g, A.brood.delay + 0.1);
  sim.kill(g, g.sides[1].hq, 0); for (const b of g.ents) if (b.side === 1 && b.kind === 'b') b.shielded = false; sim.update(g, 1 / 30); step(g, 6);
  assert.ok(g.over); assert.strictEqual(g.ents.filter(e => e.temp).length, 0, 'none left once the match is over');
  const g3 = sim.newGame('normal', { factions: ['bloomhost', 'lastfist'] });
  assert.strictEqual(g3.ents.filter(e => e.kind === 'u').length, 0, 'a new match starts clean');
});

test('Corrosive Bloom: 8 s of light damage and 15% corrosion to enemy ground units inside; never past the cap or stacked with Spitter acid; no aircraft or buildings; they can walk out', () => {
  const g = quiet(); seeAll(g); hqT2(g); ready(g);
  const r = put(g, 1, 'rifle', 900, 0), t = put(g, 1, 'titan', 910, 20), air = put(g, 1, 'aircraft', 900, 0), out = put(g, 1, 'rifle', 900 + A.corrosive.r + 40, 0);
  for (const e of [r, t, air, out]) { e.cd = 1e6; e.hp = e.maxHp = 1e4; }
  t.corr = 0.2; t.corrT = g.t + 30; // already corroded by a Bilecaster
  const ref = sim.tryBuild(g, 1, 'refinery'); const b = g.ents.find(e => e.side === 1 && e.type === 'refinery'); b.built = true; b.progress = 1; b.u = 900; b.v = 0; b.hp = b.maxHp;
  assert.ok(sim.useAbility(g, 0, 'corrosive', 900, 0).ok);
  step(g, 1);
  assert.ok(r.hp < 1e4 && Math.abs(r.corr - A.corrosive.corr) < 1e-9, 'damage and corrosion');
  assert.strictEqual(t.corr, 0.2, 'a stronger corrosion stays; nothing adds up');
  assert.ok(t.corr <= sim.CORR.cap && r.corr <= sim.CORR.cap);
  assert.strictEqual(air.hp, 1e4, 'no aircraft'); assert.strictEqual(out.hp, 1e4, 'outside: nothing'); assert.strictEqual(b.hp, b.maxHp, 'no buildings');
  const per = (1e4 - r.hp); r.holdU = r.u = 900 + A.corrosive.r + 60; step(g, 2); const h = r.hp; step(g, 1); assert.strictEqual(r.hp, h, 'walked out: no more damage');
  assert.ok(per > A.corrosive.dps * 0.9 && per < A.corrosive.dps * 1.5, `about 14 damage a second: ${per.toFixed(1)}`);
  step(g, A.corrosive.dur); assert.strictEqual(g.abil.filter(a => a.k === 'corrosive').length, 0, 'the cloud is gone');
  assert.match(sim.logText(g, { version: sim.VERSION, diff: 'Normal', persona: 'x', result: 'x' }), /Corrosive Bloom: \d+ damage/);
});

test('saves v20 keep Bloomhost cooldowns and active effects; a v19 Bloomhost save carries its old timers over', () => {
  const g = quiet(); seeAll(g); hqT2(g); ready(g);
  sim.useAbility(g, 0, 'corrosive', 900, 0); step(g, 1);
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.deepStrictEqual({ ...g2.sides[0].ab }, { ...g.sides[0].ab }); assert.strictEqual(g2.sides[0].abK, 'corrosive');
  assert.strictEqual(g2.abil.filter(a => a.k === 'corrosive').length, 1, 'the cloud is still there');
  const o = JSON.parse(sim.serialize(g, {})); o.v = 19; o.sides[0].ab = { shield: 300, strike: 350, repair: 300 }; o.sides[0].abK = 'strike';
  for (const T of o.log.tot) { delete T.ab.frenzy; delete T.ab.brood; delete T.ab.corrosive; }
  for (const e of o.ents) { delete e.temp; delete e.frzT; }
  const g3 = sim.deserialize(JSON.stringify(o));
  assert.deepStrictEqual({ ...g3.sides[0].ab }, { frenzy: 300, brood: 300, corrosive: 350 }); assert.strictEqual(g3.sides[0].abK, 'corrosive');
  assert.deepStrictEqual({ ...g3.sides[1].ab }, { ...g.sides[1].ab }, 'Last Fist untouched');
  ready(g3); assert.ok(sim.useAbility(g3, 0, 'frenzy', 400, 0).ok, 'and works after loading');
  assert.strictEqual(sim.SAVE_VER, 20);
});

test('the Bloomhost AI casts all three in a seeded Hard match (Turtle), under the same shared cooldown', () => {
  const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const S = loadSim({ random: mul(4) });
  const g = S.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'turtle', autoPersona: 'turtle', factions: ['lastfist', 'bloomhost'] });
  let last = null;
  for (let i = 0; i < 30 * 1700 && !g.over; i++) {
    S.update(g, 1 / 30);
    for (const e of g.events) if (e.type === 'ability' && e.side === 1) { if (last) assert.ok(g.t - last.t >= S.ABIL[last.k].cd - 1e-6); last = { t: g.t, k: e.k }; }
    g.events.length = 0;
  }
  const ab = g.sides[1].aiLog.abil || {};
  for (const k of ['frenzy', 'brood', 'corrosive']) assert.ok(ab[k] > 0, `${k}: ${JSON.stringify(ab)}`);
});
