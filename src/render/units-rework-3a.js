/* ---------- Faction rework art, batch 3a (v2.84; docs/FACTION_REWORK.md "Art direction") ----------
   Leaper (a lean Bloomhost parasite: long spring-loaded hind legs, hooked forelimbs, a sucker mouth ringed with teeth, a
   translucent sac abdomen that glows brighter in team colour as it feeds; latched it wraps onto its host's back, drawn on
   top of it), Riftstalker (a slim Axiarch assassin of floating obsidian segments, light-blade arms, shard wings),
   Parallax (a heavy duelist of thick floating obsidian plates, a halo crown, glyph-lit gauntlets) and Ravager (a hulking
   hunched brute, heavy team carapace, a huge jaw; each stack bigger, more spines, brighter glow; devouring it lunges head
   down onto the remains). All cached as poses (the Leaper's latch and feed level, the Ravager's stacks and its devour are
   poses too). Effects: the latch splat, hatching, the Riftstalker's blink streak with its fading afterimage, the swap's
   two mirrored rift flashes joined by a line of light, the Ravager's feeding motes and the remains piles. */
const LP_FLESH = ['#9c6b8a', '#6b3f5e', '#3c2236'], LP_BONE = '#f1e4cc';
const OBS = ['#3b3157', '#17131f', '#09080d']; // obsidian
// Leaper. u.lt: latched (wrapped, legs hooked down around the host's back); u.ltF 0-2: how much it has fed (the sac's glow)
function dLeaper3(c, T, u) {
  const lt = !!u.lt, f = Math.min(2, u.ltF || 0), ph = u.moving && !lt ? (u.anim || 0) * 12 : 0, s = Math.sin(ph) * 2, bite = (u.recoil || 0);
  const pulse = 0.7 + 0.3 * Math.sin((u.anim || 0) * (lt ? 9 : 3)), y0 = lt ? -3 : 0;
  c.lineCap = 'round'; c.lineJoin = 'round';
  const leg = (near, sw) => { // a spring-loaded hind leg: hip, high knee, ankle, long foot (coiled; latched: hooked down)
    const hx = -5, hy = y0 - 9, kx = lt ? -13 : -14 + sw, ky = lt ? y0 - 6 : -19, ax = lt ? -10 : -9 - sw * 0.5, ay = lt ? y0 + 3 : -5, fx = lt ? -4 : -16 + sw, fy = lt ? y0 + 5 : 0;
    c.strokeStyle = OUTL; c.lineWidth = near ? 4 : 3.4; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(ax, ay); c.lineTo(fx, fy); c.stroke();
    c.strokeStyle = near ? LP_FLESH[1] : LP_FLESH[2]; c.lineWidth = near ? 2.6 : 2.1; c.stroke();
    c.strokeStyle = near ? T.main : T.hull; c.lineWidth = 1.6; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + (kx - hx) * 0.7, hy + (ky - hy) * 0.7); c.stroke(); // team plate on the thigh
    c.strokeStyle = LP_BONE; c.lineWidth = 0.9; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + (lt ? 2 : -2.5), fy + (lt ? 1.5 : 0)); c.stroke(); // claw
  };
  const arm = (near, sw) => { // a hooked forelimb
    const sx = 5, sy = y0 - 11, ex = lt ? 10 : 11 + sw, ey = lt ? y0 - 3 : -7, hx = lt ? 8 : 14 + sw, hy = lt ? y0 + 4 : -12 - bite * 2;
    c.strokeStyle = OUTL; c.lineWidth = near ? 3.2 : 2.8; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
    c.strokeStyle = near ? LP_FLESH[1] : LP_FLESH[2]; c.lineWidth = near ? 2 : 1.7; c.stroke();
    c.strokeStyle = LP_BONE; c.lineWidth = 1.1; c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(hx + 3, hy - (lt ? -1 : 1), hx + 1.5, hy + (lt ? 3 : 2.5)); c.stroke(); // the hook
  };
  leg(false, -s); arm(false, s);
  // the sac abdomen: translucent, glowing in team colour (brighter as it feeds)
  const sa = 0.3 + 0.22 * f;
  c.fillStyle = `rgba(${T.glow},${sa})`; c.beginPath(); c.ellipse(-11, y0 - 11, 8, 6.4, -0.25, 0, 7); c.fill(); outline(c, 0.9);
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = `rgba(${T.glow},${(0.35 + 0.25 * f) * pulse})`; c.beginPath(); c.ellipse(-11.5, y0 - 10.5, 4.5 + f, 3.4 + f * 0.6, -0.25, 0, 7); c.fill();
  c.fillStyle = `rgba(255,255,255,${0.25 + 0.2 * f})`; c.beginPath(); c.arc(-13, y0 - 13, 1.4, 0, 7); c.fill();
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = 'rgba(40,10,30,0.45)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-17, y0 - 10); c.quadraticCurveTo(-11, y0 - 14, -5, y0 - 11); c.stroke(); // veins
  // thorax: lean, overlapping team carapace plates
  c.fillStyle = lgrad(c, 0, y0 - 16, 0, y0 - 6, [LP_FLESH[0], LP_FLESH[2]]); c.beginPath(); c.ellipse(1, y0 - 10.5, 7.5, 4.2, -0.1, 0, 7); c.fill(); outline(c, 0.9);
  for (let i = 0; i < 3; i++) {
    const x = -5 + i * 4.3, top = y0 - 15.2 + Math.abs(i - 1) * 0.6;
    c.fillStyle = lgrad(c, 0, top, 0, y0 - 9, [T.light, T.main, T.hull]);
    c.beginPath(); c.moveTo(x - 0.5, y0 - 9.5); c.quadraticCurveTo(x, top - 0.8, x + 3, top - 0.6); c.quadraticCurveTo(x + 5.5, top + 0.5, x + 5, y0 - 10); c.closePath(); c.fill(); outline(c, 0.7);
  }
  rim(c, -4, y0 - 15.6, 6, 'rgba(255,255,255,0.4)');
  // head: a sucker mouth ringed with teeth, two glowing eyes
  const hx = 10, hy = y0 - 12;
  c.fillStyle = lgrad(c, hx, hy - 4, hx, hy + 4, [LP_FLESH[0], LP_FLESH[2]]); c.beginPath(); c.ellipse(hx, hy, 4.4, 3.6, 0, 0, 7); c.fill(); outline(c, 0.8);
  const mx = hx + 4.2, open = 1.7 + bite * 0.8 + (lt ? 0.6 * pulse : 0);
  c.fillStyle = '#2a0c1c'; c.beginPath(); c.ellipse(mx, hy + 0.5, 1.4, open, 0, 0, 7); c.fill();
  c.fillStyle = LP_BONE; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r0 = open + 0.2; c.beginPath(); c.moveTo(mx + Math.cos(a) * 1.4, hy + 0.5 + Math.sin(a) * r0); c.lineTo(mx + Math.cos(a + 0.22) * 2.7, hy + 0.5 + Math.sin(a + 0.22) * (r0 + 1.3)); c.lineTo(mx + Math.cos(a + 0.45) * 1.4, hy + 0.5 + Math.sin(a + 0.45) * r0); c.fill(); }
  c.fillStyle = `rgba(${T.glow},1)`; c.beginPath(); c.arc(hx + 1, hy - 1.8, 0.95, 0, 7); c.arc(hx - 1.4, hy - 1.4, 0.75, 0, 7); c.fill();
  if (lt) { c.fillStyle = 'rgba(190,40,60,0.75)'; for (const [x, y] of [[mx + 1, hy + 3], [mx - 0.5, hy + 4.5]]) { c.beginPath(); c.arc(x, y, 0.8, 0, 7); c.fill(); } } // feeding: drool
  leg(true, s); arm(true, -s);
  c.lineCap = 'butt';
}

