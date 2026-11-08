/* ---------- Mechanics (v2.43, audit phase 7c; audit/polish-report.md) ----------
   Four rule changes, one switch: setMech7c(false) plays exactly as v2.42.
   rally: the rally point (where new and idle units stand) sits `rally` out from the HQ, inside its gun's cover: a Rifleman
     (120 range) shooting units there stands inside the T1 gun's 390 (was 300: attackers hit them from outside it). 190 was
     tried first and measured worse (Bloomhost 25% in Greedy vs Greedy against 46% at 240). On Attack, new units of a player's side wait
     there until the group is worth batchV or has waited batchT seconds, then walk out together (the AI moves its army by its own rules).
   holdR: melee units on Hold (or on a Regroup flag) engage enemies within holdR of the spot they hold; they never chase
     further (before: a melee unit on Hold never engaged at all).
   node: each side's own field node sits `node` out from its HQ (was 380, half under the HQ's T1 gun): all three nodes are
     now outside the T1 gun, so each is a field fight, and the third one (the enemy's) is inside the enemy HQ's T2 and T3
     reach (430, 470): against a greedy opponent (T1) it can be taken and held; against one that paid for HQ tiers it costs
     units. Inside the gun (310) was tried first and measured badly: holding the enemy's node then meant sitting in its base
     (Axiarch Greedy vs Greedy 40-0: their node field put the warp point there).
   sigPad: one signature pad per side, outside the 8 building pads; only a signature building stands there, one at a time
     (sell it to build the other), and signature buildings no longer go on the 8 pads. */
const MECH7C = { on: false, rally: 240, holdR: 80, node: 460, batchV: 300, batchT: 15, sigPad: true, old: { node: [NODE_U[0], NODE_U[2]] } };
const SIG_SLOT = 8, SIG_TILE = [2, 0]; // the signature pad: just past the HQ, at the base's outer corner
function setMech7c(on) {
  MECH7C.on = on;
  if (MAP.id === 'classic') NODE_U[0] = on ? MAP.nodes[0].at[0] : MECH7C.old.node[0]; NODE_U[2] = on ? MAP.nodes[2].at[0] : MECH7C.old.node[1]; // v2.63: other maps place their nodes once (NODE_U); v2.59: the map's nodes (MECH7C.node out from each HQ)
}
setMech7c(true);
MAP_HOOKS.push(() => setMech7c(MECH7C.on)); // v2.65: a new map's nodes, at the spots MECH7C asks for (Classic)
/* ---------- Live description texts (v2.45) ----------
   Every number a building tier, upgrade step or ability description quotes is read from the data when the text is read
   (getters), so the text can never disagree with the numbers (balance layers, tests or later edits change both at once).
   Consumers still read plain strings: d.tiers[t], step.txt, ABIL[k].tip (and UNIT_TIPS in the UI section). */
const txN = v => { const r = Math.round(v * 100) / 100; return Number.isInteger(r) ? String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(r); };
const txP = v => txN(v * 100) + '%', txX = v => txN(v) + '×', txDps = gn => Math.round(gn.dmg / gn.cd), txAir = gn => gn.hitsAir ? 'hits air' : 'ground only';
const liveStr = (o, k, f) => Object.defineProperty(o, k, { get: f, enumerable: true, configurable: true });
const liveTiers = (d, f) => { const a = [null]; for (let t = 1; t <= 3; t++) liveStr(a, t, () => f(d, t)); d.tiers = a; };
const nanoTxt = () => `Nanoweave: your units and defenses deal ${txP(NANO.dmg - 1)} more damage and take ${txP(1 - NANO.cut)} less`;
const perMin = () => SALVAGE.per === 60 ? 'a minute' : `every ${txN(SALVAGE.per)} s`;
for (const fac of FACTION_KEYS) {
  const B = BDEFS[fac], w = { lastfist: 'Turret', bloomhost: 'Spine launcher', axiarchs: 'Axis lance' }[fac];
  liveTiers(B.hq, (d, t) => { const gn = d.gun[t], hp = txN(Math.round(d.hp * d.hpMul[t])); return `${w} ${txN(gn.dmg)} damage, ${txN(gn.range)} range${d.shp ? `; ${hp} HP + ${txN(Math.round(d.shp * d.hpMul[t]))} shields` : `, ${hp} HP`}`; });
  liveTiers(B.refinery, (d, t) => `+${txN(d.inc[t].c)} credits/s`);
  liveTiers(B.reactor, (d, t) => `+${txN(d.inc[t].e)} energy/s`);
  liveTiers(B.habitat, (d, t) => `+${txN(d.pop[t])} army size`);
}
liveTiers(BDEF.turret, (d, t) => `Gun ${txDps(d.gun[t])} damage/s, ${txN(d.gun[t].range)} range, ${txAir(d.gun[t])}`);
liveTiers(BDEF_BH.turret, (d, t) => `Spines ${txDps(d.gun[t])} damage/s, ${txN(d.gun[t].range)} range, ${txAir(d.gun[t])}`);
liveTiers(BDEF_AX.turret, (d, t) => { const gn = d.gun[t]; return [null, `Beam ${txDps(gn)} damage/s at one target, ${txN(gn.range)} range, ${txAir(gn)}`,
  `Split Lattice: up to ${gn.split} beams of ${txDps(gn)} damage/s, ${txN(gn.range)} range, ${txAir(gn)}`,
  `Event Horizon: heavy ${txN(gn.dmg)}-damage hits (${txDps(gn)}/s), ${txN(gn.range)} range, more building damage, ${txAir(gn)}`][t]; });
