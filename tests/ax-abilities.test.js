// Axiarch commander abilities (v2.28, docs/AXIARCHS.md section 7): Mass Warp, Shield Overcharge and Purification Beam on
// one shared cooldown, with costs, cooldowns and unlocks from their Last Fist counterparts; Mass Warp moves units and never
// creates or removes any; Overcharge never restores health and expires correctly (pause, speed, save and load); the Beam
// skips aircraft and respects the HQ shield; the match log; saves v25 with the v24 migration; the minimal AI (all three
// cast, and every path unit trained, Gravemantle and Eventide included). SIM only (Node); what the player sees of enemy
// casts is in tests/axiarchs-ui.test.js.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const A = sim.ABIL;
const step = (g, secs, dt = 1 / 30) => { for (let i = 0; i < Math.round(secs / dt); i++) sim.update(g, dt); };
const quiet = (f0 = 'axiarchs', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const ready = (g, s = 0) => { for (const k in g.sides[s].ab) g.sides[s].ab[k] = 0; };
const seeAll = g => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } };
const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; return e; };
const grown = () => { const g = quiet(); step(g, 40); g.t = Math.max(g.t, 200); seeAll(g); return g; }; // a grown base field (the warp point at its front)
const units = g => g.ents.filter(e => e.kind === 'u').length;
const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

test('costs, cooldowns and unlocks mirror Last Fist (Mass Warp ↔ Repair Pulse, Overcharge ↔ Emergency Shield, Beam ↔ Orbital Strike); one cast locks all three', () => {
  assert.deepStrictEqual([...sim.FACTIONS.axiarchs.abil], ['mwarp', 'overcharge', 'beam']); assert.ok(sim.FACTIONS.axiarchs.abilities);
  for (const [x, l] of [['mwarp', 'repair'], ['overcharge', 'shield'], ['beam', 'strike']]) {
    assert.strictEqual(A[x].like, l);
    assert.deepStrictEqual([A[x].cost.c, A[x].cost.e, A[x].cd, A[x].first, A[x].req, A[x].reqTier], [A[l].cost.c, A[l].cost.e, A[l].cd, A[l].first, A[l].req, A[l].reqTier], x);
  }
  const g0 = quiet(); assert.deepStrictEqual({ ...g0.sides[0].ab }, { mwarp: 60, overcharge: 60, beam: 120 }, 'first use as Last Fist: 60 s, 60 s, 120 s');
  const g = grown(); ready(g);
  assert.match(sim.abilityCheck(g, 0, 'beam').msg, /needs your Axis T2/);
  g.sides[0].hq.tier = 2;
  const b = put(g, 0, 'bastion', 900, 0);
  for (const [k, cd, u] of [['overcharge', 50, 900], ['mwarp', 50, 900], ['beam', 100, 1500]]) {
    ready(g); const c0 = g.sides[0].res.c, e0 = g.sides[0].res.e;
    assert.ok(sim.useAbility(g, 0, k, u, 0).ok, k);
    assert.deepStrictEqual([c0 - g.sides[0].res.c, e0 - g.sides[0].res.e], [A[k].cost.c, A[k].cost.e], `${k} cost`);
    for (const k2 of ['mwarp', 'overcharge', 'beam']) assert.match(sim.abilityCheck(g, 0, k2).msg, new RegExp(`Shared cooldown: abilities ready in ${cd} s`), `${k} locks ${k2}`);
    assert.strictEqual(g.sides[0].abK, k);
  }
  assert.ok(b.hp > 0);
  g.sides[1].ab = { shield: 0, strike: 0, repair: 0 }; assert.ok(sim.abilityCheck(g, 1, 'shield').ok, 'the other side is not locked');
  assert.match(sim.abilityCheck(g, 0, 'strike').msg, /is not a Axiarchs ability/);
});

