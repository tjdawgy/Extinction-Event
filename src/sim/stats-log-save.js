/* ---------- Stats tracker (v2.51, Phase 0 item 4) ----------
   One record per match, per side, for the post-match screen and the match history. Written by the SIM through the hooks
   below and never read by it, so play is unchanged (it draws no random numbers). Per side:
   - every STATS.every s of game time: credits and energy gathered in that window (income, Salvage; not sales), army value
     (credits + energy of living units), units alive, bank;
   - units built and lost by type; buildings built (finished) and destroyed by role; damage dealt (to HP and shields);
   - timestamped lists: node captures/losses, tech (upgrades started with their path, tiers reached), signature buildings
     finished, ability uses, and the AI's strategy moves (attacks, feints, sieges, the reads that change its plan);
   - at the end: result (win / loss / draw), faction, difficulty, match length.
   Bounded: STATS.max samples (a full 27:00 match takes 163) and STATS.maxEv timestamped entries per list. */
const STATS = { every: 10, max: 200, maxEv: 120 };
const newStatSide = () => ({ c: [], e: [], army: [], alive: [], bank: [], built: {}, lost: {}, bBuilt: {}, bLost: {}, dmg: 0, dmgB: 0,
  nodes: [], tech: [], sig: [], abil: [], strat: [], gc: 0, ge: 0 });
const newStats = t0 => ({ v: 1, from: t0, next: (Math.floor(t0 / STATS.every) + 1) * STATS.every, sides: [newStatSide(), newStatSide()], result: null });
const stT = g => Math.round(g.t * 10) / 10;
const stPush = (a, x) => { if (a.length < STATS.maxEv) a.push(x); };
function statsIncome(g, s, c, e) { const S = g.stats; if (!S) return; const d = S.sides[s]; d.gc += c; d.ge += e; }
function statsTick(g) {
  const S = g.stats; if (!S || g.t < S.next) return;
  S.next += STATS.every;
  const v = [0, 0], n = [0, 0];
  for (const e of g.ents) if (e.kind === 'u' && e.hp > 0 && !e.temp) { v[e.side] += UDEF[e.type].cost.c + UDEF[e.type].cost.e; n[e.side]++; }
  for (const s of [0, 1]) {
    const d = S.sides[s]; if (d.c.length >= STATS.max) continue;
    d.c.push(Math.round(d.gc)); d.e.push(Math.round(d.ge)); d.gc = 0; d.ge = 0;
    d.army.push(v[s]); d.alive.push(n[s]); d.bank.push(Math.round(g.sides[s].res.c));
  }
}
function statsDamage(g, e, amt, fromSide) { // amt: HP and shields actually taken off e
  const S = g.stats; if (!S || !(fromSide === 0 || fromSide === 1) || fromSide === e.side || !(amt > 0)) return;
  S.sides[fromSide].dmg += amt; if (e.kind === 'b') S.sides[fromSide].dmgB += amt;
}
function statsEvent(g, s, code, a, b, c, d) { // called by lg (every key event) and lgUnit (units trained or lost)
  const S = g.stats; if (!S || !(s === 0 || s === 1)) return;
  const D = S.sides[s], t = stT(g), add = (o, k) => { o[k] = (o[k] || 0) + 1; };
  switch (code) {
    case 'T': add(D.built, a); break;
    case 'K': add(D.lost, a); break;
    case 'F': add(D.bBuilt, a); if (a === 'sigA' || a === 'sigB') stPush(D.sig, [t, a]); break;
    case 'D': add(D.bLost, a); break;
    case 'U': stPush(D.tech, [t, a, b, 'start', d || null]); break; // upgrade started: role, tier, path
    case 'V': stPush(D.tech, [t, a, b, 'done']); break;
    case 'N': case 'L': stPush(D.nodes, [t, a, code === 'N' ? 1 : 0]); break;
    case 'A': stPush(D.abil, [t, a]); break;
    case 'G': stPush(D.strat, [t, a, b ? 1 : 0]); break; // attack (mode), feint (b), or a read: turtle / rush / greed
  }
}
function statsEnd(g) {
  const S = g.stats; if (!S) return;
  const res = s => g.winner < 0 ? 'draw' : g.winner === s ? 'win' : 'loss';
  S.result = { len: Math.round(g.t), how: (g.result || {}).how || null, reason: (g.result || {}).reason || null, diff: g.diffKey,
    sides: [0, 1].map(s => ({ res: res(s), faction: facOf(g.sides[s].faction), persona: (g.sides[s].persona || {}).kind || null })) };
}
// The compact summary a finished match leaves in the match history (the UI stores it; no timelines, just totals)
function statsSummary(g, meta = {}) {
  const S = g.stats; if (!S || !S.result) return null;
  const sum = o => Object.values(o).reduce((a, b) => a + b, 0), R = S.result;
  return { v: 1, ver: VERSION, at: meta.at || 0, seed: g.seed, len: R.len, how: R.how, reason: R.reason, diff: R.diff, from: S.from,
    sides: [0, 1].map(s => { const D = S.sides[s], r = R.sides[s];
      return { res: r.res, faction: r.faction, persona: r.persona, credits: sum(D.c), energy: sum(D.e), peakArmy: Math.max(0, ...D.army), dmg: Math.round(D.dmg),
        built: D.built, lost: D.lost, bBuilt: D.bBuilt, bLost: D.bLost, nodes: D.nodes.filter(x => x[2]).length,
        tech: D.tech.filter(x => x[3] === 'start').map(x => [x[0], x[1], x[2], x[4]]), sig: D.sig, abil: D.abil.length }; }) };
}

