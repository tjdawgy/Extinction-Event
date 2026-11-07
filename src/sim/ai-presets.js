/* ---------- AI personalities ----------
   Strategic priorities, rolled secretly at the start of each match and independent of difficulty
   (difficulty still decides how well they are carried out). A personality adds no rules, resources or
   vision: it only reorders and reweights the AI's existing choices, with some variation per match. */
const PERSONAS = ['aggressor', 'turtle', 'economist', 'trickster'];
const PERSONA_NAME = { aggressor: 'The Aggressor', turtle: 'The Turtle', economist: 'The Economist', trickster: 'The Trickster', boomer: 'The Boomer' };
// v2.41 (audit phase 7a): the Boomer, the human-style greedy opening (three economy buildings first, every Refinery to T2 at
// once, a small army until the economy is up). Never rolled at random (PERSONAS stays the four); a preset's opening list
// (byFac kinds) can name it, and the strategy search measured it for Hard.
const PERSONA_EXTRA = ['boomer'];
/* ---------- AI presets (v2.38, audit phase 4) ----------
   One brain (aiUpdate and its helpers) for every AI side, driven by dials. A preset holds the dials and says whether the
   competence rules are on; the personality (rollPersona) still sets the style: build plan, attack edges, unit tastes,
   paths. 'legacy' is v2.37's AI exactly: its dials are the constants that AI used and its competence rules are off (the
   replay fingerprint tests prove it plays the same). 'default' is the game's AI from v2.38: the same brain with
   competence rules for every v2.37 unit (smart). Dials:
   nodes      field nodes it fights for: 1 its own only, 2 its own and the middle, 3 all three (the far one under their guns)
   eco        Refineries above the difficulty's number (economy vs army spending)
   bank       credits it counts as rich: with a full army and this banked, it commits
   attackAt   no base attack before this game time (s);  minArmy: the smallest army value it attacks a base with
   turrets    Turrets it keeps at home beyond its plan (defense investment)
   sigAt      earliest game time for its signature building
   sell       sells a spare building to make room when stuck without a Habitat
   scout      seconds between scouting runs by one cheap unit (0: never)
   retreat    an attack pulls back when its army is below this share of the enemy's it knows of
   delay      reaction delay: multiplies the difficulty's time between decisions
   late       game time after which it stops waiting for a clear edge and attacks with what it has
   comp       unit composition weights by unit type (multiply the unit's score) */
