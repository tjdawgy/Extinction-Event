// v2.82 (docs/FACTION_REWORK.md batch 2a) in headless Chromium at 667×375, with real taps: the Test Range's per-row rework
// switches (Setup → Rework switches), a Gorebore placed in a row with the batch off becoming a Bile Lobber, the Codex
// showing the Gorebore and Severance, and no page errors while all three new units fight (burrow, eruption, exile, markers).
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

test('Test Range: per-row rework switches; the three units fight without errors; Codex lists the new units', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#bRange'); await page.waitForTimeout(200);
  await page.click('#trCr button[data-k="3"]'); await page.waitForTimeout(100);
  for (const k of [0, 1, 2]) for (const key of ['b2a', 'artDeploy', 'artTelegraph']) assert.ok(await page.$(`#trRw${k}${key} button[data-k="0"]`), `row ${k + 1} ${key} switch`);
  const small = await page.evaluate(() => [...document.querySelectorAll('.trrw button')].filter(b => b.getBoundingClientRect().height < 44).length);
  assert.strictEqual(small, 0, 'every switch at least 44 pt');
  await page.click('#trRw1b2a button[data-k="0"]'); await page.waitForTimeout(100); // row 2: before the batch
  await page.click('#trRw2artTelegraph button[data-k="0"]'); await page.waitForTimeout(100); // row 3: deploy only
  assert.deepStrictEqual(await page.evaluate(() => TR.games.map(g => [g.rw.b2a, g.rw.artDeploy, g.rw.artTelegraph])), [[true, true, true], [false, true, true], [true, true, false]]);
  // place a Gorebore in every row (Every row), then the Infantry blob
  await page.click('#trPr button[data-k="1"]'); await page.click('#trPf button[data-k="bloomhost"]'); await page.click('#trPn button[data-k="3"]');
  await page.click('#trU button[data-type="gorebore"]');
  const y = await page.evaluate(() => { const T = trView(0); return T.y0 + (T.y1 - T.y0) * 0.7; });
  await page.mouse.click(240, y); await page.waitForTimeout(100);
  assert.deepStrictEqual(await page.evaluate(() => TR.games.map(g => g.ents.filter(e => e.side === 0).map(e => e.type)[0])), ['gorebore', 'bilelobber', 'gorebore'], 'the row with the batch off places a Bile Lobber');
  await page.click('#trTool'); await page.click('#trQ button[data-i="0"]');
  await page.click('#trGo'); await page.waitForTimeout(6000);
  assert.ok(await page.evaluate(() => TR.games.every(g => g.t > 3 && rangeRead(g).dmg[0] > 0)), 'the fight runs in every row');
  // a saved setup keeps each row's switches
  await page.click('#trGo'); await page.click('#trSet'); await page.fill('#trNm', 'rw test'); await page.click('#trSv');
  await page.evaluate(() => { TR.set.rw[1].b2a = true; });
  await page.click('#box [data-load="0"]'); await page.waitForTimeout(100);
  assert.strictEqual(await page.evaluate(() => TR.games[1].rw.b2a), false, 'loaded with row 2 still before the batch');
  // the Codex shows the new units, not the old
  await page.evaluate(() => { trOff(); showStart(); }); await page.waitForTimeout(100);
  await page.click('#bCodex'); await page.waitForTimeout(100);
  await page.click('#cxTabs [data-t="bloomhost"]'); await page.waitForTimeout(100);
  assert.ok(await page.evaluate(() => !!document.getElementById('cx-u-gorebore') && !document.getElementById('cx-u-bilelobber') && $('cxBody').textContent.includes('Burrowing Evolution')));
  await page.click('#cxTabs [data-t="axiarchs"]'); await page.waitForTimeout(100);
  assert.ok(await page.evaluate(() => !!document.getElementById('cx-u-severance') && !document.getElementById('cx-u-riftmortar')));
  assert.deepStrictEqual(errors, []);
  await page.close();
});
