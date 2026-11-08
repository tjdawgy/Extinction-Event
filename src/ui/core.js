/* =====================================================================
   UI — HUD, cards, building panel, touch input, menus and the main loop.
   ===================================================================== */
const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d'), mm = $('mm'), mctx = mm.getContext('2d');
let game = null, running = false, paused = false, speed = 1, last = 0, tab = 'build', endTimer = null, sel = null, selPad = -1, sellArm = 0, upArm = 0, tapCycle = null;
let diffKey = 'normal';
// Match setup (v2.17): the last faction choices, remembered between visits. 'random' is picked at the start of the match.
const FACTION_KEY = 'extinctionEvent.factions', FAC_PICKS = [...FACTION_KEYS, 'random'];
let facPick = { me: DEFAULT_FACTION, foe: DEFAULT_FACTION };
try { const o = JSON.parse(localStorage.getItem(FACTION_KEY) || 'null'); if (o && FAC_PICKS.includes(o.me) && FAC_PICKS.includes(o.foe)) facPick = { me: o.me, foe: o.foe }; } catch (e) {}
try { diffKey = localStorage.getItem('colonyMobile.diff') || 'normal'; if (!DIFF[diffKey]) diffKey = 'normal'; } catch (e) {}
groundCache = buildGroundCache();
MAP_HOOKS.push(() => { groundCache = buildGroundCache(); if (typeof clampCam === 'function') clampCam(); }); // v2.65: a new map's ground

// Assigning a canvas's width or height clears it, even to the same value, so only touch it on a real change
function fitCanvas(c, w, h) {
  const W = Math.max(1, Math.round(w * V.dpr)), H = Math.max(1, Math.round(h * V.dpr));
  if (c.width === W && c.height === H) return false;
  c.width = W; c.height = H;
  return true;
}
function drawNow() { // redraw straight after a resize so a cleared canvas is never shown
  render(ctx, game, last / 1000, sel, selPad);
  drawMinimapNow();
}
function drawMinimapNow() { if (mm.width > 1) { mctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); drawMinimap(mctx, game, mm.width / V.dpr, mm.height / V.dpr); } }
function resizeMain() {
  const r = cv.getBoundingClientRect(), hud = $('hud').getBoundingClientRect(), tray = $('panel').getBoundingClientRect();
  V.dpr = Math.min(2, window.devicePixelRatio || 1);
  V.cw = r.width; V.ch = r.height;
  V.ft = hud.bottom - r.top; V.fb = tray.top - r.top;
  // Fit the base and battle lanes between the top bar and the card tray
  V.S0 = clamp((V.fb - V.ft) / (Y_BOT - Y_TOP), 0.55, 1.35);
  V.S = V.S0 * V.zoom;
  V.A = V.fb;
  clampCam();
  return fitCanvas(cv, r.width, r.height);
}
function resizeMinimap() { const mr = mm.getBoundingClientRect(); return fitCanvas(mm, mr.width, mr.height); }
function resize() {
  const a = resizeMain(), b = resizeMinimap();
  if (a) drawNow(); else if (b) drawMinimapNow();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 250));
if (window.ResizeObserver) {
  // The minimap changes width whenever top-bar text does (credit digits, HQ status); that must never touch the battlefield canvas
  new ResizeObserver(() => { if (resizeMain()) drawNow(); }).observe($('field'));
  new ResizeObserver(() => { if (resizeMinimap()) drawMinimapNow(); }).observe(mm);
}
function homeX() {
  const hw = V.cw / 2 / V.S0, x0 = UMIN - 40, x1 = UMAX + 40;
  return x1 - x0 < 2 * hw ? (x0 + x1) / 2 : clamp(HQ_U + hw * 0.55 - 60, x0 + hw, x1 - hw);
}
function homeCamera() { cam.x = homeX(); cam.vx = 0; clampCam(); }
function applyZoom(z) { V.zoom = z; V.S = V.S0 * z; clampCam(); }

