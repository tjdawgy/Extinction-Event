# Phase 5 balance report (v2.39)

Step 2 of the Phase 5 balance pass. The diagnosis (Step 1) is in audit/balance-diagnosis.md.

## Outcome

**The main target was not met after the 5 allowed rounds, so tuning stopped there, as the brief requires.**
- **Bloomhost and the Axiarchs are now inside 40–60%:** 40.0% and 46.3%.
- **Last Fist is down from 77.5% to 63.8%,** still above 60%: 67.5% against Bloomhost, 60.0% against the Axiarchs.

The rest of the gap is not a number problem. The diagnosis shows Bloomhost and Axiarch armies attack a Last Fist line in small melee groups and die to it. Cost and stat sensitivity runs move it only a few wins (section 6). That is logged for Phase 6 (AI training) and was not compensated with stat buffs.

## How it was measured

- **Runs:**
  - Default AI on Hard for both sides, the real SIM (audit/sim), seeded.
  - A 30-minute cap. The Extinction Event ends every match by 27:00, so no match reached the cap. Matches still running at 20:00 are reported separately.
  - Sides alternate left and right.
- **Each tuning round:** 40 matches per cross-faction pairing, random personalities (120 matches).
- **Baseline and final round:** also 20 mirrors per faction and 8 matches per pairing for each personality (both sides on that personality), 276 matches each.
- **Rounds 1–4** were tried as `--code` on v2.38 (no game change). The final values are in `index.html` (the `BALANCE` block). Round 5 ran on them.
- **Commands:**
  - `node audit/sim/balance.js --n=40 --mirror=20 --persona=8 --diag --tag=<name> [--code="..."]`, then `node audit/sim/analyze.js <name>`.
  - Outputs: audit/sim/out/balance-*.md and .json (not committed, like the rest of out/).
- **Noise:** at 40 matches a pairing's win share has a standard error of about ±7–8 points, so differences of 2–3 wins are noise.

## Every change, with before and after values

The `BALANCE` block in `index.html`. `setBalance(false)` restores every v2.38 value.

