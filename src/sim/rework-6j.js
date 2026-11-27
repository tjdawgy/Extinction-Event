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
