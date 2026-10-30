// Celestial Array tree (v2.29, docs/AXIARCHS.md sections 5 and 6): Swarm Calculus (Prismwing, Shardstorm) or Ascendant
// Calculus (Voidcarrier, Astral Sovereign); the path lock and sell reset; the Prismwing shield link (shield damage only,
// at most 3 others); the Shardstorm chain beam (at most 3 jumps, weaker each, aircraft and ground); the Voidcarrier and
// Astral Sovereign (no aircraft, buildings first); warp-in; the AI's path mapping and training every path unit; saves
// v26 and the v25 migration; every new unit in the unit tables. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const U = sim.UDEF, NEW = ['prismwing', 'shardstorm', 'voidcarrier', 'sovereign'];
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'axiarchs', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const finish = (g, s, k) => { assert.ok(sim.tryBuild(g, s, k).ok, k); const b = g.ents.filter(e => e.side === s && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; return b; };
const upTo = (g, b, path, tier) => { while (b.tier < tier) { assert.ok(sim.tryUpgrade(g, 0, b, path).ok); b.upProg = 0.9999; step(g, 0.2); } };
const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; e.cd = 1e6; return e; };
const seeAll = g => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } };
const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

test('Celestial Array: Swarm or Ascendant Calculus at T2 locks the building; T3 deepens it; Wraithwings on both; selling resets', () => {
  const T = sim.TREES_AX.techlab;
  assert.strictEqual(T.A.name, 'Swarm Calculus'); assert.strictEqual(T.B.name, 'Ascendant Calculus');
  assert.deepStrictEqual([T.A.steps[2].unlock[0], T.A.steps[3].unlock[0], T.B.steps[2].unlock[0], T.B.steps[3].unlock[0]], NEW);
  assert.ok(!sim.prodLocked('axiarchs', 'techlab'), 'no "Calculus paths coming soon" lock');
  const g = quiet(); finish(g, 0, 'barracks'); const arr = finish(g, 0, 'techlab'); for (let i = 0; i < 4; i++) finish(g, 0, 'habitat');
  assert.match(sim.tryUpgrade(g, 0, arr).msg, /Choose a path/);
  assert.ok(!sim.tryTrain(g, 0, 'prismwing').ok, 'T1: no path units');
  upTo(g, arr, 'A', 2); assert.strictEqual(arr.path, 'A');
  assert.ok(sim.tryTrain(g, 0, 'prismwing').ok && sim.tryTrain(g, 0, 'wraithwing').ok);
  assert.ok(!sim.tryTrain(g, 0, 'voidcarrier').ok, 'not the other path'); assert.ok(!sim.tryTrain(g, 0, 'shardstorm').ok, 'T3 needed');
  upTo(g, arr, 'B', 3); assert.strictEqual(arr.path, 'A', 'the path never switches'); assert.ok(sim.tryTrain(g, 0, 'shardstorm').ok);
  assert.ok(!sim.tryTrain(g, 0, 'sovereign').ok);
  sim.trySell(g, 0, arr); step(g, 0.1); const a2 = finish(g, 0, 'techlab');
  assert.ok(a2.path === null && a2.tier === 1, 'a rebuilt Celestial Array is undecided again');
  upTo(g, a2, 'B', 3); assert.ok(sim.tryTrain(g, 0, 'voidcarrier').ok && sim.tryTrain(g, 0, 'sovereign').ok && sim.tryTrain(g, 0, 'wraithwing').ok);
  assert.ok(!sim.tryTrain(g, 0, 'prismwing').ok);
});

