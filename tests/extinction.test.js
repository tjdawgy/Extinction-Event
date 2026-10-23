// The Extinction Event (v2.6): storm schedule and damage, repair limits, how the match ends, tie-breaks, saves. SIM only.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const E = sim.EXT;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
function quiet(t) { // AI off, the given game time already played
  const g = sim.newGame('normal');
  for (const s of [0, 1]) { g.sides[s].aiT = 1e9; g.sides[s].stance = 'hold'; g.sides[s].res.c = g.sides[s].res.e = 1e6; }
  g.t = t;
  return g;
}
const build = (g, s, type) => { sim.tryBuild(g, s, type); const b = g.ents.filter(e => e.type === type && e.side === s).pop(); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };

test('schedule: countdown from 18:00, warning at 19:30, storm at 20:00 rising 0.75%/s each minute; it beats half-rate Repair at 23:36', () => {
  assert.deepStrictEqual([E.show, E.warn, E.start, E.limit], [1080, 1170, 1200, 1620]);
  assert.strictEqual(sim.stormRate(1199.9), 0);
  assert.ok(Math.abs(sim.stormRate(1200) - 0.003) < 1e-12);
  assert.ok(Math.abs(sim.stormRate(1260) - 0.0105) < 1e-12);
  assert.ok(Math.abs(sim.stormRate(1416) - 0.03) < 1e-9, 'equals half-rate paid Repair (3%/s) at 23:36');
  const g = quiet(1160), seen = [];
  for (let i = 0; i < 30 * 45; i++) { sim.update(g, 1 / 30); for (const e of g.events) seen.push(e.type); g.events.length = 0; }
  assert.deepStrictEqual(seen.filter(t => t.startsWith('ext')), ['extWarn', 'extStart'], 'each fires once');
});

test('the storm burns every building, the shielded HQ too; with no repair they fall at about 21:45; units are untouched', () => {
  const g = quiet(1195), ref = build(g, 0, 'refinery'), hq = g.sides[0].hq, u = sim.spawnUnit(g, 0, 'tank', 400, 0);
  u.holdU = u.u; u.holdV = 0;
  step(g, 0.2);
  assert.ok(hq.shielded, 'HQ shielded by its Refinery');
  step(g, 5);
  assert.ok(hq.hp < hq.maxHp && ref.hp < ref.maxHp, 'both burn');
  assert.strictEqual(u.hp, u.maxHp, 'units are not hit');
  let fell = null;
  for (let i = 0; i < 30 * 200 && fell === null; i++) { sim.update(g, 1 / 30); if (ref.hp <= 0) fell = g.t; }
  assert.ok(fell > 1300 && fell < 1310, `Refinery fell at ${fell.toFixed(1)} s`);
});

test('in the storm: no self-repair, Repair Pulse heals units only, paid Repair at half rate; an HQ repaired non-stop still falls by about 25:43', () => {
  const g = quiet(1250);
  const b = build(g, 0, 'barracks'); b.hp = b.maxHp * 0.5; b.lastHit = -99;
  const hp0 = b.hp; step(g, 1);
  assert.ok(b.hp < hp0, 'no self-repair: it only loses');
  // Repair Pulse: units yes, buildings no
  const u = sim.spawnUnit(g, 0, 'tank', b.u, b.v); u.holdU = u.u; u.holdV = u.v; u.cd = 1e6; u.hp = 100;
  g.sides[0].ab.repair = 0; sim.updateVision(g);
  const bh = b.hp; assert.ok(sim.useAbility(g, 0, 'repair', b.u, b.v).ok);
  step(g, 1);
  assert.ok(u.hp > 100 + 560 * 0.05, 'unit healed');
  assert.ok(b.hp < bh, 'building not healed');
  // paid Repair: half rate (3%/s); an HQ under constant paid Repair from 20:00 falls between 25:30 and 26:00
  const g2 = quiet(1199), hq = g2.sides[0].hq;
  let fell = null;
  for (let i = 0; i < 30 * 600 && fell === null; i++) {
    hq.repair = 1e9; g2.sides[1].hq.repair = 1e9; // both keep paying (otherwise the other HQ falls first and ends the match)
    sim.update(g2, 1 / 30);
    if (hq.hp <= 0) fell = g2.t;
  }
  assert.ok(fell > 1530 && fell < 1560, `fell at ${fell.toFixed(1)} s`);
});

