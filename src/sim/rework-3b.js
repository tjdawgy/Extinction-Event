/* ---------- Faction rework, batch 3b (v2.85, docs/FACTION_REWORK.md "Batch 3"): Dreadthorn, Bastion, Shardling, Bulwark ----------
   REWORK.b3b, stored per game in g.rw like the earlier batches (rwB3b). Off: the four units play exactly as in v2.84 and
   nothing below runs or is saved (every unit field here is set only by this code, so a b3b-off game never carries one). On
   (the new-game default) each keeps its internal id and plays through its own definition for that game (rwD, RW3B_D).
   - Dreadthorn (Bloomhost): no spine burst. A charge (trampleGo, trampleStep): with an enemy ground unit TRAMPLE.min to
     TRAMPLE.max away (a target order: that unit, from TRAMPLE.tmin), it charges in a straight line at TRAMPLE.speed for up
     to TRAMPLE.len (u.crg; u.crU/u.crV its heading, u.crL what is left, u.crHit the ids it has hit). Every enemy ground unit
     within TRAMPLE.w of its path takes TRAMPLE.dmg once and is knocked TRAMPLE.knock to the side (g.kn, a short slide). It
     stops early at a building, a Worldbreaker ridge, a wall or the edge of the field. Then it is dazed TRAMPLE.daze s (u.dzT:
     no moves, no attacks). Ready again TRAMPLE.cd s after the charge starts (u.crCd). It picks the line that tramples the
     most enemy supply; an AI's needs TRAMPLE.aiMin supply on the line (no charge at one small unit).
   - Bastion (Axiarchs): no shield surge (and no brace). A barrier (u.bwHp): a curved wall BAR.off in front of it, BAR.half
     each way across the lane's depth, facing the nearest enemy it can see within BAR.face (u.bwF; none: toward the enemy
     base). Enemy shots that cross it (bullets, missiles, bolts, beams, building guns: everything but lobbed shells, bombs
     and the ground attacks) hit it instead (bwStop, bwBeam). Friendly shots pass out. BAR.hp health, BAR.regen a second
     after BAR.calm s unhit; broken, it is down BAR.down s (u.bwDn) and comes back at full health. Its pulse is unchanged.
   - Shardling (Axiarchs): a parry (u.prT: ready again). Ready, the next damaging hit (splash too; not acid pools' steady
     burn) is negated in full; an attacker in melee with it (within its reach, or a melee attacker within its own) takes
     PARRY.mul × the Shardling's damage at once. Ready again PARRY.cd s later.
   - Bulwark (Bloomhost): its brace unchanged. On its own creep it regenerates BULK.fight health a second even in combat,
     and BULK.calm × the usual creep regeneration out of combat (bulkRegen, in place of updateCreep's for the Bulwark). */
const rwB3b = g => !!(g && g.rw && g.rw.b3b);
const TRAMPLE = { min: 80, max: 200, tmin: 40, speed: 140, len: 220, dmg: 50, knock: 30, kT: 0.25, w: 18, daze: 2, cd: 14, aiMin: 3, every: 0.25, bld: 8, step: 6 };
const BAR = { off: 70, half: 45, bow: 10, hp: 600, regen: 30, calm: 3, down: 8, h: 44, face: 260, lead: 40, wait: 20 };
const PARRY = { cd: 4, mul: 2, skip: ['acidpool'] };
const BULK = { fight: 8, calm: 3, leash: 50 };
const BW_PASS = ['bomb', 'crush', 'sovereign']; // dropped from above: over the wall
Object.assign(DMG, { trample: { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 0, building: 0 } }); // a Dreadthorn's charge (ground units)
const RW3B_D = {
  dreadthorn: () => Object.assign({}, UDEF.dreadthorn, { burst: undefined, trample: true }),
  bastion: () => Object.assign({}, UDEF.bastion, { surge: undefined, brace: undefined, barrier: true }),
  shardling: () => Object.assign({}, UDEF.shardling, { parry: true }),
  bulwark: () => Object.assign({}, UDEF.bulwark, { creepHold: true }),
};
EX_TIMERS.push('dzT', 'crCd', 'bwDn', 'bwHit', 'prT'); // v2.85: dazed, charge cooldown, barrier down, barrier unhit, parry: resumed on return

