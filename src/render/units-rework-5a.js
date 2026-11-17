/* ---------- Faction rework art, batch 5a (v2.89; docs/FACTION_REWORK.md "Batch 5a") ----------
   Every Last Fist unit redrawn as a future frontier army: powered-armour infantry (angular plates, glowing visor slits,
   pauldrons, backpack power units, gauss rifles with coil rings), heavy angular vehicles and walkers (exposed pistons,
   sensor masts, stencil marks, scorched and patched plates) and thruster aircraft (engine glow, nacelles, hard-edged hulls;
   no rotors). Big armour panels carry the team colour. Art and text only: the SIM is untouched, so every muzzle, bay and
   beam point below sits on the SIM's own MUZ table (src/sim/trees-balance.js) where shots already start.
   Ground units are cached as poses (the sprite cache), as before; aircraft draw live. */
const GM = ['#6c7684', '#434b58', '#272d37'], GMD = '#161a21', SCORCH = 'rgba(20,16,12,0.55)', THR = '170,225,255', STEN = 'rgba(235,240,245,0.75)';
const tgrad = (c, T, y0, y1) => lgrad(c, 0, y0, 0, y1, [T.light, T.main, T.hull]);   // a team armour panel, lit from above
const ggrad = (c, y0, y1) => lgrad(c, 0, y0, 0, y1, GM);                               // gunmetal frame
function fp(c, pts, fill, lw = 0.9) { c.fillStyle = fill; poly(c, pts); c.fill(); outline(c, lw); } // filled, outlined polygon
function slit(c, T, x, y, w, h, a = 1) { // a glowing visor slit in the side's glow
  c.fillStyle = '#0a0d12'; c.fillRect(x - 0.4, y - 0.4, w + 0.8, h + 0.8);
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},${0.35 * a})`; c.fillRect(x - 1, y - 1, w + 2, h + 2);
  c.fillStyle = `rgba(${T.glow},${0.95 * a})`; c.fillRect(x, y, w, h); c.fillStyle = `rgba(255,255,255,${0.75 * a})`; c.fillRect(x + w * 0.55, y, w * 0.3, h * 0.6);
  c.globalCompositeOperation = 'source-over';
}
function coils(c, T, xs, y, h, rk = 0) { // gauss coil rings along a barrel, glowing
  for (const x of xs) { c.fillStyle = GM[2]; c.fillRect(x - 0.7 - rk, y - h / 2 - 0.4, 1.4, h + 0.8); c.fillStyle = `rgba(${T.glow},0.9)`; c.fillRect(x - 0.35 - rk, y - h / 2, 0.7, h); }
}
function scorch(c, x, y, rx, ry) { c.fillStyle = SCORCH; c.beginPath(); c.ellipse(x, y, rx, ry, 0.3, 0, 7); c.fill(); }
function chips(c, pts) { c.fillStyle = 'rgba(220,226,232,0.55)'; for (const [x, y] of pts) c.fillRect(x, y, 0.9, 0.6); } // chipped paint on an edge
function stencil(c, x, y, n) { c.fillStyle = STEN; for (let i = 0; i < n; i++) c.fillRect(x + i * 1.6, y, 1, 1.6); } // a stencilled serial
function thrust(c, x, y, len, w, a, dir = 0) { // an engine jet from (x, y): a tapered flame, pale blue at the edge, white-hot at the root; dir 0 → back (−x), 1 → down
  if (a <= 0.02) return;
  const ex = dir ? x : x - len, ey = dir ? y + len : y, g = c.createLinearGradient(x, y, ex, ey);
  g.addColorStop(0, `rgba(255,255,255,${0.95 * a})`); g.addColorStop(0.3, `rgba(${THR},${0.8 * a})`); g.addColorStop(1, `rgba(${THR},0)`);
  c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath();
  if (dir) { c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.8, y + len * 0.5, x, ey); c.quadraticCurveTo(x + w * 0.8, y + len * 0.5, x + w, y); }
  else { c.moveTo(x, y - w); c.quadraticCurveTo(x - len * 0.5, y - w * 0.8, ex, y); c.quadraticCurveTo(x - len * 0.5, y + w * 0.8, x, y + w); }
  c.closePath(); c.fill(); c.globalCompositeOperation = 'source-over';
}
// an armoured leg: thigh and shin as plated strokes, a knee cap and a boot; st = walk phase (−1…1)
function aLeg(c, T, hx, hy, st, L, w, near) {
  const fx = hx + st * L * 0.32, kx = hx + st * L * 0.12 + 1.4, ky = hy * 0.48, lift = Math.max(0, -st) * 1.2;
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = OUTL; c.lineWidth = w + 1.4; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, -1.6 - lift); c.stroke();
  c.strokeStyle = near ? GM[1] : GM[2]; c.lineWidth = w; c.stroke();
  c.strokeStyle = near ? T.main : T.hull; c.lineWidth = w * 0.62; c.beginPath(); c.moveTo(kx + 0.2, ky + 0.6); c.lineTo(fx + (kx - fx) * 0.25, -2.6 - lift + (ky + 2.6) * 0.25); c.stroke(); // shin greave
  c.lineCap = 'butt';
  c.fillStyle = near ? GM[0] : GM[1]; c.beginPath(); c.arc(kx + 0.5, ky, w * 0.42, 0, 7); c.fill(); outline(c, 0.5);   // knee cap
  c.fillStyle = near ? GM[2] : GMD; rr(c, fx - w * 0.55, -2.2 - lift, w * 1.6, 2.2, 0.7); c.fill(); outline(c, 0.5);   // boot
}

/* ---------------- infantry ---------------- */
// Marine (rifle): powered armour, a big team pauldron, a backpack power unit, a gauss rifle; its tip at MUZ.rifle (10, −13)
function dMarine(c, T, u) {
  const st = u.moving ? Math.sin((u.anim || 0) * 11) : 0, rk = (u.recoil || 0) * 1.5;
  aLeg(c, T, -0.8, -9, -st, 9, 3, false);
  // backpack power unit with a glowing cell and a vent
  fp(c, [[-8.4, -20], [-4, -20.6], [-3.6, -10.5], [-8, -11]], ggrad(c, -21, -10), 0.8);
  c.fillStyle = `rgba(${T.glow},0.9)`; c.fillRect(-7.4, -18, 1.4, 4.6); c.fillStyle = GMD; c.fillRect(-8.2, -12.6, 3.6, 1);
  aLeg(c, T, 0.8, -9, st, 9, 3.2, true);
  // torso: gunmetal waist, a big team chest plate
  fp(c, [[-4.2, -9.8], [3.6, -9.8], [3.2, -12], [-4, -12]], GM[2], 0.7);
  fp(c, [[-4.4, -11.5], [-4.6, -18.8], [-1.2, -20.4], [4.4, -19.4], [5, -14.4], [3.4, -11.5]], tgrad(c, T, -20.4, -11.5), 0.9);
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-1.5, -19.6); c.lineTo(0.6, -12); c.stroke(); // plate seam
  stencil(c, 1.6, -15.4, 2);
  // helmet: an angular faceplate with a visor slit
  fp(c, [[-3.4, -20.2], [-3.2, -24.4], [0.4, -25.8], [3.6, -24.6], [4.6, -21.6], [2.6, -20]], ggrad(c, -26, -20), 0.8);
  fp(c, [[-3.2, -24.4], [0.4, -25.8], [3.6, -24.6], [2.8, -23.6], [-2.6, -23.4]], T.main, 0.5); // team crest band
  slit(c, T, 0.8, -22.6, 3.4, 1.1);
  // the gauss rifle: a long rail barrel with coil rings; stock against the shoulder
  fp(c, [[-3.4 - rk, -14.6], [3 - rk, -14.6], [3 - rk, -12.1], [-3 - rk, -11.6]], ggrad(c, -15, -11.5), 0.6);
  c.fillStyle = GM[0]; c.fillRect(2 - rk, -13.9, 8 - 0.0, 1.5); c.fillStyle = GMD; c.fillRect(2 - rk, -12.6, 7.6, 0.6);
  coils(c, T, [4.4, 6.4, 8.4], -13.2, 2.6, rk);
  // the near arm and pauldron
  c.strokeStyle = OUTL; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-1.2, -17.6); c.lineTo(0.4, -13.4); c.lineTo(3 - rk, -13.2); c.stroke();
  c.strokeStyle = GM[1]; c.lineWidth = 2; c.stroke(); c.lineCap = 'butt';
  fp(c, [[-4.4, -16.6], [-4.8, -19.6], [-2.2, -21.2], [1.4, -20.4], [1.6, -17.8], [-1, -16]], tgrad(c, T, -21.2, -16), 0.8); // pauldron
  rim(c, -3.6, -20.6, 0.6);
  chips(c, [[-4.2, -17.4], [0.6, -20.1]]);
}
// Heavy: a bulkier exosuit, a shoulder-mounted rocket rack (its mouths at MUZ.heavy (12, −27)), thick legs, a sealed helm
function dHeavy5(c, T, u) {
  const st = u.moving ? Math.sin((u.anim || 0) * 8) * 1.1 : 0, rk = (u.recoil || 0) * 2;
  aLeg(c, T, -1.6, -11, -st, 11, 4.4, false);
  // the backpack reactor with twin exhausts
  fp(c, [[-11, -26], [-5.6, -27], [-5, -13], [-10.4, -13.6]], ggrad(c, -27, -13), 0.9);
  c.fillStyle = RUSTO; c.fillRect(-10.2, -24, 1.6, 6); c.fillStyle = `rgba(${T.glow},0.85)`; c.fillRect(-8.2, -23.6, 1.6, 7);
  c.fillStyle = GMD; for (const x of [-10.6, -8.2]) c.fillRect(x, -28.6, 1.8, 2);
  aLeg(c, T, 1.6, -11, st, 11, 4.8, true);
  // torso: a broad team carapace
  fp(c, [[-6.6, -11.2], [5.8, -11.2], [5.4, -14], [-6.4, -14]], GM[2], 0.8);
  fp(c, [[-7, -13.4], [-7.6, -23], [-3, -25.8], [5.6, -24.6], [7.4, -18.6], [5.6, -13.4]], tgrad(c, T, -25.8, -13.4), 1);
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-2, -25); c.lineTo(-0.6, -13.6); c.moveTo(-6.8, -18.6); c.lineTo(7, -18.4); c.stroke();
  scorch(c, 3.6, -16, 2, 1.2); stencil(c, -5.6, -16.4, 2);
  // the shoulder rocket rack: a boxy launcher over the shoulders, three glowing tubes, its mouths at x 12, y −27
  fp(c, [[-7.4 - rk, -31.6], [10.4 - rk, -31.6], [12 - rk, -30], [12 - rk, -25.2], [-7.4 - rk, -25.6]], ggrad(c, -31.6, -25.2), 0.9);
  fp(c, [[-7.4 - rk, -31.6], [3.4 - rk, -31.6], [3.4 - rk, -29.6], [-7.4 - rk, -29.6]], T.main, 0.5);
  c.fillStyle = GMD; for (const y of [-29.6, -27.8, -26.2]) c.fillRect(10.4 - rk, y - 0.5, 1.6, 1.1);
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.8)`; for (const y of [-29.6, -27.8, -26.2]) c.fillRect(11.2 - rk, y - 0.3, 0.6, 0.6); c.globalCompositeOperation = 'source-over';
  c.fillStyle = HAZ; c.fillRect(6.4 - rk, -29.4, 1, 3.4);
  // the helm: sealed, sunk forward between the shoulders under the rack, a wide visor
  fp(c, [[1, -20.6], [1.4, -25], [6, -25.4], [8.2, -23.2], [7.8, -20.4]], ggrad(c, -25.4, -20.4), 0.8);
  slit(c, T, 3.6, -23.6, 4, 1.2);
  // the near arm with a forearm gun pod, and a big pauldron
  c.strokeStyle = OUTL; c.lineWidth = 4.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-3, -21.6); c.lineTo(-0.6, -15.4); c.lineTo(4.4, -15.2); c.stroke();
  c.strokeStyle = GM[1]; c.lineWidth = 3; c.stroke(); c.lineCap = 'butt';
  fp(c, [[2.6, -16.8], [8.4, -16.8], [8.6, -14], [2.6, -13.6]], ggrad(c, -17, -13.5), 0.6);
  fp(c, [[-8.6, -19], [-9, -23.8], [-4.6, -26.2], [0.6, -25.2], [0.8, -21.2], [-3.6, -18.6]], tgrad(c, T, -26.2, -18.6), 0.9); // pauldron
  rim(c, -7.6, -24.6, -1.2); chips(c, [[-8.4, -20], [-1, -25.4], [6.4, -21]]);
}
// Sniper: a lean scout in a stealth cloak, a single big optic, a very long gauss rifle (tip at MUZ.sniper (17, −14))
function dSniper5(c, T, u) {
  const st = u.moving ? Math.sin((u.anim || 0) * 10) : 0, rk = (u.recoil || 0) * 2;
  aLeg(c, T, -1, -9, -st, 9, 2.4, false);
  // the stealth cloak: a long angular cape, team-dark with a light edge, a ragged hem
  c.fillStyle = lgrad(c, -10, -22, -2, -2, [T.hull, '#1b2129']);
  c.beginPath(); c.moveTo(-2.4, -21.4); c.lineTo(-9.4, -14); c.lineTo(-11.2, -3.6); c.lineTo(-9.4, -5.2); c.lineTo(-8, -2.8); c.lineTo(-6.4, -5.6); c.lineTo(-4.6, -3.4); c.lineTo(-2.4, -8.4); c.lineTo(1, -10); c.lineTo(1.4, -20); c.closePath(); c.fill(); outline(c, 0.8);
  c.strokeStyle = `rgba(${T.glow},0.35)`; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-2.4, -21.4); c.lineTo(-9.4, -14); c.lineTo(-11.2, -3.6); c.stroke();
  aLeg(c, T, 1, -9, st, 9, 2.6, true);
  // a slim armoured torso, team plate
  fp(c, [[-3, -9.6], [2.8, -9.6], [3.6, -18.4], [0.6, -20.4], [-3, -19.2]], tgrad(c, T, -20.4, -9.6), 0.8);
  c.fillStyle = GM[2]; c.fillRect(-3, -12.2, 6.2, 1.2);
  // the head: a narrow helm with one big round optic and an antenna
  fp(c, [[-2.6, -20], [-2.6, -24.6], [0.8, -26.2], [3.4, -24.4], [3.4, -20.6]], ggrad(c, -26.4, -20), 0.8);
  c.strokeStyle = GM[0]; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-2, -25); c.lineTo(-4.6, -29.4); c.stroke();
  c.fillStyle = '#0a0d12'; c.beginPath(); c.arc(2.4, -22.6, 1.9, 0, 7); c.fill();
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.45)`; c.beginPath(); c.arc(2.4, -22.6, 2.6, 0, 7); c.fill(); c.fillStyle = `rgba(${T.glow},1)`; c.beginPath(); c.arc(2.4, -22.6, 1.2, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  // the long gauss rifle: a thin rail with four coils, a scope, a bipod
  c.fillStyle = ggrad(c, -15.2, -12.8); rr(c, -6 - rk, -15.2, 23.2, 2, 0.6); c.fill(); outline(c, 0.6);
  fp(c, [[-7.4 - rk, -15.6], [-2 - rk, -15.4], [-2 - rk, -12.4], [-6.6 - rk, -12]], GM[1], 0.5); // stock
  c.fillStyle = GMD; rr(c, 0.6 - rk, -18, 6.6, 2, 0.8); c.fill(); c.fillStyle = `rgba(${T.glow},0.95)`; c.fillRect(6.6 - rk, -17.6, 0.8, 1.2); // scope
  coils(c, T, [8.6, 10.8, 13, 15.2], -14.2, 3, rk);
  c.strokeStyle = GM[2]; c.lineWidth = 0.7; c.beginPath(); c.moveTo(11 - rk, -13.2); c.lineTo(13 - rk, -8.4); c.moveTo(11 - rk, -13.2); c.lineTo(9.4 - rk, -8.4); c.stroke(); // bipod
  c.strokeStyle = OUTL; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-0.4, -17.6); c.lineTo(1.6, -14.6); c.lineTo(4.6 - rk, -14.6); c.stroke(); c.strokeStyle = GM[1]; c.lineWidth = 1.6; c.stroke(); c.lineCap = 'butt';
  fp(c, [[-2.8, -17], [-3, -19.8], [-0.4, -21], [1.4, -19.6], [0.8, -17]], T.main, 0.6); // small pauldron
}

/* ---------------- vehicles and walkers ---------------- */
function treads(c, x0, x1, y0, y1, sp, wheels) { // a track run: dark belt, moving cleats (5 apart, so a pose cycle loops), road wheels
  const h = y1 - y0, L = x1 - x0;
  c.fillStyle = '#14181f'; rr(c, x0, y0, L, h, h / 2); c.fill(); outline(c, 0.9);
  c.fillStyle = GM[1]; for (let i = 0; i < Math.ceil(L / 5); i++) { const x = x0 + 2 + ((i * 5 + sp) % L + L) % L; if (x < x1 - 2) c.fillRect(x, y0, 1.4, 1.3); }
  for (const x of wheels) { c.fillStyle = GM[1]; c.beginPath(); c.arc(x, y0 + h / 2 + 0.4, h * 0.3, 0, 7); c.fill(); c.fillStyle = GM[0]; c.beginPath(); c.arc(x - 0.4, y0 + h / 2, h * 0.12, 0, 7); c.fill(); }
}
// Tank: a heavy angular battle tank, team armour skirts over its tracks, a long gauss cannon (tip at MUZ.tank (27, −18))
function dTank5(c, T, u) {
  const rk = (u.recoil || 0) * 4, sp = u.moving ? (u.anim || 0) * 30 : 0;
  treads(c, -22, 21, -8.6, 0, sp, [-17, -10, -3, 4, 11, 17]);
  // exhaust stacks and a sensor mast at the back
  c.fillStyle = GM[2]; c.fillRect(-21, -19, 2.4, 6); c.fillRect(-18.2, -18, 2.4, 5); c.fillStyle = GMD; c.fillRect(-21, -19.6, 2.4, 1); c.fillRect(-18.2, -18.6, 2.4, 1);
  c.strokeStyle = GM[0]; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-9, -24); c.lineTo(-11.4, -33); c.stroke();
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.9)`; c.beginPath(); c.arc(-11.5, -33.2, 1, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  // hull: a gunmetal wedge with a sloped glacis
  fp(c, [[-22, -9], [-21, -15], [12, -16], [24, -10.5], [21, -8]], ggrad(c, -16, -8), 1);
  // the team armour skirt over the tracks: the biggest panel, with a hazard band at the nose
  fp(c, [[-23, -5.2], [-22.4, -11.6], [16, -12.4], [23.6, -8.6], [21.4, -5]], tgrad(c, T, -12.4, -5), 1);
  c.save(); c.beginPath(); poly(c, [[16, -12.4], [23.6, -8.6], [21.4, -5], [15, -5.2]]); c.clip(); c.fillStyle = HAZ; c.fillRect(14, -13, 11, 9); c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.2;
  for (let i = -2; i < 4; i++) { c.beginPath(); c.moveTo(14 + i * 3, -4); c.lineTo(19 + i * 3, -13); c.stroke(); } c.restore();
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.6; c.beginPath(); for (const x of [-12, -1, 9]) { c.moveTo(x, -11.8); c.lineTo(x - 0.4, -5.2); } c.stroke();
  rim(c, -21.6, -11.4, 15); stencil(c, -19, -9.4, 3); scorch(c, 4, -8, 3, 1.4); chips(c, [[-22, -10], [12, -12.2], [-6, -11.8]]);
  c.fillStyle = '#5c6a76'; rr(c, -6, -10.6, 5, 3.6, 0.6); c.fill(); outline(c, 0.5); // a patched plate
  // the gauss cannon: a long rail barrel with coil rings, a muzzle block at the tip
  c.fillStyle = ggrad(c, -19.8, -16.2); c.fillRect(6 - rk, -19.8, 19, 3.4); c.strokeStyle = OUTL; c.lineWidth = 0.8; c.strokeRect(6 - rk, -19.8, 19, 3.4);
  coils(c, T, [12, 15, 18], -18.1, 4.4, rk);
  fp(c, [[23 - rk, -20.8], [27.4 - rk, -20.4], [27.4 - rk, -15.8], [23 - rk, -15.4]], GM[2], 0.7);
  // the turret: angular, a team top plate, a commander's sight with a visor slit
  fp(c, [[-12, -15.6], [-10, -22.4], [-3, -24.4], [8, -23.6], [11.4, -18], [9, -15.6]], ggrad(c, -24.4, -15.6), 1);
  fp(c, [[-10, -22.4], [-3, -24.4], [8, -23.6], [9.6, -20.6], [-10.6, -19.8]], tgrad(c, T, -24.4, -19.8), 0.8);
  rim(c, -8, -23.6, 7);
  fp(c, [[0, -24], [1, -27], [6, -27], [6.6, -24]], GM[1], 0.6); slit(c, T, 3, -26, 3, 0.9);
  stencil(c, -7, -18.4, 3);
}
// Artillery: a tracked gauss howitzer. u.dpk 0 (packed) … 1 (deployed): four piston stabilisers swing down; the barrel
// (pivot (−4, −18), tip near MUZ.artillery (28, −31)) carries coil rings
function dArt5(c, T, u) {
  const rk = (u.recoil || 0) * 5, k = u.dpk || 0, e = 1 - (1 - k) * (1 - k);
  const leg = (px, py, s, near) => {
    const a0 = s > 0 ? Math.PI + 0.12 : -0.12, a1 = s > 0 ? 0.72 : Math.PI - 0.72, a = a0 + (a1 - a0) * e, L1 = 13;
    const fx = px + Math.cos(a) * L1, fy = py + Math.sin(a) * L1;
    c.lineCap = 'round'; c.strokeStyle = OUTL; c.lineWidth = near ? 4.2 : 3.4; c.beginPath(); c.moveTo(px, py); c.lineTo(fx, fy); c.stroke();
    c.strokeStyle = near ? GM[1] : GM[2]; c.lineWidth = near ? 3 : 2.4; c.stroke();
    c.strokeStyle = '#d9dee6'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(px, py); c.lineTo(px + (fx - px) * 0.55, py + (fy - py) * 0.55); c.stroke(); // piston rod
    c.lineCap = 'butt';
    if (e > 0.6) { c.fillStyle = near ? GM[2] : GMD; rr(c, fx - 3.5, fy - 1.4, 7, 2.6, 1); c.fill(); outline(c, 0.5); }
  };
  leg(-17, -9, -1, false); leg(13, -9, 1, false);
  // the barrel: a long gauss tube with coils and a muzzle block
  c.save(); c.translate(-4, -18); c.rotate(-0.39 - e * 0.08);
  c.fillStyle = ggrad(c, -2, 2); c.fillRect(-4 - rk, -1.8, 35, 3.6); c.strokeStyle = OUTL; c.lineWidth = 0.8; c.strokeRect(-4 - rk, -1.8, 35, 3.6);
  coils(c, T, [9, 13, 17, 21, 25], 0, 4.6, rk);
  fp(c, [[29.6 - rk, -2.8], [35 - rk, -2.4], [35 - rk, 2.4], [29.6 - rk, 2.8]], GM[2], 0.7);
  fp(c, [[-10, -5], [4, -5], [5, 5], [-9, 5]], tgrad(c, T, -5, 5), 0.9); // the team breech housing
  c.restore();
  // a sensor dish on a mast, and a power cell
  c.strokeStyle = GM[0]; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-15, -17); c.lineTo(-15, -26); c.stroke();
  fp(c, [[-19, -27.5], [-11.4, -26.4], [-12.6, -24.4], [-18.4, -25.2]], GM[1], 0.6);
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.9)`; c.beginPath(); c.arc(-15, -27.2, 0.9, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  treads(c, -21, 19, -9, 0, 0, [-16, -8, 0, 8, 14]);
  // hull: gunmetal frame, team armour plates, hazard stripes on the rear plate
  fp(c, [[-20, -9], [-19, -17], [-6, -19], [12, -18], [17, -12], [16, -9]], ggrad(c, -19, -9), 1);
  fp(c, [[-12, -9.6], [-11, -17.2], [11, -17], [15.5, -12], [14.5, -9.6]], tgrad(c, T, -17.2, -9.6), 0.8);
  c.save(); c.beginPath(); c.rect(-20, -16, 7, 6.5); c.clip(); c.fillStyle = HAZ; c.fillRect(-20, -16, 7, 6.5); c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.4;
  for (let i = -3; i < 3; i++) { c.beginPath(); c.moveTo(-20 + i * 3.2, -9); c.lineTo(-14 + i * 3.2, -17); c.stroke(); } c.restore();
  rim(c, -11, -17, 10); stencil(c, 2, -14, 3); scorch(c, -4, -12, 2.6, 1.2); chips(c, [[-11, -16.6], [14, -12.6]]);
  fp(c, [[6, -18], [7, -24], [14.6, -24], [15.4, -18]], GM[2], 0.8); slit(c, T, 9.6, -22.4, 4.2, 1.4); // the cab
  leg(-17, -9, -1, true); leg(13, -9, 1, true);
}
// Flame Tank: a low crawler on four big road wheels with exposed suspension pistons, two glowing plasma-fuel tanks on its back,
// a wide projector nozzle low at the front (tip at MUZ.flame (26, −12))
function dFlame5(c, T, u) {
  const sp = u.moving ? (u.anim || 0) * 30 : 0, rk = (u.recoil || 0) * 1.5, bob = u.moving ? Math.sin(sp * 1.25) * 0.4 : 0;
  // the wheels, each on a piston arm
  for (const [x, near] of [[-15, 0], [-4, 0], [7, 0], [-10, 1], [2, 1], [14, 1]]) {
    const r = near ? 4.4 : 3.8, y = -r;
    c.strokeStyle = '#d9dee6'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3, -11 + bob); c.stroke(); // piston rod
    c.strokeStyle = GM[2]; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 1.6, -7.6 + bob); c.lineTo(x + 3, -11 + bob); c.stroke(); // its sleeve
    c.fillStyle = near ? '#1b2028' : '#11151b'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); outline(c, 0.7);
    c.fillStyle = near ? GM[1] : GM[2]; c.beginPath(); c.arc(x, y, r * 0.45, 0, 7); c.fill();
    c.strokeStyle = GM[0]; c.lineWidth = 0.6; c.beginPath(); const a = sp * 0.4; c.moveTo(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45); c.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); c.stroke(); // a hub spoke turning
  }
  c.save(); c.translate(0, bob);
  // the fuel tanks: two fat cylinders with glowing sight windows and hazard bands
  for (const x of [-18, -11]) {
    fp(c, [[x, -12.6], [x, -21], [x + 1.4, -22.6], [x + 5.4, -22.6], [x + 6.6, -21], [x + 6.6, -12.6]], lgrad(c, x, 0, x + 6.6, 0, [RUSTO, '#e08a3c', '#7a3c18']), 0.8);
    c.fillStyle = HAZ; c.fillRect(x + 0.2, -15.4, 6.2, 1.2);
    c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,170,70,0.85)'; c.fillRect(x + 2.6, -20.6, 1.4, 4.4); c.globalCompositeOperation = 'source-over';
  }
  // the hull: a low gunmetal box, team armour across its flank and nose
  fp(c, [[-21, -7], [-20, -13], [14, -14.4], [22, -10.6], [20, -7]], ggrad(c, -14.4, -7), 1);
  fp(c, [[-19.6, -7.6], [-18.8, -12.4], [13, -13.4], [20.6, -10.2], [19, -7.6]], tgrad(c, T, -13.4, -7.6), 0.9);
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-6, -12.8); c.lineTo(-6.4, -7.8); c.moveTo(6, -13.2); c.lineTo(5.6, -7.8); c.stroke();
  rim(c, -18.4, -12.2, 12.4); stencil(c, -16, -10, 3); scorch(c, 15, -10, 3, 1.4);
  // a low cab with a visor slit, a short mast
  fp(c, [[-3, -13.6], [-2, -18.4], [7, -18.6], [9.4, -13.8]], ggrad(c, -18.6, -13.6), 0.8); slit(c, T, 2.4, -17, 4.6, 1.2);
  c.strokeStyle = GM[0]; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-1, -18.4); c.lineTo(-2.4, -24); c.stroke();
  // the projector: a wide flared nozzle with a feed hose and a pilot light
  c.strokeStyle = GM[2]; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, -16); c.quadraticCurveTo(4, -20, 12, -13); c.stroke();
  fp(c, [[13 - rk, -14.6], [22 - rk, -14.4], [26 - rk, -15.4], [26 - rk, -9], [22 - rk, -10], [13 - rk, -10]], ggrad(c, -15.4, -9), 0.8);
  c.fillStyle = GMD; c.fillRect(24.6 - rk, -14.2, 1.4, 3.8);
  c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,170,70,0.9)'; c.beginPath(); c.arc(26 - rk, -12.3, 1.5, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  c.fillStyle = T.main; c.fillRect(16 - rk, -14.4, 1.6, 4.4);
  c.restore();
}
// Titan: a striding battle mech. Reverse-knee legs with pistons (tiLeg, batch 2b), an angular team-armoured hull with a
// visor-slit cockpit, a sensor mast, a shoulder missile pod; planted: stabiliser claws dig in and the front plate lowers.
// The heavy gauss cannon's tip at MUZ.titan (38, −27)
function dTitan5(c, T, u) {
  const ph = u.moving ? (u.anim || 0) * 3.2 : 0, k = u.sk !== undefined ? u.sk : titanK(u, VFX.lastT),
    e = 1 - (1 - k) * (1 - k), bob = (u.moving ? -Math.abs(Math.cos(ph)) * 1.6 + 1.6 : 0) + 4 * e, rk = (u.recoil || 0) * 4;
  if (e > 0.02) for (const s of [-1, 1]) { // stabiliser claws
    const bx = s * 9, by = -22 + bob, tx = s * (12 + 14 * e), ty = 2 * e;
    c.strokeStyle = OUTL; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, by); c.lineTo((bx + tx) / 2 + s * 3, by - 3 * e); c.lineTo(tx, ty - 1); c.stroke();
    c.strokeStyle = GM[1]; c.lineWidth = 3.2; c.stroke(); c.strokeStyle = '#d9dee6'; c.lineWidth = 0.9; c.stroke(); c.lineCap = 'butt';
    c.fillStyle = GM[2]; for (const d of [-2.5, 0, 2.5]) { c.beginPath(); c.moveTo(tx + d - 1.2, ty - 1); c.lineTo(tx + d + s * 1.2, ty + 2.6 * e); c.lineTo(tx + d + 1.2, ty - 1); c.fill(); }
    c.fillStyle = 'rgba(70,52,34,0.8)'; c.beginPath(); c.ellipse(tx, ty + 0.5, 5 * e, 1.6 * e, 0, 0, 7); c.fill();
  }
  tiLeg(c, T, ph + Math.PI, false, e);
  c.save(); c.translate(0, bob);
  // the reactor stack on its back, venting
  fp(c, [[-20, -46], [-14, -48], [-13, -30], [-19, -31]], ggrad(c, -48, -30), 0.9);
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.85)`; c.fillRect(-18, -44, 1.6, 10); c.globalCompositeOperation = 'source-over';
  const a = u.anim || 0; c.fillStyle = 'rgba(80,80,88,0.5)';
  for (let i = 0; i < 3; i++) { const q = (a * 0.7 + i / 3) % 1; c.globalAlpha = 0.5 * (1 - q); c.beginPath(); c.arc(-17 - q * 6, -50 - q * 12, 2.2 + q * 3, 0, 7); c.fill(); }
  c.globalAlpha = 1;
  // the shoulder missile pod
  fp(c, [[-16, -56], [-3, -56], [-2, -48], [-16, -47]], ggrad(c, -56, -47), 0.9);
  fp(c, [[-16, -56], [-3, -56], [-3, -54], [-16, -54]], T.main, 0.5);
  c.fillStyle = GMD; for (let i = 0; i < 4; i++) c.fillRect(-14 + i * 3, -52, 1.8, 1.8);
  // the hull: an angular gunmetal frame, team armour over most of it
  fp(c, [[-15, -24], [-17, -36], [-12, -47], [9, -47.6], [17, -40], [17, -27], [10, -22], [-10, -22]], ggrad(c, -47.6, -22), 1.2);
  fp(c, [[-14.4, -30], [-15.6, -37], [-11, -45.4], [4, -46], [5, -30]], tgrad(c, T, -46, -30), 0.9);
  fp(c, [[-13, -29.4], [12.6, -29.4], [9, -23], [-9, -23]], lgrad(c, 0, -29.4, 0, -23, [T.main, T.hull]), 0.8);
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-5, -45.4); c.lineTo(-6, -30.4); c.stroke();
  rim(c, -11, -46.4, 4); stencil(c, -11, -34, 4); scorch(c, -2, -38, 3.4, 1.6); chips(c, [[-15, -33], [3, -45.6], [11, -28]]);
  c.fillStyle = '#5c6a76'; rr(c, -2.6, -43, 5, 4.4, 0.6); c.fill(); outline(c, 0.5); // a patched plate
  c.save(); c.beginPath(); c.rect(-15, -37, 4, 6); c.clip(); c.fillStyle = HAZ; c.fillRect(-15, -37, 4, 6); c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.2;
  for (let i = -3; i < 3; i++) { c.beginPath(); c.moveTo(-16 + i * 3, -30); c.lineTo(-10 + i * 3, -38); c.stroke(); } c.restore();
  // the cockpit: an armoured head with a visor slit, a sensor mast
  fp(c, [[4, -46.6], [13, -47], [18.6, -41.6], [17.6, -35], [6, -34.4]], ggrad(c, -47, -34.4), 1);
  slit(c, T, 9, -43, 8, 1.6);
  c.strokeStyle = GM[0]; c.lineWidth = 0.9; c.beginPath(); c.moveTo(8, -46.8); c.lineTo(6, -57); c.stroke();
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.9)`; c.beginPath(); c.arc(6, -57.2, 1.1, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  // the heavy gauss cannon
  fp(c, [[4, -33], [16, -33], [16, -24], [4, -24]], ggrad(c, -33, -24), 1); // mantlet
  c.fillStyle = ggrad(c, -30, -24.5); c.fillRect(14 - rk, -30, 21, 5); c.strokeStyle = OUTL; c.lineWidth = 0.9; c.strokeRect(14 - rk, -30, 21, 5);
  coils(c, T, [20, 24, 28], -27.5, 6.2, rk);
  fp(c, [[33 - rk, -31.2], [39 - rk, -30.6], [39 - rk, -24.4], [33 - rk, -23.8]], GM[2], 0.8);
  // the front plate: folded up under the cannon on the move, lowered over the legs when planted
  c.save(); c.translate(14, -27); c.rotate(-1.35 * (1 - e));
  fp(c, [[-1, 0], [5, 1], [6, 13], [0, 14]], lgrad(c, 0, 0, 0, 14, [T.main, T.hull]), 0.9);
  c.save(); c.beginPath(); c.rect(0, 9, 6, 4); c.clip(); c.fillStyle = HAZ; c.fillRect(0, 9, 6, 4); c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.1; for (let i = -2; i < 3; i++) { c.beginPath(); c.moveTo(i * 2.6, 14); c.lineTo(i * 2.6 + 4, 8); c.stroke(); } c.restore();
  c.restore();
  c.restore();
  tiLeg(c, T, ph, true, e);
}
// Hydra: a four-legged spider walker with a low armoured body and twin rotary gauss cannons on a turret (level tips at
// MUZ.hydra (30, −33); they tilt up for aircraft, u.aimAir)
function hyLeg(c, T, hx, hy, fx, lift, near) {
  const kx = (hx + fx) / 2 + (fx > hx ? 2 : -2), ky = hy - 9 - lift * 0.5, w = near ? 3.6 : 3;
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = OUTL; c.lineWidth = w + 1.6; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, -lift); c.stroke();
  c.strokeStyle = near ? GM[1] : GM[2]; c.lineWidth = w; c.stroke();
  c.strokeStyle = near ? T.main : T.hull; c.lineWidth = w * 0.55; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + (kx - hx) * 0.8, hy + (ky - hy) * 0.8); c.stroke(); // team thigh plate
  c.strokeStyle = '#d9dee6'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(kx + 1, ky + 2); c.lineTo(kx + (fx - kx) * 0.55 + 1, ky + (-lift - ky) * 0.55); c.stroke(); // piston
  c.lineCap = 'butt';
  c.fillStyle = near ? GM[0] : GM[1]; c.beginPath(); c.arc(kx, ky, w * 0.5, 0, 7); c.fill(); outline(c, 0.5);
  c.fillStyle = near ? GM[2] : GMD; poly(c, [[fx - 2.4, -lift], [fx + 2.4, -lift], [fx + 1.4, -2 - lift], [fx - 1.4, -2 - lift]]); c.fill();
}
function dHydra5(c, T, u) {
  const ph = u.moving ? (u.anim || 0) * 3.6 : 0, bob = u.moving ? -Math.abs(Math.cos(ph)) * 1.2 + 1.2 : 0, up = u.aimAir ? -0.55 : 0, spin = (u.recoil || 0) > 0.02 ? (u.anim || 0) * 50 : 0;
  const lf = p => Math.max(0, Math.sin(p)) * 3, sw = p => Math.cos(p) * 4;
  hyLeg(c, T, -8, -22 + bob, -22 + sw(ph), lf(ph), false); hyLeg(c, T, 6, -22 + bob, 18 + sw(ph + Math.PI), lf(ph + Math.PI), false);
  c.save(); c.translate(0, bob);
  // the body: a low armoured carapace, team plates, a sensor eye at the front
  fp(c, [[-17, -20], [-18, -27], [-12, -33], [10, -33.6], [17, -28], [16, -20], [8, -17], [-10, -17]], ggrad(c, -33.6, -17), 1.1);
  fp(c, [[-16, -26], [-11.4, -32.2], [9.6, -32.6], [15, -27.4], [-1, -26.4]], tgrad(c, T, -32.6, -26), 0.9);
  fp(c, [[-15.6, -21], [15, -21.4], [13, -18.4], [-13, -18.4]], lgrad(c, 0, -21.4, 0, -18.4, [T.main, T.hull]), 0.7);
  slit(c, T, 11.6, -25.4, 4, 1.4); rim(c, -11, -32.6, 9); stencil(c, -12, -24.6, 4); scorch(c, -4, -23.4, 2.6, 1.2); chips(c, [[-17, -24], [9, -33.2]]);
  c.restore();
  hyLeg(c, T, -6, -21 + bob, -18 + sw(ph + Math.PI), lf(ph + Math.PI), true); hyLeg(c, T, 8, -21 + bob, 22 + sw(ph), lf(ph), true);
  // the turret and twin rotary gauss cannons
  c.save(); c.translate(0, bob);
  fp(c, [[-6, -32.4], [-4, -38], [6, -38.6], [9, -33], [8, -31]], ggrad(c, -38.6, -31), 0.9);
  fp(c, [[-4, -38], [6, -38.6], [6.8, -36.6], [-4.6, -36.2]], T.main, 0.5);
  for (const [dy, near] of [[-2.2, false], [2.2, true]]) {
    c.save(); c.translate(6, -33 + dy); c.rotate(up);
    fp(c, [[-3, -2.4], [6, -2.4], [6, 2.4], [-3, 2.4]], near ? GM[1] : GM[2], 0.6);
    c.fillStyle = near ? GM[0] : GM[1]; for (let i = 0; i < 3; i++) c.fillRect(6, -1.6 + ((i * 1.1 + spin) % 3.3), 18, 0.9);
    coils(c, T, [12, 18], 0, 4, 0);
    c.fillStyle = GM[2]; c.fillRect(22, -2, 2.4, 4);
    c.restore();
  }
  c.restore();
}

/* ---------------- aircraft ---------------- */
// fl: the engines' flicker (0.2…1); airFl reads it from the unit's animation clock, AIR_POSE snaps it to cached steps
const airFl = (u, k) => 0.6 + 0.4 * Math.sin((u.anim || 0) * k);
// Gunship (aircraft): an armoured VTOL with two vectored thruster nacelles and stub-wing missile pods (their mouths at
// MUZ.aircraft (16, +5))
function dGun5(c, T, u) {
  const fl = u.fl ?? airFl(u, 30), rk = (u.recoil || 0) * 2;
  // the far nacelle (above the hull line), firing down
  fp(c, [[-10, -13], [0, -13.6], [1, -9], [-10, -8.6]], GM[2], 0.7); thrust(c, -5, -8.4, 2.6 * fl + 1, 2.6, 0.7 * fl, 1);
  // the main engine at the back
  thrust(c, -22, -3, 7 * fl + 4, 2.2, fl);
  // tail: twin canted fins, team-coloured with hazard tips
  fp(c, [[-14, -6], [-21, -14], [-17.6, -14], [-9, -6.6]], tgrad(c, T, -14, -6), 0.8);
  c.fillStyle = HAZ; c.fillRect(-21, -14, 3.4, 1.4);
  // the hull: gunmetal underside, a big team armour shell on top, a faceted canopy
  fp(c, [[22, 0.6], [17, -5.6], [6, -8.6], [-12, -8.4], [-22, -5], [-22, -0.6], [-12, 3.4], [12, 4]], ggrad(c, -8.6, 4), 1);
  fp(c, [[17, -5.6], [6, -8.6], [-12, -8.4], [-21.4, -5], [-20, -2.6], [14, -2.6]], tgrad(c, T, -8.6, -2.6), 0.9);
  fp(c, [[22, 0.6], [17, -5.6], [11, -6.6], [9.6, -1.6]], lgrad(c, 10, -6, 20, 0, ['#d8f4ff', '#5d8aa8', '#1d3346']), 0.7); // canopy
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-3, -8.4); c.lineTo(-3.4, -2.8); c.moveTo(6, -8.4); c.lineTo(6, -2.8); c.stroke();
  rim(c, -11, -8.2, 5); stencil(c, -16, -1.4, 3); scorch(c, 0, 0.6, 2.6, 1.1); chips(c, [[-21, -4.6], [5, -8.4]]);
  slit(c, T, -9, -5.4, 4, 0.9);
  // the near nacelle under the hull: a pivoting thruster pod, its jet pointing down
  fp(c, [[-9, 1], [3, 0.4], [4.4, 6.4], [-8, 6.8]], ggrad(c, 0, 7), 0.9);
  fp(c, [[-9, 1], [3, 0.4], [3.4, 2.4], [-8.6, 2.8]], T.main, 0.5);
  thrust(c, -2.4, 6.8, 5 * fl + 2.4, 3.4, fl, 1);
  // the stub wing and its missile pod, the mouths at the front
  fp(c, [[2, 2.2], [11, 3], [11, 4.4], [2, 4.6]], GM[1], 0.6);
  fp(c, [[3 - rk, 3.2], [15 - rk, 3.2], [16.4 - rk, 4.2], [16.4 - rk, 7], [3 - rk, 7.2]], ggrad(c, 3, 7.2), 0.8);
  c.fillStyle = RUSTO; c.fillRect(6 - rk, 3.3, 1.4, 3.8); c.fillStyle = T.main; c.fillRect(3 - rk, 3.4, 1.6, 3.6);
  c.fillStyle = '#121418'; for (const y of [4.4, 6]) { c.beginPath(); c.arc(15.4 - rk, y, 0.7, 0, 7); c.fill(); }
  if ((u.recoil || 0) > 0.3) { c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.fire, 16, 5.2, 5, u.recoil); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
}
// Interceptor: a forward-swept dart fighter with canards and twin afterburners; its cannon's tip at MUZ.interceptor (20, 0)
function dInter5(c, T, u) {
  const fl = u.fl ?? airFl(u, 34);
  thrust(c, -21, -2.4, 7 * fl + 3, 1.7, fl); thrust(c, -21, 1.6, 7 * fl + 3, 1.7, fl);
  fp(c, [[2, -1], [-12, -11], [-16, -11], [-10, -1]], GM[2], 0.7); // far wing
  // the fuselage: a long dart, team armour on top
  fp(c, [[27, -0.4], [14, -3.6], [-14, -4.2], [-22, -3.4], [-22, 2.6], [-12, 3.2], [14, 1.8]], ggrad(c, -4.2, 3.2), 0.9);
  fp(c, [[22, -1.4], [14, -3.6], [-14, -4.2], [-21.4, -3.4], [-20, -1.2], [16, -0.8]], tgrad(c, T, -4.2, -0.8), 0.7);
  fp(c, [[17, -1.6], [9, -5.6], [3, -4]], lgrad(c, 3, -5, 15, -2, ['#d8f4ff', '#5d8aa8', '#1d3346']), 0.6); // canopy
  fp(c, [[-14, -4], [-19, -10.6], [-16.4, -10.6], [-10, -4]], tgrad(c, T, -10.6, -4), 0.7); // tail fin
  fp(c, [[10, 1], [5, 4.6], [3, 4.6], [6, 1]], GM[1], 0.5); // canard
  // the near wing: forward-swept, a team leading edge
  fp(c, [[-4, 0.6], [-14, 10], [-10, 10], [6, 1.2]], ggrad(c, 0, 10), 0.8);
  fp(c, [[-14, 10], [-10, 10], [-9, 8.6], [-13, 8.6]], T.main, 0.4);
  c.fillStyle = GM[0]; c.fillRect(13, -0.6, 7, 1.2); c.fillStyle = GMD; c.fillRect(19, -0.8, 1.2, 1.6); // cannon
  rim(c, -13, -4, 12); stencil(c, -8, -2.8, 2);
}
// Leviathan: an armoured flying fortress. A thick plated hull, four thruster pods, dorsal and ventral turret blisters, and
// a bomb bay underneath whose doors swing open on a run (u.lvB); bombs leave it at MUZ.leviathan (0, +10)
// Drawn at ART5.lev about the bay (0, 10), so bombs still leave the bay at any scale
const ART5 = { lev: 1.25 };
function dLev5(c, T, u) { c.save(); c.translate(0, 10); c.scale(ART5.lev, ART5.lev); c.translate(0, -10); dLev5a(c, T, u); c.restore(); }
function dLev5a(c, T, u) {
  const fl = u.fl ?? airFl(u, 26), bay = u.lvB ? 1 : 0, rk = (u.recoil || 0) * 1.5;
  const pod = (x, y, near) => { // a thruster pod on a pylon: an armoured can, a team band, a glowing jet at the back
    fp(c, [[x + 7, y - 3], [x - 8, y - 3.4], [x - 9.4, y], [x - 8, y + 3.4], [x + 7, y + 3]], near ? ggrad(c, y - 3.4, y + 3.4) : GM[2], 0.8);
    c.fillStyle = near ? T.main : T.hull; c.fillRect(x - 2, y - 3.2, 2, 6.4);
    c.fillStyle = GMD; c.beginPath(); c.ellipse(x + 7, y, 1, 2.8, 0, 0, 7); c.fill();
    thrust(c, x - 9.4, y, 7 * fl + 4, 2.4, near ? fl : 0.7 * fl);
  };
  // the far pods, above the hull's back
  for (const x of [-20, 10]) { c.fillStyle = GM[2]; c.fillRect(x - 1, -18, 3, 4); pod(x, -19.6, false); }
  // the dorsal turret blister: a dome with twin barrels
  fp(c, [[2, -16.4], [4, -21], [12, -21.6], [14.6, -16.4]], ggrad(c, -21.6, -16.4), 0.8);
  c.fillStyle = GM[0]; c.fillRect(12, -20, 8, 1); c.fillRect(12, -18.4, 8, 1); slit(c, T, 6, -19.6, 4, 0.9);
  // the hull: a thick gunmetal fuselage, big team armour plates over its back, a stepped armoured nose
  fp(c, [[40, -2], [34, -11], [22, -15.6], [-26, -16], [-38, -11], [-40, -2], [-32, 6], [-14, 9], [16, 9], [32, 5]], ggrad(c, -16, 9), 1.2);
  fp(c, [[33, -10.4], [22, -15], [-26, -15.4], [-37, -10.6], [-38, -6], [30, -6]], tgrad(c, T, -15.4, -6), 1);
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.7; c.beginPath(); for (const x of [-22, -8, 6, 20]) { c.moveTo(x, -15.2); c.lineTo(x - 0.6, -6.2); } c.stroke();
  c.fillStyle = 'rgba(0,0,0,0.35)'; for (let x = -32; x < 30; x += 5) { c.beginPath(); c.arc(x, -3.4, 0.5, 0, 7); c.fill(); c.beginPath(); c.arc(x + 2.5, 6, 0.5, 0, 7); c.fill(); } // rivets
  rim(c, -25, -15.6, 21); stencil(c, -30, -8.6, 4); stencil(c, 12, -1.6, 3);
  scorch(c, -16, -10, 4, 1.6); scorch(c, 24, 2, 3, 1.2); chips(c, [[-37, -9], [21, -15], [-2, -15.2], [33, -9.6]]);
  c.fillStyle = '#5c6a76'; rr(c, 4, -13.6, 6, 5, 0.6); c.fill(); outline(c, 0.5); // a patched plate
  // the tail: a tall hazard-striped fin
  fp(c, [[-28, -15], [-38, -27], [-33, -27], [-20, -15.4]], tgrad(c, T, -27, -15), 0.9);
  c.save(); c.beginPath(); poly(c, [[-28, -15], [-38, -27], [-33, -27], [-20, -15.4]]); c.clip(); c.strokeStyle = HAZ; c.lineWidth = 1.6; for (let i = -3; i < 6; i++) { c.beginPath(); c.moveTo(-40 + i * 4, -15); c.lineTo(-32 + i * 4, -29); c.stroke(); } c.restore();
  // the cockpit: a slit across the nose
  fp(c, [[40, -2], [34, -11], [28, -12], [30, -4]], GM[1], 0.8); slit(c, T, 30.6, -8.4, 6, 1.4);
  // the bomb bay: armoured doors that swing open on a run, bombs racked inside (the drop point is (0, 10))
  c.fillStyle = '#0d0f13'; rr(c, -11, 6.4, 22, 3.6 + bay * 1.6, 1); c.fill();
  if (bay) {
    c.fillStyle = GM[1]; for (const x of [-8.6, -2.3, 4]) { rr(c, x, 7, 4.6, 3.2, 1.6); c.fill(); } c.fillStyle = HAZ; for (const x of [-8.6, -2.3, 4]) c.fillRect(x + 1.2, 7.1, 0.9, 3);
    fp(c, [[-11, 8.6], [-15, 15.6], [-11.4, 15.6], [-8.6, 9]], ggrad(c, 8, 16), 0.6); fp(c, [[11, 8.6], [15, 15.6], [11.4, 15.6], [8.6, 9]], ggrad(c, 8, 16), 0.6);
    c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,190,90,0.35)'; c.fillRect(-10, 7, 20, 3); c.globalCompositeOperation = 'source-over';
  } else { c.fillStyle = GM[2]; c.fillRect(-11, 8.4, 22, 1.6); c.strokeStyle = HAZ; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 6.6); c.lineTo(0, 10); c.stroke(); }
  // the ventral turret blister near the nose
  fp(c, [[18, 8.6], [20, 12.4], [26, 12.4], [27, 8.4]], ggrad(c, 8.4, 12.4), 0.7);
  c.fillStyle = GM[0]; c.fillRect(25 - rk, 10, 6, 0.9);
  // the near pods, on pylons along the flank
  for (const x of [-22, 12]) { c.fillStyle = GM[2]; c.fillRect(x - 1, -2, 3, 4); pod(x, 3.2, true); }
}
// Medicopter: a thruster medevac craft. A pale armoured body with a big green cross and team bands, two swivelling lift
// thrusters firing down, a glowing heal emitter underneath where its beams start (0, +4)
function dMedic5(c, T, u) {
  const fl = u.fl ?? airFl(u, 28);
  fp(c, [[-12, -10.6], [-6, -10.6], [-6, -7], [-12, -7]], GM[2], 0.6); thrust(c, -9, -7, 2 * fl + 0.8, 2.2, 0.6 * fl, 1); // the far thruster
  // body: a rounded pale hull, team nose and tail bands
  fp(c, [[17, 0], [14, -6], [6, -9.4], [-12, -9.4], [-19, -6], [-20, 0], [-14, 3.6], [12, 3.6]], lgrad(c, 0, -9.4, 0, 3.6, ['#f2f5f8', '#c4ccd6', '#7d8794']), 1);
  fp(c, [[17, 0], [14, -6], [9.6, -7.6], [9, 3.6], [12, 3.6]], tgrad(c, T, -7.6, 3.6), 0.7);
  fp(c, [[-19, -6], [-20, 0], [-14, 3.6], [-13, -9.2], [-12, -9.4]], tgrad(c, T, -9.4, 3.6), 0.7);
  fp(c, [[15, -2.6], [12.6, -6], [9.6, -6.4], [9.6, -2.4]], lgrad(c, 10, -6, 15, -2, ['#d8f4ff', '#5d8aa8', '#1d3346']), 0.6); // canopy
  c.fillStyle = '#2fd17a'; c.fillRect(-5.6, -6.2, 8, 2.6); c.fillRect(-2.9, -8.8, 2.6, 7.8); outline(c, 0.0); // the green cross
  c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 0.5; c.strokeRect(-5.6, -6.2, 8, 2.6); c.strokeRect(-2.9, -8.8, 2.6, 7.8);
  rim(c, -11, -9.2, 6); stencil(c, 4, 0.4, 3);
  c.fillStyle = 'rgba(255,90,70,0.9)'; c.fillRect(-18.4, -5, 1.2, 1.2); // a beacon
  // the near lift thruster on a pylon, and the tail thruster
  fp(c, [[3, 1.6], [11, 1.2], [11.6, 5], [3.4, 5.4]], ggrad(c, 1, 5.4), 0.7); thrust(c, 7.2, 5.4, 4 * fl + 2, 2.8, fl, 1);
  fp(c, [[-17, 1], [-11, 0.8], [-10.6, 4.2], [-16.6, 4.4]], ggrad(c, 1, 4.4), 0.7); thrust(c, -13.8, 4.4, 3.6 * fl + 2, 2.4, fl, 1);
  // the heal emitter under its belly
  fp(c, [[-3, 3.4], [3, 3.4], [2, 5], [-2, 5]], GM[1], 0.5);
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(80,240,150,${0.5 + 0.4 * fl})`; c.beginPath(); c.ellipse(0, 4.6, 2.4, 1.2, 0, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
}
// Recon Drone: a small armoured sensor wedge carried by two ion pods, a big sensor eye at the front and an antenna
function dDrone5(c, T, u) {
  const fl = u.fl ?? airFl(u, 4), ion = u.fi ?? airFl(u, 40);
  thrust(c, -7, -1.2, 2.6 * ion + 1, 1, ion);
  fp(c, [[-8, -3], [-3, -3.4], [-3, -0.4], [-8, -0.4]], GM[2], 0.5); // the far pod
  fp(c, [[8, 0], [4, -3.6], [-6, -3.4], [-7, 0.4], [-4, 2.6], [5, 2.6]], tgrad(c, T, -3.6, 2.6), 0.8);
  c.fillStyle = GM[2]; c.fillRect(-6, 0.4, 11, 1.6);
  c.strokeStyle = GM[0]; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-3, -3.4); c.lineTo(-5, -8); c.stroke();
  c.fillStyle = '#0a0d12'; c.beginPath(); c.arc(5, -0.6, 1.8, 0, 7); c.fill();
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(120,240,255,${0.35 + 0.4 * fl})`; c.beginPath(); c.arc(5, -0.6, 2.4, 0, 7); c.fill(); c.fillStyle = `rgba(200,255,255,${0.6 + 0.4 * fl})`; c.beginPath(); c.arc(5.2, -0.6, 1, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  fp(c, [[-6, 1.6], [0, 1.2], [0.4, 4.4], [-5.6, 4.6]], ggrad(c, 1, 4.6), 0.6); thrust(c, -5.8, 3, 2.6 * ion + 1.2, 1, ion); // the near ion pod
}

DRAW_U.rifle = dMarine; DRAW_U.heavy = dHeavy5; DRAW_U.sniper = dSniper5;
Object.assign(SPR_BOX, { rifle: [-12, -30, 26, 32], heavy: [-13, -33, 28, 35], sniper: [-13, -32, 33, 34] });
Object.assign(UVIS, { rifle: { h: 25, w: 9 }, heavy: { h: 31, w: 12 } }); // health bars and shadows follow the bulkier armour
DRAW_U.tank = dTank5; DRAW_U.artillery = dArt5; DRAW_U.flame = dFlame5; DRAW_U.titan = dTitan5; DRAW_U.hydra = dHydra5;
Object.assign(SPR_BOX, { tank: [-26, -36, 57, 38], artillery: [-32, -40, 68, 44], flame: [-24, -27, 52, 29], titan: [-42, -84, 94, 90], hydra: [-31, -53, 63, 57] });
DRAW_U.aircraft = dGun5; DRAW_U.interceptor = dInter5; DRAW_U.leviathan = dLev5; DRAW_U.medic = dMedic5; DRAW_U.drone = dDrone5;

/* ---------------- the size fix (step 3) ----------------
   The Leviathan, Worldrender and Sovereign were drawn far wider than their footprint (103, 125 and 95 art units across against
   an aircraft shadow 77 wide), swallowing the units around them. Each is now drawn about 85 across: still the biggest things
   in the sky, but no longer covering a squad. Art scale only, each scaled about the point its shots leave (MUZ), so bombs,
   the maw and the beam still start where the SIM fires them. */
ART5.lev = 1.0;
const ART5_WR = 0.7, ART5_SOV = 0.88; // relative to batch 4b's drawn size
{ const w4 = DRAW_U.worldrender, s4 = DRAW_U.sovereign;
  DRAW_U.worldrender = (c, T, u) => { c.save(); c.translate(0, 8); c.scale(ART5_WR, ART5_WR); c.translate(0, -8); w4(c, T, u); c.restore(); };
  DRAW_U.sovereign = (c, T, u) => { c.save(); c.translate(0, 8); c.scale(ART5_SOV, ART5_SOV); c.translate(0, -8); s4(c, T, u); c.restore(); }; }