/* ---------- Match log (v2.9) ----------
   Written by the SIM for the post-match report and never read by it, so play is unchanged; the UI reads it only
   once the match is over. Bounded: at most LOG_CAP events, an army and bank sample every 15 s, losses per 10 s.
   An event is [t, side, code, ...]: B started, F finished (type, building id), U upgrade started, V upgraded (type, tier, id), S sold, D destroyed
   (type, tier, by), N/L node captured/lost (node), A ability (k, a, b: its recorded effect), H HQ shield down,
   G AI attack (mode), W/X storm warning/start, E end (how, winner); T/K units trained/lost (type, n, last t),
   grouped while production continues: a group closes after 60 s or 10 units, or a 45 s pause. */
const LOG_CAP = 1200, LOG_GAP = 45, LOG_SPAN = 60, LOG_N = 10, LOG_SAMPLE = 15, LOG_BUCKET = 10;
const newTot = () => ({ earn: [0, 0], sold: [0, 0], spent: { b: [0, 0], u: [0, 0], up: [0, 0], rep: [0, 0], ab: [0, 0] }, trained: {}, lost: {}, killed: {},
  bBuilt: {}, bUp: 0, bLost: {}, bSold: 0, nodeCap: 0, nodeLost: 0, nodeTime: 0, ab: newLogAb(), storm: 0, peak: 0, salv: 0 });
const newLog = t0 => ({ from: t0, ev: [], open: {}, cur: [null, null], army: [[], []], bank: [[], []], next: Math.ceil(t0 / LOG_SAMPLE) * LOG_SAMPLE,
  loss: [{}, {}], tot: [newTot(), newTot()], merged: 0, dropped: 0 });
