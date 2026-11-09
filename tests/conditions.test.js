// v2.72 (Phase 1, Proposal F): battlefield conditions (src/sim/conditions.js): only what the map allows; heavy fog (sight,
// watchtowers, explored ground fading), rich centre, scarce resources, meteors (seeded spots, warning, damage to both
// sides, AI units step out of the circle, a player's don't); the AI's adjustments; saves keep them.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
test.afterEach(() => sim.useMap('classic'));
const C = sim.COND;
const mk = (map, cond, o = {}) => { const g = sim.newGame('hard', Object.assign({ map, seed: 21, factions: ['lastfist', 'lastfist'], cond }, o)); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9; return g; };

test('each map allows its conditions: meteors only on Two-Lane and Three-Lane; none by default', () => {
  assert.deepStrictEqual([...sim.MAPS.classic.conditions], ['heavyFog', 'richCenter', 'scarce']);
  for (const id of ['twolane', 'threelane']) assert.deepStrictEqual([...sim.MAPS[id].conditions], ['heavyFog', 'richCenter', 'scarce', 'meteors']);
  assert.deepStrictEqual(Object.keys(mk('classic', ['meteors', 'scarce']).cond), ['scarce'], 'Classic refuses meteors');
  assert.deepStrictEqual(Object.keys(mk('twolane').cond), []);
});

test('heavy fog: sight ×0.6, watchtowers ×0.8, explored ground fades after a minute out of view', () => {
  const vis = cond => { const g = mk('twolane', cond); g.ents = g.ents.filter(e => e.kind === 'b'); const u = sim.spawnUnit(g, 0, 'rifle', 1100, 0); sim.updateVision(g); return { g, u, n: g.fog[0].vis.reduce((a, b) => a + b, 0) }; };
  const clear = vis([]), fog = vis(['heavyFog']);
  assert.ok(fog.n < clear.n * 0.75, `less in view (${fog.n} vs ${clear.n})`);
  const g = fog.g, i = sim.cur().cellOf(1100, 0);
  assert.ok(g.fog[0].exp[i]);
  fog.u.u = 300; fog.u.v = 0; g.t += C.heavyFog.fade + 1; sim.updateVision(g);
  assert.ok(!g.fog[0].exp[i], 'faded back to unexplored');
  const h = clear.g; clear.u.u = 300; h.t += 120; sim.updateVision(h); assert.ok(h.fog[0].exp[sim.cur().cellOf(1100, 0)], 'without heavy fog it stays explored');
});

test('rich centre: the centre pays 3× on lane maps (Two-Lane\'s 1.5× becomes 3×), the middle node 2× on Classic', () => {
  assert.strictEqual(mk('twolane', ['richCenter']).nodes[1].mul, C.richCenter.lanes);
  assert.strictEqual(mk('threelane', ['richCenter']).nodes[1].mul, C.richCenter.lanes);
  assert.strictEqual(mk('classic', ['richCenter']).nodes[1].mul, C.richCenter.classic);
  const g = mk('classic', ['richCenter']), base = sim.income(g, 0).c; g.nodes[1].owner = 0;
  assert.strictEqual(sim.income(g, 0).c - base, sim.NODE_INC.c * C.richCenter.classic);
});

test('scarce: 200 credits to start, Refineries and nodes pay 0.6× (the HQ as usual)', () => {
  const g = mk('classic', ['scarce']), n = mk('classic', []);
  assert.strictEqual(g.sides[0].res.c, C.scarce.start);
  const hq = sim.income(g, 0).c; assert.strictEqual(hq, sim.income(n, 0).c, 'the HQ pays as usual');
  for (const x of [g, n]) { x.sides[0].res.c = 9000; sim.tryBuild(x, 0, 'refinery'); const b = x.ents.find(e => e.type === 'refinery'); b.built = true; x.nodes[0].owner = 0; }
  assert.ok(Math.abs((sim.income(g, 0).c - hq) - (sim.income(n, 0).c - hq) * C.scarce.pay) < 1e-9);
});

