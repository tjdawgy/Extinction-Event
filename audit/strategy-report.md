# Phase 7b report: balance and the strategy triangle (v2.42)

**Result in one line:** the triangle exists in every faction (Rush beats Greedy 96–100%, Greedy beats Turtle 100%, Turtle beats Rush 58–100%, 24 matches per cell), faction shares are inside 40–60% both in identical play (Greedy vs Greedy: Last Fist 52.5%, Bloomhost 40%, Axiarchs 57.5%, was 97.5 / 32.5 / 20) and Hard vs Hard (42.5 / 58.8 / 48.8, was 84 / 35 / 31), and the re-tuned Hard varies its opening, adapts after scouting and beats Greedy 83 / 71 / 88% and Default 95 / 97.5 / 90%. **Not met:** Bloomhost has 2 viable openings and 1 viable mid-game branch in the mixed field (target 3 each). Six tuning rounds were used; round 6 aimed at Bloomhost, broke its triangle and was reverted.

**Targets:**

| Target | Result | Met? |
|---|---|---|
| Faction shares 40–60%, Greedy vs Greedy | 52.5 / 40 / 57.5% | Yes |
| Faction shares 40–60%, Hard vs Hard | 42.5 / 58.8 / 48.8% | Yes |
| Rush > Greedy, Greedy > Turtle, Turtle > Rush ≥55% per faction | LF 96/100/100, BH 100/100/92, AX 100/100/58 | Yes |
| ≥3 viable openings per faction (≥40% vs field), none above ~60% | LF 5, BH 2, AX 4; overall top 61.8% | LF, AX only |
| ≥3 viable mid-game branches per faction | LF 3, BH 1, AX 3 | LF, AX only |
| A correct defender breaks a light Contain ≥60% | 100 / 62.5 / 87.5% | Yes |
| A heavy Contain with a clear lead still wins | 100 / 100 / 62.5% | Yes |
| 2–3 nodes beat 1, with risk | 72% (2) and 60% (3) vs 34% (1) at 4:00 | Yes |
| Signature buildings a net gain in some strategies | Yard, Depot, Beacon in Timing or Contain games | Yes |
| Hard ≥70% vs Greedy, ≥75% vs Default per faction | 83/71/88%, 95/97.5/90% | Yes |
| Hard varies its opener and punishes greed it sees | 3/2/2 openings per faction; `adapt`, `punish` | Yes |
| Easy and Normal near their current difficulty | vs Greedy unchanged; vs a Rifleman rush Normal now loses 1 in 3 | Mostly (see Hard) |

**Method:**
- Every number comes from the harness playing the real SIM (index.html) on Hard rules, seeded, with a 30-minute cap. Raw logs: `audit/logs7b/` (a file per run, named in each table).
- The diagnosis (step 1) is in `audit/strategy-diagnosis.md`.
- Experiments ran as code injected into a copy of the file (`--code`, `EE_HTML`); the final numbers live in index.html's `BALANCE7B` block. A check match played identically both ways (same winner, length and units trained).
- **Noise, measured:** scripted bots are deterministic per seed, but the match RNG also feeds things the bots don't control (unit spread, shot timing, the AI preset's opening roll for the idle AI slot). Changing only that roll moved the Axiarch Turtle-vs-Rush cell from 7–1 to 3–5. Treat an 8-match cell as ±3–4 wins; the final triangle uses 24 matches per cell.
- **Budget:** six tuning rounds (below). Bot fixes between rounds are listed separately: a bot bug changes the measurement, not the game.

## The bots (step 2)

`audit/sim/strat.js`, run by `audit/sim/stratrun.js`. Like the phase 7a Greedy bot, a strategy bot plays only through the player's controls (build, upgrade, sell, train, stance, Regroup flag, abilities) and sees only what its side sees.

**Openings** (first ~3–4 minutes):

