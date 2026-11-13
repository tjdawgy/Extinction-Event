/* ---------- Building panel: tap a building to upgrade or sell it ---------- */
function openPanel(b) { sel = b; selPad = -1; sellArm = 0; upArm = 0; bpPath = null; $('bp').classList.remove('hide'); refreshPanel(); placeToasts(); }
function openPad(k) {
  sel = null; selPad = k; sellArm = 0; upArm = 0; $('bp').classList.remove('hide');
  if (tab !== 'build') document.querySelector('.tabs [data-tab="build"]').click();
  refreshPanel(); placeToasts();
  if (k === SIG_SLOT) { const c = $('cards').querySelector('.card[data-type="sigA"]'); if (c) $('cards').scrollLeft = Math.max(0, c.offsetLeft - 8); } // v2.43: the signature cards in view
}
function closePanel() { sel = null; selPad = -1; sellArm = 0; upArm = 0; $('bp').classList.add('hide'); placeToasts(); }
function refreshPanel() {
  $('bpPick').classList.add('hide'); $('bp').classList.remove('wide'); // shown again below for a building choosing its path
  $('bp').classList.toggle('shp', !!(selPad < 0 && sel && sel.maxShp)); // v2.36
  if (selPad >= 0) {
    if (!game || (selPad >= FWD_SLOT ? fwdAt(game, selPad) || game.nodes[FWD_PADS[selPad - FWD_SLOT].node].owner !== 0 : selPad === SIG_SLOT ? sigOnPad(game, 0) : game.sides[0].slots[selPad])) { closePanel(); return; }
    if (selPad >= FWD_SLOT) { // v2.65: a forward pad you hold
      const al = FWD_PADS[selPad - FWD_SLOT].allow.map(t => BD(pFac(), t).name).join(' or ');
      $('bpName').textContent = 'Forward pad'; $('bpPad').textContent = al; setHTML($('bpPips'), '');
      $('bpNow').textContent = `Build a ${al} here, out on the lane. You can build while you hold this pad's post.`; setHTML($('bpNext'), '');
      $('bpUp').classList.add('hide'); $('bpSell').classList.add('hide'); $('bpRep').classList.add('hide'); $('bpHp').textContent = '';
      return;
    }
    const sp = selPad === SIG_SLOT; // v2.43: the signature pad
    $('bpName').textContent = sp ? 'Signature pad' : 'Empty pad'; $('bpPad').textContent = sp ? `${BD(pFac(), 'sigA').name} or ${BD(pFac(), 'sigB').name}` : padLabel(null, selPad); setHTML($('bpPips'), '');
    $('bpNow').textContent = sp ? 'Pick one of your two signature buildings (★ cards). One stands here at a time; sell it to build the other.' : 'Pick a building below to build it here.';
    setHTML($('bpNext'), '');
    $('bpUp').classList.add('hide'); $('bpSell').classList.add('hide'); $('bpRep').classList.add('hide'); $('bpHp').textContent = '';
    return;
  }
  $('bpUp').classList.remove('hide'); $('bpUp').classList.remove('arm');
  if (!sel) return;
  if (!game || sel.hp <= 0 || !game.ents.includes(sel)) { closePanel(); return; }
  const b = sel, d = bdOf(b), res = game.sides[0].res, up = $('bpUp'), sell = $('bpSell');
  $('bpName').textContent = d.name; $('bpPad').textContent = padLabel(b);
  if (d.noPad) { // a node bunker (v2.32): nothing to buy; it follows the Depot
    setHTML($('bpPips'), [1, 2, 3].map(i => `<i class="${i <= b.tier ? 'on' : ''}"></i>`).join(''));
    $('bpHp').textContent = `${Math.ceil(b.hp)}/${Math.round(b.maxHp)}`;
    $('bpNow').textContent = `T${b.tier}: ${d.tiers[b.tier]}`;
    setHTML($('bpNext'), `<span>Free with your ${BD(pFac(), 'sigB').name}: its tier sets this one's; destroyed, it returns in ${BUNKER.rebuild} s while you hold the node</span>`);
    up.classList.add('hide'); sell.classList.add('hide'); $('bpRep').classList.add('hide'); return;
  }
  setHTML($('bpPips'), [1, 2, 3].map(i => `<i class="${i <= b.tier && b.built ? 'on' : ''}"></i>`).join(''));
  $('bpHp').textContent = `${Math.ceil(b.hp)}/${Math.round(b.maxHp)}` + (b.maxShp ? ` · ${Math.ceil(b.shp)} sh` : ''); // v2.25: Axiarch shields
  const rep = $('bpRep'), hurt = b.built && b.hp < b.maxHp - 1;
  rep.classList.toggle('hide', !hurt);
  if (hurt) {
    if (b.repair > 0 && repairCost(b) < 1) { rep.disabled = true; rep.textContent = 'Repairing…'; }
    else { rep.disabled = false; rep.textContent = `Repair ${repairCost(b)}`; }
  }
  sell.classList.toggle('hide', b.type === 'hq');
  if (b.type !== 'hq') {
    const v = sellValue(b), armed = sellArm > performance.now();
    sell.classList.toggle('arm', armed);
    sell.textContent = armed ? 'Tap to confirm' : `Sell +${v.c}` + (v.e ? ` / ${v.e}` : '');
  }
  if (!b.built) {
    $('bpNow').textContent = `Under construction, ${Math.round(b.progress * 100)}%`;
    setHTML($('bpNext'), `<span>T1: ${d.tiers[1]}</span>`);
    up.disabled = true; up.textContent = 'Building…'; up.classList.remove('poor');
    return;
  }
  if (prodLocked(b.fac, b.type)) { // Axiarch production stays T1 until its paths arrive (v2.25)
    $('bpNow').textContent = `T1: ${d.tiers[1]}`; setHTML($('bpNext'), '');
    up.disabled = true; up.textContent = d.lockMsg; up.classList.remove('poor'); up.classList.add('soon'); $('bp').classList.add('wide'); return;
  }
  up.classList.remove('soon');
  const T = treeOf(b.fac, b.type), P = T && (b.path || b.upPath) ? T[b.path || b.upPath] : null, pick = T && b.tier === 1 && !b.upgrading;
  const tierTxt = (t, named) => P && t >= 2 ? (named ? `${P.name}: ` : '') + P.steps[t].short : d.tiers[t];
  $('bp').classList.toggle('wide', !!pick);
  $('bpPick').classList.toggle('hide', !pick);
  $('bpNow').textContent = pick ? '' : `T${b.tier}: ${tierTxt(b.tier, true)}` + (b.type === 'hq' ? (b.shielded ? '. Shielded while a production building stands in your base.' : '. Shield is down!') : '') 
  if (b.tier >= 3) { setHTML($('bpNext'), '<span>Fully upgraded</span>'); up.disabled = true; up.textContent = 'Max tier'; up.classList.remove('poor'); return; }
  const nx = d.up[b.tier + 1];
  if (pick) { // the path picker: tap a path, then the Upgrade button confirms it
    for (const el of $('bpPick').children) {
      const k = el.dataset.p, Q = T[k];
      setHTML(el, `<b>${k} · ${Q.name}</b><em>T2</em>${Q.steps[2].short}<br><em>T3</em>${Q.steps[3].short}`);
      el.classList.toggle('on', bpPath === k);
    }
    setHTML($('bpNext'), '');
    const armed = bpPath && upArmed(b);
    up.disabled = false; up.textContent = armed ? `Confirm · ${nx.c}/${nx.e}` : bpPath ? `Choose · ${nx.c}/${nx.e}` : 'Pick a path'; up.classList.toggle('poor', !armed && (!bpPath || res.c < nx.c || res.e < nx.e)); up.classList.toggle('arm', !!armed);
    return;
  }
  setHTML($('bpNext'), `<span>Next T${b.tier + 1}: ${tierTxt(b.tier + 1)}</span>` + costHTML(nx, res) + `<span>${nx.time}s</span>`);
  if (b.upgrading) { up.disabled = true; up.textContent = `Upgrading ${Math.round(b.upProg * 100)}%`; up.classList.remove('poor'); }
  else { const armed = upArmed(b); up.disabled = false; up.textContent = armed ? 'Tap to confirm' : 'Upgrade'; up.classList.toggle('poor', !armed && (res.c < nx.c || res.e < nx.e)); up.classList.toggle('arm', armed); }
}
// The panel header's second line (v2.35): which pad the building stands on. Pads count 1-8 from the HQ outward (slot order)
function padLabel(b, k) {
  if (!b) return k === SIG_SLOT ? 'Signature pad' : `Pad ${k + 1}`;
  if (b.type === 'hq') return 'HQ pad';
  if (b.slot === SIG_SLOT) return 'Signature pad'; // v2.43
  if (b.slot >= FWD_SLOT) return 'Forward pad'; // v2.65
  if (bdOf(b).noPad) return `${NODE_NAME[b.node] ? NODE_NAME[b.node][0].toUpperCase() + NODE_NAME[b.node].slice(1) : 'Field'} node`;
  return b.slot >= 0 ? `Pad ${b.slot + 1}` : '';
}
// Costly upgrades (v2.35, audit): the top third of a faction's upgrade costs (credits + energy, every role's T2 and T3) take
// a second tap to confirm. Ties are kept whole, so the cut is the highest cost that leaves no more than a third above it.
const UP_BIG = {};
function upBigAt(fac) {
  if (UP_BIG[fac] !== undefined) return UP_BIG[fac];
  const B = BDEFS[fac] || BDEF, all = [];
  for (const t in B) if (B[t].up && !B[t].noPad) for (const k of [2, 3]) if (B[t].up[k]) all.push(B[t].up[k].c + B[t].up[k].e);
  all.sort((a, b) => b - a);
  const n = Math.ceil(all.length / 3); let cut = Infinity;
  for (let i = 0; i < all.length && i < n; i++) if (all.filter(x => x >= all[i]).length <= n) cut = all[i];
  return (UP_BIG[fac] = cut);
}
const upIsBig = b => { const nx = b.tier < 3 && bdOf(b).up && bdOf(b).up[b.tier + 1]; return !!nx && nx.c + nx.e >= upBigAt(b.fac); };
const upArmed = b => upArm > performance.now() && upIsBig(b);
let bpPath = null; // the path picked in the panel, not yet confirmed
for (const el of $('bpPick').children) el.addEventListener('click', () => { if (!sel || paused) return; bpPath = bpPath === el.dataset.p ? null : el.dataset.p; upArm = 0; refreshPanel(); });
$('bpX').addEventListener('click', closePanel);
$('bpUp').addEventListener('click', () => {
  if (!sel || !game || paused) return;
  const T = treeOf(sel.fac, sel.type);
  if (T && sel.tier === 1 && !bpPath) { toast('Pick a path first: tap A or B', 'bad'); shake($('bp')); return; }
  if (upIsBig(sel) && !sel.upgrading && sel.built && !(upArm > performance.now())) { // a costly upgrade: the first tap arms it (v2.35)
    const nx = bdOf(sel).up[sel.tier + 1], res = game.sides[0].res;
    if (res.c >= nx.c && res.e >= nx.e && game.countdown <= 0) { upArm = performance.now() + 2500; refreshPanel(); return; }
  }
  upArm = 0;
  const r = tryUpgrade(game, 0, sel, T && sel.tier === 1 ? bpPath : undefined);
  if (r.ok) bpPath = null;
  if (r.ok) toast(r.msg, 'ok'); else { toast(r.msg, 'bad'); shake($('bp')); }
  refreshUI(true);
});
$('bpRep').addEventListener('click', () => {
  if (!sel || !game || paused) return;
  const r = tryRepair(game, 0, sel);
  if (r.ok) toast(r.msg, 'ok'); else { toast(r.msg, 'bad'); shake($('bp')); }
  refreshUI(true);
});
$('bpSell').addEventListener('click', () => {
  if (!sel || !game || paused) return;
  if (game.countdown > 0) { toast(WAIT_GO.msg, 'bad'); shake($('bp')); return; }
  if (sellArm < performance.now()) { sellArm = performance.now() + 2500; refreshPanel(); return; }
  const r = trySell(game, 0, sel);
  toast(r.msg, r.ok ? 'ok' : 'bad');
  if (r.ok) closePanel();
  refreshUI(true);
});