// Texts the player sees follow the new-game default (numbers in UNIT_TIPS, read live)
for (const [t, on] of [['dreadthorn', 'Massive charging beast. With enemies a short way off it charges in a straight line, trampling and knocking aside every ground unit in its path, then stands dazed for a moment. Spread out and punish the recovery.'],
  ['bastion', 'Heavy walker that projects a curved shield wall in front of it: enemy shots that would pass through hit the wall instead. Shells lobbed over it, melee and flanking get past; broken, the wall drops for a while.'],
  ['shardling', 'Shielded duelist with a light blade. Every few seconds it parries the next hit completely, and strikes back hard if the attacker is in reach. Pricey, and it can\'t hit aircraft.'],
  ['bulwark', 'Hulking melee frontliner that braces to take less damage when hit. On its own creep it regenerates even in combat, and much faster out of it. Slow, and it can\'t hit aircraft.']]) {
  const d0 = UDEF[t].desc; Object.defineProperty(UDEF[t], 'desc', { get: () => REWORK.b3b ? on : d0, enumerable: true, configurable: true });
}
function rw3bText(o, k, on) { const x = Object.getOwnPropertyDescriptor(o, k), off = x.get ? x.get() : x.value; Object.defineProperty(o, k, { get: () => REWORK.b3b ? on : off, enumerable: true, configurable: true }); }
rw3bText(TREES_BH.factory.B.steps[3], 'txt', 'Unlocks Dreadthorns: chargers that trample through the enemy line');

