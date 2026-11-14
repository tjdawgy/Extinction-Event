'use strict';
const GAME_NAME = 'Extinction Event', VERSION = '2.82'; // bump VERSION with every change
/* =====================================================================
   SIM — rules, economy, combat and AI. Positions live on a flat plane:
   u runs left to right along the battle lane, v is depth (back → front).
   Bases are a Colony-style diamond of pads; the HQ sits on the back pad.
   ===================================================================== */
let L, HQ_U, POP_MAX, LANE_V, DV_W; // v2.59: from the map (sim/maps.js); v2.65: recomputed when the map changes
const mapCore = () => { L = MAP.size.w; HQ_U = MAP.bases[0].hq[0]; POP_MAX = MAP.armyCap; LANE_V = MAP.lanes[0].width / 2; DV_W = MAP.depthW ?? 0.4; };
mapCore(); MAP_HOOKS.push(mapCore);
const TILE = 70, SLOT_COUNT = 8, US = 1.3, BS = 0.75;
const IX = 0.866, IY = 0.5, DY = 0.5;
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
/* ---------- Random numbers (v2.50, Phase 0 item 3: a deterministic SIM) ----------
   Game logic draws from simRnd: mulberry32, seeded per match (g.seed), its state on the game (g.rs, saved and restored),
   so the same seed and the same inputs play the same match tick for tick. Visual-only randomness in the SIM (particles,
   explosion debris, the idle-animation phase of units and buildings) draws from fxRnd, a second stream seeded from the same
   match seed (g.fs): it never feeds a rule, so effects can change without changing a match. RNG.g is the game the streams
   belong to (set by newGame, update, deserialize and the entry points that can roll from the UI). RNG.legacy true sends
   both back to Math.random in v2.49's call order: the pinned replays in tests/determinism.test.js run that way. */
