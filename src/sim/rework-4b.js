/* ---------- Faction rework, batch 4b (v2.87, docs/FACTION_REWORK.md "Batch 4", last five): Leviathan, Brood Tyrant,
   Worldrender, Voidcarrier, Astral Sovereign; and Part 0 (batch 4a's Wraithwing counter) ----------
   REWORK.b4b, stored per game in g.rw like the earlier batches (rwB4b). Off: everything plays exactly as in v2.86 and
   nothing below runs or is saved (every field here is set only by this code). On (the new-game default) each unit keeps its
   internal id and plays through its own definition for that game (rwD, RW4B_D; UDEF untouched).
   - Part 0 (b4a, not b4b): anti-air specialists (a weapon that hits only aircraft, d.hitsGround false: the Interceptor; or
     prefers them, d.preferAir: the Hydra) and every building gun (Turrets, Maws, Null Lances, bunkers, HQ guns) ignore a
     batch 4a Wraithwing's re-acquire delay (u.wwT) after a hop: aaTrack, read by the target search and ctlCanHit. Shots
     already flying at it still miss when it hops.
   - Leviathan (Last Fist): bombing runs. With a target within LEV.reach it flies straight across it (u.lvR: the run) and
     drops its carpet (P10's n bombs, gap apart) along its path, centred on the target, carries on LEV.over beyond, turns
     (LEV.turn s, a half circle; it can't bomb while turning) and comes back for the next pass. The AI's Interceptors escort
     its Leviathans whatever its stance.
   - Brood Tyrant (Bloomhost): its glob (TYR) still hits units (TYR.dmg, splash TYR.splash). On a building it deals TYR.bdmg
     and attaches a pustule (b.pus, the count, up to PUS.max; b.puS the side that owns them): each does PUS.dps a second
     until the building falls or a paid Repair starts (that clears them). A building that falls with pustules bursts them
     into PUS.mites temporary Mites each (tSrc 'pus', life MOUND.life), at most PUS.cap per building.
   - Worldrender (Bloomhost): it lands. Reaching a building it is attacking (within its range) it lands (LAND.t s; u.lnd 1),
     then landed (u.lnd 2) deals LAND.dmg to that building every LAND.every s, healing P11's share (LAND.frac, at most LAND.cap
     a second), and is a ground target with heavy armour (e.lnd >= 2: anything that hits ground units can hit it, anti-air-
     only weapons can't). It takes off (LAND.t s; u.lnd 3, still on the ground) when the building falls, its health drops
     below LAND.off, it has no building to eat, or it is ordered away. Airborne it keeps its drop attack.
   - Voidcarrier (Axiarchs): pure support. Its power node (P9) kept; no building preference, no splash; a light defensive
     bolt (VC: weapon 'vbolt') at air and ground. The AI keeps it over its army near the front (side.vc4).
   - Astral Sovereign (Axiarchs): the judgement beam (P12's 260) from SOV.range after a SOV.charge s charge on one target
     (ground units and buildings, never aircraft); its shields breaking during the charge fails the shot and starts its
     cooldown over (sovFail). The AI aims it at the most valuable target in reach, at buildings when sieging. */
