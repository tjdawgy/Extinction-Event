/* ---------- Maps (v2.59): docs/MAP_FORMAT.md ----------
   A map is data: the SIM reads it through MAP (and g.map). Classic is today's single lane, ported number for number:
   every coordinate below is the exact value the v2.58 formulas gave (tilePos with TILE 70, IX 0.866), so the replay
   fingerprints still match. x is along the lane (the SIM's u), y is depth centred on 0 (the SIM's v). */
const MAPS = {};
MAPS.classic = {
  id: 'classic', v: 1,
  display: { name: 'Classic', desc: 'One lane with field nodes between the bases. Short, direct matches.', thumb: { style: 'lane', tint: '#24324a' } },
  size: { w: 1700, h: 400 },
  armyCap: 80,
  symmetry: 'mirror-x',
  bases: [
    { id: 'west', hq: [220, -140], face: [1, 0], sigPad: [341.24, -140], rally: [460, 0],
      pads: [[159.38, -70], [280.62, -70], [98.76, 0], [220, 0], [341.24, 0], [159.38, 70], [280.62, 70], [220, 140]] },
    { id: 'east', hq: [1480, -140], face: [-1, 0], sigPad: [1358.76, -140], rally: [1240, 0],
      pads: [[1540.62, -70], [1419.38, -70], [1601.24, 0], [1480, 0], [1358.76, 0], [1540.62, 70], [1419.38, 70], [1480, 140]] },
  ],
  modes: { '1v1': [['west'], ['east']] },
  lanes: [{ id: 'main', path: [[0, 0], [1700, 0]], width: 230 }],
  blockers: [],
  nodes: [ // income nodes use NODE_TYPES.income's yield (NODE_INC, which the balance layers set)
    { id: 'west', type: 'income', at: [680, 0], r: 70 },
    { id: 'centre', type: 'income', at: [850, 0], r: 70 },
    { id: 'east', type: 'income', at: [1020, 0], r: 70 },
  ],
  conditions: [],
  fog: 'strip', depthW: 0.4, // v2.63: one row of fog cells along the lane; depth counts 0.4 in range (DV_W)
};
// v2.63: a map the test kit supplies (EE_MAP_DATA in its sandbox) is added for that load of the SIM and starts as the
// current map. It never ships in the game: the browser has no EE_MAP_DATA.
if (typeof EE_MAP_DATA !== 'undefined' && EE_MAP_DATA) MAPS[EE_MAP_DATA.id] = EE_MAP_DATA;
let MAP = typeof EE_MAP_DATA !== 'undefined' && EE_MAP_DATA ? MAPS[EE_MAP_DATA.id] : MAPS.classic; // the map the current match plays
// v2.65: the map is chosen per match (useMap; the map-select screen, a save's map). Every value derived from it is a
// `let` that a hook in MAP_HOOKS recomputes, in load order, whenever the map changes; each hook also runs once at load.
const MAP_HOOKS = [];
function useMap(id) {
  const m = MAPS[id]; if (!m) return false;
  if (m === MAP) return true;
  MAP = m; for (const f of MAP_HOOKS) f();
  return true;
}
// v2.63 (multi-lane engine): what the map asks of the engine. Classic asks for none of it, so it plays exactly as before.
//   MAP_2D: fog is a grid of cells (MAP.fogCell) over the whole field instead of one row along the lane; sight, capture
//     and targeting use true distance (depth counts in full, MAP.depthW 1) instead of full-depth strips.
//   MAP_LANED: lanes that aren't one straight line at depth 0: ground units follow their own lane (u.lane).
let MAP_2D, MAP_LANED;
const mapFlags = () => { MAP_2D = MAP.fog === 'grid'; MAP_LANED = MAP.lanes.length > 1 || MAP.lanes.some(l => l.path.some(p => p[1] !== 0)); };
mapFlags(); MAP_HOOKS.push(mapFlags);
// A lane's centre depth at x: its path is a polyline whose x only grows (a lane runs from the west edge to the east one)
function laneY(ln, x) {
  const P = ln.path;
  if (x <= P[0][0]) return P[0][1];
  for (let i = 1; i < P.length; i++) if (x <= P[i][0]) { const [x0, y0] = P[i - 1], [x1, y1] = P[i]; return x1 === x0 ? y1 : y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
  return P[P.length - 1][1];
}
const laneIx = k => typeof k === 'number' ? (k >= 0 && k < MAP.lanes.length ? k : -1) : MAP.lanes.findIndex(l => l.id === k); // a lane by index or id
// Node types: how each behaves is code (NODE_TYPES); a map only places them. live: false = in the format, not built yet
const NODE_TYPES = { income: { live: true }, watchtower: { live: true }, forwardPad: { live: true }, repair: { live: true }, relic: { live: true } }; // v2.71: the repair depot and the guarded relic (src/sim/nodes-special.js)
// v2.65: what each live type does. income: NODE_INC a second to its holder (× yieldMul). watchtower: no income; its holder
// sees sight around it. forwardPad: no income; its holder may build the roles in allow (each faction's own building for
// that role) on its pads. All three are captured the same way, by ground troops inside r.
const FWD_SLOT = 100; // forward pads are build slots FWD_SLOT + k (k: the k-th forward pad on the map, FWD_PADS)
// Map validation (a test runs it on every map): returns a list of problems, empty when the map is sound
const MAP_RULES = { capMin: 20, capMax: 200, gap: 60, cell: 10, eps: 1e-6, symmetry: ['mirror-x', 'rot180', 'rot90', 'none'] };
function validateMap(m) {
  const P = [], R = MAP_RULES, bad = s => P.push(s), H = m.size ? m.size.h / 2 : 0;
  const isPt = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const inBounds = p => p[0] >= 0 && p[0] <= m.size.w && Math.abs(p[1]) <= H;
  const inPoly = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
  const blocked = p => (m.blockers || []).some(b => inPoly(p, b.poly));
  if (!m.id || !m.display || typeof m.display.name !== 'string' || typeof m.display.desc !== 'string' || !m.display.name || !m.display.desc) bad('display: needs a name and a description');
  if (!m.size || !(m.size.w > 0) || !(m.size.h > 0)) { bad('size: w and h must be positive'); return P; }
  if (!Number.isInteger(m.armyCap) || m.armyCap < R.capMin || m.armyCap > R.capMax) bad(`armyCap ${m.armyCap}: must be a whole number from ${R.capMin} to ${R.capMax}`);
  const B = m.bases || [];
  if (B.length < 2 || B.length > 4) bad(`bases: ${B.length} (2 to 4)`);
  if (new Set(B.map(b => b.id)).size !== B.length) bad('bases: ids must be unique');
  // every point a map places, with a label
  const spots = []; // build spots (HQ, pads, signature pads, forward pads): none may overlap
  for (const b of B) {
    if (!isPt(b.hq) || !isPt(b.sigPad) || !isPt(b.rally) || !isPt(b.face) || !Array.isArray(b.pads) || b.pads.length !== 8 || !b.pads.every(isPt)) { bad(`base ${b.id}: needs hq, face, 8 pads, sigPad and rally as [x, y]`); continue; }
    if (Math.abs(Math.hypot(b.face[0], b.face[1]) - 1) > R.eps) bad(`base ${b.id}: face must be a unit vector`);
    spots.push([`${b.id} HQ`, b.hq], [`${b.id} signature pad`, b.sigPad], ...b.pads.map((p, k) => [`${b.id} pad ${k}`, p]));
    for (const [k, p] of [['rally', b.rally]]) if (!inBounds(p) || blocked(p)) bad(`base ${b.id}: ${k} off the map or blocked`);
  }
  const modes = m.modes || {};
  if (!Object.keys(modes).length) bad('modes: at least one');
  for (const [k, teams] of Object.entries(modes)) { const used = teams.flat(); if (teams.length < 2) bad(`mode ${k}: at least two teams`); if (new Set(used).size !== used.length) bad(`mode ${k}: a base twice`); for (const id of used) if (!B.some(b => b.id === id)) bad(`mode ${k}: no base ${id}`); }
  for (const b of B) if (!Object.values(modes).some(t => t.flat().includes(b.id))) bad(`base ${b.id}: in no mode`);
  const N = m.nodes || [];
  if (new Set(N.map(n => n.id)).size !== N.length) bad('nodes: ids must be unique');
  for (const n of N) {
    if (!NODE_TYPES[n.type]) bad(`node ${n.id}: unknown type ${n.type}`);
    if (!isPt(n.at) || !(n.r > 0 || n.r === undefined)) { bad(`node ${n.id}: needs at [x, y]`); continue; }
    for (const gd of n.guards || []) if (!UDEF[gd.unit]) bad(`node ${n.id}: unknown guard unit ${gd.unit}`);
    for (const [k, p] of (n.pads || []).entries()) { if (!isPt(p)) bad(`node ${n.id}: pad ${k} is not [x, y]`); else spots.push([`${n.id} pad ${k}`, p]); }
  }
  for (const [lab, p] of spots) if (!inBounds(p)) bad(`${lab}: off the map`); else if (blocked(p)) bad(`${lab}: inside a blocker`);
  for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) if (dist(spots[i][1], spots[j][1]) < R.gap) bad(`${spots[i][0]} and ${spots[j][0]} overlap (${dist(spots[i][1], spots[j][1]).toFixed(1)} apart, need ${R.gap})`);
  const nr = n => n.r || 70;
  for (let i = 0; i < N.length; i++) {
    if (!isPt(N[i].at)) continue;
    if (!inBounds(N[i].at) || blocked(N[i].at)) bad(`node ${N[i].id}: off the map or blocked`);
    for (let j = i + 1; j < N.length; j++) if (isPt(N[j].at) && dist(N[i].at, N[j].at) < nr(N[i]) + nr(N[j])) bad(`nodes ${N[i].id} and ${N[j].id} overlap`);
    for (const [lab, p] of spots) if (!(N[i].pads || []).some(q => q === p) && dist(N[i].at, p) < nr(N[i]) + R.gap / 2) bad(`node ${N[i].id} overlaps ${lab}`);
  }
  // reachability on the ground: a grid of walkable cells (inside a lane, or anywhere on an open map, never in a blocker)
  const segD = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy, t = l2 ? clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2, 0, 1) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  const lanes = m.lanes || [];
  const walk = p => inBounds(p) && !blocked(p) && (!lanes.length || (m.blockers || []).length > 0 || lanes.some(l => l.path.some((a, i) => i && segD(p, l.path[i - 1], a) <= l.width / 2))); // v2.65: with blockers, all open ground is walkable (the blockers are the walls)
  const C = R.cell, nx = Math.floor(m.size.w / C) + 1, ny = Math.floor(m.size.h / C) + 1, cellAt = p => [Math.round(p[0] / C), Math.round((p[1] + H) / C)];
  const ok = new Uint8Array(nx * ny); for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) ok[j * nx + i] = walk([i * C, j * C - H]) ? 1 : 0;
  const reach = from => { const seen = new Uint8Array(nx * ny), q = []; const [i0, j0] = cellAt(from); if (!ok[j0 * nx + i0]) return seen; seen[j0 * nx + i0] = 1; q.push(j0 * nx + i0);
    while (q.length) { const c = q.pop(), i = c % nx, j = (c - i) / nx; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b2 = j + dj; if (a < 0 || b2 < 0 || a >= nx || b2 >= ny) continue; const k = b2 * nx + a; if (ok[k] && !seen[k]) { seen[k] = 1; q.push(k); } } } return seen; };
  const at = (seen, p) => { const [i, j] = cellAt(p); return i >= 0 && j >= 0 && i < nx && j < ny && seen[j * nx + i] === 1; };
  const good = B.filter(b => isPt(b.rally));
  if (good.length) {
    const seen = reach(good[0].rally);
    for (const b of good) if (!at(seen, b.rally)) bad(`base ${b.id}: its rally point can't be reached on the ground from base ${good[0].id}`);
    for (const n of N) if (isPt(n.at) && !at(seen, n.at)) bad(`node ${n.id}: can't be reached on the ground`);
  }
  // declared symmetry: every base, node, lane and blocker has its image under the map's transform
  if (!R.symmetry.includes(m.symmetry)) bad(`symmetry: ${m.symmetry} is not one of ${R.symmetry.join(', ')}`);
  else if (m.symmetry !== 'none') {
    const w = m.size.w, T = { 'mirror-x': p => [w - p[0], p[1]], rot180: p => [w - p[0], -p[1]], rot90: p => [w / 2 - p[1], p[0] - w / 2] }[m.symmetry];
    const same = (a, b) => dist(a, b) < 1e-6 * Math.max(1, w);
    if (m.symmetry === 'rot90' && m.size.w !== m.size.h) bad('symmetry rot90: the map must be square');
    for (const b of good) {
      const img = B.find(o => isPt(o.hq) && same(T(b.hq), o.hq));
      if (!img) { bad(`symmetry: base ${b.id} has no image`); continue; }
      if (!same(T(b.sigPad), img.sigPad) || !same(T(b.rally), img.rally) || b.pads.some((p, k) => !same(T(p), img.pads[k]))) bad(`symmetry: base ${b.id}'s pads, signature pad or rally don't mirror base ${img.id}'s`);
    }
    const setEq = (A, Bs) => A.length === Bs.length && A.every(p => Bs.some(q => same(T(p), q)));
    for (const n of N) { // v2.65: and its image matches it: radius, yield, sight, forward pads and what they allow
      if (!isPt(n.at)) continue;
      const img = N.find(o => o.type === n.type && isPt(o.at) && same(T(n.at), o.at));
      if (!img) { bad(`symmetry: node ${n.id} has no image`); continue; }
      if ((n.r || 70) !== (img.r || 70) || (n.yieldMul || 1) !== (img.yieldMul || 1) || (n.sight || 0) !== (img.sight || 0) || (n.heal || 0) !== (img.heal || 0) || JSON.stringify(n.guards || null) !== JSON.stringify(img.guards || null) || JSON.stringify(n.reward || null) !== JSON.stringify(img.reward || null) || String(n.allow || '') !== String(img.allow || '') || !setEq(n.pads || [], img.pads || [])) bad(`symmetry: node ${n.id} doesn't match its image ${img.id}`);
    }
    for (const l of lanes) if (!lanes.some(o => setEq(l.path, o.path))) bad(`symmetry: lane ${l.id} has no image`);
    for (const [k, bl] of (m.blockers || []).entries()) if (!(m.blockers || []).some(o => setEq(bl.poly, o.poly))) bad(`symmetry: blocker ${k} has no image`);
  }
  return P;
}
