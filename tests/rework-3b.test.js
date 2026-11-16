// v2.85 (docs/FACTION_REWORK.md batch 3b): the Dreadthorn (charge, trample, knock aside, daze), the Bastion (the barrier),
// the Shardling (the parry and counter), the Bulwark (creep regeneration), behind REWORK.b3b (per game, g.rw.b3b); and Part
// 0, the batch 3a Riftstalker staying to fight after a strike. Played on Test Range games (the real SIM).
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');

const step = (s, g, sec) => { for (let i = 0; i < Math.round(sec * 60); i++) s.rangeStep(g); };
const until = (s, g, f, sec = 20) => { for (let i = 0; i < sec * 60; i++) { if (f()) return true; s.rangeStep(g); } return f(); };
const seenEv = (g, set, types) => { for (const e of g.events) if (!set.has(e)) { set.add(e); if (types.includes(e.type)) set.list.push(e); } };

test('switch: per game; b3b off plays the v2.84 units (UDEF untouched), on plays the batch\'s definitions; saves', () => {
  const s = loadSim();
  const on = s.rangeGame({ factions: ['bloomhost', 'axiarchs'] }), off = s.rangeGame({ factions: ['bloomhost', 'axiarchs'], rework: { b3b: false } });
  assert.ok(s.rwB3b(on) && !s.rwB3b(off));
  for (const t of ['dreadthorn', 'bastion', 'shardling', 'bulwark']) assert.strictEqual(s.rwD(off, t), s.UDEF[t], `off: the plain UDEF entry (${t})`);
  assert.ok(s.rwD(on, 'dreadthorn').trample && !s.rwD(on, 'dreadthorn').burst && s.UDEF.dreadthorn.burst, 'no spine burst in b3b; UDEF keeps it');
  assert.ok(s.rwD(on, 'bastion').barrier && !s.rwD(on, 'bastion').surge && !s.rwD(on, 'bastion').brace && s.UDEF.bastion.surge, 'no surge or brace in b3b; UDEF keeps the surge');
  assert.strictEqual(s.rwD(on, 'bastion').range, s.UDEF.bastion.range, 'its pulse unchanged');
  assert.ok(s.rwD(on, 'shardling').parry && s.rwD(on, 'bulwark').brace === s.UDEF.bulwark.brace, 'the Bulwark keeps its brace');
  assert.deepStrictEqual([s.rwD(on, 'shardling').cost, s.rwD(on, 'shardling').dmg], [s.UDEF.shardling.cost, s.UDEF.shardling.dmg], 'the Shardling\'s cost unchanged');
  // a save keeps the switch; a v2.84 save (rw without b3b) resumes with it off, and a b3b-off save has no b3b key
  const g = s.newGame('normal', { seed: 5 }); for (let i = 0; i < 120; i++) s.update(g, s.TICK);
  assert.strictEqual(s.deserialize(s.serialize(g, {})).rw.b3b, true);
  const o = JSON.parse(s.serialize(g, {})); delete o.rw.b3b; assert.strictEqual(s.deserialize(JSON.stringify(o)).rw.b3b, false);
  const g0 = s.newGame('normal', { seed: 5, rework: { b3b: false } }); assert.ok(!('b3b' in JSON.parse(s.serialize(g0, {})).rw));
  // off: the v2.37 spine burst and shield surge still happen
  const h = s.rangeGame({ factions: ['bloomhost', 'axiarchs'], rework: { b3b: false } });
  const d = s.rangeUnit(h, 0, 'dreadthorn', 600, 0), b = s.rangeUnit(h, 1, 'bastion', 640, 0); h.sides[0].hush = h.sides[1].hush = true;
  s.damage(h, d, 100, 'cannon', 1); assert.ok(d.burstCd > h.t, 'b3b off: a spine burst');
  s.damage(h, b, 10, 'cannon', 0); assert.ok(b.surgeT > h.t, 'b3b off: a shield surge');
});

