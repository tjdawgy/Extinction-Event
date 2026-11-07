/* ---------- The Extinction Event (v2.6) ----------
   From 20:00 a storm burns every building on both sides: a share of its max HP per second, 0.3% at first and
   0.75% more each minute. It ignores the HQ shield (it is no weapon), stops self-repair and Repair Pulse on
   buildings, and halves paid Repair, which it outpaces at 23:36. Before 20:00 a fallen HQ ends the match at once;
   from 20:00 the match runs 5 more seconds, and if the other HQ falls too, the score decides. At 27:00 the score
   decides anyway. Score: HP of every standing building plus army value. */
const EXT = { show: 1080, warn: 1170, start: 1200, base: 0.003, ramp: 0.0075, repairMul: 0.5, window: 5, limit: 1620,
  draw: true }; // v2.48: an ending the storm decides (an HQ lost to the storm, both HQs in the window, the 27:00 limit) is a draw for both sides; false = v2.47's score tie-break
const stormRate = t => t < EXT.start ? 0 : EXT.base + EXT.ramp * (t - EXT.start) / 60; // share of max HP lost per second
function updateStorm(g, dt, t0) {
  if (g.noStorm) return; // v2.46: the tutorial's practice match only (set by the UI, never saved); every other match has a storm
  if (t0 < EXT.warn && g.t >= EXT.warn) { ev(g, { type: 'extWarn' }); lg(g, -1, 'W'); }
  if (t0 < EXT.start && g.t >= EXT.start) { ev(g, { type: 'extStart' }); lg(g, -1, 'X'); }
  const r = stormRate(g.t);
  if (!r) return;
  for (const b of g.ents) if (b.kind === 'b' && b.hp > 0) {
    if (g.log) g.log.tot[b.side].storm += Math.min(b.hp, b.maxHp * r * dt);
    let hit = b.maxHp * r * dt;
    if (b.maxShp) { b.shpT = g.t; const a = Math.min(b.shp, hit); b.shp -= a; hit -= a; } // Axiarch shields take it first, like any damage (v2.25)
    b.hp -= hit;
    if (b.hp <= 0) kill(g, b, -1);
  }
}
const sideScore = (g, s) => g.ents.reduce((a, e) => a + (e.side !== s || e.hp <= 0 ? 0 : e.kind === 'b' ? e.hp + (e.shp || 0) : (UDEF[e.type].cost.c + UDEF[e.type].cost.e * 1.5)), 0);
function finish(g, winner, how, extra = {}) {
  g.over = true; g.winner = winner; g.endHold = null;
  for (const e of g.ents) if (e.kind === 'u' && e.temp) { e.hp = 0; e.dead = true; e.expired = true; } // temporary units leave with the match (v2.20)
  g.warps = []; // and units still warping in never arrive (v2.26)
  if (g.ents.some(e => e.expired)) g.ents = g.ents.filter(e => !e.expired);
  g.result = { how, ...extra };
  ev(g, { type: 'over', winner, how });
  if (g.log) { lg(g, -1, 'E', how, winner); logAbilityDone(g.log, 0); logAbilityDone(g.log, 1); }
  statsEnd(g); // v2.51
}
function tieBreak(g, reason) { // score, then kills, then credits earned; equal on all three is a draw
  const sc = [0, 1].map(s => Math.round(sideScore(g, s))), k = g.sides.map(sd => sd.stats.kills), c = g.sides.map(sd => Math.round(sd.stats.earned || 0));
  const pick = (a) => a[0] > a[1] ? 0 : a[1] > a[0] ? 1 : -1;
  let w = pick(sc), by = 'score';
  if (w < 0) { w = pick(k); by = 'kills'; }
  if (w < 0) { w = pick(c); by = 'credits'; }
  if (EXT.draw && g.t >= EXT.start) return finish(g, -1, 'draw', { reason, by: 'storm', score: sc }); // v2.48: the storm decided it, so nobody won
  finish(g, w, w < 0 ? 'draw' : 'score', { reason, by, score: sc });
}
function resolveEnd(g) {
  if (g.over) return;
  const fell = [0, 1].filter(s => g.sides[s].hq.hp <= 0);
  if (fell.length === 2) return tieBreak(g, 'both');
  if (fell.length === 1) {
    const loser = fell[0], how = g.sides[loser].hqBy === -1 ? 'storm' : 'hq';
    if (g.t < EXT.start) return finish(g, 1 - loser, how);
    if (!g.endHold) g.endHold = { loser, until: g.t + EXT.window };
    if (g.t >= g.endHold.until) return how === 'storm' && EXT.draw ? finish(g, -1, 'draw', { reason: 'storm', loser }) : finish(g, 1 - loser, how);
    return;
  }
  if (g.t >= EXT.limit && !g.noStorm) tieBreak(g, 'limit');
}

