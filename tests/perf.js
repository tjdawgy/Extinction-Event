// Performance measurement in headless Chromium at iPhone landscape size (858×396, 2× pixels).
//   node tests/perf.js [battle] [memory] [--army=rifle:20,flame:3,...] [--secs=15] [--rates=1,4,6] [--quality=2|1|0|auto] [--abilities | --abilities-spam] [--storm] [--bases] [--json=out.json]
// battle: both armies kept near the 80-population cap and fighting mid-map in full view, measured
//         at each CPU throttle rate (Chromium DevTools CPU throttling simulates a slower phone).
//         Reports the script time per frame (update + render) and the time between frames.
// memory: a whole AI-vs-AI match played at 3× speed for 15 game minutes (a new match starts if one
//         ends early), with the JS heap measured after a forced garbage collection along the way.
// Math.random is seeded so both versions see the same battle.
const fs = require('fs');
const { findPlaywright, PHONE, openPage } = require('./browser-kit');

const SEED = `(() => { let a = 12345; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();`;

// Records script time per frame and the gap between frames
const PROBE = () => {
  const orig = window.frame;
  const cached = () => (typeof SPR !== 'undefined' ? SPR.map.size : 0); // sprite cache entries (v2.2+)
  window.__perf = { work: [], gap: [], slow: [], lastTs: 0, on: false };
  window.frame = function (ts) {
    const P = window.__perf, t0 = performance.now(), n0 = cached();
    orig(ts);
    const w = performance.now() - t0;
    if (P.on) { P.work.push(w); if (P.lastTs) P.gap.push(ts - P.lastTs); if (w > 12) P.slow.push(`${w.toFixed(1)}ms${cached() > n0 ? ' +' + (cached() - n0) + ' sprites' : ''}`); }
    P.lastTs = ts;
  };
};

// 78 population per side: every unit type in a mix
const ARMY = { rifle: 20, heavy: 8, sniper: 4, tank: 4, artillery: 2, titan: 1, aircraft: 2, interceptor: 2 };
// --army (v2.14): a different mix per side, e.g. to measure Flame Tanks and Hydras (only on a copy that has them)
const armyArg = (process.argv.find(a => a.startsWith('--army=')) || '').slice(7);
const army = armyArg ? Object.fromEntries(armyArg.split(',').map(x => { const [k, n] = x.split(':'); return [k, +n]; })) : ARMY;
const BATTLE = army => {
  game.countdown = 0; hideCountdown();
  for (const s of [0, 1]) { game.sides[s].aiT = 1e9; game.sides[s].stance = 'attack'; game.sides[s].res.c = game.sides[s].res.e = 0; }
  // --storm (v2.6): the fight moves next to the player's base, both sides get buildings, and the clock is at 21:40,
  // inside the Extinction Event (meteors on every building in view); buildings are kept standing so the match goes on
  const storm = !!window.__storm, bases = !!window.__bases, mid = storm || bases ? hqPos(0).u + 420 : L / 2;
  // --bases (v2.7 baseline): every pad on both sides holds a T3 building and the fight is next to the player's base
  if (bases) {
    const kinds = ['refinery', 'reactor', 'habitat', 'barracks', 'turret', 'factory', 'techlab', 'refinery'];
    for (const s of [0, 1]) { game.sides[s].res.c = game.sides[s].res.e = 1e6; for (let i = 0; i < 8; i++) { tryBuild(game, s, kinds[i], i); for (const b of game.ents) if (b.kind === 'b') { b.built = true; b.progress = 1; } } game.sides[s].res.c = game.sides[s].res.e = 0; }
    for (const b of game.ents) if (b.kind === 'b') { b.tier = 3; b.maxHp = BDEF[b.type].hp * hpMul(BDEF[b.type], 3); b.hp = b.maxHp; }
  }
  if (storm) {
    for (const s of [0, 1]) { game.sides[s].res.c = game.sides[s].res.e = 1e5; for (const k of ['refinery', 'reactor', 'barracks', 'turret']) { tryBuild(game, s, k); for (const b of game.ents) if (b.type === k && b.side === s) { b.built = true; b.progress = 1; } } game.sides[s].res.c = game.sides[s].res.e = 0; }
    game.t = 1300;
  }
  camTouched = true; cam.x = mid; cam.vx = 0; clampCam();
  const topUp = () => {
    for (const s of [0, 1]) {
      game.sides[s].hq.hp = game.sides[s].hq.maxHp;
      if (storm || bases) for (const b of game.ents) if (b.kind === 'b') b.hp = b.maxHp;
      if (storm) game.t = Math.min(game.t, 1300);
      for (const [type, n] of Object.entries(army)) {
        const have = game.ents.filter(e => e.kind === 'u' && e.side === s && e.type === type && e.hp > 0).length;
        for (let i = have; i < n; i++) spawnUnit(game, s, type, mid + (s ? 1 : -1) * (140 + Math.random() * 120), (Math.random() - 0.5) * 200);
      }
    }
  };
  topUp();
  window.__topUp = setInterval(topUp, 300); // often enough that both armies stay at full size whatever kills or saves units
  // --abilities (v2.5+): both sides keep casting Shield, Orbital Strike and Repair Pulse into the fight, far more often than real play
  if (window.__abil && typeof useAbility === 'function') {
    for (const s of [0, 1]) for (const k of ['barracks', 'factory']) { tryBuild(game, s, k); for (const b of game.ents) if (b.type === k && b.side === s) { b.built = true; b.progress = 1; } }
    // default: every 10 s each side casts all three at once (5-10x the real cooldowns); __abilSpam: one cast every 1.2 s per side (about 30x)
    let n = 0;
    const cast = (s, k) => {
      const side = game.sides[s];
      side.ab[k] = 0; side.res.c = side.res.e = 1000; game.fog[s].exp.fill(1);
      const mine = game.ents.filter(e => e.side === s && e.kind === 'u'), foes = game.ents.filter(e => e.side !== s && e.kind === 'u');
      const t = k === 'strike' ? foes[n % Math.max(1, foes.length)] : mine[n % Math.max(1, mine.length)];
      if (t) useAbility(game, s, k, t.u, t.v);
      side.res.c = side.res.e = 0;
    };
    const wave = () => { for (const s of [0, 1]) for (const k of ['shield', 'strike', 'repair']) cast(s, k); n++; };
    if (window.__abil === 'spam') window.__cast = setInterval(() => { for (const s of [0, 1]) cast(s, ['shield', 'strike', 'repair'][n % 3]); n++; }, 1200);
    else { wave(); window.__cast = setInterval(wave, 10000); }
  }
};

