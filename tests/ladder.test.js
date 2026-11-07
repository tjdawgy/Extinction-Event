// v2.61 (Phase 1, the difficulty ladder): the v2.60 bug fixes (scoutGo, estFix, supply) apply on every difficulty; how
// hard Easy and Normal play is set on purpose (LADDER). The ladder's numbers are in audit/logs-p1/ladder-v261.md
// (audit/sim/ladder.js, 200 matches per matchup).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const P = (diff, ai) => { const g = sim.newGame(diff, { seed: 4, factions: ['lastfist', 'bloomhost'], ai }); return { g, P: g.sides[1].persona, D: sim.aiDiff(g, 1) }; };

test('every difficulty has the v2.60 fixes; the older presets keep their recorded rules', () => {
  for (const d of ['easy', 'normal', 'hard']) { const { P: p } = P(d); for (const k of ['scoutGo', 'estFix', 'supply']) assert.ok(sim.aiFix(p, k), `${d}: ${k}`); }
  for (const ai of ['default260', 'hard259', 'v239', 'legacy']) { const { P: p } = P('normal', ai); for (const k of ['scoutGo', 'estFix', 'supply', 'ladder']) assert.ok(!sim.aiFix(p, k), `${ai} lacks ${k}`); }
});

test('the ladder: Easy slower and smaller and never raids, Normal in between, Hard as in v2.60', () => {
  const e = P('easy').D, n = P('normal').D, h = P('hard').D;
  assert.ok(e.delay > n.delay && n.delay === h.delay, 'Easy decides slowest');
  assert.ok(e.armyCap < n.armyCap, 'Easy fields a smaller army');
  assert.ok(e.press.edge > n.press.edge && n.press.edge > sim.ATTACK.press.edge && n.press.edgeLate < e.press.edgeLate, 'Easy needs the biggest edge to attack, Hard the smallest');
  assert.strictEqual(e.raid, false, 'Easy never raids');
  assert.ok(n.raid.every > sim.ATTACK.raid.every && n.raid.n <= sim.ATTACK.raid.n, 'Normal raids less often and smaller');
  assert.ok(!sim.aiFix(P('easy').P, 'breakout') && sim.aiFix(P('normal').P, 'breakout') && sim.aiFix(P('hard').P, 'breakout'), 'Normal has some of Hard\'s defence rules, Easy none');
  assert.strictEqual(h.press && Object.keys(h.press).length, 0, 'Hard: the v2.60 edges');
  assert.strictEqual(h.label, 'Hard'); assert.strictEqual(e.wave, sim.DIFF.easy.wave, 'unset fields fall through to DIFF');
});

test('a supply-blocked Easy side (top tier T2) still trades a building for a Habitat', () => {
  const { runMatch } = require('../audit/sim/match');
  const r = runMatch({ seed: 8000, diff: 'easy', maxT: 900, sides: [{ faction: 'lastfist', persona: 'random' }, { faction: 'lastfist', persona: 'random' }] });
  assert.ok(Math.max(...r.samples.map(x => Math.max(...x.cap))) > 28, `past one T2 Habitat (${Math.max(...r.samples.map(x => Math.max(...x.cap)))})`);
});
