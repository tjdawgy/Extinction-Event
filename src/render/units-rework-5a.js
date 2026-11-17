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


DRAW_U.rifle = dMarine; DRAW_U.heavy = dHeavy5; DRAW_U.sniper = dSniper5;
Object.assign(SPR_BOX, { rifle: [-12, -30, 26, 32], heavy: [-13, -33, 28, 35], sniper: [-13, -32, 33, 34] });
Object.assign(UVIS, { rifle: { h: 25, w: 9 }, heavy: { h: 31, w: 12 } }); // health bars and shadows follow the bulkier armour
