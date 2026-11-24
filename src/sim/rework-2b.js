/* ---------- Faction rework, batch 2b (v2.83, docs/FACTION_REWORK.md "Batch 2"): Titan, Ruinmaw, Worldbreaker ----------
   REWORK.b2b, stored per game in g.rw like b2a (rwB2b). Off: the three units play exactly as in v2.82 and nothing below
   runs or is saved. On (the new-game default), each keeps its internal id and is played through its own definition for
   that game (rwD: a copy of its UDEF entry with the batch's values; UDEF itself is never changed, so a b2b-off game in the
   same page still reads the old values).
   - Titan (Last Fist): walking cover. Friendly Last Fist infantry within TITAN.coverR of a Titan take TITAN.cover less
     damage from anything not melee (u.cov, set each tick by updateCover; several Titans don't stack). It no longer plants
     for range: it fires on the move at TITAN.range like any gun. Breaching: an enemy building within TITAN.breach (its
     edge) makes it plant (TITAN.plant s; the siege lock's states u.siege 1-3 and u.sgT), and planted it hits buildings
     TITAN.bmul harder; it unplants (TITAN.unplant s) TITAN.idle s after the last building in reach, or when ordered away.
   - Ruinmaw (Bloomhost): a living tunnel. RUIN.hp, heavy armour (u.arm), no ranged attack, no acid pools. Whenever it
     moves it is underground (the Gorebore's u.bur / u.gone 1: untargetable, unhurt, never exiled, a dirt trail) at
     RUIN.speed, and it surfaces where it stops. Surfaced it is a gate: ground units sent into the tunnel (u.tn, the Tunnel
     command or the AI) walk to their side's entrance (the Hive; in the Test Range their starting edge), enter (u.gone 3,
     off the field), and RUIN.transit s later pour out of its mouth, one every RUIN.every s. It moving again sends everyone
     inside back out at the entrance; it dying kills everyone inside. Surfaced it bites units (RUIN.bite every RUIN.biteCd s)
     and chews an adjacent building (RUIN.chew every RUIN.chewCd s).
   - Worldbreaker (Axiarchs): a fault line. Every WB.cd s it slams the ground and a crack runs from it through its target out to
     its full range (WB.range, at WB.speed, WB.w wide; g.rup): everything of the enemy's on the ground along it takes WB.dmg, buildings WB.bmul. Every
     WB.ridgeCd s the crack ends in a ridge (g.rdg) of WB.len across it for WB.life s: enemy ground units can't cross it and
     walk around an end (ridgeMove); its own side's units pass. It never spans the whole lane (one end always has WB.gap of
     open ground), and enemy units standing where it rises are pushed to the nearer side. The AI aims its ridges (wbAim). */