liveStr(BDEF.techlab.tiers, 3, nanoTxt);
liveTiers(BDEF.sigA, (d, t) => [null, `Salvage returns ${txP(YARD.pct)} of a unit's credit cost (base ${txP(SALVAGE.pct)})`,
  `Salvage cap ${txX(YARD.cap)} (${txN(SALVAGE.cap * YARD.cap)} ${perMin()}); salvage also returns energy worth ${txP(YARD.energy)} of the credits`,
  `Overdrive: salvage over the cap speeds your production +${txP(YARD.od)} for ${txN(YARD.odDur)} s`][t]);
liveTiers(BDEF.sigB, (d, t) => { const G = BDEF.bunker.gun; return [null, `A bunker on every field node you hold (${txAir(G[1])})`,
  `Bunkers heal your Barracks units in range, ${txP(BUNKER.heal)} of HP per second`,
  `Bunker guns deal ${txX(G[3].dmg / G[2].dmg)} damage${G[3].hitsAir ? ' and hit aircraft' : ''}`][t]; });
liveTiers(BDEF.bunker, (d, t) => { const G = d.gun; return [null, `Gun ${txDps(G[1])} damage/s, ${txN(G[1].range)} range, ${txAir(G[1])}`,
  `Also heals your Barracks units in range (${txP(BUNKER.heal)} of HP per second)`, `Gun ${txDps(G[3])} damage/s${G[3].hitsAir ? ', hits air too' : ''}; still heals`][t]; });
liveTiers(BDEF_BH.sigA, (d, t) => [null, `Spawns ${MOUND.n[1]} Mites every ${txN(MOUND.every)} s (${txN(MOUND.life)} s life, at most ${MOUND.max})`,
  `Spawns ${MOUND.n[2]} Mites every ${txN(MOUND.every)} s`, 'A Mite that is killed bursts into acid against enemy ground units'][t]);
liveTiers(BDEF_BH.sigB, (d, t) => [null, `Creep spreads ${txX(ROOT.grow)} faster and ${txX(ROOT.reach)} farther; enemy ground units on it move ${txP(ROOT.slow)} slower`,
  `Your units regenerate ${txP(ROOT.regen - 1)} faster on creep`, `Every ${txN(ROOT.every)} s roots snare enemy ground units at the creep's edge for ${txN(ROOT.snare)} s`][t]);
liveTiers(BDEF_AX.sigA, (d, t) => [null, `A power-field bubble follows your frontmost unit (a node field's size); it collapses for ${txN(BEACON.down)} s if your units in it lose ${txP(BEACON.loss)} within ${txN(BEACON.window)} s`,
  `Bubble ${txX(BEACON.r2)} wider`, `Units that warp into the bubble arrive with full shields and +${txP(BEACON.dmg)} damage for ${txN(BEACON.dmgDur)} s`][t]);
liveTiers(BDEF_AX.sigB, (d, t) => [null, `Keeps the echoes of your last ${ECHO.n[1]} fallen T2/T3 units: warp one back for ${txP(ECHO.cost)} of its cost`,
  `Keeps ${ECHO.n[2]} echoes`, `Recovered units arrive with a ${txP(ECHO.osh)} overshield for ${txN(ECHO.oshDur)} s`][t]);
// Upgrade steps that quote numbers
liveStr(TREES.barracks.B.steps[2], 'txt', () => `Trains Riflemen two at a time (a pair takes ${txN(UDEF.rifle.time * PAIR_TIME)} s)`);
liveStr(TREES.barracks.B.steps[3], 'txt', () => `Drilled Riflemen: +${txP(DRILL.hp - 1)} HP, +${txP(DRILL.dmg - 1)} damage, capture nodes ${txX(DRILL.capture)} faster`);
liveStr(TREES.factory.A.steps[2], 'txt', () => `Unlocks Artillery: ${UDEF.artillery.salvo ? `salvos of ${UDEF.artillery.salvo.n} shells` : 'long-range shells'}`);
liveStr(TREES.techlab.B.steps[2], 'txt', () => `Unlocks Medicopters (heal infantry) and Recon Drones (scouts, at most ${UDEF.drone.max})`);
liveStr(TREES.techlab.B.steps[3], 'txt', nanoTxt);
const sigPadOn = () => MECH7C.on && MECH7C.sigPad;
const sigOnPad = (g, s) => g.ents.find(e => e.kind === 'b' && e.side === s && e.hp > 0 && e.slot === SIG_SLOT) || null; // what stands on side s's signature pad
const playerSide = (g, s) => s === 0 ? !g.auto : !!g.sides[s].bot; // a side the AI brain doesn't run (the player, or an audit bot)
// Diamond of pads (tile coords i, j). The HQ takes the back tile (1, -1); the rest fill back to front. Since v2.59 the map
// holds the pads (sim/maps.js); these and tilePos stay so tests/maps.test.js can prove Classic's are the same numbers.
const PADS = [[0, -1], [1, 0], [-1, -1], [0, 0], [1, 1], [-1, 0], [0, 1], [-1, 1]];
const HQ_TILE = [1, -1];

