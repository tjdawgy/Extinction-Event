// v2.91 (batch 5d: every building redrawn, the building cache keyed by art, colours and damage stage): frame time in two
// Test Range scenes, each with the building cache on and off (BCACHE.on; v2.90 has no switch, so it always runs its cache).
//   node tests/rework-5d-perf.js [runs]                       this build, cache on and off
//   EE_HTML=old/index.html node tests/rework-5d-perf.js [runs]   another build (the v2.90 baseline)
// Scenes: base (a late-game base fight: 18 buildings a side from all three factions, tiers 1-3, two under construction and
// four damaged a side, and 24 units a side fighting between them; everyone at 2000 HP so it holds) and swarm (batch 5b's
// scene, as in tests/rework-5a-perf.js). Headless Chromium, 667×375 at 2× pixels; the median and 95th percentile over 300
// frames of the frame interval (vsync-paced) and of the CPU time spent in render().
const { findPlaywright, NARROW, openPage } = require('./browser-kit');
const FAC = ['lastfist', 'bloomhost', 'axiarchs'], TYPES = ['hq', 'turret', 'barracks', 'factory', 'techlab', 'reactor'];
const bld = [];
for (const s of [0, 1]) for (let i = 0; i < 18; i++) {
  const fac = FAC[i % 3], type = TYPES[Math.floor(i / 3)], col = i % 6, row = Math.floor(i / 6);
  bld.push({ side: s, kind: 'b', fac, type, tier: 1 + (i + s) % 3, u: (s ? 900 : 260) + col * 52 + row * 18, v: -130 + row * 120, prog: i === 4 || i === 13 ? 0.5 : undefined, hp: [2, 7, 10, 16].includes(i) ? (i % 2 ? 0.5 : 0.2) : undefined });
}
const SCENES = {
  base: bld.concat([{ side: 0, type: 'rifle', u: 600, v: -60, n: 8, w: 4, dx: 14, dv: 24 }, { side: 0, type: 'skitterling', u: 620, v: 30, n: 10, w: 5, dx: 12, dv: 16 }, { side: 0, type: 'bastion', u: 580, v: 90, n: 3, dx: 26 }, { side: 0, type: 'aircraft', u: 560, v: 0, n: 3, dx: 26 },
    { side: 1, type: 'shardling', u: 780, v: -60, n: 8, w: 4, dx: 16, dv: 24 }, { side: 1, type: 'tank', u: 800, v: 30, n: 4, dx: 30 }, { side: 1, type: 'spitter', u: 790, v: 90, n: 8, w: 4, dx: 16, dv: 22 }, { side: 1, type: 'wraithwing', u: 820, v: 0, n: 4, dx: 26 }]),
  swarm: [{ side: 0, type: 'skitterling', u: 520, v: -60, n: 40, w: 8, dx: 12, dv: 16 }, { side: 0, type: 'spitter', u: 480, v: -40, n: 8, w: 4, dx: 16, dv: 24 }, { side: 0, type: 'needlewing', u: 500, v: 40, n: 10, dx: 14 },
    { side: 1, type: 'rifle', u: 820, v: -40, n: 12, w: 4, dx: 14, dv: 24 }, { side: 1, type: 'tank', u: 860, v: 0, n: 3, dx: 30 }, { side: 1, type: 'aircraft', u: 880, v: 40, n: 2, dx: 30 }, { side: 1, type: 'interceptor', u: 900, v: -20 }],
};
async function measure(browser, items, cacheOn, camX, zoom) {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#bRange'); await page.waitForTimeout(300); await page.evaluate(() => hideOverlay());
  const info = await page.evaluate(([items, cacheOn, camX, zoom]) => {
    TR.set = Object.assign(trNewSet(), { rows: 1, modes: ['attack', 'attack'], fight: true }); TR.set.rw = [0, 1, 2].map(() => rwInit());
    for (const it of items) if (it.kind !== 'b') for (let i = 0; i < (it.n || 1); i++) TR.set.items.push({ id: TR.set.nid++, row: 0, side: it.side, kind: 'u', type: it.type, u: it.u + (i % (it.w || 5)) * (it.dx ?? 16), v: it.v + Math.floor(i / (it.w || 5)) * (it.dv ?? 22) + (i % 2) * 4 });
    TR.go = false; trBuild(); hideOverlay();
    for (const e of game.ents) e.hp = e.maxHp = 2000;
    for (const o of items) if (o.kind === 'b') { const b = rangeBuilding(game, o.side, o.fac, o.type, o.u, o.v); b.tier = o.tier; if (o.prog !== undefined) { b.built = false; b.progress = o.prog; } if (o.hp !== undefined) b.hp = b.maxHp * o.hp; }
    if (typeof BCACHE !== 'undefined' && 'on' in BCACHE) BCACHE.on = cacheOn;
    if (zoom) { window.trZoom = () => {}; applyZoom(zoom); }
    cam.x = camX; clampCam(); TR.go = true; trTopUI();
    const r0 = window.render; window.__rt = []; window.render = function () { const t = performance.now(); const v = r0.apply(this, arguments); window.__rt.push(performance.now() - t); return v; };
    return { switch: typeof BCACHE !== 'undefined' && 'on' in BCACHE, ver: VERSION };
  }, [items, cacheOn, camX, zoom]);
  await page.waitForTimeout(2500);
  const ft = await page.evaluate(() => new Promise(res => { window.__rt.length = 0; const t = []; let last = performance.now(), n = 0; const f = now => { t.push(now - last); last = now; if (++n < 300) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); }));
  const rt = await page.evaluate(() => window.__rt.slice()), alive = await page.evaluate(() => ({ units: game.ents.filter(e => e.kind === 'u' && e.hp > 0).length, blds: game.ents.filter(e => e.kind === 'b' && e.hp > 0).length }));
  await page.close();
  const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  return { frame: [q(ft, 0.5), q(ft, 0.95)], render: [q(rt, 0.5), q(rt, 0.95)], n: rt.length, ...alive, ...info, errors };
}
(async () => {
  const pw = findPlaywright(); if (!pw) { console.error('playwright not installed'); process.exit(1); }
  const browser = await pw.chromium.launch(), runs = +process.argv[2] || 1;
  for (const [name, items] of Object.entries(SCENES)) for (const on of [true, false]) for (let r = 0; r < runs; r++) {
    const m = await measure(browser, items, on, name === 'base' ? 700 : 700, name === 'base' ? 0.62 : 0);
    if (!on && !m.switch) break; // an older build has no cache switch: measured once, with its cache
    console.log(`v${m.ver} ${name} cache ${m.switch ? (on ? 'on' : 'off') : 'on (no switch)'}: ${m.blds} buildings, ${m.units} units; frame median ${m.frame[0].toFixed(1)} ms, 95th ${m.frame[1].toFixed(1)} ms; render() median ${m.render[0].toFixed(2)} ms, 95th ${m.render[1].toFixed(2)} ms over ${m.n} frames${m.errors.length ? '; errors ' + m.errors.join(' | ') : ''}`);
  }
  await browser.close();
})();
