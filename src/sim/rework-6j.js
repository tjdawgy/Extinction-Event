/* ---------- Batch 6j (v3.00, docs/FACTION_REWORK.md "Batch 6j"): the playtest fixes, the AI fixes, the balance pass ----------
   Two switches, stored per game in g.rw, on by default, each with a Test Range switch. Both off: v2.99 exactly (nothing below
   runs, nothing new is saved). rwB6jfix and rwB6j are defined in src/sim/rework.js.
   - REWORK.b6jfix: the playtest fixes that change the SIM (Part A).
     A2. A Queen's Mites hatch in front of her (toward her target, else the way she faces), clear of her body (queenSpot6j); in
       the body pass a Mite of the same side always takes the whole push and never moves another unit's held spot (mitePush6j),
       so a birth never pushes her, never changes her order or target, and the player's selection is never touched.
     A3. The Purification Beam (see beam6j).
     A5. A Larva Pit sold with a brood queued refunds the brood's whole price (trySell; refund6j).
   - REWORK.b6j: the AI fixes (Part B) and the balance tuning (Part D); B6J holds every number. */
const B6J = {
  queen: { ahead: 6, spread: 9 }, // A2: Mites appear queen body + mite body + ahead in front of her, spread across
  siege: { reach: 20 },            // B1: a siege line is used only when 2+ Artillery there reach a known enemy building (art range - reach)
  turtle: ['lastfist'],            // B1: the factions whose Turtle grows a late air building (6i's turtle6i; Bloomhost has it since 6i)
  air: { at: 480, ref: 3, c: 0.6 }, // B2: from 8:00, with 3 built Refineries and 60% of the upgrade's credits, the air building's T2 and T3 first
  wyrm: { hp: 0.3 },               // B3: a Skywyrm joins a node assault from 30% health (6h's pool: 50%)
};
// A2: where a Queen's next Mite hatches: in front of her (her target, else her order's target, else her facing), clear of her body
function queenSpot6j(g, q) {
  const T = (q.tgt && ctlEnt(g, q.tgt)) || (q.po && q.po.o === 'target' && ctlEnt(g, q.po.id)) || null;
  let nx = q.face || 1, ny = 0;
  if (T && T.hp > 0) { const du = T.u - q.u, dv = (T.v - q.v) * DY, d = Math.hypot(du, dv); if (d > 1) { nx = du / d; ny = dv / d; } }
  const r = (BODY6H_R[bodyClass6h('queen')] || 10) + (BODY6H_R[bodyClass6h('mite')] || 7) + B6J.queen.ahead;
  const k = (q.qn || 0) % 3 - 1, side = k * B6J.queen.spread; // left, centre, right in turn
  const u = clamp(q.u + nx * r - ny * side, 0, L), v = q.v + (ny * r + nx * side) / DY;
  return NAV.on && navShut(u, v) ? { u: q.u, v: q.v } : { u, v };
}
// A2: in the body pass, a Mite against a unit of its own side takes the whole push itself (wa/wb), and pushes nobody aside
const mitePush6j = (g, A, B) => rwB6jfix(g) && A.side === B.side && (A.type === 'mite') !== (B.type === 'mite') ? (A.type === 'mite' ? 1 : 2) : 0;
// A3: what the player's aiming tap may reach (the UI's aimTap): Classic ±240 as before; with b6jfix on a deep map its whole depth.
// v2.99 clamped every map to ±240, so on Three-Lane a tap on the north or south lane (about ±400) landed off the lane: "needs a
// spot on the lane", the aim stuck, and the next taps fell through to the field (a forward pad). Emergency Brood had the old
// lane check (±LANE_V + 25, the middle of the map) on the lane maps too.
const aimV6j = g => rwB6jfix(g) && MAP_2D ? MAP.size.h / 2 : 240;
const brood6j = g => rwB6jfix(g) && MAP_LANED;

/* ---- Part B: the AI fixes (b6j) ---- */
// B1: the AI's "siege" attack stops the whole army just outside the enemy HQ gun's reach (siegeLine) so its siege guns can
// shell the base. v2.99 counted any two siege units (AI_SIEGE: Artillery and Titans) and never asked whether anything there
// could be reached: since the Titan's reach was cut (160) two Titans parked 555 from the HQ with nothing in reach, and since
// batch 6c's shield rule the HQ itself can't be hurt while another building stands. With b6j a siege needs 2+ Artillery-type
// guns (AI_ART) and a known enemy building (the fog's memory, not the HQ) within their reach of the line; otherwise 0 (the
// attack goes in).
function siegeN6j(g, s, mine, line, n0) {
  if (!rwB6j(g)) return n0;
  const art = mine.filter(u => AI_ART.includes(u.type) && rwHas(g, u.type)); if (art.length < 2) return 0;
  const R = Math.min(...art.map(u => rwD(g, u.type).range)) - B6J.siege.reach;
  const ok = Object.values(g.fog[s].ghosts).some(b => b.side !== s && b.type !== 'hq' && Math.abs(b.u - line) - (b.half || 0) <= R);
  return ok ? art.length : 0;
}
// B1: the Last Fist Turtle's plan (batch 6d) has no Tech Lab (no air at all: "air superiority" is Last Fist's), so with b6j it
// grows one late exactly as 6i's Bloomhost Turtle grows its Bloomspire (plan6i, turtle6i: from 8:00, every pad taken, 300 energy
// spare, no enemy near its HQ, its lowest Reactor sold for it).
const turtleFac6j = (g, s) => rwB6j(g) && B6J.turtle.includes(facOf(g.sides[s].faction));
// B2: tier-3 air. The AI upgrades in a fixed order (AI_UPG): the air building's T3 is 16th of 20, after every Refinery,
// Habitat and production building reaches T3, so with matches of about 14 minutes it rarely gets there. With b6j, from
// B6J.air.at, with its air building built, B6J.air.ref Refineries built and the credits for most of the step banked, the
// air building's T2 and T3 go first.
function air6j(g, s) {
  if (!rwB6j(g) || g.t < B6J.air.at) return [];
  const side = g.sides[s], T = alive(g, s, 'techlab').find(b => b.built && b.tier < 3 && !b.upgrading); if (!T) return [];
  if (alive(g, s, 'refinery').filter(b => b.built).length < B6J.air.ref) return [];
  const up = bdOf(T).up[T.tier + 1]; if (!up || side.res.c < up.c * B6J.air.c) return [];
  return [['techlab', 2], ['techlab', 3]];
}
// B3: the Bloomhost node assault (aiNode6h) takes a Skywyrm from B6J.wyrm.hp of its health (the pool's 50% kept others out)
const wyrm6j = (g, u) => rwB6j(g) && u.type === 'skywyrm' && u.hp >= u.maxHp * B6J.wyrm.hp;
function aiRework6j(g, s, mine) {
  if (turtleFac6j(g, s) && facOf(g.sides[s].faction) !== 'bloomhost') turtle6i(g, s, mine); // B1: the Last Fist Turtle's late Tech Lab
}
