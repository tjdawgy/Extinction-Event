/* ---------- Batch 6h art (v2.98, docs/FACTION_REWORK.md "Batch 6h"; the Bloomhost style of batch 5b, team colour on every unit) ----------
   New units: the Queen (a standing, hunched, plague-ridden woman in rags; one swollen bile hand glowing in her side's colour, Mites
   crawling off her), the Broodback (a hunched beast with translucent egg sacs in her side's colour on its back), the Chitin Warden
   (the Bulwark's new body with b6h on: an upright guardian behind a wall of overlapping team chitin plates and two shield-like
   forelimbs; tall and broad, nothing like the Dreadthorn's long, low charger) and the Mite (a tick under a big team carapace with a
   corrosive green bite). All cached as poses (SPR_BOX, SPR_STEP, UVIS). The Warden's and the Mite's art follows the game drawn
   (VFX.g's b6h; the new-game default without one), and the pose cache key carries which (sprArtKey).
   Effects: Pounce (a crouch and a stretch while it lunges, a streak behind, a dust puff where it starts), the Leaper's landing stun
   (a ring of dust and stars over the stunned), Bile Blooms (a bubbling pool in the dying side's colour, fading), the Ruinmaw's
   eruption (a heaving ring of earth and chunks), its swallow and spit, the tunnel (a dirt line from where a unit went down to the
   Ruinmaw while it travels, and a burst where it comes up), the Queen's births (a bile arc from her hand to the new Mite), the
   Warden's aura (a faint chitin-plate shimmer on units inside it) and the Queen's bile bolt. */
const art6h = () => VFX.g ? rwB6h(VFX.g) : REWORK.b6h;
const Q6_RAG = ['#6b5a4a', '#4a3c31', '#2b221c'], Q6_SKIN = ['#b9a58f', '#8f7a66', '#5c4c40'];

