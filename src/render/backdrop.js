/* ---------- Backdrop: sky, mountains and the ground plane ---------- */
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let BG; const mapBackdrop = () => { BG = (() => {
  const R = mulberry(11), stars = [], blobs = [], tufts = [], rocks = [], craters = [];
  for (let i = 0; i < 130; i++) stars.push({ x: R(), y: R(), r: R() * 1.1 + 0.3, a: R() * 0.6 + 0.3, tw: R() * 6 });
  const cols = ['rgba(70,120,80,0.22)', 'rgba(60,105,72,0.18)', 'rgba(8,12,18,0.28)', 'rgba(120,104,84,0.12)', 'rgba(84,140,96,0.14)'];
  for (let i = 0; i < 150; i++) blobs.push({ u: GU0 + R() * (GU1 - GU0), v: GV0 + 20 + R() * (GV1 - GV0 - 20), r: 40 + R() * 130, col: cols[(R() * cols.length) | 0] });
  for (let i = 0; i < 2200; i++) tufts.push({ u: GU0 + R() * (GU1 - GU0), v: GV0 + 6 + R() * (GV1 - GV0 - 6), h: 2.5 + R() * 4, a: 0.2 + R() * 0.45, g: R() < 0.5 });
  for (let i = 0; i < 70; i++) rocks.push({ u: GU0 + R() * (GU1 - GU0), v: GV0 + 30 + R() * (GV1 - GV0 - 30), r: 1.5 + R() * 4.5 });
  for (let i = 0; i < 9; i++) craters.push({ u: 420 + R() * (L - 840), v: -150 + R() * 300, r: 14 + R() * 20 });
  const ridge = (seed, amp, base) => {
    const r = mulberry(seed), pts = [];
    for (let x = -1600; x <= L + 1600; x += 30) pts.push([x, -(base + amp * (0.5 + 0.5 * Math.sin(x * 0.006 + r() * 0.6)) * (0.6 + 0.4 * Math.sin(x * 0.017)) + r() * amp * 0.18)]);
    return pts;
  };
  return { stars, blobs, tufts, rocks, craters, far: ridge(3, 85, 18), near: ridge(9, 34, 4) };
})(); };
mapBackdrop(); MAP_HOOKS.push(mapBackdrop); // v2.65: per map (the ground's size)

function drawGround(c) {
  const A = gp(GU0, GV0), B = gp(GU1, GV0), C = gp(GU1, GV1), D = gp(GU0, GV1);
  c.save();
  poly(c, [A, B, C, D]); c.clip();
  const tg = c.createLinearGradient(0, A[1], 0, C[1]);
  tg.addColorStop(0, '#2a2a4c'); tg.addColorStop(0.1, '#232c40'); tg.addColorStop(0.3, '#1f2e2d'); tg.addColorStop(0.65, '#182523'); tg.addColorStop(1, '#0d1413');
  c.fillStyle = tg; c.fillRect(GB.x0, GB.y0, GB.x1 - GB.x0, GB.y1 - GB.y0);
  for (const p of BG.blobs) {
    const [x, y] = gp(p.u, p.v);
    c.save(); c.translate(x, y); c.scale(1, DY);
    const rg = c.createRadialGradient(0, 0, 0, 0, 0, p.r);
    rg.addColorStop(0, p.col); rg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = rg; c.beginPath(); c.arc(0, 0, p.r, 0, 7); c.fill(); c.restore();
  }
  if (MAP_LANED) drawLaneTracks(c); // v2.65: each lane's worn track
  else { // worn track between the bases
    const r0 = -138 * DY, r1 = 138 * DY, lg = c.createLinearGradient(0, r0, 0, r1);
    lg.addColorStop(0, 'rgba(150,135,110,0)'); lg.addColorStop(0.18, 'rgba(150,135,110,0.07)'); lg.addColorStop(0.82, 'rgba(150,135,110,0.07)'); lg.addColorStop(1, 'rgba(150,135,110,0)');
    c.fillStyle = lg; c.fillRect(GB.x0, r0, GB.x1 - GB.x0, r1 - r0);
  }
  for (const k of BG.craters) {
    const [x, y] = gp(k.u, k.v);
    c.fillStyle = 'rgba(6,8,14,0.4)'; c.beginPath(); c.ellipse(x, y, k.r, k.r * DY, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(160,160,200,0.14)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y + 1, k.r, k.r * DY, 0, 0.1, Math.PI - 0.1); c.stroke();
  }
  for (const t of BG.tufts) {
    const [x, y] = gp(t.u, t.v), k = 0.5 + 0.5 * (t.v - GV0) / (GV1 - GV0), h = t.h * k;
    c.strokeStyle = t.g ? '#4f7d5b' : '#3c6650'; c.globalAlpha = t.a; c.lineWidth = 0.9 * k + 0.3;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1.5 * k, y - h); c.moveTo(x, y); c.lineTo(x + 1.3 * k, y - h * 0.8); c.moveTo(x, y); c.lineTo(x + 0.2, y - h * 1.15); c.stroke();
  }
  c.globalAlpha = 1;
  for (const r of BG.rocks) {
    const [x, y] = gp(r.u, r.v), k = 0.6 + 0.6 * (r.v - GV0) / (GV1 - GV0), s = r.r * k;
    c.fillStyle = '#0b0f17'; c.beginPath(); c.ellipse(x, y, s * 1.5, s * 0.6, 0, 0, 7); c.fill();
    c.fillStyle = '#3c4258'; c.beginPath(); c.ellipse(x - s * 0.3, y - s * 0.3, s, s * 0.45, 0, 0, 7); c.fill();
  }
  for (let s = 0; s < 2; s++) {
    const [x, y] = gp(hqU(s), 0);
    c.save(); c.translate(x, y); c.scale(1, DY);
    const rg = c.createRadialGradient(0, 0, 10, 0, 0, 260);
    rg.addColorStop(0, `rgba(${TEAM[s].glow},0.14)`); rg.addColorStop(1, `rgba(${TEAM[s].glow},0)`);
    c.fillStyle = rg; c.beginPath(); c.arc(0, 0, 260, 0, 7); c.fill(); c.restore();
  }
  for (const b of MAP.blockers || []) drawBlocker(c, b.poly); // v2.65: the ridge
  const hz = c.createLinearGradient(0, HORIZON, 0, HORIZON + 80);
  hz.addColorStop(0, 'rgba(120,96,200,0.34)'); hz.addColorStop(0.35, 'rgba(80,70,150,0.12)'); hz.addColorStop(1, 'rgba(60,60,120,0)');
  c.fillStyle = hz; c.fillRect(GB.x0, HORIZON, GB.x1 - GB.x0, 80);
  c.restore();
  c.strokeStyle = 'rgba(200,180,255,0.35)'; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
}
// v2.65 (Two-Lane): a lane's worn track, wider soft band under a narrower one, along its path
function drawLaneTracks(c) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [w, a] of [[1, 0.05], [0.75, 0.06], [0.45, 0.05]]) for (const ln of MAP.lanes) {
    c.strokeStyle = `rgba(150,135,110,${a})`; c.lineWidth = ln.width * w * DY * 1.6;
    c.beginPath(); ln.path.forEach(([x, y], i) => { const [px, py] = gp(x, y); i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke();
  }
  c.lineCap = 'butt'; c.lineJoin = 'miter';
}
// A blocker as a low rocky plateau: dark walls facing the viewer, a lighter cracked top, a rim of loose stones
function drawBlocker(c, poly) {
  const H = 16, top = poly.map(([x, y]) => gp(x, y, H)), base = poly.map(([x, y]) => gp(x, y));
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); base.forEach(([x, y], i) => i ? c.lineTo(x + 6, y + 5) : c.moveTo(x + 6, y + 5)); c.closePath(); c.fill(); // shadow
  for (let i = 0; i < poly.length; i++) { // the walls that face the viewer (the edge's outward side points down the screen)
    const j = (i + 1) % poly.length, [ax, ay] = base[i], [bx, by] = base[j];
    const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
    const mxp = (poly[i][0] + poly[j][0]) / 2, myp = (poly[i][1] + poly[j][1]) / 2, nx = -(poly[j][1] - poly[i][1]), ny = poly[j][0] - poly[i][0];
    const out = (nx * (mxp - cx) + ny * (myp - cy)) > 0 ? ny : -ny; if (out <= 0) continue;
    c.fillStyle = '#20232f'; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(top[j][0], top[j][1]); c.lineTo(top[i][0], top[i][1]); c.closePath(); c.fill();
  }
  const g = c.createLinearGradient(0, Math.min(...top.map(p => p[1])), 0, Math.max(...top.map(p => p[1])));
  g.addColorStop(0, '#3c4256'); g.addColorStop(1, '#2c3142');
  c.fillStyle = g; c.beginPath(); top.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(190,200,230,0.18)'; c.lineWidth = 1; c.stroke();
  const R = mulberry(poly.length * 97 + Math.round(poly[0][0])), xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), inP = (x, y) => { let k = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) k = !k; } return k; };
  for (let n = 0; n < 60; n++) { // cracks and boulders on top
    const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); if (!inP(x, y)) continue;
    const [px, py] = gp(x, y, H), r = 2 + R() * 6;
    if (R() < 0.5) { c.strokeStyle = 'rgba(10,12,20,0.45)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(px - r, py); c.lineTo(px, py + r * 0.3); c.lineTo(px + r, py - r * 0.2); c.stroke(); }
    else { c.fillStyle = '#4a5068'; c.beginPath(); c.ellipse(px, py - r * 0.3, r, r * 0.5, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(px + r * 0.2, py, r, r * 0.35, 0, 0, Math.PI); c.fill(); }
  }
}
let groundCache = null, GS = 1.4;
function buildGroundCache() {
  if (typeof document === 'undefined') return null;
  try {
    const cvs = document.createElement('canvas');
    cvs.width = Math.ceil((GB.x1 - GB.x0) * GS); cvs.height = Math.ceil((GB.y1 - GB.y0) * GS);
    const c = cvs.getContext('2d'); if (!c) return null;
    c.setTransform(GS, 0, 0, GS, -GB.x0 * GS, -GB.y0 * GS);
    drawGround(c);
    return cvs;
  } catch (e) { return null; }
}

