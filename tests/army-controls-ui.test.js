// v2.62 (Phase 1, army controls on Classic) in headless Chromium at both iPhone sizes: the Army tab's Rally and Send
// damaged home buttons are on screen, clear of the other controls and big enough to tap; one tap switches flags and
// sends the army; a flag on the battlefield can be tapped and moved; the damaged count shows on the button.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

for (const dev of [PHONE, NARROW]) test(`army controls at ${dev.width}×${dev.height}: layout, Rally, moving a flag, Send damaged home`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  await page.click('#bPlay'); await page.waitForTimeout(200);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9;
    for (let i = 0; i < 6; i++) spawnUnit(game, 0, i < 4 ? 'rifle' : 'tank', 470 + i * 12, 0);
    game.ents.filter(e => e.side === 0 && e.kind === 'u').slice(0, 2).forEach(u => { u.hp = u.maxHp * 0.25; }); });
  await page.click('.tabs [data-tab="army"]'); await page.waitForTimeout(250);
  const L = await page.evaluate(() => {
    const r = id => { const b = document.getElementById(id).getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
    const hit = id => { const el = document.getElementById(id), b = el.getBoundingClientRect(), h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return h === el || el.contains(h); };
    const cmd = [...document.querySelectorAll('#acmd button')].map(b => b.getBoundingClientRect()), abil = [...document.querySelectorAll('#abil .ab')].map(b => b.getBoundingClientRect());
    return { rally: r('bRally'), dmg: r('bDamaged'), hitR: hit('bRally'), hitD: hit('bDamaged'), cmdR: Math.max(...cmd.map(b => b.right)), abilB: Math.max(0, ...abil.map(b => b.bottom)), abilL: Math.min(1e4, ...abil.map(b => b.left)), dmgTxt: document.querySelector('#bDamaged b').textContent, rallyTxt: document.querySelector('#bRally b').textContent, W: innerWidth, H: innerHeight };
  });
  for (const k of ['rally', 'dmg']) { const b = L[k]; assert.ok(b.w >= 72 && b.h >= 30 && b.x >= L.cmdR && b.r <= L.W && b.b <= L.H, `${k} on screen, right of Hold/Attack/Retreat/Regroup, tappable size ${JSON.stringify(b)}`); }
  assert.ok(L.hitR && L.hitD, 'nothing covers them');
  assert.ok(L.rally.y > L.abilB || L.rally.r < L.abilL, 'clear of the ability buttons');
  assert.strictEqual(L.rallyTxt, 'Base'); assert.strictEqual(L.dmgTxt, 'Damaged 2', 'the count of units it would send');
  // Rally: one tap to the forward flag, the army goes there
  await page.click('#bRally');
  const r1 = await page.evaluate(() => { for (let i = 0; i < 60 * 12; i++) update(game, TICK); refreshUI(true); const R = game.sides[0].rally;
    return { at: R.at, txt: document.querySelector('#bRally b').textContent, near: game.ents.filter(e => e.side === 0 && e.kind === 'u' && !e.medHome).every(u => Math.abs(u.u - R.fwd) < 80) }; });
  assert.deepStrictEqual(r1, { at: 'fwd', txt: 'Forward', near: true });
  // Send damaged home: the two hurt units go back
  await page.click('#bDamaged');
  assert.ok(await page.evaluate(() => game.ents.filter(e => e.medHome).length === 2));
  // move the forward flag: tap it, then the ground 120 further on
  const pos = await page.evaluate(() => { const R = game.sides[0].rally, q = P(R.fwd + 30, -20), sx = w => (w.x - cam.x) * V.S + V.cw / 2, sy = w => V.A + (w.y - Y_BOT) * V.S;
    cam.x = R.fwd + 60; clampCam(); return { fx: sx({ x: q.x + 8 }), fy: sy({ y: q.y - 20 }), gx: sx({ x: P(R.fwd + 150, -90).x }), gy: sy({ y: P(0, -90).y }), was: R.fwd }; }); // above the banner, which sits mid-screen
  const box = await page.locator('#cv').boundingBox();
  await page.mouse.click(box.x + pos.fx, box.y + pos.fy); await page.waitForTimeout(80);
  assert.ok(await page.evaluate(() => fmv === 'fwd' && !$('aim').classList.contains('hide')), 'tapping the flag starts moving it');
  await page.mouse.click(box.x + pos.gx, box.y + pos.gy); await page.waitForTimeout(80);
  const moved = await page.evaluate(() => ({ f: game.sides[0].rally.fwd, fmv, banner: !$('aim').classList.contains('hide') }));
  assert.ok(Math.abs(moved.f - (pos.was + 120)) < 25 && !moved.fmv && !moved.banner, `moved about 120 on (${JSON.stringify(moved)} from ${pos.was})`);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
