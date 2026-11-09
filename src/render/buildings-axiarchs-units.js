/* ---------- Axiarch buildings (v2.25): obsidian monoliths on stone pads ----------
   Original designs: black stone blocks, floating geometric slabs and rings, carved glyphs in the team colour, with pale
   energy at the seams. Same rules as the other factions: a cached body per tier, a few live parts (floating, rotating). */
const AXC = { stone: ['#4a5068', '#2c3146', '#1a1d2e'], obs: ['#262a3d', '#161929', '#0c0e19'], edge: '#7d88aa', pale: '210,232,255' };
// a stone block with a faint team-coloured glyph band on its front faces
function slab(c, u, v, a, b, z, h, T, band) {
  box(c, u, v, a, b, z, h, AXC.stone);
  if (band) { c.strokeStyle = `rgba(${T.glow},${band})`; c.lineWidth = 1.1; c.beginPath(); c.moveTo(...pt(u - a, v + b, z + h * 0.5)); c.lineTo(...pt(u + a, v + b, z + h * 0.5)); c.moveTo(...pt(u - a, v - b, z + h * 0.5)); c.lineTo(...pt(u - a, v + b, z + h * 0.5)); c.stroke(); }
}
// an obsidian obelisk: a tall square shaft narrowing to a point
function obelisk(c, u, v, r, z, h, T, glyph) {
  const top = pt(u, v, z + h);
  poly(c, [pt(u - r, v - r, z), pt(u - r, v + r, z), pt(u - r * 0.55, v + r * 0.55, z + h * 0.82), top]); c.fillStyle = AXC.obs[1]; c.fill();
  poly(c, [pt(u - r, v + r, z), pt(u + r, v + r, z), pt(u + r * 0.55, v + r * 0.55, z + h * 0.82), pt(u - r * 0.55, v + r * 0.55, z + h * 0.82)]); c.fillStyle = AXC.obs[2]; c.fill();
  poly(c, [pt(u - r * 0.55, v + r * 0.55, z + h * 0.82), pt(u + r * 0.55, v + r * 0.55, z + h * 0.82), top]); c.fillStyle = AXC.obs[0]; c.fill();
  if (glyph) { c.strokeStyle = `rgba(${T.glow},${glyph})`; c.lineWidth = 1; c.beginPath(); c.moveTo(...pt(u, v + r, z + h * 0.15)); c.lineTo(...pt(u, v + r * 0.6, z + h * 0.75)); c.stroke(); }
}
// the stone platform every Axiarch building stands on: a dark stepped slab with glyph lines in the team colour
function axBase(c, half, T, tier) {
  box(c, 0, 0, half + 2, half + 2, 0, 5, AXC.obs);
  const g = 0.16 + tier * 0.07;
  c.strokeStyle = `rgba(${T.glow},${g})`; c.lineWidth = 1;
  c.beginPath(); c.moveTo(...pt(-half - 2, half * 0.5, 5)); c.lineTo(...pt(half * 0.5, half * 0.5, 5)); c.lineTo(...pt(half * 0.5, -half - 2, 5)); c.stroke();
  if (tier >= 2) box(c, 0, 0, half - 4, half - 4, 5, 3, AXC.stone);
}
// a floating ring (live): an ellipse that tilts as it turns
function axRing(c, u, v, z, r, t, T, sp = 1, a = 0.7) {
  const [x, y] = pt(u, v, z), k = 0.35 + 0.15 * Math.sin(t * sp);
  c.strokeStyle = `rgba(${AXC.pale},${a * 0.6})`; c.lineWidth = 2.2; c.beginPath(); c.ellipse(x, y, r * 1.2247, r * k, Math.sin(t * sp * 0.5) * 0.15, 0, 7); c.stroke();
  c.strokeStyle = `rgba(${T.glow},${a})`; c.lineWidth = 1; c.stroke();
}
// a floating diamond (live): a slab of geometry hovering at z
function axGem(c, u, v, z, r, t, T, ph = 0) {
  const [x, y0] = pt(u, v, z), y = y0 - Math.sin(t * 1.6 + ph) * 2, w = r * (0.75 + 0.25 * Math.cos(t * 1.2 + ph));
  c.fillStyle = AXC.obs[0]; poly(c, [[x, y - r * 1.4], [x + w, y], [x, y + r * 0.8], [x - w, y]]); c.fill();
  c.fillStyle = `rgba(${T.glow},0.55)`; poly(c, [[x, y - r * 1.4], [x + w * 0.35, y], [x, y + r * 0.8]]); c.fill();
}
// Axis (HQ): a stepped obsidian ziggurat under a great monolith; corner obelisks at T2, a second ring at T3; its lance on top
const AXISZ = [0, 74, 80, 88];
function axisBody(c, T, tier) {
  axBase(c, 44, T, tier);
  slab(c, 0, 0, 34, 34, 5, 12, T, 0.25); slab(c, 0, 0, 24, 24, 17, 10, T, 0.3);
  if (tier >= 2) for (const [u, v] of [[-30, -30], [30, -30], [-30, 30], [30, 30]]) obelisk(c, u, v, 4, 5, 26 + tier * 4, T, 0.4);
  obelisk(c, 0, 0, 12, 27, AXISZ[tier] - 30, T, 0.55);
}
function axisLive(c, T, t, b, tier) {
  axRing(c, 0, 0, AXISZ[tier] * 0.62, 20, t, T, 0.8);
  if (tier >= 3) axRing(c, 0, 0, AXISZ[tier] * 0.4, 28, t + 2, T, -0.6, 0.5);
  const [hx, hy] = pt(0, 0, AXISZ[tier]), a = gunAngle(b, hx, hy, -0.4);
  c.save(); c.translate(hx, hy); c.rotate(a); // the lance: a floating shard pointed at its target
  c.fillStyle = AXC.obs[0]; c.beginPath(); c.moveTo(-6, -3); c.lineTo(16, 0); c.lineTo(-6, 3); c.closePath(); c.fill();
  c.fillStyle = `rgba(${T.glow},${0.6 + 0.3 * Math.sin(t * 4)})`; c.beginPath(); c.arc(14, 0, 1.8, 0, 7); c.fill();
  c.restore();
}
// Matter Loom (refinery): two pylons with a turning cube of matter suspended between them
function loomBody(c, T, tier) {
  axBase(c, 32, T, tier);
  slab(c, 0, 0, 22, 18, 5, 8, T, 0.25);
  for (const u of [-14, 14]) obelisk(c, u, 0, 5, 13, 22 + tier * 3, T, 0.45);
  if (tier >= 3) obelisk(c, 0, 14, 4, 13, 18, T, 0.4);
}
function loomLive(c, T, t, b, tier) { axGem(c, 0, 0, 30 + tier * 3, 5 + tier, t * 1.5, T); }
// Singularity Well (reactor): a ring of stone pillars around a black pit; a dark sphere floats over it, pulsing
function wellBody(c, T, tier) {
  axBase(c, 30, T, tier);
  const [x, y] = pt(0, 0, 5); c.fillStyle = '#05060d'; c.beginPath(); c.ellipse(x, y, 16 * 1.2247, 16 * 0.7071, 0, 0, 7); c.fill();
  const n = 3 + tier;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.4; obelisk(c, Math.cos(a) * 22, Math.sin(a) * 22, 3.2, 5, 18 + tier * 2, T, 0.35); }
}
function wellLive(c, T, t, b, tier) {
  const k = 0.5 + 0.5 * Math.sin(t * 2.4), [x, y] = pt(0, 0, 30 + tier * 2), r = 6 + tier;
  glow(c, x, y, r * 0.9, T.glow, 0.15 + 0.25 * k);
  c.fillStyle = '#07080f'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.strokeStyle = `rgba(${T.glow},${0.4 + 0.4 * k})`; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, r + 1.5, 0, 7); c.stroke();
}
// Continuum Spire (habitat): one, two or three slender obelisks on a low stepped base
function contBody(c, T, tier) {
  axBase(c, 32, T, tier);
  slab(c, 0, 0, 20, 20, 5, 5, T, 0.2);
  for (const [u, v, h] of [[0, 0, 30], [-14, 12, 22], [14, -12, 22]].slice(0, tier)) obelisk(c, u, v, 5, 10, h, T, 0.45);
}
function contLive(c, T, t, b, tier) { const [x, y] = pt(0, 0, 42); glow(c, x, y, 2.2, T.glow, 0.3 + 0.35 * Math.sin(t * 2)); }
// Genesis Gate (barracks): two pillars and a lintel framing a shimmering portal where Shardlings form
function gateBody(c, T, tier) {
  axBase(c, 32, T, tier);
  slab(c, 0, 0, 24, 12, 5, 5, T, 0.2);
  for (const u of [-18, 18]) slab(c, u, 0, 5, 7, 10, 32, T, 0);
  slab(c, 0, 0, 23, 7, 42, 6, T, 0.35);
  if (tier >= 2) for (const u of [-24, 24]) obelisk(c, u, 10, 3, 5, 18, T, 0.35);
}
function gateLive(c, T, t, b, tier) {
  const a = pt(-13, 0, 10), b2 = pt(13, 0, 10), c2 = pt(13, 0, 42), d = pt(-13, 0, 42);
  c.fillStyle = `rgba(${T.glow},${0.12 + 0.08 * Math.sin(t * 3)})`; poly(c, [a, b2, c2, d]); c.fill();
  c.strokeStyle = `rgba(${AXC.pale},0.3)`; c.lineWidth = 1; for (let i = 0; i < 3; i++) { const k = ((t * 0.4 + i / 3) % 1); const p = pt(-13, 0, 10 + k * 32), q = pt(13, 0, 10 + k * 32); c.beginPath(); c.moveTo(...p); c.lineTo(...q); c.stroke(); }
}
// Architectum (factory): a broad buttressed block; a great slab hovers over it while Bastions take shape
function archBody(c, T, tier) {
  axBase(c, 36, T, tier);
  slab(c, -2, 2, 26, 24, 5, 18, T, 0.3);
  for (const [u, v] of [[-26, 18], [22, 22], [-26, -22]]) slab(c, u, v, 5, 5, 5, 12 + tier * 3, T, 0);
  if (tier >= 3) obelisk(c, 24, -22, 4, 5, 30, T, 0.4);
}
function archLive(c, T, t, b, tier) {
  const z = 32 + Math.sin(t * 1.2) * 2;
  box(c, -2, 2, 18, 15, z, 4, AXC.obs);
  c.strokeStyle = `rgba(${T.glow},0.5)`; c.lineWidth = 1; c.beginPath(); c.moveTo(...pt(-20, 17, z)); c.lineTo(...pt(16, 17, z)); c.stroke();
}
// Null Lance (turret): a stone pedestal under a floating prism that turns to its target; three orbiting shards at T2 (Split
// Lattice), a ring and a longer prism at T3 (Event Horizon)
const LANCEZ = [0, 30, 32, 36];
function lanceBody(c, T, tier) {
  axBase(c, 26, T, tier);
  slab(c, 0, 0, 10, 10, 5, 14, T, 0.35);
  if (tier >= 3) for (const [u, v] of [[-18, -18], [18, 18]]) obelisk(c, u, v, 3, 5, 20, T, 0.4);
}
function lanceLive(c, T, t, b, tier) {
  const [hx, hy] = pt(0, 0, LANCEZ[tier] + Math.sin(t * 1.5) * 1.5), a = gunAngle(b, hx, hy, -0.3), L0 = tier >= 3 ? 20 : 14;
  if (tier === 2) for (let i = 0; i < 3; i++) { const an = t * 1.4 + i * 2.09, [x, y] = pt(Math.cos(an) * 14, Math.sin(an) * 14, LANCEZ[2] - 4); c.fillStyle = AXC.obs[0]; poly(c, [[x, y - 4], [x + 2.2, y], [x, y + 2.5], [x - 2.2, y]]); c.fill(); c.fillStyle = `rgba(${T.glow},0.7)`; c.fillRect(x - 0.6, y - 1.5, 1.2, 2); }
  if (tier >= 3) axRing(c, 0, 0, LANCEZ[3] - 6, 14, t, T, 1.6);
  c.save(); c.translate(hx, hy); c.rotate(a);
  c.fillStyle = AXC.obs[0]; c.beginPath(); c.moveTo(-7, 0); c.lineTo(0, -5); c.lineTo(L0, 0); c.lineTo(0, 5); c.closePath(); c.fill();
  c.fillStyle = AXC.stone[0]; c.beginPath(); c.moveTo(-7, 0); c.lineTo(0, -5); c.lineTo(L0, 0); c.closePath(); c.fill();
  c.fillStyle = `rgba(${T.glow},${0.55 + 0.35 * Math.sin(t * 5)})`; c.beginPath(); c.arc(L0 - 2, 0, 1.8, 0, 7); c.fill();
  c.restore();
}
// Celestial Array (techlab): a tall needle of stone crowned by floating rings, where Wraithwings form in the air
const ARRAYZ = [0, 74, 80, 88];
function arrayBody(c, T, tier) {
  axBase(c, 30, T, tier);
  slab(c, 0, 0, 16, 16, 5, 10, T, 0.3);
  obelisk(c, 0, 0, 7, 15, ARRAYZ[tier] - 24, T, 0.5);
  if (tier >= 2) for (const [u, v] of [[-20, 16], [18, -18]]) obelisk(c, u, v, 3, 5, 26, T, 0.35);
}
function arrayLive(c, T, t, b, tier) { axRing(c, 0, 0, ARRAYZ[tier] - 14, 14, t, T, 1); if (tier >= 2) axRing(c, 0, 0, ARRAYZ[tier] - 24, 19, t + 1.5, T, -0.7, 0.5); }
/* Phase Beacon (v2.34): an obsidian projector whose crystal lens points to its bubble; T2 a floating ring and twin vanes,
   T3 three orbiting shards and a second ring. While the bubble is collapsed the lens goes dark and the shards fall still. */
