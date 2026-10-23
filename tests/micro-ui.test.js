// Micro controls in headless Chromium (v2.12): Build / Train / Army tabs, the Army tab showing only owned units,
// select + order by tapping, Regroup by tapping the battlefield, pause and GET READY blocking, no overlap with the
// ability buttons, building panel, info panel or top bar at both phone sizes, and orders kept across a page reload.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const SETUP = () => {
  game.countdown = 0; hideCountdown(); updateIntro(); paused = false;
  for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 5000; }
  for (const k of ['barracks', 'factory']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.type === k && b.side === 0) { b.built = true; b.progress = 1; } }
  for (let i = 0; i < 4; i++) spawnUnit(game, 0, 'rifle', 520 + i * 12, 0);
  for (let i = 0; i < 2; i++) spawnUnit(game, 0, 'tank', 560 + i * 14, 30);
  setStance(game, 0, 'hold'); cam.x = hqPos(0).u + 360; clampCam(); refreshUI(true);
};
const tapWorld = (page, u, v) => page.evaluate(([u, v]) => { const w = P(u, v), r = cv.getBoundingClientRect(); return { x: r.left + V.cw / 2 + (w.x - cam.x) * V.S, y: r.top + V.A + (w.y - Y_BOT) * V.S }; }, [u, v]).then(p => page.mouse.click(p.x, p.y));

test('tabs: Build, Train (the old Army tab) and Army; the Army tab lists only owned groups and types, with counts', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(300);
  assert.deepStrictEqual(await page.$$eval('.tabs button', b => b.map(x => x.textContent)), ['Build', 'Train', 'Army']);
  await page.click('.tabs [data-tab="train"]');
  assert.ok((await page.$$eval('#cards .card', c => c.map(x => x.dataset.type))).includes('rifle'), 'Train has the unit cards');
  await page.click('.tabs [data-tab="army"]');
  assert.match(await page.textContent('#asel'), /No units yet/);
  await page.evaluate(SETUP);
  const chips = await page.$$eval('#asel .chip', c => c.map(x => [x.dataset.k, x.querySelector('.cnt').textContent]));
  assert.deepStrictEqual(chips, [['g:inf', '4'], ['g:arm', '2'], ['t:rifle', '4'], ['t:tank', '2']], 'no Air group, no types not owned');
  await page.evaluate(() => { for (const e of game.ents) if (e.type === 'tank') kill(game, e, 1); update(game, 1 / 30); refreshUI(false); });
  assert.deepStrictEqual(await page.$$eval('#asel .chip', c => c.map(x => x.dataset.k)), ['g:inf', 't:rifle'], 'a group disappears once its last unit dies');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('tap a group or type, then an order; Regroup by tapping the battlefield; blocked while paused and during GET READY', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(300);
  // GET READY: orders are refused
  await page.click('.tabs [data-tab="army"]');
  await page.click('#acmd [data-o="move"]');
  assert.ok((await page.evaluate(() => [...$('toasts').children].map(t => t.textContent))).includes('Wait for GO'));
  await page.evaluate(SETUP);
  await page.click('#asel [data-k="t:tank"]');
  assert.strictEqual(await page.evaluate(() => game.sides[0].sel), 't:tank');
  await page.click('#acmd [data-o="attack"]');
  assert.strictEqual(await page.evaluate(() => unitOrder(game.sides[0], 'tank').o), 'attack');
  assert.strictEqual(await page.evaluate(() => unitOrder(game.sides[0], 'rifle')), null, 'Riflemen untouched');
  assert.match(await page.textContent('#asel [data-k="t:tank"] .od'), /Attack/);
  // selection highlight: drawn for the selected units only
  const rings = await page.evaluate(() => { let n = 0; const o = CanvasRenderingContext2D.prototype.ellipse; const c = document.createElement('canvas').getContext('2d'); c.ellipse = function (...a) { n++; return o.apply(this, a); }; drawSelection(c, game, 0); return n; });
  assert.strictEqual(rings, 2, 'two tanks ringed');
  // Regroup the Infantry
  await page.click('#asel [data-k="g:inf"]');
  await page.click('#acmd [data-o="move"]');
  assert.match(await page.textContent('#aim'), /Regroup: tap the battlefield to send Infantry/);
  await tapWorld(page, 900, 40);
  const ord = await page.evaluate(() => game.sides[0].orders.groups.inf);
  assert.ok(ord && ord.o === 'move' && Math.abs(ord.u - 900) < 4 && Math.abs(ord.v - 40) < 4 && !ord.done, JSON.stringify(ord));
  assert.ok(await page.evaluate(() => $('aim').classList.contains('hide')), 'targeting ends after the tap');
  // paused: nothing happens
  await page.evaluate(() => pauseGame());
  await page.evaluate(() => onCmd('retreat', $('acmd').children[2]));
  assert.strictEqual(await page.evaluate(() => game.sides[0].orders.groups.inf.o), 'move', 'no order while paused');
  await page.click('#bRes');
  // the global stance (top bar) clears group orders
  await page.click('#stance [data-s="attack"]');
  assert.strictEqual(await page.evaluate(() => hasOrders(game.sides[0])), false);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

for (const dev of [PHONE, NARROW]) {
  test(`Army tab at ${dev.width}×${dev.height}: big buttons inside the tray, no overlap with abilities, building panel, info panel or top bar`, { skip }, async () => {
    const { page, errors } = await openPage(browser, dev);
    await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(SETUP);
    await page.click('.tabs [data-tab="army"]');
    await page.evaluate(() => { game.sides[0].ab = { shield: 0, strike: 0, repair: 0 }; refreshUI(true); });
    const rects = sel => page.$$eval(sel, els => els.filter(e => e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; }));
    const hit = (a, b) => a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5;
    const mine = [...await rects('#acmd button'), ...await rects('.tabs button')], chips = await rects('#asel .chip'), tray = (await rects('#panel'))[0];
    for (const m of [...mine, ...chips]) {
      assert.ok(m.b - m.t >= 28 && m.r - m.l >= 50, `button big enough: ${JSON.stringify(m)}`);
      assert.ok(m.t >= tray.t && m.b <= tray.b + 0.5, 'inside the tray (the tray is no taller)');
    }
    assert.ok(tray.b - tray.t <= 80, `tray height ${tray.b - tray.t}`);
    const others = [...await rects('#abil .ab'), ...await rects('#hud')];
    // the building panel and the info panel, opened in turn
    await page.evaluate(() => openPanel(game.ents.find(e => e.type === 'factory'))); others.push(...await rects('#bp'));
    await page.evaluate(() => { closePanel(); showInfo('a', 'shield'); }); others.push(...await rects('#info'));
    for (const m of [...mine, ...chips]) for (const o of others) assert.ok(!hit(m, o), `overlap ${JSON.stringify(m)} with ${JSON.stringify(o)}`);
    assert.deepStrictEqual(errors, []);
    await page.close();
  });
}

test('group orders, the selection and a Regroup flag survive saving and reloading the page', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(300);
  await page.evaluate(SETUP);
  const before = await page.evaluate(() => { game.sides[0].sel = 'g:arm'; giveOrder(game, 0, 'group', 'arm', 'move', 900, 0); update(game, 1 / 30); pauseGame(); saveGame(); return JSON.stringify([game.sides[0].orders, game.sides[0].sel]); });
  await page.reload(); await page.waitForTimeout(300);
  await page.click('#bResume'); await page.waitForTimeout(200);
  assert.strictEqual(await page.evaluate(() => JSON.stringify([game.sides[0].orders, game.sides[0].sel])), before);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
