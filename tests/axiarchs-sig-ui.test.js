// Axiarch signature buildings in headless Chromium (v2.34): the Phase Beacon and Echo Reliquary cards ("Already built"), their
// info cards, every Axiarch building icon drawing without errors (completeness), and the Train tab's Echoes section: a label
// with the count, one card per stored echo at half cost; tapping one warps the unit back and removes the card.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

test('as the Axiarchs: Phase Beacon and Echo Reliquary cards and info; the Echoes section on the Train tab; tapping an echo warps it back', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#meSeg [data-f="axiarchs"]'); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } refreshUI(true);
    const card = t => $('cards').querySelector(`.card[data-type="${t}"]`), out = { names: [...$('cards').querySelectorAll('.card .nm')].map(x => x.textContent) };
    onCard('sigA', card('sigA')); onCard('sigB', card('sigB')); refreshUI(true);
    out.costs = ['sigA', 'sigB'].map(t => card(t).querySelector('.cost').textContent);
    const info = {}; for (const t of ['sigA', 'sigB']) { showInfo('b', t); info[t] = { name: $('infoName').textContent, body: $('infoBody').textContent }; } hideInfo(); out.info = info;
    const bad = []; for (const t of BUILD_ORDER.filter(t => BD('axiarchs', t))) { try { drawIcon(document.createElement('canvas'), 'b', t, 'axiarchs'); showInfo('b', t); } catch (e) { bad.push(t + ': ' + e.message); } } hideInfo(); out.bad = bad;
    for (const b of game.ents) if (b.side === 0 && (b.type === 'sigA' || b.type === 'sigB')) { b.built = true; b.progress = 1; b.hp = b.maxHp; }
    for (let i = 0; i < 30 * 30; i++) update(game, 1 / 30); // the Axis field grows
    document.querySelector('.tabs [data-tab="train"]').click(); refreshUI(true);
    out.empty = $('echoHdr') && $('echoHdr').textContent;
    game.ents.find(e => e.type === 'sigB').ech = ['lancer', 'parallax']; refreshUI(false);
    out.hdr = $('echoHdr').textContent; out.echoCards = [...$('cards').querySelectorAll('.card.echoc')].map(x => x.querySelector('.nm').textContent + ' ' + x.querySelector('.cost').textContent);
    out.first = [...$('cards').children].slice(0, 4).map(x => x.id || x.className);
    const c0 = game.sides[0].res.c; $('cards').querySelector('.card.echoc[data-unit="parallax"]').click(); refreshUI(false);
    out.paid = c0 - game.sides[0].res.c; out.warps = game.warps.map(w => w.type + (w.echo ? ':echo' : '')); out.left = [...$('cards').querySelectorAll('.card.echoc')].map(x => x.dataset.unit);
    return out;
  });
  assert.ok(r.names.includes('Phase Beacon') && r.names.includes('Echo Reliquary'), r.names.join(', '));
  assert.deepStrictEqual(r.costs, ['Already built', 'Already built']);
  assert.match(r.info.sigA.body, /frontmost/); assert.match(r.info.sigA.body, /never stacks/); assert.match(r.info.sigB.body, /half its cost/);
  assert.deepStrictEqual(r.bad, []);
  assert.match(r.empty, /Echoes\s*0\/3/); assert.match(r.hdr, /Echoes\s*2\/3/);
  assert.strictEqual(r.echoCards.length, 2); assert.match(r.echoCards[1], /Astral|Parallax/); assert.match(r.echoCards[1], /110/);
  assert.strictEqual(r.first[0], 'cWarp', 'the warp point card first'); assert.strictEqual(r.first[1], 'echoHdr', 'then the Echoes section');
  assert.strictEqual(r.paid, 110); assert.deepStrictEqual(r.warps, ['parallax:echo']); assert.deepStrictEqual(r.left, ['lancer']);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
