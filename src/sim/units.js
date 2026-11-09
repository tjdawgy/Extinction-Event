/* ---------- Unit micro controls (v2.12) ----------
   Orders for a group (Infantry, Armor, Air), a unit type, or the whole army (Regroup with nothing selected). An order
   overrides the global stance for the units it covers; where a group and a type order both cover a unit, the most
   recent wins (order.n counts up). A global stance clears them all. 'move' (Regroup) walks to a point, fighting what
   it meets on the way like any stance, then holds there; its flag is done once every unit it covers has arrived. */
const UGROUPS = { inf: ['rifle', 'heavy', 'sniper', 'skitterling', 'mite', 'leaper', 'ravager', 'spitter', 'bilecaster', 'shardling', 'riftstalker', 'parallax', 'lancer', 'marksman'], arm: ['tank', 'artillery', 'titan', 'flame', 'hydra', 'bulwark', 'bilelobber', 'ruinmaw', 'thornback', 'dreadthorn', 'bastion', 'riftmortar', 'worldbreaker', 'gravemantle', 'eventide'], air: ['aircraft', 'interceptor', 'leviathan', 'razorwing', 'needlewing', 'cloudwing', 'broodtyrant', 'worldrender', 'wraithwing', 'prismwing', 'shardstorm', 'voidcarrier', 'sovereign'], sup: ['medic', 'drone'] }; // v2.18: Bloomhost units join the groups
const GROUP_NAME = { inf: 'Infantry', arm: 'Armor', air: 'Air', sup: 'Support' };
const GROUP_OF = {}; for (const k in UGROUPS) for (const t of UGROUPS[k]) GROUP_OF[t] = k;
const ORDER_NAME = { hold: 'Hold', attack: 'Attack', retreat: 'Retreat', move: 'Regroup' };
const PLURAL = { rifle: 'Riflemen', heavy: 'Heavies', sniper: 'Snipers', tank: 'Tanks', artillery: 'Artillery', titan: 'Titans', flame: 'Flame Tanks', hydra: 'Hydras', aircraft: 'Gunships', interceptor: 'Interceptors', leviathan: 'Leviathans', medic: 'Medicopters', drone: 'Recon Drones', skitterling: 'Skitterlings', mite: 'Mites', bulwark: 'Bulwarks', razorwing: 'Razorwings', leaper: 'Leapers', ravager: 'Ravagers', spitter: 'Spitters', bilecaster: 'Bilecasters', bilelobber: 'Bile Lobbers', ruinmaw: 'Ruinmaws', thornback: 'Thornbacks', dreadthorn: 'Dreadthorns', needlewing: 'Needlewings', cloudwing: 'Cloudwings', broodtyrant: 'Brood Tyrants', worldrender: 'Worldrenders', shardling: 'Shardlings', bastion: 'Bastions', wraithwing: 'Wraithwings', riftstalker: 'Riftstalkers', parallax: 'Parallaxes', lancer: 'Lancers', marksman: 'Astral Marksmen', riftmortar: 'Rift Mortars', worldbreaker: 'Worldbreakers', gravemantle: 'Gravemantles', eventide: 'Eventides', prismwing: 'Prismwings', shardstorm: 'Shardstorms', voidcarrier: 'Voidcarriers', sovereign: 'Astral Sovereigns' };
const newOrders = () => ({ all: null, groups: {}, types: {}, n: 0 });
function unitOrder(side, type, lane) { // the order a unit of this type follows, or null for the global stance; lane: its lane (v2.63)
  const O = side.orders; if (!O) return null;
  let best = O.all; const gr = O.groups[GROUP_OF[type]], ty = O.types[type], ln = lane != null && O.lanes ? O.lanes[lane] : null;
  if (ln && (!best || ln.n > best.n)) best = ln;
  if (gr && (!best || gr.n > best.n)) best = gr;
  if (ty && (!best || ty.n > best.n)) best = ty;
  return best;
}
const orderCovers = (scope, key, type, lane) => scope === 'all' || (scope === 'lane' ? lane === key : scope === 'group' ? GROUP_OF[type] === key : type === key);
const slotOf = (u, o) => [o.u + ((u.id * 37) % 9 - 4) * 9, o.v + ((u.id * 53) % 9 - 4) * 7]; // a spread spot around the flag, fixed per unit
function giveOrder(g, s, scope, key, o, u, v, quiet) { // quiet: the AI's automatic micro is counted, not listed, in the match log
  if (g.over) return { ok: false, msg: 'The match is over' };
  if (g.countdown > 0) return WAIT_GO;
  if (scope === 'lane') key = laneIx(key); // v2.63: an order for every unit on one lane (any order; a lane map only)
  if (!ORDER_NAME[o] || !(scope === 'all' ? o === 'move' : scope === 'lane' ? MAP_LANED && key >= 0 : scope === 'group' ? UGROUPS[key] : UDEF[key])) return { ok: false, msg: 'Unknown order' };
  if (o === 'move' && !(u >= 0 && u <= L && Math.abs(v) <= (MAP_2D ? MAP.size.h / 2 : 220))) return { ok: false, msg: 'Target the battlefield' };
  const side = g.sides[s], O = side.orders || (side.orders = newOrders()), ord = { o, n: ++O.n, t: g.t };
  if (o === 'move') { if (NAV.on && navShut(u, v)) [u, v] = navOpen(u, v); ord.u = u; ord.v = v; ord.done = false; } // v2.66: never a flag inside the ridge
  if (scope === 'all') O.all = ord; else if (scope === 'lane') (O.lanes || (O.lanes = {}))[key] = ord; else if (scope === 'group') O.groups[key] = ord; else O.types[key] = ord;
  for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && orderCovers(scope, key, e.type, e.lane)) {
    if (o === 'hold') { e.holdU = e.u; e.holdV = e.v; } else { e.holdU = undefined; e.holdV = undefined; }
  }
  if (quiet) { if (g.log) g.log.tot[s].micro = (g.log.tot[s].micro || 0) + 1; } else lg(g, s, 'O', scope, key, o);
  const who = scope === 'all' ? 'Army' : scope === 'lane' ? `Lane ${MAP.lanes[key].id}` : scope === 'group' ? GROUP_NAME[key] : PLURAL[key];
  return { ok: true, msg: o === 'move' ? `${who}: regrouping at the flag` : `${who}: ${o === 'hold' ? 'holding position' : o === 'attack' ? 'attacking' : 'retreating to the rally flag'}` };
}
// v2.43 (rally): on Attack, a player side's new units wait at the rally point (inside the HQ gun's cover) until the group
// there is worth MECH7C.batchV or its first unit has waited batchT seconds, then walk out together; units already marching
// (rwGo) are never held back. For the player's side (and the audit bots): the AI moves its army with its own rules (mass,
// nowave; its batch rule has been off since v2.38).
function updateRallyWait(g) {
  for (let s = 0; s < 2; s++) {
    if (!playerSide(g, s)) continue;
    const side = g.sides[s], dir = dirOf(s), r = rallyU(s, g), f = g.front[s];
    if (side.stance !== 'attack' || f === null) { if (side.rwAt !== undefined) { side.rwAt = undefined; for (const e of g.ents) if (e.kind === 'u' && e.side === s) { e.rwT = 0; e.rwS = 0; e.rwGo = 0; } } continue; }
    if (side.rwAt !== side.stanceAt) { side.rwAt = side.stanceAt; for (const e of g.ents) if (e.kind === 'u' && e.side === s) { e.rwT = 0; e.rwGo = 1; } continue; } // the army the Attack order found goes at once
    const grp = [];
    for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && !e.rwGo && !e.temp) {
      const d = UDEF[e.type], ord = unitOrder(side, e.type);
      if (d.air || d.support || (ord && ord.o !== 'attack') || dir * (e.u - r) > 60 || dir * (f - e.u) < 350) { e.rwGo = dir * (e.u - r) > 60 ? 1 : e.rwGo; continue; }
      grp.push(e); if (!e.rwS) e.rwS = g.t;
    }
    if (!grp.length) continue;
    const v = grp.reduce((a, e) => a + UDEF[e.type].cost.c + UDEF[e.type].cost.e, 0), first = Math.min(...grp.map(e => e.rwS));
    const go = v >= MECH7C.batchV || g.t - first >= MECH7C.batchT;
    for (const e of grp) if (go) { e.rwT = 0; e.rwGo = 1; } else e.rwT = g.t + 0.6;
  }
}
function updateOrders(g) { // twice a second: a Regroup flag is done once every unit it covers has arrived
  for (let s = 0; s < 2; s++) {
    const side = g.sides[s], O = side.orders; if (!O) continue;
    const list = [O.all, ...Object.values(O.groups), ...Object.values(O.types)].filter(o => o && o.o === 'move' && !o.done);
    if (!list.length) continue;
    const away = new Set();
    for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0) {
      const o = unitOrder(side, e.type);
      if (o && o.o === 'move' && !o.done) { const [su, sv] = slotOf(e, o); if (Math.abs(e.u - su) > 14 || Math.abs(e.v - sv) > 14) away.add(o); }
    }
    for (const o of list) if (!away.has(o)) o.done = true;
  }
}
// The AI's only micro so far (Normal and Hard): pull Artillery back when enemy ground units it can see get close
const AI_ART = ['artillery', 'bilelobber', 'riftmortar'], AI_SIEGE = ['artillery', 'titan', 'bilelobber', 'ruinmaw', 'riftmortar', 'worldbreaker']; // units the AI's siege rules count (v2.19: Bloomhost's too; v2.27: Axiarchs')
function aiMicro(g, s, D, mine) {
  if (D.label === 'Easy') return;
  const side = g.sides[s], O = side.orders || (side.orders = newOrders());
  for (const at of AI_ART) { // Artillery, and the Bile Lobber the same way (v2.19)
    const art = mine.filter(u => u.type === at);
    const near = art.some(a => g.ents.some(e => e.kind === 'u' && e.side !== s && e.hp > 0 && !UDEF[e.type].air && Math.abs(e.u - a.u) < 160 && visibleTo(g, s, e)));
    const cur = O.types[at];
    if (near && !cur) giveOrder(g, s, 'type', at, 'retreat', undefined, undefined, true);
    else if (!near && cur && cur.o === 'retreat' && g.t - cur.t > 6) { delete O.types[at]; for (const a of art) { a.holdU = undefined; a.holdV = undefined; } }
  }
}

