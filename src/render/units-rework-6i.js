/* ---------- Batch 6i art (v2.99, docs/FACTION_REWORK.md "Batch 6i"; the Bloomhost style of batches 5b and 6h, strong team colour) ----------
   The Razorwing flock bird (the liked batch 5b bat-wing Razorwing, smaller, its wing membranes in its side's colour), the Gnatcloud
   (particles: a churning cloud of specks, a share in its side's colour, a glowing heart; drawn live, a few dozen dots), the
   Blightwing (a bloated moth with team eye-spots and glowing team spore sacs), the Talonmaw (a big raptor with team wing membranes
   and hooked talons) and the Skywyrm (a huge serpent: team plates down its back, tendrils, an acid-dripping maw). Flock birds,
   Blightwings and Talonmaws are cached as aircraft poses (AIR_CYC, AIR_BOX); the Gnatcloud and the Skywyrm draw live.
   Effects: the Snatch (the prey hanging in the talons, shrinking as it is eaten), the drop, Rend (three slashes and a team scar on
   the target while it lasts), Blight (green spores drifting up from a blighted unit; Mites bursting out), the spore cone, the
   tendril drag (a writhing tendril from the jaws to the aircraft), the Skywyrm's acid spew (a lobbed glob, a splash). */
const W6_FLESH = ['#9a6a7c', '#64394f', '#361c2b'], W6_MOTH = ['#b39a7a', '#7d6650', '#45362a'];

/* ---- the Razorwing flock bird ---- */
function dRazor6(c, T, u) {
  const t = u.anim || 0, fl = Math.sin(t * 15), dive = u.recoil || 0;
  c.save(); c.scale(0.72, 0.72);
  const wing = (near) => {
    const a = near ? fl : -fl * 0.8, sh = [2, -3], el = [-6, -12 - a * 5], tips = [[-20, -18 - a * 9], [-24, -10 - a * 6], [-21, -2 - a * 2]];
    c.fillStyle = near ? lgrad(c, 0, -18, -20, 0, [T.light, T.main, T.hull]) : T.hull;
    c.globalAlpha = near ? 0.95 : 0.8;
    c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); c.lineTo(tips[0][0], tips[0][1]); c.quadraticCurveTo(-19, -14 - a * 7, tips[1][0], tips[1][1]); c.quadraticCurveTo(-18, -7 - a * 4, tips[2][0], tips[2][1]); c.quadraticCurveTo(-8, -2, sh[0], sh[1] + 3); c.closePath(); c.fill(); outline(c, 0.7);
    c.globalAlpha = 1;
    c.strokeStyle = SW_BONE; c.lineWidth = near ? 1.2 : 0.9; c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); for (const p of tips) { c.moveTo(el[0], el[1]); c.lineTo(p[0], p[1]); } c.stroke();
  };
  wing(false);
  c.fillStyle = lgrad(c, 0, -5, 0, 4, [W6_FLESH[0], W6_FLESH[2]]); c.beginPath(); c.moveTo(14, -1); c.quadraticCurveTo(6, -6, -8, -3); c.quadraticCurveTo(-16, -1, -22, 2); c.quadraticCurveTo(-12, 3, -2, 3.4); c.quadraticCurveTo(8, 3, 14, -1); c.fill(); outline(c, 0.8);
  c.fillStyle = lgrad(c, 0, -6, 0, -1, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(12, -2); c.quadraticCurveTo(4, -7, -14, -2.4); c.quadraticCurveTo(0, -3, 12, -2); c.fill(); outline(c, 0.6);
  const tx = 4 + dive * 6, ty = 6 + dive * 2;
  swLeg(c, [[0, 2], [2 + dive * 3, 5], [tx, ty]], 1.3, W6_FLESH[1]);
  c.strokeStyle = SW_BONE; c.lineWidth = 1; for (const k of [-1.2, 0, 1.2]) { c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + 2.5, ty + k - 0.5, tx + 3, ty + k + 1.5); c.stroke(); }
  c.fillStyle = W6_FLESH[1]; c.beginPath(); c.ellipse(14, -1.2, 3.2, 2.2, 0.1, 0, 7); c.fill(); outline(c, 0.6);
  c.fillStyle = T.main; poly(c, [[12, -3], [9, -7.5], [13.5, -3.4]]); c.fill(); outline(c, 0.4);
  c.fillStyle = SW_BONE; poly(c, [[16.5, -0.6], [20 + dive * 2, 0.6], [16.4, 0.8]]); c.fill();
  swGlow(c, T, 15, -1.8, 0.8, 1);
  wing(true);
  c.restore();
}

