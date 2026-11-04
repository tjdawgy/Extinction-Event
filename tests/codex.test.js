// The Codex (v2.44) in a real browser: it opens from the main menu and from the pause menu mid-match (and closing it leaves
// the same paused match), all four tabs show (How to Play: the placeholder), every unit and building in the game data has a
// card with a drawn picture and a description, the deep link opens the right tab and item for each faction, the stats table
// follows the data (a changed HP shows after a redraw), its headers sort, and nothing scrolls sideways at 390 wide.
// Screenshots go to tests/screenshots/codex-*.png.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, openPage } = require('./browser-kit');

const pw = findPlaywright(), skip = !pw && 'Playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const OUT = path.join(__dirname, 'screenshots');
const PORTRAIT = { width: 390, height: 844, insets: { top: 47, bottom: 34, left: 0, right: 0 } };
const FACS = ['lastfist', 'bloomhost', 'axiarchs'];

test('Codex: main menu, tabs, every unit and building, pictures, no sideways scroll at 390', { skip }, async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { page, errors } = await openPage(browser, PORTRAIT);
  await page.evaluate(() => $('bCodex').click()); // portrait: the rotate screen covers the menu, the Codex sits above it
  await page.waitForTimeout(150);
  const tabs = await page.evaluate(() => [...$('cxTabs').children].map(b => b.textContent));
  assert.deepStrictEqual(tabs, ['How to Play', 'Last Fist', 'Bloomhost', 'Axiarchs']);
  await page.click('#cxTabs [data-t="how"]');
  assert.strictEqual(await page.evaluate(() => document.querySelectorAll('#cxBody .cxch .cxplay').length), 7, 'How to Play: the tutorial chapters (v2.46; was the placeholder)');
  for (const fac of FACS) {
    await page.click(`#cxTabs [data-t="${fac}"]`); await page.waitForTimeout(100);
    const r = await page.evaluate(fac => {
      const want = { b: Object.keys(BDEFS[fac]), u: Object.keys(UDEF).filter(t => (UDEF[t].fac || DEFAULT_FACTION) === fac) };
      const card = (k, t) => document.getElementById(`cx-${k}-${t}`);
      const ink = c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; };
      const check = (k, defs) => want[k].filter(t => { const el = card(k, t), cv = el && el.querySelector('canvas.cxi'); return !el || !defs[t].desc || !el.textContent.includes(defs[t].desc) || !cv || cv.dataset.err || ink(cv) < 50; });
      return { nb: want.b.length, nu: want.u.length, badB: check('b', BDEFS[fac]), badU: check('u', UDEF),
        rows: $('cxTw').querySelectorAll('tbody tr').length, trees: want.b.filter(t => !document.getElementById('cx-t-' + t)),
        sw: document.documentElement.scrollWidth, bsw: $('cxBody').scrollWidth, bcw: $('cxBody').clientWidth, mech: !!FACTIONS[fac].overview && $('cxBody').textContent.includes(FACTIONS[fac].mech.txt) };
    }, fac);
    assert.deepStrictEqual(r.badB, [], `${fac}: buildings without a card, description or picture`);
    assert.deepStrictEqual(r.badU, [], `${fac}: units without a card, description or picture`);
    assert.deepStrictEqual(r.trees, [], `${fac}: buildings without an upgrade tree`);
    assert.strictEqual(r.rows, r.nu, `${fac}: every unit has a stats row`);
    assert.ok(r.mech, `${fac}: overview and signature mechanic`);
    assert.ok(r.sw <= 390 && r.bsw <= r.bcw, `${fac}: no sideways scroll (${r.sw}, ${r.bsw}/${r.bcw})`);
    console.log(`# ${fac}: ${r.nb} buildings, ${r.nu} units`);
    await page.screenshot({ path: path.join(OUT, `codex-390-${fac}.png`) });
  }
  // sorting: tap HP, largest first; tap again, smallest first
  await page.click('#cxTabs [data-t="lastfist"]');
  await page.evaluate(() => openCodex('lastfist', 'stats'));
  const hp = () => page.evaluate(() => [...$('cxTw').querySelectorAll('tbody tr')].map(r => UDEF[r.dataset.t].hp));
  await page.click('#cxTw [data-sort="hp"]'); const a = await hp();
  assert.deepStrictEqual(a, [...a].sort((x, y) => y - x));
  await page.click('#cxTw [data-sort="hp"]'); const b = await hp();
  assert.deepStrictEqual(b, [...b].sort((x, y) => x - y));
  await page.screenshot({ path: path.join(OUT, 'codex-390-stats.png') });
  // the table reads the data: change a unit's HP, redraw the tab, the new number shows; then put it back
  const cell = () => page.evaluate(() => { const r = $('cxTw').querySelector('tr[data-t="rifle"]'), i = [...$('cxTw').querySelectorAll('th')].findIndex(th => th.textContent.startsWith('HP')); return r.children[i].textContent; });
  const before = await cell();
  await page.evaluate(() => { CX.sort = {}; window.__hp = UDEF.rifle.hp; UDEF.rifle.hp = 1234; cxShow('lastfist'); });
  assert.strictEqual(await cell(), '1,234');
  await page.evaluate(() => { UDEF.rifle.hp = window.__hp; cxShow('lastfist'); });
  assert.strictEqual(await cell(), before);
  await page.click('#cxX');
  assert.ok(await page.evaluate(() => $('codex').classList.contains('hide') && !$('ov').classList.contains('hide') && !!$('bPlay')), 'closing returns to the main menu');
  assert.deepStrictEqual(errors, []);
});

