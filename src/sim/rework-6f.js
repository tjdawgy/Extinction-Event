/* ---------- Batch 6f, Part A (v2.96, docs/FACTION_REWORK.md "Batch 6f"): base attacks for every AI (REWORK.b6fai) ----------
   Stored per game in g.rw (rwB6fai). Off: v2.95 exactly; nothing below runs or is saved. On:
   - Why (audit/logs-p1/selfplay6f-a0/A0.md): an all-in base attack (stance attack, no push line) walked every unit to the
     map's edge behind the enemy HQ (units.js: L or 0) and stood there, out of reach of what the enemy rebuilt in its base.
     Batch 6e fixed it for the Axiarch AI on the lane maps only (lane6eEnd, side.end6e).
   - Every AI-played side (never the player's: side.direct), every faction and map: the attack ends at the enemy HQ and
     B6FAI.past beyond it (end6f), so the army stands in the base it is breaking, where its targeting (bbFocus) takes the
     HQ and the buildings holding its shield. b6elane's own end point, where it is set, comes first (the same spot). */
const rwB6fai = g => !!(g && g.rw && g.rw.b6fai);
const B6FAI = { past: 60 };
const end6f = (g, s) => clamp(hqU(1 - s) + dirOf(s) * B6FAI.past, 0, L);

/* ---------- Batch 6f, Parts B-D (v2.96): the Axiarch energy conversion undone (REWORK.b6f) ----------
   Stored per game in g.rw (rwB6f). Off: v2.95's prices (b6e's conversion when b6e is on). On: every Axiarch unit costs
   v2.94's credits and energy again (UDEF's numbers: b6e's B6E.cost entries for Axiarch units are skipped, in trainCost,
   rwD, rwShow, echoCost and a sold queue's refund alike). Kept: the Riftstalker's shields (B6E.unit, 160) and the Marine's
   48 credits (B6E.cost.rifle), both still behind b6e. Why (audit/logs-p1/selfplay6e-b2/B2.md): the conversion alone took the
   Axiarchs from 45% to 34%; they ran short of credits from 8:00 with 400-1,400 energy unspent. */
const rwB6f = g => !!(g && g.rw && g.rw.b6f);
const B6F = { undo: t => !!UDEF[t] && UDEF[t].fac === 'axiarchs' };

/* ---- b6f, Part C: the player's default warp point (docs/FACTION_REWORK.md "Batch 6f", Part C) ----
   A human Axiarch player's units warp in at the warp point: the spot set with the Train tab's "Warp point" card while it is
   still inside the field, else the default, v2.95's front edge of the frontmost field patch (defaultWarp), where every new
   unit appeared alone at the front and held there (ctlArrive). Batch 6e's warp point (lane6eWarp) is the AI's only. With
   b6f on, a side under direct control (the player) with no warp point of its own (none set, or the one set has left the
   field) warps in at the field spot nearest its base rally point (ctlBase, always set: where every other faction's new units
   gather and Retreat goes; nearest the producing building only if no field spot is found). The card's set point is
   unchanged. warpAt is that point (startWarp, Mass Warp, and the warp mark the player sees); the AI's sides keep warpPoint. */
function warp6f(g, s, b) {
  const R = ctlBase(s), at = [[R.u, R.v]]; if (b) at.push([b.u, b.v]);
  for (const [u0, v0] of at) {
    let best = null, bd = 1e9;
    for (const p of g.field[s]) {
      if (p.r < 20) continue;
      const du = u0 - p.u, dv = v0 - p.v, d = Math.hypot(du, dv), k = d <= p.r * 0.8 ? 1 : p.r * 0.8 / d;
      const u = clamp(p.u + du * k, 0, L), v = clamp(p.v + dv * k, -LANE_V, LANE_V);
      if (!onField(g, s, u, v)) continue;
      const e = Math.hypot(u - u0, v - v0); if (e < bd) { bd = e; best = { u, v }; }
    }
    if (best) return best;
  }
  return null;
}
const warpAt = (g, s, b) => (warp6fOn(g, s) && warp6f(g, s, b)) || warpPoint(g, s);
// Not while a Phase Beacon's bubble stands: the beacon exists to warp units in at the front (its bubble is then the front edge)
const warp6fOn = (g, s) => { const sd = g.sides[s], bp = rwB6f(g) && sd.direct ? beaconPatch(g, s) : null; return rwB6f(g) && !!sd.direct && !(sd.warp && onField(g, s, sd.warp.u, sd.warp.v)) && !(bp && bp.r > 0); };

/* ---- b6fai, Part D2 (docs/FACTION_REWORK.md "Batch 6f", Part D): the Bloomhost swarm keeps to one lane ----
   Why (audit/logs-p1/lanes6f-d1/D1.md): on Three-Lane the Bloomhost AI spread its army the most of any faction (1.38 lanes
   holding 20%+ of it, against 1.14-1.23; 7% of its army in capture and raid groups, against 3-4%), was outnumbered in its
   main lane in 59% of samples and lost 40% of its army's value outnumbered, while its swarm surge pays only for a packed
   swarm. On a lane map (every difficulty; Classic has no lanes) the Bloomhost AI now plays batch 6e's one-army lane rule
   (aiLanes6e: one focus lane with at most a one-unit screen elsewhere, every new unit there; base attacks down one lane;
   one capture group on Three-Lane). The warp point it also sets is never read for a Bloomhost side. */
const lane6fOn = (g, s) => lane6eOn(g, s) || (rwB6fai(g) && facOf(g.sides[s].faction) === 'bloomhost');

/* ---- b6fai, Part D2: a press attack counts the base's defences ----
   Why (audit/logs-p1/lanes6f-d1/D1.md): Last Fist lost all 12 of its Classic matches against a Turtle (6-0 to each faction's
   Turtle; every other personality and map pairing was normal), 12 of its 25 Classic losses. Ahead early on volume, its Hard
   AI's press rule (ATTACK.press: an all-in or siege push whenever its army beats the enemy army it knows of by the press
   edge) sent it again and again into the Turtle's Turrets and HQ gun on the short map: press attacks skip the engage check,
   and unlike every other base-attack rule (thV + hqVal) press never counted the base's known defences. Last Fist lost
   9,500-10,400 by 10:00 against 6,600-6,700, and the Turtle out-grew it. With b6fai on, every AI's press base attack also
   needs its army to be at least B6FAI.press × (the enemy army it knows of + the base's known defences, knownDefense). */
B6FAI.press = 1;
const press6f = (g, myV, thV, hqVal) => !rwB6fai(g) || myV >= (thV + hqVal) * B6FAI.press;
