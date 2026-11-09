// v2.70 (Phase 1, Three-Lane with crossings, docs/PHASE1_DESIGNS.md Proposal D): the map (validated, mirrored, three lanes,
// two walls with one gap each at the centre, the nodes and forward pads where the design puts them), ground navigation
// through the crossings, and the AI's three-lane rules (aiLanes3, aiCapture3, forward pads in three lanes).
// Full matches: tests/slow/threelane-match.test.js.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const M = sim.MAPS.threelane;
test.afterEach(() => sim.useMap('classic'));
const setup = (diff = 'hard') => { const g = sim.newGame(diff, { map: 'threelane', seed: 9, factions: ['lastfist', 'lastfist'] }); g.countdown = 0; g.t = 300; for (const s of g.sides) s.aiT = 1e9; g.ents = g.ents.filter(e => e.kind !== 'u'); g.guards = []; for (const n of g.nodes) if (n.type === 'relic') n.spent = true; return g; }; // v2.71: relics out of the way (tests/special-nodes.test.js covers them)
const D = (g, s) => sim.aiDiff(g, s);
const army = (g, s) => g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0);
const intel = (g, s, list) => { for (const [i, e] of list.entries()) g.fog[s].intel[90000 + i] = { type: e[0], u: e[1], v: e[2], t: g.t }; };
const theirs = (g, s) => Object.values(g.fog[s].intel).map(m => ({ type: m.type, u: m.u, v: m.v, w: 1, fresh: true }));

test('the map (v2): valid and mirrored, 2300 × 1120, army cap 120, three lanes, four wall pieces, the design\'s nodes and pads', () => {
  assert.deepStrictEqual([...sim.validateMap(M)], []);
  assert.strictEqual(M.symmetry, 'mirror-x');
  assert.deepStrictEqual([M.size.w, M.size.h, M.armyCap], [2300, 1120, 120]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(M.lanes.map(l => [l.id, l.width, sim.laneY(l, 1150)]))), [['north', 230, -400], ['centre', 230, 0], ['south', 230, 400]]);
  assert.strictEqual(M.blockers.length, 4);
  assert.strictEqual(M.v, 2, 'v2 (v2.71): depots, relics and shorter walls');
  const by = t => M.nodes.filter(n => n.type === t);
  assert.deepStrictEqual([...by('income').map(n => n.at.join(','))].sort(), ['1150,0', '1500,0', '1650,-400', '1650,400', '650,-400', '650,400', '800,0'].sort());
  assert.strictEqual(M.nodes[1].yieldMul, 1.5, 'the rich centre node, where the lanes meet');
  assert.deepStrictEqual([...by('watchtower').map(n => n.at[0])], [1150, 1150]);
  assert.strictEqual(by('forwardPad').length, 6, 'one forward post per lane per side');
  for (const f of by('forwardPad')) assert.deepStrictEqual([...f.allow], ['turret', 'barracks']);
  for (const [b, x] of [[0, 220], [1, 2080]]) assert.strictEqual(M.bases[b].hq[0], x, 'Classic\'s base layout at x 220 and 2080');
});

test('crossings: the walls have one gap each, at the centre; elsewhere the lanes meet only near the bases', () => {
  sim.useMap('threelane'); const C = sim.cur();
  assert.ok(C.NAV.on);
  const len = p => { let d = 0; for (let i = 1; i < p.length; i++) d += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return d; };
  for (const y of [-1, 1]) {
    assert.ok(sim.navShut(900, y * 200) && sim.navShut(1400, y * 200), 'wall');
    assert.ok(!sim.navShut(740, y * 200) && !sim.navShut(1560, y * 200), 'the pockets at the base ends (v2.71: the walls start at x 820)');
    assert.ok(!sim.navShut(1150, y * 200), 'the gap at the centre');
    const gap = sim.navPath(1150, y * 400, 1150, 0); assert.ok(gap && len(gap) < 500, `through the gap (${gap && len(gap)})`);
    const far = sim.navPath(1000, y * 400, 1000, 0); assert.ok(!sim.navClear(1000, y * 400, 1000, 0) && far && len(far) > 430, `around the wall (${far && len(far)})`);
  }
  const g = setup(), u = sim.spawnUnit(g, 0, 'rifle', 1150, -400); u.lane = 1;
  for (let i = 0; i < 60 * 12; i++) { sim.updateUnit(g, u, [], sim.TICK); }
  assert.ok(Math.abs(u.v) < 120, `a unit ordered to the centre lane walks through the crossing (${u.u.toFixed(0)}, ${u.v.toFixed(0)})`);
});

test('reinforcements go to the lane where the enemy is (the centre too); none seen: round-robin over all three', () => {
  const g = setup();
  for (let i = 0; i < 4; i++) sim.spawnUnit(g, 1, 'rifle', 1900, 0);
  intel(g, 1, [['tank', 1000, 10], ['tank', 1050, -5], ['tank', 1100, 0]]);
  sim.aiLanes(g, 1, D(g, 1), army(g, 1), theirs(g, 1), false);
  assert.strictEqual(g.sides[1].laneNew, 1, 'the centre lane');
  g.fog[1].intel = {}; g.sides[1].la.t = -99;
  sim.aiLanes(g, 1, D(g, 1), army(g, 1), theirs(g, 1), false);
  assert.strictEqual(g.sides[1].laneNew, null);
  const side = g.sides[1], seen = [0, 1, 2].map(() => sim.laneNew(side)); assert.deepStrictEqual(seen.slice().sort(), [0, 1, 2]);
});

