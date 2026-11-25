# Balance audit (batch 6a, v2.91): where balance stands after the faction rework

Measurement only. Nothing in the game changed: index.html is byte-identical to v2.91 (commit 2f53aaa), every REWORK switch is
at its default (on) unless a measurement says otherwise. Scripts and logs are under audit/ so every number here can be
re-run after tuning (section 6).

## 1. Open balance flags (inventory)

Every open balance item from KNOWN_ISSUES.md (each rework batch's "Open" list, the Watch list, the faction summaries) and
docs/FACTION_REWORK.md (batch notes and Watch list), duplicates merged. "M" says where this audit measures it (S = the
90-match self-play, section 2; R = a Test Range or scripted measurement, section 3).

| # | Flag | Source | M |
|---|------|--------|---|
| F1 | Artillery has both a 2 s deploy / 1.5 s pack (`artDeploy`) and telegraphed shells (`artTelegraph`, a marker at least 1.6 s before landing): two nerfs stacked on one unit | 2a (v2.82), FACTION_REWORK batch 2 | R7, S |
| F2 | The Severance aims at a group's centre with no lead: a marching column walks out of the orb; AI orbs land mostly on fights | 2a | S |
| F3 | Bloomhost lost its only long-range unit (Bile Lobber → Gorebore); "expect it to need the most attention" | 2a, Watch list | S |
| F4 | The Titan's reach dropped from 190 (280 planted: P8's siege lock +90) to 160 (breach plant within 100 of a building) | 2b (v2.83) | R6 |
| F5 | Titan cover (Last Fist infantry within 70 take 30% less from non-melee) makes infantry blobs with a Titan much tougher against Bloomhost and Axiarch ranged units | 2b | R6 |
| F6 | AI Ruinmaws dive into bases beside economy buildings and can die there with a full tunnel | 2b | S |
| F7 | The Leaper now hard-counters vehicles (latched: 10/s per Leaper, host 30% slower; Tanks and Titans lose 10-30 HP/s) | 3a (v2.84) | R5 |
| F8 | Hatched Skitterlings (a Leaper host dying) count toward the 60 Skitterling limit | 3a | (not measured) |
| F9 | AI Riftstalkers are rare (13 in 54 matches) and their blink home never happened in self-play | 3a, 3b | S |
| F10 | The Bastion's barrier (600 HP, 70 ahead, 90 wide) makes ranged armies (Marines, Heavies, Spitters, Lancers) much weaker against an Axiarch front; Artillery correspondingly stronger | 3b (v2.85) | R4 |
| F11 | The Shardling parry (every 4 s the next hit negated, 2× counter in melee) makes Shardlings much stronger early; an all-Shardling rush wins early (the Default Aggressor beat the Last Fist Turtle near 5:00 in 2 of 3 seeds) | 3b, tests/slow/ai-stats | R3 |
| F12 | The parry makes Skitterling swarms weak against Shardlings | 3b | R3 (indirectly), S |
| F13 | AI Dreadthorns are rare (the Bloomhost AI takes Burrowing Evolution): 2 in 54 natural matches | 3b | S |
| F14 | The Marksman's mark (+25%) counts every damage source of the marking side (buildings and abilities too); the AI marks often | 4a (v2.86) | S |
| F15 | The Wraithwing: splash never hits aircraft and its hops make non-specialist anti-air lose it; its only design counters are chain beams, instant beams and the anti-air specialists | 4a, Part 0 | S |
| F16 | The Bilecaster's 150 range is short against Marines and Lancers holding at range | 4a | S |
| F17 | The Gunship's 4 × 22 salvo then 3.4 s pause: about the old damage per second, front-loaded | 4a | S |
| F18 | The Leviathan's bombing runs: about a quarter of P10's damage per second against one target; its runs carry it 120 past the target, over defences | 4b (v2.87) | R1, S |
| F19 | The Astral Sovereign's judgement beam keeps P12's ×2.1 against buildings: 546 per shot | 4b | R2, S |
| F20 | Brood Tyrant pustules on a building the enemy never repairs add 18/s each building; a fall bursts them into Mites inside the base | 4b | S |
| F21 | A landed Worldrender below 35% takes off and never re-lands until healed | 4b | (not measured) |
| F22 | The Voidcarrier as pure support may feel dull | 4b, Watch list | S |
| F23 | Broods are cheap per health: 4 × 50 HP for 120 (v2.87: one at 40-60 HP for 60), and the AI fills its 60 Skitterlings fast (peak 46 units alive on Classic) | 5b (v2.88) | S |
| F24 | Swarm surge + creep + Frenzy Bloom make a Skitterling very fast (52 × 1.4 × creep × 1.3) | 5b | R8 |
| F25 | The Spitter is a big step up in anti-air (volleys, 15/s, 1.5× to aircraft, tracks hopping Wraithwings) | 5b | R9 |
| F26 | Kill frenzy chains through a big fight, so most of a swarm stays in frenzy | 5b | S (indirectly) |
| F27 | AI games rarely reach tier 3 air; the Bloomspire never reached T2 in 14 of 48 Bloomhost matches (5c), so Needlewings rarely meet aircraft | 5b, 5c, Audit (Leviathan almost never trained), faction summaries (production T3 rarely reached) | S |
| F28 | With b5c on the Bloomhost AI leans Swarm Bloom (75%) against every Last Fist enemy, even one that never flies | 5c (v2.90) | S |
| F29 | Axiarch control stacking (exile, walls, the Parallax swap) must not leave the opponent unable to play | Watch list | (not measured: needs playtest) |
| F30 | Hydra under 1% of units trained; Recon Drones lost and retrained (pre-rework Audit list) | Audit (v2.14-v2.15) | S |

Pre-rework items that the rework replaced (the Bile Lobber, the Rift Mortar, the old Leviathan and Sovereign, the
Riftstalker fade, the old Bastion surge) are left out; the pre-rework faction win shares (KNOWN_ISSUES "Audit baseline",
phases 5-7c) are superseded by section 2.

## 2. Self-play: 90 Hard vs Hard matches

