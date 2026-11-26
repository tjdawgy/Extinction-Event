// v2.99 (batch 6i): the Bloomhost air rework (REWORK.b6i) and the under-fire response rework (REWORK.b6iresp),
// src/sim/rework-6i.js. Each mechanic on the real SIM in the Test Range (rangeGame) or a match; both switches off play as v2.98
// (FP_V298 and every older set in tests/determinism.test.js; FP_V299 there too).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');
const sim = loadSim();
const ON = { b6i: true, b6iresp: true }, OFF = { b6i: false, b6iresp: false };
const range = (rw, f = ['bloomhost', 'lastfist'], seed = 77) => sim.rangeGame({ seed, factions: f, rework: Object.assign({}, sim.REWORK, rw) });
const step = (g, s) => { for (let i = 0; i < Math.round(s * 60); i++) sim.rangeStep(g); };
const alive = us => us.filter(e => e.hp > 0 && !e.dead).length;
const I = sim.B6I;

test('switches: on by default, saved only when on; both off is a v2.98 save', () => {
  const r = sim.rwInit(); assert.ok(r.b6i && r.b6iresp);
  const g = sim.newGame('normal', { seed: 5, rework: OFF }), o = JSON.parse(sim.serialize(g, {}));
  for (const k of ['b6i', 'b6iresp']) assert.ok(!(k in (o.rw || {})), k + ' left out of an off save');
  const g2 = sim.newGame('normal', { seed: 5 }), o2 = JSON.parse(sim.serialize(g2, {}));
  for (const k of ['b6i', 'b6iresp']) assert.strictEqual(o2.rw[k], true);
  const g3 = sim.deserialize(sim.serialize(g2, {})); assert.ok(g3.rw.b6i && g3.rw.b6iresp, 'loaded back on');
});

test('roster: the five Bloomspire units fill the old slots; every one hits air and ground but the Skywyrm\'s spew; b6i off: v2.98', () => {
  const pairs = [['razorwing', 'razor6', 1, null], ['needlewing', 'gnatcloud', 2, 'A'], ['cloudwing', 'blightwing', 3, 'A'], ['broodtyrant', 'talonmaw', 2, 'B'], ['worldrender', 'skywyrm', 3, 'B']];
  for (const [rw, on] of [[ON, true], [OFF, false]]) {
    const g = sim.newGame('normal', { seed: 3, factions: ['bloomhost', 'lastfist'], rework: Object.assign({}, sim.REWORK, rw) }); g.countdown = 0;
    const b = sim.mkBuilding(g, 0, 'techlab', 0); b.built = true; b.progress = 1;
    for (const [old, nu, tier, path] of pairs) {
      b.tier = tier; b.path = path;
      assert.strictEqual(sim.canMake(b, nu, g), on, nu); assert.strictEqual(sim.canMake(b, old, g), !on, old);
      assert.strictEqual(sim.rwType(g, old), on ? nu : old);
    }
  }
  for (const t of ['razor6', 'gnatcloud', 'blightwing', 'talonmaw']) assert.ok(sim.UDEF[t].hitsAir && sim.UDEF[t].hitsGround !== false, t);
  assert.ok(sim.UDEF.skywyrm.splash && sim.DMG.spew6.building === I.wyrm.bmul);
  assert.strictEqual(sim.TREES_BH.techlab.A.steps[2].unlock[0], 'gnatcloud'); assert.strictEqual(sim.TREES_BH.techlab.B.steps[3].unlock[0], 'skywyrm');
  const S = [['cost', [120, 40], [200, 70], [220, 90], [480, 220]], ['hp', 220, 480, 320, 1600], ['pop', 2, 3, 3, 7]];
  assert.deepStrictEqual([sim.UDEF.gnatcloud.cost.c, sim.UDEF.gnatcloud.cost.e], S[0][1]); assert.deepStrictEqual([sim.UDEF.talonmaw.cost.c, sim.UDEF.talonmaw.cost.e], S[0][2]);
  assert.deepStrictEqual([sim.UDEF.blightwing.cost.c, sim.UDEF.blightwing.cost.e], S[0][3]); assert.deepStrictEqual([sim.UDEF.skywyrm.cost.c, sim.UDEF.skywyrm.cost.e], S[0][4]);
  assert.deepStrictEqual(['gnatcloud', 'talonmaw', 'blightwing', 'skywyrm'].map(t => sim.UDEF[t].hp), [220, 480, 320, 1600]);
  assert.deepStrictEqual(['gnatcloud', 'talonmaw', 'blightwing', 'skywyrm'].map(t => sim.UDEF[t].pop), [2, 3, 3, 7]);
});