test('Mass Warp: up to 8 units (the most damaged first) channel 2 s, then arrive at the warp point; the total unit count never changes', () => {
  const g = grown(); ready(g);
  const wp = sim.warpPoint(g, 0), home = sim.hqU(0);
  assert.ok(sim.onField(g, 0, wp.u, wp.v) && wp.u > home + 150, `the warp point is at the front of a grown field (${JSON.stringify(wp)})`);
  const mine = []; for (let i = 0; i < 11; i++) { const e = put(g, 0, i % 3 ? 'shardling' : 'bastion', 800 + (i % 4) * 14, -40 + Math.floor(i / 4) * 30); e.cd = 1e6; e.hp = e.maxHp * (0.2 + i * 0.07); mine.push(e); }
  const air = put(g, 0, 'wraithwing', 810, 0); air.hp = 5; air.cd = 1e6;
  const foe = put(g, 1, 'tank', 860, 60); foe.cd = 1e6; foe.hp = foe.maxHp = 1e6;
  assert.match(sim.abilityCheck(g, 0, 'mwarp', 1150, 0).msg, /needs your units inside the circle/);
  const n0 = units(g), pick = sim.mwarpPick(g, 0, 820, 0);
  assert.strictEqual(pick.length, 8, 'at most 8'); assert.strictEqual(pick[0], air, 'the most damaged first');
  assert.ok(sim.useAbility(g, 0, 'mwarp', 820, 0).ok); assert.strictEqual(units(g), n0, 'the cast creates nothing');
  const a = g.abil.find(x => x.k === 'mwarp'); assert.strictEqual(JSON.stringify(a.ids), JSON.stringify(pick.map(e => e.id)));
  pick[3].hp = 0; // one of them dies during the channel
  const at = new Map(g.ents.filter(e => e.kind === 'u').map(e => [e.id, [e.u, e.v]]));
  for (let i = 0; i < Math.round(A.mwarp.ch * 30) - 2; i++) { sim.update(g, 1 / 30); assert.ok(units(g) <= n0); }
  assert.ok(pick.every(e => e.hp <= 0 || Math.abs(e.u - at.get(e.id)[0]) < 30), 'nothing moves before the channel ends');
  step(g, 0.2);
  assert.strictEqual(units(g), n0 - 1, 'only the unit killed during the channel is gone');
  const moved = pick.filter(e => e.hp > 0);
  for (const e of moved) assert.ok(Math.hypot(e.u - wp.u, e.v - wp.v) < 80 && sim.onField(g, 0, e.u, e.v), `${e.type} arrived at the warp point (${e.u.toFixed(0)}, ${e.v.toFixed(0)})`);
  for (let i = 0; i < moved.length; i++) for (let j = i + 1; j < moved.length; j++) assert.ok(Math.hypot(moved[i].u - moved[j].u, moved[i].v - moved[j].v) >= sim.WARP.step - 1e-6, 'never on top of each other');
  for (const e of mine) if (!pick.includes(e)) assert.ok(Math.abs(e.u - at.get(e.id)[0]) < 30, 'units left out stay where they were');
  assert.ok(Math.abs(foe.u - at.get(foe.id)[0]) < 1, 'enemies never move');
  assert.strictEqual(new Set(g.ents.map(e => e.id)).size, g.ents.length, 'no duplicates');
  sim.finish(g, 0, 'hq'); // the log fills in a cast's effect at the side's next cast or the end of the match, as for the other factions
  assert.match(sim.logText(g, { version: sim.VERSION, diff: 'Normal', persona: 'x', result: 'x' }), /Mass Warp: 7 units warped/);
});

test('Mass Warp never changes the total unit count (random casts, deaths, a field too small to land in, saves mid-channel)', () => {
  const S = loadSim({ random: mul(11) }), rnd = mul(5);
  for (let r = 0; r < 12; r++) {
    const g = S.newGame('normal', { factions: ['axiarchs', 'lastfist'] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; }
    S.setStance(g, 0, 'hold'); S.setStance(g, 1, 'hold'); for (let i = 0; i < 30 * (r % 3 ? 40 : 1); i++) S.update(g, 1 / 30); g.t = Math.max(g.t, 200); // r % 3 === 0: a tiny field (the Axis fallback)
    for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); }
    const types = ['shardling', 'bastion', 'wraithwing', 'lancer', 'riftstalker'];
    for (let i = 0; i < 4 + Math.floor(rnd() * 12); i++) { const e = S.spawnUnit(g, 0, types[Math.floor(rnd() * types.length)], 500 + rnd() * 1000, (rnd() - 0.5) * 200); e.hp *= 0.1 + rnd() * 0.9; }
    for (let i = 0; i < 6; i++) S.spawnUnit(g, 1, 'rifle', 700 + rnd() * 900, (rnd() - 0.5) * 200);
    const count = gg => gg.ents.filter(e => e.kind === 'u' && e.hp > 0).length + gg.ents.filter(e => e.kind === 'u' && e.hp <= 0).length;
    let gg = g, casts = 0;
    for (let k = 0; k < 6; k++) {
      for (const kk in gg.sides[0].ab) gg.sides[0].ab[kk] = 0;
      const t = gg.ents.filter(e => e.kind === 'u' && e.side === 0 && e.hp > 0)[0]; if (!t) break;
      const n0 = count(gg), ids0 = new Set(gg.ents.filter(e => e.kind === 'u').map(e => e.id)), killed = [];
      if (!S.useAbility(gg, 0, 'mwarp', t.u, t.v).ok) continue; casts++;
      if (k % 2) gg = S.deserialize(S.serialize(gg, {})); // a save in the middle of the channel
      for (let i = 0; i < 75; i++) {
        S.update(gg, 1 / 30);
        const now = gg.ents.filter(e => e.kind === 'u');
        for (const e of now) assert.ok(ids0.has(e.id), 'no new unit');
        for (const id of ids0) if (!now.some(e => e.id === id)) killed.push(id);
      }
      const after = gg.ents.filter(e => e.kind === 'u');
      assert.ok(after.every(e => ids0.has(e.id)), `round ${r}: Mass Warp created a unit`);
      assert.strictEqual(after.length + new Set(killed).size, n0, `round ${r}: every unit is either still there or was killed in combat`);
      assert.ok(count(gg) <= n0);
    }
    assert.ok(casts > 0);
  }
});

