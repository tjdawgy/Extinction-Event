// v2.94 (batch 6d, docs/FACTION_REWORK.md "Batch 6d"): the AI personality fix (REWORK.b6ai) and the faction balance (REWORK.b6d),
// src/sim/rework-6d.js. Fingerprints (FP_V294A, FP_V294) are in tests/determinism.test.js.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');
const sim = loadSim();
const J = x => x === undefined ? x : JSON.parse(JSON.stringify(x)); // values from the SIM's sandbox, compared as plain data
const same = (a, b, m) => assert.deepStrictEqual(J(a), J(b), m);
const game = (rework, o = {}) => sim.newGame(o.diff || 'hard', Object.assign({ seed: 5, factions: ['lastfist', 'axiarchs'], rework }, o));

test('b6ai and b6d are on by default, saved per game, and left out of a save when off', () => {
  const r = sim.rwInit(); assert.ok(r.b6ai && r.b6d);
  const on = JSON.parse(sim.serialize(game(), {})), off = JSON.parse(sim.serialize(game({ b6ai: false, b6d: false, b6elane: false, b6e: false, b6fai: false, b6f: false }), {}));
  assert.ok(on.rw.b6ai && on.rw.b6d);
  assert.ok(!('b6ai' in off.rw) && !('b6d' in off.rw), 'an off save is a v2.93 save');
  assert.ok(!sim.deserialize(JSON.stringify(off)).rw.b6ai && !sim.deserialize(JSON.stringify(off)).rw.b6d);
  const b = sim.deserialize(JSON.stringify(on)); assert.ok(b.rw.b6ai && b.rw.b6d);
});

test('b6ai: Hard rolls Boomer, Economist and Turtle in equal thirds for every faction; off it rolls v2.93\'s pools; Easy and Normal unchanged', () => {
  same(sim.B6AI.pool, ['boomer', 'economist', 'turtle']);
  for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) {
    const n = { boomer: 0, economist: 0, turtle: 0 }, n0 = { boomer: 0, economist: 0, turtle: 0 };
    for (let seed = 1; seed <= 300; seed++) {
      n[game(undefined, { seed, factions: [fac, fac] }).sides[1].persona.kind]++;
      n0[game({ b6ai: false }, { seed, factions: [fac, fac] }).sides[1].persona.kind]++;
    }
    for (const k in n) assert.ok(n[k] > 70 && n[k] < 130, `${fac} ${k}: ${n[k]} of 300 with b6ai on`);
    const k0 = sim.AI_PRESETS.hard.byFac[fac].kinds;
    for (const k in n0) { const share = k0.filter(x => x === k).length / k0.length; assert.ok(Math.abs(n0[k] / 300 - share) < 0.1, `${fac} ${k} off: ${n0[k]} of 300, pool share ${share}`); }
  }
  same(sim.AI_PRESETS.hard.byFac.axiarchs.kinds, ['boomer', 'boomer', 'turtle'], 'v2.93\'s Axiarch pool (2/3 Boomer) is untouched');
  for (const diff of ['easy', 'normal']) for (let seed = 1; seed <= 20; seed++) {
    const a = game(undefined, { seed, diff }).sides[1].persona, b = game({ b6ai: false }, { seed, diff }).sides[1].persona;
    assert.strictEqual(a.kind, b.kind, `${diff}: the same personality`); assert.ok(!a.b6, `${diff}: no batch 6d plan`);
    same(a.plan, b.plan);
  }
});

test('b6ai: the Turtle and the Economist take their batch 6d plans; the Boomer and an off game are untouched', () => {
  const E = game(undefined, { persona: 'economist' }).sides[1].persona, T = game(undefined, { persona: 'turtle' }).sides[1].persona;
  const B = game(undefined, { persona: 'boomer' }).sides[1].persona, B0 = game({ b6ai: false }, { persona: 'boomer' }).sides[1].persona;
  assert.ok(E.b6 && T.b6 && !B.b6);
  same(E.plan, sim.B6AI.eco.plan); assert.strictEqual(E.refDelta, sim.B6AI.eco.refDelta);
  assert.strictEqual(E.plan.filter(t => t === 'refinery').length, 3, 'the Economist builds three Refineries (v2.93\'s cap cut its third)');
  same(T.plan, sim.B6AI.turtle.plan); assert.ok(T.plan.includes('turret'), 'the Turtle still builds its Turret');
  assert.strictEqual(T.deadline, sim.B6AI.turtle.deadline);
  same({ ...B, preset: 0 }, { ...B0, preset: 0 }, 'the Boomer is unchanged');
  const T0 = game({ b6ai: false }, { persona: 'turtle' }).sides[1].persona; assert.ok(!T0.b6); assert.ok(!T0.plan.includes('refinery') || T0.plan.filter(t => t === 'refinery').length === 2);
});