const rwB2b = g => !!(g && g.rw && g.rw.b2b);
const TITAN = { cover: 0.3, coverR: 70, range: 160, breach: 100, bmul: 2.5, plant: 2, unplant: 1.5, idle: 2, escort: 60 };
const RUIN = { hp: 1500, armor: 'heavy', speed: 30, bite: 40, biteCd: 1.6, biteR: 26, chew: 60, chewCd: 2, chewR: 30, transit: 3, every: 0.5, mouth: 36, fan: 44, enter: 30, edge: 40, stay: 20, send: 8, maxIn: 10, back: 0.35 };
const WB = { cd: 3.2, range: 210, speed: 220, w: 20, dmg: 90, bmul: 2.5, ridgeCd: 12, len: 140, life: 5, thick: 14, gap: 50, rise: 0.4, end: 18 };
Object.assign(DMG, {
  ruinbite: { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 0, building: 0 },   // the Ruinmaw's bite (units)
  ruinchew: { light: 0, heavy: 0, vehicle: 0, air: 0, building: 1.0 },       // its chewing (buildings)
  rupture:  { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 0, building: WB.bmul }, // the Worldbreaker's crack
});
// The batch's own definitions, built from the current UDEF entry (setBalance / setRedesign still apply underneath)
const RW2B_D = {
  titan: () => Object.assign({}, UDEF.titan, { range: TITAN.range, siege: undefined, breach: true }),
  ruinmaw: () => Object.assign({}, UDEF.ruinmaw, { speed: RUIN.speed, weapon: undefined, range: RUIN.biteR, splash: 0, acid: undefined, armor: RUIN.armor, hp: RUIN.hp, tunnel: true }),
  worldbreaker: () => Object.assign({}, UDEF.worldbreaker, { weapon: 'rupture', range: WB.range, cd: WB.cd, dmg: WB.dmg, splash: 0, acid: undefined, rupture: true }),
};
const RWD_C = { g: null, t: -1, m: {} };
function rwD(g, t) { // the definition a unit of type t plays by in game g
  const f = (rwB2b(g) && RW2B_D[t]) || (rwB3a(g) && RW3A_D[t]) || (rwB3b(g) && RW3B_D[t]) || (rwB4a(g) && RW4A_D[t]) || (rwB4b(g) && RW4B_D[t]) || (rwB5b(g) && RW5B_D[t]) || (rwB6art(g) && RW6A_D[t]), o6 = rwOver6(g, t); if (!f && !o6) return UDEF[t]; // v2.95: and batch 6e's Axiarch costs (rwOver6) // v2.94: batch 6d's values on top (rw6dUnit) // v2.92: batch 6b's Artillery; // v2.87: batch 4b's five; // v2.84: batch 3a's four too; v2.85: 3b's
  if (RWD_C.g !== g || RWD_C.t !== g.t) { RWD_C.g = g; RWD_C.t = g.t; RWD_C.m = {}; }
  return RWD_C.m[t] || (RWD_C.m[t] = o6 ? Object.assign({}, f ? f(g) : UDEF[t], o6) : f(g)); // v2.93: the game, for batch 6c's per-game numbers
}
// What the UI shows for a type (Codex, the info card): game g's definition, or the new-game default without a game; the
// Ruinmaw's bite counts as its weapon there
function rwShow(g, t) { // v2.94: with batch 6d's values on top (B6D.unit)
  const d = rwShow0(g, t), o = (g ? rwB6d(g) : REWORK.b6d) ? B6D.unit[t] : null, c = (g ? rwB6e(g) : REWORK.b6e) ? B6E.cost[t] : null; // v2.95: batch 6e's Axiarch costs (B6E.cost)
  return o || c ? Object.assign({}, d, o || {}, c ? { cost: c } : {}) : d;
}
function rwShow0(g, t) {
  if (RW3A_D[t]) return (g ? rwB3a(g) : REWORK.b3a) ? RW3A_D[t](g || { rw: REWORK }) : UDEF[t]; // v2.84: batch 3a's four
  if (RW3B_D[t]) return (g ? rwB3b(g) : REWORK.b3b) ? RW3B_D[t](g || { rw: REWORK }) : UDEF[t]; // v2.85: batch 3b's four
  if (RW4A_D[t]) return (g ? rwB4a(g) : REWORK.b4a) ? RW4A_D[t](g || { rw: REWORK }) : UDEF[t]; // v2.86: batch 4a's five
  if (RW4B_D[t]) return (g ? rwB4b(g) : REWORK.b4b) ? RW4B_D[t](g || { rw: REWORK }) : UDEF[t]; // v2.87: batch 4b's five
  if (RW5B_D[t]) return (g ? rwB5b(g) : REWORK.b5b) ? RW5B_D[t](g || { rw: REWORK }) : UDEF[t]; // v2.88: batch 5b's three
  if (RW6A_D[t]) return (g ? rwB6art(g) : REWORK.b6art) ? RW6A_D[t](g || { rw: REWORK }) : UDEF[t]; // v2.92: batch 6b's Artillery
  if (!(g ? rwB2b(g) : REWORK.b2b) || !RW2B_D[t]) return UDEF[t];
  const d = RW2B_D[t](); if (t === 'ruinmaw') Object.assign(d, { weapon: 'ruinbite', dmg: RUIN.bite, cd: RUIN.biteCd, melee: true }); return d;
}
function rw2bSpawn(g, e) { if (e.type === 'ruinmaw') { e.hp = e.maxHp = RUIN.hp; e.arm = RUIN.armor; } } // spawnUnit, b2b on

// Texts the player sees follow the new-game default
for (const [t, on] of [['titan', 'Huge walker that covers nearby infantry from ranged fire and plants beside enemy buildings to breach them. Rooted while planted; Heavies and aircraft wear it down.'],
  ['ruinmaw', 'Colossal worm that tunnels unseen (its trail shows) and surfaces where you send it. Surfaced, it is a gate: Bloomhost ground units sent into the tunnel pour out of its mouth. It bites and chews what is beside it.'],
  ['worldbreaker', 'Orb strider that slams a crack along the ground to its target, hitting everything in the line, and every so often raises a ridge enemy ground units must walk around. Slow, and it can\'t hit aircraft.']]) {
  const d0 = UDEF[t].desc; Object.defineProperty(UDEF[t], 'desc', { get: () => REWORK.b2b ? on : d0, enumerable: true, configurable: true });
}
// (rwText reads REWORK.b2a for its switch; these follow b2b)
function rw2bText(o, k, on, off) { Object.defineProperty(o, k, { get: () => REWORK.b2b ? on : off, enumerable: true, configurable: true }); }
rw2bText(TREES.factory.A.steps[3], 'txt', 'Unlocks Titans: walkers whose cover shields nearby infantry and that plant to breach buildings', 'Unlocks Titans: walkers that plant for siege range');
{ const s = TREES_BH.factory.A.steps[3], o = Object.getOwnPropertyDescriptor(s, 'txt'), off = o.get ? o.get() : o.value; rw2bText(s, 'txt', 'Unlocks Ruinmaws: living tunnels that surface behind the enemy and pour your army out', off); }
{ const s = TREES_AX.factory.A.steps[3], o = Object.getOwnPropertyDescriptor(s, 'txt'), off = o.get ? o.get() : o.value; rw2bText(s, 'txt', 'Unlocks Worldbreakers: fault lines that crack the ground and raise ridges across the lane', off); }

