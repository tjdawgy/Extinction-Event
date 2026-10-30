// Celestial Array screenshots (v2.29) at 667×375 (858×396 with --wide): the Calculus path picker and a lineup of the
// four new flyers (Prismwing, Shardstorm, Voidcarrier, Astral Sovereign).
//   node tests/ax-array-shots.js [outDir] [--wide] [--tag=axarray]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const dev = args.includes('--wide') ? PHONE : NARROW;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'axarray';
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const { page, errors } = await openPage(browser, dev, { init: 'Math.random = (() => { let a = 5; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
  const shot = async name => { await page.waitForTimeout(150); const f = path.join(outDir, `${tag}-${name}-${dev.width}x${dev.height}.png`); fs.writeFileSync(f, await page.screenshot()); console.log(f); };
  try {
    await page.click('#meSeg [data-f="axiarchs"]'); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); paused = true;
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 6000; }
      for (const k of ['barracks', 'techlab', 'habitat', 'habitat', 'refinery']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.side === 0 && b.kind === 'b') { b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; } }
      window.__frames = n => { for (let i = 0; i < n; i++) update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); refreshUI(true); $('toasts').textContent = ''; };
      cam.x = hqPos(0).u + 200; clampCam(); __frames(40 * 30);
      openPanel(game.ents.find(e => e.type === 'techlab' && e.side === 0)); refreshUI(true);
    });
    await shot('picker');
    await page.evaluate(() => { // the lineup: the four Celestial Array path units side by side, on Hold
      closePanel(); const u0 = 640, list = ['prismwing', 'shardstorm', 'voidcarrier', 'sovereign'];
      game.fog[0].vis.fill(1);
      list.forEach((t, i) => { const e = spawnUnit(game, 0, t, u0 + [0, 60, 140, 250][i], 130); Object.assign(e, { holdU: e.u, holdV: e.v, face: 1, cd: 1e6, z: [62, 72, 82, 90][i] }); });
      setStance(game, 0, 'hold'); applyZoom(1.5); cam.x = u0 + 125; clampCam(); render(ctx, game, game.t, sel, selPad);
    });
    await shot('lineup');
    if (errors.length) console.error('Page errors:', errors);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
