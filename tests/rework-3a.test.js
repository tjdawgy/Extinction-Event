// v2.84 (docs/FACTION_REWORK.md batch 3a): the Leaper (latching, hatching), the Riftstalker (backline strike, chain
// blinks, blinking home), the Parallax (the guardian swap), the Ravager (remains, devouring, stacks), behind REWORK.b3a
// (per game, g.rw.b3a). Played on Test Range games (the real SIM).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const step = (s, g, sec) => { for (let i = 0; i < Math.round(sec * 60); i++) s.rangeStep(g); };
const until = (s, g, f, sec = 20) => { for (let i = 0; i < sec * 60; i++) { if (f()) return true; s.rangeStep(g); } return f(); };

test('switch: per game; b3a off plays the v2.83 units (UDEF untouched), on plays the batch\'s definitions; saves', () => {
  const s = loadSim();
  const on = s.rangeGame({ factions: ['axiarchs', 'bloomhost'] }), off = s.rangeGame({ factions: ['axiarchs', 'bloomhost'], rework: { b3a: false } });
  assert.ok(s.rwB3a(on) && !s.rwB3a(off));
  for (const t of ['leaper', 'riftstalker', 'parallax', 'ravager']) assert.strictEqual(s.rwD(off, t), s.UDEF[t], `off: the plain UDEF entry (${t})`);
  assert.ok(!s.rwD(on, 'parallax').leap && s.UDEF.parallax.leap, 'the Parallax has no leap in b3a; UDEF keeps it');
  assert.ok(!s.rwD(on, 'ravager').bloodfrenzy && s.UDEF.ravager.bloodfrenzy, 'no kill frenzy in b3a; UDEF keeps it');
  assert.ok(s.rwD(on, 'leaper').latch && s.rwD(on, 'leaper').leap.range === s.UDEF.leaper.leap.range);
  // a save keeps the switch; a v2.83 save (rw without b3a) resumes with it off, and a b3a-off save has no b3a key
  const g = s.newGame('normal', { seed: 5 }); for (let i = 0; i < 120; i++) s.update(g, s.TICK);
  assert.strictEqual(s.deserialize(s.serialize(g, {})).rw.b3a, true);
  const o = JSON.parse(s.serialize(g, {})); delete o.rw.b3a; assert.strictEqual(s.deserialize(JSON.stringify(o)).rw.b3a, false);
  const g0 = s.newGame('normal', { seed: 5, rework: { b3a: false } }); assert.ok(!('b3a' in JSON.parse(s.serialize(g0, {})).rw));
  // off: the old Ravager frenzies on a kill
  const h = s.rangeGame({ factions: ['bloomhost', 'lastfist'], rework: { b3a: false } });
  const r = s.rangeUnit(h, 0, 'ravager', 600, 0), v = s.rangeUnit(h, 1, 'rifle', 610, 0); s.damage(h, v, 1e4, 'maul', 0, r);
  assert.ok(r.frzT > h.t && !h.rem, 'b3a off: the v2.37 frenzy, no remains');
});

test('Leaper: leaps onto the big unit in reach (never aircraft or buildings), rides it, eats 10/s, slows it 30% (not stacking); 3 per host', () => {
  const s = loadSim(); s.REWORK.b6c = false; s.REWORK.b6ai = false; s.REWORK.b6d = false; /* v2.94 */ /* v2.93: v2.92's numbers (batch 6c's tuning, on by default, is tested in tests/rework-6c.test.js) */
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const L = [0, 1, 2, 3].map(i => s.rangeUnit(g, 0, 'leaper', 650, -15 + i * 10));
  const tank = s.rangeUnit(g, 1, 'tank', 760, 0), rifle = s.rangeUnit(g, 1, 'rifle', 720, 30), heli = s.rangeUnit(g, 1, 'aircraft', 700, 0);
  s.rangeBuilding(g, 1, 'lastfist', 'turret', 700, -110);
  g.sides[1].hush = true;
  for (const e of L) { e.po = { o: 'attack' }; e.holdU = undefined; }
  assert.strictEqual(s.latchPick(g, L[0], g.ents.filter(e => e.side === 1), 140), tank, 'the Tank first (a vehicle), not the nearer Marine');
  assert.ok(until(s, g, () => L.filter(e => e.lt === tank.id).length === 3), 'three latch on');
  assert.ok(!L.some(e => e.lt === heli.id), 'never aircraft');
  const four = L.find(e => e.lt !== tank.id); assert.ok(four.lt !== tank.id, 'the fourth finds another host or bites');
  for (const e of L.filter(e => e.lt === tank.id)) assert.ok(e.u === tank.u && e.v === tank.v, 'rides on the host');
  // eats: 3 Leapers x 10/s
  const h0 = tank.hp; step(s, g, 2); const lost = h0 - tank.hp;
  assert.ok(Math.abs(lost - 3 * s.LATCH.dps * 2 * s.DMG.latch.vehicle) <= 3 * s.LATCH.dps * s.LATCH.tick + 1e-6, `eats ${lost.toFixed(1)} in 2 s`);
  assert.ok(tank.ltT > g.t, 'slowed');
  // the slow: 30%, however many ride it
  g.sides[1].hush = false; tank.po = { o: 'retreat' }; tank.holdU = undefined; // retreating: it walks on, holding fire
  const u0 = tank.u; step(s, g, 1); const sp = (tank.u - u0);
  assert.ok(Math.abs(sp - s.UDEF.tank.speed * (1 - s.LATCH.slow)) < 2, `moves at 70% (${sp.toFixed(1)} vs ${s.UDEF.tank.speed})`);
  // it can be hit (it stands where the host stands): splash at the host reaches it
  const rider = L.find(e => e.lt === tank.id), r0 = rider.hp;
  s.impact(g, { u: tank.u, v: tank.v, z: 0, side: 0 === rider.side ? 1 : 0, weapon: 'shell', dmg: 20, splash: 40 }, null);
  assert.ok(rider.hp < r0, 'splash aimed at the host hits a Leaper on it');
});

