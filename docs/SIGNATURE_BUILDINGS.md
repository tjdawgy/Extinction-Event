# Signature buildings spec

**Status: complete (v2.32–v2.34).** Built per section 7: v2.32 shared rules and Last Fist, v2.33 Bloomhost, v2.34 the Axiarchs
and this close-out. The spec below is kept as given; the stats table, the interpretations made while building it and the
Definition of Done check follow it. All numbers are first-pass and untuned (KNOWN_ISSUES.md, Audit).

Combined from parts 1 and 2 as given. The only change: section 7's build order is renumbered to v2.32–v2.34.

=== SIGNATURE BUILDINGS SPEC — PART 1 OF 2 ===

0. PURPOSE
Each faction gets two signature buildings. Each one does a job nothing else in its faction does and lets the player skip part of a pad they'd otherwise need. They must create new ways to play, not just make existing strategies stronger. This is new content, not a rebalance. No balance tuning; log balance observations under the Audit heading in KNOWN_ISSUES.md.

1. SHARED RULES (all six buildings)
- They use normal building pads. Each player keeps exactly 8 pads.
- A player may own both of their faction's signature buildings, but at most one of each at a time. A destroyed or sold signature building can be rebuilt (it starts again at T1). The build menu shows "Already built" when one exists.
- T1–T3 using the existing upgrade system. Upgrades apply instantly to everything the building controls.
- No army supply used. No new resources.
- Default cost, build time and health: same as that faction's light production building (Barracks / Larva Pit / Genesis Gate). Upgrade costs: same as that building's upgrades.
- Not mutually exclusive.
- Distinct T1–T3 art in the faction's style (section 6 of part 2). Must not hide units, health bars or UI. Hidden by fog like other buildings.
- Do not change existing unit or building costs, stats or production times. Do not remove existing features. Preserve commander abilities.
- Salvage rule (applies everywhere): Salvage is based on the cost actually paid for a unit. Units that cost nothing (temporary units from abilities, Mites, node bunkers) give no Salvage.

2. LAST FIST — "Humanity refuses to die"

2A. SALVAGE YARD — economy that grows with the fighting
This UPGRADES the existing Last Fist Salvage mechanic. It is not a second salvage system. Salvage collection stays automatic.
- T1: Salvage rate rises from 10% to 20%.
- T2: the per-minute Salvage cap doubles. Salvage also returns energy equal to half the credits recovered.
- T3 "Overdrive": Salvage over the cap isn't wasted. Whenever overflow happens, all Last Fist production buildings get +25% production speed for 20 s. It refreshes on new overflow and never stacks above +25%. Show an Overdrive icon with a timer.
- If the Yard is destroyed or sold, Salvage returns to the base rate and cap.

2B. FORTIFICATION DEPOT — hold the ground you take
- T1: every field node the Last Fist holds gets a bunker. Reuse the Turret code at half a T1 Turret's health and damage. Bunkers hit ground units only. Nodes already held when the Depot finishes get bunkers immediately.
- Bunkers never block or slow node capture. When a node changes owner, its bunker is destroyed. If a bunker is destroyed while the node is still held, it rebuilds after 45 s.
- If the Depot is destroyed or sold, all its bunkers are destroyed.
- T2: bunkers heal friendly Barracks-produced units within their attack range for 2% of max health per second. Show a faint heal ring.
- T3: bunker damage doubles and bunkers can hit aircraft as well as ground units.
- Bunkers use no pads and no supply. They're free, so they give no Salvage.

=== END OF PART 1 ===

=== SIGNATURE BUILDINGS SPEC — PART 2 OF 2 ===

3. BLOOMHOST — "The swarm never stops"

3A. BROOD MOUND — endless disposable pressure
- Every 20 s it spawns Mites at the Mound using the existing temporary-unit system: T1 2 Mites, T2 3 Mites.
- Mite: fast melee unit. Health and damage at 40% of the Bloomhost base light unit's, speed at 120%. Targets G and B. Lifespan 30 s. No supply, no cost. Cannot capture nodes. Follows the current army stance and orders like other units.
- Safety cap: at most 10 living Mites per player. Spawning skips while at the cap.
- T3: a Mite that is killed (not one that expires) bursts into acid. Small radius, 50% of a Mite's attack damage to enemy ground units, no damage to buildings. Distinct green burst visual.
- Mites must appear in the Army tab groups, names, sprites and info cards like every other unit.
- Mites give no Salvage.

