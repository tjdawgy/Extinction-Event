/* ---------- Faction rework, batch 5c (v2.90): the Needlewing AI fix ----------
   REWORK.b5c, stored per game in g.rw like the earlier batches (rwB5c). Off: everything plays exactly as in v2.89 and nothing below
   runs or is saved (every field here is set only by this code). Batch 5c's art (src/render/units-rework-5c.js) and the Medevac
   rename are not behind it.
   The problem (batch 5b self-play): the Bloomhost AI's Bloomspire picks its T2 path before it has seen any enemy aircraft, so it
   took Apex Bloom almost every time and never trained Needlewings against aircraft. On (the new-game default), a Normal or Hard
   Bloomhost AI's first Bloomspire pick is one roll from the match's seeded stream, kept for the match (side.pRoll.techlab, as batch
   4a's roll):
   - enemy air expected → Swarm Bloom (Needlewings) AI5C.lean of the time, Apex Bloom otherwise;
   - else → batch 4a's persona split: the persona's path PATHROLL.keep of the time, the other path otherwise.
   Enemy air is expected when batch 5b's own signal for the Bloomspire says so (aiAirSignal5b: aircraft it knows of, or an enemy air
   production building seen at T2), or it has seen an enemy aircraft at any time this match (side.air5c, kept after the intel
   fades), or it has seen any enemy air production building (every faction's third production building builds aircraft, so this is
   also the enemy's air tech), or the enemy is Last Fist (the air-superiority faction). The roll replaces batch 5b's Bloomspire rule
   (which always took Swarm Bloom once it knew of aircraft); 5b's Larva Pit rule (Acidic Evolution for Spitters), its scores and the
   second-copy rule are unchanged. Easy keeps its persona's taste, as in batch 4a. */
const rwB5c = g => !!(g && g.rw && g.rw.b5c);
const AI5C = { lean: 0.75 };
const rw5cCount = (g, s, k) => { const side = g.sides[s]; if (!side) return; const c = side.sw5c || (side.sw5c = {}); c[k] = (c[k] || 0) + 1; }; // per-side counters (self-play; saved with the side)
// Each AI decision: remember that an enemy aircraft has been seen (intel fades after INTEL_TTL; this doesn't)
function aiNote5c(g, s, theirs) {
  const side = g.sides[s];
  if (!side.air5c && facOf(side.faction) === 'bloomhost' && theirs.some(m => { const d = UDEF[m.type]; return d && d.air && d.weapon; })) side.air5c = 1;
}
function aiAirExpected5c(g, s, theirs) {
  const side = g.sides[s], foe = g.sides[1 - s];
  return !!(aiAirSignal5b(g, s, 'techlab', theirs) || side.air5c || aiAirGhost5b(g, s, 1) || (foe && facOf(foe.faction) === 'lastfist'));
}
// The Bloomspire's path in Last Fist terms (as aiPickPath decides; AI_PATH_MAP: Last Fist 'B' is Swarm Bloom, 'A' Apex Bloom)
function aiBloomRoll5c(g, s, def, theirs) {
  const side = g.sides[s], R = side.pRoll || (side.pRoll = {});
  if (!R.techlab) {
    const exp = aiAirExpected5c(g, s, theirs), pSwarm = exp ? AI5C.lean : def === 'B' ? PATHROLL.keep : 1 - PATHROLL.keep;
    R.techlab = simRnd() < pSwarm ? 'B' : 'A';
    rw5cCount(g, s, R.techlab === 'B' ? 'swarm' : 'apex'); if (exp) rw5cCount(g, s, 'airExp');
  }
  return R.techlab;
}
const aiBloom5c = (g, s, b) => rwB5c(g) && b.type === 'techlab' && facOf(g.sides[s].faction) === 'bloomhost';
