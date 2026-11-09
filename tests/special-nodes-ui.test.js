// v2.71 (Phase 1, Proposal E) in headless Chromium at both iPhone sizes: on Three-Lane the relic's neutral guards (gold),
// the relic and a repair depot are drawn; taking a relic shows a toast with its reward. Screenshots:
// docs/screenshots/special-{relic,depot}-<size>.png.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const shot = (page, name, dev) => page.screenshot({ path: path.join(__dirname, '..', 'docs', 'screenshots', `special-${name}-${dev.width}x${dev.height}.png`) });
const look = (page, u, v) => page.evaluate(([u, v]) => { applyZoom(1.25); cam.x = u; cam.y = v * DY - (Y_TOP + Y_BOT) / 2; clampCam(); for (const t of document.querySelectorAll('#toasts > *')) t.remove(); drawNow(); }, [u, v]);

for (const dev of [PHONE, NARROW]) test(`relic and repair depot at ${dev.width}×${dev.height}`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  await page.click('#bPlay'); await page.click('.mapc[data-m="threelane"]'); await page.click('#bMapGo'); await page.waitForTimeout(250);
  const R = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; camTouched = true; paused = true;
    const n = game.nodes.find(x => x.type === 'relic' && x.u < 1150), d = game.nodes.find(x => x.type === 'repair' && x.v < 0);
    d.owner = 0; d.prog = 100;
    for (let i = 0; i < 5; i++) { const u = spawnUnit(game, 0, i % 2 ? 'tank' : 'rifle', n.u + 90 + i * 8, n.v + 30); u.lane = 1; }
    for (let i = 0; i < 3; i++) { const u = spawnUnit(game, 0, 'heavy', d.u - 20 + i * 18, d.v + 10); u.hp = u.maxHp * 0.5; }
    for (let i = 0; i < 40; i++) update(game, TICK);
    return { guards: game.guards.filter(x => x.node === n.id && x.hp > 0).length, n: [n.u, n.v], d: [d.u, d.v], seen: game.guards.some(x => visibleTo(game, 0, x)) };
  });
  assert.strictEqual(R.guards, 3); assert.ok(R.seen, 'the guards are in view');
  await look(page, R.n[0] + 40, R.n[1]); await page.waitForTimeout(150); await page.evaluate(() => drawNow());
  await shot(page, 'relic', dev);
  await look(page, R.d[0], R.d[1] + 60); await page.waitForTimeout(150); await page.evaluate(() => drawNow());
  await shot(page, 'depot', dev);
  const t = await page.evaluate(() => { const n = game.nodes.find(x => x.type === 'relic' && x.u < 1150); for (const x of game.guards) if (x.node === n.id) kill(game, x, 0); const c0 = game.sides[0].res.c; relicTaken(game, n, 0); handleEvents(); return { toasts: [...document.querySelectorAll('#toasts > *')].map(x => x.textContent), gain: game.sides[0].res.c - c0 }; });
  assert.ok(t.toasts.some(x => /Relic taken: \+800 credits/.test(x)), JSON.stringify(t)); assert.strictEqual(t.gain, 800);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
