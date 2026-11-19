/* ---------- Faction rework art, batch 2b (v2.83; docs/FACTION_REWORK.md "Art direction") ----------
   Titan (a Last Fist strider mech: hydraulic legs, glowing cockpit glass, team armour plates, hazard stripes, smoking
   stacks, a heavy cannon; planted: stabiliser claws dig in and a front plate lowers), Ruinmaw (a colossal worm arching
   out of the ground: team carapace segments, a ring maw of bone teeth that opens on a glowing gullet while it is a
   gate) and Worldbreaker (an orb strider: a dark energy orb in an obsidian shell on floating spike legs that never touch
   the ground; the slam lifts them and drives them down). Each is cached as poses (the Titan's plant and the Ruinmaw's
   gate in steps; a Worldbreaker draws live only during its slam). Effects: Titan cover (a faint ring under the Titan and
   a shimmer over each covered infantry unit), the Ruinmaw's wide trail and burrowed hump, the tunnel entrance, units
   entering and pouring out, the Worldbreaker's racing crack and its ridge of floating obsidian slabs. */
const TI_OL = ['#7f8d50', '#5a6740', '#3a4429'];
function tiLeg(c, T, ph, near, k) { // a reverse-knee strider leg with exposed pistons; k: planted share (legs spread, knees bent)
  const sw = Math.sin(ph) * 7 * (1 - k), lift = Math.max(0, -Math.cos(ph)) * 4 * (1 - k), hx = near ? 2 : -3, hy = -27 + 4 * k;
  const fx = hx + sw + (near ? 7 : -7) * k, fy = -lift, kx = hx + sw * 0.4 + (near ? -6 : -8) - 3 * k, ky = -14 + 2 * k;
  const thick = near ? 6 : 5;
  c.lineCap = 'round';
  c.strokeStyle = OUTL; c.lineWidth = thick + 2; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, fy - 3); c.stroke();
  c.strokeStyle = near ? STEEL[1] : STEEL[2]; c.lineWidth = thick; c.stroke();
  c.strokeStyle = near ? T.main : T.hull; c.lineWidth = thick - 2.5; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx + (hx - kx) * 0.15, ky + (hy - ky) * 0.15); c.stroke(); // armoured thigh plate
  c.strokeStyle = '#d9dee6'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(hx + 2.5, hy + 1); c.lineTo(kx + 3, ky - 1); c.moveTo(kx + 2, ky + 1); c.lineTo(fx + 2, fy - 6); c.stroke(); // piston rods
  c.strokeStyle = STEEL[2]; c.lineWidth = 2.4; c.beginPath(); c.moveTo(hx + 2.5, hy + 1); c.lineTo(hx + 2.5 + (kx - hx) * 0.45, hy + 1 + (ky - hy) * 0.45); c.stroke(); // piston sleeve
  c.lineCap = 'butt';
  c.fillStyle = near ? STEEL[1] : '#252b35'; c.beginPath(); c.arc(kx, ky, near ? 3 : 2.6, 0, 7); c.fill(); outline(c, 0.8); // knee joint
  c.fillStyle = near ? '#2a313c' : '#1c2129'; rr(c, fx - 7, fy - 3.4, 14, 3.6, 1.6); c.fill(); outline(c, 0.8); // foot pad
}
function dTitan2(c, T, u) {
  const ph = u.moving ? (u.anim || 0) * 3.2 : 0, k = u.sk !== undefined ? u.sk : titanK(u, VFX.lastT), // a live draw (mid-recoil) reads the plant itself
    e = 1 - (1 - k) * (1 - k), bob = (u.moving ? -Math.abs(Math.cos(ph)) * 1.6 + 1.6 : 0) + 4 * e, rk = (u.recoil || 0) * 4;
  // stabiliser claws (planted): two braced claws that dig in fore and aft
  if (e > 0.02) for (const s of [-1, 1]) {
    const bx = s * 9, by = -22 + bob, tx = s * (12 + 14 * e), ty = 2 * e;
    c.strokeStyle = OUTL; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, by); c.lineTo((bx + tx) / 2 + s * 3, by - 3 * e); c.lineTo(tx, ty - 1); c.stroke();
    c.strokeStyle = STEEL[1]; c.lineWidth = 3.2; c.stroke(); c.lineCap = 'butt';
    c.fillStyle = STEEL[2]; for (const d of [-2.5, 0, 2.5]) { c.beginPath(); c.moveTo(tx + d - 1.2, ty - 1); c.lineTo(tx + d + s * 1.2, ty + 2.6 * e); c.lineTo(tx + d + 1.2, ty - 1); c.fill(); }
    c.fillStyle = 'rgba(70,52,34,0.8)'; c.beginPath(); c.ellipse(tx, ty + 0.5, 5 * e, 1.6 * e, 0, 0, 7); c.fill(); // dirt thrown up
  }
  tiLeg(c, T, ph + Math.PI, false, e);
  c.save(); c.translate(0, bob);
  // exhaust stacks, smoking
  for (const [x, h] of [[-16, 15], [-11.5, 12]]) { c.fillStyle = lgrad(c, x - 2, 0, x + 2, 0, [STEEL[0], STEEL[2]]); rr(c, x - 2, -48 - h + 12, 4, h, 1); c.fill(); outline(c, 0.7); c.fillStyle = '#20252d'; c.fillRect(x - 2, -48 - h + 12, 4, 1.6); }
  const a = u.anim || 0; c.fillStyle = 'rgba(80,80,88,0.5)';
  for (let i = 0; i < 3; i++) { const q = (a * 0.7 + i / 3) % 1; c.globalAlpha = 0.6 * (1 - q); c.beginPath(); c.arc(-16 - q * 6, -52 - q * 14, 2.4 + q * 3.4, 0, 7); c.fill(); }
  c.globalAlpha = 1;
  // hull: olive frame, team armour plates over most of it
  c.fillStyle = lgrad(c, 0, -46, 0, -22, TI_OL); poly(c, [[-15, -24], [-17, -36], [-12, -46], [8, -47], [16, -40], [17, -27], [10, -22], [-10, -22]]); c.fill(); outline(c, 1.2);
  c.fillStyle = lgrad(c, 0, -45, 0, -28, [T.light, T.main, T.hull]); poly(c, [[-14, -30], [-15, -37], [-11, -44.5], [4, -45.5], [3, -30]]); c.fill(); outline(c, 0.9);
  c.fillStyle = lgrad(c, 0, -30, 0, -23, [T.main, T.hull]); poly(c, [[-13, -29], [12, -29], [9, -23], [-9, -23]]); c.fill(); outline(c, 0.8);
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-5, -45); c.lineTo(-6, -30); c.stroke();
  c.fillStyle = M.d; for (const [x, y] of [[-12, -33], [-1, -42], [-1, -33], [6, -26], [-8, -26]]) { c.beginPath(); c.arc(x, y, 0.75, 0, 7); c.fill(); } // rivets
  c.save(); c.beginPath(); c.rect(-15, -37, 5, 7); c.clip(); c.fillStyle = HAZ; c.fillRect(-15, -37, 5, 7); c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.3; // hazard stripes
  for (let i = -3; i < 3; i++) { c.beginPath(); c.moveTo(-16 + i * 3, -29); c.lineTo(-10 + i * 3, -38); c.stroke(); } c.restore();
  rim(c, -11, -46, 6);
  c.fillStyle = RUSTO; rr(c, -19, -34, 4, 9, 1.5); c.fill(); outline(c, 0.7); // a fuel tank on its back
  // cockpit: armoured nose with glowing glass
  c.fillStyle = lgrad(c, 0, -46, 0, -34, [STEEL[0], STEEL[1], STEEL[2]]); poly(c, [[4, -46], [12, -46], [18, -41], [17, -35], [6, -34]]); c.fill(); outline(c);
  c.fillStyle = `rgba(${T.glow},0.95)`; poly(c, [[9, -44.5], [13, -44.5], [16.4, -41], [10, -41]]); c.fill();
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.35)`; c.beginPath(); c.ellipse(13, -42.5, 6, 3, 0, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(10.5, -44, 2.2, 0.9);
  // the heavy cannon (tip at MUZ.titan: 38, -27)
  c.fillStyle = lgrad(c, 0, -33, 0, -24, [STEEL[0], STEEL[1], STEEL[2]]); rr(c, 4, -33, 12, 9, 2); c.fill(); outline(c); // mantlet
  c.fillStyle = lgrad(c, 0, -30, 0, -24.5, [STEEL[0], STEEL[2]]); c.fillRect(14 - rk, -30, 21, 5); c.strokeStyle = OUTL; c.lineWidth = 0.9; c.strokeRect(14 - rk, -30, 21, 5);
  c.fillStyle = STEEL[2]; c.fillRect(33 - rk, -31.2, 6, 7.4); c.fillStyle = '#0c0e12'; c.fillRect(38.2 - rk, -28.6, 0.9, 2.4); // muzzle brake
  c.fillStyle = T.main; c.fillRect(22 - rk, -30.4, 3, 5.8); // a team band
  // the front armour plate: folded up under the cannon on the move, lowered over the legs when planted
  c.save(); c.translate(14, -27); c.rotate(-1.35 * (1 - e));
  c.fillStyle = lgrad(c, 0, 0, 0, 14, [T.main, T.hull]); poly(c, [[-1, 0], [5, 1], [6, 13], [0, 14]]); c.fill(); outline(c, 0.9);
  c.save(); c.beginPath(); c.rect(0, 9, 6, 4); c.clip(); c.fillStyle = HAZ; c.fillRect(0, 9, 6, 4); c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.1; for (let i = -2; i < 3; i++) { c.beginPath(); c.moveTo(i * 2.6, 14); c.lineTo(i * 2.6 + 4, 8); c.stroke(); } c.restore();
  c.restore();
  c.restore();
  tiLeg(c, T, ph, true, e);
}

// Ruinmaw: a colossal worm arching out of the ground, its head facing forward. u.gk 0..1: its maw opening into a glowing
// gullet (a gate)
const RM_FLESH = ['#94626a', '#6a3c46', '#3e2129'], RM_GLOW = '206,255,120';
function dRuin2(c, T, u) {
  c.save(); c.scale(1.3, 1.3); dRuinBody(c, T, u); c.restore(); // colossal: drawn 1.3× (its mouth lands at RUIN.mouth, where units come out)
}
function dRuinBody(c, T, u) {
  const g = u.gk !== undefined ? u.gk : ruinGk(u, VFX.lastT), wav = u.moving ? Math.sin((u.anim || 0) * 4) * 1.5 : 0, pulse = 0.7 + 0.3 * Math.sin((u.anim || 0) * 2.5);
  // the dirt it rises from
  c.fillStyle = '#4e3b29'; c.beginPath(); c.ellipse(-12, 0, 22, 5, 0, Math.PI, 0); c.fill();
  c.fillStyle = '#6b5236'; for (const [x, r] of [[-28, 3], [-20, 4], [2, 3.5], [8, 2.5]]) { c.beginPath(); c.ellipse(x, -0.5, r, r * 0.6, 0, Math.PI, 0); c.fill(); }
  // body: segments from the ground up to the head, back to front
  const seg = [[-24, -5, 7], [-19, -13, 8.5], [-12, -20, 10], [-3, -25, 11], [7, -27, 11.5]];
  for (let i = 0; i < seg.length; i++) {
    const [x, y, r] = seg[i], yy = y + wav * (i % 2 ? 1 : -1) * 0.5;
    c.fillStyle = lgrad(c, x, yy + r, x, yy - r, [RM_FLESH[2], RM_FLESH[1]]); c.beginPath(); c.ellipse(x, yy + 2, r * 0.95, r * 0.85, 0, 0, 7); c.fill(); outline(c, 0.9); // the soft underside
    c.fillStyle = lgrad(c, x, yy - r, x, yy + r * 0.3, [T.light, T.main, T.hull]); c.beginPath(); c.ellipse(x, yy - r * 0.15, r, r * 0.72, -0.25, Math.PI * 1.02, Math.PI * 2.05); c.closePath(); c.fill(); outline(c, 1); // carapace plate
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x, yy - r * 0.2, r * 0.8, r * 0.55, -0.25, Math.PI * 1.15, Math.PI * 1.75); c.stroke(); // rim light
    if (i < seg.length - 1) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${GB_SAC},${0.55 * pulse})`; c.beginPath(); c.arc(x + r * 0.5, yy + r * 0.45, 1.8, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; } // glow sacs between plates
  }
  // bone spurs along its back
  c.fillStyle = GB_BONE; for (const [x, y] of [[-19, -21], [-12, -29], [-3, -35], [6, -37]]) { c.beginPath(); c.moveTo(x - 2, y + 2); c.lineTo(x - 3.5, y - 4); c.lineTo(x + 2, y + 1.5); c.fill(); outline(c, 0.5); }
  // the head: a ring maw of bone teeth facing forward
  const hx = 17, hy = -25, R = 9 + g * 3, open = 4.5 + g * 4 + (u.recoil || 0) * 2;
  c.fillStyle = lgrad(c, hx, hy - 12, hx, hy + 12, [RM_FLESH[0], RM_FLESH[2]]); c.beginPath(); c.ellipse(hx, hy, 9.5, 12, 0, 0, 7); c.fill(); outline(c, 1.1);
  c.fillStyle = lgrad(c, hx, hy - 12, hx, hy, [T.light, T.main]); c.beginPath(); c.ellipse(hx - 2, hy - 2, 8.5, 10, 0, Math.PI * 1.05, Math.PI * 1.75); c.closePath(); c.fill(); outline(c, 0.8); // a team crest
  c.fillStyle = '#1a0a0e'; c.beginPath(); c.ellipse(hx + 6, hy + 1, open * 0.55, open, 0, 0, 7); c.fill(); // the mouth
  if (g > 0.05) { // the gullet glows: a way through
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = `rgba(${RM_GLOW},${0.55 * g})`; c.beginPath(); c.ellipse(hx + 6, hy + 1, open * 0.45, open * 0.85, 0, 0, 7); c.fill();
    c.fillStyle = `rgba(255,255,220,${0.6 * g})`; c.beginPath(); c.ellipse(hx + 6.5, hy + 1, open * 0.18, open * 0.4, 0, 0, 7); c.fill();
    c.fillStyle = `rgba(${RM_GLOW},${0.25 * g})`; c.beginPath(); c.ellipse(hx + 9, hy + 1, open * 1.3, open * 1.6, 0, 0, 7); c.fill();
    c.globalCompositeOperation = 'source-over';
  }
  c.fillStyle = GB_BONE; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, x = hx + 6 + Math.cos(a) * open * 0.55, y = hy + 1 + Math.sin(a) * open; c.beginPath(); c.moveTo(x, y); c.lineTo(hx + 6 + Math.cos(a + 0.18) * (open * 0.55 + 3.2 + g), hy + 1 + Math.sin(a + 0.18) * (open + 3.4 + g)); c.lineTo(hx + 6 + Math.cos(a + 0.36) * open * 0.55, hy + 1 + Math.sin(a + 0.36) * open); c.fill(); }
  c.fillStyle = `rgba(${GB_SAC},0.95)`; for (const [x, y] of [[hx - 3, hy - 6], [hx - 1, hy - 8.5]]) { c.beginPath(); c.arc(x, y, 1.2, 0, 7); c.fill(); } // eyes
  if (g < 0.5) { c.fillStyle = 'rgba(190,240,140,0.7)'; c.fillRect(hx + 5.5, hy + open + 0.5, 1, 3 + ((u.anim || 0) * 3) % 3); } // drool
}

