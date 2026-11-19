// v2.88 (the Bloomhost swarm pass, faction rework batch 5b): broods (one Skitterling order hatches four), swarm surge (Bloomhost
// ground units faster in numbers), kill frenzy (faster attacks after an enemy dies nearby), Spitter quill volleys (aircraft
// first, 1.5× to them) and Needlewings at aircraft, behind REWORK.b5b (per game, g.rw.b5b). Played on Test Range games and
// short matches (the real SIM).
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');

const step = (s, g, sec) => { for (let i = 0; i < Math.round(sec * 60); i++) s.rangeStep(g); };
const until = (s, g, f, sec = 20) => { for (let i = 0; i < sec * 60; i++) { if (f()) return true; s.rangeStep(g); } return f(); };
const tough = (...es) => es.forEach(e => { e.hp = e.maxHp = 1e6; });

test('switch: per game; b5b off plays the v2.87 units (UDEF untouched), on the batch\'s definitions; saves', () => {
  const s = loadSim();
  assert.strictEqual(s.rwInit().b5b, true, 'on by default');
  const on = s.rangeGame({ factions: ['bloomhost', 'lastfist'] }), off = s.rangeGame({ factions: ['bloomhost', 'lastfist'], rework: { b5b: false } });
  const sk = s.rwD(on, 'skitterling'); assert.ok(sk.hp === 50 && sk.brood.n === 4 && sk.brood.c === 120 && sk.brood.time === 6 && sk.swarm && s.UDEF.skitterling.hp !== 50 && s.rwD(off, 'skitterling') === s.UDEF.skitterling);
  const sp = s.rwD(on, 'spitter'); assert.ok(sp.quill && sp.weapon === 'quill' && sp.dmg === 6 && sp.range === 150 && sp.hitsAir && sp.preferAir && sp.corrode && s.UDEF.spitter.weapon === 'acid');
  assert.strictEqual(s.DMG.quill.air, 1.5); assert.strictEqual(s.DMG.quill.light, s.DMG.acid.light);
  const nw = s.rwD(on, 'needlewing'); assert.ok(nw.hitsAir && nw.weapon === 'needle5' && s.DMG.needle5.air > 0 && nw.swarm && !s.UDEF.needlewing.hitsAir);
  assert.strictEqual(s.rangeUnit(on, 0, 'skitterling', 500, 0).hp, 50); assert.strictEqual(s.rangeUnit(off, 0, 'skitterling', 500, 0).hp, s.UDEF.skitterling.hp);
  const g = s.newGame('normal', { seed: 5 });
  assert.strictEqual(s.deserialize(s.serialize(g, {})).rw.b5b, true);
  const o = JSON.parse(s.serialize(g, {})); delete o.rw.b5b; assert.strictEqual(s.deserialize(JSON.stringify(o)).rw.b5b, false, 'a v2.87 save resumes with b5b off');
  const g0 = s.newGame('normal', { seed: 5, rework: { b5b: false } }); assert.ok(!('b5b' in JSON.parse(s.serialize(g0, {})).rw), 'a b5b-off save leaves the key out');
});

test('broods: one order costs 120 for 4 Skitterlings of 50 health in 6 s, counts 4 against supply and the limit; past the limit only what fits hatches, the rest refunded', () => {
  const s = loadSim();
  const g = s.newGame('normal', { seed: 3, factions: ['bloomhost', 'lastfist'], countdown: 0 }); g.sides[0].aiT = g.sides[1].aiT = 1e9;
  s.rangeBuilding(g, 0, 'bloomhost', 'barracks', 300, 0);
  const sd = g.sides[0]; sd.res.c = 1000; sd.res.e = 0;
  const pop0 = s.popUsed(g, 0), r = s.tryTrain(g, 0, 'skitterling');
  assert.ok(r.ok && /Brood of 4/.test(r.msg)); assert.strictEqual(1000 - sd.res.c, 120, '120 credits');
  assert.strictEqual(s.unitCount(g, 0, 'skitterling'), 4); assert.strictEqual(s.popUsed(g, 0) - pop0, 2, 'half supply each');
  const B = g.ents.find(e => e.type === 'barracks' && e.side === 0); assert.strictEqual(B.queue.length, 1, 'one queue slot');
  for (let i = 0; i < 60 * 5.9; i++) s.update(g, s.TICK);
  assert.strictEqual(g.ents.filter(e => e.type === 'skitterling' && e.side === 0).length, 0, 'not before 6 s');
  for (let i = 0; i < 60 * 0.2; i++) s.update(g, s.TICK);
  const sk = g.ents.filter(e => e.type === 'skitterling' && e.side === 0);
  assert.strictEqual(sk.length, 4); assert.ok(sk.every(e => e.hp === 50 && e.maxHp === 50));
  for (let i = 0; i < 54; i++) { const e = s.spawnUnit(g, 0, 'skitterling', 300, 0); e.temp = 1e9; } // 58 alive (temporary: no supply)
  assert.ok(s.tryTrain(g, 0, 'skitterling').ok, '58 + 4 queued may start'); assert.match(s.tryTrain(g, 0, 'skitterling').msg, /At most 60/);
  const c0 = sd.res.c; for (let i = 0; i < 60 * 6.1; i++) s.update(g, s.TICK);
  assert.strictEqual(s.unitCount(g, 0, 'skitterling'), 60, 'two hatch');
  assert.ok(sd.res.c - c0 >= 60 && sd.res.c - c0 < 60 + 30, `two refunded (${(sd.res.c - c0).toFixed(1)}, income included)`);
  assert.strictEqual(sd.sw5.refund, 2);
  const g1 = s.newGame('normal', { seed: 3, factions: ['bloomhost', 'lastfist'], countdown: 0, rework: { b5b: false } }); s.rangeBuilding(g1, 0, 'bloomhost', 'barracks', 300, 0); g1.sides[0].res.c = 1000;
  assert.ok(s.tryTrain(g1, 0, 'skitterling').ok); assert.strictEqual(1000 - g1.sides[0].res.c, s.UDEF.skitterling.cost.c, 'off: one Skitterling as before');
});

