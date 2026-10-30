// Tech Lab tree screenshots (v2.15): the Air Power / Support picker, the Train tab, a Leviathan bombing a base with an
// Interceptor escort, a Medicopter healing infantry next to a Recon Drone, the Army tab's Support group, an enemy badge.
//   node tests/techlab-shots.js [outDir] [--narrow] [--tag=techlab]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const device = args.includes('--narrow') ? NARROW : PHONE;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'techlab';
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
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = 6000; s.res.e = 3000; }
      for (const k of ['barracks', 'refinery', 'factory', 'techlab', 'techlab', 'habitat', 'habitat', 'habitat']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.side === 0 && b.kind === 'b') { b.built = true; b.progress = 1; } }
      window.__frames = n => { for (let i = 0; i < n; i++) { update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); } refreshUI(true); };
      cam.x = hqPos(0).u + 300; clampCam(); __frames(2);
      openPanel(game.ents.filter(e => e.type === 'techlab' && e.side === 0)[0]);
    });
    await snap('Tech Lab at T1: Air Power or Support', 'picker');
    await page.click('#bpPick [data-p="A"]'); await snap('Air Power picked: the button confirms', 'picked');
    await page.click('#bpUp'); await page.click('#bpUp'); // v2.35: a costly upgrade confirms on the second tap
    await page.evaluate(() => {
      const [a, b] = game.ents.filter(e => e.type === 'techlab' && e.side === 0);
      a.upProg = 0.999; __frames(3); tryUpgrade(game, 0, a); a.upProg = 0.999; __frames(3);
      tryUpgrade(game, 0, b, 'B'); b.upProg = 0.999; __frames(3); tryUpgrade(game, 0, b); b.upProg = 0.999; __frames(3); openPanel(b); __frames(1);
    });
    await snap('Support at T3: Nanoweave', 'chosen');
    await page.evaluate(() => { closePanel(); document.querySelector('.tabs [data-tab="train"]').click(); $('cards').scrollLeft = 1e4; });
    await snap('Train tab: Air Power and Support units, each tagged with its path', 'train');
    await page.evaluate(() => { // a Leviathan with two Interceptors over an enemy Barracks
      game.fog[0].exp.fill(1);
      for (const k of ['barracks', 'refinery']) { tryBuild(game, 1, k); for (const x of game.ents) if (x.side === 1 && x.kind === 'b') { x.built = true; x.progress = 1; } }
      const bar = game.ents.find(x => x.side === 1 && x.type === 'barracks');
      setStance(game, 0, 'hold'); setStance(game, 1, 'hold');
      const lv = spawnUnit(game, 0, 'leviathan', bar.u - 30, bar.v); lv.holdU = bar.u; lv.holdV = bar.v;
      for (let i = 0; i < 2; i++) { const it = spawnUnit(game, 0, 'interceptor', bar.u - 60, bar.v + (i ? 18 : -18)); it.holdU = it.u; it.holdV = it.v; }
      cam.x = bar.u - 140; clampCam(); __frames(40);
    });
    await snap('A Leviathan bombs the enemy base, Interceptors on escort', 'leviathan');
    await page.evaluate(() => { // a Medicopter over wounded infantry, a Recon Drone behind them
      for (const e of game.ents) if (e.kind === 'u') e.hp = 0; __frames(2);
      const mid = L / 2 - 200;
      for (let i = 0; i < 6; i++) { const r = spawnUnit(game, 0, i % 3 ? 'rifle' : 'heavy', mid + (i % 3) * 12, (i - 2.5) * 12); r.holdU = r.u; r.holdV = r.v; r.hp = r.maxHp * 0.45; }
      const m = spawnUnit(game, 0, 'medic', mid + 10, 0); m.holdU = m.u; m.holdV = m.v;
      const d = spawnUnit(game, 0, 'drone', mid - 70, 20); d.holdU = d.u; d.holdV = d.v;
      cam.x = mid - 60; clampCam(); __frames(30);
    });
    await snap('Medicopter heals the infantry below it; a Recon Drone sees 420 ahead', 'support');
    await page.evaluate(() => { document.querySelector('.tabs [data-tab="army"]').click(); refreshUI(true); });
    await page.waitForTimeout(700);
    await snap('Army tab: the new Support group', 'army');
    await page.evaluate(() => { // the enemy Tech Lab on Support, its badge as seen through fog
      for (const e of game.ents) if (e.kind === 'u') e.hp = 0;
      for (const k of ['barracks', 'factory', 'techlab']) { tryBuild(game, 1, k); for (const x of game.ents) if (x.side === 1 && x.kind === 'b') { x.built = true; x.progress = 1; } }
      const b = game.ents.find(x => x.side === 1 && x.type === 'techlab'); b.tier = 2; b.path = 'B';
      game.fog[0].ghosts[b.id] = ghostOf(b);
      cam.x = hqPos(1).u - 260; clampCam(); __frames(2);
    });
    await snap('Enemy Tech Lab on Support: the cross badge', 'ghost');
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