// The sky's gradients and the planet are drawn once into canvases and stamped while the view holds still
// (during the intro zoom they are drawn live); the stars still twinkle and drift every frame.
const SKY = { key: '', last: '', bg: null, pkey: '', planet: null };
function skyLayer(c, cw, ch, hy, tint = 0) {
  const g = c.createLinearGradient(0, 0, 0, Math.max(hy, 10));
  g.addColorStop(0, '#04060f'); g.addColorStop(0.55, '#0e1532'); g.addColorStop(1, '#30255a');
  c.fillStyle = g; c.fillRect(0, 0, cw, Math.max(0, hy) + 2);
  c.fillStyle = '#121a22'; c.fillRect(0, Math.max(0, hy), cw, ch);
  const nb = c.createRadialGradient(cw * 0.35, hy * 0.45, 10, cw * 0.35, hy * 0.45, cw * 0.4);
  nb.addColorStop(0, 'rgba(110,70,170,0.16)'); nb.addColorStop(1, 'rgba(110,70,170,0)');
  c.fillStyle = nb; c.fillRect(0, 0, cw, hy);
  if (tint) { c.fillStyle = `rgba(150,32,12,${(0.3 * tint / 12).toFixed(3)})`; c.fillRect(0, 0, cw, Math.max(0, hy)); } // storm red, in 12 steps so the cached sky is rebuilt only 12 times
}
function planetLayer(c, px, py, pr) {
  const pg = c.createRadialGradient(px - pr * 0.35, py - pr * 0.35, pr * 0.1, px, py, pr);
  pg.addColorStop(0, '#a6b8ff'); pg.addColorStop(0.6, '#4b4f9a'); pg.addColorStop(1, '#22234a');
  c.fillStyle = pg; c.beginPath(); c.arc(px, py, pr, 0, 7); c.fill();
  c.strokeStyle = 'rgba(196,155,255,0.45)'; c.lineWidth = 2; c.beginPath(); c.ellipse(px, py, pr * 1.75, pr * 0.3, -0.2, 0, 7); c.stroke();
}
function cached(key, w, h, dpr, draw) { // a canvas the size of w×h points, drawn by draw(ctx)
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr);
  const k = cv.getContext('2d'); k.setTransform(dpr, 0, 0, dpr, 0, 0); draw(k); return cv;
}
function drawSky(c, time, hy, tint = 0) {
  const { cw, ch, S, dpr } = V;
  const key = `${cw}|${ch}|${hy}|${dpr}|${tint}`, geo = `${cw}|${ch}|${hy}|${dpr}`, still = geo === SKY.lastGeo;
  SKY.lastGeo = geo;
  if (SKY.key !== key && still) { SKY.key = key; SKY.bg = cached(key, cw, ch, dpr, k => skyLayer(k, cw, ch, hy, tint)); }
  if (SKY.key === key) c.drawImage(SKY.bg, 0, 0, cw, ch); else skyLayer(c, cw, ch, hy, tint);
  const sw = cw * 1.5;
  for (const s of BG.stars) {
    const y = s.y * hy * 0.95;
    const x = ((s.x * sw - cam.x * S * 0.03) % sw + sw) % sw;
    c.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(time * 1.5 + s.tw)) * (1 - 0.6 * s.y);
    c.fillStyle = '#dfe8ff'; c.fillRect(x, y, s.r, s.r);
  }
  c.globalAlpha = 1;
  const pr = clamp(hy * 0.32, 22, 70), px = cw * 0.74 - cam.x * S * 0.05, py = clamp(hy * 0.42, pr + 6, hy - pr * 0.4);
  const pkey = `${pr}|${dpr}`, half = pr * 1.8 + 2;
  if (SKY.pkey !== pkey && still) { SKY.pkey = pkey; SKY.planet = cached(pkey, half * 2, half * 2, dpr, k => planetLayer(k, half, half, pr)); }
  if (SKY.pkey === pkey) c.drawImage(SKY.planet, px - half, py - half, half * 2, half * 2); else planetLayer(c, px, py, pr);
}
function drawRidge(c, pts, p, fill, rim) {
  c.save(); c.translate(cam.x * (1 - p), HORIZON + 3);
  c.beginPath(); c.moveTo(pts[0][0], 10);
  for (const [x, y] of pts) c.lineTo(x, y);
  c.lineTo(pts[pts.length - 1][0], 10); c.closePath();
  c.fillStyle = fill; c.fill();
  if (rim) { c.strokeStyle = rim; c.lineWidth = 1; c.beginPath(); pts.forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](x, y)); c.stroke(); }
  c.restore();
}

function drawPad(c, x, y, h, s, empty, time, selected, fac) {
  if (fac === 'bloomhost') { drawPadBH(c, x, y, h, s, empty, time, selected); return; }
  if (fac === 'axiarchs') { drawPadAX(c, x, y, h, s, empty, time, selected); return; }
  const P4 = [pt(-h, -h), pt(h, -h), pt(h, h), pt(-h, h)].map(([a, b]) => [x + a, y + b]);
  // thin slab edge, then the plate
  c.fillStyle = '#0a0f18';
  c.beginPath(); c.moveTo(P4[3][0], P4[3][1]); c.lineTo(P4[2][0], P4[2][1]); c.lineTo(P4[1][0], P4[1][1]); c.lineTo(P4[1][0], P4[1][1] + 3); c.lineTo(P4[2][0], P4[2][1] + 3); c.lineTo(P4[3][0], P4[3][1] + 3); c.closePath(); c.fill();
  poly(c, P4); c.fillStyle = 'rgba(26,33,50,0.95)'; c.fill();
  c.strokeStyle = selected ? 'rgba(255,211,77,0.9)' : `rgba(${TEAM[s].glow},0.28)`; c.lineWidth = selected ? 2 : 1; c.stroke();
  const inner = [pt(-h + 7, -h + 7), pt(h - 7, -h + 7), pt(h - 7, h - 7), pt(-h + 7, h - 7)].map(([a, b]) => [x + a, y + b]);
  poly(c, inner); c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 1; c.stroke();
  // team-coloured corner brackets on every pad, glowing when the pad is free
  const al = empty ? 0.6 + 0.3 * Math.sin(time * 2.5 + x * 0.02) : 0.45;
  for (let i = 0; i < 4; i++) {
    const p = P4[i], q = P4[(i + 1) % 4], r = P4[(i + 3) % 4];
    c.strokeStyle = `rgba(${TEAM[s].glow},${al})`; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(p[0] + (q[0] - p[0]) * 0.22, p[1] + (q[1] - p[1]) * 0.22); c.lineTo(p[0], p[1]); c.lineTo(p[0] + (r[0] - p[0]) * 0.22, p[1] + (r[1] - p[1]) * 0.22); c.stroke();
    if (empty) glow(c, p[0], p[1], 1.8, TEAM[s].glow, al);
  }
}

