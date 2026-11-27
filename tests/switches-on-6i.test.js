// v2.99 (batch 6i): the switches-on counterparts of the tests held b6i or b6iresp off with pin6i (tests/load-sim.js). Each checks
// the same intent with every switch on (the new-game default): the Bloomspire's paths lock and reset (bh-spire), the AI trains
// every unit on its path (bh-spire), each faction trains only its own units (bloomhost), swarm surge stays off aircraft
// (rework-5b), the Bloomspire has anti-air (rework-5b's Needlewing), the Bloomspire's apex units hit buildings and their Mite
// source is gone (rework-4b's Brood Tyrant and Worldrender), a melee unit under fire from a Marine close by charges it (rework-6g;
// the pull-back is gone with b6iresp, tests/rework-6i.test.js checks it never happens). The browser picker: tests/rework-6i-ui.test.js.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
sim.BREAK.prod.on = false; // as bh-spire.test.js (an HQ shielded by any finished building)
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'bloomhost', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const finish = (g, s, k) => { assert.ok(sim.tryBuild(g, s, k).ok); const b = g.ents.filter(e => e.side === s && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };
const upTo = (g, b, path, tier) => { while (b.tier < tier) { assert.ok(sim.tryUpgrade(g, 0, b, path).ok); b.upProg = 0.9999; step(g, 0.2); } };

test('on (bh-spire): Swarm Bloom or Apex Bloom at T2 locks the building; T3 deepens it; Razorwing flocks on both; selling resets', () => {
  const g = quiet();
  finish(g, 0, 'barracks'); const spire = finish(g, 0, 'techlab'); finish(g, 0, 'habitat'); finish(g, 0, 'habitat'); finish(g, 0, 'habitat');
  assert.ok(!sim.tryTrain(g, 0, 'gnatcloud').ok, 'nothing new at T1'); assert.ok(sim.tryTrain(g, 0, 'razor6').ok, 'a flock at T1');
  upTo(g, spire, 'A', 2); assert.strictEqual(spire.path, 'A');
  assert.ok(sim.tryTrain(g, 0, 'gnatcloud').ok); assert.ok(sim.tryTrain(g, 0, 'razor6').ok, 'Razorwings on both paths');
  assert.ok(!sim.tryTrain(g, 0, 'talonmaw').ok, 'not the other path'); assert.ok(!sim.tryTrain(g, 0, 'blightwing').ok, 'Blightwings need T3');
  upTo(g, spire, 'B', 3); assert.strictEqual(spire.path, 'A', 'the path never switches'); assert.ok(sim.tryTrain(g, 0, 'blightwing').ok);
  assert.ok(!sim.tryTrain(g, 0, 'skywyrm').ok);
  for (const t of ['needlewing', 'cloudwing', 'broodtyrant', 'worldrender', 'razorwing']) assert.ok(!sim.tryTrain(g, 0, t).ok, t + ' is gone');
  sim.trySell(g, 0, spire); step(g, 0.1); const s2 = finish(g, 0, 'techlab');
  assert.ok(s2.path === null && s2.tier === 1, 'a rebuilt Bloomspire is undecided again');
  g.sides[0].res.c = g.sides[0].res.e = 9000; upTo(g, s2, 'B', 3);
  assert.ok(sim.tryTrain(g, 0, 'talonmaw').ok && sim.tryTrain(g, 0, 'skywyrm').ok);
  assert.ok(!sim.tryTrain(g, 0, 'gnatcloud').ok);
});

test('on (bh-spire): the AI trains every unit on its Bloomspire path (a prepared T3 Bloomspire on each path)', () => {
  const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  for (const [path, want] of [['A', ['gnatcloud', 'blightwing']], ['B', ['talonmaw', 'skywyrm']]]) {
    const s = loadSim({ random: mul(7) });
    const st = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) s.update(g, 1 / 30); };
    const g = s.newGame('hard', { factions: ['lastfist', 'bloomhost'], ai: 'default' }); g.countdown = 0; g.sides[0].aiT = 1e9;
    const side = g.sides[1]; side.res.c = side.res.e = 6000;
    const fin = k => { assert.ok(s.tryBuild(g, 1, k).ok, k); const b = g.ents.filter(e => e.side === 1 && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };
    fin('barracks'); fin('habitat'); fin('habitat'); fin('habitat'); const sp = fin('techlab');
    sp.tier = 3; sp.path = path; sp.maxHp = sp.hp = sp.maxHp * 2;
    st(g, 90);
    for (const t of want) assert.ok(side.aiLog.trained[t] > 0, `path ${path}: trained ${JSON.stringify(side.aiLog.trained)}`);
  }
});

