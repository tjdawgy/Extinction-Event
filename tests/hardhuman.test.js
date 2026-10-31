// Hard against human-style greedy play (v2.41, audit phase 7a; audit/hard-vs-human-report.md). The Default AI (Easy,
// Normal and every non-Hard game) plays exactly as in v2.40; the new rules (AI_TACTICS read, contest, counter, nowave,
// shield, power, fill, est) and the Boomer opening are Hard's. The Greedy bot (audit/sim/greedy.js) plays a full match.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// Recorded on v2.40: Default against Default on Normal, Easy and Hard (10 minutes each)
const V240_DEFAULT = ['a6dd32bf8bcaf1812d05d91004681f404249e769f8e593274578d6fdd0fc7cf7', '5b9d2603472e19208295832807e4ea5b180975f017e0e16d50e8b08b122384b4', '7a0af474a3f877b4f11f28c2f22536e55cb58eb8c881b8f2d48e691363287a17'];
test('the Default AI plays exactly as v2.40 on Normal, Easy and Hard (Easy and Normal unchanged)', () => {
  const got = [];
  for (const [d, f0, f1, p0, p1] of [['normal', 'lastfist', 'bloomhost', 'aggressor', 'turtle'], ['easy', 'axiarchs', 'lastfist', 'economist', 'trickster'], ['hard', 'bloomhost', 'axiarchs', 'economist', 'aggressor']]) {
    const s = loadSim({ random: mulberry(77) });
    const g = s.newGame(d, { autoPlayer: true, autoDiff: d, ai: 'default', autoAi: 'default', persona: p1, autoPersona: p0, factions: [f0, f1] });
    for (let i = 0; i < 30 * 600 && !g.over; i++) s.update(g, 1 / 30);
    const o = JSON.parse(s.serialize(g, {})); delete o.log; for (const sd of o.sides) if (sd.persona) { delete sd.persona.preset; delete sd.persona.smart; delete sd.persona.dial; }
    got.push(crypto.createHash('sha256').update(JSON.stringify(o) + JSON.stringify({ parts: g.parts, fx: g.fx, over: g.over, winner: g.winner })).digest('hex'));
  }
  assert.deepStrictEqual(got, V240_DEFAULT);
});

test('the Boomer opening: three economy buildings first; never rolled at random; the v2.41 rules are off in Default', () => {
  const s = loadSim({ random: mulberry(4) });
  assert.strictEqual(JSON.stringify(s.PERSONAS), JSON.stringify(['aggressor', 'turtle', 'economist', 'trickster']));
  assert.strictEqual(JSON.stringify(s.PERSONA_EXTRA), JSON.stringify(['boomer']));
  const P = s.rollPersona('boomer', 'hard', 'lastfist', 'hard');
  assert.strictEqual(P.kind, 'boomer'); assert.strictEqual(P.plan.slice(0, 3).join(), 'refinery,refinery,refinery');
  for (let i = 0; i < 200; i++) assert.notStrictEqual(s.rollPersona(undefined, 'default', 'lastfist', 'normal').kind, 'boomer');
  for (const k of ['read', 'punish', 'contest', 'counter', 'nowave', 'shield', 'power', 'fill', 'est']) assert.strictEqual(s.AI_PRESETS.default.fix[k], false, k);
});

test('the Hard preset: the Boomer opening and the kept rules for every faction', () => {
  const s = loadSim({ random: mulberry(6) });
  for (const f of ['lastfist', 'bloomhost', 'axiarchs']) {
    const g = s.newGame('hard', { factions: ['lastfist', f] }), P = g.sides[1].persona;
    assert.strictEqual(P.preset, 'hard'); assert.strictEqual(P.kind, 'boomer', f);
    for (const k of ['read', 'contest', 'counter', 'nowave', 'shield', 'power', 'fill', 'est']) assert.strictEqual(P.dial.fix[k], true, `${f} ${k}`);
    assert.strictEqual(P.dial.fix.punish, false, `${f} punish`);
  }
});

