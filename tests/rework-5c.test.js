// v2.90 (faction rework batch 5c): the Needlewing AI fix behind REWORK.b5c (per game, g.rw.b5c): a Normal or Hard Bloomhost AI's
// Bloomspire path is one seeded roll, Swarm Bloom 75% of the time when enemy air is expected, the persona's 60/40 otherwise; the five
// redrawn Axiarch units (art only) and the Medevac rename (text only; the id stays 'medic').
const test = require('node:test');
const assert = require('node:assert');
const { loadSim, readHtml, pin6i } = require('./load-sim');
const HTML = readHtml();

test('switch: per game, on by default; a b5c-off save leaves the key out; a v2.89 save resumes with it off', () => {
  const s = loadSim();
  assert.strictEqual(s.rwInit().b5c, true, 'on by default');
  const g = s.newGame('normal', { seed: 5 });
  assert.strictEqual(s.deserialize(s.serialize(g, {})).rw.b5c, true);
  const o = JSON.parse(s.serialize(g, {})); delete o.rw.b5c; assert.strictEqual(s.deserialize(JSON.stringify(o)).rw.b5c, false, 'a v2.89 save resumes with b5c off');
  const g0 = s.newGame('normal', { seed: 5, rework: { b5c: false } }); assert.ok(!('b5c' in JSON.parse(s.serialize(g0, {})).rw), 'a b5c-off save leaves the key out');
  assert.match(HTML, /\['b5c', 'Batch 5c'\]/, 'a Test Range switch');
});

// Many fresh Hard games (each its own seeded stream): side 1 Bloomhost against `foe`; its first Bloomspire's path at T2
function rolls(s, foe, persona, n, rework, theirs = [], prep) {
  let swarm = 0;
  for (let i = 0; i < n; i++) {
    const g = s.newGame('hard', { seed: 100 + i, factions: [foe, 'bloomhost'], countdown: 0, rework });
    const spire = s.rangeBuilding(g, 1, 'bloomhost', 'techlab', 1500, 60);
    if (prep) prep(g);
    const p = s.aiPickPath(g, 1, spire, { paths: { techlab: persona } }, theirs);
    if (p === 'A') swarm++; // Bloomhost's techlab A is Swarm Bloom (Needlewings), B Apex Bloom
  }
  return swarm / n;
}

test('AI: the Bloomspire leans to Swarm Bloom (75%) when enemy air is expected, the persona\'s 60/40 otherwise; Apex Bloom still comes up', pin6i(['b6i'], () => { // v2.99 (batch 6i): held b6i off: every Bloomspire unit hits aircraft, so the lean is gone (counterpart: tests/switches-on-6i.test.js)
  const s = loadSim(), N = 300;
  assert.strictEqual(s.AI5C.lean, 0.75);
  const lf = rolls(s, 'lastfist', 'A', N), ax = rolls(s, 'axiarchs', 'A', N), axB = rolls(s, 'axiarchs', 'B', N);
  assert.ok(lf > 0.68 && lf < 0.82, `against Last Fist (air expected): Swarm Bloom ${lf}`);
  assert.ok(ax > 0.33 && ax < 0.47, `against the Axiarchs, nothing seen, persona Air Power (Apex): Swarm Bloom ${ax}`);
  assert.ok(axB > 0.53 && axB < 0.67, `persona Support (Swarm): Swarm Bloom ${axB}`);
  const seen = rolls(s, 'axiarchs', 'A', N, undefined, [], g => { g.sides[1].air5c = 1; });
  assert.ok(seen > 0.68 && seen < 0.82, `an enemy aircraft seen earlier this match: Swarm Bloom ${seen}`);
  const ghost = rolls(s, 'axiarchs', 'A', N, undefined, [], g => { g.fog[1].ghosts.x = { type: 'techlab', side: 0, tier: 1, u: 300 }; });
  assert.ok(ghost > 0.68 && ghost < 0.82, `an enemy air production building seen: Swarm Bloom ${ghost}`);
  const air = rolls(s, 'axiarchs', 'A', N, undefined, [{ type: 'wraithwing', w: 1 }, { type: 'shardling', w: 1 }]);
  assert.ok(air > 0.68 && air < 0.82 && air < 1, `aircraft known now: a 75% lean, not batch 5b's every time: ${air}`);
  // off: batch 4a's roll and batch 5b's rule exactly as before (aircraft known: always Swarm Bloom)
  assert.strictEqual(rolls(s, 'axiarchs', 'A', 60, { b5c: false }, [{ type: 'wraithwing', w: 1 }]), 1);
}));