// The signature pad (v2.43): the faction's own pad plus a gold double border; empty, a slowly pulsing star and its label
function drawSigPadMark(c, x, y, h, empty, time, label) {
  const al = empty ? 0.6 + 0.3 * Math.sin(time * 2) : 0.55, H = h + 5;
  const P4 = [pt(-H, -H), pt(H, -H), pt(H, H), pt(-H, H)].map(([a, b]) => [x + a, y + b]);
  c.save();
  poly(c, P4); c.strokeStyle = `rgba(255,207,106,${al})`; c.lineWidth = 2; c.setLineDash([7, 4]); c.stroke(); c.setLineDash([]);
  if (empty) {
    c.fillStyle = `rgba(255,207,106,${al})`; c.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 4 : 10, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(x + Math.cos(a) * r, y - 3 + Math.sin(a) * r * 0.62); }
    c.closePath(); c.fill();
    if (label) { c.font = '700 8px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(255,207,106,0.8)'; c.fillText('SIGNATURE', x, y + 11); } // inside the pad, under the star
  }
  c.restore();
}
// Bloomhost pads (v2.17): a fleshy root bed in the shape of the pad, veined in the team colour; an empty one holds a
// dormant bud that slowly pulses
function drawPadBH(c, x, y, h, s, empty, time, selected) {
  const P4 = [pt(-h, -h), pt(h, -h), pt(h, h), pt(-h, h)].map(([a, b]) => [x + a, y + b]);
  c.beginPath(); c.moveTo((P4[0][0] + P4[1][0]) / 2, (P4[0][1] + P4[1][1]) / 2);
  for (let i = 1; i <= 4; i++) { const p = P4[i % 4], q = P4[(i + 1) % 4]; c.quadraticCurveTo(p[0] + (p[0] - x) * 0.08, p[1] + (p[1] - y) * 0.08, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
  c.closePath(); c.fillStyle = 'rgba(58,36,58,0.95)'; c.fill();
  c.strokeStyle = selected ? 'rgba(255,211,77,0.9)' : `rgba(${TEAM[s].glow},0.22)`; c.lineWidth = selected ? 2 : 1; c.stroke();
  const al = empty ? 0.35 + 0.25 * Math.sin(time * 1.6 + x * 0.02) : 0.3;
  c.strokeStyle = `rgba(${TEAM[s].glow},${al})`; c.lineWidth = 1.1; c.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const p = P4[i]; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (p[0] - x) * 0.5 + 3, y + (p[1] - y) * 0.5 - 2, x + (p[0] - x) * 0.82, y + (p[1] - y) * 0.82); c.stroke(); }
  if (empty) { // the dormant bud
    c.fillStyle = '#4a3352'; c.beginPath(); c.ellipse(x, y - 3, 7, 5, 0, 0, 7); c.fill();
    c.fillStyle = `rgba(${TEAM[s].glow},${al})`; c.beginPath(); c.ellipse(x, y - 4, 1.6, 3, 0, 0, 7); c.fill();
  }
}
// Axiarch pads (v2.25): a dark geometric stone platform with carved glyphs in the team colour; an empty one is dormant stone
// with one faint glyph that slowly brightens and fades
function drawPadAX(c, x, y, h, s, empty, time, selected) {
  const P4 = [pt(-h, -h), pt(h, -h), pt(h, h), pt(-h, h)].map(([a, b]) => [x + a, y + b]);
  c.fillStyle = '#07080f';
  c.beginPath(); c.moveTo(P4[3][0], P4[3][1]); c.lineTo(P4[2][0], P4[2][1]); c.lineTo(P4[1][0], P4[1][1]); c.lineTo(P4[1][0], P4[1][1] + 4); c.lineTo(P4[2][0], P4[2][1] + 4); c.lineTo(P4[3][0], P4[3][1] + 4); c.closePath(); c.fill();
  poly(c, P4); c.fillStyle = 'rgba(22,24,38,0.97)'; c.fill();
  c.strokeStyle = selected ? 'rgba(255,211,77,0.9)' : 'rgba(125,136,170,0.35)'; c.lineWidth = selected ? 2 : 1; c.stroke();
  const inner = [pt(-h + 8, -h + 8), pt(h - 8, -h + 8), pt(h - 8, h - 8), pt(-h + 8, h - 8)].map(([a, b]) => [x + a, y + b]);
  poly(c, inner); c.strokeStyle = 'rgba(125,136,170,0.18)'; c.lineWidth = 1; c.stroke();
  const al = empty ? 0.25 + 0.2 * Math.sin(time * 1.3 + x * 0.02) : 0.3;
  c.strokeStyle = `rgba(${TEAM[s].glow},${al})`; c.lineWidth = 1.2; // glyphs: a diamond and its four ticks
  const d = [pt(0, -h * 0.4), pt(h * 0.4, 0), pt(0, h * 0.4), pt(-h * 0.4, 0)].map(([a, b]) => [x + a, y + b]);
  poly(c, d); c.stroke();
  for (let i = 0; i < 4; i++) { const p = P4[i]; c.beginPath(); c.moveTo(x + (p[0] - x) * 0.62, y + (p[1] - y) * 0.62); c.lineTo(x + (p[0] - x) * 0.8, y + (p[1] - y) * 0.8); c.stroke(); }
}
/* ---------- Creep layer (v2.18) ----------
   Each side's creep is painted into its own offscreen canvas only when it changes (radii in 8-unit steps, at most once a second unless a patch appears or goes), then stamped
   under the pads, buildings and units with one drawImage. Fleshy patches, branching veins in the team colour, a faint
   glow; each patch's veins come from a seed made from its key, so they never jitter between redraws. Enemy creep is
   drawn from what the player last saw of it (fog.creep), and only on ground the player has seen, like enemy pads. */
const creepSeed = k => [...k].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7);
const CRV = { x0: -60, y0: 0, w: 0, h: 0, k: 1, cv: [null, null], sig: ['', ''], keys: ['', ''], at: [0, 0], gap: 1000 }; // gap: ms between repaints while it only grows or shrinks
const mapCreepView = () => { CRV.y0 = HORIZON + 4; CRV.w = L + 120; CRV.h = Math.max(180, (MAP.size.h / 2) * DY + 60) - HORIZON - 4; CRV.cv = [null, null]; CRV.sig = ['', '']; CRV.keys = ['', '']; }; // v2.65: per map
mapCreepView(); MAP_HOOKS.push(mapCreepView);
function creepCanvas(side, patches) {
  const sig = patches.map(p => p.k + ':' + Math.round(p.r / 8)).join('|'), keys = patches.map(p => p.k).join('|'), now = performance.now();
  if (CRV.cv[side] && (CRV.sig[side] === sig || (CRV.keys[side] === keys && now - CRV.at[side] < CRV.gap))) return CRV.cv[side]; // a new or lost patch repaints at once; growth at most once a second
  CRV.keys[side] = keys; CRV.at[side] = now;
  let cv = CRV.cv[side];
  if (!cv) { cv = CRV.cv[side] = document.createElement('canvas'); cv.width = Math.ceil(CRV.w * CRV.k); cv.height = Math.ceil(CRV.h * CRV.k); }
  CRV.sig[side] = sig;
  const c = cv.getContext('2d'), T = TEAM[side];
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
  c.setTransform(CRV.k, 0, 0, CRV.k, -CRV.x0 * CRV.k, -CRV.y0 * CRV.k);
  for (const p of patches) { // fleshy ground first, all patches, so overlaps read as one growth
    if (p.r < 2) continue;
    const x = p.u, y = p.v * DY, rx = p.r, rnd = mulberry(creepSeed(p.k));
    const gr = c.createRadialGradient(x, y, 0, x, y, rx);
    gr.addColorStop(0, 'rgba(88,36,76,0.46)'); gr.addColorStop(0.75, 'rgba(72,30,64,0.36)'); gr.addColorStop(1, 'rgba(66,26,58,0)');
    c.save(); c.translate(x, y); c.scale(1, DY); c.translate(-x, -y);
    c.fillStyle = gr; c.beginPath(); c.arc(x, y, rx, 0, 7); c.fill();
    c.fillStyle = 'rgba(104,44,86,0.18)'; // lumps along the edge
    for (let i = 0, n = 6 + (p.r / 30 | 0); i < n; i++) { const a = rnd() * 7, d = rx * (0.55 + rnd() * 0.3); c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rx * (0.12 + rnd() * 0.12), 0, 7); c.fill(); }
    c.restore();
  }
  c.lineCap = 'round';
  for (const p of patches) { // veins: branching lines from the centre, dark with a faint team-coloured glow
    if (p.r < 8) continue;
    const x = p.u, y = p.v * DY, rx = p.r, ry = p.r * DY, rnd = mulberry(creepSeed(p.k) + 1); // its own seed: veins stay put as the patch grows
    for (let i = 0, n = 5 + (p.r / 40 | 0); i < n; i++) {
      const a = (i + rnd() * 0.6) / n * Math.PI * 2, len = 0.6 + rnd() * 0.35, bend = (rnd() - 0.5) * 0.8;
      const ex = x + Math.cos(a) * rx * len, ey = y + Math.sin(a) * ry * len, mx = x + Math.cos(a + bend) * rx * len * 0.5, my = y + Math.sin(a + bend) * ry * len * 0.5;
      c.strokeStyle = 'rgba(40,14,34,0.55)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
      c.strokeStyle = `rgba(${T.glow},0.2)`; c.lineWidth = 1; c.stroke();
      const bx = mx + (ex - mx) * 0.4, by = my + (ey - my) * 0.4, b2 = a + (rnd() - 0.5) * 1.6; // one branch
      c.strokeStyle = 'rgba(40,14,34,0.45)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.cos(b2) * rx * 0.25, by + Math.sin(b2) * ry * 0.25); c.stroke();
      c.fillStyle = `rgba(${T.glow},0.28)`; c.beginPath(); c.arc(ex, ey, 1.4, 0, 7); c.fill(); // a glowing node at the tip
    }
  }
  return cv;
}
/* ---------- Power field layer (v2.26) ----------
   Like the creep layer: each side's field is painted into its own offscreen canvas only when it changes (radii in 8-unit
   steps, at most once a second unless a patch appears or goes), then stamped under everything with one drawImage. A faint
   cyan glow, a fine lattice of concentric diamonds and spokes, and a team-coloured edge. The enemy's field is drawn from
   what the player last saw of it (fog.field), only on ground the player has seen. */
