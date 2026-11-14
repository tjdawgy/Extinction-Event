/* ---------- Faction rework, batch 2a (v2.82, docs/FACTION_REWORK.md "Batch 2"): Artillery, Gorebore, Severance ----------
   One switch block, stored per game (g.rw), so Test Range rows can run old and new side by side. REWORK holds the values a
   new game takes; newGame(…, { rework: { … } }) overrides them for that game. With b2a off a game plays exactly as v2.81:
   the Bile Lobber and Rift Mortar are trained, the Artillery fires as before, and nothing below runs or is saved.
   - artDeploy (Artillery): it deploys (ART.deploy s) before it can fire and packs up (ART.pack s) before it can move.
     Automatic: it deploys when something is in reach, packs when ordered away or after ART.idle s with nothing to shoot
     (never on Hold). Its own states (u.dep: 0 mobile, 1 deploying, 2 deployed, 3 packing; u.dpT when the change ends),
     modelled on the Titan's siege lock (titanSiege).
   - artTelegraph (Artillery): every shell lands where it was aimed when fired (no tracking) after at least ART.fly s, and
     its spot is marked on the ground from firing to impact (g.mk, the shells' own list). Units out of the marker when it
     lands take nothing. AI units step out of markers as they step out of meteor circles (markDodge).
   - Gorebore (Bloomhost, replaces the Bile Lobber; internal id 'gorebore'): burrows whenever it moves and burrow is ready,
     travels underground at BORE.speed, untargetable and unhurt (u.gone 1), and erupts under its target (BORE.dmg within
     BORE.r), then stays up BORE.expose s with a melee bite; burrow is ready again BORE.cd s after the eruption.
   - Severance (Axiarchs, replaces the Rift Mortar; internal id 'severance'): every SEVER.cd s a slow rift orb at a spot
     within SEVER.range; on arrival every enemy unit within SEVER.r takes SEVER.dmg, then is exiled for SEVER.dur s (u.gone
     2, u.exT): frozen, untargetable, unhurt, its timed effects paused; back, it can't be exiled for SEVER.imm s. Between
     exiles a weak bolt (its UDEF weapon).
   New internal ids rather than renamed ones: a game with b2a off still has Bile Lobbers and Rift Mortars, and saves, match
   history and tests keep naming them. */
const REWORK = { b2a: true, artDeploy: true, artTelegraph: true };
const RW_KEYS = ['b2a', 'artDeploy', 'artTelegraph'];
const rwInit = o => { const r = Object.assign({}, REWORK, o || {}), out = {}; for (const k of RW_KEYS) out[k] = !!r[k]; return out; };
const rwB2a = g => !!(g && g.rw && g.rw.b2a);
const rwDep = g => rwB2a(g) && !!g.rw.artDeploy;
const rwTel = g => rwB2a(g) && !!g.rw.artTelegraph;
const RW_SWAP = { bilelobber: 'gorebore', riftmortar: 'severance' }, RW_BACK = { gorebore: 'bilelobber', severance: 'riftmortar' };
const rwType = (g, t) => rwB2a(g) ? (RW_SWAP[t] || t) : (RW_BACK[t] || t); // the unit that fills this slot in game g
const rwHas = (g, t) => rwType(g, t) === t; // game g has this unit type
const rwShown = t => rwType({ rw: REWORK }, t) === t; // the UI's Codex and lists, which follow the new-game default

const ART = { deploy: 2.0, pack: 1.5, idle: 2, fly: 1.6, step: 18 };
const BORE = { speed: 40, dmg: 70, r: 45, expose: 4, cd: 10, seek: 300, near: 12, hold: 160, adv: 170, pick: 0.25, trail: 3 };
const SEVER = { range: 300, speed: 120, r: 45, dmg: 20, dur: 4, imm: 6, cd: 12, every: 0.5, minPop: 4, fight: 220 };