/* ---- the Gnatcloud: particles ---- */
const GN6_N = 46;
function dGnat6(c, T, u) {
  const t = (u.anim || 0) + (u.id || 0) * 0.37, R = 21, hot = u.gnT6 != null && VFX.g && VFX.g.t - u.gnT6 < 0.2;
  c.save(); c.globalCompositeOperation = 'lighter';
  const gr = c.createRadialGradient(0, -6, 1, 0, -6, R * 0.9); gr.addColorStop(0, `rgba(${T.glow},${hot ? 0.38 : 0.26})`); gr.addColorStop(1, `rgba(${T.glow},0)`);
  c.fillStyle = gr; c.beginPath(); c.ellipse(0, -6, R, R * 0.6, 0, 0, 7); c.fill();
  c.globalCompositeOperation = 'source-over';
  for (let i = 0; i < GN6_N; i++) { // each speck orbits its own small loop inside the cloud
    const a = i * 2.39996, r0 = R * Math.sqrt((i + 0.5) / GN6_N), sp = 2.2 + (i % 5) * 0.6, ph = t * sp + i;
    const x = Math.cos(a) * r0 + Math.cos(ph) * 3.2, y = -6 + Math.sin(a) * r0 * 0.58 + Math.sin(ph * 1.3) * 2.4;
    c.fillStyle = i % 3 === 0 ? T.light : i % 3 === 1 ? T.main : '#20141b';
    const s = i % 4 === 0 ? 1.5 : 1.05; c.fillRect(x - s / 2, y - s / 2, s, s);
  }
  c.restore();
}

/* ---- the Blightwing: a bloated spore moth ---- */
function dBlight6(c, T, u) {
  const t = u.anim || 0, fl = Math.sin(t * 7), pulse = 0.7 + 0.3 * Math.sin(t * 3), rec = u.recoil || 0;
  const wing = (near, hind) => {
    const a = (near ? fl : -fl * 0.7) * (hind ? 0.7 : 1), x0 = hind ? -6 : 0, len = hind ? 15 : 20, ty = -8 - a * 8 - (hind ? 0 : 6);
    c.fillStyle = near ? lgrad(c, x0, ty, x0 - len, -4, [W6_MOTH[0], W6_MOTH[1]]) : W6_MOTH[2]; c.globalAlpha = near ? 0.95 : 0.8;
    c.beginPath(); c.moveTo(x0 + 2, -6); c.quadraticCurveTo(x0 - len * 0.4, ty - 6, x0 - len, ty + 2); c.quadraticCurveTo(x0 - len * 0.9, -2, x0 - 2, -3); c.closePath(); c.fill(); outline(c, 0.7); c.globalAlpha = 1;
    if (near) { // a team eye-spot on the wing
      const ex = x0 - len * 0.55, ey = (ty - 6) * 0.5 - 1; c.fillStyle = T.hull; c.beginPath(); c.ellipse(ex, ey, 3.6, 2.6, 0.3, 0, 7); c.fill();
      c.fillStyle = T.main; c.beginPath(); c.ellipse(ex, ey, 2.6, 1.8, 0.3, 0, 7); c.fill(); swGlow(c, T, ex, ey, 0.9, 0.8 * pulse);
    }
  };
  wing(false, true); wing(false, false);
  // the bloated abdomen with spore sacs in its side's colour
  c.fillStyle = lgrad(c, 0, -14, 0, 6, [W6_FLESH[0], W6_FLESH[1], W6_FLESH[2]]); c.beginPath(); c.ellipse(-8, -2, 12 + rec, 7.5, 0.12, 0, 7); c.fill(); outline(c, 1);
  for (const [x, y, r] of [[-14, 1, 3], [-8, 3.5, 3.4], [-2, 2, 2.6], [-11, -4, 2.2]]) {
    c.fillStyle = lgrad(c, x, y - r, x, y + r, [T.light, T.main, T.hull]); c.beginPath(); c.arc(x, y, r * (0.9 + 0.1 * pulse), 0, 7); c.fill(); outline(c, 0.5);
    swGlow(c, T, x - r * 0.3, y - r * 0.3, r * 0.35, 0.7 * pulse);
  }
  // the furry thorax and head
  c.fillStyle = lgrad(c, 4, -10, 4, 2, [W6_MOTH[0], W6_MOTH[2]]); c.beginPath(); c.ellipse(5, -4, 6.5, 5.5, 0, 0, 7); c.fill(); outline(c, 0.8);
  c.fillStyle = W6_MOTH[1]; c.beginPath(); c.ellipse(11, -4, 3.6, 3.2, 0, 0, 7); c.fill(); outline(c, 0.6);
  swGlow(c, T, 12.6, -5, 0.9, 1);
  c.strokeStyle = W6_MOTH[2]; c.lineWidth = 0.8; c.beginPath(); c.moveTo(12, -7); c.quadraticCurveTo(15, -13, 19, -12); c.moveTo(11, -7); c.quadraticCurveTo(12, -14, 15, -15); c.stroke(); // feathered antennae
  // a spore puff from its mouth when it fires
  if (rec > 0.05) { c.fillStyle = `rgba(170,230,110,${0.6 * rec})`; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(15 + i * 3 * (1 + rec), -3 + Math.sin(i * 2) * 2, 1.8 + i * 0.4, 0, 7); c.fill(); } }
  wing(true, true); wing(true, false);
}

