// v2.82 (docs/FACTION_REWORK.md batch 2a): Test Range screenshots at 667×375 (iPhone landscape in the viewer).
//   node tests/rework-2a-shots.js   → docs/screenshots/rework2a-<shot>-667x375.png
// Shots: compare (Artillery, Gorebore, Severance against the same Infantry blob), artillery (three rows of Artillery against
// a moving Infantry blob: no Artillery switches, deploy only, deploy plus telegraph), burrow (a Gorebore underground with its
// trail), erupt (a Gorebore erupting), exile (units mid-exile), and a frame-time check with several of each on screen.
const path = require('path');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

// Builds a Test Range setup in the page (rows, items placed with the SIM helpers, each row's switches) and starts it
const setup = (page, o) => page.evaluate(o => {
  TR.set = Object.assign(trNewSet(), { rows: o.rows, modes: o.modes || ['attack', 'attack'] });
  TR.set.rw = [0, 1, 2].map(k => rwInit(o.rw && o.rw[k]));
  for (const it of o.items) for (let k = 0; k < o.rows; k++) if (it.row === undefined || it.row === k) {
    for (let i = 0; i < (it.n || 1); i++) TR.set.items.push({ id: TR.set.nid++, row: k, side: it.side, kind: 'u', type: it.type, u: it.u + (i % 5) * (it.dx ?? 16), v: it.v + Math.floor(i / 5) * 22 - ((it.n || 1) > 5 ? 11 : 0) + (i % 2) * 6 });
  }
  TR.go = false; trBuild(); hideOverlay();
  cam.x = o.cam || 860; clampCam();
  TR.go = true; trTopUI();
}, o);
const until = (page, fn, ms = 20000) => page.waitForFunction(fn, null, { timeout: ms, polling: 50 });

(async () => {
  const pw = findPlaywright(); if (!pw) { console.error('playwright not installed'); process.exit(1); }
  const browser = await pw.chromium.launch(), dev = NARROW;
  const shot = async (page, name) => { await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); }); await page.screenshot({ path: path.join(OUT, `rework2a-${name}-${dev.width}x${dev.height}.png`) }); console.log('wrote', name); };
  const open = async () => { const r = await openPage(browser, dev); await r.page.click('#bRange'); await r.page.waitForTimeout(300); await r.page.evaluate(() => hideOverlay()); return r; };
  const errs = [];
  { // a. Compare: one row each, the same Infantry blob
    const { page, errors } = await open();
    await setup(page, { rows: 3, cam: 900, items: [{ row: 0, side: 0, type: 'artillery', u: 640, v: 0, n: 3, dx: 22 }, { row: 1, side: 0, type: 'gorebore', u: 660, v: 0, n: 3, dx: 22 }, { row: 2, side: 0, type: 'severance', u: 700, v: 0, n: 3, dx: 22 }, { side: 1, type: 'rifle', u: 1060, v: 0, n: 10 }] });
    await until(page, () => TR.games[1].ents.some(e => e.bur) && TR.games[2].projs.some(p => p.weapon === 'exile') && TR.games[0].projs.length > 0, 25000).catch(() => {});
    await page.evaluate(() => { TR.go = false; trTopUI(); }); await page.waitForTimeout(150);
    await shot(page, 'compare'); errs.push(...errors); await page.close();
  }
  { // b. Artillery against a moving Infantry blob: no switches, deploy only, deploy plus telegraph
    const { page, errors } = await open();
    await setup(page, { rows: 3, cam: 900, rw: [{ artDeploy: false, artTelegraph: false }, { artDeploy: true, artTelegraph: false }, {}],
      items: [{ side: 0, type: 'artillery', u: 620, v: 0, n: 3, dx: 24 }, { side: 1, type: 'rifle', u: 1180, v: 0, n: 10 }] });
    await until(page, () => TR.games[2].mk && TR.games[2].mk.length >= 3 && TR.games[2].t > 4, 25000).catch(() => {});
    await page.evaluate(() => { TR.go = false; trTopUI(); }); await page.waitForTimeout(150);
    await shot(page, 'artillery'); errs.push(...errors); await page.close();
  }
  { // c. Gorebores burrowing toward Artillery (the trail), then erupting
    const { page, errors } = await open();
    await setup(page, { rows: 1, cam: 860, modes: ['attack', 'hold'], items: [{ side: 0, type: 'gorebore', u: 600, v: -30, n: 2, dx: 30 }, { side: 1, type: 'artillery', u: 1010, v: 0, n: 3, dx: 28 }, { side: 1, type: 'rifle', u: 950, v: 30, n: 3 }] });
    await until(page, () => game.ents.some(e => e.bur && e.u > 820), 25000).catch(() => {});
    await page.evaluate(() => { TR.go = false; trTopUI(); }); await page.waitForTimeout(150);
    await shot(page, 'burrow');
    await page.evaluate(() => { TR.go = true; });
    await until(page, () => game.fx.some(f => f.k === 'erupt' && f.t > 0.12), 25000).catch(() => {});
    await page.evaluate(() => { TR.go = false; trTopUI(); }); await page.waitForTimeout(150);
    await shot(page, 'erupt'); errs.push(...errors); await page.close();
  }
  { // d. Units mid-exile: Severances against Tanks and Riflemen
    const { page, errors } = await open();
    await setup(page, { rows: 1, cam: 900, items: [{ side: 0, type: 'severance', u: 680, v: 0, n: 2, dx: 30 }, { side: 0, type: 'bastion', u: 760, v: 0, n: 2, dx: 30 }, { side: 1, type: 'rifle', u: 1000, v: 0, n: 10, dx: 22 }, { side: 1, type: 'tank', u: 1080, v: 20, n: 2, dx: 30 }] });
    await until(page, () => game.ents.filter(e => e.exT > game.t && e.exT - game.t < 3).length >= 4, 25000).catch(() => {});
    await page.evaluate(() => { TR.go = false; trTopUI(); }); await page.waitForTimeout(150);
    await shot(page, 'exile'); errs.push(...errors); await page.close();
  }
  { // frame time: six of each of the three in one fight against a big blob, at 1×
    const { page, errors } = await open();
    await setup(page, { rows: 1, cam: 880, items: [{ side: 0, type: 'artillery', u: 640, v: -20, n: 6, dx: 22 }, { side: 0, type: 'gorebore', u: 700, v: 30, n: 6, dx: 22 }, { side: 0, type: 'severance', u: 760, v: 0, n: 6, dx: 22 }, { side: 1, type: 'rifle', u: 1080, v: 0, n: 10 }, { side: 1, type: 'tank', u: 1140, v: 0, n: 5, dx: 26 }, { side: 1, type: 'sniper', u: 1180, v: 30, n: 5 }] });
    await page.waitForTimeout(1500);
    const ft = await page.evaluate(() => new Promise(res => { const t = []; let last = performance.now(), n = 0; const f = now => { t.push(now - last); last = now; if (++n < 180) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); }));
    ft.sort((a, b) => a - b);
    console.log(`frame time with 6 Artillery, 6 Gorebores, 6 Severances vs 20 (headless, 2× pixels): median ${ft[90].toFixed(1)} ms, 95th ${ft[171].toFixed(1)} ms`);
    errs.push(...errors); await page.close();
  }
  if (errs.length) { console.error('page errors:', errs); process.exitCode = 1; }
  await browser.close();
})();
