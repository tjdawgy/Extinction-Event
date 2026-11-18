/* ---------- Faction rework art, batch 5d (v2.91; docs/FACTION_REWORK.md "Batch 5d"): every building redrawn ----------
   Every building of all three factions redrawn to match the reworked units, with the team colour on its largest surfaces so
   a base reads as blue or red at a glance. Art only: footprints, health, heights (BDEF h, which the SIM aims at) and the gun
   points are untouched; each gun turns about the SIM's own muzzle point (muzzle() in src/sim/creep-field-signature.js: a
   Turret (0, 0, 38), a node bunker (0, 0, 20), an HQ (0, −8, 79) in screen-world units, so building-local pt(4, −4, 79)).
   Each body is a function (c, T, tier, dmg) drawn once into the building cache (BCACHE, src/render/backdrop.js) per type,
   faction, tier, team colours, art and damage stage (dmg 0 healthy, 1 under 66% health, 2 under 33%); the live part
   (c, T, t, b, tier) draws only what moves (guns, lights, doors while producing, pulses). Damage marks sit on the faces of
   each building's main mass (DMG5_AT), so cached and live drawing agree. */
const G5 = ['#7d8898', '#4c5563', '#323944'], G5D = '#191d24', HAZ5 = '#f2c23a';
const tf5 = T => T.face; // a team armour block: [top, left face, right face]
function fq5(c, pts, fill, lw = 0.8) { poly(c, pts); c.fillStyle = fill; c.fill(); outline(c, lw); }
// an outlined isometric block with a rim light on its two front top edges
function ib5(c, u, v, a, b, z, h, col, lw = 0.8) {
  fq5(c, [pt(u - a, v - b, z), pt(u - a, v + b, z), pt(u - a, v + b, z + h), pt(u - a, v - b, z + h)], col[1], lw);
  fq5(c, [pt(u - a, v + b, z), pt(u + a, v + b, z), pt(u + a, v + b, z + h), pt(u - a, v + b, z + h)], col[2], lw);
  fq5(c, [pt(u - a, v - b, z + h), pt(u + a, v - b, z + h), pt(u + a, v + b, z + h), pt(u - a, v + b, z + h)], col[0], lw);
  c.strokeStyle = 'rgba(255,255,255,0.32)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(...pt(u - a, v - b, z + h)); c.lineTo(...pt(u - a, v + b, z + h)); c.lineTo(...pt(u + a, v + b, z + h)); c.stroke();
}
// an angular armour cap: a block whose top is inset (a, b at the foot, a2, b2 at the top)
function fr5(c, u, v, a, b, a2, b2, z, h, col, lw = 0.8) {
  fq5(c, [pt(u + a, v - b, z), pt(u + a, v + b, z), pt(u + a2, v + b2, z + h), pt(u + a2, v - b2, z + h)], col[0], lw); // back faces first
  fq5(c, [pt(u - a, v - b, z), pt(u + a, v - b, z), pt(u + a2, v - b2, z + h), pt(u - a2, v - b2, z + h)], col[0], lw);
  fq5(c, [pt(u - a, v - b, z), pt(u - a, v + b, z), pt(u - a2, v + b2, z + h), pt(u - a2, v - b2, z + h)], col[1], lw);
  fq5(c, [pt(u - a, v + b, z), pt(u + a, v + b, z), pt(u + a2, v + b2, z + h), pt(u - a2, v + b2, z + h)], col[2], lw);
  fq5(c, [pt(u - a2, v - b2, z + h), pt(u + a2, v - b2, z + h), pt(u + a2, v + b2, z + h), pt(u - a2, v + b2, z + h)], col[0], lw);
}
// a rectangle on a block's left face (u = u0 − a; s across v) or right face (v = v0 + b; s across u)
const fL5 = (u, v, a, s0, s1, z0, z1, o = 0.15) => [pt(u - a - o, v + s0, z0), pt(u - a - o, v + s1, z0), pt(u - a - o, v + s1, z1), pt(u - a - o, v + s0, z1)];
const fR5 = (u, v, b, s0, s1, z0, z1, o = 0.15) => [pt(u + s0, v + b + o, z0), pt(u + s1, v + b + o, z0), pt(u + s1, v + b + o, z1), pt(u + s0, v + b + o, z1)];
function slit5(c, T, pts, a = 1) { fq5(c, pts, '#0a0d12', 0.4); poly(c, pts); c.fillStyle = `rgba(${T.glow},${0.85 * a})`; c.fill(); } // a glowing visor slit
function haz5(c, pts, n) { // hazard stripes across a face rectangle (pts as from fL5/fR5)
  fq5(c, pts, HAZ5, 0.5);
  c.fillStyle = '#1d1f22'; const [a, b, , d] = pts;
  for (let i = 0; i < n; i++) { const k0 = i / n, k1 = k0 + 0.5 / n, L = (k, z) => [a[0] + (b[0] - a[0]) * k + (d[0] - a[0]) * z, a[1] + (b[1] - a[1]) * k + (d[1] - a[1]) * z]; poly(c, [L(k0, 0), L(k1, 0), L(Math.min(1, k1 + 0.3 / n), 1), L(Math.min(1, k0 + 0.3 / n), 1)]); c.fill(); }
}
function sten5(c, u, v, z, n, face) { c.fillStyle = 'rgba(235,240,245,0.7)'; for (let i = 0; i < n; i++) { const [x, y] = face === 'L' ? pt(u, v + i * 2, z) : pt(u + i * 2, v, z); c.fillRect(x - 0.4, y - 1, 0.9, 1.8); } } // a stencilled serial
function lampH5(c, u, v, z) { const [x, y] = pt(u, v, z); c.fillStyle = G5D; c.fillRect(x - 2, y - 1.6, 4, 2.6); c.fillStyle = '#e8eef5'; c.fillRect(x - 1.4, y - 1.1, 2.8, 1.2); } // a floodlight housing
function flood5(c, u, v, z, dir, t, a = 0.18) { // a floodlight's beam (live)
  const [x, y] = pt(u, v, z);
  c.fillStyle = `rgba(255,246,214,${a})`; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dir * 20, y + 18 + Math.sin(t * 0.7) * 2); c.lineTo(x + dir * 8, y + 22 + Math.sin(t * 0.7) * 2); c.closePath(); c.fill();
  glow(c, x, y - 0.5, 1.6, '255,246,214', 0.85);
}
function mast5(c, u, v, z0, h) { pipe(c, pt(u, v, z0), pt(u, v, z0 + h), 1.6, G5D); pipe(c, pt(u, v, z0), pt(u, v, z0 + h), 0.8, G5[0]); for (let z = z0 + 6; z < z0 + h - 2; z += 7) pipe(c, pt(u - 1.5, v, z), pt(u + 1.5, v, z), 0.8, G5[1]); }
function gaussG5(c, T, len, w, n, gap, spin = 0) { // gauss barrels pointing +x from the pivot, coil rings glowing
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * gap + (spin ? Math.sin(spin + i * 2.1) * 1.2 : 0);
    c.fillStyle = G5D; c.fillRect(2, y - w / 2 - 0.5, len + 1, w + 1); c.fillStyle = G5[0]; c.fillRect(2, y - w / 2, len, w);
    c.fillStyle = `rgba(${T.glow},0.95)`; for (let k = 0.4; k < 0.95; k += 0.2) c.fillRect(2 + len * k, y - w / 2 - 0.7, 1.1, w + 1.4);
  }
}
function gunHouse5(c, T, w, h) { // the turning housing at the pivot: a team armour wedge
  c.fillStyle = OUTL; c.beginPath(); c.moveTo(-w - 0.6, -h - 0.6); c.lineTo(w * 0.6, -h - 0.6); c.lineTo(w + 0.6, 0); c.lineTo(w * 0.6, h + 0.6); c.lineTo(-w - 0.6, h + 0.6); c.closePath(); c.fill();
  c.fillStyle = lgrad(c, 0, -h, 0, h, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(-w, -h); c.lineTo(w * 0.6, -h); c.lineTo(w, 0); c.lineTo(w * 0.6, h); c.lineTo(-w, h); c.closePath(); c.fill();
  c.fillStyle = '#0a0d12'; c.fillRect(-w * 0.2, -h * 0.35, w * 0.6, h * 0.25); c.fillStyle = `rgba(${T.glow},0.9)`; c.fillRect(-w * 0.15, -h * 0.32, w * 0.5, h * 0.18);
}
function pad5(c, u, v, r, z) { // a landing pad: a gunmetal disc, thruster scorch, a team ring and a landing mark
  const [x, y] = pt(u, v, z), rx = r * 1.2247, ry = r * 0.7071;
  c.fillStyle = G5[1]; c.beginPath(); c.ellipse(x, y + 1.6, rx, ry, 0, 0, 7); c.fill(); outline(c, 0.7);
  c.fillStyle = G5[0]; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); outline(c, 0.7);
  const g = c.createRadialGradient(x, y, 0, x, y, rx * 0.7); g.addColorStop(0, 'rgba(15,12,10,0.75)'); g.addColorStop(1, 'rgba(15,12,10,0)');
  c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx * 0.7, ry * 0.7, 0, 0, 7); c.fill();
  c.strokeStyle = HAZ5; c.lineWidth = 0.9; c.beginPath(); c.ellipse(x, y, rx * 0.82, ry * 0.82, 0, 0, 7); c.stroke();
  c.strokeStyle = 'rgba(235,240,245,0.7)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - rx * 0.25, y - ry * 0.3); c.lineTo(x - rx * 0.25, y + ry * 0.3); c.moveTo(x + rx * 0.25, y - ry * 0.3); c.lineTo(x + rx * 0.25, y + ry * 0.3); c.moveTo(x - rx * 0.25, y); c.lineTo(x + rx * 0.25, y); c.stroke();
}
function barrier5(c, T, u, v, a, b) { ib5(c, u, v, a, b, 0, 6, G5, 0.6); sides(c, u, v, a + 0.1, b + 0.1, 3.5, 1.2, [0, HAZ5, HAZ5]); } // a prefab barrier block (no sandbags)
function cylT5(c, T, u, v, r, z, h, cap) { cyl(c, u, v, r, z, h, T.face[0], T.face[2], cap || T.face[0]); const [x, y] = pt(u, v, z); c.strokeStyle = OUTL; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - r * 1.2247, y); c.lineTo(x - r * 1.2247, y - h); c.moveTo(x + r * 1.2247, y); c.lineTo(x + r * 1.2247, y - h); c.stroke(); }
function band5(c, u, v, r, z, h, col) { cyl(c, u, v, r + 0.3, z, h, col[0], col[2], null); } // a gunmetal band round a cylinder

