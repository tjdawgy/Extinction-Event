// Screenshot renderer: loads index.html in headless Chromium at iPhone landscape size
// (858×396 points, safe areas top 72 / bottom 21 / sides 54) and saves PNGs of key moments.
//   node tests/screenshot.js [outDir] [--narrow]
// Uses Playwright (local or global install). A real browser is used rather than a bare canvas
// library because the top bar, cards and overlays are HTML, not canvas.
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const device = args.includes('--narrow') ? NARROW : PHONE;
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed: npm i -D playwright && npx playwright install chromium'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const tag = `${device.width}x${device.height}`;
  const shot = async (page, name) => { const f = path.join(outDir, `${tag}-${name}.png`); await page.screenshot({ path: f }); console.log(f); };
  try {
    const { page, errors } = await openPage(browser, device);
    await shot(page, '1-title');
    await page.click('#bPlay');
    await page.waitForTimeout(500);
    await shot(page, '2-intro-both-bases');
    await page.click('#cards .card[data-type="barracks"]'); // queued during the countdown
    await page.waitForFunction(() => game.countdown > 0 && game.countdown <= 2);
    await shot(page, '3-countdown');
    await page.waitForFunction(() => game.countdown === 0);
    await page.waitForTimeout(150);
    await shot(page, '4-go');
    await page.waitForTimeout(1200);
    await shot(page, '5-home-view');
    // A damaged, exposed HQ with its world bar in view, and an enemy HQ about to fall
    await page.evaluate(() => {
      for (const b of game.ents) if (b.kind === 'b' && b.type !== 'hq') b.hp = 0, b.dead = true;
      game.ents = game.ents.filter(e => e.hp > 0); game.sides[0].slots.fill(null);
      game.sides[0].hq.hp = game.sides[0].hq.maxHp * 0.45;
      refreshUI(true);
    });
    await page.waitForTimeout(400);
    await shot(page, '6-hq-exposed-damaged');
    await page.evaluate(() => { const hq = game.sides[1].hq; kill(game, hq, 0); refreshUI(true); });
    await page.waitForTimeout(300);
    await shot(page, '7-enemy-hq-destroyed');
    await page.waitForTimeout(2200);
    await shot(page, '8-victory');
    if (errors.length) { console.error('Page errors:', errors); process.exitCode = 1; }
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
