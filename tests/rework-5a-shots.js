// v2.89 (batch 5a, Last Fist art): screenshots at 667×375 (iPhone landscape in the viewer).
//   node tests/rework-5a-shots.js                       → docs/screenshots/rework5a-<shot>-667x375.png
//   node tests/rework-5a-shots.js --before old.html     → also the size-before shot from another build (v2.88's index.html)
// Shots: gallery (all 13 Last Fist units in both team colours, as DRAW_U draws them), bombing (a Leviathan mid run, bay
// open, bombs falling), size-after / size-before (the Leviathan, Worldrender and Sovereign each beside a tier-1 unit at real
// size), match (a real Hard AI match, Last Fist vs Bloomhost, with Marines, a vehicle and aircraft on screen), muzzles (each
// Last Fist gunner firing, paused just after the shot: tracers start at the new barrels).
const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const before = process.argv.includes('--before') ? process.argv[process.argv.indexOf('--before') + 1] : null;
const { findPlaywright, NARROW, openPage } = require('./browser-kit');

const setup = (page, o) => page.evaluate(o => {
  TR.set = Object.assign(trNewSet(), { rows: 1, modes: o.modes || ['attack', 'attack'], fight: o.fight !== false });
  TR.set.rw = [0, 1, 2].map(() => rwInit());
  for (const it of o.items) {
    if (it.b) { TR.set.items.push({ id: TR.set.nid++, row: 0, side: it.side, kind: 'b', fac: it.fac, type: it.b, u: it.u, v: it.v }); continue; }
    for (let i = 0; i < (it.n || 1); i++) TR.set.items.push({ id: TR.set.nid++, row: 0, side: it.side, kind: 'u', type: it.type, u: it.u + (i % (it.w || 5)) * (it.dx ?? 16), v: it.v + Math.floor(i / (it.w || 5)) * (it.dv ?? 22) });
  }
  TR.go = false; trBuild(); hideOverlay();
  if (o.zoom) { window.trZoom = () => {}; applyZoom(o.zoom); }
  cam.x = o.cam || 860; clampCam(); TR.go = true; trTopUI();
}, o);
const run = (page, fn, sec = 30) => page.evaluate(([f, sec]) => { const F = new Function('game', 'return (' + f + ')(game)'); for (let i = 0; i < sec * 60; i++) { if (F(game)) return true; rangeStep(game); } return false; }, [fn.toString(), sec]);
const pause = async page => { await page.evaluate(() => { TR.go = false; trTopUI(); }); await page.waitForTimeout(300); };
const LF = ['rifle', 'heavy', 'sniper', 'tank', 'artillery', 'titan', 'flame', 'hydra', 'aircraft', 'interceptor', 'leviathan', 'medic', 'drone'];

async function sizeShot(browser, name) {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#bRange'); await page.waitForTimeout(300); await page.evaluate(() => hideOverlay());
  await setup(page, { cam: 760, zoom: 1, modes: ['hold', 'hold'], fight: false, items: [
    { side: 0, type: 'leviathan', u: 600, v: 0 }, { side: 0, type: 'rifle', u: 640, v: 20 },
    { side: 1, type: 'worldrender', u: 760, v: 0 }, { side: 1, type: 'skitterling', u: 800, v: 20 },
    { side: 1, type: 'sovereign', u: 920, v: 0 }, { side: 1, type: 'shardling', u: 960, v: 20 }] });
  await page.evaluate(() => { for (const e of game.ents) if (e.side === 1) e.side = e.side; });
  await run(page, () => false, 0.4); await pause(page);
  await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); });
  await page.screenshot({ path: path.join(OUT, `rework5a-${name}-667x375.png`) }); console.log('wrote', name);
  await page.close(); return errors;
}

