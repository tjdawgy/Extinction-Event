// The Build tab at rest (v2.34): with the Build tab open and nothing changing for 10 game seconds, the cards are neither rebuilt
// nor restyled, for all three factions. v2.32 broke this: a signature-building check left `locked` undefined for every other
// card, and classList.toggle('locked', undefined) flips the class instead of setting it, so every UI refresh (about 7 a
// second) flashed the cards. A real change (credits for a card) still restyles the card once.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) {
  test(`${fac}: the Build tab at rest for 10 game seconds: no card rebuilt or restyled; a real change still shows once`, { skip }, async () => {
    const { page, errors } = await openPage(browser, NARROW);
    await page.click(`#meSeg [data-f="${fac}"]`); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#bPlay');
    await page.waitForFunction(() => game && game.countdown <= 0, null, { timeout: 15000 });
    await page.evaluate(() => { for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } speed = 3; window.__keep = [...$('cards').children]; });
    await page.waitForTimeout(800); // settle: every card affordable
    const t0 = await page.evaluate(() => { window.__m = []; window.__mo = new MutationObserver(ms => { for (const m of ms) __m.push(`${m.type} ${m.target.dataset && m.target.dataset.type || m.target.className || m.target.nodeName} ${m.attributeName || ''} ${m.oldValue || ''}`); }); __mo.observe($('cards'), { subtree: true, childList: true, attributes: true, characterData: true, attributeOldValue: true }); return game.t; });
    await page.waitForFunction(t => game.t >= t + 10, t0, { timeout: 30000, polling: 200 });
    const r = await page.evaluate(() => ({ m: __m.slice(), same: [...$('cards').children].every((el, i) => el === __keep[i]), n: $('cards').children.length, tab: tab }));
    assert.strictEqual(r.tab, 'build'); assert.ok(r.n >= 7);
    assert.ok(r.same, 'no card rebuilt'); assert.deepStrictEqual(r.m, [], 'no card restyled or rewritten');
    // a real change: too poor for the cards, each turns "poor" once, then rests again
    const after = await page.evaluate(async () => { // observer records arrive after a tick
      const tick = () => new Promise(r => setTimeout(r, 0)); paused = true; await tick(); __m.length = 0;
      game.sides[0].res.c = 0; game.sides[0].res.e = 0; refreshUI(false); await tick(); const n1 = __m.length;
      refreshUI(false); refreshUI(false); await tick(); return { n1, n2: __m.length, poor: [...$('cards').querySelectorAll('.card.poor')].length }; });
    assert.ok(after.n1 > 0 && after.poor > 0, 'restyled when the state changed'); assert.strictEqual(after.n2, after.n1, 'and only once');
    assert.deepStrictEqual(errors, []);
    await page.close();
  });
}
