/* ---------- Faction rework art, batch 4b (v2.87; docs/FACTION_REWORK.md "Art direction") ----------
   Leviathan (a huge Last Fist bomber: a fat riveted fuselage, four engines, team wings with hazard stripes, a bomb bay whose
   doors swing open over the target), Brood Tyrant (a bloated Bloomhost flyer on membrane wings, glowing sacs on its belly,
   team carapace plates), Worldrender (a colossal Bloomhost flyer with a huge maw underneath; landed, its wings fold, tendrils
   grip the building and the maw feeds), Voidcarrier (a floating platform of obsidian slabs held by lines of light, shards
   orbiting it, its power-field ring on the ground beneath) and Astral Sovereign (a huge obsidian crescent under a halo).
   All five are aircraft and draw live, as every aircraft does.
   Effects: the Sovereign's lock-on line (thin, brightening through the charge, a turning reticle on the target), its beam
   (massive, white, edged in its side's glow), a failed shot (the line sputters out, a cracked glyph flashes); pustules on
   buildings (glowing growths that pulse; a splat when one sticks, bursting open into Mites, a green wash when Repair clears
   them); a landed Worldrender's dust and bites; the Voidcarrier's small bright bolts. */

// Leviathan: bombs leave the bay at MUZ.leviathan (0, -10); u.lvB: the bay is open over the target
function dLev4(c, T, u) {
  const t = u.anim || 0, fl = 0.6 + 0.4 * Math.sin(t * 26), bay = u.lvB ? 1 : 0;
  const eng = (x, y, near) => { c.fillStyle = lgrad(c, 0, y - 2.4, 0, y + 2.4, near ? [STEEL[0], STEEL[1], STEEL[2]] : [STEEL[1], STEEL[2]]); rr(c, x - 7, y - 2.4, 12, 4.8, 2.2); c.fill(); outline(c, 0.7);
    c.fillStyle = RUSTO; c.fillRect(x - 3, y - 2.3, 1.4, 4.6); c.fillStyle = '#15171c'; c.beginPath(); c.ellipse(x + 5, y, 1.2, 2.2, 0, 0, 7); c.fill();
    c.fillStyle = `rgba(255,170,80,${0.6 * fl})`; c.beginPath(); c.ellipse(x - 9, y, 4 * fl + 2.5, 1.5, 0, 0, 7); c.fill(); };
  // the far wing (in shadow) and its two engines
  c.fillStyle = lgrad(c, 0, 2, 0, 16, [T.hull, '#1d2018']); poly(c, [[26, 2], [-8, 15], [-30, 15], [-20, 2]]); c.fill(); outline(c, 0.8);
  eng(-8, 8, false); eng(-20, 12, false);
  // the fat fuselage: team armour over olive, riveted, a glazed nose, a tail with a hazard-striped fin
  c.fillStyle = lgrad(c, -36, -16, -26, -2, [T.light, T.main, T.hull]); poly(c, [[-30, -4], [-40, -18], [-34, -18], [-22, -6]]); c.fill(); outline(c, 0.8); // tail fin
  c.save(); c.beginPath(); poly(c, [[-30, -4], [-40, -18], [-34, -18], [-22, -6]]); c.clip(); c.strokeStyle = HAZ; c.lineWidth = 1.6; for (let i = -3; i < 5; i++) { c.beginPath(); c.moveTo(-42 + i * 4, -4); c.lineTo(-34 + i * 4, -20); c.stroke(); } c.restore();
  c.fillStyle = lgrad(c, 0, -11, 0, 9, [OLIVE[0], OLIVE[1], OLIVE[2]]);
  c.beginPath(); c.moveTo(40, 0); c.quadraticCurveTo(38, -10, 24, -11); c.lineTo(-24, -10); c.quadraticCurveTo(-36, -8, -38, -2); c.quadraticCurveTo(-34, 6, -20, 8); c.lineTo(24, 8); c.quadraticCurveTo(38, 7, 40, 0); c.fill(); outline(c, 1.1);
  c.fillStyle = lgrad(c, 0, -11, 0, -2, [T.light, T.main]); c.beginPath(); c.moveTo(30, -9); c.lineTo(-26, -9.5); c.quadraticCurveTo(-32, -7, -33, -4); c.lineTo(28, -3.5); c.closePath(); c.fill(); // team spine
  rim(c, -24, -9.8, 24, 'rgba(255,255,255,0.4)');
  c.fillStyle = 'rgba(0,0,0,0.35)'; for (let x = -26; x < 26; x += 6) { c.beginPath(); c.arc(x, -2.6, 0.55, 0, 7); c.fill(); c.beginPath(); c.arc(x + 3, 5.2, 0.55, 0, 7); c.fill(); } // rivets
  c.fillStyle = lgrad(c, 32, -8, 40, 0, ['#d8f4ff', '#5d8aa8', '#1d3346']); c.beginPath(); c.moveTo(40, -0.5); c.quadraticCurveTo(38, -8, 30, -8.5); c.lineTo(29, -2); c.closePath(); c.fill(); outline(c, 0.7); // the glazed nose
  c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(34, -8); c.lineTo(33, -1); c.stroke();
  // the bomb bay: doors swing open over the target, bombs racked inside
  c.fillStyle = '#121418'; rr(c, -12, 6.5, 22, 3.4 + bay * 2.5, 1.2); c.fill();
  if (bay) { c.fillStyle = OLIVE[2]; for (const x of [-9, -3, 3]) { rr(c, x, 7.5, 4.6, 3.4, 1.6); c.fill(); } c.fillStyle = HAZ; for (const x of [-9, -3, 3]) c.fillRect(x + 1.2, 7.6, 0.9, 3.2);
    c.fillStyle = lgrad(c, 0, 8, 0, 16, [STEEL[1], STEEL[2]]); poly(c, [[-12, 8], [-15, 15], [-11, 15], [-9, 8.5]]); c.fill(); poly(c, [[10, 8], [13, 15], [9, 15], [7, 8.5]]); c.fill(); }
  else { c.fillStyle = STEEL[2]; c.fillRect(-12, 8.4, 22, 1.4); c.strokeStyle = HAZ; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-1, 6.6); c.lineTo(-1, 9.8); c.stroke(); }
  // the near wing: team plates with hazard stripes at the tip, two engines under it
  c.fillStyle = lgrad(c, 0, -26, 0, -2, [T.light, T.main, T.hull]); poly(c, [[22, -3], [-6, -27], [-30, -27], [-18, -4]]); c.fill(); outline(c, 1);
  c.save(); c.beginPath(); poly(c, [[22, -3], [-6, -27], [-30, -27], [-18, -4]]); c.clip(); c.strokeStyle = HAZ; c.lineWidth = 1.8; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-32 + i * 4.2, -22); c.lineTo(-26 + i * 4.2, -29); c.stroke(); } c.restore();
  rim(c, -28, -26.6, -7, 'rgba(255,255,255,0.45)');
  c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(10, -6); c.lineTo(-14, -26); c.stroke();
  eng(2, -13, true); eng(-12, -20, true);
}

