/* ---------- Batch 6h (v2.98, docs/FACTION_REWORK.md "Batch 6h"): the Bloomhost ground rework, unit bodies, the Bloomhost node fix ----------
   Three switches, stored per game in g.rw, on by default, each with a Test Range switch. All three off: v2.97 exactly (nothing
   below runs, nothing new is saved). rwB6h, rwB6hbody, rwB6hnode are defined in src/sim/rework.js (rwType reads b6h).
   - REWORK.b6h: the Bloomhost ground rework.
     Pounce (B6H.pounce): the Ravager, Chitin Warden, Broodback, a surfaced Gorebore and a Dreadthorn whose charge is on cooldown
       lunge at an enemy ground unit within pounce.r they are not yet in contact with, while attacking, attack-moving or engaged
       on Hold: pounce.mul × speed for pounce.dur s, every pounce.cd s (u.pcT, u.pcCd). Never on a move order or a retreat.
     The loose swarm (B6H.loose): Skitterlings, Spitters, Leapers, Queens and Mites keep loose px more spacing between them while
       moving or idle, normal body spacing while attacking (body6h; with b6hbody off a light separation of their own).
     The Mite: one type (the Brood Mound's, the Queen's, a Brood Tyrant pustule's), B6H.mite: its bite corrodes like the
       Spitter's acid (same amount, length and stacking rules), it lives mite.life s, no supply, no cap of 60, never captures;
       at most mite.cap alive per side from every source; at the cap new spawns wait (the Mound's owed Mites, the Queen's timer).
     The Spitter: trained at the Larva Pit from T1 with no path (canMake); its stats unchanged.
     The Queen (new, 'queen', Acidic Evolution T2, where the Spitter was): a bile bolt at air and ground that corrodes; while
       an enemy is within queen.near she births a Mite every queen.every s, up to queen.own of her own alive (u.qm on the Mite):
       they fight her target or enemies near her and stay within queen.leash of her; with nothing to fight they guard her.
     The Leaper (B6H.leaper): leap range 260, cooldown 10 s; it aims at Artillery and deployed siege first, then ranged units,
       then vehicles, walkers and big ground units, then anything else on the ground; airborne it passes over bodies; landing
       it stuns enemy ground units within leaper.stunR for leaper.stun s (u.dzT, the Dreadthorn's daze); it latches onto any
       ground unit (55/s on big hosts, leaper.small/s on small ones).
     The Chitin Warden (the Bulwark, id 'bulwark' kept): Bloomhost units within ward.r of a Warden take ward.cut less AREA
       damage (AREA6H: splash on anyone but the primary target, and every attack whose effect is an area; never stacking).
     The Broodback (new, 'broodback', replaces the Thornback; Behemoth Evolution T2): a weak bite and Pounce; dying it bursts
       into brood.n Skitterlings (fewer at the limit of 60) that take its order, and leaves a Bile Bloom (g.bp6) for
       brood.life s: enemies inside take brood.dps, Bloomhost units inside attack brood.atk× and move brood.move× faster.
     The Ruinmaw (B6H.ruin): surfacing erupts (ruin.eDmg to enemy ground units within ruin.eR, knocked ruin.knock aside); it can
       dive again ruin.dive s after surfacing; every ruin.swCd s surfaced it swallows one adjacent enemy ground unit (never a
       huge one) for ruin.swDur s at ruin.swDps (spat out alive at the end, or when it dives or dies). The Tunnel: selected
       Bloomhost ground units standing on their own creep burrow where they stand and travel to the surfaced Ruinmaw at
       ruin.speed (at least ruin.min s), coming out of its mouth two a second; units off creep stay. If it dives or dies with
       units inside, they come up where they went down. A production building's rally can be set on it (b.rm6): its new units
       tunnel from the building.
   - REWORK.b6hbody: unit bodies (BODY6H), every faction; see body6h.
   - REWORK.b6hnode: the Bloomhost AI's node-contest fix; see aiNode6h. */
const B6H = {
  pounce: { r: 90, mul: 2.5, dur: 0.4, cd: 4 },
  loose: 10,
  mite: { hp: 30, dmg: 4, cd: 0.6, speed: 64, life: 10, cap: 30 },
  queen: { every: 2.5, near: 300, own: 6, leash: 250 },
  leaper: { range: 260, cd: 10, speed: 340, stunR: 40, stun: 0.6, small: 30 },
  ward: { r: 140, cut: 0.4 },
  brood: { n: 3, r: 50, life: 6, dps: 10, atk: 1.2, move: 1.15 },
  ruin: { eR: 70, eDmg: 120, knock: 30, speed: 300, min: 2, swCd: 8, swDur: 3, swDps: 80, dive: 15 },
};
const LOOSE6H = { skitterling: 1, spitter: 1, leaper: 1, queen: 1, mite: 1 };
const POUNCE6H = { ravager: 1, bulwark: 1, broodback: 1, gorebore: 1, dreadthorn: 1 };

/* ---- the two new units ---- */
Object.assign(UDEF, {
  queen: { name: 'Queen', desc: 'Hunched, plague-ridden brood mother. Her bile bolt hits air and ground and corrodes, and while enemies are near she births Mites that fight around her. Slow and fragile up close: keep her behind the swarm.', fac: 'bloomhost', from: 'barracks', tier: 2, cost: { c: 150, e: 50 }, pop: 3, hp: 260, dmg: 10, cd: 1.4, range: 150, speed: 26, hitsAir: true, armor: 'light', weapon: 'bilebolt', time: 9, h: 20, corrode: { amt: 0.12, dur: 5 }, queen6: true },
  broodback: { name: 'Broodback', desc: 'Hunched beast carrying egg sacs on its back. A weak bite and a lunge; when it dies it bursts into Skitterlings and leaves a Bile Bloom that burns enemies and quickens the swarm. Lead a push with it.', fac: 'bloomhost', from: 'factory', tier: 2, cost: { c: 180, e: 40 }, pop: 3, hp: 520, dmg: 12, cd: 1.2, range: 30, speed: 22, hitsAir: false, armor: 'heavy', weapon: 'gore', time: 11, h: 20, melee: true, chase: 150, pounce: true, brood6: true },
});
Object.assign(DMG, {
  bilebolt: { light: 1.0, heavy: 1.0, vehicle: 0.9, air: 1.0, building: 0.5 }, // the Queen's bolt
  erupt6:   { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 0, building: 0 },     // the Ruinmaw's eruption (units)
  bloom6:   { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 0, building: 0 },     // a Bile Bloom's burn
  swallow6: { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 0, building: 0 },     // inside a Ruinmaw
});
PSPEED.bilebolt = 300;
Object.assign(MUZ, { queen: [16, 27], broodback: [22, 12] }); // the Queen's bile hand, the Broodback's jaw (src/render/units-rework-6h.js)
Object.assign(SIGHT, { queen: 210, broodback: 190 });
Object.assign(PLURAL, { queen: 'Queens', broodback: 'Broodbacks' });
UGROUPS.inf.push('queen'); GROUP_OF.queen = 'inf'; UGROUPS.arm.push('broodback'); GROUP_OF.broodback = 'arm';
UNIT_ORDER.splice(UNIT_ORDER.indexOf('spitter') + 1, 0, 'queen');
UNIT_ORDER.splice(UNIT_ORDER.indexOf('thornback') + 1, 0, 'broodback');
UNIT_PATH.queen = UNIT_PATH.spitter; UNIT_PATH.broodback = UNIT_PATH.thornback;
AI_TWIN.queen = 'heavy'; AI_TWIN.broodback = 'tank';