test('Codex: deep links, one per faction', { skip }, async () => {
  const { page, errors } = await openPage(browser, PORTRAIT);
  for (const [fac, item, id] of [['lastfist', 'unit:sniper', 'cx-u-sniper'], ['bloomhost', 'tree:factory', 'cx-t-factory'], ['axiarchs', 'building:sigB', 'cx-b-sigB']]) {
    const r = await page.evaluate(([fac, item, id]) => {
      const ok = openCodex(fac, item), el = $(id), box = $('cxBody').getBoundingClientRect(), e = el.getBoundingClientRect();
      return { ok, tab: CX.tab, on: $('cxTabs').querySelector('.on').dataset.t, inView: e.top >= box.top - 1 && e.top < box.bottom - 40, hi: el.classList.contains('cxhi'), name: el.querySelector('h3') ? el.querySelector('h3').textContent : '' };
    }, [fac, item, id]);
    assert.ok(r.ok && r.tab === fac && r.on === fac && r.inView && r.hi, `${fac} ${item}: ${JSON.stringify(r)}`);
  }
  assert.strictEqual(await page.evaluate(() => openCodex('lastfist', 'unit:nope')), false);
  // a tree's troop link scrolls to the troop's card
  await page.evaluate(() => openCodex('bloomhost', 'tree:barracks'));
  await page.click('#cx-t-barracks [data-go="u:ravager"]');
  assert.ok(await page.evaluate(() => { const e = $('cx-u-ravager').getBoundingClientRect(), b = $('cxBody').getBoundingClientRect(); return e.top >= b.top - 1 && e.top < b.bottom - 40; }));
  assert.deepStrictEqual(errors, []);
});

test('Codex: from the pause menu mid-match; closing leaves the same paused match', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#meSeg [data-f="bloomhost"]'); await page.click('#bPlay'); await page.waitForTimeout(200);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); for (const s of game.sides) s.aiT = 1e9; });
  await page.waitForTimeout(400);
  await page.click('#bPause'); await page.waitForTimeout(100);
  const before = await page.evaluate(() => { window.__g = game; return { t: game.t, paused, menu: $('box').textContent }; });
  assert.ok(before.paused && before.t > 0);
  await page.click('#bCodex'); await page.waitForTimeout(300);
  assert.strictEqual(await page.evaluate(() => CX.tab), 'bloomhost', 'opens on the player\'s faction');
  await page.screenshot({ path: path.join(OUT, 'codex-858-pause.png') });
  await page.waitForTimeout(500); // time passes while it is open: the match must not move
  await page.click('#cxX'); await page.waitForTimeout(200);
  const after = await page.evaluate(() => ({ same: window.__g === game, t: game.t, paused, running, menu: $('box').textContent, ov: !$('ov').classList.contains('hide') }));
  assert.ok(after.same && after.paused && after.running && after.ov, JSON.stringify(after));
  assert.strictEqual(after.t, before.t); assert.strictEqual(after.menu, before.menu);
  await page.click('#bRes'); await page.waitForTimeout(400);
  assert.ok(await page.evaluate(t => !paused && game.t > t, before.t), 'Resume carries on with the same match');
  // the deep link mid-match (no pause menu open): it pauses first, and closing leaves the pause menu
  await page.evaluate(() => openCodex('axiarchs', 'unit:bastion'));
  assert.ok(await page.evaluate(() => paused && CX.open));
  await page.click('#cxX');
  assert.ok(await page.evaluate(() => paused && !$('ov').classList.contains('hide') && !!$('bRes')));
  assert.deepStrictEqual(errors, []);
});