All six faction pairings in both side orders, on Classic, Two-Lane and Three-Lane, seeds 7-11 (audit/sim/audit6a.js, stepped at the game's TICK of 1/60 s to the end or 1,700 s; tables from audit/sim/audit6a-report.js).

90 matches, 0 errors; version 2.91; every REWORK switch on: true.

### 2.1 Win rates

| faction | W-L-D (all 60 of its matches) | win rate | of decided |
|---|---|---|---|
| Last Fist | 29-26-5 | 48% | 53% |
| Bloomhost | 27-26-7 | 45% | 51% |
| Axiarchs | 25-29-6 | 42% | 46% |

Per pairing (wins for the first-named faction - wins for the second - draws), per map and in total (10 matches per map: 5 seeds × both sides):

| pairing | Classic | Two-Lane | Three-Lane | total (30) |
|---|---|---|---|---|
| Last Fist vs Bloomhost | 6-3-1 | 3-6-1 | 5-4-1 | 14-13-3 |
| Last Fist vs Axiarchs | 6-4-0 | 3-5-2 | 6-4-0 | 15-13-2 |
| Bloomhost vs Axiarchs | 7-2-1 | 3-5-2 | 4-5-1 | 14-12-4 |

| faction | classic W-L-D | twolane W-L-D | threelane W-L-D |
|---|---|---|---|
| Last Fist | 12-7-1 | 6-11-3 | 11-8-1 |
| Bloomhost | 10-8-2 | 9-8-3 | 8-10-2 |
| Axiarchs | 6-13-1 | 10-6-4 | 9-10-1 |

Side: side 0 (the player's slot, left/bottom start) won 26, side 1 won 55, 9 draws.

| map | side 0 wins | side 1 wins | draws |
|---|---|---|---|
| classic | 13 | 15 | 2 |
| twolane | 6 | 19 | 5 |
| threelane | 7 | 21 | 2 |

| faction | as side 0 W-L-D | as side 1 W-L-D |
|---|---|---|
| Last Fist | 11-18-1 | 18-8-4 |
| Bloomhost | 9-17-4 | 18-9-3 |
| Axiarchs | 6-20-4 | 19-9-2 |

How matches ended: hq 81, draw 9.

### 2.2 Match length

| set | matches | median | range | under 5:00 | 20:00 or more |
|---|---|---|---|---|---|
| classic | 30 | 12:31 | 4:04 - 22:23 | 2 | 4 |
| twolane | 30 | 14:28 | 7:16 - 22:52 | 0 | 8 |
| threelane | 30 | 15:30 | 7:18 - 22:44 | 0 | 6 |
| Last Fist vs Bloomhost | 30 | 14:34 | 7:16 - 22:44 | 0 | 6 |
| Last Fist vs Axiarchs | 30 | 16:29 | 6:07 - 22:23 | 0 | 6 |
| Bloomhost vs Axiarchs | 30 | 11:15 | 4:04 - 22:52 | 2 | 6 |
| all | 90 | 14:01 | 4:04 - 22:52 | 2 | 18 |

### 2.3 Tiers reached

T2 / T3: the first non-HQ building of the side to finish that tier; "T3 unit": the first unit of a T3 unlock on the field; "T3 air": the first T3 aircraft (Leviathan, Cloudwing or Worldrender, Shardstorm or Sovereign). Medians over the sides that got there; "never" counts the 60 sides of each faction.

| faction | any building T2 median | never | any building T3 median | never | T3 unit median | never | T3 air median | never |
|---|---|---|---|---|---|---|---|---|
| Last Fist | 1:39 | 0 (0%) | 3:26 | 4 (7%) | 8:01 | 24 (40%) | 13:05 | 53 (88%) |
| Bloomhost | 0:59 | 0 (0%) | 3:27 | 4 (7%) | 5:58 | 16 (27%) | 11:59 | 46 (77%) |
| Axiarchs | 0:59 | 0 (0%) | 3:29 | 3 (5%) | 6:10 | 20 (33%) | 9:02 | 49 (82%) |

Production T2 (the first path a side chose; "never" of 60 sides). A T3 production step shows as the first T3 unit above.

| faction | any production building | Barracks role | War Factory role | Tech Lab role |
|---|---|---|---|---|
| Last Fist | 3:17 (never 1) | 3:51 (never 4) | 5:07 (never 4) | 4:20 (never 13) |
| Bloomhost | 3:15 (never 0) | 3:15 (never 0) | 3:41 (never 1) | 5:00 (never 25) |
| Axiarchs | 3:28 (never 1) | 3:28 (never 1) | 3:54 (never 3) | 5:23 (never 32) |

### 2.4 Units trained, and what they did

Per unit type over all 90 matches: trained (temporary units such as Mites, hatchlings and Cloudwing offspring are never trained; they show only as damage), matches with at least one, spent (credits + energy at the per-game price; a brood counts 30 per Skitterling), damage dealt (HP plus shields removed, units and buildings), damage to buildings, kills (units), killed value, and damage and killed value per 100 spent. Ordered by faction, then damage per 100 spent.

**Last Fist** (60 sides)

| unit | trained | in matches | spent | damage | to buildings | kills | killed value | dmg / 100 spent | killed value / 100 spent | lost |
|---|---|---|---|---|---|---|---|---|---|---|
| artillery | 279 | 29 | 65565 | 322714 | 80321 | 605 | 73696 | 492 | 112 | 129 |
| hydra | 31 | 12 | 15500 | 69719 | 21297 | 208 | 26383 | 450 | 170 | 18 |
| sniper | 219 | 28 | 45990 | 189544 | 43596 | 714 | 73847 | 412 | 161 | 129 |
| titan | 94 | 22 | 54520 | 155777 | 64574 | 196 | 30395 | 286 | 56 | 59 |
| aircraft | 513 | 46 | 166725 | 452914 | 36867 | 859 | 132173 | 272 | 79 | 462 |
| tank | 546 | 52 | 199290 | 393021 | 98370 | 896 | 104348 | 197 | 52 | 461 |
| interceptor | 98 | 14 | 20580 | 35111 | 0 | 209 | 30980 | 171 | 151 | 75 |
| flame | 337 | 26 | 80880 | 124544 | 25365 | 614 | 47039 | 154 | 58 | 296 |
| rifle | 3845 | 60 | 173025 | 266334 | 39852 | 1144 | 108289 | 154 | 63 | 3523 |
| heavy | 1015 | 41 | 177625 | 272986 | 66341 | 495 | 73848 | 154 | 42 | 846 |
| leviathan | 9 | 7 | 6480 | 5110 | 3546 | 0 | 0 | 79 | 0 | 5 |
| drone | 184 | 22 | 18400 | 0 | 0 | 0 | 0 | 0 | 0 | 157 |
| medic | 97 | 21 | 23280 | 0 | 0 | 0 | 0 | 0 | 0 | 44 |

Rare (trained in 6 or fewer of the 60 sides): none.

**Bloomhost** (60 sides)

| unit | trained | in matches | spent | damage | to buildings | kills | killed value | dmg / 100 spent | killed value / 100 spent | lost |
|---|---|---|---|---|---|---|---|---|---|---|
| spitter | 1185 | 36 | 106650 | 267054 | 75044 | 758 | 123675 | 250 | 116 | 1013 |
| ruinmaw | 34 | 16 | 18700 | 36311 | 29698 | 27 | 3175 | 194 | 17 | 7 |
| broodtyrant | 16 | 8 | 7520 | 14534 | 8654 | 22 | 2930 | 193 | 39 | 15 |
| bulwark | 1119 | 60 | 184635 | 300076 | 159084 | 586 | 76890 | 163 | 42 | 955 |
| ravager | 235 | 20 | 49350 | 76688 | 45641 | 210 | 20815 | 155 | 42 | 179 |
| worldrender | 3 | 3 | 2340 | 3393 | 2524 | 9 | 1925 | 145 | 82 | 3 |
| gorebore | 156 | 23 | 35880 | 52000 | 20246 | 197 | 17570 | 145 | 49 | 135 |
| razorwing | 810 | 40 | 153900 | 195844 | 24642 | 599 | 90545 | 127 | 59 | 771 |
| skitterling | 4440 | 60 | 133200 | 152969 | 58358 | 491 | 46920 | 115 | 35 | 4677 |
| thornback | 255 | 31 | 56100 | 63221 | 35884 | 122 | 12350 | 113 | 22 | 220 |
| bilecaster | 205 | 28 | 49200 | 38799 | 16760 | 51 | 5160 | 79 | 10 | 171 |
| dreadthorn | 101 | 24 | 52520 | 39468 | 15288 | 102 | 13655 | 75 | 26 | 87 |
| cloudwing | 21 | 11 | 6720 | 4120 | 1585 | 6 | 565 | 61 | 8 | 20 |
| needlewing | 649 | 24 | 64900 | 38024 | 8979 | 110 | 18620 | 59 | 29 | 661 |
| leaper | 675 | 29 | 67500 | 22831 | 5622 | 72 | 8555 | 34 | 13 | 651 |
| mite | 0 | 0 | 0 | 941 | 914 | 0 | 0 | (free) | - | 59 |

Rare (trained in 6 or fewer of the 60 sides): worldrender 3 (3 sides).

**Axiarchs** (60 sides)

| unit | trained | in matches | spent | damage | to buildings | kills | killed value | dmg / 100 spent | killed value / 100 spent | lost |
|---|---|---|---|---|---|---|---|---|---|---|
| sovereign | 4 | 4 | 3600 | 22191 | 18293 | 19 | 2596 | 616 | 72 | 2 |
| worldbreaker | 27 | 20 | 19170 | 80551 | 52713 | 161 | 12821 | 420 | 67 | 13 |
| wraithwing | 141 | 28 | 46530 | 163185 | 18268 | 571 | 56987 | 351 | 122 | 118 |
| lancer | 786 | 44 | 129690 | 417506 | 162198 | 1206 | 146078 | 322 | 113 | 596 |
| marksman | 107 | 30 | 37450 | 76413 | 44521 | 185 | 15268 | 204 | 41 | 58 |
| shardstorm | 20 | 7 | 8200 | 11619 | 2378 | 49 | 5628 | 142 | 69 | 18 |
| voidcarrier | 14 | 11 | 7420 | 9772 | 2007 | 30 | 4784 | 132 | 64 | 8 |
| bastion | 411 | 54 | 141795 | 154098 | 63658 | 407 | 41722 | 109 | 29 | 339 |
| eventide | 32 | 16 | 19200 | 19204 | 5342 | 70 | 6930 | 100 | 36 | 26 |
| prismwing | 280 | 12 | 39200 | 31332 | 9919 | 95 | 9322 | 80 | 24 | 259 |
| gravemantle | 107 | 26 | 35310 | 27392 | 10000 | 82 | 5860 | 78 | 17 | 77 |
| severance | 92 | 25 | 28520 | 21091 | 1819 | 55 | 4868 | 74 | 17 | 84 |
| shardling | 2458 | 60 | 196640 | 136170 | 25935 | 839 | 50015 | 69 | 25 | 2375 |
| parallax | 100 | 15 | 31000 | 12903 | 5124 | 39 | 4545 | 42 | 15 | 90 |
| riftstalker | 535 | 25 | 101650 | 33303 | 3621 | 202 | 15148 | 33 | 15 | 531 |

Rare (trained in 6 or fewer of the 60 sides): sovereign 4 (4 sides).

Damage from buildings, abilities and other sources (per faction):

| faction | source | damage | kills |
|---|---|---|---|
| Axiarchs | building: hq | 526493 | 1880 |
| Last Fist | building: hq | 430064 | 1249 |
| Bloomhost | building: hq | 409625 | 1146 |
| Axiarchs | building: turret | 184588 | 695 |
| Axiarchs | ability: Purification Beam | 183719 | 415 |
| Last Fist | ability: Orbital Strike | 164743 | 386 |
| Last Fist | building: turret | 100193 | 413 |
| Bloomhost | building: turret | 60900 | 256 |
| Bloomhost | ability: Corrosive Spores | 47512 | 117 |

### 2.5 Path picks

Every building that took a path, counted once per building (the first path the side took on that role in brackets).

| faction | building | sides with a path | paths taken (buildings) | first path of the side |
|---|---|---|---|---|
| Axiarchs | barracks | 59 of 60 | Riftwalk Doctrine 26, Lattice Doctrine 47 | Riftwalk Doctrine 21, Lattice Doctrine 38 |
| Axiarchs | factory | 57 of 60 | Rupture Doctrine 29, Dominion Doctrine 33 | Rupture Doctrine 27, Dominion Doctrine 30 |
| Axiarchs | techlab | 28 of 60 | Swarm Calculus 12, Ascendant Calculus 16 | Swarm Calculus 12, Ascendant Calculus 16 |
| Bloomhost | barracks | 60 of 60 | Predatory Evolution 29, Acidic Evolution 40 | Predatory Evolution 27, Acidic Evolution 33 |
| Bloomhost | factory | 59 of 60 | Predator Evolution 33, Burrowing Evolution 26 | Predator Evolution 33, Burrowing Evolution 26 |
| Bloomhost | techlab | 35 of 60 | Swarm Bloom 24, Apex Bloom 11 | Swarm Bloom 24, Apex Bloom 11 |
| Last Fist | barracks | 56 of 60 | Specialists 45, Mass Deployment 17 | Specialists 40, Mass Deployment 16 |
| Last Fist | factory | 56 of 60 | Siege 31, Assault 26 | Siege 30, Assault 26 |
| Last Fist | techlab | 47 of 60 | Air Power 25, Support 22 | Air Power 25, Support 22 |

### 2.6 Matches under 5:00

| map | match | seed | end | winner | how | winner trained | loser trained |
|---|---|---|---|---|---|---|---|
| classic | Axiarchs vs Bloomhost | 7 | 4:46 | Bloomhost | hq | skitterling 24, bulwark 6, razorwing 4, leaper 1 | shardling 19, lancer 4 |
| classic | Bloomhost vs Axiarchs | 11 | 4:04 | Bloomhost | hq | skitterling 28, leaper 5, bulwark 4, gorebore 1 | shardling 12, wraithwing 1 |

### 2.7 Notes for the open flags

- Bloomspire: 25 of 60 Bloomhost sides never took a Bloomspire to T2 (42%). Against Last Fist (30 sides): Swarm Bloom 14, Apex Bloom 4; of the Swarm Bloom sides, 2 faced a Last Fist side that trained no armed aircraft all match.
- Top-tier aircraft, sides that trained any: cloudwing 11, sovereign 4, voidcarrier 11, broodtyrant 8, worldrender 3, leviathan 7, shardstorm 7 (of 60 sides per faction).
- Peak units alive (one side): Last Fist 56, Bloomhost 59, Axiarchs 39; medians Last Fist 26, Bloomhost 30, Axiarchs 16.
- Personas (sides, wins): Axiarchs boomer 24/51; Axiarchs turtle 1/9; Bloomhost boomer 26/51; Bloomhost turtle 1/9; Last Fist boomer 18/24; Last Fist economist 9/24; Last Fist turtle 2/12.


## 3. Targeted Test Range measurements

audit/sim/audit6a-range.js on v2.91. Values are credits + energy. Seeds 11-15, each fight in both orientations, unless a table says otherwise.

### R1. Leviathan damage per second (one Leviathan, unopposed: the target side does not act; targets made unkillable to measure a steady rate over 90 s)
| target | b4b off (P10) dmg/s | b4b on (runs) dmg/s | on / off |
|---|---|---|---|
| one Tank | 26.7 | 6.4 | 0.24 |
| 6 Tanks, packed | 141.3 | 34.4 | 0.24 |
| 12 Marines, packed | 152 | 37.2 | 0.24 |
| one Refinery (building) | 90.9 | 21.5 | 0.24 |

### R2. Astral Sovereign: time to kill a building (one attacker, the building's side does not act: no HQ gun, no repair; seconds from the start, 1 seed: the beam has no random part)
| building | Sovereign b4b off (P12) | Sovereign b4b on (beam) | Leviathan | Worldrender | Titan | Worldbreaker |
|---|---|---|---|---|---|---|
| Last Fist HQ T1 | 34 | 37 | 131 | 48 | 27 | 39 |
| Last Fist HQ T3 | 52 | 56 | 224 | 76 | 38 | 62 |
| Last Fist Barracks-role T1 | 9 | 9 | 33 | 12 | 11 | 8 |
| Last Fist Turret-role T1 | 15 | 16 | 69 | 22 | 16 | 18 |
| Bloomhost HQ T1 | 34 | 37 | 131 | 48 | 27 | 39 |
| Bloomhost HQ T3 | 52 | 56 | 224 | 76 | 38 | 62 |
| Bloomhost Barracks-role T1 | 9 | 9 | 33 | 12 | 11 | 8 |
| Bloomhost Turret-role T1 | 15 | 16 | 70 | 24 | 16 | 21 |
| Axiarchs HQ T1 | 52 | 56 | >600 | 52 | 29 | 42 |
| Axiarchs HQ T3 | 114 | 164 | >600 | 84 | 43 | 68 |
| Axiarchs Barracks-role T1 | 9 | 9 | 46 | 12 | 11 | 11 |
| Axiarchs Turret-role T1 | 15 | 23 | 215 | 24 | 16 | 21 |

| building | Sovereign | Leviathan | Titan |
|---|---|---|---|
| Last Fist HQ T1, its gun firing | 37 | died | 27 |
| Last Fist HQ T3, its gun firing | died | died | died |
| Bloomhost HQ T1, its gun firing | 37 | died | 27 |
| Bloomhost HQ T3, its gun firing | died | died | died |
| Axiarchs HQ T1, its gun firing | 56 | died | 29 |
| Axiarchs HQ T3, its gun firing | died | died | died |

### R3. All-Shardling rush (audit/sim/strat.js rush opening for the Axiarchs: two Genesis Gates, Shardlings nonstop until its attack is over, then the timing branch) against the Hard AI, Classic, seeds 1-10, to 20:00
| opponent | b3b (parry) | rush W-L-D | won by 8:00 | median win time | median loss time | won with Shardlings only |
|---|---|---|---|---|---|---|
| vs Last Fist Hard | off | 0-10-0 | 0 | - | 5:34 | 0 |
| vs Last Fist Hard | on | 1-9-0 | 0 | 10:28 | 6:20 | 0 |
| vs Bloomhost Hard | off | 0-10-0 | 0 | - | 4:38 | 0 |
| vs Bloomhost Hard | on | 0-10-0 | 0 | - | 5:27 | 0 |
| vs Axiarchs Hard | off | 0-10-0 | 0 | - | 6:12 | 0 |
| vs Axiarchs Hard | on | 0-10-0 | 0 | - | 5:33 | 0 |

### R4. Ranged armies attacking a held Axiarch front, with and without Bastions (2 Bastions + 4 Lancers = 1350 against 8 Lancers = 1320; 5 seeds × both orientations; "absorbed" = barrier HP lost, "blocked" = raw damage of the shots and beams it stopped; "cost to break" = the smallest multiple of the mix, in 0.5 steps, that wins 6+ of 10)
| attacking mix | b3b | cost to break 2 Bastions + 4 Lancers | barrier absorbed (that fight) | blocked (raw) | cost to break 8 Lancers | Bastion front / Lancer front |
|---|---|---|---|---|---|---|
| Last Fist: Marines + Heavies (5:2) | off | 1725 | 0 | 0 | 2035 | 0.85 |
| Last Fist: Marines + Heavies (5:2) | on | 2035 | 2460 | 2476 | 2035 | 1 |
| Last Fist: Artillery + Marines (1:2) | off | 1300 | 0 | 0 | 280 | 4.64 |
| Last Fist: Artillery + Marines (1:2) | on | 605 | 174 | 174 | 280 | 2.16 |
| Last Fist: Tanks + Marines (1:2) | off | 865 | 0 | 0 | 1320 | 0.66 |
| Last Fist: Tanks + Marines (1:2) | on | >1820 | - | - | 1320 | - |
| Bloomhost: Spitters | off | 900 | 0 | 0 | 1170 | 0.77 |
| Bloomhost: Spitters | on | 900 | 4200 | 4200 | 1170 | 0.77 |
| Bloomhost: Skitterlings (broods) | off | 1512 | 0 | 0 | 864 | 1.75 |
| Bloomhost: Skitterlings (broods) | on | 1296 | 0 | 0 | 864 | 1.5 |
| Axiarchs: Lancers | off | 495 | 0 | 0 | 825 | 0.6 |
| Axiarchs: Lancers | on | 825 | 4680 | 4800 | 825 | 1 |

### R5. Leapers against vehicles, cost for cost (both sides attack; 5 seeds × both orientations; W-L for the Leapers; values in credits + energy)
| vehicles | b3a off | time | Leapers left | vehicles left | b3a on | time | Leapers left | vehicles left | reference (b5b broods) | Skitterlings left | vehicles left |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 tank (1460) | 15 Leapers: 0-10 | 8.4 | 0 | 1460 | 15 Leapers: 0-10 | 10.4 | 0 | 1314 | 49 Skitterlings: 0-10 | 0 | 1460 |
| 2 titan (1160) | 12 Leapers: 0-10 | 9.3 | 0 | 1160 | 12 Leapers: 0-10 | 14.1 | 0 | 1160 | 39 Skitterlings: 0-10 | 0 | 1160 |
| 2 hydra (1000) | 10 Leapers: 0-10 | 12.2 | 0 | 1000 | 10 Leapers: 0-10 | 12.1 | 0 | 1000 | 33 Skitterlings: 0-10 | 0 | 500 |
| 9 bulwark (1485) | 15 Leapers: 0-10 | 13.3 | 0 | 1485 | 15 Leapers: 0-10 | 12.5 | 0 | 1485 | 50 Skitterlings: 0-10 | 0 | 1056 |
| 4 bastion (1380) | 14 Leapers: 0-10 | 35.5 | 0 | 1035 | 14 Leapers: 0-10 | 35.2 | 0 | 1035 | 46 Skitterlings: 10-0 | 1271 | 0 |
| 2 eventide (1200) | 12 Leapers: 10-0 | 51.3 | 480 | 0 | 12 Leapers: 10-0 | 49 | 500 | 0 | 40 Skitterlings: 10-0 | 1274 | 0 |

### R6. Titan reach and fights, b2b off (v2.82: range 190, plants for +90 = 280 against buildings) and on (160; plants within 100 of a building, ×2.5 to it; infantry cover)
| b2b | target | distance at first hit | time to kill (s) | Titan HP left |
|---|---|---|---|---|
| off | Last Fist Turret | 280 | 32 | 1500 / 1500 |
| off | Bloomhost Maw | 280 | 32 | 1500 / 1500 |
| off | Axiarch Null Lance | 280 | 34 | 1500 / 1500 |
| off | Last Fist HQ T1 (gun firing) | 280 | 52 | 425 / 1500 |
| on | Last Fist Turret | 100 | 32 | 1116 / 1500 |
| on | Bloomhost Maw | 100 | 32 | 990 / 1500 |
| on | Axiarch Null Lance | 100 | 32 | 510 / 1500 |
| on | Last Fist HQ T1 (gun firing) | 100 | 43 | 630 / 1500 |

| Titan + 10 Marines (1030) vs | b2b off W-L | time | LF left | foe left | b2b on W-L | time | LF left | foe left | reference: 23 Marines (1035) W-L | LF left | foe left |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 11 Spitters (990) | 10-0 | 12.7 | 580 | 0 | 10-0 | 13.2 | 630 | 0 | 10-0 | 360 | 0 |
| 6 Lancers (990) | 10-0 | 25.3 | 580 | 0 | 10-0 | 17.8 | 850 | 0 | 10-0 | 590 | 0 |
| 3 Tanks (1095) | 10-0 | 29.7 | 580 | 0 | 10-0 | 31.1 | 580 | 0 | 0-10 | 0 | 1095 |

### R7. Artillery hit rate (2 Artillery at 300 from the targets, 120 s; a shell "hits" when it takes HP or shields off any enemy; targets unkillable; moving targets walk back and forth over 160, turning every 5 s)
| switches | vs 6 Marines, standing | vs 6 Marines, moving | vs 2 Tanks, standing | vs 2 Tanks, moving |
|---|---|---|---|---|
| deploy off, telegraph off (v2.81) | 100% (225), 7728/min | 71% (225), 4491/min | 100% (227), 2337/min | 64% (227), 1351/min |
| deploy on, telegraph off | 100% (221), 7589/min | 77% (217), 4432/min | 100% (223), 2292/min | 62% (218), 1240/min |
| deploy off, telegraph on | 100% (224), 7690/min | 63% (224), 3787/min | 100% (226), 2322/min | 54% (226), 1083/min |
| deploy on, telegraph on (default) | 100% (220), 7568/min | 70% (215), 3835/min | 100% (222), 2286/min | 54% (217), 1044/min |

(cells: shells that hit, the shells fired per run in brackets, damage per minute of the pair)

### R8. Ground speed over 300 of open lane (measured in the SIM: units ordered to walk; units per second)
| unit | listed speed | measured |
|---|---|---|
| Skitterling, alone (b5b off: v2.87) | 52 | 52 |
| Skitterling, alone | 52 | 52 |
| Skitterling, pack of 12 (full surge) | 52 | 72.8 |
| Skitterling, pack of 12 on creep | 52 | 87.4 |
| Skitterling, pack of 12 on creep + Frenzy Bloom | 52 | 113.6 |
| Skitterling, alone, creep + Frenzy Bloom, b5b off | 52 | 81.1 |
| Leaper, pack of 12, creep + Frenzy Bloom | 46 | 100.5 |
| Marine (Last Fist fastest ground) | 38 | 38 |
| Flame Tank | 34 | 34 |
| Shardling (Axiarch fastest ground) | 50 | 50 |
| Riftstalker | 48 | 48 |

Fastest aircraft for comparison (listed): Recon Drone 115, Interceptor 100, Needlewing 115, Razorwing 95, Prismwing 100, Wraithwing 86 (plus hops). Creep ×1.2, surge up to +40%, Frenzy Bloom ×1.3.

### R9. Spitters against aircraft, cost for cost (both sides attack; 5 seeds × both orientations); the Hydra and Lancer as other factions' anti-air for reference
| aircraft | b5b off: Spitters W-L | time | Spitters left | air left | Spitter dmg/s per 1000 spent | b5b on: Spitters W-L | time | Spitters left | air left | Spitter dmg/s per 1000 spent | Hydras (Last Fist) | Lancers (Axiarchs) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 aircraft (975) | 11: 10-0 | 7.2 | 810 | 0 | 96.8 | 11: 10-0 | 4.5 | 900 | 0 | 153.5 | 2 Hydra: 10-0, 4.4 s, 1000 left | 6 Lancers: 10-0, 7.2 s, 825 left |
| 5 interceptor (1050) | 12: 10-0 | 13.6 | 1080 | 0 | 64.7 | 12: 10-0 | 8.9 | 1080 | 0 | 100.9 | 2 Hydra: 10-0, 12.1 s, 1000 left | 6 Lancers: 10-0, 13.6 s, 990 left |
| 1 leviathan (720) | 8: 10-0 | 15.9 | 720 | 0 | 122.8 | 8: 10-0 | 9.4 | 720 | 0 | 207.3 | 1 Hydra: 10-0, 15 s, 500 left | 4 Lancers: 10-0, 13.9 s, 660 left |
| 5 razorwing (950) | 11: 10-0 | 8.9 | 720 | 0 | 110.7 | 11: 10-0 | 4.5 | 900 | 0 | 221.6 | 2 Hydra: 10-0, 6.4 s, 1000 left | 6 Lancers: 10-0, 8.7 s, 825 left |
| 2 broodtyrant (940) | 10: 6-4 | 23.6 | 162 | 188 | 88.8 | 10: 10-0 | 10.7 | 720 | 0 | 198.1 | 2 Hydra: 10-0, 10.7 s, 1000 left | 6 Lancers: 10-0, 13.2 s, 990 left |
| 3 wraithwing (990) | 11: 10-0 | 11.4 | 729 | 0 | 80.8 | 11: 10-0 | 3.6 | 900 | 0 | 253.4 | 2 Hydra: 10-0, 5.3 s, 1000 left | 6 Lancers: 10-0, 8.8 s, 891 left |
| 7 prismwing (980) | 11: 10-0 | 16.9 | 351 | 0 | 62 | 11: 10-0 | 7.9 | 720 | 0 | 133.2 | 2 Hydra: 10-0, 8 s, 1000 left | 6 Lancers: 10-0, 12.3 s, 660 left |
| 2 shardstorm (820) | 9: 10-0 | 11.6 | 360 | 0 | 88.8 | 9: 10-0 | 6.1 | 630 | 0 | 165.7 | 2 Hydra: 10-0, 5.2 s, 1000 left | 5 Lancers: 10-0, 7.9 s, 660 left |
| 2 voidcarrier (1060) | 12: 10-0 | 21.9 | 864 | 0 | 120 | 12: 10-0 | 12.5 | 990 | 0 | 211.6 | 2 Hydra: 10-0, 15.5 s, 1000 left | 6 Lancers: 10-0, 18.2 s, 825 left |

### R10. Shardlings against tier-1 armies, cost for cost (about 800 each side; both attack; 5 seeds × both orientations), b3b off and on; and broods against them, b5b off and on
| 10 Shardlings (800) vs | b3b off W-L | time | Shardlings left | foe left | b3b on W-L | time | Shardlings left | foe left |
|---|---|---|---|---|---|---|---|---|
| 18 Marines (810) | 10-0 | 20.6 | 160 | 0 | 10-0 | 17 | 256 | 0 |
| 27 Skitterlings, b5b on (810) | 0-10 | 5.4 | 0 | 864 | 0-10 | 5.9 | 0 | 720 |
| 5 Bulwarks (825) | 0-10 | 18.3 | 0 | 825 | 0-10 | 21.2 | 0 | 825 |
| 2 Tanks + 2 Marines (820) | 0-10 | 12.2 | 0 | 730 | 0-10 | 14.1 | 0 | 365 |

| Skitterlings (same cost) vs | b5b off (60 each) W-L | time | Skitterlings left | foe left | b5b on (30 each, broods) W-L | time | Skitterlings left | foe left |
|---|---|---|---|---|---|---|---|---|
| 18 Marines (810) | 14: 0-10 | 8.7 | 0 | 657 | 27: 10-0 | 6.8 | 619 | 0 |
| 10 Shardlings (800) | 13: 0-10 | 7.3 | 0 | 720 | 27: 10-0 | 5.9 | 720 | 0 |
| 2 Tanks + 2 Marines (820) | 14: 0-10 | 7.2 | 0 | 730 | 27: 0-10 | 6.6 | 0 | 730 |
| 6 Lancers (990) | 17: 6-4 | 19.5 | 72 | 66 | 33: 10-0 | 6.5 | 958 | 0 |


## 4. The flags, one by one

What the measurements say about each flag in section 1 (S = self-play, R = section 3).

| # | Flag | Verdict | Evidence |
|---|------|---------|----------|
| F1 | Artillery: deploy plus telegraph | **Not a problem in AI play.** Telegraph costs 15-20% of damage against moving targets; deploy almost nothing against a fixed target. Artillery is still Last Fist's most cost-efficient unit | R7: moving Marines 71% → 70% of shells hit, 4,491 → 3,835 damage/min; moving Tanks 64% → 54%, 1,351 → 1,044/min; standing 100% either way. S: Artillery 492 damage and 112 killed value per 100 spent, first in Last Fist. No AI dodges markers (2a's fix), so the telegraph only matters against a person |
| F2 | Severance aims with no lead | Weak unit | S: 74 damage / 100 spent, 17 killed value / 100 (92 trained) |
| F3 | Bloomhost has no long range | **Not visible in results.** Bloomhost wins 45% (51% of decided) | S 2.1; the Spitter (range 150) is its top damage dealer per credit (250 / 100) |
| F4 | Titan reach 190/280 → 160/100 | **Small.** Same time to kill a Turret (32 s); it now takes damage doing it | R6: b2b off first hit from 280, 1,500 of 1,500 HP left against a Turret, Maw or Null Lance; on, first hit from 100, 1,116 / 990 / 510 left; same 32 s. S: Titan 286 / 100, mid-table |
| F5 | Titan cover | Titan + 10 Marines win every cost-for-cost fight with b2b off and on; cover adds survivors against Lancers (850 left vs 580) | R6 second table |
| F7 | Leapers hard-counter vehicles | **Contradicted.** Leapers lose cost for cost to Tanks, Titans, Hydras, Bulwarks and Bastions, 0-10 with b3a off and on; they beat only the Eventide (10-0 both). Latching slows the kill (Titan 9.3 → 14.1 s) but does not win | R5; S: Leaper 34 damage / 100 spent and 13 killed value / 100, last in Bloomhost |
| F9 | Riftstalkers rare and weak | Not rare any more (535 trained in 25 sides) but the weakest Axiarch unit per credit | S: 33 damage / 100 spent, 15 killed value / 100, 531 of 535 lost |
| F10 | Bastion barrier vs ranged armies | **Confirmed, worst for direct-fire vehicles.** The cost to break a 2 Bastion + 4 Lancer front rises with b3b on: Tanks + Marines from 865 to more than 1,820 (not broken at ×4); Lancers 495 → 825; Marines + Heavies 1,725 → 2,035. Spitters unchanged (900); Artillery cheaper (1,300 → 605, shells arc over) | R4 |
| F11 | All-Shardling rush wins early | **Not against Hard.** The scripted rush went 1-59 over 60 Classic matches (b3b on: 1-29), never won by 8:00 | R3. The original observation was the Default Aggressor against the Default Turtle |
| F12 | The parry beats Skitterling swarms | **Inverted.** Broods beat Shardlings cost for cost 10-0, keeping 720 of 810; both sub-5:00 matches were Bloomhost brood rushes over Shardlings | R10; S 2.6 |
| F13 | AI Dreadthorns rare | Not rare (101 in 24 sides), but weak: 75 / 100 spent | S |
| F14-F17 | Mark, Wraithwing, Bilecaster, Gunship | Wraithwing strong (351 / 100, 122 killed value / 100); Bilecaster weak (79 / 100, 10 killed value / 100, F16 confirmed); Gunship mid (272 / 100); Marksman mid (204 / 100) | S |
| F18 | Leviathan at a quarter of its old damage per second | **Confirmed: ×0.24** on every target type. It is also almost never built (9 in 90 matches, 0 kills) | R1: one Tank 26.7 → 6.4 dmg/s, 6 Tanks 141 → 34, a Refinery 91 → 22; S |
| F19 | Sovereign 546 per shot to buildings | **Not an outlier against siege units.** HQ T1 in 37 s (P12 34 s; Titan 27 s; Worldbreaker 39 s); dies to a T3 HQ's gun | R2; S: 4 trained in 90 matches, 616 damage / 100 spent, 82% of it to buildings |
| F20-F22 | Pustules, Worldrender re-landing, Voidcarrier | Brood Tyrant 193 / 100; Worldrender 3 trained; Voidcarrier 132 / 100, 14 trained. Too few to judge | S |
| F23 | Broods cheap per health | **Confirmed, strongest early-game effect found.** Same-cost broods beat 18 Marines 10-0 (619 of 810 left; b5b off: 0-10), 10 Shardlings 10-0 (720 left; off 0-10), 6 Lancers 10-0 (958 of 990 left; off 6-4); they lose only to Tanks + Marines | R10 |
| F24 | Skitterling speed | **Confirmed: 113.6** with surge, creep and Frenzy Bloom (2.2× listed, 3× a Marine, faster than a Wraithwing 86 and a Razorwing 95; b5b off the most was 81) | R8 |
| F25 | Spitter anti-air | Confirmed as a step up: 1.6-3.1× the damage rate against aircraft (Wraithwing 81 → 253 dmg/s per 1,000 spent). But every faction's dedicated anti-air (Hydras, Lancers) also beats every aircraft cost for cost, b5b off too | R9 |
| F27 | Little T3 air; Bloomspire rarely T2 | **Confirmed.** No T3 aircraft in 88% (Last Fist), 77% (Bloomhost), 82% (Axiarch) of sides; the Tech Lab role never reaches T2 in 13, 25 and 32 of 60 sides; Bloomspire never T2 in 42% of Bloomhost sides (5c: 29%) | S 2.3, 2.7 |
| F28 | Swarm Bloom vs a Last Fist that never flies | **Rare in practice.** Swarm Bloom 14 of 18 Bloomspire picks against Last Fist, but only 2 of those faced a Last Fist side with no armed aircraft (Last Fist trained Gunships in 46 of 60 sides) | S 2.7 |
| F30 | Hydra and Recon Drones | Hydra no longer rare (31 in 12 sides) and very efficient (450 / 100); Recon Drones 157 of 184 lost | S |

## 5. Ranked list: the biggest imbalances by evidence

Each with the numbers and one suggested lever (value and direction). Nothing applied.

1. **Spawn side decides too many matches.** Side 1 won 55, side 0 26 (9 draws) of 90; on the lane maps 40-13 (Two-Lane 19-6, Three-Lane 21-7; Classic 15-13). Every faction does better as side 1 (Last Fist 18-8 vs 11-18, Bloomhost 18-9 vs 9-17, Axiarchs 19-9 vs 6-20). Faction win rates in this audit are fair only because every pairing was played both ways. *Lever:* not a unit number; find the asymmetry first. Candidates: the AI-played side 0's setup (`AUTO_STANCE.retreat`, the autoplayer path) and the lane maps' per-side positions (pads, nodes, rally points in src/sim/maps-twolane.js, maps-threelane.js). Run audit/sim/audit6a.js with side 0's stance and with mirrored map data to isolate it.
2. **Bastion barrier blocks direct fire too well.** Against 2 Bastions + 4 Lancers, Tanks + Marines need more than 1,820 to win (865 with b3b off); Lancers 825 (495); Marines + Heavies 2,035 (1,725). Only arcing shells pass. *Lever:* `BAR.hp` 600 → lower (or `BAR.regen` 30/s → lower).
3. **Broods win the early game cost for cost.** 27 Skitterlings (810) beat 18 Marines, 10 Shardlings and 6 Lancers 10-0 with 76-97% of their value left; v2.87's single Skitterlings lost the same fights. Both matches under 5:00 were Bloomhost brood rushes over Axiarchs, and the Axiarchs lose Classic 6-13-1. Plus 113.6 speed with surge, creep and Frenzy Bloom. *Lever:* `BROOD.cost` 120 → higher (or `BROOD.hp` 50 → lower); `SURGE.max` 0.4 → lower if speed still dominates after.
4. **Divers and melee units trade badly.** Per 100 spent: Leaper 34 damage / 13 killed value, Riftstalker 33 / 15, Parallax 42 / 15, Shardling 69 / 25, Dreadthorn 75 / 26, against their factions' ranged units at 250-351 (Spitter, Lancer, Wraithwing). Leapers lose to every vehicle cost for cost except the Eventide (R5), so F7 is the wrong worry. *Lever:* `LATCH.dps` 10 → higher (Leaper); Riftstalker and Shardling damage up, in that order of evidence.
5. **Top-tier air is effectively missing.** No T3 aircraft in 77-88% of sides; the Leviathan was built 9 times in 90 matches with 0 kills and does 0.24× its old damage per second (6.4 dmg/s against one Tank); the Sovereign 4 times. *Lever:* `LEV.over` 120 → lower (shorter passes, more runs per minute), then the AI's Tech Lab timing.
6. **Tech Lab role reached late or never.** It never reaches T2 in 13 (Last Fist), 25 (Bloomhost) and 32 (Axiarch) of 60 sides; Bloomspire never T2 in 42% of Bloomhost sides. *Lever:* AI, not numbers: the Tech Lab role's place in the Hard build plans (`plan` in the personas), or its T2 cost down.
7. **The Turtle persona loses.** 4 wins in 30 sides (Last Fist 2/12, Bloomhost 1/9, Axiarchs 1/9) against the Boomer's 51/126 and Last Fist's Economist 9/24. *Lever:* the Turtle persona's dials (fewer Turrets, `minArmy` lower) in src/sim/ai-presets.js; or the Turret role's cost down.
8. **Ranged backline units dominate value.** Artillery 492 damage / 100 spent, Hydra 450, Worldbreaker 420, Sniper 412, Wraithwing 351, Lancer 322, against 154 for Marines and Heavies. The telegraph (F1) costs Artillery little. *Lever:* Artillery shell damage (UDEF artillery `dmg` 60) down or cost up; leave `artTelegraph` on.
9. **Map-dependent faction results.** Axiarchs 6-13-1 on Classic but 10-6-4 on Two-Lane; Last Fist 6-11-3 on Two-Lane but 12-7-1 on Classic (20 matches each, so a 6-13 split is suggestive, not proven). *Lever:* none yet; re-run with seeds 12-21 on Classic and Two-Lane before tuning.
10. **Bilecaster weak** (79 damage and 10 killed value per 100 spent; F16). *Lever:* Bilecaster range 150 → higher.

Lower: the Titan (F4, small), the Sovereign (F19, not an outlier), the Spitter's anti-air (F25, every anti-air beats every aircraft cost for cost anyway), the Shardling rush (F11, not against Hard).

## 6. Found here, not on the flag list

- The spawn-side bias (ranked 1): 55-26 for side 1, 40-13 on lane maps.
- Broods beat Shardlings decisively (F12 assumed the opposite), and that decides the only sub-5:00 matches.
- The Turtle persona wins 13% of its sides.
- The Tech Lab role (T2) is skipped by 13-32 of 60 sides per faction, not only the Bloomspire.
- Tanks are the army hardest hit by the barrier (cost to break more than doubled), not the Marines and Spitters the flag names; Spitters are not affected at all.
- Riftstalkers are now trained often (535) but are the worst Axiarch unit per credit; 531 of 535 die.
- The Leaper is the worst Bloomhost unit per credit (F7 called it too strong).
- The Severance and Gravemantle are weak (74 and 78 damage / 100 spent).

## 7. Not measured

- F8 (hatchlings and the Skitterling limit), F21 (Worldrender re-landing) and F29 (Axiarch control stacking): no clean measurement without a player; left for playtest.
- Human play: every number is AI vs AI (Hard) or a scripted Test Range fight. The AI never dodges Artillery markers, never micro-manages Leapers onto big hosts, and fields few T3 aircraft, so F1, F7 and F18 may read differently in a person's hands.
- Damage per credit favours units that sit behind a front; front-line units (Bastion, Bulwark, Shardling, Skitterling) also earn value by absorbing damage, which these tables do not credit.
- Easy and Normal, battlefield conditions, and seeds beyond 7-11 were not run. Test Range fights use 5 seeds × both orientations (the Test Range itself has a side bias: a mirror of 8 Lancers went 0-5 one way).
- R4's fronts hold and never chase, so anything that outranges them wins cheaply (one Artillery and two Marines break 8 Lancers for 280); compare the Bastion and Lancer columns within a row, not across rows.
- Damage attribution: building guns, abilities and other sources appear as their own rows; a few hits outside any unit's update (pools, pustules, the Worldbreaker's crack) are credited by weapon (audit/sim/audit6a-instrument.js).

