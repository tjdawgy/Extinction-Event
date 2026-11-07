/* ---------- Creep (v2.18): Bloomhost's organic ground layer ----------
   Distance-based: each source owns one circular patch (world u, v) whose radius grows toward its target and recedes
   to nothing once the source is gone. Sources: the Hive, every other finished Bloomhost building, and each field
   node Bloomhost holds (creep there spreads faster). Creep only helps Bloomhost's own ground units: faster movement,
   and out-of-combat regeneration. It grants no vision and does nothing to enemies. All numbers live here. */
const CREEP = {
  hiveR: 260,    // target radius around the Hive
  bldR: 110,     // around every other finished Bloomhost building
  nodeR: 150,    // around a field node Bloomhost holds
  grow: 6,       // radius growth per second
  nodeGrow: 2,   // growth multiplier for a held node's creep
  recede: 9,     // radius lost per second once the source is sold, destroyed or the node is lost
  speed: 1.2,    // movement multiplier for Bloomhost ground units on their own creep
  regen: 0.015,  // share of max HP regained per second on creep, out of combat only
  calm: 5,       // out of combat: no damage taken and no attack made for this many seconds
};
/* ---------- Power field (v2.26): the Axiarchs' Warp Matrix ----------
   Built on the creep zone code (zoneStep). Sources: the Axis (the base field; every finished Continuum Spire enlarges it)
   and each field node the Axiarchs hold (a forward field around the node). It grows and recedes gradually. Inside their
   own field, Axiarch shields recharge faster and units can warp in; nothing else depends on it. No vision. */