// Seeded skirmishes (the Test Range, 40 s, the state hashed every second). With b3b off (and b3a off) they hash exactly as
// on v2.84's index.html (checked against the v2.84 build when recorded); with them on, recorded at v2.85.
function skirm(s, kind, rw) {
  const S = kind === 'a' ? { f: ['axiarchs', 'lastfist'], u: [['riftstalker', 600, -20, 3], ['lancer', 560, 10, 3]], v: [['sniper', 820, -20, 3], ['artillery', 900, 20, 2], ['heavy', 780, 30, 3], ['rifle', 760, -40, 4]] }
    : { f: ['bloomhost', 'axiarchs'], u: [['dreadthorn', 560, 0, 2], ['bulwark', 600, -30, 3], ['skitterling', 580, 30, 6]], v: [['bastion', 800, -10, 2], ['shardling', 760, 20, 5], ['lancer', 860, 0, 4], ['marksman', 900, -30, 2]] };
  const g = s.rangeGame({ seed: 11, factions: S.f, rework: rw });
  if (kind === 'b') s.rangeBuilding(g, 0, 'bloomhost', 'refinery', 520, 0);
  for (const [t, u, v, n] of S.u) for (let i = 0; i < n; i++) s.rangeUnit(g, 0, t, u + (i % 3) * 14, v + Math.floor(i / 3) * 16);
  for (const [t, u, v, n] of S.v) for (let i = 0; i < n; i++) s.rangeUnit(g, 1, t, u + (i % 3) * 14, v + Math.floor(i / 3) * 16);
  s.rangeMode(g, 0, 'attack'); s.rangeMode(g, 1, 'attack');
  const h = crypto.createHash('sha256');
  for (let i = 1; i <= 60 * 40; i++) { s.rangeStep(g); g.events.length = 0; if (i % 60 === 0) h.update(s.serialize(g, {})); }
  return h.digest('hex');
}
const SK = {
  a0: '3266424365228dd6f6ee756d68bae84933c44bafa2d9267fd0fccc18a4f58ec9', // Riftstalkers vs a Last Fist backline, b3a and b3b off: v2.84's (and v2.83's)
  b0: '82938680aa95f102d029a13a6240dadb20cbdc47577c69c8fcad966ae529279a', // Dreadthorns, Bulwarks vs Bastions, Shardlings, b3b off: v2.84's
  a1: '108613048d174e4a7f65210a18cbbf746a2cb1cafb90c3bbc89f4dae90030bd5', // b3a on (Part 0: no fade back; v2.84 hashed 3a46fedf…), b3b off
  a2: '73c5f6a84f022ac4d5f5c8024de247df8996d0e29d44826f2b34ab9670097e1d', // b3a and b3b on (only the saved switch differs from a1)
  b1: 'ab31b5e46f3287684b3de3e7c836f8f9bdec4e3372993cd06dc84391e68e670c', // b3b on
};
test('seeded skirmishes: b3a and b3b off hash as on v2.84; on, as recorded at v2.85 (Part 0 and batch 3b); all with batch 4a off (v2.86)', () => {
  const s = loadSim();
  assert.strictEqual(skirm(s, 'a', { b3a: false, b3b: false, b4a: false }), SK.a0);
  assert.strictEqual(skirm(s, 'b', { b3b: false, b4a: false }), SK.b0);
  assert.strictEqual(skirm(s, 'a', { b3b: false, b4a: false }), SK.a1);
  assert.strictEqual(skirm(s, 'a', { b4a: false }), SK.a2);
  assert.strictEqual(skirm(s, 'b', { b4a: false }), SK.b1);
});

test('Part 0, Riftstalker: after a strike it stays and fights its target (no fade back); out of targets it blinks home; an AI strikes from half shields', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const R = s.rangeUnit(g, 0, 'riftstalker', 600, 0), t = s.rangeUnit(g, 1, 'sniper', 720, 0); t.hp = t.maxHp = 1e5;
  g.sides[1].hush = true; R.po = { o: 'attack' }; R.holdU = undefined;
  assert.ok(until(s, g, () => R.rsH && !R.leaping), 'out on a strike');
  const h0 = t.hp; step(s, g, 3);
  assert.ok(R.rsH && !R.leaping && Math.hypot(R.u - t.u, R.v - t.v) < 40, 'still beside its target 3 s later');
  assert.ok(t.hp < h0 - 2 * s.UDEF.riftstalker.dmg, 'striking it again and again');
  // the target killed by someone else, nothing in reach: it blinks home after RS.idle
  const home = [R.fu, R.fv], ev = new Set(); ev.list = [];
  s.damage(g, t, 1e6, 'rifle', 0); assert.ok(until(s, g, () => !R.rsH, 2)); seenEv(g, ev, ['blinkHome']);
  assert.ok(ev.list.length && Math.hypot(R.u - home[0], R.v - home[1]) < 1e-6, 'home');
  // the AI's timing rule: half its shields (v2.84: 75%)
  assert.strictEqual(s.RS.aiShp, 0.5);
  const m = s.newGame('hard', { seed: 4, factions: ['axiarchs', 'lastfist'], autoPlayer: true, autoDiff: 'hard' }); m.countdown = 0;
  const a = s.spawnUnit(m, 0, 'riftstalker', 500, 0), b = s.spawnUnit(m, 0, 'riftstalker', 520, 0); a.shp = a.maxShp * 0.55; b.shp = b.maxShp * 0.45; m.sides[0].aiT = 0;
  s.update(m, s.TICK); assert.ok(!(a.aiHold > m.t) && b.aiHold > m.t, 'strikes at 55%, holds at 45%');
});