/* ---------- Alerts (v2.53, Phase 0 item 6) ----------
   The UI watches the match (never the SIM's rules) for three kinds of trouble on the player's side: the HQ under attack,
   any other building under attack (hit in the last ALERT.hit game seconds), and a field node contested (one it owns or is
   capturing, with enemy ground units it can see on it). Each kind shows at most once every ALERT.gap game seconds per
   location: per node, the HQ, or a strip of the base ALERT.cell wide for buildings. An alert is a toast that can be tapped
   and a ping on the minimap for ALERT.ping s; tapping either moves the camera there. */
const ALERT = { gap: 10, hit: 0.6, cell: 160, ping: 5, show: 3.5 };
const alerts = { g: null, last: {}, pings: [] };
function camJump(u, v) { camTouched = true; cam.x = u; cam.vx = 0; if (v !== undefined && CAMY.max > CAMY.min) cam.y = v * DY - (Y_TOP + Y_BOT) / 2; clampCam(); } // v2.65: and to its depth on a deep map
function alertRaise(kind, key, u, v, msg) {
  const g = game, k = kind + ':' + key;
  if (alerts.last[k] !== undefined && g.t - alerts.last[k] < ALERT.gap) return false;
  alerts.last[k] = g.t;
  alerts.pings.push({ u, v, t: g.t, kind }); if (alerts.pings.length > 8) alerts.pings.shift();
  const box = $('alerts');
  while (box.children.length > 2) box.firstChild.remove();
  const el = document.createElement('div');
  el.className = `t alrt ${kind === 'node' ? 'warn' : 'bad'}`; el.textContent = msg + ' ›'; el.dataset.u = Math.round(u); el.setAttribute('role', 'button');
  el.addEventListener('pointerdown', ev => { ev.stopPropagation(); camJump(u, v); el.remove(); placeToasts(); });
  box.appendChild(el); placeToasts();
  setTimeout(() => el.classList.add('out'), ALERT.show * 1000);
  setTimeout(() => { el.remove(); placeToasts(); }, ALERT.show * 1000 + 350);
  sndPlay(kind === 'node' ? 'ping' : 'alarm');
  return true;
}
function alertTick() {
  const g = game; if (!g || g.over || g.countdown > 0 || g.spectate) return;
  if (alerts.g !== g) { alerts.g = g; alerts.last = {}; alerts.pings = []; $('alerts').textContent = ''; } // a new or resumed match starts clean
  $('alerts').classList.toggle('thru', !!(aim || wpt)); // aiming: taps go through to the field
  for (const b of g.ents) {
    if (b.kind !== 'b' || b.side !== 0 || b.hp <= 0 || b.lastHit === undefined || g.t - b.lastHit > ALERT.hit) continue;
    if (b.type === 'hq') alertRaise('hq', 0, b.u, b.v, 'Your HQ is under attack');
    else alertRaise('bld', Math.round(b.u / ALERT.cell), b.u, b.v, `${logBName(g, 0, b.type)} under attack`);
  }
  { const pm = powMul(g); if (pm < 1) { const hq = g.sides[0].hq; alertRaise('power', Math.round(pm * 100), hq.u, hq.v, `Power failing: base guns at ${Math.round(pm * 100)}%`); } } // v2.69 (b): once per step
  for (const n of g.nodes) {
    if (n.owner !== 0 && !(n.c && n.c[0] > 0)) continue; // ours, or ours being taken
    if (g.ents.some(e => e.kind === 'u' && e.side === 1 && e.hp > 0 && !UDEF[e.type].air && !UDEF[e.type].noCap && Math.abs(e.u - n.u) <= NODE_R && visibleTo(g, 0, e)))
      alertRaise('node', n.id, n.u, n.v, `The ${nodeLabel(n.id)} is contested`);
  }
}
function handleEvents() {
  for (const e of game.events) {
    if (e.type === 'built' && e.side === 0) { toast(`${e.name} is ready`, 'ok'); sndPlay('built'); }
    else if (e.type === 'upgraded' && e.side === 0) { toast(`${e.name} reached T${e.tier}`, 'ok'); sndPlay('upgrade'); }
    else if (e.type === 'alert') continue; // v2.53: alertTick shows these, per building strip and with a camera jump
    else if (e.type === 'over') sndPlay(e.winner === 0 ? 'victory' : 'defeat'); // a draw sounds like a defeat
    else if (e.type === 'destroyed' && e.side === 1 && !e.seen && !e.hq) continue; // happened out of sight
    else if (e.type === 'destroyed') toast(e.side === 0 ? `${e.name} destroyed` : `Enemy ${e.seen ? e.name : 'HQ'} destroyed`, e.side === 0 ? 'bad' : 'ok'); // an unseen enemy HQ isn't named (v2.17: the name would tell its faction)
    else if (e.type === 'spotted' && e.side === 0) { toast('Enemy units spotted', 'warn'); sndPlay('ping'); }
    else if (e.type === 'beaconDown' && (e.side === 0 || e.seen)) toast(e.side === 0 ? `Phase Beacon bubble collapsed: back in ${BEACON.down} s` : 'Enemy field bubble collapsed', e.side === 0 ? 'warn' : 'ok'); // v2.34
    else if (e.type === 'overdrive' && e.side === 0) toast(`Overdrive: production +${Math.round(YARD.od * 100)}% for ${YARD.odDur} s`, 'ok'); // v2.32
    else if (e.type === 'warpSnap' && e.side === 0) { toast('Warp point lost with the field: back to the front edge', 'warn'); refreshWarpCard(); } // v2.26
    else if (e.type === 'relic') { toast(e.side === 0 ? `Relic taken: +${e.c} credits` : 'The enemy took a relic', e.side === 0 ? 'ok' : 'warn'); if (e.side === 0) sndPlay('node'); } // v2.71
    else if (e.type === 'node') { if (e.side === 0 && !e.lost) sndPlay('node'); toast(e.lost ? (e.side === 0 ? 'You lost a field node' : 'Enemy lost a field node') : (e.side === 0 ? `Field node captured: +${NODE_INC.c} credits, +${NODE_INC.e} energy per second` : 'Enemy captured a field node'), (e.side === 0) === !e.lost ? 'ok' : 'warn'); }
    else if (e.type === 'go') showGo();
    else if (e.type === 'extWarn') { sndPlay('siren'); toast('The Extinction Event starts in 30 seconds: finish it or lose your base', 'bad'); }
    else if (e.type === 'extStart') sndPlay('rumble');
    else if (e.type === 'shieldDown' && e.side === 1 && !e.seen) continue;
    else if (e.type === 'shieldDown') toast(e.side === 1 ? 'Enemy HQ shield is down. Finish it!' : 'Your HQ shield is down', e.side === 1 ? 'ok' : 'bad');
  }
  game.events.length = 0;
}

