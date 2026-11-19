/* ---------- Faction rework art, batch 3b (v2.85; docs/FACTION_REWORK.md "Art direction") ----------
   Dreadthorn (a massive Bloomhost charger: a lowered armoured head with forward horns, heavy team carapace plates along its
   back, four thick legs; charging, its head drops and it gallops; dazed, it sways), Bastion (a heavy Axiarch walker of
   floating obsidian slabs around a glowing core, a projector crest), Shardling (a sleek Axiarch duelist of floating shards
   with a light blade; a glint on the blade when its parry is ready) and Bulwark (a hulking Bloomhost wall: a broad team
   shell, thick legs, a low head; bracing it hunkers down with its plates closed; regenerating on creep its glow sacs
   pulse). All cached as poses (the charge, five sway steps, the parry glint, the brace and three pulse steps are poses).
   Effects: the charge's dust trail and the dazed spores (live, over the pose), the barrier (a translucent curved wall of
   team light with glyph lines that flickers when hit, cracks as it weakens and collapses into shards when it breaks), the
   trample hits, the parry flash and counter-slash. */
const DT_FLESH = ['#86606f', '#573a49', '#2f1d28'], DT_BONE = '#efe2c6', BK_FLESH = ['#7d6a58', '#4f4135', '#2c241d'];
// Dreadthorn. u.crg: charging (head down, gallop); u.dz -1…1: dazed sway
function dDread3(c, T, u) {
  const cg = !!u.crg, dz = u.dz || 0, ph = u.moving ? (u.anim || 0) * (cg ? 11 : 6) : 0, pulse = 0.8 + 0.2 * Math.sin((u.anim || 0) * 3), bite = u.recoil || 0;
  c.save();
  if (dz) { c.translate(0, -2); c.rotate(dz * 0.07); c.translate(dz * 1.5, 2); }
  if (cg) { c.translate(10, 0); c.rotate(0.06); c.translate(-10, 0); } // pitched forward into the charge
  c.lineCap = 'round'; c.lineJoin = 'round';
  const leg = (x, o, near) => { // a thick column leg with a knee and a bone-clawed foot
    const sw = Math.sin(ph + o) * (cg ? 5 : 3), lift = Math.max(0, Math.sin(ph + o + 1.4)) * (cg ? 3 : 1.5);
    c.strokeStyle = OUTL; c.lineWidth = near ? 8 : 7; c.beginPath(); c.moveTo(x, -16); c.lineTo(x - 2 + sw * 0.4, -8 - lift * 0.5); c.lineTo(x + sw, -lift); c.stroke();
    c.strokeStyle = near ? DT_FLESH[1] : DT_FLESH[2]; c.lineWidth = near ? 6.2 : 5.2; c.stroke();
    c.strokeStyle = near ? T.main : T.hull; c.lineWidth = 3; c.beginPath(); c.moveTo(x, -16); c.lineTo(x - 1 + sw * 0.2, -11); c.stroke(); // a team plate on the thigh
    c.strokeStyle = DT_BONE; c.lineWidth = 1.3; for (const k of [-1.6, 0, 1.6]) { c.beginPath(); c.moveTo(x + sw + k, -lift); c.lineTo(x + sw + k + 1.8, -lift + 0.6); c.stroke(); }
  };
  leg(-15, Math.PI, false); leg(7, 0.3, false);
  // the great body: a deep belly
  c.fillStyle = lgrad(c, 0, -34, 0, -8, [DT_FLESH[0], DT_FLESH[1], DT_FLESH[2]]); c.beginPath(); c.ellipse(-3, -19, 21, 11, -0.05, 0, 7); c.fill(); outline(c, 1.2);
  // glow sacs along the flank
  c.globalCompositeOperation = 'lighter';
  for (const [x, y, r] of [[-16, -15, 2.4], [-9, -12.5, 2.8], [-2, -12, 2.3], [5, -13, 2]]) { c.fillStyle = `rgba(${T.glow},${0.25 * pulse})`; c.beginPath(); c.arc(x, y, r * 2, 0, 7); c.fill(); c.fillStyle = `rgba(${T.glow},${0.8 * pulse})`; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  c.globalCompositeOperation = 'source-over';
  // heavy team carapace plates along the back, overlapping front over back
  for (let i = 0; i < 5; i++) {
    const x = -24 + i * 8.6, w = 12.5, top = -36 - Math.sin(i * 0.75 + 0.4) * 4 + (cg ? i * 0.6 : 0);
    c.fillStyle = lgrad(c, 0, top - 2, 0, -18, [T.light, T.main, T.hull]);
    c.beginPath(); c.moveTo(x - 1, -18); c.quadraticCurveTo(x - 1.5, top, x + w * 0.5, top - 1.5); c.quadraticCurveTo(x + w + 1.5, top + 1, x + w, -19); c.closePath(); c.fill(); outline(c, 1.1);
    c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x + 1.5, top + 0.8); c.quadraticCurveTo(x + w * 0.5, top - 0.6, x + w - 1.5, top + 1.2); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x + w * 0.5, top + 2); c.lineTo(x + w * 0.45, -20); c.stroke(); // a plate seam
    c.fillStyle = lgrad(c, 0, top - 6, 0, top, [DT_BONE, '#a8957a']); poly(c, [[x + w * 0.35, top + 0.5], [x + w * 0.2 - 1, top - 5.5], [x + w * 0.6, top]]); c.fill(); outline(c, 0.6); // a back spine
  }
  // the head: low and armoured, horns forward (lower still when charging)
  const hy = cg ? -11 : -16 + dz * 1.5 + (dz ? 2 : 0), hx = 18;
  c.fillStyle = lgrad(c, hx, hy - 7, hx, hy + 6, [DT_FLESH[0], DT_FLESH[2]]); c.beginPath(); c.ellipse(hx, hy, 9, 7, cg ? 0.25 : 0.12, 0, 7); c.fill(); outline(c, 1.1);
  c.fillStyle = lgrad(c, hx - 6, hy - 9, hx + 6, hy - 1, [T.light, T.main, T.hull]); // the brow plate
  c.beginPath(); c.moveTo(hx - 8, hy - 1); c.quadraticCurveTo(hx - 6, hy - 9.5, hx + 3, hy - 8.5); c.quadraticCurveTo(hx + 9, hy - 6, hx + 9.5, hy - 1); c.quadraticCurveTo(hx + 1, hy - 3, hx - 8, hy - 1); c.fill(); outline(c, 0.9);
  rim(c, hx - 5, hy - 8.3, hx + 3, 'rgba(255,255,255,0.45)');
  for (const [ox, oy, l, a] of [[2, -6, 15, cg ? -0.05 : -0.35], [-1, -4, 11, cg ? 0.1 : -0.15]]) { // two forward horns
    const bx = hx + ox, by = hy + oy, tx = bx + Math.cos(a) * l, ty = by + Math.sin(a) * l;
    c.fillStyle = lgrad(c, bx, by, tx, ty, [DT_BONE, '#b8a684', '#7d6c52']); c.beginPath(); c.moveTo(bx, by - 2.2); c.quadraticCurveTo((bx + tx) / 2, (by + ty) / 2 - 3, tx, ty); c.quadraticCurveTo((bx + tx) / 2, (by + ty) / 2 + 1.5, bx, by + 2); c.closePath(); c.fill(); outline(c, 0.8);
  }
  c.fillStyle = '#2a0d18'; c.beginPath(); c.ellipse(hx + 6, hy + 3.5, 3.6, 1.2 + bite * 1.2, 0.15, 0, 7); c.fill(); // the jaw
  c.fillStyle = `rgba(${T.glow},1)`; c.beginPath(); c.arc(hx + 4.5, hy - 2.5, 1.2, 0, 7); c.arc(hx + 1.5, hy - 2, 0.9, 0, 7); c.fill();
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.35)`; c.beginPath(); c.arc(hx + 3.5, hy - 2.4, 3.4, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  leg(-10, 0.2, true); leg(11, Math.PI + 0.4, true);
  c.lineCap = 'butt'; c.restore();
}

// Bastion: floating obsidian slabs around a glowing core, two slab legs, a projector crest that throws its barrier
function dBast3(c, T, u) {
  const t = u.anim || 0, y0 = -8 + hov(u, u.moving ? 4 : 1.6), ph = u.moving ? t * 5 : 0, rec = u.recoil || 0;
  const slab = (pts, lit) => { c.fillStyle = lgrad(c, pts[0][0], pts[0][1], pts[2][0], pts[2][1], lit ? [T.light, T.main, T.hull] : [OBS[0], OBS[1], OBS[2]]); poly(c, pts); c.fill(); outline(c, 1); };
  c.fillStyle = `rgba(${T.glow},0.2)`; c.beginPath(); c.ellipse(0, -0.5, 16, 3.2, 0, 0, 7); c.fill(); // its light on the ground
  // legs: two heavy slabs that step
  const s1 = Math.sin(ph) * 2.5, s2 = -s1;
  slab([[-10 + s1, y0 - 10], [-3 + s1, y0 - 10], [-4 + s1, y0 + 1 + Math.max(0, -s1) * 0.4], [-11 + s1, y0 + 1]], false);
  slab([[3 + s2, y0 - 10], [10 + s2, y0 - 10], [11 + s2, y0 + 1], [4 + s2, y0 + 1 + Math.max(0, -s2) * 0.4]], false);
  // lines of light holding it together
  c.strokeStyle = `rgba(${T.glow},0.8)`; c.lineWidth = 0.9; c.beginPath();
  for (const [a, b, x, y] of [[-6, y0 - 11, -6, y0 - 15], [6, y0 - 11, 6, y0 - 15], [-14, y0 - 27, -10, y0 - 27], [14, y0 - 27, 10, y0 - 27], [0, y0 - 43, 0, y0 - 39]]) { c.moveTo(a, b); c.lineTo(x, y); }
  c.stroke();
  // the body: a wide obsidian block, a great team slab across the chest, side slabs
  slab([[-13, y0 - 38], [13, y0 - 38], [11, y0 - 15], [-11, y0 - 15]], false);
  slab([[-17, y0 - 35], [-12, y0 - 37], [-12, y0 - 17], [-18, y0 - 19]], true); slab([[12, y0 - 37], [18, y0 - 35], [19, y0 - 19], [12, y0 - 17]], true);
  slab([[-9, y0 - 36], [10, y0 - 36], [8.5, y0 - 19], [-7.5, y0 - 19]], true);
  rim(c, -12, y0 - 38, 12, 'rgba(230,220,255,0.55)');
  // the core: a glowing rhombus in the chest
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = `rgba(${T.glow},0.35)`; c.beginPath(); c.arc(0.5, y0 - 27, 7, 0, 7); c.fill();
  c.fillStyle = `rgba(${T.glow},${0.85 + 0.15 * Math.sin(t * 3)})`; poly(c, [[0.5, y0 - 32], [4.5, y0 - 27], [0.5, y0 - 22], [-3.5, y0 - 27]]); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.9)'; poly(c, [[0.5, y0 - 29.5], [2, y0 - 27], [0.5, y0 - 24.5], [-1, y0 - 27]]); c.fill();
  c.globalCompositeOperation = 'source-over';
  // glyph lines on the chest slab
  c.strokeStyle = `rgba(${T.glow},0.7)`; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-6, y0 - 33); c.lineTo(-3, y0 - 33); c.moveTo(4, y0 - 33); c.lineTo(7, y0 - 33); c.moveTo(-6, y0 - 21); c.lineTo(7, y0 - 21); c.stroke();
  // the projector crest: a floating wedge with a light fin facing forward
  const cy = y0 - 47 + Math.sin(t * 2) * 0.7;
  slab([[-6, cy + 2], [5, cy - 1], [9, cy + 4], [-4, cy + 6]], false);
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = `rgba(${T.glow},${0.55 + 0.35 * rec})`; c.lineWidth = 2.4; c.beginPath(); c.moveTo(9, cy + 4); c.quadraticCurveTo(15, cy - 2, 13, cy - 9); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 0.8; c.stroke();
  if (rec > 0.2) { c.fillStyle = `rgba(${T.glow},${rec * 0.6})`; c.beginPath(); c.arc(16, cy - 2, 5 * rec, 0, 7); c.fill(); } // its pulse leaving
  c.globalCompositeOperation = 'source-over';
}

// Shardling: floating shards (head, torso, hips, two legs) held by thin light; a light blade; u.pr: its parry is ready (a glint)
function dShard3(c, T, u) {
  const t = u.anim || 0, y0 = -5 + hov(u, u.moving ? 9 : 3), sw = u.recoil || 0, lean = u.moving ? 2.5 : 0.5;
  const shard = (pts, lit) => { c.fillStyle = lgrad(c, pts[0][0], pts[0][1], pts[2][0], pts[2][1], lit ? [T.light, T.main, T.hull] : [OBS[0], OBS[1], OBS[2]]); poly(c, pts); c.fill(); outline(c, 0.75); };
  c.fillStyle = `rgba(${T.glow},0.2)`; c.beginPath(); c.ellipse(0, -0.5, 7, 1.7, 0, 0, 7); c.fill();
  // lines of light
  c.strokeStyle = `rgba(${T.glow},0.8)`; c.lineWidth = 0.6; c.beginPath(); c.moveTo(lean + 1, y0 - 26); c.lineTo(lean, y0 - 23); c.moveTo(0, y0 - 14); c.lineTo(-0.5, y0 - 11); c.moveTo(-1.5, y0 - 8); c.lineTo(-2.5, y0 - 4); c.moveTo(1.5, y0 - 8); c.lineTo(2.5, y0 - 4); c.stroke();
  // legs: two thin shards that scissor
  const k = u.moving ? Math.sin(t * 9) * 2 : 0;
  shard([[-3 + k, y0 - 7], [-0.5 + k, y0 - 7], [-2 + k * 1.4, y0 + 1]], false); shard([[1 - k, y0 - 7], [3.5 - k, y0 - 7], [2.5 - k * 1.4, y0 + 1]], false);
  shard([[-3, y0 - 11.5], [3.5, y0 - 12], [2, y0 - 8], [-2, y0 - 8]], false); // hips
  // the back blade arm (a short shard)
  shard([[lean - 4, y0 - 21], [lean - 2, y0 - 22], [lean - 5, y0 - 13]], false);
  // torso: a dark shard with a team shard across it
  shard([[-3 + lean, y0 - 23], [3.5 + lean, y0 - 23.5], [2.5, y0 - 13.5], [-2.5, y0 - 13]], false);
  shard([[0 + lean, y0 - 22.5], [4 + lean, y0 - 21.5], [3, y0 - 15], [0.5, y0 - 14]], true);
  rim(c, -2.5 + lean, y0 - 23, 3 + lean, 'rgba(230,220,255,0.6)');
  // head: a narrow shard with a visor slit, and a tiny crown shard
  shard([[0.5 + lean, y0 - 30.5], [4.5 + lean, y0 - 28.5], [3.5 + lean, y0 - 25], [0 + lean, y0 - 25.5]], false);
  shard([[1 + lean, y0 - 34 + Math.sin(t * 2.4) * 0.5], [2.5 + lean, y0 - 32], [1 + lean, y0 - 31.5]], true);
  c.fillStyle = `rgba(${T.glow},1)`; c.fillRect(2.6 + lean, y0 - 28.6, 1.8, 0.9);
  // the light blade: held low and forward, it lunges on a blow
  const bx = 4 + lean + sw * 3, by = y0 - 18, tx = bx + 11 + sw * 5, ty = by + 4 - sw * 6;
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  c.strokeStyle = `rgba(${T.glow},0.5)`; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
  c.strokeStyle = 'rgba(250,250,255,0.95)'; c.lineWidth = 1; c.stroke();
  c.fillStyle = `rgba(${T.glow},0.9)`; c.beginPath(); c.arc(bx, by, 1.2, 0, 7); c.fill();
  if (u.pr) { // parry ready: a glint near the blade's tip
    const gx = tx - 2.5, gy = ty - 1;
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(gx, gy, 2.6, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(gx - 4, gy); c.lineTo(gx + 4, gy); c.moveTo(gx, gy - 4); c.lineTo(gx, gy + 4); c.stroke();
  }
  if (sw > 0.3) { c.strokeStyle = `rgba(${T.glow},${sw * 0.7})`; c.lineWidth = 1.6; c.beginPath(); c.arc(bx, by + 1, 13, -0.9, 0.7); c.stroke(); } // the swing's arc
  c.globalCompositeOperation = 'source-over'; c.lineCap = 'butt';
}

// Bulwark. u.br: bracing (it hunkers down, its front plate closed over the head); u.hl 1-3: regenerating on creep (the glow sacs pulse)
function dBulk3(c, T, u) {
  const br = !!u.br, hl = u.hl || 0, ph = u.moving && !br ? (u.anim || 0) * 6 : 0, low = br ? 4 : 0, bite = u.recoil || 0;
  c.lineCap = 'round'; c.lineJoin = 'round';
  const leg = (x, o, near) => {
    const sw = Math.sin(ph + o) * 2.5, sx = br ? (x < 0 ? -2.5 : 2.5) : 0; // braced: legs splayed out
    c.strokeStyle = OUTL; c.lineWidth = near ? 7.5 : 6.5; c.beginPath(); c.moveTo(x, -10 + low); c.lineTo(x + sx + sw * 0.4, -5 + low * 0.5); c.lineTo(x + sx * 1.6 + sw, 0); c.stroke();
    c.strokeStyle = near ? BK_FLESH[1] : BK_FLESH[2]; c.lineWidth = near ? 5.8 : 4.8; c.stroke();
    c.strokeStyle = DT_BONE; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x + sx * 1.6 + sw - 1.5, 0); c.lineTo(x + sx * 1.6 + sw + 2.2, 0.4); c.stroke();
  };
  leg(-12, Math.PI, false); leg(5, 0.4, false);
  // belly
  c.fillStyle = lgrad(c, 0, -22 + low, 0, -4 + low, [BK_FLESH[0], BK_FLESH[1], BK_FLESH[2]]); c.beginPath(); c.ellipse(-2, -10 + low, 17, 7, 0, 0, 7); c.fill(); outline(c);
  // glow sacs low on the flank (they pulse while it regenerates on creep)
  const gl = hl ? 0.55 + 0.45 * [0, 1, 0.55, 0.15][hl] : 0.35;
  c.globalCompositeOperation = 'lighter';
  for (const [x, y, r] of [[-13, -8, 2.2], [-6, -6.5, 2.6], [1, -6.5, 2.4], [7.5, -8, 1.9]]) { c.fillStyle = `rgba(${T.glow},${0.3 * gl})`; c.beginPath(); c.arc(x, y + low, r * (2 + gl), 0, 7); c.fill(); c.fillStyle = `rgba(${hl ? '180,255,170' : T.glow},${Math.min(1, 0.5 + gl * 0.6)})`; c.beginPath(); c.arc(x, y + low, r, 0, 7); c.fill(); }
  c.globalCompositeOperation = 'source-over';
  // the broad shell: a dome of three overlapping team plates, a heavy rim
  c.fillStyle = lgrad(c, 0, -32 + low, 0, -9 + low, [T.light, T.main, T.hull]);
  c.beginPath(); c.moveTo(-22, -9 + low); c.quadraticCurveTo(-22, -31 + low, -3, -31.5 + low); c.quadraticCurveTo(17, -31 + low, 19, -10 + low); c.closePath(); c.fill(); outline(c, 1.2);
  c.strokeStyle = 'rgba(0,0,0,0.32)'; c.lineWidth = 0.9; c.beginPath();
  c.moveTo(-11, -10 + low); c.quadraticCurveTo(-12, -24 + low, -5, -30 + low); c.moveTo(6, -10 + low); c.quadraticCurveTo(7, -24 + low, 2, -30.5 + low); c.stroke(); // plate seams
  c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-17, -22 + low); c.quadraticCurveTo(-10, -30.5 + low, 0, -30.5 + low); c.stroke(); // the light rim
  c.fillStyle = lgrad(c, 0, -12 + low, 0, -7 + low, [T.hull, '#1d1915']); c.beginPath(); c.moveTo(-23, -8 + low); c.quadraticCurveTo(-2, -13 + low, 20, -8.5 + low); c.quadraticCurveTo(-2, -6 + low, -23, -8 + low); c.fill(); outline(c, 0.8); // the heavy lower rim
  for (const x of [-15, -6, 3, 11]) { c.fillStyle = DT_BONE; poly(c, [[x - 1.4, -29 + low + Math.abs(x) * 0.08], [x + 0.2, -33.5 + low + Math.abs(x) * 0.1], [x + 1.6, -29 + low + Math.abs(x) * 0.08]]); c.fill(); outline(c, 0.5); } // knobs
  // the low head under the shell's front (closed over by the front plate when braced)
  const hx = 19, hy = -9 + low;
  if (!br) {
    c.fillStyle = lgrad(c, hx, hy - 6, hx, hy + 4, [BK_FLESH[0], BK_FLESH[2]]); c.beginPath(); c.ellipse(hx, hy, 6.5, 5, 0.1, 0, 7); c.fill(); outline(c, 0.9);
    c.fillStyle = '#251a14'; c.beginPath(); c.ellipse(hx + 4, hy + 2, 2.6, 0.8 + bite, 0.2, 0, 7); c.fill();
    c.fillStyle = `rgba(${T.glow},1)`; c.beginPath(); c.arc(hx + 2.5, hy - 1.8, 1, 0, 7); c.fill();
  }
  c.fillStyle = lgrad(c, hx - 4, hy - 9, hx + 4, hy + 2, [T.light, T.main, T.hull]); // the front plate: a visor over the head, closed down when braced
  c.beginPath(); c.moveTo(hx - 7, hy - 6.5); c.quadraticCurveTo(hx + 2, hy - (br ? 10 : 11), hx + (br ? 8.5 : 7), hy - (br ? 1 : 5)); c.quadraticCurveTo(hx + (br ? 6 : 3), hy + (br ? 3 : -3), hx - 2, hy + (br ? 3.5 : -2.5)); c.closePath(); c.fill(); outline(c, 0.9);
  if (br) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${T.glow},0.75)`; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-21, -9 + low); c.quadraticCurveTo(-22, -31 + low, -3, -31.5 + low); c.quadraticCurveTo(17, -31 + low, hx + 8, hy - 1); c.stroke(); c.globalCompositeOperation = 'source-over'; } // its plates locked, edges glowing
  leg(-8, 0.2, true); leg(10, Math.PI + 0.4, true);
  c.lineCap = 'butt';
}

