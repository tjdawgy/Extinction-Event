/* ---------- Codex (v2.44): the info pages ----------
   Opened from the main menu and the pause menu (opening it mid-match pauses first, so closing it leaves the paused match as
   it was: the menu underneath is never touched). Tabs: How to Play (CODEX_HOWTO, its own section for the tutorial task),
   then one per faction. Every name, number, cost, tree and unlock is read when a tab is drawn, from the game data
   (FACTIONS, BDEFS, TREE_SETS, UNIT_PATH, UDEF, UNIT_TIPS, ABIL, SALVAGE, CREEP, SHIELD, FIELD): change the data and the
   Codex follows. Pictures come from the game's own draw functions (DRAW_U, drawBOf), drawn once onto small canvases.
   openCodex(tab, item) is the deep link (for the tutorial): tab 'how' or a faction key; item 'building:<role>',
   'tree:<role>', 'unit:<type>', 'stats' or 'mech' (short forms b:, t:, u:). It returns false when the item isn't there. */
const CODEX_HOWTO = { title: 'How to Play', html: () => '' }; // v2.46: html() is the tutorial's chapter list (set in the Tutorial block)
const CX = { open: false, tab: 'how', sort: {} };
const CX_TABS = () => [['how', CODEX_HOWTO.title], ...FACTION_KEYS.map(k => [k, factionName(k)])];
const CX_PROD = ['barracks', 'factory', 'techlab'];
const cxN = v => typeof v !== 'number' ? v : Number.isInteger(v) ? v.toLocaleString('en') : String(+v.toFixed(2));
const cxPct = v => +(v * 100).toFixed(1) + '%';
const cxEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const cxCost = k => !k || (!k.c && !k.e) ? 'Free' : `<i class="dot c"></i>${cxN(k.c)}${k.e ? ` <i class="dot e"></i>${cxN(k.e)}` : ''}`;
const cxLink = (go, txt) => `<button class="cxlink" data-go="${go}">${cxEsc(txt)}</button>`;
const cxArmor = a => ({ light: 'Light', heavy: 'Heavy', vehicle: 'Vehicle', air: 'Air' })[a] || a;
// A faction's buildings: the pad buildings (HQ first, Build tab order), its signature pair, and anything else it has (the bunker)
function cxRoles(fac) {
  const B = BDEFS[fac], main = ['hq', ...BUILD_ORDER.filter(t => B[t] && !B[t].sig)], sig = Object.keys(B).filter(t => B[t].sig);
  return { main, sig, other: Object.keys(B).filter(t => !main.includes(t) && !sig.includes(t)) };
}
// A faction's units: by building (Barracks, Factory, Tech Lab, then the rest), then path, then tier
function cxUnits(fac) {
  const bi = t => { const i = CX_PROD.indexOf(UDEF[t].from); return i < 0 ? 9 : i; }, pi = t => UNIT_PATH[t] ? UNIT_PATH[t].p : '';
  return Object.keys(UDEF).filter(t => (UDEF[t].fac || DEFAULT_FACTION) === fac)
    .sort((a, b) => bi(a) - bi(b) || pi(a).localeCompare(pi(b)) || UDEF[a].tier - UDEF[b].tier || UNIT_ORDER.indexOf(a) - UNIT_ORDER.indexOf(b));
}
// The units a building tier opens without a path (T1 units, or a building without a tree)
const cxTierUnits = (fac, type, t) => cxUnits(fac).filter(u => UDEF[u].from === type && UDEF[u].tier === t && !UNIT_PATH[u] && !UDEF[u].noTrain);
const cxUnitLinks = list => list.length ? `<span class="cxco">Troops: ${list.map(u => cxLink('u:' + u, UDEF[u].name)).join(', ')}</span>` : '';
function cxUnlock(fac, t) {
  const d = UDEF[t], b = BD(fac, d.from), q = UNIT_PATH[t], bl = cxLink((q ? 't:' : 'b:') + d.from, b.name);
  if (d.noTrain || d.spawned) return `Spawned free by the ${bl}${d.tier > 1 ? ` at T${d.tier}` : ''}`;
  if (q) return `${bl} T${d.tier}, ${cxEsc(q.path.name)} path`;
  return `${bl}${d.tier > 1 ? ` T${d.tier}` : ', from the start'}`;
}
const cxMechFacts = {
  lastfist: () => SALVAGE.pct > 0 ? `Now: ${cxPct(SALVAGE.pct)} of the credit cost, for kills within ${SALVAGE.r} of your units or buildings, at most ${SALVAGE.cap} credits a minute.` : 'Salvage is switched off.',
  bloomhost: () => `Now: ${cxPct(CREEP.speed - 1)} faster on creep, and ${cxPct(CREEP.regen)} of max HP healed per second after ${CREEP.calm} s out of combat.`,
  axiarchs: () => `Now: shields recharge ${cxPct(SHIELD.rate)} of max per second after ${SHIELD.delay} s without damage, and ${cxPct(FIELD.regen)} per second inside the power field.`,
};
function cxOverview(fac) {
  const F = FACTIONS[fac], m = F.mech || {};
  return `<h2 id="cx-mech">${cxEsc(F.name)}</h2><p>${cxEsc(F.overview || '')}</p>
    <div class="cxmech"><b>Signature mechanic: ${cxEsc(m.name || '')}</b><p>${cxEsc(m.txt || '')}</p>${cxMechFacts[fac] ? `<p class="cxlive">${cxMechFacts[fac]()}</p>` : ''}</div>` +
    (F.abilities ? `<h3>Commander abilities</h3>` + F.abil.map(k => { const A = ABIL[k]; return `<p class="cxab"><b>${cxEsc(A.name)}</b> (${cxCost(A.cost)}, ${A.cd} s cooldown): ${cxEsc(A.tip || '')}</p>`; }).join('') : '');
}
function cxBuilding(fac, type) {
  const d = BD(fac, type), req = d.req ? BD(fac, d.req) : null;
  const facts = [type === 'hq' ? 'Starts built' : d.noPad ? 'Free' : `Cost ${cxCost(d.cost)}`, `HP <b>${cxN(d.hp)}</b>`, d.shp ? `Shields <b>${cxN(d.shp)}</b>` : '',
    type === 'hq' || d.noPad ? '' : `Build <b>${cxN(d.time)} s</b>`, req ? `Requires ${cxLink('b:' + d.req, req.name)}` : ''].filter(Boolean);
  return `<article class="cxcard" id="cx-b-${type}"><canvas class="cxi" data-k="b" data-f="${fac}" data-t="${type}"></canvas><div class="cxt"><h3>${cxEsc(d.name)}</h3><p>${cxEsc(d.desc || '')}</p><div class="cxfacts">${facts.map(x => `<span>${x}</span>`).join('')}</div></div></article>` + cxTree(fac, type);
}
const cxUpCost = (d, t) => d.up && d.up[t] ? `<span class="cxco">${cxCost(d.up[t])} · ${cxN(d.up[t].time)} s</span>` : '';
// The upgrade tree under a building: T1, then the two paths side by side (a building with a tree), or a T1-T3 chain
function cxTree(fac, type) {
  const d = BD(fac, type), T = treeOf(fac, type), tiers = d.tiers || [];
  const root = `<div class="cxnode"><span class="tg">T1</span>${type === 'hq' ? 'Starting tier' : d.noPad ? 'Placed for free' : 'Built'}<span class="cxco"></span>${cxEsc(tiers[1] || '')}${cxUnitLinks(cxTierUnits(fac, type, 1))}</div>`;
  if (T) return `<div class="cxtree" id="cx-t-${type}">${root}<div class="cxbr">${Object.keys(T).map(p => {
    const P = T[p];
    return `<div class="cxcol"><div class="cxpath">Path ${p}: ${cxEsc(P.name)}</div>${[2, 3].map(t => { const st = P.steps[t] || {};
      return `<div class="cxnode"><span class="tg">T${t}</span><b>${cxEsc(st.short || '')}</b>${cxUpCost(d, t)}${st.unlock ? cxUnitLinks(st.unlock) : cxEsc(st.txt || '')}</div>`; }).join('')}</div>`;
  }).join('')}</div></div>`;
  const src = d.noPad && BDEFS[fac].sigB ? 'sigB' : null; // the bunker follows the Depot's tier
  return `<div class="cxtree" id="cx-t-${type}"><div class="cxchain">${root}${[2, 3].filter(t => tiers[t]).map(t => `<div class="cxnode"><span class="tg">T${t}</span>${d.up && d.up[t] ? 'Upgrade' : src ? `With the ${cxLink('b:' + src, BD(fac, src).name)} at T${t}` : ''}${cxUpCost(d, t)}${cxEsc(tiers[t])}${cxUnitLinks(cxTierUnits(fac, type, t))}</div>`).join('')}</div></div>`;
}
function cxTroop(fac, t) {
  const d = UDEF[t], tip = UNIT_TIPS[t];
  const facts = [`Cost ${cxCost(d.cost)}`, d.pop ? `Army size <b>${fmtPop(d.pop)}</b>` : '', `HP <b>${cxN(d.hp)}</b>`, d.shp ? `Shields <b>${cxN(d.shp)}</b>` : ''].filter(Boolean);
  return `<article class="cxcard" id="cx-u-${t}"><canvas class="cxi u" data-k="u" data-f="${fac}" data-t="${t}"></canvas><div class="cxt"><h3>${cxEsc(d.name)}</h3><p>${cxEsc(d.desc || '')}</p>
    <div class="cxfacts"><span>Unlock: ${cxUnlock(fac, t)}</span>${facts.map(x => `<span>${x}</span>`).join('')}</div>
    ${tip ? `<div class="cxtip"><em>Strong against</em> ${cxEsc(tip[0])}</div><div class="cxtip"><em>Weak against</em> ${cxEsc(tip[1])}</div>` : ''}</div></article>`;
}
// The troop stats table: columns read straight from UDEF; Shields only for a faction whose units have them
const CX_COLS = [
  { k: 'name', h: 'Troop', v: d => d.name, s: true },
  { k: 'hp', h: 'HP', v: d => d.hp },
  { k: 'shp', h: 'Shields', v: d => d.shp || 0, only: us => us.some(t => UDEF[t].shp) },
  { k: 'armor', h: 'Armor', v: d => cxArmor(d.armor), s: true },
  { k: 'dmg', h: 'Damage', v: d => d.weapon ? d.dmg : 0 },
  { k: 'cd', h: 'Attack (s)', v: d => d.weapon ? d.cd : 0, f: v => v ? cxN(v) + ' s' : '–' },
  { k: 'dps', h: 'Dmg/s', v: d => d.weapon ? d.dmg / d.cd : 0, f: v => v ? cxN(Math.round(v * 10) / 10) : '–' },
  { k: 'range', h: 'Range', v: d => d.range, f: (v, d) => v ? cxN(v) + (d.minRange ? ` (min ${d.minRange})` : '') : '–' },
  { k: 'speed', h: 'Speed', v: d => d.speed },
  { k: 'cost', h: 'Cost', v: d => d.cost.c + d.cost.e, f: (v, d) => cxCost(d.cost) },
  { k: 'pop', h: 'Army size', v: d => d.pop, f: v => fmtPop(v) },
  { k: 'time', h: 'Build (s)', v: d => d.time, f: (v, d) => d.noTrain ? 'spawned' : cxN(v) + ' s' },
];
function cxTable(fac) {
  const us = cxUnits(fac), cols = CX_COLS.filter(c => !c.only || c.only(us)), S = CX.sort[fac];
  if (S) { const c = cols.find(x => x.k === S.k); if (c) us.sort((a, b) => { const x = c.v(UDEF[a]), y = c.v(UDEF[b]); return (c.s ? String(x).localeCompare(String(y)) : x - y) * S.dir; }); }
  return `<table class="cxtbl"><thead><tr>${cols.map(c => `<th class="${S && S.k === c.k ? 'on' : ''}"><button data-sort="${c.k}">${c.h}${S && S.k === c.k ? (S.dir > 0 ? ' ▲' : ' ▼') : ''}</button></th>`).join('')}</tr></thead>
    <tbody>${us.map(t => { const d = UDEF[t]; return `<tr data-t="${t}">${cols.map(c => { const v = c.v(d); return `<td>${c.k === 'name' ? cxLink('u:' + t, v) : c.f ? c.f(v, d) : cxEsc(cxN(v))}</td>`; }).join('')}</tr>`; }).join('')}</tbody></table>`;
}
function cxFaction(fac) {
  const R = cxRoles(fac), B = BDEFS[fac];
  return cxOverview(fac) +
    `<h2>Buildings</h2>` + R.main.map(t => cxBuilding(fac, t)).join('') +
    (R.sig.length ? `<h2>Signature buildings</h2><div class="cxnote">${sigPadOn() ? `You choose 1 of these ${R.sig.length} per match, built on your dedicated signature pad (outside the ${SLOT_COUNT} building pads). Only one can stand there at a time.` : `You choose 1 of these ${R.sig.length}: only one can stand at a time.`}</div>` + R.sig.map(t => cxBuilding(fac, t)).join('') : '') +
    R.other.map(t => cxBuilding(fac, t)).join('') +
    `<h2>Troops</h2>` + cxUnits(fac).map(t => cxTroop(fac, t)).join('') +
    `<h2 id="cx-stats">Troop stats</h2><p>Tap a column to sort. Damage is per attack; Attack is the time between attacks.</p><div class="cxtw" id="cxTw">${cxTable(fac)}</div>`;
}
// Pictures: draw with the game's art at a fixed scale onto a scratch canvas, then fit the drawn pixels into the card's canvas
let cxScratch = null;
function cxPic(cvs) {
  const k = cvs.dataset.k, fac = cvs.dataset.f, t = cvs.dataset.t, dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cvs.clientWidth || (k === 'u' ? 72 : 88), H = cvs.clientHeight || (k === 'u' ? 60 : 66);
  cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
  const sc = cxScratch || (cxScratch = document.createElement('canvas')), SW = 480, SH = 360, Z = 2;
  sc.width = SW; sc.height = SH;
  const c = sc.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, SW, SH);
  try {
    if (k === 'b') { c.translate(SW / 2, SH * 0.72); c.scale(Z, Z); drawBOf(fac)[t](c, TEAM[0], 1.2, null, 1); }
    else { c.translate(SW / 2, UDEF[t].air ? SH / 2 : SH * 0.72); c.scale(Z, Z); DRAW_U[t](c, TEAM[0], { anim: 0, moving: false, recoil: 0 }); }
  } catch (e) { cvs.dataset.err = e.message; return false; }
  const px = c.getImageData(0, 0, SW, SH).data;
  let x0 = SW, y0 = SH, x1 = -1, y1 = -1;
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (px[(y * SW + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return false;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, pad = 4 * dpr, s = Math.min((cvs.width - 2 * pad) / bw, (cvs.height - 2 * pad) / bh, dpr * 1.3);
  const o = cvs.getContext('2d'); o.imageSmoothingQuality = 'high';
  o.drawImage(sc, x0, y0, bw, bh, (cvs.width - bw * s) / 2, (cvs.height - bh * s) / 2, bw * s, bh * s);
  return true;
}
function cxShow(tabKey) {
  CX.tab = tabKey;
  for (const b of $('cxTabs').children) { const on = b.dataset.t === tabKey; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }
  $('cxBody').innerHTML = `<div class="cxin">${tabKey === 'how' ? CODEX_HOWTO.html() : cxFaction(tabKey)}</div>`;
  $('cxBody').scrollTop = 0;
  for (const el of $('cxBody').querySelectorAll('canvas.cxi')) cxPic(el);
}
function cxGo(item) {
  const [k, t] = String(item).split(':'), pre = { b: 'cx-b-', building: 'cx-b-', t: 'cx-t-', tree: 'cx-t-', u: 'cx-u-', unit: 'cx-u-', troop: 'cx-u-' }[k];
  const el = k === 'stats' ? $('cx-stats') : k === 'mech' ? $('cx-mech') : pre && t ? $(pre + t) : null;
  if (!el || !$('cxBody').contains(el)) return false;
  const sc = $('cxBody');
  sc.scrollTop += el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 8;
  el.classList.remove('cxhi'); void el.offsetWidth; el.classList.add('cxhi');
  return true;
}
// The deep link: opens the Codex on a tab ('how' or a faction key; another value: the player's faction) and an item
function openCodex(tabKey, item) {
  if (game && running && !paused && !game.over && !game.tut) pauseGame(); // mid-match: pause first; closing leaves the paused match
  if (TUT.on && TUT.cxHold === null) { TUT.cxHold = TUT.hold; TUT.hold = true; } // v2.46: from the tutorial, the match holds still
  $('cxX').textContent = TUT.on ? 'Back to Tutorial' : 'Close';
  hideInfo();
  if (!$('cxTabs').children.length) $('cxTabs').innerHTML = CX_TABS().map(([k, n]) => `<button role="tab" data-t="${k}">${cxEsc(n)}</button>`).join('');
  CX.open = true; $('codex').classList.remove('hide');
  const tk = tabKey === 'how' || FACTIONS[tabKey] ? tabKey : tabKey ? facOf(game ? game.sides[0].faction : tabKey) : CX.tab;
  cxShow(tk);
  return item ? cxGo(item) : true;
}
function closeCodex() {
  CX.open = false; $('codex').classList.add('hide'); $('cxBody').innerHTML = ''; const m = $('cxModal'); if (m) m.remove();
  if (TUT.on && TUT.cxHold !== null) { TUT.hold = TUT.cxHold; TUT.cxHold = null; } // back to the same tutorial step, as it was
}
$('cxX').addEventListener('click', closeCodex);
$('cxTabs').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (b) cxShow(b.dataset.t); });
$('cxBody').addEventListener('click', e => {
  const go = e.target.closest('[data-go]'); if (go) { cxGo(go.dataset.go); return; }
  const tp = e.target.closest('[data-tut]'); if (tp) { tutStart(+tp.dataset.tut); return; } // v2.46: a How to Play chapter
  const so = e.target.closest('[data-sort]'); if (!so) return;
  const fac = CX.tab, S = CX.sort[fac], k = so.dataset.sort, col = CX_COLS.find(c => c.k === k);
  CX.sort[fac] = { k, dir: S && S.k === k ? -S.dir : col.s ? 1 : -1 }; // numbers: largest first; tap again to flip
  const tw = $('cxTw'), x = tw.scrollLeft; tw.innerHTML = cxTable(fac); tw.scrollLeft = x;
});