// The names and texts the player sees follow the new-game default (REWORK.b6h): the Chitin Warden, Behemoth Evolution, the Queen's step
const rw6hText = (o, k, on) => { const d = Object.getOwnPropertyDescriptor(o, k), off = d.get ? d.get() : d.value; Object.defineProperty(o, k, { get: () => REWORK.b6h ? on : (d.get ? d.get() : off), enumerable: true, configurable: true }); };
rw6hText(UDEF.bulwark, 'name', 'Chitin Warden');
rw6hText(UDEF.bulwark, 'desc', 'Armoured chitin guardian that braces when hit, regenerates on its creep and lunges at enemies close by. Bloomhost units near it take much less area damage: bring one wherever shells, flames and blasts land.');
rw6hText(PLURAL, 'bulwark', 'Chitin Wardens');
rw6hText(TREES_BH.factory.B, 'name', 'Behemoth Evolution'); rw6hText(TREES_BH.factory.B, 'short', 'BEHEMOTH');
rw6hText(TREES_BH.factory.B.steps[2], 'short', 'Broodbacks'); rw6hText(TREES_BH.factory.B.steps[2], 'txt', 'Unlocks Broodbacks: lunging beasts that burst into Skitterlings and a Bile Bloom when they die');
rw6hText(TREES_BH.factory.B.steps[2], 'unlock', ['broodback']);
rw6hText(TREES_BH.barracks.B.steps[2], 'short', 'Queens'); rw6hText(TREES_BH.barracks.B.steps[2], 'txt', 'Unlocks Queens: brood mothers whose bile bolts hit air and ground and who birth Mites in a fight');
rw6hText(TREES_BH.barracks.B.steps[2], 'unlock', ['queen']);
{ const B = BDEFS && BDEFS.bloomhost && BDEFS.bloomhost.barracks; if (B && B.tiers) rw6hText(B.tiers, 1, 'Spawns Skitterlings (in broods) and Spitters'); }
rw6hText(UDEF.mite, 'desc', 'Tiny, short-lived biter from the Brood Mound and the Queen. Its bite corrodes like Spitter acid, so everything it touches takes more damage. Fragile; it never captures nodes.');
rw6hText(UDEF.leaper, 'desc', 'Parasite that leaps far over the fight onto Artillery, siege and ranged units, stunning everything where it lands, then latches on and eats its host. Shoot it off; if the host dies with Leapers on it, Skitterlings hatch.');

/* ---- per-game values (rwD's overlay through rwOver6) ---- */
function rw6hUnit(g, t) {
  if (!rwB6h(g)) return null;
  switch (t) {
    case 'mite': return { hp: B6H.mite.hp, dmg: B6H.mite.dmg, cd: B6H.mite.cd, speed: B6H.mite.speed, corrode: (rwB5b(g) ? RW5B_D.spitter(g) : UDEF.spitter).corrode, biteCorr: true };
    case 'leaper': return { leap: Object.assign({}, UDEF.leaper.leap, { range: B6H.leaper.range, cd: B6H.leaper.cd, speed: B6H.leaper.speed }), latch: true, chase: 170 };
    case 'bulwark': return { pounce: true, ward: true };
    case 'ravager': case 'gorebore': case 'dreadthorn': return { pounce: true };
    case 'spitter': return { tier: 1 };
  }
  return null;
}
function rw6hSpawn(g, u) { if (u.type === 'mite') { u.hp = u.maxHp = B6H.mite.hp; } }

/* ---- area damage (the Warden's aura) ---- */
// AREA6H.on is set while a splash or an area effect deals its damage (splashHit, a Brood Tyrant's splash, a Sniper's pierce, a
// Shardstorm's chain jumps); AREA6H_W: weapons whose every hit is an area effect. damage1 reads both for a unit inside a
// Warden's aura (u.wd6 === g.t, set in update6h).
const AREA6H = { on: 0 };
const AREA6H_W = { beam: 1, flame: 1, orbital: 1, meteor: 1, rupture: 1, exile: 1, acidpool: 1, spores: 1, erupt: 1, erupt6: 1, spines: 1, trample: 1, miteacid: 1, bloom6: 1, bileglob: 1, shell: 1, lob: 1, rift: 1, bomb: 1, crush: 1 };
const area6h = w => AREA6H.on > 0 || !!AREA6H_W[w];
function ward6hCut(g, e, dmg) { // the share of an area hit a Warden's aura takes off
  const cut = dmg * B6H.ward.cut, S = sw6h(g, e.side); S.ward += cut; return dmg - cut;
}
const sw6h = (g, s) => g.sides[s].h6 || (g.sides[s].h6 = { ward: 0, pounce: 0, mites: 0, qMites: 0, burst: 0, blooms: 0, tunnel: 0, swallow: 0, erupt: 0, stun: 0, peak: 0 });

