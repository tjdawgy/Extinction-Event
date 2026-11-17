/* ---------- Faction rework, batch 5b (v2.88): the Bloomhost swarm pass ----------
   REWORK.b5b, stored per game in g.rw like the earlier batches (rwB5b). Off: everything plays exactly as in v2.87 and
   nothing below runs or is saved (every field here is set only by this code). On (the new-game default):
   - Broods (Skitterling): one Skitterling order at the Larva Pit is a brood: BROOD.cost credits, BROOD.time s, and it
     hatches BROOD.n Skitterlings of BROOD.hp health each. Half supply each and the 60-alive limit stay: a brood counts
     BROOD.n against both while it is queued, and a brood that would pass the limit when it hatches hatches only what fits,
     refunding the rest (broodTrain, broodHatch). Modelled on Mass Deployment's pairs (one order, several units).
   - Swarm surge (every Bloomhost ground unit): SURGE.per faster for every other Bloomhost ground unit of its side within
     SURGE.r, up to SURGE.max (u.sgN, counted once a tick in update5b). It stacks with creep speed; not while burrowed,
     latched, charging or dazed (those move by their own rules).
   - Kill frenzy (every Bloomhost unit): an enemy unit dying within KFRENZY.r of Bloomhost units makes them attack
     KFRENZY.rate times as fast for KFRENZY.dur s (u.kfT; u.kfS when it last started, for the pulse). A new kill refreshes
     the timer; it never stacks.
   - Spitter: volleys of QUILL.n acid quills QUILL.gap s apart (QUILL.dmg each, weapon 'quill': 1.5× to aircraft), a volley
     every QUILL.cycle s (u.qn: quills fired in this volley); range QUILL.range, air and ground, corrosion kept. Aircraft in
     range first (preferAir; like the Hydra, it then also tracks a hopping Wraithwing).
   - Needlewing: hits aircraft too (weapon 'needle5': the Needlewing's table with air 1.0), swarm bonus kept. A Cloudwing's
     offspring are Needlewings and play the same way. */
const rwB5b = g => !!(g && g.rw && g.rw.b5b);
const BROOD = { n: 4, cost: 120, time: 6, hp: 50 };
const SURGE = { per: 0.05, max: 0.4, r: 80, streak: 0.25 }; // streak: the share of the bonus from which the art draws a motion streak
const KFRENZY = { r: 120, rate: 1.3, dur: 4 };
const QUILL = { n: 3, gap: 0.12, dmg: 6, cycle: 1.2, range: 150, air: 1.5 };
const AI5B = { pack: 90, spit: 20, near: 170, wave: 1.25, air: 0.12 };
Object.assign(DMG, {
  quill:   { light: 1.0, heavy: 0.9, vehicle: 0.8, air: QUILL.air, building: 0.4 }, // a Spitter's quill: the acid table on the ground, 1.5× to aircraft
  needle5: Object.assign({}, DMG.needle, { air: 1.0 }),                             // a Needlewing's sting, now at aircraft too
});
PSPEED.quill = 640;
const RW5B_D = {
  skitterling: () => Object.assign({}, UDEF.skitterling, { hp: BROOD.hp, cost: { c: BROOD.cost / BROOD.n, e: 0 }, time: BROOD.time, brood: { n: BROOD.n, c: BROOD.cost, time: BROOD.time } }), // cost: per Skitterling (the info card shows the brood's)
  spitter: () => Object.assign({}, UDEF.spitter, { weapon: 'quill', dmg: QUILL.dmg, cd: QUILL.cycle / QUILL.n, range: QUILL.range, hitsAir: true, preferAir: true, quill: true }), // cd: the average gap, as the info card reads it
  needlewing: () => Object.assign({}, UDEF.needlewing, { weapon: 'needle5', hitsAir: true }),
};
const isSwarmG = d => d.fac === 'bloomhost' && !d.air; // a Bloomhost ground unit (surge)
const rw5bEv = (g, side, type, extra) => ev(g, Object.assign({ type, side }, extra || {}));
const rw5bCount = (g, s, k, n) => { const side = g.sides[s]; if (!side) return; const c = side.sw5 || (side.sw5 = {}); c[k] = (c[k] || 0) + (n || 1); }; // per-side counters (self-play; saved with the side)