| Opening | Build | Army |
|---|---|---|
| **Greedy** | three Refineries, Barracks, Reactor, Habitat; every Refinery to T2 | one node runner until 2:30 (or until attacked) |
| **Rush** | Barracks, Refinery, Barracks, Habitat, Refinery (Last Fist: the Barracks to Mass Deployment, Riflemen in pairs) | the basic unit nonstop; at ~400 of army it forms up just outside the enemy guns, then goes in together and keeps streaming |
| **Turtle** | Barracks, Refinery, a Turret on the front pad, Reactor, Refinery, Habitat, Refinery; HQ to T2 first, then the Turret | basic and vehicle units held under its guns; fights whatever enters its cover |
| **Contain** | Barracks, two Refineries, a second Barracks, Reactor, Habitat | at ~450 of army it parks just outside the enemy HQ gun's and Turrets' reach; every new unit joins it; all in once 2.5× its parking value or twice what it sees |
| **Standard** (the containment tests' defender) | Barracks, two Refineries, Reactor, Habitat, a third Refinery | a small army from the start |

**Mid-game branches** (from the end of the opening):

| Branch | Economy and tech | Army | Attacks |
|---|---|---|---|
| **Timing** | three Refineries, War Factory | basic ×3, Barracks T2 ×2, vehicle ×2, Factory T2 ×1 | gathers short of the middle node; at 2,000 of army forms up outside the enemy guns and goes in |
| **Contain** | two Barracks, War Factory | as Timing | parks outside the enemy guns, reinforced steadily (as the Contain opening) |
| **Tech** (turtle into tech) | a Turret, two Reactors, HQ to T3, the siege path to T3 | T2 and T3 infantry, vehicles, Titan-class units | stays home until its army limit (or 12:00), then 3,000 of army |
| **Air** | two Tech Labs | flyers ×3, T2 and T3 flyers, a small ground escort | at 2,200 |

Paths per faction are in `PATHS` (Last Fist Specialists/Assault/Air Power, Bloomhost Acidic/Predator/Apex, Axiarchs Lattice/Dominion/Ascendant; the tech branch takes Siege, Siege Evolution, Rupture).

**Defence** (every bot): enemies within 750 of its HQ → it holds deep in its base (110 out); anything that comes inside its cover (420) is engaged, melee units included; once its army near home is 1.3× what it sees it breaks out together (a turtle only within its Turret's cover until mid-game); 2.5× and over 1,200 → counter-attack. The **naive** defence (the Greedy bot's: retreat to the rally flag and fight from there) is kept for the containment tests.

**Bot fixes made during the rounds** (each found by tracing a match; none changes the game):
- The Turtle and Rush openings starved their own build orders (units spent the credits the next building needed); then the Turtle's units spent the energy its Turret needed (Axiarchs). Budgeting per building, a minimum army for the Turtle.
- The Turtle's Turret went on the first free pad (behind the HQ); now on the front pad, as the AI does.
- Melee defenders on a Regroup flag never engaged (a flag disables chasing); now the defender orders its units onto attackers inside its cover.
- Attacks walked in strung out; every attack now forms up just outside the enemy guns first.
- A bot on side 1 started on the AI's Retreat stance (which holds fire); it now starts on Hold, like the player.
- The Turtle-tech branch never attacked (matches ran to the storm); it now leaves home at its army limit or 12:00.

## The changes (step 3)

All numbers, in `BALANCE7B` (index.html). `setBalance7b(false)` restores every v2.41 value (tests/strategy.test.js checks each patch both ways); `setBalance(false)` still gives v2.38. No mechanic changed.

| # | Change | Before → after | Reason |
|---|---|---|---|
| **Greed has a cost** | | | |
| 1 | Refinery cost | 150 → 175 | pays back in 44 s instead of 37.5 |
| 2 | Refinery build time | 10 → 13 s | three Refineries finish later, a rush has a window |
| 3 | Refinery HP | 520 → 420 (Axiarchs 416+156 → 336+126 shields) | a rush that reaches the economy kills it |
| **The HQ gun by tier** | | | |
| 4 | HQ gun damage T1 / T2 / T3 (all three factions) | 32 / 42 / 55 → 16 / 48 / 62 | T1 can't hold a base alone (greed is risky); T2 and T3 are a paid defence (a turtle's investment) |
| **Defence in time** | | | |
| 5 | Turret cost | 200 + 50 energy → 150 + 40 | a defender can answer pressure |
| 6 | Turret build time | 12 → 9 s | up before the attack lands |
| 7 | Turret HP | Turret 900 → 1,300; Maw 1,000 → 1,400; Null Lance 720+270 → 1,040+390 | swarms killed the tower before it paid off |
| 8 | Maw damage T1 / T2 / T3 | 16 / 22 / 29 → 22 / 26 / 33 | Bloomhost's Turtle lost every match to a Skitterling rush |
| 9 | Null Lance damage T1 / T2 / T3 | 30 / 20 / 92 → 55 / 24 / 120 | the single beam couldn't hold Shardlings; the upgrades stay upgrades |
| **Nodes** | | | |
| 10 | Field node income | 3 credits + 1 energy → 4 + 1.5 | a node worth fighting for |
| **Last Fist** | | | |
| 11 | Rifleman cost | 50 → 45 | Last Fist's rush (2 of 8 wins against Greedy → 8 of 8) |
| 12 | Rifleman damage | 7 → 6.5 | it trades less well in a long contain |
| ~~13~~ | ~~Rifleman range~~ | ~~120 → 110~~ (round 6, reverted) | tried: a Rifleman line no longer out-reaching melee defenders |
| 14 | Heavy cost | 125 + 35 → 135 + 40 | 2.09 value killed per value lost against Bloomhost |
| 15 | Tank cost | 260 + 60 → 280 + 70 | won every duel against Bloomhost and Axiarch ground units but the Bastion |
| 16 | Flame Tank damage against vehicles | ×0.35 → ×0.2 | beat Bulwarks at equal value (65% kept); now an infantry specialist |
| **Bloomhost** | | | |
| 17 | Skitterling HP | 60 → 66 | |
| ~~18~~ | ~~Skitterling speed~~ | ~~52 → 58~~ (round 6, reverted) | tried: melee reaching a ranged line sooner; it made the Skitterling rush unbeatable for a Turtle |
| 19 | Bulwark HP, damage | 760, 26 → 840, 28 | |
| ~~20~~ | ~~Bulwark cost~~ | ~~150 + 30 → 140 + 25~~ (round 6, reverted) | |
| 21 | Spitter cost, range | 80 + 25, 150 → 70 + 20, 165 | its ranged unit can answer a contain |

