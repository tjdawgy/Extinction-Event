// v2.81 (docs/FACTION_REWORK.md batch 1): the Test Range in headless Chromium at 667×375, with real taps and drags: the
// main-menu button, the setup panel (every unit of each faction read from UDEF, the target buildings, the presets), placing
// by a tap, the info card and Remove, Start / Pause, the speeds, Reset replaying exactly, Clear, Attack / Hold, Enemies fight
// back, Control blue myself (the box, a move, a target), Compare with three isolated rows, saved setups, and that nothing is
// saved or recorded as a match.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const HASH = () => { window.__h = g => JSON.stringify(g.ents.map(e => [e.id, e.type, +e.u.toFixed(4), +e.v.toFixed(4), +e.hp.toFixed(4), +(e.shp || 0).toFixed(4)])) + '|' + g.rs; };
async function pick(page, side, fac, n, type) {
  if ((await page.evaluate(() => document.getElementById('ov').classList.contains('hide')))) await page.click('#trTool');
  await page.click(`#trPs button[data-k="${side}"]`); await page.click(`#trPf button[data-k="${fac}"]`); await page.click(`#trPn button[data-k="${n}"]`);
  await page.click(`#trU button[data-type="${type}"], #trB button[data-type="${type}"]`);
}
const rowY = (page, k, f = 0.62) => page.evaluate(([k, f]) => { const T = trView(k); return T.y0 + (T.y1 - T.y0) * f; }, [k, f]);

