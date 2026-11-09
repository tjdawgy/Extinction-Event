// v2.71 (Phase 1, Proposal E): the repair depot and the guarded relic (src/sim/nodes-special.js) on Three-Lane: depots
// heal their holder's unhurt units and take units sent home; relic guards are neutral (no side), stand their ground, hit
// either side within reach and can be hit by either; a relic is captured once, after its guards fall, for its reward; the
// AI takes depots in its capture groups and goes for a relic only when idle and clearly stronger; saves keep it all.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
test.afterEach(() => { sim.useMap('classic'); sim.SPECIAL.on = true; });
const setup = (diff = 'hard') => { const g = sim.newGame(diff, { map: 'threelane', seed: 4, factions: ['lastfist', 'lastfist'] }); g.countdown = 0; g.t = 300; for (const s of g.sides) s.aiT = 1e9; return g; };
const nodeOf = (g, type, west = true) => g.nodes.find(n => n.type === type && (n.v < 0) === true && (west ? n.u < 1150 : n.u >= 1150)) || g.nodes.find(n => n.type === type);
const run = (g, s) => { for (let i = 0; i < s * 60; i++) sim.update(g, sim.TICK); };

test('the map places two depots (one per outer lane) and two relics (mirrored, off the lanes); Classic and Two-Lane have neither', () => {
  const M = sim.MAPS.threelane, T = t => M.nodes.filter(n => n.type === t);
  assert.deepStrictEqual([T('repair').length, T('relic').length], [2, 2]);
  for (const r of T('relic')) for (const ln of M.lanes) assert.ok(Math.abs(r.at[1] - sim.laneY(ln, r.at[0])) > 150, `${r.id} is off the ${ln.id} lane`);
  for (const id of ['classic', 'twolane']) assert.ok(!sim.MAPS[id].nodes.some(n => n.type === 'repair' || n.type === 'relic'), id);
  assert.ok(sim.NODE_TYPES.repair.live && sim.NODE_TYPES.relic.live);
});

test('a depot heals its holder\'s units within reach once unhurt for a moment; not the enemy\'s, not when switched off', () => {
  const g = setup(), n = nodeOf(g, 'repair'); n.owner = 0; n.prog = 100;
  const a = sim.spawnUnit(g, 0, 'tank', n.u, n.v), b = sim.spawnUnit(g, 1, 'tank', n.u + 10, n.v), far = sim.spawnUnit(g, 0, 'tank', n.u + 300, n.v);
  for (const u of [a, b, far]) { u.hp = u.maxHp / 2; u.lastHurt = -99; }
  sim.updateRepair(g, 1);
  assert.ok(Math.abs(a.hp - a.maxHp * (0.5 + sim.REPAIR.heal / 100)) < 1e-6, `${a.hp}`);
  assert.strictEqual(b.hp, b.maxHp / 2, 'not the enemy'); assert.strictEqual(far.hp, far.maxHp / 2, 'not out of reach');
  a.lastHurt = g.t; const h = a.hp; sim.updateRepair(g, 1); assert.strictEqual(a.hp, h, 'not while under fire');
  sim.SPECIAL.on = false; a.lastHurt = -99; sim.updateRepair(g, 1); assert.strictEqual(a.hp, h, 'switched off');
});

test('Send damaged home: a unit goes to the nearest depot its side holds when that is nearer than the base flag, heals there and rejoins', () => {
  const g = setup(), n = nodeOf(g, 'repair'); n.owner = 0; n.prog = 100;
  g.ents = g.ents.filter(e => e.kind !== 'u');
  const u = sim.spawnUnit(g, 0, 'rifle', n.u + 120, n.v + 30); u.hp = u.maxHp * 0.3;
  assert.ok(sim.sendDamagedHome(g, 0).ok);
  assert.strictEqual(sim.medDepot(g, u), n);
  for (let i = 0; i < 60 * 40 && u.medHome; i++) sim.update(g, sim.TICK);
  assert.ok(!u.medHome && u.hp >= u.maxHp * 0.95, `healed (${(u.hp / u.maxHp).toFixed(2)})`);
  assert.ok(Math.hypot(u.u - n.u, u.v - n.v) < 200, `it healed at the depot, not the base (${u.u.toFixed(0)}, ${u.v.toFixed(0)})`);
  n.owner = 1; const v = sim.spawnUnit(g, 0, 'rifle', n.u + 120, n.v); v.hp = v.maxHp * 0.3; v.medHome = 1;
  assert.strictEqual(sim.medDepot(g, v), null, 'the enemy\'s depot is no refuge');
});