/* ---- the Queen ---- */
function dQueen6(c, T, u) {
  const t = u.anim || 0, ph = u.moving ? t * 5 : 0, pulse = 0.7 + 0.3 * Math.sin(t * 3.2), rec = u.recoil || 0;
  c.lineCap = 'round'; c.lineJoin = 'round';
  // feet under the rags, a slow shuffle
  const foot = (x, o, near) => { const sw = Math.sin(ph + o) * 2.2; c.fillStyle = near ? Q6_SKIN[1] : Q6_SKIN[2]; c.beginPath(); c.ellipse(x + sw, -1, 2.6, 1.3, 0, 0, 7); c.fill(); outline(c, 0.5); };
  foot(-3, Math.PI, false);
  // the rags: a long torn skirt, ragged hem
  c.fillStyle = lgrad(c, 0, -26, 0, 0, [Q6_RAG[0], Q6_RAG[1], Q6_RAG[2]]);
  c.beginPath(); c.moveTo(-6, -24); c.quadraticCurveTo(-11, -12, -10, -2);
  for (let i = 0; i < 6; i++) { const x = -10 + i * 3.6; c.lineTo(x + 1.8, -(i % 2 ? 0 : 2.5) + Math.sin(t * 2 + i) * 0.5); }
  c.lineTo(11, -3); c.quadraticCurveTo(9, -14, 5, -24); c.closePath(); c.fill(); outline(c, 0.9);
  c.strokeStyle = 'rgba(20,12,8,0.45)'; c.lineWidth = 0.6; for (const x of [-6, -1, 4]) { c.beginPath(); c.moveTo(x, -20); c.quadraticCurveTo(x - 1, -10, x + 0.5, -2); c.stroke(); }
  // plague sores on the rags, glowing faintly in her side's colour
  for (const [x, y, r] of [[-5, -12, 1.2], [3, -8, 1], [-1, -17, 0.9]]) swGlow(c, T, x, y, r, 0.6 * pulse);
  // the hunched torso under a team shawl
  c.fillStyle = lgrad(c, -4, -36, 6, -22, [T.light, T.main, T.hull]);
  c.beginPath(); c.moveTo(-7, -23); c.quadraticCurveTo(-9, -33, -2, -37); c.quadraticCurveTo(6, -39, 9, -31); c.quadraticCurveTo(10, -25, 6, -22); c.closePath(); c.fill(); outline(c, 1);
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-5, -32); c.quadraticCurveTo(0, -37, 6, -33); c.stroke();
  for (let i = 0; i < 4; i++) { c.strokeStyle = T.hull; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-6 + i * 4, -23); c.lineTo(-7 + i * 4 + (i % 2), -19.5); c.stroke(); } // the shawl's torn fringe
  // the thin arm behind (bony, holding a gnarled staff)
  c.strokeStyle = '#4a3a2a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-9, -40); c.lineTo(-7, -1); c.stroke(); outline(c, 0.4);
  swLeg(c, [[-3, -31], [-7, -26], [-8.5, -28]], 1.4, Q6_SKIN[2]);
  // the head: bowed forward, a hood, hollow cheeks, two glowing eyes
  c.fillStyle = lgrad(c, 6, -44, 12, -32, [Q6_SKIN[0], Q6_SKIN[1], Q6_SKIN[2]]); c.beginPath(); c.ellipse(9, -36, 3.6, 4.2, 0.4, 0, 7); c.fill(); outline(c, 0.7);
  c.fillStyle = lgrad(c, 2, -46, 12, -34, [Q6_RAG[0], Q6_RAG[2]]); c.beginPath(); c.moveTo(4, -34); c.quadraticCurveTo(4, -44, 10, -43); c.quadraticCurveTo(14, -41, 13, -36); c.quadraticCurveTo(10, -40, 6, -33); c.closePath(); c.fill(); outline(c, 0.7);
  swGlow(c, T, 11.4, -36.5, 0.6, 1); swGlow(c, T, 9.6, -36, 0.5, 0.8);
  c.strokeStyle = 'rgba(40,20,10,0.6)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(10.5, -33.5); c.lineTo(12.4, -33.8); c.stroke();
  // the swollen bile hand, held out front: huge, veined, glowing in her side's colour
  swLeg(c, [[5, -30], [10, -27], [14, -27 - rec * 2]], 1.8, Q6_SKIN[1]);
  const hr = 4.2 + pulse * 0.5 + rec * 1.2, hx = 16 + rec, hy = -27 - rec * 2;
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},${0.25 * pulse + rec * 0.3})`; c.beginPath(); c.arc(hx, hy, hr * 2.1, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  c.fillStyle = lgrad(c, hx - hr, hy - hr, hx + hr, hy + hr, ['#ffffff', T.light, T.main, T.hull]); c.beginPath(); c.ellipse(hx, hy, hr, hr * 0.86, 0.3, 0, 7); c.fill(); outline(c, 0.8);
  c.strokeStyle = 'rgba(30,60,10,0.5)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(hx - 3, hy); c.quadraticCurveTo(hx, hy - 2.5, hx + 3, hy - 0.5); c.moveTo(hx - 1.5, hy + 2); c.quadraticCurveTo(hx + 1, hy + 0.5, hx + 3, hy + 2); c.stroke();
  for (let i = 0; i < 4; i++) { const a = -0.9 + i * 0.45; c.strokeStyle = Q6_SKIN[1]; c.lineWidth = 1.1; c.beginPath(); c.moveTo(hx + Math.cos(a) * hr * 0.8, hy + Math.sin(a) * hr * 0.7); c.lineTo(hx + Math.cos(a) * (hr + 2.6), hy + Math.sin(a) * (hr + 2.2)); c.stroke(); } // gnarled fingers
  c.fillStyle = 'rgba(200,255,140,0.85)'; c.beginPath(); c.ellipse(hx + 1, hy + hr + (t * 4) % 3, 0.6, 1.1, 0, 0, 7); c.fill(); // a drip of bile
  // Mites crawling off her: two tiny team-shelled ticks on the rags, walking down
  for (const [k, x0, y0] of [[0, -6, -14], [1, 4, -18]]) { const y = y0 + ((t * 5 + k * 3) % 9); c.fillStyle = T.main; c.beginPath(); c.ellipse(x0 + (k ? 1 : -1) * Math.sin(t * 6), y, 1.5, 1, 0, 0, 7); c.fill(); outline(c, 0.4); c.strokeStyle = OUTL; c.lineWidth = 0.4; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x0 - 1, y); c.lineTo(x0 - 1.8, y + d * 1.4); c.moveTo(x0 + 1, y); c.lineTo(x0 + 1.8, y + d * 1.4); c.stroke(); } }
  foot(4, 0, true);
  c.lineCap = 'butt';
}

/* ---- the Mite (b6h): a tick under a big team carapace, a corrosive green bite ---- */
function dMite6(c, T, u) {
  const ph = u.moving ? (u.anim || 0) * 20 : 0, bite = u.recoil || 0, t = u.anim || 0;
  c.lineCap = 'round'; c.lineJoin = 'round';
  const legs = (near, o) => { for (let i = 0; i < 4; i++) { const x = -4 + i * 2.6, s = Math.sin(ph + o + i * 1.7) * 1.6; swLeg(c, [[x, -3], [x + (i - 1.5) * 1.5 + s * 0.3, -4.8], [x + (i - 1.5) * 2.6 + s, 0]], 0.6, near ? SW_FLESH[1] : SW_FLESH[2]); } };
  legs(false, Math.PI);
  c.fillStyle = lgrad(c, -1, -9, -1, -1, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(-6.5, -3); c.quadraticCurveTo(-6.5, -8.6, -0.5, -8.6); c.quadraticCurveTo(5.5, -8.4, 5.6, -3.4); c.quadraticCurveTo(0, -1.6, -6.5, -3); c.fill(); outline(c, 0.75);
  c.strokeStyle = T.hull; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-3.5, -7.6); c.quadraticCurveTo(-2.8, -5, -3.2, -2.4); c.moveTo(0.6, -8.4); c.quadraticCurveTo(1.2, -5.4, 0.8, -2.2); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-5, -6.4); c.quadraticCurveTo(-1.5, -9, 3.6, -6.8); c.stroke();
  swGlow(c, T, -1.5, -5.4, 0.5, 0.7 + 0.3 * Math.sin(t * 5));
  c.fillStyle = SW_FLESH[1]; c.beginPath(); c.ellipse(6.6, -3.6, 2, 1.6, 0.2, 0, 7); c.fill(); outline(c, 0.5);
  c.fillStyle = '#b6f56a'; c.beginPath(); c.moveTo(8, -4.3); c.lineTo(10 + bite * 1.5, -3.4); c.lineTo(8, -2.6); c.closePath(); c.fill(); // the corrosive bite
  swGlow(c, T, 7, -4.2, 0.55, 1);
  legs(true, 0);
  c.lineCap = 'butt';
}

/* ---- the Chitin Warden (the Bulwark with b6h): an upright guardian behind a wall of team plates ---- */
function dWarden6(c, T, u) {
  const t = u.anim || 0, ph = u.moving ? t * 5.5 : 0, rec = u.recoil || 0, pulse = 0.75 + 0.25 * Math.sin(t * 2.2), br = u.br ? 1 : 0, hl = u.hl || 0;
  c.lineCap = 'round'; c.lineJoin = 'round';
  const leg = (x, o, near) => { const sw = Math.sin(ph + o) * 2.4, lift = Math.max(0, Math.sin(ph + o + 1.3)) * 1.6; swLeg(c, [[x, -15], [x + 3 + sw * 0.3, -8 - lift * 0.5], [x + 1 + sw, -lift * 0.3]], near ? 4.2 : 3.6, near ? SW_FLESH[1] : SW_FLESH[2]); c.strokeStyle = SW_BONE; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 1 + sw, -lift * 0.3); c.lineTo(x + 4 + sw, 0.4 - lift * 0.3); c.stroke(); };
  leg(-10, Math.PI, false); leg(4, 0.4, false);
  // the body: a tall, rounded trunk standing upright
  c.fillStyle = lgrad(c, -6, -44, 6, -12, [SW_FLESH[0], SW_FLESH[1], SW_FLESH[2]]);
  c.beginPath(); c.moveTo(-14, -13); c.quadraticCurveTo(-17, -32, -7, -41); c.quadraticCurveTo(3, -46, 10, -38); c.quadraticCurveTo(15, -28, 10, -13); c.quadraticCurveTo(-2, -9, -14, -13); c.fill(); outline(c, 1.1);
  // a wall of overlapping team chitin plates down its back and over its head (the faction's armour, its side at a glance)
  for (let i = 0; i < 5; i++) { const y = -42 + i * 6.5, w = 11 + Math.sin(i / 4 * Math.PI) * 4; c.fillStyle = lgrad(c, 0, y - 4, 0, y + 6, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(-15 - (i === 2 ? 1 : 0), y + 6); c.quadraticCurveTo(-16 - w * 0.2, y - 2, -6, y - 4); c.quadraticCurveTo(-6 + w * 0.5, y - 5, -6 + w * 0.8, y + 1); c.quadraticCurveTo(-4, y + 4, -15, y + 6); c.fill(); outline(c, 0.8); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-12, y + 2); c.quadraticCurveTo(-8, y - 3, -2, y - 3); c.stroke(); }
  // the crest: a tall team chitin hood over a low head with mandibles
  c.fillStyle = lgrad(c, 2, -50, 14, -34, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(-2, -38); c.quadraticCurveTo(2, -51, 12, -46); c.quadraticCurveTo(16, -40, 15, -33); c.quadraticCurveTo(8, -38, -2, -38); c.fill(); outline(c, 0.9);
  c.fillStyle = SW_FLESH[2]; c.beginPath(); c.ellipse(13, -32, 4, 3, 0.2, 0, 7); c.fill(); outline(c, 0.6);
  swGlow(c, T, 14.2, -33.4, 0.8, 1);
  c.strokeStyle = SW_BONE; c.lineWidth = 1.1; c.beginPath(); c.moveTo(15.5, -31); c.quadraticCurveTo(19, -29, 18 + rec * 2, -26.5); c.moveTo(14.5, -30); c.quadraticCurveTo(16, -27, 15 + rec, -25.5); c.stroke();
  // glow vents along the trunk (they pulse brighter while it regenerates)
  for (const [x, y] of [[2, -30], [4, -24], [3, -18]]) swGlow(c, T, x, y, 1.1 + (hl ? 0.6 : 0), (0.6 + (hl ? 0.4 : 0)) * pulse);
  // two shield-like forelimbs held up in front: broad team-plated slabs (raised higher while bracing)
  const sh = (x, y, near) => { const lift = br ? -4 : 0; c.save(); c.translate(x + rec * 3, y + lift); c.rotate(br ? -0.15 : 0.05);
    swLeg(c, [[-6, -6], [-1, -2], [2, 0]], near ? 3 : 2.5, near ? SW_FLESH[1] : SW_FLESH[2]);
    c.fillStyle = lgrad(c, 0, -12, 0, 10, near ? [T.light, T.main, T.hull] : [T.main, T.hull]); c.beginPath(); c.moveTo(0, -11); c.quadraticCurveTo(7, -12, 7.5, -1); c.quadraticCurveTo(7, 9, 1, 10); c.quadraticCurveTo(3, 0, 0, -11); c.fill(); outline(c, 0.9);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(2, -8); c.quadraticCurveTo(6, -6, 5.8, 2); c.stroke();
    c.strokeStyle = T.hull; c.lineWidth = 0.6; c.beginPath(); c.moveTo(1.5, -3); c.lineTo(7, -3.5); c.moveTo(1.8, 3.5); c.lineTo(6.8, 3); c.stroke();
    c.restore(); };
  sh(9, -22, false);
  leg(-6, 0.3, true); leg(7, Math.PI + 0.4, true);
  sh(12, -18, true);
  if (br) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${T.glow},0.55)`; c.lineWidth = 1.4; c.beginPath(); c.arc(4, -24, 22, -1.3, 1.0); c.stroke(); c.globalCompositeOperation = 'source-over'; }
  c.lineCap = 'butt';
}

