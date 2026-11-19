// v2.93 (batch 6c, Part A2): switches-on counterparts of tests pinned to rework switches off.
// Many older tests pin one or more REWORK switches (src/sim/rework*.js) to false so their seeded scenarios and recorded
// fingerprints keep matching. This file checks the same intents with every switch at its default (on). The full inventory
// (each pinned test, its intent, whether it is a fingerprint, and its counterpart) is audit/logs-p1/pinned6c/pinned-tests.md.
// Two kinds of counterpart live here:
//  1. Re-runs: tests whose file pins a switch for the sake of other tests in it, and which pass unchanged with every switch
//     on. They are run again from their own file with the switches held on (REWORK writes ignored), named "on: <name>".
//  2. Rewritten tests: where the pinned behaviour changed on purpose (a reworked unit), the intent is checked in the new
//     rules, each with a comment pointing to the original file:line.
// Long tests (full AI matches over 20 s) are not re-run here; the report lists them.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const path = require('path');
const Module = require('module');
const LS = require('./load-sim');
const loadSim = LS.loadSim; // the real one (the re-runs below get a wrapped one)
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const allOn = s => Object.values(s.REWORK).every(v => v === true);

// ---------- 1. Re-runs with every switch held on ----------
// The SIM a re-run file loads keeps REWORK at its defaults: each key reads true and assignments to it are ignored, so a
// file-level `sim.REWORK.b3b = false` (or a local one) leaves the switch on.
function heldOn(opts) {
  const s = loadSim(opts), R = s.REWORK;
  for (const k of Object.keys(R)) Object.defineProperty(R, k, { get: () => true, set: () => {}, enumerable: true, configurable: true });
  return s;
}
// Loads tests/<file> with node:test replaced by a filter: only the tests whose names start with one of `names` are
// registered (as "on: <name>"), on a SIM whose switches stay on. Every listed name must be found.
function rerun(file, names) {
  const found = new Set(), real = Module._load;
  const pick = name => names.find(n => name.startsWith(n));
  const fake = (name, opts, fn) => {
    if (typeof opts === 'function') { fn = opts; opts = {}; }
    const n = pick(name); if (!n) return;
    found.add(n);
    test(`on: ${name}`, opts, (...a) => fn(...a));
  };
  LS.loadSim = heldOn;
  Module._load = function (req) { return req === 'node:test' ? fake : real.apply(this, arguments); };
  try { require(path.join(__dirname, file)); } finally { Module._load = real; LS.loadSim = loadSim; }
  test(`on: ${file}: every listed test found for the re-run`, () => assert.deepStrictEqual(names.filter(n => !found.has(n)), []));
}
test('on: the re-run SIM keeps every switch on whatever a test writes', () => {
  const s = heldOn(); s.REWORK.b3b = false; s.REWORK.b6side = false;
  assert.ok(allOn(s)); const g = s.newGame('normal', { seed: 1 }); assert.ok(Object.values(g.rw).every(v => v === true));
});

rerun('abilities.test.js', [ // file pins b4b off (tests/abilities.test.js:6)
  'cost, cooldown, unlock, countdown', // :21
  'targeting: Shield and Repair only', // :44
  'Emergency Shield: 40% less damage', // :56
  'one shared cooldown: any ability locks', // :73
  'a v9 save (separate cooldowns) migrates', // :92
  'Repair Pulse: 6%/s for 6 s', // :134
  'save and resume mid-cooldown', // :155
]);
rerun('ax-abilities.test.js', [ // file pins b3b and b4a off (tests/ax-abilities.test.js:12)
  'costs, cooldowns and unlocks mirror Last Fist', // :24
  'Mass Warp never changes the total unit count', // :75
  'Shield Overcharge expires on game time', // :136
  'Purification Beam: a warning', // :152
  'Purification Beam on buildings', // :169
  'saves v25 keep the Axiarch cooldowns', // :182
  'the AI trains a Gravemantle and an Eventide', // :235
]);
rerun('ax-trees.test.js', [ // file pins b3b off (tests/ax-trees.test.js:10)
  'Genesis Gate and Architectum: a path at T2', // :19
  'the Lancer hits aircraft, ground and buildings', // :64
  'Rift Mortar: Artillery mechanics', // :77
  'Worldbreaker distortion zones', // :87
  'Gravemantle: an aura that slows', // :99
  'Eventide: a visible pulse', // :113
  'path units warp in like the base units', // :130
  'saves v24 keep disrupt', // :137
]);
rerun('axiarchs.test.js', [ // file pins b3b off (tests/axiarchs.test.js:9)
  'the Axiarchs: a third faction', // :18
  'damage hits shields first', // :28
  'buildings: shields charge once built', // :55
  'Null Lance: T1 one beam', // :67
  'base units: the Wraithwing hits aircraft', // :90
  'all three production buildings pick paths', // :104
  'saves v22 keep shields', // :114
]);
rerun('bh-trees.test.js', [ // file pins b3b off (tests/bh-trees.test.js:9)
  'Larva Pit and Evolution Chamber: a path at T2', // :17
  'Leaper: leaps onto a target 45', // :35
  'Ravager: its maul does extra damage', // :51
  'Ruinmaw acid pools', // :86
  'Bile Lobber: Artillery mechanics', // :100
  'Spitters and Razorwings hit aircraft', // :115
  'every unit is in the Army tab tables', // :129
]);
rerun('bloomhost-sig.test.js', [ // file pins b3b off (tests/bloomhost-sig.test.js:11)
  'the Brood Mound and Rootheart: Larva Pit cost', // :21
  'Mites: 2 at T1 and 3 at T2', // :34
  'Mites follow the army', // :51
  'the T3 acid burst', // :69
  'Rootheart T1: creep spreads', // :86
  'Rootheart T3: every 15 s roots snare', // :118
  'the minimal AI (Bloomhost)', // :144
  'saves v29 keep Mites', // :154
]);
rerun('creep.test.js', [ // file pins b3b off (tests/creep.test.js:8)
  'creep grows gradually from the Hive', // :15
  'a held node grows creep faster', // :31
  '+20% speed on own creep', // :49
  'enemy creep: hidden in the fog', // :83
  'saves keep creep and the remembered enemy creep', // :101
]);
rerun('factory.test.js', [ // file pins b4a off (tests/factory.test.js:7)
  'the War Factory picks Siege or Assault at T2', // :29
  'Flame Tank: no projectile', // :48
  'Flame Tank: it burns buildings in reach', // :68
  'Hydra: hits air out to 240', // :86
  'Hydra: switching between ground and air', // :101
  'saves keep War Factory paths', // :134
  'the match log counts what killed your units', // :151
]);
rerun('orders-weapons.test.js', [ // file pins b3b, b4a and b4b off (tests/orders-weapons.test.js:12)
  'a unit that warps in while the army is on Hold', // :28
  'Mass Warp arrivals on Hold', // :46
  'Emergency Brood Skitterlings and Cloudwing offspring', // :62
  'the Gravemantle and the Eventide attack', // :95
  'the Shardstorm stops at buildings', // :111
  'every unit of all three factions has a weapon', // :121
]);
rerun('redesign.test.js', [ // file pins b3b, b4a and b4b off (tests/redesign.test.js:7)
  'setRedesign(false) restores every v2.36 value', // :16
  'corrosion: the strongest running effect', // :27
  'P1 Artillery: a salvo of 3 shells', // :39
  'P3 Rift Mortar: lands exactly', // :59
  'P4 Sniper: the round pierces', // :65
  'P7 Worldbreaker: its distortion zone', // :101
  'P11 Worldrender: heals 30%', // :149
  'P14 Lancer: +15% per consecutive hit', // :169
  'P9 Voidcarrier: carries a power field', // :186
  'S1 Skitterlings: half supply each', // :198
]);
rerun('stats.test.js', [ // file pins b3b off (tests/stats.test.js:7)
  'the tracker changes nothing', // :63
]);
rerun('techlab.test.js', [ // file pins b4a and b4b off (tests/techlab.test.js:8)
  'the Tech Lab picks Air Power or Support', // :29
  'Nanoweave only on Support T3', // :43
  'Interceptor rework', // :52
  'Medevac: heals your infantry', // :81
  'Medevac follows your biggest infantry group', // :97
  'Recon Drone: sight 420', // :108
  'saves keep Tech Lab paths', // :131
]);
rerun('trees.test.js', [ // file pins b4a off (tests/trees.test.js:7)
  'a Barracks picks its path at T2', // :21
  'what each path unlocks', // :35
  'Mass Deployment: a Marine order is a pair', // :50
  'Drilled Marines (Mass Deployment T3)', // :69
  'the AI: Easy follows its personality', // :83
  'saves keep paths; a v12 save migrates', // :98
  'ghosts remember the path; the match log names it', // :112
]);

