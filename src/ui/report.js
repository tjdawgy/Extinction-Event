/* ---------- Post-match screen tabs (v2.52, Phase 0 item 5) ----------
   Overview: the result in numbers, key moments, Copy match log. Economy: canvas line graphs from the stats tracker
   (STATS, every 10 s): income per minute, army value and units alive, both sides. Army: units built and lost by type,
   damage dealt, buildings built and lost. Enemy Timeline: what the enemy built and when, when it teched (tier and path),
   its first unit of each type, and when it changed strategy (attacks, feints, sieges, the reads that change an AI's plan,
   and shifts in what it produced). The enemy's side is revealed only here, after the match. */
const REP_COL = ['#39c8ff', '#ff4d4d'];
function repOverview(g) {
  const L = g.log, M = logMoments(g);
  return `<div class="tbar"><button class="ghost" id="bCopy">Copy match log</button><span class="note" id="copyMsg" style="margin:0">The full log of both sides, as text</span></div>${repSummary(g)}
    <h4 class="sh">Key moments</h4><ul class="tl">${M.map(m => `<li><b>${mmss(m.t)}</b><span>${m.txt}</span>${m.tag ? `<span class="tag">${m.tag}</span>` : ''}</li>`).join('') || '<li>No major moments were recorded.</li>'}</ul>${repFrom(L)}`;
}
const repNoStats = '<p class="note">This match has no stats record (it was resumed from a save older than v2.51).</p>';
// Income per minute from the 10 s windows, averaged over 30 s so one sale or Salvage burst doesn't spike the line
const repPerMin = a => a.map((_, i) => { const w = a.slice(Math.max(0, i - 2), i + 1); return w.reduce((x, y) => x + y, 0) / w.length * 60 / STATS.every; });
const REP_GRAPHS = [
  { id: 'rgInc', title: 'Income', note: 'credits gathered per minute (income and Salvage; 30 s average)', get: D => repPerMin(D.c) },
  { id: 'rgEn', title: 'Energy income', note: 'energy gathered per minute', get: D => repPerMin(D.e) },
  { id: 'rgArmy', title: 'Army value', note: 'credits + energy of living units', get: D => D.army },
  { id: 'rgAlive', title: 'Units alive', note: 'temporary units not counted', get: D => D.alive },
];
function repEconomy(g) {
  const S = g.stats; if (!S || !S.sides[0].c.length) return S ? '<p class="note">The match ended before the first 10 s sample.</p>' : repNoStats;
  const sum = a => a.reduce((x, y) => x + y, 0), D = S.sides, mins = Math.max(1 / 6, D[0].c.length * STATS.every / 60);
  const row = (h, f) => `<tr><th>${h}</th><td>${f(D[0])}</td><td class="e">${f(D[1])}</td></tr>`;
  return `<p class="note" style="margin-top:0"><span style="color:${REP_COL[0]}">■ You</span> · <span style="color:${REP_COL[1]}">■ Enemy</span> · sampled every ${STATS.every} s of game time${S.from > 0 ? ` from ${mmss(S.from)}` : ''}</p>
    <div class="rgrid">${REP_GRAPHS.map(G => `<div><h4 class="sh">${G.title} <span class="note">(${G.note})</span></h4><canvas class="rgraph" id="${G.id}" role="img" aria-label="${G.title} over time, both sides"></canvas></div>`).join('')}</div>
    <table><tr><th></th><td><b>You</b></td><td class="e"><b>Enemy</b></td></tr>
    ${row('Credits gathered', d => fmtN(sum(d.c)))}${row('Energy gathered', d => fmtN(sum(d.e)))}
    ${row('Average income per minute', d => `${fmtN(sum(d.c) / mins)} credits, ${fmtN(sum(d.e) / mins)} energy`)}
    ${row('Peak army value', d => fmtN(Math.max(0, ...d.army)))}${row('Most units alive', d => fmtN(Math.max(0, ...d.alive)))}</table>`;
}
function repGraphs(g) { // draws the Economy tab's canvases at the size the layout gave them
  const S = g.stats; if (!S) return;
  for (const G of REP_GRAPHS) { const cv = $(G.id); if (cv) repGraph(cv, [G.get(S.sides[0]), G.get(S.sides[1])], S.from); }
}
function repGraph(cv, series, t0) {
  const dpr = Math.min(3, window.devicePixelRatio || 1), W = Math.max(120, cv.clientWidth || 280), H = Math.max(60, cv.clientHeight || 96);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const c = cv.getContext('2d'); if (!c) return;
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  const n = Math.max(series[0].length, series[1].length), top = Math.max(1, ...series[0], ...series[1]);
  const x0 = 38, x1 = W - 6, y0 = 6, y1 = H - 16;
  const X = i => x0 + (n > 1 ? i / (n - 1) : 0) * (x1 - x0), Y = v => y1 - v / top * (y1 - y0);
  c.font = '10px system-ui, -apple-system, sans-serif'; c.fillStyle = '#8fa3c4'; c.strokeStyle = 'rgba(120,150,200,.18)'; c.lineWidth = 1;
  for (const f of [0, 0.5, 1]) { const y = Math.round(Y(top * f)) + 0.5; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); c.textAlign = 'right'; c.fillText(fmtN(top * f), x0 - 4, y + 3); }
  const t1 = t0 + Math.max(1, n) * STATS.every;
  for (const f of [0, 0.5, 1]) { c.textAlign = f === 0 ? 'left' : f === 1 ? 'right' : 'center'; c.fillText(mmss(t0 + STATS.every + f * (t1 - t0 - STATS.every)), x0 + f * (x1 - x0), H - 3); }
  c.lineJoin = 'round'; c.lineWidth = 2;
  for (const s of [1, 0]) { const a = series[s]; if (!a.length) continue; c.strokeStyle = REP_COL[s]; c.beginPath(); a.forEach((v, i) => i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))); c.stroke(); }
}
function repArmy(g) {
  const S = g.stats; if (!S) return repNoStats;
  const D = S.sides, ks = Object.keys(UDEF).filter(k => D[0].built[k] || D[0].lost[k] || D[1].built[k] || D[1].lost[k]);
  const top = Math.max(1, ...ks.flatMap(k => [D[0].built[k] || 0, D[1].built[k] || 0]));
  const bar = (n, lost, s) => `<span class="rbar"><i style="width:${(n / top * 100).toFixed(1)}%;background:${REP_COL[s]}"></i><i class="l" style="width:${(Math.min(lost, n || lost) / top * 100).toFixed(1)}%"></i></span><span class="rn">${n || 0}<small> / ${lost || 0}</small></span>`;
  const bRow = (h, o) => `<tr><th>${h}</th>${[0, 1].map(s => `<td${s ? ' class="e"' : ''}>${Object.keys(o(D[s])).map(k => `${logBName(g, s, k)}${o(D[s])[k] > 1 ? ' ×' + o(D[s])[k] : ''}`).join(', ') || '–'}</td>`).join('')}</tr>`;
  const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
  return `<table class="rarmy"><tr><th>Unit</th><td><b>You</b> <small>built / lost</small></td><td class="e"><b>Enemy</b> <small>built / lost</small></td></tr>
    ${ks.map(k => `<tr><th>${UDEF[k].name}</th><td>${bar(D[0].built[k] || 0, D[0].lost[k] || 0, 0)}</td><td>${bar(D[1].built[k] || 0, D[1].lost[k] || 0, 1)}</td></tr>`).join('') || '<tr><th>No units were trained.</th><td></td><td></td></tr>'}
    <tr><th>All units</th><td>${sum(D[0].built)} built, ${sum(D[0].lost)} lost</td><td class="e">${sum(D[1].built)} built, ${sum(D[1].lost)} lost</td></tr></table>
    <p class="note">The bar is units built; its darker end, units lost.</p>
    <h4 class="sh">Damage and buildings</h4>
    <table><tr><th></th><td><b>You</b></td><td class="e"><b>Enemy</b></td></tr>
    <tr><th>Damage dealt</th><td>${fmtN(D[0].dmg)} <small>(${fmtN(D[0].dmgB)} to buildings)</small></td><td class="e">${fmtN(D[1].dmg)} <small>(${fmtN(D[1].dmgB)} to buildings)</small></td></tr>
    ${bRow('Buildings built', d => d.bBuilt)}${bRow('Buildings destroyed', d => d.bLost)}</table>`;
}
// What changed the AI's plan, in the player's words (log 'G': an attack's mode, a feint, or a read)
const REP_STRAT = { raid: 'Sent a raid at a field node', turtle: 'Saw your Turrets and changed its plan', rush: 'Saw your early rush and changed its plan', greed: 'Saw your greedy economy and changed its plan',
  siege: 'Moved up to siege your base', all: 'Attacked with its whole army', field: 'Pushed out to fight for the field' };
