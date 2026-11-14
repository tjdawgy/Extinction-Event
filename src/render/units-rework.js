/* ---------- Faction rework art (v2.82, batch 2a; docs/FACTION_REWORK.md "Art direction") ----------
   The richer unit style: gradients for shading, dark outlines, a light rim on top edges, glowing visors, cores and sacs,
   and team colour over much of the body. Artillery (scavenged military, stabiliser legs that fold down when deployed),
   Gorebore (a segmented digging beast) and Severance (a floating obsidian monolith). Each is drawn into the sprite cache
   as poses like every ground unit (the Artillery's deploy state and the Severance's ring are poses too). */
const OLIVE = ['#7b8a4c', '#56633a', '#384126'], STEEL = ['#9aa6b6', '#5d6a7c', '#323a48'], RUSTO = '#b8642c', HAZ = '#f2c23a';
const OUTL = 'rgba(8,10,14,0.85)';
function lgrad(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; }
function outline(c, w = 1.1) { c.strokeStyle = OUTL; c.lineWidth = w; c.lineJoin = 'round'; c.stroke(); }
function rim(c, x0, y, x1, col = 'rgba(255,255,255,0.45)') { c.strokeStyle = col; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); }

// Artillery: a tracked gun carrier with a long barrel. u.dpk 0 (packed) … 1 (deployed): the four stabiliser legs fold down
function dArt2(c, T, u) {
  const rk = (u.recoil || 0) * 5, k = u.dpk || 0, e = 1 - (1 - k) * (1 - k);
  const leg = (px, py, s, near) => { // folded up along the hull (k 0) to braced on the ground (k 1)
    const a0 = s > 0 ? Math.PI + 0.12 : -0.12, a1 = s > 0 ? 0.72 : Math.PI - 0.72, a = a0 + (a1 - a0) * e, L1 = 13;
    const fx = px + Math.cos(a) * L1, fy = py + Math.sin(a) * L1;
    c.strokeStyle = near ? STEEL[1] : STEEL[2]; c.lineWidth = near ? 3 : 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(px, py); c.lineTo(fx, fy); c.stroke();
    c.strokeStyle = STEEL[0]; c.lineWidth = 0.9; c.beginPath(); c.moveTo(px, py); c.lineTo(px + (fx - px) * 0.55, py + (fy - py) * 0.55); c.stroke(); // piston
    if (e > 0.6) { c.fillStyle = near ? STEEL[2] : '#1c222c'; rr(c, fx - 3.5, fy - 1.4, 7, 2.6, 1); c.fill(); } // pad
    c.lineCap = 'butt';
  };
  leg(-17, -9, -1, false); leg(13, -9, 1, false);
  // exhaust stack and its smoke
  c.fillStyle = lgrad(c, -18, 0, -13, 0, [STEEL[1], STEEL[2]]); rr(c, -18, -27, 4, 12, 1); c.fill(); outline(c, 0.8);
  c.fillStyle = 'rgba(70,70,78,0.55)'; c.beginPath(); c.arc(-16 - (u.anim || 0) % 2, -30, 3, 0, 7); c.arc(-18.5, -34, 2.3, 0, 7); c.fill();
  c.fillStyle = RUSTO; rr(c, -13, -22, 6, 5, 2); c.fill(); outline(c, 0.7); // fuel drum
  // barrel and cradle (pivot (-4, -18), tip near MUZ.artillery (28, -31))
  c.save(); c.translate(-4, -18); c.rotate(-0.39 - e * 0.08);
  c.fillStyle = lgrad(c, 0, -2, 0, 2, [STEEL[0], STEEL[2]]); c.fillRect(-4 - rk, -1.7, 36, 3.4); c.strokeStyle = OUTL; c.lineWidth = 0.8; c.strokeRect(-4 - rk, -1.7, 36, 3.4);
  c.fillStyle = STEEL[2]; c.fillRect(30 - rk, -2.6, 5, 5.2); c.fillStyle = T.main; c.fillRect(14 - rk, -2.2, 3, 4.4); // muzzle brake, a team band
  c.fillStyle = lgrad(c, 0, -5, 0, 5, [OLIVE[0], OLIVE[2]]); rr(c, -9, -5, 13, 10, 2.5); c.fill(); outline(c); // breech
  c.restore();
  // tracks
  c.fillStyle = '#1b2029'; rr(c, -21, -9, 40, 9, 4.5); c.fill(); outline(c);
  for (const x of [-16, -8, 0, 8, 14]) { c.fillStyle = STEEL[1]; c.beginPath(); c.arc(x, -4.5, 2.9, 0, 7); c.fill(); c.fillStyle = STEEL[0]; c.beginPath(); c.arc(x - 0.6, -5.1, 1.1, 0, 7); c.fill(); }
  // hull: olive body, team armour plates, hazard stripes on the rear plate
  c.fillStyle = lgrad(c, 0, -19, 0, -8, [OLIVE[0], OLIVE[1], OLIVE[2]]); poly(c, [[-20, -9], [-19, -17], [-6, -19], [12, -18], [17, -12], [16, -9]]); c.fill(); outline(c);
  c.fillStyle = lgrad(c, 0, -17, 0, -10, [T.light, T.main, T.hull]); poly(c, [[-11, -10], [-10, -17.4], [11, -17.2], [15.5, -12], [14.5, -10]]); c.fill(); outline(c, 0.8);
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(2, -17); c.lineTo(2.5, -10); c.stroke(); c.fillStyle = M.d; for (const x of [-8, 5, 12]) { c.beginPath(); c.arc(x, -12, 0.7, 0, 7); c.fill(); } // plate seam, rivets
  c.save(); c.beginPath(); c.rect(-20, -16, 7, 6.5); c.clip(); c.fillStyle = HAZ; c.fillRect(-20, -16, 7, 6.5); c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.4;
  for (let i = -3; i < 3; i++) { c.beginPath(); c.moveTo(-20 + i * 3.2, -9); c.lineTo(-14 + i * 3.2, -17); c.stroke(); } c.restore();
  rim(c, -18, -17.5, 11);
  c.fillStyle = M.d; rr(c, 6, -24, 9, 7, 1.5); c.fill(); outline(c, 0.8); // cab
  c.fillStyle = `rgba(${T.glow},0.95)`; c.fillRect(10.5, -22.5, 3.6, 2); // visor
  leg(-17, -9, -1, true); leg(13, -9, 1, true);
}

