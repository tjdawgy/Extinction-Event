/* ---------- Fog of war ----------
   Each side sees full-depth strips of the lane around its own units, buildings and held field nodes.
   Depth counts for little in range (DV_W), so strips match how far things can actually shoot. */
let FOG_CELL, FOG_NX, FOG_Y0, FOG_NY, FOG_N, cellOf; // v2.63: a grid map has rows too (MAP_2D); v2.65: per map (MAP_HOOKS)
const mapFog = () => {
  FOG_CELL = MAP_2D ? MAP.fogCell || 20 : 10; FOG_NX = Math.ceil(L / FOG_CELL) + 1;
  FOG_Y0 = -MAP.size.h / 2; FOG_NY = MAP_2D ? Math.ceil(MAP.size.h / FOG_CELL) + 1 : 1; FOG_N = FOG_NX * FOG_NY;
  cellOf = MAP_2D ? (u, v = 0) => fogRow(v) * FOG_NX + fogCol(u) : u => clamp(Math.floor(u / FOG_CELL), 0, FOG_N - 1); // v: depth (grid maps only)
};
mapFog(); MAP_HOOKS.push(mapFog);
const SIGHT = { rifle: 170, heavy: 180, sniper: 220, tank: 210, artillery: 200, titan: 240, flame: 190, hydra: 260, aircraft: 260, interceptor: 280, leviathan: 220, medic: 220, drone: 420, skitterling: 170, mite: 150, bulwark: 190, razorwing: 250, leaper: 180, ravager: 190, spitter: 190, bilecaster: 230, bilelobber: 200, ruinmaw: 240, thornback: 190, dreadthorn: 220, needlewing: 220, cloudwing: 230, broodtyrant: 230, worldrender: 220, shardling: 170, bastion: 200, wraithwing: 250, riftstalker: 180, parallax: 190, lancer: 200, marksman: 230, riftmortar: 200, worldbreaker: 240, gravemantle: 200, eventide: 220, prismwing: 220, shardstorm: 240, voidcarrier: 230, sovereign: 220 };
const B_SIGHT = { hq: 520, turret: 340 }, B_SIGHT_DEF = 200, NODE_SIGHT = 220; // HQ 520 ≥ its T3 range (470)
const INTEL_TTL = 45, THREAT_MEMORY = 5, SPOT_GAP = 10;
const fogRow = v => { const r = Math.floor((v - FOG_Y0) / FOG_CELL); return r < 0 ? 0 : r >= FOG_NY ? FOG_NY - 1 : r; };
const fogCol = u => { const c = Math.floor(u / FOG_CELL); return c < 0 ? 0 : c >= FOG_NX ? FOG_NX - 1 : c; }; // v2.67: grid maps, inlined (the fog is most of a Two-Lane tick)
const sightOf = e => e.kind === 'u' ? SIGHT[e.type] : (B_SIGHT[e.type] || B_SIGHT_DEF);
const ghostOf = b => ({ id: b.id, type: b.type, fac: b.fac, side: b.side, slot: b.slot, tier: b.tier, path: b.path, u: b.u, v: b.v, half: b.half }); // path: the last-seen upgrade-tree path; fac: its faction (v2.17)
function newFog(g, s) {
  const ehq = g.sides[1 - s].hq, f = { vis: new Uint8Array(FOG_N), exp: new Uint8Array(FOG_N), seen: new Uint8Array(FOG_N), ghosts: {}, intel: {}, creep: {}, field: {}, // creep: the enemy's creep as last seen (v2.18); field: its power field (v2.26)
    lastHQ: { hp: ehq.hp, maxHp: ehq.maxHp, shielded: false, tier: 1 }, lastSpot: -99, seenUnits: 0 };
  // Start positions are known: the enemy HQ begins as a ghost on explored ground, but not what it looks like (v2.17: its
  // faction stays hidden until seen). seen: ground actually in view at some point; explored-only ground shows no pads.
  f.ghosts[ehq.id] = Object.assign(ghostOf(ehq), { fac: null });
  if (MAP_2D) { for (let r = fogRow(ehq.v - ehq.half - 40); r <= fogRow(ehq.v + ehq.half + 40); r++) for (let i = cellOf(ehq.u - ehq.half - 40, FOG_Y0 + r * FOG_CELL); i <= cellOf(ehq.u + ehq.half + 40, FOG_Y0 + r * FOG_CELL); i++) f.exp[i] = 1; }
  else for (let i = cellOf(ehq.u - ehq.half - 40); i <= cellOf(ehq.u + ehq.half + 40); i++) f.exp[i] = 1;
  return f;
}
function cellsLit(vis, u, half, v = 0, vh = half) { // v, vh: depth and its half-height, on a grid map (v2.63)
  if (!MAP_2D) { for (let i = cellOf(u - half); i <= cellOf(u + half); i++) if (vis[i]) return true; return false; }
  const r1 = fogRow(v + vh), c0 = fogCol(u - half), c1 = fogCol(u + half);
  for (let r = fogRow(v - vh); r <= r1; r++) { const b = r * FOG_NX; for (let i = b + c0; i <= b + c1; i++) if (vis[i]) return true; }
  return false;
}
// The vision rule, kept apart from weapon range: can side s see entity e right now?
function visibleTo(g, s, e) {
  if (e.side === s) return true;
  return cellsLit(g.fog[s].vis, e.u, e.kind === 'b' ? e.half : 0, e.v);
}
function updateVision(g) {
  for (let s = 0; s < 2; s++) {
    const f = g.fog[s], vis = f.vis, exp = f.exp;
    vis.fill(0);
    const reveal = MAP_2D ? (u, r, v) => { // v2.63: a circle of sight, a span per row
      for (let row = fogRow(v - r), r1 = fogRow(v + r); row <= r1; row++) { const y = FOG_Y0 + row * FOG_CELL + FOG_CELL / 2, dy = y - v; if (dy > r || dy < -r) continue; const dx = Math.sqrt(r * r - dy * dy), b = row * FOG_NX; vis.fill(1, b + fogCol(u - dx), b + fogCol(u + dx) + 1); }
    } : (u, r) => { for (let i = cellOf(u - r), b = cellOf(u + r); i <= b; i++) vis[i] = 1; };
    for (const e of g.ents) if (e.side === s && e.hp > 0) reveal(e.u, sightOf(e), e.v);
    for (const n of g.nodes) if (n.owner === s) reveal(n.u, n.sight || NODE_SIGHT, n.v); // v2.65: a watchtower sees further
    for (let i = 0; i < FOG_N; i++) if (vis[i]) exp[i] = f.seen[i] = 1;
    // Remember what is in view; forget remembered things whose spot is in view but empty
    const seenB = new Set(), seenU = new Set();
    for (const e of g.ents) {
      if (e.side === s || e.hp <= 0 || !visibleTo(g, s, e)) continue;
      if (e.kind === 'b') {
        seenB.add(e.id); f.ghosts[e.id] = ghostOf(e);
        if (e.type === 'hq') f.lastHQ = { hp: e.hp, maxHp: e.maxHp, shielded: !!e.shielded, tier: e.tier };
      } else { seenU.add(e.id); f.intel[e.id] = MAP_2D ? { type: e.type, u: e.u, v: e.v, t: g.t } : { type: e.type, u: e.u, t: g.t }; } // v: grid maps (v2.63)
    }
    for (const id in f.ghosts) { const gh = f.ghosts[id]; if (!seenB.has(gh.id) && cellsLit(vis, gh.u, gh.half, gh.v)) delete f.ghosts[id]; }
    // Enemy creep: remembered as last seen; any part of a patch in view updates it, a patch gone from a spot in view is forgotten
    const ec = g.creep[1 - s], live = new Set();
    for (const p of ec) { live.add(p.k); if (p.r > 0 && cellsLit(vis, p.u, p.r, p.v)) f.creep[p.k] = { u: p.u, v: p.v, r: p.r }; }
    for (const k in f.creep) { const m = f.creep[k]; if (!live.has(k) && cellsLit(vis, m.u, m.r, m.v)) delete f.creep[k]; }
    const ef = g.field[1 - s], liveF = new Set(); // the enemy's power field (v2.26): remembered the same way
    for (const p of ef) { liveF.add(p.k); if (p.r > 0 && cellsLit(vis, p.u, p.r, p.v)) f.field[p.k] = { u: p.u, v: p.v, r: p.r }; }
    for (const k in f.field) { const m = f.field[k]; if (!liveF.has(k) && cellsLit(vis, m.u, m.r, m.v)) delete f.field[k]; }
    for (const id in f.intel) { const m = f.intel[id]; if (g.t - m.t > INTEL_TTL || (!seenU.has(+id) && vis[cellOf(m.u, m.v)])) delete f.intel[id]; }
    if (!f.seenUnits && seenU.size && g.t - f.lastSpot >= SPOT_GAP) { f.lastSpot = g.t; ev(g, { type: 'spotted', side: s }); }
    f.seenUnits = seenU.size;
  }
}

