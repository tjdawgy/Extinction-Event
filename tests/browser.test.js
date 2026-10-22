// UI checks in headless Chromium at iPhone landscape size (safe areas simulated).
// Skips itself when Playwright isn't installed.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

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

test('the AI personality is never shown during a match, only on the post-match screen', { skip }, async () => {
  const words = /aggressor|turtle|economist|trickster|personality/i;
  for (const p of ['aggressor', 'turtle', 'economist', 'trickster']) {
    const { page, errors } = await openPage(browser, PHONE);
    await page.click('#bPlay');
    // force this match's personality the way a fresh roll would, then play a few minutes at full speed
    await page.evaluate(p => { game.sides[1].persona = rollPersona(p); game.countdown = 0; hideCountdown(); }, p);
    const seen = await page.evaluate(() => {
      const texts = [];
      for (let k = 0; k < 6; k++) {
        for (let i = 0; i < 30 * 30; i++) update(game, 1 / 30);
        handleEvents(); refreshUI(true);
        texts.push(document.body.innerText, ...[...document.querySelectorAll('[aria-label],[title]')].map(e => (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('title') || '')), document.title);
      }
      return texts.join('\n');
    });
    assert.doesNotMatch(seen, words, `${p}: nothing in the UI names or hints at the personality during play`);
    await page.evaluate(() => { kill(game, game.sides[1].hq, 0); });
    await page.waitForSelector('#box .faced', { timeout: 4000 });
    assert.match(await page.textContent('#box .faced'), new RegExp(`You faced: The ${p}`, 'i'));
    assert.deepStrictEqual(errors, []);
    await page.close();
  }
});

