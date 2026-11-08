// v2.67 (Phase 1, the AI on two lanes): the lane layer (aiLanes) on Two-Lane: reinforcements to the lane that needs
// them, shifting a surplus to a losing lane (not on Easy), capture groups for the centre node and the watchtowers, and
// forward-pad buildings (Normal and Hard). It never runs on Classic. Full matches: tests/slow/twolane-ai.test.js.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const setup = (diff = 'hard') => { const g = sim.newGame(diff, { map: 'twolane', seed: 9, factions: ['lastfist', 'lastfist'] }); g.countdown = 0; g.t = 300; for (const s of g.sides) s.aiT = 1e9; g.ents = g.ents.filter(e => e.kind !== 'u'); return g; };
const D = (g, s) => sim.aiDiff(g, s);
const army = (g, s) => g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0);
const intel = (g, s, list) => { for (const [i, e] of list.entries()) g.fog[s].intel[90000 + i] = { type: e[0], u: e[1], v: e[2], t: g.t }; };
const theirs = (g, s) => Object.values(g.fog[s].intel).map(m => ({ type: m.type, u: m.u, v: m.v, w: 1, fresh: true }));
test.afterEach(() => sim.useMap('classic'));

test('reinforcements go to the lane where the enemy is', () => {
  const g = setup();
  for (let i = 0; i < 4; i++) sim.spawnUnit(g, 1, 'rifle', 1700, 0);
  intel(g, 1, [['tank', 1000, 280], ['tank', 1050, 280], ['tank', 1100, 270]]);
  sim.aiLanes(g, 1, D(g, 1), army(g, 1), theirs(g, 1), false);
  assert.strictEqual(g.sides[1].laneNew, 1, 'the south lane');
  g.fog[1].intel = {}; g.sides[1].la.t = -99;
  sim.aiLanes(g, 1, D(g, 1), army(g, 1), theirs(g, 1), false);
  assert.strictEqual(g.sides[1].laneNew, null, 'nothing seen: alternate');
});

test('a losing lane gets part of the other lane\'s surplus (Normal and Hard), not on Easy', () => {
  for (const diff of ['hard', 'easy']) {
    const g = setup(diff);
    const us = []; for (let i = 0; i < 10; i++) { const u = sim.spawnUnit(g, 1, 'tank', 1500, 280); u.lane = 1; us.push(u); }
    const n = sim.spawnUnit(g, 1, 'rifle', 1500, -280); n.lane = 0;
    intel(g, 1, [['tank', 900, -280], ['tank', 950, -280], ['tank', 1000, -270], ['tank', 1050, -280]]);
    sim.aiLanes(g, 1, D(g, 1), army(g, 1), theirs(g, 1), false);
    const moved = us.filter(u => u.lane === 0).length;
    if (diff === 'easy') assert.strictEqual(moved, 0, 'Easy keeps its lanes');
    else assert.ok(moved >= 2 && moved < 10, `Hard sends part of the south squad north (${moved})`);
  }
});

test('a capture group takes the centre node (off both lanes), then the watchtowers; it stands on the node and captures it', () => {
  const g = setup();
  for (let i = 0; i < 8; i++) sim.spawnUnit(g, 1, i < 4 ? 'rifle' : 'tank', 1650, i % 2 ? 280 : -280);
  sim.aiLanes(g, 1, D(g, 1), army(g, 1), [], false);
  const T = g.sides[1].capT; assert.ok(T && T.node === 1 && T.ids.length >= 1 && T.ids.length <= 3, JSON.stringify(T));
  g.sides[1].stance = 'hold';
  for (let t = 0; t < 40 * 60 && g.nodes[1].owner !== 1; t++) { sim.update(g, sim.TICK); g.sides[1].aiT = 1e9; if (t % 60 === 0) sim.aiCapture(g, 1, army(g, 1), [], false); }
  assert.strictEqual(g.nodes[1].owner, 1, 'the centre is taken');
  g.sides[1].capT = null; g.sides[1].capAt = -99;
  sim.aiCapture(g, 1, army(g, 1), [], false);
  assert.ok(g.sides[1].capT && g.nodes[g.sides[1].capT.node].type === 'watchtower', 'next: a watchtower');
  const e = setup('easy'); for (let i = 0; i < 8; i++) sim.spawnUnit(e, 1, 'tank', 1650, 280); e.nodes[1].owner = 1; e.nodes[1].prog = -100;
  sim.aiCapture(e, 1, army(e, 1), [], true); assert.strictEqual(e.sides[1].capT, undefined, 'Easy goes for the centre only');
});

