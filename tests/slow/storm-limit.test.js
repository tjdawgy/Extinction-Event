// v2.58: moved from tests/extinction.test.js (9 full AI-vs-AI matches): every match ends by 27:00 on every difficulty.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('../load-sim');

const sim = loadSim();
const E = sim.EXT;
test('AI vs AI always finishes by 27:00, on every difficulty', () => {
  for (const d of ['easy', 'normal', 'hard']) for (let m = 0; m < 3; m++) {
    const g = sim.newGame(d, { autoPlayer: true, autoDiff: d });
    for (let i = 0; i < 30 * 1800 && !g.over; i++) sim.update(g, 1 / 30);
    assert.ok(g.over && g.t <= E.limit + 0.1, `${d}: over ${g.over} at ${g.t.toFixed(0)} s`);
  }
});
