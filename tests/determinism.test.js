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
// v2.39 (audit phase 5): the balance pass (BALANCE, setBalance) is off in every pinned replay, so they still prove nothing
// else changed; FP_V239 and FP_V239_BA record the same two matches with it on.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');

const FP_V239 = '2309a628fd3e06dc9ad1ff9cc8cd979517f3f1ae57a89c1bade2b8c9d477dbe2', FP_V239_BA = 'f0a68f971f602872ddfa574ad31eea4ddfc261737cecb9920df74223ceb63c1e'; // v2.39 (audit phase 5): the same two matches with the balance pass on (setBalance(true), the game's state)
const FP_V237 = 'c067f11db9a0fa3d5ff21fda7d734ef0ad981e1fb037d901cc5fa366b300e9fb'; // v2.37 (audit phase 3b): a Bloomhost vs Axiarchs match with the unit redesign on (bh_ax(true); 8:44, Bloomhost wins). The Last Fist mirror below has no redesigned unit in its 8 minutes, so it hashes the same either way
const FINGERPRINT = '27e6859083378eec966f493c37ea4a9065532b70465c737bf62579b3e4021a9a'; // v2.36: the Flame Tank aims its strip at its target (FLAME.aim); with FLAME.aim false the match is v2.35's (FP_V235)
const FP_V235 = '4be0c9891986796cd10fa32ce44a5d76cf81a0ce0d42ca9e878d919deca11535'; // v2.34: only the save version changed (29 → 30); the match state is the same as v2.32's
const LF_BH_V233 = '014ce26817d31591d24561ac3daf04b1cdfe852fcac44485795c3e4043d6cbb6'; // recorded on v2.33 without the save version (ends 12:23, Last Fist wins)
const V229_OFF = '856b576e7c8dfa7ee14e35e1bf1c6629c1705e40513c942a3eed7070700779b4'; // v2.29's state hash, the same way (v2.30, Salvage off)

// v2.38 (audit phase 4): every replay here runs the Legacy AI preset (ai/autoAi 'legacy'), which must play exactly as
// v2.37's AI did. The preset's own settings (persona.preset, smart, dial) are configuration, not match state, so they are
// left out of the hash; everything the AI did is still in it.
const stripPreset = o => { for (const sd of o.sides) if (sd.persona) { delete sd.persona.preset; delete sd.persona.smart; delete sd.persona.dial; } saveV30(o); };
// v2.63: save v31 adds the map's id and version (o.map), which is a label, not play: the pinned fingerprints were taken on v30
const saveV30 = o => { delete o.map; if (o.v === 31) o.v = 30; };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function fingerprint(salvageOff, aimOff, redesign, balance, rw) {
  const sim = loadSim({ random: mulberry(2024) }); sim.REWORK.b2a = !!rw; /* v2.82: the pinned replays play with faction rework batch 2a off (rw: on) */ sim.RNG.legacy = true; sim.setBreak(false); /* v2.69: the pinned replays play v2.68's rules */ sim.AUTO_STANCE.retreat = false; /* v2.55: and side 0 on Hold */ /* v2.50: the pinned replays draw every random number from Math.random, as before the seeded streams */ sim.setMech7c(false); /* v2.43: the pinned replays play the v2.42 mechanics (MECH7C off) */ sim.setRedesign(!!redesign); sim.setBalance(!!balance); if (balance) sim.setBalance7b(false); // v2.42: FP_V239_BA pins the v2.39-v2.41 numbers (the phase 7b layer off) // v2.37: the unit redesign off unless asked for (the pinned replays are v2.36's); v2.39: the balance pass too
  if (salvageOff || aimOff) sim.FLAME.aim = false;
  if (salvageOff) { sim.SALVAGE.pct = 0; sim.SIG.on = false; sim.RETREAT.fire = true; }
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', ai: 'legacy', autoAi: 'legacy', persona: 'trickster', autoPersona: 'turtle' });
  for (let i = 0; i < 30 * 480 && !g.over; i++) sim.update(g, 1 / 30);
  const o = JSON.parse(sim.serialize(g, {})); delete o.log; delete o.stats; stripPreset(o); // the match log (v2.9) is a record, not game state: left out so it can change freely
  if (salvageOff) { delete o.v; for (const s of o.sides) { delete s.salv; delete s.od; } }
  const state = JSON.stringify(o) + JSON.stringify({ parts: g.parts, fx: g.fx, shake: g.shake, over: g.over, winner: g.winner });
  return crypto.createHash('sha256').update(state).digest('hex');
}

function lfBh(rw) { // Last Fist (autoplayer, Turtle) vs Bloomhost (Aggressor), Hard, to the end of the match
  const sim = loadSim({ random: mulberry(2024) }); sim.REWORK.b2a = !!rw; sim.RNG.legacy = true; sim.setBreak(false); sim.AUTO_STANCE.retreat = false; /* v2.55: and side 0 on Hold */ /* v2.50: the pinned replays draw every random number from Math.random, as before the seeded streams */ sim.setMech7c(false); /* v2.43: the pinned replays play the v2.42 mechanics (MECH7C off) */ sim.setRedesign(false); sim.setBalance(false); sim.RETREAT.fire = true; sim.FLAME.aim = false; // v2.35: the v2.34 retreat rule; v2.36: the v2.35 Flame Tank; v2.39: no balance pass
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', ai: 'legacy', autoAi: 'legacy', persona: 'aggressor', autoPersona: 'turtle', factions: ['lastfist', 'bloomhost'] });
  for (let i = 0; i < 30 * 1700 && !g.over; i++) sim.update(g, 1 / 30);
  const o = JSON.parse(sim.serialize(g, {})); delete o.log; delete o.stats; stripPreset(o); delete o.v; // the save version
  const state = JSON.stringify(o) + JSON.stringify({ parts: g.parts, fx: g.fx, shake: g.shake, over: g.over, winner: g.winner });
  return crypto.createHash('sha256').update(state).digest('hex');
}

