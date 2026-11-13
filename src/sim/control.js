/* ---------- Direct control (v2.73, docs/CONTROLS.md): the player selects units, then commands them ----------
   A mode of one side (side.direct), switched on by directControl: the game's UI does it for the player; the AI's sides and
   the audit bots never have it, so they keep their stance, group, type and lane orders and play exactly as before.
   On a direct side every unit has its own order (u.po), given by command(): 'go' (walk to a spot holding fire, then hold
   there), 'attack' (down the lane it is in, to the enemy base), 'hold' (stop and fight what is in reach; the spot is
   holdU/holdV) or 'retreat' (back to its lane's base flag holding fire, then hold there). Nothing else moves a unit: new
   units walk to the active lane's base flag (side.active) and hold there; a forward Barracks' units hold beside it; units
   that appear elsewhere (warp-ins, Brood, Mites) hold where they appear. Each lane has one base flag (side.flags[k],
   Classic one), which the player can move (setFlag). Units heal at their side's base flags (CTRL.heal of their health a
   second once unhurt for CTRL.calm s, within CTRL.healR) and at held repair depots (updateRepair), only where the player
   has moved them. */
const CTRL = { healR: 80, heal: 0.03, calm: 3, arrive: 10, gap: 14, flagOut: 40 };
const laneAt = (u, v) => { // the lane nearest a point (its centre line at that x), or null on a map without lanes
  if (!MAP_LANED) return null;
  let k = 0, bd = 1e9; MAP.lanes.forEach((ln, i) => { const d = Math.abs(laneY(ln, clamp(u, 0, L)) - v); if (d < bd) { bd = d; k = i; } });
  return k;
};
const flagIx = (g, e) => MAP_LANED && e.lane != null ? clamp(e.lane, 0, g.sides[e.side].flags.length - 1) : 0;
const laneCount = () => MAP_LANED ? MAP.lanes.length : 1;
function flagHome(g, s, k) { // a lane's base flag where the match starts: the map's rally point (lane maps: CTRL.flagOut further out, on the lane)
  const u = rallyU0(s) + (MAP_LANED ? dirOf(s) * CTRL.flagOut : 0);
  return { u, v: MAP_LANED ? laneY(MAP.lanes[k], u) : 0 };
}
const flagSpot = (f, e) => [f.u + ((e.id * 37) % 9 - 4) * 9, f.v + ((e.id * 53) % 9 - 4) * 7]; // a spread spot around a flag, fixed per unit
const ctlHold = (e, u, v) => { e.po = { o: 'hold' }; e.holdU = u; e.holdV = v; };
// Switch side s to direct control. An older match (a save from before v2.73) has its orders mapped onto the new ones:
// Hold holds where the unit stands, Attack attacks, Retreat and units sent home retreat to their lane's base flag, a
// Regroup walks to its flag and holds.
function directControl(g, s) {
  const side = g.sides[s]; if (side.direct) return false;
  const R = side.rally, n = laneCount();
  side.direct = true;
  side.flags = []; for (let k = 0; k < n; k++) { const f = flagHome(g, s, k); if (R && R.def != null) { f.u = R.def + (MAP_LANED ? dirOf(s) * CTRL.flagOut : 0); if (MAP_LANED) f.v = laneY(MAP.lanes[k], f.u); } side.flags.push(f); }
  side.active = MAP_LANED && side.laneNew != null ? clamp(side.laneNew, 0, n - 1) : 0;
  if (MAP_LANED) side.laneNew = side.active;
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.side !== s || e.hp <= 0) continue;
    const ord = unitOrder(side, e.type, e.lane), st = e.medHome ? 'retreat' : ord ? ord.o : side.stance;
    if (st === 'attack' || st === 'retreat') { e.po = { o: st }; e.holdU = undefined; e.holdV = undefined; }
    else if (st === 'move') { const [su, sv] = slotOf(e, ord); if (ord.done) ctlHold(e, su, sv); else { e.po = { o: 'go', u: su, v: sv }; e.holdU = undefined; e.holdV = undefined; } }
    else ctlHold(e, e.holdU !== undefined ? e.holdU : e.u, e.holdV !== undefined ? e.holdV : e.v);
    e.medHome = 0; e.fwdHome = undefined; e.rwT = 0; e.rwGo = 0;
  }
  side.orders = newOrders(); side.stance = 'hold'; side.sel = null;
  delete side.rally; delete side.squad;
  return true;
}
// A new unit on a direct side (spawnUnit): it holds where it appears until something else says otherwise
function ctlSpawn(g, e) { ctlHold(e, e.u, e.v); }
// A unit just trained (fr: a forward Barracks' spot from fwdRally, else null): it walks to the active lane's base flag and
// holds there; one from a forward Barracks holds where it appeared, beside the building
function ctlTrained(g, e, fr) {
  const side = g.sides[e.side];
  e.fwdHome = undefined;
  if (fr) { ctlHold(e, e.u, e.v); return; }
  if (MAP_LANED) e.lane = side.active;
  let [su, sv] = flagSpot(side.flags[flagIx(g, e)], e);
  if (NAV.on && !UDEF[e.type].air && navShut(su, sv)) [su, sv] = navOpen(su, sv);
  e.po = { o: 'go', u: su, v: sv }; e.holdU = undefined; e.holdV = undefined;
}
// Where a forward Barracks' units appear on a direct side: beside the building, toward the enemy
const ctlFwdSpot = (g, s, b, lane, n) => ({ u: clamp(b.u + dirOf(s) * (b.half + 26), 0, L), v: b.v, lane, n });
// The order for a set of units (ids: unit ids, only side s's living units count). o: 'go' (with u, v: the spot; the units
// spread around it), 'attack', 'hold' or 'retreat'.
function command(g, s, ids, o, u, v) {
  if (g.over) return { ok: false, msg: 'The match is over' };
  if (g.countdown > 0) return WAIT_GO;
  const side = g.sides[s];
  if (!side.direct) return { ok: false, msg: 'Not under direct control' };
  if (!['go', 'attack', 'hold', 'retreat'].includes(o)) return { ok: false, msg: 'Unknown order' };
  const want = new Set(ids), us = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && want.has(e.id));
  if (!us.length) return { ok: false, msg: 'No units selected' };
  if (o === 'go') {
    if (!(u >= 0 && u <= L && Math.abs(v) <= (MAP_2D ? MAP.size.h / 2 : 220))) return { ok: false, msg: 'Target the battlefield' };
    if (NAV.on && navShut(u, v)) [u, v] = navOpen(u, v);
    const lane = laneAt(u, v);
    us.sort((a, b) => Math.hypot(a.u - u, a.v - v) - Math.hypot(b.u - u, b.v - v) || a.id - b.id); // the nearest take the middle
    us.forEach((e, i) => { // a sunflower around the spot, CTRL.gap apart
      const r = CTRL.gap * Math.sqrt(i), a = i * 2.39996;
      let su = clamp(u + Math.cos(a) * r, 0, L), sv = v + Math.sin(a) * r * 0.8;
      if (NAV.on && !UDEF[e.type].air && navShut(su, sv)) [su, sv] = navOpen(su, sv);
      e.po = { o: 'go', u: su, v: sv }; e.holdU = undefined; e.holdV = undefined;
      if (lane != null) e.lane = lane;
    });
  } else for (const e of us) {
    if (o === 'hold') ctlHold(e, e.u, e.v);
    else { e.po = { o }; e.holdU = undefined; e.holdV = undefined; if (o === 'attack' && MAP_LANED) e.lane = laneAt(e.u, e.v); }
  }
  lg(g, s, 'O', 'sel', us.length, o === 'go' ? 'move' : o);
  const n = us.length, who = `${n} unit${n === 1 ? '' : 's'}`;
  return { ok: true, n, msg: o === 'go' ? `${who}: moving` : o === 'hold' ? `${who}: holding position` : o === 'attack' ? `${who}: attacking down the lane` : `${who}: retreating to the base flag` };
}
// The lane whose base flag new units go to (and the lanes' flags exist only on a direct side)
function setActiveLane(g, s, k) {
  const side = g.sides[s];
  if (!side.direct) return { ok: false, msg: 'Not under direct control' };
  if (!(k >= 0 && k < side.flags.length)) return { ok: false, msg: 'Unknown lane' };
  side.active = k; if (MAP_LANED) side.laneNew = k;
  return { ok: true, msg: MAP_LANED ? `Training to ${MAP.lanes[k].id}` : 'Training to the base flag' };
}
// Move a lane's base flag (the player taps it, then the ground). It stays between RALLY.min out from the HQ and RALLY.past
// beyond the centre, on open ground. Units holding at it stay where they are; units retreating to it head for the new spot.
function setFlag(g, s, k, u, v) {
  const side = g.sides[s];
  if (!side.direct || !(k >= 0 && k < side.flags.length)) return { ok: false, msg: 'No such flag' };
  const a = hqU(s) + dirOf(s) * RALLY.min, b = L / 2 + dirOf(s) * RALLY.past, hv = MAP_2D ? MAP.size.h / 2 - 20 : 0;
  u = clamp(u, Math.min(a, b), Math.max(a, b)); v = MAP_2D ? clamp(v, -hv, hv) : 0;
  if (NAV.on && navShut(u, v)) [u, v] = navOpen(u, v);
  side.flags[k] = { u, v };
  return { ok: true, msg: MAP_LANED ? `${MAP.lanes[k].id[0].toUpperCase() + MAP.lanes[k].id.slice(1)} base flag moved` : 'Base flag moved' };
}
// Healing at the base flags: a direct side's units within CTRL.healR of any of its base flags, unhurt for CTRL.calm s
function updateFlagHeal(g, dt) {
  for (let s = 0; s < 2; s++) {
    const side = g.sides[s]; if (!side.direct) continue;
    for (const e of g.ents) {
      if (e.kind !== 'u' || e.side !== s || e.hp <= 0 || e.hp >= e.maxHp || g.t - e.lastHurt <= CTRL.calm) continue;
      if (!side.flags.some(f => Math.hypot(e.u - f.u, e.v - f.v) <= CTRL.healR)) continue;
      const h0 = e.hp; e.hp = Math.min(e.maxHp, e.hp + e.maxHp * CTRL.heal * dt);
      if (g.log) g.log.tot[s].flagHeal = (g.log.tot[s].flagHeal || 0) + e.hp - h0;
    }
  }
}
