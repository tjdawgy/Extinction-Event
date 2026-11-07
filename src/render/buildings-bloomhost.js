/* ---------- Bloomhost buildings (v2.17): living structures on organic pads ----------
   Original designs: chitin plates, fleshy mounds, membranes and sacs, with the team colour as bioluminescent veins and
   glands. Same rules as Last Fist art: a cached body per tier, a few live parts (pulses), everything below the bar. */
const BHC = { chit: ['#6f5f8c', '#4a3d63', '#2f2742'], flesh: ['#a5566f', '#73374b', '#4d2333'], bone: '#e2d6bf', dark: '#1c1524', skin: '#3a2a3f' };
// a squat organic mound: a curved hump of height h over an ellipse of radius r, shaded left to right
function mound(c, u, v, r, z, h, c0, c1) {
  const [x, y] = pt(u, v, z), rx = r * 1.2247, ry = r * 0.7071;
  c.beginPath(); c.moveTo(x - rx, y); c.ellipse(x, y, rx, ry, 0, Math.PI, 0, true);
  c.bezierCurveTo(x + rx, y - h * 0.9, x + rx * 0.45, y - h, x, y - h);
  c.bezierCurveTo(x - rx * 0.45, y - h, x - rx, y - h * 0.9, x - rx, y);
  const g = c.createLinearGradient(x - rx, 0, x + rx, 0); g.addColorStop(0, c0); g.addColorStop(1, c1);
  c.fillStyle = g; c.fill();
}
// chitin plate bands across a mound: arcs that read as overlapping carapace
function plates(c, u, v, r, z, h, n, col) {
  const [x, y] = pt(u, v, z), rx = r * 1.2247;
  c.strokeStyle = col; c.lineWidth = 1.3;
  for (let i = 1; i <= n; i++) { const k = i / (n + 1); c.beginPath(); c.ellipse(x, y - h * k, rx * Math.sqrt(1 - k * k) * 0.98, h * 0.18 * (1 - k * 0.5), 0, 0.1, Math.PI - 0.1); c.stroke(); }
}
// a curved spike from (u, v, z) leaning out; w: base width
function spike(c, u, v, z, h, w, lean, col) {
  const [x, y] = pt(u, v, z);
  c.fillStyle = col; c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.2 + lean * 0.4, y - h * 0.6, x + lean, y - h); c.quadraticCurveTo(x + w * 0.4 + lean * 0.3, y - h * 0.5, x + w, y); c.closePath(); c.fill();
}
// a glowing sac or egg
function sac(c, u, v, z, r, fill, rgb, a) {
  const [x, y] = pt(u, v, z);
  c.fillStyle = fill; c.beginPath(); c.ellipse(x, y - r * 0.9, r * 0.8, r, 0, 0, 7); c.fill();
  if (rgb) { c.fillStyle = `rgba(${rgb},${a})`; c.beginPath(); c.ellipse(x, y - r * 0.9, r * 0.45, r * 0.62, 0, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(x - r * 0.3, y - r * 1.3, r * 0.18, r * 0.28, -0.4, 0, 7); c.fill();
}
// a vein: a wobbly line through building-local points
function vein(c, pts, col, w) {
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath();
  const p0 = pt(...pts[0]); c.moveTo(p0[0], p0[1]);
  for (let i = 1; i < pts.length; i++) { const a = pt(...pts[i - 1]), b = pt(...pts[i]); c.quadraticCurveTo(a[0] + (b[0] - a[0]) * 0.5 + 2, a[1] + (b[1] - a[1]) * 0.5 - 2, b[0], b[1]); }
  c.stroke();
}
// the creep-like root bed every Bloomhost building grows from (instead of a concrete plinth)
function rootBed(c, half, T, tier) {
  const [x, y] = pt(0, 0, 0), rx = (half + 4) * 1.2247, ry = (half + 4) * 0.7071;
  c.fillStyle = BHC.skin; c.beginPath(); c.ellipse(x, y + 2, rx, ry, 0, 0, 7); c.fill();
  c.fillStyle = BHC.flesh[2]; c.beginPath(); c.ellipse(x, y, rx * 0.92, ry * 0.9, 0, 0, 7); c.fill();
  const n = 5 + tier * 2;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.3; vein(c, [[0, 0, 1], [Math.cos(a) * half * 0.55, Math.sin(a) * half * 0.55, 1], [Math.cos(a + 0.25) * (half + 2), Math.sin(a + 0.25) * (half + 2), 0]], `rgba(${T.glow},${0.18 + tier * 0.06})`, 1.2); }
}
const pulse = (t, ph = 0, sp = 2.4) => 0.5 + 0.5 * Math.sin(t * sp + ph);

// Hive (HQ): a great chitin mound with a glowing core, fleshy lobes at T2, a crown of spines at T3; a spine launcher on top
const HIVEZ = [0, 74, 80, 88]; // launcher height
function hiveBody(c, T, tier) {
  rootBed(c, 44, T, tier);
  if (tier >= 2) for (const [u, v] of [[-28, 22], [26, -26]]) { mound(c, u, v, 14, 0, 28, BHC.flesh[0], BHC.flesh[2]); plates(c, u, v, 14, 0, 28, 2, 'rgba(0,0,0,0.25)'); }
  mound(c, 0, 0, 38, 0, HIVEZ[tier] - 18, BHC.chit[0], BHC.chit[2]);
  plates(c, 0, 0, 38, 0, HIVEZ[tier] - 18, 3 + tier, 'rgba(20,10,30,0.45)');
  mound(c, 2, -2, 22, HIVEZ[tier] - 36, 26, BHC.chit[0], BHC.chit[1]); // upper lobe
  if (tier >= 3) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; spike(c, Math.cos(a) * 30, Math.sin(a) * 30, 30, 26, 4, Math.cos(a) * 6, BHC.bone); }
  for (const [u, v, z] of [[-30, -6, 8], [-10, 30, 6], [24, 16, 10]]) sac(c, u, v, z, 5 + tier, BHC.flesh[1], T.glow, 0.35);
}
function hiveLive(c, T, t, b, tier) {
  const z = HIVEZ[tier], [cx, cy] = pt(0, 0, z * 0.45);
  glow(c, cx, cy, 6 + tier, T.glow, 0.25 + 0.3 * pulse(t, 0, 1.6)); // the core beats
  const [hx, hy] = pt(0, 0, z), a = gunAngle(b, hx, hy, -0.4);
  c.save(); c.translate(hx, hy); c.rotate(a); // spine launcher: a tube of chitin with a glowing throat
  c.fillStyle = BHC.chit[1]; c.beginPath(); c.ellipse(5, 0, 12, 5.5, 0, 0, 7); c.fill();
  c.fillStyle = BHC.bone; c.beginPath(); c.moveTo(14, -3); c.lineTo(22, 0); c.lineTo(14, 3); c.closePath(); c.fill();
  c.fillStyle = `rgba(${T.glow},${0.5 + 0.4 * pulse(t, 1, 5)})`; c.beginPath(); c.arc(13, 0, 2.2, 0, 7); c.fill();
  c.restore();
}
// Goremound (refinery): a bulging digestion mound with a vent that breathes spores
function goreBody(c, T, tier) {
  rootBed(c, 32, T, tier);
  const H = [0, 34, 42, 50][tier];
  mound(c, 0, 0, 26, 0, H, BHC.flesh[0], BHC.flesh[2]);
  plates(c, 0, 0, 26, 0, H, 2 + tier, 'rgba(40,10,20,0.35)');
  if (tier >= 2) mound(c, 16, 16, 10, 0, 22, BHC.flesh[1], BHC.flesh[2]);
  if (tier >= 3) mound(c, -18, 14, 9, 0, 18, BHC.flesh[1], BHC.flesh[2]);
  cyl(c, 0, -6, 6, H - 6, 10, BHC.chit[1], BHC.chit[2], BHC.dark); // the vent
  for (const [u, v] of [[-14, -10], [10, 6], [-6, 16]].slice(0, tier + 1)) sac(c, u, v, 6, 4, '#c98a4a', null, 0);
}
function goreLive(c, T, t, b, tier) { const H = [0, 34, 42, 50][tier], [x, y] = pt(0, -6, H + 4); glow(c, x, y, 3, T.glow, 0.25 + 0.35 * pulse(t, 0, 3)); }
// Pulse Organ (reactor): a translucent heart on a stalk, veins brightening with tier
function pulseBody(c, T, tier) {
  rootBed(c, 30, T, tier);
  cone(c, 0, 0, 13, 7, 0, 22, BHC.chit[1], BHC.chit[2], null); // stalk
  for (let i = 0; i < 3 + tier; i++) { const a = i / (3 + tier) * Math.PI * 2; vein(c, [[0, 0, 20], [Math.cos(a) * 14, Math.sin(a) * 14, 8], [Math.cos(a) * 26, Math.sin(a) * 26, 0]], `rgba(${T.glow},0.45)`, 1.6); }
  if (tier >= 2) for (const [u, v] of [[-18, 12], [16, -16]]) sac(c, u, v, 2, 6, BHC.flesh[1], T.glow, 0.4);
  if (tier >= 3) for (const [u, v] of [[18, 14], [-16, -18]]) spike(c, u, v, 0, 22, 3, 0, BHC.bone);
}
function pulseLive(c, T, t, b, tier) {
  const k = pulse(t, 0, 3.2), r = [0, 11, 12.5, 14][tier] * (0.94 + 0.08 * k), [x, y] = pt(0, 0, 22 + r);
  c.fillStyle = BHC.flesh[1]; c.beginPath(); c.ellipse(x, y, r * 0.95, r, 0, 0, 7); c.fill();
  c.fillStyle = `rgba(${T.glow},${0.35 + 0.45 * k})`; c.beginPath(); c.ellipse(x, y, r * 0.55, r * 0.62, 0, 0, 7); c.fill();
  glow(c, x, y, 3 + tier, T.glow, 0.2 + 0.3 * k);
}
// Hatchery (habitat): a nest of eggs in a fleshy cradle; more and bigger eggs per tier
const HATCH = [null, [[-8, 6], [8, -6], [6, 10]], [[-10, 8], [10, -8], [8, 12], [-12, -10]], [[-12, 10], [12, -10], [10, 14], [-14, -12], [0, 0]]];
function hatchBody(c, T, tier) {
  rootBed(c, 32, T, tier);
  mound(c, 0, 0, 28, 0, 12, BHC.flesh[1], BHC.flesh[2]);
  for (const [u, v] of HATCH[tier]) sac(c, u, v, 10, 6 + tier, '#d9c7a6', T.glow, 0.28);
  if (tier >= 3) for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.6; spike(c, Math.cos(a) * 26, Math.sin(a) * 26, 6, 18, 3, -Math.cos(a) * 4, BHC.chit[0]); }
}
function hatchLive(c, T, t, b, tier) { const [u, v] = HATCH[tier][0], [x, y] = pt(u, v, 18); glow(c, x, y, 2.5, T.glow, 0.15 + 0.3 * pulse(t, 2, 1.8)); }
// Larva Pit (barracks): a ringed pit with mandible-like ribs; larvae glow in its throat
function larvaBody(c, T, tier) {
  rootBed(c, 32, T, tier);
  mound(c, 0, 0, 28, 0, 14, BHC.chit[1], BHC.chit[2]);
  const [x, y] = pt(0, 0, 14); c.fillStyle = BHC.dark; c.beginPath(); c.ellipse(x, y, 16 * 1.2247, 16 * 0.7071, 0, 0, 7); c.fill(); // the pit
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; spike(c, Math.cos(a) * 20, Math.sin(a) * 20, 12, 22 + (i % 2) * 6, 3, -Math.cos(a) * 7, BHC.bone); }
  if (tier >= 2) mound(c, -22, 20, 8, 0, 16, BHC.flesh[0], BHC.flesh[2]);
}
function larvaLive(c, T, t, b, tier) { const [x, y] = pt(0, 0, 14); c.fillStyle = `rgba(${T.glow},${0.25 + 0.3 * pulse(t, 0, 2.2)})`; c.beginPath(); c.ellipse(x, y, 12, 6, 0, 0, 7); c.fill(); }
// Evolution Chamber (factory): a long ribbed cocoon split by a glowing seam, where heavy organisms grow
function evoBody(c, T, tier) {
  rootBed(c, 36, T, tier);
  mound(c, -6, 6, 30, 0, 40, BHC.chit[0], BHC.chit[2]);
  plates(c, -6, 6, 30, 0, 40, 4, 'rgba(20,10,30,0.4)');
  for (const k of [-16, 0, 16]) { const [x, y] = pt(-6 + k * 0.5, 6 - k * 0.5, 0); c.strokeStyle = BHC.bone; c.lineWidth = 2.2; c.beginPath(); c.ellipse(x, y - 18, 7, 22, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); } // ribs
  if (tier >= 2) mound(c, 22, -18, 11, 0, 24, BHC.flesh[0], BHC.flesh[2]);
  if (tier >= 3) for (const [u, v] of [[24, 18], [-28, -22]]) spike(c, u, v, 0, 26, 3.5, 0, BHC.bone);
}
function evoLive(c, T, t, b, tier) { const [x, y] = pt(-6, 6, 22); c.strokeStyle = `rgba(${T.glow},${0.35 + 0.4 * pulse(t, 0, 1.4)})`; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - 8, y - 16); c.quadraticCurveTo(x, y - 2, x + 10, y + 10); c.stroke(); }
// Maw (turret): a fanged mouth rising out of the ground on a fleshy neck; its jaws turn to the target
const MAWZ = [0, 26, 28, 31];
function mawBody(c, T, tier) {
  rootBed(c, 26, T, tier);
  mound(c, 0, 0, 20, 0, 12, BHC.flesh[1], BHC.flesh[2]);
  if (tier >= 2) for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; spike(c, Math.cos(a) * 18, Math.sin(a) * 18, 6, 14 + tier * 2, 2.5, Math.cos(a) * 3, BHC.chit[0]); }
  cone(c, 0, 0, 10, 8, 10, MAWZ[tier] - 12, BHC.flesh[0], BHC.flesh[2], null); // the neck
}
function mawLive(c, T, t, b, tier) {
  const [hx, hy] = pt(0, 0, MAWZ[tier]), a = gunAngle(b, hx, hy, -0.3), open = 0.25 + 0.2 * pulse(t, 0, b && b.aim ? 9 : 1.5);
  c.save(); c.translate(hx, hy); c.rotate(a);
  const L0 = 13 + tier * 1.5;
  c.fillStyle = BHC.chit[1];
  c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(4, -9 - open * 6, L0, -3 - open * 4); c.lineTo(L0 - 3, 0); c.closePath(); c.fill(); // upper jaw
  c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(4, 9 + open * 6, L0, 3 + open * 4); c.lineTo(L0 - 3, 0); c.closePath(); c.fill(); // lower jaw
  c.fillStyle = `rgba(${T.glow},0.75)`; c.beginPath(); c.ellipse(3, 0, 4, 1.6 + open * 3, 0, 0, 7); c.fill(); // throat
  c.fillStyle = BHC.bone; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x = 2 + i * 4; c.beginPath(); c.moveTo(x, s * (2 + open * 3)); c.lineTo(x + 1.5, s * 0.5); c.lineTo(x + 3, s * (2 + open * 3)); c.fill(); }
  c.restore();
}
// Bloomspire (techlab): a tall stalk of membrane chambers where flyers grow; more chambers per tier
const SPIREZ = [0, 74, 80, 88];
function spireBody(c, T, tier) {
  rootBed(c, 30, T, tier);
  cone(c, 0, 0, 16, 6, 0, SPIREZ[tier] - 14, BHC.chit[0], BHC.chit[2], null);
  plates(c, 0, 0, 16, 0, SPIREZ[tier] - 14, 4, 'rgba(20,10,30,0.4)');
  const pods = [[12, -4, 22], [-12, 6, 36], [10, 8, 50], [-8, -10, 62]].slice(0, 1 + tier);
  for (const [u, v, z] of pods) sac(c, u, v, z, 7, 'rgba(160,120,190,0.75)', T.glow, 0.25);
  if (tier >= 3) for (const s of [-1, 1]) spike(c, s * 14, -s * 14, 6, 30, 3, s * 4, BHC.bone);
}
function spireLive(c, T, t, b, tier) { const [x, y] = pt(0, 0, SPIREZ[tier] - 6); glow(c, x, y, 4 + tier, T.glow, 0.3 + 0.35 * pulse(t, 0, 2)); }
/* Brood Mound (v2.33): a mound of eggs in a membrane cradle where Mites hatch; T2 a second clutch and a feeding sac, T3 a
   swollen acid gland and a crown of spines. The eggs glow brighter as the next clutch is due. */
