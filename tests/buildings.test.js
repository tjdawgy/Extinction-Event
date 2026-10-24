// Building art (v2.7): every tier stays on its pad and below its health bar; the cached bodies always show the
// gameplay tier (built, upgrading, under construction, ghosts, wrecks, sold, rebuilt, loaded); the cache is bounded.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

// A full base on both sides (all 8 pads), finished, in view; drawArt calls are logged per render
const SETUP = () => {
  game = newGame('normal', {}); game.countdown = 0; hideCountdown(); hideOverlay(); updateIntro(); paused = true; running = true;
  for (const s of [0, 1]) { game.sides[s].aiT = 1e9; game.sides[s].res.c = game.sides[s].res.e = 1e6; }
  const kinds = ['refinery', 'reactor', 'habitat', 'barracks', 'turret', 'factory', 'techlab', 'refinery'];
  for (const s of [0, 1]) for (let i = 0; i < 8; i++) { tryBuild(game, s, kinds[i], i); for (const b of game.ents) if (b.kind === 'b') { b.built = true; b.progress = 1; } }
  for (let i = 0; i < 3; i++) update(game, 1 / 30);
  window.LOG = [];
  if (!window.ORIG_ART) { window.ORIG_ART = drawArt; window.drawArt = (c, b, T, t, tier) => { LOG.push({ id: b.id, type: b.type, side: b.side, tier, dead: b.hp <= 0 }); return ORIG_ART(c, b, T, t, tier); }; }
  window.frameAt = (u, n = 1) => { cam.x = u; clampCam(); for (let i = 0; i < n; i++) { LOG.length = 0; render(ctx, game, 1, null, null); } return LOG.slice(); };
};

