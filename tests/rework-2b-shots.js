// v2.83 (docs/FACTION_REWORK.md batch 2b): Test Range screenshots at 667×375 (iPhone landscape in the viewer).
//   node tests/rework-2b-shots.js   → docs/screenshots/rework2b-<shot>-667x375.png
// Shots: artillery (Artillery shelling an advancing Infantry blob that walks straight through the markers: no dodging),
// cover (a Titan with covered Riflemen against enemy ranged units), breach (a Titan planted beside a building), trail (a
// Ruinmaw tunnelling), gate (the Ruinmaw surfaced, units pouring out of its mouth), rupture (a Worldbreaker's crack racing
// out), ridge (a ridge with enemies walking around its end), and a frame-time check with several of each on screen.
const path = require('path');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

const setup = (page, o) => page.evaluate(o => {
  TR.set = Object.assign(trNewSet(), { rows: o.rows || 1, modes: o.modes || ['attack', 'attack'] });
  TR.set.rw = [0, 1, 2].map(k => rwInit(o.rw && o.rw[k]));
  for (const it of o.items) for (let k = 0; k < (o.rows || 1); k++) if (it.row === undefined || it.row === k) {
    if (it.b) { TR.set.items.push({ id: TR.set.nid++, row: k, side: it.side, kind: 'b', fac: it.fac, type: it.b, u: it.u, v: it.v }); continue; }
    for (let i = 0; i < (it.n || 1); i++) TR.set.items.push({ id: TR.set.nid++, row: k, side: it.side, kind: 'u', type: it.type, u: it.u + (i % 5) * (it.dx ?? 16), v: it.v + Math.floor(i / 5) * 22 - ((it.n || 1) > 5 ? 11 : 0) + (i % 2) * 6 });
  }
  TR.go = false; trBuild(); hideOverlay();
  cam.x = o.cam || 860; clampCam();
  TR.go = true; trTopUI();
}, o);
const until = (page, fn, ms = 20000) => page.waitForFunction(fn, null, { timeout: ms, polling: 30 });
const pause = async page => { await page.evaluate(() => { TR.go = false; trTopUI(); }); await page.waitForTimeout(200); };