## 8. Re-running after tuning

- `node audit/sim/audit6a.js [--seeds 7-11] [--maps classic,twolane,threelane] [--out dir]`: the self-play (about 25 minutes on 4 cores; resumes an unfinished matches.jsonl). `--identity` checks the instrumentation changes nothing (6 of 6 identical at v2.91, audit/logs-p1/audit6a-v291/identity.jsonl).
- `node audit/sim/audit6a-report.js [dir]`: the section 2 tables (report.md).
- `node audit/sim/audit6a-range.js [R1 … R10]`: the section 3 measurements (range.txt and range.json when run in full; about 10 minutes, R3 and R4 take most of it).
- Logs of this run: audit/logs-p1/audit6a-v291/.

## 9. After batch 6b (v2.92): the side-bias fix and Artillery counterplay

Batch 6b fixed the spawn-side bias (ranked 1 above) behind `REWORK.b6side` and toned the Artillery down behind `REWORK.b6art`; causes,
fixes and every measurement are in docs/FACTION_REWORK.md "Batch 6b". The same 90-match self-play as section 2 (audit/sim/audit6a.js,
seeds 7-11), run with b6side on and b6art off (audit/logs-p1/audit6b-side/) and with both on (audit/logs-p1/audit6b-art/); 0 errors in
each. Test Range measurements with `audit6a-range.js --oneway` (10 seeds, one orientation: the Test Range no longer leans to the side
placed first) in the same folders.