const dirOf = s => MAP.bases[s].face[0]; // v2.59: the map's bases (sim/maps.js)
const hqU = s => MAP.bases[s].hq[0];
const tilePos = (s, i, j) => ({ u: hqU(s) + dirOf(s) * (i + j) * TILE * IX, v: (j - i) * TILE * IY / DY });
const mapPt = p => ({ u: p[0], v: p[1] });
const slotPos = (s, k) => k >= FWD_SLOT ? mapPt(FWD_PADS[k - FWD_SLOT].at) : mapPt(k === SIG_SLOT ? MAP.bases[s].sigPad : MAP.bases[s].pads[k]); // v2.59: the map's pads (the same numbers tilePos gave); v2.65: forward pads
// v2.65: the map's forward pads, in order: { node (its index in g.nodes), at, allow }; build slot FWD_SLOT + k
let FWD_PADS = [];
const mapFwd = () => { FWD_PADS = []; MAP.nodes.forEach((n, i) => { if (n.type === 'forwardPad') for (const p of n.pads) FWD_PADS.push({ node: i, at: p, allow: n.allow }); }); };
mapFwd(); MAP_HOOKS.push(mapFwd);
const fwdAt = (g, k) => g.ents.find(e => e.kind === 'b' && e.hp > 0 && e.slot === k); // what stands on forward pad slot k (either side)
// whether side s may build role type on forward pad slot k now: it holds the pad's node, the pad is free, the role is allowed
function fwdOk(g, s, type, k) {
  const F = FWD_PADS[k - FWD_SLOT];
  if (!F) return { ok: false, msg: 'No such pad' };
  if (g.nodes[F.node].owner !== s) return { ok: false, msg: 'Capture the forward pad first' };
  if (fwdAt(g, k)) return { ok: false, msg: 'That pad is in use' };
  if (!F.allow.includes(type)) return { ok: false, msg: `Only a ${F.allow.map(t => bdS(g, s, t).name).join(' or ')} fits a forward pad` };
  return { ok: true };
}
const hqPos = s => mapPt(MAP.bases[s].hq);
const rallyU0 = s => MECH7C.on ? MAP.bases[s].rally[0] : hqU(s) + dirOf(s) * 300; // v2.43: inside the HQ gun's cover (v2.59: the map's rally point)
// v2.62: with a game, the player's active rally flag (side.rally) once the player has used the army controls
const rallyU = (s, g) => g && g.sides[s].rally ? g.sides[s].rally[g.sides[s].rally.at] : rallyU0(s);
/* ---------- Army controls (v2.62, Phase 1): two rally points and Send damaged home ----------
   The player's side only; the AI doesn't use them yet, and a side that never touches them has no side.rally, so nothing
   changes for it. side.rally = { at: 'def' | 'fwd', def: u, fwd: u }: the base flag (where the map's rally point was)
   and the forward flag (RALLY.fwdOut from the HQ, just past its own field node). The active flag is where idle and new
   units gather and where Retreat goes; switching flags sends the whole army there (a Regroup to the flag). Flags stay
   between RALLY.min out from the HQ and RALLY.past beyond the centre.
   Send damaged home: units under DAMAGED.thr of their HP go back to the base flag holding their fire (as on Retreat),
   heal DAMAGED.heal of their HP a second there once DAMAGED.calm s unhurt, and rejoin at DAMAGED.done. */