test('on (bloomhost): each faction trains only its own units (the Razorwing as a flock)', () => {
  const g = quiet(); g.countdown = 0;
  finish(g, 0, 'barracks'); finish(g, 0, 'factory'); finish(g, 0, 'techlab'); finish(g, 0, 'habitat'); finish(g, 1, 'barracks');
  for (const [t, ok] of [['skitterling', true], ['bulwark', true], ['razor6', true], ['razorwing', false], ['rifle', false], ['tank', false], ['aircraft', false]]) assert.strictEqual(sim.tryTrain(g, 0, t).ok, ok, t);
  assert.ok(sim.tryTrain(g, 1, 'rifle').ok); assert.ok(!sim.tryTrain(g, 1, 'razor6').ok, 'a Last Fist Barracks makes no Razorwings');
});

test('on (rework-5b): swarm surge never reaches aircraft (a Razorwing flock bird or a Gnatcloud)', () => {
  const g = sim.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const lead = sim.rangeUnit(g, 0, 'skitterling', 300, 0); for (let i = 0; i < 6; i++) sim.rangeUnit(g, 0, 'skitterling', 290 - (i % 3) * 9, (Math.floor(i / 3) - 0.5) * 12);
  const a = sim.rangeUnit(g, 0, 'needlewing', 300, 0), b = sim.rangeUnit(g, 0, 'razorwing', 300, 10); sim.rangeUnit(g, 1, 'rifle', 1500, 0);
  for (let i = 0; i < 5; i++) sim.rangeStep(g);
  assert.strictEqual(a.type, 'gnatcloud'); assert.strictEqual(b.type, 'razor6');
  assert.ok(lead.sgN >= 4, 'the ground swarm surges'); assert.ok(!a.sgN && !b.sgN, 'aircraft never');
});

test('on (rework-5b): the Bloomspire has anti-air on every path: each unit hits aircraft (the Skywyrm with its tendrils and jaws)', () => {
  for (const t of ['razor6', 'gnatcloud', 'blightwing', 'talonmaw']) { const g = sim.rangeGame({ factions: ['bloomhost', 'lastfist'] }); const [u] = sim.rangeUnits(g, 0, t, 600, 0, 1); const [a] = sim.rangeUnits(g, 1, 'aircraft', 640, 0, 1); g.sides[0].mode = 'attack'; g.sides[1].hush = true; const h = a.hp; for (let i = 0; i < 60 * 6; i++) sim.rangeStep(g); assert.ok(a.hp < h, t + ' hurt a Gunship'); assert.ok(u); }
  const g = sim.rangeGame({ factions: ['bloomhost', 'lastfist'] }); sim.rangeUnits(g, 0, 'skywyrm', 600, 0, 1); const [a] = sim.rangeUnits(g, 1, 'aircraft', 700, 0, 1); g.sides[0].mode = 'hold'; g.sides[1].hush = true;
  const h = a.hp; for (let i = 0; i < 60 * 4; i++) sim.rangeStep(g); assert.ok(a.hp < h, 'the Skywyrm hurt a Gunship');
});

test('on (rework-4b): the Apex Bloom\'s units break buildings (the Skywyrm\'s spew); the Brood Tyrant\'s pustule Mites are gone with it', () => {
  const g = sim.rangeGame({ factions: ['bloomhost', 'lastfist'] }); const [w] = sim.rangeUnits(g, 0, 'worldrender', 600, 0, 1); const T = sim.rangeBuilding(g, 1, 'lastfist', 'refinery', 780, 0);
  g.sides[0].mode = 'attack'; g.sides[1].hush = true; const h = T.hp; for (let i = 0; i < 60 * 5; i++) sim.rangeStep(g);
  assert.strictEqual(w.type, 'skywyrm'); assert.ok(h - T.hp > 150, `the Refinery took ${Math.round(h - T.hp)}`); assert.ok(!T.pus, 'no pustule');
  assert.strictEqual(sim.rwType(g, 'broodtyrant'), 'talonmaw'); assert.strictEqual(sim.rwType(g, 'worldrender'), 'skywyrm');
});