test('shield rule: no Emergency Shield on units that are not yet taking fire; with fire, it shields', () => {
  const s = loadSim({ random: mulberry(8) });
  const pick = (rule, hurt) => {
    const g = s.newGame('hard', { factions: ['lastfist', 'lastfist'] }); g.countdown = 0; g.t = 200;
    const side = g.sides[1]; side.persona.dial.fix.shield = rule;
    const mine = [], seen = [];
    for (let i = 0; i < 6; i++) { const u = s.spawnUnit(g, 1, 'tank', 900 + i * 5, 0); if (hurt) u.lastHurt = g.t - 0.5; mine.push(u); }
    for (let i = 0; i < 8; i++) seen.push(s.spawnUnit(g, 0, 'tank', 900 - 150 - i * 3, 0)); // a stronger force, in reach (Tank range 160)
    return s.aiShieldTarget(g, 1, 'aggressor', 2, seen, { mine, threat: false }, 'shield');
  };
  assert.ok(pick(false, false), 'rule off: shields as soon as enemies are near');
  assert.strictEqual(pick(true, false), null, 'rule on: nothing incoming yet, no shield');
  assert.ok(pick(true, true), 'rule on: units under fire get it');
});

test('est: the expected enemy army grows with time and with the Refineries it has seen', () => {
  const s = loadSim({ random: mulberry(10) });
  const run = refTier => {
    const g = s.newGame('hard', { factions: ['lastfist', 'lastfist'] }); g.countdown = 0;
    if (refTier) for (let i = 0; i < 3; i++) g.fog[1].ghosts[9000 + i] = { id: 9000 + i, type: 'refinery', fac: 'lastfist', side: 0, tier: refTier, u: 300, v: 0, half: 30 };
    const out = [];
    for (const t of [60, 120, 180, 240]) { g.t = t; out.push(s.aiEstimate(g, 1)); }
    return out;
  };
  const t1 = run(1), t2 = run(2);
  assert.strictEqual(t1[0], 0, 'no army expected before 2:00');
  assert.ok(t1[3] > t1[2] && t1[2] > 0, `grows (${t1.map(Math.round)})`);
  assert.ok(t2[3] > t1[3], 'more for Refineries seen at T2');
});

test('counter: an infantry flood sends the War Factory down the Assault path (Flame Tanks); without the rule it keeps its plan', () => {
  const s = loadSim({ random: mulberry(12) });
  const path = rule => {
    const g = s.newGame('hard', { factions: ['lastfist', 'lastfist'] }); g.countdown = 0;
    const P = g.sides[1].persona; P.dial.fix.counter = rule; P.paths = { barracks: 'A', factory: 'A', techlab: 'A' };
    const fac = Object.assign({}, g.sides[1].hq, { type: 'factory', id: -1 }); // a War Factory going to T2 (only its type and side matter)
    const theirs = Array.from({ length: 10 }, () => ({ type: 'rifle', u: 500, w: 1 }));
    return s.aiPickPath(g, 1, fac, P, theirs);
  };
  assert.strictEqual(path(false), 'A');
  assert.strictEqual(path(true), 'B');
});

test('the Greedy bot (audit harness) plays a full match against Hard: economy first, nodes taken, a result', () => {
  const { runMatch } = require('../audit/sim/match');
  const r = runMatch({ seed: 5, diff: 'hard', maxT: 1800, sides: [{ faction: 'lastfist', bot: 'greedy' }, { faction: 'lastfist', ai: 'hard', persona: 'random' }] });
  assert.ok(r.t < 1800 && r.winner >= 0, `ended (${r.t} s, winner ${r.winner})`);
  const s30 = r.samples.find(x => x.t >= 30), s120 = r.samples.find(x => x.t >= 120);
  assert.ok(s30.earned[0] > 200, 'its economy is running by 0:30');
  assert.ok(s120.nodes.filter(o => o === 0).length >= 1, 'holds field nodes by 2:00');
  assert.ok(r.sides[0].bot && r.sides[0].bot.attacks >= 0);
});
