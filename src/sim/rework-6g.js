/* ---------- Batch 6g (v2.97, docs/FACTION_REWORK.md "Batch 6g"): playtest fixes (REWORK.b6g) ----------
   Stored per game in g.rw (rwB6g). Off: v2.96 exactly; nothing below runs or is saved. On: the seven fixes from the
   owner's iPhone playtest against Hard (8 matches, every faction and map), each described where it is defined below. */
const rwB6g = g => !!(g && g.rw && g.rw.b6g);

/* ---- 1. Smart warp-in (Axiarchs, the AI and the player) ----
   What was wrong (audit/logs-p1/b6g/warp.md): every new Axiarch unit warped in at its side's warp point (startWarp): for the AI
   v2.94's front edge of the frontmost field patch, or under b6elane (lane maps) a field spot beside the middle of its army on its
   focus lane, which can sit in the fight; for a player with no point of its own the field spot nearest the base rally point
   (b6f). A Genesis Gate on a forward pad skipped the warp point entirely: its units warped in at the pad's forward flag
   (fwdRally), the AI's and the player's alike, on the front line. And on the lane maps a warp spot had to lie within LANE_V of
   the map's middle (warpOk), so a point in an outer lane fell back along rings or to the Axis.
   With b6g on, every new Axiarch unit from any gate (base pads and forward pads alike; echoes too) warps in at warp6g's point:
   - the AI: the field spot nearest the rear of its main army (rear6g: the densest group of its ground fighters, the fifth
     rearmost of them, B6G.back further home), the nearest one that is safe (safe6g: no enemy unit it can see within
     B6G.safe, no enemy weapon it can see or remembers reaching it, plus B6G.margin); with no army, or no safe spot within
     B6G.near of that rear, the safe field spot nearest its base rally point;
   - a player with no warp point of its own: the field spot nearest the base rally point (b6f's warp6f), under the same rule;
   - a player's own warp point: kept for every gate, unless that spot is unsafe when the unit warps in: then the safe field
     spot nearest it.
   The point is checked when the channel starts and again when the unit arrives (updateWarps). While a Phase Beacon bubble
   stands the old point is kept for the AI and for a player without a point of its own (the Beacon's purpose is warping in at
   the front). On the lane maps warp spots may lie anywhere on open ground (warpOk: the map's own bounds and walls). */
