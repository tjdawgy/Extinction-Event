// Bloomhost in headless Chromium (v2.17): the match setup menu (order, fit at both phone sizes, remembered choices), a
// match started as Bloomhost (names, cards, locked production upgrades, "Soon" abilities), and the enemy faction kept
// out of the UI until the match is over.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

for (const dev of [NARROW, PHONE]) {
  test(`setup menu at ${dev.width}x${dev.height}: Difficulty, You, Opponent; it fits without scrolling; choices are remembered`, { skip }, async () => {
    const { page, errors } = await openPage(browser, dev);
    const r = await page.evaluate(() => ({ labels: [...document.querySelectorAll('.setup .lbl')].map(x => x.textContent), me: [...$('meSeg').children].map(b => b.textContent), foe: [...$('foeSeg').children].map(b => b.textContent) }));
    assert.deepStrictEqual(r.labels, ['Difficulty', 'You', 'Opponent']);
    assert.deepStrictEqual(r.me, ['Last Fist', 'Bloomhost', 'Random']); assert.deepStrictEqual(r.foe, ['Last Fist', 'Bloomhost', 'Random']);
    await page.click('#diffSeg [data-d="hard"]'); await page.click('#meSeg [data-f="bloomhost"]'); await page.click('#foeSeg [data-f="random"]');
    const fit = await page.evaluate(() => { const b = $('box'), inView = el => { const q = el.getBoundingClientRect(); return q.top >= 0 && q.bottom <= innerHeight && q.left >= 0 && q.right <= innerWidth; }; return { scroll: b.scrollHeight - b.clientHeight, all: [...document.querySelectorAll('.setup button, #bPlay')].every(inView) }; });
    assert.ok(fit.scroll <= 1, `box scrolls by ${fit.scroll}px`); assert.ok(fit.all, 'every setup button and Start are on screen');
    await page.reload(); await page.waitForTimeout(300);
    const on = await page.evaluate(() => ['diffSeg', 'meSeg', 'foeSeg'].map(id => $(id).querySelector('.on').textContent));
    assert.deepStrictEqual(on, ['Hard', 'Bloomhost', 'Random']);
    assert.deepStrictEqual(errors, []);
    await page.close();
  });
}