function updateProjs(g, dt) {
  for (const p of g.projs) {
    p.t += dt;
    p.pu = p.u; p.pv = p.v; p.pz = p.z;
    if (p.weapon === 'shell' || p.weapon === 'lob' || p.weapon === 'rift') { // the Rift Mortar's shot arcs like a shell (v2.27)
      const k = Math.min(1, p.t / p.T);
      p.u = lerp(p.su, p.tu, k); p.v = lerp(p.sv, p.tv, k);
      p.z = lerp(p.sz, 0, k) + p.arc * 4 * k * (1 - k);
      if (fxRnd() < 0.5) { const w = P(p.u, p.v, p.z); addPart(g, { x: w.x, y: w.y, vx: 0, vy: 0, life: 0.35, size: 2, smoke: true, light: true }); }
      if (k >= 1) { impact(g, p, null); p.done = true; }
      continue;
    }
    if (p.target && p.target.hp > 0) { p.tu = p.target.u; p.tv = p.target.v; p.tz = aimZ(p.target); }
    else p.target = null;
    const du = p.tu - p.u, dv = p.tv - p.v, dz = p.tz - p.z, dist = Math.hypot(du, dv, dz), step = p.speed * dt;
    if (dist <= step + 2) { p.u = p.tu; p.v = p.tv; p.z = p.tz; impact(g, p, p.target); p.done = true; continue; }
    p.u += du / dist * step; p.v += dv / dist * step; p.z += dz / dist * step;
    if ((p.weapon === 'rocket' || p.weapon === 'hqgun' || p.weapon === 'missile') && fxRnd() < 0.7) {
      const w = P(p.u, p.v, p.z);
      addPart(g, { x: w.x, y: w.y, vx: fxRand(-5, 5), vy: fxRand(-5, 5), life: 0.4, size: 2.2, smoke: true, light: true });
    }
    if (p.t > 4) p.done = true;
  }
  g.projs = g.projs.filter(p => !p.done);
}

function splashHit(g, p, hit, scale, falloffFloor) {
  for (const e of g.ents) {
    if (e === hit || e.side === p.side || e.hp <= 0 || (e.kind === 'u' && UDEF[e.type].air)) continue;
    const dx = Math.max(0, Math.hypot(e.u - p.u, (e.v - p.v) * 0.6) - (e.kind === 'b' ? e.half : 0));
    if (dx < p.splash) { damage(g, e, p.dmg * scale * (1 - falloffFloor * dx / p.splash), p.weapon, p.side); if (p.corr) corrode(g, e, p.corr); }
  }
}

