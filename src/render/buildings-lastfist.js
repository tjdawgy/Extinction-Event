/* ---------- Command HQ ---------- */
const HQG = [null, { H: 32, TH: 26 }, { H: 36, TH: 30 }, { H: 42, TH: 32 }].map(g => g && { ...g, roof: 8 + g.H, tz: 8 + g.H + 3 + g.TH + 4 });
function hqBody(c, T, tier) {
  const { H, TH, roof, tz } = HQG[tier];
  box(c, 0, 0, 46, 46, 0, 8, MAT.dark);
  trim(c, 44, T, tier);
  if (tier >= 2) { // rear annex tower
    box(c, 30, -30, 10, 10, 8, H + 14, MAT.metal);
    sides(c, 30, -30, 10.2, 10.2, H + 14, 3, T.face);
    box(c, 30, -30, 12, 12, H + 22, 3, MAT.light);
  }
  if (tier >= 3) for (const [u, v] of [[-39, -39], [39, 39]]) { // side bastions
    cyl(c, u, v, 6.5, 6, 40, '#7383a0', '#2c374b', null);
    ring(c, u, v, 6.5, 34, T.main, 2);
    cyl(c, u, v, 7.5, 46, 4, '#97a7c1', '#4c5a72', `rgba(${T.glow},0.75)`);
  }
  if (tier >= 2) { box(c, 0, 0, 40, 40, 8, 12, MAT.dark); sides(c, 0, 0, 40.2, 40.2, 15, 2.2, T.face); } // armour skirt
  box(c, 0, 0, 36, 36, 8, H, MAT.metal);
  sides(c, 0, 0, 36.2, 36.2, roof - 4, 4, T.face);
  const wz = tier >= 2 ? 23 : 15;
  c.globalAlpha = 0.7; winL(c, 0, 0, 36.3, 36.3, wz, 6, 5, T.light); winR(c, 0, 0, 36.3, 36.3, wz, 6, 5, T.light); c.globalAlpha = 1;
  if (tier >= 3) { winL(c, 0, 0, 36.3, 36.3, roof - 13, 5, 6, `rgba(${T.glow},0.45)`); winR(c, 0, 0, 36.3, 36.3, roof - 13, 5, 6, `rgba(${T.glow},0.45)`); }
  const du = tier >= 2 ? -40.3 : -36.3; // the door, on the outermost face
  poly(c, [pt(du, 5, 8), pt(du, 23, 8), pt(du, 23, 25), pt(du, 5, 25)]); c.fillStyle = M.d; c.fill();
  poly(c, [pt(du - 0.1, 8, 9), pt(du - 0.1, 20, 9), pt(du - 0.1, 20, 22), pt(du - 0.1, 8, 22)]); c.fillStyle = `rgba(${T.glow},0.35)`; c.fill();
  if (tier >= 2) { c.strokeStyle = '#ffd34d'; c.lineWidth = 1.2; poly(c, [pt(du - 0.2, 5, 8), pt(du - 0.2, 23, 8), pt(du - 0.2, 23, 25), pt(du - 0.2, 5, 25)]); c.stroke(); }
  box(c, 0, 0, 31, 31, roof, 3, MAT.light);
  pipe(c, pt(22, -22, roof + 3), pt(22, -22, roof + 33), 1.4, M.h); // radar mast
  box(c, 4, -4, 14, 14, roof + 3, TH, MAT.metal);
  winL(c, 4, -4, 14.2, 14.2, roof + TH - 8, 4, 3, T.light); winR(c, 4, -4, 14.2, 14.2, roof + TH - 8, 4, 3, T.light);
  if (tier >= 3) sides(c, 4, -4, 14.3, 14.3, roof + 6, 3, T.face);
  box(c, 4, -4, 17, 17, roof + 3 + TH, 4, MAT.light);
  dome(c, 4, -4, tier >= 3 ? 9 : 8, tz, M.h, M.m);
  if (tier >= 3) { // command spire
    cyl(c, -20, -22, 5, roof + 3, 6, '#7383a0', '#2c374b', '#8794ab');
    cone(c, -20, -22, 4, 0.8, roof + 9, 32, '#97a7c1', '#2c374b', null);
  }
  if (tier >= 3) { cyl(c, -39, 39, 6.5, 6, 20, '#7383a0', '#2c374b', null); cyl(c, -39, 39, 7.5, 26, 4, '#97a7c1', '#4c5a72', `rgba(${T.glow},0.75)`); } // front bastion
}
function hqLive(c, T, t, b, tier) {
  const { roof, tz } = HQG[tier];
  if (tier >= 3) { // the core window band pulses
    const a = 0.25 + 0.25 * Math.sin(t * 2);
    winL(c, 0, 0, 36.4, 36.4, roof - 13, 5, 6, `rgba(${T.glow},${a})`); winR(c, 0, 0, 36.4, 36.4, roof - 13, 5, 6, `rgba(${T.glow},${a})`);
  }
  const [mx, my] = pt(22, -22, roof + 33);
  if (tier >= 2) { // rotating radar dish
    const w = 8 * Math.cos(t * 1.6);
    c.fillStyle = w > 0 ? M.h : M.l; c.beginPath(); c.ellipse(mx, my + 1, Math.abs(w) + 1, 4.5, 0, 0, 7); c.fill();
    c.strokeStyle = M.d; c.lineWidth = 0.8; c.stroke();
  }
  glow(c, mx, my - 2, 2, T.glow, 0.3 + 0.7 * blink(t, 0));
  if (tier >= 3) {
    lamp(c, -20, -22, roof + 43, T.glow, 0.35 + 0.65 * blink(t, 1), 2.4);
    for (const [u, v, z, ph] of [[-39, -39, 52, 0], [39, 39, 52, 2], [-39, 39, 32, 4]]) lamp(c, u, v, z, T.glow, 0.3 + 0.6 * blink(t, ph), 1.6);
  }
  // main gun: one, two or three barrels, pointing at the current target
  const [tx, ty] = pt(4, -4, tz + 4), a = gunAngle(b, tx, ty, -0.5);
  c.save(); c.translate(tx, ty); c.rotate(a);
  c.fillStyle = M.h; barrels(c, tier, 0, 18 + tier * 2, 3.6, tier === 1 ? 4.4 : 2.8);
  c.fillStyle = T.main; c.fillRect(13, -1.2 - tier * 1.8, 3, 2.4 + tier * 3.6);
  if (tier >= 2) { c.fillStyle = M.l; c.fillRect(-6, -2.5 - tier * 1.5, 9, 5 + tier * 3); c.fillStyle = T.main; c.fillRect(-6, -0.8, 9, 1.6); }
  c.restore();
  if (tier >= 3) ring(c, 0, 0, 50, 46 + Math.sin(t * 2) * 3, `rgba(${T.glow},${0.35 + 0.2 * Math.sin(t * 3)})`, 2);
}