### 9.1 Side and faction win rates

| | v2.91 (section 2) | b6side on, b6art off | both on (v2.92) |
|---|---|---|---|
| side 0 - side 1 - draws | 26-55-9 | 41-39-10 | 40-42-8 |
| side 1 share of decided | 68% | 49% | 51% |
| Classic (side 0 - side 1) | 13-15 | 14-14 | 15-14 |
| Two-Lane | 6-19 | 11-14 | 11-13 |
| Three-Lane | 7-21 | 16-11 | 14-15 |
| Last Fist W-L-D | 29-26-5 (48%) | 40-12-8 (67%) | 40-14-6 (67%) |
| Bloomhost | 27-26-7 (45%) | 23-30-7 (38%) | 25-29-6 (42%) |
| Axiarchs | 25-29-6 (42%) | 17-38-5 (28%) | 17-39-4 (28%) |
| Last Fist as side 0 / as side 1 | 11-18-1 / 18-8-4 | 21-6-3 / 19-6-5 | 19-7-4 / 21-7-2 |
| Bloomhost as side 0 / as side 1 | 9-17-4 / 18-9-3 | 12-15-3 / 11-15-4 | 14-15-1 / 11-14-5 |
| Axiarchs as side 0 / as side 1 | 6-20-4 / 19-9-2 | 8-18-4 / 9-20-1 | 7-20-3 / 10-19-1 |

