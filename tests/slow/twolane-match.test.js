// v2.65 (Phase 1, the Two-Lane map): two Hard AIs play Two-Lane to the end. Every match finishes by 27:00 and no ground
// unit ever stands inside the ridge. (How well the AI plays the map is item 4's work: tests/slow/twolane-ai.test.js.)
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('../load-sim');

const sim = loadSim();
const F = ['lastfist', 'bloomhost', 'axiarchs'];
test('two Hard AIs play Two-Lane to a finish, never inside the ridge', () => {
  for (let m = 0; m < 3; m++) {
    const g = sim.newGame('hard', { map: 'twolane', seed: 300 + m, autoPlayer: true, autoDiff: 'hard', factions: [F[m], F[(m + 1) % 3]] });
    g.countdown = 0;
    let inside = 0;
    for (let i = 0; i < 60 * (sim.EXT.limit + 5) && !g.over; i++) {
      sim.update(g, sim.TICK); g.events.length = 0;
      if (i % 120 === 0) for (const e of g.ents) if (e.kind === 'u' && e.hp > 0 && !sim.UDEF[e.type].air && !e.leaping && sim.navShut(e.u, e.v)) inside++;
    }
    assert.ok(g.over && g.t <= sim.EXT.limit + 0.1, `match ${m}: over ${g.over} at ${g.t.toFixed(0)} s`);
    assert.strictEqual(inside, 0, `match ${m}: units inside the ridge`);
  }
  sim.useMap('classic');
});
