// The tutorial (v2.46) in a real browser at iPhone landscape size. Chapters are played with real input: an explaining step
// is closed with Next; an action step is done by tapping the middle of what the tutorial highlights (or dragging the field),
// so the highlight, the bubble placement and the game-event checks are all exercised. Also: Chapter Select and its
// checkmarks (kept across a reload), the mid-match confirm, Skip ▸ / Skip Chapter / End Tutorial at every step, the Codex
// links and Back to Tutorial, the 8 s Next fallback, the first-launch prompt, and a normal match afterwards.
// Screenshots go to tests/screenshots/tutorial-*.png.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright(), skip = !pw && 'Playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const OUT = path.join(__dirname, 'screenshots');
const CHAPTERS = ['controls', 'economy', 'building', 'army', 'upgrades', 'combat', 'factions'];

const state = page => page.evaluate(() => {
  const st = tCur(), r = e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
  return { on: TUT.on, ch: TUT.ch, step: TUT.step, act: !!(st && st.act), hold: TUT.hold, B: r($('tutB')), hi: $('tutHi').classList.contains('hide') ? null : r($('tutHi')),
    hud: $('hud').getBoundingClientRect().bottom, next: !$('tutNext').classList.contains('hide'), shown: !$('tutB').classList.contains('hide') };
});
// The bubble never covers the highlight and never reaches into the top strip (it stays below the top bar)
function checkPlacement(s, where) {
  assert.ok(s.shown, `${where}: bubble shown`);
  assert.ok(s.B.t >= s.hud - 0.5, `${where}: bubble below the top bar (${s.B.t} vs ${s.hud})`);
  if (s.hi) assert.ok(!(s.B.l < s.hi.r && s.hi.l < s.B.r && s.B.t < s.hi.b && s.hi.t < s.B.b), `${where}: bubble clear of the highlight ${JSON.stringify(s)}`);
}
// Plays the current chapter to its end with real input. Returns the number of steps seen.
async function playChapter(page, ch) {
  let seen = 0, guard = 0;
  while (guard++ < 400) {
    const s = await state(page);
    if (!s.on || s.ch !== ch) return seen;
    seen++;
    checkPlacement(s, `${CHAPTERS[ch]} step ${s.step}`);
    if (!s.act) { await page.click('#tutNext'); await page.waitForTimeout(80); continue; }
    const t0 = Date.now(), step = s.step;
    while (Date.now() - t0 < 120000) {
      const n = await state(page);
      if (!n.on || n.ch !== ch || n.step !== step) break;
      const kind = await page.evaluate(() => { const st = tCur(); return st.hi === tField && TUT.ch === 0 && TUT.step === 1 ? 'drag' : ''; });
      if (kind === 'drag') { const x = (n.hi.l + n.hi.r) / 2, y = (n.hi.t + n.hi.b) / 2; await page.mouse.move(x + 90, y); await page.mouse.down(); await page.mouse.move(x - 90, y + 2, { steps: 8 }); await page.mouse.up(); } // drag inside the highlighted field
      else if (await page.evaluate(() => !!document.querySelector('#bpPick:not(.hide)') && tCur().hi().el === $('bpPick'))) await page.click('#bpPick [data-p="A"]');
      else if (n.hi) await page.mouse.click((n.hi.l + n.hi.r) / 2, (n.hi.t + n.hi.b) / 2);
      await page.waitForTimeout(450);
    }
    const after = await state(page);
    assert.ok(!after.on || after.ch !== ch || after.step !== step, `${CHAPTERS[ch]} step ${step} completed by its action`);
  }
  throw new Error('chapter did not end');
}
const openHow = async page => { await page.click('#bCodex'); await page.click('#cxTabs [data-t="how"]'); };
const howShown = page => page.evaluate(() => CX.open && CX.tab === 'how' && !!document.querySelector('#cxTabs [data-t="how"].on') && !!$('cx-tut-controls'));