// Gorebore: a segmented digging beast. Heavy team-coloured carapace plates on its back, clawed forelimbs, a ring maw of
// bone teeth, pulsing glow sacs
const GB_FLESH = ['#8c5a52', '#5c3634', '#3a2124'], GB_BONE = '#efe3c8', GB_SAC = '155,225,93';
function dGorebore(c, T, u) {
  const ph = u.moving ? u.anim * 6 : 0, bite = (u.recoil || 0), pulse = 0.75 + 0.25 * Math.sin((u.anim || 0) * 3);
  // hind legs
  c.strokeStyle = GB_FLESH[2]; c.lineWidth = 3; c.lineCap = 'round';
  for (const [x, o] of [[-15, 0], [-7, Math.PI]]) { const s = Math.sin(ph + o) * 3; c.beginPath(); c.moveTo(x, -8); c.lineTo(x - 2 + s, -3); c.lineTo(x + s, 0); c.stroke(); }
  // body: belly then four overlapping carapace plates, back to front
  c.fillStyle = lgrad(c, 0, -16, 0, -2, [GB_FLESH[0], GB_FLESH[1], GB_FLESH[2]]); c.beginPath(); c.ellipse(-4, -9, 18, 7, 0, 0, 7); c.fill(); outline(c);
  for (let i = 0; i < 4; i++) {
    const x = -18 + i * 7.5, w = 9 + i * 0.6, top = -17 - Math.sin(i * 0.9) * 2;
    c.fillStyle = lgrad(c, 0, top - 2, 0, -8, [T.light, T.main, T.hull]);
    c.beginPath(); c.moveTo(x - 1, -8); c.quadraticCurveTo(x - 1, top - 1, x + w * 0.55, top - 1.5); c.quadraticCurveTo(x + w + 1, top, x + w, -9); c.closePath(); c.fill(); outline(c, 0.9);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x + 1, top + 0.5); c.quadraticCurveTo(x + w * 0.5, top - 1.2, x + w - 1, top + 0.5); c.stroke();
  }
  // glow sacs along the flank
  c.globalCompositeOperation = 'lighter';
  for (const [x, r] of [[-12, 2.2], [-5, 2.6], [2, 2.2]]) { c.fillStyle = `rgba(${GB_SAC},${0.35 * pulse})`; c.beginPath(); c.arc(x, -7, r * 1.9, 0, 7); c.fill(); c.fillStyle = `rgba(${GB_SAC},${0.9 * pulse})`; c.beginPath(); c.arc(x, -7, r, 0, 7); c.fill(); }
  c.globalCompositeOperation = 'source-over';
  // head: a blunt digging skull with a ring maw of bone teeth facing forward
  c.fillStyle = lgrad(c, 8, -18, 8, -4, [GB_FLESH[0], GB_FLESH[2]]); c.beginPath(); c.ellipse(14, -11, 8, 7, 0, 0, 7); c.fill(); outline(c);
  const open = 3.2 + bite * 1.6;
  c.fillStyle = '#250f12'; c.beginPath(); c.ellipse(20, -11, 2.4 + bite * 0.6, open, 0, 0, 7); c.fill();
  c.fillStyle = GB_BONE; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = 20 + Math.cos(a) * 2.6, y = -11 + Math.sin(a) * (open + 0.4); c.beginPath(); c.moveTo(x, y); c.lineTo(20 + Math.cos(a + 0.2) * 4, -11 + Math.sin(a + 0.2) * (open + 2.2)); c.lineTo(20 + Math.cos(a + 0.4) * 2.6, -11 + Math.sin(a + 0.4) * (open + 0.4)); c.fill(); }
  c.fillStyle = `rgba(${GB_SAC},0.95)`; c.beginPath(); c.arc(12.5, -15, 1.2, 0, 7); c.fill(); // eye
  // clawed forelimbs, digging
  for (const [o, near] of [[Math.PI, false], [0, true]]) {
    const s = Math.sin(ph * 1.2 + o), kx = 11 + s * 2.5, ky = -6, fx = 17 + s * 4, fy = -0.5;
    c.strokeStyle = near ? GB_FLESH[1] : GB_FLESH[2]; c.lineWidth = near ? 3.2 : 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(8, -9); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
    c.strokeStyle = GB_BONE; c.lineWidth = 1.2; for (const d of [-2, 0, 2]) { c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + 3.5, fy + d * 0.5 - 0.5); c.stroke(); }
  }
  c.lineCap = 'butt';
}

