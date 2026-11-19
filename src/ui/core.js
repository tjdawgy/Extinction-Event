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
  render(ctx, game, last / 1000, sel, selPad); if (typeof drawCtlOverlay === 'function') drawCtlOverlay(ctx);
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
// v2.93 (batch 6c, Part C): the player's side (g.me; 0 = the left start, 1 = the right) and the opponent's. Every UI and render
// read of "the player" goes through these; side numbers that mean a place on the map (dirOf, hqU, gun facing) stay as they are
const myS = () => (game && game.me) | 0, foeS = () => 1 - myS();
// v2.93: the player's and the opponent's team colours as CSS variables (the HQ readout, report legends), refreshed with the teams
let TEAM_CSS = '';
function teamCss() { const k = TEAM[myS()].main + TEAM[foeS()].main; if (k === TEAM_CSS) return; TEAM_CSS = k; const r = document.documentElement.style; r.setProperty('--you', TEAM[myS()].main); r.setProperty('--foe', TEAM[foeS()].main); }
function homeX() {
  const lp = (V.lpad || 0) / V.S0, hw = V.cw / 2 / V.S0, x0 = UMIN - 40 - lp, x1 = UMAX + 40; // v2.74: the base sits right of the army column
  if (myS()) return x1 - x0 < 2 * hw ? (x0 + x1) / 2 : clamp(hqU(1) - hw * 0.55 + 60, x0 + hw, x1 - hw); // v2.93: the right-hand base, looking left into the field
  return x1 - x0 < 2 * hw ? (x0 + x1) / 2 : clamp(HQ_U + hw * 0.55 - 60 - lp * 0.8, x0 + hw, x1 - hw);
}
function homeCamera() { cam.x = homeX(); cam.vx = 0; clampCam(); }
function applyZoom(z) { V.zoom = z; V.S = V.S0 * z; clampCam(); }