const FLV = { cv: [null, null], sig: ['', ''], keys: ['', ''], at: [0, 0] };
function fieldCanvas(side, patches) {
  const sig = patches.map(p => p.k + ':' + Math.round(p.r / 8)).join('|'), keys = patches.map(p => p.k).join('|'), now = performance.now();
  if (FLV.cv[side] && (FLV.sig[side] === sig || (FLV.keys[side] === keys && now - FLV.at[side] < CRV.gap))) return FLV.cv[side];
  FLV.keys[side] = keys; FLV.at[side] = now; FLV.sig[side] = sig;
  let cv = FLV.cv[side];
  if (!cv) { cv = FLV.cv[side] = document.createElement('canvas'); cv.width = Math.ceil(CRV.w * CRV.k); cv.height = Math.ceil(CRV.h * CRV.k); }
  const c = cv.getContext('2d'), T = TEAM[side];
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
  c.setTransform(CRV.k, 0, 0, CRV.k, -CRV.x0 * CRV.k, -CRV.y0 * CRV.k);
  for (const p of patches) { // the glow, all patches first so overlaps read as one field
    if (p.r < 2) continue;
    const x = p.u, y = p.v * DY;
    c.save(); c.translate(x, y); c.scale(1, DY);
    const gr = c.createRadialGradient(0, 0, 0, 0, 0, p.r);
    gr.addColorStop(0, 'rgba(120,210,255,0.10)'); gr.addColorStop(0.8, 'rgba(110,200,255,0.07)'); gr.addColorStop(1, 'rgba(110,200,255,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(0, 0, p.r, 0, 7); c.fill();
    c.restore();
  }
  for (const p of patches) { // the lattice: diamonds every 40 units, six spokes, and the team-coloured edge
    if (p.r < 8) continue;
    const x = p.u, y = p.v * DY, ry = DY;
    c.strokeStyle = 'rgba(170,225,255,0.13)'; c.lineWidth = 1;
    for (let r = 40; r < p.r - 6; r += 40) { c.beginPath(); c.moveTo(x - r, y); c.lineTo(x, y - r * ry); c.lineTo(x + r, y); c.lineTo(x, y + r * ry); c.closePath(); c.stroke(); }
    c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.26; c.moveTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14 * ry); c.lineTo(x + Math.cos(a) * p.r * 0.92, y + Math.sin(a) * p.r * 0.92 * ry); } c.stroke();
    c.strokeStyle = `rgba(${T.glow},0.32)`; c.lineWidth = 1.2; c.setLineDash([10, 6]);
    c.beginPath(); c.ellipse(x, y, p.r, p.r * ry, 0, 0, 7); c.stroke(); c.setLineDash([]);
  }
  return cv;
}
function drawField(c, g, F) {
  for (let s = 0; s < 2; s++) {
    const patches = s === 0 ? g.field[0] : Object.keys(F.field).sort().map(k => ({ k, ...F.field[k] }));
    if (!patches.length) { FLV.sig[s] = ''; continue; }
    const cv = fieldCanvas(s, patches);
    if (s === 1) {
      c.save(); c.beginPath();
      for (let i = 0; i < FOG_N; i++) if (F.seen[i]) { let j = i; while (j + 1 < FOG_N && F.seen[j + 1]) j++; c.rect(i * FOG_CELL, CRV.y0, (j - i + 1) * FOG_CELL, CRV.h); i = j; }
      c.clip();
    }
    c.drawImage(cv, CRV.x0, CRV.y0, CRV.w, CRV.h);
    if (s === 1) c.restore();
  }
  if (facOf(g.sides[0].faction) === 'axiarchs' && !g.over) drawWarpMark(c, g); // the player's own warp point
}
// The player's warp point: a glyph on the ground, brighter when the player placed it (the default sits at the field's front)
function drawWarpMark(c, g) {
  const wp = warpPoint(g, 0), w = P(wp.u, wp.v), set = !!g.sides[0].warp, k = 0.6 + 0.4 * Math.sin(VFX.lastT * 3);
  c.strokeStyle = `rgba(159,232,255,${(set ? 0.8 : 0.45) * k})`; c.lineWidth = set ? 1.8 : 1.2;
  c.beginPath(); c.moveTo(w.x - 12, w.y); c.lineTo(w.x, w.y - 6); c.lineTo(w.x + 12, w.y); c.lineTo(w.x, w.y + 6); c.closePath(); c.stroke();
  c.beginPath(); c.moveTo(w.x - 6, w.y); c.lineTo(w.x, w.y - 3); c.lineTo(w.x + 6, w.y); c.lineTo(w.x, w.y + 3); c.closePath(); c.stroke();
  if (set) { c.beginPath(); c.moveTo(w.x, w.y - 3); c.lineTo(w.x, w.y - 16); c.stroke(); }
}
// Units warping in (v2.26): a column of pale light that brightens over the channel, a turning diamond and a ground ring.
// The enemy's warps show only inside the player's vision (and make no sound outside it).
function drawWarps(c, g, lit, time) {
  for (const w of g.warps) {
    if (w.side !== 0 && !lit(w.u)) continue;
    if (!VFX.warpSeen.has(w)) { VFX.warpSeen.add(w); if (VFX.primed) sfx('warp', P(w.u, w.v).x); }
    const p = P(w.u, w.v), k = clamp((g.t - w.t0) / WARP.ch, 0, 1), d = UDEF[w.type], h = (d.air ? 70 : 34) + 10 * k;
    c.globalCompositeOperation = 'lighter';
    const gr = c.createLinearGradient(0, p.y, 0, p.y - h);
    gr.addColorStop(0, `rgba(160,230,255,${0.15 + 0.4 * k})`); gr.addColorStop(1, 'rgba(160,230,255,0)');
    c.fillStyle = gr; c.fillRect(p.x - 6 - 4 * k, p.y - h, 12 + 8 * k, h);
    c.strokeStyle = `rgba(${TEAM[w.side].glow},${0.4 + 0.5 * k})`; c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(p.x, p.y, 16 - 4 * k, (16 - 4 * k) * 0.42, 0, 0, 7); c.stroke();
    const a = time * 3, z = (d.air ? 40 : 14) * k + 6, r = 5 + 3 * k;
    c.strokeStyle = `rgba(225,248,255,${0.5 + 0.5 * k})`; c.beginPath();
    c.moveTo(p.x + Math.cos(a) * r, p.y - z); c.lineTo(p.x, p.y - z - r * 1.4); c.lineTo(p.x - Math.cos(a) * r, p.y - z); c.lineTo(p.x, p.y - z + r * 0.9); c.closePath(); c.stroke();
    c.globalCompositeOperation = 'source-over';
  }
}
function drawCreep(c, g, F) {
  for (let s = 0; s < 2; s++) {
    const patches = s === 0 ? g.creep[0] : Object.keys(F.creep).sort().map(k => ({ k, ...F.creep[k] }));
    if (!patches.length) { CRV.sig[s] = ''; continue; }
    const cv = creepCanvas(s, patches);
    if (s === 1) { // only on ground the player has seen, as with enemy pads
      c.save(); c.beginPath();
      for (let i = 0; i < FOG_N; i++) if (F.seen[i]) { let j = i; while (j + 1 < FOG_N && F.seen[j + 1]) j++; c.rect(i * FOG_CELL, CRV.y0, (j - i + 1) * FOG_CELL, CRV.h); i = j; }
      c.clip();
    }
    c.drawImage(cv, CRV.x0, CRV.y0, CRV.w, CRV.h);
    if (s === 1) c.restore();
  }
}
function hpColor(f) { return f > 0.6 ? '#5dff8a' : f > 0.3 ? '#ffd34d' : '#ff5a5a'; }
function bar(c, x, y, w, f, h, lost = f) { // lost: health just lost, shown as a white chunk that drains away
  c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
  f = clamp(f, 0, 1);
  if (lost > f) { c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(x - w / 2 + w * f, y, w * (Math.min(1, lost) - f), h); }
  c.fillStyle = hpColor(f); c.fillRect(x - w / 2, y, w * f, h);
}
function shpBar(c, x, y, w, f, h) { // Axiarch shields (v2.25): cyan, always above the health bar
  c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
  c.fillStyle = '#5fdcff'; c.fillRect(x - w / 2, y, w * clamp(f, 0, 1), h);
}
const lostF = e => { const r = VFX.rec.get(e); return r ? r.ghost / e.maxHp : 0; };
const bTop = b => P(b.u, b.v).y - (bdOf(b).half + bdOf(b).h) * BS;