const MOUNDE = [null, [[-10, 6, 5], [6, -8, 5], [10, 8, 4.5], [-4, -12, 4]], [[-12, 8, 6], [6, -10, 6], [12, 8, 5.5], [-6, -14, 5], [-16, -4, 4.5], [2, 14, 4.5]],
  [[-12, 8, 6.5], [6, -10, 6.5], [12, 8, 6], [-6, -14, 5.5], [-16, -4, 5], [2, 14, 5], [16, -4, 4.5]]];
function moundBody(c, T, tier) {
  rootBed(c, 32, T, tier);
  if (tier >= 2) { mound(c, 22, -20, 10, 0, 18, BHC.flesh[0], BHC.flesh[2]); sac(c, 22, -20, 14, 6, BHC.flesh[1], T.glow, 0.3); } // the feeding sac
  mound(c, 0, 0, 26, 0, 12 + tier * 3, BHC.flesh[1], BHC.flesh[2]); // the membrane cradle
  plates(c, 0, 0, 26, 0, 12 + tier * 3, 2, 'rgba(40,10,20,0.35)');
  if (tier >= 3) { mound(c, -18, -22, 9, 0, 20, '#8fbf4a', '#3f6a1c'); for (const [u, v] of [[-22, -26], [-14, -18]]) sac(c, u, v, 14, 3, '#b6ff5a', '182,255,90', 0.5); } // the acid gland, at the back
  for (const [u, v, r] of MOUNDE[tier]) sac(c, u, v, 10 + tier * 3, r, '#d9c7a6', null, 0);
  if (tier >= 3) for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.4; spike(c, Math.cos(a) * 28, Math.sin(a) * 28, 4, 20, 3, -Math.cos(a) * 5, BHC.bone); }
}
function moundLive(c, T, t, b, tier) {
  const due = b && game && b.mt !== undefined ? clamp(1 - (b.mt - game.t) / MOUND.every, 0, 1) : 0.4; // eggs brighten toward the next clutch
  for (const [u, v, r] of MOUNDE[tier]) { const [x, y] = pt(u, v, 10 + tier * 3); c.fillStyle = `rgba(${T.glow},${0.12 + 0.45 * due * (0.7 + 0.3 * pulse(t, u, 3))})`; c.beginPath(); c.ellipse(x, y - r * 0.9, r * 0.42, r * 0.58, 0, 0, 7); c.fill(); }
  if (tier >= 3) { const [x, y] = pt(-18, -22, 22); glow(c, x, y, 2.5, '182,255,90', 0.3 + 0.35 * pulse(t, 0, 2)); }
}
/* Rootheart (v2.33): a living heart on a knot of roots that run out into the creep; T2 thicker roots with glowing veins
   and seed pods, T3 a thorned root crown. The heart beats. */