const stats = a => {
  const s = [...a].sort((x, y) => x - y), n = s.length || 1;
  return { frames: s.length, avg: +(s.reduce((x, y) => x + y, 0) / n).toFixed(2), p95: +(s[Math.floor(n * 0.95)] || 0).toFixed(2), max: +(s[s.length - 1] || 0).toFixed(1), over50: s.filter(x => x > 50).length, over33: s.filter(x => x > 33.4).length };
};

async function battle(browser, rates, secs, quality, abil, storm, bases) {
  const out = {};
  for (const rate of rates) {
    const { page, errors } = await openPage(browser, PHONE, { init: SEED });
    await page.click('#bPlay');
    await page.waitForTimeout(300);
    await page.evaluate(PROBE);
    await page.evaluate(([a, st, bs]) => { window.__abil = a; window.__storm = st; window.__bases = bs; }, [abil, storm, bases]);
    await page.evaluate(BATTLE, army);
    await page.evaluate(q => { if (typeof VFX !== 'undefined') VFX.lock = q === 'auto' ? null : +q; }, quality); // effect quality (v2.3+): a level, or auto
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await page.waitForTimeout(4000); // let the armies meet
    await page.evaluate(() => { window.__perf.on = true; });
    const sample = [];
    for (let i = 0; i < secs; i++) {
      await page.waitForTimeout(1000);
      sample.push(await page.evaluate(() => ({ units: game.ents.filter(e => e.kind === 'u').length, parts: game.parts.length + (typeof VFX !== 'undefined' ? VFX.np : 0), fx: game.fx.length + (typeof VFX !== 'undefined' ? VFX.nfx : 0), projs: game.projs.length, q: typeof VFX !== 'undefined' ? VFX.q : -1, voices: typeof SND !== 'undefined' ? SND.voices : -1, audio: typeof SND !== 'undefined' && SND.ctx ? SND.ctx.state : '-' })));
    }
    const P = await page.evaluate(() => { window.__perf.on = false; return { work: window.__perf.work, gap: window.__perf.gap, slow: window.__perf.slow }; });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const avgOf = k => Math.round(sample.reduce((x, y) => x + y[k], 0) / sample.length);
    out[rate + 'x'] = { work: stats(P.work), gap: stats(P.gap), units: avgOf('units'), parts: avgOf('parts'), fx: avgOf('fx'), projs: avgOf('projs'), quality: sample.map(x => x.q).join(''), voices: Math.max(...sample.map(x => x.voices)), audio: sample[0].audio, sound: await page.evaluate(() => typeof SND !== 'undefined' ? { played: SND.played, dropped: SND.dropped } : null), slow: P.slow.slice(0, 12), maxParts: Math.max(...sample.map(s => s.parts)), errors };
    const r = out[rate + 'x'];
    console.log(`battle ${rate}x CPU: script/frame avg ${r.work.avg} ms, p95 ${r.work.p95}, max ${r.work.max} | frame gap avg ${r.gap.avg} ms, max ${r.gap.max}, >50ms ${r.gap.over50}, >33ms ${r.gap.over33} of ${r.gap.frames} | units ${r.units}, particles ${r.parts} (max ${r.maxParts}), fx ${r.fx}, projectiles ${r.projs}, quality per second ${r.quality}${r.sound ? `, audio ${r.audio}: ${r.sound.played} sounds played, ${r.sound.dropped} dropped by the caps, peak voices sampled ${r.voices}` : ''}${errors.length ? ' | ERRORS ' + errors.join('; ') : ''}`);
    if (rate === 1 && P.slow.length) console.log(`  script frames over 12 ms: ${P.slow.slice(0, 12).join(', ')}`);
    await page.close();
  }
  return out;
}