(async () => {
  const pw = findPlaywright(); if (!pw) { console.error('playwright not installed'); process.exit(1); }
  const browser = await pw.chromium.launch(), dev = NARROW;
  const shot = async (page, name) => { await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); }); await page.screenshot({ path: path.join(OUT, `rework2b-${name}-${dev.width}x${dev.height}.png`) }); console.log('wrote', name); };
  const open = async () => { const r = await openPage(browser, dev); await r.page.click('#bRange'); await r.page.waitForTimeout(300); await r.page.evaluate(() => hideOverlay()); return r; };
  const errs = [];
  { // a. Artillery against an advancing Infantry blob: the blob walks through the markers
    const { page, errors } = await open();
    await setup(page, { cam: 880, items: [{ side: 0, type: 'artillery', u: 600, v: 0, n: 3, dx: 26 }, { side: 1, type: 'rifle', u: 1160, v: 0, n: 12, dx: 18 }] });
    await until(page, () => game.mk && game.mk.length >= 3 && game.mk.some(m => game.ents.some(e => e.side === 1 && e.hp > 0 && Math.hypot(e.u - m.u, (e.v - m.v) * 0.6) < m.r)), 30000).catch(() => {});
    await pause(page); await shot(page, 'artillery'); errs.push(...errors); await page.close();
  }
  { // b. A Titan with covered Riflemen against enemy ranged units
    const { page, errors } = await open();
    await setup(page, { cam: 840, modes: ['hold', 'attack'], items: [{ side: 0, type: 'titan', u: 700, v: 0 }, { side: 0, type: 'rifle', u: 712, v: -30, n: 8, dx: 12 }, { side: 0, type: 'rifle', u: 600, v: 70, n: 3, dx: 14 }, { side: 1, type: 'heavy', u: 1040, v: -20, n: 4, dx: 18 }, { side: 1, type: 'rifle', u: 1020, v: 20, n: 6, dx: 16 }] });
    await until(page, () => game.t > 3.5 && game.ents.some(e => e.side === 1 && e.tgt), 25000).catch(() => {});
    await pause(page); await shot(page, 'cover'); errs.push(...errors); await page.close();
  }
  { // c. A Titan planted beside a building
    const { page, errors } = await open();
    await setup(page, { cam: 900, modes: ['attack', 'hold'], items: [{ side: 0, type: 'titan', u: 620, v: 0 }, { side: 0, type: 'rifle', u: 600, v: -40, n: 4, dx: 14 }, { side: 1, b: 'refinery', fac: 'lastfist', u: 900, v: 0 }, { side: 1, b: 'reactor', fac: 'lastfist', u: 960, v: 60 }] });
    await until(page, () => game.ents.some(e => e.type === 'titan' && e.siege === 2) && game.projs.some(p => p.side === 0 && p.weapon === 'siege'), 30000).catch(() => {});
    await pause(page); await shot(page, 'breach'); errs.push(...errors); await page.close();
  }
  { // d. A Ruinmaw tunnelling (its trail), then surfaced with units pouring out of its mouth
    const { page, errors } = await open();
    await setup(page, { cam: 700, modes: ['hold', 'hold'], items: [{ side: 0, type: 'ruinmaw', u: 380, v: 20 }, { side: 0, type: 'skitterling', u: 200, v: 0, n: 10, dx: 14 }, { side: 0, type: 'bulwark', u: 260, v: 50, n: 2, dx: 20 }, { side: 1, b: 'refinery', fac: 'lastfist', u: 1190, v: -60 }, { side: 1, type: 'rifle', u: 1260, v: 50, n: 3, dx: 14 }] });
    await page.evaluate(() => { const R = game.ents.find(e => e.type === 'ruinmaw'); command(game, 0, [R.id], 'go', 1000, -10); });
    await until(page, () => game.ents.some(e => e.type === 'ruinmaw' && e.bur && e.u > 680), 30000).catch(() => {});
    await page.evaluate(() => { const R = game.ents.find(e => e.type === 'ruinmaw'); cam.x = R.u + 40; clampCam(); });
    await pause(page); await shot(page, 'trail');
    await page.evaluate(() => { TR.go = true; trTopUI(); });
    await until(page, () => game.ents.some(e => e.type === 'ruinmaw' && !e.bur && !e.moving && e.u > 980), 40000).catch(() => {});
    await page.evaluate(() => { TR.go = false; trTopUI(); const ids = game.ents.filter(e => e.side === 0 && e.kind === 'u' && e.type !== 'ruinmaw').map(e => e.id); command(game, 0, ids, 'tunnel'); });
    await page.evaluate(() => { const R = game.ents.find(e => e.type === 'ruinmaw'); for (let i = 0; i < 60 * 30; i++) { rangeStep(game); const out = game.ents.filter(e => e.side === 0 && e.type !== 'ruinmaw' && !e.tn && Math.abs(e.u - R.u) < 150).length; if (out >= 5 && game.fx.some(f => f.k === 'emerge' && !f.inn && f.t < 0.2)) break; } }); // stepped here: a headless page runs slower than real time
    await page.evaluate(() => { const R = game.ents.find(e => e.type === 'ruinmaw'); cam.x = R.u + 10; clampCam(); });
    await pause(page); await shot(page, 'gate');
    await page.evaluate(() => { cam.x = 160; clampCam(); }); await page.waitForTimeout(150); await shot(page, 'entrance');
    errs.push(...errors); await page.close();
  }
  { // e. A Worldbreaker's crack, then a ridge with enemies walking around it
    const { page, errors } = await open();
    await setup(page, { cam: 860, modes: ['hold', 'attack'], items: [{ side: 0, type: 'worldbreaker', u: 600, v: 0 }, { side: 0, type: 'bastion', u: 560, v: 50, n: 2, dx: 24 }, { side: 1, type: 'rifle', u: 1060, v: -10, n: 10, dx: 16 }, { side: 1, type: 'heavy', u: 1160, v: 10, n: 5, dx: 18 }] });
    await until(page, () => game.rup && game.rup.some(r => r.f > 60 && r.f < r.len - 40), 30000).catch(() => {});
    await pause(page); await shot(page, 'rupture');
    await page.evaluate(() => { TR.go = true; trTopUI(); });
    await until(page, () => game.rdg && game.rdg.some(R => game.t - R.t0 > 1.8), 30000).catch(() => {});
    await pause(page); await shot(page, 'ridge'); errs.push(...errors); await page.close();
  }
  { // frame time: six of each against a big blob, at 1×
    const { page, errors } = await open();
    await setup(page, { cam: 880, items: [{ side: 0, type: 'titan', u: 620, v: -30, n: 6, dx: 24 }, { side: 0, type: 'ruinmaw', u: 680, v: 40, n: 6, dx: 24 }, { side: 0, type: 'worldbreaker', u: 760, v: 0, n: 6, dx: 24 }, { side: 0, type: 'rifle', u: 640, v: -60, n: 10 }, { side: 1, type: 'rifle', u: 1100, v: 0, n: 20 }, { side: 1, type: 'tank', u: 1180, v: 30, n: 5 }] });
    await page.waitForTimeout(2500);
    const ft = await page.evaluate(() => new Promise(res => { const t = []; let last = performance.now(), n = 0; const f = now => { t.push(now - last); last = now; if (++n < 180) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); }));
    ft.sort((a, b) => a - b);
    console.log(`frame time with 6 Titans, 6 Ruinmaws, 6 Worldbreakers, 10 Riflemen vs 25 (headless, 2× pixels): median ${ft[90].toFixed(1)} ms, 95th ${ft[171].toFixed(1)} ms`);
    errs.push(...errors); await page.close();
  }
  if (errs.length) { console.error('page errors:', errs); process.exitCode = 1; }
  await browser.close();
})();