test('a losing lane is helped from its neighbour first (the centre helps either outer lane, through the crossing)', () => {
  const g = setup();
  const C = []; for (let i = 0; i < 10; i++) { const u = sim.spawnUnit(g, 1, 'tank', 1400, 0); u.lane = 1; C.push(u); }
  const S = []; for (let i = 0; i < 10; i++) { const u = sim.spawnUnit(g, 1, 'tank', 1400, 400); u.lane = 2; S.push(u); }
  intel(g, 1, [['tank', 900, -400], ['tank', 950, -400], ['tank', 1000, -390], ['tank', 1050, -400]]);
  sim.aiLanes(g, 1, D(g, 1), army(g, 1), theirs(g, 1), false);
  assert.ok(C.filter(u => u.lane === 0).length >= 2, 'the centre squad sends units north');
  assert.strictEqual(S.filter(u => u.lane === 0).length, 0, 'the south squad, two lanes away, stays');
});

test('a base attack goes down the lane where the enemy army is; meeting a much stronger army at the crossing, it switches to a quieter neighbour', () => {
  const g = setup(), side = g.sides[1];
  for (let i = 0; i < 8; i++) sim.spawnUnit(g, 1, 'tank', 1900, 0);
  intel(g, 1, [['tank', 900, 0], ['tank', 950, 0]]);
  side.stance = 'attack'; side.pushMode = 'all'; side.stanceAt = g.t;
  sim.aiLanes(g, 1, D(g, 1), army(g, 1), theirs(g, 1), false);
  assert.ok(army(g, 1).every(u => u.lane === 1), 'down the centre, at the enemy army');
  for (const u of army(g, 1)) u.u = 1200;
  g.fog[1].intel = {}; intel(g, 1, Array.from({ length: 16 }, (_, i) => ['tank', 1000 - i * 5, 0]));
  side.la.t = -99; sim.aiLanes(g, 1, D(g, 1), army(g, 1), theirs(g, 1), false);
  const k = army(g, 1)[0].lane;
  assert.ok(k === 0 || k === 2, `switched to an outer lane at the crossing (${k})`);
  assert.ok(army(g, 1).every(u => u.lane === k) && side.la.swap === 1);
});

test('a lost watchtower raises an alarm for its lane: new units and the next shift go there', () => {
  const g = setup(), side = g.sides[1], t = g.nodes.findIndex(n => n.type === 'watchtower' && n.v < 0);
  for (let i = 0; i < 6; i++) { const u = sim.spawnUnit(g, 1, 'tank', 1500, 0); u.lane = 1; }
  g.nodes[t].owner = 1; sim.aiLanes(g, 1, D(g, 1), army(g, 1), [], false);
  g.nodes[t].owner = 0; side.la.t = -99; side.la.sh = -99; sim.aiLanes(g, 1, D(g, 1), army(g, 1), [], false);
  assert.ok(side.la.alarm && side.la.alarm.lane === 0);
  assert.strictEqual(side.laneNew, 0, 'reinforcements north');
  assert.ok(army(g, 1).some(u => u.lane === 0), 'part of the centre squad moves north');
});

test('the centre and both watchtowers at once: two capture groups on Hard, the centre only on Easy', () => {
  const g = setup();
  for (let i = 0; i < 10; i++) sim.spawnUnit(g, 1, i < 5 ? 'rifle' : 'tank', 1800, [-400, 0, 400][i % 3]);
  sim.aiLanes(g, 1, D(g, 1), army(g, 1), [], false);
  const A = g.sides[1].capT, B = g.sides[1].capT2;
  assert.ok(A && B && A.node !== B.node, JSON.stringify([A, B]));
  assert.ok(!A.ids.some(id => B.ids.includes(id)), 'no unit in both');
  const e = setup('easy'); for (let i = 0; i < 10; i++) sim.spawnUnit(e, 1, 'tank', 1800, 0);
  sim.aiLanes(e, 1, D(e, 1), army(e, 1), [], false);
  assert.ok(e.sides[1].capT && e.sides[1].capT.node === 1 && !e.sides[1].capT2);
});

test('forward pads in three lanes: Hard up to 3, Normal 2, Easy none, all on its own half', () => {
  for (const [diff, want] of [['hard', 3], ['normal', 2], ['easy', 0]]) {
    const g = setup(diff), side = g.sides[1]; side.res.c = side.res.e = 9000;
    assert.ok(sim.tryBuild(g, 1, 'barracks').ok); const b = g.ents.find(x => x.side === 1 && x.type === 'barracks'); b.built = true; b.hp = b.maxHp;
    for (const n of g.nodes) if (n.type === 'forwardPad') { n.owner = 1; n.prog = -100; }
    for (let k = 0; k < 5; k++) { side.la = Object.assign(side.la || {}, { fw: -99, t: -99 }); sim.aiLanes(g, 1, D(g, 1), [], [], false); }
    const fw = g.ents.filter(x => x.side === 1 && x.slot >= sim.FWD_SLOT);
    assert.strictEqual(fw.length, want, diff);
    for (const x of fw) assert.ok(x.u > 1150, 'its own (east) half');
  }
});