/* ---- the Talonmaw: a raptor of the swarm ---- */
function dTalon6(c, T, u) {
  const t = u.anim || 0, fl = Math.sin(t * 8), rec = u.recoil || 0, dive = Math.max(rec, u.tdv6 != null && VFX.g && u.tdv6 > VFX.g.t ? 0.7 : 0);
  const wing = (near) => {
    const a = near ? fl : -fl * 0.8, sh = [4, -6], el = [-8, -20 - a * 8 + dive * 6], tip = [-34, -26 - a * 12 + dive * 10], tip2 = [-38, -12 - a * 6 + dive * 4], tip3 = [-28, -2 - a * 2];
    c.fillStyle = near ? lgrad(c, 0, -26, -34, -2, [T.light, T.main, T.hull]) : T.hull; c.globalAlpha = near ? 0.96 : 0.8;
    c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); c.lineTo(tip[0], tip[1]); c.quadraticCurveTo(-30, -18 - a * 9, tip2[0], tip2[1]); c.quadraticCurveTo(-30, -8 - a * 3, tip3[0], tip3[1]); c.quadraticCurveTo(-12, -2, sh[0], sh[1] + 4); c.closePath(); c.fill(); outline(c, 0.9);
    c.globalAlpha = 1;
    c.strokeStyle = SW_BONE; c.lineWidth = near ? 1.6 : 1.1; c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); c.lineTo(tip[0], tip[1]); c.moveTo(el[0], el[1]); c.lineTo(tip2[0], tip2[1]); c.moveTo(el[0], el[1]); c.lineTo(tip3[0], tip3[1]); c.stroke();
    c.fillStyle = SW_BONE; poly(c, [[el[0], el[1]], [el[0] + 3, el[1] - 4], [el[0] + 2, el[1] + 1]]); c.fill(); // a wing claw
  };
  wing(false);
  // tail feathers of chitin
  c.fillStyle = T.hull; poly(c, [[-14, -3], [-30, -6], [-28, 1], [-31, 5], [-14, 3]]); c.fill(); outline(c, 0.7);
  // the body: a lean, muscled torso; team carapace down the back
  c.fillStyle = lgrad(c, 0, -10, 0, 6, [W6_FLESH[0], W6_FLESH[1], W6_FLESH[2]]); c.beginPath(); c.moveTo(16, -5); c.quadraticCurveTo(6, -12, -14, -4); c.quadraticCurveTo(-6, 6, 10, 4); c.quadraticCurveTo(16, 1, 16, -5); c.fill(); outline(c, 1);
  swPlate(c, T, -12, -2, -4, 4.6, 0.7); swPlate(c, T, -4, 6, -6, 5, 0.7); swPlate(c, T, 4, 13, -6.5, 4, 0.7);
  // hooked talons, thrust forward in a dive
  const tx = 8 + dive * 8, ty = 10 + dive * 2;
  swLeg(c, [[2, 3], [5 + dive * 4, 8], [tx, ty]], 2, W6_FLESH[1]); swLeg(c, [[-3, 3], [-1 + dive * 3, 9], [tx - 5, ty + 1]], 1.8, W6_FLESH[2]);
  c.strokeStyle = SW_BONE; c.lineWidth = 1.3; c.lineCap = 'round';
  for (const [x, y] of [[tx, ty], [tx - 5, ty + 1]]) for (const k of [-1.6, 0, 1.6]) { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 4, y + k - 1, x + 3.4, y + k + 3); c.stroke(); }
  c.lineCap = 'butt';
  // the head: a hooked beak, a crest in its side's colour, glowing eyes
  c.fillStyle = W6_FLESH[1]; c.beginPath(); c.ellipse(19, -7, 5, 4, -0.2, 0, 7); c.fill(); outline(c, 0.8);
  c.fillStyle = T.main; poly(c, [[16, -10], [9, -16], [12, -9.5], [7, -12], [15, -8]]); c.fill(); outline(c, 0.5);
  c.fillStyle = SW_BONE; c.beginPath(); c.moveTo(22, -9); c.quadraticCurveTo(29 + rec * 2, -8, 27, -3); c.quadraticCurveTo(25, -5, 22, -5); c.closePath(); c.fill(); outline(c, 0.5);
  swGlow(c, T, 20.5, -8, 1.1, 1);
  wing(true);
}