test('Shield Overcharge: faster shield regen even under fire, less damage (capped with the brace), never health; expires after 7 s', () => {
  const g = grown(); ready(g);
  const b = put(g, 0, 'bastion', 800, 0), far = put(g, 0, 'bastion', 1000, 0), s = put(g, 0, 'shardling', 810, 20); b.cd = far.cd = s.cd = 1e6;
  const r = put(g, 1, 'rifle', 820, 0); r.cd = 1e6; // an enemy in the circle: never overcharged
  for (const e of [b, s, far]) { e.hp = e.maxHp * 0.5; e.shp = 0; e.shpT = g.t; } // just hit: normal regen waits 4 s
  const hp0 = [b.hp, s.hp, far.hp];
  assert.ok(sim.useAbility(g, 0, 'overcharge', 800, 0).ok);
  assert.ok(b.ovT > g.t && s.ovT > g.t && !(far.ovT > g.t) && !(r.ovT > g.t));
  step(g, 1);
  assert.ok(Math.abs(b.shp - b.maxShp * A.overcharge.regen) < b.maxShp * 0.02, `30% of its shields in 1 s while just hit: ${b.shp.toFixed(0)}/${b.maxShp}`);
  assert.strictEqual(far.shp, 0, 'outside the circle: the normal delay');
  assert.deepStrictEqual([b.hp, s.hp, far.hp], hp0, 'no health restored');
  // damage: 25% less; with the Bastion's brace (40%) together never more than 50%
  s.shp = 0; let h = s.hp; sim.damage(g, s, 20, 'rifle', 1); const fullS = 20 * sim.DMG.rifle.light;
  assert.ok(Math.abs((h - s.hp) - fullS * (1 - A.overcharge.cut)) < 1e-6, `25% less: ${(h - s.hp).toFixed(2)} of ${fullS}`);
  b.shp = 0; b.braceT = 0; b.braceCd = 0; h = b.hp; sim.damage(g, b, 100, 'cannon', 1); const fullB = 100 * sim.DMG.cannon.vehicle;
  assert.ok(Math.abs((h - b.hp) - fullB * (1 - A.overcharge.cap)) < 1e-6, `braced and overcharged: 50% less, not ${((1 - 0.6 * 0.75) * 100).toFixed(0)}% (${(h - b.hp).toFixed(2)} of ${fullB})`);
  assert.ok(s.hp > 0 && b.hp > 0, 'no invulnerability, but both still standing');
  step(g, A.overcharge.dur - 1 + 0.1);
  assert.ok(!(b.ovT > g.t) && !(s.ovT > g.t), 'over after 7 s');
  b.shp = 0; b.shpT = g.t; step(g, 1); assert.strictEqual(b.shp, 0, 'back to the normal delay once it has expired');
  h = s.hp; s.shp = 0; sim.damage(g, s, 20, 'rifle', 1); assert.ok(Math.abs((h - s.hp) - fullS) < 1e-6, 'full damage again');
  sim.finish(g, 0, 'hq');
  const m = sim.logText(g, { version: sim.VERSION, diff: 'Normal', persona: 'x', result: 'x' }).match(/Shield Overcharge: (\d+) damage blocked, (\d+) shields restored/);
  assert.ok(m && +m[1] > 0 && +m[2] > 0, `logged: ${m && m[0]}`);
});