Object.assign(UDEF, {
  gorebore: { name: 'Gorebore', desc: 'Digging beast that burrows under the fight and erupts beneath ranged units and artillery. Untouchable underground, but its dirt trail shows, and it is exposed after each eruption.', fac: 'bloomhost', from: 'factory', tier: 2, cost: { c: 170, e: 60 }, pop: 3, hp: 300, dmg: 18, cd: 0.8, range: 24, speed: 22, hitsAir: false, armor: 'heavy', weapon: 'gorebite', time: 12, h: 18, melee: true, chase: 150, bore: true },
  severance: { name: 'Severance', desc: 'Floating monolith that fires a slow rift orb: enemy units where it lands are exiled from the fight for a few seconds. Long cooldown, a weak bolt in between; spread out and punish it.', fac: 'axiarchs', from: 'factory', tier: 2, cost: { c: 220, e: 90 }, pop: 4, hp: 200, shp: 140, dmg: 8, cd: 1.2, range: 150, speed: 21, hitsAir: false, armor: 'vehicle', weapon: 'sever', time: 13, h: 26, exile: true },
});
const BORE_D = Object.assign({}, UDEF.gorebore, { speed: BORE.speed }); // how it moves underground
Object.assign(DMG, {
  gorebite: { light: 1.1, heavy: 1.0, vehicle: 0.8, air: 0, building: 0.6 }, // the Gorebore's bite
  erupt:    { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 0, building: 0.5 }, // its eruption: ground units and buildings
  sever:    { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 0, building: 0.5 }, // the Severance's bolt
  exile:    { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 1.0, building: 0 },  // the rift orb's hit: units only
});
PSPEED.sever = 700;
Object.assign(MUZ, { gorebore: [14, 8], severance: [6, 30] });
Object.assign(SIGHT, { gorebore: 200, severance: 240 });
Object.assign(PLURAL, { gorebore: 'Gorebores', severance: 'Severances' });
UGROUPS.arm.push('gorebore', 'severance'); GROUP_OF.gorebore = 'arm'; GROUP_OF.severance = 'arm';
UNIT_ORDER.splice(UNIT_ORDER.indexOf('bilelobber') + 1, 0, 'gorebore');
UNIT_ORDER.splice(UNIT_ORDER.indexOf('riftmortar') + 1, 0, 'severance');
UNIT_PATH.gorebore = UNIT_PATH.bilelobber; UNIT_PATH.severance = UNIT_PATH.riftmortar;
// The path and step texts the player sees follow the new-game default (the unlock lists keep the old ids; rwType maps them)
const rwText = (o, k, on, off) => Object.defineProperty(o, k, { get: () => REWORK.b2a ? on : off, enumerable: true, configurable: true });
rwText(TREES_BH.factory.A, 'name', 'Burrowing Evolution', 'Siege Evolution'); rwText(TREES_BH.factory.A, 'short', 'BURROW', 'SIEGE');
rwText(TREES_BH.factory.A.steps[2], 'short', 'Gorebores', 'Bile Lobbers');
rwText(TREES_BH.factory.A.steps[2], 'txt', 'Unlocks Gorebores: burrow under the fight and erupt beneath ranged units', 'Unlocks Bile Lobbers: long-range bile that corrodes an area');
rwText(TREES_AX.factory.A.steps[2], 'short', 'Severances', 'Rift Mortars');
rwText(TREES_AX.factory.A.steps[2], 'txt', 'Unlocks Severances: rift orbs that exile enemy units for a few seconds', 'Unlocks Rift Mortars: precise long-range strikes');