function update(g, dt) {
  RNG.g = g; // v2.50
  updateFx(g, dt);
  if (g.over) return;
  refreshShields(g);
  updateVision(g);
  if (g.countdown > 0) { // GET READY: orders can be queued, but nothing progresses and the AI waits
    g.countdown = g.countdown - dt > 1e-9 ? g.countdown - dt : 0; // snap float residue so GO lands on time
    if (g.countdown === 0) ev(g, { type: 'go' });
    return;
  }
  const t0 = g.t;
  g.t += dt;
  for (let s = 0; s < 2; s++) {
    const inc = income(g, s), side = g.sides[s];
    side.res.c += inc.c * dt; side.res.e += inc.e * dt; side.stats.earned = (side.stats.earned || 0) + inc.c * dt;
    if (g.log) { const E = g.log.tot[s].earn; E[0] += inc.c * dt; E[1] += inc.e * dt; }
    statsIncome(g, s, inc.c * dt, inc.e * dt); // v2.51
    side.buff = g.ents.some(b => b.side === s && b.type === 'techlab' && b.hp > 0 && pathMod(b, 'nanoweave')); // v2.15: Support T3 only
  }
  updateNodes(g, dt);
  updateBunkers(g); // v2.32: right after node ownership changes
  logTick(g, dt);
  statsTick(g); // v2.51
  const foes = [[], []]; // foes[s] = everything hostile to side s
  g.front = [null, null];
  for (const e of g.ents) {
    if (e.hp <= 0) continue;
    foes[1 - e.side].push(e);
    if (e.kind === 'u' && e.type !== 'interceptor' && !UDEF[e.type].support) { // escorts and support units don't set the front
      const f = g.front[e.side];
      if (f === null || (e.side === 0 ? e.u > f : e.u < f)) g.front[e.side] = e.u;
    }
  }
  indexFoes(foes[0], dt); indexFoes(foes[1], dt); // v2.37: lane-sorted, so target searches look only near the searcher
  const n = g.ents.length; NAV.now = g.t; // v2.65: the clock the navigation paths age by
  for (let i = 0; i < n; i++) {
    const e = g.ents[i];
    if (e.hp <= 0) continue;
    if (e.kind === 'b') updateBuilding(g, e, foes[e.side], dt); else { updateUnit(g, e, foes[e.side], dt); if (NAV.on && e.hp > 0 && !UDEF[e.type].air && !e.leaping && navShut(e.u, e.v)) navEject(e); } // v2.65: never inside a wall
  }
  updateProjs(g, dt);
  updateMedics(g, dt);
  bunkerHeal(g, dt);
  updateCreep(g, dt);
  updateField(g, dt);
  updateWarps(g);
  updateAuras(g);
  updateShields(g, dt);
  updateAcid(g, dt);
  updateTemps(g);
  updateSpawn(g);
  updateMounds(g); // v2.33
  updateRoots(g);
  updateAbilities(g, dt);
  if (Math.floor(g.t * 2) !== Math.floor(t0 * 2)) { updateOrders(g); if (MECH7C.on) updateRallyWait(g); }
  updateStorm(g, dt, t0);
  aiUpdate(g, 1, dt); aiSpotter(g, 1);
  if (g.auto) { aiUpdate(g, 0, dt); aiSpotter(g, 0); }
  if (g.ents.some(e => e.hp <= 0)) g.ents = g.ents.filter(e => e.hp > 0);
  resolveEnd(g);
}