/* ---- the tick (before the units move) ---- */
function update6h(g, dt) {
  // one pass over the entities: Wardens, Queens, swallowed units, Bloomhost units (for the auras and the peak count)
  const W = [], Q = [], SW = [], BH = [], cnt = [0, 0];
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.hp <= 0) continue;
    if (e.sw6) { SW.push(e); continue; }
    if (UDEF[e.type].fac !== 'bloomhost') continue;
    BH.push(e); if (e.side === 0 || e.side === 1) cnt[e.side]++;
    if (e.gone) continue;
    if (e.type === 'bulwark') W.push(e); else if (e.type === 'queen') Q.push(e);
  }
  // Warden auras
  if (W.length) for (const e of BH) for (const w of W) if (w.side === e.side && Math.abs(w.u - e.u) <= B6H.ward.r && Math.hypot(w.u - e.u, w.v - e.v) <= B6H.ward.r) { e.wd6 = g.t; break; }
  // Bile Blooms
  if (g.bp6 && g.bp6.length) {
    g.bp6 = g.bp6.filter(p => p.end > g.t);
    for (const p of g.bp6) for (const e of g.ents) {
      if (e.kind !== 'u' || e.hp <= 0 || e.gone || UDEF[e.type].air || Math.abs(e.u - p.u) > B6H.brood.r) continue;
      if (Math.hypot(e.u - p.u, (e.v - p.v) * 0.6) > B6H.brood.r) continue;
      if (e.side === p.side) { if (UDEF[e.type].fac === 'bloomhost') e.bb6 = g.t; }
      else damage(g, e, B6H.brood.dps * dt, 'bloom6', p.side);
    }
  }
  // Swallowed units: digested inside a surfaced Ruinmaw, spat out at the end
  for (const e of SW) {
    const R = ctlEnt(g, e.sw6.r);
    if (!R || R.hp <= 0 || R.dead || R.bur || g.t >= e.sw6.end) { spit6h(g, e, R); continue; }
    damage1(g, e, B6H.ruin.swDps * dt, 'swallow6', R.side, null);
  }
  // Queens: a Mite every queen.every s while an enemy is near, up to queen.own of hers and the side's cap
  let mites = null;
  for (const q of Q) {
    if (g.t < (q.qsT || 0) || g.sides[q.side].hush) continue;
    const near = g.ents.some(e => e.side !== q.side && e.side !== NEUTRAL && e.hp > 0 && !e.gone && Math.abs(e.u - q.u) <= B6H.queen.near && (e.kind === 'u' || bdOf(e).gun) && Math.hypot(e.u - q.u, e.v - q.v) <= B6H.queen.near && visibleTo(g, q.side, e));
    if (!near) continue;
    if (!mites) mites = [miteCount6h(g, 0), miteCount6h(g, 1)];
    const own = g.ents.filter(e => e.kind === 'u' && e.hp > 0 && e.qm === q.id).length;
    if (own >= B6H.queen.own || mites[q.side] >= B6H.mite.cap) continue; // waits (the timer is not reset)
    const a = (q.id * 7 + (q.qn || 0) * 2.39996), du = Math.cos(a) * 12 + q.face * 6, dv = Math.sin(a) * 10;
    const k = spawnMite6h(g, q.side, q.u + du, q.v + dv, 'queen'); k.qm = q.id; k.face = q.face;
    q.qn = (q.qn || 0) + 1; q.qsT = g.t + B6H.queen.every; q.qbT = g.t; mites[q.side]++;
    sw6h(g, q.side).qMites++;
    const w = P(q.u, q.v, 10); g.fx.push({ k: 'qbirth6', side: q.side, u: q.u, x: w.x, y: w.y, x2: P(k.u, k.v, 0).x, y2: P(k.u, k.v, 0).y, t: 0, life: 0.7 });
  }
  if (!rwB3b(g)) updateKnocks(g, dt); // the eruption's knock (batch 3b runs it otherwise)
  for (let s = 0; s < 2; s++) if (cnt[s]) { const T = sw6h(g, s); if (cnt[s] > T.peak) T.peak = cnt[s]; } // the peak of Bloomhost units alive
}
const miteCount6h = (g, s) => { let n = 0; for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.type === 'mite' && e.hp > 0) n++; return n; };
function spawnMite6h(g, s, u, v, src) {
  if (!MAP_2D) v = clamp(v, -LANE_V, LANE_V);
  const k = spawnUnit(g, s, 'mite', clamp(u, 0, L), v);
  Object.assign(k, { temp: g.t + B6H.mite.life, tLife: B6H.mite.life, tSrc: src, noCap: 1 }); k.laneV = clamp(k.v, -LANE_V, LANE_V); arriveOrders(g, k);
  sw6h(g, s).mites++;
  return k;
}
// The Brood Mound with b6h: its rate unchanged; its Mites live mite.life s; at the side's cap the ones owed wait (m.mq)
function mound6h(g, s, m) {
  if (m.mt === undefined) m.mt = g.t + MOUND.every;
  if (g.t >= m.mt) { m.mt = g.t + MOUND.every; m.mq = (m.mq || 0) + MOUND.n[m.tier]; m.mi = 0; }
  if (!m.mq) return;
  let room = Math.min(MOUND.max - g.ents.filter(e => e.kind === 'u' && e.side === s && e.tSrc === 'mite' && e.hp > 0).length, B6H.mite.cap - miteCount6h(g, s));
  const dir = dirOf(s);
  while (m.mq > 0 && room > 0) {
    const i = m.mi || 0, k = spawnMite6h(g, s, m.u + dir * (m.half + 8 + i * 6), m.v + ((i % 3) - 1) * 14, 'mite');
    if (g.log) logAdd(g.log.tot[s].mites || (g.log.tot[s].mites = {}), 'n');
    m.mq--; m.mi = i + 1; room--;
  }
  if (room <= 0 && m.mq > MOUND.n[m.tier]) m.mq = MOUND.n[m.tier]; // never more owed than one spawn's worth
}

/* ---- Pounce ---- */
function pounce6h(g, u, d, st, cs, A) {
  if (!d.pounce || u.pcT > g.t || g.t < (u.pcCd || 0)) return;
  if (st === 'retreat' || st === 'move' || (cs && (cs.run || (cs.go && !cs.chase && !cs.want)))) return; // never on a move order or a retreat
  if (u.bur || u.gone || u.dzT > g.t || u.pinT > g.t || u.snT > g.t || u.crg) return;
  if (d.trample && !(u.crCd > g.t)) return; // a Dreadthorn only while its charge is on cooldown
  if (A.best) return; // already in contact with something
  const T = cs && cs.chase && cs.chase.kind === 'u' ? cs.chase : A.prey;
  if (!T || T.kind !== 'u' || (UDEF[T.type].air && !(T.lnd >= 2))) return;
  const k = effDist(u, T); if (k > B6H.pounce.r || k <= d.range) return;
  if (st === 'hold' && u.holdU !== undefined && Math.hypot(T.u - u.holdU, T.v - u.holdV) > MECH7C.holdR + d.range) return;
  u.pcT = g.t + B6H.pounce.dur; u.pcCd = g.t + B6H.pounce.cd; u.pcU = u.u; u.pcV = u.v;
  sw6h(g, u.side).pounce++;
  const w = P(u.u, u.v, 4); g.fx.push({ k: 'pounce6', side: u.side, u: u.u, x: w.x, y: w.y, face: T.u >= u.u ? 1 : -1, t: 0, life: 0.45 });
}

/* ---- the Queen's Mites ---- */
function qMite6h(g, u, d, A, dt, sp) {
  const Q = ctlEnt(g, u.qm);
  if (!Q || Q.hp <= 0 || Q.dead || Q.type !== 'queen') { u.qm = 0; return false; }
  const side = g.sides[u.side]; if (side.direct && u.po && u.po.o !== 'hold') return false; // a player's own order for it comes first
  const R = B6H.queen.leash, dq = Math.hypot(Q.u - u.u, Q.v - u.v);
  if (dq > R) { u.tgt = 0; moveToward(u, d, Q.u, Q.v, dt, sp); return true; }
  let T = Q.tgt ? ctlEnt(g, Q.tgt) : null;
  if (T && (T.hp <= 0 || T.gone || T.side === u.side || (T.kind === 'u' && UDEF[T.type].air && !(T.lnd >= 2)) || Math.hypot(T.u - Q.u, T.v - Q.v) > R)) T = null;
  if (!T) { const p = A.best || A.prey; if (p && Math.hypot(p.u - Q.u, p.v - Q.v) <= R) T = p; }
  if (T) { if (effDist(u, T) <= d.range) return false; u.tgt = 0; moveToward(u, d, T.u, T.v, dt, sp); return true; }
  if (A.best) return false;
  const a = u.id * 2.39996, gu = clamp(Q.u + Math.cos(a) * 34, 0, L), gv = Q.v + Math.sin(a) * 34 / DY; // a ring around her, clear of her body
  u.tgt = 0; if (!moveToward(u, d, gu, gv, dt, sp)) u.face = Q.face;
  return true;
}

