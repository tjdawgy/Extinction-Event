// Axiarch trees (v2.27): Genesis Gate (Riftwalk / Lattice) and Architectum (Rupture / Dominion); path lock and sell reset;
// phase-step and its cooldown (the Leaper's leap code), the Parallax landing behind its target; disrupt capped, never
// stacking; the Lancer hits aircraft; the Marksman's charge-up; the Rift Mortar's minimum range; distortion zones under the
// acid-pool cap and expiry; the Gravemantle slow never stacking with other slows; the Eventide pull (never into buildings
// or off the lane, never aircraft, on cooldown between pulses); warp-in for path units; saves v24; the AI. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const U = sim.UDEF;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'axiarchs', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const finish = (g, s, k) => { assert.ok(sim.tryBuild(g, s, k).ok, k); const b = g.ents.filter(e => e.side === s && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; return b; };
const upTo = (g, b, path, tier) => { while (b.tier < tier) { assert.ok(sim.tryUpgrade(g, 0, b, path).ok); b.upProg = 0.9999; step(g, 0.2); } };
const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; return e; };
const seeAll = g => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } };

test('Genesis Gate and Architectum: a path at T2 locks the building; T3 deepens it; base units on both; selling resets (the Celestial Array: tests/ax-array.test.js)', () => {
  const g = quiet();
  const gate = finish(g, 0, 'barracks'), arch = finish(g, 0, 'factory'), arr = finish(g, 0, 'techlab'); finish(g, 0, 'habitat'); finish(g, 0, 'habitat');
  assert.strictEqual(sim.TREES_AX.barracks.A.name, 'Riftwalk Doctrine'); assert.strictEqual(sim.TREES_AX.barracks.B.name, 'Lattice Doctrine');
  assert.strictEqual(sim.TREES_AX.factory.A.name, 'Rupture Doctrine'); assert.strictEqual(sim.TREES_AX.factory.B.name, 'Dominion Doctrine');
  assert.match(sim.tryUpgrade(g, 0, gate).msg, /Choose a path/); assert.match(sim.tryUpgrade(g, 0, arr).msg, /Choose a path/); // v2.29
  upTo(g, gate, 'A', 2); assert.ok(sim.tryTrain(g, 0, 'riftstalker').ok && sim.tryTrain(g, 0, 'shardling').ok);
  assert.ok(!sim.tryTrain(g, 0, 'lancer').ok, 'not the other path'); assert.ok(!sim.tryTrain(g, 0, 'parallax').ok, 'T3 needed');
  upTo(g, gate, 'B', 3); assert.strictEqual(gate.path, 'A', 'the path never switches'); assert.ok(sim.tryTrain(g, 0, 'parallax').ok);
  upTo(g, arch, 'B', 3); assert.ok(sim.tryTrain(g, 0, 'gravemantle').ok && sim.tryTrain(g, 0, 'eventide').ok && sim.tryTrain(g, 0, 'bastion').ok); assert.ok(!sim.tryTrain(g, 0, 'riftmortar').ok);
  sim.trySell(g, 0, gate); step(g, 0.1); const g2 = finish(g, 0, 'barracks');
  assert.ok(g2.path === null && g2.tier === 1, 'a rebuilt Genesis Gate is undecided again');
  upTo(g, g2, 'B', 3); assert.ok(sim.tryTrain(g, 0, 'lancer').ok && sim.tryTrain(g, 0, 'marksman').ok);
});

test('phase-step: the Riftstalker steps onto a target 45-130 away, never further, then waits out its cooldown; the Parallax lands behind it', () => {
  const g = quiet(); seeAll(g); sim.setStance(g, 0, 'attack');
  const rs = put(g, 0, 'riftstalker', 600, 0); rs.holdU = undefined; rs.laneV = 0;
  const far = put(g, 1, 'sniper', 900, 0); far.cd = 1e6; far.hp = far.maxHp = 1e5;
  step(g, 0.1); assert.ok(!rs.leaping, 'too far (300): it walks');
  for (let i = 0; i < 30 * 8 && !rs.leaping; i++) sim.update(g, 1 / 30);
  assert.ok(rs.leaping, 'a phase-step once in range'); assert.ok(Math.hypot(rs.lu - rs.u, rs.lv - rs.v) <= U.riftstalker.leap.range + 1);
  for (let i = 0; i < 30 && rs.leaping; i++) sim.update(g, 1 / 30);
  assert.ok(!rs.leaping && rs.leapCd > g.t + U.riftstalker.leap.cd - 1, 'then on cooldown');
  far.u = rs.u + 100; far.v = 0; far.holdU = far.u; step(g, 1); assert.ok(!rs.leaping, 'no second step during the cooldown');
  const p = put(g, 0, 'parallax', 300, 0), t = put(g, 1, 'heavy', 400, 0); p.holdU = undefined; p.laneV = 0; t.cd = 1e6; t.hp = t.maxHp = 1e5;
  for (let i = 0; i < 30 * 4 && !p.leaping; i++) sim.update(g, 1 / 30);
  assert.ok(p.leaping && p.lu > t.u, 'the Parallax lands just behind its target (beyond it, away from where it started)');
});