test('Test Range: setup, placing, inspecting, Start, speeds, Reset replays exactly, Clear, modes, nothing saved', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.evaluate(HASH);
  await page.click('#bRange'); await page.waitForTimeout(200);
  assert.ok(await page.evaluate(() => TR.on && game.range && !document.getElementById('ov').classList.contains('hide')), 'opens with the setup panel');
  for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) { // every unit of the faction, from UDEF at run time; both target buildings
    await page.click(`#trPf button[data-k="${fac}"]`);
    const got = await page.evaluate(() => [...document.querySelectorAll('#trU button')].map(b => b.dataset.type));
    assert.deepStrictEqual(got, await page.evaluate(f => Object.keys(UDEF).filter(t => (UDEF[t].fac || 'lastfist') === f && rwShown(t)), fac)); // v2.82: the units a new match has
    assert.deepStrictEqual(await page.evaluate(() => [...document.querySelectorAll('#trB button')].map(b => b.dataset.type)), ['turret', 'refinery']);
  }
  const small = await page.evaluate(() => [...document.querySelectorAll('#box button')].filter(b => { const r = b.getBoundingClientRect(); return r.height && r.height < 44; }).map(b => b.textContent));
  assert.deepStrictEqual(small, [], 'every control in the panel at least 44 pt');
  await pick(page, 0, 'lastfist', 10, 'rifle');
  const y = await rowY(page, 0, 0.6);
  await page.mouse.click(260, y); await page.waitForTimeout(60);
  assert.strictEqual(await page.evaluate(() => game.ents.filter(e => e.side === 0 && e.type === 'rifle').length), 10);
  await pick(page, 1, 'lastfist', 1, 'turret'); await page.mouse.click(520, y); await page.waitForTimeout(60);
  await page.click('#trTool'); await page.click('#trQ button[data-i="1"]'); await page.waitForTimeout(60); // Armor: 3 Tanks for red
  assert.deepStrictEqual(await page.evaluate(() => [game.ents.filter(e => e.side === 1 && e.type === 'tank').length, game.ents.filter(e => e.type === 'turret').length, TR.set.items.length]), [3, 1, 14]);
  // tap a unit: its card, then Remove (from the field and the setup)
  const [ux, uy] = await page.evaluate(() => { const e = game.ents.find(x => x.type === 'tank'), p = trScreen(trView(0), e); return [p.x, p.y]; });
  await page.mouse.click(ux, uy); await page.waitForTimeout(200);
  assert.strictEqual(await page.evaluate(() => $('infoName').textContent), 'Tank');
  assert.match(await page.evaluate(() => $('infoBody').textContent), /Health\s+\d+ \/ \d+.*State/);
  await page.click('#trRm'); await page.waitForTimeout(60);
  assert.deepStrictEqual(await page.evaluate(() => [game.ents.filter(e => e.type === 'tank').length, TR.set.items.length]), [2, 13]);
  // Start, speeds, Pause
  await page.click('#trGo'); await page.click('#trSpd'); assert.strictEqual(await page.evaluate(() => TR.speed), 2);
  await page.waitForTimeout(1500); await page.click('#trGo');
  const t1 = await page.evaluate(() => game.t); assert.ok(t1 > 1.5, `2× runs faster (${t1})`);
  await page.click('#trSpd'); assert.strictEqual(await page.evaluate(() => TR.speed), 0.5);
  await page.click('#trSpd'); assert.strictEqual(await page.evaluate(() => TR.speed), 1);
  const run1 = await page.evaluate(() => ({ rk: game.rk, h: __h(game), R: JSON.stringify(rangeRead(game)) }));
  assert.ok(JSON.parse(run1.R).dmg[0] > 0 && JSON.parse(run1.R).dmg[1] > 0, 'both sides fought');
  // Reset: the same setup and seed, stepped the same number of ticks, ends in exactly the same state
  const run2 = await page.evaluate(n => { trReset(); TR.go = false; while (game.rk < n) rangeStep(game); return { h: __h(game), R: JSON.stringify(rangeRead(game)) }; }, run1.rk);
  assert.strictEqual(run2.h, run1.h); assert.strictEqual(run2.R, run1.R);
  // Hold and Attack per side; Enemies fight back off
  await page.evaluate(() => trReset()); await page.click('#trBb button[data-m="hold"]');
  assert.ok(await page.evaluate(() => game.ents.filter(e => e.kind === 'u' && e.side === 0).every(e => e.po.o === 'hold' || e.po.o === 'go')));
  await page.click('#trBb button[data-m="attack"]');
  assert.ok(await page.evaluate(() => game.ents.filter(e => e.kind === 'u' && e.side === 0).every(e => e.po.o === 'target')));
  await page.click('#trTool'); await page.click('#trFb button[data-k="0"]'); await page.click('#trSX');
  await page.evaluate(() => { trReset(); TR.go = false; for (let i = 0; i < 600; i++) rangeStep(game); });
  assert.strictEqual(await page.evaluate(() => rangeRead(game).dmg[1]), 0, 'red does not fight back');
  // Clear takes two taps
  await page.click('#trClear'); assert.ok(await page.evaluate(() => TR.set.items.length > 0));
  await page.click('#trClear'); assert.deepStrictEqual(await page.evaluate(() => [TR.set.items.length, game.ents.length]), [0, 0]);
  // nothing in the save, the match history or the stats
  await page.evaluate(() => { saveGame(); pauseGame(); });
  assert.deepStrictEqual(await page.evaluate(() => [localStorage.getItem('colonyMobile.save'), localStorage.getItem('extinctionEvent.history'), document.getElementById('ov').classList.contains('hide')]), [null, null, true]);
  await page.click('#trExit'); await page.waitForTimeout(100);
  assert.ok(await page.evaluate(() => !TR.on && !game && !!document.getElementById('bRange')), 'back at the main menu');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('Test Range: Control blue myself (box, move, target), Compare with three isolated rows, saved setups', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#bRange'); await page.waitForTimeout(200);
  await pick(page, 0, 'lastfist', 5, 'rifle'); const y = await rowY(page, 0, 0.6); await page.mouse.click(250, y);
  await page.click('#trTool'); await page.click('#trQ button[data-i="1"]');
  await page.click('#trTool'); await page.click('#trCb button[data-k="1"]'); await page.waitForTimeout(100);
  assert.ok(await page.evaluate(() => ctlOn() && game.sides[0].manual && !document.getElementById('lanes').classList.contains('hide')));
  const box = await page.evaluate(() => { const p = game.ents.filter(e => e.side === 0).map(e => trScreen(trView(0), e)); return [Math.min(...p.map(q => q.x)) - 20, Math.min(...p.map(q => q.y)) - 16, Math.max(...p.map(q => q.x)) + 20, Math.max(...p.map(q => q.fy)) + 8]; });
  await page.mouse.move(box[0], box[1]); await page.mouse.down(); await page.waitForTimeout(380); await page.mouse.move(box[2], box[3], { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(80);
  assert.strictEqual(await page.evaluate(() => SELN.size), 5, 'the box selects the five Riflemen');
  await page.mouse.click(380, y + 10); await page.waitForTimeout(60);
  assert.ok(await page.evaluate(() => game.ents.filter(e => e.side === 0).every(e => e.po.o === 'go')), 'a tap on the ground moves them');
  await page.evaluate(() => selAll());
  const [tx, ty] = await page.evaluate(() => { const p = trScreen(trView(0), game.ents.find(e => e.type === 'tank')); return [p.x, p.y]; });
  await page.mouse.click(tx, ty); await page.waitForTimeout(60);
  assert.ok(await page.evaluate(() => game.ents.filter(e => e.side === 0).every(e => e.po.o === 'target')), 'a tap on an enemy targets it');
  await page.evaluate(() => { TR.go = true; for (let i = 0; i < 240; i++) rangeStep(game); TR.go = false; });
  assert.ok(await page.evaluate(() => game.ents.filter(e => e.side === 0 && e.hp > 0).every(e => e.po.o === 'target' || e.po.o === 'hold')), 'blue keeps the player\'s order (Attack never re-targets a side under player control)');
  // Compare: three rows, the same blob in each by one tap, a different attacker per row; rows can't touch
  await page.click('#trTool'); await page.click('#trCr button[data-k="3"]');
  assert.ok(await page.evaluate(() => TR.games.length === 3 && !game.sides[0].manual && !ctlOn()), 'Compare turns player control off');
  await page.click('#trQ button[data-i="0"]');
  assert.deepStrictEqual(await page.evaluate(() => TR.games.map(g => g.ents.filter(e => e.side === 1).length)), [13, 10, 10]); // row 1 keeps the Armor placed before
  for (const [k, fac, t] of [[0, 'lastfist', 'artillery'], [1, 'bloomhost', 'gorebore']]) { await pick(page, 0, fac, 3, t); await page.mouse.click(250, await rowY(page, k)); }
  assert.deepStrictEqual(await page.evaluate(() => TR.games.map(g => g.ents.filter(e => e.side === 0).length)), [8, 3, 0]);
  assert.deepStrictEqual(await page.evaluate(() => TR.games.map(g => g.sides[0].faction)), ['lastfist', 'bloomhost', 'lastfist']);
  await page.evaluate(() => { for (let i = 0; i < 900; i++) for (const g of TR.games) rangeStep(g); });
  const R = await page.evaluate(() => TR.games.map(g => rangeRead(g)));
  assert.ok(R[0].kills[0] > 0 && R[1].kills[0] > 0, 'rows 1 and 2 fight');
  assert.deepStrictEqual([R[2].dmg[0], R[2].dmg[1], R[2].n[1]], [0, 0, 10], 'row 3 has no attacker: nothing reaches it from the other rows');
  // saved setups: save, clear, load
  await page.click('#trTool'); await page.fill('#trNm', 'Siege test'); await page.click('#trSv');
  assert.match(await page.evaluate(() => localStorage.getItem('extinctionEvent.range')), /Siege test/);
  await page.click('#trSX'); await page.click('#trClear'); await page.click('#trClear');
  await page.click('#trTool'); await page.click('[data-load="0"]');
  assert.deepStrictEqual(await page.evaluate(() => [TR.games.length, TR.set.items.length]), [3, 44]);
  assert.deepStrictEqual(await page.evaluate(() => TR.games.map(g => g.ents.length)), [21, 13, 10]);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