/* ---------- Turret: the head (gun) is live; it stays below the health bar at any angle ---------- */
const TURZ = [0, 32, 34, 36]; // gun pivot height
function turretBody(c, T, tier) {
  plinth(c, 26); trim(c, 24, T, tier);
  if (tier >= 3) { // thick armour skirt with a sensor mast behind
    box(c, 0, 0, 23, 23, 6, 7, MAT.dark);
    sides(c, 0, 0, 23.2, 23.2, 8, 2.2, T.face);
    pipe(c, pt(15, -15, 13), pt(15, -15, 44), 1.6, M.h);
    pipe(c, pt(15, -15, 36), pt(11, -19, 38), 1.2, M.h);
  }
  box(c, 0, 0, 20, 20, tier >= 3 ? 13 : 6, tier >= 3 ? 5 : 10, MAT.dark);
  sides(c, 0, 0, 20.2, 20.2, tier >= 3 ? 13 : 12, 3, T.face);
  if (tier >= 2) { cyl(c, 0, 0, 15, 15, 5, '#5e6d88', '#232c3d', '#6e7e98'); ring(c, 0, 0, 15, 17.5, T.main, 1.6); } // armour collar
  const r = [0, 11, 12, 13.5][tier];
  cyl(c, 0, 0, r, 18, TURZ[tier] - 18 - 2, '#7383a0', '#2c374b', '#8794ab');
  if (tier >= 2) ring(c, 0, 0, r, 24, 'rgba(255,255,255,0.25)', 1);
  if (tier >= 2) { box(c, -12, 14, 4.5, 4, 6, 7, MAT.metal); sides(c, -12, 14, 4.6, 4.1, 9, 1.4, T.face); } // ammo box
  if (tier >= 3) { box(c, 14, 12, 4, 4.5, 6, 6, MAT.metal); sides(c, 14, 12, 4.1, 4.6, 8, 1.4, T.face); }
  dome(c, 0, 0, r - 1, TURZ[tier] - 2, '#a3b1c6', M.m);
}
function turretLive(c, T, t, b, tier) {
  if (tier >= 3) lamp(c, 15, -15, 45, '255,90,90', 0.25 + 0.75 * (Math.sin(t * 5) > 0.3 ? 1 : 0), 1.6);
  const [hx, hy] = pt(0, 0, TURZ[tier] + 2), a = gunAngle(b, hx, hy, -0.3);
  c.save(); c.translate(hx, hy); c.rotate(a);
  if (tier === 1) {
    c.fillStyle = M.h; c.fillRect(3, -1.6, 17, 3.2); c.fillStyle = M.d; c.fillRect(18, -2.6, 3, 5.2);
    c.fillStyle = T.main; c.fillRect(-5, -3.5, 9, 7);
  } else if (tier === 2) {
    c.fillStyle = M.h; barrels(c, 2, 4, 19, 5, 2.4);
    c.fillStyle = M.d; c.fillRect(19, -4.6, 3.5, 3); c.fillRect(19, 1.6, 3.5, 3); // muzzle brakes
    c.fillStyle = M.l; c.fillRect(-6, -5, 11, 10); c.fillStyle = T.main; c.fillRect(-6, -1.2, 11, 2.4);
  } else { // shrouded rotary cannon: four barrels that spin while it fires
    const spin = b && b.aim ? t * 14 : 0;
    c.fillStyle = M.h;
    for (let k = 0; k < 4; k++) { const o = Math.sin(spin + k * Math.PI / 2) * 3; c.fillRect(8, o - 1, 15, 2); }
    c.fillStyle = M.d; c.fillRect(20, -4, 3.5, 8);
    c.fillStyle = M.l; c.beginPath(); c.moveTo(-7, -6.5); c.lineTo(8, -5); c.lineTo(10, 0); c.lineTo(8, 5); c.lineTo(-7, 6.5); c.closePath(); c.fill();
    c.fillStyle = T.main; c.fillRect(-7, -1.4, 15, 2.8);
    c.fillStyle = M.d; c.fillRect(-7, -6.5, 3, 13);
  }
  c.restore();
}