// A unit that appears somewhere other than its own building (a warp-in, a Mass Warp arrival, Emergency Brood, Cloudwing
// offspring; v2.31) follows the army's current orders like a trained unit. On Hold (the stance or a group or type order) it
// holds where it arrived; before v2.31 it had no hold spot and walked back to the rally flag.
function arriveOrders(g, e) {
  const side = g.sides[e.side], ord = unitOrder(side, e.type);
  if ((ord ? ord.o : side.stance) === 'hold') { e.holdU = e.u; e.holdV = e.v; } else { e.holdU = undefined; e.holdV = undefined; }
}
function setStance(g, s, v) {
  const side = g.sides[s];
  side.stance = v; side.stanceAt = g.t; side.pushTo = null; side.pushMode = null;
  side.orders = newOrders(); // a global stance clears every group, type and Regroup order (v2.12)
  for (const u of g.ents) if (u.kind === 'u' && u.side === s) {
    if (v === 'hold') { u.holdU = u.u; u.holdV = u.v; } else { u.holdU = undefined; u.holdV = undefined; }
  }
}

function moveToward(u, d, tu, tv, dt, mul = 1) { // mul: speed multiplier (creep, v2.18)
  if (MAP_LANED && u.lane != null && !d.air && moveLane(u, d, tu, tv, dt, mul)) return true;
  if (NAV.on && !d.air) return moveNav(u, d, tu, tv, dt, mul); // v2.65: around the map's blockers
  if (MAP_2D && d.air) { // v2.66: on a grid map aircraft fly at full speed in any direction (straight over the ridge)
    const fu = Math.abs(tu - u.u) > 150 ? u.u + Math.sign(tu - u.u) * 150 : tu; // steer for a point at most 150 ahead, so it settles onto its depth on the way
    const du = fu - u.u, dv = tv - u.v, dd = Math.hypot(du, dv), k = dd ? Math.min(1, d.speed * mul * dt / dd) : 0;
    if (dd < 2) { u.moving = false; return false; }
    u.u = clamp(u.u + du * k, 0, L); u.v += dv * k; if (Math.abs(du) > 0.5) u.face = Math.sign(du); u.moving = true; return true;
  }
  const du = tu - u.u, dv = tv - u.v;
  if (Math.abs(du) < 2 && Math.abs(dv) < 2) { u.moving = false; return false; }
  if (Math.abs(du) >= 2) { u.u = clamp(u.u + Math.sign(du) * Math.min(Math.abs(du), d.speed * mul * dt), 0, L); u.face = Math.sign(du); }
  if (Math.abs(dv) >= 1) u.v += Math.sign(dv) * Math.min(Math.abs(dv), d.speed * mul * 0.45 * dt);
  u.moving = true;
  return true;
}

