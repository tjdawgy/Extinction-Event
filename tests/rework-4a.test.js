// v2.86 (docs/FACTION_REWORK.md batch 4a): Part 0 (the AI's T2 path rolled per match), the Sniper (pins infantry), the
// Astral Marksman (marks), the Bilecaster (acid pools), the Gunship (salvos) and the Wraithwing (hops), behind REWORK.b4a
// (per game, g.rw.b4a). Played on Test Range games (the real SIM).
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');

const step = (s, g, sec) => { for (let i = 0; i < Math.round(sec * 60); i++) s.rangeStep(g); };
const until = (s, g, f, sec = 20) => { for (let i = 0; i < sec * 60; i++) { if (f()) return true; s.rangeStep(g); } return f(); };
const tough = (...es) => es.forEach(e => { e.hp = e.maxHp = 1e6; });

test('switch: per game; b4a off plays the v2.85 units (UDEF untouched), on the batch\'s definitions; saves', () => {
  const s = loadSim();
  assert.strictEqual(s.rwInit().b4a, true, 'on by default');
  const on = s.rangeGame({ factions: ['lastfist', 'axiarchs'] }), off = s.rangeGame({ factions: ['lastfist', 'axiarchs'], rework: { b4a: false } });
  assert.ok(s.rwD(on, 'sniper').suppress && !s.rwD(off, 'sniper').suppress && s.rwD(on, 'sniper').pierce, 'the Sniper keeps its pierce');
  assert.ok(s.rwD(on, 'marksman').marker && s.rwD(on, 'marksman').charge === s.UDEF.marksman.charge);
  const bc = s.rwD(on, 'bilecaster'); assert.ok(bc.bilePool && bc.range === 150 && bc.cd === 2.6 && !bc.corrode && s.UDEF.bilecaster.corrode && s.UDEF.bilecaster.range === 280, 'no P16 corrosion in b4a; UDEF keeps it');
  assert.ok(s.rwD(on, 'aircraft').gsSalvo && s.rwD(on, 'aircraft').dmg === 22 && s.UDEF.aircraft.dmg === 20);
  assert.ok(s.rwD(on, 'wraithwing').blink && !s.rwD(on, 'wraithwing').phase && s.UDEF.wraithwing.phase, 'no phase-on-hit in b4a; UDEF keeps it');
  // a save keeps the switch; a v2.85 save (rw without b4a) resumes with it off; a b4a-off save has no b4a key
  const g = s.newGame('normal', { seed: 5 });
  assert.strictEqual(s.deserialize(s.serialize(g, {})).rw.b4a, true);
  const o = JSON.parse(s.serialize(g, {})); delete o.rw.b4a; assert.strictEqual(s.deserialize(JSON.stringify(o)).rw.b4a, false);
  const g0 = s.newGame('normal', { seed: 5, rework: { b4a: false } }); assert.ok(!('b4a' in JSON.parse(s.serialize(g0, {})).rw));
  // off: a Wraithwing still phases when hit
  const W = s.rangeUnit(off, 1, 'wraithwing', 800, 0); s.damage(off, W, 10, 'rifle', 0); assert.ok(W.phT > off.t, 'b4a off: P13 phase');
  const W2 = s.rangeUnit(on, 1, 'wraithwing', 800, 0); s.damage(on, W2, 10, 'rifle', 0); assert.ok(!(W2.phT > on.t), 'b4a on: no phase');
});

