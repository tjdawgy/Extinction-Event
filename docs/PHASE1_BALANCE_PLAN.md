# Phase 1 balance pass: the plan (design only, after v2.72)

Nothing here is built or approved. It recommends how to run ROADMAP.md's Phase 1 balance pass across every map, faction,
difficulty and battlefield condition, using what v2.69–v2.72 measured (KNOWN_ISSUES.md).

## Where things stand (the numbers this plan starts from)

| What | Classic | Two-Lane | Three-Lane |
|---|---|---|---|
| Hard vs Hard draws / median | 3% / 12:32 | 8% / 13:33 | 11% / 13:34 (v2.71) |
| Normal vs Normal draws / median | 4% / 14:03 | 6% / 16:41 | 13% / 16:50 (v2.70) |
| Easy vs Easy draws / median | 7% / 19:24 | 17% / 19:03 | 14% / 18:56 (v2.70) |
| Hard faction shares LF / BH / AX | 69 / 33 / 48% | 51 / 51 / 48% | 61 / 60 / 28% (with relics) |
| Normal faction shares LF / BH / AX | 78 / 40 / 32% | 53 / 38 / 59% | 74 / 40 / 36% (v2.70, before depots and relics) |
| Ladder: Hard beats Normal / Normal beats Easy | 79% / 83% | 67.5% / 68% | not measured |

Known skews: Last Fist is strong on Classic and Three-Lane (its siege and Orbital Strike break bases best since v2.69);
Bloomhost is weak on Classic (11% under heavy fog); relics cost the Axiarchs ~15 points; Easy runs 19 minutes everywhere;
scarce resources push medians to 19 minutes; Classic Hard's spawn sides read 39–58 once (re-check).

## What to measure

1. **Faction win shares** per map × difficulty: cross-faction shares and each mirror apart; 200 matches per cell for
   Hard and Normal, 100 for Easy (audit/sim/ladder.js + shares.js; each cell gives ~66 cross-faction games per faction).
2. **Faction shares per condition** on each map that allows it (11 map/condition pairs), Hard only, 100 per pair.
3. **The difficulty ladder** on all three maps (Hard vs Normal, Normal vs Easy), 200 each.
4. **Match shape**: median and quartiles of length, decided before 20:00, draws, no-fight, by map, difficulty and condition.
5. **Spawn sides**: left/right of decided matches in every Hard mirror cell (200 per faction per map).
6. **The strategy triangle and Tech vs Contain** (audit/sim/strat.js bots: Rush > Greedy > Turtle > Rush; the Tech and
   Contain branches) on every map, not just Classic: openings and branches viable per faction and map.
7. **What wins**: units in winning armies, unit usage, and the share of wins by HQ fall versus storm, per faction and map.
8. **Each Phase 1 feature, switched off on the same seeds** (BREAK parts, SPECIAL.relic / .repair, each condition): the
   change in faction shares it causes, so a fix lands on the feature rather than on the factions.

## Targets

- **Faction shares:** every faction 45–55% cross-faction on Hard and Normal on each map; never outside 40–60% in any
  map × difficulty cell; under a condition, inside 35–65% (smaller samples). Mirrors: no side over 55% of decided at 200.
- **Draws** under 15% Hard and Normal, under 25% Easy, every map; under 25% under every condition. No fight under 5%.
- **Length:** Hard and Normal median 10–15 minutes (the roadmap's target) on Classic, 12–16 on the lane maps; Easy and
  scarce resources no more than 18.
- **Ladder** on every map: Hard beats Normal 70–80%, Normal beats Easy 80–90% (v2.64's Classic band, now 83% / 68% on
  Classic / Two-Lane).
- **Triangle:** each edge ≥55% for every faction on every map; Tech and Contain within 45–55% of each other.
- **Features:** a relic or depot moves no faction's share by more than 5 points.

## The order

1. **Baseline (no changes).** Run items 1–6 above on v2.72 and fix any harness gaps first (ladder.js on Three-Lane
   with conditions, a strat.js lane-map mode). About 9,000 matches; roughly 30 hours on 4 cores, so split into nightly
   batches with per-set result files (a restart costs one set, not the run).
2. **Map-independent faction numbers** (a `BALANCE8` numbers-only layer with `setBalance8(false)`, as phases 5 and 7b
   did): judged on all three maps at once, Hard and Normal, so a change can't fix Classic by breaking Three-Lane. Start
   with the biggest skew (Last Fist's siege and Orbital Strike against bases; Bloomhost on Classic). At most 5 rounds,
   each a paired A/B on fixed seeds, 100+ matches per arm.
3. **Map data, not factions,** for what only shows on one map: relic guards and reward (the Axiarch drop), node yields and
   positions, wall lengths, forward-post placement. Each change is a map version bump.
4. **Condition values** (`COND`): heavy fog's sight factor if Bloomhost stays under 35%; scarce's pay and start if its
   medians stay over 18; meteor damage if it decides matches by luck (check the share of HQs killed by meteors).
5. **Difficulty ladder** per map: Easy's pace (its 19-minute matches) and Normal's edge over Easy on lane maps, through
   `LADDER` (map-aware entries if one map needs its own).
6. **Length last:** the power-failing start (15:00) and rubble time are the levers if medians sit above target after the
   faction work; they change every map, so re-check Classic.
7. **Verification:** the full matrix again at the final numbers; raise or add slow tests that pin the new bands (spawn
   sides per map, a lane-map ladder check); update KNOWN_ISSUES.md and close the roadmap's balance items.

Rules for the pass: one lever per round; every claim from scripts with win counts over at least 100 matches per arm;
anything outside the targets after the allowed rounds is logged, not forced.
