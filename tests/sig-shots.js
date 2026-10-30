// Signature buildings, Last Fist (v2.32): screenshots at 667×375 (858×396 with --wide).
// --play first: a match as Last Fist against Bloomhost (Hard). Both buildings are placed by tapping their Build cards, then the
//    autoplayer runs the player's side for 3 game minutes at 1× speed (no CPU throttle); prints console errors and what happened.
// Staged scenes (seeded random): the Salvage Yard and Fortification Depot at T1 and T3, a node bunker, a Depot T2 bunker's
// heal ring with Riflemen inside it, and the Overdrive icon with its timer. Prints any console errors.
//   node tests/sig-shots.js [outDir] [--wide] [--tag=sig] [--play] [--minutes=3]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const dev = args.includes('--wide') ? PHONE : NARROW;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'sig';
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  if (args.includes('--play')) {
    const mins = +(((args.find(a => a.startsWith('--minutes=')) || '').split('=')[1]) || 3);
    const { page, errors } = await openPage(browser, dev);
    await page.click('#meSeg [data-f="lastfist"]'); await page.click('#foeSeg [data-f="bloomhost"]'); await page.click('#diffSeg [data-d="hard"]');
    await page.click('#bPlay');
    await page.waitForFunction(() => game && game.countdown <= 0, null, { timeout: 15000 });
    await page.click('.card[data-type="sigA"]'); await page.click('.card[data-type="sigB"]');
    const placed = await page.evaluate(() => ({ types: game.ents.filter(e => e.side === 0 && e.kind === 'b').map(e => e.type), toasts: [...$('toasts').children].map(t => t.textContent) }));
    await page.evaluate(() => { game.auto = true; game.autoDiff = 'hard'; });
    const t0 = Date.now();
    while (await page.evaluate(() => game.t) < 60 * mins && Date.now() - t0 < 8 * 60e3) await page.waitForTimeout(1000);
    const r = await page.evaluate(() => ({ t: game.t, wall: 0, speed, over: game.over, mine: game.ents.filter(e => e.side === 0 && (e.type === 'sigA' || e.type === 'sigB')).map(e => `${e.type} T${e.tier}${e.built ? '' : ' (building)'}`), bunkers: game.ents.filter(e => e.type === 'bunker').map(e => `side ${e.side} node ${e.node} T${e.tier}`), nodes: game.nodes.map(n => n.owner), salv: game.sides[0].salv.tot }));
    console.log(`Placed by card taps: ${placed.types.join(', ')} | toasts: ${placed.toasts.join(' / ')}`);
    console.log(`Played ${r.t.toFixed(1)} game s in ${((Date.now() - t0) / 1000).toFixed(0)} real s at ${r.speed}× (over: ${r.over}); signature buildings: ${r.mine.join(', ')}; bunkers: ${r.bunkers.join(', ') || 'none'}; nodes: ${JSON.stringify(r.nodes)}; salvage ${r.salv}`);
    console.log(`Console errors: ${errors.length ? errors.join(' | ') : 'none'}`);
    await page.close();
  }
  const shot = async (page, name) => { await page.waitForTimeout(150); const f = path.join(outDir, `${tag}-${name}-${dev.width}x${dev.height}.png`); fs.writeFileSync(f, await page.screenshot()); console.log(f); };
  try {
    const { page, errors } = await openPage(browser, dev, { init: 'Math.random = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
    await page.click('#meSeg [data-f="lastfist"]'); await page.click('#foeSeg [data-f="bloomhost"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); camTouched = true; window.updateIntro = () => {}; // keep the close-up zoom
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; }
      window.__frames = n => { for (let i = 0; i < n; i++) update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); refreshUI(true); $('toasts').textContent = ''; };
      window.__fin = (type, pad) => { tryBuild(game, 0, type, pad); const b = game.sides[0].slots[pad]; b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };
      window.__tier = (b, t) => { b.tier = t; b.maxHp = bdOf(b).hp * hpMul(bdOf(b), t); b.hp = b.maxHp; };
      __fin('barracks', 0); __fin('refinery', 2); window.__yard = __fin('sigA', 6); window.__dep = __fin('sigB', 4);
      game.fog[0].vis.fill(1); game.fog[0].exp.fill(1); game.fog[0].seen.fill(1);
      __frames(30); applyZoom(2.2); cam.x = HQ_U + 95; clampCam(); __frames(2); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot(page, 't1');
    await page.evaluate(() => { paused = false; __tier(__yard, 3); __tier(__dep, 3); __frames(20); paused = true; render(ctx, game, game.t, sel, selPad); });
    await shot(page, 't3');
    // a node bunker at T1: the west node taken by Riflemen, an enemy Skitterling pack walking into its gun
    await page.evaluate(() => {
      paused = false; __tier(__dep, 1);
      const n = game.nodes[0]; n.owner = 0; n.prog = 100;
      for (let i = 0; i < 3; i++) { const e = spawnUnit(game, 0, 'rifle', n.u - 30 + i * 14, -20 + i * 18); e.holdU = e.u; e.holdV = e.v; }
      for (let i = 0; i < 4; i++) { const e = spawnUnit(game, 1, 'skitterling', n.u + 170 + i * 12, -30 + i * 20); e.holdU = n.u + 40; e.holdV = e.v; }
      setStance(game, 0, 'hold'); setStance(game, 1, 'attack'); __frames(60);
      applyZoom(1.6); cam.x = n.u + 40; clampCam(); __frames(1); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot(page, 'bunker');
    // Depot T2: the heal ring, wounded Riflemen inside it
    await page.evaluate(() => {
      paused = false; __tier(__dep, 2);
      for (const e of game.ents) if (e.kind === 'u' && e.side === 1) e.hp = 0;
      for (const e of game.ents) if (e.kind === 'u' && e.side === 0) e.hp = e.maxHp * 0.5;
      __frames(20); applyZoom(1.25); cam.x = game.nodes[0].u + 20; clampCam(); __frames(1); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot(page, 'heal');
    // Overdrive: the Yard at T3, overflow on a capped minute starts it
    await page.evaluate(() => {
      paused = false; __tier(__yard, 3);
      const sd = game.sides[0]; sd.salv.m = Math.floor(game.t / SALVAGE.per); sd.salv.n = SALVAGE.cap * YARD.cap;
      const foe = spawnUnit(game, 1, 'bulwark', HQ_U + 120, 20); kill(game, foe, 0);
      __frames(30 * 3); applyZoom(1.3); cam.x = HQ_U + 150; clampCam(); __frames(1); paused = true; render(ctx, game, game.t, sel, selPad); refreshUI(true);
    });
    await shot(page, 'overdrive');
    const st = await page.evaluate(() => ({ od: overdrive(game, 0), left: Math.ceil(game.sides[0].od - game.t), bunkers: game.ents.filter(e => e.type === 'bunker').length, pill: !$('od').classList.contains('hide') }));
    console.log(`Overdrive on: ${st.od} (${st.left} s left), pill shown: ${st.pill}; bunkers: ${st.bunkers}`);
    console.log(`Console errors: ${errors.length ? errors.join(' | ') : 'none'}`);
    await page.close();
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
