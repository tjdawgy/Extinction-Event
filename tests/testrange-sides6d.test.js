// v2.94 (batch 6d, Part C2): the Test Range names its sides Left and Right (the start-side wording), whatever colours a row picks:
// the bar, the setup panel (Place for, Orders, Enemies fight back, Control ... myself, Compare, Team colours), the info card, the
// tool line and the toasts. Screenshots (667×375) go to tests/screenshots/ (docs/screenshots/ with EE_DOC_SHOTS=1):
// rework6d-testrange-setup.png (the setup panel) and rework6d-testrange-sides.png (the field with the bar, non-default colours).
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');
const SHOTS = process.env.EE_DOC_SHOTS ? path.join(__dirname, '..', 'docs', 'screenshots') : path.join(__dirname, 'screenshots'); require('fs').mkdirSync(SHOTS, { recursive: true });

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

// visible text with the colour names of the Team colours choices taken out (those name colours, not sides)
const sideWords = page => page.evaluate(() => {
  const strip = el => { const c = el.cloneNode(true); for (const b of c.querySelectorAll('[id^="trTc"] button')) b.remove(); for (const s of c.querySelectorAll('small')) if (/Pairs too alike/.test(s.textContent)) s.remove(); return c.textContent; };
  return [strip(document.getElementById('trBar')), document.getElementById('ov').classList.contains('hide') ? '' : strip(document.getElementById('box'))].join(' | ');
});

test('C2: the Test Range calls its sides Left and Right everywhere, never Blue and Red', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#bRange'); await page.waitForTimeout(200);
  let txt = await sideWords(page);
  assert.ok(!/\bBlue\b|\bRed\b|\bblue\b|\bred\b/.test(txt), `no Blue or Red in the setup and bar: ${txt.match(/.{0,40}\b(Blue|Red|blue|red)\b.{0,40}/)}`);
  assert.ok(/Left/.test(txt) && /Right/.test(txt), 'Left and Right are named');
  await page.screenshot({ path: path.join(SHOTS, 'rework6d-testrange-setup.png') });
  // place units for each side, with colours that are neither blue nor red, and run a moment
  await page.evaluate(() => { TR.set.tc = [['gold', 'purple']]; });
  await page.click('#trPs button[data-k="0"]'); await page.click('#trPf button[data-k="lastfist"]'); await page.click('#trPn button[data-k="5"]'); await page.click('#trU button[data-type="rifle"]');
  const toast1 = await page.evaluate(() => [...document.querySelectorAll('#toasts > *')].map(t => t.textContent).join(' / '));
  assert.ok(/for left/.test(toast1), `the placing toast names the left side: ${toast1}`);
  const tool = await page.evaluate(() => document.getElementById('trTool').textContent); assert.ok(/Left: tap the field/.test(tool), tool);
  const y = await page.evaluate(() => { const T = trView(0); return T.y0 + (T.y1 - T.y0) * 0.6; });
  await page.mouse.click(250, y); await page.waitForTimeout(60);
  await page.click('#trTool'); await page.click('#trQ button[data-i="0"]'); await page.waitForTimeout(80);
  const toast2 = await page.evaluate(() => [...document.querySelectorAll('#toasts > *')].map(t => t.textContent).join(' / '));
  assert.ok(/for the right side/.test(toast2) && !/\bred\b/.test(toast2), toast2);
  // the info card of a placed unit
  const [ux, uy] = await page.evaluate(() => { const e = game.ents.find(x => x.side === 1 && x.kind === 'u'), p = trScreen(trView(0), e); return [p.x, p.y]; });
  await page.mouse.click(ux, uy); await page.waitForTimeout(200);
  assert.ok(/^Right ·/.test(await page.evaluate(() => document.getElementById('infoSub').textContent)), 'the info card says Right');
  await page.evaluate(() => { hideOverlay(); for (const t of document.querySelectorAll('#toasts > *')) t.remove(); });
  txt = await sideWords(page); assert.ok(/Left/.test(txt) && /Right/.test(txt) && !/\b(Blue|Red)\b/.test(txt), txt);
  await page.click('#trGo'); await page.waitForTimeout(1200); await page.click('#trGo'); // Start, a moment of fighting, Pause
  await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); });
  await page.screenshot({ path: path.join(SHOTS, 'rework6d-testrange-sides.png') });
  assert.deepStrictEqual(errors, []);
  await page.close();
});
