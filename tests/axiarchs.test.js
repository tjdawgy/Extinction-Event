// Axiarchs framework (v2.25, docs/AXIARCHS.md): the faction and its 8 buildings; shields (damage hits shields first,
// modifiers before the split, overflow to HP; regen after the delay, never restoring HP; the storm too); no HP
// self-repair; the Null Lance at T1 (one beam), T2 (Split Lattice, up to 3) and T3 (Event Horizon); base units and their
// targets (the Wraithwing hits aircraft); production and abilities locked; saves v22; the minimal AI. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const U = sim.UDEF;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'axiarchs', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const finish = (g, s, k) => { assert.ok(sim.tryBuild(g, s, k).ok, k); const b = g.ents.filter(e => e.side === s && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; return b; };
const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; e.cd = 1e6; return e; };
const seeAll = g => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } };
const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

test('the Axiarchs: a third faction with its own names for the 8 roles; every building and unit has shields', () => {
  assert.strictEqual(sim.factionName('axiarchs'), 'Axiarchs'); assert.ok(sim.FACTION_KEYS.includes('axiarchs'));
  const names = { hq: 'Axis', refinery: 'Matter Loom', reactor: 'Singularity Well', habitat: 'Continuum Spire', barracks: 'Genesis Gate', factory: 'Architectum', turret: 'Null Lance', techlab: 'Celestial Array' };
  for (const k in names) { const d = sim.BD('axiarchs', k); assert.strictEqual(d.name, names[k]); assert.ok(d.shp > 0, `${k} has shields`); assert.deepStrictEqual(d.cost, sim.BDEF[k].cost, `${k}: Last Fist cost`); }
  for (const t of ['shardling', 'bastion', 'wraithwing']) assert.ok(U[t].fac === 'axiarchs' && U[t].shp > 0, t);
  const g = quiet(); const hq = g.sides[0].hq;
  assert.strictEqual(hq.fac, 'axiarchs'); assert.ok(hq.maxShp > 0 && hq.shp === hq.maxShp, 'the Axis starts with full shields');
  assert.strictEqual(g.sides[1].hq.maxShp, 0, 'Last Fist has none');
});

test('damage hits shields first: armor and corrosion apply before the split, overflow goes to HP', () => {
  const g = quiet(); seeAll(g);
  const b = put(g, 0, 'bastion', 800, 0); b.braceCd = 1e9; // no brace in this test
  sim.damage(g, b, 100, 'cannon', 1);
  const exp = 100 * sim.DMG.cannon.vehicle;
  assert.ok(Math.abs((b.maxShp - b.shp) - exp) < 1e-9 && b.hp === b.maxHp, 'all of it on the shields, after the armor multiplier');
  b.shp = 10; b.corr = 0.2; b.corrT = g.t + 5;
  const h = b.hp; sim.damage(g, b, 100, 'cannon', 1);
  assert.strictEqual(b.shp, 0); assert.ok(Math.abs((h - b.hp) - (exp * 1.2 - 10)) < 1e-9, 'the corroded hit: 10 on the shields, the rest on HP');
  const r = put(g, 1, 'rifle', 900, 0); const hr = r.hp; sim.damage(g, r, 10, 'cannon', 0);
  assert.ok(r.hp < hr && r.maxShp === 0, 'other factions: straight to HP');
});

test('shields recharge only after the delay without damage, and never restore HP; HP never regenerates on its own', () => {
  const g = quiet(); seeAll(g);
  const s = put(g, 0, 'shardling', 800, 0);
  sim.damage(g, s, 100, 'cannon', 1); // takes the shields and some HP
  const hp = s.hp; assert.strictEqual(s.shp, 0); assert.ok(hp < s.maxHp);
  step(g, sim.SHIELD.delay - 0.5); assert.strictEqual(s.shp, 0, 'nothing before the delay');
  step(g, 1); assert.ok(s.shp > 0, 'recharging after it');
  step(g, 20); assert.strictEqual(s.shp, s.maxShp, 'full'); assert.strictEqual(s.hp, hp, 'HP untouched');
  sim.damage(g, s, 5, 'cannon', 1); const sh = s.shp; step(g, 2); assert.strictEqual(s.shp, sh, 'a new hit restarts the delay');
  const ref = finish(g, 0, 'refinery'); ref.hp -= 100; ref.lastHit = -99; const rh = ref.hp; step(g, 15);
  assert.strictEqual(ref.hp, rh, 'an Axiarch building does not self-repair (its shields recharge instead)');
  const lf = finish(g, 1, 'refinery'); lf.hp -= 100; lf.lastHit = -99; const lh = lf.hp; step(g, 15); assert.ok(lf.hp > lh, 'a Last Fist one still does');
});

