// v2.87 (docs/FACTION_REWORK.md batch 4b): Part 0 (anti-air specialists and building guns track a hopping batch 4a Wraithwing),
// the Leviathan (bombing runs), the Brood Tyrant (pustules), the Worldrender (lands), the Voidcarrier (pure support) and the
// Astral Sovereign (judgement beam), behind REWORK.b4b (per game, g.rw.b4b). Played on Test Range games (the real SIM).
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');

const step = (s, g, sec) => { for (let i = 0; i < Math.round(sec * 60); i++) s.rangeStep(g); };
const until = (s, g, f, sec = 20) => { for (let i = 0; i < sec * 60; i++) { if (f()) return true; s.rangeStep(g); } return f(); };
const tough = (...es) => es.forEach(e => { e.hp = e.maxHp = 1e6; });

test('switch: per game; b4b off plays the v2.86 units (UDEF untouched), on the batch\'s definitions; saves', () => {
  const s = loadSim();
  assert.strictEqual(s.rwInit().b4b, true, 'on by default');
  const on = s.rangeGame({ factions: ['lastfist', 'axiarchs'] }), off = s.rangeGame({ factions: ['lastfist', 'axiarchs'], rework: { b4b: false } });
  const lv = s.rwD(on, 'leviathan'); assert.ok(lv.bombRun && lv.carpet.n === 4 && lv.range === s.LEV.reach && !s.rwD(off, 'leviathan').bombRun, 'P10\'s carpet kept');
  const bt = s.rwD(on, 'broodtyrant'); assert.ok(bt.infest && bt.dmg === 40 && bt.splash === 24 && bt.range === 150 && bt.cd === 2.4 && s.UDEF.broodtyrant.dmg === 60);
  const wr = s.rwD(on, 'worldrender'); assert.ok(wr.lands && wr.devour.frac === 0.3 && wr.devour.cap === 40);
  const vc = s.rwD(on, 'voidcarrier'); assert.ok(vc.weapon === 'vbolt' && vc.dmg === 18 && vc.cd === 1.4 && vc.range === 140 && vc.hitsAir && !vc.splash && !vc.preferB && vc.node.r === 120 && s.UDEF.voidcarrier.preferB, 'UDEF keeps the old Voidcarrier');
  const sv = s.rwD(on, 'sovereign'); assert.ok(sv.judge && sv.beam && sv.dmg === 260 && sv.range === 320 && sv.charge === 2.5 && !sv.hitsAir && !sv.splash);
  const g = s.newGame('normal', { seed: 5 });
  assert.strictEqual(s.deserialize(s.serialize(g, {})).rw.b4b, true);
  const o = JSON.parse(s.serialize(g, {})); delete o.rw.b4b; assert.strictEqual(s.deserialize(JSON.stringify(o)).rw.b4b, false, 'a v2.86 save resumes with b4b off');
  const g0 = s.newGame('normal', { seed: 5, rework: { b4b: false } }); assert.ok(!('b4b' in JSON.parse(s.serialize(g0, {})).rw), 'a b4b-off save leaves the key out');
});

