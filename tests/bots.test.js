// Scripted bots play full matches against the AI without errors
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');
const { playMatch } = require('./bots');

const sim = loadSim();
for (const bot of ['rush', 'turtle']) {
  test(`${bot} bot plays a full match against the Normal AI`, () => {
    const r = playMatch(sim, 'normal', bot);
    assert.ok(r.winner === 0 || r.winner === 1, 'match finishes within 30 minutes');
    assert.ok(r.stats[0].built > 5, 'bot trained an army');
    for (const e of r.g.ents) assert.ok(Number.isFinite(e.u) && Number.isFinite(e.hp));
  });
}
test('rush bot builds several Barracks, only Riflemen, and attacks', () => {
  const { BOTS, STEP } = require('./bots');
  const g = sim.newGame('normal'), bot = BOTS.rush(sim);
  let maxB = 0;
  while (!g.over && g.t < 180) { sim.update(g, STEP); bot(g, 0, STEP); maxB = Math.max(maxB, g.ents.filter(e => e.side === 0 && e.type === 'barracks').length); }
  assert.ok(maxB >= 2);
  assert.ok(bot.log.attacks >= 1);
  assert.ok(g.ents.filter(e => e.side === 0 && e.kind === 'u').every(u => u.type === 'rifle'));
});
