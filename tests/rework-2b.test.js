// v2.83 (docs/FACTION_REWORK.md batch 2b): the Titan (cover, breaching), the Ruinmaw (burrowing, the tunnel gate), the
// Worldbreaker (the crack, the ridge), behind REWORK.b2b (per game, g.rw.b2b). Played on Test Range games (the real SIM).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const step = (s, g, sec) => { for (let i = 0; i < Math.round(sec * 60); i++) s.rangeStep(g); };

test('switch: per game; b2b off plays the v2.82 units (UDEF untouched), on plays the batch\'s definitions', () => {
  const s = loadSim();
  const on = s.rangeGame({ factions: ['lastfist', 'bloomhost'] }), off = s.rangeGame({ factions: ['lastfist', 'bloomhost'], rework: { b2b: false } });
  assert.ok(s.rwB2b(on) && !s.rwB2b(off));
  assert.strictEqual(s.rwD(off, 'titan'), s.UDEF.titan, 'off: the plain UDEF entry');
  assert.strictEqual(s.rwD(on, 'titan').range, s.TITAN.range); assert.strictEqual(s.UDEF.titan.range, 190, 'UDEF itself unchanged');
  const r1 = s.rangeUnit(on, 1, 'ruinmaw', 900, 0), r0 = s.rangeUnit(off, 1, 'ruinmaw', 900, 0);
  assert.strictEqual(r1.maxHp, s.RUIN.hp); assert.strictEqual(r1.arm, 'heavy');
  assert.strictEqual(r0.maxHp, s.UDEF.ruinmaw.hp); assert.strictEqual(r0.arm, undefined);
  // a save keeps the switch; a v2.82 save (rw without b2b) resumes with it off
  const g = s.newGame('normal', { seed: 5 }); for (let i = 0; i < 120; i++) s.update(g, s.TICK);
  assert.strictEqual(s.deserialize(s.serialize(g, {})).rw.b2b, true);
  const o = JSON.parse(s.serialize(g, {})); delete o.rw.b2b; assert.strictEqual(s.deserialize(JSON.stringify(o)).rw.b2b, false);
});

test('Titan cover: Last Fist infantry within reach take 30% less from ranged attacks, not from melee; Titans don\'t stack', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['lastfist', 'lastfist'] });
  s.rangeUnit(g, 0, 'titan', 600, 0); s.rangeUnit(g, 0, 'titan', 610, 10);
  const inn = s.rangeUnit(g, 0, 'rifle', 640, 0), out = s.rangeUnit(g, 0, 'rifle', 640, 100), tank = s.rangeUnit(g, 0, 'tank', 630, 0);
  step(s, g, 0.05);
  assert.strictEqual(inn.cov, 1); assert.ok(!out.cov); assert.ok(!tank.cov, 'infantry only');
  const hit = (e, w) => { const h = e.hp; s.damage(g, e, 10, w, 1); const d = h - e.hp; e.hp = h; return d; };
  assert.ok(Math.abs(hit(inn, 'rifle') - 7) < 1e-9, '30% less from a rifle (two Titans: still 30%)');
  assert.ok(Math.abs(hit(out, 'rifle') - 10) < 1e-9);
  assert.ok(Math.abs(hit(inn, 'claw') - hit(out, 'claw')) < 1e-9, 'melee is not covered');
  // off: no cover
  const h = s.rangeGame({ factions: ['lastfist', 'lastfist'], rework: { b2b: false } });
  s.rangeUnit(h, 0, 'titan', 600, 0); const r = s.rangeUnit(h, 0, 'rifle', 640, 0); step(s, h, 0.05); assert.ok(!r.cov);
});

test('Titan breaching: it walks up to an enemy building, plants (2 s), hits it 2.5x; it fires on the move at units', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['lastfist', 'lastfist'] });
  const t = s.rangeUnit(g, 0, 'titan', 500, 0), b = s.rangeBuilding(g, 1, 'lastfist', 'refinery', 760, 0);
  s.rangeMode(g, 0, 'attack');
  let plantAt = -1, n = 0; while (t.siege !== 1 && n++ < 1200) s.rangeStep(g);
  assert.strictEqual(t.siege, 1, 'it plants'); assert.ok(b.u - b.half - t.u <= s.TITAN.breach + 1, 'within breach range');
  const t0 = g.t; while (t.siege !== 2 && n++ < 1200) s.rangeStep(g); plantAt = g.t - t0;
  assert.ok(Math.abs(plantAt - s.TITAN.plant) < 0.05, 'plants in 2 s');
  const u0 = t.u; while (!g.projs.some(p => p.target === b) && n++ < 1200) s.rangeStep(g);
  const p = g.projs.find(p => p.target === b); assert.ok(Math.abs(p.dmg - s.UDEF.titan.dmg * s.TITAN.bmul) < 1e-6, '2.5x against buildings');
  step(s, g, 1); assert.strictEqual(t.u, u0, 'rooted while planted');
  // against units: it fires mobile, at its own range
  const h = s.rangeGame({ factions: ['lastfist', 'lastfist'] });
  const t2 = s.rangeUnit(h, 0, 'titan', 500, 0), e = s.rangeUnit(h, 1, 'heavy', 500 + s.TITAN.range - 5, 0);
  h.sides[1].hush = true; s.rangeMode(h, 0, 'hold'); step(s, h, 1);
  assert.ok(!t2.siege && e.hp < e.maxHp, 'no plant against units: it just fires');
});