/* ---------- Barracks ---------- */
function tower(c, u, v, h, top) { // a lattice watchtower with a platform
  box(c, u, v, 4.5, 4.5, 6, h, MAT.metal);
  box(c, u, v, 7, 7, 6 + h, 4, MAT.light);
  if (top) { cone(c, u, v, 6, 1, 10 + h, 5, '#66779a', '#2a3448', null); }
}
function barracksBody(c, T, tier) {
  plinth(c, 32); trim(c, 30, T, tier);
  if (tier >= 2) tower(c, 22, -22, 36, true);
  if (tier >= 3) tower(c, -22, -25, 30, true);
  box(c, -2, 4, 26, 22, 6, 24, MAT.metal);
  sides(c, -2, 4, 26.2, 22.2, 20, 3, T.face);
  // door: armoured frame from T2
  if (tier >= 2) { poly(c, [pt(-28.3, 0, 6), pt(-28.3, 20, 6), pt(-28.3, 20, 22), pt(-28.3, 0, 22)]); c.fillStyle = M.l; c.fill(); }
  poly(c, [pt(-28.4, 2, 6), pt(-28.4, 18, 6), pt(-28.4, 18, 20), pt(-28.4, 2, 20)]); c.fillStyle = M.d; c.fill();
  c.fillStyle = `rgba(${T.glow},0.5)`;
  for (let i = 0; i < 3; i++) { poly(c, [pt(-28.5, 2, 8 + i * 4), pt(-28.5, 18, 8 + i * 4), pt(-28.5, 18, 9.4 + i * 4), pt(-28.5, 2, 9.4 + i * 4)]); c.fill(); }
  if (tier >= 2) { c.strokeStyle = '#ffd34d'; c.lineWidth = 1.2; poly(c, [pt(-28.6, 0, 6), pt(-28.6, 20, 6), pt(-28.6, 20, 22), pt(-28.6, 0, 22)]); c.stroke(); }
  winR(c, -2, 4, 26.2, 22.2, 12, 4, 4, `rgba(196,243,255,0.6)`);
  box(c, -2, 4, 22, 18, 30, 4, MAT.light);
  if (tier === 2) { // roof satellite dish
    pipe(c, pt(8, 12, 34), pt(8, 12, 40), 1.4, M.h);
    const [x, y] = pt(8, 12, 42); c.fillStyle = '#d3dbe8'; c.beginPath(); c.ellipse(x, y, 7.5, 4.5, -0.5, 0, 7); c.fill(); c.strokeStyle = M.m; c.lineWidth = 1.2; c.stroke(); c.fillStyle = M.m; c.beginPath(); c.arc(x, y, 1.4, 0, 7); c.fill();
  }
  if (tier >= 3) { // second storey with a lit team window band and a gold insignia
    box(c, -2, 4, 17, 13, 34, 14, MAT.metal);
    sides(c, -2, 4, 17.2, 13.2, 40, 3, T.face);
    winL(c, -2, 4, 17.3, 13.3, 40.5, 2, 4, T.light); winR(c, -2, 4, 17.3, 13.3, 40.5, 2, 5, T.light);
    box(c, -2, 4, 19, 15, 48, 3, MAT.light);
    const [x, y] = pt(-2, 4, 51); c.fillStyle = '#ffd34d'; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x, y - 4.5); c.lineTo(x + 9, y); c.lineTo(x, y + 4.5); c.closePath(); c.fill();
    c.fillStyle = '#8a6a10'; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x, y - 2); c.lineTo(x + 4, y); c.lineTo(x, y + 2); c.closePath(); c.fill();
  }
}
function barracksLive(c, T, t, b, tier) {
  if (tier >= 2) { // sweeping spotlight from the watchtower
    const [x, y] = pt(22, -22, 46), sw = Math.sin(t * 0.9) * 0.9 + 2.2;
    c.fillStyle = 'rgba(255,240,190,0.2)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(sw - 0.16) * 30, y + Math.sin(sw - 0.16) * 30 * 0.5 + 16); c.lineTo(x + Math.cos(sw + 0.16) * 30, y + Math.sin(sw + 0.16) * 30 * 0.5 + 16); c.closePath(); c.fill();
    glow(c, x, y, 2.4, '255,240,190', 0.7);
  }
  if (tier >= 3) lamp(c, -22, -25, 40, T.glow, 0.3 + 0.6 * blink(t, 2), 1.6);
  const flag = (u, v, z, ph) => {
    const [x, y] = pt(u, v, z);
    c.strokeStyle = M.h; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 22); c.stroke();
    c.fillStyle = T.main; c.beginPath(); c.moveTo(x, y - 22);
    for (let i = 0; i <= 6; i++) c.lineTo(x + i * 3, y - 22 + Math.sin(t * 5 + i + ph) * 1.4);
    for (let i = 6; i >= 0; i--) c.lineTo(x + i * 3, y - 14 + Math.sin(t * 5 + i + ph) * 1.4);
    c.closePath(); c.fill();
  };
  if (tier >= 3) { flag(-14, -6, 51, 0); flag(10, -6, 51, 2); } else flag(-16, -8, 34, 0);
}

/* ---------- War Factory ---------- */
function gantry(c, u0, u1, v, z, h) { // a portal crane frame over the roof
  const col = M.h;
  pipe(c, pt(u0, v, z), pt(u0, v, z + h), 2, col); pipe(c, pt(u1, v, z), pt(u1, v, z + h), 2, col);
  pipe(c, pt(u0, v, z + h), pt(u1, v, z + h), 2.4, col);
  c.fillStyle = '#ffd34d'; const [x, y] = pt((u0 + u1) / 2, v, z + h); c.fillRect(x - 2, y - 1.5, 4, 3);
}
function factoryBody(c, T, tier) {
  plinth(c, 36); trim(c, 34, T, tier);
  cyl(c, -24, -24, 4.5, 6, 44, M.h, M.m, '#9aa7ba');
  if (tier >= 2) cyl(c, -10, -29, 4, 6, 38, M.h, M.m, '#9aa7ba');
  if (tier >= 3) cyl(c, -30, -10, 4, 6, 34, M.h, M.m, '#9aa7ba');
  for (const [u, v, z] of tier >= 2 ? [[-24, -24, 40], [-10, -29, 34]] : [[-24, -24, 40]]) ring(c, u, v, 4.6, z, T.main, 1.6);
  box(c, 0, 2, 32, 28, 6, 28, MAT.metal);
  sides(c, 0, 2, 32.2, 28.2, 24, 3, T.face);
  for (let i = 0; i < 3; i++) {
    box(c, -18 + i * 18, 2, 6, 26, 34, 6, MAT.light);
    const [x, y] = pt(-12 + i * 18, 2, 37);
    c.fillStyle = `rgba(196,243,255,0.35)`; c.fillRect(x - 6, y - 2, 12, 3);
  }
  poly(c, [pt(-16, 30.3, 6), pt(16, 30.3, 6), pt(16, 30.3, 26), pt(-16, 30.3, 26)]); c.fillStyle = M.d; c.fill();
  if (tier >= 2) { // side assembly bay with a conveyor
    box(c, 24, 18, 8, 10, 6, 14, MAT.metal); sides(c, 24, 18, 8.2, 10.2, 16, 2, T.face);
    poly(c, [pt(17, 28.4, 6), pt(31, 28.4, 6), pt(31, 28.4, 13), pt(17, 28.4, 13)]); c.fillStyle = M.d; c.fill();
    c.strokeStyle = '#ffd34d'; c.lineWidth = 1.2; poly(c, [pt(-16.5, 30.5, 6), pt(16.5, 30.5, 6), pt(16.5, 30.5, 26.5), pt(-16.5, 30.5, 26.5)]); c.stroke();
  }
  const gz = 40, gh = tier >= 2 ? 22 : 18, gl = [0, 26, 34, 34][tier];
  if (tier >= 3) { // a half-built tank hull under twin gantries
    box(c, 4, -12, 12, 8, 40, 5, MAT.dark); sides(c, 4, -12, 12.2, 8.2, 42, 2, T.face);
    cyl(c, 6, -12, 5, 45, 3, '#5e6d88', '#232c3d', null);
    c.strokeStyle = 'rgba(196,243,255,0.5)'; c.lineWidth = 0.8; ring(c, 6, -12, 5, 51, 'rgba(196,243,255,0.45)', 0.8);
    gantry(c, -12, 20, -22, gz, 22); gantry(c, -12, 20, -2, gz, 22);
  }
  const [x, y] = pt(20, -20, gz); // crane arm
  c.strokeStyle = M.h; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - gh); c.lineTo(x - gl, y - gh); c.stroke();
  if (tier >= 2) { c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - gh + 6); c.lineTo(x - 10, y - gh); c.stroke(); }
}
function factoryLive(c, T, t, b, tier) {
  const busy = b && b.queue.length;
  c.fillStyle = busy ? `rgba(255,190,90,${0.35 + 0.25 * Math.sin(t * 9)})` : M.l;
  for (let i = 0; i < 5; i++) { poly(c, [pt(-14, 30.4, 8 + i * 3.6), pt(14, 30.4, 8 + i * 3.6), pt(14, 30.4, 9.6 + i * 3.6), pt(-14, 30.4, 9.6 + i * 3.6)]); c.fill(); }
  if (tier >= 2) { // conveyor lights run toward the bay
    for (let i = 0; i < 3; i++) { const k = ((t * 0.8 + i / 3) % 1), [lx, ly] = pt(18 + k * 12, 28.5, 8); c.fillStyle = busy ? '#ffbe5a' : 'rgba(255,190,90,0.45)'; c.fillRect(lx - 1.2, ly - 1, 2.4, 2); }
  }
  if (tier >= 3) {
    winL(c, 0, 2, 32.3, 28.3, 10, 7, 3, `rgba(255,150,60,${0.55 + 0.3 * Math.sin(t * 6)})`); // furnace windows
    if (busy && Math.sin(t * 13) > 0.2) lamp(c, 2 + Math.sin(t * 3) * 6, -12, 47, '255,240,190', 0.9, 1.4); // welding sparks
  }
  const gh = tier >= 2 ? 22 : 18, [x, y] = pt(20, -20, 40);
  c.strokeStyle = M.h; c.lineWidth = 1; c.beginPath(); const hx = x - 16 + Math.sin(t * 0.7) * 6; c.moveTo(hx, y - gh); c.lineTo(hx, y - gh + 10); c.stroke();
  c.fillStyle = '#ffd34d'; c.fillRect(hx - 1.5, y - gh + 10, 3, 2);
}

