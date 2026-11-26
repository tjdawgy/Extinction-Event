// v2.99 (batch 6i) in a real browser at 667×375: each new Bloomspire unit and effect seen in a running match, with a screenshot of
// each. Screenshots: tests/screenshots/rework6i-*.png (docs/screenshots with EE_DOC_SHOTS=1): flock (three Razorwing flocks against
// Gunships), gnatcloud (a cloud over Marines), blight (Blightwings coning Marines, blighted spores, Mites), snatch (a Talonmaw
// carrying a Marine), rend (a Talonmaw rending a Tank), skywyrm (a Skywyrm's spew on Turrets and a tendril dragging a Gunship),
// codex (the Bloomspire's tree), and the Train card of a T1 Bloomspire (a flock).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright(), skip = !pw && 'Playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const OUT = process.env.EE_DOC_SHOTS ? path.join(__dirname, '..', 'docs', 'screenshots') : path.join(__dirname, 'screenshots');

async function match(me, foe, map = 'classic') {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click(`#meSeg [data-f="${me}"]`); await page.click(`#foeSeg [data-f="${foe}"]`); await page.click('#bPlay');
  await page.click(`.mapc[data-m="${map}"]`); await page.click('#bMapGo'); await page.waitForTimeout(300);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } paused = true; setStance(game, 1, 'hold'); });
  return { page, errors };
}
const shot = async (page, name, at) => {
  await page.evaluate(([u, v]) => { $('toasts').innerHTML = ''; for (const f of game.fog) { f.vis.fill(1); f.exp.fill(1); } camJump(u, v); render(ctx, game, game.t, sel, selPad); }, at);
  fs.mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: path.join(OUT, `rework6i-${name}.png`) });
};
const scene = (page, src, arg) => page.evaluate(src, arg);

