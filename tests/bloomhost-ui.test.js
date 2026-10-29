// Bloomhost in headless Chromium (v2.17): the match setup menu (order, fit at both phone sizes, remembered choices), a
// match started as Bloomhost (names, cards, path pickers, its own abilities), and the enemy faction kept
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
    assert.deepStrictEqual(r.me, ['Last Fist', 'Bloomhost', 'Axiarchs', 'Random']); assert.deepStrictEqual(r.foe, ['Last Fist', 'Bloomhost', 'Axiarchs', 'Random']);
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

test('a match as Bloomhost: names and cards, Train after a Larva Pit, Larva Pit and Bloomspire path pickers (v2.21), its own three abilities (v2.20)', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#meSeg [data-f="bloomhost"]'); await page.click('#foeSeg [data-f="lastfist"]');
  await page.click('#bPlay'); await page.waitForTimeout(300);
  const toasts = () => page.evaluate(() => [...$('toasts').children].map(t => t.textContent));
  assert.ok((await toasts()).some(t => /You command Bloomhost: start with a Larva Pit and a Goremound/.test(t)));
  const r = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 5000; } refreshUI(true);
    return { fac: game.sides.map(s => s.faction), cards: [...$('cards').querySelectorAll('.card .nm')].map(x => x.textContent), abil: [...$('abil').children].map(b => b.dataset.k) };
  });
  assert.deepStrictEqual(r.fac, ['bloomhost', 'lastfist']);
  assert.deepStrictEqual(r.cards, ['Goremound', 'Pulse Organ', 'Hatchery', 'Larva Pit', 'Maw', 'Evolution Chamber', 'Bloomspire']);
  assert.deepStrictEqual(r.abil, ['frenzy', 'brood', 'corrosive']);
  await page.click('#abil .ab[data-k="frenzy"]');
  assert.ok((await toasts()).some(t => /Frenzy Bloom is ready in/.test(t)), 'its first cooldown, like Last Fist');
  await page.click('.tabs [data-tab="train"]');
  assert.match(await page.textContent('#cards .trainHint'), /Build a Larva Pit to train units/);
  await page.evaluate(() => { tryBuild(game, 0, 'barracks'); for (const b of game.ents) if (b.type === 'barracks') { b.built = true; b.progress = 1; } refreshUI(false); });
  assert.deepStrictEqual(await page.$$eval('#cards .card', c => c.map(x => x.dataset.type)), ['skitterling']);
  await page.click('#cards .card[data-type="skitterling"]');
  assert.ok(await page.evaluate(() => game.ents.some(e => e.type === 'barracks' && e.queue.includes('skitterling'))));
  await page.evaluate(() => openPanel(game.ents.find(e => e.type === 'barracks')));
  const up = await page.evaluate(() => ({ name: $('bpName').textContent, txt: $('bpUp').textContent, dis: $('bpUp').disabled, pick: $('bpPick').classList.contains('hide') }));
  assert.deepStrictEqual({ name: up.name, pick: up.pick }, { name: 'Larva Pit', pick: false }, 'v2.19: the Larva Pit picks a path');
  assert.match(await page.textContent('#bpPick [data-p="A"]'), /Predatory Evolution.*Leapers.*Ravagers/);
  assert.match(await page.textContent('#bpPick [data-p="B"]'), /Acidic Evolution.*Spitters.*Bilecasters/);
  await page.evaluate(() => { tryBuild(game, 0, 'techlab'); for (const b of game.ents) if (b.type === 'techlab') { b.built = true; b.progress = 1; } openPanel(game.ents.find(e => e.type === 'techlab')); });
  const sp = await page.evaluate(() => ({ name: $('bpName').textContent, txt: $('bpUp').textContent, dis: $('bpUp').disabled, pick: $('bpPick').classList.contains('hide') }));
  assert.deepStrictEqual({ name: sp.name, pick: sp.pick }, { name: 'Bloomspire', pick: false }, 'v2.21: the Bloomspire picks a path');
  assert.match(await page.textContent('#bpPick [data-p="A"]'), /Swarm Bloom.*Needlewings.*Cloudwings/);
  assert.match(await page.textContent('#bpPick [data-p="B"]'), /Apex Bloom.*Brood Tyrants.*Worldrenders/);
  await page.evaluate(() => openPanel(game.ents.find(e => e.type === 'barracks')));
  await page.evaluate(() => { for (let i = 0; i < 30 * 20; i++) update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); refreshUI(true); });
  assert.ok(await page.evaluate(() => game.ents.some(e => e.type === 'skitterling' && e.side === 0)), 'a Skitterling hatched');
  // v2.18: Bloomhost units appear in the Army tab's groups and types
  await page.evaluate(() => { for (const t of ['bulwark', 'razorwing']) spawnUnit(game, 0, t, hqPos(0).u + 220, 0); closePanel(); });
  await page.click('.tabs [data-tab="army"]'); await page.waitForTimeout(700);
  const chips = await page.$$eval('#asel .chip', c => c.map(x => x.dataset.k));
  for (const k of ['g:inf', 'g:arm', 'g:air', 't:skitterling', 't:bulwark', 't:razorwing']) assert.ok(chips.includes(k), `${k} in ${chips}`);
  assert.doesNotMatch(await page.textContent('#asel'), /undefined/);
  // v2.19: every unit of both factions has a sprite, an info card, a group and a name (catches a unit missing anywhere)
  const missing = await page.evaluate(() => Object.keys(UDEF).filter(t => !DRAW_U[t] || !UNIT_TIPS[t] || !GROUP_OF[t] || !PLURAL[t] || !SIGHT[t] || (!UDEF[t].air && !SPR_BOX[t] && UDEF[t].fac) || (UDEF[t].shp && !UDEF[t].fac)));
  assert.deepStrictEqual(missing, []);
  const icons = await page.evaluate(() => { const bad = []; for (const t of Object.keys(UDEF)) { try { drawIcon(document.createElement('canvas'), 'u', t); showInfo('u', t); } catch (e) { bad.push(t + ': ' + e.message); } } hideInfo(); return bad; });
  assert.deepStrictEqual(icons, []);
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

