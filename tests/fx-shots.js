// Combat-effect screenshots: every unit idle, moving, firing and impacting, building destruction,
// hidden artillery at the fog edge, and a large battle.
//   node tests/fx-shots.js [outDir] [--narrow] [--tag=step5]
// The game is stepped one SIM tick at a time with a render after each, so the shots are repeatable.
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

// In-page helpers
const HELPERS = () => {
  const vision = updateVision;
  window.__fresh = (fog = false) => { // fog false: the player sees the whole field (unit close-ups); true: real fog
    updateVision = fog ? vision : g => { vision(g); g.fog[0].vis.fill(1); };
    clearTimeout(endTimer); endTimer = null;
    game = newGame('normal', {}); game.countdown = 0; hideCountdown(); hideOverlay(); closePanel();
    running = true; paused = true; camTouched = true;
    for (const s of [0, 1]) { game.sides[s].aiT = 1e9; game.sides[s].stance = 'hold'; game.sides[s].res.c = game.sides[s].res.e = 0; }
    updateIntro(); cam.x = L / 2; clampCam();
  };
  window.__step = (n, keep) => { for (let i = 0; i < n; i++) { if (keep) keep(); update(game, 1 / 30); render(ctx, game, game.t, null, -1); } };
  window.__hold = (e, u, v) => { e.holdU = u; e.holdV = v; };
  window.__screen = (u, v, z = 0) => { const w = P(u, v, z); return { x: V.cw / 2 + (w.x - cam.x) * V.S, y: V.A + (w.y - Y_BOT) * V.S }; };
};