// Severance: a floating obsidian monolith with carved glyphs in team glow, a slowly turning ring and orbiting crystal
// shards; nothing touches the ground. u.anim drives the turn (cached as poses, SPR_SPIN)
function dSeverance(c, T, u) {
  const a = (u.anim || 0) * 0.9, bob = Math.sin((u.anim || 0) * 1.6) * 1.2, y0 = -14 + bob, rk = (u.recoil || 0) * 2;
  const shard = (k, back) => { const t = a * 1.4 + k * 2.094, x = Math.cos(t) * 15, y = y0 - 18 + Math.sin(t) * 4, z = Math.sin(t);
    if ((z < 0) !== back) return; c.fillStyle = lgrad(c, x - 2, y - 4, x + 2, y + 4, ['#e9ddff', '#8c74d8', '#2b2346']); poly(c, [[x, y - 4.5], [x + 2, y], [x, y + 4.5], [x - 2, y]]); c.fill(); outline(c, 0.6); };
  const ringArc = back => { c.strokeStyle = back ? `rgba(${T.glow},0.35)` : `rgba(${T.glow},0.9)`; c.lineWidth = back ? 1.2 : 1.8; c.beginPath(); c.ellipse(0, y0 - 20, 19, 5.5, 0, back ? Math.PI : 0, back ? 2 * Math.PI : Math.PI); c.stroke();
    if (!back) { c.fillStyle = T.light; for (let i = 0; i < 3; i++) { const t = a + i * 2.094; if (Math.sin(t) > 0) { c.beginPath(); c.arc(Math.cos(t) * 19, y0 - 20 + Math.sin(t) * 5.5, 1.3, 0, 7); c.fill(); } } } };
  shard(0, true); shard(1, true); shard(2, true); ringArc(true);
  // the slab: obsidian with a violet sheen, chipped corners
  c.fillStyle = lgrad(c, -8, 0, 8, 0, ['#3a2f55', '#14111f', '#0a0910']); poly(c, [[-7, y0], [-9, y0 - 10], [-7.5, y0 - 34], [-3, y0 - 40 - rk], [5, y0 - 38 - rk], [8.5, y0 - 30], [7, y0 - 4], [3, y0 + 2]]); c.fill(); outline(c);
  c.fillStyle = lgrad(c, 0, y0 - 40, 0, y0, [`rgba(${T.glow},0.35)`, `rgba(${T.glow},0.05)`]); poly(c, [[-7.5, y0 - 34], [-3, y0 - 40 - rk], [-1, y0 - 38], [-5, y0 - 12], [-7, y0]]); c.fill(); // team sheen on the lit face
  rim(c, -3, y0 - 40 - rk, 5, 'rgba(230,220,255,0.6)');
  // carved glyphs in team glow
  c.strokeStyle = `rgba(${T.glow},0.95)`; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(-2, y0 - 32); c.lineTo(2, y0 - 29); c.lineTo(-2, y0 - 26); c.moveTo(0, y0 - 22); c.lineTo(0, y0 - 16); c.moveTo(-3, y0 - 19); c.lineTo(3, y0 - 19); c.moveTo(-2.5, y0 - 11); c.lineTo(2.5, y0 - 8); c.stroke();
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.25)`; c.beginPath(); c.arc(0, y0 - 21, 6, 0, 7); c.fill(); c.fillStyle = 'rgba(220,200,255,0.9)'; c.beginPath(); c.arc(0, y0 - 21, 1.8, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  // thin lines of light holding it over the ground
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.18)`; c.beginPath(); c.ellipse(0, -1, 9, 2.6, 0, 0, 7); c.fill(); c.fillStyle = `rgba(${T.glow},0.35)`; c.beginPath(); c.ellipse(0, y0 + 3, 3, 1.2, 0, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; // its light on the ground below; nothing touches it
  ringArc(false); shard(0, false); shard(1, false); shard(2, false);
}