DRAW_U.dreadthorn = dDread3; DRAW_U.bastion = dBast3; DRAW_U.shardling = dShard3; DRAW_U.bulwark = dBulk3;
Object.assign(SPR_BOX, { dreadthorn: [-34, -52, 78, 60], bastion: [-24, -70, 52, 72], shardling: [-12, -44, 36, 48], bulwark: [-30, -38, 66, 42] });
Object.assign(UVIS, { dreadthorn: { h: 36, w: 23 }, bastion: { h: 46, w: 15 }, shardling: { h: 30, w: 8 }, bulwark: { h: 30, w: 21 } });

/* ---- overlays on a unit (drawUnit) ---- */
// A charging Dreadthorn's dust: puffs along the way it has come, thinning out behind it
function drawChargeDust(c, u, t) {
  const du = u.u - u.crU0, dv = u.v - u.crV0, len = Math.hypot(du, dv);
  if (len < 2) return;
  const n = Math.min(12, Math.ceil(len / 12));
  for (let i = 0; i < n; i++) {
    const k = i / n, d = k * Math.min(len, 140), pu = u.u - u.crU * d, pv = u.v - u.crV * d, w = P(pu, pv, 0), r = (6 + k * 10) * US, a = 0.4 * (1 - k);
    const wob = Math.sin(t * 9 + i * 1.7) * 2;
    c.fillStyle = `rgba(150,128,98,${a})`; c.beginPath(); c.ellipse(w.x + wob, w.y - r * 0.35, r, r * 0.55, 0, 0, 7); c.fill();
  }
}
// Dazed: spores and little stars circling over its head
function drawDazed(c, u, w, t) {
  const h = visH(u.type) * US, y = w.y - h - 4, left = clamp((u.dzT - t) / TRAMPLE.daze, 0, 1);
  for (let i = 0; i < 4; i++) {
    const a = t * 5 + i * Math.PI / 2, x = w.x + Math.cos(a) * 13, yy = y + Math.sin(a) * 4;
    c.globalAlpha = (0.55 + 0.45 * Math.sin(a)) * Math.min(1, left * 3);
    if (i % 2) { c.fillStyle = '#fff1a8'; c.beginPath(); for (let k = 0; k < 4; k++) { const b = k * Math.PI / 2 + t * 3; c.lineTo(x + Math.cos(b) * 4.5, yy + Math.sin(b) * 4.5); c.lineTo(x + Math.cos(b + 0.785) * 1.6, yy + Math.sin(b + 0.785) * 1.6); } c.closePath(); c.fill(); }
    else { c.fillStyle = 'rgba(190,240,140,0.95)'; c.beginPath(); c.arc(x, yy, 2.5, 0, 7); c.fill(); }
  }
  c.globalAlpha = 1;
}

