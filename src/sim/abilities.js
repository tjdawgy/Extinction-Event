/* ---------- Commander abilities (Step 6) ----------
   Both sides use them under the same rules: cost, cooldown, unlock and what may be targeted. Cooldowns are stored
   as the game time an ability is ready again (side.ab), so they survive save and resume.
   v2.8: one shared cooldown. Using any ability locks all three for the used ability's cooldown (side.abK, side.abEnd). */
const ABIL = {
  shield: { name: 'Emergency Shield', cost: { c: 75, e: 75 }, cd: 50, first: 60, r: 110, dur: 7, cut: 0.4 },
  strike: { name: 'Orbital Strike', cost: { c: 150, e: 150 }, cd: 100, first: 120, r: 70, delay: 3, dmg: 280, edge: 140, req: 'hq', reqTier: 2 }, // v2.16: HQ T2, hits aircraft too
  repair: { name: 'Repair Pulse', cost: { c: 100, e: 75 }, cd: 50, first: 60, r: 120, dur: 6, rate: 0.06 },
  // Bloomhost (v2.20). like: the Last Fist ability each one mirrors for cost, cooldown, unlock and the AI's timing.
  frenzy: { name: 'Frenzy Bloom', like: 'shield', cost: { c: 75, e: 75 }, cd: 50, first: 60, r: 110, dur: 7, speed: 1.3, rate: 1.35 },
  brood: { name: 'Emergency Brood', like: 'repair', cost: { c: 100, e: 75 }, cd: 50, first: 60, r: 60, delay: 2, n: 5, life: 20, clear: 60 },
  corrosive: { name: 'Corrosive Bloom', like: 'strike', cost: { c: 150, e: 150 }, cd: 100, first: 120, r: 85, dur: 8, dps: 14, corr: 0.15, req: 'hq', reqTier: 2 },
  // Axiarchs (v2.28, docs/AXIARCHS.md section 7): cost, cooldown, first use and unlock from the Last Fist counterpart (like)
  mwarp: { name: 'Mass Warp', like: 'repair', cost: { c: 100, e: 75 }, cd: 50, first: 60, r: 120, ch: 2, n: 8, aiHurt: 0.4, aiN: 4, aiFar: 200 },
  overcharge: { name: 'Shield Overcharge', like: 'shield', cost: { c: 75, e: 75 }, cd: 50, first: 60, r: 110, dur: 7, regen: 0.3, cut: 0.25, cap: 0.5 },
  beam: { name: 'Purification Beam', like: 'strike', cost: { c: 150, e: 150 }, cd: 100, first: 120, r: 70, delay: 3, sweep: 1.5, len: 220, w: 40, dmg: 240, req: 'hq', reqTier: 2 },
};
const ABIL_ORDER = ['shield', 'strike', 'repair']; // Last Fist's; each faction's list is FACTIONS[...].abil
// v2.45: the ability descriptions read their numbers from ABIL (and TEMP, CORR) when read
for (const [k, f] of Object.entries({
  shield: A => `Your units inside the circle take ${txP(A.cut)} less damage for ${txN(A.dur)} s. The shield moves with them and never stacks.`,
  strike: A => `After a ${txN(A.delay)} s warning: ${txN(A.dmg)} damage at the centre, ${txN(A.edge)} at the edge, to every enemy unit (infantry, vehicles and aircraft) and building. Not a shielded HQ. Target any explored ground.`,
  repair: A => `Your units and finished buildings inside the circle regain ${txP(A.rate)} of their HP per second for ${txN(A.dur)} s. Where paid Repair is also running, the faster one applies.`,
  frenzy: A => `Your organisms inside the circle move ${txP(A.speed - 1)} faster and attack ${txP(A.rate - 1)} faster for ${txN(A.dur)} s. No extra health, no protection.`,
  brood: A => `A brood pod lands after a ${txN(A.delay)} s warning and releases ${A.n} Skitterlings that live for ${txN(A.life)} s and use no supply (at most ${TEMP.max} such creatures at once). Target ground you can see, clear of enemies.`,
  corrosive: A => `A spore cloud for ${txN(A.dur)} s: enemy ground units inside take ${txN(A.dps)} damage per second and are corroded (${txP(A.corr)} more damage taken; the ${txP(CORR.cap)} corrosion cap still applies). Not aircraft or buildings; they can walk out. Target any explored ground.`,
  mwarp: A => `Up to ${A.n} of your units inside the circle (the most damaged first) channel for ${txN(A.ch)} s, then warp to your warp point. It moves units; it never creates any. Target ground you can see with your units on it.`,
  overcharge: A => `Your units inside the circle regain ${txP(A.regen)} of their shields per second, even under fire, and take ${txP(A.cut)} less damage for ${txN(A.dur)} s (with a Bastion's brace, never more than ${txP(A.cap)} less). Shields only: no health, no invulnerability.`,
  beam: A => `After a ${txN(A.delay)} s warning, a beam sweeps ${txN(A.len)} along the lane over ${txN(A.sweep)} s: ${txN(A.dmg)} damage to every enemy ground unit and building it passes. Not aircraft, not a shielded HQ. Target explored ground on the lane.`,
})) liveStr(ABIL[k], 'tip', () => f(ABIL[k]));
const abList = side => FACTIONS[facOf(side.faction)].abil; // the abilities this side can use (one shared cooldown)
// Temporary units (v2.20; the Cloudwing reuses this in v2.21): unit.temp = the game time it expires. No supply, a hard
// cap per side, removed on expiry and at the end of the match.
const TEMP = { max: 8 };
// An ability's unlock: a finished building, at a tier for reqTier (the Orbital Strike needs HQ T2)
const abilUnlocked = (g, s, A) => !A.req || (A.reqTier ? g.ents.some(b => b.kind === 'b' && b.side === s && b.type === A.req && b.built && b.hp > 0 && b.tier >= A.reqTier) : hasBuilt(g, s, A.req));
const abilReqText = (A, fac) => `${BD(fac, A.req).name}${A.reqTier ? ' T' + A.reqTier : ''}`; // v2.28: the faction's own building name
const newAb = (t0, fac) => Object.fromEntries(FACTIONS[facOf(fac)].abil.map(k => [k, t0 + ABIL[k].first]));
const inAbil = (e, u, v, r) => { const du = e.u - u, dv = e.v - v, R = r + (e.kind === 'b' ? e.half : 0); return du * du + dv * dv <= R * R; };
// Can side s use ability k on (u, v) now? Without a target, only the cost, cooldown and unlock are checked.
function abilityCheck(g, s, k, u, v) {
  const A = ABIL[k], side = g.sides[s];
  if (!A || g.over) return { ok: false, msg: 'The match is over' };
  if (g.countdown > 0) return WAIT_GO;
  if (!FACTIONS[facOf(side.faction)].abilities) return { ok: false, msg: `${factionName(side.faction)} commander abilities are coming soon` }; // v2.17
  if (!abList(side).includes(k)) return { ok: false, msg: `${A.name} is not a ${factionName(side.faction)} ability` }; // v2.20
  if (!abilUnlocked(g, s, A)) return { ok: false, msg: `${A.name} needs ${A.reqTier ? 'your' : 'a'} ${abilReqText(A, side.faction)}` };
  const wait = side.ab[k] - g.t;
  if (wait > 0) return { ok: false, msg: side.abK && Math.abs(side.ab[k] - side.abEnd) < 1e-6 ? `Shared cooldown: abilities ready in ${Math.ceil(wait)} s` : `${A.name} is ready in ${Math.ceil(wait)} s` };
  if (side.res.c < A.cost.c) return { ok: false, msg: `Need ${Math.ceil(A.cost.c - side.res.c)} more credits` };
  if (side.res.e < A.cost.e) return { ok: false, msg: `Need ${Math.ceil(A.cost.e - side.res.e)} more energy` };
  if (u === undefined) return { ok: true };
  if (u < 0 || u > L || Math.abs(v) > (MAP_2D ? MAP.size.h / 2 : 220)) return { ok: false, msg: 'Target the battlefield' };
  const f = g.fog[s], c = cellOf(u, v);
  const explored = k === 'strike' || k === 'corrosive' || k === 'beam'; // the area attacks need explored ground; the rest, ground in view
  if (explored ? !f.exp[c] : !f.vis[c]) return { ok: false, msg: explored ? `${A.name} needs explored ground` : `${A.name} needs ground you can see` };
  if (k === 'brood') { // a pod lands only on open lane ground, clear of the enemies this side can see (v2.20)
    if (Math.abs(v) > LANE_V + 25) return { ok: false, msg: 'Emergency Brood needs open ground on the lane' };
    if (g.ents.some(e => e.kind === 'u' && e.side !== s && e.hp > 0 && !UDEF[e.type].air && visibleTo(g, s, e) && Math.hypot(e.u - u, e.v - v) < A.clear)) return { ok: false, msg: 'Emergency Brood needs ground clear of enemies' };
  }
  if (k === 'beam' && Math.abs(v) > LANE_V + 25) return { ok: false, msg: 'Purification Beam needs a spot on the lane' }; // v2.28
  if (k === 'mwarp' && !mwarpPick(g, s, u, v).length) return { ok: false, msg: 'Mass Warp needs your units inside the circle' };
  return { ok: true };
}
function useAbility(g, s, k, u, v) {
  RNG.g = g; // v2.50: roll from this match's stream (these can run from the UI, between ticks)
  const r = abilityCheck(g, s, k, u, v);
  if (!r.ok) return r;
  const A = ABIL[k], side = g.sides[s];
  side.res.c -= A.cost.c; side.res.e -= A.cost.e;
  logSpend(g, s, 'ab', A.cost.c, A.cost.e); logAbility(g, s, k);
  for (const k2 of abList(side)) side.ab[k2] = Math.max(side.ab[k2], g.t + A.cd); // the shared cooldown
  side.abK = k; side.abEnd = g.t + A.cd;
  if (k === 'shield') {
    let n = 0;
    for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && inAbil(e, u, v, A.r) && !(e.shT > g.t)) { e.shT = g.t + A.dur; n++; } // never extended
    g.abil.push({ k, side: s, u, v, t0: g.t, end: g.t + 0.6, n });
  } else if (k === 'frenzy') { // v2.20: Bloomhost organisms in the circle; a second cast refreshes, never stacks
    let n = 0;
    for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && UDEF[e.type].fac === 'bloomhost' && inAbil(e, u, v, A.r)) { e.frzT = g.t + A.dur; n++; }
    g.abil.push({ k, side: s, u, v, t0: g.t, end: g.t + 0.6, n }); logEffect(g, s, k, n);
  } else if (k === 'overcharge') { // v2.28: Axiarch units in the circle; a second cast refreshes, never stacks
    let n = 0;
    for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && e.maxShp && inAbil(e, u, v, A.r)) { e.ovT = g.t + A.dur; n++; }
    g.abil.push({ k, side: s, u, v, t0: g.t, end: g.t + 0.6, n });
  } else if (k === 'mwarp') { // v2.28: the chosen units channel at once and arrive at the end (updateAbilities)
    const wp = warpPoint(g, s);
    g.abil.push({ k, side: s, u, v, t0: g.t, end: g.t + A.ch, ids: mwarpPick(g, s, u, v).map(e => e.id), wu: wp.u, wv: wp.v });
  } else if (k === 'beam') g.abil.push({ k, side: s, u, v: clamp(v, -LANE_V, LANE_V), t0: g.t, end: g.t + A.delay + A.sweep, at: 0, hit: [] }); // at: how far the sweep has gone (0-1)
  else if (k === 'strike' || k === 'brood') g.abil.push({ k, side: s, u, v, t0: g.t, end: g.t + A.delay });
  else g.abil.push({ k, side: s, u, v, t0: g.t, end: g.t + A.dur });
  ev(g, { type: 'ability', side: s, k, u, v });
  return { ok: true, msg: k === 'strike' ? 'Orbital Strike inbound' : k === 'brood' ? 'Brood pod launched' : k === 'beam' ? 'Purification Beam charging' : k === 'mwarp' ? 'Mass Warp channelling' : `${A.name} active` };
}
// Mass Warp (v2.28): side s's units in the circle, the most damaged first (then the nearest), at most A.n
function mwarpPick(g, s, u, v) {
  const A = ABIL.mwarp, frac = e => (e.hp + (e.shp || 0)) / (e.maxHp + (e.maxShp || 0));
  return g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && inAbil(e, u, v, A.r))
    .sort((a, b) => frac(a) - frac(b) || Math.hypot(a.u - u, a.v - v) - Math.hypot(b.u - u, b.v - v) || a.id - b.id).slice(0, A.n);
}
// The channel ends: each chosen unit still alive moves to a valid spot at the warp point (the one shown at the cast while it
// is still in the field, else the current one). Nothing is created or removed.
function mwarpLand(g, a) {
  const wp = onField(g, a.side, a.wu, a.wv) ? { u: a.wu, v: a.wv } : warpPoint(g, a.side), taken = [];
  let n = 0;
  for (const id of a.ids) {
    const e = g.ents.find(x => x.id === id && x.hp > 0); if (!e) continue;
    const p = warpSpot(g, a.side, wp.u, wp.v, taken); taken.push(p);
    e.u = p.u; e.v = p.v; e.laneV = clamp(p.v, -LANE_V, LANE_V); e.moving = false;
    arriveOrders(g, e); // a unit on Hold holds where it arrived (v2.31: also one that had no hold spot yet)
    if (e.leaping) { e.leaping = 0; e.z = 0; } // a phase-step in flight ends where the warp puts it
    n++;
  }
  a.n = n; logEffect(g, a.side, 'mwarp', n);
}
// The Purification Beam's sweep (v2.28): the head runs from one end of the strip to the other, toward the enemy, over
// A.sweep seconds; every enemy ground unit and building it passes takes A.dmg once. A shielded HQ is untouched (damage()).
function beamStep(g, a) {
  const A = ABIL.beam, dir = dirOf(a.side), x0 = a.at * A.len;
  a.at = Math.min(1, (g.t - a.t0 - A.delay) / A.sweep); const x1 = a.at * A.len, start = a.u - dir * A.len / 2;
  for (const e of g.ents) {
    if (e.side === a.side || e.hp <= 0 || (e.kind === 'u' && UDEF[e.type].air) || a.hit.includes(e.id)) continue;
    const half = e.kind === 'b' ? e.half : 0, x = (e.u - start) * dir;
    if (x + half < x0 - 6 || x - half > x1 || x - half > A.len || x + half < 0 || Math.abs(e.v - a.v) - half > A.w) continue;
    a.hit.push(e.id); const h0 = e.hp; damage(g, e, A.dmg, 'beam', a.side);
    logEffect(g, a.side, 'beam', h0 - Math.max(0, e.hp), e.hp <= 0 ? 1 : 0);
  }
  if (a.at >= 1) a.done = true;
}
// The brood pod lands: up to A.n temporary Skitterlings around it, never past TEMP.max for the side and never on an enemy
function broodLand(g, a) {
  const A = ABIL.brood, w = P(a.u, a.v, 6); fxBoom(g, w.x, w.y, 16);
  let room = TEMP.max - g.ents.filter(e => e.kind === 'u' && e.side === a.side && e.temp && e.tSrc !== 'cloud' && e.tSrc !== 'mite' && e.hp > 0).length, n = 0; // v2.21: Cloudwing offspring have their own cap; v2.33: Mites too
  for (let i = 0; i < A.n && room > 0; i++) {
    const an = i / A.n * Math.PI * 2, pu = clamp(a.u + Math.cos(an) * 22, 0, L), pv = a.v + Math.sin(an) * 22;
    if (g.ents.some(e => e.kind === 'u' && e.side !== a.side && e.hp > 0 && !UDEF[e.type].air && Math.hypot(e.u - pu, e.v - pv) < 22)) continue; // never on top of an enemy
    const sk = spawnUnit(g, a.side, 'skitterling', pu, pv); sk.temp = g.t + A.life; sk.tLife = A.life; sk.tSrc = 'brood'; sk.laneV = clamp(pv, -LANE_V, LANE_V); arriveOrders(g, sk); room--; n++;
  }
  logEffect(g, a.side, 'brood', n);
}
// Temporary units expire quietly (no loss, no kill); at the end of the match they all go
function updateTemps(g) { for (const e of g.ents) if (e.kind === 'u' && e.temp && g.t >= e.temp && e.hp > 0) { e.hp = 0; e.dead = true; e.expired = true; } }
// Cloudwing offspring (v2.21): a Cloudwing that is attacking releases spawn.n temporary Needlewings every spawn.cd seconds,
// never past SPAWN.max live offspring per side (Emergency Brood's TEMP.max is separate). They live spawn.life seconds,
// bite for SPAWN.dmg of a Needlewing's damage, use no supply, and go like any temporary unit.
function updateSpawn(g) {
  const live = [0, 0];
  for (const e of g.ents) if (e.kind === 'u' && e.tSrc === 'cloud' && e.hp > 0) live[e.side]++;
  for (const c of g.ents) {
    if (c.kind !== 'u' || c.type !== 'cloudwing' || c.hp <= 0 || !c.tgt || g.t < c.spawnT) continue;
    const S = UDEF.cloudwing.spawn;
    c.spawnT = g.t + S.cd;
    for (let i = 0; i < S.n && live[c.side] < SPAWN.max; i++) {
      const k = spawnUnit(g, c.side, 'needlewing', c.u - c.face * 6, clamp(c.v + (i ? 10 : -10), -LANE_V - 40, LANE_V + 40));
      Object.assign(k, { temp: g.t + S.life, tLife: S.life, tSrc: 'cloud', kid: 1, z: c.z - 6, face: c.face, laneV: c.laneV }); arriveOrders(g, k);
      live[c.side]++;
    }
  }
}
/* ---------- Brood Mound (v2.33): Mites through the temporary-unit system (tSrc 'mite', their own cap MOUND.max) ----------
   The finished Mound's timer (mound.mt) starts when it finishes; every MOUND.every seconds it spawns its tier's Mites in
   front of it, as many as fit under the cap. They take the army's current orders like a trained unit. */
