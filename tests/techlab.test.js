// Tech Lab tree (v2.15): Air Power (Interceptor, Leviathan) or Support (Medicopter, Recon Drone, Nanoweave); the
// reworked Interceptor and its escort, the Leviathan's bombs and building preference, Medicopter healing (never stacking
// with itself or a Repair Pulse), the Recon Drone's sight, cap and spotting, the AI's default paths, saves and v14 migration.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const same = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
function base(nLab = 2) {
  const g = sim.newGame('normal');
  for (const s of [0, 1]) { g.sides[s].aiT = 1e9; g.sides[s].res.c = g.sides[s].res.e = 1e5; }
  g.t = 300;
  for (const k of ['barracks', 'refinery', 'factory', ...Array(nLab).fill('techlab'), 'habitat', 'habitat', 'habitat']) {
    sim.tryBuild(g, 0, k); for (const b of g.ents) if (b.kind === 'b') { b.built = true; b.progress = 1; }
  }
  sim.setStance(g, 0, 'hold');
  return { g, lab: g.ents.filter(e => e.type === 'techlab') };
}
const finishUp = (g, b) => { b.upProg = 0.9999; step(g, 0.2); };
function field() { // no AI, both sides see everything
  const g = sim.newGame('normal');
  for (const s of [0, 1]) { g.sides[s].aiT = 1e9; g.fog[s].exp.fill(1); g.fog[s].vis.fill(1); }
  g.t = 300;
  return g;
}

test('the Tech Lab picks Air Power or Support at T2; Gunships from any Tech Lab; each path unlocks its own units', () => {
  same([sim.TREES.techlab.A.name, sim.TREES.techlab.B.name], ['Air Power', 'Support']);
  same(['interceptor', 'leviathan', 'medic', 'drone'].map(k => sim.UNIT_PATH[k].b + sim.UNIT_PATH[k].p + sim.UDEF[k].tier), ['techlabA2', 'techlabA3', 'techlabB2', 'techlabB2']);
  const { g, lab: [a, b] } = base();
  assert.ok(sim.tryTrain(g, 0, 'aircraft').ok);
  assert.match(sim.tryUpgrade(g, 0, a).msg, /Choose a path/);
  sim.tryUpgrade(g, 0, a, 'A'); sim.tryUpgrade(g, 0, b, 'B'); finishUp(g, a); finishUp(g, b);
  assert.ok(sim.tryTrain(g, 0, 'interceptor').ok && sim.tryTrain(g, 0, 'medic').ok && sim.tryTrain(g, 0, 'drone').ok);
  assert.ok(!sim.tryTrain(g, 0, 'leviathan').ok, 'Leviathan needs Air Power T3');
  assert.ok(a.queue.includes('interceptor') && b.queue.includes('medic') && b.queue.includes('drone') && !a.queue.includes('medic'));
  sim.tryUpgrade(g, 0, a); finishUp(g, a);
  assert.ok(sim.tryTrain(g, 0, 'leviathan').ok);
});

test('Nanoweave only on Support T3: Air Power T3 gives no buff', () => {
  const { g, lab: [a, b] } = base();
  sim.tryUpgrade(g, 0, a, 'A'); finishUp(g, a); sim.tryUpgrade(g, 0, a); finishUp(g, a);
  step(g, 0.1); assert.strictEqual(g.sides[0].buff, false, 'Air Power T3: no Nanoweave');
  sim.tryUpgrade(g, 0, b, 'B'); finishUp(g, b); step(g, 0.1); assert.strictEqual(g.sides[0].buff, false, 'Support T2: not yet');
  sim.tryUpgrade(g, 0, b); finishUp(g, b); step(g, 0.1); assert.strictEqual(g.sides[0].buff, true, 'Support T3: Nanoweave');
  b.hp = 0; step(g, 0.1); assert.strictEqual(g.sides[0].buff, false, 'lost with the building');
});

test('Interceptor rework: 150/60, 190 HP, speed 100, still air-only; with no air target it escorts your Leviathan', () => {
  const d = sim.UDEF.interceptor;
  same([d.cost.c, d.cost.e, d.hp, d.speed, d.hitsGround, sim.DMG.flak.air], [150, 60, 190, 100, false, 1.8]);
  const g = field(); sim.setStance(g, 0, 'attack');
  const lev = sim.spawnUnit(g, 0, 'leviathan', 900, 40), it = sim.spawnUnit(g, 0, 'interceptor', 500, 0);
  lev.hp = lev.maxHp = 1e6; g.sides[0].orders.types.leviathan = { o: 'hold', n: 99, t: 0 }; lev.holdU = 900; lev.holdV = 40;
  step(g, 6);
  assert.ok(Math.abs(it.u - (lev.u - 12)) < 6 && Math.abs(it.v - lev.v) < 20, `escorting: ${it.u.toFixed(0)},${it.v.toFixed(0)} vs ${lev.u.toFixed(0)},${lev.v}`);
});

