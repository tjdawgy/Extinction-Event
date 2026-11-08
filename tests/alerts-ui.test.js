// v2.53 (Phase 0 item 6): alerts for the HQ and buildings under attack and contested nodes; a tap on the alert or its
// minimap ping moves the camera there; each kind at most once every 10 s per location.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const START = () => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; paused = true; };

for (const dev of [PHONE, NARROW]) test(`at ${dev.width}×${dev.height}: HQ alert, once per 10 s, tap jumps the camera; buildings by strip; contested node; minimap ping`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  await page.click('#bPlay'); await page.click('#bMapGo'); // v2.65: through map select (Classic, the default) await page.waitForTimeout(200);
  const r1 = await page.evaluate(START => {
    eval(`(${START})`)();
    const hq = game.sides[0].hq; cam.x = 1600; clampCam();
    damage(game, hq, 5, 'rifle', 1); alertTick();
    const first = [...document.querySelectorAll('#alerts .alrt')].map(t => t.textContent);
    for (let i = 0; i < 60 * 5; i++) update(game, TICK); damage(game, hq, 5, 'rifle', 1); alertTick();
    const within = document.querySelectorAll('#alerts .alrt').length;
    return { first, within, pings: alerts.pings.length, camBefore: cam.x };
  }, START.toString());
  assert.deepStrictEqual(r1.first, ['Your HQ is under attack ›']);
  assert.strictEqual(r1.within, 1, 'no second alert inside 10 s');
  assert.strictEqual(r1.pings, 1);
  const thru = await page.evaluate(() => { aim = { k: 'shield', placed: false }; alertTick(); const a = getComputedStyle(document.querySelector('#alerts .alrt')).pointerEvents; aim = null; alertTick(); return [a, getComputedStyle(document.querySelector('#alerts .alrt')).pointerEvents]; });
  assert.deepStrictEqual(thru, ['none', 'auto'], 'while aiming, taps go through the alert to the field');
  const box = await page.locator('#alerts .alrt').boundingBox();
  assert.ok(box && box.y >= 72 && box.x >= 54 && box.x + box.width <= dev.width / 2, `the alert is on screen, below the viewer strip, in the left column ${JSON.stringify(box)}`);
  await page.click('#alerts .alrt');
  const r2 = await page.evaluate(() => { const want = (() => { const k = cam.x; cam.x = game.sides[0].hq.u; clampCam(); const w = cam.x; cam.x = k; return w; })(); return { cam: cam.x, want, left: document.querySelectorAll('#alerts .alrt').length }; });
  assert.ok(Math.abs(r2.cam - r2.want) < 1 && r2.cam < 900, `camera on the HQ ${JSON.stringify(r2)}`);
  assert.strictEqual(r2.left, 0, 'a tapped alert goes away');
  const r3 = await page.evaluate(() => {
    for (let i = 0; i < 60 * 6; i++) update(game, TICK); // past the 10 s gap
    damage(game, game.sides[0].hq, 5, 'rifle', 1); alertTick();
    const again = document.querySelectorAll('#alerts .alrt').length;
    // a building in a different strip alerts on its own; the same strip again inside 10 s does not
    game.sides[0].res.c = game.sides[0].res.e = 5000;
    const b1 = (tryBuild(game, 0, 'barracks', 0), game.ents.find(e => e.type === 'barracks' && e.side === 0)); b1.built = true; b1.hp = b1.maxHp;
    damage(game, b1, 5, 'rifle', 1); alertTick();
    const bTxt = [...document.querySelectorAll('#alerts .alrt')].map(t => t.textContent).at(-1);
    damage(game, b1, 5, 'rifle', 1); alertTick();
    const keys = Object.keys(alerts.last).sort();
    // a node it owns with an enemy rifleman standing on it, seen by its own rifleman
    const n = game.nodes[0]; n.owner = 0; n.prog = 100;
    const mine = spawnUnit(game, 0, 'rifle', n.u - 40, 0); mine.holdU = mine.u; mine.holdV = 0;
    const foe = spawnUnit(game, 1, 'rifle', n.u, 0); foe.holdU = foe.u; foe.holdV = 0; foe.cd = 1e9; mine.cd = 1e9;
    update(game, TICK); alertTick();
    const nodeTxt = [...document.querySelectorAll('#alerts .alrt')].map(t => t.textContent).at(-1);
    return { again, bTxt, keys, nodeTxt, nodePing: alerts.pings.at(-1) };
  });
  assert.strictEqual(r3.again, 1, 'after 10 s the HQ alerts again');
  assert.strictEqual(r3.bTxt, 'Barracks under attack ›');
  assert.strictEqual(r3.keys.filter(k => k.startsWith('bld:')).length, 1, JSON.stringify(r3.keys));
  assert.strictEqual(r3.nodeTxt, 'The west field node is contested ›');
  // tap the node's ping on the minimap: the camera goes to the node
  await page.evaluate(() => { cam.x = 1600; clampCam(); drawMinimapNow(); });
  const mmBox = await page.locator('#mm').boundingBox();
  const px = await page.evaluate(u => { const r = mm.getBoundingClientRect(), k = (r.width - 8) / (UMAX - UMIN); return r.left + 4 + (u - UMIN) * k; }, r3.nodePing.u);
  await page.mouse.click(px + 5, mmBox.y + mmBox.height / 2);
  const cam = await page.evaluate(u => { const k = cam.x; cam.x = u; clampCam(); const w = cam.x; cam.x = k; return { cam: cam.x, want: w }; }, r3.nodePing.u);
  assert.ok(Math.abs(cam.cam - cam.want) < 1, `a tap next to the ping lands on it ${JSON.stringify(cam)}`);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
