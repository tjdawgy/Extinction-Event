#!/usr/bin/env node
// Phase 7c (Part C): does 1x run at true speed in the browser? Plays the real page in headless Chromium at iPhone landscape
// size (tests/browser-kit.js), then measures game seconds per real second and frame rate over a window, in the early game
// and in a large battle, at normal CPU and with CPU throttling (Chrome DevTools Emulation.setCPUThrottlingRate).
//   node audit/sim/speed7c.js [--html=path/to/index.html] [--throttle=1,4] [--secs=8] [--label=name]
// The window starts after a warm-up; the large battle spawns `n` mixed units per side in mid-lane on Attack.
const path = require('path');
const { findPlaywright, PHONE, openPage } = require('../../tests/browser-kit');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
(async () => {
  if (arg('html')) process.env.EE_HTML = path.resolve(arg('html'));
  const pw = findPlaywright(), browser = await pw.chromium.launch();
  const secs = +(arg('secs') || 8), label = arg('label') || path.basename(process.env.EE_HTML || 'index.html'), n = +(arg('n') || 40);
  const out = [];
  for (const thr of (arg('throttle') || '1,4').split(',').map(Number)) for (const phase of ['early', 'battle']) {
    const { page, errors } = await openPage(browser, PHONE);
    const cdp = await page.context().newCDPSession(page);
    await page.click('#bPlay');
    await page.waitForFunction(() => typeof game !== 'undefined' && game && game.countdown === 0, null, { timeout: 20000 });
    await page.evaluate(([phase, n]) => {
      const S = window; // the page's globals
      if (phase === 'battle') {
        const t0 = ['rifle', 'rifle', 'heavy', 'tank', 'rifle', 'sniper', 'flame', 'artillery'];
        const t1 = game.sides[1].faction === 'lastfist' ? t0 : Object.keys(UDEF).filter(k => UDEF[k].fac === facOf(game.sides[1].faction) && !UDEF[k].air && !UDEF[k].noTrain && UDEF[k].tier <= 2).slice(0, 8);
        for (let i = 0; i < n; i++) { spawnUnit(game, 0, t0[i % t0.length], L / 2 - 120 - (i % 10) * 8, (i % 9 - 4) * 22); spawnUnit(game, 1, t1[i % t1.length], L / 2 + 120 + (i % 10) * 8, (i % 9 - 4) * 22); }
        setStance(game, 0, 'attack'); game.sides[1].stance = 'attack';
        cam.x = P(L / 2, 0).x; camTouched = true; clampCam(); // the battle in view
      }
    }, [phase, n]);
    if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
    await page.waitForTimeout(1500); // warm-up
    const r = await page.evaluate((secs) => new Promise(res => {
      const g0 = game.t, w0 = performance.now(); let frames = 0, worst = 0, prev = w0;
      const tick = ts => { frames++; worst = Math.max(worst, ts - prev); prev = ts; if (ts - w0 < secs * 1000) requestAnimationFrame(tick); else res({ gs: game.t - g0, real: (ts - w0) / 1000, frames, worst, units: game.ents.filter(e => e.kind === 'u' && e.hp > 0).length }); };
      requestAnimationFrame(tick);
    }), secs);
    if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const row = { label, throttle: thr, phase, ratio: +(r.gs / r.real).toFixed(3), fps: +(r.frames / r.real).toFixed(1), worstMs: Math.round(r.worst), units: r.units, errors: errors.length };
    out.push(row); console.log(JSON.stringify(row));
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
