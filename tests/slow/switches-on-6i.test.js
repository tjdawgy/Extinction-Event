// v2.99 (batch 6i): the switches-on counterparts of the two statistical tests in tests/slow/ai-stats.test.js held b6i off (the
// Bloomhost base AI's Razorwings; the Bloomspire Economist's path and its Apex units). The same seeds, matches and opponents with every
// switch on: Razorwing flocks (id razor6) for the base AI; the Bloomspire path, Talonmaws and Skywyrms for the Economist. Thresholds sit
// below the rates measured over 20 matches (in the comments; AISTATS_N=20 node tests/slow/switches-on-6i.test.js --print).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('../../audit/sim/load');

const N = +(process.env.AISTATS_N || 10), PRINT = process.argv.includes('--print');
const RAZ_MIN = 0.8, PATH_MIN = 0.7, T2_MIN = 0.7, T3_MIN = 0.4; // measured over 20 (seeds 200-219 and 300-319): Razorwing flocks 100%; a path 100%, a T2 unit 100%, a T3 one 85%
function playN(n, seed0, opts, maxT, look, done) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const o = Object.assign({ autoPlayer: true, autoDiff: 'hard', ai: 'default', autoAi: 'default' }, opts), S = loadSim(seed0 + i), g = S.newGame(o.autoDiff, o); g.countdown = 0;
    assert.ok(g.rw.b6i && g.rw.b6iresp, 'every switch on');
    const st = {};
    while (!g.over && g.t < maxT) { S.update(g, 1 / 30); if (look) look(g, S, st); g.events.length = 0; }
    out.push(done(g, S, st));
  }
  return out;
}
const rate = (rows, f) => rows.filter(f).length / rows.length;
function check(name, rows, rules) {
  const got = rules.map(([lbl, f, min]) => [lbl, rate(rows, f), min]);
  if (PRINT) console.log(`${name} (${rows.length} matches): ${got.map(([l, r]) => `${l} ${Math.round(r * 100)}%`).join(', ')}`);
  for (const [lbl, r, min] of got) assert.ok(r >= min, `${name}: ${lbl} in ${Math.round(r * 100)}% of matches (needs ≥ ${Math.round(min * 100)}%)`);
}

test('on (ai-stats): the Bloomhost base AI (Turtle vs a Last Fist Aggressor) trains Razorwing flocks', () => {
  const rows = playN(N, 200, { persona: 'turtle', autoPersona: 'aggressor', factions: ['lastfist', 'bloomhost'] }, 1200, null,
    (g) => ({ tr: g.sides[1].aiLog.trained }));
  check('Bloomhost base AI (b6i)', rows, [['Skitterlings', r => r.tr.skitterling > 0, 0.9], ['Razorwing flocks', r => r.tr.razor6 > 0, RAZ_MIN], ['never the old Razorwing', r => !r.tr.razorwing, 1]]);
});

test('on (ai-stats): the Bloomspire Economist takes a path and trains its units (Talonmaws or Gnatclouds; a Skywyrm or Blightwing in some)', () => {
  const rows = playN(N, 300, { persona: 'economist', autoPersona: 'turtle', factions: ['axiarchs', 'bloomhost'] }, 1200,
    (g, S, st) => { for (const e of g.ents) if (e.side === 1 && e.type === 'techlab' && e.path) st.path = e.path; },
    (g, S, st) => ({ path: st.path || null, tr: g.sides[1].aiLog.trained }));
  check('Bloomspire (b6i)', rows, [['a Bloomspire path taken', r => !!r.path, PATH_MIN], ['a T2 Bloomspire unit (Gnatcloud or Talonmaw)', r => r.tr.gnatcloud > 0 || r.tr.talonmaw > 0, T2_MIN], ['a T3 one (Blightwing or Skywyrm)', r => r.tr.blightwing > 0 || r.tr.skywyrm > 0, T3_MIN],
    ['none of the cut four', r => !r.tr.needlewing && !r.tr.cloudwing && !r.tr.broodtyrant && !r.tr.worldrender, 1]]);
});