// Seeded skirmishes (the Test Range, 40 s, the state hashed every second). With b4b off they hash exactly as on v2.86's
// index.html (checked against the v2.86 build when recorded, EE_HTML); with it on, recorded at v2.87.
function skirm(s, kind, rw) {
  const S = kind === 'e' ? { f: ['lastfist', 'bloomhost'], b: [[0, 'lastfist', 'refinery', 420, 0], [1, 'bloomhost', 'refinery', 1020, 0]], u: [['leviathan', 600, -20, 1], ['interceptor', 580, 30, 2], ['rifle', 640, 20, 4], ['heavy', 620, -40, 2]], v: [['broodtyrant', 840, -10, 2], ['worldrender', 880, 20, 1], ['skitterling', 800, 20, 4], ['spitter', 860, 30, 2]] }
    : { f: ['axiarchs', 'lastfist'], b: [[1, 'lastfist', 'barracks', 1020, 0]], u: [['voidcarrier', 560, -20, 1], ['sovereign', 520, 10, 1], ['lancer', 620, 20, 3], ['shardling', 640, -30, 3]], v: [['tank', 840, -10, 2], ['rifle', 800, 20, 5], ['heavy', 820, 40, 3], ['hydra', 880, 0, 1]] };
  const g = s.rangeGame({ seed: 17, factions: S.f, rework: Object.assign({ b5c: false, b6side: false, b6art: false, b6hq: false, b6c: false, b6ai: false, b6d: false }, rw) }) /* v2.90: pinned before batch 5c (its key would be saved) */;
  for (const [k, f, r, u, v] of S.b) s.rangeBuilding(g, k, f, r, u, v);
  for (const [t, u, v, n] of S.u) for (let i = 0; i < n; i++) s.rangeUnit(g, 0, t, u + (i % 3) * 14, v + Math.floor(i / 3) * 16);
  for (const [t, u, v, n] of S.v) for (let i = 0; i < n; i++) s.rangeUnit(g, 1, t, u + (i % 3) * 14, v + Math.floor(i / 3) * 16);
  s.rangeMode(g, 0, 'attack'); s.rangeMode(g, 1, 'attack');
  const h = crypto.createHash('sha256');
  for (let i = 1; i <= 60 * 40; i++) { s.rangeStep(g); g.events.length = 0; if (i % 60 === 0) h.update(s.serialize(g, {})); }
  return h.digest('hex');
}
const SK = {
  e0: '2584f2b4f397048264cb22d83581e8e35a13526f6f1096bbe5fbe547524fc1f1', // Leviathans, Interceptors vs Brood Tyrants, a Worldrender, b4b off: v2.86's
  f0: '2c366c3c0676cc1b2113aa637d89e81390764afaa85f957504353240931f1661', // a Voidcarrier, a Sovereign vs a Last Fist army, b4b off: v2.86's
  e1: 'c550b4aafc7e729252df45a5dc71156a73fe9a58e8be0805140a463dc9ad48e7', // b4b on
  f1: 'dcc1ab5f2bdb3f717f406aad4249927c4d8608f46083473b1b990039bf31ed3b', // b4b on
};
test('seeded skirmishes: b4b off hashes as on v2.86; on, as recorded at v2.87', () => {
  const s = loadSim();
  assert.strictEqual(skirm(s, 'e', { b4b: false, b5b: false }), SK.e0);
  assert.strictEqual(skirm(s, 'f', { b4b: false, b5b: false }), SK.f0);
  assert.strictEqual(skirm(s, 'e', { b5b: false }), SK.e1);
  assert.strictEqual(skirm(s, 'f', { b5b: false }), SK.f1);
});

test('Part 0: Hydras, Interceptors and building guns track a hopping Wraithwing (no re-acquire delay); other units still wait it out; shots in flight still miss', () => {
  const s = loadSim();
  assert.ok(s.aaTrack({ kind: 'b' }, {}) && s.aaTrack({ kind: 'u' }, s.UDEF.hydra) && s.aaTrack({ kind: 'u' }, s.UDEF.interceptor) && !s.aaTrack({ kind: 'u' }, s.UDEF.heavy) && !s.aaTrack({ kind: 'u' }, s.UDEF.rifle));
  const g = s.rangeGame({ factions: ['lastfist', 'axiarchs'] });
  const W = s.rangeUnit(g, 1, 'wraithwing', 700, 0), H = s.rangeUnit(g, 0, 'hydra', 600, 0), I = s.rangeUnit(g, 0, 'interceptor', 610, 20), V = s.rangeUnit(g, 0, 'heavy', 620, -20);
  const B = s.rangeBuilding(g, 0, 'lastfist', 'turret', 560, 0); B.built = true;
  W.wwT = g.t + 1; // just hopped
  for (const [e, ok] of [[H, true], [I, true], [V, false]]) assert.strictEqual(s.ctlCanHit(g, e, s.rwD(g, e.type), W), ok, e.type);
  const gun = s.BD('lastfist', 'turret').gun[1]; assert.ok(s.ctlCanHit(g, B, gun, W), 'a Turret');
  const foes = [W];
  assert.strictEqual(s.acquire(g, H, s.rwD(g, 'hydra'), foes).best, W, 'the Hydra keeps it'); assert.strictEqual(s.acquire(g, V, s.rwD(g, 'heavy'), foes).best, null, 'a Heavy waits');
});