function impact(g, p, hit) {
  if (p.dev) { DEV.on = true; DEV.sum = 0; impact1(g, p, hit); DEV.on = false; devour(g, p, DEV.sum); return; } // P11
  impact1(g, p, hit);
  if (p.pierce && hit) pierceLine(g, p, hit); // P4
}
// P11 (v2.37): the Worldrender heals frac of the damage its drop did to buildings, at most cap HP per second (a running
// budget that refills at cap per second up to one second's worth)
const DEV = { on: false, sum: 0 };
function devour(g, p, dealt) {
  const w = g.ents.find(e => e.id === p.dev && e.hp > 0), H = w && UDEF[w.type].devour;
  if (!H || dealt <= 0) return;
  w.dvB = Math.min(H.cap, (w.dvB ?? H.cap) + (g.t - (w.dvT ?? g.t)) * H.cap); w.dvT = g.t;
  const heal = Math.min(dealt * H.frac, w.dvB, w.maxHp - w.hp);
  if (heal <= 0) return;
  w.hp += heal; w.dvB -= heal;
  const a = P(p.u, p.v, 0), b = P(w.u, w.v, w.z || 0); g.fx.push({ k: 'devour', side: w.side, u: w.u, x: a.x, y: a.y, x2: b.x, y2: b.y, t: 0, life: 0.9, n: Math.round(heal) });
}
// P4 (v2.37): a Sniper's round goes on through its target: up to pierce.n more enemy units within w of the line from the
// shooter through the target, at most len beyond it, nearest first, each taking fall × the previous hit
function pierceLine(g, p, hit) {
  const K = UDEF.sniper.pierce, du = hit.u - p.ou, dv = hit.v - p.ov, d = Math.hypot(du, dv);
  if (d < 1) return;
  const ux = du / d, vy = dv / d, list = [];
  for (const e of g.ents) {
    if (e === hit || e.kind !== 'u' || e.side === p.side || e.hp <= 0 || e.phT > g.t) continue;
    const ru = e.u - hit.u, rv = e.v - hit.v, along = ru * ux + rv * vy, off = Math.abs(ru * vy - rv * ux);
    if (along > 0 && along <= K.len && off <= K.w) list.push([along, e]);
  }
  list.sort((a, b) => a[0] - b[0] || a[1].id - b[1].id);
  let dmg = p.dmg;
  for (const [, e] of list.slice(0, K.n)) { dmg *= K.fall; damage(g, e, dmg, p.weapon, p.side); }
  const a = P(hit.u, hit.v, aimZ(hit)), b = P(hit.u + ux * K.len, hit.v + vy * K.len, aimZ(hit));
  g.fx.push({ k: 'pierce', u: hit.u, x: a.x, y: a.y, x2: b.x, y2: b.y, t: 0, life: 0.25 });
}

function impact1(g, p, hit) {
  const w = P(p.u, p.v, p.z);
  if (p.weapon === 'shell' || p.weapon === 'lob' || p.weapon === 'rift') { splashHit(g, p, null, 1, 0.5); fxBoom(g, w.x, w.y, 30); return; }
  if (p.weapon === 'bomb' || p.weapon === 'crush' || p.weapon === 'sovereign') { splashHit(g, p, null, 1, 0.5); fxBoom(g, w.x, w.y, p.weapon === 'bomb' ? 40 : 48); return; } // the Astral Sovereign too (v2.29) // full damage at the centre, half at the edge (the Worldrender too, v2.21)
  if (hit && hit.hp > 0) { damage(g, hit, p.dmg, p.weapon, p.side); if (p.corr) corrode(g, hit, p.corr); }
  if (p.splash > 0) splashHit(g, p, hit, 0.5, 1);
  if (p.acid) addAcid(g, p.side, p.u, p.v, p.acid === 'dist' ? 'dist' : undefined);
  if (p.weapon === 'rifle' || p.weapon === 'rail' || p.weapon === 'gatling') {
    for (let i = 0; i < (p.weapon === 'rail' ? 5 : 2); i++)
      addPart(g, { x: w.x, y: w.y, vx: fxRand(-40, 40), vy: fxRand(-50, 0), life: 0.18, size: 1.3, color: p.weapon === 'rail' ? '#c9f6ff' : '#fff3b0', grav: 200 });
  } else fxBoom(g, w.x, w.y, p.weapon === 'siege' ? 26 : p.weapon === 'cannon' ? 18 : p.weapon === 'flak' ? 8 : 12);
}