// Brood Tyrant: its glob leaves the maw at MUZ.broodtyrant (20, -2)
function dTyr4(c, T, u) {
  const t = u.anim || 0, fl = Math.sin(t * 7), gape = (u.recoil || 0) * 2.5, pu = 0.6 + 0.4 * Math.sin(t * 3.5);
  const wing = (near) => { const y = near ? -10 : -6, tip = near ? -34 - fl * 7 : -26 - fl * 5;
    c.fillStyle = near ? 'rgba(170,120,160,0.55)' : 'rgba(110,80,115,0.5)'; c.beginPath(); c.moveTo(6, y); c.quadraticCurveTo(-4, tip - 2, -26, tip); c.quadraticCurveTo(-20, y - 6, -14, y + 2); c.closePath(); c.fill();
    c.strokeStyle = near ? BHC.flesh[2] : BHC.chit[2]; c.lineWidth = 1.1; c.beginPath(); c.moveTo(6, y); c.quadraticCurveTo(-4, tip - 2, -26, tip); c.moveTo(0, y - 1); c.lineTo(-18, tip + 3); c.moveTo(-6, y); c.lineTo(-22, y - 3); c.stroke(); };
  wing(false);
  // the bloated body: pale flesh below, team carapace plates on its back
  c.fillStyle = lgrad(c, 0, -10, 0, 12, [BHC.flesh[0], BHC.flesh[1], BHC.flesh[2]]);
  c.beginPath(); c.moveTo(-26, 0); c.bezierCurveTo(-28, -12, 6, -14, 15, -5); c.quadraticCurveTo(16, 8, 2, 11); c.quadraticCurveTo(-18, 12, -26, 0); c.fill(); outline(c, 1);
  // glowing sacs swollen on its belly
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.acid, -6, 8, 13, 0.45 * pu); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  for (const [x, y, r] of [[-12, 8, 4.2], [-3, 9.5, 4.8], [6, 7.5, 3.4]]) { c.fillStyle = lgrad(c, x, y - r, x, y + r, ['#e4ff9a', '#9be15d', '#3f7a22']); c.beginPath(); c.arc(x, y, r * (0.92 + 0.08 * pu), 0, 7); c.fill(); outline(c, 0.6); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, 7); c.fill(); }
  c.strokeStyle = '#9be15d'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-3, 14); c.quadraticCurveTo(-2, 16, -3.5, 17 + pu); c.stroke(); // a drip
  for (const [x0, x1] of [[-24, -12], [-14, -2], [-4, 9]]) { c.fillStyle = lgrad(c, 0, -13, 0, -2, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(x0, -1); c.quadraticCurveTo((x0 + x1) / 2, -14, x1 + 3, -7); c.quadraticCurveTo((x0 + x1) / 2, -4, x0, -1); c.fill(); outline(c, 0.7); } // overlapping plates
  // the head: a team crest, bone mandibles round a gaping maw, glowing eyes
  c.fillStyle = lgrad(c, 12, -9, 20, 3, [BHC.chit[0], BHC.chit[2]]); c.beginPath(); c.ellipse(16, -2, 7, 6, 0.1, 0, 7); c.fill(); outline(c, 0.8);
  c.fillStyle = T.main; c.beginPath(); c.moveTo(11, -7); c.quadraticCurveTo(16, -12, 21, -6); c.quadraticCurveTo(16, -8, 11, -7); c.fill();
  c.fillStyle = BHC.dark; c.beginPath(); c.moveTo(19, -1); c.lineTo(25 + gape, -4 - gape); c.lineTo(25 + gape, 3 + gape); c.closePath(); c.fill();
  c.fillStyle = BHC.bone; c.beginPath(); c.moveTo(20, -3); c.lineTo(27 + gape, -6 - gape); c.lineTo(22, -1.5); c.fill(); c.beginPath(); c.moveTo(20, 1.5); c.lineTo(27 + gape, 5 + gape); c.lineTo(22, 0.5); c.fill();
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.95)`; c.beginPath(); c.arc(18, -4, 1.1, 0, 7); c.fill(); c.beginPath(); c.arc(15, -4.5, 0.8, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  c.strokeStyle = BHC.chit[2]; c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath(); c.moveTo(-8, 10); c.quadraticCurveTo(-10, 15, -6, 17); c.moveTo(4, 9); c.quadraticCurveTo(5, 14, 9, 15); c.stroke(); c.lineCap = 'butt'; // hanging claws
  wing(true);
}

// Worldrender: the maw underneath at MUZ.worldrender (0, -8). Landing (u.lnd 1-3) folds its wings and grips with tendrils
const lnK = u => { const t = VFX.lastT; return u.lnd === 1 ? clamp(1 - (u.lnT - t) / LAND.t, 0, 1) : u.lnd === 2 ? 1 : u.lnd === 3 ? clamp((u.lnT - t) / LAND.t, 0, 1) : 0; };
function dWorld4(c, T, u) {
  const t = u.anim || 0, k = u.lnd ? lnK(u) : 0, r = Math.sin(t * 2.2) * (1 - k), feed = u.lnd === 2 ? Math.max(0, Math.sin(Math.PI * clamp(1 - ((u.lnF || 0) - VFX.lastT) / LAND.every, 0, 1) * 2)) : 0, gape = 3 + feed * 6 + (u.recoil || 0) * 3;
  const span = 1 - 0.6 * k, lift = -k * 4;
  // the far wing
  c.fillStyle = lgrad(c, 0, -18, 0, 0, [BHC.chit[1], BHC.chit[2]]); c.beginPath(); c.moveTo(16, -6 + lift); c.quadraticCurveTo(0, -16 * span + lift, -34 * span, (-14 + r * 4) * span + lift); c.quadraticCurveTo(-16, -3, 0, -1); c.closePath(); c.fill(); outline(c, 0.8);
  // tendrils reaching down and forward (gripping when landed)
  c.strokeStyle = BHC.flesh[2]; c.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const x0 = -10 + i * 7, wv = Math.sin(t * 3 + i) * (1 - k) * 2, ex = x0 + 6 + k * (16 + i * 3), ey = 12 + k * (6 - i) + wv; c.lineWidth = 2.4 - i * 0.3; c.beginPath(); c.moveTo(x0, 6); c.quadraticCurveTo(x0 + 2, 12 + wv, ex, ey); c.stroke(); c.strokeStyle = BHC.flesh[1]; c.lineWidth = 1; c.stroke(); c.strokeStyle = BHC.flesh[2]; }
  c.lineCap = 'butt';
  // the vast body: carapace on top in the team colour, a pale ribbed underside, the barbed tail
  c.fillStyle = lgrad(c, 0, -10, 0, 10, [BHC.flesh[0], BHC.flesh[1], BHC.flesh[2]]);
  c.beginPath(); c.moveTo(36, 0); c.quadraticCurveTo(26, -10, 0, -10); c.quadraticCurveTo(-28, -9, -46, -2); c.quadraticCurveTo(-26, 6, 0, 8); c.quadraticCurveTo(26, 8, 36, 0); c.fill(); outline(c, 1.2);
  c.strokeStyle = 'rgba(40,10,20,0.45)'; c.lineWidth = 0.8; for (let x = -24; x < 22; x += 6) { c.beginPath(); c.moveTo(x, 6.5); c.quadraticCurveTo(x + 2, 2, x + 1, -2); c.stroke(); }
  for (let i = 0; i < 5; i++) { const x0 = 24 - i * 13; c.fillStyle = lgrad(c, 0, -14, 0, -3, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(x0 + 6, -4); c.quadraticCurveTo(x0, -15 + i * 0.5, x0 - 12, -9 + i * 0.6); c.quadraticCurveTo(x0 - 4, -5, x0 + 6, -4); c.fill(); outline(c, 0.7); } // carapace plates
  c.fillStyle = BHC.bone; for (let i = 0; i < 6; i++) { const x = 18 - i * 8; c.beginPath(); c.moveTo(x - 2, -10 + i * 0.3); c.lineTo(x, -15 + i * 0.4); c.lineTo(x + 2, -10 + i * 0.3); c.fill(); } // back ridge
  c.strokeStyle = BHC.bone; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-46, -2); c.quadraticCurveTo(-52, -5, -55, 1); c.stroke();
  // the huge maw underneath: bone teeth round a glowing gullet
  c.fillStyle = BHC.dark; c.beginPath(); c.ellipse(6, 7 + gape * 0.4, 12, 2.5 + gape * 0.6, 0, 0, 7); c.fill();
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.acid, 6, 8 + gape * 0.4, 8 + gape, 0.35 + 0.4 * feed); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.fillStyle = BHC.bone; for (let i = 0; i < 7; i++) { const x = -5 + i * 3.6; c.beginPath(); c.moveTo(x - 1.2, 6); c.lineTo(x, 9 + gape * 0.3); c.lineTo(x + 1.2, 6); c.fill(); c.beginPath(); c.moveTo(x - 1.2, 8 + gape); c.lineTo(x + 0.3, 5 + gape * 0.6); c.lineTo(x + 1.6, 8 + gape); c.fill(); }
  // eyes along the head
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.95)`; for (const x of [28, 31.5]) { c.beginPath(); c.arc(x, -3, 1.1, 0, 7); c.fill(); } c.globalCompositeOperation = 'source-over';
  // the near wing: folds down along its flank as it lands
  c.fillStyle = lgrad(c, 0, -32, 0, -4, [BHC.chit[0], BHC.chit[1]]);
  c.beginPath(); c.moveTo(14, -8 + lift); c.quadraticCurveTo(-4, (-30 - r * 6) * span + lift, -40 * span, (-28 - r * 8) * span + lift); c.quadraticCurveTo(-20, -12, -6, -5); c.closePath(); c.fill(); outline(c, 1);
  c.strokeStyle = 'rgba(30,20,40,0.6)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(10, -8 + lift); c.quadraticCurveTo(-6, (-26 - r * 5) * span + lift, -36 * span, (-26 - r * 7) * span + lift); c.moveTo(4, -7 + lift); c.lineTo(-24 * span, (-22 - r * 4) * span + lift); c.stroke();
  c.fillStyle = T.main; c.globalAlpha = 0.7; c.beginPath(); c.moveTo(6, -8 + lift); c.quadraticCurveTo(-8, (-22 - r * 4) * span + lift, -26 * span, (-22 - r * 6) * span + lift); c.quadraticCurveTo(-12, -10, 6, -8 + lift); c.fill(); c.globalAlpha = 1;
}

