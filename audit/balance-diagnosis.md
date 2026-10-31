# Phase 5 balance diagnosis (v2.38 baseline)

Step 1 of the Phase 5 balance pass: why the factions win and lose, before anything is changed. Every number below comes from the harness (audit/sim) playing the game's real SIM. Nothing here is from code inspection alone.

## How it was measured

- **Main matrix** (`node audit/sim/balance.js --n=40 --mirror=20 --persona=8 --diag --tag=base`, audit/sim/out/balance-base.md):
  - Default AI on Hard for both sides, random personalities.
  - 40 matches per cross-faction pairing, 20 mirrors per faction, and 8 matches per pairing with both sides on the same personality (4 personalities × 3 pairings = 96 matches).
  - 276 matches in total, seeded; sides alternate left and right.
- **The 30-minute cap.** The Extinction Event decides every match by 27:00 (score at the limit), so nothing reached the cap. A match is reported as:
  - ended before 20:00 (an HQ fell);
  - decided after 20:00 (in the storm, or on score);
  - a true draw (equal score, kills and credits).
- **Diagnostics** (audit/sim/instrument.js) wrap `damage()` and `kill()` inside the match's SIM context. They count HP plus shields removed, and the value killed, per weapon in 5-minute buckets. They draw no random numbers, so a match plays identically with or without them (checked on one seed: same length, winner and samples).
- **Paired A/B runs** (audit/sim/ab2.js) replay a pairing on the same 40 (or 30) seeds as the baseline with one change, so the difference is the change alone. Matches are fully seeded, so an unchanged rerun reproduces the baseline exactly. Run-to-run noise at n = 40 is still about ±7 percentage points (one standard error), so single-pairing differences of 2–3 wins are not significant.
- **Controlled duels** (audit/sim/duel.js):
  - two armies of equal value (credits + energy) or equal supply meet mid-lane;
  - no AI, no buildings in reach, both on Attack, full vision;
  - each fight is repeated on several seeds.
  - They measure raw combat value. They leave out creep, the power field, production, positioning and AI decisions, so they are a proxy, not the answer.

## Baseline results

| Pairing | Matches | Wins–losses (final) | Share of decided | Open at 20:00 | Mean length |
|---|---|---|---|---|---|
| Last Fist vs Bloomhost | 40 | 33–7 | **Last Fist 82.5%** | 5 (12.5%) | 11:57 |
| Last Fist vs Axiarchs | 40 | 29–11 | **Last Fist 72.5%** | 4 (10%) | 11:51 |
| Bloomhost vs Axiarchs | 40 | 19–21 | **Bloomhost 47.5%** | 11 (27.5%) | 14:19 |

| Faction | Cross-faction win share (random personalities) | Same-personality sets |
|---|---|---|
| Last Fist | **77.5%** (62–18) | **95.3%** (61–3) |
| Bloomhost | **32.5%** (26–54) | 23.4% (15–49) |
| Axiarchs | **40.0%** (32–48) | 31.3% (20–44) |

There were no true draws. Per personality, Last Fist won 16 of 16 as the Aggressor and as the Economist, 14 of 16 as the Turtle, and 15 of 16 as the Trickster.

Mirrors: Last Fist 12–8, Bloomhost 7–13, Axiarchs 11–9 (A–B with alternating sides).

