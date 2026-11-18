// v2.91 (faction rework batch 5d: every building redrawn): art only. The building cache gives the same picture as live drawing
// for a paused base of each faction (built, damaged at both stages, under construction, upgrading); the cache key follows the
// art, the colours and the damage stage; damage stages come from health only; every gun turns about the SIM's muzzle point
// (except the Bloomhost Maw, whose jaws turn 8 below it so they stay under its low health bar: docs/FACTION_REWORK.md "Batch 5d").
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

// A full base for side 0 of the given faction, every pad built, some damaged, one under construction, one upgrading
const BASE = fac => {
  game = newGame('normal', { factions: [fac, fac], seed: 7 }); game.countdown = 0; hideCountdown(); hideOverlay(); updateIntro(); paused = true; running = true;
  for (const s of [0, 1]) { game.sides[s].aiT = 1e9; game.sides[s].res.c = game.sides[s].res.e = 1e6; }
  const kinds = ['refinery', 'reactor', 'habitat', 'barracks', 'turret', 'factory', 'techlab', 'refinery'];
  for (let i = 0; i < 8; i++) { tryBuild(game, 0, kinds[i], i); for (const b of game.ents) if (b.kind === 'b') { b.built = true; b.progress = 1; } } // each finished at once (a War Factory needs a Barracks)
  const mine = game.ents.filter(e => e.kind === 'b' && e.side === 0);
  mine.forEach((b, i) => { b.built = true; b.progress = 1; b.hp = b.maxHp; if (b.type !== 'hq') b.tier = 1 + i % 3; });
  mine[1].hp = mine[1].maxHp * 0.5; mine[2].hp = mine[2].maxHp * 0.2; mine[3].hp = mine[3].maxHp * 0.1; // damage stages 1, 2, 2
  mine[4].built = false; mine[4].progress = 0.45; // under construction
  const up = mine.find(b => b.type === 'factory'); up.tier = 1; tryUpgrade(game, 0, up, 'A'); up.upProg = 0.5; // upgrading
  for (let i = 0; i < 2; i++) update(game, 1 / 30);
  game.ents = game.ents.filter(e => e.kind === 'b'); VFX.parts && (VFX.parts.length = 0); // no units or particles: a still picture
  return mine.map(b => dmgStage(b));
};

test('a paused base of each faction looks the same with the building cache on and off', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click('#bPlay'); await page.click('#bMapGo'); await page.waitForTimeout(200);
  const out = [];
  for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) {
    const r = await page.evaluate(([fac, BASE]) => {
      const st = (new Function('fac', 'return (' + BASE + ')(fac)'))(fac);
      const shot = () => { for (const e of game.ents) e.anim = 0.5; render(ctx, game, 1, null, null); const cv = ctx.canvas; return ctx.getImageData(0, 0, cv.width, cv.height).data; };
      cam.x = hqPos(0).u + 200; clampCam();
      BCACHE.on = true; for (let i = 0; i < 20; i++) shot(); const made = BCACHE.made, a = shot();
      BCACHE.on = false; const b = shot(); BCACHE.on = true;
      let bad = 0, soft = 0, n = 0;
      for (let i = 0; i < a.length; i += 4) { n++; const m = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])); if (m > 64) bad++; if (m > 8) soft++; }
      const keys = [...BCACHE.map.keys()].filter(k => k.includes(fac));
      return { st, bad: bad / n, soft: soft / n, made, drawn: game.ents.filter(e => e.kind === 'b' && e.side === 0).length, dmgKeys: [0, 1, 2].map(d => keys.some(k => k.includes(fac + '.' + d))) };
    }, [fac, BASE.toString()]);
    out.push({ fac, ...r });
  }
  console.log('cache on/off:', out.map(r => `${r.fac} ${(100 * r.bad).toFixed(3)}% of pixels differ by more than 64 (${(100 * r.soft).toFixed(2)}% by more than 8), ${r.made} bodies cached, ${r.drawn} buildings, stages ${r.st}`).join('; '));
  for (const r of out) {
    assert.ok(r.st.includes(1) && r.st.includes(2), `${r.fac}: damage stages present ${r.st}`);
    assert.ok(r.bad < 0.01, `${r.fac}: ${(100 * r.bad).toFixed(2)}% of pixels differ between cached and live drawing`);
    assert.deepStrictEqual(r.dmgKeys, [true, true, true], `${r.fac}: a cached body per damage stage`);
  }
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('the cache key follows the art, the colours and the damage stage; every gun turns about the SIM muzzle point', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  const r = await page.evaluate(() => {
    const r = {};
    r.keys = new Set([bKey('turret', 0, 1, 'lastfist', 0), bKey('turret', 0, 1, 'lastfist', 1), bKey('turret', 1, 1, 'lastfist', 0), bKey('turret', 0, 1, 'bloomhost', 0), bKey('turret', 0, 2, 'lastfist', 0)]).size;
    const k0 = bKey('hq', 0, 1, 'axiarchs', 0), m0 = TEAM[0].main; TEAM[0].main = '#123456'; r.colour = bKey('hq', 0, 1, 'axiarchs', 0) !== k0; TEAM[0].main = m0;
    const f0 = BART.turret[0]; BART.turret[0] = function other() {}; const ka = bKey('turret', 0, 1, 'lastfist', 0); BART.turret[0] = f0; r.art = ka !== bKey('turret', 0, 1, 'lastfist', 0);
    r.stage = [1, 0.7, 0.66, 0.5, 0.34, 0.33, 0.1, 0].map(f => dmgStage({ built: true, hp: 100 * f, maxHp: 100 }));
    r.unbuilt = dmgStage({ built: false, hp: 1, maxHp: 100 }); r.ghost = dmgStage({ built: true });
    // the pivot each live part rotates about, read from the translate before its rotate, against muzzle()
    r.muz = [];
    for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) for (const type of ['hq', 'turret', 'bunker']) {
      const A = BARTS[fac][type]; if (!A) continue;
      for (const tier of [1, 2, 3]) {
        const piv = []; const c = document.createElement('canvas').getContext('2d'), tr = c.translate.bind(c), ro = c.rotate.bind(c); let last = null;
        c.translate = (x, y) => { last = [x, y]; tr(x, y); }; c.rotate = a => { if (last) piv.push(last); ro(a); };
        A[1](c, TEAM[0], 1, { side: 0, type, u: 0, v: 0, aim: null, queue: [] }, tier);
        const m = muzzle({ kind: 'b', type, u: 0, v: 0 }), s = P(m.u, m.v, m.z), o = P(0, 0, 0), want = [(s.x - o.x) / BS, (s.y - o.y) / BS];
        r.muz.push({ fac, type, tier, ok: piv.some(p => Math.hypot(p[0] - want[0], p[1] - want[1]) < 0.6), piv, want });
      }
    }
    return r;
  });
  assert.strictEqual(r.keys, 5);
  assert.ok(r.colour, 'new colours, new key'); assert.ok(r.art, 'new art, new key');
  assert.deepStrictEqual(r.stage, [0, 0, 1, 1, 1, 2, 2, 2]);
  assert.strictEqual(r.unbuilt, 0); assert.strictEqual(r.ghost, 0);
  const bad = r.muz.filter(m => !m.ok && !(m.fac === 'bloomhost' && m.type === 'turret'));
  assert.deepStrictEqual(bad, [], JSON.stringify(bad));
  assert.ok(r.muz.length >= 21);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
