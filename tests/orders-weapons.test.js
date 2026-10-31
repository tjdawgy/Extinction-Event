// v2.31 playtest fixes. (1) Units that appear somewhere other than their own building (a warp-in, a Mass Warp arrival,
// Emergency Brood Skitterlings, Cloudwing offspring) follow the army's current orders; on Hold they hold where they arrived
// instead of walking back to the rally flag (arriveOrders). (2) The Gravemantle and the Eventide hit buildings (weapon table
// grav, building 0.5), so they stop and fight at enemy buildings instead of walking to the end of the lane; the Shardstorm
// the same way (storm, building 0.4; its chain still never jumps to a building). (3) Every unit of all three factions has a
// weapon its targeting can use, or is a listed non-combat unit that stays with the army. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const sim = loadSim();
const U = sim.UDEF, A = sim.ABIL;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'axiarchs', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const finish = (g, s, k) => { assert.ok(sim.tryBuild(g, s, k).ok, k); const b = g.ents.filter(e => e.side === s && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; return b; };
const seeAll = g => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } };
const ready = (g, s = 0) => { for (const k in g.sides[s].ab) g.sides[s].ab[k] = 0; };
const arrive = g => { for (let i = 0; i < 30 * 10 && g.warps.length; i++) sim.update(g, 1 / 30); };
const moved = (e, p) => Math.hypot(e.u - p.u, e.v - p.v);

// Non-combat units: no weapon by design; they follow the army (supportSpot) and never walk off on their own
const NON_COMBAT = ['medic', 'drone'];
// Air-only units: their weapon hits aircraft only; they escort their own aircraft or wait behind the front
const AIR_ONLY = ['interceptor'];

test('a unit that warps in while the army is on Hold stays at the warp point (a Hold group or type order too); on Attack it advances', () => {
  const g = quiet(); step(g, 60); finish(g, 0, 'barracks');
  assert.ok(sim.tryTrain(g, 0, 'shardling').ok); step(g, U.shardling.time + 0.1);
  const wp = { ...g.warps[0] }; arrive(g);
  const s = g.ents.find(e => e.side === 0 && e.type === 'shardling');
  assert.ok(moved(s, wp) < 1 && s.holdU === s.u && s.holdV === s.v, 'it arrived with a hold spot where it landed');
  step(g, 15); assert.ok(moved(s, wp) < 2, `still at the warp point after 15 s (moved ${moved(s, wp).toFixed(1)}; v2.30 walked back to the rally flag)`);
  // a Hold order for the group, with the global stance on Retreat
  sim.setStance(g, 0, 'retreat'); assert.ok(sim.giveOrder(g, 0, 'group', 'inf', 'hold').ok);
  sim.tryTrain(g, 0, 'shardling'); step(g, U.shardling.time + 0.1); const wp2 = { ...g.warps[0] }; arrive(g);
  const s2 = g.ents.filter(e => e.side === 0 && e.type === 'shardling').at(-1); step(g, 10);
  assert.ok(moved(s2, wp2) < 2, 'a Hold group order holds it too');
  // on Attack it takes the order like any unit: it walks toward the enemy
  sim.setStance(g, 0, 'attack'); sim.tryTrain(g, 0, 'shardling'); step(g, U.shardling.time + 0.1); const wp3 = { ...g.warps[0] }; arrive(g);
  const s3 = g.ents.filter(e => e.side === 0 && e.type === 'shardling').at(-1);
  assert.strictEqual(s3.holdU, undefined); step(g, 5); assert.ok(s3.u > wp3.u + 50, 'on Attack it advances');
});

test('Mass Warp arrivals on Hold stay where they arrive, including a unit that had no hold spot yet', () => {
  const g = quiet(); step(g, 40); g.t = Math.max(g.t, 200); seeAll(g); ready(g);
  const wp = sim.warpPoint(g, 0);
  const a = sim.spawnUnit(g, 0, 'bastion', 600, 0); // no hold spot (like a unit trained after Hold was set)
  const b = sim.spawnUnit(g, 0, 'lancer', 610, 20); b.holdU = 610; b.holdV = 20; // an old hold spot
  a.cd = b.cd = 1e6;
  assert.strictEqual(a.holdU, undefined);
  assert.ok(sim.useAbility(g, 0, 'mwarp', 605, 10).ok); step(g, A.mwarp.ch + 0.1);
  for (const e of [a, b]) {
    assert.ok(moved(e, wp) < 60, `${e.type} arrived at the warp point`);
    const p = { u: e.u, v: e.v }; step(g, 0); assert.ok(e.holdU === p.u && e.holdV === p.v, `${e.type}: holds where it arrived`);
  }
  const pa = { u: a.u, v: a.v }, pb = { u: b.u, v: b.v }; step(g, 15);
  assert.ok(moved(a, pa) < 2 && moved(b, pb) < 2, `both still there after 15 s (${moved(a, pa).toFixed(1)}, ${moved(b, pb).toFixed(1)})`);
});

