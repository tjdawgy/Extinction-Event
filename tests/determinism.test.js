// The SIM must not change by accident: the same seeded AI-vs-AI match must end in exactly the same state,
// particles and screen shake included. When a rules change is intended, re-record the fingerprint
// (node tests/determinism.test.js --print) and say so in the commit. Recorded at v2.13 (upgrade trees: Barracks paths, Mass Deployment pairs in 1.5× time, Drilled Riflemen, the AI's path choice).
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');

const FINGERPRINT = '7c3601002a7dc7c5314a7e4e19b878113422b5593d3380c4d4e7e54d3c201d2e';

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