3B. ROOTHEART — the land is the weapon
This strengthens existing creep; it does not replace any creep rule.
- T1: creep spreads 1.5x faster and reaches 1.5x farther. Enemy ground units standing on Bloomhost creep move 15% slower. Aircraft are unaffected.
- T2: Bloomhost units' regeneration on creep is +50% over the existing rate.
- T3: every 15 s, roots erupt along the outer edge of the creep (the outermost strip, about one unit-width deep). Enemy ground units there are snared for 1 s: they can't move but can still attack. At most 5 units per pulse. A snared unit can't be snared again for 10 s. Clear root-eruption visual.
- If the Rootheart is destroyed or sold, creep returns to normal reach and recedes using the existing rules.

4. AXIARCHS — "Elite, and they never retreat"

4A. PHASE BEACON — bring the field to the fight
- It projects a power-field bubble that follows the anchor: the frontmost friendly Axiarch ground unit (closest to the enemy HQ). If there are no ground units, use the frontmost unit of any kind. Re-pick the anchor once per second; the bubble moves smoothly to it.
- The bubble is a power-field zone using the existing field code. Everything that works inside the field works here: warp-in, faster shield regen. It does not stack with other field zones.
- T1 radius: the same as a captured node's field. T2: 1.5x that.
- Collapse: if friendly units inside the bubble lose 35% of their combined shields plus health within 5 s, the bubble collapses for 15 s, then re-forms on the current anchor. Clear shatter visual and sound.
- T3: units warping into the Beacon bubble arrive with full shields and +20% damage for 8 s.
- The bubble follows the existing fog rules for fields.

4B. ECHO RELIQUARY — nothing elite is ever truly lost
- When an Axiarch T2 or T3 unit dies, its echo is stored. Storage: T1 3, T2 5. When full, a new echo replaces the oldest.
- Units recovered from an echo never create echoes. Temporary units never create echoes.
- The Train tab shows an Echoes section. Tapping an echo warps that unit in for 50% of its normal cost, using normal warp-in time, supply limits and placement rules. It does not need its production building or doctrine path. The echo is consumed when the warp-in starts.
- T3: recovered units arrive with an overshield equal to 30% of their max shields. It lasts 20 s and does not regenerate.
- If the Reliquary is destroyed or sold, all stored echoes are lost.
- Stored echoes are saved and loaded with the match.

5. MINIMAL AI (all three factions)
- Aggressor and Trickster build building A (Salvage Yard / Brood Mound / Phase Beacon). Turtle and Economist build building B (Fortification Depot / Rootheart / Echo Reliquary). Each builds it once its economy and first production building are up, and upgrades it like other buildings.
- The Axiarch AI spends an echo whenever it can afford one and has supply room.
- Everything else these buildings do is automatic. No other AI changes; smarter use waits for AI training.

6. ART
- Last Fist: industrial steel, rivets, exposed machinery, orange/amber lights, welded additions; more armored and weaponized T1 to T3.
- Bloomhost: organic growth, roots, sacs, eggs, membranes, bioluminescence; larger and more developed T1 to T3.
- Axiarchs: obsidian and crystal, floating parts, cyan/pale blue energy, spatial distortion; more complex T1 to T3.

7. BUILD ORDER
1. v2.32 Shared rules + Last Fist (Salvage Yard, Fortification Depot).
2. v2.33 Bloomhost (Brood Mound, Rootheart).
3. v2.34 Axiarchs (Phase Beacon, Echo Reliquary) + close-out docs.
Each batch: npm test, unchanged behavior for factions not touched, one SIM match, a browser check of new UI, screenshots of new visuals. No performance runs, matrices or per-personality runs.

8. DEFINITION OF DONE
- All six buildings work at T1–T3 as written.
- One-of-each limit works, and rebuilding after a loss works.
- 8 pads per player, unchanged.
- No free unit gives Salvage. Echoes can't loop.
- Bunkers never outlive their node. Mites never exceed the cap.
- The minimal AI builds and uses them without cheating.
- Saves load correctly, old saves included.
- Usable at 667x375.

=== END OF PART 2 ===

---

## Stats (v2.34, first-pass, from the code)