/* ---- the Broodback: a hunched beast, translucent team egg sacs on its back ---- */
function dBrood6(c, T, u) {
  const t = u.anim || 0, ph = u.moving ? t * 6 : 0, rec = u.recoil || 0, pulse = 0.7 + 0.3 * Math.sin(t * 2.6);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const leg = (x, o, near, w) => { const sw = Math.sin(ph + o) * 2.6, lift = Math.max(0, Math.sin(ph + o + 1.3)) * 1.6; swLeg(c, [[x, -12], [x - 2 + sw * 0.4, -6 - lift * 0.5], [x + 1 + sw, -lift * 0.3]], w, near ? SW_FLESH[1] : SW_FLESH[2]); c.strokeStyle = SW_BONE; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 1 + sw, -lift * 0.3); c.lineTo(x + 3.5 + sw, 0.3 - lift * 0.3); c.stroke(); };
  leg(-17, Math.PI, false, 4); leg(10, 0.6, false, 3.6);
  // the body: heavy and hunched, the back rising to a hump
  c.fillStyle = lgrad(c, 0, -30, 0, -8, [SW_FLESH[0], SW_FLESH[1], SW_FLESH[2]]);
  c.beginPath(); c.moveTo(-24, -12); c.quadraticCurveTo(-26, -24, -12, -27); c.quadraticCurveTo(4, -29, 14, -22); c.quadraticCurveTo(20, -16, 17, -10); c.quadraticCurveTo(0, -6, -24, -12); c.fill(); outline(c, 1.1);
  c.strokeStyle = 'rgba(30,8,20,0.45)'; c.lineWidth = 0.7; for (const x of [-14, -8, -2, 4]) { c.beginPath(); c.moveTo(x, -10); c.quadraticCurveTo(x + 1.5, -14, x + 0.5, -18); c.stroke(); }
  // team carapace plates along the sides of the hump (holding the sacs)
  swPlate(c, T, -25, -12, -14, 6, 0.9); swPlate(c, T, 6, 18, -13, 5, 0.9);
  // the egg sacs: translucent, glowing in its side's colour, dark shapes curled inside
  for (const [x, y, r, k] of [[-15, -29, 6, 0], [-5, -32, 7, 1], [5, -29, 5.6, 2], [-10, -24, 4.4, 3], [1, -24.5, 4.2, 4]]) {
    const rr = r * (1 + 0.05 * Math.sin(t * 3 + k));
    c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},${0.18 * pulse})`; c.beginPath(); c.arc(x, y, rr * 1.5, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 0.72; c.fillStyle = lgrad(c, x - rr, y - rr, x + rr, y + rr, [T.light, T.main, T.hull]); c.beginPath(); c.ellipse(x, y, rr, rr * 0.86, 0.2, 0, 7); c.fill(); c.globalAlpha = 1; outline(c, 0.7);
    c.fillStyle = 'rgba(40,10,25,0.55)'; c.beginPath(); c.ellipse(x + 0.6, y + 0.6, rr * 0.42, rr * 0.3, 0.6 + k, 0, 7); c.fill(); // a curled Skitterling inside
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(x - rr * 0.35, y - rr * 0.4, rr * 0.2, 0, 7); c.fill();
  }
  // the head: low and heavy, a weak jaw
  c.fillStyle = lgrad(c, 14, -22, 14, -10, [SW_FLESH[0], SW_FLESH[2]]); c.beginPath(); c.ellipse(20, -15, 5.6, 4.6, 0.25, 0, 7); c.fill(); outline(c, 0.8);
  c.fillStyle = lgrad(c, 15, -22, 24, -16, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(15, -17); c.quadraticCurveTo(19, -23, 25, -18); c.quadraticCurveTo(20, -18.5, 15, -17); c.fill(); outline(c, 0.6);
  swGlow(c, T, 22.6, -16.6, 0.8, 1);
  c.strokeStyle = SW_BONE; c.lineWidth = 1; c.beginPath(); c.moveTo(24, -13); c.lineTo(26.5 + rec * 2, -11.5); c.moveTo(23, -12); c.lineTo(25 + rec * 1.5, -10); c.stroke();
  c.fillStyle = 'rgba(170,240,100,0.8)'; c.beginPath(); c.ellipse(24.5, -9 + (t * 3) % 2, 0.5, 1, 0, 0, 7); c.fill();
  leg(-12, 0.2, true, 4.4); leg(13, Math.PI + 0.3, true, 4);
  c.lineCap = 'butt';
}

/* ---- registration: the two new units, the Warden's and the Mite's art by the game's b6h ---- */
{
  const bul0 = DRAW_U.bulwark, mite0 = DRAW_U.mite;
  DRAW_U.queen = dQueen6; DRAW_U.broodback = dBrood6;
  DRAW_U.bulwark = (c, T, u) => art6h() ? dWarden6(c, T, u) : bul0(c, T, u);
  DRAW_U.mite = (c, T, u) => art6h() ? dMite6(c, T, u) : mite0(c, T, u);
  SPR_BOX.queen = [-14, -50, 36, 52]; SPR_BOX.broodback = [-32, -40, 64, 42];
  const swapGet = (o, k, on) => { const d = Object.getOwnPropertyDescriptor(o, k), off = d ? d.value : undefined; Object.defineProperty(o, k, { get: () => art6h() ? on : off, set: v => { Object.defineProperty(o, k, { value: v, writable: true, enumerable: true, configurable: true }); }, enumerable: true, configurable: true }); };
  swapGet(SPR_BOX, 'bulwark', [-24, -54, 50, 56]); swapGet(SPR_BOX, 'mite', [-10, -12, 22, 14]);
  Object.assign(SPR_STEP, { queen: [5, 6], broodback: [6, 6] }); if (!SPR_STEP.bulwark) SPR_STEP.bulwark = [5.5, 6];
  Object.assign(UVIS, { queen: { h: 46, w: 11 }, broodback: { h: 34, w: 21 } });
  swapGet(UVIS, 'bulwark', { h: 52, w: 18 }); swapGet(UVIS, 'mite', { h: 9, w: 7 });
}
// The pose cache key carries which art drew the Warden and the Mite (sprArtKey reads DRAW_U's function, the same for both)
{ const k0 = sprArtKey; sprArtKey = (type, T) => k0(type, T) + ((type === 'bulwark' || type === 'mite') && art6h() ? 'h6' : ''); }

/* ---- projectiles: the Queen's bile bolt ---- */
function drawBileBolt6(c, p, a, b) {
  const T = TEAM[p.side], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, Lt = 10 * US;
  c.save(); c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
  c.strokeStyle = `rgba(${T.glow},0.45)`; c.lineWidth = 3 * US; c.beginPath(); c.moveTo(b.x - ux * Lt, b.y - uy * Lt); c.lineTo(b.x, b.y); c.stroke();
  c.globalCompositeOperation = 'source-over'; c.fillStyle = '#c4f58e'; c.beginPath(); c.arc(b.x, b.y, 1.9 * US, 0, 7); c.fill();
  c.fillStyle = T.light; c.beginPath(); c.arc(b.x - 0.6, b.y - 0.6, 0.9 * US, 0, 7); c.fill();
  c.restore();
}

/* ---- on the unit: Pounce, the stun, the Warden's aura ---- */
function drawUnit6h(c, u, w, t) { // under the unit (before its art)
  if (u.pcT > t) { // the lunge: a streak behind it in its side's colour
    const k = (u.pcT - t) / 0.4, T = TEAM[u.side], f = u.face || 1;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) { c.strokeStyle = `rgba(${T.glow},${0.45 * k})`; c.lineWidth = (2.4 - i * 0.6) * US; const y = w.y - (6 + i * 5) * US; c.beginPath(); c.moveTo(w.x - f * (10 + i * 4) * US, y); c.lineTo(w.x - f * (34 + i * 6) * US, y + 1); c.stroke(); }
    c.restore();
  }
  if (u.wd6 != null && VFX.g && u.wd6 >= VFX.g.t - 0.05 && u.type !== 'bulwark') { // inside a Warden's aura: a faint chitin-plate shimmer
    const T = TEAM[u.side], h = (UVIS[u.type] ? UVIS[u.type].h : UDEF[u.type].h) * US * 0.5, a = 0.18 + 0.08 * Math.sin(t * 3 + u.id);
    c.save(); c.globalAlpha = a; c.strokeStyle = T.light; c.lineWidth = 1;
    for (let i = 0; i < 3; i++) { const x = w.x + (i - 1) * 4 * US, y = w.y - h - 2; c.beginPath(); c.moveTo(x - 3 * US, y + 2); c.quadraticCurveTo(x, y - 2.5, x + 3 * US, y + 2); c.stroke(); }
    c.restore();
  }
}
function drawUnitOver6h(c, u, w, t) { // over the unit
  if (u.st6 > t) { // stunned: dust stars circling over its head
    const h = (UVIS[u.type] ? UVIS[u.type].h : UDEF[u.type].h) * US + 4;
    c.save(); c.fillStyle = '#fff4c2';
    for (let i = 0; i < 3; i++) { const a = t * 7 + i * 2.09, x = w.x + Math.cos(a) * 6, y = w.y - h + Math.sin(a) * 2; c.beginPath(); for (let j = 0; j < 8; j++) { const r = j % 2 ? 0.8 : 2.2, b = j * Math.PI / 4; c.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); } c.closePath(); c.fill(); }
    c.restore();
  }
}
const pounceSquash6h = (u, t) => u.pcT > t ? (u.pcT - t) / 0.4 : 0; // 1 → 0 over the lunge: stretched forward, low

/* ---- on the ground: Bile Blooms, tunnel trails ---- */
function drawGround6h(c, g, lit, t) {
  for (const p of g.bp6 || []) {
    if (!lit(p.u, p.v)) continue;
    const w = P(p.u, p.v), T = TEAM[p.side], age = g.t - p.t0, left = p.end - g.t, k = Math.min(1, age / 0.4) * Math.min(1, left / 1.2), R = B6H.brood.r * (0.7 + 0.3 * Math.min(1, age / 0.4));
    c.save(); c.globalAlpha = 0.5 * k;
    const gr = c.createRadialGradient(w.x, w.y, 2, w.x, w.y, R); gr.addColorStop(0, 'rgba(190,250,110,0.9)'); gr.addColorStop(0.6, 'rgba(120,200,60,0.55)'); gr.addColorStop(1, 'rgba(60,120,30,0)');
    c.fillStyle = gr; c.beginPath(); c.ellipse(w.x, w.y, R, R * DY * 0.9, 0, 0, 7); c.fill();
    c.globalAlpha = 0.6 * k; c.strokeStyle = T.main; c.lineWidth = 1.4; c.setLineDash([5, 4]); c.beginPath(); c.ellipse(w.x, w.y, R * 0.95, R * DY * 0.85, 0, 0, 7); c.stroke(); c.setLineDash([]);
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + p.u, rr = R * (0.2 + 0.15 * i), x = w.x + Math.cos(a) * rr, y = w.y + Math.sin(a) * rr * DY * 0.8, b = ((t * 1.3 + i * 0.37) % 1); c.globalAlpha = k * (1 - b) * 0.8; c.strokeStyle = '#e8ffc0'; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y - b * 4, 1 + b * 2.2, 0, 7); c.stroke(); } // bubbles
    c.restore();
  }
  for (const r of g.tn6 || []) { // a unit travelling the tunnel: a ridge of dirt from where it went down toward the Ruinmaw
    if (g.t > r.end + 0.6) continue;
    if (r.side !== myS() && !g.spectate && !lit(r.u0, r.v0) && !lit(r.u1, r.v1)) continue;
    const a = P(r.u0, r.v0), b = P(r.u1, r.v1), k = clamp((g.t - r.t0) / Math.max(0.1, r.end - r.t0), 0, 1), fade = g.t > r.end ? 1 - (g.t - r.end) / 0.6 : 1;
    c.save(); c.globalAlpha = 0.55 * fade; c.strokeStyle = '#5a4030'; c.lineWidth = 2.2; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k); c.stroke(); c.setLineDash([]);
    const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k; c.globalAlpha = 0.8 * fade; c.fillStyle = '#7a5a40'; c.beginPath(); c.ellipse(x, y, 3.5, 1.6, 0, 0, 7); c.fill();
    c.restore();
  }
}

/* ---- the SIM's one-shot effects (g.fx kinds ending in 6) ---- */
const FX6H = {
  pounce6: (c, f) => { const k = f.t / f.life; c.save(); c.globalAlpha = 0.6 * (1 - k); c.fillStyle = '#b8a68a'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(f.x - f.face * (4 + i * 4 + k * 10), f.y - 2 - i, 2.2 + k * 3, 0, 7); c.fill(); } c.restore(); },
  stun6: (c, f) => { const k = f.t / f.life, R = f.r * (0.5 + 0.6 * k); c.save(); c.globalAlpha = 0.7 * (1 - k); c.strokeStyle = '#f3e3b0'; c.lineWidth = 2; c.beginPath(); c.ellipse(f.x, f.y, R, R * DY, 0, 0, 7); c.stroke(); c.fillStyle = 'rgba(180,160,120,0.5)'; for (let i = 0; i < 8; i++) { const a = i * 0.785; c.beginPath(); c.arc(f.x + Math.cos(a) * R, f.y + Math.sin(a) * R * DY - k * 6, 2.2, 0, 7); c.fill(); } c.restore(); },
  qbirth6: (c, f) => { const k = f.t / f.life, T = TEAM[f.side]; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${T.glow},${0.8 * (1 - k)})`; c.lineWidth = 2; const mx = (f.x + f.x2) / 2, my = Math.min(f.y, f.y2) - 18; c.beginPath(); c.moveTo(f.x + 6, f.y - 26); c.quadraticCurveTo(mx, my - 10, f.x2, f.y2); c.stroke(); c.fillStyle = `rgba(${T.glow},${0.7 * (1 - k)})`; c.beginPath(); c.arc(f.x2, f.y2, 4 + k * 8, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; c.fillStyle = `rgba(190,250,110,${0.8 * (1 - k)})`; for (let i = 0; i < 5; i++) { const a = i * 1.257; c.beginPath(); c.arc(f.x2 + Math.cos(a) * (3 + k * 9), f.y2 + Math.sin(a) * (2 + k * 5) - k * 4, 1.2, 0, 7); c.fill(); } c.restore(); },
  brood6: (c, f) => { const k = f.t / f.life, T = TEAM[f.side]; c.save(); c.globalAlpha = 1 - k; for (let i = 0; i < 9; i++) { const a = i * 0.7, r = 6 + k * 26; c.fillStyle = i % 2 ? T.light : '#c4f58e'; c.beginPath(); c.arc(f.x + Math.cos(a) * r, f.y - 10 + Math.sin(a) * r * 0.6 + k * k * 18, 2.4 - k * 1.4, 0, 7); c.fill(); } c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},${0.5 * (1 - k)})`; c.beginPath(); c.arc(f.x, f.y - 10, 10 + k * 16, 0, 7); c.fill(); c.restore(); },
  erupt6: (c, f) => { const k = f.t / f.life, R = f.r * (0.3 + 0.9 * k); c.save(); c.globalAlpha = 0.75 * (1 - k); c.strokeStyle = '#6b4a2e'; c.lineWidth = 5 * (1 - k) + 1; c.beginPath(); c.ellipse(f.x, f.y, R, R * DY, 0, 0, 7); c.stroke(); c.fillStyle = '#5a3c24'; for (let i = 0; i < 12; i++) { const a = i * 0.5236 + f.u, r = R * (0.6 + (i % 3) * 0.2), h = Math.sin(Math.min(1, k * 1.6) * Math.PI) * (16 + (i % 4) * 6); c.beginPath(); c.arc(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * DY - h, 2.6 - k, 0, 7); c.fill(); } c.restore(); },
  swallow6: (c, f) => { const k = f.t / f.life; c.save(); c.globalAlpha = 0.8 * (1 - k); c.strokeStyle = '#3b1f2b'; c.lineWidth = 3; c.beginPath(); c.arc(f.x, f.y, 14 * (1 - k) + 2, 0, 7); c.stroke(); c.restore(); },
  spit6: (c, f) => { const k = f.t / f.life; c.save(); c.globalAlpha = 0.8 * (1 - k); c.fillStyle = '#9be15d'; for (let i = 0; i < 6; i++) { const a = i * 1.05; c.beginPath(); c.arc(f.x + Math.cos(a) * (4 + k * 12), f.y + Math.sin(a) * (2 + k * 6) - 4, 1.8, 0, 7); c.fill(); } c.restore(); },
};
