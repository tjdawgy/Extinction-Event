/* ---------- Faction rework art, batch 5b (v2.88; the Bloomhost swarm pass; docs/FACTION_REWORK.md "Art direction") ----------
   Eight Bloomhost units redrawn in the new style (curved carapace, sinew, pulsing glow sacs, team colour on the carapace):
   Dreadthorn (a new body: a long, low charger with heavy horns thrust forward, a lean muscular build, a spined back and
   powerful hind legs; charging, its head drops and the horns level; dazed it sways), Skitterling (a small, fast, eight-legged
   biter with a glowing maw), Spitter (a hunched gunner with a swollen acid sac and a quill launcher on its back), Mite (a tiny
   tick-like biter), Thornback (a knuckle-walking brawler bristling with thorn spines), all cached as poses; Needlewing (a dart
   with buzzing membrane wings and a needle tail), Cloudwing (a larger swarm flyer with brood pouches), Razorwing (a fast
   bat-winged flyer with bone talons), drawn live as every aircraft. Effects: the Spitter's quills (three quick green
   streaks), a faint motion streak behind Bloomhost units at high swarm surge, a brief red pulse in the side's colour on units
   entering a kill frenzy (and a faint red glint while it lasts). */
const SW_FLESH = ['#8f5a6e', '#5e3448', '#341b29'], SW_BONE = '#efe2c6', SW_DARK = '#1d0f18';
const swGlow = (c, T, x, y, r, a) => { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},${a * 0.3})`; c.beginPath(); c.arc(x, y, r * 2.1, 0, 7); c.fill(); c.fillStyle = `rgba(${T.glow},${a})`; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; };
function swLeg(c, pts, w, col) { c.strokeStyle = OUTL; c.lineWidth = w + 1.6; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); }
// A curved team carapace plate from x0 to x1 over the line y (top: its height above y)
function swPlate(c, T, x0, x1, y, top, lw = 0.8) {
  c.fillStyle = lgrad(c, 0, y - top, 0, y, [T.light, T.main, T.hull]);
  c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo(x0 + (x1 - x0) * 0.15, y - top, (x0 + x1) / 2, y - top); c.quadraticCurveTo(x1 - (x1 - x0) * 0.1, y - top * 0.85, x1, y + 0.4); c.closePath(); c.fill(); outline(c, lw);
  c.strokeStyle = 'rgba(255,255,255,0.38)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x0 + (x1 - x0) * 0.2, y - top * 0.8); c.quadraticCurveTo((x0 + x1) / 2, y - top * 1.02, x1 - (x1 - x0) * 0.2, y - top * 0.75); c.stroke();
}

/* ---- Dreadthorn: the charger. u.crg: charging; u.dz -1…1: dazed sway ---- */
function dDread5(c, T, u) {
  const cg = !!u.crg, dz = u.dz || 0, t = u.anim || 0, ph = u.moving ? t * (cg ? 12 : 6.5) : 0, pulse = 0.75 + 0.25 * Math.sin(t * 3), bite = u.recoil || 0;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  if (dz) { c.translate(0, -2); c.rotate(dz * 0.06); c.translate(dz * 1.5, 2); }
  if (cg) { c.translate(14, 0); c.rotate(0.05); c.translate(-14, 0); }
  const hind = (x, o, near) => { // a powerful hind leg: a big thigh, a reversed hock, a long foot
    const sw = Math.sin(ph + o) * (cg ? 6 : 3.5), lift = Math.max(0, Math.sin(ph + o + 1.3)) * (cg ? 4 : 2);
    const hip = [x, -17], knee = [x + 7 + sw * 0.3, -11 - lift * 0.4], hock = [x - 4 + sw * 0.6, -6 - lift], foot = [x + 3 + sw, -lift * 0.3];
    c.fillStyle = lgrad(c, x - 6, -24, x + 8, -8, near ? [SW_FLESH[0], SW_FLESH[1], SW_FLESH[2]] : [SW_FLESH[1], SW_FLESH[2]]); // the thigh: a bulging muscle
    c.beginPath(); c.moveTo(x - 7, -19); c.quadraticCurveTo(x - 2, -27, x + 6, -21); c.quadraticCurveTo(knee[0] + 3, knee[1] - 1, knee[0], knee[1] + 2); c.quadraticCurveTo(x - 2, -10, x - 7, -19); c.fill(); outline(c, 0.9);
    swLeg(c, [knee, hock, foot], near ? 3.6 : 3, near ? SW_FLESH[1] : SW_FLESH[2]);
    if (near) { c.strokeStyle = 'rgba(255,190,210,0.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - 4, -21); c.quadraticCurveTo(x + 1, -17, knee[0] - 1, knee[1]); c.stroke(); } // sinew
    c.fillStyle = near ? T.main : T.hull; c.beginPath(); c.ellipse(x - 1, -21.5, 4.5, 2.6, -0.4, 0, 7); c.fill(); outline(c, 0.6); // a team plate on the haunch
    c.strokeStyle = SW_BONE; c.lineWidth = 1.2; for (const k of [0, 2]) { c.beginPath(); c.moveTo(foot[0] + k, foot[1]); c.lineTo(foot[0] + k + 2.5, foot[1] + 0.4); c.stroke(); }
  };
  const fore = (x, o, near) => { // a lean foreleg
    const sw = Math.sin(ph + o) * (cg ? 6 : 3), lift = Math.max(0, Math.sin(ph + o + 1.3)) * (cg ? 4 : 1.8);
    swLeg(c, [[x, -16], [x + 3 + sw * 0.4, -8 - lift * 0.6], [x + 1 + sw, -lift * 0.3]], near ? 3 : 2.5, near ? SW_FLESH[1] : SW_FLESH[2]);
    c.strokeStyle = SW_BONE; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 1 + sw, -lift * 0.3); c.lineTo(x + 4 + sw, 0.3 - lift * 0.3); c.stroke();
  };
  hind(-22, Math.PI, false); fore(12, 0.6, false);
  // the tail: a short whip ending in a spike
  c.fillStyle = SW_FLESH[2]; c.beginPath(); c.moveTo(-28, -20); c.quadraticCurveTo(-38, -22 + Math.sin(t * 4) * 1.5, -40, -15); c.quadraticCurveTo(-36, -18, -28, -15); c.fill(); outline(c, 0.7);
  c.fillStyle = SW_BONE; poly(c, [[-40, -15], [-44, -12], [-38.5, -16.5]]); c.fill();
  // the body: long and low, a lean belly tucked up under a muscled chest
  c.fillStyle = lgrad(c, 0, -30, 0, -10, [SW_FLESH[0], SW_FLESH[1], SW_FLESH[2]]);
  c.beginPath(); c.moveTo(-30, -18); c.quadraticCurveTo(-28, -27, -14, -26); c.quadraticCurveTo(4, -29, 14, -27); c.quadraticCurveTo(22, -24, 21, -16); c.quadraticCurveTo(14, -10, 4, -13); c.quadraticCurveTo(-10, -12, -20, -13); c.quadraticCurveTo(-29, -13, -30, -18); c.fill(); outline(c, 1.1);
  c.strokeStyle = 'rgba(30,8,20,0.45)'; c.lineWidth = 0.7; for (const x of [-12, -6, 0]) { c.beginPath(); c.moveTo(x, -14); c.quadraticCurveTo(x + 1.5, -17, x + 0.5, -20); c.stroke(); } // ribs under the skin
  // glow sacs along the flank
  for (const [x, y, r] of [[-20, -17, 1.8], [-13, -16, 2.1], [-6, -16.5, 1.9], [1, -17, 1.6]]) swGlow(c, T, x, y, r, 0.8 * pulse);
  // team carapace: overlapping plates down the spine, the biggest over the shoulders
  for (let i = 0; i < 6; i++) { const x0 = -28 + i * 7.4, ht = 4 + Math.sin(i / 5 * Math.PI) * 3 + (i === 5 ? 2 : 0); swPlate(c, T, x0, x0 + 10, -24.5 - Math.sin(i / 5 * Math.PI) * 2, ht, 0.8); }
  // the spined back: curved bone spines raked backwards
  for (let i = 0; i < 7; i++) {
    const x = -24 + i * 6.2, y = -29 - Math.sin(i / 6 * Math.PI) * 4.5, l = 5 + Math.sin(i / 6 * Math.PI) * 4 + (cg ? 1 : 0);
    c.fillStyle = lgrad(c, x, y, x - l * 0.6, y - l, [SW_BONE, '#a8957a']); c.beginPath(); c.moveTo(x - 1.6, y + 1); c.quadraticCurveTo(x - l * 0.2, y - l * 0.6, x - l * 0.6, y - l); c.quadraticCurveTo(x + 0.5, y - l * 0.4, x + 1.8, y + 1); c.closePath(); c.fill(); outline(c, 0.55);
  }
  // the head: a low armoured wedge, the horns thrust forward (level when charging)
  const hx = 25, hy = cg ? -13 : -18 + dz * 1.4;
  c.fillStyle = SW_FLESH[1]; c.beginPath(); c.moveTo(15, -26); c.quadraticCurveTo(21, -25, hx, hy - 3); c.lineTo(hx - 3, hy + 4); c.quadraticCurveTo(18, -13, 14, -15); c.closePath(); c.fill(); outline(c, 0.8); // the neck
  c.fillStyle = lgrad(c, hx - 4, hy - 6, hx + 8, hy + 5, [SW_FLESH[0], SW_FLESH[2]]); c.beginPath(); c.moveTo(hx - 5, hy - 4); c.quadraticCurveTo(hx + 6, hy - 7, hx + 11, hy - 1); c.quadraticCurveTo(hx + 10, hy + 4, hx + 4, hy + 5); c.quadraticCurveTo(hx - 4, hy + 5, hx - 5, hy - 4); c.fill(); outline(c, 0.9);
  c.fillStyle = lgrad(c, hx - 5, hy - 8, hx + 8, hy - 2, [T.light, T.main, T.hull]); // the brow plate in team colour
  c.beginPath(); c.moveTo(hx - 6, hy - 3); c.quadraticCurveTo(hx - 2, hy - 9.5, hx + 7, hy - 6.5); c.quadraticCurveTo(hx + 10, hy - 4, hx + 9, hy - 2); c.quadraticCurveTo(hx + 1, hy - 4.5, hx - 6, hy - 3); c.fill(); outline(c, 0.8);
  rim(c, hx - 3, hy - 8.4, hx + 5, 'rgba(255,255,255,0.45)');
  const ha = cg ? -0.02 : -0.16;
  for (const [ox, oy, l, a, w] of [[2, -6, 22, ha, 3], [0, -3, 16, ha + 0.12, 2.3]]) { // the heavy horns, forward
    const bx = hx + ox, by = hy + oy, tx = bx + Math.cos(a) * l, ty = by + Math.sin(a) * l;
    c.fillStyle = lgrad(c, bx, by, tx, ty, [SW_BONE, '#c4b18d', '#7d6c52']);
    c.beginPath(); c.moveTo(bx - 1, by - w); c.quadraticCurveTo((bx + tx) / 2, (by + ty) / 2 - w - 1.5, tx, ty - 1); c.lineTo(tx + 1.5, ty + 0.3); c.quadraticCurveTo((bx + tx) / 2, (by + ty) / 2 + w * 0.6, bx, by + w); c.closePath(); c.fill(); outline(c, 0.7);
    c.strokeStyle = 'rgba(80,60,40,0.5)'; c.lineWidth = 0.5; for (const k of [0.3, 0.5, 0.7]) { const x = bx + (tx - bx) * k, y = by + (ty - by) * k; c.beginPath(); c.moveTo(x, y - w * (1 - k) - 0.6); c.lineTo(x + 0.6, y + w * (1 - k) * 0.6); c.stroke(); } // growth rings
  }
  c.fillStyle = SW_DARK; c.beginPath(); c.ellipse(hx + 7, hy + 3, 3, 0.9 + bite * 1.4, 0.2, 0, 7); c.fill(); // the jaw
  swGlow(c, T, hx + 4.5, hy - 2.5, 1.1, 1); swGlow(c, T, hx + 1.6, hy - 2.2, 0.8, 1);
  fore(9, Math.PI + 0.6, true); hind(-17, 0, true);
  c.lineCap = 'butt'; c.restore();
}

/* ---- Skitterling: a small, fast, eight-legged biter with a glowing maw ---- */
function dSkit5(c, T, u) {
  const ph = u.moving ? (u.anim || 0) * 16 : 0, bite = u.recoil || 0, gl = 0.75 + 0.25 * Math.sin((u.anim || 0) * 5);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const legs = (near, o) => { for (let i = 0; i < 4; i++) { // splayed spider legs: hip, a high knee out to the side, the foot further out
    const k = i - 1.5, x = -4 + i * 3, s = Math.sin(ph + o + i * 1.6) * 2.2, lift = Math.max(0, Math.cos(ph + o + i * 1.6)) * 1.5;
    swLeg(c, [[x, -5], [x + k * 3.4 + s * 0.3, -8.5 - lift * 0.4], [x + k * 6.5 + s, -lift]], near ? 1 : 0.85, near ? SW_FLESH[1] : SW_FLESH[2]);
  } };
  legs(false, Math.PI);
  c.fillStyle = lgrad(c, 0, -10, 0, -2, [SW_FLESH[0], SW_FLESH[2]]); c.beginPath(); c.ellipse(-5, -5, 6.5, 3.8, -0.1, 0, 7); c.fill(); outline(c, 0.8); // the abdomen
  // the carapace: two big curved team plates over abdomen and thorax, a glow sac between them
  c.fillStyle = lgrad(c, 0, -11, 0, -3, [T.light, T.main, T.hull]);
  c.beginPath(); c.moveTo(-11.5, -4.5); c.quadraticCurveTo(-11, -10.5, -4.5, -10.2); c.quadraticCurveTo(0.5, -9.8, 1.5, -5.5); c.quadraticCurveTo(-5, -6.5, -11.5, -4.5); c.fill(); outline(c, 0.7);
  c.beginPath(); c.moveTo(-0.5, -5.5); c.quadraticCurveTo(0.5, -10.4, 5, -9.6); c.quadraticCurveTo(8, -8.6, 7.6, -5.6); c.quadraticCurveTo(3.5, -6.6, -0.5, -5.5); c.fill(); outline(c, 0.7);
  c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-9, -8.6); c.quadraticCurveTo(-5, -10.2, -1.5, -8.6); c.moveTo(1.5, -8.6); c.quadraticCurveTo(4, -9.8, 6.5, -8.2); c.stroke();
  swGlow(c, T, -0.5, -6, 0.9, 0.85 * gl);
  c.fillStyle = lgrad(c, 7, -9, 7, -2, [SW_FLESH[0], SW_FLESH[2]]); c.beginPath(); c.ellipse(8, -5.2, 3, 2.6, 0.1, 0, 7); c.fill(); outline(c, 0.7); // the head
  const o = 1.2 + bite * 1.5; // the maw: jaws apart, glowing inside
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},${0.5 * gl})`; c.beginPath(); c.arc(11, -5, 3.6 + bite, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  c.fillStyle = `rgba(${T.glow},1)`; c.beginPath(); c.ellipse(10.6, -5, 1.6, o * 0.8, 0, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(10.8, -5, 0.6, o * 0.4, 0, 0, 7); c.fill();
  c.strokeStyle = SW_BONE; c.lineWidth = 1.1; c.beginPath(); c.moveTo(9.5, -6.6); c.quadraticCurveTo(13 + bite, -8 - o * 0.5, 13.6 + bite * 2, -5.6); c.moveTo(9.5, -3.6); c.quadraticCurveTo(13 + bite, -2 + o * 0.5, 13.6 + bite * 2, -4.6); c.stroke();
  c.fillStyle = `rgba(${T.glow},1)`; c.beginPath(); c.arc(7.6, -6.8, 0.7, 0, 7); c.fill(); // eye
  legs(true, 0);
  c.lineCap = 'butt';
}

/* ---- Mite: a tiny tick-like biter ---- */
function dMite5(c, T, u) {
  const ph = u.moving ? (u.anim || 0) * 18 : 0, bite = u.recoil || 0;
  c.lineCap = 'round'; c.lineJoin = 'round';
  const legs = (near, o) => { for (let i = 0; i < 4; i++) { const x = -3.5 + i * 2.2, s = Math.sin(ph + o + i * 1.7) * 1.4; swLeg(c, [[x, -3], [x + (i - 1.5) * 1.3 + s * 0.3, -5.5], [x + (i - 1.5) * 2.2 + s, 0]], 0.7, near ? SW_FLESH[1] : SW_FLESH[2]); } };
  legs(false, Math.PI);
  c.fillStyle = lgrad(c, -1, -7, -1, -1, [T.light, T.main, T.hull]); c.beginPath(); c.ellipse(-1, -3.8, 4.8, 3.1, -0.05, 0, 7); c.fill(); outline(c, 0.7); // the shield plate: team colour
  c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 0.5; c.beginPath(); c.ellipse(-1.4, -4.4, 3, 1.7, -0.05, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  c.fillStyle = 'rgba(30,8,20,0.5)'; for (const x of [-3, -0.5, 2]) { c.beginPath(); c.arc(x, -3.6, 0.45, 0, 7); c.fill(); }
  c.fillStyle = SW_FLESH[1]; c.beginPath(); c.ellipse(4.2, -3.2, 1.8, 1.4, 0.2, 0, 7); c.fill(); outline(c, 0.5); // the little head
  c.strokeStyle = SW_BONE; c.lineWidth = 0.8; c.beginPath(); c.moveTo(5.4, -3.8); c.lineTo(7 + bite, -2.8); c.moveTo(5.4, -2.6); c.lineTo(6.8 + bite, -2.2); c.stroke();
  swGlow(c, T, 4.6, -3.7, 0.5, 1);
  legs(true, 0);
  c.lineCap = 'butt';
}

/* ---- Spitter: a hunched gunner; the swollen acid sac behind, the quill launcher on its back ---- */
function dSpit5(c, T, u) {
  const t = u.anim || 0, ph = u.moving ? t * 9 : 0, pulse = 0.75 + 0.25 * Math.sin(t * 4), rec = u.recoil || 0, air = u.aimAir ? 1 : 0;
  c.lineCap = 'round'; c.lineJoin = 'round';
  const leg = (x, o, near) => { const sw = Math.sin(ph + o) * 2.5, lift = Math.max(0, Math.sin(ph + o + 1.3)) * 1.5; swLeg(c, [[x, -9], [x - 3 + sw * 0.3, -5 - lift * 0.5], [x + sw, -lift * 0.3]], near ? 2.2 : 1.8, near ? SW_FLESH[1] : SW_FLESH[2]); };
  leg(-6, Math.PI, false); leg(4, 0.5, false);
  // the swollen acid sac: translucent green, veined, pulsing
  const sr = 6.4 + pulse * 0.6;
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(150,235,80,${0.22 * pulse})`; c.beginPath(); c.arc(-9, -11, sr * 1.6, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  c.fillStyle = lgrad(c, -15, -17, -4, -5, ['#e8ffb0', '#9be15d', '#3f7a22']); c.beginPath(); c.ellipse(-9, -11, sr, sr * 0.85, -0.3, 0, 7); c.fill(); outline(c, 0.9);
  c.strokeStyle = 'rgba(40,80,20,0.55)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-14, -10); c.quadraticCurveTo(-10, -14, -5, -12); c.moveTo(-12, -6.5); c.quadraticCurveTo(-9, -10, -5, -8); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(-11, -14, 1.3, 0, 7); c.fill();
  // the hunched body
  c.fillStyle = lgrad(c, 0, -20, 0, -6, [SW_FLESH[0], SW_FLESH[1], SW_FLESH[2]]); c.beginPath(); c.moveTo(-5, -8); c.quadraticCurveTo(-5, -19, 3, -19); c.quadraticCurveTo(10, -18, 10, -11); c.quadraticCurveTo(8, -7, 2, -7); c.closePath(); c.fill(); outline(c, 1);
  swPlate(c, T, -5, 4, -15.5, 4, 0.8); swPlate(c, T, 1, 9.5, -14, 4.2, 0.8);
  // the quill launcher on its back: a bony tube with a fan of quills, aimed forward (up at aircraft)
  c.save(); c.translate(2, -18); c.rotate(air ? -0.55 : -0.2); c.translate(-rec * 2, 0);
  c.strokeStyle = SW_BONE; c.lineWidth = 0.9; for (const [x, l] of [[-2, 6], [0.5, 7], [3, 5.5]]) { c.beginPath(); c.moveTo(x, -1.5); c.lineTo(x - 3, -1.5 - l); c.stroke(); } // spare quills bristling behind
  c.fillStyle = lgrad(c, 0, -3, 0, 3, ['#d9c8a6', '#9b8564', '#5e4d36']); c.beginPath(); c.moveTo(-3, -2.4); c.lineTo(11, -1.8); c.quadraticCurveTo(13, 0, 11, 1.8); c.lineTo(-3, 2.4); c.quadraticCurveTo(-5, 0, -3, -2.4); c.fill(); outline(c, 0.7);
  c.strokeStyle = 'rgba(60,40,20,0.5)'; c.lineWidth = 0.5; for (const x of [1, 4.5, 8]) { c.beginPath(); c.moveTo(x, -2); c.lineTo(x, 2); c.stroke(); }
  c.fillStyle = '#1e2a10'; c.beginPath(); c.ellipse(11.6, 0, 0.9, 1.4, 0, 0, 7); c.fill();
  if (rec > 0.05) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(160,245,90,${rec})`; c.beginPath(); c.arc(12.5, 0, 2.5 + rec * 2, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; }
  c.restore();
  // the head: low, under a team hood, drooling acid
  c.fillStyle = lgrad(c, 9, -16, 9, -7, [SW_FLESH[0], SW_FLESH[2]]); c.beginPath(); c.ellipse(11.5, -10.5, 3.6, 3, 0.2, 0, 7); c.fill(); outline(c, 0.7);
  c.fillStyle = lgrad(c, 8, -15, 14, -10, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(8, -11); c.quadraticCurveTo(10, -15.5, 15, -12.5); c.quadraticCurveTo(12, -12.5, 8, -11); c.fill(); outline(c, 0.6);
  c.fillStyle = 'rgba(170,240,100,0.85)'; c.beginPath(); c.ellipse(14, -7.6 + (t * 3) % 2, 0.5, 1, 0, 0, 7); c.fill();
  swGlow(c, T, 12.8, -11.2, 0.75, 1);
  // front claws
  swLeg(c, [[8, -8], [11, -5], [13, -1]], 1.4, SW_FLESH[1]); c.strokeStyle = SW_BONE; c.lineWidth = 0.9; c.beginPath(); c.moveTo(13, -1); c.lineTo(15, -0.6); c.stroke();
  leg(-3, 0.2, true); leg(6, Math.PI + 0.3, true);
  c.lineCap = 'butt';
}

/* ---- Thornback: a knuckle-walking brawler bristling with thorn spines ---- */
function dThorn5(c, T, u) {
  const t = u.anim || 0, ph = u.moving ? t * 7 : 0, rec = u.recoil || 0, pulse = 0.75 + 0.25 * Math.sin(t * 2.6);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const leg = (x, o, near) => { const sw = Math.sin(ph + o) * 2.6, lift = Math.max(0, Math.sin(ph + o + 1.3)) * 1.5; swLeg(c, [[x, -13], [x - 2 + sw * 0.4, -6 - lift * 0.5], [x + 1 + sw, -lift * 0.3]], near ? 4 : 3.4, near ? SW_FLESH[1] : SW_FLESH[2]); };
  const arm = (x, o, near) => { // a thick knuckle-walking forearm with a bony club
    const sw = Math.sin(ph + o) * 3, lift = Math.max(0, Math.sin(ph + o + 1.3)) * 2, hx = x + 7 + sw + rec * 4, hy = -2 - lift - rec * 4;
    swLeg(c, [[x, -22], [x + 6 + sw * 0.4, -13], [hx, hy]], near ? 4.4 : 3.8, near ? SW_FLESH[0] : SW_FLESH[2]);
    c.fillStyle = lgrad(c, hx - 2, hy - 3, hx + 2, hy + 2, [SW_BONE, '#9b8564']); c.beginPath(); c.ellipse(hx + 0.5, hy, 3, 2.4, 0, 0, 7); c.fill(); outline(c, 0.6);
    c.fillStyle = SW_BONE; for (const k of [-1, 1]) { poly(c, [[hx + 2, hy + k], [hx + 5, hy + k * 1.6], [hx + 2.4, hy + k * 0.2]]); c.fill(); }
  };
  leg(-10, Math.PI, false); arm(4, 0.4, false);
  // the body: a hunched mass, shoulders high, a low head
  c.fillStyle = lgrad(c, 0, -32, 0, -10, [SW_FLESH[0], SW_FLESH[1], SW_FLESH[2]]); c.beginPath(); c.moveTo(-15, -12); c.quadraticCurveTo(-18, -24, -8, -28); c.quadraticCurveTo(4, -32, 10, -24); c.quadraticCurveTo(13, -16, 6, -12); c.closePath(); c.fill(); outline(c, 1.1);
  // a coat of team plates, each sprouting thorns: radiating spines all over the back
  const pl = [[-14, -18, -5, 6], [-9, -25, 1, 6], [-2, -27, 8, 5.5], [3, -22, 11, 5]];
  for (const [x0, y, x1, h] of pl) swPlate(c, T, x0, x1, y, h, 0.8);
  for (let i = 0; i < 13; i++) { // the thorns: long, thin, radiating out of the plates
    const a = -Math.PI * (0.15 + 0.8 * i / 12), cx = -2, cy = -16, r0 = 11 + (i % 2) * 1.5, l = 6 + ((i * 7) % 5) + (i % 3 === 0 ? 3 : 0);
    const bx = cx + Math.cos(a) * r0 * 1.25, by = cy + Math.sin(a) * r0, tx = cx + Math.cos(a) * (r0 * 1.25 + l), ty = cy + Math.sin(a) * (r0 + l);
    c.fillStyle = lgrad(c, bx, by, tx, ty, [SW_BONE, '#b29c78', '#6e5a40']); c.beginPath(); c.moveTo(bx - Math.sin(a) * 1.3, by + Math.cos(a) * 1.3); c.lineTo(tx, ty); c.lineTo(bx + Math.sin(a) * 1.3, by - Math.cos(a) * 1.3); c.closePath(); c.fill(); outline(c, 0.45);
  }
  for (const [x, y, r] of [[-11, -14, 1.8], [-5, -13, 1.6]]) swGlow(c, T, x, y, r, 0.75 * pulse); // glow sacs under the plates
  // the head: low and thick-jawed, between the shoulders
  c.fillStyle = lgrad(c, 10, -22, 10, -10, [SW_FLESH[0], SW_FLESH[2]]); c.beginPath(); c.ellipse(12.5, -16, 5, 4.3, 0.1, 0, 7); c.fill(); outline(c, 0.8);
  c.fillStyle = lgrad(c, 9, -22, 16, -16, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(8.5, -17); c.quadraticCurveTo(11, -22.5, 17, -19); c.quadraticCurveTo(13, -18.5, 8.5, -17); c.fill(); outline(c, 0.6);
  c.fillStyle = SW_DARK; c.beginPath(); c.ellipse(16, -13.5, 2.4, 0.8 + rec * 1.2, 0.15, 0, 7); c.fill();
  c.fillStyle = SW_BONE; for (const x of [14.5, 16.5]) { poly(c, [[x, -14.3], [x + 0.6, -12.6], [x + 1.2, -14.3]]); c.fill(); }
  swGlow(c, T, 14.6, -17.2, 0.8, 1);
  leg(-6, 0.2, true); arm(7, Math.PI + 0.4, true);
  c.lineCap = 'butt';
}

/* ---- Needlewing (aircraft, drawn live): a dart with buzzing membrane wings and a needle tail ---- */
function dNeedle5(c, T, u) {
  const t = u.anim || 0, fl = Math.sin(t * 42), jab = (u.recoil || 0) * 3;
  const wing = (x, y, l, a, al) => { c.fillStyle = `rgba(215,190,235,${al})`; c.beginPath(); c.ellipse(x - Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5, l * 0.55, 3.3, -a, 0, 7); c.fill(); c.strokeStyle = `rgba(90,50,90,${al})`; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x - Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); };
  wing(-1, -3, 14, 0.9 + fl * 0.35, 0.32); wing(-5, -2, 10, 0.5 - fl * 0.3, 0.27); // far wings, a buzzing blur
  // the needle tail: long, curving up behind, a bright tip
  c.strokeStyle = OUTL; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-8, 0); c.quadraticCurveTo(-16, 1, -21, -3 - jab); c.stroke();
  c.strokeStyle = SW_BONE; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-21, -3 - jab, 0.8, 0, 7); c.fill();
  // the dart body: a slim segmented fuselage under a team carapace
  c.fillStyle = lgrad(c, 0, -3, 0, 3, [SW_FLESH[0], SW_FLESH[2]]); c.beginPath(); c.moveTo(10, 0); c.quadraticCurveTo(4, -3.6, -9, -1.6); c.quadraticCurveTo(-11, 0.3, -8, 1.8); c.quadraticCurveTo(4, 3.2, 10, 0); c.fill(); outline(c, 0.8);
  c.fillStyle = lgrad(c, 0, -4, 0, 0, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(7, -1); c.quadraticCurveTo(0, -4.4, -8, -1.5); c.quadraticCurveTo(0, -1.8, 7, -1); c.fill(); outline(c, 0.6);
  swGlow(c, T, -3, 0.8, 0.9, 0.8);
  c.fillStyle = SW_FLESH[1]; c.beginPath(); c.ellipse(10, -0.2, 2.6, 2, 0, 0, 7); c.fill(); outline(c, 0.6); // the head
  c.strokeStyle = SW_BONE; c.lineWidth = 0.8; c.beginPath(); c.moveTo(12, 0.6); c.lineTo(15 + jab, 1.6); c.stroke(); // mandible probe
  swGlow(c, T, 11, -0.8, 0.6, 1);
  wing(1, -2.5, 15, 1.1 - fl * 0.4, 0.5); wing(-4, -2, 11, 0.6 + fl * 0.3, 0.42); // near wings
}

/* ---- Cloudwing (aircraft): a larger swarm flyer with brood pouches that release its offspring ---- */
function dCloud5(c, T, u) {
  const t = u.anim || 0, fl = Math.sin(t * 10), sq = (u.recoil || 0) * 1.5, pulse = 0.7 + 0.3 * Math.sin(t * 3.5);
  const rel = VFX.g && u.spawnT && VFX.lastT - (u.spawnT - (UDEF.cloudwing.spawn ? UDEF.cloudwing.spawn.cd : 14)) < 0.6 ? 1 : 0; // just released a clutch
  const wing = (near) => { const y = -6, a = near ? fl : -fl * 0.8, tipY = -20 - a * 7, col = near ? 'rgba(170,110,150,0.78)' : 'rgba(120,70,105,0.6)';
    c.fillStyle = col; c.beginPath(); c.moveTo(4, y); c.quadraticCurveTo(-2, tipY - 2, -16, tipY); c.quadraticCurveTo(-12, y - 4, -14, y + 1); c.quadraticCurveTo(-6, y - 1, 4, y + 2); c.fill(); outline(c, 0.7);
    c.strokeStyle = 'rgba(60,25,45,0.55)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(3, y); c.lineTo(-16, tipY); c.moveTo(1, y + 1); c.lineTo(-13, y - 3); c.stroke(); };
  wing(false);
  // tendrils trailing
  c.strokeStyle = SW_FLESH[1]; c.lineWidth = 1; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const x = -10 + i * 3, w = Math.sin(t * 3 + i) * 2.5; c.beginPath(); c.moveTo(x, 1); c.quadraticCurveTo(x - 3 + w, 6, x - 7 + w, 9 + i); c.stroke(); }
  // the body: a bulbous thorax under team plates
  c.fillStyle = lgrad(c, 0, -14, 0, 4, [SW_FLESH[0], SW_FLESH[1], SW_FLESH[2]]); c.beginPath(); c.ellipse(-1, -4, 13 + sq, 7.5 - sq * 0.4, -0.06, 0, 7); c.fill(); outline(c, 1);
  swPlate(c, T, -12, -2, -7.5, 4, 0.7); swPlate(c, T, -5, 5, -8.5, 4.4, 0.7); swPlate(c, T, 2, 10, -6.5, 3.6, 0.7);
  // the brood pouches underneath: glowing sacs with offspring curled inside; open after a release
  for (const [x, r] of [[-7, 3.2], [-1.5, 3.8], [4, 3]]) {
    const y = 2.6;
    c.fillStyle = `rgba(${T.glow},${0.35 + 0.2 * pulse})`; c.beginPath(); c.ellipse(x, y, r, r * 0.85, 0, 0, 7); c.fill(); outline(c, 0.6);
    c.fillStyle = 'rgba(40,15,30,0.55)'; c.beginPath(); c.ellipse(x - 0.3, y + 0.2, r * 0.45, r * 0.3, 0.5, 0, 7); c.fill(); // a curled offspring inside
    if (rel) { c.fillStyle = SW_DARK; c.beginPath(); c.ellipse(x, y + r * 0.6, r * 0.6, 0.9, 0, 0, 7); c.fill(); }
  }
  swGlow(c, T, -1.5, 2.6, 1.6, 0.5 * pulse);
  // the head: a blunt prow with a mandible pair
  c.fillStyle = lgrad(c, 12, -8, 12, 0, [SW_FLESH[0], SW_FLESH[2]]); c.beginPath(); c.ellipse(13, -4, 4, 3.3, 0.15, 0, 7); c.fill(); outline(c, 0.7);
  c.strokeStyle = SW_BONE; c.lineWidth = 1; c.beginPath(); c.moveTo(15.5, -3); c.quadraticCurveTo(19, -3.4, 19 + sq, -1); c.moveTo(15.5, -1.8); c.quadraticCurveTo(18.5, -0.5, 18.5 + sq, -1.2); c.stroke();
  swGlow(c, T, 14.3, -5.2, 0.8, 1);
  wing(true);
}

/* ---- Razorwing (aircraft): a fast bat-winged flyer with bone talons ---- */
function dRazor5(c, T, u) {
  const t = u.anim || 0, fl = Math.sin(t * 15), dive = u.recoil || 0;
  const wing = (near) => { // a bat wing: finger bones with membrane between
    const a = near ? fl : -fl * 0.8, sh = [2, -3], el = [-6, -12 - a * 5], tips = [[-20, -18 - a * 9], [-24, -10 - a * 6], [-21, -2 - a * 2]];
    c.fillStyle = near ? 'rgba(110,60,90,0.82)' : 'rgba(80,40,65,0.65)';
    c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); c.lineTo(tips[0][0], tips[0][1]); c.quadraticCurveTo(-19, -14 - a * 7, tips[1][0], tips[1][1]); c.quadraticCurveTo(-18, -7 - a * 4, tips[2][0], tips[2][1]); c.quadraticCurveTo(-10, -2, -4, 1); c.closePath(); c.fill(); outline(c, 0.7);
    c.strokeStyle = SW_BONE; c.lineWidth = near ? 1.1 : 0.8; c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); for (const p of tips) { c.moveTo(el[0], el[1]); c.lineTo(p[0], p[1]); } c.stroke();
    if (near) { c.fillStyle = T.main; c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); c.lineTo(el[0] - 3, el[1] + 4); c.lineTo(sh[0] - 3, sh[1] + 3); c.closePath(); c.fill(); outline(c, 0.5); } // a team plate on the arm
  };
  wing(false);
  // the body: sleek, swept back, a team carapace along the top
  c.fillStyle = lgrad(c, 0, -5, 0, 4, [SW_FLESH[0], SW_FLESH[2]]); c.beginPath(); c.moveTo(14, -1); c.quadraticCurveTo(6, -6, -8, -3); c.quadraticCurveTo(-16, -1, -22, 2); c.quadraticCurveTo(-12, 3, -2, 3.4); c.quadraticCurveTo(8, 3.5, 14, -1); c.fill(); outline(c, 0.9);
  c.fillStyle = lgrad(c, 0, -6, 0, -1, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(11, -2); c.quadraticCurveTo(4, -6.5, -10, -3); c.quadraticCurveTo(0, -3.4, 11, -2); c.fill(); outline(c, 0.6);
  // bone talons, thrust forward in a dive
  const tx = 4 + dive * 6, ty = 6 + dive * 2;
  swLeg(c, [[0, 2], [2 + dive * 3, 5], [tx, ty]], 1.3, SW_FLESH[1]);
  c.strokeStyle = SW_BONE; c.lineWidth = 1; for (const k of [-1.2, 0, 1.2]) { c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + 2.5, ty + k - 0.5, tx + 3, ty + k + 1.5); c.stroke(); }
  // the head: a narrow skull, swept-back ears, glowing eyes
  c.fillStyle = SW_FLESH[1]; c.beginPath(); c.ellipse(14, -1.2, 3.2, 2.2, 0.1, 0, 7); c.fill(); outline(c, 0.6);
  c.fillStyle = SW_FLESH[2]; poly(c, [[12, -3], [9, -7], [13.5, -3.4]]); c.fill(); outline(c, 0.4);
  c.fillStyle = SW_BONE; poly(c, [[16.5, -0.6], [20 + dive * 2, 0.6], [16.4, 0.8]]); c.fill();
  swGlow(c, T, 15, -1.8, 0.7, 1);
  wing(true);
}

