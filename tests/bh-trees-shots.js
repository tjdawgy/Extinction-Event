// Bloomhost tree screenshots (v2.19) at 667×375 (858×396 with --wide): the Larva Pit and Evolution Chamber path pickers,
// a lineup of the eight tree units, and the corrosion and acid-pool effects.
//   node tests/bh-trees-shots.js [outDir] [--wide] [--tag=bhtrees]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const dev = args.includes('--wide') ? PHONE : NARROW;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'bhtrees';
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
      for (const k of ['barracks', 'factory', 'habitat', 'habitat', 'refinery']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.side === 0 && b.kind === 'b') { b.built = true; b.progress = 1; b.hp = b.maxHp; } }
      window.__frames = n => { for (let i = 0; i < n; i++) { update(game, 1 / 30); } render(ctx, game, game.t, sel, selPad); refreshUI(true); $('toasts').textContent = ''; };
      cam.x = hqPos(0).u + 200; clampCam(); __frames(40 * 30); // creep grown
    });
    for (const [type, name, p] of [['barracks', 'larvapit', 'A'], ['factory', 'evochamber', 'B']]) {
      await page.evaluate(t => { openPanel(game.ents.find(e => e.type === t && e.side === 0)); refreshUI(true); }, type);
      await page.click(`#bpPick [data-p="${p}"]`);
      await shot(`picker-${name}`);
    }
    await page.evaluate(() => closePanel());
    await page.evaluate(() => { // the lineup: all eight tree units side by side, on Hold
      const u0 = 640, list = ['leaper', 'ravager', 'spitter', 'bilecaster', 'bilelobber', 'ruinmaw', 'thornback', 'dreadthorn'];
      game.fog[0].vis.fill(1);
      list.forEach((t, i) => { const e = spawnUnit(game, 0, t, u0 + (i % 4) * 56, i < 4 ? -10 : 85); e.holdU = e.u; e.holdV = e.v; e.face = 1; });
      setStance(game, 0, 'hold'); applyZoom(1.7); cam.x = u0 + 85; clampCam(); render(ctx, game, game.t, sel, selPad);
    });
    await shot('lineup');
    await page.evaluate(() => { // corrosion and an acid pool: Last Fist infantry and a Tank, corroded, standing in a Ruinmaw's acid
      for (const e of game.ents) if (e.kind === 'u') e.hp = 0; __frames(1); applyZoom(1);
      const u0 = L / 2; game.fog[0].vis.fill(1);
      for (let i = 0; i < 4; i++) { const r = spawnUnit(game, 1, i ? 'rifle' : 'tank', u0 + (i % 2) * 22, (i - 1.5) * 20); r.holdU = r.u; r.holdV = r.v; r.cd = 1e6; r.corr = i % 2 ? 0.25 : 0.12; r.corrT = game.t + 30; }
      addAcid(game, 0, u0 + 75, 10); game.acid[0].end = game.t + 30; // a pool beside the group, one Rifleman standing in it
      { const r = spawnUnit(game, 1, 'rifle', u0 + 80, 14); r.holdU = r.u; r.holdV = r.v; r.cd = 1e6; }
      const s = spawnUnit(game, 0, 'spitter', u0 - 120, 0); s.holdU = s.u; s.holdV = 0; s.cd = 1e6;
      const rm = spawnUnit(game, 0, 'ruinmaw', u0 - 170, 40); rm.holdU = rm.u; rm.holdV = 40; rm.cd = 1e6;
      applyZoom(1.7); cam.x = u0 - 40; clampCam(); paused = true; __frames(1); game.fog[0].vis.fill(1); render(ctx, game, game.t, sel, selPad);
    });
    await shot('corrosion-acid');
    if (errors.length) console.error('Page errors:', errors);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