const BKZ = [0, 44, 48, 54]; // lens height
function beaconBody(c, T, tier) {
  axBase(c, 32, T, tier);
  slab(c, 0, 0, 16, 16, 5, 8, T, 0.3);
  if (tier >= 2) for (const [u, v] of [[-18, 14], [14, -18]]) obelisk(c, u, v, 3.5, 5, 22 + tier * 3, T, 0.4); // vanes
  obelisk(c, 0, 0, 8, 13, BKZ[tier] - 16, T, 0.55);
}
function beaconLive(c, T, t, b, tier) {
  const down = b && game && b.col > game.t, [x, y] = pt(0, 0, BKZ[tier]), k = 0.5 + 0.5 * Math.sin(t * 2.2);
  if (!down) glow(c, x, y, 4 + tier, T.glow, 0.25 + 0.3 * k);
  c.fillStyle = down ? '#3a3f55' : `rgba(${AXC.pale},0.95)`; c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x + 4, y); c.lineTo(x, y + 5); c.lineTo(x - 4, y); c.closePath(); c.fill();
  if (tier >= 2) axRing(c, 0, 0, BKZ[tier] - 10, 14, down ? 0 : t, T, 1.2, down ? 0.25 : 0.7);
  if (tier >= 3) { axRing(c, 0, 0, BKZ[tier] - 22, 20, down ? 0 : t + 1.5, T, -0.8, down ? 0.2 : 0.5); for (let i = 0; i < 3; i++) { const a = (down ? 0 : t * 0.9) + i * 2.09; axGem(c, Math.cos(a) * 18, Math.sin(a) * 18, BKZ[tier] - 14, 3, down ? 0 : t, T, i); } }
}
/* Echo Reliquary (v2.34): a sealed obsidian vault under a crystal canopy; each stored echo floats above it as a pale mote.
   T2 a wider canopy with corner obelisks; T3 a ring of glyph stones and a second canopy tier. */