/* ---- Titan: cover ---- */
const coverInf = t => GROUP_OF[t] === 'inf' && (UDEF[t].fac || DEFAULT_FACTION) === 'lastfist';
let NOCOVER = null; // weapons that are not a ranged attack: every melee unit's, the ground effects and the commander abilities
const noCover = w => (NOCOVER || (NOCOVER = new Set([...Object.values(UDEF).filter(d => d.melee).map(d => d.weapon), 'gorebite', 'erupt', 'ruinbite', 'ruinchew', 'thorns', 'meteor', 'acidpool', 'spores', 'miteacid', 'orbital', 'beam']))).has(w);
function updateCover(g) {
  const ti = [[], []];
  for (const e of g.ents) if (e.kind === 'u' && e.type === 'titan' && e.hp > 0 && !e.gone && e.side >= 0 && e.side < 2) ti[e.side].push(e);
  const R2 = TITAN.coverR * TITAN.coverR;
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.hp <= 0 || !coverInf(e.type)) continue;
    let c = 0;
    if (!e.gone && e.side >= 0 && e.side < 2) for (const t of ti[e.side]) { const du = t.u - e.u, dv = t.v - e.v; if (du * du + dv * dv <= R2) { c = 1; break; } }
    if (c || e.cov) e.cov = c;
  }
}
/* ---- Titan: breaching ---- */
function breachTarget(g, u, want) { // the enemy building it plants for: the one it was sent at, else the nearest within reach
  const ok = b => b && b.kind === 'b' && b.side !== u.side && b.side !== NEUTRAL && b.hp > 0 && !b.shielded && effDist(u, b) <= TITAN.breach && visibleTo(g, u.side, b);
  if (ok(want)) return want;
  let best = null, bd = 1e9;
  for (const b of g.ents) if (b.kind === 'b' && ok(b)) { const k = effDist(u, b); if (k < bd || (k === bd && b.id < best.id)) { bd = k; best = b; } }
  return best;
}
// True: it handled the tick (planting, planted, unplanting, or walking in on a building). go: ordered away. Mobile, a
// building it would shoot at (on Attack, or sent at it) is walked up to until it can plant beside it (it never shells
// buildings from range); otherwise false: it fights like any gun
function titanBreach(g, u, d, st, cs, foes, dt, sp) {
  const go = st === 'retreat' || st === 'move' || !!(cs && cs.run) || u.aiBack > g.t;
  if (u.siege === 1 || u.siege === 3) { u.moving = false; u.tgt = 0; if (g.t >= u.sgT) { u.siege = u.siege === 1 ? 2 : 0; u.sgIdle = g.t; } return true; }
  const B = breachTarget(g, u, cs && cs.chase);
  if (u.siege === 2) {
    if (B) u.sgIdle = g.t;
    if (go || (!B && g.t - u.sgIdle >= TITAN.idle)) { u.siege = 3; u.sgT = g.t + TITAN.unplant; u.tgt = 0; return true; }
    const T = B || (cs && cs.want) || acquire(g, u, d, foes).best;
    u.moving = false; u.tgt = T ? T.id : 0;
    if (T) { if (Math.abs(T.u - u.u) > 1) u.face = T.u >= u.u ? 1 : -1; if (u.cd <= 0) { fire(g, u, T, d); u.cd = d.cd * rand(0.9, 1.1); } }
    return true;
  }
  if (go) return false;
  if (!B) {
    if (st === 'hold' || (cs && cs.go && !cs.chase)) return false;
    const T = cs && cs.chase ? cs.chase : acquire(g, u, d, foes).best;
    if (!T || T.kind !== 'b' || T.shielded) return false;
    u.tgt = 0; moveToward(u, d, T.u, T.v, dt, sp); return true;
  }
  u.siege = 1; u.sgT = g.t + TITAN.plant; u.moving = false; u.tgt = 0; if (Math.abs(B.u - u.u) > 1) u.face = B.u >= u.u ? 1 : -1;
  ev(g, { type: 'breach', u: u.u, side: u.side });
  return true;
}

