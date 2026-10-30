// The SIM must not change by accident: the same seeded AI-vs-AI match must end in exactly the same state,
// particles and screen shake included. When a rules change is intended, re-record the fingerprint
// (node tests/determinism.test.js --print) and say so in the commit. Recorded at v2.30 with Salvage on (docs/LASTFIST.md: it
// changes Last Fist play on purpose). With SALVAGE.pct 0 the same match plays exactly as v2.29 did (V229_OFF, the state without
// the save version and the new salvage record); Bloomhost vs Last Fist matched v2.29 tick for tick too, to the end of the match.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');

const FINGERPRINT = '04205a44b94da4268c0144305117d0e50289c563760bc7dc768c14f7ba1db158';
const V229_OFF = '856b576e7c8dfa7ee14e35e1bf1c6629c1705e40513c942a3eed7070700779b4'; // v2.29's state hash, the same way (v2.30, Salvage off)

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function fingerprint(salvageOff) {
  const sim = loadSim({ random: mulberry(2024) });
  if (salvageOff) sim.SALVAGE.pct = 0;
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'trickster', autoPersona: 'turtle' });
  for (let i = 0; i < 30 * 480 && !g.over; i++) sim.update(g, 1 / 30);
  const o = JSON.parse(sim.serialize(g, {})); delete o.log; // the match log (v2.9) is a record, not game state: left out so it can change freely
  if (salvageOff) { delete o.v; for (const s of o.sides) delete s.salv; }
  const state = JSON.stringify(o) + JSON.stringify({ parts: g.parts, fx: g.fx, shake: g.shake, over: g.over, winner: g.winner });
  return crypto.createHash('sha256').update(state).digest('hex');
}

test('seeded AI-vs-AI match matches the recorded SIM fingerprint (rules change only on purpose)', () => {
  assert.strictEqual(fingerprint(), FINGERPRINT);
});

test('with Salvage switched off (SALVAGE.pct 0) the same match plays exactly as v2.29 did', () => {
  assert.strictEqual(fingerprint(true), V229_OFF);
});

if (require.main === module && process.argv[2] === '--print') console.log(fingerprint());
