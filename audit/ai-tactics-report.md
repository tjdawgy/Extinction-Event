# Phase 6a report: AI tactics and Hard mode (v2.40)

Every number here comes from the harness (audit/sim) playing the game's real SIM: Hard decision quality, seeded, 30-minute cap. The Extinction Event ends every match by 27:00; no true draws happened.

**Paired runs:** each seed is played twice with the sides swapped, so seed and map-side luck cancel.

**Noise:**
- A 48-match set has a standard error of about ±3.5 wins (±7 points).
- A 16-match set has about ±2 wins.
- Proof of the noise level: the `axf` set below played the identical AI against itself for Last Fist and Bloomhost and came out 6–10 and 9–7.

## Step 0

- Main was at v2.38. `claude/phase-5-balance-audit-rhf5w2` (v2.39) was fast-forward merged into main and pushed.
- **Mistake:** I pushed before reading that test run's result. That run had one failure: 348 of 349 passed.
  - The rerun passed 349 of 349.
  - The failing test was not identified, because that log kept only the counts.
  - Treat it as an intermittent test; later runs keep full logs.
- All later work went to main.

## The baseline preset

- `v239` is v2.39's Default kept exactly (none of the v2.40 rules), so every A/B can measure against it.
- `tests/tactics.test.js` proves it: two seeded Default-vs-Default matches recorded on v2.39 hash the same on the `v239` preset.

## Part A: each fix and its A/B result

Each rule is a switch in `AI_TACTICS` (`index.html`). Each was tested on vs off over 48 matches, with everything else equal:
- 16 per faction, same-faction matchups, random personalities.
- The B side was the best set at that point.
- Rounds 1–2 were unpaired; from round 3 on, runs are paired.

| Rule | What it does | A/B (rule on vs off) | Kept? |
|---|---|---|---|
| **`engage`** | Fighting strength in Lanchester form (total damage per second × total health) of its army against the enemy units it knows of at the target, plus known guns there at 0.6 weight. No field, node or base attack unless it wins (1.25×; 1.0× to defend its own node). In a fight it is losing locally (under 0.6×), pull back together and regroup for 12 s. | vs v2.39 Default: **29–19** (60.4%) | **Yes** |
| `mass` | While attacking, units more than 120 ahead of the army's median hold, fighting only what is in reach, until the rest arrives. | Alone vs v2.39: 25–23. With `engage` vs v2.39: 29–19, the same as `engage` alone. Paired on top of `engage` + `sig`: 23–25 | No (neutral) |
| **`sig`** | No signature building before 5:00 (`AI_SIG_LATE`, or later by the `sigAt` dial). The plan keeps its second Refinery or Reactor; once the economy runs, it sells that duplicate for the signature building. | **29–19** (60.4%) | **Yes** |
| `defend` v1 | An enemy within 650 of the HQ that it can't beat by 1.3×: rally 170 in front of the HQ (inside its gun, beyond an attacker's reach from outside) and hold there without chasing. | 21–27 | No |
| `defend` v2 | The same, only for enemies inside the base (450) and stronger than it. | 22–26 (paired) | No |
| `tech` | Each personality's own building to T3 right after T2: the Economist and Trickster the Tech Lab role, the Turtle the factory, the Aggressor the barracks. | 18–30 | No as a fixed rule; kept as a dial (`tech`) for the Hard search |
| `finish` v1 | Rich (1,200+), at its army limit, all Habitats T3, no free pad: sell a spare Reactor, third Refinery or Turret for another Habitat. | 21–27 | No |
| `finish` v2 | The same, only when clearly winning (after 10:00, the known enemy army under a third of its own). | 25–23 (paired) | No (neutral) |
| `axf` (Axiarchs) | An Axiarch unit with no shields and under 55% health steps back into the field (to the warp point) to recharge. Mass Warp at 3 units under 50% (was 4 under 40%). | **10–22** (Axiarch matchups only, 32 paired) | No |
| `hold` | Before 8:00, against a mostly light (infantry) army at least 0.8× its strength: stay home under the HQ gun, put up a Turret and the vehicle building first, score the vehicle counter up (×1.6) and the basic melee unit down (×0.6). | 25–23 (paired); against the Last Fist Aggressor: no change (below) | No |

**Kept and folded into the Default preset:** `engage` and `sig`. Every difficulty uses Default; Easy and Normal are calibrated below.

### What each brief item came to

- **Mass before attacking:** `mass` holds front-runners for the army.
  - It measured neutral alone and with the others, so it is off.
  - What actually decided the "small groups" fights was *when* they were launched, which `engage` fixes: it doesn't send the army out until its known strength wins.
