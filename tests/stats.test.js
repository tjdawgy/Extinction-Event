// v2.51 (Phase 0 item 4): the stats tracker records each match per side, plays no part in the rules, and leaves a compact
// summary for the match history
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
function play(seed, factions, maxT = 1700) {
  const g = sim.newGame('hard', { seed, autoPlayer: true, autoDiff: 'hard', factions });
  while (!g.over && g.t < maxT) sim.update(g, sim.TICK);
  return g;
}

test('a full AI-vs-AI match: samples every 10 s, counts that agree with the match log, damage, timestamps, the result', () => {
  const g = play(31, ['lastfist', 'bloomhost']);
  assert.ok(g.over, 'the match ended');
  const S = g.stats, T = g.log.tot;
  for (const s of [0, 1]) {
    const D = S.sides[s];
    assert.strictEqual(D.c.length, Math.floor(g.t / 10), 'one sample per 10 s');
    for (const k of ['e', 'army', 'alive', 'bank']) assert.strictEqual(D[k].length, D.c.length, k);
    assert.ok(sum(D.c) > 0 && sum(D.e) > 0, 'income recorded');
    // income + Salvage, never sales: what the match log counts the same way, give or take the last partial window
    const gathered = T[s].earn[0] + (T[s].salv || 0);
    assert.ok(sum(D.c) <= gathered + 1 && sum(D.c) >= gathered - 400, `credits ${sum(D.c)} vs ${gathered}`);
    assert.deepStrictEqual(D.built, T[s].trained, 'units built = the log\'s trained');
    assert.deepStrictEqual(D.lost, T[s].lost, 'units lost');
    assert.deepStrictEqual(D.bBuilt, T[s].bBuilt, 'buildings built');
    assert.deepStrictEqual(D.bLost, T[s].bLost, 'buildings destroyed');
    assert.ok(D.dmg > 0, 'damage dealt');
    assert.strictEqual(D.abil.length, sum(Object.fromEntries(Object.entries(T[s].ab).map(([k, v]) => [k, v[0]]))), 'every ability use, timestamped');
    assert.strictEqual(D.nodes.filter(x => x[2]).length, T[s].nodeCap, 'node captures');
    for (const list of [D.nodes, D.tech, D.sig, D.abil, D.strat]) for (const x of list) assert.ok(x[0] >= 0 && x[0] <= g.t + 0.1, 'timestamps inside the match');
    assert.ok(D.tech.some(x => x[3] === 'start') && D.tech.some(x => x[3] === 'done'), 'tech: upgrades started and finished');
  }
  assert.ok(S.sides[0].dmgB + S.sides[1].dmgB > 0, 'building damage');
  const R = S.result;
  assert.ok(R && R.len === Math.round(g.t) && R.diff === 'hard');
  assert.strictEqual(JSON.stringify(R.sides.map(x => x.faction)), '["lastfist","bloomhost"]');
  if (g.winner < 0) assert.strictEqual(R.sides.map(x => x.res).join(), 'draw,draw');
  else { assert.strictEqual(R.sides[g.winner].res, 'win'); assert.strictEqual(R.sides[1 - g.winner].res, 'loss'); }
  const sm = sim.statsSummary(g, { at: 5 });
  assert.ok(sm && sm.v === 1 && sm.at === 5 && sm.len === R.len && sm.sides.length === 2);
  assert.ok(JSON.stringify(sm).length < 4000, `compact: ${JSON.stringify(sm).length} bytes`);
  assert.deepStrictEqual(sm.sides[0].built, S.sides[0].built);
});

test('damage dealt: HP and shields actually taken off, credited to the attacker only', () => {
  const g = sim.newGame('normal', { seed: 3, factions: ['lastfist', 'axiarchs'] });
  for (const s of [0, 1]) g.sides[s].aiT = 1e9;
  g.countdown = 0;
  const z = sim.spawnUnit(g, 1, 'shardling', 800, 0); z.shp = 20; z.maxShp = Math.max(z.maxShp, 20); const hp0 = z.hp;
  sim.damage(g, z, 30, 'rifle', 0);
  const taken = 20 - z.shp + hp0 - z.hp;
  assert.ok(taken > 0);
  assert.ok(Math.abs(g.stats.sides[0].dmg - taken) < 1e-6, `${g.stats.sides[0].dmg} vs ${taken}`);
  assert.strictEqual(g.stats.sides[1].dmg, 0);
  sim.damage(g, z, 1e6, 'rifle', 0);
  assert.ok(g.stats.sides[0].dmg <= taken + hp0 + 20 + 1e-6, 'never more than it had');
});

test('the tracker changes nothing: the same seed plays the same match with and without it; it survives a save', () => {
  const run = off => { const S = loadSim(), g = S.newGame('hard', { seed: 77, autoPlayer: true, autoDiff: 'hard' }); if (off) g.stats = null;
    for (let i = 0; i < 60 * 240; i++) S.update(g, S.TICK); const o = JSON.parse(S.serialize(g, {})); delete o.log; delete o.stats; return JSON.stringify(o); };
  assert.strictEqual(run(true), run(false));
  const g = sim.newGame('normal', { seed: 5, autoPlayer: true }); for (let i = 0; i < 60 * 65; i++) sim.update(g, sim.TICK);
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.strictEqual(JSON.stringify(g2.stats), JSON.stringify(g.stats));
  const o = JSON.parse(sim.serialize(g, {})); delete o.stats; const g3 = sim.deserialize(JSON.stringify(o));
  assert.ok(g3.stats && g3.stats.from === o.t && g3.stats.sides[0].c.length === 0, 'an older save starts its record at load');
});