/* ---- Ruinmaw ---- */
const ruinGate = R => !!R && R.type === 'ruinmaw' && R.hp > 0 && !R.bur && !R.moving && !R.dead;
const tunnelOk = e => e.kind === 'u' && UDEF[e.type].fac === 'bloomhost' && !UDEF[e.type].air && e.type !== 'ruinmaw' && e.hp > 0;
function tunnelEntrance(g, s) { // where side s's units go into the tunnel: beside its Hive, toward the field (Test Range: its edge)
  if (g.range) return { u: s === 0 ? RUIN.edge : L - RUIN.edge, v: 0 };
  const hq = g.sides[s].hq; let u = clamp(hq.u + dirOf(s) * (hq.half + 24), 0, L), v = hq.v;
  if (NAV.on && navShut(u, v)) [u, v] = navOpen(u, v);
  return { u, v };
}
const ruinMouth = (R, k) => { let u = clamp(R.u + R.face * RUIN.mouth, 0, L), v = R.v + ((k % 3) - 1) * 8; if (NAV.on && navShut(u, v)) [u, v] = navOpen(u, v); return [u, v]; };
const inTunnel = (g, R) => g.ents.filter(e => e.kind === 'u' && e.hp > 0 && e.tn && e.tn.r === R.id && e.tn.ph === 1);
function ruinDig(g, u) { // it moves: underground, and the gate closes (whoever is inside comes back out at the entrance)
  if (u.bur) return;
  u.bur = 1; u.gone = 1; u.tgt = 0;
  const E = tunnelEntrance(g, u.side); let k = 0;
  for (const e of inTunnel(g, u)) { e.tn = undefined; e.gone = 0; e.u = E.u + ((k % 3) - 1) * 10; e.v = E.v + (Math.floor(k / 3) % 3 - 1) * 10; k++; tunnelOut(g, e, E.u, E.v); }
  ev(g, { type: 'burrow', u: u.u, v: u.v, side: u.side });
}
function ruinUp(g, u) { // it stops: up it comes, and the gate opens
  u.bur = 0; u.gone = 0; u.gateT = g.t; u.outT = g.t;
  const w = P(u.u, u.v, 0); g.fx.push({ k: 'erupt', side: u.side, u: u.u, x: w.x, y: w.y, t: 0, life: 0.9, r: 36 });
  ev(g, { type: 'surface', u: u.u, v: u.v, side: u.side });
}
function tunnelOut(g, e, u, v) { // a unit back on the field (out of the mouth, or back at the entrance)
  const side = g.sides[e.side];
  if (side.direct) { if (e.po && e.po.o === 'tunnel') ctlSettle(g, e, u, v); }
  if (MAP_LANED && !UDEF[e.type].air) e.lane = laneAt(e.u, e.v);
  e.moving = false; e.nav = undefined;
}
function ruinEmit(g, R) { // the gate: the next unit whose transit is done comes out of its mouth
  if (g.t < (R.outT || 0)) return;
  let e = null;
  for (const x of g.ents) if (x.kind === 'u' && x.hp > 0 && x.tn && x.tn.r === R.id && x.tn.ph === 1 && x.tn.at <= g.t && (!e || x.tn.at < e.tn.at || (x.tn.at === e.tn.at && x.id < e.id))) e = x;
  if (!e) return;
  R.outN = (R.outN || 0) + 1; R.outT = g.t + RUIN.every; R.recoil = 1;
  const [u, v] = ruinMouth(R, R.outN);
  e.tn = undefined; e.gone = 0; e.u = u; e.v = v; e.face = R.face; e.tgt = 0;
  const fu = clamp(R.u + R.face * (RUIN.mouth + RUIN.fan), 0, L), fv = R.v; // they fan out in front of its mouth
  if (!g.sides[e.side].direct) e.rmF = { r: R.id, u: fu, v: fv, t: g.t + RUIN.stay }; // an AI's unit fights around the Ruinmaw
  tunnelOut(g, e, fu, fv);
  const w = P(u, v, 0); g.fx.push({ k: 'emerge', side: e.side, u, x: w.x, y: w.y, t: 0, life: 0.6 });
}
function ruinCollapse(g, R, by) { // killed: the tunnel collapses on whoever is inside
  for (const e of inTunnel(g, R)) { e.tn = undefined; e.gone = 0; e.u = R.u; e.v = R.v; e.hp = 0; kill(g, e, by, 'tunnel'); }
}
// Surfaced: a bite at a unit beside it, a chew at a building beside it
function ruinFight(g, u) {
  const mul = (sideBuff(g, u.side) ? NANO.dmg : 1) * outMul(g, u);
  if (g.t >= (u.bcd || 0)) {
    let T = null, bd = 1e9;
    for (const e of g.ents) if (e.kind === 'u' && e.side !== u.side && e.hp > 0 && !e.gone && !UDEF[e.type].air && !(e.phT > g.t)) { const k = effDist(u, e); if (k <= RUIN.biteR && (k < bd || (k === bd && e.id < T.id))) { bd = k; T = e; } }
    if (T) { u.bcd = g.t + RUIN.biteCd; u.recoil = 1; u.lastAct = g.t; u.face = T.u >= u.u ? 1 : -1; u.tgt = T.id; damage(g, T, RUIN.bite * mul, 'ruinbite', u.side, u); }
  }
  if (g.t >= (u.ccd || 0)) {
    let B = null, bd = 1e9;
    for (const b of g.ents) if (b.kind === 'b' && b.side !== u.side && b.side !== NEUTRAL && b.hp > 0 && !b.shielded) { const k = effDist(u, b); if (k <= RUIN.chewR && (k < bd || (k === bd && b.id < B.id))) { bd = k; B = b; } }
    if (B) {
      u.ccd = g.t + RUIN.chewCd; u.recoil = 1; u.lastAct = g.t; u.face = B.u >= u.u ? 1 : -1;
      damage(g, B, RUIN.chew * mul, 'ruinchew', u.side, u);
      const w = P(clamp(u.u + u.face * 22, 0, L), u.v, 8); fxBoom(g, w.x, w.y, 14);
    }
  }
}
// The Ruinmaw's tick before the usual code. True: handled (an AI's Ruinmaw on its way to, or holding, the spot it chose)
const ruinReach = e => e.kind === 'b' ? RUIN.chewR : RUIN.biteR - 2; // close enough to bite (a unit) or chew (a building)
const ruinFoe = (g, u) => g.ents.some(e => e.side !== u.side && e.side !== NEUTRAL && e.hp > 0 && !e.gone && !e.shielded && !(e.kind === 'u' && UDEF[e.type].air) && effDist(u, e) <= ruinReach(e) && visibleTo(g, u.side, e));
function ruinStep(g, u, d, side, dt, st, cs) {
  if (!side.direct && u.rmGo) {
    const [tu, tv] = u.rmGo;
    if (Math.hypot(tu - u.u, tv - u.v) > 4) { ruinDig(g, u); u.tgt = 0; if (!moveToward(u, d, tu, tv, dt, 1)) { u.u = tu; u.v = tv; } u.moving = true; return true; }
    if (u.bur || u.moving) { u.moving = false; ruinUp(g, u); }
    u.rmAt = 1; ruinFight(g, u); ruinEmit(g, u); return true;
  }
  u.rmAt = 0;
  // on Attack, or sent at a target: it comes up to fight what it reaches (a move order picks its spot: it never stops on the way)
  const T = cs && cs.chase, near = T ? T.hp > 0 && effDist(u, T) <= ruinReach(T) : (st === 'attack' || st === 'run') && ruinFoe(g, u);
  if (near) { u.moving = false; if (u.bur) ruinUp(g, u); ruinFight(g, u); ruinEmit(g, u); return true; }
  if (u.bur) { if (u.moving) return false; ruinUp(g, u); } // stopped: it surfaces where it is
  else if (u.moving) { ruinDig(g, u); return false; }
  ruinFight(g, u); ruinEmit(g, u);
  return false;
}
// A unit sent into the tunnel. True: handled (walking to the entrance, or inside)
function tunnelStep(g, u, d, side, dt, sp) {
  const T = u.tn;
  if (T.ph === 1) { u.moving = false; u.tgt = 0; u.chT = 0; return true; } // inside: off the field
  const R = ctlEnt(g, T.r);
  if (!R || R.hp <= 0 || R.dead || R.type !== 'ruinmaw') { u.tn = undefined; if (side.direct && u.po && u.po.o === 'tunnel') ctlHere(g, u); return false; }
  const E = tunnelEntrance(g, u.side);
  u.tgt = 0; u.chT = 0;
  if (Math.hypot(E.u - u.u, E.v - u.v) > RUIN.enter) { moveToward(u, d, E.u, E.v, dt, sp); return true; }
  u.moving = false;
  if (!ruinGate(R)) { if (!side.direct) u.tn = undefined; return !!u.tn; } // the gate is shut: a player's unit waits, an AI's gives up
  T.ph = 1; T.at = g.t + RUIN.transit; u.gone = 3; u.rmF = undefined;
  const w = P(u.u, u.v, 0); g.fx.push({ k: 'emerge', side: u.side, u: u.u, x: w.x, y: w.y, t: 0, life: 0.45, inn: 1 });
  return true;
}
// The Tunnel order (command(…, 'tunnel')): the side's surfaced Ruinmaw nearest the enemy, or null
function tunnelGate(g, s) {
  let R = null; const dir = dirOf(s);
  for (const e of g.ents) if (e.kind === 'u' && e.side === s && ruinGate(e) && (!R || dir * e.u > dir * R.u || (e.u === R.u && e.id < R.id))) R = e;
  return R;
}