- **Engagement choice:** `engage` is the largest gain, **+5 wins in 48** against v2.39.
- **Defending early aggression: not achieved.** Last Fist Aggressor against the other factions' Aggressors (24 paired matches each):

| Defender's AI | vs Bloomhost Aggressor | vs Axiarch Aggressor |
|---|---|---|
| Default (`engage` + `sig`) | 22–2 | 23–1 |
| + `defend` (v2) | 22–2 | 21–3 |
| + `hold` | 22–2 | 23–1 |

Four different defences failed: refusing bad fights (`engage`), rallying under the HQ gun (`defend` v1 and v2), and `hold`'s defence-first build that saves for the counter.

- **What `hold` changed:**
  - It does fire: about 3,100 decisions of a 7-minute trace.
  - The Axiarchs build their Null Lance and Architectum, and train Bastions and Gravemantles.
  - Last Fist's losses rise (29 Riflemen lost by 10:00).
  - The results don't move.
- **Why:**
  - By 4:00 the Axiarchs had lost 14 Shardlings to 2 Riflemen, and Bloomhost the same pattern with Skitterlings.
  - Last Fist's two Barracks out-produce one Gate or Larva Pit, and the Rifleman wins the exchange at equal value (Phase 5 duels: Shardling −64).
- **Verdict:** a number problem (Rifleman vs Shardling/Skitterling, two-Barracks throughput), not an AI one. It goes to the final balance pass.
- **Note:** in the same-faction Hard search the Last Fist Aggressor is only 40% against the field. It dominates the other factions, not Last Fist.
- **Signature building timing:** `sig`, **+5 wins in 48**.
- **Tech order:**
  - Forcing each personality's T3 first lost (18–30).
  - But "air T3 right after T2" helps the Last Fist Economist on Hard (Part B), so the order is now a per-faction strategy dial (`tech`), not a fixed rule.
- **Finishing:**
  - The stalled matches traced in Phase 5 were mostly grinding a base while 3,000–4,000 credits sat idle at the army limit.
  - `finish` turns that bank into Habitats and army, but it measured neutral (v1 worse), so it is off.
  - Matches still running at 20:00:
  - Hard vs Hard: 5, 6 and 16 of 40 by pairing.
  - Phase 5's Default: 4, 5 and 4 of 40.
  - The long ones are mostly Bloomhost against the Axiarchs: even, small armies trading.
  - All end in the storm by 22:30, as before.
- **Faction mechanics:**
  - The default warp point already sits at the field's front edge, including held-node fields, so "never sets a warp point" was not a real gap.
  - Shield recharge (`axf`) lost clearly: units leaving a fight cost more than recharged shields win.
  - Bloomhost swarm massing is `mass`.
  - None was kept.

## Part B: Hard mode

