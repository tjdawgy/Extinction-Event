// Bloomhost signature buildings in headless Chromium (v2.33): the Brood Mound and Rootheart cards ("Already built" while one
// stands), their info cards and the Mite's, the Mite in the Army tab (its own chip and the Infantry group) but never on the
// Train tab, and every Bloomhost building icon drawing without errors (completeness).
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

test('as Bloomhost: Brood Mound and Rootheart cards, "Already built", info cards for both and the Mite; Mites in the Army tab, never on Train', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#meSeg [data-f="bloomhost"]'); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } refreshUI(true);
    const card = t => $('cards').querySelector(`.card[data-type="${t}"]`), out = { names: [...$('cards').querySelectorAll('.card .nm')].map(x => x.textContent) };
    onCard('sigA', card('sigA')); onCard('sigB', card('sigB')); refreshUI(true);
    out.costs = ['sigA', 'sigB'].map(t => card(t).querySelector('.cost').textContent);
    const info = {}; for (const [k, t] of [['b', 'sigA'], ['b', 'sigB'], ['u', 'mite']]) { showInfo(k, t); info[t] = { name: $('infoName').textContent, sub: $('infoSub').textContent, body: $('infoBody').textContent }; } hideInfo();
    out.info = info;
    for (const b of game.ents) if (b.side === 0 && (b.type === 'sigA' || b.type === 'sigB')) { b.built = true; b.progress = 1; b.hp = b.maxHp; }
    for (let i = 0; i < 30 * (MOUND.every + 1); i++) update(game, 1 / 30);
    out.mites = game.ents.filter(e => e.type === 'mite' && e.side === 0).length;
    document.querySelector('.tabs [data-tab="train"]').click(); out.train = [...$('cards').querySelectorAll('.card')].map(x => x.dataset.type);
    document.querySelector('.tabs [data-tab="army"]').click(); out.army = [...$('asel').querySelectorAll('.chip')].map(x => x.dataset.k + ':' + x.querySelector('.cnt').textContent);
    const bad = []; for (const t of BUILD_ORDER.filter(t => BD('bloomhost', t))) { try { drawIcon(document.createElement('canvas'), 'b', t, 'bloomhost'); showInfo('b', t); } catch (e) { bad.push(t + ': ' + e.message); } } hideInfo();
    try { drawIcon(document.createElement('canvas'), 'u', 'mite'); } catch (e) { bad.push('mite: ' + e.message); }
    out.bad = bad;
    return out;
  });
  assert.ok(r.names.includes('Brood Mound') && r.names.includes('Rootheart'), r.names.join(', '));
  assert.deepStrictEqual(r.costs, ['Already built', 'Already built']);
  assert.match(r.info.sigA.body, /Mite/); assert.match(r.info.sigA.body, /no Salvage/); assert.match(r.info.sigB.body, /1\.5× faster/);
  assert.strictEqual(r.info.mite.name, 'Mite'); assert.match(r.info.mite.sub, /Spawned by the Brood Mound/); assert.match(r.info.mite.body, /Lifespan30s/); assert.match(r.info.mite.body, /None: spawned free/);
  assert.strictEqual(r.mites, 2);
  assert.ok(!r.train.includes('mite'), `Train tab: ${r.train.join(', ')}`);
  assert.ok(r.army.includes('g:inf:2') && r.army.includes('t:mite:2'), r.army.join(', '));
  assert.deepStrictEqual(r.bad, []);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