const RALLY = { fwdOut: 560, min: 120, past: 250 };
const DAMAGED = { thr: 0.4, heal: 0.03, done: 0.95, calm: 3 };
function rallyOf(g, s) {
  const sd = g.sides[s];
  if (!sd.rally) sd.rally = { at: 'def', def: rallyU0(s), fwd: hqU(s) + dirOf(s) * RALLY.fwdOut };
  return sd.rally;
}
const homeFlagU = (g, s) => g.sides[s].rally ? g.sides[s].rally.def : rallyU0(s);
function setRally(g, s, which, u) { // move a flag (the player taps it, then the ground)
  if (which !== 'def' && which !== 'fwd') return { ok: false, msg: 'No such flag' };
  const R = rallyOf(g, s), a = hqU(s) + dirOf(s) * RALLY.min, b = L / 2 + dirOf(s) * RALLY.past;
  R[which] = clamp(u, Math.min(a, b), Math.max(a, b));
  const O = g.sides[s].orders;
  if (MAP_LANED) { for (let k = 0; k < MAP.lanes.length; k++) { const o = O && O.lanes && O.lanes[k]; if (o && o.o === 'move' && sqFlag(R, k) === which) giveOrder(g, s, 'lane', k, 'move', ...flagPt(g, s, which, k), true); } } // v2.66: each squad follows its flag
  else if (R.at === which && O && O.all && O.all.o === 'move') giveOrder(g, s, 'all', null, 'move', R[which], 0, true); // the army follows its flag
  return { ok: true, msg: which === 'def' ? 'Base flag moved' : 'Forward flag moved' };
}
// v2.66 (Split Army, docs/SPLIT_ARMY.md): on a lane map each lane has its own flags, at the flag's x on that lane's
// centre line (the Base flag in the middle, where the lanes leave the base); a squad (lane) remembers which of its flags
// it last rallied to (R.sq). flagPt: where a flag stands for a lane (Classic: depth 0, as before).
const sqFlag = (R, k) => (R.sq && R.sq[k]) || R.at;
function flagPt(g, s, which, lane) {
  const u = rallyOf(g, s)[which];
  return [u, MAP_LANED && lane != null && which === 'fwd' ? laneY(MAP.lanes[lane], u) : 0];
}
function useRally(g, s, which, lane) { // one tap: make a flag the rally point and send the whole army (v2.66: or one squad) to it
  if (g.countdown > 0) return WAIT_GO;
  const R = rallyOf(g, s);
  if (!MAP_LANED) { R.at = which; const r = giveOrder(g, s, 'all', null, 'move', R[which], 0); return { ok: true, msg: `Army to the ${which === 'def' ? 'base' : 'forward'} flag${r.ok ? '' : ' (no units yet)'}` }; }
  const lanes = lane == null ? MAP.lanes.map((_, k) => k) : [lane];
  if (lane == null) { R.at = which; R.sq = {}; } else (R.sq || (R.sq = {}))[lane] = which;
  let any = false; for (const k of lanes) any = giveOrder(g, s, 'lane', k, 'move', ...flagPt(g, s, which, k)).ok || any;
  const who = lane == null ? 'Army' : `${MAP.lanes[lane].id[0].toUpperCase() + MAP.lanes[lane].id.slice(1)} squad`;
  return { ok: true, msg: `${who} to the ${which === 'def' ? 'base' : 'forward'} flag${any ? '' : ' (no units yet)'}` };
}
// v2.66: where new units go on a lane map: a lane, or null to alternate (the default)
function setLaneNew(g, s, k) {
  if (!MAP_LANED) return { ok: false, msg: 'This map has one lane' };
  if (k != null && laneIx(k) < 0) return { ok: false, msg: 'Unknown lane' };
  g.sides[s].laneNew = k == null ? null : laneIx(k);
  return { ok: true, msg: k == null ? 'New units: alternating between the lanes' : `New units: ${MAP.lanes[laneIx(k)].id} lane` };
}
function sendDamagedHome(g, s) {
  if (g.countdown > 0) return WAIT_GO;
  let n = 0;
  for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && !e.temp && !e.medHome && e.hp < e.maxHp * DAMAGED.thr) { e.medHome = 1; n++; }
  return n ? { ok: true, msg: `${n} damaged unit${n === 1 ? '' : 's'} heading home to heal`, n } : { ok: false, msg: `No unit is below ${Math.round(DAMAGED.thr * 100)}% health`, n: 0 };
}