function updateNodes(g, dt) {
  for (const n of g.nodes) {
    let c0 = 0, c1 = 0;
    let w0 = 0, w1 = 0; // capture weight: a Drilled Rifleman counts 1.5
    for (const e of g.ents) if (e.kind === 'u' && e.hp > 0 && !UDEF[e.type].air && !UDEF[e.type].noCap && (MAP_2D ? Math.hypot(e.u - n.u, e.v - n.v) : Math.abs(e.u - n.u)) <= (n.r || NODE_R)) { const w = e.vet ? DRILL.capture : 1; if (e.side === 0) { c0++; w0 += w; } else { c1++; w1 += w; } }
    n.c = [c0, c1];
    if (c0 && !c1) n.prog = Math.min(100, n.prog + 8 * Math.sqrt(w0) * dt);
    else if (c1 && !c0) n.prog = Math.max(-100, n.prog - 8 * Math.sqrt(w1) * dt);
    let o = n.owner;
    if (n.prog >= 100) o = 0; else if (n.prog <= -100) o = 1;
    else if ((o === 0 && n.prog <= 0) || (o === 1 && n.prog >= 0)) o = null;
    if (o !== n.owner) {
      ev(g, { type: 'node', side: o === null ? n.owner : o, lost: o === null });
      if (g.log) { const sd = o === null ? n.owner : o; g.log.tot[sd][o === null ? 'nodeLost' : 'nodeCap']++; lg(g, sd, o === null ? 'L' : 'N', n.id); }
      n.owner = o;
    }
  }
}

