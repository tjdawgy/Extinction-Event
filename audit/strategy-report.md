# Phase 7b report: balance and the strategy triangle (v2.42)

**Result in one line:** PENDING_SUMMARY

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
| 13 | Rifleman range | 120 → 110 (round 6) | a Rifleman line no longer out-reaches melee defenders standing at their rally flag |
| 14 | Heavy cost | 125 + 35 → 135 + 40 | 2.09 value killed per value lost against Bloomhost |
| 15 | Tank cost | 260 + 60 → 280 + 70 | won every duel against Bloomhost and Axiarch ground units but the Bastion |
| 16 | Flame Tank damage against vehicles | ×0.35 → ×0.2 | beat Bulwarks at equal value (65% kept); now an infantry specialist |
| **Bloomhost** | | | |
| 17 | Skitterling HP | 60 → 66 | |
| 18 | Skitterling speed | 52 → 58 (round 6) | melee reaches a ranged line before it melts |
| 19 | Bulwark HP, damage | 760, 26 → 840, 28 | |
| 20 | Bulwark cost | 150 + 30 → 140 + 25 (round 6) | |
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
| 6 | + Skitterling speed, Bulwark cost, Rifleman range | **53 / 45 / 53** | PENDING_R6 | |

PENDING_CHOICE

## Faction shares before and after

**Greedy vs Greedy** (greedy.js, the phase 7a bot, identical play; 10 seeds × both sides per pairing; `gvg-all-variants.txt`, `gvg-r6.txt`):

| Pairing | v2.41 | v2.42 |
|---|---|---|
| Last Fist vs Bloomhost | 20–0 | 12–8 |
| Last Fist vs Axiarchs | 19–1 | 9–11 |
| Bloomhost vs Axiarchs | 13–7 | 10–10 |
| **Shares** | **LF 97.5%, BH 32.5%, AX 20%** | **LF 52.5%, BH 45%, AX 52.5%** |

A caution: in bot-vs-bot cross-faction games the side matters (side 0 won most close pairings, `diag7b-v3` per seed), so every pairing plays each seed from both sides.

**Hard vs Hard:** PENDING_HH

**The mixed field** (all openings × branches, cross-faction, round 5 numbers, `field-fin.txt`): Last Fist 73.8%, Bloomhost 23.8%, Axiarchs 52.5%. PENDING_FIELDFAC

## The triangle (same faction on both sides)

PENDING_TRI

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

PENDING_FIELDNOTE

## Containment

`stratrun.js --set=contain`, same faction on both sides, 8 matches per cell:
- **Light Contain:** the Contain opening (parks at ~450) against a Standard opening.
- **Heavy Contain:** a greedy economy that parks at 1,200, against a Standard opening that earns 30% less (a controlled, clear army lead).
- **Correct defence (`break`):** hold deep under the HQ gun, fight inside the base, break out together when 1.3× stronger. **Naive:** the Greedy bot's retreat to the rally flag.

PENDING_CONTAIN

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

PENDING_HARDVAL

## Proposed mechanic changes (not implemented)

1. **A rally point inside the HQ gun's cover by default** (or a player-set rally flag). The rally flag sits 300 out, 90 short of the gun's reach; every new unit walks out to the edge of the base. The AI's `breakout` works around it with its own defend point; a player has to place Regroup flags by hand.
2. **Melee "hold" that still engages inside a radius.** On Hold or a Regroup flag, melee units never chase, so Bloomhost and Axiarch defenders can't defend a spot without walking out. A short engage radius (60–80) on Hold would let them.
3. **The third node: cover it or move it.** The far node is half under the enemy T1 HQ gun. Either push it fully inside the gun (a defender's node is safe, nodes become 2+1) or out of it (3 contestable nodes). Today it rewards the containing side.
4. **Signature buildings off the pad budget** (a ninth pad, or a sig slot), so they are an investment, not a lost Refinery. Then their numbers can be tuned on their own merit.
5. **A Turret that scales with HQ tier** (or HQ upgrades that also upgrade Turrets), so a turtle's tech path is one coherent investment.
6. **Production-building HP and a rebuild rule for the AI**, so a rush that kills a Barracks has lasting effect without the HQ gun deciding everything.

## Verdict: strategic variety and replayability

PENDING_VERDICT

## Tests

PENDING_TESTS