const FIELD = {
  axisR: 230,    // base field radius around the Axis
  spireAdd: 40,  // added to the base field by each finished Continuum Spire
  maxR: 400,     // the base field's largest radius
  nodeR: 140,    // forward field around a node the Axiarchs hold
  grow: 7,       // radius growth per second
  nodeGrow: 1.5, // growth multiplier for a node's field
  recede: 10,    // radius lost per second once the source is gone (the node lost, the Axis destroyed)
  regen: 0.25,   // shield recharge inside the field: share of max per second (outside: SHIELD.rate)
  front: 0.85,   // the default warp point sits this far out along the field's front edge
};
const WARP = { ch: 2, clear: 26, step: 18, rings: 7 }; // warp-in: 2 s channel; keeps 26 clear of enemies; searches rings 18 apart
const onField = (g, s, u, v) => { for (const p of g.field[s]) { const du = u - p.u, dv = v - p.v; if (du * du + dv * dv <= p.r * p.r) return true; } return false; };
function updateField(g, dt) {
  for (let s = 0; s < 2; s++) {
    const ax = facOf(g.sides[s].faction) === 'axiarchs', list = g.field[s];
    if (!ax && !list.length) continue;
    const want = new Map();
    if (ax) {
      const hq = g.sides[s].hq;
      if (hq.hp > 0) { const n = g.ents.filter(b => b.kind === 'b' && b.side === s && b.type === 'habitat' && b.built && b.hp > 0).length; want.set('axis', { u: hq.u, v: hq.v, R: Math.min(FIELD.maxR, FIELD.axisR + FIELD.spireAdd * n), node: false }); }
      for (const n of g.nodes) if (n.owner === s) want.set('n' + n.id, { u: n.u, v: n.v || 0, R: FIELD.nodeR, node: true });
      for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && UDEF[e.type].node) want.set('vc' + e.id, { u: e.u, v: clamp(e.v, -LANE_V, LANE_V), R: UDEF[e.type].node.r, node: true }); // P9 (v2.37): a Voidcarrier's field
      const bk = beaconOf(g, s); // the Phase Beacon's bubble (v2.34): wanted unless collapsed; it forms at the anchor
      if (bk && !(bk.col > g.t)) { if (bk.au === undefined) beaconAnchor(g, s, bk); want.set('beacon', { u: bk.au, v: bk.av, R: FIELD.nodeR * (bk.tier >= 2 ? BEACON.r2 : 1), node: true }); }
    }
    g.field[s] = zoneStep(list, want, FIELD, dt);
    if (ax) moveBeacon(g, s, dt);
    if (ax) carrierFields(g, s);
    const sd = g.sides[s]; // a chosen warp point outside the field snaps back to the default
    if (sd.warp && !onField(g, s, sd.warp.u, sd.warp.v)) { sd.warp = null; ev(g, { type: 'warpSnap', side: s }); }
  }
}
// P9 (v2.37): each Voidcarrier's field moves with it (it grows like a node's field once it appears); when the carrier dies
// the field collapses at once, with the Phase Beacon's shatter. Warp-ins use it like any field: the default warp point sits
// at the front edge of the frontmost patch, so with a carrier at the front, units warp in near it (the AI included).
function carrierFields(g, s) {
  const list = g.field[s]; let gone = false;
  for (const p of list) {
    if (p.k[0] !== 'v' || p.k[1] !== 'c') continue;
    const id = +p.k.slice(2), e = g.ents.find(x => x.id === id);
    if (e && e.hp > 0) { p.u = e.u; p.v = clamp(e.v, -LANE_V, LANE_V); continue; }
    gone = true; p.r = 0; p.R = 0;
    if (p.rr === undefined) { const w = P(p.u, p.v); g.fx.push({ k: 'shatter', side: s, u: p.u, v: p.v, r: Math.max(20, p.r0 || 60), x: w.x, y: w.y, t: 0, life: 1.2 }); p.rr = 1; }
  }
  for (const p of list) if (p.k[0] === 'v' && p.k[1] === 'c') p.r0 = p.r;
  if (gone) g.field[s] = list.filter(p => !(p.k[0] === 'v' && p.k[1] === 'c' && p.R === 0 && p.r === 0));
}
/* ---------- Phase Beacon (v2.34) ---------- */
const beaconOf = (g, s) => facOf(g.sides[s].faction) === 'axiarchs' ? sigOf(g, s, 'sigA') : null;
const relOf = (g, s) => facOf(g.sides[s].faction) === 'axiarchs' ? sigOf(g, s, 'sigB') : null;
const beaconPatch = (g, s) => g.field[s].find(p => p.k === 'beacon') || null;
const inBeacon = (g, s, u, v) => { const p = beaconPatch(g, s); if (!p || p.r <= 0) return false; const du = u - p.u, dv = v - p.v; return du * du + dv * dv <= p.r * p.r; };
// The anchor: the frontmost (closest to the enemy HQ) living Axiarch ground unit; none: the frontmost unit of any kind; none: the Beacon
function beaconAnchor(g, s, bk) {
  const dir = dirOf(s); let best = null, air = null;
  for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0) { if (UDEF[e.type].air) { if (!air || dir * e.u > dir * air.u) air = e; } else if (!best || dir * e.u > dir * best.u) best = e; }
  const a = best || air;
  bk.au = a ? a.u : bk.u; bk.av = a ? clamp(a.v, -LANE_V, LANE_V) : 0; bk.anc = a ? a.id : 0; bk.at = g.t + BEACON.every;
}
function moveBeacon(g, s, dt) {
  const bk = beaconOf(g, s), p = beaconPatch(g, s);
  if (!bk || !p || bk.col > g.t) return;
  if (!(g.t < bk.at)) beaconAnchor(g, s, bk); // re-picked once a second
  const du = bk.au - p.u, dv = bk.av - p.v, d = Math.hypot(du, dv), st = BEACON.move * dt; // the bubble glides to it
  if (d <= st) { p.u = bk.au; p.v = bk.av; } else { p.u += du / d * st; p.v += dv / d * st; }
  // collapse: the side's own units inside lose BEACON.loss of their combined shields plus health within BEACON.window seconds
  const prev = bk.bp || {}, now = {}; let lost = 0, have = 0;
  for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && inBeacon(g, s, e.u, e.v)) { const v = e.hp + (e.shp || 0); now[e.id] = v; have += v; if (prev[e.id] !== undefined) lost += Math.max(0, prev[e.id] - v); }
  for (const id in prev) if (now[id] === undefined && !g.ents.some(e => e.id === +id && e.hp > 0)) lost += prev[id]; // died inside
  bk.bp = now;
  const hist = (bk.bl || []).filter(h => g.t - h[0] < BEACON.window); if (lost > 0) hist.push([g.t, lost]); bk.bl = hist;
  const sum = hist.reduce((a, h) => a + h[1], 0);
  if (sum > 0 && sum >= BEACON.loss * (have + sum)) {
    bk.col = g.t + BEACON.down; bk.bl = []; bk.bp = {}; bk.au = undefined;
    const w = P(p.u, p.v); g.fx.push({ k: 'shatter', side: s, u: p.u, v: p.v, r: p.r, x: w.x, y: w.y, t: 0, life: 1.2 });
    g.field[s] = g.field[s].filter(q => q !== p); // collapsed: gone at once
    ev(g, { type: 'beaconDown', side: s, seen: !!g.fog && cellsLit(g.fog[1 - s].vis, p.u, p.r) });
    if (g.log) g.log.tot[s].bkDown = (g.log.tot[s].bkDown || 0) + 1;
  }
}
/* ---------- Echo Reliquary (v2.34): echoes live on the Reliquary (rel.ech, oldest first) ---------- */
function echoStore(g, e) {
  const d = UDEF[e.type];
  if (e.temp || e.echo || d.tier < 2 || facOf(d.fac) !== 'axiarchs') return;
  const rel = relOf(g, e.side); if (!rel) return;
  const L0 = rel.ech || (rel.ech = []); L0.push(e.type);
  while (L0.length > ECHO.n[rel.tier]) L0.shift(); // full: the oldest gives way
}
const echoCost = type => ({ c: Math.round(UDEF[type].cost.c * ECHO.cost), e: Math.round(UDEF[type].cost.e * ECHO.cost) });
function tryEcho(g, s, i) {
  const rel = relOf(g, s), side = g.sides[s];
  if (g.over) return { ok: false, msg: 'The match is over' };
  if (g.countdown > 0) return WAIT_GO;
  if (!rel || !rel.ech || !rel.ech[i]) return { ok: false, msg: 'No such echo' };
  const type = rel.ech[i], d = UDEF[type], k = echoCost(type), cap = popCap(g, s);
  if (popUsed(g, s) + d.pop > cap) return { ok: false, msg: cap >= POP_MAX ? 'Army is at maximum size' : `Army is full — build or upgrade a ${bdS(g, s, 'habitat').name}` };
  if (side.res.c < k.c) return { ok: false, msg: `Need ${Math.ceil(k.c - side.res.c)} more credits` };
  if (side.res.e < k.e) return { ok: false, msg: `Need ${Math.ceil(k.e - side.res.e)} more energy` };
  side.res.c -= k.c; side.res.e -= k.e; logSpend(g, s, 'u', k.c, k.e);
  rel.ech.splice(i, 1); // consumed as the warp starts
  startWarp(g, s, type, { echo: 1, paid: k.c });
  if (g.log) g.log.tot[s].echoes = (g.log.tot[s].echoes || 0) + 1;
  return { ok: true, msg: `${d.name}: echo warping in` };
}
// The default warp point: the front edge of the field, the point furthest toward the enemy along the lane
function defaultWarp(g, s) {
  const dir = dirOf(s); let best = null, bf = -1e9;
  for (const p of g.field[s]) { if (p.r < 20) continue; const u = p.u + dir * p.r * FIELD.front; if (dir * u > bf) { bf = dir * u; best = { u: clamp(u, 0, L), v: clamp(p.v, -LANE_V, LANE_V) }; } }
  return best || axisSpot(g, s);
}
const axisSpot = (g, s) => { const hq = g.sides[s].hq; return { u: hq.u + dirOf(s) * (hq.half + 12), v: hq.v }; };
const warpPoint = (g, s) => { const sd = g.sides[s]; return sd.warp && onField(g, s, sd.warp.u, sd.warp.v) ? sd.warp : defaultWarp(g, s); };
// Place side s's warp point (the player's "Set warp point"): only inside its own field
function setWarp(g, s, u, v) {
  if (facOf(g.sides[s].faction) !== 'axiarchs') return { ok: false, msg: 'Only the Axiarchs warp in units' };
  if (Math.abs(v) > LANE_V + 20 || u < 0 || u > L || !onField(g, s, u, v)) return { ok: false, msg: 'Place it inside your power field' };
  g.sides[s].warp = { u, v: clamp(v, -LANE_V, LANE_V) };
  return { ok: true, msg: 'Warp point set' };
}
// A spot is valid for a warp: on the lane, inside the field, clear of enemies, of every building and of other warps
function warpOk(g, s, u, v, taken) {
  if (u < 0 || u > L || Math.abs(v) > LANE_V || !onField(g, s, u, v)) return false;
  for (const e of g.ents) {
    if (e.hp <= 0) continue;
    if (e.kind === 'b') { if (Math.hypot(e.u - u, e.v - v) < e.half + 12) return false; }
    else if (e.side !== s && Math.hypot(e.u - u, e.v - v) < WARP.clear) return false;
  }
  for (const w of g.warps) if (Math.hypot(w.u - u, w.v - v) < WARP.step) return false; // two warps never share a spot
  if (taken) for (const w of taken) if (Math.hypot(w.u - u, w.v - v) < WARP.step) return false; // nor two units of one Mass Warp (v2.28)
  return true;
}
// The nearest valid spot to (u, v), searching outward in rings; none: the Axis
function warpSpot(g, s, u, v, taken) {
  for (let i = 0; i <= WARP.rings; i++) {
    const n = i ? 8 * i : 1;
    for (let j = 0; j < n; j++) { const a = j / n * Math.PI * 2, pu = u + Math.cos(a) * i * WARP.step, pv = v + Math.sin(a) * i * WARP.step; if (warpOk(g, s, pu, pv, taken)) return { u: pu, v: pv }; }
  }
  return axisSpot(g, s);
}
// A finished unit starts its warp: a channel of WARP.ch seconds at a valid spot near the warp point. It is already paid
// for and counts toward supply until it arrives (popUsed).
function startWarp(g, s, type, extra) { // extra: an echo's flags (v2.34)
  RNG.g = g; // v2.50: roll from this match's stream (these can run from the UI, between ticks)
  const w = warpPoint(g, s), p = warpSpot(g, s, w.u, w.v);
  g.warps.push(Object.assign({ side: s, type, u: p.u, v: p.v, t0: g.t, end: g.t + WARP.ch }, extra));
}
// Gravemantle aura and Eventide pulse (v2.27)
const pullOk = (g, u, v) => u >= 0 && u <= L && Math.abs(v) <= LANE_V && !g.ents.some(b => b.kind === 'b' && b.hp > 0 && Math.hypot(b.u - u, b.v - v) < b.half + 8);
function updateAuras(g) {
  for (const a of g.ents) {
    if (a.kind !== 'u' || a.hp <= 0) continue;
    const d = UDEF[a.type];
    if (d.aura) for (const e of g.ents) if (e.kind === 'u' && e.side !== a.side && e.hp > 0 && !UDEF[e.type].air && Math.hypot(e.u - a.u, (e.v - a.v) * 0.6) <= d.aura.r) slowU(g, e, d.aura.slow, SLOW.dur);
    if (d.pulse && g.t >= a.pulseCd) {
      const near = g.ents.filter(e => e.kind === 'u' && e.side !== a.side && e.hp > 0 && !UDEF[e.type].air && !e.leaping && !e.siege && Math.hypot(e.u - a.u, e.v - a.v) <= d.pulse.r);
      if (!near.length) continue;
      a.pulseCd = g.t + d.pulse.cd;
      for (const e of near) { // inward by up to pull, never closer than 24, never into a building or off the lane (half the pull, else none)
        const du = a.u - e.u, dv = a.v - e.v, dd = Math.hypot(du, dv), k = Math.min(d.pulse.pull, Math.max(0, dd - 24));
        if (k <= 0) continue;
        for (const f of [1, 0.5]) { const nu = e.u + du / dd * k * f, nv = e.v + dv / dd * k * f; if (pullOk(g, nu, nv)) { e.u = nu; e.v = nv; break; } }
      }
      const w = P(a.u, a.v); g.fx.push({ k: 'pull', x: w.x, y: w.y, r: d.pulse.r, t: 0, life: 0.6 });
    }
  }
}
function updateWarps(g) {
  if (!g.warps.length) return;
  const done = g.warps.filter(w => g.t >= w.end);
  if (!done.length) return;
  g.warps = g.warps.filter(w => g.t < w.end);
  for (const w of done) {
    const p = warpOk(g, w.side, w.u, w.v) ? w : warpSpot(g, w.side, w.u, w.v); // something moved onto the spot: the nearest valid one, else the Axis
    const nu = spawnUnit(g, w.side, w.type, p.u, p.v); nu.laneV = clamp(p.v, -LANE_V, LANE_V); arriveOrders(g, nu);
    if (w.echo) { nu.echo = 1; nu.paid = w.paid; const rel = relOf(g, w.side); if (rel && rel.tier >= 3) { nu.osh = nu.maxShp * ECHO.osh; nu.oshT = g.t + ECHO.oshDur; } } // recovered (v2.34)
    const bk = beaconOf(g, w.side); if (bk && bk.tier >= 3 && inBeacon(g, w.side, nu.u, nu.v)) { nu.shp = nu.maxShp; nu.bkT = g.t + BEACON.dmgDur; } // arrived in a T3 Beacon bubble (v2.34)
    if (g.log) { logAdd(g.log.tot[w.side].trained, w.type); lgUnit(g, w.side, 'T', w.type); }
  }
}
const CREEP_ROOT = Object.assign({}, CREEP, { grow: CREEP.grow * ROOT.grow }); // a Rootheart's faster growth (v2.33)
const onCreep = (g, s, u, v) => { for (const p of g.creep[s]) { const du = u - p.u, dv = v - p.v; if (du * du + dv * dv <= p.r * p.r) return true; } return false; };
// One zone step (creep v2.18, the power field v2.26): each wanted source keeps or gains a patch whose radius grows toward its
// target R; a patch whose source is gone recedes to nothing and is dropped. C: grow, nodeGrow, recede.
function zoneStep(list, want, C, dt) {
  for (const p of list) { const w = want.get(p.k); p.R = w ? w.R : 0; want.delete(p.k); }
  for (const [k, w] of want) list.push({ k, u: w.u, v: w.v, r: 0, R: w.R, node: w.node });
  let gone = false;
  for (const p of list) {
    if (p.r < p.R) p.r = Math.min(p.R, p.r + C.grow * (p.node ? C.nodeGrow : 1) * dt);
    else if (p.r > p.R) { p.r = Math.max(p.R, p.r - C.recede * dt); if (p.r <= 0) gone = true; }
  }
  return gone ? list.filter(p => p.r > 0 || p.R > 0) : list;
}
function updateCreep(g, dt) {
  for (let s = 0; s < 2; s++) {
    const bh = facOf(g.sides[s].faction) === 'bloomhost', list = g.creep[s];
    if (!bh && !list.length) continue;
    const want = new Map();
    if (bh) {
      const k = rootOf(g, s) ? ROOT.reach : 1; // the Rootheart (v2.33)
      for (const b of g.ents) if (b.kind === 'b' && b.side === s && b.built && b.hp > 0) want.set('b' + b.id, { u: b.u, v: b.v, R: (b.type === 'hq' ? CREEP.hiveR : CREEP.bldR) * k, node: false });
      for (const n of g.nodes) if (n.owner === s) want.set('n' + n.id, { u: n.u, v: n.v, R: CREEP.nodeR * k, node: true });
    }
    g.creep[s] = zoneStep(list, want, bh && rootOf(g, s) ? CREEP_ROOT : CREEP, dt);
  }
  // Out-of-combat regeneration on creep; never stacks: with a faster heal running (a Medicopter), that one applies
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.hp <= 0 || e.hp >= e.maxHp || UDEF[e.type].fac !== 'bloomhost' || UDEF[e.type].air) continue;
    if (g.t - e.lastHurt < CREEP.calm || g.t - e.lastAct < CREEP.calm || !onCreep(g, e.side, e.u, e.v)) continue;
    const other = e.medAt === g.t ? UDEF.medic.heal : 0, rg = creepRegen(g, e.side);
    e.creepAt = g.t;
    if (rg > other) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * (rg - other) * dt);
  }
}
// The Flame Tank: every enemy on the ground in a strip ahead of it (range × 2 · strip wide) takes the burst; nothing lingers.
// v2.36 (audit): the strip is centred on the chosen target's sideways position (t), so a target picked off to the side is
// burned too (before, it took nothing and the tank fired at it forever). FLAME.aim false: the strip stays on the tank's line.
const FLAME = { aim: true };
function flameBurst(g, src, def, t) {
  const dir = src.face || dirOf(src.side), dmg = def.dmg * (g.sides[src.side].buff ? NANO.dmg : 1) * outMul(g, src), cv = FLAME.aim && t ? t.v : src.v;
  for (const e of g.ents) {
    if (e.side === src.side || e.hp <= 0 || (e.kind === 'u' && UDEF[e.type].air) || e.shielded) continue;
    const ahead = (e.u - src.u) * dir, reach = def.range + (e.kind === 'b' ? e.half : 0);
    if (ahead < -6 || ahead > reach || Math.abs(e.v - cv) > def.strip + (e.kind === 'b' ? e.half : 0)) continue;
    damage(g, e, dmg, 'flame', src.side, src);
  }
  if (src.kind === 'u') src.recoil = 1;
}
function muzzle(src) {
  if (src.kind === 'b') return src.type === 'turret' ? { u: src.u, v: src.v, z: 38 * BS } : src.type === 'bunker' ? { u: src.u, v: src.v, z: 20 * BS } : { u: src.u, v: src.v - 8 * BS, z: 79 * BS };
  const m = MUZ[src.type];
  return { u: src.u + src.face * m[0] * US, v: src.v, z: (src.z || 0) + m[1] * US };
}
function aimZ(e) {
  if (e.kind === 'b') return e.h * 0.45;
  const d = UDEF[e.type];
  return d.air ? e.z : d.h * 0.5 * US;
}