const rwB4b = g => !!(g && g.rw && g.rw.b4b);
const aaTrack = (src, d) => src.kind === 'b' || d.hitsGround === false || !!d.preferAir; // Part 0 (v2.87, read only while a b4a Wraithwing's wwT runs)
const LEV = { reach: 160, over: 120, turn: 2.0, n: 4, gap: 26, edge: 40, fall: 55 }; // fall: its run's bombs drop slower than P10's (a line you can see coming)
const TYR = { dmg: 40, splash: 24, range: 150, cd: 2.4, bdmg: 30 };
const PUS = { max: 3, dps: 6, mites: 2, cap: 6 };
const LAND = { t: 1.5, dmg: 120, every: 2.0, armor: 'heavy', off: 0.35, frac: 0.3, cap: 40, z: 6, seek: 300, edge: 16 };
const VC = { dmg: 18, cd: 1.4, range: 140 };
const SOV = { dmg: 260, range: 320, charge: 2.5 };
const AIM4B = { every: 0.25, eco: ['refinery', 'reactor', 'habitat'], def: ['turret', 'bunker'] };
Object.assign(DMG, {
  tyrglob: { light: 0, heavy: 0, vehicle: 0, air: 0, building: 1.0 },          // a Brood Tyrant's glob on a building (TYR.bdmg)
  pustule: { light: 0, heavy: 0, vehicle: 0, air: 0, building: 1.0 },          // its pustules rotting the building
  landmaw: { light: 0, heavy: 0, vehicle: 0, air: 0, building: 1.0 },          // a landed Worldrender feeding
  vbolt:   { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 1.0, building: 1.0 },   // a Voidcarrier's defensive bolt
});
PSPEED.vbolt = 900;
const RW4B_D = {
  leviathan: g => { const C = UDEF.leviathan.carpet || { n: LEV.n, gap: LEV.gap }; return Object.assign({}, UDEF.leviathan, { range: LEV.reach, carpet: { n: C.n, gap: C.gap }, bombRun: true }, rwB6c(g) ? { dmg: B6C.levDmg } : {}); }, // v2.93: b6c's run bombs
  broodtyrant: () => Object.assign({}, UDEF.broodtyrant, { dmg: TYR.dmg, splash: TYR.splash, range: TYR.range, cd: TYR.cd, infest: true }),
  worldrender: () => Object.assign({}, UDEF.worldrender, { devour: { frac: LAND.frac, cap: LAND.cap }, lands: true }),
  voidcarrier: () => Object.assign({}, UDEF.voidcarrier, { weapon: 'vbolt', dmg: VC.dmg, cd: VC.cd, range: VC.range, hitsAir: true, splash: 0, preferB: undefined, node: UDEF.voidcarrier.node || { r: 120 }, vcSup: true }),
  sovereign: () => Object.assign({}, UDEF.sovereign, { dmg: SOV.dmg, splash: 0, drop: undefined, beam: true, charge: SOV.charge, range: SOV.range, preferB: undefined, judge: true }),
};
EX_TIMERS.push('lnT', 'lnF'); // v2.87: a Worldrender mid-landing or feeding: resumed on return from exile

// Texts the player sees follow the new-game default (numbers in UNIT_TIPS, read live)
for (const [t, on] of [['leviathan', 'Huge bomber that makes bombing runs: it flies straight across its target dropping a line of bombs, carries on, turns and comes back. It can\'t bomb while turning or hit aircraft; Interceptors escort it.'],
  ['broodtyrant', 'Bloated flying beast whose globs hit ground units and infest buildings with pustules that rot them; a building that falls with pustules bursts into Mites. Paid Repair clears them. It can\'t hit aircraft.'],
  ['worldrender', 'Colossal flyer that lands on a building and devours it, healing as it feeds. Landed it is a ground target: every unit that hits ground units can hit it. It takes off when the building falls or it is badly hurt.'],
  ['voidcarrier', 'Floating power node: Axiarch shields recharge fast and units warp in beneath it. Pure support, with a light defensive bolt at air and ground; losing it collapses the field.'],
  ['sovereign', 'Huge crescent ship that locks a judgement beam onto one ground unit or building from long range, charges, then fires for massive damage. Break its shields during the charge and the shot fails. It can\'t hit aircraft.']]) {
  const d0 = UDEF[t].desc; Object.defineProperty(UDEF[t], 'desc', { get: () => REWORK.b4b ? on : d0, enumerable: true, configurable: true });
}
function rw4bText(o, k, on) { const x = Object.getOwnPropertyDescriptor(o, k), off = x.get ? x.get() : x.value; Object.defineProperty(o, k, { get: () => REWORK.b4b ? on : off, enumerable: true, configurable: true }); }
rw4bText(TREES.techlab.A.steps[3], 'txt', 'Unlocks Leviathans: bombers that make runs across their target, dropping a line of bombs');
rw4bText(TREES_BH.techlab.B.steps[2], 'txt', 'Unlocks Brood Tyrants: flyers whose globs infest buildings with pustules that burst into Mites');
rw4bText(TREES_BH.techlab.B.steps[3], 'txt', 'Unlocks Worldrenders: colossal flyers that land on buildings and devour them');
rw4bText(TREES_AX.techlab.B.steps[2], 'txt', 'Unlocks Voidcarriers: floating power nodes with a light defensive bolt');
rw4bText(TREES_AX.techlab.B.steps[3], 'txt', 'Unlocks Astral Sovereigns: a judgement beam locked on from long range, charged, then fired');

const rw4bEv = (g, side, type, extra) => ev(g, Object.assign({ type, side }, extra || {}));
const b4Alive = (g, id) => { const T = id ? ctlEnt(g, id) : null; return T && T.hp > 0 && !T.dead && !T.gone ? T : null; };