// Prismwing shield link (v2.29): of the shield damage a it is about to take, link.share is spread evenly over the shields of up
// to link.n other Prismwings of its side within link.r (the nearest). Each takes at most what its shield holds: shields only,
// never health. Returns how much the others took (the rest stays on the struck Prismwing).
function shieldLink(g, e, a) {
  const K = UDEF[e.type].link;
  const mates = g.ents.filter(o => o !== e && o.kind === 'u' && o.side === e.side && o.type === e.type && o.hp > 0 && o.shp > 0 && Math.hypot(o.u - e.u, o.v - e.v) <= K.r)
    .sort((x, y) => Math.hypot(x.u - e.u, x.v - e.v) - Math.hypot(y.u - e.u, y.v - e.v) || x.id - y.id).slice(0, K.n);
  if (!mates.length) return 0;
  const per = a * K.share / mates.length; let moved = 0;
  for (const o of mates) { const t = Math.min(o.shp, per); o.shp -= t; o.shpT = g.t; o.shpHit = g.t; moved += t; }
  return moved;
}
// Corrosion (v2.19): the strongest level and the later end win; levels never add up and never pass CORR.cap
// Corrosion (v2.37): the strongest running effect applies, capped at CORR.cap; a weaker one that outlasts it is kept as a
// second slot (corr2) and takes over when the strongest ends. Nothing adds up. Before v2.37 (REDESIGN off) the strongest
// amount was kept and the latest end time extended it, so a strong short hit plus a weak long one stayed strong and long.
const corrNow = (e, t) => e.corrT > t ? e.corr : e.corr2T > t ? e.corr2 : 0;
function corrode(g, e, c) {
  if (e.kind !== 'u' || e.hp <= 0) return;
  if (REDESIGN.on) {
    const fx = [[e.corr || 0, e.corrT || 0], [e.corr2 || 0, e.corr2T || 0], [Math.min(CORR.cap, c.amt), g.t + c.dur]].filter(x => x[1] > g.t && x[0] > 0);
    fx.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    const top = fx[0] || [0, 0], next = fx.slice(1).filter(x => x[1] > top[1]).sort((a, b) => b[0] - a[0])[0] || [0, 0];
    e.corr = top[0]; e.corrT = top[1]; e.corr2 = next[0]; e.corr2T = next[1];
    return;
  }
  const live = e.corrT > g.t;
  e.corr = Math.min(CORR.cap, Math.max(live ? e.corr : 0, c.amt)); e.corrT = Math.max(live ? e.corrT : 0, g.t + c.dur);
}
// Ruinmaw acid pools (v2.19): at most ACID.max at once; a new one replaces the oldest
function addAcid(g, side, u, v, kind) { // kind 'dist': a Worldbreaker's distortion zone (v2.27), same damage, cap and life
  if (g.acid.length >= ACID.max) g.acid.shift();
  g.acid.push(kind ? { side, u, v, end: g.t + ACID.dur, kind } : { side, u, v, end: g.t + ACID.dur });
}
function updateAcid(g, dt) {
  if (!g.acid.length) return;
  g.acid = g.acid.filter(a => a.end > g.t);
  for (const a of g.acid) for (const e of g.ents) {
    if (e.kind !== 'u' || e.side === a.side || e.hp <= 0 || UDEF[e.type].air) continue;
    if (Math.hypot(e.u - a.u, (e.v - a.v) * 0.6) > ACID.r) continue;
    if (a.kind === 'dist' && REDESIGN.on) disrupt(g, e, DIST); // P7 (v2.37): a distortion zone disrupts instead of burning
    else damage(g, e, ACID.dps * dt, 'acidpool', a.side);
  }
}
// src: the attacking unit for blows at close range (melee, flame), so a Thornback can answer; retaliation passes no src,
// so it can never set off more retaliation
function damage(g, e, amt, weapon, fromSide, src) {
  if (e.shielded) return;
  if (e.phT > g.t) return; // P13 (v2.37): a phased Wraithwing can't be hurt
  if (DEV.on && e.kind === 'b') { const h0 = e.hp + (e.shp || 0); damage1(g, e, amt, weapon, fromSide, src); DEV.sum += h0 - Math.max(0, e.hp) - (e.shp || 0); return; }
  damage1(g, e, amt, weapon, fromSide, src);
}
function damage1(g, e, amt, weapon, fromSide, src) {
  const armor = e.kind === 'b' ? 'building' : UDEF[e.type].armor;
  const mult = DMG[weapon][armor];
  if (!mult) return;
  let dmg = amt * mult * (g.sides[e.side].buff ? NANO.cut : 1) * (1 + corrNow(e, g.t)); // corroded: takes more (v2.19; v2.37 the second slot)
  const br = e.kind === 'u' && UDEF[e.type].brace, pre = dmg;
  if (br) { // the Bulwark braces on the first hit after its cooldown (v2.17)
    if (!(e.braceT > g.t) && g.t >= e.braceCd) { e.braceT = g.t + br.dur; e.braceCd = g.t + br.cd; }
    if (e.braceT > g.t) dmg *= 1 - br.cut;
  }
  const sg = e.kind === 'u' && UDEF[e.type].surge; // P6 (v2.37): a Bastion's shield surge starts on the first hit after its cooldown
  if (sg && g.t >= (e.surgeCd || 0)) { e.surgeT = g.t + sg.dur; e.surgeCd = g.t + sg.cd; }
  if (e.ovT > g.t) { // Shield Overcharge (v2.28): less damage, with the brace together never more than OV cap
    const A = ABIL.overcharge, nd = Math.max(dmg * (1 - A.cut), pre * (1 - A.cap));
    if (nd < dmg) { logEffect(g, e.side, 'overcharge', dmg - nd); dmg = nd; }
  }
  let hit = dmg;
  const sh0 = (e.shp || 0) + (e.osh || 0); // v2.51: shields before the hit
  if (e.shT > g.t) { hit = dmg * (1 - ABIL.shield.cut); logEffect(g, e.side, 'shield', dmg * ABIL.shield.cut); } // Emergency Shield
  if (e.oshT > g.t && e.osh > 0) { const a = Math.min(e.osh, hit); e.osh -= a; hit -= a; e.shpHit = g.t; } // an Echo Reliquary T3 overshield (v2.34): first, never regenerates
  if (e.maxShp) { // Axiarch shields (v2.25), not the HQ shield or the Emergency Shield: they take the hit first, any overflow goes to HP
    e.shpT = g.t;
    if (e.shp > 0 && e.kind === 'u' && UDEF[e.type].link) hit -= shieldLink(g, e, Math.min(e.shp, hit)); // a Prismwing's shield link (v2.29)
    if (e.shp > 0) { const a = Math.min(e.shp, hit); e.shp -= a; hit -= a; e.shpHit = g.t; }
  }
  statsDamage(g, e, sh0 - (e.shp || 0) - (e.osh || 0) + Math.min(hit, Math.max(0, e.hp)), fromSide); // v2.51: what came off shields and HP
  e.hp -= hit;
  e.hitT = 0.12;
  if (e.kind === 'u') {
    e.lastHurt = g.t;
    const ud = UDEF[e.type];
    if (ud.thorns && src && src.kind === 'u' && src.hp > 0 && effDist(src, e) <= ud.thorns.range) damage(g, src, dmg * ud.thorns.frac, 'thorns', e.side); // Thornback: no src, so no loop
    if (ud.burst && dmg >= ud.burst.trigger && weapon !== 'spines' && g.t >= e.burstCd && e.hp > 0) { // Dreadthorn: a spine burst on a big hit
      e.burstCd = g.t + ud.burst.cd; const bw = P(e.u, e.v, 12); fxBoom(g, bw.x, bw.y, 22);
      for (const f of g.ents) if (f.kind === 'u' && f.side !== e.side && f.hp > 0 && !UDEF[f.type].air && Math.hypot(f.u - e.u, (f.v - e.v) * 0.6) <= ud.burst.r) damage(g, f, ud.burst.dmg, 'spines', e.side);
    }
  }
  if (e.kind === 'b') {
    e.lastHit = g.t;
    const side = g.sides[e.side];
    if (g.t - side.lastAlert > 10) { side.lastAlert = g.t; ev(g, { type: 'alert', side: e.side, hq: e.type === 'hq' }); }
  }
  if (e.kind === 'u' && e.hp > 0 && UDEF[e.type].phase && g.t >= (e.phCd || 0)) { const F = UDEF[e.type].phase; e.phT = g.t + F.dur; e.phCd = g.t + F.dur + F.cd; } // P13: phase out after the hit
  if (e.hp <= 0) {
    kill(g, e, fromSide, weapon);
    if (src && src.kind === 'u' && src.hp > 0 && UDEF[src.type].bloodfrenzy) src.frzT = Math.max(src.frzT || 0, g.t + UDEF[src.type].bloodfrenzy.dur); // P15: refreshed, never stacked
  }
}

