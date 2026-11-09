/* ---------- Upgrade trees (v2.13) ----------
   A production building with a tree picks a path when it upgrades to T2 (per building: a second Barracks can take
   the other path; selling resets it). T3 is the second step of that path. Data only: a step unlocks units or turns
   on a named modifier; a later faction is mostly a different TREES table. (The Tech Lab follows.) */
const TREES = {
  barracks: { A: { name: 'Specialists', short: 'SPEC', steps: [null, null, { unlock: ['heavy'], short: 'Heavy troopers', txt: 'Unlocks Heavy troopers' }, { unlock: ['sniper'], short: 'Snipers', txt: 'Unlocks Snipers: rounds that pierce a line' }] },
              B: { name: 'Mass Deployment', short: 'MASS', steps: [null, null, { mod: 'pairs', short: 'Riflemen in pairs' }, { mod: 'drill', short: 'Drilled Riflemen' }] } },
  factory:  { A: { name: 'Siege', short: 'SIEGE', steps: [null, null, { unlock: ['artillery'], short: 'Artillery' }, { unlock: ['titan'], short: 'Titans', txt: 'Unlocks Titans: walkers that plant for siege range' }] },
              B: { name: 'Assault', short: 'ASSAULT', steps: [null, null, { unlock: ['flame'], short: 'Flame Tanks', txt: 'Unlocks Flame Tanks: burn groups of infantry at close range' }, { unlock: ['hydra'], short: 'Hydras', txt: 'Unlocks Hydras: walkers with rotary guns that prefer aircraft' }] } },
  techlab:  { A: { name: 'Air Power', short: 'AIR', steps: [null, null, { unlock: ['interceptor'], short: 'Interceptors', txt: 'Unlocks Interceptors: hunt aircraft, escort your own' }, { unlock: ['leviathan'], short: 'Leviathans', txt: 'Unlocks Leviathans: carpet bombers that wreck bases' }] },
              B: { name: 'Support', short: 'SUPPORT', steps: [null, null, { unlock: ['medic', 'drone'], short: 'Medicopters, Recon Drones' }, { mod: 'nanoweave', short: 'Nanoweave' }] } },
};
// Bloomhost trees: the Larva Pit and the Evolution Chamber (v2.19), the Bloomspire (v2.21)
const TREES_BH = {
  barracks: { A: { name: 'Predatory Evolution', short: 'HUNT', steps: [null, null, { unlock: ['leaper'], short: 'Leapers', txt: 'Unlocks Leapers: hunters that leap onto ranged units' }, { unlock: ['ravager'], short: 'Ravagers', txt: 'Unlocks Ravagers: heavy hunters that frenzy on a kill' }] },
              B: { name: 'Acidic Evolution', short: 'ACID', steps: [null, null, { unlock: ['spitter'], short: 'Spitters', txt: 'Unlocks Spitters: acid that hits air and ground and corrodes armor' }, { unlock: ['bilecaster'], short: 'Bilecasters', txt: 'Unlocks Bilecasters: long-range bile darts with lasting corrosion' }] } },
  factory:  { A: { name: 'Siege Evolution', short: 'SIEGE', steps: [null, null, { unlock: ['bilelobber'], short: 'Bile Lobbers', txt: 'Unlocks Bile Lobbers: long-range bile that corrodes an area' }, { unlock: ['ruinmaw'], short: 'Ruinmaws', txt: 'Unlocks Ruinmaws: base-breakers that leave acid pools' }] },
              B: { name: 'Predator Evolution', short: 'BRUTE', steps: [null, null, { unlock: ['thornback'], short: 'Thornbacks', txt: 'Unlocks Thornbacks: armored brawlers that hurt melee attackers' }, { unlock: ['dreadthorn'], short: 'Dreadthorns', txt: 'Unlocks Dreadthorns: a spine burst when hit hard' }] } },
  techlab:  { A: { name: 'Swarm Bloom', short: 'SWARM', steps: [null, null, { unlock: ['needlewing'], short: 'Needlewings', txt: 'Unlocks Needlewings: cheap flyers that hit harder in a pack' }, { unlock: ['cloudwing'], short: 'Cloudwings', txt: 'Unlocks Cloudwings: swarm flyers that release short-lived offspring' }] },
              B: { name: 'Apex Bloom', short: 'APEX', steps: [null, null, { unlock: ['broodtyrant'], short: 'Brood Tyrants', txt: 'Unlocks Brood Tyrants: heavy flyers that prefer buildings' }, { unlock: ['worldrender'], short: 'Worldrenders', txt: 'Unlocks Worldrenders: aerial base-breakers that feed on buildings' }] } },
};
// Axiarch trees: the Genesis Gate and the Architectum (v2.27), the Celestial Array (v2.29)
const TREES_AX = {
  barracks: { A: { name: 'Riftwalk Doctrine', short: 'RIFT', steps: [null, null, { unlock: ['riftstalker'], short: 'Riftstalkers', txt: 'Unlocks Riftstalkers: hit-and-fade hunters' }, { unlock: ['parallax'], short: 'Parallaxes', txt: 'Unlocks Parallaxes: phase-step behind the target, blows that disrupt' }] },
              B: { name: 'Lattice Doctrine', short: 'LATTICE', steps: [null, null, { unlock: ['lancer'], short: 'Lancers', txt: 'Unlocks Lancers: focusing bolts at air and ground' }, { unlock: ['marksman'], short: 'Astral Marksmen', txt: 'Unlocks Astral Marksmen: charged shots from very long range' }] } },
  factory:  { A: { name: 'Rupture Doctrine', short: 'RUPTURE', steps: [null, null, { unlock: ['riftmortar'], short: 'Rift Mortars', txt: 'Unlocks Rift Mortars: precise long-range strikes' }, { unlock: ['worldbreaker'], short: 'Worldbreakers', txt: 'Unlocks Worldbreakers: heavy siege whose zones weaken enemy fire' }] },
              B: { name: 'Dominion Doctrine', short: 'DOMINION', steps: [null, null, { unlock: ['gravemantle'], short: 'Gravemantles', txt: 'Unlocks Gravemantles: an aura that slows enemy ground units' }, { unlock: ['eventide'], short: 'Eventides', txt: 'Unlocks Eventides: a gravity pulse that pulls enemies in' }] } },
  techlab:  { A: { name: 'Swarm Calculus', short: 'SWARM', steps: [null, null, { unlock: ['prismwing'], short: 'Prismwings', txt: 'Unlocks Prismwings: cheap flyers that share shield damage' }, { unlock: ['shardstorm'], short: 'Shardstorms', txt: 'Unlocks Shardstorms: a beam that chains between enemies, air and ground' }] },
              B: { name: 'Ascendant Calculus', short: 'ASCEND', steps: [null, null, { unlock: ['voidcarrier'], short: 'Voidcarriers', txt: 'Unlocks Voidcarriers: flying power nodes; units warp in under them' }, { unlock: ['sovereign'], short: 'Astral Sovereigns', txt: 'Unlocks Astral Sovereigns: flyers with a charged judgement beam' }] } },
};
const TREE_SETS = { lastfist: TREES, bloomhost: TREES_BH, axiarchs: TREES_AX };
const prodLocked = (fac, type) => !!TREES[type] && !treeOf(fac, type); // a production building with no paths yet (Axiarchs, v2.25)
const DRILL = { hp: 1.35, dmg: 1.1, capture: 1.5 }, PAIR_TIME = 1.5;
const NANO = { dmg: 1.2, cut: 0.85 }; // Nanoweave (Support T3): its side deals ×dmg and takes ×cut (v2.45: named, so its description reads it; same values) // a Mass Deployment pair takes 1.5× a Rifleman's training time
const UNIT_PATH = {}; // unit type → { b: building type, p: path, path: the path's entry } for units a path unlocks (both factions)
for (const fac in TREE_SETS) { const S = TREE_SETS[fac]; for (const bt in S) for (const p in S[bt]) for (const st of S[bt][p].steps) if (st && st.unlock) for (const u of st.unlock) UNIT_PATH[u] = { b: bt, p, path: S[bt][p] }; }
const pathMod = (b, mod) => { const T = treeOf(b.fac, b.type); if (!T || !b.path || !b.built) return false; const st = T[b.path].steps; for (let t = 2; t <= b.tier; t++) if (st[t] && st[t].mod === mod) return true; return false; };
// Can this building train this unit now? (type, finished, tier, and the path that unlocks it)
const canMake = (b, type) => { const d = UDEF[type], q = UNIT_PATH[type]; return !d.noTrain && b.kind === 'b' && b.type === d.from && facOf(b.fac) === (d.fac || DEFAULT_FACTION) && b.built && b.hp > 0 && b.tier >= d.tier && (!q || b.path === q.p); };
const canTrain = (g, s, type) => g.ents.some(e => e.side === s && canMake(e, type));

