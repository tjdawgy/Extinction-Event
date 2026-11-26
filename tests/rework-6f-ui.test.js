// v2.96 (batch 6f, REWORK.b6f) in a real browser: the Codex and a unit's info card show v2.94's Axiarch prices again (b6e's
// conversion with b6f off), and a human Axiarch player's trained units warp in beside the base rally point when no warp point
// is set (Part C), at the set point when one is, at the field's front edge with b6f off. Screenshot:
// tests/screenshots/warp6f-base.png (docs/screenshots with EE_DOC_SHOTS=1).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, openPage } = require('./browser-kit');

const pw = findPlaywright(), skip = !pw && 'Playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const OUT = process.env.EE_DOC_SHOTS ? path.join(__dirname, '..', 'docs', 'screenshots') : path.join(__dirname, 'screenshots');

test('b6f: the Codex and the info card show v2.94\'s Axiarch prices; with b6f off, b6e\'s', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  const read = () => page.evaluate(() => ({ card: document.getElementById('cx-u-lancer').textContent, row: $('cxTw').querySelector('tbody tr[data-t="lancer"]').textContent }));
  await page.evaluate(() => openCodex('axiarchs', 'unit:lancer')); await page.waitForTimeout(200);
  const on = await read();
  assert.ok(on.card.includes('120') && on.card.includes('45'), `Lancer card shows 120/45: ${on.card.slice(0, 120)}`);
  assert.ok(on.row.includes('120') && on.row.includes('45'), 'Lancer stats row');
  const info = await page.evaluate(() => { closeCodex && closeCodex(); showInfo('u', 'marksman'); return document.getElementById('info').textContent; });
  assert.ok(info.includes('240 credits, 110 energy'), `info card: ${info.slice(0, 200)}`);
  await page.evaluate(() => { REWORK.b6f = false; REWORK.b6g = false; REWORK.b6h = false; REWORK.b6hbody = false; REWORK.b6hnode = false; const i = document.getElementById('info'); if (i) i.classList.remove('show'); openCodex('axiarchs', 'unit:lancer'); });
  await page.waitForTimeout(200);
  const off = await read(), L = await page.evaluate(() => B6E.cost.lancer);
  assert.ok(off.card.includes(String(L.c)) && off.card.includes(String(L.e)), 'b6f off: b6e\'s converted price');
  await page.evaluate(() => { REWORK.b6f = true; });
  assert.deepStrictEqual(errors, []);
  await page.close();
});

// Plays as the Axiarchs on Classic: its own node and the centre held (the field reaches out into the lane, its front edge far
// from the base), a Genesis Gate built, a Shardling trained by tapping its card; where does it warp in?
async function trainOne(rw, setWarpAt) {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#meSeg [data-f="axiarchs"]'); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#bPlay'); await page.click('#bMapGo'); await page.waitForTimeout(300);
  await page.evaluate(([rw, at]) => {
    Object.assign(game.rw, rw || {});
    game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 5000; }
    for (const i of [0, 1]) { game.nodes[i].owner = 0; game.nodes[i].prog = 100; }
    tryBuild(game, 0, 'barracks'); for (const e of game.ents) if (e.kind === 'b' && e.side === 0) { e.built = true; e.hp = e.maxHp; }
    for (let i = 0; i < 30 * 40; i++) update(game, 1 / 30);
    if (at) { const n = game.nodes[1]; if (!setWarp(game, 0, n.u + at.du, n.v + at.dv).ok) throw new Error('setWarp'); } // beside the centre node
  }, [rw, setWarpAt]);
  await page.click('.tabs [data-tab="train"]');
  const card = await page.textContent('#cWarp');
  await page.click('#cards .card[data-type="shardling"]');
  const r = await page.evaluate(() => {
    for (let i = 0; i < 30 * 12 && !game.warps.length; i++) update(game, 1 / 30);
    const w = game.warps[0];
    for (let i = 0; i < 30 * 4; i++) update(game, 1 / 30);
    const u = game.ents.find(e => e.kind === 'u' && e.side === 0 && e.type === 'shardling');
    cam.x = (w ? w.u : hqPos(0).u) - 60; clampCam(); render(ctx, game, game.t, sel, selPad);
    return { w: w && { u: w.u, v: w.v }, unit: u && { u: u.u, v: u.v }, base: ctlBase(0), front: defaultWarp(game, 0), mark: warpAt(game, 0) };
  });
  return { page, errors, card, ...r };
}

test('b6f (Part C): a human Axiarch player\'s trained unit warps in beside the base rally point; a set warp point is kept; off, the front edge', { skip }, async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const d = (a, b) => Math.hypot(a.u - b.u, a.v - b.v);
  const on = await trainOne(null);
  assert.match(on.card, /Base/);
  assert.ok(on.w && on.unit, JSON.stringify(on));
  assert.ok(d(on.w, on.mark) < 60 && d(on.w, on.base) < d(on.front, on.base) - 150, `beside the base: ${JSON.stringify({ w: on.w, base: on.base, front: on.front })}`);
  assert.ok(d(on.unit, on.base) < d(on.front, on.base) - 150, 'the unit stands there after arriving');
  await on.page.screenshot({ path: path.join(OUT, 'warp6f-base.png') });
  assert.deepStrictEqual(on.errors, []); await on.page.close();
  const set = await trainOne(null, { du: -20, dv: 10 }), sp = await set.page.evaluate(() => game.sides[0].warp);
  assert.match(set.card, /Moved/); assert.ok(d(set.w, sp) < 60, `the set point: ${JSON.stringify([set.w, sp])}`);
  assert.deepStrictEqual(set.errors, []); await set.page.close();
  const off = await trainOne({ b6f: false, b6g: false, b6h: false, b6hbody: false, b6hnode: false });
  assert.match(off.card, /Front/); assert.ok(d(off.w, off.front) < 60, `b6f off: the front edge: ${JSON.stringify({ w: off.w, front: off.front })}`);
  assert.deepStrictEqual(off.errors, []); await off.page.close();
});