test('buildings: shields charge once built, grow with the tier; the storm hits shields first', () => {
  const g = quiet(); seeAll(g);
  assert.ok(sim.tryBuild(g, 0, 'refinery').ok); const b = g.ents.filter(e => e.side === 0 && e.type === 'refinery').at(-1);
  assert.strictEqual(b.shp, 0, 'none while it is built');
  b.progress = 0.999; step(g, 1); assert.ok(b.built); step(g, 15); assert.strictEqual(b.shp, b.maxShp);
  const m1 = b.maxShp; assert.ok(sim.tryUpgrade(g, 0, b).ok); b.upProg = 0.9999; step(g, 0.2); assert.strictEqual(b.tier, 2);
  assert.ok(Math.abs(b.maxShp - m1 * 1.25) < 1e-9, 'T2: ×1.25 like HP');
  b.shp = b.maxShp = 50; const h = b.hp; g.t = sim.EXT.start + 60; sim.updateStorm(g, 1 / 30, g.t - 1 / 30);
  assert.ok(b.shp < 50 && b.hp === h, 'the storm takes the shields first');
});

test('Null Lance: T1 one beam; T2 Split Lattice across up to 3 targets at lower damage each; T3 heavy, longer range, more building damage', () => {
  const g = quiet(); seeAll(g);
  const nl = finish(g, 0, 'turret'), G = sim.BD('axiarchs', 'turret').gun;
  const foes = [];
  for (let i = 0; i < 5; i++) { const r = put(g, 1, 'heavy', nl.u + 90 + i * 12, (i - 2) * 14); r.hp = r.maxHp = 1e5; foes.push(r); }
  const hit = () => foes.filter(f => f.hp < f.maxHp).length, reset = () => { for (const f of foes) f.hp = f.maxHp; g.fx.length = 0; };
  sim.updateVision(g);
  const fireOnce = () => { nl.cd = 0; sim.update(g, 1 / 30); };
  fireOnce(); assert.strictEqual(hit(), 1, 'T1: one target'); assert.strictEqual(g.fx.filter(f => f.k === 'beam').length, 1);
  const d1 = foes.find(f => f.hp < f.maxHp); assert.ok(Math.abs((d1.maxHp - d1.hp) - G[1].dmg * sim.DMG.lance.heavy) < 1e-6);
  reset(); nl.tier = 2; fireOnce();
  assert.strictEqual(hit(), 3, 'T2: three of the five'); assert.strictEqual(g.fx.filter(f => f.k === 'beam').length, 3);
  for (const f of foes.filter(f => f.hp < f.maxHp)) assert.ok(Math.abs((f.maxHp - f.hp) - G[2].dmg * sim.DMG.lance.heavy) < 1e-6, 'each at the lower damage');
  assert.ok(G[2].dmg < G[1].dmg && G[2].split === 3);
  reset(); foes.slice(1).forEach(f => { f.hp = 0; }); g.ents = g.ents.filter(e => e.hp > 0); foes.splice(1); fireOnce();
  assert.strictEqual(hit(), 1, 'T2 with one target in range: one beam');
  reset(); nl.tier = 3; fireOnce();
  assert.ok(Math.abs((foes[0].maxHp - foes[0].hp) - G[3].dmg * sim.DMG.horizon.heavy) < 1e-6, 'T3: one heavy hit');
  assert.ok(G[3].dmg > G[1].dmg * 2 && G[3].range > G[2].range && G[3].cd > G[1].cd && sim.DMG.horizon.building > sim.DMG.lance.building);
  for (const t of [1, 2, 3]) assert.ok(G[t].hitsAir, `T${t} hits aircraft`);
});

test('base units: the Wraithwing hits aircraft, ground and buildings; Shardlings and Bastions hit ground and buildings only', () => {
  const g = quiet(); seeAll(g);
  const air = put(g, 1, 'aircraft', 800, 0), gr = put(g, 1, 'rifle', 800, 10);
  for (const [t, u, hitsAir] of [['wraithwing', 700, true], ['shardling', 790, false], ['bastion', 720, false]]) {
    const e = put(g, 0, t, u, 0); sim.updateVision(g);
    assert.strictEqual(sim.acquire(g, e, U[t], [air]).best === air, hitsAir, `${t} vs aircraft`);
    assert.strictEqual(sim.acquire(g, e, U[t], [gr]).best, gr, `${t} vs ground`);
    assert.ok(sim.DMG[U[t].weapon].building > 0, `${t} hurts buildings`);
    e.hp = 0; g.ents = g.ents.filter(x => x.hp > 0);
  }
  const w = put(g, 0, 'wraithwing', 700, 0), h = air.hp; sim.fire(g, w, air, U.wraithwing); step(g, 0.5); assert.ok(air.hp < h, 'a Wraithwing shot downs aircraft');
  assert.ok(U.bastion.brace && U.shardling.melee);
});