test('forward pads: Hard builds a Turret, then a Barracks, on pads it holds on its own half; Easy never', () => {
  for (const diff of ['hard', 'normal', 'easy']) {
    const g = setup(diff), side = g.sides[1];
    side.res.c = 5000; side.res.e = 5000;
    const bar = sim.tryBuild(g, 1, 'barracks'); assert.ok(bar.ok); const b = g.ents.find(x => x.side === 1 && x.type === 'barracks'); b.built = true; b.hp = b.maxHp;
    for (const n of g.nodes) if (n.type === 'forwardPad') { n.owner = 1; n.prog = -100; }
    for (let k = 0; k < 3; k++) { side.la = Object.assign(side.la || {}, { fw: -99, t: -99 }); sim.aiLanes(g, 1, D(g, 1), [], [], false); }
    const fw = g.ents.filter(x => x.side === 1 && x.slot >= sim.FWD_SLOT);
    const want = { hard: 2, normal: 1, easy: 0 }[diff];
    assert.strictEqual(fw.length, want, `${diff}: ${fw.map(x => x.type)}`);
    if (want) { assert.strictEqual(fw[0].type, 'turret'); for (const x of fw) assert.ok(x.u > 1100, 'on its own (east) half'); }
    if (want === 2) assert.strictEqual(fw[1].type, 'barracks');
  }
});

test('a base attack goes down one lane, all of it: the lane where the enemy army is', () => {
  const g = setup(), side = g.sides[1];
  for (let i = 0; i < 8; i++) sim.spawnUnit(g, 1, 'tank', 1650, 0);
  intel(g, 1, [['tank', 900, -280], ['tank', 950, -280]]); // the enemy it knows of is in the north lane
  side.stance = 'attack'; side.pushMode = 'all'; side.stanceAt = g.t;
  sim.aiLanes(g, 1, D(g, 1), army(g, 1), theirs(g, 1), false);
  assert.ok(army(g, 1).every(u => u.lane === 0) && side.laneNew === 0, 'everyone down the north lane, at the enemy army');
  side.stance = 'retreat'; side.pushMode = null; side.la.t = -99; g.fog[1].intel = {};
  sim.aiLanes(g, 1, D(g, 1), army(g, 1), theirs(g, 1), false);
  assert.strictEqual(side.laneNew, 1, 'when the attack ends, new units refill the emptied south lane');
});

test('breakthrough: Hard (and Normal) go all in when clearly stronger; Easy never; not while under attack', () => {
  for (const [diff, want] of [['hard', true], ['normal', true], ['easy', false]]) {
    const g = setup(diff), side = g.sides[1]; g.t = 600;
    sim.aiLanes(g, 1, D(g, 1), [], [], false, 3000, 1500);
    assert.strictEqual(side.stance === 'attack' && side.pushMode === 'all', want, diff);
  }
  const g = setup('hard'); g.t = 600; sim.aiLanes(g, 1, D(g, 1), [], [], true, 3000, 1500); assert.notStrictEqual(g.sides[1].stance, 'attack', 'threat at home: stay');
  const h = setup('hard'); h.t = 600; sim.aiLanes(h, 1, D(h, 1), [], [], false, 1600, 1500); assert.notStrictEqual(h.sides[1].stance, 'attack', 'not clearly stronger');
});

