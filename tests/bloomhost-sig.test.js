// Signature buildings, batch 2 (v2.33, docs/SIGNATURE_BUILDINGS.md section 3): the Bloomhost Brood Mound (Mites through the
// temporary-unit system: 2 at T1 and 3 at T2 every 20 s, 30 s life, at most 10, no node capture, no Salvage, the T3 acid
// burst on a kill only and never on buildings) and the Rootheart (creep 1.5× faster and farther, the 15% slow on enemy ground
// units on creep only, T2 regen ×1.5, the T3 edge snare: 1 s, at most 5, 10 s immunity; lost, creep returns to normal), the
// minimal AI, and saves v29. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const U = sim.UDEF, M = sim.MOUND, R = sim.ROOT, C = sim.CREEP, MID = sim.L / 2;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'bloomhost', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; g.t = 30; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; return e; };
const seeAll = g => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } };
const fin = (g, s, type) => { const r = sim.tryBuild(g, s, type); assert.ok(r.ok, r.msg); const b = g.ents.filter(e => e.side === s && e.type === type).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };
const mites = (g, s = 0) => g.ents.filter(e => e.type === 'mite' && e.side === s && e.hp > 0);

test('the Brood Mound and Rootheart: Larva Pit cost, time, HP and upgrades; the Mite: 40% of a Skitterling\'s HP and damage, 120% speed, free and untrainable', () => {
  const B = sim.BDEF_BH;
  for (const k of ['sigA', 'sigB']) assert.deepStrictEqual([B[k].cost, B[k].time, B[k].hp, B[k].up], [B.barracks.cost, B.barracks.time, B.barracks.hp, B.barracks.up], k);
  assert.deepStrictEqual([B.sigA.name, B.sigB.name], ['Brood Mound', 'Rootheart']);
  const m = U.mite, sk = U.skitterling;
  assert.deepStrictEqual([m.hp, m.dmg, m.speed, m.cost.c, m.cost.e, m.hitsAir, m.melee, m.fac], [sk.hp * 0.4, sk.dmg * 0.4, sk.speed * 1.2, 0, 0, false, true, 'bloomhost']);
  assert.ok(sim.DMG.claw.building > 0, 'targets ground units and buildings');
  // completeness: in the unit tables like every other unit, but never on the Train tab
  assert.ok(sim.UNIT_ORDER.includes('mite') && sim.PLURAL.mite === 'Mites' && sim.GROUP_OF.mite === 'inf' && sim.SIGHT.mite > 0);
  const g = quiet(); const mo = fin(g, 0, 'sigA'); mo.tier = 3;
  assert.ok(!sim.canTrain(g, 0, 'mite'), 'never trained'); assert.strictEqual(sim.tryTrain(g, 0, 'mite').ok, false);
});

test('Mites: 2 at T1 and 3 at T2 every 20 s, they expire after 30 s, and living Mites never exceed 10', () => {
  const g = quiet(); const mo = fin(g, 0, 'sigA');
  step(g, M.every - 0.5); assert.strictEqual(mites(g).length, 0, 'the first clutch 20 s after it finishes');
  step(g, 0.6); assert.strictEqual(mites(g).length, 2, 'T1: 2');
  const first = mites(g); assert.ok(first.every(e => e.temp && e.tSrc === 'mite' && Math.abs(e.temp - g.t - M.life) < 0.6));
  assert.strictEqual(sim.popUsed(g, 0), 0, 'no supply');
  mo.tier = 2; step(g, M.every); assert.strictEqual(mites(g).length, 5, 'T2: 3 more');
  step(g, M.life - M.every + 0.1); assert.ok(first.every(e => e.hp <= 0 && e.expired), 'expired after 30 s'); assert.strictEqual(mites(g).length, 3);
  // the cap: with fast clutches and long lives, never more than 10
  M.life = 1e4; let most = 0;
  try { for (let i = 0; i < 6; i++) { step(g, M.every); most = Math.max(most, mites(g).length); } } finally { M.life = 30; }
  assert.strictEqual(most, M.max, `at most ${M.max}`);
  const n0 = mites(g).length; step(g, M.every); assert.strictEqual(mites(g).length, n0, 'at the cap the clutch is skipped');
  // the Mound lost: no more Mites (the living ones live out their time)
  sim.kill(g, mo, 1); for (const e of mites(g)) e.hp = 0; step(g, M.every + 1); assert.strictEqual(mites(g).length, 0);
});

