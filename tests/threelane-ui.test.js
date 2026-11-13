// v2.70 (Phase 1, Three-Lane) in headless Chromium at both iPhone sizes: the map-select card, the army column (v2.74: All,
// North, Centre and South on the left, each on screen, uncovered and 44 pt), orders per lane, the active lane, a fight at a
// crossing, and the lane-map tip. Screenshots: docs/screenshots/threelane-{map,lanes,crossing}-<size>.png.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const shot = (page, name, dev) => page.screenshot({ path: path.join(__dirname, '..', 'docs', 'screenshots', `threelane-${name}-${dev.width}x${dev.height}.png`) });

for (const dev of [PHONE, NARROW]) test(`Three-Lane at ${dev.width}×${dev.height}: map select, the lane column, orders per lane, a fight at a crossing`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  await page.click('#bPlay');
  const S = await page.evaluate(() => { const c = document.querySelector('.mapc[data-m="threelane"]'); c.scrollIntoView({ inline: 'center' }); const r = c.getBoundingClientRect(); return { ids: [...document.querySelectorAll('.mapc')].map(x => x.dataset.m), name: c.querySelector('b').textContent, on: r.left >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight }; });
  assert.deepStrictEqual(S.ids, ['classic', 'twolane', 'threelane']);
  assert.ok(S.name.startsWith('Three-Lane') && S.on, JSON.stringify(S));
  await page.click('.mapc[data-m="threelane"]'); await page.waitForTimeout(100);
  await shot(page, 'map', dev);
  await page.click('#bMapGo'); await page.waitForTimeout(250);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; camTouched = true;
    ['rifle', 'rifle', 'heavy', 'tank', 'rifle', 'aircraft', 'sniper', 'tank', 'rifle'].forEach((t, i) => { const x = 700 + i * 12, u = spawnUnit(game, 0, t, x, laneY(MAP.lanes[i % 3], x)); u.lane = i % 3; }); refreshUI(true); });
  assert.strictEqual(await page.evaluate(() => MAP.id), 'threelane');
  // v2.74 (docs/CONTROLS.md): the left column: All, then North, Centre and South, each a 44 pt target, on screen and uncovered
  const L = await page.evaluate(() => {
    const r = el => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
    const hit = el => { const b = el.getBoundingClientRect(), h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return h === el || el.contains(h); };
    const btns = [...document.querySelectorAll('#lanes button')];
    return { btns: btns.map(r), hit: btns.every(hit), labels: btns.map(b => b.textContent), W: innerWidth, H: innerHeight };
  });
  assert.deepStrictEqual(L.labels, ['All9', 'North3', 'Centre3', 'South3']);
  assert.ok(L.hit, 'nothing covers the lane column');
  for (const b of L.btns) assert.ok(b.w >= 44 && b.h >= 44 && b.x >= 0 && b.r <= L.W && b.b <= L.H, `44 pt and on screen ${JSON.stringify(b)}`);
  for (let k = 1; k < L.btns.length; k++) assert.ok(L.btns[k].y >= L.btns[k - 1].b, 'stacked north to south, All on top');
  await page.click('#lanes [data-k="1"]');
  assert.deepStrictEqual(await page.evaluate(() => selLive().map(e => e.lane)), [1, 1, 1], 'tap Centre: its units');
  await page.click('#cmdbar [data-c="hold"]');
  await page.click('#lanes [data-k="2"]'); await page.click('#cmdbar [data-c="attack"]');
  assert.deepStrictEqual(await page.evaluate(() => [0, 1, 2].map(k => myUnits().filter(e => e.lane === k).map(e => e.po.o).join())), ['hold,hold,hold', 'hold,hold,hold', 'attack,attack,attack'], 'each lane its own order');
  await shot(page, 'lanes', dev);
  // a fight at the north crossing: blue comes through the gap from the centre lane into red in the north lane
  await page.evaluate(() => {
    for (const e of game.ents) if (e.kind === 'u') e.hp = 0;
    const T = ['rifle', 'heavy', 'tank', 'rifle', 'sniper', 'flame', 'rifle', 'tank'];
    for (let i = 0; i < 16; i++) { const a = spawnUnit(game, 0, T[i % 8], 1110 + (i % 4) * 14, -60 - Math.floor(i / 4) * 28); a.lane = 0; const b = spawnUnit(game, 1, T[(i + 3) % 8], 1170 + (i % 5) * 16, -400 + ((i % 3) - 1) * 40); b.lane = 0; }
    command(game, 0, myUnits().map(e => e.id), 'go', 1160, -330); game.sides[1].stance = 'hold'; // v2.74: through the gap into the north lane
    for (let i = 0; i < 60 * 4; i++) update(game, TICK);
    paused = true; applyZoom(1.1); cam.x = 1150; cam.y = -250 * DY - (Y_TOP + Y_BOT) / 2; clampCam(); closePanel(); for (const t of document.querySelectorAll('#toasts > *')) t.remove(); drawNow();
  });
  await page.waitForTimeout(200); await page.evaluate(() => drawNow());
  const F = await page.evaluate(() => { const at = s => game.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && Math.abs(e.u - 1150) < 220 && e.v < -150).length; return [at(0), at(1), game.ents.some(e => e.kind === 'u' && e.hp > 0 && !UDEF[e.type].air && navShut(e.u, e.v))]; });
  assert.ok(F[0] > 0 && F[1] > 0, `both sides at the crossing ${F}`); assert.strictEqual(F[2], false, 'nobody inside a wall');
  await shot(page, 'crossing', dev);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('the lane-map tip shows once (v2.74: one tip for every lane map, replacing the Split Army tips)', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.evaluate(() => { localStorage.setItem('extinctionEvent.tips', '{"split":1,"split3":1}'); });
  await page.click('#bPlay'); await page.click('.mapc[data-m="threelane"]'); await page.click('#bMapGo'); await page.waitForTimeout(200);
  assert.ok(await page.isVisible('#tipLanes')); assert.match(await page.textContent('#tipLanes'), /select, then command/);
  await page.click('#bTipOk');
  assert.deepStrictEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('extinctionEvent.tips'))), { split: 1, split3: 1, lanes: 1 });
  await page.evaluate(() => { game.over = true; showStart(); }); await page.click('#bPlay'); await page.click('.mapc[data-m="twolane"]'); await page.click('#bMapGo'); await page.waitForTimeout(200);
  assert.ok(!(await page.isVisible('#tipLanes')), 'once for every lane map');
  assert.deepStrictEqual(errors, []);
  await page.close();
});
