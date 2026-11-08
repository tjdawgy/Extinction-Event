// v2.65 (Phase 1, the Two-Lane map) in headless Chromium at both iPhone sizes: the map-select screen fits (Classic
// preselected, both cards and the buttons in view, thumbnails drawn); a Two-Lane match pans up and down by drag and by
// the minimap; a held forward pad can be tapped and built on; the next match remembers the map and Classic still works.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

for (const dev of [PHONE, NARROW]) test(`Two-Lane at ${dev.width}×${dev.height}: map select, camera, minimap, forward pad`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  await page.click('#bPlay'); await page.waitForTimeout(250);
  const S = await page.evaluate(() => {
    const inView = el => { const q = el.getBoundingClientRect(); return q.top >= 0 && q.bottom <= innerHeight + 0.5 && q.left >= 0 && q.right <= innerWidth + 0.5; };
    const cards = [...document.querySelectorAll('.mapc')], b = $('box');
    const drawn = cards.every(c => { const cv = c.querySelector('canvas'); const d = cv.getContext('2d').getImageData(cv.width / 2, cv.height / 2, 1, 1).data; return cv.width > 50 && d[3] > 0; });
    return { ids: cards.map(c => c.dataset.m), on: cards.filter(c => c.classList.contains('on')).map(c => c.dataset.m), visible: cards.every(inView) && inView($('bMapGo')) && inView($('bMapBack')), fits: b.scrollHeight <= b.clientHeight + 1, drawn, names: cards.map(c => c.querySelector('b').textContent) };
  });
  assert.deepStrictEqual(S.ids, ['classic', 'twolane']); assert.deepStrictEqual(S.on, ['classic'], 'Classic is the default');
  assert.ok(S.visible && S.fits, `the screen fits ${JSON.stringify(S)}`); assert.ok(S.drawn, 'thumbnails drawn');
  assert.ok(S.names[1].startsWith('Two-Lane'));
  await page.click('.mapc[data-m="twolane"]'); await page.click('#bMapGo'); await page.waitForTimeout(250);
  const g0 = await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; camTouched = true; return { id: MAP.id, gid: game.map.id, n: game.nodes.length, cy: [CAMY.min, CAMY.max], y: cam.y, key: localStorage.getItem('extinctionEvent.map') }; });
  assert.deepStrictEqual([g0.id, g0.gid, g0.n, g0.key], ['twolane', 'twolane', 11, 'twolane']);
  assert.ok(g0.cy[1] - g0.cy[0] > 150, 'the view can pan up and down');
  // drag up the screen: the view moves south (cam.y grows)
  const cv = await page.locator('#cv').boundingBox(), y0 = await page.evaluate(() => cam.y);
  await page.mouse.move(cv.x + cv.width / 2, cv.y + cv.height * 0.6); await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(cv.x + cv.width / 2, cv.y + cv.height * 0.6 - i * 12);
  await page.mouse.up();
  const y1 = await page.evaluate(() => cam.y); assert.ok(y1 > y0 + 30, `dragging pans down the map (${y0} → ${y1})`);
  // the minimap: tapping its bottom edge shows the south lane, its top the north lane
  const mm = await page.locator('#mm').boundingBox();
  await page.mouse.click(mm.x + mm.width / 2, mm.y + mm.height - 3); const yS = await page.evaluate(() => cam.y);
  await page.mouse.click(mm.x + mm.width / 2, mm.y + 3); const yN = await page.evaluate(() => cam.y);
  assert.ok(yS > yN + 100, `minimap depth (${yN} … ${yS})`);
  // a held forward pad: tap it, pick the Turret card
  const P = await page.evaluate(() => { const k = FWD_PADS.findIndex(F => F.at[0] === 820 && F.at[1] === -280), F = FWD_PADS[k]; game.nodes[F.node].owner = 0; game.nodes[F.node].prog = 100; game.sides[0].res.c = 3000; game.sides[0].res.e = 3000;
    cam.x = F.at[0]; cam.y = F.at[1] * DY - (Y_TOP + Y_BOT) / 2; clampCam(); paused = false; const q = P(F.at[0], F.at[1]); return { x: (q.x - cam.x) * V.S + V.cw / 2, y: (q.y - YB()) * V.S + V.A, k }; });
  await page.mouse.click(cv.x + P.x, cv.y + P.y); await page.waitForTimeout(150);
  assert.strictEqual(await page.evaluate(() => selPad - FWD_SLOT), P.k, 'the forward pad is selected');
  assert.match(await page.textContent('#bpName'), /Forward pad/);
  await page.click('.card[data-type="turret"]'); await page.waitForTimeout(100);
  assert.ok(await page.evaluate(k => { const b = fwdAt(game, FWD_SLOT + k); return !!b && b.type === 'turret' && b.side === 0; }, P.k), 'a Turret goes up on the forward pad');
  await page.screenshot({ path: require('path').join(require('os').tmpdir(), `ee-twolane-${dev.width}.png`) });
  // back to the menu: the next match starts on Two-Lane (remembered); picking Classic plays Classic
  await page.evaluate(() => showStart()); await page.click('#bPlay'); await page.waitForTimeout(150);
  assert.deepStrictEqual(await page.evaluate(() => [...document.querySelectorAll('.mapc.on')].map(c => c.dataset.m)), ['twolane']);
  await page.click('.mapc[data-m="classic"]'); await page.click('#bMapGo'); await page.waitForTimeout(150);
  assert.deepStrictEqual(await page.evaluate(() => [MAP.id, L, game.nodes.length, CAMY.max - CAMY.min, cam.y]), ['classic', 1700, 3, 0, 0]);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