Last Fist keeps every piece of its identity: Salvage untouched (7%, the Yard 14%), cheap Riflemen, the Tank still beats every Bloomhost ground unit at equal value. Emergency Brood is untouched. The Mite's stats are fixed at load from the v2.41 Skitterling (24 HP), so the Skitterling HP change doesn't reach it.

**The six rounds** (Greedy vs Greedy shares are Last Fist / Bloomhost / Axiarchs; triangle cells R>G, G>T, T>R per faction, 8 matches each unless noted):

| Round | Numbers | GvG | Triangle | What it showed |
|---|---|---|---|---|
| 0 (v2.41) | | 98 / 33 / 20 | Rush>Greedy 0–8, 0–8, 4–8 (n=12) | greed safe |
| 1 | 1, 2, 5, 6, 10, 15, 16, 17, 19 (HP), 21 (cost), 12; HQ T1 22 | 63 / 35 / 53 | Rush>Greedy LF 0%, BH/AX 62.5%; Greedy>Turtle 100% | the HQ change alone swung GvG (LF 83/BH 25); economy changes balanced it |
| 2 | HQ T1 12, Refinery HP | — | BH/AX Rush 100%, LF 12.5%; Turtles fold | HQ T1 too weak, the Turtle bot bugs (fixed) |
| 3 | HQ T1 16, Rifleman 45, Turret HP, Maw/Lance T1 | 63 / 35 / 53 | LF and BH met; AX Turtle>Rush 50% | |
| 4 | + Spitter range, Heavy cost, Bulwark damage | **53 / 40 / 58** | **all three met** | contain and signature-building sets on these numbers |
| 5 | + Maw and Null Lance T2/T3 | (as 4: the Greedy bot builds no Turret) | all three met (`tri-r5`) | field run on these numbers |
| 6 | + Skitterling speed, Bulwark cost, Rifleman range | 53 / 45 / 53 | Turtle>Rush broke: BH 7–17, AX 10–14 (24 each) | **not shipped**: reverted |

**What ships: round 5.** Round 6 improved Greedy vs Greedy (Bloomhost 40 → 45%) but its faster Skitterlings broke Bloomhost's Turtle-vs-Rush (and the Axiarch cell, whose numbers didn't change, shows how noisy 8-match cells are). Both configurations were measured; round 5 meets more targets, so the three round-6 numbers (rows 13, 18, 20 below) were taken back out. The budget is spent, so no further round was tried.