// ---------- 2. Rewritten for the reworked rules ----------
const stepper = s => (g, secs, dt = 1 / 30) => { for (let i = 0; i < Math.round(secs / dt); i++) s.update(g, dt); };
const seeAll = g => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } };
const NO_PARRY = Infinity; // u.prT: a batch 3b Shardling's next parry (rework-3b.js parryHit); Infinity = spent for good

// tests/abilities.test.js:108. b4b on: a Leviathan with a target within 160 flies a bombing run off the strike's centre
// (tests/rework-4b.test.js:69), so the own Titan leaves the circle before the Leviathan is placed there.
test('on: Orbital Strike: 3 s warning, 280 at the centre to 140 at the edge, every enemy unit (aircraft too), enemies only, shielded HQ immune', () => {
  const sim = loadSim(); sim.BREAK.prod.on = false; assert.ok(allOn(sim)); const step = stepper(sim);
  const g = sim.newGame('normal'); for (const s of [0, 1]) { g.sides[s].aiT = 1e9; g.sides[s].stance = 'hold'; } g.t = 130; seeAll(g);
  const hold = (e, u, v) => { e.holdU = u; e.holdV = v; e.cd = 1e6; return e; }, ready = () => { for (const k of ['shield', 'strike', 'repair']) g.sides[0].ab[k] = 0; };
  g.sides[0].hq.tier = 2; g.sides[0].res.c = g.sides[0].res.e = 5000;
  const c = hold(sim.spawnUnit(g, 1, 'titan', 1000, 0), 1000, 0), e = hold(sim.spawnUnit(g, 1, 'titan', 1060, 0), 1060, 0);
  const air = hold(sim.spawnUnit(g, 1, 'aircraft', 1000, 0), 1000, 0); air.hp = air.maxHp = 1000; const mine = hold(sim.spawnUnit(g, 0, 'titan', 1000, 20), 1000, 20);
  const hp = [c.hp, e.hp, air.hp, mine.hp];
  assert.ok(sim.useAbility(g, 0, 'strike', 1000, 0).ok);
  step(g, 2.9); assert.strictEqual(c.hp, hp[0], 'nothing before the delay');
  step(g, 0.2);
  const dc = hp[0] - c.hp, de = hp[1] - e.hp;
  assert.ok(Math.abs(dc - 280) < 1, `centre ${dc}`);
  assert.ok(de > 140 && de < 190, `near the edge ${de}`);
  assert.ok(Math.abs(hp[2] - air.hp - 280) < 1, `aircraft are hit too: ${hp[2] - air.hp}`);
  assert.strictEqual(mine.hp, hp[3], 'own units are not hit');
  mine.u = mine.holdU = 400; // out of the Leviathan's reach: nothing to start a run on
  const inf = hold(sim.spawnUnit(g, 1, 'heavy', 1000, 0), 1000, 0); inf.hp = inf.maxHp = 1000; const lev = hold(sim.spawnUnit(g, 1, 'leviathan', 1000, 0), 1000, 0), ih = [inf.hp, lev.hp];
  ready(); assert.ok(sim.useAbility(g, 0, 'strike', 1000, 0).ok); step(g, 3.1);
  assert.ok(Math.abs(ih[0] - inf.hp - 280) < 1 && Math.abs(ih[1] - lev.hp - 280) < 1, `infantry ${ih[0] - inf.hp}, Leviathan ${ih[1] - lev.hp}`);
  ready(); g.sides[1].res.c = 1e4; sim.tryBuild(g, 1, 'refinery'); for (const b of g.ents) if (b.type === 'refinery') { b.built = true; b.progress = 1; } step(g, 0.1);
  const hq = g.sides[1].hq, hqHp = hq.hp; assert.ok(hq.shielded);
  assert.ok(sim.useAbility(g, 0, 'strike', hq.u, hq.v).ok); step(g, 3.2);
  assert.strictEqual(hq.hp, hqHp, 'a shielded HQ takes nothing');
});

