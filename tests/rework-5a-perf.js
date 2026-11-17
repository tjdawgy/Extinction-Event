// v2.89 (batch 5a): frame time in two Test Range scenes, for the aircraft pose cache (step 4).
//   node tests/rework-5a-perf.js [runs]            this build
//   EE_HTML=other/index.html node tests/rework-5a-perf.js   another build (the before)
// Scenes: swarm (batch 5b's frame-time scene: 40 Skitterlings, 8 Spitters, 10 Needlewings vs 12 Marines, 3 Tanks and 3
// more) and air (24 aircraft a side: Gunships, Interceptors, Medicopters, Drones, a Leviathan vs Razorwings, Needlewings,
// Brood Tyrants, Wraithwings, Prismwings). Everyone at 2000 HP so the scene holds. Headless Chromium, 667×375 at 2× pixels.
// Reports per scene the frame interval (requestAnimationFrame, vsync-paced, as batch 5b measured it) and the CPU time spent
// in render() per frame, each as the median and the 95th percentile over 300 frames.
const { findPlaywright, NARROW, openPage } = require('./browser-kit');
const SCENES = {
  swarm: [{ side: 0, type: 'skitterling', u: 520, v: -60, n: 40, w: 8, dx: 12, dv: 16 }, { side: 0, type: 'spitter', u: 480, v: -40, n: 8, w: 4, dx: 16, dv: 24 }, { side: 0, type: 'needlewing', u: 500, v: 40, n: 10, dx: 14 },
    { side: 1, type: 'rifle', u: 820, v: -40, n: 12, w: 4, dx: 14, dv: 24 }, { side: 1, type: 'tank', u: 860, v: 0, n: 3, dx: 30 }, { side: 1, type: 'aircraft', u: 880, v: 40, n: 2, dx: 30 }, { side: 1, type: 'interceptor', u: 900, v: -20 }],
  air: [{ side: 0, type: 'aircraft', u: 520, v: -60, n: 8, w: 4, dx: 26, dv: 30 }, { side: 0, type: 'interceptor', u: 500, v: 30, n: 8, w: 4, dx: 26, dv: 24 }, { side: 0, type: 'medic', u: 470, v: -20, n: 3, dx: 24 }, { side: 0, type: 'drone', u: 460, v: 60, n: 3, dx: 20 }, { side: 0, type: 'leviathan', u: 440, v: 0, n: 2, dx: 40 },
    { side: 1, type: 'razorwing', u: 860, v: -60, n: 8, w: 4, dx: 24, dv: 30 }, { side: 1, type: 'needlewing', u: 880, v: 30, n: 8, w: 4, dx: 20, dv: 24 }, { side: 1, type: 'broodtyrant', u: 920, v: -10, n: 2, dx: 40 }, { side: 1, type: 'wraithwing', u: 900, v: 60, n: 4, dx: 26 }, { side: 1, type: 'prismwing', u: 940, v: -40, n: 2, dx: 26 }],
};
async function measure(browser, items) {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#bRange'); await page.waitForTimeout(300); await page.evaluate(() => hideOverlay());
  await page.evaluate(items => {
    TR.set = Object.assign(trNewSet(), { rows: 1, modes: ['attack', 'attack'], fight: true }); TR.set.rw = [0, 1, 2].map(() => rwInit());
    for (const it of items) for (let i = 0; i < (it.n || 1); i++) TR.set.items.push({ id: TR.set.nid++, row: 0, side: it.side, kind: 'u', type: it.type, u: it.u + (i % (it.w || 5)) * (it.dx ?? 16), v: it.v + Math.floor(i / (it.w || 5)) * (it.dv ?? 22) + (i % 2) * 4 });
    TR.go = false; trBuild(); hideOverlay(); cam.x = 700; clampCam(); TR.go = true; trTopUI();
    for (const e of game.ents) e.hp = e.maxHp = 2000;
    const r0 = window.render; window.__rt = []; window.render = function () { const t = performance.now(); const v = r0.apply(this, arguments); window.__rt.push(performance.now() - t); return v; };
  }, items);
  await page.waitForTimeout(2500);
  const ft = await page.evaluate(() => new Promise(res => { window.__rt.length = 0; const t = []; let last = performance.now(), n = 0; const f = now => { t.push(now - last); last = now; if (++n < 300) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); }));
  const rt = await page.evaluate(() => window.__rt.slice()), alive = await page.evaluate(() => ({ units: game.ents.filter(e => e.kind === 'u' && e.hp > 0).length, air: game.ents.filter(e => e.kind === 'u' && e.hp > 0 && UDEF[e.type].air).length }));
  await page.close();
  const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  return { frame: [q(ft, 0.5), q(ft, 0.95)], render: [q(rt, 0.5), q(rt, 0.95)], n: rt.length, ...alive, errors };
}
(async () => {
  const pw = findPlaywright(); if (!pw) { console.error('playwright not installed'); process.exit(1); }
  const browser = await pw.chromium.launch(), runs = +process.argv[2] || 1;
  for (const [name, items] of Object.entries(SCENES)) for (let r = 0; r < runs; r++) {
    const m = await measure(browser, items);
    console.log(`${name}: ${m.units} units (${m.air} aircraft); frame median ${m.frame[0].toFixed(1)} ms, 95th ${m.frame[1].toFixed(1)} ms; render() median ${m.render[0].toFixed(2)} ms, 95th ${m.render[1].toFixed(2)} ms over ${m.n} frames${m.errors.length ? '; errors ' + m.errors.join(' | ') : ''}`);
  }
  await browser.close();
})();
