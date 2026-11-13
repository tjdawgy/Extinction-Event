/* ---------- Direct control (v2.73, docs/CONTROLS.md): the player selects units, then commands them ----------
   A mode of one side (side.direct), switched on by directControl: the game's UI does it for the player; the AI's sides and
   the audit bots never have it, so they keep their stance, group, type and lane orders and play exactly as before.
   On a direct side every unit has its own order (u.po), given by command(): 'go' (walk to a spot, stopping to fight what
   it meets, then hold there), 'target' (go and attack one enemy, fighting what it meets; hold where it is once the target
   is dead), 'attack' (down a lane to the enemy base: the lane the player picked, else the one it is in), 'hold' (stop and
   fight what is in reach; the spot is holdU/holdV) or 'retreat' (back to the base rally point holding fire and ignoring
   enemies, then hold there). Nothing else moves a unit: new units gather at the base rally point (the map's rally point,
   v2.76: the lane flags and the active lane are gone) and hold there; a forward Barracks' units gather beside it; units
   that appear elsewhere (warp-ins, Brood, Mites) hold where they appear. Wherever units gather they spread out (ctlPack):
   each takes its own spot, CTRL.pad plus both footprints apart on screen, never on closed ground. Units heal at the base
   rally point (CTRL.heal of their health a second once unhurt for CTRL.calm s, within CTRL.healR) and at held repair
   depots (updateRepair), only where the player has moved them. Control groups (side.groups, three lists of unit ids) are
   kept here so a save carries them; the SIM never reads them. */
