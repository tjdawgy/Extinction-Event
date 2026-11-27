/* ---------- Batch 6i (v2.99, docs/FACTION_REWORK.md "Batch 6i"): the Bloomhost air rework, the under-fire response rework ----------
   Two switches, stored per game in g.rw, on by default, each with a Test Range switch. Both off: v2.98 exactly (nothing below
   runs, nothing new is saved). rwB6i and rwB6iresp are defined in src/sim/rework.js (rwType reads b6i).
   - REWORK.b6i: the Bloomspire roster. The Needlewing, Cloudwing, Brood Tyrant and Worldrender are gone (rwType maps their slots;
     their pustule Mites with them). Every Bloomspire unit hits air and ground.
     The Razorwing (id 'razor6', in the Razorwing's slot): trained as a flock of B6I.razor.n per order (B6I.razor.cost, one
       queue slot; each bird army size 1); a melee dive at ground units and aircraft (weapon 'talon6': the talon's table, 1.25×
       to aircraft); B6I.razor.per faster for each other Razorwing of its side within B6I.razor.r, up to B6I.razor.max (u.fl6N).
     The Gnatcloud (Swarm Bloom T2, the Needlewing's slot): it flies onto its target; every enemy unit, aircraft and building
       within B6I.gnat.r takes B6I.gnat.dps (clouds stack); it takes B6I.gnat.cut less from single-target hits and full damage from
       area damage (6h's AREA6H list, and a splash shell's own target).
     The Blightwing (Swarm Bloom T3, the Cloudwing's slot): every B6I.blight.cd s a spore cone (B6I.blight.range, B6I.blight.deg°)
       hits enemy ground units, aircraft and buildings for B6I.blight.dmg; units are blighted for B6I.blight.dur s (refreshed, never
       stacked; e.bl6T, e.bl6S). A blighted enemy unit that dies bursts into B6I.blight.mites Mites for the Blightwing's side
       (within the side's cap of 30 Mites, B6H.mite.cap).
     The Talonmaw (Apex Bloom T2, the Brood Tyrant's slot): claws; Snatch (small ground units: lifted out of the fight, eaten at
       B6I.talon.sDps, dropped stunned when the Talonmaw takes B6I.talon.drop of its health while carrying; a kill heals it); Rend
       (medium and bigger ground units and vehicles: a dive for B6I.talon.rDmg, then +B6I.talon.amp damage from Bloomhost for
       B6I.talon.rDur s). It dives (B6I.talon.dive× speed) at a target an ability is ready for.
     The Skywyrm (Apex Bloom T3, the Worldrender's slot): an acid spew (lobbed, area, B6I.wyrm.bmul× to buildings), tendrils that
       drag an enemy aircraft to its jaws and bite, and jaws at anything adjacent, air or ground.
     The AI: scores, Razorwing raids, Gnatclouds at clumps and aircraft, Blightwings behind the army, Talonmaws hunting small units
       and rending vehicles, Skywyrms first in the node assault; the Chitin Warden rule counts the Wardens it has queued and stops at
       its quota (Part D).
   - REWORK.b6iresp: units under fire respond (replaces 6g's fire6g while on; needs b6g, which records who hurt a unit): only to a
     unit attacker it can hurt that stands within its own reach + B6I.resp.near (melee B6I.resp.melee); never a pull-back; on Hold a
     leash of B6I.resp.hold from its held spot (it walks back after); on an attack B6I.resp.attack. */