const UDEF = {
  rifle:     { name: 'Rifleman', desc: 'Cheap all-round infantry that shoots ground and air. Strong in numbers early; melts to splash, Snipers and Flame Tanks.',  from: 'barracks', tier: 1, cost: { c: 50, e: 0 },    pop: 1, hp: 70,   dmg: 7,  cd: 0.7,  range: 120, speed: 38, hitsAir: true,  armor: 'light',   weapon: 'rifle',  time: 4,  h: 20 },
  heavy:     { name: 'Heavy', desc: 'Rocket trooper built to kill armor and aircraft. Sturdy for infantry, but slow-firing and poor against swarms.',     from: 'barracks', tier: 2, cost: { c: 100, e: 25 },  pop: 2, hp: 240,  dmg: 16, cd: 1.3,  range: 130, speed: 27, hitsAir: true,  armor: 'heavy',   weapon: 'rocket', time: 7,  h: 26 },
  sniper:    { name: 'Sniper', desc: 'Long-range marksman whose rounds pierce a line of infantry. Fragile and slow-firing: keep it behind a front line.',    from: 'barracks', tier: 3, cost: { c: 150, e: 60 },  pop: 2, hp: 110,  dmg: 60, cd: 2.6,  range: 270, speed: 30, hitsAir: true,  armor: 'light',   weapon: 'rail',   time: 9,  h: 20 },
  tank:      { name: 'Tank', desc: 'Armored battle tank with a splash cannon for ground units and buildings. It can\'t shoot aircraft; Heavies and Gunships punish it.',      from: 'factory',  tier: 1, cost: { c: 200, e: 40 },  pop: 3, hp: 560,  dmg: 42, cd: 1.7,  range: 160, speed: 31, hitsAir: false, armor: 'vehicle', weapon: 'cannon', time: 11, h: 20, splash: 26 },
  artillery: { name: 'Artillery', desc: 'Long-range gun that fires shell salvos over the front line. Very fragile, and it can\'t hit targets that get too close.', from: 'factory',  tier: 2, cost: { c: 175, e: 60 },  pop: 3, hp: 150,  dmg: 60, cd: 3.2,  range: 440, minRange: 110, speed: 22, hitsAir: false, armor: 'vehicle', weapon: 'shell', time: 12, h: 18, splash: 55 },
  titan:     { name: 'Titan', desc: 'Huge walker that plants in siege mode for extra range and building damage. Slow and rooted while planted; Heavies and aircraft wear it down.',     from: 'factory',  tier: 3, cost: { c: 420, e: 160 }, pop: 6, hp: 1500, dmg: 75, cd: 2.4,  range: 190, speed: 19, hitsAir: false, armor: 'vehicle', weapon: 'siege',  time: 18, h: 30, splash: 34 },
  aircraft:  { name: 'Gunship', desc: 'Fast missile gunship that hits ground and air, good at picking off vehicles. Anti-air and Turrets shoot it down.',   from: 'techlab',  tier: 1, cost: { c: 225, e: 100 }, pop: 3, hp: 230,  dmg: 20, cd: 0.8,  range: 140, speed: 72, hitsAir: true,  armor: 'air', air: true, weapon: 'missile', time: 13, h: 12 },
  // Tech Lab tree (v2.15). Air Power: the Interceptor (reworked: cheaper, escorts your aircraft) and the Leviathan, a slow
  // bomber that drops on what is right below it and prefers buildings. Support: the Medicopter heals infantry nearby
  // (2.5% of max HP per second, the strongest heal applies), the Recon Drone scouts (sight 420, at most 3 per side).
  interceptor: { name: 'Interceptor', desc: 'Fast flak fighter that attacks only aircraft and escorts your bombers. Useless against ground units.', from: 'techlab', tier: 2, cost: { c: 150, e: 60 }, pop: 2, hp: 190, dmg: 16, cd: 0.45, range: 180, speed: 100, hitsAir: true, hitsGround: false, armor: 'air', air: true, weapon: 'flak', time: 10, h: 10 },
  leviathan: { name: 'Leviathan', desc: 'Slow, heavy bomber that carpet-bombs the buildings below it. It can\'t hit aircraft and needs escorts against anti-air.', from: 'techlab', tier: 3, cost: { c: 480, e: 240 }, pop: 7, hp: 1400, dmg: 140, cd: 3.0, range: 40, speed: 24, hitsAir: false, armor: 'air', air: true, weapon: 'bomb', time: 20, h: 16, splash: 60, preferB: true },
  medic:     { name: 'Medicopter', desc: 'Unarmed helicopter that heals nearby infantry. Keeps an infantry army fighting longer, but must be guarded from anti-air.', from: 'techlab', tier: 2, cost: { c: 160, e: 80 }, pop: 2, hp: 260, dmg: 0, cd: 1, range: 0, speed: 60, hitsAir: false, hitsGround: false, armor: 'air', air: true, weapon: null, time: 10, h: 12, support: true, heal: 0.025, healR: 120 },
  drone:     { name: 'Recon Drone', desc: 'Fast, unarmed scout with very long sight that spots for Artillery. Fragile, and only a few can fly at once.', from: 'techlab', tier: 2, cost: { c: 70, e: 30 }, pop: 1, hp: 80, dmg: 0, cd: 1, range: 0, speed: 115, hitsAir: false, hitsGround: false, armor: 'air', air: true, weapon: null, time: 5, h: 8, support: true, max: 3 },
  // War Factory, Assault path (v2.14). Flame Tank: every 0.25 s it burns every enemy on the ground in a 95 × 48 strip ahead.
  // Hydra: twin rotary guns, one target at a time, prefers aircraft; swinging between ground and air takes 0.4 s.
  flame:     { name: 'Flame Tank', desc: 'Short-range flamethrower tank that burns packed infantry. Weak against vehicles and anything that out-ranges it.', from: 'factory', tier: 2, cost: { c: 190, e: 50 }, pop: 3, hp: 520, dmg: 10, cd: 0.25, range: 95, speed: 34, hitsAir: false, armor: 'vehicle', weapon: 'flame', time: 12, h: 18, strip: 24 },
  hydra:     { name: 'Hydra', desc: 'Heavy walker with rotary guns that targets aircraft first. Strong air cover for an army; slow and vulnerable to Tanks.', from: 'factory', tier: 3, cost: { c: 360, e: 140 }, pop: 5, hp: 1100, dmg: 22, cd: 0.3, range: 200, airRange: 240, speed: 22, hitsAir: true, armor: 'vehicle', weapon: 'hydra', time: 16, h: 28, preferAir: true, swing: 0.4 },
  // Bloomhost base units (v2.17). melee: strikes land at once (no projectile); chase: it closes on a visible enemy within
  // this range instead of walking past it in its own lane. Skitterling swarm: +15% damage for each other Skitterling on the
  // same target, up to +45%. Bulwark brace: the first hit after its cooldown hardens it (40% less damage for 3 s, every 12 s).
  skitterling: { name: 'Skitterling', desc: 'Cheap, fast melee swarmer that bites harder when several attack one target. Dies quickly to splash and can\'t hit aircraft.', fac: 'bloomhost', from: 'barracks', tier: 1, cost: { c: 40, e: 0 }, pop: 1, hp: 60, dmg: 6, cd: 0.5, range: 20, speed: 52, hitsAir: false, armor: 'light', weapon: 'claw', time: 3, h: 10, melee: true, chase: 150, swarm: { per: 0.15, max: 0.45 } },
  bulwark:   { name: 'Bulwark', desc: 'Hulking melee frontliner that braces to take less damage when hit. Soaks fire well, but is slow and can\'t hit aircraft.', fac: 'bloomhost', from: 'factory', tier: 1, cost: { c: 190, e: 40 }, pop: 3, hp: 760, dmg: 26, cd: 1.6, range: 34, speed: 24, hitsAir: false, armor: 'vehicle', weapon: 'slam', time: 11, h: 20, melee: true, chase: 150, brace: { cut: 0.4, dur: 3, cd: 12 } },
  razorwing: { name: 'Razorwing', desc: 'Fast melee flyer that dives on ground units and aircraft. Fragile against dedicated anti-air and Maws or Turrets.', fac: 'bloomhost', from: 'techlab', tier: 1, cost: { c: 170, e: 70 }, pop: 2, hp: 170, dmg: 15, cd: 0.75, range: 50, speed: 95, hitsAir: true, armor: 'air', air: true, weapon: 'talon', time: 10, h: 10, melee: true, chase: 200 }, // v2.19: hits air too (amendment F)
  // Bloomhost tree units (v2.19). Larva Pit, Predatory Evolution: Leaper (leap: closes up to 140 in one jump, every 7 s),
  // Ravager (its maul does 1.6x to light armor). Acidic Evolution: Spitter (hits air and ground; corrodes), Bilecaster
  // (ground splash, stronger corrosion). Corrosion: the target takes more damage for a few seconds; a new hit keeps the
  // strongest level and the later end, never adding up, and never past CORR.cap.
  leaper:    { name: 'Leaper', desc: 'Melee hunter that leaps onto ranged units from a distance. Great for diving a backline; falls to splash and focused fire.', fac: 'bloomhost', from: 'barracks', tier: 2, cost: { c: 90, e: 20 }, pop: 2, hp: 150, dmg: 14, cd: 0.8, range: 22, speed: 46, hitsAir: false, armor: 'light', weapon: 'rend', time: 6, h: 14, melee: true, chase: 160, leap: { range: 140, min: 45, speed: 280, cd: 7 } },
  ravager:   { name: 'Ravager', desc: 'Heavy melee brute that shreds light armor and frenzies after a kill. Strong against infantry; struggles against Tanks and defences.', fac: 'bloomhost', from: 'barracks', tier: 3, cost: { c: 160, e: 50 }, pop: 3, hp: 340, dmg: 30, cd: 1.0, range: 24, speed: 44, hitsAir: false, armor: 'heavy', weapon: 'maul', time: 9, h: 22, melee: true, chase: 170 },
  spitter:   { name: 'Spitter', desc: 'Ranged acid thrower that hits air and ground and makes its targets take more damage. Fragile once enemies close in.', fac: 'bloomhost', from: 'barracks', tier: 2, cost: { c: 90, e: 30 }, pop: 2, hp: 110, dmg: 11, cd: 1.0, range: 150, speed: 34, hitsAir: true, armor: 'light', weapon: 'acid', time: 6, h: 16, corrode: { amt: 0.12, dur: 5 } },
  bilecaster: { name: 'Bilecaster', desc: 'Long-range caster whose bile darts mark a target with lasting corrosion. One target at a time, and it can\'t hit aircraft.', fac: 'bloomhost', from: 'barracks', tier: 3, cost: { c: 170, e: 70 }, pop: 3, hp: 160, dmg: 26, cd: 2.2, range: 220, speed: 28, hitsAir: false, armor: 'light', weapon: 'bile', time: 9, h: 20, splash: 40, corrode: { amt: 0.2, dur: 6 } },
  // Evolution Chamber, Siege Evolution: Bile Lobber (Artillery's mechanics: arcing shot, minimum range, splash), Ruinmaw
  // (heavy building damage; each hit leaves a short acid pool). Predator Evolution: Thornback (melee attackers take 20% of
  // the damage back), Dreadthorn (a hit of 60+ releases a spine burst around it, every 15 s).
  bilelobber: { name: 'Bile Lobber', desc: 'Living artillery that lobs corrosive bile over the front from long range. Defenceless up close and against aircraft.', fac: 'bloomhost', from: 'factory', tier: 2, cost: { c: 170, e: 60 }, pop: 3, hp: 160, dmg: 55, cd: 3.4, range: 420, minRange: 110, speed: 22, hitsAir: false, armor: 'heavy', weapon: 'lob', lob: true, time: 12, h: 20, splash: 55 },
  ruinmaw:   { name: 'Ruinmaw', desc: 'Massive siege beast built to break buildings; its hits leave acid pools. Slow, and weak to fast attackers and aircraft.', fac: 'bloomhost', from: 'factory', tier: 3, cost: { c: 400, e: 150 }, pop: 6, hp: 1300, dmg: 70, cd: 2.8, range: 200, speed: 18, hitsAir: false, armor: 'vehicle', weapon: 'ruin', time: 18, h: 28, splash: 34, acid: true },
  thornback: { name: 'Thornback', desc: 'Armored melee brawler that hurts anyone who strikes it up close. Holds the front line; vulnerable to ranged focus fire.', fac: 'bloomhost', from: 'factory', tier: 2, cost: { c: 180, e: 40 }, pop: 3, hp: 700, dmg: 22, cd: 1.1, range: 30, speed: 28, hitsAir: false, armor: 'heavy', weapon: 'gore', time: 11, h: 20, melee: true, chase: 150, thorns: { frac: 0.2, range: 60 } },
  dreadthorn: { name: 'Dreadthorn', desc: 'Huge armored brute that bursts spines around it when hit hard. Punishes packed infantry; ranged units and aircraft beat it.', fac: 'bloomhost', from: 'factory', tier: 3, cost: { c: 380, e: 140 }, pop: 5, hp: 1350, dmg: 34, cd: 1.2, range: 34, speed: 24, hitsAir: false, armor: 'heavy', weapon: 'gore', time: 16, h: 28, melee: true, chase: 150, burst: { trigger: 60, r: 80, dmg: 45, cd: 15 } },
  // Bloomspire tree (v2.21). Swarm Bloom: Needlewing (cheap, fast, ground only; the Skitterling's swarm bonus), Cloudwing
  // (swarm flyer; while fighting it releases offspring: temporary Needlewings at half damage, see SPAWN). Apex Bloom:
  // Brood Tyrant (slow, heavy globs, prefers buildings like the Leviathan), Worldrender (drops a crushing mass from above
  // like the Leviathan's bomb: heavy building damage, splash on ground units). None of the four can hit aircraft.
  needlewing: { name: 'Needlewing', desc: 'Cheap, fast flyer that hits ground targets harder in a pack. It can\'t hit aircraft and dies quickly to anti-air.', fac: 'bloomhost', from: 'techlab', tier: 2, cost: { c: 70, e: 30 }, pop: 1, hp: 80, dmg: 8, cd: 0.6, range: 40, speed: 115, hitsAir: false, armor: 'air', air: true, weapon: 'needle', time: 5, h: 8, melee: true, chase: 200, swarm: { per: 0.12, max: 0.36 } },
  cloudwing: { name: 'Cloudwing', desc: 'Swarm flyer that releases short-lived offspring while it fights. Overwhelms ground targets but can\'t hit aircraft.', fac: 'bloomhost', from: 'techlab', tier: 3, cost: { c: 220, e: 100 }, pop: 3, hp: 280, dmg: 14, cd: 0.6, range: 45, speed: 85, hitsAir: false, armor: 'air', air: true, weapon: 'needle', time: 12, h: 12, melee: true, chase: 200, swarm: { per: 0.12, max: 0.36 }, spawn: { n: 2, cd: 14, life: 12 } },
  broodtyrant: { name: 'Brood Tyrant', desc: 'Heavy flying beast that lobs globs at buildings first. Tough, but slow and helpless against aircraft.', fac: 'bloomhost', from: 'techlab', tier: 2, cost: { c: 320, e: 150 }, pop: 5, hp: 950, dmg: 60, cd: 2.4, range: 150, speed: 40, hitsAir: false, armor: 'air', air: true, weapon: 'glob', time: 16, h: 16, splash: 24, preferB: true },
  worldrender: { name: 'Worldrender', desc: 'Colossal aerial base-breaker that crushes buildings from above and feeds on them. It can\'t hit aircraft; burst anti-air brings it down.', fac: 'bloomhost', from: 'techlab', tier: 3, cost: { c: 520, e: 260 }, pop: 8, hp: 1700, dmg: 170, cd: 4.0, range: 50, speed: 20, hitsAir: false, armor: 'air', air: true, weapon: 'crush', drop: true, time: 22, h: 20, splash: 70, preferB: true },
};
// The Mite (v2.33): spawned by the Brood Mound, never trained (noTrain) and never counted for node capture (noCap). A fast
// melee biter at 40% of a Skitterling's HP and damage and 120% of its speed; a temporary unit (MOUND.life), no supply, no cost.
UDEF.mite = { name: 'Mite', desc: 'Free, short-lived biter spawned by the Brood Mound. Tiny and fragile: it harasses, but never captures nodes.', fac: 'bloomhost', from: 'sigA', tier: 1, cost: { c: 0, e: 0 }, pop: 0, hp: UDEF.skitterling.hp * 0.4, dmg: UDEF.skitterling.dmg * 0.4, cd: UDEF.skitterling.cd,
  range: UDEF.skitterling.range, speed: UDEF.skitterling.speed * 1.2, hitsAir: false, armor: 'light', weapon: 'claw', time: 0, h: 7, melee: true, chase: 150, noTrain: true, noCap: true, spawned: true };