test('Leviathan: a bombing run straight across its target, its carpet centred on it, on 120 beyond, a turn without bombs, back again', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['lastfist', 'bloomhost'] });
  const L = s.rangeUnit(g, 0, 'leviathan', 500, 0), B = s.rangeBuilding(g, 1, 'bloomhost', 'refinery', 680, 0); tough(L); B.hp = B.maxHp = 1e5; B.built = true;
  s.rangeMode(g, 0, 'attack');
  assert.ok(until(s, g, () => L.lvR, 10), 'a run starts');
  const bombs = []; let turned = false, maxPast = 0, dropsWhileTurning = 0, passes = 0;
  for (let i = 0; i < 60 * 40; i++) {
    const n0 = g.projs.length, ph0 = L.lvR && L.lvR.ph; s.rangeStep(g);
    const nb = g.projs.filter(p => p.carpet && !p.seen); nb.forEach(p => { p.seen = 1; bombs.push({ tu: p.tu, hd: L.lvR ? L.lvR.hd : 0, ph: ph0 }); if (ph0 === 1) dropsWhileTurning++; });
    if (L.lvR && L.lvR.ph === 1) turned = true;
    if (L.lvR && L.lvR.ph === 0 && L.lvR.hd > 0) maxPast = Math.max(maxPast, L.u - B.u);
    if (ph0 === 1 && L.lvR && L.lvR.ph === 0) passes++;
  }
  assert.ok(turned && passes >= 2, `it turned and came back (${passes} turns)`);
  assert.strictEqual(dropsWhileTurning, 0, 'no bombs while turning');
  assert.ok(maxPast > 100 && maxPast < 140, `on about 120 beyond (${maxPast.toFixed(0)})`);
  const first = bombs.slice(0, 4).map(b => b.tu).sort((a, b) => a - b), mid = (first[0] + first[3]) / 2;
  assert.ok(Math.abs(mid - B.u) < 6 && first[3] - first[0] > 70, `a line centred on the target (${first.map(x => x.toFixed(0))})`);
  assert.ok(B.hp < 1e5, 'it hits');
  // AI side: Interceptors escort its Leviathans whatever the stance
  const h = s.rangeGame({ factions: ['lastfist', 'lastfist'] }); h.sides[1].direct = false; h.sides[1].stance = 'hold';
  const L2 = s.rangeUnit(h, 1, 'leviathan', 900, 40), I2 = s.rangeUnit(h, 1, 'interceptor', 1300, -60); L2.po = I2.po = undefined;
  step(s, h, 8); assert.ok(Math.hypot(I2.u - L2.u, I2.v - L2.v) < 40, `the Interceptor flies with it (${Math.hypot(I2.u - L2.u, I2.v - L2.v).toFixed(0)})`);
});

test('Brood Tyrant: 40 to units (splash 24); 30 to a building and a pustule (up to 3, 6/s each); Repair clears them; a fall bursts them into Mites (2 each, up to 6)', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const T = s.rangeUnit(g, 0, 'broodtyrant', 500, 0), B = s.rangeBuilding(g, 1, 'lastfist', 'barracks', 640, 0); tough(T); B.built = true; B.hp = B.maxHp = 1e5;
  s.rangeMode(g, 0, 'attack');
  assert.ok(until(s, g, () => B.pus === 1, 10), 'a pustule sticks'); const h1 = B.hp;
  assert.ok(Math.abs(1e5 - h1 - 30) < 2, `30 to the building (${(1e5 - h1).toFixed(1)})`);
  assert.ok(until(s, g, () => B.pus === 3, 12)); step(s, g, 5); assert.strictEqual(B.pus, 3, 'never more than 3');
  const a = B.hp; T.cd = 1e9; step(s, g, 1); assert.ok(Math.abs(a - B.hp - 18) < 1.5, `3 × 6/s (${(a - B.hp).toFixed(1)})`);
  g.sides[1].res.c = 1e6; assert.ok(s.tryRepair(g, 1, B).ok); s.rangeStep(g); assert.ok(!B.pus, 'paid Repair clears them');
  // a unit: 40, splash on its neighbour
  const g2 = s.rangeGame({ factions: ['bloomhost', 'lastfist'] }); const T2 = s.rangeUnit(g2, 0, 'broodtyrant', 500, 0), R = s.rangeUnit(g2, 1, 'heavy', 630, 0), R2 = s.rangeUnit(g2, 1, 'heavy', 640, 8); tough(T2, R, R2);
  s.rangeMode(g2, 0, 'attack'); assert.ok(until(s, g2, () => R.hp < 1e6 || R2.hp < 1e6, 10));
  step(s, g2, 0.1); const hit = Math.max(1e6 - R.hp, 1e6 - R2.hp), spl = Math.min(1e6 - R.hp, 1e6 - R2.hp); assert.ok(hit > 0 && spl > 0 && spl < hit, `a hit and splash (${hit.toFixed(0)}, ${spl.toFixed(0)})`);
  // a building falls with 3 pustules: 6 Mites for the Tyrant's side, temporary
  const g3 = s.rangeGame({ factions: ['bloomhost', 'lastfist'] }); const T3 = s.rangeUnit(g3, 0, 'broodtyrant', 500, 0), B3 = s.rangeBuilding(g3, 1, 'lastfist', 'refinery', 640, 0); tough(T3); B3.built = true;
  s.rangeMode(g3, 0, 'attack'); assert.ok(until(s, g3, () => B3.pus === 3, 15)); B3.hp = 5; T3.cd = 1e9;
  assert.ok(until(s, g3, () => B3.hp <= 0, 5));
  const M = g3.ents.filter(e => e.type === 'mite' && e.side === 0 && e.hp > 0); assert.strictEqual(M.length, 6); assert.ok(M.every(m => m.temp && m.tSrc === 'pus'));
});

