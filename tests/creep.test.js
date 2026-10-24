// Creep (v2.18): spread from the Hive and other Bloomhost buildings, faster around held nodes, receding when a source is
// lost; +20% speed and out-of-combat regeneration for Bloomhost ground units on their own creep only; no stacking with
// other heals; enemy creep remembered only as seen; no vision from creep; saves. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const C = sim.CREEP;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'bloomhost', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const patch = (g, s, k) => g.creep[s].find(p => p.k === k);
const finish = (g, s, k) => { assert.ok(sim.tryBuild(g, s, k).ok); const b = g.ents.filter(e => e.side === s && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };

test('creep grows gradually from the Hive (never all at once) up to its radius; other buildings add their own; Last Fist has none', () => {
  const g = quiet(), hq = g.sides[0].hq;
  assert.deepStrictEqual(JSON.parse(JSON.stringify(g.creep)), [[], []]);
  step(g, 1 / 30);
  const p = patch(g, 0, 'b' + hq.id);
  assert.ok(p && p.r < 1, 'starts from nothing');
  step(g, 10);
  assert.ok(Math.abs(p.r - C.grow * 10) < 1, `after 10 s: ${p.r}`);
  step(g, 60);
  assert.strictEqual(p.r, C.hiveR, 'capped at the Hive radius');
  const pit = finish(g, 0, 'barracks'); step(g, 5);
  assert.ok(Math.abs(patch(g, 0, 'b' + pit.id).r - C.grow * 5) < 1, 'a new building grows its own patch');
  assert.strictEqual(g.creep[1].length, 0, 'no creep for Last Fist');
  assert.ok(C.hiveR > C.bldR && C.grow > 0 && C.recede > 0 && C.speed === 1.2 && C.calm > 0, 'named constants');
});

test('a held node grows creep faster; losing it, or a building, makes its creep recede gradually and vanish', () => {
  const g = quiet(), n = g.nodes[0];
  n.owner = 0; n.prog = 100; step(g, 5);
  const np = patch(g, 0, 'n0');
  assert.ok(Math.abs(np.r - C.grow * C.nodeGrow * 5) < 1, `node patch after 5 s: ${np.r}`);
  assert.ok(C.nodeGrow > 1);
  step(g, 30); assert.strictEqual(np.r, C.nodeR);
  n.owner = null; n.prog = 0; step(g, 4);
  assert.ok(Math.abs(np.r - (C.nodeR - C.recede * 4)) < 1, `receding: ${np.r}`);
  step(g, C.nodeR / C.recede + 1); assert.ok(!patch(g, 0, 'n0'), 'gone once it reaches zero');
  const pit = finish(g, 0, 'barracks'); step(g, 30);
  const bp = patch(g, 0, 'b' + pit.id); assert.strictEqual(bp.r, C.bldR);
  sim.trySell(g, 0, pit); step(g, 3);
  assert.ok(Math.abs(bp.r - (C.bldR - C.recede * 3)) < 1, 'sold: recedes');
  const ref = finish(g, 0, 'refinery'); step(g, 30); sim.kill(g, ref, 1); step(g, 2);
  assert.ok(patch(g, 0, 'b' + ref.id).r < C.bldR, 'destroyed: recedes');
});

test('+20% speed on own creep, for Bloomhost ground units only (not off creep, not aircraft, not Last Fist units)', () => {
  const g = quiet(); g.nodes[1].owner = 0; g.nodes[1].prog = 100; step(g, 60); // the Hive's creep and the centre node's are out to full radius
  const hq = g.sides[0].hq, on = { u: hq.u + 80, v: hq.v + 40 }, off = { u: hq.u + C.hiveR + 120, v: 0 }, mid = { u: g.nodes[1].u - 60, v: 0 };
  assert.ok(sim.onCreep(g, 0, on.u, on.v) && !sim.onCreep(g, 0, off.u, off.v));
  const speedAt = (s, type, at) => { const u = sim.spawnUnit(g, s, type, at.u, at.v); u.holdU = at.u + 40; u.holdV = at.v; const u0 = u.u; sim.update(g, 0.1); const d = u.u - u0; u.hp = 0; return d / 0.1; };
  assert.ok(Math.abs(speedAt(0, 'skitterling', on) - sim.UDEF.skitterling.speed * 1.2) < 0.5);
  assert.ok(Math.abs(speedAt(0, 'skitterling', off) - sim.UDEF.skitterling.speed) < 0.5);
  assert.ok(Math.abs(speedAt(0, 'razorwing', on) - sim.UDEF.razorwing.speed) < 0.5, 'aircraft: no bonus');
  assert.ok(sim.onCreep(g, 0, mid.u, mid.v));
  assert.ok(Math.abs(speedAt(1, 'rifle', mid) - sim.UDEF.rifle.speed) < 0.5, 'an enemy on Bloomhost creep: no change');
});

test('regeneration: on creep, out of combat (no damage taken or dealt for 5 s), Bloomhost only; the highest heal applies', () => {
  const g = quiet(); g.nodes[1].owner = 0; g.nodes[1].prog = 100; step(g, 60);
  const hq = g.sides[0].hq, at = (s, type, du) => { const u = sim.spawnUnit(g, s, type, hq.u + du, hq.v + 40); u.holdU = u.u; u.holdV = u.v; u.cd = 1e6; return u; };
  const a = at(0, 'bulwark', 60), b = at(0, 'bulwark', C.hiveR + 120);
  const r = sim.spawnUnit(g, 1, 'rifle', g.nodes[1].u - 60, 0); r.holdU = r.u; r.holdV = 0; r.cd = 1e6; // on the node's creep, away from the Hive's gun
  assert.ok(sim.onCreep(g, 0, r.u, r.v) && !sim.onCreep(g, 0, b.u, b.v));
  for (const u of [a, b, r]) { u.hp = u.maxHp * 0.5; u.lastHurt = g.t; }
  const h0 = [a.hp, b.hp, r.hp];
  step(g, C.calm - 0.5); assert.strictEqual(a.hp, h0[0], 'nothing while still in combat');
  step(g, 4.5);
  const gained = a.hp - h0[0];
  assert.ok(Math.abs(gained - a.maxHp * C.regen * 4) < a.maxHp * C.regen * 0.6, `on creep, out of combat: +${gained.toFixed(1)}`);
  assert.strictEqual(b.hp, h0[1], 'off creep: none'); assert.strictEqual(r.hp, h0[2], 'Last Fist on the creep: none');
  a.lastAct = g.t; const h1 = a.hp; step(g, 2); assert.strictEqual(a.hp, h1, 'attacking counts as combat');
  // never stacks: a Medicopter's faster heal replaces creep regen instead of adding to it
  const sk = at(0, 'skitterling', 40); sk.hp = sk.maxHp * 0.3; sk.lastHurt = sk.lastAct = -99;
  const med = sim.spawnUnit(g, 0, 'medic', sk.u, sk.v); med.holdU = med.u; med.holdV = med.v;
  const s0 = sk.hp; step(g, 2);
  const rate = (sk.hp - s0) / 2 / sk.maxHp;
  assert.ok(Math.abs(rate - Math.max(C.regen, sim.UDEF.medic.heal)) < 0.002, `heal rate ${rate.toFixed(4)}/s`);
});

test('enemy creep: hidden in the fog, remembered only as last seen, forgotten when seen gone; creep grants no vision', () => {
  const g = quiet('lastfist', 'bloomhost'); step(g, 60);
  const F = g.fog[0], hq = g.sides[1].hq, k = 'b' + hq.id;
  assert.ok(g.creep[1].length > 0 && Object.keys(F.creep).length === 0, 'nothing known of it');
  const scout = sim.spawnUnit(g, 0, 'rifle', hq.u - 300, 0); scout.holdU = scout.u; scout.holdV = 0; sim.updateVision(g);
  assert.strictEqual(F.creep[k].r, C.hiveR, 'seen');
  const pit = finish(g, 1, 'barracks'); scout.hp = 0; step(g, 20);
  assert.ok(!F.creep['b' + pit.id], 'new creep out of sight stays unknown');
  // creep gives no vision: the Bloomhost side sees exactly what its units and buildings see
  const vis = Array.from(g.fog[1].vis); g.creep[1].push({ k: 'test', u: L0(), v: 0, r: 2000, R: 2000, node: false }); sim.updateVision(g);
  assert.deepStrictEqual(Array.from(g.fog[1].vis), vis);
  function L0() { return sim.L / 2; }
  // a remembered patch seen empty is forgotten
  g.creep[1] = g.creep[1].filter(p => p.k !== k && p.k !== 'test');
  const s2 = sim.spawnUnit(g, 0, 'rifle', hq.u - 200, 0); s2.holdU = s2.u; s2.holdV = 0; sim.updateVision(g);
  assert.ok(!F.creep[k]);
});

test('saves keep creep and the remembered enemy creep; a v17 save starts with none and grows it', () => {
  const g = quiet('bloomhost', 'bloomhost'); step(g, 20);
  g.fog[0].creep.x = { u: sim.L - 40, v: 2, r: 3 }; // out of side 0's sight
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.strictEqual(JSON.stringify(g2.creep), JSON.stringify(g.creep));
  assert.deepStrictEqual({ ...g2.fog[0].creep.x }, { u: sim.L - 40, v: 2, r: 3 });
  step(g2, 5); assert.ok(g2.creep[0][0].r > g.creep[0][0].r);
  const o = JSON.parse(sim.serialize(g, {})); o.v = 17; delete o.creep; for (const f of o.fog) delete f.creep;
  for (const e of o.ents) { delete e.lastHurt; delete e.lastAct; delete e.creepAt; }
  const g3 = sim.deserialize(JSON.stringify(o));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(g3.creep)), [[], []]);
  step(g3, 5);
  assert.ok(g3.creep[0].length && g3.creep[0].every(p => p.r > 0 && p.r <= C.grow * 5 + 1), 'grows from nothing');
  assert.strictEqual(sim.SAVE_VER, 18);
});