// v2.55 (Phase 0 stance fix): an AI-played side 0 (the harness, spectate) starts on Retreat like the AI's side 1. It started
// on the player's Hold, which left its new units standing where they were made until its first attack: the right side won
// every Hard mirror (KNOWN_ISSUES.md "Phase 0, item 2"). A human player still starts on Hold. retreat false = v2.54.
const AUTO_STANCE = { retreat: true };
const START_RES = { c: 300, e: 60 }; // what each side starts with (v2.36: named, so the match report can count it as gathered)
// A field node in the match. v2.65: a type other than income, a yield multiplier, its own radius and its sight are kept
// only when the map sets them (Classic's nodes keep exactly their old keys)
function nodeOf(i, u) {
  const d = MAP.nodes[i], n = { id: i, u, v: d.at[1], prog: 0, owner: null, c: [0, 0] };
  if (d.type !== 'income') n.type = d.type;
  if (d.yieldMul && d.yieldMul !== 1) n.mul = d.yieldMul;
  if (d.r && d.r !== NODE_R) n.r = d.r;
  if (d.sight) n.sight = d.sight;
  return n;
}
const nodeInc = n => n.type ? 0 : n.mul || 1; // how many income nodes' worth a node pays (0: a watchtower or forward pad)
function newGame(diffKey, opts = {}) {
  if (opts.map && !useMap(opts.map)) throw new Error(`no map ${opts.map}`); // v2.65: the match's map (the current one if none)
  const g = { t: 0, ents: [], projs: [], fx: [], parts: [], sides: [], abil: [], over: false, winner: -1, nid: 1,
    diff: DIFF[diffKey] || DIFF.normal, diffKey, events: [], auto: !!opts.autoPlayer, autoDiff: opts.autoDiff || 'normal', shake: 0, front: [null, null], countdown: opts.countdown || 0,
    nodes: NODE_U.map((u, i) => nodeOf(i, u)), map: MAP, log: null, forcePath: opts.forcePath || null,
    creep: [[], []], acid: [], field: [[], []], warps: [] }; // creep patches per side (v2.18; Bloomhost only); acid: Ruinmaw pools (v2.19); field: Axiarch power field patches, warps: units mid-warp (v2.26)
  seedGame(g, opts.seed); // v2.50: the match's random streams (opts.seed, else a fresh one)
  for (let s = 0; s < 2; s++) {
    g.sides.push({ faction: (opts.factions && opts.factions[s]) || DEFAULT_FACTION, res: { c: START_RES.c, e: START_RES.e }, stance: s === 0 && !(opts.autoPlayer && AUTO_STANCE.retreat) ? 'hold' : 'retreat', stanceAt: 0, pushTo: null, slots: new Array(SLOT_COUNT).fill(null),
      hq: null, aiT: 1 + s * 0.5, stats: { built: 0, kills: 0, lost: 0, earned: 0 }, lastAlert: -99, buff: false, ab: newAb(0, (opts.factions && opts.factions[s]) || DEFAULT_FACTION), abK: null, abEnd: 0, orders: newOrders(), sel: null, warp: null, salv: newSalv(), od: 0 }); // od: Overdrive's end time (v2.32) // salv: Salvage (v2.30); warp: the player's chosen warp point (Axiarchs, v2.26); null = the default
    const hq = mkBuilding(g, s, 'hq', -1);
    hq.built = true; hq.progress = 1; hq.hp = hq.maxHp; hq.shp = hq.maxShp;
    g.sides[s].hq = hq;
  }
  // secret: never shown until the match is over; opts.ai: its preset (v2.38). v2.40: with none given, Hard plays the Hard preset
  const presetFor = (ai, dk) => ai || (dk === 'hard' ? 'hard' : undefined);
  g.sides[1].persona = rollPersona(opts.persona, presetFor(opts.ai, g.diffKey), g.sides[1].faction, g.diffKey);
  if (g.auto) g.sides[0].persona = rollPersona(opts.autoPersona, presetFor(opts.autoAi, g.autoDiff), g.sides[0].faction, g.autoDiff);
  g.log = newLog(0); // the match log (never read by the SIM)
  g.stats = newStats(0); // v2.51: the stats tracker (never read by the SIM)
  g.fog = [newFog(g, 0), newFog(g, 1)];
  updateVision(g);
  return g;
}

function mkBuilding(g, s, type, slot) {
  const fac = facOf(g.sides[s].faction), d = BD(fac, type), pos = slot < 0 ? hqPos(s) : slotPos(s, slot);
  const b = { id: g.nid++, kind: 'b', type, fac, side: s, slot, u: pos.u, v: pos.v, half: d.half, h: d.h * BS, tier: 1,
    hp: d.hp * 0.15, maxHp: d.hp, built: false, progress: 0, upgrading: false, upProg: 0, queue: [], prodT: 0,
    cd: 0, aim: null, hitT: 0, anim: fxRnd() * 10, spent: { c: 0, e: 0 }, path: null, upPath: null, // path: its upgrade-tree path (v2.13)
    shp: 0, maxShp: d.shp || 0, shpT: -99, shpHit: -99 }; // Axiarch shields (v2.25): they charge once it is built
  g.ents.push(b);
  if (slot >= 0 && slot < SLOT_COUNT) g.sides[s].slots[slot] = b; // the signature pad (v2.43) is not one of the 8
  return b;
}

const WAIT_GO = { ok: false, msg: 'Wait for GO' }; // nothing can be queued or paid for during GET READY
function ev(g, o) { g.events.push(o); if (g.events.length > 60) g.events.shift(); }
const alive = (g, s, type) => g.ents.filter(e => e.kind === 'b' && e.side === s && e.type === type && e.hp > 0);
const hasBuilt = (g, s, type) => g.ents.some(e => e.kind === 'b' && e.side === s && e.type === type && e.built && e.hp > 0);
const hasTier = (g, s, type, t) => g.ents.some(e => e.kind === 'b' && e.side === s && e.type === type && e.built && e.hp > 0 && e.tier >= t);
const countB = (g, s, type) => alive(g, s, type).length;

function popCap(g, s) {
  let c = 0;
  for (const e of g.ents) if (e.kind === 'b' && e.side === s && e.built && e.hp > 0 && bdOf(e).pop) c += bdOf(e).pop[e.tier];
  return Math.min(POP_MAX, c);
}
function popUsed(g, s) {
  let p = 0;
  for (const e of g.ents) {
    if (e.side !== s || e.hp <= 0) continue;
    if (e.kind === 'u') { if (!e.temp) p += UDEF[e.type].pop; } // temporary units use no supply (v2.20)
    else for (const q of e.queue) p += UDEF[q].pop;
  }
  for (const w of g.warps) if (w.side === s) p += UDEF[w.type].pop; // paid for, still warping in (v2.26)
  return p;
}
function income(g, s) {
  let c = 0, e = 0;
  for (const b of g.ents) {
    if (b.kind !== 'b' || b.side !== s || !b.built || b.hp <= 0 || !bdOf(b).inc) continue;
    const inc = bdOf(b).inc[b.tier]; c += inc.c; e += inc.e;
  }
  for (const n of g.nodes) if (n.owner === s && !n.type) { const k = n.mul || 1; c += NODE_INC.c * k; e += NODE_INC.e * k; } // v2.65: income nodes only, × yieldMul
  return { c, e };
}
// Army strength for AI decisions; Interceptors count for a quarter, since they can't fight ground units or buildings
function armyValue(list) { let v = 0; for (const u of list) { const d = UDEF[u.type]; v += (d.cost.c + d.cost.e * 1.5) * (u.w === undefined ? 1 : u.w) * (d.hitsGround === false ? 0.25 : 1); } return v; }
const unitLockMsg = d => { if (!d) return ''; const q = UNIT_PATH[Object.keys(UDEF).find(k => UDEF[k] === d)], B = BD(d.fac, d.from); return q ? `Requires ${B.name} T${d.tier} · ${q.path.name}` : d.tier > 1 ? `Requires ${B.name} T${d.tier}` : `Requires ${B.name}`; };

