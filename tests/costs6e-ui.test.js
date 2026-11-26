// v2.95 (batch 6e, REWORK.b6e) in a real browser: the Codex (card and stats table) and a unit's info card show the batch 6e
// prices and values when b6e is on (the new-game default) and v2.94's with it off. Screenshot: tests/screenshots/costs6e-codex-on.png
// (docs/screenshots with EE_DOC_SHOTS=1).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, openPage } = require('./browser-kit');

const pw = findPlaywright(), skip = !pw && 'Playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const OUT = process.env.EE_DOC_SHOTS ? path.join(__dirname, '..', 'docs', 'screenshots') : path.join(__dirname, 'screenshots');

test('b6e (b6f off): the Codex and the info card show the converted Axiarch prices and changed values; off, v2.94\'s', { skip }, async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { page, errors } = await openPage(browser, PHONE);
  await page.evaluate(() => { REWORK.b6f = false; REWORK.b6g = false; }); // v2.96: b6f undoes the conversion (tests/rework-6f-ui.test.js)
  const read = () => page.evaluate(() => {
    const card = t => document.getElementById('cx-u-' + t), row = t => $('cxTw').querySelector(`tbody tr[data-t="${t}"]`);
    return { lancerCard: card('lancer').textContent, lancerRow: row('lancer').textContent, rsCard: card('riftstalker').textContent, shCard: card('shardling').textContent, want: J(B6E) };
    function J(x) { return JSON.parse(JSON.stringify(x)); }
  });
  await page.evaluate(() => openCodex('axiarchs', 'unit:lancer')); await page.waitForTimeout(200);
  const on = await read(), L = on.want.cost.lancer, M = on.want.cost.marksman;
  assert.ok(on.lancerCard.includes(String(L.c)) && on.lancerCard.includes(String(L.e)), `Lancer card shows ${L.c}/${L.e}: ${on.lancerCard.slice(0, 120)}`);
  assert.ok(on.lancerRow.includes(String(L.c)) && on.lancerRow.includes(String(L.e)), 'Lancer stats row');
  assert.ok(on.rsCard.includes(String(on.want.unit.riftstalker.shp)), 'Riftstalker card shows its batch 6e shields');
  await page.screenshot({ path: path.join(OUT, 'costs6e-codex-on.png') });
  const info = await page.evaluate(() => { closeCodex && closeCodex(); showInfo('u', 'marksman'); return document.getElementById('info').textContent; });
  assert.ok(info.includes(`${M.c} credits, ${M.e} energy`), `info card: ${info.slice(0, 200)}`);
  await page.evaluate(() => { REWORK.b6e = false; const i = document.getElementById('info'); if (i) i.classList.remove('show'); openCodex('axiarchs', 'unit:lancer'); });
  await page.waitForTimeout(200);
  const off = await read();
  assert.ok(off.lancerCard.includes('120') && off.lancerCard.includes('45'), 'off: v2.94\'s Lancer price');
  assert.ok(off.rsCard.includes('110') && !off.rsCard.includes(String(on.want.unit.riftstalker.shp)), 'off: v2.94\'s Riftstalker shields');
  const info0 = await page.evaluate(() => { closeCodex && closeCodex(); showInfo('u', 'marksman'); return document.getElementById('info').textContent; });
  assert.ok(info0.includes('240 credits, 110 energy'), `off info card: ${info0.slice(0, 200)}`);
  await page.evaluate(() => { REWORK.b6e = true; REWORK.b6f = true; });
  assert.deepStrictEqual(errors, []);
});
