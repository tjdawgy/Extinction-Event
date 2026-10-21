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
    await page.waitForFunction(() => game.countdown > 0 && game.countdown <= 2);
    await page.click('#cards .card[data-type="barracks"]'); // refused: "Wait for GO"
    await shot(page, '3-countdown');
    await page.waitForFunction(() => game.countdown === 0);
    await page.click('#cards .card[data-type="barracks"]');
    await page.waitForTimeout(150);
    await shot(page, '4-go');
    await page.waitForTimeout(1200);
    await shot(page, '5-home-view');
    // Fog of war: a Gunship scouts the enemy side, then the view after it is gone (ghosts on explored ground)
    await page.evaluate(() => {
      game.sides[1].aiT = 1e9; game.sides[1].res.c = game.sides[1].res.e = 1e5;
      tryBuild(game, 1, 'refinery', 1); tryBuild(game, 1, 'barracks', 3);
      for (let i = 0; i < 450; i++) update(game, 1 / 30);
      for (const u of [1060, 1090, 1120]) { const e = spawnUnit(game, 1, 'rifle', u, (u - 1090) * 2); e.holdU = u; e.holdV = e.v; }
      game.sides[1].stance = 'hold';
      const sc = spawnUnit(game, 0, 'aircraft', 1150, 0); sc.holdU = 1150; sc.holdV = 0; game.sides[0].stance = 'hold';
      update(game, 1 / 30); cam.x = 1150; cam.vx = 0; clampCam(); camTouched = true;
    });
    await page.waitForTimeout(500);
    await shot(page, '6-fog-scouting');
    await page.evaluate(() => { for (const e of game.ents) if (e.side === 0 && e.kind === 'u') { e.hp = 0; e.dead = true; } update(game, 1 / 30); });
    await page.waitForTimeout(400);
    await shot(page, '7-fog-ghosts');
    await page.evaluate(() => {
      for (const e of game.ents) if (e.side === 1 && e.kind === 'u') { e.hp = 0; e.dead = true; }
      const art = spawnUnit(game, 0, 'artillery', 640, 0), spot = spawnUnit(game, 0, 'rifle', 900, 0), foe = spawnUnit(game, 1, 'heavy', 1050, 0);
      for (const e of [art, spot, foe]) { e.holdU = e.u; e.holdV = e.v; }
      update(game, 1 / 30); cam.x = 860; clampCam();
    });
    await page.waitForFunction(() => game.projs.some(p => p.weapon === 'shell' && p.t > 0.5), null, { timeout: 8000 });
    await shot(page, '8-fog-artillery-spotter');
    await page.evaluate(() => { cam.x = homeX(); clampCam(); });
    // A damaged, exposed HQ with its world bar in view, and an enemy HQ about to fall
    await page.evaluate(() => {
      for (const b of game.ents) if (b.kind === 'b' && b.type !== 'hq') b.hp = 0, b.dead = true;
      game.ents = game.ents.filter(e => e.hp > 0); game.sides[0].slots.fill(null);
      game.sides[0].hq.hp = game.sides[0].hq.maxHp * 0.45;
      refreshUI(true);
    });
    await page.waitForTimeout(400);
    await shot(page, '9-hq-exposed-damaged');
    await page.evaluate(() => { const hq = game.sides[1].hq; kill(game, hq, 0); refreshUI(true); });
    await page.waitForTimeout(300);
    await shot(page, '10-enemy-hq-destroyed');
    await page.waitForTimeout(2200);
    await shot(page, '11-victory');
    if (errors.length) { console.error('Page errors:', errors); process.exitCode = 1; }
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
