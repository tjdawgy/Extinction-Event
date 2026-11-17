// v2.87 (docs/FACTION_REWORK.md batch 4b): Test Range screenshots at 667×375 (iPhone landscape in the viewer).
//   node tests/rework-4b-shots.js   → docs/screenshots/rework4b-<shot>-667x375.png
// Shots: hydra-track (a Hydra tracking a hopping Wraithwing, Part 0), leviathan-pass (a Leviathan mid-pass dropping its
// carpet), pustules (pustules on a building), pus-burst (Mites bursting out as it falls), worldrender-landed (a landed
// Worldrender attacked by ground units), sovereign-lock (the lock-on line mid-charge), sovereign-beam (the beam firing), and a
// frame-time check with several of each of the five on screen.
const path = require('path');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

const setup = (page, o) => page.evaluate(o => {
  TR.set = Object.assign(trNewSet(), { rows: 1, modes: o.modes || ['attack', 'attack'], fight: o.fight !== false });
  TR.set.rw = [0, 1, 2].map(k => rwInit(o.rw && o.rw[k]));
  for (const it of o.items) {
    if (it.b) { TR.set.items.push({ id: TR.set.nid++, row: 0, side: it.side, kind: 'b', fac: it.fac, type: it.b, u: it.u, v: it.v }); continue; }
    for (let i = 0; i < (it.n || 1); i++) TR.set.items.push({ id: TR.set.nid++, row: 0, side: it.side, kind: 'u', type: it.type, u: it.u + (i % (it.w || 5)) * (it.dx ?? 16), v: it.v + Math.floor(i / (it.w || 5)) * (it.dv ?? 22) + (i % 2) * 4 });
  }
  TR.go = false; trBuild(); hideOverlay();
  cam.x = o.cam || 860; clampCam();
  TR.go = true; trTopUI();
}, o);
// steps the SIM in the page until fn(game) is true (a headless page runs slower than real time), at most sec game seconds
const run = (page, fn, sec = 30) => page.evaluate(([f, sec]) => { const F = new Function('game', 'return (' + f + ')(game)'); for (let i = 0; i < sec * 60; i++) { if (F(game)) return true; rangeStep(game); } return false; }, [fn.toString(), sec]);
const pause = async page => { await page.evaluate(() => { TR.go = false; trTopUI(); }); await page.waitForTimeout(250); };
const camAt = (page, u) => page.evaluate(u => { cam.x = u; clampCam(); }, u);