test('Worldrender: lands on the building it attacks (1.5 s), bites 120 every 2 s healing 30% (at most 40/s), a heavy ground target while down; takes off below 35%', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const W = s.rangeUnit(g, 0, 'worldrender', 560, 0), B = s.rangeBuilding(g, 1, 'lastfist', 'barracks', 620, 0); B.built = true; B.hp = B.maxHp = 1e5;
  const Tk = s.rangeUnit(g, 1, 'tank', 700, 0), I = s.rangeUnit(g, 1, 'interceptor', 700, 40); tough(Tk, I); Tk.cd = I.cd = 1e9;
  s.rangeMode(g, 0, 'attack');
  assert.ok(until(s, g, () => W.lnd === 1, 5), 'landing');
  Tk.u = W.u + 120; Tk.v = W.v; assert.ok(!s.ctlCanHit(g, Tk, s.rwD(g, 'tank'), W), 'still airborne while it comes down');
  const t0 = g.t; assert.ok(until(s, g, () => W.lnd === 2, 3)); assert.ok(Math.abs(g.t - t0 - 1.5) < 0.1, 'in 1.5 s');
  assert.strictEqual(W.arm, 'heavy');
  Tk.u = W.u + 120; Tk.v = W.v; I.u = W.u + 100; I.v = W.v;
  assert.ok(s.ctlCanHit(g, Tk, s.rwD(g, 'tank'), W), 'a Tank can hit it'); assert.ok(!s.ctlCanHit(g, I, s.rwD(g, 'interceptor'), W), 'an Interceptor can\'t');
  assert.strictEqual(s.acquire(g, Tk, s.rwD(g, 'tank'), [W]).best, W);
  const b0 = B.hp; W.hp = 1000; step(s, g, 4.05); const bit = b0 - B.hp;
  assert.ok(bit >= 358 && bit <= 362, `a bite at touchdown, then one every 2 s: three of 120 in 4 s (${bit.toFixed(0)})`); assert.ok(W.hp > 1000 && W.hp <= 1000 + 40 * 4.1, `healed ${(W.hp - 1000).toFixed(0)}`);
  W.hp = W.maxHp * 0.3; s.rangeStep(g); assert.strictEqual(W.lnd, 3, 'takes off below 35%');
  assert.ok(until(s, g, () => !W.lnd, 2)); assert.ok(!W.arm && W.z > 50, 'airborne again');
});

test('Voidcarrier: power node kept; a light bolt (18, 1.4 s, range 140) at air and ground; no splash, no building preference', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const V = s.rangeUnit(g, 0, 'voidcarrier', 500, 0), A = s.rangeUnit(g, 1, 'aircraft', 620, 0); tough(V, A); s.rangeMode(g, 1, 'hold');
  step(s, g, 7); const d = 1e6 - A.hp; assert.ok(d > 0, 'it hits aircraft'); assert.ok(g.projs.every(p => p.weapon !== 'void'));
  const g2 = s.rangeGame({ factions: ['axiarchs', 'lastfist'] }); const V2 = s.rangeUnit(g2, 0, 'voidcarrier', 500, 0), R = s.rangeUnit(g2, 1, 'heavy', 630, 0); tough(V2, R); s.rangeMode(g2, 1, 'hold');
  step(s, g2, 7.05); const n = Math.round((1e6 - R.hp) / 18); assert.ok(n >= 4 && n <= 6, `about one bolt every 1.4 s (${((1e6 - R.hp)).toFixed(0)})`);
});

