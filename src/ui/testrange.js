/* ---------- Test Range (v2.81, docs/FACTION_REWORK.md batch 1) ----------
   A sandbox for watching units fight on the real SIM (the same update, combat, targeting and projectiles as a match; the
   SIM side is src/sim/testrange.js). Opened from the main menu; never saved, never in the stats, the match history or
   anything else a match records (it never ends, so nothing is written at its end either).
   The setup (TR.set): rows (1, or 2-3 for Compare: each row its own game, so units, shots and effects can't cross),
   items (every placed unit and building: row, side, type and the exact spot, in the order placed), each side's mode
   (Attack, Hold), whether red fights back, whether the player commands blue, and the seed. Reset rebuilds every row from
   the items with the same seed, so the same fight plays again tick for tick. Up to TR_MAX setups are saved by name on the
   device (localStorage extinctionEvent.range, in try/catch).
   Screen: the top bar holds Setup, Start/Pause, Reset, Clear, the speed (0.5×, 1×, 2×), the clock and Exit; the bottom
   panel holds what a tap places (tap it for the setup panel) and each side's Attack / Hold; each row has a readout (damage
   dealt, kills, what is left, when a side was wiped out). Tap the field to place; tap a unit or building for its health,
   shields and state, with a Remove button. With "Control blue myself" (one row only) blue takes the game's own controls
   (docs/CONTROLS.md): tap, double-tap, the box, All, groups, tap the ground, tap an enemy, Attack, Hold, Retreat. */
const TR_KEY = 'extinctionEvent.range', TR_MAX = 5, TR_SPEEDS = [0.5, 1, 2], TR_COUNTS = [1, 3, 5, 10];
const TR_PRESETS = [ // one-tap enemy groups (red), every row at once in Compare
  { name: 'Infantry blob', type: 'rifle', n: 10 }, { name: 'Armor', type: 'tank', n: 3 }, { name: 'Swarm', type: 'skitterling', n: 20 },
  { name: 'Elite', type: 'bastion', n: 3 }, { name: 'Air', type: 'aircraft', n: 4 },
];
const TR_WY = [-96, 44]; // the world rows a Compare strip shows (the lane's depth, the units standing on it)
const TR_SIDE = ['Blue', 'Red'];
const trNewSet = () => ({ rows: 1, items: [], nid: 1, modes: ['attack', 'attack'], fight: true, ctl: false, seed: RANGE.seed });
const TR = { on: false, go: false, speed: 1, acc: 0, games: [], set: trNewSet(), tool: null, pick: { side: 0, fac: DEFAULT_FACTION, n: 5, all: false }, info: null, vfx: [], vfxCur: -1, home: null, clrArm: 0 };

// The effects pools (render) belong to one game at a time: each row keeps its own and swaps them in to be drawn
const TR_VFX_KEYS = ['g', 'lastT', 'shake', 'parts', 'np', 'fx', 'nfx', 'decals', 'smokers', 'wrecks', 'nfire', 'flamers', 'rec', 'seenFx', 'warpSeen', 'prevE', 'prevP', 'prevA', 'shots', 'nshots', 'freeRec', 'primed', 'metAcc'];
const trVfxSnap = () => { const o = {}; for (const k of TR_VFX_KEYS) o[k] = VFX[k]; return o; };
const trVfxNew = () => ({ g: null, lastT: -1, shake: 0, np: 0, nfx: 0, nfire: 0, nshots: 0, primed: false, metAcc: 0,
  parts: VFX.parts.map(p => Object.assign({}, p, { life: 0 })), fx: VFX.fx.map(f => Object.assign({}, f)), shots: VFX.shots.map(s => Object.assign({}, s, { e: null })),
  decals: [], smokers: [], wrecks: [], flamers: new Set(), rec: new WeakMap(), seenFx: new WeakSet(), warpSeen: new WeakSet(), prevE: [], prevP: [], prevA: [], freeRec: [] });
function trVfxUse(k) {
  if (TR.vfxCur === k) return;
  if (TR.vfxCur < 0) TR.home = trVfxSnap(); // the match's own pools, put back on leaving
  else TR.vfx[TR.vfxCur] = trVfxSnap();
  Object.assign(VFX, k < 0 ? TR.home : TR.vfx[k] || (TR.vfx[k] = trVfxNew()));
  TR.vfxCur = k;
}

