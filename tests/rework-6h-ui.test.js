// v2.98 (batch 6h) in a real browser at 667×375: each new mechanic seen in a running match, with a screenshot of each.
// Screenshots: tests/screenshots/rework6h-*.png (docs/screenshots with EE_DOC_SHOTS=1): queen (a Queen and the Mites she births
// against Marines), pounce-warden (Ravagers pouncing, units in a Chitin Warden's aura shimmering), leap-stun (Leapers landing on
// Artillery behind Marines, the stunned), brood (a Broodback's burst and its Bile Bloom), ruinmaw (its eruption beside Marines
// and the tunnel's trails), bodies (28 Tanks against 19 Bastions with unit bodies), codex (the Larva Pit's tree: the Spitter from
// the start, the Queen on Acidic Evolution), and the Rally button with a surfaced Ruinmaw selected.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { findPlaywright, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright(), skip = !pw && 'Playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });
const OUT = process.env.EE_DOC_SHOTS ? path.join(__dirname, '..', 'docs', 'screenshots') : path.join(__dirname, 'screenshots');

async function match(me, foe, map = 'classic') {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click(`#meSeg [data-f="${me}"]`); await page.click(`#foeSeg [data-f="${foe}"]`); await page.click('#bPlay');
  await page.click(`.mapc[data-m="${map}"]`); await page.click('#bMapGo'); await page.waitForTimeout(300);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } paused = true; setStance(game, 1, 'hold'); });
  return { page, errors };
}
const shot = async (page, name, at) => {
  await page.evaluate(([u, v]) => { $('toasts').innerHTML = ''; for (const f of game.fog) { f.vis.fill(1); f.exp.fill(1); } camJump(u, v); render(ctx, game, game.t, sel, selPad); }, at);
  fs.mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: path.join(OUT, `rework6h-${name}.png`) });
};
// A fight set up away from both bases: f(g, mk) places the units; it runs until stop(g) or T seconds
const scene = (page, src) => page.evaluate(src);