/* ---- Dreadthorn: the charge ---- */
const trampleFoe = (g, u, e) => e.kind === 'u' && e.side === 1 - u.side && e.hp > 0 && !e.dead && !e.gone && !e.bur && !e.leaping && !e.tn && !(e.phT > g.t) && !UDEF[e.type].air;
// Where a charge along (du, dv) from (u0, v0) stops: a building, a ridge of the other side, a wall or the field's edge
function trampleStop(g, u, u0, v0, du, dv, len) {
  const bl = g.ents.filter(b => b.kind === 'b' && b.hp > 0), R = g.rdg && g.rdg.length ? g.rdg.filter(r => r.side !== u.side) : null;
  let a = 0;
  while (a < len) {
    const s = Math.min(TRAMPLE.step, len - a), pu = u0 + du * a, pv = v0 + dv * a, nu = pu + du * s, nv = pv + dv * s;
    if (nu < 0 || nu > L || (MAP_2D ? Math.abs(nv) > MAP.size.h / 2 || (NAV.on && navShut(nu, nv)) : Math.abs(nv) > LANE_V)) break;
    if (bl.some(b => Math.hypot(b.u - nu, b.v - nv) < b.half + TRAMPLE.bld)) break;
    if (R && R.some(r => rdgCross(r, pu, pv, nu, nv, 2))) break;
    a += s;
  }
  return a;
}
const segDist = (e, u0, v0, du, dv, len) => { const t = clamp((e.u - u0) * du + (e.v - v0) * dv, 0, len); return Math.hypot(e.u - (u0 + du * t), e.v - (v0 + dv * t)); };
// A charge at T: [its heading, the stop, the enemy supply on the line]
function trampleLine(g, u, T, foes) {
  const dd = Math.max(1, Math.hypot(T.u - u.u, T.v - u.v)), du = (T.u - u.u) / dd, dv = (T.v - u.v) / dd, len = trampleStop(g, u, u.u, u.v, du, dv, TRAMPLE.len);
  let sup = 0; for (const e of foes) if (trampleFoe(g, u, e) && segDist(e, u.u, u.v, du, dv, len) <= TRAMPLE.w) sup += UDEF[e.type].pop;
  return { du, dv, len, sup };
}
// Start a charge (true: it charged). Automatic: the enemy ground unit TRAMPLE.min-max away whose line tramples the most supply;
// a target order: that unit, from TRAMPLE.tmin. Not on Retreat or a move, not snared or held back (an AI's waiting for its
// army: aiWait, aiHold); on Hold only at enemies
// near its spot. Checked every TRAMPLE.every s.
function trampleGo(g, u, d, st, cs, foes, best, side) {
  if (g.t < (u.crCd || 0) || g.t < (u.crChk || 0) || u.snT > g.t || u.aiHold > g.t || u.aiWait > g.t || st === 'retreat' || st === 'move' || (cs && cs.run)) return false;
  u.crChk = g.t + TRAMPLE.every;
  const O = cs && cs.chase;
  let pick = null;
  if (O) { // a target order: at that unit, once it is within reach of a charge
    if (O.kind !== 'u' || !trampleFoe(g, u, O) || !visibleTo(g, u.side, O)) return false;
    const k = effDist(u, O); if (k < TRAMPLE.tmin || k > TRAMPLE.max) return false;
    pick = trampleLine(g, u, O, foes);
  } else {
    if (best) return false; // something already in reach: it fights
    const hold = st === 'hold' && u.holdU !== undefined;
    let bs = -1, bd = 1e9;
    for (const e of foes) {
      if (!trampleFoe(g, u, e) || !visibleTo(g, u.side, e)) continue;
      const k = effDist(u, e); if (k < TRAMPLE.min || k > TRAMPLE.max) continue;
      if (hold && Math.hypot(e.u - u.holdU, e.v - u.holdV) > MECH7C.holdR + d.range) continue;
      const L_ = trampleLine(g, u, e, foes);
      if (L_.len < TRAMPLE.min * 0.5) continue; // a wall right ahead
      if (L_.sup > bs || (L_.sup === bs && k < bd)) { bs = L_.sup; bd = k; pick = L_; }
    }
    { const A6 = art6Pick(g, u, foes, u.u, u.v, TRAMPLE.max, e => trampleFoe(g, u, e) && effDist(u, e) >= TRAMPLE.min && !(hold && Math.hypot(e.u - u.holdU, e.v - u.holdV) > MECH7C.holdR + d.range)); // v2.92 (batch 6b): an AI's Dreadthorn charges a deployed Artillery first
      if (A6) { const L6 = trampleLine(g, u, A6, foes); if (L6.len >= TRAMPLE.min * 0.5) { pick = L6; pick.sup = Math.max(pick.sup, TRAMPLE.aiMin); } } }
    if (!pick || (!side.direct && pick.sup < TRAMPLE.aiMin)) return false; // an AI's charge needs a group (or one big unit) on the line
  }
  Object.assign(u, { crg: 1, crU: pick.du, crV: pick.dv, crL: TRAMPLE.len, crHit: [], crCd: g.t + TRAMPLE.cd, crU0: u.u, crV0: u.v, crS: g.t, tgt: 0, chT: 0, nav: undefined });
  if (Math.abs(pick.du) > 0.05) u.face = pick.du > 0 ? 1 : -1;
  ev(g, { type: 'charge', u: u.u, side: u.side, sup: pick.sup });
  return true;
}
// One tick of a charge: on along its line, trampling what it passes; it ends at its length or where its way is blocked
function trampleStep(g, u, d, dt) {
  const st = Math.min(u.crL, TRAMPLE.speed * dt), ok = st > 0 ? trampleStop(g, u, u.u, u.v, u.crU, u.crV, st) : 0;
  const u0 = u.u, v0 = u.v;
  if (ok > 0) { u.u += u.crU * ok; u.v += u.crV * ok; u.crL -= ok; }
  u.moving = true; u.tgt = 0; u.chT = 0; u.lastAct = g.t;
  const nd = (sideBuff(g, u.side) ? NANO.dmg : 1) * outMul(g, u), pn = -u.crV, pv = u.crU;
  for (const e of g.ents.slice()) {
    if (!trampleFoe(g, u, e) || u.crHit.includes(e.id) || segDist(e, u0, v0, u.crU, u.crV, ok) > TRAMPLE.w) continue;
    u.crHit.push(e.id);
    const sd = (e.u - u0) * pn + (e.v - v0) * pv, sg = sd > 0 || (sd === 0 && e.id % 2) ? 1 : -1;
    damage(g, e, TRAMPLE.dmg * nd, 'trample', u.side, u);
    if (e.hp > 0 && !e.lt && !e.gone) (g.kn || (g.kn = [])).push({ id: e.id, du: pn * sg, dv: pv * sg, left: TRAMPLE.knock });
    const w = P(e.u, e.v, 8); g.fx.push({ k: 'trample', side: u.side, u: e.u, x: w.x, y: w.y, t: 0, life: 0.45, dx: pn * sg });
  }
  if (u.hp <= 0) return;
  if (u.crL <= 0.01 || ok < st - 1e-6) trampleEnd(g, u);
}
function trampleEnd(g, u) {
  const n = u.crHit.length; u.crg = 0; u.crL = 0; u.crHit = []; u.dzT = g.t + TRAMPLE.daze; u.moving = false;
  if (MAP_LANED) u.lane = laneAt(u.u, u.v);
  const w = P(u.u, u.v, 0); g.fx.push({ k: 'chargeEnd', side: u.side, u: u.u, x: w.x, y: w.y, t: 0, life: 0.6 });
  ev(g, { type: 'chargeEnd', u: u.u, side: u.side, hit: n });
}
// Knocked aside: a short slide (never through a wall or off the field)
function updateKnocks(g, dt) {
  if (!g.kn || !g.kn.length) return;
  const sp = TRAMPLE.knock / TRAMPLE.kT;
  g.kn = g.kn.filter(k => {
    const e = ctlEnt(g, k.id);
    if (!e || e.hp <= 0 || e.gone || e.lt) return false;
    const st = Math.min(sp * dt, k.left), nu = clamp(e.u + k.du * st, 0, L), nv = MAP_2D ? e.v + k.dv * st : clamp(e.v + k.dv * st, -LANE_V, LANE_V);
    if (!(NAV.on && navShut(nu, nv))) { e.u = nu; e.v = nv; e.nav = undefined; }
    k.left -= st;
    return k.left > 1e-6;
  });
}