test('Prismwing shield link: half of the shield damage goes evenly to up to 3 nearby Prismwings, shields only, never health', () => {
  const K = U.prismwing.link; assert.deepStrictEqual([K.share, K.n], [0.5, 3]);
  const g = quiet();
  const ps = [0, 1, 2, 3, 4].map(i => put(g, 0, 'prismwing', 800 + i * 15)), far = put(g, 0, 'prismwing', 800 + K.r + 60), other = put(g, 0, 'wraithwing', 805, 10);
  const hp0 = g.ents.map(e => e.hp), shp0 = ps.map(p => p.shp), tot0 = g.ents.reduce((a, e) => a + (e.shp || 0), 0);
  sim.damage(g, ps[0], 40, 'rifle', 1); const d = 40 * sim.DMG.rifle.air;
  assert.deepStrictEqual(g.ents.map(e => e.hp), hp0, 'nobody loses health (the hit fits in the shield)');
  const lost = ps.map((p, i) => shp0[i] - p.shp);
  assert.ok(Math.abs(lost[0] - d * (1 - K.share)) < 1e-9, `the struck one keeps half: ${lost[0]}`);
  assert.deepStrictEqual(lost.slice(1, 4).map(x => +x.toFixed(9)), [1, 2, 3].map(() => +(d * K.share / 3).toFixed(9)), 'the 3 nearest share the other half evenly');
  assert.strictEqual(lost[4], 0, 'never more than 3'); assert.strictEqual(far.shp, far.maxShp, 'out of reach: not linked'); assert.strictEqual(other.shp, other.maxShp, 'only Prismwings link');
  assert.ok(Math.abs(tot0 - g.ents.reduce((a, e) => a + (e.shp || 0), 0) - d) < 1e-9, 'the shield damage moves; none is added or lost');
  // partners with almost no shield: they lose what they hold, never health; the rest stays on the struck one
  for (const p of ps.slice(1)) p.shp = 1;
  const h = ps.map(p => p.hp), s0 = ps[0].shp; ps[0].shp = s0; sim.damage(g, ps[0], 40, 'rifle', 1);
  assert.deepStrictEqual(ps.slice(1).map(p => p.hp), h.slice(1), 'partners never lose health');
  assert.deepStrictEqual(ps.slice(1, 4).map(p => p.shp), [0, 0, 0]); assert.strictEqual(ps[4].shp, 1);
  assert.ok(Math.abs((s0 - ps[0].shp) - (d - 3)) < 1e-9 && ps[0].hp === h[0], 'the struck one took the rest on its own shield');
  // a struck Prismwing without shields takes the hit on health; nothing moves
  ps[0].shp = 0; for (const p of ps.slice(1)) p.shp = p.maxShp; sim.damage(g, ps[0], 40, 'rifle', 1);
  assert.ok(ps[0].hp < h[0] && ps.slice(1).every(p => p.shp === p.maxShp));
});

test('Shardstorm chain beam: from the target to at most 3 more enemies nearby, weaker each jump; aircraft and ground (buildings weakly since v2.31), never jumping to a building or the same enemy twice', () => {
  const C = U.shardstorm.chain; assert.deepStrictEqual([C.n, C.fall], [3, 0.7]);
  assert.ok(U.shardstorm.hitsAir && sim.DMG.storm.air > 0 && sim.DMG.storm.light > 0 && sim.DMG.storm.building > 0 && sim.DMG.storm.building < 0.5); // v2.31: weak against buildings (was 0), so they stop it
  const g = quiet(); seeAll(g);
  const st = put(g, 0, 'shardstorm', 700);
  const foes = [0, 1, 2, 3, 4, 5].map(i => { const e = put(g, 1, i % 2 ? 'aircraft' : 'rifle', 840 + i * 40); e.hp = e.maxHp = 1000; return e; });
  sim.fire(g, st, foes[0], U.shardstorm);
  const dmg = foes.map(f => 1000 - f.hp), base = dmg[0] / sim.DMG.storm.light;
  assert.strictEqual(dmg.filter(x => x > 0).length, 4, `the target and 3 jumps: ${dmg.map(x => x.toFixed(1))}`);
  for (let i = 1; i < 4; i++) assert.ok(Math.abs(dmg[i] / sim.DMG.storm[i % 2 ? 'air' : 'light'] - base * C.fall ** i) < 1e-6, `jump ${i}: ×${C.fall ** i}`);
  assert.strictEqual(g.fx.filter(f => f.k === 'beam').length, 4, 'one beam mark per link');
  // a gap wider than chain.r stops the chain; a building in reach is skipped
  const g2 = quiet(); seeAll(g2); const s2 = put(g2, 0, 'shardstorm', 700);
  const a = put(g2, 1, 'rifle', 840), b = put(g2, 1, 'rifle', 840 + C.r + 40); for (const e of [a, b]) e.hp = e.maxHp = 1000;
  const ref = finish(g2, 1, 'refinery'); ref.u = 870; ref.v = 0; const rh = ref.hp;
  const hit = sim.chainBeam(g2, s2, a, U.shardstorm);
  assert.strictEqual(hit.length, 0, 'nothing within reach of the target'); assert.strictEqual(b.hp, 1000); assert.strictEqual(ref.hp, rh, 'never a jump to a building');
});