test('disrupt: a Parallax blow makes the target deal less damage for a while; it never stacks past the cap', () => {
  const g = quiet(); seeAll(g);
  const p = put(g, 0, 'parallax', 600, 0), r = put(g, 1, 'heavy', 620, 0); r.cd = p.cd = 1e6; r.hp = r.maxHp = 1e5;
  sim.fire(g, p, r, U.parallax);
  assert.ok(Math.abs(r.dis - U.parallax.disrupt.amt) < 1e-9 && r.disT > g.t, 'disrupted');
  for (let i = 0; i < 5; i++) sim.fire(g, p, r, U.parallax); assert.ok(r.dis <= sim.DISRUPT.cap + 1e-9, 'never past the cap');
  sim.disrupt(g, r, { amt: 0.9, dur: 1 }); assert.strictEqual(r.dis, sim.DISRUPT.cap, 'even a stronger one is capped');
  sim.disrupt(g, r, { amt: 0.1, dur: 10 }); assert.strictEqual(r.dis, sim.DISRUPT.cap, 'a weaker one never lowers it'); assert.ok(r.disT >= g.t + 9, 'the later end is kept');
  const b = put(g, 0, 'bastion', 760, 0); b.braceCd = 1e9; b.surgeCd = 1e9; const h0 = b.shp + b.hp;
  sim.fire(g, r, b, U.heavy); for (let i = 0; i < 60 && g.projs.length; i++) sim.update(g, 1 / 30);
  const dealt = h0 - (b.shp + b.hp), full = U.heavy.dmg * sim.DMG.rocket.vehicle;
  assert.ok(Math.abs(dealt - full * (1 - sim.DISRUPT.cap)) < 1, `a disrupted Heavy's rocket: ${dealt.toFixed(1)} of ${full}`);
  step(g, 11); assert.ok(!(r.disT > g.t), 'it wears off');
});

test('the Lancer hits aircraft, ground and buildings; the Astral Marksman charges visibly on one target before each shot and cannot hit aircraft', () => {
  const g = quiet(); seeAll(g);
  const air = put(g, 1, 'aircraft', 760, 0), gr = put(g, 1, 'rifle', 760, 10); air.cd = gr.cd = 1e6;
  const l = put(g, 0, 'lancer', 640, 0); l.cd = 1e6; sim.updateVision(g);
  assert.strictEqual(sim.acquire(g, l, U.lancer, [air]).best, air); assert.ok(sim.DMG.bolt.building > 0 && U.lancer.hitsAir);
  const h = air.hp; sim.fire(g, l, air, U.lancer); step(g, 0.4); assert.ok(air.hp < h, 'a Lancer bolt hits the aircraft');
  const m = put(g, 0, 'marksman', 480, 0); m.cd = 0; air.hp = 0; g.ents = g.ents.filter(e => e.hp > 0); sim.updateVision(g); // the Lancer (its gun held) spots for it
  assert.strictEqual(sim.acquire(g, m, U.marksman, [air]).best, null, 'no aircraft');
  const hr = gr.hp; step(g, 0.5); assert.ok(m.chT > g.t && gr.hp === hr, 'charging: no shot yet');
  step(g, U.marksman.charge + 0.3); assert.ok(gr.hp < hr || gr.hp <= 0, 'the shot after the charge');
  assert.ok(sim.DMG.astral.building < 0.5, 'reduced damage against buildings');
});

test('Rift Mortar: Artillery mechanics with a 110 minimum range', () => {
  const g = quiet(); seeAll(g);
  const rm = put(g, 0, 'riftmortar', 600, 0), near = put(g, 1, 'rifle', 680, 0); near.cd = 1e6; sim.updateVision(g);
  const r = sim.acquire(g, rm, U.riftmortar, [near]); assert.ok(!r.best && r.close, 'inside the minimum range: no shot');
  const far = put(g, 1, 'rifle', 790, 0); far.cd = 1e6; sim.updateVision(g);
  assert.strictEqual(sim.acquire(g, rm, U.riftmortar, [far]).best, far);
  sim.fire(g, rm, far, U.riftmortar); const p = g.projs.at(-1); assert.ok(p.T > 0 && p.arc > 0 && p.weapon === 'rift', 'an arcing shot');
  for (let i = 0; i < 90 && g.projs.length; i++) sim.update(g, 1 / 30); assert.ok(!g.projs.length);
});

