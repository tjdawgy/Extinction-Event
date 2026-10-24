// War Factory tree screenshots (v2.14): the Siege / Assault picker, the Train tab on Assault, Flame Tanks burning an
// infantry push, Hydras turning their guns on aircraft, and the path badges on both War Factories.
//   node tests/factory-shots.js [outDir] [--narrow] [--tag=factory]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const device = args.includes('--narrow') ? NARROW : PHONE;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'factory';
  const res = `${device.width}x${device.height}`;
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const shots = [];
  try {
    const { page, errors } = await openPage(browser, device, { init: 'Math.random = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
    await page.click('#bPlay'); await page.waitForTimeout(300);
    const snap = async (label, file) => { await page.waitForTimeout(100); const img = await page.screenshot(); shots.push({ label, img: img.toString('base64') }); if (file) { const f = path.join(outDir, `${tag}-${file}-${res}.png`); fs.writeFileSync(f, img); console.log(f); } };
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); paused = false; speed = 1;
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = 4000; s.res.e = 1500; }
      for (const k of ['barracks', 'refinery', 'factory', 'factory', 'habitat', 'habitat', 'habitat']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.side === 0 && b.kind === 'b') { b.built = true; b.progress = 1; } }
      window.__frames = n => { for (let i = 0; i < n; i++) { update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); } refreshUI(true); };
      cam.x = hqPos(0).u + 300; clampCam(); __frames(2);
      openPanel(game.ents.filter(e => e.type === 'factory' && e.side === 0)[0]);
    });
    await snap('War Factory at T1: Siege or Assault', 'picker');
    await page.click('#bpPick [data-p="B"]'); await snap('Assault picked: the button confirms', 'picked');
    await page.click('#bpUp');
    await page.evaluate(() => {
      const [a, b] = game.ents.filter(e => e.type === 'factory' && e.side === 0);
      a.upProg = 0.999; __frames(3); tryUpgrade(game, 0, a); a.upProg = 0.999; __frames(3);
      tryUpgrade(game, 0, b, 'A'); b.upProg = 0.999; __frames(3); openPanel(a); __frames(1);
    });
    await snap('Assault at T3: Flame Tanks and Hydras', 'chosen');
    await page.evaluate(() => { closePanel(); document.querySelector('.tabs [data-tab="train"]').click(); });
    await snap('Train tab: Siege and Assault units, each tagged with its path', 'train');
    await page.evaluate(() => { // sell the Siege War Factory: Artillery and Titan leave the Train tab (v2.16)
      const a = game.ents.find(e => e.type === 'factory' && e.side === 0 && e.path === 'A'); trySell(game, 0, a); __frames(2); refreshUI(true);
    });
    await snap('Only Assault left: Artillery and Titan are hidden', 'other-paths');
    await page.evaluate(() => { // Flame Tanks meet an infantry push in mid-field
      game.fog[0].exp.fill(1);
      const mid = L / 2; setStance(game, 0, 'hold'); setStance(game, 1, 'hold');
      for (let i = 0; i < 3; i++) { const u = spawnUnit(game, 0, 'flame', mid - 20 - i * 6, (i - 1) * 30); u.holdU = u.u; u.holdV = u.v; }
      for (let i = 0; i < 10; i++) { const u = spawnUnit(game, 1, i % 4 ? 'rifle' : 'heavy', mid + 30 + (i % 5) * 11, ((i * 7) % 5 - 2) * 15); u.holdU = u.u; u.holdV = u.v; }
      cam.x = mid - 120; clampCam(); __frames(31);
    });
    await snap('Flame Tanks burn every infantry unit in the strip ahead', 'flame');
    await page.evaluate(() => { // Hydras turn their guns from the ground to aircraft
      for (const e of game.ents) if (e.kind === 'u') e.hp = 0; __frames(2);
      const mid = L / 2 + 400;
      for (let i = 0; i < 2; i++) { const u = spawnUnit(game, 0, 'hydra', mid - 60, (i - 0.5) * 40); u.holdU = u.u; u.holdV = u.v; }
      for (let i = 0; i < 3; i++) { const u = spawnUnit(game, 1, 'aircraft', mid + 120 + i * 30, (i - 1) * 25); u.holdU = u.u; u.holdV = u.v; }
      for (let i = 0; i < 2; i++) { const u = spawnUnit(game, 1, 'tank', mid + 90, (i - 0.5) * 30); u.holdU = u.u; u.holdV = u.v; }
      cam.x = mid - 200; clampCam(); __frames(25);
    });
    await snap('Hydras pick the aircraft first: guns raised', 'hydra');
    await page.evaluate(() => { // the enemy War Factory on Assault, its badge as seen through fog
      for (const e of game.ents) if (e.kind === 'u') e.hp = 0;
      for (const k of ['barracks', 'factory']) { tryBuild(game, 1, k); for (const x of game.ents) if (x.side === 1 && x.kind === 'b') { x.built = true; x.progress = 1; } } const b = game.ents.find(x => x.side === 1 && x.type === 'factory'); b.built = true; b.progress = 1; b.tier = 2; b.path = 'B';
      game.fog[0].ghosts[b.id] = ghostOf(b);
      cam.x = hqPos(1).u - 260; clampCam(); __frames(2);
    });
    await snap('Enemy War Factory on Assault: the flame badge', 'ghost');
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