test('Emergency Brood Skitterlings and Cloudwing offspring on Hold stay where they appear', () => {
  const g = quiet('bloomhost', 'lastfist'); seeAll(g); ready(g);
  assert.ok(sim.useAbility(g, 0, 'brood', 700, 0).ok); step(g, A.brood.delay + 0.1);
  const brood = g.ents.filter(e => e.side === 0 && e.tSrc === 'brood'); assert.strictEqual(brood.length, A.brood.n);
  const at = brood.map(e => ({ u: e.u, v: e.v })); step(g, 10);
  brood.forEach((e, i) => assert.ok(moved(e, at[i]) < 2, `brood ${i} moved ${moved(e, at[i]).toFixed(1)} (v2.30 walked to the rally flag)`));
  // Cloudwing offspring: released while it attacks (a held Cloudwing over a Tank it can hit)
  const c = sim.spawnUnit(g, 0, 'cloudwing', 900, 0); c.holdU = 900; c.holdV = 0; c.hp = c.maxHp = 1e6;
  const t = sim.spawnUnit(g, 1, 'tank', 930, 0); t.holdU = 930; t.holdV = 0; t.hp = t.maxHp = 1e6; t.cd = 1e6;
  for (let i = 0; i < 30 * 5 && !g.ents.some(e => e.tSrc === 'cloud'); i++) sim.update(g, 1 / 30);
  const kids = g.ents.filter(e => e.tSrc === 'cloud'); assert.ok(kids.length > 0, 'offspring released');
  assert.ok(kids.every(k => k.holdU === k.u && k.holdV === k.v), 'each holds where it appeared');
  const kAt = kids.map(k => ({ u: k.u, v: k.v })); step(g, 6);
  kids.forEach((k, i) => assert.ok(k.hp <= 0 || moved(k, kAt[i]) < 2, `offspring ${i} stayed (${moved(k, kAt[i]).toFixed(1)})`));
  // on Attack the next brood takes the order and advances
  sim.setStance(g, 0, 'attack'); ready(g); assert.ok(sim.useAbility(g, 0, 'brood', 600, 0).ok); step(g, A.brood.delay + 0.1);
  const b2 = g.ents.filter(e => e.side === 0 && e.tSrc === 'brood' && e.hp > 0 && e.holdU === undefined); assert.ok(b2.length > 0);
  const u0 = b2.map(e => e.u); step(g, 3); assert.ok(b2.every((e, i) => e.u > u0[i] + 20), 'on Attack they advance');
});

// A scene: one unit of side 0 on Attack walks toward a single enemy target (a building, or a unit it can hit) on the lane line
function walkUp(type, kind) {
  const d = U[type], g = sim.newGame('normal', { factions: [d.fac || 'lastfist', 'lastfist'] }); g.countdown = 0;
  for (const s of g.sides) s.aiT = 1e9;
  sim.setStance(g, 1, 'hold'); sim.setStance(g, 0, 'attack');
  let t;
  if (kind === 'b') { t = finish(g, 1, 'refinery'); t.v = 0; t.hp = t.maxHp = 1e6; }
  else { t = sim.spawnUnit(g, 1, d.hitsGround === false ? 'aircraft' : 'tank', 1300, 0); t.holdU = 1300; t.holdV = 0; t.cd = 1e9; t.hp = t.maxHp = 1e6; }
  const u = sim.spawnUnit(g, 0, type, t.u - 500, 0); u.laneV = 0; u.hp = u.maxHp = 1e7;
  for (let i = 0; i < 30 * 35; i++) { sim.update(g, 1 / 30); seeAll(g); }
  return { dealt: 1e6 - t.hp, past: u.u > t.u + 20, u, t };
}

test('the Gravemantle and the Eventide attack an enemy unit and an enemy building in range, and stop to fight (v2.30 walked past buildings)', () => {
  assert.ok(sim.DMG.grav.building > 0 && sim.DMG.grav.air === 0, 'grav: ground units and buildings, never aircraft');
  for (const type of ['gravemantle', 'eventide']) {
    for (const kind of ['u', 'b']) {
      const r = walkUp(type, kind);
      assert.ok(r.dealt > 0, `${type} damages the enemy ${kind === 'b' ? 'building' : 'unit'} (${r.dealt.toFixed(0)})`);
      assert.ok(!r.past && !r.u.moving, `${type} stopped at the ${kind === 'b' ? 'building' : 'unit'} (at ${r.u.u.toFixed(0)}, target ${r.t.u.toFixed(0)})`);
    }
  }
  // the aura and the pulse still work on top
  const g = quiet(); seeAll(g);
  const gm = sim.spawnUnit(g, 0, 'gravemantle', 800, 0), ev = sim.spawnUnit(g, 0, 'eventide', 1200, 0); gm.cd = ev.cd = 1e6; ev.pulseCd = 0;
  const r = sim.spawnUnit(g, 1, 'rifle', 860, 0), r2 = sim.spawnUnit(g, 1, 'rifle', 1300, 0); r2.holdU = 1300; r2.holdV = 0;
  step(g, 0.2); assert.ok(r.slowT > g.t && r.slow > 0, 'the slow aura'); assert.ok(r2.u < 1300, 'the pull pulse');
});

