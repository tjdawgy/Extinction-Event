/* ---------- Menus ---------- */
function overlay(html) { $('box').className = 'box'; $('box').innerHTML = html; $('ov').classList.remove('hide'); $('box').scrollTop = 0; } // each screen starts at its top (set once shown: a hidden box ignores it)
function hideOverlay() { $('ov').classList.add('hide'); }
function diffSeg() {
  return `<div class="seg" id="diffSeg">${Object.keys(DIFF).map(k => `<button data-d="${k}" class="${k === diffKey ? 'on' : ''}">${DIFF[k].label}</button>`).join('')}</div>`;
}
function facSeg(id, who) {
  return `<div class="seg" id="${id}">${FAC_PICKS.map(k => `<button data-f="${k}" class="${facPick[who] === k ? 'on' : ''}">${k === 'random' ? 'Random' : factionName(k)}</button>`).join('')}</div>`;
}
function wireFactions() {
  for (const [id, who] of [['meSeg', 'me'], ['foeSeg', 'foe']]) for (const b of $(id).children) b.addEventListener('click', () => {
    facPick[who] = b.dataset.f;
    try { localStorage.setItem(FACTION_KEY, JSON.stringify(facPick)); } catch (e) {}
    for (const x of $(id).children) x.classList.toggle('on', x === b);
    if (who === 'me' && $('facDesc')) $('facDesc').textContent = factionDesc(b.dataset.f);
  });
}
const pickFaction = k => k === 'random' ? FACTION_KEYS[Math.floor(Math.random() * FACTION_KEYS.length)] : facOf(k);
function wireSound() { $('bSound').addEventListener('click', () => { sndSet(!SND.on); $('bSound').textContent = sndLabel(); }); }
function wireDiff() {
  for (const b of $('diffSeg').children) b.addEventListener('click', () => {
    diffKey = b.dataset.d;
    try { localStorage.setItem('colonyMobile.diff', diffKey); } catch (e) {}
    for (const x of $('diffSeg').children) x.classList.toggle('on', x === b);
  });
}
const SAVE_KEY = 'colonyMobile.save';
function saveGame() {
  if (!game || game.over || game.spectate || game.tut) return; // a spectated match is never saved over the player's (v2.46: nor a tutorial match)
  try { localStorage.setItem(SAVE_KEY, serialize(game, { camX: cam.x, speed })); } catch (e) {}
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
function peekSave() {
  try { const s = localStorage.getItem(SAVE_KEY); if (!s) return null; const o = JSON.parse(s); const m = (o && o.map) || { id: 'classic', v: 1 }; return o && SAVE_OK.includes(o.v) && MAPS[m.id] && MAPS[m.id].v === m.v ? { t: o.t, diffKey: o.diffKey, map: m.id } : null; } catch (e) { return null; } // v2.65: and its map
}
function showStart() {
  tutOff(); // v2.46
  document.body.classList.remove('spectate'); // v2.38
  clearTimeout(endTimer); endTimer = null; endAim(); $('abil').classList.add('hide'); $('ext').classList.add('hide'); document.body.classList.remove('ext-on');
  running = false; paused = false; game = null; closePanel(); hideInfo(); hideCountdown(); applyZoom(1);
  const sv = peekSave();
  overlay(`<span class="ver">v${VERSION}</span><h1>Extinction <span>Event</span></h1>
    <p>Pick a side, grow an outpost, field an army and destroy the enemy HQ before it destroys yours.</p>
    <div class="how">
      <div><b>Build and upgrade</b>Tap an empty pad then a building card, or just tap a card. Tap a building to upgrade, repair or sell it. Hold any card for details.</div>
      <div><b>Control the field</b>Ground troops standing on a field node capture it for extra income. Your HQ is shielded while a production building stands in your base.</div>
      <div><b>Command your army</b>Attack pushes forward, Hold stops everyone where they stand, Retreat pulls back to your flag without firing. Drag sideways to look around.</div>
    </div>
    <div class="setup"><span class="lbl">Difficulty</span>${diffSeg()}<span class="lbl">You</span>${facSeg('meSeg', 'me')}<span class="lbl">Opponent</span>${facSeg('foeSeg', 'foe')}<p class="fdesc" id="facDesc">${factionDesc(facPick.me)}</p></div>
    <div class="row">${sv ? `<button class="big" id="bResume">Resume match</button><button class="ghost" id="bPlay">New match</button><span class="lbl">${DIFF[sv.diffKey] ? DIFF[sv.diffKey].label : ''}${sv.map !== 'classic' ? ', ' + cxEsc(MAPS[sv.map].display.name) : ''}, ${fmtTime(sv.t)} in</span>` : '<button class="big" id="bPlay">Start match</button>'}<button class="ghost" id="bCodex">Codex</button><button class="ghost" id="bSound">${sndLabel()}</button></div>`);
  wireDiff(); wireFactions(); wireSound();
  $('bCodex').addEventListener('click', () => openCodex(CX.tab));
  $('bPlay').addEventListener('click', showMapSelect);
  if (sv) $('bResume').addEventListener('click', resumeGame);
  $('box').querySelector('.ver').addEventListener('click', showDev); // the dev menu (v2.38): tap the version
  if (!TUT.prompted && !tutLoad().seen) tutFirstPrompt(); // v2.46: first launch only
}
/* ---------- Map select (v2.65, docs/TWO_LANE.md) ----------
   Before each new match: one card per map, from its display fields, with a thumbnail the game draws from the map data
   (lanes, blockers, bases, nodes), so it can't disagree with the map. Classic is the default; the choice is remembered. */
const MAP_KEY = 'extinctionEvent.map', MAP_ORDER = ['classic', 'twolane', 'threelane'];
let mapPick = 'classic';
try { const k = localStorage.getItem(MAP_KEY); if (k && MAPS[k] && MAP_ORDER.includes(k)) mapPick = k; } catch (e) {}
function drawMapThumb(cv, m) {
  const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(1, r.width), h = Math.max(1, r.height);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const H = Math.max(m.size.h / 2, 220), pad = 8, k = Math.min((w - 2 * pad) / m.size.w, (h - 2 * pad) / (2 * H)), ox = (w - m.size.w * k) / 2, X = x => ox + x * k, Y = y => h / 2 + y * k;
  const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, m.display.thumb && m.display.thumb.tint || '#24324a'); bg.addColorStop(1, '#0b1220');
  c.fillStyle = bg; rr(c, 0, 0, w, h, 8); c.fill();
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const ln of m.lanes) { c.strokeStyle = 'rgba(190,175,140,0.35)'; c.lineWidth = ln.width * k; c.beginPath(); ln.path.forEach(([x, y], i) => i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y))); c.stroke(); }
  for (const b of m.blockers || []) { c.fillStyle = '#3a4054'; c.strokeStyle = 'rgba(200,210,240,0.35)'; c.lineWidth = 1; c.beginPath(); b.poly.forEach(([x, y], i) => i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y))); c.closePath(); c.fill(); c.stroke(); }
  m.bases.forEach((b, s) => { c.fillStyle = TEAM[s].main; for (const p of b.pads) c.fillRect(X(p[0]) - 1.5, Y(p[1]) - 1.5, 3, 3); c.fillRect(X(b.hq[0]) - 4, Y(b.hq[1]) - 4, 8, 8); });
  for (const n of m.nodes) {
    const x = X(n.at[0]), y = Y(n.at[1]);
    if (n.type === 'watchtower') { c.fillStyle = '#ffd34d'; c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 4, y + 3); c.lineTo(x - 4, y + 3); c.closePath(); c.fill(); }
    else if (n.type === 'forwardPad') { c.strokeStyle = '#9fb3d8'; c.lineWidth = 1.2; for (const p of n.pads) c.strokeRect(X(p[0]) - 2.5, Y(p[1]) - 2.5, 5, 5); }
    else { const r = n.yieldMul > 1 ? 5 : 3.5; c.fillStyle = '#ddd2ff'; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.8, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.8, y); c.closePath(); c.fill(); }
  }
  c.lineCap = 'butt';
}
// v2.72 (battlefield conditions, docs/PHASE1_DESIGNS.md Proposal F): a row of toggles under the map cards (the ones the
// picked map allows) plus Random condition (one of them, chosen at the start); none by default; remembered like the map
// (localStorage extinctionEvent.cond: { on: [keys], random: bool }). The line under the row describes the last one tapped.
const COND_KEY = 'extinctionEvent.cond';
const COND_UI = {
  heavyFog: { name: 'Heavy fog', ico: 'fog', line: () => `Sight ×${COND.heavyFog.sight}; explored ground fades after ${COND.heavyFog.fade} s out of view.` },
  richCenter: { name: 'Rich centre', ico: 'rich', line: () => `The centre node pays ×${COND.richCenter.lanes} (×${COND.richCenter.classic} on Classic).` },
  scarce: { name: 'Scarce', ico: 'scarce', line: () => `Refineries and nodes pay ×${COND.scarce.pay}; you start with ${COND.scarce.start} credits.` },
  meteors: { name: 'Meteors', ico: 'meteor', line: () => `From ${mmss(COND.meteors.from)}, a meteor every ${COND.meteors.every} s: get out of the red circle.` },
  random: { name: 'Random', line: () => 'One condition this map allows, chosen when the match starts.' },
};
let condPick = { on: [], random: false };
try { const c = JSON.parse(localStorage.getItem(COND_KEY) || 'null'); if (c && Array.isArray(c.on)) condPick = { on: c.on.filter(k => COND_KEYS.includes(k)), random: !!c.random }; } catch (e) {}
const condSave = () => { try { localStorage.setItem(COND_KEY, JSON.stringify(condPick)); } catch (e) {} };
function condRow() { // the toggles for the picked map
  const allow = (MAPS[mapPick] || MAPS.classic).conditions || [], box = $('conds'); if (!box) return;
  box.innerHTML = [...allow, 'random'].map(k => `<button data-c="${k}" class="${(k === 'random' ? condPick.random : condPick.on.includes(k) && !condPick.random) ? 'on' : ''}">${COND_UI[k].name}</button>`).join('');
  for (const b of box.children) b.addEventListener('click', () => {
    const k = b.dataset.c;
    if (k === 'random') { condPick.random = !condPick.random; if (condPick.random) condPick.on = []; }
    else { condPick.random = false; condPick.on = condPick.on.includes(k) ? condPick.on.filter(x => x !== k) : [...condPick.on, k]; }
    condSave(); condRow(); $('condLine').textContent = COND_UI[k].line();
  });
  const on = condPick.random ? ['random'] : condPick.on.filter(k => allow.includes(k));
  $('condLine').textContent = on.length ? on.map(k => COND_UI[k].name).join(', ') + ': ' + COND_UI[on[on.length - 1]].line() : 'Conditions: none. Tap one to add it to the match.';
}
function condsForMatch() { // what the match plays with: the picked toggles the map allows, or one at random
  const allow = (MAPS[mapPick] || MAPS.classic).conditions || [];
  if (condPick.random) return allow.length ? [allow[Math.floor(Math.random() * allow.length)]] : [];
  return condPick.on.filter(k => allow.includes(k));
}
function showMapSelect() {
  const card = id => { const m = MAPS[id]; return `<button class="mapc${id === mapPick ? ' on' : ''}" data-m="${id}"><canvas class="mapt"></canvas><b>${cxEsc(m.display.name)}${id === 'classic' ? ' <small>default</small>' : ''}</b><span>${cxEsc(m.display.desc)}</span></button>`; };
  overlay(`<h1>Choose a <span>battlefield</span></h1><div class="maps">${MAP_ORDER.filter(k => MAPS[k]).map(card).join('')}</div>
    <div class="conds" id="conds"></div><p class="condl" id="condLine"></p>
    <div class="row"><button class="big" id="bMapGo">Play ▸</button><button class="ghost" id="bMapBack">Back</button></div>`);
  $('box').classList.add('mapsel');
  const cards = [...document.querySelectorAll('.mapc')];
  for (const b of cards) {
    drawMapThumb(b.querySelector('canvas'), MAPS[b.dataset.m]);
    b.addEventListener('click', () => { mapPick = b.dataset.m; try { localStorage.setItem(MAP_KEY, mapPick); } catch (e) {} for (const x of cards) x.classList.toggle('on', x === b); condRow(); });
  }
  condRow(); // v2.72
  $('bMapGo').addEventListener('click', startGame);
  $('bMapBack').addEventListener('click', showStart);
}
/* ---------- Dev menu: spectate an AI-vs-AI match (v2.38, audit phase 4) ----------
   Behind the version label on the start screen. Each side: faction, AI preset (Default or Legacy) and personality; a
   speed of 1×, 2× or 4×. The spectator sees the whole field; nothing can be built or ordered; the match is never saved
   (the player's save is left alone). Side A plays from the left in blue, side B from the right in red. */