test('b6i: three Razorwing flocks dive on Gunships', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  const r = await scene(page, () => {
    const g = game, u0 = 900, us = [];
    for (let i = 0; i < 9; i++) us.push(spawnUnit(g, 0, 'razor6', u0 + (i % 3) * 16, (Math.floor(i / 3) - 1) * 26));
    for (let i = 0; i < 2; i++) { const e = spawnUnit(g, 1, 'aircraft', u0 + 160, (i - 0.5) * 40); e.holdU = e.u; e.holdV = e.v; }
    update(g, TICK); command(g, 0, us.map(e => e.id), 'attack');
    for (let i = 0; i < 60 * 2.2; i++) update(g, TICK);
    return { n: us.filter(e => e.hp > 0).length, fl: Math.max(...us.map(e => e.fl6N || 0)), u: us[0].u };
  });
  assert.ok(r.n >= 6 && r.fl >= 2, JSON.stringify(r));
  await shot(page, 'flock', [r.u + 50, 0]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6i: a Gnatcloud settles over Marines and eats them', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  const r = await scene(page, () => {
    const g = game, u0 = 900, c = spawnUnit(g, 0, 'gnatcloud', u0, 0), c2 = spawnUnit(g, 0, 'gnatcloud', u0 - 10, 30); ctlHold(c, u0, 0);
    const ms = []; for (let i = 0; i < 6; i++) { const e = spawnUnit(g, 1, 'rifle', u0 + 90 + (i % 2) * 14, (i - 2.5) * 16); e.holdU = e.u; e.holdV = e.v; ms.push(e); }
    update(g, TICK); command(g, 0, [c.id, c2.id], 'attack');
    for (let i = 0; i < 60 * 3.5; i++) update(g, TICK);
    return { eaten: Math.round((g.sides[0].i6 || {}).gnat || 0), u: c.u };
  });
  assert.ok(r.eaten > 0, JSON.stringify(r));
  await shot(page, 'gnatcloud', [r.u, 0]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6i: Blightwings cone Marines; blighted spores; a blighted Marine bursts into Mites', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  const r = await scene(page, () => {
    const g = game, u0 = 900, bs = [spawnUnit(g, 0, 'blightwing', u0, -20), spawnUnit(g, 0, 'blightwing', u0, 20)]; for (const b of bs) ctlHold(b, b.u, b.v);
    const ks = []; for (let i = 0; i < 8; i++) ks.push(spawnUnit(g, 0, 'skitterling', u0 + 40 + (i % 4) * 10, (i - 3.5) * 10));
    for (let i = 0; i < 8; i++) { const e = spawnUnit(g, 1, 'rifle', u0 + 110 + (i % 2) * 14, (i - 3.5) * 16); e.holdU = e.u; e.holdV = e.v; }
    update(g, TICK); command(g, 0, ks.map(e => e.id), 'attack');
    let mites = 0; for (let i = 0; i < 60 * 14 && !mites; i++) { update(g, TICK); mites = (g.sides[0].i6 || {}).bMites || 0; }
    for (let i = 0; i < 20; i++) update(g, TICK);
    return { mites, bl: g.ents.filter(e => e.bl6T > g.t).length, u: bs[0].u };
  });
  assert.ok(r.mites >= 1, JSON.stringify(r));
  await shot(page, 'blight', [r.u + 70, 0]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6i: a Talonmaw snatches a Marine and rends a Tank', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  const r = await scene(page, () => {
    const g = game, u0 = 900, t = spawnUnit(g, 0, 'talonmaw', u0, 0);
    for (let i = 0; i < 4; i++) { const e = spawnUnit(g, 1, 'rifle', u0 + 70 + i * 12, (i - 1.5) * 18); e.holdU = e.u; e.holdV = e.v; }
    update(g, TICK); command(g, 0, [t.id], 'attack');
    let held = 0; for (let i = 0; i < 60 * 8 && !held; i++) { update(g, TICK); if (t.snV6) held = 1; }
    for (let i = 0; i < 20; i++) update(g, TICK);
    return { held, u: t.u };
  });
  assert.ok(r.held, 'a Marine in its talons');
  await shot(page, 'snatch', [r.u, 0]);
  const r2 = await scene(page, () => {
    const g = game, u0 = 640, t = spawnUnit(g, 0, 'talonmaw', u0, 0), k = spawnUnit(g, 1, 'tank', u0 + 70, 0); k.holdU = k.u; k.holdV = k.v;
    update(g, TICK); command(g, 0, [t.id], 'attack');
    let rent = 0; for (let i = 0; i < 60 * 8 && !rent; i++) { update(g, TICK); if (k.rn6T > g.t) rent = 1; }
    for (let i = 0; i < 6; i++) update(g, TICK);
    return { rent, u: k.u };
  });
  assert.ok(r2.rent, 'rent');
  await shot(page, 'rend', [r2.u - 20, 0]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6i: a Skywyrm spews acid on Turrets and drags a Gunship with a tendril', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  const r = await scene(page, () => {
    const g = game, u0 = 1000, w = spawnUnit(g, 0, 'skywyrm', u0, 0); ctlHold(w, u0, 0);
    const tb = mkBuilding(g, 1, 'turret', -1); tb.u = u0 + 170; tb.v = 10; tb.built = true; tb.progress = 1; tb.hp = tb.maxHp;
    const a = spawnUnit(g, 1, 'aircraft', u0 + 150, -60); a.holdU = a.u; a.holdV = a.v;
    let drag = 0, spew = 0; for (let i = 0; i < 60 * 6 && !(drag && spew); i++) { update(g, TICK); if (a.dr6 && g.t - a.dr6.t0 > 0.7) drag = 1; spew = (g.sides[0].i6 || {}).spewB || 0; }
    return { drag, spew, hp: Math.round(tb.hp), u: w.u };
  });
  assert.ok(r.drag, JSON.stringify(r));
  await shot(page, 'skywyrm', [r.u + 80, 0]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6i: the Codex shows the new Bloomspire tree and the Razorwing flock; the cut units are gone', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  const r = await page.evaluate(() => { openCodex('bloomhost', 'tree:techlab'); const el = document.getElementById('cx-t-techlab'); return { t: el ? el.textContent : '', cut: ['needlewing', 'cloudwing', 'broodtyrant', 'worldrender', 'razorwing'].filter(t => document.getElementById('cx-u-' + t)), nu: ['razor6', 'gnatcloud', 'blightwing', 'talonmaw', 'skywyrm'].filter(t => document.getElementById('cx-u-' + t)), flock: (document.getElementById('cx-u-razor6') || {}).textContent || '' }; });
  for (const n of ['Gnatcloud', 'Blightwing', 'Talonmaw', 'Skywyrm']) assert.ok(r.t.includes(n), n + ' in the tree: ' + r.t);
  assert.deepStrictEqual(r.cut, []); assert.strictEqual(r.nu.length, 5); assert.ok(/flock of 3/.test(r.flock), r.flock);
  await page.waitForTimeout(300); fs.mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: path.join(OUT, 'rework6i-codex.png') });
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6i: a T1 Bloomspire\'s Train card is a Razorwing flock (FLOCK ×3); the Test Range has both switches', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  await page.evaluate(() => { const fin = () => { for (const b of game.ents) if (b.kind === 'b' && b.side === 0) { b.built = true; b.progress = 1; b.hp = b.maxHp; } }; tryBuild(game, 0, 'barracks', 0); fin(); tryBuild(game, 0, 'techlab', 1); fin(); paused = false; refreshUI(true); });
  await page.click('.tabs [data-tab="train"]'); await page.waitForTimeout(150);
  const cards = await page.$$eval('#cards .card', c => c.map(x => [x.dataset.type, x.textContent]));
  const fl = cards.find(c => c[0] === 'razor6'); assert.ok(fl && /FLOCK ×3/.test(fl[1]), JSON.stringify(cards));
  assert.ok(!cards.some(c => c[0] === 'razorwing'));
  const keys = await page.evaluate(() => TR_RW.map(x => x[0])); assert.ok(keys.includes('b6i') && keys.includes('b6iresp'));
  assert.deepStrictEqual(errors, []); await page.close();
});
