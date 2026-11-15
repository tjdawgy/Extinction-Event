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
  const sim = loadSim({ random: mulberry(2024) }); sim.REWORK.b2a = !!rw; sim.REWORK.b2b = rw === 'b' || rw === 'c'; sim.REWORK.b3a = rw === 'c' || rw === 'd'; sim.REWORK.b3b = rw === 'd'; /* v2.85: batch 3b with rw 'd' (3a too) */ /* v2.83: batch 2b only with rw 'b' (v2.84: batch 3a with rw 'c', 2b too) */ /* v2.82: the pinned replays play with faction rework batch 2a off (rw: on) */ sim.RNG.legacy = true; sim.setBreak(false); /* v2.69: the pinned replays play v2.68's rules */ sim.AUTO_STANCE.retreat = false; /* v2.55: and side 0 on Hold */ /* v2.50: the pinned replays draw every random number from Math.random, as before the seeded streams */ sim.setMech7c(false); /* v2.43: the pinned replays play the v2.42 mechanics (MECH7C off) */ sim.setRedesign(!!redesign); sim.setBalance(!!balance); if (balance) sim.setBalance7b(false); // v2.42: FP_V239_BA pins the v2.39-v2.41 numbers (the phase 7b layer off) // v2.37: the unit redesign off unless asked for (the pinned replays are v2.36's); v2.39: the balance pass too
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
  const sim = loadSim({ random: mulberry(2024) }); sim.REWORK.b2a = !!rw; sim.REWORK.b2b = rw === 'b' || rw === 'c'; sim.REWORK.b3a = rw === 'c' || rw === 'd'; sim.REWORK.b3b = rw === 'd'; /* v2.85: batch 3b with rw 'd' (3a too) */ /* v2.83: batch 2b only with rw 'b' (v2.84: batch 3a with rw 'c', 2b too) */ sim.RNG.legacy = true; sim.setBreak(false); sim.AUTO_STANCE.retreat = false; /* v2.55: and side 0 on Hold */ /* v2.50: the pinned replays draw every random number from Math.random, as before the seeded streams */ sim.setMech7c(false); /* v2.43: the pinned replays play the v2.42 mechanics (MECH7C off) */ sim.setRedesign(false); sim.setBalance(false); sim.RETREAT.fire = true; sim.FLAME.aim = false; // v2.35: the v2.34 retreat rule; v2.36: the v2.35 Flame Tank; v2.39: no balance pass
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
  const sim = loadSim({ random: mulberry(2024) }); sim.REWORK.b2a = !!rw; sim.REWORK.b2b = rw === 'b' || rw === 'c'; sim.REWORK.b3a = rw === 'c' || rw === 'd'; sim.REWORK.b3b = rw === 'd'; /* v2.85: batch 3b with rw 'd' (3a too) */ /* v2.83: batch 2b only with rw 'b' (v2.84: batch 3a with rw 'c', 2b too) */ sim.RNG.legacy = true; sim.setBreak(false); sim.AUTO_STANCE.retreat = false; /* v2.55: and side 0 on Hold */ /* v2.50: the pinned replays draw every random number from Math.random, as before the seeded streams */ sim.setMech7c(false); /* v2.43: the pinned replays play the v2.42 mechanics (MECH7C off) */ sim.setRedesign(redesign); sim.setBalance(!!balance); if (balance) sim.setBalance7b(false); // v2.42: the v2.39-v2.41 numbers
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
// v2.83: the AI's marker dodge of v2.82 is gone (it made the Artillery useless), so batch 2a on plays differently from
// v2.82: re-recorded as FP_V283 (b2a on, b2b off). With batch 2b on too (the new default: Titan cover and breaching,
// Ruinmaw tunnels, Worldbreaker cracks and ridges): FP_V283B. Every replay above runs with both off and is unchanged.
const FP_V283 = '22cf5bcdf609b0f4e77dac970989c375cf19baca93af27bed98fe8d6a2297892', FP_V283_BA = '43d5a8461d95cfae60883e0c70256849d0dceed83b622dc5be2482c9d63ca8b8', LF_BH_V283 = '08bf6c324e97234d18a1c8d604a4d8fcb42673bcbfbe4c71b7db43891172813c'; // recorded at v2.83 (batch 2a on, batch 2b off)
const FP_V283B = 'eaa1137a673ff7b4b71828a8a7c4b54175dcf7c6a50310bab4ce4a0001c44e14', FP_V283B_BA = 'ae1cd6a08c10ae90f4c67dfe2aeffbf45ca897a90b233a5feadcc3622b1c9a49', LF_BH_V283B = 'faa875f2e1ef498312fac1b81f0797dbcdba7c17940dd696970ab5c2f5628f31'; // recorded at v2.83 (both on)
test('v2.83: with rework batch 2a on (no marker dodge), the same matches match their recorded fingerprints', () => {
  assert.strictEqual(fingerprint(false, false, true, true, true), FP_V283);
  assert.strictEqual(bhAx(true, true, true), FP_V283_BA);
  assert.strictEqual(lfBh(true), LF_BH_V283);
});
test('v2.83: with rework batches 2a and 2b on, the same matches match their recorded fingerprints', () => {
  assert.strictEqual(fingerprint(false, false, true, true, 'b'), FP_V283B);
  assert.strictEqual(bhAx(true, true, 'b'), FP_V283B_BA);
  assert.strictEqual(lfBh('b'), LF_BH_V283B);
});
// v2.84 (faction rework batch 3a: Leaper latching, Riftstalker chains, Parallax swaps, Ravager devouring): every replay above
// runs with REWORK.b3a false and is unchanged (a b3a-off save leaves the key out, so it is byte for byte a v2.83 save).
// With 2a, 2b and 3a on (the new default) the same three matches are recorded here.
const FP_V284C = 'cc13bbcfef792152775365562ca2af369084bef55f17bbd8601207b49d569ab4', FP_V284C_BA = 'a907387431a8297bcaf0220c07aba90f427fb047562ea7a0ce8b1ee9614bbd09', LF_BH_V284C = '9e780b00d9cdd2855d1d98149462a9188c896fc9a009a394e046368cc23d4a96'; // recorded at v2.84 (batches 2a, 2b and 3a on)
test('v2.84: with rework batches 2a, 2b and 3a on, the same matches match their recorded fingerprints', () => {
  assert.strictEqual(fingerprint(false, false, true, true, 'c'), FP_V284C);
  assert.strictEqual(bhAx(true, true, 'c'), FP_V284C_BA);
  assert.strictEqual(lfBh('c'), LF_BH_V284C);
});
// v2.85 (faction rework batch 3b: Dreadthorn charges, Bastion barriers, Shardling parries, Bulwark creep regeneration; and Part 0,
// the batch 3a Riftstalker no longer fading back after a strike): every replay above runs with REWORK.b3b false and is
// unchanged (a b3b-off save leaves the key out). The v2.84 matches with 3a on (FP_V284C) are unchanged by Part 0: no
// Riftstalker strikes in them (tests/rework-3b.test.js pins a seeded skirmish that has them). With 2a, 2b, 3a and 3b on (the
// new default) the same three matches are recorded here.
const FP_V285D = '9d82f4a0ebde01715099255f2f7e094b08f10b6af606687558ea0ed70135cc2c', FP_V285D_BA = 'e3d714aad27221b738775a0fdb34ba6a2fcd2b3b34240789f954025528491c65', LF_BH_V285D = '4f259e5c7cb3bd4bbe28894e193f5a3838ddf262e44616886d191002e0dc16be'; // recorded at v2.85 (batches 2a, 2b, 3a and 3b on)
test('v2.85: with rework batches 2a, 2b, 3a and 3b on, the same matches match their recorded fingerprints', () => {
  assert.strictEqual(fingerprint(false, false, true, true, 'd'), FP_V285D);
  assert.strictEqual(bhAx(true, true, 'd'), FP_V285D_BA);
  assert.strictEqual(lfBh('d'), LF_BH_V285D);
});
if (require.main === module && process.argv[2] === '--print3b') console.log(fingerprint(false, false, true, true, 'd'), bhAx(true, true, 'd'), lfBh('d'));
if (require.main === module && process.argv[2] === '--print3a') console.log(fingerprint(false, false, true, true, 'c'), bhAx(true, true, 'c'), lfBh('c'));
if (require.main === module && process.argv[2] === '--print2a') console.log(fingerprint(false, false, true, true, true), bhAx(true, true, true), lfBh(true));
if (require.main === module && process.argv[2] === '--print2b') console.log(fingerprint(false, false, true, true, 'b'), bhAx(true, true, 'b'), lfBh('b'));
if (require.main === module && process.argv[2] === '--print') console.log(fingerprint(false, false, true), bhAx(true), fingerprint(false, false, true, true), bhAx(true, true));
