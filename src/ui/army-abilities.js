/* v2.74: the Army tab (group and type chips, Hold / Attack / Retreat / Regroup, squads, rally flags, Send damaged home) is
   gone; the army controls are in src/ui/controls.js (docs/CONTROLS.md). */
/* ---------- Commander abilities: buttons and one-finger targeting ----------
   Tap a button, tap the battlefield to place the circle, tap inside it to confirm. Cancel: the banner's button,
   the ability button again, or pausing. Long-press a button for details. */
const AB_ICON = {
  shield: '<svg viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="#39c8ff"/></svg>',
  strike: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" fill="none" stroke="#ff7a5c" stroke-width="2.6"/><path d="M12 1v7M12 16v7M1 12h7M16 12h7" stroke="#ff7a5c" stroke-width="2.6"/></svg>',
  repair: '<svg viewBox="0 0 24 24"><path d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5z" fill="#5dff8a"/></svg>',
};
const AB_COL = { shield: '#39c8ff', strike: '#ff7a5c', repair: '#5dff8a', frenzy: '#ff8ad8', brood: '#e8d2a8', corrosive: '#b6ff5a', mwarp: '#9fe8ff', overcharge: '#7fe0ff', beam: '#c9b8ff' };
// Bloomhost's three (v2.20)
const AB_ICON_BH = {
  frenzy: '<svg viewBox="0 0 24 24"><path d="M12 2c3 4 7 6 7 12a7 7 0 0 1-14 0c0-6 4-8 7-12z" fill="#ff8ad8"/></svg>',
  brood: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="13" rx="6.5" ry="8.5" fill="#d9c7a6"/><path d="M8 9c2 2 6 2 8 0" stroke="#7a5a3a" stroke-width="1.6" fill="none"/></svg>',
  corrosive: '<svg viewBox="0 0 24 24"><circle cx="8" cy="14" r="4" fill="#b6ff5a"/><circle cx="15" cy="10" r="5" fill="#8ad63a"/><circle cx="16" cy="17" r="3" fill="#b6ff5a"/></svg>',
};
Object.assign(AB_ICON, AB_ICON_BH);
// The Axiarchs' three (v2.28; until then locked "Soon" buttons)
Object.assign(AB_ICON, {
  mwarp: '<svg viewBox="0 0 24 24"><path d="M7 4l5 5-5 5-5-5z" fill="none" stroke="#9fe8ff" stroke-width="1.8"/><path d="M17 10l5 5-5 5-5-5z" fill="#9fe8ff"/><path d="M10 12l4 2" stroke="#9fe8ff" stroke-width="1.6"/></svg>',
  overcharge: '<svg viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="none" stroke="#7fe0ff" stroke-width="2"/><path d="M13 6l-4 7h3l-1 5 4-7h-3z" fill="#bff4ff"/></svg>',
  beam: '<svg viewBox="0 0 24 24"><path d="M10 1h4v14h-4z" fill="#c9b8ff"/><path d="M3 17h18v4H3z" fill="none" stroke="#c9b8ff" stroke-width="1.8"/><path d="M7 15l-2 2M17 15l2 2" stroke="#c9b8ff" stroke-width="1.6"/></svg>',
});
let aim = null; // { k, placed, u, v, ok, msg }
function buildAbil() {
  const box = $('abil'); box.innerHTML = '';
  for (const k of game ? abList(game.sides[0]) : ABIL_ORDER) { // the player's faction's three (v2.20)
    const el = document.createElement('button');
    el.className = 'ab'; el.dataset.k = k; el.style.setProperty('--ac', AB_COL[k]); el.setAttribute('aria-label', ABIL[k].name);
    el.innerHTML = `<span class="ring"></span>${AB_ICON[k]}<small></small>`;
    el.addEventListener('pointerdown', () => { if (lp) clearTimeout(lp.timer); lp = { el, fired: false, timer: setTimeout(() => { lp.fired = true; endAim(); closePanel(); showInfo('a', k); }, 420) }; });
    for (const n of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(n, () => { if (lp && lp.el === el) clearTimeout(lp.timer); });
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('click', () => { if (lp && lp.el === el && lp.fired) { lp.fired = false; return; } onAbil(k, el); });
    el.addEventListener('animationend', () => el.classList.remove('shake'));
    box.appendChild(el);
  }
}
function onAbil(k, el) {
  if (!game || paused || !running) return;
  hideInfo();
  if (aim && aim.k === k) { endAim(); return; }
  const r = abilityCheck(game, 0, k);
  if (!r.ok) { toast(r.msg, 'bad'); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
  closePanel();
  aim = { k, placed: false, u: 0, v: 0, ok: false, msg: '' };
  $('aim').style.setProperty('--ac', AB_COL[k]);
  $('aimName').textContent = ABIL[k].name; $('aimTxt').textContent = ': tap the battlefield to place it';
  $('aim').classList.remove('hide');
  refreshAbil();
}
function endAim() { // ends ability targeting and Set warp point (v2.76: base flags no longer move)
  if (wpt) { wpt = false; $('aim').classList.add('hide'); refreshWarpCard(); }
  if (!aim) return; aim = null; $('aim').classList.add('hide'); refreshAbil();
}
$('aimX').addEventListener('click', endAim);
function aimTap(x, y) {
  const w = toWorld(x, y), u = clamp(w.x, -40, L + 40), v = clamp(w.y / DY, -240, 240), A = ABIL[aim.k];
  if (aim.placed && Math.hypot(u - aim.u, v - aim.v) <= A.r) { // second tap inside the circle: confirm
    const r = useAbility(game, 0, aim.k, aim.u, aim.v);
    toast(r.msg, r.ok ? 'ok' : 'bad');
    if (r.ok) { endAim(); refreshUI(false); }
    return;
  }
  const r = abilityCheck(game, 0, aim.k, u, v);
  Object.assign(aim, { placed: true, u, v, ok: r.ok, msg: r.msg || '' });
  const idle = r.ok && aim.k === 'repair' && !repairHealable(game, 0, u, v); // v2.11: warn before a Repair Pulse that would heal nothing
  $('aimTxt').textContent = !r.ok ? `: ${r.msg}` : idle ? `: nothing here can be healed${game.t >= EXT.start ? ' (buildings can\'t be repaired during the storm)' : ''}. Tap inside to cast anyway` : ': tap inside the circle to confirm';
}
const fmtCd = t => t >= 60 ? `${Math.floor(t / 60)}:${String(Math.ceil(t % 60) % 60).padStart(2, '0')}` : `${Math.ceil(t)}s`;
function refreshAbil() {
  const box = $('abil'), show = !!game && running && !game.over;
  box.classList.toggle('hide', !show);
  if (!show) { if (aim) endAim(); return; }
  const s = game.sides[0];
  for (const el of box.children) {
    const k = el.dataset.k, A = ABIL[k], wait = s.ab[k] - game.t, locked = !abilUnlocked(game, 0, A);
    const cool = wait > 0, poorC = s.res.c < A.cost.c, poorE = s.res.e < A.cost.e, gate = game.countdown > 0;
    const shared = s.abK && Math.abs(s.ab[k] - s.abEnd) < 1e-6, total = shared ? ABIL[s.abK].cd : A.first; // one shared ring on all three
    el.classList.toggle('lock', locked); el.classList.toggle('cool', !locked && cool); el.classList.toggle('wait', gate);
    el.classList.toggle('poor', !locked && !cool && (poorC || poorE));
    el.classList.toggle('ready', !locked && !cool && !gate && !poorC && !poorE);
    el.classList.toggle('on', !!aim && aim.k === k);
    el.classList.toggle('src', !locked && cool && shared && s.abK === k);
    el.style.setProperty('--p', cool ? clamp(wait / total, 0, 1).toFixed(3) : 0);
    setHTML(el.querySelector('small'), locked ? (A.req === 'hq' ? `HQ T${A.reqTier}` : BDEF[A.req].name.split(' ').pop()) : cool ? fmtCd(wait) : `<span class="${poorC ? 'no' : ''}">${A.cost.c}</span>·<span class="${poorE ? 'no' : 'e'}">${A.cost.e}</span>`);
    el.setAttribute('aria-label', `${A.name}: ${locked ? `needs ${A.reqTier ? 'your' : 'a'} ${abilReqText(A, s.faction)}` : cool ? `ready in ${Math.ceil(wait)} seconds${shared ? ` (shared cooldown from ${ABIL[s.abK].name})` : ''}` : `${A.cost.c} credits, ${A.cost.e} energy`}`);
  }
}
function refreshUI(force) {
  if (!game) return;
  const s = game.sides[0], inc = income(game, 0), cap = popCap(game, 0), used = popUsed(game, 0);
  $('vC').textContent = Math.floor(s.res.c); $('rC').textContent = `+${inc.c.toFixed(0)}/s`;
  $('vE').textContent = Math.floor(s.res.e); $('rE').textContent = `+${inc.e.toFixed(1)}/s`;
  $('vP').textContent = `${fmtPop(used)}/${cap}`;
  for (let k = 0; k < 1; k++) { // your HQ; the enemy's last-seen health is drawn on the minimap (v2.47)
    const st = hqStatus(game, k, 0), el = $('hq' + k), fill = el.querySelector('.hb i');
    el.className = 'hqr ' + st.state + (st.stale ? ' stale' : '');
    fill.style.width = (st.frac * 100).toFixed(1) + '%'; fill.style.background = hpColor(st.frac);
    el.querySelector('small').textContent = st.stale ? 'Last seen' : HQ_STATE[st.state];
    el.setAttribute('aria-label', `${k ? 'Enemy' : 'Your'} HQ: ${st.stale ? 'last seen with ' : ''}${Math.ceil(st.hp)} of ${Math.round(st.maxHp)} HP, ${HQ_STATE[st.state].toLowerCase()}`);
  }
  $('resP').classList.toggle('full', used >= cap);
  refreshCtl(); // v2.74: the left column and the command bar
  if (tab === 'train' && trainSigOf(game) !== trainSig) { buildCards(); return; } // what you can train changed
  else for (const el of $('cards').children) {
    const type = el.dataset.type;
    if (type === 'other') continue;
    let html, locked, poor, badge = 0, prog = 0;
    if (tab === 'build') {
      const d = BD(pFac(), type);
      const mine = alive(game, 0, type), have = !!d.sig && mine.length > 0; // v2.32: one of each signature building at a time (v2.34: a real boolean; undefined made classList.toggle flip the card every refresh)
      const padBy = d.sig && sigPadOn() && !have ? game.ents.find(e => e.kind === 'b' && e.side === 0 && e.hp > 0 && (e.type === 'sigA' || e.type === 'sigB')) : null; // v2.43: the other one stands (on the signature pad)
      locked = !!(d.req && !hasBuilt(game, 0, d.req)) || have || !!padBy;
      poor = s.res.c < d.cost.c || s.res.e < d.cost.e;
      badge = have ? 0 : mine.length;
      for (const b of mine) if (!b.built) prog = Math.max(prog, b.progress);
      html = have ? '<span class="lock">Already built</span>' : padBy ? '<span class="lock">Pad in use</span>' : locked ? `<span class="lock">Requires ${BD(pFac(), d.req).name}</span>` : costHTML(d.cost, s.res);
    } else {
      const d = UDEF[type];
      const prods = alive(game, 0, d.from).filter(b => canMake(b, type));
      if (type === 'rifle') setHTML(el.querySelector('.pr'), prods.some(b => pathMod(b, 'pairs')) ? 'MASS ×2' : '');
      const mx = el.querySelector('.mx'); if (mx) { const n = unitCount(game, 0, type); setHTML(mx, `${n}/${d.max}`); mx.classList.toggle('full', n >= d.max); }
      locked = !prods.length;
      poor = s.res.c < d.cost.c || s.res.e < d.cost.e || used + d.pop > cap;
      for (const p of prods) {
        badge += p.queue.filter(q => q === type).length;
        if (p.queue[0] === type) prog = Math.max(prog, Math.min(1, p.prodT / (d.time * (type === 'rifle' && p.queue[1] === 'rifle' && pathMod(p, 'pairs') ? PAIR_TIME : 1))));
      }
      html = locked ? `<span class="lock">${unitLockMsg(d)}</span>` : costHTML(d.cost, s.res, d.pop);
    }
    const costEl = el.querySelector('.cost');
    if (force) costEl.innerHTML = html; else setHTML(costEl, html);
    el.classList.toggle('locked', !!locked); // always a boolean: toggle(name, undefined) flips the class
    el.classList.toggle('poor', !locked && !!poor);
    const be = el.querySelector('.badge');
    if (be.textContent !== String(badge)) be.textContent = badge; be.classList.toggle('show', badge > 0);
    el.querySelector('.bar i').style.width = (prog * 100).toFixed(1) + '%';
  }
  if (tab === 'train') refreshEchoCards(); // v2.34
  refreshAbil();
  refreshExt();
  refreshOd();
  refreshPanel();
}
function refreshOd() { // Overdrive (v2.32): shown while your Salvage Yard's production boost runs
  const s = game.sides[0], on = !game.over && overdrive(game, 0), el = $('od');
  el.classList.toggle('hide', !on);
  if (on) { const txt = `${Math.ceil(s.od - game.t)} s`; if ($('odT').textContent !== txt) $('odT').textContent = txt; el.setAttribute('aria-label', `Overdrive: production +${Math.round(YARD.od * 100)}% for ${txt}`); }
}
function refreshExt() {
  const t = game.t, el = $('ext');
  const txt = game.over ? '' : t >= EXT.warn && t < EXT.start ? `Extinction event in ${fmtTime(Math.ceil(EXT.start - t))}` : t >= EXT.start && t < EXT.start + 4 ? 'THE EXTINCTION EVENT HAS BEGUN' : '';
  if (el.textContent !== txt) el.textContent = txt;
  el.classList.toggle('hide', !txt); document.body.classList.toggle('ext-on', !!txt);
}