// v2.63 (multi-lane engine): a ground unit with a lane walks along it. Far from its target (LANE_GO.near), it steps along
// the lane's centre line at full speed, keeping its own offset across the lane (steering toward the offset its target
// asks for at the usual 0.45 side speed); off its lane (a switch, a chase), it first heads for the lane LANE_GO.ahead in
// front of it. Near the target, the plain move below takes over. Classic has no lanes (MAP_LANED false): never runs.
const LANE_GO = { near: 40, ahead: 60, probe: 20 };
function moveLane(u, d, tu, tv, dt, mul) {
  const du = tu - u.u;
  if (Math.abs(du) < LANE_GO.near) return false;
  const ln = MAP.lanes[u.lane], hw = ln.width / 2, sg = Math.sign(du), step = d.speed * mul * dt, x0 = u.u, off = u.v - laneY(ln, x0);
  if (NAV.on && Math.abs(tv - laneY(ln, tu)) > hw + 40) return false; // v2.65: a target off this lane (a flag, a chase elsewhere): navigate there instead
  if (Math.abs(off) > hw + 20) { const ax = clamp(x0 + sg * Math.min(Math.abs(du), LANE_GO.ahead), 0, L); return moveStraight(u, d, ax, laneY(ln, ax), dt, mul); }
  const k = (laneY(ln, x0 + sg * LANE_GO.probe) - laneY(ln, x0)) / LANE_GO.probe, ax = step / Math.sqrt(1 + k * k);
  const nx = clamp(x0 + sg * Math.min(Math.abs(du), ax), 0, L), want = clamp(tv - laneY(ln, tu), -hw, hw);
  const noff = off + Math.sign(want - off) * Math.min(Math.abs(want - off), step * 0.45);
  if (NAV.on && navShut(nx, laneY(ln, nx) + noff)) { const ax2 = clamp(x0 + sg * LANE_GO.ahead, 0, L); return moveStraight(u, d, ax2, laneY(ln, ax2), dt, mul); } // v2.67: never step into a wall: navigate back onto the lane
  u.u = nx; u.v = laneY(ln, nx) + noff; u.face = sg; u.moving = true;
  return true;
}
function moveStraight(u, d, tu, tv, dt, mul) { const k = u.lane; u.lane = null; const r = moveToward(u, d, tu, tv, dt, mul); u.lane = k; return r; }
// The depth a unit holds on its lane at x: its own offset (laneV) around the lane's centre there; Classic: laneV itself
const laneTv = (u, x) => !MAP_LANED || u.lane == null ? u.laneV : laneY(MAP.lanes[u.lane], UDEF[u.type].air ? u.u + clamp(x - u.u, -150, 150) : x) + u.laneV; // v2.66: aircraft keep over their squad's lane too (the lane just ahead of them; they fly straight over the ridge)
// v2.65 (Two-Lane): ground navigation around blockers (the ridge). A grid of NAV.cell cells marks the ground within
// NAV.pad of a blocker (or off the map) as closed; a ground unit whose straight line to its target crosses closed ground
// follows an A* path (8 directions), skipping ahead to the farthest point it can walk to in a straight line, and keeps
// the path (u.nav) until its target moves NAV.re or NAV.age seconds pass. On a grid map it moves at full speed in any
// direction (the straight move below keeps the old depth speed). A unit that ends a step on closed ground (a leap, a
// shove) is put back on the nearest open cell. Maps without blockers (Classic) never use any of this.
const NAV = { on: false, cell: 20, pad: 14, re: 40, age: 2, now: 0, nx: 0, ny: 0, y0: 0, b: null };
function mapNav() {
  const bl = MAP.blockers || []; NAV.on = bl.length > 0; NAV.b = null; if (!NAV.on) return;
  const C = NAV.cell; NAV.nx = Math.ceil(MAP.size.w / C); NAV.y0 = -MAP.size.h / 2; NAV.ny = Math.ceil(MAP.size.h / C);
  NAV.b = new Uint8Array(NAV.nx * NAV.ny);
  const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const segD = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy, t = l2 ? clamp(((x - a[0]) * dx + (y - a[1]) * dy) / l2, 0, 1) : 0; return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); };
  for (let j = 0; j < NAV.ny; j++) for (let i = 0; i < NAV.nx; i++) {
    const x = (i + 0.5) * C, y = NAV.y0 + (j + 0.5) * C;
    NAV.b[j * NAV.nx + i] = bl.some(o => inPoly(x, y, o.poly) || o.poly.some((p, k) => segD(x, y, o.poly[(k || o.poly.length) - 1], p) < NAV.pad)) ? 1 : 0;
  }
}
mapNav(); MAP_HOOKS.push(mapNav);
const navCell = (u, v) => [clamp(Math.floor(u / NAV.cell), 0, NAV.nx - 1), clamp(Math.floor((v - NAV.y0) / NAV.cell), 0, NAV.ny - 1)];
const navShut = (u, v) => { const [i, j] = navCell(u, v); return NAV.b[j * NAV.nx + i] === 1; };
function navClear(u0, v0, u1, v1) { // the straight line between two points crosses no closed cell
  const n = Math.ceil(Math.hypot(u1 - u0, v1 - v0) / (NAV.cell / 2));
  for (let k = 1; k <= n; k++) if (navShut(u0 + (u1 - u0) * k / n, v0 + (v1 - v0) * k / n)) return false;
  return true;
}
const NAVQ = { g: null, f: null, from: null, open: null };
function navPath(u0, v0, u1, v1) { // A* over open cells; the cell centres from start to goal (the goal's own point last), or null
  const nx = NAV.nx, N = nx * NAV.ny, C = NAV.cell;
  if (!NAVQ.g || NAVQ.g.length !== N) { NAVQ.g = new Float64Array(N); NAVQ.from = new Int32Array(N); NAVQ.done = new Uint8Array(N); }
  const G = NAVQ.g, FR = NAVQ.from, D = NAVQ.done; G.fill(Infinity); D.fill(0);
  let [si, sj] = navCell(u0, v0), [ti, tj] = navCell(u1, v1);
  const s = sj * nx + si, t = tj * nx + ti, h = k => { const i = k % nx, j = (k - i) / nx, di = Math.abs(i - ti), dj = Math.abs(j - tj); return Math.max(di, dj) + 0.4142 * Math.min(di, dj); };
  const heap = [], push = (k, f) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top[1]; };
  G[s] = 0; FR[s] = -1; push(s, h(s));
  while (heap.length) {
    const k = pop(); if (D[k]) continue; D[k] = 1;
    if (k === t) break;
    const i = k % nx, j = (k - i) / nx;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= NAV.ny) continue;
      const q = b * nx + a; if (NAV.b[q] && q !== t) continue;
      if (di && dj && (NAV.b[j * nx + a] || NAV.b[b * nx + i])) continue; // no cutting a closed corner
      const ng = G[k] + (di && dj ? 1.4142 : 1); if (ng < G[q]) { G[q] = ng; FR[q] = k; push(q, ng + h(q)); }
    }
  }
  if (!D[t]) return null;
  const out = [[u1, v1]]; for (let k = FR[t]; k >= 0 && k !== s; k = FR[k]) { const i = k % nx, j = (k - i) / nx; out.push([(i + 0.5) * C, NAV.y0 + (j + 0.5) * C]); }
  return out.reverse();
}
function moveNav(u, d, tu, tv, dt, mul) {
  if (Math.abs(tu - u.u) < 2 && Math.abs(tv - u.v) < 2) { u.moving = false; return false; }
  let wu = tu, wv = tv;
  if (!navClear(u.u, u.v, tu, tv)) {
    let N = u.nav;
    if (!N || Math.abs(N.tu - tu) + Math.abs(N.tv - tv) > NAV.re || NAV.now - N.t > NAV.age || !N.p || !N.p.length) N = u.nav = { tu, tv, t: NAV.now, p: navPath(u.u, u.v, tu, tv) };
    if (N.p) { while (N.p.length > 1 && navClear(u.u, u.v, N.p[1][0], N.p[1][1])) N.p.shift(); [wu, wv] = N.p[0]; if (Math.hypot(wu - u.u, wv - u.v) < 4 && N.p.length > 1) { N.p.shift(); [wu, wv] = N.p[0]; } }
  } else if (u.nav) u.nav = undefined;
  if (!MAP_2D) { const k = u.lane; u.lane = null; NAV.on = false; const r = moveToward(u, d, wu, wv, dt, mul); NAV.on = true; u.lane = k; return r; }
  const du = wu - u.u, dv = wv - u.v, dd = Math.hypot(du, dv), st = d.speed * mul * dt;
  if (dd < 2) { u.moving = false; return false; }
  const k = Math.min(1, st / dd), nu = clamp(u.u + du * k, 0, L), nv = u.v + dv * k;
  if (!navShut(nu, nv)) { u.u = nu; u.v = nv; } else if (!navShut(nu, u.v)) u.u = nu; else if (!navShut(u.u, nv)) u.v = nv; // slide along a wall
  if (Math.abs(du) > 0.5) u.face = Math.sign(du);
  u.moving = true;
  return true;
}
function navOpen(u, v) { const p = { u, v }; navEject(p); return [p.u, p.v]; } // the nearest open point
function navEject(u) { // put a ground unit standing on closed ground back on the nearest open cell (v2.67: the nearest by distance, not the first in a ring)
  const [i0, j0] = navCell(u.u, u.v), C = NAV.cell;
  for (let r = 1; r < 12; r++) {
    let best = null, bd = 1e9;
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      const i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= NAV.nx || j >= NAV.ny || NAV.b[j * NAV.nx + i]) continue;
      const x = (i + 0.5) * C, y = NAV.y0 + (j + 0.5) * C, dd = Math.hypot(x - u.u, y - u.v);
      if (dd < bd) { bd = dd; best = [x, y]; }
    }
    if (best) { [u.u, u.v] = best; return; }
  }
}
const RETREAT = { fire: false }; // v2.35 (audit): retreating units hold their fire; fire true restores the v2.34 rule (firing on the move)
function updateUnit(g, u, foes, dt) {
  const d = UDEF[u.type];
  u.anim += dt;
  const frz = u.frzT > g.t; // Frenzy Bloom (v2.20): faster attacks and movement
  if (u.cd > 0) u.cd -= dt * (frz ? ABIL.frenzy.rate : 1);
  if (u.recoil > 0) u.recoil = Math.max(0, u.recoil - dt * 5);
  if (u.hitT > 0) u.hitT -= dt;
  if (u.fwdHome && g.nodes[u.fwdHome.n].owner !== u.side) u.fwdHome = undefined; // v2.68: its forward post lost: home is the base again
  const side = g.sides[u.side], dir = dirOf(u.side), home = u.medHome ? homeFlagU(g, u.side) + u.rallyOff * dir * 0.3 : (side.defU != null ? side.defU : u.fwdHome ? u.fwdHome.u : rallyU(u.side, g)) + u.rallyOff * dir * (u.fwdHome ? 0.3 : 1); // defU (v2.40): a Default AI under attack rallies inside its HQ's cover; v2.62: a damaged unit sent home goes to the base flag
  const ord = unitOrder(side, u.type, u.lane);
  const runs = side.persona && aiFix(side.persona, 'scoutGo') && ((u.id === side.scoutId && side.scoutU != null) || (side.raid && side.raid.ids.includes(u.id)) || capBusy(side, u.id)); // v2.60: a Hard scout or raider; v2.67: a capture group (lane maps)
  const st = u.medHome ? 'retreat' : runs ? 'run' : ord ? ord.o : side.stance; // a group or type order overrides the global stance; v2.62: sent home = Retreat to the base flag
  const A = d.weapon ? acquire(g, u, d, foes, d.chase) : NO_TARGET, { best, close } = A; // Medicopters and Recon Drones carry no weapon; melee: the chase search in the same pass (v2.37)
  const sp = (d.fac === 'bloomhost' && !d.air && onCreep(g, u.side, u.u, u.v) ? CREEP.speed : 1) * (frz ? ABIL.frenzy.speed : 1) * (u.slowT > g.t ? 1 - u.slow : 1) * (u.snT > g.t ? 0 : 1); // creep (v2.18), Frenzy Bloom (v2.20), a Gravemantle's slow (v2.27), a Rootheart's snare (v2.33)
  if (u.leaping) { // mid-leap (v2.19): fly to the landing spot, nothing else
    const du = u.lu - u.u, dv = u.lv - u.v, dd = Math.hypot(du, dv), st = d.leap.speed * dt;
    if (dd <= st) { u.u = u.lu; u.v = u.lv; u.z = 0; u.leaping = 0; u.leapCd = g.t + d.leap.cd; }
    else { u.u += du / dd * st; u.v += dv / dd * st; u.z = Math.sin(Math.PI * clamp(1 - dd / u.ld, 0, 1)) * Math.min(26, u.ld * 0.18); u.face = du >= 0 ? 1 : -1; }
    u.moving = true; return;
  }
  if (g.meteor && g.meteor.at && side.persona && !g.sides[u.side].bot && !d.air && !u.siege) { const p = meteorDodge(g, u); if (p) { u.tgt = 0; u.chT = 0; moveToward(u, d, p[0], p[1], dt, sp); return; } } // v2.72: an AI's unit steps out of a meteor's circle
  if (u.aiBack > g.t && !u.siege) { u.tgt = 0; u.chT = 0; { const bu = side.backU != null ? side.backU : home; moveToward(u, d, bu, laneTv(u, bu), dt, sp); } return; } // v2.38: a Default AI pulls it back for a moment (unit timing)
  if (d.siege && titanSiege(g, u, d, st, foes)) return; // P8 (v2.37): planting, planted or unplanting
  if (u.phT > g.t) { u.moving = false; u.tgt = 0; u.chT = 0; return; } // P13 (v2.37): a phased Wraithwing holds still and can't fire
  // Retreat: keep running home until back at the rally flag. A retreating unit holds its fire (v2.35, audit): it
  // attacks again only once the retreat ends, back at the flag or under a new order
  if (u.medHome) { // v2.71: sent home, with a repair depot its side holds nearer than the base flag: heal there instead
    const dp = medDepot(g, u);
    if (dp) {
      u.tgt = 0; u.chT = 0;
      if (Math.hypot(dp.u - u.u, dp.v - u.v) > (dp.r || NODE_R) * 0.5) moveToward(u, d, dp.u, dp.v, dt, sp);
      else { u.moving = false; if (g.t - u.lastHurt > DAMAGED.calm) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * DAMAGED.heal * dt); if (u.hp >= u.maxHp * DAMAGED.done) u.medHome = 0; }
      return;
    }
  }
  if (st === 'retreat' && Math.abs(home - u.u) > 12) {
    if (!RETREAT.fire) { u.tgt = 0; u.chT = 0; }
    else if (best && u.cd <= 0) { fire(g, u, best, d); u.cd = d.cd * rand(0.9, 1.1); } // the v2.34 rule, for the tests' fixed replays
    moveToward(u, d, home, laneTv(u, home), dt, sp);
    return;
  }
  if (u.medHome) { // v2.62: home: heal once unhurt for a moment, rejoin when nearly whole
    if (g.t - u.lastHurt > DAMAGED.calm) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * DAMAGED.heal * dt);
    if (u.hp >= u.maxHp * DAMAGED.done) u.medHome = 0;
  }
  if (u.aiWait > g.t && !best && !(MECH7C.on && d.chase && A.prey && Math.hypot(A.prey.u - u.u, A.prey.v - u.v) <= MECH7C.holdR + d.range)) { u.moving = false; u.tgt = 0; u.chT = 0; return; } // v2.43: a holding melee unit still engages within holdR (falls through to the chase below) // v2.40: a Default AI holds a front-runner until its army catches up (fights only what is in reach, never chases)
  const act = !(u.phT > g.t) && !d.siege; // v2.37: a phased Wraithwing can't fire (P13); a Titan fires only when planted (P8)
  u.tgt = best && act ? best.id : 0;
  if (!best || best.id !== u.chTgt || !act) u.chT = 0; // the Astral Marksman's charge starts over on a new target (v2.27)
  if (best && act) {
    u.moving = false;
    if (Math.abs(best.u - u.u) > 1) u.face = best.u >= u.u ? 1 : -1;
    if (d.swing) { const air = best.kind === 'u' && UDEF[best.type].air ? 1 : 0; if (air !== u.aimAir) { u.aimAir = air; u.cd = Math.max(u.cd, d.swing); } } // the Hydra's guns swing between ground and air
    if (u.cd <= 0 && d.charge) { // v2.27: a visible charge-up on the same target before each shot
      if (!u.chT) { u.chT = g.t + d.charge; u.chTgt = best.id; }
      else if (g.t >= u.chT) { fire(g, u, best, d); u.cd = d.cd * rand(0.9, 1.1); u.chT = 0; }
      return;
    }
    if (u.cd <= 0) {
      fire(g, u, best, d); u.cd = d.cd * rand(0.9, 1.1);
      if (d.fade && u.fadeArm) { // P5 (v2.37): the Riftstalker's strike landed: phase-step back to where it leapt from
        u.fadeArm = 0; u.lu = u.fu; u.lv = u.fv; u.ld = Math.max(1, Math.hypot(u.lu - u.u, u.lv - u.v)); u.leaping = 1;
        const w = P(u.u, u.v, 10); g.fx.push({ k: 'blink', side: u.side, u: u.u, x: w.x, y: w.y, t: 0, life: 0.4 });
      }
    }
    return;
  }
  if (close) { u.moving = false; return; } // artillery: enemy is inside minimum range
  if (d.chase && st !== 'move' && !(st === 'hold' && u.holdU !== undefined)) { // melee (v2.17): close on the nearest enemy it can see and hurt
    const prey = A.prey !== undefined ? A.prey : acquire(g, u, { ...d, range: d.chase }, foes).best;
    if (prey && d.leap && g.t >= u.leapCd && !(u.snT > g.t) && !(u.aiHold > g.t)) { // v2.38: a Default AI holds a Riftstalker's leap while its shields recharge // snared: no leap either (v2.33) // the Leaper jumps the last stretch (v2.19), never further than leap.range
      const dist = effDist(u, prey);
      if (dist <= d.leap.range && dist >= d.leap.min) { const k = Math.max(0, (Math.hypot(prey.u - u.u, prey.v - u.v) - d.range * 0.7) / Math.max(1, Math.hypot(prey.u - u.u, prey.v - u.v))); u.lu = u.u + (prey.u - u.u) * k; u.lv = u.v + (prey.v - u.v) * k;
        if (d.leap.behind) { const pd = Math.max(1, Math.hypot(prey.u - u.u, prey.v - u.v)); u.lu = clamp(prey.u + (prey.u - u.u) / pd * d.range * 0.7, 0, L); u.lv = clamp(prey.v + (prey.v - u.v) / pd * d.range * 0.7, -LANE_V, LANE_V); } // the Parallax lands just behind its target (v2.27)
        u.ld = Math.max(1, Math.hypot(u.lu - u.u, u.lv - u.v)); u.leaping = 1;
        if (d.fade) { u.fu = u.u; u.fv = u.v; u.fadeArm = 1; } // P5: remember where it leapt from
        return; }
    }
    if (prey) { moveToward(u, d, prey.u, prey.v, dt, sp); return; }
  } else if (d.chase && MECH7C.on && (st === 'move' || (st === 'hold' && u.holdU !== undefined))) { // v2.43: on Hold or a Regroup flag a melee unit engages
    // enemies within holdR of the spot it holds, and never chases further; with none, it walks back to its spot (below)
    const [hu, hv] = st === 'move' ? slotOf(u, ord) : [u.holdU, u.holdV];
    const prey = A.prey !== undefined ? A.prey : acquire(g, u, { ...d, range: d.chase }, foes).best;
    if (prey && Math.hypot(prey.u - hu, prey.v - hv) <= MECH7C.holdR + d.range) { moveToward(u, d, prey.u, prey.v, dt, sp); return; }
  }
  let tu = home, tv = u.laneV;
  if (u.id === side.scoutId && side.scoutU != null && st !== 'retreat') tu = side.scoutU; // v2.38: a Default AI's scout
  else if (st === 'run' && capBusy(side, u.id)) { const T = side.capT && side.capT.ids.includes(u.id) ? side.capT : side.capT2 && side.capT2.ids.includes(u.id) ? side.capT2 : side.relicG; tu = T.u + ((u.id * 37) % 5 - 2) * 10; tv = T.v + ((u.id * 53) % 5 - 2) * 8; } // v2.67: a capture group stands on its node (v2.70: either group)
  else if (st === 'run') tu = side.raid.u; // v2.60: a raider heads for its target (fighting what it meets on the way)
  else if (st === 'move') [tu, tv] = slotOf(u, ord); // Regroup: walk to the flag, then hold there
  else if (st === 'hold' && u.holdU !== undefined) { tu = u.holdU; tv = u.holdV; }
  else if (d.support) [tu, tv] = supportSpot(g, u, d, st, home);
  else if (d.node && side.vcU != null && st === 'attack') tu = side.vcU; // v2.38: a Default AI keeps its Voidcarrier just behind the front
  else if (st === 'attack') {
    // a field push spreads forward of its line; a siege spreads back from it, so nobody stands inside the enemy HQ's range
    const spread = side.pushMode === 'siege' ? -1 : 1;
    const end = side.pushTo !== null ? side.pushTo - spread * u.rallyOff * dir * 0.6 : (dir > 0 ? L : 0);
    if (u.id === side.spotter && side.spotU != null && (side.pushTo !== null || side.spotAny)) tu = side.spotU; // spotAny (v2.38): a Default AI spots for its long guns on any push
    else if (u.type === 'interceptor') { // escort the nearest of your Leviathans and Gunships; with none, wait behind the front
      let esc = null, ed = 1e9;
      for (const e of g.ents) if (e.kind === 'u' && e.side === u.side && e.hp > 0 && (e.type === 'leviathan' || e.type === 'aircraft')) { const dd = Math.abs(e.u - u.u); if (dd < ed) { ed = dd; esc = e; } }
      if (esc) { tu = esc.u - dir * 12; tv = esc.v + (u.id % 2 ? 14 : -14); } else { const f = g.front[u.side]; tu = f === null ? home : f - dir * 40; }
    }
    else tu = u.rwT > g.t ? home : end; // v2.43: waiting at the rally point for its group
    if (side.bbStage != null && !d.air) tu = side.bbStage - dir * u.rallyOff * 0.5; // v2.69 (a): mass at the edge of the HQ gun's range
    else if (side.bbLead != null && !d.air && !AI_SIEGE.includes(u.type) && dir * (u.u - side.bbLead) < 0) tu = side.bbLead - dir * u.rallyOff * 0.5; // the siege units go in first
    if (side.leash != null && !d.siege && !d.air) tu = dir > 0 ? Math.min(tu, side.leash) : Math.max(tu, side.leash); // v2.38: a Default AI's army stays within reach of its Titans while they plant
  }
  if (MAP_LANED && tv === u.laneV) tv = laneTv(u, tu); // v2.63: the lane's depth there (Classic: unchanged)
  if (!moveToward(u, d, tu, tv, dt, sp)) u.face = dir;
}

