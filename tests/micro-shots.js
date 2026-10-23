// Micro-control screenshots (v2.12): the three tabs, the Army tab (owned groups and types only), a selection
// highlighted on the battlefield, a Regroup on its way with its flag, and the layout next to the ability buttons.
//   node tests/micro-shots.js [outDir] [--narrow] [--tag=micro]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const device = args.includes('--narrow') ? NARROW : PHONE;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'micro';
  const res = `${device.width}x${device.height}`;
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const shots = [];
  try {
    const { page, errors } = await openPage(browser, device, { init: 'Math.random = (() => { let a = 5; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
    await page.click('#bPlay'); await page.waitForTimeout(300);
    const snap = async (label, file) => { await page.waitForTimeout(100); const img = await page.screenshot(); shots.push({ label, img: img.toString('base64') }); if (file) { const f = path.join(outDir, `${tag}-${file}-${res}.png`); fs.writeFileSync(f, img); console.log(f); } };
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); paused = false; speed = 1; // orders need a running, unpaused match
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 5000; }
      for (const k of ['barracks', 'factory', 'techlab']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.type === k && b.side === 0) { b.built = true; b.progress = 1; } }
      const mk = (t, n, u0) => { for (let i = 0; i < n; i++) spawnUnit(game, 0, t, u0 + (i % 4) * 14, ((i % 3) - 1) * 45); };
      mk('rifle', 8, 520); mk('heavy', 4, 560); mk('tank', 3, 600); mk('artillery', 2, 470); mk('aircraft', 2, 620);
      setStance(game, 0, 'hold');
      window.__frames = n => { for (let i = 0; i < n; i++) { update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); } refreshUI(true); };
      cam.x = hqPos(0).u + 360; clampCam(); __frames(2);
    });
    await page.click('.tabs [data-tab="train"]'); await snap('Train tab (was "Army")');
    await page.click('.tabs [data-tab="army"]'); await snap('Army tab: owned groups and types, order buttons', 'army-tab');
    await page.click('#asel [data-k="g:arm"]'); await page.evaluate(() => __frames(1)); await snap('Armor selected: highlighted on the battlefield', 'selected');
    await page.click('#acmd [data-o="move"]'); await snap('Regroup: tap the battlefield');
    await page.evaluate(() => { const w = P(hqPos(0).u + 620, 60); rgTap(V.cw / 2 + (w.x - cam.x) * V.S, V.A + (w.y - Y_BOT) * V.S); __frames(45); });
    await snap('Armor regrouping: the flag marks the spot', 'regroup');
    await page.evaluate(() => __frames(30 * 25)); await snap('Arrived: the flag is gone, they hold there');
    await page.click('#asel [data-k="t:rifle"]'); await page.click('#acmd [data-o="attack"]'); await page.evaluate(() => __frames(30)); await snap('Riflemen only: Attack (the rest keep their orders)');
    await page.evaluate(() => { game.sides[0].ab = { shield: 0, strike: 0, repair: 0 }; refreshUI(true); });
    await page.click('#abil .ab[data-k="shield"]'); await snap('Ability targeting while the Army tab is open', 'layout-abilities');
    if (errors.length) console.log('ERRORS', errors);
  } finally {
    const sheet = await browser.newPage({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 1 });
    await sheet.setContent(`<style>body{margin:0;background:#0b0f18;color:#cfd8e6;font:600 15px system-ui;display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:8px}figure{margin:0}img{width:100%;display:block}figcaption{padding:3px 0}</style>
      ${shots.map(s => `<figure><figcaption>${s.label}</figcaption><img src="data:image/png;base64,${s.img}"></figure>`).join('')}`);
    const f = path.join(outDir, `${tag}-sheet-${res}.png`);
    await sheet.screenshot({ path: f, fullPage: true }); console.log(f);
    await browser.close();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