/* ---- Leviathan: bombing runs ---- */
function lvRun(u, T, side) { return { id: T.id, tu: T.u, tv: T.v, hd: Math.sign(T.u - u.u) || u.face || dirOf(side), ph: 0, k: 0, tT: 0, ts: 1 }; }
function lvStep(g, u, d, s, st, cs, best, dt, sp) {
  if (st === 'retreat' || (cs && cs.run)) { u.lvR = undefined; u.lvB = 0; return false; }
  let R = u.lvR;
  if (!R) { if (!best) return false; R = u.lvR = lvRun(u, best, s); rw4bEv(g, s, 'run', { u: u.u }); }
  const C = d.carpet, half = (C.n - 1) / 2, spd = d.speed * sp;
  if (R.ph === 1) { // turning: a half circle, no bombs
    const k = clamp(1 - (R.tT - g.t) / LEV.turn, 0, 1), a = Math.PI * k;
    u.u = clamp(u.u + R.hd * spd * Math.cos(a) * dt, 0, L); u.v = hopClampV(u.v + R.ts * spd * Math.sin(a) * dt);
    u.face = Math.cos(a) >= 0 ? R.hd : -R.hd; u.moving = true; u.tgt = 0; u.lvB = 0;
    if (g.t < R.tT) return true;
    R.hd = -R.hd; R.ph = 0; R.k = 0; u.face = R.hd;
    const T = b4Alive(g, R.id) && visibleTo(g, s, ctlEnt(g, R.id)) ? ctlEnt(g, R.id) : best; // the same target again, or what is in reach now
    if (!T) { u.lvR = undefined; return false; }
    R.id = T.id; R.tu = T.u; R.tv = T.v;
    return true;
  }
  const T = b4Alive(g, R.id);
  if (T && R.k === 0) { R.tu = T.u; R.tv = T.v; } // follows its target until the first bomb falls
  else if (!T && R.k === 0) { if (!best) { u.lvR = undefined; u.lvB = 0; return false; } R.id = best.id; R.tu = best.u; R.tv = best.v; }
  u.u = clamp(u.u + R.hd * spd * dt, 0, L); u.face = R.hd; u.moving = true; u.tgt = R.id;
  const dv = R.tv - u.v; u.v += Math.sign(dv) * Math.min(Math.abs(dv), spd * (MAP_2D ? 0.8 : 0.45) * dt);
  const pos = (u.u - R.tu) * R.hd; // how far past the target along the run
  u.lvB = pos > -half * C.gap - LEV.edge && R.k < C.n ? 1 : 0; // the bomb bay is open over the target
  while (R.k < C.n) {
    const off = (R.k - half) * C.gap; if (pos < off) break;
    if (pos - off <= C.gap) lvDrop(g, u, d, R, off);
    R.k++;
  }
  if (pos >= LEV.over || u.u <= 0 || u.u >= L) { R.ph = 1; R.tT = g.t + LEV.turn; const lim = MAP_2D ? MAP.size.h / 2 - 50 : LANE_V - 30; R.ts = u.v > lim ? -1 : u.v < -lim ? 1 : (Math.sign(R.tv - u.v) || (u.id % 2 ? 1 : -1)); u.lvB = 0; }
  return true;
}
function lvDrop(g, u, d, R, off) {
  RNG.g = g; u.lastAct = g.t;
  const m = muzzle(u), dmg = d.dmg * (sideBuff(g, u.side) ? NANO.dmg : 1) * outMul(g, u);
  g.projs.push({ u: m.u, v: m.v, z: m.z, pu: m.u, pv: m.v, pz: m.z, target: null, side: u.side, weapon: d.weapon, dmg, splash: d.splash || 0, t: 0, tz: 0, tu: R.tu + R.hd * off + rand(-3, 3), tv: R.tv + rand(-5, 5), speed: LEV.fall, carpet: 1 });
  u.recoil = 1;
}
// The AI's Interceptors fly with its Leviathans on any stance (when they have no air target of their own)
function lvEscort(g, u, d, dt, sp) {
  let L0 = null, ld = 1e9;
  for (const e of g.ents) if (e.kind === 'u' && e.side === u.side && e.type === 'leviathan' && e.hp > 0) { const k = Math.abs(e.u - u.u) + Math.abs(e.v - u.v); if (k < ld) { ld = k; L0 = e; } }
  if (!L0) return false;
  moveToward(u, d, clamp(L0.u - L0.face * 14, 0, L), L0.v + (u.id % 2 ? 16 : -16), dt, sp);
  return true;
}