The faction rates moved because of the dice, not the side fix's mechanics: each AI's personality now comes from its own stream keyed
by seed and faction, so at a seed a faction plays the same personality in every match, and seeds 7-11 gave Last Fist the Boomer 4
times out of 5 (never the Economist, which lost to Bloomhost at seeds 10-11 on v2.91) and the Axiarchs and Bloomhost the Turtle twice.
Per personality (both on): Last Fist Boomer 33 wins of 48 sides, Turtle 7/12; Bloomhost Boomer 18/36, Turtle 7/24; Axiarch Boomer
10/36, Turtle 7/24. Five seeds are now five personality draws per faction: run seeds 12-21 before reading the faction table as balance.

### 9.2 Artillery

| | v2.91 | b6side | both on |
|---|---|---|---|
| shell damage per salvo | 60 | 60 | 45 |
| trained (sides with any, of 60) | 279 (29) | 443 (45) | 433 (45) |
| damage per 100 spent (self-play) | 492 | 453 | 383 |
| killed value per 100 spent | 112 | 116 | 75 |
| damage per 100 spent, Test Range army fights (audit/sim/art6b.js) | - | 436 | 382 |

R7 (two Artillery at 300, default switches; hit share and damage per minute of the pair): v2.91 standing Marines 100%, 7,568/min;
moving Marines 70%, 3,835/min; standing Tanks 100%, 2,286/min; moving Tanks 54%, 1,044/min. b6side: 100% / 7,851; 51% / 2,714; 100% /
2,331; 45% / 719 (the drop against moving targets is not explained yet: these runs are one orientation, 10 seeds, against v2.91's
both orientations, 5 seeds, and the update order changed too; not separated). Both on: 100% / 5,889; 51% /
2,035; 100% / 1,748; 45% / 539 (×0.75, the damage change).

Equal-cost Test Range fights (art6b.js, 20 runs, Last Fist holding): typical vs Axiarchs 10-10 → 6-14; Artillery-heavy vs Axiarchs
20-0 → 14-6; both Last Fist mixes vs Bloomhost 0-20 → 0-20. Diver strikes: see FACTION_REWORK.md.

### 9.3 Ranked list, updated

1. ~~Spawn side decides too many matches~~ **Fixed** (b6side): 51% side 1 overall, 48-54% per map.
2. **Bastion barrier blocks direct fire too well.** Unchanged: Tanks + Marines still need more than 1,820 against 2 Bastions + 4
   Lancers (R4 with --oneway). *Lever:* `BAR.hp`.
3. **Broods win the early game cost for cost.** Unchanged (R10: 27 Skitterlings beat 18 Marines, 10 Shardlings and 6 Lancers 10-0).
   *Lever:* `BROOD.cost`.