// Seeded skirmishes (the Test Range, 40 s, the state hashed every second). With b4a off they hash exactly as on v2.85's
// index.html (checked against the v2.85 build when recorded); with it on, recorded at v2.86.
function skirm(s, kind, rw) {
  const S = kind === 'c' ? { f: ['lastfist', 'bloomhost'], u: [['sniper', 600, -20, 3], ['aircraft', 560, 10, 2], ['rifle', 640, 20, 4], ['tank', 620, -40, 1]], v: [['bilecaster', 840, -10, 3], ['skitterling', 800, 20, 6], ['spitter', 860, 30, 3], ['bulwark', 790, -30, 1]] }
    : { f: ['axiarchs', 'lastfist'], u: [['marksman', 560, -20, 2], ['wraithwing', 600, 10, 3], ['lancer', 620, 20, 3], ['shardling', 640, -30, 3]], v: [['tank', 840, -10, 2], ['rifle', 800, 20, 5], ['heavy', 820, 40, 3], ['hydra', 880, 0, 1]] };
  const g = s.rangeGame({ seed: 13, factions: S.f, rework: Object.assign({ b5c: false, b6side: false, b6art: false, b6hq: false, b6c: false, b6ai: false, b6d: false }, rw) }) /* v2.90: pinned before batch 5c (its key would be saved) */;
  for (const [t, u, v, n] of S.u) for (let i = 0; i < n; i++) s.rangeUnit(g, 0, t, u + (i % 3) * 14, v + Math.floor(i / 3) * 16);
  for (const [t, u, v, n] of S.v) for (let i = 0; i < n; i++) s.rangeUnit(g, 1, t, u + (i % 3) * 14, v + Math.floor(i / 3) * 16);
  s.rangeMode(g, 0, 'attack'); s.rangeMode(g, 1, 'attack');
  const h = crypto.createHash('sha256');
  for (let i = 1; i <= 60 * 40; i++) { s.rangeStep(g); g.events.length = 0; if (i % 60 === 0) h.update(s.serialize(g, {})); }
  return h.digest('hex');
}
const SK = {
  c0: '1b2029eb9f8096c02c872d8374a6842146a7f2bea19469b2094dafb872b48139', // Snipers, Gunships vs Bilecasters, b4a off: v2.85's
  d0: '2090472154278eed5d405a05a9a8e15980c183b5513a1c059d46e5b1b28b74ea', // Marksmen, Wraithwings vs a Last Fist army, b4a off: v2.85's
  c1: 'f98940ca848359d45afa96e8ac96cd764a65b77edc42737ecb383d49d3e440c2', // b4a on
  d1: 'fa3d7a4775fd371a1006554f1eb9b95f3af64a38acb09d01dae78e3c92957253', // b4a on (re-recorded at v2.87: Part 0, the Hydra tracks the hopping Wraithwings; v2.86's was f8c4e9b2…)
};
test('seeded skirmishes: b4a off hashes as on v2.85; on, as recorded at v2.86 (d re-recorded at v2.87, Part 0); all with batch 4b off', () => {
  const s = loadSim();
  assert.strictEqual(skirm(s, 'c', { b4a: false, b4b: false, b5b: false }), SK.c0);
  assert.strictEqual(skirm(s, 'd', { b4a: false, b4b: false, b5b: false }), SK.d0);
  assert.strictEqual(skirm(s, 'c', { b4b: false, b5b: false }), SK.c1);
  assert.strictEqual(skirm(s, 'd', { b4b: false, b5b: false }), SK.d1);
});

test('Part 0: a Normal or Hard AI rolls each building\'s T2 path once per match (its persona\'s about 60%); Easy keeps the persona\'s; counters first', () => {
  const s = loadSim();
  assert.strictEqual(s.PATHROLL.keep, 0.6);
  let keep = 0, n = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const g = s.newGame('hard', { seed, factions: ['lastfist', 'lastfist'] });
    const p = s.aiPathRoll(g, 1, 'barracks', 'A'); n++; if (p === 'A') keep++;
    assert.strictEqual(s.aiPathRoll(g, 1, 'barracks', 'A'), p, 'rolled once per match');
  }
  assert.ok(keep / n > 0.5 && keep / n < 0.7, `the persona's path ${keep} of ${n}`);
  // through aiPickPath: Easy follows the persona; Hard rolls (seed 3 here rolls the other path for the factory)
  const pick = (diff, rw, seed) => { const g = s.newGame(diff, { seed, factions: ['lastfist', 'lastfist'], rework: rw }); const b = g.ents.find(e => e.side === 1 && e.type === 'hq'); const fake = { type: 'factory', side: 1 }; return [g, s.aiPickPath(g, 1, fake, { paths: { factory: 'A' } }, [])]; };
  let other = 0; for (let seed = 1; seed <= 40; seed++) { const [, p] = pick('hard', {}, seed); if (p === 'B') other++; }
  assert.ok(other > 5 && other < 30, `Hard took the other path ${other} of 40`);
  for (let seed = 1; seed <= 20; seed++) { assert.strictEqual(pick('easy', {}, seed)[1], 'A', 'Easy: the persona\'s path'); assert.strictEqual(pick('hard', { b4a: false }, seed)[1], 'A', 'b4a off: the persona\'s path'); }
  // an armoured enemy still calls for Specialists, whatever the roll
  for (let seed = 1; seed <= 20; seed++) { const g = s.newGame('hard', { seed, factions: ['lastfist', 'lastfist'] }); assert.strictEqual(s.aiPickPath(g, 1, { type: 'barracks', side: 1 }, { paths: { barracks: 'B' } }, [{ type: 'tank', w: 1 }]), 'A'); }
});