// Axiarch base units (v2.25). Every Axiarch unit has shields (shp) on top of its HP: damage hits shields first, they
// regenerate after SHIELD.delay quiet seconds, and they never restore HP. Shardling: fast melee. Bastion: a slow,
// heavily shielded frontline with the Bulwark's brace (40% less damage for 3 s, every 12 s). Wraithwing: a fast flyer that
// hits aircraft, ground and buildings. More credits, energy and supply than the other factions' counterparts.
Object.assign(UDEF, {
  shardling: { name: 'Shardling', desc: 'Fast, shielded melee blade for raids and node captures. Pricey for basic infantry, and it can\'t hit aircraft.', fac: 'axiarchs', from: 'barracks', tier: 1, cost: { c: 80, e: 20 }, pop: 2, hp: 80, shp: 60, dmg: 11, cd: 0.6, range: 22, speed: 50, hitsAir: false, armor: 'light', weapon: 'blade', time: 6, h: 18, melee: true, chase: 150 },
  bastion: { name: 'Bastion', desc: 'Heavily shielded frontline walker whose shields surge back when struck. Holds ground; burst damage and aircraft get through.', fac: 'axiarchs', from: 'factory', tier: 1, cost: { c: 280, e: 90 }, pop: 4, hp: 620, shp: 420, dmg: 36, cd: 1.6, range: 100, speed: 23, hitsAir: false, armor: 'vehicle', weapon: 'pulse', time: 14, h: 24, brace: { cut: 0.4, dur: 3, cd: 12 } },
  wraithwing: { name: 'Wraithwing', desc: 'Fast shielded flyer that hits air, ground and buildings, and phases out for a moment when hit. Rapid-fire anti-air counters it.', fac: 'axiarchs', from: 'techlab', tier: 1, cost: { c: 260, e: 120 }, pop: 3, hp: 160, shp: 140, dmg: 20, cd: 0.8, range: 140, speed: 86, hitsAir: true, armor: 'air', air: true, weapon: 'phase', time: 13, h: 12 },
});
// Axiarch tree units (v2.27). Genesis Gate, Riftwalk Doctrine: Riftstalker (phase-step: the Leaper's leap code; bonus vs
// light), Parallax (its phase-step lands just behind the target; its blows disrupt: the target deals less damage for 2 s,
// never stacking past DISRUPT.cap). Lattice Doctrine: Lancer (energy bolts at air and ground), Astral Marksman (very long
// range; a visible charge-up of charge seconds on the same target before each shot; weak against buildings).
// Architectum, Rupture Doctrine: Rift Mortar (Artillery's arcing shot, minimum range, splash), Worldbreaker (heavy siege;
// each hit leaves a distortion zone in the Ruinmaw's acid-pool list, under its hard cap). Dominion Doctrine: Gravemantle
// (an aura that slows enemy ground units; slows never stack, the strongest applies, capped at SLOW.cap), Eventide (every
// pulse.cd seconds a gravity pulse pulls enemy ground units inward; never into buildings or off the lane, never aircraft).
Object.assign(UDEF, {
  riftstalker: { name: 'Riftstalker', desc: 'Melee hunter that phase-steps onto a ranged target, strikes and steps back. Strong against exposed backlines; weak to burst.', fac: 'axiarchs', from: 'barracks', tier: 2, cost: { c: 140, e: 50 }, pop: 3, hp: 170, shp: 110, dmg: 18, cd: 0.8, range: 24, speed: 48, hitsAir: false, armor: 'light', weapon: 'riftblade', time: 8, h: 20, melee: true, chase: 160, leap: { range: 130, min: 45, speed: 420, cd: 8 } },
  parallax: { name: 'Parallax', desc: 'Armored melee duelist that steps behind its target; its blows weaken enemy fire. Struggles against focus fire and defences.', fac: 'axiarchs', from: 'barracks', tier: 3, cost: { c: 220, e: 90 }, pop: 4, hp: 260, shp: 180, dmg: 30, cd: 0.9, range: 26, speed: 46, hitsAir: false, armor: 'heavy', weapon: 'parallax', time: 11, h: 24, melee: true, chase: 170, leap: { range: 150, min: 40, speed: 480, cd: 9, behind: true }, disrupt: { amt: 0.3, dur: 2 } },
  lancer: { name: 'Lancer', desc: 'Ranged infantry whose bolts grow stronger on the same target, air or ground. Good against tough targets; poor against swarms.', fac: 'axiarchs', from: 'barracks', tier: 2, cost: { c: 150, e: 60 }, pop: 3, hp: 150, shp: 110, dmg: 16, cd: 0.9, range: 170, speed: 32, hitsAir: true, armor: 'light', weapon: 'bolt', time: 8, h: 22 },
  marksman: { name: 'Astral Marksman', desc: 'Very long-range sniper that charges each shot. Deadly against infantry; it can\'t hit aircraft and is weak against buildings.', fac: 'axiarchs', from: 'barracks', tier: 3, cost: { c: 240, e: 110 }, pop: 4, hp: 140, shp: 120, dmg: 85, cd: 3.0, range: 330, speed: 28, hitsAir: false, armor: 'light', weapon: 'astral', time: 11, h: 24, charge: 1.2 },
  riftmortar: { name: 'Rift Mortar', desc: 'Precise long-range artillery for high-value targets and buildings. Little splash, and helpless up close.', fac: 'axiarchs', from: 'factory', tier: 2, cost: { c: 220, e: 90 }, pop: 4, hp: 160, shp: 120, dmg: 60, cd: 3.3, range: 430, minRange: 110, speed: 21, hitsAir: false, armor: 'vehicle', weapon: 'rift', lob: true, time: 13, h: 22, splash: 55 },
  worldbreaker: { name: 'Worldbreaker', desc: 'Heavy siege walker whose hits leave zones that weaken enemy fire. Slow; aircraft and mobile armies avoid it.', fac: 'axiarchs', from: 'factory', tier: 3, cost: { c: 460, e: 190 }, pop: 7, hp: 1150, shp: 650, dmg: 80, cd: 2.8, range: 210, speed: 17, hitsAir: false, armor: 'vehicle', weapon: 'breaker', time: 19, h: 30, splash: 34, acid: 'dist' },
  gravemantle: { name: 'Gravemantle', desc: 'Support walker with an aura that slows nearby enemy ground units. A weak shot, and it can\'t hit aircraft.', fac: 'axiarchs', from: 'factory', tier: 2, cost: { c: 230, e: 100 }, pop: 4, hp: 520, shp: 380, dmg: 14, cd: 1.2, range: 120, speed: 24, hitsAir: false, armor: 'heavy', weapon: 'grav', time: 13, h: 24, aura: { r: 110, slow: 0.3 } },
  eventide: { name: 'Eventide', desc: 'Heavy walker that pulses gravity to pull enemy ground units together. Sets up splash damage; it can\'t hit aircraft.', fac: 'axiarchs', from: 'factory', tier: 3, cost: { c: 420, e: 180 }, pop: 6, hp: 1000, shp: 650, dmg: 24, cd: 1.3, range: 140, speed: 20, hitsAir: false, armor: 'vehicle', weapon: 'grav', time: 17, h: 30, pulse: { r: 130, pull: 40, cd: 14 } },
});
// Celestial Array tree units (v2.29). Swarm Calculus: Prismwing (fragile, cheaper; shield link: when its shield takes damage,
// link.share of that is spread evenly over the shields of up to link.n other Prismwings within link.r; shields only, never
// health), Shardstorm (a beam that chains from its target to up to chain.n more enemies within chain.r of the last one,
// chain.fall less damage each jump; the Null Lance's Split Lattice target rules). Ascendant Calculus: Voidcarrier (slow
// powerful projectiles, prefers buildings like the Brood Tyrant), Astral Sovereign (drops a heavy mass from above like the
// Worldrender: area damage, structures first). Neither of the Ascendant two can hit aircraft.
Object.assign(UDEF, {
  prismwing: { name: 'Prismwing', desc: 'Cheap flyer whose linked shields share damage across the pack. It can\'t hit aircraft; splash anti-air hurts it.', fac: 'axiarchs', from: 'techlab', tier: 2, cost: { c: 120, e: 50 }, pop: 2, hp: 100, shp: 90, dmg: 11, cd: 0.7, range: 120, speed: 100, hitsAir: false, armor: 'air', air: true, weapon: 'prism', time: 7, h: 10, link: { share: 0.5, n: 3, r: 110 } },
  shardstorm: { name: 'Shardstorm', desc: 'Flyer with a beam that chains between enemies, air and ground. Great against swarms; weak against single heavy targets and buildings.', fac: 'axiarchs', from: 'techlab', tier: 3, cost: { c: 280, e: 130 }, pop: 4, hp: 220, shp: 190, dmg: 24, cd: 1.1, range: 160, speed: 80, hitsAir: true, armor: 'air', air: true, weapon: 'storm', beam: true, time: 13, h: 14, chain: { n: 3, r: 90, fall: 0.7 } },
  voidcarrier: { name: 'Voidcarrier', desc: 'Slow flying power node: Axiarch shields recharge and units warp in beneath it. It can\'t hit aircraft, and losing it collapses the field.', fac: 'axiarchs', from: 'techlab', tier: 2, cost: { c: 360, e: 170 }, pop: 6, hp: 900, shp: 520, dmg: 72, cd: 2.8, range: 170, speed: 34, hitsAir: false, armor: 'air', air: true, weapon: 'void', time: 17, h: 18, splash: 24, preferB: true },
  sovereign: { name: 'Astral Sovereign', desc: 'Huge flyer that charges a judgement beam for massive single-target damage. Slow, can\'t hit aircraft, and exposed while charging.', fac: 'axiarchs', from: 'techlab', tier: 3, cost: { c: 600, e: 300 }, pop: 9, hp: 1500, shp: 900, dmg: 190, cd: 4.2, range: 50, speed: 17, hitsAir: false, armor: 'air', air: true, weapon: 'sovereign', drop: true, time: 24, h: 22, splash: 75, preferB: true },
});
const DISRUPT = { cap: 0.3 }, SLOW = { cap: 0.35, dur: 0.35 }; // the strongest wins, never added up
const SHIELD = { delay: 4, rate: 0.1 }; // Axiarch shields: regen 10% of max per second after 4 s without damage (the power field's faster rate comes in v2.26)
// Salvage (v2.30, docs/LASTFIST.md): Last Fist's signature mechanic. When a non-temporary unit of either side dies within
// r of a Last Fist unit or building (not the dying unit itself), that Last Fist side gains pct of the unit's credit cost,
// rounded; at most cap credits per side per game minute (the rest is lost). Buildings give nothing. pct 0 turns it all off.
const SALVAGE = { pct: 0.1, r: 200, cap: 200, per: 60 };
// Salvage Yard (v2.32): a finished Yard raises Salvage to pct (T1); T2 multiplies the cap by cap and returns energy worth
// energy × the credits salvaged; T3: salvage over the cap starts Overdrive: Last Fist production buildings work od faster
// for odDur seconds (a new overflow restarts the timer; it never stacks). Losing the Yard returns everything to SALVAGE.
const YARD = { pct: 0.2, cap: 2, energy: 0.5, od: 0.25, odDur: 20 };
// Fortification Depot (v2.32): a bunker destroyed while its node is still held is rebuilt after rebuild seconds; from T2
// bunkers heal friendly Barracks units within their gun's range by heal of max HP per second (the strongest heal applies).
const BUNKER = { rebuild: 45, heal: 0.02, back: 80, side: 75 }; // back/side: where it stands: toward its own base (on the far node, outside the enemy HQ's T1 gun) and far enough back to stand clear of the rally flag
// Brood Mound (v2.33): every `every` seconds the finished Mound spawns n[tier] Mites, never past max living Mites per side
// (spawning skips at the cap); each lives `life` seconds. T3: a Mite that is killed (never one that expires) bursts into
// acid: burst × a Mite's damage to enemy ground units within r (never buildings or aircraft).
const MOUND = { every: 20, n: [0, 2, 3, 3], life: 30, max: 10, r: 40, burst: 0.5 };
// Rootheart (v2.33): T1 creep grows grow× faster and reaches reach× farther, and enemy ground units on it are slowed by slow
// (the usual slow rule: the strongest wins); T2 Bloomhost regen on creep × regen; T3 every `every` seconds roots snare up to
// max enemy ground units in the creep's outer strip (edge deep) for snare seconds (they can still attack), then they are
// immune for imm seconds. Losing the Rootheart: creep's reach returns to normal and the extra recedes by the usual rules.
const ROOT = { grow: 1.5, reach: 1.5, slow: 0.15, regen: 1.5, every: 15, snare: 1, imm: 10, max: 5, edge: 16 };
// Phase Beacon (v2.34): a power-field bubble (a normal field patch, key 'beacon') that follows its anchor, the frontmost Axiarch
// ground unit (else the frontmost unit; with none, the Beacon itself), re-picked every `every` seconds and approached at
// `move` per second. Radius: a node's field (FIELD.nodeR) at T1, × r2 from T2. If its side's units inside lose `loss` of their
// combined shields plus health within `window` seconds it collapses for `down` seconds, then re-forms at the anchor. T3: a
// unit that warps in inside the bubble arrives with full shields and +dmg damage for dmgDur seconds.
const BEACON = { every: 1, move: 90, r2: 1.5, loss: 0.35, window: 5, down: 15, dmg: 0.2, dmgDur: 8 };
// Echo Reliquary (v2.34): an Axiarch T2/T3 unit that dies (never a temporary or recovered one) leaves an echo: n[tier] are kept,
// the oldest replaced. An echo warps the unit back for cost × its price (normal warp channel, supply and placement; no
// production building or path needed), consumed as the warp starts. T3: recovered units arrive with an overshield of osh × max
// shields for oshDur seconds (it never regenerates). Losing the Reliquary loses every echo.
const ECHO = { n: [0, 3, 5, 5], cost: 0.5, osh: 0.3, oshDur: 20 };
const SIG = { on: true }; // false: no signature buildings for anyone (the AI never builds them; tests compare against older versions)
const SPAWN = { max: 6, dmg: 0.5 }; // Cloudwing offspring: at most 6 per side at once (separate from Emergency Brood's TEMP.max), half damage
const CORR = { cap: 0.25 }; // corrosion: at most +25% damage taken, however many acid hits land
const ACID = { max: 6, r: 40, dps: 12, dur: 4 }; // Ruinmaw acid pools: at most 6 at once (the oldest goes), 12 damage/s to enemy ground units, 4 s

