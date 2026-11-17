/* ---------- Faction rework art, batch 5c (v2.90; docs/FACTION_REWORK.md "Batch 5c") ----------
   The last five Axiarch units redrawn in the language of the reworked ones (Shardling, Bastion, Riftstalker, Parallax,
   Marksman, Wraithwing, Voidcarrier, Sovereign): floating obsidian slabs with dark outlines, big team-coloured slabs lit from
   above, nothing touching (thin lines of light hold the pieces), glowing rhombus cores, visor slits, halos and rings.
   Lancer (a slim shard knight with a light banner on its back and a long focusing lance), Gravemantle (a hunched walker under
   a mantle of team slabs, stones orbiting it, a violet gravity core on a projector arm), Eventide (a heavy four-slab walker
   carrying a segmented gate ring around a singularity, a forward prong), Prismwing (a faceted dart with team-glass fins) and
   Shardstorm (a crystal core inside a turning ring of team shards, an emitter spike forward). Art only: every shot still
   leaves the SIM's own MUZ point (src/sim/trees-balance.js), which each drawing is built around. Ground units are cached as
   poses (SPR_STEP's cycles, unchanged); the two flyers are cached aircraft (AIR_CYC: their whole animation shares one cycle). */
const AX5 = { pale: 'rgba(230,220,255,0.6)' };
function ax5(c, pts, T, lit, lw = 0.9) { // a floating slab: obsidian, or team stone lit from above
  c.fillStyle = lgrad(c, pts[0][0], pts[0][1], pts[2][0], pts[2][1], lit ? [T.light, T.main, T.hull] : [OBS[0], OBS[1], OBS[2]]);
  poly(c, pts); c.fill(); outline(c, lw);
}
function ax5Lines(c, T, segs, a = 0.8, w = 0.8) { // lines of light holding the pieces together
  c.strokeStyle = `rgba(${T.glow},${a})`; c.lineWidth = w; c.beginPath(); for (const [x0, y0, x1, y1] of segs) { c.moveTo(x0, y0); c.lineTo(x1, y1); } c.stroke();
}
function ax5Core(c, T, x, y, r, a = 1) { // a glowing rhombus core with a white heart
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = `rgba(${T.glow},${0.3 * a})`; c.beginPath(); c.arc(x, y, r * 1.8, 0, 7); c.fill();
  c.fillStyle = `rgba(${T.glow},${0.9 * a})`; poly(c, [[x, y - r * 1.3], [x + r, y], [x, y + r * 1.3], [x - r, y]]); c.fill();
  c.fillStyle = `rgba(255,255,255,${0.9 * a})`; poly(c, [[x, y - r * 0.6], [x + r * 0.45, y], [x, y + r * 0.6], [x - r * 0.45, y]]); c.fill();
  c.globalCompositeOperation = 'source-over';
}
function ax5Visor(c, T, x, y, w, h = 1) { c.fillStyle = `rgba(${T.glow},1)`; c.fillRect(x, y, w, h); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.35)`; c.beginPath(); c.arc(x + w / 2, y + h / 2, w * 0.9, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; }
function ax5Grav(c, x, y, r, k = 0.5) { // a violet gravity orb (the Gravemantle's and Eventide's shot leaves here)
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = `rgba(${RIFTA},${0.25 + 0.15 * k})`; c.beginPath(); c.arc(x, y, r * 2.2, 0, 7); c.fill();
  c.globalCompositeOperation = 'source-over';
  const og = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.2, x, y, r); og.addColorStop(0, '#f2eaff'); og.addColorStop(0.45, RIFT); og.addColorStop(1, '#2a1650');
  c.fillStyle = og; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); outline(c, 0.6);
}

/* ---------------- Lancer: lance tip (its bolt) at MUZ.lancer (14, 18) → art (14, −18) ---------------- */
function dLancer5(c, T, u) {
  const t = u.anim || 0, mv = u.moving, y0 = mv ? Math.sin(t * 6) * 0.8 : 0, k = mv ? Math.sin(t * 6) * 2 : 0, rk = (u.recoil || 0) * 2, wave = Math.sin(t * 6) * 1.2;
  c.fillStyle = `rgba(${T.glow},0.2)`; c.beginPath(); c.ellipse(0, -0.5, 8, 1.9, 0, 0, 7); c.fill(); // its light on the ground
  // the banner of light on its back: an obsidian staff shard and a long team pennant streaming back
  ax5(c, [[-5.5, y0 - 40], [-3.8, y0 - 41], [-3.6, y0 - 21], [-5.2, y0 - 21]], T, false, 0.7);
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = lgrad(c, -4, 0, -16, 0, [`rgba(${T.glow},0.75)`, `rgba(${T.glow},0.15)`]);
  c.beginPath(); c.moveTo(-4, y0 - 39); c.quadraticCurveTo(-10, y0 - 38 + wave, -16, y0 - 37 + wave * 1.4); c.lineTo(-13.5, y0 - 32 + wave); c.lineTo(-16, y0 - 27 + wave * 1.4); c.quadraticCurveTo(-10, y0 - 28 + wave, -4, y0 - 29); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-4, y0 - 39); c.quadraticCurveTo(-10, y0 - 38 + wave, -16, y0 - 37 + wave * 1.4); c.stroke();
  c.globalCompositeOperation = 'source-over';
  // lines of light between the pieces
  ax5Lines(c, T, [[1.5, y0 - 30, 1, y0 - 27], [0, y0 - 15, -0.5, y0 - 12.5], [-2, y0 - 9, -2.5, y0 - 6], [2, y0 - 9, 2.5, y0 - 6]]);
  // legs: two long shards that scissor; hips
  ax5(c, [[-4 + k, y0 - 8.5], [-1 + k, y0 - 8.5], [-2.6 + k * 1.4, y0 + 1]], T, false, 0.7);
  ax5(c, [[1 - k, y0 - 8.5], [4 - k, y0 - 8.5], [3 - k * 1.4, y0 + 1]], T, false, 0.7);
  ax5(c, [[-3.5, y0 - 13], [4, y0 - 13.5], [2.5, y0 - 9.5], [-2.5, y0 - 9.5]], T, false, 0.7);
  // torso: an obsidian shard with a big team breastplate, a team pauldron
  ax5(c, [[-4.5, y0 - 27.5], [4.5, y0 - 28], [3.2, y0 - 15], [-3.5, y0 - 14.5]], T, false);
  ax5(c, [[-1, y0 - 26.5], [5.5, y0 - 26], [3.8, y0 - 16.5], [-0.2, y0 - 16]], T, true, 0.8);
  rim(c, -4, y0 - 27.6, 4, AX5.pale);
  ax5Core(c, T, 2, y0 - 21, 1.5, 0.9);
  // head: a narrow mask, a visor slit, a swept crest fin
  ax5(c, [[-1.5, y0 - 36.5], [3.8, y0 - 34.5], [3.2, y0 - 30.5], [-1.4, y0 - 30.8]], T, false, 0.8);
  ax5(c, [[-1, y0 - 36.5], [1.6, y0 - 37], [-4.5, y0 - 41.5]], T, true, 0.6);
  ax5Visor(c, T, 0.8, y0 - 34, 2.8, 1);
  // the lance: a long obsidian prism, its light core, three focus rings near the tip, a crystal tip at the muzzle
  c.save(); c.translate(-rk, 0);
  ax5(c, [[-9, -11.4], [12, -17.2], [13, -18.6], [11.8, -19.2], [-9.4, -13]], T, false, 0.7);
  c.strokeStyle = `rgba(${T.glow},0.9)`; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-7.5, -12.6); c.lineTo(11, -17.8); c.stroke();
  c.globalCompositeOperation = 'lighter';
  for (const [x, r] of [[4, 2.4], [7.2, 2.1], [10.2, 1.8]]) { const y = -12.6 - (x + 7.5) * 0.28; c.strokeStyle = `rgba(${T.glow},0.85)`; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x, y, 0.8, r, 0.28, 0, 7); c.stroke(); }
  c.fillStyle = `rgba(${T.glow},${0.4 + (u.recoil || 0) * 0.5})`; c.beginPath(); c.arc(14, -18, 3 + (u.recoil || 0) * 2, 0, 7); c.fill();
  c.fillStyle = '#ffffff'; poly(c, [[12, -18], [14, -19.6], [16.2, -18], [14, -16.6]]); c.fill();
  c.globalCompositeOperation = 'source-over';
  c.restore();
  ax5Lines(c, T, [[3, y0 - 21], [2, -15.3], [-2, y0 - 22], [-3, -13.6]], 0.7, 0.7); // hands of light on the lance
  // the near pauldron over it all
  ax5(c, [[0.5, y0 - 29.5], [7, y0 - 28], [6.2, y0 - 23.5], [1, y0 - 24.5]], T, true, 0.8);
}

/* ---------------- Gravemantle: gravity orb at MUZ.gravemantle (16, 18) → art (16, −18) ---------------- */
function dGrave5(c, T, u) {
  const t = u.anim || 0, mv = u.moving, y0 = mv ? Math.sin(t * 1.4) * 1.2 : 0, st = mv ? Math.sin(t * 2.8) * 2 : 0, rk = (u.recoil || 0) * 2;
  const stone = (i, front) => { const a = t * 1.4 + i * 2.094 + 0.6, sy = Math.sin(a); if ((sy >= 0) !== front) return;
    const x = Math.cos(a) * 20, y = y0 - 18 + sy * 5, r = front ? 3.2 : 2.4;
    ax5Lines(c, T, [[x * 0.55, y0 - 18 + sy * 2.6, x * 0.85, y]], front ? 0.55 : 0.25, 0.6);
    ax5(c, [[x, y - r * 1.3], [x + r, y], [x, y + r], [x - r, y]], T, front, 0.7); };
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${RIFTA},0.22)`; c.beginPath(); c.ellipse(0, -0.5, 19, 3.4, 0, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  c.strokeStyle = `rgba(${RIFTA},0.55)`; c.lineWidth = 0.8; c.setLineDash([3, 2.5]); c.beginPath(); c.ellipse(0, -0.5, 14, 2.4, 0, 0, 7); c.stroke(); c.setLineDash([]); // its gravity well
  for (let i = 0; i < 3; i++) stone(i, false);
  // feet: two broad slabs under the mantle that shuffle
  ax5(c, [[-12 + st, y0 - 7], [-4 + st, y0 - 7], [-5 + st, y0 + 1], [-13 + st, y0 + 1]], T, false);
  ax5(c, [[3 - st, y0 - 7], [11 - st, y0 - 7], [12 - st, y0 + 1], [4 - st, y0 + 1]], T, false);
  ax5Lines(c, T, [[-8, y0 - 8], [-8, y0 - 10.5], [7, y0 - 8], [7, y0 - 10.5]]);
  // the mantle: a hunched obsidian dome, two great team slabs over it with light between them
  c.fillStyle = lgrad(c, 0, y0 - 36, 0, y0 - 9, [OBS[0], OBS[1], OBS[2]]);
  c.beginPath(); c.moveTo(-16, y0 - 10); c.quadraticCurveTo(-16, y0 - 34, -1, y0 - 36); c.quadraticCurveTo(13, y0 - 34, 14, y0 - 10); c.closePath(); c.fill(); outline(c, 1);
  ax5(c, [[-15, y0 - 11], [-14, y0 - 26], [-5, y0 - 34], [-4, y0 - 12]], T, true, 0.9);
  ax5(c, [[-2, y0 - 12], [-1.5, y0 - 34.5], [8, y0 - 30], [12, y0 - 12]], T, true, 0.9);
  ax5Lines(c, T, [[-3, y0 - 13], [-3, y0 - 31]], 0.9, 1);
  rim(c, -10, y0 - 31.5, -6, AX5.pale); rim(c, 0, y0 - 33.6, 6, AX5.pale);
  c.strokeStyle = `rgba(${T.glow},0.75)`; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-12, y0 - 18); c.lineTo(-7, y0 - 18); c.moveTo(1, y0 - 18); c.lineTo(9, y0 - 18); c.stroke(); // glyph bands
  // the cowl and its eye, low at the front
  ax5(c, [[5, y0 - 35], [12, y0 - 31], [11.5, y0 - 25], [4.5, y0 - 27]], T, false, 0.8);
  ax5Visor(c, T, 7.4, y0 - 30.4, 3.2, 1.1);
  // the projector arm and the violet gravity orb at the muzzle
  c.save(); c.translate(-rk, 0);
  ax5(c, [[6, -21.5], [14.5, -20], [14.5, -16], [6, -15]], T, false, 0.8);
  ax5Lines(c, T, [[6, -18.2], [13, -18]], 0.8, 0.7);
  ax5Grav(c, 16, -18, 2.6, (u.recoil || 0));
  c.restore();
  for (let i = 0; i < 3; i++) stone(i, true);
}