// Riftstalker: floating obsidian segments held by thin lines of light; two light-blade arms; shard wings
function dRift3(c, T, u) {
  const t = u.anim || 0, y0 = -6 + hov(u, u.moving ? 8 : 2.5), sl = (u.recoil || 0) * 5, lean = u.moving ? 2 : 0;
  const seg = (pts, lit) => { c.fillStyle = lgrad(c, pts[0][0], pts[0][1], pts[2][0], pts[2][1], lit ? [T.light, T.main, T.hull] : [OBS[0], OBS[1], OBS[2]]); poly(c, pts); c.fill(); outline(c, 0.8); };
  // shard wings behind (team glow along their edges)
  for (const [a, l] of [[-2.2, 15], [-2.6, 13], [-1.85, 11]]) {
    const bx = -3, by = y0 - 24, tx = bx + Math.cos(a) * l, ty = by + Math.sin(a) * l * 0.9 + Math.sin(t * 3 + a) * 0.8;
    c.fillStyle = lgrad(c, bx, by, tx, ty, ['#2b2442', '#0c0a12']); poly(c, [[bx, by], [tx, ty], [bx + Math.cos(a + 0.35) * l * 0.55, by + Math.sin(a + 0.35) * l * 0.5]]); c.fill(); outline(c, 0.6);
    c.strokeStyle = `rgba(${T.glow},0.75)`; c.lineWidth = 0.8; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
  }
  // the back blade
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = `rgba(${RIFTA},0.45)`; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-2, y0 - 20); c.lineTo(-7 + sl * 0.3, y0 - 8); c.stroke();
  c.strokeStyle = 'rgba(240,230,255,0.8)'; c.lineWidth = 1; c.stroke();
  c.globalCompositeOperation = 'source-over';
  // lines of light between the segments
  c.strokeStyle = `rgba(${T.glow},0.8)`; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(lean + 3, y0 - 29); c.lineTo(lean + 1, y0 - 25); c.moveTo(1, y0 - 17); c.lineTo(0, y0 - 13); c.moveTo(-1, y0 - 9); c.lineTo(-2, y0 - 4); c.moveTo(1, y0 - 9); c.lineTo(3, y0 - 4); c.stroke();
  // legs: two tapering floating shards
  seg([[-3.5, y0 - 8], [-1, y0 - 8], [-2.4, y0 + 1]], false); seg([[1.5, y0 - 8], [4.5, y0 - 8], [3.6, y0 + 1]], false);
  // pelvis, torso (two plates, the front one in team colour), head
  seg([[-3, y0 - 13], [3.5, y0 - 13.5], [2, y0 - 9], [-2, y0 - 9]], false);
  seg([[-4 + lean, y0 - 25], [2 + lean, y0 - 26], [3, y0 - 17], [-3, y0 - 16]], false);
  seg([[0 + lean, y0 - 25.5], [5 + lean, y0 - 24], [4, y0 - 18], [0.5, y0 - 17]], true);
  rim(c, -3.5 + lean, y0 - 25.4, 2 + lean, 'rgba(230,220,255,0.6)');
  seg([[1.5 + lean, y0 - 34], [6 + lean, y0 - 31], [4.5 + lean, y0 - 28], [1 + lean, y0 - 29]], false);
  c.fillStyle = `rgba(${T.glow},1)`; c.fillRect(4 + lean, y0 - 31.5, 2.2, 1); // visor slit
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},0.35)`; c.beginPath(); c.arc(5 + lean, y0 - 31, 2.6, 0, 7); c.fill();
  // the front light blade (strikes forward on recoil)
  c.strokeStyle = `rgba(${RIFTA},0.55)`; c.lineWidth = 3.4; c.beginPath(); c.moveTo(3 + lean, y0 - 22); c.lineTo(15 + sl, y0 - 12 - sl * 0.4); c.stroke();
  c.strokeStyle = 'rgba(250,245,255,0.95)'; c.lineWidth = 1.1; c.stroke();
  c.fillStyle = `rgba(${T.glow},0.9)`; c.beginPath(); c.arc(3 + lean, y0 - 22, 1.3, 0, 7); c.fill();
  c.globalCompositeOperation = 'source-over'; c.lineCap = 'butt';
  c.fillStyle = `rgba(${RIFTA},0.22)`; c.beginPath(); c.ellipse(0, -0.5, 7, 1.8, 0, 0, 7); c.fill(); // its light on the ground
}

// Parallax: thick floating obsidian plates, a halo crown, glyph-lit gauntlets (the front one swings on recoil)
function dPara3(c, T, u) {
  const t = u.anim || 0, y0 = -7 + hov(u, u.moving ? 6 : 2), sw = (u.recoil || 0);
  const plate = (pts, lit) => { c.fillStyle = lgrad(c, pts[0][0], pts[0][1], pts[2][0], pts[2][1], lit ? [T.light, T.main, T.hull] : [OBS[0], OBS[1], OBS[2]]); poly(c, pts); c.fill(); outline(c, 0.9); };
  const glyph = (x, y, k) => { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},${0.3 + 0.2 * k})`; c.beginPath(); c.arc(x, y, 4.2, 0, 7); c.fill(); c.strokeStyle = `rgba(${T.glow},0.95)`; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - 1.6, y - 1.6); c.lineTo(x + 1.6, y); c.lineTo(x - 1.6, y + 1.6); c.moveTo(x + 0.4, y - 2.2); c.lineTo(x + 0.4, y + 2.2); c.stroke(); c.globalCompositeOperation = 'source-over'; };
  c.fillStyle = `rgba(${RIFTA},0.25)`; c.beginPath(); c.ellipse(0, -0.5, 13, 2.8, 0, 0, 7); c.fill();
  // back gauntlet
  plate([[-13, y0 - 22], [-7, y0 - 23], [-6, y0 - 15], [-12, y0 - 14]], false); glyph(-9.5, y0 - 18.5, 0.5);
  // lines of light
  c.strokeStyle = `rgba(${T.glow},0.75)`; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(-7, y0 - 20); c.lineTo(-5, y0 - 24); c.moveTo(0, y0 - 37); c.lineTo(0, y0 - 34); c.moveTo(-3, y0 - 11); c.lineTo(-4, y0 - 6); c.moveTo(3, y0 - 11); c.lineTo(4, y0 - 6); c.moveTo(7, y0 - 23); c.lineTo(9, y0 - 20); c.stroke();
  // legs: two thick floating plates
  plate([[-7, y0 - 7], [-1, y0 - 7], [-2, y0 + 1], [-7.5, y0 + 1]], false); plate([[1, y0 - 7], [7, y0 - 7], [7.5, y0 + 1], [2, y0 + 1]], false);
  // waist, chest (a great team plate over obsidian), pauldrons
  plate([[-6, y0 - 13], [6, y0 - 13], [5, y0 - 8], [-5, y0 - 8]], false);
  plate([[-9, y0 - 32], [9, y0 - 32], [7, y0 - 15], [-7, y0 - 15]], false);
  plate([[-6, y0 - 31], [7.5, y0 - 31], [5.5, y0 - 17], [-4.5, y0 - 17]], true);
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(0.5, y0 - 31); c.lineTo(0.5, y0 - 17); c.stroke();
  rim(c, -8.5, y0 - 32, 8.5, 'rgba(230,220,255,0.55)');
  plate([[-11, y0 - 34], [-5, y0 - 35], [-4, y0 - 29], [-10, y0 - 28]], false); plate([[5, y0 - 35], [11, y0 - 34], [10, y0 - 28], [4, y0 - 29]], false);
  // head and its halo crown
  plate([[-3, y0 - 41], [3.5, y0 - 41], [3, y0 - 35.5], [-2.5, y0 - 35.5]], false);
  c.fillStyle = `rgba(${T.glow},1)`; c.fillRect(0.5, y0 - 39, 2.8, 1.1);
  const hy = y0 - 46 + Math.sin(t * 2) * 0.6;
  c.strokeStyle = `rgba(${T.glow},0.35)`; c.lineWidth = 2.6; c.beginPath(); c.ellipse(0, hy, 7.5, 2.2, 0, 0, 7); c.stroke();
  c.strokeStyle = `rgba(255,248,220,0.9)`; c.lineWidth = 1; c.stroke();
  c.fillStyle = T.light; for (let i = 0; i < 5; i++) { const a = Math.PI + i * Math.PI / 4, x = Math.cos(a) * 7.5, y = hy + Math.sin(a) * 2.2; c.beginPath(); c.moveTo(x - 0.9, y); c.lineTo(x, y - 3); c.lineTo(x + 0.9, y); c.fill(); }
  // front gauntlet: a heavy fist with a glowing glyph, swung forward on a blow
  const gx = 10 + sw * 5, gy = y0 - 19 - sw * 2;
  plate([[gx - 4, gy - 5], [gx + 4, gy - 5.5], [gx + 5, gy + 4], [gx - 3, gy + 4.5]], false); glyph(gx + 0.5, gy - 0.5, 1);
  if (sw > 0.3) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${RIFTA},${sw * 0.8})`; c.lineWidth = 2; c.beginPath(); c.arc(gx - 6, gy, 12, -0.9, 0.9); c.stroke(); c.globalCompositeOperation = 'source-over'; }
}

// Ravager. u.rvS 0-3: its stacks (bigger, more spines, brighter glow); u.dvT: devouring (it lunges head down, jaw wide)
const RV_FLESH = ['#8a5560', '#5a313b', '#331a21'], RV_BONE = '#ecdfc4';
function dRav3(c, T, u) {
  const n = Math.min(3, u.rvS || 0), sc = 1 + 0.13 * n, dv = !!u.dvT, ph = u.moving && !dv ? (u.anim || 0) * 8 : 0, s = Math.sin(ph) * 2.2, bite = (u.recoil || 0);
  const glow = 0.45 + 0.18 * n, pulse = 0.8 + 0.2 * Math.sin((u.anim || 0) * 4);
  c.save(); c.scale(sc, sc);
  if (dv) { c.translate(4, 0); c.rotate(0.32); c.translate(-4, 0); } // the lunge: pitched forward over the pile
  c.lineCap = 'round'; c.lineJoin = 'round';
  const leg = (x, o, near) => { const sw = Math.sin(ph + o) * 3; c.strokeStyle = OUTL; c.lineWidth = near ? 6 : 5; c.beginPath(); c.moveTo(x, -12); c.lineTo(x - 3 + sw * 0.5, -6); c.lineTo(x + sw, 0); c.stroke(); c.strokeStyle = near ? RV_FLESH[1] : RV_FLESH[2]; c.lineWidth = near ? 4.4 : 3.6; c.stroke();
    c.strokeStyle = RV_BONE; c.lineWidth = 1; c.beginPath(); c.moveTo(x + sw, 0); c.lineTo(x + sw + 3, 0.3); c.stroke(); };
  const arm = (near, o) => { const sw = dv ? 2 : Math.sin(ph + o) * 2 - bite * 3; c.strokeStyle = OUTL; c.lineWidth = near ? 6 : 5; c.beginPath(); c.moveTo(6, -20); c.lineTo(12 + sw, -11); c.lineTo(17 + sw, -3); c.stroke(); c.strokeStyle = near ? RV_FLESH[0] : RV_FLESH[2]; c.lineWidth = near ? 4.2 : 3.4; c.stroke();
    c.strokeStyle = RV_BONE; c.lineWidth = 1.4; for (const d of [-2, 0, 2]) { c.beginPath(); c.moveTo(17 + sw, -3); c.quadraticCurveTo(20 + sw, -3 + d, 19 + sw, 0 + d * 0.5); c.stroke(); } };
  leg(-8, Math.PI, false); leg(3, 0, false); arm(false, Math.PI);
  // belly and flank
  c.fillStyle = lgrad(c, 0, -26, 0, -6, [RV_FLESH[0], RV_FLESH[1], RV_FLESH[2]]); c.beginPath(); c.ellipse(-2, -15, 14, 9, -0.15, 0, 7); c.fill(); outline(c);
  // glow sacs (brighter with stacks)
  c.globalCompositeOperation = 'lighter';
  for (const [x, y, r] of [[-11, -12, 2.2], [-5, -10, 2.6], [1, -10, 2.1]]) { c.fillStyle = `rgba(${T.glow},${glow * 0.45 * pulse})`; c.beginPath(); c.arc(x, y, r * 2, 0, 7); c.fill(); c.fillStyle = `rgba(${T.glow},${Math.min(1, glow + 0.2) * pulse})`; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  c.globalCompositeOperation = 'source-over';
  // the hunched carapace: four heavy overlapping team plates
  for (let i = 0; i < 4; i++) {
    const x = -16 + i * 6.5, w = 10 + i * 0.4, top = -27 - Math.sin(i * 0.95 + 0.3) * 5;
    c.fillStyle = lgrad(c, 0, top - 2, 0, -14, [T.light, T.main, T.hull]);
    c.beginPath(); c.moveTo(x - 1, -14); c.quadraticCurveTo(x - 1, top, x + w * 0.5, top - 1.2); c.quadraticCurveTo(x + w + 1, top + 1, x + w, -15); c.closePath(); c.fill(); outline(c, 1);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x + 1, top + 1); c.quadraticCurveTo(x + w * 0.5, top - 0.6, x + w - 1, top + 1.2); c.stroke();
  }
  // spines along the back: 3, then 2 more per stack
  const ns = 3 + 2 * n;
  for (let i = 0; i < ns; i++) {
    const q = (i + 0.5) / ns, x = -15 + q * 24, top = -27 - Math.sin(q * 3.2) * 5.5, h = 4 + Math.sin(q * 3.2) * 3 + n * 0.6;
    c.fillStyle = lgrad(c, x, top - h, x, top, [RV_BONE, '#a8957a']); poly(c, [[x - 1.3, top + 1], [x - 0.6 - h * 0.25, top - h], [x + 1.3, top + 0.6]]); c.fill(); outline(c, 0.6);
  }
  // head: a heavy skull with a huge jaw (wide open when it bites or devours)
  const jaw = dv ? 0.55 : 0.12 + bite * 0.35;
  c.fillStyle = lgrad(c, 0, -26, 0, -12, [RV_FLESH[0], RV_FLESH[2]]); c.beginPath(); c.ellipse(13, -19, 8, 6.5, 0.1, 0, 7); c.fill(); outline(c);
  c.fillStyle = lgrad(c, 0, -26, 0, -18, [T.light, T.main]); c.beginPath(); c.ellipse(12, -23, 6.5, 3, 0.1, Math.PI, 0); c.fill(); outline(c, 0.8); // brow plate
  c.save(); c.translate(10, -16); c.rotate(jaw);
  c.fillStyle = lgrad(c, 0, 0, 0, 7, [RV_FLESH[1], RV_FLESH[2]]); poly(c, [[-2, -1], [14, 0], [13, 4.5], [0, 6]]); c.fill(); outline(c, 0.9); // the lower jaw
  c.fillStyle = RV_BONE; for (let i = 0; i < 5; i++) { const x = 2 + i * 2.6; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 0.9, -2.6); c.lineTo(x + 1.8, 0); c.fill(); }
  c.restore();
  c.fillStyle = '#2a0d14'; poly(c, [[11, -16.5], [22, -17], [20, -14.5]]); c.fill();
  c.fillStyle = RV_BONE; for (let i = 0; i < 5; i++) { const x = 12 + i * 2.2; c.beginPath(); c.moveTo(x, -17); c.lineTo(x + 0.8, -14.6); c.lineTo(x + 1.6, -17); c.fill(); } // upper teeth
  c.fillStyle = `rgba(${T.glow},1)`; c.beginPath(); c.arc(15.5, -21, 1.1, 0, 7); c.arc(12.5, -21.4, 0.9, 0, 7); c.fill();
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${T.glow},${0.25 + 0.1 * n})`; c.beginPath(); c.arc(14.5, -21, 3.2, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  if (dv) { c.fillStyle = 'rgba(170,30,45,0.8)'; for (const [x, y] of [[20, -12], [18, -9], [21.5, -8]]) { c.beginPath(); c.arc(x, y, 1, 0, 7); c.fill(); } }
  leg(-4, 0.5, true); leg(6, Math.PI + 0.5, true); arm(true, 0);
  c.lineCap = 'butt';
  c.restore();
}