/* ---------- Tech Lab ---------- */
const TLZ = [0, 78, 80, 88]; // crystal height
function techlabBody(c, T, tier) {
  plinth(c, 30); trim(c, 28, T, tier);
  if (tier >= 2) for (const [u, k] of [[12, 0], [18, 1], [24, 2]]) pipe(c, pt(u, -24 + k * 3, 32), pt(u, -24 + k * 3, 46 + k * 4), 1.1, M.h); // antenna array
  if (tier >= 3) cyl(c, 22, -22, 3, 6, 40, M.h, M.m, '#c49bff');
  box(c, 0, 0, 24, 24, 6, 26, MAT.metal);
  sides(c, 0, 0, 24.2, 24.2, 26, 3, T.face);
  c.globalAlpha = 0.55; winL(c, 0, 0, 24.2, 24.2, 12, 5, 4, T.light); winR(c, 0, 0, 24.2, 24.2, 12, 5, 4, T.light); c.globalAlpha = 1;
  if (tier >= 3) { // bigger, ribbed cone
    cone(c, 0, 0, 17, 4, 32, 38, '#7484a0', '#2a3448', '#9aa7ba');
    const [x0, y0] = pt(0, 0, 32), [x1, y1] = pt(0, 0, 70);
    for (const k of [-0.7, -0.25, 0.25, 0.7]) { const s = Math.sqrt(1 - k * k) * 0.7071; pipe(c, [x0 + k * 17 * 1.2247, y0 + s * 17], [x1 + k * 4 * 1.2247, y1 + s * 4], 1, 'rgba(255,255,255,0.2)'); }
    ring(c, 0, 0, 12, 46, T.main, 1.6);
  } else cone(c, 0, 0, 14, 4, 32, 32, '#7484a0', '#2a3448', '#9aa7ba');
  if (tier >= 2) { // glass dome module
    dome(c, -15, 14, 7.5, 32, 'rgba(196,243,255,0.95)', 'rgba(60,110,150,0.9)');
    ring(c, -15, 14, 7.5, 32, T.main, 1.3);
  }
  if (tier >= 3) cyl(c, -22, 22, 3, 6, 40, M.h, M.m, '#c49bff');
}
function techlabLive(c, T, t, b, tier) {
  const zc = TLZ[tier] + Math.sin(t * 1.5) * 3, [x, y] = pt(0, 0, zc), sp = Math.abs(Math.cos(t * 1.8));
  if (tier >= 2) for (const [u, k] of [[12, 0], [18, 1], [24, 2]]) lamp(c, u, -24 + k * 3, 46 + k * 4, T.glow, 0.3 + 0.6 * blink(t, k * 2), 1.2);
  if (tier >= 3) for (const [u, v] of [[22, -22], [-22, 22]]) { // pylons arc to the crystal
    const [px, py] = pt(u, v, 46);
    c.strokeStyle = `rgba(196,155,255,${0.35 + 0.35 * Math.abs(Math.sin(t * 7 + u))})`; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo((px + x) / 2 + Math.sin(t * 9 + u) * 4, Math.min(py, y) - 8, x, y); c.stroke();
    glow(c, px, py, 2, '196,155,255', 0.7);
  }
  glow(c, x, y, tier >= 3 ? 6 : 5, '196,155,255', 0.25 + (tier >= 3 ? 0.25 : 0));
  const s = tier >= 3 ? 1.2 : 1;
  c.fillStyle = '#c49bff'; c.beginPath(); c.moveTo(x, y - 10 * s); c.lineTo(x + (5 * sp + 1.5) * s, y); c.lineTo(x, y + 10 * s); c.lineTo(x - (5 * sp + 1.5) * s, y); c.closePath(); c.fill();
  if (tier >= 2) { c.strokeStyle = T.main; c.lineWidth = 1.3; c.beginPath(); c.ellipse(x, y, 15, 4 + 2 * Math.sin(t * 2), 0, 0, 7); c.stroke(); }
  if (tier >= 3) {
    c.strokeStyle = '#c49bff'; c.beginPath(); c.ellipse(x, y, 10, 14, t * 0.8, 0, 7); c.stroke();
    c.strokeStyle = `rgba(${T.glow},0.6)`; c.beginPath(); c.ellipse(x, y, 19, 6 + 2 * Math.sin(t * 2 + 1), 0, 0, 7); c.stroke();
  }
}

