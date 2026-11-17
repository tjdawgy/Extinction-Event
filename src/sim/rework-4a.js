/* ---------- Faction rework, batch 4a (v2.86, docs/FACTION_REWORK.md "Batch 4", first five): Sniper, Astral Marksman,
   Bilecaster, Gunship, Wraithwing; and Part 0, the AI's path variety ----------
   REWORK.b4a, stored per game in g.rw like the earlier batches (rwB4a). Off: everything plays exactly as in v2.85 and
   nothing below runs or is saved (every unit field here is set only by this code). On (the new-game default) each unit
   keeps its internal id and plays through its own definition for that game (rwD, RW4A_D; UDEF untouched).
   - Part 0 (aiPickPath): a Normal or Hard AI rolls each production building's T2 path once per match (side.pRoll, from the
     match's seeded stream): its persona's path PATHROLL.keep of the time, the other path otherwise. The counter rules
     (armoured enemies: Specialists; an infantry flood: Assault) and "a second copy takes the path the first lacks" come
     first, as before. Easy is unchanged.
   - Sniper (Last Fist): its piercing shot (P4) and stats kept. Every light-armoured ground unit its round hits (the target
     and every unit the pierce goes through) is pinned PIN.dur s (u.pinT): it can't move (no walking, leaps, charges or
     swaps) but still fights.
   - Astral Marksman (Axiarchs): its charged shot kept. What it hits is marked MARK.dur s (e.mkT, e.mkS the marking side;
     a new hit refreshes it): damage from the marking side, when it is Axiarch, is MARK.mul higher (damage1), and Axiarch
     units with a marked target in reach switch to it (markSwitch; the Marksmen themselves keep choosing, they place marks).
   - Bilecaster (Bloomhost): no P16 corrosion dart. Range BILE.range, every BILE.cd s it lobs a glob (weapon 'bileglob', an
     arc like a shell: lobbed, so it passes over a Bastion's barrier) that does BILE.dmg to enemies within BILE.splash and
     leaves an acid pool (g.acid, kind 'bile', the Ruinmaw's pool list) of radius BILE.r for BILE.life s: enemy ground units
     in it take BILE.dps a second and are corroded BILE.corr while inside and BILE.after s after. Up to BILE.max pools per
     Bilecaster (a new one removes its oldest); they don't count toward the Ruinmaw's ACID.max.
   - Gunship (Last Fist, internal id 'aircraft'): salvos of SALVO.n missiles SALVO.gap s apart (SALVO.dmg each), then
     SALVO.reload s (u.msl: missiles fired in this salvo). Range and targets as before.
   - Wraithwing (Axiarchs): no phase-on-hit (P13). It doesn't fly smoothly: it teleports in hops of up to HOP.len, one every
     HOP.every s (hopMove, hopTo; u.hopT the next), and fires one bolt (HOP.dmg, range HOP.range, air, ground, buildings)
     each time it lands. In a fight it hops around its target. Shots already flying at it when it hops lose it and miss;
     enemies can't target it for HOP.reacq s after each hop (u.wwT). */
const rwB4a = g => !!(g && g.rw && g.rw.b4a);
const PATHROLL = { keep: 0.6 };
const PIN = { dur: 1.5 };
const MARK = { dur: 5, mul: 0.25, every: 0.25 };
const BILE = { range: 150, cd: 2.6, dmg: 20, splash: 30, r: 40, life: 8, dps: 8, corr: 0.2, after: 2, max: 3, own: 30 };
const SALVO = { n: 4, gap: 0.15, dmg: 22, reload: 3.4, pod: 3 };
const HOP = { len: 90, every: 0.9, dmg: 20, range: 140, reacq: 0.4, ring: 0.6, min: 30 };
const AIM4 = { every: 0.25, line: 150, w: 12, engaged: 0.5, covered: 0.3 };
Object.assign(DMG, { bileglob: { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 0, building: 0.5 } }); // a Bilecaster's glob (ground units, buildings a little)
const RW4A_D = {
  sniper: () => Object.assign({}, UDEF.sniper, { suppress: true }),
  marksman: () => Object.assign({}, UDEF.marksman, { marker: true }),
  bilecaster: () => Object.assign({}, UDEF.bilecaster, { range: BILE.range, cd: BILE.cd, dmg: BILE.dmg, splash: BILE.splash, weapon: 'bileglob', corrode: undefined, lob: true, precise: true, bilePool: true }),
  aircraft: () => Object.assign({}, UDEF.aircraft, { dmg: SALVO.dmg, cd: (SALVO.gap * (SALVO.n - 1) + SALVO.reload) / SALVO.n, gsSalvo: true }), // cd: the average gap, as the info card reads it
  wraithwing: () => Object.assign({}, UDEF.wraithwing, { phase: undefined, dmg: HOP.dmg, range: HOP.range, cd: HOP.every, blink: true }),
};
EX_TIMERS.push('pinT', 'mkT', 'hopT', 'wwT'); // v2.86: pinned, marked, the next hop, re-acquire: resumed on return from exile

