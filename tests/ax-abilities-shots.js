// Axiarch ability screenshots (v2.28) at 667×375 (858×396 with --wide): the ability panel on its shared cooldown, Shield
// Overcharge glowing on Bastions and Shardlings, and a Purification Beam mid-sweep through Last Fist infantry.
//   node tests/ax-abilities-shots.js [outDir] [--wide] [--tag=axabil]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const dev = args.includes('--wide') ? PHONE : NARROW;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'axabil';
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const { page, errors } = await openPage(browser, dev, { init: 'Math.random = (() => { let a = 5; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
  const shot = async name => { await page.waitForTimeout(150); const f = path.join(outDir, `${tag}-${name}-${dev.width}x${dev.height}.png`); fs.writeFileSync(f, await page.screenshot()); console.log(f); };
  try {
    await page.click('#meSeg [data-f="axiarchs"]'); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro();
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 6000; }
      window.__frames = n => { for (let i = 0; i < n; i++) update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); refreshUI(true); $('toasts').textContent = ''; };
      __frames(30 * 40); game.t = Math.max(game.t, 300); game.sides[0].hq.tier = 2;
      const u0 = L / 2; game.fog[0].vis.fill(1); game.fog[0].exp.fill(1);
      for (let i = 0; i < 6; i++) { const e = spawnUnit(game, 0, i % 3 ? 'shardling' : 'bastion', u0 - 170 + (i % 3) * 22, (Math.floor(i / 3) - 0.5) * 34); e.holdU = e.u; e.holdV = e.v; e.face = 1; e.cd = 1e6; e.shp *= 0.4; }
      for (let i = 0; i < 6; i++) { const r = spawnUnit(game, 1, i % 3 ? 'rifle' : 'heavy', u0 + 20 + (i % 3) * 26, (Math.floor(i / 3) - 0.5) * 30); r.holdU = r.u; r.holdV = r.v; r.cd = 1e6; r.hp = r.maxHp = 2000; }
      setStance(game, 0, 'hold'); setStance(game, 1, 'hold'); __frames(1);
      useAbility(game, 0, 'beam', u0 + 50, 0); __frames(Math.round(30 * (ABIL.beam.delay + 0.55)));
      for (const k in game.sides[0].ab) game.sides[0].ab[k] = 0; useAbility(game, 0, 'overcharge', u0 - 150, 0);
      for (const k in game.sides[0].ab) game.sides[0].ab[k] = game.t + 87; game.sides[0].abK = 'beam'; game.sides[0].abEnd = game.t + 87; // the panel on the Beam's shared cooldown
      applyZoom(1.5); cam.x = u0 - 40; clampCam(); __frames(6); game.fog[0].vis.fill(1); paused = true; render(ctx, game, game.t, sel, selPad); refreshUI(true);
    });
    await shot('effects');
    if (errors.length) console.error('Page errors:', errors);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
