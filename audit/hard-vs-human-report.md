# Phase 7a report: Hard against human-style greedy play (v2.41)

**Result in one line:** v2.41 Hard beats the Greedy bot 79–47 (62.7%), up from 11–115 (8.7%) for v2.40 Hard on the same seeds. Last Fist meets the ≥70% target (79%); Bloomhost (50%) and Axiarchs (60%) do not. Almost all their losses are against a Last Fist Greedy (1–13 each). Greedy-vs-Greedy runs suggest that is Last Fist's faction strength, not only AI skill. Hard still beats Default 39–1, 40–0 and 38–2. Easy and Normal play bit for bit as in v2.40.

**Targets:**

| Target | Result | Met? |
|---|---|---|
| Hard beats Greedy ≥70% with each faction | Last Fist 79%, Axiarchs 60%, Bloomhost 50% | Last Fist only |
| Hard still beats Default ≥75% per faction | 97.5%, 100%, 95% | Yes |
| Easy and Normal unchanged | Identical replays (fingerprint test) | Yes |

Per the brief, I stopped after one round of fixes and one re-search rather than looping on the missed target.

**Method:**
- Every number comes from the harness (audit/sim) playing the game's real SIM. Hard difficulty, seeded, 30-minute cap.
- The Greedy bot always plays side 0 (the player's slot), as you did. The AI plays side 1.
- Raw logs are in `audit/logs7a/`. The intermediate probes are in `audit/logs7a/probes.md`.
- Noise: a 54-match set has a standard error of about ±3.5 wins, and a 126-match set about ±5.5.

## Part A: the Greedy bot

`audit/sim/greedy.js`, run by `audit/sim/greedyrun.js`. It uses only the player's controls: build, upgrade, train, stance, Regroup flag and abilities. It sees only what side 0 can see.

**The opening (the same for every faction):**

| Time | What it does |
|---|---|
| 0:00–0:22 | Three economy buildings: two Refineries at once, the third at about 0:21. |
| ~0:35 | A Barracks, then one cheap unit (Rifleman, Skitterling or Shardling) that walks the three field nodes. It takes its own node, the middle one, then the enemy's from the near edge, just outside the HQ gun. |
| ~0:55–1:45 | Every Refinery to T2 (the first at 1:00), then a Reactor and a Habitat. |
| to 2:30 | No army beyond the node runner. If attacked, greed ends at once: it pulls back to the base, trains from everything and defends. |
| 1:40 on | War Factory and Tech Lab, then production and Habitat upgrades. |
| 2:30 on | A mixed army from every producer. |

**The mixed army:**

| Faction | Unit shares | Paths |
|---|---|---|
| Last Fist | Riflemen 3, Heavies 2, Tanks 2, Flame Tanks 1, Gunships 1.5 | Specialists, Assault, Support |
| Bloomhost | Skitterlings 3, Spitters 2, Bulwarks 2, Thornbacks 1, Razorwings 1.5 | Acidic, Predator, Swarm |
| Axiarchs | Shardlings 3, Lancers 2, Bastions 2, Gravemantles 1, Wraithwings 1.5 | Lattice, Dominion, Swarm |

`noAir` drops the flyer, for the counter check.

**Army control and abilities:**
- **Regroup:** it gathers at a flag 90 short of the middle node. It attacks only when 1,600 of army value has arrived there, or when it is at its army limit with most of the army there.
- **Fall back:** when the attack has lost 60% of its strength, it falls back and regroups.
- **Shield-type** (Emergency Shield, Frenzy, Overcharge): on 4+ of its units with 3+ enemies near.
- **Strike-type:** on the densest visible clump of 4+ enemies.
- **Repair-type** (Repair Pulse, Emergency Brood, Mass Warp): on 4+ hurt units.

**Calibration against your games:**
- At 2:00 the bot has earned 2,106 credits against v2.40 Hard's 1,201 (1.75×; you saw 1.6–1.8×).
- It holds all three nodes by 2:00.
- It makes one attack at about 3:20–3:40, which usually ends the match at 5:00–5:40 (you won in 7–9 minutes).
- v2.40 Hard's first attacks came at 2:00–2:50, in 2–12 separate waves per match.

**Baseline:** v2.40 Hard (now the `hard240` preset) won 8–100 against Greedy on the first seed set and 11–115 on the validation seeds:

| v2.40 Hard (AI) vs Greedy bot | Last Fist bot | Bloomhost bot | Axiarch bot |
|---|---|---|---|
| Last Fist AI | 0–14 | 0–14 | 2–12 |
| Bloomhost AI | 0–14 | 0–14 | 4–10 |
| Axiarch AI | 0–14 | 0–14 | 5–9 |

## Why Hard lost

From traces of single matches (`trace.js`-style, logged in probes.md):

1. **Its economy fell behind by design.**
   - The Economist opening caps the army at 50–60% of its limit until 5:00 (`earlyFill`) and builds only two Refineries.
   - The cap stays even when the opponent's army is already larger.
   - So by 3:00 the greedy player had more income and a bigger army.
2. **It attacked into the HQ gun with small armies.**
   - First pushes came at about 2:00 with 300–800 of army, against a base that answers with its HQ gun and a full bank.
3. **Piecemeal waves, despite the engage rule.** Three reasons:
   - Node and field pushes skipped engage's regroup timer.
   - A field push only weighed enemies already seen near the field line. A human's army out of sight counted as zero.
   - After a retreat it went again 3–12 seconds later. By then fading intel had shrunk the enemy it remembered, so it walked into the same army again: five or more cycles a match.
   - (In the engage rule, a field push records no launch value, so `failed()` never armed the regroup timer for it.)
4. **Energy-starved.** One Reactor at T1 or T2 against three Refineries:
   - Its energy bank sat at 10–80 from 3:00 on, while credits piled up (500–1,200).
   - Tanks, Bulwarks and upgrades waited on energy.
5. **Anti-air against no air.**
   - The "train each path unit once" rule (pathUnitsFirst) pushed the Interceptor to the top.
   - When rich, the spare-money buy picked it even at a score of 0.05.
6. **Wasted Emergency Shields.** The shield fired whenever enemies were within 230 of a unit, whether or not they could shoot it.

## Part B: the fixes and their A/B results

Every rule is a switch in `AI_TACTICS` (index.html). All are off in Default and on in Hard, except `punish`.

**Leave-one-out A/B:**
- The full candidate (Boomer opening plus all rules) against the same candidate with one rule off.
- 54 matches each against Greedy (3 × 3 faction pairings, 6 seeds, seeds 90000+).
- Log: `audit/logs7a/ablate1.txt`, `read-split.txt`.

| Rule | What it does | With / without (AI wins of 54) | Kept? |
|---|---|---|---|
| `fill` | The opening's army cap lifts at 2:30, or once the enemy army it knows of is worth 70% of its own. | 37 / 35 | Yes |
| `est` | An unseen army still counts. Enemy army = at least 40% of what its scouted economy has earned (HQ, Refineries seen at their tiers, the nodes the enemy holds), phased in from 2:00 to 3:30, minus the value it has killed. | 37 / 34 | Yes |
| `contest` | Every personality contests the middle node when the enemy holds it or is taking it with little around it, from 150 army value (was 250, opportunists only). It takes back its own node from 150. | 37 / 32 | Yes |
| `power` | Energy-starved (bank under 100, energy income under a fifth of credit income, after 2:00): another Reactor; else the Reactor upgrades first; else, with every Reactor at T3 and 600 banked, a Refinery traded for a Reactor. | 37 / 32 | Yes |
| `nowave` | No piecemeal waves: every push (node and field too) waits out a 20 s regroup after a retreat; 70% of the army must be gathered; it must be 1.2× the army that last turned it back (the memory fades over 2 min); a field push must beat everything it knows of and expects. | 37 / 35 | Yes |
| `shield` | Emergency Shield and Shield Overcharge only on units already taking fire: an enemy with that unit in reach, and 2+ of its units in the circle hit in the last 1.5 s. Frenzy Bloom and Emergency Brood are untouched. | 37 / 36 | Yes (see the separate check below) |
| `counter` | No anti-air-only unit until it has seen enemy aircraft that hit the ground. An infantry flood (light units over 55% of what it knows of, 5+ seen) sends the War Factory down the Assault path (Flame Tanks; for Bloomhost Predator, for the Axiarchs Dominion) and scores splash and flame units 1.4× and basic infantry 0.7×. | 37 / 37 | Yes (see the separate check below) |
| `read` | Early scouting: a unit of its own at about 0:50, sent to the edge of the enemy HQ gun, where it sees the buildings. It marks a greedy opening (3+ economy buildings, an upgraded Refinery, or 2 nodes held with under 350 of army seen), then puts the army first for up to 2:30 (no Tech Lab or third Refinery, no upgrades unless floating). | 41 / 41 (with `punish` off) | Yes: neutral, feeds `est` |
| `punish` | With `read`: the timed attack on a greedy opening at 1:45 (first at the base, then reworked to the field). | 37 / 41 | **No**: worse |

**Where the gain came from:** most of it came from the opening, not the rules.
- Boomer with no rules: 10–17 in 27 matches.
- The Economist with all the rules: 3–51 in 54 matches.

**Separate checks for the two rules whose aim is not just winning:**
- **`shield`** (Last Fist Hard vs Greedy, 24 matches, `audit/logs7a/shield.txt`):

  | | Casts | Damage blocked | Per cast | Record |
  |---|---|---|---|---|
  | Rule off | 20 | 2,308 | 115 | 18–6 |
  | Rule on | 6 | 1,416 | 236 | 18–6 |

  Fewer casts, each blocking twice as much, and the same record.
- **`counter`** (Last Fist Hard vs a ground-only Greedy, 24 matches, `audit/logs7a/counter2.txt`):

  | | Interceptors | Flame Tanks | Record |
  |---|---|---|---|
  | Rule off | 44 | 0 | 19–5 |
  | Rule on | 0 | 3 | 19–5 |

  - Without the rule: 44 Interceptors, against an army with no aircraft.
  - The first version of the rule (`counter.txt`) still allowed 33. The spare-money buy ignored the score. It now excludes anti-air-only units outright.
  - Flame Tanks stay rare: the flood test needs light units over 55% of what it has seen, and the Greedy army is mixed.

**Why the engage rule didn't stop the waves (the question in the brief):**
- Engage's regroup timer (12 s) applied only to base and siege pushes.
- Its "losing here" retreat called `failed()`, which does nothing for a field or node push (no launch value).
- Its strength test for those pushes counted only enemies seen near the target.

`nowave` closes all three gaps, but its measured effect is small.
- The number of pushes per match against Greedy (`aiLog.attacks`, which counts node and field pushes too) barely changed: v2.41 Hard made 1–9 (median 4) over 18 matches (`audit/logs7a/waves-v241.txt`); v2.40 Hard made 2–12 (median 3.5).
- What the rule changes is when a push may leave: never within 20 s of a retreat, only gathered, and only with 1.2× the army that turned the last one back.
- Its A/B gain (+2 wins in 54) is within noise. I kept it because it does what the brief asks and costs nothing measurable.

## The Hard strategy search, with Greedy in the field

**Setup:**
- Tool: `audit/sim/hardsearch7a.js`.
- Each candidate (an opening and dials, all kept rules on) played the Greedy bot of all three factions (18 matches) and the Default field of its own faction (10 paired).
- Score = the mean of the two win shares.
- Logs: `search1.txt`, `search2.txt`.

**Round 1** (all at reaction 0.6 unless stated). Each cell is the score, then the record vs Greedy and vs Default:

| Opening | Last Fist | Bloomhost | Axiarchs |
|---|---|---|---|
| **Boomer** (new: the greedy opening) | 89 (16–2, 9–1) | 78 (10–8, 10–0) | **89** (14–4, 10–0) |
| Boomer, reaction 1.0 | **92** (17–1, 9–1) | **81** (11–7, 10–0) | 73 |
| Economist (v2.40 Hard's) | 65 (9–9, 8–2) | 58 (3–15) | 53 (1–17) |
| Turtle | 38 | 43 | 54 |
| Aggressor | 10 (0–18) | 30 (0–18) | 20 (0–18) |
| Trickster | 53 | 46 | 36 |

**Round 2:**
- **Bloomhost:** Boomer with the factory, Tech Lab or barracks path changed, nodes 3, or reaction 0.8 all scored 72–81. None beat plain Boomer.
- **Last Fist:** the Air Power Tech Lab first scored 89, reaction 0.8 scored 89.
- **Axiarchs:** Dominion factory scored 86, reaction 0.8 scored 78.

**The search adopted the greedy opener itself.** Hard now plays the **Boomer** opening (a new personality, never rolled at random; `PERSONA_EXTRA`):
- three Refineries first;
- every Refinery to T2 from 0:15;
- army capped at 35% of its limit until the `fill` rule lifts it;
- a Barracks, Reactor, Habitat, War Factory and Tech Lab after.

## The new Hard settings (`AI_PRESETS.hard`)

| Faction | Opening | Reaction delay | Signature building | Rules |
|---|---|---|---|---|
| Last Fist | Boomer | 0.6 | none | Default's + `HARD_FIX` |
| Bloomhost | Boomer | 1.0 | none | Default's + `HARD_FIX` |
| Axiarchs | Boomer | 0.6 | none | Default's + `HARD_FIX` |

- `HARD_FIX` = `read`, `contest`, `counter`, `nowave`, `shield`, `power`, `fill`, `est`. `punish` stays off.
- In round 1, Last Fist scored 92 at reaction 1.0 against 89 at 0.6. That is within noise, so it keeps 0.6.
- No resource bonus and no information a player wouldn't have: the estimate uses only its own sightings and node ownership.
- v2.40's Hard is kept as the `hard240` preset (spectate menu and harness).

## Before and after (validation, fresh seeds, `audit/logs7a/validate.txt`)

**Against Greedy** (14 seeds per pairing, seeds 96000+, AI wins–losses):

| AI faction | Last Fist bot | Bloomhost bot | Axiarch bot | Total (v2.41) | v2.40 Hard, same seeds |
|---|---|---|---|---|---|
| Last Fist | 9–5 | 10–4 | 14–0 | **33–9 (79%)** | 2–40 (5%) |
| Bloomhost | 1–13 | 6–8 | 14–0 | **21–21 (50%)** | 4–38 (10%) |
| Axiarchs | 1–13 | 12–2 | 12–2 | **25–17 (60%)** | 5–37 (12%) |
| All | | | | **79–47 (62.7%)** | 11–115 (8.7%) |

**Against Default** (40 paired matches per faction, seeds 76000+):

| Faction | v2.41 Hard | v2.40 Hard (6a report) |
|---|---|---|
| Last Fist | 39–1 | 39–1 |
| Bloomhost | 40–0 | 39–1 |
| Axiarchs | 38–2 | 38–2 |

**Easy and Normal:**
- Every new rule is off in the Default preset, and only Hard games use the Hard preset.
- `tests/hardhuman.test.js` replays seeded Default-vs-Default matches on Normal, Easy and Hard (10 minutes each). They hash identically to v2.40.
- So Easy and Normal are exactly as hard as before. The new rules did not go into Default: none was measured there, and keeping Default untouched guarantees that result.

## Hard vs Hard faction win shares (after the fixes)

40 paired matches per pairing, seeds 77000+:

| Pairing | Result |
|---|---|
| Last Fist vs Bloomhost | 34–6 |
| Last Fist vs Axiarchs | 33–7 |
| Bloomhost vs Axiarchs | 22–18 |

| Faction | v2.41 share | v2.40 share |
|---|---|---|
| Last Fist | 84% | 85% |
| Bloomhost | 35% | 6% |
| Axiarchs | 31% | 59% |

**Faction strength or AI play?** You won easily with all three factions, so I checked with the Greedy bot against itself (`botvbot.js`, identical scripted play on both sides, 20 matches per pairing with each faction on each side, `audit/logs7a/botvbot.txt`):

| Greedy vs Greedy | Result |
|---|---|
| Last Fist vs Bloomhost | 20–0 |
| Last Fist vs Axiarchs | 18–2 |
| Bloomhost vs Axiarchs | 13–7 |

Cross-faction shares: Last Fist 95%, Bloomhost 33%, Axiarchs 23%. Mirror matches: Last Fist and Bloomhost mirrors all 20 drawn (identical scripted play stalls), Axiarchs 10–10.

- **Last Fist's lead looks like faction strength, at least for this style of play.** With the play held identical, Last Fist wins 38 of 40. This is the main input for 7b.
- **Bloomhost against Axiarchs flipped with the AI change** (5–35 in v2.40 Hard, 22–18 now; the bots go 13–7). So the v2.40 Bloomhost 6% was largely how the AI played Bloomhost (the Economist cap and the energy starvation hit Bloomhost hardest).
- **The Axiarch share fell from 59% to 31%.** Part of that is Bloomhost's AI catching up. The bots' 23% suggests the Axiarchs are also weaker than the 6a numbers showed. Treat the Axiarch number with care.
- **The missed ≥70% target for Bloomhost and Axiarch Hard comes from one pairing: against a Last Fist Greedy (1–13 each).**
  - Against the other two bot factions they win 20–8 (Bloomhost) and 24–4 (Axiarchs).
  - The Greedy-vs-Greedy result (0–20, 2–18) suggests the AI can't close that matchup without a balance change.

## What Hard now does in the first 3 minutes against a greedy opener

Last Fist Hard against an Axiarch Greedy, seed 96000 (from the timeline script):

| Time | Hard |
|---|---|
| 0:01–0:22 | Three Refineries (the bot builds the same three). |
| 0:35–0:53 | Barracks, Reactor, Habitat; its first Rifleman goes out to scout at 0:53. |
| 1:13, 1:40 | Refineries to T2. War Factory at 1:20. |
| 1:43 | The scout has seen the bot's economy: it marks a greedy opening, lifts its army cap and stops teching. |
| 1:49–1:56 | Riflemen and a Tank; it moves on the bot's node runner and the middle node (army 500 vs 263). |
| 2:00 | The bot holds all three nodes (Hard has earned 1,708 to the bot's 2,087). |
| 2:15 | Pushes on with 650 against no bot army in the field. |
| 2:30 | One node each way. |
| 3:00 | Hard holds all three nodes, with a continuous Rifleman and Tank stream. |
| 3:28 | Pulls back to regroup once the bot's army comes out (1,500 vs 563). |
| 3:50 | Attacks with 2,400 against 913, as one army. |

## Remaining weaknesses

- **Against a Last Fist greedy player, Bloomhost and Axiarch Hard win only about 1 in 14.**
  - The bot-vs-bot result points at the Last Fist faction (7b), not only the AI.
  - Re-check this after any balance change.
- **The timed punish attack lost wins.** A real punish of a greedy opener is not something the AI has.
  - A small early army into a full bank and an invulnerable HQ gun loses its army.
  - The gain came from matching the economy, taking nodes and fighting as one army instead.
  - A human may still find the AI slow to exploit a greedy opener that over-reaches without the bank to back it.
- **Flame and splash rarely appear:** the flood test needs light units over 55%, and mixed armies seldom trip it.
- **The estimate (`est`) is coarse:**
  - a fixed 40% army share;
  - Refinery tiers last seen;
  - no knowledge of what the opponent spent on buildings or upgrades.

  An opponent who banks heavily or loses units to something other than this AI is over-estimated, making Hard cautious.
- **The Greedy bot is one scripted style.** Its attack threshold (1,600) and composition are fixed. A human adapts, and a human who rushes is a different test (the phase 5 rush checks still apply to Normal and Easy, which are unchanged).
- **A known blind spot of the Greedy bot itself:** mirror matches between identical bots draw (Last Fist and Bloomhost), so the bot can't break an equal base. This doesn't affect the AI-vs-bot results.
- **Not done (as asked):** rebuilding buildings inside a lost base; any change to Emergency Brood; any unit balance.

## Tools added (audit/sim)

| File | Purpose |
|---|---|
| `greedy.js` | The Greedy bot. |
| `greedyrun.js` | An AI against the bot, 3 × 3 pairings. |
| `ablate7a.js` | Leave-one-out A/B. |
| `hardsearch7a.js` | Strategy search with Greedy in the field. |
| `validate7a.js` | Final validation. |
| `shield7a.js` | Defensive casts, damage blocked. |
| `counter7a.js` | Anti-air and splash choices against a ground-only bot. |
| `botvbot.js` | Greedy against Greedy, faction strength. |

Changes to existing files:
- `match.js` plays a bot in the player's slot (or on both sides). A side's `dial.paths` overrides its production paths.
- `load.js` exports the player controls.

## Tests

- **Final `npm test`:** 362 of 362 passed (`audit/logs7a/npm-test-final2.txt`).
- **Earlier runs** (logs kept):
  - `npm-test-1.txt`: 361 of 362. The Bloomspire coverage test ran a Hard game, which now plays the Hard preset; it now names `ai: 'default'`, like the other general-AI tests.
  - `npm-test-final.txt`: 360 of 362, two intermittent tests:
    - tests/redesign.test.js "P11 Worldrender" is unseeded. It also fails 3 runs in 8 on v2.40's index.html, so it predates this phase.
    - The browser "GET READY" test timed out while a simulation was loading the CPU. It passed on two reruns.
- **New tests** (tests/hardhuman.test.js):
  - Default replays hash as v2.40 on Normal, Easy and Hard.
  - The Boomer opening is never rolled at random, and the new rules are off in Default.
  - The Hard preset's settings.
  - The shield rule (no shield before fire, a shield under fire).
  - The army estimate.
  - The counter path choice.
  - A full Greedy-vs-Hard match.
- **Not checked in a browser:** no new UI. The only visible change is the end-of-match name "The Boomer" for Hard's personality.