/* ---- the Skywyrm: a huge serpent ---- */
function dWyrm6(c, T, u) {
  const t = u.anim || 0, rec = u.recoil || 0, jaw = Math.max(rec, u.jwT6 != null && VFX.g && VFX.g.t - u.jwT6 < 0.3 ? 1 - (VFX.g.t - u.jwT6) / 0.3 : 0);
  const N = 11, pts = [];
  for (let i = 0; i <= N; i++) { const k = i / N, x = 26 - k * 84, y = -10 + Math.sin(t * 2 - k * 5) * 6 * (0.3 + k); pts.push([x, y, 9 - k * 6.5]); }
  // the tendrils hanging from its throat, writhing
  c.lineCap = 'round';
  for (let j = 0; j < 4; j++) { const x0 = 18 - j * 6, w = Math.sin(t * 3 + j * 1.7); c.strokeStyle = OUTL; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x0, -4); c.quadraticCurveTo(x0 - 4 + w * 4, 8, x0 + w * 6, 18 + j * 2); c.stroke(); c.strokeStyle = j % 2 ? W6_FLESH[1] : T.hull; c.lineWidth = 1.4; c.stroke(); }
  // the body from the tail forward: segments, a team plate on each
  for (let i = N; i >= 1; i--) {
    const [x, y, r] = pts[i], [x2, y2] = pts[i - 1];
    c.fillStyle = lgrad(c, x, y - r, x, y + r, [W6_FLESH[0], W6_FLESH[1], W6_FLESH[2]]); c.beginPath(); c.ellipse((x + x2) / 2, (y + y2) / 2, 5.4 + r * 0.3, r, Math.atan2(y2 - y, x2 - x), 0, 7); c.fill(); outline(c, 0.8);
    c.fillStyle = lgrad(c, x, y - r - 2, x, y, [T.light, T.main, T.hull]); c.beginPath(); c.ellipse((x + x2) / 2, (y + y2) / 2 - r * 0.45, 4.6 + r * 0.2, r * 0.55, Math.atan2(y2 - y, x2 - x), Math.PI, 0); c.fill(); outline(c, 0.5);
    if (i % 2) swGlow(c, T, (x + x2) / 2, (y + y2) / 2 + r * 0.3, 0.9, 0.7);
  }
  // fins along its back
  for (let i = 2; i < N; i += 2) { const [x, y, r] = pts[i]; c.fillStyle = T.main; poly(c, [[x + 3, y - r * 0.8], [x - 2, y - r - 7 - Math.sin(t * 3 + i) * 1.5], [x - 4, y - r * 0.7]]); c.fill(); outline(c, 0.5); }
  // the head: a wide maw with fangs, acid dripping
  const [hx, hy] = pts[0], o = 2 + jaw * 5;
  c.fillStyle = lgrad(c, hx, hy - 12, hx, hy + 6, [W6_FLESH[0], W6_FLESH[2]]); c.beginPath(); c.moveTo(hx - 8, hy - 9); c.quadraticCurveTo(hx + 8, hy - 15, hx + 22, hy - 4 - o * 0.5); c.lineTo(hx + 6, hy - 1); c.quadraticCurveTo(hx - 2, hy + 4, hx - 8, hy + 6); c.closePath(); c.fill(); outline(c, 1);
  c.fillStyle = W6_FLESH[1]; c.beginPath(); c.moveTo(hx + 4, hy + 1); c.quadraticCurveTo(hx + 14, hy + 2 + o, hx + 20, hy + o); c.quadraticCurveTo(hx + 8, hy + 8 + o, hx - 6, hy + 6); c.closePath(); c.fill(); outline(c, 0.8);
  c.fillStyle = 'rgba(160,235,90,0.85)'; c.beginPath(); c.moveTo(hx + 6, hy - 1); c.lineTo(hx + 20, hy - 3 - o * 0.4); c.lineTo(hx + 19, hy + o); c.closePath(); c.fill(); // the acid in its maw
  c.fillStyle = SW_BONE; for (let i = 0; i < 4; i++) { const x = hx + 7 + i * 3.4; poly(c, [[x, hy - 2.5 - i * 0.4], [x + 1.2, hy + 1.5], [x + 2.2, hy - 2.8 - i * 0.4]]); c.fill(); poly(c, [[x, hy + o + 0.5], [x + 1.2, hy - 2 + o], [x + 2.2, hy + o + 0.4]]); c.fill(); }
  c.fillStyle = T.main; poly(c, [[hx - 6, hy - 9], [hx - 14, hy - 17], [hx - 2, hy - 11], [hx - 6, hy - 19], [hx + 2, hy - 12]]); c.fill(); outline(c, 0.5); // a team crest
  swGlow(c, T, hx + 6, hy - 8, 1.4, 1);
  const dr = (t * 1.6) % 1; c.fillStyle = `rgba(170,240,100,${0.9 - dr * 0.6})`; c.beginPath(); c.ellipse(hx + 14, hy + 3 + o + dr * 9, 0.9, 1.6, 0, 0, 7); c.fill(); // a drip of acid
  c.lineCap = 'butt';
}

