// Salvage (v2.30): a browser check and a screenshot at 667×375 (858×396 with --wide).
// 1. Plays as Last Fist against Bloomhost for 2 game minutes in real time at 3× (the autoplayer commands the player's side),
//    counting console errors and the "+N" scrap pop-ups actually drawn for the player.
// 2. A staged scene: Last Fist Riflemen and Heavies destroy Bloomhost Bulwarks in view, with the pop-ups rising.
//   node tests/salvage-shots.js [outDir] [--wide] [--tag=salvage] [--minutes=2]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const dev = args.includes('--wide') ? PHONE : NARROW;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'salvage';
  const mins = +(((args.find(a => a.startsWith('--minutes=')) || '').split('=')[1]) || 2);
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  try {
    // 1. two game minutes as Last Fist
    {
      const { page, errors } = await openPage(browser, dev);
      await page.click('#meSeg [data-f="lastfist"]'); await page.click('#foeSeg [data-f="bloomhost"]'); await page.click('#diffSeg [data-d="hard"]');
      const desc = await page.textContent('#facDesc');
      await page.click('#bPlay'); await page.waitForTimeout(300);
      const toast = await page.evaluate(() => [...$('toasts').children].map(t => t.textContent).join(' | '));
      await page.evaluate(() => {
        window.__scrap = { drawn: 0, first: null, n: [] };
        const draw = window.drawScrap;
        window.drawScrap = (c, f) => { if (!window.__scrap.first) window.__scrap.first = { t: game.t, n: f.n }; if (f.t < 0.05) window.__scrap.n.push(f.n); window.__scrap.drawn++; draw(c, f); };
        game.auto = true; game.autoDiff = 'hard'; speed = 3; $('bSpeed').textContent = '3×';
      });
      const t0 = Date.now();
      while (await page.evaluate(() => game.t) < 60 * mins && Date.now() - t0 < 6 * 60e3) await page.waitForTimeout(1000);
      const r = await page.evaluate(() => ({ t: game.t, over: game.over, salv: game.sides[0].salv.tot, scrap: window.__scrap }));
      console.log(`Setup line: ${desc}`);
      console.log(`Start toast: ${toast}`);
      console.log(`Played to ${r.t.toFixed(1)} s (over: ${r.over}); salvage ${r.salv} credits; pop-up frames drawn ${r.scrap.drawn}, first at ${r.scrap.first ? r.scrap.first.t.toFixed(1) + ' s (+' + r.scrap.first.n + ')' : 'never'}`);
      console.log(`Console errors: ${errors.length ? errors.join(' | ') : 'none'}`);
      await page.close();
    }
    // 2. the screenshot
    {
      const { page, errors } = await openPage(browser, dev, { init: 'Math.random = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
      await page.click('#meSeg [data-f="lastfist"]'); await page.click('#foeSeg [data-f="bloomhost"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
      await page.evaluate(() => {
        game.countdown = 0; hideCountdown(); updateIntro();
        for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 6000; }
        window.__frames = n => { for (let i = 0; i < n; i++) update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); refreshUI(true); $('toasts').textContent = ''; };
        __frames(30 * 20); game.t = Math.max(game.t, 240);
        const u0 = L / 2; game.fog[0].vis.fill(1); game.fog[0].exp.fill(1);
        for (let i = 0; i < 6; i++) { const e = spawnUnit(game, 0, i % 3 ? 'rifle' : 'heavy', u0 - 150 + (i % 3) * 22, (Math.floor(i / 3) - 0.5) * 34); e.holdU = e.u; e.holdV = e.v; e.face = 1; }
        const foes = [];
        for (let i = 0; i < 5; i++) { const b = spawnUnit(game, 1, i % 2 ? 'skitterling' : 'bulwark', u0 - 20 + (i % 3) * 30, (i - 2) * 22); b.holdU = b.u; b.holdV = b.v; b.cd = 1e6; foes.push(b); }
        setStance(game, 0, 'hold'); setStance(game, 1, 'hold'); __frames(1);
        kill(game, foes[0], 0); __frames(8); kill(game, foes[1], 0); __frames(6); kill(game, foes[2], 0); __frames(4);
        applyZoom(1.5); cam.x = u0 - 60; clampCam(); __frames(2); paused = true; render(ctx, game, game.t, sel, selPad); refreshUI(true);
      });
      await page.waitForTimeout(150);
      const f = path.join(outDir, `${tag}-popup-${dev.width}x${dev.height}.png`); fs.writeFileSync(f, await page.screenshot()); console.log(f);
      if (errors.length) console.error('Page errors:', errors);
      await page.close();
    }
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
