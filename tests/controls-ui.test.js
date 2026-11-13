// v2.74 (docs/CONTROLS.md) in headless Chromium, with real taps and drags: every way of selecting (tap, tap more, double-tap a
// unit, lasso, All, a lane), never enemies or relic guards; moving to a tapped spot; Attack, Hold and Retreat on a selection;
// healing at the base rally point and a held depot after being moved there, not elsewhere; new units gathering at the base
// rally point, each in its own space (v2.76: no lane flags, no active lane); a forward Barracks' units waiting beside it;
// clearing the selection; and the controls' size and fit at both iPhone sizes on every map (44 pt targets, nothing
// covered, key places on the field reachable clear of them).
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
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) s.aiT = 1e9; camTouched = true; closePanel(); for (const t of document.querySelectorAll('#toasts > *')) t.remove(); });
}
// In the page: where a unit or a ground point is on screen (page coordinates), and running the SIM for a while
const HELPERS = () => {
  window.__scr = id => { const e = game.ents.concat(game.guards || []).find(x => x.id === id), p = uScreen(e), r = cv.getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; };
  window.__gscr = (u, v) => { const r = cv.getBoundingClientRect(), w = P(u, v); return [r.left + (w.x - cam.x) * V.S + V.cw / 2, r.top + (w.y - YB()) * V.S + V.A]; };
  window.__run = s => { for (let i = 0; i < Math.round(s * 60); i++) update(game, TICK); refreshUI(true); };
  window.__look = (u, v) => { cam.x = u; cam.vx = 0; if (CAMY.max > CAMY.min) cam.y = v * DY - (Y_TOP + Y_BOT) / 2; clampCam(); };
};
const tapUnit = async (page, id) => { const [x, y] = await page.evaluate(i => __scr(i), id); await page.mouse.click(x, y); await page.waitForTimeout(60); };
const tapGround = async (page, u, v) => { const [x, y] = await page.evaluate(([a, b]) => __gscr(a, b), [u, v]); await page.mouse.click(x, y); await page.waitForTimeout(60); return [x, y]; };
async function lasso(page, x0, y0, x1, y1) { // v2.78: the rectangle box: hold, then drag from one corner to the other
  await page.mouse.move(x0, y0); await page.mouse.down(); await page.waitForTimeout(380);
  await page.mouse.move(x1, y1, { steps: 10 });
  await page.mouse.up(); await page.waitForTimeout(80);
}
const selIds = page => page.evaluate(() => [...SELN].sort((a, b) => a - b));

