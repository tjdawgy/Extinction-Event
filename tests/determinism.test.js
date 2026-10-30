// The SIM must not change by accident: the same seeded AI-vs-AI match must end in exactly the same state,
// particles and screen shake included. When a rules change is intended, re-record the fingerprint
// (node tests/determinism.test.js --print) and say so in the commit. Recorded at v2.30 with Salvage on (docs/LASTFIST.md: it
// changes Last Fist play on purpose). With SALVAGE.pct 0 the same match plays exactly as v2.29 did (V229_OFF, the state without
// the save version and the new salvage record); Bloomhost vs Last Fist matched v2.29 tick for tick too, to the end of the match.
// Re-recorded at v2.32 (signature buildings: the Last Fist AI builds its Salvage Yard or Fortification Depot). With SALVAGE.pct 0
// and SIG.on false the match still plays exactly as v2.29 (the side's Overdrive timer, new at v2.32, left out too).
// v2.34 (the Axiarchs' signature buildings) leaves Last Fist and Bloomhost alone: a fixed Last Fist vs Bloomhost match must play
// exactly as at v2.33, apart from the save version (LF_BH_V233). (v2.32 pinned Bloomhost vs Axiarchs to v2.31 and v2.33 pinned
// Last Fist vs Axiarchs to v2.32 the same way; each later batch changes its own faction on purpose.)
// v2.35 (audit): retreating units hold their fire. The two replays pinned to older versions run with RETREAT.fire true (the
// v2.34 rule), so they still prove nothing else changed; the main fingerprint plays the new rule (unchanged: in that match no
// retreating unit had a target in range).
// v2.36 (audit phase 2): the Flame Tank burns along its target's line (FLAME.aim). The old replays run with FLAME.aim false; the
// main fingerprint is re-recorded and, with FLAME.aim false, still matches v2.35 (FP_V235). The Axis beam changes only matches
// with an Axiarch side, which none of these are.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');

const FP_V237 = 'c067f11db9a0fa3d5ff21fda7d734ef0ad981e1fb037d901cc5fa366b300e9fb'; // v2.37 (audit phase 3b): a Bloomhost vs Axiarchs match with the unit redesign on (bh_ax(true); 8:44, Bloomhost wins). The Last Fist mirror below has no redesigned unit in its 8 minutes, so it hashes the same either way
const FINGERPRINT = '27e6859083378eec966f493c37ea4a9065532b70465c737bf62579b3e4021a9a'; // v2.36: the Flame Tank aims its strip at its target (FLAME.aim); with FLAME.aim false the match is v2.35's (FP_V235)
const FP_V235 = '4be0c9891986796cd10fa32ce44a5d76cf81a0ce0d42ca9e878d919deca11535'; // v2.34: only the save version changed (29 → 30); the match state is the same as v2.32's
const LF_BH_V233 = '014ce26817d31591d24561ac3daf04b1cdfe852fcac44485795c3e4043d6cbb6'; // recorded on v2.33 without the save version (ends 12:23, Last Fist wins)
const V229_OFF = '856b576e7c8dfa7ee14e35e1bf1c6629c1705e40513c942a3eed7070700779b4'; // v2.29's state hash, the same way (v2.30, Salvage off)

