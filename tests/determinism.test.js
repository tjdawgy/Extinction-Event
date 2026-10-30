// The SIM must not change by accident: the same seeded AI-vs-AI match must end in exactly the same state,
// particles and screen shake included. When a rules change is intended, re-record the fingerprint
// (node tests/determinism.test.js --print) and say so in the commit. Recorded at v2.30 with Salvage on (docs/LASTFIST.md: it
// changes Last Fist play on purpose). With SALVAGE.pct 0 the same match plays exactly as v2.29 did (V229_OFF, the state without
// the save version and the new salvage record); Bloomhost vs Last Fist matched v2.29 tick for tick too, to the end of the match.
// Re-recorded at v2.32 (signature buildings: the Last Fist AI builds its Salvage Yard or Fortification Depot). With SALVAGE.pct 0
// and SIG.on false the match still plays exactly as v2.29 (the side's Overdrive timer, new at v2.32, left out too). A fixed
// Bloomhost vs Axiarchs match must play exactly as at v2.31 (BH_AX_V231): batch 1 changes only Last Fist.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');

const FINGERPRINT = '2020ad9314f41da348f92769315e9f024b9e1de32ff18dce154a87846a3ed62a'; // v2.32
const BH_AX_V231 = '8ba13a6d8e58dfeceed2ddaec7cc9d68808a633563eda69f689a1d15f35725ff'; // recorded on v2.31 (ends 15:59, the Axiarchs win)
const V229_OFF = '856b576e7c8dfa7ee14e35e1bf1c6629c1705e40513c942a3eed7070700779b4'; // v2.29's state hash, the same way (v2.30, Salvage off)

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function fingerprint(salvageOff) {
  const sim = loadSim({ random: mulberry(2024) });
  if (salvageOff) { sim.SALVAGE.pct = 0; sim.SIG.on = false; }
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'trickster', autoPersona: 'turtle' });
  for (let i = 0; i < 30 * 480 && !g.over; i++) sim.update(g, 1 / 30);
  const o = JSON.parse(sim.serialize(g, {})); delete o.log; // the match log (v2.9) is a record, not game state: left out so it can change freely
  if (salvageOff) { delete o.v; for (const s of o.sides) { delete s.salv; delete s.od; } }
  const state = JSON.stringify(o) + JSON.stringify({ parts: g.parts, fx: g.fx, shake: g.shake, over: g.over, winner: g.winner });
  return crypto.createHash('sha256').update(state).digest('hex');
}

function bhAx() { // Bloomhost (autoplayer, Aggressor) vs Axiarchs (Turtle), Hard, to the end of the match
  const sim = loadSim({ random: mulberry(2024) });
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'turtle', autoPersona: 'aggressor', factions: ['bloomhost', 'axiarchs'] });
  for (let i = 0; i < 30 * 1700 && !g.over; i++) sim.update(g, 1 / 30);
  const o = JSON.parse(sim.serialize(g, {})); delete o.log; delete o.v; for (const s of o.sides) delete s.od; // the save version and the v2.32 Overdrive timer
  const state = JSON.stringify(o) + JSON.stringify({ parts: g.parts, fx: g.fx, shake: g.shake, over: g.over, winner: g.winner });
  return crypto.createHash('sha256').update(state).digest('hex');
}

test('a fixed Bloomhost vs Axiarchs match plays exactly as v2.31 did (signature buildings batch 1 changes only Last Fist)', () => {
  assert.strictEqual(bhAx(), BH_AX_V231);
});

test('seeded AI-vs-AI match matches the recorded SIM fingerprint (rules change only on purpose)', () => {
  assert.strictEqual(fingerprint(), FINGERPRINT);
});

test('with Salvage and signature buildings switched off (SALVAGE.pct 0, SIG.on false) the same match plays exactly as v2.29 did', () => {
  assert.strictEqual(fingerprint(true), V229_OFF);
});

if (require.main === module && process.argv[2] === '--print') console.log(fingerprint());
