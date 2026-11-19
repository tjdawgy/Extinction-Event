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
  const sim = loadSim({ random: mulberry(2024) }); sim.REWORK.b2a = !!rw; sim.REWORK.b2b = rw === 'b' || rw === 'c' || rw === 'e' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b3a = rw === 'c' || rw === 'd' || rw === 'e' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b3b = rw === 'd' || rw === 'e' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b4a = rw === 'e' || rw === 'f' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b4b = rw === 'f' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b5b = (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b5c = rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l'); sim.REWORK.b6side = rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l'); sim.REWORK.b6art = rw === 'j' || rw === 'k' || rw === 'l'; sim.REWORK.b6hq = rw === 'k' || rw === 'l'; sim.REWORK.b6c = rw === 'l'; /* v2.93: batch 6c's HQ shield rule with rw 'k', its tuning too with 'l' */ /* v2.92: batch 6b's side fix with rw 'i' (every batch to 5c and b6side), the Artillery too with 'j' */ /* v2.90: batch 5c only with rw 'h' (every batch) */ /* v2.88: batch 5b with rw 'g' (every batch) */ /* v2.87: batch 4b with rw 'f' (every batch) */ /* v2.86: every batch through 4a with rw 'e' */ /* v2.85: batch 3b with rw 'd' (3a too) */ /* v2.83: batch 2b only with rw 'b' (v2.84: batch 3a with rw 'c', 2b too) */ /* v2.82: the pinned replays play with faction rework batch 2a off (rw: on) */ sim.RNG.legacy = true; sim.setBreak(false); /* v2.69: the pinned replays play v2.68's rules */ sim.AUTO_STANCE.retreat = false; /* v2.55: and side 0 on Hold */ /* v2.50: the pinned replays draw every random number from Math.random, as before the seeded streams */ sim.setMech7c(false); /* v2.43: the pinned replays play the v2.42 mechanics (MECH7C off) */ sim.setRedesign(!!redesign); sim.setBalance(!!balance); if (balance) sim.setBalance7b(false); // v2.42: FP_V239_BA pins the v2.39-v2.41 numbers (the phase 7b layer off) // v2.37: the unit redesign off unless asked for (the pinned replays are v2.36's); v2.39: the balance pass too
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
  const sim = loadSim({ random: mulberry(2024) }); sim.REWORK.b2a = !!rw; sim.REWORK.b2b = rw === 'b' || rw === 'c' || rw === 'e' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b3a = rw === 'c' || rw === 'd' || rw === 'e' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b3b = rw === 'd' || rw === 'e' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b4a = rw === 'e' || rw === 'f' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b4b = rw === 'f' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b5b = (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b5c = rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l'); sim.REWORK.b6side = rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l'); sim.REWORK.b6art = rw === 'j' || rw === 'k' || rw === 'l'; sim.REWORK.b6hq = rw === 'k' || rw === 'l'; sim.REWORK.b6c = rw === 'l'; /* v2.93: batch 6c's HQ shield rule with rw 'k', its tuning too with 'l' */ /* v2.92: batch 6b's side fix with rw 'i' (every batch to 5c and b6side), the Artillery too with 'j' */ /* v2.90: batch 5c only with rw 'h' (every batch) */ /* v2.88: batch 5b with rw 'g' (every batch) */ /* v2.87: batch 4b with rw 'f' (every batch) */ /* v2.86: every batch through 4a with rw 'e' */ /* v2.85: batch 3b with rw 'd' (3a too) */ /* v2.83: batch 2b only with rw 'b' (v2.84: batch 3a with rw 'c', 2b too) */ sim.RNG.legacy = true; sim.setBreak(false); sim.AUTO_STANCE.retreat = false; /* v2.55: and side 0 on Hold */ /* v2.50: the pinned replays draw every random number from Math.random, as before the seeded streams */ sim.setMech7c(false); /* v2.43: the pinned replays play the v2.42 mechanics (MECH7C off) */ sim.setRedesign(false); sim.setBalance(false); sim.RETREAT.fire = true; sim.FLAME.aim = false; // v2.35: the v2.34 retreat rule; v2.36: the v2.35 Flame Tank; v2.39: no balance pass
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
  const sim = loadSim({ random: mulberry(2024) }); sim.REWORK.b2a = !!rw; sim.REWORK.b2b = rw === 'b' || rw === 'c' || rw === 'e' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b3a = rw === 'c' || rw === 'd' || rw === 'e' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b3b = rw === 'd' || rw === 'e' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b4a = rw === 'e' || rw === 'f' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b4b = rw === 'f' || (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b5b = (rw === 'g' || rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l')); sim.REWORK.b5c = rw === 'h' || rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l'); sim.REWORK.b6side = rw === 'i' || (rw === 'j' || rw === 'k' || rw === 'l'); sim.REWORK.b6art = rw === 'j' || rw === 'k' || rw === 'l'; sim.REWORK.b6hq = rw === 'k' || rw === 'l'; sim.REWORK.b6c = rw === 'l'; /* v2.93: batch 6c's HQ shield rule with rw 'k', its tuning too with 'l' */ /* v2.92: batch 6b's side fix with rw 'i' (every batch to 5c and b6side), the Artillery too with 'j' */ /* v2.90: batch 5c only with rw 'h' (every batch) */ /* v2.88: batch 5b with rw 'g' (every batch) */ /* v2.87: batch 4b with rw 'f' (every batch) */ /* v2.86: every batch through 4a with rw 'e' */ /* v2.85: batch 3b with rw 'd' (3a too) */ /* v2.83: batch 2b only with rw 'b' (v2.84: batch 3a with rw 'c', 2b too) */ sim.RNG.legacy = true; sim.setBreak(false); sim.AUTO_STANCE.retreat = false; /* v2.55: and side 0 on Hold */ /* v2.50: the pinned replays draw every random number from Math.random, as before the seeded streams */ sim.setMech7c(false); /* v2.43: the pinned replays play the v2.42 mechanics (MECH7C off) */ sim.setRedesign(redesign); sim.setBalance(!!balance); if (balance) sim.setBalance7b(false); // v2.42: the v2.39-v2.41 numbers
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
// v2.86 (faction rework batch 4a: Sniper pins, Marksman marks, Bilecaster pools, Gunship salvos, Wraithwing hops; Part 0, the
// AI's T2 path rolled per match): every replay above runs with REWORK.b4a false and is unchanged (a b4a-off save leaves the
// key out). With every batch on (rw 'e': 2a, 2b, 3a, 3b and 4a) the same three matches are recorded here.
const FP_V286E = 'ee3b7377640a60c3ff980669bb5ef4adca88499ac98dd281ce0acc965606421e', FP_V286E_BA = '72c35c199743831dda4cf677cb5ab494c02b316feb86a6733ccff38750e9fc8d', LF_BH_V286E = 'f1aac705b788321d0a0a42daf42e952e37415ac7eb70cb10107a9ceecd981338'; // recorded at v2.86 (batches 2a, 2b, 3a, 3b and 4a on)
test('v2.86: with rework batches 2a, 2b, 3a, 3b and 4a on, the same matches match their recorded fingerprints', () => {
  assert.strictEqual(fingerprint(false, false, true, true, 'e'), FP_V286E);
  assert.strictEqual(bhAx(true, true, 'e'), FP_V286E_BA);
  assert.strictEqual(lfBh('e'), LF_BH_V286E);
});
// v2.87 (faction rework batch 4b: Leviathan bombing runs, Brood Tyrant pustules, Worldrender landing, Voidcarrier support, the
// Sovereign's judgement beam; and Part 0, anti-air specialists and building guns tracking a hopping batch 4a Wraithwing): every
// replay above runs with REWORK.b4b false and is unchanged (a b4b-off save leaves the key out). Part 0 belongs to b4a, and the
// v2.86 matches with 4a on (FP_V286E) are unchanged by it (no Wraithwing hops into anti-air in them; tests/rework-4a.test.js
// re-records the seeded skirmish that has them). With every batch on (rw 'f') the same three matches are recorded here.
const FP_V287F = '90b4b7e01f4eea53996943f770b3279e35e190df7e9aed5e1930df8d665f2eb6', FP_V287F_BA = '00e2c902c0b7cd7c032169b62ca2b2c70c222cdac27b83cb28a2525b884bddda', LF_BH_V287F = 'cf4cd972e39ec4e85c4c8d78cd9365fc3cc1fd7d71ca283fc2c08af6189fdcb1'; // recorded at v2.87 (batches 2a to 4b on)
test('v2.87: with every rework batch on (2a, 2b, 3a, 3b, 4a and 4b), the same matches match their recorded fingerprints', () => {
  assert.strictEqual(fingerprint(false, false, true, true, 'f'), FP_V287F);
  assert.strictEqual(bhAx(true, true, 'f'), FP_V287F_BA);
  assert.strictEqual(lfBh('f'), LF_BH_V287F);
});
if (require.main === module && process.argv[2] === '--print4b') console.log(fingerprint(false, false, true, true, 'f'), bhAx(true, true, 'f'), lfBh('f'));
if (require.main === module && process.argv[2] === '--print4a') console.log(fingerprint(false, false, true, true, 'e'), bhAx(true, true, 'e'), lfBh('e'));
if (require.main === module && process.argv[2] === '--print3b') console.log(fingerprint(false, false, true, true, 'd'), bhAx(true, true, 'd'), lfBh('d'));
if (require.main === module && process.argv[2] === '--print3a') console.log(fingerprint(false, false, true, true, 'c'), bhAx(true, true, 'c'), lfBh('c'));
if (require.main === module && process.argv[2] === '--print2a') console.log(fingerprint(false, false, true, true, true), bhAx(true, true, true), lfBh(true));
if (require.main === module && process.argv[2] === '--print2b') console.log(fingerprint(false, false, true, true, 'b'), bhAx(true, true, 'b'), lfBh('b'));
if (require.main === module && process.argv[2] === '--print') console.log(fingerprint(false, false, true), bhAx(true), fingerprint(false, false, true, true), bhAx(true, true));
// v2.88 (faction rework batch 5b, the Bloomhost swarm pass: broods, swarm surge, kill frenzy, Spitter quill volleys, Needlewings at
// aircraft): every replay above runs with REWORK.b5b false and is unchanged (a b5b-off save leaves the key out). With every batch on
// (rw 'g': 2a, 2b, 3a, 3b, 4a, 4b and 5b) the same three matches are recorded here.
const FP_V288G = '296ef1d1af2748dd7a55b89ecb019d62e53d5c647ac9cafb49951e080c8b3477', FP_V288G_BA = 'abf5ce49555a747f790b9a6c19fff20fefcacbf5ed057ccbea5202ed6ad82e52', LF_BH_V288G = '682930e764db5e5cf873205e72b947c6cf4ad1213e6e051022a16fb04cf8666d'; // recorded at v2.88 (every batch on)
test('v2.88: with every rework batch on (2a to 5b), the same matches match their recorded fingerprints', () => {
  assert.strictEqual(fingerprint(false, false, true, true, 'g'), FP_V288G);
  assert.strictEqual(bhAx(true, true, 'g'), FP_V288G_BA);
  assert.strictEqual(lfBh('g'), LF_BH_V288G);
});
if (require.main === module && process.argv[2] === '--print5b') console.log(fingerprint(false, false, true, true, 'g'), bhAx(true, true, 'g'), lfBh('g'));
// v2.90 (faction rework batch 5c, the Needlewing AI fix: the Bloomhost Bloomspire's roll): every replay above runs with REWORK.b5c
// false and is unchanged (a b5c-off save leaves the key out). With every batch on (rw 'h': 2a to 5b and 5c) the same three matches:
const FP_V290 = 'ec8ba02e5eddac43a352e770ca2e3b62fcf5e32ac41f79b3bf8995ef606aeeb6', FP_V290_BA = '6ced4518d135d2c087271b89d2dc4c213ace0549e3f92201dad258a9a2d138dc', LF_BH_V290 = '4d0f03354119299812479cc3712de4644839f2d981f0ab3707b0b2d9191906f2'; // recorded
test('v2.90: with every rework batch on (2a to 5c), the same matches match their recorded fingerprints', () => {
  assert.strictEqual(fingerprint(false, false, true, true, 'h'), FP_V290);
  assert.strictEqual(bhAx(true, true, 'h'), FP_V290_BA);
  assert.strictEqual(lfBh('h'), LF_BH_V290);
});
if (require.main === module && process.argv[2] === '--print5c') console.log(fingerprint(false, false, true, true, 'h'), bhAx(true, true, 'h'), lfBh('h'));
// v2.92 (batch 6b, Part A: the side-bias fix, REWORK.b6side): every replay above runs with b6side false and is unchanged (a
// b6side-off save leaves the key and its streams out). With every batch on and b6side on (rw 'i'; b6art off) the same three:
const FP_V292 = 'c4d5fa024d417334e969e2d2eae9ee0ee307f38f3e6278511272927358f8d7e3', FP_V292_BA = '4cb66ccab3eb639863f2e2458547e2b5b1970ce129f043a22aaa6a85af22c0a1', LF_BH_V292 = 'fdd220b8dff8d50fee1a4b5811b6f68b8113721ae196989657302389ccde229d'; // recorded at v2.92 (2a to 5c and b6side on, b6art off)
test('v2.92: with every rework batch on and the side-bias fix (b6side) on, b6art off, the same matches match their recorded fingerprints', () => {
  assert.strictEqual(fingerprint(false, false, true, true, 'i'), FP_V292);
  assert.strictEqual(bhAx(true, true, 'i'), FP_V292_BA);
  assert.strictEqual(lfBh('i'), LF_BH_V292);
});
if (require.main === module && process.argv[2] === '--print6b') console.log(fingerprint(false, false, true, true, 'i'), bhAx(true, true, 'i'), lfBh('i'));
// v2.92 (batch 6b, Part B: Artillery counterplay, REWORK.b6art): every replay above runs with b6art false. With every batch on, b6side
// and b6art on (rw 'j', the new-game default) the same three matches:
const FP_V292A = '7f1f4570ed8b70f374384cd0164207c8180c431b91dc72fdfadfacec14441ed4', FP_V292A_BA = '1f5a3f4d28386accd80140fe7712f921940440e8ec0e4af37ae2376556a7e8a4', LF_BH_V292A = '3b1dbc516c2d269e6bafde73163c3c0339e7cbabeb80eb00780e76bba05180c3'; // recorded at v2.92 (every switch on)
test('v2.92: with every rework batch on, the side-bias fix and the Artillery counterplay (b6side, b6art), the same matches match their recorded fingerprints', () => {
  assert.strictEqual(fingerprint(false, false, true, true, 'j'), FP_V292A);
  assert.strictEqual(bhAx(true, true, 'j'), FP_V292A_BA);
  assert.strictEqual(lfBh('j'), LF_BH_V292A);
});
if (require.main === module && process.argv[2] === '--print6bA') console.log(fingerprint(false, false, true, true, 'j'), bhAx(true, true, 'j'), lfBh('j'));
// v2.93 (batch 6c: the HQ shield rule REWORK.b6hq and the unit tuning REWORK.b6c). The pinned replays above play v2.68's
// base-breaking rules (setBreak(false)), under which the old and new shield rules agree; with b6hq and b6c off they are
// unchanged (rw 'j' sets both off). Two modern matches pin the new switches: Hard vs Hard with every rule of today (seeded
// streams, base-breaking on), Classic Last Fist vs Bloomhost and Two-Lane Axiarchs vs Last Fist, to the end. With b6hq and b6c
// off they play exactly as v2.92 (FP_V292M, recorded on v2.92's build); FP_V293H with b6hq on, b6c off; FP_V293 with both on.
function modern(rw) {
  const out = [];
  for (const [map, fac] of [['classic', ['lastfist', 'bloomhost']], ['twolane', ['axiarchs', 'lastfist']]]) {
    const sim = loadSim({ random: mulberry(2024) }); Object.assign(sim.REWORK, rw);
    const g = sim.newGame('hard', { seed: 7, map, autoPlayer: true, autoDiff: 'hard', factions: fac }); g.countdown = 0;
    for (let i = 0; i < 60 * 1700 && !g.over; i++) { sim.update(g, sim.TICK); g.events.length = 0; }
    const o = JSON.parse(sim.serialize(g, {})); delete o.log; delete o.stats; delete o.v; delete o.tc; // tc: team colours (never in a SIM-only game; never part of the state)
    out.push(crypto.createHash('sha256').update(JSON.stringify(o) + JSON.stringify({ over: g.over, winner: g.winner })).digest('hex'));
    sim.useMap('classic');
  }
  return out;
}
const FP_V292M = ['6a0a377251985b7370df356ed62745aef818e5a2ad702900d014e1f8cbad676f', 'ce6148f62bb896758eb144d0d78057b1ed271dd54936b1adfb74524fa3e875f1']; // recorded on v2.92's build (every switch of v2.92 on)
const FP_V293H = ['d9797f62612636b81cb84040f67e8e7ebfc56eee562c5ce430410b962344338c', '3bb7596c848c90ea4375fcf52a7be3df3075447aa5bc09b6742e9ff2bcfc4866']; // b6hq on, b6c off
const FP_V293 = ['befa62f5a80c0a846d48d2e8eb66e98817cb57019f58145389bc5d128501534f', 'a3bdd8829f759087e08b53cc166107d9ba33791bca824d250fcd8bc08e0d3db9']; // b6hq and b6c on (the new-game default)
test('v2.93: modern matches: b6hq and b6c off play as v2.92 (FP_V292M); b6hq on (FP_V293H); both on (FP_V293)', () => {
  assert.deepStrictEqual(modern({ b6hq: false, b6c: false }), FP_V292M);
  assert.deepStrictEqual(modern({ b6hq: true, b6c: false }), FP_V293H);
  assert.deepStrictEqual(modern({ b6hq: true, b6c: true }), FP_V293);
});
test('v2.93: the pinned replays with every batch through 6b on and b6hq on (rw \'k\') still match FP_V292A (v2.68 rules: the shield rules agree)', () => {
  assert.strictEqual(fingerprint(false, false, true, true, 'k'), FP_V292A);
});
if (require.main === module && process.argv[2] === '--print6c') console.log(JSON.stringify(modern({ b6hq: true, b6c: true })), fingerprint(false, false, true, true, 'l'), bhAx(true, true, 'l'), lfBh('l'));
