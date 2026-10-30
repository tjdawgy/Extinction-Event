# Signature buildings spec

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
