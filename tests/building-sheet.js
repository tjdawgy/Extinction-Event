// Building audit: every building at T1, T2 and T3 for both teams (enlarged), plus a full base in game at
// T1 and at T3. Set EE_HTML to draw another copy of the game (before/after).
//   node tests/building-sheet.js [outDir] [--narrow] [--tag=name]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const SHEET = () => {
  const types = ['hq', 'turret', 'barracks', 'factory', 'techlab', 'reactor', 'refinery', 'habitat'];
  const Z = 1.25, colW = 190, rowH = 200, W = 120 + 6 * colW, H = 40 + types.length * rowH;
  const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2;
  const c = cv.getContext('2d'); c.scale(2, 2);
  c.fillStyle = '#1d2a22'; c.fillRect(0, 0, W, H);
  c.font = '600 13px -apple-system,system-ui,sans-serif'; c.fillStyle = '#cfd8e6'; c.textAlign = 'center';
  [['Blue', 0], ['Red', 1]].forEach(([n, s]) => [1, 2, 3].forEach(tier => c.fillText(`${n} T${tier}`, 120 + (s * 3 + tier - 1) * colW + colW / 2, 24)));
  types.forEach((type, r) => {
    const d = BDEF[type], y = 40 + r * rowH + rowH - 30;
    c.textAlign = 'left'; c.fillStyle = '#cfd8e6'; c.fillText(d.name, 8, y - 60);
    for (const s of [0, 1]) for (const tier of [1, 2, 3]) {
      c.save(); c.translate(120 + (s * 3 + tier - 1) * colW + colW / 2, y - 10); c.scale(Z, Z);
      const b = { side: s, tier, queue: [], aim: null, u: 0, v: 0 };
      DRAW_B[type](c, TEAM[s], 1.3, b, tier);
      c.restore();
    }
  });
  return cv.toDataURL('image/png').split(',')[1];
};

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const device = args.includes('--narrow') ? NARROW : PHONE;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'buildings';
  const res = `${device.width}x${device.height}`;
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  try {
    const { page, errors } = await openPage(browser, device);
    if (!args.includes('--narrow')) { const f = path.join(outDir, `${tag}-tiers.png`); fs.writeFileSync(f, Buffer.from(await page.evaluate(SHEET), 'base64')); console.log(f); }
    await page.click('#bPlay'); await page.waitForTimeout(300);
    for (const tier of [1, 3]) {
      await page.evaluate(tier => {
        game = newGame('normal', {}); game.countdown = 0; hideCountdown(); hideOverlay(); updateIntro(); paused = true; running = true;
        for (const s of [0, 1]) { game.sides[s].aiT = 1e9; game.sides[s].res.c = game.sides[s].res.e = 1e6; }
        const kinds = ['refinery', 'reactor', 'habitat', 'barracks', 'turret', 'factory', 'techlab', 'refinery'];
        for (const s of [0, 1]) for (let i = 0; i < 8; i++) { tryBuild(game, s, kinds[i], i); for (const b of game.ents) if (b.kind === 'b') { b.built = true; b.progress = 1; } } // finish each so the next one's requirement is met
        for (const b of game.ents) if (b.kind === 'b') { b.built = true; b.progress = 1; b.tier = tier; b.maxHp = BDEF[b.type].hp * hpMul(BDEF[b.type], tier); b.hp = b.maxHp; }
        for (let i = 0; i < 3; i++) update(game, 1 / 30);
        game.fog[0].vis.fill(1); cam.x = hqPos(0).u + 260; clampCam(); refreshUI(true);
      }, tier);
      await page.waitForTimeout(250);
      const f = path.join(outDir, `${tag}-base-T${tier}-${res}.png`); await page.screenshot({ path: f }); console.log(f);
    }
    if (errors.length) console.log('ERRORS', errors);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