test('a match as Bloomhost: names and cards, Train after a Larva Pit, production upgrades locked, abilities "Soon"', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#meSeg [data-f="bloomhost"]'); await page.click('#foeSeg [data-f="lastfist"]');
  await page.click('#bPlay'); await page.waitForTimeout(300);
  const toasts = () => page.evaluate(() => [...$('toasts').children].map(t => t.textContent));
  assert.ok((await toasts()).some(t => /You command Bloomhost: start with a Larva Pit and a Goremound/.test(t)));
  const r = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 5000; } refreshUI(true);
    return { fac: game.sides.map(s => s.faction), cards: [...$('cards').querySelectorAll('.card .nm')].map(x => x.textContent), abil: [...$('abil').children].map(b => b.querySelector('small').textContent) };
  });
  assert.deepStrictEqual(r.fac, ['bloomhost', 'lastfist']);
  assert.deepStrictEqual(r.cards, ['Goremound', 'Pulse Organ', 'Hatchery', 'Larva Pit', 'Maw', 'Evolution Chamber', 'Bloomspire']);
  assert.deepStrictEqual(r.abil, ['Soon', 'Soon', 'Soon']);
  await page.click('#abil .ab[data-k="frenzy"]');
  assert.ok((await toasts()).some(t => /Frenzy Bloom: Bloomhost commander abilities are coming soon/.test(t)));
  await page.click('.tabs [data-tab="train"]');
  assert.match(await page.textContent('#cards .trainHint'), /Build a Larva Pit to train units/);
  await page.evaluate(() => { tryBuild(game, 0, 'barracks'); for (const b of game.ents) if (b.type === 'barracks') { b.built = true; b.progress = 1; } refreshUI(false); });
  assert.deepStrictEqual(await page.$$eval('#cards .card', c => c.map(x => x.dataset.type)), ['skitterling']);
  await page.click('#cards .card[data-type="skitterling"]');
  assert.ok(await page.evaluate(() => game.ents.some(e => e.type === 'barracks' && e.queue.includes('skitterling'))));
  await page.evaluate(() => openPanel(game.ents.find(e => e.type === 'barracks')));
  const up = await page.evaluate(() => ({ name: $('bpName').textContent, txt: $('bpUp').textContent, dis: $('bpUp').disabled, pick: $('bpPick').classList.contains('hide') }));
  assert.deepStrictEqual(up, { name: 'Larva Pit', txt: 'Evolution paths coming soon', dis: true, pick: true });
  await page.evaluate(() => { for (let i = 0; i < 30 * 20; i++) update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); refreshUI(true); });
  assert.ok(await page.evaluate(() => game.ents.some(e => e.type === 'skitterling' && e.side === 0)), 'a Skitterling hatched');
  // v2.18: Bloomhost units appear in the Army tab's groups and types
  await page.evaluate(() => { for (const t of ['bulwark', 'razorwing']) spawnUnit(game, 0, t, hqPos(0).u + 220, 0); closePanel(); });
  await page.click('.tabs [data-tab="army"]'); await page.waitForTimeout(700);
  const chips = await page.$$eval('#asel .chip', c => c.map(x => x.dataset.k));
  for (const k of ['g:inf', 'g:arm', 'g:air', 't:skitterling', 't:bulwark', 't:razorwing']) assert.ok(chips.includes(k), `${k} in ${chips}`);
  assert.doesNotMatch(await page.textContent('#asel'), /undefined/);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('the enemy faction stays out of the UI during the match (no name, toast or log); the end screen reveals both', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#meSeg [data-f="lastfist"]'); await page.click('#foeSeg [data-f="bloomhost"]');
  await page.click('#bPlay'); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro(); game.sides[0].aiT = 1e9;
    const said = [], tt = toast; window.toast = (m, k) => { said.push(m); return tt(m, k); };
    for (let i = 0; i < 30 * 150; i++) { update(game, 1 / 30); handleEvents(); if (i % 30 === 0) { render(ctx, game, game.t, sel, selPad); refreshUI(false); } const h = game.sides[0].hq; h.hp = h.maxHp; }
    for (const tab of ['build', 'train', 'army']) document.querySelector(`.tabs [data-tab="${tab}"]`).click();
    return { said, body: document.body.innerText, aria: [...document.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')).join(' '), enemyBuilt: game.ents.filter(e => e.side === 1 && e.kind === 'b').length };
  });
  assert.ok(r.enemyBuilt > 3, 'the enemy built its base');
  const leak = /Bloomhost|Hive|Goremound|Pulse Organ|Hatchery|Larva Pit|Evolution Chamber|Maw\b|Bloomspire|Skitterling|Bulwark|Razorwing/;
  assert.ok(!r.said.some(m => leak.test(m)), `toasts: ${r.said.filter(m => leak.test(m))}`);
  assert.ok(!leak.test(r.body) && !leak.test(r.aria), 'nothing on screen names the enemy faction');
  await page.evaluate(() => { paused = false; kill(game, game.sides[1].hq, 0); for (const b of game.ents) if (b.side === 1 && b.kind === 'b') b.shielded = false; update(game, 1 / 30); });
  await page.waitForFunction(() => !$('ov').classList.contains('hide') && /Victory|Defeat/.test($('box').textContent), null, { timeout: 8000 });
  assert.match(await page.textContent('#box p.sub'), /Last Fist vs Bloomhost/);
  assert.match(await page.evaluate(() => logText(game, { version: VERSION, diff: 'Normal', persona: 'x', result: 'Victory' })), /Factions: you Last Fist, enemy Bloomhost/);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
