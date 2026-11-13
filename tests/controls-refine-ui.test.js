// v2.76+ (docs/CONTROLS.md, the refinements after the Three-Lane playtest) in headless Chromium, with real taps and drags:
// the base rally point and spacing (no two units on one spot), units stopping to engage while moving and Retreat not
// engaging, All and tapping a lane; v2.77: the Attack lane picker (its highlight, cancelling it) and tapping an enemy to
// target it; v2.78: double-tap selecting only on-screen units of the type, the rectangle box; v2.79: control groups (saving,
// selecting, camera jumps, after units die and after a save and load).
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

async function start(page, map) {
  await page.click('#bPlay'); await page.click(`.mapc[data-m="${map}"]`); await page.click('#bMapGo'); await page.waitForTimeout(250);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; camTouched = true; closePanel(); for (const t of document.querySelectorAll('#toasts > *')) t.remove(); const tip = document.getElementById('tipLanes'); if (tip) tip.remove(); });
}
const HELPERS = () => {
  window.__scr = id => { const e = game.ents.concat(game.guards || []).find(x => x.id === id), p = uScreen(e), r = cv.getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; };
  window.__gscr = (u, v) => { const r = cv.getBoundingClientRect(), w = P(u, v); return [r.left + (w.x - cam.x) * V.S + V.cw / 2, r.top + (w.y - YB()) * V.S + V.A]; };
  window.__run = s => { for (let i = 0; i < Math.round(s * 60); i++) update(game, TICK); refreshUI(true); };
  window.__look = (u, v) => { cam.x = u; cam.vx = 0; if (CAMY.max > CAMY.min) cam.y = v * DY - (Y_TOP + Y_BOT) / 2; clampCam(); };
  window.__spaced = ids => { // the closest pair of these units, as on screen, against the sum of their footprints (same layer only)
    const us = game.ents.filter(e => ids.includes(e.id)); let worst = 1e9;
    for (let i = 0; i < us.length; i++) for (let j = i + 1; j < us.length; j++) { const a = us[i], b = us[j]; if (!!UDEF[a.type].air !== !!UDEF[b.type].air) continue; worst = Math.min(worst, Math.hypot(a.u - b.u, (a.v - b.v) * DY) - ctlFoot(a.type) - ctlFoot(b.type)); }
    return worst;
  };
};
const tapUnit = async (page, id) => { const [x, y] = await page.evaluate(i => __scr(i), id); await page.mouse.click(x, y); await page.waitForTimeout(60); };
const tapGround = async (page, u, v) => { const [x, y] = await page.evaluate(([a, b]) => __gscr(a, b), [u, v]); await page.mouse.click(x, y); await page.waitForTimeout(60); return [x, y]; };
const selIds = page => page.evaluate(() => [...SELN].sort((a, b) => a - b));
const clearToasts = page => page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); });

