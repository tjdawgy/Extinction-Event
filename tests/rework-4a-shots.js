// v2.86 (docs/FACTION_REWORK.md batch 4a): Test Range screenshots at 667×375 (iPhone landscape in the viewer).
//   node tests/rework-4a-shots.js   → docs/screenshots/rework4a-<shot>-667x375.png
// Shots: sniper-pin (a Sniper's piercing shot pinning a line of infantry), mark (a Marksman's mark on a target with other
// Axiarch units switching to it), pools (Bilecaster acid pools under fighting enemies), salvo (a Gunship salvo on a Tank),
// hop (a Wraithwing mid-hop, a missed shot behind it), and a frame-time check with several of each of the five on screen.
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
  const shot = async (page, name) => { await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); }); await page.screenshot({ path: path.join(OUT, `rework4a-${name}-${dev.width}x${dev.height}.png`) }); console.log('wrote', name); };
  const open = async () => { const r = await openPage(browser, dev); await r.page.click('#bRange'); await r.page.waitForTimeout(300); await r.page.evaluate(() => hideOverlay()); return r; };
  const errs = [], miss = [];
  const ok = (b, n) => { if (!b) miss.push(n); };
  { // a. A Sniper's piercing shot pinning a line of infantry
    const { page, errors } = await open();
    await setup(page, { cam: 700, modes: ['hold', 'attack'], items: [{ side: 0, type: 'sniper', u: 560, v: 0, n: 2, w: 1, dx: 0, dv: 30 }, { side: 0, type: 'rifle', u: 600, v: -20, n: 3, w: 1, dx: 0, dv: 22 }, { side: 1, type: 'rifle', u: 800, v: 0, n: 5, w: 5, dx: 18, dv: 0 }, { side: 1, type: 'rifle', u: 820, v: 30, n: 4, w: 4, dx: 18 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 4000; });
    ok(await run(page, g => g.fx.some(f => f.k === 'pierce' && f.t < 0.08) && g.ents.filter(e => e.pinT > g.t).length >= 3), 'sniper-pin');
    await pause(page); await shot(page, 'sniper-pin'); errs.push(...errors); await page.close();
  }
  { // b. A Marksman's mark on a target, other Axiarch units switching to it
    const { page, errors } = await open();
    await setup(page, { cam: 720, modes: ['hold', 'hold'], items: [{ side: 0, type: 'marksman', u: 540, v: 0 }, { side: 0, type: 'lancer', u: 640, v: -30, n: 3, w: 1, dx: 0, dv: 30 }, { side: 0, type: 'shardling', u: 700, v: 20, n: 2, dx: 14 }, { side: 1, type: 'rifle', u: 740, v: -20, n: 4, w: 2, dx: 14, dv: 30 }, { side: 1, type: 'tank', u: 800, v: 10 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 6000; const m = game.ents.find(e => e.type === 'marksman'), t = game.ents.find(e => e.type === 'tank'); m.po = { o: 'target', id: t.id }; });
    ok(await run(page, g => { const t = g.ents.find(e => e.type === 'tank'); return t.mkT > g.t && g.t - (t.mkT - 5) > 0.35 && g.ents.filter(e => e.side === 0 && e.tgt === t.id).length >= 3 && g.projs.some(p => p.side === 0 && p.target === t); }), 'mark');
    await pause(page); await shot(page, 'mark'); errs.push(...errors); await page.close();
  }
  { // c. Bilecaster acid pools under fighting enemies
    const { page, errors } = await open();
    await setup(page, { cam: 700, modes: ['hold', 'attack'], items: [{ side: 0, type: 'bilecaster', u: 620, v: -10, n: 3, w: 1, dx: 0, dv: 26 }, { side: 0, type: 'bulwark', u: 690, v: -10, n: 2, w: 1, dx: 0, dv: 40 }, { side: 0, type: 'skitterling', u: 690, v: 30, n: 4, dx: 12 }, { side: 1, type: 'rifle', u: 760, v: -20, n: 8, w: 4, dx: 14, dv: 22 }, { side: 1, type: 'heavy', u: 800, v: 20, n: 2, dx: 16 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 3000; });
    ok(await run(page, g => g.acid.filter(a => a.kind === 'bile').length >= 4 && g.ents.some(e => e.side === 1 && e.corrT > g.t && e.tgt)), 'pools');
    await camAt(page, 760);
    await pause(page); await shot(page, 'pools'); errs.push(...errors); await page.close();
  }
  { // d. A Gunship salvo on a Tank
    const { page, errors } = await open();
    await setup(page, { cam: 680, modes: ['hold', 'hold'], items: [{ side: 0, type: 'aircraft', u: 590, v: 0 }, { side: 1, type: 'tank', u: 725, v: 10 }, { side: 1, type: 'rifle', u: 760, v: -30, n: 2, dx: 14 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 5000; const G = game.ents.find(e => e.type === 'aircraft'), T = game.ents.find(e => e.type === 'tank'); G.po = { o: 'target', id: T.id }; });
    ok(await run(page, g => g.projs.filter(p => p.gs).length >= 2 && g.ents.some(e => e.type === 'aircraft' && !e.msl && e.cd > 3)), 'salvo');
    await pause(page); await shot(page, 'salvo'); errs.push(...errors); await page.close();
  }
  { // e. A Wraithwing mid-hop, a missed shot behind it
    const { page, errors } = await open();
    await setup(page, { cam: 720, modes: ['attack', 'attack'], items: [{ side: 0, type: 'wraithwing', u: 620, v: 0 }, { side: 1, type: 'heavy', u: 780, v: -20, n: 3, w: 1, dx: 0, dv: 22 }, { side: 1, type: 'rifle', u: 800, v: 20, n: 3, dx: 14 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 5000; const W = game.ents.find(e => e.type === 'wraithwing'); W.shp = W.maxShp = 5000; });
    ok(await run(page, g => g.fx.some(f => f.k === 'hop' && f.t > 0.04 && f.t < 0.12) && g.projs.some(p => p.miss)), 'hop');
    await pause(page); await shot(page, 'hop'); errs.push(...errors); await page.close();
  }
  { // frame time: several of each of the five, at 1×
    const { page, errors } = await open();
    await setup(page, { cam: 860, items: [{ side: 0, type: 'sniper', u: 560, v: -40, n: 6, dx: 16 }, { side: 0, type: 'aircraft', u: 600, v: 30, n: 6, dx: 22 }, { side: 0, type: 'rifle', u: 640, v: 0, n: 6 }, { side: 1, type: 'marksman', u: 1100, v: -40, n: 6, dx: 16 }, { side: 1, type: 'wraithwing', u: 1060, v: 30, n: 6, dx: 22 }, { side: 1, type: 'lancer', u: 1040, v: 0, n: 4 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 1500; });
    await page.waitForTimeout(3000);
    const ft = await page.evaluate(() => new Promise(res => { const t = []; let last = performance.now(), n = 0; const f = now => { t.push(now - last); last = now; if (++n < 180) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); }));
    const extra = await page.evaluate(() => ({ units: game.ents.filter(e => e.kind === 'u' && e.hp > 0).length }));
    ft.sort((a, b) => a - b);
    console.log(`frame time with 6 Snipers, 6 Gunships, 6 Marksmen, 6 Wraithwings (${extra.units} units alive): median ${ft[90].toFixed(1)} ms, 95th ${ft[171].toFixed(1)} ms`);
    errs.push(...errors); await page.close();
  }
  { // frame time with Bilecasters and their pools
    const { page, errors } = await open();
    await setup(page, { cam: 860, items: [{ side: 0, type: 'bilecaster', u: 700, v: -30, n: 6, dx: 16 }, { side: 0, type: 'skitterling', u: 760, v: 20, n: 8 }, { side: 1, type: 'rifle', u: 900, v: 0, n: 12, w: 4, dx: 14 }, { side: 1, type: 'aircraft', u: 980, v: 0, n: 3 }] });
    await page.evaluate(() => { for (const e of game.ents) e.hp = e.maxHp = 1500; });
    await page.waitForTimeout(3000);
    const ft = await page.evaluate(() => new Promise(res => { const t = []; let last = performance.now(), n = 0; const f = now => { t.push(now - last); last = now; if (++n < 180) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); }));
    const pools = await page.evaluate(() => game.acid.length);
    ft.sort((a, b) => a - b);
    console.log(`frame time with 6 Bilecasters (${pools} pools) and 23 others: median ${ft[90].toFixed(1)} ms, 95th ${ft[171].toFixed(1)} ms`);
    errs.push(...errors); await page.close();
  }
  if (miss.length) console.error('moments not reached (shot taken anyway):', miss);
  if (errs.length) { console.error('page errors:', errs); process.exitCode = 1; }
  await browser.close();
})();
