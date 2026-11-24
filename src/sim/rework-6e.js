/* ---------- Batch 6e, Part A (v2.95, docs/FACTION_REWORK.md "Batch 6e"): Axiarch lane play (REWORK.b6elane) ----------
   Stored per game in g.rw (rwB6elane). Off: v2.94's lane AI exactly; nothing below runs or is saved. On, for an Axiarch AI
   on a lane map only (every difficulty; Classic has no lanes and plays as before):
   - Why (audit/logs-p1/lanes6e-base/A1.md): the army was not split much (every faction keeps about 90% of its ground army
     in one lane), but the Axiarchs lost 4× the others' value in units dying alone, nearly all on their main lane while
     holding at home: every Axiarch unit warps in at the warp point, v2.94's front edge of the frontmost field patch (the
     centre node or a forward pad, 1,000-1,500 from the HQ), while the army held 100-500 from it.
   - aiLanes6e (called from aiLanes / aiLanes3 in place of the reinforcement and shift rules): the army is one force. One
     focus lane at a time (side.la.fc) takes every ground unit but a screen of at most LANE6E.screen cheap units per other
     lane, and every new unit (side.laneNew). The focus is the lane under the most dangerous attack (enemy value in its own
     half, weighted toward its base), else the lane where it can win (the most enemy value its army beats by LANE6E.win,
     else the least enemy value), held at least LANE6E.hold seconds unless a threat elsewhere passes LANE6E.danger.
   - The warp point (side.warp, the player's "Set warp point") moves with the army: the field spot on the focus lane nearest
     the middle of its army there, never more than LANE6E.ahead beyond it (lane6eWarp), so new units warp in beside the
     army; on a lane switch, the moment it changes lanes, new units already arrive on the new lane.
   - A switch moves the army together: when Mass Warp is ready the AI casts it on the biggest group still on the old lane
     (aiMassWarp6e, an existing ability, no new one): up to 8 units warp across; the rest walk.
   - Base attacks ('all', 'siege') keep v2.94's rule (one lane, the whole army), the focus and warp point following them;
     capture groups are one at a time (Three-Lane's second group is off). */
const rwB6elane = g => !!(g && g.rw && g.rw.b6elane);
const LANE6E = { screen: 1, screenMax: 150, hold: 25, danger: 1.5, win: 1.15, ahead: 60, base: 250, past: 60 };
const lane6eOn = (g, s) => rwB6elane(g) && facOf(g.sides[s].faction) === 'axiarchs';

/* ---------- Batch 6e, Parts B and C (v2.95): the Axiarch energy squeeze, then Last Fist's early edge (REWORK.b6e) ----------
   Stored per game in g.rw (rwB6e). Off: v2.94's costs. On: every Axiarch unit's energy is at most B6E.share of its total
   cost (rounded to 5), the rest moved onto its credits: its total (credits + energy) is unchanged, a unit already at or
   under the share (the Shardling) is unchanged. By the Axiarchs' own training mix in batch 6d's self-play, the energy share
   of what they spend on units falls from 26.0% to 20.0% (Last Fist 18.5%, Bloomhost 19.0%). UDEF untouched: the price is
   played through trainCost, rwD and rwShow (Codex and info cards), echoCost (the Echo Reliquary's half price) and the
   refund of a sold building's queue. The AI's army-value estimates (armyValue) keep UDEF's numbers. */