test('Leviathan: bombs what is right below it (40 range), splash 60, 2× on buildings, prefers buildings, cannot hit air, obeys the HQ shield', () => {
  const d = sim.UDEF.leviathan;
  same([d.cost.c, d.cost.e, d.pop, d.hp, d.dmg, d.cd, d.range, d.splash, d.hitsAir], [480, 240, 7, 1400, 140, 3, 40, 60, false]);
  same([sim.DMG.bomb.building, sim.DMG.bomb.vehicle, sim.DMG.bomb.heavy, sim.DMG.bomb.light, sim.DMG.bomb.air], [2, 1, 0.8, 0.6, 0]);
  const g = field(); sim.tryBuild(g, 1, 'barracks'); const bar = g.ents.find(e => e.side === 1 && e.type === 'barracks'); bar.built = true; bar.progress = 1; bar.u = 850; bar.v = 0; // mid-field, away from the HQ
  const lv = sim.spawnUnit(g, 0, 'leviathan', bar.u, bar.v);
  const r = sim.spawnUnit(g, 1, 'rifle', bar.u + 10, bar.v); const plane = sim.spawnUnit(g, 1, 'aircraft', bar.u, bar.v);
  const foes = g.ents.filter(e => e.side === 1);
  assert.strictEqual(sim.acquire(g, lv, d, foes).best, bar, 'the building first');
  r.u = bar.u + 200; bar.hp = 0; assert.strictEqual(sim.acquire(g, lv, d, foes).best, null, 'nothing below it; aircraft are not targets');
  bar.hp = bar.maxHp; const h0 = bar.hp; lv.cd = 0; sim.setStance(g, 0, 'hold'); lv.holdU = lv.u; lv.holdV = lv.v;
  step(g, 1.5);
  assert.ok(h0 - bar.hp > 140 * 2 * 0.5 - 1, `bomb hit the Barracks for ${(h0 - bar.hp).toFixed(0)}`);
  assert.strictEqual(plane.hp, plane.maxHp, 'aircraft untouched');
  const hq = g.ents.find(e => e.side === 1 && e.type === 'hq'); sim.refreshShields(g);
  assert.ok(hq.shielded); lv.u = hq.u; lv.holdU = hq.u; lv.v = hq.v; lv.holdV = hq.v; bar.u = 5000; const q0 = hq.hp; step(g, 4);
  assert.strictEqual(hq.hp, q0, 'a shielded HQ takes nothing');
});

test('Medicopter: heals your infantry within 120 at 2.5%/s; several never stack; no vehicles; a Repair Pulse gives the faster heal, not both', () => {
  const g = field(); sim.setStance(g, 0, 'hold');
  const m1 = sim.spawnUnit(g, 0, 'medic', 700, 0), m2 = sim.spawnUnit(g, 0, 'medic', 710, 0);
  for (const m of [m1, m2]) { m.holdU = m.u; m.holdV = m.v; }
  const h = sim.spawnUnit(g, 0, 'heavy', 750, 0), far = sim.spawnUnit(g, 0, 'heavy', 1000, 0), tank = sim.spawnUnit(g, 0, 'tank', 740, 0);
  for (const e of [h, far, tank]) { e.holdU = e.u; e.holdV = e.v; e.hp = e.maxHp * 0.5; }
  step(g, 2);
  assert.ok(Math.abs(h.hp - h.maxHp * (0.5 + 0.025 * 2)) < 1, `2 s of one heal (not two): ${h.hp} of ${h.maxHp}`);
  assert.strictEqual(far.hp, far.maxHp * 0.5, 'out of reach'); assert.strictEqual(tank.hp, tank.maxHp * 0.5, 'infantry only');
  // a Repair Pulse (6%/s) on top: the faster one applies, so 6%/s in all
  g.sides[0].res.c = g.sides[0].res.e = 1e4; g.sides[0].ab = { shield: 0, strike: 0, repair: 0 }; g.sides[0].abEnd = 0;
  const hp0 = h.hp; assert.ok(sim.useAbility(g, 0, 'repair', h.u, h.v).ok); step(g, 2);
  assert.ok(Math.abs(h.hp - hp0 - h.maxHp * 0.06 * 2) < 2, `pulse + Medicopter = 6%/s: +${(h.hp - hp0).toFixed(1)} of ${h.maxHp}`);
  assert.ok(g.log.tot[0].healed > 0, 'the match log counts Medicopter healing');
});