const B6G = { safe: 150, margin: 20, back: 40, group: 450, near: 600, minArmy: 2 };
function safe6g(g, s, u, v) {
  const f = g.fog && g.fog[s];
  for (const e of g.ents) {
    if (e.side === s || e.hp <= 0 || e.gone) continue;
    if (e.kind === 'u') {
      if (!visibleTo(g, s, e)) continue;
      const d = rwD(g, e.type), dd = Math.hypot(e.u - u, e.v - v);
      if (dd < B6G.safe) return false;
      if (d.dmg && d.hitsGround !== false && dd <= (d.range || 0) + B6G.margin) return false;
    } else if (e.kind === 'b' && e.built) {
      const gn = bdOf(e).gun && bdOf(e).gun[e.tier]; if (!gn) continue;
      if (!visibleTo(g, s, e) && !(f && f.ghosts && f.ghosts[e.id])) continue;
      if (Math.hypot(e.u - u, e.v - v) - e.half <= gn.range + B6G.margin) return false;
    }
  }
  return true;
}
const open6g = (g, s, u, v) => u >= 0 && u <= L && (MAP_2D ? Math.abs(v) <= MAP.size.h / 2 - 12 && !(NAV.on && navShut(u, v)) : Math.abs(v) <= LANE_V) && onField(g, s, u, v);
// Candidate spots: each field patch's centre and two rings of 8
function cands6g(g, s) {
  const out = [];
  for (const p of g.field[s]) {
    if (p.r < 20) continue;
    if (open6g(g, s, p.u, p.v)) out.push([p.u, p.v]);
    for (const k of [0.45, 0.8]) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, u = p.u + Math.cos(a) * p.r * k, v = p.v + Math.sin(a) * p.r * k; if (open6g(g, s, u, v)) out.push([u, v]); }
  }
  return out;
}
// The safe candidate nearest (u, v) within max (null: none)
function near6g(g, s, u, v, max = 1e9) {
  let best = null, bd = max;
  for (const [cu, cv] of cands6g(g, s)) { const d = Math.hypot(cu - u, cv - v); if (d < bd && safe6g(g, s, cu, cv)) { bd = d; best = { u: cu, v: cv }; } }
  return best;
}
// The rear of side s's main army (the AI's): null with fewer than B6G.minArmy ground fighters
function rear6g(g, s) {
  const side = g.sides[s], dir = dirOf(s), busy = new Set([side.scoutId, ...(side.raid ? side.raid.ids : []), ...(side.capT ? side.capT.ids : []), ...(side.capT2 ? side.capT2.ids : []), ...(side.relicG ? side.relicG.ids : [])]);
  const A = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && !e.temp && !busy.has(e.id) && !UDEF[e.type].air && !UDEF[e.type].support);
  if (A.length < B6G.minArmy) return null;
  let c = null, cv = -1;
  for (const a of A) { let v = 0; for (const b of A) if (Math.hypot(a.u - b.u, a.v - b.v) <= B6G.group) v += armyValue([b]); if (v > cv || (v === cv && a.id < c.id)) { cv = v; c = a; } }
  const grp = A.filter(b => Math.hypot(c.u - b.u, c.v - b.v) <= B6G.group).sort((a, b) => dir * (a.u - b.u) || a.id - b.id);
  const r = grp[Math.floor(grp.length * 0.2)];
  return { u: clamp(r.u - dir * B6G.back, 0, L), v: r.v };
}
const beacon6g = (g, s) => { const bp = beaconPatch(g, s); return !!(bp && bp.r > 0); };
function warp6g(g, s, b) {
  const sd = g.sides[s], own = sd.direct && sd.warp && onField(g, s, sd.warp.u, sd.warp.v) ? sd.warp : null;
  if (!own && beacon6g(g, s)) return warpAt(g, s, b); // the Phase Beacon: as before
  if (own) return safe6g(g, s, own.u, own.v) ? own : near6g(g, s, own.u, own.v) || own;
  const R = ctlBase(s);
  if (sd.direct) { const p = warp6f(g, s, b) || warpPoint(g, s); return safe6g(g, s, p.u, p.v) ? p : near6g(g, s, p.u, p.v) || p; }
  const r = rear6g(g, s), p = r && near6g(g, s, r.u, r.v, B6G.near);
  return p || near6g(g, s, R.u, R.v) || warp6f(g, s, b) || warpPoint(g, s);
}

/* ---- 2. Attack orders stop at the enemy HQ (the player and every AI) ----
   What was wrong: the player's Attack order (command 'attack', direct control) walked each unit down its lane to the map's
   edge (units.js: L or 0) and stood there; 6f's end6f fixed only the AI's sides. And with the enemy HQ still shielded, an
   army that did stop at the HQ (end6f, 6e's end6e) stood beside an HQ it couldn't hurt while what held the shield stood on
   pads out of its reach (6f: two Classic Axiarch sides fighting 121 past the HQ).
   With b6g on, an all-in attack (the player's Attack order, an AI's base attack with no push line) ends at end6g's point:
   while the enemy HQ's shield is down, the HQ and B6FAI.past beyond it (6f's spot); while it is up, the building holding it
   that the side knows of (in sight, or remembered from the fog) nearest the unit; none known, the HQ. The player's attacking
   units also aim at the HQ and what holds its shield first (bbFocus, as the AI's base attack does). */