test('b6h: a Queen births Mites against Marines', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  const r = await scene(page, () => {
    const g = game, u0 = 900, mk = (s, t, u, v) => { const e = spawnUnit(g, s, t, u, v); if (s === 0) ctlHold(e, u, v); else { e.holdU = u; e.holdV = v; } return e; };
    const q = mk(0, 'queen', u0, 0); for (let i = 0; i < 6; i++) mk(1, 'rifle', u0 + 175 + (i % 2) * 14, (i - 2.5) * 22);
    for (let i = 0; i < 60 * 7; i++) update(g, TICK);
    return { q: q.qn || 0, mites: g.ents.filter(e => e.qm === q.id && e.hp > 0).length, u: q.u };
  });
  assert.ok(r.q >= 2, JSON.stringify(r));
  await shot(page, 'queen', [r.u + 90, 0]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6h: Ravagers pounce; units in a Chitin Warden\'s aura shimmer', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  const r = await scene(page, () => {
    const g = game, u0 = 900, us = [];
    for (let i = 0; i < 3; i++) us.push(spawnUnit(g, 0, 'ravager', u0 + (i % 3) * 20, (i - 1) * 30));
    us.push(spawnUnit(g, 0, 'bulwark', u0 - 30, 0)); for (let i = 0; i < 6; i++) us.push(spawnUnit(g, 0, 'skitterling', u0 - 20 + (i % 3) * 14, (i - 2.5) * 16));
    for (let i = 0; i < 6; i++) { const e = spawnUnit(g, 1, 'rifle', u0 + 150 + (i % 2) * 14, (i - 2.5) * 22); e.holdU = e.u; e.holdV = e.v; }
    update(g, TICK); command(g, 0, us.map(e => e.id), 'attack');
    let n = 0; for (let i = 0; i < 60 * 8; i++) { update(g, TICK); if (us.some(e => e.pcT > g.t + 0.2) && us.some(e => e.wd6 === g.t)) { n = 1; break; } }
    return { n, u: us[0].u };
  });
  assert.ok(r.n, 'a Pounce under way with the aura on');
  await shot(page, 'pounce-warden', [r.u + 40, 0]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6h: Leapers land on Artillery behind Marines and stun', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  const r = await scene(page, () => {
    const g = game, u0 = 800, ls = [];
    for (let i = 0; i < 3; i++) ls.push(spawnUnit(g, 0, 'leaper', u0 + i * 10, (i - 1) * 30));
    for (let i = 0; i < 6; i++) { const e = spawnUnit(g, 1, 'rifle', u0 + 120 + (i % 2) * 14, (i - 2.5) * 22); e.holdU = e.u; e.holdV = e.v; }
    const a = spawnUnit(g, 1, 'artillery', u0 + 168, 0); // within a Leaper's sight (it leaps at what its side can see) a.holdU = a.u; a.holdV = a.v;
    update(g, TICK); command(g, 0, ls.map(e => e.id), 'attack');
    let stun = 0; for (let i = 0; i < 60 * 8; i++) { update(g, TICK); if (g.ents.some(e => e.st6 > g.t + 0.3)) { stun = 1; break; } }
    return { stun, host: ls.map(e => e.lt || e.ltH).filter(Boolean).map(id => ctlEnt(g, id).type), u: a.u };
  });
  assert.ok(r.stun, 'a stun'); assert.ok(r.host.includes('artillery'), JSON.stringify(r));
  await shot(page, 'leap-stun', [r.u - 60, 0]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6h: a Broodback bursts into Skitterlings and leaves a Bile Bloom', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  const r = await scene(page, () => {
    const g = game, u0 = 900, us = [];
    us.push(spawnUnit(g, 0, 'broodback', u0, 0)); for (let i = 0; i < 4; i++) us.push(spawnUnit(g, 0, 'skitterling', u0 - 20, (i - 1.5) * 18));
    for (let i = 0; i < 8; i++) { const e = spawnUnit(g, 1, 'rifle', u0 + 130 + (i % 2) * 14, (i - 3.5) * 18); e.holdU = e.u; e.holdV = e.v; }
    update(g, TICK); command(g, 0, us.map(e => e.id), 'attack');
    for (let i = 0; i < 60 * 3; i++) update(g, TICK);
    const b = us[0]; if (b.hp > 0) damage(g, b, 1e6, 'rifle', 1);
    for (let i = 0; i < 40; i++) update(g, TICK);
    return { pools: (g.bp6 || []).length, u: b.u };
  });
  assert.strictEqual(r.pools, 1);
  await shot(page, 'brood', [r.u + 40, 0]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6h: a Ruinmaw erupts beside Marines; units on the creep tunnel to it; Rally', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  const r = await scene(page, () => {
    const g = game, s = 0, hq = hqU(0), R = spawnUnit(g, 0, 'ruinmaw', hq + 700, 0); ctlHold(R, R.u, R.v);
    for (let i = 0; i < 6; i++) { const e = spawnUnit(g, 1, 'rifle', hq + 800 + (i % 2) * 14, (i - 2.5) * 20); e.holdU = e.u; e.holdV = e.v; }
    const ks = []; for (let i = 0; i < 10; i++) { const e = spawnUnit(g, 0, 'skitterling', hq + 50 + (i % 5) * 12, g.sides[0].hq.v + (i < 5 ? -1 : 1) * 24); ctlHold(e, e.u, e.v); ks.push(e); }
    for (let i = 0; i < 60 * 20; i++) update(g, TICK); // the Hive's creep is there from the start
    command(g, 0, [R.id], 'go', hq + 770, 0);
    for (let i = 0; i < 60 * 8 && !(R.dvCd > g.t); i++) update(g, TICK);
    const up = R.dvCd > g.t; for (let i = 0; i < 20; i++) update(g, TICK);
    const t = command(g, 0, ks.map(e => e.id), 'tunnel');
    for (let i = 0; i < 50; i++) update(g, TICK);
    SELN.clear(); SELN.add(R.id); refreshCtl(); refreshUI(true);
    return { up, t: t.msg, inside: ks.filter(e => e.tn).length, rally: !document.querySelector('#cmdbar [data-c="rally6"]').classList.contains('hide'), u: R.u };
  });
  assert.ok(r.up, 'surfaced'); assert.ok(r.inside >= 8, JSON.stringify(r)); assert.ok(r.rally, 'the Rally button shows');
  await shot(page, 'ruinmaw', [r.u - 250, 0]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6hbody: 28 Tanks against 19 Bastions take up space', { skip }, async () => {
  const { page, errors } = await match('lastfist', 'axiarchs');
  const r = await scene(page, () => {
    const g = game, u0 = 900, ts = [], bs = [];
    for (let i = 0; i < 28; i++) ts.push(spawnUnit(g, 0, 'tank', u0 + (i % 4) * 6, ((i >> 2) - 3) * 8));
    for (let i = 0; i < 19; i++) { const e = spawnUnit(g, 1, 'bastion', u0 + 320 + (i % 3) * 6, ((i / 3 | 0) - 3) * 8); bs.push(e); }
    update(g, TICK); command(g, 0, ts.map(e => e.id), 'attack');
    for (let i = 0; i < 60 * 9; i++) update(g, TICK);
    let nn = 0; for (const a of ts) { let m = 1e9; for (const b of ts) if (a !== b && b.hp > 0) m = Math.min(m, Math.hypot(a.u - b.u, (a.v - b.v) * DY)); nn += m; }
    return { nn: nn / ts.length, u: ts.reduce((a, e) => a + e.u, 0) / ts.length };
  });
  assert.ok(r.nn >= 18, `Tanks spread out: ${r.nn.toFixed(1)}`);
  await shot(page, 'bodies', [r.u + 120, 0]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6h: the Codex shows the Spitter from the start and the Queen on Acidic Evolution', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  const r = await page.evaluate(() => { openCodex('bloomhost', 'tree:barracks'); const el = document.getElementById('cx-t-barracks'); return { t: el ? el.textContent : '', thorn: !!document.getElementById('cx-u-thornback'), brood: !!document.getElementById('cx-u-broodback'), warden: document.body.textContent.includes('Chitin Warden') }; });
  assert.ok(/T1[^]*Spitter[^]*T2/.test(r.t), r.t); assert.ok(/Queen/.test(r.t)); assert.ok(!r.thorn && r.brood, 'the Broodback, no Thornback'); assert.ok(r.warden);
  await page.waitForTimeout(300); fs.mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: path.join(OUT, 'rework6h-codex.png') });
  assert.deepStrictEqual(errors, []); await page.close();
});

// bloomhost-ui "a match as Bloomhost" holds b6h off (its Train cards are v2.97's); this is its switches-on counterpart
test('b6h: a T1 Larva Pit\'s Train cards are the Skitterling and the Spitter', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist');
  await page.evaluate(() => { tryBuild(game, 0, 'barracks', 0); for (const b of game.ents) if (b.kind === 'b' && b.side === 0) { b.built = true; b.progress = 1; b.hp = b.maxHp; } paused = false; refreshUI(true); });
  await page.click('.tabs [data-tab="train"]'); await page.waitForTimeout(100);
  assert.deepStrictEqual(await page.$$eval('#cards .card', c => c.map(x => x.dataset.type)), ['skitterling', 'spitter']);
  assert.deepStrictEqual(errors, []); await page.close();
});
