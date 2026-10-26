// Bloomhost trees (v2.19): Larva Pit (Predatory / Acidic) and Evolution Chamber (Siege / Predator); path lock and sell
// reset; Leaper leap and its cooldown; Ravager bonus vs light; corrosion cap without stacking; Thornback retaliation that
// can't loop; Dreadthorn spine burst; acid pool cap and expiry; Bile Lobber minimum range; Spitters and Razorwings hit
// aircraft; every unit in the Army tab tables; the AI picks paths and trains path units. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const U = sim.UDEF;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'bloomhost', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const finish = (g, s, k) => { assert.ok(sim.tryBuild(g, s, k).ok); const b = g.ents.filter(e => e.side === s && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };
const upTo = (g, b, path, tier) => { while (b.tier < tier) { assert.ok(sim.tryUpgrade(g, 0, b, path).ok); b.upProg = 0.9999; step(g, 0.2); } };
const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; return e; };

test('Larva Pit and Evolution Chamber: a path at T2 locks the building; T3 deepens it; selling resets (v2.21: the Bloomspire tree is in tests/bh-spire.test.js)', () => {
  const g = quiet(); g.countdown = 0;
  const pit = finish(g, 0, 'barracks'), evo = finish(g, 0, 'factory'), spire = finish(g, 0, 'techlab'); finish(g, 0, 'habitat'); finish(g, 0, 'habitat');
  assert.match(sim.tryUpgrade(g, 0, pit).msg, /Choose a path/);
  upTo(g, pit, 'A', 2); assert.strictEqual(pit.path, 'A');
  assert.ok(sim.tryTrain(g, 0, 'leaper').ok); assert.ok(!sim.tryTrain(g, 0, 'spitter').ok); assert.ok(sim.tryTrain(g, 0, 'skitterling').ok, 'Skitterlings on both paths');
  assert.ok(!sim.tryTrain(g, 0, 'ravager').ok, 'Ravagers need T3');
  upTo(g, pit, 'B', 3); assert.strictEqual(pit.path, 'A', 'the path never switches'); assert.ok(sim.tryTrain(g, 0, 'ravager').ok);
  upTo(g, evo, 'B', 3); assert.ok(sim.tryTrain(g, 0, 'thornback').ok && sim.tryTrain(g, 0, 'dreadthorn').ok && sim.tryTrain(g, 0, 'bulwark').ok);
  assert.ok(!sim.tryTrain(g, 0, 'bilelobber').ok);
  const slot = pit.slot; sim.trySell(g, 0, pit); step(g, 0.1); finish(g, 0, 'barracks');
  const pit2 = g.ents.find(e => e.side === 0 && e.type === 'barracks' && e.hp > 0);
  assert.ok(pit2.path === null && pit2.tier === 1, 'a rebuilt Larva Pit is undecided again');
  upTo(g, pit2, 'B', 2); assert.ok(sim.tryTrain(g, 0, 'spitter').ok);
  assert.match(sim.tryUpgrade(g, 0, spire).msg, /Choose a path/); // v2.21: the Bloomspire has its tree (tests/bh-spire.test.js)
  assert.strictEqual(sim.TREES_BH.barracks.A.name, 'Predatory Evolution'); assert.strictEqual(sim.TREES_BH.factory.B.name, 'Predator Evolution');
});

test('Leaper: leaps onto a target 45–140 away, never further, then waits out its cooldown', () => {
  const g = quiet(); g.countdown = 0; sim.setStance(g, 0, 'attack');
  const lp = sim.spawnUnit(g, 0, 'leaper', 600, 0); lp.laneV = 0;
  const far = put(g, 1, 'sniper', 900, 0); far.cd = 1e6; far.hp = far.maxHp = 1e5;
  step(g, 0.1); assert.ok(!lp.leaping, 'too far (300): it walks');
  for (let i = 0; i < 30 * 6 && !lp.leaping; i++) sim.update(g, 1 / 30);
  assert.ok(lp.leaping, 'it leaps once in range');
  const startU = lp.u; let t0 = g.t;
  while (lp.leaping) sim.update(g, 1 / 30);
  assert.ok(g.t - t0 < 1, 'a leap is quick'); assert.ok(far.u - lp.u < 40, 'landed next to the target');
  assert.ok(lp.leapCd > g.t + U.leaper.leap.cd - 0.1);
  far.u = lp.u + 110; far.holdU = far.u; step(g, 0.2);
  assert.ok(!lp.leaping, 'on cooldown: no second leap');
  step(g, U.leaper.leap.cd); assert.ok(lp.leaping || far.hp < far.maxHp, 'leaps again (or already bit) after the cooldown');
});

