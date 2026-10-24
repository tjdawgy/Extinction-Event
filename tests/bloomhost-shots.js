// Bloomhost screenshots (v2.17): the match setup menu (both phone sizes), a Bloomhost base early and mid-game, and an
// enemy Bloomhost base under fog with nothing revealed (667×375 unless --wide).
//   node tests/bloomhost-shots.js [outDir] [--wide] [--tag=bloomhost]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'bloomhost';
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const out = [];
  const shot = async (page, dev, name) => { await page.waitForTimeout(150); const f = path.join(outDir, `${tag}-${name}-${dev.width}x${dev.height}.png`); fs.writeFileSync(f, await page.screenshot()); out.push(f); console.log(f); };
  try {
    for (const dev of [NARROW, PHONE]) { // the setup menu: Difficulty, You, Opponent
      const { page, errors } = await openPage(browser, dev);
      await page.click('#meSeg [data-f="bloomhost"]'); await page.click('#foeSeg [data-f="random"]');
      const fit = await page.evaluate(() => { const b = $('box'); return { fits: b.scrollHeight <= b.clientHeight + 1, play: (() => { const r = $('bPlay').getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0; })() }; });
      console.log(`  setup at ${dev.width}x${dev.height}: fits without scrolling ${fit.fits}, Start button on screen ${fit.play}`);
      await shot(page, dev, 'setup');
      if (errors.length) console.error('Page errors:', errors);
      await page.close();
    }
    const dev = args.includes('--wide') ? PHONE : NARROW;
    { // a Bloomhost base, early and mid-game
      const { page, errors } = await openPage(browser, dev, { init: 'Math.random = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
      await page.click('#meSeg [data-f="bloomhost"]'); await page.click('#foeSeg [data-f="lastfist"]');
      await page.click('#bPlay'); await page.waitForTimeout(300);
      await page.evaluate(() => {
        game.countdown = 0; hideCountdown(); updateIntro(); paused = false;
        for (const s of game.sides) { s.aiT = 1e9; s.res.c = 6000; s.res.e = 3000; }
        window.__fin = k => { const r = tryBuild(game, 0, k); for (const b of game.ents) if (b.side === 0 && b.kind === 'b') { b.built = true; b.progress = 1; b.hp = b.maxHp; } return r; };
        window.__frames = n => { for (let i = 0; i < n; i++) { update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); } refreshUI(true); };
        __fin('barracks'); __fin('refinery'); tryBuild(game, 0, 'reactor');
        const r = game.ents.find(e => e.type === 'reactor' && e.side === 0); r.progress = 0.55;
        for (let i = 0; i < 5; i++) { const s = spawnUnit(game, 0, 'skitterling', hqPos(0).u + 250 + i * 14, (i - 2) * 22); s.holdU = s.u; s.holdV = s.v; }
        setStance(game, 0, 'hold'); cam.x = hqPos(0).u + 210; clampCam(); __frames(20);
      });
      await shot(page, dev, 'base-early');
      await page.evaluate(() => {
        for (const k of ['factory', 'techlab', 'habitat', 'turret', 'refinery']) __fin(k);
        for (const b of game.ents.filter(e => e.side === 0 && e.kind === 'b')) if (['hq', 'refinery', 'habitat', 'turret', 'reactor'].includes(b.type)) b.tier = b.type === 'turret' || b.type === 'hq' ? 3 : 2;
        game.ents.find(e => e.type === 'reactor' && e.side === 0).progress = 1;
        for (const b of game.ents) if (b.side === 0 && b.kind === 'b') { b.built = true; b.maxHp = bdOf(b).hp * hpMul(bdOf(b), b.tier); b.hp = b.maxHp; }
        const u0 = hqPos(0).u + 280;
        for (let i = 0; i < 2; i++) { const s = spawnUnit(game, 0, 'bulwark', u0 + 40, (i ? 30 : -30)); s.holdU = s.u; s.holdV = s.v; }
        for (let i = 0; i < 2; i++) { const s = spawnUnit(game, 0, 'razorwing', u0 - 20 + i * 30, (i ? 20 : -20)); s.holdU = s.u; s.holdV = s.v; }
        game.t = 600; cam.x = hqPos(0).u + 210; clampCam(); __frames(30);
      });
      await shot(page, dev, 'base-mid');
      if (errors.length) console.error('Page errors:', errors);
      await page.close();
    }
    { // an enemy Bloomhost base under fog: its AI has built for 4 minutes; the player sees nothing of it
      const { page, errors } = await openPage(browser, dev);
      await page.click('#meSeg [data-f="lastfist"]'); await page.click('#foeSeg [data-f="bloomhost"]');
      await page.click('#bPlay'); await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        game.countdown = 0; hideCountdown(); updateIntro(); paused = true; game.sides[0].aiT = 1e9;
        for (let i = 0; i < 30 * 240; i++) { update(game, 1 / 30); const h = game.sides[0].hq; h.hp = h.maxHp; } // the idle player's HQ is kept standing for the picture
        cam.x = hqPos(1).u - 120; clampCam(); render(ctx, game, game.t, sel, selPad); refreshUI(true);
        const F = game.fog[0], hq = game.sides[1].hq;
        return { enemyBuildings: game.ents.filter(e => e.side === 1 && e.kind === 'b').length, inView: game.ents.filter(e => e.side === 1 && visibleTo(game, 0, e)).length, ghostFac: (F.ghosts[hq.id] || {}).fac, padsSeen: [0, 1, 2, 3, 4, 5, 6, 7].filter(i => cellsLit(F.seen, slotPos(1, i).u, PAD_H)).length };
      });
      console.log(`  enemy base under fog: ${r.enemyBuildings} enemy buildings, ${r.inView} in view, HQ ghost faction ${r.ghostFac}, enemy pads seen ${r.padsSeen}`);
      await shot(page, dev, 'enemy-fog');
      if (errors.length) console.error('Page errors:', errors);
      await page.close();
    }
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
