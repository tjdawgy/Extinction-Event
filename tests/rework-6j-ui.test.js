// v3.00 (batch 6j) in a real browser at 667×375 (and the wider phone): the playtest fixes seen in the page. Screenshots:
// tests/screenshots/rework6j-*.png (docs/screenshots with EE_DOC_SHOTS=1): air-classic and air-threelane (every aircraft at the
// field's top row, below the top bar; A1), beam-<map>-<lane> (the Purification Beam aimed and fired through the buttons on every
// lane of Two-Lane and Three-Lane; A3), spire-swarm and spire-apex (the Bloomspire's Train cards; A4), title and menu (the version).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { findPlaywright, NARROW, PHONE, openPage } = require('./browser-kit');

const pw = findPlaywright(), skip = !pw && 'Playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const OUT = process.env.EE_DOC_SHOTS ? path.join(__dirname, '..', 'docs', 'screenshots') : path.join(__dirname, 'screenshots');
const snap = async (page, name) => { fs.mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: path.join(OUT, `rework6j-${name}.png`) }); };

async function match(me, foe, map = 'classic', dev = NARROW) {
  const { page, errors } = await openPage(browser, dev);
  await page.click(`#meSeg [data-f="${me}"]`); await page.click(`#foeSeg [data-f="${foe}"]`); await page.click('#bPlay');
  await page.click(`.mapc[data-m="${map}"]`); await page.click('#bMapGo'); await page.waitForTimeout(300);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; $('toasts').innerHTML = ''; });
  return { page, errors };
}

const AIR = ['interceptor', 'aircraft', 'leviathan', 'razor6', 'gnatcloud', 'blightwing', 'talonmaw', 'skywyrm', 'prismwing', 'wraithwing', 'shardstorm', 'voidcarrier', 'sovereign'];
for (const [map, dev, tag] of [['classic', NARROW, 'classic'], ['threelane', NARROW, 'threelane'], ['twolane', PHONE, null]]) {
  test(`A1: every aircraft at the top of ${map} is drawn below the top bar (${dev.width}×${dev.height}); the SIM's heights are untouched`, { skip }, async () => {
    const { page, errors } = await match('lastfist', 'bloomhost', map, dev);
    const r = await page.evaluate(AIR => {
      paused = true; const g = game, top = -(MAP_2D ? MAP.size.h / 2 : 200) + 12, us = [];
      AIR.forEach((t, i) => { const e = spawnUnit(g, i % 2, t, 560 + i * 52, top); us.push(e); });
      for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); }
      camJump(560 + AIR.length * 26, top); const z0 = us.map(e => e.z); render(ctx, g, g.t, null, -1);
      const hud = $('hud').getBoundingClientRect().bottom - cv.getBoundingClientRect().top;
      return { same: us.every((e, i) => e.z === z0[i]), lowered: us.filter(e => zVis(e) < e.z).length, worst: Math.min(...us.map(e => { const w = P(e.u, e.v); return (w.y - zVis(e) - visH(e.type) * US - YB()) * V.S + V.A - hud; })) };
    }, AIR);
    assert.ok(r.same, 'the SIM heights are put back after the frame');
    assert.ok(r.lowered >= 8, JSON.stringify(r)); assert.ok(r.worst >= 0, 'every aircraft\'s art top below the top bar: ' + JSON.stringify(r));
    if (tag) await snap(page, 'air-' + tag);
    assert.deepStrictEqual(errors, []); await page.close();
  });
}

test('A2: with a Queen selected, a Mite hatching never changes the selection; a tap on an enemy behind her Mites targets it', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  const r = await page.evaluate(() => {
    const g = game; setStance(g, 1, 'hold');
    const q = spawnUnit(g, 0, 'queen', 900, 0); ctlHold(q, 900, 0);
    const e = spawnUnit(g, 1, 'heavy', 1030, 0); e.holdU = e.u; e.holdV = e.v; e.hp = e.maxHp = 1e6;
    for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } update(g, TICK); updateVision(g); camJump(960, 0); render(ctx, g, g.t, null, -1);
    selSet([q]); const before = [...SELN];
    for (let i = 0; i < 60 * 3; i++) update(g, TICK);
    const mites = g.ents.filter(m => m.qm === q.id); render(ctx, g, g.t, null, -1);
    const sameSel = JSON.stringify([...SELN]) === JSON.stringify(before);
    // put a Mite right on the enemy, then tap there: the enemy is targeted, the Mite isn't selected
    const m = mites[0]; m.u = e.u - 2; m.v = e.v; const p = uScreen(e); ctlFieldTap(p.x, p.y);
    return { mites: mites.length, sameSel, po: q.po, selAfter: [...SELN], eid: e.id };
  });
  assert.ok(r.mites >= 1 && r.sameSel, JSON.stringify(r));
  assert.strictEqual(r.po.o, 'target'); assert.strictEqual(r.po.id, r.eid); assert.deepStrictEqual(r.selAfter, [], 'the order was given (the selection clears after an order)');
  assert.deepStrictEqual(errors, []); await page.close();
});