const NO_TARGET = { best: null, close: false };
// P8 (v2.37): the Titan's siege lock. It fires only when planted: planting takes plant seconds, then it can't move, reaches
// reach further and hits buildings bmul harder; it unplants (unplant seconds, no shots either way) when ordered to retreat
// or regroup, or after idle seconds with nothing in reach. Mobile, it plants as soon as an enemy is within planted reach
// (on any stance but Retreat and Regroup). The player and the AI both get this behaviour; neither has to order it.
// u.siege: 0 mobile, 1 planting, 2 planted, 3 unplanting; u.sgT: when the change ends; u.sgIdle: last time it had a target.
function titanSiege(g, u, d, st, foes) {
  const S = d.siege, R2 = d.range + S.reach, go = st === 'retreat' || st === 'move';
  if (u.siege === 1 || u.siege === 3) {
    u.moving = false; u.tgt = 0;
    if (g.t >= u.sgT) { u.siege = u.siege === 1 ? 2 : 0; u.sgIdle = g.t; }
    return true;
  }
  if (u.siege === 2) {
    const best = acquire(g, u, Object.assign({}, d, { range: R2 }), foes).best;
    if (best) u.sgIdle = g.t;
    if (go || (!best && g.t - u.sgIdle >= S.idle)) { u.siege = 3; u.sgT = g.t + S.unplant; u.tgt = 0; return true; }
    u.moving = false; u.tgt = best ? best.id : 0;
    if (best) { if (Math.abs(best.u - u.u) > 1) u.face = best.u >= u.u ? 1 : -1; if (u.cd <= 0) { fire(g, u, best, d); u.cd = d.cd * rand(0.9, 1.1); } }
    return true;
  }
  if (go) return false;
  const best = acquire(g, u, Object.assign({}, d, { range: R2 }), foes).best;
  if (!best) return false;
  u.siege = 1; u.sgT = g.t + S.plant; u.moving = false; u.tgt = 0; if (Math.abs(best.u - u.u) > 1) u.face = best.u >= u.u ? 1 : -1;
  return true;
}
// Where a support unit goes (v2.15). Medicopter: over your biggest group of infantry (none: home). Recon Drone: on Attack,
// just behind your front (or on the spotter's mark while sieging); otherwise home.
function supportSpot(g, u, d, st, home) {
  const side = g.sides[u.side], dir = dirOf(u.side);
  if (u.type === 'medic') { const c = infantryCentre(g, u.side); return c ? [c.u - dir * 10, c.v] : [home, u.laneV]; }
  if (st !== 'attack') return [home, u.laneV];
  if (u.id === side.spotter && side.spotU != null && (side.pushTo !== null || side.spotAny)) return [side.spotU, u.laneV];
  const f = g.front[u.side];
  return [clamp((f === null ? rallyU(u.side, g) : f) - dir * 30, 0, L), u.laneV]; // just behind the front: its sight reaches far ahead
}
// The centre of side s's biggest infantry cluster (the infantry unit with the most infantry within 120), cached per tick
function infantryCentre(g, s) {
  const C = g._inf || (g._inf = [{ t: -1, c: null }, { t: -1, c: null }]), k = C[s];
  if (k.t === g.t) return k.c;
  const inf = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && GROUP_OF[e.type] === 'inf');
  let best = null, bn = -1;
  for (let i = 0; i < inf.length; i += Math.max(1, inf.length >> 4)) { // at most ~16 candidates
    const a = inf[i]; let n = 0;
    for (const b of inf) if (Math.abs(b.u - a.u) < 120 && Math.abs(b.v - a.v) < 120) n++;
    if (n > bn) { bn = n; best = a; }
  }
  k.t = g.t; k.c = best ? { u: best.u, v: best.v } : null;
  return k.c;
}
// Medicopters heal your infantry within 120 at 2.5% of max HP per second; several never stack (v2.15)
function updateMedics(g, dt) {
  const D = UDEF.medic;
  let any = false;
  for (const m of g.ents) {
    if (m.kind !== 'u' || m.type !== 'medic' || m.hp <= 0) continue;
    for (const e of g.ents) if (e.kind === 'u' && e.side === m.side && e.hp > 0 && GROUP_OF[e.type] === 'inf' && e.medAt !== g.t && Math.hypot(e.u - m.u, e.v - m.v) <= D.healR) { e.medAt = g.t; any = true; }
  }
  if (!any) return;
  for (const e of g.ents) if (e.kind === 'u' && e.medAt === g.t && e.hp < e.maxHp) {
    const h0 = e.hp; e.hp = Math.min(e.maxHp, e.hp + e.maxHp * D.heal * dt);
    if (g.log) g.log.tot[e.side].healed = (g.log.tot[e.side].healed || 0) + e.hp - h0;
  }
}