/* ---- registration ---- */
Object.assign(DRAW_U, { razor6: dRazor6, gnatcloud: dGnat6, blightwing: (c, T, u) => { c.save(); c.scale(1.3, 1.3); dBlight6(c, T, u); c.restore(); }, talonmaw: dTalon6, skywyrm: dWyrm6 });
Object.assign(AIR_CYC, { razor6: [15, 8], blightwing: [7, 10], talonmaw: [8, 10] });
Object.assign(AIR_BOX, { razor6: [-21, -24, 40, 34], blightwing: [-34, -31, 64, 48], talonmaw: [-42, -46, 76, 66] });
Object.assign(UVIS, { razor6: { h: 8, w: 9 }, gnatcloud: { h: 14, w: 20 }, blightwing: { h: 12, w: 14 }, talonmaw: { h: 16, w: 18 }, skywyrm: { h: 22, w: 34 } });

/* ---- projectiles: the Skywyrm's acid spew ---- */
function drawSpew6(c, p, a, b) {
  const T = TEAM[p.side];
  c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(150,230,80,0.45)'; c.lineWidth = 3 * US; c.lineCap = 'round'; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  c.globalCompositeOperation = 'source-over'; c.fillStyle = '#a6e35a'; c.beginPath(); c.arc(b.x, b.y, 3.4 * US, 0, 7); c.fill(); outline(c, 0.6);
  c.fillStyle = T.light; c.beginPath(); c.arc(b.x - 1, b.y - 1, 1.3 * US, 0, 7); c.fill();
  c.restore();
}

