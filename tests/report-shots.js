// Post-match report screenshots (v2.9): a real AI-vs-AI match played to its end in the page (the player's side on
// autopilot), then each tab of the report, the Copy confirmation and the clipboard-blocked fallback.
//   node tests/report-shots.js [outDir] [--narrow] [--tag=step8b] [--persona=turtle] [--diff=normal] [--seed=7]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2), opt = k => ((args.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1]);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const device = args.includes('--narrow') ? NARROW : PHONE;
  const tag = opt('tag') || 'report', res = `${device.width}x${device.height}`, seed = +(opt('seed') || 7);
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const shots = [];
  try {
    const { page, errors } = await openPage(browser, device, { init: `Math.random = (() => { let a = ${seed}; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();` });
    await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(({ persona, diff }) => {
      game = newGame(diff, { autoPlayer: true, autoDiff: diff, persona }); game.countdown = 0; hideCountdown(); updateIntro(); running = true; paused = true;
      for (let i = 0; i < 30 * 1800 && !game.over; i++) update(game, 1 / 30);
      running = false; showEnd();
    }, { persona: opt('persona') || 'turtle', diff: opt('diff') || 'normal' });
    const snap = async label => { await page.waitForTimeout(80); shots.push({ label, img: (await page.screenshot()).toString('base64') }); };
    for (const t of ['Summary', 'Timeline', 'Key moments', 'Lessons']) { await page.click(`#repTabs [data-t="${t}"]`); await snap(t); }
    await page.click('#repTabs [data-t="Timeline"]');
    await page.evaluate(() => { $('repPane').scrollTop = 1e6; }); await snap('Timeline, scrolled to the end');
    await page.evaluate(() => { $('repPane').scrollTop = 0; });
    await page.evaluate(() => { window.__copied = null; Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { window.__copied = t; return Promise.resolve(); } }, configurable: true }); });
    await page.click('#bCopy'); await page.waitForTimeout(150); await snap('Copy match log: copied');
    await page.click('#repTabs [data-t="Timeline"]');
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('blocked')) }, configurable: true }); document.execCommand = () => false; });
    await page.click('#bCopy'); await page.waitForTimeout(150); await snap('Copy match log: clipboard blocked (fallback)');
    const text = await page.evaluate(() => repText(game));
    fs.writeFileSync(path.join(outDir, `${tag}-matchlog-${res}.txt`), text);
    if (errors.length) console.log('ERRORS', errors);
  } finally {
    const sheet = await browser.newPage({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 1 });
    await sheet.setContent(`<style>body{margin:0;background:#0b0f18;color:#cfd8e6;font:600 15px system-ui;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px}figure{margin:0}img{width:100%;display:block}figcaption{padding:3px 0}</style>
      ${shots.map(s => `<figure><figcaption>${s.label}</figcaption><img src="data:image/png;base64,${s.img}"></figure>`).join('')}`);
    const f = path.join(outDir, `${tag}-report-${res}.png`);
    await sheet.screenshot({ path: f, fullPage: true }); console.log(f);
    await browser.close();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