test('v2.20: Bloomhost abilities cast through the buttons (tap, place, confirm); enemy Bloomhost casts in the fog show nothing, in view they do', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#meSeg [data-f="bloomhost"]'); await page.click('#foeSeg [data-f="bloomhost"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
  const at = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro(); game.t = 300;
    for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 5000; s.hq.tier = 2; }
    for (let i = 0; i < 4; i++) { const e = spawnUnit(game, 0, 'skitterling', 500 + i * 12, 0); e.holdU = e.u; e.holdV = 0; }
    update(game, 1 / 30); cam.x = 560; clampCam(); refreshUI(true);
    window.__xy = u => { const w = P(u, -60); return { x: V.cw / 2 + (w.x - cam.x) * V.S, y: V.A + (w.y - Y_BOT) * V.S }; };
    return [__xy(510), __xy(620)]; // taps at depth -60: the targeting banner sits low in the middle of a 667-wide screen
  });
  const cast = async (k, p) => {
    await page.evaluate(() => { for (const k2 in game.sides[0].ab) game.sides[0].ab[k2] = 0; refreshUI(true); });
    await page.click(`#abil .ab[data-k="${k}"]`); await page.mouse.click(p.x, p.y); await page.mouse.click(p.x + 3, p.y);
    return page.evaluate(k2 => game.sides[0].abK === k2 && game.sides[0].abEnd > game.t, k); // the game keeps running: a Frenzy Bloom's ring is gone after 0.6 s
  };
  assert.ok(await cast('frenzy', at[0]), 'Frenzy Bloom cast');
  assert.ok(await page.evaluate(() => game.ents.filter(e => e.side === 0 && e.frzT > game.t).length === 4));
  assert.ok(await cast('brood', at[1]), 'Emergency Brood cast');
  await page.evaluate(() => { for (let i = 0; i < 70; i++) update(game, 1 / 30); });
  assert.ok(await page.evaluate(() => game.ents.filter(e => e.side === 0 && e.temp).length === 5), 'the pod hatched');
  await page.evaluate(() => { game.fog[0].exp.fill(1); const e = spawnUnit(game, 1, 'rifle', 640, 0); e.holdU = 640; e.holdV = 0; e.cd = 1e6; update(game, 1 / 30); });
  assert.ok(await cast('corrosive', await page.evaluate(() => __xy(640))), 'Corrosive Bloom cast');
  // the enemy (also Bloomhost) casts all three where the player can't see: no sound, no toast, nothing drawn
  const r = await page.evaluate(() => {
    paused = true; for (const e of game.ents) { e.cd = 1e6; if (e.kind === 'u') e.hp = e.maxHp = 1e6; } game.projs.length = 0; // no shots, impacts or deaths in view (the Hive's gun, shells in flight, the player's spore cloud): only the casts can make a sound
    update(game, 1 / 30); render(ctx, game, game.t, null, -1); // earlier shots and the player's own casts are registered first
    const calls = []; const sf = sfx; window.sfx = (n, x) => { calls.push(n); return sf(n, x); };
    const tt = toast; window.toast = (m, k) => { calls.push('toast:' + m); return tt(m, k); };
    const F = game.fog[0], lit = u => F.vis[cellOf(u)] === 1, hidden = 1300; game.fog[1].vis.fill(1); game.fog[1].exp.fill(1);
    const e = spawnUnit(game, 1, 'skitterling', hidden, 0); e.holdU = hidden; e.holdV = 0;
    const ok = ['frenzy', 'brood', 'corrosive'].map(k => { for (const k2 in game.sides[1].ab) game.sides[1].ab[k2] = 0; return useAbility(game, 1, k, hidden + (k === 'brood' ? -80 : 0), 0).ok; });
    for (let i = 0; i < 20; i++) { update(game, 1 / 30); render(ctx, game, game.t, null, -1); }
    const hiddenCalls = calls.slice(), hiddenSeen = game.abil.filter(a => a.side === 1 && abilSeen(a, lit)).length;
    // the same casts in the player's view show and sound
    for (const k2 in game.sides[1].ab) game.sides[1].ab[k2] = 0; const okV = useAbility(game, 1, 'corrosive', 600, 0).ok;
    for (let i = 0; i < 5; i++) { update(game, 1 / 30); render(ctx, game, game.t, null, -1); }
    return { ok, hiddenCalls, hiddenSeen, okV, seenNow: game.abil.filter(a => a.side === 1 && abilSeen(a, lit)).length, calls: calls.slice(hiddenCalls.length) };
  });
  assert.deepStrictEqual(r.ok, [true, true, true]);
  assert.deepStrictEqual(r.hiddenCalls, [], 'no sound or toast from casts in the fog');
  assert.strictEqual(r.hiddenSeen, 0);
  assert.ok(r.okV && r.seenNow >= 1 && r.calls.length > 0, JSON.stringify(r));
  assert.deepStrictEqual(errors, []);
  await page.close();
});