test('Mites follow the army\'s orders, can\'t capture nodes and give no Salvage, Salvage Yard or not; Emergency Brood keeps its own cap', () => {
  const g = quiet('bloomhost', 'lastfist'); seeAll(g); fin(g, 0, 'sigA'); step(g, M.every + 0.1);
  assert.ok(mites(g).every(e => e.holdU !== undefined), 'on Hold they hold where they hatched');
  // capture: Mites alone never move a node
  const n = g.nodes[1]; for (let i = 0; i < 4; i++) { const e = put(g, 0, 'mite', n.u + i * 5, i * 8); e.temp = g.t + 99; e.tSrc = 'mite'; }
  step(g, 5); assert.strictEqual(n.prog, 0); assert.strictEqual(n.owner, null);
  // Salvage: Last Fist with a T3 Salvage Yard kills Mites next to its own units
  const y = fin(g, 1, 'sigA'); y.tier = 3; put(g, 1, 'rifle', n.u + 40);
  const c0 = g.sides[1].salv.tot; for (const e of mites(g)) sim.kill(g, e, 1);
  assert.strictEqual(g.sides[1].salv.tot, c0, 'no Salvage from Mites'); assert.strictEqual(g.sides[1].od, 0, 'and no Overdrive');
  // Emergency Brood's cap (TEMP.max) doesn't count Mites
  for (let i = 0; i < 9; i++) { const e = put(g, 0, 'mite', 300 + i * 4); e.temp = g.t + 99; e.tSrc = 'mite'; }
  g.sides[0].hq.tier = 2; for (const k in g.sides[0].ab) g.sides[0].ab[k] = 0;
  const sk0 = g.ents.filter(e => e.type === 'skitterling' && e.temp).length;
  assert.ok(sim.useAbility(g, 0, 'brood', 400, 0).ok); step(g, sim.ABIL.brood.delay + 0.2);
  assert.strictEqual(g.ents.filter(e => e.type === 'skitterling' && e.temp).length - sk0, sim.ABIL.brood.n, 'a full brood despite 9 Mites');
});

test('the T3 acid burst: a killed Mite bursts (enemy ground units only, never buildings); an expiring one never does; below T3 none', () => {
  const g = quiet(); seeAll(g); const mo = fin(g, 0, 'sigA'); mo.tier = 3;
  const mk = u => { const e = put(g, 0, 'mite', u); e.temp = g.t + 30; e.tSrc = 'mite'; e.cd = 1e6; return e; }; // passive: only the burst counts
  const foe = put(g, 1, 'tank', MID + 20); foe.hp = foe.maxHp = 1e4; const air = put(g, 1, 'aircraft', MID + 10); air.hp = air.maxHp = 1e4; foe.cd = air.cd = 1e6; // passive too (v2.38: the Tank sometimes shot the Mite before it could expire, a flaky test)
  const pad = g.sides[1].slots.findIndex(x => !x); sim.tryBuild(g, 1, 'refinery', pad); const ref = g.ents.find(e => e.side === 1 && e.type === 'refinery'); ref.built = true; ref.hp = ref.maxHp;
  const m1 = mk(MID); sim.kill(g, m1, 1);
  const hit = 1e4 - foe.hp; assert.ok(Math.abs(hit - U.mite.dmg * M.burst * sim.DMG.miteacid.vehicle) < 1e-9, `burst ${hit}`);
  assert.strictEqual(air.hp, 1e4, 'never aircraft'); assert.ok(g.fx.some(f => f.k === 'acidburst'), 'the green burst');
  // a building next to a bursting Mite: untouched
  const m2 = mk(ref.u); const rh = ref.hp; sim.kill(g, m2, 1); assert.strictEqual(ref.hp, rh, 'never buildings');
  // expiry: no burst
  const m3 = mk(MID); m3.temp = g.t + 0.05; const h0 = foe.hp, fx0 = g.fx.filter(f => f.k === 'acidburst');
  step(g, 0.2); assert.ok(m3.hp <= 0 && m3.expired); assert.strictEqual(foe.hp, h0, 'no burst on expiry');
  assert.ok(g.fx.filter(f => f.k === 'acidburst').every(f => fx0.includes(f)), 'and no new burst effect');
  mo.tier = 2; const m4 = mk(MID); const h1 = foe.hp; sim.kill(g, m4, 1); assert.strictEqual(foe.hp, h1, 'T2: no burst');
});

test('Rootheart T1: creep spreads 1.5× faster and reaches 1.5× farther; lost, it returns to its normal reach by the usual recede', () => {
  const run = rh => { const g = quiet(); fin(g, 0, 'barracks'); if (rh) fin(g, 0, 'sigB'); step(g, 5); return g; };
  const a = run(false), b = run(true), hq = g => g.creep[0].find(p => p.k === 'b' + g.sides[0].hq.id);
  assert.ok(Math.abs(hq(b).r / hq(a).r - R.grow) < 0.05, `growth ${hq(b).r} vs ${hq(a).r}`);
  assert.strictEqual(hq(a).R, C.hiveR); assert.strictEqual(hq(b).R, C.hiveR * R.reach);
  const g = run(true); step(g, 90); assert.ok(Math.abs(hq(g).r - C.hiveR * R.reach) < 1e-6, 'reaches 1.5× farther');
  sim.kill(g, g.ents.find(e => e.type === 'sigB'), 1); step(g, 1);
  assert.strictEqual(hq(g).R, C.hiveR, 'normal reach again'); assert.ok(Math.abs(hq(g).r - (C.hiveR * R.reach - C.recede)) < 0.5, 'receding at the usual rate');
  step(g, 30); assert.strictEqual(hq(g).r, C.hiveR, 'back to normal');
});

