// v2.97 (batch 6g, REWORK.b6g) in a real browser at 667×375: each fix seen in a running match, with a screenshot of each.
// Screenshots: tests/screenshots/rework6g-*.png (docs/screenshots with EE_DOC_SHOTS=1): warp-behind (an Axiarch AI's units
// warping in behind its army), node-gate (a unit from a Genesis Gate on a forward pad at the player's warp point), attack-hq
// (the player's army attacking the enemy HQ), melee-charge (Bloomhost melee charging Marines that shoot them from beyond
// their reach), fortified-node (an AI's turret on a forward pad it holds), beam-lane (the Purification Beam on Three-Lane's
// north lane).
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

// A match from the menus: me, foe, map; both AIs idle, the countdown skipped
async function match(me, foe, map) {
  const { page, errors } = await openPage(browser, NARROW);
  await page.click(`#meSeg [data-f="${me}"]`); await page.click(`#foeSeg [data-f="${foe}"]`); await page.click('#bPlay');
  await page.evaluate(m => { const c = document.querySelector(`.mapc[data-m="${m}"]`); c.scrollIntoView({ inline: 'center' }); }, map);
  await page.click(`.mapc[data-m="${map}"]`); await page.click('#bMapGo'); await page.waitForTimeout(300);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); for (const s of game.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } paused = true; });
  return { page, errors };
}
const shot = async (page, name, at, reveal) => { // reveal: the whole field in view (the enemy AI's side of a scene)
  await page.evaluate(([u, v, rv]) => { $('toasts').innerHTML = ''; if (rv) for (const f of game.fog) { f.vis.fill(1); f.exp.fill(1); } camJump(u, v); render(ctx, game, game.t, sel, selPad); }, [at[0], at[1], !!reveal]);
  fs.mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: path.join(OUT, `rework6g-${name}.png`) });
};