test('Leaper: the host dying hatches 2 temporary Skitterlings per Leaper (at most 6), 20 s, no supply, no node capture; they drop off and carry on', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const L = [0, 1, 2].map(i => s.rangeUnit(g, 0, 'leaper', 650, -10 + i * 10)), tank = s.rangeUnit(g, 1, 'tank', 760, 0);
  g.sides[1].hush = true; for (const e of L) { e.po = { o: 'attack' }; e.holdU = undefined; }
  assert.ok(until(s, g, () => L.every(e => e.lt === tank.id)));
  const pop0 = s.popUsed(g, 0);
  s.damage(g, tank, 1e4, 'rifle', 0);
  const sk = g.ents.filter(e => e.type === 'skitterling' && e.hp > 0);
  assert.strictEqual(sk.length, 6, '3 Leapers x 2');
  for (const e of sk) { assert.strictEqual(e.tSrc, 'hatch'); assert.ok(Math.abs(e.temp - g.t - s.LATCH.life) < 1e-9); assert.strictEqual(e.noCap, 1); }
  assert.strictEqual(s.popUsed(g, 0), pop0, 'no supply');
  assert.ok(L.every(e => !e.lt && e.hp > 0), 'the Leapers drop off');
  // cap: 4 Leapers on a host (forced) still hatch at most 6
  const h = s.rangeGame({ factions: ['bloomhost', 'lastfist'] }), T = s.rangeUnit(h, 1, 'titan', 760, 0);
  for (let i = 0; i < 4; i++) { const e = s.rangeUnit(h, 0, 'leaper', 760, 0); e.lt = T.id; }
  s.damage(h, T, 1e5, 'rifle', 0); assert.strictEqual(h.ents.filter(e => e.type === 'skitterling').length, 6, 'at most 6 per host');
  // temporary Skitterlings never count for a node
  const m = s.newGame('normal', { seed: 3, factions: ['bloomhost', 'lastfist'] }); m.countdown = 0; for (const sd of m.sides) sd.aiT = 1e9;
  const n = m.nodes[0], k = s.spawnUnit(m, 0, 'skitterling', n.u, n.v); Object.assign(k, { temp: m.t + 99, tLife: 99, tSrc: 'hatch', noCap: 1 }); k.po = { o: 'hold' }; k.holdU = n.u; k.holdV = n.v;
  for (let i = 0; i < 60 * 20; i++) s.update(m, s.TICK);
  assert.notStrictEqual(m.nodes[0].owner, 0, 'a hatchling alone never captures');
});