test('Dreadthorn: charges at an enemy 80-200 away (140/s, up to 220), 50 to every ground unit it passes once, knocked 30 aside; dazed 2 s; ready 14 s after it starts', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const D = s.rangeUnit(g, 0, 'dreadthorn', 500, 0), R = [];
  for (let i = 0; i < 6; i++) { const r = s.rangeUnit(g, 1, 'rifle', 640 + (i % 3) * 12, -6 + Math.floor(i / 3) * 12); r.hp = r.maxHp = 1000; R.push(r); }
  const far = s.rangeUnit(g, 1, 'heavy', 640, 90); far.hp = far.maxHp = 1000; // off the line
  g.sides[1].hush = true; D.po = { o: 'attack' }; D.holdU = undefined;
  const ev = new Set(); ev.list = [];
  assert.ok(until(s, g, () => { seenEv(g, ev, ['charge', 'chargeEnd']); return D.crg; }, 2), 'it charges');
  const t0 = g.t, u0 = D.u, v0 = R.map(r => r.v);
  assert.ok(Math.abs(D.crCd - t0 - s.TRAMPLE.cd) < 0.02);
  step(s, g, 0.5); assert.ok(Math.abs(Math.hypot(D.u - u0, 0) - s.TRAMPLE.speed * 0.5) < 6, `at ${s.TRAMPLE.speed}/s`);
  assert.ok(until(s, g, () => { seenEv(g, ev, ['charge', 'chargeEnd']); return !D.crg; }, 3));
  assert.ok(Math.hypot(D.u - D.crU0, D.v - D.crV0) <= s.TRAMPLE.len + 1e-6, 'never past 220');
  for (const r of R) assert.strictEqual(r.maxHp - r.hp, s.TRAMPLE.dmg * s.DMG.trample.light, 'each rifleman took 50 once');
  assert.strictEqual(far.hp, far.maxHp, 'off the line: untouched');
  step(s, g, 0.4); R.forEach((r, i) => assert.ok(Math.abs(Math.abs(r.v - v0[i]) - s.TRAMPLE.knock) < 1.5, `knocked aside (${(r.v - v0[i]).toFixed(1)})`));
  // dazed 2 s: no moves, no attacks
  assert.ok(D.dzT > g.t); const pu = D.u, cd = D.cd; step(s, g, 1.2); assert.strictEqual(D.u, pu, 'dazed: still'); assert.ok(D.cd <= cd, 'no attacks');
  assert.ok(until(s, g, () => D.dzT <= g.t, 2));
  assert.deepStrictEqual(ev.list.map(e => e.type), ['charge', 'chargeEnd']); assert.strictEqual(ev.list[1].hit, 6);
  // it stops at a building
  const h = s.rangeGame({ factions: ['bloomhost', 'lastfist'] }), D2 = s.rangeUnit(h, 0, 'dreadthorn', 500, 0), T2 = s.rangeUnit(h, 1, 'rifle', 640, 0);
  const B = s.rangeBuilding(h, 1, 'lastfist', 'refinery', 680, 0); h.sides[1].hush = true; D2.po = { o: 'attack' }; D2.holdU = undefined; T2.hp = T2.maxHp = 1e4;
  assert.ok(until(s, h, () => D2.crg, 2)); assert.ok(until(s, h, () => !D2.crg, 3));
  assert.ok(D2.u < B.u - B.half && D2.u - D2.crU0 < s.TRAMPLE.len - 20, `stopped at the building (${D2.u.toFixed(0)}, building at ${B.u})`);
});

