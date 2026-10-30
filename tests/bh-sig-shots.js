// Signature buildings, Bloomhost (v2.33): screenshots at 667×375 (858×396 with --wide).
// --play first: a match as Bloomhost against Last Fist (Hard). Both buildings are placed by tapping their Build cards, then the
//    autoplayer runs the player's side for 3 game minutes at 1× speed (no CPU throttle); prints console errors and what happened.
// Staged scenes (seeded random): the Brood Mound and Rootheart at T1 and T3, Mites on the field, a T3 Mite's acid burst, and the
// Rootheart's T3 root snare at the creep's edge. Prints any console errors.
//   node tests/bh-sig-shots.js [outDir] [--wide] [--tag=bhsig] [--play] [--minutes=3]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const dev = args.includes('--wide') ? PHONE : NARROW;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'bhsig';
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  if (args.includes('--play')) {
    const mins = +(((args.find(a => a.startsWith('--minutes=')) || '').split('=')[1]) || 3);
    const { page, errors } = await openPage(browser, dev);
    await page.click('#meSeg [data-f="bloomhost"]'); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#diffSeg [data-d="hard"]');
    await page.click('#bPlay');
    await page.waitForFunction(() => game && game.countdown <= 0, null, { timeout: 15000 });
    await page.click('.card[data-type="sigA"]'); await page.click('.card[data-type="sigB"]');
    const placed = await page.evaluate(() => ({ types: game.ents.filter(e => e.side === 0 && e.kind === 'b').map(e => e.type), toasts: [...$('toasts').children].map(t => t.textContent) }));
    await page.evaluate(() => { game.auto = true; game.autoDiff = 'hard'; window.__mites = 0; window.__most = 0; window.__ids = new Set(); setInterval(() => { if (!game) return; const m = game.ents.filter(e => e.type === 'mite' && e.side === 0 && e.hp > 0); for (const e of m) __ids.add(e.id); __most = Math.max(__most, m.length); }, 250); });
    const t0 = Date.now();
    while (await page.evaluate(() => game.t) < 60 * mins && Date.now() - t0 < 8 * 60e3) await page.waitForTimeout(1000);
    const r = await page.evaluate(() => ({ t: game.t, speed, over: game.over, mine: game.ents.filter(e => e.side === 0 && (e.type === 'sigA' || e.type === 'sigB')).map(e => `${e.type} T${e.tier}${e.built ? '' : ' (building)'}`), mites: __ids.size, most: __most, creep: game.creep[0].map(p => Math.round(p.r)).join('/'), slowed: game.ents.filter(e => e.side === 1 && e.slowK === 'creep' && e.slowT > game.t).length }));
    console.log(`Placed by card taps: ${placed.types.join(', ')} | toasts: ${placed.toasts.join(' / ')}`);
    console.log(`Played ${r.t.toFixed(1)} game s in ${((Date.now() - t0) / 1000).toFixed(0)} real s at ${r.speed}× (over: ${r.over}); signature buildings: ${r.mine.join(', ')}; Mites seen ${r.mites} (at most ${r.most} at once); creep radii ${r.creep}`);
    console.log(`Console errors: ${errors.length ? errors.join(' | ') : 'none'}`);
    await page.close();
  }
  const shot = async (page, name) => { await page.waitForTimeout(150); const f = path.join(outDir, `${tag}-${name}-${dev.width}x${dev.height}.png`); fs.writeFileSync(f, await page.screenshot()); console.log(f); };
  try {
    const { page, errors } = await openPage(browser, dev, { init: 'Math.random = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
    await page.click('#meSeg [data-f="bloomhost"]'); await page.click('#foeSeg [data-f="lastfist"]'); await page.click('#bPlay'); await page.waitForTimeout(300);
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); camTouched = true; window.updateIntro = () => {}; // keep the close-up zoom
      for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; }
      window.__frames = n => { for (let i = 0; i < n; i++) update(game, 1 / 30); render(ctx, game, game.t, sel, selPad); refreshUI(true); $('toasts').textContent = ''; };
      window.__fin = (type, pad) => { tryBuild(game, 0, type, pad); const b = game.sides[0].slots[pad]; b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };
      window.__tier = (b, t) => { b.tier = t; b.maxHp = bdOf(b).hp * hpMul(bdOf(b), t); b.hp = b.maxHp; };
      __fin('barracks', 0); __fin('refinery', 2); window.__mound = __fin('sigA', 6); window.__root = __fin('sigB', 4);
      game.fog[0].vis.fill(1); game.fog[0].exp.fill(1); game.fog[0].seen.fill(1);
      __frames(30); __mound.mt = game.t + 99; applyZoom(2.2); cam.x = HQ_U + 95; clampCam(); __frames(2); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot(page, 't1');
    await page.evaluate(() => { paused = false; __tier(__mound, 3); __tier(__root, 3); __root.rt = game.t + 99; __frames(20); paused = true; render(ctx, game, game.t, sel, selPad); });
    await shot(page, 't3');
    // Mites on the field: three clutches marching on Attack
    await page.evaluate(() => {
      paused = false; setStance(game, 0, 'attack');
      for (let k = 0; k < 3; k++) { __mound.mt = game.t; __frames(30 * 3); }
      const lead = game.ents.filter(e => e.type === 'mite').reduce((a, e) => Math.max(a, e.u), 0);
      applyZoom(1.7); cam.x = lead - 40; clampCam(); __frames(1); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot(page, 'mites');
    // the acid burst: a Mite killed in a clump of enemy Riflemen
    await page.evaluate(() => {
      paused = false; const u0 = L / 2; setStance(game, 0, 'hold'); setStance(game, 1, 'hold');
      for (let i = 0; i < 5; i++) { const e = spawnUnit(game, 1, 'rifle', u0 + 18 + (i % 3) * 12, 40 + (i - 2) * 14); e.holdU = e.u; e.holdV = e.v; e.cd = 1e6; }
      const m = spawnUnit(game, 0, 'mite', u0, 40); Object.assign(m, { temp: game.t + 30, tSrc: 'mite', holdU: u0, holdV: 40, cd: 1e6 });
      __frames(1); kill(game, m, 1); __frames(5);
      applyZoom(1.9); cam.x = u0 + 10; clampCam(); __frames(1); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot(page, 'acid');
    // the T3 root snare: enemy Riflemen walking onto the creep's edge, roots erupting
    await page.evaluate(() => {
      paused = false; for (const e of game.ents) if (e.kind === 'u') e.hp = 0; __frames(1);
      const p = game.creep[0].reduce((a, q) => (q.u + q.r > a.u + a.r ? q : a)), at = v => p.u + Math.sqrt(Math.max(0, p.r * p.r - (v - p.v) ** 2)) - 6, edge = at(50);
      for (let i = 0; i < 5; i++) { const v = 10 + i * 20, e = spawnUnit(game, 1, i % 2 ? 'heavy' : 'rifle', at(v), v); e.holdU = e.u; e.holdV = e.v; e.cd = 1e6; }
      __root.rt = game.t; __frames(9);
      applyZoom(1.5); cam.x = edge - 60; clampCam(); __frames(1); paused = true; render(ctx, game, game.t, sel, selPad);
    });
    await shot(page, 'snare');
    const st = await page.evaluate(() => ({ snared: game.ents.filter(e => e.snT > game.t).length, mites: game.ents.filter(e => e.type === 'mite' && e.hp > 0).length }));
    console.log(`Snared now: ${st.snared}; Mites alive: ${st.mites}`);
    console.log(`Console errors: ${errors.length ? errors.join(' | ') : 'none'}`);
    await page.close();
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