/* ---- Bastion: the barrier ---- */
const BW = { g: null, list: null }; // the barriers of the game being updated (rebuilt each tick)
function updateBarriers(g, dt) {
  BW.g = g; BW.list = null;
  for (const u of g.ents) {
    if (u.kind !== 'u' || u.type !== 'bastion' || u.hp <= 0 || u.dead) continue;
    if (u.bwHp === undefined) { u.bwHp = barHp(g); /* v2.93: b6c's barrier health */ u.bwHit = -99; u.bwDn = 0; u.bwF = dirOf(u.side); }
    if (u.gone) continue; // exiled: down while away
    if (u.bwDn) { if (g.t < u.bwDn) continue; u.bwDn = 0; u.bwHp = barHp(g); const w = P(u.u + u.bwF * BAR.off, u.v, 0); g.fx.push({ k: 'bwup', side: u.side, u: u.u, x: w.x, y: w.y, t: 0, life: 0.5, F: u.bwF }); }
    else if (u.bwHp < barHp(g) && g.t - u.bwHit >= BAR.calm) u.bwHp = Math.min(barHp(g), u.bwHp + BAR.regen * dt);
    let F = 0, bd = BAR.face;
    for (const e of g.ents) { // it faces the nearest enemy it can see
      if (e.side !== 1 - u.side || e.hp <= 0 || e.gone || (e.kind === 'u' && UDEF[e.type].air)) continue;
      const k = Math.abs(e.u - u.u) + Math.abs(e.v - u.v) * 0.5; if (k >= bd || Math.abs(e.u - u.u) < 4 || !visibleTo(g, u.side, e)) continue;
      bd = k; F = e.u > u.u ? 1 : -1;
    }
    u.bwF = F || dirOf(u.side);
    (BW.list || (BW.list = [])).push(u);
  }
}
const bwF = (B, u, v) => (u - B.u) * B.bwF - (BAR.off - BAR.bow * Math.min(1, ((v - B.v) / BAR.half) ** 2)); // > 0 beyond the wall
// The first enemy barrier the move (u0, v0, z0) → (u1, v1, z1) of side s's shot crosses below its top: [B, k] or null
function bwCross(g, s, u0, v0, z0, u1, v1, z1) {
  if (BW.g !== g || !BW.list) return null;
  let hit = null, hk = 2;
  for (const B of BW.list) {
    if (B.side === s || B.hp <= 0 || B.bwDn) continue;
    const f0 = bwF(B, u0, v0), f1 = bwF(B, u1, v1);
    if ((f0 > 0) === (f1 > 0) || f0 === f1) continue;
    const k = f0 / (f0 - f1), cv = v0 + (v1 - v0) * k, cz = z0 + (z1 - z0) * k;
    if (Math.abs(cv - B.v) > BAR.half || cz > BAR.h || k >= hk) continue;
    hk = k; hit = B;
  }
  return hit ? [hit, hk] : null;
}
function bwDamage(g, B, amt, u, v, z) {
  B.bwHp -= amt; B.bwHit = g.t;
  if (g.log) g.log.tot[B.side].bwBlk = (g.log.tot[B.side].bwBlk || 0) + amt;
  const w = P(u, v, z); g.fx.push({ k: 'bwhit', side: B.side, u, x: w.x, y: w.y, t: 0, life: 0.3, id: B.id });
  if (B.bwHp <= 0) {
    B.bwHp = 0; B.bwDn = g.t + BAR.down;
    const c = P(B.u + B.bwF * BAR.off, B.v, 0); g.fx.push({ k: 'bwbreak', side: B.side, u: B.u + B.bwF * BAR.off, x: c.x, y: c.y, t: 0, life: 0.9, F: B.bwF });
    ev(g, { type: 'barrierBreak', u: B.u, side: B.side });
  }
}
// A projectile's step (updateProjs): blocked by an enemy barrier? True: it hit the wall (and is spent)
function bwStop(g, p, nu, nv, nz) {
  if (p.side < 0 || BW_PASS.includes(p.weapon) || p.carpet) return false;
  const h = bwCross(g, p.side, p.u, p.v, p.z, nu, nv, nz); if (!h) return false;
  const [B, k] = h; bwDamage(g, B, p.dmg, p.u + (nu - p.u) * k, p.v + (nv - p.v) * k, p.z + (nz - p.z) * k);
  return true;
}
// A beam (fire): blocked by an enemy barrier? True: it struck the wall
function bwBeam(g, src, t, def, m) {
  const h = bwCross(g, src.side, m.u, m.v, m.z, t.u, t.v, aimZ(t)); if (!h) return false;
  const [B, k] = h, cu = m.u + (t.u - m.u) * k, cv = m.v + (t.v - m.v) * k, cz = m.z + (aimZ(t) - m.z) * k;
  bwDamage(g, B, def.dmg * (sideBuff(g, src.side) ? NANO.dmg : 1) * outMul(g, src), cu, cv, cz);
  const a = P(m.u, m.v, m.z), b = P(cu, cv, cz), hq = def.weapon === 'hqbeam' || def.weapon === 'sovereign';
  g.fx.push({ k: 'beam', x: a.x, y: a.y, x2: b.x, y2: b.y, t: 0, life: hq ? 0.34 : 0.2, w: hq ? 3.6 : 2.2, hq });
  if (src.kind === 'u') src.recoil = 1;
  return true;
}
// An AI's Bastion with nothing in reach keeps BAR.lead ahead of the ranged units it screens (true: it moved)
function bastionGuard(g, u, d, dt, sp) {
  const R = (u.bsG || []).map(id => ctlEnt(g, id)).filter(e => e && e.hp > 0 && e.side === u.side && !e.gone);
  if (!R.length) { u.bsG = undefined; return false; }
  const dir = dirOf(u.side), cu = R.reduce((a, e) => a + e.u, 0) / R.length, cv = R.reduce((a, e) => a + e.v, 0) / R.length, front = dir > 0 ? Math.max(...R.map(e => e.u)) : Math.min(...R.map(e => e.u));
  const tu = clamp(front + dir * BAR.lead, 0, L), tv = cv;
  if (Math.hypot(tu - u.u, tv - u.v) <= 14 || dir * (u.u - cu) > BAR.lead + 60) return false;
  moveToward(u, d, tu, tv, dt, sp); return true;
}