/* ---- Broods ---- */
// What one order of a type costs and takes in game g (the UI's cards and the AI read it; a brood in a b5b game)
const trainCost = (g, t) => t === 'skitterling' && rwB5b(g) ? { c: BROOD.cost, e: 0 } : UDEF[t].cost;
const trainPop = (g, t) => t === 'skitterling' && rwB5b(g) ? UDEF.skitterling.pop * BROOD.n : UDEF[t].pop;
const trainTime = (g, t) => t === 'skitterling' && rwB5b(g) ? BROOD.time : UDEF[t].time;
function broodTrain(g, s, d, prods) {
  const side = g.sides[s], cost = BROOD.cost, pop = d.pop * BROOD.n;
  if (d.max && unitCount(g, s, 'skitterling') >= d.max) return { ok: false, msg: `At most ${d.max} ${PLURAL.skitterling} at a time` };
  prods.sort((a, b) => a.queue.length - b.queue.length);
  const p = prods.find(b => b.queue.length < 5) || prods[0], cap = popCap(g, s);
  if (popUsed(g, s) + pop > cap) return { ok: false, msg: cap >= POP_MAX ? 'Army is at maximum size' : 'Army is full — build or upgrade a Habitat' };
  if (side.res.c < cost) return { ok: false, msg: `Need ${Math.ceil(cost - side.res.c)} more credits` };
  if (p.queue.length >= 5) return { ok: false, msg: 'Production queue is full' };
  side.res.c -= cost; p.queue.push('skitterling');
  logSpend(g, s, 'u', cost, 0);
  return { ok: true, msg: `Brood of ${BROOD.n} Skitterlings queued` };
}
// How many of a finished brood hatch: what fits under the limit (alive only; the brood itself left the queue), the rest refunded
function broodHatch(g, b) {
  const d = UDEF.skitterling, s = b.side;
  let alive = 0; for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.type === 'skitterling' && e.hp > 0) alive++;
  const n = d.max ? clamp(d.max - alive, 0, BROOD.n) : BROOD.n;
  if (n < BROOD.n) { const back = BROOD.cost / BROOD.n * (BROOD.n - n); g.sides[s].res.c += back; rw5bCount(g, s, 'refund', BROOD.n - n); }
  rw5bEv(g, s, 'brood', { u: b.u, n }); rw5bCount(g, s, 'broods'); rw5bCount(g, s, 'hatched', n);
  return n;
}
function rw5bSpawn(g, e) { if (e.type === 'skitterling') e.hp = e.maxHp = BROOD.hp; } // spawnUnit, b5b on

/* ---- Swarm surge: counted once a tick ---- */
const SG_L = [[], []];
function updateSurge(g) {
  SG_L[0].length = 0; SG_L[1].length = 0;
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.hp <= 0 || e.side > 1 || e.side < 0) continue;
    if (!isSwarmG(UDEF[e.type])) continue;
    if (e.gone) { if (e.sgN) e.sgN = 0; continue; }
    SG_L[e.side].push(e);
  }
  const R = SURGE.r, R2 = R * R, cap = Math.round(SURGE.max / SURGE.per);
  for (const L0 of SG_L) {
    L0.sort((a, b) => a.u - b.u || a.id - b.id);
    for (let i = 0; i < L0.length; i++) {
      const a = L0[i]; let n = 0;
      for (let j = i - 1; j >= 0 && a.u - L0[j].u <= R; j--) { const b = L0[j], dv = (b.v - a.v) * DV_W, du = a.u - b.u; if (du * du + dv * dv <= R2) n++; }
      for (let j = i + 1; j < L0.length && L0[j].u - a.u <= R; j++) { const b = L0[j], dv = (b.v - a.v) * DV_W, du = b.u - a.u; if (du * du + dv * dv <= R2) n++; }
      n = Math.min(cap, n);
      if (n >= cap && !(a.sgN >= cap) && a.side >= 0) rw5bCount(g, a.side, 'surgeMax');
      a.sgN = n;
    }
  }
}
// The speed multiplier from surge (1 when it doesn't apply: burrowed, latched; charging and dazed units never get here)
const surgeMul = u => u.sgN && !u.bur && !u.lt && !u.ltH ? 1 + Math.min(SURGE.max, u.sgN * SURGE.per) : 1;

