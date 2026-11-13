/* ---------- Match intro: both bases in view, then GET READY 3-2-1, GO ---------- */
const INTRO_T = 1.5; // seconds of the wide view before the 3-second count; the world is frozen for all of it
let camTouched = false, cdShown = '', goTimer = null;
// k = 0: zoomed out to show both bases; k = 1: normal view of the home base
function introCamera(k) {
  const e = k * k * (3 - 2 * k), fit = Math.min(1, V.cw / ((L - 2 * HQ_U + 420) * V.S0)); // both full pad diamonds
  applyZoom(lerp(fit, 1, e));
  if (!camTouched) { cam.x = lerp(L / 2, homeX(), e); cam.vx = 0; clampCam(); }
}
function setCountdown(label, big, cls) {
  const el = $('cd'), key = label + '|' + big + '|' + cls;
  if (cdShown === key) return;
  cdShown = key;
  el.className = cls; el.querySelector('small').textContent = label;
  const b = el.querySelector('b'), was = b.textContent;
  b.textContent = big;
  if (big && big !== was) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
}
function updateIntro() {
  if (!game || game.countdown <= 0) { if (V.zoom !== 1) applyZoom(1); return; }
  const cd = game.countdown;
  introCamera(clamp((2.2 - cd) / 1.4, 0, 1));
  if (cd > COUNTDOWN) setCountdown('DESTROY THE RED HQ', '', '');
  else setCountdown('GET READY', String(Math.ceil(cd)), '');
}
function showGo() {
  clearTimeout(goTimer);
  setCountdown('', 'GO!', 'go');
  goTimer = setTimeout(hideCountdown, 800);
}
function hideCountdown() { clearTimeout(goTimer); goTimer = null; cdShown = ''; $('cd').className = 'hide'; }

// Toasts sit centered under the top bar, or left of the building panel while it shows (v2.15.1)
function placeToasts() {
  const box = $('toasts'), bp = $('bp');
  const r = bp.classList.contains('hide') || getComputedStyle(bp).visibility === 'hidden' ? null : bp.getBoundingClientRect();
  const l = $('hud').getBoundingClientRect().left;
  const al = $('alerts'), a = al && al.children.length ? al.getBoundingClientRect() : null; // v2.53: beside the alert column while alerts show
  const x0 = a ? a.right + 8 : l, x1 = r ? r.left - 8 : a ? innerWidth - l - 66 : 0; // 66: clear of the ability buttons
  box.classList.toggle('side', !!(r || a));
  box.style.left = r || a ? `${x0}px` : ''; box.style.width = r || a ? `${Math.max(120, x1 - x0)}px` : '';
}
function toast(msg, kind = '') {
  const box = $('toasts');
  placeToasts();
  while (box.children.length > 2) box.firstChild.remove();
  const el = document.createElement('div');
  el.className = 't ' + kind; el.textContent = msg; box.appendChild(el);
  setTimeout(() => el.classList.add('out'), 1700);
  setTimeout(() => el.remove(), 2050);
}

function drawIcon(cvs, kind, type, fac) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = 56, H = 32;
  cvs.width = W * dpr; cvs.height = H * dpr;
  const c = cvs.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (kind === 'b') {
    const d = BDEF[type], s = Math.min(54 / (d.half * 3.6), 31 / (d.half * 2 + d.h + 4));
    c.translate(W / 2, H - 1 - d.half * s); c.scale(s, s); drawBOf(fac)[type](c, TEAM[0], 1.2, null, 1);
  } else {
    const d = UDEF[type], s = d.air ? 1.1 : Math.min(1.45, 28 / (visH(type) + 4));
    c.translate(W / 2 - (type === 'artillery' || type === 'titan' ? 3 : 0), d.air ? H / 2 : H - 2); c.scale(s, s);
    DRAW_U[type](c, TEAM[0], { anim: 0, moving: false, recoil: 0 });
  }
}

