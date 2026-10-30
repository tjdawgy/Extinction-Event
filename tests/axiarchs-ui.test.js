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

test('v2.28: Mass Warp, Shield Overcharge and Purification Beam cast through the buttons (tap, place, confirm); the long-press card', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#meSeg [data-f="axiarchs"]'); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
  const at = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro();
    for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 5000; }
    for (let i = 0; i < 30 * 40; i++) update(game, 1 / 30); // the base field grows (the warp point at its front)
    game.t = Math.max(game.t, 300); game.sides[0].hq.tier = 2; game.fog[0].exp.fill(1);
    for (let i = 0; i < 4; i++) { const e = spawnUnit(game, 0, i % 2 ? 'bastion' : 'shardling', 640 + i * 14, -60); e.holdU = e.u; e.holdV = -60; e.cd = 1e6; e.hp *= 0.5; }
    const t = spawnUnit(game, 1, 'tank', 900, -60); t.holdU = 900; t.holdV = -60; t.cd = 1e6; t.hp = t.maxHp = 5000; setStance(game, 1, 'hold'); // it would walk home on Retreat
    update(game, 1 / 30); cam.x = 760; clampCam(); refreshUI(true);
    window.__xy = (u, v = -60) => { const w = P(u, v); return { x: V.cw / 2 + (w.x - cam.x) * V.S, y: V.A + (w.y - Y_BOT) * V.S }; };
    return { units: __xy(660), tank: __xy(900) };
  });
  assert.deepStrictEqual(await page.$$eval('#abil .ab', els => els.map(e => e.dataset.k)), ['mwarp', 'overcharge', 'beam'], 'the three real buttons, no "Soon"');
  assert.strictEqual(await page.$$eval('#abil .ab.lock', els => els.length), 0);
  const cast = async (k, p) => {
    await page.evaluate(() => { for (const k2 in game.sides[0].ab) game.sides[0].ab[k2] = 0; refreshUI(true); }); // the test skips cooldowns
    await page.click(`#abil .ab[data-k="${k}"]`); await page.mouse.click(p.x, p.y); await page.mouse.click(p.x + 3, p.y);
    return page.evaluate(k2 => game.sides[0].abK === k2 && game.sides[0].abEnd > game.t, k);
  };
  assert.ok(await cast('overcharge', at.units), 'Shield Overcharge cast');
  assert.strictEqual(await page.evaluate(() => game.ents.filter(e => e.side === 0 && e.ovT > game.t).length), 4);
  assert.ok(await cast('beam', at.tank), 'Purification Beam cast');
  await page.evaluate(() => { for (let i = 0; i < 30 * 5; i++) update(game, 1 / 30); render(ctx, game, game.t, null, -1); });
  assert.strictEqual(await page.evaluate(() => 5000 - game.ents.find(e => e.side === 1 && e.type === 'tank').hp), await page.evaluate(() => ABIL.beam.dmg), 'the beam swept over the Tank');
  const before = await page.evaluate(() => game.ents.filter(e => e.kind === 'u').length);
  assert.ok(await cast('mwarp', at.units), 'Mass Warp cast');
  const r = await page.evaluate(() => { const a = game.abil.find(x => x.k === 'mwarp'); for (let i = 0; i < 30 * 2.2; i++) update(game, 1 / 30); return { n: game.ents.filter(e => e.kind === 'u').length, near: game.ents.filter(e => e.side === 0 && e.kind === 'u' && Math.hypot(e.u - a.wu, e.v - a.wv) < 80).length }; }); // the warp point shown at the cast (a node captured meanwhile moves the default later)
  assert.deepStrictEqual(r, { n: before, near: 4 }, 'all four warped; no unit created');
  await page.dispatchEvent('#abil .ab[data-k="beam"]', 'pointerdown'); await page.waitForTimeout(500); await page.dispatchEvent('#abil .ab[data-k="beam"]', 'pointerup');
  assert.match(await page.textContent('#info'), /Purification Beam[\s\S]*Strip[\s\S]*Axis T2/);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('v2.28: enemy Axiarch casts in the fog show nothing, make no sound and give no warning; in view the Beam warns and shows', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#meSeg [data-f="lastfist"]'); await page.click('#foeSeg [data-f="axiarchs"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro(); paused = true;
    for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 5000; }
    for (let i = 0; i < 30 * 40; i++) update(game, 1 / 30);
    game.sides[1].hq.tier = 2; game.fog[1].vis.fill(1); game.fog[1].exp.fill(1);
    const F = game.fog[0], lit = u => F.vis[cellOf(u)] === 1, hidden = 1230;
    for (const e of game.ents) e.cd = 1e6; game.projs.length = 0;
    const foes = []; for (let i = 0; i < 4; i++) { const e = spawnUnit(game, 1, 'bastion', hidden + i * 12, 0); e.holdU = e.u; e.holdV = 0; e.cd = 1e6; e.hp *= 0.3; foes.push(e); }
    update(game, 1 / 30); render(ctx, game, game.t, null, -1);
    const calls = []; const sf = sfx; window.sfx = (n, x) => { calls.push(n); return sf(n, x); };
    const tt = toast; window.toast = (m, k) => { calls.push('toast:' + m); return tt(m, k); };
    const ops = () => { let n = 0; const P0 = CanvasRenderingContext2D.prototype, saved = {}; for (const m of ['fill', 'stroke', 'fillRect', 'strokeRect', 'drawImage', 'fillText']) { saved[m] = ctx[m]; ctx[m] = function (...a) { n++; return P0[m].apply(this, a); }; } drawAbilities(ctx, game, lit, game.t); for (const m in saved) ctx[m] = saved[m]; return n; };
    const ok = [['overcharge', hidden], ['mwarp', hidden + 10], ['beam', hidden - 60]].map(([k, u]) => { for (const k2 in game.sides[1].ab) game.sides[1].ab[k2] = 0; return useAbility(game, 1, k, u, 0).ok; });
    let drawn = 0; const ends = beamEnds(game.abil.find(a => a.k === 'beam'));
    for (let i = 0; i < 30 * 4.8; i++) { update(game, 1 / 30); render(ctx, game, game.t, null, -1); drawn += ops(); }
    const hidden_ = { ok, calls: calls.slice(), drawn, dark: [hidden, ...ends, warpPoint(game, 1).u].every(u => !lit(u)) };
    // the same Beam where the player can see it: a Recon Drone over the enemy's side of the lane
    const eye = spawnUnit(game, 0, 'drone', hidden, 0); eye.holdU = hidden; eye.holdV = 0; updateVision(game);
    for (const k2 in game.sides[1].ab) game.sides[1].ab[k2] = 0; const okV = useAbility(game, 1, 'beam', hidden, 0).ok;
    let drawnV = 0; for (let i = 0; i < 10; i++) { update(game, 1 / 30); render(ctx, game, game.t, null, -1); drawnV += ops(); }
    return { hidden: hidden_, okV, drawnV, seen: calls.slice(hidden_.calls.length) };
  });
  assert.deepStrictEqual(r.hidden.ok, [true, true, true]);
  assert.ok(r.hidden.dark, 'the casts, the strip and the enemy warp point are all out of the player\'s view');
  assert.deepStrictEqual(r.hidden.calls, [], 'no sound or toast from casts in the fog');
  assert.strictEqual(r.hidden.drawn, 0, 'nothing of them drawn');
  assert.ok(r.okV && r.drawnV > 0 && r.seen.includes('siren') && r.seen.includes('toast:Enemy beam incoming!'), JSON.stringify(r));
  assert.deepStrictEqual(errors, []);
  await page.close();
});