/* ---- the Leaper ---- */
const SIEGE6H = { artillery: 1, bilelobber: 1, riftmortar: 1, severance: 1, worldbreaker: 1 };
function latchTier6h(g, H) { // 0: Artillery and deployed siege, 1: ranged, 2: big, 3: anything else on the ground
  const d = rwD(g, H.type);
  if (SIEGE6H[H.type] || H.dep === 2 || H.siege === 2) return 0;
  if (d.weapon && !d.melee && (d.range || 0) >= 100) return 1;
  return latchBig(H) ? 2 : 3;
}
function stun6h(g, u) { // a Leaper landing: enemy ground units within stunR stunned (buildings unaffected)
  let n = 0;
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.side === u.side || e.side === NEUTRAL || e.hp <= 0 || e.gone || UDEF[e.type].air || e.lt || e.ltH) continue;
    if (Math.hypot(e.u - u.u, (e.v - u.v) * DV_W) > B6H.leaper.stunR) continue;
    e.dzT = Math.max(e.dzT || 0, g.t + B6H.leaper.stun); e.st6 = g.t + B6H.leaper.stun; n++;
  }
  sw6h(g, u.side).stun += n;
  const w = P(u.u, u.v, 0); g.fx.push({ k: 'stun6', side: u.side, u: u.u, x: w.x, y: w.y, t: 0, life: 0.6, r: B6H.leaper.stunR });
}
const latchDps6h = (g, H) => latchBig(H) ? latchDps(g) : B6H.leaper.small;

/* ---- the Broodback ---- */
function brood6hDie(g, e) {
  const s = e.side, side = g.sides[s], max = (UDEF.skitterling.max || 60);
  let room = max - g.ents.filter(x => x.kind === 'u' && x.side === s && x.type === 'skitterling' && x.hp > 0 && !x.temp).length, n = 0;
  for (let i = 0; i < B6H.brood.n && room > 0; i++, room--) {
    const a = i * 2.0944 + e.id, k = spawnUnit(g, s, 'skitterling', clamp(e.u + Math.cos(a) * 12, 0, L), e.v + Math.sin(a) * 9);
    if (!MAP_2D) k.v = clamp(k.v, -LANE_V, LANE_V);
    k.laneV = clamp(k.v, -LANE_V, LANE_V); if (e.lane != null) k.lane = e.lane;
    if (side.direct) { if (e.po && e.po.o !== 'hold') k.po = Object.assign({}, e.po); else ctlHere(g, k); }
    else { k.holdU = e.holdU !== undefined ? k.u : undefined; k.holdV = e.holdU !== undefined ? k.v : undefined; k.rmF = e.rmF; }
    n++;
  }
  (g.bp6 || (g.bp6 = [])).push({ side: s, u: e.u, v: e.v, end: g.t + B6H.brood.life, t0: g.t });
  const S = sw6h(g, s); S.burst += n; S.blooms++;
  const w = P(e.u, e.v, 6); g.fx.push({ k: 'brood6', side: s, u: e.u, x: w.x, y: w.y, t: 0, life: 0.8, n });
  ev(g, { type: 'brood6', u: e.u, v: e.v, side: s, n });
}

/* ---- the Ruinmaw ---- */
function erupt6h(g, R) { // surfacing: enemy ground units within eR take eDmg and are knocked aside
  const C = B6H.ruin; let n = 0;
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.side === R.side || e.side === NEUTRAL || e.hp <= 0 || e.gone || UDEF[e.type].air) continue;
    const du = e.u - R.u, dv = e.v - R.v, dd = Math.hypot(du, dv * DV_W); if (dd > C.eR) continue;
    damage(g, e, C.eDmg * (sideBuff(g, R.side) ? NANO.dmg : 1), 'erupt6', R.side);
    n++;
    if (e.hp > 0 && !e.lt && !e.gone) { const l = Math.hypot(du, dv) || 1, nu = dd ? du / l : (e.id % 2 ? 1 : -1), nv = dd ? dv / l : 0; (g.kn || (g.kn = [])).push({ id: e.id, du: nu, dv: nv, left: C.knock }); }
  }
  R.dvCd = g.t + C.dive; sw6h(g, R.side).erupt++;
  const w = P(R.u, R.v, 0); g.fx.push({ k: 'erupt6', side: R.side, u: R.u, x: w.x, y: w.y, t: 0, life: 0.9, r: C.eR, n });
  g.shake = Math.max(g.shake || 0, 3);
}
function swallow6h(g, R) { // surfaced: one adjacent enemy ground unit (never a huge one) every swCd s
  if (g.t < (R.swCd || 0) || R.swV && ctlEnt(g, R.swV) && ctlEnt(g, R.swV).sw6) return;
  let T = null, bd = 1e9;
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.side === R.side || e.side === NEUTRAL || e.hp <= 0 || e.gone || e.lt || e.ltH || e.leaping || UDEF[e.type].air || bodyClass6h(e.type) === 'huge' || !visibleTo(g, R.side, e)) continue;
    const k = effDist(R, e); if (k <= RUIN.biteR + 8 && (k < bd || (k === bd && e.id < T.id))) { bd = k; T = e; }
  }
  if (!T) return;
  R.swCd = g.t + B6H.ruin.swCd; R.swV = T.id; R.recoil = 1;
  T.sw6 = { r: R.id, end: g.t + B6H.ruin.swDur }; T.gone = 4; T.moving = false; T.tgt = 0; T.u = R.u; T.v = R.v;
  sw6h(g, R.side).swallow++;
  const w = P(R.u, R.v, 8); g.fx.push({ k: 'swallow6', side: R.side, u: R.u, x: w.x, y: w.y, t: 0, life: 0.6 });
  ev(g, { type: 'swallow6', u: R.u, side: R.side, prey: T.type });
}
function spit6h(g, e, R) { // out it comes (alive), in front of the Ruinmaw's mouth (or where it stood)
  e.sw6 = undefined; e.gone = 0;
  if (R) { const [u, v] = ruinMouth(R, e.id); e.u = u; e.v = v; if (R.swV === e.id) R.swV = 0; }
  if (MAP_LANED && !UDEF[e.type].air) e.lane = laneAt(e.u, e.v);
  e.nav = undefined;
  const w = P(e.u, e.v, 4); g.fx.push({ k: 'spit6', side: R ? R.side : 1 - e.side, u: e.u, x: w.x, y: w.y, t: 0, life: 0.5 });
}
const tunnelT6h = (u, v, R) => Math.max(B6H.ruin.min, Math.hypot(R.u - u, R.v - v) / B6H.ruin.speed);
function burrow6h(g, e, R) { // a unit goes down where it stands (on its creep) and travels to the Ruinmaw
  e.tn = { r: R.id, ph: 1, at: g.t + tunnelT6h(e.u, e.v, R), eu: e.u, ev: e.v, t0: g.t };
  e.gone = 3; e.rmF = undefined; e.moving = false; e.tgt = 0; e.holdU = undefined; e.holdV = undefined;
  sw6h(g, e.side).tunnel++;
  (g.tn6 || (g.tn6 = [])).push({ side: e.side, u0: e.u, v0: e.v, u1: R.u, v1: R.v, t0: g.t, end: e.tn.at });
  if (g.tn6.length > 40) g.tn6.shift();
  const w = P(e.u, e.v, 0); g.fx.push({ k: 'emerge', side: e.side, u: e.u, x: w.x, y: w.y, t: 0, life: 0.45, inn: 1 });
}
function resurface6h(g, e) { // the Ruinmaw dove or died with it inside: up where it went down
  const T = e.tn; e.tn = undefined; e.gone = 0;
  if (T && T.eu != null) { e.u = T.eu; e.v = T.ev; }
  tunnelOut(g, e, e.u, e.v);
  if (g.sides[e.side].direct && e.po && e.po.o === 'tunnel') ctlHere(g, e);
  const w = P(e.u, e.v, 0); g.fx.push({ k: 'emerge', side: e.side, u: e.u, x: w.x, y: w.y, t: 0, life: 0.6 });
}
// The Tunnel order with b6h: the selection's Bloomhost ground units on their own creep burrow where they stand
function ctlTunnel6h(g, s, us) {
  const R = tunnelGate(g, s); if (!R) return { ok: false, msg: 'No Ruinmaw is surfaced' };
  const ok = us.filter(tunnelOk); if (!ok.length) return { ok: false, msg: 'Only Bloomhost ground units can use the tunnel' };
  const go = ok.filter(e => onCreep(g, s, e.u, e.v) && !e.tn && !e.gone), off = ok.length - go.length;
  if (!go.length) return { ok: false, msg: 'Units must stand on your creep to tunnel' };
  for (const e of go) { e.po = { o: 'tunnel', r: R.id }; burrow6h(g, e, R); }
  lg(g, s, 'O', 'sel', go.length, 'tunnel');
  return { ok: true, n: go.length, msg: `${go.length} unit${go.length === 1 ? '' : 's'}: into the tunnel${off ? ` (${off} not on creep stayed)` : ''}` };
}
// A production building's rally on a surfaced Ruinmaw (b.rm6): set with on, cleared without
function setRally6h(g, s, bid, rid) {
  const b = ctlEnt(g, bid);
  if (!rwB6h(g) || !b || b.kind !== 'b' || b.side !== s || !['barracks', 'factory'].includes(b.type) || facOf(b.fac) !== 'bloomhost') return { ok: false, msg: 'Only a Larva Pit or Evolution Chamber can rally to a Ruinmaw' };
  if (!rid) { b.rm6 = 0; return { ok: true, msg: `${bdOf(b).name}: rally back to base` }; }
  const R = ctlEnt(g, rid); if (!R || R.type !== 'ruinmaw' || R.side !== s || R.hp <= 0) return { ok: false, msg: 'No such Ruinmaw' };
  b.rm6 = R.id; return { ok: true, msg: `${bdOf(b).name}: new units tunnel to the Ruinmaw` };
}
function rally6h(g, b, nu) { // a unit just trained at b
  const R = ctlEnt(g, b.rm6);
  if (!R || R.hp <= 0 || R.dead || R.type !== 'ruinmaw') { b.rm6 = 0; return; }
  if (!ruinGate(R) || !tunnelOk(nu)) return; // down (moving): it comes out at the building as usual
  if (g.sides[nu.side].direct) nu.po = { o: 'tunnel', r: R.id };
  burrow6h(g, nu, R); sw6h(g, nu.side).rallyU = (sw6h(g, nu.side).rallyU || 0) + 1;
}