/* ---------- Hold a card for details ---------- */
// v2.45: tips that quote a number read it from the data when read (getters), so they never disagree with the stats
const UNIT_TIPS = {
  rifle: ['Infantry swarms, and aircraft in numbers', 'Snipers, Tanks, Artillery, Turrets'],
  heavy: ['Tanks, Titans and aircraft', 'Snipers, Tanks'],
  get sniper() { const u = UDEF.sniper; return [`Infantry, best in a line: the round goes through its target and hits up to ${u.pierce?.n} more behind it, weaker each time`, 'Tanks, Gunships; units spread out']; }, // v2.37
  tank: ['Infantry, vehicles and buildings', 'Heavies, Gunships'],
  get artillery() { const u = UDEF.artillery; return [`Clumps and buildings from ${txN(u.range)} range: every shot is a salvo of ${u.salvo?.n} shells that blankets the area (minimum range ${txN(u.minRange)})`, 'Anything that gets close, Gunships; a lone fast unit (the shells land wide)']; }, // v2.37
  get titan() { const u = UDEF.titan; return [`Buildings and everything on the ground once planted: siege lock takes ${txN(u.siege?.plant)} s, then +${txN(u.siege?.reach)} range and +${txP((u.siege?.bmul) - 1)} against buildings; it can't move until it unplants (${txN(u.siege?.unplant)} s)`, 'Heavies, Gunships; fast units that arrive while it plants or unplants']; }, // v2.37
  aircraft: ['Vehicles and Artillery', 'Interceptors, Heavies, Turrets'],
  interceptor: ['Aircraft only; escorts your Leviathans and Gunships', 'Heavies, Riflemen, Turrets'],
  get leviathan() { const u = UDEF.leviathan; return [`Buildings in a row: it carpet-bombs a line of ${u.carpet?.n} bombs along its path; it can't hit aircraft`, 'Interceptors, Heavies, Hydras, Turrets; a single hardened target']; }, // v2.37
  get medic() { const u = UDEF.medic; return [`No weapon: heals your infantry nearby (${txP(u.heal)} of HP per second)`, 'Anything that hits air']; },
  get drone() { const u = UDEF.drone; return [`No weapon: sees ${txN(SIGHT.drone)} far, spots for Artillery (at most ${u.max})`, 'Anything that hits air']; },
  flame: ['Massed infantry at close range, anyone on a node', 'Tanks, Artillery, Heavies, Titans'],
  hydra: ['Aircraft first, then infantry swarms; slowly chips buildings', 'Tanks, Titans, Artillery'],
  get skitterling() { const u = UDEF.skitterling; return [`Lone ranged units and nodes; hits harder when several bite the same target (up to +${txP(u.swarm.max)}). ${txN(u.pop)} supply each, at most ${u.max} alive`, "Splash damage, Flame Tanks, Turrets; it can't hit aircraft"]; }, // v2.37
  get mite() { const u = UDEF.mite; return [`Swarming lone units and buildings for free: a clutch every ${txN(MOUND.every)} s from the Brood Mound; at T3 a killed Mite bursts into acid`, "Anything at all: very little HP; it can't hit aircraft or capture nodes"]; },
  get bulwark() { const u = UDEF.bulwark; return [`Soaking up fire at the front; braces when hit (${txP(u.brace.cut)} less damage for ${txN(u.brace.dur)} s, every ${txN(u.brace.cd)} s)`, 'Heavies, Tanks; being surrounded']; },
  razorwing: ['Exposed ground units and aircraft; dives from the air', 'Anything that hits air, Turrets'],
  get leaper() { const u = UDEF.leaper; return [`Snipers, Artillery and other ranged units: it leaps up to ${txN(u.leap.range)} onto them (every ${txN(u.leap.cd)} s)`, 'Splash, Flame Tanks, focused fire']; },
  get ravager() { const u = UDEF.ravager; return [`Light armor (its maul does ${txX(DMG[u.weapon].light)}); every kill sends it into a ${txN(u.bloodfrenzy?.dur)} s frenzy (faster attacks and movement), refreshed by the next kill`, 'Tanks, Turrets, focused fire']; }, // v2.37
  spitter: ['Aircraft and ground from range; its acid makes targets take more damage (corrosion)', 'Anything that reaches it, splash'],
  get bilecaster() { const u = UDEF.bilecaster; return [`Marking targets from ${txN(u.range)} range: a single bile dart whose corrosion lasts ${txN(u.corrode.dur)} s (+${txP(u.corrode.amt)} damage taken)`, "Swarms (one target at a time), anything that reaches it; it can't hit aircraft"]; }, // v2.37
  get bilelobber() { const u = UDEF.bilelobber; return [`Softening an army from ${txN(u.range)} range: its splash corrodes everything it hits for ${txN(u.corrode?.dur)} s (minimum range ${txN(u.minRange)})`, 'Anything that gets close, aircraft; weak against buildings on its own']; }, // v2.37
  ruinmaw: ['Buildings above all; every hit leaves a short acid pool', 'Fast attackers, aircraft, Heavies'],
  get thornback() { const u = UDEF.thornback; return [`The front line; anyone who hits it up close takes ${txP(u.thorns.frac)} of the damage back`, 'Ranged focus, Tanks, aircraft']; },
  get dreadthorn() { const u = UDEF.dreadthorn; return [`Packed infantry: a hit of ${txN(u.burst.trigger)}+ releases a spine burst around it (every ${txN(u.burst.cd)} s)`, 'Ranged focus, Tanks, aircraft']; },
  shardling: ['Lone ranged units and nodes: fast light blades, ground and buildings', 'Focus fire, splash, Flame Tanks; it can\'t hit aircraft'],
  get bastion() { const u = UDEF.bastion; return [`Holding the front: when hit after its ${txN(u.surge?.cd)} s cooldown its shields surge back (${txP(u.surge?.rate)} per second for ${txN(u.surge?.dur)} s, even under fire)`, 'Burst that breaks through to its health, corrosion; aircraft']; }, // v2.37
  get wraithwing() { const u = UDEF.wraithwing; return [`A fast flyer that phases out for ${txN(u.phase?.dur)} s when hit (it can't be touched or fire), then can't phase again for ${txN(u.phase?.cd)} s`, 'Rapid-fire anti-air: Interceptors, Hydras, Turrets']; }, // v2.37
  get riftstalker() { const u = UDEF.riftstalker; return [`Lone ranged units: it phase-steps onto them (up to ${txN(u.leap.range)}, every ${txN(u.leap.cd)} s), strikes once and steps back to where it leapt from`, 'A guarded backline; burst when it lands']; }, // v2.37
  get parallax() { const u = UDEF.parallax; return [`Ranged units: it phase-steps behind them; its blows disrupt (${txP(u.disrupt.amt)} less damage for ${txN(u.disrupt.dur)} s)`, 'Focus fire, heavy frontline units, Turrets']; },
  get lancer() { const u = UDEF.lancer; return [`Tanky single targets and aircraft: every hit on the same target does ${txP(u.focus?.per)} more, up to +${txP(u.focus?.per * u.focus?.max)}`, 'Swarms (it starts over on a new target); melee units that reach it']; }, // v2.37
  marksman: ['Infantry from very long range, after a visible charge-up on its target', 'Fast attackers, aircraft (it can\'t hit them); weak against buildings'],
  get riftmortar() { const u = UDEF.riftmortar; return [`Single high-value targets and buildings from ${txN(u.range)} range: a precise, heavy strike with a tight blast (minimum range ${txN(u.minRange)})`, 'Swarms (little splash), anything that gets close, aircraft']; }, // v2.37
  get worldbreaker() { const u = UDEF.worldbreaker; return [`Armies dug in: every hit leaves a distortion zone where enemy units deal ${txP(DIST.amt)} less damage`, 'Mobile armies that step out, aircraft, Heavies']; }, // v2.37
  get gravemantle() { const u = UDEF.gravemantle; return [`Holding ground: enemy ground units near it are slowed ${txP(u.aura.slow)}; a weak shot at ground units and buildings`, "Ranged focus, aircraft (it can't hit them)"]; },
  get eventide() { const u = UDEF.eventide; return [`Packed ground units: a gravity pulse pulls them in (every ${txN(u.pulse.cd)} s); a weak shot at ground units and buildings`, "Ranged focus, aircraft (it can't hit them)"]; },
  get prismwing() { const u = UDEF.prismwing; return [`Ground units and buildings in numbers: linked Prismwings share ${txP(u.link.share)} of the shield damage each one takes`, "Anything that hits air, splash on the pack; it can't hit aircraft"]; },
  get shardstorm() { const u = UDEF.shardstorm; return [`Swarms of aircraft and infantry: its beam chains to up to ${u.chain.n} more enemies, weaker each jump`, 'Heavy single targets; weak against buildings']; },
  get voidcarrier() { const u = UDEF.voidcarrier; return [`Taking the power field forward: it carries a field (radius ${txN(u.node?.r)}) where Axiarch shields recharge fast and units warp in; slow orbs from ${txN(u.range)} range`, "Interceptors, Lancers, Hydras, defences: kill it and the field collapses; it can't hit aircraft"]; }, // v2.37
  get sovereign() { const u = UDEF.sovereign; return [`One building at a time: a visible ${txN(u.charge)} s charge, then a judgement beam for heavy single-target damage`, 'Anti-air during the charge; units and spread-out bases']; }, // v2.37
  get needlewing() { const u = UDEF.needlewing; return [`Exposed ground units in a pack: +${txP(u.swarm.per)} damage for each other Needlewing on the target (up to +${txP(u.swarm.max)})`, "Anything that hits air, splash; it can't hit aircraft"]; },
  get cloudwing() { const u = UDEF.cloudwing; return [`Overwhelming ground targets; while fighting it releases ${u.spawn.n} offspring every ${txN(u.spawn.cd)} s (${txN(u.spawn.life)} s life, at most ${SPAWN.max})`, "Anything that hits air; it can't hit aircraft"]; },
  get broodtyrant() { const u = UDEF.broodtyrant; return [`Buildings first, then ground units, with heavy globs from ${txN(u.range)} range`, "Interceptors, Heavies, Hydras, Turrets; it can't hit aircraft"]; },
  get worldrender() { const u = UDEF.worldrender; return [`Buildings above all, from right above them: it heals for ${txP(u.devour?.frac)} of the damage it does to buildings (at most ${txN(u.devour?.cap)} HP/s)`, "Burst anti-air before it starts feeding; it can't hit aircraft"]; }, // v2.37
};
const pFac = () => game ? game.sides[0].faction : DEFAULT_FACTION; // the player's faction (cards, panel and info)
const stat = (label, val) => `<div><small>${label}</small><b>${val}</b></div>`;
function showInfo(kind, type) {
  let name, sub, body;
  if (kind === 'u') {
    const d = UDEF[type], arm = { light: 'Light', heavy: 'Heavy', vehicle: 'Vehicle', air: 'Air' }[d.armor];
    const hits = d.hitsGround === false ? 'Air only' : d.hitsAir ? 'Ground, air' : 'Ground only';
    name = d.name; sub = d.spawned ? `Spawned by the ${BD(d.fac, d.from).name} · free, temporary` : `${BD(d.fac, d.from).name} T${d.tier}`; // v2.33: the Mite
    body = `<div class="istats">${stat('HP', d.hp)}${d.shp ? stat('Shields', d.shp) : ''}${d.weapon ? stat('Damage/s', Math.round(d.dmg / d.cd)) + stat('Range', d.range + (d.minRange ? ` (min ${d.minRange})` : '')) : d.heal ? stat('Heals', `${d.heal * 100}%/s`) + stat('Radius', d.healR) : stat('Sight', SIGHT[type]) + stat('Max', d.max)}${stat('Speed', d.speed)}
      ${stat('Armor', arm)}${stat('Shoots', hits)}${stat('Army size', d.pop)}${d.spawned ? stat('Lifespan', MOUND.life + 's') : stat('Build time', d.time + 's')}</div>
      <div class="irow"><em>Cost</em> ${d.spawned ? 'None: spawned free' : `${d.cost.c} credits${d.cost.e ? `, ${d.cost.e} energy` : ''}`}${d.splash ? ', splash damage' : ''}</div>
      <div class="irow"><em>Strong against</em> ${UNIT_TIPS[type][0]}</div>
      <div class="irow"><em>Weak against</em> ${UNIT_TIPS[type][1]}</div>`;
  } else if (kind === 'a') {
    const A = ABIL[type];
    name = A.name; sub = 'Commander ability';
    body = `<div class="istats">${stat('Credits', A.cost.c)}${stat('Energy', A.cost.e)}${stat('Cooldown', A.cd + 's')}${type === 'beam' ? stat('Strip', `${A.len}×${A.w * 2}`) : stat('Radius', A.r)}</div>
      <div class="irow">${A.tip}</div>
      <div class="irow"><em>Shared cooldown</em> Using any ability locks all three for the used one's cooldown (${(game ? abList(game.sides[0]) : ABIL_ORDER).map(k2 => `${ABIL[k2].name} ${ABIL[k2].cd} s`).join(', ')}).</div>
      <div class="irow"><em>Available</em> ${A.first} s after GO${A.req ? `, with ${A.reqTier ? 'your' : 'a'} ${abilReqText(A, pFac())}` : ''}. Tap the button, tap the battlefield, then tap inside the circle to confirm.</div>`;
  } else if (treeOf(pFac(), type)) { // a building with an upgrade tree
    const d = BD(pFac(), type), T = treeOf(pFac(), type);
    name = d.name; sub = (d.req ? `Requires ${BD(pFac(), d.req).name} · ` : '') + 'picks a path at T2';
    body = `<div class="istats">${stat('HP', d.hp)}${stat('Build time', d.time + 's')}${stat('Credits', d.cost.c)}${stat('Energy', d.cost.e)}</div><div class="irow"><em>T1</em> ${d.tiers[1]}</div>` +
      Object.keys(T).map(k => `<div class="irow"><em>Path ${k} · ${T[k].name}</em> T2 (${d.up[2].c}/${d.up[2].e}): ${T[k].steps[2].txt}. T3 (${d.up[3].c}/${d.up[3].e}): ${T[k].steps[3].txt}.</div>`).join('') +
      `<div class="irow">Each ${d.name} picks its own path; a second one can take the other. Selling resets it.</div>`;
  } else if (BD(pFac(), type) && BD(pFac(), type).noPad) { // the node bunker (v2.32)
    const d = BD(pFac(), type), G = d.gun;
    name = d.name; sub = `Free with the ${BD(pFac(), 'sigB').name}`;
    body = `<div class="istats">${stat('HP', d.hp)}${stat('Damage/s', Math.round(G[1].dmg / G[1].cd))}${stat('Range', G[1].range)}${stat('Shoots', 'Ground only')}${stat('Cost', 'None')}${stat('Rebuild', BUNKER.rebuild + 's')}</div>` +
      [1, 2, 3].map(t => `<div class="irow"><em>Depot T${t}</em> ${d.tiers[t]}</div>`).join('') +
      `<div class="irow">One on every field node you hold. Taking a node places it at once; losing the node destroys it. Destroyed while you still hold the node, it returns after ${BUNKER.rebuild} s. Uses no pad and no army size, and gives no Salvage.</div>`;
  } else {
    const d = BD(pFac(), type);
    name = d.name; sub = d.sig ? (sigPadOn() ? 'Signature building · on the signature pad, one of the two at a time' : 'Signature building · one at a time') + (d.req ? ` · requires ${BD(pFac(), d.req).name}` : '') : d.req ? `Requires ${BD(pFac(), d.req).name}` : '';
    body = `<div class="istats">${stat('HP', d.hp)}${d.shp ? stat('Shields', d.shp) : ''}${stat('Build time', d.time + 's')}${stat('Credits', d.cost.c)}${stat('Energy', d.cost.e)}</div>` +
      (prodLocked(pFac(), type) ? `<div class="irow">${d.lockMsg}: it stays at T1 for now.</div>` : '') +
      [1, 2, 3].map(t => `<div class="irow"><em>T${t}${t > 1 ? ` (${d.up[t].c} credits, ${d.up[t].e} energy)` : ''}</em> ${d.tiers[t]}</div>`).join('') +
      (type === 'sigA' && facOf(pFac()) === 'bloomhost' ? `<div class="irow"><em>Mite</em> ${UDEF.mite.hp} HP, ${(UDEF.mite.dmg / UDEF.mite.cd).toFixed(1)} damage/s, speed ${Math.round(UDEF.mite.speed)}, ground and buildings. Free and temporary: ${MOUND.life} s, no army size, never captures nodes, gives no Salvage. At most ${MOUND.max} at a time; the clutch waits while you are at the cap.</div>` : '') +
      (type === 'sigB' && facOf(pFac()) === 'bloomhost' ? `<div class="irow">Strengthens your creep; nothing else about creep changes. Lose the ${d.name} and the creep shrinks back to its normal reach.</div>` : '') +
      (type === 'sigA' && facOf(pFac()) === 'axiarchs' ? `<div class="irow">The bubble is power field like any other: warp in there, and shields recharge faster inside. It never stacks with your other field. Its anchor is your frontmost ground unit (else any unit), checked every second.</div>` : '') +
      (type === 'sigB' && facOf(pFac()) === 'axiarchs' ? `<div class="irow">An echo is left by each of your T2 or T3 units that dies (never temporary or recovered units). Echoes appear first on the Train tab: tap one to warp the unit back for half its cost, no production building needed. Lose the ${d.name} and every echo is lost.</div>` : '') +
      (type === 'sigA' && facOf(pFac()) === 'lastfist' ? `<div class="irow">Upgrades your Salvage: kills near your forces return credits. Lose the ${d.name} and Salvage drops back to ${Math.round(SALVAGE.pct * 100)}% and ${SALVAGE.cap} a minute.</div>` : '') +
      (type === 'sigB' && facOf(pFac()) === 'lastfist' ? `<div class="irow"><em>Node Bunker</em> ${BD(pFac(), 'bunker').hp} HP, ${Math.round(BD(pFac(), 'bunker').gun[1].dmg / BD(pFac(), 'bunker').gun[1].cd)} damage/s, ${BD(pFac(), 'bunker').gun[1].range} range. Free: one per node you hold, back ${BUNKER.rebuild} s after it falls while you hold the node. Lose the ${d.name} and every bunker goes with it.</div>` : '');
  }
  $('infoName').textContent = name; $('infoSub').textContent = sub; $('infoBody').innerHTML = body;
  $('info').classList.remove('hide'); document.body.classList.add('info-open');
}
function hideInfo() { $('info').classList.add('hide'); document.body.classList.remove('info-open'); }
$('infoX').addEventListener('click', hideInfo);
let lp = null;