const B6I = {
  razor: { n: 3, cost: { c: 150, e: 50 }, per: 0.05, max: 0.4, r: 80 },
  gnat: { r: 40, dps: 8, cut: 0.5 },
  blight: { range: 120, deg: 50, dmg: 15, dur: 8, mites: 2 },
  talon: { sCd: 8, sDps: 40, drop: 0.25, stun: 0.5, heal: 0.5, cap: 0.25, rCd: 6, rDmg: 60, rDur: 6, amp: 0.15, dive: 2, diveR: 150, hunt: 220 },
  wyrm: { bmul: 2.5, tCd: 6, tR: 180, pull: 1.5, bite: 70, jDmg: 30, jCd: 1, jR: 45 },
  wardFix: true, turtlePlan: true, // Part D; Part B's Bloomhost Turtle plan (an audit can switch either off to measure it; always on in a game) // Part D (an audit can switch it off to measure the old rule; always on in a game)
  resp: { near: 80, melee: 100, hold: 100, attack: 250, charge: 8 },
};
/* ---- the five units (UDEF; their slots in rwType) ---- */
Object.assign(UDEF, {
  razor6: { name: 'Razorwing', desc: 'A flock of fast flyers that dive on ground units and aircraft, hitting aircraft harder. The more fly together, the faster they go. Fragile one by one.', fac: 'bloomhost', from: 'techlab', tier: 1, cost: { c: B6I.razor.cost.c / B6I.razor.n, e: B6I.razor.cost.e / B6I.razor.n }, pop: 1, hp: 90, dmg: 6, cd: 0.75, range: 50, speed: 95, hitsAir: true, armor: 'air', air: true, weapon: 'talon6', time: 10, h: 10, melee: true, chase: 200, flock6: true },
  gnatcloud: { name: 'Gnatcloud', desc: 'A buzzing cloud of countless insects that settles over its target: every enemy inside it, on the ground, in the air or a building, is eaten slowly, and clouds stack. Shots barely thin it; blasts and splash tear through it.', fac: 'bloomhost', from: 'techlab', tier: 2, cost: { c: 120, e: 40 }, pop: 2, hp: 220, dmg: B6I.gnat.dps, cd: 1, range: 14, speed: 55, hitsAir: true, armor: 'air', air: true, weapon: 'gnat6', time: 9, h: 10, melee: true, chase: 220, gn6: true },
  blightwing: { name: 'Blightwing', desc: 'Bloated spore moth. Its spore cone hits ground units, aircraft and buildings and blights the units: a blighted enemy that dies bursts into Mites for you. Keep it behind your army.', fac: 'bloomhost', from: 'techlab', tier: 3, cost: { c: 220, e: 90 }, pop: 3, hp: 320, dmg: B6I.blight.dmg, cd: 3, range: B6I.blight.range, speed: 60, hitsAir: true, armor: 'air', air: true, weapon: 'spore6', time: 12, h: 12, cone6: true },
  talonmaw: { name: 'Talonmaw', desc: 'Fast raptor of the swarm. Its claws hit air and ground; it snatches small ground units out of the fight and eats them, healing on the kill, and rends bigger ones so the swarm hits them harder.', fac: 'bloomhost', from: 'techlab', tier: 2, cost: { c: 200, e: 70 }, pop: 3, hp: 480, dmg: 20, cd: 1, range: 40, speed: 90, hitsAir: true, armor: 'air', air: true, weapon: 'claw6', time: 12, h: 14, melee: true, chase: 220, tm6: true },
  skywyrm: { name: 'Skywyrm', desc: 'Massive serpent of the sky and Bloomhost\'s siege: its lobbed acid spew wrecks buildings and Turrets from far off, its tendrils drag aircraft into its jaws, and its jaws bite anything close. Slow; escort it.', fac: 'bloomhost', from: 'techlab', tier: 3, cost: { c: 480, e: 220 }, pop: 7, hp: 1600, dmg: 45, cd: 2.2, range: 200, speed: 22, hitsAir: false, armor: 'air', air: true, weapon: 'spew6', lob: true, splash: 40, preferB: true, time: 20, h: 20, wyrm6: true },
});
Object.assign(DMG, {
  talon6:  Object.assign({}, DMG.talon, { air: 1.25 }),                                 // a Razorwing's dive: the talon's table, 1.25× to aircraft
  gnat6:   { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 1.0, building: 1.0 },            // a Gnatcloud eating what is inside it
  spore6:  { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 1.0, building: 1.0 },            // a Blightwing's spore cone
  claw6:   { light: 1.0, heavy: 1.0, vehicle: 0.9, air: 1.0, building: 0.5 },            // a Talonmaw's claws
  snatch6: { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 1.0, building: 0 },              // eaten in its talons
  rend6:   { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 0, building: 0 },                // its Rend dive
  spew6:   { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 0, building: B6I.wyrm.bmul },     // a Skywyrm's acid spew (ground units and buildings)
  jaws6:   { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 1.0, building: 0 },              // its jaws
  tendril6: { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 1.0, building: 0 },             // the bite at the end of a tendril drag
});
for (const w of ['gnat6', 'spore6', 'spew6']) AREA6H_W[w] = 1;
PSPEED.spore6 = 420; // never flown (the cone lands at once); the weapon table's rule that every ranged weapon has a speed // area effects (the Chitin Warden's aura, the Gnatcloud's own toughness)
Object.assign(MUZ, { razor6: [10, -4], gnatcloud: [0, 0], blightwing: [14, -2], talonmaw: [16, 2], skywyrm: [30, -4] }); // src/render/units-rework-6i.js
Object.assign(SIGHT, { razor6: 220, gnatcloud: 190, blightwing: 220, talonmaw: 240, skywyrm: 260 });
Object.assign(PLURAL, { razor6: 'Razorwings', gnatcloud: 'Gnatclouds', blightwing: 'Blightwings', talonmaw: 'Talonmaws', skywyrm: 'Skywyrms' });
for (const t of ['razor6', 'gnatcloud', 'blightwing', 'talonmaw', 'skywyrm']) { UGROUPS.air.push(t); GROUP_OF[t] = 'air'; }
UNIT_ORDER.splice(UNIT_ORDER.indexOf('razorwing') + 1, 0, 'razor6');
UNIT_ORDER.splice(UNIT_ORDER.indexOf('needlewing') + 1, 0, 'gnatcloud');
UNIT_ORDER.splice(UNIT_ORDER.indexOf('cloudwing') + 1, 0, 'blightwing');
UNIT_ORDER.splice(UNIT_ORDER.indexOf('broodtyrant') + 1, 0, 'talonmaw');
UNIT_ORDER.splice(UNIT_ORDER.indexOf('worldrender') + 1, 0, 'skywyrm');
UNIT_PATH.gnatcloud = UNIT_PATH.needlewing; UNIT_PATH.blightwing = UNIT_PATH.cloudwing; UNIT_PATH.talonmaw = UNIT_PATH.broodtyrant; UNIT_PATH.skywyrm = UNIT_PATH.worldrender;
Object.assign(AI_TWIN, { razor6: 'razorwing', gnatcloud: 'aircraft', blightwing: 'aircraft', talonmaw: 'aircraft', skywyrm: 'leviathan' });
Object.assign(BODY6H_A, { razor6: 'small', gnatcloud: 'medium', blightwing: 'medium', talonmaw: 'large', skywyrm: 'huge' });