/* ---- Brood Tyrant: pustules ---- */
function tyrImpact(g, p, hit) {
  const w = P(p.u, p.v, p.z);
  if (hit && hit.kind === 'b' && hit.hp > 0) {
    damage(g, hit, p.dmg * TYR.bdmg / TYR.dmg, 'tyrglob', p.side);
    if (hit.hp > 0 && !hit.shielded && hit.built !== false) {
      if (hit.puS !== p.side) { hit.pus = 0; hit.puS = p.side; }
      if ((hit.pus || 0) < PUS.max) { hit.pus = (hit.pus || 0) + 1; rw4bEv(g, p.side, 'pustule', { u: hit.u }); }
      g.fx.push({ k: 'pusadd', side: p.side, u: p.u, x: w.x, y: w.y, t: 0, life: 0.5 });
    }
    splashUnits(g, p, null, 0.5);
  } else {
    if (hit && hit.hp > 0) damage(g, hit, p.dmg, p.weapon, p.side);
    splashHit(g, p, hit, 0.5, 1);
  }
  fxBoom(g, w.x, w.y, 14);
}
function splashUnits(g, p, hit, scale) { // the glob's splash on ground units only (when it struck a building)
  for (const e of g.ents) {
    if (e === hit || e.kind !== 'u' || e.side === p.side || e.hp <= 0 || (UDEF[e.type].air && !(e.lnd >= 2))) continue;
    const dx = Math.hypot(e.u - p.u, (e.v - p.v) * 0.6); if (dx < p.splash) damage(g, e, p.dmg * scale * (1 - dx / p.splash), p.weapon, p.side);
  }
}
function updatePus(g, dt) {
  for (const b of g.ents) {
    if (b.kind !== 'b' || !b.pus || b.hp <= 0) continue;
    if (b.repair > 0) { pusClear(g, b); continue; } // a paid Repair running clears them
    damage(g, b, PUS.dps * b.pus * dt, 'pustule', b.puS);
  }
}
function pusClear(g, b) {
  if (!b.pus) return;
  const w = P(b.u, b.v, b.h * 0.5); g.fx.push({ k: 'pusclear', u: b.u, x: w.x, y: w.y, r: b.half, t: 0, life: 0.6 });
  rw4bEv(g, b.side, 'pusclear', { u: b.u, n: b.pus }); b.pus = 0; b.puS = undefined;
}
function pusBurst(g, b) { // the building fell with pustules on it: each bursts into Mites for their side
  const s = b.puS, n = Math.min(PUS.cap, b.pus * PUS.mites);
  if (!(s >= 0 && s < 2) || !n) return;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + 0.4, r = b.half + 8;
    const k = spawnUnit(g, s, 'mite', clamp(b.u + Math.cos(a) * r, 0, L), b.v + Math.sin(a) * r * 0.6);
    Object.assign(k, { temp: g.t + MOUND.life, tLife: MOUND.life, tSrc: 'pus' }); k.laneV = clamp(k.v, -LANE_V, LANE_V); arriveOrders(g, k);
  }
  for (let i = 0; i < b.pus; i++) { const a = i * 2.1 + 0.3, w = P(b.u + Math.cos(a) * b.half * 0.5, b.v + Math.sin(a) * b.half * 0.4, b.h * 0.3); g.fx.push({ k: 'pusburst', side: s, u: b.u, x: w.x, y: w.y, t: 0, life: 1.1 }); }
  rw4bEv(g, s, 'pusburst', { u: b.u, n });
  if (g.log) logAdd(g.log.tot[s].mites || (g.log.tot[s].mites = {}), 'pus', n);
}

