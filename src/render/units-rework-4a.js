/* ---------- Faction rework art, batch 4a (v2.86; docs/FACTION_REWORK.md "Art direction") ----------
   Sniper (a lean Last Fist marksman in a ragged scrap cloak with gas-mask goggles and a long rail rifle with glowing coils),
   Astral Marksman (a tall Axiarch figure of floating obsidian plates with a crest and a long floating lance-rifle; the lance
   glows while it charges), Bilecaster (a Bloomhost spitter with swollen glowing bile sacs on its throat under a team-coloured
   carapace hood), Gunship (a Last Fist rotorcraft with stub wings, two rocket pods, team armour and hazard stripes) and
   Wraithwing (an Axiarch crescent blade of obsidian with glowing edges). The three ground units are cached as poses (the
   Marksman's charge is a pose); the two aircraft draw live, as every aircraft does.
   Effects: pinned units (dust puffs at the feet and a downward chevron over them), the mark (a slowly turning glyph sigil in
   the marking side's glow over the target), Bilecaster pools (a bubbling acid-green pool with a faint team rim, fading out)
   and its arcing glob, the Gunship's missiles (bright streaks with long trails), and the Wraithwing's hop (a violet flash
   where it left, an afterimage trail, a flash where it lands), plus a puff where a shot that lost it lands. */

// Sniper: tip of the rail rifle at MUZ.sniper (17, -14)
function dSniper4(c, T, u) {
  const ph = u.moving ? (u.anim || 0) * 10 : 0, st = Math.sin(ph), rk = (u.recoil || 0) * 2;
  c.lineCap = 'round'; c.lineJoin = 'round';
  // the far leg, the cloak's ragged back
  const leg = (s, near) => { const k = s * 3; c.strokeStyle = OUTL; c.lineWidth = near ? 3.2 : 2.8; c.beginPath(); c.moveTo(-1, -9); c.lineTo(-1 + k * 0.5, -4.5); c.lineTo(-1 + k, 0); c.stroke(); c.strokeStyle = near ? OLIVE[1] : OLIVE[2]; c.lineWidth = near ? 2 : 1.7; c.stroke(); c.fillStyle = '#20231a'; rr(c, -2.6 + k, -1.4, 4.6, 1.8, 0.8); c.fill(); };
  leg(-st, false);
  c.fillStyle = lgrad(c, -10, -20, -2, -2, [T.main, T.hull, '#202418']);
  c.beginPath(); c.moveTo(-3, -20); c.quadraticCurveTo(-9, -14, -10.5, -5); c.lineTo(-9, -3.5); c.lineTo(-8, -6); c.lineTo(-6.6, -3); c.lineTo(-5.2, -6.2); c.lineTo(-3.8, -3.6); c.lineTo(-2.4, -7); c.lineTo(1.5, -8); c.lineTo(2, -18); c.closePath(); c.fill(); outline(c, 0.9); // ragged scrap cloak
  c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-5, -17); c.lineTo(-8, -7); c.moveTo(-2, -17); c.lineTo(-4, -8); c.stroke(); // patched seams
  leg(st, true);
  // the body: olive webbing over a team vest, a rust canister on the back
  c.fillStyle = RUSTO; rr(c, -6.5, -17, 3, 6, 1.2); c.fill(); outline(c, 0.6);
  c.fillStyle = lgrad(c, 0, -19, 0, -9, [T.light, T.main, T.hull]); rr(c, -3, -18.5, 6.4, 10, 2); c.fill(); outline(c, 0.8);
  c.strokeStyle = OLIVE[2]; c.lineWidth = 1; c.beginPath(); c.moveTo(-2.5, -18); c.lineTo(3, -10); c.stroke();
  // the head: a hood over a gas mask with two round glowing goggles and a filter can
  c.fillStyle = lgrad(c, -3, -27, 3, -19, [OLIVE[0], OLIVE[2]]); c.beginPath(); c.moveTo(-4.2, -19); c.quadraticCurveTo(-5, -26.5, 0.5, -27); c.quadraticCurveTo(4.5, -26.5, 4.2, -20.5); c.closePath(); c.fill(); outline(c, 0.8); // hood
  c.fillStyle = STEEL[2]; rr(c, -0.5, -24.2, 5, 4.4, 1.6); c.fill(); outline(c, 0.6); // the mask
  c.fillStyle = STEEL[1]; c.beginPath(); c.arc(3.8, -19.8, 1.6, 0, 7); c.fill(); outline(c, 0.5); // filter can
  c.globalCompositeOperation = 'lighter';
  for (const x of [1.4, 3.6]) { c.fillStyle = `rgba(${T.glow},0.45)`; c.beginPath(); c.arc(x, -22.6, 1.9, 0, 7); c.fill(); c.fillStyle = '#eaffff'; c.beginPath(); c.arc(x, -22.6, 0.75, 0, 7); c.fill(); }
  c.globalCompositeOperation = 'source-over';
  // the long rail rifle: a dark barrel with three glowing coils, a scope; the arm braced under it
  c.fillStyle = lgrad(c, 0, -16, 0, -13, [STEEL[0], STEEL[2]]); rr(c, -6 - rk, -15.8, 23.5, 2, 0.8); c.fill(); outline(c, 0.7);
  c.fillStyle = STEEL[2]; rr(c, -7 - rk, -15.3, 4, 3.2, 1); c.fill(); // stock
  c.fillStyle = '#20242c'; rr(c, 1 - rk, -18.6, 6.5, 2.2, 1); c.fill(); c.fillStyle = `rgba(${T.glow},0.9)`; c.fillRect(7 - rk, -18.2, 0.8, 1.4); // scope and its lens
  c.globalCompositeOperation = 'lighter';
  for (const x of [9, 11.6, 14.2]) { c.fillStyle = `rgba(${T.glow},0.35)`; c.beginPath(); c.arc(x - rk, -14.8, 2.4, 0, 7); c.fill(); c.fillStyle = `rgba(${T.glow},0.95)`; c.fillRect(x - 0.6 - rk, -16.4, 1.2, 3.2); }
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = STEEL[2]; c.lineWidth = 0.8; c.beginPath(); c.moveTo(10 - rk, -13.8); c.lineTo(12 - rk, -9); c.moveTo(10 - rk, -13.8); c.lineTo(8.5 - rk, -9); c.stroke(); // bipod
  c.strokeStyle = OUTL; c.lineWidth = 2.6; c.beginPath(); c.moveTo(0, -16); c.lineTo(2, -13.5); c.lineTo(4.5 - rk, -14.4); c.stroke(); c.strokeStyle = T.hull; c.lineWidth = 1.6; c.stroke(); // arm
  c.lineCap = 'butt';
}

