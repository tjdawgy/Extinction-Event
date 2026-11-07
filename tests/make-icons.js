// App icons (v2.54, Phase 0 item 7) drawn with the game's own art: the Last Fist Command HQ with a Tank and a Rifleman in
// front, on the night sky and planet of the battlefield. Writes icons/ (192, 512, maskable 512, Apple 180).
//   node tests/make-icons.js [outDir]
const fs = require('fs');
const path = require('path');
const { findPlaywright, PHONE, openPage } = require('./browser-kit');

(async () => {
  const outDir = path.resolve(process.argv[2] || path.join(__dirname, '..', 'icons'));
  const pw = findPlaywright(); if (!pw) { console.error('Playwright is not installed'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const { page, errors } = await openPage(browser, PHONE);
  const out = await page.evaluate(() => {
    const art = (size, safe) => { // safe: the share of the icon the art keeps to (maskable icons are cut to a circle)
      const cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d');
      const bg = c.createLinearGradient(0, 0, 0, size); bg.addColorStop(0, '#0d1838'); bg.addColorStop(0.62, '#0a1024'); bg.addColorStop(1, '#05070f');
      c.fillStyle = bg; c.fillRect(0, 0, size, size);
      // the planet low on the horizon, as in the battlefield sky
      const px = size * 0.72, py = size * 0.3, pr = size * 0.2, pg = c.createRadialGradient(px - pr * 0.35, py - pr * 0.4, pr * 0.1, px, py, pr);
      pg.addColorStop(0, '#9aa8ff'); pg.addColorStop(0.6, '#4b4fb0'); pg.addColorStop(1, '#25265e');
      c.fillStyle = pg; c.beginPath(); c.arc(px, py, pr, 0, 7); c.fill();
      c.strokeStyle = 'rgba(160,140,255,.75)'; c.lineWidth = size * 0.012; c.beginPath(); c.ellipse(px, py, pr * 1.6, pr * 0.42, -0.25, 0, 7); c.stroke();
      for (let i = 0; i < 40; i++) { const r = (i * 9301 + 49297) % 233280 / 233280, q = (i * 4507 + 1201) % 1000 / 1000; c.fillStyle = `rgba(255,255,255,${0.25 + 0.5 * q})`; c.fillRect(r * size, q * size * 0.5, size * 0.004, size * 0.004); }
      // the ground
      const gg = c.createLinearGradient(0, size * 0.62, 0, size); gg.addColorStop(0, '#1b2a2a'); gg.addColorStop(1, '#0b1312');
      c.fillStyle = gg; c.beginPath(); c.moveTo(0, size * 0.66); c.quadraticCurveTo(size / 2, size * 0.6, size, size * 0.66); c.lineTo(size, size); c.lineTo(0, size); c.fill();
      // the game's art, drawn big on a scratch canvas, then fitted into the safe area
      const sc = document.createElement('canvas'), SW = 900, SH = 700; sc.width = SW; sc.height = SH; const k = sc.getContext('2d');
      k.save(); k.translate(SW * 0.5, SH * 0.6); k.scale(3.2, 3.2); drawBOf('lastfist').hq(k, TEAM[0], 1.2, null, 1); k.restore();
      k.save(); k.translate(SW * 0.3, SH * 0.86); k.scale(3.4, 3.4); DRAW_U.tank(k, TEAM[0], { anim: 0, moving: false, recoil: 0, face: 1 }); k.restore();
      k.save(); k.translate(SW * 0.72, SH * 0.9); k.scale(3.6, 3.6); DRAW_U.rifle(k, TEAM[0], { anim: 0, moving: false, recoil: 0, face: 1 }); k.restore();
      const d = k.getImageData(0, 0, SW, SH).data; let x0 = SW, y0 = SH, x1 = -1, y1 = -1;
      for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (d[(y * SW + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1, box = size * safe, s = Math.min(box / bw, box / bh);
      c.imageSmoothingQuality = 'high';
      c.drawImage(sc, x0, y0, bw, bh, (size - bw * s) / 2, size * 0.5 + box / 2 - bh * s + size * 0.04 * safe, bw * s, bh * s);
      return cv.toDataURL('image/png');
    };
    return { i192: art(192, 0.84), i512: art(512, 0.84), mask: art(512, 0.66), apple: art(180, 0.84) };
  });
  const save = (name, url) => fs.writeFileSync(path.join(outDir, name), Buffer.from(url.split(',')[1], 'base64'));
  save('icon-192.png', out.i192); save('icon-512.png', out.i512); save('icon-maskable-512.png', out.mask); save('apple-touch-icon.png', out.apple);
  if (errors.length) console.log('ERRORS', errors);
  console.log('icons written to', outDir);
  await browser.close();
})();
