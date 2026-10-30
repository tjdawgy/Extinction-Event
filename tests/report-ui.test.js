// Post-match report screen (v2.9) in headless Chromium: nothing leaks during play, the layout at both phone sizes
// (tabs, the footer always reachable, opening at the top), copy and its fallback, the numbers on screen, saves.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');
const { readHtml } = require('./load-sim');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const SEEDED = 'Math.random = (() => { let a = 11; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();';
const PLAY = () => { // a real AI-vs-AI match to its end, then the report
  game = newGame('normal', { autoPlayer: true, autoDiff: 'normal', persona: 'turtle' }); game.countdown = 0; hideCountdown(); updateIntro(); running = true; paused = true;
  for (let i = 0; i < 30 * 1800 && !game.over; i++) update(game, 1 / 30);
  running = false; showEnd();
};

test('no leaks during play: the UI reads the match log only on the end screen, and no report shows while playing', { skip }, async () => {
  const html = readHtml(), ui = html.slice(html.indexOf('SIM END'));
  const from = ui.indexOf('// Post-match report (v2.9)'), to = ui.indexOf('/* ---------- Sound');
  const uses = [...ui.matchAll(/\b(game|g)\.log\b|logLines|logText|logMoments|repStats/g)].map(m => m.index);
  assert.ok(uses.length > 0 && uses.every(i => i > from && i < to), 'every read of the log in the UI is inside the report code');
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro(); paused = false;
    for (let i = 0; i < 30 * 240; i++) update(game, 1 / 30); // four minutes: the log is full of enemy moves by now
    refreshUI(true); render(ctx, game, game.t, null, -1);
    const txt = document.body.innerText;
    return { events: game.log.ev.filter(e => e[1] === 1).length, pane: !!document.getElementById('repPane'), leak: ['Copy match log', 'Key moments', 'Enemy behavior', 'Rifleman ×'].filter(w => txt.includes(w)) };
  });
  assert.ok(r.events > 5, 'the enemy\'s moves are being recorded');
  assert.strictEqual(r.pane, false);
  assert.deepStrictEqual(r.leak, []);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

for (const dev of [PHONE, NARROW]) {
  test(`report at ${dev.width}×${dev.height}: four tabs, opens at the top, Play again and Main menu always reachable`, { skip }, async () => {
    const { page, errors } = await openPage(browser, dev, { init: SEEDED });
    await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(PLAY);
    const check = () => page.evaluate(() => {
      const vis = id => { const el = document.getElementById(id), r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth && (hit === el || el.contains(hit)); };
      const tabs = [...document.querySelectorAll('#repTabs button')].map(b => { const r = b.getBoundingClientRect(); return r.right <= innerWidth && r.top >= 0; });
      return { again: vis('bAgain'), menu: vis('bMenu2'), tabs, h1: document.querySelector('#box h1').getBoundingClientRect().top >= 0, pane: $('repPane').scrollTop, box: $('box').scrollTop };
    });
    for (const t of ['Summary', 'Timeline', 'Key moments', 'Stats']) {
      await page.click(`#repTabs [data-t="${t}"]`);
      await page.evaluate(() => { $('repPane').scrollTop = 1e6; }); // even scrolled to the end
      const c = await check();
      assert.ok(c.again && c.menu, `${t}: footer buttons visible and tappable ${JSON.stringify(c)}`);
      assert.ok(c.tabs.every(Boolean) && c.h1 && c.box === 0, `${t}: header and tabs in view`);
    }
    await page.click('#repTabs [data-t="Summary"]');
    assert.strictEqual((await check()).pane, 0, 'a tab opens at its top');
    await page.click('#bAgain');
    assert.ok(await page.evaluate(() => !game.over && $('ov').classList.contains('hide')), 'Play again starts a match');
    assert.deepStrictEqual(errors, []);
    await page.close();
  });
}

test('the numbers and lines on screen are the recorded ones; Copy match log copies the same, with a fallback when the clipboard is blocked', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE, { init: SEEDED });
  await page.click('#bPlay'); await page.waitForTimeout(300);
  await page.evaluate(PLAY);
  const sum = await page.evaluate(() => {
    const T = game.log.tot, n = o => Object.values(o).reduce((a, b) => a + b, 0), cells = [...document.querySelectorAll('#repPane tr')].find(tr => tr.querySelector('th').textContent === 'Units built (lost)').querySelectorAll('td');
    return { shown: [cells[0].textContent, cells[1].textContent], want: [0, 1].map(s => `${n(T[s].trained)} (${n(T[s].lost)})`) };
  });
  for (const s of [0, 1]) assert.ok(sum.shown[s].startsWith(sum.want[s]), `units: "${sum.shown[s]}" starts with ${sum.want[s]}`);
  await page.click('#repTabs [data-t="Timeline"]');
  const tl = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('#repPane .tw > *')].slice(2), A = logLines(game, 0), B = logLines(game, 1), rows = [];
    for (let i = 0; i < cells.length; i += 4) rows.push([cells[i].textContent, cells[i + 1].textContent, cells[i + 2].textContent, cells[i + 3].textContent]);
    return { rows, want: Array.from({ length: Math.max(A.length, B.length) }, (_, i) => [A[i] ? mmss(A[i].t) : '', A[i] ? A[i].txt : '', B[i] ? mmss(B[i].t) : '', B[i] ? B[i].txt : '']) };
  });
  assert.deepStrictEqual(tl.rows, tl.want, 'each side its own list, in its own order, no empty rows in between');
  assert.ok(tl.rows.length <= 80 || tl.rows.length === tl.want.length);
  // copy: clipboard works
  await page.evaluate(() => { window.__copied = null; Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { window.__copied = t; return Promise.resolve(); } }, configurable: true }); });
  await page.click('#bCopy'); await page.waitForTimeout(100);
  const c1 = await page.evaluate(() => ({ same: window.__copied === repText(game), msg: $('copyMsg').textContent, text: window.__copied }));
  assert.ok(c1.same); assert.strictEqual(c1.msg, 'Copied');
  assert.match(c1.text, /^Extinction Event v\d+\.\d+(\.\d+)? · Normal · vs The Turtle\nResult: (Victory|Defeat|Draw)/);
  assert.match(c1.text, /\nTIMELINE\n\d\d:\d\d \[(ME|ENEMY)\] /);
  // copy: clipboard blocked (as some iPhone Safari cases): the text is shown selected
  await page.click('#repTabs [data-t="Timeline"]');
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('NotAllowedError')) }, configurable: true }); document.execCommand = () => false; });
  await page.click('#bCopy'); await page.waitForTimeout(100);
  const c2 = await page.evaluate(() => { const ta = document.querySelector('.cpy textarea'); return { ok: !!ta && ta.value === repText(game), sel: ta && ta.selectionStart === 0 && ta.selectionEnd === ta.value.length, focus: document.activeElement === ta }; });
  assert.ok(c2.ok && c2.sel && c2.focus, JSON.stringify(c2));
  await page.click('.cpy button'); assert.ok(await page.evaluate(() => !document.querySelector('.cpy')), 'Close removes it');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('the match log survives pause, saving and reloading the page', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(300);
  const before = await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (let i = 0; i < 30 * 200; i++) update(game, 1 / 30); pauseGame(); saveGame(); return JSON.stringify(game.log); });
  await page.reload(); await page.waitForTimeout(300);
  await page.click('#bResume'); await page.waitForTimeout(200);
  assert.strictEqual(await page.evaluate(() => JSON.stringify(game.log)), before);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