// Texts the player sees follow the new-game default (numbers in UNIT_TIPS, read live)
for (const [t, on] of [['sniper', 'Long-range marksman whose rail rounds pierce a line of infantry and pin every infantry unit they hit in place for a moment. Fragile and slow-firing: keep it behind a front line.'],
  ['marksman', 'Very long-range sniper that charges each shot and marks its target: every Axiarch unit hits a marked target harder, and those in reach switch to it. It can\'t hit aircraft and is weak against buildings.'],
  ['bilecaster', 'Mid-range spitter that lobs globs of bile which leave lasting acid pools: enemies standing in them burn and take more damage. Area denial, not precision; it can\'t hit aircraft.'],
  ['aircraft', 'Rotor gunship that fires its two rocket pods in salvos of missiles, then reloads. Hits ground and air, good at bursting vehicles. Anti-air and Turrets shoot it down.'],
  ['wraithwing', 'Shielded crescent flyer that moves in short teleport hops instead of flying, firing a bolt each time it lands. Shots in flight lose it when it hops; dedicated anti-air and defences track it through its hops.']]) {
  const d0 = UDEF[t].desc; Object.defineProperty(UDEF[t], 'desc', { get: () => REWORK.b4a ? on : d0, enumerable: true, configurable: true });
}
function rw4aText(o, k, on) { const x = Object.getOwnPropertyDescriptor(o, k), off = x.get ? x.get() : x.value; Object.defineProperty(o, k, { get: () => REWORK.b4a ? on : off, enumerable: true, configurable: true }); }
rw4aText(TREES.barracks.A.steps[3], 'txt', 'Unlocks Snipers: rounds that pierce a line and pin infantry in place');
rw4aText(TREES_BH.barracks.B.steps[3], 'txt', 'Unlocks Bilecasters: globs that leave lasting acid pools');
rw4aText(TREES_AX.barracks.B.steps[3], 'txt', 'Unlocks Astral Marksmen: charged shots that mark a target for every Axiarch unit');

const rw4Ev = (g, side, type, extra) => ev(g, Object.assign({ type, side }, extra || {}));

/* ---- Part 0: the AI's T2 path, rolled once per building type per match ---- */
function aiPathRoll(g, s, type, def) {
  const side = g.sides[s], R = side.pRoll || (side.pRoll = {});
  if (!R[type]) R[type] = simRnd() < PATHROLL.keep ? def : def === 'A' ? 'B' : 'A';
  return R[type];
}

/* ---- Sniper: pinned ---- */
function pinHit(g, e, side) {
  if (!e || e.kind !== 'u' || e.hp <= 0 || e.gone || e.side === side) return;
  const d = rwD(g, e.type); if (d.air || (e.arm || d.armor) !== 'light') return;
  if (!(e.pinT > g.t)) rw4Ev(g, side, 'pin', { u: e.u });
  e.pinT = g.t + PIN.dur; e.moving = false;
}

