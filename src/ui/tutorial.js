/* ---------- Tutorial (v2.46): seven hands-on chapters in a practice match ----------
   Launched from the Codex's How to Play tab (and a first-launch prompt). Each chapter starts its own practice match: the
   player is Last Fist, the enemy AI is switched off (only the tutorial sends units), there is no storm (g.noStorm) and the
   player's HQ never falls. The match is never saved. A step either explains (the match holds still, Next) or waits for an
   action (the match runs; the step advances when the game state shows the action is done; Next appears after
   TUT_FALLBACK seconds). Skip ▸ skips a step, Skip Chapter starts the next chapter, End Tutorial (pause menu) goes back to
   How to Play. Progress and the first-launch flag live in localStorage under TUT_KEY. Every bubble text is in the
   "TUTORIAL TEXT" block below and reads its numbers from the game data (tests/live-text.test.js scans it). */
const TUT_KEY = 'extinctionEvent.tutorial', TUT_FALLBACK = 8;
const tutLoad = () => { try { const o = JSON.parse(localStorage.getItem(TUT_KEY) || 'null'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } };
const tutSave = o => { try { localStorage.setItem(TUT_KEY, JSON.stringify(o)); } catch (e) {} };
const tutDone = () => tutLoad().done || {};
const tutSeen = () => { const o = tutLoad(); o.seen = 1; tutSave(o); };
function tutMark(key) { const o = tutLoad(); o.seen = 1; o.done = Object.assign({}, o.done, { [key]: 1 }); tutSave(o); }
const TUT = { on: false, ch: -1, step: 0, hold: false, waitT: 0, fb: false, sig: {}, cam0: 0, panned: -1, firstUnit: null, upType: null, wave: [], cxHold: null, prompted: false };
// Game-state helpers (player = side 0)
const tMe = () => game.sides[0];
const tMy = type => game.ents.find(e => e.kind === 'b' && e.side === 0 && e.type === type && e.hp > 0);
const tN = t => BD('lastfist', t).name;
function tPlace(type, slot) { const b = mkBuilding(game, 0, type, slot); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; }
function tSquad(type, n, side = 0) { const out = [], u0 = side ? L / 2 + 150 : rallyU(0, game) - 30; /* an enemy wave starts mid-lane */ for (let i = 0; i < n; i++) out.push(spawnUnit(game, side, type, u0 + (side ? 1 : -1) * (i % 3) * 14, ((i % 5) - 2) * 14)); return out; }
// Targets: a DOM element ({ el }) or a rectangle in world space ({ rect }), turned into screen space every frame
const tEl = s => { const el = document.querySelector(s); return el && el.getClientRects().length ? { el } : null; };
const tW2S = (x, y) => ({ x: (x - cam.x) * V.S + V.cw / 2, y: (y - YB()) * V.S + V.A });
const tWorld = (x0, y0, x1, y1) => ({ rect: () => { const a = tW2S(x0, y0), b = tW2S(x1, y1); return { left: a.x, top: a.y, right: b.x, bottom: b.y }; }, u: (x0 + x1) / 2 });
const tB = b => { if (!b) return null; const d = bdOf(b), p = P(b.u, b.v), hw = 2 * d.half * IX * BS + 6; return tWorld(p.x - hw, p.y - (d.half + d.h) * BS - 12, p.x + hw, p.y + d.half * BS + 6); };
const tPad = k => { const p = slotPos(0, k), q = P(p.u, p.v), w = 2 * PAD_H * IX, hh = 2 * PAD_H * IY; return tWorld(q.x - w, q.y - hh, q.x + w, q.y + hh); };
const tPads = () => { const ps = []; for (let k = 0; k < SLOT_COUNT; k++) ps.push(slotPos(0, k)); const q = ps.map(p => P(p.u, p.v)), w = 2 * PAD_H * IX, hh = 2 * PAD_H * IY; return tWorld(Math.min(...q.map(p => p.x)) - w, Math.min(...q.map(p => p.y)) - hh, Math.max(...q.map(p => p.x)) + w, Math.max(...q.map(p => p.y)) + hh); };
const tNode = n => { const q = P(n.u, n.v); return tWorld(q.x - NODE_R, q.y - NODE_R * DY - 24, q.x + NODE_R, q.y + NODE_R * DY); };
const tFlag = () => { const f = ctlBase(0), q = P(f.u, f.v); return tWorld(q.x - 26, q.y - 52, q.x + 34, q.y + 12); }; // v2.76: the base rally point
const tUnits = () => { const us = myUnits(); if (!us.length) return tFlag(); const q = us.map(e => P(e.u, e.v)); return tWorld(Math.min(...q.map(p => p.x)) - 16, Math.min(...q.map(p => p.y)) - 34, Math.max(...q.map(p => p.x)) + 16, Math.max(...q.map(p => p.y)) + 10); }; // v2.74: your troops on the field
const tUnit = () => { const e = myUnits().sort((a, b) => a.id - b.id)[0]; if (!e) return tFlag(); const q = P(e.u, e.v); return tWorld(q.x - 14, q.y - 30, q.x + 14, q.y + 6); }; // v2.74: one of your troops
const tCmd = o => SELN.size && SELN.size === myUnits().length ? tEl(`#cmdbar [data-c="${o}"]`) : tEl('#lanes [data-k="all"]'); // v2.74: a command for the whole army: All first until everyone is selected
const tField = () => ({ rect: () => ({ left: V.cw * 0.3, top: V.ft + 14, right: V.cw * 0.7, bottom: V.ft + 14 + (V.fb - V.ft) * 0.35 }), screen: true }); // a band of open battlefield, small enough to leave room for the bubble
const tCard = t => tab === 'build' && BUILD_ORDER.includes(t) || tab === 'train' && UDEF[t] ? tEl(`#cards .card[data-type="${t}"]`) : tEl(`.tabs [data-tab="${BUILD_ORDER.includes(t) ? 'build' : 'train'}"]`);

/* TUTORIAL TEXT START (no digits in any string here: numbers come from the data) */
const TUT_CH = [
  { key: 'controls', name: 'Controls', blurb: 'Camera, selecting, and moving units',
    setup: () => { tSquad('rifle', 4); },
    steps: [
      { txt: () => `Welcome, Commander. This is a practice match: you can't lose, and the enemy only moves when the tutorial says so. Your base is on the left; the enemy's is far to the right.` },
      { act: true, txt: () => 'Drag the battlefield sideways to look around.', hi: tField, enter: () => { TUT.cam0 = cam.x; }, done: () => Math.abs(cam.x - TUT.cam0) > 120 },
      { act: true, txt: () => 'The overview map in the top bar shows the whole lane. Tap it to jump anywhere.', hi: () => tEl('#mm'), enter: () => { TUT.sig.mm = false; }, done: () => TUT.sig.mm },
      { act: true, txt: () => `Tap your ${tN('hq')} to select it.`, hi: () => tB(tMe().hq), enter: () => homeCamera(), done: () => sel && sel.type === 'hq' },
      { txt: () => 'The panel shows what you selected: its tier, health, and what its next upgrade does. Tap × or empty ground to close it.', hi: () => tEl('#bp') },
      // v2.74 (docs/CONTROLS.md): select, then command
      { act: true, txt: () => `These are your ${PLURAL.rifle}. Tap one to select it: a ring marks it, and the command bar takes the bottom panel's place.`, hi: tUnit, enter: () => { closePanel(); homeCamera(); selClear(); }, done: () => SELN.size > 0 },
      { act: true, txt: () => 'Now tap a spot on open ground. Your selection walks there, holding its fire, and holds the spot.', hi: () => SELN.size ? tField() : tUnit(), enter: () => { TUT.sig.go = false; }, done: () => TUT.sig.go },
      { act: true, txt: () => 'Select several at once: press and hold on the battlefield until the ring fills, then drag a box over your troops.', gesture: 'box', hi: tUnits, enter: () => { selClear(); TUT.sig.box = false; }, done: () => TUT.sig.box },
      { act: true, txt: () => 'Tap a unit, then tap it again right away: every unit of that type on screen is selected.', gesture: 'dbl', hi: tUnit, enter: () => { selClear(); TUT.sig.selType = false; }, done: () => TUT.sig.selType },
      { txt: () => 'The tag shows how many are selected; its × clears them. The selection also clears after every order. With nothing selected, tapping the ground does nothing.', hi: () => tEl('#cmdbar .seltag') },
      { txt: () => 'That\'s the basics: drag to look, select your troops, then tap the ground to move them or give an order.', enter: () => selClear() },
    ] },
  { key: 'economy', name: 'Economy', blurb: 'Credits, energy, Refineries and field nodes',
    setup: () => { tSquad('rifle', 4); tMe().res.c += BDEF.refinery.cost.c; },
    steps: [
      { txt: () => 'Credits and energy pay for everything. The small number under each is your income per second.', hi: () => tEl('#resC') },
      { act: true, txt: () => 'Open the Build tab.', hi: () => tEl('.tabs [data-tab="build"]'), skipIf: () => tab === 'build', done: () => tab === 'build' },
      { act: true, txt: () => `Tap the ${tN('refinery')} card to build one.`, hi: () => tCard('refinery'), done: () => !!tMy('refinery') },
      { txt: () => `Each ${tN('refinery')} adds +${txN(BDEF.refinery.inc[1].c)} credits per second once it's finished, more when upgraded. A ${tN('reactor')} makes energy the same way.`, hi: () => tB(tMy('refinery')),
        enter: () => { if (!tMy('refinery')) tryBuild(game, 0, 'refinery'); } },
      { act: true, txt: () => 'Construction takes a few seconds. Wait for it to finish.', hi: () => tB(tMy('refinery')), done: () => hasBuilt(game, 0, 'refinery') },
      { txt: () => 'Field nodes sit along the lane. Ground troops standing on one capture it for extra income.', hi: () => tNode(game.nodes[0]) },
      { act: true, txt: () => 'Capture this node: tap All on the left to select your troops, then tap the node.', hi: () => SELN.size ? tNode(game.nodes[0]) : tEl('#lanes [data-k="all"]'), done: () => game.nodes[0].owner === 0 },
      { txt: () => `Captured! Every node you hold pays +${txN(NODE_INC.c)} credits and +${txN(NODE_INC.e)} energy per second. Hold more than the enemy and you out-earn them.`, hi: () => tNode(game.nodes[0]) },
    ] },
  { key: 'building', name: 'Building', blurb: 'The pads, the signature pad and the Build tab',
    setup: () => { tMe().res.c += BDEF.barracks.cost.c; },
    steps: [
      { txt: () => `Your base has ${SLOT_COUNT} building pads around the ${tN('hq')}. Every building takes one.`, hi: tPads },
      { act: true, txt: () => 'Tap an empty pad.', hi: () => tPad([7, 5, 6, 2, 3, 0, 1, 4].find(k => !tMe().slots[k])), /* a free pad, nearest the camera first: nothing stands in front of it, and what is built there can't cover the signature pad */ done: () => selPad >= 0 && selPad < SLOT_COUNT },
      { act: true, txt: () => `That pad is now picked. Tap the ${tN('barracks')} card to build there.`, hi: () => tCard('barracks'), done: () => !!tMy('barracks') },
      { txt: () => 'Greyed-out cards are locked or too expensive. Press and hold any card to see its details and what it needs.', hi: () => tEl('#cards') },
      { act: true, txt: () => 'Beyond the pads sits the signature pad. Tap it.', hi: () => tPad(SIG_SLOT), skipIf: () => !sigPadOn() || !SIG.on, enter: () => closePanel(), done: () => selPad === SIG_SLOT },
      { txt: () => `Signature buildings stand only on that pad, one at a time: the ${tN('sigA')} or the ${tN('sigB')}. The Codex explains both.`, hi: () => tEl('#cards .card[data-type="sigA"]'), skipIf: () => !sigPadOn() || !SIG.on },
      { txt: () => 'To build: tap a pad, then a card. Or just tap a card and it takes the first free pad.' },
    ] },
  { key: 'army', name: 'Army', blurb: 'Training troops, selecting, Attack, Hold and Retreat, the rally point and healing, lanes',
    setup: () => { tPlace('barracks', 4); tMe().res.c += UDEF.rifle.cost.c * 2; },
    steps: [
      { act: true, txt: () => `Troops come from production buildings like your ${tN('barracks')}. Open the Train tab.`, hi: () => tEl('.tabs [data-tab="train"]'), done: () => tab === 'train' },
      { act: true, txt: () => `Tap the ${UDEF.rifle.name} card to train one.`, hi: () => tCard('rifle'), done: () => { const b = tMy('barracks'); if (b && b.queue.length && !TUT.firstUnit) TUT.firstUnit = b.queue[0]; return !!TUT.firstUnit || game.ents.some(e => e.kind === 'u' && e.side === 0); } },
      { txt: () => 'New troops gather at the rally point in the middle of your base, each in its own space, and wait there on Hold. Nothing moves until you order it.', hi: tFlag, codex: { label: 'See stats', item: () => 'unit:' + (TUT.firstUnit || 'rifle') },
        enter: () => { const b = tMy('barracks'); if (b && !b.queue.length && !game.ents.some(e => e.kind === 'u' && e.side === 0)) tryTrain(game, 0, 'rifle'); if (!TUT.firstUnit) TUT.firstUnit = 'rifle'; } },
      { act: true, txt: () => `Here comes your ${UDEF[TUT.firstUnit || 'rifle'].name}.`, hi: tFlag, done: () => game.ents.some(e => e.kind === 'u' && e.side === 0 && e.hp > 0 && e.po && e.po.o === 'hold') },
      // v2.74 (docs/CONTROLS.md): select, then command
      { act: true, txt: () => 'Tap All on the left to select your whole army.', hi: () => tEl('#lanes [data-k="all"]'), enter: () => selClear(), done: () => SELN.size > 0 && SELN.size === myUnits().length },
      { act: true, txt: () => 'Tap Attack: they advance down the lane and fight their way to the enemy base.', hi: () => tCmd('attack'), enter: () => { TUT.sig.attack = false; }, done: () => TUT.sig.attack },
      { act: true, txt: () => 'Select them again with All, then tap Hold: they stop and fight anything in range.', hi: () => tCmd('hold'), enter: () => { TUT.sig.hold = false; }, done: () => TUT.sig.hold },
      { txt: () => 'Retreat brings them back to the rally point without firing. Units heal at the rally point, and at repair depots you hold, but only when you move them there: nothing goes home on its own.', hi: tFlag },
      { txt: () => 'On a lane map the column on the left lists each lane with its unit count. Tap a lane to select the units in it.', hi: () => tEl('#lanes') },
    ] },
  { key: 'upgrades', name: 'Upgrades', blurb: 'Upgrade tiers, paths and what they unlock',
    setup: () => { tPlace('barracks', 4); const u = BDEF.barracks.up; tMe().res.c += u[2].c + u[3].c; tMe().res.e += u[2].e + u[3].e; },
    steps: [
      { act: true, txt: () => `Tap your ${tN('barracks')}.`, hi: () => tB(tMy('barracks')), done: () => sel && sel.type === 'barracks' },
      { txt: () => { const T = TREES.barracks; return `At T2 a ${tN('barracks')} picks one of two paths. A, ${T.A.name}: ${T.A.steps[2].short}, then ${T.A.steps[3].short}. B, ${T.B.name}: ${T.B.steps[2].short}, then ${T.B.steps[3].short}.`; },
        hi: () => tEl('#bp'), enter: () => { if (!sel || sel.type !== 'barracks') openPanel(tMy('barracks')); } },
      { act: true, txt: () => 'Tap A or B to choose a path.', hi: () => sel ? tEl('#bpPick') : tB(tMy('barracks')), done: () => !!bpPath || !!(tMy('barracks') || {}).path },
      { act: true, txt: () => 'Tap Upgrade, then tap it again to confirm.', hi: () => sel ? tEl('#bpUp') : tB(tMy('barracks')),
        enter: () => { const b = tMy('barracks'); if (!sel) openPanel(b); if (!bpPath && !b.path) { bpPath = 'A'; refreshPanel(); } },
        done: () => { const b = tMy('barracks'); if (b && (b.upgrading || b.tier >= 2)) { TUT.upType = b.type; return true; } return false; } },
      { txt: () => 'Upgrading takes a little while. When it finishes, the new troops appear on the Train tab. The Codex shows the whole tree.', hi: () => tB(tMy(TUT.upType || 'barracks')),
        codex: { label: 'View in Codex', item: () => 'tree:' + (TUT.upType || 'barracks') } },
      { txt: () => 'Every building upgrades the same way: higher tiers add health, income or firepower. Production buildings choose a path, and a second one can take the other.' },
    ] },
  { key: 'combat', name: 'Combat', blurb: 'A small fight, then destroy the enemy HQ',
    setup: () => { tSquad('tank', 4); tSquad('rifle', 6); },
    steps: [
      { txt: () => 'Enemy troops are on their way. Your army fights anything that comes in range.' },
      { act: true, txt: () => 'Hold your ground and defeat the attack.', hi: tFlag,
        enter: () => { TUT.wave = tSquad('rifle', 4, 1).map(u => u.id); setStance(game, 1, 'attack'); },
        done: () => { const left = game.ents.some(e => e.kind === 'u' && e.side === 1 && e.hp > 0 && TUT.wave.includes(e.id)); if (!left) setStance(game, 1, 'retreat'); return !left; } },
      { act: true, txt: () => 'Now take the fight to them: tap All, then Attack.', hi: () => tCmd('attack'), enter: () => { TUT.sig.attack = false; }, done: () => TUT.sig.attack },
      { act: true, pan: false, txt: () => `Destroy the enemy ${tN('hq')}. It has no other buildings left to shield it.`, hi: () => tB(game.sides[1].hq),
        enter: () => { const idle = myUnits().filter(e => e.po.o !== 'attack').map(e => e.id); if (idle.length) command(game, 0, idle, 'attack'); selClear(); }, done: () => game.sides[1].hq.hp <= 0 || (game.over && game.winner === 0) },
      { txt: () => `Victory! Destroying the enemy ${tN('hq')} wins the match. In a real match it stays shielded while an enemy production building stands in its base.` },
    ] },
  { key: 'factions', name: 'Factions', blurb: 'Last Fist, Bloomhost and Axiarchs',
    setup: () => {},
    steps: [
      { txt: () => 'Before every match you pick a faction. Each one plays very differently and has its own signature mechanic.' },
      ...FACTION_KEYS.map(k => ({ txt: () => { const F = FACTIONS[k]; return `${F.name}: ${F.overview} Signature mechanic, ${F.mech.name}: ${F.mech.txt}`; } })),
      { txt: () => 'The Codex has every building, upgrade and troop for every faction.', codex: { label: 'Open the Codex', item: null, finish: true } },
    ] },
];
/* TUTORIAL TEXT END */

const tCur = () => TUT.on && TUT_CH[TUT.ch] ? TUT_CH[TUT.ch].steps[TUT.step] : null;
// A fresh practice match: Last Fist against Last Fist, no countdown, the enemy AI off, no storm, never saved
function tutMatch() {
  clearTimeout(endTimer); endTimer = null; document.body.classList.remove('spectate');
  game = newGame('normal', { countdown: 0, factions: ['lastfist', 'lastfist'], map: 'classic' }); // v2.65: the tutorial is on Classic
  game.tut = true; game.noStorm = true; game.sides[1].aiT = 1e9;
  buildAbil(); ctlStart(); hideCountdown(); camTouched = false; applyZoom(1); resize(); closePanel(); hideInfo(); endAim(); // v2.74: ctlStart, the new army controls
  running = true; paused = false; speed = 1; $('bSpeed').textContent = '1×';
  tab = 'build'; for (const x of document.querySelectorAll('.tabs button')) x.classList.toggle('on', x.dataset.tab === 'build');
  hideOverlay(); homeCamera(); buildCards(); refreshUI(true);
}
// Start chapter i. During a real match the player is asked first (confirmed: already asked)
function tutStart(i, confirmed) {
  if (game && !game.tut && !game.over && !confirmed) { tutConfirm(i); return; }
  const C = TUT_CH[i]; if (!C) { tutEnd(); return; }
  if (CX.open) closeCodex();
  tutMatch();
  Object.assign(TUT, { on: true, ch: i, step: 0, sig: {}, firstUnit: null, upType: null, wave: [], cxHold: null });
  tutSeen();
  C.setup(game);
  buildCards(); refreshUI(true);
  tutGo(0);
}
function tutGo(k) {
  const C = TUT_CH[TUT.ch], st = C && C.steps[k];
  if (!st) { tutComplete(); return; }
  TUT.step = k;
  if (st.skipIf && st.skipIf(game)) { tutGo(k + 1); return; }
  if (st.enter) st.enter(game);
  Object.assign(TUT, { hold: !st.act, waitT: 0, fb: false, panned: -1 });
  tutRender();
}
const tutNext = () => tutGo(TUT.step + 1);
const tutSkipChapter = () => TUT.ch + 1 < TUT_CH.length ? tutStart(TUT.ch + 1, true) : tutEnd();
function tutComplete() { tutMark(TUT_CH[TUT.ch].key); tutEnd(); }
// Leave the tutorial: back to the main menu with the Codex open on How to Play
function tutEnd(tabKey = 'how', item) { tutOff(); showStart(); openCodex(tabKey, item); }
function tutOff() {
  TUT.on = false; TUT.hold = false; TUT.cxHold = null;
  $('tutB').classList.add('hide'); $('tutHi').classList.add('hide');
}
// "Leave this match and start the tutorial?" over the Codex; Cancel goes back to the paused match as it was
function tutConfirm(i) {
  const m = document.createElement('div');
  m.id = 'cxModal'; m.innerHTML = '<div class="box"><p>Leave this match and start the tutorial?</p><small>Your match is saved: Resume match on the main menu brings it back.</small><div class="row"><button class="big" id="cxYes">Yes</button><button class="ghost" id="cxNo">Cancel</button></div></div>';
  $('codex').appendChild(m);
  $('cxYes').addEventListener('click', () => { m.remove(); tutStart(i, true); });
  $('cxNo').addEventListener('click', () => { m.remove(); closeCodex(); });
}
// The bubble's buttons and text (rebuilt when the step changes or Next appears); placement runs every frame
function tutRender() {
  const st = tCur(); if (!st) return;
  const C = TUT_CH[TUT.ch], n = C.steps.filter(s => !(s.skipIf && s.skipIf(game))).length, k = C.steps.slice(0, TUT.step + 1).filter(s => !(s.skipIf && s.skipIf(game))).length;
  $('tutT').textContent = C.name; $('tutN').textContent = `Step ${k} of ${n}`;
  $('tutX').textContent = st.txt();
  const x = $('tutXtra'); x.innerHTML = '';
  if (st.codex) { const b = document.createElement('button'); b.className = 'cx'; b.id = 'tutCodex'; b.textContent = st.codex.label; b.addEventListener('click', () => tutCodex(st.codex)); x.appendChild(b); }
  $('tutNext').classList.toggle('hide', !!st.act && !TUT.fb);
  $('tutNext').textContent = TUT.step === C.steps.length - 1 ? 'Finish' : 'Next';
  $('tutB').classList.toggle('act', !!st.act);
  $('tutB').classList.remove('hide');
  tutPlace();
}
function tutCodex(c) {
  if (c.finish) { tutMark(TUT_CH[TUT.ch].key); tutEnd('lastfist'); return; }
  TUT.cxHold = TUT.hold; TUT.hold = true; // the match holds still while the Codex is open
  openCodex('lastfist', c.item());
}
// Where the highlighted thing is now, on screen
function tutTarget() {
  const st = tCur(); if (!st || !st.hi) return null;
  const t = st.hi(game); if (!t) return null;
  if (t.el) {
    const cards = t.el.closest && t.el.closest('#cards');
    if (cards) { const r = t.el.getBoundingClientRect(), cr = cards.getBoundingClientRect(); if (r.left < cr.left || r.right > cr.right) cards.scrollLeft += r.left - cr.left - 8; }
    const r = t.el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  }
  if (!t.screen && st.pan !== false && TUT.panned !== TUT.step) { // a world target off screen: bring it into view once
    const r0 = t.rect(); if (r0.right < 0 || r0.left > V.cw) { cam.x = t.u; cam.vx = 0; clampCam(); }
    TUT.panned = TUT.step;
  }
  const r = t.rect(), o = cv.getBoundingClientRect();
  return { left: r.left + o.left, top: r.top + o.top, right: r.right + o.left, bottom: r.bottom + o.top };
}
const tOverlap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
function tutPlace() {
  const B = $('tutB'), hi = $('tutHi'); if (B.classList.contains('hide')) return;
  B.style.width = ''; // full width first; narrowed below if nothing else fits beside the target
  const W = window.innerWidth, H = window.innerHeight, top0 = $('hud').getBoundingClientRect().bottom + 6, g = 10;
  let bw = B.offsetWidth, bh = B.offsetHeight;
  let r = tutTarget();
  const vis = r && r.right > 0 && r.left < W && r.bottom > 0 && r.top < H;
  hi.classList.toggle('hide', !vis);
  if (vis) { const p = 4; Object.assign(hi.style, { left: r.left - p + 'px', top: r.top - p + 'px', width: r.right - r.left + 2 * p + 'px', height: r.bottom - r.top + 2 * p + 'px' }); r = { left: r.left - p, top: r.top - p, right: r.right + p, bottom: r.bottom + p }; }
  const cx = vis ? (r.left + r.right) / 2 : W / 2, fitX = x => clamp(x, 8, W - bw - 8), fitY = y => clamp(y, top0, H - bh - 6);
  const cands = vis ? [
    { left: fitX(cx - bw / 2), top: r.bottom + g }, { left: fitX(cx - bw / 2), top: r.top - g - bh },
    { left: r.right + g, top: fitY((r.top + r.bottom) / 2 - bh / 2) }, { left: r.left - g - bw, top: fitY((r.top + r.bottom) / 2 - bh / 2) },
    { left: fitX(W / 2 - bw / 2), top: top0 }, { left: 8, top: top0 }, { left: W - bw - 8, top: top0 }, { left: 8, top: H - bh - 6 }, { left: W - bw - 8, top: H - bh - 6 },
  ] : [{ left: fitX(W / 2 - bw / 2), top: fitY(top0 + 10) }];
  const ok = c => c.left >= 4 && c.left + bw <= W - 4 && c.top >= top0 && c.top + bh <= H - 4 && !(vis && tOverlap({ left: c.left, top: c.top, right: c.left + bw, bottom: c.top + bh }, r));
  let c = cands.find(ok);
  if (!c && vis) { // too wide for the room beside the target: a narrower bubble on the roomier side
    const left = r.left - g - 8, right = W - r.right - g - 8, w = Math.floor(Math.max(left, right));
    if (w >= 180) { B.style.width = w + 'px'; bw = w; bh = B.offsetHeight; const y = fitY((r.top + r.bottom) / 2 - bh / 2); c = [{ left: right >= left ? r.right + g : r.left - g - bw, top: y }].find(ok); }
  }
  c = c || cands[cands.length > 1 ? 4 : 0];
  B.style.left = Math.round(c.left) + 'px'; B.style.top = Math.round(Math.max(top0, c.top)) + 'px';
}
// Every frame while a tutorial runs: the player's HQ never falls; an action step advances once done; Next after a while
function tutTick(dt) {
  if (!TUT.on) return;
  if (!game || !game.tut) { tutOff(); return; }
  const hq = game.sides[0].hq; if (hq.hp > 0 && hq.hp < hq.maxHp * 0.5) hq.hp = hq.maxHp * 0.5;
  const st = tCur(); if (!st) return;
  if (st.act && !paused && !CX.open && running) {
    if (st.done(game)) { tutNext(); return; }
    TUT.waitT += dt;
    if (TUT.waitT >= TUT_FALLBACK && !TUT.fb) { TUT.fb = true; tutRender(); }
  }
  tutPlace();
}
$('tutNext').addEventListener('click', tutNext);
$('tutSkip').addEventListener('click', tutNext);
$('tutSkipC').addEventListener('click', tutSkipChapter);
// The How to Play tab: the chapter list
CODEX_HOWTO.html = () => { const D = tutDone(); return `<h2>How to Play</h2><p>Hands-on lessons in a practice match as ${factionName('lastfist')}. You can't lose, every step can be skipped, and any chapter can be played or replayed at any time.</p>` +
  TUT_CH.map((C, i) => `<div class="cxch${D[C.key] ? ' done' : ''}" id="cx-tut-${C.key}"><span class="ck" aria-label="${D[C.key] ? 'Completed' : 'Not played'}">${D[C.key] ? '✓' : ''}</span><div class="cxct"><b>${i + 1}. ${cxEsc(C.name)}</b><small>${cxEsc(C.blurb)}</small></div><button class="cxplay" data-tut="${i}">Play</button></div>`).join('') +
  `<h3 id="cx-controls">Army controls</h3><p><b>Select, then command.</b> Tap one of your units to select it; tap more to add them. <b>Double-tap</b> a unit to select every unit of its type. <b>Press and hold</b> on the battlefield until the ring fills, then draw a loop: the units inside it are selected. <b>All</b>, at the top of the column on the left, selects your whole army. A tag shows how many are selected; its × clears them. Only your own units can be selected.</p><p>With units selected, the command bar takes the bottom panel's place. <b>Tap the ground</b> to send them there: they stop to fight enemies they meet on the way, then hold the spot, each in its own space. <b>Attack</b> sends them down the lane they are in, fighting their way to the enemy base. <b>Hold</b> stops them to fight anything in range. <b>Retreat</b> brings them back to the rally point in the middle of your base, without firing or stopping for enemies. The selection clears after an order. Nothing moves on its own.</p><p><b>New units</b> gather at the rally point and wait there on Hold; from a forward ${tN('barracks')}, beside it. Units never stack: wherever they gather, each takes its own space. <b>Healing:</b> your units heal ${Math.round(CTRL.heal * 100)}% of their health a second, once unhurt for ${CTRL.calm} s, at the rally point and at repair depots you hold, only where you move them.</p><p><b>Lanes</b> (Two-Lane, Three-Lane): the column on the left lists each lane, north on top, with its unit count. <b>Tap a lane</b> to select the units in it (units in your base count toward All only). Aircraft fly straight over the ridge and the walls. On Three-Lane the walls between the lanes each have one gap, at the rich centre node.</p>` +
  `<h3 id="cx-special">Repair depots and relics (Three-Lane)</h3><p>A <b>repair depot</b> is captured like a node: your units near it heal ${REPAIR.heal}% of their health a second once unhurt for ${REPAIR.calm} s: move damaged units there (or to the rally point) to save them. A <b>relic</b> is a neutral camp off the lanes: its gold guards never move and fire at anyone who comes close. Destroy them and stand on the relic to take it, once, for ${RELIC.reward.c} credits.</p>` +
  `<h3 id="cx-cond">Battlefield conditions</h3><p>On the map screen you can add conditions to a match (or let <b>Random</b> pick one): ${COND_KEYS.map(k => `<b>${COND_UI[k].name}</b>: ${COND_UI[k].line()}`).join(' ')} Each map lists the ones it allows; a match shows its conditions as small icons on the minimap's right edge.</p>` +
  `<h3 id="cx-break">Breaking a base</h3><p>Your HQ is shielded while a production building (${tN('barracks')}, ${tN('factory')} or ${tN('techlab')}) stands in your base: destroy them and the HQ is open. A destroyed building leaves <b>rubble</b>: nothing can be built on its pad for ${BREAK.rubble.t} s. From ${mmss(BREAK.power.from)} the base guns (HQ, turrets, bunkers) lose ${Math.round(BREAK.power.step * 100)}% of their power every minute as the Extinction Event nears, the same for both sides: <b>Power failing</b>.</p>`; }; // v2.66; v2.69: base-breaking; v2.74: the army controls (docs/CONTROLS.md)
// First launch: offer the tutorial once (the answer is remembered; without storage, once per page load)
function tutFirstPrompt() {
  TUT.prompted = true;
  overlay(`<h1>New here?</h1><p>Play the tutorial? It takes a few minutes, and you can skip any part of it.</p><div class="row"><button class="big" id="bTutPlay">Play</button><button class="ghost" id="bTutSkip">Skip</button></div>`);
  $('bTutPlay').addEventListener('click', () => { tutSeen(); tutStart(0, true); });
  $('bTutSkip').addEventListener('click', () => { tutSeen(); showStart(); });
}
function frame(ts) {
  requestAnimationFrame(frame);
  if (CX.open) { last = ts; return; } // the Codex covers the screen: nothing to draw (the match is paused)
  vfxQuality(ts - last, !!(game && running && !paused));
  const real = Math.min(CATCH_UP, Math.max(0, (ts - last) / 1000)); last = ts;
  const dt = Math.min(0.05, real); // camera glide and the end screen's effects (as before)
  if (game && running && !paused && !(TUT.on && TUT.hold)) { // v2.46: a tutorial bubble that explains holds the match still
    simAcc += real * (game.countdown > 0 ? 1 : speed); // the countdown always takes real seconds
    while (simAcc >= SIM_STEP) { update(game, SIM_STEP); simAcc -= SIM_STEP; }
    updateIntro();
    handleEvents();
    if (game.over && !endTimer && !game.tut) { clearSave(); saveHistory(game); /* v2.51 */ /* v2.46: the tutorial ends its own match (and never touches the save) */ endTimer = setTimeout(() => { endTimer = null; if (game && game.over) { running = false; showEnd(); } }, 1900); }
    saveT -= real;
    if (saveT <= 0 && !game.over) { saveT = 5; saveGame(); }
    uiT -= real;
    if (uiT <= 0) { uiT = 0.15; refreshUI(false); alertTick(); }
  } else if (game && game.over) update(game, dt);
  if (!gest && Math.abs(cam.vx) > 5) { cam.x += cam.vx * dt; cam.vx *= Math.pow(0.03, dt); clampCam(); }
  if (TUT.on) tutTick(real);
  render(ctx, game, ts / 1000, sel, selPad); drawCtlOverlay(ctx); // v2.74: the box (v2.78) and the move marker
  drawMinimapNow();
}
buildAbil();
resize();
homeCamera();
showStart();
// Title screen covers the main menu on load; a tap (click, so no ghost tap reaches the menu) fades it away
$('title').addEventListener('click', () => { const t = $('title'); t.classList.add('out'); setTimeout(() => t.remove(), 400); });
requestAnimationFrame(frame);
// Offline play for the home-screen app (v2.54, Phase 0 item 7): sw.js caches the page. Only over http(s); any failure
// (file://, private mode, the test kit's page) is ignored and the game plays as before.
try { if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/__phone\.html$/.test(location.pathname)) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {})); } catch (e) {}
