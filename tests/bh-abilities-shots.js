// Bloomhost ability screenshots (v2.20) at 667×375 (858×396 with --wide): the ability panel with Frenzy Bloom glowing
// on a pack of Skitterlings and a Corrosive Bloom cloud on Last Fist infantry, then an Emergency Brood pod falling.
//   node tests/bh-abilities-shots.js [outDir] [--wide] [--tag=bhabil]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const dev = args.includes('--wide') ? PHONE : NARROW;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'bhabil';
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const { page, errors } = await openPage(browser, dev, { init: 'Math.random = (() => { let a = 5; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
  const shot = async name => { await page.waitForTimeout(150); const f = path.join(outDir, `${tag}-${name}-${dev.width}x${dev.height}.png`); fs.writeFileSync(f, await page.screenshot()); console.log(f); };
  try {
    await page.click('#meSeg [data-f="bloomhost"]'); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); game.t = 300;
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 6000; s.hq.tier = 2; }
      window.__frames = n => { for (let i = 0; i < n; i++) update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); refreshUI(true); $('toasts').textContent = ''; };
      const u0 = L / 2; game.fog[0].vis.fill(1); game.fog[0].exp.fill(1);
      for (let i = 0; i < 8; i++) { const e = spawnUnit(game, 0, 'skitterling', u0 - 150 + (i % 4) * 16, (Math.floor(i / 4) - 0.5) * 26); e.holdU = e.u; e.holdV = e.v; e.face = 1; }
      for (let i = 0; i < 4; i++) { const r = spawnUnit(game, 1, 'rifle', u0 + 30 + (i % 2) * 22, (i - 1.5) * 18); r.holdU = r.u; r.holdV = r.v; r.cd = 1e6; }
      setStance(game, 0, 'hold'); setStance(game, 1, 'hold'); __frames(1);
      useAbility(game, 0, 'frenzy', u0 - 125, 0); for (const k in game.sides[0].ab) game.sides[0].ab[k] = 0;
      useAbility(game, 0, 'corrosive', u0 + 40, 0);
      applyZoom(1.5); cam.x = u0 - 40; clampCam(); __frames(45); game.fog[0].vis.fill(1); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot('effects');
    await page.evaluate(() => { // Emergency Brood: the pod in the air over its landing ring
      paused = false; for (const k in game.sides[0].ab) game.sides[0].ab[k] = 0;
      useAbility(game, 0, 'brood', L / 2 - 120, 70); __frames(50); game.fog[0].vis.fill(1); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot('brood');
    if (errors.length) console.error('Page errors:', errors);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
