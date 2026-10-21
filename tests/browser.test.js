// Loads index.html in headless Chromium, starts a match and checks for errors.
// Skips itself when Playwright isn't installed.
const test = require('node:test');
const assert = require('node:assert');
const { pathToFileURL } = require('url');
const { HTML_PATH } = require('./load-sim');

let chromium = null;
try { ({ chromium } = require('playwright')); } catch (e) {
  try { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); } catch (e2) {}
}

test('game loads and runs in a browser', { skip: !chromium && 'playwright not installed' }, async () => {
  const fs = require('fs');
  const exe = ['/opt/pw-browsers/chromium/chrome', '/opt/pw-browsers/chromium'].find(p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } });
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(pathToFileURL(HTML_PATH).href);
    assert.strictEqual(await page.title(), 'Extinction Event');
    assert.match(await page.textContent('#box h1'), /Extinction\s*Event/);
    assert.match(await page.textContent('#box .ver'), /^v\d+\.\d+$/);
    await page.click('#bPlay');
    await page.click('#cards .card[data-type="barracks"]');
    await page.waitForTimeout(1500);
    assert.ok(await page.evaluate(() => game && game.t > 0.5 && game.ents.some(e => e.type === 'barracks')));
    assert.deepStrictEqual(errors, []);
  } finally { await browser.close(); }
});