test('a fixed Last Fist vs Bloomhost match plays exactly as v2.33 did, apart from the save version (batch 3 changes only the Axiarchs)', () => {
  assert.strictEqual(lfBh(), LF_BH_V233);
});

function bhAx(redesign, balance, rw) { // Bloomhost (Aggressor) vs Axiarchs (Economist autoplayer), Hard, to the end or 12 minutes
  const sim = loadSim({ random: mulberry(2024) }); sim.REWORK.b2a = !!rw; sim.RNG.legacy = true; sim.setBreak(false); sim.AUTO_STANCE.retreat = false; /* v2.55: and side 0 on Hold */ /* v2.50: the pinned replays draw every random number from Math.random, as before the seeded streams */ sim.setMech7c(false); /* v2.43: the pinned replays play the v2.42 mechanics (MECH7C off) */ sim.setRedesign(redesign); sim.setBalance(!!balance); if (balance) sim.setBalance7b(false); // v2.42: the v2.39-v2.41 numbers
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', ai: 'legacy', autoAi: 'legacy', persona: 'aggressor', autoPersona: 'economist', factions: ['bloomhost', 'axiarchs'] });
  for (let i = 0; i < 30 * 720 && !g.over; i++) sim.update(g, 1 / 30);
  const o = JSON.parse(sim.serialize(g, {})); delete o.log; delete o.stats; stripPreset(o);
  return crypto.createHash('sha256').update(JSON.stringify(o) + JSON.stringify({ parts: g.parts, fx: g.fx, shake: g.shake, over: g.over, winner: g.winner })).digest('hex');
}

test('seeded AI-vs-AI match matches the recorded SIM fingerprint (rules change only on purpose)', () => {
  assert.strictEqual(fingerprint(false, false, true), FINGERPRINT); // no redesigned unit in this match
  assert.strictEqual(bhAx(true), FP_V237); // v2.37: the redesign at work (Skitterlings at half supply, corrosion)
});

test('v2.39: with the balance pass on, the same two matches match their recorded fingerprints; with it off they are v2.38\'s (above)', () => {
  assert.strictEqual(fingerprint(false, false, true, true), FP_V239);
  assert.strictEqual(bhAx(true, true), FP_V239_BA);
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

// v2.50 (Phase 0 item 3): the seeded streams. Same seed, same match, tick for tick, whatever Math.random does; a different
// seed plays a different match; a save keeps the seed and where both streams stand.
function seededRun(seed, ticks, noise) {
  const sim = loadSim({ random: noise ? Math.random : mulberry(7) }); // noise: a real, unseeded Math.random
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', seed, factions: ['bloomhost', 'axiarchs'] });
  const hashes = [];
  for (let i = 1; i <= ticks && !g.over; i++) {
    sim.update(g, sim.TICK);
    if (i % 100 === 0) { const o = JSON.parse(sim.serialize(g, {})); delete o.log; delete o.stats; hashes.push(crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex')); }
  }
  return hashes;
}
test('v2.50: the same seed plays the same match (state hash every 100 ticks), even with an unseeded Math.random; a save keeps the streams', () => {
  const a = seededRun(4242, 6000, false), b = seededRun(4242, 6000, true);
  assert.strictEqual(a.length, 60);
  assert.deepStrictEqual(b, a);
  const c = seededRun(4243, 6000, false);
  assert.notDeepStrictEqual(c, a, 'another seed plays another match');
  // a save keeps the seed and both streams (a resumed match is not bit-exact: deserialize resets some AI timers, as before)
  const sim = loadSim(), g = sim.newGame('normal', { seed: 99 }); for (let i = 0; i < 600; i++) sim.update(g, sim.TICK);
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.deepStrictEqual([g2.seed, g2.rs, g2.fs], [g.seed, g.rs, g.fs]);
});

// v2.82 (faction rework batch 2a, docs/FACTION_REWORK.md): the pinned replays above all run with REWORK.b2a false and match
// their recorded fingerprints unchanged. With it on (the new default: Artillery deploy and telegraphed shells, Gorebore,
// Severance) the same three matches are recorded here.
const FP_V282 = 'ba3ab0d983949b1f873bf3601c4a1f205c952855cf77f920ad877e4edefc2fd8', FP_V282_BA = 'f84ea05fa336f1c402f99888934a39bf75c9f8093b27151c6346710ee9e1ba10', LF_BH_V282 = '1193d1447244f0ae5c9524f78709e7a18cd9b909c746f2657e32849cb73d44c2'; // recorded at v2.82 (each differs from its b2a-off replay above)
test('v2.82: with rework batch 2a on, the same matches match their recorded fingerprints', () => {
  assert.strictEqual(fingerprint(false, false, true, true, true), FP_V282);
  assert.strictEqual(bhAx(true, true, true), FP_V282_BA);
  assert.strictEqual(lfBh(true), LF_BH_V282);
});
if (require.main === module && process.argv[2] === '--print2a') console.log(fingerprint(false, false, true, true, true), bhAx(true, true, true), lfBh(true));
if (require.main === module && process.argv[2] === '--print') console.log(fingerprint(false, false, true), bhAx(true), fingerprint(false, false, true, true), bhAx(true, true));