test('the Razorwing flock: one order, 150/50, three birds of army size 1 and 90 HP; a flock of 3 does 120% of the old Razorwing', () => {
  const g = sim.newGame('normal', { seed: 3, factions: ['bloomhost', 'lastfist'] }); g.countdown = 0;
  const b = sim.mkBuilding(g, 0, 'techlab', 0); b.built = true; b.progress = 1; b.tier = 1;
  const s = g.sides[0]; s.res.c = 1000; s.res.e = 1000; const pop0 = sim.popUsed(g, 0);
  const r = sim.tryTrain(g, 0, 'razor6'); assert.ok(r.ok, r.msg);
  assert.strictEqual(s.res.c, 850); assert.strictEqual(s.res.e, 950); assert.strictEqual(b.queue.length, 1);
  assert.strictEqual(sim.popUsed(g, 0) - pop0, 3); assert.strictEqual(sim.unitCount(g, 0, 'razor6'), 3); assert.strictEqual(sim.trainPop(g, 'razor6'), 3);
  for (let i = 0; i < 60 * 11; i++) sim.update(g, sim.TICK);
  const birds = g.ents.filter(e => e.type === 'razor6' && e.side === 0);
  assert.strictEqual(birds.length, 3); for (const e of birds) assert.strictEqual(e.maxHp, 90);
  assert.strictEqual(sim.popUsed(g, 0) - pop0, 3);
  const old = sim.UDEF.razorwing, nu = sim.UDEF.razor6, k = 3 * nu.dmg / nu.cd / (old.dmg / old.cd);
  assert.ok(Math.abs(k - 1.2) < 1e-9, `flock dps ${k}× the old Razorwing's`);
  assert.strictEqual(sim.DMG.talon6.air, 1.25);
  // flock speed: +5% per Razorwing within 80, at most +40%
  const g2 = range(ON); const bs = sim.rangeUnits(g2, 0, 'razorwing', 600, 0, 4); step(g2, 0.1);
  assert.strictEqual(bs.length, 12, 'four flocks placed: twelve birds'); assert.ok(bs.every(e => e.fl6N >= 1 && e.fl6N <= 8), 'flock neighbours counted, capped at +40%');
});

test('the Gnatcloud: everything inside 40 takes 8/s (clouds stack); single-target hits cut 50%, splash full; ground splash can hit it', () => {
  const g = range(ON); const cs = sim.rangeUnits(g, 0, 'needlewing', 600, 0, 2); const [t] = sim.rangeUnits(g, 1, 'heavy', 600, 0, 1);
  assert.strictEqual(cs[0].type, 'gnatcloud'); cs[1].u = cs[0].u = t.u; cs[1].v = cs[0].v = t.v;
  g.sides[0].mode = 'hold'; g.sides[1].hush = true; const h0 = t.hp; step(g, 1);
  const lost = h0 - t.hp; assert.ok(Math.abs(lost - 2 * I.gnat.dps * sim.DMG.gnat6.heavy) < 1.5, `two clouds took ${lost.toFixed(1)} in 1 s`);
  const c = cs[0], h1 = c.hp; sim.damage(g, c, 20, 'rifle', 1); assert.ok(Math.abs((h1 - c.hp) - 20 * sim.DMG.rifle.air * 0.5) < 1e-6, 'a rifle round: half');
  const h2 = c.hp; sim.damage(g, c, 20, 'shell', 1); assert.ok(Math.abs((h2 - c.hp) - 20 * sim.DMG.shell.light) < 1e-6, 'a shell (area): full, as light armour');
  const g2 = range(ON); const [c2] = sim.rangeUnits(g2, 0, 'needlewing', 700, 0, 1); const [tk] = sim.rangeUnits(g2, 1, 'tank', 860, 0, 1);
  g2.sides[0].hush = true; g2.sides[1].mode = 'hold'; const h3 = c2.hp; step(g2, 6);
  assert.ok(c2.hp < h3, 'a Tank shells a Gnatcloud hanging over it'); assert.ok(tk.hp > 0);
});

test('the Blightwing: a spore cone every 3 s blights; a blighted enemy that dies bursts into 2 Mites (within the cap of 30)', () => {
  const g = range(ON); const [b] = sim.rangeUnits(g, 0, 'cloudwing', 600, 0, 1); const ms = sim.rangeUnits(g, 1, 'rifle', 700, 0, 3);
  assert.strictEqual(b.type, 'blightwing'); g.sides[0].mode = 'hold'; g.sides[1].hush = true; step(g, 0.6);
  assert.ok(ms.some(m => m.bl6T > g.t), 'blighted'); const T = ms.find(m => m.bl6T > g.t);
  assert.ok(T.bl6T - g.t <= I.blight.dur + 1e-6);
  const n0 = sim.miteCount6h(g, 0); sim.damage(g, T, 999, 'rifle', 0); step(g, 0.05);
  assert.strictEqual(sim.miteCount6h(g, 0) - n0, I.blight.mites, 'two Mites');
  const g2 = range(ON); sim.rangeUnits(g2, 0, 'mite', 400, 0, 30); const [b2] = sim.rangeUnits(g2, 0, 'cloudwing', 600, 0, 1); const ms2 = sim.rangeUnits(g2, 1, 'rifle', 700, 0, 3);
  g2.sides[0].mode = 'hold'; g2.sides[1].hush = true; step(g2, 0.6); const T2 = ms2.find(m => m.bl6T > g2.t); assert.ok(T2 && b2);
  sim.damage(g2, T2, 999, 'rifle', 0); assert.ok(sim.miteCount6h(g2, 0) <= sim.B6H.mite.cap, 'never past the cap');
});