test('Chapter Select: all 7 chapters launch from How to Play and play start to finish; checkmarks survive a reload', { skip, timeout: 600000 }, async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { page, errors } = await openPage(browser, PHONE);
  await openHow(page);
  assert.deepStrictEqual(await page.evaluate(() => [...document.querySelectorAll('.cxch')].map(e => [e.id, !!e.querySelector('.cxplay'), e.classList.contains('done')])),
    CHAPTERS.map(k => [`cx-tut-${k}`, true, false]));
  await page.screenshot({ path: path.join(OUT, 'tutorial-how.png') });
  const counts = {};
  for (let i = 0; i < CHAPTERS.length; i++) {
    await page.click(`#cx-tut-${CHAPTERS[i]} .cxplay`); await page.waitForTimeout(150);
    assert.deepStrictEqual(await page.evaluate(() => [TUT.on, TUT.ch, TUT.step, !!game.tut, CX.open]), [true, i, 0, true, false]);
    await page.evaluate(() => { speed = 3; });
    await page.screenshot({ path: path.join(OUT, `tutorial-${CHAPTERS[i]}.png`) });
    counts[CHAPTERS[i]] = await playChapter(page, i);
    assert.ok(await howShown(page), `${CHAPTERS[i]}: back on How to Play`);
    assert.ok(await page.evaluate(k => $('cx-tut-' + k).classList.contains('done'), CHAPTERS[i]), `${CHAPTERS[i]}: checkmark`);
  }
  console.log('# steps played per chapter:', JSON.stringify(counts));
  await page.reload(); await page.waitForTimeout(300);
  await openHow(page);
  assert.deepStrictEqual(await page.evaluate(() => [...document.querySelectorAll('.cxch')].map(e => e.classList.contains('done'))), CHAPTERS.map(() => true), 'checkmarks after a reload');
  await page.screenshot({ path: path.join(OUT, 'tutorial-how-done.png') });
  assert.deepStrictEqual(errors, []);
});

for (const dev of [PHONE, NARROW]) test(`Skip ▸, Skip Chapter and End Tutorial work at every step of every chapter (${dev.width}x${dev.height}; bubble placement checked at each)`, { skip, timeout: 600000 }, async () => {
  const { page, errors } = await openPage(browser, dev);
  const n = await page.evaluate(() => TUT_CH.map(C => C.steps.length));
  const start = async (i, k) => { await page.evaluate(i => tutStart(i, true), i); for (let j = 0; j < k; j++) { if (!(await state(page)).on) return false; await page.click('#tutSkip'); } const s = await state(page); return s.on && s.ch === i ? s : false; };
  for (let i = 0; i < n.length; i++) for (let k = 0; k < n[i]; k++) {
    let s = await start(i, k); if (!s) continue; // a step skipped over by its own rule (skipIf)
    const at = `chapter ${i} step ${s.step}`;
    checkPlacement(s, at);
    // Skip ▸: the next step, or the end of the chapter (back to How to Play)
    await page.click('#tutSkip'); await page.waitForTimeout(30);
    const a = await state(page);
    if (a.on) { assert.strictEqual(a.ch, i, at); assert.ok(a.step > s.step && a.shown, at); } else assert.ok(await howShown(page), `${at}: skip at the end goes to How to Play`);
    // Skip Chapter: the next chapter's first step (after the last: How to Play)
    s = await start(i, k);
    await page.click('#tutSkipC'); await page.waitForTimeout(30);
    const b = await state(page);
    if (i + 1 < n.length) assert.ok(b.on && b.ch === i + 1 && b.step === 0 && b.shown && (await page.evaluate(() => !!game.tut && game.t < 1)), `${at}: Skip Chapter`);
    else assert.ok(!b.on && await howShown(page), `${at}: Skip Chapter after the last chapter goes to How to Play`);
    // End Tutorial from the pause menu
    s = await start(i, k);
    await page.click('#bPause'); await page.click('#bEndTut'); await page.waitForTimeout(30);
    assert.ok(!(await state(page)).on && await howShown(page) && await page.evaluate(() => game === null && $('tutB').classList.contains('hide')), `${at}: End Tutorial`);
    await page.click('#cxX');
  }
  assert.deepStrictEqual(errors, []);
});