const logT = g => Math.round(g.t * 10) / 10;
function lg(g, s, code, a, b, c, d) { // a key event: always its own line
  statsEvent(g, s, code, a, b, c, d); // v2.51: the stats tracker sees every key event
  const L = g.log; if (!L) return;
  const e = [logT(g), s, code]; if (a !== undefined) e.push(a); if (b !== undefined) e.push(b); if (c !== undefined) e.push(c); if (d !== undefined) e.push(d);
  L.ev.push(e); if (L.ev.length > LOG_CAP) logCompact(L);
  return e;
}
function lgUnit(g, s, code, type) { // a unit trained (T) or lost (K): extends the open group while production continues
  statsEvent(g, s, code, type); // v2.51
  const L = g.log; if (!L) return;
  const t = logT(g), key = s + code + type, i = L.open[key], e = i !== undefined ? L.ev[i] : null;
  if (e && e[2] === code && e[1] === s && e[3] === type && t - e[5] <= LOG_GAP && t - e[0] <= LOG_SPAN && e[4] < LOG_N) { e[4]++; e[5] = t; return; }
  L.ev.push([t, s, code, type, 1, t]); L.open[key] = L.ev.length - 1;
  if (L.ev.length > LOG_CAP) logCompact(L);
}
function logCompact(L) { // over the cap: first join neighbouring unit groups that still fit 60 s / 10 units; key events are kept
  const last = {}, out = [];
  for (const e of L.ev) {
    if (e[2] !== 'T' && e[2] !== 'K') { out.push(e); continue; }
    const k = e[1] + e[2] + e[3], p = last[k];
    if (p && e[5] - p[0] <= LOG_SPAN && p[4] + e[4] <= LOG_N) { p[4] += e[4]; p[5] = e[5]; L.merged++; continue; }
    last[k] = e; out.push(e);
  }
  L.ev = out;
  // still over (only in an extreme match): drop the oldest unit groups (their totals stay in tot) and say so in the report
  while (L.ev.length > LOG_CAP * 0.9) { const i = L.ev.findIndex(e => e[2] === 'T' || e[2] === 'K'); if (i < 0) { L.ev.shift(); } else L.ev.splice(i, 1); L.dropped++; }
  L.open = {};
}
// per ability: [uses, effect, kills]; effect: strike/corrosive damage, shield damage blocked, repair HP restored, frenzy units, brood creatures
const newLogAb = () => ({ shield: [0, 0], strike: [0, 0, 0], repair: [0, 0], frenzy: [0, 0], brood: [0, 0], corrosive: [0, 0, 0], mwarp: [0, 0], overcharge: [0, 0, 0], beam: [0, 0, 0] }); // v2.28: mwarp units moved; overcharge damage blocked, shields restored; beam damage, kills
function logAbilityDone(L, s) { // an ability's effect builds up until the side's next cast (one at a time under the shared cooldown)
  const c = L.cur[s]; if (!c) return;
  for (let i = L.ev.length - 1; i >= 0; i--) { const e = L.ev[i]; if (e[2] === 'A' && e[1] === s && e[0] === c.t) { e[4] = Math.round(c.a); e[5] = Math.round(c.b); break; } }
}
function logAbility(g, s, k) {
  const L = g.log; if (!L) return;
  logAbilityDone(L, s);
  L.cur[s] = { k, t: logT(g), a: 0, b: 0 };
  lg(g, s, 'A', k, 0, 0);
  L.tot[s].ab[k][0]++;
}
function logEffect(g, s, k, a, b = 0) { // strike: damage, kills; shield: damage blocked; repair: HP restored
  const L = g.log; if (!L) return;
  const c = L.cur[s]; if (c && c.k === k) { c.a += a; c.b += b; }
  const T = L.tot[s].ab[k]; T[1] += a; if (k === 'strike' || k === 'corrosive' || k === 'beam' || k === 'overcharge') T[2] += b;
}
function logLoss(g, e) { // unit value lost per 10 s, with where it happened, for battles in the report
  const L = g.log; if (!L) return;
  const d = UDEF[e.type], k = Math.floor(g.t / LOG_BUCKET), m = L.loss[e.side], r = m[k] || (m[k] = [0, 0, 0]);
  r[0] += d.cost.c + d.cost.e; r[1]++; r[2] += e.u;
}
function logTick(g, dt) {
  const L = g.log; if (!L) return;
  for (const n of g.nodes) if (n.owner !== null) L.tot[n.owner].nodeTime += dt;
  if (g.t < L.next) return;
  L.next += LOG_SAMPLE;
  const v = [0, 0];
  for (const e of g.ents) if (e.kind === 'u' && e.hp > 0) v[e.side] += UDEF[e.type].cost.c + UDEF[e.type].cost.e;
  for (const s of [0, 1]) {
    if (L.army[s].length < 120) { L.army[s].push(v[s]); L.bank[s].push(Math.round(g.sides[s].res.c)); }
    L.tot[s].peak = Math.max(L.tot[s].peak, v[s]);
  }
}
const logAdd = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const logSpend = (g, s, kind, c, e) => { if (g.log) { const a = g.log.tot[s].spent[kind]; a[0] += c; a[1] += e; } };

