# Phase 7c report: mechanics, strategy polish and the speed check (v2.43)

**Result in one line:** the four mechanics are in (each behind `MECH7C`, browser-checked at both iPhone sizes), the 1× clock now keeps true speed when frames drop (it lost up to 75% of game time below 20 fps), and the retune met the opening/branch-variety, mixed-field share, containment and Normal targets. It did **not** soften the triangle: every Greedy > Turtle cell is still 100%, and the Bloomhost and Axiarch Turtle now lose every game to Rush (v2.42: 92% and 58% wins). Tech and Contain stay just outside their bands, Bloomhost is 64.6% in Hard vs Hard, and Axiarch Hard beats the Default AI 70.8% (target 75%). The six tuning rounds are spent, so I stopped here, as briefed. A harness flaw found on the way changes how the 7b branch numbers read (below).

**Targets** (final numbers, 24+ matches per cell; logs in `audit/logs7c/final-*.txt`):

| Target | Result | Met? |
|---|---|---|
| Rush > Greedy, Greedy > Turtle, Turtle > Rush each 60–75% per faction | LF 79 / 100 / 100, BH 100 / 100 / 0, AX 42 / 100 / 0 | **No** (worse than v2.42 for the BH and AX Turtle) |
| ≥3 viable openings per faction (≥40% vs the field) | LF 4, BH 4, AX 4 | Yes (BH was 2) |
| ≥3 viable mid-game branches per faction | LF 4, BH 3, AX 3 | Yes (BH was 1) |
| Tech branch ≤60%, Contain branch ≥40% vs the field | 62.8% and 35.5% | **No** (see the sampling fix: v2.42 measures 58.7 / 40.1 on the corrected field) |
| Faction shares 40–60%, Greedy vs Greedy | 47.9 / 41.7 / 60.4% | Axiarchs 0.4 over |
| Faction shares 40–60%, Hard vs Hard | 43.8 / 64.6 / 41.7% | **No** (Bloomhost 4.6 over) |
| Faction shares 40–60%, mixed bot field | 59.9 / 41.0 / 48.7% | Yes (v2.42: 71.7 / 20.8 / 55.9) |
| A correct defender breaks a light Contain ≥60% | 100 / 100 / 100% | Yes |
| A heavy Contain with a clear lead wins | 100 / 100 / 83% | Yes |
| 2–3 nodes beat 1 | mixed field: 2 nodes at 4:00 win 69%, 3 win 72%, 1 wins 48%; controlled set: LF yes, BH no, AX even | Mixed field yes; controlled set only for Last Fist |
| Hard ≥70% vs Greedy, ≥75% vs Default per faction | vs Greedy 96 / 92 / 88%; vs Default 87.5 / 79.2 / **70.8%** | Greedy yes; Default **no for the Axiarchs** |
| Normal near v2.41 against the Rifleman rush; Easy unchanged | Normal beats the rush 72–0 (v2.41: 36–0; v2.42: 24–12); Easy's settings unchanged | Yes |

## Part A: the four mechanics

All four are in `MECH7C` (index.html, just after the field-node constants). `setMech7c(false)` puts back v2.42's mechanics; with `setBalance7c(false)` too and the `hard242` preset for Hard, a match plays as v2.42 (the pinned replays in tests/determinism.test.js, tests/tactics.test.js and tests/hardhuman.test.js prove the mechanics switch). Defaults: `rally 240, holdR 80, node 460, batchV 300, batchT 15, sigPad true`.

### 1. Rally point inside the HQ gun's cover

