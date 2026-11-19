// v2.93 (batch 6c, Part C): the start side (Left / Right / Random) and random team colours, in headless Chromium against the
// Hard AI, with real taps: from either side the player's controls act on their own units only, the fog is theirs, building
// and training work, the AI plays the other side, the match ends with the right screen, a save made on the right resumes
// there with its colours, and the setup screen remembers both choices.
const test = require('node:test');
const assert = require('node:assert');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const pw = findPlaywright();
const skip = !pw && 'playwright not installed';
let browser;
test.before(async () => { if (pw) browser = await pw.chromium.launch(); });
test.after(async () => { if (browser) await browser.close(); });

const HELPERS = () => {
  window.__scr = id => { const e = game.ents.find(x => x.id === id), p = uScreen(e), r = cv.getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; };
  window.__gscr = (u, v) => { const r = cv.getBoundingClientRect(), w = P(u, v); return [r.left + (w.x - cam.x) * V.S + V.cw / 2, r.top + (w.y - YB()) * V.S + V.A]; };
  window.__run = s => { for (let i = 0; i < Math.round(s * 60); i++) update(game, TICK); refreshUI(true); };
  window.__look = (u, v) => { cam.x = u; cam.vx = 0; if (CAMY.max > CAMY.min) cam.y = v * DY - (Y_TOP + Y_BOT) / 2; clampCam(); drawNow(); };
};
const prefs = (start, color, fac = 'lastfist', foe = 'bloomhost') => `try { localStorage.setItem('extinctionEvent.start', ${JSON.stringify(start)}); localStorage.setItem('extinctionEvent.color', ${JSON.stringify(color)}); localStorage.setItem('extinctionEvent.factions', ${JSON.stringify(JSON.stringify({ me: fac, foe }))}); localStorage.setItem('colonyMobile.diff', 'hard'); } catch (e) {}`;
async function start(page, map = 'classic') {
  await page.click('#bPlay'); await page.click(`.mapc[data-m="${map}"]`); await page.click('#bMapGo'); await page.waitForTimeout(250);
  await page.evaluate(() => { game.countdown = 0; hideCountdown(); updateIntro(); camTouched = true; closePanel(); for (const t of document.querySelectorAll('#toasts > *')) t.remove(); });
}

