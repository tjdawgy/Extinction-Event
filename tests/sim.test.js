// Run with: npm test   (or: node --test tests/sim.test.js)
const test = require('node:test');
const assert = require('node:assert');
const { loadSim, readHtml } = require('./load-sim');

const sim = loadSim();
const STEP = 1 / 30;

function run(g, seconds) { for (let t = 0; t < seconds && !g.over; t += STEP) sim.update(g, STEP); }

test('branding and version', () => {
  const html = readHtml();
  assert.strictEqual(sim.GAME_NAME, 'Extinction Event');
  assert.match(sim.VERSION, /^\d+\.\d+(\.\d+)?$/);
  assert.match(html, /<title>Extinction Event<\/title>/);
  assert.match(html, /<h1>Extinction <span>Event<\/span><\/h1>/);
  assert.match(html, /v\$\{VERSION\}/, 'title screen shows the version');
  assert.doesNotMatch(html, /Colony Mobile|Colony <span>Mobile/, 'old name is gone from visible text');
});

test('a new game starts with an HQ per side and starting resources', () => {
  const g = sim.newGame('normal');
  assert.strictEqual(g.sides.length, 2);
  for (const s of g.sides) { assert.ok(s.hq && s.hq.built); assert.ok(s.res.c > 0); }
  assert.strictEqual(g.over, false);
});

test('player can build, train and upgrade', () => {
  const g = sim.newGame('easy');
  assert.ok(sim.tryBuild(g, 0, 'barracks').ok);
  assert.ok(!sim.tryBuild(g, 0, 'factory').ok, 'factory needs a finished barracks');
  run(g, 15);
  assert.ok(g.ents.some(e => e.side === 0 && e.type === 'barracks' && e.built));
  g.sides[0].res.c = 5000; g.sides[0].res.e = 5000;
  assert.ok(sim.tryTrain(g, 0, 'rifle').ok);
  run(g, 5);
  assert.ok(g.ents.some(e => e.kind === 'u' && e.side === 0 && e.type === 'rifle'));
  const hq = g.sides[0].hq;
  assert.ok(sim.tryUpgrade(g, 0, hq).ok);
  run(g, 21);
  assert.strictEqual(hq.tier, 2);
});

test('save and load round-trips a match in progress', () => {
  const g = sim.newGame('normal', { autoPlayer: true });
  run(g, 120);
  const str = sim.serialize(g, { camX: 123 });
  const g2 = sim.deserialize(str);
  assert.ok(g2, 'save loads');
  assert.strictEqual(g2.t, g.t);
  assert.strictEqual(g2.ents.length, g.ents.filter(e => e.hp > 0).length);
  assert.strictEqual(g2.extra.camX, 123);
  run(g2, 30); // keeps running after a reload
});

for (const diff of ['easy', 'normal', 'hard']) {
  test(`AI vs AI match on ${diff} plays to a finish without errors`, () => {
    const g = sim.newGame(diff, { autoPlayer: true });
    run(g, 60 * 30);
    for (const e of g.ents) assert.ok(Number.isFinite(e.u) && Number.isFinite(e.hp), 'no NaN positions or HP');
    assert.ok(g.t > 60, 'match lasted a while');
    assert.ok(g.over, 'someone wins within 30 minutes');
    assert.ok(g.winner === 0 || g.winner === 1);
  });
}