// The Bloomspire's texts follow the new-game default (REWORK.b6i); the unlock lists keep the old ids (rwType maps them) but the
// Codex reads the new ones
const rw6iText = (o, k, on) => { const d = Object.getOwnPropertyDescriptor(o, k), off = d.get ? null : d.value; Object.defineProperty(o, k, { get: () => REWORK.b6i ? on : (d.get ? d.get() : off), enumerable: true, configurable: true }); };
{ const A = TREES_BH.techlab.A.steps, B = TREES_BH.techlab.B.steps;
  rw6iText(A[2], 'short', 'Gnatclouds'); rw6iText(A[2], 'txt', 'Unlocks Gnatclouds: insect clouds that eat everything inside them, air and ground'); rw6iText(A[2], 'unlock', ['gnatcloud']);
  rw6iText(A[3], 'short', 'Blightwings'); rw6iText(A[3], 'txt', 'Unlocks Blightwings: spore moths whose blighted victims burst into Mites'); rw6iText(A[3], 'unlock', ['blightwing']);
  rw6iText(B[2], 'short', 'Talonmaws'); rw6iText(B[2], 'txt', 'Unlocks Talonmaws: raptors that snatch small units and rend big ones'); rw6iText(B[2], 'unlock', ['talonmaw']);
  rw6iText(B[3], 'short', 'Skywyrms'); rw6iText(B[3], 'txt', 'Unlocks Skywyrms: sky serpents whose acid wrecks buildings and whose tendrils drag down aircraft'); rw6iText(B[3], 'unlock', ['skywyrm']);
  const T = BDEFS && BDEFS.bloomhost && BDEFS.bloomhost.techlab; if (T && T.tiers && typeof T.tiers[1] === 'string') rw6iText(T.tiers, 1, 'Grows Razorwing flocks'); if (T) rw6iText(T, 'desc', 'Grows flyers that hit air and ground. Its bloom chooses swarm flyers (Gnatclouds, Blightwings) or apex hunters (Talonmaws, Skywyrms).'); }

/* ---- the Razorwing flock: one order, B6I.razor.n birds ---- */
const flockN6i = t => t === 'razor6' ? B6I.razor.n : 1; // birds per order (only the batch 6i Razorwing flocks)
function flockTrain6i(g, s, d, prods) {
  const side = g.sides[s], K = B6I.razor.cost, pop = d.pop * B6I.razor.n;
  prods.sort((a, b) => a.queue.length - b.queue.length);
  const p = prods.find(b => b.queue.length < 5) || prods[0], cap = popCap(g, s);
  if (popUsed(g, s) + pop > cap) return { ok: false, msg: cap >= POP_MAX ? 'Army is at maximum size' : 'Army is full — build or upgrade a Habitat' };
  if (side.res.c < K.c) return { ok: false, msg: `Need ${Math.ceil(K.c - side.res.c)} more credits` };
  if (side.res.e < K.e) return { ok: false, msg: `Need ${Math.ceil(K.e - side.res.e)} more energy` };
  if (p.queue.length >= 5) return { ok: false, msg: 'Production queue is full' };
  side.res.c -= K.c; side.res.e -= K.e; p.queue.push('razor6');
  logSpend(g, s, 'u', K.c, K.e);
  return { ok: true, msg: `Flock of ${B6I.razor.n} Razorwings queued` };
}

/* ---- per-side counters (self-play) ---- */
const sw6i = (g, s) => g.sides[s].i6 || (g.sides[s].i6 = { gnat: 0, blight: 0, bMites: 0, snatch: 0, eaten: 0, drops: 0, rend: 0, rendDmg: 0, tendril: 0, jaws: 0, spewB: 0, raids: 0 });

/* ---- the tick (before the units move) ---- */
const FL6 = [[], []];
function update6i(g, dt) {
  FL6[0].length = 0; FL6[1].length = 0;
  const G = [], W = [], C = [];
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.hp <= 0) continue;
    if (e.sn6 || e.dr6) C.push(e);
    if (e.gone || e.side < 0 || e.side > 1) continue;
    if (e.type === 'razor6') FL6[e.side].push(e);
    else if (e.type === 'gnatcloud') G.push(e);
    else if (e.type === 'skywyrm') W.push(e);
  }
  // Razorwing flocks: each counts the other Razorwings of its side near it (speed)
  const R2 = B6I.razor.r * B6I.razor.r, cap = Math.round(B6I.razor.max / B6I.razor.per);
  for (const L0 of FL6) for (const a of L0) { let n = 0; for (const b of L0) if (b !== a) { const du = b.u - a.u, dv = b.v - a.v; if (du * du + dv * dv <= R2) n++; } a.fl6N = Math.min(cap, n); }
  // Gnatclouds: everything hostile inside the cloud is eaten (clouds stack)
  for (const c of G) {
    if (g.sides[c.side].hush) continue;
    let n = 0;
    for (const e of g.ents) {
      if (e.side === c.side || e.side === NEUTRAL || e.hp <= 0 || e.gone || e.shielded || Math.abs(e.u - c.u) > B6I.gnat.r + (e.half || 0)) continue;
      const dd = Math.hypot(e.u - c.u, e.v - c.v) - (e.kind === 'b' ? e.half : 0); if (dd > B6I.gnat.r) continue;
      damage(g, e, B6I.gnat.dps * dt * (sideBuff(g, c.side) ? NANO.dmg : 1) * outMul(g, c), 'gnat6', c.side, null); n++;
    }
    if (n) { c.lastAct = g.t; c.gnT6 = g.t; sw6i(g, c.side).gnat += B6I.gnat.dps * dt * n; }
  }
  // Snatched units (eaten in a Talonmaw's talons) and dragged aircraft (a Skywyrm's tendril)
  for (const e of C) {
    if (e.sn6) carry6i(g, e, dt);
    else if (e.dr6) drag6i(g, e);
  }
  // Skywyrms: tendrils and jaws
  for (const w of W) { if (!g.sides[w.side].hush) wyrm6i(g, w); }
}