**Rows 13, 18 and 20 in the table above are round 6's and are not in v2.42.**

## Faction shares before and after

**Greedy vs Greedy** (greedy.js, the phase 7a bot, identical play; 10 seeds × both sides per pairing; `gvg-all-variants.txt`, rows `base` and `v8`; the Greedy bot builds no Turret, so round 5's Turret tiers don't touch it). Round 6, not shipped: 52.5 / 45 / 52.5 (`gvg-r6.txt`).

| Pairing | v2.41 | v2.42 |
|---|---|---|
| Last Fist vs Bloomhost | 20–0 | 14–6 |
| Last Fist vs Axiarchs | 19–1 | 7–13 |
| Bloomhost vs Axiarchs | 13–7 | 10–10 |
| **Shares** | **LF 97.5%, BH 32.5%, AX 20%** | **LF 52.5%, BH 40%, AX 57.5%** |

A caution: in bot-vs-bot cross-faction games the side matters (side 0 won most close pairings, `diag7b-v3` per seed), so every pairing plays each seed from both sides.

**Hard vs Hard** (40 paired per pairing, `validate-after.txt`): **Last Fist 42.5%, Bloomhost 58.8%, Axiarchs 48.8%** (v2.41: 84 / 35 / 31). Details under Hard.

**The mixed field** (all openings × branches, cross-faction, round 5 numbers, `field-fin.txt`): Last Fist 73.8%, Bloomhost 23.8%, Axiarchs 52.5%. Not one of the stated targets, but the clearest remaining imbalance (see the field section).

## The triangle (same faction on both sides)

24 matches per cell: 8 seeds (97000+, `tri-r5.txt`) and 16 fresh ones (97100+, `tri-r5b.txt`), each from both sides. Before: v2.41 with the same final bots (`tri-before.txt`) (8 per cell): Rush > Greedy 0–8 / 0–8 / 5–3, Greedy > Turtle 8–0 ×3, Turtle > Rush 8–0 / 4–4 / 0–8. So before, greed was safe for Last Fist and Bloomhost, and the Axiarch Turtle lost to Rush.

| Faction | Rush beats Greedy | Greedy beats Turtle | Turtle beats Rush | Target ≥55% each |
|---|---|---|---|---|
| Last Fist | **23–1 (96%)** | **24–0 (100%)** | **24–0 (100%)** | met |
| Bloomhost | **24–0 (100%)** | **24–0 (100%)** | **22–2 (92%)** | met |
| Axiarchs | **24–0 (100%)** | **24–0 (100%)** | **14–10 (58%)** | met (narrowly) |

Contain against the three (same runs):

| Faction | Contain vs Greedy | Contain vs Turtle | Contain vs Rush |
|---|---|---|---|
| Last Fist | 3–21 (13%) | 11–13 (46%) | 19–5 (79%) |
| Bloomhost | 21–3 (88%) | 24–0 (100%) | 6–18 (25%) |
| Axiarchs | 0–24 (0%) | 4–20 (17%) | 22–2 (92%) |

- The triangle is **steep**: the winning side of each pair wins almost always. Between scripted bots that is expected (each plays its plan with no adaptation), but it means the counter is real: a greedy opening that meets a rush loses, a rush into a Turret loses, a Turret against greed loses on economy.
- **Contain is a fourth, faction-dependent style:** Bloomhost's Skitterling contain behaves like a rush (it beats Greedy and Turtle, loses to Rush); the Axiarchs' only beats Rush; Last Fist's beats Rush and splits with Turtle.
- Round 6 (not shipped) broke Turtle>Rush: Bloomhost 7–17, Axiarchs 10–14 over the same 24 seeds (`tri-r6.txt`, `tri-r6b.txt`).

## Openings and mid-game branches against the field

`stratrun.js --set=field`: every opening × branch (5 × 4 bots) against a sampled field bot, all nine faction pairings, each seed from both sides (round 5 numbers, 360 matches, `field-fin.txt`).

**Openings vs the field:**

| Opening | All factions | Last Fist | Bloomhost | Axiarchs |
|---|---|---|---|---|
| Rush | 46.5% | 68.8% | 12.5% | 58.3% |
| Greedy | 61.1% | 70.8% | 50.0% | 62.5% |
| Turtle | 28.5% | 43.8% | 8.3% | 33.3% |
| Contain | 61.8% | 87.5% | 52.1% | 45.8% |
| Standard | 52.1% | 58.3% | 39.6% | 58.3% |
| **Viable (≥40%)** | 4 of 5 | 5 | 2 (Standard 39.6) | 4 |