test('Sovereign: a 2.5 s charge on one ground target in 320 reach, then 260 at once; shields breaking mid-charge fail the shot and restart the cooldown; no aircraft', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const S = s.rangeUnit(g, 0, 'sovereign', 400, 0), T = s.rangeUnit(g, 1, 'tank', 700, 0), A = s.rangeUnit(g, 1, 'aircraft', 450, 0); tough(S, T, A); S.cd = 0; s.rangeMode(g, 1, 'hold'); A.cd = T.cd = 1e9;
  assert.ok(until(s, g, () => S.chT > 0, 2)); const c0 = g.t; assert.strictEqual(S.chTgt, T.id, 'never the aircraft');
  assert.ok(until(s, g, () => T.hp < 1e6, 4)); assert.ok(Math.abs(g.t - c0 - 2.5) < 0.1, `charged ${(g.t - c0).toFixed(2)} s`);
  assert.strictEqual(1e6 - T.hp, 260 * s.DMG.sovereign.vehicle); assert.ok(g.fx.some(f => f.k === 'judge'));
  const g2 = s.rangeGame({ factions: ['axiarchs', 'lastfist'] }); const S2 = s.rangeUnit(g2, 0, 'sovereign', 400, 0), T2 = s.rangeUnit(g2, 1, 'tank', 700, 0); tough(T2); S2.cd = 0; s.rangeMode(g2, 1, 'hold'); T2.cd = 1e9;
  assert.ok(until(s, g2, () => S2.chT > g2.t + 1, 2)); s.damage(g2, S2, S2.shp + 10, 'flak', 1);
  assert.ok(!S2.chT && S2.cd > 3, 'failed; the cooldown starts over'); assert.ok(g2.fx.some(f => f.k === 'sovfail'));
  step(s, g2, 2.5); assert.strictEqual(T2.hp, 1e6, 'no shot');
  // the AI aims it: the most valuable target in reach, buildings when sieging
  const g3 = s.rangeGame({ factions: ['axiarchs', 'lastfist'] }); g3.sides[0].direct = false;
  const S3 = s.rangeUnit(g3, 0, 'sovereign', 400, 0), r = s.rangeUnit(g3, 1, 'rifle', 600, 0), t = s.rangeUnit(g3, 1, 'titan', 680, 20), b = s.rangeBuilding(g3, 1, 'lastfist', 'refinery', 690, -30); b.built = true;
  const d = s.rwD(g3, 'sovereign'), foes = [r, t, b];
  assert.strictEqual(s.aim4b(g3, S3, d, r, foes), t, 'the Titan'); S3.a4bT = 0; g3.sides[0].bbOn = true; assert.strictEqual(s.aim4b(g3, S3, d, r, foes), b, 'sieging: the building');
});

test('AI: own scores for all five; Brood Tyrants aim at economy and defences; Worldrenders pick valuable buildings; Voidcarriers over the army', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] }); g.sides[0].direct = false;
  const T = s.rangeUnit(g, 0, 'broodtyrant', 500, 0), hab = s.rangeBuilding(g, 1, 'lastfist', 'barracks', 600, 0), ref = s.rangeBuilding(g, 1, 'lastfist', 'refinery', 620, 60); hab.built = ref.built = true;
  assert.strictEqual(s.aim4b(g, T, s.rwD(g, 'broodtyrant'), hab, [hab, ref]), ref, 'the Refinery over the Barracks');
  ref.pus = 3; ref.puS = 0; T.a4bT = 0; assert.strictEqual(s.aim4b(g, T, s.rwD(g, 'broodtyrant'), hab, [hab, ref]), hab, 'one already full of pustules counts less');
  const W = s.rangeUnit(g, 0, 'worldrender', 400, 0); assert.ok(s.aim4b(g, W, s.rwD(g, 'worldrender'), null, [hab, ref]), 'a Worldrender picks a building to land on');
  for (const t of ['broodtyrant', 'worldrender', 'voidcarrier', 'sovereign']) assert.ok(s.RW4B_TASTE[t], t);
  const h = s.rangeGame({ factions: ['axiarchs', 'lastfist'] }); const V = s.rangeUnit(h, 1, 'voidcarrier', 1200, 0), mine = [V];
  for (let i = 0; i < 4; i++) mine.push(s.rangeUnit(h, 1, 'shardling', 900 - i * 20, i * 10));
  s.aiRework4b(h, 1, mine); assert.ok(h.sides[1].vc4 && Math.abs(h.sides[1].vc4[0] - 910) < 60, `over the front of its army (${h.sides[1].vc4 && h.sides[1].vc4[0].toFixed(0)})`);
});