test('Ruinmaw: burrows on the move (untouchable), surfaces where it stops; the Tunnel pours units out of its mouth', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const R = s.rangeUnit(g, 0, 'ruinmaw', 300, 0), army = s.rangeUnits(g, 0, 'skitterling', 160, 0, 5);
  s.command(g, 0, [R.id], 'go', 900, 30);
  step(s, g, 1);
  assert.strictEqual(R.bur, 1); assert.strictEqual(R.gone, 1);
  const hp = R.hp; s.damage(g, R, 500, 'shell', 1); assert.strictEqual(R.hp, hp, 'untouchable underground');
  assert.strictEqual(s.tunnelGate(g, 0), null, 'no gate while it moves');
  step(s, g, 25);
  assert.ok(!R.bur && !R.moving && Math.hypot(R.u - 900, R.v - 30) < 12, 'surfaced where it was sent');
  assert.strictEqual(s.tunnelGate(g, 0), R);
  const r = s.command(g, 0, army.map(e => e.id), 'tunnel'); assert.ok(r.ok, r.msg);
  const E = s.tunnelEntrance(g, 0); assert.strictEqual(E.u, s.RUIN.edge, 'Test Range: the side\'s starting edge');
  const out = []; let n = 0;
  while (out.length < army.length && n++ < 60 * 20) { s.rangeStep(g); for (const e of army) if (!e.tn && Math.abs(e.u - R.u) < 60 && !out.some(o => o.id === e.id)) out.push({ id: e.id, t: g.t }); }
  assert.strictEqual(out.length, army.length, 'all came out at the Ruinmaw');
  for (let i = 1; i < out.length; i++) assert.ok(out[i].t - out[i - 1].t >= s.RUIN.every - 1e-6, 'one every 0.5 s');
  // the Tunnel on a unit that can't use it
  const tk = s.rangeUnit(g, 0, 'bulwark', 200, 0); assert.ok(s.command(g, 0, [tk.id], 'tunnel').ok, 'a Bulwark is a ground unit');
});

test('Ruinmaw: moving sends units inside back to the entrance; its death kills them; surfaced it bites and chews', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const R = s.rangeUnit(g, 0, 'ruinmaw', 900, 0), us = s.rangeUnits(g, 0, 'skitterling', 60, 0, 4);
  s.command(g, 0, us.map(e => e.id), 'tunnel'); step(s, g, 1.5);
  assert.ok(us.every(e => e.tn && e.tn.ph === 1 && e.gone === 3), 'inside');
  s.command(g, 0, [R.id], 'go', 1000, 0); step(s, g, 0.2);
  assert.ok(us.every(e => !e.tn && !e.gone && Math.abs(e.u - s.RUIN.edge) < 30), 'back out at the entrance');
  step(s, g, 6);
  s.command(g, 0, us.map(e => e.id), 'tunnel'); step(s, g, 1.5);
  assert.ok(us.every(e => e.tn && e.tn.ph === 1));
  R.hp = 1; s.damage(g, R, 100, 'shell', 1);
  assert.ok(us.every(e => e.hp <= 0), 'killed with it');
  // bite and chew
  const h = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const M = s.rangeUnit(h, 0, 'ruinmaw', 700, 0), b = s.rangeBuilding(h, 1, 'lastfist', 'refinery', 700 + 20 + 30, 0), f = s.rangeUnit(h, 1, 'rifle', 718, 0);
  h.sides[1].hush = true; const bh = b.hp, fh = f.hp; step(s, h, 0.1);
  assert.ok(fh - f.hp >= s.RUIN.bite * 0.99, 'bite'); assert.ok(bh - b.hp >= s.RUIN.chew * 0.99, 'chew');
});

