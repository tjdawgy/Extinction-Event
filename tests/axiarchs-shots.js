// Axiarchs framework screenshots (v2.25): the setup menu with Axiarchs (667x375 and 858x396), an Axiarch base early and
// mid-game, shield bars on units, the Null Lance T2 split beam, and an enemy Axiarch base under fog.
//   node tests/axiarchs-shots.js [outDir] [--wide] [--tag=axiarchs]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'axiarchs';
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const shot = async (page, dev, name) => { await page.waitForTimeout(150); const f = path.join(outDir, `${tag}-${name}-${dev.width}x${dev.height}.png`); fs.writeFileSync(f, await page.screenshot()); console.log(f); };
  const pageErrors = [];
  try {
    for (const dev of [NARROW, PHONE]) { // the setup menu: Difficulty, You, Opponent, with Axiarchs picked
      const { page, errors } = await openPage(browser, dev);
      await page.click('#meSeg [data-f="axiarchs"]'); await page.click('#foeSeg [data-f="random"]');
      const fit = await page.evaluate(() => { const b = $('box'); return { fits: b.scrollHeight <= b.clientHeight + 1, all: [...document.querySelectorAll('.setup button, #bPlay')].every(el => { const q = el.getBoundingClientRect(); return q.top >= 0 && q.bottom <= innerHeight && q.left >= 0 && q.right <= innerWidth; }) }; });
      console.log(`  setup at ${dev.width}x${dev.height}: fits without scrolling ${fit.fits}, every button on screen ${fit.all}`);
      await shot(page, dev, 'setup');
      pageErrors.push(...errors); await page.close();
    }
    const dev = args.includes('--wide') ? PHONE : NARROW;
    { // an Axiarch base, early and mid-game; shield bars; the Null Lance's Split Lattice
      const { page, errors } = await openPage(browser, dev, { init: 'Math.random = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
      await page.click('#meSeg [data-f="axiarchs"]'); await page.click('#foeSeg [data-f="lastfist"]');
      await page.click('#bPlay'); await page.waitForTimeout(300);
      await page.evaluate(() => {
        game.countdown = 0; hideCountdown(); updateIntro(); paused = false;
        for (const s of game.sides) { s.aiT = 1e9; s.res.c = 6000; s.res.e = 3000; }
        window.__fin = k => { const r = tryBuild(game, 0, k); for (const b of game.ents) if (b.side === 0 && b.kind === 'b' && b.type !== 'reactor') { b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; } return r; };
        window.__frames = n => { for (let i = 0; i < n; i++) { update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); } refreshUI(true); $('toasts').textContent = ''; };
        __fin('barracks'); __fin('refinery'); tryBuild(game, 0, 'reactor');
        game.ents.find(e => e.type === 'reactor' && e.side === 0).progress = 0.55;
        for (let i = 0; i < 4; i++) { const s = spawnUnit(game, 0, 'shardling', hqPos(0).u + 250 + i * 16, (i - 1.5) * 24); s.holdU = s.u; s.holdV = s.v; }
        setStance(game, 0, 'hold'); cam.x = hqPos(0).u + 210; clampCam(); __frames(20);
      });
      await shot(page, dev, 'base-early');
      await page.evaluate(() => {
        for (const k of ['factory', 'techlab', 'habitat', 'turret', 'refinery']) __fin(k);
        for (const b of game.ents.filter(e => e.side === 0 && e.kind === 'b')) if (['hq', 'refinery', 'habitat', 'turret', 'reactor'].includes(b.type)) b.tier = b.type === 'turret' || b.type === 'hq' ? 3 : 2;
        game.ents.find(e => e.type === 'reactor' && e.side === 0).progress = 1;
        for (const b of game.ents) if (b.side === 0 && b.kind === 'b') { b.built = true; b.maxHp = bdOf(b).hp * hpMul(bdOf(b), b.tier); b.hp = b.maxHp; b.maxShp = bdOf(b).shp * hpMul(bdOf(b), b.tier); b.shp = b.maxShp; }
        const u0 = hqPos(0).u + 290;
        for (let i = 0; i < 2; i++) { const s = spawnUnit(game, 0, 'bastion', u0 + 40, (i ? 34 : -34)); s.holdU = s.u; s.holdV = s.v; }
        for (let i = 0; i < 2; i++) { const s = spawnUnit(game, 0, 'wraithwing', u0 - 30 + i * 36, (i ? 22 : -22)); s.holdU = s.u; s.holdV = s.v; }
        game.t = 600; cam.x = hqPos(0).u + 210; clampCam(); __frames(30);
      });
      await shot(page, dev, 'base-mid');
      await page.evaluate(() => { // shield bars: units taking fire, shields partly or fully down
        for (const e of game.ents.filter(e => e.kind === 'u')) e.hp = 0; __frames(1);
        game.fog[0].vis.fill(1); const u0 = L / 2 - 60, list = [['shardling', 0, 90, 0.5, 1], ['shardling', 24, 130, 0, 0.7], ['bastion', 80, 100, 0.3, 1], ['bastion', 95, 150, 0.8, 1], ['wraithwing', 150, 150, 0.4, 1]];
        for (const [t, du, v, sf, hf] of list) { const e = spawnUnit(game, 0, t, u0 + du, v); Object.assign(e, { holdU: e.u, holdV: v, face: 1, cd: 1e6 }); e.shp = e.maxShp * sf; e.hp = e.maxHp * hf; e.shpT = game.t; }
        game.ents.filter(e => e.type === 'shardling')[0].shpHit = game.t; // one just hit: the shimmer
        applyZoom(1.7); cam.x = u0 + 75; clampCam(); paused = true; render(ctx, game, game.t, sel, selPad); refreshUI(true);
      });
      await shot(page, dev, 'shields');
      await page.evaluate(() => { // the Null Lance at T2 splitting its beam across three enemy units
        for (const e of game.ents.filter(e => e.kind === 'u')) e.hp = 0; game.ents = game.ents.filter(e => e.hp > 0); applyZoom(1.4);
        const nl = game.ents.find(e => e.type === 'turret' && e.side === 0); nl.tier = 2; nl.cd = 0;
        for (let i = 0; i < 4; i++) { const r = spawnUnit(game, 1, i < 3 ? 'rifle' : 'heavy', nl.u + 150 + i * 26, nl.v + (i - 1.5) * 34); Object.assign(r, { holdU: r.u, holdV: r.v, cd: 1e6, hp: 1e4, maxHp: 1e4 }); }
        game.fog[0].vis.fill(1); cam.x = nl.u + 120; clampCam(); paused = true;
        update(game, 1 / 30); game.fog[0].vis.fill(1); nl.cd = 0; update(game, 1 / 30); for (const f of game.fx) if (f.k === 'beam') f.t = 0.02;
        render(ctx, game, game.t, sel, selPad);
      });
      await shot(page, dev, 'lance-split');
      pageErrors.push(...errors); await page.close();
    }
    { // an enemy Axiarch base under fog: its AI has built for 4 minutes; the player sees nothing of it
      const { page, errors } = await openPage(browser, dev);
      await page.click('#meSeg [data-f="lastfist"]'); await page.click('#foeSeg [data-f="axiarchs"]');
      await page.click('#bPlay'); await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        game.countdown = 0; hideCountdown(); updateIntro(); paused = true; game.sides[0].aiT = 1e9;
        for (let i = 0; i < 30 * 240; i++) { update(game, 1 / 30); const h = game.sides[0].hq; h.hp = h.maxHp; }
        cam.x = hqPos(1).u - 120; clampCam(); render(ctx, game, game.t, sel, selPad); refreshUI(true);
        const F = game.fog[0], hq = game.sides[1].hq;
        return { enemyBuildings: game.ents.filter(e => e.side === 1 && e.kind === 'b').length, inView: game.ents.filter(e => e.side === 1 && visibleTo(game, 0, e)).length, ghostFac: (F.ghosts[hq.id] || {}).fac, padsSeen: [0, 1, 2, 3, 4, 5, 6, 7].filter(i => cellsLit(F.seen, slotPos(1, i).u, PAD_H)).length };
      });
      console.log(`  enemy base under fog: ${r.enemyBuildings} enemy buildings, ${r.inView} in view, HQ ghost faction ${r.ghostFac}, enemy pads seen ${r.padsSeen}`);
      await shot(page, dev, 'enemy-fog');
      pageErrors.push(...errors); await page.close();
    }
    if (pageErrors.length) console.error('Page errors:', pageErrors);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