/* ---------- Reactor ---------- */
function hyper(c, u, v, r, z, h) {
  cone(c, u, v, r, r * 0.68, z, h * 0.6, '#6a7a95', '#2a3448', null);
  cone(c, u, v, r * 0.68, r * 0.84, z + h * 0.6, h * 0.4, '#6a7a95', '#2a3448', '#1a2130');
}
const RH = [0, 48, 50, 54]; // main cooling tower height
function reactorBody(c, T, tier) {
  plinth(c, 30); trim(c, 28, T, tier);
  if (tier >= 3) { hyper(c, 20, -4, 11, 6, 40); ring(c, 20, -4, 9.5, 20, T.main, 1.6); }
  hyper(c, -6, -6, 16, 6, RH[tier]);
  ring(c, -6, -6, 14.2, 14, T.main, 2);
  if (tier >= 3) { pipe(c, pt(12, -4, 14), pt(6, -4, 14), 3, M.l); pipe(c, pt(18, 4, 12), pt(14, 6, 12), 3, M.l); }
  if (tier >= 2) { // coolant tank with a pipe to the core
    cyl(c, -19, 17, 7, 6, 18, '#6e7e98', '#2c374b', '#7d8ca3'); ring(c, -19, 17, 7, 16, T.main, 1.6);
    pipe(c, pt(-12, 17, 12), pt(2, 14, 12), 2.6, M.l);
  }
  box(c, 12, 14, 10, 10, 6, 14, MAT.metal);
  sides(c, 12, 14, 10.2, 10.2, 14, 3, T.face);
  if (tier >= 3) { box(c, 12, 14, 8, 8, 20, 3, MAT.light); }
}
function reactorLive(c, T, t, b, tier) {
  const p = 0.5 + 0.5 * Math.sin(t * 4);
  if (tier >= 2) { ring(c, -6, -6, 12.5, 24, `rgba(93,255,176,${0.4 + 0.4 * p})`, 2); ring(c, -6, -6, 11.5, 34, `rgba(93,255,176,${0.3 + 0.3 * p})`, 1.5); }
  const z = tier >= 3 ? 32 : 28, [x, y] = pt(12, 14, z), r = tier >= 3 ? 7 : 6;
  if (tier >= 3) { // plasma-core sphere
    glow(c, x, y, r + p * 1.5, '93,255,176', 0.35 + 0.35 * p);
    c.fillStyle = `rgba(210,255,235,${0.6 + 0.3 * p})`; c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill();
    c.strokeStyle = 'rgba(93,255,176,0.7)'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, r + 3, 3, t * 1.3, 0, 7); c.stroke();
  } else glow(c, x, y, r, '93,255,176', 0.45 + 0.5 * p);
  c.strokeStyle = `rgba(93,255,176,${0.5 * (tier >= 2 ? 1 : 0.6)})`; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, 9 + p * 2, 0, 7); c.stroke();
}

/* ---------- Refinery ---------- */
function refineryBody(c, T, tier) {
  plinth(c, 32); trim(c, 30, T, tier);
  const fl = tier >= 3 ? 54 : 44;
  if (tier >= 3) { // distillation column with platforms
    cyl(c, 4, -26, 5, 6, 60, '#8a98ae', '#3a465c', '#9aa7ba');
    for (const z of [22, 38, 54]) ring(c, 4, -26, 6.5, z, M.h, 1.4);
  } else if (tier >= 2) cyl(c, 4, -24, 3.5, 6, 34, M.h, M.m, '#9aa7ba');
  cyl(c, 16, -16, 4.5, 6, fl, M.h, M.m, '#9aa7ba'); // chimney / flare stack
  if (tier >= 3) ring(c, 16, -16, 4.6, fl - 4, '#ffd34d', 1.4);
  box(c, 12, -2, 13, 13, 6, 18, MAT.metal);
  sides(c, 12, -2, 13.2, 13.2, 18, 2, T.face);
  const big = tier >= 3;
  for (const [u, v, h, r] of [[-14, -12, big ? 40 : 34, big ? 12 : 10], [-10, 14, 40, 10]]) {
    cyl(c, u, v, r, 6, h, '#6e7e98', '#2c374b', '#7d8ca3');
    ring(c, u, v, r, 22, T.main, 2.2);
    if (tier >= 2) ring(c, u, v, r, 32, T.main, 1.4);
    if (tier >= 2) pipe(c, pt(u + r * 0.7, v, 14), pt(5, v * 0.3 - 2, 14), 2.2, M.l); // pipe rack to the plant
  }
  if (tier >= 2) { // third tank, ore hopper and conveyor
    cyl(c, 18, 18, 7, 6, 26, '#6e7e98', '#2c374b', '#7d8ca3'); ring(c, 18, 18, 7, 18, T.main, 2);
    poly(c, [pt(1, 24, 8), pt(5, 24, 8), pt(5, 12, 13), pt(1, 12, 13)]); c.fillStyle = M.d; c.fill();
    cone(c, 3, 28, 3, 5.5, 8, 8, '#8a6a10', '#4a3a08', '#c79a2a');
  }
}
function refineryLive(c, T, t, b, tier) {
  const [gx, gy] = pt(12, -2, 24);
  c.fillStyle = `rgba(255,211,77,${0.55 + 0.35 * Math.sin(t * 3)})`; c.beginPath(); c.ellipse(gx, gy, 12, 6, 0, 0, 7); c.fill();
  if (tier >= 2) for (let i = 0; i < 2; i++) { const k = (t * 0.6 + i / 2) % 1, [x, y] = pt(3, 24 - k * 12, 8.5 + k * 5); c.fillStyle = '#c79a2a'; c.fillRect(x - 1.5, y - 1.2, 3, 2.4); } // ore on the belt
  if (tier >= 3) {
    glow(c, gx, gy - 3, 3, '255,211,77', 0.8);
    for (const [z, ph] of [[24, 0], [40, 2], [56, 4]]) lamp(c, 4, -26, z, '255,211,77', 0.3 + 0.6 * blink(t, ph), 1.3);
    const [fx, fy] = pt(16, -16, 60), f = 0.75 + 0.25 * Math.sin(t * 17) * Math.sin(t * 7); // flare flame
    c.fillStyle = `rgba(255,150,40,${0.8 * f})`; c.beginPath(); c.moveTo(fx - 3.5, fy); c.quadraticCurveTo(fx - 2, fy - 7 * f, fx + Math.sin(t * 6) * 1.5, fy - 12 * f); c.quadraticCurveTo(fx + 2, fy - 7 * f, fx + 3.5, fy); c.closePath(); c.fill();
    c.fillStyle = `rgba(255,235,160,${0.9 * f})`; c.beginPath(); c.ellipse(fx, fy - 2.5, 1.6, 3.2 * f, 0, 0, 7); c.fill();
  }
}