test('b6ai: the Economist spends past its cap; the Turtle attacks on army size, on time, and after a won defence; nothing when off', () => {
  const g = game(), E = sim.rollPersona('economist', 'hard', 'lastfist', 'hard', g), T = sim.rollPersona('turtle', 'hard', 'lastfist', 'hard', g);
  assert.strictEqual(sim.b6aiFlush(g, E), sim.B6AI.eco.cap); assert.strictEqual(sim.b6aiFlush(g, T), 900);
  const g0 = game({ b6ai: false }); assert.strictEqual(sim.b6aiFlush(g0, E), 900, 'off: v2.93\'s flush');
  const c = (o) => Object.assign({ myV: 0, thV: 0, threat: false, nSiege: 0, siegeLine: 500 }, o);
  g.t = 400;
  same(sim.aiB6ai(g, 1, E, c({ myV: 1200, thV: 1000 })), [null, 'all'], 'the Economist: its army leads');
  assert.strictEqual(sim.aiB6ai(g, 1, E, c({ myV: 1050, thV: 1000 })), null, 'not by enough');
  assert.strictEqual(sim.aiB6ai(g, 1, E, c({ myV: 1200, thV: 1000, threat: true })), null, 'not while threatened');
  g.t = 200; assert.strictEqual(sim.aiB6ai(g, 1, T, c({ myV: 1000, thV: 1100 })), null, 'the Turtle waits early with an even army');
  same(sim.aiB6ai(g, 1, T, c({ myV: sim.B6AI.turtle.army, thV: 2000, nSiege: 2 })), [500, 'siege'], 'a big enough army goes');
  g.t = sim.B6AI.turtle.at + 1; assert.ok(sim.aiB6ai(g, 1, T, c({ myV: 1000, thV: 1100 })), 'by its time, an even army goes');
  g.t = 200; g.sides[1].lastDanger = 190; assert.ok(sim.aiB6ai(g, 1, T, c({ myV: 800, thV: 700 })), 'a defence won: counterattack');
  assert.strictEqual(sim.aiB6ai(g0, 1, T, c({ myV: 9000, thV: 0 })), null, 'off: no batch 6d push');
});

test('b6d: its four values play when on (Tank damage, Shardling health, Artillery salvo, the Salvage Yard share); off v2.93\'s; the Codex shows the game default', () => {
  const on = game(), off = game({ b6d: false, b6elane: false, b6e: false, b6fai: false, b6f: false });
  assert.strictEqual(sim.rwD(on, 'tank').dmg, sim.B6D.unit.tank.dmg); assert.strictEqual(sim.rwD(off, 'tank').dmg, sim.UDEF.tank.dmg);
  assert.strictEqual(sim.rwD(on, 'artillery').dmg, sim.B6D.unit.artillery.dmg); assert.strictEqual(sim.rwD(off, 'artillery').dmg, sim.ART6.dmg, 'off: 6b\'s salvo');
  assert.ok(sim.rwD(on, 'artillery').deploy === sim.rwD(off, 'artillery').deploy && sim.rwD(on, 'artillery').range === sim.rwD(off, 'artillery').range, 'range and everything else unchanged');
  const s1 = sim.spawnUnit(on, 1, 'shardling', 900, 0), s0 = sim.spawnUnit(off, 1, 'shardling', 900, 0);
  assert.strictEqual(s1.maxHp, sim.B6D.unit.shardling.hp); assert.strictEqual(s1.hp, s1.maxHp); assert.strictEqual(s0.maxHp, sim.UDEF.shardling.hp);
  assert.strictEqual(s1.maxShp, s0.maxShp, 'shields unchanged');
  assert.strictEqual(sim.b6Yard(on, 'pct'), sim.B6D.yard.pct); assert.strictEqual(sim.b6Yard(off, 'pct'), sim.YARD.pct);
  for (const k of ['cap', 'energy', 'od', 'odDur']) assert.strictEqual(sim.b6Yard(on, k), sim.YARD[k], `the Yard's ${k} is unchanged`);
  assert.strictEqual(sim.rwShow(null, 'tank').dmg, sim.B6D.unit.tank.dmg, 'the Codex follows the new-game default');
  assert.strictEqual(sim.rwShow(off, 'shardling').hp, sim.UDEF.shardling.hp);
  assert.ok(Object.keys(sim.B6D.unit).length + Object.keys(sim.B6D.yard).length <= 4, 'at most four values');
  assert.strictEqual(sim.UDEF.tank.dmg, 42, 'UDEF untouched');
});

test('b6d: a kill pays the Salvage Yard\'s batch 6d share', () => {
  for (const [rw, pct] of [[undefined, sim.B6D.yard.pct], [{ b6d: false, b6elane: false, b6e: false, b6fai: false, b6f: false }, sim.YARD.pct]]) {
    const g = sim.newGame('hard', { seed: 3, factions: ['lastfist', 'axiarchs'], rework: rw }); g.countdown = 0;
    const s = g.sides[0]; s.res.c = s.res.e = 9e4; assert.ok(sim.tryBuild(g, 0, 'sigA').ok);
    const y = g.ents.find(e => e.type === 'sigA' && e.side === 0); y.built = true; y.hp = y.maxHp;
    const m = sim.spawnUnit(g, 0, 'rifle', 900, 0), foe = sim.spawnUnit(g, 1, 'lancer', 920, 0); void m;
    const c0 = s.res.c; sim.kill(g, foe, 0, 'rifle');
    assert.strictEqual(s.res.c - c0, Math.round(sim.UDEF.lancer.cost.c * pct), `Salvage at ${pct}`);
  }
});