const rwB6e = g => !!(g && g.rw && g.rw.b6e);
const B6E = {
  share: 0.2,
  cost: { // v2.94's cost in the comment (credits/energy)
    riftstalker: { c: 150, e: 40 },  // 140/50
    parallax: { c: 250, e: 60 },     // 220/90
    lancer: { c: 130, e: 35 },       // 120/45
    marksman: { c: 280, e: 70 },     // 240/110
    bastion: { c: 275, e: 70 },      // 260/85
    severance: { c: 250, e: 60 },    // 220/90
    riftmortar: { c: 280, e: 70 },   // 250/100 (b2a off)
    worldbreaker: { c: 570, e: 140 },// 500/210
    gravemantle: { c: 265, e: 65 },  // 230/100
    eventide: { c: 480, e: 120 },    // 420/180
    wraithwing: { c: 265, e: 65 },   // 230/100
    prismwing: { c: 110, e: 30 },    // 100/40
    shardstorm: { c: 330, e: 80 },   // 280/130
    voidcarrier: { c: 425, e: 105 }, // 360/170
    sovereign: { c: 720, e: 180 },   // 600/300
    // Part C (audit/logs-p1/selfplay6e-c3/C3.md): Last Fist's edge was volume (it spent 11-28% more a minute on units than
    // either opponent; its 4:00 army, 39% Marines by value, decided the Axiarch pairing). The Marine 45 → 48 credits; nothing else
    rifle: { c: 48, e: 0 },          // 45/0
  },
};
const rw6eCost = (g, t) => rwB6e(g) && B6E.cost[t] && !(rwB6f(g) && B6F.undo(t)) ? B6E.cost[t] : null; // v2.96 (b6f): the Axiarch conversion undone (src/sim/rework-6f.js)
// B2's one further change (audit/logs-p1/selfplay6e-b2/B2.md): with the costs converted the Axiarchs fell to 34%; energy was no
// longer what held them back (it piled up unspent from 10:00), so not the Singularity Well. The unit failing its role with the
// most spent on it: the Riftstalker (98 damage and 39 killed value per 100 spent, 3% of the damage in Axiarch wins; its blink
// home when its shields break pulled it out before it killed). Its shields 110 → 160; health, damage and the rest unchanged.
B6E.unit = { riftstalker: { shp: 160 } };
const rw6eUnit = (g, t) => rwB6e(g) && B6E.unit[t] ? B6E.unit[t] : null;
function rw6eSpawn(g, u) { const o = B6E.unit[u.type]; if (o && o.shp !== undefined) { u.shp = u.maxShp = o.shp; } }
// Batch 6d's and 6e's per-game values for type t together (rwD's overlay), or null
function rwOver6(g, t) { const a = rw6dUnit(g, t), c = rw6eCost(g, t), o = rw6eUnit(g, t); return c || o ? Object.assign({}, a || {}, o || {}, c ? { cost: c } : {}) : a; }
const unitCost6 = (g, t) => rw6eCost(g, t) || UDEF[t].cost; // what a unit of type t costs in game g (a brood aside: trainCost)