test('Riftstalker: strikes a ranged unit, chain-blinks on a kill (up to 2), then blinks home with nothing in reach; its shields breaking out there blinks it home', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const R = s.rangeUnit(g, 0, 'riftstalker', 600, 0);
  const a = s.rangeUnit(g, 1, 'sniper', 700, 0), b = s.rangeUnit(g, 1, 'sniper', 780, 20), c = s.rangeUnit(g, 1, 'artillery', 850, -10), d = s.rangeUnit(g, 1, 'sniper', 930, 0);
  for (const e of [a, b, c, d]) e.hp = 5;
  g.sides[1].hush = true; R.po = { o: 'attack' }; R.holdU = undefined;
  const seen = []; for (let i = 0; i < 60 * 6; i++) { s.rangeStep(g); for (const e of g.events) if (['leap', 'chain', 'blinkHome'].includes(e.type) && !seen.includes(e)) seen.push(e); if (!R.rsH && seen.some(e => e.type === 'chain')) break; }
  const ty = seen.map(e => e.type);
  assert.strictEqual(ty[0], 'leap'); assert.strictEqual(ty.filter(t => t === 'chain').length, 2, `two chain blinks (${ty})`);
  assert.ok(a.dead && [b, c, d].filter(e => e.dead).length === 2, 'three kills in one strike');
  assert.ok(!R.rsH && ty.includes('blinkHome'), `out of chain targets with nothing in reach, it blinks home (v2.85) (${ty})`);
  // shields breaking while out: straight home
  const h = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const Q = s.rangeUnit(h, 0, 'riftstalker', 600, 0), sn = s.rangeUnit(h, 1, 'sniper', 700, 0); sn.hp = sn.maxHp = 1e5;
  h.sides[1].hush = true; Q.po = { o: 'attack' }; Q.holdU = undefined;
  assert.ok(until(s, h, () => Q.rsH && !Q.leaping), 'out on a strike');
  const home = [Q.fu, Q.fv]; assert.ok(Math.hypot(Q.u - home[0], Q.v - home[1]) > 40);
  s.damage(h, Q, Q.shp + 1, 'rifle', 1); assert.strictEqual(Q.rsBrk, 1);
  s.rangeStep(h); assert.ok(Math.hypot(Q.u - home[0], Q.v - home[1]) < 1e-6 && !Q.rsH, 'blinked home');
  // not out on a strike: shields breaking do nothing
  const q = s.rangeGame({ factions: ['axiarchs', 'lastfist'] }), W = s.rangeUnit(q, 0, 'riftstalker', 600, 0); q.sides[1].hush = true;
  s.damage(q, W, W.shp + 1, 'rifle', 1); assert.ok(!W.rsBrk);
});

test('Parallax: no leap; swaps places with the most expensive wounded Axiarch ground ally within 160 (10 s cooldown); not under 40%, never exiled or burrowed', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const p = s.rangeUnit(g, 0, 'parallax', 500, 0), cheap = s.rangeUnit(g, 0, 'shardling', 600, -20), dear = s.rangeUnit(g, 0, 'bastion', 620, 20), far = s.rangeUnit(g, 0, 'eventide', 700, 0);
  for (const e of [cheap, dear, far]) e.hp = e.maxHp * 0.2;
  g.sides[1].hush = true;
  const [du, dv] = [dear.u, dear.v]; step(s, g, 0.3);
  assert.ok(p.u === du && p.v === dv && dear.u === 500 && dear.v === 0, 'swapped with the Bastion (the most expensive in reach; the Eventide is 200 away)');
  assert.ok(Math.abs(p.swCd - (g.t - 0.3 + s.SWAP.cd)) < 0.3, '10 s cooldown');
  dear.hp = dear.maxHp * 0.1; const pu = p.u; step(s, g, 2); assert.strictEqual(p.u, pu, 'not again during the cooldown');
  // its own health under 40%: no swap; an exiled ally: no swap
  const h = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const p2 = s.rangeUnit(h, 0, 'parallax', 500, 0), a2 = s.rangeUnit(h, 0, 'lancer', 600, 0); a2.hp = a2.maxHp * 0.1; h.sides[1].hush = true;
  p2.hp = p2.maxHp * 0.35; step(s, h, 0.5); assert.strictEqual(p2.u, 500, 'not while hurt itself');
  p2.hp = p2.maxHp; a2.exS = h.t; a2.exT = h.t + 3; a2.gone = 2; step(s, h, 0.5); assert.strictEqual(p2.u, 500, 'never an exiled unit');
  // no leap at all
  const k = s.rangeGame({ factions: ['axiarchs', 'lastfist'] }), p3 = s.rangeUnit(k, 0, 'parallax', 500, 0), t3 = s.rangeUnit(k, 1, 'heavy', 600, 0);
  k.sides[1].hush = true; p3.po = { o: 'attack' }; p3.holdU = undefined; t3.hp = t3.maxHp = 1e5;
  let leapt = false; for (let i = 0; i < 240; i++) { s.rangeStep(k); if (p3.leaping) leapt = true; } assert.ok(!leapt, 'it walks in');
});