/* ---- Last Fist: a future frontier army base. Prefab armoured modules in the team colour, gunmetal frames and caps,
   blast doors with hazard frames, landing pads, sensor masts, floodlights, gauss guns, stencils and scars ---- */
// Command HQ: a team armour fortress under a command tower; its gauss cannon turns at pt(4, −4, 79), the SIM's muzzle
const HQ5 = [0, 26, 28, 30];
function hqBody5(c, T, tier) {
  const F = tf5(T), H = HQ5[tier], roof = 8 + H;
  fr5(c, 0, 0, 46, 46, 43, 43, 0, 8, G5); // the armoured foundation
  if (tier >= 2) { ib5(c, 28, -30, 10, 10, 8, 50, F); fr5(c, 28, -30, 11, 11, 8, 8, 58, 4, G5); mast5(c, 28, -30, 62, 18); } // the rear comms tower
  if (tier >= 3) for (const [u, v] of [[-38, -36], [36, 38]]) { ib5(c, u, v, 6, 6, 8, 34, G5); fr5(c, u, v, 7.5, 7.5, 5, 5, 42, 5, F); slit5(c, T, fL5(u, v, 6, -3, 3, 34, 36)); } // corner gun bastions
  ib5(c, 0, 0, 36, 36, 8, H, F); // the main armour block, team colour
  haz5(c, fR5(0, 0, 36, -34, 34, 8, 11), 14); haz5(c, fL5(0, 0, 36, -34, 34, 8, 11), 14);
  for (const s of [-12, 12]) { const L = pt(-36.2, s, 11), R = pt(-36.2, s, roof); pipe(c, L, R, 0.7, 'rgba(0,0,0,0.35)'); const L2 = pt(s, 36.2, 11), R2 = pt(s, 36.2, roof); pipe(c, L2, R2, 0.7, 'rgba(0,0,0,0.35)'); } // plate seams
  slit5(c, T, fL5(0, 0, 36, -30, -4, roof - 8, roof - 5)); slit5(c, T, fR5(0, 0, 36, -30, 30, roof - 8, roof - 5)); // visor windows
  fq5(c, fL5(0, 0, 36, 6, 26, 11, 28), G5D); haz5(c, fL5(0, 0, 36, 4, 6, 11, 29, 0.2), 3); haz5(c, fL5(0, 0, 36, 26, 28, 11, 29, 0.2), 3); fq5(c, fL5(0, 0, 36, 6, 26, 28, 30, 0.2), HAZ5, 0.4); // the blast door
  for (const z of [15, 20, 25]) pipe(c, pt(-36.3, 7, z), pt(-36.3, 25, z), 0.6, 'rgba(255,255,255,0.12)');
  sten5(c, 14, 36.3, 20, 4, 'R'); chips(c, [pt(-36, -30, roof - 1), pt(20, 36, 12), pt(-36, 30, 16)]);
  fr5(c, 0, 0, 37, 37, 31, 31, roof, 5, G5); // the angular roof cap
  lampH5(c, -31, 31, roof + 5); lampH5(c, -31, -28, roof + 5); lampH5(c, 28, 31, roof + 5);
  ib5(c, 4, -4, 17, 17, roof + 5, 60 - roof, F); // the command tower
  slit5(c, T, fL5(4, -4, 17, -13, 13, 60, 63)); slit5(c, T, fR5(4, -4, 17, -13, 13, 60, 63));
  fr5(c, 4, -4, 18, 18, 13, 13, 65, 5, G5);
  cyl(c, 4, -4, 9, 70, 6, G5[0], G5[2], G5[1]); ring(c, 4, -4, 9, 73, T.main, 1.6); // the turret ring under the cannon
  mast5(c, -22, -26, roof + 5, 34); // the sensor mast (its dish turns, live)
  if (tier >= 3) { cyl(c, -24, 10, 4.5, roof + 5, 8, G5[0], G5[2], F[0]); cone(c, -24, 10, 3.6, 0.8, roof + 13, 30, F[0], F[2], null); } // the command spire
  if (tier >= 2) pad5(c, 22, 18, 9, roof + 5.2); // a rooftop landing pad
}
function hqLive5(c, T, t, b, tier) {
  const roof = 8 + HQ5[tier], [mx, my] = pt(-22, -26, roof + 39), w = 7 * Math.cos(t * 1.6);
  c.fillStyle = w > 0 ? '#d8dee8' : G5[1]; c.beginPath(); c.ellipse(mx, my, Math.abs(w) + 1, 3.6, 0, 0, 7); c.fill(); outline(c, 0.6); // radar dish
  glow(c, mx, my - 3.5, 1.6, T.glow, 0.3 + 0.7 * blink(t, 0));
  flood5(c, -31, 31, roof + 6, -1, t); flood5(c, 28, 31, roof + 6, 1, t + 1);
  if (tier >= 2) { const [x, y] = pt(28, -30, 80); glow(c, x, y, 1.6, '255,90,90', Math.sin(t * 5) > 0.2 ? 0.9 : 0.15); for (const [u, v] of [[16, 18], [28, 18], [22, 12], [22, 24]]) lamp(c, u, v, roof + 6, '255,211,77', 0.3 + 0.6 * blink(t, u), 0.9); }
  if (tier >= 3) lamp(c, -24, 10, roof + 44, T.glow, 0.35 + 0.65 * blink(t, 1), 2);
  const [tx, ty] = pt(4, -4, 79), a = gunAngle(b, tx, ty, -0.5); // the gauss cannon, about the SIM's muzzle point
  c.save(); c.translate(tx, ty); c.rotate(a);
  gaussG5(c, T, 18 + tier * 2, tier === 1 ? 4 : 2.8, tier, 3.6);
  gunHouse5(c, T, 8, 4.5 + tier);
  c.restore();
}
// Turret: a gauss gun emplacement: an armoured octagon base, a team collar, the turning gun at pt(0, 0, 38)
function turretBody5(c, T, tier) {
  const F = tf5(T);
  fr5(c, 0, 0, 27, 27, 24, 24, 0, 5, G5);
  for (const [u, v, a, b] of [[-22, 0, 2.5, 14], [0, 22, 14, 2.5]]) barrier5(c, T, u, v, a, b);
  fr5(c, 0, 0, 19, 19, 13, 13, 5, 18, F); // the armoured base, team colour
  haz5(c, fR5(0, 0, 19, -17, 17, 5, 8), 8); haz5(c, fL5(0, 0, 19, -17, 17, 5, 8), 8);
  sten5(c, -4, 17.5, 13, 3, 'R');
  if (tier >= 2) { ib5(c, -12, 14, 4, 4, 5, 8, G5, 0.6); sides(c, -12, 14, 4.1, 4.1, 9, 1.4, [0, HAZ5, HAZ5]); }
  if (tier >= 3) { ib5(c, 14, 12, 4, 4, 5, 7, G5, 0.6); mast5(c, 15, -15, 5, 42); }
  cyl(c, 0, 0, tier >= 2 ? 12 : 10.5, 23, 10, G5[0], G5[2], G5[1]); // the gun column
  ring(c, 0, 0, tier >= 2 ? 12 : 10.5, 28, T.main, 1.5);
  cyl(c, 0, 0, 9, 33, 3, F[0], F[2], F[0]);
}
function turretLive5(c, T, t, b, tier) {
  if (tier >= 3) lamp(c, 15, -15, 48, '255,90,90', 0.25 + 0.75 * (Math.sin(t * 5) > 0.3 ? 1 : 0), 1.5);
  const [hx, hy] = pt(0, 0, 38), a = gunAngle(b, hx, hy, -0.3);
  c.save(); c.translate(hx, hy); c.rotate(a);
  if (tier === 1) gaussG5(c, T, 17, 3.2, 1, 0);
  else if (tier === 2) gaussG5(c, T, 19, 2.4, 2, 4.6);
  else { gaussG5(c, T, 19, 1.8, 4, 2.2, b && b.aim ? t * 14 : 0); c.fillStyle = G5D; c.fillRect(17, -4.4, 3, 8.8); }
  gunHouse5(c, T, 7 + tier * 0.6, 4.4 + tier * 0.6);
  c.restore();
}
// Barracks: a troop module behind a blast door that opens while it trains; a floodlight tower at T2, a second storey at T3
function barracksBody5(c, T, tier) {
  const F = tf5(T);
  fr5(c, 0, 0, 34, 34, 31, 31, 0, 6, G5);
  if (tier >= 2) { ib5(c, 22, -24, 4.5, 4.5, 6, 34, G5); fr5(c, 22, -24, 7, 7, 5, 5, 40, 4, F); lampH5(c, 19, -21, 42); } // the floodlight tower
  if (tier >= 3) { ib5(c, -22, -25, 4, 4, 6, 28, G5); mast5(c, -22, -25, 34, 14); }
  ib5(c, -2, 4, 26, 22, 6, 24, F); // the troop module
  haz5(c, fR5(-2, 4, 22, -24, 24, 6, 9), 12);
  fq5(c, fL5(-2, 4, 26, -2, 20, 6, 24), G5D); // the blast door's frame (the door itself is live)
  haz5(c, fL5(-2, 4, 26, -4, -2, 6, 25, 0.2), 3); haz5(c, fL5(-2, 4, 26, 20, 22, 6, 25, 0.2), 3);
  slit5(c, T, fR5(-2, 4, 22, -20, 20, 22, 25)); sten5(c, 10, 26.3, 14, 4, 'R');
  for (const s of [-10, 4, 18]) pipe(c, pt(s, 26.2, 9), pt(s, 26.2, 30), 0.6, 'rgba(0,0,0,0.3)');
  fr5(c, -2, 4, 27, 23, 22, 18, 30, 5, G5);
  for (const u of [-14, 0]) ib5(c, u, 14, 4, 3, 35, 3, G5, 0.5); // roof vents
  if (tier >= 3) { ib5(c, -2, 4, 17, 13, 35, 13, F); slit5(c, T, fL5(-2, 4, 17, -10, 10, 42, 45)); slit5(c, T, fR5(-2, 4, 13, -14, 14, 42, 45)); fr5(c, -2, 4, 18, 14, 14, 10, 48, 4, G5); }
}
function barracksLive5(c, T, t, b, tier) {
  const busy = b && b.queue && b.queue.length, k = busy ? 0.5 + 0.5 * Math.sin(t * 2.2) : 0; // the door slides up while it trains
  const z0 = 6 + 15 * k; // the door rolls up while it trains
  if (k > 0.05) { poly(c, fL5(-2, 4, 26, 0, 18, 6, z0, 0.25)); c.fillStyle = `rgba(${T.glow},${0.35 + 0.3 * k})`; c.fill(); }
  poly(c, fL5(-2, 4, 26, 0, 18, z0, 24, 0.3)); c.fillStyle = G5[1]; c.fill(); outline(c, 0.5);
  for (let z = 22; z > z0 + 1; z -= 4) pipe(c, pt(-28.4, 1, z), pt(-28.4, 17, z), 0.7, `rgba(${T.glow},0.6)`);
  if (tier >= 2) { const sw = Math.sin(t * 0.9) * 0.9 + 2.2, [x, y] = pt(19, -21, 43); c.fillStyle = 'rgba(255,246,214,0.18)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(sw - 0.16) * 30, y + Math.sin(sw - 0.16) * 15 + 16); c.lineTo(x + Math.cos(sw + 0.16) * 30, y + Math.sin(sw + 0.16) * 15 + 16); c.closePath(); c.fill(); glow(c, x, y, 2, '255,246,214', 0.8); }
  if (tier >= 3) lamp(c, -22, -25, 48, T.glow, 0.3 + 0.6 * blink(t, 2), 1.5);
}
// War Factory: a vehicle hangar with a great blast door on its right face and a crane gantry on its roof
function factoryBody5(c, T, tier) {
  const F = tf5(T);
  fr5(c, 0, 0, 38, 38, 35, 35, 0, 6, G5);
  for (const [u, v, h] of [[-24, -26, 40], [-10, -30, 34], [-30, -10, 30]].slice(0, tier)) { cyl(c, u, v, 3.6, 6, h, G5[0], G5[2], G5D); band5(c, u, v, 3.6, h - 6, 2, [F[0], 0, F[2]]); } // exhaust stacks
  ib5(c, 0, 2, 32, 28, 6, 26, F); // the hangar
  haz5(c, fL5(0, 2, 32, -26, 26, 6, 9), 12);
  slit5(c, T, fL5(0, 2, 32, -24, 24, 26, 28.5)); sten5(c, -32.3, -20, 16, 4, 'L'); chips(c, [pt(-32, 26, 30), pt(10, 30, 14)]);
  fq5(c, fR5(0, 2, 28, -18, 18, 6, 27), G5D); haz5(c, fR5(0, 2, 28, -20, -18, 6, 28, 0.2), 3); haz5(c, fR5(0, 2, 28, 18, 20, 6, 28, 0.2), 3); fq5(c, fR5(0, 2, 28, -20, 20, 27, 29, 0.2), HAZ5, 0.4); // the door frame
  fr5(c, 0, 2, 33, 29, 29, 25, 32, 4, G5);
  for (let i = 0; i < 3; i++) ib5(c, -18 + i * 18, 2, 5, 24, 36, 4, G5, 0.5); // roof ribs
  if (tier >= 2) { ib5(c, 26, 20, 7, 8, 6, 14, F, 0.6); fq5(c, fR5(26, 20, 8, -6, 6, 6, 13), G5D); fr5(c, 26, 20, 7.5, 8.5, 6, 7, 20, 2.5, G5, 0.5); } // the side bay
  const gz = 40;
  pipe(c, pt(-12, -20, gz), pt(-12, -20, gz + 20), 2.2, G5D); pipe(c, pt(20, -20, gz), pt(20, -20, gz + 20), 2.2, G5D); pipe(c, pt(-12, -20, gz + 20), pt(20, -20, gz + 20), 2.6, HAZ5); // the gantry
  if (tier >= 3) { pipe(c, pt(-12, 0, gz), pt(-12, 0, gz + 20), 2.2, G5D); pipe(c, pt(20, 0, gz), pt(20, 0, gz + 20), 2.2, G5D); pipe(c, pt(-12, 0, gz + 20), pt(20, 0, gz + 20), 2.6, HAZ5); ib5(c, 4, -10, 11, 7, 40, 5, F, 0.6); cyl(c, 6, -10, 4.5, 45, 3, G5[0], G5[2], F[0]); } // a half-built hull under twin gantries
}
function factoryLive5(c, T, t, b, tier) {
  const busy = b && b.queue && b.queue.length, k = busy ? 0.55 + 0.45 * Math.sin(t * 1.6) : 0;
  poly(c, fR5(0, 2, 28, -18, 18, 6 + 20 * k, 27, 0.3)); c.fillStyle = G5[2]; c.fill(); outline(c, 0.5); // the door rolls up
  for (let z = 10 + 20 * k; z < 26; z += 4) pipe(c, pt(-18, 30.4, z), pt(18, 30.4, z), 0.6, 'rgba(255,255,255,0.14)');
  if (k > 0.05) { poly(c, fR5(0, 2, 28, -18, 18, 6, 6 + 20 * k, 0.3)); c.fillStyle = `rgba(255,170,80,${0.45 + 0.3 * Math.sin(t * 9)})`; c.fill(); }
  const hx = Math.sin(t * 0.7) * 12 + 4, [x, y] = pt(hx, -20, 60); c.strokeStyle = G5D; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 10); c.stroke(); c.fillStyle = HAZ5; c.fillRect(x - 1.5, y + 10, 3, 2);
  if (tier >= 3 && busy && Math.sin(t * 13) > 0.2) lamp(c, 2 + Math.sin(t * 3) * 6, -10, 49, '255,240,190', 0.9, 1.3); // welding sparks
  if (tier >= 2) for (let i = 0; i < 3; i++) { const q = (t * 0.8 + i / 3) % 1, [lx, ly] = pt(20 + q * 12, 28.3, 8); c.fillStyle = busy ? '#ffbe5a' : 'rgba(255,190,90,0.4)'; c.fillRect(lx - 1.1, ly - 1, 2.2, 2); }
}
// Tech Lab: the air wing's hangar and control tower, a landing pad on top scorched by thrusters; antennas at T2, an uplink spire at T3
function techlabBody5(c, T, tier) {
  const F = tf5(T);
  fr5(c, 0, 0, 32, 32, 29, 29, 0, 6, G5);
  if (tier >= 2) for (const [u, k] of [[12, 0], [18, 1], [24, 2]]) pipe(c, pt(u, -26 + k * 3, 36), pt(u, -26 + k * 3, 50 + k * 4), 1, G5D);
  if (tier >= 3) { ib5(c, 22, -22, 3.5, 3.5, 6, 46, G5, 0.6); cone(c, 22, -22, 3, 0.6, 52, 22, F[0], F[2], null); }
  ib5(c, 0, 0, 24, 24, 6, 28, F); // the hangar block
  haz5(c, fL5(0, 0, 24, -22, 22, 6, 9), 10); haz5(c, fR5(0, 0, 24, -22, 22, 6, 9), 10);
  fq5(c, fL5(0, 0, 24, -6, 14, 9, 24), G5D); for (let z = 12; z < 24; z += 3.5) pipe(c, pt(-24.3, -6, z), pt(-24.3, 14, z), 0.6, 'rgba(255,255,255,0.15)'); // hangar door
  slit5(c, T, fR5(0, 0, 24, -20, 20, 26, 29)); sten5(c, 4, 24.3, 15, 4, 'R');
  fr5(c, 0, 0, 25, 25, 21, 21, 34, 4, G5);
  ib5(c, 10, -10, 8, 8, 38, tier >= 3 ? 30 : 24, F, 0.7); // the control tower
  const tt = 38 + (tier >= 3 ? 30 : 24);
  slit5(c, T, fL5(10, -10, 8, -6, 6, tt - 6, tt - 3)); slit5(c, T, fR5(10, -10, 8, -6, 6, tt - 6, tt - 3));
  fr5(c, 10, -10, 9, 9, 6, 6, tt, 3, G5);
  pad5(c, -6, 8, 13, 38.2); // the landing pad
  if (tier >= 2) { dome(c, 10, -10, 5, tt + 3, 'rgba(196,243,255,0.95)', 'rgba(60,110,150,0.9)'); ring(c, 10, -10, 5, tt + 3, T.main, 1.2); }
}
function techlabLive5(c, T, t, b, tier) {
  const busy = b && b.queue && b.queue.length;
  for (const [u, v] of [[-17, 8], [5, 8], [-6, -3], [-6, 19]]) lamp(c, u, v, 39, busy ? '255,211,77' : T.glow, busy ? 0.4 + 0.6 * blink(t * 3, u) : 0.35 + 0.35 * blink(t, u), 1);
  if (busy) { const [x, y] = pt(-6, 8, 40), k = 0.6 + 0.4 * Math.sin(t * 20); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, 12); g.addColorStop(0, `rgba(170,225,255,${0.5 * k})`); g.addColorStop(1, 'rgba(170,225,255,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, 14, 8, 0, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; } // thruster wash on the pad
  if (tier >= 2) for (const [u, k] of [[12, 0], [18, 1], [24, 2]]) lamp(c, u, -26 + k * 3, 50 + k * 4, T.glow, 0.3 + 0.6 * blink(t, k * 2), 1.1);
  if (tier >= 3) { lamp(c, 22, -22, 75, T.glow, 0.4 + 0.6 * blink(t, 3), 1.8); const [x, y] = pt(22, -22, 75); c.strokeStyle = `rgba(${T.glow},${0.3 + 0.3 * Math.sin(t * 3)})`; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, 6 + 3 * ((t * 0.8) % 1), 2.5 + 1.2 * ((t * 0.8) % 1), 0, 0, 7); c.stroke(); }
}
// Reactor: a fusion containment tower in team armour with gunmetal cooling fins and a green plasma window
const RH5 = [0, 46, 50, 54];
function reactorBody5(c, T, tier) {
  const F = tf5(T);
  fr5(c, 0, 0, 32, 32, 29, 29, 0, 6, G5);
  if (tier >= 3) { cylT5(c, T, 20, -6, 8, 6, 34); band5(c, 20, -6, 8, 18, 3, G5); band5(c, 20, -6, 8, 34, 3, G5); pipe(c, pt(12, -6, 22), pt(4, -6, 22), 3, G5[1]); }
  if (tier >= 2) { cylT5(c, T, -20, 18, 7, 6, 18); band5(c, -20, 18, 7, 14, 2.5, G5); pipe(c, pt(-13, 17, 14), pt(-3, 12, 14), 2.6, G5[1]); }
  for (let i = 0; i < 6; i++) { const a = -Math.PI * 0.25 + i * Math.PI / 6 - Math.PI / 2; ib5(c, -4 + Math.cos(a) * 17, -4 + Math.sin(a) * 17, 2, 2, 6, 22, G5, 0.5); } // cooling fins (behind)
  cylT5(c, T, -4, -4, 15, 6, RH5[tier]); // the containment tower
  for (const z of [16, RH5[tier] - 8]) band5(c, -4, -4, 15, z, 3, G5);
  const [x, y] = pt(-4, -4, 26); c.fillStyle = '#0a1210'; rr(c, x - 9, y - 7, 18, 12, 2); c.fill(); outline(c, 0.6); // the plasma window frame
  cyl(c, -4, -4, 11, RH5[tier] + 6, 3, G5[0], G5[2], G5D); // the vent mouth
  for (let i = 0; i < 6; i++) { const a = Math.PI * 0.75 + i * Math.PI / 6 - Math.PI / 2; ib5(c, -4 + Math.cos(a) * 17, -4 + Math.sin(a) * 17, 2, 2, 6, 22, G5, 0.5); } // cooling fins (front)
  ib5(c, 16, 16, 9, 9, 6, 12, F, 0.7); haz5(c, fR5(16, 16, 9, -8, 8, 6, 8.5), 5); slit5(c, T, fL5(16, 16, 9, -6, 6, 13, 15)); // the control module
}
function reactorLive5(c, T, t, b, tier) {
  const p = 0.5 + 0.5 * Math.sin(t * 4), [x, y] = pt(-4, -4, 26);
  c.fillStyle = `rgba(93,255,176,${0.55 + 0.35 * p})`; rr(c, x - 7.5, y - 5.5, 15, 9, 1.5); c.fill();
  c.fillStyle = `rgba(230,255,240,${0.5 + 0.4 * p})`; c.fillRect(x - 6, y - 1.5, 12, 1.4);
  const [vx, vy] = pt(-4, -4, RH5[tier] + 9); glow(c, vx, vy, 4 + p * 2, '93,255,176', 0.2 + 0.25 * p);
  if (tier >= 3) { const [x2, y2] = pt(20, -6, 44); glow(c, x2, y2, 2.5, '93,255,176', 0.4 + 0.4 * p); }
}
// Refinery: two team ore silos banded in gunmetal, a processing block with a hopper and a conveyor, a flare stack
function refineryBody5(c, T, tier) {
  const F = tf5(T), fl = tier >= 3 ? 56 : 46;
  fr5(c, 0, 0, 34, 34, 31, 31, 0, 6, G5);
  cyl(c, 16, -18, 3.5, 6, fl, G5[0], G5[2], G5D); band5(c, 16, -18, 3.5, fl - 6, 2, [HAZ5, 0, '#8e7020']); // the flare stack
  if (tier >= 3) { cylT5(c, T, 2, -26, 5, 6, 50); for (const z of [20, 34, 48]) band5(c, 2, -26, 5, z, 2, G5); }
  ib5(c, 12, -2, 12, 12, 6, 18, G5); fr5(c, 12, -2, 13, 13, 10, 10, 24, 3, F, 0.6); haz5(c, fR5(12, -2, 12, -10, 10, 6, 9), 6); // the processing block
  for (const [u, v, h, r] of [[-14, -12, tier >= 3 ? 40 : 34, tier >= 3 ? 12 : 10.5], [-10, 14, 36, 10.5]]) { // the silos
    cylT5(c, T, u, v, r, 6, h); band5(c, u, v, r, 14, 3, G5); band5(c, u, v, r, h - 6, 2.5, G5);
    cone(c, u, v, r, r * 0.4, 6 + h, 4, G5[0], G5[2], G5[1]);
    const [x, y] = pt(u - r * 0.6, v + r * 0.6, 22); c.fillStyle = 'rgba(235,240,245,0.7)'; c.fillRect(x - 1, y - 2, 1, 3); c.fillRect(x + 1.2, y - 2, 1, 3);
  }
  if (tier >= 2) { cylT5(c, T, 20, 18, 7, 6, 24); band5(c, 20, 18, 7, 12, 2.5, G5); pipe(c, pt(3, 26, 9), pt(4, 10, 20), 3.4, G5[1]); pipe(c, pt(3, 26, 9.5), pt(4, 10, 20.5), 1, G5[0]); cone(c, 3, 28, 3, 5.5, 6, 6, '#8a6a10', '#4a3a08', '#c79a2a'); }
}
function refineryLive5(c, T, t, b, tier) {
  const [gx, gy] = pt(12, -2, 28); c.fillStyle = `rgba(255,211,77,${0.5 + 0.35 * Math.sin(t * 3)})`; c.beginPath(); c.ellipse(gx, gy, 9, 4.5, 0, 0, 7); c.fill();
  if (tier >= 2) for (let i = 0; i < 2; i++) { const k = (t * 0.6 + i / 2) % 1, [x, y] = pt(3, 26 - k * 15, 10 + k * 11); c.fillStyle = '#c79a2a'; c.fillRect(x - 1.4, y - 1.2, 2.8, 2.4); }
  const fl = tier >= 3 ? 56 : 46, [fx, fy] = pt(16, -18, fl + 6), f = 0.75 + 0.25 * Math.sin(t * 17) * Math.sin(t * 7);
  c.fillStyle = `rgba(255,150,40,${0.8 * f})`; c.beginPath(); c.moveTo(fx - 3, fy); c.quadraticCurveTo(fx - 2, fy - 6 * f, fx + Math.sin(t * 6) * 1.5, fy - 10 * f); c.quadraticCurveTo(fx + 2, fy - 6 * f, fx + 3, fy); c.closePath(); c.fill();
  if (tier >= 3) for (const [z, ph] of [[20, 0], [34, 2], [48, 4]]) lamp(c, 2, -26, z + 2, '255,211,77', 0.3 + 0.6 * blink(t, ph), 1.1);
}
// Habitat: stacked prefab living modules in team armour with rows of lit windows and a comms dish
const HAB5 = [null, [[10, -10, 12, 12, 16], [-12, 10, 11, 11, 12]], [[10, -12, 12, 12, 20], [-12, 10, 11, 11, 14], [14, 16, 7, 7, 10]], [[10, -12, 12, 12, 24], [-12, 10, 11, 11, 18], [14, 16, 7, 7, 12], [-16, -16, 7, 7, 14]]];
function habitatBody5(c, T, tier) {
  const F = tf5(T), M5 = HAB5[tier].slice().sort((p, q) => (p[1] - p[0]) - (q[1] - q[0]));
  fr5(c, 0, 0, 34, 34, 31, 31, 0, 6, G5);
  for (const [u, v, a, b, h] of M5) {
    ib5(c, u, v, a, b, 6, h, F, 0.7);
    fr5(c, u, v, a + 1, b + 1, a - 2, b - 2, 6 + h, 3, G5, 0.6);
    for (let z = 10; z + 3 < 6 + h; z += 6) { winL(c, u, v, a + 0.2, b, z, 2.4, Math.max(2, Math.round(b / 3)), '#0a0d12'); winR(c, u, v, a, b + 0.2, z, 2.4, Math.max(2, Math.round(a / 3)), '#0a0d12'); }
    haz5(c, fR5(u, v, b, -a, a, 6, 7.5), Math.round(a / 2));
  }
  const [u, v, , , h] = HAB5[tier][0]; mast5(c, u + 4, v - 4, 9 + h, 14);
}
function habitatLive5(c, T, t, b, tier) {
  for (const [u, v, a, b2, h] of HAB5[tier]) for (let z = 10; z + 3 < 6 + h; z += 6) { // windows lit in the team light, a few dark
    c.globalAlpha = 0.75 + 0.15 * Math.sin(t * 0.7 + u + z);
    winL(c, u, v, a + 0.3, b2, z + 0.4, 1.6, Math.max(2, Math.round(b2 / 3)), T.light); winR(c, u, v, a, b2 + 0.3, z + 0.4, 1.6, Math.max(2, Math.round(a / 3)), T.light);
  }
  c.globalAlpha = 1;
  const [u, v, , , h] = HAB5[tier][0]; lamp(c, u + 4, v - 4, 23 + h, T.glow, 0.55 + 0.45 * Math.sin(t * 4 + u), 1.6);
}
// Salvage Yard: a team sorting shed, scrap heaps, a magnet crane; a compactor at T2, an armoured smelter and a roof gun at T3
function yardBody5(c, T, tier) {
  const F = tf5(T);
  fr5(c, 0, 0, 34, 34, 31, 31, 0, 6, G5);
  mast5(c, -6, -26, 6, 36);
  if (tier >= 3) { ib5(c, 20, -14, 9, 9, 6, 24, F); haz5(c, fR5(20, -14, 9, -8, 8, 6, 9), 5); cyl(c, 24, -18, 3.2, 30, 12, G5[0], G5[2], G5D); fq5(c, fL5(20, -14, 9, -5, 5, 9, 18), '#2a1408'); }
  else if (tier >= 2) { ib5(c, 20, -14, 8, 8, 6, 14, F); haz5(c, fR5(20, -14, 8, -7, 7, 8, 12), 5); }
  ib5(c, -12, -8, 12, 12, 6, 18, F); // the sorting shed
  fq5(c, fL5(-12, -8, 12, -6, 6, 6, 18), G5D); haz5(c, fL5(-12, -8, 12, -6, 6, 17, 19, 0.2), 4);
  sten5(c, -18, 4.3, 14, 3, 'R'); fr5(c, -12, -8, 13, 13, 10, 10, 24, 3, G5);
  if (tier >= 3) cyl(c, -12, -8, 4.5, 27, 3, G5[0], G5[2], F[0]);
  if (tier >= 2) { pipe(c, pt(-2, 2, 12), pt(8, 10, 22), 3.4, G5[1]); scrapHeap(c, -16, 20, 9, 12); }
  scrapHeap(c, 14, 14, 13, tier >= 2 ? 22 : 18);
}
function yardLive5(c, T, t, b, tier) {
  const sw = Math.sin(t * 0.6) * 0.45 + 0.35, [mx, my] = pt(-6, -26, 42), jx = mx + Math.cos(sw) * 22, jy = my + Math.sin(sw) * 9 - 2;
  c.strokeStyle = HAZ5; c.lineWidth = 1.8; c.beginPath(); c.moveTo(mx, my); c.lineTo(jx, jy); c.stroke();
  const drop = 10 + 4 * Math.sin(t * 0.9); c.strokeStyle = G5D; c.lineWidth = 0.8; c.beginPath(); c.moveTo(jx, jy); c.lineTo(jx, jy + drop); c.stroke();
  c.fillStyle = G5[1]; c.beginPath(); c.ellipse(jx, jy + drop + 1.5, 4, 1.8, 0, 0, 7); c.fill(); c.fillStyle = T.main; c.fillRect(jx - 4, jy + drop, 8, 1.2);
  glow(c, mx, my - 1.5, 1.6, AMB, 0.35 + 0.6 * blink(t, 0));
  if (tier >= 3) {
    const od = b && game && game.sides && game.sides[b.side] && overdrive(game, b.side), f = od ? 0.85 + 0.15 * Math.sin(t * 19) : 0.45 + 0.15 * Math.sin(t * 3);
    poly(c, fL5(20, -14, 9, -4.5, 4.5, 9.5, 17.5, 0.3)); c.fillStyle = `rgba(255,${od ? 150 : 110},40,${f})`; c.fill();
    const [hx, hy] = pt(-12, -8, 32), a = gunAngle(b, hx, hy, -0.4);
    c.save(); c.translate(hx, hy); c.rotate(a); gaussG5(c, T, 12, 1.8, 2, 3); gunHouse5(c, T, 5, 3.4); c.restore();
  }
}
// Fortification Depot: a prefab blockhouse in team armour behind barrier blocks, ammunition crates and a radar; a med
// module at T2 (it heals); armour and a twin anti-air gun at T3
function depotBody5(c, T, tier) {
  const F = tf5(T);
  fr5(c, 0, 0, 34, 34, 31, 31, 0, 6, G5);
  if (tier >= 2) { ib5(c, 20, -18, 9, 9, 6, 12, ['#e4e8ee', '#b5bcc6', '#8d95a1'], 0.7); fq5(c, fL5(20, -18, 9, -2, 2, 6, 14), G5D, 0.4); }
  if (tier >= 3) { ib5(c, 4, -2, 22.5, 17.5, 6, 7, G5); haz5(c, fR5(4, -2, 17.5, -21, 21, 7, 10), 10); }
  ib5(c, 4, -2, 20, 15, 6, tier >= 3 ? 20 : 17, F); // the blockhouse
  slit5(c, T, fL5(4, -2, 20, -10, 8, 14, 16.5)); slit5(c, T, fR5(4, -2, 15, -16, 16, 14, 16.5)); sten5(c, -6, 13.3, 9, 4, 'R');
  fr5(c, 4, -2, 21, 16, 17, 12, tier >= 3 ? 26 : 23, 3, G5);
  for (const [u, v, a, b] of [[-26, -6, 2.5, 12], [-26, 16, 2.5, 6], [-4, 25, 12, 2.5]]) barrier5(c, T, u, v, a, b);
  for (const [u, v, z] of [[-14, 18, 6], [-6, 18, 6], [-10, 18, 12]]) { ib5(c, u, v, 3.4, 3, z, 6, CRATE, 0.5); sten5(c, u - 1, v + 3.2, z + 3, 2, 'R'); }
  if (tier >= 3) ib5(c, 4, -2, 7, 7, 29, 4, G5, 0.6);
  mast5(c, 18, 10, tier >= 3 ? 29 : 26, 14);
}
function depotLive5(c, T, t, b, tier) {
  const [mx, my] = pt(18, 10, tier >= 3 ? 43 : 40), w = 6 * Math.cos(t * 1.4);
  c.fillStyle = w > 0 ? '#d8dee8' : G5[1]; c.beginPath(); c.ellipse(mx, my, Math.abs(w) + 1, 3, 0, 0, 7); c.fill(); outline(c, 0.5);
  glow(c, mx, my - 3, 1.5, AMB, 0.3 + 0.7 * blink(t, 1));
  if (tier >= 2) { const [x, y] = pt(20, -18, 22), p = 0.55 + 0.35 * Math.sin(t * 3); c.fillStyle = `rgba(93,255,138,${p})`; c.fillRect(x - 3.5, y - 1.2, 7, 2.4); c.fillRect(x - 1.2, y - 3.5, 2.4, 7); }
  if (tier >= 3) {
    const [hx, hy] = pt(4, -2, 35), a = b && b.aim ? gunAngle(b, hx, hy, -1.1) : -1.1 - 0.5 * Math.abs(Math.sin(t * 0.5)) * (b && b.side === 1 ? -1 : 1) + (b && b.side === 1 ? -0.9 : 0);
    c.save(); c.translate(hx, hy); c.rotate(a); gaussG5(c, T, 15, 2, 2, 4); gunHouse5(c, T, 5.5, 4); c.restore();
  }
}
// Node bunker: an armoured team pillbox in a ring of barrier blocks; its gauss gun turns about pt(0, 0, 20), the SIM's muzzle
function bunkerBody5(c, T, tier) {
  const F = tf5(T);
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 0, 20, 11, 0, 0, 7); c.fill();
  const blk = (i) => { const a = i / 8 * Math.PI * 2, u = Math.cos(a) * 15, v = Math.sin(a) * 15; ib5(c, u, v, 2.6, 2.6, 0, 4.5, G5, 0.5); };
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; if (Math.sin(a) - Math.cos(a) < 0) blk(i); }
  fr5(c, 0, 0, 10, 10, 7, 7, 0, 13, F); // the pillbox
  slit5(c, T, fL5(0, 0, 8.5, -5, 5, 8, 9.6, 0.9)); slit5(c, T, fR5(0, 0, 8.5, -5, 5, 8, 9.6, 0.9));
  haz5(c, fR5(0, 0, 10, -9, 9, 0.5, 2.5, 0.2), 4);
  cyl(c, 0, 0, 5, 13, 4, G5[0], G5[2], G5[1]);
  if (tier >= 3) ring(c, 0, 0, 5, 16, T.main, 1.2);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; if (Math.sin(a) - Math.cos(a) >= 0) blk(i); }
}
function bunkerLive5(c, T, t, b, tier) {
  if (tier >= 2) lamp(c, -6, 6, 13, '93,255,138', 0.35 + 0.55 * blink(t, 0), 1.3);
  const [hx, hy] = pt(0, 0, 20), a = gunAngle(b, hx, hy, tier >= 3 ? -0.8 : -0.3);
  c.save(); c.translate(hx, hy); c.rotate(a);
  if (tier >= 3) gaussG5(c, T, 12, 1.8, 2, 3.2); else gaussG5(c, T, 11, 2.2, 1, 0);
  gunHouse5(c, T, 4.6, 3.2); c.restore();
}
Object.assign(BART, {
  hq: [hqBody5, hqLive5], turret: [turretBody5, turretLive5], barracks: [barracksBody5, barracksLive5], factory: [factoryBody5, factoryLive5],
  techlab: [techlabBody5, techlabLive5], reactor: [reactorBody5, reactorLive5], refinery: [refineryBody5, refineryLive5], habitat: [habitatBody5, habitatLive5],
  sigA: [yardBody5, yardLive5], sigB: [depotBody5, depotLive5], bunker: [bunkerBody5, bunkerLive5],
});