/* ---- Shardling: the parry ---- */
// damage1, b3b on, a Shardling whose parry is ready: the hit is negated; a melee attacker takes the counter. True: parried
function parryHit(g, e, weapon, src) {
  if (g.t < (e.prT || 0) || PARRY.skip.includes(weapon)) return false;
  e.prT = g.t + PARRY.cd;
  const d = rwD(g, 'shardling'), w = P(e.u, e.v, 12); let ctr = false;
  if (src && src.kind === 'u' && src.hp > 0 && !src.gone && src.side !== e.side) {
    const k = effDist(e, src), sd = rwD(g, src.type);
    if (k <= d.range || (sd.melee && k <= sd.range + 4)) { // in melee with it: the counter-slash
      ctr = true; if (Math.abs(src.u - e.u) > 1) e.face = src.u >= e.u ? 1 : -1; e.recoil = 1; e.lastAct = g.t;
      damage(g, src, d.dmg * PARRY.mul * (sideBuff(g, e.side) ? NANO.dmg : 1) * outMul(g, e), d.weapon, e.side);
    }
  }
  g.fx.push({ k: 'parry', side: e.side, u: e.u, x: w.x, y: w.y, t: 0, life: 0.45, ctr, face: e.face });
  ev(g, { type: 'parry', u: e.u, side: e.side, ctr });
  return true;
}