test('Ravager: its maul does extra damage to light armor; Spitter and Bilecaster corrosion: capped, strongest wins, never adds up', () => {
  assert.ok(sim.DMG.maul.light > sim.DMG.maul.heavy && sim.DMG.maul.light >= 1.5);
  const g = quiet(); g.countdown = 0;
  const t = put(g, 1, 'titan', 800, 0); t.cd = 1e6; t.hp = t.maxHp = 1e5;
  const sp = put(g, 0, 'spitter', 700, 0), bc = put(g, 0, 'bilecaster', 650, 0); sp.cd = bc.cd = 1e6; // they fire only when told
  const hit = (src) => { sim.fire(g, src, t, U[src.type]); for (let i = 0; i < 30 && g.projs.length; i++) sim.update(g, 1 / 30); };
  hit(sp); assert.ok(Math.abs(t.corr - U.spitter.corrode.amt) < 1e-9);
  for (let i = 0; i < 5; i++) hit(sp); assert.ok(Math.abs(t.corr - U.spitter.corrode.amt) < 1e-9, 'repeated Spitter hits do not stack');
  hit(bc); assert.ok(Math.abs(t.corr - U.bilecaster.corrode.amt) < 1e-9, 'the stronger level wins');
  hit(sp); assert.ok(Math.abs(t.corr - U.bilecaster.corrode.amt) < 1e-9, 'a weaker hit never lowers it');
  assert.ok(t.corr <= sim.CORR.cap);
  const h = t.hp; sim.damage(g, t, 100, 'cannon', 0);
  assert.ok(Math.abs((h - t.hp) - 100 * sim.DMG.cannon.vehicle * (1 + t.corr)) < 1e-6, 'a corroded target takes more damage');
  step(g, U.bilecaster.corrode.dur + 0.5); const h2 = t.hp; sim.damage(g, t, 100, 'cannon', 0);
  assert.ok(Math.abs((h2 - t.hp) - 100 * sim.DMG.cannon.vehicle) < 1e-6, 'expired');
});

test('Thornback: melee attackers take 20% back; retaliation never sets off more retaliation; Dreadthorn: a 60+ hit releases a spine burst, every 15 s', () => {
  const g = quiet('bloomhost', 'bloomhost'); g.countdown = 0;
  const a = put(g, 0, 'thornback', 600, 0), b = put(g, 1, 'thornback', 620, 0); a.cd = b.cd = 1e6;
  const ha = a.hp, hb = b.hp;
  sim.fire(g, a, b, U.thornback);
  const dealt = hb - b.hp, back = ha - a.hp;
  assert.ok(dealt > 0 && Math.abs(back - dealt * U.thornback.thorns.frac * sim.DMG.thorns.heavy) < 1e-6, `dealt ${dealt}, back ${back}`);
  assert.strictEqual(b.hp, hb - dealt, 'b took only the blow: the retaliation on a did not bounce back');
  const sk = put(g, 1, 'skitterling', 900, 0), far = put(g, 1, 'heavy', 600, 0); // ranged hits (no attacker given) bring no retaliation
  const h3 = a.hp; sim.damage(g, a, 50, 'rocket', 1); assert.ok(far.hp === far.maxHp && a.hp < h3);
  const d = put(g, 0, 'dreadthorn', 1200, 0), r1 = put(g, 1, 'rifle', 1230, 10), r2 = put(g, 1, 'rifle', 1180, -10), r3 = put(g, 1, 'rifle', 1400, 0);
  sim.damage(g, d, 30, 'cannon', 1); assert.ok(r1.hp === r1.maxHp, 'a small hit: no burst');
  sim.damage(g, d, 80, 'cannon', 1);
  assert.ok(r1.hp < r1.maxHp && r2.hp < r2.maxHp && r3.hp === r3.maxHp, 'a big hit: the spines hit everyone close, nobody far');
  const h1 = r1.hp; sim.damage(g, d, 80, 'cannon', 1); assert.strictEqual(r1.hp, h1, 'cooldown');
  g.t += U.dreadthorn.burst.cd; sim.damage(g, d, 80, 'cannon', 1); assert.ok(r1.hp < h1, 'again after 15 s');
});

test('Ruinmaw acid pools: at most 6 at once (the oldest goes), they expire after 4 s, and hurt enemy ground units only', () => {
  const g = quiet(); g.countdown = 0;
  for (let i = 0; i < 10; i++) sim.addAcid(g, 0, 700 + i * 10, 0);
  assert.strictEqual(g.acid.length, sim.ACID.max); assert.strictEqual(g.acid[0].u, 740, 'the oldest went first');
  const foe = put(g, 1, 'tank', 760, 0), air = put(g, 1, 'aircraft', 760, 0), mine = put(g, 0, 'bulwark', 760, 0); foe.cd = air.cd = 1e6;
  const hf = foe.hp; step(g, 1);
  assert.ok(foe.hp < hf && air.hp === air.maxHp && mine.hp === mine.maxHp);
  step(g, sim.ACID.dur); assert.strictEqual(g.acid.length, 0, 'all expired');
  const rm = put(g, 0, 'ruinmaw', 500, 0), b = finish(g, 1, 'refinery');
  sim.fire(g, rm, foe, U.ruinmaw); for (let i = 0; i < 60 && g.projs.length; i++) sim.update(g, 1 / 30);
  assert.strictEqual(g.acid.length, 1, 'each Ruinmaw hit leaves a pool');
  assert.ok(sim.DMG.ruin.building > 1.5, 'heavy building damage');
});

