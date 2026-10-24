// The SIM must not change by accident: the same seeded AI-vs-AI match must end in exactly the same state,
// particles and screen shake included. When a rules change is intended, re-record the fingerprint
// (node tests/determinism.test.js --print) and say so in the commit. Recorded at v2.18 (new state fields only: creep, a unit's combat timestamps, the fog's remembered creep; Last Fist play itself matched v2.17 move for move).
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');

const FINGERPRINT = '0b3fb26af183661e7184aa37c1a30154ffd23c321a9a07bf8ae3f3f88ffa4036';

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function fingerprint() {
  const sim = loadSim({ random: mulberry(2024) });
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'trickster', autoPersona: 'turtle' });
  for (let i = 0; i < 30 * 480 && !g.over; i++) sim.update(g, 1 / 30);
  const o = JSON.parse(sim.serialize(g, {})); delete o.log; // the match log (v2.9) is a record, not game state: left out so it can change freely
  const state = JSON.stringify(o) + JSON.stringify({ parts: g.parts, fx: g.fx, shake: g.shake, over: g.over, winner: g.winner });
  return crypto.createHash('sha256').update(state).digest('hex');
}

test('seeded AI-vs-AI match matches the recorded SIM fingerprint (rules change only on purpose)', () => {
  assert.strictEqual(fingerprint(), FINGERPRINT);
});

if (require.main === module && process.argv[2] === '--print') console.log(fingerprint());
