/* ---------- Faction rework, batch 3a (v2.84, docs/FACTION_REWORK.md "Batch 3"): Leaper, Riftstalker, Parallax, Ravager ----------
   REWORK.b3a, stored per game in g.rw like b2a and b2b (rwB3a). Off: the four units play exactly as in v2.83 and nothing below
   runs or is saved. On (the new-game default) each keeps its internal id and plays through its own definition for that game
   (rwD, RW3A_D: a copy of its UDEF entry; UDEF itself never changes).
   - Leaper (Bloomhost): a parasite. Its leap (range and cooldown as before) now latches it onto a host (latchJump): vehicles,
     walkers and ground units of LATCH.big supply or more first, otherwise the heaviest ground unit in reach; never aircraft
     or buildings. Latched (u.lt = the host's id) it rides on the host (same spot), eats LATCH.dps per second (every
     LATCH.tick s) and the host moves LATCH.slow slower (host.ltT, refreshed every tick; several Leapers don't slow more).
     At most LATCH.max Leapers per host. It can be hit like any unit (it stands where the host stands, so splash at the host
     reaches it). The host dying hatches LATCH.hatch temporary Skitterlings per Leaper (LATCH.life s, no supply, can't
     capture nodes: u.noCap), at most LATCH.hatchMax per host; the Leaper drops off and carries on.
   - Riftstalker (Axiarchs): its phase-step strike prefers ranged units in reach (the longest range first). v2.85 (Part 0
     of batch 3b): it no longer fades back after striking; it stays and fights. Out on a strike (u.rsH), its shields
     breaking blinks it straight back to where it stepped from (u.rsBrk, set by damage1). A strike that kills
     chain-blinks it to another ranged enemy within RS.r (up to RS.chain per strike), no cooldown; a kill with no chain
     target and nothing else in reach, or nothing in reach for RS.idle s, blinks it home too (rsHome).
   - Parallax (Axiarchs): no leap. Every SWAP.every s it looks for an Axiarch ground ally within SWAP.r under SWAP.low
     health (the most expensive first) and swaps places with it (SWAP.cd cooldown); never while its own health is under
     SWAP.self, never with an exiled, burrowed or tunnelling unit. Its blows still disrupt.
   - Ravager (Bloomhost): no kill frenzy. Every ground unit that dies (either side; not Mites or temporary Skitterlings)
     leaves remains for RAV.life s (g.rem). A Ravager within RAV.r of remains, out of combat (nothing in reach or chase
     range, unhurt RAV.calm s) or under RAV.low health, devours them over RAV.eat s without attacking: then RAV.heal of its
     max health back and a stack (u.rvS, up to RAV.max): +RAV.dmg damage and +RAV.hp max health each, kept until it dies. */
const rwB3a = g => !!(g && g.rw && g.rw.b3a);
const LATCH = { dps: 10, tick: 0.5, slow: 0.3, max: 3, big: 4, hatch: 2, hatchMax: 6, life: 20, land: 40, aim: 320 };
const RS = { chain: 2, r: 130, aim: 320, guard: 70, idle: 0.5, aiShp: 0.5 }; // idle, aiShp (v2.85): see rsOut; an AI's strike needs half its shields (the v2.37 timing rule asks 75%)
const SWAP = { r: 160, low: 0.3, self: 0.4, cd: 10, every: 0.25, back: 3, guard: 40 };
const RAV = { jaw: 14, life: 6, r: 60, eat: 1.5, heal: 0.3, dmg: 0.1, hp: 0.1, max: 3, low: 0.6, calm: 2, seek: 220, safe: 150 };
const LATCH_WALK = ['titan', 'hydra', 'bastion', 'gravemantle', 'eventide', 'worldbreaker'];
Object.assign(DMG, { latch: { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 0, building: 0 } }); // a latched Leaper feeding (ground units)
// The batch's own definitions (built from the current UDEF entry, so setBalance / setRedesign still apply underneath)
const RW3A_D = {
  leaper: () => Object.assign({}, UDEF.leaper, { latch: true }),
  riftstalker: () => Object.assign({}, UDEF.riftstalker, { chain: undefined, rsChain: true }),
  parallax: () => { const d = Object.assign({}, UDEF.parallax, { swap: true }); delete d.leap; return d; },
  ravager: () => { const d = Object.assign({}, UDEF.ravager, { devour3: true }); delete d.bloodfrenzy; return d; },
};
EX_TIMERS.push('dvT', 'swCd', 'swChk', 'ltN'); // v2.84: exiled mid-devour, mid-swap cooldown, mid-feed: resumed on return

