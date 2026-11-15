// v2.84 (docs/FACTION_REWORK.md batch 3a): Test Range screenshots at 667×375 (iPhone landscape in the viewer).
//   node tests/rework-3a-shots.js   → docs/screenshots/rework3a-<shot>-667x375.png
// Shots: latch (Leapers latched on a Tank), hatch (Skitterlings hatching as it dies), strike (a Riftstalker striking a
// backline unit), chain (its chain blink), home (blinking home when its shields break), swap (a Parallax swapping with
// a wounded ally), devour (a Ravager devouring remains), stacks (a Ravager at 3 stacks beside one with none), and a
// frame-time check with six of each of the four on screen.
const path = require('path');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

const setup = (page, o) => page.evaluate(o => {
  TR.set = Object.assign(trNewSet(), { rows: o.rows || 1, modes: o.modes || ['attack', 'attack'], fight: o.fight !== false });
  TR.set.rw = [0, 1, 2].map(k => rwInit(o.rw && o.rw[k]));
  for (const it of o.items) for (let k = 0; k < (o.rows || 1); k++) if (it.row === undefined || it.row === k) {
    if (it.b) { TR.set.items.push({ id: TR.set.nid++, row: k, side: it.side, kind: 'b', fac: it.fac, type: it.b, u: it.u, v: it.v }); continue; }
    for (let i = 0; i < (it.n || 1); i++) TR.set.items.push({ id: TR.set.nid++, row: k, side: it.side, kind: 'u', type: it.type, u: it.u + (i % 5) * (it.dx ?? 16), v: it.v + Math.floor(i / 5) * 22 - ((it.n || 1) > 5 ? 11 : 0) + (i % 2) * 6 });
  }
  TR.go = false; trBuild(); hideOverlay();
  cam.x = o.cam || 860; clampCam();
  TR.go = true; trTopUI();
}, o);
// steps the SIM in the page until fn(game) is true (a headless page runs slower than real time), at most sec game seconds
const run = (page, fn, sec = 30) => page.evaluate(([f, sec]) => { const F = new Function('game', 'return (' + f + ')(game)'); for (let i = 0; i < sec * 60; i++) { if (F(game)) return true; rangeStep(game); } return false; }, [fn.toString(), sec]);
const pause = async page => { await page.evaluate(() => { TR.go = false; trTopUI(); }); await page.waitForTimeout(250); };

