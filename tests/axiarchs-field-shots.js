// Axiarch power field and warp-in screenshots (v2.26) at 667×375 (858×396 with --wide): the field early, the field with a
// forward node, the Set warp point UI, and a warp-in channel.
//   node tests/axiarchs-field-shots.js [outDir] [--wide] [--tag=axfield]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const dev = args.includes('--wide') ? PHONE : NARROW;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'axfield';
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const { page, errors } = await openPage(browser, dev, { init: 'Math.random = (() => { let a = 9; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
  const shot = async name => { await page.waitForTimeout(150); const f = path.join(outDir, `${tag}-${name}-${dev.width}x${dev.height}.png`); fs.writeFileSync(f, await page.screenshot()); console.log(f); };
  try {
    await page.click('#meSeg [data-f="axiarchs"]'); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro();
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 6000; }
      window.__fin = k => { tryBuild(game, 0, k); for (const b of game.ents) if (b.side === 0 && b.kind === 'b') { b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; } };
      window.__frames = n => { for (let i = 0; i < n; i++) update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); refreshUI(true); $('toasts').textContent = ''; };
      __fin('barracks'); __fin('refinery');
      cam.x = hqPos(0).u + 200; clampCam(); __frames(30 * 40); paused = true; render(ctx, game, game.t, sel, selPad); // 40 s: the base field has grown
    });
    await shot('early');
    await page.evaluate(() => { // two Continuum Spires enlarge the base field; the near node is held: a forward field around it
      paused = false; __fin('habitat'); __fin('habitat');
      const n = game.nodes[0]; n.owner = 0; n.prog = 100;
      cam.x = (hqPos(0).u + n.u) / 2 + 60; clampCam(); __frames(30 * 25); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot('node');
    await page.evaluate(() => { paused = false; document.querySelector('.tabs [data-tab="train"]').click(); });
    await page.click('#cWarp');
    await page.evaluate(() => { cam.x = game.nodes[0].u - 60; clampCam(); __frames(1); });
    await shot('setwarp');
    const at = await page.evaluate(() => { const n = game.nodes[0], w = P(n.u + 20, -40); return { x: V.cw / 2 + (w.x - cam.x) * V.S, y: V.A + (w.y - Y_BOT) * V.S }; });
    await page.mouse.click(at.x, at.y);
    await page.evaluate(() => { // a Shardling and a Wraithwing mid-warp at the new point
      __fin('techlab'); tryTrain(game, 0, 'shardling'); tryTrain(game, 0, 'wraithwing');
      for (const b of game.ents) if (b.side === 0 && b.queue.length) b.prodT = UDEF[b.queue[0]].time - 0.05;
      __frames(4); __frames(36); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot('warpin');
    console.log('warp point', JSON.stringify(await page.evaluate(() => ({ set: game.sides[0].warp, warps: game.warps.length }))));
    if (errors.length) console.error('Page errors:', errors);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
