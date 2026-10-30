// Bloomspire tree (v2.21): Swarm Bloom (Needlewing, Cloudwing) and Apex Bloom (Brood Tyrant, Worldrender); path lock and
// sell reset; the Needlewing pack bonus; Cloudwing offspring (their own cap, half damage, no supply, expiry, cleanup at
// match end and through save and load); none of the four hits aircraft; the Brood Tyrant and Worldrender prefer buildings
// and skip a shielded Hive or HQ; saves v21 with the v20 migration; the AI's path mapping. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const U = sim.UDEF;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'bloomhost', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const finish = (g, s, k) => { assert.ok(sim.tryBuild(g, s, k).ok); const b = g.ents.filter(e => e.side === s && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };
const upTo = (g, b, path, tier) => { while (b.tier < tier) { assert.ok(sim.tryUpgrade(g, 0, b, path).ok); b.upProg = 0.9999; step(g, 0.2); } };
const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; return e; };
const seeAll = g => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } };
const kids = (g, s = 0) => g.ents.filter(e => e.side === s && e.tSrc === 'cloud' && e.hp > 0);

test('Bloomspire: Swarm Bloom or Apex Bloom at T2 locks the building; T3 deepens it; Razorwings on both; selling resets', () => {
  const g = quiet();
  finish(g, 0, 'barracks'); const spire = finish(g, 0, 'techlab'); finish(g, 0, 'habitat'); finish(g, 0, 'habitat');
  assert.strictEqual(sim.TREES_BH.techlab.A.name, 'Swarm Bloom'); assert.strictEqual(sim.TREES_BH.techlab.B.name, 'Apex Bloom');
  assert.match(sim.tryUpgrade(g, 0, spire).msg, /Choose a path/);
  assert.ok(!sim.tryTrain(g, 0, 'needlewing').ok, 'nothing new at T1');
  upTo(g, spire, 'A', 2); assert.strictEqual(spire.path, 'A');
  assert.ok(sim.tryTrain(g, 0, 'needlewing').ok); assert.ok(sim.tryTrain(g, 0, 'razorwing').ok, 'Razorwings on both paths');
  assert.ok(!sim.tryTrain(g, 0, 'broodtyrant').ok, 'not the other path'); assert.ok(!sim.tryTrain(g, 0, 'cloudwing').ok, 'Cloudwings need T3');
  upTo(g, spire, 'B', 3); assert.strictEqual(spire.path, 'A', 'the path never switches'); assert.ok(sim.tryTrain(g, 0, 'cloudwing').ok);
  assert.ok(!sim.tryTrain(g, 0, 'worldrender').ok);
  sim.trySell(g, 0, spire); step(g, 0.1); const s2 = finish(g, 0, 'techlab');
  assert.ok(s2.path === null && s2.tier === 1, 'a rebuilt Bloomspire is undecided again');
  upTo(g, s2, 'B', 3); assert.ok(sim.tryTrain(g, 0, 'broodtyrant').ok && sim.tryTrain(g, 0, 'worldrender').ok && sim.tryTrain(g, 0, 'razorwing').ok);
  assert.ok(!sim.tryTrain(g, 0, 'needlewing').ok);
});

test('none of the four hits aircraft (Brood Tyrant and Worldrender included); all four hit ground units', () => {
  const g = quiet(); seeAll(g);
  const air = put(g, 1, 'aircraft', 760, 0), lev = put(g, 1, 'leviathan', 760, 0), gr = put(g, 1, 'tank', 760, 0); air.cd = lev.cd = gr.cd = 1e6;
  for (const t of ['needlewing', 'cloudwing', 'broodtyrant', 'worldrender']) {
    const e = put(g, 0, t, 750, 0);
    assert.strictEqual(U[t].hitsAir, false, t); assert.strictEqual(sim.DMG[U[t].weapon].air, 0, `${t}: its weapon does nothing to aircraft`);
    assert.strictEqual(sim.acquire(g, e, U[t], [air, lev]).best, null, `${t} never targets an aircraft`);
    assert.strictEqual(sim.acquire(g, e, U[t], [air, lev, gr]).best, gr, `${t} takes the ground unit`);
    e.hp = 0; g.ents = g.ents.filter(x => x.hp > 0);
  }
  const ha = air.hp; sim.damage(g, air, 100, 'glob', 0); sim.damage(g, air, 100, 'crush', 0); assert.strictEqual(air.hp, ha);
});