Hard is a new preset (`AI_PRESETS.hard`).
- **Which games use it:** in the game, a Hard match without a named preset gets it (`newGame`).
- **What it is:** the Default's rules plus per-faction settings found by the search (`byFac`).
- **No cheating:**
  - The same income and rules as everyone.
  - The same fog and intel.
  - Its "faster decisions" dial only shortens the time between AI decisions (0.6 of the difficulty's interval, about every 0.6 s on Hard), which a player matches by acting.

### The search (audit/sim/hardsearch.js)

- **Format:** each candidate played paired matches against a field of the Default preset with random personalities (so every personality appears), same faction.
- **Stages:**
  - Stage 1: openings, 20 matches each.
  - Stage 2: dials on the best opening, 16 each.
  - Stage 3: combinations, 16 each.
- **Total:** 768 matches.

**Stage 1, openings** (a personality fixes the build plan, upgrade paths and unit tastes):

| Opening | Last Fist | Bloomhost | Axiarchs |
|---|---|---|---|
| Aggressor (2 Barracks, early pressure, Mass Deployment) | 8–12 (40%) | 13–7 (65%) | 2–18 (10%) |
| Turtle (Turret, siege, defence first) | 12–8 (60%) | 11–9 (55%) | 14–6 (70%) |
| **Economist** (3 Refineries, early economy upgrades, Air Power / Apex / Ascendant) | **18–2 (90%)** | **17–3 (85%)** | **17–3 (85%)** |
| Trickster (feints, Air Power) | 11–9 (55%) | 4–16 (20%) | 4–16 (20%) |

**Stage 2, dials on the Economist** (16 matches each; the plain Economist on the same seeds is the control):

| Dial | Last Fist | Bloomhost | Axiarchs |
|---|---|---|---|
| Control (plain Economist) | 13–3 | 11–5 | 12–4 |
| Hold all 3 nodes (`nodes` 3) | 10–6 | 12–4 | 9–7 |
| Hold only its own node (`nodes` 1) | 10–6 | 10–6 | 9–7 |
| Spend sooner (`bank` 1,200, was 2,500) | 13–3 | 11–5 | 11–5 |
| Stay in losing fights longer (`retreat` 0.5, was 0.7) | 13–3 | 11–5 | 12–4 |
| **Faster decisions (`delay` 0.6)** | **14–2** | **14–2** | **14–2** |
| **Air T3 first (`tech` techlab)** | **15–1** | 8–8 | 12–4 |
| **No signature building (`sigAt` beyond any match)** | **14–2** | **15–1** | **15–1** |
| Neutral rules on (`mass`, `finish`, `hold`) | 13–3 | 11–5 | 11–5 |

Selling buildings that have served their purpose is the `finish` rule (spare Reactor, Refinery or Turret for a Habitat): neutral in Part A and here.

**Stage 3, combinations:**

| Faction | Candidate | Result |
|---|---|---|
| Last Fist | Economist, delay 0.6, air T3 first, no signature building | **14–2** |
| Last Fist | the same with the signature building | 13–3 |
| Bloomhost | Economist, delay 0.6, no signature building | **16–0** |
| Bloomhost | the same, holding 3 nodes | 15–1 |
| Axiarchs | Economist, delay 0.6, no signature building | **15–1** |
| Axiarchs | the same with `retreat` 0.5 | 15–1 |

### The best strategy per faction (now Hard's)

| | Last Fist | Bloomhost | Axiarchs |
|---|---|---|---|
| **Opening** | Economist: Barracks, 3 Refineries, Reactor, War Factory, Habitat, Tech Lab; Refinery and Tech Lab upgrades first | Economist (the same plan in Bloomhost buildings) | Economist (the same plan in Axiarch buildings) |
| **Nodes** | 2 (its own and the middle) | 2 | 2 |
| **Bank vs spend** | Default (counts 2,500 as rich); spending sooner made no difference | Default | Default |
| **Signature building** | None | None | None |
| **Selling** | Only the existing rules (a Habitat when stuck); the `finish` rule was neutral | Same | Same |
| **Tech order** | The Tech Lab (Air Power) to T3 right after T2, then the shared order | The Economist's: Refinery T2, Bloomspire T2, Refinery T3, then the shared order | Same as Bloomhost |
| **Decisions** | Every 0.6 s | Every 0.6 s | Every 0.6 s |

### Hard's win rates (validation: 40 paired matches per cell, same faction, new seeds)

| Hard vs | Last Fist | Bloomhost | Axiarchs | Target |
|---|---|---|---|---|
| **Default (v2.40)** | **39–1 (97.5%)** | **39–1 (97.5%)** | **38–2 (95%)** | ≥75%: **met** |
| **Legacy** (v2.37's AI) | **40–0 (100%)** | **39–1 (97.5%)** | **39–1 (97.5%)** | ≥90%: **met** |
| Default v2.39 (`v239`) | 37–3 (92.5%) | 38–2 (95%) | 39–1 (97.5%) | |

Hard is strong with all three factions. The validation is against random personalities, so every opening appears.

## Easy and Normal

Easy and Normal use the Default preset, which now has `engage` and `sig`. Did that raise their challenge? Measured against v2.39's Default at the same difficulty, 48 paired matches each, same-faction matchups:

| Difficulty | New Default vs v2.39 Default | Verdict |
|---|---|---|
| Normal | 26–22 (54.2%) | within noise of even |
| Easy | 23–25 (47.9%) | within noise of even |

- **No change needed:**
  - Neither difficulty measurably jumps, so no extra slowing was needed.
  - The per-difficulty mechanism (`byDiff` on a preset: slower decisions, sloppier picks) is in place and tested, but empty.
  - Easy and Normal keep their own decision delays, unit-choice quality and army caps (`DIFF`), unchanged.
- **Human proxy:** the scripted Rifleman rush (tests/bots.js) still loses all 36 matches against Normal (12 per faction), the same as v2.39.
- **Not verified:** how a human feels the difference. The A/B is AI against AI.

## Hard vs Hard, faction matrix

40 paired matches per pairing, both sides on Hard (the Economist opening and their faction's settings), new seeds:

| Pairing | Result | Share | Open at 20:00 | Mean length |
|---|---|---|---|---|
| Last Fist vs Bloomhost | **40–0** | Last Fist 100% | 5 | 12:51 |
| Last Fist vs Axiarchs | **28–12** | Last Fist 70% | 6 | 12:20 |
| Bloomhost vs Axiarchs | **5–35** | Bloomhost 12.5% | 16 | 15:25 |

| Faction (Hard vs Hard) | Wins–losses | Share |
|---|---|---|
| Last Fist | 68–12 | **85.0%** |
| Axiarchs | 47–33 | **58.8%** |
| Bloomhost | 5–75 | **6.3%** |

**For the final balance pass:**
- **The v2.39 Last Fist cuts do not look overshot.**
  - With every faction on its best strategy, Last Fist wins 85%, more than its 63.8% against v2.39's Default in Phase 5.
  - The better AIs widen the gap rather than close it.
- **Bloomhost is the faction in trouble.** It loses 40–0 to Last Fist and 5–35 to the Axiarchs when all three play well.
  - Phase 5 had Bloomhost at 40%, with the Default AI's mistakes hiding much of the gap.
- **The Axiarchs are in the middle:** 30% against Last Fist, 87.5% against Bloomhost.
- **Two consistent signals point at numbers rather than AI:**
  1. The Last Fist Aggressor's early push is unbeatable by every AI defence tried (Part A).
  2. Signature buildings are worth less than the Refinery or Reactor slot they cost, for all three factions (stage 2: +1 to +4 wins in 16 without them).
  - Both go to the final balance pass.
- **Note:** the Hard-vs-Hard matrix is one opening against one opening (Economist against Economist). The final pass should also look at the Default-vs-Default matrix with random personalities (Phase 5 format).

## Does one strategy dominate?

**Yes, one opening dominates: the Economist, for all three factions.**
- **Stage 1:** 85–90% against the Default field, against 10–70% for the other openings.
- **What it does:** three Refineries, early Refinery and tech upgrades, a heavy air path (Leviathan, Brood Tyrant or Worldrender, Voidcarrier or Sovereign).
- **Why it wins:**
  - Its economy outgrows everything.
  - `engage` keeps it out of losing early fights, which used to be the Economist's weakness.
- **The rest of the dominant strategy:**
  - No signature building (all three factions).
  - Two nodes.
  - Faster decisions.

**Between factions** (different starting kits), the Last Fist Aggressor's early push beats both other factions' Aggressors (22–2 and 23–1) and survives every defence tried.

**Consequences:**
- **Hard always opens Economist.** It was the only opening near the targets. Its build and timings are predictable after a few games, which is a cost for replayability. If variety matters more than the target, Hard could also roll the second-best opening per faction:
  - Last Fist Turtle 60%
  - Bloomhost Aggressor 65%
  - Axiarch Turtle 70%
- **Default and Easy/Normal keep random personalities,** so play there stays varied.

## Verdict: enough strategic variety?

**Not yet enough strategic variety; the problem is the decisions that matter, not the number of layers.**
- Across 768 search matches and 480 validation matches, one opening wins for every faction.
- **The big strategic dials made little or negative difference:**
  - holding 1 or 3 nodes instead of 2;
  - spending sooner;
  - fighting longer;
  - the signature building.
- **Choices that should matter but don't:**
  - **Node count:** all three nodes sit on one lane, so the middle node decides the field, and the far node is under the enemy HQ's guns.
  - **Signature buildings:** they cost the economy more than they return for the AI (without it the Economist won 14–2 and 15–1 in 16, against 11–13 wins with it).
- **Recommendations, in order:**
  1. **Numbers first (the final balance pass):**
     - Make signature buildings worth their slot.
     - Fix Bloomhost's standing (6% Hard vs Hard).
     - Fix the Rifleman early exchange.
     - Make the non-Economist openings competitive: a cheaper or faster Barracks/Factory tier for aggressive openings, or a costlier third Refinery.
     - This is the cheapest way to more viable strategies.
  2. **Node layout:** a node layout that makes 1 vs 3 nodes a real choice. For example, a flank node off the lane, or nodes with different yields (credits vs energy), so holding more ground trades army for economy. This adds strategy without a new map system.
  3. **Maps and lanes later:** a second lane or alternative maps multiply the strategy space (where to fight, split pushes) but are a large build: AI pathing, the camera, the UI on a phone screen.
     - Worth it only after the existing choices are balanced; otherwise they would show the same Economist dominance in more places.