/* ---- unit bodies (b6hbody) and the loose swarm (b6h) ---- */
// Body classes from each unit's drawn footprint (docs/FACTION_REWORK.md "Batch 6h", the table measured by
// audit/sim/b6h-bodies.js): the radius in screen px (u, and v × DY), and a mass for pushes (a big unit holds its line).
const BODY6H_R = { small: 7, medium: 10, large: 14, huge: 20 }, BODY6H_M = { small: 1, medium: 2, large: 4, huge: 9 };
const BODY6H = {
  rifle: 'small', sniper: 'small', shardling: 'small', skitterling: 'small', lancer: 'small', mite: 'small', queen: 'small',
  heavy: 'medium', leaper: 'medium', riftstalker: 'medium', parallax: 'medium', marksman: 'medium', spitter: 'medium', severance: 'medium', bilecaster: 'medium', gorebore: 'medium', flame: 'medium', bastion: 'medium', riftmortar: 'medium', bilelobber: 'medium',
  gravemantle: 'large', tank: 'large', eventide: 'large', hydra: 'large', worldbreaker: 'large', artillery: 'large', ravager: 'large', bulwark: 'large', broodback: 'large', thornback: 'large',
  titan: 'huge', dreadthorn: 'huge', ruinmaw: 'huge',
};
const BODY6H_AIR = { small: 7, medium: 10, large: 15, huge: 20 }, BODY6H_A = { aircraft: 'medium', interceptor: 'small', leviathan: 'huge', medic: 'medium', drone: 'small', razorwing: 'small', needlewing: 'small', cloudwing: 'medium', broodtyrant: 'large', worldrender: 'huge', wraithwing: 'small', prismwing: 'small', shardstorm: 'medium', voidcarrier: 'large', sovereign: 'huge' };
const body6hR = t => UDEF[t] && UDEF[t].air ? BODY6H_AIR[bodyClass6h(t)] : BODY6H_R[bodyClass6h(t)] + (LOOSE6H[t] ? B6H.loose / 2 : 0); // the spacing a formation gives it (Test Range placement, ctlPack)
const bodyClass6h = t => UDEF[t] && UDEF[t].air ? BODY6H_A[t] || 'medium' : BODY6H[t] || 'medium';
// A unit on its way to a spot of its own (a move, a retreat) that bodies keep from it: within its body's reach of the spot (BODY6.near
// × its radius) and no closer for BODY6.stall s, it has arrived (it holds where it stands)
function bodyNear6h(g, u, po) {
  const d = Math.hypot(po.u - u.u, po.v - u.v);
  if (!u.bn6 || u.bn6.u !== po.u || u.bn6.v !== po.v || d < u.bn6.d - 2) { u.bn6 = { u: po.u, v: po.v, d, t: g.t }; return false; }
  return d <= CTRL.arrive + BODY6.near * body6hR(u.type) && g.t - u.bn6.t >= BODY6.stall;
}
const BODY6 = { near: 3, stall: 1.5, yieldK: 0.5, cell: 40, allow: 2, k: 0.5, kAir: 0.15, max: 70, hold: 3 };
const B6GRID = new Map();
function body6h(g, dt) {
  const on = rwB6hbody(g), loose = rwB6h(g); if (!on && !loose) return;
  const C = BODY6.cell, G = B6GRID; G.clear();
  const list = [];
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.hp <= 0 || e.gone || e.leaping || e.lt || e.ltH || e.crg || e.side === NEUTRAL) continue;
    const air = !!UDEF[e.type].air && !(e.lnd >= 2);
    if (!on && (air || !LOOSE6H[e.type])) continue;
    const cl = bodyClass6h(e.type), atk = !!(e.tgt && !e.moving);
    let r = on ? (air ? BODY6H_AIR[cl] : BODY6H_R[cl]) : 4;
    if (loose && !air && LOOSE6H[e.type] && !atk) r += B6H.loose / 2;
    const m = (air ? 1 : BODY6H_M[cl]) * (atk ? BODY6.hold : e.moving ? 1 : BODY6.yieldK); // fighting units hold their line; standing ones make way for units on the move
    const it = { e, air, r, m, cm: air ? 1 : BODY6H_M[cl], pu: 0, pv: 0 }, gx = Math.floor(e.u / C), gy = Math.floor(e.v * DY / C) + (air ? 100000 : 0), key = gx * 400003 + gy;
    it.gx = gx; it.gy = gy;
    let cell = G.get(key); if (!cell) G.set(key, cell = []); cell.push(it); list.push(it);
  }
  if (list.length < 2) return;
  for (const a of list) {
    for (let dx = 0; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy < 0) continue;
      const cell = G.get((a.gx + dx) * 400003 + a.gy + dy); if (!cell) continue;
      for (const b of cell) {
        if (b === a || (dx === 0 && dy === 0 && b.e.id <= a.e.id && cell.indexOf(b) <= cell.indexOf(a))) continue;
        if (a.air !== b.air) continue;
        if (!on && a.e.side !== b.e.side) continue; // the loose swarm alone spaces only its own side
        const A = a.e, B = b.e;
        if ((A.tgt === B.id && UDEF[A.type].melee) || (B.tgt === A.id && UDEF[B.type].melee)) continue;
        if (A.qm === B.id || B.qm === A.id) continue; // a Queen and her own Mites swarm through each other // a melee unit stops at its target's edge: no push between them
        let min = a.r + b.r - BODY6.allow;
        if (A.side !== B.side) { const ma = UDEF[A.type].melee ? rwD(g, A.type).range * 0.8 : 1e9, mb = UDEF[B.type].melee ? rwD(g, B.type).range * 0.8 : 1e9; min = Math.min(min, ma, mb); } // a melee unit can always close to its reach on an enemy
        const du = B.u - A.u, dy2 = (B.v - A.v) * DY, d = Math.hypot(du, dy2);
        if (d >= min) continue;
        let nx, ny;
        if (d > 1e-6) { nx = du / d; ny = dy2 / d; } else { const an = (A.id * 7 + B.id * 13) % 628 / 100; nx = Math.cos(an); ny = Math.sin(an); }
        const o = (min - d) * (a.air ? BODY6.kAir : BODY6.k), wa = b.m / (a.m + b.m), wb = a.m / (a.m + b.m);
        a.pu -= nx * o * wa; a.pv -= ny * o * wa; b.pu += nx * o * wb; b.pv += ny * o * wb;
        if (B.moving && b.cm >= a.cm) a.pm = 1; if (A.moving && a.cm >= b.cm) b.pm = 1; // pushed by a unit on the move (a standing one makes way for it)
      }
    }
  }
  // Each list built the same way in every tick of every copy of a match (g.ents' order, b6side's seeded shuffle), so this stays deterministic
  const cap = BODY6.max * dt;
  for (const it of list) {
    if (!it.pu && !it.pv) continue;
    let pu = it.pu, pv = it.pv; const l = Math.hypot(pu, pv); if (l > cap) { pu *= cap / l; pv *= cap / l; }
    const e = it.e, nu = clamp(e.u + pu, 0, L); let nv = e.v + pv / DY;
    if (it.air) { e.u = nu; e.v = nv; continue; }
    if (MAP_2D) { const H = MAP.size.h / 2 - 6; nv = clamp(nv, -H, H); if (NAV.on && navShut(nu, nv)) { if (!navShut(nu, e.v)) e.u = nu; else if (!navShut(e.u, nv)) e.v = nv; continue; } }
    else nv = clamp(nv, -LANE_V, LANE_V);
    if (g.rdg && g.rdg.length && g.rdg.some(R => R.side !== e.side && R.t1 > g.t && rdgCross(R, e.u, e.v, nu, nv, 2))) continue; // never pushed through an enemy Worldbreaker ridge
    if (it.pm && !e.moving && !e.tgt && e.holdU !== undefined) { e.holdU += nu - e.u; e.holdV += nv - e.v; } // a standing unit pushed aside by one on the move makes way: its spot moves with it (it doesn't shove back)
    e.u = nu; e.v = nv;
  }
}