test('swarm surge: +5% per Bloomhost ground unit within 80, up to +40%, on top of creep; not aircraft, other factions or burrowed units', () => {
  const s = loadSim();
  const run = (n, rw) => {
    const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'], rework: rw });
    const lead = s.rangeUnit(g, 0, 'skitterling', 300, 0), pack = [];
    for (let i = 0; i < n; i++) pack.push(s.rangeUnit(g, 0, 'skitterling', 300 - 10 - (i % 4) * 9, (Math.floor(i / 4) - 1) * 12));
    s.rangeUnit(g, 0, 'needlewing', 300, 0); s.rangeUnit(g, 1, 'rifle', 1500, 0);
    const ids = [lead, ...pack].map(e => e.id); s.command(g, 0, ids, 'go', 900, 0);
    s.rangeStep(g); const u0 = lead.u; for (let i = 0; i < 30; i++) s.rangeStep(g);
    return { d: lead.u - u0, sg: lead.sgN, nw: g.ents.find(e => e.type === 'needlewing').sgN };
  };
  const solo = run(0, {}), four = run(4, {}), ten = run(10, {}), off = run(10, { b5b: false });
  assert.strictEqual(solo.sg || 0, 0); assert.strictEqual(four.sg, 4); assert.strictEqual(ten.sg, 8, 'capped at 8'); assert.ok(!off.sg && !ten.nw && !solo.nw, 'never on aircraft; off: none');
  assert.ok(Math.abs(four.d / solo.d - 1.2) < 0.02, `4 near: +20% (${(four.d / solo.d).toFixed(3)})`);
  assert.ok(Math.abs(ten.d / solo.d - 1.4) < 0.02, `10 near: +40% (${(ten.d / solo.d).toFixed(3)})`);
  assert.ok(Math.abs(off.d / solo.d - 1) < 0.02, 'off: no surge');
  assert.strictEqual(s.surgeMul({ sgN: 8, bur: 1 }), 1, 'burrowed'); assert.strictEqual(s.surgeMul({ sgN: 8, lt: 3 }), 1, 'latched'); assert.ok(Math.abs(s.surgeMul({ sgN: 3 }) - 1.15) < 1e-9);
  const g = s.rangeGame({ factions: ['lastfist', 'lastfist'] }); for (let i = 0; i < 5; i++) s.rangeUnit(g, 0, 'rifle', 300 + i * 5, 0); s.rangeStep(g);
  assert.ok(g.ents.every(e => !e.sgN), 'other factions: none');
});

test('kill frenzy: an enemy unit dying within 120 makes nearby Bloomhost units attack 30% faster for 4 s; refreshed, never stacked', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const near = s.rangeUnit(g, 0, 'spitter', 500, 0), far = s.rangeUnit(g, 0, 'spitter', 300, 0), air = s.rangeUnit(g, 0, 'needlewing', 520, 20);
  const A = s.rangeUnit(g, 1, 'rifle', 560, 0), B = s.rangeUnit(g, 1, 'rifle', 560, 20); g.sides[1].hush = true; g.sides[0].hush = true;
  s.kill(g, A, 0);
  assert.ok(near.kfT === g.t + 4 && air.kfT === g.t + 4 && !far.kfT, 'within 120, aircraft too');
  const k0 = near.kfS; for (let i = 0; i < 60; i++) s.update(g, s.TICK);
  s.kill(g, B, 0); assert.ok(Math.abs(near.kfT - (g.t + 4)) < 1e-9 && near.kfS === k0, 'refreshed (the pulse is the first start)');
  near.cd = 1; g.sides[0].hush = false; const t0 = g.t; s.updateUnit(g, near, [], 0.1); assert.ok(Math.abs(near.cd - (1 - 0.13)) < 1e-9, 'cooldown runs 1.3× (not 1.69×)');
  far.cd = 1; s.updateUnit(g, far, [], 0.1); assert.ok(Math.abs(far.cd - 0.9) < 1e-9, 'not in frenzy');
  const g0 = s.rangeGame({ factions: ['bloomhost', 'lastfist'], rework: { b5b: false } }), n0 = s.rangeUnit(g0, 0, 'spitter', 500, 0), A0 = s.rangeUnit(g0, 1, 'rifle', 560, 0);
  s.kill(g0, A0, 0); assert.ok(!n0.kfT, 'off: none');
});