test('Shield Overcharge expires on game time: paused (no updates) it waits; at 3× speed it ends at the same game time; through save and load', () => {
  const mk = () => { const g = grown(); ready(g); const e = put(g, 0, 'bastion', 800, 0); e.cd = 1e6; assert.ok(sim.useAbility(g, 0, 'overcharge', 800, 0).ok); return [g, e]; };
  const [g1, e1] = mk(), end = e1.ovT; assert.strictEqual(end, g1.t + A.overcharge.dur);
  const t0 = g1.t; // a pause is no SIM updates: the effect is still exactly as long once play resumes
  assert.ok(e1.ovT > g1.t); step(g1, 3); assert.ok(e1.ovT > g1.t && Math.abs(e1.ovT - end) < 1e-9);
  const [g2, e2] = mk(); let at2 = null; // 3× speed: three times the game time per frame (the UI calls update with a larger dt)
  while (!at2) { sim.update(g2, 3 / 30); if (!(e2.ovT > g2.t)) at2 = g2.t - t0; }
  const [g3, e3] = mk(); let at3 = null;
  while (!at3) { sim.update(g3, 1 / 30); if (!(e3.ovT > g3.t)) at3 = g3.t - t0; }
  assert.ok(Math.abs(at2 - A.overcharge.dur) <= 0.1 + 1e-9 && Math.abs(at3 - A.overcharge.dur) <= 1 / 30 + 1e-9, `ends at 7 s of game time: ${at2.toFixed(2)} at 3×, ${at3.toFixed(2)} at 1×`);
  const [g4, e4] = mk(); step(g4, 3);
  const g5 = sim.deserialize(sim.serialize(g4, {})), e5 = g5.ents.find(e => e.id === e4.id);
  assert.strictEqual(e5.ovT, e4.ovT, 'the same expiry after loading'); assert.ok(e5.ovT > g5.t);
  step(g5, A.overcharge.dur - 3 + 0.1); assert.ok(!(e5.ovT > g5.t), 'and it still expires after loading');
});

test('Purification Beam: a warning, then a 1.5 s sweep along the lane; heavy damage once to ground units and buildings; no aircraft; the HQ shield holds', () => {
  const g = grown(); g.sides[0].hq.tier = 2; ready(g);
  assert.match(sim.abilityCheck(g, 0, 'beam', 850, 200).msg, /needs a spot on the lane/);
  g.fog[0].exp.fill(0); g.fog[0].exp[sim.cellOf(300)] = 1; assert.match(sim.abilityCheck(g, 0, 'beam', 850, 0).msg, /needs explored ground/); seeAll(g);
  const ground = [put(g, 1, 'tank', 770, 0), put(g, 1, 'rifle', 850, 30), put(g, 1, 'titan', 940, -30)], air = put(g, 1, 'aircraft', 850, 0), out = put(g, 1, 'tank', 850 + A.beam.len / 2 + 40, 0), wide = put(g, 1, 'tank', 850, A.beam.w + 30);
  for (const e of [...ground, air, out, wide]) { e.cd = 1e6; e.hp = e.maxHp = 5000; }
  assert.ok(sim.useAbility(g, 0, 'beam', 850, 0).ok);
  step(g, A.beam.delay - 0.1); assert.ok(ground.every(e => e.hp === 5000), 'nothing during the warning');
  step(g, 0.5); assert.ok(ground[0].hp < 5000 && ground[2].hp === 5000, 'the sweep starts at the caster\'s end and runs toward the enemy');
  step(g, A.beam.sweep);
  for (const e of ground) assert.strictEqual(5000 - e.hp, A.beam.dmg, `${e.type}: ${A.beam.dmg} once`);
  assert.strictEqual(air.hp, 5000, 'no aircraft'); assert.strictEqual(out.hp, 5000, 'past the end: nothing'); assert.strictEqual(wide.hp, 5000, 'beside the strip: nothing');
  assert.strictEqual(g.abil.filter(a => a.k === 'beam').length, 0, 'over');
  sim.finish(g, 0, 'hq');
  assert.match(sim.logText(g, { version: sim.VERSION, diff: 'Normal', persona: 'x', result: 'x' }), new RegExp(`Purification Beam: ${3 * A.beam.dmg} damage, 0 destroyed`));
});