// Building cache: like unit sprites, each static body is drawn once per type, tier and team at the current zoom step,
// then stamped with one drawImage; only the light animated parts are drawn every frame.
const BCACHE = { scale: 0, map: new Map(), budget: 0, made: 0 };
const bBox = type => { const d = BDEF[type], w = 2 * d.half * IX + 14; return [-w, -(d.half + d.h + 8), 2 * w, 2 * d.half + d.h + 22]; };
function bodyCanvas(type, side, tier, fac) {
  const b = 2 ** (Math.ceil(Math.log2(V.dpr * V.S * BS) * 4) / 4); // device pixels per art unit, in quarter-octave steps
  if (b !== BCACHE.scale) { BCACHE.scale = b; BCACHE.map.clear(); }
  const key = type + side + tier + (fac || '');
  let cv = BCACHE.map.get(key);
  if (!cv && BCACHE.budget > 0) { // a few new bodies per frame at most, so a zoom change never stalls a frame
    BCACHE.budget--; BCACHE.made++;
    const box = bBox(type);
    cv = document.createElement('canvas'); cv.width = Math.ceil(box[2] * b); cv.height = Math.ceil(box[3] * b);
    const k = cv.getContext('2d'); k.setTransform(b, 0, 0, b, -box[0] * b, -box[1] * b);
    artOf(fac, type)[0](k, TEAM[side], tier);
    cv.box = box; cv.b = b;
    BCACHE.map.set(key, cv);
  }
  return cv;
}
function drawArt(c, b, T, t, tier) { // the cached body (drawn live until it is cached) plus the live parts
  const art = artOf(b.fac, b.type), cv = bodyCanvas(b.type, b.side, tier, b.fac);
  if (cv) c.drawImage(cv, cv.box[0], cv.box[1], cv.width / cv.b, cv.height / cv.b);
  else art[0](c, T, tier);
  art[1](c, T, t, b, tier);
}
function drawBuilding(c, b, time) {
  const T = TEAM[b.side], w = P(b.u, b.v), d = bdOf(b);
  c.save(); c.translate(w.x, w.y); c.scale(BS, BS);
  c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(6, d.half * 0.35, d.half * 1.7, d.half * 0.7, 0, 0, 7); c.fill();
  const bottom = d.half + 8, top = -d.half - d.h - 12;
  if (!b.built) {
    c.save(); c.globalAlpha = 0.88;
    c.beginPath(); c.rect(-200, bottom - (bottom - top) * b.progress, 400, (bottom - top) * b.progress + 20); c.clip();
    drawArt(c, b, T, b.anim, 1); c.restore();
    scaffold(c, b, T, b.progress, bottom, top);
  } else if (b.upgrading) {
    drawArt(c, b, T, b.anim, b.tier);
    c.save(); c.globalAlpha = 0.9;
    c.beginPath(); c.rect(-200, bottom - (bottom - top) * b.upProg, 400, (bottom - top) * b.upProg + 20); c.clip();
    drawArt(c, b, T, b.anim, b.tier + 1); c.restore();
    scaffold(c, b, T, b.upProg, bottom, top);
  } else drawArt(c, b, T, b.anim, b.tier);
  if (b.path && treeOf(b.fac, b.type) && b.built) drawPathMark(c, b.path, T, d, b.fac); // which path this building took (v2.13; ghosts remember it)
  if (d.gun && b.built && b.hp > 0 && typeof game !== 'undefined' && game && !game.over && powMul(game) < 1) drawPowerFail(c, d, time, b.id, 1 - powMul(game)); // v2.69 (b)
  if (b.shielded) {
    const a = 0.3 + 0.15 * Math.sin(time * 2.5 + b.side);
    c.beginPath(); c.ellipse(0, 12, 96, 158, 0, Math.PI, Math.PI * 2); c.ellipse(0, 12, 96, 40, 0, 0, Math.PI);
    c.fillStyle = `rgba(${T.glow},0.07)`; c.fill();
    c.strokeStyle = `rgba(${T.glow},${a})`; c.lineWidth = 2;
    c.beginPath(); c.ellipse(0, 12, 96, 158, 0, Math.PI, Math.PI * 2); c.stroke();
    c.strokeStyle = `rgba(${T.glow},${a * 0.5})`; c.lineWidth = 1;
    c.beginPath(); c.ellipse(0, 12, 96, 40, 0, 0, Math.PI); c.stroke();
  }
  c.restore();
}
// v2.69 (b): a gun losing power as the storm nears: it flickers dark, sparks jump off its top and a warning bolt blinks over
// it; the more power lost (k, 0 to 1), the darker and busier
function drawPowerFail(c, d, time, id, k) {
  const top = -d.h - d.half * 0.6, fl = 0.5 + 0.5 * Math.sin(time * 23 + id) * Math.sin(time * 7.3 + id * 2.1); // fl: 0 to 1, a flicker
  c.fillStyle = `rgba(4,6,12,${0.12 + 0.28 * k * fl})`; c.beginPath(); c.ellipse(0, -d.h * 0.45, d.half * 1.5, d.h * 0.6 + d.half * 0.4, 0, 0, 7); c.fill();
  c.strokeStyle = `rgba(150,215,255,${0.55 + 0.45 * fl})`; c.lineWidth = 1.6;
  for (let i = 0; i < 2 + Math.round(3 * k); i++) {
    const ph = time * 9 + id * 1.7 + i * 2.3; if (Math.sin(ph) < 0) continue;
    const x0 = Math.sin(ph * 1.9) * d.half * 0.8, y0 = top + Math.cos(ph * 1.3) * 6;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.sin(ph * 5) * 7, y0 - 6); c.lineTo(x0 + Math.sin(ph * 7) * 10, y0 - 13); c.stroke();
  }
  const y = -d.h * 0.35, a = 0.7 + 0.3 * Math.sin(time * 6 + id); // the warning bolt in a dark disc beside it (clear of its bars), always shown while power fails
  c.save(); c.translate(d.half * 1.35, 0);
  c.fillStyle = 'rgba(20,10,0,0.75)'; c.beginPath(); c.arc(0, y, 13, 0, 7); c.fill();
  c.strokeStyle = `rgba(255,170,50,${a})`; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = `rgba(255,190,70,${a})`;
  c.beginPath(); c.moveTo(3, y - 10); c.lineTo(-6, y + 1.5); c.lineTo(-0.5, y + 1.5); c.lineTo(-3, y + 10); c.lineTo(6, y - 2.5); c.lineTo(0.5, y - 2.5); c.closePath(); c.fill();
  c.restore();
}
// v2.69 (c): a destroyed building's pad, rubble until it clears (k: share of the time left)
function drawRubble(c, x, y, k, seed) {
  c.save(); c.translate(x, y); c.scale(BS, BS);
  for (let i = 0; i < 9; i++) {
    const a = seed * 1.7 + i * 2.39, r = 6 + (i * 13 % 22), px = Math.cos(a) * r * 1.4, py = Math.sin(a) * r * 0.6, sz = 4 + (i * 7 % 6);
    c.fillStyle = i % 3 ? 'rgba(70,64,58,0.95)' : 'rgba(40,36,34,0.95)';
    c.beginPath(); c.moveTo(px - sz, py); c.lineTo(px - sz * 0.3, py - sz * 0.9); c.lineTo(px + sz, py - sz * 0.3); c.lineTo(px + sz * 0.6, py + sz * 0.4); c.closePath(); c.fill();
  }
  c.strokeStyle = 'rgba(255,190,90,0.75)'; c.lineWidth = 2; // a ring that empties as the pad clears
  c.beginPath(); c.arc(0, -2, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); c.stroke();
  c.restore();
}
// A small team-colored badge on the building's front: Barracks crosshair (Specialists) or chevrons (Mass Deployment);
// War Factory shell (Siege) or flame (Assault)
function drawPathMark(c, path, T, d, fac) {
  const x = -d.half * 1.15, y = -d.h * 0.42 - 4, r = 8;
  c.fillStyle = 'rgba(8,14,26,0.85)'; c.strokeStyle = T.main; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x + r, y - r); c.lineTo(x + r, y + r * 0.4); c.lineTo(x, y + r * 1.25); c.lineTo(x - r, y + r * 0.4); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = T.light; c.lineWidth = 1.5; c.beginPath();
  const k = (fac === 'bloomhost' ? 'x' : fac === 'axiarchs' ? 'a' : '') + (d === BD(fac, 'factory') ? 'f' : d === BD(fac, 'techlab') ? 't' : 'b') + path;
  if (k === 'xbA') { for (const j of [-4, 0, 4]) { c.moveTo(x + j - 2, y - 6); c.quadraticCurveTo(x + j + 1, y - 1, x + j - 1, y + 5); } } // Predatory: claw marks (v2.19)
  else if (k === 'xbB') { c.moveTo(x, y - 7); c.quadraticCurveTo(x + 6, y + 1, x, y + 5); c.quadraticCurveTo(x - 6, y + 1, x, y - 7); } // Acidic: a drop
  else if (k === 'xfA') { c.moveTo(x - 6, y + 4); c.quadraticCurveTo(x, y - 10, x + 6, y + 4); c.moveTo(x + 7, y + 4); c.arc(x + 6, y + 4, 1.5, 0, 7); } // Siege: a lobbed arc
  else if (k === 'xfB') { for (const j of [-5, 0, 5]) { c.moveTo(x + j - 2.5, y + 4); c.lineTo(x + j, y - 6); c.lineTo(x + j + 2.5, y + 4); } } // Predator: spines
  else if (k === 'abA') { c.moveTo(x - 6, y + 4); c.lineTo(x - 2, y - 4); c.lineTo(x + 2, y + 2); c.lineTo(x + 6, y - 6); } // Riftwalk: a phase-step zigzag (v2.27)
  else if (k === 'abB') { c.moveTo(x, y - 7); c.lineTo(x, y + 5); c.moveTo(x - 6, y - 1); c.lineTo(x + 6, y - 1); c.moveTo(x - 4, y - 5); c.lineTo(x + 4, y + 3); } // Lattice: a lattice star
  else if (k === 'afA') { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; c.moveTo(x + Math.cos(a) * 2, y - 1 + Math.sin(a) * 2); c.lineTo(x + Math.cos(a) * 6.5, y - 1 + Math.sin(a) * 6.5); } } // Rupture: a burst
  else if (k === 'afB') { c.arc(x, y - 1, 6, 0, 7); c.moveTo(x + 3, y - 1); c.arc(x, y - 1, 3, 0, 7); } // Dominion: gravity rings
  else if (k === 'atA') { for (const [dx, dy] of [[-4, 2], [4, 2], [0, -4]]) { c.moveTo(x + dx, y + dy - 3); c.lineTo(x + dx + 2.5, y + dy); c.lineTo(x + dx, y + dy + 3); c.lineTo(x + dx - 2.5, y + dy); c.closePath(); } } // Swarm Calculus: three prisms (v2.29)
  else if (k === 'atB') { c.moveTo(x - 6, y + 4); c.lineTo(x - 6, y - 3); c.lineTo(x - 3, y); c.lineTo(x, y - 7); c.lineTo(x + 3, y); c.lineTo(x + 6, y - 3); c.lineTo(x + 6, y + 4); c.closePath(); } // Ascendant Calculus: a crown
  else if (k === 'bA') { c.arc(x, y - 1, 4, 0, 7); c.moveTo(x - 6.5, y - 1); c.lineTo(x + 6.5, y - 1); c.moveTo(x, y - 7.5); c.lineTo(x, y + 5.5); }
  else if (k === 'bB') for (const j of [0, 5]) { c.moveTo(x - 5, y - 5 + j); c.lineTo(x, y - 1 + j); c.lineTo(x + 5, y - 5 + j); }
  else if (k === 'tA') { c.moveTo(x, y - 7); c.lineTo(x + 6.5, y + 3); c.lineTo(x, y); c.lineTo(x - 6.5, y + 3); c.closePath(); } // a wing
  else if (k === 'tB') { c.moveTo(x - 5.5, y - 1); c.lineTo(x + 5.5, y - 1); c.moveTo(x, y - 6.5); c.lineTo(x, y + 4.5); } // a cross
  else if (k === 'fA') { c.moveTo(x - 2.5, y + 5); c.lineTo(x - 2.5, y - 3); c.quadraticCurveTo(x, y - 9, x + 2.5, y - 3); c.lineTo(x + 2.5, y + 5); c.closePath(); } // a shell
  else { c.moveTo(x, y + 5); c.quadraticCurveTo(x - 6, y, x - 1, y - 7); c.quadraticCurveTo(x, y - 2, x + 2, y - 4); c.quadraticCurveTo(x + 6, y + 1, x, y + 5); } // a flame
  c.stroke();
}
function scaffold(c, b, T, prog, bottom, top) {
  const d = bdOf(b), a = d.half, h = d.h;
  if (b.fac === 'axiarchs') { // v2.25: the stone assembles: glyph lines rise up a faint frame, a pale line at the build height
    c.strokeStyle = `rgba(${T.glow},0.4)`; c.lineWidth = 1.1; c.setLineDash([2, 6]);
    for (const [du, dv] of [[-1, -1], [-1, 1], [1, 1]]) { c.beginPath(); c.moveTo(...pt(du * a, dv * a, 0)); c.lineTo(...pt(du * a, dv * a, h)); c.stroke(); }
    c.setLineDash([]);
    const yy = bottom - (bottom - top) * prog;
    c.strokeStyle = `rgba(${AXC.pale},${0.55 + 0.35 * Math.sin(b.anim * 6)})`; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(-2 * a * IX, yy); c.lineTo(2 * a * IX, yy); c.stroke();
    return;
  }
  if (b.fac === 'bloomhost') { // a growing organism: a membrane cocoon and a glowing growth line instead of a frame
    const [x, y] = pt(0, 0, h * 0.45);
    c.strokeStyle = `rgba(${T.glow},0.45)`; c.lineWidth = 1.3; c.setLineDash([3, 5]);
    c.beginPath(); c.ellipse(x, y, a * 1.25, h * 0.55 + a * 0.3, 0, 0, 7); c.stroke(); c.setLineDash([]);
    const yy = bottom - (bottom - top) * prog;
    c.strokeStyle = `rgba(${T.glow},${0.5 + 0.4 * Math.sin(b.anim * 5)})`; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-2 * a * IX, yy); c.quadraticCurveTo(0, yy - 5, 2 * a * IX, yy); c.stroke();
    return;
  }
  c.strokeStyle = `rgba(${T.glow},0.55)`; c.lineWidth = 1.3; c.setLineDash([4, 4]);
  for (const [du, dv] of [[-1, -1], [-1, 1], [1, 1]]) { c.beginPath(); c.moveTo(...pt(du * a, dv * a, 0)); c.lineTo(...pt(du * a, dv * a, h)); c.stroke(); }
  poly(c, [pt(-a, -a, h), pt(a, -a, h), pt(a, a, h), pt(-a, a, h)]); c.stroke();
  c.setLineDash([]);
  const y = bottom - (bottom - top) * prog;
  c.strokeStyle = `rgba(255,211,77,${0.6 + 0.4 * Math.sin(b.anim * 8)})`; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-2 * a * IX - 6, y); c.lineTo(2 * a * IX + 6, y); c.stroke();
}

