/* ---------- Overview map inside the top bar ---------- */
// v2.65: depth on the minimap. Classic squeezes ±260 into its height; a deep map shows its whole depth (both lanes)
const mmDeep = () => MAP.size.h > 400, mmDepth = () => mmDeep() ? MAP.size.h / 2 : 260;
const mmY = (v, h) => h / 2 + clamp(v / mmDepth(), -1, 1) * (h / 2 - 4);
const mmV = (y, h) => clamp((y - h / 2) / (h / 2 - 4), -1, 1) * mmDepth();
function drawMinimap(c, g, w, h) {
  c.clearRect(0, 0, w, h);
  c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, 0.5, 0.5, w - 1, h - 1, 7); c.fill();
  c.strokeStyle = 'rgba(120,150,200,0.3)'; c.lineWidth = 1; c.stroke();
  const k = (w - 8) / (UMAX - UMIN), mx = u => 4 + (u - UMIN) * k, my = v => mmY(v, h);
  const F = g && viewFog(g);
  if (MAP_LANED || MAP.blockers.length) { // v2.65: the lanes and the blockers (the Two-Lane ridge)
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const ln of MAP.lanes) { c.strokeStyle = 'rgba(150,170,200,0.22)'; c.lineWidth = Math.max(2, ln.width / mmDepth() * (h / 2 - 4)); c.beginPath(); ln.path.forEach(([x, y], i) => i ? c.lineTo(mx(x), my(y)) : c.moveTo(mx(x), my(y))); c.stroke(); }
    c.fillStyle = 'rgba(10,12,20,0.75)';
    for (const b of MAP.blockers) { c.beginPath(); b.poly.forEach(([x, y], i) => i ? c.lineTo(mx(x), my(y)) : c.moveTo(mx(x), my(y))); c.closePath(); c.fill(); }
    c.lineCap = 'butt';
  }
  if (g && MAP_2D) { // fog cells, a few rows at a time (the minimap is small)
    const st = Math.max(1, Math.round(FOG_NY / 12)), cw = k * FOG_CELL + 0.6;
    for (let r = 0; r < FOG_NY; r += st) { const y0 = my(FOG_Y0 + r * FOG_CELL), y1 = my(FOG_Y0 + (r + st) * FOG_CELL);
      for (let i = 0; i < FOG_NX; i++) { const q = r * FOG_NX + i, a = F.vis[q] ? 0 : F.exp[q] ? FOG_EXP : FOG_DARK; if (a > 0.02) { c.fillStyle = `rgba(${FOG_RGB},${a * 0.9})`; c.fillRect(mx(i * FOG_CELL), y0, cw, y1 - y0 + 0.5); } } }
  } else if (g) { // fog columns
    const a = fogAlpha(F);
    for (let i = 0; i < FOG_N; i++) if (a[i] > 0.02) { c.fillStyle = `rgba(${FOG_RGB},${a[i] * 0.9})`; c.fillRect(mx(i * FOG_CELL), 1, k * FOG_CELL + 0.6, h - 2); }
  }
  if (g) for (const n of g.nodes) {
    c.fillStyle = n.owner === null ? '#ddd2ff' : TEAM[n.owner].main;
    const x = mx(n.u), y = mmDeep() ? my(n.v) : h / 2, r = mmDeep() ? 3 : 4; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.9, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.9, y); c.closePath(); c.fill();
  }
  if (g) for (const gh of Object.values(F.ghosts)) { // remembered enemy buildings: hollow
    if (cellsLit(F.vis, gh.u, gh.half, gh.v)) continue;
    c.strokeStyle = TEAM[gh.side].main; c.lineWidth = 1; c.globalAlpha = 0.8; c.strokeRect(mx(gh.u) - 1.5, my(gh.v) - 1, 3, 2); c.globalAlpha = 1;
  }
  if (g) for (const x of g.guards || []) if (x.hp > 0 && visibleTo(g, 0, x)) { c.fillStyle = TEAM[2].main; c.fillRect(mx(x.u) - 1, my(x.v) - 1, 2, 2); } // v2.71: relic guards
  if (g) for (const e of g.ents) {
    if (e.side !== 0 && !visibleTo(g, 0, e)) continue;
    c.fillStyle = TEAM[e.side].main;
    if (e.kind === 'b') { c.globalAlpha = e.built ? 0.9 : 0.4; c.fillRect(mx(e.u) - 2, my(e.v) - 1.5, 4, 3); c.globalAlpha = 1; }
    else c.fillRect(mx(e.u) - 1, UDEF[e.type].air ? 3 : my(e.v) - 1, 2, 2);
  }
  if (g) { // v2.47: the enemy HQ's health under its marker, as last seen (moved from the top bar); hidden until scouted
    const ehq = g.sides[1].hq, vw = g.spectate ? 1 : 0;
    if (g.spectate || visibleTo(g, 0, ehq) || Object.values(F.ghosts).some(gh => gh.type === 'hq' && gh.side === 1 && gh.fac)) { // the start ghost has no faction until seen
      const st = hqStatus(g, 1, vw), bw = 14, bx = clamp(mx(ehq.u) - bw / 2, 2, w - bw - 2), by = Math.min(h - 4, my(ehq.v) + 3);
      c.globalAlpha = st.stale ? 0.6 : 1;
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(bx - 0.5, by - 0.5, bw + 1, 3);
      c.fillStyle = hpColor(st.frac); c.fillRect(bx, by, bw * clamp(st.frac, 0, 1), 2);
      c.globalAlpha = 1;
    }
  }
  if (g && typeof alerts !== 'undefined' && alerts.g === g) for (const p of alerts.pings) { // v2.53: alert pings, expanding rings
    const a = (g.t - p.t) / ALERT.ping; if (a < 0 || a >= 1) continue;
    const x = mx(p.u), y = my(p.v), ph = (a * ALERT.ping * 1.4) % 1;
    c.strokeStyle = p.kind === 'node' ? '#ffd34d' : '#ff5a6e'; c.lineWidth = 1.5;
    c.globalAlpha = (1 - ph) * (1 - a * 0.5); c.beginPath(); c.arc(x, y, 3 + ph * 9, 0, 7); c.stroke();
    c.globalAlpha = 1 - a * 0.6; c.beginPath(); c.arc(x, y, 2.5, 0, 7); c.stroke(); c.globalAlpha = 1;
  }
  if (g && g.meteor && g.meteor.at) { const A = g.meteor.at, x = mx(A.u), y = mmDeep() ? my(A.v) : h / 2; c.strokeStyle = `rgba(255,80,60,${0.6 + 0.4 * Math.sin(performance.now() / 90)})`; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 4, 0, 7); c.stroke(); } // v2.72: a meteor about to land
  if (g && g.cond) { // v2.72: the match's battlefield conditions, small icons down the minimap's right edge
    let y = 4; for (const k of COND_KEYS) { if (!g.cond[k]) continue; condIcon(c, k, w - 7, y + 3); y += 9; }
  }
  const hw = V.cw / 2 / V.S;
  const x0 = clamp(mx(cam.x - hw), 1, w - 1), x1 = clamp(mx(cam.x + hw), 1, w - 1);
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.2;
  if (mmDeep()) { const t = clamp(my((V.ft - V.A) / V.S / DY + YB() / DY), 1, h - 1), b = clamp(my((V.fb - V.A) / V.S / DY + YB() / DY), 1, h - 1); rr(c, x0, t, Math.max(4, x1 - x0), Math.max(4, b - t), 3); c.stroke(); } // v2.65: the view's depth too
  else { rr(c, x0, 2, Math.max(4, x1 - x0), h - 4, 4); c.stroke(); }
  if (g && g.t >= EXT.show && !g.over) { // the Extinction Event countdown, inside the minimap frame (the top bar has no room)
    const left = EXT.start - g.t, time = left > 0 ? fmtTime(Math.ceil(left)) : '+' + fmtTime(-left);
    c.font = '800 9.5px -apple-system,system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const txt = [`EXTINCTION ${time}`, `STORM ${time}`, time].find(t => c.measureText(t).width + 10 <= w - 6) || time; // shorter where the minimap is narrow
    const tw = c.measureText(txt).width + 10, px = w / 2 - tw / 2, warn = left <= EXT.start - EXT.warn;
    c.fillStyle = left > 0 && !warn ? 'rgba(40,6,6,0.82)' : `rgba(150,20,10,${0.75 + 0.25 * Math.sin(performance.now() / 160)})`;
    rr(c, px, 1.5, tw, 12, 5); c.fill();
    c.fillStyle = left > 0 && !warn ? '#ff8a7a' : '#fff'; c.fillText(txt, w / 2, 8);
    c.textBaseline = 'alphabetic';
  }
}
function condIcon(c, k, x, y) { // a 7 px glyph per battlefield condition (v2.72)
  c.fillStyle = 'rgba(10,18,34,0.85)'; c.beginPath(); c.arc(x, y, 4.2, 0, 7); c.fill();
  c.strokeStyle = c.fillStyle = k === 'meteors' ? '#ff8a5a' : k === 'scarce' ? '#ffd34d' : k === 'richCenter' ? '#ddd2ff' : '#cfe0ff'; c.lineWidth = 1;
  c.beginPath();
  if (k === 'heavyFog') { c.moveTo(x - 3, y - 1); c.lineTo(x + 3, y - 1); c.moveTo(x - 3, y + 1.5); c.lineTo(x + 3, y + 1.5); c.stroke(); }
  else if (k === 'richCenter') { c.moveTo(x, y - 3); c.lineTo(x + 2.4, y); c.lineTo(x, y + 3); c.lineTo(x - 2.4, y); c.closePath(); c.fill(); }
  else if (k === 'scarce') { c.moveTo(x, y + 3); c.lineTo(x - 2.6, y - 1); c.lineTo(x + 2.6, y - 1); c.closePath(); c.fill(); }
  else { c.arc(x + 1, y + 1, 1.8, 0, 7); c.fill(); c.beginPath(); c.moveTo(x - 0.5, y - 0.5); c.lineTo(x - 3, y - 3); c.stroke(); }
}
function clampCam() {
  const hw = V.cw / 2 / V.S, x0 = UMIN - 40 - (V.lpad || 0) / V.S, x1 = UMAX + 40; // v2.74: the left edge can scroll clear of the army column (V.lpad px)
  cam.x = (x1 - x0 < 2 * hw) ? (x0 + x1) / 2 : clamp(cam.x, x0 + hw, x1 - hw);
  cam.y = clamp(cam.y, CAMY.min, CAMY.max); // v2.65: a deep map pans up and down (Classic: always 0)
}
/* ===================== RENDER END ===================== */