/* ---------- Habitat ---------- */
const HAB = [null, [[12, -12, 12], [-12, 10, 15]], [[14, -14, 11], [16, 15, 9], [-13, 12, 13]], [[16, -16, 10], [-16, -14, 9], [16, 16, 9], [-15, 15, 11]]];
function habitatBody(c, T, tier) {
  plinth(c, 32); trim(c, 30, T, tier);
  const domes = HAB[tier];
  if (tier >= 2) { // glass tubes between the domes, a garden glow at their feet
    c.lineCap = 'round';
    for (let i = 0; i < domes.length; i++) { const a = domes[i], d = tier >= 3 ? [0, 0] : domes[(i + 1) % domes.length]; pipe(c, pt(a[0], a[1], 9), pt(d[0], d[1], 9), 4, 'rgba(196,243,255,0.35)'); }
    c.lineCap = 'butt';
    for (const [u, v, r] of domes) { const [x, y] = pt(u, v, 6); c.fillStyle = 'rgba(120,255,150,0.16)'; c.beginPath(); c.ellipse(x, y, r * 1.5, r * 0.8, 0, 0, 7); c.fill(); }
  }
  const back = tier >= 3 ? domes.filter(d => d[1] - d[0] < 0) : domes;
  const domeAt = ([u, v, r], k) => {
    ring(c, u, v, r + 1, 6, T.main, 2);
    const green = tier >= 3 && k % 2 === 1;
    dome(c, u, v, r, 6, green ? '#a8f0b8' : '#8a9ab3', green ? '#24503a' : '#2c374b');
    const [x, y] = pt(u, v, 6 + r * 0.45);
    c.fillStyle = green ? 'rgba(160,255,180,0.8)' : T.light; c.globalAlpha = 0.75;
    for (let i = -1; i <= 1; i++) c.fillRect(x + i * r * 0.5 - 1.5, y, 3, 2.4);
    c.globalAlpha = 1;
  };
  back.forEach(d => domeAt(d, domes.indexOf(d)));
  if (tier >= 3) { // central beacon tower
    cyl(c, 0, 0, 5, 6, 32, '#8a98ae', '#3a465c', '#9aa7ba');
    ring(c, 0, 0, 5, 24, T.main, 1.6);
    cyl(c, 0, 0, 7, 38, 3, '#97a7c1', '#4c5a72', '#b6c2d4');
    domes.filter(d => !(d[1] - d[0] < 0)).forEach(d => domeAt(d, domes.indexOf(d)));
  }
  const [mu, mv, mr] = domes[0];
  pipe(c, pt(mu, mv, 6 + mr * 1.05), pt(mu, mv, 6 + mr * 1.05 + 14), 1.4, M.h);
}
function habitatLive(c, T, t, b, tier) {
  const [mu, mv, mr] = HAB[tier][0];
  lamp(c, mu, mv, 6 + mr * 1.05 + 14, T.glow, 0.55 + 0.45 * Math.sin(t * 4 + mu), 2);
  if (tier >= 3) { const [x, y] = pt(0, 0, 44); glow(c, x, y, 2.6, T.glow, 0.45 + 0.45 * blink(t, 1)); }
}

/* ---------- Signature buildings (v2.32): the Salvage Yard, the Fortification Depot and the node bunker ----------
   Industrial steel, rivets, exposed machinery and amber work lights, with welded additions that make each tier more
   armoured and better armed. Same rules as the other buildings: everything stays on the pad and below the health bar. */
const AMB = '255,170,60', CONC = ['#8d8b82', '#5f5d56', '#45433e'], RUST = ['#7a5a3c', '#553d28', '#3c2a1b'], CRATE = ['#8a7448', '#5e4e2f', '#45391f'];
function rivets(c, u, v, a, b, z, n) { // rivet heads along the top edge of a block's left and right faces
  c.fillStyle = 'rgba(214,222,236,0.6)';
  for (let i = 0; i < n; i++) {
    const k = -1 + (2 * i + 1) / n;
    let [x, y] = pt(u - a - 0.2, v + k * b, z); c.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
    [x, y] = pt(u + k * a, v + b + 0.2, z); c.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
  }
}
function hazard(c, u, v, a, b, z, h) { // yellow and black stripes across a block's right face
  poly(c, [pt(u - a, v + b + 0.1, z), pt(u + a, v + b + 0.1, z), pt(u + a, v + b + 0.1, z + h), pt(u - a, v + b + 0.1, z + h)]); c.fillStyle = '#e8b830'; c.fill();
  c.fillStyle = '#1d1f22';
  for (let s0 = -a; s0 < a; s0 += 4) poly(c, [pt(u + s0, v + b + 0.2, z), pt(u + Math.min(a, s0 + 2), v + b + 0.2, z), pt(u + Math.min(a, s0 + 2 + h * 0.6), v + b + 0.2, z + h), pt(u + Math.min(a, s0 + h * 0.6), v + b + 0.2, z + h)]), c.fill();
}
function scrapHeap(c, u, v, r, h) { // a heap of scrap: a dark mound with plates and girders sticking out (fixed shapes)
  cone(c, u, v, r, r * 0.3, 6, h, '#6a6157', '#2b2620', '#5e554b');
  for (const [du, dv, dz, w, tilt, col] of [[-0.45, 0.2, 0.35, 0.55, -6, RUST[0]], [0.35, 0.3, 0.55, 0.45, 5, '#8e98a8'], [0.05, -0.4, 0.75, 0.4, -3, RUST[1]], [-0.2, 0.55, 0.15, 0.5, 4, '#6f7a8c']]) {
    const [x, y] = pt(u + du * r, v + dv * r, 6 + dz * h); c.fillStyle = col;
    c.beginPath(); c.moveTo(x - w * r, y); c.lineTo(x + w * r * 0.6, y + tilt * 0.4); c.lineTo(x + w * r * 0.7, y + tilt * 0.4 - 3); c.lineTo(x - w * r * 0.9, y - 3.4); c.closePath(); c.fill();
  }
  pipe(c, pt(u - r * 0.3, v - r * 0.2, 6 + h * 0.5), pt(u + r * 0.4, v + r * 0.1, 6 + h * 1.05), 1.8, '#9aa3b0'); // a girder
}
function sandbags(c, u0, v0, u1, v1, z, n) { // a row of sandbags between two points
  for (let i = 0; i < n; i++) { const k = (i + 0.5) / n, [x, y] = pt(lerp(u0, u1, k), lerp(v0, v1, k), z); c.fillStyle = '#9b8a62'; c.beginPath(); c.ellipse(x, y - 1.8, 3.4, 2.2, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x - 3, y - 0.4, 6, 0.8); }
}
/* Salvage Yard: T1 a scrap heap, a sorting shed and a magnet crane; T2 adds a compactor, a conveyor and a second heap;
   T3 an armoured smelter with a furnace and an autocannon on the shed roof. Overdrive (T3) makes the furnace roar. */