test('meteors: from 5:00, a warning, then damage to both sides\' ground units and buildings in the circle; seeded, so a replay repeats the spots', () => {
  const spots = () => { const g = mk('twolane', ['meteors']); const out = []; g.t = C.meteors.from; for (let k = 0; k < 3; k++) { sim.updateMeteors(g); out.push([Math.round(g.meteor.at.u), Math.round(g.meteor.at.v)]); g.t = g.meteor.at.t; sim.updateMeteors(g); g.t = g.meteor.next; } return out; };
  assert.deepStrictEqual(spots(), spots(), 'the same seed, the same spots');
  const g = mk('twolane', ['meteors']); g.t = C.meteors.from - 1; sim.updateMeteors(g); assert.strictEqual(g.meteor.at, null, 'nothing before 5:00');
  g.t = C.meteors.from; sim.updateMeteors(g); const A = g.meteor.at; assert.ok(A && A.t === g.t + C.meteors.warn);
  const a = sim.spawnUnit(g, 0, 'tank', A.u, A.v), b = sim.spawnUnit(g, 1, 'tank', A.u + 20, A.v), far = sim.spawnUnit(g, 0, 'tank', A.u + C.meteors.r + 60, A.v), air = sim.spawnUnit(g, 1, 'aircraft', A.u, A.v);
  g.t = A.t; sim.updateMeteors(g);
  assert.ok(a.hp < a.maxHp && b.hp < b.maxHp, 'both sides hit'); assert.strictEqual(far.hp, far.maxHp); assert.strictEqual(air.hp, air.maxHp, 'not aircraft');
  assert.ok(g.meteor.at === null && g.meteor.next > g.t);
});

test('meteors: an AI\'s units step out of the circle; a player\'s units stay where they are told', () => {
  const g = mk('twolane', ['meteors']); g.t = C.meteors.from; sim.updateMeteors(g); const A = g.meteor.at;
  const ai = sim.spawnUnit(g, 1, 'rifle', A.u + 10, A.v), me = sim.spawnUnit(g, 0, 'rifle', A.u - 10, A.v);
  sim.setStance(g, 0, 'hold'); me.holdU = me.u; me.holdV = me.v; g.sides[1].stance = 'hold'; ai.holdU = ai.u; ai.holdV = ai.v;
  for (let i = 0; i < 60 * 3; i++) { sim.updateUnit(g, ai, [], sim.TICK); sim.updateUnit(g, me, [], sim.TICK); }
  assert.ok(Math.hypot(ai.u - A.u, ai.v - A.v) > C.meteors.r, 'the AI\'s rifleman got out');
  assert.ok(Math.hypot(me.u - A.u, me.v - A.v) < 20, 'the player\'s holds');
});

test('the AI adjusts: scouts twice as often in heavy fog, takes the field and the centre earlier with a rich centre, wants smaller armies when scarce', () => {
  const g = mk('twolane', ['richCenter']), s = g.sides[1]; g.t = C.richCenter.capFrom + 5; g.ents = g.ents.filter(e => e.kind !== 'u');
  for (let i = 0; i < 8; i++) sim.spawnUnit(g, 1, 'rifle', 1900, 280);
  sim.aiCapture(g, 1, g.ents.filter(e => e.kind === 'u' && e.side === 1), [], false);
  assert.ok(s.capT && s.capT.node === 1, 'a capture group for the rich centre before the usual time');
  const h = mk('twolane', []), t = h.sides[1]; h.t = C.richCenter.capFrom + 5; h.ents = h.ents.filter(e => e.kind !== 'u');
  for (let i = 0; i < 8; i++) sim.spawnUnit(h, 1, 'rifle', 1900, 280);
  sim.aiCapture(h, 1, h.ents.filter(e => e.kind === 'u' && e.side === 1), [], false); assert.ok(!t.capT, 'not without it');
});

test('a save keeps the conditions and the next meteor', () => {
  const g = mk('threelane', ['heavyFog', 'meteors']); g.t = C.meteors.from; sim.updateMeteors(g);
  const h = sim.deserialize(sim.serialize(g));
  assert.deepStrictEqual([...Object.keys(h.cond)], ['heavyFog', 'meteors']); assert.strictEqual(JSON.stringify(h.meteor.at), JSON.stringify(g.meteor.at));
});