// The Artillery's description follows the new-game default (its numbers are in UNIT_TIPS, read live)
{ const d0 = UDEF.artillery.desc; Object.defineProperty(UDEF.artillery, 'desc', { get: () => REWORK.b2a ? 'Long-range gun that fires shell salvos over the front line. It deploys before it fires and packs up before it moves, and its shells\' landing spots show on the ground. Very fragile, and it can\'t hit targets that get too close.' : d0, enumerable: true, configurable: true }); }
/* ---- Artillery: deploy (artDeploy) ---- */
// Returns true when it handled the tick (deploying, packing, deployed: nothing else moves it). best/close: what the usual
// search found (a direct side's target first); go: it is ordered away (retreat, regroup, a retreat-style move, an AI pull-back)
function artDeploy(g, u, d, best, close, go, hold) {
  if (u.dep === 1 || u.dep === 3) { // mid-change: nothing else happens
    u.moving = false; u.tgt = 0;
    if (g.t >= u.dpT) { u.dep = u.dep === 1 ? 2 : 0; u.dpIdle = g.t; }
    return true;
  }
  if (u.dep === 2) {
    if (best || close) u.dpIdle = g.t;
    if (go || (!best && !close && !hold && g.t - u.dpIdle >= ART.idle)) { u.dep = 3; u.dpT = g.t + ART.pack; u.tgt = 0; u.moving = false; return true; }
    u.moving = false; u.tgt = best ? best.id : 0;
    if (best) { if (Math.abs(best.u - u.u) > 1) u.face = best.u >= u.u ? 1 : -1; if (u.cd <= 0) { fire(g, u, best, d); u.cd = d.cd * rand(0.9, 1.1); } }
    return true;
  }
  if (go || !best) return false; // mobile: moves as usual (enemies only inside its minimum range: it stands, as before)
  u.dep = 1; u.dpT = g.t + ART.deploy; u.moving = false; u.tgt = 0; if (Math.abs(best.u - u.u) > 1) u.face = best.u >= u.u ? 1 : -1;
  return true;
}
/* ---- Artillery: telegraphed shells (artTelegraph) ---- */
// A shell keeps the spot it was aimed at, flies at least ART.fly s and is marked on the ground (g.mk) until it lands
function telegraph(g, p) {
  p.T = Math.max(p.T, ART.fly + (p.T - (0.7 + Math.hypot(p.tu - p.su, p.tv - p.sv) / 520))); // a salvo's later shells stay later
  p.mk = 1;
  (g.mk || (g.mk = [])).push({ u: p.tu, v: p.tv, r: p.splash, side: p.side, t0: g.t, t1: g.t + p.T });
}
function updateMarks(g) { if (g.mk && g.mk.length) g.mk = g.mk.filter(m => m.t1 > g.t); }
// an AI's ground unit inside an enemy shell marker: where it steps to (just outside, away from the centre), else null
function markDodge(g, u) {
  let best = null, bt = 1e9;
  for (const m of g.mk) {
    if (m.side === u.side) continue;
    const du = u.u - m.u, dv = (u.v - m.v) * 0.6, dd = Math.hypot(du, dv), R = m.r + ART.step;
    if (dd >= R || m.t1 >= bt) continue;
    const k = dd > 1 ? R / dd : 1;
    best = dd > 1 ? [clamp(m.u + du * k, 0, L), m.v + (u.v - m.v) * k] : [clamp(m.u - R * dirOf(u.side), 0, L), m.v]; bt = m.t1;
  }
  return best;
}

