/* ---------- Batch 6b, Part A (v2.92, docs/FACTION_REWORK.md "Batch 6b"): the side-bias fix ----------
   REWORK.b6side, stored per game in g.rw like the rework batches (rwB6side). Off: everything plays exactly as in v2.91 and
   nothing below runs or is saved. A bug fix: no unit, cost, AI strategy or balance value changes. The causes the batch 6b
   diagnosis found (audit/sim/mirror6b.js, audit/sim/sidebias6b.js; docs/FACTION_REWORK.md "Batch 6b" has the evidence),
   each fixed at its root:
   1. Update order. update() ran every unit and building in the order of the entity list, and damage lands at once, so whoever
      sits earlier in the list moves, aims and strikes first in every tick, and the other side always answers what has already
      happened; ties in target picks went to the earlier entry too. On: the entity list is put in a fresh seeded random order at
      the start of each tick (side6Order), drawn from the game's own order stream (g.os), so neither side, nor any spot in the
      list, goes first or wins a tie more often than another.
   4. Spacing (direct control: the player's side and the Test Range). The free-spot search for units stepping apart walked its
      rings the same way for both sides, so both drifted toward the east edge (toward the enemy for the west side, away from it
      for the east). On: each side walks them as its mirror image (ctlFree's dir).
   2. AI order and start. side 1's AI always decided before side 0's in a tick, and side 0's first decision came at 1 s, side
      1's at 1.5 s. On: both decide first at SIDE6.aiT0 and the order is a seeded coin each tick (side6Ai).
   3. AI dice. Both AIs drew their rolls (the personality and opening, the T2 path rolls, the decision timing) from the match's
      one stream, side 1 first, interleaved with everything else; so at a given seed the slot a faction plays from decided the
      dice it got (with seeds 7-11 every Turtle personality fell to side 0). On: each side's AI rolls from its own stream
      (g.ar[s]), seeded from the match seed and the side's faction, never its slot (side6Seed): a faction's AI gets the same
      dice whichever side it plays, and the AIs' rolls no longer depend on each other's or on the fight's. RNG.ai names the
      side whose AI is rolling (simRnd reads it); everything else stays on the match stream. */
const rwB6side = g => !!(g && g.rw && g.rw.b6side);
const SIDE6 = { aiT0: 1, ord: 0x51DE0B6, ai: 0x0A1D1CE5 };
function side6Seed(seed, k) { // a well-mixed 32-bit state from the match seed and a key (murmur3's finaliser)
  let h = (seed ^ Math.imul(k + 1, 0x9E3779B1)) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B); h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
  return (h ^ (h >>> 16)) | 0;
}
function side6Init(g) { // newGame, once the sides and their factions exist (before any AI rolls)
  const seed = g.seed >>> 0;
  g.os = side6Seed(seed ^ SIDE6.ord, 0);
  g.ar = [0, 1].map(s => side6Seed(seed ^ SIDE6.ai, FACTION_KEYS.indexOf(facOf(g.sides[s].faction)) + 1));
}
const side6Rnd = g => { g.os = g.os + 0x6D2B79F5 | 0; return m32(g.os); };
// The entity list in a seeded random order, in place, at the start of each tick: the update loop runs in this order and every
// other pass over the list this tick (the target lists and their ties, kills, splash, the AI's reads) sees it too
function side6Order(g) {
  const o = g.ents;
  for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(side6Rnd(g) * (i + 1)), t = o[i]; o[i] = o[j]; o[j] = t; }
}
function side6Ai1(g, s, dt) { RNG.ai = s; try { aiUpdate(g, s, dt); aiSpotter(g, s); } finally { RNG.ai = -1; } }
function side6Ai(g, dt) { // both AIs (side 0's only when it is AI-played), a seeded coin for which decides first
  const first = side6Rnd(g) < 0.5 ? 0 : 1;
  for (const s of [first, 1 - first]) if (s === 1 || g.auto) side6Ai1(g, s, dt);
}
function side6Persona(g, s, f) { RNG.ai = s; try { return f(); } finally { RNG.ai = -1; } } // a side's personality, rolled from its own stream

/* ---------- Batch 6b, Part B (v2.92): Artillery counterplay (REWORK.b6art) ----------
   Stored per game in g.rw (rwB6art). Off: v2.91's Artillery exactly; nothing below runs or is saved. Artillery stays Last Fist's
   only true long-range unit; the answer to it is getting close, so:
   - its efficiency comes down to about 300 damage per 100 spent in the Test Range (audit/sim/art6b.js): ART6's numbers, played
     through a per-game definition (RW6A_D, read by rwD), UDEF untouched. Its minimum range (110, a quarter of its 440 reach) was
     already there and is kept.
   - an AI's divers go for a deployed enemy Artillery first when one is within their reach (art6Pick): Leapers (the leap and
     the aim), Riftstalkers (the strike and the aim), Gorebores (what they burrow toward) and Dreadthorns (the charge). A
     player's units are untouched (they go where they are sent). */
const rwB6art = g => !!(g && g.rw && g.rw.b6art);
const ART6 = { dmg: 45, cd: 3.2 }; // v2.91: 60 per salvo (3 shells of 20), 3.2 s; measured in audit/sim/art6b.js
const RW6A_D = { artillery: () => Object.assign({}, UDEF.artillery, { dmg: ART6.dmg, cd: ART6.cd }) };
// Deployed: set up to fire (deploying or deployed; in a game without the deploy switch, standing still)
const art6Set = (g, e) => e.kind === 'u' && e.type === 'artillery' && e.hp > 0 && !e.gone && (rwDep(g) ? e.dep === 1 || e.dep === 2 : !e.moving);
const art6Ai = (g, u) => rwB6art(g) && !g.sides[u.side].direct;
// The nearest deployed enemy Artillery within R of (cu, cv) that ok accepts, for an AI's diver; null otherwise
function art6Pick(g, u, foes, cu, cv, R, ok) {
  if (!art6Ai(g, u)) return null;
  let best = null, bd = 1e9;
  for (const e of foes) {
    if (e.side === u.side || e.side === NEUTRAL || !art6Set(g, e) || !visibleTo(g, u.side, e) || (ok && !ok(e))) continue;
    const k = Math.hypot(e.u - cu, e.v - cv); if (k > R) continue;
    if (k < bd || (k === bd && e.id < best.id)) { bd = k; best = e; }
  }
  return best;
}