function tryBuild(g, s, type, want = -1) {
  const d = bdS(g, s, type), side = g.sides[s];
  if (!d || d.noPad || (d.sig && !SIG.on)) return { ok: false, msg: 'Not available' }; // a role this faction doesn't have (yet); bunkers come with the Depot
  if (g.over) return { ok: false, msg: 'The match is over' };
  if (g.countdown > 0) return WAIT_GO;
  if (d.req && !hasBuilt(g, s, d.req)) return { ok: false, msg: `Requires a finished ${bdS(g, s, d.req).name}` };
  if (d.sig && countB(g, s, type)) return { ok: false, msg: `${d.name}: already built (one at a time)` }; // v2.32: at most one of each signature building
  let slot;
  if (sigPadOn() && d.sig) { // v2.43: a signature building goes on the signature pad, and only there; one of the two at a time
    const on = sigOnPad(g, s) || g.ents.find(e => e.kind === 'b' && e.side === s && e.hp > 0 && (e.type === 'sigA' || e.type === 'sigB')); // (an older save's one on a regular pad counts too)
    if (on) return { ok: false, msg: `The signature pad holds your ${bdOf(on).name}: sell it to build this` };
    slot = SIG_SLOT;
  } else if (sigPadOn() && want === SIG_SLOT) return { ok: false, msg: 'Only a signature building fits the signature pad' };
  else if (want >= FWD_SLOT) { const f = fwdOk(g, s, type, want); if (!f.ok) return f; slot = want; } // v2.65: a forward pad
  else slot = want >= 0 && want < SLOT_COUNT && !side.slots[want] ? want : side.slots.findIndex(x => !x);
  if (slot < 0) return { ok: false, msg: 'All 8 building pads are in use' };
  if (side.res.c < d.cost.c) return { ok: false, msg: `Need ${Math.ceil(d.cost.c - side.res.c)} more credits` };
  if (side.res.e < d.cost.e) return { ok: false, msg: `Need ${Math.ceil(d.cost.e - side.res.e)} more energy` };
  side.res.c -= d.cost.c; side.res.e -= d.cost.e;
  const nb = mkBuilding(g, s, type, slot);
  nb.spent = { c: d.cost.c, e: d.cost.e };
  logSpend(g, s, 'b', d.cost.c, d.cost.e); lg(g, s, 'B', type, nb.id);
  return { ok: true, msg: `Building ${d.name}` };
}

// Selling returns half of everything spent on the building, plus queued units in full
const SELL_RATE = 0.5;
function sellValue(b) { return { c: Math.floor(b.spent.c * SELL_RATE), e: Math.floor(b.spent.e * SELL_RATE) }; }
function trySell(g, s, b) {
  const d = bdOf(b), side = g.sides[s];
  if (g.over) return { ok: false, msg: 'The match is over' };
  if (g.countdown > 0) return WAIT_GO;
  if (b.type === 'hq') return { ok: false, msg: `The ${d.name} can’t be sold` };
  if (d.noPad) return { ok: false, msg: `The ${d.name} comes with the Fortification Depot` };
  if (b.hp <= 0) return { ok: false, msg: 'That building is gone' };
  const r = sellValue(b);
  side.res.c += r.c; side.res.e += r.e;
  for (const q of b.queue) { side.res.c += UDEF[q].cost.c; side.res.e += UDEF[q].cost.e; logSpend(g, s, 'u', -UDEF[q].cost.c, -UDEF[q].cost.e); } // queued units are refunded: never spent
  if (g.log) { const T = g.log.tot[s]; T.sold[0] += r.c; T.sold[1] += r.e; T.bSold++; lg(g, s, 'S', b.type, b.tier); }
  b.queue.length = 0; b.hp = 0; b.dead = true; b.sold = true;
  if (b.slot >= 0 && side.slots[b.slot] === b) side.slots[b.slot] = null;
  for (let i = 0; i < 10; i++) {
    const w = P(b.u + fxRand(-b.half, b.half), b.v + fxRand(-b.half, b.half), fxRand(0, b.h * 0.5));
    addPart(g, { x: w.x, y: w.y, vx: fxRand(-20, 20), vy: fxRand(-30, -8), life: fxRand(0.6, 1.2), size: fxRand(4, 8), smoke: true, light: true, grav: -5 });
  }
  return { ok: true, msg: `${d.name} sold for ${r.c} credits` + (r.e ? ` and ${r.e} energy` : '') };
}