/* ---- the barrier ---- */
const BWV = { n: 9 }; // samples across the wall
function drawBarriers(c, g, lit, t) {
  for (const B of g.ents) {
    if (B.kind !== 'u' || B.type !== 'bastion' || B.hp <= 0 || B.bwHp === undefined || B.bwDn || B.gone) continue;
    const cu = B.u + B.bwF * BAR.off; if (!lit(cu, B.v)) continue;
    const frac = clamp(B.bwHp / barHp(g), 0, 1), hit = clamp(1 - (g.t - B.bwHit) / 0.18, 0, 1), T = TEAM[B.side], H = BAR.h;
    const fl = frac < 0.3 ? 0.75 + 0.25 * Math.sin(t * 30 + B.id) : 1; // weak: it flickers
    const bot = [], top = [];
    for (let i = 0; i < BWV.n; i++) { const q = -1 + 2 * i / (BWV.n - 1), dv = q * BAR.half, u = B.u + B.bwF * (BAR.off - BAR.bow * q * q); bot.push(P(u, B.v + dv, 0)); top.push(P(u, B.v + dv, H * (1 - 0.18 * q * q))); }
    c.save(); c.globalCompositeOperation = 'lighter';
    // the wall of light
    const gr = c.createLinearGradient(0, top[4].y, 0, bot[4].y); gr.addColorStop(0, `rgba(${T.glow},${(0.42 + 0.4 * hit) * fl})`); gr.addColorStop(1, `rgba(${T.glow},${(0.16 + 0.25 * hit) * fl})`);
    c.fillStyle = gr; c.beginPath(); bot.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); for (let i = top.length - 1; i >= 0; i--) c.lineTo(top[i].x, top[i].y); c.closePath(); c.fill();
    // glyph lines: two bands across and a mark between every other pair of samples
    c.strokeStyle = `rgba(${T.glow},${0.6 * fl})`; c.lineWidth = 0.9;
    for (const k of [0.33, 0.66]) { c.beginPath(); for (let i = 0; i < bot.length; i++) { const x = bot[i].x + (top[i].x - bot[i].x) * k, y = bot[i].y + (top[i].y - bot[i].y) * k; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    c.beginPath(); for (let i = 1; i < bot.length - 1; i += 2) { const x = (bot[i].x + top[i].x) / 2, y = (bot[i].y + top[i].y) / 2; c.moveTo(x - 1.5, y - 3); c.lineTo(x + 1.5, y); c.lineTo(x - 1.5, y + 3); } c.stroke();
    // its bright top edge and footing
    c.strokeStyle = hit > 0 ? `rgba(255,255,255,${0.6 + 0.4 * hit})` : `rgba(${T.glow},${0.95 * fl})`; c.lineWidth = 1.8; c.beginPath(); top.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke();
    c.strokeStyle = `rgba(${T.glow},${0.22 * fl})`; c.lineWidth = 7; c.beginPath(); bot.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke(); // its glow on the ground
    c.strokeStyle = `rgba(${T.glow},${0.6 * fl})`; c.lineWidth = 1.4; c.stroke();
    c.globalCompositeOperation = 'source-over';
    // cracks as it weakens (fixed per Bastion), dark with a white core
    const nc = frac < 0.25 ? 4 : frac < 0.5 ? 3 : frac < 0.8 ? 1 : 0;
    for (let k = 0; k < nc; k++) {
      const i0 = 1 + ((B.id * 3 + k * 5) % (BWV.n - 2)), p0 = top[i0], p1 = bot[i0], s = Math.sin(B.id * 1.7 + k * 2.3);
      const a = { x: p0.x + (p1.x - p0.x) * 0.15, y: p0.y + (p1.y - p0.y) * 0.15 }, pts = [a];
      for (let j = 1; j <= 3; j++) pts.push({ x: a.x + s * 4 * j + (j % 2 ? 3 : -2), y: a.y + (p1.y - p0.y) * 0.22 * j });
      c.strokeStyle = 'rgba(20,10,40,0.7)'; c.lineWidth = 1.6; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 0.6; c.stroke();
    }
    c.restore();
  }
}
// The wall breaking: it cracks white, then falls apart into shards that drop and fade
function drawBwBreak(c, f) {
  const k = f.t / f.life, T = TEAM[f.side], H = BAR.h * 0.8, dy = BAR.half * DY;
  c.save(); c.globalCompositeOperation = 'lighter';
  if (k < 0.25) { const q = 1 - k / 0.25; c.strokeStyle = `rgba(255,255,255,${q})`; c.lineWidth = 2; c.beginPath(); c.moveTo(f.x - 3, f.y - dy); c.lineTo(f.x + 4, f.y - H * 0.5); c.lineTo(f.x - 2, f.y + dy * 0.2); c.lineTo(f.x + 3, f.y + dy); c.stroke(); stamp(c, GLOW.white, f.x, f.y - H * 0.4, 30, 0.6 * q); }
  for (let i = 0; i < 14; i++) {
    const s = Math.sin(i * 12.9898) * 43758.5453, r = s - Math.floor(s), y0 = f.y - dy + (2 * dy) * (i / 13) - r * H * 0.8, x0 = f.x + (r - 0.5) * 6;
    const x = x0 + f.F * k * (6 + r * 10), y = y0 + k * k * (H * 0.9 + r * 10), a = (1 - k) * 0.9, z = 2.5 + r * 2.5;
    c.fillStyle = `rgba(${T.glow},${a})`; c.beginPath(); c.moveTo(x, y - z); c.lineTo(x + z * 0.6, y); c.lineTo(x, y + z * 0.8); c.lineTo(x - z * 0.5, y); c.closePath(); c.fill();
  }
  c.restore();
}
function drawBwUp(c, f) { // back up at full health: a quick bright rise
  const k = f.t / f.life, T = TEAM[f.side], dy = BAR.half * DY, H = BAR.h * 0.8 * k;
  c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${T.glow},${1 - k})`; c.lineWidth = 2;
  c.beginPath(); c.moveTo(f.x, f.y - dy); c.lineTo(f.x, f.y + dy); c.moveTo(f.x, f.y - dy - H); c.lineTo(f.x, f.y + dy - H); c.stroke(); c.restore();
}
// A shot striking the wall: a ring of light where it hit
function drawBwHit(c, f) {
  const k = f.t / f.life, T = TEAM[f.side];
  c.save(); c.globalCompositeOperation = 'lighter';
  stamp(c, GLOW.white, f.x, f.y, 6 + k * 4, 0.7 * (1 - k));
  c.strokeStyle = `rgba(${T.glow},${1 - k})`; c.lineWidth = 1.4; c.beginPath(); c.ellipse(f.x, f.y, 3 + k * 7, (3 + k * 7) * 1.4, 0, 0, 7); c.stroke();
  c.restore();
}
// A Dreadthorn trampling a unit: a burst of dust and a white impact star, pushed the way the unit is knocked
function drawTrampleFx(c, f) {
  const k = f.t / f.life, a = 1 - k;
  c.fillStyle = `rgba(150,128,98,${0.5 * a})`; c.beginPath(); c.ellipse(f.x + f.dx * k * 8, f.y + 6, 8 + k * 12, (8 + k * 12) * 0.4, 0, 0, 7); c.fill();
  if (k < 0.4) { const q = 1 - k / 0.4; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,240,200,${q})`; c.lineWidth = 1.6; c.beginPath(); for (let i = 0; i < 6; i++) { const b = i * 1.047; c.moveTo(f.x + Math.cos(b) * 2, f.y + Math.sin(b) * 2); c.lineTo(f.x + Math.cos(b) * (5 + 6 * (1 - q)), f.y + Math.sin(b) * (5 + 6 * (1 - q))); } c.stroke(); c.restore(); }
}
function drawChargeEnd(c, f) { // a cloud of dust where the charge stopped
  const k = f.t / f.life, a = (1 - k) * 0.45;
  for (let i = 0; i < 5; i++) { const b = i * 1.256, r = 8 + k * 18; c.fillStyle = `rgba(150,128,98,${a})`; c.beginPath(); c.ellipse(f.x + Math.cos(b) * r, f.y - 3 + Math.sin(b) * r * 0.35, 7 + k * 6, 4 + k * 3, 0, 0, 7); c.fill(); }
}
// A parry: a bright flash on the blade; with a counter, a quick crescent slash toward the attacker
function drawParryFx(c, f) {
  const k = f.t / f.life, T = TEAM[f.side];
  c.save(); c.globalCompositeOperation = 'lighter';
  if (k < 0.5) { const q = 1 - k / 0.5, x = f.x + f.face * 8, y = f.y - 4; stamp(c, GLOW.white, x, y, 18 + 10 * (1 - q), q); stamp(c, GLOW.cyan, x, y, 26, 0.6 * q); c.strokeStyle = `rgba(255,255,255,${q})`; c.lineWidth = 1.8; c.beginPath(); for (let i = 0; i < 4; i++) { const b = i * Math.PI / 2 + 0.4, r = (i % 2 ? 9 : 16) * (0.4 + 0.6 * q); c.moveTo(x, y); c.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); } c.stroke(); }
  if (f.ctr) { const q = clamp(k * 2.2, 0, 1), a = 1 - k; c.strokeStyle = `rgba(${T.glow},${a})`; c.lineWidth = 6 * (1 - k * 0.5); c.lineCap = 'round'; c.beginPath(); const s0 = -1.3, s1 = s0 + 2.4 * q; if (f.face > 0) c.arc(f.x + 6, f.y, 22, s0, s1); else c.arc(f.x - 6, f.y, 22, Math.PI - s1, Math.PI - s0); c.stroke(); c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 2; c.stroke(); c.lineCap = 'butt'; }
  c.restore();
}