function kill(g, e, by, weapon) {
  if (e.dead) return;
  e.dead = true; e.hp = 0;
  const side = g.sides[e.side];
  if (e.kind === 'u') {
    side.stats.lost++;
    if (by >= 0) g.sides[by].stats.kills++;
    if (g.log) { const T = g.log.tot[e.side]; logAdd(T.lost, e.type); if (weapon) logAdd(T.lostTo || (T.lostTo = {}), weapon); if (by >= 0) logAdd(g.log.tot[by].killed, e.type); lgUnit(g, e.side, 'K', e.type); logLoss(g, e); }
    const d = UDEF[e.type], w = P(e.u, e.v, aimZ(e));
    salvage(g, e, w);
    if (e.tSrc === 'mite') miteBurst(g, e); // v2.33: killed, never expired (expiry doesn't come through kill)
    echoStore(g, e); // v2.34: an Axiarch T2/T3 unit's echo
    fxBoom(g, w.x, w.y, e.type === 'sovereign' ? 44 : e.type === 'voidcarrier' ? 28 : e.type === 'prismwing' ? 10 : e.type === 'shardstorm' ? 14 : e.type === 'riftstalker' || e.type === 'lancer' || e.type === 'marksman' ? 10 : e.type === 'parallax' ? 12 : e.type === 'shardling' ? 8 : e.type === 'bastion' ? 20 : e.type === 'wraithwing' ? 14 : e.type === 'skitterling' ? 6 : e.type === 'bulwark' || e.type === 'ruinmaw' || e.type === 'dreadthorn' || e.type === 'thornback' ? 18 : d.fac === 'bloomhost' && !d.air ? 10 : d.air ? (e.type === 'razorwing' || e.type === 'cloudwing' ? 12 : e.type === 'needlewing' ? 8 : e.type === 'worldrender' ? 44 : 28) : e.type === 'rifle' || e.type === 'sniper' ? 9 : e.type === 'heavy' ? 15 : e.type === 'titan' ? 46 : 30);
    return;
  }
  if (e.slot >= 0 && side.slots[e.slot] === e) side.slots[e.slot] = null;
  if (e.type === 'bunker') { const dep = depotOf(g, e.side), n = g.nodes[e.node]; if (dep && n && n.owner === e.side) (dep.bk || (dep.bk = {}))[e.node] = g.t + BUNKER.rebuild; } // v2.32: back in 45 s if the node is still held
  for (let i = 0; i < 3; i++) { const w = P(e.u + fxRand(-e.half, e.half) * 0.6, e.v + fxRand(-e.half, e.half) * 0.6, fxRand(10, e.h * 0.7)); fxBoom(g, w.x, w.y, fxRand(36, 56)); }
  ev(g, { type: 'destroyed', side: e.side, name: bdOf(e).name, hq: e.type === 'hq', seen: visibleTo(g, 1 - e.side, e) });
  if (g.log) { logAdd(g.log.tot[e.side].bLost, e.type); lg(g, e.side, 'D', e.type, e.tier, by); }
  if (e.type === 'hq') {
    side.hqBy = by; side.hqT = g.t; // the match result is settled at the end of this tick (resolveEnd), never by code order
    for (let i = 0; i < 6; i++) { const w = P(e.u + fxRand(-50, 50), e.v + fxRand(-50, 50), fxRand(0, 100)); fxBoom(g, w.x, w.y, fxRand(50, 80)); }
  }
}