- **Where:** `rallyU()` is now 240 out from the HQ (was 300). A Rifleman (120 range) shooting units at the rally point stands at 360, inside the T1 gun's 390. At 300, attackers hit the rally point from outside the gun.
- **No trickling:** on Attack, a player's newly trained units wait at the rally point until the group there is worth 300 (credits + energy) or the first of them has waited 15 s, then walk out together (`updateRallyWait`, twice a second). The army that the Attack order found leaves at once; air and support units are never held. It applies to the player's side (and the audit bots); the AI moves its army with its own rules (`mass`, and Hard's `nowave`; its `batch` rule has been off since v2.38).
- **A rally flag you set still works:** a Regroup flag (Army tab → Regroup) sends new units straight to it, unchanged.
- **Measured choice:** 190 was tried first; Greedy vs Greedy then went Bloomhost 25% (its defenders retreat to the rally point and fought too deep in the base). 240 measured 45.8 / 45.8 / 58.3%, 260 41.7 / 54.2 / 54.2%, 300 50 / 41.7 / 58.3% (`gvg-r2-ablate.txt`, 24 per faction).
- Screenshots: `audit/shots7c/polish-858x396-*-4-rally.png` (the blue flag, units gathered under the HQ gun).

### 2. Melee on Hold

- A melee unit on Hold, or on a Regroup flag, now engages enemies within 80 (plus its own reach) of the spot it holds and walks back when they are gone; it never chases further. Before, a melee unit on Hold never engaged at all (`updateUnit`, the branch after the chase rule).
- The same rule covers the AI: a Default/Hard unit told to wait (`aiWait`: its breakout and mass rules) still engages a melee target inside that radius.
- Measured on its own (Greedy vs Greedy, `gvg-r2-ablate.txt`): switching it off moved Bloomhost from about 42% to 25%, so it helps the melee factions defend as intended.
- A larger radius (120, round 6) made things worse (Bloomhost 27.5%, Axiarchs 72.5% in Greedy vs Greedy) and was not kept.

### 3. The third node: moved out of the T1 gun, covered by HQ tiers

**The choice:** each side's own node moves from 380 to 460 out from its HQ (nodes at 680 / 850 / 1020, was 600 / 850 / 1100). All three nodes are now outside every T1 HQ gun, so each is a field fight. The upgraded guns reach further (T2 430 → 530, T3 470 → 560, part of the retune), so **a side that pays for HQ tiers covers its own node; a greedy side (T1) has to hold it with units.** Holding three nodes therefore means beating the enemy army in the field next to its base, and it costs units against anyone who invested in the HQ.

**Why not the other way round (inside the gun):** tried first (310 out, fully inside the T1 gun). Holding the enemy's node then meant sitting in its base, and for the Axiarchs a held node is also a power-field patch: their warp point moved into the enemy base. Greedy vs Greedy went Axiarchs 40–0, Bloomhost 2–38 (`gvg-mech0.txt`). At 380 (v2.42's spot) the mechanics measured 50 / 25 / 75%; at 400, 55 / 20 / 75%; at 460, 58 / 37.5 / 54% (6 seeds each).

**What it costs:** a Turtle that never leaves its base now loses its node for free. This is the main reason the Bloomhost and Axiarch Turtle lose to Rush (below).

### 4. The signature pad

