// Unit sprite sheet and battle snapshots, for before/after comparisons of the unit art.
//   node tests/unit-sheet.js [outDir] [--tag=name] [--narrow]
// Saves <tag>-units.png (every unit, both teams, idle and two walk phases, enlarged and at game size)
// and <tag>-battle.png (a large mid-map battle at iPhone size). Set EE_HTML to draw another copy of the game.
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const SHEET = () => {
  const types = UNIT_ORDER, Z = 3, colW = 150, rowH = 175, small = 90;
  const rows = [['Blue idle', 0, false, 0], ['Blue moving', 0, true, 0.12], ['Blue moving', 0, true, 0.45], ['Red idle', 1, false, 0], ['Red moving', 1, true, 0.3]];
  const W = 90 + types.length * colW, H = 30 + rows.length * rowH + small;
  const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2;
  const c = cv.getContext('2d'); c.scale(2, 2);
  c.fillStyle = '#1d2a22'; c.fillRect(0, 0, W, H);
  c.font = '600 12px -apple-system,system-ui,sans-serif'; c.fillStyle = '#cfd8e6'; c.textAlign = 'center';
  types.forEach((t, i) => c.fillText(UDEF[t].name, 90 + i * colW + colW / 2, 18));
  c.textAlign = 'left';
  rows.forEach(([label, side, moving, anim], r) => {
    const y = 30 + r * rowH + rowH - 18;
    c.fillStyle = '#cfd8e6'; c.fillText(label, 8, y - 30);
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.moveTo(80, y); c.lineTo(W, y); c.stroke();
    types.forEach((t, i) => {
      const d = UDEF[t];
      c.save(); c.translate(90 + i * colW + colW / 2 - 20, y - (d.air ? 30 : 0)); c.scale(Z * 0.85, Z * 0.85);
      DRAW_U[t](c, TEAM[side], { anim, moving, recoil: 0, face: 1 });
      c.restore();
    });
  });
  const y = 30 + rows.length * rowH + small - 16; // game size: US scale at the phone's 2× pixels
  c.fillStyle = '#cfd8e6'; c.fillText('Game size', 8, y - 12);
  types.forEach((t, i) => {
    for (const side of [0, 1]) {
      c.save(); c.translate(90 + i * colW + colW / 2 - 30 + side * 46, y - (UDEF[t].air ? 22 : 0)); c.scale(US * (side ? -1 : 1), US);
      DRAW_U[t](c, TEAM[side], { anim: 0.2, moving: false, recoil: 0 });
      c.restore();
    }
  });
  return cv.toDataURL('image/png').split(',')[1];
};

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'units';
  const device = args.includes('--narrow') ? NARROW : PHONE;
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  try {
    const { page, errors } = await openPage(browser, device, { init: 'Math.random = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
    const f1 = path.join(outDir, `${tag}-units.png`);
    fs.writeFileSync(f1, Buffer.from(await page.evaluate(SHEET), 'base64')); console.log(f1);
    // a large battle in view, paused mid-fight
    await page.click('#bPlay');
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); camTouched = true; cam.x = L / 2; clampCam();
      for (const s of [0, 1]) { game.sides[s].aiT = 1e9; game.sides[s].stance = 'attack'; }
      const army = { rifle: 20, heavy: 8, sniper: 4, tank: 4, artillery: 2, titan: 1, aircraft: 2, interceptor: 2 };
      for (const s of [0, 1]) for (const [t, n] of Object.entries(army)) for (let i = 0; i < n; i++) spawnUnit(game, s, t, L / 2 + (s ? 1 : -1) * (60 + Math.random() * 150), (Math.random() - 0.5) * 200);
      for (let i = 0; i < 40; i++) update(game, 1 / 30);
      updateIntro(); cam.x = L / 2; clampCam(); // play zoom (the intro's wide view ends at GO)
      paused = true;
    });
    await page.waitForTimeout(200);
    const f2 = path.join(outDir, `${tag}-battle-${device.width}x${device.height}.png`);
    await page.screenshot({ path: f2 }); console.log(f2);
    if (errors.length) console.log('ERRORS', errors);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