function yardBody(c, T, tier) {
  plinth(c, 32); trim(c, 30, T, tier);
  pipe(c, pt(-6, -26, 6), pt(-6, -26, 42), 2.4, M.h); // the crane mast, at the back
  if (tier >= 2) for (let z = 12; z < 42; z += 7) pipe(c, pt(-6, -26, z), pt(-6, -26, z + 6), 4, 'rgba(232,184,48,0.35)'); // lattice
  if (tier >= 3) { // the smelter: welded armour, a furnace mouth and a chimney
    box(c, 20, -14, 9, 9, 6, 24, MAT.dark); sides(c, 20, -14, 9.2, 9.2, 24, 2.5, T.face); rivets(c, 20, -14, 9.2, 9.2, 28, 4);
    cyl(c, 24, -18, 3.2, 30, 12, '#5e6d88', '#232c3d', '#2b2f36');
    poly(c, [pt(15, -4.8, 8), pt(25, -4.8, 8), pt(25, -4.8, 17), pt(15, -4.8, 17)]); c.fillStyle = '#2a1408'; c.fill();
  } else if (tier >= 2) { // the compactor
    box(c, 20, -14, 8, 8, 6, 14, MAT.dark); hazard(c, 20, -14, 8.2, 8.2, 8, 4); rivets(c, 20, -14, 8.2, 8.2, 20, 3);
  }
  if (tier >= 3) { box(c, -12, -8, 15, 15, 6, 5, RUST); rivets(c, -12, -8, 15, 15, 11, 7); } // a welded armour skirt
  // the sorting shed: corrugated steel, an amber-lit bay door
  box(c, -12, -8, 12, 12, 6, 17, MAT.metal); sides(c, -12, -8, 12.2, 12.2, 19, 2, T.face); rivets(c, -12, -8, 12.2, 12.2, 22.6, 5);
  c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 0.7;
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(...pt(-12 + i * 4, 4.3, 6)); c.lineTo(...pt(-12 + i * 4, 4.3, 18)); c.stroke(); } // corrugation
  poly(c, [pt(-24.3, -14, 6), pt(-24.3, -2, 6), pt(-24.3, -2, 17), pt(-24.3, -14, 17)]); c.fillStyle = M.d; c.fill();
  c.fillStyle = `rgba(${AMB},0.55)`; poly(c, [pt(-24.4, -14, 15), pt(-24.4, -2, 15), pt(-24.4, -2, 16.4), pt(-24.4, -14, 16.4)]); c.fill();
  box(c, -12, -8, 13.5, 13.5, 23, 2.2, MAT.light);
  if (tier >= 3) cyl(c, -12, -8, 4.5, 25, 4, '#6e7e98', '#2c374b', '#7d8ca3'); // the gun mount
  if (tier >= 2) { pipe(c, pt(-2, 2, 12), pt(8, 10, 22), 3.4, M.l); pipe(c, pt(-2, 2, 12.5), pt(8, 10, 22.5), 1, '#9aa3b0'); } // conveyor from the shed up the heap
  if (tier >= 2) scrapHeap(c, -16, 20, 9, 12);
  scrapHeap(c, 14, 14, 13, tier >= 2 ? 22 : 18); // the main heap, out front
}
function yardLive(c, T, t, b, tier) {
  const sw = Math.sin(t * 0.6) * 0.45 + 0.35, [mx, my] = pt(-6, -26, 42), jx = mx + Math.cos(sw) * 22, jy = my + Math.sin(sw) * 9 - 2;
  c.strokeStyle = M.h; c.lineWidth = 1.8; c.beginPath(); c.moveTo(mx, my); c.lineTo(jx, jy); c.stroke(); // jib
  const drop = 10 + 4 * Math.sin(t * 0.9);
  c.strokeStyle = M.d; c.lineWidth = 0.8; c.beginPath(); c.moveTo(jx, jy); c.lineTo(jx, jy + drop); c.stroke(); // cable
  c.fillStyle = '#3b4250'; c.beginPath(); c.ellipse(jx, jy + drop + 1.5, 4, 1.8, 0, 0, 7); c.fill(); c.fillStyle = '#c94b2e'; c.fillRect(jx - 4, jy + drop, 8, 1.2); // magnet
  glow(c, mx, my - 1.5, 1.8, AMB, 0.35 + 0.6 * blink(t, 0)); // amber work light
  if (tier >= 2) lamp(c, 20, -14, tier >= 3 ? 31 : 21, AMB, 0.3 + 0.6 * (Math.sin(t * 7) > 0 ? 1 : 0), 1.4); // compactor / smelter warning light
  if (tier >= 3) { // the furnace and the roof autocannon
    const od = b && game && game.sides[b.side] && overdrive(game, b.side), f = od ? 0.85 + 0.15 * Math.sin(t * 19) : 0.45 + 0.15 * Math.sin(t * 3);
    poly(c, [pt(15.5, -4.7, 8.5), pt(24.5, -4.7, 8.5), pt(24.5, -4.7, 16.5), pt(15.5, -4.7, 16.5)]); c.fillStyle = `rgba(255,${od ? 150 : 110},40,${f})`; c.fill();
    const [cx, cy] = pt(24, -18, 42); if (od) { glow(c, cx, cy - 2, 2.4, '255,140,40', 0.8); for (let i = 0; i < 3; i++) { const k = (t * 1.6 + i / 3) % 1; c.fillStyle = `rgba(255,200,90,${1 - k})`; c.fillRect(cx - 1 + Math.sin(t * 9 + i) * 3, cy - 4 - k * 14, 1.6, 1.6); } }
    const [hx, hy] = pt(-12, -8, 30), a = gunAngle(b, hx, hy, -0.4);
    c.save(); c.translate(hx, hy); c.rotate(a); c.fillStyle = M.h; barrels(c, 2, 2, 13, 3, 1.8); c.fillStyle = M.l; c.fillRect(-4, -3.4, 7, 6.8); c.fillStyle = `rgb(${AMB})`; c.fillRect(-4, -0.8, 7, 1.6); c.restore();
  }
}
/* Fortification Depot: T1 a concrete blockhouse behind sandbags with ammunition crates and a radar; T2 adds a field
   hospital (it heals) and a wall; T3 armour plating and a twin anti-air gun on the roof (bunkers then hit aircraft). */
