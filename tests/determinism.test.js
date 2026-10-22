// The SIM must stay exactly as it was at v2.2 while effects and sound are added (Step 5): the same seeded
// AI-vs-AI match must end in exactly the same state, particles and screen shake included. If a change to the
// rules is ever intended, re-record the fingerprint and say so in the commit.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');

const V22_FINGERPRINT = '7f66cd950f05f2252c2dc5cfc5958e8a5f7a3af0183e76f71e58b34d33700232';

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function fingerprint() {
  const sim = loadSim({ random: mulberry(2024) });
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'trickster', autoPersona: 'turtle' });
  for (let i = 0; i < 30 * 480 && !g.over; i++) sim.update(g, 1 / 30);
  const state = sim.serialize(g, {}) + JSON.stringify({ parts: g.parts, fx: g.fx, shake: g.shake, over: g.over, winner: g.winner });
  return crypto.createHash('sha256').update(state).digest('hex');
}

test('seeded AI-vs-AI match matches the v2.2 SIM exactly (effects and sound must not touch the rules)', () => {
  assert.strictEqual(fingerprint(), V22_FINGERPRINT);
});

if (require.main === module && process.argv[2] === '--print') console.log(fingerprint());