// Voidcarrier: its bolt leaves MUZ.voidcarrier (22, 1)
function dVoid4(c, T, u) {
  const t = u.anim || 0, y0 = Math.sin(t * 1.6) * 1.2, rk = (u.recoil || 0) * 2;
  const slab = (pts, lit) => { c.fillStyle = lgrad(c, pts[0][0], pts[0][1], pts[2][0], pts[2][1], lit ? [T.light, T.main, T.hull] : [OBS[0], OBS[1], OBS[2]]); poly(c, pts); c.fill(); outline(c, 0.9); };
  const orb = front => { for (let i = 0; i < 5; i++) { const a = t * 1.1 + i / 5 * Math.PI * 2, sy = Math.sin(a); if ((sy >= 0) !== front) continue; const x = Math.cos(a) * 30, y = y0 - 2 + sy * 6; c.fillStyle = front ? OBS[0] : OBS[2]; poly(c, [[x, y - 3.4], [x + 1.6, y], [x, y + 2.4], [x - 1.6, y]]); c.fill(); c.strokeStyle = `rgba(${T.glow},${front ? 0.8 : 0.35})`; c.lineWidth = 0.7; c.stroke(); } };
  orb(false);
  // three stacked slabs of obsidian, nothing touching, held by lines of light
  c.strokeStyle = `rgba(${T.glow},0.75)`; c.lineWidth = 0.8; c.beginPath(); for (const x of [-16, 0, 14]) { c.moveTo(x, y0 - 9); c.lineTo(x, y0 - 6); c.moveTo(x, y0 + 1); c.lineTo(x, y0 + 4); } c.stroke();
  slab([[-26, y0 - 6], [24, y0 - 6], [28, y0 + 1], [-22, y0 + 1]], false); // the middle deck
  slab([[-20, y0 - 15], [18, y0 - 15], [22 - rk, y0 - 9], [-16, y0 - 9]], true); // the upper slab, team stone
  slab([[-14, y0 + 4], [14, y0 + 4], [8, y0 + 10], [-10, y0 + 10]], false); // the keel
  rim(c, -18, y0 - 14.6, 16, 'rgba(255,255,255,0.5)');
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = `rgba(${T.glow},0.85)`; c.lineWidth = 1; c.beginPath(); c.moveTo(-20, y0 - 2.5); c.lineTo(22, y0 - 2.5); c.stroke(); // glyph band
  stamp(c, GLOW['t' + u.side], 0, y0 + 13, 12, 0.5 + 0.2 * Math.sin(t * 3)); // the field's core glowing beneath
  c.fillStyle = `rgba(${T.glow},0.95)`; c.beginPath(); c.arc(0, y0 + 13, 2.2, 0, 7); c.fill();
  c.fillStyle = '#eaffff'; c.beginPath(); c.arc(22 - rk, y0 - 12, 1.4 + (u.recoil || 0) * 1.4, 0, 7); c.fill(); // the bolt's emitter
  c.globalCompositeOperation = 'source-over';
  orb(true);
}

