// v2.93 (batch 6c, Part C4): readability screenshots for the team colours and the start side, at 667×375 (iPhone SE landscape),
// written to docs/screenshots/colors6c-*.png:
//   colors6c-<faction>.png        every colour on that faction's units and buildings (one row per colour), on the battlefield ground
//   colors6c-pearl-onyx.png, colors6c-green-acid.png, colors6c-gold-blue.png, colors6c-purple-axiarch.png   real fights in those pairs
//   colors6c-setup.png            the battlefield screen (the match setup before Play) with Start and Your colour
//   colors6c-right-start.png      a match started on the right, mid-fight, with the HUD and the HQ shield count
//   node tests/colors6c-shots.js
const path = require('path'), fs = require('fs');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots'); fs.mkdirSync(OUT, { recursive: true });
const pw = findPlaywright(); if (!pw) { console.log('playwright not installed'); process.exit(0); }
const SIZE = { ...NARROW };
(async () => {
  const browser = await pw.chromium.launch();
  const shot = async (page, name) => { await page.screenshot({ path: path.join(OUT, `colors6c-${name}.png`) }); console.log('wrote', name); };
  // (a) palette sheets
  for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) {
    const { page } = await openPage(browser, SIZE);
    await page.evaluate(fac => {
      const units = UNIT_ORDER.filter(t => (UDEF[t].fac || 'lastfist') === fac && !UDEF[t].noTrain && rwShown(t) && !['bilelobber', 'riftmortar'].includes(t));
      const pickU = units.filter((t, i) => i % Math.ceil(units.length / 6) === 0).slice(0, 6), pickB = ['hq', 'barracks', 'turret'];
      const W = innerWidth, H = innerHeight, cvs = document.createElement('canvas'); cvs.width = W * 2; cvs.height = H * 2;
      Object.assign(cvs.style, { position: 'fixed', left: 0, top: 0, width: W + 'px', height: H + 'px', zIndex: 99999 });
      document.body.appendChild(cvs);
      const c = cvs.getContext('2d'); c.scale(2, 2);
      const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3c4a2f'); gr.addColorStop(1, '#2b3423'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rows = PAL_KEYS.length, rh = H / rows, cols = pickU.length + pickB.length, cw = (W - 60) / cols;
      PAL_KEYS.forEach((k, r) => {
        const T = PALETTE[k], y = (r + 1) * rh - 6;
        c.fillStyle = '#fff'; c.font = 'bold 10px system-ui'; c.fillText(T.name, 6, y - rh / 2 + 4);
        const edge = () => { if (T.edge || T.edgeDk) { c.shadowColor = T.edge || '#2c261d'; c.shadowBlur = 2.5 * 2; } }; // as drawn in a match (teamEdge)
        pickU.forEach((t, i) => { c.save(); edge(); c.translate(60 + (i + 0.5) * cw, UDEF[t].air ? y - rh / 2 : y); const s = Math.min(0.9, (rh - 6) / (visH(t) + 12)); c.scale(s, s); DRAW_U[t](c, T, { anim: 0, moving: false, recoil: 0 }); c.restore(); });
        pickB.forEach((t, i) => { const d = BD(fac, t); c.save(); edge(); c.translate(60 + (pickU.length + i + 0.5) * cw, y - 4); const s = Math.min(0.22, (rh - 4) / (d.half * 2 + d.h + 10)); c.scale(s, s); drawBOf(fac)[t](c, T, 1.2, null, 1); c.restore(); });
      });
    }, fac);
    await shot(page, fac); await page.close();
  }
  // (b) real fights in chosen pairs: both armies placed mid-field in view, run a few seconds
  const fight = async (name, tc, facs, a, b, extra) => {
    const { page } = await openPage(browser, SIZE);
    await page.evaluate(() => { localStorage.setItem('extinctionEvent.start', 'left'); });
    await page.click('#bPlay'); await page.click('#bMapGo'); await page.waitForTimeout(200);
    await page.evaluate(([tc, facs, a, b, extra]) => {
      game = newGame('hard', { seed: 9, factions: facs }); game.tc = tc; game.countdown = 0; hideCountdown(); for (const s of game.sides) s.aiT = 1e9; directControl(game, 0);
      buildCards(); refreshUI(true); camTouched = true;
      const m = L / 2;
      a.forEach(([t, n], j) => { for (let i = 0; i < n; i++) spawnUnit(game, 0, t, m - 70 - (i % 4) * 16 - j * 30, -40 + (i >> 2) * 22 + j * 8); });
      b.forEach(([t, n], j) => { for (let i = 0; i < n; i++) spawnUnit(game, 1, t, m + 70 + (i % 4) * 16 + j * 30, -40 + (i >> 2) * 22 + j * 8); });
      if (extra === 'acid') for (let i = 0; i < 3; i++) addAcid(game, 1, m - 40 + i * 20, -10 + i * 12);
      for (const s of [0, 1]) setStance(game, s, 'attack');
      for (const e of game.ents) if (e.kind === 'u') e.po = { o: 'attack' };
      cam.x = m; cam.vx = 0; clampCam();
      for (let i = 0; i < 60 * 1.6; i++) update(game, TICK);
      for (const t of document.querySelectorAll('#toasts > *')) t.remove(); applyZoom(1.5); cam.x = m; clampCam(); paused = true; drawNow();
    }, [tc, facs, a, b, extra]);
    await page.waitForTimeout(150); await shot(page, name); await page.close();
  };
  await fight('pearl-onyx', ['pearl', 'onyx'], ['lastfist', 'axiarchs'], [['rifle', 8], ['tank', 2], ['artillery', 1]], [['shardling', 6], ['lancer', 3], ['bastion', 1]]);
  await fight('green-acid', ['green', 'gold'], ['lastfist', 'bloomhost'], [['rifle', 8], ['heavy', 3]], [['spitter', 6], ['skitterling', 8], ['bilecaster', 2]], 'acid');
  await fight('gold-blue', ['gold', 'blue'], ['bloomhost', 'lastfist'], [['skitterling', 10], ['bulwark', 2], ['spitter', 3]], [['rifle', 8], ['tank', 2]]);
  await fight('purple-axiarch', ['purple', 'green'], ['axiarchs', 'axiarchs'], [['lancer', 4], ['shardling', 5], ['marksman', 2]], [['lancer', 4], ['bastion', 2], ['riftstalker', 2]]);
  await fight('onyx-axiarch', ['onyx', 'red'], ['axiarchs', 'bloomhost'], [['lancer', 4], ['shardling', 5], ['bastion', 1]], [['skitterling', 10], ['spitter', 4]]);
  // (c) the setup screen
  { const { page } = await openPage(browser, SIZE, { init: `localStorage.setItem('extinctionEvent.start','right'); localStorage.setItem('extinctionEvent.color','gold');` }); await page.click('#bPlay'); await page.waitForTimeout(200); await shot(page, 'setup'); await page.close(); }
  // (d) a match started on the right, mid-fight, the HUD and the HQ shield count in view
  {
    const { page } = await openPage(browser, SIZE, { init: `localStorage.setItem('extinctionEvent.start','right'); localStorage.setItem('extinctionEvent.color','pink');` });
    await page.click('#bPlay'); await page.click('#bMapGo'); await page.waitForTimeout(200);
    await page.evaluate(() => {
      game.countdown = 0; hideCountdown(); updateIntro(); camTouched = true; closePanel();
      const me = myS(), s = game.sides[me]; s.res.c = s.res.e = 9000;
      for (const t of ['barracks', 'refinery', 'turret']) { tryBuild(game, me, t); const b = game.ents.filter(e => e.type === t && e.side === me).pop(); b.built = true; b.progress = 1; b.hp = b.maxHp; }
      refreshShields(game);
      const hq = game.sides[me].hq;
      for (let i = 0; i < 8; i++) spawnUnit(game, me, 'rifle', hq.u - 200 - (i % 4) * 14, -30 + (i >> 2) * 20);
      for (let i = 0; i < 6; i++) spawnUnit(game, 1 - me, game.sides[1 - me].faction === 'bloomhost' ? 'skitterling' : 'rifle', hq.u - 330 - (i % 3) * 14, -20 + (i >> 1) * 12);
      game.sides[1 - me].aiT = 1e9;
      for (let i = 0; i < 60 * 2; i++) update(game, TICK);
      for (const t of document.querySelectorAll('#toasts > *')) t.remove(); cam.x = hq.u - 150; cam.vx = 0; clampCam(); refreshUI(true); paused = true; drawNow();
    });
    await page.waitForTimeout(150); await shot(page, 'right-start'); await page.close();
  }
  await browser.close();
})();
