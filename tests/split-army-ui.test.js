// v2.66 (Phase 1, Split Army) in headless Chromium at both iPhone sizes: on Two-Lane the Army tab has the squad column
// (All, N, S) on screen, clear of the other controls and big enough to tap; orders act on the selected squad; long-press
// menus on a squad and on a unit chip; a minimap badge selects a squad; the first-time tip shows once; Classic has none
// of it.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const longPress = async (page, sel) => { const b = await page.locator(sel).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(600); await page.mouse.up(); await page.waitForTimeout(120); };

for (const dev of [PHONE, NARROW]) test(`Split Army at ${dev.width}×${dev.height}: squad column, squad orders, long-press menus, minimap badge`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  await page.click('#bPlay'); await page.click('.mapc[data-m="twolane"]'); await page.click('#bMapGo'); await page.waitForTimeout(200);
  assert.strictEqual(await page.evaluate(() => !!$('tipSplit')), false, 'the tip was already seen (test kit)');
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; camTouched = true;
    ['rifle', 'rifle', 'heavy', 'tank', 'rifle', 'aircraft'].forEach((t, i) => spawnUnit(game, 0, t, 470 + i * 10, 0)); });
  await page.click('.tabs [data-tab="army"]'); await page.waitForTimeout(200);
  const L = await page.evaluate(() => {
    const r = el => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
    const hit = el => { const b = el.getBoundingClientRect(), h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return h === el || el.contains(h); };
    const btns = [...document.querySelectorAll('#asq button')], cmd = r($('acmd')), sq = r($('asq'));
    return { btns: btns.map(r), hit: btns.every(hit), labels: btns.map(b => b.textContent), sq, cmd, W: innerWidth, H: innerHeight };
  });
  assert.deepStrictEqual(L.labels, ['All6', 'N3', 'S3']);
  assert.ok(L.hit, 'nothing covers the squad chips');
  for (const b of L.btns) assert.ok(b.w >= 36 && b.h >= 30 && b.x >= 0 && b.r <= L.W && b.b <= L.H, `tappable and on screen ${JSON.stringify(b)}`);
  assert.ok(L.sq.r <= L.cmd.x + 0.5, 'left of Hold / Attack / Retreat / Regroup');
  await page.click('#asq [data-q="1"]'); await page.click('#acmd [data-o="hold"]'); await page.click('#asq [data-q="0"]'); await page.click('#acmd [data-o="attack"]');
  const O = await page.evaluate(() => { const O = game.sides[0].orders; return [O.lanes[0].o, O.lanes[1].o, game.sides[0].squad]; });
  assert.deepStrictEqual(O, ['attack', 'hold', 0], 'each squad got its own order');
  await longPress(page, '#asq [data-q="0"]');
  const m1 = await page.evaluate(() => [...document.querySelectorAll('#sqm button')].map(b => b.textContent));
  assert.deepStrictEqual(m1, ['Move North squad to South', 'New units: North', 'New units: Alternate', 'New units: South']);
  const box = await page.locator('#sqm').boundingBox(); assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= dev.width && box.y + box.height <= dev.height, 'the menu is on screen');
  await page.click('#sqm button:nth-child(4)');
  assert.strictEqual(await page.evaluate(() => game.sides[0].laneNew), 1, 'new units: South');
  await page.evaluate(() => { const el = document.querySelector('.chip[data-k="t:rifle"]'), b = $('asel'); b.scrollLeft += el.getBoundingClientRect().left - b.getBoundingClientRect().left - 2; });
  await longPress(page, '.chip[data-k="t:rifle"]');
  const m2 = await page.evaluate(() => [...document.querySelectorAll('#sqm button')].map(b => b.textContent));
  assert.deepStrictEqual(m2, ['Send all Riflemen to North', 'Send all Riflemen to South']);
  await page.click('#sqm button:nth-child(1)');
  assert.ok(await page.evaluate(() => game.ents.filter(e => e.type === 'rifle').every(e => e.lane === 0)));
  // the minimap badge for the south squad selects it
  const bd = await page.evaluate(() => { const b = MMB.find(q => q.k === 1), r = mm.getBoundingClientRect(); return { x: r.left + (b.x0 + b.x1) / 2, y: r.top + (b.y0 + b.y1) / 2 }; });
  await page.mouse.click(bd.x, bd.y); await page.waitForTimeout(100);
  assert.strictEqual(await page.evaluate(() => game.sides[0].squad), 1);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('the first-time tip on Two-Lane shows once; Classic has no squads', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE, { init: () => { try { localStorage.setItem('extinctionEvent.tips', '{}'); } catch (e) {} } });
  await page.evaluate(() => { localStorage.setItem('extinctionEvent.tips', '{}'); });
  await page.click('#bPlay'); await page.click('.mapc[data-m="twolane"]'); await page.click('#bMapGo'); await page.waitForTimeout(200);
  assert.ok(await page.isVisible('#tipSplit'), 'the tip shows');
  assert.match(await page.textContent('#tipSplit'), /Long-press/);
  await page.click('#bTipOk');
  assert.ok(!(await page.isVisible('#tipSplit')));
  assert.strictEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('extinctionEvent.tips')).split), 1);
  await page.evaluate(() => showStart()); await page.click('#bPlay'); await page.click('#bMapGo'); await page.waitForTimeout(200);
  assert.ok(!(await page.isVisible('#tipSplit')), 'not again');
  await page.evaluate(() => showStart()); await page.click('#bPlay'); await page.click('.mapc[data-m="classic"]'); await page.click('#bMapGo'); await page.waitForTimeout(200);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); spawnUnit(game, 0, 'rifle', 470, 0); });
  await page.click('.tabs [data-tab="army"]'); await page.waitForTimeout(150);
  assert.ok(await page.evaluate(() => !$('asq') && MMB.length === 0), 'Classic: no squad column, no badges');
  assert.deepStrictEqual(errors, []);
  await page.close();
});