// Texts the player sees follow the new-game default (numbers in UNIT_TIPS, read live)
for (const [t, on] of [['leaper', 'Parasite that leaps onto vehicles, walkers and other big ground units and latches on, eating its host and slowing it. Shoot it off; if the host dies with Leapers on it, Skitterlings hatch.'],
  ['riftstalker', 'Backline assassin that phase-steps onto ranged units and stays to fight. A kill chains it to the next ranged target; breaking its shields, or running out of targets, blinks it straight home.'],
  ['parallax', 'Armored guardian that swaps places with a badly wounded ally nearby, taking its place in the fight. Its blows weaken enemy fire. Spread your damage or kill it first.'],
  ['ravager', 'Hulking devourer that eats the remains of fallen units to heal and grow bigger and stronger, up to three times. Kill it early, before it feeds.']]) {
  const d0 = UDEF[t].desc; Object.defineProperty(UDEF[t], 'desc', { get: () => REWORK.b3a ? on : d0, enumerable: true, configurable: true });
}
function rw3aText(o, k, on) { const x = Object.getOwnPropertyDescriptor(o, k), off = x.get ? x.get() : x.value; Object.defineProperty(o, k, { get: () => REWORK.b3a ? on : off, enumerable: true, configurable: true }); }
rw3aText(TREES_BH.barracks.A.steps[2], 'txt', 'Unlocks Leapers: parasites that latch onto big ground units and eat them');
rw3aText(TREES_BH.barracks.A.steps[3], 'txt', 'Unlocks Ravagers: devourers that eat the fallen to heal and grow');
rw3aText(TREES_AX.barracks.A.steps[2], 'txt', 'Unlocks Riftstalkers: backline assassins that stay to fight, chain kills and blink home');
rw3aText(TREES_AX.barracks.A.steps[3], 'txt', 'Unlocks Parallaxes: guardians that swap places with wounded allies');