/* ---- Astral Marksman: the mark ---- */
function markHit(g, e, side) {
  if (!e || e.hp <= 0 || e.gone) return;
  e.mkT = g.t + MARK.dur; e.mkS = side;
  const w = P(e.u, e.v, aimZ(e)); g.fx.push({ k: 'mark', side, u: e.u, x: w.x, y: w.y, t: 0, life: 0.5 });
  rw4Ev(g, side, 'mark', { u: e.u });
}
const markBonus = (g, e, fromSide) => e.mkT > g.t && e.mkS === fromSide && g.sides[fromSide] && facOf(g.sides[fromSide].faction) === 'axiarchs' ? 1 + MARK.mul : 1;
const MKL = { g: null, list: null }; // this tick's marked targets (rebuilt each tick)
function updateMarks4(g) {
  MKL.g = g; MKL.list = null;
  for (const e of g.ents) if (e.mkT > g.t && e.hp > 0) (MKL.list || (MKL.list = [])).push(e);
}
// An Axiarch unit with a target marked by its side in reach switches to it (the nearest); Marksmen keep their own choice
function markSwitch(g, u, d, best) {
  if (MKL.g !== g || !MKL.list || d.marker || !d.weapon || d.fac !== 'axiarchs') return best;
  if (best && best.mkT > g.t && best.mkS === u.side) return best;
  let pick = null, pd = 1e9;
  for (const e of MKL.list) {
    if (e.mkS !== u.side || e.side === u.side || e.hp <= 0 || e.gone || e.wwT > g.t || !visibleTo(g, u.side, e) || !ctlCanHit(g, u, d, e)) continue;
    const k = effDist(u, e); if (k < pd) { pd = k; pick = e; }
  }
  return pick || best;
}

/* ---- Bilecaster: acid pools ---- */
function bileImpact(g, p) {
  splashHit(g, p, null, 1, 0);
  const own = p.own;
  const mine = g.acid.filter(a => a.kind === 'bile' && a.own === own);
  if (mine.length >= BILE.max) g.acid.splice(g.acid.indexOf(mine[0]), 1);
  g.acid.push({ side: p.side, u: p.u, v: p.v, end: g.t + BILE.life, kind: 'bile', own, t0: g.t });
  const w = P(p.u, p.v, 0); g.fx.push({ k: 'bilesplat', side: p.side, u: p.u, x: w.x, y: w.y, t: 0, life: 0.5 });
  rw4Ev(g, p.side, 'pool', { u: p.u });
}

/* ---- Gunship: salvos ---- */
function gsAfter(g, u, T) {
  if (!u.msl) rw4Ev(g, u.side, 'salvo', { u: u.u, veh: T && T.kind === 'u' && rwD(g, T.type).armor === 'vehicle' ? 1 : 0 });
  u.msl = (u.msl || 0) + 1; u.gsT = T ? T.id : 0;
  if (u.msl >= SALVO.n) { u.msl = 0; u.cd = SALVO.reload * rand(0.9, 1.1); } else u.cd = SALVO.gap;
}

