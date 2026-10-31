// Statistical AI tests (v2.38, audit phase 4). They replace the single-seed AI tests that had to be re-seeded whenever a
// rule change moved one particular match (Bloomhost abilities, the Bloomhost base AI, the Bloomspire path, the Axiarch
// personalities, the Last Fist abilities). Each plays N seeded Hard matches on the CURRENT rules (the game's Default AI,
// the unit redesign on, retreating units holding fire) through the real SIM (audit/sim/load.js) and asserts a rate: the
// behaviour must show up in at least that share of matches. The thresholds sit well below the rates measured over 20
// matches (in the comments), so a rule change that merely reshuffles matches doesn't fail them, but losing a behaviour
// does. AISTATS_N=20 node tests/ai-stats.test.js --print prints the measured rates instead.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('../audit/sim/load');

const N = +(process.env.AISTATS_N || 10), PRINT = process.argv.includes('--print');
// Plays n seeded matches; per tick, look(g, S) can record what it needs; done(g, S) returns the match's facts
function playN(n, seed0, opts, maxT, look, done) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const o = Object.assign({ autoPlayer: true, autoDiff: 'hard', ai: 'default', autoAi: 'default' }, opts) /* v2.40: the Default AI (Hard games get the Hard preset otherwise) */, S = loadSim(seed0 + i), g = S.newGame(o.autoDiff, o); g.countdown = 0;
    const st = {};
    while (!g.over && g.t < maxT) { S.update(g, 1 / 30); if (look) look(g, S, st); g.events.length = 0; }
    out.push(done(g, S, st));
  }
  return out;
}
const rate = (rows, f) => rows.filter(f).length / rows.length;
function check(name, rows, rules) { // rules: [label, predicate, minimum rate]
  const got = rules.map(([lbl, f, min]) => [lbl, rate(rows, f), min]);
  if (PRINT) console.log(`${name} (${rows.length} matches): ${got.map(([l, r]) => `${l} ${Math.round(r * 100)}%`).join(', ')}`);
  for (const [lbl, r, min] of got) assert.ok(r >= min, `${name}: ${lbl} in ${Math.round(r * 100)}% of matches (needs ≥ ${Math.round(min * 100)}%)`);
}
const cdOk = (g, S, st) => { // the shared cooldown: no side casts again before the last ability's cooldown is over
  for (const e of g.events) if (e.type === 'ability') {
    const p = (st.last || (st.last = [null, null]))[e.side];
    if (p && g.t - p.t < S.ABIL[p.k].cd - 1e-6) st.cdBad = true;
    st.last[e.side] = { t: g.t, k: e.k };
  }
};

test('Bloomhost AI (Turtle) uses all three of its abilities, under one shared cooldown (rates over N matches)', () => {
  const rows = playN(N, 100, { persona: 'turtle', autoPersona: 'turtle', factions: ['lastfist', 'bloomhost'] }, 1200, cdOk,
    (g, S, st) => ({ ab: g.sides[1].aiLog.abil || {}, cdOk: !st.cdBad }));
  check('Bloomhost abilities', rows, [['the shared cooldown kept', r => r.cdOk, 1], ['Frenzy Bloom', r => r.ab.frenzy > 0, 0.5], // measured over 20 (v2.38): 85%
    ['Corrosive Bloom', r => r.ab.corrosive > 0, 0.45], ['Emergency Brood', r => r.ab.brood > 0, 0.25], // 90%, 55%
    ['never a Last Fist ability', r => !r.ab.shield && !r.ab.strike && !r.ab.repair, 1]]);
});

test('Bloomhost AI (Turtle vs a Last Fist Aggressor): economy, Maws, all three base units, nodes and attacks (rates over N matches)', () => {
  const B = ['refinery', 'reactor', 'habitat', 'barracks', 'factory', 'techlab', 'turret'];
  const rows = playN(N, 200, { persona: 'turtle', autoPersona: 'aggressor', factions: ['lastfist', 'bloomhost'] }, 1200,
    (g, S, st) => { st.b = st.b || new Set(); for (const e of g.ents) if (e.side === 1 && e.kind === 'b') st.b.add(e.type); },
    (g, S, st) => ({ built: st.b, tr: g.sides[1].aiLog.trained, node: g.log.tot[1].nodeCap > 0, att: g.sides[1].aiLog.attacks > 0, ended: g.over }));
  check('Bloomhost base AI', rows, [['its whole base (7 roles)', r => B.every(k => r.built.has(k)), 0.2], ['a Maw', r => r.built.has('turret'), 0.7], // 40%, 100%
    ['Skitterlings', r => r.tr.skitterling > 0, 1], ['Bulwarks', r => r.tr.bulwark > 0, 0.7], ['Razorwings', r => r.tr.razorwing > 0, 0.15], // 100%, 100%, 35% (the Turtle builds its Bloomspire last)
    ['a node captured', r => r.node, 0.5], ['an attack', r => r.att, 0.8]]); // 80%, 100%
});