// Rows: each row's factions (the first thing placed on each side), building every row from the items
const trFacs = k => [0, 1].map(s => { const it = TR.set.items.find(i => i.row === k && i.side === s); return it ? (it.kind === 'u' ? rangeFac(it.type) : it.fac) : DEFAULT_FACTION; });
function trBuild() {
  const n = TR.set.rows;
  TR.games = [];
  for (let k = 0; k < n; k++) {
    const g = rangeGame({ seed: TR.set.seed, factions: trFacs(k) });
    for (const it of TR.set.items) if (it.row === k) (it.kind === 'u' ? rangeUnit(g, it.side, it.type, it.u, it.v) : rangeBuilding(g, it.side, it.fac, it.type, it.u, it.v)).trk = it.id;
    for (let s = 0; s < 2; s++) g.sides[s].mode = TR.set.modes[s];
    g.sides[1].hush = !TR.set.fight; g.sides[0].manual = !!TR.set.ctl && n === 1;
    TR.games.push(g);
  }
  game = TR.games[0]; TR.acc = 0; TR.info = null; hideInfo(); document.body.classList.toggle('trcmp', n > 1);
  for (let k = 0; k < TR.vfx.length; k++) if (TR.vfx[k]) TR.vfx[k].g = null; // fresh effects for the new games
  if (TR.vfxCur >= 0) VFX.g = null;
  ctlStart(); trZoom(); trBarUI(); trTopUI();
}
function trOpen() {
  tutOff(); clearTimeout(endTimer); endTimer = null; hideOverlay(); closePanel(); hideInfo(); endAim(); hideCountdown();
  document.body.classList.remove('spectate'); document.body.classList.add('trange');
  TR.on = true; TR.go = false; TR.acc = 0; running = true; paused = false;
  trBuild(); resize();
  cam.x = (RANGE.spot[0] + RANGE.spot[1]) / 2; cam.y = 0; cam.vx = 0; camTouched = true; clampCam();
  if (!TR.set.items.length) trSetup();
  else toast('Test Range: tap Start to watch, Setup to change the fight', 'ok');
}
function trOff() { // leaving (Exit, or anything that goes back to the menu)
  if (!TR.on) return;
  TR.on = false; TR.go = false; TR.games = []; TR.info = null;
  trVfxUse(-1);
  document.body.classList.remove('trange', 'trcmp'); $('trRead').innerHTML = '';
  applyZoom(1);
}

// Placing: TR.tool is what a tap places ({ kind 'u' | 'b', type (a unit type or a building role), fac }), for TR.pick.side
function trPlace(rows, u, v, tool = TR.tool, side = TR.pick.side, n = TR.pick.n) {
  if (!tool) return 0;
  const set = TR.set; let made = 0;
  for (const k of rows) {
    const g = TR.games[k];
    if (!set.items.some(i => i.row === k && i.side === side)) { g.sides[side].faction = tool.fac; g.sides[side].ab = newAb(0, tool.fac); } // a side plays the faction of what is placed on it first
    if (tool.kind === 'u') for (const e of rangeUnits(g, side, tool.type, u, v, n)) { const it = { id: set.nid++, row: k, side, kind: 'u', type: tool.type, u: e.u, v: e.v }; e.trk = it.id; set.items.push(it); made++; }
    else { const b = rangeBuilding(g, side, tool.fac, tool.type, u, v), it = { id: set.nid++, row: k, side, kind: 'b', type: tool.type, fac: tool.fac, u, v }; b.trk = it.id; set.items.push(it); made++; }
    if (TR.go) rangeOrders(g, side);
  }
  return made;
}
const trPl = t => PLURAL[t] || UDEF[t].name + 's';
const trName = t => t.kind === 'u' ? UDEF[t.type].name : BD(t.fac, t.type).name;
const trRows = k => TR.pick.all ? TR.games.map((g, i) => i) : [k];
function trPreset(P) { // red, at red's spot, in every row
  const tool = { kind: 'u', type: P.type, fac: rangeFac(P.type) };
  trPlace(TR.games.map((g, i) => i), RANGE.spot[1], 0, tool, 1, P.n);
  hideOverlay(); toast(`${P.name}: ${P.n} ${P.n > 1 ? trPl(P.type) : UDEF[P.type].name} for red${TR.games.length > 1 ? ' in every row' : ''}`, 'ok');
}
function trCopyRed() { // Compare: red of row 1 into every other row (the same spots), replacing what red had there
  const set = TR.set, src = set.items.filter(i => i.row === 0 && i.side === 1);
  if (!src.length) { toast('Row 1 has no red units to copy', 'bad'); return; }
  set.items = set.items.filter(i => i.row === 0 || i.side !== 1);
  for (let k = 1; k < set.rows; k++) for (const i of src) set.items.push(Object.assign({}, i, { id: set.nid++, row: k }));
  TR.go = false; trBuild(); hideOverlay(); toast(`Red copied into all ${set.rows} rows`, 'ok');
}

