// v2.54 (Phase 0 item 7): installable fullscreen app. The manifest (landscape, fullscreen, theme colors, icons), the Apple
// home-screen tags, and the service worker: served from a project path the way GitHub Pages serves main
// (/<repo>/), the page installs it, and after that it loads and plays with the network off.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { findPlaywright } = require('./browser-kit');
const { readHtml } = require('./load-sim');

const ROOT = path.join(__dirname, '..');
const pw = findPlaywright();
const skip = !pw && 'playwright not installed';

test('manifest.json: name, landscape, fullscreen, theme colors, icons that exist at their stated sizes', () => {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  assert.strictEqual(m.name, 'Extinction Event');
  assert.strictEqual(m.display, 'fullscreen'); assert.strictEqual(m.orientation, 'landscape');
  assert.strictEqual(m.start_url, './'); assert.strictEqual(m.scope, './');
  assert.match(m.theme_color, /^#[0-9a-f]{6}$/i); assert.match(m.background_color, /^#[0-9a-f]{6}$/i);
  const png = f => { const b = fs.readFileSync(path.join(ROOT, f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
  for (const i of m.icons) { const [w, h] = png(i.src); assert.strictEqual(`${w}x${h}`, i.sizes, i.src); }
  assert.ok(m.icons.some(i => i.purpose === 'maskable') && m.icons.some(i => i.sizes === '512x512' && i.purpose === 'any') && m.icons.some(i => i.sizes === '192x192'));
  assert.deepStrictEqual(png('icons/apple-touch-icon.png'), [180, 180]);
  const html = readHtml();
  for (const tag of ['<link rel="manifest" href="manifest.json">', '<meta name="apple-mobile-web-app-capable" content="yes">', '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
    '<meta name="apple-mobile-web-app-title" content="Extinction">', '<link rel="apple-touch-icon" sizes="180x180" href="icons/apple-touch-icon.png">', 'viewport-fit=cover'])
    assert.ok(html.includes(tag), tag);
  // every path the service worker caches exists (a missing one would make its install fail)
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'), core = JSON.parse(sw.match(/const CORE = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  for (const f of core) if (f !== './') assert.ok(fs.existsSync(path.join(ROOT, f)), f);
});

test('served under /Extinction-Event/: the service worker installs, then the game loads and plays offline', { skip }, async () => {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!p.startsWith('/Extinction-Event/')) { res.writeHead(404); return res.end(); }
    p = p.slice('/Extinction-Event/'.length) || 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/Extinction-Event/`;
  const browser = await pw.chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 858, height: 396 } });
    await ctx.addInitScript(() => { try { localStorage.setItem('extinctionEvent.tutorial', '{"seen":1}'); } catch (e) {} });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base);
    await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller === null ? navigator.serviceWorker.ready.then(() => true) : true, null, { timeout: 10000 });
    const reg = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return { scope: r.scope, active: !!r.active }; });
    assert.strictEqual(reg.scope, base); assert.ok(reg.active);
    const manifest = await page.evaluate(async () => { const l = document.querySelector('link[rel=manifest]'); const r = await fetch(l.href); return { ok: r.ok, m: await r.json() }; });
    assert.ok(manifest.ok && manifest.m.display === 'fullscreen');
    await page.reload(); await page.waitForTimeout(300); // now controlled
    assert.ok(await page.evaluate(() => !!navigator.serviceWorker.controller), 'the page is controlled by the service worker');
    await ctx.setOffline(true);
    await page.reload(); await page.waitForTimeout(500);
    const off = await page.evaluate(() => ({ title: document.title, version: typeof VERSION === 'string' ? VERSION : null, icon: [...document.images].length >= 0 }));
    assert.strictEqual(off.title, 'Extinction Event'); assert.ok(off.version, 'the game script ran offline');
    const icon = await page.evaluate(async () => (await fetch('icons/icon-192.png')).ok);
    assert.ok(icon, 'icons from the cache offline');
    await page.evaluate(() => { const t = document.getElementById('title'); if (t) t.remove(); });
    await page.click('#bPlay'); await page.waitForTimeout(300);
    const played = await page.evaluate(() => { game.countdown = 0; for (let i = 0; i < 600; i++) update(game, TICK); return game.t > 9; });
    assert.ok(played, 'a match runs offline');
    assert.deepStrictEqual(errors, []);
    await ctx.close();
  } finally { await browser.close(); server.close(); }
});