/* ---- Damage stages (all factions): marks drawn from the building's health only (dmgStage: 0 above 66%, 1 above 33%, 2
   below), on the faces of its main mass (DMG5_AT: building-local points), into the cached body; stage 2 adds a live
   flicker (fire for Last Fist, a drip for Bloomhost, a failing glow for the Axiarchs). A building under construction and a
   remembered ghost (no health known) show none. ---- */
const DMG5 = { cut: [0.66, 0.33] };
const DMG5_AT = {
  lastfist: { hq: [[-36.3, -22, 24], [14, 36.3, 18], [-36.3, -31, 14], [26, 36.3, 27]], turret: [[-16.5, -6, 13], [-6, 16.5, 12], [8, 16.5, 17]],
    barracks: [[-28.3, -14, 18], [8, 26.3, 17], [-16, 26.3, 24]], factory: [[-32.3, -12, 18], [24, 30.3, 16], [-26, 30.3, 21]],
    techlab: [[-24.3, -16, 18], [12, 24.3, 18], [-14, 24.3, 13]], reactor: [[-14.6, 6.6, 36], [-15, 3, 20], [16, 25.3, 11]],
    refinery: [[-17.4, 21.4, 28], [-23.5, -12, 26], [-10, 24.5, 16]], habitat: [[-23.2, 6, 12], [-8, 21.2, 10], [-23.2, 15, 8]],
    sigA: [[-24.3, 2, 12], [-4, 4.3, 14], [-18, 4.3, 10]], sigB: [[-16.3, -14, 11], [16, 13.3, 12], [-16.3, 4, 19]], bunker: [[-8, 3, 6], [3, 8, 7]] },
  bloomhost: {}, axiarchs: {},
};
const dmgStage = b => !b || !b.built || !(b.maxHp > 0) ? 0 : b.hp / b.maxHp > DMG5.cut[0] ? 0 : b.hp / b.maxHp > DMG5.cut[1] ? 1 : 2;
const jag5 = (i, k) => ((((i + 3) * 97 + k * 131) % 17) / 17 - 0.5) * 2; // a fixed wobble per mark
function dmg5(c, fac, type, s) {
  const A = (DMG5_AT[facOf(fac)] || {})[type]; if (!s || !A) return;
  const n = s === 1 ? Math.min(2, A.length) : A.length, f = facOf(fac);
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(...A[i]), r = s === 1 ? 5 : 6.5;
    if (f === 'lastfist') { // scorch, cracks, and at stage 2 a torn hole glowing from the fire inside and a bent plate
      c.fillStyle = 'rgba(14,11,9,0.6)'; c.beginPath(); c.ellipse(x, y, r * 1.3, r * 0.8, 0.3, 0, 7); c.fill();
      c.strokeStyle = 'rgba(8,8,10,0.85)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3 + jag5(i, 1), y - 3); c.lineTo(x + 5, y - 2 + jag5(i, 2)); c.moveTo(x, y); c.lineTo(x - 3, y + 2 + jag5(i, 3)); c.stroke();
      if (s === 2) { c.fillStyle = '#0b0a0a'; poly(c, [[x - 2.5, y - 1.5], [x + 1, y - 3], [x + 3, y], [x + 0.5, y + 2.2], [x - 2.2, y + 1.4]]); c.fill(); c.fillStyle = 'rgba(255,120,40,0.75)'; c.beginPath(); c.arc(x + 0.3, y, 1.3, 0, 7); c.fill();
        c.fillStyle = G5[0]; poly(c, [[x + 3, y - 3.5], [x + 6.5, y - 5 + jag5(i, 4)], [x + 5.5, y - 2.5]]); c.fill(); outline(c, 0.4); }
    } else if (f === 'bloomhost') { // bruised, wilting flesh and ooze; at stage 2 a torn, weeping wound
      c.fillStyle = s === 1 ? 'rgba(52,30,26,0.5)' : 'rgba(70,58,40,0.62)'; c.beginPath(); c.ellipse(x, y, r * 1.4, r * 0.9, jag5(i, 1) * 0.4, 0, 7); c.fill();
      c.strokeStyle = 'rgba(25,10,14,0.8)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - r, y - 1); c.quadraticCurveTo(x, y + 1 + jag5(i, 2), x + r, y - 1.5); c.stroke();
      c.fillStyle = 'rgba(190,220,90,0.85)'; for (const k of [-1, 1]) { const dx = k * r * 0.5 + jag5(i, k + 5); c.beginPath(); c.ellipse(x + dx, y + 2.5, 0.8, 2.2 + s, 0, 0, 7); c.fill(); }
      if (s === 2) { c.fillStyle = '#1a0710'; c.beginPath(); c.ellipse(x, y, 2.4, 1.5, 0.2, 0, 7); c.fill(); c.fillStyle = 'rgba(220,60,70,0.7)'; c.beginPath(); c.ellipse(x, y, 1.2, 0.7, 0.2, 0, 7); c.fill(); }
    } else { // Axiarchs: cracked stone, a chipped corner; at stage 2 a broken seam
      c.strokeStyle = 'rgba(235,240,255,0.75)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - r, y - 1 + jag5(i, 1)); c.lineTo(x - 1, y + jag5(i, 2)); c.lineTo(x + 1.5, y - 2.5); c.lineTo(x + r, y - 1 + jag5(i, 3)); c.moveTo(x - 1, y); c.lineTo(x, y + 3); c.stroke();
      c.strokeStyle = 'rgba(6,6,12,0.85)'; c.lineWidth = 0.5; c.stroke();
      c.fillStyle = '#07070c'; poly(c, [[x + 1.5, y - 2.5], [x + 3, y - 4], [x + 3.4, y - 1.8]]); c.fill();
      if (s === 2) { c.fillStyle = 'rgba(6,6,12,0.85)'; poly(c, [[x - r, y - 3], [x + r * 0.6, y - 4.5], [x + r, y - 3.2], [x - r * 0.4, y - 1.6]]); c.fill(); }
    }
  }
}
function dmgLive5(c, b, t) { // stage 2 only, at the first mark
  if (dmgStage(b) < 2) return;
  const A = (DMG5_AT[facOf(b.fac)] || {})[b.type]; if (!A) return;
  const [x, y] = pt(...A[0]), f = facOf(b.fac), ph = (b.id || 0) * 1.7;
  if (f === 'lastfist') { const k = 0.6 + 0.4 * Math.sin(t * 17 + ph) * Math.sin(t * 7 + ph); c.fillStyle = `rgba(255,140,40,${0.75 * k})`; c.beginPath(); c.moveTo(x - 2.5, y); c.quadraticCurveTo(x - 1.5, y - 5 * k, x + Math.sin(t * 6 + ph), y - 8 * k); c.quadraticCurveTo(x + 1.5, y - 5 * k, x + 2.5, y); c.closePath(); c.fill(); c.fillStyle = `rgba(255,230,150,${0.8 * k})`; c.beginPath(); c.ellipse(x, y - 1.5, 1, 2 * k, 0, 0, 7); c.fill(); }
  else if (f === 'bloomhost') { const q = (t * 0.7 + ph) % 1; c.fillStyle = `rgba(190,220,90,${0.9 * (1 - q)})`; c.beginPath(); c.ellipse(x + 1, y + 3 + q * 9, 0.9, 1.6, 0, 0, 7); c.fill(); }
  else { const on = Math.sin(t * 23 + ph) * Math.sin(t * 9.1 + ph) > 0.1; if (on) { c.strokeStyle = `rgba(${TEAM[b.side] ? TEAM[b.side].glow : '255,255,255'},0.9)`; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 4, y - 1); c.lineTo(x - 1, y); c.lineTo(x + 1.5, y - 2.5); c.stroke(); } }
}
const BART5_ID = new Map();
function bArtKey(fn, T) { let id = BART5_ID.get(fn); if (id === undefined) { id = BART5_ID.size; BART5_ID.set(fn, id); } return '|' + id + T.main + T.hull + T.light + T.glow; } // which art and which colours a cached body was drawn with
