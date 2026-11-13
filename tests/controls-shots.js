// v2.74 (docs/CONTROLS.md): screenshots of the army controls at both iPhone sizes on every map, made with real taps and drags.
//   node tests/controls-shots.js   → docs/screenshots/controls-<map>-<shot>-<W>x<H>.png
// Shots: default (the default view, troops waiting at the base flags), lasso (a lasso selection with the command bar), type
// (a double-tapped type), moved (units moved to a tapped spot, holding there), new (new units waiting at the active lane's
// flag, the Train tab showing where training goes).
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

(async () => {
  const pw = findPlaywright(); if (!pw) { console.error('playwright not installed'); process.exit(1); }
  const browser = await pw.chromium.launch();
  for (const dev of [PHONE, NARROW]) for (const map of ['classic', 'twolane', 'threelane']) {
    const { page, errors } = await openPage(browser, dev);
    const shot = async name => { await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); }); await page.screenshot({ path: path.join(OUT, `controls-${map}-${name}-${dev.width}x${dev.height}.png`) }); };
    await page.click('#bPlay'); await page.click(`.mapc[data-m="${map}"]`); await page.click('#bMapGo'); await page.waitForTimeout(250);
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; camTouched = false; introCamera(1); camTouched = true;
      window.__scr = id => { const e = game.ents.find(x => x.id === id), p = uScreen(e), r = cv.getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; };
      window.__gscr = (u, v) => { const r = cv.getBoundingClientRect(), w = P(u, v); return [r.left + (w.x - cam.x) * V.S + V.cw / 2, r.top + (w.y - YB()) * V.S + V.A]; };
      window.__look = (u, v) => { cam.x = u; cam.vx = 0; if (CAMY.max > CAMY.min) cam.y = v * DY - (Y_TOP + Y_BOT) / 2; clampCam(); };
      window.__run = s => { for (let i = 0; i < Math.round(s * 60); i++) update(game, TICK); refreshUI(true); };
      const s = game.sides[0], T = ['rifle', 'rifle', 'heavy', 'tank', 'rifle', 'sniper', 'tank', 'rifle', 'heavy'];
      s.res.c = 5000; s.res.e = 2000; tryBuild(game, 0, 'barracks', 4); tryBuild(game, 0, 'refinery', 5); tryBuild(game, 0, 'factory', 6); tryBuild(game, 0, 'habitat', 7); tryBuild(game, 0, 'habitat', 3);
      for (const b of game.ents) if (b.kind === 'b' && b.side === 0) { b.built = true; b.progress = 1; b.hp = b.maxHp; }
      const hq = game.sides[0].hq; // troops trained into each lane, waiting at its base flag
      T.forEach((t, i) => { const k = i % s.flags.length; s.active = k; if (MAP_LANED) s.laneNew = k; const e = spawnUnit(game, 0, t, hq.u + 120, hq.v + 60 + (i % 3) * 10); ctlTrained(game, e, null); });
      setActiveLane(game, 0, 0); __run(14); __look(homeX(), 0); refreshUI(true);
    });
    await page.waitForTimeout(300); await shot('default');
    // lasso around everyone at the flags
    const box = await page.evaluate(() => { const p = myUnits().map(e => __scr(e.id)); const t = $('hud').getBoundingClientRect().bottom + 4, b = $('panel').getBoundingClientRect().top - 4, l = $('lanes').getBoundingClientRect().right + 6; return [Math.max(l, Math.min(...p.map(q => q[0])) - 26), Math.max(t, Math.min(...p.map(q => q[1])) - 26), Math.max(...p.map(q => q[0])) + 26, Math.min(b, Math.max(...p.map(q => q[1])) + 32)]; }); // the loop stays on the open battlefield
    await page.mouse.move(box[0], box[1]); await page.mouse.down(); await page.waitForTimeout(380);
    for (const [x, y] of [[box[2], box[1]], [box[2], box[3]], [box[0], box[3]], [box[0], box[1] + 4]]) await page.mouse.move(x, y, { steps: 8 });
    await page.mouse.up(); await page.waitForTimeout(60); await shot('lasso');
    await page.click('#selX'); await page.evaluate(() => __look(game.sides[0].flags[0].u + 60, 0));
    // a double-tapped type (the Riflemen)
    const r = await page.evaluate(() => __scr(myUnits().find(e => e.type === 'rifle').id)); await page.waitForTimeout(400);
    await page.mouse.dblclick(r[0], r[1]); await page.waitForTimeout(120); await shot('type');
    // move them to a tapped spot ahead, then let them get there
    const spot = await page.evaluate(() => { const f = game.sides[0].flags[0]; const u = f.u + 230, v = MAP_LANED ? laneY(MAP.lanes[0], u) : 30; __look(f.u + 150, v / 2); return __gscr(u, v); });
    await page.mouse.click(spot[0], spot[1]); await page.waitForTimeout(80);
    if (await page.evaluate(() => SELN.size)) throw new Error(`${map}: the move tap did not land on open ground`);
    await page.evaluate(() => { __run(9); refreshUI(true); }); await page.waitForTimeout(150); await shot('moved');
    // new units: the last lane active, three trained, waiting at its flag; the Train tab shows where training goes
    await page.click(`#lanes [data-k="${map === 'classic' ? 'all' : await page.evaluate(() => game.sides[0].flags.length - 1)}"]`);
    if (map === 'classic') await page.click('#selX');
    await page.evaluate(() => { const b = game.ents.find(e => e.kind === 'b' && e.side === 0 && e.type === 'barracks'); b.queue.push('rifle', 'rifle', 'heavy'); __run(42); const f = game.sides[0].flags[game.sides[0].active]; __look(f.u + 120, f.v); refreshUI(true); });
    await page.click('.tabs [data-tab="train"]'); await page.waitForTimeout(200); await shot('new');
    if (errors.length) console.error(map, dev.width, errors);
    await page.close();
    console.log(`controls-${map} at ${dev.width}x${dev.height}: 5 shots`);
  }
  await browser.close();
})();