test('Brood Tyrant and Worldrender prefer buildings, never shoot a shielded HQ, and the Worldrender drops a mass that splashes ground units', () => {
  const g = quiet(); seeAll(g);
  const ref = finish(g, 1, 'refinery'), r = put(g, 1, 'rifle', ref.u - 30, ref.v); r.cd = 1e6;
  for (const t of ['broodtyrant', 'worldrender']) {
    const e = put(g, 0, t, ref.u - 40, ref.v);
    assert.strictEqual(sim.acquire(g, e, U[t], [r, ref]).best, ref, `${t} picks the building over a closer Rifleman`);
    e.hp = 0; g.ents = g.ents.filter(x => x.hp > 0);
  }
  sim.update(g, 1 / 30); const hq = g.sides[1].hq; assert.ok(hq.shielded);
  const ty = put(g, 0, 'broodtyrant', hq.u - 60, hq.v); assert.strictEqual(sim.acquire(g, ty, U.broodtyrant, [hq]).best, null, 'a shielded HQ is skipped');
  const wr = put(g, 0, 'worldrender', 900, 0), a = put(g, 1, 'rifle', 920, 0), b = put(g, 1, 'rifle', 940, 12); a.cd = b.cd = 1e6;
  sim.fire(g, wr, a, U.worldrender); const p = g.projs.at(-1);
  assert.ok(p.weapon === 'crush' && p.target === null && p.tz === 0, 'it falls where the target stands');
  for (let i = 0; i < 90 && g.projs.length; i++) sim.update(g, 1 / 30);
  assert.ok(a.hp < a.maxHp && b.hp < b.maxHp, 'splash on ground units');
});

test('Needlewings hit harder in a pack (the Skitterling swarm bonus, capped)', () => {
  const g = quiet(); seeAll(g);
  const t = put(g, 1, 'titan', 900, 0); t.cd = 1e6; t.hp = t.maxHp = 1e6;
  const n = []; for (let i = 0; i < 6; i++) { const e = put(g, 0, 'needlewing', 880, i * 4); e.tgt = t.id; n.push(e); }
  const h = t.hp; sim.fire(g, n[0], t, U.needlewing);
  const exp = U.needlewing.dmg * (1 + U.needlewing.swarm.max) * sim.DMG.needle.vehicle;
  assert.ok(Math.abs((h - t.hp) - exp) < 1e-6, `5 others: +${U.needlewing.swarm.max * 100}% at most`);
});