/* ---------------- Eventide: pulse and orb at MUZ.eventide (18, 24) → art (18, −24) ---------------- */
function dEventide5(c, T, u) {
  const t = u.anim || 0, mv = u.moving, y0 = mv ? Math.sin(t) * 1.2 : 0, st = mv ? Math.sin(t * 2) * 2.2 : 0, rk = (u.recoil || 0) * 2, pk = 0.5 + 0.5 * Math.sin(t * 2);
  const cy = y0 - 36, rx = 11, ry = 16;
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${RIFTA},0.25)`; c.beginPath(); c.ellipse(0, -0.5, 18, 3.4, 0, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  // far legs
  ax5(c, [[-14 - st, y0 - 11], [-8 - st, y0 - 11], [-9 - st, y0], [-15 - st, y0]], T, false, 0.8);
  ax5(c, [[6 + st, y0 - 11], [12 + st, y0 - 11], [13 + st, y0], [7 + st, y0]], T, false, 0.8);
  // the gate ring: eight obsidian segments with team-lit faces, light in the gaps, a singularity inside
  ax5Lines(c, T, [[-4, y0 - 17], [-4, cy + ry - 1], [4, y0 - 17], [4, cy + ry - 1]], 0.85, 0.9);
  c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${T.glow},0.5)`; c.lineWidth = 1; c.beginPath(); c.ellipse(0, cy, rx, ry, 0, 0, 7); c.stroke(); c.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 8; i++) {
    const a0 = i * Math.PI / 4 + 0.1, a1 = a0 + Math.PI / 4 - 0.2, lit = Math.sin((a0 + a1) / 2) < 0.2;
    const P = (a, r) => [Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r];
    ax5(c, [P(a0, 1.28), P(a1, 1.28), P(a1, 0.86), P(a0, 0.86)], T, lit, 0.8);
  }
  c.fillStyle = '#05060d'; c.beginPath(); c.arc(0, cy, 6.5, 0, 7); c.fill();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = `rgba(${RIFTA},${0.45 + 0.45 * pk})`; c.lineWidth = 1.3; c.beginPath(); c.arc(0, cy, 7.5 + pk, 0, 7); c.stroke();
  c.strokeStyle = `rgba(${T.glow},0.6)`; c.lineWidth = 0.7; c.beginPath(); c.arc(0, cy, 4.2, t * 2, t * 2 + 2.4); c.stroke();
  c.globalCompositeOperation = 'source-over';
  // the crown: three shards over the ring
  for (const [x, h, a] of [[-4, 5, -0.4], [0, 7, 0], [4, 5, 0.4]]) { c.save(); c.translate(x, cy - ry * 1.28 - 1.5); c.rotate(a); ax5(c, [[-1.1, 0], [1.1, 0], [0, -h]], T, true, 0.6); c.restore(); }
  // the hull: a wide obsidian block, team side slabs, a glyph band and a core
  ax5(c, [[-15, y0 - 21], [15, y0 - 21], [12, y0 - 10], [-12, y0 - 10]], T, false, 1);
  ax5(c, [[-19, y0 - 19], [-14, y0 - 21], [-13.5, y0 - 11], [-18.5, y0 - 12]], T, true); ax5(c, [[14, y0 - 21], [19, y0 - 19], [18.5, y0 - 12], [13.5, y0 - 11]], T, true);
  ax5(c, [[-10, y0 - 20], [10, y0 - 20], [8.5, y0 - 13], [-8.5, y0 - 13]], T, true, 0.8);
  rim(c, -14, y0 - 21, 14, AX5.pale);
  c.strokeStyle = `rgba(${T.glow},0.75)`; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-7, y0 - 15); c.lineTo(-2, y0 - 15); c.moveTo(2, y0 - 15); c.lineTo(7, y0 - 15); c.stroke();
  ax5Core(c, T, 0, y0 - 16.5, 1.8);
  // near legs
  ax5(c, [[-9 + st, y0 - 10], [-3 + st, y0 - 10], [-3.5 + st, y0 + 1], [-10 + st, y0 + 1]], T, false);
  ax5(c, [[2 - st, y0 - 10], [8 - st, y0 - 10], [9 - st, y0 + 1], [2.5 - st, y0 + 1]], T, false);
  // the forward prong carrying its orb to the muzzle
  c.save(); c.translate(-rk, 0);
  ax5(c, [[9, y0 - 29], [16, -25.6], [16, -22.4], [10, y0 - 22]], T, false, 0.8);
  ax5Lines(c, T, [[10, y0 - 26], [15, -24]], 0.85, 0.7);
  ax5Grav(c, 18, -24, 2.8, pk);
  c.restore();
}

