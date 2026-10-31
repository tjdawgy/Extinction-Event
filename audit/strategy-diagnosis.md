# Phase 7b, step 1: strategy diagnosis (v2.41)

Every number here comes from the harness playing the real SIM (index.html v2.41), from controlled duels, or from the code (cited by name). Raw logs: `audit/logs7b/`.

Tools added for this step:
- `audit/sim/diag7b.js`: Greedy (greedy.js, the phase 7a bot) against itself, cross-faction, with the damage counters on.
- `audit/sim/an7b.js`: economy and army curves, value killed per weapon against value lost per unit type.
- `audit/sim/trace7b.js`: one bot match traced every 15 s (army value and mean position, every death with its place, nodes, bank).
- `audit/sim/duelx.js`: duel.js with an experiment's changes.
- `audit/sim/strat.js`, `stratrun.js`: the step 2 bots and their matrices (the baseline triangle below uses them).

## Baseline numbers

**Greedy vs Greedy** (identical scripted play, 10 seeds × both sides per pairing, `logs7b/diag-base.txt`):

| Pairing | Result |
|---|---|
| Last Fist vs Bloomhost | 20–0 |
| Last Fist vs Axiarchs | 19–1 |
| Bloomhost vs Axiarchs | 13–7 |

Cross-faction shares: Last Fist 97.5%, Bloomhost 32.5%, Axiarchs 20%.

**Strategy triangle with the new bots** (same faction on both sides, 6 seeds × both sides, `logs7b/tri-base.txt`):

| Faction | Rush vs Greedy | Greedy vs Turtle | Turtle vs Rush | Contain vs Greedy | Contain vs Turtle | Contain vs Rush |
|---|---|---|---|---|---|---|
| Last Fist | 0–12 | 12–0 | 12–0 | 0–12 | 12–0 | 12–0 |
| Bloomhost | 0–12 | 12–0 | 11–1 | 0–12 | 12–0 | 12–0 |
| Axiarchs | 4–8 | 9–3 | 10–2 | 0–12 | 0–12 | 2–10 |

Greedy is never punished: an early attack on it wins 4 of 36.

## 1. Why Last Fist wins identical play

**Unit duels** (two equal-value armies meeting in the open, no buildings, `logs7b/duels-base.txt`, `duels-loo.txt`):

| Duel (value) | Result | Value kept |
|---|---|---|
| Rifle vs Skitterling (2,000) | 0–8 | 0% vs 41% |
| Rifle vs Shardling (2,000) | 0–8 | 0% vs 44% |
| Heavy vs Bulwark (2,000) | 0–8 | 0% vs 65% |
| Heavy vs Spitter (2,000) | 0–8 | 0% vs 63% |
| **Tank** vs Skitterling / Shardling / Bulwark (2,000) | 6–0 / 6–0 / 8–0 | 97% / 83% / 60% kept |
| **Flame Tank** vs Skitterling / Shardling / Spitter / Bulwark (2,000) | all 6–0 | 100% / 100% / 88% / 65% kept |
| Tank vs Bastion (2,000) | 0–8 | 0% vs 85% |
| Greedy mixes, Last Fist vs Bloomhost (2,000) | 8–0 | 50% vs 0% |
| Greedy mixes, Last Fist vs Axiarchs (2,000) | 8–0 | 50% vs 0% |
| The same at 600 vs Axiarchs | 0–8 | |