/* ---- the Bloomhost AI (b6h): every personality on every difficulty ----
   Openers (side.op6h, rolled once per match from the AI's own stream, by personality, OPEN6H): 'swarm' (broods first), 'spit'
   (Spitters first) or 'mixed'; for the first OPEN6H.until s the scores lean that way. Queens behind the front, pulling back when
   focused; Chitin Wardens wanted whenever the enemy fields area damage (about one per WARD6H.per supply of the army); Broodbacks
   lead a push (the swarm waits behind the frontmost); Leapers dive the backline (latchTier6h: siege and ranged first); the
   Ruinmaw surfaces behind the enemy line, at enemy economy or beside an enemy-held node, tunnels the army through and takes the
   production rally (aiRuin6h). */
const OPEN6H = { until: 300, w: { boomer: [0.45, 0.25, 0.3], aggressor: [0.45, 0.25, 0.3], economist: [0.3, 0.35, 0.35], turtle: [0.2, 0.5, 0.3], def: [0.34, 0.33, 0.33] }, kinds: ['swarm', 'spit', 'mixed'] };
const WARD6H = { per: 12 };
const RW6H_TASTE = { queen: { boomer: 0.9, aggressor: 0.9, economist: 1.1, turtle: 1.2, trickster: 1.1 }, broodback: { boomer: 1.2, aggressor: 1.2, economist: 1.0, turtle: 0.9, trickster: 1.0 } };
function aiOpen6h(g, s) {
  const side = g.sides[s]; if (side.op6h) return side.op6h;
  const k = side.persona && side.persona.kind, W = OPEN6H.w[k] || OPEN6H.w.def; let r = simRnd() * (W[0] + W[1] + W[2]), i = 0;
  while (i < 2 && r >= W[i]) { r -= W[i]; i++; }
  side.op6h = OPEN6H.kinds[i]; lg(g, s, 'G', 'open6h', i); sw6h(g, s).open = side.op6h;
  return side.op6h;
}
function aiScores6h(g, s, sc, c) {
  if (facOf(g.sides[s].faction) !== 'bloomhost') return;
  const { comp, theirs, mine } = c, air = aiAirShare(theirs), spl = aiSplashShare(theirs);
  const nG = mine.filter(u => isSwarmG(UDEF[u.type]) && !u.temp).length, nQ = mine.filter(u => u.type === 'queen').length, nW = mine.filter(u => u.type === 'bulwark').length;
  const sup = popUsed(g, s), wantW = Math.max(1, Math.round(sup / WARD6H.per));
  sc.queen = 1.1 + comp.light * 0.6 + air * 1.2 + comp.heavy * 0.3 - (nQ >= Math.max(1, nG / 8) ? 0.7 : 0);
  sc.broodback = 1.2 + comp.light * 0.8 + comp.heavy * 0.5 + spl * 0.4 - comp.air * 0.8;
  if (sc.bulwark !== undefined && spl > 0) sc.bulwark = Math.max(sc.bulwark, nW < wantW ? 1.6 + spl * 1.5 : 0.9);
  if (sc.leaper !== undefined) sc.leaper += aiRangedShare(theirs) * 0.5 + aiFarShare(theirs) * 0.8;
  if (rwB6hnode(g) && fortGuns6h(g, s) >= NODE6.fort) for (const [t, k] of [['gorebore', 0.6], ['ruinmaw', 0.4], ['bilecaster', 0.3], ['broodback', 0.2]]) if (sc[t] !== undefined) sc[t] += k; // b6hnode: fortified enemy nodes call for building-breakers
  if (g.t < OPEN6H.until) {
    const op = aiOpen6h(g, s);
    if (op === 'spit') { if (sc.spitter !== undefined) sc.spitter *= 1.8; if (sc.skitterling !== undefined) sc.skitterling *= 0.7; }
    else if (op === 'swarm') { if (sc.skitterling !== undefined) sc.skitterling *= 1.4; if (sc.spitter !== undefined) sc.spitter *= 0.6; }
    else { if (sc.spitter !== undefined) sc.spitter *= 1.25; }
  }
}
const QUEEN6H = { focus: 0.2, win: 3, back: 3, behind: 70 };
function aiRework6h(g, s, mine) {
  const side = g.sides[s], dir = dirOf(s);
  if (facOf(side.faction) !== 'bloomhost') return;
  // Queens: behind the swarm on the attack; focused (QUEEN6H.focus of her health lost in QUEEN6H.win s): she pulls back
  for (const q of mine) if (q.type === 'queen') {
    const H = q.h6h || (q.h6h = []); H.push([g.t, q.hp]); while (H.length && g.t - H[0][0] > QUEEN6H.win) H.shift();
    if (H.length && H[0][1] - q.hp >= q.maxHp * QUEEN6H.focus && !(q.aiBack > g.t)) { q.aiBack = g.t + QUEEN6H.back; sw6h(g, s).qBack = (sw6h(g, s).qBack || 0) + 1; }
  }
  if (side.stance === 'attack') {
    const grp = mine.filter(u => isSwarmG(UDEF[u.type]) && !u.gone && !u.temp && UDEF[u.type].weapon && u.id !== side.scoutId && !capBusy(side, u.id) && !u.tn && u.type !== 'ruinmaw');
    const bb = grp.filter(u => u.type === 'broodback');
    if (bb.length && grp.length >= 4) { // Broodbacks lead: the rest of the swarm waits behind the frontmost (within 400 of it)
      const lead = bb.reduce((a, u) => dir * u.u > dir * a.u ? u : a, bb[0]);
      for (const u of grp) if (u.type !== 'broodback' && Math.abs(u.u - lead.u) < 400 && dir * (u.u - lead.u) > 20 && !u.qm) u.aiWait = g.t + 1.5;
    }
    const front = grp.filter(u => UDEF[u.type].melee); if (front.length) {
      const xs = front.map(u => dir * u.u).sort((a, b) => a - b), med = xs[xs.length >> 1];
      for (const q of grp) if (q.type === 'queen' && dir * q.u > med - QUEEN6H.behind) q.aiWait = g.t + 1.5;
    }
  }
  aiRuin6h(g, s, mine);
}
// The Ruinmaw with b6h: production rallies to it while it holds its spot (b.rm6); aiRework2b keeps choosing the spot and sending
// the army through (units on creep burrow where they stand)
function aiRuin6h(g, s, mine) {
  const R = mine.find(u => u.type === 'ruinmaw' && u.rmGo && u.rmAt && !u.rmHome && ruinGate(u));
  for (const b of g.ents) if (b.kind === 'b' && b.side === s && b.hp > 0 && (b.type === 'barracks' || b.type === 'factory')) {
    const want = R ? R.id : 0;
    if ((b.rm6 || 0) !== want) { b.rm6 = want; if (want) sw6h(g, s).rally = (sw6h(g, s).rally || 0) + 1; }
  }
}
// Where an AI's Ruinmaw surfaces with b6h: beside the enemy's economy (as before) or beside an enemy-held node, the one its guns
// cover least; null to keep batch 2b's rule (ruinSpot)
function ruinSpot6h(g, s, R) {
  const opp = 1 - s, f = g.fog[s];
  const guns = Object.values(f.ghosts).filter(gh => gh.side === opp && (gh.type === 'turret' || gh.type === 'hq' || gh.type === 'bunker'));
  let best = null, bs = 1e9;
  g.nodes.forEach((n, i) => {
    if (n.owner !== opp || n.type === 'relic') return;
    const cover = guns.filter(x => Math.hypot(x.u - n.u, x.v - n.v) < 320).length, sc = cover * 400 + Math.hypot(n.u - R.u, n.v - R.v) * 0.5 - 150;
    if (sc < bs) { bs = sc; best = { u: n.u, v: n.v, half: 30, id: -1 - i }; }
  });
  if (!best) return null;
  let u = best.u - dirOf(s) * 60, v = best.v; if (!MAP_2D) v = clamp(v, -LANE_V + 8, LANE_V - 8);
  if (NAV.on && navShut(u, v)) [u, v] = navOpen(u, v);
  return { spot: [clamp(u, 0, L), v], score: bs };
}