/* ---- Gorebore ---- */
const BORE_FAR = ['sniper', 'marksman'];
function boreRank(e) { // 0: ranged backline, 1: other ranged, 2: any other unit, 3: a building
  if (e.kind === 'b') return 3;
  const d = UDEF[e.type];
  if (!d.weapon || d.melee) return 2;
  if (d.minRange || BORE_FAR.includes(e.type) || d.range >= 200) return 0;
  return d.range > 40 ? 1 : 2;
}
const boreOk = (g, u, e) => e.hp > 0 && !e.gone && !e.shielded && !(e.phT > g.t) && e.side !== u.side && e.side !== NEUTRAL && !(e.kind === 'u' && UDEF[e.type].air) && visibleTo(g, u.side, e);
function borePick(g, u, foes, cu, cv, R) { // the best target within R of (cu, cv): backline first, then ranged, then nearest
  let best = null, br = 9, bd = 1e9;
  for (const e of foes) {
    if (e.side === NEUTRAL || !boreOk(g, u, e)) continue;
    const dd = Math.hypot(e.u - cu, e.v - cv) - (e.kind === 'b' ? e.half : 0); if (dd > R) continue;
    const r = boreRank(e);
    if (r < br || (r === br && (dd < bd || (dd === bd && best && e.id < best.id)))) { best = e; br = r; bd = dd; }
  }
  return best;
}
function boreTarget(g, u, st, cs, foes) {
  if (cs && cs.chase) return cs.chase.side !== NEUTRAL && boreOk(g, u, cs.chase) ? cs.chase : null; // a direct target order
  if (st === 'retreat' || st === 'move' || (cs && cs.run)) return null;
  if (u.btg && g.t < u.bPick) { const T = ctlEnt(g, u.btg); if (T && boreOk(g, u, T)) return T; }
  u.bPick = g.t + BORE.pick;
  const T = st === 'hold' && u.holdU !== undefined ? borePick(g, u, foes, u.holdU, u.holdV, BORE.hold) : borePick(g, u, foes, u.u, u.v, st === 'adv' || st === 'hold' ? BORE.adv : BORE.seek);
  u.btg = T ? T.id : 0;
  return T;
}
function boreDig(g, u) { if (u.bur) return; u.bur = 1; u.gone = 1; u.tgt = 0; u.chT = 0; ev(g, { type: 'burrow', u: u.u, v: u.v, side: u.side }); }
function boreUp(u) { u.bur = 0; u.gone = 0; }
function boreErupt(g, u, T) {
  boreUp(u);
  if (T && T.kind === 'u') { u.u = T.u - u.face * 6; u.v = T.v; } // up right under it
  u.surfT = g.t + BORE.expose; u.burCd = g.t + BORE.cd; u.btg = 0; u.lastAct = g.t;
  const dmg = BORE.dmg * (sideBuff(g, u.side) ? NANO.dmg : 1) * outMul(g, u);
  for (const e of g.ents.slice()) {
    if (e.side === u.side || e.hp <= 0 || e.gone || (e.kind === 'u' && UDEF[e.type].air)) continue;
    if (Math.max(0, Math.hypot(e.u - u.u, (e.v - u.v) * 0.6) - (e.kind === 'b' ? e.half : 0)) <= BORE.r) damage(g, e, dmg, 'erupt', u.side);
  }
  const w = P(u.u, u.v, 0); g.fx.push({ k: 'erupt', side: u.side, u: u.u, x: w.x, y: w.y, t: 0, life: 0.9, r: BORE.r });
  fxBoom(g, w.x, w.y - 4, 16); g.shake = Math.max(g.shake || 0, 2.5);
  ev(g, { type: 'erupt', u: u.u, v: u.v, side: u.side });
}
// The Gorebore's part of its tick. True: handled (underground on its way to a target, or erupting). False: the usual code
// runs (surfaced: it walks and bites; underground with no target: it travels where its orders send it, holding fire)
function boreStep(g, u, d, st, cs, foes, dt) {
  const T = g.t >= (u.surfT || 0) && (u.bur || g.t >= (u.burCd || 0)) ? boreTarget(g, u, st, cs, foes) : null;
  if (u.bur) {
    if (T) {
      if (Math.max(0, Math.hypot(T.u - u.u, T.v - u.v) - (T.kind === 'b' ? T.half : 0)) <= BORE.near) { boreErupt(g, u, T); return true; }
      if (T.kind === 'b') { const dd = Math.max(1, Math.hypot(T.u - u.u, T.v - u.v)), k = Math.max(0, dd - T.half + 4) / dd; moveToward(u, BORE_D, u.u + (T.u - u.u) * k, u.v + (T.v - u.v) * k, dt, 1); }
      else moveToward(u, BORE_D, T.u, T.v, dt, 1);
      u.moving = true; return true;
    }
    if (!u.moving) boreUp(u); // stopped with nothing to hit: up again (quietly; burrow stays ready)
    return false;
  }
  if (T) { boreDig(g, u); boreStep(g, u, d, st, cs, foes, dt); return true; }
  if (u.moving && g.t >= (u.surfT || 0) && g.t >= (u.burCd || 0)) boreDig(g, u); // on the move with burrow ready: under it goes
  return false;
}