- Last Fist's infantry **loses** every duel at equal value. Its War Factory carries it: the Tank and the Flame Tank win against everything Bloomhost fields, and against all Axiarch ground units except the Bastion.
- Leave-one-out: the Last Fist mix without Tanks loses to both factions; without Riflemen it wins harder (78% and 64% kept). Splash (Tank 26, the Flame Tank's strip) grows with army size, which is why the mix loses at 600 and wins at 2,000.

**But the duels don't decide the bot games.** Making Tanks costlier and Flame Tanks weak against vehicles (three variants up to Tank 280/70, cannon ×0.6 against light, splash 20, flame ×0.15 against vehicles) left Greedy vs Greedy at **39–1 exactly** (`logs7b/gvg-lf-variants.txt`; even with Tanks priced out of reach, Last Fist wins with Riflemen, Heavies and Flame Tanks).

**What decides them** (trace of Last Fist vs Bloomhost, seed 95000, `trace7b.js`):

| Time | What happens |
|---|---|
| 1:15–1:45 | Bloomhost's node runner (the faster Skitterling) reaches Last Fist's node first. It is inside Last Fist's threat radius, so Last Fist's greed ends 50 s early and it starts its army. |
| 2:00–3:15 | Last Fist 460 → 1,450 army value; Bloomhost sits at 80 with 500–780 banked. Last Fist takes all three nodes. |
| 3:30–8:00 | Last Fist parks at Bloomhost's HQ-gun edge (its dead are at u 1,093–1,140; the HQ at 1,480 reaches 1,090). Bloomhost's dead are at 1,170–1,270: **inside its own base**, between its rally flag and the Last Fist line. Last Fist's bank climbs from 500 to 2,700 (all three nodes, plus Salvage, 727 a match against Bloomhost); Bloomhost's never passes 100. |

So the matches are **containments**, and Last Fist is the faction built to contain:
- Every Last Fist unit is ranged (Rifle 120, Heavy 130, Tank 160). Bloomhost's and the Axiarchs' basic units are melee (Skitterling, Shardling, Bulwark).
- A defender on Retreat or Hold waits at its rally flag, 200–300 out from its HQ. Melee units there chase anything within 150, out of the HQ gun's cover, into the ranged line; they die one by one.
- Over the whole cross-faction set, the Bloomhost HQ gun killed 3,835 of Last Fist's value per match, and Bloomhost's own Skitterlings and Bulwarks killed almost nothing (they died before contact).
- The enemy's own node (centre 380 from its HQ, zone 310–450) is half outside the T1 HQ gun (390). The container holds it, so the defender loses income while the container gains it.

**Match phase:** decided between 2:00 and 4:00 (first army out, middle node, the first containment), then a slow siege to 6–9 minutes.

**Units:** Rifleman and Heavy (ranged, cheap, contain the melee factions), Tank and Flame Tank (they win the open fights), Salvage (pays for the siege).

## 2. Why greed carries no risk

**Economy payback** (BDEF in index.html):
- A Refinery costs 150 and builds in 10 s for +4 credits/s: paid back **37.5 s after it finishes**. The Greedy opening's three Refineries pay for themselves by 1:00.
- At 2:00 the Greedy opening has earned 2,000–2,100 credits; the Rush opening 930 (2.2×, `tri-base` samples).

**What an early attack meets** (Rush bot, 8 Riflemen ≈ 400, leaving at about 1:30):
- The HQ gun (T1): 32 damage every 1.1 s, ×0.9 against light armor = **26 damage/s**, range 390, which covers all eight pads.
  - It kills a Rifleman (70 HP) every 2.7 s, a Skitterling every 2.3 s: about **19 credits/s of Riflemen**.
  - Two Barracks train 25 credits/s of Riflemen, so the HQ gun alone cancels three quarters of a two-Barracks rush.
- Eight Riflemen deal 36 damage/s to buildings (×0.45). A Refinery (520 HP) takes 14 s; the HQ kills all eight in about 22 s.
- **Bank to army:** the greedy player has banked 500–800 by 2:00 and turns it into units at once (one Barracks: a Rifleman every 4 s, plus every other producer it has). The rush has nothing banked.
- The Turret (200 credits + 50 energy, 12 s, 27 damage/s) is the only other defense; the AI builds one only when it spots an infantry rush (`spotsRush`, `infantryRush`).

**Result:** Rush vs Greedy 4–32 over the three mirrors. A timed punish attack (phase 7a's `punish`) lost wins for the same reason.

## 3. Why containment is so strong

- **The defender's home advantage stops short of its own rally flag.**
  - The rally flag (`rallyU`) is 300 out from the HQ; units on Retreat or Hold stand 200–300 out.
  - The T1 HQ gun reaches 390. A container standing 400–450 out is outside it, yet a Tank (160), Lancer (170) or Spitter (150) there reaches the rally flag.
- **New units gather one at a time.** Each trained unit walks from its building to the rally flag (or, on Attack, straight out to the enemy line). Melee units chase whatever is within 150. Nothing holds them until a group has formed.
- **The AI on Attack sends every new unit alone** into the container; on Retreat its melee units still chase out of the gun's cover.
- **Turret timing:** the AI's only early Turret rule fires on a light-infantry rush of 400+ value near its base, and only if it "spots" the rush (`spotsRush`, a per-match roll; Hard 100%). A container of Tanks or mixed units never triggers it, and the Turret plans of the Turtle personality come at their fixed place in the build list.
- **The container is paid:** it sits on the defender's node (half outside the gun), so the income swings both ways, and Last Fist's Salvage refunds part of every fight.

## 4. Why nodes and signature buildings don't pay off

**Nodes** (`NODE_INC = { c: 3, e: 1 }`):
- A node is worth 0.75 of a T1 Refinery and a third of a T3 one. Late in a match an economy of HQ + three T3 Refineries makes 30 credits/s; the third node adds 10%.
- The far node is half under the enemy's T1 gun, so holding it is safe only against a contained enemy, and then the match is already decided.
- So nodes follow the winner instead of making one: in the traces the side that wins the first fight takes all three.

**Signature buildings:**
- Each costs a Barracks (150) plus upgrades and, above all, **a pad**. Eight pads; a pad with a T3 Refinery makes +9 credits/s (540 a minute).
- The Salvage Yard doubles Salvage (7% → 14%): Last Fist's Salvage totals 300–730 a match at 7%, so the Yard adds about 50–100 credits a minute, a fifth of the Refinery it displaces.
- Phase 6a measured the same for the AI: the Economist won 14–2 and 15–1 of 16 without its signature building against 11–13 with it.

## What this points at for step 3

1. **The HQ gun's reach versus its damage.** Today it is strong where it doesn't matter (inside the base, against a rush) and short where it does (the defender's own node, the rally flag). Less damage at T1 (rushes can hurt a greedy base), more reach (the defender's node and rally under cover), and stronger upper tiers (a paid defensive investment).
2. **Economy payback.** Refineries that pay back in 37 s make greed free. Slower payback (cost, build time) gives an attack a window.
3. **Cheaper, faster Turrets**, so a defender can answer pressure in time.
4. **Node income** worth fighting for, with the third node under the enemy gun.
5. **Last Fist:** its edge is the ranged contain plus its vehicles; numbers on the Rifleman, Tank and Flame Tank, and help for the melee factions' defenders.
6. **AI:** hold new units under the HQ gun while camped on, break out together, Turrets as soon as the pressure starts.
7. **Signature buildings:** cheaper and stronger numbers, so the pad pays in some strategies.
