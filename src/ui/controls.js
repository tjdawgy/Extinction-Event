/* ---------- Army controls (v2.74, docs/CONTROLS.md): select units, then command them ----------
   Select: tap a unit (more taps add), double-tap a unit (every unit of its type), hold a moment then draw a loop (lasso),
   All (the whole army), a lane's name (every unit in that lane; v2.76: one tap, and no active lane or base flags any more).
   Only your own units, never enemies or relic guards. Command: tap the ground (move there and hold), or the command bar's
   Attack, Hold, Retreat. The command bar takes the bottom panel's place while anything is selected; the selection clears
   after an order or with the tag's ×. The SIM side is directControl / command (src/sim/control.js). */
const SELN = new Set(); // the selected units' ids
const CT = { hitPx: 26, dbl: 350, lassoMs: 260, lassoMin: 14, lineSel: 22, still: 8, baseOut: 140 };
let ctlMark = null, ctlLoop = null; // ctlLoop: the last lasso, fading out; ctlMark: where the last move order went
const ctlOn = () => !!(game && running && !game.over && !game.spectate && game.sides[0].direct);
const laneName = k => MAP.lanes[k].id[0].toUpperCase() + MAP.lanes[k].id.slice(1);
const myUnits = () => game.ents.filter(e => e.kind === 'u' && e.side === 0 && e.hp > 0);
function selLive() { // the selected units still alive (the dead drop out of the selection)
  const out = myUnits().filter(e => SELN.has(e.id));
  if (out.length !== SELN.size) { SELN.clear(); for (const e of out) SELN.add(e.id); }
  return out;
}
// A unit's body on screen (its middle, aircraft at their height) and its feet
const uScreen = e => { const w = P(e.u, e.v), h = visH(e.type) * US; return { x: (w.x - cam.x) * V.S + V.cw / 2, y: (w.y - e.z - h * 0.45 - YB()) * V.S + V.A, fy: (w.y - YB()) * V.S + V.A }; };
function unitAt(x, y) { // the nearest of your units under a tap: within CT.hitPx of its body or its feet (generous for a thumb)
  let best = null, bd = CT.hitPx;
  for (const e of myUnits()) {
    const p = uScreen(e), d = Math.min(Math.hypot(x - p.x, y - p.y), Math.hypot(x - p.x, y - p.fy));
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
function foeBldAt(x, y) { // an enemy building you can see under a tap (its body, as a tap on your own finds it)
  const w = toWorld(x, y);
  return game.ents.some(b => { if (b.kind !== 'b' || b.side === 0 || b.hp <= 0 || !visibleTo(game, 0, b)) return false; const d = bdOf(b), p = P(b.u, b.v), hw = 2 * d.half * IX * BS + 6; return Math.abs(w.x - p.x) <= hw && w.y >= p.y - (d.half + d.h) * BS - 12 && w.y <= p.y + d.half * BS + 6; });
}
function selSet(list, add) { if (!add) SELN.clear(); for (const e of list) SELN.add(e.id); if (SELN.size) { closePanel(); hideInfo(); endAim(); } refreshCtl(); }
const selAll = () => selSet(myUnits());
const selType = t => selSet(myUnits().filter(e => e.type === t));
// v2.76: the lane a unit is in, from where it stands (the lane's centre line nearest it); in the base (up to CT.baseOut
// beyond the base rally point, where the lanes meet) it is in none, and counts toward All only
const unitLane = e => { if (!MAP_LANED || dirOf(0) * (e.u - ctlBase(0).u) <= CT.baseOut) return null; return laneAt(e.u, e.v); };
const selLane = k => selSet(myUnits().filter(e => unitLane(e) === k), true);
function selClear() { SELN.clear(); refreshCtl(); }
// An order for the selection; it clears afterwards
function issue(o, u, v) {
  if (!ctlOn()) return;
  const ids = selLive().map(e => e.id);
  const r = command(game, 0, ids, o, u, v);
  toast(r.msg, r.ok ? (o === 'attack' ? 'warn' : 'ok') : 'bad');
  if (!r.ok) { shake($('cmdbar')); return; }
  if (o === 'go') ctlMark = { u, v, t: performance.now() };
  TUT.sig[o] = true; // the tutorial waits for these
  SELN.clear(); refreshCtl(); refreshUI(true);
}
// A tap on the battlefield (true: the controls took it). A unit: select it (a second tap within CT.dbl on the same type
// selects every unit of that type). Ground with units selected: move them there. Ground with nothing selected: nothing.
let ctlTap = { t: 0, type: null, x: 0, y: 0 };
function ctlFieldTap(x, y) {
  if (!ctlOn()) return false;
  if (!SELN.size && foeBldAt(x, y)) return false; // a tap on an enemy building selects nothing (not the units fighting beside it)
  const e = unitAt(x, y), now = performance.now();
  if (e) {
    if (ctlTap.type === e.type && now - ctlTap.t < CT.dbl && Math.hypot(x - ctlTap.x, y - ctlTap.y) < 44) { selType(e.type); ctlTap.t = 0; TUT.sig.selType = true; }
    else { selSet([e], true); ctlTap = { t: now, type: e.type, x, y }; }
    return true;
  }
  ctlTap.t = 0;
  if (SELN.size && selLive().length) { const w = toWorld(x, y); issue('go', clamp(w.x, 0, L), w.y / DY); return true; }
  return false;
}
// The lasso: the units whose body is inside the loop (a stroke with almost no area: the units along it)
function lassoSelect(pts) {
  ctlLoop = { pts, t: performance.now() };
  let area = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) area += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  area = Math.abs(area / 2);
  const inside = (x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const segD = (x, y) => { let m = 1e9; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, k = l ? clamp(((x - ax) * dx + (y - ay) * dy) / l, 0, 1) : 0; m = Math.min(m, Math.hypot(x - ax - k * dx, y - ay - k * dy)); } return m; };
  const got = myUnits().filter(e => { const p = uScreen(e); return area > 600 ? inside(p.x, p.y) || inside(p.x, p.fy) : segD(p.x, p.y) <= CT.lineSel; });
  if (!got.length) { toast('No units of yours inside the loop', ''); return; }
  selSet(got, true); TUT.sig.lasso = true;
}
// The left column: All, then one entry per lane (north on top). A tap on a lane selects its units (v2.76: one tap)
function buildLanes() {
  const box = $('lanes'); box.innerHTML = '';
  const n = MAP_LANED ? MAP.lanes.length : 0;
  box.className = `n${n}`;
  const mk = (k, name, aria) => {
    const b = document.createElement('button'); b.dataset.k = k; b.setAttribute('aria-label', aria);
    b.innerHTML = `<b>${name}</b><i>0</i>`;
    b.addEventListener('animationend', () => b.classList.remove('shake'));
    box.appendChild(b); return b;
  };
  mk('all', 'All', 'Select your whole army').addEventListener('click', () => { if (!ctlOn() || paused) return; if (!myUnits().length) { toast('No units yet: train some in the Train tab', 'bad'); return; } selAll(); });
  for (let k = 0; k < n; k++) mk(k, laneName(k), `${laneName(k)} lane: select its units`).addEventListener('click', () => {
    if (!ctlOn() || paused) return;
    if (myUnits().some(e => unitLane(e) === k)) { selLane(k); TUT.sig.selLane = true; } else toast(`No units in the ${MAP.lanes[k].id} lane`, '');
  });
  refreshCtl();
}
function refreshCtl() {
  const box = $('lanes'), bar = $('cmdbar'), on = ctlOn();
  box.classList.toggle('hide', !on); V.lpad = game && !game.spectate && game.sides[0].direct ? 58 : 0; // the column's width: the camera can scroll the field's left edge clear of it
  if (!on) { bar.classList.add('hide'); document.body.classList.remove('selecting'); return; }
  const us = myUnits(), n = MAP_LANED ? MAP.lanes.length : 0, cnt = new Array(n).fill(0);
  for (const e of us) { const k = n ? unitLane(e) : null; if (k != null) cnt[k]++; }
  for (const b of box.children) {
    const k = b.dataset.k === 'all' ? -1 : +b.dataset.k;
    setHTML(b.querySelector('i'), String(k < 0 ? us.length : cnt[k]));
  }
  const sl = selLive(), m = sl.length;
  bar.classList.toggle('hide', !m); document.body.classList.toggle('selecting', !!m);
  if (m) setHTML($('selN'), String(m));
}
for (const b of document.querySelectorAll('#cmdbar [data-c]')) b.addEventListener('click', () => { if (!paused) issue(b.dataset.c); });
$('selX').addEventListener('click', selClear);
$('cmdbar').addEventListener('animationend', () => $('cmdbar').classList.remove('shake'));
// Drawn over the battlefield in screen space: the hold ring before a lasso, the loop being drawn, and where a move went
function drawCtlOverlay(c) {
  if (!game || !ctlOn()) return;
  c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
  const now = performance.now();
  if (gest && gest.armT && !gest.lasso && gest.moved < CT.still) { // a ring fills under the finger: hold on to start a lasso
    const k = clamp((now - gest.t0 - 60) / (CT.lassoMs - 60), 0, 1);
    if (k > 0) { c.strokeStyle = 'rgba(127,227,255,0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(gest.sx, gest.sy, 22, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); c.stroke(); }
  }
  const loop = gest && gest.lasso && gest.lasso.length > 1 ? { pts: gest.lasso, a: 1 } : ctlLoop && now - ctlLoop.t < 600 ? { pts: ctlLoop.pts, a: 1 - (now - ctlLoop.t) / 600 } : null;
  if (loop) { // the loop being drawn, then fading for a moment once let go
    const L_ = loop.pts; c.globalAlpha = loop.a;
    c.beginPath(); c.moveTo(L_[0][0], L_[0][1]); for (const [x, y] of L_) c.lineTo(x, y); c.closePath();
    c.fillStyle = 'rgba(127,227,255,0.12)'; c.fill();
    c.setLineDash([7, 5]); c.strokeStyle = 'rgba(127,227,255,0.95)'; c.lineWidth = 2; c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  }
  if (ctlMark && now - ctlMark.t < 900) {
    const w = P(ctlMark.u, ctlMark.v), x = (w.x - cam.x) * V.S + V.cw / 2, y = (w.y - YB()) * V.S + V.A, k = (now - ctlMark.t) / 900, r = (10 + 16 * k) * Math.max(0.7, V.S);
    c.globalAlpha = 1 - k; c.strokeStyle = '#7fe3ff'; c.lineWidth = 2.2; c.beginPath(); c.ellipse(x, y, r, r * 0.45, 0, 0, 7); c.stroke(); c.globalAlpha = 1;
  }
}
// A new or resumed match: under direct control, nothing selected, the column for its map
function ctlStart() { SELN.clear(); ctlMark = null; ctlLoop = null; if (game && !game.spectate) directControl(game, 0); buildLanes(); }