for (const [start0, color, fac, foe, map] of [['right', 'random', 'lastfist', 'bloomhost', 'classic'], ['left', 'pearl', 'axiarchs', 'lastfist', 'classic'], ['right', 'onyx', 'bloomhost', 'axiarchs', 'twolane'], ['right', 'gold', 'lastfist', 'axiarchs', 'threelane'], ['left', 'random', 'bloomhost', 'lastfist', 'twolane']]) {
  test(`start ${start0}, colour ${color}, ${fac} vs Hard ${foe} on ${map}: your controls, your fog, build, train, fight, the right end screen`, { skip }, async () => {
    const { page, errors } = await openPage(browser, PHONE, { init: prefs(start0, color, fac, foe), teams: true });
    await page.evaluate(HELPERS);
    await start(page, map);
    const me = start0 === 'right' ? 1 : 0;
    const a = await page.evaluate(() => ({ me: myS(), gme: game.me, tc: game.tc, ok: palOk(game.tc[0], game.tc[1]), fac: game.sides.map(s => s.faction), dir: game.sides.map(s => !!s.direct), per: game.sides.map(s => !!s.persona), diff: game.diffKey, camx: (camTouched = false, introCamera(1), camTouched = true, cam.x), /* the camera where the intro leaves it */ hq: [hqU(0), hqU(1)], fogMine: viewFog(game) === game.fog[myS()], teams: [TEAM[0].main, TEAM[1].main], pal: game.tc.map(k => PALETTE[k].main), cd: document.querySelector('#cd small') && document.querySelector('#cd small').textContent, you: getComputedStyle(document.documentElement).getPropertyValue('--you').trim() }));
    assert.strictEqual(a.me, me, 'the player plays the chosen side'); assert.strictEqual(a.gme, me ? 1 : undefined, 'g.me only when on the right');
    assert.ok(a.ok, `an allowed pair: ${a.tc}`); if (color !== 'random') assert.strictEqual(a.tc[me], color, 'your colour');
    assert.deepStrictEqual(a.teams, a.pal, 'the match is drawn in its colours'); assert.strictEqual(a.you.toLowerCase(), a.pal[me].toLowerCase(), 'the HUD carries your colour');
    assert.strictEqual(a.fac[me], fac); assert.strictEqual(a.fac[1 - me], foe);
    assert.ok(a.dir[me] && !a.dir[1 - me], 'your side is under direct control, the AI\'s is not');
    assert.ok(!a.per[me] && a.per[1 - me], 'the AI (with a personality) plays the other side'); assert.strictEqual(a.diff, 'hard');
    assert.ok(Math.abs(a.camx - a.hq[me]) < Math.abs(a.camx - a.hq[1 - me]), `the camera starts at your base (${Math.round(a.camx)})`);
    assert.ok(a.fogMine, 'the fog is your side\'s');
    // build (a pad, then a card) and train through the cards
    const b = await page.evaluate(() => {
      const s = game.sides[myS()]; s.res.c = s.res.e = 9000;
      onCard('barracks', document.createElement('div'));
      const bar = game.ents.find(e => e.kind === 'b' && e.side === myS() && e.type === 'barracks'); bar.built = true; bar.hp = bar.maxHp; bar.progress = 1;
      tab = 'train'; buildCards(); refreshUI(true);
      const first = UNIT_ORDER.find(t => canTrain(game, myS(), t)); onCard(first, document.createElement('div'));
      __run(30);
      const mine = game.ents.filter(e => e.kind === 'u' && e.side === myS() && !e.temp);
      return { bar: !!bar, bside: bar.side, first, units: mine.length, foeBld: game.ents.filter(e => e.kind === 'b' && e.side !== myS() && e.hp > 0).length };
    });
    assert.ok(b.bar && b.bside === me, 'the Barracks is yours'); assert.ok(b.units >= 1, `${b.first} trained (${b.units})`);
    // a fight in the middle: your units and theirs near each other in view; taps select only yours, a tap on an enemy targets it
    const f = await page.evaluate(() => {
      const me = myS(), d = dirOf(me), u0 = hqU(me) + d * 260, us = [], them = [];
      for (let i = 0; i < 4; i++) us.push(spawnUnit(game, me, game.sides[me].faction === 'bloomhost' ? 'spitter' : game.sides[me].faction === 'axiarchs' ? 'lancer' : 'heavy', u0 - i * 8 * d, -20 + i * 10));
      for (let i = 0; i < 3; i++) them.push(spawnUnit(game, 1 - me, 'skitterling' in UDEF && game.sides[1 - me].faction === 'bloomhost' ? 'skitterling' : game.sides[1 - me].faction === 'axiarchs' ? 'shardling' : 'rifle', hqU(me) + d * 420, -10 + i * 10));
      for (const e of them) { e.hp = e.maxHp; } game.sides[1 - me].aiT = 1e9; setStance(game, 1 - me, 'hold'); // the AI side stands and fights here
      __look(hqU(me) + d * 340, 0); SELN.clear(); refreshCtl();
      return { us: us.map(e => e.id), them: them.map(e => e.id) };
    });
    const [x, y] = await page.evaluate(i => __scr(i), f.us[0]); await page.mouse.click(x, y); await page.waitForTimeout(80);
    let sel = await page.evaluate(() => [...SELN]);
    assert.deepStrictEqual(sel, [f.us[0]], 'a tap on your unit selects it');
    const [ex, ey] = await page.evaluate(i => __scr(i), f.them[0]); await page.mouse.click(ex, ey); await page.waitForTimeout(80);
    const t = await page.evaluate(i => { const e = game.ents.find(x => x.id === i); return { sel: [...SELN], po: e && e.po }; }, f.us[0]);
    assert.ok(!t.sel.includes(f.them[0]), 'an enemy is never selected');
    assert.ok(t.po && t.po.o === 'target' && f.them.includes(t.po.id), `your unit targets the tapped enemy (${JSON.stringify(t.po)})`);
    await page.evaluate(ids => selSet(myUnits().filter(e => ids.includes(e.id))), f.us); // the whole squad, then the enemy again
    { const [qx, qy] = await page.evaluate(i => __scr(i), f.them[1]); await page.mouse.click(qx, qy); await page.waitForTimeout(80); }
    const hp0 = await page.evaluate(ids => ids.reduce((a, i) => { const e = game.ents.find(x => x.id === i); return a + (e ? e.hp + (e.shp || 0) : 0); }, 0), f.them);
    await page.evaluate(() => { __run(25); });
    const after = await page.evaluate(([ids, us]) => ({ n: ids.filter(i => game.ents.some(e => e.id === i && e.hp > 0)).length, dbg: us.concat(ids).map(i => { const e = game.ents.find(x => x.id === i); return e ? [e.type, e.side, Math.round(e.u), Math.round(e.hp), e.po && e.po.o, e.tgt] : null; }), over: game.over, t: game.t }), [f.them, f.us]);
    const hp1 = await page.evaluate(ids => ids.reduce((a, i) => { const e = game.ents.find(x => x.id === i); return a + (e && e.hp > 0 ? e.hp + (e.shp || 0) : 0); }, 0), f.them);
    assert.ok(hp1 < hp0 * 0.8, `the fight happened: the enemies lost ${Math.round(hp0 - hp1)} of ${Math.round(hp0)} (${after.n} of 3 left) ${JSON.stringify(after)}`);
    // the end: the opponent's HQ falls → Victory; then a fresh page for a defeat from the same side
    const end = await page.evaluate(() => { const foe = game.sides[foeS()]; for (const e of game.ents) if (e.kind === 'b' && e.side === foeS() && e.type !== 'hq') { e.hp = 0; e.dead = true; } refreshShields(game); foe.hq.hp = 1; kill(game, foe.hq, myS()); for (let i = 0; i < 60 * 8 && !game.over; i++) update(game, TICK); return { over: game.over, winner: game.winner }; });
    assert.ok(end.over && end.winner === me, `you won (${JSON.stringify(end)})`);
    await page.waitForTimeout(2600);
    const txt = await page.evaluate(() => document.querySelector('#box') ? document.querySelector('#box').textContent : '');
    assert.match(txt, /Victory/i, 'the Victory screen');
    assert.deepStrictEqual(errors, []);
    await page.close();
  });
}