4. **New: Bloomhost's ranged line beats Last Fist's ground army cost for cost.** At about 4,750 a side, Last Fist holding with its
   Artillery set up loses 0-20 to the AI's own Bloomhost mix (Spitters, Bulwarks, Gorebores do the damage; the Spitter's 165 range
   outreaches Marines and Heavies), with or without b6art. In self-play the Spitter is Bloomhost's top unit (259 / 100 spent).
   *Lever:* the Spitter's range or `QUILL` damage (not touched: batch 6b tunes only the Artillery).
5. **Axiarchs weakest in this run** (28%, 17-39-4; worst on Three-Lane, 2-18-0). Partly the personality draws above (Turtle in 2 of 5
   seeds); the Shardling (82 / 100 spent), Riftstalker (40) and Parallax (74) trade badly. Confirm with seeds 12-21 first.
6. **Divers and melee trade badly.** Leaper 40 damage per 100 spent (was 34), Riftstalker 40 (33), Parallax 74 (42), Shardling 82
   (69), Dreadthorn 85 (75). b6art's diver preference helped little in self-play. *Lever:* `LATCH.dps`, Riftstalker damage.
7. **Top-tier air is effectively missing.** No T3 aircraft in 87% (Last Fist), 60% (Bloomhost), 92% (Axiarchs) of sides; Leviathan 10
   in 90 matches, 79 / 100 spent.
8. **Tech Lab role reached late or never**: never at T2 in 26 (Last Fist), 9 (Bloomhost), 29 (Axiarchs) of 60 sides.
9. **Ranged backline value.** Artillery 383 / 100 spent (was 492), now third in Last Fist after the Hydra (446) and Sniper (440).
   Its efficiency target (about 300) was not reached: below 45 a salvo Last Fist loses its typical fight with the Axiarchs (FACTION_REWORK
   "Batch 6b"). *Lever:* the Sniper next if backline value stays the concern.
10. **The Turtle persona loses** (14 wins in 60 sides with both on) and **the Bilecaster is weak** (88 / 100 spent).

## 10. Batch 6c, Part A (v2.92 measured, no game change): persona-balanced self-play and the updated ranked list

### 10.1 The design

Since batch 6b each AI's personality comes from its own stream (match seed and faction), so a few seeds give each faction only a
few personality draws (seeds 7-11 gave Last Fist the Boomer 4 times in 5). audit/sim/selfplay-6c.js sets the personalities from
the harness instead (newGame's `autoPersona` / `persona` options: no game code changed): every faction plays each of Hard's three
personalities (the union of its per-faction pools: Boomer, Economist, Turtle; Bloomhost and the Axiarchs never roll the Economist
on their own) against each personality of the other faction, on each map, against each opponent faction, from both sides: 3 maps
× 6 ordered pairings × 9 personality pairs = 162 Hard vs Hard matches, a match and its mirror sharing a seed. Every switch at its
default (on). 162 matches, 0 errors. Tables: audit/logs-p1/selfplay6c-a1/report6c.md (with 95% Wilson intervals) and report.md
(the section 2 tables: tiers, units, damage per credit, paths, fast matches); audit/sim/selfplay-6c-report.js.

### 10.2 Faction win rates

| faction | W-L-D | win rate (95% CI) | of decided | natural personality mix |
|---|---|---|---|---|
| Last Fist | 65-34-9 | 60% (51-69) | 66% (56-74) | 63% (50-75) |
| Bloomhost | 48-46-14 | 44% (35-54) | 51% (41-61) | 62% (47-75) |
| Axiarchs | 35-68-5 | 32% (24-42) | 34% (26-44) | 19% (10-34) |

"Natural mix" weights each match by how likely Hard's own dice make those two personalities (Last Fist Boomer 1/2, Economist and
Turtle 1/4; Bloomhost Boomer 3/4, Turtle 1/4; Axiarchs Boomer 1/3, Turtle 2/3): the Axiarchs' pool is two-thirds Turtle, the
weakest personality, which is most of their gap in normal play.

| pairing (first-named) | Classic | Two-Lane | Three-Lane | all (54) |
|---|---|---|---|---|
| Last Fist vs Bloomhost | 14-3-1, 78% (55-91) | 8-8-2, 44% (25-66) | 9-3-6, 50% (29-71) | 31-14-9, 57% (44-70) |
| Last Fist vs Axiarchs | 9-9-0, 50% (29-71) | 13-5-0, 72% (49-88) | 12-6-0, 67% (44-84) | 34-20-0, 63% (50-75) |
| Bloomhost vs Axiarchs | 10-8-0, 56% (34-75) | 12-2-4, 67% (44-84) | 12-5-1, 67% (44-84) | 34-15-5, 63% (50-75) |

Per faction and map: Last Fist 64% / 58% / 58% (Classic / Two-Lane / Three-Lane); Bloomhost 36% / 56% / 42%; Axiarchs 47% / 19%
(10-35) / 31%. Sides: 75-73-14 (side 1 49% of decided, 41-57). Median length 13:58 (Classic 11:04, Two-Lane 16:54, Three-Lane
14:07); 91% (86-95) of matches end by an HQ destroyed, 14 draws.

**Does Bloomhost beat Last Fist in self-play?** No. Last Fist won 31-14-9 (57% of all, 69% of decided, 54-80), 14-3-1 on Classic;
even on Two-Lane it is level (8-8-2). The Test Range's 0-20 at equal cost (6b) is a set-piece fight (Last Fist holding with
Artillery set up against the AI's Bloomhost ranged mix); in real matches Last Fist's economy, Turrets and timing decide first.

### 10.3 Personalities

| personality | W-L-D (all factions) | win rate (95% CI) | Last Fist | Bloomhost | Axiarchs |
|---|---|---|---|---|---|
| Boomer | 77-25-6 | 71% (62-79) | 33-3-0, 92% (78-97) | 26-7-3, 72% (56-84) | 18-15-3, 50% (34-66) |
| Economist | 39-53-16 | 36% (28-46) | 17-14-5, 47% | 12-14-10, 33% | 10-25-1, 28% |
| Turtle | 32-70-6 | 30% (22-39) | 15-17-4, 42% | 10-25-1, 28% | 7-28-1, 19% (10-35) |

Boomer vs Economist 81%, Boomer vs Turtle 86%, Economist vs Turtle 58% (all factions). The opening matters more than the faction.

### 10.4 Units (damage and killed value per 100 spent, 108 sides per faction)

Last Fist: Sniper 387, Hydra 333, Artillery 297 (427 trained), Titan 250, Tank 230, Aircraft 179, Heavy 164, Marine 162, Interceptor
157, Flame Tank 105, Leviathan 81 (26 trained in 22 sides, 5 kills). Bloomhost: Brood Tyrant 285, Ruinmaw 224, Spitter 222,
Ravager 168, Bulwark 146, Razorwing 138, Skitterling 124 (7,028 trained), Gorebore 117, Thornback 105, Bilecaster 104, Dreadthorn
86, Cloudwing 70, Needlewing 64, Leaper 36 (505 trained, 48 kills). Axiarchs: Worldbreaker 426, Shardstorm 368, Sovereign 304,
Lancer 264, Wraithwing 216, Marksman 166, Prismwing 165, Bastion 116, Eventide 115, Voidcarrier 96, Gravemantle 78, Shardling 74,
Parallax 71, Severance 68, Riftstalker 40 (571 trained, 551 lost). Tech Lab role never at T2 in 30 / 27 / 33 of 108 sides.

### 10.5 Loose ends from 6b

**Artillery hit rate on moving targets (R7: 70% → 51% with b6side).** Explained: it is the mirrored spacing of b6side (`ctlFree`'s
dir), not the update-order shuffle and not the Artillery (audit/sim/arthit6c.js, audit/logs-p1/arthit6c/arthit.txt). R7's targets
are side 1 under direct control, ordered to walk between two spots every 5 s. With b6side the spot search walks its rings as side
1's mirror image, which gives the unit every Artillery aims at a farther spot at each end: it never finishes a leg inside the 5 s
(standing still 13% of ticks → 0%, under a go order 84% → 100%; path per leg 171 → 195; 2 Tanks: 148 → 167). Shells aim where the
target is when they fire and fly about 1.3 s, so a target that is always walking is missed more (median aim-to-target distance at
landing 30 → 48). b6side on with the shuffle off: 51% (unchanged); b6side on with the spacing not mirrored: 67% (v2.91 70%); 2 Tanks
45% / 57% (v2.91 54%). A property of R7's walking pattern, not of the Artillery or the order fix.

**Slow suite:** run in full on v2.92: 15 of 15 passed (audit/logs-p1/pinned6c/slow-suite-v292.txt); the new slow counterparts 11 of 11. **Tests pinned to switches off:** see docs/FACTION_REWORK.md
"Batch 6c" and audit/logs-p1/pinned6c/pinned-tests.md.

### 10.6 Ranked list, updated (A1 plus the Test Range, audit/sim/b6c-range.js on v2.92, 10 seeds × both orientations)

1. **Axiarchs weakest** (32%, 24-42 balanced; 19% with their natural, Turtle-heavy pool; 7-25-4 on Two-Lane). Causes in the data:
   the Turtle personality (19% for the Axiarchs) and weak melee and divers (Shardling 74, Riftstalker 40, Parallax 71 per 100 spent).
   *Lever:* not in batch 6c's scope (the Turtle persona, the Axiarch Hard pool `kinds`). Reported only.
2. **Boomer opening dominates; Turtle and Economist lose** (71% vs 30% and 36%). *Lever:* the Turtle persona's dials (out of scope).
3. **Bastion barrier blocks direct fire too well.** Re-measured: Tanks + Marines need 2,230 with the barrier against 865 without
   (+158%); Lancers 825 against 495 (+67%). **Supported** for batch 6c by the Test Range, with a caution: the Axiarchs are the weakest
   faction in self-play, and Bastions do only 116 damage per 100 spent there; the change should stay within the target (+40-60%).
4. **Broods win the early game cost for cost.** Re-measured: broods beat equal-cost Marines 20-0 (keeping 64% of their value),
   Shardlings 20-0 (76%), Lancers 20-0 (80%). In self-play the Skitterling does 124 per 100 spent and Bloomhost is not dominant
   (44%); Bloomhost beats the Axiarchs 63%. **Supported** (the fights are lopsided at every seed).
5. **Divers trade badly.** Leaper 36, Riftstalker 40 damage per 100 spent in self-play (6b's Artillery preference changed little;
   they were 34 and 33 in 6a). Head-on against equal-cost Marines: Leapers already win 20-0, Riftstalkers lose 0-20. **Supported**
   (still clearly weak); the Leaper's lever (`LATCH.dps`) only acts on latched hosts, so it does not change the Marine fight.
6. **Leviathan.** 0.25× the pre-rework damage per second on every target (one Tank 26.3 → 6.8); 26 trained in 162 matches, 5 kills,
   81 per 100 spent. **Supported.**
7. **Top-tier air rare** (T3 aircraft in 18-25% of sides) and **the Tech Lab role skipped** (never T2 in 25-31% of sides): AI tech
   timing, out of scope.
