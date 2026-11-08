// v2.63 (Phase 1, multi-lane engine): two Hard AIs play the TEST-ONLY two-lane map (tests/maps/twolane-test.js) to the end:
// every match finishes by 27:00, both sides use both lanes, and a seeded match is won by destroying an HQ.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('../load-sim');
const MAPDEF = require('../maps/twolane-test');

const sim = loadSim({ map: MAPDEF });
const F = ['lastfist', 'bloomhost', 'axiarchs'];
test('two AIs play the two-lane test map to a finish', () => {
  let hqWins = 0;
  for (let m = 0; m < 3; m++) {
    const g = sim.newGame('hard', { seed: 100 + m, autoPlayer: true, autoDiff: 'hard', factions: [F[m], F[(m + 1) % 3]] });
    g.countdown = 0;
    const lanes = [new Set(), new Set()];
    for (let i = 0; i < 60 * (sim.EXT.limit + 5) && !g.over; i++) {
      sim.update(g, sim.TICK); g.events.length = 0;
      if (i % 600 === 0) for (const e of g.ents) if (e.kind === 'u' && e.hp > 0 && e.u > 600 && e.u < 1100) lanes[e.side].add(e.lane);
    }
    assert.ok(g.over && g.t <= sim.EXT.limit + 0.1, `match ${m}: over ${g.over} at ${g.t.toFixed(0)} s`);
    assert.ok(lanes.every(L => L.size === 2), `match ${m}: both sides fought on both lanes`);
    if (g.winner >= 0 && g.result && g.result.how === 'hq') hqWins++;
  }
  assert.ok(hqWins >= 1, 'at least one match is won by destroying an HQ');
});