DRAW_U.artillery = dArt2; DRAW_U.gorebore = dGorebore; DRAW_U.severance = dSeverance;
Object.assign(SPR_BOX, { artillery: [-32, -40, 68, 44], gorebore: [-24, -24, 50, 26], severance: [-24, -62, 48, 64] });
Object.assign(SPR_STEP, { gorebore: [6, 8] });
const SPR_SPIN = { severance: [0.9, 10] }; // always turning, cut into poses
Object.assign(UVIS, { severance: { h: 54, w: 10 } });
const TEAM_EX = { main: '#a49cc0', light: '#e6e0fa', hull: '#4d4864', glow: '205,190,255', face: ['#c5bde0', '#8f88aa', '#6a6484'] }; // an exiled unit's washed-out colours
// The Artillery's deploy state as a share (0 packed, 1 deployed) at time t
function artK(u, t) {
  if (!u.dep) return 0;
  if (u.dep === 2) return 1;
  return u.dep === 1 ? clamp(1 - (u.dpT - t) / ART.deploy, 0, 1) : clamp((u.dpT - t) / ART.pack, 0, 1);
}

/* ---- effects ---- */
// A telegraphed shell's marker: a team-coloured ring on the ground the size of its blast, with an inner circle that shrinks
// and closes at impact (the ring follows the blast's shape: hits count across the lane at 0.6)
function drawMarks(c, g, lit) {
  if (!g.mk || !g.mk.length) return;
  for (const m of g.mk) {
    if (m.side !== 0 && !lit(m.u, m.v) && !g.spectate) continue;
    const w = P(m.u, m.v), rx = m.r, ry = m.r / 0.6 * DY, k = clamp((g.t - m.t0) / Math.max(0.1, m.t1 - m.t0), 0, 1), T = TEAM[m.side];
    c.fillStyle = `rgba(${T.glow},${0.08 + 0.12 * k})`; c.beginPath(); c.ellipse(w.x, w.y, rx, ry, 0, 0, 7); c.fill();
    c.strokeStyle = `rgba(${T.glow},${0.6 + 0.35 * k})`; c.lineWidth = 1.6; c.beginPath(); c.ellipse(w.x, w.y, rx, ry, 0, 0, 7); c.stroke();
    c.strokeStyle = `rgba(255,240,200,${0.5 + 0.4 * k})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(w.x, w.y, rx * (1 - k), ry * (1 - k), 0, 0, 7); c.stroke();
    c.strokeStyle = `rgba(${T.glow},0.8)`; c.lineWidth = 1; c.beginPath(); c.moveTo(w.x - 4, w.y); c.lineTo(w.x + 4, w.y); c.moveTo(w.x, w.y - 2.5); c.lineTo(w.x, w.y + 2.5); c.stroke();
  }
}
// Burrow trails: dirt mounds and cracks along where each burrowed Gorebore has been, lingering BORE.trail s (only where
// the viewer can see the ground)
const BTRAIL = new WeakMap(); // game → [{ u, v, t, side, id }]
function trailOf(g) { let a = BTRAIL.get(g); if (!a) { a = []; BTRAIL.set(g, a); } return a; }
function noteBurrow(g, u) {
  const a = trailOf(g); let last = null;
  for (let i = a.length - 1; i >= 0; i--) if (a[i].id === u.id) { last = a[i]; break; }
  if (!last || Math.hypot(last.u - u.u, last.v - u.v) > 7 || g.t - last.t > 0.5) a.push({ u: u.u, v: u.v, t: g.t, side: u.side, id: u.id, s: (u.id * 7 + a.length) % 5 });
}
function drawTrails(c, g, lit) {
  const a = BTRAIL.get(g); if (!a || !a.length) return;
  while (a.length && (g.t - a[0].t > BORE.trail || a[0].t > g.t)) a.shift();
  for (const p of a) {
    if (!lit(p.u, p.v)) continue;
    const k = 1 - (g.t - p.t) / BORE.trail, w = P(p.u, p.v), r = 4 + (p.s % 3);
    c.globalAlpha = 0.85 * k; c.fillStyle = '#5a4430'; c.beginPath(); c.ellipse(w.x, w.y, r * 1.4, r * 0.55, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#7d6142'; c.beginPath(); c.ellipse(w.x - 0.6, w.y - r * 0.2, r * 0.9, r * 0.35, 0, Math.PI, 0); c.fill();
    c.strokeStyle = '#2e2218'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(w.x - r * 1.6, w.y + 1); c.lineTo(w.x - r * 0.6, w.y + 0.2 + (p.s - 2) * 0.4); c.lineTo(w.x + r * 0.4, w.y + 1.2); c.stroke();
  }
  c.globalAlpha = 1;
}
// A burrowed Gorebore itself: a moving hump of churned earth with a faint glow pulsing through the cracks
function drawBurrowed(c, u, w, t) {
  const r = 9, k = 0.5 + 0.5 * Math.sin(t * 7 + u.id);
  c.fillStyle = '#4a3726'; c.beginPath(); c.ellipse(w.x, w.y, r * 1.5, r * 0.75, 0, Math.PI, 0); c.fill();
  c.fillStyle = '#6e5538'; c.beginPath(); c.ellipse(w.x + u.face * 2, w.y - 2, r * 0.9, r * 0.45, 0, Math.PI, 0); c.fill();
  c.strokeStyle = `rgba(${GB_SAC},${0.35 + 0.45 * k})`; c.lineWidth = 1.1; c.beginPath(); c.moveTo(w.x - 7, w.y - 1); c.lineTo(w.x - 2, w.y - 5); c.lineTo(w.x + 3, w.y - 2); c.lineTo(w.x + 8, w.y - 4); c.stroke();
  c.fillStyle = '#8a6a46'; for (let i = 0; i < 3; i++) { const q = ((t * 3 + i / 3 + u.id * 0.13) % 1); c.globalAlpha = 1 - q; c.fillRect(w.x + u.face * (6 + q * 6) - 1, w.y - 3 - Math.sin(q * Math.PI) * 6, 2, 2); }
  c.globalAlpha = 1;
}
// An eruption: a burst of dirt and bone spikes thrusting up through the ground, then settling
function drawErupt(c, f) {
  const k = f.t / f.life, out = Math.min(1, k * 3), fade = 1 - k, R = f.r || 45;
  c.globalAlpha = 0.6 * fade; c.strokeStyle = '#8a6a46'; c.lineWidth = 2.4; c.beginPath(); c.ellipse(f.x, f.y, R * out, R * out / 0.6 * DY, 0, 0, 7); c.stroke();
  c.globalAlpha = fade;
  for (let i = 0; i < 7; i++) { // bone spikes
    const a = i / 7 * Math.PI * 2 + 0.3, d = R * 0.45 * (0.4 + (i % 3) * 0.3), x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d * 0.4, h = (12 + (i % 3) * 5) * Math.sin(Math.min(1, k * 2.2) * Math.PI);
    if (h <= 0.5) continue;
    c.fillStyle = GB_BONE; c.beginPath(); c.moveTo(x - 2.2, y); c.lineTo(x + Math.cos(a) * 2, y - h); c.lineTo(x + 2.2, y); c.closePath(); c.fill(); outline(c, 0.6);
  }
  c.fillStyle = '#6e5538'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, d = R * 0.9 * out, x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d * 0.4 - Math.sin(out * Math.PI) * 16; c.fillRect(x - 1.5, y - 1.5, 3, 3); }
  c.globalAlpha = 1;
}
// The rift orb arriving: a violet-white flash with a team rim, collapsing inward
function drawRift(c, f) {
  const k = f.t / f.life, R = f.r || 45, T = TEAM[f.side];
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.violet, f.x, f.y - 6, R * (1 - k * 0.6), 0.9 * (1 - k)); c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1 - k; c.strokeStyle = `rgba(${T.glow},0.9)`; c.lineWidth = 2; c.beginPath(); c.ellipse(f.x, f.y, R * (1 - k * 0.5), R / 0.6 * DY * (1 - k * 0.5), 0, 0, 7); c.stroke();
  c.strokeStyle = '#efe6ff'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(f.x, f.y, R * k, R / 0.6 * DY * k, 0, 0, 7); c.stroke(); c.globalAlpha = 1;
}
function drawUnexile(c, f) { const k = f.t / f.life; c.globalAlpha = 1 - k; c.strokeStyle = RIFT; c.lineWidth = 1.6; c.beginPath(); c.ellipse(f.x, f.y - 10, 6 + k * 14, 8 + k * 16, 0, 0, 7); c.stroke(); c.globalAlpha = 1; }
// The orb in flight: a slow violet-white sphere with a team-coloured rim, and a faint ring where it will land
function drawOrb(c, g, p, b) {
  const T = TEAM[p.side], t = g.t, pul = 1 + 0.12 * Math.sin(t * 9);
  const w = P(p.tu, p.tv); c.globalAlpha = 0.35; c.strokeStyle = RIFT; c.lineWidth = 1; c.setLineDash([3, 4]); c.beginPath(); c.ellipse(w.x, w.y, SEVER.r, SEVER.r / 0.6 * DY, 0, 0, 7); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  const gp = P(p.u, p.v, 0); c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(gp.x, gp.y, 5, 2, 0, 0, 7); c.fill();
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.violet, b.x, b.y, 14 * pul, 0.75); c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#d8c8ff'; c.beginPath(); c.arc(b.x, b.y, 5 * pul, 0, 7); c.fill();
  c.strokeStyle = T.main; c.lineWidth = 1.8; c.beginPath(); c.arc(b.x, b.y, 5.6 * pul, 0, 7); c.stroke();
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(b.x - 1.4, b.y - 1.4, 1.8, 0, 7); c.fill();
}
// An exiled unit's mark (drawn over its washed-out body): a violet shimmer and a ring at its feet that shrinks as its exile runs out
function drawExiled(c, u, w, t) {
  const h = visH(u.type) * US, k = clamp((u.exT - t) / Math.max(0.1, u.exT - u.exS), 0, 1), y = w.y - u.z, r = Math.max(10, h * 0.6);
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.violet, w.x, y - h * 0.5, Math.max(12, h * 0.8) * (0.9 + 0.1 * Math.sin(t * 10 + u.id)), 0.3); c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 0.9; c.strokeStyle = RIFT; c.lineWidth = 1.8; c.beginPath(); c.ellipse(w.x, y, r * k + 2, (r * k + 2) * 0.38, 0, 0, 7); c.stroke();
  c.strokeStyle = 'rgba(230,220,255,0.6)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(w.x, y, r + 2, (r + 2) * 0.38, 0, 0, 7); c.stroke();
  for (let i = 0; i < 3; i++) { const q = (t * 0.8 + i / 3 + u.id * 0.21) % 1; c.globalAlpha = 0.7 * (1 - q); c.fillStyle = '#e6dcff'; c.fillRect(w.x + Math.sin(i * 2.1 + t * 3) * r * 0.6, y - q * h * 1.1, 1.4, 1.4); }
  c.globalAlpha = 1;
}