// Damage multiplier: weapon → target armor. 0 means the weapon can't touch it.
const DMG = {
  rifle:   { light: 1.0, heavy: 0.45, vehicle: 0.3,  air: 0.75, building: 0.45 },
  rocket:  { light: 0.6, heavy: 1.0,  vehicle: 1.6,  air: 1.3,  building: 1.0 },
  hqgun:   { light: 0.9, heavy: 1.0,  vehicle: 1.6,  air: 1.3,  building: 1.0 }, // the HQ's own rockets: better against infantry
  hqbeam:  { light: 0.9, heavy: 1.0,  vehicle: 1.6,  air: 1.3,  building: 1.0 }, // the Axis lance (v2.36): the HQ gun's multipliers
  rail:    { light: 1.6, heavy: 1.4,  vehicle: 0.35, air: 0.5,  building: 0.3 },
  cannon:  { light: 0.9, heavy: 1.25, vehicle: 1.15, air: 0,    building: 1.3 },
  shell:   { light: 1.1, heavy: 1.0,  vehicle: 0.75, air: 0,    building: 1.6 },
  siege:   { light: 0.9, heavy: 1.2,  vehicle: 1.2,  air: 0,    building: 1.6 },
  missile: { light: 1.0, heavy: 0.8,  vehicle: 1.3,  air: 1.0,  building: 0.8 },
  flak:    { light: 0,   heavy: 0,    vehicle: 0,    air: 1.8,  building: 0 },
  gatling: { light: 1.0, heavy: 0.8,  vehicle: 0.8,  air: 1.0,  building: 0 },
  flame:   { light: 1.7, heavy: 1.1,  vehicle: 0.35, air: 0,    building: 0.6 }, // the Flame Tank: no lingering burn
  hydra:   { light: 1.0, heavy: 0.8,  vehicle: 0.5,  air: 1.5,  building: 0.3 }, // helps a push, can't take a base alone
  bomb:    { light: 0.6, heavy: 0.8,  vehicle: 1.0,  air: 0,    building: 2.0 }, // the Leviathan: a base-wrecker
  orbital: { light: 1.0, heavy: 1.0,  vehicle: 1.0,  air: 1.0,  building: 1.0 }, // commander ability: every unit (v2.16) and buildings
  claw:    { light: 1.0, heavy: 0.7,  vehicle: 0.45, air: 0,    building: 0.5 }, // Skitterling (v2.17)
  slam:    { light: 1.1, heavy: 1.0,  vehicle: 0.8,  air: 0,    building: 0.9 }, // Bulwark
  talon:   { light: 1.1, heavy: 0.9,  vehicle: 0.9,  air: 0.8,  building: 0.6 }, // Razorwing: diving strikes; hits aircraft too (v2.19)
  spine:   { light: 1.0, heavy: 0.8,  vehicle: 0.8,  air: 1.0,  building: 0 },   // the Maw, like the Turret's gun
  rend:    { light: 1.1, heavy: 0.9,  vehicle: 0.5,  air: 0,    building: 0.5 }, // Leaper (v2.19)
  maul:    { light: 1.6, heavy: 1.0,  vehicle: 0.6,  air: 0,    building: 0.6 }, // Ravager: bonus against light armor
  acid:    { light: 1.0, heavy: 0.9,  vehicle: 0.8,  air: 1.1,  building: 0.4 }, // Spitter
  bile:    { light: 1.2, heavy: 1.0,  vehicle: 0.8,  air: 0,    building: 0.5 }, // Bilecaster
  lob:     { light: 1.1, heavy: 1.0,  vehicle: 0.75, air: 0,    building: 1.6 }, // Bile Lobber (Artillery's table)
  ruin:    { light: 0.9, heavy: 1.1,  vehicle: 1.0,  air: 0,    building: 1.7 }, // Ruinmaw
  gore:    { light: 1.2, heavy: 1.0,  vehicle: 0.7,  air: 0,    building: 0.7 }, // Thornback, Dreadthorn
  acidpool: { light: 1.0, heavy: 1.0, vehicle: 1.0,  air: 0,    building: 0 },   // the Ruinmaw's acid pools
  thorns:  { light: 1.0, heavy: 1.0,  vehicle: 1.0,  air: 1.0,  building: 0 },   // Thornback retaliation
  meteor:  { light: 1.0, heavy: 1.0,  vehicle: 1.0,  air: 0,    building: 1.0 }, // v2.72: a meteor strike (a battlefield condition)
  spores:  { light: 1.0, heavy: 1.0,  vehicle: 1.0,  air: 0,    building: 0 },   // Corrosive Bloom (v2.20)
  beam:    { light: 1.0, heavy: 1.0,  vehicle: 1.0,  air: 0,    building: 1.0 }, // Purification Beam (v2.28): ground units and buildings
  spines:  { light: 1.3, heavy: 1.0,  vehicle: 0.6,  air: 0,    building: 0 },   // Dreadthorn burst
  needle:  { light: 1.1, heavy: 0.8,  vehicle: 0.7,  air: 0,    building: 0.5 }, // Needlewing, Cloudwing (v2.21)
  glob:    { light: 0.8, heavy: 1.0,  vehicle: 1.1,  air: 0,    building: 1.6 }, // Brood Tyrant
  crush:   { light: 0.6, heavy: 0.8,  vehicle: 1.0,  air: 0,    building: 2.1 }, // Worldrender (the Leviathan's table, a little heavier on buildings)
  blade:   { light: 1.1, heavy: 0.9,  vehicle: 0.6,  air: 0,    building: 0.6 }, // Shardling (v2.25)
  pulse:   { light: 0.9, heavy: 1.1,  vehicle: 1.1,  air: 0,    building: 1.0 }, // Bastion
  phase:   { light: 1.0, heavy: 0.85, vehicle: 1.1,  air: 1.0,  building: 0.7 }, // Wraithwing
  lance:   { light: 1.0, heavy: 1.0,  vehicle: 0.9,  air: 1.1,  building: 0.3 }, // Null Lance T1-T2
  horizon: { light: 1.0, heavy: 1.1,  vehicle: 1.2,  air: 1.0,  building: 0.8 }, // Null Lance T3, Event Horizon
  riftblade: { light: 1.5, heavy: 0.9, vehicle: 0.6,  air: 0,    building: 0.6 }, // Riftstalker (v2.27): bonus vs light armor
  parallax: { light: 1.3, heavy: 1.1,  vehicle: 0.8,  air: 0,    building: 0.6 }, // Parallax
  bolt:    { light: 1.0, heavy: 1.0,  vehicle: 0.9,  air: 1.2,  building: 0.6 }, // Lancer: a main source of anti-air
  astral:  { light: 1.5, heavy: 1.4,  vehicle: 0.5,  air: 0,    building: 0.25 }, // Astral Marksman: weak vs buildings
  rift:    { light: 1.1, heavy: 1.0,  vehicle: 0.75, air: 0,    building: 1.6 }, // Rift Mortar (Artillery's table)
  breaker: { light: 0.9, heavy: 1.2,  vehicle: 1.2,  air: 0,    building: 1.7 }, // Worldbreaker
  grav:    { light: 1.0, heavy: 1.0,  vehicle: 1.0,  air: 0,    building: 0.5 }, // Gravemantle, Eventide: ground units and buildings (v2.31: buildings 0.5, was 0)
  prism:   { light: 1.0, heavy: 0.9,  vehicle: 0.9,  air: 0,    building: 0.7 }, // Prismwing (v2.29): ground and buildings
  storm:   { light: 1.2, heavy: 1.0,  vehicle: 0.8,  air: 1.2,  building: 0.4 }, // Shardstorm: aircraft, ground units and buildings (v2.31: buildings 0.4, was 0); the chain never jumps to buildings
  void:    { light: 0.8, heavy: 1.0,  vehicle: 1.1,  air: 0,    building: 1.6 }, // Voidcarrier (the Brood Tyrant's table)
  sovereign: { light: 0.6, heavy: 0.8, vehicle: 1.0, air: 0,    building: 2.1 }, // Astral Sovereign (the Worldrender's table)
  miteacid: { light: 1.0, heavy: 1.0, vehicle: 1.0, air: 0,    building: 0 },   // a Mite's acid burst (v2.33): ground units only
};
const PSPEED = { rifle: 1100, rocket: 430, hqgun: 430, rail: 1700, cannon: 820, siege: 700, missile: 470, flak: 950, gatling: 1200, hydra: 1200, bomb: 260, spine: 1100, acid: 520, bile: 460, ruin: 600, glob: 380, crush: 220, pulse: 650, phase: 800, bolt: 900, astral: 2200, breaker: 600, grav: 700, prism: 900, void: 300, sovereign: 220 };
const MUZ = { rifle: [10, 13], heavy: [12, 27], sniper: [17, 14], tank: [27, 18], artillery: [28, 31], titan: [38, 27], flame: [26, 12], hydra: [30, 33], aircraft: [16, -5], interceptor: [20, 0], leviathan: [0, -10], skitterling: [9, 5], mite: [7, 4], bulwark: [17, 11], razorwing: [12, 1], leaper: [12, 7], ravager: [18, 14], spitter: [14, 15], bilecaster: [16, 20], bilelobber: [12, 26], ruinmaw: [24, 16], thornback: [18, 10], dreadthorn: [22, 14], needlewing: [10, 1], cloudwing: [14, 1], broodtyrant: [20, 2], worldrender: [0, -8], shardling: [12, 12], bastion: [20, 17], wraithwing: [16, -1], riftstalker: [14, 12], parallax: [16, 14], lancer: [14, 18], marksman: [20, 20], riftmortar: [12, 24], worldbreaker: [26, 22], gravemantle: [16, 18], eventide: [18, 24], prismwing: [12, 0], shardstorm: [14, -1], voidcarrier: [22, 1], sovereign: [0, -8] };

