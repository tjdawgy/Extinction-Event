// Axiarch power field and warp-in (v2.26, docs/AXIARCHS.md sections 3 and 4): the field grows from the Axis, Continuum
// Spires and held nodes, recedes on loss; faster shield regen inside; units warp in at the warp point after a channel,
// paid once and counted in supply; the warp point snaps back when the field is lost; never onto enemies, buildings or
// invalid ground (else the Axis); the enemy's field is only remembered as seen; the AI uses the default point; saves v23.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const U = sim.UDEF, F = sim.FIELD, W = sim.WARP;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'axiarchs', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const finish = (g, s, k) => { assert.ok(sim.tryBuild(g, s, k).ok, k); const b = g.ents.filter(e => e.side === s && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; return b; };
const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; e.cd = 1e6; return e; };
const patch = (g, k, s = 0) => g.field[s].find(p => p.k === k);
const grown = g => { step(g, 60); return g; };
const arrive = g => { for (let i = 0; i < 30 * 10 && g.warps.length; i++) sim.update(g, 1 / 30); }; // to the frame the last warp lands
const units = (g, t) => g.ents.filter(e => e.kind === 'u' && e.side === 0 && e.type === t);

test('the field grows gradually from the Axis; each Continuum Spire enlarges it; a held node gets its own and loses it gradually; Last Fist has none', () => {
  const g = quiet();
  step(g, 1); const ax = patch(g, 'axis'); assert.ok(ax && ax.r > 0 && ax.r < 15, 'it starts small');
  step(g, 40); assert.strictEqual(ax.r, F.axisR, 'grown to its radius');
  finish(g, 0, 'habitat'); finish(g, 0, 'habitat'); step(g, 1);
  assert.strictEqual(ax.R, F.axisR + 2 * F.spireAdd, 'two Spires enlarge the base field'); step(g, 20); assert.strictEqual(patch(g, 'axis').r, F.axisR + 2 * F.spireAdd);
  const n = g.nodes[0]; n.owner = 0; n.prog = 100; step(g, 2);
  const np = patch(g, 'n' + n.id); assert.ok(np && np.r > 0 && np.r < F.nodeR, 'a forward field starts growing');
  step(g, 120); assert.strictEqual(np.r, F.nodeR);
  n.owner = null; n.prog = 0; step(g, 2); assert.ok(np.r < F.nodeR && np.r > 0, 'the node lost: it recedes gradually');
  step(g, 30); assert.ok(!patch(g, 'n' + n.id), 'and is gone');
  assert.strictEqual(g.field[1].length, 0, 'no field for Last Fist');
  assert.ok(sim.onField(g, 0, g.sides[0].hq.u + 100, 0) && !sim.onField(g, 0, n.u + 40, 0));
});

test('shields recharge faster inside the friendly field', () => {
  const g = grown(quiet());
  const hq = g.sides[0].hq, a = put(g, 0, 'bastion', hq.u + 100, 0), b = put(g, 0, 'bastion', 900, 0); // mid-lane: outside the field and out of the enemy HQ's reach
  assert.ok(sim.onField(g, 0, a.u, a.v) && !sim.onField(g, 0, b.u, b.v));
  for (const e of [a, b]) { e.shp = 0; e.shpT = g.t - 10; e.braceCd = 1e9; }
  step(g, 1);
  assert.ok(Math.abs(a.shp - a.maxShp * F.regen) < 1, `inside: ${F.regen * 100}%/s`); assert.ok(Math.abs(b.shp - b.maxShp * sim.SHIELD.rate) < 1, `outside: ${sim.SHIELD.rate * 100}%/s`);
});