// Astral Sovereign: its beam leaves MUZ.sovereign (0, -8), under the crescent
function dSov4(c, T, u) {
  const t = u.anim || 0, y0 = Math.sin(t * 1.2) * 1.4, ch = u.chT && VFX.g && u.chT > VFX.lastT ? 1 - (u.chT - VFX.lastT) / (rwD(VFX.g, 'sovereign').charge || 2.5) : 0;
  // the halo behind it
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW['t' + u.side], -4, y0 - 20, 30, 0.25 + 0.35 * ch);
  c.strokeStyle = `rgba(${T.glow},${0.55 + 0.4 * ch})`; c.lineWidth = 1.6; c.beginPath(); c.ellipse(-4, y0 - 20, 9, 22, 0, 0, 7); c.stroke();
  c.strokeStyle = `rgba(${AXC.pale},0.5)`; c.lineWidth = 0.7; c.beginPath(); c.ellipse(-4, y0 - 20, 12, 26, 0, t * 0.6, t * 0.6 + 2); c.stroke();
  c.globalCompositeOperation = 'source-over';
  // the crescent: a vast obsidian blade sweeping back to two horns, team stone set along it
  const cres = () => { c.beginPath(); c.moveTo(46, y0); c.quadraticCurveTo(20, y0 - 30, -40, y0 - 28); c.quadraticCurveTo(-14, y0 - 16, -8, y0); c.quadraticCurveTo(-14, y0 + 14, -40, y0 + 22); c.quadraticCurveTo(20, y0 + 24, 46, y0); c.closePath(); };
  c.fillStyle = lgrad(c, 0, y0 - 28, 0, y0 + 22, [OBS[0], OBS[1], OBS[2]]); cres(); c.fill(); outline(c, 1.2);
  c.fillStyle = lgrad(c, 0, y0 - 22, 0, y0 + 16, [T.light, T.main, T.hull]);
  c.beginPath(); c.moveTo(36, y0); c.quadraticCurveTo(14, y0 - 20, -26, y0 - 21); c.quadraticCurveTo(-6, y0 - 12, -1, y0); c.quadraticCurveTo(-6, y0 + 10, -26, y0 + 16); c.quadraticCurveTo(14, y0 + 16, 36, y0); c.closePath(); c.fill(); outline(c, 0.8);
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = `rgba(${T.glow},0.8)`; c.lineWidth = 2; cres(); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(46, y0); c.quadraticCurveTo(20, y0 - 30, -40, y0 - 28); c.stroke();
  // glyphs and the core under the crescent, brightening as it charges
  c.strokeStyle = `rgba(${AXC.pale},0.6)`; c.lineWidth = 0.8; c.beginPath(); for (const x of [-16, 6, 24]) { c.moveTo(x - 2, y0 - 4); c.lineTo(x + 2, y0 - 4); c.moveTo(x, y0 - 6); c.lineTo(x, y0 - 2); } c.stroke();
  stamp(c, GLOW.white, 0, y0 + 8, 6 + ch * 12, 0.5 + 0.5 * ch);
  c.fillStyle = `rgba(${T.glow},0.95)`; poly(c, [[0, y0 + 3], [3, y0 + 8], [0, y0 + 13], [-3, y0 + 8]]); c.fill();
  c.globalCompositeOperation = 'source-over';
  // two shards floating off the horns
  for (const s of [-1, 1]) { const y = y0 + s * (26 + Math.sin(t * 2 + s) * 1.5); c.fillStyle = OBS[1]; poly(c, [[-48, y], [-40, y - s * 2], [-36, y]]); c.fill(); c.strokeStyle = `rgba(${T.glow},0.5)`; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-36, y); c.lineTo(-32, y * 0.9); c.stroke(); }
}