(async () => {
  const pw = findPlaywright(); if (!pw) { console.error('playwright not installed'); process.exit(1); }
  const browser = await pw.chromium.launch(), dev = NARROW;
  const shot = async (page, name) => { await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); }); await page.screenshot({ path: path.join(OUT, `rework4b-${name}-${dev.width}x${dev.height}.png`) }); console.log('wrote', name); };
  const open = async () => { const r = await openPage(browser, dev); await r.page.click('#bRange'); await r.page.waitForTimeout(300); await r.page.evaluate(() => hideOverlay()); return r; };
  const errs = [], miss = [];
  const ok = (b, n) => { if (!b) miss.push(n); };
  { // a. A Hydra tracking a hopping Wraithwing (Part 0): its tracer on the Wraithwing just after a hop
    const { page, errors } = await open();
    await setup(page, { cam: 700, modes: ['hold', 'attack'], items: [{ side: 0, type: 'hydra', u: 600, v: 0 }, { side: 0, type: 'heavy', u: 620, v: 40, n: 2, dx: 16 }, { side: 1, type: 'wraithwing', u: 760, v: -10, n: 2, w: 1, dx: 0, dv: 40 }] });
    await page.evaluate(() => { for (const e of game.ents) { e.hp = e.maxHp = 6000; if (e.maxShp) e.shp = e.maxShp = 4000; } });
    ok(await run(page, g => { const H = g.ents.find(e => e.type === 'hydra'), W = g.ents.find(e => e.id === H.tgt); return W && W.wwT > g.t && g.t - W.hopS < 0.25 && g.t - W.hopS > 0.05 && g.projs.some(p => p.side === 0 && p.target === W); }), 'hydra-track');
    await pause(page); await shot(page, 'hydra-track'); errs.push(...errors); await page.close();
  }
  { // b. A Leviathan mid-pass, its bay open, its carpet falling in a line across the target
    const { page, errors } = await open();
    await setup(page, { cam: 720, modes: ['attack', 'hold'], items: [{ side: 0, type: 'leviathan', u: 520, v: 0 }, { side: 0, type: 'interceptor', u: 500, v: 30, n: 2, dx: 16 }, { side: 1, b: 'refinery', fac: 'bloomhost', u: 760, v: 0 }, { side: 1, type: 'skitterling', u: 790, v: 30, n: 4, dx: 12 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 6000; });
    ok(await run(page, g => { const L = g.ents.find(e => e.type === 'leviathan'); return L.lvB && L.lvR && L.lvR.k === 3 && g.projs.filter(p => p.carpet).length >= 2 && g.projs.some(p => p.carpet && p.t > 0.25 && p.t < 0.4); }), 'leviathan-pass');
    await pause(page); await shot(page, 'leviathan-pass'); errs.push(...errors); await page.close();
  }
  { // c. Pustules on a building, then Mites bursting out as it falls
    const { page, errors } = await open();
    await setup(page, { cam: 720, modes: ['attack', 'hold'], items: [{ side: 0, type: 'broodtyrant', u: 580, v: -10, n: 2, w: 1, dx: 0, dv: 40 }, { side: 1, b: 'refinery', fac: 'lastfist', u: 760, v: 0 }, { side: 1, b: 'turret', fac: 'lastfist', u: 740, v: 70 }] });
    await page.evaluate(() => { for (const e of game.ents) if (e.kind === 'u') e.hp = e.maxHp = 6000; for (const e of game.ents) if (e.kind === 'b') { e.hp = e.maxHp = 3000; e.cd = 1e9; } });
    ok(await run(page, g => g.ents.some(e => e.kind === 'b' && e.pus === 3)), 'pustules');
    await page.evaluate(() => { for (const e of game.ents) if (e.type === 'broodtyrant') e.cd = 1e9; });
    await pause(page); await shot(page, 'pustules');
    await page.evaluate(() => { const b = game.ents.find(e => e.kind === 'b' && e.pus === 3); b.hp = 4; TR.go = true; });
    ok(await run(page, g => g.fx.some(f => f.k === 'pusburst' && f.t > 0.8 && f.t < 0.9)), 'pus-burst');
    await pause(page); await shot(page, 'pus-burst'); errs.push(...errors); await page.close();
  }
  { // d. A landed Worldrender, attacked by ground units
    const { page, errors } = await open();
    await setup(page, { cam: 700, modes: ['attack', 'attack'], items: [{ side: 0, type: 'worldrender', u: 580, v: 0 }, { side: 1, b: 'barracks', fac: 'lastfist', u: 660, v: 0 }, { side: 1, type: 'tank', u: 800, v: -40, n: 2, dx: 30 }, { side: 1, type: 'rifle', u: 780, v: 40, n: 5, dx: 14 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 8000; });
    ok(await run(page, g => { const W = g.ents.find(e => e.type === 'worldrender'); return W.lnd === 2 && g.ents.filter(e => e.side === 1 && e.kind === 'u' && e.tgt === W.id).length >= 4 && g.projs.some(p => p.target === W); }), 'worldrender-landed');
    await pause(page); await shot(page, 'worldrender-landed'); errs.push(...errors); await page.close();
  }
  { // e. The Sovereign's lock-on line mid-charge, then the beam firing
    const { page, errors } = await open();
    await setup(page, { cam: 640, modes: ['hold', 'hold'], items: [{ side: 0, type: 'sovereign', u: 460, v: 0 }, { side: 0, type: 'voidcarrier', u: 520, v: 40 }, { side: 1, type: 'titan', u: 740, v: -10 }, { side: 1, type: 'rifle', u: 760, v: 40, n: 3, dx: 14 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 9000; const S = game.ents.find(e => e.type === 'sovereign'), T = game.ents.find(e => e.type === 'titan'); S.po = { o: 'target', id: T.id }; S.cd = 0; });
    ok(await run(page, g => { const S = g.ents.find(e => e.type === 'sovereign'); return S.chT && S.chT - g.t < 1.0 && S.chT - g.t > 0.7; }), 'sovereign-lock');
    await pause(page); await shot(page, 'sovereign-lock');
    await page.evaluate(() => { TR.go = true; });
    ok(await run(page, g => g.fx.some(f => f.k === 'judge' && f.t > 0.03 && f.t < 0.1)), 'sovereign-beam');
    await pause(page); await shot(page, 'sovereign-beam'); errs.push(...errors); await page.close();
  }
  { // f. A failed shot (its shields broken mid-charge): the line sputters out, a cracked glyph
    const { page, errors } = await open();
    await setup(page, { cam: 640, modes: ['hold', 'hold'], items: [{ side: 0, type: 'sovereign', u: 460, v: 0 }, { side: 1, type: 'titan', u: 740, v: -10 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 9000; const S = game.ents.find(e => e.type === 'sovereign'); S.cd = 0; });
    ok(await run(page, g => { const S = g.ents.find(e => e.type === 'sovereign'); return S.chT && S.chT - g.t < 1.4; }), 'sovereign-charge');
    await page.evaluate(() => { const S = game.ents.find(e => e.type === 'sovereign'); damage(game, S, S.shp + 5, 'flak', 1); });
    ok(await run(page, g => g.fx.some(f => f.k === 'sovfail' && f.t > 0.12), 2), 'sovereign-fail');
    await pause(page); await shot(page, 'sovereign-fail'); errs.push(...errors); await page.close();
  }
  { // frame time: several of each of the five, at 1×
    const { page, errors } = await open();
    await setup(page, { cam: 860, items: [{ side: 0, type: 'leviathan', u: 560, v: -40, n: 4, dx: 30 }, { side: 0, type: 'broodtyrant', u: 600, v: 30, n: 4, dx: 26 }, { side: 0, type: 'worldrender', u: 640, v: 0, n: 3, dx: 34 }, { side: 0, b: 'refinery', fac: 'lastfist', u: 700, v: -60 }, { side: 1, type: 'voidcarrier', u: 1100, v: -40, n: 4, dx: 26 }, { side: 1, type: 'sovereign', u: 1080, v: 30, n: 4, dx: 34 }, { side: 1, type: 'lancer', u: 1040, v: 0, n: 4 }, { side: 1, b: 'barracks', fac: 'axiarchs', u: 1000, v: 50 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 2500; });
    await page.waitForTimeout(3000);
    const ft = await page.evaluate(() => new Promise(res => { const t = []; let last = performance.now(), n = 0; const f = now => { t.push(now - last); last = now; if (++n < 180) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); }));
    const extra = await page.evaluate(() => ({ units: game.ents.filter(e => e.kind === 'u' && e.hp > 0).length, pus: game.ents.reduce((a, e) => a + (e.pus || 0), 0), landed: game.ents.filter(e => e.lnd).length }));
    ft.sort((a, b) => a - b);
    console.log(`frame time with 4 Leviathans, 4 Brood Tyrants, 3 Worldrenders, 4 Voidcarriers, 4 Sovereigns (${extra.units} units alive, ${extra.pus} pustules, ${extra.landed} landed): median ${ft[90].toFixed(1)} ms, 95th ${ft[171].toFixed(1)} ms`);
    errs.push(...errors); await page.close();
  }
  if (miss.length) console.error('moments not reached (shot taken anyway):', miss);
  if (errs.length) { console.error('page errors:', errs); process.exitCode = 1; }
  await browser.close();
})();