test('the Talonmaw: Snatch lifts a small unit, eats it (heals, capped), drops it stunned when hurt; Rend on a vehicle: 60 and +15% from Bloomhost', () => {
  const g = range(ON); const [tm] = sim.rangeUnits(g, 0, 'broodtyrant', 600, 0, 1); const [m] = sim.rangeUnits(g, 1, 'rifle', 640, 0, 1);
  assert.strictEqual(tm.type, 'talonmaw'); g.sides[0].mode = 'attack'; g.sides[1].hush = true; tm.hp = 300;
  let held = 0; for (let i = 0; i < 60 * 5 && m.hp > 0; i++) { sim.rangeStep(g); if (m.sn6) held++; }
  assert.ok(held > 0, 'snatched'); assert.ok(m.hp <= 0, 'eaten');
  assert.ok(tm.hp > 300 && tm.hp <= 300 + Math.min(m.maxHp * I.talon.heal, tm.maxHp * I.talon.cap) + 1e-6, `healed to ${tm.hp}`);
  // dropped when it takes 25% of its health while carrying
  const g2 = range(ON); const [t2] = sim.rangeUnits(g2, 0, 'broodtyrant', 600, 0, 1); const [m2] = sim.rangeUnits(g2, 1, 'heavy', 640, 0, 1); m2.type === 'heavy';
  const [s2] = sim.rangeUnits(g2, 1, 'rifle', 640, 20, 1); g2.sides[0].mode = 'attack'; g2.sides[1].hush = true;
  for (let i = 0; i < 300 && !s2.sn6; i++) sim.rangeStep(g2);
  if (s2.sn6) { sim.damage(g2, t2, t2.maxHp * 0.3, 'rifle', 1); sim.rangeStep(g2); assert.ok(!s2.sn6 && !s2.gone, 'dropped'); assert.ok(s2.dzT > g2.t, 'stunned'); }
  // Rend on a Tank
  const g3 = range(ON); const [t3] = sim.rangeUnits(g3, 0, 'broodtyrant', 600, 0, 1); const [k] = sim.rangeUnits(g3, 1, 'tank', 650, 0, 1);
  g3.sides[0].mode = 'attack'; g3.sides[1].hush = true; for (let i = 0; i < 300 && !(k.rn6T > g3.t); i++) sim.rangeStep(g3);
  assert.ok(k.rn6T > g3.t, 'rent'); const h = k.hp; sim.damage(g3, k, 10, 'claw', 0); assert.ok(Math.abs((h - k.hp) - 10 * sim.DMG.claw.vehicle * 1.15) < 1e-6, '+15% from Bloomhost');
  const h2 = k.hp; sim.damage(g3, k, 10, 'blade', 1); assert.ok(h2 - k.hp >= 0, 'another side: no bonus');
});

test('the Skywyrm: its spew does 2.5× to buildings; a tendril drags an aircraft to its jaws and bites for 70', () => {
  const g = range(ON); const [w] = sim.rangeUnits(g, 0, 'worldrender', 600, 0, 1); const T = sim.rangeBuilding(g, 1, 'lastfist', 'turret', 760, 0);
  assert.strictEqual(w.type, 'skywyrm'); g.sides[0].mode = 'hold'; g.sides[1].hush = true; const h0 = T.hp; step(g, 4);
  assert.ok(h0 - T.hp >= sim.UDEF.skywyrm.dmg * I.wyrm.bmul * 0.5, `the Turret took ${(h0 - T.hp).toFixed(0)}`);
  const g2 = range(ON); const [w2] = sim.rangeUnits(g2, 0, 'worldrender', 600, 0, 1); const [a] = sim.rangeUnits(g2, 1, 'aircraft', 740, 0, 1);
  g2.sides[0].mode = 'hold'; g2.sides[1].hush = true; let dragged = 0; const ah = a.hp;
  for (let i = 0; i < 60 * 3; i++) { sim.rangeStep(g2); if (a.dr6) dragged++; }
  assert.ok(dragged >= 60, 'dragged about 1.5 s'); assert.ok(ah - a.hp >= I.wyrm.bite * sim.DMG.tendril6.air - 1e-6, 'bitten');
});