// Melee (v2.17): the blow lands at once. A Skitterling hits harder for every other Skitterling on the same target.
// Disrupted (v2.27, the Parallax): a unit deals less damage for a short time; the strongest wins, never past DISRUPT.cap
const outMul = (g, src) => src.kind !== 'u' ? 1 : (src.disT > g.t ? 1 - src.dis : 1) * (src.bkT > g.t ? 1 + BEACON.dmg : 1); // disrupted (v2.27); a Beacon T3 warp-in (v2.34)
function disrupt(g, e, c) {
  if (e.kind !== 'u' || e.hp <= 0) return;
  const live = e.disT > g.t;
  e.dis = Math.min(DISRUPT.cap, Math.max(live ? e.dis : 0, c.amt)); e.disT = Math.max(live ? e.disT : 0, g.t + c.dur);
}
// Slowed (v2.27, the Gravemantle): the same rule; slows never stack, the strongest applies, never past SLOW.cap
function slowU(g, e, amt, dur, kind) { // kind: 'creep' for a Rootheart's (v2.33; drawn differently)
  if (e.kind !== 'u' || e.hp <= 0 || UDEF[e.type].air) return;
  const live = e.slowT > g.t;
  if (kind || e.slowK) { if (!live || amt >= e.slow) e.slowK = kind || null; } // which slow is the one that applies
  e.slow = Math.min(SLOW.cap, Math.max(live ? e.slow : 0, amt)); e.slowT = Math.max(live ? e.slowT : 0, g.t + dur);
}
function meleeHit(g, src, t, def) {
  let mul = 1;
  if (def.swarm) {
    let n = 0;
    for (const e of g.ents) if (e !== src && e.kind === 'u' && e.side === src.side && e.type === src.type && e.tgt === t.id && e.hp > 0) n++;
    mul += Math.min(def.swarm.max, n * def.swarm.per);
  }
  if (src.kid) mul *= SPAWN.dmg; // a Cloudwing's offspring bites for half (v2.21)
  mul *= outMul(g, src); // disrupted (v2.27), a Beacon T3 warp-in (v2.34)
  damage(g, t, def.dmg * mul, def.weapon, src.side, src);
  if (def.disrupt) disrupt(g, t, def.disrupt); // the Parallax's blows (v2.27)
  if (src.kind === 'u') src.recoil = 1;
}
function fire(g, src, t, def) {
  RNG.g = g; // v2.50: roll from this match's stream (these can run from the UI, between ticks)
  if (src.kind === 'u') src.lastAct = g.t; // in combat (creep regen waits, v2.18)
  if (def.weapon === 'flame') { flameBurst(g, src, def, t); return; }
  if (def.melee) { meleeHit(g, src, t, def); return; }
  if (def.beam) { // the Null Lance (v2.25): the beam lands at once; the SIM leaves a short beam mark for the renderer
    const m = muzzle(src), a = P(m.u, m.v, m.z), b = P(t.u, t.v, aimZ(t));
    damage(g, t, def.dmg * (g.sides[src.side].buff ? NANO.dmg : 1) * outMul(g, src), def.weapon, src.side, src);
    const hq = def.weapon === 'hqbeam' || def.weapon === 'sovereign'; // the Axis lance (v2.36), the Sovereign's judgement (v2.37): heavier, violet and cyan
    g.fx.push({ k: 'beam', x: a.x, y: a.y, x2: b.x, y2: b.y, t: 0, life: hq ? 0.34 : def.weapon === 'horizon' ? 0.32 : 0.2, w: def.weapon === 'sovereign' ? 5 : hq ? 3.6 : def.weapon === 'horizon' ? 3.2 : def.split ? 1.5 : 2.2, hq });
    if (def.chain) chainBeam(g, src, t, def); // the Shardstorm (v2.29)
    return;
  }
  const m = muzzle(src);
  let mul = 1; // v2.37: the Lancer's focus (P14), a planted Titan against buildings (P8)
  if (def.focus && src.kind === 'u') { src.fcN = src.fcTgt === t.id ? Math.min(def.focus.max, (src.fcN || 0) + 1) : 0; src.fcTgt = t.id; mul = 1 + def.focus.per * src.fcN; }
  if (def.siege && src.siege === 2 && t.kind === 'b') mul = def.siege.bmul;
  if (def.salvo || def.carpet) { volley(g, src, t, def, m); if (src.kind === 'u') src.recoil = 1; return; } // P1, P10
  const p = { u: m.u, v: m.v, z: m.z, pu: m.u, pv: m.v, pz: m.z, tu: t.u, tv: t.v, tz: aimZ(t), target: t, side: src.side,
    weapon: def.weapon, dmg: def.dmg * mul * (g.sides[src.side].buff ? NANO.dmg : 1) * (src.vet ? DRILL.dmg : 1) * outMul(g, src), splash: def.splash || 0, t: 0 }; // disrupted: less damage (v2.27)
  if (def.focus) p.fc = src.fcN; // drawn brighter as it builds (v2.37)
  if (def.pierce) { p.ou = m.u; p.ov = m.v; p.pierce = 1; } // P4: where the line starts
  if (def.devour) p.dev = src.id; // P11: who feeds on the damage
  if (def.weapon === 'bomb' || def.drop) { p.target = null; p.tz = 0; p.tu = t.u + rand(-6, 6); p.tv = t.v + rand(-5, 5); } // falls where the target is now
  if (def.corrode) p.corr = def.corrode; // v2.19: acid corrodes what it hits
  if (def.acid) p.acid = def.acid === 'dist' ? 'dist' : 1; // the Worldbreaker's distortion zones share the acid-pool list (v2.27)
  if (def.weapon === 'shell' || def.lob) { // the Bile Lobber reuses the Artillery shell (v2.19)
    p.su = m.u; p.sv = m.v; p.sz = m.z;
    if (def.precise) { p.tu = t.u; p.tv = t.v; p.precise = 1; } else { p.tu = t.u + rand(-14, 14); p.tv = t.v + rand(-12, 12); } p.tz = 0; // P3: the Rift Mortar lands exactly
    const dd = Math.hypot(p.tu - p.su, p.tv - p.sv);
    p.T = 0.7 + dd / 520; p.arc = 60 + dd * 0.3; p.target = null;
  } else p.speed = PSPEED[def.weapon];
  g.projs.push(p);
  const w = P(m.u, m.v, m.z);
  g.fx.push({ k: 'flash', x: w.x, y: w.y, t: 0, life: 0.07, r: def.weapon === 'rifle' || def.weapon === 'flak' ? 4 : 8 });
  if (src.kind === 'u') src.recoil = 1;
}