const RHZ = [0, 22, 26, 30]; // heart height
function rootheartBody(c, T, tier) {
  rootBed(c, 32, T, tier);
  const n = 4 + tier * 2;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.2, r1 = 30 + (i % 2) * 3; vein(c, [[Math.cos(a) * 6, Math.sin(a) * 6, 10], [Math.cos(a + 0.3) * 18, Math.sin(a + 0.3) * 18, 3], [Math.cos(a + 0.1) * r1, Math.sin(a + 0.1) * r1, 0]], tier >= 2 ? '#6b4a33' : '#5a3d2b', 2.6 + tier * 0.4); } // roots
  if (tier >= 2) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.2; vein(c, [[Math.cos(a) * 8, Math.sin(a) * 8, 10], [Math.cos(a + 0.3) * 18, Math.sin(a + 0.3) * 18, 3.5]], `rgba(${T.glow},0.5)`, 1); }
  cone(c, 0, 0, 13, 8, 0, RHZ[tier] - 8, '#6b4a33', '#3a281c', null); // the root knot
  if (tier >= 2) for (const [u, v] of [[-20, 14], [18, -16]]) sac(c, u, v, 2, 5, '#9c7a4a', T.glow, 0.3); // seed pods
  if (tier >= 3) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; spike(c, Math.cos(a) * 14, Math.sin(a) * 14, RHZ[tier] - 10, 18, 2.5, Math.cos(a) * 6, '#4a3424'); } // thorn crown
}
function rootheartLive(c, T, t, b, tier) {
  const k = pulse(t, 0, 3.6), r = (7 + tier) * (0.92 + 0.1 * k), [x, y] = pt(0, 0, RHZ[tier] - 8 + r * 0.75); // it sits in the root knot
  c.fillStyle = BHC.flesh[0]; c.beginPath(); c.ellipse(x, y, r, r * 1.05, 0, 0, 7); c.fill();
  c.fillStyle = `rgba(${T.glow},${0.3 + 0.5 * k})`; c.beginPath(); c.ellipse(x, y, r * 0.5, r * 0.6, 0, 0, 7); c.fill();
  glow(c, x, y, 3 + tier, T.glow, 0.15 + 0.25 * k);
}
const BART_BH = {
  hq: [hiveBody, hiveLive], refinery: [goreBody, goreLive], reactor: [pulseBody, pulseLive], habitat: [hatchBody, hatchLive],
  barracks: [larvaBody, larvaLive], factory: [evoBody, evoLive], turret: [mawBody, mawLive], techlab: [spireBody, spireLive],
  sigA: [moundBody, moundLive], sigB: [rootheartBody, rootheartLive], // v2.33
};