const BUILD_ORDER = ['refinery', 'reactor', 'habitat', 'barracks', 'turret', 'factory', 'techlab', 'sigA', 'sigB']; // sig: only for a faction that has them (v2.32)
/* ---------- Unit redesign (v2.37, audit phase 3b; audit/unit-roster.md) ----------
   One core mechanic per redesigned unit, numbered as in the roster (P1-P16, S1). The numbers are first-pass placeholders
   for the balance phase. Each unit's new fields are applied to UDEF by setRedesign(true) at load; setRedesign(false)
   restores every v2.36 value and switches the mechanics off (REDESIGN.on), so a match then plays exactly as v2.36 did. */
const REDESIGN = { on: false, orig: {}, stats: {
  artillery:   { salvo: { n: 3, spread: 30, gap: 0.12 }, splash: 40 },             // P1: a three-shell salvo, a third of the damage each
  bilelobber:  { dmg: 40, corrode: { amt: 0.15, dur: 3 } },                        // P2: short corrosion over its whole splash
  riftmortar:  { dmg: 100, splash: 20, precise: true },                            // P3: no scatter, a tight splash, a heavy hit
  sniper:      { pierce: { n: 3, len: 150, w: 12, fall: 0.6 } },                   // P4: up to 3 more in a line behind, each 60% of the last
  riftstalker: { fade: true },                                                     // P5: strikes, then phase-steps back
  bastion:     { brace: undefined, surge: { rate: 0.35, dur: 3, cd: 12 } },       // P6: a shield surge instead of the Bulwark's brace
  titan:       { siege: { plant: 2, unplant: 1.5, reach: 90, bmul: 1.3, idle: 4 } }, // P8: siege lock
  leviathan:   { dmg: 35, splash: 40, carpet: { n: 4, gap: 26 } },                 // P10: a line of four smaller bombs
  worldrender: { devour: { frac: 0.3, cap: 40 } },                                 // P11: heals 30% of building damage, at most 40 HP/s
  sovereign:   { dmg: 260, splash: 0, drop: undefined, beam: true, charge: 2 },    // P12: a charged single-target beam
  wraithwing:  { phase: { dur: 1, cd: 8 } },                                       // P13: phases out when hit; 8 s before it can again
  lancer:      { focus: { per: 0.15, max: 4 } },                                   // P14: +15% per consecutive hit on one target, up to +60%
  ravager:     { bloodfrenzy: { dur: 4 } },                                        // P15: a kill frenzies it for 4 s (refreshed, never stacked)
  bilecaster:  { splash: 0, range: 280, corrode: { amt: 0.2, dur: 14 } },          // P16: a long single-target corrosion
  skitterling: { pop: 0.5, max: 60 },                                              // S1: half supply, at most 60 alive per side
  voidcarrier: { dmg: 50, node: { r: 120 } },                                       // P9: carries a power field (radius 120); hits softer
} };
// P7: a Worldbreaker's distortion zone disrupts the enemy units inside (they deal amt less) instead of burning them
const DIST = { amt: 0.3, dur: 0.5 };
function setRedesign(on) {
  for (const t in REDESIGN.stats) {
    const d = UDEF[t], o = REDESIGN.orig[t] || (REDESIGN.orig[t] = Object.fromEntries(Object.keys(REDESIGN.stats[t]).map(k => [k, [k in d, d[k]]])));
    for (const k in o) {
      const v = on ? REDESIGN.stats[t][k] : o[k][1], has = on ? v !== undefined : o[k][0];
      if (has) d[k] = v; else delete d[k];
    }
  }
  REDESIGN.on = on;
}
setRedesign(true);
/* ---------- Strategy balance (v2.42, audit phase 7b; audit/strategy-report.md) ----------
   Numbers only, on top of v2.41 (BALANCE above): unit, building, HQ gun, economy, node and signature-building values, each
   with its reason in the report. A patch is [path, value]; setBalance7b(false) puts back every v2.41 value, so a match then
   plays exactly as v2.41 did. setBalance(false) (v2.38) also turns this layer off. */