test('b6g: an Axiarch AI warps its new units in behind its army, out of the enemy\'s reach', { skip }, async () => {
  const { page, errors } = await match('lastfist', 'axiarchs', 'classic');
  const r = await page.evaluate(() => {
    const g = game, s = 1; for (let i = 0; i < 60 * 25; i++) update(g, TICK);
    const hq = hqU(s), army = [];
    for (let i = 0; i < 6; i++) army.push(spawnUnit(g, s, i < 4 ? 'lancer' : 'bastion', hq - 520 + (i % 3) * 18, (i - 2.5) * 22));
    for (let i = 0; i < 6; i++) spawnUnit(g, 0, 'rifle', hq - 700 + (i % 3) * 14, (i - 2.5) * 20);
    updateVision(g);
    for (const t of ['lancer', 'lancer', 'shardling']) startWarp(g, s, t);
    for (let i = 0; i < 60 * 1.2; i++) update(g, TICK);
    const foes = g.ents.filter(e => e.kind === 'u' && e.side === 0 && e.hp > 0);
    return { w: g.warps.map(w => ({ u: w.u, v: w.v, near: Math.min(...foes.map(f => Math.hypot(f.u - w.u, f.v - w.v))) })), front: Math.min(...army.map(a => a.u)), hq };
  });
  assert.ok(r.w.length === 3, JSON.stringify(r));
  for (const w of r.w) { assert.ok(w.near >= 150, `150 clear of the Marines: ${Math.round(w.near)}`); assert.ok(w.u > r.front, 'behind the army\'s front'); }
  await shot(page, 'warp-behind', [(r.front + Math.max(...r.w.map(w => w.u))) / 2, 0], true);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6g: a unit from a Genesis Gate on a forward pad warps in at the player\'s warp point', { skip }, async () => {
  const { page, errors } = await match('axiarchs', 'lastfist', 'twolane');
  const r = await page.evaluate(() => {
    const g = game, k = FWD_PADS.findIndex(p => MAP.nodes[p.node].id === 'fwn'), F = FWD_PADS[k];
    g.nodes[F.node].owner = 0; g.nodes[F.node].prog = 100;
    if (!tryBuild(g, 0, 'barracks', FWD_SLOT + k).ok) throw new Error('gate');
    for (const e of g.ents) if (e.kind === 'b' && e.side === 0) { e.built = true; e.progress = 1; e.hp = e.maxHp; }
    for (let i = 0; i < 60 * 20; i++) update(g, TICK);
    const p = warp6f(g, 0); if (!setWarp(g, 0, p.u, p.v).ok) throw new Error('setWarp');
    const gate = g.ents.find(e => e.kind === 'b' && e.side === 0 && e.slot >= FWD_SLOT); gate.queue.push('lancer');
    for (let i = 0; i < 60 * 30 && !g.warps.length; i++) update(g, TICK);
    for (let i = 0; i < 60 * 1.0; i++) update(g, TICK);
    const w = g.warps[0];
    return { w: w && { u: w.u, v: w.v }, set: g.sides[0].warp, pad: F.at };
  });
  assert.ok(r.w, 'warping in'); assert.ok(Math.hypot(r.w.u - r.set.u, r.w.v - r.set.v) < 60, `at the warp point: ${JSON.stringify(r)}`);
  assert.ok(Math.hypot(r.w.u - r.pad[0], r.w.v - r.pad[1]) > 300, 'not at the pad');
  await shot(page, 'node-gate', [r.set.u + 120, r.set.v]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6g: the player\'s Attack order fights at the enemy HQ instead of walking past it', { skip }, async () => {
  const { page, errors } = await match('lastfist', 'bloomhost', 'twolane');
  const r = await page.evaluate(() => {
    const g = game, hq = hqU(1); g.ents = g.ents.filter(e => !(e.kind === 'b' && e.side === 1 && e.type !== 'hq'));
    const us = []; for (let i = 0; i < 8; i++) { const u = spawnUnit(g, 0, i < 4 ? 'tank' : 'rifle', hq - 520 + (i % 4) * 16, (i - 3.5) * 16); u.hp = u.maxHp *= 4; us.push(u); }
    update(g, TICK); command(g, 0, us.map(u => u.id), 'attack');
    let far = -1e9; for (let i = 0; i < 60 * 30; i++) { update(g, TICK); for (const u of us) if (u.hp > 0) far = Math.max(far, u.u); }
    const H = g.sides[1].hq; return { far, hq, hit: H.hp < H.maxHp, hqv: H.v };
  });
  assert.ok(r.hit, 'the HQ took damage'); assert.ok(r.far <= r.hq + 140, `no unit walked past it: ${Math.round(r.far - r.hq)}`);
  await shot(page, 'attack-hq', [r.hq - 110, r.hqv]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6g: Bloomhost melee on Hold charge Marines shooting them from beyond their reach', { skip }, async () => {
  const { page, errors } = await match('bloomhost', 'lastfist', 'classic');
  const r = await page.evaluate(() => {
    const g = game, mine = []; directControl(g, 1);
    for (let i = 0; i < 8; i++) { const u = spawnUnit(g, 0, i < 6 ? 'skitterling' : 'bulwark', 800 + (i % 4) * 12, (i - 3.5) * 14); u.po = { o: 'hold' }; u.holdU = u.u; u.holdV = u.v; mine.push(u); }
    for (let i = 0; i < 6; i++) { const u = spawnUnit(g, 1, 'rifle', 935 + (i % 2) * 14, (i - 2.5) * 16); u.po = { o: 'hold' }; u.holdU = u.u; u.holdV = u.v; }
    updateVision(g); let ch = 0;
    for (let i = 0; i < 60 * 3.2; i++) { update(g, TICK); for (const u of mine) if (u.r6 && u.r6.m === 'c') ch++; }
    return { ch, moved: mine.filter(u => u.hp > 0 && u.u > 830).length };
  });
  assert.ok(r.ch > 0 && r.moved > 0, JSON.stringify(r));
  await shot(page, 'melee-charge', [880, 0]);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6g: an AI fortifies a forward pad it holds with its turret', { skip }, async () => {
  const { page, errors } = await match('lastfist', 'axiarchs', 'twolane');
  const r = await page.evaluate(() => {
    const g = game, s = 1, sd = g.sides[s]; sd.persona.kind = 'turtle';
    tryBuild(g, s, 'barracks'); for (const e of g.ents) if (e.kind === 'b' && e.side === s) { e.built = true; e.progress = 1; e.hp = e.maxHp; }
    const k = FWD_PADS.findIndex(p => MAP.nodes[p.node].id === 'fen'), F = FWD_PADS[k]; g.nodes[F.node].owner = s; g.nodes[F.node].prog = -100;
    sd.la = sd.la || { t: -99, sh: -99, fw: -99 }; sd.n6 = { t: -99, f: -99, own: [], lost: {}, hot: {} };
    aiFort6g(g, s, { label: 'Hard' }, false); sd.la.f6 = -99; aiFort6g(g, s, { label: 'Hard' }, false);
    for (const e of g.ents) if (e.kind === 'b' && e.side === s && e.slot >= FWD_SLOT) { e.built = true; e.progress = 1; e.hp = e.maxHp; }
    for (let i = 0; i < 60 * 2; i++) update(g, TICK);
    for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); }
    return { n: g.ents.filter(e => e.kind === 'b' && e.side === s && e.slot >= FWD_SLOT && e.type === 'turret').length, at: F.at };
  });
  assert.strictEqual(r.n, 2, 'the Turtle: two Null Lances on the pad');
  await shot(page, 'fortified-node', [r.at[0], r.at[1]], true);
  assert.deepStrictEqual(errors, []); await page.close();
});

test('b6g: the Purification Beam sweeps an outer lane on Three-Lane', { skip }, async () => {
  const { page, errors } = await match('axiarchs', 'lastfist', 'threelane');
  const r = await page.evaluate(() => {
    const g = game; for (const b of g.ents) if (b.kind === 'b' && b.side === 0 && b.type === 'hq') b.tier = 3;
    for (const f of g.fog) { f.exp.fill(1); f.vis.fill(1); }
    directControl(g, 1); const ln = MAP.lanes.find(l => l.id === 'north'), u = 1250, v = laneY(ln, u), foes = [];
    for (let i = 0; i < 5; i++) { const e = spawnUnit(g, 1, i < 2 ? 'tank' : 'rifle', u - 60 + i * 30, v + (i % 2 ? 14 : -14)); e.po = { o: 'hold' }; e.holdU = e.u; e.holdV = e.v; foes.push(e); }
    g.sides[0].ab.beam = 0; const res = useAbility(g, 0, 'beam', u, v);
    for (let i = 0; i < 60 * (ABIL.beam.delay + 0.8); i++) update(g, TICK);
    for (const f of g.fog) f.vis.fill(1);
    return { ok: res.ok, msg: res.msg, u, v, hurt: foes.filter(e => e.hp < e.maxHp).length };
  });
  assert.ok(r.ok, r.msg); assert.ok(r.hurt > 0, 'the sweep hit units on the north lane');
  await shot(page, 'beam-lane', [r.u, r.v]);
  assert.deepStrictEqual(errors, []); await page.close();
});
