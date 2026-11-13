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

// v2.77
for (const dev of [PHONE, NARROW]) test(`the Attack lane picker at ${dev.width}×${dev.height}: the lanes as buttons, the nearest highlighted; a lane attacks down it; a tap elsewhere cancels`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  await start(page, 'threelane'); await page.evaluate(HELPERS);
  const I = await page.evaluate(() => {
    const at = (u, v) => { const e = spawnUnit(game, 0, 'rifle', u, v); e.hp = e.maxHp = 1e6; return e.id; };
    __look(760, 300); const out = { s: [at(740, 400), at(760, 380), at(780, 410)], n: at(760, -400) }; refreshUI(true); return out;
  });
  await page.click('#lanes [data-k="2"]'); await page.click('#lanes [data-k="0"]'); // three in the south, one in the north
  assert.strictEqual((await selIds(page)).length, 4);
  await page.click('#cmdbar [data-c="attack"]');
  const P_ = await page.evaluate(() => {
    const box = $('lpick').querySelector('.lpbox').getBoundingClientRect(), bar = $('cmdbar').getBoundingClientRect();
    const bs = [...document.querySelectorAll('#lpick button')].map(b => { const q = b.getBoundingClientRect(), h = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return { k: b.dataset.k, near: b.classList.contains('near'), txt: b.textContent, w: q.width, h: q.height, t: q.top, hit: h === b || b.contains(h) }; });
    return { open: !$('lpick').classList.contains('hide'), bs, box: { l: box.left, r: box.right, t: box.top, b: box.bottom }, barTop: bar.top, hudB: $('hud').getBoundingClientRect().bottom, W: innerWidth, H: innerHeight, orders: myUnits().map(e => e.po.o) };
  });
  assert.ok(P_.open, 'the picker is open'); assert.deepStrictEqual(P_.bs.map(b => b.k), ['0', '1', '2'], 'North, Centre, South');
  assert.deepStrictEqual(P_.bs.map(b => b.near), [false, false, true], 'South (where most of them are) is highlighted');
  for (const b of P_.bs) assert.ok(b.w >= 44 && b.h >= 44 && b.hit, `a 44 pt, uncovered button ${JSON.stringify(b)}`);
  for (let k = 1; k < 3; k++) assert.ok(P_.bs[k].t > P_.bs[k - 1].t, 'stacked as on the map');
  assert.ok(P_.box.l >= 0 && P_.box.r <= P_.W && P_.box.t >= P_.hudB && P_.box.b <= P_.barTop, `on screen, above the command bar, below the top bar ${JSON.stringify(P_.box)}`);
  assert.ok(P_.orders.every(o => o === 'hold'), 'nothing ordered yet');
  await page.evaluate(() => drawNow()); await page.waitForTimeout(50);
  // a tap elsewhere cancels: the picker closes, the selection stays, nobody moves
  await page.mouse.click(P_.box.r + 120 < P_.W ? P_.box.r + 120 : 120, 140);
  assert.ok(await page.isHidden('#lpick'), 'cancelled'); assert.strictEqual((await selIds(page)).length, 4, 'the selection stays');
  assert.ok(await page.evaluate(() => myUnits().every(e => e.po.o === 'hold')), 'nobody ordered by the cancelling tap');
  // Attack again, then North: all four attack down the north lane
  await page.click('#cmdbar [data-c="attack"]'); await page.click('#lpick button[data-k="0"]');
  assert.ok(await page.isHidden('#lpick')); assert.deepStrictEqual(await selIds(page), [], 'the selection clears after the order');
  assert.deepStrictEqual(await page.evaluate(() => myUnits().map(e => [e.po.o, e.lane])), [['attack', 0], ['attack', 0], ['attack', 0], ['attack', 0]]);
  await page.evaluate(() => __run(40));
  const W = await page.evaluate(S => myUnits().filter(e => S.includes(e.id)).map(e => [e.u | 0, e.v | 0]), I.s);
  assert.ok(W.every(([u, v]) => u > 900 && v < -250), `the south three crossed over and went down the north lane ${JSON.stringify(W)}`);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('Classic: Attack goes at once, no picker', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await start(page, 'classic'); await page.evaluate(HELPERS);
  await page.evaluate(() => { for (let i = 0; i < 3; i++) spawnUnit(game, 0, 'rifle', 520 + i * 20, 0); refreshUI(true); });
  await page.click('#lanes [data-k="all"]'); await page.click('#cmdbar [data-c="attack"]');
  assert.ok(await page.isHidden('#lpick'));
  assert.ok(await page.evaluate(() => myUnits().every(e => e.po.o === 'attack')));
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('tapping an enemy targets it: unit, building; then Hold where they are; with nothing selected an enemy tap does nothing', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await start(page, 'classic'); await page.evaluate(HELPERS);
  const I = await page.evaluate(() => {
    __look(760, 0); const mine = [0, 1, 2].map(i => spawnUnit(game, 0, 'tank', 640 + i * 20, -30 + i * 30).id);
    const foe = spawnUnit(game, 1, 'rifle', 830, 30); foe.holdU = 830; foe.holdV = 30; game.sides[1].stance = 'hold';
    const near = spawnUnit(game, 1, 'heavy', 860, -60); near.hp = near.maxHp = 1e6; near.holdU = 860; near.holdV = -60;
    updateVision(game); refreshUI(true); drawNow(); return { mine, foe: foe.id, near: near.id };
  });
  // nothing selected: tapping the enemy does nothing
  await tapUnit(page, I.foe);
  assert.deepStrictEqual(await selIds(page), []); assert.ok(await page.evaluate(() => myUnits().every(e => e.po.o === 'hold')));
  // select all, tap the enemy rifleman: they target it
  await page.click('#lanes [data-k="all"]'); await tapUnit(page, I.foe);
  assert.deepStrictEqual(await selIds(page), [], 'cleared after the order');
  assert.deepStrictEqual(await page.evaluate(f => myUnits().map(e => [e.po.o, e.po.id === f]), I.foe), [['target', true], ['target', true], ['target', true]]);
  const first = await page.evaluate(f => { let first = 0; for (let i = 0; i < 60 * 20 && game.ents.some(e => e.id === f && e.hp > 0); i++) { update(game, TICK); if (!first) { const s = myUnits().find(e => e.tgt); if (s) first = s.tgt; } } __run(1); return first; }, I.foe);
  assert.strictEqual(first, I.foe, 'the target is fired at first, though another enemy is about as close');
  assert.ok(await page.evaluate(f => !game.ents.some(e => e.id === f && e.hp > 0), I.foe), 'it is destroyed');
  assert.ok(await page.evaluate(() => myUnits().every(e => e.po.o === 'hold' || (e.po.o === 'go' && Math.hypot(e.po.u - e.u, e.po.v - e.v) < 30))), 'then Hold where they are');
  // an enemy building
  const B = await page.evaluate(() => { const s = game.sides[1]; s.res.c = 1e5; tryBuild(game, 1, 'barracks', 4); const b = game.ents.find(e => e.kind === 'b' && e.side === 1 && e.type === 'barracks'); b.built = true; b.progress = 1; b.hp = 400; for (const e of game.ents) if (e.kind === 'u' && e.side === 1) e.hp = 0; for (const e of myUnits()) { e.hp = e.maxHp = 1e6; e.u = b.u - 200 - (e.id % 3) * 15; e.po = { o: 'hold' }; e.holdU = e.u; e.holdV = e.v; } updateVision(game); __look(b.u - 80, b.v); refreshUI(true); drawNow(); return { id: b.id, u: b.u, v: b.v }; });
  await page.click('#lanes [data-k="all"]');
  const [bx, by] = await page.evaluate(([u, v]) => __gscr(u, v - 30), [B.u, B.v]); await page.mouse.click(bx, by); await page.waitForTimeout(60);
  assert.ok(await page.evaluate(id => myUnits().every(e => e.po.o === 'target' && e.po.id === id), B.id), 'a tap on the enemy building targets it');
  await page.evaluate(() => drawNow()); await page.waitForTimeout(80);
  await page.evaluate(id => { for (let i = 0; i < 60 * 40 && game.ents.some(e => e.id === id && e.hp > 0); i++) update(game, TICK); __run(1); }, B.id);
  assert.ok(await page.evaluate(id => !game.ents.some(e => e.id === id && e.hp > 0), B.id), 'destroyed');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

// v2.78
test('double-tap a unit: only your units of that type on screen are selected, at once (no wait for a third tap)', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await start(page, 'threelane'); await page.evaluate(HELPERS);
  const I = await page.evaluate(() => {
    __look(620, 0); const at = (t, u, v) => spawnUnit(game, 0, t, u, v).id;
    const out = { on: [at('rifle', 560, -20), at('rifle', 610, 30), at('rifle', 660, -40)], tank: at('tank', 600, 0), off: [at('rifle', 1700, -400), at('rifle', 1750, 400)], foe: spawnUnit(game, 1, 'rifle', 700, 0).id };
    for (const e of game.ents) if (e.kind === 'u') e.hp = e.maxHp = 1e6; refreshUI(true); return out;
  });
  const off = await page.evaluate(ids => ids.map(i => { const [x] = __scr(i); return x > innerWidth; }), I.off);
  assert.deepStrictEqual(off, [true, true], 'two Riflemen are off screen');
  const [x, y] = await page.evaluate(i => __scr(i), I.on[1]);
  await page.mouse.dblclick(x, y);
  assert.deepStrictEqual(await selIds(page), [...I.on].sort((a, b) => a - b), 'only the three on screen (not the Tank, not the enemy, not the far two)');
  await page.mouse.click(...(await page.evaluate(i => __scr(i), I.tank))); // the next tap adds, right away
  assert.strictEqual((await selIds(page)).length, 4);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

for (const dev of [PHONE, NARROW]) test(`the rectangle box at ${dev.width}×${dev.height}: hold, then drag corner to corner; the units inside are selected, not the ones outside`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  await start(page, 'threelane'); await page.evaluate(HELPERS);
  const I = await page.evaluate(() => {
    __look(760, 0); const at = (t, u, v) => spawnUnit(game, 0, t, u, v).id;
    const out = { inside: [at('rifle', 700, -40), at('tank', 740, 0), at('heavy', 780, 30)], outside: [at('rifle', 640, 90), at('rifle', 880, -60)], foe: spawnUnit(game, 1, 'rifle', 760, 20).id };
    for (const e of game.ents) if (e.kind === 'u') e.hp = e.maxHp = 1e6; refreshUI(true); return out;
  });
  const box = await page.evaluate(ids => { const p = ids.map(i => __scr(i)); return [Math.min(...p.map(q => q[0])) - 18, Math.min(...p.map(q => q[1])) - 16, Math.max(...p.map(q => q[0])) + 18, Math.max(...p.map(q => q[1])) + 22]; }, I.inside);
  const out = await page.evaluate(ids => ids.map(i => __scr(i)), I.outside);
  const [l, t, r, b] = box; for (const [x, y] of out) assert.ok(x < l || x > r || y < t || y > b, 'the outside units really are outside');
  await page.mouse.move(l, t); await page.mouse.down(); await page.waitForTimeout(380);
  await page.mouse.move((l + r) / 2, (t + b) / 2, { steps: 5 });
  await page.mouse.move(r, b, { steps: 5 });
  const mid = await page.evaluate(() => ({ box: !!(gest && gest.box), cam: cam.x }));
  assert.ok(mid.box, 'mid-drag: a box, not a scroll'); assert.strictEqual(mid.cam, 760, 'the camera stays put');
  await page.mouse.up(); await page.waitForTimeout(80);
  assert.deepStrictEqual(await selIds(page), [...I.inside].sort((a, c) => a - c), 'the units inside the box, never the enemy, not the ones outside');
  // a quick drag still scrolls; a box with nothing of yours selects nothing
  await page.click('#selX'); const c0 = await page.evaluate(() => cam.x);
  await page.mouse.move(500, 200); await page.mouse.down(); await page.mouse.move(380, 205, { steps: 4 }); await page.mouse.up();
  assert.ok(await page.evaluate(c => Math.abs(cam.x - c) > 40, c0), 'a quick drag scrolls'); assert.deepStrictEqual(await selIds(page), []);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

// v2.79
const holdSlot = async (page, k, ms = 650) => { const q = await page.evaluate(i => { const r = document.querySelector(`#grps [data-g="${i}"]`).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, k); await page.mouse.move(...q); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); await page.waitForTimeout(60); };
const slotN = page => page.evaluate(() => [...document.querySelectorAll('#grps i')].map(i => i.textContent));

test('control groups: hold to save (with a confirmation), tap to select, double-tap to jump; the dead drop out, new units are not added; save and load keep them', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await start(page, 'threelane'); await page.evaluate(HELPERS);
  const I = await page.evaluate(() => { __look(760, 0); const ids = [0, 1, 2, 3].map(i => spawnUnit(game, 0, i % 2 ? 'tank' : 'rifle', 700 + i * 30, (i % 2) * 40 - 20).id); const far = spawnUnit(game, 0, 'rifle', 1300, 400).id; refreshUI(true); return { ids, far }; });
  assert.deepStrictEqual(await slotN(page), ['–', '–', '–'], 'empty slots show a dash');
  // nothing selected: holding a slot only explains
  await holdSlot(page, 0); assert.deepStrictEqual(await slotN(page), ['–', '–', '–']);
  // save four into slot 2
  await clearToasts(page);
  for (const id of I.ids) await tapUnit(page, id);
  await page.waitForTimeout(400);
  await holdSlot(page, 1);
  assert.deepStrictEqual(await slotN(page), ['–', '4', '–']);
  assert.ok(await page.evaluate(() => document.querySelector('#grps [data-g="1"]').classList.contains('saved')), 'the slot flashes');
  assert.match(await page.textContent('#toasts'), /Group 2: 4 units/, 'and a toast confirms');
  assert.strictEqual((await selIds(page)).length, 4, 'saving keeps the selection');
  // tap: select the group (replacing the selection)
  await page.click('#selX'); await tapUnit(page, I.far); await page.waitForTimeout(400);
  await page.click('#grps [data-g="1"]');
  assert.deepStrictEqual(await selIds(page), [...I.ids].sort((a, b) => a - b), 'tap: the group, replacing the selection');
  // double-tap: jump the camera to the group
  await page.click('#selX'); await page.evaluate(() => __look(1600, 0)); await page.waitForTimeout(400);
  await page.dblclick('#grps [data-g="1"]');
  const cam = await page.evaluate(() => cam.x);
  assert.ok(Math.abs(cam - 745) < 80, `double-tap: the camera jumps to the group (${cam})`);
  assert.strictEqual((await selIds(page)).length, 4, 'and the group is selected');
  // a unit dies: the count drops; a new unit is never added
  await page.click('#selX');
  await page.evaluate(id => { game.ents.find(e => e.id === id).hp = 0; spawnUnit(game, 0, 'rifle', 720, 0); __run(0.2); }, I.ids[0]);
  assert.deepStrictEqual(await slotN(page), ['–', '3', '–']);
  await page.waitForTimeout(400); await page.click('#grps [data-g="1"]');
  assert.deepStrictEqual(await selIds(page), I.ids.slice(1).sort((a, b) => a - b), 'the dead dropped out, nothing added');
  await page.click('#selX');
  // save and load: the group survives
  await page.evaluate(() => saveGame());
  await page.reload(); await page.waitForTimeout(300);
  await page.click('#bResume'); await page.click('#bRes'); await page.evaluate(HELPERS);
  assert.deepStrictEqual(await slotN(page), ['–', '3', '–'], 'after save and load');
  await page.click('#grps [data-g="1"]');
  assert.deepStrictEqual(await selIds(page), I.ids.slice(1).sort((a, b) => a - b), 'and it selects the same units');
  await page.waitForTimeout(400); await page.click('#selX'); await page.evaluate(() => __look(1600, 0)); await page.dblclick('#grps [data-g="1"]');
  assert.ok(Math.abs(await page.evaluate(() => cam.x) - 760) < 90, 'and jumps to them');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

for (const dev of [PHONE, NARROW]) test(`control group slots at ${dev.width}×${dev.height}: 44 pt, on screen, uncovered, in the bottom panel in both views, on every map`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  for (const map of ['classic', 'twolane', 'threelane']) {
    if (map !== 'classic') await page.evaluate(() => { game.over = true; running = false; showStart(); });
    await start(page, map); await page.evaluate(HELPERS);
    for (const selecting of [false, true]) {
      if (selecting) await page.evaluate(() => { spawnUnit(game, 0, 'rifle', 520, 0); refreshUI(true); selAll(); });
      const R = await page.evaluate(() => {
        const pn = $('panel').getBoundingClientRect(), bar = $('cmdbar').getBoundingClientRect();
        return { W: innerWidth, H: innerHeight, pn: { l: pn.left, r: pn.right, t: pn.top, b: pn.bottom }, bar: { r: bar.right, vis: !$('cmdbar').classList.contains('hide') }, s: [...document.querySelectorAll('#grps button')].map(b => { const q = b.getBoundingClientRect(), h = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return { w: q.width, h: q.height, l: q.left, r: q.right, t: q.top, b: q.bottom, hit: h === b || b.contains(h) }; }) };
      });
      assert.strictEqual(R.s.length, 3);
      for (const s of R.s) {
        assert.ok(s.w >= 44 && s.h >= 44, `${map}: a slot is ${s.w}×${s.h}`); assert.ok(s.hit, `${map}${selecting ? ' (selecting)' : ''}: a slot is uncovered`);
        assert.ok(s.l >= R.pn.l && s.r <= R.pn.r && s.t >= R.pn.t && s.b <= R.pn.b && s.r <= R.W, `${map}: inside the bottom panel, on screen`);
        if (selecting) assert.ok(R.bar.vis && R.bar.r <= s.l + 1, `${map}: the command bar stops short of the slots`);
      }
    }
  }
  assert.deepStrictEqual(errors, []);
  await page.close();
});