/* ---- Bulwark: creep regeneration ---- */
function bulkRegen(g, dt) {
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.type !== 'bulwark' || e.hp <= 0 || e.hp >= e.maxHp || e.gone || !onCreep(g, e.side, e.u, e.v)) continue;
    const h0 = e.hp;
    if (g.t - e.lastHurt < CREEP.calm || g.t - e.lastAct < CREEP.calm) { e.hp = Math.min(e.maxHp, e.hp + BULK.fight * dt); e.bkRg = g.t; } // in combat: a steady trickle
    else { // out of combat: three times the usual creep regeneration (a Medevac's faster heal never stacks with it)
      const other = e.medAt === g.t ? UDEF.medic.heal : 0, rg = creepRegen(g, e.side) * BULK.calm;
      e.creepAt = g.t; e.bkRg = g.t;
      if (rg > other) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * (rg - other) * dt);
    }
    if (g.log) g.log.tot[e.side].healed = (g.log.tot[e.side].healed || 0) + e.hp - h0;
  }
}
// An AI's Bulwark defending holds on its creep (u.bkG, its spot there, set by the AI; it stands in for its home): it chases
// only enemies on its own creep or within BULK.leash of its spot
const bulkPreyOk = (g, u, e) => onCreep(g, u.side, e.u, e.v) || Math.hypot(e.u - u.bkG[0], e.v - u.bkG[1]) <= BULK.leash;