/* ---------- Save and resume ---------- */
// v6 adds fog of war; v7 the AI's personality (kept on its side record); v10 the shared ability cooldown; v11 the match log; v12 group orders, the selection and Regroup flags; v13 upgrade-tree paths; v14 War Factory paths. Older saves are migrated.
const SAVE_VER = 31, SAVE_OK = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]; // v31: the map's id and version (v2.63); v28: signature buildings (v2.32); v29: Bloomhost's (v2.33); v30: the Axiarchs' (v2.34)
function serialize(g, extra) {
  const live = g.ents.filter(e => e.hp > 0);
  for (const sd of g.sides) if (sd.hq.hp <= 0 && !live.includes(sd.hq)) live.push(sd.hq); // a fallen HQ inside the storm's 5 s end window
  const ents = live.map(e => { const o = Object.assign({}, e); if (o.queue) o.queue = o.queue.slice(); return o; });
  const projs = g.projs.map(p => Object.assign({}, p, { target: p.target ? p.target.id : null }));
  const sides = g.sides.map(sd => Object.assign({}, sd, { hq: sd.hq.id, slots: sd.slots.map(b => b ? b.id : null), res: Object.assign({}, sd.res), stats: Object.assign({}, sd.stats), salv: Object.assign({}, sd.salv) }));
  const fog = g.fog.map(f => ({ exp: Array.from(f.exp).join(''), seen: Array.from(f.seen).join(''), ghosts: f.ghosts, creep: f.creep, field: f.field, intel: f.intel, lastHQ: f.lastHQ, lastSpot: f.lastSpot, seenUnits: f.seenUnits }));
  return JSON.stringify({ v: SAVE_VER, map: { id: MAP.id, v: MAP.v }, t: g.t, nid: g.nid, diffKey: g.diffKey, ents, projs, sides, nodes: g.nodes, fog, abil: g.abil, endHold: g.endHold || null, log: g.log, creep: g.creep, field: g.field, warps: g.warps, acid: g.acid, stats: g.stats, seed: g.seed, rs: g.rs, fs: g.fs, extra }); // seed/rs/fs (v2.50): the random streams, so a resumed match rolls on where it stopped
}
function deserialize(str) {
  const o = JSON.parse(str);
  if (!o || !SAVE_OK.includes(o.v)) return null;
  const m = o.map || { id: 'classic', v: 1 }; // v2.63: a save before v31 was played on Classic v1
  if (m.id !== MAP.id || m.v !== MAP.v) return null; // another map, or another version of it: it can't be resumed or replayed here
  const g = newGame(o.diffKey);
  if (o.rs !== undefined && !RNG.legacy) { g.seed = o.seed >>> 0; g.rs = o.rs | 0; g.fs = o.fs | 0; } // v2.50: an older save keeps the fresh seed newGame drew
  g.t = o.t; g.nid = o.nid; g.ents = o.ents; g.nodes = o.nodes;
  g.stats = o.stats && o.stats.v === 1 ? o.stats : newStats(o.t); // v2.51: an older save starts its record now
  const byId = new Map(g.ents.map(e => [e.id, e]));
  g.projs = o.projs.map(p => Object.assign(p, { target: p.target != null ? byId.get(p.target) || null : null }));
  g.sides = o.sides.map(sd => Object.assign(sd, { hq: byId.get(sd.hq), slots: sd.slots.map(id => id != null ? byId.get(id) || null : null) }));
  if (g.sides.some(sd => !sd.hq)) return null;
  // Fog: restore it, or for a v5 save start from current vision only (no ghosts, no AI memory) so nothing is revealed
  g.fog = [0, 1].map(k => {
    const f = newFog(g, k), sf = o.fog && o.fog[k];
    if (sf) {
      for (let i = 0; i < FOG_N; i++) { f.exp[i] = sf.exp[i] === '1' ? 1 : 0; f.seen[i] = (sf.seen || sf.exp)[i] === '1' ? 1 : 0; } // v17: older saves count explored ground as seen
      Object.assign(f, { ghosts: sf.ghosts || {}, intel: sf.intel || {}, creep: sf.creep || {}, field: sf.field || {}, lastHQ: sf.lastHQ || f.lastHQ, lastSpot: sf.lastSpot ?? -99, seenUnits: sf.seenUnits || 0 });
    }
    return f;
  });
  if (!g.sides[1].persona) g.sides[1].persona = rollPersona(); // a save from before personalities: pick one now
  for (const sd of g.sides) if (sd.persona && !sd.persona.dial) Object.assign(sd.persona, { preset: 'default', smart: true, dial: Object.assign({}, AI_PRESETS.default.dials) }); // v2.38: an older save's AI plays the game's AI (Default)
  for (const sd of g.sides) if (!sd.ab) sd.ab = newAb(g.t, sd.faction); // a save from before abilities: each starts its first cooldown now
  if (o.v >= 8 && o.v < 10) for (const sd of g.sides) { // separate cooldowns: the longest one still running now locks all three (never a free use)
    let end = 0, k0 = null;
    for (const k of ABIL_ORDER) if (sd.ab[k] > g.t && sd.ab[k] !== ABIL[k].first && sd.ab[k] > end) { end = sd.ab[k]; k0 = k; }
    for (const k of ABIL_ORDER) sd.ab[k] = Math.max(sd.ab[k], end);
    sd.abK = k0; sd.abEnd = end;
  }
  g.abil = o.abil || [];
  g.endHold = o.endHold || null; // the 5-second end window of a storm match (v9)
  for (const sd of g.sides) { if (!sd.orders) sd.orders = newOrders(); if (sd.sel === undefined) sd.sel = null; } // v12: older saves start with no group orders
  for (const sd of g.sides) if (!FACTIONS[sd.faction]) sd.faction = DEFAULT_FACTION; // v16: older saves are Last Fist vs Last Fist
  for (const e of g.ents) { // v17: buildings carry their faction; units their attack target and brace timers
    if (e.kind === 'b') { if (!FACTIONS[e.fac]) e.fac = g.sides[e.side].faction; }
    else { if (e.tgt === undefined) e.tgt = 0; if (e.braceT === undefined) { e.braceT = 0; e.braceCd = 0; } }
  }
  g.creep = Array.isArray(o.creep) && o.creep.length === 2 ? o.creep : [[], []]; // v18: older saves start without creep and grow it
  g.field = Array.isArray(o.field) && o.field.length === 2 ? o.field : [[], []]; // v23: older saves start without a power field and grow it
  g.warps = Array.isArray(o.warps) ? o.warps : [];
  for (const sd of g.sides) if (sd.warp === undefined) sd.warp = null;
  for (const sd of g.sides) if (!sd.salv) sd.salv = newSalv(); // v27: Salvage; an older save starts its total and this minute's cap at 0
  for (const sd of g.sides) if (sd.od === undefined) sd.od = 0; // v28: Overdrive's timer (Salvage Yard T3); nothing before v28 had a Yard
  for (const e of g.ents) if (e.kind === 'b' && e.type === 'sigB' && facOf(e.fac) === 'lastfist' && !e.bk) e.bk = {}; // v28: Depot bunker rebuild timers
  // v29 (v2.33): Bloomhost's signature roles. Before v29 a Bloomhost side couldn't have them: any stray sigA/sigB building on a
  // Bloomhost side in an older save is dropped (its pad freed), and no unit is snared or a Mite yet
  // v30 (v2.34): the Axiarchs' signature roles; an older save's stray one on an Axiarch side is dropped the same way. Stored
  // echoes (rel.ech), the Beacon's state and recovered units' flags are plain fields, saved with their entities and warps
  if (o.v < 30) {
    for (const e of g.ents) if (e.kind === 'b' && (e.type === 'sigA' || e.type === 'sigB') && facOf(e.fac) === 'axiarchs') { e.hp = 0; const sd = g.sides[e.side]; if (sd.slots[e.slot] === e) sd.slots[e.slot] = null; }
    g.ents = g.ents.filter(e => e.hp > 0 || e === g.sides[0].hq || e === g.sides[1].hq);
    for (const f of g.field) for (let i = f.length - 1; i >= 0; i--) if (f[i].k === 'beacon') f.splice(i, 1);
  }
  if (o.v < 29) {
    for (const e of g.ents) if (e.kind === 'b' && (e.type === 'sigA' || e.type === 'sigB') && facOf(e.fac) !== 'lastfist') { e.hp = 0; const sd = g.sides[e.side]; if (sd.slots[e.slot] === e) sd.slots[e.slot] = null; }
    g.ents = g.ents.filter(e => e.hp > 0 || e === g.sides[0].hq || e === g.sides[1].hq);
  }
  for (const e of g.ents) if (e.kind === 'u' && e.lastHurt === undefined) { e.lastHurt = -99; e.lastAct = -99; e.creepAt = -1; }
  g.acid = Array.isArray(o.acid) ? o.acid : []; // v19: acid pools, leaps, corrosion and spine bursts; older saves start without
  // v20: a Bloomhost side from v17-v19 kept Last Fist's ability timers (unused): carry them over to its own three
  const BH_OF = { shield: 'frenzy', strike: 'corrosive', repair: 'brood' };
  for (const sd of g.sides) if (facOf(sd.faction) === 'bloomhost' && sd.ab && sd.ab.frenzy === undefined) {
    const ab = {}; for (const k in BH_OF) ab[BH_OF[k]] = sd.ab[k] ?? g.t + ABIL[BH_OF[k]].first; sd.ab = ab; if (sd.abK) sd.abK = BH_OF[sd.abK] || null;
  }
  for (const e of g.ents) if (e.kind === 'u' && e.temp === undefined) { e.temp = 0; e.frzT = 0; }
  // v21: a temporary unit records its lifetime and source (every one before v21 came from an Emergency Brood); Cloudwing timers
  for (const e of g.ents) if (e.kind === 'u' && e.disT === undefined) Object.assign(e, { dis: 0, disT: 0, slow: 0, slowT: 0, chT: 0, chTgt: 0, pulseCd: 0 }); // v24: disrupt, slow, charge and pulse timers
  for (const e of g.ents) if (e.maxShp === undefined) Object.assign(e, { shp: 0, maxShp: 0, shpT: -99, shpHit: -99 }); // v22: Axiarch shields; nothing before v22 had any
  for (const e of g.ents) if (e.kind === 'u' && e.ovT === undefined) e.ovT = 0; // v25: Shield Overcharge
  // v26: Celestial Array paths. Before v26 an Axiarch Celestial Array could not leave T1 and had no path: make sure it carries
  // none (a path or pending path in an older save is dropped; its tier stays) so it picks one at its next upgrade
  if (o.v < 26) for (const e of g.ents) if (e.kind === 'b' && e.type === 'techlab' && facOf(e.fac) === 'axiarchs' && e.tier < 2 && !e.upgrading) { e.path = null; e.upPath = null; }
  // v25: an Axiarch side from v22-v24 had no abilities (an empty timer list): it gets its three on the match's own schedule
  // (first use 60 s / 120 s after the start, so available at once in a later save), with no shared cooldown running
  for (const sd of g.sides) if (facOf(sd.faction) === 'axiarchs' && sd.ab && sd.ab.mwarp === undefined) { sd.ab = newAb(0, sd.faction); sd.abK = null; sd.abEnd = 0; }
  for (const e of g.ents) if (e.kind === 'u' && e.tLife === undefined) Object.assign(e, { tLife: e.temp ? ABIL.brood.life : 0, tSrc: e.temp ? 'brood' : null, kid: 0, spawnT: 0 });
  for (const e of g.ents) if (e.kind === 'u' && e.leapCd === undefined) Object.assign(e, { leapCd: 0, leaping: 0, lu: 0, lv: 0, ld: 0, corr: 0, corrT: 0, burstCd: 0 });
  for (const f of g.fog) for (const id in f.ghosts) if (f.ghosts[id].fac === undefined) f.ghosts[id].fac = o.v < 17 ? DEFAULT_FACTION : null;
  for (const e of g.ents) { // v13: before upgrade trees, a T2 or T3 building is on path A (it keeps what it had: Heavies, Snipers)
    if (e.kind === 'u') { if (e.vet === undefined) e.vet = 0; if (e.aimAir === undefined) e.aimAir = 0; if (e.medAt === undefined) e.medAt = -1; continue; }
    if (e.path === undefined) { e.path = TREES[e.type] && e.tier >= 2 ? 'A' : null; e.upPath = TREES[e.type] && e.upgrading && e.tier === 1 ? 'A' : null; }
    if (o.v < 14 && e.type === 'factory' && !e.path) { e.path = e.tier >= 2 ? 'A' : null; e.upPath = e.upgrading && e.tier === 1 ? 'A' : null; } // v14: an upgraded War Factory keeps Artillery and Titans (Siege)
    if (o.v < 15 && e.type === 'techlab') { e.path = e.tier >= 3 ? 'B' : e.tier === 2 ? 'A' : null; e.upPath = e.upgrading && e.tier === 1 ? 'A' : null; } // v15: T2 keeps Interceptors (Air Power), T3 keeps Nanoweave (Support)
  }
  g.log = o.log || newLog(g.t); // v11; an older save starts its log now (the report says the early part wasn't recorded)
  for (const T of g.log.tot) { const n = newLogAb(); for (const k in n) if (!T.ab[k]) T.ab[k] = n[k]; if (T.salv === undefined) T.salv = 0; } // v20: room for Bloomhost's abilities in older logs
  updateVision(g);
  g.events.length = 0;
  g.extra = o.extra || {};
  return g;
}
