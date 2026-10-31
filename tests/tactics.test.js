// AI tactics (v2.40, audit phase 6a; audit/ai-tactics-report.md). The v2.39 Default survives as the v239 preset, move for
// move; the tactics rules: fighting strength (aiPower), refusing a fight it would lose (engage), front-runners holding for the
// army (mass), the signature building after the economy (sig); presets with per-faction and per-difficulty settings. SIM only.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const sim = loadSim();
const step = (s, g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) s.update(g, 1 / 30); };

// Recorded on v2.39 with the Default preset (two seeded Default-vs-Default matches, 10 minutes each)
const V239_DEFAULT = ['bdd98b34e8ee1fb54b2be07e1d74d212a25aced384f70fe5f13f4280c7f0677e', 'fd656d4b01e824d087616772c3f723a1bdc6430cd1e286002ab266501d90ebfe'];
test('the v239 preset plays exactly as v2.39\'s Default did (the baseline the harness measures against)', () => {
  const got = [];
  for (const [f0, f1, p0, p1] of [['lastfist', 'bloomhost', 'aggressor', 'turtle'], ['axiarchs', 'lastfist', 'economist', 'trickster']]) {
    const s = loadSim({ random: mulberry(2024) });
    const g = s.newGame('hard', { autoPlayer: true, autoDiff: 'hard', ai: 'v239', autoAi: 'v239', persona: p1, autoPersona: p0, factions: [f0, f1] });
    for (let i = 0; i < 30 * 600 && !g.over; i++) s.update(g, 1 / 30); // to the end of the match or 10 minutes
    const o = JSON.parse(s.serialize(g, {})); delete o.log; for (const sd of o.sides) if (sd.persona) { delete sd.persona.preset; delete sd.persona.smart; delete sd.persona.dial; }
    got.push(crypto.createHash('sha256').update(JSON.stringify(o) + JSON.stringify({ parts: g.parts, fx: g.fx, over: g.over, winner: g.winner })).digest('hex'));
  }
  assert.deepStrictEqual(got, V239_DEFAULT);
});

test('presets: per-faction openings and dials (byFac), per-difficulty dials (byDiff); Hard games get the Hard preset unless one is given', () => {
  const s = loadSim({ random: mulberry(3) }), A = s.AI_PRESETS;
  const keep = { h: A.hard.byFac, d: A.default.byDiff };
  A.hard.byFac = { bloomhost: { kinds: ['turtle'], dials: { nodes: 3 }, fix: { mass: true } } };
  A.default.byDiff = { normal: { delay: 1.5 } };
  const P = s.rollPersona(undefined, 'hard', 'bloomhost', 'hard');
  assert.strictEqual(P.kind, 'turtle'); assert.strictEqual(P.dial.nodes, 3); assert.strictEqual(P.dial.fix.mass, true); assert.strictEqual(P.preset, 'hard');
  assert.strictEqual(s.rollPersona('economist', 'hard', 'bloomhost', 'hard').kind, 'economist', 'an explicit personality wins');
  assert.strictEqual(s.rollPersona(undefined, 'hard', 'lastfist', 'hard').dial.nodes, A.hard.dials.nodes, 'no entry for the faction: the preset\'s dials');
  assert.strictEqual(s.rollPersona(undefined, 'default', 'lastfist', 'normal').dial.delay, 1.5);
  assert.strictEqual(s.rollPersona(undefined, 'default', 'lastfist', 'hard').dial.delay, 1);
  const g = s.newGame('hard', { factions: ['lastfist', 'bloomhost'] }); assert.strictEqual(g.sides[1].persona.preset, 'hard');
  const n = s.newGame('normal', { factions: ['lastfist', 'bloomhost'] }); assert.strictEqual(n.sides[1].persona.preset, 'default');
  const x = s.newGame('hard', { factions: ['lastfist', 'bloomhost'], ai: 'legacy' }); assert.strictEqual(x.sides[1].persona.preset, 'legacy');
  A.hard.byFac = keep.h; A.default.byDiff = keep.d;
});

