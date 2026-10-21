// Headless-Chromium helpers shared by the browser test and the screenshot tool.
// The page is loaded with env(safe-area-inset-*) replaced by fixed values, so an
// iPhone in landscape (inside the Claude viewer) can be reproduced on any machine.
const fs = require('fs');
const path = require('path');
const { HTML_PATH } = require('./load-sim');

function findPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try { return require(path.join(require('child_process').execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(), 'playwright')); } catch (e) {}
  return null;
}

// iPhone landscape in points, with the viewer's top strip as the top inset
const PHONE = { width: 858, height: 396, insets: { top: 72, bottom: 21, left: 54, right: 54 } };
const NARROW = { width: 667, height: 375, insets: { top: 72, bottom: 21, left: 54, right: 54 } };

function htmlWithInsets(insets) {
  let html = fs.readFileSync(HTML_PATH, 'utf8');
  for (const side of ['top', 'bottom', 'left', 'right']) html = html.split(`env(safe-area-inset-${side},0px)`).join(`${insets[side]}px`);
  return html;
}

async function openPage(browser, device = PHONE) {
  const page = await browser.newPage({ viewport: { width: device.width, height: device.height }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  // Serve the patched page from a file:// URL next to index.html so relative paths behave the same
  await page.route('**/__phone.html', route => route.fulfill({ contentType: 'text/html', body: htmlWithInsets(device.insets) }));
  await page.goto('http://phone.test/__phone.html');
  await page.waitForTimeout(300);
  return { page, errors };
}

module.exports = { findPlaywright, PHONE, NARROW, openPage, htmlWithInsets };