test('Voidcarrier and Astral Sovereign never hit aircraft; they go for buildings first; the Sovereign fires a single judgement beam (v2.37)', () => {
  for (const t of ['voidcarrier', 'sovereign']) {
    assert.strictEqual(U[t].hitsAir, false, t); assert.strictEqual(sim.DMG[U[t].weapon].air, 0, t); assert.ok(U[t].preferB, t);
    const g = quiet(); seeAll(g); const me = put(g, 0, t, 800);
    const air = put(g, 1, 'aircraft', 820); air.hp = air.maxHp = 1000; air.z = 60;
    const foes = g.ents.filter(e => e.side === 1 && e.hp > 0);
    assert.ok(!sim.acquire(g, me, U[t], foes).best || sim.acquire(g, me, U[t], foes).best.kind === 'b', `${t} never targets the aircraft`);
    sim.fire(g, me, air, U[t]); step(g, 2); assert.strictEqual(air.hp, 1000, `${t}: no damage to aircraft, even fired at one`);
    const tank = put(g, 1, 'tank', 830); const ref = finish(g, 1, 'refinery'); ref.u = 850; ref.v = 0;
    const pick = sim.acquire(g, me, U[t], g.ents.filter(e => e.side === 1 && e.hp > 0)).best;
    assert.strictEqual(pick && pick.type, 'refinery', `${t} prefers the building`);
  }
  const g = quiet(); seeAll(g); const sv = put(g, 0, 'sovereign', 800);
  const ring = [0, 1, 2].map(i => { const e = put(g, 1, 'tank', 830 + i * 25); e.hp = e.maxHp = 5000; return e; });
  sim.fire(g, sv, ring[1], U.sovereign); step(g, 0.1);
  assert.ok(ring[1].hp < 5000 && ring[0].hp === 5000 && ring[2].hp === 5000, 'v2.37 (P12): one judgement beam, no splash'); // was: area damage around a drop
});

test('the four new units warp in like the others; every new unit is in the unit tables (completeness)', () => {
  for (const t of NEW) {
    assert.ok(sim.UNIT_ORDER.includes(t) && sim.PLURAL[t] && sim.GROUP_OF[t] === 'air' && sim.SIGHT[t] > 0 && U[t].shp > 0 && U[t].fac === 'axiarchs' && U[t].air, t);
  }
  const g = quiet(); step(g, 30); finish(g, 0, 'barracks'); const arr = finish(g, 0, 'techlab'); for (let i = 0; i < 6; i++) finish(g, 0, 'habitat');
  arr.tier = 3; arr.path = 'A'; const n0 = g.ents.filter(e => e.kind === 'u').length;
  assert.ok(sim.tryTrain(g, 0, 'prismwing').ok); step(g, U.prismwing.time + 0.2);
  assert.strictEqual(g.warps.filter(w => w.type === 'prismwing').length, 1, 'it warps in'); step(g, sim.WARP.ch + 0.2);
  const p = g.ents.find(e => e.type === 'prismwing'); assert.ok(p && sim.onField(g, 0, p.u, p.v)); assert.strictEqual(g.ents.filter(e => e.kind === 'u').length, n0 + 1);
});

