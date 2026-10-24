// v2.16: the faction field (Last Fist, saves v16 and the v15 migration, the match log) and the Tech Lab needing only a Barracks. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const finish = (g, s, k) => { const r = sim.tryBuild(g, s, k); if (r.ok) for (const b of g.ents) if (b.side === s && b.type === k) { b.built = true; b.progress = 1; } return r; };

test('every side has a faction, Last Fist by default; it survives save and resume', () => {
  assert.strictEqual(sim.DEFAULT_FACTION, 'lastfist');
  assert.strictEqual(sim.FACTIONS.lastfist.name, 'Last Fist');
  assert.strictEqual(sim.factionName('lastfist'), 'Last Fist');
  assert.strictEqual(sim.factionName('nonsense'), 'Last Fist', 'an unknown key falls back to the default');
  const g = sim.newGame('normal');
  assert.deepStrictEqual([...g.sides.map(s => s.faction)], ['lastfist', 'lastfist']);
  const o = JSON.parse(sim.serialize(g, {}));
  assert.strictEqual(o.v, 16);
  assert.deepStrictEqual(o.sides.map(s => s.faction), ['lastfist', 'lastfist']);
  assert.deepStrictEqual([...sim.deserialize(JSON.stringify(o)).sides.map(s => s.faction)], ['lastfist', 'lastfist']);
});

test('a v15 save (no faction) loads as Last Fist vs Last Fist', () => {
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'normal' });
  for (let i = 0; i < 30 * 60; i++) sim.update(g, 1 / 30);
  const o = JSON.parse(sim.serialize(g, {})); o.v = 15; for (const sd of o.sides) delete sd.faction;
  const g2 = sim.deserialize(JSON.stringify(o));
  assert.ok(g2, 'v15 save loads');
  assert.deepStrictEqual([...g2.sides.map(s => s.faction)], ['lastfist', 'lastfist']);
  for (let i = 0; i < 30 * 10; i++) sim.update(g2, 1 / 30); // and keeps playing
  assert.strictEqual(JSON.parse(sim.serialize(g2, {})).v, 16);
});

test('the match log names both factions', () => {
  const g = sim.newGame('normal'); g.result = { how: 'hq' };
  const txt = sim.logText(g, { version: sim.VERSION, diff: 'Normal', persona: 'The Turtle', result: 'Victory, enemy HQ destroyed' });
  assert.match(txt.split('\n')[2], /^Factions: you Last Fist, enemy Last Fist$/);
});

test('Tech Lab needs only a Barracks (no War Factory); the AI still builds one', () => {
  assert.strictEqual(sim.BDEF.techlab.req, 'barracks');
  const g = sim.newGame('normal'); for (const s of g.sides) s.aiT = 1e9;
  g.sides[0].res.c = g.sides[0].res.e = 5000;
  assert.match(sim.tryBuild(g, 0, 'techlab').msg, /Requires a finished Barracks/);
  sim.tryBuild(g, 0, 'barracks');
  assert.match(sim.tryBuild(g, 0, 'techlab').msg, /Requires a finished Barracks/, 'not while the Barracks is still building');
  for (const b of g.ents) if (b.type === 'barracks') { b.built = true; b.progress = 1; }
  assert.ok(finish(g, 0, 'techlab').ok);
  assert.ok(!sim.hasBuilt(g, 0, 'factory'));
  assert.ok(sim.tryTrain(g, 0, 'aircraft').ok, 'a Gunship with no War Factory');
  // the AI: Hard plays a match and builds a Tech Lab
  let built = 0;
  for (let m = 0; m < 2 && !built; m++) {
    const a = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'economist', autoPersona: 'economist' });
    for (let i = 0; i < 30 * 900 && !a.over && !built; i++) { sim.update(a, 1 / 30); if (a.ents.some(e => e.type === 'techlab' && e.built)) built = 1; a.events.length = 0; }
  }
  assert.ok(built, 'an AI builds a Tech Lab');
});
