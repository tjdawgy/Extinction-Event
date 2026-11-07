// v2.51 (Phase 0 item 4): a finished match leaves a compact summary in the match history (localStorage, try/catch);
// the tutorial and spectated matches don't; blocked storage changes nothing on screen.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const END = async page => { // a short match the player wins, played through the real frame loop to its end screen
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (let i = 0; i < 60 * 70; i++) update(game, TICK); kill(game, game.sides[1].hq, 0); paused = false; running = true; });
  await page.waitForFunction(() => !running && $('repPane'), null, { timeout: 8000 });
};

test('a finished match is saved to extinctionEvent.history; at most 50 kept', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.evaluate(() => localStorage.setItem('extinctionEvent.history', JSON.stringify(Array.from({ length: 50 }, (_, i) => ({ v: 1, old: i })))));
  await page.click('#bPlay'); await page.waitForTimeout(200);
  await END(page);
  const h = await page.evaluate(() => JSON.parse(localStorage.getItem('extinctionEvent.history')));
  assert.strictEqual(h.length, 50, 'the oldest gave way');
  assert.strictEqual(h[0].old, 1);
  const m = h.at(-1);
  assert.strictEqual(m.v, 1); assert.strictEqual(m.sides[0].res, 'win'); assert.strictEqual(m.sides[1].res, 'loss');
  assert.ok(m.len >= 70 && m.diff && m.sides[0].faction && m.at > 0 && Number.isFinite(m.seed), JSON.stringify(m).slice(0, 300));
  assert.ok(m.sides[0].credits > 0 && typeof m.sides[0].built === 'object');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('storage that throws: the match still ends and shows its report; nothing recorded', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(200);
  await page.evaluate(() => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'extinctionEvent.history') throw new Error('QuotaExceededError'); return set.call(this, k, v); }; });
  await END(page);
  assert.strictEqual(await page.evaluate(() => localStorage.getItem('extinctionEvent.history')), null);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