// The Axiarch ability tests' setup (tests/ax-abilities.test.js:11-21), switches on
function axAbil() {
  const sim = loadSim(); sim.setMech7c(false); sim.setBalance7b(false); sim.BREAK.prod.on = false; assert.ok(allOn(sim));
  const step = stepper(sim);
  const quiet = () => { const g = sim.newGame('normal', { factions: ['axiarchs', 'lastfist'] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
  const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; return e; };
  const grown = () => { const g = quiet(); step(g, 40); g.t = Math.max(g.t, 200); seeAll(g); for (const k in g.sides[0].ab) g.sides[0].ab[k] = 0; return g; };
  return { sim, step, put, grown, units: g => g.ents.filter(e => e.kind === 'u').length };
}

// tests/ax-abilities.test.js:47. b4a on: a Wraithwing hops around enemies in reach (tests/rework-4a.test.js:148), so the
// most damaged unit is a Shardling here, which stays put until the channel ends.
test('on: Mass Warp: up to 8 units (the most damaged first) channel 2 s, then arrive at the warp point; the total unit count never changes', () => {
  const { sim, put, grown, units } = axAbil(), A = sim.ABIL;
  const g = grown(), wp = sim.warpPoint(g, 0), home = sim.hqU(0);
  assert.ok(sim.onField(g, 0, wp.u, wp.v) && wp.u > home + 150, `the warp point is at the front of a grown field (${JSON.stringify(wp)})`);
  const mine = []; for (let i = 0; i < 11; i++) { const e = put(g, 0, i % 3 ? 'shardling' : 'bastion', 800 + (i % 4) * 14, -40 + Math.floor(i / 4) * 30); e.cd = 1e6; e.hp = e.maxHp * (0.2 + i * 0.07); mine.push(e); }
  const low = put(g, 0, 'shardling', 810, 0); low.hp = 1; low.cd = 1e6;
  const foe = put(g, 1, 'tank', 860, 60); foe.cd = 1e6; foe.hp = foe.maxHp = 1e6;
  assert.match(sim.abilityCheck(g, 0, 'mwarp', 1150, 0).msg, /needs your units inside the circle/);
  const n0 = units(g), pick = sim.mwarpPick(g, 0, 820, 0);
  assert.strictEqual(pick.length, 8, 'at most 8'); assert.strictEqual(pick[0], low, 'the most damaged first');
  assert.ok(sim.useAbility(g, 0, 'mwarp', 820, 0).ok); assert.strictEqual(units(g), n0, 'the cast creates nothing');
  pick[3].hp = 0; // one of them dies during the channel
  const at = new Map(g.ents.filter(e => e.kind === 'u').map(e => [e.id, [e.u, e.v]]));
  for (let i = 0; i < Math.round(A.mwarp.ch * 30) - 2; i++) { sim.update(g, 1 / 30); assert.ok(units(g) <= n0); }
  assert.ok(pick.every(e => e.hp <= 0 || Math.abs(e.u - at.get(e.id)[0]) < 30), 'nothing moves before the channel ends');
  for (let i = 0; i < 6; i++) sim.update(g, 1 / 30);
  assert.strictEqual(units(g), n0 - 1, 'only the unit killed during the channel is gone');
  const moved = pick.filter(e => e.hp > 0);
  for (const e of moved) assert.ok(Math.hypot(e.u - wp.u, e.v - wp.v) < 80 && sim.onField(g, 0, e.u, e.v), `${e.type} arrived at the warp point (${e.u.toFixed(0)}, ${e.v.toFixed(0)})`);
  for (let i = 0; i < moved.length; i++) for (let j = i + 1; j < moved.length; j++) assert.ok(Math.hypot(moved[i].u - moved[j].u, moved[i].v - moved[j].v) >= sim.WARP.step - 1e-6, 'never on top of each other');
  for (const e of mine) if (!pick.includes(e)) assert.ok(Math.abs(e.u - at.get(e.id)[0]) < 30, 'units left out stay where they were');
  assert.ok(Math.abs(foe.u - at.get(foe.id)[0]) < 1, 'enemies never move');
  assert.strictEqual(new Set(g.ents.map(e => e.id)).size, g.ents.length, 'no duplicates');
  sim.finish(g, 0, 'hq');
  assert.match(sim.logText(g, { version: sim.VERSION, diff: 'Normal', persona: 'x', result: 'x' }), /Mass Warp: 7 units warped/);
});

// tests/ax-abilities.test.js:107. b3b on: a Shardling parries the next hit every 4 s (tests/rework-3b.test.js:162), so its
// parry is spent here; and no Axiarch unit braces any more (the Bastion has its barrier instead), so the brace cap has
// nothing to cap: that part stays with the original.
test('on: Shield Overcharge: faster shield regen even under fire, less damage (capped with the brace), never health; expires after 7 s', () => {
  const { sim, step, put, grown } = axAbil(), A = sim.ABIL;
  const g = grown();
  const b = put(g, 0, 'bastion', 800, 0), far = put(g, 0, 'bastion', 1000, 0), s = put(g, 0, 'shardling', 810, 20); b.cd = far.cd = s.cd = 1e6; s.prT = NO_PARRY;
  const r = put(g, 1, 'rifle', 820, 0); r.cd = 1e6;
  for (const e of [b, s, far]) { e.hp = e.maxHp * 0.5; e.shp = 0; e.shpT = g.t; }
  const hp0 = [b.hp, s.hp, far.hp];
  assert.ok(sim.useAbility(g, 0, 'overcharge', 800, 0).ok);
  assert.ok(b.ovT > g.t && s.ovT > g.t && !(far.ovT > g.t) && !(r.ovT > g.t));
  step(g, 1);
  assert.ok(Math.abs(b.shp - b.maxShp * A.overcharge.regen) < b.maxShp * 0.02, `30% of its shields in 1 s while just hit: ${b.shp.toFixed(0)}/${b.maxShp}`);
  assert.strictEqual(far.shp, 0, 'outside the circle: the normal delay');
  assert.deepStrictEqual([b.hp, s.hp, far.hp], hp0, 'no health restored');
  s.shp = 0; let h = s.hp; sim.damage(g, s, 20, 'rifle', 1); const fullS = 20 * sim.DMG.rifle.light;
  assert.ok(Math.abs((h - s.hp) - fullS * (1 - A.overcharge.cut)) < 1e-6, `25% less: ${(h - s.hp).toFixed(2)} of ${fullS}`);
  assert.strictEqual(sim.rwD(g, 'bastion').brace, undefined, 'b3b: the Bastion no longer braces');
  step(g, A.overcharge.dur - 1 + 0.1);
  assert.ok(!(b.ovT > g.t) && !(s.ovT > g.t), 'over after 7 s');
  b.shp = 0; b.shpT = g.t; step(g, 1); assert.strictEqual(b.shp, 0, 'back to the normal delay once it has expired');
  h = s.hp; s.shp = 0; sim.damage(g, s, 20, 'rifle', 1); assert.ok(Math.abs((h - s.hp) - fullS) < 1e-6, 'full damage again');
  sim.finish(g, 0, 'hq');
  const m = sim.logText(g, { version: sim.VERSION, diff: 'Normal', persona: 'x', result: 'x' }).match(/Shield Overcharge: (\d+) damage blocked, (\d+) shields restored/);
  assert.ok(m && +m[1] > 0 && +m[2] > 0, `logged: ${m && m[0]}`);
});

// tests/axiarchs.test.js:41. b3b on: the Shardling's parry would negate the test hits; it is spent here.
test('on: shields recharge only after the delay without damage, and never restore HP; HP never regenerates on its own', () => {
  const sim = loadSim(); assert.ok(allOn(sim)); const step = stepper(sim);
  const g = sim.newGame('normal', { factions: ['axiarchs', 'lastfist'] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); seeAll(g);
  const finish = (s, k) => { assert.ok(sim.tryBuild(g, s, k).ok, k); const b = g.ents.filter(e => e.side === s && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; return b; };
  const s = sim.spawnUnit(g, 0, 'shardling', 800, 0); s.holdU = 800; s.holdV = 0; s.cd = 1e6; s.prT = NO_PARRY;
  sim.damage(g, s, 100, 'cannon', 1);
  const hp = s.hp; assert.strictEqual(s.shp, 0); assert.ok(hp < s.maxHp);
  step(g, sim.SHIELD.delay - 0.5); assert.strictEqual(s.shp, 0, 'nothing before the delay');
  step(g, 1); assert.ok(s.shp > 0, 'recharging after it');
  step(g, 20); assert.strictEqual(s.shp, s.maxShp, 'full'); assert.strictEqual(s.hp, hp, 'HP untouched');
  sim.damage(g, s, 5, 'cannon', 1); const sh = s.shp; assert.ok(sh < s.maxShp, 'hit'); step(g, 2); assert.strictEqual(s.shp, sh, 'a new hit restarts the delay');
  const ref = finish(0, 'refinery'); ref.hp -= 100; ref.lastHit = -99; const rh = ref.hp; step(g, 15);
  assert.strictEqual(ref.hp, rh, 'an Axiarch building does not self-repair (its shields recharge instead)');
  const lf = finish(1, 'refinery'); lf.hp -= 100; lf.lastHit = -99; const lh = lf.hp; step(g, 15); assert.ok(lf.hp > lh, 'a Last Fist one still does');
});

// tests/bh-trees.test.js:68. b3b on: the Dreadthorn's spine burst is gone (it charges: tests/rework-3b.test.js:85); the
// Thornback's retaliation is unchanged.
test('on: Thornback: melee attackers take 20% back; retaliation never sets off more retaliation; Dreadthorn: a 60+ hit releases a spine burst, every 15 s', () => {
  const sim = loadSim(); assert.ok(allOn(sim)); const U = sim.UDEF;
  const g = sim.newGame('normal', { factions: ['bloomhost', 'bloomhost'] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold');
  const put = (s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; return e; };
  const a = put(0, 'thornback', 600, 0), b = put(1, 'thornback', 620, 0); a.cd = b.cd = 1e6;
  const ha = a.hp, hb = b.hp;
  sim.fire(g, a, b, sim.rwD(g, 'thornback'));
  const dealt = hb - b.hp, back = ha - a.hp;
  assert.ok(dealt > 0 && Math.abs(back - dealt * U.thornback.thorns.frac * sim.DMG.thorns.heavy) < 1e-6, `dealt ${dealt}, back ${back}`);
  assert.strictEqual(b.hp, hb - dealt, 'b took only the blow: the retaliation on a did not bounce back');
  const far = put(1, 'heavy', 600, 0); const h3 = a.hp; sim.damage(g, a, 50, 'rocket', 1); assert.ok(far.hp === far.maxHp && a.hp < h3, 'ranged hits bring no retaliation');
  const d = put(0, 'dreadthorn', 1200, 0), r1 = put(1, 'rifle', 1230, 10); r1.cd = 1e6; d.cd = 1e6;
  sim.damage(g, d, 80, 'cannon', 1); assert.ok(r1.hp === r1.maxHp && !(d.burstCd > g.t), 'b3b: a big hit releases no spine burst');
});

// tests/bloomhost-sig.test.js:97. b3b on: the Bulwark heals by its own rule (bulkRegen: 3x the creep regeneration out of
// combat, tests/rework-3b.test.js:180), so the T2 x1.5 is checked on a Thornback and through the Bulwark's 3x.
test('on: Rootheart: the 15% slow hits only enemy ground units standing on its creep; T2 regen is 1.5× the existing rate', () => {
  const sim = loadSim(); sim.setMech7c(false); sim.setBalance7b(false); assert.ok(allOn(sim)); const step = stepper(sim);
  const U = sim.UDEF, R = sim.ROOT, C = sim.CREEP;
  const quiet = () => { const g = sim.newGame('normal', { factions: ['bloomhost', 'lastfist'] }); g.countdown = 0; g.t = 30; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
  const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; return e; };
  const fin = (g, s, type) => { const r = sim.tryBuild(g, s, type); assert.ok(r.ok, r.msg); const b = g.ents.filter(e => e.side === s && e.type === type).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };
  const g = quiet(); seeAll(g); fin(g, 0, 'sigB'); g.creep[0] = [{ k: 'x', u: 900, v: 0, r: 100, R: 100, node: false }];
  const on = put(g, 1, 'tank', 900), off = put(g, 1, 'tank', 1100), air = put(g, 1, 'aircraft', 900), own = put(g, 0, 'bulwark', 900);
  for (const e of [on, off, air, own]) e.cd = 1e6;
  sim.updateRoots(g);
  assert.ok(on.slowT > g.t && Math.abs(on.slow - R.slow) < 1e-9 && on.slowK === 'creep', 'enemy ground unit on creep: 15%');
  assert.ok(!(off.slowT > g.t), 'off the creep: none'); assert.ok(!(air.slowT > g.t), 'aircraft: none'); assert.ok(!(own.slowT > g.t), 'own units: none');
  sim.slowU(g, on, 0.3, 1); sim.updateRoots(g); assert.ok(Math.abs(on.slow - 0.3) < 1e-9);
  const h = quiet(); fin(h, 0, 'sigB'); h.creep[0] = [{ k: 'x', u: 900, v: 0, r: 300, R: 300, node: false }]; sim.setStance(h, 1, 'attack');
  const w = put(h, 1, 'tank', 1000); w.holdU = undefined; w.cd = 1e6; const u0 = w.u; step(h, 1);
  assert.ok(Math.abs((u0 - w.u) - U.tank.speed * (1 - R.slow)) < 1.5, `moved ${u0 - w.u}`);
  const r = quiet(); const rh = fin(r, 0, 'sigB'); assert.strictEqual(sim.creepRegen(r, 0), C.regen);
  rh.tier = 2; assert.ok(Math.abs(sim.creepRegen(r, 0) - C.regen * R.regen) < 1e-12);
  const patch = () => { r.creep[0] = [{ k: 'x', u: 600, v: 0, r: 200, R: 200, node: false }]; };
  patch(); const t = put(r, 0, 'thornback', 600), b = put(r, 0, 'bulwark', 640);
  for (const e of [t, b]) { e.cd = 1e6; e.hp = e.maxHp / 2; e.lastHurt = e.lastAct = -99; }
  const t0 = t.hp, b0 = b.hp; sim.updateCreep(r, 1); patch(); sim.bulkRegen(r, 1);
  assert.ok(Math.abs(t.hp - t0 - t.maxHp * C.regen * R.regen) < 1e-6, `a Thornback healed ${t.hp - t0}`);
  assert.ok(Math.abs(b.hp - b0 - b.maxHp * C.regen * R.regen * sim.BULK.calm) < 1e-6, `a Bulwark healed ${b.hp - b0} (3x the T2 rate)`);
});

// tests/creep.test.js:61. b3b on: the Bulwark has its own creep regeneration (tests/rework-3b.test.js:180); the shared rule
// is checked on a Thornback.
test('on: regeneration: on creep, out of combat (no damage taken or dealt for 5 s), Bloomhost only; the highest heal applies', () => {
  const sim = loadSim(); assert.ok(allOn(sim)); const step = stepper(sim); const C = sim.CREEP;
  const g = sim.newGame('normal', { factions: ['bloomhost', 'lastfist'] }); for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold');
  g.nodes[1].owner = 0; g.nodes[1].prog = 100; step(g, 60);
  const hq = g.sides[0].hq, at = (s, type, du) => { const u = sim.spawnUnit(g, s, type, hq.u + du, hq.v + 40); u.holdU = u.u; u.holdV = u.v; u.cd = 1e6; return u; };
  const a = at(0, 'thornback', 60), b = at(0, 'thornback', C.hiveR + 120);
  const r = sim.spawnUnit(g, 1, 'rifle', g.nodes[1].u - 60, 0); r.holdU = r.u; r.holdV = 0; r.cd = 1e6;
  assert.ok(sim.onCreep(g, 0, r.u, r.v) && sim.onCreep(g, 0, a.u, a.v) && !sim.onCreep(g, 0, b.u, b.v));
  for (const u of [a, b, r]) { u.hp = u.maxHp * 0.5; u.lastHurt = g.t; }
  const h0 = [a.hp, b.hp, r.hp];
  step(g, C.calm - 0.5); assert.strictEqual(a.hp, h0[0], 'nothing while still in combat');
  step(g, 4.5);
  const gained = a.hp - h0[0];
  assert.ok(Math.abs(gained - a.maxHp * C.regen * 4) < a.maxHp * C.regen * 0.6, `on creep, out of combat: +${gained.toFixed(1)}`);
  assert.strictEqual(b.hp, h0[1], 'off creep: none'); assert.strictEqual(r.hp, h0[2], 'Last Fist on the creep: none');
  a.lastAct = g.t; const h1 = a.hp; step(g, 2); assert.strictEqual(a.hp, h1, 'attacking counts as combat');
  const sk = at(0, 'skitterling', 40); sk.hp = sk.maxHp * 0.3; sk.lastHurt = sk.lastAct = -99;
  const med = sim.spawnUnit(g, 0, 'medic', sk.u, sk.v); med.holdU = med.u; med.holdV = med.v;
  const s0 = sk.hp; step(g, 2);
  const rate = (sk.hp - s0) / 2 / sk.maxHp;
  assert.ok(Math.abs(rate - Math.max(C.regen, sim.UDEF.medic.heal)) < 0.002, `heal rate ${rate.toFixed(4)}/s`);
});

// tests/stats.test.js:49. b3b on: a Shardling parries; a parried hit credits nothing, then (parry spent) the rest as before.
test('on: damage dealt: HP and shields actually taken off, credited to the attacker only', () => {
  const sim = loadSim(); assert.ok(allOn(sim));
  const g = sim.newGame('normal', { seed: 3, factions: ['lastfist', 'axiarchs'] }); for (const s of [0, 1]) g.sides[s].aiT = 1e9; g.countdown = 0;
  const z = sim.spawnUnit(g, 1, 'shardling', 800, 0); z.shp = 20; z.maxShp = Math.max(z.maxShp, 20); const hp0 = z.hp;
  sim.damage(g, z, 30, 'rifle', 0); assert.ok(z.shp === 20 && z.hp === hp0 && g.stats.sides[0].dmg === 0, 'a parried hit: nothing taken, nothing credited');
  z.prT = NO_PARRY; sim.damage(g, z, 30, 'rifle', 0);
  const taken = 20 - z.shp + hp0 - z.hp;
  assert.ok(taken > 0);
  assert.ok(Math.abs(g.stats.sides[0].dmg - taken) < 1e-6, `${g.stats.sides[0].dmg} vs ${taken}`);
  assert.strictEqual(g.stats.sides[1].dmg, 0);
  sim.damage(g, z, 1e6, 'rifle', 0);
  assert.ok(g.stats.sides[0].dmg <= taken + hp0 + 20 + 1e-6, 'never more than it had');
});

// tests/factory.test.js:116. b4a on: a Normal or Hard AI keeps its persona's path in about 60% of matches (Part 0,
// tests/rework-4a.test.js:59); Easy keeps it always. Two seeded aggressor matches (both go Assault) train Flame Tanks.
test('on: the AI: Aggressor and Trickster default to Assault, Turtle and Economist to Siege; Assault AIs train Flame Tanks', () => {
  const sim = loadSim(); assert.ok(allOn(sim));
  const b = { type: 'factory', side: 1, kind: 'b', hp: 1 };
  for (const kind of ['aggressor', 'trickster', 'turtle', 'economist']) {
    const P = sim.rollPersona(kind), want = kind === 'aggressor' || kind === 'trickster' ? 'B' : 'A';
    assert.strictEqual(P.paths.factory, want, kind);
    assert.strictEqual(sim.aiPickPath(sim.newGame('easy', { seed: 1 }), 1, b, P, []), want, kind + ' (Easy) picks its default');
    let keep = 0; for (let seed = 1; seed <= 30; seed++) if (sim.aiPickPath(sim.newGame('hard', { seed }), 1, b, P, []) === want) keep++;
    assert.ok(keep > 15 && keep < 30, `${kind} (Hard) keeps its default in most matches, not all: ${keep} of 30`);
  }
  let flames = 0, assault = 0;
  for (const seed of [901, 903]) { // (seeds 900-904 with every switch on: Assault in all five, Flame Tanks in three)
    const g2 = sim.newGame('hard', { seed, autoPlayer: true, autoDiff: 'hard', persona: 'aggressor', autoPersona: 'aggressor' });
    for (let i = 0; i < 30 * 900 && !g2.over; i++) sim.update(g2, 1 / 30);
    for (const s of [0, 1]) flames += g2.log.tot[s].trained.flame || 0;
    assault += g2.log.ev.filter(e => e[2] === 'U' && e[3] === 'factory' && e[6] === 'B').length;
  }
  assert.ok(assault > 0, 'Assault upgrades happen');
  assert.ok(flames > 0, `Flame Tanks trained (${flames})`);
});

// tests/techlab.test.js:123. b4a on: as above, for the Tech Lab.
test('on: the AI: Economist and Trickster default to Air Power, Aggressor and Turtle to Support', () => {
  const sim = loadSim(); assert.ok(allOn(sim));
  const b = { type: 'techlab', side: 1, kind: 'b', hp: 1 };
  for (const kind of ['aggressor', 'trickster', 'turtle', 'economist']) {
    const want = kind === 'economist' || kind === 'trickster' ? 'A' : 'B';
    assert.strictEqual(sim.aiPickPath(sim.newGame('easy', { seed: 1 }), 1, b, sim.rollPersona(kind), []), want, kind + ' (Easy)');
    let keep = 0; for (let seed = 1; seed <= 30; seed++) if (sim.aiPickPath(sim.newGame('hard', { seed }), 1, b, sim.rollPersona(kind), []) === want) keep++;
    assert.ok(keep > 15 && keep < 30, `${kind} (Hard) keeps its default in most matches, not all: ${keep} of 30`);
  }
});

// tests/hardhuman.test.js:77. b4a on: without the rule the War Factory takes its rolled path (Part 0); with it an infantry
// flood still sends it down Assault (counters come first).
test('on: counter: an infantry flood sends the War Factory down the Assault path (Flame Tanks); without the rule it keeps its plan', () => {
  const s = loadSim(); assert.ok(allOn(s));
  let kept = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const g = s.newGame('hard', { seed, factions: ['lastfist', 'lastfist'] }); g.countdown = 0;
    const P = g.sides[1].persona; P.paths = { barracks: 'A', factory: 'A', techlab: 'A' };
    const fac = Object.assign({}, g.sides[1].hq, { type: 'factory', id: -1 }), theirs = Array.from({ length: 10 }, () => ({ type: 'rifle', u: 500, w: 1 }));
    P.dial.fix.counter = false; const plan = s.aiPickPath(g, 1, fac, P, theirs);
    assert.strictEqual(plan, s.aiPathRoll(g, 1, 'factory', 'A'), 'without the rule: its plan (the match\'s roll)');
    if (plan === 'A') kept++;
    P.dial.fix.counter = true; assert.strictEqual(s.aiPickPath(g, 1, fac, P, theirs), 'B', `seed ${seed}: the flood sends it to Assault`);
  }
  assert.ok(kept > 0, 'the plan is Siege in some matches, so the rule is what turns it');
});

// tests/ax-trees.test.js:49. b3b on: the Bastion's barrier would take the Heavy's rocket (tests/rework-3b.test.js:125);
// it is down here, so the rocket reaches the Bastion.
test('on: disrupt: a Parallax blow makes the target deal less damage for a while; it never stacks past the cap', () => {
  const sim = loadSim(); assert.ok(allOn(sim)); const step = stepper(sim); const U = sim.UDEF;
  const g = sim.newGame('normal', { factions: ['axiarchs', 'lastfist'] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); seeAll(g);
  const put = (s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; return e; };
  const p = put(0, 'parallax', 600, 0), r = put(1, 'heavy', 620, 0); r.cd = p.cd = 1e6; r.hp = r.maxHp = 1e5;
  const P = sim.rwD(g, 'parallax'); sim.fire(g, p, r, P);
  assert.ok(Math.abs(r.dis - U.parallax.disrupt.amt) < 1e-9 && r.disT > g.t, 'disrupted');
  for (let i = 0; i < 5; i++) sim.fire(g, p, r, P); assert.ok(r.dis <= sim.DISRUPT.cap + 1e-9, 'never past the cap');
  sim.disrupt(g, r, { amt: 0.9, dur: 1 }); assert.strictEqual(r.dis, sim.DISRUPT.cap, 'even a stronger one is capped');
  sim.disrupt(g, r, { amt: 0.1, dur: 10 }); assert.strictEqual(r.dis, sim.DISRUPT.cap, 'a weaker one never lowers it'); assert.ok(r.disT >= g.t + 9, 'the later end is kept');
  const b = put(0, 'bastion', 760, 0); b.cd = 1e6; b.bwHp = 0; b.bwHit = -99; b.bwDn = 1e9; b.bwF = -1; const h0 = b.shp + b.hp; // barrier down
  sim.fire(g, r, b, sim.rwD(g, 'heavy')); for (let i = 0; i < 60 && g.projs.length; i++) sim.update(g, 1 / 30);
  const dealt = h0 - (b.shp + b.hp), full = U.heavy.dmg * sim.DMG.rocket.vehicle;
  assert.ok(Math.abs(dealt - full * (1 - sim.DISRUPT.cap)) < 1, `a disrupted Heavy's rocket: ${dealt.toFixed(1)} of ${full}`);
  step(g, 11); assert.ok(!(r.disT > g.t), 'it wears off');
});

// tests/orders-weapons.test.js:138 (and :153, the Medevac part pinned to b6side and b6art off on one seed). With every
// switch on, two units move past their target by design: a batch 3b Dreadthorn charges through what it hits (TRAMPLE)
// and a batch 4a Wraithwing hops around it (HOP); for them "not walking past" means staying in the fight, within reach.
test('on: every combat unit stops to fight an enemy it can hit instead of walking past it; non-combat units stay with the army', () => {
  const sim = loadSim(); sim.BREAK.prod.on = false; assert.ok(allOn(sim)); const step = stepper(sim); const U = sim.UDEF;
  const NON_COMBAT = ['medic', 'drone'], AIR_ONLY = ['interceptor'];
  const slack = { dreadthorn: sim.TRAMPLE.knock * 2, wraithwing: sim.HOP.len };
  const finish = (g, s, k) => { assert.ok(sim.tryBuild(g, s, k).ok, k); const b = g.ents.filter(e => e.side === s && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; return b; };
  const walkUp = (type, kind) => {
    const d = U[type], g = sim.newGame('normal', { factions: [d.fac || 'lastfist', 'lastfist'] }); g.countdown = 0;
    for (const s of g.sides) s.aiT = 1e9;
    sim.setStance(g, 1, 'hold'); sim.setStance(g, 0, 'attack');
    let t;
    if (kind === 'b') { g.sides[1].res.c = g.sides[1].res.e = 9000; t = finish(g, 1, 'refinery'); t.v = 0; t.hp = t.maxHp = 1e6; }
    else { t = sim.spawnUnit(g, 1, d.hitsGround === false ? 'aircraft' : 'tank', 1300, 0); t.holdU = 1300; t.holdV = 0; t.cd = 1e9; t.hp = t.maxHp = 1e6; }
    const u = sim.spawnUnit(g, 0, type, t.u - 500, 0); u.laneV = 0; u.hp = u.maxHp = 1e7;
    for (let i = 0; i < 30 * 35; i++) { sim.update(g, 1 / 30); seeAll(g); }
    return { dealt: 1e6 - t.hp, past: u.u > t.u + 20 + (slack[type] || 0), u, t };
  };
  for (const type of sim.UNIT_ORDER) {
    if (NON_COMBAT.includes(type)) continue;
    for (const kind of AIR_ONLY.includes(type) ? [] : ['u', 'b']) {
      const r = walkUp(type, kind);
      assert.ok(r.dealt > 0 && !r.past, `${type} vs ${kind === 'b' ? 'a building' : 'a unit'}: dealt ${r.dealt.toFixed(0)}, at ${r.u.u.toFixed(0)}, target ${r.t.u.toFixed(0)}`);
    }
  }
  const g = sim.newGame('normal', { factions: ['lastfist', 'lastfist'] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); seeAll(g);
  const i = sim.spawnUnit(g, 0, 'interceptor', 600, 0), a = sim.spawnUnit(g, 1, 'aircraft', 700, 0); a.holdU = 700; a.holdV = 0; a.cd = 1e6; a.hp = a.maxHp = 1e5;
  step(g, 3); assert.ok(a.hp < a.maxHp && i.hp > 0, 'an Interceptor shoots an enemy aircraft in range');
  // Medevacs and Recon Drones stay with the army on Hold, Attack and Retreat: three seeded SIMs, every stance
  for (const seed of [7, 8, 9]) {
    const ss = loadSim({ random: mulberry(seed) }), sstep = stepper(ss);
    for (const st of ['hold', 'attack', 'retreat']) {
      const h = ss.newGame('normal', { factions: ['lastfist', 'lastfist'] }); h.countdown = 0; for (const s of h.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } ss.setStance(h, 1, 'hold'); ss.setStance(h, 0, st);
      const front = ss.spawnUnit(h, 0, 'tank', 700, 0); front.holdU = 700; front.holdV = 0;
      const m = ss.spawnUnit(h, 0, 'medic', 500, 0), r = ss.spawnUnit(h, 0, 'drone', 500, 0), inf = ss.spawnUnit(h, 0, 'rifle', 650, 0); inf.holdU = 650; inf.holdV = 0;
      sstep(h, 30);
      for (const e of [m, r]) assert.ok(e.u < Math.max(front.u, inf.u) + 40, `seed ${seed}: ${e.type} on ${st} stays with the army (at ${e.u.toFixed(0)}, front ${front.u.toFixed(0)})`);
    }
  }
});

// tests/redesign.test.js:125 (b2b pinned off there). b2b on: the Titan plants beside enemy buildings to breach them
// (tests/rework-2b.test.js:40); in AI play it still goes through planting (1), planted (2) and unplanting (3) and fires.
test('on: P8 Titan in AI play: the AI\'s Titans plant and unplant on their own', () => {
  const S = loadSim({ random: mulberry(3) }); assert.ok(allOn(S));
  const g = S.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'aggressor', autoPersona: 'turtle', factions: ['lastfist', 'lastfist'], ai: 'default', autoAi: 'default' });
  g.countdown = 0; for (const s of [0, 1]) for (let i = 0; i < 3; i++) S.spawnUnit(g, s, 'titan', S.rallyU(s) + (i - 1) * 20, (i - 1) * 30);
  const seen = new Set(); let fired = 0;
  for (let i = 0; i < 30 * 600 && !g.over; i++) { S.update(g, 1 / 30); for (const e of g.ents) if (e.type === 'titan') seen.add(e.siege || 0); for (const p of g.projs) if (p.weapon === 'siege' && !p.seen) { p.seen = 1; fired++; } }
  assert.ok(seen.has(1) && seen.has(2) && seen.has(3), `states seen ${[...seen]}`);
  assert.ok(fired > 0, 'and they fire');
});

// tests/techlab.test.js:62 (b4b pinned off). b4b on: the Leviathan flies bombing runs across its target
// (tests/rework-4b.test.js:69); it still prefers buildings, hits them 2x, never hits aircraft and obeys the HQ shield.
test('on: Leviathan: bombs what is right below it (40 range), four bombs in a line (v2.37), 2× on buildings, prefers buildings, cannot hit air, obeys the HQ shield', () => {
  const sim = loadSim(); assert.ok(allOn(sim)); const step = stepper(sim);
  const g = sim.newGame('normal'); for (const s of [0, 1]) { g.sides[s].aiT = 1e9; g.fog[s].exp.fill(1); g.fog[s].vis.fill(1); } g.t = 300;
  const d = sim.rwD(g, 'leviathan');
  assert.ok(d.hitsAir === false && sim.DMG.bomb.air === 0 && sim.DMG.bomb.building === 2, 'bombs: 2x on buildings, nothing on aircraft');
  sim.tryBuild(g, 1, 'barracks'); const bar = g.ents.find(e => e.side === 1 && e.type === 'barracks'); bar.built = true; bar.progress = 1; bar.u = 850; bar.v = 0;
  const lv = sim.spawnUnit(g, 0, 'leviathan', bar.u, bar.v);
  const r = sim.spawnUnit(g, 1, 'rifle', bar.u + 10, bar.v), plane = sim.spawnUnit(g, 1, 'aircraft', bar.u, bar.v); plane.cd = 1e6; plane.holdU = plane.u; plane.holdV = plane.v; r.cd = 1e6;
  const foes = g.ents.filter(e => e.side === 1);
  assert.strictEqual(sim.acquire(g, lv, d, foes).best, bar, 'the building first');
  const h0 = bar.hp; sim.setStance(g, 0, 'hold'); lv.holdU = lv.u; lv.holdV = lv.v;
  let ran = false; for (let i = 0; i < 30 * 8; i++) { sim.update(g, 1 / 30); if (lv.lvR) ran = true; }
  assert.ok(ran, 'a bombing run (b4b)');
  assert.ok(h0 - bar.hp > 0, `the bombs hit the Barracks (${(h0 - bar.hp).toFixed(0)})`);
  assert.strictEqual(plane.hp, plane.maxHp, 'aircraft untouched');
  const hq = g.ents.find(e => e.side === 1 && e.type === 'hq'); sim.refreshShields(g);
  assert.ok(hq.shielded); bar.u = 5000; r.u = r.holdU = 5000; lv.u = hq.u; lv.holdU = hq.u; lv.v = hq.v; lv.holdV = hq.v; const q0 = hq.hp; step(g, 6);
  assert.strictEqual(hq.hp, q0, 'a shielded HQ takes nothing');
});

// tests/fog.test.js:137 (b6side pinned off). b6side on: the entity list is shuffled each tick from a stream whose draws
// depend on how many entities there are, so the hidden army differs in where it stands and what it is, not in its size.
test('on: AI decisions use only its own vision (identical choices whatever is hidden from it)', () => {
  let seed = 0;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const det = loadSim({ random: () => rnd() }); assert.ok(allOn(det)); const STEP = 1 / 30;
  const make = x => {
    seed = 42; const g = det.newGame('hard');
    for (let i = 0; i < x.n; i++) { const t = det.spawnUnit(g, 0, x.type, x.u + i * 8, x.v || 0); t.holdU = t.u; t.holdV = t.v; }
    g.sides[0].stance = 'hold'; g.sides[0].aiT = 1e9;
    det.seedGame(g, 7); g.seed = 7; return g;
  };
  const step = g => { seed = g.seed; det.update(g, STEP); g.seed = seed; };
  const aiState = g => JSON.stringify({ res: g.sides[1].res, stance: g.sides[1].stance, push: g.sides[1].pushTo,
    ents: g.ents.filter(e => e.side === 1).sort((x, y) => x.id - y.id).map(e => [e.kind, e.type, e.tier, Math.round(e.u * 100), e.queue ? e.queue.join() : '']) });
  const seen = G => G.ents.some(e => e.side === 0 && e.kind === 'u' && det.visibleTo(G, 1, e));
  const A = make({ n: 12, u: 280, type: 'tank' }), B = make({ n: 12, u: 180, v: 20, type: 'rifle' }); // two different armies hidden in the player's base
  let steps = 0;
  for (; steps < 90 * 30; steps++) {
    step(A); step(B);
    if (seen(A) || seen(B)) break;
    assert.strictEqual(aiState(B), aiState(A), `AI diverged at ${steps * STEP}s while the army was hidden`);
  }
  assert.ok(steps * STEP >= 30, `compared for ${(steps * STEP).toFixed(1)} s of hidden army`);
  const C = make({ n: 12, u: 1000, type: 'tank' }), A2 = make({ n: 12, u: 280, type: 'tank' }); // control: the same army where the AI can see it
  let differs = false;
  for (let i = 0; i < 60 * 30 && !differs; i++) { step(C); step(A2); differs = aiState(C) !== aiState(A2); }
  assert.ok(differs, 'a visible army does change what the AI does');
});

// tests/rework-2a.test.js:26 (artTelegraph pinned off). Telegraph on: deploy and pack-up the same, the shells marked.
test('on: Artillery deploy: it deploys before it fires and packs up before it moves; off: it fires at once', () => {
  const s = loadSim(); assert.ok(allOn(s)); const step = (g, sec) => { for (let i = 0; i < Math.round(sec * 60); i++) s.rangeStep(g); };
  const g = s.rangeGame({ factions: ['lastfist', 'lastfist'] });
  const a = s.rangeUnit(g, 0, 'artillery', 640, 0); s.rangeUnits(g, 1, 'rifle', 1000, 0, 4);
  g.sides[1].hush = true; s.rangeMode(g, 0, 'attack');
  step(g, 0.5);
  assert.strictEqual(a.dep, 1, 'deploying'); assert.strictEqual(g.projs.length, 0, 'no shot while deploying'); assert.ok(!(g.mk || []).length, 'no marker either');
  step(g, s.ART.deploy); assert.strictEqual(a.dep, 2, 'deployed');
  step(g, 0.4); assert.ok(g.projs.length > 0 && g.mk.length > 0, 'fires once deployed, its shells marked');
  const u0 = a.u; g.sides[0].mode = 'hold'; s.command(g, 0, [a.id], 'retreat');
  step(g, 0.5); assert.strictEqual(a.dep, 3, 'packing up'); assert.strictEqual(a.u, u0, 'does not move while packing');
  step(g, s.ART.pack + 0.1); assert.ok(!a.dep, 'packed'); step(g, 0.5); assert.ok(a.u < u0, 'then moves');
});

// tests/rework-2a.test.js:44 (artDeploy pinned off). Deploy on: the first shell comes after the deploy; the marker rules hold.
test('on: Telegraphed shells: a marker from firing to impact, at least ART.fly s; a unit that steps out takes nothing', () => {
  const s = loadSim(); assert.ok(allOn(s)); const step = (g, sec) => { for (let i = 0; i < Math.round(sec * 60); i++) s.rangeStep(g); };
  const g = s.rangeGame({ factions: ['lastfist', 'lastfist'] });
  const a = s.rangeUnit(g, 0, 'artillery', 640, 0), r = s.rangeUnit(g, 1, 'heavy', 1000, 0);
  g.sides[1].hush = true; s.rangeMode(g, 0, 'attack');
  let n = 0; while (!g.projs.length && n++ < 600) s.rangeStep(g);
  assert.ok(n / 60 >= s.ART.deploy - 0.1, `the first shell after the deploy (${(n / 60).toFixed(2)} s)`);
  assert.ok(g.mk && g.mk.length === g.projs.length && g.projs.length > 0, 'one marker per shell');
  for (const p of g.projs) { assert.ok(p.T >= s.ART.fly - 1e-9, 'flight time'); assert.ok(g.mk.some(m => m.u === p.tu && m.v === p.tv && m.r === p.splash), 'the marker is where the shell lands'); }
  r.u = 1300; r.holdU = 1300;
  step(g, 0.2); g.sides[0].hush = true; step(g, 3);
  assert.strictEqual(r.hp, r.maxHp, 'no damage outside the marker');
  assert.strictEqual(g.mk.length, 0, 'markers cleared at impact');
  const h = s.newGame('normal', { seed: 3, countdown: 0 }); h.sides[1].aiT = 1e9; h.sides[1].stance = 'hold';
  const run = sec => { for (let i = 0; i < sec * 60; i++) s.update(h, s.TICK); };
  const q = s.spawnUnit(h, 1, 'rifle', s.rallyU(1, h), 0); run(6);
  const at = [q.u, q.v]; h.mk = [{ u: q.u, v: q.v, r: 40, side: 0, t0: h.t, t1: h.t + 3 }]; run(1.5);
  assert.ok(Math.hypot(q.u - at[0], q.v - at[1]) < 2, 'an AI unit inside an enemy marker stays where it was');
});

// tests/rework-3b.test.js:56, rework-4a.test.js:51, rework-4b.test.js:48 and rework-5b.test.js:154: seeded Test Range
// skirmishes hashed with b5c, b6side and b6art off (and later batches off). With every switch on: each of the eight plays
// the same every time (two runs, two SIMs, same hash), is a real fight (both sides lose health), and the batch 6b side fix
// is in it (the hash differs from the same skirmish with b6side off).
const SKIRM = {
  a: { seed: 11, f: ['axiarchs', 'lastfist'], u: [['riftstalker', 600, -20, 3], ['lancer', 560, 10, 3]], v: [['sniper', 820, -20, 3], ['artillery', 900, 20, 2], ['heavy', 780, 30, 3], ['rifle', 760, -40, 4]] },
  b: { seed: 11, f: ['bloomhost', 'axiarchs'], b: [[0, 'bloomhost', 'refinery', 520, 0]], u: [['dreadthorn', 560, 0, 2], ['bulwark', 600, -30, 3], ['skitterling', 580, 30, 6]], v: [['bastion', 800, -10, 2], ['shardling', 760, 20, 5], ['lancer', 860, 0, 4], ['marksman', 900, -30, 2]] },
  c: { seed: 13, f: ['lastfist', 'bloomhost'], u: [['sniper', 600, -20, 3], ['aircraft', 560, 10, 2], ['rifle', 640, 20, 4], ['tank', 620, -40, 1]], v: [['bilecaster', 840, -10, 3], ['skitterling', 800, 20, 6], ['spitter', 860, 30, 3], ['bulwark', 790, -30, 1]] },
  d: { seed: 13, f: ['axiarchs', 'lastfist'], u: [['marksman', 560, -20, 2], ['wraithwing', 600, 10, 3], ['lancer', 620, 20, 3], ['shardling', 640, -30, 3]], v: [['tank', 840, -10, 2], ['rifle', 800, 20, 5], ['heavy', 820, 40, 3], ['hydra', 880, 0, 1]] },
  e: { seed: 17, f: ['lastfist', 'bloomhost'], b: [[0, 'lastfist', 'refinery', 420, 0], [1, 'bloomhost', 'refinery', 1020, 0]], u: [['leviathan', 600, -20, 1], ['interceptor', 580, 30, 2], ['rifle', 640, 20, 4], ['heavy', 620, -40, 2]], v: [['broodtyrant', 840, -10, 2], ['worldrender', 880, 20, 1], ['skitterling', 800, 20, 4], ['spitter', 860, 30, 2]] },
  f: { seed: 17, f: ['axiarchs', 'lastfist'], b: [[1, 'lastfist', 'barracks', 1020, 0]], u: [['voidcarrier', 560, -20, 1], ['sovereign', 520, 10, 1], ['lancer', 620, 20, 3], ['shardling', 640, -30, 3]], v: [['tank', 840, -10, 2], ['rifle', 800, 20, 5], ['heavy', 820, 40, 3], ['hydra', 880, 0, 1]] },
  g: { seed: 17, f: ['bloomhost', 'lastfist'], grid: [4, 12, 14], u: [['skitterling', 560, -20, 12], ['spitter', 520, 30, 4], ['needlewing', 540, 60, 4]], v: [['rifle', 820, -10, 6], ['aircraft', 860, 20, 2], ['interceptor', 880, 40, 1], ['tank', 860, -40, 1]] },
  h: { seed: 17, f: ['axiarchs', 'bloomhost'], grid: [4, 12, 14], u: [['shardling', 600, -20, 3], ['lancer', 580, 20, 3], ['wraithwing', 560, 50, 2]], v: [['skitterling', 820, 0, 10], ['thornback', 860, -30, 1], ['dreadthorn', 880, 20, 1], ['razorwing', 840, 50, 2], ['cloudwing', 860, 60, 1]] },
};
function skirmOn(s, kind, rw) { // as the original helpers, with `rw` on top of the defaults (nothing: every switch on)
  const S = SKIRM[kind], [k, du, dv] = S.grid || [3, 14, 16];
  const g = s.rangeGame({ seed: S.seed, factions: S.f, rework: rw });
  for (const [sd, f, r, u, v] of S.b || []) s.rangeBuilding(g, sd, f, r, u, v);
  for (const [t, u, v, n] of S.u) for (let i = 0; i < n; i++) s.rangeUnit(g, 0, t, u + (i % k) * du, v + Math.floor(i / k) * dv);
  for (const [t, u, v, n] of S.v) for (let i = 0; i < n; i++) s.rangeUnit(g, 1, t, u + (i % k) * du, v + Math.floor(i / k) * dv);
  const hp = sd => g.ents.filter(e => e.kind === 'u' && e.side === sd).reduce((a, e) => a + Math.max(0, e.hp) + (e.shp || 0), 0), hp0 = [hp(0), hp(1)];
  s.rangeMode(g, 0, 'attack'); s.rangeMode(g, 1, 'attack');
  const h = crypto.createHash('sha256');
  for (let i = 1; i <= 60 * 40; i++) { s.rangeStep(g); g.events.length = 0; if (i % 60 === 0) h.update(s.serialize(g, {})); }
  return { hash: h.digest('hex'), lost: [hp0[0] - hp(0), hp0[1] - hp(1)], rw: g.rw };
}
test('on: seeded skirmishes: b3a and b3b off hash as on v2.84; on, as recorded at v2.85 (Part 0 and batch 3b); all with batch 4a off (v2.86)', () => skirmCheck(['a', 'b']));
test('on: seeded skirmishes: b4a off hashes as on v2.85; on, as recorded at v2.86 (d re-recorded at v2.87, Part 0); all with batch 4b off', () => skirmCheck(['c', 'd']));
test('on: seeded skirmishes: b4b off hashes as on v2.86; on, as recorded at v2.87', () => skirmCheck(['e', 'f']));
test('on: seeded skirmishes: b5b off hashes as on v2.87; on, as recorded at v2.88', () => skirmCheck(['g', 'h']));
function skirmCheck(kinds) {
  const s1 = loadSim(), s2 = loadSim(); assert.ok(allOn(s1));
  for (const kind of kinds) {
    const a = skirmOn(s1, kind), b = skirmOn(s2, kind), c = skirmOn(s1, kind);
    assert.ok(Object.values(a.rw).every(v => v === true), `${kind}: every switch on`);
    assert.ok(a.hash === b.hash && a.hash === c.hash, `${kind}: the same skirmish every time`);
    assert.ok(a.lost[0] > 0 && a.lost[1] > 0, `${kind}: both sides take losses (${a.lost.map(x => x.toFixed(0))})`);
    assert.notStrictEqual(skirmOn(s1, kind, { b6side: false }).hash, a.hash, `${kind}: b6side is part of it`);
  }
}