test('Medicopter follows your biggest infantry group; it has no weapon and is never a spotter', () => {
  const g = field(); sim.setStance(g, 0, 'attack');
  for (let i = 0; i < 5; i++) { const r = sim.spawnUnit(g, 0, 'rifle', 1000 + i * 6, 20); r.holdU = r.u; r.holdV = r.v; }
  const lone = sim.spawnUnit(g, 0, 'rifle', 600, 0); lone.holdU = 600; lone.holdV = 0;
  g.sides[0].orders.groups.inf = { o: 'hold', n: 99, t: 0 };
  const m = sim.spawnUnit(g, 0, 'medic', 400, 0);
  step(g, 15);
  assert.ok(Math.abs(m.u - 1000) < 40 && Math.abs(m.v - 20) < 20, `over the group: ${m.u.toFixed(0)},${m.v.toFixed(0)}`);
  assert.strictEqual(m.cd !== undefined, true); assert.strictEqual(sim.UDEF.medic.weapon, null);
});

test('Recon Drone: sight 420, at most 3 (counting those in training), the first choice of spotter, waits just behind the front', () => {
  assert.strictEqual(sim.SIGHT.drone, 420);
  const { g, lab: [, b] } = base();
  sim.tryUpgrade(g, 0, b, 'B'); finishUp(g, b);
  for (let i = 0; i < 3; i++) assert.ok(sim.tryTrain(g, 0, 'drone').ok);
  assert.match(sim.tryTrain(g, 0, 'drone').msg, /At most 3 Recon Drones/);
  step(g, 16); assert.strictEqual(g.ents.filter(e => e.type === 'drone').length, 3);
  assert.ok(!sim.tryTrain(g, 0, 'drone').ok, 'three on the field');
  assert.strictEqual(sim.SPOTTER_PREF ? sim.SPOTTER_PREF[0] : 'drone', 'drone');
  const f = field(); sim.setStance(f, 0, 'attack');
  const t = sim.spawnUnit(f, 0, 'tank', 1000, 0); t.holdU = 1000; t.holdV = 0; f.sides[0].orders.types.tank = { o: 'hold', n: 99, t: 0 };
  const dr = sim.spawnUnit(f, 0, 'drone', 400, 0); step(f, 10);
  assert.ok(Math.abs(dr.u - 970) < 8, `just behind the front: ${dr.u.toFixed(0)}`);
});

test('the AI: Economist and Trickster default to Air Power, Aggressor and Turtle to Support', () => {
  const g = sim.newGame('hard'), b = { type: 'techlab', side: 1, kind: 'b', hp: 1 };
  for (const kind of ['aggressor', 'trickster', 'turtle', 'economist']) {
    const want = kind === 'economist' || kind === 'trickster' ? 'A' : 'B';
    assert.strictEqual(sim.aiPickPath(g, 1, b, sim.rollPersona(kind), []), want, kind);
  }
});

test('saves keep Tech Lab paths; a v14 save migrates (T2 → Air Power, T3 → Support, an upgrade from T1 → Air Power)', () => {
  const { g, lab: [a, b] } = base(3); const c = g.ents.filter(e => e.type === 'techlab')[2];
  sim.tryUpgrade(g, 0, a, 'A'); finishUp(g, a); sim.tryUpgrade(g, 0, b, 'B'); finishUp(g, b); sim.tryUpgrade(g, 0, b); finishUp(g, b); sim.tryUpgrade(g, 0, c, 'B');
  const g2 = sim.deserialize(sim.serialize(g, {})), L2 = g2.ents.filter(e => e.type === 'techlab');
  same(L2.map(e => [e.tier, e.path, e.upPath]), [[2, 'A', null], [3, 'B', null], [1, null, 'B']]);
  const o = JSON.parse(sim.serialize(g, {})); o.v = 14;
  for (const e of o.ents) { if (e.type === 'techlab') { e.path = null; e.upPath = null; } delete e.medAt; }
  const g3 = sim.deserialize(JSON.stringify(o)), L3 = g3.ents.filter(e => e.type === 'techlab');
  same(L3.map(e => [e.tier, e.path, e.upPath]), [[2, 'A', null], [3, 'B', null], [1, null, 'A']]);
  assert.ok(g3.ents.filter(e => e.kind === 'u').every(u => u.medAt === -1));
  step(g3, 0.1); assert.strictEqual(g3.sides[0].buff, true, 'a migrated T3 keeps Nanoweave');
});