test('Purification Beam on buildings: it hits a building it crosses; a shielded HQ takes nothing, an exposed one does', () => {
  const g = grown(); g.sides[0].hq.tier = 2; ready(g);
  const hq = g.sides[1].hq; assert.ok(sim.tryBuild(g, 1, 'refinery').ok); const ref = g.ents.find(e => e.side === 1 && e.type === 'refinery'); ref.built = true; ref.progress = 1; ref.hp = ref.maxHp;
  sim.update(g, 1 / 30); assert.ok(hq.shielded, 'the HQ is shielded while the Refinery stands');
  const h0 = hq.hp; ready(g); assert.ok(sim.useAbility(g, 0, 'beam', hq.u, hq.v).ok); step(g, A.beam.delay + A.beam.sweep + 0.1);
  assert.strictEqual(hq.hp, h0, 'a shielded HQ is untouched');
  const r0 = ref.hp; ready(g); assert.ok(sim.useAbility(g, 0, 'beam', ref.u, Math.max(-115, Math.min(115, ref.v))).ok); step(g, A.beam.delay + A.beam.sweep + 0.1);
  assert.ok(r0 - ref.hp >= A.beam.dmg * 0.99, `the Refinery takes the beam: ${(r0 - ref.hp).toFixed(0)}`);
  sim.kill(g, ref, 0); g.ents = g.ents.filter(e => e.hp > 0); sim.update(g, 1 / 30); assert.ok(!hq.shielded, 'exposed');
  ready(g); assert.ok(sim.useAbility(g, 0, 'beam', hq.u, hq.v).ok); step(g, A.beam.delay + A.beam.sweep + 0.1);
  assert.ok(h0 - hq.hp >= A.beam.dmg * 0.99, `an exposed HQ takes it: ${(h0 - hq.hp).toFixed(0)}`);
});

test('saves v25 keep the Axiarch cooldowns, a Mass Warp channel and a Beam in progress; a v24 Axiarch save gets its three abilities', () => {
  const g = grown(); g.sides[0].hq.tier = 2; ready(g);
  const e = put(g, 0, 'shardling', 800, 0); e.cd = 1e6;
  const foe = put(g, 1, 'tank', 900, 0); foe.cd = 1e6; foe.hp = foe.maxHp = 5000;
  assert.ok(sim.useAbility(g, 0, 'mwarp', 800, 0).ok); g.sides[0].ab.beam = 0; g.sides[0].ab.overcharge = 0; g.sides[0].ab.mwarp = 0;
  assert.ok(sim.useAbility(g, 0, 'beam', 900, 0).ok); step(g, 1);
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.deepStrictEqual({ ...g2.sides[0].ab }, { ...g.sides[0].ab }); assert.strictEqual(g2.sides[0].abK, 'beam');
  step(g2, 4); const e2 = g2.ents.find(x => x.id === e.id), f2 = g2.ents.find(x => x.id === foe.id), wp = sim.warpPoint(g2, 0);
  assert.ok(Math.hypot(e2.u - wp.u, e2.v - wp.v) < 80, 'the channel finished after loading'); assert.strictEqual(5000 - f2.hp, A.beam.dmg, 'and the beam swept');
  const o = JSON.parse(sim.serialize(g, {})); o.v = 24; o.sides[0].ab = {}; delete o.sides[0].abK; o.sides[0].abEnd = 0; o.abil = [];
  for (const T of o.log.tot) { delete T.ab.mwarp; delete T.ab.overcharge; delete T.ab.beam; }
  for (const x of o.ents) delete x.ovT;
  const g3 = sim.deserialize(JSON.stringify(o));
  assert.deepStrictEqual({ ...g3.sides[0].ab }, { mwarp: 60, overcharge: 60, beam: 120 }, 'the match schedule: ready now in a save past 2:00');
  assert.ok(g3.ents.filter(x => x.kind === 'u').every(x => x.ovT === 0));
  assert.deepStrictEqual({ ...g3.sides[1].ab }, { ...g.sides[1].ab }, 'Last Fist untouched');
  assert.ok(sim.useAbility(g3, 0, 'overcharge', 800, 0).ok, 'and works after loading');
  assert.ok(sim.SAVE_VER >= 25);
});