const UNIT_ROLE = t => { const d = UDEF[t]; return d.air ? 'aircraft' : d.range >= 300 ? 'long-range units' : (d.cost.c + d.cost.e) >= 250 ? 'heavy units' : d.melee ? 'melee units' : 'light infantry'; };
function repEnemyEvents(g) {
  const L = g.log, S = g.stats, s = 1, out = [], P = g.sides[s].persona || {}, fac = g.sides[s].faction;
  if (P.kind) out.push({ t: 0, tag: 'Strategy', txt: `Opened as ${PERSONA_NAME[P.kind] || P.kind}` });
  const seenUnit = {};
  for (const e of L ? L.ev : []) {
    if (e[1] !== s) continue;
    const [t, , k, a] = e;
    if (k === 'F') out.push({ t, tag: a === 'sigA' || a === 'sigB' ? 'Signature' : 'Build', txt: `Built ${logBName(g, s, a)}` });
    else if (k === 'T' && !seenUnit[a]) { seenUnit[a] = 1; if (UDEF[a]) out.push({ t, tag: 'Unit', txt: `First ${UDEF[a].name}` }); }
  }
  if (S) {
    const D = S.sides[s], started = {};
    for (const x of D.tech) {
      if (x[3] === 'start') { started[x[1] + x[2]] = x[4]; continue; }
      const path = started[x[1] + x[2]], T = treeOf(fac, x[1]);
      out.push({ t: x[0], tag: 'Tech', txt: `${logBName(g, s, x[1])} reached T${x[2]}${path && T && T[path] ? ` · ${T[path].name}` : ''}` });
    }
    for (const x of D.strat) out.push({ t: x[0], tag: 'Strategy', txt: x[2] ? 'Feinted an attack, then pulled back' : REP_STRAT[x[1]] || 'Launched an attack' });
    for (const x of D.abil) out.push({ t: x[0], tag: 'Ability', txt: `Used ${ABIL[x[1]] ? ABIL[x[1]].name : x[1]}` });
    for (const x of D.nodes) out.push({ t: x[0], tag: 'Node', txt: `${x[2] ? 'Captured' : 'Lost'} the ${NODE_NAME[x[1]]} field node` });
  }
  // shifts in production: the unit role it spent most on, per 2-minute window, when that changes
  if (L) {
    const W = 120, win = {};
    for (const e of L.ev) if (e[1] === s && e[2] === 'T' && UDEF[e[3]]) { const w = Math.floor(e[0] / W), r = UNIT_ROLE(e[3]), d = UDEF[e[3]], o = win[w] || (win[w] = {}); o[r] = (o[r] || 0) + e[4] * (d.cost.c + d.cost.e); }
    let prev = null;
    for (const w of Object.keys(win).map(Number).sort((a, b) => a - b)) {
      const o = win[w], tot = Object.values(o).reduce((a, b) => a + b, 0), top = Object.keys(o).sort((a, b) => o[b] - o[a])[0];
      if (tot < 400 || o[top] < tot * 0.5) continue; // too little, or no clear focus
      if (prev && top !== prev) out.push({ t: w * W, tag: 'Strategy', txt: `Switched production to mostly ${top}` });
      prev = top;
    }
  }
  return out.sort((a, b) => a.t - b.t);
}
function repEnemy(g) {
  const E = repEnemyEvents(g), P = g.sides[1].persona || {};
  return `<p class="note" style="margin-top:0">${factionName(g.sides[1].faction)}, played by ${PERSONA_NAME[P.kind] || 'the AI'}. Revealed after the match: during play you saw only what your units could see.</p>
    <ul class="tl ren">${E.map(m => `<li><b>${mmss(m.t)}</b><span class="tag t${m.tag}">${m.tag}</span><span>${m.txt}</span></li>`).join('') || '<li>Nothing was recorded.</li>'}</ul>${repFrom(g.log)}`;
}
function repText(g) {
  const R = g.result || {}, win = g.winner === 0;
  const res = R.how === 'draw' ? `Draw (${R.by === 'storm' || R.reason === 'storm' ? 'the Extinction Event' : 'mutual extinction'})` : `${win ? 'Victory' : 'Defeat'}, ${R.how === 'score' ? `decided by ${R.by || 'score'} (${R.reason === 'limit' ? 'storm peak' : 'both HQs fell'})` : R.how === 'storm' ? `${win ? 'enemy' : 'your'} HQ fell to the Extinction Event` : `${win ? 'enemy' : 'your'} HQ destroyed`}`;
  return logText(g, { version: VERSION, diff: (DIFF[g.diffKey] || DIFF.normal).label, persona: PERSONA_NAME[(g.sides[1].persona || {}).kind] || 'unknown', result: res });
}
function repCopy() {
  const text = repText(game), done = () => { const m = $('copyMsg'); if (m) { m.textContent = 'Copied'; m.className = 'ok'; } };
  const fallback = () => { // clipboard blocked (some iPhone Safari cases): show the text selected, ready for the Copy menu
    const box = document.createElement('div'); box.className = 'cpy';
    box.innerHTML = '<p><b>Copy match log</b>: this browser blocked the clipboard. The text is selected: tap <b>Copy</b>, or press and hold to select it.</p><textarea readonly></textarea><button class="ghost">Close</button>';
    const ta = box.querySelector('textarea'); ta.value = text;
    box.querySelector('button').addEventListener('click', () => box.remove());
    $('box').appendChild(box); ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
    try { if (document.execCommand('copy')) done(); } catch (e) {}
  };
  try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, fallback); return; } } catch (e) {}
  fallback();
}