test('the AI maps its Tech Lab taste onto the Celestial Array (Air Power → Ascendant, Support → Swarm) and trains every unit on each path', () => {
  assert.strictEqual(sim.aiPathTo('axiarchs', 'techlab', 'A'), 'B'); assert.strictEqual(sim.aiPathTo('axiarchs', 'techlab', 'B'), 'A');
  for (const [path, want] of [['A', ['prismwing', 'shardstorm']], ['B', ['voidcarrier', 'sovereign']]]) {
    const S = loadSim({ random: mul(7) });
    const g = S.newGame('hard', { factions: ['lastfist', 'axiarchs'] }); g.countdown = 0; g.sides[0].aiT = 1e9;
    const side = g.sides[1]; side.res.c = side.res.e = 6000;
    const fin = k => { assert.ok(S.tryBuild(g, 1, k).ok, k); const x = g.ents.filter(e => e.side === 1 && e.type === k).at(-1); x.built = true; x.progress = 1; x.hp = x.maxHp; return x; };
    fin('barracks'); fin('habitat'); fin('habitat'); fin('habitat'); const arr = fin('techlab');
    arr.tier = 3; arr.path = path;
    for (let i = 0; i < 30 * 120; i++) S.update(g, 1 / 30);
    for (const t of want) assert.ok(side.aiLog.trained[t] > 0, `path ${path}: trained ${JSON.stringify(side.aiLog.trained)}`);
  }
});

test('saves v26 keep Celestial Array paths and the new units; a v25 save loads (a T1 Celestial Array without a path)', () => {
  assert.ok(sim.SAVE_VER >= 26); // v27 (v2.30) loads the same way
  const g = quiet(); seeAll(g); finish(g, 0, 'barracks'); for (let i = 0; i < 3; i++) finish(g, 0, 'habitat'); const arr = finish(g, 0, 'techlab'); arr.tier = 3; arr.path = 'B';
  const v = put(g, 0, 'voidcarrier', 800); v.shp = 100;
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.strictEqual(g2.ents.find(e => e.id === arr.id).path, 'B'); assert.strictEqual(g2.ents.find(e => e.id === v.id).shp, 100);
  assert.ok(sim.tryTrain(g2, 0, 'sovereign').ok, 'still trains after loading');
  const o = JSON.parse(sim.serialize(quiet(), {})); o.v = 25;
  const g3 = sim.deserialize(JSON.stringify(o)); finish(g3, 0, 'barracks'); const a3 = finish(g3, 0, 'techlab');
  assert.strictEqual(a3.path, null); assert.match(sim.tryUpgrade(g3, 0, a3).msg, /Choose a path/);
  const o2 = JSON.parse(sim.serialize(g3, {})); o2.v = 25; for (const e of o2.ents) if (e.id === a3.id) e.path = 'A'; // a stray path on a T1 Array from before v26 is dropped
  assert.strictEqual(sim.deserialize(JSON.stringify(o2)).ents.find(e => e.id === a3.id).path, null);
});

test('every Axiarch unit hits exactly the targets spec section 6 gives it (A aircraft, G ground units, B buildings)', () => {
  const SPEC = { shardling: 'GB', riftstalker: 'GB', parallax: 'GB', lancer: 'AGB', marksman: 'GB', bastion: 'GB', riftmortar: 'GB', worldbreaker: 'GB', gravemantle: 'GB', eventide: 'GB', // v2.31: Gravemantle and Eventide G → G, B
    wraithwing: 'AGB', prismwing: 'GB', shardstorm: 'AGB', voidcarrier: 'GB', sovereign: 'GB' }; // v2.31: Shardstorm A, G → A, G, B
  assert.deepStrictEqual(Object.keys(U).filter(t => U[t].fac === 'axiarchs').sort(), Object.keys(SPEC).sort(), 'every Axiarch unit is listed');
  for (const [t, want] of Object.entries(SPEC)) {
    const W = sim.DMG[U[t].weapon], got = (U[t].hitsAir && W.air > 0 ? 'A' : '') + (U[t].hitsGround !== false && W.light > 0 ? 'G' : '') + (W.building > 0 ? 'B' : '');
    assert.strictEqual(got, want, t);
  }
});