test('Spitter: volleys of 3 quills 0.12 s apart, a volley every 1.2 s, 6 each, 1.5× to aircraft, aircraft first, corrosion kept', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const S = s.rangeUnit(g, 0, 'spitter', 500, 0), R = s.rangeUnit(g, 1, 'rifle', 600, 0), G = s.rangeUnit(g, 1, 'aircraft', 620, 10); tough(S, R, G); S.cd = 0;
  g.sides[1].hush = true;
  const shots = []; let seen = new Set();
  for (let i = 0; i < 60 * 3.7; i++) { s.rangeStep(g); for (const p of g.projs) if (p.weapon === 'quill' && !seen.has(p)) { seen.add(p); shots.push({ t: g.t, tgt: p.target, dmg: p.dmg }); } }
  assert.ok(shots.length >= 9 && shots.length <= 10, `three volleys (${shots.length})`);
  assert.ok(shots.every(x => x.tgt === G), 'the aircraft first (a Marine nearer)');
  assert.ok(Math.abs(shots[1].t - shots[0].t - 0.12) < 0.02 && Math.abs(shots[2].t - shots[1].t - 0.12) < 0.02, 'quills 0.12 s apart');
  const gap = shots[3].t - shots[0].t; assert.ok(gap > 1.2 * 0.9 - 0.03 && gap < 1.2 * 1.1, `a volley every 1.2 s (${gap.toFixed(2)})`);
  assert.ok(shots.every(x => Math.abs(x.dmg - 6) < 1e-9));
  const h0 = G.hp; s.damage(g, G, 6, 'quill', 0); assert.ok(Math.abs(h0 - G.hp - 6 * 1.5 * (1 + s.corrNow(G, g.t))) < 1e-6, '1.5× to aircraft');
  assert.ok(G.corrT > g.t, 'corroded');
});

test('Needlewing: hits aircraft too (swarm bonus kept); with b5b off it can\'t', () => {
  const s = loadSim();
  for (const rw of [{}, { b5b: false }]) {
    const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'], rework: rw });
    const ns = [0, 1, 2, 3].map(i => s.rangeUnit(g, 0, 'needlewing', 500 + i * 8, i * 6)), I = s.rangeUnit(g, 1, 'interceptor', 640, 0); tough(I);
    s.rangeMode(g, 0, 'attack'); g.sides[1].hush = true;
    step(s, g, 6);
    const hit = I.maxHp - I.hp;
    if (rw.b5b === false) assert.strictEqual(hit, 0, 'off: no anti-air'); else { assert.ok(hit > 30, `stung (${hit.toFixed(0)})`); assert.ok(g.sides[0].sw5.needleAir > 0); }
  }
});