// Last-known enemy building: frozen (no animation, aim, shield or bars), shown under the fog tint
function drawGhost(c, gh) {
  if (!gh.fac) { drawUnknownBase(c, gh); return; } // never seen: where it is, not what it is (v2.17)
  drawBuilding(c, { ...gh, kind: 'b', built: true, upgrading: false, anim: 0, aim: null, queue: [], shielded: false }, 0);
}
// The enemy HQ before anyone has seen it: a neutral marker that gives nothing away about the enemy's faction
function drawUnknownBase(c, gh) {
  const w = P(gh.u, gh.v);
  c.save(); c.translate(w.x, w.y); c.scale(BS, BS);
  const rx = gh.half * 1.2247, ry = gh.half * 0.7071;
  c.strokeStyle = 'rgba(200,190,230,0.35)'; c.lineWidth = 2; c.setLineDash([6, 6]);
  c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(-rx * 0.6, -4); c.lineTo(0, -60); c.lineTo(rx * 0.6, -4); c.stroke(); c.setLineDash([]);
  c.fillStyle = 'rgba(220,210,245,0.55)'; c.font = '700 26px -apple-system,system-ui,sans-serif'; c.textAlign = 'center'; c.fillText('?', 0, -22);
  c.restore();
}
// Fog: unexplored ground is dark, explored ground dimmed, visible ground clear; soft edges; the sky stays clear
const FOG_EXP = 0.45, FOG_DARK = 0.74, FOG_RGB = '5,8,20';
// Recomputed only when the player's vision changes (the field and the minimap share it); arrays allocated once
const FOG2 = { off: null, oc: null, img: null, F: null, vis: null, exp: null };
const FOGA = { a: null, b: null, vis: null, exp: null, ver: 0, grad: null, gradVer: -1, F: null };
const mapFogView = () => { Object.assign(FOGA, { a: new Float32Array(FOG_N), b: new Float32Array(FOG_N), vis: new Uint8Array(FOG_N), exp: new Uint8Array(FOG_N), grad: null, gradVer: -1, F: null }); FOG2.off = null; }; // v2.65: per map
mapFogView(); MAP_HOOKS.push(mapFogView);
function fogAlpha(F) {
  let same = FOGA.F === F;
  for (let i = 0; i < FOG_N && same; i++) if (FOGA.vis[i] !== F.vis[i] || FOGA.exp[i] !== F.exp[i]) same = false;
  if (same) return FOGA.b;
  FOGA.F = F; FOGA.vis.set(F.vis); FOGA.exp.set(F.exp); FOGA.ver++;
  const a = FOGA.a, b = FOGA.b;
  for (let i = 0; i < FOG_N; i++) a[i] = F.vis[i] ? 0 : F.exp[i] ? FOG_EXP : FOG_DARK;
  for (let i = 0; i < FOG_N; i++) { let sum = 0, n = 0; for (let k = -3; k <= 3; k++) { const j = i + k; if (j >= 0 && j < FOG_N) { sum += a[j]; n++; } } b[i] = sum / n; }
  return b;
}
// v2.63: a grid-fog map (MAP_2D) draws its fog as a small alpha image (one pixel per cell), redrawn only when vision
// changes and stretched over the ground with smoothing: the variant the fog performance check measured (fog-bench.js)
function drawFog2(c, F) {
  const G = FOG2;
  if (!G.off) { G.off = document.createElement('canvas'); G.off.width = FOG_NX; G.off.height = FOG_NY; G.oc = G.off.getContext('2d'); G.img = G.oc.createImageData(FOG_NX, FOG_NY); G.vis = new Uint8Array(FOG_N); G.exp = new Uint8Array(FOG_N); }
  let same = G.F === F;
  for (let i = 0; i < FOG_N && same; i++) if (G.vis[i] !== F.vis[i] || G.exp[i] !== F.exp[i]) same = false;
  if (!same) {
    G.F = F; G.vis.set(F.vis); G.exp.set(F.exp);
    const d = G.img.data, A = Math.round(FOG_EXP * 255), D = Math.round(FOG_DARK * 255);
    for (let k = 0; k < FOG_N; k++) { d[k * 4] = 5; d[k * 4 + 1] = 8; d[k * 4 + 2] = 20; d[k * 4 + 3] = F.vis[k] ? 0 : F.exp[k] ? A : D; }
    G.oc.putImageData(G.img, 0, 0);
  }
  c.save(); c.imageSmoothingEnabled = true; c.drawImage(G.off, 0, 0, FOG_NX, FOG_NY, -FOG_CELL / 2, (FOG_Y0 - FOG_CELL / 2) * DY, FOG_NX * FOG_CELL, FOG_NY * FOG_CELL * DY); c.restore();
}
function drawFog(c, F) {
  if (MAP_2D) return drawFog2(c, F);
  const a = fogAlpha(F);
  if (FOGA.gradVer !== FOGA.ver) { // the gradient is in world units, so it stays valid while the camera moves
    const gr = c.createLinearGradient(GU0, 0, GU1, 0), span = GU1 - GU0;
    gr.addColorStop(0, `rgba(${FOG_RGB},${a[0]})`);
    for (let i = 0; i < FOG_N; i++) {
      if (i > 0 && i < FOG_N - 1 && a[i] === a[i - 1] && a[i] === a[i + 1]) continue;
      gr.addColorStop(clamp((i * FOG_CELL + FOG_CELL / 2 - GU0) / span, 0, 1), `rgba(${FOG_RGB},${a[i]})`);
    }
    gr.addColorStop(1, `rgba(${FOG_RGB},${a[FOG_N - 1]})`);
    FOGA.grad = gr; FOGA.gradVer = FOGA.ver;
  }
  c.fillStyle = FOGA.grad;
  c.fillRect(GB.x0, HORIZON, GB.x1 - GB.x0, GB.y1 - HORIZON);
  for (let k = 1; k <= 6; k++) { c.globalAlpha = 1 - k / 7; c.fillRect(GB.x0, HORIZON - k * 20, GB.x1 - GB.x0, 20); } // fade out over the ridges
  c.globalAlpha = 1;
}