test('a trained unit warps in at the warp point after a visible channel: paid once, counted in supply, never duplicated', () => {
  const g = grown(quiet());
  const gate = finish(g, 0, 'barracks'), c0 = g.sides[0].res.c;
  assert.ok(sim.tryTrain(g, 0, 'shardling').ok); assert.strictEqual(g.sides[0].res.c, c0 - U.shardling.cost.c, 'paid on tap');
  const pop = sim.popUsed(g, 0);
  step(g, U.shardling.time + 0.1);
  assert.strictEqual(g.warps.length, 1, 'channelling'); assert.strictEqual(units(g, 'shardling').length, 0, 'not there yet');
  assert.strictEqual(sim.popUsed(g, 0), pop, 'still counted in supply');
  const wp = sim.warpPoint(g, 0), w = g.warps[0];
  assert.ok(Math.hypot(w.u - wp.u, w.v - wp.v) < 1, 'at the warp point (the front edge of the field)');
  assert.ok(wp.u > g.sides[0].hq.u + F.axisR * 0.8, 'the default point is the field\'s front edge');
  arrive(g); assert.ok(Math.abs(g.t - w.end) < 0.05, 'after the channel');
  const s = units(g, 'shardling'); assert.strictEqual(s.length, 1, 'exactly one unit'); assert.strictEqual(g.warps.length, 0);
  assert.ok(Math.hypot(s[0].u - wp.u, s[0].v - wp.v) < 1 && Math.abs(s[0].u - gate.u) > 60, 'it arrived at the warp point, not at its Gate');
  assert.strictEqual(g.log.tot[0].trained.shardling, 1, 'logged once, on arrival');
  const r = put(g, 1, 'rifle', 900, 0); sim.update(g, 1 / 30); assert.ok(!g.warps.length);
  const lf = quiet('lastfist', 'axiarchs'); finish(lf, 0, 'barracks'); sim.tryTrain(lf, 0, 'rifle'); step(lf, U.rifle.time + 0.1);
  assert.strictEqual(lf.warps.length, 0, 'other factions still walk out'); assert.strictEqual(lf.ents.filter(e => e.type === 'rifle').length, 1);
});

test('Set warp point: only inside the field; units go there; it snaps back to the default when its field is lost', () => {
  const g = grown(quiet()); finish(g, 0, 'barracks');
  assert.match(sim.setWarp(g, 0, 1400, 0).msg, /inside your power field/); assert.match(sim.setWarp(g, 0, g.sides[0].hq.u + 50, 400).msg, /inside your power field/, 'off the lane');
  const n = g.nodes[0]; n.owner = 0; n.prog = 100; step(g, 120);
  assert.ok(sim.setWarp(g, 0, n.u + 30, 20).ok); const set = g.sides[0].warp;
  sim.tryTrain(g, 0, 'shardling'); step(g, U.shardling.time + 0.1); arrive(g);
  const s = units(g, 'shardling')[0]; assert.ok(Math.hypot(s.u - set.u, s.v - set.v) < 1, 'arrived at the chosen point');
  n.owner = null; n.prog = 0; g.events.length = 0;
  for (let i = 0; i < 30 * 30 && g.sides[0].warp; i++) sim.update(g, 1 / 30);
  assert.strictEqual(g.sides[0].warp, null, 'snapped back once the field receded from under it'); assert.ok(g.events.some(e => e.type === 'warpSnap' && e.side === 0));
  step(g, 20); const d = sim.warpPoint(g, 0); assert.ok(!patch(g, 'n' + n.id) && d.u < g.sides[0].hq.u + F.axisR + 1, 'the default again: the base field\'s front edge');
});

test('units never warp onto enemies, buildings or invalid ground: the nearest valid spot, else the Axis', () => {
  const g = grown(quiet()); finish(g, 0, 'barracks');
  const wp = sim.warpPoint(g, 0);
  const foes = [put(g, 1, 'tank', wp.u, wp.v), put(g, 1, 'rifle', wp.u + 12, wp.v + 10)];
  sim.startWarp(g, 0, 'shardling'); const w = g.warps[0];
  for (const f of foes) assert.ok(Math.hypot(f.u - w.u, f.v - w.v) >= W.clear, 'clear of every enemy');
  assert.ok(sim.onField(g, 0, w.u, w.v) && Math.abs(w.v) <= 90 && Math.hypot(w.u - wp.u, w.v - wp.v) < 4 * W.step, 'a nearby spot inside the field');
  for (const b of g.ents) if (b.kind === 'b') assert.ok(Math.hypot(b.u - w.u, b.v - w.v) >= b.half + 12, 'not on a building');
  const late = put(g, 1, 'heavy', w.u, w.v); step(g, W.ch + 0.1); // an enemy walks onto the spot during the channel
  const s = units(g, 'shardling')[0]; assert.ok(Math.hypot(s.u - late.u, s.v - late.v) >= W.clear, 'it shifts to the nearest valid spot on arrival');
  sim.startWarp(g, 0, 'shardling'); const w2 = g.warps.at(-1); assert.ok(Math.hypot(w2.u - s.u, w2.v - s.v) > 0 && g.warps.every((x, i, a) => a.every((y, j) => i === j || Math.hypot(x.u - y.u, x.v - y.v) >= W.step)), 'two warps never share a spot');
  // no valid spot at all: the field covered in enemies
  const g2 = grown(quiet()); for (let u = 0; u < 700; u += 20) for (let v = -100; v <= 100; v += 20) put(g2, 1, 'rifle', u, v);
  for (const e of g2.ents) if (e.side === 1 && e.kind === 'u') e.hp = e.maxHp = 1e6;
  sim.startWarp(g2, 0, 'bastion'); const hq = g2.sides[0].hq;
  assert.ok(Math.abs(g2.warps[0].u - (hq.u + hq.half + 12)) < 1, 'none valid: it warps in at the Axis');
});