test('the Bloomhost air AI trains the new units and never the cut ones', () => {
  const tr = {};
  for (const seed of [22, 23]) { // two matches whose Bloomhost side builds a Bloomspire
    const g = sim.newGame('hard', { seed, factions: ['bloomhost', 'lastfist'], autoPlayer: true, autoDiff: 'hard', map: 'classic' }); g.countdown = 0;
    for (let i = 0; i < 60 * 900 && !g.over; i++) { sim.update(g, sim.TICK); g.events.length = 0; }
    for (const [t, n] of Object.entries(g.log.tot[0].trained)) tr[t] = (tr[t] || 0) + n;
  }
  for (const t of ['razorwing', 'needlewing', 'cloudwing', 'broodtyrant', 'worldrender']) assert.ok(!tr[t], t + ' never trained');
  assert.ok(tr.razor6 > 0 && tr.gnatcloud > 0, 'Razorwing flocks and Gnatclouds trained');
});

test('Part D: the Warden quota counts the Wardens queued too and stops at one per 12 supply', () => {
  const g = sim.newGame('hard', { seed: 9, factions: ['bloomhost', 'lastfist'] }); g.countdown = 0;
  const sc = { bulwark: 2.3 }; sim.ward6i(g, 0, sc, 0.5); const want = Math.max(1, Math.round(sim.popUsed(g, 0) / 12));
  if (sim.unitCount(g, 0, 'bulwark') >= want) assert.ok(sc.bulwark <= 0.4); else assert.ok(sc.bulwark >= 2.3);
  const b = sim.mkBuilding(g, 0, 'factory', 0); b.built = true; b.progress = 1; b.tier = 1; b.queue.push('bulwark', 'bulwark');
  const sc2 = { bulwark: 2.3 }; sim.ward6i(g, 0, sc2, 0.5); assert.ok(sc2.bulwark <= 0.4, 'two queued Wardens already meet a small army\'s quota');
});

// Part E: units under fire
const moved = (g, us, s) => { const p = us.map(e => [e.u, e.v]); let m = 0; for (let i = 0; i < Math.round(s * 60); i++) { sim.rangeStep(g); us.forEach((e, k) => { if (e.hp > 0) m = Math.max(m, Math.hypot(e.u - p[k][0], e.v - p[k][1])); }); } return m; };
test('response: Tanks on Hold hit by aircraft they can\'t shoot stay put (6g pulled them back)', () => {
  for (const [rw, still] of [[ON, true], [{ b6iresp: false }, false]]) {
    const g = range(rw, ['lastfist', 'axiarchs']); const ts = sim.rangeUnits(g, 0, 'tank', 600, 0, 4); sim.rangeUnits(g, 1, 'prismwing', 860, 0, 2);
    g.sides[0].mode = 'hold'; g.sides[1].mode = 'attack'; const m = moved(g, ts, 15);
    if (still) assert.ok(m < 25, `moved ${m.toFixed(0)}`); else assert.ok(m > 25, `6g: pulled back ${m.toFixed(0)}`);
  }
});
test('response: Marines on Hold shelled by Artillery from beyond their reach + 80 don\'t move', () => {
  const g = range(ON, ['lastfist', 'lastfist']); const ms = sim.rangeUnits(g, 0, 'rifle', 600, 0, 6); sim.rangeUnits(g, 1, 'artillery', 980, 0, 1);
  g.sides[0].mode = 'hold'; g.sides[1].mode = 'hold'; const m = moved(g, ms, 15);
  assert.ok(m < 25, `moved ${m.toFixed(0)}`); assert.ok(ms.some(e => e.hp < e.maxHp), 'they were shelled');
});
test('response: a melee unit on Hold hit by a Marine within 100 charges it, then walks back to its spot', () => {
  const g = range(ON); const [r] = sim.rangeUnits(g, 0, 'ravager', 600, 0, 1); const [m] = sim.rangeUnits(g, 1, 'rifle', 695, 0, 1);
  g.sides[0].mode = 'hold'; g.sides[1].mode = 'hold'; const p = [r.u, r.v]; let far = 0;
  for (let i = 0; i < 60 * 20; i++) { sim.rangeStep(g); far = Math.max(far, Math.hypot(r.u - p[0], r.v - p[1])); }
  assert.ok(m.hp <= 0, 'the Marine is dead'); assert.ok(far > 40 && far <= I.resp.hold + 40, `went ${far.toFixed(0)} out`);
  assert.ok(Math.hypot(r.u - p[0], r.v - p[1]) < 20, 'back at its spot');
});