/* ---------- Fortification Depot (v2.32): a bunker on every field node a Last Fist side holds ----------
   While the side has a finished, standing Depot, each node it holds has one bunker (placed at once when the node is taken
   or the Depot finishes). A node that changes owner loses its bunker; a bunker destroyed while its node is still held comes
   back after BUNKER.rebuild seconds (the timer lives on the Depot, dep.bk[node id]); no Depot, no bunkers. */
const depotOf = (g, s) => facOf(g.sides[s].faction) === 'lastfist' ? sigOf(g, s, 'sigB') : null;
function razeBunker(g, b) { kill(g, b, -1); }
function mkBunker(g, s, n, tier) {
  const b = mkBuilding(g, s, 'bunker', -1);
  b.u = n.u - dirOf(s) * BUNKER.side; b.v = -BUNKER.back; b.node = n.id;
  b.built = true; b.progress = 1; b.tier = tier; b.hp = b.maxHp;
  return b;
}
function updateBunkers(g) {
  for (let s = 0; s < 2; s++) {
    if (facOf(g.sides[s].faction) !== 'lastfist') continue;
    const dep = depotOf(g, s), mine = g.ents.filter(e => e.type === 'bunker' && e.side === s && e.hp > 0);
    if (!dep) { for (const b of mine) razeBunker(g, b); continue; }
    const bk = dep.bk || (dep.bk = {});
    for (const n of g.nodes) {
      if (n.type) continue; // v2.65: bunkers stand on income nodes only (not watchtowers or forward pads)
      const b = mine.find(x => x.node === n.id);
      if (n.owner !== s) { if (b) razeBunker(g, b); delete bk[n.id]; continue; }
      if (b) { b.tier = dep.tier; continue; } // upgrades apply at once
      if (bk[n.id] === undefined || g.t >= bk[n.id]) { mkBunker(g, s, n, dep.tier); delete bk[n.id]; }
    }
  }
}
// T2+: each bunker heals friendly Barracks units within its gun's range; a unit takes one bunker heal, minus any faster heal
// it already gets this tick (a Medicopter), like the other heals. Runs after updateMedics.
function bunkerHeal(g, dt) {
  for (const b of g.ents) {
    if (b.type !== 'bunker' || b.hp <= 0 || b.tier < 2) continue;
    const r = BDEF.bunker.gun[b.tier].range;
    for (const e of g.ents) {
      if (e.kind !== 'u' || e.side !== b.side || e.hp <= 0 || e.bkAt === g.t || UDEF[e.type].from !== 'barracks' || UDEF[e.type].fac || effDist(b, e) > r) continue;
      e.bkAt = g.t;
      const rate = BUNKER.heal - (e.medAt === g.t ? UDEF.medic.heal : 0);
      if (rate > 0 && e.hp < e.maxHp) { const h0 = e.hp; e.hp = Math.min(e.maxHp, e.hp + e.maxHp * rate * dt); if (g.log) g.log.tot[e.side].bkHeal = (g.log.tot[e.side].bkHeal || 0) + e.hp - h0; }
    }
  }
}