function reliquaryBody(c, T, tier) {
  axBase(c, 32, T, tier);
  if (tier >= 3) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; slab(c, Math.cos(a) * 24, Math.sin(a) * 24, 3, 3, 5, 9, T, 0.4); } // glyph stones
  slab(c, 0, 0, 18, 14, 5, 14, T, 0.35); // the vault
  slab(c, 0, 0, 14, 10, 19, 6, T, 0.25);
  if (tier >= 2) for (const [u, v] of [[-20, -20], [20, 20], [20, -20]]) obelisk(c, u, v, 3, 5, 30 + tier * 2, T, 0.35); // corner obelisks (none in front of the vault)
  for (let i = 0; i < (tier >= 3 ? 2 : 1); i++) { const z = 36 + i * 9, r = 15 - i * 5; poly(c, [pt(-r, -r, z), pt(r, -r, z), pt(r, r, z), pt(-r, r, z)]); c.fillStyle = `rgba(${AXC.pale},${0.14 + i * 0.08})`; c.fill(); c.strokeStyle = `rgba(${T.glow},0.55)`; c.lineWidth = 1; c.stroke(); } // a floating crystal canopy (a second, smaller one at T3)
}
function reliquaryLive(c, T, t, b, tier) {
  const n = b && b.ech ? b.ech.length : tier >= 2 ? 2 : 1, max = ECHO.n[tier];
  for (let i = 0; i < max; i++) {
    const a = t * 0.7 + i / max * Math.PI * 2, [x, y] = pt(Math.cos(a) * 10, Math.sin(a) * 10, 27 + Math.sin(t * 2 + i) * 2);
    if (i < n) { glow(c, x, y, 2.4, AXC.pale, 0.55 + 0.3 * Math.sin(t * 3 + i)); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, 1.1, 0, 7); c.fill(); } // a stored echo
    else { c.strokeStyle = `rgba(${T.glow},0.35)`; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y, 2, 0, 7); c.stroke(); } // an empty place
  }
}
const BART_AX = {
  hq: [axisBody, axisLive], refinery: [loomBody, loomLive], reactor: [wellBody, wellLive], habitat: [contBody, contLive],
  barracks: [gateBody, gateLive], factory: [archBody, archLive], turret: [lanceBody, lanceLive], techlab: [arrayBody, arrayLive],
  sigA: [beaconBody, beaconLive], sigB: [reliquaryBody, reliquaryLive], // v2.34
};
const BARTS = { lastfist: BART, bloomhost: BART_BH, axiarchs: BART_AX };
const artOf = (fac, type) => (BARTS[fac] || BART)[type];
const DRAW_B_BH = {};
for (const k in BART_BH) DRAW_B_BH[k] = (c, T, t, b, tier) => { BART_BH[k][0](c, T, tier); BART_BH[k][1](c, T, t, b, tier); };
const DRAW_B_AX = {};
for (const k in BART_AX) DRAW_B_AX[k] = (c, T, t, b, tier) => { BART_AX[k][0](c, T, tier); BART_AX[k][1](c, T, t, b, tier); };
const drawBOf = fac => fac === 'bloomhost' ? DRAW_B_BH : fac === 'axiarchs' ? DRAW_B_AX : DRAW_B;
function drawNodeZone(c, n, time, inView = true) { // ownership is public; progress and contest only when in view
  const NODE_R = n.r || NODE_R0(), w = P(n.u, MAP_2D ? n.v : 0), col = n.owner === null ? '210,195,255' : TEAM[n.owner].glow, ry = MAP_2D ? NODE_R * DY : (LANE_V + 18) * DY; // v2.65: a circle on a grid map
  c.fillStyle = `rgba(${col},0.05)`; c.beginPath(); c.ellipse(w.x, w.y, NODE_R, ry, 0, 0, 7); c.fill();
  c.setLineDash([6, 6]); c.strokeStyle = `rgba(${col},0.35)`; c.lineWidth = 1.3; c.stroke(); c.setLineDash([]);
  if (inView && (Math.abs(n.prog) > 0.5 && n.owner === null || (n.owner !== null && Math.abs(n.prog) < 100))) {
    const side = n.prog > 0 ? 0 : 1;
    c.strokeStyle = TEAM[side].main; c.lineWidth = 3.5;
    c.beginPath(); c.ellipse(w.x, w.y, NODE_R, ry, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.abs(n.prog) / 100); c.stroke();
  }
  if (inView && n.c[0] && n.c[1]) { c.strokeStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(time * 10)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(w.x, w.y, NODE_R + 4, ry + 3, 0, 0, 7); c.stroke(); }
}
// A Depot T2 bunker's heal zone (v2.32): faint green, the gun's range along the lane across its whole depth
function drawHealRing(c, b, time) {
  const w = P(b.u, 0), rx = BDEF.bunker.gun[b.tier].range, ry = (LANE_V + 18) * DY;
  c.fillStyle = 'rgba(93,255,138,0.035)'; c.beginPath(); c.ellipse(w.x, w.y, rx, ry, 0, 0, 7); c.fill();
  c.setLineDash([3, 7]); c.lineDashOffset = -time * 6; c.strokeStyle = 'rgba(93,255,138,0.24)'; c.lineWidth = 1.2; c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
}
const NODE_R0 = () => NODE_R;
// v2.65: a watchtower: a lattice mast with a lamp that sweeps once held
function drawTower(c, n, time) {
  const w = P(n.u, n.v), rgb = n.owner === null ? '210,195,255' : TEAM[n.owner].glow, main = n.owner === null ? '#ddd2ff' : TEAM[n.owner].main;
  c.save(); c.translate(w.x, w.y); c.scale(BS, BS);
  box(c, 0, 0, 14, 14, 0, 5, MAT.dark);
  c.strokeStyle = M.h; c.lineWidth = 1.6;
  for (const [a, b] of [[-8, -8], [8, -8], [8, 8], [-8, 8]]) { const [x0, y0] = pt(a, b, 5), [x1, y1] = pt(a * 0.35, b * 0.35, 58); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  for (const z of [22, 40]) { const k = 1 - (z - 5) / 53 * 0.65, q = [[-8, -8], [8, -8], [8, 8], [-8, 8]].map(([a, b]) => pt(a * k, b * k, z)); c.lineWidth = 1; poly(c, q); c.stroke(); }
  box(c, 0, 0, 5, 5, 58, 6, MAT.metal);
  const [lx, ly] = pt(0, 0, 66);
  glow(c, lx, ly, 3, rgb, 0.6 + 0.3 * Math.sin(time * 3));
  if (n.owner !== null) { const a = time * 1.2 + n.u; c.fillStyle = `rgba(${rgb},0.12)`; c.beginPath(); c.moveTo(lx, ly); c.arc(lx, ly, 46, a - 0.25, a + 0.25); c.closePath(); c.fill(); }
  c.fillStyle = main; c.fillRect(lx - 1, ly - 9, 1.6, 6);
  c.restore();
}
// v2.65: a forward pad's capture post: a short pylon between its two pads
function drawFwdPost(c, n, time) {
  const w = P(n.u, n.v), rgb = n.owner === null ? '210,195,255' : TEAM[n.owner].glow;
  c.save(); c.translate(w.x, w.y); c.scale(BS, BS);
  box(c, 0, 0, 8, 8, 0, 4, MAT.dark); cyl(c, 0, 0, 3, 4, 20, M.h, M.m, '#9aa7ba');
  const [x, y] = pt(0, 0, 28); glow(c, x, y, 3, rgb, 0.5 + 0.4 * Math.sin(time * 4 + n.u));
  c.restore();
}
// v2.65: a forward pad (FWD_PADS k): a plain plate in its holder's colour, faint while nobody holds it
function drawFwdPad(c, k, owner, empty, time, selected) {
  const F = FWD_PADS[k], w = P(F.at[0], F.at[1]), h = PAD_H, rgb = owner === null ? '210,195,255' : TEAM[owner].glow;
  const P4 = [pt(-h, -h), pt(h, -h), pt(h, h), pt(-h, h)].map(([a, b]) => [w.x + a, w.y + b]);
  poly(c, P4); c.fillStyle = owner === null ? 'rgba(26,30,44,0.7)' : 'rgba(26,33,50,0.95)'; c.fill();
  c.setLineDash(owner === null ? [5, 5] : []); c.strokeStyle = selected ? 'rgba(255,211,77,0.9)' : `rgba(${rgb},${empty ? 0.45 + 0.25 * Math.sin(time * 2.5 + w.x * 0.02) : 0.3})`; c.lineWidth = selected ? 2 : 1.2; c.stroke(); c.setLineDash([]);
  if (empty) { const [x, y] = [w.x, w.y]; c.strokeStyle = `rgba(${rgb},0.5)`; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x + 5, y); c.moveTo(x, y - 3); c.lineTo(x, y + 3); c.stroke(); }
}
// v2.71: a repair depot: a low pad with a cross that glows its holder's colour; a relic: a gold obelisk, dark once spent
function drawDepot(c, n, time) {
  const w = P(n.u, n.v), rgb = n.owner === null ? '93,255,138' : TEAM[n.owner].glow;
  c.save(); c.translate(w.x, w.y); c.scale(BS, BS);
  box(c, 0, 0, 18, 18, 0, 5, MAT.dark);
  const [x, y] = pt(0, 0, 18), a = 0.55 + 0.3 * Math.sin(time * 3 + n.u);
  glow(c, x, y, 6, rgb, 0.35);
  c.fillStyle = `rgba(${rgb},${a})`; c.fillRect(x - 3, y - 10, 6, 20); c.fillRect(x - 10, y - 3, 20, 6);
  c.restore();
}
function drawRelic(c, n, time) {
  const w = P(n.u, n.v), spent = n.spent, gold = spent ? '#5b5446' : '#e8c25a';
  c.save(); c.translate(w.x, w.y); c.scale(BS, BS);
  box(c, 0, 0, 16, 16, 0, 6, MAT.dark);
  const [bx, by] = pt(0, 0, 6), [tx, ty] = pt(0, 0, 54);
  c.fillStyle = gold; c.strokeStyle = 'rgba(20,14,4,0.8)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(bx - 9, by); c.lineTo(tx - 4, ty + 8); c.lineTo(tx, ty); c.lineTo(tx + 4, ty + 8); c.lineTo(bx + 9, by); c.closePath(); c.fill(); c.stroke();
  if (!spent) glow(c, tx, ty + 4, 5, '255,214,110', 0.45 + 0.25 * Math.sin(time * 2.4 + n.u));
  c.restore();
}
function drawNode(c, n, time) {
  if (n.type === 'watchtower') return drawTower(c, n, time);
  if (n.type === 'repair') return drawDepot(c, n, time);
  if (n.type === 'relic') return drawRelic(c, n, time);
  if (n.type === 'forwardPad') return drawFwdPost(c, n, time);
  const w = P(n.u, n.v), rgb = n.owner === null ? '210,195,255' : TEAM[n.owner].glow, main = n.owner === null ? '#ddd2ff' : TEAM[n.owner].main;
  c.save(); c.translate(w.x, w.y); c.scale(BS, BS);
  box(c, 0, 0, 20, 20, 0, 6, MAT.dark);
  cyl(c, -11, -11, 3, 6, 24, M.h, M.m, '#9aa7ba');
  cone(c, 0, 0, 10, 4, 6, 18, '#7a8aa6', '#2a3448', '#9aa7ba');
  cyl(c, 11, 11, 3, 6, 24, M.h, M.m, '#9aa7ba');
  const z = 44 + Math.sin(time * 2 + n.u) * 3, [x, y] = pt(0, 0, z), sp = Math.abs(Math.cos(time * 1.6 + n.u));
  glow(c, x, y, 7, rgb, 0.3);
  c.fillStyle = main; c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x + 6 * sp + 1.5, y); c.lineTo(x, y + 12); c.lineTo(x - 6 * sp - 1.5, y); c.closePath(); c.fill();
  if (n.mul > 1) { const [x2, y2] = pt(0, 0, z + 18); c.fillStyle = main; c.globalAlpha = 0.7; c.beginPath(); c.moveTo(x2, y2 - 6); c.lineTo(x2 + 3.5 * sp + 1, y2); c.lineTo(x2, y2 + 6); c.lineTo(x2 - 3.5 * sp - 1, y2); c.closePath(); c.fill(); c.globalAlpha = 1; } // v2.65: a rich node carries a second crystal
  c.restore();
}
// Unit sprites: side view facing +x, feet on y = 0. Gun tips sit on the SIM's muzzle points (MUZ) so shots leave the barrel.
// Flat fills only (no gradients) and a handful of paths each, so a full battle stays cheap to draw.
function limb(c, x0, y0, x1, y1, x2, y2) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
function legs(c, st, hip, w, col) { // two jointed legs; st = walk phase (−1…1)
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
  limb(c, -1, -hip, -1 - st * 1.2 + 1, -hip / 2, -1 - st * 3, 0);
  limb(c, 1, -hip, 1 + st * 1.2 + 1, -hip / 2, 1 + st * 3, 0);
}
function dRifle(c, T, u) {
  const st = u.moving ? Math.sin(u.anim * 11) : 0, rk = u.recoil * 1.5;
  legs(c, st, 8, 2.6, M.d);
  c.fillStyle = M.m; rr(c, -6.2, -17, 3.4, 7, 1.2); c.fill();                       // pack
  c.fillStyle = T.hull; rr(c, -3.8, -17.2, 7.6, 10, 2); c.fill();
  c.fillStyle = T.main; poly(c, [[-2.4, -16.4], [3, -16.4], [3.4, -12], [-2, -12]]); c.fill(); // chest plate
  c.fillStyle = M.d; c.fillRect(-3.8, -8.8, 7.6, 1.4);
  c.fillStyle = M.l; c.beginPath(); c.arc(0.2, -19.8, 3.5, 0, 7); c.fill();           // helmet
  c.fillStyle = T.light; c.fillRect(0.9, -20.8, 3, 1.7);                              // visor
  c.fillStyle = M.m; c.fillRect(-3.6 - rk, -13.6, 2.2, 3);                            // stock
  c.fillStyle = M.h; c.fillRect(-2 - rk, -14, 12, 2);                                 // rifle, tip at x 10
  c.fillStyle = M.d; c.fillRect(2 - rk, -12.4, 2, 3.2);
  c.strokeStyle = T.hull; c.lineWidth = 2; limb(c, -0.5, -15.5, 1.5, -12.5, 3.5 - rk, -13);
}
function dHeavy(c, T, u) {
  const st = u.moving ? Math.sin(u.anim * 8) : 0, rk = u.recoil * 2;
  legs(c, st * 1.1, 10, 3.8, M.d);
  c.fillStyle = M.m; c.fillRect(-4.4, -2.2, 3.4, 2.2); c.fillRect(1.6, -2.2, 3.4, 2.2);         // boots
  c.fillStyle = T.hull; rr(c, -6.5, -22, 13, 13, 3.5); c.fill();
  c.fillStyle = T.main; c.fillRect(-6.5, -15.2, 13, 2.2);
  c.fillStyle = M.d; c.fillRect(-5.5, -10.6, 11, 1.6);
  c.fillStyle = M.l; rr(c, -3, -26.5, 7.5, 6.5, 2.5); c.fill();                        // helmet
  c.fillStyle = T.light; c.fillRect(1.6, -24, 3, 1.8);
  c.fillStyle = M.d; poly(c, [[-8 - rk, -29], [-11 - rk, -30.5], [-11 - rk, -23.5], [-8 - rk, -25]]); c.fill(); // exhaust bell
  c.fillStyle = M.m; c.fillRect(-8 - rk, -29.5, 20, 5);                               // launcher, tip at x 12
  c.fillStyle = T.main; c.fillRect(9.4 - rk, -30, 2.6, 6);
  c.fillStyle = M.d; c.fillRect(-1 - rk, -24.5, 3, 3);
  c.fillStyle = M.l; rr(c, -8.5, -23, 6.5, 6, 2); c.fill();                            // shoulder plate
  c.fillStyle = T.main; c.fillRect(-8, -19.5, 5.5, 1.2);
}
function dSniper(c, T, u) {
  const st = u.moving ? Math.sin(u.anim * 10) : 0, rk = u.recoil * 2;
  c.fillStyle = M.d; poly(c, [[-4, -17.5], [3, -17], [4, -6], [-8.5, -3.5]]); c.fill();   // cloak
  legs(c, st, 8, 2.2, M.d);
  c.fillStyle = T.hull; rr(c, -3, -16.5, 6.4, 9, 2); c.fill();
  c.fillStyle = M.m; poly(c, [[-4, -18], [0, -23.2], [3.8, -19.5], [2.8, -16.5], [-3.5, -16]]); c.fill(); // hood
  c.fillStyle = T.light; c.beginPath(); c.arc(2.5, -19.3, 1.2, 0, 7); c.fill();       // lens
  c.fillStyle = M.h; c.fillRect(-5 - rk, -14.8, 22, 1.6);                             // rail rifle, tip at x 17
  c.fillStyle = M.d; rr(c, 0.5 - rk, -17.8, 7, 2.4, 1); c.fill();                      // scope
  c.fillStyle = T.light; c.fillRect(6.6 - rk, -17.4, 0.9, 1.6);
  c.fillStyle = T.main; c.fillRect(10 - rk, -15.6, 1.2, 3.2); c.fillRect(12.4 - rk, -15.6, 1.2, 3.2); c.fillRect(15.2 - rk, -15.4, 1.8, 2.8); // coils
  c.strokeStyle = M.d; c.lineWidth = 0.9; limb(c, 9 - rk, -13.4, 11 - rk, -9, 12.5 - rk, -6.5); // bipod
  c.strokeStyle = T.hull; c.lineWidth = 1.8; limb(c, -0.5, -15, 1.5, -12.8, 3 - rk, -13.8);
}
function dTank(c, T, u) {
  const rk = u.recoil * 4, sp = u.moving ? u.anim * 30 : 0;
  c.fillStyle = M.d; rr(c, -22, -9, 44, 9, 4.5); c.fill();                            // track
  c.fillStyle = M.m;
  for (let i = 0; i < 8; i++) c.fillRect(-20 + ((i * 5 + sp) % 40 + 40) % 40, -9, 1.6, 1.4);
  for (let i = 0; i < 5; i++) { c.fillStyle = M.l; c.beginPath(); c.arc(-16 + i * 8, -4.2, 2.8, 0, 7); c.fill(); c.fillStyle = M.d; c.fillRect(-16.8 + i * 8, -5, 1.6, 1.6); }
  c.fillStyle = T.hull; poly(c, [[-22, -8.5], [-18, -15.5], [14, -15.5], [23, -10], [21, -8.5]]); c.fill(); // hull and skirt
  c.fillStyle = T.main; c.fillRect(-15, -12.8, 26, 2);
  c.fillStyle = M.m; c.fillRect(-20, -17, 4, 2);                                       // exhaust
  c.fillStyle = M.h; c.fillRect(7 - rk, -19.3, 17, 2.6); c.fillRect(23 - rk, -20.2, 4, 4.4); // barrel and muzzle brake, tip at x 27
  c.fillStyle = M.l; poly(c, [[-11, -15.5], [-8, -22], [6, -22], [10, -15.5]]); c.fill(); // turret
  c.fillStyle = T.main; c.fillRect(-9.5, -18.6, 18, 1.4);
  c.fillStyle = M.m; rr(c, -5.5, -24.4, 6, 2.8, 1.2); c.fill();                         // hatch
  c.strokeStyle = M.h; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-7.5, -22); c.lineTo(-9.5, -30); c.stroke();
  c.fillStyle = T.light; c.fillRect(-10.2, -31, 1.6, 1.6);
}
function dArt(c, T, u) {
  const rk = u.recoil * 6;
  c.fillStyle = M.m; poly(c, [[-18, -10], [-27, -1], [-23.5, -1], [-15, -8.5]]); c.fill(); // rear spade
  c.save(); c.translate(0, -15); c.rotate(-0.52);
  c.fillStyle = M.h; c.fillRect(-6 - rk, -1.8, 38, 3.6);                                 // barrel, tip at (28, −31)
  c.fillStyle = T.main; c.fillRect(27 - rk, -2.4, 5, 4.8);
  c.fillStyle = M.l; rr(c, -9, -4.5, 14, 9, 2); c.fill();                                // breech
  c.restore();
  c.strokeStyle = M.h; c.lineWidth = 1.6; c.beginPath(); c.moveTo(6, -12); c.lineTo(10, -19.5); c.stroke(); // ram
  c.fillStyle = T.hull; rr(c, -20, -14, 36, 7.5, 2.5); c.fill();
  c.fillStyle = T.main; c.fillRect(-18, -12, 14, 1.6);
  c.fillStyle = M.m; rr(c, 4, -20, 9, 7, 1.5); c.fill();                                // cab
  c.fillStyle = T.light; c.fillRect(9.5, -18.5, 2.6, 2.2);
  for (const x of [-13, -1, 11]) {
    c.fillStyle = M.d; c.beginPath(); c.arc(x, -5, 5, 0, 7); c.fill();
    c.fillStyle = M.l; c.beginPath(); c.arc(x, -5, 2, 0, 7); c.fill();
  }
}
// Titan: a bipedal walker. Slow, heavy steps: the body dips as each foot lands.
function mechLeg(c, ph, near) {
  const s = Math.sin(ph), lift = Math.max(0, Math.cos(ph)) * 4.5, fx = s * 9, hx = near ? 2 : -2;
  const kx = hx + fx * 0.45 + 5, ky = -12 - lift * 0.6;
  c.strokeStyle = near ? M.l : M.m; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';
  limb(c, hx, -23, kx, ky, fx, -2.5 - lift);
  c.fillStyle = near ? M.m : M.d; c.beginPath(); c.arc(hx, -23, 4.2, 0, 7); c.fill();                  // hip
  c.fillStyle = near ? M.m : M.d; poly(c, [[fx - 5, -lift], [fx + 9, -lift], [fx + 7, -4 - lift], [fx - 3, -4.5 - lift]]); c.fill(); // foot
  c.fillStyle = near ? M.h : M.l; c.beginPath(); c.arc(kx, ky, 2.6, 0, 7); c.fill();         // knee
}
function dTitan(c, T, u) {
  const ph = u.moving ? u.anim * 3.2 : 0, bob = u.moving ? -Math.abs(Math.cos(ph)) * 1.8 + 1.8 : 0, rk = u.recoil * 4;
  mechLeg(c, ph + Math.PI, false);
  c.save(); c.translate(0, bob);
  c.strokeStyle = M.d; c.lineWidth = 4; limb(c, -4, -34, -2, -26, 4, -22);                 // far arm
  c.fillStyle = M.d; rr(c, -9, -27, 18, 6, 2); c.fill();                                   // pelvis
  c.fillStyle = M.m; rr(c, -16, -50, 12, 9, 2); c.fill();                                  // missile pod
  c.fillStyle = T.light; for (let i = 0; i < 3; i++) c.fillRect(-14 + i * 3.4, -48, 2, 2);
  c.fillStyle = T.hull; poly(c, [[-13, -25], [12, -25], [15, -33], [10, -43], [-11, -43], [-16, -34]]); c.fill(); // torso
  c.fillStyle = T.main; poly(c, [[-12, -31], [14, -31], [13.2, -28.6], [-11.2, -28.6]]); c.fill();
  c.fillStyle = M.d; poly(c, [[4, -41], [10, -41], [12.6, -36], [6, -36]]); c.fill();       // cockpit
  c.fillStyle = T.light; c.fillRect(7, -39.6, 4.6, 1.8);
  c.restore();
  mechLeg(c, ph, true);
  c.save(); c.translate(-rk, bob);
  c.strokeStyle = M.l; c.lineWidth = 4.5; limb(c, 0, -36, 3, -30, 7, -27);                 // weapon arm
  c.fillStyle = M.h; c.fillRect(8, -30, 30, 2.2); c.fillRect(8, -26.2, 30, 2.2);           // twin cannon, tips at x 38
  c.fillStyle = M.l; rr(c, 3, -31.5, 15, 9, 2); c.fill();
  c.fillStyle = T.main; c.fillRect(35, -30.4, 3, 3); c.fillRect(35, -26.6, 3, 3); c.fillRect(5, -28.5, 11, 1.4);
  c.fillStyle = M.h; c.beginPath(); c.arc(0, -36, 3.6, 0, 7); c.fill();                    // shoulder
  c.restore();
}
function dAir(c, T, u) { // Gunship: rotor on top, chin gun underneath
  const fl = 0.6 + 0.4 * Math.sin(u.anim * 30), bl = Math.cos(u.anim * 40) * 19;
  c.fillStyle = `rgba(255,180,90,${0.55 * fl})`; c.beginPath(); c.ellipse(-25, -1, 7 * fl + 3, 2.5, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(200,215,240,0.16)'; c.beginPath(); c.ellipse(-2, -12, 20, 2, 0, 0, 7); c.fill(); // rotor disc
  c.strokeStyle = 'rgba(220,230,250,0.55)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-2 - bl, -12); c.lineTo(-2 + bl, -12); c.stroke();
  c.fillStyle = M.m; c.fillRect(-3, -12, 2, 4);                                          // mast
  c.fillStyle = T.hull;
  poly(c, [[23, 0], [16, -5.5], [4, -8], [-12, -7], [-23, -13], [-20, -3], [-23, 2], [-10, 4.5], [14, 5]]); c.fill();
  c.fillStyle = T.light; poly(c, [[16, -3], [10, -7], [3, -6.5], [5, -3]]); c.fill();   // canopy
  c.fillStyle = T.main; c.fillRect(-15, -2.5, 17, 1.6); c.fillRect(-23, -13, 3, 4);
  c.fillStyle = M.l; poly(c, [[-1, 1], [-12, 8], [-6, 8], [6, 1.5]]); c.fill();          // stub wing
  c.fillStyle = M.m; rr(c, -10, 6.5, 12, 3.4, 1.5); c.fill();                            // rocket pod
  c.fillStyle = T.main; c.fillRect(0.5, 6.7, 1.5, 3);
  c.fillStyle = M.d; c.beginPath(); c.arc(12, 4.6, 2.4, 0, 7); c.fill();                // chin gun, tip at (16, 5)
  c.fillRect(12, 3.9, 4 - u.recoil * 2, 2.2);
}
function dInter(c, T, u) { // Interceptor: a delta-wing dart with twin afterburners
  const fl = 0.6 + 0.4 * Math.sin(u.anim * 34);
  c.fillStyle = `rgba(140,220,255,${0.6 * fl})`;
  c.beginPath(); c.ellipse(-24, -2, 7 * fl + 3, 1.8, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(-24, 2, 7 * fl + 3, 1.8, 0, 0, 7); c.fill();
  c.fillStyle = M.l; poly(c, [[8, 0], [-16, 9], [-20, 9], [-12, 0]]); c.fill();           // delta wing
  c.fillStyle = T.main; poly(c, [[8, 0], [-16, 9], [-14.5, 9], [9.5, 0.5]]); c.fill();     // wing edge
  c.fillStyle = M.h; c.fillRect(13, 0.2, 7, 1.2);                                           // cannon, tip at (20, 0)
  c.fillStyle = T.hull;
  poly(c, [[27, -0.6], [10, -4], [-16, -4], [-22, -12], [-19, -2.5], [-21, 3], [-14, 3], [10, 2]]); c.fill();
  c.fillStyle = M.m; poly(c, [[-15, -4], [-19, -9], [-17, -9], [-11, -4]]); c.fill();      // second fin
  c.fillStyle = T.light; poly(c, [[15, -2.2], [7, -6], [1, -4]]); c.fill();               // canopy
  c.fillStyle = T.main; c.fillRect(-12, -2.4, 18, 1.4);
}
function dLev(c, T, u) { // Leviathan: a wide flying wing, four engines, an open bomb bay underneath (bombs drop from (0, 10))
  const fl = 0.6 + 0.4 * Math.sin(u.anim * 26);
  c.fillStyle = M.d; poly(c, [[30, 2], [-6, 14], [-26, 14], [-18, 2]]); c.fill();            // far wing (shadow side)
  for (const x of [-4, -14]) { c.fillStyle = `rgba(255,170,80,${0.55 * fl})`; c.beginPath(); c.ellipse(x - 21, 9 + (x + 4) * -0.25, 5 * fl + 2, 1.6, 0, 0, 7); c.fill(); }
  c.fillStyle = T.hull; poly(c, [[34, -1], [18, -6], [-22, -7], [-30, -3], [-28, 4], [-12, 6], [20, 4]]); c.fill(); // body
  c.fillStyle = M.l; poly(c, [[24, -2], [-8, -16], [-28, -16], [-20, -4]]); c.fill();        // near wing
  c.fillStyle = T.main; poly(c, [[24, -2], [-8, -16], [-11, -16], [20, -3]]); c.fill();      // wing edge
  for (const [x, y] of [[-6, -11], [-16, -13]]) {                                           // engines on the near wing
    c.fillStyle = M.m; rr(c, x - 6, y - 1.6, 9, 3.4, 1.6); c.fill();
    c.fillStyle = `rgba(255,170,80,${0.6 * fl})`; c.beginPath(); c.ellipse(x - 8, y, 4 * fl + 2, 1.4, 0, 0, 7); c.fill();
  }
  c.fillStyle = T.light; poly(c, [[28, -2.5], [20, -5.5], [14, -4]]); c.fill();             // cockpit
  c.fillStyle = M.d; rr(c, -8, 3, 14, 4, 1.5); c.fill();                                    // open bomb bay
  c.fillStyle = u.recoil > 0.02 ? '#ffb347' : M.m; c.fillRect(-5, 5, 3, 3); c.fillRect(0, 5, 3, 3);
  c.fillStyle = T.main; c.fillRect(-20, -1.2, 30, 1.4);
}
function dMedic(c, T, u) { // Medicopter: a white helicopter with a green cross
  const bl = Math.cos(u.anim * 40) * 18;
  c.fillStyle = 'rgba(200,215,240,0.16)'; c.beginPath(); c.ellipse(0, -12, 19, 2, 0, 0, 7); c.fill(); // rotor disc
  c.strokeStyle = 'rgba(230,240,250,0.6)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-bl, -12); c.lineTo(bl, -12); c.stroke();
  c.fillStyle = M.m; c.fillRect(-1, -12, 2, 4);
  c.fillStyle = '#e8edf3'; poly(c, [[16, 1], [12, -5], [0, -8], [-10, -6], [-22, -9], [-21, -3], [-10, 3], [10, 4.5]]); c.fill(); // body and tail
  c.fillStyle = T.main; c.fillRect(-22, -9, 3, 4); c.fillRect(-10, 1.5, 18, 1.4);
  c.fillStyle = T.light; poly(c, [[13, -2], [9, -6], [3, -6], [5, -2]]); c.fill();          // canopy
  c.fillStyle = '#2fd17a'; c.fillRect(-5.5, -5.2, 7, 2.4); c.fillRect(-3.2, -7.5, 2.4, 7);  // green cross
  c.fillStyle = M.d; c.fillRect(-8, 5, 16, 1.4); c.fillRect(-6, 3.5, 1.4, 2); c.fillRect(5, 3.5, 1.4, 2); // skids
}
function dDrone(c, T, u) { // Recon Drone: a small quad-rotor with a sensor eye
  const bl = Math.cos(u.anim * 50) * 5, blink = (Math.sin(u.anim * 4) + 1) / 2;
  c.strokeStyle = 'rgba(230,240,250,0.55)'; c.lineWidth = 1;
  for (const x of [-8, 8]) { c.beginPath(); c.moveTo(x - bl, -6); c.lineTo(x + bl, -6); c.stroke(); }
  c.fillStyle = M.m; c.fillRect(-9, -6, 18, 1.4); c.fillRect(-9, -6, 1.4, 3); c.fillRect(7.6, -6, 1.4, 3);
  c.fillStyle = T.hull; rr(c, -5, -4.5, 10, 6, 2.5); c.fill();
  c.fillStyle = T.main; c.fillRect(-4, -2.4, 8, 1.2);
  c.fillStyle = `rgba(120,240,255,${0.5 + 0.5 * blink})`; c.beginPath(); c.arc(4, 0, 1.6, 0, 7); c.fill(); // sensor
}
function dFlame(c, T, u) { // Flame Tank: a low hull with fuel tanks on the back and a nozzle in front (tip at x 26, y −12)
  const sp = u.moving ? u.anim * 30 : 0, rk = u.recoil * 1.5;
  c.fillStyle = M.d; rr(c, -21, -8.5, 42, 8.5, 4.2); c.fill();                            // track
  c.fillStyle = M.m; for (let i = 0; i < 8; i++) c.fillRect(-19 + ((i * 5 + sp) % 38 + 38) % 38, -8.5, 1.6, 1.4);
  for (let i = 0; i < 5; i++) { c.fillStyle = M.l; c.beginPath(); c.arc(-15 + i * 7.5, -4, 2.6, 0, 7); c.fill(); }
  c.fillStyle = T.hull; poly(c, [[-21, -8], [-18, -14], [12, -14], [21, -9.5], [19, -8]]); c.fill(); // hull
  c.fillStyle = T.main; c.fillRect(-14, -11.6, 24, 1.8);
  for (const x of [-17, -11]) { c.fillStyle = '#8a6a2a'; rr(c, x, -21, 5, 8, 2.4); c.fill(); c.fillStyle = '#c99a3a'; c.fillRect(x + 1, -20, 1.4, 6); } // fuel tanks
  c.fillStyle = M.l; poly(c, [[-5, -14], [-3, -19], [8, -19], [11, -14]]); c.fill();      // turret
  c.fillStyle = M.h; c.fillRect(9 - rk, -14.2, 14, 3.4); c.fillStyle = M.d; c.fillRect(22 - rk, -15, 4, 5); // nozzle
  c.fillStyle = 'rgba(255,170,70,0.9)'; c.beginPath(); c.arc(26 - rk, -12.5, 1.4, 0, 7); c.fill();      // pilot light
}
function dHydra(c, T, u) { // Hydra: a smaller four-legged walker with rotary guns on both shoulders (they tilt up for aircraft)
  const ph = u.moving ? u.anim * 3.6 : 0, bob = u.moving ? -Math.abs(Math.cos(ph)) * 1.4 + 1.4 : 0, up = u.aimAir ? -0.55 : 0, spin = u.recoil > 0.02 ? u.anim * 50 : 0;
  c.save(); c.scale(0.82, 0.82);
  mechLeg(c, ph + Math.PI, false); c.save(); c.translate(-9, 0); mechLeg(c, ph, false); c.restore();
  c.save(); c.translate(0, bob);
  c.fillStyle = M.d; rr(c, -14, -27, 26, 6, 2); c.fill();                                  // pelvis
  c.fillStyle = T.hull; poly(c, [[-15, -25], [13, -25], [16, -32], [11, -40], [-12, -40], [-17, -32]]); c.fill(); // body
  c.fillStyle = T.main; c.fillRect(-13, -31, 26, 2);
  c.fillStyle = M.d; poly(c, [[6, -39], [12, -39], [14, -34], [8, -34]]); c.fill(); c.fillStyle = T.light; c.fillRect(9, -37.6, 4, 1.6); // cockpit
  c.restore();
  mechLeg(c, ph, true); c.save(); c.translate(-9, 0); mechLeg(c, ph + Math.PI, true); c.restore();
  for (const [dx, dz] of [[-4, -44], [2, -41]]) { // shoulder guns, tips at about (37, −40) when level
    c.save(); c.translate(dx, dz + bob); c.rotate(up);
    c.fillStyle = M.l; rr(c, -5, -4, 12, 8, 2); c.fill();
    c.fillStyle = M.h; for (let i = 0; i < 3; i++) c.fillRect(6, -3 + ((i * 2.2 + spin) % 6.6), 30, 1.5);
    c.fillStyle = T.main; c.fillRect(-4, -0.8, 10, 1.6);
    c.restore();
  }
  c.restore();
}
// Bloomhost units (v2.17): side view facing +x, feet on y = 0, team colour as glowing eyes and glands.
function bugLegs(c, ph, xs, hip, len, w, col) { // jointed insect legs along the body; ph = walk phase
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
  xs.forEach((x, i) => { const s = Math.sin(ph + i * 2.1) * 2.2, lift = Math.max(0, Math.cos(ph + i * 2.1)) * 1.6; limb(c, x, -hip, x + 2 + s * 0.5, -hip - len * 0.35, x + 3 + s, -lift); });
}
function dSkitter(c, T, u) { // Skitterling: a low, fast six-legged biter
  const ph = u.moving ? u.anim * 14 : 0, bite = u.recoil * 2.5;
  bugLegs(c, ph + Math.PI, [-6, -1, 4], 4, 6, 1.4, BHC.chit[2]);
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.ellipse(-6, -6, 7, 4.2, -0.15, 0, 7); c.fill();         // abdomen
  c.fillStyle = BHC.chit[0]; c.beginPath(); c.ellipse(2, -6.5, 5, 3.6, 0, 0, 7); c.fill();            // thorax
  c.strokeStyle = 'rgba(20,10,30,0.5)'; c.lineWidth = 0.9; for (const x of [-9, -5]) { c.beginPath(); c.moveTo(x, -10); c.lineTo(x + 1, -2.6); c.stroke(); }
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.ellipse(7.5, -6, 3.4, 2.8, 0.2, 0, 7); c.fill();        // head
  c.strokeStyle = BHC.bone; c.lineWidth = 1.3; c.lineCap = 'round';                                   // mandibles
  c.beginPath(); c.moveTo(9.5, -7); c.quadraticCurveTo(12.5 + bite, -8.5, 13 + bite, -5.5); c.stroke();
  c.beginPath(); c.moveTo(9.5, -5); c.quadraticCurveTo(12 + bite, -3, 12.5 + bite, -5); c.stroke();
  c.fillStyle = T.light; c.fillRect(7.6, -7.6, 1.6, 1.2);                                              // eye
  c.fillStyle = T.main; c.fillRect(-9, -9.6, 6, 1.2);                                                  // gland stripe
  bugLegs(c, ph, [-5, 0, 5], 4, 6, 1.6, BHC.chit[2]);
}
function dMite(c, T, u) { // Mite (v2.33): a tiny pale hatchling with four legs and glowing gland spots
  const ph = u.moving ? u.anim * 18 : 0, bite = u.recoil * 2;
  bugLegs(c, ph + Math.PI, [-3, 2], 2.6, 4, 1, BHC.chit[2]);
  c.fillStyle = '#c9b48f'; c.beginPath(); c.ellipse(-2, -4, 4.6, 2.9, -0.1, 0, 7); c.fill(); // soft body
  c.fillStyle = BHC.chit[0]; c.beginPath(); c.ellipse(3.2, -4.2, 2.4, 2.1, 0, 0, 7); c.fill(); // head
  c.strokeStyle = BHC.bone; c.lineWidth = 1; c.lineCap = 'round'; c.beginPath(); c.moveTo(4.8, -4.8); c.lineTo(6.6 + bite, -3.6); c.moveTo(4.8, -3.4); c.lineTo(6.2 + bite, -2.8); c.stroke();
  c.fillStyle = T.main; c.fillRect(-4.5, -6, 1.4, 1.2); c.fillRect(-1.6, -6.3, 1.4, 1.2); // glands
  bugLegs(c, ph, [-2, 3], 2.6, 4, 1.1, BHC.chit[2]);
}
function dBulwark(c, T, u) { // Bulwark: a heavy plated crawler with a bony brow, built to take hits
  const ph = u.moving ? u.anim * 6 : 0, ram = u.recoil * 2.5;
  bugLegs(c, ph + Math.PI, [-12, -2, 8], 8, 9, 3, BHC.chit[2]);
  c.fillStyle = BHC.flesh[2]; c.beginPath(); c.ellipse(-2, -9, 18, 7, 0, 0, 7); c.fill();             // underbelly
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.moveTo(-20, -8); c.bezierCurveTo(-18, -26, 10, -28, 16, -12); c.lineTo(14, -6); c.lineTo(-18, -5); c.closePath(); c.fill(); // carapace
  c.strokeStyle = BHC.chit[0]; c.lineWidth = 2;                                                         // plate ridges
  for (const x of [-12, -4, 4]) { c.beginPath(); c.moveTo(x - 2, -6); c.quadraticCurveTo(x, -21, x + 5, -22); c.stroke(); }
  c.save(); c.translate(ram, 0);
  c.fillStyle = BHC.chit[0]; c.beginPath(); c.moveTo(12, -18); c.quadraticCurveTo(24, -16, 24, -8); c.lineTo(20, -4); c.lineTo(12, -6); c.closePath(); c.fill(); // brow shield
  c.fillStyle = BHC.bone; c.beginPath(); c.moveTo(22, -9); c.lineTo(28, -6); c.lineTo(21, -5); c.closePath(); c.fill(); // tusk
  c.fillStyle = T.light; c.fillRect(17, -12, 2.2, 1.6);                                                // eye
  c.restore();
  c.fillStyle = T.main; c.fillRect(-14, -14, 16, 1.4);                                                 // gland stripe
  bugLegs(c, ph, [-10, 0, 10], 8, 9, 3.4, BHC.chit[2]);
}
function dRazor(c, T, u) { // Razorwing: a sleek flyer with membrane wings and a hooked tail
  const fl = Math.sin(u.anim * 16), dive = u.recoil * 3;
  c.fillStyle = 'rgba(150,110,180,0.55)';                                                              // far wing
  c.beginPath(); c.moveTo(-2, -2); c.quadraticCurveTo(-8, -14 - fl * 6, -16, -10 - fl * 8); c.quadraticCurveTo(-10, -4, -2, 0); c.fill();
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.moveTo(18 + dive, 1); c.quadraticCurveTo(8, -5, -10, -2); c.quadraticCurveTo(-18, 0, -24, 5); c.quadraticCurveTo(-12, 4, 0, 4); c.quadraticCurveTo(10, 5, 18 + dive, 1); c.fill(); // body and tail
  c.strokeStyle = BHC.bone; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-24, 5); c.quadraticCurveTo(-27, 2, -25, -1); c.stroke(); // tail hook
  c.fillStyle = BHC.bone; c.beginPath(); c.moveTo(16 + dive, 0); c.lineTo(22 + dive, 2); c.lineTo(15 + dive, 3); c.closePath(); c.fill(); // beak
  c.fillStyle = 'rgba(180,140,210,0.7)';                                                               // near wing
  c.beginPath(); c.moveTo(4, -1); c.quadraticCurveTo(-2, -16 + fl * 7, -14, -14 + fl * 9); c.quadraticCurveTo(-6, -5, 4, 2); c.fill();
  c.strokeStyle = BHC.chit[0]; c.lineWidth = 0.9; c.beginPath(); c.moveTo(4, -1); c.quadraticCurveTo(-2, -16 + fl * 7, -14, -14 + fl * 9); c.stroke();
  c.fillStyle = T.light; c.fillRect(11 + dive, -0.8, 2, 1.4);                                          // eye
  c.fillStyle = T.main; c.fillRect(-8, 0.6, 12, 1.2);                                                  // gland stripe
}
// Bloomhost tree units (v2.19): side view facing +x, feet on y = 0; acid parts in ACID_COL, team colour on eyes and glands
const ACID_COL = '#9be15d', ACID_DARK = '#4f7a2a';
function dLeaper(c, T, u) { // Leaper: a lean hunter crouched on long, folded hind legs
  const ph = u.moving ? u.anim * 12 : 0, bite = u.recoil * 2, s = Math.sin(ph) * 1.5;
  c.strokeStyle = BHC.chit[2]; c.lineWidth = 2.2; c.lineCap = 'round'; c.lineJoin = 'round';
  limb(c, -7, -9, -15 + s, -15, -11 - s, 0);                                                        // far hind leg
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.ellipse(-3, -10, 9, 4.6, -0.25, 0, 7); c.fill();          // body
  c.fillStyle = BHC.chit[0]; c.beginPath(); c.ellipse(6, -13, 4.4, 3.4, -0.2, 0, 7); c.fill();          // head
  c.strokeStyle = BHC.bone; c.lineWidth = 1.2; c.beginPath(); c.moveTo(9.5, -13); c.quadraticCurveTo(13 + bite, -13, 13 + bite, -9); c.stroke(); // fang
  c.strokeStyle = BHC.chit[2]; c.lineWidth = 1.5; limb(c, 3, -9, 6 + s, -5, 5 - s, 0);                // forelegs
  c.lineWidth = 2.8; limb(c, -6, -9, -16 - s, -17, -9 + s, 0);                                          // near hind leg, the big one
  c.fillStyle = T.light; c.fillRect(6.6, -14.6, 1.6, 1.2); c.fillStyle = T.main; c.fillRect(-9, -13.6, 8, 1.2);
}
function dRavager(c, T, u) { // Ravager: a hunched brute with two scythe arms
  const ph = u.moving ? u.anim * 8 : 0, sw = u.recoil * 0.6, s = Math.sin(ph) * 2;
  c.strokeStyle = BHC.chit[2]; c.lineWidth = 3.2; c.lineCap = 'round'; limb(c, -6, -10, -8 + s, -5, -6 - s, 0); limb(c, 4, -10, 6 - s, -5, 4 + s, 0);
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.moveTo(-14, -10); c.quadraticCurveTo(-12, -26, 4, -24); c.quadraticCurveTo(14, -22, 12, -12); c.lineTo(-12, -8); c.closePath(); c.fill(); // hunched back
  c.strokeStyle = 'rgba(20,10,30,0.45)'; c.lineWidth = 1.2; for (const x of [-8, -2, 4]) { c.beginPath(); c.moveTo(x - 2, -10); c.quadraticCurveTo(x, -22, x + 3, -23); c.stroke(); }
  c.fillStyle = BHC.chit[0]; c.beginPath(); c.ellipse(13, -16, 4.6, 3.8, 0, 0, 7); c.fill();            // head
  c.save(); c.translate(8, -20); c.rotate(-0.6 + sw);                                                      // scythe arm
  c.strokeStyle = BHC.chit[2]; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(9, -2); c.stroke();
  c.fillStyle = BHC.bone; c.beginPath(); c.moveTo(9, -3); c.quadraticCurveTo(18, -2, 16, 9); c.quadraticCurveTo(14, 2, 8, 0); c.closePath(); c.fill();
  c.restore();
  c.fillStyle = T.light; c.fillRect(14, -17.5, 1.8, 1.4); c.fillStyle = T.main; c.fillRect(-10, -18, 12, 1.4);
}
function dSpitter(c, T, u) { // Spitter: thin legs, a glowing acid sac on its back, a long neck that aims up and forward
  const ph = u.moving ? u.anim * 10 : 0, s = Math.sin(ph) * 1.6, rk = u.recoil * 1.5;
  bugLegs(c, ph, [-5, 0, 4], 5, 6, 1.4, BHC.chit[2]);
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.ellipse(-2, -7, 7, 3.6, 0, 0, 7); c.fill();
  c.fillStyle = ACID_DARK; c.beginPath(); c.ellipse(-4, -12, 6, 5, 0, 0, 7); c.fill();                  // acid sac
  c.fillStyle = 'rgba(155,225,93,0.85)'; c.beginPath(); c.ellipse(-4.5, -12.5, 4, 3.4, 0, 0, 7); c.fill();
  c.strokeStyle = BHC.chit[0]; c.lineWidth = 2.6; c.beginPath(); c.moveTo(3, -8); c.quadraticCurveTo(8 - rk, -11, 12 - rk, -15); c.stroke(); // neck
  c.fillStyle = BHC.chit[0]; c.beginPath(); c.ellipse(13 - rk, -15, 2.6, 2.1, -0.5, 0, 7); c.fill();
  c.fillStyle = ACID_COL; c.beginPath(); c.arc(14.5 - rk, -15.5, 1, 0, 7); c.fill();                    // mouth, the muzzle at (14, -15)
  c.fillStyle = T.main; c.fillRect(-6, -6, 7, 1.1);
}
function dBilecaster(c, T, u) { // Bilecaster: a squat four-legged spitter with twin bile sacs and a wide throat
  const ph = u.moving ? u.anim * 7 : 0, rk = u.recoil * 2;
  bugLegs(c, ph, [-8, -2, 4, 9], 7, 8, 2.2, BHC.chit[2]);
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.ellipse(0, -10, 11, 5, 0, 0, 7); c.fill();
  for (const [x, r] of [[-6, 6], [2, 5]]) { c.fillStyle = ACID_DARK; c.beginPath(); c.ellipse(x, -16, r, r * 0.9, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(155,225,93,0.8)'; c.beginPath(); c.ellipse(x - 0.5, -16.5, r * 0.65, r * 0.55, 0, 0, 7); c.fill(); }
  c.fillStyle = BHC.chit[0]; c.beginPath(); c.moveTo(9, -14); c.quadraticCurveTo(17 - rk, -22, 18 - rk, -18); c.quadraticCurveTo(18 - rk, -14, 11, -9); c.closePath(); c.fill(); // throat, muzzle at (16, -20)
  c.fillStyle = ACID_COL; c.beginPath(); c.arc(17 - rk, -19.5, 1.4, 0, 7); c.fill();
  c.fillStyle = T.light; c.fillRect(11, -14, 1.6, 1.2); c.fillStyle = T.main; c.fillRect(-9, -8, 14, 1.2);
}
function dLobber(c, T, u) { // Bile Lobber: a slow quadruped with a great throat sac and an upturned launching gullet
  const ph = u.moving ? u.anim * 5 : 0, rk = u.recoil * 2.5, pulse = 0.85 + 0.15 * Math.sin(u.anim * 3);
  bugLegs(c, ph, [-12, -5, 3, 10], 8, 9, 3, BHC.chit[2]);
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.ellipse(-1, -12, 14, 6, 0, 0, 7); c.fill();
  c.fillStyle = ACID_DARK; c.beginPath(); c.ellipse(-4, -18, 9 * pulse, 7 * pulse, 0, 0, 7); c.fill();  // throat sac
  c.fillStyle = 'rgba(155,225,93,0.75)'; c.beginPath(); c.ellipse(-4.5, -18.5, 6 * pulse, 4.5 * pulse, 0, 0, 7); c.fill();
  c.save(); c.translate(6, -18); c.rotate(-0.9 + rk * 0.05);                                               // gullet tube, muzzle at about (12, -26)
  c.fillStyle = BHC.chit[0]; c.beginPath(); c.moveTo(0, -3); c.lineTo(11, -2.4); c.lineTo(11, 2.4); c.lineTo(0, 3); c.closePath(); c.fill();
  c.fillStyle = BHC.bone; c.fillRect(10, -3, 2, 6);
  c.restore();
  c.fillStyle = T.main; c.fillRect(-12, -10, 16, 1.4);
}
function dRuinmaw(c, T, u) { // Ruinmaw: a massive low beast that is mostly jaw
  const ph = u.moving ? u.anim * 4 : 0, open = 0.3 + u.recoil * 0.7;
  bugLegs(c, ph + Math.PI, [-16, -6, 4], 9, 10, 4, BHC.chit[2]);
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.moveTo(-22, -10); c.bezierCurveTo(-20, -30, 4, -32, 12, -22); c.lineTo(10, -8); c.lineTo(-20, -6); c.closePath(); c.fill(); // back
  c.strokeStyle = BHC.chit[0]; c.lineWidth = 2; for (const x of [-14, -6, 2]) { c.beginPath(); c.moveTo(x - 2, -8); c.quadraticCurveTo(x, -25, x + 5, -27); c.stroke(); }
  c.fillStyle = BHC.chit[0]; c.beginPath(); c.moveTo(8, -24); c.quadraticCurveTo(26, -26 - open * 6, 30, -18 - open * 4); c.lineTo(10, -15); c.closePath(); c.fill(); // upper jaw
  c.fillStyle = BHC.flesh[1]; c.beginPath(); c.moveTo(10, -14); c.lineTo(30, -16 + open * 4); c.quadraticCurveTo(26, -6 + open * 3, 8, -7); c.closePath(); c.fill(); // lower jaw
  c.fillStyle = ACID_COL; c.beginPath(); c.ellipse(16, -15, 5, 1 + open * 3, 0, 0, 7); c.fill();          // acid in its mouth, muzzle at (24, -16)
  c.fillStyle = BHC.bone; for (let i = 0; i < 4; i++) { const x = 14 + i * 4; c.beginPath(); c.moveTo(x, -18 - open * 3); c.lineTo(x + 1.5, -15); c.lineTo(x + 3, -18 - open * 3); c.fill(); }
  c.fillStyle = T.light; c.fillRect(12, -22, 2.2, 1.6); c.fillStyle = T.main; c.fillRect(-16, -16, 16, 1.4);
  bugLegs(c, ph, [-14, -4, 6], 9, 10, 4.4, BHC.chit[2]);
}
function dThornback(c, T, u) { // Thornback: a stocky armored crawler covered in back spines
  const ph = u.moving ? u.anim * 7 : 0, ram = u.recoil * 2;
  bugLegs(c, ph + Math.PI, [-9, -1, 7], 6, 7, 2.6, BHC.chit[2]);
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.moveTo(-15, -6); c.bezierCurveTo(-14, -20, 8, -21, 13, -9); c.lineTo(-14, -4); c.closePath(); c.fill(); // shell
  c.fillStyle = BHC.bone; for (let i = 0; i < 6; i++) { const x = -12 + i * 4.5, y = -10 - Math.sin((i + 0.5) / 6 * Math.PI) * 9; c.beginPath(); c.moveTo(x - 1.6, y + 2); c.lineTo(x - 2.5, y - 7 - (i % 2) * 2); c.lineTo(x + 1.6, y + 2); c.fill(); } // spines
  c.save(); c.translate(ram, 0); c.fillStyle = BHC.chit[0]; c.beginPath(); c.ellipse(15, -9, 4.5, 3.6, 0, 0, 7); c.fill(); c.fillStyle = T.light; c.fillRect(16, -10.5, 1.8, 1.4); c.restore();
  c.fillStyle = T.main; c.fillRect(-11, -7, 14, 1.2);
  bugLegs(c, ph, [-8, 0, 8], 6, 7, 3, BHC.chit[2]);
}
function dDreadthorn(c, T, u) { // Dreadthorn: a towering spined horror on four thick legs
  const ph = u.moving ? u.anim * 5 : 0, ram = u.recoil * 2.5;
  bugLegs(c, ph + Math.PI, [-13, 7], 10, 11, 4.4, BHC.chit[2]);
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.moveTo(-18, -10); c.bezierCurveTo(-18, -30, 10, -32, 16, -14); c.lineTo(-16, -8); c.closePath(); c.fill();
  c.fillStyle = BHC.bone; for (let i = 0; i < 7; i++) { const a = Math.PI * (0.15 + i * 0.11), x = -2 + Math.cos(Math.PI - a) * 16, y = -14 - Math.sin(a) * 13; c.beginPath(); c.moveTo(x - 2, y + 2); c.lineTo(x + Math.cos(Math.PI - a) * 9, y - Math.sin(a) * 11); c.lineTo(x + 2, y + 2); c.fill(); }
  c.save(); c.translate(ram, 0); c.fillStyle = BHC.chit[0]; c.beginPath(); c.moveTo(13, -20); c.quadraticCurveTo(25, -18, 24, -10); c.lineTo(14, -8); c.closePath(); c.fill();
  c.fillStyle = BHC.bone; c.beginPath(); c.moveTo(22, -12); c.lineTo(29, -9); c.lineTo(22, -9); c.fill(); c.fillStyle = T.light; c.fillRect(18, -16, 2.2, 1.6); c.restore();
  c.fillStyle = T.main; c.fillRect(-14, -16, 18, 1.4);
  bugLegs(c, ph, [-11, 9], 10, 11, 5, BHC.chit[2]);
}
// Bloomspire tree units (v2.21): flyers drawn around their flight height, facing +x
function dNeedle(c, T, u) { // Needlewing: a thin dart of a body, a long piercing proboscis, two pairs of buzzing glassy wings
  const fl = Math.sin(u.anim * 40), jab = u.recoil * 3;
  c.fillStyle = 'rgba(200,225,255,0.28)';                                                              // far wings (a blur)
  c.beginPath(); c.ellipse(-3, -6 - fl * 2, 8, 2.4, -0.5 + fl * 0.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(-8, -5 + fl * 2, 6, 2, -0.3, 0, 7); c.fill();
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.moveTo(6, -1); c.quadraticCurveTo(-4, -4, -14, -1); c.lineTo(-17, 1.5); c.quadraticCurveTo(-4, 2, 6, 1); c.closePath(); c.fill(); // segmented abdomen
  c.strokeStyle = 'rgba(20,10,30,0.5)'; c.lineWidth = 0.7; for (const x of [-11, -7, -3]) { c.beginPath(); c.moveTo(x, -2.4); c.lineTo(x, 1.6); c.stroke(); }
  c.fillStyle = BHC.chit[0]; c.beginPath(); c.ellipse(7, 0, 3.4, 2.6, 0, 0, 7); c.fill();               // head
  c.strokeStyle = BHC.bone; c.lineWidth = 1.1; c.beginPath(); c.moveTo(10, 0.5); c.lineTo(19 + jab, 2.5); c.stroke(); // proboscis
  c.strokeStyle = BHC.chit[2]; c.lineWidth = 0.8; limb(c, 2, 1, 4, 4, 6, 5); limb(c, -2, 1, -1, 4, 1, 5.5); // dangling legs
  c.fillStyle = 'rgba(215,235,255,0.42)';                                                              // near wings
  c.beginPath(); c.ellipse(-2, -7 + fl * 2.5, 9, 2.6, -0.6 - fl * 0.25, 0, 7); c.fill(); c.beginPath(); c.ellipse(-7, -6 - fl * 2, 7, 2.2, -0.35, 0, 7); c.fill();
  c.fillStyle = T.light; c.fillRect(8, -1.4, 1.6, 1.2); c.fillStyle = T.main; c.fillRect(-12, -1.4, 6, 1);
}
function dCloudwing(c, T, u) { // Cloudwing: a drifting gas-bag with fin flaps, trailing tendrils and a cluster of brood sacs underneath
  const ph = u.anim * 3, fl = Math.sin(u.anim * 9), sq = u.recoil * 1.5;
  c.strokeStyle = BHC.flesh[1]; c.lineWidth = 1.2; c.lineCap = 'round';                                // tendrils
  for (let i = 0; i < 4; i++) { const x = -8 + i * 4.5, w = Math.sin(ph + i) * 2.5; c.beginPath(); c.moveTo(x, 3); c.quadraticCurveTo(x - 3 + w, 9, x - 6 + w, 14 + i % 2 * 2); c.stroke(); }
  c.fillStyle = 'rgba(165,86,111,0.55)'; c.beginPath(); c.moveTo(-6, -6); c.quadraticCurveTo(-14, -16 - fl * 4, -22, -10 - fl * 3); c.quadraticCurveTo(-14, -6, -6, -2); c.fill(); // far fin flap
  c.fillStyle = BHC.flesh[0]; c.beginPath(); c.ellipse(0, -5, 13 + sq, 8 - sq * 0.5, -0.08, 0, 7); c.fill(); // the bag
  c.fillStyle = 'rgba(255,220,235,0.18)'; c.beginPath(); c.ellipse(-2, -9, 8, 3.4, -0.1, 0, 7); c.fill();  // sheen on top
  c.strokeStyle = BHC.flesh[2]; c.lineWidth = 0.9; for (const x of [-6, 0, 6]) { c.beginPath(); c.moveTo(x - 1, -12); c.quadraticCurveTo(x + 2, -5, x - 1, 2); c.stroke(); } // veins
  c.fillStyle = BHC.flesh[1]; for (const [x, r] of [[-5, 2.6], [-1, 3], [3.5, 2.4]]) { c.beginPath(); c.arc(x, 3.5, r, 0, 7); c.fill(); } // brood sacs
  c.fillStyle = T.main; for (const x of [-5, -1, 3.5]) c.fillRect(x - 0.7, 3, 1.4, 1.2);
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.ellipse(13, -4, 4, 3.2, 0.1, 0, 7); c.fill();               // beaked head
  c.fillStyle = BHC.bone; c.beginPath(); c.moveTo(16, -4.5); c.lineTo(21, -2.5); c.lineTo(15.5, -1.8); c.closePath(); c.fill();
  c.fillStyle = 'rgba(190,110,140,0.7)'; c.beginPath(); c.moveTo(-2, -8); c.quadraticCurveTo(-9, -20 + fl * 4, -18, -15 + fl * 4); c.quadraticCurveTo(-9, -9, -2, -4); c.fill(); // near fin flap
  c.fillStyle = T.light; c.fillRect(13.5, -5.4, 1.8, 1.3);
}
function dTyrant(c, T, u) { // Brood Tyrant: a heavy armored beetle-flyer, wing cases spread over buzzing wings, a gaping spitting maw
  const fl = Math.sin(u.anim * 30), gape = u.recoil * 2.5;
  c.fillStyle = 'rgba(200,215,255,0.22)'; c.beginPath(); c.ellipse(-6, -15, 16, 4 + fl * 1.5, -0.35, 0, 7); c.fill(); // buzzing wing blur
  c.fillStyle = BHC.chit[2]; poly(c, [[2, -8], [-14, -22], [-26, -18], [-12, -6]]); c.fill();             // far wing case
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.moveTo(-26, 2); c.bezierCurveTo(-26, -14, 10, -16, 16, -4); c.quadraticCurveTo(14, 6, 0, 7); c.quadraticCurveTo(-18, 8, -26, 2); c.fill(); // armored body
  c.strokeStyle = BHC.chit[0]; c.lineWidth = 1.6; for (const x of [-16, -8, 0]) { c.beginPath(); c.moveTo(x - 3, 5); c.quadraticCurveTo(x, -9, x + 4, -11); c.stroke(); } // shell ridges
  c.strokeStyle = BHC.chit[2]; c.lineWidth = 2.2; c.lineCap = 'round'; limb(c, -10, 6, -12, 12, -7, 16); limb(c, 0, 6, 1, 12, 6, 15); // hanging claws
  c.fillStyle = BHC.chit[0]; c.beginPath(); c.ellipse(16, -3, 7, 6, 0.1, 0, 7); c.fill();                 // head
  c.fillStyle = BHC.dark; c.beginPath(); c.moveTo(19, -2); c.lineTo(25 + gape, -4 - gape); c.lineTo(25 + gape, 2 + gape); c.closePath(); c.fill(); // maw
  c.fillStyle = BHC.bone; c.beginPath(); c.moveTo(20, -4); c.lineTo(26 + gape, -6 - gape); c.lineTo(22, -2); c.fill(); c.beginPath(); c.moveTo(20, 1); c.lineTo(26 + gape, 4 + gape); c.lineTo(22, 0); c.fill(); // mandibles
  c.fillStyle = BHC.chit[0]; poly(c, [[4, -9], [-10, -26], [-24, -24], [-12, -7]]); c.fill();             // near wing case, raised
  c.strokeStyle = BHC.chit[2]; c.lineWidth = 1; c.beginPath(); c.moveTo(4, -9); c.lineTo(-17, -25); c.stroke();
  c.fillStyle = T.light; c.fillRect(16, -6, 2.4, 1.8); c.fillRect(12, -6.5, 1.6, 1.3); c.fillStyle = T.main; c.fillRect(-20, -1, 18, 1.6);
}
function dWorld(c, T, u) { // Worldrender: a vast ray-like flyer, its broad wings rippling, a swollen crushing sac slung under its belly
  const r = Math.sin(u.anim * 2.4), drop = u.recoil * 3;
  c.fillStyle = BHC.chit[2]; c.beginPath(); c.moveTo(18, -4); c.quadraticCurveTo(0, -12, -30, -10 + r * 4); c.quadraticCurveTo(-14, -2, 0, 0); c.fill(); // far wing
  c.fillStyle = BHC.flesh[1]; c.beginPath(); c.ellipse(-2, 7 + drop, 11, 8, 0, 0, 7); c.fill();            // the sac it drops from
  c.strokeStyle = BHC.flesh[2]; c.lineWidth = 1; for (const a of [-0.9, 0, 0.9]) { c.beginPath(); c.moveTo(-2 + a * 6, 0 + drop); c.quadraticCurveTo(-2 + a * 12, 8 + drop, -2 + a * 4, 14 + drop); c.stroke(); }
  c.fillStyle = T.main; c.globalAlpha = 0.5 + 0.3 * Math.sin(u.anim * 5); c.beginPath(); c.arc(-2, 8 + drop, 3.2, 0, 7); c.fill(); c.globalAlpha = 1;
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.moveTo(34, 0); c.quadraticCurveTo(22, -9, 0, -8); c.quadraticCurveTo(-26, -7, -40, -2); c.quadraticCurveTo(-24, 4, 0, 4); c.quadraticCurveTo(22, 5, 34, 0); c.fill(); // long body and tail
  c.fillStyle = BHC.bone; for (let i = 0; i < 6; i++) { const x = 16 - i * 7; c.beginPath(); c.moveTo(x - 2, -7.5 + i * 0.3); c.lineTo(x, -12 + i * 0.4); c.lineTo(x + 2, -7.5 + i * 0.3); c.fill(); } // back ridge
  c.fillStyle = BHC.chit[0]; c.beginPath(); c.moveTo(14, -6); c.quadraticCurveTo(-4, -26 - r * 6, -36, -24 - r * 8); c.quadraticCurveTo(-18, -12, -6, -3); c.closePath(); c.fill(); // near wing
  c.strokeStyle = BHC.chit[2]; c.lineWidth = 1; c.beginPath(); c.moveTo(10, -6); c.quadraticCurveTo(-6, -22 - r * 5, -32, -22 - r * 7); c.stroke();
  c.strokeStyle = BHC.bone; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-40, -2); c.quadraticCurveTo(-46, -4, -48, 1); c.stroke(); // barbed tail tip
  c.fillStyle = T.light; c.fillRect(27, -2.6, 2.4, 1.6); c.fillStyle = T.main; c.fillRect(-14, -3, 22, 1.6);
}
// Axiarch units (v2.25): side view facing +x, hovering stone and light; the team colour on glyphs and eyes
function dShard(c, T, u) { // Shardling: a hovering faceted shard of a body with a crown prism and two light blades
  const ph = u.moving ? u.anim * 9 : u.anim * 2.5, y0 = -7 + Math.sin(ph) * 1.2, sl = u.recoil * 4;
  c.fillStyle = `rgba(${T.glow},0.3)`; c.beginPath(); c.ellipse(0, -0.5, 5.5, 1.6, 0, 0, 7); c.fill();   // hover glow on the ground
  c.strokeStyle = `rgba(${T.glow},0.75)`; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-3, y0 - 9); c.lineTo(-9 - sl * 0.3, y0 - 3); c.stroke(); // back blade
  c.fillStyle = AXC.stone[1]; poly(c, [[-2.6, y0 - 2], [2.6, y0 - 2], [0, y0 + 4.5]]); c.fill();             // lower point
  c.fillStyle = AXC.stone[0]; poly(c, [[0, y0 - 17], [5, y0 - 8.5], [0, y0 - 1], [-5, y0 - 8.5]]); c.fill();  // body
  c.fillStyle = AXC.stone[2]; poly(c, [[0, y0 - 17], [0, y0 - 1], [-5, y0 - 8.5]]); c.fill();                // its shaded half
  c.strokeStyle = `rgba(${T.glow},0.8)`; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, y0 - 14); c.lineTo(0, y0 - 4); c.stroke(); // glyph seam
  c.fillStyle = AXC.obs[0]; poly(c, [[0.5, y0 - 24], [3, y0 - 20.5], [0.5, y0 - 18.5], [-2, y0 - 20.5]]); c.fill(); // crown prism
  c.fillStyle = T.light; c.fillRect(1, y0 - 21.5, 1.6, 1.2);
  c.strokeStyle = AXC.edge; c.lineWidth = 1.5; c.beginPath(); c.moveTo(3.5, y0 - 10); c.lineTo(8 + sl * 0.4, y0 - 12); c.stroke(); // front arm
  c.strokeStyle = `rgba(${AXC.pale},0.95)`; c.lineWidth = 1.6; c.beginPath(); c.moveTo(8 + sl * 0.4, y0 - 12); c.lineTo(16 + sl, y0 - 6 - sl * 0.4); c.stroke(); // front blade
  c.strokeStyle = `rgba(${T.glow},0.6)`; c.lineWidth = 3; c.globalAlpha = 0.35; c.stroke(); c.globalAlpha = 1;
}
function dBastion(c, T, u) { // Bastion: a heavy hovering wedge of stone behind a tall shield slab, an emitter on its back
  const ph = u.moving ? u.anim * 4 : u.anim * 1.5, y0 = -6 + Math.sin(ph) * 1, k = u.recoil;
  c.fillStyle = `rgba(${T.glow},0.25)`; c.beginPath(); c.ellipse(0, -0.5, 16, 3, 0, 0, 7); c.fill();         // hover glow
  c.fillStyle = AXC.obs[1]; poly(c, [[-18, y0 - 4], [12, y0 - 4], [8, y0 + 3], [-14, y0 + 3]]); c.fill();     // keel
  c.fillStyle = AXC.stone[1]; poly(c, [[-20, y0 - 4], [-16, y0 - 18], [6, y0 - 20], [12, y0 - 4]]); c.fill();  // hull
  c.fillStyle = AXC.stone[0]; poly(c, [[-16, y0 - 18], [6, y0 - 20], [2, y0 - 24], [-12, y0 - 23]]); c.fill(); // hull top
  c.strokeStyle = `rgba(${T.glow},0.55)`; c.lineWidth = 1; c.beginPath(); c.moveTo(-17, y0 - 10); c.lineTo(9, y0 - 11); c.stroke(); // glyph band
  c.fillStyle = AXC.obs[0]; poly(c, [[-10, y0 - 24], [-6, y0 - 30], [-2, y0 - 24]]); c.fill();                  // emitter
  c.fillStyle = `rgba(${T.glow},${0.6 + 0.3 * Math.sin(u.anim * 4)})`; c.beginPath(); c.arc(-6, y0 - 27, 1.5, 0, 7); c.fill();
  c.save(); c.translate(-k * 1.5, 0);                                                                            // the shield slab in front
  c.fillStyle = AXC.stone[2]; poly(c, [[12, y0 - 2], [15, y0 - 26], [22, y0 - 22], [20, y0 + 2]]); c.fill();
  c.strokeStyle = `rgba(${AXC.pale},0.7)`; c.lineWidth = 1.2; c.beginPath(); c.moveTo(16, y0 - 22); c.lineTo(19, y0 - 1); c.stroke();
  c.fillStyle = T.light; c.fillRect(17, y0 - 15, 2, 1.6);
  c.restore();
}
function dWraith(c, T, u) { // Wraithwing: a sleek crescent flyer of black stone with two trailing light vanes
  const fl = Math.sin(u.anim * 3), k = u.recoil * 2;
  c.strokeStyle = `rgba(${T.glow},0.55)`; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-10, 2); c.quadraticCurveTo(-20, 4 + fl * 2, -28, 1 + fl * 3); c.stroke(); // trailing vane (far)
  c.fillStyle = AXC.obs[1]; c.beginPath(); c.moveTo(18 - k, 0); c.quadraticCurveTo(4, -6, -14, -12 + fl); c.quadraticCurveTo(-6, -3, -12, 4); c.quadraticCurveTo(2, 3, 18 - k, 0); c.fill(); // crescent hull
  c.fillStyle = AXC.stone[0]; c.beginPath(); c.moveTo(18 - k, 0); c.quadraticCurveTo(4, -6, -14, -12 + fl); c.quadraticCurveTo(-2, -4, 18 - k, 0); c.fill(); // upper face
  c.strokeStyle = `rgba(${AXC.pale},0.85)`; c.lineWidth = 1.1; c.beginPath(); c.moveTo(14 - k, -0.5); c.quadraticCurveTo(2, -4, -12, -10 + fl); c.stroke(); // leading edge light
  c.strokeStyle = `rgba(${T.glow},0.75)`; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-8, 3); c.quadraticCurveTo(-18, 7 + fl * 2, -26, 6 + fl * 3); c.stroke(); // trailing vane (near)
  c.fillStyle = T.light; c.fillRect(9 - k, -2, 2, 1.4);
  c.fillStyle = `rgba(${T.glow},0.8)`; c.beginPath(); c.arc(-2, 1, 1.6, 0, 7); c.fill(); // core
}
// Celestial Array tree units (v2.29): flyers of black stone and light, facing +x
function dPrism(c, T, u) { // Prismwing: a small faceted prism dart with two glassy fins that flicker
  const fl = Math.sin(u.anim * 9), k = u.recoil * 2;
  c.fillStyle = `rgba(${AXC.pale},${0.35 + 0.15 * fl})`; poly(c, [[-2, -1], [-12, -9 - fl * 2], [-6, -1]]); c.fill(); // far fin
  c.fillStyle = AXC.obs[1]; poly(c, [[12 - k, 0], [-2, -5], [-9, 0], [-2, 4]]); c.fill(); // prism body
  c.fillStyle = AXC.stone[0]; poly(c, [[12 - k, 0], [-2, -5], [-4, -0.5]]); c.fill(); // lit facet
  c.strokeStyle = `rgba(${AXC.pale},0.8)`; c.lineWidth = 0.9; c.beginPath(); c.moveTo(11 - k, 0); c.lineTo(-2, -4.5); c.stroke();
  c.fillStyle = `rgba(${AXC.pale},${0.45 + 0.2 * fl})`; poly(c, [[0, 0], [-10, 7 + fl * 2], [-4, 1]]); c.fill(); // near fin
  c.fillStyle = `rgba(${T.glow},0.9)`; c.beginPath(); c.arc(1, 0, 1.4, 0, 7); c.fill(); // core
}
function dShardstorm(c, T, u) { // Shardstorm: a bright core inside a turning ring of five floating shards
  const a0 = u.anim * 2.2, k = u.recoil * 2;
  const shard = (an, front) => { const x = Math.cos(an) * 13, y = Math.sin(an) * 4 - 1, h = 6 + (front ? 1 : 0);
    c.fillStyle = front ? AXC.stone[0] : AXC.obs[1]; poly(c, [[x, y - h], [x + 2.6, y], [x, y + h * 0.5], [x - 2.6, y]]); c.fill();
    if (front) { c.strokeStyle = `rgba(${AXC.pale},0.7)`; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + 2.6, y); c.stroke(); } };
  for (let i = 0; i < 5; i++) { const an = a0 + i / 5 * Math.PI * 2; if (Math.sin(an) < 0) shard(an, false); } // the far side of the ring
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.cyan, 2 - k, -2, 9, 0.7); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.fillStyle = AXC.obs[2]; poly(c, [[8 - k, -2], [2, -8], [-5, -2], [2, 4]]); c.fill(); // the core's dark casing
  c.fillStyle = `rgba(${T.glow},0.95)`; c.beginPath(); c.arc(2 - k, -2, 2.4, 0, 7); c.fill();
  c.fillStyle = '#eaffff'; c.beginPath(); c.arc(2 - k, -2, 1, 0, 7); c.fill();
  for (let i = 0; i < 5; i++) { const an = a0 + i / 5 * Math.PI * 2; if (Math.sin(an) >= 0) shard(an, true); } // the near side
}
function dVoidcarrier(c, T, u) { // Voidcarrier: a long heavy hull of obsidian slabs carrying a dark void sphere in a cradle underneath
  const r = Math.sin(u.anim * 1.6), k = u.recoil * 2;
  c.fillStyle = AXC.obs[2]; poly(c, [[26, -3], [6, -12], [-24, -10], [-30, -4], [-6, 2]]); c.fill(); // far slab
  c.fillStyle = AXC.obs[1]; poly(c, [[30 - k, 0], [10, -9], [-22, -8], [-30, -1], [-20, 5], [10, 5]]); c.fill(); // hull
  c.fillStyle = AXC.stone[1]; poly(c, [[30 - k, 0], [10, -9], [-22, -8], [-14, -4], [10, -3]]); c.fill(); // upper face
  c.strokeStyle = `rgba(${T.glow},0.7)`; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-18, -1); c.lineTo(16, -1); c.stroke(); // glyph band
  c.strokeStyle = AXC.edge; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-8, 5); c.lineTo(-11, 12); c.moveTo(6, 5); c.lineTo(9, 12); c.stroke(); // cradle arms
  c.fillStyle = '#05060c'; c.beginPath(); c.arc(-1, 12 + r * 0.6, 5.5, 0, 7); c.fill(); // the void sphere
  c.strokeStyle = RIFT; c.globalAlpha = 0.6 + 0.3 * r; c.lineWidth = 1.2; c.beginPath(); c.arc(-1, 12 + r * 0.6, 6.6, 0, 7); c.stroke(); c.globalAlpha = 1;
  c.fillStyle = T.light; c.fillRect(22 - k, -3, 2.4, 1.4);
  c.fillStyle = `rgba(${T.glow},0.8)`; for (const x of [-26, -20]) { c.beginPath(); c.arc(x, 1, 1.3, 0, 7); c.fill(); } // drive lights
}
function dSovereign(c, T, u) { // Astral Sovereign: a vast floating monolith-ship under a turning crown ring, a glowing mass slung beneath
  const r = u.anim * 0.9, k = u.recoil * 3;
  const ring = front => { c.strokeStyle = front ? `rgba(${AXC.pale},0.75)` : `rgba(${T.glow},0.35)`; c.lineWidth = front ? 1.6 : 1.2;
    c.beginPath(); c.ellipse(0, -16, 30, 7, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); c.stroke();
    for (let i = 0; i < 4; i++) { const an = r + i / 4 * Math.PI * 2, sy = Math.sin(an); if ((sy >= 0) !== front) continue; const x = Math.cos(an) * 30, y = -16 + sy * 7; c.fillStyle = front ? AXC.stone[0] : AXC.obs[1]; poly(c, [[x, y - 5], [x + 2.4, y], [x, y + 4], [x - 2.4, y]]); c.fill(); } };
  ring(false);
  c.fillStyle = AXC.obs[2]; poly(c, [[36, -2], [12, -14], [-34, -12], [-44, -4], [-10, 6]]); c.fill(); // far wing slab
  c.fillStyle = AXC.obs[1]; poly(c, [[40, 0], [16, -10], [-30, -9], [-46, 0], [-28, 8], [16, 8]]); c.fill(); // great hull
  c.fillStyle = AXC.stone[1]; poly(c, [[40, 0], [16, -10], [-30, -9], [-20, -4], [16, -3]]); c.fill(); // upper face
  c.strokeStyle = `rgba(${T.glow},0.75)`; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-34, 1); c.lineTo(28, 1); c.moveTo(-8, -8); c.lineTo(-8, 6); c.moveTo(8, -8); c.lineTo(8, 6); c.stroke(); // glyphs
  c.fillStyle = '#05060c'; c.beginPath(); c.ellipse(-2, 15 + k, 10, 7, 0, 0, 7); c.fill(); // the mass it drops
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.cyan, -2, 15 + k, 12, 0.35 + 0.15 * Math.sin(u.anim * 4)); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.strokeStyle = RIFT; c.lineWidth = 1.3; c.beginPath(); c.ellipse(-2, 15 + k, 11, 8, 0, 0, 7); c.stroke();
  c.strokeStyle = AXC.edge; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-12, 8); c.lineTo(-10, 12 + k); c.moveTo(8, 8); c.lineTo(6, 12 + k); c.stroke();
  c.fillStyle = T.light; c.fillRect(32, -3, 2.6, 1.6);
  ring(true);
}
// Axiarch tree units (v2.27): hovering stone and light, facing +x; team colour on glyphs and eyes, violet for rift energy
const RIFT = '#b48cff', RIFTA = '180,140,255';
const hov = (u, sp = 2.5) => Math.sin(u.anim * sp) * 1.2;
function dRiftstalker(c, T, u) { // Riftstalker: a lean, forward-leaning shard of a hunter with two long rift claws
  const y0 = -8 + hov(u, u.moving ? 8 : 2.5), sl = u.recoil * 4;
  c.fillStyle = `rgba(${RIFTA},0.3)`; c.beginPath(); c.ellipse(0, -0.5, 6, 1.6, 0, 0, 7); c.fill();
  c.fillStyle = AXC.stone[1]; poly(c, [[-9, y0 - 4], [6, y0 - 15], [10, y0 - 10], [-4, y0 + 2]]); c.fill();   // body, leaning in
  c.fillStyle = AXC.stone[0]; poly(c, [[-9, y0 - 4], [6, y0 - 15], [2, y0 - 16], [-10, y0 - 8]]); c.fill();
  c.fillStyle = AXC.obs[0]; poly(c, [[7, y0 - 15], [13, y0 - 17], [11, y0 - 12]]); c.fill();                 // head
  c.fillStyle = T.light; c.fillRect(10, y0 - 15.5, 1.6, 1.2);
  c.strokeStyle = RIFT; c.lineWidth = 1.5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(4, y0 - 10); c.quadraticCurveTo(12 + sl, y0 - 8, 17 + sl, y0 - 2); c.stroke();       // front claw
  c.globalAlpha = 0.6; c.beginPath(); c.moveTo(-2, y0 - 6); c.quadraticCurveTo(6 + sl * 0.5, y0 - 1, 9 + sl * 0.5, y0 + 4); c.stroke(); c.globalAlpha = 1;
  c.strokeStyle = `rgba(${T.glow},0.7)`; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-6, y0 - 5); c.lineTo(4, y0 - 12); c.stroke();
}
function dParallax(c, T, u) { // Parallax: a tall blade-bearer with a faint offset double of itself, twin crescent blades
  const y0 = -8 + hov(u, u.moving ? 7 : 2), sl = u.recoil * 0.6;
  const body = (a, dx) => { c.globalAlpha = a;
    c.fillStyle = AXC.stone[0]; poly(c, [[dx, y0 - 24], [dx + 6, y0 - 12], [dx + 2, y0], [dx - 5, y0 - 12]]); c.fill();
    c.fillStyle = AXC.stone[2]; poly(c, [[dx, y0 - 24], [dx + 2, y0], [dx - 5, y0 - 12]]); c.fill(); };
  body(0.3, -6); body(1, 0); c.globalAlpha = 1;                                                                 // the double, then itself
  c.fillStyle = T.light; c.fillRect(1.5, y0 - 20, 1.8, 1.3);
  c.strokeStyle = `rgba(${T.glow},0.8)`; c.lineWidth = 1; c.beginPath(); c.moveTo(0, y0 - 18); c.lineTo(1, y0 - 4); c.stroke();
  c.save(); c.translate(5, y0 - 13); c.rotate(-0.5 + sl);
  c.strokeStyle = RIFT; c.lineWidth = 1.8; c.beginPath(); c.arc(6, 0, 8, -1.3, 1.3); c.stroke();                   // crescent blade
  c.restore();
  c.strokeStyle = `rgba(${RIFTA},0.6)`; c.lineWidth = 1.4; c.beginPath(); c.arc(-3, y0 - 9, 6, 1.8, 4.2); c.stroke(); // back blade
}
function dLancer(c, T, u) { // Lancer: an upright slab of a body holding a long lance, its tip charged with light
  const y0 = -7 + hov(u, u.moving ? 6 : 2), k = u.recoil;
  c.fillStyle = `rgba(${T.glow},0.25)`; c.beginPath(); c.ellipse(0, -0.5, 6, 1.6, 0, 0, 7); c.fill();
  c.fillStyle = AXC.stone[1]; poly(c, [[-4, y0], [4, y0], [5, y0 - 18], [0, y0 - 22], [-5, y0 - 18]]); c.fill();
  c.fillStyle = AXC.stone[0]; poly(c, [[0, y0 - 22], [5, y0 - 18], [4, y0], [0, y0]]); c.fill();
  c.fillStyle = T.light; c.fillRect(1, y0 - 19, 2, 1.3);
  c.strokeStyle = AXC.edge; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-6 - k * 2, y0 - 8); c.lineTo(15 - k * 2, y0 - 18); c.stroke(); // the lance
  c.fillStyle = `rgba(${AXC.pale},${0.7 + 0.3 * Math.sin(u.anim * 6)})`; c.beginPath(); c.arc(15 - k * 2, y0 - 18, 1.8 + k, 0, 7); c.fill();
}
function dMarksman(c, T, u) { // Astral Marksman: a kneeling stone figure behind a very long prism, a lens at its tip
  const y0 = -4 + hov(u, 1.5) * 0.5, k = u.recoil * 2;
  c.fillStyle = AXC.stone[2]; poly(c, [[-8, y0 + 3], [2, y0 + 3], [0, y0 - 4], [-7, y0 - 3]]); c.fill();         // knee block
  c.fillStyle = AXC.stone[1]; poly(c, [[-6, y0 - 3], [1, y0 - 3], [2, y0 - 18], [-3, y0 - 22], [-7, y0 - 16]]); c.fill(); // torso
  c.fillStyle = AXC.obs[0]; poly(c, [[-3, y0 - 22], [1, y0 - 25], [3, y0 - 21], [0, y0 - 19]]); c.fill();         // head
  c.fillStyle = T.light; c.fillRect(1, y0 - 22, 1.6, 1.2);
  c.fillStyle = AXC.obs[1]; poly(c, [[-4 - k, y0 - 13], [22 - k, y0 - 16], [22 - k, y0 - 13.5], [-4 - k, y0 - 10]]); c.fill(); // the long prism
  c.strokeStyle = `rgba(${T.glow},0.75)`; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-2 - k, y0 - 12); c.lineTo(20 - k, y0 - 15); c.stroke();
  c.fillStyle = `rgba(${AXC.pale},0.85)`; c.beginPath(); c.arc(22.5 - k, y0 - 14.8, 1.6, 0, 7); c.fill();       // the lens
}
function dRiftMortar(c, T, u) { // Rift Mortar: a hovering stone platform carrying a tilted ring-barrel around a violet core
  const y0 = -6 + hov(u, 1.6), k = u.recoil * 2;
  c.fillStyle = `rgba(${RIFTA},0.25)`; c.beginPath(); c.ellipse(0, -0.5, 13, 2.6, 0, 0, 7); c.fill();
  c.fillStyle = AXC.stone[1]; poly(c, [[-14, y0], [12, y0], [14, y0 - 6], [-12, y0 - 6]]); c.fill();
  c.fillStyle = AXC.stone[0]; poly(c, [[-12, y0 - 6], [14, y0 - 6], [10, y0 - 9], [-10, y0 - 9]]); c.fill();
  c.save(); c.translate(-1, y0 - 13 + k); c.rotate(-0.6);
  c.strokeStyle = AXC.edge; c.lineWidth = 2.2; for (const r of [0, 7, 14]) { c.beginPath(); c.ellipse(r, 0, 2.2, 5.5 - r * 0.12, 0, 0, 7); c.stroke(); } // the rings
  c.restore();
  c.fillStyle = `rgba(${RIFTA},${0.6 + 0.3 * Math.sin(u.anim * 3)})`; c.beginPath(); c.arc(-1, y0 - 13 + k, 2.4, 0, 7); c.fill();
  c.fillStyle = T.light; c.fillRect(8, y0 - 8, 2, 1.3);
}
function dWorldbreaker(c, T, u) { // Worldbreaker: a great hovering block with a monolith arm raised over a glowing rift crack
  const y0 = -8 + hov(u, 1.2), k = u.recoil * 4;
  c.fillStyle = `rgba(${RIFTA},0.25)`; c.beginPath(); c.ellipse(0, -0.5, 20, 3.6, 0, 0, 7); c.fill();
  c.fillStyle = AXC.obs[1]; poly(c, [[-20, y0], [14, y0], [18, y0 - 16], [-16, y0 - 20]]); c.fill();           // the hull
  c.fillStyle = AXC.stone[0]; poly(c, [[-16, y0 - 20], [18, y0 - 16], [12, y0 - 24], [-12, y0 - 27]]); c.fill();
  c.strokeStyle = RIFT; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-14, y0 - 6); c.lineTo(-6, y0 - 11); c.lineTo(0, y0 - 7); c.lineTo(8, y0 - 12); c.stroke(); // the crack
  c.save(); c.translate(8, y0 - 22); c.rotate(-0.9 + k * 0.12);                                                    // the arm
  c.fillStyle = AXC.stone[1]; poly(c, [[0, -3], [22, -5], [22, 5], [0, 3]]); c.fill();
  c.fillStyle = AXC.obs[0]; poly(c, [[18, -8], [27, -8], [27, 8], [18, 8]]); c.fill();
  c.fillStyle = `rgba(${T.glow},0.7)`; c.fillRect(20, -1, 5, 2);
  c.restore();
  c.fillStyle = T.light; c.fillRect(10, y0 - 19, 2.2, 1.6);
}
function dGravemantle(c, T, u) { // Gravemantle: a cloaked dome of stone with small stones orbiting it, heavy and slow
  const y0 = -6 + hov(u, 1.4), t = u.anim;
  c.fillStyle = AXC.obs[1]; c.beginPath(); c.moveTo(-13, y0); c.quadraticCurveTo(-12, y0 - 24, 0, y0 - 26); c.quadraticCurveTo(12, y0 - 24, 13, y0); c.closePath(); c.fill(); // the mantle
  c.fillStyle = AXC.stone[0]; c.beginPath(); c.moveTo(0, y0 - 26); c.quadraticCurveTo(12, y0 - 24, 13, y0); c.lineTo(4, y0); c.quadraticCurveTo(6, y0 - 18, 0, y0 - 26); c.fill();
  c.strokeStyle = `rgba(${RIFTA},0.7)`; c.lineWidth = 1; c.beginPath(); c.moveTo(-8, y0 - 6); c.quadraticCurveTo(0, y0 - 10, 8, y0 - 6); c.stroke(); // glyph band
  c.fillStyle = T.light; c.fillRect(5, y0 - 18, 2, 1.4);
  for (let i = 0; i < 3; i++) { const a = t * 1.2 + i * 2.09, x = Math.cos(a) * 16, y = y0 - 14 + Math.sin(a) * 4; c.fillStyle = Math.sin(a) > 0 ? AXC.stone[0] : AXC.stone[2]; poly(c, [[x, y - 2.5], [x + 2, y], [x, y + 2], [x - 2, y]]); c.fill(); }
}
function dEventide(c, T, u) { // Eventide: an upright stone ring around a dark sphere, on a hovering plinth
  const y0 = -8 + hov(u, 1), t = u.anim, k = 0.5 + 0.5 * Math.sin(t * 2);
  c.fillStyle = `rgba(${RIFTA},0.25)`; c.beginPath(); c.ellipse(0, -0.5, 16, 3, 0, 0, 7); c.fill();
  c.fillStyle = AXC.stone[1]; poly(c, [[-12, y0], [12, y0], [9, y0 - 6], [-9, y0 - 6]]); c.fill();             // plinth
  c.strokeStyle = AXC.stone[0]; c.lineWidth = 5; c.beginPath(); c.ellipse(0, y0 - 22, 9, 15, 0, 0, 7); c.stroke(); // the ring
  c.strokeStyle = `rgba(${T.glow},0.6)`; c.lineWidth = 1; c.stroke();
  c.fillStyle = '#05060d'; c.beginPath(); c.arc(0, y0 - 22, 5.5, 0, 7); c.fill();                                 // the sphere
  c.strokeStyle = `rgba(${RIFTA},${0.4 + 0.5 * k})`; c.lineWidth = 1.2; c.beginPath(); c.arc(0, y0 - 22, 7 + k, 0, 7); c.stroke();
}
const DRAW_U = { skitterling: dSkitter, mite: dMite, bulwark: dBulwark, razorwing: dRazor, leaper: dLeaper, ravager: dRavager, spitter: dSpitter, bilecaster: dBilecaster, bilelobber: dLobber, ruinmaw: dRuinmaw, thornback: dThornback, dreadthorn: dDreadthorn, needlewing: dNeedle, cloudwing: dCloudwing, broodtyrant: dTyrant, worldrender: dWorld, shardling: dShard, bastion: dBastion, wraithwing: dWraith, riftstalker: dRiftstalker, parallax: dParallax, lancer: dLancer, marksman: dMarksman, riftmortar: dRiftMortar, worldbreaker: dWorldbreaker, gravemantle: dGravemantle, eventide: dEventide, prismwing: dPrism, shardstorm: dShardstorm, voidcarrier: dVoidcarrier, sovereign: dSovereign, rifle: dRifle, heavy: dHeavy, sniper: dSniper, tank: dTank, artillery: dArt, titan: dTitan, flame: dFlame, hydra: dHydra, aircraft: dAir, interceptor: dInter, leviathan: dLev, medic: dMedic, drone: dDrone };
// Drawn size where it differs from the SIM height (the Titan walker stands taller than its hitbox): health bars and shadows follow the art
const UVIS = { titan: { h: 50, w: 17 }, hydra: { h: 42, w: 15 } };
const visH = type => (UVIS[type] || UDEF[type]).h;
// Sprite cache: a ground unit's pose is drawn once into a small canvas at the current zoom, then stamped with one
// drawImage. Walk cycles are cut into a few poses; a unit mid-recoil and aircraft (few, always animating) draw live.
const SPR_BOX = { shardling: [-12, -34, 32, 40], bastion: [-22, -40, 46, 44], riftstalker: [-16, -34, 40, 40], parallax: [-18, -42, 42, 48], lancer: [-12, -38, 34, 42], marksman: [-14, -36, 44, 42], riftmortar: [-22, -38, 46, 42], worldbreaker: [-26, -66, 66, 70], gravemantle: [-24, -44, 48, 48], eventide: [-22, -56, 44, 60], skitterling: [-14, -12, 30, 14], mite: [-9, -9, 19, 11], bulwark: [-24, -30, 55, 32], leaper: [-20, -20, 36, 22], ravager: [-18, -34, 44, 36], spitter: [-12, -20, 30, 22], bilecaster: [-14, -26, 36, 28], bilelobber: [-18, -32, 38, 34], ruinmaw: [-26, -36, 60, 38], thornback: [-18, -30, 38, 32], dreadthorn: [-24, -46, 58, 48], rifle: [-9, -26, 22, 30], heavy: [-14, -33, 29, 36], sniper: [-11, -26, 31, 30], tank: [-25, -34, 55, 37], artillery: [-30, -38, 64, 41], titan: [-22, -56, 64, 62], flame: [-23, -24, 52, 27], hydra: [-22, -50, 62, 54] };
const SPR_STEP = { shardling: [9, 6], bastion: [4, 6], riftstalker: [8, 6], parallax: [7, 6], lancer: [6, 6], marksman: [1.5, 4], riftmortar: [1.6, 6], worldbreaker: [1.2, 6], gravemantle: [1.4, 6], eventide: [1, 6], skitterling: [14, 6], mite: [18, 6], bulwark: [6, 8], leaper: [12, 6], ravager: [8, 6], spitter: [10, 6], bilecaster: [7, 6], bilelobber: [5, 8], ruinmaw: [4, 8], thornback: [7, 8], dreadthorn: [5, 8], rifle: [11, 8], heavy: [8, 8], sniper: [10, 8], titan: [3.2, 12], hydra: [3.6, 12] }; // [phase speed, poses per cycle]
const SPR = { scale: 0, map: new Map(), budget: 0 };
function sprPose(u) { // a stand-in unit snapped to one of the cached poses, with its cache key; null = draw live
  const box = SPR_BOX[u.type];
  if (!box || u.recoil > 0.02) return null;
  let q = 0, anim = 0;
  if (u.moving) {
    if (u.type === 'tank' || u.type === 'flame') { q = 1 + (((u.anim * 30) % 5 + 5) % 5 / 1.25 | 0); anim = (q - 1) * 1.25 / 30; }
    else if (u.type !== 'artillery') { const [k, n] = SPR_STEP[u.type], c = Math.round(u.anim * k / (2 * Math.PI) * n) % n; q = 1 + c; anim = c * 2 * Math.PI / n / k; }
  }
  return { key: u.type + u.side + '.' + q + (u.aimAir ? 'a' : ''), box, u: { anim, moving: q > 0, recoil: 0, aimAir: u.aimAir } }; // a Hydra's guns up or level
}
function drawUnitArt(c, u, T) {
  const p = sprPose(u);
  if (p) {
    const b = 2 ** (Math.ceil(Math.log2(V.dpr * V.S * US) * 4) / 4); // device pixels per art unit, in quarter-octave steps
    if (b !== SPR.scale) { SPR.scale = b; SPR.map.clear(); }
    let cv = SPR.map.get(p.key);
    if (!cv && SPR.budget > 0) { // a few new poses per frame at most, so a zoom change never stalls a frame
      SPR.budget--;
      cv = document.createElement('canvas'); cv.width = Math.ceil(p.box[2] * b); cv.height = Math.ceil(p.box[3] * b);
      const k = cv.getContext('2d'); k.setTransform(b, 0, 0, b, -p.box[0] * b, -p.box[1] * b);
      DRAW_U[u.type](k, T, p.u);
      SPR.map.set(p.key, cv);
    }
    if (cv) { c.drawImage(cv, p.box[0], p.box[1], cv.width / b, cv.height / b); return; }
  }
  DRAW_U[u.type](c, T, u);
}