Every signature building costs, builds and upgrades like its faction's light production building: 150 credits, 14 s; T2
150 credits + 50 energy (14 s), T3 250 + 120 (20 s); 640 HP (Axiarchs: 512 HP + 192 shields). At most one of each per side;
no supply. Code: roles `sigA`/`sigB` in BDEF / BDEF_BH / BDEF_AX; numbers in the YARD, BUNKER, MOUND, ROOT, BEACON, ECHO blocks.

| Building | T1 | T2 | T3 |
|---|---|---|---|
| **Salvage Yard** (Last Fist A) | Salvage 20% (base 10%) | Cap 400 a minute (×2); energy = half the credits salvaged | Overdrive: salvage over the cap gives Last Fist production +25% for 20 s (refreshes, never stacks) |
| **Fortification Depot** (Last Fist B) | A Node Bunker on every held node | Bunkers heal Barracks units in range 2% HP/s | Bunker damage ×2, hits aircraft |
| **Brood Mound** (Bloomhost A) | 2 Mites every 20 s (cap 10 living) | 3 Mites every 20 s | A killed Mite bursts: 1.2 damage, radius 40, enemy ground units only |
| **Rootheart** (Bloomhost B) | Creep grows 1.5× faster and 1.5× farther; enemy ground units on it −15% speed | Bloomhost regen on creep 1.5× (2.25%/s) | Every 15 s: snare up to 5 enemy ground units on the creep's outer 16 for 1 s; 10 s immunity |
| **Phase Beacon** (Axiarchs A) | A field bubble, radius 140 (a node's), on the frontmost ground unit (re-picked every 1 s, moves 90/s); collapses for 15 s if units inside lose 35% of shields + HP within 5 s | Radius 210 (1.5×) | Warp-ins inside the bubble: full shields, +20% damage for 8 s |
| **Echo Reliquary** (Axiarchs B) | Keeps 3 echoes of fallen T2/T3 units (oldest replaced); re-warp for 50% cost | Keeps 5 | Recovered units: overshield 30% of max shields for 20 s, no regen |

| Unit | HP | Damage | Range | Speed | Other |
|---|---|---|---|---|---|
| **Node Bunker** (Depot) | 450 | 6 every 0.45 s (13/s); T3 12 (27/s) | 250 | — | Ground only until T3; free; no pad; rebuilt 45 s after it falls while the node is held; no Salvage |
| **Mite** (Brood Mound) | 24 | 2.4 every 0.5 s (4.8/s), melee | 20 | 62.4 | Ground and buildings; 30 s life; free; no supply; never captures nodes; no Salvage; sight 150 |

## Interpretations made while building (details in KNOWN_ISSUES.md, "Signature buildings, batch 1–3")
- AI (section 5): the signature building replaces the plan's last duplicate building (never the only copy of a type), is built
  once the difficulty's Refineries (or all the plan has) and a Barracks-role building are finished, and is held while under
  pressure, like tech. The Axiarch AI spends an echo (oldest first) whenever it can afford one and has supply room.
- Salvage counts the price actually paid (`paidOf`): temporary units 0, recovered units 50%.
- Phase Beacon: with no units the bubble sits on the Beacon; a collapse removes it at once and it re-forms (growing) at the
  anchor; "warping into the bubble" means the normal warp channel arriving inside it (Mass Warp arrivals don't count).
- Echo re-warp time is the normal warp channel (2 s), with no production time.

## Definition of Done (section 8), checked at v2.34
- All six buildings work at T1–T3 as written: tests/signature.test.js, tests/bloomhost-sig.test.js, tests/axiarchs-sig.test.js.
- One-of-each limit and rebuilding after a loss: tests/signature.test.js (and the UI tests' "Already built").
- 8 pads per player, unchanged: SLOT_COUNT 8; bunkers use no pad (tested).
- No free unit gives Salvage (Mites, temporary units, bunkers; tested); echoes can't loop (recovered units never leave echoes; tested).
- Bunkers never outlive their node (tested); Mites never exceed the cap (tested).
- The minimal AI builds and uses them without cheating: the same tryBuild / tryUpgrade / tryEcho rules as the player (tests per faction).
- Saves load correctly, old saves included: v28, v29, v30 migrations and tests.
- Usable at 667×375: screenshots in docs/screenshots/ (sig-*, bhsig-*, axsig-*) and the UI tests at 667×375.