DRAW_U.dreadthorn = dDread5; DRAW_U.skitterling = dSkit5; DRAW_U.mite = dMite5; DRAW_U.spitter = dSpit5; DRAW_U.thornback = dThorn5;
DRAW_U.needlewing = dNeedle5; DRAW_U.cloudwing = dCloud5; DRAW_U.razorwing = dRazor5;
Object.assign(SPR_BOX, { dreadthorn: [-46, -44, 94, 48], skitterling: [-16, -16, 34, 18], mite: [-10, -10, 20, 12], spitter: [-18, -30, 38, 32], thornback: [-24, -40, 50, 42] });
Object.assign(SPR_STEP, { skitterling: [16, 6], mite: [18, 6], dreadthorn: [6.5, 8] });
Object.assign(UVIS, { dreadthorn: { h: 34, w: 26 }, skitterling: { h: 12, w: 9 }, mite: { h: 8, w: 6 }, spitter: { h: 22, w: 11 }, thornback: { h: 34, w: 16 } });

/* ---- Effects ---- */
// Swarm surge: a faint motion streak behind a moving Bloomhost ground unit whose surge is high (drawn under it)
function drawSurge5(c, u, w, t) {
  const cap = SURGE.max / SURGE.per, k = u.sgN / cap; if (k < SURGE.streak || !u.moving) return;
  const T = TEAM[u.side], h = visH(u.type) * US, dir = -u.face, a = 0.12 + 0.22 * k;
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const y = w.y - h * (0.25 + i * 0.25), l = (10 + i * 4 + k * 10) * US, x0 = w.x + dir * (4 + i * 2) * US, j = Math.sin(t * 30 + u.id + i * 2) * 1.5 * US;
    c.strokeStyle = `rgba(${T.glow},${a * (1 - i * 0.2)})`; c.lineWidth = (1.6 - i * 0.3) * US; c.beginPath(); c.moveTo(x0, y + j); c.lineTo(x0 + dir * l, y + j); c.stroke();
  }
  c.restore();
}
// Kill frenzy: a brief red pulse in the side's colour when it starts, then a faint red glint while it lasts (drawn over it)
const KF_RED = ['255,70,60', '255,60,120']; // side 0 a red-orange, side 1 a red-magenta: red, tinted toward each side's own colour
function drawFrenzy5(c, g, u, w) {
  const t = VFX.lastT, s = t - (u.kfS ?? -9), h = visH(u.type) * US, cy = w.y - u.z - h * 0.5, col = KF_RED[u.side] || KF_RED[0];
  c.save(); c.globalCompositeOperation = 'lighter';
  if (s < 0.55) { const k = s / 0.55, r = (6 + k * 14) * US * (UDEF[u.type].air ? 1.2 : 1); c.strokeStyle = `rgba(${col},${0.85 * (1 - k)})`; c.lineWidth = 2 * US; c.beginPath(); c.ellipse(w.x, cy, r, r * 0.75, 0, 0, 7); c.stroke(); stamp(c, GLOW['t' + u.side], w.x, cy, r * 0.9, 0.5 * (1 - k)); }
  const a = 0.18 + 0.12 * Math.sin(t * 10 + u.id); c.fillStyle = `rgba(${col},${a})`; c.beginPath(); c.arc(w.x + u.face * 3 * US, cy - h * 0.15, 2.4 * US, 0, 7); c.fill();
  c.restore();
}
// A Spitter's quill in flight: a quick green streak with a pale head
function drawQuill5(c, p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, L = 13 * US;
  c.save(); c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
  c.strokeStyle = 'rgba(120,230,70,0.45)'; c.lineWidth = 2.6 * US; c.beginPath(); c.moveTo(b.x - ux * L, b.y - uy * L); c.lineTo(b.x, b.y); c.stroke();
  c.strokeStyle = 'rgba(200,255,140,0.95)'; c.lineWidth = 1 * US; c.beginPath(); c.moveTo(b.x - ux * L * 0.6, b.y - uy * L * 0.6); c.lineTo(b.x, b.y); c.stroke();
  c.globalCompositeOperation = 'source-over'; c.fillStyle = '#f2ffd9'; c.beginPath(); c.arc(b.x, b.y, 1 * US, 0, 7); c.fill();
  c.restore();
}