test('Cloudwing offspring: released while fighting, their own cap (separate from Emergency Brood), half damage, no supply, expire quietly', () => {
  const g = quiet(); seeAll(g); sim.setStance(g, 0, 'attack');
  const S = U.cloudwing.spawn;
  for (let i = 0; i < 4; i++) put(g, 0, 'cloudwing', 700, i * 12 - 18).holdU = undefined;
  const pop = sim.popUsed(g, 0);
  step(g, 2); assert.strictEqual(kids(g).length, 0, 'nothing to fight: no offspring');
  for (let i = 0; i < 4; i++) { const r = put(g, 1, 'rifle', 760, i * 10 - 15); r.cd = 1e6; r.hp = r.maxHp = 1e5; }
  step(g, 1.5);
  assert.strictEqual(kids(g).length, sim.SPAWN.max, `4 Cloudwings × ${S.n} = 8 wanted, capped at ${sim.SPAWN.max}`);
  assert.ok(kids(g).every(k => k.type === 'needlewing' && k.kid && k.temp > g.t && k.tLife === S.life));
  assert.strictEqual(sim.popUsed(g, 0), pop, 'offspring use no supply');
  // Emergency Brood's cap does not count offspring, and offspring do not count Brood Skitterlings
  for (const k in g.sides[0].ab) g.sides[0].ab[k] = 0;
  assert.ok(sim.useAbility(g, 0, 'brood', 600, 0).ok); step(g, 2.2);
  assert.strictEqual(g.ents.filter(e => e.side === 0 && e.tSrc === 'brood' && e.hp > 0).length, 5, 'a full brood despite 6 live offspring');
  const k0 = kids(g)[0], foe = g.ents.find(e => e.side === 1 && e.type === 'rifle'); k0.tgt = foe.id;
  const h = foe.hp; sim.fire(g, k0, foe, U.needlewing); const dealt = h - foe.hp;
  assert.ok(dealt > 0 && dealt <= U.needlewing.dmg * (1 + U.needlewing.swarm.max) * sim.DMG.needle.light * sim.SPAWN.dmg + 1e-6, 'an offspring bites for half');
  const lost = g.sides[0].stats.lost, first = Math.min(...kids(g).map(k => k.temp));
  step(g, first - g.t + 0.1);
  assert.ok(kids(g).length < sim.SPAWN.max, 'the first offspring expired'); assert.strictEqual(g.sides[0].stats.lost, lost, 'expiry is not a loss');
  step(g, Math.max(...g.ents.filter(e => e.type === 'cloudwing').map(c => c.spawnT)) - g.t + 0.1);
  assert.ok(kids(g).length > 0 && kids(g).length <= sim.SPAWN.max, 'released again after the cooldown, never past the cap');
});

test('Cloudwing offspring through save and load (same creatures, same expiry), gone at match end, never carried into a new match', () => {
  const g = quiet(); seeAll(g); sim.setStance(g, 0, 'attack');
  put(g, 0, 'cloudwing', 700, 0).holdU = undefined;
  const r = put(g, 1, 'rifle', 760, 0); r.cd = 1e6; r.hp = r.maxHp = 1e5;
  step(g, 1); const ids = kids(g).map(e => [e.id, e.temp, e.tLife, e.tSrc, e.kid]);
  assert.strictEqual(ids.length, U.cloudwing.spawn.n);
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(kids(g2).map(e => [e.id, e.temp, e.tLife, e.tSrc, e.kid]))), JSON.parse(JSON.stringify(ids)));
  assert.strictEqual(sim.popUsed(g2, 0), sim.popUsed(g, 0));
  const cw = g2.ents.find(e => e.type === 'cloudwing'); assert.strictEqual(cw.spawnT, g.ents.find(e => e.type === 'cloudwing').spawnT, 'its release timer too');
  cw.hp = 0; g2.ents = g2.ents.filter(e => e.hp > 0); // no new ones, so the old ones can be seen to expire
  step(g2, U.cloudwing.spawn.life + 1); assert.strictEqual(kids(g2).length, 0, 'they still expire after loading');
  sim.kill(g, g.sides[1].hq, 0); for (const b of g.ents) if (b.side === 1 && b.kind === 'b') b.shielded = false; sim.update(g, 1 / 30); step(g, 6);
  assert.ok(g.over); assert.strictEqual(g.ents.filter(e => e.temp).length, 0, 'none left once the match is over');
  assert.strictEqual(sim.newGame('normal', { factions: ['bloomhost', 'lastfist'] }).ents.filter(e => e.kind === 'u').length, 0);
});