**Branches vs the field:**

| Branch | All factions | Last Fist | Bloomhost | Axiarchs |
|---|---|---|---|---|
| Timing | 50.0% | 76.7% | 30.0% | 43.3% |
| Contain | 25.6% | 38.3% | 16.7% | 21.7% |
| Tech | 74.4% | 85.0% | 45.0% | 93.3% |
| Air | 50.0% | 63.3% | 38.3% | 48.3% |
| **Viable (≥40%)** | 3 of 4 | 3 | 1 | 3 |

- **Openings: met for Last Fist and the Axiarchs (5 and 4 viable), not for Bloomhost (2; Standard at 39.6%).** No opening is far above 60% overall (Greedy 61.1%, Contain 61.8%); per faction, Last Fist's Contain (87.5%) is.
- **Branches: met for Last Fist and the Axiarchs (3 each), not for Bloomhost (1: Tech).** The Contain branch is weak for everyone (parking an army next to Turrets and a T2 HQ gun bleeds it); Tech is too strong (74.4%): it never attacks until its army is maxed, and the other bots' attacks die on its Turrets.
- **Faction strength in the mixed field:** Last Fist 73.8%, Bloomhost 23.8%, Axiarchs 52.5%. Identical play (Greedy vs Greedy) is balanced; mixed play is not. The field is mostly basic units (the bots' spare money buys the basic unit), and a Rifleman line still out-trades Skitterlings there. Round 6 aimed at exactly this and broke the triangle.
- Caveat: one seed per side per cell (360 matches); per-faction cells have 48–60 matches.

## Containment

`stratrun.js --set=contain`, same faction on both sides, 8 matches per cell:
- **Light Contain:** the Contain opening (parks at ~450) against a Standard opening.
- **Heavy Contain:** a greedy economy that parks at 1,200, against a Standard opening that earns 30% less (a controlled, clear army lead).
- **Correct defence (`break`):** hold deep under the HQ gun, fight inside the base, break out together when 1.3× stronger. **Naive:** the Greedy bot's retreat to the rally flag.

| Faction | Light Contain vs correct defence | Light vs naive | Heavy Contain (clear lead) vs correct defence | Heavy vs naive |
|---|---|---|---|---|
| Last Fist | **defender 8–0** | Contain 3–5 | **Contain 8–0** | Contain 8–0 |
| Bloomhost | **defender 5–3** | Contain 8–0 | **Contain 8–0** | Contain 8–0 |
| Axiarchs | **defender 7–1** | Contain 5–3 | **Contain 5–3** | Contain 8–0 |

(`contain-v8c.txt`, round 4 numbers; neither side of these cells builds a Turret, so round 5's Turret tiers don't touch them.)

- **Targets met:** a correct defender breaks a light Contain 100% / 62.5% / 87.5% (≥60%), and a heavy Contain with a clear lead still wins 100% / 100% / 62.5%.
- **The naive defence still loses to a light Contain** for Bloomhost (0–8) and the Axiarchs (3–5): sitting at the rally flag is still the wrong answer, so the player has to defend correctly. That is the intent (a skill, not a free win), but see proposed change 1.
- **Before** (v2.41, same bots): a correct defender broke a light Contain 8–0 / 7–1 / 7–1 and a heavy Contain won 8–0 / 8–0 / 2–6 (`contain-before.txt`). So the correct defence already worked against these bots in v2.41; what changed is the AI (`breakout`), which in v2.41 trickled out (the problem you saw), and the Axiarchs' heavy Contain, which now wins.

**What the AI does now (`breakout`, Hard):** an enemy army camped within 750 of its HQ (remembered for 15 s, since holding deep loses sight of it) that its army near home doesn't beat by 1.4×: it rallies 140 out from its HQ (inside the gun's cover), pulls a non-siege push back, makes no push, and builds a Turret on the front pad 5 s after the pressure starts (two against a camp worth 900+), even while other buildings are going up. Once 1.4× stronger it goes out together at the camp. tests/strategy.test.js stages this.

## Nodes

