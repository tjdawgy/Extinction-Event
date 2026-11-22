// v2.94 (batch 6d, Part C1): the enemy HQ's shield count shows only what the player knows. In headless Chromium, a real match
// against the Hard AI on Two-Lane (its fog is two-dimensional, so the HQ can be in view while its other buildings are not; on Classic
// a view of the enemy HQ also shows its front pads): the player's own count is exact; the enemy's counts the holders the player has seen finished (the fog's
// remembered buildings), '?' when the shield is up and none is known, and keeps what it has seen after the view moves away.
// Screenshots (667×375) go to tests/screenshots/ (docs/screenshots/ with EE_DOC_SHOTS=1): rework6d-shield-unknown.png (the
// enemy HQ in view, its holders not yet seen: '?'), rework6d-shield-partial.png (some of its holders seen: a partial count).
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');
const SHOTS = process.env.EE_DOC_SHOTS ? path.join(__dirname, '..', 'docs', 'screenshots') : path.join(__dirname, 'screenshots'); require('fs').mkdirSync(SHOTS, { recursive: true });

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

const HELPERS = () => {
  window.__run = s => { for (let i = 0; i < Math.round(s * 60); i++) update(game, TICK); refreshUI(true); };
  // a probe unit of the player's at (u, v): what it would show, with the player's fog put back afterwards (no memory left)
  window.__probe = (u, v, keep) => {
    const me = myS(), foe = 1 - me, f0 = structuredClone(game.fog[me]), seen0 = new Set(HQ_SEEN.ids);
    const e = spawnUnit(game, me, 'rifle', u, v); e.po = { o: 'hold' }; updateVision(game);
    const hq = game.sides[foe].hq, real = hqHolders(game, foe);
    const vis = game.ents.filter(b => b.kind === 'b' && b.side === foe && hqHolds(b) && visibleTo(game, me, b)).length;
    const r = { hqVis: visibleTo(game, me, hq), shielded: hq.shielded, vis, real, shown: hqHoldersShown(game, foe) };
    if (!keep) { game.ents.splice(game.ents.indexOf(e), 1); game.fog[me] = f0; HQ_SEEN.ids = seen0; }
    else r.id = e.id;
    return r;
  };
};
async function start(page) {
  await page.click('#bPlay'); await page.click('.mapc[data-m="twolane"]'); await page.click('#bMapGo'); await page.waitForTimeout(250);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); camTouched = true; closePanel(); for (const t of document.querySelectorAll('#toasts > *')) t.remove(); });
}
const shot = async (page, name) => { // the enemy HQ in view
  await page.evaluate(() => { for (const t of document.querySelectorAll('#toasts > *')) t.remove(); closePanel(); const hq = game.sides[1 - myS()].hq; cam.x = hq.u - 120; cam.vx = 0; if (CAMY.max > CAMY.min) cam.y = (hq.v + 40) * DY - (Y_TOP + Y_BOT) / 2; clampCam(); refreshUI(true); paused = true; drawNow(); });
  await page.waitForTimeout(120); await page.screenshot({ path: path.join(SHOTS, `rework6d-${name}.png`) });
};

test('C1: the enemy HQ shield count uses only buildings the player has seen; "?" when none is known; the player\'s own count is exact', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW, { init: `try { localStorage.setItem('extinctionEvent.start', 'left'); localStorage.setItem('extinctionEvent.fac', 'lastfist'); } catch (e) {}` });
  await page.evaluate(HELPERS); await start(page);
  // the player builds a little (its own count), the Hard AI builds its base for 2:30 of game time
  const own = await page.evaluate(() => { const me = myS(), s = game.sides[me]; s.res.c = s.res.e = 5000;
    for (const t of ['refinery', 'barracks']) { tryBuild(game, me, t); const b = game.ents.filter(e => e.type === t && e.side === me).pop(); b.built = true; b.progress = 1; b.hp = b.maxHp; }
    __run(150); return { shown: hqHoldersShown(game, me), real: hqHolders(game, me) }; });
  assert.strictEqual(own.shown, own.real, 'your own count is exact'); assert.ok(own.real >= 2);
  const foe = await page.evaluate(() => ({ real: hqHolders(game, 1 - myS()), shown: hqHoldersShown(game, 1 - myS()), shielded: game.sides[1 - myS()].hq.shielded, u: game.sides[1 - myS()].hq.u }));
  assert.ok(foe.shielded && foe.real >= 2, `the enemy has built (${foe.real} holders) and its shield is up`);
  assert.strictEqual(foe.shown, '?', 'nothing of the enemy base seen yet: "?" (v2.93 showed the exact number)');
  // probe the ground in front of and around the enemy HQ for (a) the HQ in view with none of its holders, (b) some but not all
  const spots = await page.evaluate(() => { const hq = game.sides[1 - myS()].hq, out = { unk: null, part: null };
    for (let du = -450; du <= 250 && !(out.unk && out.part); du += 25) for (let dv = -300; dv <= 300; dv += 25) {
      const v = hq.v + dv, r = __probe(hq.u + du, v); if (!r.hqVis || !r.shielded) continue;
      if (!out.unk && r.vis === 0) out.unk = { u: hq.u + du, v, r };
      if (!out.part && r.vis > 0 && r.vis < r.real) out.part = { u: hq.u + du, v, r };
    }
    return out; });
  assert.ok(spots.unk, 'a spot from which the enemy HQ is visible and none of its holders is');
  assert.ok(spots.part, 'a spot from which some of its holders are visible');
  // (a) '?' with the HQ in view
  const a = await page.evaluate(s => __probe(s.u, s.v, true), spots.unk);
  assert.ok(a.hqVis && a.vis === 0 && a.shown === '?', `HQ in view, no holder seen: "?" (${JSON.stringify(a)})`);
  await shot(page, 'shield-unknown');
  await page.evaluate(id => { const e = game.ents.find(x => x.id === id); game.ents.splice(game.ents.indexOf(e), 1); paused = false; }, a.id);
  // (b) a partial count: exactly the holders seen, fewer than really stand
  const b = await page.evaluate(s => __probe(s.u, s.v, true), spots.part);
  assert.strictEqual(b.shown, b.vis, `the count is the holders seen (${b.vis}), not all of them (${b.real})`); assert.ok(b.shown < b.real);
  await shot(page, 'shield-partial');
  // the view moves away: what was seen is remembered (the fog's ghosts), nothing new is learned
  const c = await page.evaluate(id => { const e = game.ents.find(x => x.id === id); game.ents.splice(game.ents.indexOf(e), 1); paused = false; updateVision(game); return { shown: hqHoldersShown(game, 1 - myS()), real: hqHolders(game, 1 - myS()) }; }, b.id);
  assert.strictEqual(c.shown, b.shown, 'out of sight, the count keeps what was seen');
  // the info card of the enemy HQ says the same number
  const card = await page.evaluate(() => { const hq = game.sides[1 - myS()].hq; return typeof hqHoldersShown === 'function' && hqHoldersShown(game, hq.side); });
  assert.strictEqual(card, b.shown);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