// Worldbreaker: an orb strider. A dark energy orb in an obsidian shell on four floating spike legs that never touch the
// ground. sl (0..1, live): the slam (legs and orb lift, then drive down)
function dWB2(c, T, u) {
  const t = VFX.lastT, sl = u.slamT != null && VFX.g ? clamp((t - u.slamT) / 0.55, 0, 1) : 1;
  const up = sl < 0.45 ? Math.sin(sl / 0.45 * Math.PI / 2) * 9 : sl < 0.6 ? 9 * (1 - (sl - 0.45) / 0.15) - 2 * ((sl - 0.45) / 0.15) : -2 * (1 - (sl - 0.6) / 0.4);
  const a = u.anim || 0, bob = Math.sin(a * 1.4) * 1.2, oy = -42 - up + bob, glow = 0.7 + 0.3 * Math.sin(a * 2.2);
  const legs = [[-17, -1, false], [-6, 1.5, false], [7, -1.5, true], [18, 1, true]];
  const leg = ([fx, fy, near]) => { // a spike from under the orb down to just above the ground
    const lift = up * 1.1 + (u.moving ? Math.max(0, Math.sin(a * 5 + fx)) * 3 : 0), tipY = -3 + fy - lift, tipX = fx * 1.05;
    c.strokeStyle = `rgba(${T.glow},${near ? 0.45 : 0.25})`; c.lineWidth = 0.8; c.beginPath(); c.moveTo(fx * 0.35, oy + 8); c.lineTo(tipX, tipY - 6); c.stroke(); // a thread of light
    c.fillStyle = lgrad(c, fx * 0.4, oy + 6, tipX, tipY, near ? ['#4a3f66', '#1b1628', '#0b0a12'] : ['#2f2843', '#141120', '#09080e']);
    poly(c, [[fx * 0.3 - 2.2, oy + 7], [fx * 0.3 + 2.2, oy + 7], [tipX + 1.6, tipY - 9], [tipX, tipY], [tipX - 1.6, tipY - 9]]); c.fill(); outline(c, 0.7);
    c.fillStyle = `rgba(${T.glow},0.85)`; c.beginPath(); c.arc(tipX, tipY + 1.4, 1.1, 0, 7); c.fill(); // the light under each tip
  };
  for (const L_ of legs) if (!L_[2]) leg(L_);
  // the light it stands on
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},${0.12 + 0.1 * glow})`; c.beginPath(); c.ellipse(0, -0.5, 22, 3.6, 0, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  // the orb: dark energy, swirling
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},${0.25 * glow})`; c.beginPath(); c.arc(0, oy, 16, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  const og = c.createRadialGradient(-2, oy - 3, 1, 0, oy, 12); og.addColorStop(0, '#f0e6ff'); og.addColorStop(0.25, `rgba(${T.glow},1)`); og.addColorStop(0.6, '#3a1f6a'); og.addColorStop(1, '#0d0718');
  c.fillStyle = og; c.beginPath(); c.arc(0, oy, 11, 0, 7); c.fill();
  c.strokeStyle = `rgba(${T.glow},0.8)`; c.lineWidth = 0.9; c.beginPath(); c.arc(0, oy, 7, a * 2, a * 2 + 2.4); c.stroke(); c.beginPath(); c.arc(0, oy, 4.5, -a * 3, -a * 3 + 2); c.stroke();
  // the obsidian shell: four plates around the orb, glowing seams between them
  for (let i = 0; i < 4; i++) {
    const a0 = i * Math.PI / 2 + 0.35 + Math.sin(a * 0.8) * 0.05, a1 = a0 + 1.05, r0 = 11.5, r1 = 15.5;
    c.fillStyle = lgrad(c, 0, oy - 15, 0, oy + 15, ['#544774', '#1d1830', '#09080f']);
    c.beginPath(); c.arc(0, oy, r1, a0, a1); c.arc(0, oy, r0, a1, a0, true); c.closePath(); c.fill(); outline(c, 0.8);
    c.strokeStyle = 'rgba(220,210,255,0.4)'; c.lineWidth = 0.7; c.beginPath(); c.arc(0, oy, r1 - 0.6, a0 + 0.1, a0 + 0.6); c.stroke();
  }
  c.fillStyle = T.main; for (const ang of [-1.2, 0.4, 2.0]) { c.beginPath(); c.arc(Math.cos(ang) * 13.5, oy + Math.sin(ang) * 13.5, 1.5, 0, 7); c.fill(); } // team glyph studs
  // a halo
  c.strokeStyle = `rgba(${T.glow},0.55)`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(0, oy - 18, 9, 2.4, 0, 0, 7); c.stroke();
  for (const L_ of legs) if (L_[2]) leg(L_);
}