const RNG = { legacy: false, g: null };
const m32 = st => { let t = Math.imul(st ^ st >>> 15, 1 | st); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
function simRnd() { const g = RNG.g; if (RNG.legacy || !g || g.rs === undefined) return Math.random(); g.rs = g.rs + 0x6D2B79F5 | 0; return m32(g.rs); }
function fxRnd() { const g = RNG.g; if (RNG.legacy || !g || g.fs === undefined) return Math.random(); g.fs = g.fs + 0x6D2B79F5 | 0; return m32(g.fs); }
const rand = (a, b) => a + simRnd() * (b - a);
const fxRand = (a, b) => a + fxRnd() * (b - a);
function seedGame(g, seed) { // a new match's two streams (none in legacy mode, so the pinned replays hash as before)
  RNG.g = g;
  if (RNG.legacy) return;
  g.seed = (seed === undefined || seed === null ? Math.floor(Math.random() * 4294967296) : seed) >>> 0;
  g.rs = g.seed | 0; g.fs = (g.seed ^ 0x9E3779B9) | 0;
}
const TICK = 1 / 60; // the SIM's fixed step: the game calls update(g, TICK); 1-3x speed runs more ticks per frame, never longer ones
// Side-scrolling view: u is screen x, depth v is foreshortened, z is height
const P = (u, v, z = 0) => ({ x: u, y: v * DY - z });

// Difficulty is decision quality only: every side has the same resources, income and rules.
//  delay: seconds between decisions   smart: chance of picking the best unit (else a weighted guess)
//  wave: army size it waits for before a big attack   maxTier / upStart: highest upgrade it uses, and from when
//  calmSave: while threatened, saves for counters (Tanks against infantry) instead of trickling cheap units
//  calmTech: while threatened, holds upgrades and new tech and gets a War Factory first
//  eco: turns spare energy into credits (more Refineries)
//  turret: chance (per match) that it recognises an infantry rush in time and answers with a Turret
//  nodes: fights for its near field node with its whole army
//  refineries: Refineries in its build plan   trainPer: units it queues per decision
//  fieldEdge: how much stronger than the enemy army it knows of it must be to push out for the field nodes
//  armyCap: share of its army size limit it actually fills (an under-filled cap grows back to full from 12 to 20 minutes)
const DIFF = {
  easy:   { delay: 2.5, wave: 0.8, label: 'Easy',   maxTier: 2, upStart: 40, smart: 0.2,  calmSave: false, calmTech: false, eco: false, turret: 0, nodes: false, refineries: 1, trainPer: 1, fieldEdge: 1.5, fieldMin: 600, armyCap: 0.6 },
  normal: { delay: 1.0, wave: 1.0, label: 'Normal', maxTier: 3, upStart: 90, smart: 0.65, calmSave: true,  calmTech: false, eco: true,  turret: 0.5,  nodes: false, refineries: 2, trainPer: 2, fieldEdge: 0.9, fieldMin: 300, armyCap: 1 },
  hard:   { delay: 1.0, wave: 1.0, label: 'Hard',   maxTier: 3, upStart: 90, smart: 0.65, calmSave: true,  calmTech: true,  eco: true,  turret: 1,  nodes: true,  refineries: 2, trainPer: 2, fieldEdge: 0.9, fieldMin: 300, armyCap: 1 },
};
/* v2.61 (Phase 1, the difficulty ladder): how hard each difficulty plays, on purpose (the v2.60 bug fixes now apply to all).
   A preset with the 'ladder' rule (default, hard) reads these on top of DIFF through aiDiff; the presets the pinned replays
   use (legacy, v239, default260, hard259...) don't, so they still play their recorded DIFF. press: the edges for the press
   rule (ATTACK.press, none = off; power: never into a known stronger army); raid: ATTACK.raid's settings (true = as they are, false = no raids); fix and dials: added
   to the persona when it is rolled for that difficulty (rollPersona). */
const LADDER = {
  easy: { delay: 2.0, armyCap: 0.7, refineries: 2, smart: 0.35, press: { edge: 1.6, edgeLate: 0.8, late0: 780, field: 1.3, from: 360, power: true }, raid: false }, // v2.64: gentler (v2.61: delay 1.3, armyCap 0.9, edge 1.4 → 0.9, field 1.15)
  normal: { nodes: true, dials: { delay: 0.8 }, press: { edge: 1.2, edgeLate: 0.55, late0: 720, field: 0.9, from: 270 }, raid: { every: 110, n: 3 }, fix: { breakout: true, shield: true, power: true, fill: true, counter: true, nowave: true } },
  hard: { press: {}, raid: true },
};
const LADDER_D = {};
for (const k in DIFF) LADDER_D[k] = Object.assign(Object.create(DIFF[k]), LADDER[k] || {});
function aiDiff(g, s) { // the difficulty a side's AI plays: its DIFF entry, with the ladder's settings when its preset uses them
  const base = s === 1 ? g.diff : (DIFF[g.autoDiff] || DIFF.normal);
  return aiFix(g.sides[s].persona, 'ladder') ? LADDER_D[base.label.toLowerCase()] : base;
}

// Seconds of "GET READY" at match start. The world is frozen and the clock (g.t) starts at GO.
const COUNTDOWN = 3;

// Factions (v2.16): each side plays one. Both use the same building roles (hq, refinery, reactor, habitat, barracks,
// turret, factory, techlab); a faction has its own names, stats, art and units for them (BDEFS, UDEF.fac).
// abilities: has commander abilities; trees: its production buildings pick upgrade paths (TREES).
// overview, mech: the Codex's faction overview and signature mechanic (v2.44); every unit and building has a desc for it too.
const FACTIONS = {
  lastfist: { name: 'Last Fist', abilities: true, trees: true, abil: ['shield', 'strike', 'repair'],
    overview: 'The last organized human army: combined arms of infantry, armor and aircraft. Straightforward and adaptable, and the easiest faction to learn.',
    mech: { name: 'Salvage', txt: 'When any unit is destroyed near your forces, you recover part of its credit cost. Fight close to your army to keep the money flowing.' } },
  bloomhost: { name: 'Bloomhost', abilities: true, trees: true, abil: ['frenzy', 'brood', 'corrosive'],
    overview: 'A living swarm: cheap, fast organisms that overwhelm with numbers, with a base that grows like a body.',
    mech: { name: 'Creep', txt: 'Your Hive, your other buildings and the field nodes you hold spread creep. On their own creep, Bloomhost ground units move faster and heal when out of combat.' } }, // trees: Larva Pit and Evolution Chamber (v2.19), Bloomspire (v2.21); abilities v2.20
  // Axiarchs (v2.25 framework, docs/AXIARCHS.md): trees on the Genesis Gate and Architectum
  // (v2.27), the Celestial Array v2.29; commander abilities v2.28
  axiarchs: { name: 'Axiarchs', abilities: true, trees: true, abil: ['mwarp', 'overcharge', 'beam'],
    overview: 'An ancient order of elite warriors: fewer, costlier units, each one shielded and powerful.',
    mech: { name: 'Shields and the power field', txt: 'Every Axiarch unit and building has shields that take damage first and recharge after a few quiet seconds. Inside the power field around the Axis and the nodes you hold, shields recharge much faster and new units warp in.' } },
}, DEFAULT_FACTION = 'lastfist', FACTION_KEYS = Object.keys(FACTIONS);
const factionName = k => (FACTIONS[k] || FACTIONS[DEFAULT_FACTION]).name;
// One line per faction for the setup menu (v2.30). Salvage's numbers come from SALVAGE, defined further down (read at call time).
const factionDesc = k => k === 'random' ? 'A random faction, revealed when the match starts.' : {
  lastfist: () => SALVAGE.pct > 0 ? `Last Fist: combined arms. Salvage: any unit destroyed near your forces returns ${Math.round(SALVAGE.pct * 100)}% of its credit cost.` : 'Last Fist: adaptable combined arms, the easiest to learn.',
  bloomhost: () => 'Bloomhost: swarms that spread creep; on creep they move faster and heal.',
  axiarchs: () => 'Axiarchs: costly elite units with shields that recharge in their power field.',
}[facOf(k)]();
const facOf = k => FACTIONS[k] ? k : DEFAULT_FACTION;

const HPMUL = [1, 1, 1.25, 1.5];
const BDEF = {
  hq: { name: 'Command HQ', desc: 'Your command centre: a defence gun, army size and income. Shielded while a production building stands in your base; lose it and you lose the match.', cost: { c: 0, e: 0 }, hp: 2800, half: 44, h: 104, time: 1,
    pop: [0, 12, 12, 12], inc: [null, { c: 3, e: 1 }, { c: 3, e: 1 }, { c: 3, e: 1 }], hpMul: [1, 1, 1.3, 1.6],
    gun: [null, { weapon: 'hqgun', dmg: 32, cd: 1.1, range: 390, hitsAir: true },
                { weapon: 'hqgun', dmg: 42, cd: 1.0, range: 430, hitsAir: true },
                { weapon: 'hqgun', dmg: 55, cd: 0.9, range: 470, hitsAir: true }],
    up: [null, null, { c: 300, e: 100, time: 20 }, { c: 500, e: 250, time: 28 }] },
  refinery: { name: 'Refinery', desc: 'Produces credits, your main resource. Build more early to grow your economy, but they are soft targets.', cost: { c: 150, e: 0 }, hp: 520, half: 32, h: 62, time: 10,
    inc: [null, { c: 4, e: 0 }, { c: 6, e: 0 }, { c: 9, e: 0 }],
    up: [null, null, { c: 120, e: 20, time: 12 }, { c: 200, e: 60, time: 18 }] },
  reactor: { name: 'Reactor', desc: 'Produces energy, needed for advanced units and upgrades.', cost: { c: 125, e: 0 }, hp: 460, half: 30, h: 60, time: 12,
    inc: [null, { c: 0, e: 2 }, { c: 0, e: 3 }, { c: 0, e: 4.5 }],
    up: [null, null, { c: 100, e: 30, time: 12 }, { c: 180, e: 80, time: 18 }] },
  habitat: { name: 'Habitat', desc: 'Raises your army size limit. Upgrade it to field a bigger army.', cost: { c: 100, e: 0 }, hp: 420, half: 32, h: 40, time: 8,
    pop: [0, 10, 16, 22],
    up: [null, null, { c: 100, e: 20, time: 10 }, { c: 160, e: 50, time: 14 }] },
  barracks: { name: 'Barracks', desc: 'Trains infantry. At T2 it picks one of two paths that decide which advanced infantry it unlocks.', cost: { c: 150, e: 0 }, hp: 640, half: 32, h: 56, time: 14,
    up: [null, null, { c: 150, e: 50, time: 14 }, { c: 250, e: 120, time: 20 }],
    tiers: [null, 'Trains Riflemen', 'Unlocks Heavy troopers', 'Unlocks Snipers'] },
  factory: { name: 'War Factory', desc: 'Builds armored vehicles and walkers. Its path chooses siege weapons or assault vehicles.', cost: { c: 300, e: 50 }, hp: 820, half: 36, h: 50, time: 20, req: 'barracks',
    up: [null, null, { c: 200, e: 100, time: 18 }, { c: 350, e: 200, time: 24 }],
    tiers: [null, 'Builds Tanks', 'Unlocks Artillery', 'Unlocks Titans'] },
  techlab: { name: 'Tech Lab', desc: 'Builds aircraft. Its path chooses more air power or support units and a damage upgrade for your whole army.', cost: { c: 350, e: 150 }, hp: 700, half: 30, h: 96, time: 26, req: 'barracks', // v2.16: a Barracks is enough
    up: [null, null, { c: 250, e: 150, time: 20 }, { c: 400, e: 300, time: 28 }],
    tiers: [null, 'Builds Gunships', 'Unlocks Interceptors', null] }, // T3: Nanoweave's text is live (v2.45)
  turret: { name: 'Turret', desc: 'Static defence gun that shoots ground and air. Solid protection for your base, but it can\'t move.', cost: { c: 200, e: 50 }, hp: 900, half: 26, h: 46, time: 12,
    gun: [null, { weapon: 'gatling', dmg: 12, cd: 0.45, range: 250, hitsAir: true },
                { weapon: 'gatling', dmg: 17, cd: 0.4, range: 280, hitsAir: true },
                { weapon: 'gatling', dmg: 22, cd: 0.35, range: 310, hitsAir: true }],
    up: [null, null, { c: 150, e: 60, time: 12 }, { c: 250, e: 120, time: 16 }] },
};
// Signature buildings (v2.32, docs/SIGNATURE_BUILDINGS.md): two roles, sigA and sigB, at most one of each per side at a time.
// Cost, build time, HP and upgrade costs are the faction's light production building's (Last Fist: the Barracks); no tree,
// no supply. Last Fist: the Salvage Yard (A) raises Salvage (YARD), the Fortification Depot (B) puts a bunker on every field
// node it holds (BUNKER). A faction without these roles yet (Bloomhost until v2.33, Axiarchs until v2.34) can't build them.
const sigDef = (base, x) => Object.assign({ cost: base.cost, hp: base.hp, half: base.half, time: base.time, up: base.up, sig: true }, base.shp ? { shp: base.shp } : {}, x); // shp: an Axiarch building's shields (v2.34)
BDEF.sigA = sigDef(BDEF.barracks, { name: 'Salvage Yard', desc: 'Signature building that strengthens Salvage: more credits back from kills, and once upgraded energy too and an Overdrive production boost.', h: 46 });
BDEF.sigB = sigDef(BDEF.barracks, { name: 'Fortification Depot', desc: 'Signature building that puts a free bunker on every field node you hold. Upgrades let the bunkers heal infantry and hit aircraft.', h: 48 });
// The node bunker: the Turret's code at half a T1 Turret's HP and damage, ground only until the Depot's T3. Never built by
// hand: the Depot places one on each held node (no pad, no supply, no cost) and its tier follows the Depot's.
BDEF.bunker = { name: 'Node Bunker', desc: 'A small gun bunker the Fortification Depot places on each node you hold. Free and rebuilt on its own, but weaker than a Turret.', cost: { c: 0, e: 0 }, hp: BDEF.turret.hp / 2, half: 14, h: 26, time: 1, noPad: true, up: [null, null, null, null],
  gun: [null, { weapon: 'gatling', dmg: BDEF.turret.gun[1].dmg / 2, cd: BDEF.turret.gun[1].cd, range: BDEF.turret.gun[1].range, hitsAir: false },
              { weapon: 'gatling', dmg: BDEF.turret.gun[1].dmg / 2, cd: BDEF.turret.gun[1].cd, range: BDEF.turret.gun[1].range, hitsAir: false },
              { weapon: 'gatling', dmg: BDEF.turret.gun[1].dmg, cd: BDEF.turret.gun[1].cd, range: BDEF.turret.gun[1].range, hitsAir: true }] };
// Bloomhost (v2.17): the same roles; first-pass numbers mirror Last Fist (docs/BLOOMHOST.md has the table). The Hive keeps
// the HQ's stats and gun, so nothing about the enemy's faction leaks into the AI's estimate of a base it hasn't seen.
const BDEF_BH = (() => {
  const o = {}, re = (k, x) => { o[k] = Object.assign({}, BDEF[k], x); };
  re('hq', { name: 'Hive', desc: 'The swarm\'s heart: a spine launcher, army size, income and the source of creep. Shielded while a production building stands in the base; lose it and you lose.' });
  re('refinery', { name: 'Goremound', desc: 'Produces credits, your main resource. Grow more early, and protect them.' });
  re('reactor', { name: 'Pulse Organ', desc: 'Produces energy for advanced organisms and upgrades.' });
  re('habitat', { name: 'Hatchery', desc: 'Raises your army size limit: upgrade it to grow a larger swarm.' });
  re('barracks', { name: 'Larva Pit', desc: 'Spawns the swarm\'s infantry. At T2 it evolves along a Predatory (melee hunters) or Acidic (ranged acid) path.', tiers: [null, 'Spawns Skitterlings', 'Predatory or Acidic Evolution', 'Predatory or Acidic Evolution'] });
  re('factory', { name: 'Evolution Chamber', desc: 'Grows heavy ground beasts. Its evolution chooses siege beasts or armored brawlers.', req: 'barracks', tiers: [null, 'Grows Bulwarks', 'Siege or Predator Evolution', 'Siege or Predator Evolution'] });
  re('techlab', { name: 'Bloomspire', desc: 'Grows flyers. Its bloom chooses cheap swarm flyers or huge building-breaking beasts.', req: 'barracks', tiers: [null, 'Grows Razorwings', 'Swarm or Apex Bloom', 'Swarm or Apex Bloom'] }); // trees: v2.21
  // The Maw: a living defence. Turret damage per second, a little more HP, a shorter reach; it spits spines at ground and air
  re('turret', { name: 'Maw', desc: 'A living defence that spits spines at ground and air. Tougher than a Turret, with a shorter reach.', hp: 1000,
    gun: [null, { weapon: 'spine', dmg: 16, cd: 0.6, range: 220, hitsAir: true },
                { weapon: 'spine', dmg: 22, cd: 0.55, range: 245, hitsAir: true },
                { weapon: 'spine', dmg: 29, cd: 0.5, range: 270, hitsAir: true }] });
  // drawn heights: living structures are lower than Last Fist's towers (health bars, aim points and smoke follow h)
  for (const [k, h] of Object.entries({ hq: 56, refinery: 30, reactor: 24, habitat: 6, barracks: 12, factory: 16, turret: 18, techlab: 52 })) o[k].h = h;
  return o;
})();
// Bloomhost signature buildings (v2.33): the Brood Mound (A) spawns Mites (MOUND), the Rootheart (B) strengthens creep (ROOT).
// Larva Pit cost, build time, HP and upgrade costs (the Larva Pit copies the Barracks); drawn heights fit their low art.
BDEF_BH.sigA = sigDef(BDEF_BH.barracks, { name: 'Brood Mound', desc: 'Signature building that spawns free, short-lived Mites. Upgrades spawn more, and at T3 a killed Mite bursts into acid.', h: 22 });
BDEF_BH.sigB = sigDef(BDEF_BH.barracks, { name: 'Rootheart', desc: 'Signature building that makes creep spread faster and farther and slows enemies on it. Upgrades add faster healing and snaring roots.', h: 30 });
// Axiarchs (v2.25): the same roles and costs; every building trades a fifth of its HP for shields worth 30% of the Last Fist
// HP (docs/AXIARCHS.md has the table). The Null Lance is the defence: one beam at T1, Split Lattice (up to 3 beams at
// lower damage) at T2, Event Horizon (longer range, heavy hits, more building damage, slower) at T3.
const BDEF_AX = (() => {
  const o = {}, re = (k, x) => { o[k] = Object.assign({}, BDEF[k], x); o[k].shp = Math.round(BDEF[k].hp * 0.3); o[k].hp = Math.round((x.hp || BDEF[k].hp) * 0.8); };
  re('hq', { name: 'Axis', desc: 'The Axiarch core: a beam lance, army size, income and the base power field. Shielded while a production building stands in the base; lose it and you lose.', gun: BDEF.hq.gun.map(x => x && Object.assign({}, x, { weapon: 'hqbeam', beam: true })) }); // v2.36: the Axis lance is a beam (same damage, rate and range; lands at once)
  re('refinery', { name: 'Matter Loom', desc: 'Produces credits, your main resource. Like every Axiarch building, it has shields over its hull.' });
  re('reactor', { name: 'Singularity Well', desc: 'Produces energy. Axiarch units are energy-hungry, so plan for several.' });
  re('habitat', { name: 'Continuum Spire', desc: 'Raises your army size limit and enlarges the power field around the Axis.' });
  re('barracks', { name: 'Genesis Gate', desc: 'Forms infantry. At T2 it takes the Riftwalk (phase-stepping melee) or Lattice (long-range energy) doctrine.', tiers: [null, 'Forms Shardlings', 'Riftwalk or Lattice Doctrine', 'Riftwalk or Lattice Doctrine'] });
  re('factory', { name: 'Architectum', desc: 'Forms heavy walkers. Its doctrine chooses long-range siege or battlefield-control walkers.', req: 'barracks', tiers: [null, 'Forms Bastions', 'Rupture or Dominion Doctrine', 'Rupture or Dominion Doctrine'] });
  re('techlab', { name: 'Celestial Array', desc: 'Forms flyers. Its calculus chooses cheap linked swarm flyers or great flying warships.', req: 'barracks', tiers: [null, 'Forms Wraithwings', 'Swarm or Ascendant Calculus', 'Swarm or Ascendant Calculus'] }); // v2.29: paths
  re('turret', { name: 'Null Lance', desc: 'Beam defence that hits ground and air. Upgrades split the beam over several targets, then turn it into heavy long-range shots.',
    gun: [null, { weapon: 'lance', dmg: 30, cd: 1.0, range: 260, hitsAir: true, beam: true },
                { weapon: 'lance', dmg: 20, cd: 0.85, range: 280, hitsAir: true, beam: true, split: 3 },
                { weapon: 'horizon', dmg: 92, cd: 1.6, range: 330, hitsAir: true, beam: true }] });
  // drawn heights (health bars, aim points): stone monoliths, lower than Last Fist's towers
  for (const [k, h] of Object.entries({ hq: 70, refinery: 40, reactor: 46, habitat: 30, barracks: 44, factory: 40, turret: 40, techlab: 70 })) o[k].h = h;
  return o;
})();
// Axiarch signature buildings (v2.34): the Phase Beacon (A) and the Echo Reliquary (B); Genesis Gate cost, time, HP, shields
// and upgrade costs; drawn heights fit their art
BDEF_AX.sigA = sigDef(BDEF_AX.barracks, { name: 'Phase Beacon', desc: 'Signature building that carries a power-field bubble with your frontmost unit, so you can warp in at the front. It collapses after heavy losses.', h: 50 });
BDEF_AX.sigB = sigDef(BDEF_AX.barracks, { name: 'Echo Reliquary', desc: 'Signature building that keeps echoes of your fallen advanced units, so you can warp them back at a discount.', h: 46 });
const BDEFS = { lastfist: BDEF, bloomhost: BDEF_BH, axiarchs: BDEF_AX };
const BD = (fac, type) => (BDEFS[fac] || BDEF)[type];     // a faction's definition of a building role
const bdOf = e => BD(e.fac, e.type);                        // a building's own definition
const bdS = (g, s, type) => BD(g.sides[s].faction, type);   // side s's definition of a role
const treeOf = (fac, type) => FACTIONS[facOf(fac)].trees ? (TREE_SETS[facOf(fac)] || TREES)[type] || null : null; // the upgrade tree a faction's building of this role has (none: locked at T1)
const hpMul = (d, t) => (d.hpMul || HPMUL)[t];