test('AI: the roll is kept for the match; a second Bloomspire takes the other path; an enemy aircraft seen is remembered', pin6i(['b6i'], () => { // v2.99 (batch 6i): held b6i off: it counts air expected (counterpart: tests/switches-on-6i.test.js)
  const s = loadSim();
  const g = s.newGame('hard', { seed: 9, factions: ['lastfist', 'bloomhost'], countdown: 0 });
  const a = s.rangeBuilding(g, 1, 'bloomhost', 'techlab', 1500, 60), p = s.aiPickPath(g, 1, a, { paths: { techlab: 'A' } }, []);
  assert.strictEqual(s.aiPickPath(g, 1, a, { paths: { techlab: 'A' } }, []), p, 'the same roll');
  a.path = p; a.tier = 2;
  const b = s.rangeBuilding(g, 1, 'bloomhost', 'techlab', 1500, 160);
  assert.strictEqual(s.aiPickPath(g, 1, b, { paths: { techlab: 'A' } }, []), p === 'A' ? 'B' : 'A', 'the second copy takes the path the first lacks');
  const c = g.sides[1].sw5c; assert.strictEqual((c.swarm || 0) + (c.apex || 0), 1); assert.strictEqual(c.airExp, 1, 'Last Fist: air expected');
  assert.ok(!g.sides[1].air5c); s.aiNote5c(g, 1, [{ type: 'aircraft', w: 0.1 }]); assert.strictEqual(g.sides[1].air5c, 1);
  const off = s.newGame('hard', { seed: 9, factions: ['lastfist', 'bloomhost'], countdown: 0, rework: { b5c: false } });
  for (let i = 0; i < 60 * 120; i++) s.update(off, s.TICK);
  assert.ok(!off.sides.some(d => 'air5c' in d || 'sw5c' in d), 'off: nothing of batch 5c is set');
}));

test('art: the five Axiarch units drawn by batch 5c; both flyers cached; the SIM muzzles unchanged', () => {
  for (const [t, f] of [['lancer', 'dLancer5'], ['gravemantle', 'dGrave5'], ['eventide', 'dEventide5'], ['prismwing', 'dPrism5'], ['shardstorm', 'dShardstorm5']])
    assert.ok(HTML.includes(`DRAW_U.${t} = ${f};`), `${t} is drawn by ${f}`);
  const cyc = HTML.match(/const AIR_CYC = \{([^}]*)\}/)[1];
  assert.match(cyc, /prismwing: \[9, 8\]/); assert.match(cyc, /shardstorm: \[2\.2, 24\]/);
  assert.match(HTML, /lancer: \[14, 18\][^\n]*gravemantle: \[16, 18\], eventide: \[18, 24\], prismwing: \[12, 0\], shardstorm: \[14, -1\]/, 'MUZ unchanged');
});

test('the Medicopter is the Medevac in every text; its id stays medic', () => {
  const s = loadSim();
  assert.strictEqual(s.UDEF.medic.name, 'Medevac'); assert.strictEqual(s.PLURAL.medic, 'Medevacs');
  assert.ok(!/medicopter/i.test(HTML), 'no "Medicopter" anywhere in the built game');
  assert.match(HTML, /short: 'Medevacs, Recon Drones'/);
});