test('a resumed match keeps its personality (and still does not show it)', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay');
  const before = await page.evaluate(() => { game.countdown = 0; for (let i = 0; i < 300; i++) update(game, 1 / 30); saveGame(); return JSON.stringify(game.sides[1].persona); });
  await page.reload(); await page.waitForTimeout(300);
  await page.click('#bResume'); await page.waitForTimeout(300);
  assert.strictEqual(await page.evaluate(() => JSON.stringify(game.sides[1].persona)), before);
  assert.doesNotMatch(await page.evaluate(() => document.body.innerText), /aggressor|turtle|economist|trickster/i);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('unit sprite cache: every cached pose fits its box; recoil and aircraft draw live', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  const r = await page.evaluate(() => {
    const out = [], b = 2.5, pad = 40;
    for (const type of Object.keys(SPR_BOX)) for (const side of [0, 1]) for (let i = 0; i < 40; i++) {
      const u = { type, side, anim: i * 0.137, moving: i > 0, recoil: 0 };
      const p = sprPose(u), box = p.box;
      // live drawing of the snapped pose on a larger canvas: count ink outside the box
      const cv = document.createElement('canvas'); cv.width = Math.ceil((box[2] + 2 * pad) * b); cv.height = Math.ceil((box[3] + 2 * pad) * b);
      const k = cv.getContext('2d'); k.setTransform(b, 0, 0, b, (pad - box[0]) * b, (pad - box[1]) * b);
      DRAW_U[type](k, TEAM[side], p.u);
      const d = k.getImageData(0, 0, cv.width, cv.height).data, x0 = pad * b, y0 = pad * b, x1 = x0 + box[2] * b, y1 = y0 + box[3] * b;
      let outside = 0;
      for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 8 && (x < x0 - 1 || x > x1 + 1 || y < y0 - 1 || y > y1 + 1)) outside++;
      if (outside) out.push(`${type} side ${side} pose ${p.key}: ${outside} px outside`);
    }
    return { out, live: sprPose({ type: 'rifle', side: 0, anim: 0, moving: false, recoil: 0.5 }), air: sprPose({ type: 'aircraft', side: 0, anim: 0, moving: true, recoil: 0 }) };
  });
  assert.deepStrictEqual(r.out, []);
  assert.strictEqual(r.live, null, 'a unit mid-recoil is drawn live');
  assert.strictEqual(r.air, null, 'aircraft are drawn live');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('effects: nothing is spawned for hidden enemies (firing, dying, walking, buildings) and no shake from them', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay');
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    paused = true; game.countdown = 0; hideCountdown();
    for (const s of [0, 1]) { game.sides[s].aiT = 1e9; game.sides[s].stance = 'hold'; }
    let calls = 0; const leaks = [], F = game.fog[0], lit = x => F.vis[cellOf(x)] === 1;
    const watch = name => { const orig = window[name]; window[name] = function (...a) { calls++; const x = a[1]; if (name === 'sfx' && x === undefined) return orig.apply(this, a); /* event sounds have no position */ if (!lit(x)) leaks.push(`${name}(${a[0]}) at ${Math.round(x)}`); if (name === 'vFx' && a[0] === 'beam' && !lit(a[7])) leaks.push('beam end in fog'); return orig.apply(this, a); }; };
    watch('vPart'); watch('vFx'); watch('sfx');
    const hold = (e, u, v) => { e.holdU = u; e.holdV = v; return e; };
    for (let i = 0; i < 4; i++) hold(spawnUnit(game, 0, 'rifle', 720 + i * 10, (i - 1.5) * 25), 720 + i * 10, (i - 1.5) * 25);
    const orig = updateVision; updateVision = g => { orig(g); g.fog[1].vis.fill(1); }; // the enemy sees everything, the player only near its men
    hold(spawnUnit(game, 1, 'artillery', 1150, 0), 1150, 0);
    hold(spawnUnit(game, 1, 'sniper', 1000, 30), 1000, 30);
    const titan = spawnUnit(game, 1, 'titan', 1300, -40); hold(titan, 1200, -40);
    const doomed = hold(spawnUnit(game, 1, 'tank', 1250, 60), 1250, 60);
    let hiddenShellRing = 0, shake = 0;
    for (let i = 0; i < 30 * 12; i++) {
      if (i === 60) kill(game, doomed, 0);
      if (i === 90) { const b = game.ents.find(e => e.side === 1 && e.kind === 'b' && e.type !== 'hq'); if (b) kill(game, b, 0); }
      update(game, 1 / 30); render(ctx, game, game.t, null, -1);
      for (const p of game.projs) if (p.weapon === 'shell' && !lit(p.u) && showLanding(p, lit)) hiddenShellRing++;
      shake = Math.max(shake, VFX.shake);
    }
    const fired = game.sides[0].stats.lost > 0 || game.ents.filter(e => e.side === 0 && e.kind === 'u').some(e => e.hp < e.maxHp);
    return { calls, leaks: leaks.slice(0, 10), hiddenShellRing, shake, fired, wrecks: VFX.wrecks.length, decals: VFX.decals.filter(d => !lit(d.x)).length };
  });
  assert.ok(r.fired, 'the hidden enemies did fire at the player');
  assert.ok(r.calls > 20, `effects were spawned where the player can see (${r.calls})`);
  assert.deepStrictEqual(r.leaks, []);
  assert.strictEqual(r.hiddenShellRing, 0, 'no landing ring while the shell is hidden');
  assert.strictEqual(r.shake, 0, 'a hidden Titan does not shake the screen');
  assert.strictEqual(r.decals, 0);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('effects: pools stay within their caps in a big battle, and quality steps down and back up', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay');
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    paused = true; game.countdown = 0; hideCountdown(); updateIntro(); cam.x = L / 2; clampCam();
    for (const s of [0, 1]) { game.sides[s].aiT = 1e9; game.sides[s].stance = 'attack'; }
    const army = { rifle: 20, heavy: 8, sniper: 4, tank: 4, artillery: 2, titan: 1, aircraft: 2, interceptor: 2 };
    for (const s of [0, 1]) for (const [t, n] of Object.entries(army)) for (let i = 0; i < n; i++) spawnUnit(game, s, t, L / 2 + (s ? 1 : -1) * (100 + i * 4), (i % 9 - 4) * 20);
    let np = 0, nfx = 0;
    for (let i = 0; i < 30 * 20; i++) { update(game, 1 / 30); render(ctx, game, game.t, null, -1); np = Math.max(np, VFX.np); nfx = Math.max(nfx, VFX.nfx); }
    // quality: slow frames step it down a level every 2 s; smooth frames step it back up every 6 s
    VFX.lock = null; VFX.q = 2; VFX.gaps.length = 0; VFX.gapAt = 0; VFX.slowFor = VFX.fastFor = 0;
    const q = [];
    for (let s = 0; s < 6; s++) { for (let i = 0; i < 25; i++) vfxQuality(40, true); q.push(VFX.q); }
    for (let s = 0; s < 12; s++) { for (let i = 0; i < 60; i++) vfxQuality(16.7, true); q.push(VFX.q); }
    vfxQuality(5000, true); // a tab switch is ignored
    return { np, nfx, q, after: VFX.q };
  });
  assert.ok(r.np > 50 && r.np <= 300, `particles ${r.np}`);
  assert.ok(r.nfx > 10 && r.nfx <= 120, `effects ${r.nfx}`);
  assert.deepStrictEqual(r.q, [2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2]);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('sound: toggle on the title screen and pause menu, remembered under its own key; save keys untouched', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  assert.strictEqual(await page.textContent('#bSound'), 'Sound: On');
  await page.click('#bSound');
  assert.strictEqual(await page.textContent('#bSound'), 'Sound: Off');
  assert.strictEqual(await page.evaluate(() => localStorage.getItem('extinctionEvent.sound')), 'off');
  await page.reload(); await page.waitForTimeout(300);
  assert.strictEqual(await page.textContent('#bSound'), 'Sound: Off', 'remembered after a reload');
  await page.click('#bPlay'); await page.waitForTimeout(200);
  assert.strictEqual(await page.evaluate(() => sndPlay('built')), false, 'muted: nothing plays');
  await page.evaluate(() => pauseGame());
  assert.strictEqual(await page.textContent('#bSound'), 'Sound: Off');
  await page.click('#bSound');
  assert.strictEqual(await page.textContent('#bSound'), 'Sound: On');
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  assert.deepStrictEqual(keys.filter(k => !['colonyMobile.diff', 'colonyMobile.save', 'extinctionEvent.sound'].includes(k)), [], 'only the save keys and the sound key');
  assert.ok(keys.includes('colonyMobile.save') && keys.includes('extinctionEvent.sound'));
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('sound: starts on the first tap, caps voices, disconnects every node, silent off screen, survives backgrounding', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  assert.strictEqual(await page.evaluate(() => SND.ctx), null, 'no audio before the first tap');
  await page.click('#bPlay'); await page.waitForTimeout(300);
  const st = await page.evaluate(() => SND.ctx && SND.ctx.state);
  assert.strictEqual(st, 'running');
  const r = await page.evaluate(() => new Promise(res => {
    const names = Object.keys(SFX), caps = {};
    let maxV = 0, over = [];
    const t = setInterval(() => {
      for (const n of names) sndPlay(n, cam.x, 40);
      maxV = Math.max(maxV, SND.voices);
      for (const n of names) if ((SND.per[n] || 0) > SFX[n][1]) over.push(n);
    }, 10);
    setTimeout(() => { clearInterval(t); setTimeout(() => res({ maxV, over, voices: SND.voices, live: SND.live, played: SND.played, offscreen: sndPlay('cannon', cam.x + 5000) }), 3500); }, 1500);
  }));
  assert.ok(r.played > 30, `sounds played (${r.played})`);
  assert.ok(r.maxV <= 14, `at most 14 at once (${r.maxV})`);
  assert.deepStrictEqual(r.over, [], 'per-sound caps hold');
  assert.strictEqual(r.voices, 0, 'every voice ended');
  assert.strictEqual(r.live, 0, 'every node was disconnected');
  assert.strictEqual(r.offscreen, false, 'off-screen fights are silent');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(300);
  assert.strictEqual(await page.evaluate(() => SND.ctx.state), 'suspended', 'suspended in the background');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(300);
  assert.strictEqual(await page.evaluate(() => SND.ctx.state), 'running', 'resumed on return');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('sound: every sound is baked into a buffer, so a playing sound costs at most three nodes', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay');
  await page.waitForFunction(() => Object.keys(SND.bufs).length >= Object.keys(SFX).length + 2, null, { timeout: 10000 });
  const r = await page.evaluate(() => {
    const before = SND.live, out = {};
    for (const n of ['rifle', 'cannon', 'siege', 'collapse', 'victory']) { const l0 = SND.live; sndPlay(n, cam.x, 40); out[n] = SND.live - l0; }
    return { out, longest: Math.max(...Object.values(SND.bufs).map(b => b.duration)), before };
  });
  for (const [n, k] of Object.entries(r.out)) assert.ok(k > 0 && k <= 3, `${n} uses ${k} nodes`);
  assert.ok(r.longest < 1.6, `longest sound ${r.longest.toFixed(2)} s`);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

for (const dev of [PHONE, NARROW]) {
  test(`abilities at ${dev.width}×${dev.height}: buttons, building panel, info panel, banner, top bar and cards never overlap`, { skip }, async () => {
    const { page, errors } = await openPage(browser, dev);
    await page.click('#bPlay'); await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); game.t = 200; game.sides[0].res.c = game.sides[0].res.e = 5000;
      for (const k of ['barracks', 'factory']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.type === k) { b.built = true; b.progress = 1; } }
      refreshUI(true);
      const box = id => { const e = $(id), b = e.getBoundingClientRect(), st = getComputedStyle(e); return st.display === 'none' || st.visibility === 'hidden' ? null : { id, l: b.left, t: b.top, r: b.right, b: b.bottom }; };
      const hit = (a, b) => a && b && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      const out = [], check = (label, ids) => { const bs = ids.map(box); for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) if (hit(bs[i], bs[j])) out.push(`${label}: ${bs[i].id} overlaps ${bs[j].id}`); return bs; };
      openPanel(game.ents.find(e => e.type === 'factory'));
      const withPanel = check('building panel open', ['abil', 'bp', 'hud', 'panel']);
      showInfo('a', 'strike');
      check('info open over the panel', ['abil', 'bp', 'info', 'panel']);
      hideInfo(); closePanel(); showInfo('u', 'tank');
      check('unit info open', ['abil', 'info', 'panel']);
      hideInfo(); onAbil('shield', $('abil').children[0]);
      check('targeting banner', ['abil', 'aim', 'panel', 'hud']);
      const btn = $('abil').children[0].getBoundingClientRect();
      return { out, abilShown: !!withPanel[0], bp: !!withPanel[1], btn: Math.round(btn.width) };
    });
    assert.ok(r.abilShown && r.bp, 'both on screen together');
    assert.deepStrictEqual(r.out, []);
    assert.ok(r.btn >= 44, `buttons are at least 44 pt (${r.btn})`);
    assert.deepStrictEqual(errors, []);
    await page.close();
  });
}