const devPick = { a: { f: 'lastfist', ai: 'default', p: 'random' }, b: { f: 'bloomhost', ai: 'default', p: 'random' }, speed: 2 };
function showDev() {
  const seg = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(([k, n]) => `<button data-k="${k}" class="${k === cur ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  const F = FACTION_KEYS.map(k => [k, factionName(k)]), A = AI_PRESET_KEYS.map(k => [k, AI_PRESETS[k].name]), Pn = [['random', 'Random'], ...PERSONAS.map(k => [k, PERSONA_NAME[k].replace('The ', '')])];
  const side = (w, lbl) => `<span class="lbl">${lbl}</span><div class="dvrow">${seg('dv' + w + 'f', F, devPick[w].f)}${seg('dv' + w + 'a', A, devPick[w].ai)}${seg('dv' + w + 'p', Pn, devPick[w].p)}</div>`;
  overlay(`<span class="ver">v${VERSION}</span><h1>Spectate <small class="dvsub">dev menu: the AI plays both sides</small></h1>
    <div class="setup dev">${side('a', 'Side A (blue)')}${side('b', 'Side B (red)')}<span class="lbl">Speed</span><div class="dvrow">${seg('dvs', [[1, '1×'], [2, '2×'], [4, '4×']], devPick.speed)}<button class="big" id="bSpec">Spectate</button><button class="ghost" id="bDevBack">Back</button></div></div>`);
  for (const [id, set] of [['dvaf', k => devPick.a.f = k], ['dvaa', k => devPick.a.ai = k], ['dvap', k => devPick.a.p = k], ['dvbf', k => devPick.b.f = k], ['dvba', k => devPick.b.ai = k], ['dvbp', k => devPick.b.p = k], ['dvs', k => devPick.speed = +k]])
    for (const b of $(id).children) b.addEventListener('click', () => { set(b.dataset.k); for (const x of $(id).children) x.classList.toggle('on', x === b); });
  $('bSpec').addEventListener('click', startSpectate);
  $('bDevBack').addEventListener('click', showStart);
}
function startSpectate() {
  tutOff();
  clearTimeout(endTimer); endTimer = null;
  const per = p => p === 'random' ? undefined : p;
  game = newGame('hard', { map: MAPS[mapPick] ? mapPick : 'classic', countdown: 0, autoPlayer: true, autoDiff: 'hard', factions: [devPick.a.f, devPick.b.f], autoAi: devPick.a.ai, ai: devPick.b.ai, autoPersona: per(devPick.a.p), persona: per(devPick.b.p) });
  game.spectate = true;
  document.body.classList.add('spectate'); // first: the build tray goes, so the field is sized without it
  buildAbil(); hideCountdown(); camTouched = true; applyZoom(1); resize(); closePanel(); hideInfo(); endAim();
  cam.x = L / 2; cam.vx = 0; clampCam();
  running = true; paused = false; speed = devPick.speed; $('bSpeed').textContent = speed + '×';
  tab = 'army';
  for (const x of document.querySelectorAll('.tabs button')) x.classList.toggle('on', x.dataset.tab === 'army');
  hideOverlay(); buildCards(); refreshUI(true); updateIntro();
  const nm = w => `${factionName(devPick[w].f)} (${AI_PRESETS[devPick[w].ai].name}, ${devPick[w].p === 'random' ? 'random' : PERSONA_NAME[devPick[w].p].replace('The ', '')})`;
  toast(`Spectating: ${nm('a')} vs ${nm('b')}`, 'ok');
}
function resumeGame() {
  tutOff();
  let g = null;
  try { g = deserialize(localStorage.getItem(SAVE_KEY)); } catch (e) { g = null; }
  if (!g) { clearSave(); toast('That save could not be loaded', 'bad'); showStart(); return; }
  clearTimeout(endTimer); endTimer = null;
  game = g; diffKey = g.diffKey; buildAbil();
  hideCountdown(); applyZoom(1);
  resize(); closePanel(); hideInfo();
  if (typeof g.extra.camX === 'number') { cam.x = g.extra.camX; cam.vx = 0; clampCam(); } else homeCamera();
  speed = g.extra.speed || 1; $('bSpeed').textContent = speed + '×';
  running = true; paused = false;
  tab = 'build';
  for (const x of document.querySelectorAll('.tabs button')) x.classList.toggle('on', x.dataset.tab === 'build');
  hideOverlay(); buildCards(); refreshUI(true);
  pauseGame(true); // a restored match waits for the player to tap Resume
}
function startGame() {
  tutOff(); // v2.46: a normal match never carries tutorial state
  document.body.classList.remove('spectate'); // v2.38
  clearTimeout(endTimer); endTimer = null;
  const me = pickFaction(facPick.me), foe = pickFaction(facPick.foe); // the opponent's pick is never shown during the match
  game = newGame(diffKey, { countdown: INTRO_T + COUNTDOWN, factions: [me, foe], map: MAPS[mapPick] ? mapPick : 'classic', cond: condsForMatch() }); // v2.65: the chosen map; v2.72: its conditions
  buildAbil();
  hideCountdown(); camTouched = false;
  resize(); introCamera(0); closePanel();
  running = true; paused = false; speed = 1; $('bSpeed').textContent = '1×';
  tab = 'build';
  for (const x of document.querySelectorAll('.tabs button')) x.classList.toggle('on', x.dataset.tab === 'build');
  hideOverlay(); buildCards(); hideInfo(); endAim();
  saveGame();
  updateIntro(); refreshUI(true);
  if (MAP_LANED) splitTip(); // v2.66: the first Two-Lane match explains squads
  toast(`You command ${factionName(me)}: start with a ${BD(me, 'barracks').name} and a ${BD(me, 'refinery').name}${facOf(me) === 'lastfist' && SALVAGE.pct > 0 ? '. Salvage: kills near your forces return credits' : ''}`, 'ok');
}
// v2.66 (Split Army): shown once, the first time a player starts a match on a lane map (localStorage extinctionEvent.tips)
const TIPS_KEY = 'extinctionEvent.tips';
function splitTip() {
  let T = {}; try { T = JSON.parse(localStorage.getItem(TIPS_KEY) || '{}') || {}; } catch (e) {}
  const three = MAP.lanes.length > 2, key = three ? 'split3' : 'split'; // v2.70: Three-Lane has its own tip (three squads, crossings)
  if (T[key]) return;
  const el = document.createElement('div'); el.id = 'tipSplit'; el.className = 'tipcard';
  el.innerHTML = three ? `<b>Three lanes, three squads</b><p>Every unit belongs to the squad of its lane: <b>N</b>, <b>C</b> or <b>S</b> in the Army tab (or tap a badge on the minimap). With a squad selected, the orders, Regroup and Rally act on that squad only; <b>All</b> commands everyone. The walls between the lanes have one gap each, at the centre node: squads can cross there.</p><p><b>Long-press</b> a squad to move it to another lane or choose where new units go (alternating by default). Long-press a unit to send every unit of that type to one lane.</p><button id="bTipOk">Got it</button>` : `<b>Two lanes, two squads</b><p>Every unit belongs to the squad of its lane: <b>N</b> or <b>S</b> in the Army tab (or tap a badge on the minimap). With a squad selected, Hold, Attack, Retreat, Regroup and Rally act on that squad only; <b>All</b> commands everyone.</p><p><b>Long-press</b> a squad to move it to the other lane or choose where new units go (alternating by default). Long-press a unit to send every unit of that type to one lane.</p><button id="bTipOk">Got it</button>`;
  document.body.appendChild(el);
  $('bTipOk').addEventListener('click', () => { T[key] = 1; try { localStorage.setItem(TIPS_KEY, JSON.stringify(T)); } catch (e) {} el.remove(); });
}
function pauseGame(restored) {
  paused = true; endAim(); saveGame();
  if (game.tut) { // v2.46: the tutorial's pause menu
    overlay(`<h1>Paused</h1><p>Tutorial: ${cxEsc(TUT_CH[TUT.ch] ? TUT_CH[TUT.ch].name : '')}</p><div class="row"><button class="big" id="bRes">Resume</button><button class="ghost" id="bEndTut">End Tutorial</button><button class="ghost" id="bCodex">Codex</button><button class="ghost" id="bSound">${sndLabel()}</button></div>`);
    wireSound();
    $('bRes').addEventListener('click', () => { paused = false; hideOverlay(); });
    $('bEndTut').addEventListener('click', () => tutEnd());
    $('bCodex').addEventListener('click', () => openCodex(game.sides[0].faction));
    return;
  }
  overlay(`<h1>${restored === true ? 'Match restored' : 'Paused'}</h1><p>${DIFF[game.diffKey].label} match, ${fmtTime(game.t)} elapsed.</p>
    <div class="row"><button class="big" id="bRes">Resume</button><button class="ghost" id="bRe">Restart</button><button class="ghost" id="bMenu">Main menu</button><button class="ghost" id="bCodex">Codex</button><button class="ghost" id="bSound">${sndLabel()}</button></div>`);
  wireSound();
  $('bCodex').addEventListener('click', () => openCodex(game ? game.sides[0].faction : CX.tab));
  $('bRes').addEventListener('click', () => { paused = false; hideOverlay(); });
  $('bRe').addEventListener('click', startGame);
  $('bMenu').addEventListener('click', showStart);
}
function fmtTime(t) { t = Math.floor(t); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }
// Post-match report (v2.9): built from the match log, which the UI reads only now that the match is over.
// The enemy's moves and stats are revealed here (never during play).
const REP_TABS = ['Overview', 'Economy', 'Army', 'Enemy Timeline']; // v2.52 (Phase 0 item 5): replaces Summary, Timeline, Key moments and Stats
let repTab = 'Overview';
function showEnd() {
  const g = game, win = g.winner === 0, R = g.result || { how: 'hq' }, L = g.log;
  const title = R.how === 'draw' ? 'Draw' : win ? 'Victory' : 'Defeat'; // v2.48: an ending the storm decides is a draw for both sides
  const how = R.how === 'draw' ? (R.reason === 'storm' ? 'A Command HQ fell to the Extinction Event: the storm decided it, not the battle.' : R.reason === 'limit' ? 'The Extinction Event reached its peak with both commands still standing.' : R.reason === 'both' && R.by === 'storm' ? 'Both Command HQs fell in the Extinction Event.' : 'Both commands fell and nothing could separate them.')
    : R.how === 'score' ? `${win ? 'Survived the Extinction Event' : 'Lost to the Extinction Event'}: ${R.reason === 'limit' ? 'the storm reached its peak' : 'both Command HQs fell together'}, and the stronger side remains.`
    : R.how === 'storm' ? (win ? 'The enemy base fell to the Extinction Event.' : 'Your Command HQ fell to the Extinction Event.')
    : win ? 'The enemy Command HQ has fallen.' : 'Your Command HQ was destroyed.';
  const flavor = R.how === 'draw' ? 'Nobody won. Nothing survives.'
    : win ? (R.how === 'storm' ? 'You won. Outlasted the extinction.' : R.how === 'score' ? 'You won. Barely. Live to die another day.' : 'You won. Live to die another day.')
    : R.how === 'storm' ? 'You lost. The extinction came for you first.' : 'You lost. Your colony went extinct.';
  const line = `${how} <span class="flav">${flavor}</span>`;
  const persona = PERSONA_NAME[(g.sides[1].persona || {}).kind] || 'an unknown commander';
  closePanel(); repTab = 'Overview';
  overlay(`<div class="top"><h1 class="${R.how === 'draw' ? 'draw' : win ? 'win' : 'lose'}">${title}</h1><div class="seg rtabs" id="repTabs">${REP_TABS.map(t => `<button data-t="${t}">${t}</button>`).join('')}</div></div>
    <p class="sub">${line} <b>${fmtTime(g.t)}</b> · ${(DIFF[g.diffKey] || DIFF.normal).label} · You faced <b>${persona}</b> · ${factionName(g.sides[0].faction)} vs ${factionName(g.sides[1].faction)}</p>
    <div class="pane" id="repPane"></div>
    <div class="foot"><button class="big" id="bAgain">Play again</button><button class="ghost" id="bMenu2">Main menu</button><span style="flex:1"></span>${diffSeg()}</div>`);
  $('box').classList.add('rep');
  for (const b of $('repTabs').children) b.addEventListener('click', () => repShow(b.dataset.t));
  repShow('Overview');
  wireDiff();
  $('bAgain').addEventListener('click', startGame);
  $('bMenu2').addEventListener('click', showStart);
}
function repShow(tab) {
  repTab = tab;
  const cp = $('box').querySelector('.cpy'); if (cp) cp.remove();
  for (const b of $('repTabs').children) b.classList.toggle('on', b.dataset.t === tab);
  const pane = $('repPane'), g = game;
  pane.innerHTML = !g.log ? '<p class="note">This match was not recorded.</p>' : tab === 'Overview' ? repOverview(g) : tab === 'Economy' ? repEconomy(g) : tab === 'Army' ? repArmy(g) : repEnemy(g);
  pane.scrollTop = 0;
  if (tab === 'Overview' && g.log) $('bCopy').addEventListener('click', repCopy);
  if (tab === 'Economy') repGraphs(g);
}
const fmtN = n => Math.round(n).toLocaleString('en');
const repFrom = L => L.from > 0 ? `<p class="note">Recorded from ${mmss(L.from)} (this match was resumed from an older save); earlier events are not included.</p>` : '';
function repSummary(g) {
  const L = g.log, T = L.tot, R = g.result || {}, sum = o => Object.values(o).reduce((a, b) => a + b, 0), sp = (t, i) => Object.values(t.spent).reduce((a, b) => a + b[i], 0);
  const units = t => { const ks = Object.keys(UDEF).filter(k => t.trained[k] || t.lost[k]); return `${sum(t.trained)} (${sum(t.lost)})${ks.length ? ': ' + ks.map(k => `${UDEF[k].name} ${t.trained[k] || 0} (${t.lost[k] || 0})`).join(', ') : ''}`; };
  const blds = t => `${sum(t.bBuilt)} · ${t.bUp} · ${sum(t.bLost)}${sum(t.bLost) ? ` (${Object.keys(t.bLost).map(k => `${logBName(g, T.indexOf(t), k)}${t.bLost[k] > 1 ? ' ×' + t.bLost[k] : ''}`).join(', ')})` : ''}${t.bSold ? ` · ${t.bSold} sold` : ''}`;
  const ABT = { strike: a => `Strike ×${a[0]}: ${fmtN(a[1])} damage, ${a[2]} destroyed`, shield: a => `Shield ×${a[0]}: ${fmtN(a[1])} blocked`, repair: a => `Repair ×${a[0]}: ${fmtN(a[1])} HP`,
    frenzy: a => `Frenzy ×${a[0]}: ${fmtN(a[1])} organisms`, brood: a => `Brood ×${a[0]}: ${fmtN(a[1])} Skitterlings`, corrosive: a => `Corrosive ×${a[0]}: ${fmtN(a[1])} damage, ${a[2]} destroyed`, // v2.20: Bloomhost's too
    mwarp: a => `Mass Warp ×${a[0]}: ${fmtN(a[1])} units`, overcharge: a => `Overcharge ×${a[0]}: ${fmtN(a[1])} blocked, ${fmtN(a[2])} shields`, beam: a => `Beam ×${a[0]}: ${fmtN(a[1])} damage, ${a[2]} destroyed` }; // v2.28: the Axiarchs'
  const abil = t => Object.keys(ABT).filter(k => t.ab[k] && t.ab[k][0]).map(k => ABT[k](t.ab[k])).join(' · ') || 'none';
  const PATHS = [0, 1].map(s => [...new Set(L.ev.filter(e => e[2] === 'U' && e[1] === s && e[6] && treeOf(g.sides[s].faction, e[3])).map(e => `${logBName(g, s, e[3])}: ${treeOf(g.sides[s].faction, e[3])[e[6]].name}`))].join(', ')); // from the recorded path choices
  const row = (h, f) => `<tr><th>${h}</th><td>${f(T[0])}</td><td class="e">${f(T[1])}</td></tr>`;
  const att = L.ev.filter(e => e[2] === 'G' && e[1] === 1), real = att.filter(e => !e[4]), aiLog = g.sides[1].aiLog || {};
  const behave = [`${real.length} attack${real.length === 1 ? '' : 's'}${real.length ? ` (first at ${mmss(real[0][0])})` : ''}`, `${att.length - real.length} feint${att.length - real.length === 1 ? '' : 's'}`,
    `${T[1].bBuilt.turret || 0} ${logBName(g, 1, 'turret')}${T[1].bBuilt.turret === 1 ? '' : 's'} built`, ...(T[1].micro ? [`Artillery pulled back ${T[1].micro} time${T[1].micro === 1 ? '' : 's'}`] : []), aiLog.firstUpgrade != null ? `first upgrade at ${mmss(aiLog.firstUpgrade)}` : 'no upgrades'].join(' · ');
  const ext = L.ev.some(e => e[2] === 'X') ? `Reached at 20:00${R.how === 'storm' || R.how === 'score' || R.how === 'draw' ? '; it decided the match' : ''}` : `Not reached (the match ended at ${mmss(g.t)})`;
  const score = R.score ? `<p class="note">Remaining strength (buildings + army): <b>you ${R.score[0].toLocaleString('en')}</b> · enemy ${R.score[1].toLocaleString('en')}${R.by === 'storm' ? ' (for the record: the Extinction Event makes it a draw)' : R.by !== 'score' ? ` (decided by ${R.by})` : ''}</p>` : '';
  return `${score}<table><tr><th></th><td><b>You</b></td><td class="e"><b>Enemy</b></td></tr>
    ${row('Faction', t => factionName(g.sides[T.indexOf(t)].faction))}
    ${row('Credits gathered / spent', t => `${fmtN(logGathered(L, t, 0))} / ${fmtN(sp(t, 0))}${t.sold[0] ? ` (${fmtN(t.sold[0])} from sales)` : ''}`)}
    ${row('Energy gathered / spent', t => `${fmtN(logGathered(L, t, 1))} / ${fmtN(sp(t, 1))}`)}
    ${row('Salvage', t => facOf(g.sides[T.indexOf(t)].faction) === 'lastfist' ? `${fmtN(t.salv || 0)} credits${t.salvE ? `, ${fmtN(Math.round(t.salvE))} energy` : ''}` : '–')}
    ${row('Units built (lost)', units)}
    ${row('Enemy units destroyed', t => fmtN(sum(t.killed)))}
    ${row('Buildings built · upgraded · lost', blds)}
    ${row('Upgrade paths taken', t => PATHS[T.indexOf(t)] || '–')}
    ${row('Field nodes', t => `${t.nodeCap} captured, ${t.nodeLost} lost · held ${mmss(t.nodeTime)}`)}
    ${row('Abilities', abil)}
    ${row('Storm damage taken', t => fmtN(t.storm))}
    <tr><th>Extinction Event</th><td colspan="2">${ext}</td></tr>
    <tr><th>Enemy behavior</th><td colspan="2">${behave}</td></tr></table>
    <p class="note">Enemy numbers are revealed after the match; during play you saw only what your units could see. Node time adds up all three nodes. Gathered counts the ${START_RES.c} credits and ${START_RES.e} energy each side starts with, income, sales and Salvage.</p>${repFrom(L)}`;
}