const BALANCE7B = { on: false, orig: null, patches: [
  // greed has a cost: a Refinery pays back in 44 s of its own income instead of 37.5, builds slower and dies faster
  ['BDEF.refinery.cost.c', 175], ['BDEF.refinery.time', 13], ['BDEF_BH.refinery.time', 13], ['BDEF_AX.refinery.time', 13],
  ['BDEF.refinery.hp', 420], ['BDEF_BH.refinery.hp', 420], ['BDEF_AX.refinery.hp', 336], ['BDEF_AX.refinery.shp', 126],
  // the HQ gun: weak at T1 (an early attack can hurt an undefended base), stronger at T2 and T3 (a paid defence)
  ['BDEF.hq.gun.1.dmg', 16], ['BDEF.hq.gun.2.dmg', 48], ['BDEF.hq.gun.3.dmg', 62],
  ['BDEF_AX.hq.gun.1.dmg', 16], ['BDEF_AX.hq.gun.2.dmg', 48], ['BDEF_AX.hq.gun.3.dmg', 62],
  // defence in time: the faction Turrets are cheaper, faster to build and tougher; the Maw and the Null Lance hit harder at T1
  ['BDEF.turret.cost.c', 150], ['BDEF.turret.cost.e', 40], ['BDEF.turret.time', 9], ['BDEF_BH.turret.time', 9], ['BDEF_AX.turret.time', 9],
  ['BDEF.turret.hp', 1300], ['BDEF_BH.turret.hp', 1400], ['BDEF_AX.turret.hp', 1040], ['BDEF_AX.turret.shp', 390],
  ['BDEF_BH.turret.gun.1.dmg', 22], ['BDEF_AX.turret.gun.1.dmg', 55],
  ['BDEF_BH.turret.gun.2.dmg', 26], ['BDEF_BH.turret.gun.3.dmg', 33], ['BDEF_AX.turret.gun.2.dmg', 24], ['BDEF_AX.turret.gun.3.dmg', 120], // their upgrades stay upgrades
  // field nodes worth fighting for
  ['NODE_INC.c', 4], ['NODE_INC.e', 1.5],
  // Last Fist: Riflemen cheaper but lighter-hitting (rush with them, don't win every trade), dearer Heavies and Tanks, Flame
  // Tanks a specialist against infantry (weak against vehicles)
  ['UDEF.rifle.cost', { c: 45, e: 0 }], ['UDEF.rifle.dmg', 6.5], ['UDEF.heavy.cost', { c: 135, e: 40 }], ['UDEF.tank.cost', { c: 280, e: 70 }], ['DMG.flame.vehicle', 0.2],
  // Bloomhost: sturdier Skitterlings and Bulwarks, cheaper Spitters with the reach to answer a ranged line
  ['UDEF.skitterling.hp', 66], ['UDEF.bulwark.hp', 840], ['UDEF.bulwark.dmg', 28], ['UDEF.spitter.cost', { c: 70, e: 20 }], ['UDEF.spitter.range', 165],
] };
const B7_ROOT = () => ({ UDEF, BDEF, BDEF_BH, BDEF_AX, DMG, DIFF, NODE_INC, SALVAGE, YARD, BUNKER, MOUND, ROOT, BEACON, ECHO });
function b7At(path) { const k = path.split('.'), R = B7_ROOT(); let o = R[k[0]]; for (let i = 1; i < k.length - 1; i++) o = o[k[i]]; return [o, k[k.length - 1]]; }
const b7Copy = v => v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v;
function setBalance7b(on) {
  const c7 = typeof BALANCE7C !== 'undefined' && BALANCE7C.on; if (c7) setBalance7c(false, true); // v2.43: the phase 7c layer sits on top; off first, back on after (if wanted)
  if (!BALANCE7B.orig) BALANCE7B.orig = BALANCE7B.patches.map(([p]) => { const [o, k] = b7At(p); return b7Copy(o[k]); });
  BALANCE7B.patches.forEach(([p, v], i) => { const [o, k] = b7At(p); o[k] = b7Copy(on ? v : BALANCE7B.orig[i]); });
  BALANCE7B.on = on;
  b7Texts();
  if (on && typeof BALANCE7C !== 'undefined' && BALANCE7C.want) setBalance7c(true);
}
/* ---------- Polish retune (v2.43, audit phase 7c; audit/polish-report.md) ----------
   Numbers only, on top of v2.42 (BALANCE7B): the retune after the phase 7c mechanics (MECH7C). setBalance7c(false) puts back
   every v2.42 value; setBalance7b(false) and setBalance(false) also take this layer off. Same patch format as BALANCE7B. */