test('abilities: tap, place, confirm; cancel; blocked during GET READY, while paused and when short of resources', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(300);
  const toasts = () => page.evaluate(() => [...$('toasts').children].map(t => t.textContent));
  // GET READY
  await page.click('#abil .ab[data-k="shield"]');
  assert.ok((await toasts()).includes('Wait for GO'));
  assert.ok(await page.evaluate(() => $('aim').classList.contains('hide')));
  const at = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); game.t = 200; game.sides[0].ab = { shield: 0, strike: 0, repair: 0 };
    for (const s of game.sides) s.aiT = 1e9;
    for (let i = 0; i < 6; i++) { const e = spawnUnit(game, 0, 'rifle', 500 + i * 12, 0); e.holdU = e.u; e.holdV = 0; }
    update(game, 1 / 30); updateIntro(); cam.x = 600; clampCam(); refreshUI(true);
    const w = P(530, 0); return { x: V.cw / 2 + (w.x - cam.x) * V.S, y: V.A + (w.y - Y_BOT) * V.S };
  });
  // not enough energy
  await page.evaluate(() => { game.sides[0].res.e = 10; refreshUI(true); });
  await page.click('#abil .ab[data-k="shield"]');
  assert.ok((await toasts()).some(t => /more energy/.test(t)));
  await page.evaluate(() => { game.sides[0].res.c = game.sides[0].res.e = 1000; refreshUI(true); });
  // cancel
  await page.click('#abil .ab[data-k="shield"]');
  assert.ok(await page.evaluate(() => !$('aim').classList.contains('hide')));
  await page.click('#aimX');
  assert.ok(await page.evaluate(() => $('aim').classList.contains('hide') && aim === null));
  // place, then confirm inside the circle
  await page.click('#abil .ab[data-k="shield"]');
  await page.mouse.click(at.x, at.y);
  assert.match(await page.textContent('#aimTxt'), /tap inside the circle/);
  const e0 = await page.evaluate(() => game.sides[0].res.e);
  assert.ok(e0 >= 1000, 'nothing is paid before confirming');
  await page.mouse.click(at.x + 4, at.y);
  const r = await page.evaluate(() => ({ e: game.sides[0].res.e, shielded: game.ents.filter(e => e.side === 0 && e.shT > game.t).length, aim, cd: game.sides[0].ab.shield - game.t }));
  assert.ok(Math.abs(e0 - r.e - 75) < 1, `paid ${e0 - r.e} energy`); assert.strictEqual(r.shielded, 6); assert.strictEqual(r.aim, null); assert.ok(r.cd > 49);
  // paused: pausing cancels targeting and the buttons do nothing
  await page.click('#abil .ab[data-k="repair"]');
  await page.evaluate(() => pauseGame());
  assert.ok(await page.evaluate(() => aim === null && $('aim').classList.contains('hide')));
  await page.evaluate(() => onAbil('repair', $('abil').children[2]));
  assert.ok(await page.evaluate(() => aim === null));
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('abilities and the fog: an enemy strike on ground the player cannot see shows nothing; one in view warns, even off screen', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    paused = true; game.countdown = 0; hideCountdown(); updateIntro(); game.t = 300; // play zoom, not the intro's whole-map view
    for (const s of game.sides) { s.aiT = 1e9; s.ab = { shield: 0, strike: 0, repair: 0 }; s.res.c = s.res.e = 5000; }
    for (const k of ['barracks', 'factory']) { tryBuild(game, 1, k); for (const b of game.ents) if (b.type === k && b.side === 1) { b.built = true; b.progress = 1; } }
    const calls = []; const sf = sfx; window.sfx = (n, x) => { calls.push(n); return sf(n, x); };
    const tt = toast; window.toast = (m, k) => { calls.push('toast:' + m); return tt(m, k); };
    const F = game.fog[0], lit = u => F.vis[cellOf(u)] === 1;
    game.fog[1].exp.fill(1);
    const hidden = 1000; // middle of the map: dark for the player
    const ok1 = useAbility(game, 1, 'strike', hidden, 0).ok;
    for (let i = 0; i < 120; i++) { update(game, 1 / 30); render(ctx, game, game.t, null, -1); }
    const hiddenCalls = calls.slice(), hiddenSeen = game.abil.filter(a => abilSeen(a, lit)).length;
    // now one on the player's own base, with the camera far away
    game.sides[1].ab.strike = 0; cam.x = 1600; clampCam();
    const target = hqPos(0).u + 60;
    const ok2 = useAbility(game, 1, 'strike', target, 0).ok;
    update(game, 1 / 30); const arrows = render(ctx, game, game.t, null, -1) === undefined ? drawStrikeAlerts(ctx, game, lit, game.t) : 0;
    return { ok1, ok2, hiddenCalls, hiddenSeen, calls: calls.slice(hiddenCalls.length), arrows };
  });
  assert.ok(r.ok1 && r.ok2);
  assert.deepStrictEqual(r.hiddenCalls, [], 'no sound, toast or warning for a strike in the fog');
  assert.strictEqual(r.hiddenSeen, 0);
  assert.ok(r.calls.includes('siren') && r.calls.includes('toast:Enemy orbital strike incoming!'), JSON.stringify(r.calls));
  assert.strictEqual(r.arrows, 1, 'an arrow points to the off-screen strike');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('Extinction Event: warning banner (no taps), meteors only on ground the player can see, end-screen wording', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9;
    paused = true; game.t = 1180; refreshUI(true);
    const ext = $('ext'), banner = { text: ext.textContent, shown: !ext.classList.contains('hide'), taps: getComputedStyle(ext).pointerEvents };
    const F = game.fog[0], lit = x => F.vis[cellOf(x)] === 1, bad = [];
    let spawned = 0; const orig = vFx; window.vFx = function (k, x, ...rest) { if (k === 'meteor') { spawned++; if (!lit(rest[5])) bad.push(Math.round(rest[5])); } return orig.call(this, k, x, ...rest); }; // rest[5] = where it lands
    game.t = 1290; cam.x = hqPos(0).u + 300; clampCam(); // own base in view; the enemy base is in the fog
    for (let i = 0; i < 30 * 20; i++) { update(game, 1 / 30); render(ctx, game, game.t, null, -1); if (game.over) break; }
    const meteors = spawned;
    // end screens
    const shot = res => { game.over = true; game.result = res.result; game.winner = res.winner; showEnd(); return document.querySelector('#box h1').textContent + ' | ' + document.querySelector('#box p:nth-of-type(2)').textContent; };
    const texts = [
      shot({ winner: 0, result: { how: 'score', reason: 'both', by: 'score', score: [5200, 3100] } }),
      shot({ winner: 1, result: { how: 'storm' } }),
      shot({ winner: -1, result: { how: 'draw', reason: 'limit', by: 'credits', score: [1000, 1000] } }),
    ];
    return { banner, bad, meteors, texts, scoreLine: (shot({ winner: 0, result: { how: 'score', reason: 'limit', by: 'score', score: [5200, 3100] } }), document.body.innerText.includes('Remaining strength')) };
  });
  assert.ok(r.banner.shown && /Extinction event in 0:2\d/.test(r.banner.text), JSON.stringify(r.banner));
  assert.strictEqual(r.banner.taps, 'none');
  assert.ok(r.meteors > 5, `meteors fell on the player's base (${r.meteors})`);
  assert.deepStrictEqual(r.bad, [], 'no meteors drawn on hidden enemy buildings');
  assert.match(r.texts[0], /^Victory \| Survived the Extinction Event/);
  assert.match(r.texts[1], /^Defeat \| Your Command HQ fell to the Extinction Event/);
  assert.match(r.texts[2], /^Mutual extinction/);
  assert.ok(r.scoreLine, 'scores are shown');
  assert.deepStrictEqual(errors, []);
  await page.close();
});
