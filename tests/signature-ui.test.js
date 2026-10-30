// Signature buildings in headless Chromium (v2.32): the Build tab (both Last Fist cards, none for the other factions yet),
// "Already built", the info cards for the Salvage Yard, the Fortification Depot and the node bunker, the bunker's panel
// (nothing to buy or sell), and the Overdrive pill with its timer, which stays clear of the top bar and the ability buttons.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

async function start(dev, me, foe = 'bloomhost') {
  const { page, errors } = await openPage(browser, dev);
  await page.click(`#meSeg [data-f="${me}"]`); await page.click(`#foeSeg [data-f="${foe}"]`); await page.click('#bPlay'); await page.waitForTimeout(300);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } refreshUI(true); });
  return { page, errors };
}

test('Build tab: Salvage Yard and Fortification Depot cards for Last Fist, none for the Axiarchs yet; "Already built" while one stands; info cards for both and the bunker', { skip }, async () => {
  const { page, errors } = await start(NARROW, 'lastfist');
  const r = await page.evaluate(() => {
    const names = () => [...$('cards').querySelectorAll('.card .nm')].map(x => x.textContent);
    const card = t => $('cards').querySelector(`.card[data-type="${t}"]`), out = { names: names() };
    onCard('sigA', card('sigA')); refreshUI(true);
    out.yardCost = card('sigA').querySelector('.cost').textContent; out.yardLocked = card('sigA').classList.contains('locked');
    out.again = tryBuild(game, 0, 'sigA').msg;
    const info = {}; for (const t of ['sigA', 'sigB', 'bunker']) { showInfo('b', t); info[t] = { name: $('infoName').textContent, sub: $('infoSub').textContent, body: $('infoBody').textContent }; } hideInfo();
    out.info = info;
    // destroyed: the card offers it again
    const y = game.ents.find(e => e.type === 'sigA'); kill(game, y, 1); update(game, 1 / 30); refreshUI(true);
    out.after = card('sigA').querySelector('.cost').textContent;
    return out;
  });
  assert.ok(r.names.includes('Salvage Yard') && r.names.includes('Fortification Depot'), r.names.join(', '));
  assert.strictEqual(r.yardCost, 'Already built'); assert.ok(r.yardLocked);
  assert.match(r.again, /already built/);
  assert.match(r.info.sigA.sub, /one at a time/); assert.match(r.info.sigA.body, /20%/); assert.match(r.info.sigA.body, /Overdrive/);
  assert.match(r.info.sigB.body, /Node Bunker/); assert.match(r.info.sigB.body, /45 s/);
  assert.strictEqual(r.info.bunker.name, 'Node Bunker'); assert.match(r.info.bunker.body, /Ground only/); assert.match(r.info.bunker.body, /no Salvage/);
  assert.match(r.after, /150/, 'rebuildable after the loss');
  assert.deepStrictEqual(errors, []);
  await page.close();
  for (const fac of ['axiarchs']) { // Bloomhost has its own since v2.33 (tests/bloomhost-sig-ui.test.js)
    const { page: p2, errors: e2 } = await start(NARROW, fac, 'lastfist');
    const n = await p2.evaluate(() => [...$('cards').querySelectorAll('.card')].map(x => x.dataset.type));
    assert.ok(!n.includes('sigA') && !n.includes('sigB'), `${fac}: ${n.join(', ')}`);
    assert.deepStrictEqual(e2, []); await p2.close();
  }
});

for (const dev of [NARROW, PHONE]) {
  test(`a node bunker's panel offers nothing to buy or sell; the Overdrive pill shows its timer, clear of the top bar and buttons (${dev.width}x${dev.height})`, { skip }, async () => {
    const { page, errors } = await start(dev, 'lastfist');
    const r = await page.evaluate(() => {
      tryBuild(game, 0, 'sigB'); const d = game.ents.find(e => e.type === 'sigB'); d.built = true; d.progress = 1; d.hp = d.maxHp;
      game.nodes[0].owner = 0; game.nodes[0].prog = 100; update(game, 1 / 30);
      const bk = game.ents.find(e => e.type === 'bunker'); openPanel(bk); refreshUI(true);
      const vis = id => !$(id).classList.contains('hide');
      const panel = { name: $('bpName').textContent, up: vis('bpUp'), sell: vis('bpSell'), rep: vis('bpRep'), now: $('bpNow').textContent };
      closePanel();
      tryBuild(game, 0, 'sigA'); const y = game.ents.find(e => e.type === 'sigA'); y.built = true; y.progress = 1; y.tier = 3;
      const before = !$('od').classList.contains('hide');
      game.sides[0].od = game.t + 20; refreshUI(true);
      const rect = el => el.getBoundingClientRect(), od = rect($('od')), hud = rect($('hud')), ab = rect($('abil')), over = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
      return { panel, before, shown: !$('od').classList.contains('hide'), txt: $('od').textContent, hudHit: over(od, hud), abHit: over(od, ab), inView: od.left >= 0 && od.right <= innerWidth };
    });
    assert.strictEqual(r.panel.name, 'Node Bunker'); assert.ok(!r.panel.up && !r.panel.sell && !r.panel.rep, JSON.stringify(r.panel)); assert.match(r.panel.now, /T1/);
    assert.ok(!r.before, 'no pill without Overdrive'); assert.ok(r.shown); assert.match(r.txt, /Overdrive\s*20 s/);
    assert.ok(!r.hudHit && !r.abHit && r.inView, JSON.stringify(r));
    assert.deepStrictEqual(errors, []);
    await page.close();
  });
}