8. **Last Fist strongest** (60%, 51-69), mostly through the Boomer (92%); against Bloomhost 57%. Not tuned (out of scope).
9. **Ranged backline value:** Worldbreaker 426, Sniper 387, Shardstorm 368, Hydra 333, Artillery 297 (6b's target of about 300 now
   met in self-play). The Needlewing (64) and Severance (68) are weak.

## 11. After batch 6c (v2.93): the HQ shield rule and the first unit tuning

The persona-balanced self-play of section 10 (162 Hard vs Hard matches, audit/sim/selfplay-6c.js) re-run with b6hq on and b6c off
(audit/logs-p1/selfplay6c-b0/) and with both on (audit/logs-p1/selfplay6c-b2/), 0 errors each; tables in each folder's report6c.md
(with 95% Wilson intervals) and report.md. Values and Test Range measurements: docs/FACTION_REWORK.md "Batch 6c".

### 11.1 Faction win rates

| faction | A1 (v2.92) | b6hq on, b6c off | both on (v2.93) |
|---|---|---|---|
| Last Fist | 65-34-9, 60% (51-69) | 67-34-7, 62% (53-71) | 70-25-13, 65% (55-73) |
| Bloomhost | 48-46-14, 44% (35-54) | 41-54-13, 38% (29-47) | 39-59-10, 36% (28-46) |
| Axiarchs | 35-68-5, 32% (24-42) | 40-60-8, 37% (29-46) | 37-62-9, 34% (26-44) |
| Last Fist vs Bloomhost (first named) | 31-14-9 | - | 39-8-7 |
| Last Fist vs Axiarchs | 34-20-0 | - | 31-17-6 |
| Bloomhost vs Axiarchs | 34-15-5 | - | 31-20-3 |
| side 1 share of decided | 49% (41-57) | - | 49% (41-57) |
| median length | 13:58 | 14:35 | 15:06 |
| ended by an HQ destroyed | 91% (148 of 162) | 91% (148) | 90% (146) |

Bloomhost (36%) and the Axiarchs (34%) are below 40% with both on; Last Fist (65%) above 60%. Per personality with both on: Boomer
68%, Economist 33%, Turtle 34%; Last Fist's Boomer 33-2-1. Per map with both on: the Axiarchs 53% on Classic, 25% on Two-Lane and
Three-Lane; Bloomhost 28% on Classic.

### 11.2 The tuned units (damage and killed value per 100 spent; trained; sides)

| unit | A1 | both on |
|---|---|---|
| Bastion | 116 / 31; 586; 91 | 112 / 29; 642; 98 |
| Skitterling | 124 / 31; 7,028; 108 | 82 / 25; 5,728; 108 |
| Leviathan | 81 / 2; 26; 22 | 144 / 8; 38; 25 |
| Leaper | 36 / 11; 505; 35 | 91 / 39; 1,021; 38 |
| Riftstalker | 40 / 14; 571; 31 | 74 / 28; 625; 29 |

Tier-3 units with both on (damage per 100 spent): Shardstorm 357, Worldbreaker 348, Titan 266, Brood Tyrant 246, Worldrender 245,
Sovereign 241, Ruinmaw 197, Leviathan 144, Voidcarrier 84, Cloudwing 57. Artillery 375 (297 in A1).

### 11.3 Ranked list, updated

1. **Last Fist strongest, Bloomhost and the Axiarchs below 40%** (65 / 36 / 34%). Last Fist's Boomer wins 92-94% of its matches;
   Last Fist beats Bloomhost 39-8-7. *Levers:* the personalities (next item), then Last Fist's economy opening, not units.
2. **The Boomer opening dominates every faction** (68%; Economist 33%, Turtle 34%), and the Axiarchs' Hard pool is two-thirds Turtle.
   *Lever:* the Turtle and Economist personas' dials and the per-faction `kinds` (src/sim/ai-presets.js).
3. **Divers still trade below the ranged units** (Leaper 91, Riftstalker 74 per 100 spent, from 36 and 40) and die before they
   deal more (more damage per hit measured no better). *Lever:* their survival (Riftstalker shields, the Leaper's health or leap
   timing), or their AI use.
4. **Bloomhost after the brood price:** Skitterlings 82 per 100 spent; Bloomhost 28% on Classic. Watch with the persona work.
5. **Axiarchs on the lane maps** (25% on Two-Lane and Three-Lane).
6. **Top-tier air still rare** (Leviathan 38 trained in 162 matches; T3 aircraft in a quarter of sides or fewer) and the Tech Lab
   role skipped by about a quarter of sides: AI tech timing.
7. **Ranged backline value:** Artillery 375, Shardstorm 357, Worldbreaker 348.
Done in 6c: the Bastion barrier (+53% to break with Tanks and Marines), brood fights (58-42 against equal-cost Marines), the
Leviathan (0.62-0.67 of its pre-rework damage per second).

## 12. After batch 6d (v2.94): the AI personality fix and faction balance

Persona-balanced self-play (audit/sim/selfplay-6c.js, 162 Hard vs Hard matches) on v2.93 (audit/logs-p1/selfplay6d-base/, identical
to 6c's both-on run), with b6ai on and b6d off (audit/logs-p1/selfplay6d-a3/) and with both on (audit/logs-p1/selfplay6d-b3/), 0
errors each; each folder has report6c.md (95% Wilson intervals), diag-a1.md (timings, income, army, spending per personality) and
diag-b1.md (curves, decision times, the damage matrix, per-unit damage per credit). Reports: selfplay6d-base/A1.md,
selfplay6d-a3/A3.md and B1.md, selfplay6d-b3/B3.md. Values and departures: docs/FACTION_REWORK.md "Batch 6d".

**Correction to section 10:** the Axiarchs' Hard pool is Boomer, Boomer, Turtle (since v2.43), not 1/3 Boomer, 2/3 Turtle; with the
true pools v2.93's normal-play figures are Last Fist 60% (47-72), Bloomhost 40% (26-55), Axiarchs 29% (18-44).

### 12.1 Personalities

| personality | v2.93 | b6ai on | both on |
|---|---|---|---|
| Boomer | 73-23-12, 68% (58-76) | 47-49-12, 44% (35-53) | 51-45-12, 47% (38-57) |
| Economist | 36-60-12, 33% (25-43) | 56-48-4, 52% (43-61) | 43-47-18, 40% (31-49) |
| Turtle | 37-63-8, 34% (26-44) | 47-53-8, 44% (35-53) | 49-51-8, 45% (36-55) |

### 12.2 Factions

| faction | v2.93 | b6ai on | both on | normal play, both on (equal pools) |
|---|---|---|---|---|
| Last Fist | 70-25-13, 65% (55-73) | 83-18-7, 77% (68-84) | 67-29-12, 62% (53-71) | 62% (53-71) |
| Bloomhost | 39-59-10, 36% (28-46) | 44-55-9, 41% (32-50) | 46-48-14, 43% (34-52) | 43% (34-52) |
| Axiarchs | 37-62-9, 34% (26-44) | 23-77-8, 21% (15-30) | 30-66-12, 28% (20-37) | 28% (20-37) |
| Last Fist vs Bloomhost (first named) | 39-8-7 | 43-7-4, 80% | 35-12-7, 65% (51-76) | |
| Last Fist vs Axiarchs | 31-17-6 | 40-11-3, 74% | 32-17-5, 59% (46-71) | |
| Bloomhost vs Axiarchs | 31-20-3 | 37-12-5, 69% | 34-13-7, 63% (50-75) | |
| side 1 share of decided | 49% | 49% (41-57) | 50% (42-58) | |
| median length | 15:06 | 15:21 | 16:34 | |
| ended by an HQ destroyed | 90% | 93% (87-96) | 88% (82-92) | |

Per map with both on: Last Fist 47 / 67 / 72% (Classic / Two-Lane / Three-Lane), Bloomhost 39 / 44 / 44%, the Axiarchs 50 / 17 / 17%.

### 12.3 The four b6d values (damage and killed value per 100 spent; trained)

| value | before → after | unit, b6ai on → both on |
|---|---|---|
| Salvage Yard share | 0.14 → 0.07 | Salvage 191 → 108 credits a minute per Last Fist side; Overdrive starts 14 → 0 |
| Tank damage | 42 → 32 | Tank 242 / 54 / 1,487 → 179 / 40 / 1,407 |
| Shardling health | 80 → 120 | Shardling 78 / 27 / 4,309 → 105 / 33 / 4,450 |
| Artillery salvo | 45 → 34 | Artillery 400 / 94 / 643 → 361 / 73 / 569 |

### 12.4 Ranked list, updated

1. **Axiarchs on the lane maps** (17% on Two-Lane and Three-Lane with both on; 50% on Classic). Their army peaks at about 15 units
   and is split across lanes. *Lever:* the Axiarch AI's lane play (`aiLanes`, `aiLanes3`: one army, one lane), not a unit value.
2. **Axiarch energy squeeze:** their units are 26% energy by cost (19% for the others) on the same Reactors; they bank 1,000+ credits
   for 22% of a match with production idle 44%. *Lever:* an Axiarch Reactor yield or the energy cost of the Lancer and Shardling.
3. **Last Fist still above 58%** (62%), mostly on the lane maps (67%, 72%) and against Bloomhost (65%): it wins the first field fight
   at 3:00-4:00 and the nodes with it. *Lever:* its early army (Marine and Heavy numbers) or node income, measured against Bloomhost.
4. **Divers** (Riftstalker 76, Leaper 107 per 100 spent with both on) and the Bilecaster (78) still trade below their role.
5. **Top-tier air rare and the Tech Lab skipped** by the batch 6d Turtle (by design) and often by others: AI tech timing.
6. **Ranged backline:** Artillery 361 per 100 spent (target about 300), Sniper 355, Lancer 270 (both on).
Done in 6d: the personalities (each 40-60%), Bloomhost into 42-58%, every pairing within 35-65%.

## 13. After batch 6e (v2.95): Axiarch lane play and energy, then Last Fist's early edge

Persona-balanced self-play (audit/sim/selfplay-6c.js, 162 Hard vs Hard matches, 0 errors each) after each part: b6elane on and
b6e off (audit/logs-p1/selfplay6e-a3/), b6e's cost conversion alone (selfplay6e-b2/), both on with the Riftstalker's shields
(selfplay6e-b3/), every switch on with the Marine at 48 (selfplay6e-c3/: the v2.95 default). Lane traces: lanes6e-base/ (v2.94)
and lanes6e-a3/; openings: early6e-c1/ and early6e-c3/. Each folder has report6c.md (95% Wilson intervals), diag-a1.md and
diag-b1.md; the part reports are lanes6e-base/A1.md, selfplay6e-a3/A3.md, selfplay6e-b2/B2.md, selfplay6e-b3/B2.md,
early6e-c1/C1.md and selfplay6e-c3/C3.md. Values and departures: docs/FACTION_REWORK.md "Batch 6e".

### 13.1 Factions

| faction | 6d (v2.94) | A: b6elane | B: + b6e (costs, Riftstalker) | C: + Marine 48 (v2.95) |
|---|---|---|---|---|
| Last Fist | 67-29-12, 62% (53-71) | 58-38-12, 54% (44-63) | 66-32-10, 61% (52-70) | 50-47-11, 46% (37-56) |
| Bloomhost | 46-48-14, 43% (34-52) | 38-58-12, 35% (27-45) | 37-57-14, 34% (26-44) | 47-47-14, 44% (35-53) |
| Axiarchs | 30-66-12, 28% (20-37) | 49-49-10, 45% (36-55) | 42-56-10, 39% (30-48) | 47-50-11, 44% (35-53) |

(The conversion alone, before the Riftstalker change: Last Fist 61%, Bloomhost 39%, Axiarchs 34% (26-44).)

Per map (Classic / Two-Lane / Three-Lane):

| faction | 6d | A | B | C (v2.95) |
|---|---|---|---|---|
| Last Fist | 47 / 67 / 72% | 47 / 61 / 53% | 50 / 64 / 69% | 31 / 53 / 56% |
| Bloomhost | 39 / 44 / 44% | 39 / 42 / 25% | 39 / 39 / 25% | 67 / 42 / 22% |
| Axiarchs | 50 / 17 / 17% | 50 / 39 / 47% | 47 / 39 / 31% | 44 / 44 / 42% |

Pairings (first named): Last Fist vs Bloomhost 65% → 65% → 65% → 46% (34-59); Last Fist vs the Axiarchs 59% → 43% → 57% → 46%
(34-59); Bloomhost vs the Axiarchs 63% → 48% → 46% → 46% (34-59). Side 1's share of decided matches at v2.95: 44% (36-52). Median
length 16:34 → 15:42; ended by an HQ 88% → 89%.

### 13.2 Personalities

| personality | 6d | A | B | C (v2.95) |
|---|---|---|---|---|
| Boomer | 47% (38-57) | 46% (37-56) | 45% (36-55) | 42-57-9, 39% (30-48) |
| Economist | 40% (31-49) | 42% (33-51) | 37% (29-46) | 47-55-6, 44% (35-53) |
| Turtle | 45% (36-55) | 46% (37-56) | 52% (43-61) | 55-32-21, 51% (42-60) |

### 13.3 The Axiarchs on the lanes and their bank

| | v2.94 | b6elane |
|---|---|---|
| top lane's share of the ground army (Two / Three-Lane) | 93% / 91% | 90% / 95% |
| value lost to units dying alone | 18% / 20% (others 4-6%) | 8% / 9% |
| warp point 400+ ahead of the army's middle | 35% / 45% of the time | 16% / 3% |

Credits / energy banked (median), Axiarchs: b6e off 790 / 117 at 4:00, 872 / 127 at 8:00, 624 / 232 at 12:00, 1,000+ credits 25%
of the match; b6e on 718 / 119, 363 / 167, 188 / 731, 15%. Energy share of their unit spending 25.9% → 20.0%.

### 13.4 Targets

| target | v2.95 | met |
|---|---|---|
| every faction 42-58% | 46 / 44 / 44% | yes |
| no pairing beyond 35-65% | 46 / 46 / 46% | yes |
| the Axiarchs 40%+ on each lane map | 44% Two-Lane, 42% Three-Lane | yes |
| every personality 40-60% | Boomer 39% (30-48), Economist 44%, Turtle 51% | no, by one point (the Boomer) |

### 13.5 Ranked list, updated

1. **Map spread:** Bloomhost 67% on Classic and 22% on Three-Lane; Last Fist 31% on Classic (both new at v2.95; 54 sides a map,
   intervals about ±13). *Lever:* measure first (per-map pairings, Bloomhost's Three-Lane losses with the new Axiarch lane AI: 5-10-3
   against them there at A3).
2. **The Boomer at 39%** (one point under its 40-60% band; 42-57-9). *Lever:* its attack timing against the batch 6d Turtle (the
   Turtle is 51%, 61% for Bloomhost).
3. **b6e's conversion costs the Axiarchs** (45% with b6elane alone, 34% with the conversion alone, 44% only with the Marine change
   beside it): credits are short and energy unspent from 8:00. *Lever:* a share near 24%.