// Astral Marksman: tip of the lance-rifle at MUZ.marksman (20, -20); u.ch: charging (the lance glows)
function dMarks4(c, T, u) {
  const t = u.anim || 0, y0 = hov(u, u.moving ? 4 : 1.8), ph = u.moving ? t * 4 : 0, ch = u.ch || 0, rk = (u.recoil || 0) * 3;
  const slab = (pts, lit) => { c.fillStyle = lgrad(c, pts[0][0], pts[0][1], pts[2][0], pts[2][1], lit ? [T.light, T.main, T.hull] : [OBS[0], OBS[1], OBS[2]]); poly(c, pts); c.fill(); outline(c, 0.9); };
  c.fillStyle = `rgba(${T.glow},0.18)`; c.beginPath(); c.ellipse(0, -0.5, 10, 2.4, 0, 0, 7); c.fill();
  // legs: two long floating shards that step
  const s1 = Math.sin(ph) * 2;
  slab([[-5 + s1, y0 - 19], [-1.5 + s1, y0 - 19], [-2 + s1, y0 - 2], [-4.5 + s1, y0 - 1]], false);
  slab([[1.5 - s1, y0 - 19], [5 - s1, y0 - 19], [4.5 - s1, y0 - 1], [2 - s1, y0 - 2]], false);
  // lines of light holding the plates together
  c.strokeStyle = `rgba(${T.glow},0.8)`; c.lineWidth = 0.8; c.beginPath();
  for (const [a, b, x, y] of [[-3, y0 - 20, -3, y0 - 23], [3, y0 - 20, 3, y0 - 23], [0, y0 - 37, 0, y0 - 40], [-6, y0 - 30, -9, y0 - 30]]) { c.moveTo(a, b); c.lineTo(x, y); }
  c.stroke();
  // the tall torso: an obsidian plate with a team breastplate, a pauldron
  slab([[-6, y0 - 37], [6, y0 - 37], [5, y0 - 23], [-5, y0 - 23]], false);
  slab([[-4, y0 - 35.5], [4.5, y0 - 35.5], [3.5, y0 - 25], [-3.5, y0 - 25]], true);
  rim(c, -5.5, y0 - 37, 5.5, 'rgba(230,220,255,0.55)');
  slab([[-11, y0 - 34], [-6.5, y0 - 36], [-7, y0 - 28], [-11.5, y0 - 29]], true);
  // a glowing core and the head: a narrow obsidian mask with a slit visor, a crest of three blades above it
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.9)`; poly(c, [[0.5, y0 - 33], [2.5, y0 - 30], [0.5, y0 - 27], [-1.5, y0 - 30]]); c.fill(); c.globalCompositeOperation = 'source-over';
  const hy = y0 - 44 + Math.sin(t * 2) * 0.5;
  slab([[-3, hy], [3.5, hy], [3, hy + 5], [-2.5, hy + 5]], false);
  c.fillStyle = `rgba(${T.glow},1)`; c.fillRect(-0.5, hy + 2, 4, 1);
  for (const [x, h, a] of [[-2, 7, -0.35], [0.5, 9, 0], [3, 6, 0.35]]) { c.save(); c.translate(x, hy - 1); c.rotate(a); slab([[-1.1, 0], [1.1, 0], [0, -h]], true); c.restore(); }
  // the floating lance-rifle: a long obsidian prism held off its hands by light, a crystal at the tip
  const ly = -20 + y0 * 0.3;
  c.save(); c.translate(-rk, 0);
  slab([[-8, ly - 1.5], [17, ly - 1.8], [19, ly], [17, ly + 1.8], [-8, ly + 1.5]], false);
  c.strokeStyle = `rgba(${T.glow},${0.6 + 0.4 * ch})`; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-6, ly); c.lineTo(16, ly); c.stroke(); // its light core
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = `rgba(${T.glow},${0.35 + 0.5 * ch})`; c.beginPath(); c.arc(20, ly, 3 + 3 * ch, 0, 7); c.fill();
  c.fillStyle = ch ? '#ffffff' : `rgba(${T.glow},1)`; poly(c, [[18, ly], [20, ly - 2], [22.5, ly], [20, ly + 2]]); c.fill();
  if (ch) for (let i = 0; i < 3; i++) { const x = -2 + i * 6; c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(x, ly - 0.4, 2.5, 0.8); }
  c.globalCompositeOperation = 'source-over';
  c.restore();
  c.strokeStyle = `rgba(${T.glow},0.7)`; c.lineWidth = 0.7; c.beginPath(); c.moveTo(4, y0 - 26); c.lineTo(2, ly); c.moveTo(-4, y0 - 28); c.lineTo(-5, ly); c.stroke(); // the hands of light holding it
}

// Bilecaster: mouth at MUZ.bilecaster (16, -20)
const BC_FLESH = ['#8a7a5a', '#5c4e38', '#33291c'];
function dBile4(c, T, u) {
  const ph = u.moving ? (u.anim || 0) * 7 : 0, t = u.anim || 0, pulse = 0.75 + 0.25 * Math.sin(t * 4), sp = u.recoil || 0;
  c.lineCap = 'round'; c.lineJoin = 'round';
  const leg = (x, o, near) => { const sw = Math.sin(ph + o) * 2.5, lift = Math.max(0, Math.sin(ph + o + 1.3)) * 1.5; c.strokeStyle = OUTL; c.lineWidth = near ? 3.4 : 2.8; c.beginPath(); c.moveTo(x, -10); c.quadraticCurveTo(x + 4 + sw * 0.4, -6 - lift, x + sw, -lift); c.stroke(); c.strokeStyle = near ? BC_FLESH[1] : BC_FLESH[2]; c.lineWidth = near ? 2.2 : 1.8; c.stroke(); };
  leg(-9, Math.PI, false); leg(3, 0.4, false);
  // the body: a low sinewy abdomen with a spore vent at the back
  c.fillStyle = lgrad(c, 0, -18, 0, -5, [BC_FLESH[0], BC_FLESH[1], BC_FLESH[2]]); c.beginPath(); c.ellipse(-4, -11, 12, 6.5, -0.1, 0, 7); c.fill(); outline(c, 1);
  c.fillStyle = `rgba(${T.glow},0.25)`; c.beginPath(); c.arc(-15, -14, 2.2, 0, 7); c.fill();
  // a team carapace over the back, overlapping plates, curving up into a hood behind the head
  for (let i = 0; i < 3; i++) {
    const x = -15 + i * 7, top = -21 - i * 1.5;
    c.fillStyle = lgrad(c, 0, top, 0, -10, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(x - 1, -11); c.quadraticCurveTo(x, top, x + 5, top - 0.5); c.quadraticCurveTo(x + 9, top + 2, x + 8.5, -12); c.closePath(); c.fill(); outline(c, 0.9);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x + 1, top + 1.5); c.quadraticCurveTo(x + 4, top - 0.5, x + 7, top + 1.5); c.stroke();
  }
  // the neck and the swollen glowing bile sacs on the throat
  c.fillStyle = lgrad(c, 4, -28, 10, -12, [BC_FLESH[0], BC_FLESH[2]]); c.beginPath(); c.moveTo(2, -12); c.quadraticCurveTo(5, -24, 11, -25); c.lineTo(14, -20); c.quadraticCurveTo(9, -17, 8, -11); c.closePath(); c.fill(); outline(c, 0.9);
  c.globalCompositeOperation = 'lighter';
  for (const [x, y, r] of [[8.5, -16, 3.6 + sp], [11, -19.5, 3 + sp * 0.8], [6, -13, 2.6]]) { c.fillStyle = `rgba(150,235,80,${0.28 * pulse})`; c.beginPath(); c.arc(x, y, r * 1.8, 0, 7); c.fill(); }
  c.globalCompositeOperation = 'source-over';
  for (const [x, y, r] of [[8.5, -16, 3.6 + sp], [11, -19.5, 3 + sp * 0.8], [6, -13, 2.6]]) { c.fillStyle = lgrad(c, x - r, y - r, x + r, y + r, ['#e8ffb0', '#9be15d', '#4f8a2a']); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); outline(c, 0.6); c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, 7); c.fill(); }
  // the head under its hood: the team hood flares over it, the jaw open with drool
  c.fillStyle = lgrad(c, 9, -31, 17, -21, [T.light, T.main, T.hull]); c.beginPath(); c.moveTo(6, -24); c.quadraticCurveTo(9, -33, 16, -29); c.quadraticCurveTo(19, -26, 17.5, -22.5); c.quadraticCurveTo(12, -26, 6, -24); c.fill(); outline(c, 0.9); // hood
  c.fillStyle = lgrad(c, 11, -26, 11, -19, [BC_FLESH[0], BC_FLESH[2]]); c.beginPath(); c.ellipse(13, -22.5, 4.5, 3.2, 0.15, 0, 7); c.fill(); outline(c, 0.7);
  c.fillStyle = '#1e2a10'; c.beginPath(); c.ellipse(16, -20.5, 2.2, 0.8 + sp * 1.4, 0.2, 0, 7); c.fill();
  c.fillStyle = 'rgba(170,240,100,0.85)'; c.beginPath(); c.ellipse(16.2, -18.2 + (t * 3) % 2, 0.6, 1.2, 0, 0, 7); c.fill(); // drool
  c.fillStyle = `rgba(${T.glow},1)`; c.beginPath(); c.arc(14.5, -24.2, 0.9, 0, 7); c.fill();
  leg(-4, 0.2, true); leg(6, Math.PI + 0.3, true);
  c.lineCap = 'butt';
}

// Gunship (aircraft, drawn live): the pods' mouths near MUZ.aircraft (16, +5)
function dGun4(c, T, u) {
  const t = u.anim || 0, fl = 0.6 + 0.4 * Math.sin(t * 30), bl = Math.cos(t * 40) * 21, rk = (u.recoil || 0) * 2;
  c.fillStyle = `rgba(255,170,80,${0.5 * fl})`; c.beginPath(); c.ellipse(-27, -2, 6 * fl + 3, 2.2, 0, 0, 7); c.fill(); // exhaust
  c.fillStyle = 'rgba(70,70,78,0.45)'; c.beginPath(); c.arc(-30 - (t * 6) % 4, -5, 2.4, 0, 7); c.fill();
  // tail boom with a hazard-striped fin and a tail rotor
  c.fillStyle = lgrad(c, 0, -6, 0, 0, [STEEL[1], STEEL[2]]); poly(c, [[-8, -5], [-26, -4], [-26, -1], [-8, 0]]); c.fill(); outline(c, 0.8);
  c.fillStyle = lgrad(c, -26, -14, -20, -2, [T.light, T.main, T.hull]); poly(c, [[-27, -3], [-25, -13], [-21, -12], [-21, -3]]); c.fill(); outline(c, 0.8);
  c.save(); c.beginPath(); poly(c, [[-27, -3], [-25, -13], [-21, -12], [-21, -3]]); c.clip(); c.strokeStyle = HAZ; c.lineWidth = 1.4; for (let i = -2; i < 4; i++) { c.beginPath(); c.moveTo(-28 + i * 3, -2); c.lineTo(-22 + i * 3, -14); c.stroke(); } c.restore();
  c.strokeStyle = 'rgba(220,230,250,0.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-23, -8 - Math.sin(t * 50) * 4); c.lineTo(-23, -8 + Math.sin(t * 50) * 4); c.stroke();
  // the far stub wing and pod
  c.fillStyle = STEEL[2]; poly(c, [[2, -1], [-6, -5], [-2, -5], [6, -1]]); c.fill();
  c.fillStyle = OLIVE[2]; rr(c, -6 - rk, -7, 14, 3, 1.4); c.fill();
  // the fuselage: team armour plates, a canopy, a chin sensor
  c.fillStyle = lgrad(c, 0, -10, 0, 5, [T.light, T.main, T.hull]);
  c.beginPath(); c.moveTo(20, 1); c.quadraticCurveTo(19, -6, 10, -8); c.lineTo(-6, -8.5); c.quadraticCurveTo(-11, -7, -11, -2); c.lineTo(-9, 3); c.quadraticCurveTo(6, 6, 20, 1); c.fill(); outline(c, 1);
  rim(c, -6, -8.2, 9, 'rgba(255,255,255,0.45)');
  c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-2, -8); c.lineTo(-3, 3.5); c.moveTo(6, -8); c.lineTo(6, 4); c.stroke(); // plate seams
  c.fillStyle = lgrad(c, 10, -7, 18, -1, ['#d8f4ff', '#5d8aa8', '#1d3346']); c.beginPath(); c.moveTo(18.5, -1); c.quadraticCurveTo(17, -6, 10, -7); c.lineTo(9, -1.5); c.closePath(); c.fill(); outline(c, 0.7); // canopy
  c.fillStyle = HAZ; for (let i = 0; i < 3; i++) poly(c, [[-9 + i * 3, 3.2], [-7.5 + i * 3, 3.2], [-9 + i * 3 + 3, -0.5], [-10.5 + i * 3 + 3, -0.5]]); c.fill(); // hazard stripes on the belly
  // the rotor mast and blur
  c.fillStyle = STEEL[2]; c.fillRect(1, -12, 2, 4);
  c.fillStyle = 'rgba(200,215,240,0.16)'; c.beginPath(); c.ellipse(2, -12.5, 23, 2.2, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(220,230,250,0.6)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(2 - bl, -12.5); c.lineTo(2 + bl, -12.5); c.stroke();
  // the near stub wing with its rocket pod: rust bands, a team tip, the mouth at the front
  c.fillStyle = lgrad(c, 0, 1, 0, 5, [STEEL[0], STEEL[1]]); poly(c, [[3, 1], [-7, 5], [-3, 5.5], [8, 2]]); c.fill(); outline(c, 0.8);
  c.fillStyle = lgrad(c, 0, 3, 0, 8.5, [OLIVE[0], OLIVE[2]]); rr(c, -5 - rk, 3.5, 19, 4.6, 2); c.fill(); outline(c, 0.8);
  c.fillStyle = RUSTO; c.fillRect(-1 - rk, 3.6, 1.6, 4.4); c.fillRect(4 - rk, 3.6, 1.6, 4.4);
  c.fillStyle = T.main; c.fillRect(-5 - rk, 3.8, 2, 4);
  c.fillStyle = '#121418'; for (const y of [4.8, 6.8]) { c.beginPath(); c.arc(13.6 - rk, y, 0.9, 0, 7); c.fill(); }
  if ((u.recoil || 0) > 0.3) { c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.fire, 15, 5.8, 5, u.recoil); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
}

// Wraithwing (aircraft, drawn live): a crescent blade of obsidian with glowing edges; its bolt leaves (16, +1)
function dWraith4(c, T, u) {
  const t = u.anim || 0, fl = 0.7 + 0.3 * Math.sin(t * 9), rk = u.recoil || 0;
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.violet, 0, 0, 22, 0.35 * fl); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  // the crescent: outer edge sweeping back to two points, inner edge hollowed
  const cres = () => { c.beginPath(); c.moveTo(18, 1); c.quadraticCurveTo(6, -16, -18, -14); c.quadraticCurveTo(-6, -8, -4, 0); c.quadraticCurveTo(-6, 8, -18, 14); c.quadraticCurveTo(6, 16, 18, 1); c.closePath(); };
  c.fillStyle = lgrad(c, 0, -15, 0, 15, [OBS[0], OBS[1], OBS[2]]); cres(); c.fill(); outline(c, 1);
  // team-glass plates along the blade
  c.fillStyle = lgrad(c, 0, -12, 0, 12, [T.light, T.main, T.hull]);
  c.beginPath(); c.moveTo(13, 1); c.quadraticCurveTo(5, -9, -8, -10); c.quadraticCurveTo(-1, -6, 1, 0); c.quadraticCurveTo(-1, 6, -8, 10); c.quadraticCurveTo(5, 9, 13, 1); c.closePath(); c.fill(); outline(c, 0.7);
  // glowing edges
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = `rgba(${T.glow},${0.75 * fl})`; c.lineWidth = 2.2; cres(); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(18, 1); c.quadraticCurveTo(6, -16, -18, -14); c.stroke();
  // the core and a violet eye at the front
  c.fillStyle = `rgba(${T.glow},0.9)`; poly(c, [[6, 1], [10, -2], [14, 1], [10, 4]]); c.fill();
  c.fillStyle = `rgba(190,140,255,${0.6 + 0.4 * rk})`; c.beginPath(); c.arc(15.5, 1, 1.6 + rk * 1.5, 0, 7); c.fill();
  c.globalCompositeOperation = 'source-over';
  // two thin floating shards trailing it, held by lines of light
  for (const s of [-1, 1]) { const y = s * (9 + Math.sin(t * 3 + s) * 1); c.fillStyle = OBS[1]; poly(c, [[-22, y], [-15, y - s * 1.5], [-12, y]]); c.fill(); c.strokeStyle = `rgba(${T.glow},0.5)`; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-12, y); c.lineTo(-8, y * 0.8); c.stroke(); }
}

DRAW_U.sniper = dSniper4; DRAW_U.marksman = dMarks4; DRAW_U.bilecaster = dBile4; DRAW_U.aircraft = dGun4; DRAW_U.wraithwing = dWraith4;
Object.assign(SPR_BOX, { sniper: [-14, -32, 36, 35], marksman: [-15, -60, 42, 62], bilecaster: [-20, -36, 41, 38] });
Object.assign(UVIS, { sniper: { h: 27, w: 9 }, marksman: { h: 48, w: 9 }, bilecaster: { h: 30, w: 15 } });

/* ---- overlays on a unit (drawUnit) ---- */
// Pinned: dust kicked up at its feet and a downward chevron over it, fading as the pin runs out
function drawPinned(c, u, w, t) {
  const left = clamp((u.pinT - t) / PIN.dur, 0, 1), a = Math.min(1, left * 3), h = visH(u.type) * rvScale(u) * US, y = w.y - h - 22;
  for (let i = 0; i < 4; i++) { const k = ((t * 1.8 + i / 4 + u.id * 0.13) % 1), x = w.x + (i - 1.5) * 6 + Math.sin(i * 2.3 + u.id) * 2; c.fillStyle = `rgba(185,165,130,${0.65 * (1 - k) * a})`; c.beginPath(); c.ellipse(x, w.y - 1 - k * 5, 3 + k * 5, 1.8 + k * 2.2, 0, 0, 7); c.fill(); }
  const bob = Math.sin(t * 8 + u.id) * 1.2;
  c.globalAlpha = a; c.fillStyle = '#ffd34d'; c.strokeStyle = '#3a2a08'; c.lineWidth = 1;
  for (const k of [0, 5]) { c.beginPath(); c.moveTo(w.x - 7, y + k + bob); c.lineTo(w.x, y + 5 + k + bob); c.lineTo(w.x + 7, y + k + bob); c.lineTo(w.x + 7, y + 3 + k + bob); c.lineTo(w.x, y + 8 + k + bob); c.lineTo(w.x - 7, y + 3 + k + bob); c.closePath(); c.fill(); c.stroke(); }
  c.globalAlpha = 1;
}
// Marked: a glyph sigil turning slowly over the target, in the marking side's glow, pulsing as it fades
function drawMarked(c, e, w, t) {
  const left = e.mkT - t, a = Math.min(1, left * 1.5), T = TEAM[e.mkS] || TEAM[0];
  const h = e.kind === 'b' ? (e.h || 40) * 0.6 : visH(e.type) * rvScale(e) * US, y = w.y - (e.z || 0) - h - 16, r = 8, rot = t * 0.9 + e.id;
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
  stamp(c, GLOW['t' + (e.mkS === 1 ? 1 : 0)] || GLOW.cyan, w.x, y, 14, 0.5 * a); c.globalAlpha = a;
  c.strokeStyle = `rgba(${T.glow},0.95)`; c.lineWidth = 1.4; c.beginPath(); c.ellipse(w.x, y, r, r * 0.8, 0, 0, 7); c.stroke();
  c.lineWidth = 1.2; c.beginPath();
  for (let i = 0; i < 3; i++) { const b = rot + i * 2.094, x1 = w.x + Math.cos(b) * r, y1 = y + Math.sin(b) * r * 0.8, x2 = w.x + Math.cos(b + 2.094) * r, y2 = y + Math.sin(b + 2.094) * r * 0.8; c.moveTo(x1, y1); c.lineTo(x2, y2); } // the triangle glyph
  for (let i = 0; i < 4; i++) { const b = -rot * 1.3 + i * 1.571, x1 = w.x + Math.cos(b) * (r + 2), y1 = y + Math.sin(b) * (r + 2) * 0.8; c.moveTo(x1, y1); c.lineTo(w.x + Math.cos(b) * (r + 5), y + Math.sin(b) * (r + 5) * 0.8); } // ticks around it
  c.stroke();
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(w.x, y, 1.6, 0, 7); c.fill();
  c.strokeStyle = `rgba(${T.glow},${0.35 * a})`; c.lineWidth = 1; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(w.x, y + r); c.lineTo(w.x, w.y - (e.z || 0) - h + 2); c.stroke(); c.setLineDash([]);
  c.restore();
}
// Right after a hop: fading violet crescents along the way it came
function drawHopTrail(c, u, t) {
  const k = (t - u.hopS) / 0.35; if (!(k >= 0 && k < 1) || u.hopU === undefined) return;
  const a = P(u.hopU, u.hopV, u.z || 0), b = P(u.u, u.v, u.z || 0), T = TEAM[u.side];
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  for (let i = 1; i <= 4; i++) {
    const q = i / 5, x = a.x + (b.x - a.x) * q, y = a.y + (b.y - a.y) * q, s = US * (0.6 + 0.1 * i), f = u.face || 1;
    c.strokeStyle = `rgba(${T.glow},${(1 - k) * 0.18 * i})`; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(x + 18 * s * f, y + s); c.quadraticCurveTo(x + 6 * s * f, y - 16 * s, x - 18 * s * f, y - 14 * s); c.moveTo(x + 18 * s * f, y + s); c.quadraticCurveTo(x + 6 * s * f, y + 16 * s, x - 18 * s * f, y + 14 * s); c.stroke();
  }
  c.restore(); c.globalAlpha = 1;
}

/* ---- effects ---- */
function drawHopFx(c, f) { // the hop: a violet flash where it left and where it landed, a streak between
  const k = f.t / f.life, a = 1 - k;
  c.save(); c.globalCompositeOperation = 'lighter';
  stamp(c, GLOW.violet, f.x, f.y, 26 * (1 - k * 0.5), 0.9 * a);
  c.strokeStyle = `rgba(200,160,255,${a})`; c.lineWidth = 1.6; c.beginPath(); c.ellipse(f.x, f.y, 14 * (1 - k * 0.6), 6 * (1 - k * 0.6), 0, 0, 7); c.stroke();
  if (k < 0.5) { const q = 1 - k * 2; c.strokeStyle = `rgba(220,190,255,${0.5 * q})`; c.lineWidth = 3 * q; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.stroke(); c.strokeStyle = `rgba(255,255,255,${0.7 * q})`; c.lineWidth = 0.8; c.stroke(); }
  stamp(c, GLOW.white, f.x2, f.y2, 16 * (1 - k), 0.8 * a);
  c.restore(); c.globalAlpha = 1;
}
function drawWhiff(c, f) { // a shot that lost its Wraithwing landing on empty air: a grey puff and a few sparks
  const k = f.t / f.life, a = 1 - k;
  c.fillStyle = `rgba(190,190,205,${0.55 * a})`; c.beginPath(); c.arc(f.x, f.y, 3 + k * 7, 0, 7); c.fill();
  c.strokeStyle = `rgba(255,230,180,${a})`; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 4; i++) { const b = i * 1.571 + 0.6; c.moveTo(f.x + Math.cos(b) * (3 + k * 4), f.y + Math.sin(b) * (3 + k * 4)); c.lineTo(f.x + Math.cos(b) * (6 + k * 7), f.y + Math.sin(b) * (6 + k * 7)); } c.stroke();
}
function drawMarkFx(c, f) { // the mark landing: a ring snapping inward in the marking side's glow
  const k = f.t / f.life, T = TEAM[f.side];
  c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${T.glow},${1 - k})`; c.lineWidth = 2; c.beginPath(); c.ellipse(f.x, f.y, 22 * (1 - k) + 4, (22 * (1 - k) + 4) * 0.8, 0, 0, 7); c.stroke(); stamp(c, GLOW.white, f.x, f.y, 10 * (1 - k), 0.8); c.restore(); c.globalAlpha = 1;
}
function drawBileSplat(c, f) { // the glob bursting: green droplets thrown out
  const k = f.t / f.life, a = 1 - k;
  for (let i = 0; i < 7; i++) { const b = i * 0.9 + f.u, r = 4 + k * 20; c.fillStyle = `rgba(170,240,100,${0.85 * a})`; c.beginPath(); c.arc(f.x + Math.cos(b) * r, f.y + Math.sin(b) * r * 0.45 - Math.sin(k * Math.PI) * 8, 1.8 * (1 - k * 0.5), 0, 7); c.fill(); }
}
// A Bilecaster pool: bubbling acid green with a faint rim in its side's colour; it grows in, then fades in its last 2 s
function drawBilePool(c, a, t) {
  const w = P(a.u, a.v), grow = clamp((t - (a.t0 ?? t - 1)) / 0.35, 0, 1), al = clamp((a.end - t) / 2, 0, 1), R = BILE.r * (0.6 + 0.4 * grow), T = TEAM[a.side] || TEAM[0];
  c.fillStyle = `rgba(95,175,45,${0.58 * al})`; c.beginPath(); c.ellipse(w.x, w.y, R, R * DY * 0.6, 0, 0, 7); c.fill();
  c.fillStyle = `rgba(165,235,90,${0.3 * al})`; c.beginPath(); c.ellipse(w.x - R * 0.15, w.y - 1, R * 0.6, R * DY * 0.33, 0, 0, 7); c.fill();
  c.strokeStyle = `rgba(${T.glow},${0.6 * al})`; c.lineWidth = 1.6; c.beginPath(); c.ellipse(w.x, w.y, R, R * DY * 0.6, 0, 0, 7); c.stroke();
  for (let i = 0; i < 7; i++) { const b = (t * 1.6 + i * 0.37 + a.u * 0.01) % 1, a2 = i * 0.9 + a.u, rr2 = R * (0.15 + (i % 4) * 0.2); c.strokeStyle = `rgba(215,255,160,${0.7 * al * (1 - b)})`; c.lineWidth = 0.9; c.beginPath(); c.arc(w.x + Math.cos(a2) * rr2, w.y + Math.sin(a2) * rr2 * DY * 0.6 - b * 2, 0.8 + b * 2.4, 0, 7); c.stroke(); }
}
// The Bilecaster's glob in flight: a green blob on its arc with drips, and the landing ring
function drawBileGlob(c, g, p, b, lit) {
  const gp = P(p.u, p.v, 0);
  if (showLanding(p, lit)) { const tt = P(p.tu, p.tv, 0), k = clamp(p.t / p.T, 0, 1); c.strokeStyle = 'rgba(155,225,93,0.9)'; c.globalAlpha = 0.2 + 0.5 * k; c.lineWidth = 1.2; c.beginPath(); c.ellipse(tt.x, tt.y, BILE.r * (1 - 0.3 * k), BILE.r * (1 - 0.3 * k) * DY * 0.6, 0, 0, 7); c.stroke(); c.globalAlpha = 1; }
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(gp.x, gp.y, 4, 1.6, 0, 0, 7); c.fill();
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.acid, b.x, b.y, 8, 0.7); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.fillStyle = '#9be15d'; c.beginPath(); c.arc(b.x, b.y, 3.6, 0, 7); c.fill(); outline(c, 0.6);
  c.fillStyle = '#e4ffc8'; c.beginPath(); c.arc(b.x - 1.1, b.y - 1.1, 1.2, 0, 7); c.fill();
}
// A Gunship missile: a bright head with a long fiery trail behind it
function drawGsMissile(c, p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(0.01, Math.hypot(dx, dy)), ux = dx / d, uy = dy / d, L2 = 26;
  const gr = c.createLinearGradient(b.x, b.y, b.x - ux * L2, b.y - uy * L2); gr.addColorStop(0, 'rgba(255,220,140,0.95)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
  c.strokeStyle = gr; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(b.x - ux * L2, b.y - uy * L2); c.lineTo(b.x, b.y); c.stroke(); c.lineCap = 'butt';
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.fire, b.x, b.y, 6, 1); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(b.x, b.y, 1.8, 0, 7); c.fill();
}