/* ---------------- Prismwing: its prism bolt leaves MUZ.prismwing (12, 0) → art (12, 0) ---------------- */
function dPrism5(c, T, u) {
  const fl = Math.sin((u.anim || 0) * 9), rk = (u.recoil || 0) * 2;
  const fin = (pts, a) => { c.fillStyle = lgrad(c, pts[0][0], pts[0][1], pts[1][0], pts[1][1], [T.light, T.main, T.hull]); c.globalAlpha = a; poly(c, pts); c.fill(); c.globalAlpha = 1; outline(c, 0.6);
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${T.glow},0.8)`; c.lineWidth = 0.7; c.beginPath(); c.moveTo(...pts[0]); c.lineTo(...pts[1]); c.stroke(); c.globalCompositeOperation = 'source-over'; };
  fin([[-1, -1.5], [-12, -11 - fl * 2], [-7, -1.5]], 0.7); // far fin, team glass
  ax5Lines(c, T, [[-1, -1.5], [-2.5, -3]], 0.7, 0.6);
  ax5(c, [[12 - rk, 0], [2, -5], [-11, -2], [-8, 2.4], [2, 4.4]], T, true, 0.8);  // the dart, team stone
  ax5(c, [[11 - rk, 0.4], [-8, 2.4], [2, 4.4]], T, false, 0.6);                    // its obsidian keel
  ax5(c, [[-11, -2], [-15, -3.4], [-13.6, 0.4], [-9, 1]], T, false, 0.6);           // a floating tail shard
  ax5Lines(c, T, [[-9, 0.2], [-11.5, -0.6]], 0.8, 0.6);
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(11 - rk, -0.2); c.lineTo(2, -4.3); c.stroke();
  c.fillStyle = `rgba(${T.glow},0.9)`; c.beginPath(); c.arc(-9, 0.2, 1.1, 0, 7); c.fill(); // the link node (its shared shield)
  c.fillStyle = `rgba(${T.glow},0.5)`; c.beginPath(); c.arc(12 - rk, 0, 2.2, 0, 7); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(12 - rk, 0, 0.9, 0, 7); c.fill(); // the lens
  c.globalCompositeOperation = 'source-over';
  ax5Core(c, T, 0, 0.3, 1.2);
  fin([[0, 1.5], [-11, 10 + fl * 2], [-5, 2]], 0.85); // near fin
}

/* ---------------- Shardstorm: its beam leaves MUZ.shardstorm (14, −1) → art (14, 1) ---------------- */
function dShardstorm5(c, T, u) {
  const a0 = (u.anim || 0) * 2.2, rk = (u.recoil || 0) * 2, cy = -1;
  const shard = (i, front) => { const an = a0 + i / 5 * Math.PI * 2, sy = Math.sin(an); if ((sy >= 0) !== front) return;
    const x = Math.cos(an) * 15, y = cy + sy * 5, h = front ? 6.5 : 5;
    ax5Lines(c, T, [[x * 0.4, cy + sy * 2, x * 0.85, y]], front ? 0.6 : 0.25, 0.6);
    ax5(c, [[x, y - h], [x + 2.6, y], [x, y + h * 0.55], [x - 2.6, y]], T, front, 0.7);
    if (front) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${T.glow},0.8)`; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + 2.6, y); c.stroke(); c.globalCompositeOperation = 'source-over'; } };
  c.strokeStyle = `rgba(${T.glow},0.3)`; c.lineWidth = 1; c.beginPath(); c.ellipse(0, cy, 15, 5, 0, Math.PI, Math.PI * 2); c.stroke(); // the ring's far half
  for (let i = 0; i < 5; i++) shard(i, false);
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW[u.side === 1 ? 't1' : 't0'], 0, cy, 11, 0.55); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  // the emitter spike forward, then the crystal core: an obsidian octahedron with a team facet
  c.save(); c.translate(-rk, 0);
  ax5(c, [[3, -3], [14, 1], [3, 3.6]], T, false, 0.7);
  ax5Lines(c, T, [[4, 0.6], [12.5, 1]], 0.9, 0.6);
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.55)`; c.beginPath(); c.arc(14, 1, 2.4, 0, 7); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(14, 1, 0.9, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  c.restore();
  ax5(c, [[0, cy - 9], [6, cy], [0, cy + 7], [-6, cy]], T, false, 0.9);
  ax5(c, [[0, cy - 9], [6, cy], [0.5, cy - 0.5], [-3, cy - 3]], T, true, 0.6);
  ax5Core(c, T, 0, cy + 0.5, 1.8);
  c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${T.glow},0.9)`; c.lineWidth = 1.1; c.beginPath(); c.ellipse(0, cy, 15, 5, 0, 0, Math.PI); c.stroke(); c.globalCompositeOperation = 'source-over'; // the near half
  for (let i = 0; i < 5; i++) shard(i, true);
}

DRAW_U.lancer = dLancer5; DRAW_U.gravemantle = dGrave5; DRAW_U.eventide = dEventide5; DRAW_U.prismwing = dPrism5; DRAW_U.shardstorm = dShardstorm5;
Object.assign(SPR_BOX, { lancer: [-18, -44, 38, 47], gravemantle: [-25, -40, 50, 43], eventide: [-22, -68, 48, 71] });
Object.assign(AIR_BOX, { prismwing: [-17, -15, 33, 28], shardstorm: [-19, -14, 38, 24] });
Object.assign(UVIS, { lancer: { h: 38, w: 10 }, gravemantle: { h: 34, w: 17 }, eventide: { h: 58, w: 18 } }); // health bars, shield flashes and shadows follow the new art