/* ---- Worldbreaker ---- */
function ruptureFire(g, u, T) {
  const side = g.sides[u.side], ridge = g.t >= (u.rdCd || 0);
  let at = { u: T.u, v: T.v }, aim = false;
  if (ridge) { u.rdCd = g.t + WB.ridgeCd; if (!side.direct && side.persona) { at = wbAim(g, u, T); aim = true; } }
  const su = u.u + u.face * 6, sv = u.v, du = at.u - su, dv = at.v - sv, dd = Math.max(1, Math.hypot(du, dv));
  const len = aim ? Math.min(dd, WB.range) : Math.max(WB.range, Math.min(dd, WB.range + (T.kind === 'b' ? T.half : 0))); // through its target out to full range (an AI's aimed ridge: to the spot)
  (g.rup || (g.rup = [])).push({ id: g.nid++, side: u.side, su, sv, du: du / dd, dv: dv / dd, len, t0: g.t, f: 0, r: ridge ? 1 : 0, dmg: WB.dmg * (sideBuff(g, u.side) ? NANO.dmg : 1) * outMul(g, u), hit: [] });
  u.recoil = 1; u.slamT = g.t; u.lastAct = g.t; u.face = du >= 0 ? 1 : -1;
  g.shake = Math.max(g.shake || 0, 2);
  ev(g, { type: 'rupture', u: u.u, side: u.side });
}
// Where an AI's ridge goes (the crack ends there): in front of a melee charge, between its retreating army and the enemy,
// else just behind its target (cutting the reinforcements walking up behind it). The crack ends at the spot.
function wbAim(g, u, T) {
  const s = u.side, side = g.sides[s], dir = dirOf(s), R = WB.range;
  const foes = g.ents.filter(e => e.kind === 'u' && e.side === 1 - s && e.hp > 0 && !e.gone && !UDEF[e.type].air && Math.hypot(e.u - u.u, e.v - u.v) <= R + 60 && visibleTo(g, s, e));
  const toward = (p, back) => { const du = p.u - u.u, dv = p.v - u.v, dd = Math.max(1, Math.hypot(du, dv)), k = clamp(dd - back, 50, R) / dd; return { u: u.u + du * k, v: u.v + dv * k }; };
  const melee = foes.filter(e => UDEF[e.type].melee && dir * (e.u - u.u) > -20);
  if (melee.length >= 2) { const c = { u: melee.reduce((a, e) => a + e.u, 0) / melee.length, v: melee.reduce((a, e) => a + e.v, 0) / melee.length }; return toward(c, 45); }
  if ((side.stance === 'retreat' || g.ents.some(e => e.kind === 'u' && e.side === s && e.aiBack > g.t)) && foes.length) {
    const near = foes.reduce((a, e) => Math.hypot(e.u - u.u, e.v - u.v) < Math.hypot(a.u - u.u, a.v - u.v) ? e : a, foes[0]); return toward(near, 40);
  }
  return toward(T, -60);
}
// The cracks running: each hits what it passes once; one that ends in a ridge raises it
function updateRuptures(g) {
  if (!g.rup || !g.rup.length) return;
  const keep = [];
  for (const r of g.rup) {
    const nf = Math.min(r.len, (g.t - r.t0) * WB.speed), hw = WB.w / 2;
    for (const e of g.ents) {
      if (e.side !== 1 - r.side || e.hp <= 0 || e.gone || (e.kind === 'u' && UDEF[e.type].air) || r.hit.includes(e.id)) continue;
      const pu = e.u - r.su, pv = e.v - r.sv, t = pu * r.du + pv * r.dv, off = Math.abs(pu * r.dv - pv * r.du), ex = e.kind === 'b' ? e.half : 0;
      if (off > hw + ex || t > nf + ex || t < -ex) continue;
      r.hit.push(e.id); damage(g, e, r.dmg, 'rupture', r.side);
    }
    r.f = nf;
    if (nf >= r.len) { if (r.r) raiseRidge(g, r); } else keep.push(r);
  }
  g.rup = keep;
}
// Is (u, v) ground a unit can stand on (a ridge's ends stop at walls and the lane's edge)
const rdgOpen = (u, v) => u >= 4 && u <= L - 4 && (MAP_2D ? Math.abs(v) <= MAP.size.h / 2 - 8 && (!NAV.on || !navShut(u, v)) : Math.abs(v) <= LANE_V);
function raiseRidge(g, r) {
  const cu = r.su + r.du * r.len, cv = r.sv + r.dv * r.len, au = -r.dv, av = r.du; // across the crack
  if (!rdgOpen(cu, cv)) return;
  const reach = sg => { let k = 0; while (k < 260 && rdgOpen(cu + au * sg * (k + 5), cv + av * sg * (k + 5))) k += 5; return k; };
  const sA = -reach(-1), sB = reach(1), half = WB.len / 2;
  let lo = Math.max(sA, -half), hi = Math.min(sB, half);
  if (hi - lo < WB.len) { if (lo > -half) hi = Math.min(sB, lo + WB.len); else lo = Math.max(sA, hi - WB.len); }
  if (lo - sA < WB.gap && sB - hi < WB.gap) { if (sB - hi >= lo - sA) hi = Math.min(hi, sB - WB.gap); else lo = Math.max(lo, sA + WB.gap); } // never wall to wall
  if (hi - lo < 30) return;
  const R = { id: r.id, side: r.side, au: cu + au * lo, av: cv + av * lo, bu: cu + au * hi, bv: cv + av * hi, t0: g.t, t1: g.t + WB.life, oa: lo - sA >= WB.gap * 0.6 ? 1 : 0, ob: sB - hi >= WB.gap * 0.6 ? 1 : 0 };
  if (!R.oa && !R.ob) R.ob = 1;
  (g.rdg || (g.rdg = [])).push(R);
  // enemy ground units standing where it rises: pushed to the nearer side
  const lu = R.bu - R.au, lv = R.bv - R.av, ll = Math.max(1, Math.hypot(lu, lv)), nu = -lv / ll, nv = lu / ll, need = WB.thick / 2 + 8;
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.side !== 1 - r.side || e.hp <= 0 || e.gone || UDEF[e.type].air) continue;
    const pu = e.u - R.au, pv = e.v - R.av, t = (pu * lu + pv * lv) / ll, off = pu * nu + pv * nv;
    if (t < -4 || t > ll + 4 || Math.abs(off) >= need) continue;
    const sg = off > 0 || (off === 0 && nu * r.du + nv * r.dv > 0) ? 1 : -1, k = sg * need - off;
    e.u = clamp(e.u + nu * k, 0, L); e.v += nv * k; e.nav = undefined;
    if (NAV.on && navShut(e.u, e.v)) navEject(e);
  }
  g.shake = Math.max(g.shake || 0, 3);
  ev(g, { type: 'ridge', u: cu, v: cv, side: r.side });
}
function updateRidges(g) { if (g.rdg && g.rdg.length) g.rdg = g.rdg.filter(R => R.t1 > g.t); }
// Moving past ridges: a ground unit of the other side whose way crosses a ridge walks to the nearer open end first, and a
// step that would cross one is undone (sliding along it where it can). RDG.list: the ridges of the game being updated.
const RDG = { list: null, busy: false };
function rdgCross(R, u0, v0, u1, v1, m) { // does the step (u0, v0) → (u1, v1) cross the ridge's line within its length (+m)?
  const lu = R.bu - R.au, lv = R.bv - R.av, ll = Math.max(1, Math.hypot(lu, lv)), nu = -lv / ll, nv = lu / ll;
  const o0 = (u0 - R.au) * nu + (v0 - R.av) * nv, o1 = (u1 - R.au) * nu + (v1 - R.av) * nv;
  if ((o0 > 0) === (o1 > 0) || o0 === o1) return false;
  const k = o0 / (o0 - o1), t = ((u0 + (u1 - u0) * k - R.au) * lu + (v0 + (v1 - v0) * k - R.av) * lv) / ll;
  return t >= -m && t <= ll + m;
}
function ridgeMove(u, d, tu, tv, dt, mul) {
  let wu = tu, wv = tv, best = null, bd = 1e9;
  for (const R of RDG.list) {
    if (R.side === u.side || !rdgCross(R, u.u, u.v, tu, tv, 4)) continue;
    const lu = R.bu - R.au, lv = R.bv - R.av, ll = Math.max(1, Math.hypot(lu, lv)), su = lu / ll, sv = lv / ll;
    for (const [ok, eu, ev_] of [[R.oa, R.au - su * WB.end, R.av - sv * WB.end], [R.ob, R.bu + su * WB.end, R.bv + sv * WB.end]]) {
      if (!ok) continue;
      const k = Math.hypot(eu - u.u, ev_ - u.v) + Math.hypot(tu - eu, tv - ev_);
      if (k < bd) { bd = k; best = [eu, ev_]; }
    }
  }
  const u0 = u.u, v0 = u.v; let r;
  RDG.busy = true;
  if (best) { // to the end, straight and at full speed (a lane map's walls: around them as usual)
    [wu, wv] = best;
    if (NAV.on) { const k = u.lane; u.lane = null; r = moveToward(u, d, wu, wv, dt, mul); u.lane = k; }
    else { const du = wu - u.u, dv = wv - u.v, dd = Math.hypot(du, dv), st = d.speed * mul * dt; if (dd < 2) { u.moving = false; r = false; } else { const k = Math.min(1, st / dd); u.u = clamp(u.u + du * k, 0, L); u.v += dv * k; if (Math.abs(du) > 0.5) u.face = Math.sign(du); u.moving = true; r = true; } }
  }
  else r = moveToward(u, d, wu, wv, dt, mul);
  RDG.busy = false;
  const crosses = (a, b) => RDG.list.some(R => R.side !== u.side && rdgCross(R, u0, v0, a, b, 2));
  if (crosses(u.u, u.v)) { const u1 = u.u, v1 = u.v; if (!crosses(u0, v1)) u.u = u0; else if (!crosses(u1, v0)) u.v = v0; else { u.u = u0; u.v = v0; } }
  return r;
}

