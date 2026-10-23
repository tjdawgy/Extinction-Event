// Building screenshots: every building at T1, T2 and T3 for both teams (enlarged), then in game: both bases at
// each tier, upgrades in combat, a collapse, the storm, ability effects, ghosts under fog and the building panel.
// Set EE_HTML to draw another copy of the game (before/after).
//   node tests/building-sheet.js [outDir] [--narrow] [--tag=name]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, NARROW, openPage } = require('./browser-kit');

const SHEET = () => {
  const types = ['hq', 'turret', 'barracks', 'factory', 'techlab', 'reactor', 'refinery', 'habitat'];
  const Z = 1.25, colW = 190, rowH = 200, W = 120 + 6 * colW, H = 40 + types.length * rowH;
  const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2;
  const c = cv.getContext('2d'); c.scale(2, 2);
  c.fillStyle = '#1d2a22'; c.fillRect(0, 0, W, H);
  c.font = '600 13px -apple-system,system-ui,sans-serif'; c.fillStyle = '#cfd8e6'; c.textAlign = 'center';
  [['Blue', 0], ['Red', 1]].forEach(([n, s]) => [1, 2, 3].forEach(tier => c.fillText(`${n} T${tier}`, 120 + (s * 3 + tier - 1) * colW + colW / 2, 24)));
  types.forEach((type, r) => {
    const d = BDEF[type], y = 40 + r * rowH + rowH - 30;
    c.textAlign = 'left'; c.fillStyle = '#cfd8e6'; c.fillText(d.name, 8, y - 60);
    for (const s of [0, 1]) for (const tier of [1, 2, 3]) {
      c.save(); c.translate(120 + (s * 3 + tier - 1) * colW + colW / 2, y - 10); c.scale(Z, Z);
      const b = { side: s, tier, queue: [], aim: null, u: 0, v: 0 };
      DRAW_B[type](c, TEAM[s], 1.3, b, tier);
      c.restore();
    }
  });
  return cv.toDataURL('image/png').split(',')[1];
};