test('defeat from the right: the Defeat screen; a save made on the right resumes on the right with its colours', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW, { init: prefs('right', 'green', 'axiarchs', 'bloomhost'), teams: true });
  await page.evaluate(HELPERS);
  await start(page, 'classic');
  const s1 = await page.evaluate(() => { const s = game.sides[myS()]; s.res.c = 9000; onCard('refinery', document.createElement('div')); __run(3); saveGame(); return { me: myS(), tc: game.tc.slice(), cam: cam.x, t: game.t }; });
  assert.strictEqual(s1.me, 1); assert.strictEqual(s1.tc[1], 'green');
  await page.reload(); await page.waitForTimeout(300);
  await page.click('#bResume'); await page.waitForTimeout(200);
  const r = await page.evaluate(() => ({ me: myS(), tc: game.tc && game.tc.slice(), dir: game.sides.map(s => !!s.direct), fac: game.sides[myS()].faction, teams: [TEAM[0].main, TEAM[1].main], t: game.t }));
  assert.strictEqual(r.me, 1, 'resumed on the right'); assert.deepStrictEqual(r.tc, s1.tc, 'the colours survive the save');
  assert.ok(r.dir[1] && !r.dir[0], 'your side under direct control again'); assert.strictEqual(r.fac, 'axiarchs');
  await page.evaluate(() => { paused = false; drawNow(); });
  const d = await page.evaluate(() => { const hq = game.sides[myS()].hq; for (const e of game.ents) if (e.kind === 'b' && e.side === myS() && e.type !== 'hq') { e.hp = 0; e.dead = true; } refreshShields(game); hq.hp = 1; kill(game, hq, foeS()); for (let i = 0; i < 60 * 8 && !game.over; i++) update(game, TICK); return { over: game.over, winner: game.winner }; });
  assert.ok(d.over && d.winner === 0, 'the AI on the left won');
  await page.waitForTimeout(2600);
  assert.match(await page.evaluate(() => document.querySelector('#box').textContent), /Defeat/i, 'the Defeat screen');
  assert.deepStrictEqual(errors, []);
  await page.close();
});