/* ---- on a unit (drawUnit): the prey in a Talonmaw's talons, a tendril, Blight's spores, a Rend scar, a Gnatcloud's ground haze ---- */
function drawUnit6i(c, g, u, w, t) {
  if (u.type === 'gnatcloud') { const T = TEAM[u.side]; c.save(); c.globalAlpha = 0.14; c.fillStyle = T.main; c.beginPath(); c.ellipse(w.x, w.y, B6I.gnat.r * US, B6I.gnat.r * DY * US, 0, 0, 7); c.fill(); c.restore(); }
  if (u.snV6) { const V = ctlEnt(g, u.snV6); if (V && V.sn6 && V.hp > 0) { // the prey hanging in the talons, shrinking as it is eaten
    const k = Math.max(0.35, V.hp / V.maxHp), y = w.y - u.z + 10 * US;
    c.save(); c.translate(w.x + u.face * 8 * US, y); c.rotate(u.face * 0.5 + Math.sin(t * 9 + u.id) * 0.15); c.scale(u.face * US * 0.65 * (0.6 + 0.4 * k), US * 0.65 * (0.6 + 0.4 * k)); c.translate(0, 12);
    drawUnitArt(c, V, TEAM[V.side]); c.restore();
    c.save(); c.fillStyle = 'rgba(150,20,30,0.7)'; for (let i = 0; i < 2; i++) { const dr = (t * 2 + i * 0.5) % 1; c.beginPath(); c.arc(w.x + u.face * 8 * US, y + 8 * US + dr * 16, 1.1, 0, 7); c.fill(); } c.restore(); } }
  if (u.drV6) { const V = ctlEnt(g, u.drV6); if (V && V.dr6) { // a tendril from the jaws to the dragged aircraft
    const a = P(u.u + u.face * 22, u.v, u.z - 4), b = P(V.u, V.v, V.z), T = TEAM[u.side], mx = (a.x + b.x) / 2 + Math.sin(t * 12) * 6, my = (a.y + b.y) / 2 + 14;
    c.save(); c.lineCap = 'round'; c.strokeStyle = OUTL; c.lineWidth = 3.6; c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(mx, my, b.x, b.y); c.stroke(); c.strokeStyle = W6_FLESH[0]; c.lineWidth = 2.2; c.stroke();
    c.strokeStyle = T.main; c.lineWidth = 1; c.setLineDash([3, 4]); c.stroke(); c.restore(); } }
  if (u.bl6T > t) { // blighted: green spores drifting up
    const h = (UVIS[u.type] ? UVIS[u.type].h : UDEF[u.type].h) * US;
    c.save(); for (let i = 0; i < 5; i++) { const k = ((t * 0.7 + i * 0.2 + u.id * 0.13) % 1), x = w.x + Math.sin(i * 2.1 + t * 2 + u.id) * 6 * US, y = w.y - u.z - h * 0.4 - k * 18 * US; c.globalAlpha = 0.75 * (1 - k); c.fillStyle = i % 2 ? '#b8f070' : '#7cc94a'; c.beginPath(); c.arc(x, y, (1.1 + k * 1.3) * US, 0, 7); c.fill(); } c.restore();
  }
  if (u.rn6T > t) { // rent: a raw scar in the Talonmaw side's colour
    const h = (UVIS[u.type] ? UVIS[u.type].h : UDEF[u.type].h) * US, T = TEAM[1 - u.side] || TEAM[0];
    c.save(); c.globalAlpha = 0.5 + 0.2 * Math.sin(t * 8); c.strokeStyle = T.light; c.lineWidth = 1.4; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(w.x - 5 * US + i * 3 * US, w.y - u.z - h * 0.8); c.lineTo(w.x - 1 * US + i * 3 * US, w.y - u.z - h * 0.35); c.stroke(); } c.restore();
  }
}