/* ---------- Touch: drag left/right to scroll, tap a building or pad ---------- */
let gest = null;
const toWorld = (x, y) => ({ x: (x - V.cw / 2) / V.S + cam.x, y: (y - V.A) / V.S + YB() });
function localXY(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function inDiamond(wx, wy, cx, cy, h) { return Math.abs(wx - cx) / (2 * h * IX) + Math.abs(wy - cy) / (2 * h * IY) <= 1; }
function fwdTap(x, y) { // v2.65: a free forward pad: yours to build on while you hold its post (true: the tap was on one)
  const w = toWorld(x, y);
  for (let k = 0; k < FWD_PADS.length; k++) {
    const F = FWD_PADS[k], q = P(F.at[0], F.at[1]);
    if (!inDiamond(w.x, w.y, q.x, q.y, PAD_H + 4) || fwdAt(game, FWD_SLOT + k)) continue;
    if (game.nodes[F.node].owner === 0) { openPad(FWD_SLOT + k); return true; }
    toast('Capture this forward pad first: stand ground troops on its post', ''); closePanel(); return true;
  }
  return false;
}
function handleTap(x, y) {
  if (!game) return;
  hideInfo();
  if (game.spectate) return; // a spectator only watches (drag still moves the camera)
  if (wpt) { wptTap(x, y); return; }
  if (aim) { aimTap(x, y); return; }
  if (ctlFieldTap(x, y)) return; // v2.74: a unit selects it; with units selected, the ground is where they go
  if (FWD_PADS.length && fwdTap(x, y)) return; // v2.66: a forward pad under the tap
  const w = toWorld(x, y), hits = [];
  for (const b of game.ents) {
    if (b.kind !== 'b' || b.side !== 0) continue;
    const d = BDEF[b.type], p = P(b.u, b.v), hw = 2 * d.half * IX * BS + 6;
    const y0 = p.y - (d.half + d.h) * BS - 12, y1 = p.y + d.half * BS + 6;
    if (Math.abs(w.x - p.x) <= hw && w.y >= y0 && w.y <= y1) hits.push(b);
  }
  hits.sort((a, b) => b.v - a.v); // front first
  if (hits.length) {
    // tapping the same spot again steps to the building behind
    let pick = hits[0];
    if (tapCycle && Math.hypot(x - tapCycle.x, y - tapCycle.y) < 24 && sel && hits.includes(sel)) pick = hits[(hits.indexOf(sel) + 1) % hits.length];
    tapCycle = { x, y };
    openPanel(pick);
    if (hits.length > 1 && pick === hits[0]) toast('Tap again to select the building behind', '');
    return;
  }
  tapCycle = null;
  for (let k = 0; k < SLOT_COUNT; k++) {
    const p = slotPos(0, k), q = P(p.u, p.v);
    if (!game.sides[0].slots[k] && inDiamond(w.x, w.y, q.x, q.y, PAD_H + 4)) { openPad(k); return; }
  }
  if (sigPadOn() && SIG.on && BD(pFac(), 'sigA') && !sigOnPad(game, 0)) { const p = slotPos(0, SIG_SLOT), q = P(p.u, p.v); if (inDiamond(w.x, w.y, q.x, q.y, PAD_H + 4)) { openPad(SIG_SLOT); return; } } // v2.43
  if (fwdTap(x, y)) return;
  closePanel();
}
cv.addEventListener('pointerdown', e => {
  if (gest) return; // one finger at a time
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  const p = localXY(e);
  cam.vx = 0;
  gest = { id: e.pointerId, lx: p.x, ly: p.y, sx: p.x, sy: p.y, t0: performance.now(), t: performance.now(), moved: 0 };
  // v2.74: hold still a moment, then draw: a lasso (a quick drag still scrolls)
  if (ctlOn() && !paused && !aim && !wpt) { const G = gest; G.armT = setTimeout(() => { if (gest === G && G.moved < CT.still) { G.lasso = [[G.lx, G.ly]]; cam.vx = 0; } }, CT.lassoMs); }
});
cv.addEventListener('pointermove', e => {
  if (!gest || e.pointerId !== gest.id) return;
  const p = localXY(e);
  const dx = p.x - gest.lx, dy = p.y - gest.ly, now = performance.now(), dtm = Math.max(8, now - gest.t);
  if (gest.lasso) { const q = gest.lasso[gest.lasso.length - 1]; if (Math.hypot(p.x - q[0], p.y - q[1]) >= 3) gest.lasso.push([p.x, p.y]); gest.lx = p.x; gest.ly = p.y; gest.moved = Math.max(gest.moved, Math.hypot(p.x - gest.sx, p.y - gest.sy)); return; } // v2.74: drawing a lasso, not scrolling
  gest.lx = p.x; gest.ly = p.y; gest.t = now;
  if (CAMY.max > CAMY.min) cam.y -= dy / V.S; // v2.65: a deep map pans up and down too
  gest.moved = Math.max(gest.moved, Math.hypot(p.x - gest.sx, p.y - gest.sy));
  if (Math.abs(dx) > 0) camTouched = true;
  cam.x -= dx / V.S; clampCam();
  cam.vx = lerp(cam.vx, -dx / V.S / (dtm / 1000), 0.5);
});
function endPtr(e) {
  if (!gest || e.pointerId !== gest.id) return;
  const p = localXY(e);
  clearTimeout(gest.armT);
  if (gest.lasso && e.type === 'pointerup') { // v2.74: a lasso drawn (a hold without drawing is still a tap)
    const L_ = gest.lasso, xs = L_.map(q => q[0]), ys = L_.map(q => q[1]);
    if (Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) >= CT.lassoMin) lassoSelect(L_);
    else if (gest.moved < 10 && performance.now() - gest.t0 < 800) handleTap(p.x, p.y);
    gest = null; return;
  }
  if (e.type === 'pointerup' && gest.moved < 10 && performance.now() - gest.t0 < 500) { cam.vx = 0; handleTap(p.x, p.y); }
  gest = null;
}
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);
// Overview map in the top bar: tap or drag to jump
let mmDrag = false;
function mmJump(e) { camTouched = true; TUT.sig.mm = true; const r = mm.getBoundingClientRect(), k = (r.width - 8) / (UMAX - UMIN); cam.x = UMIN + (e.clientX - r.left - 4) / k; cam.vx = 0; if (CAMY.max > CAMY.min) cam.y = mmV(e.clientY - r.top, r.height) * DY - (Y_TOP + Y_BOT) / 2; // v2.65: and its depth
  if (e.type === 'pointerdown' && game) { const p = alerts.pings.filter(p => game.t - p.t < ALERT.ping).sort((a, b) => Math.abs(a.u - cam.x) - Math.abs(b.u - cam.x))[0]; if (p && Math.abs(p.u - cam.x) * k <= 12) cam.x = p.u; } // v2.53: a tap on an alert's ping lands on it
  clampCam(); }
