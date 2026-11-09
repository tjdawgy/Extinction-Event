// v2.69 (Phase 1, base-breaking): what the player sees of the new rules: a "Power failing" alert once per step from 15:00,
// the failing guns drawn flickering with sparks and a warning bolt, and rubble on a destroyed building's pad (tapping it
// says how long it has left). Screenshots go to docs/screenshots/basebreak-*.png.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

for (const dev of [PHONE, NARROW]) test(`at ${dev.width}×${dev.height}: Power failing alert and effect, rubble on a destroyed building's pad`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  await page.click('#bPlay'); await page.click('#bMapGo'); await page.waitForTimeout(200);
  const r = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; paused = true; camTouched = true;
    const s0 = game.sides[0]; s0.res.c = s0.res.e = 9000;
    for (const t of ['barracks', 'turret', 'refinery']) { tryBuild(game, 0, t); const b = game.ents.filter(e => e.type === t && e.side === 0).pop(); b.built = true; b.hp = b.maxHp; }
    const ref = game.ents.find(e => e.type === 'refinery' && e.side === 0), slot = ref.slot;
    game.t = BREAK.power.from - 1; alertTick();
    const before = [...document.querySelectorAll('#alerts .alrt')].length;
    game.t = BREAK.power.from + 1; alertTick();
    const t1 = [...document.querySelectorAll('#alerts .alrt')].map(t => t.textContent);
    alertTick(); const again = document.querySelectorAll('#alerts .alrt').length;
    game.t = BREAK.power.from + 61; alertTick();
    kill(game, ref, 1);
    const t2 = [...document.querySelectorAll('#alerts .alrt')].map(t => t.textContent).at(-1);
    cam.x = game.sides[0].hq.u + 120; clampCam(); drawNow();
    return { before, t1, again, t2, slot, rub: rubbleAt(game, 0, slot), msg: tryBuild(game, 0, 'reactor', slot).msg };
  });
  assert.strictEqual(r.before, 0, 'no alert before 15:00');
  assert.deepStrictEqual(r.t1, ['Power failing: base guns at 85% ›']);
  assert.strictEqual(r.again, 1, 'once per step');
  assert.strictEqual(r.t2, 'Power failing: base guns at 70% ›');
  assert.ok(r.rub && /Rubble: this pad clears in \d+ s/.test(r.msg), r.msg);
  // the picture: zoomed in on the base once the explosion has cleared and the toasts have gone
  await page.evaluate(() => { for (let i = 0; i < 150; i++) update(game, TICK); game.t = BREAK.power.from + 90; for (const t of document.querySelectorAll('#toasts > *, #alerts > *')) t.remove(); applyZoom(1.15); cam.x = game.sides[0].hq.u + 160; clampCam(); drawNow(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => drawNow());
  await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'screenshots', `basebreak-${dev.width}x${dev.height}.png`) });
  assert.deepStrictEqual(errors, []);
  await page.close();
});
