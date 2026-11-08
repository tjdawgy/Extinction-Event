#!/usr/bin/env node
// Phase 1 (v2.63, docs/MAP_FORMAT.md): the 2D fog performance check. Plays the real page in headless Chromium at both
// iPhone landscape sizes with CPU throttling, early game and a large battle, and compares today's fog (one row of 10-wide
// cells along the lane) with a 2D grid prototype (20 x 20 cells over the whole field, circles of sight on true distance):
//   vision: the cost of the vision update per tick. Both run on the same game state every tick (the game keeps using
//           today's result); the prototype's cells are filled row by row (a span per row of each sight circle).
//   fog drawing: per frame, in two separate runs: today's gradient, or the 2D grid as an alpha image redrawn only
//           when vision changes and stretched over the ground with smoothing.
//   frame: the whole frame (frame time, frames per second) in each run.
//   node audit/sim/fog-bench.js [--throttle=4] [--secs=6] [--n=40]
const { findPlaywright, PHONE, NARROW, openPage } = require('../../tests/browser-kit');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const PROTO = () => {
  const C2 = 20, NX = Math.ceil(L / C2) + 1, Y0 = -200, NY = Math.ceil(400 / C2) + 1;
  window.__fb = { vis: [0, 1].map(() => new Uint8Array(NX * NY)), exp: [0, 1].map(() => new Uint8Array(NX * NY)), tV1: [], tV2: [], tF: [], ver: 0, off: document.createElement('canvas'), img: null, drawn: -1 };
  const B = window.__fb; B.off.width = NX; B.off.height = NY; const oc = B.off.getContext('2d'); B.img = oc.createImageData(NX, NY);
  const vis2 = g => {
    for (let s = 0; s < 2; s++) {
      const vis = B.vis[s], exp = B.exp[s]; vis.fill(0);
      const reveal = (u, v, r) => { for (let j = 0; j < NY; j++) { const dy = Y0 + j * C2 - v; if (dy > r || dy < -r) continue; const dx = Math.sqrt(r * r - dy * dy), i0 = Math.max(0, Math.floor((u - dx) / C2)), i1 = Math.min(NX - 1, Math.floor((u + dx) / C2)); vis.fill(1, j * NX + i0, j * NX + i1 + 1); } };
      for (const e of g.ents) if (e.side === s && e.hp > 0) reveal(e.u, e.v, sightOf(e));
      for (const n of g.nodes) if (n.owner === s) reveal(n.u, n.v, NODE_SIGHT);
      let ch = 0; for (let k = 0; k < vis.length; k++) if (vis[k] && !exp[k]) { exp[k] = 1; ch = 1; }
      // what the vision update then does with it: which enemy entities are in view
      let seen = 0; for (const e of g.ents) if (e.side !== s && e.hp > 0) { const i = Math.min(NX - 1, Math.max(0, Math.floor(e.u / C2))), j = Math.min(NY - 1, Math.max(0, Math.floor((e.v - Y0) / C2))); if (vis[j * NX + i]) seen++; }
      if (s === 0) B.ver++;
    }
  };
  const orig = updateVision;
  window.updateVision = g => { const a = performance.now(); orig(g); const b = performance.now(); vis2(g); const c = performance.now(); B.tV1.push(b - a); B.tV2.push(c - b); };
  window.__fog2 = (c, F) => {
    const a = performance.now();
    if (B.drawn !== B.ver) { const d = B.img.data, vis = B.vis[0], exp = B.exp[0]; for (let k = 0; k < vis.length; k++) { d[k * 4] = 5; d[k * 4 + 1] = 8; d[k * 4 + 2] = 20; d[k * 4 + 3] = vis[k] ? 0 : exp[k] ? 115 : 189; } oc.putImageData(B.img, 0, 0); B.drawn = B.ver; }
    c.save(); c.imageSmoothingEnabled = true; c.drawImage(B.off, 0, 0, NX, NY, -C2 / 2, (Y0 - C2 / 2) * DY, NX * C2, NY * C2 * DY); c.restore();
    B.tF.push(performance.now() - a);
  };
  const origF = drawFog;
  window.__fog1 = (c, F) => { const a = performance.now(); origF(c, F); B.tF.push(performance.now() - a); };
};
const stat = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? { mean: +(b.reduce((x, y) => x + y, 0) / b.length).toFixed(3), p95: +b[Math.floor(b.length * 0.95)].toFixed(3) } : null; };
(async () => {
  const pw = findPlaywright(), browser = await pw.chromium.launch(), thr = +arg('throttle', 4), secs = +arg('secs', 6), n = +arg('n', 40), out = [];
  for (const dev of [PHONE, NARROW]) for (const phase of ['early', 'battle']) for (const mode of ['1d', '2d']) {
    const { page, errors } = await openPage(browser, dev);
    const cdp = await page.context().newCDPSession(page);
    await page.click('#bPlay');
    await page.waitForFunction(() => typeof game !== 'undefined' && game && game.countdown === 0, null, { timeout: 20000 });
    await page.evaluate(PROTO);
    await page.evaluate(([phase, n, mode]) => {
      window.drawFog = mode === '2d' ? window.__fog2 : window.__fog1;
      if (phase === 'battle') {
        const t0 = ['rifle', 'rifle', 'heavy', 'tank', 'rifle', 'sniper', 'flame', 'artillery'];
        for (let i = 0; i < n; i++) { spawnUnit(game, 0, t0[i % 8], L / 2 - 120 - (i % 10) * 8, (i % 9 - 4) * 22); spawnUnit(game, 1, t0[i % 8], L / 2 + 120 + (i % 10) * 8, (i % 9 - 4) * 22); }
        setStance(game, 0, 'attack'); game.sides[1].stance = 'attack';
        cam.x = L / 2; camTouched = true; clampCam();
      }
    }, [phase, n, mode]);
    if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
    await page.waitForTimeout(1000);
    await page.evaluate(() => { __fb.tV1 = []; __fb.tV2 = []; __fb.tF = []; });
    const r = await page.evaluate(secs => new Promise(res => {
      const w0 = performance.now(), dts = []; let prev = w0;
      const tick = ts => { dts.push(ts - prev); prev = ts; if (ts - w0 < secs * 1000) requestAnimationFrame(tick); else res({ dts, units: game.ents.filter(e => e.kind === 'u').length, tV1: __fb.tV1, tV2: __fb.tV2, tF: __fb.tF }); };
      requestAnimationFrame(tick);
    }), secs);
    if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const row = { size: `${dev.width}x${dev.height}`, phase, fog: mode, units: r.units, frame: stat(r.dts.slice(1)), fps: +(r.dts.length / secs).toFixed(1), vision1d: stat(r.tV1), vision2d: stat(r.tV2), fogDraw: stat(r.tF), errors: errors.length };
    out.push(row); console.log(JSON.stringify(row));
    await page.close();
  }
  await browser.close();
  if (arg('json')) require('fs').writeFileSync(arg('json'), JSON.stringify(out, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