/* ---- the Gnatcloud ---- */
// Its part of a tick: true when handled. A target in reach: it flies onto it (the aura does the eating; it never fires). An AI's
// cloud picks the thickest clump of enemies it can see within its chase (aircraft count double) every 0.5 s.
function gnat6i(g, u, d, best, A, side, st, cs, dt, sp) {
  if (st === 'retreat' || st === 'move' || (cs && (cs.run || (cs.go && !cs.want)))) return false;
  if (best) { u.moving = false; u.tgt = best.id; const dd = Math.hypot(best.u - u.u, best.v - u.v) - (best.kind === 'b' ? best.half * 0.5 : 0); if (dd > 4) moveToward(u, d, best.u, best.v, dt, sp); if (Math.abs(best.u - u.u) > 1) u.face = best.u >= u.u ? 1 : -1; return true; }
  if (side.direct || side.hush) return false;
  if (!(u.gnP6 > g.t)) {
    u.gnP6 = g.t + 0.5; u.gnC6 = null;
    const foes = g.ents.filter(e => e.kind === 'u' && e.side !== u.side && e.side !== NEUTRAL && e.hp > 0 && !e.gone && Math.abs(e.u - u.u) <= d.chase && Math.hypot(e.u - u.u, e.v - u.v) <= d.chase && visibleTo(g, u.side, e));
    let bs = 0;
    for (const c of foes) { let n = 0; for (const e of foes) if (Math.abs(e.u - c.u) <= B6I.gnat.r && Math.hypot(e.u - c.u, e.v - c.v) <= B6I.gnat.r) n += UDEF[e.type].air ? 2 : 1; if (n > bs || (n === bs && u.gnC6 && c.id < u.gnC6)) { bs = n; u.gnC6 = c.id; } }
  }
  const T = u.gnC6 ? ctlEnt(g, u.gnC6) : null;
  if (!T || T.hp <= 0 || T.gone) return false;
  u.tgt = 0; moveToward(u, d, T.u, T.v, dt, sp); return true;
}
// Damage it takes: single-target hits are cut; area damage (AREA6H) and a splash shell's own target take full
const A6I = { sp: 0 };
// It hangs low over its target: ground weapons with splash or flame can target it, and it takes their hits as light armour
function gnLow6i(e, def) { return e.type === 'gnatcloud' && def.hitsGround !== false && !!(def.splash > 0 || def.weapon === 'flame' || def.salvo || def.carpet); }
function gnArm6i(weapon) { const m = DMG[weapon]; return m && m.air ? 'air' : 'light'; }
const gnatCut6i = (e, weapon) => e.kind === 'u' && e.type === 'gnatcloud' && !area6h(weapon) && !A6I.sp;