const BALANCE7C = { on: false, want: false, orig: null, patches: [
  // the upgraded HQ guns reach the whole own field node (now 390-530 out): a side that pays for HQ tiers covers its node;
  // T3 hits softer, so a maxed turtle is less of a fortress (the Tech branch)
  ['BDEF.hq.gun.2.range', 530], ['BDEF_AX.hq.gun.2.range', 530], ['BDEF.hq.gun.3.range', 560], ['BDEF_AX.hq.gun.3.range', 560],
  ['BDEF.hq.gun.3.dmg', 54], ['BDEF_AX.hq.gun.3.dmg', 54],
  // the early game a little quicker (a Refinery builds in 12 s, was 13; v2.41: 10)
  ['BDEF.refinery.time', 12], ['BDEF_BH.refinery.time', 12], ['BDEF_AX.refinery.time', 12],
  // Bloomhost: cheaper Skitterlings and Bulwarks (lowest in identical play once its defenders hold at the new rally point)
  ['UDEF.skitterling.cost', { c: 36, e: 0 }], ['UDEF.bulwark.cost', { c: 140, e: 25 }],
  // the Axiarch Tech branch: dearer Rift Mortars and Worldbreakers, a softer Null Lance T3
  ['UDEF.riftmortar.cost', { c: 250, e: 100 }], ['UDEF.worldbreaker.cost', { c: 500, e: 210 }], ['BDEF_AX.turret.gun.3.dmg', 85],
  // Last Fist: a dearer Tank (its Timing branch on top of the mixed field)
  ['UDEF.tank.cost', { c: 290, e: 75 }],
  // Normal answers an infantry rush with a Turret every match (was a 50% roll; Hard always did; Easy never)
  ['DIFF.normal.turret', 1],
] };
function setBalance7c(on, keep) { // keep: switched off only while a lower layer changes (setBalance7b, setBalance)
  if (!keep) BALANCE7C.want = on;
  if (!BALANCE7C.orig) BALANCE7C.orig = BALANCE7C.patches.map(([p]) => { const [o, k] = b7At(p); return b7Copy(o[k]); });
  BALANCE7C.patches.forEach(([p, v], i) => { const [o, k] = b7At(p); o[k] = b7Copy(on ? v : BALANCE7C.orig[i]); });
  BALANCE7C.on = on;
  b7Texts();
}
function b7Texts() {} // v2.45: building texts read the live numbers themselves (the live description block below); nothing to rewrite
/* ---------- Balance pass (v2.39, audit phase 5; audit/balance-report.md) ----------
   Conservative: costs and build times first, then two small stat fixes where controlled duels showed a unit losing at equal
   value. No mechanic changes. Each change and its reason is in the report. setBalance(false) restores every v2.38 value, so
   a match then plays exactly as v2.38 did (the pinned replays in tests/determinism.test.js use it). */