/* ---- one-shot effects (g.fx), drawn through FX6H ---- */
Object.assign(FX6H, {
  cone6i: (c, f) => { const k = f.t / f.life, R = f.r * US * (0.4 + 0.6 * k); c.save(); c.globalAlpha = 0.45 * (1 - k); const gr = c.createRadialGradient(f.x, f.y, 2, f.x, f.y, R); gr.addColorStop(0, 'rgba(190,245,120,0.9)'); gr.addColorStop(1, 'rgba(110,180,60,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(f.x, f.y); c.arc(f.x, f.y, R, f.a - f.half, f.a + f.half); c.closePath(); c.fill();
    c.fillStyle = 'rgba(210,255,150,0.8)'; for (let i = 0; i < 10; i++) { const a = f.a - f.half + (i / 9) * f.half * 2, r = R * (0.5 + ((i * 37) % 10) / 20); c.beginPath(); c.arc(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, 1.4, 0, 7); c.fill(); } c.restore(); },
  blightpop6i: (c, f) => { const k = f.t / f.life, T = TEAM[f.side]; c.save(); c.globalAlpha = 1 - k; for (let i = 0; i < 8; i++) { const a = i * 0.785, r = 3 + k * 16; c.fillStyle = i % 2 ? T.light : '#a6e35a'; c.beginPath(); c.arc(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.6, 2 * (1 - k) + 0.6, 0, 7); c.fill(); } c.restore(); },
  snatch6i: (c, f) => { const k = f.t / f.life; c.save(); c.globalAlpha = 0.7 * (1 - k); c.fillStyle = '#b8a68a'; for (let i = 0; i < 6; i++) { const a = i * 1.05; c.beginPath(); c.arc(f.x + Math.cos(a) * (4 + k * 12), f.y + Math.sin(a) * (2 + k * 5), 2.2 * (1 - k) + 0.5, 0, 7); c.fill(); } c.restore(); },
  drop6i: (c, f) => { const k = f.t / f.life; c.save(); c.globalAlpha = 0.7 * (1 - k); c.strokeStyle = '#d8c8a8'; c.lineWidth = 2; c.beginPath(); c.ellipse(f.x, f.y, 6 + k * 14, (6 + k * 14) * DY, 0, 0, 7); c.stroke(); c.restore(); },
  rend6i: (c, f) => { const k = f.t / f.life, T = TEAM[f.side]; c.save(); c.globalAlpha = 1 - k; c.strokeStyle = T.light; c.lineWidth = 2.2; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const x = f.x + (i - 1) * 4; c.beginPath(); c.moveTo(x - f.face * 6, f.y - 8); c.lineTo(x + f.face * 6, f.y + 6); c.stroke(); } c.restore(); },
  bite6i: (c, f) => { const k = f.t / f.life; c.save(); c.globalAlpha = 0.9 * (1 - k); c.strokeStyle = '#f2e6c8'; c.lineWidth = 2; c.beginPath(); c.arc(f.x, f.y, 6 + k * 6, -0.8, 0.8); c.stroke(); c.beginPath(); c.arc(f.x, f.y, 6 + k * 6, Math.PI - 0.8, Math.PI + 0.8); c.stroke(); c.restore(); },
  spew6i: (c, f) => { const k = f.t / f.life, R = f.r * US * (0.5 + 0.5 * k); c.save(); c.globalAlpha = 0.6 * (1 - k); const gr = c.createRadialGradient(f.x, f.y, 1, f.x, f.y, R); gr.addColorStop(0, 'rgba(200,255,120,0.95)'); gr.addColorStop(0.6, 'rgba(120,200,60,0.6)'); gr.addColorStop(1, 'rgba(60,120,30,0)'); c.fillStyle = gr; c.beginPath(); c.ellipse(f.x, f.y, R, R * DY, 0, 0, 7); c.fill();
    const T = TEAM[f.side]; c.strokeStyle = T.main; c.lineWidth = 1.2; c.setLineDash([4, 4]); c.beginPath(); c.ellipse(f.x, f.y, R * 0.9, R * DY * 0.9, 0, 0, 7); c.stroke(); c.restore(); },
});