test('Bloomhost AI (Economist): the Bloomspire path through its taste, Brood Tyrants and Worldrenders (rates over N matches)', () => {
  // v2.39: against an Axiarch Turtle (was a Last Fist Turtle). After the balance pass the Bloomhost Economist beats the Last
  // Fist Turtle in about 9 minutes (10 of 10 on these seeds), before any Worldrender; against the Axiarch Turtle the matches
  // run about 16 minutes: path 100%, Apex 100%, Brood Tyrants 100%, a Worldrender 80% (seeds 300-309)
  const rows = playN(N, 300, { persona: 'economist', autoPersona: 'turtle', factions: ['axiarchs', 'bloomhost'] }, 1200,
    (g, S, st) => { for (const e of g.ents) if (e.side === 1 && e.type === 'techlab' && e.path) st.path = e.path; },
    (g, S, st) => ({ path: st.path || null, tr: g.sides[1].aiLog.trained }));
  const pathed = rows.filter(r => r.path);
  check('Bloomspire', rows, [['a Bloomspire path taken', r => !!r.path, 0.7], ['Brood Tyrants', r => r.tr.broodtyrant > 0, 0.6], ['a Worldrender', r => r.tr.worldrender > 0, 0.2]]); // 100%, 100%, 45% (v2.37's AI: about 2%)
  if (pathed.length) check('Bloomspire (when pathed)', pathed, [['Apex Bloom (the Economist\'s Air Power taste)', r => r.path === 'B', 0.8]]); // 100%
});

test('Axiarch AI with each personality: economy, base units, nodes and attacks; a Null Lance in some matches (rates over N matches)', () => {
  const P = ['aggressor', 'economist', 'trickster', 'turtle'], per = Math.max(2, Math.ceil(N / 4)), rows = [];
  P.forEach((persona, k) => rows.push(...playN(per, 400 + 50 * k, { persona: 'turtle', autoPersona: persona, factions: ['axiarchs', 'lastfist'] }, 600,
    (g, S, st) => { for (const e of g.events) if (e.type === 'node' && e.side === 0 && !e.lost) st.nodes = (st.nodes || 0) + 1; },
    (g, S, st) => ({ persona, T: g.log.tot[0], tr: g.sides[0].aiLog.trained, nodes: st.nodes || 0, att: g.sides[0].aiLog.attacks, U: S.UDEF }))));
  check('Axiarch AI', rows, [['economy and production', r => r.T.bBuilt.refinery > 0 && r.T.bBuilt.barracks > 0, 1], ['Shardlings and more', r => r.tr.shardling > 0 && Object.keys(r.tr).length >= 2, 0.9],
    ['only its own units', r => !Object.keys(r.tr).some(t => r.U[t].fac !== 'axiarchs'), 1], ['nodes taken', r => r.nodes > 0, 0.7], ['an attack', r => r.att > 0, 0.8], // 95%, 100%
    ['a Null Lance', r => (r.T.bBuilt.turret || 0) > 0, 0.1]]); // 25%
  for (const p of P) assert.ok(rows.filter(r => r.persona === p).every(r => r.tr.shardling > 0), `${p}: trains Shardlings`);
});

test('Last Fist AI uses its abilities with every personality, under one shared cooldown; the Aggressor strikes defences (rates over N matches)', () => {
  const P = ['aggressor', 'turtle', 'economist', 'trickster'], per = Math.max(2, Math.ceil(N / 4)), rows = [];
  P.forEach((persona, k) => rows.push(...playN(per, 500 + 50 * k, { persona, autoPersona: 'turtle' }, 900, (g, S, st) => { cdOk(g, S, st); if (g.sides[1].res.c < -1e-6 || g.sides[1].res.e < -1e-6) st.neg = true; },
    (g, S, st) => ({ persona, ab: g.sides[1].aiLog.abil || {}, cdOk: !st.cdBad, paid: !st.neg }))));
  check('Last Fist abilities', rows, [['the shared cooldown kept', r => r.cdOk, 1], ['resources never negative (the AI pays)', r => r.paid, 1], ['abilities used', r => (r.ab.shield || 0) + (r.ab.strike || 0) + (r.ab.repair || 0) > 0, 0.8]]); // 100%
  for (const p of P) assert.ok(rows.some(r => r.persona === p && (r.ab.shield || 0) + (r.ab.strike || 0) + (r.ab.repair || 0) > 0), `${p} used abilities in at least one match`);
  assert.ok(rows.filter(r => r.persona === 'aggressor').some(r => r.ab.strikeDef > 0) || PRINT, 'the Aggressor strikes defences in at least one match');
});

test('Easy never uses the Orbital Strike (3 seeded matches)', () => {
  const rows = playN(3, 600, { autoDiff: 'easy' }, 900, null, g => ({ strike: (g.sides[1].aiLog.abil || {}).strike || 0 }));
  for (const r of rows) assert.strictEqual(r.strike, 0);
});