test('Rootheart: the 15% slow hits only enemy ground units standing on its creep; T2 regen is 1.5× the existing rate', () => {
  const g = quiet(); seeAll(g); fin(g, 0, 'sigB'); g.creep[0] = [{ k: 'x', u: 900, v: 0, r: 100, R: 100, node: false }]; // a fixed patch
  const on = put(g, 1, 'tank', 900), off = put(g, 1, 'tank', 1100), air = put(g, 1, 'aircraft', 900), own = put(g, 0, 'bulwark', 900);
  for (const e of [on, off, air, own]) e.cd = 1e6;
  sim.updateRoots(g);
  assert.ok(on.slowT > g.t && Math.abs(on.slow - R.slow) < 1e-9 && on.slowK === 'creep', 'enemy ground unit on creep: 15%');
  assert.ok(!(off.slowT > g.t), 'off the creep: none'); assert.ok(!(air.slowT > g.t), 'aircraft: none'); assert.ok(!(own.slowT > g.t), 'own units: none');
  // the slow follows the usual rule: a stronger slow (a Gravemantle's 30%) wins; nothing adds up
  sim.slowU(g, on, 0.3, 1); sim.updateRoots(g); assert.ok(Math.abs(on.slow - 0.3) < 1e-9);
  // a unit walking: 15% less ground covered on creep
  const h = quiet(); fin(h, 0, 'sigB'); h.creep[0] = [{ k: 'x', u: 900, v: 0, r: 300, R: 300, node: false }]; sim.setStance(h, 1, 'attack');
  const w = put(h, 1, 'tank', 1000); w.holdU = undefined; w.cd = 1e6; const u0 = w.u; step(h, 1);
  assert.ok(Math.abs((u0 - w.u) - U.tank.speed * (1 - R.slow)) < 1.5, `moved ${u0 - w.u}`);
  // regen: T1 the existing rate, T2 × 1.5
  const r = quiet(); const rh = fin(r, 0, 'sigB'); assert.strictEqual(sim.creepRegen(r, 0), C.regen);
  rh.tier = 2; assert.ok(Math.abs(sim.creepRegen(r, 0) - C.regen * R.regen) < 1e-12);
  r.creep[0] = [{ k: 'x', u: 600, v: 0, r: 200, R: 200, node: false }]; const b = put(r, 0, 'bulwark', 600); b.cd = 1e6; b.hp = b.maxHp / 2; b.lastHurt = b.lastAct = -99;
  r.creep[0][0].R = 200; const hp0 = b.hp; sim.updateCreep(r, 1); r.creep[0] = [{ k: 'x', u: 600, v: 0, r: 200, R: 200, node: false }];
  assert.ok(Math.abs(b.hp - hp0 - b.maxHp * C.regen * R.regen) < 1e-6, `healed ${b.hp - hp0}`);
});

