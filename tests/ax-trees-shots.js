// Axiarch tree screenshots (v2.27) at 667×375 (858×396 with --wide): the Genesis Gate and Architectum path pickers, a
// lineup of the eight tree units, and the Gravemantle's slow and the Eventide's pull.
//   node tests/ax-trees-shots.js [outDir] [--wide] [--tag=axtrees]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const dev = args.includes('--wide') ? PHONE : NARROW;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'axtrees';
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
      for (const k of ['barracks', 'factory', 'habitat', 'habitat', 'refinery']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.side === 0 && b.kind === 'b') { b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; } }
      window.__frames = n => { for (let i = 0; i < n; i++) update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); refreshUI(true); $('toasts').textContent = ''; };
      cam.x = hqPos(0).u + 200; clampCam(); __frames(40 * 30);
    });
    for (const [type, name] of [['barracks', 'gate'], ['factory', 'architectum']]) {
      await page.evaluate(t => { openPanel(game.ents.find(e => e.type === t && e.side === 0)); refreshUI(true); }, type);
      await shot(`picker-${name}`);
    }
    await page.evaluate(() => closePanel());
    await page.evaluate(() => { // the lineup: the eight tree units side by side, on Hold
      const u0 = 640, list = ['riftstalker', 'parallax', 'lancer', 'marksman', 'riftmortar', 'worldbreaker', 'gravemantle', 'eventide'];
      game.fog[0].vis.fill(1);
      list.forEach((t, i) => { const e = spawnUnit(game, 0, t, u0 + (i % 4) * 78 + (i < 4 ? 0 : 20), i < 4 ? 90 : 175); Object.assign(e, { holdU: e.u, holdV: e.v, face: 1, cd: 1e6 }); });
      setStance(game, 0, 'hold'); applyZoom(1.5); cam.x = u0 + 125; clampCam(); render(ctx, game, game.t, sel, selPad);
    });
    await shot('lineup');
    await page.evaluate(() => { // a Gravemantle slowing Riflemen in its aura; an Eventide pulling a group in
      for (const e of game.ents) if (e.kind === 'u') e.hp = 0; __frames(1); applyZoom(1.5);
      const u0 = L / 2; game.fog[0].vis.fill(1);
      const gm = spawnUnit(game, 0, 'gravemantle', u0 - 120, 80); Object.assign(gm, { holdU: gm.u, holdV: gm.v, face: 1, cd: 1e6 });
      for (let i = 0; i < 3; i++) { const r = spawnUnit(game, 1, 'rifle', u0 - 60 + i * 18, 60 + i * 22); Object.assign(r, { holdU: r.u, holdV: r.v, cd: 1e6 }); }
      const et = spawnUnit(game, 0, 'eventide', u0 + 80, 120); Object.assign(et, { holdU: et.u, holdV: et.v, face: 1, cd: 1e6, pulseCd: 0 });
      for (let i = 0; i < 4; i++) { const r = spawnUnit(game, 1, i % 2 ? 'heavy' : 'rifle', u0 + 140 + (i % 2) * 22, 80 + i * 22); Object.assign(r, { holdU: r.u, holdV: r.v, cd: 1e6 }); }
      cam.x = u0 + 10; clampCam(); paused = false; __frames(6); game.fog[0].vis.fill(1); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot('effects');
    if (errors.length) console.error('Page errors:', errors);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
