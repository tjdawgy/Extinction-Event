/* ---------- Overview map inside the top bar ---------- */
function drawMinimap(c, g, w, h) {
  c.clearRect(0, 0, w, h);
  c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, 0.5, 0.5, w - 1, h - 1, 7); c.fill();
  c.strokeStyle = 'rgba(120,150,200,0.3)'; c.lineWidth = 1; c.stroke();
  const k = (w - 8) / (UMAX - UMIN), mx = u => 4 + (u - UMIN) * k, my = v => h / 2 + clamp(v / 260, -1, 1) * (h / 2 - 4);
  const F = g && viewFog(g);
  if (g) { // fog columns
    const a = fogAlpha(F);
    for (let i = 0; i < FOG_N; i++) if (a[i] > 0.02) { c.fillStyle = `rgba(${FOG_RGB},${a[i] * 0.9})`; c.fillRect(mx(i * FOG_CELL), 1, k * FOG_CELL + 0.6, h - 2); }
  }
  if (g) for (const n of g.nodes) {
    c.fillStyle = n.owner === null ? '#ddd2ff' : TEAM[n.owner].main;
    const x = mx(n.u); c.beginPath(); c.moveTo(x, h / 2 - 4); c.lineTo(x + 3.5, h / 2); c.lineTo(x, h / 2 + 4); c.lineTo(x - 3.5, h / 2); c.closePath(); c.fill();
  }
  if (g) for (const gh of Object.values(F.ghosts)) { // remembered enemy buildings: hollow
    if (cellsLit(F.vis, gh.u, gh.half)) continue;
    c.strokeStyle = TEAM[gh.side].main; c.lineWidth = 1; c.globalAlpha = 0.8; c.strokeRect(mx(gh.u) - 1.5, my(gh.v) - 1, 3, 2); c.globalAlpha = 1;
  }
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
  const hw = V.cw / 2 / V.S;
  const x0 = clamp(mx(cam.x - hw), 1, w - 1), x1 = clamp(mx(cam.x + hw), 1, w - 1);
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.2;
  rr(c, x0, 2, Math.max(4, x1 - x0), h - 4, 4); c.stroke();
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
function clampCam() {
  const hw = V.cw / 2 / V.S, x0 = UMIN - 40, x1 = UMAX + 40;
  cam.x = (x1 - x0 < 2 * hw) ? (x0 + x1) / 2 : clamp(cam.x, x0 + hw, x1 - hw);
}
/* ===================== RENDER END ===================== */

