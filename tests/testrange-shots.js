// v2.81 (docs/FACTION_REWORK.md batch 1): screenshots of the Test Range at 667×375 (iPhone landscape in the viewer), made
// with real taps and drags.   node tests/testrange-shots.js   → docs/screenshots/testrange-<shot>-667x375.png
// Shots: setup (the setup panel), info (a Tank's card mid-fight, with Remove), fight (a running fight: 10 Riflemen and 3 Tanks against Swarm and a Maw), compare (three
// rows: Artillery, Bile Lobber and Rift Mortar each against the same Infantry blob), control (Control blue myself, a box
// selection mid-drag).
const path = require('path');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

(async () => {
  const pw = findPlaywright(); if (!pw) { console.error('playwright not installed'); process.exit(1); }
  const browser = await pw.chromium.launch(), dev = NARROW;
  const shot = async (page, name) => { await page.screenshot({ path: path.join(OUT, `testrange-${name}-${dev.width}x${dev.height}.png`) }); console.log('wrote', name); };
  const quiet = page => page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); });
  const pick = async (page, side, fac, n, type) => {
    if (await page.evaluate(() => document.getElementById('ov').classList.contains('hide'))) await page.click('#trTool');
    await page.click(`#trPs button[data-k="${side}"]`); await page.click(`#trPf button[data-k="${fac}"]`); await page.click(`#trPn button[data-k="${n}"]`);
    await page.click(`#trU button[data-type="${type}"], #trB button[data-type="${type}"]`);
  };
  const rowY = (page, k, f) => page.evaluate(([k, f]) => { const T = trView(k); return T.y0 + (T.y1 - T.y0) * f; }, [k, f]);
  { // setup + fight
    const { page, errors } = await openPage(browser, dev);
    await page.click('#bRange'); await page.waitForTimeout(300);
    await shot(page, 'setup');
    await pick(page, 0, 'lastfist', 10, 'rifle'); await page.mouse.click(250, await rowY(page, 0, 0.55));
    await pick(page, 0, 'lastfist', 3, 'tank'); await page.mouse.click(200, await rowY(page, 0, 0.7));
    await pick(page, 1, 'bloomhost', 1, 'turret'); await page.mouse.click(560, await rowY(page, 0, 0.6));
    await page.click('#trTool'); await page.click('#trQ button[data-i="2"]');
    await page.click('#trGo'); await page.waitForTimeout(3200); await page.click('#trGo');
    const [x, y] = await page.evaluate(() => { const e = game.ents.find(x => x.side === 0 && x.type === 'tank' && x.hp > 0), p = trScreen(trView(0), e); return [p.x, p.y]; });
    await page.mouse.click(x, y); await page.waitForTimeout(150); // the info card for a Tank, mid-fight
    await quiet(page); await shot(page, 'info');
    await page.click('#infoX'); await page.click('#trGo'); await page.waitForTimeout(600); await page.click('#trGo'); await quiet(page); await page.waitForTimeout(100);
    await shot(page, 'fight');
    if (errors.length) console.error(errors);
    await page.close();
  }
  { // Compare: three rows, the same Infantry blob in each by one tap, a different attacker per row
    const { page, errors } = await openPage(browser, dev);
    await page.click('#bRange'); await page.waitForTimeout(300);
    await page.click('#trCr button[data-k="3"]'); await page.click('#trQ button[data-i="0"]');
    for (const [k, fac, t] of [[0, 'lastfist', 'artillery'], [1, 'bloomhost', 'bilelobber'], [2, 'axiarchs', 'riftmortar']]) { await pick(page, 0, fac, 3, t); await page.mouse.click(230, await rowY(page, k, 0.7)); }
    await page.click('#trGo'); await page.waitForTimeout(2300); await page.click('#trGo'); await quiet(page); await page.waitForTimeout(100);
    await shot(page, 'compare');
    if (errors.length) console.error(errors);
    await page.close();
  }
  { // Control blue myself: a box drawn over blue's units
    const { page, errors } = await openPage(browser, dev);
    await page.click('#bRange'); await page.waitForTimeout(300);
    await pick(page, 0, 'axiarchs', 5, 'shardling'); await page.mouse.click(230, await rowY(page, 0, 0.55));
    await pick(page, 0, 'axiarchs', 3, 'lancer'); await page.mouse.click(170, await rowY(page, 0, 0.7));
    await page.click('#trTool'); await page.click('#trQ button[data-i="0"]');
    await page.click('#trTool'); await page.click('#trCb button[data-k="1"]'); await quiet(page);
    const b = await page.evaluate(() => { const p = game.ents.filter(e => e.side === 0).map(e => trScreen(trView(0), e)); return [Math.min(...p.map(q => q.x)) - 22, Math.min(...p.map(q => q.y)) - 18, Math.max(...p.map(q => q.x)) + 22, Math.max(...p.map(q => q.fy)) + 10]; });
    await page.mouse.move(b[0], b[1]); await page.mouse.down(); await page.waitForTimeout(380); await page.mouse.move(b[2], b[3], { steps: 10 }); await page.waitForTimeout(80);
    await quiet(page); await shot(page, 'control');
    await page.mouse.up();
    if (errors.length) console.error(errors);
    await page.close();
  }
  await browser.close();
})();