/* ---- Leaper: latching ---- */
const latchBig = e => { const d = UDEF[e.type]; return (e.arm || d.armor) === 'vehicle' || LATCH_WALK.includes(e.type) || d.pop >= LATCH.big; };
const latchW = e => e.maxHp + (e.maxShp || 0); // "heaviest": the most health and shields
const hostOk = (g, u, H) => !!H && H.kind === 'u' && H.side !== u.side && H.side !== NEUTRAL && H.hp > 0 && !H.dead && !H.gone && !H.bur && !H.leaping && !H.lt && !H.ltH && !UDEF[H.type].air && !(H.phT > g.t) && !H.tn && visibleTo(g, u.side, H);
const latchN = (g, H) => { let n = 0; for (const e of g.ents) if (e.kind === 'u' && e.hp > 0 && !e.gone && (e.lt === H.id || e.ltH === H.id)) n++; return n; };
function latchRank(g, u, H, R) { // [tier, -weight, distance] or null (not a host in reach)
  if (!hostOk(g, u, H)) return null;
  const k = effDist(u, H); if (k > R) return null;
  return [latchBig(H) ? 0 : 1, -latchW(H), k];
}
const rankLess = (a, b, ea, eb) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || ea.id - eb.id;
function latchPick(g, u, foes, R, only) {
  let best = null, br = null;
  for (const H of only ? [only] : foes) {
    if (H.kind !== 'u') continue;
    const r = latchRank(g, u, H, R); if (!r || latchN(g, H) >= LATCH.max) continue;
    if (!best || rankLess(r, br, H, best) < 0) { best = H; br = r; }
  }
  return best;
}
// Start a leap onto a host (true: it jumped, or an AI's Leaper walked toward its chosen host). Same rules as the old leap:
// cooldown, not snared, not on Retreat or a move, a holding Leaper only within holdR of its spot
function latchJump(g, u, d, st, cs, foes, best, dt, sp, side) {
  if (g.t < u.leapCd || u.snT > g.t || u.aiHold > g.t || st === 'retreat' || st === 'move' || (cs && cs.run) || best) return false;
  let H = latchPick(g, u, foes, d.leap.range, cs && cs.chase && cs.chase.kind === 'u' ? cs.chase : null);
  if (H && st === 'hold' && u.holdU !== undefined && Math.hypot(H.u - u.holdU, H.v - u.holdV) > MECH7C.holdR + d.range) H = null;
  if (H) {
    u.ltH = H.id; u.lu = H.u; u.lv = H.v; u.ld = Math.max(1, Math.hypot(H.u - u.u, H.v - u.v)); u.leaping = 1; u.tgt = 0; u.chT = 0;
    ev(g, { type: 'leap', u: u.u, side: u.side });
    return true;
  }
  if (!side.direct && u.ltAim && !(cs && (cs.chase || cs.go))) { // an AI's Leaper heads for the big unit it was aimed at
    const A = ctlEnt(g, u.ltAim);
    if (A && hostOk(g, u, A) && effDist(u, A) <= LATCH.aim) { moveToward(u, d, A.u, A.v, dt, sp); return true; }
    u.ltAim = 0;
  }
  return false;
}
// In flight onto a host, or riding one. True: handled (nothing else this tick)
function latchRide(g, u, d, side, dt) {
  if (u.ltH) {
    const H = ctlEnt(g, u.ltH), ok = hostOk(g, u, H);
    if (ok) { u.lu = H.u; u.lv = H.v; } // it homes in on the host
    const du = u.lu - u.u, dv = u.lv - u.v, dd = Math.hypot(du, dv), st = d.leap.speed * dt;
    if (dd <= st) {
      u.u = u.lu; u.v = u.lv; u.z = 0; u.leaping = 0; u.leapCd = g.t + d.leap.cd; u.ltH = 0;
      if (ok && latchN(g, H) < LATCH.max) {
        u.lt = H.id; u.ltN = g.t + LATCH.tick; u.ltF = 0; H.ltT = g.t + 0.1;
        const w = P(u.u, u.v, UDEF[H.type].h * 0.6 * US); g.fx.push({ k: 'latch', side: u.side, u: u.u, x: w.x, y: w.y, t: 0, life: 0.5 });
        ev(g, { type: 'latch', u: u.u, side: u.side, host: H.type });
      }
    } else { u.u += du / dd * st; u.v += dv / dd * st; u.z = Math.sin(Math.PI * clamp(1 - dd / u.ld, 0, 1)) * Math.min(26, u.ld * 0.18); u.face = du >= 0 ? 1 : -1; }
    u.moving = true; return true;
  }
  if (!u.lt) return false;
  const H = ctlEnt(g, u.lt);
  if (!H || H.hp <= 0 || H.dead || H.gone || H.bur || H.tn || Math.hypot(H.u - u.u, H.v - u.v) > LATCH.land) { latchOff(u); return false; }
  u.u = H.u; u.v = H.v; u.face = H.face; u.moving = H.moving; u.tgt = H.id; u.chT = 0; u.z = 0;
  H.ltT = g.t + 0.1;
  if (g.t >= u.ltN) {
    u.ltN += LATCH.tick;
    if (!side.hush) { damage(g, H, LATCH.dps * LATCH.tick * (sideBuff(g, u.side) ? NANO.dmg : 1) * outMul(g, u), 'latch', u.side, u); u.lastAct = g.t; u.ltF = Math.min(8, (u.ltF || 0) + 1); }
  }
  return true;
}
function latchOff(u) { u.lt = 0; u.z = 0; u.ltF = 0; }
// A host died (kill): each Leaper on it drops off and hatches LATCH.hatch Skitterlings, at most LATCH.hatchMax per host
function latchHatch(g, H) {
  let n = 0;
  for (const e of g.ents.slice()) {
    if (e.kind !== 'u' || e.lt !== H.id) continue;
    latchOff(e); if (e.hp <= 0) continue;
    for (let i = 0; i < LATCH.hatch && n < LATCH.hatchMax; i++, n++) {
      const a = n * 2.39996, pu = clamp(H.u + Math.cos(a) * 14, 0, L), pv = H.v + Math.sin(a) * 9;
      const k = spawnUnit(g, e.side, 'skitterling', pu, pv);
      Object.assign(k, { temp: g.t + LATCH.life, tLife: LATCH.life, tSrc: 'hatch', noCap: 1 }); k.laneV = clamp(pv, -LANE_V, LANE_V); arriveOrders(g, k);
    }
    const w = P(H.u, H.v, 6); g.fx.push({ k: 'hatch', side: e.side, u: H.u, x: w.x, y: w.y, t: 0, life: 0.8 });
  }
  if (n) ev(g, { type: 'hatch', u: H.u, v: H.v, n });
}