// P1 (Artillery salvo) and P10 (Leviathan carpet bombing), v2.37: several projectiles from one shot. A salvo scatters its
// shells around the target and they land one after another (gap); a carpet lays its bombs in a line along the lane,
// centred on the target, in the direction the bomber faces.
function volley(g, src, t, def, m) {
  const V = def.salvo || def.carpet, dmg = def.dmg * (g.sides[src.side].buff ? NANO.dmg : 1) * outMul(g, src) / (def.salvo ? V.n : 1), dir = src.face || dirOf(src.side);
  for (let i = 0; i < V.n; i++) {
    const p = { u: m.u, v: m.v, z: m.z, pu: m.u, pv: m.v, pz: m.z, target: null, side: src.side, weapon: def.weapon, dmg, splash: def.splash || 0, t: 0, tz: 0 };
    if (def.salvo) {
      p.su = m.u; p.sv = m.v; p.sz = m.z; p.tu = t.u + rand(-V.spread, V.spread); p.tv = t.v + rand(-V.spread, V.spread) * 0.8;
      const dd = Math.hypot(p.tu - p.su, p.tv - p.sv); p.T = 0.7 + dd / 520 + i * V.gap; p.arc = 60 + dd * 0.3; p.salvo = 1;
    } else { p.tu = t.u + dir * (i - (V.n - 1) / 2) * V.gap + rand(-4, 4); p.tv = t.v + rand(-5, 5); p.speed = PSPEED[def.weapon]; p.carpet = 1; }
    g.projs.push(p);
  }
  const w = P(m.u, m.v, m.z); g.fx.push({ k: 'flash', x: w.x, y: w.y, t: 0, life: 0.07, r: 8 });
}

