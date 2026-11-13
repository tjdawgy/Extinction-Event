// v2.74 (docs/CONTROLS.md): screenshots of the army controls; v2.79: redone for the refinements after the Three-Lane
// playtest, at both iPhone sizes on Three-Lane and Classic, made with real taps and drags.
//   node tests/controls-shots.js   → docs/screenshots/controls-<map>-<shot>-<W>x<H>.png
// Shots: rally (new units gathered at the base rally point, each in its own space), box (the rectangle box mid-drag), picker
// (the Attack lane picker, the nearest lane highlighted; Three-Lane only: Classic has no picker), groups (control groups with
// counts, while a selection is up), target (a targeted attack on an enemy building, the target reticle and the fight).
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

(async () => {
  const pw = findPlaywright(); if (!pw) { console.error('playwright not installed'); process.exit(1); }
  const browser = await pw.chromium.launch();
  for (const dev of [PHONE, NARROW]) for (const map of ['threelane', 'classic']) {
    const { page, errors } = await openPage(browser, dev);
    const names = [];
    const shot = async name => { await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); drawNow(); }); await page.screenshot({ path: path.join(OUT, `controls-${map}-${name}-${dev.width}x${dev.height}.png`) }); names.push(name); };
    await page.click('#bPlay'); await page.click(`.mapc[data-m="${map}"]`); await page.click('#bMapGo'); await page.waitForTimeout(250);
    await page.evaluate(() => {
      const tip = document.getElementById('tipLanes'); if (tip) tip.remove();
      game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; camTouched = false; introCamera(1); camTouched = true;
      window.__scr = id => { const e = game.ents.find(x => x.id === id), p = uScreen(e), r = cv.getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; };
      window.__gscr = (u, v) => { const r = cv.getBoundingClientRect(), w = P(u, v); return [r.left + (w.x - cam.x) * V.S + V.cw / 2, r.top + (w.y - YB()) * V.S + V.A]; };
      window.__look = (u, v) => { cam.x = u; cam.vx = 0; if (CAMY.max > CAMY.min) cam.y = v * DY - (Y_TOP + Y_BOT) / 2; clampCam(); };
      window.__run = s => { for (let i = 0; i < Math.round(s * 60); i++) update(game, TICK); refreshUI(true); };
      const s = game.sides[0];
      s.res.c = 9000; s.res.e = 4000; tryBuild(game, 0, 'barracks', 4); tryBuild(game, 0, 'refinery', 5); tryBuild(game, 0, 'factory', 6); tryBuild(game, 0, 'habitat', 7); tryBuild(game, 0, 'habitat', 3);
      for (const b of game.ents) if (b.kind === 'b' && b.side === 0) { b.built = true; b.progress = 1; b.hp = b.maxHp; }
      const hq = game.sides[0].hq; // eight units trained one after another: each gathers at the base rally point
      ['rifle', 'rifle', 'heavy', 'tank', 'rifle', 'sniper', 'tank', 'artillery', 'rifle', 'heavy'].forEach((t, i) => { const e = spawnUnit(game, 0, t, hq.u + 140, hq.v + 120 + (i % 3) * 12); ctlTrained(game, e, null); __run(1.5); });
      __run(30); const B = ctlBase(0); __look(B.u + 40, B.v); refreshUI(true);
    });
    await page.waitForTimeout(250); await shot('rally');
    // the rectangle box, mid-drag, over the gathered units
    const box = await page.evaluate(() => { const p = myUnits().map(e => __scr(e.id)); const t = $('hud').getBoundingClientRect().bottom + 6, b = $('panel').getBoundingClientRect().top - 6, l = $('lanes').getBoundingClientRect().right + 8; return [Math.max(l, Math.min(...p.map(q => q[0])) - 24), Math.max(t, Math.min(...p.map(q => q[1])) - 24), Math.max(...p.map(q => q[0])) + 24, Math.min(b, Math.max(...p.map(q => q[1])) + 26)]; });
    await page.mouse.move(box[0], box[1]); await page.mouse.down(); await page.waitForTimeout(380);
    await page.mouse.move(box[2], box[3], { steps: 10 }); await page.waitForTimeout(60);
    await shot('box');
    await page.mouse.up(); await page.waitForTimeout(80);
    if (map === 'threelane') { // the Attack lane picker: the units walked into the south lane first, so South is highlighted
      await page.evaluate(() => { command(game, 0, myUnits().map(e => e.id), 'go', 760, 380); __run(16); __look(720, 260); refreshUI(true); selAll(); });
      await page.click('#cmdbar [data-c="attack"]'); await page.waitForTimeout(150); await shot('picker');
      await page.mouse.click(200, 150); await page.waitForTimeout(80); // cancel
    }
    // control groups with counts: three saved (all, the tanks, the infantry), the selection up
    const slot = async (k, ids) => { await page.evaluate(I => { SELN.clear(); for (const i of I) SELN.add(i); refreshCtl(); }, ids); const q = await page.evaluate(i => { const r = document.querySelector(`#grps [data-g="${i}"]`).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, k); await page.mouse.move(...q); await page.mouse.down(); await page.waitForTimeout(600); await page.mouse.up(); };
    const all = await page.evaluate(() => myUnits().map(e => e.id)), tanks = await page.evaluate(() => myUnits().filter(e => UDEF[e.type].from === 'factory').map(e => e.id));
    await slot(0, all); await slot(1, tanks); await slot(2, all.filter(i => !tanks.includes(i)));
    await page.evaluate(() => { SELN.clear(); refreshCtl(); }); await page.waitForTimeout(80);
    await page.click('#grps [data-g="1"]'); await page.waitForTimeout(100); await shot('groups');
    // a targeted attack on an enemy building: an enemy Barracks within reach, the whole army ordered onto it by a tap
    const T = await page.evaluate(() => {
      const s = game.sides[1]; s.res.c = 5000; tryBuild(game, 1, 'barracks', 4); tryBuild(game, 1, 'refinery', 1);
      const b = game.ents.find(e => e.kind === 'b' && e.side === 1 && e.type === 'barracks'); b.built = true; b.progress = 1; b.hp = b.maxHp;
      for (const e of game.ents) if (e.kind === 'b' && e.side === 1) { e.built = true; e.progress = 1; e.hp = e.maxHp; }
      myUnits().forEach((e, i) => { e.u = b.u - 230 - (i % 4) * 22; e.v = b.v + ((i * 37) % 9 - 4) * 16; e.po = { o: 'hold' }; e.holdU = e.u; e.holdV = e.v; e.hp = e.maxHp = 1e5; if (MAP_LANED) e.lane = laneAt(e.u, e.v); });
      updateVision(game); __look(b.u - 120, b.v); selAll(); refreshUI(true); drawNow(); return { u: b.u, v: b.v, id: b.id };
    });
    const [bx, by] = await page.evaluate(([u, v]) => __gscr(u, v - 30), [T.u, T.v]); await page.mouse.click(bx, by); await page.waitForTimeout(60);
    if (!(await page.evaluate(id => myUnits().every(e => e.po.o === 'target' && e.po.id === id), T.id))) throw new Error(`${map}: the tap on the enemy Barracks did not target it`);
    await page.evaluate(() => { __run(3.2); }); await page.evaluate(id => { ctlMark = { id, t: performance.now() - 250 }; }, T.id); await page.waitForTimeout(30);
    await shot('target');
    if (errors.length) console.error(map, dev.width, errors);
    await page.close();
    console.log(`controls-${map} at ${dev.width}x${dev.height}: ${names.join(', ')}`);
  }
  await browser.close();
})();