/* ---- b6elane: one army, one lane ---- */
// Every LANE_AI.every s from aiLanes / aiLanes3 when no base attack is on (that branch already sends everything down one
// lane). army: its ground and air fighters not in a capture, scout or raid group; en: enemy value per lane (aiLanes' own
// estimate); lanes: the lane indices.
function aiLanes6e(g, s, army, theirs, en, lanes) {
  const side = g.sides[s], LA = side.la, C = LANE6E, dir = dirOf(s), hq = hqU(s), half = L / 2;
  const myV = armyValue(army);
  // danger: what it knows of the enemy in its own half of each lane, weighted up to 2× as it nears the HQ
  const dz = lanes.map(() => 0);
  for (const e of theirs) {
    if (e.v === undefined || !e.fresh || dir * (e.u - half) > 0) continue;
    dz[laneOfPt(e.u, e.v)] += armyValue([e]) * (2 - clamp(Math.abs(e.u - hq) / half, 0, 1));
  }
  const dTop = dz.indexOf(Math.max(...dz));
  let want;
  if (dz[dTop] >= 150) want = dTop; // the most dangerous attack
  else { // the lane where it can win: the most enemy it beats there, else the least enemy
    const beat = lanes.filter(k => en[k] > 0 && myV >= en[k] * C.win).sort((a, b) => en[b] - en[a] || a - b);
    want = beat.length ? beat[0] : lanes.slice().sort((a, b) => en[a] - en[b] || (a === LA.fc ? -1 : b === LA.fc ? 1 : 0) || a - b)[0];
  }
  let fc = LA.fc;
  if (fc == null || fc >= lanes.length) { fc = want; LA.fcT = g.t; }
  else if (want !== fc && (g.t - LA.fcT >= C.hold || (dz[want] >= 150 && dz[want] > dz[fc] * C.danger))) { fc = want; LA.fcT = g.t; LA.fsw = (LA.fsw || 0) + 1; LA.mwT = g.t; } // LA.fsw: switches (the harness reads it)
  LA.fc = fc;
  lane6eGo(g, s, army, fc, true);
}
// Every unit of army onto lane k (but a screen per other lane when screen), new units and the warp point there too
function lane6eGo(g, s, army, k, screen) {
  const side = g.sides[s], C = LANE6E;
  const keep = new Set();
  if (screen) for (let j = 0; j < MAP.lanes.length; j++) {
    if (j === k) continue;
    const c = army.filter(u => u.lane === j && !UDEF[u.type].air && armyValue([u]) <= C.screenMax).sort((a, b) => armyValue([a]) - armyValue([b]) || a.id - b.id);
    for (const u of c.slice(0, C.screen)) keep.add(u.id);
  }
  for (const u of army) if (u.lane !== k && !keep.has(u.id)) u.lane = k;
  side.laneNew = k;
  side.warp = lane6eWarp(g, s, army, k);
}
// The warp point beside the army (A1: v2.94's point, the front edge of the frontmost field patch, sat at the centre node or a
// forward pad 1,000-1,500 from the HQ while the army held near home, and new units warped in there alone): on lane k, the
// field spot nearest the middle of its ground army there (its own base when it has none), never more than LANE6E.ahead
// beyond that middle toward the enemy. None on lane k: null (v2.94's default point)
function lane6eWarp(g, s, army, k) {
  const dir = dirOf(s), hq = hqU(s), ln = MAP.lanes[k];
  const xs = army.filter(u => !UDEF[u.type].air && u.lane === k).map(u => u.u).sort((a, b) => dir * (a - b));
  const mid = xs.length ? xs[xs.length >> 1] : hq + dir * LANE6E.base;
  let best = null, bd = 1e9;
  for (const p of g.field[s]) {
    if (p.r < 20) continue;
    for (const f of [-0.8, -0.4, 0, 0.4, 0.8]) {
      const u = clamp(p.u + f * p.r, 0, L), v = clamp(laneY(ln, u), -LANE_V, LANE_V);
      if (dir * (u - mid) > LANE6E.ahead || !onField(g, s, u, v) || laneOfPt(u, v) !== k) continue;
      const d = Math.abs(u - mid); if (d < bd) { bd = d; best = { u, v }; }
    }
  }
  return best;
}
// Mass Warp on a lane switch (aiMassWarpTarget): within 20 s of a switch, the biggest group of its units still off the
// focus lane and far from the warp point, 3 or more within the circle
function aiMassWarp6e(g, s, ctx) {
  const side = g.sides[s], LA = side.la; if (!LA || LA.fc == null || !(g.t - (LA.mwT ?? -99) < 20)) return null;
  const A = ABIL.mwarp, wp = warpPoint(g, s), off = ctx.mine.filter(m => !UDEF[m.type].air && laneOfPt(m.u, m.v) !== LA.fc && Math.hypot(m.u - wp.u, m.v - wp.v) >= A.aiFar);
  let best = null, bn = 2;
  for (const c of off) { const n = off.filter(m => inAbil(m, c.u, c.v, A.r)).length; if (n > bn) { bn = n; best = { u: c.u, v: c.v, score: 1 + n / A.aiN } } }
  return best;
}
// Where an all-in base attack walks to (units.js, side.end6e): the enemy HQ and LANE6E.past beyond it, so the army stays
// in the enemy base it is breaking. v2.94 walked it to the map's edge behind the base, where it stood out of sight of what
// the enemy rebuilt behind it (A2's first trials: a 3× army idle there for 12 minutes, the match drawn by the storm)
const lane6eEnd = (g, s) => clamp(hqU(1 - s) + dirOf(s) * LANE6E.past, 0, L);