DRAW_U.titan = dTitan2; DRAW_U.ruinmaw = dRuin2; DRAW_U.worldbreaker = dWB2;
Object.assign(SPR_BOX, { titan: [-42, -84, 94, 90], ruinmaw: [-54, -72, 112, 78], worldbreaker: [-28, -70, 56, 74] });
Object.assign(UVIS, { titan: { h: 52, w: 19 }, ruinmaw: { h: 50, w: 28 }, worldbreaker: { h: 58, w: 20 } });
// the Titan's plant share (0 mobile, 1 planted) at time t (batch 2b's times; the v2.37 siege lock's in a b2b-off game)
function titanK(u, t) {
  if (!u.siege) return 0;
  if (u.siege === 2) return 1;
  const S = VFX.g && rwB2b(VFX.g) ? TITAN : (UDEF.titan.siege || TITAN);
  return u.siege === 1 ? clamp(1 - (u.sgT - t) / S.plant, 0, 1) : clamp((u.sgT - t) / S.unplant, 0, 1);
}
const ruinGk = (u, t) => VFX.g && rwB2b(VFX.g) && u.type === 'ruinmaw' && !u.bur && !u.moving ? clamp((t - (u.gateT || 0)) / 0.5, 0, 1) : 0; // its maw opening as a gate