/* ---- Wraithwing: hops ---- */
const HOPG = { g: null, foes: null }; // the game and foes of the Wraithwing being updated
const hopClampV = v => MAP_2D ? clamp(v, -MAP.size.h / 2 + 10, MAP.size.h / 2 - 10) : clamp(v, -LANE_V, LANE_V);
// moveToward for a b4a Wraithwing: it waits for its next hop, then teleports up to HOP.len toward (tu, tv)
function hopMove(u, d, tu, tv) {
  const du = tu - u.u, dv = tv - u.v, dd = Math.hypot(du, dv);
  if (dd < 2) { u.moving = false; return false; }
  u.moving = true; if (Math.abs(du) > 0.5) u.face = Math.sign(du);
  const g = HOPG.g; if (!g || g.t < (u.hopT || 0)) return true;
  const k = Math.min(1, HOP.len / dd); hopTo(g, u, d, u.u + du * k, u.v + dv * k);
  return true;
}
function hopTo(g, u, d, nu, nv) {
  const u0 = u.u, v0 = u.v; nu = clamp(nu, 0, L); nv = hopClampV(nv);
  u.u = nu; u.v = nv; u.hopT = g.t + HOP.every; u.hopS = g.t; u.hopU = u0; u.hopV = v0; u.wwT = g.t + HOP.reacq;
  if (Math.abs(nu - u0) > 0.5) u.face = nu > u0 ? 1 : -1;
  let miss = 0;
  for (const p of g.projs) if (p.target === u) { p.target = null; p.miss = 1; miss++; } // in flight at it: they fly on to where it was
  const a = P(u0, v0, u.z || 0), b = P(nu, nv, u.z || 0);
  g.fx.push({ k: 'hop', side: u.side, u: nu, x: a.x, y: a.y, x2: b.x, y2: b.y, t: 0, life: 0.45, face: u.face });
  rw4Ev(g, u.side, 'hop', { u: nu, miss });
  // landing: one bolt at the best target in reach
  const T = HOPG.foes ? acquire(g, u, d, HOPG.foes).best : null;
  if (T) { u.tgt = T.id; if (Math.abs(T.u - u.u) > 1) u.face = T.u >= u.u ? 1 : -1; fire(g, u, T, d); u.cd = HOP.every; }
}
// In a fight: hop to a spot around its target (seeded), firing on landing
function wwFight(g, u, d, T) {
  if (g.t < (u.hopT || 0)) return;
  const R = HOP.range * HOP.ring, a0 = simRnd() * Math.PI * 2;
  let spot = null;
  for (let i = 0; i < 4 && !spot; i++) {
    const a = a0 + i * Math.PI / 2, su = clamp(T.u + Math.cos(a) * R, 0, L), sv = hopClampV(T.v + Math.sin(a) * R * 0.5), k = Math.hypot(su - u.u, sv - u.v);
    if (k <= HOP.len && k >= HOP.min) spot = [su, sv];
  }
  if (!spot) { const su = T.u + Math.cos(a0) * R, sv = T.v + Math.sin(a0) * R * 0.5, k = Math.max(1, Math.hypot(su - u.u, sv - u.v)), m = Math.min(1, HOP.len / k); spot = [u.u + (su - u.u) * m, u.v + (sv - u.v) * m]; }
  hopTo(g, u, d, spot[0], spot[1]);
}

