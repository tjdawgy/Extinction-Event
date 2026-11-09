// v2.72 (Phase 1, Proposal F) in headless Chromium at both iPhone sizes: the map-select screen has a row of condition
// toggles (the picked map's, plus Random) and a line describing them, all on screen; the choice is remembered and reaches
// the match; Random picks one the map allows; the match shows its conditions as icons on the minimap; a meteor's warning
// circle; the post-match screen lists the conditions. Screenshots: docs/screenshots/conditions-{select,meteor}-<size>.png.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const shot = (page, name, dev) => page.screenshot({ path: path.join(__dirname, '..', 'docs', 'screenshots', `conditions-${name}-${dev.width}x${dev.height}.png`) });

for (const dev of [PHONE, NARROW]) test(`conditions at ${dev.width}×${dev.height}: toggles, Random, minimap icons, a meteor, the report`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  await page.click('#bPlay');
  assert.deepStrictEqual(await page.evaluate(() => [...document.querySelectorAll('#conds button')].map(b => b.dataset.c)), ['heavyFog', 'richCenter', 'scarce', 'random'], 'Classic: no meteors');
  await page.click('.mapc[data-m="twolane"]');
  await page.click('#conds [data-c="meteors"]'); await page.click('#conds [data-c="heavyFog"]');
  const S = await page.evaluate(() => { const r = e => e.getBoundingClientRect(), b = $('box'), inView = e => { const q = r(e); return q.top >= 0 && q.bottom <= innerHeight && q.left >= 0; };
    return { on: [...document.querySelectorAll('#conds button.on')].map(b => b.dataset.c), line: $('condLine').textContent, fits: b.scrollHeight <= b.clientHeight + 1, seen: inView($('conds')) && inView($('condLine')) && inView($('bMapGo')), saved: JSON.parse(localStorage.getItem('extinctionEvent.cond')) }; });
  assert.deepStrictEqual(S.on, ['heavyFog', 'meteors']); assert.match(S.line, /Heavy fog|Sight/);
  assert.ok(S.fits && S.seen, `the screen fits ${JSON.stringify(S)}`);
  assert.deepStrictEqual(S.saved, { on: ['meteors', 'heavyFog'], random: false });
  await shot(page, 'select', dev);
  await page.click('#bMapGo'); await page.waitForTimeout(250);
  const G = await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; camTouched = true;
    game.t = COND.meteors.from; updateMeteors(game); const A = game.meteor.at; for (let i = 0; i < 4; i++) spawnUnit(game, 0, 'tank', A.u - 60 + i * 30, A.v);
    for (let i = 0; i < 150; i++) update(game, TICK); paused = true; applyZoom(1.1); cam.x = A.u; cam.y = A.v * DY - (Y_TOP + Y_BOT) / 2; clampCam(); for (const t of document.querySelectorAll('#toasts > *')) t.remove(); drawNow(); drawMinimapNow();
    return { cond: Object.keys(game.cond), warn: !!game.meteor.at }; });
  assert.deepStrictEqual(G.cond, ['heavyFog', 'meteors']); assert.ok(G.warn, 'the warning is up');
  await page.waitForTimeout(150); await page.evaluate(() => { drawNow(); drawMinimapNow(); });
  await shot(page, 'meteor', dev);
  const rep = await page.evaluate(() => { finish(game, 0, 'hq'); return repOverview(game); });
  assert.match(rep, /Battlefield conditions: Heavy fog, Meteors/);
  // Random: one condition the map allows, chosen at the start
  await page.evaluate(() => { showStart(); }); await page.click('#bPlay'); await page.click('.mapc[data-m="classic"]'); await page.click('#conds [data-c="random"]');
  assert.deepStrictEqual(await page.evaluate(() => [...document.querySelectorAll('#conds button.on')].map(b => b.dataset.c)), ['random']);
  await page.click('#bMapGo'); await page.waitForTimeout(200);
  const R = await page.evaluate(() => Object.keys(game.cond)); assert.ok(R.length === 1 && ['heavyFog', 'richCenter', 'scarce'].includes(R[0]), JSON.stringify(R));
  assert.deepStrictEqual(errors, []);
  await page.close();
});
