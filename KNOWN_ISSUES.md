# Known issues

Issues found during testing that are deliberately deferred. Each lists the step that should address it.

## Signature buildings, batch 2 (v2.33)
- Bloomhost (docs/SIGNATURE_BUILDINGS.md section 3): the Brood Mound (role `sigA`) spawns Mites (`mite`, the MOUND block) and the Rootheart (`sigB`) strengthens creep (the ROOT block). The Axiarchs can't build either role until v2.34.
- Spec interpretations made in v2.33: the first clutch comes 20 s after the Mound finishes; when a clutch would pass the cap, only as many as fit hatch (none at the cap); T3 still spawns 3 Mites; Mites lost with the Mound live out their time; Mites have their own cap (Emergency Brood's TEMP.max and Cloudwing offspring don't count them, and they don't count against those); "cannot capture nodes" means they neither take nor contest a node; the acid burst does 50% of a Mite's damage (1.2) to enemy ground units within 40 and uses its own weapon table (`miteacid`: 0 to buildings and aircraft); the Rootheart's 15% slow uses the existing slow rule (the strongest slow applies, never added up), drawn as a green ring instead of the violet one; the snare's "outer strip" is the outer 16 of the creep's union (not inside any patch shrunk by 16), the units nearest the Bloomhost HQ first, and a snared unit can't leap either; the T3 pulse's first eruption is 15 s after the Rootheart reaches T3; Repair Pulse compares against the boosted creep regen, like the Medicopter.
- Saves v29: a Bloomhost side in an older save couldn't have these roles; any stray one is dropped and its pad freed.

## Signature buildings, batch 1 (v2.32)
- Shared rules (docs/SIGNATURE_BUILDINGS.md section 1) and the Last Fist pair (section 2): the Salvage Yard (role `sigA`) and the Fortification Depot (`sigB`) with node bunkers. Bloomhost (v2.33) and Axiarchs (v2.34) can't build either role yet.
- Spec interpretations made in v2.32: "economy up" for the AI is the difficulty's Refineries finished (2 on Normal and Hard, 1 on Easy), or every Refinery its plan has if that is fewer, and it holds the building while under pressure, like tech; "Salvage over the cap isn't wasted" means it starts Overdrive (no extra credits); Overdrive ends with the Yard; a bunker heal and a Medicopter heal don't add up (the faster one applies, like the other heals); a node going neutral counts as changing owner; bunkers don't keep the HQ shield up and can't be sold, upgraded or repaired (they still self-repair like any building and Repair Pulse heals them).
- `SIG.on` false switches signature buildings off for both sides (the AI never builds them); with that and `SALVAGE.pct` 0 a match still plays exactly as v2.29 (tests/determinism.test.js).

## Resolved in v2.31 (playtest bugs)

### Warped-in units ignored Hold
- **Bug:** with the army on Hold, an Axiarch unit that warped in at the warp point walked back toward its base.
- **Cause:** Hold works by giving each unit a hold spot (`holdU`, `holdV`) when the order is given (`setStance`, `giveOrder`). A unit that appears later has none, and a unit on Hold without a spot walks to the rally flag (`updateUnit`). For a trained Last Fist or Bloomhost unit that is next to its building; for a warp-in at a forward warp point it means walking back. Mass Warp kept a hold spot only for units that already had one; Emergency Brood Skitterlings and Cloudwing offspring had the same gap.
- **Fix:** `arriveOrders` gives every unit that appears away from its own building (warp-in, Mass Warp arrival, Emergency Brood, Cloudwing offspring) the army's current orders: on Hold (stance, group or type order) it holds where it arrived. Tests: `tests/orders-weapons.test.js`.
- **Bloomhost behaviour change:** brood and offspring on Hold now hold where they land instead of walking to the rally flag (and, being melee, no longer chase on Hold). The AI never sets Hold itself, but an autoplayer side (side 0 in tests) starts on the player's default Hold until its AI first changes stance (about 3 minutes in a seeded Hard match), so an autoplayer Axiarch side's early warp-ins now wait at the warp point. Seeded Hard comparisons against v2.30 (2 seeds each): Last Fist mirror, both Bloomhost-vs-Last-Fist orders, Bloomhost vs Axiarchs and Last Fist vs Axiarchs identical to the end; Axiarchs as the autoplayer side diverge from about 2:30. Last Fist is untouched (its fingerprint is unchanged).

### Gravemantles and Eventides never attacked buildings (and walked the whole lane)
- **Bug:** they walked the lane without stopping at enemy buildings, then sat at the far end of the enemy base.
- **Cause:** their weapon table (`DMG.grav`) gave buildings 0. Targeting (`acquire`) skips any target its weapon can't hurt, so a building never stopped them, and on Attack a unit with nothing to shoot walks to the lane end. They did shoot enemy units in range (low damage, so easy to miss).
- **Fix (design change, first-pass numbers):** `grav` building 0.5, so both now target ground units and buildings (G, B), keeping the slow aura and the pull pulse. docs/AXIARCHS.md section 6 and its stats table are updated.
- **Found by the all-units check:** the **Shardstorm** had the same bug (`DMG.storm` building 0). Fixed the same way: `storm` building 0.4 (A, G, B); its chain still never jumps to a building.
- **All-units check:** every unit of all three factions now has a weapon targeting can use and stops at enemy units and buildings, except the listed non-combat units (Medicopter, Recon Drone: no weapon, they stay with the army on Hold, Attack and Retreat) and the air-only Interceptor (it escorts its own aircraft or waits behind the front, never walking off alone). Tests: `tests/orders-weapons.test.js`.

## Resolved in v2.6

### Stalemates and timeouts
- The Extinction Event (from 20:00) and the 27:00 limit end every match. v2.6, 20 matches per row: zero timeouts in the AI ladder, the same-personality ladder and every bot row; the longest match was 23:12, none ran past 26:00, and the score decided 0–3 matches per row.
- This also removes the flake in `AI vs AI match on <difficulty> plays to a finish` (`tests/sim.test.js`): the match can no longer reach 30 minutes.

## Audit
Items for the strategy explorer and full balance audit. Logged only, nothing tuned. Details are in the version sections under Open.
- **AI siege push needs 2+ Artillery or Titans** (`aiUpdate`, `nSiege >= 2`), so a War Factory AI on Assault can never push. Likely cause of Siege beating Assault 83% (v2.14).
- **Leviathan almost never trained.** The AI sits near its army size limit holding 100–300 credits, so a 7-supply unit rarely fits. Supply is the problem, not only cost (v2.15). (The limit is not a fixed 34: the HQ gives 12, each Habitat 10/16/22 by tier, up to 80.)
- **Hydra under 1% of units trained** (v2.14).
- **Recon Drones lost and retrained:** 13–21% of Support units (v2.15).
- **Hard ≈ Normal on the ladder:** 19–21 over 40 at v2.15, 18–22 at main (v2.14).
- **Test bots always take path A** (Barracks, War Factory) **and Support** (Tech Lab), so bot data never covers Mass Deployment, Assault or Air Power.
- **Tech Lab AI default paths are provisional:** Economist and Trickster on Air Power, Aggressor and Turtle on Support.
- **Bot rows from v2.13–v2.14 are not comparable with later rows** (the bots never upgraded before the v2.15 fix).
- **Orbital Strike now hits aircraft (v2.16)** with the same 280/140 damage, HQ T2 unlock, cost and cooldown. Unmeasured: its effect on air armies (a Gunship has 230 HP and dies at the centre; a Leviathan has 1400).
- **Orbital Strike unlocks at HQ T2 instead of a War Factory (v2.16).** The AI's other personalities reach HQ T2 through their normal upgrade order; when, and how that changes their Strike use, is unmeasured.
- **The Aggressor against a fortified enemy (v2.16):** it now upgrades its HQ to T2 at once (for the Strike) and still builds a War Factory early (for Tanks). Without the early War Factory, defence strikes fell from 19 to 8–11 of 24 diagnostic matches (Hard Aggressor vs Hard Turtle autoplayer); with both, 17 of 24. Not tuned.
- **Tech Lab needs only a Barracks (v2.16):** in the 4-match smoke test the AI's first Tech Lab finished at 2:25–3:00. Earlier Gunships and Tech Lab paths are unmeasured.
- **Bloomhost first-pass numbers (v2.17)** are copies or ratio-matched versions of Last Fist's (table in docs/BLOOMHOST.md). Nothing measured: Skitterling melee and swarm bonus, Bulwark brace, Razorwing, the Maw's shorter range, and the AI's Bloomhost unit scores (copied from their Last Fist counterparts; personality tastes read through `AI_TWIN`).
- **Bloomhost has no mobile anti-air yet (v2.17):** Skitterling, Bulwark and Razorwing are ground-only, as the design doc describes them; only the Maw and the Hive hit aircraft. Check once the trees (v2.19, v2.21) are in.
- **Melee chase (v2.17):** melee units walk toward any enemy they can see within 150 (Razorwing 200) instead of only along their lane. Watch whether this lures swarms into Turrets or splits armies.
- **Creep numbers (v2.18)** are first guesses (table in docs/BLOOMHOST.md): radii 260 / 110 / 150, growth 6/s (×2 at nodes), recede 9/s, +20% speed, 1.5%/s regen after 5 s out of combat. The AI doesn't plan around creep yet (no AI changes this batch).
- **Bloomhost tree units (v2.19)** are first-pass numbers (table in docs/BLOOMHOST.md), with simple AI scores. Unmeasured: Leaper leap range and cooldown, corrosion levels and the 25% cap, Thornback retaliation (Last Fist has almost no melee, so it mostly matters in mirrors), the Dreadthorn burst trigger, Ruinmaw acid pools, and the AI's path translation (Specialists → Acidic, Mass Deployment → Predatory, Siege → Siege, Assault → Predator).
- **Bloomhost commander abilities (v2.20)** are first-pass numbers copied from their Last Fist counterparts (table in docs/BLOOMHOST.md). Unmeasured: Frenzy Bloom's +30% speed and +35% attack speed, Emergency Brood's 5 Skitterlings for 20 s (cap 8), Corrosive Bloom's 14 damage/s and 15% corrosion for 8 s, and the AI's timing through the Last Fist logic. In one Hard match the Bloomhost AI never cast Emergency Brood.
- **Bloomspire tree (v2.21)** is first-pass numbers (table in docs/BLOOMHOST.md). Unmeasured: the Needlewing pack bonus, Cloudwing offspring (2 every 14 s, 12 s, half damage, cap 6), the Brood Tyrant's and Worldrender's building damage, and the AI's "train each new Bloomspire unit once" rule.
- **The AI rarely reaches Bloomspire T3 (v2.21):** T3 Tech Lab/Bloomspire comes late in the shared upgrade order (`AI_UPG`). In the seed search for the AI test (Hard autoplayer Turtle vs a Bloomhost AI, 20 matches across all four personalities, then 26 more Turtle and Aggressor matches), the 4 matches that took Swarm Bloom never reached T3, so no Cloudwings were trained naturally. The Economist reached Apex T3 in 3 of 5. The Aggressor took a Bloomspire path in none of its 18 matches, the Turtle in 4 of 18.
- **AI training: the Bloomhost AI never casts Emergency Brood in normal matches (v2.22).** It picks Brood targets with the Repair Pulse's logic (damaged units or buildings), so it rarely finds a reason to cast. Neither v2.20 SIM match had a Brood cast; only the hand-picked seeded test match (seed 4, Turtle) shows one.
- **AI training: the Bloomhost AI rarely reaches production T3 (v2.22)**, so Cloudwings and other T3 units (Ravager, Bilecaster, Ruinmaw, Dreadthorn, Worldrender) are rarely trained. See the v2.21 Bloomspire T3 item. Even with a ready T3 Apex Bloomspire and 6,000 credits and energy, 3 of 40 seeded 90-second runs trained only one of the two Apex units, with Skitterlings filling the supply first (found at v2.22; the test now uses a fixed seed).
- **AI training: run an AI content coverage check** that every Bloomhost unit, ability and path is used by the AI at least once.
- **Before the App Store: run a Bloomhost performance check**, both in the early game and on a late-game save with large armies (creep, Cloudwing offspring and many units). The only measurement so far is one throttled run at v2.18.

- **Mass Deployment near the top of its win range** (58.8%, target 40–60%); **Riflemen about 37% of unit spending** (target about 35%) (v2.13).
- **Axiarch first-pass numbers (v2.25)** are ratio-matched against Last Fist (table in docs/AXIARCHS.md). Nothing has been measured: the shield values and regen rate (10%/s after 4 s), buildings at 80% HP plus 30% shields, no HP self-repair for Axiarch buildings, the Null Lance's three tiers, and the three base units' costs. The AI scores read through the Last Fist counterparts.
- **Axiarch AI and Null Lances (v2.25):** the AI builds Null Lances by the unchanged Turret rules. In the seeded 10-minute test (one match per personality) only the Turtle built one, as with Last Fist's Turrets.
- **Axiarch power field and warp-in numbers (v2.26)** are first guesses (table in docs/AXIARCHS.md): base field 230 (+40 per Spire, up to 400), node field 140, growth 7/s, recede 10/s, shield regen inside the field 25%/s, a 2 s warp channel. Unmeasured: how much the faster regen and forward warp-in at a held node are worth.
- **Axiarch tree units (v2.27)** are first-pass numbers (table in docs/AXIARCHS.md). Unmeasured: phase-step ranges and cooldowns, disrupt (30% for 2 s), the Marksman's 1.2 s charge, distortion zones sharing the acid-pool cap with Ruinmaw pools, the Gravemantle's 30% slow, and the Eventide pull (40 every 14 s). In a few seeded Hard matches the AI trained Lancers, Rift Mortars, Marksmen, Riftstalkers and Parallaxes, but no Gravemantles or Eventides even when on Dominion. v2.28: the AI now trains each path unit once (the Bloomspire rule on every Axiarch production path); with a prepared T3 Dominion Architectum it trains both. How often it reaches them in normal matches is unmeasured.
- **Axiarch commander abilities (v2.28)** are first-pass numbers (table in docs/AXIARCHS.md); costs, cooldowns and unlocks copied from Last Fist. Unmeasured: Mass Warp (8 units, 2 s channel; it rescues the most damaged first), Shield Overcharge (30%/s shield regen even under fire, 25% damage cut, 50% cap with the Bastion's brace, 7 s), the Purification Beam (240 damage along a 220 × 80 strip over 1.5 s after a 3 s warning; no aircraft).
- **AI training: the Axiarch AI rarely casts Mass Warp (v2.28).** Its rule (4 or more of its units below 40% health within the circle of one of them, at least 200 from the warp point) never came up in three seeded Hard matches (Turtle, Aggressor, Economist vs the Turtle autoplayer; 6 Overcharges and 1 Beam between them) or in the v2.28 SIM match (3 Overcharges, 2 Beams). Shields fall first and units below 40% health die quickly. The test casts it in a prepared scene.
- **Celestial Array tree (v2.29)** is first-pass numbers (table in docs/AXIARCHS.md). Unmeasured: the Prismwing shield link (half of its shield damage over up to 3 others within 110), the Shardstorm chain (3 jumps, ×0.7 each, within 90), the Voidcarrier's and Astral Sovereign's building damage (1.6× and 2.1×) and the Sovereign's 9 supply, and the AI's path mapping (Air Power → Ascendant, Support → Swarm). The AI trains all four in prepared scenes; how often it reaches the Celestial Array's T3 in normal matches is unmeasured (compare the Bloomspire T3 item).
- **Salvage (v2.30)** is first-pass numbers (the SALVAGE block, docs/LASTFIST.md): 10% of a dead unit's credit cost within 200 of any Last Fist unit or building, at most 200 credits per side per game minute. Unmeasured: what it is worth per matchup (in the v2.30 SIM match, Hard Last Fist vs Hard Bloomhost, Last Fist salvaged 571 credits over 7:32, about 6% of the 9,943 it earned from income); how often the cap binds; whether cheap Riflemen dying in their own lines pay back too much; the Last Fist mirror, where both sides salvage the same fight. The AI does not plan around it (no AI changes).
- **Seeded tests re-picked for Salvage (v2.30):** Salvage changes Last Fist play, so two hand-picked Bloomhost-vs-Last-Fist seeds no longer hit their scene. `the Bloomhost AI casts all three ...` (`tests/bh-abilities.test.js`) moved from seed 4 to 1 (10 of the first 30 seeds cast all three); `... picks a Bloomspire path ... and trains its units` (`tests/bh-spire.test.js`) from seed 3 to 23 (4 of 38 seeds trained a Worldrender, which fits the Bloomspire T3 item above).
- **Building damage for the Gravemantle, Eventide and Shardstorm (v2.31)** is first-pass: weapon tables `grav` building 0.5 and `storm` building 0.4 (they were 0, so they ignored buildings). Unmeasured.
- **Signature buildings, Last Fist (v2.32, docs/SIGNATURE_BUILDINGS.md)** are first-pass numbers from the spec, in the YARD and BUNKER blocks: Salvage Yard 20% (T1), cap ×2 plus energy worth half the credits (T2), Overdrive +25% production for 20 s on overflow (T3); node bunkers at half a T1 Turret (450 HP, 6 damage every 0.45 s, 250 range, ground only), ×2 damage and anti-air at Depot T3, a 2%/s heal on Barracks units from T2, a 45 s rebuild. Cost, build time, HP and upgrade costs copy the Barracks. Unmeasured: all of it. In the v2.32 SIM match (Hard Turtle Last Fist vs Hard Aggressor Bloomhost, Last Fist won at 13:33) the Depot went up at 0:29 and reached T3; 5 bunkers were placed (at most 3 at once) and healed 518 HP; Salvage brought 1,195 credits without a Yard. An earlier development run (Trickster, Yard to T2) salvaged 993 credits and 299 energy by 8:25. No Overdrive has happened in a match yet.
- **The signature building in the AI's build plan (v2.32):** it replaces the plan's last duplicate (a second Refinery, Reactor, Barracks or Turret; `aiPlanWith`), so every plan keeps every building type it had, the Tech Lab included. One unseeded 12-minute Hard Last Fist mirror per personality: a Tech Lab by 12:00 for 3 of 4 personalities, the same as with signature buildings off (the Aggressor builds none in 12 minutes either way). Where the plan gave up its second Refinery (Aggressor, Turtle) the trigger is its one planned Refinery, so they build it at about 0:30, the others at about 0:47. Unmeasured: what the lost duplicate costs each personality.
- **Seeded test re-picked for the signature buildings (v2.32):** the Last Fist autoplayer now builds its signature building, so `... picks a Bloomspire path ... and trains its units` (`tests/bh-spire.test.js`) moved from seed 23 to 42: seed 23's match now ends at 9:15 (a Bloomhost win) before any Worldrender; only seed 42 of 1-42 trains one (the Bloomspire T3 item above).
- **AI training: the Last Fist Turtle builds its Fortification Depot at about 0:29** because its plan gave up its second Refinery for it (`aiPlanWith` replaces the last duplicate; the trigger then needs only the one Refinery left). The design intent is that the Depot replaces Turrets, not economy. Review at AI training.
- **AI training: the Last Fist Aggressor builds no Tech Lab in 12 minutes**, with or without signature buildings (v2.32 check, one Hard mirror each way), leaving it without air or anti-air support. Review at AI training.
- **Salvage Yard strength (v2.32):** in a v2.32 development SIM match, Last Fist (Trickster) built the Yard at 1:08, salvaged 993 credits and 299 energy, and won at 8:25. Check the Yard plus early aggression for a dominant strategy.
- **Bloomhost signature buildings (v2.33)** are first-pass numbers from the spec, in the MOUND and ROOT blocks: Mites (24 HP, 2.4 damage every 0.5 s, speed 62, 30 s life, 2 per 20 s at T1, 3 at T2, at most 10), the T3 acid burst (1.2 damage within 40, ground units only), Rootheart creep ×1.5 growth and reach, a 15% slow on enemy ground units on creep, T2 regen ×1.5 (2.25%/s), the T3 snare (every 15 s, 1 s, at most 5, 10 s immunity, outer 16). Unmeasured: all of it. The acid burst is tiny by the spec (1.2 damage). In the v2.33 SIM matches: Bloomhost (Turtle) built the Rootheart at 0:28, reached T2, and lost to Last Fist at 16:03; Bloomhost (Aggressor) built the Brood Mound at 1:17 (T1), hatched 32 Mites (27 killed, 5 expired), and lost at 8:03; neither reached T3, so no burst or snare happened in a match.
- **Seeded tests re-picked for the Bloomhost signature buildings (v2.33):** the Bloomhost AI now builds its own, so three seeded Bloomhost matches no longer hit their scene (each still ends normally, with no error): `the Bloomhost AI casts all three ...` (`tests/bh-abilities.test.js`) seed 1 → 7 (no Corrosive Bloom with seed 1); `... picks a Bloomspire path ... and trains its units` (`tests/bh-spire.test.js`) seed 42 → 17 (no Worldrender with seed 42); `one Hard match, Bloomhost (Turtle) against Last Fist ...` (`tests/bloomhost.test.js`) seed 77 → 6 (with seed 77 it took Swarm Bloom and trained no Razorwing).
- **Mites in the match log (v2.33):** killed Mites count as units lost (and kills for the enemy) and appear in the timeline like Emergency Brood's Skitterlings; a Mound's steady clutches can lengthen the log. Expired ones are not counted.
- **Node bunkers in the score and the log (v2.32):** bunkers are buildings, so their HP counts in the tie-break score (`sideScore`) and a lost bunker gives a "Node Bunker destroyed" toast and a match-log line, including when a node changes hands.

### Axiarchs summary (v2.29)
Every Axiarch item for the audit and AI training, in one place (details in the Audit entries above and docs/AXIARCHS.md):
- **Numbers to audit (all first-pass, untuned):** buildings at 80% HP plus 30% shields, unit shields and their regen, the Null Lance's three tiers and the three base units (v2.25); the power field and warp-in (v2.26); the Genesis Gate and Architectum tree units with disrupt, slow, the Marksman's charge, distortion zones and the Eventide pull (v2.27); commander abilities (v2.28); the Celestial Array tree with the shield link and chain beam (v2.29).
- **Matchups to measure:** elite expensive units against Last Fist's combined arms and Bloomhost's swarms; whether shields plus field regen outweigh attrition; forward warp-in at held nodes; the Shardstorm and Lancer as the main mobile anti-air beside the Wraithwing.
- **AI:** the minimal AI only. Path mapping from Last Fist tastes (v2.27, v2.29); the "train each path unit once" rule (v2.28); Null Lances only by the Turret rules (only the Turtle builds them); Mass Warp almost never cast in normal matches (v2.28); production T3 rarely reached; the AI never sets a warp point; run an AI content coverage check that every Axiarch unit, ability and path is used at least once. The Axiarch AI quality pass is part of AI training.
- **Performance:** no measurement yet. Check the early game and a late-game save with large armies (field, shields, warps, chain beams) before the App Store.
- **Interface notes:** Axiarch weapons have no sounds of their own yet: most are silent, and the Bastion's shot (weapon `pulse`) borrows the Repair Pulse sound by name. The warp shimmer and the ability sounds play.

### Bloomhost summary (v2.22)
Every Bloomhost item for the audit and AI training, in one place (details in the Audit entries above, the Open sections below and docs/BLOOMHOST.md):
- **Numbers to audit (all first-pass, untuned):** base units and the Maw (v2.17), creep (v2.18), the Larva Pit and Evolution Chamber tree units with corrosion and acid pools (v2.19), commander abilities (v2.20), the Bloomspire tree with Cloudwing offspring (v2.21).
- **Matchups to measure (amendment C, section 8G):** whether melee units reach ranged targets, the swarm bonuses, splash against swarms, and creep's value.
- **Anti-air:** Spitters and Razorwings (amendment F, v2.19). Check this once the matchup tests are run.
- **Melee chase (v2.17):** check whether it lures swarms into Turrets or splits armies.
- **AI:** the path mapping from Last Fist tastes (v2.19, v2.21); the "train each new Bloomspire unit once" rule (v2.21); Emergency Brood unused; production T3 rarely reached; the content coverage check. The Bloomhost AI pass (amendment D batch 6) moved to the AI training phase.
- **Performance:** the early-game and late-game check before the App Store.
- **Interface notes:** Bloomhost attacks are silent (v2.17); remembered enemy creep has a hard edge (v2.18).

## Open

### Flame Tank: off-centre targets are never hit (found in v2.31, not fixed)
- **Bug:** a Flame Tank picks targets by lane distance (`acquire`, sideways distance ×0.4), but its burst only hits within its 24-wide strip (`flameBurst`: sideways up to `strip`, plus half a building's width). A target it picks that sits further to the side takes nothing, and the Flame Tank stands still firing at it forever.
- **Measured (scene tests, v2.31):** against a Tank 30, 50 or 70 to the side it dealt 0 in 20 s (186 at 0); against a Refinery on a pad 70 off the lane line it dealt 0 and never moved on.
- **Not fixed in v2.31:** the fix changes Last Fist play (the batch requires Last Fist to play exactly as v2.30). Proposed fix: aim the burst's strip at the chosen target's sideways position, or always include the chosen target. Needs approval.

### Flaky test: the Aggressor's defence strike (seen at v2.29)
- `the AI uses abilities under the same rules ... each personality in its own way` (`tests/abilities.test.js`) is unseeded: it plays 3 random Last Fist matches per personality and needs at least one Aggressor Orbital Strike on defences. It failed once in a v2.29 `npm test` run, then passed 3 of 3 on v2.29 and 3 of 3 on v2.28. Last Fist play is identical between the two versions, so the change didn't cause it. Fix: seed it, or count over more matches.

### Creep: interface notes (v2.18)
- **Frame time with creep (one run each, 4× CPU throttle, Bloomhost vs Last Fist, both Hard AI):** first 2 game minutes 5.87 ms mean script time per frame, p95 11.2 (v2.17: 5.5, p95 9.5); minute 3 8.2 ms mean, p95 23.1 (no v2.17 figure for minute 3). A first v2.18 build that repainted the creep layer up to twice a second measured 6.8 ms mean and p95 19.7 over 3 minutes; it now repaints at most once a second. Single runs: not separated from noise.
- **Remembered enemy creep ends in a hard vertical edge** where the player's seen ground ends (it is clipped to seen fog cells, like the pad rule).
- **Fixed in v2.18:** Skitterlings, Bulwarks and Razorwings were missing from the Army tab's Infantry, Armor and Air groups and type names (v2.17), so group orders skipped them.

### Bloomhost framework: interface notes (v2.17)
- **The how-to text on the start screen is hidden on screens 440 points tall or less** (most phones in landscape), so Difficulty, You, Opponent and Start fit without scrolling. The same tips remain in the long-press card info.
- **The enemy HQ starts as a neutral "?" marker in every match** (Last Fist too) until it is first seen; before v2.17 its art showed from the start. Needed so the enemy's faction can't be read off its HQ.
- **Enemy pads are hidden until their ground has been in view**, for the same reason.
- **Bloomhost attacks are silent for now:** melee hits and the Maw's spines have no sound yet (only their flashes).

### Tech Lab tree: numbers for the later balance and AI audit (v2.15)
v2.15 was implementation only: no tuning, minimal AI. Measured, not tuned:
- **Forced-path matrix** (Hard, each personality against itself, one side on Air Power, the other on Support, 40 matches each, zero timeouts, longest 23:01). Air Power beat Support 96–64 overall (60%). Per personality, Air Power–Support: Aggressor 18–22, Economist 33–7, Trickster 22–18, Turtle 23–17.
  - The matrix ran on a build where the Leviathan and Recon Drone flew higher (z 118–130 and 130–145). Only their look changed before the push (z 88–98 and 104–114, so they stay below the top bar), plus shot travel time to them.
- **Leviathans are almost never trained** (0% of units everywhere). The AI keeps about 100–300 credits and an army near its limit, so a 480/240, 7-pop unit seldom fits; cheaper units win the scoring every time.
- **Recon Drones are lost and replaced often:** 13–21% of Support units by count (Economist 21%), 11–19% by value. That's despite the cap of 3 and waiting just behind the front, so the AI retrains them as they fall.
- **Medicopters:** 1–7% by value on Support. The AI trains one per 8 infantry, once it has 6.
- **Units trained, share by value** (per personality: Aggressor, Economist, Trickster, Turtle):
  - On Air Power: Interceptors 0%, 12%, 10%, 6%; Leviathans 0%.
  - On Support: Medicopters 0%, 1%, 7%, 2%; Recon Drones 0%, 19%, 11%, 12%.
  - The Aggressor never reached its Tech Lab upgrade before its matches ended.
- **The AI's Tech Lab defaults were chosen in v2.15 (not decided by design):**
  - Economist and Trickster on Air Power (both favour aircraft);
  - Aggressor on Support (Medicopters for its infantry);
  - Turtle on Support (keeps Nanoweave, which it had before trees).
- **Ladder sanity check:**
  - Easy lost 0–20 to Normal and 0–20 to Hard.
  - Normal vs Hard was 7–13 over 20 matches and 19–21 over 40 (main v2.14: 18–22 over 40).
  - Bot rows, v2.15 against main, both with the fixed bots: calibrated:normal 7–13 vs 8–12, calibrated:hard 2–18 vs 2–18, turtle:normal 1–19 vs 0–20, eco:normal 7–13 vs 9–11, eco:hard 9–11 vs 5–15.
  - Zero timeouts throughout.
- **Test bots fixed in v2.15:** `tests/bots.js` called `tryUpgrade` without a path. Since v2.13 its bots never upgraded a Barracks or War Factory, and they held money for the failed upgrade. They now take path A, and Support for the Tech Lab (what they had before trees). Bot rows from v2.13–v2.14 are therefore not comparable with later ones.
- **For the audit:**
  - the AI's economy and army limit against expensive units (Leviathan, Hydra);
  - Recon Drone losses;
  - Air Power at 60%;
  - the default paths;
  - Nanoweave on Support (watch whether a second Tech Lab becomes mandatory).

### War Factory tree: numbers for the later balance and AI audit (v2.14)
v2.14 was implementation only: no tuning, and the AI got minimal path support. Measured, not tuned:
- **Forced-path matrix** (Hard, each personality against itself, one side forced onto Siege and the other onto Assault, 40 matches each, zero timeouts, longest 23:09). Siege beat Assault 133–27 overall (83%). Per personality, Siege–Assault: Aggressor 23–17, Economist 38–2, Trickster 35–5, Turtle 37–3.
- **Likely main cause: the AI's base-attack logic.** The AI only launches a siege push with at least 2 Artillery or Titans (`aiUpdate`, strategy section: `nSiege >= 2`), so an Assault AI never sieges. It has to win field fights or wait for the late all-in.
- **Units trained, share by value** (per personality: Aggressor, Economist, Trickster, Turtle):
  - On Assault: Flame Tanks 6%, 6%, 16%, 6%; Hydras 0–1%. Hydras are rare at T3 (360/140).
  - On Siege: Artillery 2%, 9%, 11%, 10%; Titans 0%, 5%, 1%, 9%.
  - Riflemen: 47–48% for the Aggressor (both paths), 9–27% for the others.
- **Ladder sanity check:**
  - Easy lost 0–20 to Normal and 0–20 to Hard.
  - Normal vs Hard was 13–27 over 40 matches (main v2.13: 15–25).
  - The calibrated Rifleman rush won 9 of 20 on Normal (main: 16 of 40) and 1 of 20 on Hard.
  - Turtle and Eco bots lost 0–20.
  - Zero timeouts throughout.
- **For the audit:**
  - let an Assault AI siege with Flame Tanks and Hydras (or count Tanks), or add path-aware attack rules;
  - Hydra cost and T3 timing;
  - the default paths (Aggressor and Trickster on Assault);
  - re-check the Barracks matrix (Mass vs Specialists) now that Flame Tanks exist.

### Upgrade trees: re-check after the War Factory and Tech Lab trees (v2.13)
- **Mass Deployment sits near the top of the range.** In the forced-path matrix (Hard, each personality against itself, 40 matches each, 160 in total), Mass Deployment beat Specialists 94–66: a 58.8% win rate, inside the 40–60% target. Per personality (information only): Aggressor 24–16, Economist 17–23, Trickster 27–13, Turtle 26–14 for Mass.
- **Riflemen are about 37% of credits spent on units,** pooled over both paths, against a target of about 35%. That's about 50% on the Mass path alone, and 26% on main before trees. The figure is an estimate converted from value shares, weighting personalities equally.
- Accepted for v2.13. Re-check both numbers once Flame Tanks (a hard counter to massed infantry) and the Tech Lab tree land.

### Long matches run past 80 timeline lines per side (v2.10)
- Since v2.10 a build or upgrade and its finish share one line, which brought typical matches to 63–76 lines per side (median 72 over 8 AI matches). Long matches (14–22 minutes) still reach 85–156 lines, because key events are never merged or cut.

### Normal holds the calibrated Rifleman rush a little less often (v2.8)
- With one shared ability cooldown, AI Normal beats the calibrated rush in 61 of 100 matches (ladder 60 plus the per-personality rows 40), against 68 of 100 in v2.7. The gap is within about two standard deviations, so it may be noise; Easy, Normal and Hard keep their order (Normal vs Hard: 24–36 over 60, v2.7 20–40).

### The Aggressor still loses to the eco bot
- Step 6 gave it an ability-based answer (it strikes Turrets and defenders dug in under the enemy HQ before pushing), and it beats the turtle bot 10–0 on Normal and Hard and the calibrated rush 16–4 on Hard.
- Against the eco bot (Refinery-heavy, no Turrets) it still loses: v2.6, 10 matches each, 4–6 on Normal and 0–10 on Hard (v2.5: 1–9 and 0–7; v2.1: 0–9 and 0–8).

### Narrow Normal-vs-Hard margins in two mirrors
- With both sides the same personality, Normal beats Hard about 4 times in 10 for the Economist and the Trickster: v2.6, 60 matches each, 25–35 for both (v2.4 Economist: 31–42 over 80). Hard still wins the majority, but a single 20-match row can come out even.