test('relic guards: neutral, never move, hit either side within reach, ignore what passes further away; both sides can hit them', () => {
  const g = setup(), n = nodeOf(g, 'relic'), G = g.guards.filter(x => x.node === n.id);
  assert.deepStrictEqual([...G.map(x => x.type)].sort(), ['tank', 'tank', 'titan']);
  assert.ok(G.every(x => x.side === sim.NEUTRAL) && !g.ents.includes(G[0]), 'not in g.ents, no side');
  g.ents = g.ents.filter(e => e.kind !== 'u');
  const near = sim.spawnUnit(g, 1, 'tank', n.u + 60, n.v), far = sim.spawnUnit(g, 0, 'tank', n.u + sim.RELIC.aggro + 60, n.v);
  near.holdU = near.u; near.holdV = near.v; far.holdU = far.u; far.holdV = far.v; far.cd = 1e9;
  sim.setStance(g, 0, 'hold'); g.sides[1].stance = 'hold';
  const pos = G.map(x => [x.u, x.v]);
  run(g, 4);
  assert.ok(near.hp < near.maxHp, 'a unit inside the reach is shot');
  assert.strictEqual(far.hp, far.maxHp, 'one passing outside it is not');
  assert.deepStrictEqual(JSON.stringify(G.map(x => [x.u, x.v])), JSON.stringify(pos), 'guards never move');
  assert.ok(G.some(x => x.hp < x.maxHp), 'the unit fires back at them');
});

test('a relic is captured once, after its guards fall: the reward, then it is spent; guarded, standing on it does nothing', () => {
  const g = setup(), n = nodeOf(g, 'relic'); g.ents = g.ents.filter(e => e.kind !== 'u');
  for (const x of g.guards) if (x.node !== n.id) x.hp = 0;
  const u = sim.spawnUnit(g, 0, 'rifle', n.u, n.v); u.holdU = n.u; u.holdV = n.v; u.cd = 1e9; u.hp = u.maxHp = 1e9; sim.setStance(g, 0, 'hold');
  for (const x of g.guards) x.cd = 1e9;
  run(g, 15); assert.strictEqual(n.owner, null, 'guarded: no capture');
  for (const x of g.guards) sim.kill(g, x, 0);
  const c0 = g.sides[0].res.c; run(g, 15);
  assert.ok(n.spent && n.owner === 0, 'taken');
  assert.ok(g.sides[0].res.c - c0 >= sim.RELIC.reward.c, `+${g.sides[0].res.c - c0}`);
  const c1 = g.sides[0].res.c; n.owner = null; n.prog = 0; run(g, 15); assert.ok(n.owner === null && g.sides[0].res.c - c1 < sim.RELIC.reward.c, 'only once');
});

test('the AI: depots in its capture groups; a group for a guarded relic only when idle, clearly stronger and no enemy near it; never on Easy', () => {
  const g = setup(), s = g.sides[1]; g.ents = g.ents.filter(e => e.kind !== 'u');
  for (const n of g.nodes) if (n.type === 'watchtower' || n.id === 1) { n.owner = 1; n.prog = -100; }
  for (let i = 0; i < 8; i++) sim.spawnUnit(g, 1, 'rifle', 1800, 0);
  sim.aiCapture3(g, 1, g.ents.filter(e => e.kind === 'u' && e.side === 1), [], false);
  assert.ok(s.capT && g.nodes[s.capT.node].type === 'repair', 'a depot');
  const army = []; for (let i = 0; i < 14; i++) army.push(sim.spawnUnit(g, 1, 'tank', 1700, -100));
  sim.aiRelic(g, 1, army, [], false, false);
  assert.ok(s.relicG && g.nodes[s.relicG.node].type === 'relic', 'a relic group');
  const tv = sim.guardValue(g, g.nodes[s.relicG.node]); assert.ok(s.relicG.ids.length * 0 + 1 && tv > 0);
  s.relicG = null; s.relicAt = -99; sim.aiRelic(g, 1, army.slice(0, 3), [], false, false); assert.ok(!s.relicG, 'not when weaker');
  s.relicAt = -99; sim.aiRelic(g, 1, army, [], true, false); assert.ok(!s.relicG, 'not under threat');
  s.relicAt = -99; sim.aiRelic(g, 1, army, [], false, true); assert.ok(!s.relicG, 'not on Easy');
});

test('a save keeps the guards, their health and a spent relic', () => {
  const g = setup(), n = nodeOf(g, 'relic'); g.guards[0].hp = 123; n.spent = true;
  const h = sim.deserialize(sim.serialize(g));
  assert.strictEqual(h.guards.length, g.guards.length); assert.strictEqual(h.guards[0].hp, 123);
  assert.ok(h.nodes.find(x => x.id === n.id).spent);
});