function tryRepair(g, s, b) {
  const d = bdOf(b), side = g.sides[s];
  if (g.over) return { ok: false, msg: 'The match is over' };
  if (g.countdown > 0) return WAIT_GO;
  if (!b.built) return { ok: false, msg: `${d.name} is still under construction` };
  if (d.noPad) return { ok: false, msg: `The ${d.name} can’t be repaired: a destroyed one is rebuilt for free` };
  const missing = b.maxHp - b.hp - (b.repair || 0);
  if (missing < 1) return { ok: false, msg: `${d.name} is already being fully repaired` };
  const cost = repairCost(b);
  if (side.res.c < cost) return { ok: false, msg: `Need ${Math.ceil(cost - side.res.c)} more credits` };
  side.res.c -= cost; b.repair = (b.repair || 0) + missing;
  logSpend(g, s, 'rep', cost, 0);
  return { ok: true, msg: `Repairing ${d.name}` };
}
const repairCost = b => Math.ceil(Math.max(0, b.maxHp - b.hp - (b.repair || 0)) * 0.3);

function updateBuilding(g, b, foes, dt) {
  const d = bdOf(b);
  b.anim += dt;
  if (b.hitT > 0) b.hitT -= dt;
  if (!b.built) {
    const dp = dt / d.time;
    b.progress = Math.min(1, b.progress + dp);
    b.hp = Math.min(b.maxHp, b.hp + b.maxHp * 0.85 * dp);
    if (b.progress >= 1) { b.built = true; ev(g, { type: 'built', side: b.side, name: d.name }); if (g.log) { logAdd(g.log.tot[b.side].bBuilt, b.type); lg(g, b.side, 'F', b.type, b.id); } }
    return;
  }
  // Paid repair is fast; after a quiet spell every building also slowly patches itself up
  if (b.repair > 0) {
    const h = Math.min(b.repair, b.maxHp * 0.06 * (g.t >= EXT.start ? EXT.repairMul : 1) * dt, b.maxHp - b.hp); // half rate in the storm
    b.hp += h; b.repair -= h;
    if (b.hp >= b.maxHp - 0.01) b.repair = 0;
    if (fxRnd() < dt * 6) { const w = P(b.u + fxRand(-b.half, b.half) * 0.6, b.v + fxRand(-b.half, b.half) * 0.6, b.h * fxRand(0.2, 0.9)); addPart(g, { x: w.x, y: w.y, vx: fxRand(-8, 8), vy: fxRand(-30, -10), life: 0.5, size: 1.6, color: '#7dffb0', grav: 0 }); }
  } else if (!b.maxShp && g.t < EXT.start && g.t - (b.lastHit ?? -99) > REGEN_DELAY && b.hp < b.maxHp) b.hp = Math.min(b.maxHp, b.hp + b.maxHp * 0.01 * dt);
  if (b.upgrading) {
    const up = d.up[b.tier + 1];
    b.upProg = Math.min(1, b.upProg + dt / up.time);
    if (b.upProg >= 1) {
      const old = b.maxHp;
      b.tier++; b.maxHp = d.hp * hpMul(d, b.tier); b.hp = Math.min(b.maxHp, b.hp + b.maxHp - old);
      if (b.maxShp) b.maxShp = d.shp * hpMul(d, b.tier); // Axiarch shields grow with the tier and recharge
      if (b.upPath) { b.path = b.upPath; b.upPath = null; }
      b.upgrading = false; b.upProg = 0;
      ev(g, { type: 'upgraded', side: b.side, name: d.name, tier: b.tier });
      if (g.log) { g.log.tot[b.side].bUp++; lg(g, b.side, 'V', b.type, b.tier, b.id); }
    }
  }
  if (b.queue.length) {
    b.prodT += g.sides[b.side].od > g.t && overdrive(g, b.side) ? dt * (1 + YARD.od) : dt; // Overdrive (v2.32): Last Fist only
    const ut = b.queue[0], pair = ut === 'rifle' && b.queue[1] === 'rifle' && pathMod(b, 'pairs');
    if (b.prodT >= UDEF[ut].time * (pair ? PAIR_TIME : 1)) {
      b.prodT = 0; b.queue.shift();
      const n = pair ? 2 : 1; // Mass Deployment: two Riflemen at a time
      if (n === 2) b.queue.shift();
      for (let i = 0; i < n; i++) {
        const fr = fwdRally(g, b.side, b); // v2.68: a forward Barracks sends its units to its lane's Forward flag
        if (facOf(b.fac) === 'axiarchs') { if (fr) g.warps.push({ side: b.side, type: ut, u: fr.u + rand(-12, 12), v: fr.v + rand(-20, 20), t0: g.t, end: g.t + WARP.ch, fwd: fr }); else startWarp(g, b.side, ut); continue; } // Axiarchs (v2.26): the unit warps in at the warp point instead
        const nu = fr ? spawnUnit(g, b.side, ut, fr.u + rand(-12, 12), fr.v + rand(-20, 20)) : spawnUnit(g, b.side, ut, b.u + dirOf(b.side) * (b.half + 10), b.v + rand(-12, 12) + i * 16);
        if (fr) { nu.lane = fr.lane; nu.fwdHome = { u: fr.u, n: fr.n }; nu.laneV = clamp(nu.v - fr.v, -LANE_V, LANE_V); }
        if (ut === 'rifle' && pathMod(b, 'drill')) { nu.vet = 1; nu.maxHp = nu.hp = UDEF.rifle.hp * DRILL.hp; } // Drilled Riflemen
        if (g.log) { logAdd(g.log.tot[b.side].trained, ut); lgUnit(g, b.side, 'T', ut); }
      }
    }
  }
  if (b.type === 'refinery' && fxRnd() < dt * 2.2) {
    const w = P(b.u, b.v - 32 * BS, (50 + (b.tier >= 3 ? 10 : 0)) * BS);
    addPart(g, { x: w.x, y: w.y, vx: fxRand(-4, 4), vy: fxRand(-22, -12), life: fxRand(1.2, 2), size: fxRand(3, 5), smoke: true, light: true, grav: -4 });
  }
  if (b.hp < b.maxHp * 0.5 && fxRnd() < dt * 3) {
    const w = P(b.u + fxRand(-b.half, b.half), b.v + fxRand(-b.half, b.half), b.h * fxRand(0.3, 0.7));
    addPart(g, { x: w.x, y: w.y, vx: fxRand(-6, 6), vy: fxRand(-28, -14), life: fxRand(1, 1.8), size: fxRand(4, 7), smoke: true, grav: -6 });
  }
  const gun = d.gun && d.gun[b.tier];
  if (gun) {
    if (b.cd > 0) b.cd -= dt;
    const { best } = acquire(g, b, gun, foes);
    if (best) {
      b.aim = { u: best.u, v: best.v, z: aimZ(best) };
      if (b.cd <= 0) { fire(g, b, best, gun); if (gun.split) for (const e of extraTargets(g, b, gun, foes, best, gun.split - 1)) fire(g, b, e, gun); b.cd = gun.cd; }
    }
  }
}
// Split Lattice (v2.25): up to n more targets this gun could hit besides the first, nearest first (reused by later chain weapons)
function extraTargets(g, src, def, foes, first, n) {
  const out = [];
  for (const e of foes) {
    if (e === first || e.hp <= 0 || e.shielded || !visibleTo(g, src.side, e)) continue;
    const air = e.kind === 'u' && !!UDEF[e.type].air;
    if (air ? !def.hitsAir : def.hitsGround === false) continue;
    if (!DMG[def.weapon][e.kind === 'b' ? 'building' : UDEF[e.type].armor]) continue;
    const d = effDist(src, e); if (d <= def.range) out.push([d, e]);
  }
  return out.sort((a, b) => a[0] - b[0]).slice(0, n).map(x => x[1]);
}
// The Shardstorm's chain (v2.29): from the struck target to the nearest enemy within chain.r of it that the beam may hit (the
// Split Lattice target rules, extraTargets), up to chain.n jumps, each chain.fall weaker; never the same enemy twice, never a building
function chainBeam(g, src, first, def) {
  const C = def.chain, hit = [first], foes = g.ents.filter(e => e.side !== src.side && e.hp > 0 && e.kind === 'u'); // units only: the beam itself may hit a building (v2.31), its jumps never
  let cur = first, mul = 1;
  for (let i = 0; i < C.n; i++) {
    const next = extraTargets(g, { u: cur.u, v: cur.v, side: src.side }, { ...def, range: C.r }, foes.filter(e => !hit.includes(e)), cur, 1)[0];
    if (!next) break;
    mul *= C.fall; hit.push(next);
    const a = P(cur.u, cur.v, aimZ(cur)), b = P(next.u, next.v, aimZ(next));
    damage(g, next, def.dmg * mul * (g.sides[src.side].buff ? NANO.dmg : 1) * outMul(g, src), def.weapon, src.side, src);
    g.fx.push({ k: 'beam', x: a.x, y: a.y, x2: b.x, y2: b.y, t: 0, life: 0.2, w: 1.6 * mul });
    cur = next;
  }
  return hit.slice(1);
}
// Axiarch shields (v2.25) recharge after SHIELD.delay seconds without damage; they never restore HP
function updateShields(g, dt) {
  for (const e of g.ents) {
    if (!e.maxShp || e.hp <= 0 || e.shp >= e.maxShp || !(e.kind === 'u' || e.built)) continue;
    if (e.surgeT > g.t) { e.shp = Math.min(e.maxShp, e.shp + e.maxShp * UDEF[e.type].surge.rate * dt); continue; } // P6 (v2.37): a Bastion's shield surge, even under fire
    if (e.ovT > g.t) { const s0 = e.shp; e.shp = Math.min(e.maxShp, e.shp + e.maxShp * ABIL.overcharge.regen * dt); logEffect(g, e.side, 'overcharge', 0, e.shp - s0); continue; } // Shield Overcharge (v2.28): fast regen even under fire; shields only, never HP
    if (g.t - e.shpT >= SHIELD.delay) e.shp = Math.min(e.maxShp, e.shp + e.maxShp * (onField(g, e.side, e.u, e.v) ? FIELD.regen : SHIELD.rate) * dt); // faster inside the field (v2.26)
  }
}