test('Worldbreaker: a crack through its target to full range hits everything on the line (buildings 2.5x), not aircraft; every 12 s a ridge', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const W = s.rangeUnit(g, 0, 'worldbreaker', 500, 0);
  const a = s.rangeUnit(g, 1, 'rifle', 640, 0), b = s.rangeUnit(g, 1, 'heavy', 560, 4), c = s.rangeUnit(g, 1, 'heavy', 560, 60), air = s.rangeUnit(g, 1, 'aircraft', 640, 0);
  g.sides[1].hush = true; s.rangeMode(g, 0, 'hold');
  let n = 0; while (!(g.rup && g.rup.length) && n++ < 600) s.rangeStep(g);
  assert.ok(g.rup.length === 1 && g.rup[0].r === 1, 'the first crack ends in a ridge');
  step(s, g, 1.2);
  assert.ok(a.hp < a.maxHp && b.hp < b.maxHp, 'its target and the unit behind it on the line are both hit'); assert.strictEqual(c.hp, c.maxHp, 'off the line: not'); assert.strictEqual(air.hp, air.maxHp, 'aircraft: never');
  assert.strictEqual(g.rdg.length, 1); const R = g.rdg[0];
  assert.ok(Math.abs(Math.hypot(R.bu - R.au, R.bv - R.av) - s.WB.len) < 1, '140 long');
  assert.ok(Math.abs(R.bu - R.au) < Math.abs(R.bv - R.av), 'across the crack');
  assert.ok(R.oa || R.ob, 'an open end');
  step(s, g, s.WB.life); assert.strictEqual(g.rdg.length, 0, 'gone after 5 s');
  // buildings 2.5x
  const h = s.rangeGame({ factions: ['axiarchs', 'lastfist'] }); s.rangeUnit(h, 0, 'worldbreaker', 500, 0); const B = s.rangeBuilding(h, 1, 'lastfist', 'refinery', 680, 0);
  s.rangeMode(h, 0, 'hold'); const bh = B.hp; step(s, h, 3);
  assert.ok(Math.abs(bh - B.hp - s.WB.dmg * s.WB.bmul) < 1e-6, '225 to a building');
});

test('Worldbreaker ridge: enemy ground units walk around it (never through), its own side passes; units under it are pushed aside', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const foes = s.rangeUnits(g, 1, 'rifle', 900, 0, 8), own = s.rangeUnit(g, 0, 'shardling', 640, 0);
  g.rdg = [{ id: 1, side: 0, au: 700, av: -60, bu: 700, bv: 80, t0: 0, t1: 1e9, oa: 1, ob: 1 }];
  s.command(g, 1, foes.map(e => e.id), 'go', 500, 0); s.command(g, 0, [own.id], 'go', 760, 0);
  let cross = 0; const prev = new Map(foes.map(e => [e.id, [e.u, e.v]]));
  for (let i = 0; i < 60 * 30; i++) {
    s.rangeStep(g);
    for (const e of foes) { const [pu] = prev.get(e.id); if (pu > 700 && e.u <= 700 && e.v > -60 && e.v < 80) cross++; prev.set(e.id, [e.u, e.v]); }
  }
  assert.strictEqual(cross, 0, 'nobody through the ridge');
  assert.ok(foes.every(e => e.u < 560), 'everyone got around it');
  assert.ok(own.u > 700, 'its own side walks through');
  // pushed aside: a unit standing where a ridge rises
  const h = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  s.rangeUnit(h, 0, 'worldbreaker', 500, 0); const v = s.rangeUnit(h, 1, 'heavy', 690, 0);
  h.sides[1].hush = true; s.rangeMode(h, 0, 'hold');
  let n = 0; while (!(h.rdg && h.rdg.length) && n++ < 900) s.rangeStep(h);
  const R = h.rdg[0], side = (v.u - R.au) * (R.bv - R.av) - (v.v - R.av) * (R.bu - R.au);
  assert.ok(Math.abs(side) / Math.hypot(R.bu - R.au, R.bv - R.av) >= s.WB.thick / 2, 'clear of the ridge line');
});

test('AI: a Ruinmaw picks a spot by the enemy economy and sends units through; an AI Worldbreaker aims its ridges', () => {
  const s = loadSim();
  const g = s.newGame('hard', { seed: 11, factions: ['lastfist', 'bloomhost'], countdown: 0 });
  for (let i = 0; i < 60; i++) s.update(g, s.TICK);
  const R = s.spawnUnit(g, 1, 'ruinmaw', s.rallyU(1, g), 0), us = [];
  for (let i = 0; i < 6; i++) us.push(s.spawnUnit(g, 1, 'skitterling', s.hqU(1) - 120, (i - 3) * 10));
  const ref = g.ents.find(e => e.kind === 'b' && e.side === 0 && e.type === 'refinery') || g.sides[0].hq;
  g.fog[1].ghosts[ref.id] = { id: ref.id, side: 0, type: 'refinery', u: ref.u, v: ref.v, half: ref.half, fac: 'lastfist' };
  s.aiRework2b(g, 1, g.ents.filter(e => e.kind === 'u' && e.side === 1 && e.hp > 0));
  assert.ok(R.rmGo, 'a spot'); assert.ok(Math.abs(R.rmGo[0] - ref.u) < 80, 'beside the refinery');
  let n = 0; while (!R.rmAt && n++ < 60 * 90) { s.update(g, s.TICK); g.sides[1].aiT = 1e9; }
  assert.ok(R.rmAt, 'arrived and surfaced');
  s.aiRework2b(g, 1, g.ents.filter(e => e.kind === 'u' && e.side === 1 && e.hp > 0));
  assert.ok(us.some(e => e.tn), 'units sent into the tunnel');
});
