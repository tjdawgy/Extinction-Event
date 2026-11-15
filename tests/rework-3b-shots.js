// v2.85 (docs/FACTION_REWORK.md batch 3b): Test Range screenshots at 667×375 (iPhone landscape in the viewer).
//   node tests/rework-3b-shots.js   → docs/screenshots/rework3b-<shot>-667x375.png
// Shots: rift-fight (a Riftstalker fighting in the enemy backline: Part 0, no fade back), rift-home (blinking home when its
// shields break), charge (a Dreadthorn mid-charge through an Infantry blob), dazed (dazed after it), barrier (a Bastion's
// barrier taking enemy fire for the units behind it, an Artillery shell arcing over it), parry (a Shardling's parry and
// counter-slash), brace (a Bulwark bracing on its creep, glow sacs pulsing), barrier-break (the wall collapsing), and a
// frame-time check with six of each of the four on screen.
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
  const shot = async (page, name) => { await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); }); await page.screenshot({ path: path.join(OUT, `rework3b-${name}-${dev.width}x${dev.height}.png`) }); console.log('wrote', name); };
  const open = async () => { const r = await openPage(browser, dev); await r.page.click('#bRange'); await r.page.waitForTimeout(300); await r.page.evaluate(() => hideOverlay()); return r; };
  const errs = [], miss = [];
  const ok = (b, n) => { if (!b) miss.push(n); };
  { // a. A Riftstalker fighting in the enemy backline (it stays: Part 0), then blinking home when its shields break
    const { page, errors } = await open();
    await setup(page, { cam: 840, modes: ['attack', 'attack'], items: [{ side: 0, type: 'riftstalker', u: 650, v: 0 }, { side: 0, type: 'lancer', u: 600, v: -20, n: 2, dx: 20 }, { side: 1, type: 'sniper', u: 790, v: 0 }, { side: 1, type: 'artillery', u: 830, v: 40 }, { side: 1, type: 'heavy', u: 760, v: -40, n: 3, dx: 16 }, { side: 1, type: 'rifle', u: 740, v: 30, n: 4, dx: 14 }] });
    await page.evaluate(() => { const s = game.ents.find(e => e.type === 'sniper'); s.hp = s.maxHp = 4000; const R = game.ents.find(e => e.type === 'riftstalker'); R.hp = R.maxHp = 3000; R.shp = R.maxShp = 260; });
    ok(await run(page, g => g.ents.some(e => e.type === 'riftstalker' && e.rsH && !e.leaping && e.tgt && e.recoil > 0.5 && e.shp > 60)), 'rift-fight');
    await page.evaluate(() => { const R = game.ents.find(e => e.type === 'riftstalker'); cam.x = R.u - 10; clampCam(); });
    await pause(page); await shot(page, 'rift-fight');
    await page.evaluate(() => { TR.go = true; });
    ok(await run(page, g => g.fx.some(f => f.k === 'rsblink' && f.home && f.t > 0.08 && f.t < 0.25)), 'rift-home');
    await page.evaluate(() => { const f = game.fx.find(f => f.k === 'rsblink' && f.home); if (f) { cam.x = (f.x + f.x2) / 2 + 20; clampCam(); } });
    await pause(page); await shot(page, 'rift-home'); errs.push(...errors); await page.close();
  }
  { // b. A Dreadthorn mid-charge through an Infantry blob, then dazed
    const { page, errors } = await open();
    await setup(page, { cam: 780, modes: ['attack', 'hold'], items: [{ side: 0, type: 'dreadthorn', u: 600, v: 0 }, { side: 1, type: 'rifle', u: 740, v: -26, n: 12, w: 4, dx: 12, dv: 16 }, { side: 1, type: 'heavy', u: 800, v: -10, n: 2, dx: 14 }] });
    ok(await run(page, g => g.ents.some(e => e.type === 'dreadthorn' && e.crg && e.crHit.length >= 3)), 'charge');
    await pause(page); await shot(page, 'charge');
    await page.evaluate(() => { TR.go = true; });
    ok(await run(page, g => g.ents.some(e => e.type === 'dreadthorn' && e.dzT - g.t > 1 && e.dzT - g.t < 1.4)), 'dazed');
    await pause(page); await shot(page, 'dazed'); errs.push(...errors); await page.close();
  }
  { // c. A Bastion's barrier taking enemy fire for the units behind it, an Artillery shell arcing over it
    const { page, errors } = await open();
    await setup(page, { cam: 780, modes: ['hold', 'attack'], items: [{ side: 0, type: 'bastion', u: 640, v: 0 }, { side: 0, type: 'lancer', u: 600, v: -24, n: 3, w: 1, dx: 0, dv: 24 }, { side: 0, type: 'marksman', u: 570, v: 0 }, { side: 1, type: 'rifle', u: 800, v: -30, n: 6, w: 3, dx: 14, dv: 30 }, { side: 1, type: 'heavy', u: 830, v: 10 }, { side: 1, type: 'artillery', u: 960, v: 0 }] });
    await page.evaluate(() => { for (const e of game.ents) if (e.side === 0) { e.hp = e.maxHp = 5000; } });
    ok(await run(page, g => g.projs.some(p => p.weapon === 'shell' && p.t / p.T > 0.45 && p.t / p.T < 0.6) && g.fx.some(f => f.k === 'bwhit' && f.t < 0.1) && g.projs.some(p => p.weapon !== 'shell' && p.side === 1)), 'barrier');
    await pause(page); await shot(page, 'barrier');
    // the wall breaking under heavy fire
    await page.evaluate(() => { const B = game.ents.find(e => e.type === 'bastion'); B.bwHp = 40; TR.go = true; });
    ok(await run(page, g => g.fx.some(f => f.k === 'bwbreak' && f.t > 0.12 && f.t < 0.3)), 'barrier-break');
    await pause(page); await shot(page, 'barrier-break'); errs.push(...errors); await page.close();
  }
  { // d. A Shardling's parry with a counter-slash
    const { page, errors } = await open();
    await setup(page, { cam: 760, modes: ['attack', 'attack'], items: [{ side: 0, type: 'shardling', u: 690, v: -10, n: 3, w: 1, dx: 0, dv: 26 }, { side: 1, type: 'skitterling', u: 760, v: -10, n: 6, w: 2, dx: 12, dv: 20 }, { side: 1, type: 'bulwark', u: 780, v: 30 }] });
    await page.evaluate(() => { for (const e of game.ents) if (e.side === 0) { e.hp = e.maxHp = 5000; } });
    ok(await run(page, g => g.fx.some(f => f.k === 'parry' && f.ctr && f.t > 0.08 && f.t < 0.16)), 'parry');
    await pause(page); await shot(page, 'parry'); errs.push(...errors); await page.close();
  }
  { // e. A Bulwark bracing on its own creep (regenerating: its glow sacs pulse)
    const { page, errors } = await open();
    await setup(page, { cam: 660, modes: ['hold', 'attack'], items: [{ side: 0, b: 'refinery', fac: 'bloomhost', u: 560, v: -10 }, { side: 0, type: 'bulwark', u: 615, v: 10 }, { side: 0, type: 'bulwark', u: 600, v: 50 }, { side: 1, type: 'rifle', u: 780, v: -20, n: 5, w: 3, dx: 14, dv: 24 }, { side: 1, type: 'heavy', u: 800, v: 30 }] });
    await page.evaluate(() => { for (const e of game.ents) if (e.side === 0 && e.kind === 'u') { e.hp = e.maxHp * 0.6; } });
    ok(await run(page, g => g.ents.some(e => e.type === 'bulwark' && e.braceT > g.t && g.t - (e.bkRg ?? -9) < 0.1 && onCreep(g, 0, e.u, e.v))), 'brace');
    await pause(page); await shot(page, 'brace'); errs.push(...errors); await page.close();
  }
  { // frame time: six of each of the four, at 1×
    const { page, errors } = await open();
    await setup(page, { cam: 860, items: [{ side: 0, type: 'dreadthorn', u: 600, v: -40, n: 6, dx: 22 }, { side: 0, type: 'bulwark', u: 640, v: 40, n: 6, dx: 22 }, { side: 1, type: 'bastion', u: 1080, v: -40, n: 6, dx: 20 }, { side: 1, type: 'shardling', u: 1040, v: 30, n: 6, dx: 16 }, { side: 1, type: 'lancer', u: 1120, v: 0, n: 4 }, { side: 0, type: 'skitterling', u: 620, v: 0, n: 8 }] });
    await page.waitForTimeout(3000);
    const ft = await page.evaluate(() => new Promise(res => { const t = []; let last = performance.now(), n = 0; const f = now => { t.push(now - last); last = now; if (++n < 180) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); }));
    const extra = await page.evaluate(() => ({ units: game.ents.filter(e => e.kind === 'u' && e.hp > 0).length, walls: game.ents.filter(e => e.type === 'bastion' && e.bwHp !== undefined && !e.bwDn).length }));
    ft.sort((a, b) => a - b);
    console.log(`frame time with 6 Dreadthorns, 6 Bulwarks, 6 Bastions (${extra.walls} barriers up), 6 Shardlings and ${extra.units - 24} others (headless, 2× pixels): median ${ft[90].toFixed(1)} ms, 95th ${ft[171].toFixed(1)} ms`);
    errs.push(...errors); await page.close();
  }
  if (miss.length) console.error('moments not reached (shot taken anyway):', miss);
  if (errs.length) { console.error('page errors:', errs); process.exitCode = 1; }
  await browser.close();
})();