Lever order, as the brief asks:
- **cost:** 11 units;
- **build time:** 3 units;
- **supply:** not used (the AI armies aren't supply-bound; section 6);
- **tech:** not used (section 5);
- **stats:** 2 small fixes.

No mechanic changed.

| Unit / value | Before (v2.38) | After (v2.39) | Reason |
|---|---|---|---|
| **Tank** (Last Fist) | 200 credits / 40 energy, 11 s | **260 / 60, 13 s** | Beat every Bloomhost and Axiarch ground unit but the Bastion at equal value in controlled fights (Bulwark +83, Thornback +100, Riftstalker +100). |
| **Heavy** (Last Fist) | 100 / 25 | **125 / 35** | With Riflemen it out-shot every Bloomhost and Axiarch flyer (Razorwing +92); 19% of Last Fist spending, alive in 78% of its wins. |
| **Salvage** (Last Fist) | 10% of a unit's credit cost | **7%** | Worth about 4 wins in 40 for Last Fist (switched off: 33–7 → 29–11). It brought 8% of Last Fist's income without a Yard and 16% with one. Still Last Fist's identity: 1,290 credits per match after the change (1,453 before). |
| **Salvage Yard T1** (Last Fist) | 20% | **14%** | Keeps the Yard at double the base rate. The Yard's tier text follows the values. |
| **Bulwark** (Bloomhost) | 190 / 40, 11 s | **150 / 30, 10 s** | Lost to the Tank at equal value and equal supply. |
| **Razorwing** (Bloomhost) | 170 / 70, 170 HP | **140 / 50, 200 HP** | Lost to Riflemen (−90) and Heavies (−92) at equal value; 20% of Bloomhost spending (the AI keeps it in the mix). Cost alone couldn't lift it, hence 30 HP: small stat fix 1 of 2. |
| **Spitter** (Bloomhost) | 90 / 30 | **80 / 25** | Lost to Last Fist's mix (−73). |
| **Leaper** (Bloomhost) | 90 / 20 | **80 / 20** | Lost to Last Fist's mix (−81). |
| **Shardling** (Axiarchs) | 80 / 20, 6 s, 60 shields | **65 / 15, 5 s, 75 shields** | Lost to Riflemen at equal value (−64) and equal supply (−66); 44% of Axiarch spending; the Axiarchs fielded half Last Fist's army at 4:00. Small stat fix 2 of 2: +15 shields. Still 2 supply (the roster keeps Axiarch infantry elite). |
| **Lancer** (Axiarchs) | 150 / 60 | **120 / 45** | Lost to Last Fist's mix (−34). |
| **Prismwing** (Axiarchs) | 120 / 50 | **100 / 40** | Lost to Last Fist's mix (−55). |
| **Wraithwing** (Axiarchs) | 260 / 120 | **230 / 100** | Lost to Last Fist's mix (−88). |
| **Bastion** (Axiarchs) | 280 / 90 | **260 / 85** | Round 5: the Axiarchs' one strong unit, slightly more available. |

**Distinctness kept:**
- Every faction keeps its shape: Last Fist cheap ranged infantry and expensive armour; Bloomhost the cheapest swarm; Axiarch units still dearer than their counterparts.
- Shardling 80 value at 2 supply against the Rifleman's 50 at 1; Lancer 165 against the Heavy's 160 with shields on top.
- No unit took another faction's role, and no mechanic, range, armour type or weapon table changed.

**Also changed (not balance):**
- **Flaky tests fixed:**
  - The Medicopter retreat test now runs on its own seeded SIM. It was flaky about 1 run in 60: after a retreat the Medicopter hovers about 60 ahead of the Rifleman, a steady hover, not a lag.
  - The Sovereign beam scene test now waits up to 2 s for the beam. It failed 3 runs in 20 at v2.38 too: the charge starts only after the unit's first random cooldown.
- **Tests that pinned v2.38 numbers:**
  - The Salvage and signature-building tests run with `setBalance(false)`. They test the mechanic at its own numbers.
  - A new test pins the v2.39 values (7%, 14%, the Bulwark's 150 → 11 credits, the Yard text).
  - Two army-value tests read the Tank's cost from `UDEF`.
  - The Yard card test looks for 14%.
- **Determinism:**
  - Every pinned replay runs with `setBalance(false)` and still matches its old fingerprint.
  - Two new fingerprints (`FP_V239`, `FP_V239_BA`) record the main Last Fist mirror and the Bloomhost vs Axiarchs match with the balance on.
- **AI tests re-targeted, with the reason in the test:**
  - **Bloomhost Economist test:** after the pass the Bloomhost Economist beats the Last Fist Turtle in about 9 minutes (10 of 10), before any Worldrender. At v2.38: 17 minutes, 3 Bloomhost wins in 10. It now plays an Axiarch Turtle: Worldrender 8 of 10, Brood Tyrants 10 of 10.
  - **Axiarch abilities test:** plays 5 matches instead of 3. Its original 3 now cast only Overcharge; the Beam came in 6 of 9 seeds checked.

## Win rates before and after

### Cross-faction (random personalities, 40 matches per pairing)

| Pairing | v2.38 | Round 1 | Round 2 | Round 3 | Round 4 | **v2.39 (round 5)** |
|---|---|---|---|---|---|---|
| Last Fist vs Bloomhost | 33–7 (82.5%) | 29–11 | 29–11 | 27–13 | 25–15 | **27–13 (67.5%)** |
| Last Fist vs Axiarchs | 29–11 (72.5%) | 30–10 | 29–11 | 29–11 | 26–14 | **24–16 (60.0%)** |
| Bloomhost vs Axiarchs | 19–21 (47.5%) | 19–21 | 23–17 | 17–23 | 20–20 | **19–21 (47.5%)** |
| **Last Fist** (share of its matches) | **77.5%** | 73.8% | 72.5% | 70.0% | 63.8% | **63.8%** |
| **Bloomhost** | **32.5%** | 37.5% | 42.5% | 37.5% | 43.8% | **40.0%** |
| **Axiarchs** | **40.0%** | 38.8% | 35.0% | 42.5% | 42.5% | **46.3%** |

What each round added (as `--code` on v2.38 for rounds 1–4):
1. Tank 240/50 at 13 s, Bulwark 160/30 at 10 s, Shardling 65/15 at 5 s.
2. Tank 260/60, Heavy 115/30, Razorwing 140/50, Spitter 80/25, Lancer 130/50, Prismwing 100/40.
3. Razorwing 200 HP, Shardling 75 shields, Wraithwing 230/100.
4. Heavy 120/35, Leaper 80/20, Bulwark 150/30, Lancer 120/45, Salvage 8% with the Yard at 16%.
5. Heavy 125/35, Bastion 260/85, Salvage 7% with the Yard at 14%.

### Per personality (both sides the same personality, 8 matches per pairing)

| Personality | Last Fist vs Bloomhost | Last Fist vs Axiarchs | Bloomhost vs Axiarchs |
|---|---|---|---|
| Aggressor | 8–0 → 8–0 | 8–0 → 8–0 | 5–3 → 6–2 |
| Turtle | 8–0 → 8–0 | 6–2 → **2–6** | 0–8 → 0–8 |
| Economist | 8–0 → 8–0 | 8–0 → 7–1 | 5–3 → 3–5 |
| Trickster | 7–1 → **5–3** | 8–0 → 7–1 | 4–4 → 3–5 |
| **Faction totals** | Last Fist 95.3% → **82.8%** | Bloomhost 23.4% → 23.4% | Axiarchs 31.3% → **43.8%** |

### Mirrors (20 each; side A against side B, sides alternating)

| Faction | v2.38 | v2.39 |
|---|---|---|
| Last Fist | 12–8 | 11–9 |
| Bloomhost | 7–13 | 5–15 |
| Axiarchs | 11–9 | 7–13 |

The mirrors are the same faction on both sides, so these splits only measure noise. Bloomhost's 5–15 is about 2 standard errors from even at n = 20; it was 7–13 before the pass too.

## Draw rates

- **No true draws** in any run (equal score, kills and credits never happened).
- **Matches still running at 20:00**, all decided by 22:30 (HQ, storm or score):

| Pairing | v2.38 | v2.39 |
|---|---|---|
| Last Fist vs Bloomhost | 5 of 40 (12.5%) | 4 of 40 (10%) |
| Last Fist vs Axiarchs | 4 of 40 (10%) | 5 of 40 (12.5%) |
| Bloomhost vs Axiarchs | 11 of 40 (27.5%) | 4 of 40 (10%) |
| Last Fist mirror | 1 of 20 (5%) | 3 of 20 (15%) |
| Bloomhost mirror | 3 of 20 (15%) | 1 of 20 (5%) |
| Axiarch mirror | 5 of 20 (25%) | 4 of 20 (20%) |

The diagnosis (section 4) has why matches run past 20:00: AI play (finishing a base, army trading), not stats.

## Unit usage: high and low

Over v2.39's cross-faction and personality matches (round 5):
- **alive in wins:** share of the faction's wins where the unit was alive at the end;
- **trained in wins:** share of its wins where it was trained;
- **any side:** share of all its sides that trained it.

**Over 70% (flagged high):**

| Unit | Alive in wins | Trained in wins | v2.38 alive / trained | What was done |
|---|---|---|---|---|
| Rifleman | 91% | 100% | 90% / 100% | Nothing. It is Last Fist's only T1 infantry: every side trains it first. |
| Skitterling | 96% | 100% | 90% / 100% | Nothing, for the same reason (Bloomhost's only T1 infantry). |
| Shardling | 40% | 100% | 40% / 100% | Cheaper and tougher; still the only Axiarch T1 infantry. |
| Heavy | 72% | 82% | 78% / 84% | Cost 100/25 → 125/35. |
| Tank | 51% | 88% | 80% / 97% | Cost 200/40 → 260/60, 11 → 13 s. Alive in wins fell from 80% to 51%. |
| Sniper | 64% | 75% | 59% / 67% | Nothing this pass (3% of Last Fist spending). |
| Bulwark | 72% | 98% | 63% / 88% | Cheaper, so used more. It is Bloomhost's only T1 vehicle. |
| Spitter | 70% | 75% | 76% / 78% | Slightly cheaper. Bloomhost's only mobile anti-air on the ground. |
| Lancer | 77% | 86% | 67% / 90% | Cheaper. The Axiarchs' main ground anti-air. |
| Wraithwing | 62% | 74% | 37% / 58% | Cheaper; it went from under-used to high. |
| Rift Mortar | 51% | 71% | 44% / 73% | Nothing (its trained share was already 73%). |

**Under 10% (flagged low):**

| Unit | Trained in wins | Any side | Why | What was done |
|---|---|---|---|---|
| Worldrender | 0% | 2.1% | Its Bloomspire Apex T3 is reached by 8% of Bloomhost sides, median 13:00 | Nothing: T3 capstone, see section 5 |
| Cloudwing | 0% | 1.4% | Bloomspire Swarm T3: 1% of sides | Same |
| Astral Sovereign | 1.5% | 0.7% | Celestial Array Ascendant T3: 7% of sides, median 13:00 | Same |
| Needlewing | 0% | 11.1% | The AI takes the Swarm Bloom path rarely (the Turtle's and Aggressor's Support taste) | Nothing; AI path choice, Phase 6 |
| Dreadthorn | 6.4% | 6.3% | Predator T3: 18% of sides | Nothing; tier reach, Phase 6 |
| Eventide | 9.2% | 6.3% | Dominion T3: 13% of sides | Nothing; tier reach, Phase 6 |

Phase 4's usage list (any side): every unit is trained by at least 0.7% of sides. The Parallax is at 8.3% of sides, with 15% of wins trained.

## Commander abilities and signature buildings

**Value in AI hands, measured on v2.38** (paired, 40 matches): switch one faction's abilities or signature buildings off, and count its wins.

| Faction | Abilities off | Signature buildings off |
|---|---|---|
| Last Fist | +4 wins | **+6 wins** |
| Bloomhost | +4 wins | **+10 wins** |
| Axiarchs | −4 wins | **+6 wins** |

- **Comparable across factions?** Roughly yes, within noise. But **all three signature buildings currently cost their AI wins**, and so do Last Fist's and Bloomhost's abilities.
  - That is AI skill: the plan gives up a second Refinery or Reactor for the signature building and builds it at 0:30–1:00. Logged for Phase 6.
  - Not compensated: buffing them would only reward the AI's misuse.
- **Per-match use, v2.38 → v2.39:**
  - **Last Fist:**
    - Shield 1.39 → 1.41, Strike 1.97 → 2.31, Repair 0.09 → 0.18.
    - Salvage 1,453 → 1,290 credits; bunker heal 170 → 166 HP.
  - **Bloomhost:**
    - Frenzy 2.50 → 2.89, Brood 0.33 → 0.35, Corrosive 0.92 → 0.50.
    - Mites 37 → 32 hatched.
  - **Axiarchs:**
    - Mass Warp 0.01 → 0.04, Overcharge 2.16 → 1.88, Beam 0.90 → 0.83.
    - Echoes re-warped 5.4 → 7.1.

## T3 capstone findings

**At v2.39** (share of sides that reached the path's T3, median time):
- **Last Fist:**
  - Tech Lab Air Power 30% at 9:30, Support 13% at 11:00. The Leviathan is trained by 16.7% of sides (12.5% at v2.38).
- **Bloomhost:**
  - Bloomspire Apex 8% at 13:00, Swarm 1% at 14:30.
- **Axiarchs:**
  - Celestial Array Swarm 18% at 13:00, Ascendant 7% at 13:00.
- **Median match length:** 12–14 minutes.

**Finding:** the air capstones arrive when matches end. The ground T3s (Titan, Hydra, Ruinmaw, Worldbreaker) arrive at 7:30–10:00 and are used. The difference is the AI's upgrade order (`AI_UPG` lists the Tech Lab role's T3 16th of 20), not the price.

**Recommendation: keep them late-game luxuries.**
- They are base-breakers, and the long matches they would end are AI finishing failures (diagnosis section 4).
- A cheaper, faster path would make them the answer to a problem the AI should solve.
- So no tech cost or time was changed. The upgrade order is logged for Phase 6.

**S3 (bomber supply 7–9):** see the next section: lowering it changed nothing measurable.

## S3: bomber supply

`node audit/sim/s3.js --n=16`: Economist on both sides (the personality that techs furthest), 16 matches per cross pairing, 32 sides per faction. Run as is and with Leviathan 7 → 6, Worldrender 8 → 7, Sovereign 9 → 7 supply.

| Bomber | Sides that trained it, as is | With lower supply | Its faction's wins, as is / lower |
|---|---|---|---|
| Leviathan | 8 of 32 | 8 of 32 | 27 / 27 of 32 |
| Worldrender | 0 of 32 | 0 of 32 | 10 / 10 of 32 |
| Astral Sovereign | 0 of 32 | 0 of 32 | 11 / 11 of 32 |

- **The change did apply.** The matches with a Leviathan played differently (match lengths changed), but no side trained a bomber it didn't before, and no result flipped.
- **Supply is not what keeps the bombers out.** The AI either reaches the path's T3 or doesn't:
  - The Leviathan is trained whenever Air Power T3 is up.
  - No Bloomhost or Axiarch Economist reached Apex or Ascendant T3 before its match ended.
- **Recommendation: keep 7, 8 and 9 supply.** Re-check after Phase 6 fixes the T3 upgrade order (section above).

## The Rifleman rush and openings

- **Rifleman rush:** the scripted rush (tests/bots.js `rushBot`: two Barracks at once, a third later, Riflemen only, attacks at about 8 alive) against each faction's Default AI, 12 seeded matches each (`node audit/sim/rush.js`):

| Difficulty | vs Last Fist | vs Bloomhost | vs Axiarchs |
|---|---|---|---|
| Hard, v2.38 | 0–12 | 0–12 | 0–12 |
| Normal, v2.38 | 0–12 | 0–12 | 0–12 |
| Normal, v2.39 | 0–12 | 0–12 | 0–12 |
| Easy, v2.38 | 0–12 | 9–3 (median win 21:45) | 1–11 |
| Easy, v2.39 | 0–12 | 7–5 (median win 21:45) | 0–12 |

  - **Not dominant at any difficulty.**
  - **Viable only against Easy Bloomhost,** and even there it wins late, in the storm, not as a rush.
  - The Rifleman wasn't changed. The scripted bot was calibrated at v2.8, before the Default AI. Recalibrating it is a Phase 6 item before using it to judge rush strength.
- **Does one opening dominate?**
  - Before the pass, Last Fist's did, with every personality (95% in the personality sets).
  - After it, Last Fist's Aggressor still wins 16 of 16 and its Economist 15 of 16. The Last Fist Turtle now loses to the Axiarch Turtle (2–6).
  - Between Bloomhost and the Axiarchs, the Axiarch Turtle beats the Bloomhost Turtle 8–0, before and after: a turtle-vs-turtle gap to look at in Phase 6. The other personalities are near even.
  - So the Last Fist Aggressor's pressure (2 Barracks, Mass Deployment) is the strongest opening: an early ranged army that holds the middle node against piecemeal melee attacks (diagnosis section 1).

## Sensitivity: why the numbers can't close the rest

Paired, 30 matches against each opponent, on v2.38 (baseline on these seeds 23–7 against Bloomhost, 22–8 against the Axiarchs):

| Change | Last Fist vs Bloomhost | Last Fist vs Axiarchs |
|---|---|---|
| Every Bloomhost and Axiarch unit 20% cheaper | 20–10 | 19–11 |
| Every Last Fist unit 20% dearer | 22–8 | 20–10 |
| Every Bloomhost and Axiarch unit +15% HP and shields | 20–10 | 21–9 |
| No Tanks for Last Fist | 21–9 | 21–9 |
| No Heavies | 22–8 | 23–7 |
| No Gunships | 23–7 | 22–8 |
| No Flame Tanks | 22–8 | 24–6 |

- **Even large changes move Last Fist by 1–4 wins in 30.**
  - Bloomhost and Axiarch armies at mid-game use 5–10 supply of the 22–34 they have.
  - They are not short of money or supply; they lose their engagements.
- **A traced match** (Last Fist vs Bloomhost, seed 50010) shows how:
  - Bloomhost attacked Last Fist's line at the middle node in groups of 5–11 and lost 40 units to 15 by 6:00. Its own HQ gun is its best killer.
  - That is concentration and engagement choice: AI training (Phase 6).
  - Closing it with stats would mean very large buffs that change what the factions are, which this pass rules out.

## Remaining issues

1. **Last Fist 63.8% cross-faction** (67.5% against Bloomhost). Stopped at 5 rounds as the brief requires.
2. **Bloomhost at 23% in the personality sets** (40% in random ones): its Turtle loses to both other Turtles. With the AI's piecemeal attacks, more swarm value doesn't help.
3. **Units over 70% of winning armies:** mostly each faction's only T1 unit, which every side trains. Heavies, Bulwarks, Spitters, Lancers, Wraithwings and Rift Mortars are mainstays at 70–98%.
4. **Units under 10%:** the T3 capstones and Needlewing/Dreadthorn/Eventide, all gated by AI tech choices.
5. **Mirror side splits** (Bloomhost 5–15, Axiarchs 7–13 at n = 20) are within about 2 standard errors. Re-check with more matches.

## Deferred to Phase 6 (AI skill), logged under Audit in KNOWN_ISSUES.md

- **Piecemeal melee attacks into a ranged line:** concentration and engagement choice. The main cause of the remaining gap.
- **Signature buildings cost every AI wins:** the plan gives up economy and builds it at 0:30–1:00.
- **Abilities:**
  - Last Fist's and Bloomhost's cost them wins;
  - Mass Warp is cast 0.01–0.04 times a match, Emergency Brood 0.35.
- **Finishing a won base before the storm.**
- **Rebuilding buildings inside a lost base** (a Hatchery 13 times in a minute).
- **Composition:** Razorwings forced into every Bloomhost army; 44% of Axiarch spending on Shardlings.
- **Axiarch power field:** no forward warp point, no Mass Warp, fights away from the field.
- **T3 upgrade order** (`AI_UPG`) leaves the air capstones unreached.
- **Scripted rush bot:** recalibrate it against the Default AI.
