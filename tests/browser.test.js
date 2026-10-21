// UI checks in headless Chromium at iPhone landscape size (safe areas simulated).
// Skips itself when Playwright isn't installed.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

test('title screen: name and version', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  assert.strictEqual(await page.title(), 'Extinction Event');
  assert.match(await page.textContent('#box h1'), /Extinction\s*Event/);
  assert.match(await page.textContent('#box .ver'), /^v\d+\.\d+$/);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('match start: wide view, GET READY 3-2-1, GO; taps wait for GO', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay');
  await page.waitForTimeout(300);
  const intro = await page.evaluate(() => ({ zoom: V.zoom, cd: game.countdown, label: document.querySelector('#cd small').textContent, hidden: $('cd').classList.contains('hide') }));
  assert.ok(intro.zoom < 1 && !intro.hidden && intro.cd > 3, 'zoomed out to show both bases');
  await page.click('#cards .card[data-type="barracks"]');
  await page.waitForFunction(() => game.countdown > 0 && game.countdown <= 3);
  const mid = await page.evaluate(() => ({ t: game.t, label: document.querySelector('#cd small').textContent, big: document.querySelector('#cd b').textContent,
    barracks: game.ents.filter(e => e.type === 'barracks').map(b => b.progress), credits: game.sides[0].res.c, aiB: game.ents.filter(e => e.side === 1 && e.kind === 'b').length }));
  assert.strictEqual(mid.t, 0);
  assert.strictEqual(mid.label, 'GET READY');
  assert.match(mid.big, /^[123]$/);
  assert.deepStrictEqual(mid.barracks, [], 'nothing queued during the countdown');
  assert.strictEqual(mid.credits, 300, 'nothing paid, no income yet');
  assert.ok((await page.evaluate(() => [...$('toasts').children].map(t => t.textContent))).includes('Wait for GO'));
  assert.strictEqual(mid.aiB, 1, 'AI has not built');
  await page.waitForFunction(() => document.querySelector('#cd b').textContent === 'GO!', null, { timeout: 4000 });
  const go = await page.evaluate(() => ({ zoom: V.zoom, cd: game.countdown }));
  assert.deepStrictEqual(go, { zoom: 1, cd: 0 });
  await page.waitForTimeout(1200);
  await page.click('#cards .card[data-type="barracks"]');
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => ({ t: game.t, p: game.ents.find(e => e.type === 'barracks' && e.side === 0).progress, hidden: $('cd').classList.contains('hide') }));
  assert.ok(after.t > 0.8 && after.p > 0 && after.hidden, 'clock runs and building works after GO');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('HQ readouts in the top bar: shielded, exposed, destroyed', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay');
  await page.evaluate(() => { game.countdown = 0; tryBuild(game, 0, 'refinery'); update(game, 1 / 30); refreshUI(true); });
  const read = () => page.evaluate(() => [0, 1].map(k => ({ cls: $('hq' + k).className, txt: $('hq' + k).querySelector('small').textContent, w: $('hq' + k).querySelector('.hb i').style.width, aria: $('hq' + k).getAttribute('aria-label') })));
  let r = await read();
  assert.strictEqual(r[0].cls, 'hqr shielded'); assert.strictEqual(r[0].txt, 'Shielded');
  assert.strictEqual(r[1].cls, 'hqr exposed stale', 'enemy HQ is out of sight: last-known values');
  assert.match(r[1].aria, /^Enemy HQ: last seen with 2800 of 2800 HP, exposed$/);
  assert.strictEqual(r[1].txt, 'Last seen');
  await page.evaluate(() => { const hq = game.sides[1].hq; hq.hp = hq.maxHp / 4; refreshUI(true); });
  r = await read();
  assert.strictEqual(parseFloat(r[1].w), 100, 'damage out of sight does not leak');
  await page.evaluate(() => { updateVision = (orig => g => { orig(g); g.fog[0].vis.fill(1); })(updateVision); updateVision(game); refreshUI(true); }); // put it in view
  r = await read();
  assert.ok(Math.abs(parseFloat(r[1].w) - 25) < 1, `in view: real health (${r[1].w}, plus a moment of self-repair)`);
  assert.strictEqual(r[1].cls, 'hqr exposed');
  await page.evaluate(() => { kill(game, game.sides[1].hq, 0); refreshUI(true); });
  r = await read();
  assert.strictEqual(r[1].cls, 'hqr destroyed'); assert.strictEqual(r[1].txt, 'Destroyed'); assert.strictEqual(parseFloat(r[1].w), 0);
  // the world HQ bar is drawn below the top bar
  const bar = await page.evaluate(() => { const hq = game.sides[0].hq, barMin = (V.ft - V.A) / V.S + Y_BOT + 12 / V.S, y = Math.max(bTop(hq) - 8, barMin); return { y: (y - Y_BOT) * V.S + V.A, hudBottom: $('hud').getBoundingClientRect().bottom }; });
  assert.ok(bar.y - 8 >= bar.hudBottom, `world bar and pips (${bar.y}) clear the top bar (${bar.hudBottom})`);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('two-tap Sell refunds 50%', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay');
  await page.evaluate(() => { game.countdown = 0; tryBuild(game, 0, 'barracks'); for (let i = 0; i < 450; i++) update(game, 1 / 30); openPanel(game.ents.find(e => e.type === 'barracks' && e.side === 0)); });
  const c0 = await page.evaluate(() => game.sides[0].res.c);
  await page.click('#bpSell');
  assert.strictEqual(await page.textContent('#bpSell'), 'Tap to confirm');
  assert.ok(await page.evaluate(() => game.ents.some(e => e.type === 'barracks' && e.side === 0 && e.hp > 0)), 'first tap only arms');
  await page.click('#bpSell');
  const r = await page.evaluate(() => ({ c: game.sides[0].res.c, gone: !game.ents.some(e => e.type === 'barracks' && e.side === 0 && e.hp > 0), toasts: [...$('toasts').children].map(t => t.textContent) }));
  assert.ok(r.gone);
  assert.ok(r.toasts.includes('Barracks sold for 75 credits'), 'refund is half of 150');
  assert.ok(r.c - c0 >= 75 && r.c - c0 < 80, `refund 75 plus income earned between the taps: ${r.c - c0}`);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('saves use colonyMobile.save / colonyMobile.diff; a restored match starts paused', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#diffSeg [data-d="hard"]');
  await page.click('#bPlay');
  await page.evaluate(() => { game.countdown = 0; for (let i = 0; i < 300; i++) update(game, 1 / 30); saveGame(); });
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  assert.deepStrictEqual(keys, ['colonyMobile.diff', 'colonyMobile.save']);
  assert.strictEqual(await page.evaluate(() => localStorage.getItem('colonyMobile.diff')), 'hard');
  await page.reload(); await page.waitForTimeout(300);
  await page.click('#bResume');
  await page.waitForTimeout(300);
  const st = await page.evaluate(() => ({ paused, h1: document.querySelector('#box h1').textContent, ov: !$('ov').classList.contains('hide'), cd: game.countdown, cdHidden: $('cd').classList.contains('hide'), t: game.t }));
  assert.deepStrictEqual({ ...st, t: Math.round(st.t) }, { paused: true, h1: 'Match restored', ov: true, cd: 0, cdHidden: true, t: 10 });
  await page.waitForTimeout(500);
  assert.strictEqual(Math.round(await page.evaluate(() => game.t)), 10, 'nothing runs until Resume');
  await page.click('#bRes');
  await page.waitForTimeout(700);
  assert.ok(await page.evaluate(() => !paused && game.t > 10.4));
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('old-version or corrupt saves fall back to a clean New match', { skip }, async () => {
  for (const bad of [JSON.stringify({ v: 4, t: 99, diffKey: 'normal' }), '{not json']) {
    const { page, errors } = await openPage(browser, PHONE);
    await page.evaluate(b => localStorage.setItem('colonyMobile.save', b), bad);
    await page.reload(); await page.waitForTimeout(300);
    assert.strictEqual(await page.$('#bResume'), null, 'no Resume offered');
    await page.click('#bPlay');
    await page.waitForTimeout(300);
    assert.ok(await page.evaluate(() => game && game.countdown > 0));
    assert.deepStrictEqual(errors, []);
    await page.close();
  }
});

test('no main-canvas resizes during a 60-second match (each resize clears the canvas: black flash)', { skip, timeout: 60000 }, async () => {
  const { page, errors } = await openPage(browser, PHONE, { countCanvasResizes: true });
  await page.click('#bPlay');
  await page.waitForFunction(() => game.countdown === 0, null, { timeout: 8000 });
  await page.click('#bSpeed'); await page.click('#bSpeed'); // 3×: 60 game seconds in ~20 s
  const before = await page.evaluate(() => window.__canvasWrites.cv || 0);
  // Top-bar text changing width is what used to trigger it: cycle the credits through 1–5 digits
  await page.evaluate(() => { let k = 0; setInterval(() => { game.sides[0].res.c = [9, 99, 999, 9999, 99999][k++ % 5]; }, 700); });
  await page.waitForFunction(() => game.t >= 60, null, { timeout: 45000 });
  const r = await page.evaluate(() => ({ cv: window.__canvasWrites.cv || 0, mm: window.__canvasWrites.mm || 0 }));
  assert.strictEqual(r.cv - before, 0, `main canvas resized ${r.cv - before} times`);
  assert.ok(r.mm > 0, 'the minimap did resize (so the trigger was exercised)');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('fog: hidden enemies are not drawn on the minimap, AI intent toasts are gone, "spotted" shows', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay');
  await page.evaluate(() => { game.countdown = 0; game.sides[1].aiT = 1e9; hideCountdown(); });
  // red pixels on the minimap in the column around u
  const redAt = u => page.evaluate(u => {
    const w = mm.width / V.dpr, k = (w - 8) / (UMAX - UMIN), x = Math.round((4 + (u - UMIN) * k) * V.dpr);
    drawMinimapNow();
    const d = mctx.getImageData(Math.max(0, x - 3), 0, 7, mm.height).data;
    let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 120 && d[i + 2] < 120) n++;
    return n;
  }, u);
  await page.evaluate(() => { const e = spawnUnit(game, 1, 'tank', 1000, 0); e.holdU = 1000; e.holdV = 0; game.sides[1].stance = 'hold'; update(game, 1 / 30); });
  assert.strictEqual(await redAt(1000), 0, 'enemy tank in fog: not on the minimap');
  await page.evaluate(() => { game.events.push({ type: 'aiAttack', side: 1, mode: 'all' }); handleEvents(); });
  let toasts = await page.evaluate(() => [...$('toasts').children].map(t => t.textContent));
  assert.ok(!toasts.some(t => /advancing|besiege|take the field/.test(t)), 'no AI-intent toast');
  await page.evaluate(() => { const t = game.ents.find(e => e.side === 1 && e.type === 'tank'); t.u = t.holdU = 700; update(game, 1 / 30); handleEvents(); });
  assert.ok(await redAt(700) > 0, 'in view: drawn');
  toasts = await page.evaluate(() => [...$('toasts').children].map(t => t.textContent));
  assert.ok(toasts.includes('Enemy units spotted'));
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('a v5 save from before fog of war resumes cleanly', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay');
  const v5 = await page.evaluate(() => { game.countdown = 0; for (let i = 0; i < 900; i++) update(game, 1 / 30); const o = JSON.parse(serialize(game, { camX: 600, speed: 1 })); delete o.fog; o.v = 5; return JSON.stringify(o); });
  await page.evaluate(s => { localStorage.setItem('colonyMobile.save', s); }, v5);
  await page.reload(); await page.waitForTimeout(300);
  await page.click('#bResume'); await page.waitForTimeout(300);
  const st = await page.evaluate(() => ({ h1: document.querySelector('#box h1').textContent, t: Math.round(game.t), exploredMid: game.fog[0].exp[cellOf(850)], fogOk: game.fog.length === 2 }));
  assert.deepStrictEqual(st, { h1: 'Match restored', t: 30, exploredMid: 0, fogOk: true });
  await page.click('#bRes'); await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => game.t > 30.3));
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('fog: capture progress on a node out of view is not drawn (it would reveal units)', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay');
  const r = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); game.sides[1].aiT = 1e9;
    const n = game.nodes[2]; n.prog = -60; n.owner = null; n.c = [0, 3];
    update(game, 1 / 30); n.prog = -60; n.c = [0, 3];
    const calls = []; const orig = drawNodeZone;
    drawNodeZone = (c, node, t, inView) => { calls.push([node.id, inView]); orig(c, node, t, inView); };
    render(ctx, game, 1, null, -1); drawNodeZone = orig;
    return calls;
  });
  assert.deepStrictEqual(r.find(c => c[0] === 2), [2, false], 'far node drawn without progress');
  assert.deepStrictEqual(r.find(c => c[0] === 0), [0, true], 'near node (in base vision) drawn in full');
  assert.deepStrictEqual(errors, []);
  await page.close();
});