test('Worldbreaker distortion zones: in the acid-pool list under its hard cap; they expire; enemy ground units only', () => {
  const g = quiet(); seeAll(g);
  const wb = put(g, 0, 'worldbreaker', 500, 0), foe = put(g, 1, 'tank', 650, 0); foe.cd = wb.cd = 1e6;
  sim.fire(g, wb, foe, U.worldbreaker); for (let i = 0; i < 60 && g.projs.length; i++) sim.update(g, 1 / 30);
  assert.strictEqual(g.acid.length, 1); assert.strictEqual(g.acid[0].kind, 'dist');
  for (let i = 0; i < 10; i++) sim.addAcid(g, 0, 700 + i * 10, 0, 'dist');
  assert.strictEqual(g.acid.length, sim.ACID.max, 'the shared hard cap');
  const mine = put(g, 0, 'shardling', 740, 0), air = put(g, 1, 'aircraft', 740, 0); const h = foe.hp; foe.u = 740; foe.v = 0; air.cd = 1e6;
  const ms = mine.shp + mine.hp; step(g, 1); assert.ok(foe.hp < h && air.hp === air.maxHp && mine.shp + mine.hp === ms, 'enemy ground units only');
  step(g, sim.ACID.dur); assert.strictEqual(g.acid.length, 0, 'all expired');
});

test('Gravemantle: an aura that slows enemy ground units near it; slows never stack (two Gravemantles, or another slow), capped', () => {
  const g = quiet(); seeAll(g);
  const gm = put(g, 0, 'gravemantle', 600, 0), gm2 = put(g, 0, 'gravemantle', 610, 30), r = put(g, 1, 'rifle', 680, 10), far = put(g, 1, 'rifle', 900, 0), air = put(g, 1, 'aircraft', 650, 0);
  for (const e of [gm, gm2, r, far, air]) e.cd = 1e6;
  sim.update(g, 1 / 30);
  assert.ok(Math.abs(r.slow - U.gravemantle.aura.slow) < 1e-9 && r.slowT > g.t, 'slowed by 30%, not 60%');
  assert.ok(!(far.slowT > g.t) && !(air.slowT > g.t), 'not out of reach, not aircraft');
  sim.slowU(g, r, 0.2, 5); assert.strictEqual(r.slow, U.gravemantle.aura.slow, 'a weaker slow never adds');
  sim.slowU(g, r, 0.9, 5); assert.strictEqual(r.slow, sim.SLOW.cap, 'a stronger one is capped');
  const x0 = far.u; far.holdU = undefined; sim.setStance(g, 1, 'attack'); far.u = 900; step(g, 1); const free = Math.abs(far.u - x0);
  r.holdU = undefined; const r0 = r.u; step(g, 1); assert.ok(Math.abs(r.u - r0) < free, 'it moves slower in the aura');
  gm.hp = gm2.hp = 0; g.ents = g.ents.filter(e => e.hp > 0); step(g, 6); assert.ok(!(r.slowT > g.t), 'it wears off once out of the aura');
});

test('Eventide: a visible pulse pulls enemy ground units inward; never into buildings or off the lane, never aircraft; on cooldown between pulses', () => {
  const g = quiet(); seeAll(g);
  const ev = put(g, 0, 'eventide', 800, 0); ev.cd = 1e6;
  const a = put(g, 1, 'heavy', 900, 40), air = put(g, 1, 'aircraft', 880, 0), edge = put(g, 1, 'rifle', 820, 115); for (const e of [a, air, edge]) { e.cd = 1e6; e.hp = e.maxHp = 1e5; }
  const ref = finish(g, 1, 'refinery'); ref.u = 850; ref.v = -35; const blocked = put(g, 1, 'rifle', 900, -70); blocked.cd = 1e6; // its full pull would end inside the Refinery
  const a0 = [a.u, a.v], air0 = air.u, b0 = [blocked.u, blocked.v];
  sim.updateAuras(g);
  assert.ok(Math.abs(Math.hypot(a.u - a0[0], a.v - a0[1]) - U.eventide.pulse.pull) < 1e-6 && Math.hypot(a.u - ev.u, a.v - ev.v) < Math.hypot(a0[0] - ev.u, a0[1] - ev.v), 'pulled 40 inward'); assert.strictEqual(air.u, air0, 'aircraft untouched');
  assert.ok(Math.abs(edge.v) <= 115, 'never off the lane');
  for (const e of [a, edge, blocked]) assert.ok(Math.hypot(e.u - ref.u, e.v - ref.v) >= ref.half + 8, 'never into a building');
  const moved = Math.hypot(blocked.u - b0[0], blocked.v - b0[1]); assert.ok(moved > 0 && moved <= U.eventide.pulse.pull / 2 + 1e-6, `blocked by the building: only half the pull (${moved.toFixed(1)})`);
  assert.ok(g.fx.some(f => f.k === 'pull'), 'a visible pulse');
  const cd = ev.pulseCd; assert.ok(cd >= g.t + U.eventide.pulse.cd - 1e-9);
  a.u = 900; a.v = 40; sim.updateAuras(g); assert.strictEqual(a.u, 900, 'no pulse during the cooldown');
  g.t = cd; sim.updateAuras(g); assert.ok(a.u < 900, 'the next pulse after it');
});