/* ---- Kill frenzy ---- */
function kfKill(g, dead) {
  const R2 = KFRENZY.r * KFRENZY.r; let n = 0, s0 = -1;
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.hp <= 0 || e.side === dead.side || e.side < 0 || e.side > 1 || e.gone === 2) continue;
    if (UDEF[e.type].fac !== 'bloomhost') continue;
    const du = e.u - dead.u, dv = (e.v - dead.v) * DV_W; if (du * du + dv * dv > R2) continue;
    if (!(e.kfT > g.t)) e.kfS = g.t; // the pulse: from the moment it started
    e.kfT = g.t + KFRENZY.dur; n++; s0 = e.side;
  }
  if (n) { rw5bEv(g, s0, 'kfrenzy', { u: dead.u, n }); rw5bCount(g, s0, 'frenzy'); rw5bCount(g, s0, 'frenzyUnits', n); }
}
const kfRate = (g, u) => u.kfT > g.t ? KFRENZY.rate : 1;

/* ---- Spitter volleys ---- */
function qAfter(g, u, T) {
  u.qn = (u.qn || 0) + 1;
  if (T && T.kind === 'u' && UDEF[T.type].air && !(T.lnd >= 2)) rw5bCount(g, u.side, 'quillAir');
  else rw5bCount(g, u.side, 'quill');
  if (u.qn >= QUILL.n) { u.qn = 0; u.cd = (QUILL.cycle - QUILL.gap * (QUILL.n - 1)) * rand(0.9, 1.1); rw5bCount(g, u.side, 'volleys'); }
  else u.cd = QUILL.gap;
}
// A Needlewing's strike on an aircraft (counted for the self-play report)
function nwHit(g, u, T) { if (T && T.kind === 'u' && UDEF[T.type].air && !(T.lnd >= 2)) rw5bCount(g, u.side, 'needleAir'); }

/* ---- each tick (update), b5b on ---- */
function update5b(g) { updateSurge(g); }

/* ---- the AI (sides it plays) ---- */
const aiAirShare = theirs => { let a = 0, t = 0; for (const u of theirs) { const d = UDEF[u.type], v = (d.cost.c + d.cost.e) * (u.w ?? 1); t += v; if (d.air && d.weapon) a += v; } return t ? a / t : 0; };
// A Bloomhost AI's attack moves as a pack (surge needs neighbours) and keeps its Spitters with it: on the attack, ground units more
// than AI5B.pack ahead of the swarm's median wait for it (they fight what is in reach); Spitters wait AI5B.spit behind the median
function aiRework5b(g, s, mine) {
  const side = g.sides[s], dir = dirOf(s);
  if (facOf(side.faction) !== 'bloomhost' || side.stance !== 'attack') return;
  const grp = mine.filter(u => isSwarmG(UDEF[u.type]) && !u.gone && !u.temp && UDEF[u.type].weapon && u.id !== side.scoutId && u.id !== side.spotter && !capBusy(side, u.id) && !u.tn && !UDEF[u.type].tunnel && !UDEF[u.type].bore);
  if (grp.length < 4) return;
  const mel = grp.filter(u => u.type !== 'spitter' && u.type !== 'bilecaster'), base = mel.length >= 3 ? mel : grp;
  const xs = base.map(u => dir * u.u).sort((a, b) => a - b), med = xs[xs.length >> 1];
  for (const u of grp) {
    const lim = u.type === 'spitter' ? med - AI5B.spit : med + AI5B.pack;
    if (dir * u.u > lim) { u.aiWait = g.t + 1.5; }
  }
}
// A Bloomhost AI facing aircraft takes the paths with anti-air (Acidic Evolution: Spitters; Swarm Bloom: Needlewings)
// Enemy air as batch 5b reads it: aircraft at AI5B.air or more of what it knows of the enemy army; for the Bloomspire also any enemy
// aircraft it knows of, or an enemy air production building it has seen at T2 or more (v2.90: batch 5c's Bloomspire roll reads it too)
const aiAirGhost5b = (g, s, tier) => Object.values(g.fog[s].ghosts).some(gh => gh.type === 'techlab' && gh.side !== s && gh.tier >= tier);
const aiAirSignal5b = (g, s, type, theirs) => aiAirShare(theirs) >= AI5B.air || (type === 'techlab' && (aiAirGhost5b(g, s, 2) || aiAirShare(theirs) > 0));
function aiPath5b(g, s, b, theirs) {
  if (facOf(g.sides[s].faction) !== 'bloomhost') return null;
  if (!aiAirSignal5b(g, s, b.type, theirs)) return null; // the Bloomspire also reads what it has seen of the enemy's air production
  const want = b.type === 'barracks' ? 'B' : b.type === 'techlab' ? 'A' : null;
  if (!want) return null;
  const have = g.ents.some(e => e !== b && e.side === s && e.type === b.type && e.hp > 0 && (e.path || e.upPath) === want);
  return have ? null : want;
}
// Scores (on top of the shared ones): broods are the swarm's backbone, Spitters and Needlewings answer aircraft
function aiScores5b(g, s, sc, c) {
  const { comp, theirs, mine } = c, air = aiAirShare(theirs), nSk = unitCount(g, s, 'skitterling'), nSp = mine.filter(u => u.type === 'spitter').length;
  const nG = mine.filter(u => isSwarmG(UDEF[u.type]) && u.type !== 'spitter').length;
  if (sc.skitterling !== undefined) sc.skitterling = (1.2 + comp.light * 0.4 + (1 - air) * 0.3 - comp.vehicle * 0.4 - aiSplashShare(theirs) * 0.6) * clamp(1 - nSk / (UDEF.skitterling.max || 60), 0.05, 1);
  if (sc.spitter !== undefined) sc.spitter = 1.0 + air * 3.0 + (air > 0.05 ? 0.6 : 0) + (nSp < nG / 4 ? 0.4 : 0) + comp.heavy * 0.3;
  if (sc.needlewing !== undefined) sc.needlewing = 1.0 + air * 2.2 + comp.light * 0.4 + comp.vehicle * 0.3;
}
const aiSplashShare = theirs => { let a = 0, t = 0; for (const u of theirs) { const d = UDEF[u.type], v = (d.cost.c + d.cost.e) * (u.w ?? 1); t += v; if (d.splash || d.weapon === 'flame' || d.chain) a += v; } return t ? a / t : 0; };