DRAW_U.leviathan = dLev4; DRAW_U.broodtyrant = dTyr4; DRAW_U.worldrender = dWorld4; DRAW_U.voidcarrier = dVoid4; DRAW_U.sovereign = dSov4;

/* ---- on units ---- */
// The Voidcarrier's power-field ring on the ground beneath it (its reach, P9's radius), turning slowly
function drawVcRing(c, u, w, t) {
  const d = UDEF.voidcarrier, R = (d.node && d.node.r) || 120, T = TEAM[u.side];
  c.save(); c.strokeStyle = `rgba(${T.glow},${0.32 + 0.1 * Math.sin(t * 2 + u.id)})`; c.lineWidth = 1.4; c.setLineDash([10, 7]); c.lineDashOffset = -t * 12;
  c.beginPath(); c.ellipse(w.x, w.y, R, R * DY, 0, 0, 7); c.stroke(); c.setLineDash([]);
  c.strokeStyle = `rgba(${T.glow},0.18)`; c.lineWidth = 4; c.beginPath(); c.ellipse(w.x, w.y, R * 0.98, R * 0.98 * DY, 0, 0, 7); c.stroke(); c.restore();
}
// A landed Worldrender: dust rising round it while it feeds
function drawLandedDust(c, u, w, t) {
  const k = u.lnd === 2 ? 1 : lnK(u);
  for (let i = 0; i < 6; i++) { const ph = (t * 0.7 + i / 6) % 1, x = w.x + Math.cos(i * 1.7 + u.id) * (18 + ph * 22) * US, y = w.y - ph * 14 * US; c.fillStyle = `rgba(150,130,105,${0.35 * k * (1 - ph)})`; c.beginPath(); c.arc(x, y, (3 + ph * 6) * US, 0, 7); c.fill(); }
}
// The Sovereign's lock-on: a thin line of light to its target, brightening through the charge; a turning reticle on it
function drawLockOn(c, g, u, d) {
  const T0 = ctlEnt(g, u.chTgt); if (!T0 || T0.hp <= 0) return;
  const k = clamp(1 - (u.chT - g.t) / d.charge, 0, 1), m = muzzle(u), a = P(m.u, m.v, m.z), b = P(T0.u, T0.v, aimZ(T0)), T = TEAM[u.side];
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  c.strokeStyle = `rgba(${T.glow},${0.15 + 0.45 * k})`; c.lineWidth = 1 + 3 * k; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  c.strokeStyle = `rgba(255,255,255,${0.3 + 0.6 * k})`; c.lineWidth = 0.6 + 0.8 * k; c.stroke();
  const R = 14 - 6 * k, sp = g.t * 3; c.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * k})`; c.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) { const an = sp + i * Math.PI / 2; c.beginPath(); c.arc(b.x, b.y, R, an, an + 0.9); c.stroke(); }
  stamp(c, GLOW.white, a.x, a.y, 4 + 10 * k, 0.8); stamp(c, GLOW['t' + u.side], b.x, b.y, 6 + 10 * k, 0.3 + 0.5 * k);
  c.restore(); c.globalAlpha = 1;
}
// Pustules on a building: up to three glowing growths that pulse, in the infesting side's sickly green
const PUS_AT = [[-0.45, 0.35], [0.4, 0.55], [-0.05, 0.75]];
function drawPustules(c, b, t) {
  const d = bdOf(b), w = P(b.u, b.v);
  for (let i = 0; i < Math.min(3, b.pus); i++) {
    const [fx, fy] = PUS_AT[(i + b.id) % 3], x = w.x + fx * d.half * BS, y = w.y - (d.h * fy) * BS * 0.6 - 6, pu = 0.5 + 0.5 * Math.sin(t * 4 + i * 2.1), r = (4.5 + pu * 1.4) * US;
    c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.acid, x, y, r * 3, 0.45 + 0.3 * pu); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.fillStyle = '#5a2c3c'; c.beginPath(); c.ellipse(x, y + r * 0.6, r * 1.3, r * 0.5, 0, 0, 7); c.fill(); // the root crust
    c.fillStyle = lgrad(c, x, y - r, x, y + r, ['#f0ffb0', '#a8e86a', '#4f8a2a']); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); outline(c, 0.7);
    c.strokeStyle = 'rgba(90,40,60,0.7)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - r * 0.6, y - r * 0.2); c.quadraticCurveTo(x, y + r * 0.3, x + r * 0.5, y - r * 0.4); c.stroke(); // veins
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.4, r * 0.25, 0, 7); c.fill();
  }
}
// Leviathan run: none needed beyond the bay pose; its bombs are the existing falling bombs

/* ---- effects ---- */
function drawJudge(c, f) { // the judgement beam: massive, white, edged in the side's glow, a flare at both ends
  const k = f.t / f.life, a = 1 - k, T = TEAM[f.side] || TEAM[0];
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  c.strokeStyle = `rgba(${T.glow},${0.55 * a})`; c.lineWidth = 16 * (1 - k * 0.5); c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.stroke();
  c.strokeStyle = `rgba(255,255,255,${0.95 * a})`; c.lineWidth = 7 * (1 - k * 0.6); c.stroke();
  c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 2; c.stroke();
  stamp(c, GLOW.white, f.x2, f.y2, 30 * (1 - k * 0.3), a); stamp(c, GLOW['t' + f.side], f.x2, f.y2, 44, 0.6 * a); stamp(c, GLOW.white, f.x, f.y, 14, a);
  c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 1.5; c.beginPath(); c.ellipse(f.x2, f.y2, 8 + k * 30, (8 + k * 30) * 0.45, 0, 0, 7); c.stroke();
  c.restore(); c.globalAlpha = 1;
}
function drawSovFail(c, f) { // the shot fails: the line sputters out in broken dashes; a cracked glyph flashes at the ship
  const k = f.t / f.life, a = 1 - k, T = TEAM[f.side] || TEAM[0];
  c.save(); c.globalCompositeOperation = 'lighter';
  c.strokeStyle = `rgba(${T.glow},${0.7 * a})`; c.lineWidth = 1.4; c.setLineDash([3 + k * 6, 4 + k * 14]); c.lineDashOffset = k * 30; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.stroke(); c.setLineDash([]);
  const r = 9 + k * 6; c.strokeStyle = `rgba(255,120,140,${a})`; c.lineWidth = 1.6;
  c.beginPath(); for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2; c.lineTo(f.x + Math.cos(an) * r, f.y + Math.sin(an) * r); } c.closePath(); c.stroke();
  c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 1.1; c.beginPath(); c.moveTo(f.x - r * 0.8, f.y - r * 0.5); c.lineTo(f.x - 1, f.y + 1); c.lineTo(f.x + 2, f.y - 3); c.lineTo(f.x + r * 0.7, f.y + r * 0.6); c.stroke(); // the crack
  stamp(c, GLOW.white, f.x, f.y, 10 * a, a);
  c.restore(); c.globalAlpha = 1;
}
function drawPusAdd(c, f) { // a glob sticks: green spatter
  const k = f.t / f.life, a = 1 - k;
  for (let i = 0; i < 6; i++) { const b = i * 1.05 + f.u, r = 3 + k * 12; c.fillStyle = `rgba(190,245,110,${0.85 * a})`; c.beginPath(); c.arc(f.x + Math.cos(b) * r, f.y + Math.sin(b) * r * 0.6, 1.7, 0, 7); c.fill(); }
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.acid, f.x, f.y, 12 * a, a); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
function drawPusBurst(c, f) { // a pustule bursting open: a flesh-pink and green blossom, shreds thrown out
  const k = f.t / f.life, a = 1 - k, R = 6 + k * 22;
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.acid, f.x, f.y, R * 1.6, 0.8 * a); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  for (let i = 0; i < 6; i++) { const b = i / 6 * Math.PI * 2 + f.u * 0.01; c.fillStyle = `rgba(200,90,120,${0.9 * a})`; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x + Math.cos(b - 0.25) * R, f.y + Math.sin(b - 0.25) * R * 0.7); c.lineTo(f.x + Math.cos(b + 0.25) * R, f.y + Math.sin(b + 0.25) * R * 0.7); c.closePath(); c.fill(); }
  for (let i = 0; i < 8; i++) { const b = i * 0.8 + 0.3, r = R * 1.3; c.fillStyle = `rgba(190,245,110,${a})`; c.beginPath(); c.arc(f.x + Math.cos(b) * r, f.y + Math.sin(b) * r * 0.6 - Math.sin(k * Math.PI) * 10, 2, 0, 7); c.fill(); }
}
function drawPusClear(c, f) { // Repair clears them: a green-white wash rising off the building
  const k = f.t / f.life, a = 1 - k;
  c.strokeStyle = `rgba(125,255,176,${a})`; c.lineWidth = 2; c.beginPath(); c.ellipse(f.x, f.y - k * 20, f.r * BS * (0.6 + k * 0.6), f.r * BS * 0.3 * (0.6 + k * 0.6), 0, 0, 7); c.stroke();
  c.fillStyle = `rgba(220,255,230,${a})`; for (let i = 0; i < 7; i++) { const b = i * 0.9; c.fillRect(f.x + Math.cos(b) * f.r * 0.6 * BS - 1, f.y - k * 30 - (i % 3) * 6, 2, 2); }
}
function drawLandDust(c, f) { // touchdown: a broad dust ring
  const k = f.t / f.life, a = 1 - k, R = (20 + k * 50) * US;
  c.fillStyle = `rgba(160,140,110,${0.4 * a})`; c.beginPath(); c.ellipse(f.x, f.y, R, R * 0.35, 0, 0, 7); c.fill();
  c.strokeStyle = `rgba(200,180,150,${0.6 * a})`; c.lineWidth = 2; c.stroke();
}
function drawChomp(c, f) { // a bite into the building: debris and a green spray
  const k = f.t / f.life, a = 1 - k;
  for (let i = 0; i < 7; i++) { const b = -Math.PI * (0.15 + i / 8), r = 4 + k * 18; c.fillStyle = i % 2 ? `rgba(120,110,95,${a})` : `rgba(180,240,110,${a})`; c.fillRect(f.x + Math.cos(b) * r - 1.2, f.y + Math.sin(b) * r - 1.2 + k * k * 10, 2.4, 2.4); }
}
function drawVBolt(c, p, a, b) { // a Voidcarrier's bolt: a small bright bolt in its side's glow
  const T = TEAM[p.side] || TEAM[0];
  c.strokeStyle = `rgba(${T.glow},0.8)`; c.lineWidth = 2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW['t' + p.side], b.x, b.y, 6, 0.9); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(b.x, b.y, 1.6, 0, 7); c.fill();
}