test('AI: Bloomhost scores broods up and answers aircraft with Spitters and Needlewings; its anti-air paths; the pack waits for its median', () => {
  const s = loadSim();
  const g = s.newGame('hard', { seed: 4, factions: ['bloomhost', 'lastfist'], countdown: 0 });
  const theirs = [{ type: 'aircraft', w: 1 }, { type: 'aircraft', w: 1 }, { type: 'rifle', w: 1 }];
  const sc = { skitterling: 1, spitter: 1, needlewing: 1 }; s.aiScores5b(g, 1, sc, { comp: { light: 0.2, heavy: 0, vehicle: 0, air: 0.8 }, theirs, mine: [] });
  const sc0 = { skitterling: 1, spitter: 1, needlewing: 1 }; s.aiScores5b(g, 1, sc0, { comp: { light: 1, heavy: 0, vehicle: 0, air: 0 }, theirs: [{ type: 'rifle', w: 1 }], mine: [] });
  assert.ok(sc.spitter > sc0.spitter + 2 && sc.needlewing > sc0.needlewing + 1.5, 'aircraft: Spitters and Needlewings');
  assert.ok(sc0.skitterling > 1.2, 'broods are its backbone');
  g.sides[1].faction = 'bloomhost';
  const pit = s.rangeBuilding(g, 1, 'bloomhost', 'barracks', 1500, 0), spire = s.rangeBuilding(g, 1, 'bloomhost', 'techlab', 1500, 60);
  assert.strictEqual(s.aiPath5b(g, 1, pit, theirs), 'B', 'Acidic Evolution'); assert.strictEqual(s.aiPath5b(g, 1, spire, theirs), 'A', 'Swarm Bloom');
  assert.strictEqual(s.aiPath5b(g, 1, pit, [{ type: 'rifle', w: 1 }]), null, 'no aircraft: its own choice');
  const side = g.sides[1]; side.stance = 'attack';
  const mine = [0, 1, 2, 3, 4, 5].map(i => s.spawnUnit(g, 1, 'skitterling', 1400 - i * 10, 0)); const runner = s.spawnUnit(g, 1, 'skitterling', 1100, 0), sp = s.spawnUnit(g, 1, 'spitter', 1360, 0);
  s.aiRework5b(g, 1, [...mine, runner, sp]);
  assert.ok(runner.aiWait > g.t, 'a front-runner waits for the pack'); assert.ok(sp.aiWait > g.t, 'a Spitter ahead of the swarm waits behind it'); assert.ok(!(mine[0].aiWait > g.t), 'the rear keeps going');
});

// Seeded skirmishes (the Test Range, 40 s, the state hashed every second). With b5b off they hash exactly as on v2.87's
// index.html (checked against the v2.87 build when recorded, EE_HTML); with it on, recorded at v2.88.
function skirm(s, kind, rw) {
  const S = kind === 'g' ? { f: ['bloomhost', 'lastfist'], u: [['skitterling', 560, -20, 12], ['spitter', 520, 30, 4], ['needlewing', 540, 60, 4]], v: [['rifle', 820, -10, 6], ['aircraft', 860, 20, 2], ['interceptor', 880, 40, 1], ['tank', 860, -40, 1]] }
    : { f: ['axiarchs', 'bloomhost'], u: [['shardling', 600, -20, 3], ['lancer', 580, 20, 3], ['wraithwing', 560, 50, 2]], v: [['skitterling', 820, 0, 10], ['thornback', 860, -30, 1], ['dreadthorn', 880, 20, 1], ['razorwing', 840, 50, 2], ['cloudwing', 860, 60, 1]] };
  const g = s.rangeGame({ seed: 17, factions: S.f, rework: Object.assign({ b5c: false, b6side: false }, rw) }) /* v2.90: pinned before batch 5c (its key would be saved) */;
  for (const [t, u, v, n] of S.u) for (let i = 0; i < n; i++) s.rangeUnit(g, 0, t, u + (i % 4) * 12, v + Math.floor(i / 4) * 14);
  for (const [t, u, v, n] of S.v) for (let i = 0; i < n; i++) s.rangeUnit(g, 1, t, u + (i % 4) * 12, v + Math.floor(i / 4) * 14);
  s.rangeMode(g, 0, 'attack'); s.rangeMode(g, 1, 'attack');
  const h = crypto.createHash('sha256');
  for (let i = 1; i <= 60 * 40; i++) { s.rangeStep(g); g.events.length = 0; if (i % 60 === 0) h.update(s.serialize(g, {})); }
  return h.digest('hex');
}
const SK = {
  g0: 'a3fe405c2e9fb55943c6dca17522a3734e7cce4473582c4a3333ca008d038729', // a swarm with Spitters and Needlewings vs Marines, Gunships, an Interceptor and a Tank, b5b off: v2.87's
  h0: '8a52dd88f2617f747ad00302174ce7b142d6a981ce7c184695b7fb4fa2371a40', // Shardlings, Lancers, Wraithwings vs Skitterlings, a Thornback, a Dreadthorn, Razorwings and a Cloudwing, b5b off: v2.87's
  g1: '68de899f6824eb01f7222c1cbcc32042772be424a20d6051d361356377130ce1', // b5b on
  h1: '478663e03751f64d0464c39e81d500ed5cd387add0ac48f8c0217f2e0be51526', // b5b on
};
test('seeded skirmishes: b5b off hashes as on v2.87; on, as recorded at v2.88', () => {
  const s = loadSim();
  assert.strictEqual(skirm(s, 'g', { b5b: false }), SK.g0);
  assert.strictEqual(skirm(s, 'h', { b5b: false }), SK.h0);
  assert.strictEqual(skirm(s, 'g', {}), SK.g1);
  assert.strictEqual(skirm(s, 'h', {}), SK.h1);
});
if (require.main === module && process.argv[2] === '--print') { const s = loadSim(); console.log(skirm(s, 'g', { b5b: false }), skirm(s, 'h', { b5b: false }), skirm(s, 'g', {}), skirm(s, 'h', {})); }