function end6g(g, u) {
  const s = u.side, opp = 1 - s, C = g._e6g || (g._e6g = [{ t: -1 }, { t: -1 }]), k = C[s];
  if (k.t !== g.t) {
    const hq = g.sides[opp].hq; k.t = g.t; k.hq = { u: clamp(hqU(opp) + dirOf(s) * B6FAI.past, 0, L), v: null }; k.list = [];
    if (hq && hq.hp > 0 && hq.shielded) { const f = g.fog[s];
      for (const b of g.ents) if (b.side === opp && b.kind === 'b' && b.hp > 0 && b.built && b.type !== 'hq' && b.type !== 'bunker' && !(b.slot >= FWD_SLOT) && (visibleTo(g, s, b) || (f && f.ghosts && f.ghosts[b.id]))) k.list.push(b); }
  }
  let best = null, bd = 1e9;
  for (const b of k.list) { const d = Math.hypot(b.u - u.u, b.v - u.v); if (d < bd) { bd = d; best = b; } }
  return best ? { u: best.u, v: best.v } : k.hq;
}
const bbf6g = (g, src) => rwB6g(g) && src.kind === 'u' && !!src.po && src.po.o === 'attack' && !!g.sides[src.side] && g.sides[src.side].direct;

/* ---- 3. Units under fire respond (every faction, the AI and the player) ----
   What was wrong: a unit standing (holding, on the AI's Retreat at home) or attack-moving with nothing in reach did nothing
   about an enemy shooting it from beyond its own reach: melee units chase only within their chase range (150-160) and only
   on some orders, so Marines (range 120 with sight beyond) and Artillery behind a screen shot Bloomhost melee to pieces.
   With b6g on, every hit records who dealt it (hurt6g: the unit or building, a projectile carrying its shooter's id, p.by).
   A unit that is holding (the player's Hold, an AI on Hold or on Retreat at home), or attacking down a lane with nothing in
   reach (the player's Attack once on its lane, an AI's attack stance), and was hit in the last B6G3.recent s by an enemy it
   can't hit from where it stands (fire6g):
   - charges (u.r6.m 'c') when it could hurt that enemy at all and the enemy is in sight within B6G3.leash of where it stood:
     it closes, fights whatever comes in reach first, and gives up after B6G3.charge s or B6G3.leash + B6G3.slack from its spot;
   - otherwise pulls back (u.r6.m 'p') toward its rally point (the player's: the base rally point) holding fire, until it is
     B6G3.clear beyond that enemy's reach or B6G3.back s pass; then B6G3.cd s before it pulls back again.
   Either way it then takes up its order again. A new order, an AI stance change or the enemy's death ends it. Never on the
   player's move, target or retreat orders (or a forward unit's crossing), nor siege-locked, deployed, burrowed or support units. */