test('Dreadthorn: an AI\'s charge needs a group or a big unit on the line (a lone Rifleman: no); a player\'s takes any; a target order aims it', () => {
  const s = loadSim();
  const mk = (direct, n) => { const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] }); const D = s.rangeUnit(g, 0, 'dreadthorn', 500, 0); for (let i = 0; i < n; i++) s.rangeUnit(g, 1, 'rifle', 650 + i * 10, 0); g.sides[1].hush = true; g.sides[0].direct = direct; if (!direct) { D.po = undefined; g.sides[0].stance = 'attack'; } else { D.po = { o: 'attack' }; } D.holdU = undefined; return { g, D }; };
  { const { g, D } = mk(false, 1); step(s, g, 1); assert.ok(!D.crCd, 'AI: not at one Rifleman'); }
  { const { g, D } = mk(false, 3); assert.ok(until(s, g, () => D.crg, 2), 'AI: at three'); }
  { const { g, D } = mk(true, 1); assert.ok(until(s, g, () => D.crg, 2), 'player: at one'); }
  // a target order: at that unit, even at 60 (inside the automatic minimum), and the charge line runs through it
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] }), D = s.rangeUnit(g, 0, 'dreadthorn', 500, 0), a = s.rangeUnit(g, 1, 'rifle', 560, 40), b = s.rangeUnit(g, 1, 'rifle', 650, -40);
  g.sides[1].hush = true; assert.ok(s.command(g, 0, [D.id], 'target', a.id).ok);
  assert.ok(until(s, g, () => D.crg, 2)); assert.ok(D.crV > 0.3, 'toward the tapped Rifleman (down the lane), not the other');
});

test('Bastion: its barrier takes enemy shots (shields and units behind untouched); friendly shots, lobbed shells and melee pass; 600, 30/s after 3 s, 8 s down when broken', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const B = s.rangeUnit(g, 0, 'bastion', 500, 0), L = s.rangeUnit(g, 0, 'lancer', 470, 0), r = s.rangeUnit(g, 1, 'rifle', 595, 0);
  B.cd = L.cd = 1e6; g.sides[0].hush = true; L.hp = L.maxHp = 1e5;
  step(s, g, 3);
  assert.ok(B.bwHp < s.BAR.hp, 'the wall takes the bullets'); assert.strictEqual(B.shp, B.maxShp, 'the Bastion\'s shields untouched'); assert.strictEqual(L.hp, L.maxHp);
  assert.strictEqual(B.bwF, 1, 'facing the enemy');
  // friendly shots pass out through it
  g.sides[0].hush = false; B.cd = 0; const r0 = r.hp; r.hp = r.maxHp = 1e5; step(s, g, 2); assert.ok(r.hp < r.maxHp, 'the Bastion\'s pulse goes out');
  g.sides[0].hush = true;
  // a lobbed shell arcs over it; a melee blow is not blocked
  const sh = s.rangeGame({ factions: ['axiarchs', 'lastfist'] }), B2 = s.rangeUnit(sh, 0, 'bastion', 500, 0), A = s.rangeUnit(sh, 1, 'artillery', 760, 0); sh.sides[0].hush = true; B2.hp = B2.maxHp = 1e5;
  assert.ok(until(s, sh, () => B2.shp < B2.maxShp || B2.hp < B2.maxHp, 20), 'shells hit it behind its wall'); assert.strictEqual(B2.bwHp, s.BAR.hp);
  const m = s.rangeGame({ factions: ['axiarchs', 'bloomhost'] }), B3 = s.rangeUnit(m, 0, 'bastion', 500, 0), k = s.rangeUnit(m, 1, 'skitterling', 600, 0); m.sides[0].hush = true;
  assert.ok(until(s, m, () => B3.shp < B3.maxShp, 10), 'melee gets through'); assert.strictEqual(B3.bwHp, s.BAR.hp);
  // health, regeneration, breaking
  const q = s.rangeGame({ factions: ['axiarchs', 'lastfist'] }), B4 = s.rangeUnit(q, 0, 'bastion', 500, 0); q.sides[1].hush = q.sides[0].hush = true; s.rangeStep(q);
  assert.strictEqual(B4.bwHp, 600);
  B4.bwHp = 300; B4.bwHit = q.t; step(s, q, 2.5); assert.ok(Math.abs(B4.bwHp - 300) < 1e-9, 'no regen inside 3 s');
  step(s, q, 1.5); assert.ok(B4.bwHp > 300 && B4.bwHp < 300 + 30 * 1.0 + 1, `30/s after 3 s (${B4.bwHp.toFixed(1)})`);
  const T = s.rangeUnit(q, 1, 'heavy', 600, 0); q.sides[1].hush = false; B4.bwHp = 1; T.hp = T.maxHp = 1e5;
  assert.ok(until(s, q, () => B4.bwDn > 0, 10), 'broken'); const t0 = q.t;
  assert.ok(until(s, q, () => !B4.bwDn, 10)); assert.ok(Math.abs(q.t - t0 - s.BAR.down) < 0.05, 'down 8 s'); assert.ok(B4.bwHp >= s.BAR.hp - 30, 'back at full health');
});

