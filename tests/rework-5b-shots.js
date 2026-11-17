// v2.88 (the Bloomhost swarm pass, batch 5b): Test Range screenshots at 667×375 (iPhone landscape in the viewer).
//   node tests/rework-5b-shots.js   → docs/screenshots/rework5b-<shot>-667x375.png
// Shots: swarm-surge (a 20-Skitterling swarm surging into Marines, motion streaks), swarm-frenzy (the kill frenzy's pulse
// after the first kills), spitters-gunships (Spitters' quill volleys shooting down Gunships), needlewings-interceptor
// (Needlewings swarming an Interceptor), lineup (the new Dreadthorn beside a Bulwark and a Thornback, zoomed in), gallery
// (the eight redrawn units), picker (the Test Range's Bloomhost unit picker), and a frame-time check with a big swarm.
const path = require('path');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

const setup = (page, o) => page.evaluate(o => {
  TR.set = Object.assign(trNewSet(), { rows: 1, modes: o.modes || ['attack', 'attack'], fight: o.fight !== false });
  TR.set.rw = [0, 1, 2].map(k => rwInit(o.rw && o.rw[k]));
  for (const it of o.items) {
    if (it.b) { TR.set.items.push({ id: TR.set.nid++, row: 0, side: it.side, kind: 'b', fac: it.fac, type: it.b, u: it.u, v: it.v }); continue; }
    for (let i = 0; i < (it.n || 1); i++) TR.set.items.push({ id: TR.set.nid++, row: 0, side: it.side, kind: 'u', type: it.type, u: it.u + (i % (it.w || 5)) * (it.dx ?? 16), v: it.v + Math.floor(i / (it.w || 5)) * (it.dv ?? 22) + (i % 2) * 4 });
  }
  TR.go = false; trBuild(); hideOverlay();
  if (o.zoom) { window.trZoom = () => {}; applyZoom(o.zoom); } // a closer look (the Test Range keeps one row at zoom 1 otherwise)
  cam.x = o.cam || 860; clampCam();
  TR.go = true; trTopUI();
}, o);
const run = (page, fn, sec = 30) => page.evaluate(([f, sec]) => { const F = new Function('game', 'return (' + f + ')(game)'); for (let i = 0; i < sec * 60; i++) { if (F(game)) return true; rangeStep(game); } return false; }, [fn.toString(), sec]);
const pause = async page => { await page.evaluate(() => { TR.go = false; trTopUI(); }); await page.waitForTimeout(300); };