// Where things are: each row's strip on screen and its scale (one row: the normal view; Compare: strips top to bottom)
function trView(k) {
  const F = fieldView(), n = TR.games.length || 1;
  if (n === 1) return { S: V.S, A: V.A, y0: F.t, y1: F.b, F };
  const h = (F.b - F.t) / n, y0 = F.t + k * h, y1 = y0 + h, S = h / (TR_WY[1] - TR_WY[0]);
  return { S, A: y1 - (TR_WY[1] - YB()) * S, y0, y1, F };
}
function trZoom() { // Compare: the zoom that fits a strip's rows (so a drag and the camera's limits match what is drawn)
  if (!TR.on) return;
  const n = TR.games.length, z = n > 1 ? trView(0).S / V.S0 : 1;
  if (Math.abs(V.zoom - z) > 1e-3) applyZoom(z);
}
function trRowAt(y) { if (TR.games.length === 1) return 0; for (let k = 0; k < TR.games.length; k++) { const T = trView(k); if (y >= T.y0 && y < T.y1) return k; } return -1; }
const trWorld = (k, x, y) => { const T = trView(k), wy = (y - T.A) / T.S + YB(); return { u: clamp((x - V.cw / 2) / T.S + cam.x, 8, L - 8), v: clamp(wy / DY, -(LANE_V - 6), LANE_V - 6) }; };
const trScreen = (T, e) => { const w = P(e.u, e.v), h = e.kind === 'u' ? visH(e.type) * US : 0; return { x: (w.x - cam.x) * T.S + V.cw / 2, y: (w.y - (e.z || 0) - h * 0.45 - YB()) * T.S + T.A, fy: (w.y - YB()) * T.S + T.A }; };
function trHit(k, x, y) { // the unit or building of either side under a tap in row k
  const g = TR.games[k], T = trView(k), r = TR.games.length > 1 ? 18 : CT.hitPx, wx = (x - V.cw / 2) / T.S + cam.x, wy = (y - T.A) / T.S + YB();
  let best = null, bd = r;
  for (const e of g.ents) {
    if (e.hp <= 0) continue;
    if (e.kind === 'u') { const p = trScreen(T, e), d = Math.min(Math.hypot(x - p.x, y - p.y), Math.hypot(x - p.x, y - p.fy)); if (d < bd) { bd = d; best = e; } }
    else { const d = bdOf(e), p = P(e.u, e.v); if (Math.abs(wx - p.x) <= 2 * d.half * IX * BS + 6 && wy >= p.y - (d.half + d.h) * BS - 12 && wy <= p.y + d.half * BS + 6 && !best) best = e; }
  }
  return best;
}
// A tap on the field (handleTap sends every Test Range tap here)
function trTap(x, y) {
  const k = trRowAt(y); if (k < 0) return;
  const g = TR.games[k];
  if (g.sides[0].manual) { const had = SELN.size; if (ctlFieldTap(x, y)) { if (!had && SELN.size === 1) trInfoOpen(0, [...SELN][0]); return; } } // the game's own controls first
  const e = trHit(k, x, y);
  if (e) { trInfoOpen(k, e.id); return; }
  if (!TR.tool) { toast('Pick something to place: tap Setup', ''); return; }
  const w = trWorld(k, x, y), n = trPlace(trRows(k), w.u, w.v);
  if (n) { sndPlay('built'); trBarUI(); }
}