// Salvage (v2.30): every Last Fist side with a living unit or building within SALVAGE.r of the dead unit takes its share,
// each on its own (a mirror match can pay both). A "+N" pop-up goes into g.fx tagged with the salvaging side; only that
// side's player sees it, and only where they can see (scrapShown). Nothing else tells the opponent.
const newSalv = () => ({ tot: 0, m: -1, n: 0 }); // tot: the match total; m: the game minute n counts within
// Salvage counts what was actually paid for the unit (v2.32): temporary units (abilities, offspring) cost nothing and give
// nothing; a unit can carry its own paid price (e.paid, for later discounted units)
const paidOf = e => e.temp ? 0 : e.paid !== undefined ? e.paid : UDEF[e.type].cost.c;
// A side's finished, standing signature building of a role (Last Fist only until v2.33)
const sigOf = (g, s, type) => g.ents.find(e => e.kind === 'b' && e.side === s && e.type === type && e.built && e.hp > 0) || null;
const yardOf = (g, s) => facOf(g.sides[s].faction) === 'lastfist' ? sigOf(g, s, 'sigA') : null;
// Overdrive (Salvage Yard T3): on while its timer runs and the Yard still stands at T3
const overdrive = (g, s) => g.sides[s].od > g.t && (yardOf(g, s) || { tier: 0 }).tier >= 3;
function salvage(g, e, w) {
  if (!(SALVAGE.pct > 0)) return;
  const paid = paidOf(e);
  if (!(paid > 0)) return;
  for (let s = 0; s < 2; s++) {
    const sd = g.sides[s];
    if (facOf(sd.faction) !== 'lastfist' || !g.ents.some(f => f !== e && f.side === s && f.hp > 0 && effDist(e, f) <= SALVAGE.r)) continue;
    const y = yardOf(g, s), gain = Math.round(paid * (y ? YARD.pct : SALVAGE.pct)), cap = SALVAGE.cap * (y && y.tier >= 2 ? YARD.cap : 1);
    if (gain <= 0) continue;
    const S = sd.salv || (sd.salv = newSalv()), m = Math.floor(g.t / SALVAGE.per);
    if (S.m !== m) { S.m = m; S.n = 0; }
    const add = Math.min(gain, Math.max(0, cap - S.n));
    if (add < gain && y && y.tier >= 3) { // Overdrive: the overflow isn't wasted
      if (!(sd.od > g.t)) ev(g, { type: 'overdrive', side: s });
      sd.od = g.t + YARD.odDur;
      if (g.log) g.log.tot[s].od = (g.log.tot[s].od || 0) + 1;
    }
    if (add <= 0) continue;
    const en = y && y.tier >= 2 ? add * YARD.energy : 0;
    S.n += add; S.tot += add; sd.res.c += add; sd.res.e += en;
    if (g.log) { g.log.tot[s].salv = (g.log.tot[s].salv || 0) + add; if (en) g.log.tot[s].salvE = (g.log.tot[s].salvE || 0) + en; }
    statsIncome(g, s, add, en || 0); // v2.51: Salvage counts as gathered
    g.fx.push({ k: 'scrap', side: s, n: add, e: en, x: w.x, y: w.y, t: 0, life: 1.3 });
  }
}
const scrapShown = (g, f, s) => f.k === 'scrap' && f.side === s && g.fog[s].vis[cellOf(f.x)] === 1; // the pop-up's only viewer
function addPart(g, p) { p.max = p.life; if (g.parts.length < 520) g.parts.push(p); }
function fxBoom(g, x, y, size) {
  g.fx.push({ k: 'boom', x, y, r: size, t: 0, life: 0.3 + size / 110 });
  const n = Math.min(16, 4 + (size / 4 | 0));
  for (let i = 0; i < n; i++) {
    const a = fxRand(-Math.PI, 0), sp = fxRand(40, 130) * size / 30;
    addPart(g, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: fxRand(0.25, 0.7), size: fxRand(1.2, 2.6) * Math.max(1, size / 24), color: i % 3 ? '#ffb347' : '#fff1a8', grav: 240 });
  }
  for (let i = 0; i < n / 2; i++)
    addPart(g, { x: x + fxRand(-size / 3, size / 3), y: y - fxRand(0, size / 3), vx: fxRand(-14, 14), vy: fxRand(-32, -8), life: fxRand(0.8, 1.5), size: fxRand(3, 7) * Math.max(1, size / 30), smoke: true, grav: -8 });
  if (size > 40 && (!g.fog || g.fog[0].vis[cellOf(x)])) g.shake = Math.max(g.shake, size / 14); // only for blasts the player can see
}
function updateFx(g, dt) {
  if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 18);
  for (const p of g.parts) {
    p.life -= dt;
    p.vy += (p.grav || 0) * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.smoke) p.vx *= 0.98;
  }
  g.parts = g.parts.filter(p => p.life > 0);
  for (const f of g.fx) f.t += dt;
  g.fx = g.fx.filter(f => f.t < f.life);
}