test('Sniper: its round pins every infantry unit it hits (the pierce too) for 1.5 s: they can\'t move but still shoot; vehicles aren\'t pinned', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['lastfist', 'lastfist'] });
  const sn = s.rangeUnit(g, 0, 'sniper', 500, 0), rs = [0, 1, 2].map(i => s.rangeUnit(g, 1, 'rifle', 720 + i * 20, 0)), tk = s.rangeUnit(g, 1, 'tank', 700, 60);
  tough(...rs, tk); g.sides[1].hush = true; sn.po = { o: 'target', id: rs[0].id };
  assert.ok(until(s, g, () => rs.every(r => r.pinT > g.t), 6), 'the target and the two behind it are pinned');
  assert.ok(Math.abs(rs[0].pinT - g.t - s.PIN.dur) < 0.5);
  assert.ok(!(tk.pinT > g.t), 'a Tank is not');
  // pinned, a unit can't walk but still fires
  g.sides[1].hush = false; const r = rs[2]; r.pinT = g.t + 1.5; sn.u = r.u - 120; sn.hp = sn.maxHp = 1e6; const u0 = r.u; s.rangeMode(g, 1, 'attack'); r.pinT = g.t + 1.5;
  let fired = false; for (let i = 0; i < 60; i++) { s.rangeStep(g); if (r.tgt === sn.id && r.recoil > 0) fired = true; }
  assert.ok(Math.abs(r.u - u0) < 1e-6, 'it stood still for a second');
  assert.ok(fired, 'it still shoots');
  const h = s.rangeGame({ factions: ['lastfist', 'lastfist'], rework: { b4a: false } });
  const sn2 = s.rangeUnit(h, 0, 'sniper', 500, 0), r2 = s.rangeUnit(h, 1, 'rifle', 720, 0); tough(r2); h.sides[1].hush = true; sn2.po = { o: 'target', id: r2.id };
  step(s, h, 5); assert.ok(r2.hp < r2.maxHp && !r2.pinT, 'b4a off: hit, never pinned');
});

