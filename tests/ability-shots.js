// Commander ability screenshots: targeting, warning and effect for each ability, the off-screen strike alert,
// and the layout with the building panel or the info panel open next to the ability buttons.
//   node tests/ability-shots.js [outDir] [--narrow] [--tag=step6]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const SETUP = () => {
  window.__scene = () => {
    clearTimeout(endTimer); endTimer = null;
    game = newGame('normal', {}); game.countdown = 0; hideCountdown(); hideOverlay(); closePanel(); hideInfo(); endAim();
    running = true; paused = true; camTouched = true;
    for (const s of [0, 1]) { game.sides[s].aiT = 1e9; game.sides[s].stance = 'hold'; game.sides[s].res.c = game.sides[s].res.e = 3000; }
    game.t = 200; for (const s of [0, 1]) game.sides[s].ab = { shield: 0, strike: 0, repair: 0 };
    for (const k of ['barracks', 'factory', 'refinery']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.type === k) { b.built = true; b.progress = 1; } }
    const hold = (e, u, v) => { e.holdU = u; e.holdV = v; e.cd = 1e6; return e; };
    for (let i = 0; i < 12; i++) { const e = hold(spawnUnit(game, 0, i < 7 ? 'rifle' : i < 10 ? 'tank' : 'heavy', 560 + (i % 6) * 18, (Math.floor(i / 6) - 0.5) * 60), 0, 0); e.holdU = e.u; e.holdV = e.v; e.hp *= 0.55; }
    for (let i = 0; i < 8; i++) { const e = hold(spawnUnit(game, 1, i < 5 ? 'rifle' : 'tank', 800 + (i % 4) * 16, (Math.floor(i / 4) - 0.5) * 60), 0, 0); e.holdU = e.u; e.holdV = e.v; }
    const orig = updateVision; updateVision = g => { orig(g); for (let i = cellOf(300); i <= cellOf(950); i++) g.fog[0].vis[i] = g.fog[0].exp[i] = 1; };
    for (let i = 0; i < 5; i++) update(game, 1 / 30);
    applyZoom(1); cam.x = 700; clampCam(); buildCards(); refreshUI(true);
  };
  window.__frames = (n, keep) => { for (let i = 0; i < n; i++) { update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); } refreshUI(false); };
  window.__tapWorld = (u, v) => { const w = P(u, v); handleTap(V.cw / 2 + (w.x - cam.x) * V.S, V.A + (w.y - Y_BOT) * V.S); };
};

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const device = args.includes('--narrow') ? NARROW : PHONE;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'abilities';
  const res = `${device.width}x${device.height}`;
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const shots = [];
  try {
    const { page, errors } = await openPage(browser, device, { init: 'Math.random = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
    await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(SETUP);
    const snap = async label => { await page.waitForTimeout(60); shots.push({ label, img: (await page.screenshot()).toString('base64') }); };
    // Emergency Shield: targeting, then the shielded units
    await page.evaluate(() => { __scene(); paused = false; onAbil('shield', $('abil').children[0]); paused = true; __tapWorld(610, 0); render(ctx, game, game.t, sel, selPad); });
    await snap('Shield: targeting (covered units ringed)');
    await page.evaluate(() => { __tapWorld(610, 0); __frames(12); });
    await snap('Shield: active (bubbles, timer rings)');
    // Orbital Strike: invalid target, valid target, warning, impact
    await page.evaluate(() => { __scene(); paused = false; onAbil('strike', $('abil').children[1]); paused = true; __tapWorld(1300, 0); render(ctx, game, game.t, sel, selPad); });
    await snap('Strike: unexplored target refused');
    await page.evaluate(() => { __tapWorld(830, 0); render(ctx, game, game.t, sel, selPad); });
    await snap('Strike: targeting');
    await page.evaluate(() => { __tapWorld(830, 0); __frames(45); });
    await snap('Strike: warning (1.5 s left)');
    await page.evaluate(() => { __frames(32); });
    await snap('Strike: beam locks on');
    await page.evaluate(() => { __frames(16); });
    await snap('Strike: impact');
    await page.evaluate(() => { __scene(); for (let i = cellOf(1150); i <= cellOf(1350); i++) game.fog[0].exp[i] = 1; const r = useAbility(game, 0, 'strike', 1250, 0); if (!r.ok) throw new Error(r.msg); cam.x = 0; clampCam(); __frames(10); });
    await snap('Strike off screen: edge alert');
    // Repair Pulse
    await page.evaluate(() => { __scene(); paused = false; onAbil('repair', $('abil').children[2]); paused = true; __tapWorld(610, 0); render(ctx, game, game.t, sel, selPad); });
    await snap('Repair Pulse: targeting');
    await page.evaluate(() => { __tapWorld(610, 0); __frames(60); });
    await snap('Repair Pulse: active');
    // Layout: building panel, then the info panel, next to the ability column
    await page.evaluate(() => { __scene(); for (const s of game.sides) { const end = game.t + 70; s.ab = { shield: end, strike: end, repair: end }; s.abK = 'strike'; s.abEnd = end; } refreshUI(true); openPanel(game.ents.find(e => e.type === 'factory')); render(ctx, game, game.t, sel, selPad); });
    await snap('Layout: building panel + abilities (shared cooldown after a Strike)');
    await page.evaluate(() => { showInfo('a', 'strike'); });
    await snap('Layout: long-press info + abilities');
    await page.evaluate(() => { hideInfo(); closePanel(); game.countdown = 2; refreshUI(true); });
    await snap('During GET READY: abilities greyed out');
    if (errors.length) console.log('ERRORS', errors);
  } finally {
    const sheet = await browser.newPage({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 1 });
    await sheet.setContent(`<style>body{margin:0;background:#0b0f18;color:#cfd8e6;font:600 15px system-ui;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px}figure{margin:0}img{width:100%;display:block}figcaption{padding:3px 0}</style>
      ${shots.map(s => `<figure><figcaption>${s.label}</figcaption><img src="data:image/png;base64,${s.img}"></figure>`).join('')}`);
    const f = path.join(outDir, `${tag}-abilities-${res}.png`);
    await sheet.screenshot({ path: f, fullPage: true }); console.log(f);
    await browser.close();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
