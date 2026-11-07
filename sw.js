// Extinction Event service worker (v2.54, Phase 0 item 7): offline play for the home-screen app.
// The page (index.html) is network-first: online, every launch gets the newest version and refreshes the cached copy;
// offline, the cached copy plays. Icons, the manifest and the title art are served from the cache and refreshed in the
// background. Only same-origin GET requests are touched. Paths are relative, so it works under a GitHub Pages project
// path (https://<user>.github.io/<repo>/) as well as at a site root.
const CACHE = 'extinction-event-v1';
const CORE = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './assets/title-screen.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (page) { // network first, cached copy offline
    e.respondWith(fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); } return r; })
      .catch(() => caches.match('./index.html', { ignoreSearch: true }).then(r => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => { // cache first, refreshed in the background
    const net = fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