/* ---- Worldrender: landing ---- */
function lnStep(g, u, d, s, st, cs, best, dt, sp) {
  const away = st === 'retreat' || !!(cs && (cs.run || (cs.go && !(cs.chase && cs.chase.kind === 'b' && (!u.lnd || cs.chase.id === u.lnB))))); // retreating, or ordered somewhere else (a move, another target)
  if (u.lnd) {
    const B = b4Alive(g, u.lnB);
    u.moving = false; u.tgt = B ? B.id : 0;
    if (u.lnd === 1) { // coming down
      const k = clamp(1 - (u.lnT - g.t) / LAND.t, 0, 1); u.z = lerp(u.lnZ, LAND.z, k);
      if (B && u.lnP) { u.u = lerp(u.lnP[0], u.lnP[2], k); u.v = lerp(u.lnP[1], u.lnP[3], k); } // settling onto the building's edge
      if (!B || away || u.hp < u.maxHp * LAND.off) { lnOff(g, u, k); return true; }
      if (g.t >= u.lnT) { u.lnd = 2; u.z = LAND.z; u.arm = LAND.armor; u.lnF = g.t; const w = P(u.u, u.v, 0); g.fx.push({ k: 'landdust', side: s, u: u.u, x: w.x, y: w.y, t: 0, life: 1.0 }); rw4bEv(g, s, 'landed', { u: u.u, b: B.type }); }
      return true;
    }
    if (u.lnd === 2) { // feeding
      if (!B || away || u.hp < u.maxHp * LAND.off || !(effDist(u, B) <= d.range + 20)) { lnOff(g, u, 1); return true; }
      if (B.u !== u.u) u.face = B.u >= u.u ? 1 : -1;
      if (g.t >= u.lnF) { u.lnF = g.t + LAND.every; lnBite(g, u, B); }
      return true;
    }
    const k = clamp((u.lnT - g.t) / LAND.t, 0, 1); u.z = lerp(u.lnZ, LAND.z, k); // taking off (still on the ground until airborne)
    if (g.t >= u.lnT) { u.lnd = 0; u.z = u.lnZ; u.arm = undefined; u.lnB = 0; u.lnP = undefined; }
    return true;
  }
  if (away || !best || best.kind !== 'b' || u.hp < u.maxHp * LAND.off) return false;
  if (effDist(u, best) > d.range) { moveToward(u, d, best.u, best.v, dt, sp); u.tgt = 0; return true; } // an AI's Worldrender on its way to the building it chose
  u.lnd = 1; u.lnT = g.t + LAND.t; u.lnB = best.id; u.lnZ = u.lnZ || u.z; u.moving = false; u.tgt = best.id;
  if (Math.abs(best.u - u.u) > 1) u.face = best.u >= u.u ? 1 : -1;
  u.lnP = [u.u, u.v, clamp(best.u - u.face * (best.half + LAND.edge), 0, L), best.v + clamp(u.v - best.v, -best.half * 0.5, best.half * 0.5)]; // where it settles: against the building
  rw4bEv(g, s, 'land', { u: u.u });
  return true;
}
function lnOff(g, u, k) { u.lnd = 3; u.lnT = g.t + LAND.t * k; u.lnP = undefined; if (k <= 0) { u.lnd = 0; u.z = u.lnZ; u.arm = undefined; u.lnB = 0; } rw4bEv(g, u.side, 'takeoff', { u: u.u }); }
function lnBite(g, u, B) {
  u.lastAct = g.t; u.recoil = 1;
  const h0 = B.hp + (B.shp || 0);
  damage(g, B, LAND.dmg * (sideBuff(g, u.side) ? NANO.dmg : 1) * outMul(g, u), 'landmaw', u.side, u);
  const dealt = h0 - Math.max(0, B.hp) - (B.shp || 0), w = P(u.u + u.face * 18, u.v, 4);
  g.fx.push({ k: 'chomp', side: u.side, u: u.u, x: w.x, y: w.y, t: 0, life: 0.5 });
  if (dealt <= 0 || u.hp <= 0) return;
  u.dvB = Math.min(LAND.cap * LAND.every, (u.dvB ?? LAND.cap * LAND.every) + (g.t - (u.dvT ?? g.t)) * LAND.cap); u.dvT = g.t; // at most LAND.cap a second
  const heal = Math.min(dealt * LAND.frac, u.dvB, u.maxHp - u.hp);
  if (heal > 0) { u.hp += heal; u.dvB -= heal; const a = P(B.u, B.v, B.h * 0.4), b = P(u.u, u.v, u.z || 0); g.fx.push({ k: 'devour', side: u.side, u: u.u, x: a.x, y: a.y, x2: b.x, y2: b.y, t: 0, life: 0.9, n: Math.round(heal) }); }
}

/* ---- Astral Sovereign: a failed shot ---- */
function sovFail(g, u) {
  const T = ctlEnt(g, u.chTgt), d = rwD(g, u.type), m = muzzle(u), a = P(m.u, m.v, m.z), b = T ? P(T.u, T.v, aimZ(T)) : a;
  g.fx.push({ k: 'sovfail', side: u.side, u: u.u, x: a.x, y: a.y, x2: b.x, y2: b.y, t: 0, life: 0.7 });
  u.chT = 0; u.cd = d.cd * rand(0.9, 1.1);
  rw4bEv(g, u.side, 'sovfail', { u: u.u });
}