// v2.38 (audit phase 4): every replay here runs the Legacy AI preset (ai/autoAi 'legacy'), which must play exactly as
// v2.37's AI did. The preset's own settings (persona.preset, smart, dial) are configuration, not match state, so they are
// left out of the hash; everything the AI did is still in it.
const stripPreset = o => { for (const sd of o.sides) if (sd.persona) { delete sd.persona.preset; delete sd.persona.smart; delete sd.persona.dial; } };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function fingerprint(salvageOff, aimOff, redesign) {
  const sim = loadSim({ random: mulberry(2024) }); sim.setRedesign(!!redesign); // v2.37: the unit redesign off unless asked for (the pinned replays are v2.36's)
  if (salvageOff || aimOff) sim.FLAME.aim = false;
  if (salvageOff) { sim.SALVAGE.pct = 0; sim.SIG.on = false; sim.RETREAT.fire = true; }
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', ai: 'legacy', autoAi: 'legacy', persona: 'trickster', autoPersona: 'turtle' });
  for (let i = 0; i < 30 * 480 && !g.over; i++) sim.update(g, 1 / 30);
  const o = JSON.parse(sim.serialize(g, {})); delete o.log; stripPreset(o); // the match log (v2.9) is a record, not game state: left out so it can change freely
  if (salvageOff) { delete o.v; for (const s of o.sides) { delete s.salv; delete s.od; } }
  const state = JSON.stringify(o) + JSON.stringify({ parts: g.parts, fx: g.fx, shake: g.shake, over: g.over, winner: g.winner });
  return crypto.createHash('sha256').update(state).digest('hex');
}

function lfBh() { // Last Fist (autoplayer, Turtle) vs Bloomhost (Aggressor), Hard, to the end of the match
  const sim = loadSim({ random: mulberry(2024) }); sim.setRedesign(false); sim.RETREAT.fire = true; sim.FLAME.aim = false; // v2.35: the v2.34 retreat rule; v2.36: the v2.35 Flame Tank
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', ai: 'legacy', autoAi: 'legacy', persona: 'aggressor', autoPersona: 'turtle', factions: ['lastfist', 'bloomhost'] });
  for (let i = 0; i < 30 * 1700 && !g.over; i++) sim.update(g, 1 / 30);
  const o = JSON.parse(sim.serialize(g, {})); delete o.log; stripPreset(o); delete o.v; // the save version
  const state = JSON.stringify(o) + JSON.stringify({ parts: g.parts, fx: g.fx, shake: g.shake, over: g.over, winner: g.winner });
  return crypto.createHash('sha256').update(state).digest('hex');
}

test('a fixed Last Fist vs Bloomhost match plays exactly as v2.33 did, apart from the save version (batch 3 changes only the Axiarchs)', () => {
  assert.strictEqual(lfBh(), LF_BH_V233);
});

function bhAx(redesign) { // Bloomhost (Aggressor) vs Axiarchs (Economist autoplayer), Hard, to the end or 12 minutes
  const sim = loadSim({ random: mulberry(2024) }); sim.setRedesign(redesign);
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', ai: 'legacy', autoAi: 'legacy', persona: 'aggressor', autoPersona: 'economist', factions: ['bloomhost', 'axiarchs'] });
  for (let i = 0; i < 30 * 720 && !g.over; i++) sim.update(g, 1 / 30);
  const o = JSON.parse(sim.serialize(g, {})); delete o.log; stripPreset(o);
  return crypto.createHash('sha256').update(JSON.stringify(o) + JSON.stringify({ parts: g.parts, fx: g.fx, shake: g.shake, over: g.over, winner: g.winner })).digest('hex');
}

test('seeded AI-vs-AI match matches the recorded SIM fingerprint (rules change only on purpose)', () => {
  assert.strictEqual(fingerprint(false, false, true), FINGERPRINT); // no redesigned unit in this match
  assert.strictEqual(bhAx(true), FP_V237); // v2.37: the redesign at work (Skitterlings at half supply, corrosion)
});

test('with the unit redesign off (setRedesign(false)) the same match plays exactly as v2.36 did; the targeting index (v2.37) changes nothing', () => {
  assert.strictEqual(fingerprint(), FINGERPRINT);
});

test('with FLAME.aim false the same match plays exactly as v2.35 did (the Flame Tank fix is the only Last Fist change)', () => {
  assert.strictEqual(fingerprint(false, true), FP_V235);
});

test('with Salvage and signature buildings switched off (SALVAGE.pct 0, SIG.on false) the same match plays exactly as v2.29 did', () => {
  assert.strictEqual(fingerprint(true), V229_OFF);
});

if (require.main === module && process.argv[2] === '--print') console.log(fingerprint(false, false, true), bhAx(true));