/* ---- effects ---- */
// Titan cover: a faint ring of its reach under each Titan, and a shimmer over each covered unit (subtle in a crowd)
function drawCoverRing(c, u, w, t) {
  const T = TEAM[u.side], R = TITAN.coverR;
  c.globalAlpha = 0.16; c.strokeStyle = T.main; c.lineWidth = 1.2; c.setLineDash([3, 5]); c.lineDashOffset = -t * 6; c.beginPath(); c.ellipse(w.x, w.y, R, R * DY, 0, 0, 7); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
  c.globalAlpha = 0.05; c.fillStyle = T.main; c.fill(); c.globalAlpha = 1;
}
function drawCovered(c, u, w, t) {
  const h = visH(u.type) * US, y = w.y - u.z, k = 0.5 + 0.5 * Math.sin(t * 3 + u.id * 1.7), T = TEAM[u.side];
  c.globalAlpha = 0.22 + 0.12 * k; c.strokeStyle = `rgb(${T.glow})`; c.lineWidth = 1;
  c.beginPath(); c.ellipse(w.x, y - h * 0.55, h * 0.42, h * 0.62, 0, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); // a thin arc of shield over it
  c.globalAlpha = 1;
}
// The Ruinmaw underground: a wide hump of churned earth with cracks glowing through it
function drawBurrowedBig(c, u, w, t) {
  const r = 15, k = 0.5 + 0.5 * Math.sin(t * 5 + u.id);
  c.fillStyle = '#463323'; c.beginPath(); c.ellipse(w.x, w.y, r * 1.7, r * 0.7, 0, Math.PI, 0); c.fill();
  c.fillStyle = '#6a5034'; c.beginPath(); c.ellipse(w.x + u.face * 4, w.y - 3, r * 1.1, r * 0.45, 0, Math.PI, 0); c.fill();
  c.strokeStyle = `rgba(${GB_SAC},${0.3 + 0.45 * k})`; c.lineWidth = 1.3; c.beginPath(); c.moveTo(w.x - 18, w.y - 1); c.lineTo(w.x - 9, w.y - 7); c.lineTo(w.x - 1, w.y - 3); c.lineTo(w.x + 7, w.y - 8); c.lineTo(w.x + 16, w.y - 2); c.stroke();
  c.fillStyle = '#8a6a46'; for (let i = 0; i < 5; i++) { const q = ((t * 2.5 + i / 5 + u.id * 0.13) % 1); c.globalAlpha = 1 - q; c.fillRect(w.x + u.face * (12 + q * 10) - 1.5, w.y - 4 - Math.sin(q * Math.PI) * 9, 3, 3); }
  c.globalAlpha = 1;
}
// The tunnel entrance (the owner's side, while one of its Ruinmaws is a gate, or units are on their way in)
function drawTunnelMouths(c, g, t) {
  for (let s = 0; s < 2; s++) {
    if (s !== myS() && !g.spectate) continue;
    const R = tunnelGate(g, s), coming = g.ents.some(e => e.side === s && e.tn && e.hp > 0); if (!R && !coming) continue;
    const E = tunnelEntrance(g, s), w = P(E.u, E.v), k = 0.5 + 0.5 * Math.sin(t * 3);
    c.fillStyle = '#3a2a1c'; c.beginPath(); c.ellipse(w.x, w.y, 17, 7, 0, 0, 7); c.fill();
    c.fillStyle = '#0d0806'; c.beginPath(); c.ellipse(w.x, w.y + 0.5, 12, 4.6, 0, 0, 7); c.fill();
    if (R) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${RM_GLOW},${0.25 + 0.2 * k})`; c.beginPath(); c.ellipse(w.x, w.y + 0.5, 9, 3.2, 0, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; }
    c.strokeStyle = TEAM[s].main; c.lineWidth = 1.4; c.globalAlpha = 0.8; c.beginPath(); c.ellipse(w.x, w.y, 17, 7, 0, 0, 7); c.stroke(); c.globalAlpha = 1;
    if (R && s === myS()) { const r = P(R.u, R.v); c.globalAlpha = 0.25; c.strokeStyle = `rgb(${RM_GLOW})`; c.lineWidth = 1; c.setLineDash([2, 6]); c.lineDashOffset = -t * 12; c.beginPath(); c.moveTo(w.x, w.y); c.lineTo(r.x, r.y); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0; c.globalAlpha = 1; } // the way through, faintly
  }
}
// A unit going in (inn) or coming out: a burst of dirt and a green glow
function drawEmerge(c, f) {
  const k = f.t / f.life, out = f.inn ? 1 - k : k;
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.acid, f.x, f.y - 6, 14 * (0.6 + out * 0.6), 0.7 * (1 - k)); c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1 - k; c.fillStyle = '#6e5538';
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, d = 4 + 12 * out; c.fillRect(f.x + Math.cos(a) * d - 1.2, f.y + Math.sin(a) * d * 0.4 - Math.sin(out * Math.PI) * 9 - 1.2, 2.4, 2.4); }
  c.strokeStyle = '#8a6a46'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(f.x, f.y, 6 + 8 * out, (6 + 8 * out) * 0.4, 0, 0, 7); c.stroke(); c.globalAlpha = 1;
}
// Worldbreaker cracks: a glowing jagged line racing from its feet to the end, the front throwing up shards; the crack
// glows on for a moment after it stops. Ridges: floating obsidian slabs with glyph glow that rise, hold and fade.
const RUPV = new WeakMap(); // game → [{ r, end }] cracks seen, kept while they fade
function rupSeen(g) {
  let a = RUPV.get(g); if (!a) { a = []; RUPV.set(g, a); }
  for (const r of g.rup || []) if (!a.some(x => x.r.id === r.id)) a.push({ r: Object.assign({}, r, { hit: null }) });
  const now = g.t; for (let i = a.length - 1; i >= 0; i--) { const x = a[i], done = x.r.t0 + x.r.len / WB.speed; if (now - done > 1.2 || x.r.t0 > now + 0.01) a.splice(i, 1); }
  return a;
}
const jag = (id, i) => (((id * 97 + i * 131) % 17) / 17 - 0.5) * 2; // a fixed wobble per crack and point
function drawRuptures(c, g, lit) {
  if (!VFX.g || !rwB2b(g)) return;
  drawRidgeBase(c, g, lit);
  const a = rupSeen(g); if (!a.length) return;
  for (const { r } of a) {
    const front = Math.min(r.len, (g.t - r.t0) * WB.speed), done = r.t0 + r.len / WB.speed, fade = g.t > done ? 1 - (g.t - done) / 1.2 : 1;
    if (front <= 0 || fade <= 0) continue;
    if (r.side !== myS() && !g.spectate && !lit(r.su + r.du * front, r.sv + r.dv * front) && !lit(r.su, r.sv)) continue;
    const T = TEAM[r.side], n = Math.max(2, Math.ceil(front / 9)), pts = [];
    for (let i = 0; i <= n; i++) { const d = front * i / n, o = i && i < n ? jag(r.id, i) * 4 : 0, w = P(r.su + r.du * d - r.dv * o, r.sv + r.dv * d + r.du * o); pts.push(w); }
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.globalAlpha = 0.7 * fade; c.strokeStyle = '#120c1c'; c.lineWidth = 12; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke(); // the split in the ground
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * fade; c.strokeStyle = `rgba(${T.glow},0.8)`; c.lineWidth = 18; c.stroke(); // its glow on the ground
    c.globalAlpha = 0.95 * fade; c.strokeStyle = `rgba(${T.glow},0.95)`; c.lineWidth = 5; c.stroke();
    c.strokeStyle = 'rgba(255,245,255,0.95)'; c.lineWidth = 2; c.stroke();
    for (let i = 1; i < n; i += 2) { const p = pts[i], s = jag(r.id, i + 7); c.strokeStyle = `rgba(${T.glow},0.6)`; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + s * 6, p.y + (i % 4 ? 3 : -3)); c.stroke(); } // side cracks
    if (front < r.len) { const p = pts[pts.length - 1]; stamp(c, GLOW['t' + r.side], p.x, p.y - 4, 16, 0.9); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#2a2140'; for (let i = 0; i < 4; i++) { const q = ((g.t * 6 + i / 4) % 1); c.fillRect(p.x + jag(r.id, i) * 6 - 1.5, p.y - 2 - q * 14, 3, 3); } }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.lineCap = 'butt'; c.lineJoin = 'miter';
  }
}
// the ground under a ridge: a dark fissure with a glow, so its whole length reads
function drawRidgeBase(c, g, lit) {
  if (!g.rdg) return;
  for (const R of g.rdg) {
    const k = Math.min(clamp((g.t - R.t0) / WB.rise, 0, 1), clamp((R.t1 - g.t) / 0.6, 0, 1)); if (k <= 0) continue;
    if (R.side !== myS() && !g.spectate && !lit((R.au + R.bu) / 2, (R.av + R.bv) / 2)) continue;
    const a = P(R.au, R.av), b = P(R.bu, R.bv), T = TEAM[R.side];
    c.lineCap = 'round'; c.globalAlpha = 0.6 * k; c.strokeStyle = '#0d0a16'; c.lineWidth = 16; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * k; c.strokeStyle = `rgba(${T.glow},0.9)`; c.lineWidth = 4; c.stroke(); c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1; c.lineCap = 'butt';
  }
}
// a ridge as slabs for the back-to-front list (each slab is drawn in its place among the units)
function ridgeSlabs(g, list, lit) {
  if (!rwB2b(g) || !g.rdg) return;
  for (const R of g.rdg) {
    const lu = R.bu - R.au, lv = R.bv - R.av, ll = Math.hypot(lu, lv), n = Math.max(2, Math.round(ll / 12));
    for (let i = 0; i < n; i++) { const k = (i + 0.5) / n, u = R.au + lu * k, v = R.av + lv * k; if (R.side === myS() || g.spectate || lit(u, v)) list.push({ kind: 'slab', u, v, R, i }); }
  }
}
function drawSlab(c, g, e) {
  const R = e.R, t = g.t, rise = clamp((t - R.t0) / WB.rise, 0, 1), fade = clamp((R.t1 - t) / 0.6, 0, 1), k = Math.min(1 - (1 - rise) * (1 - rise), fade);
  if (k <= 0) return;
  const w = P(e.u, e.v), T = TEAM[R.side], s = jag(R.id, e.i), h = (8 + (e.i % 3) * 2.5 + s * 1.5) * k, wd = 10 + (e.i % 2) * 3, fl = 1.5 + Math.sin(t * 2 + e.i) * 0.8;
  w.x += (e.i % 2 ? 3 : -3) + s * 1.5; // staggered, a jagged band
  c.fillStyle = `rgba(0,0,0,${0.3 * k})`; c.beginPath(); c.ellipse(w.x, w.y, wd + 2, 2.6, 0, 0, 7); c.fill();
  c.globalAlpha = k;
  const y0 = w.y - fl, tilt = s * 2;
  c.fillStyle = lgrad(c, w.x - wd, y0 - h, w.x + wd, y0, ['#5a4c80', '#1c1730', '#08070d']);
  poly(c, [[w.x - wd, y0], [w.x - wd * 0.8 + tilt, y0 - h * 0.85], [w.x + tilt * 0.5, y0 - h], [w.x + wd * 0.85 + tilt, y0 - h * 0.7], [w.x + wd, y0]]); c.fill(); outline(c, 0.8);
  c.strokeStyle = `rgba(230,220,255,${0.5 * k})`; c.lineWidth = 0.8; c.beginPath(); c.moveTo(w.x - wd * 0.8 + tilt, y0 - h * 0.85); c.lineTo(w.x + tilt * 0.5, y0 - h); c.stroke(); // rim light
  c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${T.glow},${0.85 * k})`; c.lineWidth = 1; // glyphs
  c.beginPath(); c.moveTo(w.x - 2 + tilt * 0.4, y0 - h * 0.62); c.lineTo(w.x + 1.5 + tilt * 0.4, y0 - h * 0.5); c.lineTo(w.x - 1.5 + tilt * 0.3, y0 - h * 0.36); c.moveTo(w.x + tilt * 0.2, y0 - h * 0.25); c.lineTo(w.x + tilt * 0.2, y0 - h * 0.12); c.stroke();
  c.fillStyle = `rgba(${T.glow},${0.25 * k})`; c.beginPath(); c.ellipse(w.x, w.y - 0.5, wd, 1.6, 0, 0, 7); c.fill(); // the light holding it up
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
