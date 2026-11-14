/* ---------- Test Range (v2.81, docs/FACTION_REWORK.md batch 1): a sandbox on the real SIM ----------
   A Test Range field is an ordinary game (newGame on Classic) stepped by the ordinary update, with the parts a fight study
   doesn't want taken out: no HQs (kept off the map and out of g.ents, so the game never ends), no pads in use, no field
   nodes, no storm (g.noStorm), no fog (g.range: both sides see everything), both AIs idle and both sides under direct
   control (docs/CONTROLS.md), so every unit follows the real orders. Units and buildings are placed with rangeUnits and
   rangeBuilding. Each side has a mode (side.mode): 'attack' (rangeOrders: every unit not already after a living target is
   sent at the nearest enemy it can hurt with the real target order, so it fights what it meets on the way) or 'hold' (the
   real Hold). side.hush: the side's units and guns don't act at all (a side that doesn't fight back, so the other side's
   attack can be studied alone); side.manual: the player commands it with the game's own controls. rangeStep is one SIM
   tick (the orders every RANGE.every ticks); everything draws from the game's seeded streams, so the same records placed
   in the same order with the same seed replay tick for tick (Reset). g.range, side.hush, side.mode and side.manual are
   never set in a match: matches play exactly as before. */
const RANGE = { map: 'classic', seed: 20261113, every: 30, away: -4000, spot: [640, 1060], follow: 70 };
const rangeFac = t => UDEF[t].fac || DEFAULT_FACTION; // the faction a unit type belongs to
const rangeTypes = fac => Object.keys(UDEF).filter(t => rangeFac(t) === fac); // every unit of a faction, read at run time
const RANGE_B = ['turret', 'refinery']; // the target buildings: each faction's defence and its economy building
function rangeGame(o = {}) { // o: { seed, factions: [blue, red] }
  const g = newGame('normal', { map: RANGE.map, seed: o.seed ?? RANGE.seed, factions: o.factions, countdown: 0 });
  g.range = true; g.noStorm = true; g.nodes = []; g.rk = 0; g.wipe = null; g.had = [false, false];
  for (let s = 0; s < 2; s++) {
    const sd = g.sides[s];
    sd.hq.u = RANGE.away; sd.hq.v = 0; // no HQ: off the map (an Axiarch side's base field forms out there, out of reach)
    sd.aiT = 1e9; sd.mode = 'hold'; sd.hush = false; sd.manual = false; sd.slots.fill(null);
    directControl(g, s);
  }
  g.ents = g.ents.filter(e => e.type !== 'hq');
  for (const f of g.fog) f.ghosts = {};
  updateVision(g);
  return g;
}
// n units of type for side s, spread around (u, v) as units gather in a match (ctlPack: each its own spot), holding there
function rangeUnits(g, s, type, u, v, n = 1) {
  RNG.g = g;
  const us = [];
  for (let i = 0; i < n; i++) us.push(spawnUnit(g, s, type, u, v));
  const P_ = ctlPack(g, s, us, u, v, false);
  for (const e of us) { const p = P_.get(e.id); e.u = p[0]; e.v = p[1]; ctlHold(e, p[0], p[1]); }
  return us;
}
// One unit exactly at (u, v), holding there (a Reset places each recorded unit this way)
function rangeUnit(g, s, type, u, v) { RNG.g = g; const e = spawnUnit(g, s, type, u, v); ctlHold(e, u, v); return e; }
// A finished T1 building of a faction's role for side s at (u, v): no pad, no cost
function rangeBuilding(g, s, fac, role, u, v) {
  RNG.g = g;
  const sd = g.sides[s], f0 = sd.faction;
  sd.faction = fac; const b = mkBuilding(g, s, role, -1); sd.faction = f0;
  b.u = u; b.v = v; b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp;
  return b;
}
function rangeRemove(g, e) { e.hp = 0; e.dead = true; g.ents = g.ents.filter(x => x !== e); } // gone, as if never placed (no kill, no salvage)
const rangeHurts = (d, e) => { // can a unit of definition d hurt e at all (its weapon, air or ground, the damage table)?
  if (!d.weapon || e.hp <= 0) return false;
  const air = e.kind === 'u' && !!UDEF[e.type].air;
  if (air ? !d.hitsAir : d.hitsGround === false) return false;
  return !!DMG[d.weapon][e.kind === 'b' ? 'building' : UDEF[e.type].armor];
};
// Attack for side s: each unit not after a living target goes for the nearest enemy it can hurt (the real target order);
// a unit with nothing to hurt holds; an unarmed one (Medicopter, Recon Drone) stays with the nearest armed unit of its side
function rangeOrders(g, s) {
  const sd = g.sides[s];
  if (sd.hush || sd.manual || sd.mode !== 'attack') return;
  const foes = g.ents.filter(e => e.side !== s && e.hp > 0), mine = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0);
  for (const e of mine) {
    const d = UDEF[e.type];
    if (e.po && e.po.o === 'target') { const T = ctlEnt(g, e.po.id); if (T && T.hp > 0) continue; }
    if (!d.weapon) {
      let m = null, md = 1e9;
      for (const f of mine) if (UDEF[f.type].weapon) { const k = Math.hypot(f.u - e.u, f.v - e.v); if (k < md) { md = k; m = f; } }
      if (m && md > RANGE.follow) ctlSettle(g, e, m.u, m.v);
      continue;
    }
    let T = null, bd = 1e9;
    for (const f of foes) { if (!rangeHurts(d, f)) continue; const k = Math.hypot(f.u - e.u, f.v - e.v); if (k < bd) { bd = k; T = f; } }
    if (T) { e.po = { o: 'target', id: T.id, u: T.u, v: T.v }; e.holdU = undefined; e.holdV = undefined; }
    else if (!e.po || e.po.o !== 'hold') ctlHere(g, e);
  }
}
function rangeMode(g, s, m) { // a side's mode now: Hold stops every unit where it is (the real Hold); Attack sends them at once
  const sd = g.sides[s]; sd.mode = m;
  if (sd.manual || sd.hush) return;
  if (m === 'hold') { const ids = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0).map(e => e.id); if (ids.length) command(g, s, ids, 'hold'); }
  else rangeOrders(g, s);
}
const rangeCount = (g, s) => { let n = 0; for (const e of g.ents) if (e.side === s && e.hp > 0) n++; return n; };
function rangeStep(g) { // one SIM tick of a Test Range game
  if (g.rk++ % RANGE.every === 0) { rangeOrders(g, 0); rangeOrders(g, 1); }
  update(g, TICK);
  const n = [rangeCount(g, 0), rangeCount(g, 1)];
  for (let s = 0; s < 2; s++) if (n[s]) g.had[s] = true;
  if (n[0] && n[1]) g.wipe = null; // (more were placed after a wipe)
  else if (!g.wipe && g.had[0] && g.had[1]) g.wipe = { t: g.t, side: n[0] ? 1 : 0 }; // the side wiped out, and when
}
function rangeRead(g) { // the readout: damage dealt (HP and shields), kills (units and buildings), what is left, the wipe
  const S = g.stats && g.stats.sides, bl = s => S ? Object.values(S[s].bLost || {}).reduce((a, x) => a + x, 0) : 0;
  return { t: g.t, wipe: g.wipe, n: [rangeCount(g, 0), rangeCount(g, 1)],
    dmg: [0, 1].map(s => S ? S[s].dmg : 0), kills: [0, 1].map(s => g.sides[s].stats.kills + bl(1 - s)) };
}