/* ---- the AI's aims (sides it plays) ---- */
const bValue = e => { if (e.kind !== 'b') { const c = UDEF[e.type].cost; return c.c + c.e; } const c = bdOf(e).cost; return c ? c.c + c.e : 600; };
function aim4b(g, u, d, best, foes) {
  if (!(d.judge || d.infest || (d.lands && !u.lnd))) return best;
  if (d.judge && u.chT && u.chTgt) { const T = ctlEnt(g, u.chTgt); if (T && aim4Ok(g, u, d, T)) return T; } // mid-charge: keep it
  if (u.a4bT > g.t) { const T = u.a4bId ? ctlEnt(g, u.a4bId) : null; return T && (d.lands ? T.hp > 0 && !T.gone : aim4Ok(g, u, d, T)) ? T : best; }
  u.a4bT = g.t + AIM4B.every;
  const side = g.sides[u.side], siege = !!(side.bbOn || side.pushMode === 'siege');
  let pick = null, ps = -1e9;
  for (const e of foes) {
    if (e.side === u.side || e.side === NEUTRAL || e.hp <= 0 || e.gone || e.shielded || !visibleTo(g, u.side, e)) continue;
    let sc;
    if (d.judge) { // the most valuable target in reach; buildings when sieging
      if (!ctlCanHit(g, u, d, e)) continue;
      sc = bValue(e) + (siege && e.kind === 'b' ? 2000 : 0) - effDist(u, e) * 0.2;
    } else if (d.infest) { // economy buildings and defences, the fewest pustules first
      if (e.kind !== 'b' || !ctlCanHit(g, u, d, e)) continue;
      const n = e.puS === u.side ? e.pus || 0 : 0;
      sc = (AIM4B.eco.includes(e.type) ? 600 : AIM4B.def.includes(e.type) ? 500 : 100) - n * 250 - effDist(u, e) * 0.5;
    } else { // a Worldrender: the most valuable building within LAND.seek
      if (e.kind !== 'b' || u.hp < u.maxHp * LAND.off) continue;
      const k = effDist(u, e); if (k > LAND.seek) continue;
      sc = bValue(e) + (AIM4B.eco.includes(e.type) ? 200 : 0) - k * 1.5;
    }
    if (sc > ps || (sc === ps && pick && e.id < pick.id)) { ps = sc; pick = e; }
  }
  u.a4bId = pick ? pick.id : 0;
  return pick || best;
}
// Voidcarriers stay over the army near its front (the middle of the front-most ground units, a little behind them)
function aiRework4b(g, s, mine) {
  const side = g.sides[s], dir = dirOf(s);
  if (!mine.some(u => u.type === 'voidcarrier')) { side.vc4 = undefined; return; }
  const army = mine.filter(u => !UDEF[u.type].air && UDEF[u.type].weapon && !u.gone && !u.temp).sort((a, b) => dir * (b.u - a.u) || a.id - b.id).slice(0, 6);
  side.vc4 = army.length >= 2 ? [clamp(army.reduce((a, u) => a + u.u, 0) / army.length - dir * 40, 0, L), army.reduce((a, u) => a + u.v, 0) / army.length] : undefined;
}

/* ---- each unit (updateUnit), b4b on ---- */
function rw4bStep(g, u, d, side, st, cs, best, A, dt, sp) {
  if (d.lands) return lnStep(g, u, d, u.side, st, cs, best, dt, sp);
  if (d.bombRun) return lvStep(g, u, d, u.side, st, cs, best, dt, sp);
  if (side.direct || best || st === 'retreat' || (cs && (cs.run || cs.go))) return false;
  if (u.type === 'interceptor') return lvEscort(g, u, d, dt, sp);
  if (d.vcSup && side.vc4) { if (!moveToward(u, d, side.vc4[0], side.vc4[1], dt, sp)) u.face = dirOf(u.side); return true; }
  return false;
}

/* ---- each tick (update), b4b on ---- */
function update4b(g, dt) { updatePus(g, dt); }

// Persona tastes (the Leviathan keeps the Last Fist personas' own bias)
const RW4B_TASTE = { broodtyrant: { aggressor: 1.2, trickster: 1.1, economist: 1.0, turtle: 0.9 }, worldrender: { aggressor: 1.1, turtle: 1.0, economist: 1.0, trickster: 1.0 }, voidcarrier: { turtle: 1.2, economist: 1.1, aggressor: 0.9, trickster: 1.0 }, sovereign: { turtle: 1.1, economist: 1.1, aggressor: 1.0, trickster: 1.0 } };