test('Bastion: a beam (an enemy Null Lance) strikes the barrier; the wall faces the nearest enemy it can see', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['axiarchs', 'axiarchs'] });
  const B = s.rangeUnit(g, 0, 'bastion', 500, 0), m = s.rangeUnit(g, 0, 'marksman', 470, 0), N = s.rangeBuilding(g, 1, 'axiarchs', 'turret', 640, 0); // a Null Lance
  g.sides[0].hush = true; m.hp = m.maxHp = B.hp = B.maxHp = 1e5; let beams = 0;
  for (let i = 0; i < 60 * 4; i++) { s.rangeStep(g); beams += g.fx.filter(f => f.k === 'beam' && f.t === 0).length; }
  assert.ok(beams > 0 && B.bwHp < s.BAR.hp, `the beams hit the wall (${beams})`); assert.deepStrictEqual([m.hp, m.shp, B.hp, B.shp], [m.maxHp, m.maxShp, B.maxHp, B.maxShp], 'nothing behind it hurt');
  const h = s.rangeGame({ factions: ['axiarchs', 'lastfist'] }), B2 = s.rangeUnit(h, 1, 'bastion', 800, 0); s.rangeUnit(h, 0, 'rifle', 600, 0); h.sides[0].hush = h.sides[1].hush = true; s.rangeStep(h);
  assert.strictEqual(B2.bwF, -1, 'a red Bastion with an enemy to its left faces left');
});

test('Shardling: every 4 s it parries the next hit in full (splash too); an attacker in melee with it takes 2x its damage back', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['axiarchs', 'bloomhost'] });
  const S = s.rangeUnit(g, 0, 'shardling', 500, 0), K = s.rangeUnit(g, 1, 'ravager', 520, 0); g.sides[0].hush = g.sides[1].hush = true; K.hp = K.maxHp = 1e5;
  const d = s.rwD(g, 'shardling'), hp0 = [S.hp, S.shp];
  s.damage(g, S, 40, 'maul', 1, K);
  assert.deepStrictEqual([S.hp, S.shp], hp0, 'negated in full');
  assert.ok(Math.abs(K.maxHp - K.hp - d.dmg * 2 * s.DMG[d.weapon][s.UDEF.ravager.armor]) < 1e-6, 'the counter: 2x');
  assert.ok(Math.abs(S.prT - g.t - s.PARRY.cd) < 1e-9);
  s.damage(g, S, 10, 'maul', 1, K); assert.ok(S.shp < hp0[1], 'inside the 4 s: it lands');
  // a ranged attacker out of reach: parried, no counter; splash parried too
  g.t = S.prT; const far = s.rangeUnit(g, 1, 'spitter', 640, 0), f0 = far.hp, sh = S.shp; s.damage(g, S, 30, s.UDEF.spitter.weapon, 1, far);
  assert.strictEqual(S.shp, sh); assert.strictEqual(far.hp, f0, 'no counter out of reach');
  g.t = S.prT; s.impact(g, { u: S.u + 5, v: S.v, z: 0, side: 1, weapon: 'shell', dmg: 30, splash: 40 }, null); assert.strictEqual(S.shp, sh, 'splash parried');
  // acid pools burn on without spending it
  g.t = S.prT; const ready = S.prT; s.damage(g, S, 1, 'acidpool', 1); assert.strictEqual(S.prT, ready, 'not an acid pool\'s steady burn');
});