DRAW_U.leaper = dLeaper3; DRAW_U.riftstalker = dRift3; DRAW_U.parallax = dPara3; DRAW_U.ravager = dRav3;
Object.assign(SPR_BOX, { leaper: [-22, -26, 42, 34], riftstalker: [-20, -44, 42, 48], parallax: [-18, -62, 42, 66], ravager: [-28, -62, 68, 74] });
Object.assign(UVIS, { leaper: { h: 18, w: 11 }, riftstalker: { h: 34, w: 9 }, parallax: { h: 44, w: 12 }, ravager: { h: 32, w: 17 } });
// The Ravager's drawn height with its stacks (health bar, shadow)
const rvScale = u => u.type === 'ravager' && u.rvS ? 1 + 0.13 * Math.min(3, u.rvS) : 1;
// A latched Leaper is drawn on its host's back: how high (art units on screen)
const RIDE = new WeakMap(); // render only: each latched Leaper's place along its host's back (-1 … 1)
function latchLift(g, u) { const H = u.lt && ctlEnt(g, u.lt); return H ? visH(H.type) * US * (H.type === 'tank' || H.type === 'flame' ? 0.62 : 0.55) : 0; }

/* ---- effects ---- */
// Remains: a small pile that fades over its life (organic for Bloomhost, wreckage for Last Fist, shards for Axiarchs);
// one being devoured shrinks as it is eaten
function drawRemains(c, g, lit) {
  if (!g.rem || !g.rem.length) return;
  const t = g.t;
  for (const r of g.rem) {
    if (!lit(r.u, r.v)) continue;
    const w = P(r.u, r.v, 0), age = t - r.t0, left = r.t1 - t, a = clamp(Math.min(age / 0.3, left / 2, 1), 0, 1) * 0.95;
    let k = r.sz === 3 ? 2 : r.sz === 2 ? 1.65 : 1.35;
    if (r.by) { const R = ctlEnt(g, r.by); if (R && R.dvT) k *= clamp((R.dvT - t) / RAV.eat, 0.15, 1); }
    if (a <= 0.02) continue;
    c.save(); c.globalAlpha = a; c.translate(w.x, w.y); c.scale(US * k, US * k);
    const seed = r.id * 7.13;
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 0.5, 10, 2.6, 0, 0, 7); c.fill();
    if (r.fac === 'bloomhost') { // flesh and carapace, a pool of ichor
      c.fillStyle = 'rgba(120,170,60,0.45)'; c.beginPath(); c.ellipse(1, 0.5, 9, 2.4, 0, 0, 7); c.fill();
      for (let i = 0; i < 4; i++) { const x = Math.sin(seed + i * 2.1) * 5, y = -1.5 - (i % 2) * 1.5; c.fillStyle = lgrad(c, x, y - 3, x, y + 2, [RV_FLESH[0], RV_FLESH[2]]); c.beginPath(); c.ellipse(x, y, 3.2 - i * 0.3, 2.2, Math.sin(seed + i), 0, 7); c.fill(); outline(c, 0.6); }
      c.fillStyle = TEAM[r.side].main; c.beginPath(); c.ellipse(-2, -3.2, 3, 1.4, -0.4, Math.PI, 0); c.fill(); outline(c, 0.5);
      c.strokeStyle = RV_BONE; c.lineWidth = 0.9; c.beginPath(); c.moveTo(2, -2); c.lineTo(5, -4.5); c.moveTo(-4, -1); c.lineTo(-6.5, -3); c.stroke();
    } else if (r.fac === 'axiarchs') { // shattered obsidian shards, a fading glyph light
      for (let i = 0; i < 5; i++) { const x = Math.sin(seed + i * 1.7) * 6, h = 2.5 + (i % 3) * 1.3; c.fillStyle = lgrad(c, x, -h, x, 0, [OBS[0], OBS[2]]); poly(c, [[x - 1.5, 0], [x + Math.sin(seed + i) * 1.2, -h], [x + 1.5, 0]]); c.fill(); outline(c, 0.5); }
      c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${TEAM[r.side].glow},${0.35 * clamp(left / RAV.life, 0, 1)})`; c.beginPath(); c.ellipse(0, -0.5, 5, 1.6, 0, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
    } else { // wreckage: twisted plates, a wheel, a smoking scrap heap
      c.fillStyle = OLIVE[2]; poly(c, [[-7, 0], [-4, -3.5], [2, -2.5], [6, 0]]); c.fill(); outline(c, 0.6);
      c.fillStyle = TEAM[r.side].hull; poly(c, [[-3, -2.5], [1, -5.5], [4, -3], [1, -1.5]]); c.fill(); outline(c, 0.5);
      c.fillStyle = STEEL[2]; c.beginPath(); c.arc(4.5, -1.6, 1.8, 0, 7); c.fill(); outline(c, 0.5);
      c.fillStyle = `rgba(80,80,88,${0.4 * clamp(left / RAV.life, 0, 1)})`; c.beginPath(); c.arc(-1 + Math.sin(t * 2 + seed) * 0.8, -8 - (age * 3) % 4, 2.4, 0, 7); c.fill();
    }
    c.restore();
  }
}
// A Leaper latching on: a splash of its colour and grip marks
function drawLatchFx(c, f) {
  const k = f.t / f.life, T = TEAM[f.side];
  c.globalAlpha = 1 - k; c.strokeStyle = T.main; c.lineWidth = 2;
  c.beginPath(); c.ellipse(f.x, f.y, 6 + k * 14, (6 + k * 14) * 0.5, 0, 0, 7); c.stroke();
  c.fillStyle = 'rgba(200,60,80,0.9)'; for (let i = 0; i < 5; i++) { const a = i * 1.26, r = 4 + k * 12; c.beginPath(); c.arc(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.5 - k * 4, 1.4 * (1 - k), 0, 7); c.fill(); }
  c.globalAlpha = 1;
}
// Skitterlings hatching from a dead host: a burst of goo
function drawHatchFx(c, f) {
  const k = f.t / f.life;
  c.globalAlpha = 1 - k;
  c.fillStyle = `rgba(${TEAM[f.side].glow},0.35)`; c.beginPath(); c.ellipse(f.x, f.y, 10 + k * 16, (10 + k * 16) * 0.45, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(150,210,80,0.95)'; for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.3, r = 3 + k * 18; c.beginPath(); c.arc(f.x + Math.cos(a) * r, f.y - Math.abs(Math.sin(a)) * r * 0.7 - (1 - (1 - k) * (1 - k)) * 6, 1.8 * (1 - k * 0.6), 0, 7); c.fill(); }
  c.globalAlpha = 1;
}
// A Riftstalker's blink: a violet-white streak from where it was to where it is, and a fading afterimage where it was
function drawRsBlink(c, f) {
  const k = f.t / f.life, T = TEAM[f.side];
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  const g = c.createLinearGradient(f.x, f.y, f.x2, f.y2); g.addColorStop(0, `rgba(${RIFTA},0)`); g.addColorStop(0.6, `rgba(${RIFTA},${0.7 * (1 - k)})`); g.addColorStop(1, `rgba(255,250,255,${1 - k})`);
  c.strokeStyle = g; c.lineWidth = 5 * (1 - k * 0.6); c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.stroke();
  c.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`; c.lineWidth = 1.4; c.stroke();
  stamp(c, GLOW.violet, f.x2, f.y2, 12 * (1 - k * 0.5), 0.8 * (1 - k));
  c.globalCompositeOperation = 'source-over'; c.lineCap = 'butt';
  // the afterimage: its silhouette in violet, fading and drifting up
  c.save(); c.globalAlpha = 0.6 * (1 - k); c.translate(f.x, f.y + 12 * US - k * 4); c.scale(US * (f.x2 >= f.x ? 1 : -1), US);
  dRift3(c, { main: RIFT, light: '#efe6ff', hull: '#5b3f99', glow: RIFTA }, { anim: 0, moving: false, recoil: 0 });
  c.restore(); c.globalAlpha = 1;
  if (f.home) { c.strokeStyle = `rgba(${T.glow},${1 - k})`; c.lineWidth = 1.6; c.beginPath(); c.ellipse(f.x2, f.y2 + 12 * US, 10 + k * 10, (10 + k * 10) * 0.4, 0, 0, 7); c.stroke(); } // arrived home: a ring
}
// The Parallax swap: two mirrored rift flashes, joined for a moment by a line of light
function drawSwapFx(c, f) {
  const k = f.t / f.life, a = 1 - k, T = TEAM[f.side];
  c.globalCompositeOperation = 'lighter';
  for (const [x, y] of [[f.x, f.y], [f.x2, f.y2]]) {
    stamp(c, GLOW.violet, x, y - 16, 22 * (0.6 + k * 0.6), 0.8 * a);
    c.strokeStyle = `rgba(${RIFTA},${0.9 * a})`; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y - 16, 6 + k * 5, 18 * (1 - k * 0.4), 0, 0, 7); c.stroke();
    c.strokeStyle = `rgba(${T.glow},${0.8 * a})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y, 12 + k * 8, (12 + k * 8) * 0.38, 0, 0, 7); c.stroke();
  }
  if (k < 0.55) { const q = 1 - k / 0.55; c.lineCap = 'round'; c.strokeStyle = `rgba(${RIFTA},${0.6 * q})`; c.lineWidth = 4; c.beginPath(); c.moveTo(f.x, f.y - 16); c.lineTo(f.x2, f.y2 - 16); c.stroke(); c.strokeStyle = `rgba(255,250,255,${q})`; c.lineWidth = 1.3; c.stroke(); c.lineCap = 'butt'; }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
// A Ravager's feed done: motes streaming in and its stack pips
function drawDevour3(c, f) {
  const k = f.t / f.life;
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) { const q = clamp(k * 1.5 - i * 0.07, 0, 1), a = i * 0.9, r = 18 * (1 - q); stamp(c, GLOW.acid, f.x + Math.cos(a) * r, f.y + 4 - Math.sin(a) * r * 0.4 - q * 10, 4, (1 - q) * 0.9); }
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1 - k; c.fillStyle = TEAM[f.side].main; c.strokeStyle = OUTL; c.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) { const x = f.x - 7 + i * 7, y = f.y - 30 - k * 10; c.beginPath(); c.arc(x, y, 2.3, 0, 7); if (i < f.n) c.fill(); c.stroke(); }
  c.globalAlpha = 1;
}