async function memory(browser, storm) {
  const { page, errors } = await openPage(browser, PHONE, { init: SEED });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.enable');
  const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); const h = await cdp.send('Runtime.getHeapUsage'); return +(h.usedSize / 1048576).toFixed(2); };
  const nodes = async () => (await cdp.send('Memory.getDOMCounters')).nodes;
  await page.click('#bPlay'); // a tap: starts audio (v2.4+)
  await page.evaluate(st => { window.__storm = st; }, storm);
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    window.__played = 0; window.__matches = 0;
    window.__newMatch = () => { game = newGame('hard', { autoPlayer: true, autoDiff: 'hard' }); if (window.__storm) game.t = 1150; /* --storm: every match plays through the Extinction Event */ resize(); camTouched = true; cam.x = L / 2; clampCam(); hideOverlay(); running = true; paused = false; speed = 3; window.__matches++; };
    window.__newMatch();
    setInterval(() => { // count game time across matches; start a new match if one ends
      if (window.__lastT !== undefined && game.t >= window.__lastT) window.__played += game.t - window.__lastT;
      window.__lastT = game.t;
      if (game.over) { clearTimeout(endTimer); endTimer = null; window.__lastT = undefined; window.__newMatch(); }
      cam.x = L / 2 + Math.sin(performance.now() / 4000) * 500; clampCam(); // sweep the view over the field
    }, 250);
  });
  const rows = [];
  for (const mark of [60, 300, 600, 900]) {
    await page.waitForFunction(m => window.__played >= m, mark, { timeout: 900000, polling: 1000 });
    const st = await page.evaluate(() => ({ t: Math.round(window.__played), matches: window.__matches, parts: game.parts.length, fx: game.fx.length, projs: game.projs.length, ents: game.ents.length, snd: typeof SND !== 'undefined' && SND.ctx ? `${SND.ctx.state}, ${SND.played} played, ${SND.voices} voices, ${SND.live} live nodes` : '-', vfx: typeof VFX !== 'undefined' ? `${VFX.np}/${VFX.nfx}/${VFX.decals.length}/${VFX.smokers.length}/${VFX.wrecks.length}` : '-' }));
    rows.push({ ...st, heapMB: await heap(), domNodes: await nodes() });
    console.log(`memory @ ${st.t}s game time: heap ${rows[rows.length - 1].heapMB} MB after GC, DOM nodes ${rows[rows.length - 1].domNodes}, matches ${st.matches}, entities ${st.ents}, particles ${st.parts}, fx ${st.fx}, projectiles ${st.projs}, effects pool parts/fx/decals/smokers/wrecks ${st.vfx}, sound ${st.snd}`);
  }
  if (errors.length) console.log('ERRORS ' + errors.join('; '));
  await page.close();
  return { rows, errors };
}

async function main() {
  const args = process.argv.slice(2);
  const opt = k => (args.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
  const which = args.filter(a => !a.startsWith('--'));
  const secs = +(opt('secs') || 15), rates = (opt('rates') || '1,4,6').split(',').map(Number), quality = opt('quality') || '2', abil = args.includes('--abilities-spam') ? 'spam' : args.includes('--abilities'), storm = args.includes('--storm'), bases = args.includes('--bases');
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  const browser = await pw.chromium.launch();
  const res = { version: null };
  try {
    const { page } = await openPage(browser, PHONE);
    res.version = await page.evaluate(() => VERSION); await page.close();
    console.log('version', res.version);
    if (!which.length || which.includes('battle')) res.battle = await battle(browser, rates, secs, quality, abil, storm, bases);
    if (!which.length || which.includes('memory')) res.memory = await memory(browser, storm);
  } finally { await browser.close(); }
  if (opt('json')) fs.writeFileSync(opt('json'), JSON.stringify(res, null, 1));
}
main().catch(e => { console.error(e); process.exit(1); });