const moundOf = (g, s) => facOf(g.sides[s].faction) === 'bloomhost' ? sigOf(g, s, 'sigA') : null;
const rootOf = (g, s) => facOf(g.sides[s].faction) === 'bloomhost' ? sigOf(g, s, 'sigB') : null;
function updateMounds(g) {
  for (let s = 0; s < 2; s++) {
    const m = moundOf(g, s);
    if (!m) continue;
    if (m.mt === undefined) m.mt = g.t + MOUND.every;
    if (g.t < m.mt) continue;
    m.mt = g.t + MOUND.every;
    let room = MOUND.max - g.ents.filter(e => e.kind === 'u' && e.side === s && e.tSrc === 'mite' && e.hp > 0).length;
    const dir = dirOf(s), n = MOUND.n[m.tier];
    for (let i = 0; i < n && room > 0; i++, room--) {
      const k = spawnUnit(g, s, 'mite', m.u + dir * (m.half + 8 + i * 6), m.v + (i - (n - 1) / 2) * 14);
      Object.assign(k, { temp: g.t + MOUND.life, tLife: MOUND.life, tSrc: 'mite' }); k.laneV = clamp(k.v, -LANE_V, LANE_V); arriveOrders(g, k);
      if (g.log) logAdd(g.log.tot[s].mites || (g.log.tot[s].mites = {}), 'n');
    }
  }
}
// T3: a killed Mite's acid burst: enemy ground units around it, never buildings or aircraft
function miteBurst(g, e) {
  const m = moundOf(g, e.side);
  if (!m || m.tier < 3) return;
  const w = P(e.u, e.v, 4); g.fx.push({ k: 'acidburst', side: e.side, u: e.u, x: w.x, y: w.y, r: MOUND.r, t: 0, life: 0.6 });
  for (const f of g.ents) if (f.kind === 'u' && f.side !== e.side && f.hp > 0 && !UDEF[f.type].air && Math.hypot(f.u - e.u, (f.v - e.v) * 0.6) <= MOUND.r) damage(g, f, UDEF.mite.dmg * MOUND.burst, 'miteacid', e.side);
}
/* ---------- Rootheart (v2.33): stronger creep for its side ----------
   T1: growth and reach (ROOT.grow, ROOT.reach) in updateCreep, and a slow on enemy ground units on this side's creep.
   T2: Bloomhost regen on creep × ROOT.regen. T3: a snare pulse every ROOT.every seconds on the creep's outer strip. */
