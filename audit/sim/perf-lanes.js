#!/usr/bin/env node
// v2.70 (Three-Lane): the army-cap performance check at iPhone resolution. Plays the real page in headless Chromium at
// 858×396 and 667×375 (tests/browser-kit.js) on a lane map, spawns n units a side (a mixed ground army, spread over every
// lane, on Attack, so they meet mid-map), and measures game seconds per real second, frames per second, the mean and the
// worst frame time over a window, at normal CPU and with CPU throttling (Chrome DevTools Emulation.setCPUThrottlingRate).
//   node audit/sim/perf-lanes.js [--map=threelane] [--n=120] [--throttle=1,4] [--secs=8]
const { findPlaywright, PHONE, NARROW, openPage } = require('../../tests/browser-kit');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
(async () => {
  const pw = findPlaywright(), browser = await pw.chromium.launch();
  const map = arg('map', 'threelane'), n = +arg('n', 120), secs = +arg('secs', 8);
  for (const dev of [PHONE, NARROW]) for (const thr of arg('throttle', '1,4').split(',').map(Number)) {
    const { page, errors } = await openPage(browser, dev);
    const cdp = await page.context().newCDPSession(page);
    await page.evaluate(m => { mapPick = m; }, map);
    await page.click('#bPlay'); await page.click(`.mapc[data-m="${map}"]`); await page.click('#bMapGo');
    await page.waitForFunction(() => typeof game !== 'undefined' && game, null, { timeout: 20000 });
    await page.evaluate(n => {
      game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; camTouched = true;
      const T = ['rifle', 'rifle', 'heavy', 'tank', 'rifle', 'sniper', 'flame', 'artillery', 'titan', 'aircraft'];
      for (let i = 0; i < n; i++) for (const s of [0, 1]) {
        const k = i % MAP.lanes.length, x = L / 2 + (s ? 1 : -1) * (150 + (i % 12) * 9), u = spawnUnit(game, s, T[i % T.length], x, laneY(MAP.lanes[k], x) + ((i % 5) - 2) * 18); u.lane = k;
      }
      setStance(game, 0, 'attack'); game.sides[1].stance = 'attack';
      cam.x = L / 2; cam.y = 0; clampCam(); paused = false;
    }, n);
    if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(secs => new Promise(res => {
      const g0 = game.t, w0 = performance.now(); let frames = 0, worst = 0, prev = w0;
      const tick = ts => { frames++; worst = Math.max(worst, ts - prev); prev = ts; if (ts - w0 < secs * 1000) requestAnimationFrame(tick); else res({ gs: game.t - g0, real: (ts - w0) / 1000, frames, worst, units: game.ents.filter(e => e.kind === 'u' && e.hp > 0).length }); };
      requestAnimationFrame(tick);
    }), secs);
    if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    console.log(JSON.stringify({ map, n, size: `${dev.width}x${dev.height}`, throttle: thr, speed: +(r.gs / r.real).toFixed(3), fps: +(r.frames / r.real).toFixed(1), meanMs: +(r.real * 1000 / r.frames).toFixed(1), worstMs: Math.round(r.worst), unitsAlive: r.units, errors: errors.length }));
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