test('path units warp in like the base units', () => {
  const g = quiet(); step(g, 40); const gate = finish(g, 0, 'barracks'); upTo(g, gate, 'B', 2);
  assert.ok(sim.tryTrain(g, 0, 'lancer').ok); step(g, U.lancer.time + 0.1);
  assert.strictEqual(g.warps.length, 1); assert.strictEqual(g.warps[0].type, 'lancer'); step(g, sim.WARP.ch + 0.1);
  assert.strictEqual(g.ents.filter(e => e.type === 'lancer').length, 1);
});

test('saves v24 keep disrupt, slow, charge and pulse timers and distortion zones; a v23 save loads', () => {
  assert.ok(sim.SAVE_VER >= 24); // v25 (v2.28) loads the same way
  const g = quiet(); seeAll(g);
  const r = put(g, 1, 'rifle', 700, 0); sim.disrupt(g, r, { amt: 0.3, dur: 2 }); sim.slowU(g, r, 0.3, 1); sim.addAcid(g, 0, 700, 0, 'dist');
  const e = put(g, 0, 'eventide', 500, 0); e.pulseCd = 99;
  const g2 = sim.deserialize(sim.serialize(g, {})); const r2 = g2.ents.find(x => x.id === r.id);
  assert.deepStrictEqual([r2.dis, r2.disT, r2.slow, r2.slowT], [r.dis, r.disT, r.slow, r.slowT]); assert.strictEqual(g2.acid[0].kind, 'dist');
  assert.strictEqual(g2.ents.find(x => x.id === e.id).pulseCd, 99);
  const o = JSON.parse(sim.serialize(quiet('bloomhost', 'lastfist'), {})); o.v = 23;
  for (const x of o.ents) { delete x.dis; delete x.disT; delete x.slow; delete x.slowT; delete x.chT; delete x.chTgt; delete x.pulseCd; }
  const g3 = sim.deserialize(JSON.stringify(o)); assert.ok(g3 && g3.ents.filter(x => x.kind === 'u').every(x => x.disT === 0 && x.pulseCd === 0)); step(g3, 1);
});

test('the AI maps its Last Fist paths onto the Axiarchs and trains path units (seeded Hard)', () => {
  // Specialists → Lattice, Mass Deployment → Riftwalk; Siege → Rupture, Assault → Dominion
  assert.strictEqual(sim.aiPathTo('axiarchs', 'barracks', 'A'), 'B'); assert.strictEqual(sim.aiPathTo('axiarchs', 'barracks', 'B'), 'A');
  assert.strictEqual(sim.aiPathTo('axiarchs', 'factory', 'A'), 'A'); assert.strictEqual(sim.aiPathTo('axiarchs', 'factory', 'B'), 'B');
  const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const paths = new Set(), units = new Set(), pathUnits = new Set(['riftstalker', 'parallax', 'lancer', 'marksman', 'riftmortar', 'worldbreaker', 'gravemantle', 'eventide']);
  for (const [seed, persona] of [[9, 'economist'], [4, 'trickster']]) {
    const S = loadSim({ random: mul(seed) });
    const g = S.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona, autoPersona: 'turtle', factions: ['lastfist', 'axiarchs'] });
    for (let i = 0; i < 30 * 1700 && !g.over; i++) { S.update(g, 1 / 30); for (const e of g.ents) if (e.side === 1 && e.kind === 'b' && e.path) paths.add(e.type + e.path); g.events.length = 0; }
    assert.ok(g.over, 'the match ends');
    for (const t in g.sides[1].aiLog.trained) if (pathUnits.has(t)) units.add(t);
  }
  assert.ok(['barracksA', 'barracksB'].every(p => paths.has(p)) && paths.has('factoryA') && paths.has('factoryB'), `paths taken: ${[...paths]}`);
  assert.ok(units.size >= 3, `path units trained: ${[...units]}`);
  for (const t of ['riftmortar', 'worldbreaker']) assert.ok(sim.AI_SIEGE.includes(t), `${t} counts as siege`); assert.ok(sim.AI_ART.includes('riftmortar'), 'and the Rift Mortar as artillery');
});