test('fog: the enemy field is remembered only as seen, and fields grant no vision', () => {
  const g = grown(quiet('lastfist', 'axiarchs'));
  sim.updateVision(g); const f = g.fog[0];
  assert.deepStrictEqual(Object.keys(f.field), [], 'the enemy base field is out of sight');
  const eye = put(g, 0, 'drone', g.sides[1].hq.u - 150, 0); sim.updateVision(g);
  assert.ok(f.field.axis && f.field.axis.r > 0, 'seen: remembered');
  const r0 = f.field.axis.r; eye.hp = 0; g.ents = g.ents.filter(e => e.hp > 0); sim.updateVision(g); step(g, 1);
  assert.strictEqual(f.field.axis.r, r0, 'out of sight again: kept as last seen');
  const ax = quiet(); step(ax, 60); sim.updateVision(ax); const vis0 = Array.from(ax.fog[0].vis).reduce((a, b) => a + b, 0);
  const ax2 = quiet(); sim.updateVision(ax2); const vis1 = Array.from(ax2.fog[0].vis).reduce((a, b) => a + b, 0);
  assert.strictEqual(vis0, vis1, 'a grown field adds no vision');
});

test('the AI uses the default warp point; its units warp in (seeded Hard)', () => {
  const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const S = loadSim({ random: mul(5) });
  const g = S.newGame('hard', { factions: ['lastfist', 'axiarchs'] }); g.sides[0].aiT = 1e9;
  let warped = 0;
  for (let i = 0; i < 30 * 240 && !g.over; i++) { const n = g.warps.length; S.update(g, 1 / 30); if (g.warps.length > n) warped++; assert.strictEqual(g.sides[1].warp, null); }
  assert.ok(warped > 0 && g.sides[1].aiLog.trained.shardling > 0, `warps started: ${warped}`);
});

test('saves v23 keep the field, units mid-warp and the warp point; a v22 save grows its field from scratch', () => {
  assert.strictEqual(sim.SAVE_VER, 23);
  const g = grown(quiet()); const n = g.nodes[0]; n.owner = 0; n.prog = 100; step(g, 60);
  assert.ok(sim.setWarp(g, 0, n.u, 10).ok); sim.startWarp(g, 0, 'bastion');
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(g2.field)), JSON.parse(JSON.stringify(g.field)));
  assert.deepStrictEqual(JSON.stringify(g2.warps), JSON.stringify(g.warps));
  assert.deepStrictEqual({ ...g2.sides[0].warp }, { ...g.sides[0].warp });
  step(g2, W.ch + 0.1); assert.strictEqual(g2.ents.filter(e => e.type === 'bastion').length, 1, 'the warp completes after loading');
  const o = JSON.parse(sim.serialize(quiet(), {})); o.v = 22; delete o.field; delete o.warps; for (const sd of o.sides) delete sd.warp; for (const f of o.fog) delete f.field;
  const g3 = sim.deserialize(JSON.stringify(o));
  assert.ok(g3 && g3.field[0].length === 0 && g3.warps.length === 0 && g3.sides[0].warp === null && g3.fog[0].field);
  step(g3, 2); assert.ok(patch(g3, 'axis').r > 0, 'grows again');
});
