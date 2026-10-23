// Extinction Event screenshots: the countdown in the top bar, the 30-second warning, the storm over the
// player's base, and the end screen when the score decides.
//   node tests/storm-shots.js [outDir] [--narrow] [--tag=step6b]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const device = args.includes('--narrow') ? NARROW : PHONE;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'storm';
  const res = `${device.width}x${device.height}`;
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const shots = [];
  try {
    const { page, errors } = await openPage(browser, device, { init: 'Math.random = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
    await page.click('#bPlay'); await page.waitForTimeout(300);
    const snap = async label => { await page.waitForTimeout(80); shots.push({ label, img: (await page.screenshot()).toString('base64') }); };
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); paused = true;
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 5000; }
      for (const k of ['refinery', 'barracks', 'reactor', 'turret']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.type === k && b.side === 0) { b.built = true; b.progress = 1; } }
      for (let i = 0; i < 8; i++) { const e = spawnUnit(game, 0, i < 5 ? 'rifle' : 'tank', 520 + i * 14, (i % 3 - 1) * 40); e.holdU = e.u; e.holdV = e.v; }
      window.__go = (t, n) => { game.t = t; for (let i = 0; i < n; i++) { update(game, 1 / 30); render(ctx, game, game.t, null, -1); } refreshUI(true); drawMinimapNow(); };
      cam.x = hqPos(0).u + 330; clampCam();
    });
    await page.evaluate(() => __go(1098, 2)); await snap('18:18: countdown in the top bar (1:42 left)');
    await page.evaluate(() => __go(1184, 2)); await snap('19:44: 30-second warning');
    await page.evaluate(() => __go(1201, 30)); await snap('20:02: the Extinction Event begins');
    await page.evaluate(() => __go(1290, 60)); await snap('21:32: meteors over the base');
    await page.evaluate(() => { game.over = true; game.winner = 0; game.result = { how: 'score', reason: 'both', by: 'score', score: [6420, 3980] }; showEnd(); });
    await snap('End screen: decided by the score');
    if (errors.length) console.log('ERRORS', errors);
  } finally {
    const sheet = await browser.newPage({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 1 });
    await sheet.setContent(`<style>body{margin:0;background:#0b0f18;color:#cfd8e6;font:600 15px system-ui;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px}figure{margin:0}img{width:100%;display:block}figcaption{padding:3px 0}</style>
      ${shots.map(s => `<figure><figcaption>${s.label}</figcaption><img src="data:image/png;base64,${s.img}"></figure>`).join('')}`);
    const f = path.join(outDir, `${tag}-storm-${res}.png`);
    await sheet.screenshot({ path: f, fullPage: true }); console.log(f);
    await browser.close();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