/* ---- each tick (update), b3b on ---- */
function update3b(g, dt) { updateBarriers(g, dt); updateKnocks(g, dt); bulkRegen(g, dt); }

/* ---- the AI ---- */
const bwRanged = t => { const d = UDEF[t]; return !!d.weapon && !d.melee && !d.air && d.range > 40 && t !== 'bastion'; };
// Bastions screen the side's ranged ground units (its own ranged units on the attack wait behind the nearest Bastion);
// Bulwarks defending hold on their creep. Every difficulty, each decision.
function aiRework3b(g, s, mine) {
  const side = g.sides[s], dir = dirOf(s), atk = side.stance === 'attack';
  const bs = mine.filter(u => u.type === 'bastion' && !u.gone).sort((a, b) => a.id - b.id);
  if (bs.length) {
    const rg = mine.filter(u => bwRanged(u.type) && !u.gone && u.id !== side.scoutId && !capBusy(side, u.id));
    bs.forEach((B, i) => { // each Bastion: the ranged units nearest it (shared out)
      const near = rg.filter((e, j) => j % bs.length === i || bs.length === 1).sort((a, b) => Math.hypot(a.u - B.u, a.v - B.v) - Math.hypot(b.u - B.u, b.v - B.v) || a.id - b.id).slice(0, 6);
      B.bsG = near.length ? near.map(e => e.id) : undefined;
    });
    if (atk) for (const e of rg) { // on the attack, a ranged unit well ahead of the nearest Bastion waits for it
      let nb = null, nd = 1e9; for (const B of bs) { const k = Math.abs(B.u - e.u) + Math.abs(B.v - e.v) * 0.5; if (k < nd) { nd = k; nb = B; } }
      if (nb && nd < 360 && dir * (e.u - nb.u) > -BAR.wait) e.aiWait = g.t + 1.5;
    }
  }
  const bk = mine.filter(u => u.type === 'bulwark');
  if (bk.length) { // defending: each Bulwark's spot is the front of its creep nearest the rally point
    const ru = rallyU(s, g), rv = MAP.bases[s].rally ? MAP.bases[s].rally[1] : 0;
    let spot = null, bd = 1e9;
    if (!atk) for (const p of g.creep[s]) {
      if (p.r < 24) continue;
      const fu = clamp(p.u + dir * p.r * 0.6, 0, L), k = Math.abs(fu - ru) + Math.abs(p.v - rv);
      if (k < bd) { bd = k; spot = [fu, p.v]; }
    }
    for (const u of bk) {
      const at = spot && u.id !== side.scoutId && !capBusy(side, u.id) ? [spot[0], spot[1] + ((u.id * 37) % 5 - 2) * 9] : null;
      u.bkG = at && onCreep(g, s, at[0], at[1]) ? at : undefined;
    }
  }
}
// The AI's reads for its scores (v2.85)
const aiLobShare = th => th.length ? th.filter(u => { const d = UDEF[u.type]; return d.weapon === 'shell' || d.lob; }).length / th.length : 0;
const aiPack = th => Math.min(1, th.filter(u => !UDEF[u.type].air).length / 20);
// Persona tastes for the four (in batch 3b none plays like its old Last Fist counterpart in AI_TWIN)
const RW3B_TASTE = { dreadthorn: { aggressor: 1.3, trickster: 1.1, turtle: 0.9, economist: 1.0 }, bastion: { turtle: 1.3, economist: 1.1, aggressor: 0.9, trickster: 1.0 }, shardling: { aggressor: 1.1, trickster: 1.2, turtle: 0.9, economist: 1.0 }, bulwark: { turtle: 1.3, economist: 1.0, aggressor: 1.0, trickster: 0.9 } };
