// Upgrade trees in headless Chromium (v2.13): the path picker (tap a path, then confirm), the panel clear of the top bar
// and the ability buttons at both phone sizes, and the Train tab (path tags, Mass ×2, the "Other paths" card).
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const SETUP = () => {
  game.countdown = 0; hideCountdown(); updateIntro(); paused = false;
  for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 5000; }
  for (const k of ['barracks', 'barracks', 'habitat']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.kind === 'b') { b.built = true; b.progress = 1; } }
  game.sides[0].ab = { shield: 0, strike: 0, repair: 0 }; refreshUI(true);
};

test('the path picker: Upgrade asks for a path, tap a path, then confirm; the panel then shows the path', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(300);
  await page.evaluate(SETUP);
  await page.evaluate(() => openPanel(game.ents.find(e => e.type === 'barracks')));
  assert.ok(await page.evaluate(() => !$('bpPick').classList.contains('hide')));
  assert.match(await page.textContent('#bpPick [data-p="A"]'), /Specialists.*Heavy troopers.*Snipers/);
  assert.match(await page.textContent('#bpPick [data-p="B"]'), /Mass Deployment.*Riflemen in pairs.*Drilled Riflemen/);
  await page.click('#bpUp');
  assert.ok((await page.evaluate(() => [...$('toasts').children].map(t => t.textContent))).includes('Pick a path first: tap A or B'));
  assert.strictEqual(await page.evaluate(() => sel.upgrading), false, 'nothing paid or started');
  await page.click('#bpPick [data-p="B"]');
  assert.match(await page.textContent('#bpUp'), /^Choose · 150\/50$/);
  await page.click('#bpUp');
  assert.deepStrictEqual(await page.evaluate(() => [sel.upgrading, sel.upPath]), [true, 'B']);
  await page.evaluate(() => { sel.upProg = 0.9999; update(game, 0.2); refreshPanel(); });
  assert.ok(await page.evaluate(() => $('bpPick').classList.contains('hide')), 'no picker once the path is taken');
  assert.match(await page.textContent('#bpNow'), /T2: Mass Deployment: Riflemen in pairs/);
  assert.match(await page.textContent('#bpNext'), /Next T3: Drilled Riflemen/);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

for (const dev of [PHONE, NARROW]) {
  test(`building panel at ${dev.width}×${dev.height}: picker and chosen path clear of the top bar and the ability buttons`, { skip }, async () => {
    const { page, errors } = await openPage(browser, dev);
    await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(SETUP);
    const r = await page.evaluate(() => {
      const hud = $('hud').getBoundingClientRect(), abs = [...$('abil').children].map(e => e.getBoundingClientRect()), out = [];
      const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      const check = k => { const p = $('bp').getBoundingClientRect(); out.push({ k, clearTop: p.top >= hud.bottom, clearAbil: !abs.some(a => hit(a, p)), top: p.top, hud: hud.bottom }); };
      const b = game.ents.find(e => e.type === 'barracks'); b.hp = b.maxHp * 0.5; // with the Repair button too
      openPanel(b); bpPath = 'A'; refreshPanel(); check('picker');
      tryUpgrade(game, 0, b, 'A'); b.upProg = 0.9999; update(game, 0.2); refreshPanel(); check('chosen');
      return out;
    });
    for (const c of r) assert.ok(c.clearTop && c.clearAbil, JSON.stringify(c));
    assert.deepStrictEqual(errors, []);
    await page.close();
  });
}

test('Train tab: path tags and Mass ×2; units no building of yours can make go under "Other paths", which explains them', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(300);
  await page.evaluate(SETUP);
  await page.click('.tabs [data-tab="train"]');
  const types = () => page.$$eval('#cards .card', c => c.map(x => x.dataset.type));
  assert.ok((await types()).includes('heavy') && !(await types()).includes('other'), 'undecided Barracks: Heavy still on offer');
  await page.evaluate(() => { for (const b of game.ents.filter(e => e.type === 'barracks')) { tryUpgrade(game, 0, b, 'B'); b.upProg = 0.9999; } update(game, 0.2); refreshUI(false); });
  const t = await types();
  assert.ok(!t.includes('heavy') && !t.includes('sniper') && t.at(-1) === 'other', JSON.stringify(t));
  assert.match(await page.textContent('#cards .card.other'), /Other paths.*Heavy, Sniper/);
  assert.match(await page.textContent('#cards .card[data-type="rifle"] .pr'), /MASS ×2/);
  await page.click('#cards .card.other');
  assert.match(await page.textContent('#info'), /Heavy.*Barracks on Specialists/);
  await page.evaluate(() => { hideInfo(); const b = game.ents.find(e => e.type === 'barracks'); trySell(game, 0, b); update(game, 1 / 30); tryBuild(game, 0, 'barracks', b.slot); for (const x of game.ents) if (x.type === 'barracks') { x.built = true; x.progress = 1; } refreshUI(false); });
  assert.ok((await types()).includes('heavy'), 'a new undecided Barracks brings them back');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('War Factory (v2.14): Siege or Assault in the picker; Assault puts Flame Tank on the Train tab and Artillery under "Other paths"', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(300);
  await page.evaluate(SETUP);
  await page.evaluate(() => { for (const k of ['refinery', 'factory']) { tryBuild(game, 0, k); for (const b of game.ents) if (b.kind === 'b') { b.built = true; b.progress = 1; } } openPanel(game.ents.find(e => e.type === 'factory')); });
  assert.match(await page.textContent('#bpPick [data-p="A"]'), /Siege.*Artillery.*Titans/);
  assert.match(await page.textContent('#bpPick [data-p="B"]'), /Assault.*Flame Tanks.*Hydras/);
  await page.click('#bpPick [data-p="B"]'); await page.click('#bpUp');
  await page.evaluate(() => { sel.upProg = 0.9999; update(game, 0.2); closePanel(); });
  await page.click('.tabs [data-tab="train"]');
  const t = await page.$$eval('#cards .card', c => c.map(x => x.dataset.type));
  assert.ok(t.includes('flame') && t.includes('tank') && !t.includes('artillery') && !t.includes('titan') && t.at(-1) === 'other', JSON.stringify(t));
  assert.match(await page.textContent('#cards .card.other'), /Artillery, Titan/);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