// The tactics rules (v2.40, audit phase 6a; audit/ai-tactics-report.md has each one's A/B result). Each is switchable for
// the harness (dial.fix); the Default preset turns on the ones that measured as an improvement: engage (+5 wins in 48 against
// v2.39) and sig (+5). Measured and left off: mass, defend, finish, hold (neutral), tech as a fixed rule (worse; the tech
// dial is Hard's), axf (worse).
const AI_TACTICS = { mass: false, engage: true, defend: false, sig: true, tech: false, finish: false, axf: false, hold: false,
  // v2.41 (audit phase 7a, audit/hard-vs-human-report.md): rules against human-style greedy play, each A/B tested against
  // the scripted Greedy bot (audit/sim/greedy.js); off in Default, the Hard preset turns on the ones it keeps
  read: false,    // scout from 0:35 and read the opponent: many economy buildings, upgraded Refineries or nodes taken with a small army
                  // mark a greedy opening, answered by a timed attack (army first until it lands)
  punish: false,  // with read: the timed push itself (the field and its nodes from 1:45, at 1.5x the strength it has seen)
  contest: false, // every personality contests a field node the enemy holds or is taking with little around it, from a smaller army
  counter: false, // no anti-air-only unit without seen enemy air; an infantry flood calls for splash and flame (paths and scores)
  nowave: false,  // no piecemeal waves: field and node pushes weigh every enemy unit it knows of, every push waits out the regroup
                  // time, and a push leaves only with most of the army gathered
  shield: false,  // defensive abilities (Emergency Shield, Shield Overcharge) only on units already taking fire from enemies in reach
  est: false,     // an unseen army still counts: the enemy army is at least 40% of what its scouted economy has earned, less what it killed
  fill: false,    // the opening's army cap (earlyFill) lifts at 2:30, or once the enemy army it knows of is worth 70% of its own
  breakout: false, // v2.42 (audit phase 7b): an enemy army camped at its base and stronger than its own there: new units gather deep
                   // under the HQ gun and hold instead of trickling out; once 1.4x stronger they break out together; a Turret goes up
                   // on the front pad as soon as the pressure starts (5 s), not only against an infantry rush
  adapt: false,   // v2.42: with read, the opening adapts to what its scout saw: Turrets (a turtle) → one more Refinery; an early army
                  // (a rush) → a Turret on the front pad at once
  power: false,   // energy starved (under 100 banked, energy income under a fifth of credit income, after 2:00): another Reactor first,
                  // else the Reactor upgrades first, else (every Reactor at T3, 600 credits banked) a Refinery traded for a Reactor
};
const AI_SIG_LATE = 300; // sig: the earliest time for a signature building (later with the sigAt dial)
const AI_TECH = { economist: 'techlab', trickster: 'techlab', turtle: 'factory', aggressor: 'barracks' }; // tech: the building each personality takes to T3 first (the tech dial overrides)
const AI_DIALS = { nodes: 2, eco: 0, bank: 2500, attackAt: 0, minArmy: 300, turrets: 0, sigAt: 0, sell: true, scout: 0, retreat: 0.7, delay: 1, late: 1080, comp: {} };
const AI_PRESETS = {
  legacy: { name: 'Legacy', smart: false, dials: AI_DIALS },
  default: { name: 'Default', smart: true, dials: Object.assign({}, AI_DIALS, { scout: 70, comp: {} }),
    fix: { scores: true, room: true, pathUnits: true, spot: true, leash: true, carrier: true, timing: true, spend: true, batch: false, // batch: reinforcements in groups (measured neutral in v2.38, off) // the competence rules, each switchable (for the harness)
      ...AI_TACTICS } }, // v2.40 (audit phase 6a): the tactics rules (AI_TACTICS)
  // v2.40 (audit phase 6a): Hard plays the best strategies the harness found for each faction (byFac), with the Default's
  // rules; no resource bonus and no information a player wouldn't have
  // Each faction: the Economist opening (the best of the four for all three), decisions every 0.6 of the difficulty's
  // interval (reaction time, not information), no signature building (sigAt beyond any match), and for Last Fist the Air
  // Power Tech Lab to T3 right after T2. Searched over 768 paired matches (the report has every candidate).
  // v2.41 (audit phase 7a, audit/hard-vs-human-report.md): the Boomer opening for every faction (the search with the Greedy
  // bot in the field picked it over all four personalities), reaction 0.6 (Bloomhost 1), no signature building, and the
  // phase 7a rules it kept (HARD_FIX). Its v2.40 form is the hard240 preset.
  // v2.42 (audit phase 7b, audit/strategy-report.md): Hard varies its opening per match (kinds: one picked at random, a
  // repeat weights it), from the openings the phase 7b search scored well with each faction, and adapts after scouting
  // (HARD_FIX_7B: read, adapt, punish); the flood share for its Flame Tank answer is 0.4 (was 0.55)
  hard: { name: 'Hard', smart: true, dials: Object.assign({}, AI_DIALS, { scout: 70, comp: {} }), fix: null, byFac: {
    lastfist: { kinds: ['boomer', 'boomer', 'economist', 'turtle'], dials: { delay: 0.6, sigAt: 99999, flood: 0.4 } },
    bloomhost: { kinds: ['boomer', 'boomer', 'boomer', 'turtle'], dials: { delay: 1, sigAt: 99999, flood: 0.4 } },
    axiarchs: { kinds: ['boomer', 'turtle', 'turtle'], dials: { delay: 0.6, sigAt: 99999, flood: 0.4 } } } },
  // v2.42's Hard exactly (with v2.42's numbers and mechanics via setBalance7c(false), setMech7c(false)): the baseline for phase 7c
  hard242: { name: 'Hard v2.42', smart: true, dials: Object.assign({}, AI_DIALS, { scout: 70, comp: {} }), fix: null, byFac: {
    lastfist: { kinds: ['boomer', 'boomer', 'economist', 'turtle'], dials: { delay: 0.6, sigAt: 99999, flood: 0.4 } },
    bloomhost: { kinds: ['boomer', 'boomer', 'boomer', 'turtle'], dials: { delay: 1, sigAt: 99999, flood: 0.4 } },
    axiarchs: { kinds: ['boomer', 'turtle', 'turtle'], dials: { delay: 0.6, sigAt: 99999, flood: 0.4 } } } },
  // v2.41's Hard exactly (with v2.41's numbers via setBalance7b(false)): the baseline for phase 7b
  hard241: { name: 'Hard v2.41', smart: true, dials: Object.assign({}, AI_DIALS, { scout: 70, comp: {} }), fix: null, byFac: {
    lastfist: { kinds: ['boomer'], dials: { delay: 0.6, sigAt: 99999 } },
    bloomhost: { kinds: ['boomer'], dials: { delay: 1, sigAt: 99999 } },
    axiarchs: { kinds: ['boomer'], dials: { delay: 0.6, sigAt: 99999 } } } },
  // v2.40's Hard exactly: the baseline for phase 7a
  hard240: { name: 'Hard v2.40', smart: true, dials: Object.assign({}, AI_DIALS, { scout: 70, comp: {} }), fix: null, byFac: {
    lastfist: { kinds: ['economist'], dials: { delay: 0.6, sigAt: 99999, tech: 'techlab' } },
    bloomhost: { kinds: ['economist'], dials: { delay: 0.6, sigAt: 99999 } },
    axiarchs: { kinds: ['economist'], dials: { delay: 0.6, sigAt: 99999 } } } },
  // v2.39's Default exactly (none of the v2.40 tactics rules): the baseline the harness measures against
  v239: { name: 'Default v2.39', smart: true, dials: Object.assign({}, AI_DIALS, { scout: 70, comp: {} }),
    fix: { scores: true, room: true, pathUnits: true, spot: true, leash: true, carrier: true, timing: true, spend: true, batch: false } },
};
// v2.41: the phase 7a rules Hard keeps (each A/B in the report; punish measured worse and stays off)
const HARD_FIX = { read: true, contest: true, counter: true, nowave: true, shield: true, power: true, fill: true, est: true };
// v2.42 (audit phase 7b): Hard adds breakout (no trickling out of a contained base, Turrets as soon as pressure starts) and
// adapt (the scout's read changes the opening), and punish again
const HARD_FIX_7B = Object.assign({}, HARD_FIX, { breakout: true, adapt: true, punish: true }); // punish: the timed attack on a greedy opening its scout saw (off in v2.41; the 7b numbers make it pay)
AI_PRESETS.hard.fix = Object.assign({}, AI_PRESETS.default.fix, HARD_FIX_7B);
AI_PRESETS.hard240.fix = Object.assign({}, AI_PRESETS.default.fix);
AI_PRESETS.hard241.fix = Object.assign({}, AI_PRESETS.default.fix, HARD_FIX);
AI_PRESETS.hard242.fix = Object.assign({}, AI_PRESETS.hard.fix);
// v2.43 (audit phase 7c): the signature building costs no pad now (the signature pad), so Hard builds one: from sigAt, the
// one named per faction (sig), each the better of the two in the phase 7c A/B (audit/polish-report.md)
const HARD_SIG_7C = { lastfist: { sigAt: 300, sig: 'sigA' }, bloomhost: { sigAt: 300, sig: 'sigB' }, axiarchs: { sigAt: 300, sig: 'sigA' } };
for (const f in HARD_SIG_7C) Object.assign(AI_PRESETS.hard.byFac[f].dials, HARD_SIG_7C[f]);
// v2.43: the Axiarch Turtle opening fell to 58% against the Default field (its node now has to be held; Boomer 92%,
// Economist 71%, 24 paired each, audit/polish-report.md), so Hard's Axiarchs open Boomer two times in three (was Turtle)
AI_PRESETS.hard.byFac.axiarchs.kinds = ['boomer', 'boomer', 'turtle'];
/* ---------- AI attack decisions (v2.60, Phase 1 stalemate fix; KNOWN_ISSUES.md "AI attack decisions") ----------
   Two Hard AIs reached 20:00 undecided in most matches. Hard's rules for it (Easy and Normal play the Default preset,
   unchanged; hard259 keeps v2.59's Hard):
   scoutGo: its scout (and raiders) really go: a unit on the side's Retreat ran home and held its fire, so an AI that
     never left Retreat never saw the enemy.
   estFix: the unseen enemy army is estimated from time (ATTACK.est: base + rate * t, at most cap) and from what it last
     saw (that army plus ATTACK.est.rebuild per second), not from 40% of every credit the enemy ever earned minus every
     kill (that grew without bound while nothing was seen, and fell to 0 after a few fights).
   press: attack when clearly ahead on army or economy, fight for the centre node at parity, and need a smaller edge
     as the storm nears (ATTACK.press).
   raid: when no push is worth it, a few fast units raid the enemy's node (ATTACK.raid).
   supply: at its army limit with money banked, trade a spare building for another Habitat (ATTACK.supply). */