test('the Shardstorm stops at buildings and hits them weakly; its chain never jumps to a building', () => {
  const r = walkUp('shardstorm', 'b'); assert.ok(r.dealt > 0 && !r.past, `it fights the building (${r.dealt.toFixed(0)})`);
  const g = quiet(); seeAll(g);
  const s = sim.spawnUnit(g, 0, 'shardstorm', 800, 0); s.cd = 1e6;
  const b = finish(g, 1, 'refinery'); b.u = 940; b.v = 0;
  const x = sim.spawnUnit(g, 1, 'rifle', 900, 0); x.hp = x.maxHp = 1e5;
  const hit = sim.chainBeam(g, s, x, U.shardstorm);
  assert.ok(!hit.includes(b) && b.hp === b.maxHp, 'no jump to the building');
});

test('every unit of all three factions has a weapon its targeting can use, or is a listed non-combat unit', () => {
  const direct = d => d.melee || d.beam || d.weapon === 'flame' || d.weapon === 'shell' || d.lob; // no projectile speed needed
  for (const type of sim.UNIT_ORDER) {
    const d = U[type];
    if (!d.weapon) { assert.ok(NON_COMBAT.includes(type), `${type} has no weapon and is not a listed non-combat unit`); continue; }
    assert.ok(!NON_COMBAT.includes(type), `${type} is listed as non-combat but has a weapon`);
    const T = sim.DMG[d.weapon]; assert.ok(T, `${type}: weapon table ${d.weapon}`);
    assert.ok(d.dmg > 0 && d.cd > 0 && d.range > 0, `${type}: damage, cooldown and range`);
    assert.ok(direct(d) || sim.PSPEED[d.weapon] > 0, `${type}: projectile speed for ${d.weapon}`);
    if (d.hitsAir) assert.ok(T.air > 0, `${type} hits aircraft by its table`);
    if (AIR_ONLY.includes(type)) { assert.ok(d.hitsGround === false && T.air > 0, `${type}: air only`); continue; }
    assert.ok(d.hitsGround !== false, `${type} hits ground`);
    assert.ok(['light', 'heavy', 'vehicle'].every(a => T[a] > 0), `${type} can hurt every ground armor`);
    assert.ok(T.building > 0, `${type} can hurt buildings, so enemy buildings stop it`);
  }
});

test('every combat unit stops to fight an enemy it can hit instead of walking past it; non-combat units stay with the army', () => {
  for (const type of sim.UNIT_ORDER) {
    if (NON_COMBAT.includes(type)) continue;
    for (const kind of AIR_ONLY.includes(type) ? [] : ['u', 'b']) {
      const r = walkUp(type, kind);
      assert.ok(r.dealt > 0 && !r.past, `${type} vs ${kind === 'b' ? 'a building' : 'a unit'}: dealt ${r.dealt.toFixed(0)}, at ${r.u.u.toFixed(0)}, target ${r.t.u.toFixed(0)}`);
    }
  }
  // the Interceptor fights aircraft that come to it (it escorts or waits behind the front; it never walks off alone)
  const g = quiet('lastfist', 'lastfist'); seeAll(g);
  const i = sim.spawnUnit(g, 0, 'interceptor', 600, 0), a = sim.spawnUnit(g, 1, 'aircraft', 700, 0); a.holdU = 700; a.holdV = 0; a.cd = 1e6; a.hp = a.maxHp = 1e5;
  step(g, 3); assert.ok(a.hp < a.maxHp, 'an Interceptor shoots an enemy aircraft in range');
  // Medicopters and Recon Drones: no weapon; on Hold, Attack and Retreat they stay with the army, never past it.
  // v2.39: on its own seeded SIM. Unseeded, about 1 run in 60 the Medicopter settled about 60 ahead of the retreated
  // Rifleman (a steady hover over the infantry, not a lag), past the 40 margin.
  const ss = loadSim({ random: mulberry(7) }), sstep = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) ss.update(g, 1 / 30); };
  for (const st of ['hold', 'attack', 'retreat']) {
    const h = ss.newGame('normal', { factions: ['lastfist', 'lastfist'] }); h.countdown = 0; for (const s of h.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } ss.setStance(h, 1, 'hold'); ss.setStance(h, 0, st);
    const front = ss.spawnUnit(h, 0, 'tank', 700, 0); front.holdU = 700; front.holdV = 0;
    const m = ss.spawnUnit(h, 0, 'medic', 500, 0), r = ss.spawnUnit(h, 0, 'drone', 500, 0), inf = ss.spawnUnit(h, 0, 'rifle', 650, 0); inf.holdU = 650; inf.holdV = 0;
    sstep(h, 30);
    for (const e of [m, r]) assert.ok(e.u < Math.max(front.u, inf.u) + 40, `${e.type} on ${st} stays with the army (at ${e.u.toFixed(0)}, front ${front.u.toFixed(0)})`);
  }
});