(Phase 4's "~88%" came from Default vs **Legacy**. With both sides on Default the gap is a little smaller, and it is still far outside 40–60%.)

## 1. Why Last Fist wins

### Economy or combat? Combat, from 4 to 8 minutes. The economy follows.

Means over the 40 matches of each pairing, for the matches still running at each mark (balance-base, `node audit/sim/analyze.js base`):

| Time | Last Fist vs Bloomhost: credits earned | Army value | Nodes held | Last Fist vs Axiarchs: credits earned | Army value | Nodes held |
|---|---|---|---|---|---|---|
| 2:00 | 869 vs 912 | 45 vs 25 | 0 vs 0 | 861 vs 936 | 51 vs 18 | 0 vs 0 |
| 4:00 | 2,238 vs 2,270 | **383 vs 331** | 1.2 vs 0.9 | 2,289 vs 2,312 | **450 vs 190** | 1.6 vs 0.4 |
| 6:00 | 4,182 vs 4,066 | **945 vs 508** | 1.8 vs 1.1 | 4,481 vs 3,878 | **915 vs 291** | 2.1 vs 0.6 |
| 8:00 | 6,407 vs 5,665 | **1,268 vs 479** | 2.3 vs 0.7 | 7,018 vs 5,311 | **1,330 vs 321** | 2.4 vs 0.5 |
| 10:00 | 8,255 vs 7,244 | 1,680 vs 477 | 2.4 vs 0.5 | 9,136 vs 6,724 | 1,440 vs 433 | 2.2 vs 0.8 |

- **Income is even at 4:00** (within 2%). No faction is richer before the fighting starts.
  - No side trains a unit before about 2:20–2:50: the first unit came at 2:43 (Last Fist), 2:19 (Bloomhost) and 2:49 (Axiarchs), mirror means over 10 seeds.
  - By 4:00 all three have spent about the same on units: 736, 627 and 618.
- **Combat at 4–8 minutes opens the gap.** Of what each faction spent on units by 4:00, Last Fist still has about 400 alive, the Axiarchs 190.
  - By 6:00 Last Fist fields 1.9× Bloomhost's army and 3.1× the Axiarchs'.
  - It then holds 2 or more of the 3 nodes, and its income pulls ahead from 6:00. The economic gap is a result of the fights, not their cause.
- **Where Bloomhost and Axiarch armies lose:** in the open, at the nodes, in the first engagements, and then at home.
  - Their **HQ gun is their biggest damage dealer**, about 6,000 damage per match each (Bloomhost 6,047, Axiarchs 5,795), 3,600 credits of Last Fist units killed per match. Last Fist's HQ gun deals 1,526.
  - So after the first fights they defend at their HQ while Last Fist attacks.
- **Last Fist wins by breaking buildings, not by trading units.**
  - Over the cross and personality matches, Last Fist loses **more** unit value than it kills: trade ratio 0.87. Bloomhost is at 0.99 and the Axiarchs at 1.14.
  - Last Fist deals about **10,800 building damage per match**. Its biggest items: Tank cannon 2,484, Riflemen 2,132, Artillery 1,870, Heavies 1,866, Orbital Strike 578.
  - Bloomhost deals about 3,800 and the Axiarchs about 3,700.
  - Their main weapons are made for units: claws and blades do 0.5–0.6× to buildings, acid 0.4×, the Lancer's bolt 0.6×.
  - Losses come late: Bloomhost's median loss is at 13:57, the Axiarchs' at 10:45, and Last Fist's few losses at 11:35.

### Which units? No single one: the roster as a whole.

**Spending shares** (cross matches, share of value trained):
- **Last Fist:** Riflemen 32%, Heavies 19%, Tanks 14%, Gunships 11%, Flame Tanks 8%.
- **Bloomhost:** Skitterlings 24%, Razorwings 20%, Bulwarks 19%, Spitters 17%.
- **Axiarchs:** Shardlings **44%**, Lancers 18%, Prismwings 10%, Bastions 7%.

**Knockouts** (one Last Fist unit made untrainable, 30 paired matches against each opponent; baseline on these seeds 23–7 against Bloomhost, 22–8 against the Axiarchs):

| Unit removed | vs Bloomhost | vs Axiarchs |
|---|---|---|
| Tank | 21–9 | 21–9 |
| Heavy | 22–8 | 23–7 |
| Gunship | 23–7 | 22–8 |
| Flame Tank | 22–8 | 24–6 |

Removing any one unit costs Last Fist at most 2 wins in 30. Its edge is spread across the roster.

**Controlled duels** (equal value, 2,000 or 1,500; each faction's real spending mix as above):
- **Last Fist's mix beats both other mixes in every seed**, keeping 50–92% of its value.
  - Bloomhost's mix loses to the Axiarchs' too, which is not what matches show (49–51 in matches). The duels leave out creep, so they understate Bloomhost.
- **Single units against the opponent's real mix** (value kept by the unit's side minus the mix's, in percentage points):
  - Bloomhost: Skitterling −86, Razorwing −94, Leaper −81, Spitter −73 against Last Fist.
  - Axiarchs: Shardling −86, Wraithwing −88, Riftstalker −76 against Last Fist.
  - Last Fist's units against the Bloomhost mix: Riflemen +58, Tank −8, Heavy −3.
- **Unit against unit:**
  - The Tank beats almost every Bloomhost and Axiarch ground unit at equal value: Bulwark +83, Thornback +100, Spitter +100, Riftstalker +100, Gravemantle +89. Only the Bastion stands up to it (−17).
  - The Shardling loses to Riflemen at equal value (−64) and at equal supply (−66).
  - The Razorwing loses to Riflemen (−90) and Heavies (−92).
- **Reading:** Last Fist's ranged units fight together. Rifles and Heavies shoot down Razorwings and Wraithwings, and Tank and Flame Tank splash shreds the swarms. Its counterparts are cheaper per fight than Bloomhost's melee swarms and the Axiarchs' 2-supply Shardlings.

**Cost sensitivity:** every Bloomhost and Axiarch unit 20% cheaper (credits and energy) moved Last Fist only from 23–7 to 20–10 against Bloomhost, and from 22–8 to 19–11 against the Axiarchs. Their armies are far below the supply limit at mid-game (5–10 supply in use), so they are not money-bound. They lose their fights, and cheaper units alone don't fix that. More in the Step 2 report.

### What else helps Last Fist (paired, 40 matches each; baseline 33–7 against Bloomhost)

| Change for Last Fist | Last Fist vs Bloomhost |
|---|---|
| Salvage off (`SALVAGE.pct` 0) | 29–11 (−4): worth about 4 wins in 40 |
| Signature buildings off | 39–1 (**+6**: better without them) |
| Commander abilities off | 37–3 (**+4**: better without them) |

- **Salvage** brings 871 credits per match without the Yard and 1,857 with it: 8% and 16% of income.
  - Last Fist sides with a Yard won 85%, without one 86%.

## 2. True balance problems vs AI skill problems

### True balance problems (combat value per cost, same AI, no AI fix needed to see them)

1. **Last Fist's core roster out-trades the others per credit.**
   - The Tank (splash, 160 range) against every melee unit is the cleanest example.
   - Rifles plus Heavies out-shoot the Razorwing and Wraithwing.
2. **The Shardling is weak for its price and supply** (80 credits + 20 energy, 2 supply).
   - It is 44% of what the Axiarch AI spends.
   - It loses even to Bloomhost's mix in duels.
3. **The Razorwing and Bulwark are weak for their price** (170 + 70, and 190 + 40).
   - The Bulwark loses to the Tank at equal value and at equal supply.

### AI skill problems: logged for Phase 6 under Audit in KNOWN_ISSUES.md, not compensated with stat buffs

- **Signature buildings hurt all three AIs.** Switching them off (paired, 40 matches):
  - Last Fist +6 wins (33–7 → 39–1);
  - Bloomhost +10 (19–21 → 29–11 against the Axiarchs);
  - the Axiarchs +6 (21–19 → 27–13 against Bloomhost).
  - The AI's plan gives up a second Refinery or Reactor for one, and builds it at 0:30–1:00 (`aiPlanWith`). That is the existing AI-training item, now measured.
- **Commander abilities:** Last Fist +4 and Bloomhost +4 when switched off; the Axiarchs −4 (theirs help them).
  - **Bloomhost:**
    - Emergency Brood is cast 0.33 times a match.
    - Frenzy Bloom 2.5 times, with a logged effect of 14 per match. The effect is on speed and attack rate, so this log number is not damage. It suggests few units in the circle.
  - **Axiarchs:**
    - Mass Warp is cast 0.01 times a match.
    - Overcharge 2.2, Beam 0.9.
  - **Last Fist:** two Orbital Strikes (150 + 150 each) per match deal about 940 damage, 580 of it to buildings. Without abilities the money goes into the army, which seems to be worth more.
- **Finishing a base:** in matches still open at 19:00, the leading side often has 2,000–3,000 army value, all 3 nodes and an enemy with no army, and still doesn't end the match before the storm (table in section 4).
- **Engagement choice:**
  - Both AIs attack 13–30 times a match and trade armies.
  - Bloomhost and Axiarch melee armies chase into HQ-gun range: their own HQ gun is their best killer, while Last Fist dies to theirs when it attacks.
  - Melee chase is a unit mechanic (v2.17) and was not touched.
- **Composition:**
  - The Default AI keeps Razorwings "always in the mix" (`aiSmartScores`), 20% of Bloomhost spending, even against rifle-heavy Last Fist armies that shoot them down.
  - The Axiarch AI spends 44% on Shardlings.
- **Power field and warp:**
  - The Axiarch AI never sets a forward warp point, and Mass Warp is almost never cast.
  - Its armies fight in the open, away from the field's 25%/s shield regen. The shields only help when they fight at home, which matches their HQ-gun-heavy damage profile.
- **T3 tech order** (`AI_UPG`): the Tech Lab role's T3 comes 16th, so the AI rarely reaches the air capstones (section 5).

## 3. The Phase 2/3 buffs, quantified

| Change (paired, 40 matches, same seeds) | As is | Without it | Weapon damage per match |
|---|---|---|---|
| **Flame Tank aim (v2.36, `FLAME.aim`)**, Last Fist vs Bloomhost | 33–7 | 33–7 | Flame 709 (on) vs 228 (off): **3.1×** |
| Flame Tank aim, Last Fist vs Axiarchs | 29–11 | 30–10 | Flame 529 vs 116: **4.6×** |
| **Instant Axis beam (v2.36)**, Last Fist vs Axiarchs. Off = the HQ's normal projectile at 430/s, same damage | 29–11 | 32–8 | Axis 6,164 vs 7,191* |
| Instant Axis beam, Bloomhost vs Axiarchs | 19–21 | 22–18 | Axis 5,064 vs 5,522* |

- **Flame Tank:** the aim fix triples or quadruples what the tank actually burns. Even so it deals only about 3% of Last Fist's damage, and it changed no result outside noise (0 and −1 wins of 40). It is not a reason for Last Fist's lead.
- **Axis beam:** worth about +3 Axiarch wins of 40 in both pairings (+7.5 points). The direction is the same both times, but each difference is within noise.
  - *With the projectile the Axis deals more total damage, because those matches run longer (the Axiarchs sit at home longer), not because it shoots better.
  - The beam's real effect is the win difference, not the damage total.
- **Phase 3 mechanics** (P1–P16, S1) were not switched off as a whole: Phase 5 doesn't change them.
  - The redesigned units show up in the usage table (section 5 and the report). In the knockouts and duels none of them is the reason for the faction gap.

## 4. Why about 20% of Bloomhost and Axiarch matches don't finish in 20 minutes

With the cap at 30:00, **every match ended, and every one by 22:22**: the storm (from 20:00) and the 27:00 score limit work as designed.

| Pairing | Open at 20:00 | Then: HQ fell / storm / score | Longest |
|---|---|---|---|
| Last Fist vs Bloomhost | 5 of 40 | 4 / 1 / 0 | 21:53 |
| Last Fist vs Axiarchs | 4 of 40 | 0 / 4 / 0 | 22:02 |
| Bloomhost vs Axiarchs | 11 of 40 | 3 / 8 / 0 | 22:10 |
| Last Fist mirror | 1 of 20 | 0 / 1 / 0 | 21:50 |
| Bloomhost mirror | 3 of 20 | 1 / 0 / 2 | 21:45 |
| Axiarch mirror | 5 of 20 | 3 / 1 / 1 | 22:22 |

What the open matches look like at 19:00 (from the samples in audit/sim/out/balance-base.json, every 30 s per match):

- **About half are one-sided, with no finish:**
  - one side has 1,500–3,800 army value, 25–34 supply and all 3 nodes;
  - the other has 0–500;
  - but the leader hasn't broken the base.
  - **AI skill (finishing a base):** the HQ is invulnerable while any other building stands, and the AI's pushes stop and pull back. Phase 4 already logged this.
- **The rest are even and small:**
  - Bloomhost vs Axiarchs armies of 200–1,600 each, 5–20 supply;
  - 15–28 attacks per side, 80–370 units lost per side.
  - **Both sides attack, lose the army, rebuild.** Neither faction's units break buildings well (section 1: about 3,700–3,800 building damage per match against Last Fist's 10,800), so a won fight doesn't become a won base.
  - This is mostly AI (engagement and finishing).
  - Bloomhost and the Axiarchs have little building damage, but that is their design (Bloomhost's base-breakers are the Ruinmaw, Brood Tyrant and Worldrender; the Axiarchs' the Worldbreaker, Voidcarrier and Sovereign), and those are the units the AI rarely reaches (section 5).

No stat change is proposed for match length: the storm already ends these matches, and the cause is AI play.

## 5. T3 capstones: are they reachable?

How often each side reached each T3 path, and when (median); cross and personality matches, 144 sides per faction:

| Path T3 | Faction | Sides that reached it | Median time | Capstone unit trained by |
|---|---|---|---|---|
| Tech Lab, Air Power (Leviathan) | Last Fist | 26% | 10:00 | 12.5% of sides |
| War Factory, Siege (Titan) | Last Fist | 35% | 8:00 | 11.8% |
| War Factory, Assault (Hydra) | Last Fist | 50% | 7:30 | 29.9% |
| Bloomspire, Apex (Worldrender) | Bloomhost | **12%** | 11:30 | **3.5%** |
| Bloomspire, Swarm (Cloudwing) | Bloomhost | **3%** | 14:00 | **2.8%** |
| Evolution Chamber, Predator (Dreadthorn) | Bloomhost | 18% | 8:30 | 9.7% |
| Evolution Chamber, Siege (Ruinmaw) | Bloomhost | 27% | 8:00 | 11.8% |
| Celestial Array, Ascendant (Sovereign) | Axiarchs | **8%** | 12:30 | **0.7%** |
| Celestial Array, Swarm (Shardstorm) | Axiarchs | 17% | 13:30 | 9.7% |
| Architectum, Dominion (Eventide) | Axiarchs | 10% | 11:30 | 4.2% |
| Architectum, Rupture (Worldbreaker) | Axiarchs | 30% | 10:00 | 14.6% |

- **The air capstones (Worldrender, Astral Sovereign, Cloudwing) arrive about when the median match ends** (12–14 minutes).
- **The ground T3s** (Titan, Hydra, Ruinmaw, Worldbreaker) arrive at 7:30–10:00 and are used.
- **The gap is the AI's upgrade order, not the price.**
  - `AI_UPG` lists the Tech Lab role's T3 16th of 20, after T3 Barracks, Factory, Habitat and Refinery.
  - Last Fist reaches it at 10:00–11:30, Bloomhost and the Axiarchs at 11:30–14:00. Their factory and barracks T3s come later too (Axiarchs: Riftwalk T3 at 12:00 for 9% of sides).
  - A capstone then costs 520–600 credits plus 260–300 energy, 8–9 supply and 22–24 s.
- **Proposal: keep them late-game luxuries.**
  - They are base-breakers whose job is to end long games, and a faster, cheaper path would make them the dominant answer to the turtle stalemates in section 4. That should be the AI finishing bases, not a unit.
  - So no tech-cost change this pass.
  - The upgrade order goes to Phase 6 (AI training).
  - The S3 supply re-check is in the report: the Leviathan's, Worldrender's and Sovereign's supply was tested for whether it gates them.

## 6. Other findings

- **Rifleman rush** (tests/bots.js `rushBot` against the Default AI of each faction, 12 seeded matches each, `node audit/sim/rush.js`): **0 of 36 won on Normal and 0 of 36 on Hard.**
  - It is not dominant; against the current AI it is not viable as scripted either.
  - The Rifleman isn't changed in this pass, so the rush is unaffected by it. The rush calibration (v2.8) predates the Default AI; recalibrating the bot is a Phase 6 item.
- **One opening dominates: Last Fist's, whatever its personality** (95% in the personality sets).
  - Among Bloomhost and the Axiarchs, the Axiarch Turtle beat the Bloomhost Turtle 8–0.
  - Otherwise the personalities are near even (Aggressor 5–3 and Economist 5–3 for Bloomhost, Trickster 4–4).
- **Medicopter retreat test:** flaky about 1 run in 60 (2 of 120 seeds).
  - After a retreat the Medicopter hovers about 60 ahead of the Rifleman it follows: a steady hover, not a lag.
  - Fixed by giving that part of the test its own seeded SIM (tests/orders-weapons.test.js).