const ATTACK = {
  est: { base: 250, rate: 4, cap: 2500, rebuild: 8, seen: 0.5 },
  press: { from: 240, edge: 1.15, edgeLate: 0.75, late0: 840, eco: 1.25, field: 0.85, siegeMax: 500 }, // siegeMax: from this HQ gun range a siege line is mid-field
  raid: { at: 240, every: 75, n: 4, share: 0.3, dur: 45, minHp: 0.5 },
  supply: { from: 300, bank: 800 },
};
AI_PRESETS.hard259 = Object.assign({}, AI_PRESETS.hard, { name: 'Hard v2.59', fix: Object.assign({}, AI_PRESETS.hard.fix) });
Object.assign(AI_PRESETS.hard.fix, { scoutGo: true, estFix: true, press: true, raid: true, supply: true });
const AI_PRESET_KEYS = Object.keys(AI_PRESETS);
const aiDials = P => (P && P.dial) || AI_DIALS; // a persona without dials (an older save) reads the legacy constants
const aiSmart = P => !!(P && P.smart);
const aiFix = (P, k) => !!(P && P.smart && (!P.dial || !P.dial.fix || P.dial.fix[k])); // one competence rule on (the harness can switch each off)
const pickOne = a => a[Math.floor(simRnd() * a.length)];
// preset: 'legacy' or 'default' (v2.38); it adds the dials and the competence switch after the personality's own rolls,
// with no random numbers of its own, so a Legacy personality rolls exactly as before
// v2.40: fac and diffKey let a preset carry per-faction settings (byFac: the openings it picks from, dials, rules; the Hard
// preset's searched strategies) and per-difficulty dials (byDiff: Easy and Normal slowed to their v2.39 challenge). A preset
// without them rolls exactly as before.
function rollPersona(kind, preset, fac, diffKey) {
  const A = AI_PRESETS[preset] || AI_PRESETS.default, F = A.byFac && A.byFac[facOf(fac)];
  const P = rollPersona0(kind || (F && F.kinds ? pickOne(F.kinds) : kind));
  P.preset = AI_PRESETS[preset] ? preset : 'default'; P.smart = A.smart; P.dial = Object.assign({}, A.dials, F && F.dials, { comp: Object.assign({}, A.dials.comp) }, A.fix ? { fix: Object.assign({}, A.fix, F && F.fix) } : {});
  if (F && F.paths) P.paths = Object.assign({}, P.paths, F.paths); // v2.41: a preset's per-faction production paths (Last Fist terms)
  if (A.byDiff && A.byDiff[diffKey]) Object.assign(P.dial, A.byDiff[diffKey]);
  return P;
}
function rollPersona0(kind) {
  if (!PERSONAS.includes(kind) && !PERSONA_EXTRA.includes(kind)) kind = pickOne(PERSONAS);
  // refDelta: Refineries vs what the difficulty allows; wave / fieldEdge / attackEdge scale the attack thresholds;
  // upShift moves the first upgrade; bias weights unit choices; feint: share of pushes that pull back;
  // deadline: by then a Turtle with a full army attacks; opportunist: punishes weak spots it can see;
  // earlyFill: share of its army limit it fills in the first 5 minutes (a greedy opening);
  // unitsFirst: after its first four buildings, never holds money back for the next one, so the army comes first
  const P = { kind, earlyFill: 1, refDelta: 0, wave: 1, fieldEdge: 1, attackEdge: 1, upShift: 0, upgFirst: [], bias: {}, feint: 0, deadline: 1e9, opportunist: false, plan: AI_PLAN };
  if (kind === 'aggressor') Object.assign(P, {
    plan: pickOne([['barracks', 'barracks', 'refinery', 'habitat', 'factory', 'refinery', 'reactor', 'techlab'],
                   ['barracks', 'refinery', 'barracks', 'factory', 'habitat', 'refinery', 'reactor', 'techlab']]),
    wave: rand(0.85, 1.0), fieldEdge: rand(0.6, 0.75), attackEdge: 1, upShift: rand(20, 60), // pressure through the field
    upgFirst: [['barracks', 2], ['factory', 2]], bias: { rifle: 1.2, heavy: 1.25, tank: 1.25, artillery: 0.8, titan: 0.9 }, opportunist: true, unitsFirst: true, paths: { barracks: 'B', factory: 'B', techlab: 'B' } });
  else if (kind === 'turtle') Object.assign(P, {
    plan: pickOne([['barracks', 'refinery', 'turret', 'refinery', 'reactor', 'habitat', 'factory', 'techlab'],
                   ['barracks', 'refinery', 'refinery', 'turret', 'reactor', 'habitat', 'factory', 'techlab']]),
    wave: rand(1.1, 1.3), fieldEdge: rand(1.3, 1.6), attackEdge: rand(1.2, 1.4), deadline: rand(660, 840),
    upgFirst: [['turret', 2], ['hq', 2]], bias: { tank: 1.2, titan: 1.3, artillery: 1.2, rifle: 0.8 }, paths: { barracks: 'A', factory: 'A', techlab: 'B' } }); // T3 defenses only in the normal order (an early fortress stalls games)
  else if (kind === 'economist') Object.assign(P, {
    plan: pickOne([['barracks', 'refinery', 'refinery', 'refinery', 'reactor', 'factory', 'habitat', 'techlab'],
                   ['refinery', 'barracks', 'refinery', 'refinery', 'reactor', 'habitat', 'factory', 'techlab']]),
    upShift: -rand(30, 60), fieldEdge: 0.75, wave: rand(1.0, 1.2), earlyFill: rand(0.5, 0.6),
    upgFirst: [['refinery', 2], ['techlab', 2], ['refinery', 3]], bias: { aircraft: 1.25, titan: 1.2, rifle: 0.75, heavy: 0.9 }, paths: { barracks: 'A', factory: 'A', techlab: 'A' } });
  else if (kind === 'boomer') Object.assign(P, { // v2.41: no random rolls of its own beyond the plan, so it never shifts another opening's dice
    plan: ['refinery', 'refinery', 'refinery', 'barracks', 'reactor', 'habitat', 'factory', 'techlab'],
    upShift: -75, fieldEdge: 0.75, wave: 1.1, earlyFill: 0.35, refDelta: 1,
    upgFirst: [['refinery', 2], ['refinery', 2], ['refinery', 2], ['habitat', 2], ['barracks', 2], ['factory', 2]], bias: { tank: 1.15, heavy: 1.1, rifle: 0.85 }, paths: { barracks: 'A', factory: 'A', techlab: 'A' } });
  else Object.assign(P, { // trickster
    plan: pickOne([AI_PLAN, ['barracks', 'refinery', 'barracks', 'refinery', 'reactor', 'habitat', 'factory', 'techlab']]),
    wave: rand(0.8, 1.3), feint: rand(0.25, 0.4), opportunist: true, bias: { aircraft: 1.15, sniper: 1.1 }, paths: { barracks: 'B', factory: 'B', techlab: 'A' } });
  return P;
}
// Commander abilities for the AI: the same rules as the player (cost, cooldown, unlock, vision; strikes only on explored
// ground, using what this side has seen). Each personality has its own priorities; difficulty sets how quickly and how well.
const AB_BVAL = { hq: 300, turret: 320, refinery: 220 };
// A fortified enemy, as this side knows it: Turrets seen, or an attack on its base that already failed
const aiFortified = (g, s) => !!g.sides[s].failV || Object.values(g.fog[s].ghosts).some(gh => gh.side !== s && gh.type === 'turret');
function aiAbility(g, s, P, ctx) {
  if (!FACTIONS[facOf(g.sides[s].faction)].abilities) return;
  const D = s === 1 ? g.diff : (DIFF[g.autoDiff] || DIFF.normal), lvl = D === DIFF.easy ? 0 : D === DIFF.hard ? 2 : 1;
  const side = g.sides[s], f = g.fog[s], log = side.aiLog, kind = P.kind;
  if (g.t < ABIL.shield.first || simRnd() > [0.2, 0.5, 1][lvl]) return; // slower to react on lower difficulties
  const seen = g.ents.filter(e => e.side !== s && e.hp > 0 && visibleTo(g, s, e));
  const use = (k, t) => {
    if (!t || !useAbility(g, s, k, t.u, t.v).ok) return false;
    if (log) { log.abil = log.abil || { shield: 0, strike: 0, repair: 0, strikeDef: 0 }; log.abil[k] = (log.abil[k] || 0) + 1; if (t.def) log.abil.strikeDef++; }
    return true;
  };
  const spare = k => abilityCheck(g, s, k).ok && side.res.c >= ABIL[k].cost.c + (ctx.threat ? 0 : 60);
  if (kind === 'economist' && !ctx.threat && g.t < 480 && side.res.c < 900) return; // the Economist keeps its money in the economy unless defending, flush, or later on
  // One shared cooldown: using any ability locks all three, so weigh the options. Each target's score is measured
  // against its own threshold (1 = just worth it), scaled by the lock it costs and by the personality's priorities.
  // Bloomhost (v2.20) uses the same logic through each ability's Last Fist counterpart (ABIL[k].like): Corrosive Bloom
  // targets like the Orbital Strike (units only), Frenzy Bloom like the Shield, Emergency Brood like the Repair Pulse.
  // Axiarchs (v2.28): Purification Beam like the Strike (a strip, no aircraft), Shield Overcharge like the Shield; Mass
  // Warp has its own rule (aiMassWarpTarget), weighed like the Repair Pulse
  const opts = [], like = k => ABIL[k].like || k;
  for (const k of abList(side)) {
    if (!spare(k)) continue;
    if (like(k) === 'strike') { if (lvl > 0) opts.push([k, aiStrikeTarget(g, s, kind, lvl, seen, ctx, k)]); }
    else if (like(k) === 'shield') opts.push([k, aiShieldTarget(g, s, kind, lvl, seen, ctx, k)]);
    else opts.push([k, k === 'brood' ? aiBroodTarget(g, s, kind, lvl, ctx) : k === 'mwarp' ? aiMassWarpTarget(g, s, ctx) : aiRepairTarget(g, s, kind, lvl, ctx)]);
  }
  // The Aggressor saves the cooldown for a Strike on known defences while it builds up to a push; only a fight it is losing gets a Shield
  const hold = kind === 'aggressor' && lvl > 0 && !ctx.threat && abList(side).includes('strike') && aiFortified(g, s) && abilUnlocked(g, s, ABIL.strike) && ctx.myV >= 300;
  let best = null, bv = 0;
  for (const [k, t] of opts) {
    if (!t) continue;
    if (lvl === 0) { best = [k, t]; break; } // Easy takes the first option that is worth it
    if (hold && k !== 'strike' && !(k === 'shield' && t.losing)) continue;
    let w = 1; const L = like(k);
    if (kind === 'aggressor') w = L === 'strike' ? (t.def ? 1.6 : 1) : L === 'repair' ? 0.6 : 1;
    else if (kind === 'turtle') w = L === 'repair' ? (ctx.threat ? 1.6 : 1) : L === 'strike' ? 0.8 : 1;
    else if (kind === 'economist') w = L === 'repair' ? 1.2 : 1;
    else if (kind === 'trickster') w = (L === 'shield' && (side.stance === 'attack' || side.feintUntil > g.t)) || (L === 'strike' && side.feintUntil > g.t) ? 1.3 : 1;
    const v = t.score * w * Math.sqrt(50 / ABIL[k].cd);
    if (v > bv) { bv = v; best = [k, t]; }
  }
  if (best) use(best[0], best[1]);
}
function aiStrikeTarget(g, s, kind, lvl, seen, ctx, k = 'strike') {
  const A = ABIL[k], f = g.fog[s], side = g.sides[s], front = g.front[s], home = hqU(s), spores = k === 'corrosive', beam = k === 'beam';
  const ground = seen.filter(e => e.kind === 'u' && !((spores || beam) && UDEF[e.type].air)); // v2.16: the Strike hits aircraft too; Corrosive Bloom (v2.20) and the Beam (v2.28) don't
  const known = spores ? [] : Object.values(f.ghosts).filter(gh => gh.side !== s && !(gh.type === 'hq' && f.lastHQ.shielded)); // the spores don't touch buildings
  const hit = (d, hp) => Math.min(1, (spores ? A.dps * A.dur * 0.6 : beam ? A.dmg : A.dmg - (A.dmg - A.edge) * Math.min(1, d / A.r)) / hp); // spores: they may walk out halfway; the Beam: the same damage all along its strip
  const inStrip = (p, u, v, half) => Math.abs(u - p.u) - half <= A.len / 2 && Math.abs(v - clamp(p.v, -LANE_V, LANE_V)) - half <= A.w ? 0 : Infinity; // the Beam's strip (v2.28)
  const pts = ground.map(e => ({ u: e.u, v: e.v })).concat(known.map(gh => ({ u: gh.u, v: gh.v, b: gh })));
  let best = null, bs = [Infinity, 340, 300][lvl]; // Normal waits for a fatter target; Hard reacts at once to a good one
  for (const p of pts) {
    if (!f.exp[cellOf(p.u)]) continue;
    let sc = 0, def = false;
    for (const e of ground) {
      const d = beam ? inStrip(p, e.u, e.v, 0) : Math.hypot(e.u - p.u, e.v - p.v);
      if (d > A.r) continue;
      const ud = UDEF[e.type], slow = clamp(1.6 - ud.speed / 40, 0.4, 1.2) * (lvl === 2 && !e.moving ? 1.35 : 1); // slow or (Hard sees it) standing units can't walk out in time
      let w = 1;
      if (kind === 'aggressor' && Math.abs(e.u - hqU(1 - s)) < 560) { // defenders dug in under their HQ: hit them just before the push
        const close = front !== null && Math.abs(front - e.u) < 450 && ctx.myV >= 300;
        w = close ? 2.2 : 0.7; if (close) def = true;
      }
      if (kind === 'turtle') w = (ud.splash || e.type === 'titan') && Math.abs(e.u - home) < 750 ? 2 : Math.abs(e.u - home) < 600 ? 1.2 : 0.6;
      if (kind === 'trickster' && side.feintUntil > g.t) w *= 1.5; // the chasers walked into the trap
      sc += (ud.cost.c + ud.cost.e * 1.5) * hit(d, e.hp) * slow * w;
    }
    for (const gh of known) {
      const d = beam ? inStrip(p, gh.u, gh.v, gh.half) : Math.max(0, Math.hypot(gh.u - p.u, gh.v - p.v) - gh.half);
      if (d > A.r) continue;
      const live = g.ents.find(e => e.id === gh.id && e.hp > 0 && visibleTo(g, s, e)), bd = BD(gh.fac, gh.type);
      let w = AB_BVAL[gh.type] || 150;
      if (kind === 'aggressor' && (gh.type === 'turret' || gh.type === 'hq')) { // crack the defence just ahead of the army
        const close = front !== null && Math.abs(front - gh.u) < 450 && ctx.myV >= 300;
        w *= close ? 3 : 0.5; if (close) def = true;
      }
      if (kind === 'economist' && gh.type === 'refinery') w *= 2.5;
      if (kind === 'turtle') w *= 0.4;
      sc += w * hit(d, live ? live.hp : bd.hp * hpMul(bd, gh.tier || 1));
    }
    if (sc > bs) { bs = sc; best = { u: clamp(p.u, 0, L), v: beam ? clamp(p.v, -LANE_V, LANE_V) : clamp(p.v, -200, 200), def, score: sc / [Infinity, 340, 300][lvl] }; }
  }
  return best;
}
function aiShieldTarget(g, s, kind, lvl, seen, ctx, k = 'shield') {
  const A = ABIL[k], side = g.sides[s], home = hqU(s), buffed = o => k === 'frenzy' ? o.frzT > g.t : k === 'overcharge' ? o.ovT > g.t : o.shT > g.t;
  const attacking = side.stance === 'attack' && !(side.feintUntil > g.t), sh7 = aiFix(side.persona, 'shield') && k !== 'frenzy';
  if ((kind === 'economist' || kind === 'turtle') && !ctx.threat) return null; // defensive personalities shield at home
  if (kind === 'trickster' && !attacking && !ctx.threat) return null;
  const need = [520, 460, 400][lvl] * (kind === 'aggressor' && attacking ? 0.8 : 1);
  let best = null, bs = need;
  for (const m of ctx.mine) {
    if (buffed(m)) continue;
    let foe = 0;
    for (const e of seen) if (Math.abs(e.u - m.u) < 230) {
      if (sh7) { const gun = e.kind === 'u' ? UDEF[e.type] : bdOf(e).gun && bdOf(e).gun[e.tier]; if (!gun || !gun.dmg || Math.hypot(e.u - m.u, e.v - m.v) > gun.range + 40) continue; } // v2.41 (shield): only enemies with this unit in reach
      foe += e.kind === 'u' ? UDEF[e.type].cost.c : (bdOf(e).gun ? 300 : 0);
    }
    if (foe < 200) continue; // not in a fight
    if (sh7 && ctx.mine.filter(o => o.lastHurt > g.t - 1.5 && Math.hypot(o.u - m.u, o.v - m.v) <= A.r).length < 2) continue; // v2.41 (shield): two or more of its units there already taking fire
    let near = 0; for (const o of ctx.mine) if (Math.abs(o.u - m.u) < 230) near += UDEF[o.type].cost.c;
    if (lvl === 2 && near > foe * 1.6) continue; // Hard: a fight already won needs no shield
    if (kind === 'turtle' && Math.abs(m.u - home) > 650) continue;
    let mineV = 0;
    for (const o of ctx.mine) if (!buffed(o) && Math.hypot(o.u - m.u, o.v - m.v) <= A.r) mineV += UDEF[o.type].cost.c + UDEF[o.type].cost.e * 1.5;
    if (mineV > bs) { bs = mineV; best = { u: m.u, v: m.v, score: mineV / need, losing: near < foe }; }
  }
  return best;
}
function aiRepairTarget(g, s, kind, lvl, ctx) {
  const A = ABIL.repair, side = g.sides[s];
  if (kind === 'aggressor' && side.stance === 'attack' && !side.fails) return null; // it repairs after a failed push, not during one
  const own = g.ents.filter(e => e.side === s && e.hp > 0 && e.hp < e.maxHp && !(e.kind === 'b' && (!e.built || e.repair > 0 || g.t >= EXT.start))); // v2.11: buildings don't heal in the storm
  const need = [900, 850, 750][lvl];
  let best = null, bs = need;
  for (const c of own) {
    let miss = 0;
    for (const e of own) {
      if (!inAbil(e, c.u, c.v, A.r)) continue;
      let w = 1;
      if (e.kind === 'b') w = kind === 'turtle' && (e.type === 'turret' || e.type === 'hq') ? 1.5 : kind === 'economist' && e.type === 'refinery' ? 2 : kind === 'aggressor' ? 0.3 : 0.8;
      miss += Math.min(e.maxHp - e.hp, e.maxHp * A.rate * A.dur) * w;
    }
    if (miss > bs) { bs = miss; best = { u: c.u, v: c.v, score: miss / need }; }
  }
  return best;
}