for (const dev of [NARROW, PHONE]) test(`setup at ${dev.width}×${dev.height}: Start (Left / Right / Random) and Your colour beside Play on the battlefield screen, it still fits, both remembered; Left and Random by default`, { skip }, async () => {
  const { page, errors } = await openPage(browser, dev);
  await page.click('#bPlay'); await page.waitForTimeout(150);
  const d = await page.evaluate(() => { const b = $('box'), inView = el => { const q = el.getBoundingClientRect(); return q.top >= 0 && q.bottom <= innerHeight && q.left >= 0 && q.right <= innerWidth; };
    return { start: [...document.querySelectorAll('#startSeg button')].map(x => x.getAttribute('aria-label') + (x.classList.contains('on') ? '*' : '')), col: $('colorBtn').getAttribute('aria-label'), scroll: b.scrollHeight - b.clientHeight, all: [...document.querySelectorAll('#startSeg button, #colorBtn, #bMapGo, #bMapBack')].every(inView) }; });
  assert.deepStrictEqual(d.start, ['Start left*', 'Start right', 'Start random']); assert.strictEqual(d.col, 'Your colour: Random');
  assert.ok(d.scroll <= 1, `the battlefield screen scrolls by ${d.scroll}px`); assert.ok(d.all, 'every button on screen');
  await page.click('#startSeg button[data-k="right"]'); for (let i = 0; i < 5; i++) await page.click('#colorBtn'); // Random → Blue → Red → Green → Gold → Purple
  await page.reload(); await page.waitForTimeout(300); await page.click('#bPlay'); await page.waitForTimeout(150);
  const e = await page.evaluate(() => ({ s: document.querySelector('#startSeg .on').dataset.k, c: $('colorBtn').dataset.k }));
  assert.deepStrictEqual(e, { s: 'right', c: 'purple' });
  assert.deepStrictEqual(errors, []);
  await page.close();
});

test('10,000 colour rolls: never an excluded pair, never the same colour, every colour used, and the match\'s random streams untouched', { skip }, async () => {
  const { page, errors } = await openPage(browser, NARROW);
  const r = await page.evaluate(() => {
    const g = newGame('hard', { seed: 42 }); const before = JSON.stringify([g.rs, g.fs, g.os, g.ar]);
    let simCalls = 0; const sr = simRnd; simRnd = function () { simCalls++; return sr.apply(this, arguments); };
    const bad = [], seen = new Set(), mineSeen = {};
    for (let i = 0; i < 10000; i++) {
      const pick = i % 2 ? 'random' : PAL_KEYS[i % PAL_KEYS.length];
      const [a, b] = palRoll(pick); seen.add(a); seen.add(b);
      if (!palOk(a, b)) bad.push([a, b]);
      if (pick !== 'random' && a !== pick) bad.push(['mine', pick, a]);
      g.tc = me => me; // touching the game object changes nothing
    }
    simRnd = sr;
    return { bad: bad.slice(0, 5), n: bad.length, seen: seen.size, same: before === JSON.stringify([g.rs, g.fs, g.os, g.ar]), simCalls, excl: PAL_BAD };
  });
  assert.strictEqual(r.n, 0, JSON.stringify(r.bad)); assert.strictEqual(r.seen, 8);
  assert.ok(r.same, 'the match streams are unchanged'); assert.strictEqual(r.simCalls, 0, 'simRnd never called');
  assert.ok(r.excl.some(([a, b]) => (a === 'red' && b === 'green') || (a === 'green' && b === 'red')), 'red and green never together');
  assert.deepStrictEqual(errors, []);
  await page.close();
});