- **One extra pad per side**, outside the 8 (`SIG_SLOT` = 8, tile (2, 0): just right of the HQ, the base's outer corner, clear of every pad). Only a signature building can stand there and only one of the faction's two at a time. Signature buildings can no longer go on the regular pads (a picked regular pad is ignored; the building goes on the signature pad). Selling it frees the pad for the other one at its normal cost.
- **Marked:** the faction's own pad with a dashed gold double border; empty, a pulsing gold star and the word SIGNATURE (your side only).
- **Build menu:** both signature cards carry a gold "★ SIG PAD" tag; once one stands, the other shows "Pad in use". Tapping the pad opens the pad panel ("Signature pad · Salvage Yard or Fortification Depot", and the rule in one line) and scrolls the card row to the two ★ cards. The info card reads "Signature building · on the signature pad, one of the two at a time".
- **Old saves:** the save format is unchanged (the building on the pad is a normal building with `slot: 8`). A v2.42 save with a signature building on a regular pad loads with it where it stands; it still counts as your one signature building (`tests/polish.test.js`).
- Screenshots (`audit/shots7c/`, both sizes, all three factions): `-1-empty-pad` (the marked pad), `-2-pad-panel` (panel and the ★ cards in view), `-3-built` (the building on the pad, "Already built" / "Pad in use", the 8 pads still free).

### How the AI uses them

- **Rally:** every AI's idle and retreat point is `rallyU()`, so its units now wait inside the gun; its pull-back point (`backU`, 120 beyond the rally) moved with it.
- **Melee Hold:** shared unit rule, as above; Hard's breakout hold (units waiting at its defend point) now answers melee attackers that walk in.
- **Nodes:** the AI's node logic reads the node positions, unchanged. Hard's default is still 2 nodes.
- **Signature pad:** the AI builds its signature building on the pad when its plan allows (no plan pad is given up for it any more, and it no longer sells a duplicate to make room). **Hard now builds one** (it never did: `sigAt` was 99999 because it cost a pad). Per faction, from 5:00: Last Fist the Salvage Yard, Bloomhost the Rootheart, the Axiarchs the Phase Beacon (`HARD_SIG_7C`). A/B against the same Hard without one, against Greedy (8 seeds per pairing, 72 each): **66–6 both ways**, every pairing the same. Hard builds it around 5:30 and most of these games are decided by then, so it is neither a gain nor a cost measured here; it gives Hard the same choice a player now has. v2.42's Hard is kept as `hard242`.

## Part B: the retune

All numbers are in `BALANCE7C` (index.html, after `BALANCE7B`); `setBalance7c(false)` restores every v2.42 value, and `setBalance7b(false)` / `setBalance(false)` take it off too (tests/polish.test.js checks each patch both ways). No faction lost a mechanic; Emergency Brood is untouched.

| # | Change | Before → after | Reason |
|---|---|---|---|
| 1 | HQ gun T2 / T3 range (all factions) | 430 / 470 → 530 / 560 | the upgraded gun covers the own node (now 390–530 out): paying for HQ tiers protects your node |
| 2 | HQ gun T3 damage | 62 → 54 | a maxed turtle less of a fortress (the Tech branch) |
| 3 | Refinery build time | 13 → 12 s | a little more safety for greed, and a slightly quicker start (see Part C) |
| 4 | Skitterling cost | 40 → 36 | Bloomhost lowest in identical play once its defenders hold at the new rally point |
| 5 | Bulwark cost | 150 + 30 → 140 + 25 | the same |
| 6 | Rift Mortar cost | 220 + 90 → 250 + 100 | the Axiarch Tech branch wins on Shardlings behind Rift Mortars (6 per won game) |
| 7 | Worldbreaker cost | 460 + 190 → 500 + 210 | the same branch |
| 8 | Null Lance T3 damage | 120 → 85 | the same branch |
| 9 | Tank cost | 280 + 70 → 290 + 75 | Last Fist's Timing branch top of the mixed field |
| 10 | Normal: Turret answer to an infantry rush | a 50% roll per match → always | Normal lost 4 of 12 to the Rifleman rush in every faction (v2.41: 0), always on the seeds where the roll failed |

**Mechanic parameters set during the retune** (in `MECH7C`): rally 240 (was 190 in the first build), node 460 (was 310 in the first build), Hold radius 80 (120 tried and dropped).

### The six rounds

Screening: triangle 8 per cell, Greedy vs Greedy 20 per pairing, the mixed field (344 matches). Shares are Last Fist / Bloomhost / Axiarchs.

| Round | Change | GvG | Field | Tech / Contain | Triangle (R>G, G>T, T>R; LF, BH, AX) |
|---|---|---|---|---|---|
| 0 | mechanics only (rally 190, node 460) | 57.5 / 35 / 57.5 | 55.9 / 31.9 / 61.2 | 63.4 / 34.9 | 8-0 8-0 8-0 · 3-5 8-0 0-8 · 1-7 8-0 1-7 |
| 1 | node income 3.5 + 1.25, HQ T3 54, Turret 130 | 65 / 35 / 50 | (old sampling) | — | 3-5 8-0 8-0 · 4-4 8-0 0-8 · 0-8 8-0 1-7 |
| 2 | HQ T2/T3 range 460/490, Refinery 12 s, Skitterling 36, Worldbreaker, Null Lance T3 100 | 70 / 25 / 55 | 56.6 / 44.4 / 48.7 | 62.8 / 36.6 | 6-2 8-0 8-0 · 8-0 8-0 0-8 · 4-4 8-0 0-8 |
| 3 | + node 400, Rift Mortar, Bulwark | 55 / 20 / 75 | 55.9 / 44.4 / 49.3 | 63.4 / 37.2 | 8-0 8-0 8-0 · 8-0 8-0 7-1 · 4-4 8-0 2-6 |
| 4 | node 460, rally 240, HQ T1 19 | 47.5 / 42.5 / 60 | 61.2 / 40.3 / 48 | 62.8 / 36 | 0-8 8-0 8-0 · 8-0 8-0 0-8 · 3-5 8-0 0-8 |
| **5** | HQ T1 back to 16, T2/T3 range 530/560, T3 54, Null Lance T3 85, Tank | **50 / 40 / 60** | **59.9 / 38.9 / 50.7** | **61.6 / 36.6** | 5-3 8-0 8-0 · 8-0 8-0 0-8 · 3-5 8-0 0-8 |
| 6 | + Hold radius 120, Bastion 270 + 90 | 50 / 27.5 / 72.5 | 58.6 / 42.4 / 48.7 | 63.4 / 33.7 | 6-2 8-0 8-0 · 8-0 8-0 0-8 · 4-4 8-0 0-8 |

**Round 5 ships.** Round 1 was a wash and dropped; round 3's node at 400 fixed the Bloomhost Turtle (7–1 against Rush) but brought back the Axiarch edge in identical play (75%), so the node went back to 460; round 4's stronger T1 gun turned Last Fist's Rush > Greedy into 0–8; round 6 was worse everywhere it was aimed.

**Bot and harness fixes between rounds** (each changes the measurement, not the game):
- **The field sampling (important).** `stratrun.js --set=field` picked each opponent as `bots[(k*7+3) % 20]`, which ties every branch to one opponent branch: Tech always met Contain and Timing always met Air. So 7b's "Tech 74.4%, Contain 25.6%" (they add up to 100) was one head-to-head, not each branch against the field. Fixed (the index shifts by 5 per faction pairing; 16 branch pairings, 8–15 each). On the corrected field **v2.42 itself measures Tech 58.7% and Contain 40.1%** (`field-v242-fixedsampling.txt`), inside both targets. v2.43 measures 62.8% and 35.5%: slightly worse, not better.
- **Repeatable bot matches.** `strat.js` drew its threshold jitter from Node's `Math.random`, so the same seed could play differently (one check match: 495 s vs 515 s). It now uses a generator seeded from the match seed. Earlier phases' bot cells carry that extra noise.
- **The Turtle bot** (Tech branch) chased staging armies into the open after 4:00; it now fights inside its cover all game, as a turtle does (counter-attacks unchanged).

## Final matrices

### The triangle (same faction, 24 per cell, `final-tri.txt`)

| Faction | Rush > Greedy | Greedy > Turtle | Turtle > Rush | v2.42 (7b report) |
|---|---|---|---|---|
| Last Fist | 19–5 (79%) | 24–0 (100%) | 24–0 (100%) | 96 / 100 / 100 |
| Bloomhost | 24–0 (100%) | 24–0 (100%) | **0–24 (0%)** | 100 / 100 / 92 |
| Axiarchs | 10–14 (42%) | 24–0 (100%) | **0–24 (0%)** | 100 / 100 / 58 |

Contain against each (same runs): Last Fist 0–24 vs Greedy, 8–16 vs Turtle, 13–11 vs Rush; Bloomhost 9–15, 24–0, 19–5; Axiarchs 12–12, 23–1, 22–2.

**Why it didn't soften:**
- Between scripted bots each cell behaves like a switch: a small change flips it between 0% and 100% (HQ T1 16 → 19 turned Last Fist's Rush > Greedy from 6–2 to 0–8). The bots don't scout or adapt, so nothing pulls a cell toward the middle.
- **Greedy > Turtle 100% in every round:** the Turtle dies around 5:00 to the Greedy timing push. It out-invests in static defence early and falls behind on economy, and no number tried moved it.
- **Bloomhost and Axiarch Turtle > Rush 0%:** traced (`trace7b.js`, round 5): the rush fails its first wave, the rusher then takes all three nodes (the Turtle never contests its own node, now outside its T1 gun) and parks at its gather flag 720 from the Turtle's HQ. The Turtle bot counts that as a threat at home and counter-attacks once it is 2.5× what it can see; fog hides most of the rusher's army and it dies in the open. Part game (the node is no longer free to keep) and part bot (a counter-attack judged on partial vision).

### Openings against the field (`final-field.txt`, 44–48 games per faction cell)

| Opening | All | Last Fist | Bloomhost | Axiarchs |
|---|---|---|---|---|
| Rush | 48.5% | 54.3 | 43.2 | 47.8 |
| Greedy | 61.8% | 78.3 | 52.3 | 54.3 |
| Turtle | 29.2% | 25.0 | 29.2 | 33.3 |
| Contain | 55.9% | 60.9 | 45.5 | 60.9 |
| Standard | 55.9% | 65.2 | 52.3 | 50.0 |
| **Viable (≥40%)** | 4 of 5 | 4 | 4 | 4 |

v2.42 (corrected sampling): Bloomhost 2 viable (Greedy 52.3, Contain 50), Last Fist 4, Axiarchs 5.

### Branches against the field (56–58 games per faction cell)

| Branch | All | Last Fist | Bloomhost | Axiarchs |
|---|---|---|---|---|
| Timing | 52.9% | 67.2 | 48.2 | 43.1 |
| Contain | 35.5% | 51.7 | 26.8 | 27.6 |
| Tech | 62.8% | 63.8 | 46.4 | 77.6 |
| Air | 48.8% | 43.1 | 55.4 | 48.3 |
| **Viable (≥40%)** | 3 of 4 | 4 | 3 | 3 |

v2.42 (corrected sampling): Last Fist 4, **Bloomhost 0** (Tech 37.5, Air 33.9, Timing 32.1, Contain 21.4), Axiarchs 3.

### Faction shares

| Measure | v2.42 | v2.43 |
|---|---|---|
| Greedy vs Greedy (24 per pairing, `final-gvg.txt`) | 52.5 / 40 / 57.5 (7b) | **47.9 / 41.7 / 60.4** |
| Mixed field (`final-field.txt`) | 71.7 / 20.8 / 55.9 (corrected sampling) | **59.9 / 41.0 / 48.7** |
| Hard vs Hard (24 per pairing, `final-validate-hard-dh.txt`) | 42.5 / 58.8 / 48.8 (7b, 40) | **43.8 / 64.6 / 41.7** |

Greedy vs Greedy pairings: Last Fist 11–13 Bloomhost, 12–12 Axiarchs; Bloomhost 7–17 Axiarchs.

### Containment (24 per cell, `final-contain.txt`)

| Faction | Light Contain vs correct defence | Light vs naive | Heavy Contain (clear lead) vs correct | Heavy vs naive |
|---|---|---|---|---|
| Last Fist | defender 24–0 | Contain 24–0 | Contain 24–0 | Contain 24–0 |
| Bloomhost | defender 24–0 | Contain 24–0 | Contain 24–0 | Contain 24–0 |
| Axiarchs | defender 24–0 | Contain 24–0 | Contain 20–4 | Contain 24–0 |

7b: light broken 100 / 62.5 / 87.5%, heavy won 100 / 100 / 62.5% (8 per cell). The naive defence (retreating to the rally point) still loses to a light Contain: defending correctly is a skill.

### Nodes (24 per cell, `final-nodes.txt`)

**In the mixed field** (`final-nodes-field.txt`, from the field run): nodes held at 4:00 → win rate: 0 nodes 31%, 1 node 48%, **2 nodes 69%, 3 nodes 72%**; at 6:00: 33 / 41 / **65 / 70%**. The side with more node-seconds won 266 of 322 decided matches with a clear gap. v2.42 on the same corrected field: 34 / 39 / 69 / 69% at 4:00 (`v242-nodes-field.txt`). Holding the third node now pays a little more than holding two at 4:00, and slightly less often than in v2.42 at 6:00 (70 vs 80%): it is reachable but contested.

**Controlled** (a greedy timing bot that stops at 1, 2 or 3 nodes, 24 per cell, `final-nodes.txt`):

| Faction | 3 nodes vs 1 | 2 vs 1 | 3 vs 2 |
|---|---|---|---|
| Last Fist | 23–1 | 22–2 | 12–12 |
| Bloomhost | 3–21 | 10–14 | 13–11 |
| Axiarchs | 12–12 | 12–12 | 12–12 |

As in 7b, this set mixes node income with army position: the 1-node bot gathers on its own node, nearer home and now just outside its HQ gun, while the 2- and 3-node bots spread toward the enemy. For Bloomhost's melee army that spread costs more than the income gains. Not met for Bloomhost in this set; met in the mixed field.

## Hard

Validation on seeds the tuning never used (`validate7c.js`; `final-validate-hard.txt`, `final-validate-hard-dh.txt`, `final-validate-hard-ax-greedy.txt`):

| | v2.42 (7b report) | v2.43 | Target |
|---|---|---|---|
| vs Greedy, Last Fist | 35–7 (83%) | **23–1 (96%)** | ≥70% |
| vs Greedy, Bloomhost | 30–12 (71%) | **22–2 (92%)** | ≥70% |
| vs Greedy, Axiarchs | 37–5 (88%) | **21–3 (87.5%)** | ≥70% |
| vs Default, Last Fist | 38–2 (95%) | **21–3 (87.5%)** | ≥75% |
| vs Default, Bloomhost | 39–1 (97.5%) | **19–5 (79.2%)** | ≥75% |
| vs Default, Axiarchs | 36–4 (90%) | **17–7 (70.8%)** | ≥75%, **missed** |
| vs Rush, Turtle, Contain bots (2 seeds × both sides × 3 factions) | 18–0, 15–3, 18–0 | 18–0, 18–0, 17–1 | |

Hard vs Hard (24 per pairing): Last Fist 8–16 Bloomhost, Last Fist 13–11 Axiarchs, Bloomhost 15–9 Axiarchs.

**What changed for Hard and why:**
- **It still varies its opening at random per match** (300 rolls: Last Fist Boomer 164, Economist 69, Turtle 67; Bloomhost Boomer 220, Turtle 80; Axiarchs Boomer 199, Turtle 101) and keeps every phase 7b rule (`read`, `adapt`, `punish`, `breakout`): it scouts from 0:35 and answers Turrets, an early army or a greedy opening.
- **The Axiarch opening mix moved from Turtle 2/3 to Boomer 2/3.** First validation (old mix) came out Hard vs Default 6–6 for the Axiarchs. A search on separate seeds (70000+, 24 paired each, `hardsearch-ax.txt`): Boomer 22–2, Economist 17–7, **Turtle 14–10**. The Turtle opening lost most from the node change (its node now has to be held). With the new mix the validation is 17–7 (70.8%), still under 75%. Dropping the Turtle from the Axiarch list (Boomer and Economist only) is the obvious next step; I didn't, because that would be tuning on the validation seeds after the budget was spent.
- **Uses of the new mechanics:** its units wait inside the HQ gun (rally), its melee defenders on its breakout hold now answer attackers that walk in (Hold radius), it builds a signature building on the pad from 5:00, and its node logic follows the new node positions.
- **Is it weaker?** Against human-style greed it is stronger than v2.42 (Greedy 92% overall, was 81%). Against the Default AI it dropped from 90–97.5% to 71–87.5%: the Default AI benefits from the same safer base (rally under the gun, melee that defends), so the gap closed. Nothing in Hard's rules was weakened.

## Easy and Normal

- **Normal against the phase 5 Rifleman rush** (`rush.js`, 24 per faction, `final-validate-easynormal.txt`): the AI wins **24–0 in every faction** (v2.41: 12–0 each; v2.42: 8–4 each). The 7b losses were always the seeds where Normal's 50% Turret reaction roll failed (`rush-normal-check.txt`: as built 4–8 per faction; with the reaction always on 0–12). Normal now always answers an infantry rush with a Turret (`DIFF.normal.turret` 1, in `BALANCE7C`); Hard always did.
- **Normal and Easy against the Greedy bot** (3 seeds per pairing): Normal 0–27, Easy 0–27 (v2.42: Normal 1–53, Easy 0–54). Greedy play still beats both, as before.
- **Easy:** none of its settings changed (`DIFF.easy` and the Default preset are untouched). The mechanics apply to every side, so Easy's units also wait at the new rally point and its nodes moved; against the Rifleman rush (24 per faction) the rush wins 13 / 18 / 17 games (v2.42 on the same seeds: 12 / 24 / 17, `rush-easy-v242.txt`): about the same, a little better for Bloomhost.
- A human playtest of Normal's feel was not possible here.

## Part C: the game speed check

**How:** `audit/sim/speed7c.js` plays the real page in headless Chromium at iPhone landscape size (858×396), measures game seconds per real second and frames per second over 8 s after a warm-up, in the early game and in a large battle (40 mixed units a side in mid-lane on Attack), at normal CPU and with Chrome's CPU throttling at 4×. v2.35 and v2.40 are their own commits' index.html. This container has no GPU, so its frame rates are low in absolute terms; what matters is how the clock behaves when frames drop.

| Version | Normal CPU, early | Normal CPU, battle | 4× throttle, early | 4× throttle, battle |
|---|---|---|---|---|
| v2.35 | 1.00× (39 fps) | 1.01× (31 fps) | **0.32×** (6.4 fps) | **0.27×** (5.4 fps) |
| v2.40 | 1.00× (38 fps) | 1.01× (30 fps) | **0.31×** (6.3 fps) | **0.25×** (5.0 fps) |
| v2.43 before the fix | 1.00× (37 fps) | 1.01× (30 fps) | **0.33×** (6.6 fps) | **0.25×** (5.0 fps) |
| **v2.43** | 1.00× (38 fps) | 1.01× (30 fps) | **1.02×** (6.3 fps) | **1.02×** (4.7 fps) |

(`speed-1.txt`, `speed-2-fixed.txt`; the 1.02 is the measurement window starting just after a frame.)

**Finding:** the clock was tied to the frame rate. Each frame advanced the game by the real time since the last frame, **capped at 50 ms**; below 20 frames a second the game simply lost the rest (at 6 fps, two thirds of every second). Every version since at least v2.35 did this; nothing got slower between versions at normal CPU. A heavy battle or a hot, throttled phone can drop below 20 fps, and then 1× runs slow.

**Fix (v2.43, the UI's frame loop only):** a fixed timestep. Real time since the last frame (at most 0.25 s of it, so a stall or a hidden tab can't make the game spiral) goes into an accumulator; the SIM steps 1/60 s at a time until it has caught up. Now 1× is 1.0× at 5–6 fps too. **The SIM is unchanged:** the harness and every test drive `update()` directly, so match results and the replay fingerprints are identical (tests/determinism.test.js). Browser checks: tests/browser.test.js and tests/countdown.test.js pass (GET READY still takes real seconds).

**Pacing (the other half of "feels slower"):** the clock was accurate at normal CPU, so I measured the early game (`pace7c.js`, mirror matches, 18 per row, `pace.txt`):

| | First Barracks | First unit | 3rd Refinery | Credits by 1:00 | by 2:00 | by 3:00 |
|---|---|---|---|---|---|---|
| Greedy opening, v2.41 numbers | 65 s | 76 s | 51 s | 709 | 2,095 | 3,775 |
| Greedy opening, v2.42 numbers | 81 s | 91 s | 70 s | 512 | 1,713 | 3,451 |
| Greedy opening, v2.43 (first build) | 81 s | 91 s | 70 s | 512 | 1,706 | 3,444 |
| Hard's opening, v2.41 numbers | 34 s | 47 s | — | 567 | 1,502 | 2,715 |
| Hard's opening, v2.42 numbers | 47 s | 59 s | — | 445 | 1,364 | 2,588 |

v2.42's economy numbers (Refinery 150 → 175 credits and 10 → 13 s, payback 37.5 → 44 s; the HQ's T1 gun halved) push a greedy start's first Barracks back 16 s and its first unit 15 s, and cut credits by 1:00 by 28%. That is a real slower start, separate from the clock. v2.43 takes one second back (Refinery 12 s); the rest stays, because it is what makes greed risky.

## Verdict: strategic variety

**Better spread, not a softer triangle.**
- **What improved:** every faction now has four workable openings and three or four workable mid-game plans against the field; Bloomhost had two and none (corrected sampling). Faction strength in mixed play went from Last Fist 72% / Bloomhost 21% to 60 / 41 / 49. The mechanics make the player's base safer to fight from (rally under the gun, melee defenders that defend) and give the signature buildings a real choice every match (one pad, two buildings, no economy given up).
- **What didn't:** the triangle is as steep as before, and for the Bloomhost and Axiarch Turtle it flipped: against these bots a Turtle can't hold Rush any more, because its node now has to be fought for. The Tech and Contain branches are slightly worse than v2.42 once the measurement is corrected.
- **What I'd do next (not done, budget spent):**
  1. Measure the triangle with bots that scout and adapt (a Greedy bot that builds a Turret when it sees an early army, a Turtle that contests its node). The user target ("scouting and adapting can save a bad opener") is about adaptive play; scripted openers give 0/100 cells by construction.
  2. The Turtle's node: a cheap way for a turtle to hold it (a Turret pad near it, or the bunker idea from the Fortification Depot for everyone at T2 HQ).
  3. The Axiarch Tech branch (78%): its Shardling mass under the Null Lance and HQ; a Shardling or power-field look, not the T3 units.
- **Hard:** still beats human-style greedy play 92% and the strategy bots 53–1, and still varies and adapts its opening. Its margin over the Default AI shrank (the mechanics help every side defend), and the Axiarchs fall under the 75% bar.

## Tests

**Automated:**
- `npm test`: first full run on the final build 384 of 387 (`npm-test-final.txt`). The three failures, each read and fixed: the Null Lance test required T3 to hit more than twice T1 (85 vs 55 now; relaxed to 1.5×, still the heavy hit); the v2.39 Salvage test pinned the Bulwark's v2.39 cost (now runs with `setBalance7c(false)`); a seeded Axiarch AI match no longer happened to take the Rupture path (now pinned to v2.42 with both switches off; the path mapping it checks is unchanged). Final run: **387 of 387 passed** (`npm-test-final2.txt`; two comments and one test name were edited during that run, and tests/polish.test.js and tests/polish-ui.test.js were re-run after: 20 of 20).
- **New:** tests/polish.test.js (14 tests: both switches both ways, rally point and node geometry, melee Hold on and off, Regroup flags, grouped reinforcements, player-side only, the signature pad's rules for all three factions, saves old and new, the AI building on the pad, Hard's signature dial, the 7c spot checks) and tests/polish-ui.test.js (browser, 6 tests: the pad, its panel, the ★ cards, "Already built" / "Pad in use", the 8 pads left free, the rally point, at 858×396 and 667×375, all three factions; no page errors).
- **Pinned to v2.42** (`setMech7c(false)`, as earlier phases did): determinism (all six fingerprints match their recorded hashes), tactics' v2.39 replays, hardhuman's Default replays, signature, bloomhost-sig, axiarchs-sig and their browser tests, ax-abilities. Updated for the new rules: ai.test.js (node positions), tactics' mass test (target beyond the Hold radius), orders-weapons' warp test (waits out the rally batch), strategy.test.js (checks the 7b layer with 7c off).

**Browser (manual, with screenshots):** the signature pad, its panel and cards, the built pad and the rally point at both iPhone sizes for all three factions (`audit/shots7c/`). Fixed during the check: the "SIGNATURE" label overlapped the pad below it (moved inside the pad), and the ★ cards were off-screen when the pad was tapped (the card row now scrolls to them). Speed: `speed7c.js` (Part C).

**Simulation:** every number above, with its log in `audit/logs7c/`.

**Not verified:** play by a human (the feel of the rally batching, the new node positions, Normal's difficulty), and real iPhone frame rates (the speed check ran in headless Chromium without a GPU; CPU throttling stands in for a slow phone).