for (const map of ['twolane', 'threelane']) {
  test(`A3: the Purification Beam aimed and fired through the buttons on every lane of ${map}`, { skip }, async () => {
    const { page, errors } = await match('axiarchs', 'lastfist', map);
    const lanes = await page.evaluate(() => {
      for (const s of game.sides) s.res.c = s.res.e = 50000;
      game.t = 300; game.sides[0].hq.tier = 2; game.fog[0].exp.fill(1); game.fog[0].vis.fill(1); setStance(game, 1, 'hold');
      return MAP.lanes.map(ln => ({ id: ln.id, v: laneY(ln, 1050) }));
    });
    assert.strictEqual(lanes.length, map === 'twolane' ? 2 : 3);
    for (const ln of lanes) {
      const r0 = await page.evaluate(v => {
        const t = spawnUnit(game, 1, 'tank', 1050, v); t.holdU = 1050; t.holdV = v; t.cd = 1e6; t.hp = t.maxHp = 5000;
        update(game, 1 / 30); camJump(1050, v); for (const k2 in game.sides[0].ab) game.sides[0].ab[k2] = 0; refreshUI(true); $('toasts').innerHTML = '';
        const w = P(1050, v); return { x: V.cw / 2 + (w.x - cam.x) * V.S, y: V.A + (w.y - YB()) * V.S, id: t.id };
      }, ln.v);
      await page.click('#abil .ab[data-k="beam"]'); await page.mouse.click(r0.x, r0.y);
      const a1 = await page.evaluate(() => aim && { v: aim.v, ok: aim.ok, msg: aim.msg });
      assert.ok(a1 && a1.ok && Math.abs(a1.v - ln.v) < 6, `${map} ${ln.id}: placed on the lane ${JSON.stringify(a1)}`);
      await page.mouse.click(r0.x + 3, r0.y);
      const a2 = await page.evaluate(() => ({ aim: !!aim, beams: game.abil.filter(a => a.k === 'beam').map(a => a.v) }));
      assert.ok(!a2.aim && a2.beams.length === 1 && Math.abs(a2.beams[0] - ln.v) < 6, `${map} ${ln.id}: cast where aimed ${JSON.stringify(a2)}`);
      await page.evaluate(() => { for (let i = 0; i < 30 * 3.6; i++) update(game, 1 / 30); render(ctx, game, game.t, null, -1); });
      await snap(page, `beam-${map}-${ln.id}`);
      await page.evaluate(() => { for (let i = 0; i < 30 * 2; i++) update(game, 1 / 30); });
      const dmg = await page.evaluate(id => 5000 - game.ents.find(e => e.id === id).hp, r0.id);
      assert.strictEqual(dmg, await page.evaluate(() => ABIL.beam.dmg), `${map} ${ln.id}: the sweep hit the Tank on that lane`);
      await page.evaluate(() => { game.abil = []; });
    }
    assert.deepStrictEqual(errors, []); await page.close();
  });
}

test('A4: no unit\'s Train card or Codex picture is cut at its edges (all three factions); the Bloomspire\'s cards', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  const clipped = await page.evaluate(() => {
    const edge = cvs => { const c = cvs.getContext('2d'), w = cvs.width, h = cvs.height, d = c.getImageData(0, 0, w, h).data, a = (x, y) => d[(y * w + x) * 4 + 3] > 40; let n = { l: 0, r: 0, t: 0, b: 0 };
      for (let x = 0; x < w; x++) { if (a(x, 0)) n.t++; if (a(x, h - 1)) n.b++; } for (let y = 0; y < h; y++) { if (a(0, y)) n.l++; if (a(w - 1, y)) n.r++; } return n; };
    const out = [];
    for (const t of Object.keys(UDEF)) {
      if (!UDEF[t].fac || !DRAW_U[t]) continue;
      const cv = document.createElement('canvas'); drawIcon(cv, 'u', t, UDEF[t].fac); const n = edge(cv);
      if (n.l + n.r + n.t + (UDEF[t].air ? n.b : 0) > 0) out.push(['card', t, n]);
      const cx = document.createElement('canvas'); cx.dataset.k = 'u'; cx.dataset.f = UDEF[t].fac; cx.dataset.t = t; cx.style.width = '72px'; cx.style.height = '60px'; document.body.appendChild(cx);
      cxPic(cx); const m = edge(cx); cx.remove(); if (m.l + m.r + m.t + m.b > 0) out.push(['codex', t, m]);
    }
    return out;
  });
  assert.deepStrictEqual(clipped, []);
  for (const [path6, tag] of [['A', 'swarm'], ['B', 'apex']]) {
    await page.evaluate(p => {
      const b = game.ents.find(e => e.kind === 'b' && e.side === 0 && e.type === 'techlab') || mkBuilding(game, 0, 'techlab', 3);
      b.built = true; b.progress = 1; b.tier = 3; b.path = p; game.sides[0].res.c = game.sides[0].res.e = 9000; for (let i = 0; i < 5; i++) update(game, TICK);
      refreshUI(true); $('toasts').innerHTML = '';
    }, path6);
    await page.click('.tabs [data-tab="train"]'); await page.waitForTimeout(150);
    await snap(page, 'spire-' + tag);
  }
  assert.deepStrictEqual(errors, []); await page.close();
});

test('Step 0: the version shows on the title screen and the main menu', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW, { title: true });
  const t = await page.$eval('#title .tver', e => ({ txt: e.textContent, vis: getComputedStyle(e).display !== 'none' }));
  assert.strictEqual(t.txt, await page.evaluate(() => 'v' + VERSION)); assert.ok(t.vis);
  await snap(page, 'title');
  await page.click('#title'); await page.waitForTimeout(500);
  assert.strictEqual(await page.$eval('#box .ver', e => e.textContent), await page.evaluate(() => 'v' + VERSION));
  await snap(page, 'menu');
  assert.deepStrictEqual(errors, []); await page.close();
});