test('Marksman: its hit marks the target 5 s; Axiarch damage to it is 25% higher (not another faction\'s); Axiarch units in reach switch to it', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const T = s.rangeUnit(g, 1, 'tank', 800, 0); tough(T); g.sides[1].hush = true;
  // the mark's bonus, measured on the same hit with and without the mark
  const h0 = T.hp; s.damage(g, T, 100, 'bolt', 0); const plain = h0 - T.hp;
  T.mkT = g.t + 5; T.mkS = 0; const h1 = T.hp; s.damage(g, T, 100, 'bolt', 0); assert.ok(Math.abs((h1 - T.hp) / plain - 1.25) < 1e-9, 'Axiarch damage +25%');
  T.mkS = 1; const h2 = T.hp; s.damage(g, T, 100, 'bolt', 0); assert.ok(Math.abs((h2 - T.hp) - plain) < 1e-9, 'marked by the other side: no bonus');
  // a real shot: the Marksman marks, a Lancer with another target in reach switches to the marked one
  const m = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const mk = s.rangeUnit(m, 0, 'marksman', 500, 0), ln = s.rangeUnit(m, 0, 'lancer', 640, 30), near = s.rangeUnit(m, 1, 'rifle', 700, 30), far = s.rangeUnit(m, 1, 'heavy', 760, 0);
  tough(near, far); m.sides[1].hush = true; mk.po = { o: 'target', id: far.id }; ln.po = undefined;
  step(s, m, 0.5); assert.strictEqual(ln.tgt, near.id, 'before: the Lancer shoots the nearer Marine');
  assert.ok(until(s, m, () => far.mkT > m.t, 6), 'the Marksman\'s hit marks the Heavy');
  assert.ok(Math.abs(far.mkT - m.t - s.MARK.dur) < 0.1 && far.mkS === 0);
  step(s, m, 0.1); assert.strictEqual(ln.tgt, far.id, 'the Lancer switches to the marked Heavy');
  const m0 = s.rangeGame({ factions: ['axiarchs', 'lastfist'], rework: { b4a: false } });
  const mk0 = s.rangeUnit(m0, 0, 'marksman', 500, 0), f0 = s.rangeUnit(m0, 1, 'heavy', 760, 0); tough(f0); m0.sides[1].hush = true; mk0.po = { o: 'target', id: f0.id };
  step(s, m0, 5); assert.ok(f0.hp < f0.maxHp && !f0.mkT, 'b4a off: no mark');
});

test('Bilecaster: range 150, a glob every 2.6 s (20 within 30) leaves a pool (40, 8 s): 8/s and corroded inside and 2 s after; 3 pools each', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const B = s.rangeUnit(g, 0, 'bilecaster', 500, 0), R = s.rangeUnit(g, 1, 'heavy', 640, 0), far = s.rangeUnit(g, 1, 'rifle', 900, 0); tough(R, far);
  g.sides[1].hush = true; s.rangeMode(g, 0, 'hold');
  assert.ok(until(s, g, () => g.acid.length > 0, 4), 'a pool');
  const P0 = g.acid[0]; assert.strictEqual(P0.kind, 'bile'); assert.strictEqual(P0.own, B.id); assert.ok(Math.abs(P0.end - g.t - s.BILE.life) < 0.05);
  assert.ok(Math.hypot(P0.u - R.u, P0.v - R.v) < 2, 'where its target stood');
  assert.ok(R.corrT > g.t && Math.abs(R.corr - s.BILE.corr) < 1e-9, 'corroded inside');
  // the burn: 8 a second (×1.2 corroded, heavy armour 1.0), measured over a second with no new glob landing
  B.cd = 1e6; B.po = { o: 'hold' }; const h0 = R.hp; step(s, g, 1); const burn = h0 - R.hp; assert.ok(Math.abs(burn - s.BILE.dps * (1 + s.BILE.corr)) < 0.5, `burn ${burn}`);
  // stepping out: corroded 2 s more, then not
  R.u = 900; R.v = 80; step(s, g, 1.5); assert.ok(R.corrT > g.t, 'still corroded 1.5 s after leaving'); step(s, g, 1); assert.ok(!(R.corrT > g.t), 'not after 2 s');
  // three pools each; a fourth removes its oldest; they don't count toward the Ruinmaw's six
  R.u = 640; R.v = 0; B.cd = 0; let seen = 0; for (let i = 0; i < 60 * 12; i++) { s.rangeStep(g); seen = Math.max(seen, g.acid.filter(a => a.own === B.id).length); R.u = 600 + (i % 120); }
  assert.strictEqual(seen, s.BILE.max, 'at most 3');
  assert.ok(s.rwD(g, 'bilecaster').range === 150 && s.rwD(g, 'bilecaster').cd === 2.6 && far.hp === far.maxHp, 'nothing at 400');
});