/* ---- the AI's aims (sides it plays) ---- */
const aim4Ok = (g, u, d, e) => e.side !== u.side && e.side !== NEUTRAL && e.hp > 0 && !e.gone && !(e.wwT > g.t) && visibleTo(g, u.side, e) && ctlCanHit(g, u, d, e);
function aim4(g, u, d, best, foes) {
  if (!(d.suppress || d.marker || d.bilePool || d.gsSalvo)) return best;
  if (d.marker && u.chT && u.chTgt) { const T = ctlEnt(g, u.chTgt); if (T && aim4Ok(g, u, d, T)) return T; } // mid-charge: keep it
  if (d.gsSalvo && u.msl && u.gsT) { const T = ctlEnt(g, u.gsT); if (T && aim4Ok(g, u, d, T)) return T; } // mid-salvo: keep it
  if (u.a4T > g.t) { const T = u.a4Id ? ctlEnt(g, u.a4Id) : null; return T && aim4Ok(g, u, d, T) ? T : best; }
  u.a4T = g.t + AIM4.every;
  let pick = null, ps = -1e9;
  for (const e of foes) {
    if (e.kind !== 'u' || !aim4Ok(g, u, d, e)) continue;
    const ed = rwD(g, e.type), k = effDist(u, e);
    let sc = 0;
    if (d.suppress) { // infantry groups: the target plus the infantry its round would go through
      if ((e.arm || ed.armor) !== 'light') continue;
      const du = e.u - u.u, dv = e.v - u.v, dd = Math.max(1, Math.hypot(du, dv)), ux = du / dd, vy = dv / dd;
      for (const f of foes) { if (f === e || f.kind !== 'u' || f.hp <= 0 || f.gone || (f.arm || UDEF[f.type].armor) !== 'light') continue; const ru = f.u - e.u, rv = f.v - e.v, al = ru * ux + rv * vy; if (al > 0 && al <= AIM4.line && Math.abs(ru * vy - rv * ux) <= AIM4.w * 1.5) sc++; }
      sc = sc * 100 - k * 0.1;
    } else if (d.marker) { // the most valuable target in reach (one already marked counts less)
      sc = ed.cost.c + ed.cost.e - (e.mkT > g.t + 1.5 && e.mkS === u.side ? 300 : 0) - k * 0.05;
    } else if (d.bilePool) { // where enemies stand fighting or bunched, not where a pool of its side already is
      for (const f of foes) if (f.kind === 'u' && f.hp > 0 && !f.gone && !UDEF[f.type].air && Math.hypot(f.u - e.u, (f.v - e.v) * 0.6) <= BILE.r) sc += 1 + (f.tgt ? AIM4.engaged : 0);
      if (g.acid.some(a => a.kind === 'bile' && a.side === u.side && Math.hypot(a.u - e.u, a.v - e.v) < BILE.own)) sc *= AIM4.covered;
      sc = sc * 100 - k * 0.1;
    } else if (d.gsSalvo) { // a salvo opens on a vehicle
      if (ed.armor !== 'vehicle') continue;
      sc = ed.cost.c + ed.cost.e - k;
    }
    if (sc > ps || (sc === ps && pick && e.id < pick.id)) { ps = sc; pick = e; }
  }
  u.a4Id = pick ? pick.id : 0;
  return pick || best;
}
// Wraithwings raid: each healthy one heads for the enemy economy building it knows of with the fewest defences around it,
// unless enemies are at this side's own base (then they defend with the army). Every decision.
const RAID4 = { eco: ['refinery', 'reactor', 'habitat'], guard: 260, base: 520, hp: 0.5 };
function aiRework4a(g, s, mine) {
  const W = mine.filter(u => u.type === 'wraithwing' && !u.gone);
  if (!W.length) return;
  const side = g.sides[s], f = g.fog[s], hq = hqU(s);
  const home = Object.values(f.intel).some(m => g.t - m.t <= THREAT_MEMORY && Math.abs(m.u - hq) < RAID4.base);
  const gh = Object.values(f.ghosts), def = gh.filter(b => b.type === 'turret' || b.type === 'hq');
  const cu = W.reduce((a, u) => a + u.u, 0) / W.length;
  let tgt = null, ts = 1e9;
  if (!home) for (const b of gh) {
    if (!RAID4.eco.includes(b.type)) continue;
    const n = def.filter(x => Math.hypot(x.u - b.u, (x.v || 0) - (b.v || 0)) < RAID4.guard).length, sc = n * 1000 + Math.abs(b.u - cu);
    if (sc < ts) { ts = sc; tgt = b; }
  }
  for (const u of W) {
    const ok = tgt && u.id !== side.scoutId && !capBusy(side, u.id) && (u.hp + (u.shp || 0)) >= (u.maxHp + (u.maxShp || 0)) * RAID4.hp;
    const was = !!u.wwR; u.wwR = ok ? [tgt.u, tgt.v || 0] : undefined;
    if (ok && !was) rw4Ev(g, s, 'raid', { u: u.u });
  }
}

/* ---- each tick (update), b4a on ---- */
function update4a(g) { updateMarks4(g); }

/* ---- the AI's reads for its scores (v2.86) ---- */
const aiSplashAA = th => th.length ? th.filter(u => ['shardstorm', 'hydra', 'interceptor', 'flak'].includes(u.type) || (UDEF[u.type].hitsAir && UDEF[u.type].splash)).length / th.length : 0;
// Persona tastes for three of the five (the Sniper and Gunship keep the Last Fist personas' own bias)
const RW4A_TASTE = { marksman: { turtle: 1.2, economist: 1.1, aggressor: 0.9, trickster: 1.1 }, bilecaster: { turtle: 1.2, economist: 1.0, aggressor: 1.0, trickster: 1.1 }, wraithwing: { trickster: 1.3, aggressor: 1.1, economist: 1.1, turtle: 0.8 } };
