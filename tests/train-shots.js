// Train tab screenshots (v2.16): only units you can train now. Start (nothing to train: the hint), early game (a Barracks),
// mid game (Mass Deployment Barracks, Siege War Factory at T2, Tech Lab at T1, short of energy so some cards are greyed out).
//   node tests/train-shots.js [outDir] [--wide] [--tag=train]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const device = args.includes('--wide') ? PHONE : NARROW;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'train';
  const res = `${device.width}x${device.height}`;
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  let bad = 0;
  try {
    const { page, errors } = await openPage(browser, device);
    await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); paused = true;
      for (const s of game.sides) s.aiT = 1e9;
      window.__fin = k => { const r = tryBuild(game, 0, k); for (const b of game.ents) if (b.side === 0 && b.kind === 'b') { b.built = true; b.progress = 1; } return r; };
      window.__up = (type, p, tier) => { for (const b of game.ents.filter(e => e.side === 0 && e.type === type)) while (b.tier < tier) { tryUpgrade(game, 0, b, p); b.upProg = 0.9999; update(game, 0.2); } };
      cam.x = hqPos(0).u + 300; clampCam(); render(ctx, game, game.t, sel, selPad); refreshUI(true);
    });
    await page.click('.tabs [data-tab="train"]');
    const snap = async name => {
      await page.evaluate(() => { render(ctx, game, game.t, sel, selPad); refreshUI(true); }); await page.waitForTimeout(150);
      const f = path.join(outDir, `${tag}-${name}-${res}.png`); fs.writeFileSync(f, await page.screenshot()); console.log(f);
      const r = await page.evaluate(() => ({ cards: [...$('cards').querySelectorAll('.card')].map(c => c.dataset.type + (c.classList.contains('poor') ? ' (greyed)' : '')), hint: ($('cards').querySelector('.trainHint') || {}).textContent || '' }));
      console.log(`  ${name}: ${r.cards.join(', ') || '(no cards)'}${r.hint ? ` · hint "${r.hint}"` : ''}`);
      return r;
    };
    const r0 = await snap('start');
    if (r0.cards.length || !r0.hint) bad++;
    await page.evaluate(() => { game.sides[0].res.c = 400; game.sides[0].res.e = 80; __fin('barracks'); __fin('refinery'); game.t = 75; refreshUI(true); });
    const r1 = await snap('early');
    if (r1.cards.join() !== 'rifle') bad++;
    await page.evaluate(() => {
      game.sides[0].res.c = game.sides[0].res.e = 5000;
      for (const k of ['reactor', 'habitat', 'factory', 'techlab']) __fin(k);
      __up('barracks', 'B', 2); __up('factory', 'A', 2); __up('habitat', null, 2);
      game.sides[0].res.c = 420; game.sides[0].res.e = 55; game.t = 420; refreshUI(true); // short of energy: some cards greyed
    });
    const r2 = await snap('mid');
    if (r2.cards.map(c => c.split(' ')[0]).join() !== 'rifle,tank,artillery,aircraft') bad++;
    if (errors.length) { console.error('Page errors:', errors); bad++; }
  } finally { await browser.close(); }
  process.exit(bad ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