function buildCards() {
  const wrap = $('cards'); wrap.innerHTML = '';
  const list = tab === 'build' ? BUILD_ORDER.filter(t => BD(pFac(), t) && (!BD(pFac(), t).sig || SIG.on)) : UNIT_ORDER.filter(t => !game || unitVisible(game, t)); // v2.32: signature roles only where the faction has them
  trainSig = game ? trainSigOf(game) : '';
  for (const type of list) {
    const d = tab === 'build' ? BD(pFac(), type) : UDEF[type];
    const el = document.createElement('button');
    el.className = 'card'; el.dataset.type = type;
    el.innerHTML = '<canvas class="ic"></canvas><span class="nm"></span><span class="cost"></span><span class="badge"></span><span class="bar"><i></i></span>';
    el.querySelector('.nm').textContent = d.name;
    drawIcon(el.querySelector('.ic'), tab === 'build' ? 'b' : 'u', type, pFac());
    const kind = tab === 'build' ? 'b' : 'u';
    el.addEventListener('pointerdown', () => { if (lp) clearTimeout(lp.timer); lp = { el, fired: false, timer: setTimeout(() => { lp.fired = true; showInfo(kind, type); }, 420) }; });
    for (const n of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(n, () => { if (lp && lp.el === el) clearTimeout(lp.timer); });
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('click', () => { if (lp && lp.el === el && lp.fired) { lp.fired = false; return; } hideInfo(); onCard(type, el); });
    el.addEventListener('animationend', () => el.classList.remove('shake'));
    if (tab === 'train' && UNIT_PATH[type]) el.insertAdjacentHTML('beforeend', `<span class="path">${UNIT_PATH[type].path.short}</span>`);
    if (tab === 'build' && d.sig && sigPadOn()) el.insertAdjacentHTML('beforeend', '<span class="path sg">★ SIG PAD</span>'); // v2.43: builds on the signature pad
    if (tab === 'train' && type === 'rifle') el.insertAdjacentHTML('beforeend', '<span class="path pr"></span>');
    if (tab === 'train' && d.max) el.insertAdjacentHTML('beforeend', '<span class="path mx"></span>'); // how many of a limited unit you have (v2.37)
    wrap.appendChild(el);
  }
  if (tab === 'train' && game && relOf(game, 0)) echoCards(wrap); // v2.34: the Echoes section, first
  if (tab === 'train' && game && facOf(game.sides[0].faction) === 'axiarchs') { wrap.insertBefore(warpCard(), wrap.firstChild); refreshWarpCard(); } // v2.26
  if (tab === 'train' && game && MAP_LANED && game.sides[0].direct) { // v2.74: which lane's base flag new units go to (tap a lane on the left to change it)
    const el = document.createElement('div'); el.className = 'trto'; el.id = 'trto'; el.dataset.type = 'other';
    el.innerHTML = `<small>Training to</small><b>${laneName(game.sides[0].active)}</b>`; wrap.insertBefore(el, wrap.firstChild);
  }
  if (tab === 'train' && game && !list.length) { // nothing to train yet: one line that says what unlocks it
    const el = document.createElement('div');
    el.className = 'trainHint'; el.dataset.type = 'other';
    el.textContent = trainHint(game);
    wrap.appendChild(el);
  }
  refreshUI(true);
}
// Train tab (v2.16): only units you can train now (a finished building, its tier and its chosen path). Units you can't
// afford still show, greyed out. The tab rebuilds when that set changes.
let trainSig = '';
const unitVisible = (g, type) => canTrain(g, 0, type);
const hiddenUnits = g => UNIT_ORDER.filter(t => !unitVisible(g, t));
const trainHint = g => { const n = BD(g.sides[0].faction, 'barracks').name; return g.ents.some(e => e.kind === 'b' && e.side === 0 && e.type === 'barracks' && e.hp > 0) ? `Units unlock when your ${n} is finished` : `Build a ${n} to train units`; };
const trainSigOf = g => { const h = hiddenUnits(g), rel = relOf(g, 0); return h.join(',') + (h.length === UNIT_ORDER.length && !rel ? '|' + trainHint(g) : '') + (rel ? `|e${rel.tier}:${(rel.ech || []).join(',')}` : ''); }; // v2.34: echoes rebuild the tab
/* ---------- Echoes (Axiarchs, v2.34): the Train tab's first section while you own an Echo Reliquary ----------
   A label with the count, then one card per stored echo (oldest first): tap it to warp the unit back for half its cost. */
function echoCards(wrap) {
  const rel = relOf(game, 0), list = rel.ech || [], hdr = document.createElement('div'), frag = document.createDocumentFragment();
  hdr.className = 'echoHdr'; hdr.dataset.type = 'other'; hdr.id = 'echoHdr';
  hdr.innerHTML = `Echoes<small>${list.length}/${ECHO.n[rel.tier]}</small>${list.length ? '' : '<small>none yet</small>'}`;
  frag.appendChild(hdr);
  list.forEach((type, i) => {
    const el = document.createElement('button');
    el.className = 'card echoc'; el.dataset.type = 'other'; el.dataset.echo = i; el.dataset.unit = type;
    el.innerHTML = '<canvas class="ic"></canvas><span class="nm"></span><span class="cost"></span><span class="path">ECHO</span>';
    el.querySelector('.nm').textContent = UDEF[type].name;
    drawIcon(el.querySelector('.ic'), 'u', type);
    el.addEventListener('click', () => { if (!game || game.over || paused) return; hideInfo(); const r = tryEcho(game, 0, i); toast(r.msg, r.ok ? 'ok' : 'bad'); if (!r.ok) shake(el); refreshUI(true); });
    frag.appendChild(el);
  });
  wrap.insertBefore(frag, wrap.firstChild);
}
function refreshEchoCards() {
  const s = game.sides[0], cap = popCap(game, 0), used = popUsed(game, 0);
  for (const el of $('cards').querySelectorAll('.card.echoc')) {
    const t = el.dataset.unit, k = echoCost(t), poor = s.res.c < k.c || s.res.e < k.e || used + UDEF[t].pop > cap;
    setHTML(el.querySelector('.cost'), costHTML(k, s.res, UDEF[t].pop)); el.classList.toggle('poor', !!poor);
  }
}

/* ---------- Set warp point (Axiarchs, v2.26) ----------
   The first card on the Train tab: tap it to arm, then tap a spot inside your power field. Tap the card again (or the
   banner's ×) to cancel. Units warp in at the warp point; a point left outside the field snaps back to the default. */
let wpt = false;
const WARP_ICON = '<svg viewBox="0 0 24 24" class="ic"><path d="M12 3l9 9-9 9-9-9z" fill="none" stroke="#9fe8ff" stroke-width="1.8"/><path d="M12 8l4 4-4 4-4-4z" fill="#9fe8ff"/></svg>';
function warpCard() {
  const el = document.createElement('button');
  el.className = 'card warpc'; el.dataset.type = 'other'; el.id = 'cWarp';
  el.innerHTML = `${WARP_ICON}<span class="nm">Warp point</span><span class="cost"></span>`;
  el.addEventListener('click', () => {
    if (!game || game.over || paused || !running) return;
    if (wpt) { endAim(); return; }
    endAim(); closePanel(); hideInfo();
    wpt = true;
    $('aim').style.setProperty('--ac', '#9fe8ff');
    $('aimName').textContent = 'Set warp point'; $('aimTxt').textContent = ': tap a spot inside your power field';
    $('aim').classList.remove('hide'); refreshWarpCard();
  });
  return el;
}
function refreshWarpCard() { const el = $('cWarp'); if (el && game) el.querySelector('.cost').textContent = wpt ? 'Cancel' : game.sides[0].warp ? 'Moved · tap to set' : 'Front · tap to set'; }
function wptTap(x, y) {
  const w = toWorld(x, y), r = setWarp(game, 0, w.x, w.y / DY);
  toast(r.msg, r.ok ? 'ok' : 'bad');
  if (r.ok) endAim(); else $('aimTxt').textContent = `: ${r.msg.toLowerCase()}`;
}
function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function onCard(type, el) {
  if (!game || game.over || paused) return;
  if (game.spectate) { toast('Spectating: the AIs play both sides', 'warn'); return; }
  const r = tab === 'build' ? tryBuild(game, 0, type, selPad) : tryTrain(game, 0, type);
  if (r.ok) { toast(r.msg, 'ok'); if (tab === 'build' && selPad >= 0) closePanel(); }
  else { toast(r.msg, 'bad'); shake(el); }
  refreshUI(true);
}

const fmtPop = p => p % 1 ? (p < 1 ? '½' : `${Math.floor(p)}½`) : String(p); // supply in halves (S1, v2.37)
function costHTML(cost, res, pop) {
  let h = `<span class="${res.c < cost.c ? 'no' : ''}"><i class="dot c"></i>${cost.c}</span>`;
  if (cost.e) h += `<span class="${res.e < cost.e ? 'no' : ''}"><i class="dot e"></i>${cost.e}</span>`;
  if (pop) h += `<span><i class="dot p"></i>${fmtPop(pop)}</span>`;
  return h;
}
function setHTML(el, h) { if (el.innerHTML !== h) el.innerHTML = h; }

const HQ_STATE = { shielded: 'Shielded', exposed: 'Exposed', destroyed: 'Destroyed' };