test('starting a chapter mid-match asks first; Cancel returns to the paused match untouched; Yes starts the tutorial', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(200);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); for (const s of game.sides) s.aiT = 1e9; });
  await page.waitForTimeout(500);
  await page.click('#bPause');
  const before = await page.evaluate(() => { window.__g = game; return { t: game.t, menu: $('box').innerHTML, save: localStorage.getItem('colonyMobile.save') }; });
  await page.click('#bCodex'); await page.click('#cxTabs [data-t="how"]'); await page.click('#cx-tut-building .cxplay');
  assert.match(await page.textContent('#cxModal'), /Leave this match and start the tutorial\?/);
  await page.screenshot({ path: path.join(OUT, 'tutorial-confirm.png') });
  await page.click('#cxNo'); await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({ same: window.__g === game, t: game.t, paused, tut: !!game.tut, cx: CX.open, menu: $('box').innerHTML, ov: !$('ov').classList.contains('hide'), on: TUT.on }));
  assert.deepStrictEqual(after, { same: true, t: before.t, paused: true, tut: false, cx: false, menu: before.menu, ov: true, on: false });
  await page.click('#bCodex'); await page.click('#cxTabs [data-t="how"]'); await page.click('#cx-tut-building .cxplay'); await page.click('#cxYes'); await page.waitForTimeout(150);
  assert.deepStrictEqual(await page.evaluate(() => [TUT.on, TUT.ch, !!game.tut, window.__g !== game]), [true, 2, true, true]);
  assert.strictEqual(await page.evaluate(() => localStorage.getItem('colonyMobile.save')), before.save, 'the real match stays saved');
  assert.deepStrictEqual(errors, []);
});

test('Codex links open the right spot; Back to Tutorial resumes the same step, still paused', { skip, timeout: 180000 }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  const linkCheck = async (want, tabKey) => {
    const s0 = await page.evaluate(() => ({ step: TUT.step, t: game.t }));
    await page.click('#tutCodex'); await page.waitForTimeout(200);
    const r = await page.evaluate(id => { const el = $(id), b = $('cxBody').getBoundingClientRect(), e = el.getBoundingClientRect(); return { open: CX.open, tab: CX.tab, inView: e.top >= b.top - 1 && e.top < b.bottom - 40, back: $('cxX').textContent }; }, want);
    assert.deepStrictEqual(r, { open: true, tab: tabKey, inView: true, back: 'Back to Tutorial' }, want);
    await page.waitForTimeout(400);
    await page.click('#cxX'); await page.waitForTimeout(400);
    const s1 = await page.evaluate(() => ({ step: TUT.step, t: game.t, hold: TUT.hold, on: TUT.on, shown: !$('tutB').classList.contains('hide'), cx: CX.open }));
    assert.deepStrictEqual(s1, { step: s0.step, t: s0.t, hold: true, on: true, shown: true, cx: false }, 'back at the same step, the match still held');
  };
  // Army: See stats opens the first trained troop
  await page.evaluate(() => tutStart(3, true));
  await page.click('.tabs [data-tab="train"]'); await page.waitForTimeout(300);
  await page.click('#cards .card[data-type="rifle"]'); await page.waitForTimeout(400);
  assert.strictEqual(await page.evaluate(() => tCur().codex && tCur().codex.label), 'See stats');
  await linkCheck('cx-u-rifle', 'lastfist');
  // Upgrades: View in Codex opens the tree of the building just upgraded
  await page.evaluate(() => tutStart(4, true)); await page.waitForTimeout(100);
  const bh = await state(page); await page.mouse.click((bh.hi.l + bh.hi.r) / 2, (bh.hi.t + bh.hi.b) / 2); await page.waitForTimeout(400);
  await page.click('#tutNext'); await page.waitForTimeout(100);
  await page.click('#bpPick [data-p="A"]'); await page.waitForTimeout(400);
  await page.click('#bpUp'); await page.waitForTimeout(100);
  if (!(await page.evaluate(() => tMy('barracks').upgrading))) await page.click('#bpUp'); // a costly upgrade takes a confirming second tap
  await page.waitForTimeout(400);
  assert.strictEqual(await page.evaluate(() => tCur().codex && tCur().codex.label), 'View in Codex');
  await linkCheck('cx-t-barracks', 'lastfist');
  await page.screenshot({ path: path.join(OUT, 'tutorial-codex-back.png') });
  // Factions: the last step opens the Codex on the Last Fist tab
  await page.evaluate(() => tutStart(6, true));
  for (let i = 0; i < 4; i++) await page.click('#tutNext');
  await page.click('#tutCodex'); await page.waitForTimeout(200);
  assert.deepStrictEqual(await page.evaluate(() => [CX.open, CX.tab, TUT.on, $('cxX').textContent, tutDone().factions]), [true, 'lastfist', false, 'Close', 1]);
  assert.deepStrictEqual(errors, []);
});