function depotBody(c, T, tier) {
  plinth(c, 32); trim(c, 30, T, tier);
  if (tier >= 2) { box(c, 20, -18, 9, 9, 6, 12, ['#d9d6cc', '#a7a397', '#8a867a']); poly(c, [pt(11, -20, 6), pt(11, -16, 6), pt(11, -16, 18), pt(11, -20, 18)]); c.fillStyle = '#3b3a35'; c.fill(); } // the field hospital
  if (tier >= 3) { box(c, 4, -2, 22.5, 17.5, 6, 7, MAT.dark); rivets(c, 4, -2, 22.5, 17.5, 13, 8); sides(c, 4, -2, 22.6, 17.6, 11, 1.4, ['', '#b8862e', '#8e6623']); } // welded armour skirt
  box(c, 4, -2, 20, 15, 6, tier >= 3 ? 20 : 17, CONC); // the blockhouse
  sides(c, 4, -2, 20.2, 15.2, tier >= 3 ? 22 : 19, 2, T.face);
  poly(c, [pt(-16.3, -10, 14), pt(-16.3, 8, 14), pt(-16.3, 8, 16.5), pt(-16.3, -10, 16.5)]); c.fillStyle = '#121418'; c.fill(); // firing slit
  winR(c, 4, -2, 20.2, 15.3, 14, 2.5, 5, '#121418');
  box(c, 4, -2, 21, 16, tier >= 3 ? 26 : 23, 2.4, CONC);
  sandbags(c, -26, -18, -26, 18, 6, 7); sandbags(c, -24, 24, 14, 24, 6, 7);
  if (tier >= 2) { box(c, -26, 0, 2, 20, 9, 5, CONC); sandbags(c, -26, -18, -26, 18, 14, 7); } // a wall, sandbags on top
  for (const [u, v, z] of [[-14, 22, 6], [-6, 22, 6], [-10, 22, 12]]) { box(c, u, v, 3.6, 3, z, 6, CRATE); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(...pt(u - 3.6, v + 3, z + 3)); c.lineTo(...pt(u + 3.6, v + 3, z + 3)); c.stroke(); } // ammunition crates
  if (tier >= 3) box(c, 4, -2, 7, 7, 28, 4, MAT.metal); // the gun ring
  pipe(c, pt(18, 10, tier >= 3 ? 28 : 25), pt(18, 10, 40), 1.4, M.h); // radar mast
}
function depotLive(c, T, t, b, tier) {
  const [mx, my] = pt(18, 10, 40), w = 6 * Math.cos(t * 1.4);
  c.fillStyle = w > 0 ? M.h : M.l; c.beginPath(); c.ellipse(mx, my, Math.abs(w) + 1, 3, 0, 0, 7); c.fill(); // radar
  glow(c, mx, my - 3, 1.6, AMB, 0.3 + 0.7 * blink(t, 1));
  lamp(c, -16.5, 18, 18, AMB, 0.35 + 0.5 * blink(t, 3), 1.4);
  if (tier >= 2) { // a red-cross lamp on the field hospital (green: it heals)
    const [x, y] = pt(20, -18, 22), p = 0.55 + 0.35 * Math.sin(t * 3);
    c.fillStyle = `rgba(93,255,138,${p})`; c.fillRect(x - 3.5, y - 1.2, 7, 2.4); c.fillRect(x - 1.2, y - 3.5, 2.4, 7);
  }
  if (tier >= 3) { // the twin anti-air gun: tracks its target, or sweeps the sky
    const [hx, hy] = pt(4, -2, 33), a = b && b.aim ? gunAngle(b, hx, hy, -1.1) : -1.1 - 0.5 * Math.abs(Math.sin(t * 0.5)) * (b && b.side === 1 ? -1 : 1) + (b && b.side === 1 ? -0.9 : 0);
    c.save(); c.translate(hx, hy); c.rotate(a); c.fillStyle = M.h; barrels(c, 2, 2, 16, 4, 2); c.fillStyle = M.d; c.fillRect(15, -3.5, 2.5, 7);
    c.fillStyle = M.l; c.fillRect(-5, -4.5, 9, 9); c.fillStyle = `rgb(${AMB})`; c.fillRect(-5, -1, 9, 2); c.restore();
  }
}
/* The node bunker: a low concrete pillbox ringed with sandbags; its gun turns to its target. T2: a green heal light;
   T3: a twin anti-air mount with a shield plate. */
function arcFront(c, u, v, r, z, col, lw) { const [x, y] = pt(u, v, z); c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.ellipse(x, y, r * 1.2247, r * 0.7071, 0, 0.15, Math.PI - 0.15); c.stroke(); } // the visible front half of a ring
function bunkerBody(c, T, tier) {
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 0, 20, 11, 0, 0, 7); c.fill();
  const bag = a => { const [x, y] = pt(Math.cos(a) * 14, Math.sin(a) * 14, 0); c.fillStyle = '#9b8a62'; c.beginPath(); c.ellipse(x, y - 2, 4, 2.4, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(x - 3.4, y - 1.6, 6.8, 0.7); };
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; if (Math.sin(a) - Math.cos(a) < 0) bag(a); } // the back half of the sandbag ring
  cyl(c, 0, 0, 10.5, 2, 9, CONC[1], CONC[2], null);
  cone(c, 0, 0, 10.5, 7.5, 11, 4, CONC[0], CONC[1], CONC[0]); // sloped concrete roof
  arcFront(c, 0, 0, 10.6, 8.5, '#121418', 2.2); // the firing slit
  arcFront(c, 0, 0, 10.7, 4, T.main, 1.4);
  if (tier >= 3) { cyl(c, 0, 0, 5.5, 15, 3, '#6e7e98', '#2c374b', '#7d8ca3'); } // the anti-air mount's ring
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; if (Math.sin(a) - Math.cos(a) >= 0) bag(a); } // the front half
}
function bunkerLive(c, T, t, b, tier) {
  if (tier >= 2) lamp(c, -6, 6, 13, '93,255,138', 0.35 + 0.55 * blink(t, 0), 1.4);
  const [hx, hy] = pt(0, 0, tier >= 3 ? 19 : 16.5), a = gunAngle(b, hx, hy, tier >= 3 ? -0.8 : -0.3);
  c.save(); c.translate(hx, hy); c.rotate(a);
  if (tier >= 3) { c.fillStyle = M.h; barrels(c, 2, 2, 13, 3.4, 1.8); c.fillStyle = M.l; c.fillRect(-4, -4, 7, 8); c.fillStyle = `rgb(${AMB})`; c.fillRect(-4, -0.8, 7, 1.6); }
  else { c.fillStyle = M.h; c.fillRect(2, -1.2, 11, 2.4); c.fillStyle = M.l; c.fillRect(-4, -3, 7, 6); c.fillStyle = T.main; c.fillRect(-4, -0.8, 7, 1.6); }
  c.restore();
}

// Static bodies and live parts, per type
const BART = {
  hq: [hqBody, hqLive], turret: [turretBody, turretLive], barracks: [barracksBody, barracksLive], factory: [factoryBody, factoryLive],
  techlab: [techlabBody, techlabLive], reactor: [reactorBody, reactorLive], refinery: [refineryBody, refineryLive], habitat: [habitatBody, habitatLive],
  sigA: [yardBody, yardLive], sigB: [depotBody, depotLive], bunker: [bunkerBody, bunkerLive], // v2.32
};
const DRAW_B = {}; // the whole building, drawn live (card icons, and while the cache fills)
for (const k in BART) DRAW_B[k] = (c, T, t, b, tier) => { BART[k][0](c, T, tier); BART[k][1](c, T, t, b, tier); };