test('the AI casts all three under one shared cooldown; Mass Warp only for 4+ units below 40% health in one area', () => {
  const g = grown(); const ctx = { mine: [] };
  const far = []; for (let i = 0; i < 4; i++) { const e = put(g, 0, 'shardling', 1000 + i * 10, 0); far.push(e); }
  ctx.mine = g.ents.filter(e => e.kind === 'u' && e.side === 0);
  far[0].hp = far[0].maxHp * 0.3; far[1].hp = far[1].maxHp * 0.3; far[2].hp = far[2].maxHp * 0.3; far[3].hp = far[3].maxHp * 0.5;
  assert.strictEqual(sim.aiMassWarpTarget(g, 0, ctx), null, '3 hurt: no');
  far[3].hp = far[3].maxHp * 0.39; const t = sim.aiMassWarpTarget(g, 0, ctx);
  assert.ok(t && Math.abs(t.u - 1015) < 20, '4 hurt: there');
  const wp = sim.warpPoint(g, 0); for (const e of far) { e.u = wp.u + 20; e.v = wp.v; }
  assert.strictEqual(sim.aiMassWarpTarget(g, 0, ctx), null, 'not when they are already at the warp point');
  // the AI casts it in that moment (Hard autoplayer side, nothing else worth a cast)
  for (const e of far) { e.u = 1000 + far.indexOf(e) * 10; e.v = 0; e.holdU = e.u; }
  g.autoDiff = 'hard'; ready(g); g.sides[0].aiLog = {};
  sim.aiAbility(g, 0, { kind: 'turtle' }, { mine: ctx.mine, theirs: [], threat: false, myV: 400, thV: 0 });
  assert.strictEqual(g.sides[0].abK, 'mwarp', 'the AI cast Mass Warp'); assert.strictEqual(g.sides[0].aiLog.abil.mwarp, 1);
  step(g, A.mwarp.ch + 0.1); const wp2 = sim.warpPoint(g, 0); assert.ok(far.every(e => Math.hypot(e.u - wp2.u, e.v - wp2.v) < 80), 'and they arrived');
  // seeded Hard matches (Axiarch AI vs the Last Fist autoplayer): every cast respects the shared cooldown, and all three are used
  const used = {};
  for (const [seed, persona] of [[2, 'turtle'], [3, 'aggressor'], [5, 'economist']]) {
    const S = loadSim({ random: mul(seed) });
    const m = S.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona, autoPersona: 'turtle', factions: ['lastfist', 'axiarchs'] });
    let last = null;
    for (let i = 0; i < 30 * 1700 && !m.over; i++) {
      S.update(m, 1 / 30);
      for (const e of m.events) if (e.type === 'ability' && e.side === 1) { if (last) assert.ok(m.t - last.t >= S.ABIL[last.k].cd - 1e-6); last = { t: m.t, k: e.k }; }
      m.events.length = 0;
    }
    for (const k in m.sides[1].aiLog.abil || {}) used[k] = (used[k] || 0) + m.sides[1].aiLog.abil[k];
  }
  for (const k of ['overcharge', 'beam']) assert.ok(used[k] > 0, `${k}: ${JSON.stringify(used)}`); // Mass Warp's moment (4+ units below 40% in one place) did not come up in these three; see above
});

test('the AI trains a Gravemantle and an Eventide on the Dominion path (a prepared T3 Architectum), and a unit of each Genesis Gate path', () => {
  for (const [b, path, want] of [['factory', 'B', ['gravemantle', 'eventide']], ['factory', 'A', ['riftmortar', 'worldbreaker']], ['barracks', 'A', ['riftstalker', 'parallax']], ['barracks', 'B', ['lancer', 'marksman']]]) {
    const S = loadSim({ random: mul(7) });
    const g = S.newGame('hard', { factions: ['lastfist', 'axiarchs'] }); g.countdown = 0; g.sides[0].aiT = 1e9;
    const side = g.sides[1]; side.res.c = side.res.e = 6000;
    const fin = k => { assert.ok(S.tryBuild(g, 1, k).ok, k); const x = g.ents.filter(e => e.side === 1 && e.type === k).at(-1); x.built = true; x.progress = 1; x.hp = x.maxHp; return x; };
    const gate = fin('barracks'); fin('habitat'); fin('habitat'); fin('habitat'); const p = b === 'factory' ? fin('factory') : gate;
    p.tier = 3; p.path = path;
    for (let i = 0; i < 30 * 120; i++) S.update(g, 1 / 30);
    for (const t of want) assert.ok(side.aiLog.trained[t] > 0, `${b} ${path}: trained ${JSON.stringify(side.aiLog.trained)}`);
  }
});
