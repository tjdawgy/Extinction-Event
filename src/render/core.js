/* =====================================================================
   RENDER — side-scrolling battlefield with Colony-style isometric bases.
   Draw functions take a canvas context so the same art is reused for icons.
   ===================================================================== */
const TEAM = [
  { main: '#39c8ff', light: '#c4f3ff', hull: '#24506b', glow: '57,200,255', face: ['#7adcff', '#2ea6d6', '#1f7aa2'] },
  { main: '#ff4d4d', light: '#ffd0d0', hull: '#6b2626', glow: '255,77,77', face: ['#ff8a8a', '#d63d3d', '#a52c2c'] },
];
const M = { d: '#161e2c', m: '#2a3648', l: '#435269', h: '#7c8ba2' };
const MAT = { metal: ['#66779a', '#3e4b65', '#2a3448'], dark: ['#3a465c', '#262f42', '#1a2131'], light: ['#97a7c1', '#66758f', '#4c5a72'] };
const V = { cw: 0, ch: 0, dpr: 1, S: 1, S0: 1, zoom: 1, A: 0, ft: 0, fb: 0 };
const cam = { x: 0, vx: 0 };
const Y_TOP = -174, Y_BOT = 92;          // world rows that must fit between the top bar and the card tray
const GU0 = -500, GU1 = L + 500, GV0 = -260, GV1 = 480, HORIZON = GV0 * DY;
const UMIN = 0, UMAX = L;
const GB = { x0: GU0 - 10, x1: GU1 + 10, y0: HORIZON - 4, y1: GV1 * DY + 4 };
const PAD_H = 30, HQ_PAD_H = 36;
const gp = (u, v, z = 0) => [u, v * DY - z];                 // world plane → screen-world
const pt = (u, v, z = 0) => [(u + v) * IX, (v - u) * IY - z];  // building-local isometric → screen-world
function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
function rr(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
// Isometric block: visible top, left face (−u side) and right face (+v side)
function sides(c, u, v, a, b, z, h, col) {
  poly(c, [pt(u - a, v - b, z), pt(u - a, v + b, z), pt(u - a, v + b, z + h), pt(u - a, v - b, z + h)]); c.fillStyle = col[1]; c.fill();
  poly(c, [pt(u - a, v + b, z), pt(u + a, v + b, z), pt(u + a, v + b, z + h), pt(u - a, v + b, z + h)]); c.fillStyle = col[2]; c.fill();
}
function box(c, u, v, a, b, z, h, col) {
  sides(c, u, v, a, b, z, h, col);
  poly(c, [pt(u - a, v - b, z + h), pt(u + a, v - b, z + h), pt(u + a, v + b, z + h), pt(u - a, v + b, z + h)]);
  c.fillStyle = col[0]; c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 0.8; c.stroke();
}
function winL(c, u, v, a, b, z, h, n, col) { // window strip on the left face
  c.fillStyle = col;
  const step = 2 * b / n;
  for (let i = 0; i < n; i++) { const s0 = -b + step * (i + 0.22), s1 = s0 + step * 0.56; poly(c, [pt(u - a, v + s0, z), pt(u - a, v + s1, z), pt(u - a, v + s1, z + h), pt(u - a, v + s0, z + h)]); c.fill(); }
}
function winR(c, u, v, a, b, z, h, n, col) { // window strip on the right face
  c.fillStyle = col;
  const step = 2 * a / n;
  for (let i = 0; i < n; i++) { const s0 = -a + step * (i + 0.22), s1 = s0 + step * 0.56; poly(c, [pt(u + s0, v + b, z), pt(u + s1, v + b, z), pt(u + s1, v + b, z + h), pt(u + s0, v + b, z + h)]); c.fill(); }
}
function cone(c, u, v, r0, r1, z, h, c0, c1, top) {
  const [x, y0] = pt(u, v, z), rx0 = r0 * 1.2247, ry0 = r0 * 0.7071, rx1 = r1 * 1.2247, ry1 = r1 * 0.7071;
  c.beginPath(); c.moveTo(x + rx0, y0); c.ellipse(x, y0, rx0, ry0, 0, 0, Math.PI); c.lineTo(x - rx1, y0 - h); c.lineTo(x + rx1, y0 - h); c.closePath();
  const g = c.createLinearGradient(x - rx0, 0, x + rx0, 0); g.addColorStop(0, c0); g.addColorStop(1, c1);
  c.fillStyle = g; c.fill();
  if (top) { c.beginPath(); c.ellipse(x, y0 - h, rx1, ry1, 0, 0, Math.PI * 2); c.fillStyle = top; c.fill(); }
}
const cyl = (c, u, v, r, z, h, c0, c1, top) => cone(c, u, v, r, r, z, h, c0, c1, top);
function ring(c, u, v, r, z, col, lw) { const [x, y] = pt(u, v, z); c.strokeStyle = col; c.lineWidth = lw || 1.5; c.beginPath(); c.ellipse(x, y, r * 1.2247, r * 0.7071, 0, 0, Math.PI * 2); c.stroke(); }
function dome(c, u, v, r, z, c0, c1) {
  const [x, y] = pt(u, v, z), rx = r * 1.2247, ry = r * 0.7071;
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI); c.ellipse(x, y, rx, r * 1.05, 0, Math.PI, Math.PI * 2);
  const g = c.createRadialGradient(x - rx * 0.35, y - r * 0.6, r * 0.1, x, y, rx * 1.1); g.addColorStop(0, c0); g.addColorStop(1, c1);
  c.fillStyle = g; c.fill();
}
function glow(c, x, y, r, rgb, a) {
  c.fillStyle = `rgba(${rgb},${a * 0.3})`; c.beginPath(); c.arc(x, y, r * 2.2, 0, 7); c.fill();
  c.fillStyle = `rgba(${rgb},${a})`; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
}
function beacon(c, u, v, z, T, t) { const [x, y] = pt(u, v, z); glow(c, x, y, 2, T.glow, 0.55 + 0.45 * Math.sin(t * 4)); }
function mast(c, u, v, z0, h, T, t) {
  const [x, y] = pt(u, v, z0);
  c.strokeStyle = M.h; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke();
  glow(c, x, y - h, 2, T.glow, 0.55 + 0.45 * Math.sin(t * 4 + u));
}
// Buildings (v2.7): each type has a static body, drawn once per tier and team into a cached bitmap (see BCACHE),
// and a few light animated parts drawn live on top (lights, guns, flags, crystal, flame). T1 is basic, T2 visibly
// reinforced, T3 a fortress. Every part stays on the building's pad and below its health bar (top ≥ −(half + h)).
const plinth = (c, half) => box(c, 0, 0, half + 2, half + 2, 0, 6, MAT.dark);
function trim(c, half, T, tier) { if (tier >= 2) sides(c, 0, 0, half + 2.2, half + 2.2, 1.5, tier >= 3 ? 3 : 1.6, T.face); } // team trim on the plinth
function pipe(c, a, b, w, col) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
function lamp(c, u, v, z, rgb, a, r = 1.8) { const [x, y] = pt(u, v, z); glow(c, x, y, r, rgb, a); }
const blink = (t, ph) => 0.5 + 0.5 * Math.sin(t * 4 + ph);
function gunAngle(b, x, y, def) { // screen angle from a gun's pivot (building-local x, y) to its target
  if (b && b.aim) { const s0 = P(b.u, b.v), d = P(b.aim.u, b.aim.v, b.aim.z); return Math.atan2(d.y - (s0.y + y * BS), d.x - (s0.x + x * BS)); }
  return b && b.side === 1 ? Math.PI - def : def;
}
function barrels(c, n, x0, len, gap, w) { for (let i = 0; i < n; i++) c.fillRect(x0, (i - (n - 1) / 2) * gap - w / 2, len, w); }