/* ---- b6hnode: the Bloomhost AI's node contest (Normal and Hard) ----
   Diagnosis (audit/logs-p1/b6h/nodes-diag/, node.md: the forced-turret scenario at v2.97's rules, 36 matches): 6g's assault
   (aiNode6g) almost never went (the force it could send was a median 0.29 of the 1.4 × defence it asked for, with every turret
   valued at 4 × its cost × tier: about 1 % of its checks launched one), and when it went, a threat seen near home or an all-in
   attack called it off before it arrived; meanwhile the capture groups and raids (3-4 units) kept walking into the guns one
   group at a time and died (about 5 % took the node). The fix (behaviour only, no unit value):
   - no capture group or raid at a node an enemy gun it knows of covers (nodeGuarded6h): those are the assault's;
   - the assault weighs fighting power as the AI does elsewhere (aiPower: damage per second × health; the guns' own dps and
     health, a forward pad it can't see as the enemy's turret, the enemy units near the node), its own damage counted at its
     weapons' building rate for the guns' share (myPow6h); it sends a strike group, building-breakers first, just big enough to
     out-power the defence NODE6.edge times (a group too small to win never goes; the rest of the army keeps playing);
   - with NODE6.fort or more enemy turrets known at enemy-held nodes, its unit scores lean to building-breakers (Gorebores,
     Ruinmaws, Bilecasters, Broodbacks);
   - it is called off only by danger inside its own base (enemies within NODE6.home of its HQ), heavy losses (NODE6.minHp), a
     time limit, or a win; a threat near home, or an all-in attack starting, no longer recalls it half way;
   - its Ruinmaw, if it has one, surfaces beside the node (erupting into the defence) and the army on its creep tunnels there,
     production rallied to it; Wardens, Broodbacks and Queens go with the army (the whole army goes). */