test('Bulwark: braces as before; on its own creep 8 health a second in combat, 3x the creep regeneration out of it; off creep nothing', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  s.rangeBuilding(g, 0, 'bloomhost', 'refinery', 500, 0); step(s, g, 12); // its creep grows
  const W = s.rangeUnit(g, 0, 'bulwark', 520, 0), far = s.rangeUnit(g, 0, 'bulwark', 900, 0); g.sides[0].hush = g.sides[1].hush = true;
  assert.ok(s.onCreep(g, 0, W.u, W.v) && !s.onCreep(g, 0, far.u, far.v));
  W.hp = far.hp = 300; W.lastHurt = far.lastHurt = g.t; step(s, g, 1);
  assert.ok(Math.abs(W.hp - 300 - s.BULK.fight) < 0.3, `in combat: 8/s (${(W.hp - 300).toFixed(2)})`); assert.strictEqual(far.hp, 300, 'off creep: nothing');
  W.hp = 300; W.lastHurt = W.lastAct = -99; step(s, g, 1);
  const rg = s.creepRegen(g, 0) * s.BULK.calm * W.maxHp; assert.ok(Math.abs(W.hp - 300 - rg) < rg * 0.05 + 0.5, `out of combat: 3x (${(W.hp - 300).toFixed(1)} vs ${rg.toFixed(1)})`);
  // the brace, unchanged
  W.braceCd = 0; s.damage(g, W, 100, 'cannon', 1); assert.ok(W.braceT > g.t);
});

test('AI: Bastions screen its ranged units, ranged units wait behind them on the attack; Bulwarks defending hold on the creep', () => {
  const s = loadSim();
  const g = s.newGame('hard', { seed: 3, factions: ['axiarchs', 'bloomhost'], autoPlayer: true, autoDiff: 'hard' }); g.countdown = 0;
  const dir = s.dirOf(0), B = s.spawnUnit(g, 0, 'bastion', 500, 0), L = [0, 1, 2].map(i => s.spawnUnit(g, 0, 'lancer', 470 + i * 6, -20 + i * 20));
  g.sides[0].stance = 'attack';
  s.aiRework3b(g, 0, g.ents.filter(e => e.kind === 'u' && e.side === 0));
  assert.deepStrictEqual([...B.bsG].sort(), L.map(e => e.id).sort());
  L[0].u = B.u + dir * 40; s.aiRework3b(g, 0, g.ents.filter(e => e.kind === 'u' && e.side === 0)); assert.ok(L[0].aiWait > g.t, 'ahead of its Bastion: it waits');
  // Bulwarks: defending (not attacking), a spot on their creep; attacking, none
  for (let i = 0; i < 60 * 20; i++) s.update(g, s.TICK); // creep grows round the Hive
  const W = s.spawnUnit(g, 1, 'bulwark', s.hqU(1), 0); g.sides[1].stance = 'retreat';
  s.aiRework3b(g, 1, g.ents.filter(e => e.kind === 'u' && e.side === 1));
  assert.ok(W.bkG && s.onCreep(g, 1, W.bkG[0], W.bkG[1]), 'a spot on its creep');
  g.sides[1].stance = 'attack'; s.aiRework3b(g, 1, g.ents.filter(e => e.kind === 'u' && e.side === 1)); assert.strictEqual(W.bkG, undefined);
});

test('texts: descriptions, path step and unit tips follow the switch, numbers read live', () => {
  const s = loadSim();
  assert.match(s.UDEF.dreadthorn.desc, /charg/); assert.match(s.UDEF.bastion.desc, /wall/); assert.match(s.UDEF.shardling.desc, /parr/); assert.match(s.UDEF.bulwark.desc, /creep/);
  assert.match(s.TREES_BH.factory.B.steps[3].txt, /trample/);
  s.REWORK.b3b = false; assert.match(s.UDEF.dreadthorn.desc, /spines/); assert.match(s.TREES_BH.factory.B.steps[3].txt, /spine burst/); s.REWORK.b3b = true;
});