test('selecting: tap, tap more, double-tap a type, lasso, All, a lane; never enemies or relic guards; clearing', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await start(page, 'threelane'); await page.evaluate(HELPERS);
  const U = await page.evaluate(() => {
    __look(560, 0); const out = { mine: [], foe: [] };
    [['rifle', 520, -40], ['rifle', 560, -40], ['tank', 600, -40], ['tank', 520, 20], ['heavy', 560, 20], ['rifle', 600, 20]].forEach(([t, u, v]) => { const e = spawnUnit(game, 0, t, u, v); e.lane = 1; out.mine.push({ id: e.id, t }); });
    for (const [u, v] of [[670, -40], [680, 20]]) out.foe.push(spawnUnit(game, 1, 'rifle', u, v).id); // enemies in reach of the lasso
    game.sides[1].stance = 'hold'; for (const e of game.ents) if (e.kind === 'u') { e.hp = e.maxHp = 1e6; if (e.side === 1) { e.holdU = e.u; e.holdV = e.v; } } // nobody dies while the test taps
    refreshUI(true); return out;
  });
  const mine = U.mine.map(m => m.id);
  // nothing selected: no command bar; tapping empty ground does nothing
  assert.ok(await page.isHidden('#cmdbar'));
  await tapGround(page, 700, 150);
  assert.deepStrictEqual(await selIds(page), []); assert.ok(await page.evaluate(() => myUnits().every(e => e.po.o === 'hold')), 'nobody moved');
  // tap one, tap another: added
  await tapUnit(page, mine[0]); assert.deepStrictEqual(await selIds(page), [mine[0]]);
  assert.ok(await page.isVisible('#cmdbar')); assert.strictEqual(await page.textContent('#selN'), '1');
  await page.waitForTimeout(400); await tapUnit(page, mine[2]); assert.deepStrictEqual(await selIds(page), [mine[0], mine[2]]);
  // an enemy tapped: not selected (and nothing ordered: a tap on an enemy with a selection is a move there, so clear first)
  await page.click('#selX'); assert.deepStrictEqual(await selIds(page), []); assert.ok(await page.isHidden('#cmdbar'), 'the × clears it');
  await tapUnit(page, U.foe[0]); assert.deepStrictEqual(await selIds(page), [], 'an enemy is never selected');
  // double-tap a Rifleman: every Rifleman
  const [rx, ry] = await page.evaluate(i => __scr(i), mine[0]); await page.mouse.dblclick(rx, ry); await page.waitForTimeout(60);
  assert.deepStrictEqual(await selIds(page), U.mine.filter(m => m.t === 'rifle').map(m => m.id));
  await page.click('#selX');
  // lasso around everyone (enemies included in the loop): only the player's
  const box = await page.evaluate(ids => { const p = [...ids].map(i => __scr(i)); return [Math.min(...p.map(q => q[0])) - 30, Math.min(...p.map(q => q[1])) - 30, Math.max(...p.map(q => q[0])) + 30, Math.max(...p.map(q => q[1])) + 40]; }, mine.concat(U.foe));
  await lasso(page, ...box);
  assert.deepStrictEqual(await selIds(page), mine, 'the lasso takes your units, never the enemy\'s');
  // a quick drag scrolls instead
  await page.click('#selX'); const cx0 = await page.evaluate(() => cam.x);
  await page.mouse.move(500, 200); await page.mouse.down(); await page.mouse.move(400, 200, { steps: 4 }); await page.mouse.up();
  assert.ok(await page.evaluate(c => Math.abs(cam.x - c) > 50, cx0), 'a quick drag scrolls'); assert.deepStrictEqual(await selIds(page), []);
  // All; a lane (one tap: the units standing in it; units in the base count toward All only)
  await page.evaluate(() => { const e = spawnUnit(game, 0, 'sniper', 700, -380); e.hp = e.maxHp = 1e6; refreshUI(true); });
  assert.deepStrictEqual(await page.evaluate(() => [...document.querySelectorAll('#lanes i')].map(i => i.textContent)), ['7', '1', '0', '0'], 'All 7; North 1 (the rest are in the base)');
  await page.click('#lanes [data-k="all"]'); assert.strictEqual((await selIds(page)).length, 7);
  await page.click('#selX'); await page.click('#lanes [data-k="0"]');
  assert.deepStrictEqual(await page.evaluate(() => selLive().map(e => e.type)), ['sniper'], 'North: its units');
  // relic guards: a lasso around the west relic's guards selects none of them
  await page.click('#selX');
  const gbox = await page.evaluate(() => { const G = game.guards.filter(x => x.hp > 0 && Math.abs(x.u - 740) < 80); for (const x of G) game.fog[0].vis && 0; __look(740, -200); refreshUI(true); const p = G.map(x => __scr(x.id)); return [Math.min(...p.map(q => q[0])) - 30, Math.min(...p.map(q => q[1])) - 30, Math.max(...p.map(q => q[0])) + 30, Math.max(...p.map(q => q[1])) + 30]; });
  await lasso(page, ...gbox);
  assert.deepStrictEqual(await selIds(page), [], 'relic guards are never selected');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('dense groups: a tap picks the unit under it, and a lasso takes the whole clump', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await start(page, 'classic'); await page.evaluate(HELPERS);
  const ids = await page.evaluate(() => { __look(620, 0); const out = []; for (let i = 0; i < 16; i++) out.push(spawnUnit(game, 0, ['rifle', 'heavy', 'sniper', 'tank'][i % 4], 600 + (i % 4) * 9, -20 + Math.floor(i / 4) * 10).id); refreshUI(true); return out; });
  let ok = 0;
  for (const id of ids) { await page.click('#lanes [data-k="all"]'); await page.click('#selX'); await page.waitForTimeout(400); await tapUnit(page, id); const s = await selIds(page); if (s.length === 1) ok++; }
  assert.strictEqual(ok, ids.length, 'every tap in the clump selects exactly one unit');
  await page.click('#selX');
  const box = await page.evaluate(I => { const p = I.map(i => __scr(i)); return [Math.min(...p.map(q => q[0])) - 24, Math.min(...p.map(q => q[1])) - 24, Math.max(...p.map(q => q[0])) + 24, Math.max(...p.map(q => q[1])) + 30]; }, ids);
  await lasso(page, ...box);
  assert.strictEqual((await selIds(page)).length, 16);
  // the hit area is generous: a tap 20 px from a lone unit's body still takes it
  await page.click('#selX'); const lone = await page.evaluate(() => { const e = spawnUnit(game, 0, 'rifle', 760, 60); refreshUI(true); return e.id; });
  const [lx, ly] = await page.evaluate(i => __scr(i), lone); await page.waitForTimeout(400); await page.mouse.click(lx + 14, ly + 14);
  assert.deepStrictEqual(await selIds(page), [lone]);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('commands: move to a tapped spot (then Hold), Attack down the lane, Hold, Retreat to the base rally point; the selection clears after each', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await start(page, 'twolane'); await page.evaluate(HELPERS);
  const ids = await page.evaluate(() => { __look(650, -200); const out = []; for (let i = 0; i < 4; i++) { const e = spawnUnit(game, 0, 'rifle', 600 + i * 16, -260); e.lane = 0; out.push(e.id); } refreshUI(true); return out; });
  await page.click('#lanes [data-k="all"]');
  const [sx, sy] = await tapGround(page, 760, -300);
  const W = await page.evaluate(([x, y]) => { const r = cv.getBoundingClientRect(), w = toWorld(x - r.left, y - r.top); return [w.x, w.y / DY]; }, [sx, sy]);
  assert.deepStrictEqual(await selIds(page), [], 'cleared after the order');
  assert.ok(await page.evaluate(([u, v]) => myUnits().every(e => e.po.o === 'go' && Math.hypot(e.po.u - u, e.po.v - v) < 60), W), 'walking to the tapped spot');
  await page.evaluate(() => __run(12));
  assert.ok(await page.evaluate(([u, v]) => myUnits().every(e => e.po.o === 'hold' && Math.hypot(e.u - u, e.v - v) < 65), W), 'there, holding');
  // Attack: down the north lane
  await page.click('#lanes [data-k="all"]'); await page.click('#cmdbar [data-c="attack"]'); await page.click('#lpick button[data-k="0"]'); // v2.77: the lane picker
  assert.deepStrictEqual(await selIds(page), []);
  await page.evaluate(() => __run(6));
  assert.ok(await page.evaluate(() => myUnits().every(e => e.po.o === 'attack' && e.u > 860 && e.v < -150)), 'advancing down the north lane');
  // Hold: they stop
  await page.click('#lanes [data-k="all"]'); await page.click('#cmdbar [data-c="hold"]');
  const at = await page.evaluate(() => myUnits().map(e => e.u)); await page.evaluate(() => __run(3));
  assert.ok(await page.evaluate(a => myUnits().every((e, i) => e.po.o === 'hold' && Math.abs(e.u - a[i]) < 12), at), 'holding where they stood');
  // Retreat: to the base rally point
  await page.click('#lanes [data-k="all"]'); await page.click('#cmdbar [data-c="retreat"]');
  await page.evaluate(() => __run(30));
  assert.ok(await page.evaluate(() => { const F = ctlBase(0); return myUnits().every(e => e.po.o === 'hold' && Math.hypot(e.u - F.u, e.v - F.v) < 70); }), 'back at the base rally point, holding');
  void ids;
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('healing: at the base rally point and a held depot after being moved there, not elsewhere', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await start(page, 'threelane'); await page.evaluate(HELPERS);
  const I = await page.evaluate(() => {
    game.t = 300; const dep = game.nodes.find(n => n.type === 'repair' && n.v < 0); dep.owner = 0; dep.prog = 100;
    const mk = (u, v) => { const e = spawnUnit(game, 0, 'tank', u, v); e.lane = 0; e.hp = e.maxHp * 0.3; e.lastHurt = -99; return e.id; };
    __look(1100, -440); refreshUI(true);
    return { a: mk(1060, -420), b: mk(1000, -380), c: mk(950, -420), dep: [dep.u, dep.v] };
  });
  await tapUnit(page, I.a); await tapGround(page, ...I.dep); // to the depot
  await page.evaluate(() => __look(1000, -400)); await page.waitForTimeout(450); await tapUnit(page, I.b);
  const F = await page.evaluate(() => { const f = ctlBase(0); __look(f.u + 60, f.v); return [f.u, f.v]; });
  await tapGround(page, F[0] + 20, F[1] + 10); // to the base rally point
  await page.evaluate(() => __run(40));
  const hp = await page.evaluate(ids => ids.map(i => { const e = game.ents.find(x => x.id === i); return +(e.hp / e.maxHp).toFixed(2); }), [I.a, I.b, I.c]);
  assert.ok(hp[0] > 0.9, `healed at the held depot (${hp[0]})`);
  assert.ok(hp[1] > 0.6, `healed at the base rally point (${hp[1]})`);
  assert.strictEqual(hp[2], 0.3, 'left in the field: no healing');
  assert.ok(await page.evaluate(i => game.ents.find(x => x.id === i).po.o === 'hold', I.c), 'and nothing sent it home');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('new units: gathering at the base rally point on Hold, each in its own space; a forward Barracks\' units wait beside it', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await start(page, 'twolane'); await page.evaluate(HELPERS);
  await page.evaluate(() => { const s = game.sides[0]; s.res.c = 1e5; s.res.e = 1e5; tryBuild(game, 0, 'barracks', 0); for (const b of game.ents) if (b.kind === 'b' && b.side === 0) { b.built = true; b.progress = 1; b.hp = b.maxHp; } refreshUI(true); });
  assert.strictEqual(await page.evaluate(() => document.querySelectorAll('#lanes .act').length), 0, 'no active lane');
  await page.click('.tabs [data-tab="train"]'); assert.strictEqual(await page.$('#trto'), null, 'no "Training to"');
  for (let i = 0; i < 4; i++) await page.click('#cards .card[data-type="rifle"]');
  await page.evaluate(() => __run(50));
  const R = await page.evaluate(() => { const F = ctlBase(0), us = myUnits(); let md = 1e9; for (const a of us) for (const b of us) if (a !== b) md = Math.min(md, Math.hypot(a.u - b.u, (a.v - b.v) * DY)); return { n: us.length, md, at: us.map(e => [e.po.o, Math.round(Math.hypot(e.u - F.u, e.v - F.v))]) }; });
  assert.strictEqual(R.n, 4); for (const [o, d] of R.at) { assert.strictEqual(o, 'hold'); assert.ok(d < 70, `at the base rally point (${d})`); }
  assert.ok(R.md >= 14, `never on the same spot (closest ${R.md.toFixed(1)})`);
  await page.evaluate(() => __run(15));
  assert.ok(await page.evaluate(() => { const F = ctlBase(0); return myUnits().every(e => Math.hypot(e.u - F.u, e.v - F.v) < 70); }), 'still waiting: nothing moves on its own');
  // a forward Barracks on the north-west forward pad
  const fb = await page.evaluate(() => { const k = FWD_PADS.findIndex(p => p.at[0] < 1100 && p.at[1] < 0); game.nodes[FWD_PADS[k].node].owner = 0; const r = tryBuild(game, 0, 'barracks', FWD_SLOT + k); const b = game.ents.find(e => e.kind === 'b' && e.slot === FWD_SLOT + k); b.built = true; b.progress = 1; b.hp = b.maxHp; for (const x of game.ents) if (x.kind === 'b' && x.side === 0 && x.slot === 0) x.queue.length = 0; b.queue.push('rifle'); __run(15); return { ok: r.ok, u: b.u, v: b.v, units: myUnits().filter(e => Math.abs(e.u - b.u) < 120 && Math.abs(e.v - b.v) < 80).map(e => [e.po.o, e.lane]) }; });
  assert.ok(fb.ok); assert.deepStrictEqual(fb.units, [['hold', 0]], 'beside the forward Barracks, holding, in the north lane');
  await page.evaluate(() => __run(15));
  assert.ok(await page.evaluate(b => myUnits().filter(e => Math.abs(e.u - b.u) < 120 && Math.abs(e.v - b.v) < 80).length === 1, fb), 'still there');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('Classic: the All button only; the base rally point is a marker, not a control (no flags to move)', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await start(page, 'classic'); await page.evaluate(HELPERS);
  assert.deepStrictEqual(await page.evaluate(() => [...document.querySelectorAll('#lanes button')].map(b => b.dataset.k)), ['all']);
  const F = await page.evaluate(() => { const f = ctlBase(0); __look(f.u + 120, 0); return [f.u, f.v]; });
  const [fx, fy] = await page.evaluate(([u, v]) => __gscr(u, v), F); await page.mouse.click(fx + 8, fy - 20);
  assert.ok(await page.isHidden('#aim'), 'tapping the rally flag starts nothing'); assert.deepStrictEqual(await selIds(page), []);
  assert.strictEqual(await page.evaluate(() => game.sides[0].flags), undefined);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

for (const dev of [PHONE, NARROW]) test(`fit at ${dev.width}×${dev.height} on every map: 44 pt targets, nothing covered, key places reachable clear of the controls`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  for (const map of ['classic', 'twolane', 'threelane']) {
    if (map !== 'classic') { await page.evaluate(() => { game.over = true; running = false; showStart(); }); }
    await start(page, map); await page.evaluate(HELPERS);
    const tabs = await page.evaluate(() => [...document.querySelectorAll('.tabs button')].map(b => { const q = b.getBoundingClientRect(), h = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return { id: b.dataset.tab, w: q.width, h: q.height, hit: h === b }; }));
    for (const c of tabs) assert.ok(c.w >= 44 && c.h >= 44 && c.hit, `${map}: the ${c.id} tab ${JSON.stringify(c)}`);
    await page.evaluate(() => { for (let i = 0; i < 3; i++) spawnUnit(game, 0, 'rifle', 500 + i * 10, 0); refreshUI(true); selAll(); });
    const R = await page.evaluate(() => {
      const r = el => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
      const hit = el => { const b = el.getBoundingClientRect(), h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return h === el || el.contains(h); };
      const ctl = [...document.querySelectorAll('#lanes button, #cmdbar > button, #selX, #grps button')].filter(e => e.getClientRects().length);
      const hb = [...document.querySelectorAll('.hbtn')].map(b => { const q = b.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2; return [document.elementFromPoint(x, y - 21) === b, document.elementFromPoint(x, y + 21) === b]; });
      return { W: innerWidth, H: innerHeight, ctl: ctl.map(e => ({ id: e.id || e.dataset.k || e.dataset.c || e.dataset.tab, ...r(e), hit: hit(e) })), hb, lanes: r($('lanes')), panel: r($('panel')), abil: r($('abil')), hud: r($('hud')), alerts: r($('alerts')) };
    });
    for (const c of R.ctl) { assert.ok(c.w >= 44 && c.h >= 44, `${map}: ${c.id} is ${c.w}×${c.h}`); assert.ok(c.l >= 0 && c.r <= R.W && c.b <= R.H, `${map}: ${c.id} on screen`); assert.ok(c.hit, `${map}: ${c.id} uncovered`); }
    for (const [a, b] of R.hb) assert.ok(a && b, `${map}: speed and pause take a 44 pt tap`);
    assert.ok(R.lanes.r <= R.panel.l, 'the column sits left of the bottom panel'); assert.ok(R.lanes.t >= R.hud.b, 'below the top bar');
    assert.ok(R.alerts.l >= R.lanes.r, 'alerts sit right of the column');
    // the key places: each can be brought clear of every control (the camera centres it), and the home view shows the HQ clear of the column
    const spots = await page.evaluate(() => { const out = game.nodes.map(n => ({ k: n.type || 'income', u: n.u, v: n.v })); out.push({ k: 'hq', u: game.sides[0].hq.u, v: game.sides[0].hq.v }); out.push({ k: 'meteor', u: L / 2, v: MAP_LANED ? laneY(MAP.lanes[0], L / 2) : 0 }); return out; });
    const covered = await page.evaluate(S => {
      const boxes = ['lanes', 'panel', 'abil', 'hud'].map(id => $(id).getBoundingClientRect()), bad = [];
      for (const s of S) { camJump(s.u, s.v); const [x, y] = __gscr(s.u, s.v); if (boxes.some(b => x >= b.left - 4 && x <= b.right + 4 && y >= b.top - 4 && y <= b.bottom + 4)) bad.push(s.k + '@' + Math.round(s.u)); }
      homeCamera(); const h = game.sides[0].hq, [hx, hy] = __gscr(h.u, h.v); if (hx < $('lanes').getBoundingClientRect().right + 10) bad.push(`home view: HQ at ${Math.round(hx)}`);
      return bad;
    }, spots);
    assert.deepStrictEqual(covered, [], `${map}: places under a control`);
  }
  assert.deepStrictEqual(errors, []);
  await page.close();
});