// Texts the player sees follow the new-game default (numbers in UNIT_TIPS, read live)
for (const [t, on] of [['skitterling', 'Small, fast biter that hatches in broods. It bites harder when several attack one target, and the swarm runs faster in numbers. Dies quickly to splash and can\'t hit aircraft.'],
  ['spitter', 'Hunched gunner that fires volleys of acid quills at air and ground, aircraft first: quills hit aircraft harder and corrode what they hit. Fragile once enemies close in.'],
  ['needlewing', 'Cheap, fast dart of a flyer that stings ground units and aircraft, harder in a pack. Dies quickly to anti-air and splash.']]) {
  const d0 = UDEF[t].desc; Object.defineProperty(UDEF[t], 'desc', { get: () => REWORK.b5b ? on : d0, enumerable: true, configurable: true });
}
function rw5bText(o, k, on) { const x = Object.getOwnPropertyDescriptor(o, k), off = x.get ? x.get() : x.value; Object.defineProperty(o, k, { get: () => REWORK.b5b ? on : off, enumerable: true, configurable: true }); }
rw5bText(TREES_BH.barracks.B.steps[2], 'txt', 'Unlocks Spitters: volleys of acid quills at air and ground, aircraft first');
rw5bText(TREES_BH.techlab.A.steps[2], 'txt', 'Unlocks Needlewings: cheap flyers that sting ground units and aircraft, harder in a pack');
{ const B = BDEFS && BDEFS.bloomhost && BDEFS.bloomhost.barracks; if (B && B.tiers) rw5bText(B.tiers, 1, 'Spawns Skitterlings in broods'); }
// The faction's mechanic, as the Codex, the faction picker and the tutorial explain it (numbers in the Codex's live line)
{ const m0 = FACTIONS.bloomhost.mech, m5 = { name: 'Creep and the swarm', txt: 'Creep from your buildings and held nodes speeds and heals Bloomhost ground units. The swarm hatches in broods, runs faster in numbers and attacks faster when enemies die nearby.' };
  Object.defineProperty(FACTIONS.bloomhost, 'mech', { get: () => REWORK.b5b ? m5 : m0, enumerable: true, configurable: true }); }
const swarmFacts = () => `Broods of ${BROOD.n} for ${BROOD.cost} credits (${txN(BROOD.time)} s, ${BROOD.hp} health each); swarm surge +${txP(SURGE.per)} speed for every other Bloomhost ground unit within ${SURGE.r}, up to +${txP(SURGE.max)}; kill frenzy: an enemy unit dying within ${KFRENZY.r} makes your organisms attack ${txP(KFRENZY.rate - 1)} faster for ${txN(KFRENZY.dur)} s (refreshed, never stacked).`;