// The info card: a tapped unit or building's health, shields and state, with Remove
function trInfoOpen(k, id) { TR.info = { k, id }; trInfoFill(true); }
function trState(g, e) {
  const sd = g.sides[e.side], d = e.kind === 'u' ? UDEF[e.type] : null, out = [];
  if (sd.hush) return 'Not fighting back (red holds its fire)';
  if (e.kind === 'b') return `T${e.tier}, ${bdOf(e).gun ? 'its gun fires at enemies in range' : 'no weapon'}`;
  const po = e.po || HOLD_PO, T = po.o === 'target' ? ctlEnt(g, po.id) : null, tg = e.tgt ? g.ents.find(x => x.id === e.tgt) : null;
  out.push(po.o === 'target' ? `attacking ${T && T.hp > 0 ? (T.kind === 'u' ? UDEF[T.type].name : bdOf(T).name) : 'its target'}` : po.o === 'go' ? (po.back ? 'falling back' : 'moving') : po.o === 'retreat' ? 'retreating' : po.o === 'attack' ? 'attacking down the lane' : 'holding');
  if (tg) out.push(`firing at ${tg.kind === 'u' ? UDEF[tg.type].name : bdOf(tg).name}`); else if (e.moving) out.push('on the move');
  if (e.siege) out.push(['', 'planting', 'planted', 'unplanting'][e.siege]);
  if (e.leaping) out.push('leaping');
  if (e.phT > g.t) out.push('phased');
  if (e.slowT > g.t) out.push('slowed');
  if (e.snT > g.t) out.push('snared');
  if (e.frzT > g.t) out.push('frenzied');
  if (e.braceT > g.t) out.push('braced');
  if (e.corrT > g.t) out.push('corroded');
  if (e.temp) out.push(`temporary (${Math.max(0, Math.ceil(e.tLife - g.t))} s)`);
  if (d && !d.weapon) out.push('no weapon');
  return out.join(', ');
}
function trInfoFill(open) {
  const I = TR.info; if (!I) return;
  if (!open && $('info').classList.contains('hide')) { TR.info = null; return; } // closed
  const g = TR.games[I.k], e = g && g.ents.find(x => x.id === I.id);
  if (!e || e.hp <= 0) { if (!open) setHTML($('infoBody'), '<div class="trinf"><span>Destroyed</span></div>'); TR.info = null; return; }
  if (open) {
    const nm = e.kind === 'u' ? UDEF[e.type].name : bdOf(e).name, fac = e.kind === 'u' ? rangeFac(e.type) : e.fac;
    $('infoName').textContent = nm; $('infoSub').textContent = `${TR_SIDE[e.side]} · ${factionName(fac)}${TR.games.length > 1 ? ` · row ${I.k + 1}` : ''}`;
    $('info').classList.remove('hide'); document.body.classList.add('info-open');
  }
  const hp = `${Math.ceil(e.hp)} / ${Math.round(e.maxHp)}`, sh = e.maxShp ? `${Math.ceil(e.shp || 0)} / ${Math.round(e.maxShp)}` : '';
  if (open) { // built once per card, so the Remove button stays put while the numbers change
    $('infoBody').innerHTML = '<div class="trinf"><span><em>Health</em> <b class="hp"></b></span><span class="shw"><em>Shields</em> <b class="sh"></b></span><span class="st"><em>State</em> <i></i></span><button id="trRm" class="trrm">Remove</button></div>';
    $('trRm').addEventListener('click', () => trRemove(I.k, I.id));
  }
  const B = $('infoBody'), q = c => B.querySelector(c); if (!q('.hp')) return;
  setHTML(q('.hp'), hp); setHTML(q('.sh'), sh); q('.shw').style.display = sh ? '' : 'none'; setHTML(q('.st i'), cxEsc(trState(g, e)));
}
function trRemove(k, id) {
  const g = TR.games[k], e = g && g.ents.find(x => x.id === id); if (!e) return;
  rangeRemove(g, e);
  if (e.trk) TR.set.items = TR.set.items.filter(i => i.id !== e.trk);
  SELN.delete(id); TR.info = null; hideInfo(); refreshCtl(); trBarUI();
  toast(`${e.kind === 'u' ? UDEF[e.type].name : bdOf(e).name} removed`, '');
}