function tryUpgrade(g, s, b, path) { // path: 'A' or 'B' when a building with a tree goes to T2
  const d = bdOf(b), side = g.sides[s];
  if (g.over) return { ok: false, msg: 'The match is over' };
  if (g.countdown > 0) return WAIT_GO;
  if (!b.built) return { ok: false, msg: `${d.name} is still under construction` };
  if (b.upgrading) return { ok: false, msg: 'Upgrade already in progress' };
  if (d.noPad) return { ok: false, msg: `The ${d.name} follows the Fortification Depot's tier` };
  if (b.tier >= 3) return { ok: false, msg: `${d.name} is fully upgraded` };
  if (prodLocked(b.fac, b.type)) return { ok: false, msg: `${d.name}: ${d.lockMsg || 'paths coming soon'}` }; // the Celestial Array stays T1 for now (v2.27)
  const T = treeOf(b.fac, b.type);
  if (T && b.tier === 1 && !T[path]) return { ok: false, msg: `Choose a path for this ${d.name}` };
  const up = d.up[b.tier + 1];
  if (side.res.c < up.c) return { ok: false, msg: `Need ${Math.ceil(up.c - side.res.c)} more credits` };
  if (side.res.e < up.e) return { ok: false, msg: `Need ${Math.ceil(up.e - side.res.e)} more energy` };
  side.res.c -= up.c; side.res.e -= up.e;
  b.spent.c += up.c; b.spent.e += up.e;
  b.upgrading = true; b.upProg = 0;
  if (T && b.tier === 1) b.upPath = path;
  logSpend(g, s, 'up', up.c, up.e); lg(g, s, 'U', b.type, b.tier + 1, b.id, b.upPath || b.path || undefined);
  return { ok: true, msg: T && b.tier === 1 ? `${d.name}: ${T[path].name} path (T2)` : `Upgrading ${d.name} to T${b.tier + 1}` };
}

// How many of a unit type side s has: alive (temporary ones included) plus queued in its buildings (the d.max limit)
const unitCount = (g, s, type) => g.ents.reduce((a, e) => a + (e.side !== s ? 0 : e.kind === 'u' ? (e.type === type && e.hp > 0 ? 1 : 0) : e.queue ? e.queue.filter(q => q === type).length : 0), 0);
function tryTrain(g, s, type) {
  const d = UDEF[type], side = g.sides[s];
  if (g.over) return { ok: false, msg: 'The match is over' };
  if (g.countdown > 0) return WAIT_GO;
  const prods = g.ents.filter(e => e.side === s && canMake(e, type));
  if (!prods.length) return { ok: false, msg: unitLockMsg(d) };
  if (d.max && unitCount(g, s, type) >= d.max)
    return { ok: false, msg: `At most ${d.max} ${PLURAL[type]} at a time` }; // the Recon Drone (v2.15), counting those in training; Skitterlings (S1, v2.37)
  // Riflemen go to a Mass Deployment Barracks first, where an order is a pair trained together
  prods.sort((a, b) => (type === 'rifle' ? (pathMod(b, 'pairs') ? 1 : 0) - (pathMod(a, 'pairs') ? 1 : 0) : 0) || a.queue.length - b.queue.length);
  const nOf = b => type === 'rifle' && pathMod(b, 'pairs') ? 2 : 1, p = prods.find(b => b.queue.length + nOf(b) <= 5) || prods[0], n = nOf(p); // the first with room in its queue
  const cap = popCap(g, s);
  if (popUsed(g, s) + d.pop * n > cap) return { ok: false, msg: cap >= POP_MAX ? 'Army is at maximum size' : 'Army is full — build or upgrade a Habitat' };
  if (side.res.c < d.cost.c * n) return { ok: false, msg: `Need ${Math.ceil(d.cost.c * n - side.res.c)} more credits` };
  if (side.res.e < d.cost.e * n) return { ok: false, msg: `Need ${Math.ceil(d.cost.e * n - side.res.e)} more energy` };
  if (p.queue.length + n > 5) return { ok: false, msg: 'Production queue is full' };
  side.res.c -= d.cost.c * n; side.res.e -= d.cost.e * n;
  for (let i = 0; i < n; i++) p.queue.push(type);
  logSpend(g, s, 'u', d.cost.c * n, d.cost.e * n);
  return { ok: true, msg: n === 2 ? 'Riflemen ×2 queued' : `${d.name} queued` };
}

