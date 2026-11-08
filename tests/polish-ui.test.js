// Audit phase 7c (v2.43): the signature pad and the rally point in a real browser at both iPhone landscape sizes. The pad is
// drawn and marked, tapping it opens the pad panel, the Build tab marks the signature cards (★ SIG PAD) and shows "Pad in
// use" for the other one, a signature card builds on the pad while the 8 pads stay free, and the rally flag sits inside the
// HQ gun's cover. Screenshots go to tests/screenshots/polish-*.png (and audit/shots7c when EE_SHOTS is set).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright(), skip = !pw && 'Playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const OUT = process.env.EE_SHOTS || path.join(__dirname, 'screenshots');

for (const dev of [PHONE, NARROW]) for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) {
  test(`signature pad and rally point as ${fac} (${dev.width}x${dev.height})`, { skip }, async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const tag = `${dev.width}x${dev.height}-${fac}`, shot = n => page.screenshot({ path: path.join(OUT, `polish-${tag}-${n}.png`) });
    const { page, errors } = await openPage(browser, dev);
    await page.click(`#meSeg [data-f="${fac}"]`); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#bPlay'); await page.click('#bMapGo'); // v2.65: through map select (Classic, the default) await page.waitForTimeout(300);
    await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } homeCamera(); refreshUI(true); });
    await page.waitForTimeout(200);
    await shot('1-empty-pad');
    const r1 = await page.evaluate(() => {
      const out = {};
      openPad(SIG_SLOT); refreshUI(true);
      out.name = $('bpName').textContent; out.pad = $('bpPad').textContent; out.now = $('bpNow').textContent;
      const card = t => $('cards').querySelector(`.card[data-type="${t}"]`);
      out.tags = ['sigA', 'sigB', 'refinery'].map(t => (card(t).querySelector('.path.sg') || {}).textContent || '');
      out.refuse = tryBuild(game, 0, 'refinery', SIG_SLOT).msg;
      return out;
    });
    await page.waitForTimeout(150);
    await shot('2-pad-panel');
    assert.strictEqual(r1.name, 'Signature pad'); assert.match(r1.now, /One stands here at a time/);
    assert.deepStrictEqual(r1.tags, ['★ SIG PAD', '★ SIG PAD', '']); assert.match(r1.refuse, /Only a signature building/);
    const r2 = await page.evaluate(() => {
      const card = t => $('cards').querySelector(`.card[data-type="${t}"]`);
      onCard('sigA', card('sigA'));
      const b = game.ents.find(e => e.type === 'sigA' && e.side === 0); b.built = true; b.progress = 1; b.hp = b.maxHp;
      for (let i = 0; i < 20; i++) update(game, 1 / 30);
      refreshUI(true);
      return { slot: b.slot, free: game.sides[0].slots.filter(x => !x).length, costs: ['sigA', 'sigB'].map(t => card(t).querySelector('.cost').textContent), panel: (openPanel(b), refreshPanel(), $('bpPad').textContent) };
    });
    await page.waitForTimeout(150);
    await shot('3-built');
    assert.strictEqual(r2.slot, 8); assert.strictEqual(r2.free, 8, 'the 8 pads stay free');
    assert.deepStrictEqual(r2.costs, ['Already built', 'Pad in use']); assert.strictEqual(r2.panel, 'Signature pad');
    // the rally flag, and units rallied there: inside the HQ gun's reach
    const r3 = await page.evaluate(() => {
      closePanel();
      const t = facOf(game.sides[0].faction) === 'lastfist' ? 'rifle' : facOf(game.sides[0].faction) === 'bloomhost' ? 'skitterling' : 'shardling';
      for (let i = 0; i < 6; i++) spawnUnit(game, 0, t, rallyU(0) - 20 + i * 6, (i - 3) * 18);
      for (let i = 0; i < 30 * 3; i++) update(game, 1 / 30);
      const us = game.ents.filter(e => e.kind === 'u' && e.side === 0);
      return { rally: rallyU(0), hq: hqU(0), gun: BD(game.sides[0].faction, 'hq').gun[1].range, far: Math.max(...us.map(e => e.u)) };
    });
    await page.waitForTimeout(150);
    await shot('4-rally');
    assert.ok(r3.rally - r3.hq + 120 <= r3.gun && r3.far - r3.hq <= r3.gun, JSON.stringify(r3));
    assert.deepStrictEqual(errors, []);
    await page.close();
  });
}