test('building art stays on its pad and below its health bar, every tier, team and gun angle; the body fits its cache box', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  const out = await page.evaluate(() => {
    const out = [], k = 3, pad = 60, real = gunAngle;
    const ink = (draw, type) => { // ink bounds in art units, relative to the building origin
      const d = BDEF[type], W = 2 * (2 * d.half + pad), H = 2 * d.half + d.h + 2 * pad;
      const cv = document.createElement('canvas'); cv.width = W * k; cv.height = H * k;
      const c = cv.getContext('2d'); c.setTransform(k, 0, 0, k, W / 2 * k, (d.half + d.h + pad) * k);
      draw(c);
      const px = c.getImageData(0, 0, cv.width, cv.height).data;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (px[(y * cv.width + x) * 4 + 3] > 24) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      return { x0: x0 / k - W / 2, x1: (x1 + 1) / k - W / 2, y0: y0 / k - (d.half + d.h + pad), y1: (y1 + 1) / k - (d.half + d.h + pad) };
    };
    for (const type of Object.keys(BART)) for (const tier of [1, 2, 3]) for (const side of [0, 1]) {
      const d = BDEF[type], top = -(d.half + d.h), wx = 2 * (d.half + 2) * IX + 1, bot = d.half + 3, box = bBox(type);
      for (let i = 0; i <= 16; i++) { // the gun at rest, then pointing every way (straight up included)
        const a = -Math.PI + i * Math.PI / 8;
        window.gunAngle = i === 16 ? real : () => a;
        for (const t of [0, 0.7, 1.9, 3.3]) {
          const r = ink(c => DRAW_B[type](c, TEAM[side], t, { side, u: 0, v: 0, aim: null, queue: ['rifle'] }, tier), type);
          if (r.y0 < top - 0.5 || r.x0 < -wx || r.x1 > wx || r.y1 > bot) out.push(`${type} T${tier} side ${side} angle ${i} t ${t}: ${JSON.stringify(r)} vs top ${top}, ±${wx.toFixed(1)}, bottom ${bot}`);
        }
      }
      window.gunAngle = real;
      const r = ink(c => BART[type][0](c, TEAM[side], tier), type);
      if (r.x0 < box[0] || r.y0 < box[1] || r.x1 > box[0] + box[2] || r.y1 > box[1] + box[3]) out.push(`${type} T${tier} body outside its cache box ${JSON.stringify(r)} ${box}`);
    }
    return out;
  });
  assert.deepStrictEqual(out, []);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('cached bodies look the same as live drawing (no flicker while the cache fills)', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(200);
  const out = await page.evaluate(() => {
    const out = [];
    for (const type of Object.keys(BART)) for (const tier of [1, 2, 3]) for (const side of [0, 1]) {
      BCACHE.budget = 1; const cvB = bodyCanvas(type, side, tier), b = cvB.b, box = cvB.box, k = b;
      const mk = () => { const cv = document.createElement('canvas'); cv.width = cvB.width; cv.height = cvB.height; const c = cv.getContext('2d'); c.setTransform(k, 0, 0, k, -box[0] * k, -box[1] * k); return [cv, c]; };
      const [ca, a] = mk(), [cb, c2] = mk(), bb = { side, type, u: 0, v: 0, aim: null, queue: [] };
      drawArt(a, bb, TEAM[side], 1.1, tier);
      DRAW_B[type](c2, TEAM[side], 1.1, bb, tier);
      const pa = a.getImageData(0, 0, ca.width, ca.height).data, pb = c2.getImageData(0, 0, cb.width, cb.height).data;
      let bad = 0, inked = 0;
      for (let i = 0; i < pa.length; i += 4) {
        if (pa[i + 3] > 24 || pb[i + 3] > 24) inked++;
        if (Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]), Math.abs(pa[i + 3] - pb[i + 3])) > 96) bad++;
      }
      if (bad / inked > 0.03) out.push(`${type} T${tier} side ${side}: ${(100 * bad / inked).toFixed(1)}% of pixels differ`);
    }
    return out;
  });
  assert.deepStrictEqual(out, []);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('the drawn tier is always the gameplay tier: built, upgrading, under construction, ghosts, wrecks, sold, rebuilt, loaded', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(200);
  const r = await page.evaluate(SETUP).then(() => page.evaluate(() => {
    const r = {}, mine = game.ents.filter(e => e.kind === 'b' && e.side === 0), at = hqPos(0).u + 260;
    mine.forEach((b, i) => { if (b.type !== 'hq') b.tier = 1 + i % 3; });
    let log = frameAt(at, 4);
    const wrong = l => l.filter(x => { const e = game.ents.find(e => e.id === x.id); return e && e.kind === 'b' && !e.upgrading && e.built && x.tier !== e.tier; });
    r.built = { drawn: log.filter(x => x.side === 0).length, wrong: wrong(log).length };
    r.cached = log.filter(x => x.side === 0).every(x => BCACHE.map.has(x.type + x.side + x.tier + 'lastfist')); // v2.17: the cache key includes the faction
    // mid-upgrade: the current tier, plus the next one rising under the scaffold
    const up = mine.find(b => b.type === 'barracks'); up.tier = 1; tryUpgrade(game, 0, up, 'A'); up.upProg = 0.5;
    log = frameAt(at); r.upgrading = log.filter(x => x.id === up.id).map(x => x.tier);
    up.upProg = 0.999; for (let i = 0; i < 400 && up.upgrading; i++) update(game, 1 / 30);
    log = frameAt(at); r.afterUpgrade = [up.tier, log.filter(x => x.id === up.id).map(x => x.tier)];
    // destroyed: the collapse shows the tier it had
    const dead = mine.find(b => b.type === 'factory'); dead.tier = 3; kill(game, dead, 1); update(game, 1 / 30);
    log = frameAt(at, 2); r.wreck = log.filter(x => x.id === dead.id).map(x => x.tier);
    // sold, then rebuilt on the same pad: the new one starts at T1 under construction
    const sold = mine.find(b => b.type === 'reactor'); sold.tier = 2; const slot = sold.slot; trySell(game, 0, sold); update(game, 1 / 30);
    log = frameAt(at, 2); r.sold = log.filter(x => x.id === sold.id).map(x => x.tier);
    tryBuild(game, 0, 'reactor', slot); const nb = game.ents.find(e => e.kind === 'b' && e.side === 0 && e.slot === slot && e.hp > 0);
    nb.progress = 0.4; log = frameAt(at); r.rebuilt = [nb.built, log.filter(x => x.id === nb.id).map(x => x.tier)];
    // a loaded save draws the saved tiers
    nb.built = true; nb.progress = 1;
    const tiers = Object.fromEntries(game.ents.filter(e => e.kind === 'b' && e.hp > 0).map(e => [e.id, e.tier]));
    game = deserialize(serialize(game, {}));
    log = frameAt(at, 4); r.loaded = { wrong: log.filter(x => !x.dead && tiers[x.id] !== undefined && x.tier !== tiers[x.id] && !game.ents.find(e => e.id === x.id).upgrading).length, drawn: log.length };
    // ghosts: an enemy Turret seen at T2 and then upgraded out of sight still shows T2
    const et = game.ents.find(e => e.kind === 'b' && e.side === 1 && e.type === 'turret'); et.tier = 2;
    const F = game.fog[0]; F.ghosts[et.id] = ghostOf(et); et.tier = 3;
    for (let i = 0; i < FOG_N; i++) F.vis[i] = 0;
    const eu = et.u; log = frameAt(eu, 2); r.ghost = log.filter(x => x.id === et.id).map(x => x.tier);
    r.cacheSize = BCACHE.map.size;
    return r;
  }));
  assert.ok(r.built.drawn >= 9 && r.built.wrong === 0, JSON.stringify(r.built));
  assert.ok(r.cached, 'every drawn body is in the cache after a few frames');
  assert.deepStrictEqual(r.upgrading, [1, 2]);
  assert.deepStrictEqual(r.afterUpgrade, [2, [2]]);
  assert.ok(r.wreck.length && r.wreck.every(t => t === 3), `wreck ${r.wreck}`);
  assert.ok(r.sold.every(t => t === 2), `sold ${r.sold}`);
  assert.deepStrictEqual(r.rebuilt, [false, [1]]);
  assert.ok(r.loaded.drawn >= 8 && r.loaded.wrong === 0, JSON.stringify(r.loaded)); // v2.17: the never-seen enemy HQ is a neutral marker, not a drawn body
  assert.ok(r.ghost.length && r.ghost.every(t => t === 2), `ghost ${r.ghost}`);
  assert.ok(r.cacheSize <= 48);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('the building cache is bounded: at most one body per type, tier and team, rebuilt only on a zoom step', { skip }, async () => {
  const { page, errors } = await openPage(browser, PHONE);
  await page.click('#bPlay'); await page.waitForTimeout(200);
  await page.evaluate(SETUP);
  const r = await page.evaluate(() => {
    const at = hqPos(0).u + 260;
    for (const t of [1, 2, 3]) { for (const e of game.ents) if (e.kind === 'b') e.tier = t; frameAt(at, 8); frameAt(hqPos(1).u - 260, 8); }
    const n = BCACHE.map.size, made = BCACHE.made;
    for (let i = 0; i < 30; i++) frameAt(at + (i % 5) * 40);
    let px = 0; for (const cv of BCACHE.map.values()) px += cv.width * cv.height;
    return { n, again: BCACHE.made - made, mb: px * 4 / 1048576, keys: [...BCACHE.map.keys()].length };
  });
  assert.ok(r.n <= 48, `${r.n} bodies`);
  assert.strictEqual(r.again, 0, 'nothing redrawn while the zoom stays the same');
  assert.ok(r.mb < 24, `${r.mb.toFixed(1)} MB`);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