function spawnUnit(g, s, type, u, v) {
  RNG.g = g; // v2.50: roll from this match's stream (these can run from the UI, between ticks)
  const d = UDEF[type];
  const unit = { id: g.nid++, kind: 'u', type, side: s, u, v, z: d.air ? (type === 'interceptor' ? rand(100, 124) : type === 'leviathan' ? rand(88, 98) : type === 'drone' ? rand(104, 114) : type === 'razorwing' ? rand(56, 72) : type === 'needlewing' ? rand(50, 64) : type === 'cloudwing' ? rand(62, 76) : type === 'broodtyrant' ? rand(78, 88) : type === 'worldrender' ? rand(84, 94) : type === 'wraithwing' ? rand(64, 80) : type === 'prismwing' ? rand(56, 70) : type === 'shardstorm' ? rand(66, 80) : type === 'voidcarrier' ? rand(78, 88) : type === 'sovereign' ? rand(84, 94) : rand(70, 94)) : 0,
    laneV: rand(-LANE_V, LANE_V), hp: d.hp, maxHp: d.hp, cd: simRnd() * 0.5, face: dirOf(s), anim: fxRnd() * 10,
    moving: false, rallyOff: -simRnd() * 100, recoil: 0, hitT: 0, shT: 0, vet: 0, aimAir: 0, medAt: -1, tgt: 0, braceT: 0, braceCd: 0, lastHurt: -99, lastAct: -99, creepAt: -1, temp: 0, tLife: 0, tSrc: null, kid: 0, spawnT: 0, dis: 0, disT: 0, slow: 0, slowT: 0, chT: 0, chTgt: 0, pulseCd: 0, shp: d.shp || 0, maxShp: d.shp || 0, shpT: -99, shpHit: -99, ovT: 0, frzT: 0, leapCd: 0, leaping: 0, lu: 0, lv: 0, ld: 0, corr: 0, corrT: 0, burstCd: 0 }; // tgt: what it last attacked; braceT/braceCd: the Bulwark's brace (v2.17); lastHurt/lastAct: last damage taken/dealt, creepAt: last creep regen (v2.18); leap*: the Leaper's jump, corr/corrT: corrosion, burstCd: the Dreadthorn's spines (v2.19) // vet: a Drilled Rifleman (v2.13); aimAir: where a Hydra's guns point (v2.14); medAt: last healed by a Medicopter (v2.15) // shT (shield until) set from the start keeps every unit the same shape for the JS engine
  if (MAP_LANED) unit.lane = laneNew(g.sides[s]); // v2.63: the lane it walks (Classic: no lane key at all)
  if (NAV.on && !d.air && navShut(unit.u, unit.v)) [unit.u, unit.v] = navOpen(unit.u, unit.v); // v2.66: a ground unit never appears on closed ground (a warp-in or brood on the ridge)
  g.ents.push(unit);
  g.sides[s].stats.built++;
  return unit;
}
// v2.63 (multi-lane engine): which lane a new unit takes. side.laneNew: a lane index for every new unit, or null/undefined
// to alternate between the lanes (the default, and what the AI does). setLane moves units already out there and/or sets
// laneNew; scope 'all' (every unit, and new ones), 'lane' (every unit on lane key), 'type' (every unit of type key).
function laneNew(side) {
  if (side.laneNew != null) return side.laneNew;
  const k = side.laneNext || 0; side.laneNext = (k + 1) % MAP.lanes.length; return k;
}
function setLane(g, s, scope, key, lane) {
  if (!MAP_LANED) return { ok: false, msg: 'This map has one lane' };
  const to = laneIx(lane); if (to < 0) return { ok: false, msg: 'Unknown lane' };
  const from = scope === 'lane' ? laneIx(key) : -1;
  if (scope === 'lane' ? from < 0 : scope === 'type' ? !UDEF[key] : scope !== 'all') return { ok: false, msg: 'Unknown order' };
  const side = g.sides[s]; let n = 0;
  if (scope === 'all') side.laneNew = to;
  for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && (scope === 'all' || (scope === 'lane' ? e.lane === from : e.type === key)) && e.lane !== to) { e.lane = to; n++; }
  return { ok: true, n, msg: `${n} unit${n === 1 ? '' : 's'} to lane ${MAP.lanes[to].id}` };
}

// The HQ is shielded while any other building on that side still stands
function refreshShields(g) {
  for (let s = 0; s < 2; s++) {
    const hq = g.sides[s].hq, sh = g.ents.some(b => b.kind === 'b' && b.side === s && b.type !== 'hq' && b.type !== 'bunker' && b.hp > 0 && b.built); // v2.32: node bunkers don't hold the shield up // v2.11: finished buildings only (no shield from construction starts)
    if (hq.shielded && !sh) { ev(g, { type: 'shieldDown', side: s, seen: !!g.fog && visibleTo(g, 1 - s, hq) }); lg(g, s, 'H'); }
    hq.shielded = sh;
  }
}
// Top-bar readout for one side's HQ. With a viewer, an enemy HQ out of sight shows what the viewer last saw.
function hqStatus(g, s, viewer = s) {
  const hq = g.sides[s].hq;
  if (viewer !== s && !g.over && hq.hp > 0 && !visibleTo(g, viewer, hq)) {
    const k = g.fog[viewer].lastHQ;
    return { hp: k.hp, maxHp: k.maxHp, frac: k.hp / k.maxHp, state: k.shielded ? 'shielded' : 'exposed', stale: true };
  }
  const hp = Math.max(0, hq.hp);
  return { hp, maxHp: hq.maxHp, frac: hp / hq.maxHp, state: hp <= 0 || hq.dead ? 'destroyed' : hq.shielded ? 'shielded' : 'exposed' };
}