/* ---- Riftstalker: backline strikes, chain blinks, blinking home ---- */
function rsRanged(g, s, e) {
  if (e.kind !== 'u' || e.side === s || e.side === NEUTRAL || e.hp <= 0 || e.gone || e.leaping || e.phT > g.t || UDEF[e.type].air) return false;
  const d = rwD(g, e.type); return !!d.weapon && !d.melee && d.range > 40;
}
function rsPick(g, u, foes, cu, cv, lo, hi) { // the ranged enemy to strike: within [lo, hi] of (cu, cv), the longest range first, then nearest
  let best = null, br = -1, bd = 1e9;
  for (const e of foes) {
    if (!rsRanged(g, u.side, e) || !visibleTo(g, u.side, e)) continue;
    const k = Math.hypot(e.u - cu, e.v - cv); if (k > hi || k < lo) continue;
    const r = rwD(g, e.type).range;
    if (r > br || (r === br && (k < bd || (k === bd && e.id < best.id)))) { best = e; br = r; bd = k; }
  }
  return best;
}
// The strike: the old phase-step, onto a ranged unit first. True: it stepped (or an AI's walked toward its target)
function rsJump(g, u, d, st, cs, foes, best, dt, sp, side) {
  if (best || g.t < u.leapCd || u.snT > g.t || u.aiHold > g.t || st === 'retreat' || st === 'move' || (cs && cs.run)) return false;
  if (st === 'hold' && u.holdU !== undefined) return false; // holding: the usual hold rules (and the old leap)
  const O = cs && cs.chase, T = O ? (O.kind === 'u' && O.hp > 0 && !O.gone && !UDEF[O.type].air && effDist(u, O) >= d.leap.min && effDist(u, O) <= d.leap.range && visibleTo(g, u.side, O) ? O : null) : rsPick(g, u, foes, u.u, u.v, d.leap.min, d.leap.range); // a target order: that unit
  if (T) {
    const dd = Math.max(1, Math.hypot(T.u - u.u, T.v - u.v)), k = Math.max(0, (dd - d.range * 0.7) / dd);
    u.fu = u.u; u.fv = u.v; u.fadeArm = 1; u.rsH = 1; u.rsC = 0;
    u.lu = u.u + (T.u - u.u) * k; u.lv = u.v + (T.v - u.v) * k; u.ld = Math.max(1, Math.hypot(u.lu - u.u, u.lv - u.v)); u.leaping = 1; u.tgt = 0;
    ev(g, { type: 'leap', u: u.u, side: u.side });
    return true;
  }
  if (!O && !side.direct && u.rsAim && !(cs && cs.go)) { // an AI's Riftstalker closes on the exposed backline unit it was aimed at
    const A = ctlEnt(g, u.rsAim);
    if (A && rsRanged(g, u.side, A) && visibleTo(g, u.side, A) && effDist(u, A) <= RS.aim) { moveToward(u, d, A.u, A.v, dt, sp); return true; }
    u.rsAim = 0;
  }
  return false;
}
// After a blow out on a strike (v2.85, Part 0 of batch 3b: it no longer fades back after every blow, so its shields can
// break out there and blink it home): a kill chains to the next ranged enemy within RS.r (no cooldown, up to RS.chain per
// strike); a kill with no chain target and nothing else in reach blinks it home; otherwise it stays and fights
function rsAfter(g, u, d, T, foes) {
  if (T.hp > 0) return; // it stays on its target
  if ((u.rsC || 0) < RS.chain) {
    const N = rsPick(g, u, foes, u.u, u.v, 0, RS.r);
    if (N) {
      const dd = Math.max(1, Math.hypot(N.u - u.u, N.v - u.v)), k = Math.max(0, (dd - d.range * 0.7) / dd), a = P(u.u, u.v, 12);
      u.u += (N.u - u.u) * k; u.v += (N.v - u.v) * k; if (Math.abs(N.u - u.u) > 1) u.face = N.u >= u.u ? 1 : -1;
      u.rsC = (u.rsC || 0) + 1; u.cd = Math.min(u.cd, 0.15); u.tgt = N.id; u.nav = undefined; u.rsIdle = 0;
      const b = P(u.u, u.v, 12); g.fx.push({ k: 'rsblink', side: u.side, x: a.x, y: a.y, x2: b.x, y2: b.y, u: u.u, t: 0, life: 0.45 });
      ev(g, { type: 'chain', u: u.u, side: u.side });
      return;
    }
  }
  if (!acquire(g, u, d, foes).best) rsHome(g, u); // out of chain targets, nothing in reach: home
}
// Out on a strike between blows (v2.85): ordered away, it is no longer out there; nothing in reach for RS.idle s (its
// target walked off or died to someone else), it blinks home. True: it blinked
function rsOut(g, u, best, st, cs) {
  if (st === 'retreat' || st === 'move' || (cs && cs.run)) { u.rsH = 0; u.fadeArm = 0; u.rsIdle = 0; return false; }
  if (best) { u.rsIdle = 0; return false; }
  if (!u.rsIdle) { u.rsIdle = g.t; return false; }
  if (g.t - u.rsIdle < RS.idle) return false;
  rsHome(g, u); return true;
}
// Its shields broke while out on a strike: straight back to where it stepped from
function rsHome(g, u) {
  const a = P(u.u, u.v, 12 + (u.z || 0));
  u.rsBrk = 0; u.rsH = 0; u.fadeArm = 0; u.rsIdle = 0; u.leaping = 0; u.z = 0; u.u = u.fu; u.v = u.fv; u.tgt = 0; u.chT = 0; u.nav = undefined; u.moving = false;
  const b = P(u.u, u.v, 12); g.fx.push({ k: 'rsblink', side: u.side, x: a.x, y: a.y, x2: b.x, y2: b.y, u: u.u, t: 0, life: 0.55, home: 1 });
  if (MAP_LANED) u.lane = laneAt(u.u, u.v);
  ev(g, { type: 'blinkHome', u: u.u, side: u.side });
}

