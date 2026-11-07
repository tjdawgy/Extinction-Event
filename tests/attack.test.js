// v2.60 (Phase 1 stalemate fix, KNOWN_ISSUES.md "AI attack decisions"): the scoutGo, estFix, press, raid and supply
// rules. v2.61: every difficulty has them (Easy and Normal with their own press and raid settings, LADDER); hard259 is
// v2.59's Hard and default260 v2.60's Default.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const quiet = (seed = 1) => { const g = sim.newGame('hard', { seed, factions: ['lastfist', 'lastfist'] }); g.countdown = 0; for (const s of [0, 1]) g.sides[s].aiT = 1e9; return g; };

test('Hard and Default (v2.61: Easy, Normal) have the rules; hard259 and default260 have none of them', () => {
  const k = ['scoutGo', 'estFix', 'press', 'raid', 'supply'];
  for (const r of k) { assert.ok(sim.AI_PRESETS.hard.fix[r] && sim.AI_PRESETS.default.fix[r], `hard and default have ${r}`); assert.ok(!sim.AI_PRESETS.default260.fix[r] && !sim.AI_PRESETS.hard259.fix[r], `default260 and hard259 lack ${r}`); }
});

test('estFix: unseen, the enemy army is a capped time curve; a good look resets it to what it saw, then it rebuilds', () => {
  const E = sim.ATTACK.est, g = quiet();
  g.t = 60; assert.strictEqual(sim.aiEstimate(g, 1), E.base + E.rate * 60);
  g.t = 1200; assert.strictEqual(sim.aiEstimate(g, 1), E.cap, 'capped');
  // the enemy army in view: 5 Tanks near side 1's base (visible), worth more than half the curve
  const g2 = quiet(); g2.t = 600;
  for (let i = 0; i < 5; i++) { const u = sim.spawnUnit(g2, 0, 'tank', 1200 + i * 4, 0); u.holdU = u.u; u.holdV = 0; }
  sim.updateVision(g2);
  const seen = g2.ents.filter(e => e.kind === 'u' && e.side === 0).reduce((a, e) => a + sim.UDEF[e.type].cost.c + sim.UDEF[e.type].cost.e, 0);
  const curve = t => Math.min(E.cap, E.base + E.rate * t);
  assert.ok(seen >= E.seen * curve(600) && seen < curve(600));
  assert.strictEqual(sim.aiEstimate(g2, 1), seen, 'what it sees');
  for (const e of g2.ents) if (e.kind === 'u' && e.side === 0) e.hp = 0; // the army dies out of sight
  g2.ents = g2.ents.filter(e => e.hp > 0); sim.updateVision(g2);
  g2.t = 630; assert.strictEqual(Math.round(sim.aiEstimate(g2, 1)), Math.round(Math.min(curve(630), seen + E.rebuild * 30)), 'the last look plus rebuilding');
});

test('scoutGo: a Hard scout walks out while its side is on Retreat (it used to run home)', () => {
  const g = quiet(); const s = 1, sc = sim.spawnUnit(g, s, 'rifle', 1300, 0);
  g.sides[s].stance = 'retreat'; g.sides[s].scoutId = sc.id; g.sides[s].scoutU = 700;
  for (let i = 0; i < 60 * 6; i++) sim.update(g, sim.TICK);
  assert.ok(sc.u < 1200, `went out (${Math.round(sc.u)})`);
  const g2 = sim.newGame('normal', { seed: 1, factions: ['lastfist', 'lastfist'], ai: 'default260' }); g2.countdown = 0; for (const x of [0, 1]) g2.sides[x].aiT = 1e9;
  const sc2 = sim.spawnUnit(g2, s, 'rifle', 1300, 0); g2.sides[s].stance = 'retreat'; g2.sides[s].scoutId = sc2.id; g2.sides[s].scoutU = 700;
  for (let i = 0; i < 60 * 6; i++) sim.update(g2, sim.TICK);
  assert.ok(sc2.u > 1200, `v2.60's Default (default260) had the old rule (${Math.round(sc2.u)})`);
});

test('raid: a few fast units head for the enemy node, at most a third of the army; they come home when hurt', () => {
  const g = quiet(); const s = 1;
  for (let i = 0; i < 8; i++) sim.spawnUnit(g, s, i < 4 ? 'rifle' : 'tank', 1300, 0);
  g.t = 300; const mine = g.ents.filter(e => e.kind === 'u' && e.side === s), myV = mine.reduce((a, e) => a + sim.UDEF[e.type].cost.c + sim.UDEF[e.type].cost.e, 0);
  sim.aiRaid(g, s, mine, myV);
  const R = g.sides[s].raid;
  assert.ok(R && R.ids.length >= 2 && R.ids.length <= sim.ATTACK.raid.n, 'a raid party');
  assert.strictEqual(R.u, g.nodes[0].u, "the enemy's own node");
  const v = mine.filter(u => R.ids.includes(u.id)).reduce((a, e) => a + sim.UDEF[e.type].cost.c + sim.UDEF[e.type].cost.e, 0);
  assert.ok(v <= myV * sim.ATTACK.raid.share + 1e-9);
  for (let i = 0; i < 60 * 4; i++) sim.update(g, sim.TICK);
  assert.ok(mine.filter(u => R.ids.includes(u.id)).every(u => u.u < 1250), 'on their way');
  for (const u of mine) if (R.ids.includes(u.id)) u.hp = 1;
  sim.aiRaid(g, s, mine, myV); assert.strictEqual(g.sides[s].raid, null, 'hurt: called off');
});

test('supply: at its limit with money banked and every Habitat at T3, Hard trades a spare building for a Habitat', () => {
  const { runMatch } = require('../audit/sim/match');
  const r = runMatch({ seed: 3, diff: 'hard', maxT: 900, sides: [{ faction: 'bloomhost', ai: 'hard', persona: 'random' }, { faction: 'bloomhost', ai: 'hard', persona: 'random' }] });
  const cap = r.samples.map(x => Math.max(...x.cap));
  assert.ok(Math.max(...cap) > 34, `army limit grew past one T3 Habitat (${Math.max(...cap)})`);
  const old = runMatch({ seed: 3, diff: 'hard', maxT: 900, sides: [{ faction: 'bloomhost', ai: 'hard259', persona: 'random' }, { faction: 'bloomhost', ai: 'hard259', persona: 'random' }] });
  assert.ok(Math.max(...old.samples.map(x => Math.max(...x.cap))) <= 34, 'v2.59 Hard stays at 34');
});