const creepRegen = (g, s) => { const r = rootOf(g, s); return CREEP.regen * (r && r.tier >= 2 ? ROOT.regen : 1); };
const creepInner = (g, s, u, v, d) => { for (const p of g.creep[s]) { const du = u - p.u, dv = v - p.v, R = p.r - d; if (R > 0 && du * du + dv * dv <= R * R) return true; } return false; };
function updateRoots(g) {
  for (let s = 0; s < 2; s++) {
    const rh = rootOf(g, s);
    if (!rh) continue;
    for (const e of g.ents) if (e.kind === 'u' && e.side !== s && e.hp > 0 && !UDEF[e.type].air && !e.leaping && onCreep(g, s, e.u, e.v)) slowU(g, e, ROOT.slow, SLOW.dur, 'creep');
    if (rh.tier < 3) { rh.rt = undefined; continue; }
    if (rh.rt === undefined) rh.rt = g.t + ROOT.every;
    if (g.t < rh.rt) continue;
    rh.rt = g.t + ROOT.every;
    const home = hqU(s), edge = g.ents.filter(e => e.kind === 'u' && e.side !== s && e.hp > 0 && !UDEF[e.type].air && !e.leaping && !(e.snImm > g.t) && onCreep(g, s, e.u, e.v) && !creepInner(g, s, e.u, e.v, ROOT.edge))
      .sort((a, b) => Math.abs(a.u - home) - Math.abs(b.u - home) || a.id - b.id).slice(0, ROOT.max); // the nearest to its base first
    for (const e of edge) { e.snT = g.t + ROOT.snare; e.snImm = g.t + ROOT.imm; e.moving = false; }
    g.fx.push({ k: 'roots', side: s, t: 0, life: 1.1, at: edge.map(e => ({ u: e.u, v: e.v })), rim: g.creep[s].filter(p => p.r > 0).map(p => ({ u: p.u, v: p.v, r: p.r })) });
    if (g.log) g.log.tot[s].snared = (g.log.tot[s].snared || 0) + edge.length;
  }
}
// How many of side s's units and buildings a Repair Pulse at (u, v) would heal now (the same rules as updateAbilities)
function repairHealable(g, s, u, v) {
  let n = 0;
  for (const e of g.ents) if (e.side === s && e.hp > 0 && e.hp < e.maxHp && !(e.kind === 'b' && (!e.built || g.t >= EXT.start || e.repair > 0)) && inAbil(e, u, v, ABIL.repair.r)) n++;
  return n;
}
function updateAbilities(g, dt) {
  for (const a of g.abil) {
    if (a.k === 'repair' && g.t <= a.end) {
      const A = ABIL.repair;
      for (const e of g.ents) {
        if (e.side !== a.side || e.hp <= 0 || e.hp >= e.maxHp || (e.kind === 'b' && (!e.built || g.t >= EXT.start)) || !inAbil(e, a.u, a.v, A.r)) continue; // in the storm it heals units only
        const paid = e.kind === 'b' && e.repair > 0 ? 0.06 : e.kind === 'u' ? Math.max(e.medAt === g.t ? UDEF.medic.heal : 0, e.creepAt === g.t ? creepRegen(g, e.side) : 0) : 0; // paid Repair (6%/s), a Medicopter or creep regen: the fastest one applies
        const rate = Math.max(0, A.rate - paid);
        if (rate > 0) { const h0 = e.hp; e.hp = Math.min(e.maxHp, e.hp + e.maxHp * rate * dt); logEffect(g, a.side, 'repair', e.hp - h0); }
      }
    }
    if (a.k === 'brood' && g.t >= a.end && !a.done) { a.done = true; broodLand(g, a); }
    if (a.k === 'mwarp' && g.t >= a.end && !a.done) { a.done = true; mwarpLand(g, a); } // v2.28
    if (a.k === 'beam' && !a.done && g.t >= a.t0 + ABIL.beam.delay) beamStep(g, a);
    if (a.k === 'corrosive' && g.t <= a.end) { // the spore cloud: light damage and corrosion to enemy ground units inside (v2.20)
      const A = ABIL.corrosive;
      for (const e of g.ents) {
        if (e.kind !== 'u' || e.side === a.side || e.hp <= 0 || UDEF[e.type].air || !inAbil(e, a.u, a.v, A.r)) continue;
        const h0 = e.hp; damage(g, e, A.dps * dt, 'spores', a.side); corrode(g, e, { amt: A.corr, dur: 1 });
        logEffect(g, a.side, 'corrosive', h0 - Math.max(0, e.hp), e.hp <= 0 ? 1 : 0);
      }
    }
    if (a.k === 'strike' && g.t >= a.end && !a.done) {
      a.done = true;
      const A = ABIL.strike;
      for (const e of g.ents) {
        if (e.side === a.side || e.hp <= 0) continue; // v2.16: aircraft too
        const d = Math.max(0, Math.hypot(e.u - a.u, e.v - a.v) - (e.kind === 'b' ? e.half : 0));
        if (d <= A.r) { const h0 = e.hp; damage(g, e, A.dmg - (A.dmg - A.edge) * d / A.r, 'orbital', a.side); logEffect(g, a.side, 'strike', h0 - Math.max(0, e.hp), e.hp <= 0 ? 1 : 0); }
      }
    }
  }
  if (g.abil.some(a => g.t > a.end)) g.abil = g.abil.filter(a => g.t <= a.end);
}