/* ---- Parallax: the guardian swap ---- */
function pxStep(g, u, side) { // true: it swapped this tick
  if (g.t < (u.swCd || 0) || g.t < (u.swChk || 0)) return false;
  u.swChk = g.t + SWAP.every;
  if (u.hp < u.maxHp * SWAP.self || u.gone || u.lt) return false;
  let A = null, ac = -1;
  for (const e of g.ents) {
    if (e === u || e.kind !== 'u' || e.side !== u.side || e.hp <= 0 || e.dead || e.gone || e.bur || e.leaping || e.lt || e.ltH || e.tn) continue;
    const ed = UDEF[e.type]; if (ed.air || ed.fac !== 'axiarchs' || e.hp >= e.maxHp * SWAP.low) continue;
    if (Math.hypot(e.u - u.u, e.v - u.v) > SWAP.r) continue;
    const c = ed.cost.c + ed.cost.e;
    if (c > ac || (c === ac && (e.hp / e.maxHp < A.hp / A.maxHp || (e.hp / e.maxHp === A.hp / A.maxHp && e.id < A.id)))) { A = e; ac = c; }
  }
  if (!A) return false;
  const a = P(u.u, u.v, 0), b = P(A.u, A.v, 0);
  [u.u, A.u] = [A.u, u.u]; [u.v, A.v] = [A.v, u.v];
  for (const e of [u, A]) {
    e.nav = undefined; e.moving = false; e.chT = 0; if (MAP_LANED) e.lane = laneAt(e.u, e.v);
    if (side.direct) { if (e.po && e.po.o === 'hold') ctlHold(e, e.u, e.v); }
    else if (e.holdU !== undefined) { e.holdU = e.u; e.holdV = e.v; }
  }
  A.tgt = 0; u.swCd = g.t + SWAP.cd;
  if (!side.direct) A.aiBack = g.t + SWAP.back; // an AI's wounded unit gets a moment to fall back
  g.fx.push({ k: 'swap', side: u.side, u: u.u, x: a.x, y: a.y, x2: b.x, y2: b.y, t: 0, life: 0.6 });
  ev(g, { type: 'swap', u: u.u, side: u.side, ally: A.type });
  return true;
}
// An AI's Parallax with nothing to fight walks beside the unit it guards (true: it moved)
function pxGuard(g, u, d, dt, sp) {
  const G = ctlEnt(g, u.pxG);
  if (!G || G.hp <= 0 || G.side !== u.side) { u.pxG = 0; return false; }
  const dir = dirOf(u.side), tu = clamp(G.u - dir * 22, 0, L), tv = G.v + (u.id % 2 ? 12 : -12);
  if (Math.hypot(tu - u.u, tv - u.v) <= SWAP.guard) return false;
  moveToward(u, d, tu, tv, dt, sp); return true;
}

