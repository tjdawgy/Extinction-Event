# Unit roster and distinctness review (audit phases 3a and 3b)

**Implemented in v2.37 (phase 3b).** The tables show v2.37 values, read from `UDEF` in index.html; **bold numbers** in the Special column mark each redesign. All the numbers are first-pass placeholders for the balance phase (Phase 5). `setRedesign(false)` in the game code restores every v2.36 value (the tests use it to prove nothing else changed). Section 6 records what was built, item by item, and where it differs from the proposal.

How to read the tables:
- **Cost:** credits/energy.
- **Sup:** supply (army size used).
- **HP:** Axiarch units show health + shields.
- **CD:** seconds between attacks.
- **Rng:** range in world units (the lane is 1,700 long).
- **Spd:** move speed.

---

## 1. Roster

### Last Fist

| Unit | Role | Cost | Sup | HP | Dmg | Rng | CD | Spd | Special |
|---|---|---|---|---|---|---|---|---|---|
| Rifleman | Barracks T1 · basic infantry | 50/0 | 1 | 70 | 7 | 120 | 0.7 | 38 | Hits air. Mass Deployment: trained in pairs (T2), Drilled +35% HP, +10% dmg, faster capture (T3) |
| Heavy | Barracks T2 · Specialists · anti-armor | 100/25 | 2 | 240 | 16 | 130 | 1.3 | 27 | Rockets: 1.6× vs vehicles, 1.3× vs air |
| Sniper | Barracks T3 · Specialists · sniper | 150/60 | 2 | 110 | 60 | 270 | 2.6 | 30 | **P4** Rail round pierces up to 3 more units in a line behind the target (60% of the last each). 1.6× light, 1.4× heavy, 0.35× vehicles, hits air |
| Tank | Factory T1 · main battle tank | 200/40 | 3 | 560 | 42 | 160 | 1.7 | 31 | Splash 26 |
| Artillery | Factory T2 · Siege · artillery | 175/60 | 3 | 150 | 60 (3×20) | 440 | 3.2 | 22 | **P1** Salvo: 3 shells scattered ±30 around the target, landing one after another; splash 40 each. Min range 110, 1.6× buildings |
| Titan | Factory T3 · Siege · siege walker | 420/160 | 6 | 1500 | 75 | 190 (planted 280) | 2.4 | 19 | **P8** Siege lock: fires only when planted (2 s to plant, 1.5 s to unplant, no moving, can't be pulled); planted +90 range and 1.3× vs buildings. Splash 34 |
| Flame Tank | Factory T2 · Assault · anti-infantry | 190/50 | 3 | 520 | 10 | 95 | 0.25 | 34 | Burns a strip 95 long and 48 wide, now centred on its target (v2.36 fix: hits targets off to the side). 1.7× light, 0.35× vehicles, no air |
| Hydra | Factory T3 · Assault · anti-air walker | 360/140 | 5 | 1100 | 22 | 200 (air 240) | 0.3 | 22 | Prefers aircraft (1.5×), 0.4 s to swing its guns between air and ground |
| Gunship | Tech Lab T1 · strike flyer | 225/100 | 3 | 230 | 20 | 140 | 0.8 | 72 | Missiles hit air and ground |
| Interceptor | Tech Lab T2 · Air Power · air superiority | 150/60 | 2 | 190 | 16 | 180 | 0.45 | 100 | Flak hits air only (1.8×), escorts your flyers |
| Leviathan | Tech Lab T3 · Air Power · bomber | 480/240 | 7 | 1400 | 4×35 | 40 | 3.0 | 24 | **P10** Carpet bombing: 4 bombs in a line along the lane, 26 apart, splash 40, 2× buildings; prefers buildings |
| Medicopter | Tech Lab T2 · Support · healer | 160/80 | 2 | 260 | – | – | – | 60 | Heals infantry within 120 by 2.5%/s |
| Recon Drone | Tech Lab T2 · Support · scout | 70/30 | 1 | 80 | – | – | – | 115 | Sight, siege spotter, max 3 |

Faction-wide: **Salvage** (kills near Last Fist forces return credits), **Nanoweave** (Tech Lab Support T3: +20% damage, −15% damage taken).

### Bloomhost

| Unit | Role | Cost | Sup | HP | Dmg | Rng | CD | Spd | Special |
|---|---|---|---|---|---|---|---|---|---|
| Skitterling | Larva Pit T1 · swarm melee | 40/0 | ½ | 60 | 6 | melee | 0.5 | 52 | **S1** Half supply; at most 60 alive or queued per side (shown on the card). Swarm: +15% per other Skitterling on the same target (max +45%) |
| Leaper | Larva Pit T2 · Predatory · hunter | 90/20 | 2 | 150 | 14 | melee | 0.8 | 46 | Leaps 45–140 onto targets (7 s cooldown) |
| Ravager | Larva Pit T3 · Predatory · heavy melee | 160/50 | 3 | 340 | 30 | melee | 1.0 | 44 | **P15** Blood frenzy: a kill frenzies it for 4 s (Frenzy Bloom's +35% attack rate, +30% speed); refreshed, never stacked. Maul: 1.6× light |
| Spitter | Larva Pit T2 · Acidic · ranged infantry | 90/30 | 2 | 110 | 11 | 150 | 1.0 | 34 | Hits air; corrodes (+12% damage taken, 5 s) |
| Bilecaster | Larva Pit T3 · Acidic · long-range marker | 170/70 | 3 | 160 | 26 | 280 | 2.2 | 28 | **P16** Bile dart: one target, no splash, corrodes +20% for 14 s. Range above its sight (230): needs spotters. Ground only |
| Bulwark | Evolution Chamber T1 · melee tank | 190/40 | 3 | 760 | 26 | melee | 1.6 | 24 | Brace: −40% damage for 3 s (12 s cooldown) |
| Bile Lobber | Evolution Chamber T2 · Siege · artillery | 170/60 | 3 | 160 | 40 | 420 | 3.4 | 22 | **P2** Softening bile: splash 55 that corrodes everything it hits (+15% for 3 s). Min range 110, scatter, 1.6× buildings |
| Ruinmaw | Evolution Chamber T3 · Siege · heavy siege | 400/150 | 6 | 1300 | 70 | 200 | 2.8 | 18 | Splash 34, leaves acid pools (12 dps, 4 s), 1.7× buildings |
| Thornback | Evolution Chamber T2 · Predator · brawler | 180/40 | 3 | 700 | 22 | melee | 1.1 | 28 | Thorns: melee attackers within 60 take 20% back |
| Dreadthorn | Evolution Chamber T3 · Predator · brawler | 380/140 | 5 | 1350 | 34 | melee | 1.2 | 24 | A hit of 60+ fires a spine burst (radius 80, 45 dmg, 15 s cooldown) |
| Razorwing | Bloomspire T1 · melee flyer | 170/70 | 2 | 170 | 15 | 50 | 0.75 | 95 | Hits air and ground |
| Needlewing | Bloomspire T2 · Swarm · swarm flyer | 70/30 | 1 | 80 | 8 | 40 | 0.6 | 115 | Swarm bonus (max +36%), ground only |
| Cloudwing | Bloomspire T3 · Swarm · brood flyer | 220/100 | 3 | 280 | 14 | 45 | 0.6 | 85 | Swarm bonus; spawns 2 offspring every 14 s (12 s life) |
| Brood Tyrant | Bloomspire T2 · Apex · heavy flyer | 320/150 | 5 | 950 | 60 | 150 | 2.4 | 40 | Glob, splash 24, prefers buildings |
| Worldrender | Bloomspire T3 · Apex · bomber | 520/260 | 8 | 1700 | 170 | 50 | 4.0 | 20 | **P11** Devour: heals 30% of the damage its drop does to buildings, at most 40 HP/s. Drop, splash 70, 2.1× buildings, prefers buildings |
| Mite | Brood Mound spawn | free | 0 | 24 | 2.4 | melee | 0.5 | 62 | 30 s life, max 10; T3: bursts into acid on death |

Faction-wide:
- **Creep:** speed and regeneration for Bloomhost units on it.
- **Corrosion:** units take more damage. Since v2.37 the strongest running effect applies, capped at 25%; a weaker one that lasts longer takes over when it ends. Nothing adds up.
- **Abilities:** Frenzy Bloom, Emergency Brood, Corrosive Bloom.

### Axiarchs

| Unit | Role | Cost | Sup | HP+sh | Dmg | Rng | CD | Spd | Special |
|---|---|---|---|---|---|---|---|---|---|
| Shardling | Genesis Gate T1 · melee core | 80/20 | 2 | 80+60 | 11 | melee | 0.6 | 50 | Shields regenerate |
| Riftstalker | Genesis Gate T2 · Riftwalk · hunter | 140/50 | 3 | 170+110 | 18 | melee | 0.8 | 48 | **P5** Hit and fade: phase-steps 45–130 onto a target (8 s cooldown), strikes once, then steps back to where it leapt from. 1.5× light |
| Parallax | Genesis Gate T3 · Riftwalk · assassin | 220/90 | 4 | 260+180 | 30 | melee | 0.9 | 46 | Steps behind its target; hits disrupt (−30% damage dealt, 2 s) |
| Lancer | Genesis Gate T2 · Lattice · ranged infantry | 150/60 | 3 | 150+110 | 16 | 170 | 0.9 | 32 | **P14** Focus: +15% per consecutive hit on the same target, up to +60%; a new target starts over. Hits air (1.2×) |
| Astral Marksman | Genesis Gate T3 · Lattice · sniper | 240/110 | 4 | 140+120 | 85 | 330 | 3.0 | 28 | 1.2 s visible charge on the same target before each shot |
| Bastion | Architectum T1 · shield tank | 280/90 | 4 | 620+420 | 36 | 100 | 1.6 | 23 | **P6** Shield surge (replaces its brace): the first hit after a 12 s cooldown starts 3 s of shield recharge at 35% of max per second, even under fire |
| Rift Mortar | Architectum T2 · Rupture · artillery | 220/90 | 4 | 160+120 | 100 | 430 | 3.3 | 21 | **P3** Precision strike: no scatter, splash 20, crosshair landing marker. Min range 110, 1.6× buildings |
| Worldbreaker | Architectum T3 · Rupture · heavy siege | 460/190 | 7 | 1150+650 | 80 | 210 | 2.8 | 17 | **P7** Distortion zones (radius 40, 4 s) disrupt enemy units inside (−30% damage dealt) instead of burning. Splash 34, 1.7× buildings |
| Gravemantle | Architectum T2 · Dominion · control | 230/100 | 4 | 520+380 | 14 | 120 | 1.2 | 24 | Aura slows enemy ground within 110 by 30% |
| Eventide | Architectum T3 · Dominion · control | 420/180 | 6 | 1000+650 | 24 | 140 | 1.3 | 20 | Pulse pulls enemies within 130 inward by 40 (14 s cooldown) |
| Wraithwing | Celestial Array T1 · evasive flyer | 260/120 | 3 | 160+140 | 20 | 140 | 0.8 | 86 | **P13** Phase shift: when hit, phases out for 1 s (untouchable, untargetable, holds still, can't fire); 8 s cooldown before it can again. Hits air and ground |
| Prismwing | Celestial Array T2 · Swarm · cheap flyer | 120/50 | 2 | 100+90 | 11 | 120 | 0.7 | 100 | Shares 50% of shield damage with up to 3 nearby Prismwings |
| Shardstorm | Celestial Array T3 · Swarm · chain flyer | 280/130 | 4 | 220+190 | 24 | 160 | 1.1 | 80 | Instant beam, chains to 3 more (−30% each jump), air and ground |
| Voidcarrier | Celestial Array T2 · Ascendant · flying power node | 360/170 | 6 | 900+520 | 50 | 170 | 2.8 | 34 | **P9** Carries a power field (radius 120) that moves with it: field shield recharge, and the default warp point moves to it when it is frontmost. Collapses when it dies. Splash 24 |
| Astral Sovereign | Celestial Array T3 · Ascendant · bomber | 600/300 | 9 | 1500+900 | 260 | 50 | 4.2 + 2 charge | 17 | **P12** Judgement beam: a visible 2 s charge, then one beam at one target, no splash; 2.1× buildings, prefers buildings |

Faction-wide:
- **Shields:** regenerate after 4 s without damage.
- **Power field:** faster shield regeneration, and warp-in.
- **Abilities:** Mass Warp, Shield Overcharge, Purification Beam.

---

## 2. Flagged groups (units that play too alike)

Judged on how each unit plays and how you beat it.

| # | Units | Why they're too alike |
|---|---|---|
| A | Artillery / Bile Lobber / Rift Mortar | Same unit three times: ~430 range, 110 min range, 55 splash, ~3.3 s, scatter, 1.6× buildings. Same counter (dive it) |
| B | Sniper / Astral Marksman | Both long-range light-killers firing one big shot. The Marksman's charge helps, but both are countered the same way |
| C | Leaper / Riftstalker | Both melee hunters leaping ~45–140 onto backline units, both 1.1–1.5× vs light |
| D | Bulwark / Bastion | Identical brace numbers (−40%, 3 s, 12 s). The Bastion is a Bulwark with a 100-range gun |
| E | Ruinmaw / Worldbreaker / (Titan) | Slow T3 siege, ~200 range, splash 34. Distortion zones are acid pools in violet (same damage, cap and life). The Titan is the same minus zones |
| F | Brood Tyrant / Voidcarrier | Heavy flyers that prefer buildings, 150–170 range, splash 24, 60–72 per shot |
| G | Leviathan / Worldrender / Astral Sovereign | Huge bombers: drop, splash 60–75, ~2× buildings, prefer buildings, 7–9 supply. Same use (fly at the base), same counter (anti-air) |
| H | Gunship / Wraithwing | Identical numbers: 20 dmg, 0.8 s, 140 range, hits air and ground |
| I | Lancer vs Spitter / Heavy / Rifleman | The Lancer is a plain ranged trooper with no mechanic; Spitter corrodes, Heavy kills armor, Rifleman is cheap |
| J | Ravager vs Riftstalker | Both anti-light melee, and the Ravager has no mechanic at all |
| K | Bilecaster vs Spitter | Same path, both ranged corroders; Bloomhost has no long-range precision unit |

**Already distinct (leave alone):**
- **Last Fist:** Rifleman, Heavy, Tank, Flame Tank, Hydra, Gunship, Interceptor, Medicopter, Recon Drone
- **Bloomhost:** Skitterling, Leaper, Spitter, Bulwark, Ruinmaw, Thornback, Dreadthorn, Razorwing, Needlewing, Cloudwing, Brood Tyrant, Mite
- **Axiarchs:** Shardling, Parallax, Astral Marksman, Gravemantle, Eventide, Prismwing, Shardstorm

Where one side of a pair keeps its identity, only the other side is redesigned. Pair C, for example: the Leaper stays as is (pounce and stay), and only the Riftstalker changes (P5).

Borderline, left alone:
- **Thornback vs Dreadthorn:** both punish attackers, but in different ways: thorns punish melee, the burst punishes big hits.
- **Needlewing vs Cloudwing:** both swarm; the Cloudwing breeds.
- **Shardling vs Skitterling:** both cheap melee, but shields vs swarm bonus are beaten differently. Burst beats the Shardling's regeneration, splash beats the Skitterling swarm.

**Role coverage after the proposals:**

| Role | Last Fist | Bloomhost | Axiarchs |
|---|---|---|---|
| Artillery | Factory T2 · Siege · artillery | 175/60 | 3 | 150 | 60 (3×20) | 440 | 3.2 | 22 | **P1** Salvo: 3 shells scattered ±30 around the target, landing one after another; splash 40 each. Min range 110, 1.6× buildings |
| Sniper | Barracks T3 · Specialists · sniper | 150/60 | 2 | 110 | 60 | 270 | 2.6 | 30 | **P4** Rail round pierces up to 3 more units in a line behind the target (60% of the last each). 1.6× light, 1.4× heavy, 0.35× vehicles, hits air |
| Hunter | – | Leaper (kept) | hit-and-run (P5) |
| Tank | Tank (kept) | Bulwark (kept) | shield surge (P6) |
| Heavy siege | unstoppable (P8) | acid pools (kept) | disruption zones (P7) |
| Heavy flyer | Gunship (kept) | Brood Tyrant (kept) | power-field carrier (P9) |
| Bomber | carpet bombing (P10) | devour (P11) | judgement beam (P12) |

---

## 3. Proposals

The proposals as reviewed in phase 3a. Section 6 records what was built; where the decision changed a proposal (P2, P8, P11, P13, P15, P16), section 6 wins.

Each proposal changes one core mechanic. Proposals marked **[new system]** need something the game doesn't have yet; the rest reuse existing code. Numbers are rough intent only.

### P1 · Artillery (Last Fist) · Salvo barrage
- **Change:** each shot is 3 shells in a tight rapid salvo, scattered around the target, each a third of the damage.
- **Feel:** industrial saturation fire; reliable against clumps and buildings.
- **Strong vs:** blobs, dug-in turrets, bases.
- **Weak vs:** single fast targets (shells land wide), divers.
- **Counter:** spread out, dive it.
- **Systems:** existing (fires 3 projectiles; the Null Lance already fires several per shot).

### P2 · Bile Lobber (Bloomhost) · Softening bile
- **Change:** its splash corrodes everything it hits; impact damage drops.
- **Feel:** attrition. It doesn't kill much alone, but everything it touches takes more damage from the swarm.
- **Strong vs:** armies holding a line, turrets (hits stacked with the swarm).
- **Weak vs:** buildings alone, killing on its own.
- **Counter:** dive it, or fight away from its zone.
- **Systems:** existing (the Bilecaster's splash already corrodes).

### P3 · Rift Mortar (Axiarchs) · Precision strike
- **Change:** no scatter, splash cut from 55 to ~20, much higher damage per hit.
- **Feel:** elite precision: one exact, heavy blow that deletes one target.
- **Strong vs:** single high-value units (Titans, Artillery, Leviathans), buildings.
- **Weak vs:** swarms (barely any splash).
- **Counter:** mass cheap units, dive it.
- **Systems:** existing (parameters only).

### P4 · Sniper (Last Fist) · Piercing round
- **Change:** the rail round passes through its target and hits every enemy in a line behind it, losing damage per target.
- **Feel:** brute anti-materiel rifle.
- **Strong vs:** columns and blobs, Skitterling swarms lined up in the lane.
- **Weak vs:** spread-out units, armor (stays 0.35× vs vehicles).
- **Counter:** spread out, close the distance.
- **Systems:** small new code (a line hit test, reusing the Flame Tank's strip check).
- **The Astral Marksman stays as is:** its charge-then-one-huge-hit is a real identity once the Sniper pierces.

### P5 · Riftstalker (Axiarchs) · Hit and fade
- **Change:** after landing its strike it phase-steps back to where it leapt from.
- **Feel:** elite skirmisher: strike, retreat, let its shields regenerate (they need 4 s without damage), strike again.
- **Strong vs:** backline units without escorts.
- **Weak vs:** a sustained fight (it keeps leaving), burst on landing.
- **Counter:** guard the backline, burst it when it lands.
- **Systems:** existing (the leap code with the start point as the second landing spot) plus a small timer.
- **The Leaper stays as is:** it commits and stays to brawl.

### P6 · Bastion (Axiarchs) · Shield surge
- **Change:** its brace no longer cuts damage. Instead it rapidly recharges shields (much faster than the power field) for 3 s, even under fire.
- **Feel:** shield-tank. It soaks with shields, while the Bulwark soaks with flesh.
- **Strong vs:** chip damage, long fights.
- **Weak vs:** burst that goes through shields into health, Corrosion.
- **Counter:** focus it outside the surge, hit health directly.
- **Systems:** existing (shield regeneration code; Shield Overcharge already does this as an ability).

### P7 · Worldbreaker (Axiarchs) · Disruption zones
- **Change:** its zones stop burning. Enemy units standing in them deal −30% damage (the Parallax's disrupt).
- **Feel:** control, not attrition. It breaks the enemy's firing line.
- **Strong vs:** armies dug in at a point, turret clusters. If wanted, the effect could also apply to buildings.
- **Weak vs:** mobile armies that step out, damage on its own.
- **Counter:** reposition, then fight outside the zones.
- **Systems:** existing (disrupt status, zone list); small change in `updateAcid`.
- **The Ruinmaw keeps its acid pools.**

### P8 · Titan (Last Fist) · Unstoppable (replaced by Siege lock: see section 6)
- **Change:** immune to slow, snare, pull and disrupt (Gravemantle, Eventide, Rootheart, Parallax, P7 zones).
- **Feel:** industrial reliability: the walker always arrives.
- **Strong vs:** Axiarch control units, Rootheart snares.
- **Weak vs:** raw damage (no new defence).
- **Counter:** kill it the hard way: Heavies, Hydras, focus fire.
- **Systems:** existing (one flag checked in `slowU`, `disrupt`, the snare and the pull).

### P9 · Voidcarrier (Axiarchs) · Flying power node
- **Change:** it carries a small power field around itself. Axiarch units under it get field shield regeneration, and you can warp in under it. Its own damage drops.
- **Feel:** the power network goes on the offensive.
- **Strong vs:** long sieges; reinforcing at the front.
- **Weak vs:** anti-air (killing it collapses the field), damage on its own.
- **Counter:** hunt it with anti-air before warp-ins arrive.
- **Systems:** **[new system, moderate]** a power-field source that moves with a unit (the Phase Beacon's moving bubble is the template). The AI's warp-point choice must learn about it: minimum AI change.

### P10 · Leviathan (Last Fist) · Carpet bombing
- **Change:** it drops a line of 3–4 smaller bombs along its path instead of one big drop.
- **Feel:** brute force over an area.
- **Strong vs:** bases with buildings in a row, clumped defences.
- **Weak vs:** a single hardened target (bombs spread).
- **Counter:** anti-air, Interceptors.
- **Systems:** existing (several drop projectiles per attack).

### P11 · Worldrender (Bloomhost) · Devour
- **Change:** it heals for a share of the damage it deals to buildings.
- **Feel:** attrition. The longer it feeds, the harder it is to kill.
- **Strong vs:** long sieges against undefended bases.
- **Weak vs:** burst anti-air early, before it starts feeding.
- **Counter:** anti-air on arrival, keep it off buildings.
- **Systems:** small new code (lifesteal on hit).

### P12 · Astral Sovereign (Axiarchs) · Judgement beam
- **Change:** it charges for ~2 s (visible, like the Marksman), then fires one beam straight down for heavy single-target damage, with no splash.
- **Feel:** precision. It deletes one building at a time.
- **Strong vs:** the HQ and key buildings (Tech Lab, Turret).
- **Weak vs:** spread-out bases, units (no splash), interruptions.
- **Counter:** anti-air during the charge.
- **Systems:** existing (the Marksman's charge; the beam fire path).

### P13 · Wraithwing (Axiarchs) · Phase shift
- **Change:** when hit, it phases out for ~1 s (untargetable, can't fire), then needs time before it can phase again.
- **Feel:** elite evasive flyer.
- **Strong vs:** slow single-shot anti-air: Snipers, Heavies' rockets, HQ guns.
- **Weak vs:** rapid fire (Interceptors, Hydras, Gatling Turrets) that hits it again after the cooldown.
- **Counter:** fast-firing anti-air.
- **Systems:** **[new system, small]** an "untargetable" state: target selection skips it, and shots already in the air miss.
- **The Gunship stays as is.**

### P14 · Lancer (Axiarchs) · Focus beam
- **Change:** each consecutive hit on the same target deals more damage, up to a cap; switching target resets it.
- **Feel:** precision focus fire.
- **Strong vs:** tanky single targets.
- **Weak vs:** swarms (it keeps resetting), target swapping.
- **Counter:** swarm it, or rotate damaged units out.
- **Systems:** small new code (the same "same target" tracking the Marksman's charge uses).

### P15 · Ravager (Bloomhost) · Blood frenzy
- **Change:** each kill frenzies it (the Frenzy Bloom effect: faster attacks and movement) for a few seconds.
- **Feel:** a swarm predator that snowballs through light units.
- **Strong vs:** infantry blobs, Mass Deployment Riflemen.
- **Weak vs:** a few tough targets (no kills, no frenzy).
- **Counter:** armor, Flame Tanks.
- **Systems:** existing (frenzy timer); a small hook on kills.

### P16 · Bilecaster (Bloomhost) · Bile dart
- **Change:** it becomes Bloomhost's long-range unit: a longer-range single-target shot (no splash) whose corrosion lasts much longer.
- **Feel:** attrition sniper. It marks targets for the swarm.
- **Strong vs:** high-value targets before an engagement.
- **Weak vs:** swarms (single target), killing alone (low damage).
- **Counter:** dive it, kill marked units' attackers.
- **Systems:** existing (corrosion; parameter changes).

---

## 4. Supply review

### Measured
These are `tests/perf.js battle` runs at 858×396, 2× pixels, auto quality, both sides fielding the army. They are single runs, not repeated.

| Units on the field | 1× CPU script/frame | 4× CPU script/frame |
|---|---|---|
| ~93 (Phase 2 mixed battle) | 5.1 ms | 33–37 ms |
| 164 (60 Skitterlings, 20 Riflemen, 4 Tanks per side) | 6.3 ms | 40.7 ms |
| 281 (120 Skitterlings per side) | 12.9 ms (p95 19.5) | 80.2 ms |

A 60 fps frame has 16.7 ms. Cost grows faster than unit count, because each unit scans every enemy each tick (`acquire`, twice for melee chasers). At ~280 units even a fast phone misses frames.

### S1 · Skitterling at half supply
- **For:** fits the swarm identity; their swarm bonus needs numbers.
- **Risk:** a full Bloomhost army becomes 160 Skitterlings, with 200–250 units on the field against a normal enemy army. By the table that's ~9–11 ms at 1× and 55–65 ms at 4×, so slower iPhones would drop frames in late-game fights. Mites (up to 10), Emergency Brood (8) and Cloudwing offspring add to it.
- **Recommendation:** approve only with one of these:
  - (a) a total cap on Skitterlings per side, for example 60; or
  - (b) Skitterlings trained in pairs at 1 supply per pair (like Mass Deployment), but each pair counts as two units against a unit cap.

  Re-measure before shipping. A cheaper target scan (`acquire`) would also help, but that's performance work, not this phase.

### S2 · Needlewing at half supply
- **Not recommended.** Same count risk in the air, and each flyer already costs only 1 supply at 70/30.

### S3 · Other supply changes worth testing in the audit (no change proposed now)
- **Leviathan (7), Worldrender (8), Astral Sovereign (9):** the AI almost never fits a 7-supply unit (KNOWN_ISSUES "Leviathan almost never trained"). Check after P10–P12, since their roles change.
- **Axiarch infantry at 2–4 supply:** this is intended (elite, small armies). Leave it.
- **Mites at 0 supply** are capped at 10. Fine.

### S4 · Performance guard for any supply change
Any change that raises unit counts should come with a perf run at 250+ units. A per-side unit cap might also be needed, separate from supply.

---

## 5. Summary for approval (phase 3a)
- **Redesigns:** P1–P16, one mechanic each.
- **Need new systems:**
  - P9: a flying power field (moderate)
  - P13: an untargetable state (small)
  - P4, P11, P14: small new code
- **Everything else** reuses existing systems.
- **Supply:** S1 needs a cap or pairing; S2 is not recommended; S3 and S4 are notes for the audit.


---

## 6. Implementation record (v2.37, audit phase 3b)

Each item was approved in phase 3b and implemented as below. Every mechanic has a visual, and a sound where one fits. Numbers are placeholders for Phase 5.

### Targeting optimization (before S1)
- Each tick, both hostile lists are indexed: units sorted by lane position, buildings kept apart. A target search looks only at units whose position could be in reach; every check is exact and ties keep the old order. Melee units' chase search runs only when nothing is in weapon range, as before.
- **Match results are identical:** every replay and fingerprint test passed unchanged after this step, before any mechanic changed.
- **Performance:** see PERF below.

### P1 · Artillery · Salvo barrage · done
- Three shells per shot, a third of the damage each, scattered ±30 around the target and landing 0.12 s apart.
- **Splash:** 40 each (was one shell, splash 55).
- **Visual and sound:** three arcing shells, each with its own landing ring and impact.

### P2 + P16 · Bloomhost corroders · done, with the change asked for
- **Bile Lobber:** short area corrosion. Its splash corrodes everything it hits (+15% for 3 s); impact damage 55 → 40.
- **Bilecaster:** long single-target corrosion. One target, no splash, range 220 → 280 (beyond its 230 sight, so it needs spotters like Snipers), corrosion +20% for 14 s.
- **Spitter:** unchanged (+12% for 5 s, hits air).
- **Corrosion rule:**
  - The strongest running effect applies, capped at 25%. A weaker one that outlasts it is kept in a second slot and takes over when the strongest ends.
  - Nothing adds up. Before v2.37 a strong short hit plus a weak long one became strong *and* long; that is fixed.
- **Visual:** the existing acid ring and drips, now shown for either slot.

### P3 · Rift Mortar · Precision strike · done
- No scatter, splash 55 → 20, damage 60 → 100.
- **Visual:** a tight violet landing ring with a crosshair.

### P4 · Sniper · Piercing round · done
- After hitting its target, the round hits up to 3 more enemy units within 12 of the line, up to 150 beyond the target, nearest first, each taking 60% of the last.
- **Visual:** a white-hot line through the target that fades.

### P5 · Riftstalker · Hit and fade · done
- It leaps as before. After its first strike it phase-steps back to where it leapt from; the leap cooldown applies as usual.
- **Visual and sound:** a violet ring where it vanishes, and a rising chirp.

### P6 · Bastion · Shield surge · done
- Its brace is gone (the Bulwark keeps its own). The first hit after a 12 s cooldown starts a 3 s surge: shields recharge at 35% of max per second, even under fire.
- **Visual and sound:** a bright cyan shell with rising bands, plus the shield-up sound.

### P7 · Worldbreaker · Disruption zones · done
- Its zones (radius 40, 4 s) no longer burn. Enemy units inside are disrupted: they deal 30% less while in the zone, the same status as the Parallax's blows, capped at 30% overall.
- **Visual:** the existing violet ripple, and the disrupt marks over affected units.
- The Ruinmaw's acid pools are unchanged.

### P8 · Titan · Siege lock · done (replaces Unstoppable)
- It fires only when planted. Planting takes 2 s and unplanting 1.5 s; it can't fire during either.
- **Planted:**
  - it can't move and can't be pulled by an Eventide;
  - its reach grows 190 → 280;
  - it hits buildings 1.3× harder.
- **Automatic behaviour:**
  - plants as soon as a visible enemy is within planted reach, on any stance except Retreat and Regroup;
  - unplants when ordered to Retreat or Regroup, or after 4 s with nothing in reach.
- **Planted reach vs sight:** 280 is beyond the Titan's 240 sight, so it uses its full reach only with a spotter, like Artillery.
- **Visual:** four stabiliser legs swing out and drive into the ground, with a yellow progress arc while planting or unplanting. Once locked, a dashed team-coloured ring and lock lights.
- **Sound:** hydraulics and a clank.
- **Player and AI:** both get it automatically. The AI needed no code change: its own pushes and retreats plant and unplant its Titans. A test runs AI-vs-AI play with Titans and checks all four states and that they fire.

### P9 · Voidcarrier · Flying power node · done
- It carries a power field (radius 120) that grows like a node's field and moves with it. Inside it, Axiarch shields recharge at the field rate, and warp-ins can land there.
- **Warp-ins:** the default warp point sits at the front edge of the frontmost field patch, so a Voidcarrier at the front pulls warp-ins to it, for the AI too, with no AI change.
- **When it dies:** the field collapses at once, with the Phase Beacon's shatter.
- **Damage:** 72 → 50.
- **Size of the change:** a moderate change (one new field source reusing the zone code), well within the "moderate" limit. It did not break the warp logic: a chosen warp point that falls outside every field still snaps back, and an arrival spot that's no longer valid still falls back to the nearest valid spot or the Axis.

### P10 · Leviathan · Carpet bombing · done
- Four bombs of 35 (was one of 140) in a line along the lane, 26 apart, centred on the target, splash 40 (was 60), 2× buildings as before.
- **Visual:** four bombs falling and four blasts.

### P11 · Worldrender · Devour · done, with the cap asked for
- Heals 30% of the damage its drop does to buildings, at most 40 HP per second (a running budget).
- **Visual and sound:** green motes stream from the building into it with "+N", and a feeding sound.

### P12 · Astral Sovereign · Judgement beam · done
- A visible 2 s charge (the Marksman's charge line and lens light), then one instant beam at one target, no splash. Damage 190 → 260, 2.1× buildings.
- **Visual:** the heavy violet and cyan beam the Axis uses, wider.

### P13 · Wraithwing · Phase shift · done, with the cooldown asked for
- **When hit:** it phases out for 1 s. During that second it can't be damaged or targeted, holds still and can't fire.
- **No chaining:** it can't phase again for 8 s after the phase ends.
- **Visual and sound:** a faint flickering violet ghost, and a phase-out sound.

### P14 · Lancer · Focus beam · done
- +15% damage per consecutive hit on the same target, up to +60% (4 stacks); a new target starts over.
- **Visual:** the bolt grows longer and thicker with each stack.

### P15 · Ravager · Blood frenzy · done, refreshed and never stacked
- Any kill it lands frenzies it for 4 s (Frenzy Bloom's faster attacks and movement). Another kill resets the timer to 4 s; it never adds up.
- **Visual:** Frenzy Bloom's pink glow.

### S1 · Skitterling · half supply, limit 60 · done
- **Half supply:** ½ supply each. The army counter and card costs show halves.
- **Limit:** at most 60 alive or queued per side, counting Emergency Brood ones while they live. The Train card shows the count ("41/60", red at the limit), and training at the limit says why.
- **AI:** skips Skitterlings at the limit (a minimum change). Without it, the AI could pick a capped Skitterling, fail and stop training for that tick.
- **Performance:** see PERF below.

### S2 · rejected · Needlewings unchanged. S3 · deferred to Phase 5. S4 · standing rule
Any unit-count increase gets a 250+ unit performance run; the S1 run is below.

### PERF
PERF_TABLE
