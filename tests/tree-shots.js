// Upgrade-tree screenshots (v2.13, Barracks): picking a path, a chosen path's next step, the Train tab (path tags,
// Mass ×2, the "Other paths" card and its info), path badges on the battlefield and on an enemy ghost under fog.
//   node tests/tree-shots.js [outDir] [--narrow] [--tag=trees]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const device = args.includes('--narrow') ? NARROW : PHONE;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'trees';
  const res = `${device.width}x${device.height}`;
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const shots = [];
  try {
    const { page, errors } = await openPage(browser, device, { init: 'Math.random = (() => { let a = 9; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
    await page.click('#bPlay'); await page.waitForTimeout(300);
    const snap = async (label, file) => { await page.waitForTimeout(100); const img = await page.screenshot(); shots.push({ label, img: img.toString('base64') }); if (file) { const f = path.join(outDir, `${tag}-${file}-${res}.png`); fs.writeFileSync(f, img); console.log(f); } };
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); paused = false; speed = 1;
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = 2400; s.res.e = 900; }
      for (const k of ['barracks', 'barracks', 'refinery', 'habitat']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.side === 0 && b.kind === 'b') { b.built = true; b.progress = 1; } }
      window.__frames = n => { for (let i = 0; i < n; i++) { update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); } refreshUI(true); };
      cam.x = hqPos(0).u + 300; clampCam(); __frames(2);
      openPanel(game.ents.filter(e => e.type === 'barracks' && e.side === 0)[0]);
    });
    await snap('Barracks at T1: pick a path', 'picker');
    await page.click('#bpPick [data-p="A"]'); await snap('Specialists picked: the button confirms', 'picked');
    await page.click('#bpUp'); await page.evaluate(() => { const b = sel; b.upProg = 0.999; __frames(3); });
    await page.evaluate(() => { const b2 = game.ents.filter(e => e.type === 'barracks' && e.side === 0)[1]; tryUpgrade(game, 0, b2, 'B'); b2.upProg = 0.999; __frames(3); openPanel(b2); __frames(1); });
    await snap('Second Barracks on Mass Deployment: next step T3', 'chosen');
    await page.evaluate(() => { closePanel(); document.querySelector('.tabs [data-tab="train"]').click(); });
    await snap('Train tab: path tags, Riflemen ×2 (Mass)', 'train');
    await page.evaluate(() => { // sell the Specialists Barracks: Heavy and Sniper move to "Other paths"
      const a = game.ents.find(e => e.type === 'barracks' && e.side === 0 && e.path === 'A'); trySell(game, 0, a); __frames(2); refreshUI(true);
    });
    await snap('Only a Mass Barracks left: Heavy and Sniper under "Other paths"', 'other-paths');
    await page.click('#cards .card.other'); await snap('"Other paths" explains where they come from');
    await page.evaluate(() => { hideInfo(); for (let i = 0; i < 4; i++) tryTrain(game, 0, 'rifle'); __frames(30 * 10); });
    await snap('Mass Deployment trains Riflemen in pairs');
    await page.evaluate(() => { // the enemy: a Barracks on Specialists, seen once, now a ghost under fog
      const e = game.sides[1]; tryBuild(game, 1, 'barracks', 0); const b = game.ents.find(x => x.side === 1 && x.type === 'barracks'); b.built = true; b.progress = 1; b.tier = 2; b.path = 'A';
      game.fog[0].ghosts[b.id] = ghostOf(b); game.fog[0].exp.fill(1);
      cam.x = hqPos(1).u - 260; clampCam(); __frames(2);
    });
    await snap('Enemy Barracks under fog: the ghost keeps its path badge', 'ghost');
    if (errors.length) console.log('ERRORS', errors);
  } finally {
    const sheet = await browser.newPage({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 1 });
    await sheet.setContent(`<style>body{margin:0;background:#0b0f18;color:#cfd8e6;font:600 15px system-ui;display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:8px}figure{margin:0}img{width:100%;display:block}figcaption{padding:3px 0}</style>
      ${shots.map(s => `<figure><figcaption>${s.label}</figcaption><img src="data:image/png;base64,${s.img}"></figure>`).join('')}`);
    const f = path.join(outDir, `${tag}-sheet-${res}.png`);
    await sheet.screenshot({ path: f, fullPage: true }); console.log(f);
    await browser.close();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
