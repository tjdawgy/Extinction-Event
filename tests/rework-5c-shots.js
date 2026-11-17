// v2.90 (batch 5c: Axiarch art, the Needlewing AI fix, the Medevac rename): screenshots at 667×375 (iPhone landscape in the viewer).
//   node tests/rework-5c-shots.js [shot ...]   → docs/screenshots/rework5c-<shot>-667x375.png
// Shots: units (the five redrawn Axiarch units, blue against red, in the Test Range at real size), lineup (every Axiarch unit side by
// side, both colours, as DRAW_U draws them), match (a real Hard AI self-play match, Bloomhost vs Last Fist, b5c on, nothing forced or
// spawned: paused while a Needlewing stings an aircraft), medevac (the Medevac's Codex entry).
const path = require('path');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');
const want = process.argv.slice(2);
const on = s => !want.length || want.includes(s);

const setup = (page, o) => page.evaluate(o => {
  TR.set = Object.assign(trNewSet(), { rows: 1, modes: o.modes || ['attack', 'attack'], fight: o.fight !== false });
  TR.set.rw = [0, 1, 2].map(() => rwInit());
  for (const it of o.items) for (let i = 0; i < (it.n || 1); i++) TR.set.items.push({ id: TR.set.nid++, row: 0, side: it.side, kind: 'u', type: it.type, u: it.u + (i % (it.w || 5)) * (it.dx ?? 16), v: it.v + Math.floor(i / (it.w || 5)) * (it.dv ?? 22) });
  TR.go = false; trBuild(); hideOverlay();
  if (o.zoom) { window.trZoom = () => {}; applyZoom(o.zoom); }
  cam.x = o.cam || 860; clampCam(); TR.go = true; trTopUI();
}, o);
const run = (page, fn, sec = 30) => page.evaluate(([f, sec]) => { const F = new Function('game', 'return (' + f + ')(game)'); for (let i = 0; i < sec * 60; i++) { if (F(game)) return true; rangeStep(game); } return false; }, [fn.toString(), sec]);
const pause = async page => { await page.evaluate(() => { TR.go = false; trTopUI(); }); await page.waitForTimeout(300); };
const AX = ['shardling', 'riftstalker', 'parallax', 'lancer', 'marksman', 'bastion', 'severance', 'worldbreaker', 'gravemantle', 'eventide', 'wraithwing', 'prismwing', 'shardstorm', 'voidcarrier', 'sovereign'];
const NEW = ['lancer', 'gravemantle', 'eventide', 'prismwing', 'shardstorm'];

