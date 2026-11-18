// v2.91 (batch 5d: every building redrawn): screenshots at 667×375 (iPhone landscape in the viewer).
//   node tests/rework-5d-shots.js [shot ...]   → docs/screenshots/rework5d-<shot>-667x375.png
// Shots: gallery-lastfist, gallery-bloomhost, gallery-axiarchs (every building of the faction in the Test Range at real size, blue
// row and red row, tiers 1-3 spread across both, no fight); stages (one building per faction: under construction at 25%, 60%, then
// built at full health, under 66% and under 33%, from health only); match (a real Hard vs Hard self-play match, Classic, zoomed out
// with both bases in view, nothing forced or spawned); base-lastfist, base-bloomhost, base-axiarchs (one side's base in a real Hard
// self-play match with its own units nearby).
const path = require('path');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');
const want = process.argv.slice(2);
const on = s => !want.length || want.includes(s);
const FAC = ['lastfist', 'bloomhost', 'axiarchs'];

(async () => {
  const pw = findPlaywright(); if (!pw) { console.error('playwright not installed'); process.exit(1); }
  const browser = await pw.chromium.launch(), dev = NARROW, errs = [];
  const shot = async (page, name) => { await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); }); await page.screenshot({ path: path.join(OUT, `rework5d-${name}-${dev.width}x${dev.height}.png`) }); console.log('wrote', name); };
  const range = async () => { const r = await openPage(browser, dev); await r.page.click('#bRange'); await r.page.waitForTimeout(300); await r.page.evaluate(() => hideOverlay()); return r; };
  // Test Range buildings: a list of { side, fac, type, tier, u, v, hp, prog }, drawn by the real renderer, paused
  const place = (page, list, camX, zoom) => page.evaluate(([list, camX, zoom]) => {
    TR.set = Object.assign(trNewSet(), { rows: 1, modes: ['hold', 'hold'], fight: false }); TR.set.rw = [0, 1, 2].map(() => rwInit());
    TR.go = false; trBuild(); hideOverlay();
    for (const o of list) { const b = rangeBuilding(game, o.side, o.fac, o.type, o.u, o.v); b.tier = o.tier || 1; if (o.hp !== undefined) b.hp = b.maxHp * o.hp; if (o.prog !== undefined) { b.built = false; b.progress = o.prog; } }
    window.trZoom = () => {}; applyZoom(zoom); cam.x = camX; clampCam(); TR.go = false; trTopUI();
    BCACHE.budget = 1e3; render(ctx, game, 1, null, null);
  }, [list, camX, zoom]);
  for (const fac of FAC) if (on('gallery-' + fac)) { // a. every building, both colours, all tiers (no node bunker in the Test Range: it lives on field nodes)
    const { page, errors } = await range();
    const types = await page.evaluate(fac => Object.keys(BARTS[fac]).filter(t => t !== 'bunker'), fac);
    const dx = 66, u0 = 680 - (types.length - 1) * dx / 2, list = [];
    types.forEach((type, i) => { list.push({ side: 0, fac, type, tier: 1 + i % 3, u: u0 + i * dx, v: -120 }); list.push({ side: 1, fac, type, tier: 1 + (i + 1) % 3, u: u0 + i * dx + 30, v: 110 }); });
    await place(page, list, 680, 0.9); await page.waitForTimeout(200); await shot(page, 'gallery-' + fac); errs.push(...errors); await page.close();
  }
  if (on('stages')) { // b. construction and damage: one building per faction (Last Fist War Factory, Bloomhost Hive, Axiarch Genesis Gate)
    const { page, errors } = await range();
    const pick = { lastfist: 'factory', bloomhost: 'hq', axiarchs: 'barracks' }, list = [], st = [{ prog: 0.25 }, { prog: 0.6 }, { hp: 1 }, { hp: 0.5 }, { hp: 0.2 }];
    FAC.forEach((fac, r) => st.forEach((s, i) => list.push({ side: r === 1 ? 1 : 0, fac, type: pick[fac], tier: 2, u: 520 + i * 82, v: -110 + r * 105, ...s })));
    await place(page, list, 690, 1.0); await page.waitForTimeout(200); await shot(page, 'stages'); errs.push(...errors); await page.close();
  }
  // a real self-play match: Hard vs Hard, nothing forced or spawned, run in the page to time t, then shown paused
  const match = async (f0, f1, seed, t, view) => {
    const { page, errors } = await openPage(browser, dev);
    await page.evaluate(() => { devPick.a = { f: 'lastfist', ai: 'default', p: 'random' }; devPick.b = { f: 'bloomhost', ai: 'default', p: 'random' }; devPick.speed = 1; startSpectate(); paused = true; });
    const r = await page.evaluate(([f0, f1, seed, t, view]) => {
      game = newGame('hard', { seed, map: 'classic', autoPlayer: true, autoDiff: 'hard', factions: [f0, f1] }); game.countdown = 0; game.spectate = true;
      while (!game.over && game.t < t) { update(game, 1 / 30); game.events.length = 0; }
      const bs = s => game.ents.filter(e => e.kind === 'b' && e.side === s && e.hp > 0).length;
      if (view === 'both') { const a = hqPos(0).u, b = hqPos(1).u; applyZoom(Math.max(0.3, 640 / (Math.abs(b - a) + 260) / V.S0)); cam.x = (P(a, 0).x + P(b, 0).x) / 2; }
      else { applyZoom(1.15); const h = hqPos(view); cam.x = P(h.u + (view === 0 ? 170 : -170), 0).x; }
      clampCam(); BCACHE.budget = 1e3; refreshUI(true);
      return { t: Math.round(game.t), over: game.over, b0: bs(0), b1: bs(1), u0: game.ents.filter(e => e.kind === 'u' && e.side === 0 && e.hp > 0).length, u1: game.ents.filter(e => e.kind === 'u' && e.side === 1 && e.hp > 0).length };
    }, [f0, f1, seed, t, view]);
    await page.waitForTimeout(400);
    return { page, errors, r };
  };
  if (on('match')) { const { page, errors, r } = await match('lastfist', 'axiarchs', 7, 420, 'both'); console.log('match', JSON.stringify(r)); await shot(page, 'match'); errs.push(...errors); await page.close(); }
  const BASE = { lastfist: ['lastfist', 'bloomhost', 0, 400], bloomhost: ['axiarchs', 'bloomhost', 1, 400], axiarchs: ['axiarchs', 'lastfist', 0, 400] };
  for (const fac of FAC) if (on('base-' + fac)) { const [a, b, s, t] = BASE[fac]; const { page, errors, r } = await match(a, b, 7, t, s); console.log('base', fac, JSON.stringify(r)); await shot(page, 'base-' + fac); errs.push(...errors); await page.close(); }
  await browser.close();
  if (errs.length) { console.error('page errors:', errs); process.exit(1); }
})();