test('Bile Lobber: Artillery mechanics (arcing shot, splash, ground and buildings) with a 110 minimum range', () => {
  const g = quiet(); g.countdown = 0;
  const lb = put(g, 0, 'bilelobber', 600, 0);
  const near = put(g, 1, 'rifle', 680, 0); near.cd = 1e6;
  sim.updateVision(g);
  const r = sim.acquire(g, lb, U.bilelobber, [near]);
  assert.ok(!r.best && r.close, 'inside the minimum range: no shot');
  const far = put(g, 1, 'rifle', 780, 0); far.cd = 1e6; sim.updateVision(g); // 180 away: past the minimum range, inside its sight
  assert.strictEqual(sim.acquire(g, lb, U.bilelobber, [far]).best, far);
  sim.fire(g, lb, far, U.bilelobber); const p = g.projs.at(-1);
  assert.ok(p.T > 0 && p.arc > 0 && p.weapon === 'lob', 'an arcing shot like a shell');
  const air = put(g, 1, 'aircraft', 780, 0); sim.updateVision(g);
  assert.ok(!sim.acquire(g, lb, U.bilelobber, [air]).best, 'no aircraft');
});

test('Spitters and Razorwings hit aircraft and ground (amendment F); Bilecasters and Skitterlings do not hit aircraft', () => {
  const g = quiet(); g.countdown = 0;
  const air = put(g, 1, 'aircraft', 760, 0), gr = put(g, 1, 'rifle', 760, 20); air.cd = gr.cd = 1e6;
  sim.updateVision(g);
  for (const [t, u, hits] of [['spitter', 650, true], ['razorwing', 720, true], ['bilecaster', 600, false], ['skitterling', 745, false]]) {
    const e = put(g, 0, t, u, 0); sim.updateVision(g);
    assert.strictEqual(sim.acquire(g, e, U[t], [air]).best === air, hits, `${t} vs aircraft`);
    assert.strictEqual(U[t].hitsAir, hits);
    e.hp = 0; g.ents = g.ents.filter(x => x.hp > 0);
  }
  const rz = put(g, 0, 'razorwing', 740, 0), h = air.hp; sim.fire(g, rz, air, U.razorwing); assert.ok(air.hp < h, 'a Razorwing claws an aircraft');
  const sp = put(g, 0, 'spitter', 650, 0), h2 = air.hp; sim.fire(g, sp, air, U.spitter); step(g, 0.5); assert.ok(air.hp < h2, 'a Spitter hits an aircraft');
});

test('every unit is in the Army tab tables (group, plural name), in sight and in the Train order', () => {
  for (const t in U) {
    assert.ok(sim.GROUP_OF[t], `${t} has an Army group`);
    assert.ok(sim.PLURAL[t] && !/undefined/.test(sim.PLURAL[t]), `${t} has a plural name`);
    assert.ok(sim.SIGHT[t] > 0, `${t} has sight`);
    assert.ok(sim.UNIT_ORDER.includes(t), `${t} is in UNIT_ORDER`);
  }
});

test('the AI maps its Last Fist path taste onto Bloomhost and trains path units (one seeded Hard match each way)', () => {
  // Specialists → Acidic, Mass Deployment → Predatory, Siege → Siege Evolution, Assault → Predator Evolution
  assert.strictEqual(sim.aiPathTo('bloomhost', 'barracks', 'A'), 'B'); assert.strictEqual(sim.aiPathTo('bloomhost', 'barracks', 'B'), 'A');
  assert.strictEqual(sim.aiPathTo('bloomhost', 'factory', 'A'), 'A'); assert.strictEqual(sim.aiPathTo('bloomhost', 'factory', 'B'), 'B');
  assert.strictEqual(sim.aiPathTo('lastfist', 'barracks', 'A'), 'A');
  const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pathUnits = new Set(['leaper', 'ravager', 'spitter', 'bilecaster', 'bilelobber', 'ruinmaw', 'thornback', 'dreadthorn']);
  const seen = { paths: new Set(), units: new Set() };
  for (const [seed, persona] of [[5, 'turtle'], [9, 'economist']]) {
    const S = loadSim({ random: mul(seed) });
    const g = S.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona, autoPersona: 'turtle', factions: ['lastfist', 'bloomhost'] });
    for (let i = 0; i < 30 * 1700 && !g.over; i++) { S.update(g, 1 / 30); for (const e of g.ents) if (e.side === 1 && e.kind === 'b' && e.path && (e.type === 'barracks' || e.type === 'factory')) seen.paths.add(e.type + e.path); g.events.length = 0; }
    assert.ok(g.over, 'the match ends');
    for (const t in g.sides[1].aiLog.trained) if (pathUnits.has(t)) seen.units.add(t);
  }
  assert.ok([...seen.paths].some(p => p.startsWith('barracks')) && [...seen.paths].some(p => p.startsWith('factory')), `paths taken: ${[...seen.paths]}`);
  assert.ok(seen.units.size >= 2, `path units trained: ${[...seen.units]}`);
});
