// v2.70 (Phase 1, Three-Lane) in headless Chromium at both iPhone sizes: the map-select card, three squads in the Army tab
// (All on top, N, C and S below it in the same 84 px column, each on screen, uncovered and tappable), orders per squad, the
// long-press menus for three lanes, a minimap badge per lane, and the three-lane tip. Screenshots: docs/screenshots/
// threelane-{map,squads,crossing}-<size>.png (the map, the three-squad controls, a fight at a crossing).
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
const longPress = async (page, sel) => { const b = await page.locator(sel).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(600); await page.mouse.up(); await page.waitForTimeout(120); };

for (const dev of [PHONE, NARROW]) test(`Three-Lane at ${dev.width}×${dev.height}: map select, three squads, menus, badges, a fight at a crossing`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  await page.click('#bPlay');
  const S = await page.evaluate(() => { const c = document.querySelector('.mapc[data-m="threelane"]'); c.scrollIntoView({ inline: 'center' }); const r = c.getBoundingClientRect(); return { ids: [...document.querySelectorAll('.mapc')].map(x => x.dataset.m), name: c.querySelector('b').textContent, on: r.left >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight }; });
  assert.deepStrictEqual(S.ids, ['classic', 'twolane', 'threelane']);
  assert.ok(S.name.startsWith('Three-Lane') && S.on, JSON.stringify(S));
  await page.click('.mapc[data-m="threelane"]'); await page.waitForTimeout(100);
  await shot(page, 'map', dev);
  await page.click('#bMapGo'); await page.waitForTimeout(250);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; camTouched = true;
    ['rifle', 'rifle', 'heavy', 'tank', 'rifle', 'aircraft', 'sniper', 'tank', 'rifle'].forEach((t, i) => { const u = spawnUnit(game, 0, t, 480 + i * 12, 0); u.lane = i % 3; }); });
  assert.strictEqual(await page.evaluate(() => MAP.id), 'threelane');
  await page.click('.tabs [data-tab="army"]'); await page.waitForTimeout(200);
  const L = await page.evaluate(() => {
    const r = el => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
    const hit = el => { const b = el.getBoundingClientRect(), h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return h === el || el.contains(h); };
    const btns = [...document.querySelectorAll('#asq button')];
    return { btns: btns.map(r), hit: btns.every(hit), labels: btns.map(b => b.textContent), sq: r($('asq')), cmd: r($('acmd')), W: innerWidth, H: innerHeight };
  });
  assert.deepStrictEqual(L.labels, ['All9', 'N3', 'C3', 'S3']);
  assert.ok(L.hit, 'nothing covers the squad chips');
  assert.ok(L.sq.w <= 86, `the column keeps its 84 px (${L.sq.w})`);
  for (const b of L.btns.slice(1)) assert.ok(b.w >= 24 && b.h >= 28 && b.x >= 0 && b.r <= L.W && b.b <= L.H, `N, C, S tappable and on screen ${JSON.stringify(b)}`);
  assert.ok(L.sq.r <= L.cmd.x + 0.5, 'left of the order buttons');
  await page.click('#asq [data-q="1"]'); await page.click('#acmd [data-o="hold"]'); await page.click('#asq [data-q="2"]'); await page.click('#acmd [data-o="attack"]');
  assert.deepStrictEqual(await page.evaluate(() => { const O = game.sides[0].orders.lanes; return [O[1].o, O[2].o, O[0] ? O[0].o : null]; }), ['hold', 'attack', null], 'each squad its own order');
  await longPress(page, '#asq [data-q="0"]');
  assert.deepStrictEqual(await page.evaluate(() => [...document.querySelectorAll('#sqm button')].map(b => b.textContent)),
    ['Move North squad to Centre', 'Move North squad to South', 'New units: North', 'New units: Centre', 'New units: South', 'New units: Alternate']);
  const box = await page.locator('#sqm').boundingBox(); assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= dev.width && box.y + box.height <= dev.height, 'the menu is on screen');
  await shot(page, 'squads', dev);
  await page.click('#sqm button:nth-child(1)');
  assert.ok(await page.evaluate(() => game.ents.filter(e => e.kind === 'u' && e.side === 0).every(e => e.lane !== 0)), 'the north squad joined the centre');
  assert.strictEqual(await page.evaluate(() => MMB.length), 3, 'a minimap badge per lane');
  // a fight at the north crossing: blue comes through the gap from the centre lane into red in the north lane
  await page.evaluate(() => {
    for (const e of game.ents) if (e.kind === 'u') e.hp = 0;
    const T = ['rifle', 'heavy', 'tank', 'rifle', 'sniper', 'flame', 'rifle', 'tank'];
    for (let i = 0; i < 16; i++) { const a = spawnUnit(game, 0, T[i % 8], 1110 + (i % 4) * 14, -60 - Math.floor(i / 4) * 28); a.lane = 0; const b = spawnUnit(game, 1, T[(i + 3) % 8], 1170 + (i % 5) * 16, -400 + ((i % 3) - 1) * 40); b.lane = 0; }
    setStance(game, 0, 'attack'); game.sides[1].stance = 'hold';
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

test('the Three-Lane tip shows once, apart from the Two-Lane one', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.evaluate(() => { localStorage.setItem('extinctionEvent.tips', '{"split":1}'); });
  await page.click('#bPlay'); await page.click('.mapc[data-m="threelane"]'); await page.click('#bMapGo'); await page.waitForTimeout(200);
  assert.ok(await page.isVisible('#tipSplit')); assert.match(await page.textContent('#tipSplit'), /Three lanes, three squads/);
  await page.click('#bTipOk');
  assert.deepStrictEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('extinctionEvent.tips'))), { split: 1, split3: 1 });
  assert.deepStrictEqual(errors, []);
  await page.close();
});