test('aiPower: damage per second × health, sightings weighted, support units ignored, known guns added', () => {
  const U = sim.UDEF, one = sim.aiPower([{ type: 'rifle' }]);
  assert.strictEqual(one, U.rifle.dmg / U.rifle.cd * U.rifle.hp);
  assert.strictEqual(sim.aiPower([{ type: 'rifle' }, { type: 'rifle' }]), 4 * one, 'twice the units: four times the strength (Lanchester)');
  assert.strictEqual(sim.aiPower([{ type: 'rifle', w: 0.5 }]), 0.25 * one);
  assert.strictEqual(sim.aiPower([{ type: 'rifle' }, { type: 'medic' }]), one);
  assert.strictEqual(sim.aiPower([{ type: 'shardling' }]), U.shardling.dmg / U.shardling.cd * (U.shardling.hp + U.shardling.shp));
  assert.ok(sim.aiPower([{ type: 'rifle' }], [{ dps: 20, hp: 1000 }]) > one);
});

test('engage: a Default AI does not attack into a known army its strength would lose to; with the rule off the value rule sends it', () => {
  const run = engage => {
    const s = loadSim({ random: mulberry(5) }), g = s.newGame('hard', { factions: ['lastfist', 'lastfist'], ai: 'default', persona: 'aggressor' }); g.countdown = 0;
    const side = g.sides[1]; side.persona.dial.fix.engage = engage; side.persona.dial.attackAt = 0; g.sides[0].aiT = 1e9; g.t = 400;
    // five Gunships: high value (1,875 by the value rule) but little fighting strength, against 15 Riflemen seen at the middle
    // node (750): the value rule sends it out, the strength estimate (about 0.9 of theirs) does not
    for (let i = 0; i < 5; i++) s.spawnUnit(g, 1, 'aircraft', 1150 + i * 6, 0);
    for (let i = 0; i < 15; i++) g.fog[1].intel[9000 + i] = { type: 'rifle', u: 860, t: g.t };
    for (let k = 0; k < 6; k++) { side.aiT = 0; s.aiUpdate(g, 1, 1 / 30); g.t += 1; }
    return side.stance === 'attack';
  };
  assert.strictEqual(run(true), false, 'engage on: stays home');
  assert.strictEqual(run(false), true, 'engage off: the value rule alone sends it out');
});

test('mass: a unit told to wait holds its ground and does not chase; it still fights what is in reach', () => {
  const s = loadSim({ random: mulberry(9) }), g = s.newGame('normal', { factions: ['bloomhost', 'lastfist'] }); g.countdown = 0;
  for (const sd of g.sides) sd.aiT = 1e9; for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); }
  s.setStance(g, 0, 'attack'); s.setStance(g, 1, 'hold');
  const sk = s.spawnUnit(g, 0, 'skitterling', 800, 0), foe = s.spawnUnit(g, 1, 'rifle', 900, 0); foe.holdU = 900; foe.holdV = 0; foe.cd = 1e6;
  sk.aiWait = 1e9; step(s, g, 2);
  assert.ok(Math.abs(sk.u - 800) < 2, `held (at ${sk.u.toFixed(0)})`);
  foe.u = sk.u + 10; foe.holdU = foe.u; const h0 = foe.hp; step(s, g, 2);
  assert.ok(foe.hp < h0, 'fights an enemy in reach');
});

test('sig: a Default AI builds its signature building only after the economy is up (not before AI_SIG_LATE); v239 builds it in the first minute', () => {
  const first = ai => {
    const s = loadSim({ random: mulberry(11) }), g = s.newGame('hard', { autoPlayer: true, autoDiff: 'hard', factions: ['lastfist', 'lastfist'], ai, autoAi: ai, persona: 'turtle', autoPersona: 'turtle' }); g.countdown = 0;
    let t = null; for (let i = 0; i < 30 * 480 && t === null && !g.over; i++) { s.update(g, 1 / 30); if (g.ents.some(e => e.kind === 'b' && e.side === 1 && (e.type === 'sigA' || e.type === 'sigB'))) t = g.t; }
    return t;
  };
  const d = first('default'), v = first('v239');
  assert.ok(v !== null && v < 90, `v239: by 1:30 (${v})`);
  assert.ok(d === null || d >= sim.AI_SIG_LATE, `default: not before ${sim.AI_SIG_LATE} s (${d})`);
});