const TYPES = ['rifle', 'heavy', 'sniper', 'tank', 'artillery', 'titan', 'aircraft', 'interceptor'];
const GAP = { rifle: 100, heavy: 110, sniper: 220, tank: 140, artillery: 300, titan: 160, aircraft: 120, interceptor: 150 };

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const device = args.includes('--narrow') ? NARROW : PHONE;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'fx';
  const res = `${device.width}x${device.height}`;
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const cells = [];
  try {
    const { page, errors } = await openPage(browser, device, { init: 'Math.random = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
    await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(HELPERS);
    const grab = async clip => (await page.screenshot({ clip: { x: Math.max(0, clip.x), y: Math.max(0, clip.y), width: Math.min(clip.w, device.width - clip.x), height: Math.min(clip.h, device.height - clip.y) } })).toString('base64');

    for (const type of TYPES) {
      const gap = GAP[type], air = type === 'aircraft' || type === 'interceptor';
      const row = { type, imgs: {} };
      // moving, then idle once it reaches its spot
      const clip = await page.evaluate(({ type, gap }) => {
        __fresh();
        window.__u0 = 990 - gap / 2; // between the middle and right-hand nodes
        window.__me = spawnUnit(game, 0, type, __u0 - 60, 0); __hold(__me, __u0, 0);
        __step(10);
        cam.x = __u0 + gap / 2; clampCam();
        const a = __screen(__u0 - 110, 0), b = __screen(__u0 + gap + 50, 0), t = __screen(__u0, 0, type === 'interceptor' || type === 'aircraft' ? 170 : 120);
        return { x: a.x, y: t.y, w: b.x - a.x, h: a.y - t.y + 24 };
      }, { type, gap });
      row.imgs.moving = await grab(clip);
      await page.evaluate(() => __step(90));
      row.imgs.idle = await grab(clip);
      // targets appear: they can't shoot back, and never die, so the shooter keeps firing
      await page.evaluate(({ air, gap }) => {
        window.__foes = [];
        for (let i = 0; i < 2; i++) { const f = spawnUnit(game, 1, air ? 'aircraft' : 'heavy', __u0 + gap + i * 14, (i - 0.5) * 30); __hold(f, f.u, f.v); f.cd = 99; __foes.push(f); }
        window.__keep = () => { for (const f of __foes) { f.cd = 99; f.hp = Math.max(f.hp, f.maxHp * 0.45); } };
      }, { air, gap });
      // firing: the frame a shot leaves; impact: a few frames after the first projectile ends
      const fired = await page.evaluate(() => { for (let i = 0; i < 240; i++) { const cd = __me.cd; __step(1, __keep); if (__me.cd > cd + 0.05) return true; } return false; });
      if (fired) await page.evaluate(() => __step(1, __keep));
      row.imgs.firing = await grab(clip);
      await page.evaluate(() => { const n = game.projs.length; for (let i = 0; i < 120; i++) { __step(1, __keep); if (game.projs.length < n || (n === 0 && i > 3)) break; } __step(2, __keep); });
      row.imgs.impact = await grab(clip);
      cells.push(row);
    }

    // building destruction: a damaged enemy Refinery, finished off by Tanks
    const destroy = [];
    const bclip = await page.evaluate(() => {
      __fresh(true);
      game.sides[1].res.c = 1e5; tryBuild(game, 1, 'refinery', 1); const b = game.ents.find(e => e.type === 'refinery' && e.side === 1);
      b.built = true; b.progress = 1; b.hp = 30;
      for (let i = 0; i < 3; i++) { const t = spawnUnit(game, 0, 'tank', b.u - 150, (i - 1) * 40); __hold(t, t.u, t.v); }
      cam.x = b.u - 60; clampCam(); window.__b = b;
      const a = __screen(b.u - 220, 0), z = __screen(b.u, 0, 170), r = __screen(b.u + 120, 0);
      return { x: a.x, y: z.y, w: r.x - a.x, h: a.y - z.y + 90 };
    });
    await page.evaluate(() => { for (let i = 0; i < 600 && __b.hp > 0; i++) __step(1); __step(3); });
    destroy.push(await grab(bclip));
    await page.evaluate(() => __step(15)); destroy.push(await grab(bclip));
    await page.evaluate(() => __step(30)); destroy.push(await grab(bclip));
    await page.evaluate(() => __step(60)); destroy.push(await grab(bclip));

    // fog edge: enemy Artillery hidden in the fog shells our Riflemen
    const fogShots = [];
    const fclip = await page.evaluate(() => {
      __fresh(true);
      for (let i = 0; i < 3; i++) { const r = spawnUnit(game, 0, 'rifle', 760 + i * 12, (i - 1) * 25); __hold(r, r.u, r.v); }
      const a = spawnUnit(game, 1, 'artillery', 1140, 0); __hold(a, 1140, 0); window.__art = a;
      const orig = updateVision; updateVision = g => { orig(g); g.fog[1].vis.fill(1); }; // the enemy sees our men; the player still can't see the gun
      cam.x = 960; clampCam();
      const l = __screen(700, 0), r = __screen(1220, 0), t = __screen(900, 0, 160);
      return { x: Math.max(0, l.x), y: t.y, w: r.x - Math.max(0, l.x), h: l.y - t.y + 30 };
    });
    const fogInfo = await page.evaluate(() => { for (let i = 0; i < 300; i++) { const cd = __art.cd; __step(1); if (__art.cd > cd + 0.05) return { firedAt: i, gunLit: game.fog[0].vis[cellOf(__art.u)] }; } return null; });
    fogShots.push(await grab(fclip));
    await page.evaluate(() => __step(12)); fogShots.push(await grab(fclip));
    await page.evaluate(() => __step(14)); fogShots.push(await grab(fclip));

    // large battle with effects
    await page.evaluate(() => {
      __fresh(true);
      for (const s of [0, 1]) game.sides[s].stance = 'attack';
      const army = { rifle: 20, heavy: 8, sniper: 4, tank: 4, artillery: 2, titan: 1, aircraft: 2, interceptor: 2 };
      for (const s of [0, 1]) for (const [t, n] of Object.entries(army)) for (let i = 0; i < n; i++) spawnUnit(game, s, t, L / 2 + (s ? 1 : -1) * (120 + Math.random() * 150), (Math.random() - 0.5) * 200);
      __step(150);
    });
    const battleFile = path.join(outDir, `${tag}-battle-fx-${res}.png`);
    await page.screenshot({ path: battleFile }); console.log(battleFile);

    // compose sheets
    const sheet = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
    const img = b => `<img src="data:image/png;base64,${b}">`;
    const cols = ['idle', 'moving', 'firing', 'impact'];
    await sheet.setContent(`<style>body{margin:0;background:#0b0f18;color:#cfd8e6;font:600 14px system-ui}table{border-collapse:collapse}td{padding:4px;vertical-align:middle}img{display:block;max-width:330px}</style>
      <table><tr><td></td>${cols.map(c => `<td>${c}</td>`).join('')}</tr>${cells.map(r => `<tr><td>${r.type}</td>${cols.map(c => `<td>${img(r.imgs[c])}</td>`).join('')}</tr>`).join('')}</table>`);
    const unitsFile = path.join(outDir, `${tag}-fx-units-${res}.png`);
    await sheet.screenshot({ path: unitsFile, fullPage: true }); console.log(unitsFile);
    await sheet.setContent(`<style>body{margin:0;background:#0b0f18;color:#cfd8e6;font:600 14px system-ui}td{padding:4px}img{display:block;max-width:340px}</style>
      <table><tr><td>destroyed</td><td>+0.5 s</td><td>+1.5 s</td><td>+3.5 s</td></tr><tr>${destroy.map(b => `<td>${img(b)}</td>`).join('')}</tr></table>
      <p>Hidden enemy Artillery (right, in the fog) shelling our Riflemen: when it fires, 0.4 s later, 0.9 s later. Gun visible to the player when firing: ${fogInfo ? fogInfo.gunLit : 'did not fire'}</p>
      <table><tr>${fogShots.map(b => `<td>${img(b)}</td>`).join('')}</tr></table>`);
    const eventsFile = path.join(outDir, `${tag}-fx-destroy-fog-${res}.png`);
    await sheet.screenshot({ path: eventsFile, fullPage: true }); console.log(eventsFile);
    if (errors.length) console.log('ERRORS', errors);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