(async () => {
  const pw = findPlaywright(); if (!pw) { console.error('playwright not installed'); process.exit(1); }
  const browser = await pw.chromium.launch(), dev = NARROW, errs = [], miss = [];
  const ok = (b, n) => { if (!b) miss.push(n); };
  const shot = async (page, name) => { await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); }); await page.screenshot({ path: path.join(OUT, `rework5a-${name}-${dev.width}x${dev.height}.png`) }); console.log('wrote', name); };
  const open = async () => { const r = await openPage(browser, dev); await r.page.click('#bRange'); await r.page.waitForTimeout(300); await r.page.evaluate(() => hideOverlay()); return r; };
  if (before) { // c, before: the same scene drawn by another build (v2.88)
    const save = process.env.EE_HTML; process.env.EE_HTML = before; errs.push(...await sizeShot(browser, 'size-before')); process.env.EE_HTML = save || '';
    if (!save) delete process.env.EE_HTML;
  }
  { // a. The gallery: all 13 units in both team colours
    const { page, errors } = await open();
    await page.evaluate(LF => {
      const cv = document.createElement('canvas'), W = innerWidth, H = innerHeight, dpr = devicePixelRatio || 1; cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99;background:#2a3127`;
      document.body.appendChild(cv); const c = cv.getContext('2d'); c.scale(dpr, dpr);
      const K = { rifle: 2.3, heavy: 2, sniper: 1.9, tank: 1.15, artillery: 0.95, titan: 1.15, flame: 1.15, hydra: 1, aircraft: 1.1, interceptor: 1.05, leviathan: 0.74, medic: 1.5, drone: 2.4 };
      c.fillStyle = '#d6dfee'; c.font = 'bold 10px system-ui'; c.textAlign = 'center';
      LF.forEach((t, i) => { const cols = 5, col = i % cols, row = Math.floor(i / cols), cw = W / cols, x = cw * (col + 0.5), y = 100 + row * 118, air = UDEF[t].air;
        for (let s = 0; s < 2; s++) { c.save(); c.translate(x + (s ? 33 : -33) + (t === 'titan' ? (s ? 6 : -10) : 0), y - (air ? 24 : 0)); const k = K[t]; c.scale(k * (s ? -1 : 1), k);
          DRAW_U[t](c, TEAM[s], { anim: 0.9 + s * 0.4, moving: !air, recoil: 0, u: 0, side: s, lvB: 0, dpk: 0, sk: 0 }); c.restore(); }
        c.fillText(UDEF[t].name, x, y + 14); });
    }, LF);
    await page.waitForTimeout(200); await shot(page, 'gallery'); errs.push(...errors); await page.close();
  }
  { // b. A Leviathan mid bombing run: bay open over the target, bombs falling
    const { page, errors } = await open();
    await setup(page, { cam: 760, zoom: 1.6, modes: ['attack', 'hold'], fight: false, items: [{ side: 0, type: 'leviathan', u: 600, v: 110 }, { side: 1, b: 'refinery', fac: 'bloomhost', u: 820, v: 110 }, { side: 1, b: 'refinery', fac: 'bloomhost', u: 900, v: 150 }] });
    await page.evaluate(() => { for (const e of game.ents) if (e.kind === 'b') e.hp = e.maxHp = 99999; });
    ok(await run(page, g => { const L = g.ents.find(e => e.type === 'leviathan'); return L && L.lvB && g.projs.filter(p => p.weapon === 'bomb').length >= 2; }, 40), 'bombing');
    await page.evaluate(() => { const L = game.ents.find(e => e.type === 'leviathan'); cam.x = P(L.u, L.v).x + 30; clampCam(); });
    await pause(page); await shot(page, 'bombing'); errs.push(...errors); await page.close();
  }
  errs.push(...await sizeShot(browser, 'size-after')); // c, after
  { // e. Muzzles: each gunner a moment after it fires (tracers start at the new barrels)
    const { page, errors } = await open();
    await setup(page, { cam: 720, zoom: 1.8, modes: ['hold', 'hold'], items: [
      { side: 0, type: 'rifle', u: 610, v: 50 }, { side: 0, type: 'tank', u: 590, v: 170 }, { side: 0, type: 'aircraft', u: 560, v: 120 },
      { side: 1, type: 'heavy', u: 700, v: 50 }, { side: 1, type: 'heavy', u: 700, v: 170 }, { side: 1, type: 'tank', u: 690, v: 120 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 99999; });
    ok(await run(page, g => new Set(g.projs.filter(p => p.side === 0).map(p => p.weapon)).size >= 2, 20), 'muzzles');
    await pause(page); await shot(page, 'muzzles'); errs.push(...errors); await page.close();
  }
  { // d. A real Hard AI match: Last Fist (blue) vs Bloomhost, Marines, a vehicle and aircraft on screen
    const { page, errors } = await openPage(browser, dev);
    let found = 0;
    for (let tries = 0; tries < 4 && !found; tries++) { // a spectated match is seeded at random: try up to four
      await page.evaluate(() => { devPick.a = { f: 'lastfist', ai: 'default', p: 'random' }; devPick.b = { f: 'bloomhost', ai: 'default', p: 'random' }; devPick.speed = 1; startSpectate(); paused = true; });
      found = await page.evaluate(() => {
        const LFU = () => game.ents.filter(e => e.kind === 'u' && e.side === 0 && e.hp > 0);
        for (let i = 0; i < 60 * 60 * 22 && !game.over; i++) {
          update(game, 1 / 60);
          if (i % 60) continue;
          for (const a of LFU().filter(e => UDEF[e.type].air)) { // a window around an aircraft with Marines and a vehicle in it, enemies near
            const near = LFU().filter(e => Math.abs(e.u - a.u) < 260);
            if (near.some(e => e.type === 'rifle') && near.some(e => ['tank', 'flame', 'artillery', 'titan', 'hydra'].includes(e.type)) && game.ents.some(e => e.kind === 'u' && e.side === 1 && e.hp > 0 && Math.abs(e.u - a.u) < 320)) { cam.x = P(a.u, a.v).x; clampCam(); return game.t; }
          }
        }
        return 0;
      });
    }
    ok(found, 'match'); await page.waitForTimeout(400); await shot(page, 'match'); errs.push(...errors); await page.close();
  }
  if (miss.length) console.error('moments not reached (shot taken anyway):', miss);
  if (errs.length) { console.error('page errors:', errs); process.exitCode = 1; }
  await browser.close();
})();