(async () => {
  const pw = findPlaywright(); if (!pw) { console.error('playwright not installed'); process.exit(1); }
  const browser = await pw.chromium.launch(), dev = NARROW, errs = [], miss = [], ok = (b, n) => { if (!b) miss.push(n); };
  const shot = async (page, name) => { await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); }); await page.screenshot({ path: path.join(OUT, `rework5c-${name}-${dev.width}x${dev.height}.png`) }); console.log('wrote', name); };
  const open = async () => { const r = await openPage(browser, dev); await r.page.click('#bRange'); await r.page.waitForTimeout(300); await r.page.evaluate(() => hideOverlay()); return r; };
  if (on('units')) { // a. the five redrawn units at real size in the Test Range, blue against red (on Hold, no fight)
    const { page, errors } = await open();
    const items = []; NEW.forEach((t, i) => { const u = 700 + i * 62; items.push({ side: 0, type: t, u, v: 30 }, { side: 1, type: t, u: u + 12, v: 150 }); });
    await setup(page, { cam: 820, zoom: 1.5, modes: ['hold', 'hold'], fight: false, items });
    await run(page, () => false, 0.5); await pause(page); await shot(page, 'units'); errs.push(...errors); await page.close();
  }
  if (on('lineup')) { // b. the whole Axiarch army side by side, both colours, at about real size (2.0× the unit scale)
    const { page, errors } = await open();
    await page.evaluate(AX => {
      const cv = document.createElement('canvas'), W = innerWidth, H = innerHeight, dpr = devicePixelRatio || 1; cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99;background:#39412f`;
      document.body.appendChild(cv); const c = cv.getContext('2d'); c.scale(dpr, dpr); c.fillStyle = '#39412f'; c.fillRect(0, 0, W, H);
      c.font = 'bold 8px system-ui'; c.textAlign = 'center';
      const K = 0.92 * US, ground = AX.filter(t => !UDEF[t].air), air = AX.filter(t => UDEF[t].air), NEW = ['lancer', 'gravemantle', 'eventide', 'prismwing', 'shardstorm'];
      const row = (L, y, gap) => { const cw = W / L.length; L.forEach((t, i) => { const x = cw * (i + 0.5), A = UDEF[t].air;
        for (let s = 0; s < 2; s++) { c.save(); c.translate(x, y + (s ? 10 : 0) - (A ? 0 : 0)); c.translate(s ? 12 : -12, 0); const k = K * (A && (t === 'sovereign' || t === 'voidcarrier') ? 0.75 : 1); c.scale(k * (s ? -1 : 1), k);
          if (!A) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 0, 12, 3, 0, 0, 7); c.fill(); }
          DRAW_U[t](c, TEAM[s], { anim: 0.7, moving: false, recoil: 0, u: 0, side: s, type: t }); c.restore(); }
        c.fillStyle = NEW.includes(t) ? '#ffe9a8' : '#d6dfee'; c.fillText(UDEF[t].name.replace('Astral ', ''), x, y + gap); }); };
      row(ground, 150, 22); row(air, 290, 34);
      c.fillStyle = '#ffe9a8'; c.font = 'bold 9px system-ui'; c.fillText('The Axiarchs (v2.90): batch 5c units named in gold', W / 2, 18);
    }, AX);
    await page.waitForTimeout(200); await shot(page, 'lineup'); errs.push(...errors); await page.close();
  }
  if (on('match')) { // c. a real self-play match (audit/sim/selfplay-5c.js seed 8, Classic, Last Fist vs Bloomhost, Hard vs Hard, b5c on, nothing
    // forced or spawned), played in the page with the script's own steps until a Needlewing strikes an aircraft, then shown live
    const { page, errors } = await openPage(browser, dev);
    await page.evaluate(() => { devPick.a = { f: 'lastfist', ai: 'default', p: 'random' }; devPick.b = { f: 'bloomhost', ai: 'default', p: 'random' }; devPick.speed = 1; startSpectate(); paused = true; });
    const found = await page.evaluate(() => {
      game = newGame('hard', { seed: 8, map: 'classic', autoPlayer: true, autoDiff: 'hard', factions: ['lastfist', 'bloomhost'] }); game.countdown = 0; game.spectate = true;
      const hits = () => (game.sides[1].sw5 || {}).needleAir || 0;
      for (let k = 0; k < 30 * 1700 && !game.over; k++) {
        const h0 = hits(); update(game, 1 / 30); game.events.length = 0;
        if (hits() > h0 && hits() >= 30) { // a few strikes in: the pack is on its prey
          const nw = game.ents.filter(e => e.type === 'needlewing' && e.side === 1 && e.hp > 0), air = game.ents.filter(e => e.kind === 'u' && e.side === 0 && e.hp > 0 && UDEF[e.type].air);
          const pr = air.map(a => [a, nw.filter(n => Math.abs(a.u - n.u) < 50).length]).sort((a, b) => b[1] - a[1])[0];
          if (pr && pr[1] >= 2) { applyZoom(1.35); cam.x = P(pr[0].u, pr[0].v).x; clampCam(); refreshUI(true); return { t: game.t, hits: hits(), rw: game.rw.b5c, path: game.ents.filter(e => e.type === 'techlab' && e.side === 1).map(e => e.path).join() }; }
        }
      }
      return null;
    });
    console.log('match:', JSON.stringify(found)); ok(found, 'match');
    await page.waitForTimeout(400);
    await shot(page, 'match'); errs.push(...errors); await page.close();
  }
  if (on('medevac')) { // d. the Medevac's Codex entry (Last Fist tab), scrolled to it: the new name, its picture and text
    const { page, errors } = await openPage(browser, dev);
    ok(await page.evaluate(() => openCodex('lastfist', 'unit:medic')), 'medevac codex');
    await page.waitForTimeout(500); await shot(page, 'medevac'); errs.push(...errors); await page.close();
  }
  await browser.close();
  if (errs.length) console.error('page errors:', errs);
  if (miss.length) { console.error('scenes not reached:', miss); process.exit(1); }
})();