const NODE6 = { edge: 1.5, home: 430, minHp: 0.35, dur: 150, every: 5, maxN: 40, minArmy: 450, gather: 20, fort: 2, whole: true, groups: true }; // whole: the whole available army goes (else a strike group); groups: capture groups and raids may still go at guarded nodes
function nodeGuarded6h(g, s, n) {
  const f = g.fog[s];
  for (const b of g.ents) {
    if (b.side !== 1 - s || b.kind !== 'b' || b.type === 'hq') continue;
    const gn = gunOf6g(b); if (!gn || (!visibleTo(g, s, b) && !(f.ghosts && f.ghosts[b.id]))) continue;
    if (Math.hypot(b.u - n.u, b.v - n.v) - b.half <= gn.range + (n.r || NODE_R)) return true;
  }
  return false;
}
// Its own power against a defence: each unit's damage per second counted at its weapon's rate against buildings for the guns'
// share of the defence's health (Skitterlings barely scratch a Turret), at full rate for the rest
function myPow6h(g, us, gunShare) {
  let dps = 0, hp = 0;
  for (const x of us) { const d = rwD(g, x.type); if (!d || d.support) continue; const w = gunShare * (d.weapon && DMG[d.weapon] ? DMG[d.weapon].building || 0 : 0) + (1 - gunShare); dps += (d.dmg || 0) / (d.cd || 1) * w; hp += x.hp + (x.shp || 0); }
  return dps * hp;
}
const fortGuns6h = (g, s) => Object.values(g.fog[s].ghosts).filter(gh => gh.side === 1 - s && gh.type === 'turret' && g.nodes.some(n => n.owner === 1 - s && Math.hypot(gh.u - n.u, gh.v - n.v) < B6G4.gunR)).length; // enemy turrets it knows of at nodes the enemy holds
const padsAt6h = (g, s, i) => g.ents.filter(b => b.kind === 'b' && b.side === 1 - s && b.hp > 0 && b.slot >= FWD_SLOT && FWD_PADS[b.slot - FWD_SLOT] && FWD_PADS[b.slot - FWD_SLOT].node === i);
function defPow6h(g, s, n, theirs) { // the defence's fighting power at node n, as side s knows it
  const df = defense6g(g, s, n, theirs), guns = df.guns.map(b => { const gn = gunOf6g(b); return { dps: gn.dmg / gn.cd * (gn.split || 1) * powMul(g), hp: b.hp + (b.shp || 0) }; });
  const td = BD(g.sides[1 - s].faction, 'turret');
  for (let i = 0; i < df.guess; i++) if (td && td.gun) guns.push({ dps: td.gun[1].dmg / td.gun[1].cd * powMul(g), hp: td.hp });
  const foes = theirs.filter(e => e.fresh && e.v !== undefined && Math.hypot(e.u - n.u, e.v - n.v) < B6G4.foeR);
  const gh = guns.reduce((a, b) => a + b.hp, 0), fh = foes.reduce((a, e) => a + (UDEF[e.type].hp + (UDEF[e.type].shp || 0)) * (e.w ?? 1), 0);
  return { pow: aiPower(foes, guns), df, gunShare: gh + fh > 0 ? gh / (gh + fh) : 0 };
}
function aiNode6h(g, s, D, mine, theirs, N) {
  const side = g.sides[s], dir = dirOf(s);
  if (facOf(side.faction) !== 'bloomhost' || D.label === 'Easy') return;
  const danger = theirs.some(e => e.fresh && Math.abs(e.u - hqU(s)) < NODE6.home && (e.v === undefined || !MAP_2D || Math.hypot(e.u - hqU(s), e.v - MAP.bases[s].hq[1]) < NODE6.home));
  if (g.t - N.t < NODE6.every || danger || armyValue(mine) < NODE6.minArmy) return;
  N.t = g.t;
  const busy = new Set([side.scoutId, ...(side.raid ? side.raid.ids : []), ...(side.relicG ? side.relicG.ids : [])]);
  const pool = mine.filter(u => !busy.has(u.id) && !UDEF[u.type].air && !UDEF[u.type].support && !u.temp && UDEF[u.type].weapon && u.hp >= u.maxHp * 0.5 && !u.tn)
    .sort((a, b) => bldMul6g(g, b.type) - bldMul6g(g, a.type) || armyValue([b]) - armyValue([a]) || a.id - b.id).slice(0, NODE6.maxN);
  const cand = g.nodes.map((n, i) => i).filter(i => g.nodes[i].owner === 1 - s && g.nodes[i].type !== 'relic')
    .sort((a, b) => ((g.t - (N.lost[b] ?? -1e9) < B6G4.lost) - (g.t - (N.lost[a] ?? -1e9) < B6G4.lost)) || Math.abs(g.nodes[a].u - hqU(s)) - Math.abs(g.nodes[b].u - hqU(s)) || a - b);
  for (const i of cand) {
    const n = g.nodes[i], { pow, df, gunShare } = defPow6h(g, s, n, theirs), armed = df.guns.length + df.guess > 0, myPow = myPow6h(g, pool, gunShare);
    if (!armed && !(MAP_LANED && i !== 1 && g.t - (N.lost[i] ?? -1e9) < B6G4.lost)) continue; // unguarded: the capture groups and raids (v2.96's rules)
    // a strike group, not the whole army: building-breakers first (the pool's order) until it out-powers the defence by NODE6.edge
    const grp = NODE6.whole ? pool : []; let gp = NODE6.whole ? myPow : 0; if (!NODE6.whole) for (const u of pool) { grp.push(u); gp = myPow6h(g, grp, gunShare); if (gp >= pow * NODE6.edge && grp.length >= B6G4.minN) break; }
    const go = grp.length >= B6G4.minN && gp >= pow * NODE6.edge;
    if (NODE6H.log) NODE6H.log(g, { k: 'eval', s, node: i, guns: df.guns.length, guess: df.guess, def: Math.round(Math.sqrt(pow)), need: Math.round(Math.sqrt(pow * NODE6.edge)), have: Math.round(Math.sqrt(gp)), poolV: Math.round(armyValue(pool)), n: grp.length, go });
    if (!go) continue;
    const ids = grp.map(u => u.id);
    let su = clamp(n.u - dir * (df.reach + B6G4.gap), 0, L), sv = n.v;
    if (MAP_2D && NAV.on && navShut(su, sv)) [su, sv] = navOpen(su, sv);
    side.capN = { node: i, ids, u: armed ? su : n.u, v: armed ? sv : n.v, end: g.t + NODE6.dur, ph: armed ? 'gather' : 'go', t0: g.t, h6: 1, hp0: grp.reduce((a, u) => a + u.hp, 0), need: Math.round(Math.sqrt(pow)) };
    const R = mine.find(u => u.type === 'ruinmaw' && !u.rmHome); // its Ruinmaw surfaces beside the node (aiRework2b sends the army on its creep through, aiRuin6h rallies production there)
    if (R && rwB6h(g)) { let ru = clamp(n.u - dir * 40, 0, L), rv = n.v + (R.id % 2 ? 30 : -30); if (MAP_2D && NAV.on && navShut(ru, rv)) [ru, rv] = navOpen(ru, rv); R.rmGo = [ru, rv]; R.rmSince = g.t; R.rmAt = 0; }
    lg(g, s, 'G', 'node6h', i);
    if (NODE6H.log) NODE6H.log(g, { k: 'go', s, node: i, ids: ids.slice(), types: grp.map(u => u.type), v: Math.round(armyValue(grp)), need: Math.round(Math.sqrt(pow)) });
    return;
  }
}
// The assault under way with b6hnode: true when it ends now (danger at home, heavy losses, time, or a win)
function capN6hEnd(g, s, T, live, guns, theirs) {
  const n = g.nodes[T.node], hp = live.reduce((a, u) => a + u.hp, 0);
  const danger = theirs.some(e => e.fresh && Math.abs(e.u - hqU(s)) < NODE6.home && (e.v === undefined || !MAP_2D || Math.hypot(e.u - hqU(s), e.v - MAP.bases[s].hq[1]) < NODE6.home));
  for (const u of live) if (!u.n6f && guns.length && Math.hypot(u.u - n.u, u.v - n.v) < B6G4.gunR + 80) u.n6f = 1; // near the guns: they come first, all the way
  return !live.length ? 'dead' : hp < T.hp0 * NODE6.minHp ? 'hurt' : g.t > T.end ? 'time' : danger ? 'threat' : n.owner === s && !guns.length && !padsAt6h(g, s, T.node).length ? 'won' : null; // won: the node, its guns and its pad buildings
}