/* ---- Ravager: remains and devouring ---- */
function remainsAt(g, e) { // kill: a ground unit's remains (not Mites, not temporary Skitterlings)
  const d = UDEF[e.type];
  if (d.air || e.tSrc === 'mite' || (e.temp && e.type === 'skitterling') || e.gone === 3) return;
  (g.rem || (g.rem = [])).push({ id: e.id, u: e.u, v: e.v, side: e.side, type: e.type, fac: d.fac || DEFAULT_FACTION, sz: Math.min(3, Math.max(1, Math.round(d.pop))), t0: g.t, t1: g.t + RAV.life, by: 0 });
}
function updateRemains(g) {
  if (!g.rem || !g.rem.length) return;
  g.rem = g.rem.filter(r => {
    if (r.by) { const R = ctlEnt(g, r.by); if (R && R.hp > 0 && R.dvR === r.id && R.dvT) return true; r.by = 0; }
    return r.t1 > g.t;
  });
}
const remNear = (g, u, R, free) => { let best = null, bd = 1e9; for (const r of g.rem || []) { if (free && r.by) continue; const k = Math.hypot(r.u - u.u, r.v - u.v); if (k <= R && (k < bd || (k === bd && r.id < best.id))) { best = r; bd = k; } } return best; };
// True: handled (devouring, or an AI's Ravager walking to remains after a fight)
function ravStep(g, u, d, side, st, cs, best, prey, dt, sp) {
  if (u.dvT) {
    const R = (g.rem || []).find(r => r.id === u.dvR);
    u.tgt = 0; u.chT = 0;
    if (g.t >= u.dvT) { ravFeed(g, u, R); return true; }
    const fu = R ? clamp(R.u - u.face * RAV.jaw, 0, L) : u.u; // it lunges in until its jaw is over the pile
    if (R && Math.hypot(fu - u.u, R.v - u.v) > 2) { moveToward(u, d, fu, R.v, dt, sp * 1.6); u.face = R.u >= u.u ? 1 : -1; } else u.moving = false;
    return true;
  }
  if (!g.rem || !g.rem.length || st === 'retreat' || st === 'move' || (cs && cs.run)) return false;
  const hurt = u.hp < u.maxHp * RAV.low, calm = !best && !prey && g.t - u.lastHurt >= RAV.calm;
  if (!hurt && !calm) return false;
  const R = remNear(g, u, RAV.r, true);
  if (R) {
    R.by = u.id; u.dvR = R.id; u.dvT = g.t + RAV.eat; u.dvS = g.t; u.tgt = 0; u.face = R.u >= u.u ? 1 : -1;
    ev(g, { type: 'devourStart', u: u.u, side: u.side });
    return true;
  }
  if (calm && !side.direct && !(cs && (cs.go || cs.chase))) { // an AI's Ravager goes to feed after a fight
    const F = remNear(g, u, RAV.seek, true);
    if (F && !g.ents.some(e => e.kind === 'u' && e.side !== u.side && e.side !== NEUTRAL && e.hp > 0 && !e.gone && Math.hypot(e.u - F.u, e.v - F.v) < RAV.safe && visibleTo(g, u.side, e))) { moveToward(u, d, F.u, F.v, dt, sp); return true; }
  }
  return false;
}
function ravFeed(g, u, R) {
  u.dvT = 0; u.dvR = 0;
  if (R) g.rem = g.rem.filter(r => r !== R);
  if ((u.rvS || 0) < RAV.max) {
    if (!u.rvB) u.rvB = u.maxHp;
    u.rvS = (u.rvS || 0) + 1;
    const m = u.rvB * (1 + RAV.hp * u.rvS); u.hp += m - u.maxHp; u.maxHp = m;
  }
  const h0 = u.hp; u.hp = Math.min(u.maxHp, u.hp + u.maxHp * RAV.heal);
  if (g.log) g.log.tot[u.side].healed = (g.log.tot[u.side].healed || 0) + u.hp - h0;
  const w = P(u.u, u.v, 10); g.fx.push({ k: 'devour3', side: u.side, u: u.u, x: w.x, y: w.y, t: 0, life: 0.9, n: u.rvS });
  ev(g, { type: 'devour', u: u.u, side: u.side, stacks: u.rvS });
}
const ravMul = u => u.rvS ? 1 + RAV.dmg * u.rvS : 1; // a Ravager's stacks (outMul)