test('Gunship: salvos of 4 missiles 0.15 s apart, 22 each, then a 3.4 s reload; ground and air', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['lastfist', 'lastfist'] });
  const G = s.rangeUnit(g, 0, 'aircraft', 500, 0), T = s.rangeUnit(g, 1, 'tank', 600, 0); tough(T); g.sides[1].hush = true; s.rangeMode(g, 0, 'hold');
  const shots = []; for (let i = 0; i < 60 * 8; i++) { const n = g.projs.length; s.rangeStep(g); for (const p of g.projs.slice(n)) shots.push([g.t, p.dmg, p.gs]); }
  assert.ok(shots.length >= 8, `${shots.length} missiles`);
  for (let k = 1; k < 4; k++) assert.ok(Math.abs(shots[k][0] - shots[k - 1][0] - s.SALVO.gap) < 0.02, 'a salvo: 0.15 s apart');
  const gap = shots[4][0] - shots[3][0]; assert.ok(gap > s.SALVO.reload * 0.88 && gap < s.SALVO.reload * 1.12, `then the reload (${gap})`);
  assert.ok(shots.every(x => x[1] === s.SALVO.dmg && x[2] === 1), '22 each');
  assert.ok(s.rwD(g, 'aircraft').hitsAir && s.rwD(g, 'aircraft').range === s.UDEF.aircraft.range);
});

test('Wraithwing: hops of up to 90 every 0.9 s, a bolt each landing; shots flying at it miss; 0.4 s before enemies can target it again', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const W = s.rangeUnit(g, 0, 'wraithwing', 300, 0), H = s.rangeUnit(g, 1, 'heavy', 800, 0); tough(H); g.sides[1].hush = true;
  W.po = { o: 'go', ju: 700, jv: 0 }; s.rangeMode(g, 0, 'attack');
  const hops = []; let px = W.u, py = W.v;
  for (let i = 0; i < 60 * 6; i++) { s.rangeStep(g); const d = Math.hypot(W.u - px, W.v - py); if (d > 0.01) hops.push([g.t, d]); px = W.u; py = W.v; }
  assert.ok(hops.length >= 4, `${hops.length} hops`);
  assert.ok(hops.every(h => h[1] <= s.HOP.len + 1e-6), 'never more than 90 at once (no smooth flight)');
  for (let k = 1; k < hops.length; k++) assert.ok(hops[k][0] - hops[k - 1][0] >= s.HOP.every - 0.02, 'one every 0.9 s');
  assert.ok(H.hp < H.maxHp, 'its bolts landed');
  // a shot in flight at it loses it when it hops; right after, it can't be targeted
  const m = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const W2 = s.rangeUnit(m, 0, 'wraithwing', 600, 0), Hy = s.rangeUnit(m, 1, 'heavy', 700, 0); tough(Hy, W2); m.sides[0].hush = true;
  W2.hopT = m.t + 0.5; // its next hop in 0.5 s
  assert.ok(until(s, m, () => m.projs.some(p => p.target === W2), 3), 'a rocket at it');
  const p = m.projs.find(q => q.target === W2);
  W2.hopT = 0; m.sides[0].hush = false; W2.po = { o: 'go', ju: 520, jv: 30 };
  assert.ok(until(s, m, () => p.target !== W2, 1), 'it hopped');
  assert.ok(p.miss === 1 && p.target === null, 'the rocket lost it');
  assert.ok(W2.wwT > m.t && Math.abs(W2.wwT - W2.hopS - s.HOP.reacq) < 1e-9, '0.4 s untargetable');
  assert.strictEqual(s.acquire(m, Hy, s.rwD(m, 'heavy'), [W2]).best, null, 'the Heavy can\'t pick it');
});

