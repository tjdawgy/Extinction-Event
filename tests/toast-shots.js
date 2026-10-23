// Toast placement screenshots (v2.15.1): three toasts while the Barracks and Tech Lab panels are open, at T1 (path
// picker) and T2. Prints whether any toast overlaps the panel title row (.bph); exits 1 if one does.
//   node tests/toast-shots.js [outDir] [--narrow] [--tag=toast]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const device = args.includes('--narrow') ? NARROW : PHONE;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'toast';
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
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = 6000; s.res.e = 3000; }
      for (const k of ['barracks', 'refinery', 'factory', 'techlab']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.side === 0 && b.kind === 'b') { b.built = true; b.progress = 1; } }
      window.__frames = n => { for (let i = 0; i < n; i++) update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); refreshUI(true); };
      window.__toT2 = () => { for (const [type, p] of [['barracks', 'A'], ['techlab', 'B']]) { const b = game.ents.find(e => e.type === type && e.side === 0); if (b.tier > 1) continue; tryUpgrade(game, 0, b, p); b.upProg = 0.999; __frames(3); } };
      cam.x = hqPos(0).u + 300; clampCam(); render(ctx, game, game.t, sel, selPad); refreshUI(true);
    });
    for (const [type, idx, name] of [['barracks', 1, 'barracks-t1'], ['techlab', 1, 'techlab-t1'], ['barracks', 2, 'barracks-t2'], ['techlab', 2, 'techlab-t2']]) {
      const r = await page.evaluate(([type, tier]) => {
        if (tier > 1) __toT2();
        $('toasts').textContent = '';
        const b = game.ents.find(e => e.type === type && e.side === 0); if (b.tier !== tier) throw new Error(`${type} is T${b.tier}`);
        openPanel(b); refreshUI(true);
        toast('Field node captured: +3 credits, +1 energy per second', 'ok'); toast('Not enough credits', 'bad'); toast('Your base is under attack', 'warn');
        const t = document.querySelector('#bp .bph').getBoundingClientRect(), hit = [...$('toasts').children].some(el => { const a = el.getBoundingClientRect(); return a.right > t.left && a.left < t.right && a.bottom > t.top && a.top < t.bottom; });
        return { hit, title: [t.left, t.top, t.right, t.bottom].map(Math.round) };
      }, [type, idx]);
      await page.waitForTimeout(250);
      const f = path.join(outDir, `${tag}-${name}-${res}.png`); fs.writeFileSync(f, await page.screenshot()); console.log(f);
      console.log(`  ${name} at ${res}: title ${r.title.join(',')}, toast overlaps title: ${r.hit ? 'YES' : 'no'}`);
      if (r.hit) bad++;
    }
    if (errors.length) { console.error('Page errors:', errors); bad++; }
  } finally { await browser.close(); }
  process.exit(bad ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