function drawUnit(c, u) {
  const d = UDEF[u.type], w = P(u.u, u.v), bob = d.air ? Math.sin(u.anim * 2.2) * 3 : 0;
  c.fillStyle = d.air ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.32)';
  const big = u.type === 'leviathan' || u.type === 'worldrender' || u.type === 'sovereign' ? 2.4 : u.type === 'broodtyrant' || u.type === 'voidcarrier' ? 1.6 : u.type === 'drone' || u.type === 'needlewing' || u.type === 'prismwing' ? 0.5 : 1; // a Leviathan's shadow is seen coming
  c.beginPath(); c.ellipse(w.x, w.y, (d.air ? 16 * big : UVIS[u.type] ? UVIS[u.type].w : Math.max(8, d.h * 0.7)) * US, (d.air ? 3.5 * big : 2.6) * US, 0, 0, 7); c.fill();
  if (u.type === 'medic' && VFX.g) drawHealBeams(c, VFX.g, u, w);
  if (u.siege) drawSiegeLock(c, u, w); // P8 (v2.37): a Titan's stabilisers, under it
  c.save(); c.translate(w.x, w.y - u.z + bob); c.scale(u.face * US * (u.kid ? 0.75 : 1), US * (u.kid ? 0.75 : 1)); // a Cloudwing's offspring is smaller (v2.21)
  const ph = u.phT > VFX.lastT; // P13 (v2.37): a phased Wraithwing is a faint violet ghost
  if (ph) c.globalAlpha = 0.25 + 0.1 * Math.sin(VFX.lastT * 40);
  drawUnitArt(c, u, TEAM[u.side]);
  if (ph) { c.globalAlpha = 1; c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.violet, 0, -4, 18, 0.55); c.globalCompositeOperation = 'source-over'; }
  c.globalCompositeOperation = 'lighter';
  if (u.hitT > 0) { c.globalAlpha = 0.6 * Math.min(1, u.hitT / 0.12); drawUnitArt(c, u, TEAM[u.side]); } // hit: the unit itself flashes
  if (u.type === 'sniper' && u.cd > 0 && u.cd < 0.35) stamp(c, GLOW.cyan, MUZ.sniper[0], -MUZ.sniper[1], 2 + (0.35 - u.cd) * 14, 0.9); // rail charging
  if (u.braceT > VFX.lastT) { c.globalAlpha = 0.55; c.strokeStyle = TEAM[u.side].light; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-21, -7); c.bezierCurveTo(-19, -30, 12, -32, 19, -13); c.stroke(); } // a bracing Bulwark: its plates lock and glow
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.restore();
  if (u.shT > VFX.lastT) drawShield(c, u, VFX.lastT);
  if (VFX.g) drawAxFx(c, VFX.g, u, w); // v2.27: a Marksman's charge, a Gravemantle's aura, slowed and disrupted marks
  if (u.ovT > VFX.lastT) drawOvercharge(c, u, w, VFX.lastT); // v2.28
  if (u.surgeT > VFX.lastT) drawSurge(c, u, w, VFX.lastT); // P6 (v2.37)
  if (u.maxShp && VFX.g && VFX.g.t - u.shpHit < 0.3) drawShpHit(c, w.x, w.y - u.z, visH(u.type) * US, (VFX.g.t - u.shpHit) / 0.3); // Axiarch shields hit (v2.25)
  if (corrNow(u, VFX.lastT) > 0) drawCorrosion(c, u, w); // v2.19 (v2.37: either slot)
  if (u.frzT > VFX.lastT) { // Frenzy Bloom: a pulsing pink glow (v2.20), larger and brighter with a ring at the feet (v2.21)
    const h = visH(u.type) * US, k = 0.5 + 0.5 * Math.sin(VFX.lastT * 12 + u.id), y = w.y - u.z, r = Math.max(9, h * 0.75) * (1 + 0.25 * k);
    c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.frenzy, w.x, y - h * 0.5, Math.max(16, h * 1.3) * (1 + 0.2 * k), 0.75 + 0.25 * k); c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 0.55 + 0.4 * k; c.strokeStyle = '#ff8ad8'; c.lineWidth = 1.8; c.beginPath(); c.ellipse(w.x, y, r, r * 0.38, 0, 0, 7); c.stroke(); c.globalAlpha = 1;
  }
}
// P4 (v2.37): a Sniper's round going on through its target: a white-hot line that fades
function drawPierce(c, f) {
  const k = 1 - f.t / f.life;
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  c.strokeStyle = `rgba(255,200,120,${0.5 * k})`; c.lineWidth = 4; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.stroke();
  c.strokeStyle = `rgba(255,250,230,${0.95 * k})`; c.lineWidth = 1.4; c.stroke();
  c.globalCompositeOperation = 'source-over'; c.lineCap = 'butt'; c.globalAlpha = 1;
}
// P5 (v2.37): a Riftstalker phase-stepping away: a violet ring that snaps shut where it stood
function drawBlink(c, f) {
  const k = f.t / f.life;
  c.globalAlpha = 1 - k; c.strokeStyle = RIFT; c.lineWidth = 2;
  c.beginPath(); c.ellipse(f.x, f.y, 16 * (1 - k * 0.7), 22 * (1 - k * 0.7), 0, 0, 7); c.stroke();
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.violet, f.x, f.y, 14 * (1 - k), 0.8); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
// P11 (v2.37): a Worldrender feeding: green motes stream from the building it hit up into it, with the HP regained
function drawDevour(c, f) {
  const k = f.t / f.life;
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { const q = clamp(k * 1.6 - i * 0.1, 0, 1), x = f.x + (f.x2 - f.x) * q + Math.sin(i * 2.1 + k * 9) * 5, y = f.y + (f.y2 - f.y) * q; stamp(c, GLOW.acid, x, y, 5, (1 - q) * 0.9); }
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1 - k; c.fillStyle = '#c4f58e'; c.font = 'bold 11px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText(`+${f.n}`, f.x2, f.y2 - 30 - k * 14); c.globalAlpha = 1;
}
// P6 (v2.37): a Bastion's shield surge: a bright shell with rising cyan bands while its shields pour back in
function drawSurge(c, u, w, t) {
  const h = visH(u.type) * US, r = Math.max(14, h * 0.85), y = w.y - u.z - h * 0.45, k = 0.5 + 0.5 * Math.sin(t * 14 + u.id);
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.cyan, w.x, y, r * 1.6, 0.35 + 0.2 * k); c.globalCompositeOperation = 'source-over';
  c.strokeStyle = `rgba(160,235,255,${0.55 + 0.35 * k})`; c.lineWidth = 1.8; c.beginPath(); c.ellipse(w.x, y, r, r * 0.9, 0, 0, 7); c.stroke();
  c.lineWidth = 1.1; for (let i = 0; i < 3; i++) { const ph = (t * 1.6 + i / 3) % 1, yy = w.y - u.z - ph * h * 1.1; c.globalAlpha = 1 - ph; c.beginPath(); c.ellipse(w.x, yy, r * 0.8, r * 0.25, 0, 0, 7); c.stroke(); }
  c.globalAlpha = 1;
}
// P8 (v2.37): a Titan in siege lock. Four stabiliser legs swing out and drive into the ground as it plants (k 0-1), with
// a heavy ring once locked; they fold back as it unplants. Drawn under the walker.
function drawSiegeLock(c, u, w) {
  const S = UDEF.titan.siege || { plant: 2, unplant: 1.5 }, t = VFX.lastT;
  const k = u.siege === 2 ? 1 : u.siege === 1 ? clamp(1 - (u.sgT - t) / S.plant, 0, 1) : clamp((u.sgT - t) / S.unplant, 0, 1);
  const e = 1 - (1 - k) * (1 - k), sx = 22 * US * e, sy = 8 * US * e;
  c.strokeStyle = '#3e4b65'; c.lineWidth = 3 * US; c.lineCap = 'round';
  for (const [ax, ay] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const bx = w.x + ax * 6 * US, by = w.y - 6 * US, fx = w.x + ax * (8 * US + sx), fy = w.y + ay * sy * 0.5;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(fx, fy - 4 * e); c.lineTo(fx, fy); c.stroke();
  }
  c.lineCap = 'butt';
  if (u.siege === 2) { // locked: a heavy dashed ring and team-coloured lock lights
    c.strokeStyle = `rgba(${TEAM[u.side].glow},0.55)`; c.lineWidth = 1.6; c.setLineDash([6, 5]); c.lineDashOffset = -t * 10;
    c.beginPath(); c.ellipse(w.x, w.y, 34 * US, 34 * US * 0.38, 0, 0, 7); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
    c.globalCompositeOperation = 'lighter'; for (const ax of [-1, 1]) stamp(c, GLOW['t' + u.side], w.x + ax * (8 * US + sx), w.y, 4, 0.6 + 0.3 * Math.sin(t * 6)); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  } else { // planting or unplanting: a progress arc over it
    c.strokeStyle = '#ffd34d'; c.lineWidth = 2; c.beginPath(); c.arc(w.x, w.y - visH('titan') * US - 10, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); c.stroke();
  }
}
// Corroded (v2.19): a green acid ring at the feet with drips; brighter for stronger corrosion
function drawCorrosion(c, u, w) {
  const k = clamp(corrNow(u, VFX.lastT) / CORR.cap, 0.3, 1), r = (UDEF[u.type].air ? 12 : Math.max(8, visH(u.type) * 0.6)) * US, y = w.y - u.z;
  c.strokeStyle = `rgba(155,225,93,${0.35 + 0.4 * k})`; c.lineWidth = 1.4; c.beginPath(); c.ellipse(w.x, y, r, r * 0.35, 0, 0, 7); c.stroke();
  c.fillStyle = `rgba(155,225,93,${0.5 + 0.4 * k})`;
  for (let i = 0; i < 3; i++) { const ph = (VFX.lastT * 1.5 + i / 3 + u.id * 0.37) % 1, x = w.x + (i - 1) * r * 0.6, yy = y - visH(u.type) * US * (0.8 - ph * 0.7); c.beginPath(); c.arc(x, yy, 1.4, 0, 7); c.fill(); }
}
// Ruinmaw acid pools (v2.19): a bubbling green puddle that fades in its last second
function drawAcidPool(c, a, t) {
  const w = P(a.u, a.v), left = a.end - t, al = clamp(left, 0, 1);
  if (a.kind === 'dist') { // a Worldbreaker's distortion zone (v2.27): a warped violet ripple instead of acid
    c.fillStyle = `rgba(110,80,180,${0.3 * al})`; c.beginPath(); c.ellipse(w.x, w.y, ACID.r, ACID.r * DY * 0.6, 0, 0, 7); c.fill();
    c.strokeStyle = `rgba(${RIFTA},${0.6 * al})`; c.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { const k = ((t * 0.8 + i / 3) % 1), r = ACID.r * k; c.beginPath(); c.ellipse(w.x, w.y, r, r * DY * 0.6, 0, 0, 7); c.stroke(); }
    return;
  }
  c.fillStyle = `rgba(110,180,60,${0.42 * al})`; c.beginPath(); c.ellipse(w.x, w.y, ACID.r, ACID.r * DY * 0.6, 0, 0, 7); c.fill();
  c.strokeStyle = `rgba(155,225,93,${0.55 * al})`; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = `rgba(190,245,130,${0.6 * al})`;
  for (let i = 0; i < 5; i++) { const a2 = i * 1.26 + a.u, rr = ACID.r * (0.25 + (i % 3) * 0.2), b = (t * 2 + i * 0.3) % 1; c.beginPath(); c.arc(w.x + Math.cos(a2) * rr, w.y + Math.sin(a2) * rr * DY * 0.6, 1 + b * 2, 0, 7); c.fill(); }
}

// Soft green beams from a Medicopter to the infantry it is healing this tick (render only)
function drawHealBeams(c, g, m, w) {
  const R = UDEF.medic.healR, y0 = w.y - m.z + 4 * US;
  c.strokeStyle = 'rgba(80,240,150,0.35)'; c.lineWidth = 1.4 * US;
  for (const e of g.ents) if (e.kind === 'u' && e.side === m.side && e.medAt === g.t && e.hp < e.maxHp && Math.hypot(e.u - m.u, e.v - m.v) <= R) {
    const p = P(e.u, e.v); c.beginPath(); c.moveTo(w.x, y0); c.lineTo(p.x, p.y - visH(e.type) * 0.5 * US); c.stroke();
  }
}

