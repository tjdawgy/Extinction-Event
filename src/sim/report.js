/* ---------- Match report (v2.9): read-only views of the match log, used only once the match is over ---------- */
const mmss = t => { t = Math.max(0, Math.floor(t)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
const NODE_NAME = ['west', 'centre', 'east'];
const LINE_MAX = 80; // per side; unit groups are widened only past this
// A building role's name as side s's faction calls it (the log is read only after the match, when factions are revealed)
const logBName = (g, s, t) => { const d = BD(g && g.sides[s] ? g.sides[s].faction : DEFAULT_FACTION, t); return d ? d.name : t; };
function logEvText(e, me, g) { // one log event as a line of text (me: written from the player's point of view; g: for faction names)
  const [, , c, a, b, x] = e, B = t => logBName(g, e[1], t);
  switch (c) {
    case 'B': return `${B(a)} started (not finished)`; // a finished one shares the line with its finish (logLines)
    case 'F': return `${B(a)} finished`;
    case 'U': { const T = treeOf(g && g.sides[e[1]] ? g.sides[e[1]].faction : DEFAULT_FACTION, a); return `${B(a)} upgrade to T${b}${e[6] && T ? ` · ${T[e[6]].name}` : ''} started (not finished)`; }
    case 'V': return `${B(a)} upgraded to T${b}`;
    case 'S': return `${B(a)} sold`;
    case 'D': return `${B(a)} destroyed${x === -1 ? ' by the storm' : ''}`;
    case 'N': return `Captured the ${NODE_NAME[a] || ''} field node`;
    case 'L': return `Lost the ${NODE_NAME[a] || ''} field node`;
    case 'A': return a === 'strike' ? `Orbital Strike: ${Math.round(b || 0)} damage, ${x || 0} destroyed` : a === 'shield' ? `Emergency Shield: ${Math.round(b || 0)} damage blocked` : a === 'repair' ? `Repair Pulse: ${Math.round(b || 0)} HP restored`
      : a === 'frenzy' ? `Frenzy Bloom: ${Math.round(b || 0)} organisms frenzied` : a === 'brood' ? `Emergency Brood: ${Math.round(b || 0)} Skitterlings hatched`
      : a === 'mwarp' ? `Mass Warp: ${Math.round(b || 0)} units warped` : a === 'overcharge' ? `Shield Overcharge: ${Math.round(b || 0)} damage blocked, ${Math.round(x || 0)} shields restored` // v2.28
      : a === 'beam' ? `Purification Beam: ${Math.round(b || 0)} damage, ${x || 0} destroyed` : `Corrosive Bloom: ${Math.round(b || 0)} damage, ${x || 0} destroyed`;
    case 'H': return 'HQ shield down';
    case 'O': return `Order: ${a === 'all' ? 'whole army' : a === 'group' ? GROUP_NAME[b] : (PLURAL[b] || b)} ${ORDER_NAME[x] ? ORDER_NAME[x].toLowerCase() : x}`;
    case 'G': return b ? 'Feint attack launched (pulled back)' : a === 'turtle' || a === 'rush' || a === 'greed' ? `Read the enemy's ${a === 'turtle' ? 'Turrets' : a === 'rush' ? 'rush' : 'greedy economy'}; changed plan` : `Attack launched${a === 'siege' ? ' (siege)' : ''}`; // v2.52: a read is not an attack
    case 'W': return 'Extinction Event warning (30 s)';
    case 'X': return 'Extinction Event began';
    case 'E': return a === 'draw' ? 'Match ended: draw (the Extinction Event)' : `Match ended: ${b === 0 ? 'you won' : 'you lost'}`; // the player's view, in both columns
    case 'T': case 'K': { const n = UDEF[a] ? UDEF[a].name : a; return `${c === 'K' ? 'Lost ' : ''}${n}${b > 1 ? ` ×${b}, ${mmss(e[0])}–${mmss(x)}` : ''}`; }
  }
  return c;
}
// One side's timeline: key events one per line, units in groups (60 s or 10 units). Groups are widened only if the side
// would have more than LINE_MAX lines; key events are never merged or cut. When key events alone nearly fill the list,
// unit groups are widened only until about 20 unit lines are left, so the pace of production still shows.
// Storm and end lines appear on both sides.
function logLines(g, s, widen = true) { // widen: the screen may widen unit groups; the copied text never does
  const L = g.log, ev = [];
  if (L) L.ev.forEach((e, i) => { if (e[1] === s || e[1] === -1) { const c = e.slice(); c.i = i; ev.push(c); } }); // c.i: log order, for ties
  // v2.10: a build or upgrade and its finish share one line ('Refinery 00:02 → 00:12', 'Refinery T2 05:10 → 05:22'),
  // matched by building id (by order per type for a log saved before ids were recorded)
  const openB = {};
  for (let i = 0; i < ev.length; i++) {
    const e = ev[i], c = e[2];
    if (c === 'B' || c === 'U') { const k = c + e[3] + (c === 'U' ? e[4] : '') + (c === 'B' ? (e[4] ?? '') : (e[5] ?? '')); (openB[k] || (openB[k] = [])).push(e); }
    else if (c === 'F' || c === 'V') {
      const k = (c === 'F' ? 'B' : 'U') + e[3] + (c === 'V' ? e[4] : '') + (c === 'F' ? (e[4] ?? '') : (e[5] ?? '')), q = openB[k];
      if (q && q.length) { q.shift().done = e[0]; ev[i] = null; }
    }
  }
  for (let i = ev.length - 1; i >= 0; i--) if (!ev[i]) ev.splice(i, 1);
  const keys = ev.filter(e => e[2] !== 'T' && e[2] !== 'K').length, target = Math.max(LINE_MAX, keys + 20);
  for (const [gap, span, n] of widen ? [[90, 120, 20], [180, 300, 50], [600, 900, 200], [1e9, 1e9, 1e9]] : []) {
    if (ev.length <= target) break;
    const open = {};
    for (let i = 0; i < ev.length; i++) {
      const e = ev[i]; if (e[2] !== 'T' && e[2] !== 'K') continue;
      const k = e[2] + e[3], p = open[k];
      if (p && e[0] - p[5] <= gap && e[5] - p[0] <= span && p[4] + e[4] <= n) { p[4] += e[4]; p[5] = e[5]; ev[i] = null; continue; }
      open[k] = e;
    }
    for (let i = ev.length - 1; i >= 0; i--) if (!ev[i]) ev.splice(i, 1);
  }
  const B = t => logBName(g, s, t), txt = e => e.done === undefined ? logEvText(e, s === 0, g) : e[2] === 'B' ? `${B(e[3])} ${mmss(e[0])} → ${mmss(e.done)}` : `${B(e[3])} T${e[4]}${e[6] && treeOf(g.sides[s].faction, e[3]) ? ` · ${treeOf(g.sides[s].faction, e[3])[e[6]].name}` : ''} ${mmss(e[0])} → ${mmss(e.done)}`;
  return ev.map(e => { const u = e[2] === 'T' || e[2] === 'K'; return { t: e[0], i: e.i, key: !u, code: e[2], txt: txt(e), type: u ? e[3] : null, n: u ? e[4] : 0, t1: u ? e[5] : e.done ?? e[0], paired: e.done !== undefined }; });
}
function logBattles(g) { // runs of 10-s buckets with unit losses; value = credits + energy of the units lost
  const L = g.log; if (!L) return [];
  const ks = [...new Set([...Object.keys(L.loss[0]), ...Object.keys(L.loss[1])].map(Number))].sort((a, b) => a - b), out = [];
  let cur = null;
  for (const k of ks) {
    if (!cur || k > cur.k1 + 1) { cur = { k0: k, k1: k, v: [0, 0], n: [0, 0], u: 0, m: 0 }; out.push(cur); }
    cur.k1 = k;
    for (const s of [0, 1]) { const r = L.loss[s][k]; if (r) { cur.v[s] += r[0]; cur.n[s] += r[1]; cur.u += r[2]; cur.m += r[1]; } }
  }
  return out.map(b => ({ t0: b.k0 * LOG_BUCKET, t1: (b.k1 + 1) * LOG_BUCKET, v: b.v, n: b.n, u: b.u / b.m }));
}
const zoneOf = u => u < L * 0.3 ? 'near your base' : u > L * 0.7 ? 'near the enemy base' : 'mid-field';
function logMoments(g) { // up to 8 recorded turning points, in time order
  const L = g.log; if (!L) return [];
  const c = [], who = s => s === 0 ? 'Your' : 'Enemy', big = logBattles(g).filter(b => b.v[0] + b.v[1] >= 400).sort((a, b) => (b.v[0] + b.v[1]) - (a.v[0] + a.v[1])).slice(0, 3);
  const worst = big.reduce((m, b) => b.v[0] - b.v[1] > (m ? m.v[0] - m.v[1] : 0) ? b : m, null), best = big.reduce((m, b) => b.v[1] - b.v[0] > (m ? m.v[1] - m.v[0] : 0) ? b : m, null);
  for (const b of big) c.push({ t: b.t0, p: 6 + (b.v[0] + b.v[1]) / 1000, txt: `Battle ${zoneOf(b.u)}, ${mmss(b.t0)}–${mmss(b.t1)}: you lost ${b.n[0]} units (${b.v[0]}), the enemy lost ${b.n[1]} (${b.v[1]})`, tag: b === worst ? 'largest loss' : b === best ? 'largest win' : '' });
  const firstUnit = {};
  for (const e of L.ev) {
    const [t, s, k, a, b] = e;
    if (k === 'H') { if (!c.some(m => m.h === s && t - m.t < 60)) c.push({ t, p: 9, h: s, txt: `${who(s)} HQ shield went down` }); } // once a minute: it can flicker as buildings fall and rise
    else if (k === 'D' && a === 'hq') c.push({ t, p: 10, txt: `${who(s)} ${logBName(g, s, 'hq')} destroyed${e[5] === -1 ? ' by the storm' : ''}` });
    else if (k === 'D' && ['factory', 'techlab', 'turret', 'refinery'].includes(a)) c.push({ t, p: 5, txt: `${who(s)} ${logBName(g, s, a)} destroyed` });
    else if (k === 'N' || k === 'L') c.push({ t, p: k === 'L' ? 4 : 3, txt: `${s === 0 ? 'You' : 'The enemy'} ${k === 'N' ? 'captured' : 'lost'} the ${NODE_NAME[a]} field node` });
    else if (k === 'A' && a === 'corrosive' && b >= 400) c.push({ t, p: 5 + b / 1000, txt: `${s === 0 ? 'Your' : 'Enemy'} Corrosive Bloom: ${b} damage, ${e[5]} destroyed` });
    else if (k === 'A' && a === 'beam' && b >= 400) c.push({ t, p: 5 + b / 1000, txt: `${s === 0 ? 'Your' : 'Enemy'} Purification Beam: ${b} damage, ${e[5]} destroyed` }); // v2.28
    else if (k === 'A' && a === 'strike' && b >= 400) c.push({ t, p: 5 + b / 1000, txt: `${s === 0 ? 'Your' : 'Enemy'} Orbital Strike: ${b} damage, ${e[5]} destroyed` });
    else if (k === 'T' && ['titan', 'aircraft', 'artillery'].includes(a) && !firstUnit[s + a]) { firstUnit[s + a] = 1; c.push({ t, p: 2, txt: `${s === 0 ? 'Your' : 'Enemy'} first ${UDEF[a].name}` }); }
    else if (k === 'X') c.push({ t, p: 8, txt: 'The Extinction Event began' });
  }
  return c.sort((a, b) => b.p - a.p).slice(0, 8).sort((a, b) => a.t - b.t);
}
// Credits (i 0) or energy (i 1) a side gathered (v2.36): what it started with, income, sales and Salvage, so what it spent
// can never be more. A log resumed from an older save (L.from > 0) didn't see the start, so it isn't counted there.
const logGathered = (L, T, i) => (L.from > 0 ? 0 : i ? START_RES.e : START_RES.c) + T.earn[i] + T.sold[i] + ((i ? T.salvE : T.salv) || 0);
// The copied match log: plain text, one chronological list tagged [ME] / [ENEMY] / [ALL], same grouping as the screen
function logText(g, meta) {
  const L = g.log, T = L.tot, R = g.result || {}, nm = t => UDEF[t].name, lines = [];
  const units = (tr, lo) => Object.keys(UDEF).filter(k => tr[k] || lo[k]).map(k => `${nm(k)} ${tr[k] || 0} (${lo[k] || 0} lost)`).join(', ') || 'none';
  const res = s => { const t = T[s], sp = Object.values(t.spent); return `credits ${Math.round(logGathered(L, t, 0)).toLocaleString('en')} gathered / ${Math.round(sp.reduce((a, b) => a + b[0], 0)).toLocaleString('en')} spent; energy ${Math.round(logGathered(L, t, 1)).toLocaleString('en')} / ${Math.round(sp.reduce((a, b) => a + b[1], 0)).toLocaleString('en')}`; };
  const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
  lines.push(`Extinction Event v${meta.version} · ${meta.diff} · vs ${meta.persona}`);
  lines.push(`Result: ${meta.result} · ${mmss(g.t)}`);
  lines.push(`Factions: you ${factionName(g.sides[0].faction)}, enemy ${factionName(g.sides[1].faction)}`);
  if (L.from > 0) lines.push(`Recorded from ${mmss(L.from)} (resumed from an older save); earlier events are not included.`);
  for (const s of [0, 1]) { lines.push(`${s ? 'Enemy' : 'You'}: ${res(s)}${facOf(g.sides[s].faction) === 'lastfist' ? `; salvage ${Math.round(T[s].salv || 0).toLocaleString('en')} credits${T[s].salvE ? ` and ${Math.round(T[s].salvE).toLocaleString('en')} energy` : ''}` : ''}`); lines.push(`  Units built ${sum(T[s].trained)}, lost ${sum(T[s].lost)}: ${units(T[s].trained, T[s].lost)}`); }
  lines.push('TIMELINE');
  const all = [];
  for (const s of [0, 1]) for (const l of logLines(g, s, false)) if (s === 0 || !['W', 'X', 'E'].includes(l.code)) all.push({ ...l, tag: ['W', 'X', 'E'].includes(l.code) ? 'ALL' : s ? 'ENEMY' : 'ME' });
  all.sort((a, b) => a.t - b.t || a.i - b.i);
  for (const l of all) lines.push(`${mmss(l.t)} [${l.tag}] ${l.txt}`);
  if (L.dropped) lines.push(`(Very long match: ${L.dropped} early unit lines were dropped to keep the log small; the totals above still count them.)`);
  return lines.join('\n');
}
/* ===================== SIM END ===================== */