const HIT6G = { by: 0 }; // the shooter of the projectile landing now (impact)
const B6G3 = { recent: 0.6, leash: 250, slack: 60, charge: 8, back: 6, clear: 40, cd: 5, home: 40 };
function hurt6g(g, e, src) { const by = src && src.id != null && src.side !== e.side ? src.id : HIT6G.by; if (by) { e.hb6 = by; e.hbT = g.t; } }
function hits6g(g, d, T) { // could this weapon hurt T at all (range aside)
  if (!d.weapon || !d.dmg) return false;
  const air = T.kind === 'u' && !!UDEF[T.type].air && !(T.lnd >= 2);
  if (air ? !d.hitsAir : d.hitsGround === false) return false;
  return !!DMG[d.weapon][T.kind === 'b' ? 'building' : T.lnd >= 2 ? LAND.armor : UDEF[T.type].armor];
}
// moveToward a spot a ground unit can stand on (an aircraft over a wall or ridge: the open point nearest it), so the path search never runs at a closed cell
const go6g = (u, d, tu, tv, dt, sp) => { if (!UDEF[u.type].air && MAP_2D && NAV.on && navShut(tu, tv)) [tu, tv] = navOpen(tu, tv); return moveToward(u, d, tu, tv, dt, sp); };
const reach6g = (g, T) => T.kind === 'u' ? (rwD(g, T.type).range || 0) : (((bdOf(T).gun || {})[T.tier] || {}).range || 0) + (T.half || 0);
function fire6g(g, u, d, side, st, cs, po, best, home, dt, sp) {
  const R = u.r6;
  if (R) {
    const T = ctlEnt(g, R.id), end = () => { u.r6 = undefined; if (R.m === 'p') u.r6cd = g.t + B6G3.cd; return false; };
    if (!T || T.hp <= 0 || T.gone || (po ? po.o !== R.o || (cs && (cs.go || cs.run)) : side.stance !== R.o)) return end();
    if (R.m === 'c') {
      if (g.t - R.t0 > B6G3.charge || Math.hypot(u.u - R.au, u.v - R.av) > B6G3.leash + B6G3.slack || !visibleTo(g, u.side, T)) return end();
      if (best) return false; // something in reach: it fights (the usual targeting)
      go6g(u, d, T.u, T.v, dt, sp); return true;
    }
    if (g.t - R.t0 > B6G3.back || Math.hypot(u.u - T.u, u.v - T.v) > reach6g(g, T) + B6G3.clear) return end();
    u.tgt = 0; u.chT = 0; go6g(u, d, R.tu, R.tv, dt, sp); return true;
  }
  if (best || !u.hb6 || g.t - u.hbT > B6G3.recent || side.hush || u.siege || u.dep || u.bur || u.leaping || u.lt || u.tn || d.support || !d.weapon) return false;
  if (po) { if (!(po.o === 'hold' || (po.o === 'attack' && !cs))) return false; }
  else if (!(st === 'attack' || st === 'hold' || (st === 'retreat' && Math.abs(home - u.u) <= B6G3.home)) || u.aiBack > g.t) return false;
  const T = ctlEnt(g, u.hb6); if (!T || T.hp <= 0 || T.gone || T.side === u.side) return false;
  const o = po ? po.o : side.stance;
  if (hits6g(g, d, T) && visibleTo(g, u.side, T) && Math.hypot(T.u - u.u, T.v - u.v) <= B6G3.leash) {
    u.r6 = { m: 'c', id: T.id, t0: g.t, au: u.u, av: u.v, o }; go6g(u, d, T.u, T.v, dt, sp); return true;
  }
  if (u.r6cd > g.t) return false;
  const B = po ? ctlBase(u.side) : { u: home, v: laneTv(u, home) };
  u.r6 = { m: 'p', id: T.id, t0: g.t, tu: B.u, tv: B.v, o }; u.tgt = 0; u.chT = 0; go6g(u, d, B.u, B.v, dt, sp); return true;
}

/* ---- 6. The Purification Beam on any lane ----
   What was wrong: the Beam's strip had to be centred within LANE_V + 25 of the map's middle line (abilityCheck: "needs a spot
   on the lane") and its centre was clamped to ±LANE_V (useAbility, the AI's aiStrikeTarget, the aiming strip drawn). LANE_V is
   half the width of the map's first lane (115), right for Classic's single lane; on Three-Lane only the centre lane lies there
   (the north and south lanes run at up to ±360), and on Two-Lane neither lane does away from the bases. Its range was never
   the limit: it may be aimed at any explored ground. With b6g on, on a lane map the strip may be centred anywhere within a
   lane's width (+25) of any lane's centre line, and stays where it was aimed; the same strip, damage and sweep; the AI scores
   and aims it on every lane. Classic is unchanged. */
const beamLane6g = (g, u, v) => rwB6g(g) && MAP_LANED;
const onLane6g = (u, v) => MAP.lanes.some(ln => Math.abs(v - laneY(ln, clamp(u, 0, L))) <= ln.width / 2 + 25);
const beamV6g = (g, u, v) => beamLane6g(g) ? v : clamp(v, -LANE_V, LANE_V);

/* ---- 7. The Wraithwing keeps its target ----
   What was wrong: a batch 4a Wraithwing hops around its target and fires on landing, but every landing (hopTo) and every tick
   (updateUnit) took acquire's best target in reach afresh, which after each hop is often another unit: its bolts spread over
   the enemy group instead of finishing one. With b6g on, it keeps its target (u.wwK) through every hop while that target is
   alive, in sight and within reach (ctlCanHit) when it lands; only then does it pick a new one. Hops, their timing and the
   untargetable window after each are unchanged. */
function ww6g(g, u, d, best) {
  const K = u.wwK ? ctlEnt(g, u.wwK) : null;
  if (K && K.hp > 0 && K.side !== u.side && visibleTo(g, u.side, K) && ctlCanHit(g, u, d, K)) return K;
  u.wwK = best ? best.id : 0; return best;
}