const BALANCE = { on: false, orig: {}, units: {
  tank:       { cost: { c: 260, e: 60 }, time: 13 },  // was 200/40, 11 s: beat every Bloomhost and Axiarch ground unit but the Bastion at equal value
  heavy:      { cost: { c: 125, e: 35 } },            // was 100/25: with Riflemen it out-shot every Bloomhost and Axiarch flyer
  bulwark:    { cost: { c: 150, e: 30 }, time: 10 },  // was 190/40, 11 s: lost to the Tank at equal value and equal supply
  razorwing:  { cost: { c: 140, e: 50 }, hp: 200 },   // was 170/70, 170 HP: lost to Riflemen and Heavies at equal value
  spitter:    { cost: { c: 80, e: 25 } },             // was 90/30
  leaper:     { cost: { c: 80, e: 20 } },             // was 90/20
  shardling:  { cost: { c: 65, e: 15 }, time: 5, shp: 75 }, // was 80/20, 6 s, 60 shields: lost to Riflemen at equal value and supply; 44% of Axiarch spending
  lancer:     { cost: { c: 120, e: 45 } },            // was 150/60
  prismwing:  { cost: { c: 100, e: 40 } },            // was 120/50
  wraithwing: { cost: { c: 230, e: 100 } },           // was 260/120
  bastion:    { cost: { c: 260, e: 85 } },            // was 280/90
}, salvage: 0.07, yard: 0.14 }; // Salvage was 10% (Yard 20%): worth about 4 wins in 40 for Last Fist, 8-16% extra income
function setBalance(on) {
  if (BALANCE7B.on) setBalance7b(false); // v2.42: the phase 7b layer sits on top; off first, back on after
  for (const t in BALANCE.units) {
    const d = UDEF[t], o = BALANCE.orig[t] || (BALANCE.orig[t] = Object.fromEntries(Object.keys(BALANCE.units[t]).map(k => [k, d[k]])));
    for (const k in o) d[k] = on ? BALANCE.units[t][k] : o[k];
  }
  const s0 = BALANCE.orig.salvage || (BALANCE.orig.salvage = [SALVAGE.pct, YARD.pct]);
  SALVAGE.pct = on ? BALANCE.salvage : s0[0]; YARD.pct = on ? BALANCE.yard : s0[1];
  BALANCE.on = on;
  if (on && BALANCE7B.orig) setBalance7b(true); // (v2.43: which puts the phase 7c layer back if it was on) // at load the layer comes on further down, once NODE_INC exists
}
setBalance(true);
const UNIT_ORDER = ['rifle', 'heavy', 'sniper', 'tank', 'artillery', 'titan', 'flame', 'hydra', 'aircraft', 'interceptor', 'leviathan', 'medic', 'drone', 'skitterling', 'mite', 'leaper', 'ravager', 'spitter', 'bilecaster', 'bulwark', 'bilelobber', 'ruinmaw', 'thornback', 'dreadthorn', 'razorwing', 'needlewing', 'cloudwing', 'broodtyrant', 'worldrender', 'shardling', 'riftstalker', 'parallax', 'lancer', 'marksman', 'bastion', 'riftmortar', 'worldbreaker', 'gravemantle', 'eventide', 'wraithwing', 'prismwing', 'shardstorm', 'voidcarrier', 'sovereign'];
// Credits first (Refineries before tech); Reactors are skipped while energy is plentiful
const AI_PLAN = ['barracks', 'refinery', 'refinery', 'reactor', 'habitat', 'factory', 'reactor', 'techlab']; // roles: the same plan builds either faction's base
// Bloomhost units read the personalities' Last Fist tastes (bias) through their counterpart (v2.17)
const AI_TWIN = { skitterling: 'rifle', bulwark: 'tank', razorwing: 'aircraft', leaper: 'rifle', ravager: 'sniper', spitter: 'heavy', bilecaster: 'sniper', bilelobber: 'artillery', ruinmaw: 'titan', thornback: 'flame', dreadthorn: 'hydra', needlewing: 'aircraft', cloudwing: 'aircraft', broodtyrant: 'leviathan', worldrender: 'leviathan', shardling: 'rifle', bastion: 'tank', wraithwing: 'aircraft', riftstalker: 'rifle', parallax: 'sniper', lancer: 'heavy', marksman: 'sniper', riftmortar: 'artillery', worldbreaker: 'titan', gravemantle: 'flame', eventide: 'hydra', prismwing: 'aircraft', shardstorm: 'aircraft', voidcarrier: 'leviathan', sovereign: 'leviathan' }; // v2.25, v2.27: Axiarchs too
// The AI's path choice is made in Last Fist terms and translated (v2.19): Specialists → Acidic, Mass Deployment → Predatory;
// Siege → Siege Evolution, Assault → Predator Evolution; Tech Lab (v2.21): Air Power → Apex Bloom (heavy bombers, like the
// Leviathan), Support → Swarm Bloom
// Axiarchs (v2.27): Specialists → Lattice Doctrine (ranged), Mass Deployment → Riftwalk Doctrine; Siege → Rupture Doctrine,
// Assault → Dominion Doctrine
// v2.29: Air Power → Ascendant Calculus (heavy base-breakers, like Apex Bloom), Support → Swarm Calculus
const AI_PATH_MAP = { bloomhost: { barracks: { A: 'B', B: 'A' }, factory: { A: 'A', B: 'B' }, techlab: { A: 'B', B: 'A' } }, axiarchs: { barracks: { A: 'B', B: 'A' }, factory: { A: 'A', B: 'B' }, techlab: { A: 'B', B: 'A' } } };
const aiPathTo = (fac, type, p) => { const m = AI_PATH_MAP[facOf(fac)]; return m && m[type] ? m[type][p] : p; };
const aiPathFrom = (fac, type, p) => { const m = AI_PATH_MAP[facOf(fac)]; if (!m || !m[type] || !p) return p; for (const k in m[type]) if (m[type][k] === p) return k; return p; };
const ENERGY_PLENTY = 250;
// Signature buildings in the AI's build plan (v2.32, minimal AI): the Aggressor and the Trickster build A, the Turtle and
// the Economist B (Last Fist only until v2.33). Every plan already fills all 8 pads, so the signature building replaces the
// plan's last building whose type appears earlier in the plan (a second Refinery, Reactor, Barracks or Turret); the only
// planned copy of a type is never dropped, so every plan keeps its Tech Lab. Upgraded through AI_UPG like the rest.
function aiPlanWith(plan, sig) {
  if (!sig) return plan;
  const out = plan.slice();
  for (let i = out.length - 1; i > 0; i--) if (out.indexOf(out[i]) < i) { out[i] = sig; return out; }
  return out.concat(sig); // no duplicate to give up (no plan today)
}