mm.addEventListener('pointerdown', e => {
  mmDrag = true; try { mm.setPointerCapture(e.pointerId); } catch (_) {} mmJump(e); });
mm.addEventListener('pointermove', e => { if (mmDrag) mmJump(e); });
mm.addEventListener('pointerup', () => { mmDrag = false; });
mm.addEventListener('pointercancel', () => { mmDrag = false; });
cv.addEventListener('wheel', e => { e.preventDefault(); camTouched = true; cam.x += (e.deltaX || e.deltaY) / V.S; clampCam(); }, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());

/* ---------- Buttons ---------- */
for (const b of document.querySelectorAll('.tabs button')) b.addEventListener('click', () => {
  tab = b.dataset.tab;
  for (const x of document.querySelectorAll('.tabs button')) x.classList.toggle('on', x === b);
  buildCards();
});
$('bSpeed').addEventListener('click', () => { speed = game && game.spectate ? (speed >= 4 ? 1 : speed * 2) : speed >= 3 ? 1 : speed + 1; $('bSpeed').textContent = speed + '×'; }); // spectating (v2.38): 1×, 2×, 4×
$('bPause').addEventListener('click', () => { if (running && game && !game.over) pauseGame(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && running && !paused && game && !game.over) pauseGame(); else if (document.hidden) saveGame(); });
window.addEventListener('pagehide', saveGame);