(async () => {
  const pw = findPlaywright(); if (!pw) { console.error('playwright not installed'); process.exit(1); }
  const browser = await pw.chromium.launch(), dev = NARROW;
  const shot = async (page, name) => { await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); }); await page.screenshot({ path: path.join(OUT, `rework3a-${name}-${dev.width}x${dev.height}.png`) }); console.log('wrote', name); };
  const open = async () => { const r = await openPage(browser, dev); await r.page.click('#bRange'); await r.page.waitForTimeout(300); await r.page.evaluate(() => hideOverlay()); return r; };
  const errs = [], miss = [];
  const ok = (b, n) => { if (!b) miss.push(n); };
  { // a. Leapers latched on a Tank, then Skitterlings hatching as it dies
    const { page, errors } = await open();
    await setup(page, { cam: 820, modes: ['attack', 'hold'], items: [{ side: 0, type: 'leaper', u: 640, v: -20, n: 4, dx: 14 }, { side: 1, type: 'tank', u: 800, v: 0 }, { side: 1, type: 'rifle', u: 1010, v: 40, n: 3, dx: 16 }] });
    ok(await run(page, g => g.ents.filter(e => e.type === 'leaper' && e.lt).length >= 3 && g.ents.some(e => e.type === 'leaper' && e.ltF >= 3)), 'latch');
    await page.evaluate(() => { const T = game.ents.find(e => e.type === 'tank'); cam.x = T.u + 30; clampCam(); });
    await pause(page); await shot(page, 'latch');
    await page.evaluate(() => { const T = game.ents.find(e => e.type === 'tank'); T.hp = 8; });
    ok(await run(page, g => g.fx.some(f => f.k === 'hatch' && f.t > 0.5)), 'hatch');
    await pause(page); await shot(page, 'hatch'); errs.push(...errors); await page.close();
  }
  { // b. A Riftstalker striking a backline unit, chain-blinking on the kill, and blinking home when its shields break
    const { page, errors } = await open();
    await setup(page, { cam: 860, modes: ['attack', 'hold'], fight: false, items: [{ side: 0, type: 'riftstalker', u: 640, v: 0 }, { side: 1, type: 'sniper', u: 760, v: -10 }, { side: 1, type: 'sniper', u: 850, v: 30 }, { side: 1, type: 'artillery', u: 930, v: -20 }, { side: 1, type: 'heavy', u: 980, v: 60, n: 2 }] });
    await page.evaluate(() => { for (const e of game.ents) if (e.side === 1 && e.type !== 'heavy') e.hp = 12; });
    ok(await run(page, g => g.ents.some(e => e.type === 'riftstalker' && e.rsH && e.leaping && e.z > 10)), 'strike');
    await pause(page); await shot(page, 'strike');
    ok(await run(page, g => g.fx.some(f => f.k === 'rsblink' && !f.home && f.t > 0.06 && f.t < 0.2)), 'chain');
    await pause(page); await shot(page, 'chain');
    // home: a fresh setup where a guarded sniper's escort breaks its shields
    await setup(page, { cam: 860, modes: ['attack', 'attack'], items: [{ side: 0, type: 'riftstalker', u: 640, v: 0 }, { side: 1, type: 'sniper', u: 760, v: 0 }, { side: 1, type: 'heavy', u: 790, v: -30, n: 4, dx: 14 }, { side: 1, type: 'rifle', u: 800, v: 30, n: 5, dx: 12 }] });
    await page.evaluate(() => { const s = game.ents.find(e => e.type === 'sniper'); s.hp = s.maxHp = 5000; const R = game.ents.find(e => e.type === 'riftstalker'); R.hp = R.maxHp = 2000; });
    ok(await run(page, g => g.fx.some(f => f.k === 'rsblink' && f.home && f.t > 0.08 && f.t < 0.25)), 'home');
    await page.evaluate(() => { const f = game.fx.find(f => f.k === 'rsblink' && f.home); if (f) { cam.x = (f.x + f.x2) / 2 + 30; clampCam(); } });
    await pause(page); await shot(page, 'home'); errs.push(...errors); await page.close();
  }
  { // c. A Parallax swapping with a wounded ally
    const { page, errors } = await open();
    await setup(page, { cam: 820, modes: ['hold', 'attack'], items: [{ side: 0, type: 'parallax', u: 600, v: 30 }, { side: 0, type: 'bastion', u: 720, v: -10 }, { side: 0, type: 'lancer', u: 640, v: -40, n: 2, dx: 20 }, { side: 1, type: 'rifle', u: 860, v: -10, n: 8, dx: 14 }, { side: 1, type: 'heavy', u: 900, v: 40, n: 3, dx: 16 }] });
    await page.evaluate(() => { const b = game.ents.find(e => e.type === 'bastion'); b.hp = b.maxHp * 0.34; b.shp = 0; });
    ok(await run(page, g => g.fx.some(f => f.k === 'swap' && f.t > 0.08 && f.t < 0.2)), 'swap');
    await pause(page); await shot(page, 'swap'); errs.push(...errors); await page.close();
  }
  { // d. A Ravager devouring remains; a Ravager at 3 stacks beside one with none
    const { page, errors } = await open();
    await setup(page, { cam: 800, modes: ['hold', 'hold'], items: [{ side: 0, type: 'ravager', u: 700, v: 0 }, { side: 1, type: 'rifle', u: 730, v: 10, n: 3, dx: 12 }, { side: 1, type: 'tank', u: 1000, v: -40 }] });
    await page.evaluate(() => { for (const e of game.ents) if (e.type === 'rifle') e.hp = 1; });
    ok(await run(page, g => g.ents.some(e => e.type === 'ravager' && e.dvT && e.dvT - g.t < 1.1 && !e.moving)), 'devour');
    await pause(page); await shot(page, 'devour');
    await setup(page, { cam: 820, modes: ['hold', 'hold'], fight: false, items: [{ side: 0, type: 'ravager', u: 740, v: -20 }, { side: 0, type: 'ravager', u: 800, v: 20 }, { side: 1, type: 'shardling', u: 1050, v: 0 }] });
    await page.evaluate(() => { const R = game.ents.filter(e => e.type === 'ravager').sort((a, b) => a.u - b.u)[1]; R.rvB = R.maxHp; R.rvS = 3; R.maxHp = R.rvB * (1 + 3 * RAV.hp); R.hp = R.maxHp * 0.8; });
    await page.waitForTimeout(400); await pause(page); await shot(page, 'stacks'); errs.push(...errors); await page.close();
  }
  { // frame time: six of each of the four plus a crowd, at 1×
    const { page, errors } = await open();
    await setup(page, { cam: 880, items: [{ side: 0, type: 'leaper', u: 620, v: -40, n: 6, dx: 18 }, { side: 0, type: 'ravager', u: 660, v: 30, n: 6, dx: 22 }, { side: 0, type: 'rifle', u: 600, v: 70, n: 5 }, { side: 1, type: 'riftstalker', u: 1100, v: -30, n: 6, dx: 18 }, { side: 1, type: 'parallax', u: 1140, v: 30, n: 6, dx: 20 }, { side: 1, type: 'lancer', u: 1180, v: 0, n: 10 }, { side: 1, type: 'tank', u: 1000, v: 0, n: 0 }, { side: 0, type: 'tank', u: 560, v: 0, n: 5, dx: 26 }, { side: 0, type: 'bulwark', u: 700, v: -70, n: 5, dx: 22 }, { side: 1, type: 'bastion', u: 1220, v: -60, n: 5, dx: 24 }, { side: 1, type: 'shardling', u: 1200, v: 70, n: 5 }] });
    await page.waitForTimeout(3000);
    const ft = await page.evaluate(() => new Promise(res => { const t = []; let last = performance.now(), n = 0; const f = now => { t.push(now - last); last = now; if (++n < 180) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); }));
    const extra = await page.evaluate(() => ({ units: game.ents.filter(e => e.kind === 'u' && e.hp > 0).length, latched: game.ents.filter(e => e.lt).length, rem: (game.rem || []).length }));
    ft.sort((a, b) => a - b);
    console.log(`frame time with 6 Leapers, 6 Ravagers, 6 Riftstalkers, 6 Parallaxes and ${extra.units - 24} others (${extra.latched} latched, ${extra.rem} remains; headless, 2× pixels): median ${ft[90].toFixed(1)} ms, 95th ${ft[171].toFixed(1)} ms`);
    errs.push(...errors); await page.close();
  }
  if (miss.length) console.error('moments not reached (shot taken anyway):', miss);
  if (errs.length) { console.error('page errors:', errs); process.exitCode = 1; }
  await browser.close();
})();