test('saves v21; a v20 save loads (its Brood Skitterlings keep their lifetime; Cloudwing timers start at zero)', () => {
  assert.ok(sim.SAVE_VER >= 21); // v22 (v2.25) loads the same way assert.ok(sim.SAVE_OK.includes(20) && sim.SAVE_OK.includes(21));
  const g = quiet(); seeAll(g); g.t = 300; for (const k in g.sides[0].ab) g.sides[0].ab[k] = 0;
  assert.ok(sim.useAbility(g, 0, 'brood', 600, 0).ok); step(g, 2.2);
  const o = JSON.parse(sim.serialize(g, {})); o.v = 20;
  for (const e of o.ents) if (e.kind === 'u') { delete e.tLife; delete e.tSrc; delete e.kid; delete e.spawnT; }
  const g2 = sim.deserialize(JSON.stringify(o));
  const t = g2.ents.filter(e => e.temp);
  assert.strictEqual(t.length, 5); assert.ok(t.every(e => e.tSrc === 'brood' && e.tLife === sim.ABIL.brood.life && e.kid === 0 && e.spawnT === 0));
  step(g2, sim.ABIL.brood.life); assert.strictEqual(g2.ents.filter(e => e.temp).length, 0);
});

test('the AI maps its Tech Lab taste onto the Bloomspire: Air Power → Apex Bloom, Support → Swarm Bloom', () => {
  assert.strictEqual(sim.aiPathTo('bloomhost', 'techlab', 'A'), 'B'); assert.strictEqual(sim.aiPathTo('bloomhost', 'techlab', 'B'), 'A');
  assert.strictEqual(sim.aiPathTo('lastfist', 'techlab', 'A'), 'A');
});

test('the AI trains every unit on its Bloomspire path (a prepared T3 Bloomspire on each path)', () => {
  const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  for (const [path, want] of [['A', ['needlewing', 'cloudwing']], ['B', ['broodtyrant', 'worldrender']]]) {
    const sim = loadSim({ random: mul(7) }); // seeded (v2.22): unseeded, Skitterlings sometimes filled the supply first
    const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
    const g = sim.newGame('hard', { factions: ['lastfist', 'bloomhost'] }); g.countdown = 0; g.sides[0].aiT = 1e9;
    const side = g.sides[1]; side.res.c = side.res.e = 6000;
    const fin = k => { assert.ok(sim.tryBuild(g, 1, k).ok, k); const b = g.ents.filter(e => e.side === 1 && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };
    fin('barracks'); fin('habitat'); fin('habitat'); fin('habitat'); const sp = fin('techlab');
    sp.tier = 3; sp.path = path; sp.maxHp = sp.hp = sp.maxHp * 2;
    step(g, 90);
    for (const t of want) assert.ok(side.aiLog.trained[t] > 0, `path ${path}: trained ${JSON.stringify(side.aiLog.trained)}`);
  }
});

test('in a seeded Hard match the Bloomhost AI picks a Bloomspire path through its Tech Lab taste and trains its units', () => {
  const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const S = loadSim({ random: mul(17) }); // v2.33: seed 17 (the Bloomhost AI's own signature building changed its play; with seed 42 no Worldrender before 22:58). v2.32: seed 42 (the Last Fist autoplayer's signature building changed its play; with seed 23 the match ends at 9:15 before a Worldrender; 1 of seeds 1-42 trains one). v2.30: seed 23 (was 3)
  const g = S.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'economist', autoPersona: 'turtle', factions: ['lastfist', 'bloomhost'] });
  let path = null;
  for (let i = 0; i < 30 * 1700 && !g.over; i++) { S.update(g, 1 / 30); for (const e of g.ents) if (e.side === 1 && e.type === 'techlab' && e.path) path = e.path; g.events.length = 0; }
  assert.ok(g.over, 'the match ends');
  assert.strictEqual(path, 'B', 'the Economist (Air Power) takes Apex Bloom');
  const tr = g.sides[1].aiLog.trained;
  assert.ok(tr.broodtyrant > 0 && tr.worldrender > 0, JSON.stringify(tr));
});