test('ending: before 20:00 at once; in the storm after a 5 s window; both HQs in the window or the 27:00 limit go to the score', () => {
  // before the storm: immediate (settled at the end of the tick)
  let g = quiet(600); sim.kill(g, g.sides[1].hq, 0); sim.update(g, 1 / 30);
  assert.ok(g.over && g.winner === 0 && g.result.how === 'hq');
  // both HQs in the same tick before the storm: never code order
  g = quiet(600); build(g, 0, 'refinery'); sim.kill(g, g.sides[0].hq, 1); sim.kill(g, g.sides[1].hq, 0); sim.update(g, 1 / 30);
  assert.ok(g.over && g.result.how === 'score' && g.result.reason === 'both' && g.winner === 0, JSON.stringify(g.result));
  // storm: one HQ falls, the match runs 5 more seconds, then the survivor wins
  g = quiet(1300); sim.kill(g, g.sides[1].hq, -1); sim.update(g, 1 / 30);
  assert.ok(!g.over && g.endHold && g.endHold.loser === 1);
  step(g, 4.8); assert.ok(!g.over);
  step(g, 0.3); assert.ok(g.over && g.winner === 0 && g.result.how === 'storm');
  // storm: the other HQ falls inside the window: score decides (side 1 has the bigger army)
  g = quiet(1300); for (let i = 0; i < 3; i++) { const t = sim.spawnUnit(g, 1, 'tank', 1400, 0); t.holdU = t.u; t.holdV = 0; t.cd = 1e6; }
  sim.kill(g, g.sides[1].hq, -1); sim.update(g, 1 / 30); step(g, 2); sim.kill(g, g.sides[0].hq, -1); sim.update(g, 1 / 30);
  assert.ok(g.over && g.result.how === 'score' && g.winner === 1, JSON.stringify(g.result));
  // the hard limit
  g = quiet(E.limit - 0.5); build(g, 0, 'turret'); step(g, 1);
  assert.ok(g.over && g.result.how === 'score' && g.result.reason === 'limit' && g.winner === 0, JSON.stringify(g.result));
});

test('tie-breaks: score, then kills, then credits earned; equal on all three is a draw ("Mutual extinction")', () => {
  const mk = () => { const g = quiet(1500); for (const s of [0, 1]) { g.sides[s].hq.hp = 1000; g.sides[s].stats.kills = 0; g.sides[s].stats.earned = 500; } return g; };
  let g = mk(); sim.tieBreak(g, 'limit'); assert.ok(g.over && g.winner === -1 && g.result.how === 'draw');
  g = mk(); g.sides[1].stats.kills = 2; sim.tieBreak(g, 'limit'); assert.ok(g.winner === 1 && g.result.by === 'kills');
  g = mk(); g.sides[0].stats.earned = 501; sim.tieBreak(g, 'limit'); assert.ok(g.winner === 0 && g.result.by === 'credits');
  g = mk(); g.sides[0].hq.hp = 1001; sim.tieBreak(g, 'limit'); assert.ok(g.winner === 0 && g.result.by === 'score');
  assert.deepStrictEqual([...g.result.score], [1001, 1000]);
});

test('save and resume mid-storm and inside the end window; a v8 save loads', () => {
  const g = quiet(1300); sim.kill(g, g.sides[1].hq, -1); sim.update(g, 1 / 30);
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.ok(g2.endHold && g2.endHold.loser === 1, 'end window kept');
  step(g2, 5.2); assert.ok(g2.over && g2.winner === 0);
  const o = JSON.parse(sim.serialize(quiet(1250), {})); o.v = 8; delete o.endHold; for (const sd of o.sides) delete sd.stats.earned;
  const g3 = sim.deserialize(JSON.stringify(o));
  assert.ok(g3 && g3.endHold === null);
  const hp = g3.sides[0].hq.hp; step(g3, 1); assert.ok(g3.sides[0].hq.hp < hp, 'resumed into the storm');
});

test('AI vs AI always finishes by 27:00, on every difficulty', () => {
  for (const d of ['easy', 'normal', 'hard']) for (let m = 0; m < 3; m++) {
    const g = sim.newGame(d, { autoPlayer: true, autoDiff: d });
    for (let i = 0; i < 30 * 1800 && !g.over; i++) sim.update(g, 1 / 30);
    assert.ok(g.over && g.t <= E.limit + 0.1, `${d}: over ${g.over} at ${g.t.toFixed(0)} s`);
  }
});