// Emergency Brood: the Repair Pulse's moment (its army or base has taken real damage), dropped there or just behind it
function aiBroodTarget(g, s, kind, lvl, ctx) {
  const t = aiRepairTarget(g, s, kind, lvl, ctx); if (!t) return null;
  for (let i = 0; i < 4; i++) { const u = clamp(t.u - dirOf(s) * 60 * i, 0, L), v = clamp(t.v, -LANE_V, LANE_V); if (abilityCheck(g, s, 'brood', u, v).ok) return { u, v, score: t.score }; }
  return null;
}
// Mass Warp (v2.28, minimal): 4 or more of its units below 40% health within the circle of one of them, far enough from
// the warp point for the trip to matter; the biggest such group
function aiMassWarpTarget(g, s, ctx) {
  const ax = aiFix(g.sides[s].persona, 'axf'), A = ABIL.mwarp, wp = warpPoint(g, s), hurt = ctx.mine.filter(m => m.hp < m.maxHp * (ax ? 0.5 : A.aiHurt)); // v2.40 (axf): 3 units below 50%
  let best = null, bn = (ax ? 3 : A.aiN) - 1;
  for (const c of hurt) {
    if (Math.hypot(c.u - wp.u, c.v - wp.v) < A.aiFar) continue;
    const n = hurt.filter(m => inAbil(m, c.u, c.v, A.r)).length;
    if (n > bn) { bn = n; best = { u: c.u, v: c.v, score: n / A.aiN }; }
  }
  return best;
}
const AI_UPG = [['barracks', 2], ['reactor', 2], ['refinery', 2], ['factory', 2], ['habitat', 2], ['sigA', 2], ['sigB', 2], ['reactor', 3], ['hq', 2], ['techlab', 2],
  ['factory', 3], ['barracks', 3], ['turret', 2], ['habitat', 3], ['refinery', 3], ['techlab', 3], ['sigA', 3], ['sigB', 3], ['hq', 3], ['turret', 3]]; // sig: v2.32
// Field nodes: neutral income points along the lane. Ground troops inside the zone capture them.
const NODE_U = [600, L / 2, L - 600], NODE_R = MAP.nodes[0].r, // v2.59: NODE_U starts at the v2.42 spots (setMech7c(false)); setMech7c(true) puts the map's nodes there
   NODE_INC = { c: 3, e: 1 }, REGEN_DELAY = 8;
setBalance7b(true); // v2.42 (audit phase 7b): the strategy balance layer, once NODE_INC exists
setBalance7c(true); // v2.43 (audit phase 7c): the retune layer on top