test('Rootheart T3: every 15 s roots snare at most 5 enemy ground units on the creep\'s edge for 1 s (they still attack), then 10 s immunity', () => {
  const g = quiet(); seeAll(g); const rh = fin(g, 0, 'sigB'); rh.tier = 3;
  const patch = () => { g.creep[0] = [{ k: 'x', u: 900, v: 0, r: 120, R: 120, node: false }]; };
  patch(); const edge = [], inner = [];
  for (let i = 0; i < 7; i++) { const e = put(g, 1, 'rifle', 900 + 112 + (i % 2), -30 + i * 10); edge.push(e); } // in the outer 16
  for (let i = 0; i < 2; i++) inner.push(put(g, 1, 'rifle', 900 + i * 10));
  for (const e of [...edge, ...inner]) { e.cd = 1e6; e.holdU = undefined; }
  g.t += 0; sim.updateRoots(g); rh.rt = g.t; patch(); sim.updateRoots(g); // the pulse is due now
  const sn = [...edge, ...inner].filter(e => e.snT > g.t);
  assert.strictEqual(sn.length, R.max, 'at most 5'); assert.ok(sn.every(e => edge.includes(e)), 'only on the outer edge');
  assert.ok(sn.every(e => Math.abs(e.snT - g.t - R.snare) < 1e-9 && Math.abs(e.snImm - g.t - R.imm) < 1e-9));
  assert.ok(g.fx.some(f => f.k === 'roots'), 'the root eruption');
  // snared: no movement, still attacks
  const s0 = sn[0], u0 = s0.u; sim.setStance(g, 1, 'attack'); const target = put(g, 0, 'skitterling', s0.u - 60, s0.v); target.hp = target.maxHp = 1e4; target.cd = 1e6; s0.cd = 0;
  step(g, 0.5); assert.strictEqual(s0.u, u0, 'can\'t move'); assert.ok(target.hp < 1e4, 'still attacks');
  // immune for 10 s: the next pulses skip the snared ones
  for (const e of [...edge, ...inner]) { e.u = edge.includes(e) ? 1012 : e.u; e.v = e.v; }
  rh.rt = g.t; patch(); sim.updateRoots(g);
  assert.ok(sn.every(e => !(e.snT > g.t) || e.snT - g.t <= R.snare - 0.4), 'no re-snare inside 10 s');
  assert.ok(edge.filter(e => !sn.includes(e)).every(e => e.snT > g.t), 'the other two are snared now');
  g.t += R.imm; rh.rt = g.t; patch(); sim.updateRoots(g); assert.ok(sn.filter(e => e.hp > 0 && e.snT > g.t).length > 0, 'after 10 s they can be snared again');
  // below T3: no snares
  const h = quiet(); const r2 = fin(h, 0, 'sigB'); r2.tier = 2; h.creep[0] = [{ k: 'x', u: 900, v: 0, r: 120, R: 120, node: false }]; const e2 = put(h, 1, 'rifle', 1012);
  step(h, R.every + 1); assert.ok(!(e2.snT > 0), 'T2: none');
});

test('the minimal AI (Bloomhost): the Aggressor and Trickster build the Brood Mound, the Turtle and Economist the Rootheart; Mites join its army', () => {
  for (const [persona, want, other] of [['aggressor', 'sigA', 'sigB'], ['turtle', 'sigB', 'sigA']]) {
    const S = loadSim({ random: (() => { let a = 3; return () => (a = (a * 16807) % 2147483647) / 2147483647; })() });
    const g = S.newGame('hard', { factions: ['lastfist', 'bloomhost'], persona }); g.countdown = 0; g.sides[0].aiT = 1e9;
    let at = null, mt = 0; for (let i = 0; i < 30 * 300; i++) { S.update(g, 1 / 30); if (at === null && S.countB(g, 1, want)) at = g.t; mt = Math.max(mt, g.ents.filter(e => e.type === 'mite' && e.side === 1).length); }
    assert.ok(at !== null, `${persona}: ${want}`); assert.strictEqual(S.countB(g, 1, other), 0);
    if (want === 'sigA') assert.ok(mt > 0 && mt <= M.max, `Mites in its army: up to ${mt}`);
  }
});

test('saves v29 keep Mites, the Mound and Rootheart timers and snares; an older save with a stray Bloomhost signature building drops it', () => {
  assert.ok(sim.SAVE_VER >= 29); assert.ok(sim.SAVE_OK.includes(28) && sim.SAVE_OK.includes(29)); // v30 (v2.34) loads the same way
  const g = quiet(); seeAll(g); const mo = fin(g, 0, 'sigA'); const rh = fin(g, 0, 'sigB'); rh.tier = 3; step(g, M.every + 0.5);
  const e = put(g, 1, 'rifle', 900); e.snT = g.t + 0.6; e.snImm = g.t + 9;
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.strictEqual(g2.ents.filter(x => x.type === 'mite').length, 2); assert.strictEqual(g2.ents.find(x => x.type === 'sigA').mt, mo.mt);
  const e2 = g2.ents.find(x => x.id === e.id); assert.strictEqual(e2.snT, e.snT); assert.strictEqual(e2.snImm, e.snImm);
  assert.strictEqual(g2.ents.find(x => x.type === 'sigB').rt, rh.rt);
  const old = g2.ents.filter(x => x.type === 'mite').map(x => x.id);
  step(g2, M.life); const now = g2.ents.filter(x => x.type === 'mite' && x.hp > 0);
  assert.ok(now.length === 2 && now.every(x => !old.includes(x.id)), 'the first two expired on time; the next clutch came on schedule after loading');
  const o = JSON.parse(sim.serialize(g, {})); o.v = 28;
  const g3 = sim.deserialize(JSON.stringify(o)); assert.ok(g3);
  assert.ok(!g3.ents.some(x => x.type === 'sigA' || x.type === 'sigB'), 'a v28 Bloomhost side could not have them: dropped');
  assert.ok(g3.sides[0].slots.every(b => !b || b.hp > 0), 'their pads are free');
  assert.strictEqual(sim.tryBuild(g3, 0, 'sigA').ok, true, 'and it can build one now');
});