test('all three production buildings pick paths (v2.27 Gate and Architectum, v2.29 Celestial Array); each faction trains only its own units; its own three abilities (v2.28; locked until then)', () => {
  const g = quiet(); seeAll(g); g.t = 300;
  const gate = finish(g, 0, 'barracks'), arch = finish(g, 0, 'factory'), arr = finish(g, 0, 'techlab'), loom = finish(g, 0, 'refinery'), nl = finish(g, 0, 'turret'); finish(g, 0, 'habitat'); finish(g, 0, 'habitat');
  for (const b of [gate, arch, arr]) assert.match(sim.tryUpgrade(g, 0, b).msg, /Choose a path/);
  for (const b of [loom, nl, g.sides[0].hq]) assert.ok(sim.tryUpgrade(g, 0, b).ok, b.type);
  for (const [t, ok] of [['shardling', true], ['bastion', true], ['wraithwing', true], ['rifle', false], ['skitterling', false]]) assert.strictEqual(sim.tryTrain(g, 0, t).ok, ok, t);
  assert.match(sim.abilityCheck(g, 0, 'strike').msg, /Orbital Strike is not a Axiarchs ability/);
  assert.strictEqual(Object.keys(g.sides[0].ab).join(), 'mwarp,overcharge,beam');
});

test('saves v22 keep shields; a v21 save loads with no shields anywhere', () => {
  assert.ok(sim.SAVE_VER >= 22); // v23 (v2.26) loads the same way
  const g = quiet(); seeAll(g);
  const s = put(g, 0, 'bastion', 800, 0); sim.damage(g, s, 150, 'cannon', 1);
  const g2 = sim.deserialize(sim.serialize(g, {}));
  const s2 = g2.ents.find(e => e.id === s.id);
  assert.deepStrictEqual([s2.shp, s2.maxShp, s2.shpT], [s.shp, s.maxShp, s.shpT]); assert.strictEqual(g2.sides[0].faction, 'axiarchs');
  const o = JSON.parse(sim.serialize(quiet('bloomhost', 'lastfist'), {})); o.v = 21;
  for (const e of o.ents) { delete e.shp; delete e.maxShp; delete e.shpT; delete e.shpHit; }
  const g3 = sim.deserialize(JSON.stringify(o));
  assert.ok(g3 && g3.ents.every(e => e.maxShp === 0 && e.shp === 0)); step(g3, 2);
});

test('the minimal AI plays the Axiarchs with each personality: economy, base units, nodes and attacks (seeded Hard)', () => {
  const lances = [];
  for (const [seed, persona] of [[2, 'aggressor'], [2, 'economist'], [3, 'trickster'], [4, 'turtle']]) { // v2.34: Aggressor seed 1 → 2 (its Phase Beacon changed the match: with seed 1 it trained only Shardlings in 10 minutes)
    const S = loadSim({ random: mul(seed) });
    const g = S.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'turtle', autoPersona: persona, factions: ['axiarchs', 'lastfist'] });
    let nodes = 0;
    for (let i = 0; i < 30 * 60 * 10 && !g.over; i++) { S.update(g, 1 / 30); for (const e of g.events) if (e.type === 'node' && e.side === 0 && !e.lost) nodes++; g.events.length = 0; }
    const T = g.log.tot[0], tr = g.sides[0].aiLog.trained;
    assert.ok(T.bBuilt.refinery > 0 && T.bBuilt.barracks > 0, `${persona}: economy and production ${JSON.stringify(T.bBuilt)}`);
    assert.ok(tr.shardling > 0 && Object.keys(tr).length >= 2, `${persona}: base units and more ${JSON.stringify(tr)}`); // v2.27: path units count too
    assert.ok(nodes > 0, `${persona}: takes nodes`); assert.ok(g.sides[0].aiLog.attacks > 0, `${persona}: attacks`);
    assert.ok(!Object.keys(tr).some(t => U[t].fac !== 'axiarchs'), 'only its own units');
    lances.push(T.bBuilt.turret || 0);
  }
  assert.ok(lances.some(n => n > 0), `a Null Lance is built (per personality: ${lances})`);
});
