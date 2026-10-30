// Signature buildings, Axiarchs (v2.34): screenshots at 667×375 (858×396 with --wide).
// --play first: a match as the Axiarchs against Bloomhost (Hard). Both buildings are placed by tapping their Build cards, then the
//    autoplayer runs the player's side for 3 game minutes at 1× speed (no CPU throttle); prints console errors and what happened.
// Staged scenes (seeded random): the Phase Beacon and Echo Reliquary at T1 and T3, the Beacon bubble at the front, the bubble's
// collapse, the Echoes section on the Train tab, and the Build tab at rest. Prints any console errors.
//   node tests/ax-sig-shots.js [outDir] [--wide] [--tag=axsig] [--play] [--minutes=3]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const dev = args.includes('--wide') ? PHONE : NARROW;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'axsig';
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  if (args.includes('--play')) {
    const mins = +(((args.find(a => a.startsWith('--minutes=')) || '').split('=')[1]) || 3);
    const { page, errors } = await openPage(browser, dev);
    await page.click('#meSeg [data-f="axiarchs"]'); await page.click('#foeSeg [data-f="bloomhost"]'); await page.click('#diffSeg [data-d="hard"]');
    await page.click('#bPlay');
    await page.waitForFunction(() => game && game.countdown <= 0, null, { timeout: 15000 });
    await page.click('.card[data-type="sigA"]'); await page.click('.card[data-type="sigB"]');
    const placed = await page.evaluate(() => ({ types: game.ents.filter(e => e.side === 0 && e.kind === 'b').map(e => e.type), toasts: [...$('toasts').children].map(t => t.textContent) }));
    await page.evaluate(() => { game.auto = true; game.autoDiff = 'hard'; window.__bub = 0; window.__ech = 0; setInterval(() => { if (!game) return; if (beaconPatch(game, 0)) __bub++; const r = relOf(game, 0); if (r && r.ech) __ech = Math.max(__ech, r.ech.length); }, 500); });
    const t0 = Date.now();
    while (await page.evaluate(() => game.t) < 60 * mins && Date.now() - t0 < 8 * 60e3) await page.waitForTimeout(1000);
    const r = await page.evaluate(() => { const p = beaconPatch(game, 0); return { t: game.t, speed, over: game.over, mine: game.ents.filter(e => e.side === 0 && (e.type === 'sigA' || e.type === 'sigB')).map(e => `${e.type} T${e.tier}${e.built ? '' : ' (building)'}`), bubble: p ? `at ${Math.round(p.u)}, r ${Math.round(p.r)}` : 'none', bubTicks: __bub, ech: __ech, collapses: (game.log.tot[0].bkDown || 0), echoes: game.log.tot[0].echoes || 0 }; });
    console.log(`Placed by card taps: ${placed.types.join(', ')} | toasts: ${placed.toasts.join(' / ')}`);
    console.log(`Played ${r.t.toFixed(1)} game s in ${((Date.now() - t0) / 1000).toFixed(0)} real s at ${r.speed}× (over: ${r.over}); signature buildings: ${r.mine.join(', ')}; bubble ${r.bubble} (up in ${r.bubTicks} half-second checks); collapses ${r.collapses}; most echoes stored ${r.ech}, re-warped ${r.echoes}`);
    console.log(`Console errors: ${errors.length ? errors.join(' | ') : 'none'}`);
    await page.close();
  }
  const shot = async (page, name) => { await page.waitForTimeout(150); const f = path.join(outDir, `${tag}-${name}-${dev.width}x${dev.height}.png`); fs.writeFileSync(f, await page.screenshot()); console.log(f); };
  try {
    const { page, errors } = await openPage(browser, dev, { init: 'Math.random = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
    await page.click('#meSeg [data-f="axiarchs"]'); await page.click('#foeSeg [data-f="bloomhost"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); camTouched = true; window.updateIntro = () => {}; // keep the close-up zoom
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; }
      window.__frames = n => { for (let i = 0; i < n; i++) update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); refreshUI(true); $('toasts').textContent = ''; };
      window.__fin = (type, pad) => { tryBuild(game, 0, type, pad); const b = game.sides[0].slots[pad]; b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; return b; };
      window.__tier = (b, t) => { b.tier = t; b.maxHp = bdOf(b).hp * hpMul(bdOf(b), t); b.hp = b.maxHp; };
      __fin('barracks', 0); __fin('refinery', 2); window.__bk = __fin('sigA', 6); window.__rel = __fin('sigB', 4); __rel.ech = ['lancer'];
      game.fog[0].vis.fill(1); game.fog[0].exp.fill(1); game.fog[0].seen.fill(1);
      __frames(30); applyZoom(2.2); cam.x = HQ_U + 95; clampCam(); __frames(2); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot(page, 't1');
    await page.evaluate(() => { paused = false; __tier(__bk, 3); __tier(__rel, 3); __rel.ech = ['lancer', 'parallax', 'riftmortar', 'eventide']; __frames(20); paused = true; render(ctx, game, game.t, sel, selPad); });
    await shot(page, 't3');
    // the bubble at the front: an Axiarch push past the middle node, the bubble on the lead Bastion
    await page.evaluate(() => {
      paused = false; const u0 = L / 2 + 120;
      for (let i = 0; i < 6; i++) { const e = spawnUnit(game, 0, ['bastion', 'shardling', 'lancer'][i % 3], u0 - (i % 3) * 30, (Math.floor(i / 3) - 0.5) * 50); e.holdU = e.u; e.holdV = e.v; }
      setStance(game, 0, 'hold'); for (let i = 0; i < 30 * 25; i++) update(game, 1 / 30);
      applyZoom(1.25); cam.x = u0 - 60; clampCam(); __frames(1); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot(page, 'bubble');
    // the collapse: the units in the bubble lose most of their shields and health at once
    await page.evaluate(() => {
      paused = false; for (const e of game.ents) if (e.kind === 'u' && e.side === 0 && inBeacon(game, 0, e.u, e.v)) { e.shp = 0; e.hp *= 0.5; e.shpT = game.t; }
      __frames(8); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot(page, 'collapse');
    // the Echoes section on the Train tab
    await page.evaluate(() => { paused = false; document.querySelector('.tabs [data-tab="train"]').click(); __frames(2); applyZoom(1); cam.x = HQ_U + 200; clampCam(); __frames(1); paused = true; render(ctx, game, game.t, sel, selPad); refreshUI(true); });
    await shot(page, 'echoes');
    // the Build tab at rest
    await page.evaluate(() => { paused = false; document.querySelector('.tabs [data-tab="build"]').click(); __frames(2); paused = true; render(ctx, game, game.t, sel, selPad); refreshUI(false); });
    await shot(page, 'buildtab');
    const st = await page.evaluate(() => ({ col: !!(sim => sim)(beaconOf(game, 0)) && beaconOf(game, 0).col > game.t, ech: relOf(game, 0).ech.length }));
    console.log(`Collapsed now: ${st.col}; echoes stored: ${st.ech}`);
    console.log(`Console errors: ${errors.length ? errors.join(' | ') : 'none'}`);
    await page.close();
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