// Lane-style range: sideways spread counts for less, so units can't slip past each other
function effDist(a, b) { return Math.max(0, Math.hypot(a.u - b.u, (a.v - b.v) * DV_W) - (b.kind === 'b' ? b.half : 0)); }

// Targeting index (v2.37, audit phase 3b). Each tick, both hostile lists are indexed: units sorted by lane position (u),
// buildings kept apart (few, and wide). A search looks only at units whose u could be within reach: |du| ≤ range + how far
// anything can move during the tick (IX_SPEED: above every unit's speed with creep and Frenzy, and every leap). effDist is
// never less than |du| (a unit has no half), so nothing in range is skipped; every cheap check is exact and ties go to the
// earlier entry in the list, as the plain scan did, so every match plays exactly as before. A list without an index (none
// today) is scanned in full.
// v2.69 (a): the target-score bonus an AI base attack gives a building: the HQ once its shield is down, then what holds the
// shield up (the base's buildings; with BREAK.prod, production buildings most)
const bbFocus = e => e.type === 'hq' ? BREAK.ai.hqFocus : e.type === 'bunker' || e.slot >= FWD_SLOT ? 0 : BREAK.ai.focus + (BREAK.prod.on && BREAK.prod.roles.includes(e.type) ? 40 : 0);
const IX_SPEED = 600;
function indexFoes(list, dt) {
  const ord = [], bs = [];
  for (let i = 0; i < list.length; i++) (list[i].kind === 'b' ? bs : ord).push(i);
  ord.sort((a, b) => list[a].u - list[b].u || a - b);
  const us = new Float64Array(ord.length);
  for (let i = 0; i < ord.length; i++) us[i] = list[ord[i]].u;
  list.ix = { ord, us, bs, slack: IX_SPEED * dt + 2 };
}
// One indexed search (scan): the best target within reach R (air: AR), and whether anything visible is inside minRange
function ixScan(g, src, def, foes, R, AR, minR) {
  const X = foes.ix, vis = g.fog[src.side].vis, side = src.side, su = src.u, sv = src.v, maxR = Math.max(R, AR);
  let best = null, bs = 1e9, bi = -1, close = false;
  const bbf = src.kind === 'u' && g.sides[side].bbOn; // v2.69 (a): an AI base attack aims at what holds the shield up
  const check = idx => {
    const e = foes[idx];
    if (e.hp <= 0 || e.shielded || e.phT > g.t) return; // a phased Wraithwing can't be targeted (P13, v2.37)
    const bh = e.kind === 'b' ? e.half : 0, du = Math.abs(e.u - su);
    if (du - bh > maxR) return; // effDist ≥ |du| − half
    const dv = (e.v - sv) * DV_W, lim = maxR + bh + 1;
    if (du * du + dv * dv > lim * lim) return; // safely beyond reach (the exact distance is taken below)
    if (e.side !== side) { if (MAP_2D) { if (!cellsLit(vis, e.u, bh, e.v)) return; } else { let lit = false; for (let c = cellOf(e.u - bh), c1 = cellOf(e.u + bh); c <= c1; c++) if (vis[c]) { lit = true; break; } if (!lit) return; } } // visibleTo
    const ud = e.kind === 'u' ? UDEF[e.type] : null, air = !!(ud && ud.air);
    if (air ? !def.hitsAir : def.hitsGround === false) return;
    const dist = effDist(src, e);
    if (dist > (air && AR ? AR : R)) return;
    if (dist < minR) { close = true; return; }
    const mult = DMG[def.weapon][ud ? ud.armor : 'building'];
    if (!mult) return;
    const sc = dist + (e.kind === 'b' ? 80 : 0) - (mult - 1) * 45 - (1 - e.hp / e.maxHp) * 25 - (air && def.preferAir ? 400 : 0) - (e.kind === 'b' && def.preferB ? 280 : 0) - (bbf && e.kind === 'b' ? bbFocus(e) : 0);
    if (sc < bs || (sc === bs && idx < bi)) { bs = sc; best = e; bi = idx; }
  };
  for (const idx of X.bs) check(idx);
  const reach = maxR + X.slack, lo = su - reach, hi = su + reach, us = X.us;
  let a = 0, b = us.length; while (a < b) { const m = (a + b) >> 1; if (us[m] < lo) a = m + 1; else b = m; }
  for (let k = a; k < us.length && us[k] <= hi; k++) check(X.ord[k]);
  return { best, close };
}
// chase (melee, v2.37): when nothing is in weapon range, also the best target within chase range (prey), as the second
// search { ...def, range: chase } would find it
function acquire(g, src, def, foes, chase) {
  if (foes.ix) {
    const minR = def.minRange || 0, r = ixScan(g, src, def, foes, def.range, def.airRange || 0, minR);
    if (chase) r.prey = r.best || r.close ? null : ixScan(g, src, def, foes, chase, def.airRange || 0, minR).best;
    return r;
  }
  let best = null, bs = 1e9, close = false;
  const minR = def.minRange || 0;
  for (const e of foes) {
    if (e.hp <= 0 || e.shielded || e.phT > g.t) continue; // don't waste shots on a shielded HQ (or a phased Wraithwing, v2.37)
    if (!visibleTo(g, src.side, e)) continue; // auto-target only what your side can see (spotters needed beyond sight)
    const air = e.kind === 'u' && !!UDEF[e.type].air;
    if (air ? !def.hitsAir : def.hitsGround === false) continue;
    const dist = effDist(src, e);
    if (dist > (air && def.airRange ? def.airRange : def.range)) continue;
    if (dist < minR) { close = true; continue; }
    // prefer units over buildings, targets this weapon counters, and wounded targets
    const mult = DMG[def.weapon][e.kind === 'b' ? 'building' : UDEF[e.type].armor];
    if (!mult) continue; // this weapon can't hurt it (e.g. Turret gatling vs buildings)
    const sc = dist + (e.kind === 'b' ? 80 : 0) - (mult - 1) * 45 - (1 - e.hp / e.maxHp) * 25 - (air && def.preferAir ? 400 : 0) - (e.kind === 'b' && def.preferB ? 280 : 0) - (src.kind === 'u' && e.kind === 'b' && g.sides[src.side].bbOn ? bbFocus(e) : 0); // v2.69 (a) // the Hydra goes for aircraft first, the Leviathan for buildings
    if (sc < bs) { bs = sc; best = e; }
  }
  return { best, close };
}