test('Classic: the lane layer never runs', () => {
  const g = sim.newGame('hard', { map: 'classic', seed: 3, autoPlayer: true, autoDiff: 'hard' }); g.countdown = 0;
  for (let i = 0; i < 60 * 400; i++) sim.update(g, sim.TICK);
  for (const s of g.sides) { assert.strictEqual(s.la, undefined); assert.strictEqual(s.capT, undefined); }
});

// v2.68 (Two-Lane draw fix)
test('a: units trained at a forward Barracks (each faction\'s) start at that lane\'s Forward flag and gather there while the post is held', () => {
  for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) {
    const g = setup('hard'); g.sides[0].faction = fac; g.ents = g.ents.filter(e => e.kind !== 'b' || e.type === 'hq');
    const side = g.sides[0]; side.res.c = side.res.e = 9000;
    const F = sim.cur().FWD_PADS, k = F.findIndex(f => f.at[0] === 820 && f.at[1] === 280), post = g.nodes[F[k].node]; post.owner = 0; post.prog = 100;
    for (const n of g.nodes) if (n !== post) { n.owner = null; n.prog = 0; }
    assert.ok(sim.tryBuild(g, 0, 'barracks', sim.FWD_SLOT + k).ok, fac);
    const bar = sim.fwdAt(g, sim.FWD_SLOT + k); bar.built = true; bar.hp = bar.maxHp; bar.progress = 1;
    const fr = sim.fwdRally(g, 0, bar); assert.ok(fr && fr.lane === 1 && Math.abs(fr.v - 280) < 1, JSON.stringify(fr));
    const ut = { lastfist: 'rifle', bloomhost: 'skitterling', axiarchs: 'shardling' }[fac];
    bar.queue.push(ut); bar.prodT = 1e9;
    for (let i = 0; i < 4 * 60 && !g.ents.some(e => e.kind === 'u' && e.side === 0); i++) sim.update(g, sim.TICK);
    const u = g.ents.find(e => e.kind === 'u' && e.side === 0);
    assert.ok(u && u.lane === 1 && u.fwdHome && Math.abs(u.u - fr.u) < 40 && Math.abs(u.v - fr.v) < 40, `${fac}: ${u && [u.u, u.v, u.lane]}`);
    post.owner = 1; post.prog = -100; sim.update(g, sim.TICK); assert.strictEqual(u.fwdHome, undefined, 'post lost: home is the base again');
  }
});

test('a off (FWD_RALLY.on false): v2.67\'s behaviour, the unit appears beside the building', () => {
  const g = setup('hard'); sim.FWD_RALLY.on = false;
  try { const F = sim.cur().FWD_PADS; g.nodes[F[0].node].owner = 0; const b = { slot: sim.FWD_SLOT }; assert.strictEqual(sim.fwdRally(g, 0, b), null); } finally { sim.FWD_RALLY.on = true; }
});

test('b: from 15:00 every difficulty commits when not clearly behind; not before, not when behind, not under attack', () => {
  for (const diff of ['easy', 'normal', 'hard']) {
    const g = setup(diff), side = g.sides[1]; g.t = 905;
    sim.aiLanes(g, 1, D(g, 1), [], [], false, 900, 1000);
    assert.ok(side.stance === 'attack' && side.pushMode === 'all', `${diff}: commits at 0.9x`);
  }
  const e = setup('easy'); e.t = 800; sim.aiLanes(e, 1, D(e, 1), [], [], false, 900, 1000); assert.notStrictEqual(e.sides[1].stance, 'attack', 'not before 15:00');
  const f = setup('easy'); f.t = 905; sim.aiLanes(f, 1, D(f, 1), [], [], false, 700, 1000); assert.notStrictEqual(f.sides[1].stance, 'attack', 'clearly behind');
  const h = setup('easy'); h.t = 905; sim.aiLanes(h, 1, D(h, 1), [], [], true, 900, 1000); assert.notStrictEqual(h.sides[1].stance, 'attack', 'under attack at home');
});
