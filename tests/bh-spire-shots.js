// Bloomspire tree screenshots (v2.21) at 667×375 (858×396 with --wide): the Bloomspire path picker, and a lineup of the
// four new flyers (Needlewing, Cloudwing with its offspring, Brood Tyrant, Worldrender), plus Frenzy Bloom's glow.
//   node tests/bh-spire-shots.js [outDir] [--wide] [--tag=bhspire]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const dev = args.includes('--wide') ? PHONE : NARROW;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'bhspire';
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const { page, errors } = await openPage(browser, dev, { init: 'Math.random = (() => { let a = 5; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
  const shot = async name => { await page.waitForTimeout(150); const f = path.join(outDir, `${tag}-${name}-${dev.width}x${dev.height}.png`); fs.writeFileSync(f, await page.screenshot()); console.log(f); };
  try {
    await page.click('#meSeg [data-f="bloomhost"]'); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); paused = true;
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 6000; }
      for (const k of ['barracks', 'techlab', 'habitat', 'habitat']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.side === 0 && b.kind === 'b') { b.built = true; b.progress = 1; b.hp = b.maxHp; } }
      window.__frames = n => { for (let i = 0; i < n; i++) update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); refreshUI(true); $('toasts').textContent = ''; };
      cam.x = hqPos(0).u + 200; clampCam(); __frames(20 * 30);
      openPanel(game.ents.find(e => e.type === 'techlab' && e.side === 0)); refreshUI(true);
    });
    await shot('picker');
    await page.evaluate(() => { // the lineup: the four new flyers on Hold, a Cloudwing's two offspring beside it, two under Frenzy Bloom
      closePanel(); game.fog[0].vis.fill(1);
      const u0 = 640, list = [['needlewing', 0, 120], ['needlewing', 22, 150], ['cloudwing', 80, 135], ['broodtyrant', 165, 140], ['worldrender', 280, 150]];
      for (const [t, du, v] of list) { const e = spawnUnit(game, 0, t, u0 + du, v); e.holdU = e.u; e.holdV = e.v; e.face = 1; }
      for (const dv of [-18, 14]) { const k = spawnUnit(game, 0, 'needlewing', u0 + 62, 135 + dv); Object.assign(k, { holdU: k.u, holdV: k.v, face: 1, temp: game.t + 9, tLife: 12, tSrc: 'cloud', kid: 1 }); }
      for (const e of game.ents) if (e.kind === 'u' && e.side === 0 && (e.type === 'needlewing' && !e.kid)) e.frzT = game.t + 5;
      setStance(game, 0, 'hold'); applyZoom(1.6); cam.x = u0 + 130; clampCam(); __frames(1); game.fog[0].vis.fill(1); render(ctx, game, game.t, sel, selPad);
    });
    await shot('lineup');
    if (errors.length) console.error('Page errors:', errors);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