test('on (rework-6g): Bloomhost melee on Hold under fire from Marines close by (within 100) charge them; from further they stand', () => {
  const run = d => { const g = sim.rangeGame({ factions: ['bloomhost', 'lastfist'] }); const rs = sim.rangeUnits(g, 0, 'ravager', 600, 0, 2); const ms = sim.rangeUnits(g, 1, 'rifle', 600 + d, 0, 2); g.sides[0].mode = 'hold'; g.sides[1].mode = 'hold'; const p = rs.map(e => e.u); let m = 0; for (let i = 0; i < 60 * 12; i++) { sim.rangeStep(g); rs.forEach((e, k) => { if (e.hp > 0) m = Math.max(m, Math.abs(e.u - p[k])); }); } return { m, left: ms.filter(e => e.hp > 0).length }; };
  const near = run(95), far = run(118);
  assert.ok(near.m > 30 && near.left < 2, `close: charged (${JSON.stringify(near)})`);
  assert.ok(far.m <= 30 || far.left < 2, `${JSON.stringify(far)}`);
});

// rework-5c's two roll tests and rework-5b's AI test, with b6i on: the Bloomspire roll is the persona's 60/40 whatever air is expected
// (every Bloomspire unit hits aircraft), it is kept for the match and a second Bloomspire takes the other path; 5b's rule leaves the
// Bloomspire's path to the roll
function rolls(s, foe, persona, n, theirs = []) {
  let swarm = 0;
  for (let i = 0; i < n; i++) {
    const g = s.newGame('hard', { seed: 100 + i, factions: [foe, 'bloomhost'], countdown: 0 });
    const spire = s.rangeBuilding(g, 1, 'bloomhost', 'techlab', 1500, 60);
    if (s.aiPickPath(g, 1, spire, { paths: { techlab: persona } }, theirs) === 'A') swarm++;
  }
  return swarm / n;
}
test('on (rework-5c): the Bloomspire roll is the persona\'s 60/40, with or without enemy air; Apex Bloom comes up', () => {
  const s = loadSim(), N = 300;
  const lf = rolls(s, 'lastfist', 'A', N), ax = rolls(s, 'axiarchs', 'A', N), axB = rolls(s, 'axiarchs', 'B', N), air = rolls(s, 'axiarchs', 'A', N, [{ type: 'wraithwing', w: 1 }]);
  assert.ok(lf > 0.33 && lf < 0.47, `against Last Fist: Swarm Bloom ${lf} (no lean)`);
  assert.ok(ax > 0.33 && ax < 0.47 && air > 0.33 && air < 0.47, `persona Apex: Swarm Bloom ${ax}, aircraft known ${air}`);
  assert.ok(axB > 0.53 && axB < 0.67, `persona Swarm: Swarm Bloom ${axB}`);
});
test('on (rework-5c, rework-5b): the roll is kept for the match, a second Bloomspire takes the other path; 5b\'s rule leaves the Bloomspire to it', () => {
  const s = loadSim();
  const g = s.newGame('hard', { seed: 9, factions: ['lastfist', 'bloomhost'], countdown: 0 });
  const a = s.rangeBuilding(g, 1, 'bloomhost', 'techlab', 1500, 60), p = s.aiPickPath(g, 1, a, { paths: { techlab: 'A' } }, []);
  assert.strictEqual(s.aiPickPath(g, 1, a, { paths: { techlab: 'A' } }, []), p, 'the same roll');
  a.path = p; a.tier = 2;
  const b = s.rangeBuilding(g, 1, 'bloomhost', 'techlab', 1500, 160);
  assert.strictEqual(s.aiPickPath(g, 1, b, { paths: { techlab: 'A' } }, []), p === 'A' ? 'B' : 'A');
  assert.ok(!g.sides[1].sw5c.airExp, 'air expected is no longer counted');
  assert.strictEqual(s.aiPath5b(g, 1, a, [{ type: 'aircraft', w: 1 }, { type: 'aircraft', w: 1 }]), null, 'aircraft: no Bloomspire lean');
});