// The in-game scene: a full base on both sides at one tier, AI off, everything in view
const SCENE = tier => {
  game = newGame('normal', {}); game.countdown = 0; hideCountdown(); hideOverlay(); updateIntro(); paused = true; running = true; closePanel(); $('toasts').innerHTML = '';
  for (const s of [0, 1]) { game.sides[s].aiT = 1e9; game.sides[s].res.c = game.sides[s].res.e = 1e6; }
  const kinds = ['refinery', 'reactor', 'habitat', 'barracks', 'turret', 'factory', 'techlab', 'refinery'];
  for (const s of [0, 1]) for (let i = 0; i < 8; i++) { tryBuild(game, s, kinds[i], i); for (const b of game.ents) if (b.kind === 'b') { b.built = true; b.progress = 1; } } // finish each so the next one's requirement is met
  for (const b of game.ents) if (b.kind === 'b') { b.built = true; b.progress = 1; b.tier = tier; b.maxHp = BDEF[b.type].hp * hpMul(BDEF[b.type], tier); b.hp = b.maxHp; }
  for (let i = 0; i < 3; i++) update(game, 1 / 30);
  window.__see = () => { for (const f of game.fog) { f.vis.fill(1); f.exp.fill(1); } };
  window.__frames = (n, step = true) => { for (let i = 0; i < n; i++) { if (step) update(game, 1 / 30); __see(); render(ctx, game, game.t, sel, selPad); } refreshUI(true); drawMinimapNow(); };
  window.__cam = s => { cam.x = s === 0 ? hqPos(0).u + 260 : hqPos(1).u - 260; clampCam(); };
  __see(); __cam(0);
};

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, 'screenshots'));
  const device = args.includes('--narrow') ? NARROW : PHONE;
  const tag = ((args.find(a => a.startsWith('--tag=')) || '').split('=')[1]) || 'buildings';
  const res = `${device.width}x${device.height}`;
  const pw = findPlaywright();
  if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const shots = [];
  try {
    const { page, errors } = await openPage(browser, device, { init: 'Math.random = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();' });
    if (!args.includes('--narrow')) { const f = path.join(outDir, `${tag}-tiers.png`); fs.writeFileSync(f, Buffer.from(await page.evaluate(SHEET), 'base64')); console.log(f); }
    await page.click('#bPlay'); await page.waitForTimeout(300);
    const snap = async (label, file) => { await page.waitForTimeout(80); const img = await page.screenshot(); shots.push({ label, img: img.toString('base64') }); if (file) { const f = path.join(outDir, `${tag}-${file}-${res}.png`); fs.writeFileSync(f, img); console.log(f); } };
    const scene = async (tier, js) => { await page.evaluate(SCENE, tier); if (js) await page.evaluate(js); };
    for (const tier of [1, 2, 3]) for (const s of [0, 1]) {
      await scene(tier, `__cam(${s}); __frames(3)`);
      await snap(`T${tier}, ${s ? 'red (enemy)' : 'blue (player)'} base`, `base-T${tier}-${s ? 'red' : 'blue'}`);
    }
    await scene(2, () => { // upgrades during combat
      for (const b of game.ents) if (b.kind === 'b' && b.side === 0 && ['turret', 'barracks', 'techlab'].includes(b.type)) { tryUpgrade(game, 0, b, 'A'); b.upProg = 0.55; }
      for (let i = 0; i < 10; i++) { const e = spawnUnit(game, 1, i < 6 ? 'rifle' : 'tank', hqPos(0).u + 330 + i * 12, (i % 3 - 1) * 40); e.holdU = e.u; e.holdV = e.v; }
      for (let i = 0; i < 6; i++) { const e = spawnUnit(game, 0, i < 4 ? 'heavy' : 'tank', hqPos(0).u + 250 + i * 10, (i % 3 - 1) * 40); e.holdU = e.u; e.holdV = e.v; }
      __frames(40);
    });
    await snap('Upgrading T2 → T3 during combat (Turret, Barracks, Tech Lab)');
    await scene(3, () => { const f = game.ents.find(b => b.kind === 'b' && b.side === 0 && b.type === 'factory'); kill(game, f, 1); __frames(14); });
    await snap('A T3 War Factory collapsing');
    await scene(3, () => { game.t = 1290; __frames(60); });
    await snap('T3 base in the Extinction Event (red sky, meteors)', 'storm-T3');
    await scene(3, () => {
      for (const s of [0, 1]) for (const k of ['shield', 'strike', 'repair']) game.sides[s].ab[k] = 0;
      for (let i = 0; i < 6; i++) { const e = spawnUnit(game, 0, 'tank', hqPos(0).u + 300 + i * 12, (i % 3 - 1) * 40); e.holdU = e.u; e.holdV = e.v; e.cd = 1e6; }
      game.t = 400; __see();
      const ok = r => { if (!r.ok) throw new Error(r.msg); };
      const tur = game.ents.find(b => b.kind === 'b' && b.side === 0 && b.type === 'turret'), hab = game.ents.find(b => b.kind === 'b' && b.side === 0 && b.type === 'techlab');
      ok(useAbility(game, 0, 'shield', hqPos(0).u + 330, 0)); ok(useAbility(game, 0, 'repair', hab.u, hab.v)); ok(useAbility(game, 1, 'strike', tur.u, tur.v));
      __frames(20);
    });
    await snap('T3 base with a shield bubble, a repair zone and an incoming strike ring', 'abilities-T3');
    await scene(2, () => { // enemy ghosts: last seen at T2, upgraded to T3 out of sight
      update(game, 1 / 30); updateVision(game);
      const F = game.fog[0]; for (const b of game.ents) if (b.kind === 'b' && b.side === 1) { F.ghosts[b.id] = ghostOf(b); b.tier = 3; }
      F.vis.fill(0); for (let i = 0; i < FOG_N; i++) F.exp[i] = 1;
      window.__see = () => {}; __cam(1); __frames(3, false);
    });
    await snap('Enemy base under fog: ghosts show the last-seen tier (T2; really T3 now)', 'ghosts');
    await scene(3, () => { const t = game.ents.find(b => b.kind === 'b' && b.side === 0 && b.type === 'turret'); openPanel(t); __frames(3); });
    await snap('T3 Turret selected: building panel beside the ability buttons');
    if (errors.length) console.log('ERRORS', errors);
  } finally {
    const sheet = await browser.newPage({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 1 });
    await sheet.setContent(`<style>body{margin:0;background:#0b0f18;color:#cfd8e6;font:600 15px system-ui;display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:8px}figure{margin:0}img{width:100%;display:block}figcaption{padding:3px 0}</style>
      ${shots.map(s => `<figure><figcaption>${s.label}</figcaption><img src="data:image/png;base64,${s.img}"></figure>`).join('')}`);
    const f = path.join(outDir, `${tag}-ingame-${res}.png`);
    await sheet.screenshot({ path: f, fullPage: true }); console.log(f);
    await browser.close();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