4. **Every AI's base attack walks to the map's edge** on the lane maps when it has no push point (fixed for the Axiarchs only,
   `lane6eEnd`). *Lever:* the same end point for Last Fist and Bloomhost.
5. **Divers and backline** (both on): Riftstalker 120 damage per 100 spent, Leaper and Bilecaster (see diag-b1.md); Artillery 354,
   Sniper 331 (Part B's run).
6. **Sensitivity:** a 3-credit Marine change moved Last Fist 15 points: a value change changes every later AI decision, so each
   match becomes a new draw; 162 matches give intervals of about ±10 points per faction.
Done in 6e: every faction 42-58%, every pairing within 35-65%, the Axiarchs 40%+ on each lane map.

## 14. After batch 6f (v2.96): base attacks for every AI, the Axiarch prices undone, the maps

Persona-balanced self-play (audit/sim/selfplay-6c.js, 162 Hard vs Hard matches, 0 errors each) after each part: the v2.95
baseline with read-only edge counters (audit/logs-p1/selfplay6f-a0/, identical to 6e's run), b6fai on and b6f off
(selfplay6f-a/), both on (selfplay6f-b/), a rejected Bloomhost lane change (selfplay6f-d2-rejected/), the shipped press change
(selfplay6f-d2/), and the final confirmation: selfplay6f-d2 plus a second run with other seeds (`--seedBase 1000`,
selfplay6f-final2/), 324 matches together (selfplay6f-final/). Each folder has report6c.md (95% Wilson intervals); part reports
A.md, B.md, lanes6f-d1/D1.md (the map diagnosis, with a lane trace of the Part B matches), D2.md, REJECTED.md. Values and
departures: docs/FACTION_REWORK.md "Batch 6f".

### 14.1 Factions

| faction | v2.95 | A: b6fai | B: + b6f | D: + press6f (seeds 600+) | final, 324 matches |
|---|---|---|---|---|---|
| Last Fist | 50-47-11, 46% (37-56) | 48-49-11, 44% (35-54) | 51-48-9, 47% (38-57) | 52-43-13, 48% (39-57) | 108-81-27, 50% (43-57) |
| Bloomhost | 47-47-14, 44% (35-53) | 49-48-11, 45% (36-55) | 50-49-9, 46% (37-56) | 46-54-8, 43% (34-52) | 93-104-19, 43% (37-50) |
| Axiarchs | 47-50-11, 44% (35-53) | 49-49-10, 45% (36-55) | 49-53-6, 45% (36-55) | 49-50-9, 45% (36-55) | 90-106-20, 42% (35-48) |

(The second seed set alone: Last Fist 52%, Bloomhost 44%, Axiarchs 38% (29-47).)

Per map (Classic / Two-Lane / Three-Lane):

| faction | v2.95 | A | B | D | final, 324 |
|---|---|---|---|---|---|
| Last Fist | 31 / 53 / 56% | 31 / 50 / 53% | 31 / 53 / 58% | 42 / 53 / 50% | 47 (36-59) / 46 (35-57) / 57 (45-68)% |
| Bloomhost | 67 / 42 / 22% | 67 / 42 / 28% | 67 / 44 / 28% | 50 / 36 / 42% | 49 (37-60) / 42 (31-53) / 39 (28-50)% |
| Axiarchs | 44 / 44 / 42% | 47 / 47 / 42% | 53 / 39 / 44% | 53 / 42 / 42% | 49 (37-60) / 40 (30-52) / 36 (26-48)% |

Pairings (first named), final: Last Fist vs Bloomhost 56% (46-65), Last Fist vs the Axiarchs 44% (35-54), Bloomhost vs the
Axiarchs 54% (44-63). Per map, Last Fist vs the Axiarchs 39 / 39 / 56%, Bloomhost vs the Axiarchs 61 / 53 / 47%, Last Fist vs
Bloomhost 56 / 53 / 58%. Side 1's share of decided matches 49% (44-55). Median length 15:32 (Classic 10:12, Two-Lane 17:14,
Three-Lane 17:49); ended by an HQ 90%.

### 14.2 Personalities

| personality | v2.95 | A | B | D | final, 324 |
|---|---|---|---|---|---|
| Boomer | 39% (30-48) | 39% | 44% | 39% | 88-114-14, 41% (34-47) |
| Economist | 44% (35-53) | 44% | 44% | 46% | 97-97-22, 45% (38-52) |
| Turtle | 51% (42-60) | 53% | 52% | 51% | 106-80-30, 49% (42-56) |

Per faction (final): Bloomhost's Boomer 36% (26-48) and Economist 38% against its Turtle 56%; Last Fist's Economist 57%.

### 14.3 The edge, the Axiarch bank, the press rule

- Base attacks at the map's edge (Part A): 8 of 324 sides at v2.95 (Bloomhost 5, the Axiarchs 3 on Classic; the affected sides
  6-0-2); after b6fai none idle.
- The Axiarch bank at 12:00 (median credits / energy): 196 / 648 with b6e's conversion, 624 / 210 with b6f; energy 25.9% of their
  unit spending again.
- Last Fist against a Turtle on Classic: 0-12 (Part B) → 2-10 (press6f, seeds 600+); 6-16-2 over the 324.

### 14.4 Targets

| target | final (324) | met |
|---|---|---|
| every faction 42-58% | 50 / 43 / 42% | yes (the Axiarchs at the floor: 42%, 35-48) |
| every faction 35-65% on each map | 36-57% | yes (the Axiarchs on Three-Lane 36%, 26-48) |
| no pairing beyond 35-65% | 56 / 44 / 54% | yes |
| every personality 40-60% | 41 / 45 / 49% | yes |

### 14.5 Ranked list, updated

1. **The Axiarchs on the lane maps** (40% Two-Lane, 36% Three-Lane; 38% overall on the second seed set): the lowest cells and at
   the floor overall. *Lever:* their army falls behind from 12:00 on Three-Lane (D1: 3.0 nodes to 8.0 at 12:00); look at their
   node play under b6elane's single capture group before any value.
2. **Bloomhost's Boomer and Economist** (36% and 38%; its Turtle 56%). *Lever:* the Bloomhost Hard plans per personality.
3. **Last Fist's volume on Three-Lane** (57%; 71% of decided against the Axiarchs there): its Hard AI sells buildings for Habitats
   and fields 77-100 supply (army limit 120). *Lever:* the supply rule's cap on the big maps.
4. **Press attacks into a Turtle**: press6f moved Last Fist vs the Turtle on Classic only 0-12 → 2-10 (6-16-2 over 324); the map
   spread closed mostly elsewhere. *Lever:* the engage check for press attacks.
5. **Sensitivity** (6e's item 6 holds): one AI rule moved Bloomhost on Three-Lane 28 → 42% with no mechanism aimed there, and the
   two seed sets differ by up to 14 points a faction (the Axiarchs 45% → 38%). Read single 162-match runs as ±10 points.
Done in 6f: every faction 42-58%, every faction-map 35-65%, every pairing and personality in band (324 matches); the base-attack
end fixed for every AI; the Axiarch conversion undone; the player's default warp point beside the base.