const CTRL = { safe: 24, healR: 150, heal: 0.03, calm: 3, arrive: 10, foot: 0.4, footMin: 7, footMax: 22, pad: 4, ring: 6, rings: 70, groups: 3 };
const laneAt = (u, v) => { // the lane nearest a point (its centre line at that x), or null on a map without lanes
  if (!MAP_LANED) return null;
  let k = 0, bd = 1e9; MAP.lanes.forEach((ln, i) => { const d = Math.abs(laneY(ln, clamp(u, 0, L)) - v); if (d < bd) { bd = d; k = i; } });
  return k;
};
const laneCount = () => MAP_LANED ? MAP.lanes.length : 1;
const ctlBase = s => ({ u: rallyU0(s), v: MAP.bases[s].rally[1] }); // v2.76: the base rally point, in the middle of the base where the lanes meet
const ctlHold = (e, u, v) => { e.po = { o: 'hold' }; e.holdU = u; e.holdV = v; };
// Spacing (v2.76). A unit's footprint (its body's half width, from its type's height) and the spots a side's units hold or
// are heading for, in cells of the screen's metric (x = u, y = v * DY), aircraft and ground apart.
const ctlFoot = t => clamp(UDEF[t].h * CTRL.foot, CTRL.footMin, CTRL.footMax);
const ctlSpot = e => !e.po ? null : e.po.o === 'hold' ? (e.holdU !== undefined ? [e.holdU, e.holdV] : null) : (e.po.o === 'go' || e.po.o === 'retreat') && e.po.u != null ? [e.po.u, e.po.v] : null;
function ctlTaken(g, s, skip) {
  const C = 48, M = [new Map(), new Map()], key = (x, y) => Math.floor(x / C) * 100003 + Math.floor(y / C);
  const add = (u, v, air, r) => { const m = M[air ? 1 : 0], k = key(u, v * DY); let a = m.get(k); if (!a) m.set(k, a = []); a.push(u, v * DY, r); };
  const clash = (u, v, air, r) => {
    const m = M[air ? 1 : 0], x = u, y = v * DY, cx = Math.floor(x / C), cy = Math.floor(y / C);
    for (let i = cx - 1; i <= cx + 1; i++) for (let j = cy - 1; j <= cy + 1; j++) {
      const a = m.get(i * 100003 + j); if (!a) continue;
      for (let k = 0; k < a.length; k += 3) { const lim = a[k + 2] + r + CTRL.pad; if ((a[k] - x) ** 2 + (a[k + 1] - y) ** 2 < lim * lim) return true; }
    }
    return false;
  };
  for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && !skip.has(e.id)) { const p = ctlSpot(e); if (p) add(p[0], p[1], !!UDEF[e.type].air, ctlFoot(e.type)); }
  return { add, clash };
}
const ctlOpen = (u, v, air) => u >= 8 && u <= L - 8 && Math.abs(v) <= (MAP_2D ? MAP.size.h / 2 - 16 : LANE_V - 6) && (air || !NAV.on || !navShut(u, v));
function ctlFree(T, air, r, pu, pv, ok) { // the free spot nearest (pu, pv): rings CTRL.ring apart on screen, each walked evenly (ok: a further test a spot must pass)
  for (let ring = 0; ring < CTRL.rings; ring++) {
    const rad = ring * CTRL.ring, n = ring ? Math.max(6, Math.round(2 * Math.PI * rad / CTRL.ring)) : 1, a0 = ring * 0.9;
    for (let i = 0; i < n; i++) {
      const a = a0 + i * 2 * Math.PI / n, u = pu + Math.cos(a) * rad, v = pv + Math.sin(a) * rad / DY;
      if (ctlOpen(u, v, air) && !T.clash(u, v, air, r) && (!ok || ok(u, v))) return [u, v];
    }
  }
  return [pu, pv];
}
// Spots for units us gathering at (cu, cv) (own: each at the free spot nearest where it stands, for Hold): the nearest units
// take the middle. Returns a Map id -> [u, v].
function ctlPack(g, s, us, cu, cv, own) {
  const T = ctlTaken(g, s, new Set(us.map(e => e.id))), out = new Map();
  const list = own ? us.slice().sort((a, b) => a.id - b.id) : us.slice().sort((a, b) => Math.hypot(a.u - cu, a.v - cv) - Math.hypot(b.u - cu, b.v - cv) || a.id - b.id);
  if (!own && NAV.on && navShut(cu, cv)) [cu, cv] = navOpen(cu, cv);
  for (const e of list) {
    const air = !!UDEF[e.type].air, r = ctlFoot(e.type);
    const p = ctlFree(T, air, r, own ? e.u : cu, own ? e.v : cv);
    T.add(p[0], p[1], air, r); out.set(e.id, p);
  }
  return out;
}
// One unit to a free spot near (u, v): there already, it holds; else it walks there (fighting what it meets) and holds
function ctlSettle(g, e, u, v) {
  const p = ctlPack(g, e.side, [e], u, v, false).get(e.id);
  if (Math.hypot(p[0] - e.u, p[1] - e.v) <= CTRL.arrive) ctlHold(e, p[0], p[1]);
  else { e.po = { o: 'go', u: p[0], v: p[1] }; e.holdU = undefined; e.holdV = undefined; }
}
const ctlHere = (g, e) => ctlSettle(g, e, e.u, e.v); // hold where it is, stepping apart from units already there
// Static defences (v2.80): side s's finished buildings with a gun (the HQ's gun, Turrets, bunkers and each faction's
// equivalents), and whether one could hit a unit of type t standing at (u, v), pad further out than its range
const ctlGuns = (g, s) => g.ents.filter(b => b.kind === 'b' && b.side === s && b.hp > 0 && b.built && bdOf(b).gun && bdOf(b).gun[b.tier]);
function ctlReach(b, t, u, v, pad) {
  const G = bdOf(b).gun[b.tier], air = !!UDEF[t].air;
  if (air ? !G.hitsAir : G.hitsGround === false) return false;
  if (!DMG[G.weapon][UDEF[t].armor]) return false;
  return effDist(b, { u, v, kind: 'u' }) <= (air && G.airRange ? G.airRange : G.range) + pad;
}
// Target follow-up (v2.80): side s's units that were sent at target id, once it is dead. If an enemy static defence can
// reach any of them, the whole group falls back toward its own base to just outside the reach of every enemy defence
// (CTRL.safe beyond its range), each to its own spot (spacing), holding its fire on the way like Retreat (or it would stop
// to fight the defence), and holds there; if none can, each holds where it is.
function ctlFollow(g, s, id) {
  const us = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && e.po && e.po.o === 'target' && e.po.id === id).sort((a, b) => a.id - b.id);
  const guns = ctlGuns(g, 1 - s);
  if (!guns.some(b => us.some(e => ctlReach(b, e.type, e.u, e.v, 0)))) { for (const e of us) ctlHere(g, e); return; }
  const T = ctlTaken(g, s, new Set(us.map(e => e.id))), back = -dirOf(s), B = ctlBase(s);
  // the nearest the base go first, so the cluster forms from the back
  us.sort((a, b) => (b.u - a.u) * back || a.id - b.id);
  for (const e of us) {
    const air = !!UDEF[e.type].air, r = ctlFoot(e.type), ok = (u, v) => !guns.some(b => ctlReach(b, e.type, u, v, CTRL.safe + r));
    let p0 = null;
    const ln = MAP_LANED && !air ? MAP.lanes[e.lane != null ? e.lane : laneAt(e.u, e.v)] : null, off = ln ? clamp(e.v - laneY(ln, e.u), -ln.width / 2, ln.width / 2) : 0;
    for (let k = 0; k <= 400; k++) { // step back toward the base along the lane it is in, keeping its place across the lane
      const u = clamp(e.u + back * k * 8, 0, L);
      let v = ln ? laneY(ln, u) + off : e.v;
      if (!air && NAV.on && navShut(u, v)) [, v] = navOpen(u, v);
      if (ok(u, v)) { p0 = [u, v]; break; }
      if ((u - B.u) * back >= 0) break; // reached the base without getting clear
    }
    if (!p0) p0 = [B.u, B.v];
    const p = ctlFree(T, air, r, p0[0], p0[1], ok);
    T.add(p[0], p[1], air, r);
    if (Math.hypot(p[0] - e.u, p[1] - e.v) <= CTRL.arrive) ctlHold(e, p[0], p[1]);
    else { e.po = { o: 'go', u: p[0], v: p[1], back: 1 }; e.holdU = undefined; e.holdV = undefined; } // back: holding fire on the way, like Retreat
  }
}
// Switch side s to direct control. An older match (a save from before v2.73) has its orders mapped onto the new ones:
// Hold holds where the unit stands, Attack attacks, Retreat and units sent home retreat to the base rally point, a Regroup
// walks to its flag and holds. A side already under direct control from a save of v2.73-v2.75 loses its lane flags and
// active lane (ctlTidy).
function directControl(g, s) {
  const side = g.sides[s]; if (side.direct) { ctlTidy(g, s); return false; }
  side.direct = true;
  const back = [];
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.side !== s || e.hp <= 0) continue;
    const ord = unitOrder(side, e.type, e.lane), st = e.medHome ? 'retreat' : ord ? ord.o : side.stance;
    if (st === 'attack') { e.po = { o: st }; e.holdU = undefined; e.holdV = undefined; }
    else if (st === 'retreat') back.push(e);
    else if (st === 'move') { const [su, sv] = slotOf(e, ord); if (ord.done) ctlHold(e, su, sv); else { e.po = { o: 'go', u: su, v: sv }; e.holdU = undefined; e.holdV = undefined; } }
    else ctlHold(e, e.holdU !== undefined ? e.holdU : e.u, e.holdV !== undefined ? e.holdV : e.v);
    e.medHome = 0; e.fwdHome = undefined; e.rwT = 0; e.rwGo = 0;
  }
  side.orders = newOrders(); side.stance = 'hold'; side.sel = null;
  delete side.rally; delete side.squad; delete side.laneNew;
  ctlRetreat(g, s, back);
  ctlTidy(g, s);
  return true;
}
// v2.76: a v2.73-v2.75 side's lane flags and active lane removed (units heading back to a flag head for the base rally
// point instead; units holding by a flag stay where they are), and the control groups created
function ctlTidy(g, s) {
  const side = g.sides[s];
  if (side.flags || side.active !== undefined) {
    delete side.flags; delete side.active; delete side.laneNew;
    ctlRetreat(g, s, g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && e.po && e.po.o === 'retreat'));
  }
  if (!Array.isArray(side.groups) || side.groups.length !== CTRL.groups) side.groups = Array.from({ length: CTRL.groups }, (_, k) => side.groups && Array.isArray(side.groups[k]) ? side.groups[k] : []);
}
function ctlRetreat(g, s, us) { // back to the base rally point, each to its own spot there
  if (!us.length) return;
  const B = ctlBase(s), P_ = ctlPack(g, s, us, B.u, B.v, false);
  for (const e of us) { const p = P_.get(e.id); e.po = { o: 'retreat', u: p[0], v: p[1] }; e.holdU = undefined; e.holdV = undefined; }
}
// A new unit on a direct side (spawnUnit): it holds where it appears until something else says otherwise
function ctlSpawn(g, e) { ctlHold(e, e.u, e.v); if (MAP_LANED) e.lane = laneAt(e.u, e.v); } // v2.76: in the lane where it stands
// A unit that appears elsewhere (arriveOrders: a warp-in, Brood, Mites, offspring): it holds where it appeared, stepping
// apart from units already there
function ctlArrive(g, e) { ctlHere(g, e); }
// A unit just trained (fr: a forward Barracks' spot from fwdRally, else null): it gathers at the base rally point and holds
// there; one from a forward Barracks gathers beside the building
function ctlTrained(g, e, fr) {
  e.fwdHome = undefined;
  const at = fr || ctlBase(e.side);
  ctlSettle(g, e, at.u, at.v);
  if (MAP_LANED) e.lane = fr ? fr.lane : laneAt(e.po.o === 'go' ? e.po.u : e.holdU, e.po.o === 'go' ? e.po.v : e.holdV);
}
// Where a forward Barracks' units appear on a direct side: beside the building, toward the enemy
const ctlFwdSpot = (g, s, b, lane, n) => ({ u: clamp(b.u + dirOf(s) * (b.half + 26), 0, L), v: b.v, lane, n });
// What a target order aims at: a unit or building of the other side, or a relic guard (cached per tick)
function ctlEnt(g, id) {
  if (!g._ctlIx || g._ctlIx.t !== g.t || g._ctlIx.n !== g.ents.length) { const m = new Map(); for (const e of g.ents) m.set(e.id, e); for (const x of g.guards || []) m.set(x.id, x); g._ctlIx = { t: g.t, n: g.ents.length, m }; }
  return g._ctlIx.m.get(id) || null;
}
const ctlSees = (g, s, T) => T.side === NEUTRAL || visibleTo(g, s, T);
function ctlCanHit(g, u, d, T) { // u could fire at T now (in range, a weapon that hurts it)
  if (!d.weapon || T.hp <= 0 || T.shielded || T.phT > g.t) return false;
  const air = T.kind === 'u' && !!UDEF[T.type].air;
  if (air ? !d.hitsAir : d.hitsGround === false) return false;
  if (!DMG[d.weapon][T.kind === 'b' ? 'building' : UDEF[T.type].armor]) return false;
  const dist = effDist(u, T);
  return dist <= (air && d.airRange ? d.airRange : d.range) && dist >= (d.minRange || 0);
}
// The order for a set of units (ids: unit ids, only side s's living units count). o: 'go' (a, b: the spot; the units spread
// around it), 'target' (a: the id of an enemy unit or building, or a relic guard, that side s can see), 'attack' (a: the
// lane to attack down on a lane map; left out, each unit's own lane), 'hold' or 'retreat'.
function command(g, s, ids, o, a, b) {
  if (g.over) return { ok: false, msg: 'The match is over' };
  if (g.countdown > 0) return WAIT_GO;
  const side = g.sides[s];
  if (!side.direct) return { ok: false, msg: 'Not under direct control' };
  if (!['go', 'target', 'attack', 'hold', 'retreat'].includes(o)) return { ok: false, msg: 'Unknown order' };
  const want = new Set(ids), us = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && want.has(e.id));
  if (!us.length) return { ok: false, msg: 'No units selected' };
  let T = null;
  if (o === 'go') {
    let u = a, v = b;
    if (!(u >= 0 && u <= L && Math.abs(v) <= (MAP_2D ? MAP.size.h / 2 : 220))) return { ok: false, msg: 'Target the battlefield' };
    if (NAV.on && navShut(u, v)) [u, v] = navOpen(u, v);
    const lane = laneAt(u, v), P_ = ctlPack(g, s, us, u, v, false);
    for (const e of us) { const p = P_.get(e.id); e.po = { o: 'go', u: p[0], v: p[1] }; e.holdU = undefined; e.holdV = undefined; if (lane != null) e.lane = lane; }
  } else if (o === 'target') {
    T = ctlEnt(g, a);
    if (!T || T.hp <= 0 || T.side === s || !ctlSees(g, s, T)) return { ok: false, msg: 'Pick an enemy you can see' };
    const lane = laneAt(T.u, T.v);
    for (const e of us) { e.po = { o: 'target', id: T.id, u: T.u, v: T.v }; e.holdU = undefined; e.holdV = undefined; if (lane != null && !UDEF[e.type].air) e.lane = lane; }
  } else if (o === 'attack') {
    const k = MAP_LANED && a != null ? a : null;
    if (MAP_LANED && a != null && !(a >= 0 && a < MAP.lanes.length)) return { ok: false, msg: 'Unknown lane' };
    for (const e of us) {
      e.po = { o }; e.holdU = undefined; e.holdV = undefined; if (!MAP_LANED) continue;
      e.lane = k != null ? k : laneAt(e.u, e.v);
      const ln = MAP.lanes[e.lane]; if (UDEF[e.type].air || Math.abs(e.v - laneY(ln, e.u)) <= ln.width / 2) continue;
      let ju = e.u, jv = laneY(ln, e.u); if (NAV.on && navShut(ju, jv)) [ju, jv] = navOpen(ju, jv); // v2.76: off that lane: first over to it
      e.po.ju = ju; e.po.jv = jv;
    }
  } else if (o === 'hold') { const P_ = ctlPack(g, s, us, 0, 0, true); for (const e of us) { const p = P_.get(e.id); if (Math.hypot(p[0] - e.u, p[1] - e.v) <= CTRL.arrive) ctlHold(e, p[0], p[1]); else { e.po = { o: 'go', u: p[0], v: p[1] }; e.holdU = undefined; e.holdV = undefined; } } }
  else { if (MAP_LANED) for (const e of us) e.lane = laneAt(e.u, e.v); ctlRetreat(g, s, us); } // back along the lane it is in
  lg(g, s, 'O', 'sel', us.length, o === 'go' ? 'move' : o);
  const n = us.length, who = `${n} unit${n === 1 ? '' : 's'}`;
  return { ok: true, n, msg: o === 'go' ? `${who}: moving` : o === 'target' ? `${who}: attacking the target` : o === 'hold' ? `${who}: holding position` : o === 'attack' ? `${who}: attacking down the ${MAP_LANED && a != null ? MAP.lanes[a].id + ' lane' : 'lane'}` : `${who}: retreating to the base` };
}
// Control groups (v2.76): slot k holds the ids of side s's units saved into it; dead units drop out, nothing is added
function setGroup(g, s, k, ids) {
  const side = g.sides[s]; if (!side.direct || !(k >= 0 && k < CTRL.groups)) return { ok: false, msg: 'No such group' };
  const want = new Set(ids), list = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && want.has(e.id)).map(e => e.id);
  if (!list.length) return { ok: false, msg: 'Select units first' };
  side.groups[k] = list;
  return { ok: true, n: list.length, msg: `Group ${k + 1}: ${list.length} unit${list.length === 1 ? '' : 's'}` };
}
function groupUnits(g, s, k) { // the group's living units (the dead are dropped from it)
  const side = g.sides[s], ids = side.groups && side.groups[k]; if (!ids || !ids.length) return [];
  const want = new Set(ids), out = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && want.has(e.id));
  if (out.length !== ids.length) side.groups[k] = ids.filter(id => out.some(e => e.id === id));
  return out;
}
// Healing at the base rally point: a direct side's units within CTRL.healR of it, unhurt for CTRL.calm s
function updateBaseHeal(g, dt) {
  for (let s = 0; s < 2; s++) {
    const side = g.sides[s]; if (!side.direct) continue;
    const B = ctlBase(s);
    for (const e of g.ents) {
      if (e.kind !== 'u' || e.side !== s || e.hp <= 0 || e.hp >= e.maxHp || g.t - e.lastHurt <= CTRL.calm) continue;
      if (Math.hypot(e.u - B.u, (e.v - B.v) * DY) > CTRL.healR) continue;
      const h0 = e.hp; e.hp = Math.min(e.maxHp, e.hp + e.maxHp * CTRL.heal * dt);
      if (g.log) g.log.tot[s].baseHeal = (g.log.tot[s].baseHeal || 0) + e.hp - h0;
    }
  }
}
// The direct-control part of a unit's tick (updateUnit). Returns what the unit does next: null (nothing special: hold,
// attack), or { go: [u, v] } (heading there, fighting what it meets), or { run: [u, v] } (retreating: holding fire), with
// want: a target in reach to fire at first.
function ctlStep(g, u, d) {
  const po = u.po, settle = () => { ctlHere(g, u); return u.po.o === 'go' ? { go: [u.po.u, u.po.v] } : null; };
  if (po.o === 'retreat') {
    if (po.u == null) { const B = ctlBase(u.side); po.u = B.u; po.v = B.v; }
    if (Math.hypot(po.u - u.u, po.v - u.v) > CTRL.arrive) return { run: [po.u, po.v] };
    ctlHold(u, po.u, po.v); return null;
  }
  if (po.o === 'attack') { // v2.76: crossing over to the lane picked, fighting what it meets; then down it
    if (Math.hypot(po.ju - u.u, po.jv - u.v) > CTRL.arrive * 3) return { go: [po.ju, po.jv] };
    delete po.ju; delete po.jv; return null;
  }
  if (po.o === 'go') {
    if (Math.hypot(po.u - u.u, po.v - u.v) > CTRL.arrive) return po.back ? { run: [po.u, po.v] } : { go: [po.u, po.v] };
    ctlHold(u, po.u, po.v); return null;
  }
  if (po.o === 'target') {
    const T = ctlEnt(g, po.id);
    if (!T || T.hp <= 0) { ctlFollow(g, u.side, po.id); return u.po.o === 'go' ? (u.po.back ? { run: [u.po.u, u.po.v] } : { go: [u.po.u, u.po.v] }) : null; } // dead: hold where it is, or just outside the enemy defences' reach (v2.80)
    if (ctlSees(g, u.side, T)) { po.u = T.u; po.v = T.v; return { go: [T.u, T.v], want: ctlCanHit(g, u, d, T) ? T : null, chase: T }; }
    if (Math.hypot(po.u - u.u, po.v - u.v) > CTRL.arrive + (d.range || 0) * 0.5) return { go: [po.u, po.v] }; // out of sight: where it was last seen
    return settle(); // gone from there
  }
  return null;
}