/* ---- Severance ---- */
const sevOk = (g, s, e) => e.kind === 'u' && e.side !== s && e.side !== NEUTRAL && e.hp > 0 && !e.gone && !(e.phT > g.t) && !e.leaping;
// Where to send the orb: the densest group of enemy units within reach (each eligible unit's neighbours within SEVER.r,
// by supply), weighted up when the group is near its own army (about to fight it) or around a building its army is
// attacking. Never a lone unit under SEVER.minPop supply. Null: nothing worth it.
function sevSpot(g, u, foes) {
  const s = u.side, cand = [], vis = e => visibleTo(g, s, e);
  for (const e of foes) if (sevOk(g, s, e) && !(e.exImm > g.t) && effDist(u, e) <= SEVER.range && vis(e)) cand.push(e);
  if (!cand.length) return null;
  const mine = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && e !== u && !e.gone && UDEF[e.type].weapon);
  const hit = new Set(); for (const m of mine) if (m.tgt) hit.add(m.tgt);
  const sieged = g.ents.filter(b => b.kind === 'b' && b.side !== s && b.hp > 0 && hit.has(b.id));
  let best = null, bs = 0;
  for (const c of cand) {
    let n = 0, pop = 0, su = 0, sv = 0, big = 0;
    for (const e of cand) if (Math.hypot(e.u - c.u, (e.v - c.v) * 0.6) <= SEVER.r) { n++; const p = UDEF[e.type].pop; pop += Math.max(0.5, p); su += e.u; sv += e.v; if (p >= SEVER.minPop) big = 1; }
    if (n < 2 && !big) continue;
    const cu = su / n, cv = sv / n;
    const fight = mine.some(m => Math.hypot(m.u - cu, m.v - cv) <= SEVER.fight) ? 1 : 0;
    const guard = sieged.some(b => Math.hypot(b.u - cu, b.v - cv) <= SEVER.fight + b.half) ? 1 : 0;
    const sc = pop * (1 + 0.5 * fight + 0.5 * guard);
    if (sc > bs || (sc === bs && best && c.id < best.id)) { bs = sc; best = { u: cu, v: cv }; }
  }
  return best;
}
function sevFire(g, u, at) {
  const m = muzzle(u);
  g.projs.push({ u: m.u, v: m.v, z: m.z, pu: m.u, pv: m.v, pz: m.z, su: m.u, sv: m.v, tu: at.u, tv: at.v, tz: 10, target: null, side: u.side, weapon: 'exile', dmg: SEVER.dmg * outMul(g, u), splash: SEVER.r, t: 0, speed: SEVER.speed, orb: 1 });
  u.exCd = g.t + SEVER.cd; u.recoil = 1; u.lastAct = g.t; u.face = at.u >= u.u ? 1 : -1;
  const w = P(m.u, m.v, m.z); g.fx.push({ k: 'flash', x: w.x, y: w.y, t: 0, life: 0.12, r: 10 });
  ev(g, { type: 'exileShot', u: u.u, side: u.side });
}
// true: it fired its orb this tick
function sevStep(g, u, foes, st) {
  if (g.t < (u.exCd || 0) || g.t < (u.exChk || 0) || st === 'retreat' || st === 'move') return false;
  u.exChk = g.t + SEVER.every;
  const at = sevSpot(g, u, foes); if (!at) return false;
  sevFire(g, u, at); return true;
}
const EX_TIMERS = ['corrT', 'corr2T', 'slowT', 'disT', 'snT', 'frzT', 'shT', 'ovT', 'oshT', 'bkT', 'phT', 'braceT', 'surgeT', 'leapCd', 'temp', 'sgT', 'dpT', 'surfT', 'burCd', 'exCd', 'spawnT', 'pulseCd', 'phCd', 'burstCd', 'braceCd', 'surgeCd', 'chT', 'shpT'];
function exileBurst(g, p) {
  const w = P(p.u, p.v, 0); g.fx.push({ k: 'rift', side: p.side, u: p.u, x: w.x, y: w.y, t: 0, life: 0.7, r: SEVER.r });
  for (const e of g.ents.slice()) {
    if (!sevOk(g, p.side, e) || Math.hypot(e.u - p.u, (e.v - p.v) * 0.6) > SEVER.r) continue;
    damage(g, e, p.dmg, 'exile', p.side);
    if (e.hp <= 0 || e.exImm > g.t) continue;
    e.exS = g.t; e.exT = g.t + SEVER.dur; e.gone = 2; e.tgt = 0; e.moving = false;
  }
  ev(g, { type: 'exile', u: p.u, v: p.v, side: p.side });
}
function exileEnd(g, u) { // back: every timed effect resumes where it stopped
  const k = u.exT - u.exS;
  for (const f of EX_TIMERS) if (u[f] > u.exS) u[f] += k;
  u.exT = 0; u.gone = 0; u.exImm = g.t + SEVER.imm;
  const w = P(u.u, u.v, 0); g.fx.push({ k: 'unexile', side: u.side, u: u.u, x: w.x, y: w.y, t: 0, life: 0.45 });
}
// The AI's reads for the Gorebore's score (v2.82): the share of the enemy army it knows of that shoots from far back
// (minimum range, Snipers, Marksmen, range 200+), and that shoots at all from range
const aiFar = t => { const d = UDEF[t]; return !!(d.weapon && !d.melee && (d.minRange || BORE_FAR.includes(t) || d.range >= 200)); };
const aiFarShare = th => th.length ? th.filter(u => aiFar(u.type)).length / th.length : 0;
const aiRangedShare = th => th.length ? th.filter(u => { const d = UDEF[u.type]; return d.weapon && !d.melee && !d.air && d.range > 40; }).length / th.length : 0;