test('Ravager: ground units leave remains for 6 s (not Mites or temporary Skitterlings); it devours them (1.5 s, no attacks) for 30% health and a stack, up to 3', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const r = s.rangeUnit(g, 0, 'ravager', 500, 0), base = r.maxHp, d0 = s.rwD(g, 'ravager').dmg;
  const kill = (t, side = 1, f) => { const e = s.rangeUnit(g, side, t, 530, 0); if (f) f(e); s.damage(g, e, 1e5, 'rifle', 1 - side); return e; };
  kill('rifle'); assert.strictEqual(g.rem.length, 1); assert.ok(Math.abs(g.rem[0].t1 - g.t - s.RAV.life) < 1e-9);
  kill('aircraft'); kill('skitterling', 0, e => { e.temp = g.t + 9; }); assert.strictEqual(g.rem.length, 1, 'no remains from aircraft or temporary Skitterlings');
  r.hp = base * 0.5; // hurt: it eats even in a fight
  assert.ok(until(s, g, () => r.dvT > 0, 1)); const t0 = g.t;
  assert.ok(until(s, g, () => !r.dvT, 3)); assert.ok(Math.abs(g.t - t0 - s.RAV.eat) < 0.05, 'over 1.5 s');
  assert.strictEqual(r.rvS, 1); assert.ok(Math.abs(r.maxHp - base * 1.1) < 1e-6, '+10% max health');
  assert.ok(Math.abs(r.hp - (base * 0.5 + base * 0.1 + r.maxHp * s.RAV.heal)) < 1e-6, '30% of its max health back');
  assert.strictEqual(g.rem.length, 0, 'eaten');
  // +10% damage per stack
  const v = s.rangeUnit(g, 1, 'heavy', 520, 0); v.hp = v.maxHp = 1e5; const h0 = v.hp; s.fire(g, r, v, s.rwD(g, 'ravager'));
  assert.ok(Math.abs((h0 - v.hp) - d0 * 1.1 * s.DMG.maul.heavy) < 1e-6, '+10% damage'); s.rangeRemove(g, v);
  // out of combat (unhurt 2 s, nothing near) it eats too; never past 3 stacks
  r.lastHurt = -99; r.hp = r.maxHp;
  for (let i = 0; i < 4; i++) { kill('rifle'); assert.ok(until(s, g, () => r.dvT > 0, 4)); assert.ok(until(s, g, () => !r.dvT, 3)); }
  assert.strictEqual(r.rvS, 3); assert.ok(Math.abs(r.maxHp - base * 1.3) < 1e-6, 'capped at 3 stacks');
  // not while fighting at full health
  const g2 = s.rangeGame({ factions: ['bloomhost', 'lastfist'] }), r2 = s.rangeUnit(g2, 0, 'ravager', 500, 0), foe = s.rangeUnit(g2, 1, 'heavy', 520, 0);
  foe.hp = foe.maxHp = 1e5; g2.sides[1].hush = true; const x = s.rangeUnit(g2, 1, 'rifle', 540, 0); s.damage(g2, x, 1e5, 'rifle', 0);
  step(s, g2, 3); assert.ok(!r2.rvS && !r2.dvT, 'busy fighting at full health: it keeps fighting');
});

test('AI: aims Leapers at big units, Riftstalkers at exposed ranged units, keeps Parallaxes beside its most expensive units; scores and tastes', () => {
  const s = loadSim();
  const g = s.newGame('hard', { seed: 9, factions: ['bloomhost', 'axiarchs'] }); g.countdown = 0;
  for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); }
  const lp = s.spawnUnit(g, 1, 'leaper', 900, 0);
  g.sides[1].faction = 'bloomhost';
  const tank = s.spawnUnit(g, 0, 'bulwark', 1100, 0), sk = s.spawnUnit(g, 0, 'skitterling', 950, 0);
  s.aiRework3a(g, 1, [lp]); assert.strictEqual(lp.ltAim, tank.id, 'the big unit (a Bulwark), not the nearer Skitterling');
  const rs = s.spawnUnit(g, 1, 'riftstalker', 900, 60), sp1 = s.spawnUnit(g, 0, 'spitter', 1050, 60), sp2 = s.spawnUnit(g, 0, 'spitter', 1100, -60);
  for (let i = 0; i < 3; i++) s.spawnUnit(g, 0, 'bulwark', 1050 + i * 10, 70);
  s.aiRework3a(g, 1, [rs]); assert.strictEqual(rs.ltAim, undefined); assert.strictEqual(rs.rsAim, sp2.id, 'the unguarded Spitter');
  const px = s.spawnUnit(g, 1, 'parallax', 800, 0), ev = s.spawnUnit(g, 1, 'eventide', 700, 0), sh = s.spawnUnit(g, 1, 'shardling', 760, 0);
  s.aiRework3a(g, 1, [px, ev, sh]); assert.strictEqual(px.pxG, ev.id, 'beside the Eventide (the most expensive)');
});