/* ---- each tick (update), b2b on ---- */
function update2b(g) {
  updateCover(g);
  updateRuptures(g);
  updateRidges(g);
  RDG.list = g.rdg && g.rdg.length ? g.rdg : null;
}

/* ---- the AI ---- */
// An AI side's Titans, Ruinmaws and Worldbreakers (every difficulty, each decision): infantry walk in a Titan's shadow; a
// Ruinmaw tunnels to a spot beside the enemy's economy (else onto a flank behind its front), and while it is up there,
// ground units at home go through its tunnel. (Planting beside buildings and the ridges are the units' own logic.)
function aiRework2b(g, s, mine) {
  const side = g.sides[s], dir = dirOf(s), opp = 1 - s;
  // Titans: on the attack, Last Fist infantry more than TITAN.escort ahead of the nearest Titan wait for it (they fight what
  // is in reach); planted Titans are never pulled back (aiBack skips them)
  const ti = mine.filter(u => u.type === 'titan');
  if (ti.length && side.stance === 'attack') for (const u of mine) {
    if (!coverInf(u.type) || u.id === side.scoutId) continue;
    let near = null, nd = 1e9; for (const t of ti) { const k = Math.abs(t.u - u.u) + Math.abs(t.v - u.v) * 0.5; if (k < nd) { nd = k; near = t; } }
    if (near && nd < 400 && dir * (u.u - near.u) > TITAN.escort) u.aiWait = g.t + 1.5;
  }
  // Ruinmaws
  for (const R of mine.filter(u => u.type === 'ruinmaw')) {
    if (R.rmGo && R.hp < R.maxHp * RUIN.back && !R.rmHome) { R.rmGo = [rallyU(s), MAP.bases[s].rally[1]]; R.rmHome = 1; continue; } // badly hurt: home, underground
    if (R.rmHome) { if (R.rmAt && R.hp >= R.maxHp * 0.8) { R.rmGo = null; R.rmHome = 0; } continue; }
    const spot = R.rmGo ? null : ruinSpot(g, s, R);
    if (spot) { R.rmGo = spot; R.rmSince = g.t; continue; }
    if (R.rmGo && R.rmAt) {
      const busy = g.ents.some(b => b.kind === 'b' && b.side === opp && b.hp > 0 && effDist(R, b) <= 150) || g.ents.some(e => e.tn && e.tn.r === R.id);
      if (!busy && g.t - (R.rmSince || 0) > RUIN.stay) { R.rmGo = null; continue; } // nothing left here: pick another spot next time
      // the gate is up: ground units at home go through
      const n = g.ents.filter(e => e.tn && e.tn.r === R.id && e.hp > 0).length;
      if (n < RUIN.maxIn) {
        const pool = mine.filter(e => tunnelOk(e) && !e.tn && !e.temp && e.id !== side.scoutId && !capBusy(side, e.id) && Math.abs(e.u - hqU(s)) < 520).sort((a, b) => a.id - b.id);
        for (const e of pool.slice(0, Math.min(RUIN.send, RUIN.maxIn - n))) { e.tn = { r: R.id, ph: 0 }; e.aiWait = 0; e.aiBack = 0; }
      }
    }
  }
}
// Where an AI's Ruinmaw surfaces: beside the enemy economy building it knows of that is least covered by enemy guns it
// knows (none known: behind the enemy front, on the flank); null while its army has nothing to attack and it is home
function ruinSpot(g, s, R) {
  const opp = 1 - s, f = g.fog[s], dir = dirOf(s);
  const guns = Object.values(f.ghosts).filter(gh => gh.side === opp && (gh.type === 'turret' || gh.type === 'hq' || gh.type === 'bunker'));
  let best = null, bs = 1e9;
  for (const gh of Object.values(f.ghosts)) {
    if (gh.side !== opp || !['refinery', 'reactor', 'habitat'].includes(gh.type)) continue;
    const cover = guns.filter(x => Math.hypot(x.u - gh.u, x.v - gh.v) < 320).length;
    const sc = cover * 400 + Math.hypot(gh.u - R.u, gh.v - R.v) * 0.5;
    if (sc < bs || (sc === bs && best && gh.id < best.id)) { bs = sc; best = gh; }
  }
  if (best) {
    const side = Math.sign(best.v - R.v) || 1; let u = best.u, v = best.v - side * (best.half + 18); // beside it, on the near side across the lane
    if (!MAP_2D) v = clamp(v, -LANE_V + 8, LANE_V - 8);
    if (NAV.on && navShut(u, v)) [u, v] = navOpen(u, v);
    return [clamp(u, 0, L), v];
  }
  const fr = g.front[opp];
  if (fr === null || g.sides[s].stance !== 'attack') return null;
  let u = clamp(fr + dir * 160, 0, L), v;
  if (MAP_LANED) { const ln = MAP.lanes[R.lane != null ? R.lane : laneAt(R.u, R.v)]; v = laneY(ln, u) + (R.id % 2 ? 1 : -1) * ln.width * 0.38; }
  else v = (R.id % 2 ? 1 : -1) * LANE_V * 0.8;
  if (NAV.on && navShut(u, v)) [u, v] = navOpen(u, v);
  return [u, v];
}
// The AI's reads for its scores (v2.83)
const aiMeleeShare = th => th.length ? th.filter(u => UDEF[u.type].melee && !UDEF[u.type].air).length / th.length : 0;
const aiSiegeT = (g, t) => AI_SIEGE.includes(t) && !(t === 'ruinmaw' && rwB2b(g)); // a Ruinmaw is no siege gun in batch 2b
// Persona tastes for the two units with no Last Fist counterpart in batch 2b (AI_TWIN maps them to the Titan otherwise)
const RW2B_TASTE = { ruinmaw: { aggressor: 1.2, trickster: 1.3, turtle: 0.8, economist: 1.0 }, worldbreaker: { turtle: 1.3, economist: 1.1, aggressor: 0.9, trickster: 1.0 } };