test('AI: Snipers aim at infantry lines, Marksmen at the most valuable target, Gunships open salvos on vehicles, Bilecasters on bunched fights; Wraithwings raid', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['lastfist', 'axiarchs'] });
  const sn = s.rangeUnit(g, 0, 'sniper', 500, 0), lone = s.rangeUnit(g, 1, 'shardling', 600, -60);
  const line = [0, 1, 2].map(i => s.rangeUnit(g, 1, 'shardling', 680 + i * 18, 40));
  const foes = g.ents.filter(e => e.side === 1);
  assert.strictEqual(s.aim4(g, sn, s.rwD(g, 'sniper'), lone, foes), line[0], 'the line, not the nearer lone unit');
  const h = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const mk = s.rangeUnit(h, 0, 'marksman', 500, 0), rifle = s.rangeUnit(h, 1, 'rifle', 600, 0), tank = s.rangeUnit(h, 1, 'tank', 760, 0);
  assert.strictEqual(s.aim4(h, mk, s.rwD(h, 'marksman'), rifle, h.ents.filter(e => e.side === 1)), tank, 'the Tank (most valuable)');
  const k = s.rangeGame({ factions: ['lastfist', 'bloomhost'] });
  const gs = s.rangeUnit(k, 0, 'aircraft', 500, 0), sk = s.rangeUnit(k, 1, 'skitterling', 560, 0), bw = s.rangeUnit(k, 1, 'bulwark', 620, 10);
  const veh = s.rangeGame({ factions: ['lastfist', 'lastfist'] }); const gs2 = s.rangeUnit(veh, 0, 'aircraft', 500, 0), rf = s.rangeUnit(veh, 1, 'rifle', 560, 0), tk = s.rangeUnit(veh, 1, 'tank', 620, 10);
  assert.strictEqual(s.aim4(veh, gs2, s.rwD(veh, 'aircraft'), rf, veh.ents.filter(e => e.side === 1)), tk, 'a salvo opens on the Tank');
  const b = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const bc = s.rangeUnit(b, 0, 'bilecaster', 500, 0), solo = s.rangeUnit(b, 1, 'rifle', 580, -50), pack = [0, 1, 2, 3].map(i => s.rangeUnit(b, 1, 'rifle', 620 + (i % 2) * 10, 30 + (i >> 1) * 10));
  assert.ok(pack.includes(s.aim4(b, bc, s.rwD(b, 'bilecaster'), solo, b.ents.filter(e => e.side === 1))), 'the bunch, not the lone Marine');
  // Wraithwings raid an economy building it knows of, unless enemies are at its base
  const m = s.newGame('hard', { seed: 4, factions: ['axiarchs', 'lastfist'], autoPlayer: true, autoDiff: 'hard' }); m.countdown = 0;
  const W = s.spawnUnit(m, 0, 'wraithwing', s.hqU(0) + 60, 0); const ref = m.ents.find(e => e.side === 1 && e.type === 'hq');
  m.fog[0].ghosts[999] = { id: 999, type: 'refinery', u: ref.u - 120, v: 40, half: 20, tier: 1 };
  s.aiRework4a(m, 0, m.ents.filter(e => e.side === 0 && e.kind === 'u'));
  assert.ok(W.wwR && Math.abs(W.wwR[0] - (ref.u - 120)) < 1e-6, 'it heads for the Refinery');
});

test('texts: descriptions, path steps and unit tips follow the switch, numbers read live', () => {
  const s = loadSim();
  assert.match(s.UDEF.sniper.desc, /pin/); assert.match(s.UDEF.marksman.desc, /marks/); assert.match(s.UDEF.bilecaster.desc, /acid pools/);
  assert.match(s.UDEF.aircraft.desc, /salvos/); assert.match(s.UDEF.wraithwing.desc, /hops/);
  assert.match(s.TREES.barracks.A.steps[3].txt, /pin/); assert.match(s.TREES_BH.barracks.B.steps[3].txt, /acid pools/); assert.match(s.TREES_AX.barracks.B.steps[3].txt, /mark/);
  s.REWORK.b4a = false;
  assert.doesNotMatch(s.UDEF.sniper.desc, /pin/); assert.match(s.UDEF.wraithwing.desc, /phases/); assert.match(s.TREES_BH.barracks.B.steps[3].txt, /Bilecasters/); assert.doesNotMatch(s.TREES_BH.barracks.B.steps[3].txt, /acid pools/);
  s.REWORK.b4a = true;
});
