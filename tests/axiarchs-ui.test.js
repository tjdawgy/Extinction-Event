// Axiarchs in headless Chromium (v2.26): the Set warp point card (arm, refused outside the field, placed inside it,
// cancel), and the enemy's power field and warp channels kept out of view in the fog (no picture, no sound) until seen.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

test('Set warp point: the first Train card arms it; a tap outside the field is refused; a tap inside places it; the card cancels', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#meSeg [data-f="axiarchs"]'); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
  await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 5000; }
    for (let i = 0; i < 30 * 40; i++) update(game, 1 / 30);
    cam.x = hqPos(0).u + 250; clampCam(); render(ctx, game, game.t, sel, selPad);
    window.__xy = (u, v) => { const w = P(u, v); return { x: V.cw / 2 + (w.x - cam.x) * V.S, y: V.A + (w.y - Y_BOT) * V.S }; };
  });
  await page.click('.tabs [data-tab="train"]');
  assert.strictEqual(await page.evaluate(() => $('cards').firstChild.id), 'cWarp', 'the first card on the Train tab');
  assert.match(await page.textContent('#cWarp'), /Warp point.*Front/);
  await page.click('#cWarp');
  assert.ok(await page.evaluate(() => wpt && !$('aim').classList.contains('hide')) && /Set warp point/.test(await page.textContent('#aim')));
  const out = await page.evaluate(() => __xy(hqPos(0).u + FIELD.axisR + 140, hqPos(0).v + 40));
  await page.mouse.click(out.x, out.y);
  assert.ok(await page.evaluate(() => wpt && game.sides[0].warp === null), 'outside the field: refused, still armed');
  assert.match(await page.textContent('#aimTxt'), /inside your power field/);
  const tgt = await page.evaluate(() => ({ u: hqPos(0).u + 150, v: hqPos(0).v + 10 }));
  const inn = await page.evaluate(t => __xy(t.u, t.v), tgt);
  await page.mouse.click(inn.x, inn.y);
  const w = await page.evaluate(() => ({ warp: game.sides[0].warp, armed: wpt, banner: !$('aim').classList.contains('hide') }));
  assert.ok(w.warp && Math.abs(w.warp.u - tgt.u) < 3 && !w.armed && !w.banner, JSON.stringify(w));
  assert.match(await page.textContent('#cWarp'), /Moved/);
  await page.click('#cWarp'); await page.click('#cWarp');
  assert.ok(await page.evaluate(() => !wpt && $('aim').classList.contains('hide')), 'tapping the card again cancels');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('an enemy Axiarch field and its warps in the fog show nothing and make no sound; in view they show', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#meSeg [data-f="lastfist"]'); await page.click('#foeSeg [data-f="axiarchs"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro(); game.sides[0].aiT = 1e9; game.sides[1].aiT = 1e9; paused = true;
    for (let i = 0; i < 30 * 60; i++) update(game, 1 / 30);
    render(ctx, game, game.t, null, -1);
    const calls = []; const sf = sfx; window.sfx = (n, x) => { calls.push(n); return sf(n, x); };
    const F = game.fog[0], lit = u => F.vis[cellOf(u)] === 1;
    startWarp(game, 1, 'shardling'); const w = game.warps.at(-1);
    cam.x = hqPos(1).u - 150; clampCam(); for (let i = 0; i < 5; i++) render(ctx, game, game.t, null, -1);
    const hidden = { calls: calls.slice(), litWarp: lit(w.u), fieldMemory: Object.keys(F.field).length, drawnSig: FLV.sig[1] };
    const eye = spawnUnit(game, 0, 'drone', hqPos(1).u - 150, 0); eye.holdU = eye.u; eye.holdV = 0; updateVision(game); // a Recon Drone over the enemy base
    startWarp(game, 1, 'bastion'); const w2 = game.warps.at(-1);
    for (let i = 0; i < 5; i++) render(ctx, game, game.t, null, -1);
    return { hidden, shown: { calls: calls.slice(hidden.calls.length), fieldMemory: Object.keys(F.field).length, drawnSig: FLV.sig[1], seenW2: lit(w2.u) } };
  });
  assert.strictEqual(r.hidden.litWarp, false);
  assert.deepStrictEqual(r.hidden.calls, [], 'no warp sound from the fog');
  assert.strictEqual(r.hidden.fieldMemory, 0, 'the enemy field unseen'); assert.strictEqual(r.hidden.drawnSig, '', 'nothing of it drawn');
  assert.ok(r.shown.calls.includes('warp') && r.shown.fieldMemory > 0 && r.shown.drawnSig !== '', JSON.stringify(r.shown));
  assert.deepStrictEqual(errors, []);
  await page.close();
});
