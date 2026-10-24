// Creep screenshots (v2.18) at 667×375 (858×396 with --wide): creep early, mid-game with a captured node, and enemy
// Bloomhost creep under fog (only the part a scout saw shows; the rest stays dark).
//   node tests/creep-shots.js [outDir] [--wide] [--tag=creep]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const dev = args.includes('--wide') ? PHONE : NARROW;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'creep';
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const shot = async (page, name) => { await page.waitForTimeout(150); const f = path.join(outDir, `${tag}-${name}-${dev.width}x${dev.height}.png`); fs.writeFileSync(f, await page.screenshot()); console.log(f); };
  const start = async (me, foe) => {
    const { page, errors } = await openPage(browser, dev, { init: 'Math.random = (() => { let a = 11; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
    await page.click(`#meSeg [data-f="${me}"]`); await page.click(`#foeSeg [data-f="${foe}"]`); await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); paused = true; $('toasts').textContent = '';
      window.__fin = (s, k) => { tryBuild(game, s, k); for (const b of game.ents) if (b.side === s && b.kind === 'b') { b.built = true; b.progress = 1; b.hp = b.maxHp; } };
      window.__run = secs => { for (let i = 0; i < secs * 30; i++) { update(game, 1 / 30); const h = game.sides[0].hq; h.hp = h.maxHp; } game.events.length = 0; };
      window.__show = u => { cam.x = u; clampCam(); render(ctx, game, game.t, sel, selPad); refreshUI(true); $('toasts').textContent = ''; };
    });
    return { page, errors };
  };
  try {
    { // creep early, then mid-game with a captured node
      const { page, errors } = await start('bloomhost', 'lastfist');
      const r1 = await page.evaluate(() => {
        for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 6000; }
        __fin(0, 'barracks'); __fin(0, 'refinery'); __run(25);
        for (let i = 0; i < 4; i++) { const u = spawnUnit(game, 0, 'skitterling', hqPos(0).u + 200 + i * 14, (i - 1.5) * 26); u.holdU = u.u; u.holdV = u.v; }
        __run(0.5); __show(hqPos(0).u + 220);
        return game.creep[0].map(p => `${p.k} ${p.r.toFixed(0)}/${p.R}`).join(', ');
      });
      console.log(`  early (${await page.evaluate(() => fmtTime(game.t))}): ${r1}`);
      await shot(page, 'early');
      const r2 = await page.evaluate(() => {
        for (const k of ['factory', 'techlab', 'habitat', 'turret', 'reactor']) __fin(0, k);
        const n = game.nodes[0]; n.owner = 0; n.prog = 100;
        for (let i = 0; i < 6; i++) { const u = spawnUnit(game, 0, 'skitterling', n.u - 30 + (i % 3) * 22, (i < 3 ? -20 : 20)); u.holdU = u.u; u.holdV = u.v; }
        const b = spawnUnit(game, 0, 'bulwark', n.u + 40, 0); b.holdU = b.u; b.holdV = 0;
        __run(45); __show((hqPos(0).u + n.u) / 2 + 80);
        return game.creep[0].map(p => `${p.k} ${p.r.toFixed(0)}/${p.R}`).join(', ');
      });
      console.log(`  mid (${await page.evaluate(() => fmtTime(game.t))}): ${r2}`);
      await shot(page, 'mid-node');
      if (errors.length) console.error('Page errors:', errors);
      await page.close();
    }
    { // enemy Bloomhost creep under fog: a scout looked at the edge of the enemy base once and walked away
      const { page, errors } = await start('lastfist', 'bloomhost');
      const r = await page.evaluate(() => {
        game.sides[0].aiT = 1e9; __run(200);
        const hq = game.sides[1].hq, sc = spawnUnit(game, 0, 'rifle', hq.u - 330, 0); sc.holdU = sc.u; sc.holdV = 0; __run(0.2); sc.hp = 0; __run(0.2);
        __show(hq.u - 260);
        const F = game.fog[0];
        return { enemyPatches: game.creep[1].length, remembered: Object.keys(F.creep).length, visibleCells: F.vis.reduce((a, b) => a + b, 0) };
      });
      console.log(`  enemy creep: ${r.enemyPatches} patches exist, ${r.remembered} remembered from the scout's look`);
      await shot(page, 'enemy-fog');
      if (errors.length) console.error('Page errors:', errors);
      await page.close();
    }
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