/* ---- the Blightwing ---- */
function cone6i(g, src, t, def) {
  const K = B6I.blight, a0 = Math.atan2(t.v - src.v, t.u - src.u), half = K.deg * Math.PI / 360, dmg = def.dmg * (sideBuff(g, src.side) ? NANO.dmg : 1) * outMul(g, src);
  let n = 0;
  AREA6H.on++;
  try {
    for (const e of g.ents.slice()) {
      if (e.side === src.side || e.side === NEUTRAL || e.hp <= 0 || e.gone || e.shielded) continue;
      const du = e.u - src.u, dv = e.v - src.v, dd = Math.hypot(du, dv) - (e.kind === 'b' ? e.half : 0);
      if (dd > K.range || (e === t ? false : dd > 4 && Math.abs(((Math.atan2(dv, du) - a0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI) > half)) continue;
      damage(g, e, dmg, 'spore6', src.side);
      if (e.kind === 'u' && e.hp > 0) { e.bl6T = g.t + K.dur; e.bl6S = src.side; n++; }
    }
  } finally { AREA6H.on--; }
  src.recoil = 1; src.face = t.u >= src.u ? 1 : -1;
  if (n) sw6i(g, src.side).blight += n;
  const w = P(src.u, src.v, src.z || 0); g.fx.push({ k: 'cone6i', side: src.side, u: src.u, x: w.x, y: w.y, a: Math.atan2((t.v - src.v) * 0.6, t.u - src.u), r: K.range, half, t: 0, life: 0.6 });
}
function blightDie6i(g, e) { // a blighted enemy unit died: Mites for the Blightwing's side (within its cap)
  const s = e.bl6S; if (s !== 0 && s !== 1 || s === e.side) return;
  const room = Math.max(0, B6H.mite.cap - miteCount6h(g, s)), n = Math.min(B6I.blight.mites, room);
  for (let i = 0; i < n; i++) { const a = e.id * 1.7 + i * Math.PI, k = spawnMite6h(g, s, e.u + Math.cos(a) * 8, e.v + Math.sin(a) * 6, 'blight'); k.face = dirOf(s); }
  if (n) { sw6i(g, s).bMites += n; const w = P(e.u, e.v, 4); g.fx.push({ k: 'blightpop6i', side: s, u: e.u, x: w.x, y: w.y, t: 0, life: 0.6, n }); }
}

/* ---- the Talonmaw ---- */
const smallG6i = e => e.kind === 'u' && !UDEF[e.type].air && bodyClass6h(e.type) === 'small';
const rendOk6i = e => e.kind === 'u' && !UDEF[e.type].air && (bodyClass6h(e.type) !== 'small' || (e.arm || UDEF[e.type].armor) === 'vehicle');
const snatchOk6i = (g, e) => smallG6i(e) && e.side !== NEUTRAL && e.hp > 0 && !e.gone && !e.lt && !e.ltH && !e.leaping && !e.sn6 && !e.dr6 && !e.sw6 && !e.tn && !e.crg;
// Its part of a tick, before the usual attack: true when handled (a Snatch or a Rend this tick, or an AI's Talonmaw hunting)
function talon6i(g, u, d, best, A, side, st, cs, dt, sp) {
  const K = B6I.talon, sRdy = !u.snV6 && g.t >= (u.snCd6 || 0), rRdy = g.t >= (u.rnCd6 || 0);
  if (st === 'retreat' || st === 'move' || (cs && (cs.run || (cs.go && !cs.want)))) return false;
  if (best && best.kind === 'u' && u.cd <= 0 && !(u.phT > g.t)) {
    if (sRdy && snatchOk6i(g, best)) { snatch6i(g, u, best); u.cd = d.cd; return true; }
    if (rRdy && rendOk6i(best) && !best.gone) { rend6i(g, u, best); u.cd = d.cd; return true; }
  }
  if (best) return false;
  // a target an ability is ready for: it dives (and an AI's goes looking for one: small units to snatch, then vehicles and big units to rend)
  let T = A.prey && ((sRdy && snatchOk6i(g, A.prey)) || (rRdy && rendOk6i(A.prey))) ? A.prey : null;
  if (!T && !side.direct && (sRdy || rRdy)) {
    let bd = K.hunt;
    for (const e of g.ents) {
      if (e.kind !== 'u' || e.side === u.side || e.side === NEUTRAL || e.hp <= 0 || e.gone || Math.abs(e.u - u.u) > bd) continue;
      if (!((sRdy && snatchOk6i(g, e)) || (rRdy && rendOk6i(e)))) continue;
      const k = Math.hypot(e.u - u.u, e.v - u.v); if (k < bd && visibleTo(g, u.side, e)) { bd = k; T = e; }
    }
  }
  if (!T) return false;
  if (Math.hypot(T.u - u.u, T.v - u.v) <= K.diveR) u.tdv6 = g.t + 0.1;
  if (!side.direct || T === A.prey) { u.tgt = 0; moveToward(u, d, T.u, T.v, dt, sp * (u.tdv6 > g.t ? K.dive : 1)); return true; }
  return false;
}
function snatch6i(g, u, V) {
  V.sn6 = { by: u.id, hp0: u.hp, t0: g.t }; V.gone = 5; V.tgt = 0; V.moving = false; V.chT = 0; V.nav = undefined;
  u.snV6 = V.id; u.snCd6 = g.t + B6I.talon.sCd; u.recoil = 1; u.lastAct = g.t;
  sw6i(g, u.side).snatch++;
  const w = P(V.u, V.v, 0); g.fx.push({ k: 'snatch6i', side: u.side, u: V.u, x: w.x, y: w.y, t: 0, life: 0.5 });
  ev(g, { type: 'snatch6', u: V.u, side: u.side, prey: V.type });
}
function rend6i(g, u, T) {
  const dmg = B6I.talon.rDmg * (sideBuff(g, u.side) ? NANO.dmg : 1) * outMul(g, u);
  damage(g, T, dmg, 'rend6', u.side, u);
  if (T.hp > 0) T.rn6T = g.t + B6I.talon.rDur;
  u.rnCd6 = g.t + B6I.talon.rCd; u.recoil = 1; u.lastAct = g.t;
  sw6i(g, u.side).rend++;
  const w = P(T.u, T.v, aimZ(T)); g.fx.push({ k: 'rend6i', side: u.side, u: T.u, x: w.x, y: w.y, t: 0, life: 0.5, face: u.face });
}
const rendAmp6i = (g, e, fromSide) => e.rn6T > g.t && fromSide >= 0 && fromSide < 2 && facOf(g.sides[fromSide].faction) === 'bloomhost' ? 1 + B6I.talon.amp : 1;
function carry6i(g, V, dt) { // in a Talonmaw's talons: eaten, or dropped
  const T = ctlEnt(g, V.sn6.by), K = B6I.talon;
  if (!T || T.hp <= 0 || T.dead || T.hp <= V.sn6.hp0 - T.maxHp * K.drop) { drop6i(g, V, T); return; }
  V.u = T.u; V.v = T.v;
  damage1(g, V, K.sDps * dt, 'snatch6', T.side, null);
  if (V.hp <= 0) { // eaten: it heals on the meal
    const heal = Math.min(V.maxHp * K.heal, T.maxHp * K.cap, T.maxHp - T.hp);
    if (heal > 0) { T.hp += heal; const w = P(T.u, T.v, T.z || 0); g.fx.push({ k: 'devour', side: T.side, u: T.u, x: w.x, y: w.y + 10, x2: w.x, y2: w.y, t: 0, life: 0.8, n: Math.round(heal) }); }
    T.snV6 = 0; V.sn6 = undefined; sw6i(g, T.side).eaten++;
  }
}
function drop6i(g, V, T) { // dropped: it lands where the Talonmaw is, stunned
  V.sn6 = undefined; V.gone = 0; if (T) T.snV6 = 0;
  if (!MAP_2D) V.v = clamp(V.v, -LANE_V, LANE_V);
  if (NAV.on && navShut(V.u, V.v)) navEject(V);
  if (MAP_LANED) V.lane = laneAt(V.u, V.v);
  V.dzT = Math.max(V.dzT || 0, g.t + B6I.talon.stun); V.st6 = g.t + B6I.talon.stun; V.nav = undefined;
  if (T && T.hp > 0) sw6i(g, T.side).drops++;
  const w = P(V.u, V.v, 0); g.fx.push({ k: 'drop6i', side: T ? T.side : 1 - V.side, u: V.u, x: w.x, y: w.y, t: 0, life: 0.5 });
}

/* ---- the Skywyrm ---- */
const jaws6i = W => [W.u + W.face * 22, W.v];
function wyrm6i(g, W) {
  const K = B6I.wyrm;
  if (g.t >= (W.tdCd6 || 0) && !W.drV6) { // a tendril at an enemy aircraft within reach
    let T = null, bd = K.tR;
    for (const e of g.ents) {
      if (e.kind !== 'u' || e.side === W.side || e.side === NEUTRAL || e.hp <= 0 || e.gone || !UDEF[e.type].air || e.lnd >= 2 || e.dr6 || e.phT > g.t || e.wwT > g.t) continue;
      const k = Math.hypot(e.u - W.u, e.v - W.v); if (k < bd && visibleTo(g, W.side, e)) { bd = k; T = e; }
    }
    if (T) { T.dr6 = { by: W.id, t0: g.t, end: g.t + K.pull, u0: T.u, v0: T.v }; T.tgt = 0; T.moving = false; W.drV6 = T.id; W.tdCd6 = g.t + K.tCd; sw6i(g, W.side).tendril++; ev(g, { type: 'tendril6', u: W.u, side: W.side }); }
  }
  if (g.t >= (W.jwCd6 || 0)) { // its jaws: the nearest enemy unit beside it, air or ground
    const [ju, jv] = jaws6i(W); let T = null, bd = K.jR;
    for (const e of g.ents) {
      if (e.kind !== 'u' || e.side === W.side || e.side === NEUTRAL || e.hp <= 0 || e.gone || e.phT > g.t || Math.abs(e.u - ju) > bd) continue;
      const k = Math.hypot(e.u - ju, e.v - jv); if (k < bd) { bd = k; T = e; }
    }
    if (T) { damage(g, T, K.jDmg * (sideBuff(g, W.side) ? NANO.dmg : 1) * outMul(g, W), 'jaws6', W.side, W); W.jwCd6 = g.t + K.jCd; W.jwT6 = g.t; W.lastAct = g.t; sw6i(g, W.side).jaws++; if (Math.abs(T.u - W.u) > 1) W.face = T.u >= W.u ? 1 : -1; }
  }
}
function drag6i(g, V) { // pulled by a tendril to the Skywyrm's jaws, then bitten
  const W = ctlEnt(g, V.dr6.by), D = V.dr6;
  if (!W || W.hp <= 0 || W.dead) { V.dr6 = undefined; return; }
  const [ju, jv] = jaws6i(W), k = clamp((g.t - D.t0) / (D.end - D.t0), 0, 1), e2 = k * k * (3 - 2 * k);
  V.u = clamp(D.u0 + (ju - D.u0) * e2, 0, L); V.v = D.v0 + (jv - D.v0) * e2; V.moving = false; V.tgt = 0;
  if (g.t >= D.end) {
    V.dr6 = undefined; W.drV6 = 0;
    damage(g, V, B6I.wyrm.bite * (sideBuff(g, W.side) ? NANO.dmg : 1) * outMul(g, W), 'tendril6', W.side, W); W.jwT6 = g.t;
    const w = P(V.u, V.v, V.z || 0); g.fx.push({ k: 'bite6i', side: W.side, u: V.u, x: w.x, y: w.y, t: 0, life: 0.4 });
  }
}

/* ---- deaths (kill) ---- */
function kill6i(g, e) {
  if (e.bl6T > g.t) blightDie6i(g, e);
  if (e.snV6) { const V = ctlEnt(g, e.snV6); if (V && V.sn6) drop6i(g, V, e); }
  if (e.sn6) { e.sn6 = undefined; e.gone = 0; }
  if (e.drV6) { const V = ctlEnt(g, e.drV6); if (V && V.dr6) V.dr6 = undefined; }
}

/* ---- the Bloomhost air AI (b6i) ---- */
const RW6I_TASTE = {
  razor6: { boomer: 1.2, aggressor: 1.2, economist: 1.0, turtle: 0.9, trickster: 1.1 },
  gnatcloud: { boomer: 1.0, aggressor: 1.0, economist: 1.1, turtle: 1.1, trickster: 1.0 },
  blightwing: { boomer: 1.0, aggressor: 1.0, economist: 1.2, turtle: 1.1, trickster: 1.0 },
  talonmaw: { boomer: 1.2, aggressor: 1.2, economist: 1.0, turtle: 0.9, trickster: 1.1 },
  skywyrm: { boomer: 1.0, aggressor: 1.0, economist: 1.1, turtle: 1.3, trickster: 1.0 },
};
function aiScores6i(g, s, sc, c) {
  if (facOf(g.sides[s].faction) !== 'bloomhost') return;
  const { comp, theirs, mine } = c, air = aiAirShare(theirs), pack = aiPack(theirs), fort = fortGuns6h(g, s);
  const antiAir = theirs.length ? theirs.filter(u => UDEF[u.type].hitsAir).length / theirs.length : 0.5;
  const turtle = theirs.length > 2 && theirs.filter(u => Math.abs(u.u - hqU(1 - s)) < 560).length / theirs.length > 0.6;
  const n = t => mine.filter(u => u.type === t).length;
  if (sc.razor6 !== undefined || canTrain(g, s, 'razor6')) sc.razor6 = 1.1 + air * 1.6 + comp.light * 0.3 + (g.t < 420 ? 0.4 : 0) + (antiAir < 0.45 ? 0.4 : 0) - (n('razor6') >= 12 ? 0.6 : 0);
  if (canTrain(g, s, 'gnatcloud')) sc.gnatcloud = 1.1 + pack * 1.0 + comp.light * 0.5 + air * 1.2 - (n('gnatcloud') >= 6 ? 0.5 : 0);
  if (canTrain(g, s, 'blightwing')) sc.blightwing = 1.3 + comp.light * 0.5 + comp.heavy * 0.4 + air * 0.4 + pack * 0.4 - antiAir * 0.3;
  if (canTrain(g, s, 'talonmaw')) sc.talonmaw = 1.2 + comp.light * 0.8 + comp.vehicle * 0.6 + comp.heavy * 0.3 - antiAir * 0.3;
  if (canTrain(g, s, 'skywyrm')) sc.skywyrm = 1.4 + (turtle ? 0.8 : 0.2) + Math.min(4, fort) * 0.2 + air * 0.5 - antiAir * 0.4 - (n('skywyrm') >= 3 ? 0.8 : 0);
  if (rwB6hnode(g) && fort >= NODE6.fort && sc.skywyrm !== undefined) sc.skywyrm += 0.6; // fortified enemy nodes: the Skywyrm first among the building-breakers
}
// Part D: the Chitin Warden quota (aiScores6h's rule, counted right): the Wardens alive and queued against one per WARD6H.per supply
function ward6i(g, s, sc, spl) {
  if (sc.bulwark === undefined) return;
  const want = Math.max(1, Math.round(popUsed(g, s) / WARD6H.per)), have = unitCount(g, s, 'bulwark');
  if (have >= want) sc.bulwark = Math.min(sc.bulwark, 0.4); // at its quota: no more
  else if (spl > 0) sc.bulwark = Math.max(sc.bulwark, 1.6 + spl * 1.5);
}
// The batch 6d Turtle's plan has no Tech Lab (a ground fortress), and its eight items fill every pad once its first Habitat is up.
// With b6i a Bloomhost Turtle keeps that opening (measured: giving its third Refinery's or its Reactor's place in the plan to a
// Bloomspire cost it a third of its income, or never found a pad) and grows a Bloomspire late: the plan ends with one, and from
// TURTLE6I.at, with every pad taken, energy banked (TURTLE6I.e), the Bloomspire's price in hand and no enemy near its HQ, it sells
// its Reactor and grows the Bloomspire on that pad (turtle6i). Its Skywyrms (siege and air defence) and the rest of the air roster
// are within its reach then. Other plans unchanged.
const TURTLE6I = { at: 480, e: 300, near: 500, every: 5 };
function plan6i(g, s, P) {
  const p = P.plan;
  if (!B6I.turtlePlan || P.kind !== 'turtle' || (facOf(g.sides[s].faction) !== 'bloomhost' && !turtleFac6j(g, s)) || !p || p.includes('techlab')) return p; // v3.00 (b6j): the Last Fist Turtle too
  return P.plan6i || (P.plan6i = p.concat('techlab'));
}
function turtle6i(g, s, mine) {
  const side = g.sides[s], P = side.persona;
  if (!B6I.turtlePlan || !P || P.kind !== 'turtle' || side.hush || g.t < TURTLE6I.at || g.t < (side.tt6i || 0)) return;
  side.tt6i = g.t + TURTLE6I.every;
  if (countB(g, s, 'techlab') || padsOpen(g, s) > 0 || side.res.e < TURTLE6I.e) return;
  const d = bdS(g, s, 'techlab'); if (!d || side.res.c < d.cost.c || side.res.e - TURTLE6I.e < d.cost.e) return;
  const hq = side.hq; if (g.ents.some(e => e.kind === 'u' && e.side === 1 - s && e.hp > 0 && Math.hypot(e.u - hq.u, e.v - hq.v) < TURTLE6I.near && visibleTo(g, s, e))) return;
  const R = alive(g, s, 'reactor').filter(b => b.built && !b.upgrading).sort((a, b) => a.tier - b.tier || a.id - b.id)[0]; if (!R) return;
  const pad = R.slot; if (!trySell(g, s, R).ok) return;
  const r = tryBuild(g, s, 'techlab', pad); sw6i(g, s).spire = r.ok ? g.t : -g.t; lg(g, s, 'G', 'spire6i', r.ok ? 1 : 0);
}
const RAZ6I = { min: 6, end: 3, dur: 35, every: 2, home: 430, hurt: 0.5 };
const AIRWAIT6I = { blight: 60 };
function aiRework6i(g, s, mine) {
  const side = g.sides[s], dir = dirOf(s);
  if (facOf(side.faction) !== 'bloomhost') return;
  turtle6i(g, s, mine); // a Bloomhost Turtle's late Bloomspire
  // Blightwings behind the main army on the attack (they cone what is in reach)
  if (side.stance === 'attack') {
    const front = mine.filter(u => isSwarmG(UDEF[u.type]) && !u.gone && !u.temp && UDEF[u.type].weapon && !u.tn);
    if (front.length >= 3) { const xs = front.map(u => dir * u.u).sort((a, b) => a - b), med = xs[xs.length >> 1]; for (const b of mine) if (b.type === 'blightwing' && dir * b.u > med - AIRWAIT6I.blight) b.aiWait = g.t + 1.5; }
  }
  // Razorwing raids: flocks harass the enemy's economy (a Refinery or a node it holds, away from its guns) while the army is home
  const R = side.rz6, birds = mine.filter(u => u.type === 'razor6');
  if (R) {
    const live = birds.filter(u => R.ids.includes(u.id));
    if (live.length < RAZ6I.end || g.t - R.t0 > RAZ6I.dur || side.stance === 'attack' || live.reduce((a, u) => a + u.hp, 0) < R.hp0 * RAZ6I.hurt) { for (const u of live) u.ag6 = undefined; side.rz6 = null; }
    else for (const u of live) u.ag6 = [R.u, R.v];
    return;
  }
  if (g.t < (side.rzT6 || 0) || side.stance === 'attack' || birds.length < RAZ6I.min) return;
  side.rzT6 = g.t + RAZ6I.every;
  const f = g.fog[s], opp = 1 - s, gh = Object.values(f.ghosts).filter(x => x.side === opp);
  const guns = gh.filter(x => x.type === 'turret' || x.type === 'hq' || x.type === 'bunker');
  const cover = (u, v) => guns.some(x => Math.hypot(x.u - u, x.v - v) < 260);
  const cand = gh.filter(x => x.type === 'refinery' && !cover(x.u, x.v)).map(x => [x.u, x.v]);
  g.nodes.forEach(n => { if (n.owner === opp && n.type !== 'relic' && !cover(n.u, n.v)) cand.push([n.u, n.v]); });
  if (!cand.length) return;
  cand.sort((a, b) => Math.hypot(a[0] - hqU(s), a[1]) - Math.hypot(b[0] - hqU(s), b[1]) || a[0] - b[0]);
  const ids = birds.filter(u => u.hp >= u.maxHp * 0.6).map(u => u.id); if (ids.length < RAZ6I.min) return;
  side.rz6 = { ids, u: cand[0][0], v: cand[0][1], t0: g.t, hp0: birds.filter(u => ids.includes(u.id)).reduce((a, u) => a + u.hp, 0) };
  sw6i(g, s).raids++; lg(g, s, 'G', 'raid6i', ids.length);
}

/* ---- REWORK.b6iresp: units under fire respond (every faction, the AI and the player) ----
   Replaces 6g's fire6g while on. A unit holding (the player's Hold, an AI on Hold or on Retreat at home), or attacking with nothing
   in reach (the player's Attack once on its lane, an AI's attack stance), hit in the last B6G3.recent s by an enemy unit:
   - responds only when it can hurt that unit (hits6g) and the unit stands within its own reach + B6I.resp.near (a melee unit:
     B6I.resp.melee); anything further (Artillery, Snipers, other long guns) gets no response at all;
   - never pulls back (retreating is the player's order or the AI's army-level decision);
   - charges within a leash: B6I.resp.hold from its held spot on Hold (then the Hold walks it back), B6I.resp.attack on an attack;
   - never on a move or retreat order; never at a building, a shielded or untargetable unit. */
function fire6i(g, u, d, side, st, cs, po, best, home, dt, sp) {
  const R = u.r6, K = B6I.resp;
  if (R) {
    const T = ctlEnt(g, R.id), end = () => { u.r6 = undefined; return false; };
    if (R.m !== 'c' || !T || T.hp <= 0 || T.gone || T.phT > g.t || (po ? po.o !== R.o || (cs && (cs.go || cs.run)) : side.stance !== R.o)) return end();
    if (g.t - R.t0 > K.charge || Math.hypot(u.u - R.au, u.v - R.av) > R.lsh || !visibleTo(g, u.side, T)) return end();
    if (best) return false;
    if (Math.hypot(T.u - R.au, T.v - R.av) > R.lsh + d.range) return end(); // it would have to leave its leash to reach it
    go6g(u, d, T.u, T.v, dt, sp); return true;
  }
  if (best || !u.hb6 || g.t - u.hbT > B6G3.recent || side.hush || u.siege || u.dep || u.bur || u.leaping || u.lt || u.tn || d.support || !d.weapon) return false;
  if (po) { if (!(po.o === 'hold' || (po.o === 'attack' && !cs))) return false; }
  else if (!(st === 'attack' || st === 'hold' || (st === 'retreat' && Math.abs(home - u.u) <= B6G3.home)) || u.aiBack > g.t) return false;
  const T = ctlEnt(g, u.hb6);
  if (!T || T.kind !== 'u' || T.hp <= 0 || T.gone || T.side === u.side || T.shielded || T.phT > g.t || T.wwT > g.t || !hits6g(g, d, T) || !visibleTo(g, u.side, T)) return false;
  if (effDist(u, T) > (d.melee ? K.melee : (d.range || 0) + K.near)) return false; // too far: no response (long guns)
  const o = po ? po.o : side.stance, hold = o !== 'attack', au = hold && u.holdU !== undefined ? u.holdU : u.u, av = hold && u.holdU !== undefined ? u.holdV : u.v, lsh = hold ? K.hold : K.attack;
  if (Math.hypot(T.u - au, T.v - av) > lsh + d.range) return false;
  u.r6 = { m: 'c', id: T.id, t0: g.t, au, av, o, lsh }; sw6iR(g, u.side).charge++;
  go6g(u, d, T.u, T.v, dt, sp); return true;
}
const sw6iR = (g, s) => g.sides[s].r6i || (g.sides[s].r6i = { charge: 0 });