(async () => {
  const pw = findPlaywright(); if (!pw) { console.error('playwright not installed'); process.exit(1); }
  const browser = await pw.chromium.launch(), dev = NARROW;
  const shot = async (page, name) => { await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); }); await page.screenshot({ path: path.join(OUT, `rework5b-${name}-${dev.width}x${dev.height}.png`) }); console.log('wrote', name); };
  const open = async () => { const r = await openPage(browser, dev); await r.page.click('#bRange'); await r.page.waitForTimeout(300); await r.page.evaluate(() => hideOverlay()); return r; };
  const errs = [], miss = [];
  const ok = (b, n) => { if (!b) miss.push(n); };
  { // a. A 20-Skitterling swarm surging into Marines: streaks at full surge, then the frenzy pulse after the first kills
    const { page, errors } = await open();
    await setup(page, { cam: 700, zoom: 1.5, modes: ['attack', 'hold'], items: [{ side: 0, type: 'skitterling', u: 520, v: -40, n: 20, w: 5, dx: 13, dv: 18 }, { side: 1, type: 'rifle', u: 800, v: -30, n: 8, w: 4, dx: 16, dv: 26 }] });
    ok(await run(page, g => { const S = g.ents.filter(e => e.type === 'skitterling' && e.hp > 0); return S.filter(e => e.moving && e.sgN >= 6).length >= 12 && S.some(e => e.u > 680); }), 'swarm-surge');
    await pause(page); await shot(page, 'swarm-surge');
    await page.evaluate(() => { TR.go = true; });
    ok(await run(page, g => g.ents.filter(e => e.kfT > g.t && g.t - e.kfS > 0.1 && g.t - e.kfS < 0.25).length >= 5), 'swarm-frenzy');
    await pause(page); await shot(page, 'swarm-frenzy'); errs.push(...errors); await page.close();
  }
  { // b. Spitters shooting down Gunships: three-quill volleys in flight at the aircraft
    const { page, errors } = await open();
    await setup(page, { cam: 660, zoom: 1.4, modes: ['hold', 'attack'], items: [{ side: 0, type: 'spitter', u: 540, v: -30, n: 6, w: 3, dx: 18, dv: 30 }, { side: 0, type: 'skitterling', u: 600, v: 0, n: 4, dx: 12 }, { side: 1, type: 'aircraft', u: 780, v: -20, n: 3, w: 3, dx: 26 }] });
    await page.evaluate(() => { for (const e of game.ents) if (e.type === 'aircraft') e.hp = e.maxHp = 2500; });
    ok(await run(page, g => g.projs.filter(p => p.weapon === 'quill' && p.target && p.target.type === 'aircraft').length >= 3), 'spitters-gunships');
    await pause(page); await shot(page, 'spitters-gunships');
    await page.evaluate(() => { for (const e of game.ents) if (e.type === 'aircraft') e.hp = Math.min(e.hp, 300); TR.go = true; });
    ok(await run(page, g => g.ents.filter(e => e.type === 'aircraft' && e.hp > 0).length < 3 && g.projs.some(p => p.weapon === 'quill')), 'spitters-gunships-down');
    await pause(page); await shot(page, 'spitters-gunships-down'); errs.push(...errors); await page.close();
  }
  { // c. Needlewings swarming an Interceptor
    const { page, errors } = await open();
    await setup(page, { cam: 660, zoom: 1.5, modes: ['attack', 'attack'], items: [{ side: 0, type: 'needlewing', u: 520, v: -30, n: 10, w: 5, dx: 14, dv: 24 }, { side: 1, type: 'interceptor', u: 780, v: 0 }] });
    await page.evaluate(() => { for (const e of game.ents) if (e.type === 'interceptor') e.hp = e.maxHp = 3000; });
    ok(await run(page, g => { const I = g.ents.find(e => e.type === 'interceptor'); return g.ents.filter(e => e.type === 'needlewing' && e.tgt === I.id && Math.hypot(e.u - I.u, e.v - I.v) < 60).length >= 7; }), 'needlewings-interceptor');
    await page.evaluate(() => { const I = game.ents.find(e => e.type === 'interceptor'); cam.x = I.u - 20; clampCam(); });
    await pause(page); await shot(page, 'needlewings-interceptor'); errs.push(...errors); await page.close();
  }
  { // d. The new Dreadthorn beside a Bulwark and a Thornback (zoomed in), then all eight redrawn units
    const { page, errors } = await open();
    await setup(page, { cam: 720, zoom: 1.8, modes: ['hold', 'hold'], fight: false, items: [{ side: 0, type: 'bulwark', u: 640, v: 20 }, { side: 0, type: 'dreadthorn', u: 720, v: 20 }, { side: 0, type: 'thornback', u: 800, v: 20 }, { side: 1, type: 'dreadthorn', u: 720, v: 110 }] });
    await run(page, () => false, 0.5);
    await pause(page); await shot(page, 'lineup');
    await page.evaluate(() => { // the eight redrawn units as the game draws them (DRAW_U), both sides' colours, poses from a walk cycle
      const cv = document.createElement('canvas'), W = innerWidth, H = innerHeight, dpr = devicePixelRatio || 1; cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99;background:#141a24`;
      document.body.appendChild(cv); const c = cv.getContext('2d'); c.scale(dpr, dpr);
      const list = [['skitterling', 2.6], ['mite', 2.8], ['spitter', 2.2], ['thornback', 1.8], ['dreadthorn', 1.4], ['needlewing', 2.2], ['razorwing', 1.9], ['cloudwing', 1.9]];
      c.fillStyle = '#c8d4e8'; c.font = 'bold 11px system-ui'; c.textAlign = 'center';
      list.forEach(([t, k], i) => { const col = i % 4, row = i >> 2, x = 90 + col * 165, y = 150 + row * 175;
        for (let s = 0; s < 2; s++) { c.save(); c.translate(x + (s ? 30 : -30), y + (s ? 22 : 0) - (UDEF[t].air ? 30 : 0)); c.scale(k * (s ? -1 : 1), k); DRAW_U[t](c, TEAM[s], { anim: 0.7 + s, moving: true, recoil: 0, u: 0, side: s }); c.restore(); }
        c.fillText(UDEF[t].name, x, y + 50); });
    });
    await page.waitForTimeout(200); await shot(page, 'gallery');
    await page.evaluate(() => { const x = [...document.querySelectorAll('canvas')].pop(); if (x && x.style.zIndex === '99') x.remove(); });
    await page.evaluate(() => { applyZoom(1); TR.pick.fac = 'bloomhost'; TR.pick.side = 0; trSetup(); });
    await page.evaluate(() => { const el = document.querySelector('#trU'); el.scrollIntoView({ block: 'center' }); });
    await page.waitForTimeout(400); await shot(page, 'picker'); errs.push(...errors); await page.close();
  }
  { // frame time: a big swarm (40 Skitterlings, 8 Spitters, 10 Needlewings) against a Last Fist army, at 1×
    const { page, errors } = await open();
    await setup(page, { cam: 700, items: [{ side: 0, type: 'skitterling', u: 520, v: -60, n: 40, w: 8, dx: 12, dv: 16 }, { side: 0, type: 'spitter', u: 480, v: -40, n: 8, w: 4, dx: 16, dv: 24 }, { side: 0, type: 'needlewing', u: 500, v: 40, n: 10, dx: 14 }, { side: 1, type: 'rifle', u: 820, v: -40, n: 12, w: 4, dx: 14, dv: 24 }, { side: 1, type: 'tank', u: 860, v: 0, n: 3, dx: 30 }, { side: 1, type: 'aircraft', u: 880, v: 40, n: 3, dx: 30 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 2000; });
    await page.waitForTimeout(3000);
    const ft = await page.evaluate(() => new Promise(res => { const t = []; let last = performance.now(), n = 0; const f = now => { t.push(now - last); last = now; if (++n < 180) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); }));
    const extra = await page.evaluate(() => ({ units: game.ents.filter(e => e.kind === 'u' && e.hp > 0).length, surging: game.ents.filter(e => e.sgN >= 5).length, frenzy: game.ents.filter(e => e.kfT > game.t).length }));
    ft.sort((a, b) => a - b);
    console.log(`frame time with a 58-unit swarm against 18 (${extra.units} units alive, ${extra.surging} surging, ${extra.frenzy} in frenzy): median ${ft[90].toFixed(1)} ms, 95th ${ft[171].toFixed(1)} ms`);
    errs.push(...errors); await page.close();
  }
  if (miss.length) console.error('moments not reached (shot taken anyway):', miss);
  if (errs.length) { console.error('page errors:', errs); process.exitCode = 1; }
  await browser.close();
})();