- **Field run** (`nodes7b.js`, 360 matches): nodes held at 4:00 → win rate: 0 nodes 38%, 1 node 34%, **2 nodes 72%, 3 nodes 60%**. At 6:00: 0 → 33%, 1 → 39%, **2 → 68%, 3 → 68%**. The side with more node-seconds over the match won 267 of 324 decided matches with a clear gap.
- **Controlled** (`nodes` set, a greedy timing bot that stops at 1, 2 or 3 nodes, 8 matches per cell): 3 nodes beat 1 in Last Fist (7–1) and Bloomhost (8–0), 4–4 for the Axiarchs; 2 vs 1 was mixed (LF 7–1, BH 1–7, AX 0–8): the 1-node bot also gathers its army on its own node, closer to home, so this set mixes node income with army position. 3 vs 2 was 4–4 in all three factions.
- **Risk:** the third node sits half under the enemy HQ gun, and holding three at 4:00 wins less often (60%) than holding two (72%): reaching for the third costs units.

## Signature buildings

`stratrun.js --set=sig` (round 4 numbers, no signature-building change): each opening/branch with signature building A or B (taking the branch's last pad, from 4:00) against the same bot without, same faction, 8 matches each:

| | Greedy/Timing A | B | Turtle/Tech A | B | Contain A | B | Greedy/Air A | B |
|---|---|---|---|---|---|---|---|---|
| Last Fist (Salvage Yard / Depot) | **8–0** | **7–1** | 5–3 | 3–5 | **6–2** | 3–5 | 5–3 | 4–4 |
| Bloomhost (Brood Mound / Rootheart) | 4–4 | 4–4 | 5–3 | 5–3 | 4–4 | 5–3 | 3–5 | 3–5 |
| Axiarchs (Phase Beacon / Echo Reliquary) | 4–4 | 4–4 | 0–8 | 0–8 | **7–1** | 3–5 | 4–4 | 4–4 |

- **Net gains:** the Salvage Yard in a Greedy/Timing or Contain game, the Fortification Depot in Greedy/Timing (it bunkers the nodes a timing player holds), the Phase Beacon with a Contain (the bubble sits on the parked army).
- **Why now:** the pad's alternative got dearer (a Refinery costs 175 and pays back slower) and nodes pay more (bunkered nodes).
- **Net losses:** the Axiarch buildings in a Turtle/Tech game (0–8: they replace its second Reactor, and the Axiarchs are energy-hungry).
- Bloomhost's are close to neutral everywhere. No signature-building number changed (none was needed to meet the target); ideas are below.

## Hard (re-tuned)

**Search** (`hardsearch7b.js`, `logs7b/hardsearch1.txt`; round 5 numbers): each candidate opening (all Hard rules on, plus `breakout`, `adapt`, flood 0.4) against Greedy of all three factions (12), the Default field (10 paired) and the Rush, Turtle and Contain bots of all three factions (18):

| Opening | Last Fist (Greedy / Default / bots) | Bloomhost | Axiarchs |
|---|---|---|---|
| Boomer | 100 / 100 / 100 | 92 / 100 / 72 | 58 / 100 / 94 |
| **Boomer + punish** | **100 / 100 / 100** | **92 / 100 / 78** | **75 / 100 / 89** |
| Economist | 75 / 100 / 83 | 33 / 100 / 44 | 42 / 90 / 78 |
| Turtle | 75 / 60 / 72 | 42 / 90 / 61 | **83 / 80 / 89** |
| Aggressor | 33 / 80 / 33 | 8 / 60 / 28 | 25 / 50 / 11 |

**New Hard settings** (`AI_PRESETS.hard`):

| Faction | Openings (one picked per match) | Reaction | Other |
|---|---|---|---|
| Last Fist | Boomer 50%, Economist 25%, Turtle 25% | 0.6 | no signature building, flood 0.4 |
| Bloomhost | Boomer 75%, Turtle 25% | 1.0 | |
| Axiarchs | Turtle 67%, Boomer 33% | 0.6 | |

- **Rules:** v2.41's `HARD_FIX` plus `breakout`, `adapt` and `punish` (`HARD_FIX_7B`).
- **How it picks and adapts:**
  - The opening is rolled per match from the list (no information used).
  - Its scout (`read`, from 0:35) then reads the opponent and **adapts** (`adapt`): Turrets seen → one more Refinery (greed out-scales a turtle); an early army of 250+ before 3:00 that outnumbers its own → a Turret on the front pad at once; a greedy opening (3+ economy buildings, an upgraded Refinery or two nodes with a small army) → army first and the timed **punish** attack (on again: the new numbers make it pay, +17 points against Greedy for the Axiarchs, equal or better elsewhere).
  - **Flame Tanks:** the flood share that sends the War Factory down the Assault path and favours splash is a dial, `flood`; Hard uses 0.4 (v2.41: 0.55, which a mixed army never reached).
- v2.41's Hard is kept as `hard241`.

**Validation** (the final file, seeds the search never used, `validate-after.txt`; v2.41 columns from phase 7a's validation on the same seeds and match counts, `audit/logs7a/validate.txt`):

| | v2.41 Hard (v2.41 numbers) | v2.42 Hard (v2.42 numbers) | Target |
|---|---|---|---|
| vs Greedy, Last Fist | 33–9 (79%) | **35–7 (83%)** | ≥70% |
| vs Greedy, Bloomhost | 21–21 (50%) | **30–12 (71%)** | ≥70% |
| vs Greedy, Axiarchs | 25–17 (60%) | **37–5 (88%)** | ≥70% |
| vs Default, Last Fist | 39–1 | **38–2 (95%)** | ≥75% |
| vs Default, Bloomhost | 40–0 | **39–1 (97.5%)** | ≥75% |
| vs Default, Axiarchs | 38–2 | **36–4 (90%)** | ≥75% |
| vs Rush, Turtle, Contain bots (all factions, 2 seeds × both sides) | — | **LF 18–0, BH 15–3, AX 18–0** | |

- Against a Last Fist Greedy, Bloomhost and Axiarch Hard now win 8–6 and 11–3 (v2.41: 1–13 each).
- Bloomhost's 71% is the narrowest pass; its three losses to bots are all against a Contain (3–3).
- **Openings Hard picks** (300 rolls each): Last Fist Boomer 164, Economist 69, Turtle 67; Bloomhost Boomer 220, Turtle 80; Axiarchs Turtle 209, Boomer 91.

**Hard vs Hard** (40 paired per pairing, seeds 77000+):

| Pairing | v2.41 | v2.42 |
|---|---|---|
| Last Fist vs Bloomhost | 34–6 | 15–25 |
| Last Fist vs Axiarchs | 33–7 | 19–21 |
| Bloomhost vs Axiarchs | 22–18 | 22–18 |
| **Shares** | **LF 84%, BH 35%, AX 31%** | **LF 42.5%, BH 58.8%, AX 48.8%** |

All three inside 40–60%. **But in Hard vs Hard Last Fist moved from top (84%) to bottom (42.5%)**, which brushes against the "no faction swings from top to bottom" rule. The other two measures disagree: with identical play Last Fist is in the middle (52.5%), and in the mixed bot field it is still on top (73.8%). So the faction balance now depends on how a faction is played more than on the faction; I read that as no overcorrection overall, but Last Fist's Hard AI (its Boomer/Economist/Turtle mix) is the first thing to watch in playtests.

**Easy and Normal:** their AI (the Default preset) has none of the new rules, so they play the v2.41 AI on the new numbers. Against the Greedy bot (3 × 3 pairings, 6 seeds each, `validate-after.txt`, before: `validate-before-easynormal.txt`): Normal 1–53 before and after, Easy 0–54 before and after: the Greedy bot beats both as before. **Against the phase 5 Rifleman rush** (`rush.js`, Normal, 12 per faction, `rush-normal-before-after.txt`) the Normal AI now loses 4 of 12 in every faction (v2.41: 0 of 12; median rush win 5:40–5:52). That is the triangle at work (a rush can now hurt an economy-first AI), and it makes Normal somewhat easier for a player who rushes. The Default AI's replays on v2.41's numbers still hash as v2.40 (tests/hardhuman.test.js).

## Proposed mechanic changes (not implemented)

1. **A rally point inside the HQ gun's cover by default** (or a player-set rally flag). The rally flag sits 300 out, 90 short of the gun's reach; every new unit walks out to the edge of the base. The AI's `breakout` works around it with its own defend point; a player has to place Regroup flags by hand.
2. **Melee "hold" that still engages inside a radius.** On Hold or a Regroup flag, melee units never chase, so Bloomhost and Axiarch defenders can't defend a spot without walking out. A short engage radius (60–80) on Hold would let them.
3. **The third node: cover it or move it.** The far node is half under the enemy T1 HQ gun. Either push it fully inside the gun (a defender's node is safe, nodes become 2+1) or out of it (3 contestable nodes). Today it rewards the containing side.
4. **Signature buildings off the pad budget** (a ninth pad, or a sig slot), so they are an investment, not a lost Refinery. Then their numbers can be tuned on their own merit.
5. **A Turret that scales with HQ tier** (or HQ upgrades that also upgrade Turrets), so a turtle's tech path is one coherent investment.
6. **Production-building HP and a rebuild rule for the AI**, so a rush that kills a Barracks has lasting effect without the HQ gun deciding everything.

## Verdict: strategic variety and replayability

**Better than v2.41, not finished.**
- **What changed for real:** greed now carries risk. In v2.41 a rush won 5 of 24 against a greedy opening (the final bots, `tri-before.txt`); now it wins 71 of 72. A Turret on the front pad is now the answer to a rush (Turtle beats Rush 60 of 72), and greed beats a turtle on economy (72 of 72). A player has to scout to know which side of the triangle they're on, and Hard does that now: its opening varies (Last Fist three ways, Bloomhost and the Axiarchs two) and its scout changes its plan (a Turret against an early army, more economy against a turtle, a timed punish against greed).
- **Containment is answerable:** a correct defence breaks a light contain, Hard no longer trickles units into one, and a contain backed by a clear lead still wins.
- **Nodes matter** (two nodes at 4:00 win 72%), and the third costs units.
- **Faction identity held:** Last Fist is still the cheap-infantry, Salvage, brute-force faction (its Riflemen are cheaper, its Tank still wins its duels); Bloomhost's swarm and the Axiarchs' shields are untouched mechanically.
- **What is still thin:**
  - The triangle is steep (most cells 90–100%), so a match is often decided by the two openings; scouting matters, but the mid-game rarely turns a lost opening around.
  - Bloomhost has few viable plans in mixed play, and Last Fist is still strongest there. The tech branch is too safe and the contain branch too costly, partly because of how the bots play them.
  - Some of the remaining problems are geometry and rules, not numbers (proposed changes above), and Last Fist's Hard dropped further than its faction did.
- **Replayability:** up from "one opener for everyone" to a real rock-paper-scissors at the opening and two or three workable plans per faction (one for Bloomhost) in the mid-game. Playtests should check whether the steep triangle feels like a guessing game; if so, softening it (a cheaper first Turret, or a slightly stronger T1 HQ) is the next lever.

## Tests

- **Automated:** `npm test` 366 of 367 under load (`logs7b/npm-test-1.txt`; the failure was the browser "GET READY" timing test, 4 s, run while simulations loaded the CPU; on an idle machine tests/browser.test.js passed 24 of 24); final run on an idle machine: **367 of 367 passed** (`logs7b/npm-test-final.txt`).
- **New:** tests/strategy.test.js (the `BALANCE7B` switch both ways and its texts, the rules off in Default and on in Hard, `hard241`, the opening variety, a staged `breakout` defence, full bot matches).
- **Updated:** tests that pin v2.41 numbers for a mechanic now call `setBalance7b(false)`: ax-abilities, bloomhost-sig, fog, regression, trees, tactics (v2.39 replays), determinism (balance-on fingerprints), hardhuman (Default replays, still identical to v2.40). hardhuman's Hard-preset test checks the opening list and the new rules; its Greedy-match test expects 150 credits by 0:30 (Refineries now take 13 s).
- **Intermittent, pre-existing:** tests/fog.test.js "AI siege under fog" is unseeded; it failed 1 of 6 runs on v2.41's index.html as well. tests/redesign.test.js "P11 Worldrender" (unseeded) as noted in 7a.
- **Simulation:** the matrices above, all logged in `audit/logs7b/`.
- **Browser:** no new UI. The changed texts (HQ gun, Maw and Null Lance descriptions, the node toast) follow the live numbers; checked in the SIM (tests/strategy.test.js), not by eye in a browser.
- **Not verified:** play by a human. The bots are scripted styles; the steepness of the triangle and Bloomhost's options need playtests.