/* ---- each tick (update), b3a on ---- */
function update3a(g) { updateRemains(g); }
// kill(), b3a on: a host's Leapers hatch; remains
function kill3a(g, e) { latchHatch(g, e); remainsAt(g, e); }

/* ---- the AI ---- */
// An AI side's Leapers aim at the biggest enemy ground unit near them, Riftstalkers at an exposed ranged unit (the fewest
// guards around it), Parallaxes walk beside the side's most expensive units (the devouring is the Ravager's own logic,
// plus walking to remains after a fight). Every difficulty, each decision.
function aiRework3a(g, s, mine) {
  const opp = 1 - s, foes = g.ents.filter(e => e.kind === 'u' && e.side === opp && e.hp > 0 && !e.gone && !UDEF[e.type].air && visibleTo(g, s, e));
  for (const u of mine) {
    if (u.type === 'leaper' && !u.lt && !u.ltH) {
      let best = null, br = null;
      for (const H of foes) { const r = latchRank(g, u, H, LATCH.aim); if (r && r[0] === 0 && latchN(g, H) < LATCH.max && (!best || rankLess(r, br, H, best) < 0)) { best = H; br = r; } }
      u.ltAim = best ? best.id : 0;
    } else if (u.type === 'riftstalker' && !u.rsH) {
      let best = null, bs = 1e9;
      for (const e of foes) {
        if (!rsRanged(g, s, e) || Math.hypot(e.u - u.u, e.v - u.v) > RS.aim) continue;
        const guards = foes.filter(f => f !== e && Math.hypot(f.u - e.u, f.v - e.v) <= RS.guard && !rsRanged(g, s, f)).length;
        const sc = guards * 200 - rwD(g, e.type).range + Math.hypot(e.u - u.u, e.v - u.v) * 0.3;
        if (sc < bs || (sc === bs && e.id < best.id)) { bs = sc; best = e; }
      }
      u.rsAim = best ? best.id : 0;
    }
  }
  const px = mine.filter(u => u.type === 'parallax').sort((a, b) => a.id - b.id);
  if (px.length) {
    const val = mine.filter(u => u.type !== 'parallax' && !UDEF[u.type].air && UDEF[u.type].fac === 'axiarchs' && u.id !== g.sides[s].scoutId).sort((a, b) => (UDEF[b.type].cost.c + UDEF[b.type].cost.e) - (UDEF[a.type].cost.c + UDEF[a.type].cost.e) || a.id - b.id);
    px.forEach((u, i) => { u.pxG = val.length ? val[i % Math.min(val.length, 3)].id : 0; });
  }
}
// The AI's reads for its scores (v2.84)
const aiBigShare = th => th.length ? th.filter(u => !UDEF[u.type].air && latchBig(u)).length / th.length : 0;
// Persona tastes for the four (in batch 3a none plays like its old Last Fist counterpart in AI_TWIN)
const RW3A_TASTE = { leaper: { aggressor: 1.2, trickster: 1.2, turtle: 0.9, economist: 1.0 }, ravager: { aggressor: 1.3, trickster: 1.0, turtle: 1.0, economist: 0.9 }, riftstalker: { trickster: 1.3, aggressor: 1.1, turtle: 0.8, economist: 1.0 }, parallax: { turtle: 1.2, economist: 1.1, aggressor: 1.0, trickster: 0.9 } };