// The setup panel
const trSeg = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(([k, n]) => `<button data-k="${k}" class="${String(k) === String(cur) ? 'on' : ''}">${n}</button>`).join('')}</div>`;
function trIcon(cvs, t, side) { // a unit or building as the game draws it, in the side's colour
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = 56, H = 32;
  cvs.width = W * dpr; cvs.height = H * dpr;
  const c = cvs.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  try {
    if (t.kind === 'b') { const d = BD(t.fac, t.type), s = Math.min(54 / (d.half * 3.6), 31 / (d.half * 2 + d.h + 4)); c.translate(W / 2, H - 1 - d.half * s); c.scale(s, s); drawBOf(t.fac)[t.type](c, TEAM[side], 1.2, null, 1); }
    else { const d = UDEF[t.type], s = d.air ? 1.1 : Math.min(1.45, 28 / (visH(t.type) + 4)); c.translate(W / 2, d.air ? H / 2 : H - 2); c.scale(s, s); DRAW_U[t.type](c, TEAM[side], { anim: 0, moving: false, recoil: 0 }); }
  } catch (e) {} // an icon is decoration: a draw function that wants more of a live unit just leaves it blank
}
function trSaved() { try { const o = JSON.parse(localStorage.getItem(TR_KEY) || 'null'); return o && Array.isArray(o.list) ? o.list.filter(x => x && typeof x.name === 'string' && x.set && Array.isArray(x.set.items)) : []; } catch (e) { return []; } }
function trSaveList(list) { try { localStorage.setItem(TR_KEY, JSON.stringify({ list })); return true; } catch (e) { return false; } }
function trSetup() {
  const P = TR.pick, set = TR.set, n = set.rows, cmp = n > 1, fac = P.fac, side = P.side;
  const units = rangeTypes(fac), blds = RANGE_B.filter(r => BD(fac, r)), saved = trSaved();
  const tile = (kind, type, nm) => `<button class="${TR.tool && TR.tool.kind === kind && TR.tool.type === type && TR.tool.fac === fac ? 'on' : ''}" data-kind="${kind}" data-type="${type}"><canvas></canvas><span>${cxEsc(nm)}</span></button>`;
  overlay(`<div class="trhd"><h1>Test <span>Range</span></h1><small>The real game engine: place units, then Start</small><button class="ghost" id="trSX">Done</button></div>
    <div class="trg">
      <span class="lbl">Place for</span><div class="trrow">${trSeg('trPs', [[0, 'Blue'], [1, 'Red']], side)}${trSeg('trPn', TR_COUNTS.map(c => [c, '×' + c]), P.n)}${cmp ? trSeg('trPr', [[0, 'Tapped row'], [1, 'Every row']], P.all ? 1 : 0) : ''}</div>
      <span class="lbl">Faction</span>${trSeg('trPf', FACTION_KEYS.map(k => [k, factionName(k)]), fac)}
      <span class="lbl">Units</span><div class="trunits" id="trU">${units.map(t => tile('u', t, UDEF[t].name)).join('')}</div>
      <span class="lbl">Buildings</span><div class="trunits" id="trB">${blds.map(r => tile('b', r, BD(fac, r).name)).join('')}</div>
      <span class="lbl">Quick enemies</span><div class="trrow" id="trQ">${TR_PRESETS.map((p, i) => `<button class="trq" data-i="${i}">${cxEsc(p.name)}<small>${p.n} ${cxEsc(trPl(p.type))}</small></button>`).join('')}</div>
      <span class="lbl">Battle</span><div class="trrow">
        <span class="trl">Blue</span>${trSeg('trMb', [['attack', 'Attack'], ['hold', 'Hold']], set.modes[0])}
        <span class="trl">Red</span>${trSeg('trMr', [['attack', 'Attack'], ['hold', 'Hold']], set.modes[1])}</div>
      <span class="lbl">Enemies fight back</span><div class="trrow">${trSeg('trFb', [[1, 'On'], [0, 'Off']], set.fight ? 1 : 0)}<small class="trn">Off: red neither moves nor fires, so blue's attack can be studied alone</small></div>
      <span class="lbl">Control blue myself</span><div class="trrow">${trSeg('trCb', [[0, 'Off'], [1, 'On']], set.ctl && !cmp ? 1 : 0)}<small class="trn">${cmp ? 'Not in Compare mode' : 'On: blue takes the game\'s own controls (tap, double-tap, box, All, groups, tap the ground or an enemy, Attack, Hold, Retreat)'}</small></div>
      <span class="lbl">Compare</span><div class="trrow">${trSeg('trCr', [[1, '1 row'], [2, '2 rows'], [3, '3 rows']], n)}${cmp ? '<button class="trq" id="trCp">Copy red to every row</button>' : ''}<small class="trn">Rows that can't touch: the same enemy, a different attacker in each</small></div>
      <span class="lbl">Setups</span><div class="trrow trsv"><input id="trNm" maxlength="24" placeholder="Name this setup" aria-label="Setup name"><button class="trq" id="trSv">Save</button>
        ${saved.map((x, i) => `<span class="trit"><button class="trq" data-load="${i}">${cxEsc(x.name)}</button><button class="trq trdel" data-del="${i}" aria-label="Delete ${cxEsc(x.name)}">×</button></span>`).join('')}<small class="trn">${saved.length}/${TR_MAX} saved on this device</small></div>
    </div>`);
  $('box').classList.add('trs');
  for (const b of document.querySelectorAll('#trU button, #trB button')) {
    const t = { kind: b.dataset.kind, type: b.dataset.type, fac };
    trIcon(b.querySelector('canvas'), t, side);
    b.addEventListener('click', () => { TR.tool = t; hideOverlay(); trBarUI(); toast(`Tap the field to place ${t.kind === 'u' ? P.n + ' × ' : ''}${trName(t)} for ${TR_SIDE[side].toLowerCase()}`, 'ok'); });
  }
  const seg = (id, f) => { const el = $(id); if (el) for (const b of el.children) b.addEventListener('click', () => { for (const x of el.children) x.classList.toggle('on', x === b); f(b.dataset.k); }); };
  seg('trPs', k => { P.side = +k; trSetup(); });
  seg('trPn', k => { P.n = +k; trBarUI(); });
  seg('trPr', k => { P.all = k === '1'; });
  seg('trPf', k => { P.fac = k; trSetup(); });
  seg('trMb', k => trModeSet(0, k));
  seg('trMr', k => trModeSet(1, k));
  seg('trFb', k => trFight(k === '1'));
  seg('trCb', k => { if (cmp) { trSetup(); toast('Control blue myself is off in Compare mode', 'bad'); return; } trCtl(k === '1'); });
  seg('trCr', k => trRowsSet(+k));
  for (const b of document.querySelectorAll('#trQ button')) b.addEventListener('click', () => trPreset(TR_PRESETS[+b.dataset.i]));
  if ($('trCp')) $('trCp').addEventListener('click', trCopyRed);
  $('trSv').addEventListener('click', () => trSave($('trNm').value));
  for (const b of document.querySelectorAll('[data-load]')) b.addEventListener('click', () => trLoad(saved[+b.dataset.load]));
  for (const b of document.querySelectorAll('[data-del]')) b.addEventListener('click', () => { const nm = saved[+b.dataset.del].name; trSaveList(saved.filter((x, i) => i !== +b.dataset.del)); trSetup(); toast(`Deleted ${nm}`, ''); });
  $('trSX').addEventListener('click', hideOverlay);
}
function trModeSet(s, m) { TR.set.modes[s] = m; for (const g of TR.games) rangeMode(g, s, m); trBarUI(); }
function trFight(on) { TR.set.fight = on; for (const g of TR.games) { g.sides[1].hush = !on; if (on) rangeMode(g, 1, TR.set.modes[1]); } trBarUI(); }
function trCtl(on) {
  TR.set.ctl = on; const g = TR.games[0]; g.sides[0].manual = on && TR.games.length === 1;
  ctlStart(); if (!on) rangeMode(g, 0, TR.set.modes[0]);
  hideOverlay(); trBarUI();
  toast(on ? 'You command blue: tap your units, then the ground or an enemy' : 'Blue follows Attack / Hold again', 'ok');
}
function trRowsSet(n) {
  const set = TR.set, gone = set.items.filter(i => i.row >= n).length;
  set.rows = n; set.items = set.items.filter(i => i.row < n);
  if (n > 1) set.ctl = false;
  TR.go = false; trBuild(); trSetup();
  if (gone) toast(`${gone} placed in the rows removed are gone`, '');
}
function trSave(name) {
  name = String(name || '').trim().slice(0, 24); if (!name) { toast('Type a name for the setup first', 'bad'); return; }
  const list = trSaved(), i = list.findIndex(x => x.name === name);
  if (i < 0 && list.length >= TR_MAX) { toast(`${TR_MAX} setups saved: delete one first`, 'bad'); return; }
  const rec = { name, set: JSON.parse(JSON.stringify(TR.set)) };
  if (i >= 0) list[i] = rec; else list.push(rec);
  if (!trSaveList(list)) { toast('This device won\'t store setups', 'bad'); return; }
  trSetup(); toast(`Saved ${name}`, 'ok');
}
function trLoad(x) {
  const s = x && x.set; if (!s || !Array.isArray(s.items)) return;
  const ok = i => i && (i.kind === 'u' ? !!UDEF[i.type] : BDEFS[i.fac] && BD(i.fac, i.type)) && Number.isFinite(i.u) && Number.isFinite(i.v) && i.row >= 0 && i.row < 3 && (i.side === 0 || i.side === 1);
  TR.set = Object.assign(trNewSet(), s, { items: s.items.filter(ok), modes: Array.isArray(s.modes) ? s.modes.slice(0, 2) : ['attack', 'attack'] });
  TR.set.rows = clamp(TR.set.rows | 0, 1, 3); TR.set.items = TR.set.items.filter(i => i.row < TR.set.rows);
  TR.set.nid = Math.max(TR.set.nid | 0, ...TR.set.items.map(i => i.id + 1), 1);
  TR.go = false; trBuild(); hideOverlay(); toast(`Loaded ${x.name}: tap Start`, 'ok');
}

// Top bar and bottom bar
function trTopUI() {
  const go = $('trGo'); go.textContent = TR.go ? 'Pause' : TR.games[0] && TR.games[0].t > 0 ? 'Resume' : 'Start'; go.classList.toggle('run', TR.go);
  go.setAttribute('aria-label', TR.go ? 'Pause the fight' : 'Start the fight');
  $('trSpd').textContent = TR.speed + '×';
  setHTML($('trT'), TR.games[0] ? fmtTime(TR.games[0].t) : '0:00');
}
function trBarUI() {
  const t = TR.tool, s = TR.pick.side;
  setHTML($('trTool'), t ? `<i style="background:${TEAM[s].main}"></i><span><b>${cxEsc(trName(t))}${t.kind === 'u' ? ` ×${TR.pick.n}` : ''}</b><small>${TR_SIDE[s]}: tap the field to place</small></span>` : '<span><b>Setup</b><small>pick what to place</small></span>');
  const man = TR.games[0] && TR.games[0].sides[0].manual;
  for (const [id, s2] of [['trBb', 0], ['trBr', 1]]) {
    const el = $(id); el.classList.toggle('you', s2 === 0 && !!man); el.classList.toggle('calm', s2 === 1 && !TR.set.fight);
    for (const b of el.querySelectorAll('button')) b.classList.toggle('on', b.dataset.m === TR.set.modes[s2]);
  }
}
function trUI() { // every UI refresh: the readouts, the clock, the info card, the army controls
  trTopUI(); trInfoFill(false); refreshCtl();
  const box = $('trRead'), n = TR.games.length;
  while (box.children.length < n) box.appendChild(document.createElement('div'));
  while (box.children.length > n) box.lastChild.remove();
  TR.games.forEach((g, k) => {
    const R = rangeRead(g), T = trView(k), el = box.children[k];
    const who = s => { const c = {}; for (const e of g.ents) if (e.side === s && e.hp > 0) { const nm = e.kind === 'u' ? UDEF[e.type].name : bdOf(e).name; c[nm] = (c[nm] || 0) + 1; } const a = Object.entries(c).sort((x, y) => y[1] - x[1]); return a.length ? a.slice(0, 2).map(([nm, m]) => `${cxEsc(nm)} ×${m}`).join(', ') + (a.length > 2 ? ' …' : '') : 'none'; };
    const w = R.wipe ? ` · <b class="w">${TR_SIDE[R.wipe.side]} wiped out at ${fmtTime(R.wipe.t)}</b>` : '';
    setHTML(el, `${n > 1 ? `<b>Row ${k + 1}</b> ` : ''}<span class="b">${who(0)}</span> vs <span class="r">${who(1)}</span> · damage <span class="b">${txN(Math.round(R.dmg[0]))}</span> / <span class="r">${txN(Math.round(R.dmg[1]))}</span> · kills <span class="b">${R.kills[0]}</span> / <span class="r">${R.kills[1]}</span>${w}`);
    el.style.left = (T.F.l + 6) + 'px'; el.style.top = (n > 1 ? T.y0 + 2 : T.y1 - 20) + 'px'; // one row: the bottom (toasts show at the top); Compare: each strip's top, above its units el.style.maxWidth = (T.F.r - T.F.l - 12) + 'px';
  });
}
function trGoTap() {
  if (!TR.games.some(g => g.ents.length)) { toast('Place some units first: tap Setup', 'bad'); return; }
  if (!TR.go && TR.games.every(g => g.t === 0)) trBuild(); // a first Start plays the setup exactly as Reset will (what was removed leaves no trace)
  TR.go = !TR.go; trTopUI();
}
function trReset() { trBuild(); TR.go = true; trTopUI(); toast('Reset: the same setup, the same seed', 'ok'); }
function trClear() {
  const now = performance.now();
  if (now - TR.clrArm > 2500) { TR.clrArm = now; toast('Tap Clear again to remove everything', 'warn'); return; }
  TR.clrArm = 0; const keep = TR.set; TR.set = Object.assign(trNewSet(), { rows: keep.rows, modes: keep.modes, fight: keep.fight, ctl: keep.ctl });
  TR.go = false; trBuild(); toast('Cleared', '');
}
function trHalt() { TR.go = false; if (TR.on) trTopUI(); } // the page hidden (pauseGame)
$('trSet').addEventListener('click', trSetup);
$('trGo').addEventListener('click', trGoTap);
$('trReset').addEventListener('click', trReset);
$('trClear').addEventListener('click', trClear);
$('trSpd').addEventListener('click', () => { TR.speed = TR_SPEEDS[(TR_SPEEDS.indexOf(TR.speed) + 1) % TR_SPEEDS.length]; trTopUI(); });
$('trExit').addEventListener('click', () => { trOff(); showStart(); });
$('trTool').addEventListener('click', trSetup);
for (const [id, s] of [['trBb', 0], ['trBr', 1]]) for (const b of $(id).querySelectorAll('button')) b.addEventListener('click', () => trModeSet(s, b.dataset.m));

// The frame: step every row together (TICK by TICK, TR.speed of real time), then draw
function trFrame(ts) {
  vfxQuality(ts - last, TR.go);
  const real = Math.min(CATCH_UP, Math.max(0, (ts - last) / 1000)); last = ts;
  const dt = Math.min(0.05, real);
  if (TR.go && $('ov').classList.contains('hide')) { // the setup panel holds the fight
    TR.acc += real * TR.speed;
    while (TR.acc >= TICK) { for (const g of TR.games) rangeStep(g); TR.acc -= TICK; }
  }
  for (const g of TR.games) g.events.length = 0;
  if (!gest && Math.abs(cam.vx) > 5) { cam.x += cam.vx * dt; cam.vx *= Math.pow(0.03, dt); clampCam(); }
  trZoom();
  uiT -= real; if (uiT <= 0) { uiT = 0.15; trUI(); }
  trRender(ts);
}
function trRender(ts) {
  const n = TR.games.length; if (!V.cw || !n) return;
  if (n === 1) { trVfxUse(0); render(ctx, game, ts / 1000, null, -1); drawCtlOverlay(ctx); trMark(ctx, 0); return; }
  const A0 = V.A, S0 = V.S;
  for (let k = 0; k < n; k++) {
    const T = trView(k);
    ctx.save(); ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); ctx.beginPath(); ctx.rect(0, T.y0, V.cw, T.y1 - T.y0); ctx.clip();
    if (k === 0) { ctx.fillStyle = '#060914'; ctx.fillRect(0, 0, V.cw, T.y0); } // above the first strip (behind the top bar)
    trVfxUse(k); V.A = T.A; V.S = T.S;
    render(ctx, TR.games[k], ts / 1000, null, -1);
    V.A = A0; V.S = S0;
    ctx.restore();
    trMark(ctx, k);
  }
  ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); ctx.fillStyle = 'rgba(6,9,20,.9)';
  for (let k = 1; k < n; k++) { const y = trView(k).y0; ctx.fillRect(0, y - 1.5, V.cw, 3); }
  const lt = trView(n - 1); ctx.fillStyle = '#060914'; ctx.fillRect(0, lt.y1, V.cw, V.ch - lt.y1);
}
function trMark(c, k) { // a ring under the unit or building whose card is open
  const I = TR.info; if (!I || I.k !== k) return;
  const g = TR.games[k], e = g && g.ents.find(x => x.id === I.id); if (!e || e.hp <= 0) return;
  const T = trView(k), p = trScreen(T, e), r = (e.kind === 'b' ? e.half * 1.5 : 13) * T.S;
  c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); c.strokeStyle = '#ffe9a8'; c.lineWidth = 2; c.setLineDash([4, 3]);
  c.beginPath(); c.ellipse(p.x, p.fy, Math.max(8, r * 1.3), Math.max(4, r * 0.6), 0, 0, 7); c.stroke(); c.setLineDash([]);
}