for (const map of ['threelane', 'classic']) test(`${map}: new units gather at the base rally point, each in its own space; a moved group spreads out too`, { skip }, async () => {
  const { page, errors } = await openPage(browser, map === 'classic' ? NARROW : PHONE);
  await start(page, map); await page.evaluate(HELPERS);
  await page.evaluate(() => { const s = game.sides[0]; s.res.c = 1e5; s.res.e = 1e5; tryBuild(game, 0, 'barracks', 0); tryBuild(game, 0, 'barracks', 1); for (const b of game.ents) if (b.kind === 'b' && b.side === 0) { b.built = true; b.progress = 1; b.hp = b.maxHp; } refreshUI(true); });
  await page.click('.tabs [data-tab="train"]');
  for (let i = 0; i < 10; i++) await page.click('#cards .card[data-type="rifle"]');
  await page.evaluate(() => __run(60));
  const R = await page.evaluate(() => { const B = ctlBase(0), us = myUnits(); return { n: us.length, ids: us.map(e => e.id), hold: us.every(e => e.po.o === 'hold'), far: Math.max(...us.map(e => Math.hypot(e.u - B.u, e.v - B.v))), worst: __spaced(us.map(e => e.id)), walls: us.some(e => NAV.on && navShut(e.u, e.v)) }; });
  assert.ok(R.n >= 8, `trained ${R.n}`); assert.ok(R.hold, 'waiting on Hold');
  assert.ok(R.far < 110, `gathered at the base rally point (farthest ${R.far.toFixed(0)})`);
  assert.ok(R.worst >= -2, `no two on one spot: each its own space (worst overlap ${R.worst.toFixed(1)})`); assert.ok(!R.walls, 'none inside a wall');
  // all of them moved to one tapped spot: they spread out there too
  await page.click('#lanes [data-k="all"]'); await page.evaluate(() => __look(760, 0));
  await tapGround(page, 760, 0); await page.evaluate(() => __run(25));
  const M = await page.evaluate(ids => ({ worst: __spaced(ids), hold: myUnits().every(e => e.po.o === 'hold') }), R.ids);
  assert.ok(M.hold, 'arrived and holding'); assert.ok(M.worst >= -2, `spread at the tapped spot (worst overlap ${M.worst.toFixed(1)})`);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('moving units stop to engage enemies they meet; Retreat ignores them and holds fire', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await start(page, 'classic'); await page.evaluate(HELPERS);
  const I = await page.evaluate(() => {
    __look(640, 0); const mine = [0, 1, 2, 3].map(i => { const e = spawnUnit(game, 0, i % 2 ? 'tank' : 'rifle', 520 + i * 18, (i % 2) * 30 - 15); e.hp = e.maxHp = 1e6; return e.id; });
    const foe = spawnUnit(game, 1, 'rifle', 700, 0); foe.hp = foe.maxHp = 1e6; foe.holdU = 700; foe.holdV = 0; game.sides[1].stance = 'hold';
    refreshUI(true); return { mine, foe: foe.id };
  });
  await page.click('#lanes [data-k="all"]');
  await tapGround(page, 900, 0); // past the enemy
  const E = await page.evaluate(foe => { let shot = 0, minU = 1e9; for (let i = 0; i < 60 * 8; i++) { update(game, TICK); for (const e of myUnits()) if (e.po.o === 'go' && e.tgt === foe) shot++; } for (const e of myUnits()) minU = Math.min(minU, e.u); refreshUI(true); return { shot, max: Math.max(...myUnits().map(e => e.u)), po: myUnits().map(e => e.po.o) }; }, I.foe);
  assert.ok(E.shot > 0, 'they fire at the enemy they meet on the way');
  assert.ok(E.max < 900 - 40 && E.po.includes('go'), `and stop to fight instead of walking past (furthest ${E.max | 0})`);
  // Retreat: back to the base rally point, never firing, never stopping
  await page.click('#lanes [data-k="all"]'); await page.click('#cmdbar [data-c="retreat"]');
  const R = await page.evaluate(() => { let shot = 0; for (let i = 0; i < 60 * 30 && myUnits().some(e => e.po.o === 'retreat'); i++) { update(game, TICK); for (const e of myUnits()) if (e.po.o === 'retreat' && e.tgt) shot++; } const B = ctlBase(0); refreshUI(true); return { shot, home: myUnits().every(e => e.po.o === 'hold' && Math.hypot(e.u - B.u, e.v - B.v) < 80) }; });
  assert.strictEqual(R.shot, 0, 'Retreat holds fire'); assert.ok(R.home, 'and reaches the base rally point, holding');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('All selects the whole army; tapping a lane selects the units in it (base units count toward All only); Classic: All only', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await start(page, 'threelane'); await page.evaluate(HELPERS);
  const I = await page.evaluate(() => {
    const at = (t, u, v) => { const e = spawnUnit(game, 0, t, u, v); e.hp = e.maxHp = 1e6; return e.id; };
    const out = { n: [at('rifle', 760, -400), at('tank', 800, -380)], c: [at('rifle', 760, 0)], s: [at('heavy', 760, 400), at('rifle', 790, 380), at('sniper', 820, 410)], base: [at('rifle', 470, 10), at('rifle', 500, -20)] };
    refreshUI(true); return out;
  });
  assert.deepStrictEqual(await page.evaluate(() => [...document.querySelectorAll('#lanes button')].map(b => b.textContent)), ['All8', 'North2', 'Centre1', 'South3']);
  await page.click('#lanes [data-k="all"]'); assert.strictEqual((await selIds(page)).length, 8, 'All: everyone');
  await page.click('#selX'); await page.click('#lanes [data-k="2"]');
  assert.deepStrictEqual(await selIds(page), [...I.s].sort((a, b) => a - b), 'South: its three');
  await page.click('#lanes [data-k="0"]');
  assert.deepStrictEqual(await selIds(page), [...I.s, ...I.n].sort((a, b) => a - b), 'North adds its two');
  await page.click('#selX');
  await page.evaluate(() => { game.over = true; running = false; showStart(); });
  await start(page, 'classic');
  assert.deepStrictEqual(await page.evaluate(() => [...document.querySelectorAll('#lanes button')].map(b => b.dataset.k)), ['all'], 'Classic: All only');
  assert.deepStrictEqual(errors, []);
  await page.close();
});