test('an action step shows Next after 8 seconds; Next moves on', { skip, timeout: 60000 }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.evaluate(() => tutStart(0, true));
  await page.click('#tutNext'); // to the camera step (an action)
  assert.deepStrictEqual(await page.evaluate(() => [TUT.step, !!tCur().act, $('tutNext').classList.contains('hide')]), [1, true, true]);
  await page.waitForTimeout(7000);
  assert.ok(await page.evaluate(() => $('tutNext').classList.contains('hide')), 'not yet at 7 s');
  await page.waitForTimeout(1600);
  assert.ok(await page.evaluate(() => !$('tutNext').classList.contains('hide')), 'Next after 8 s');
  await page.click('#tutNext');
  assert.strictEqual(await page.evaluate(() => TUT.step), 2);
  assert.deepStrictEqual(errors, []);
});

test('first launch: the tutorial prompt (Skip remembered across a reload; Play starts Chapter 1)', { skip }, async () => {
  let { page, errors } = await openPage(browser, PHONE, { firstRun: true });
  assert.match(await page.textContent('#box'), /New here\?[\s\S]*Play the tutorial\?/);
  await page.screenshot({ path: path.join(OUT, 'tutorial-first-launch.png') });
  await page.click('#bTutSkip'); await page.waitForTimeout(100);
  assert.ok(await page.evaluate(() => !!$('bPlay') && JSON.parse(localStorage.getItem('extinctionEvent.tutorial')).seen === 1));
  await page.reload(); await page.waitForTimeout(300);
  assert.ok(await page.evaluate(() => !!$('bPlay') && !document.querySelector('#bTutPlay')), 'no prompt after a reload');
  assert.deepStrictEqual(errors, []);
  ({ page, errors } = await openPage(browser, PHONE, { firstRun: true }));
  await page.click('#bTutPlay'); await page.waitForTimeout(150);
  assert.deepStrictEqual(await page.evaluate(() => [TUT.on, TUT.ch, TUT.step]), [true, 0, 0]);
  // storage that throws: the game still runs and the tutorial still starts
  ({ page, errors } = await openPage(browser, PHONE, { firstRun: true, init: () => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); } }));
  assert.match(await page.textContent('#box'), /New here\?/);
  await page.click('#bTutPlay'); await page.waitForTimeout(150);
  assert.deepStrictEqual(await page.evaluate(() => [TUT.on, TUT.ch]), [true, 0]);
  assert.deepStrictEqual(errors, []);
});

test('a normal match after the tutorial plays as before: no tutorial state, enemy AI on, storm on, saved', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.evaluate(() => tutStart(5, true));
  await page.click('#tutNext'); await page.waitForTimeout(300);
  await page.click('#bPause'); await page.click('#bEndTut'); await page.click('#cxX');
  await page.click('#bPlay'); await page.waitForTimeout(200);
  const r = await page.evaluate(() => { game.countdown = 0; const ai = game.sides[1].aiT; for (let i = 0; i < 300; i++) update(game, 1 / 30); saveGame();
    return { tut: game.tut, noStorm: game.noStorm, on: TUT.on, hold: TUT.hold, bubble: $('tutB').classList.contains('hide'), ring: $('tutHi').classList.contains('hide'), aiOn: ai < 1e6, saved: !!localStorage.getItem('colonyMobile.save'),
      enemyBuilt: game.ents.filter(e => e.kind === 'b' && e.side === 1).length, factions: game.sides.map(s => s.faction) }; });
  assert.deepStrictEqual({ ...r, enemyBuilt: r.enemyBuilt > 1, factions: undefined }, { tut: undefined, noStorm: undefined, on: false, hold: false, bubble: true, ring: true, aiOn: true, saved: true, enemyBuilt: true, factions: undefined });
  // the match runs in the frame loop (not held), and the storm is on in a normal match
  const t0 = await page.evaluate(() => game.t); await page.waitForTimeout(500);
  assert.ok(await page.evaluate(t => game.t > t, t0));
  assert.ok(await page.evaluate(() => { game.t = EXT.start + 1; const b = game.sides[1].hq, hp = b.hp; update(game, 1); return b.hp < hp; }), 'the storm hurts buildings again');
  assert.deepStrictEqual(errors, []);
});
