# AXIARCHS — THIRD FACTION SPEC (docs/AXIARCHS.md)

0. RULES
- Third faction, alongside Last Fist and Bloomhost. Reuse existing systems wherever possible: the faction framework, upgrade trees, temporary units, the creep zone code, commander abilities. Credits, energy and supply only; no new resource.
- Inspired by the general style of StarCraft's Protoss, but every design and name must be original. Do not copy any Blizzard unit, building or name.
- No balance tuning, matchup testing or stat iteration until the audit. First-pass numbers come from comparing against existing units (cost per supply, damage per credit). Keep a stats table at the end of this doc. Log balance questions under Audit in KNOWN_ISSUES.md.
- Do not change Last Fist or Bloomhost behavior. Every batch checks that a fixed Last Fist match and a fixed Bloomhost vs Last Fist match play identically to the previous version before re-recording any fingerprint.
- AI: only the minimum needed to play the faction (build its economy, pick paths, train every unit, use the default warp point, capture nodes, attack, use abilities). Quality comes in AI training. No AI cheating.
- Testing is functional only, per CLAUDE.md.
- Hidden enemy faction: Axiarchs join You / Opponent / Random in the setup menu. Enemy Axiarch buildings, pads, power fields and warp effects are hidden by fog the same way Bloomhost creep is. Nothing in the UI names the enemy faction during a match.

1. IDENTITY
An ancient, elite alien civilization that controls space and energy through obsidian monoliths and floating geometry. Few, powerful, expensive units. Strong when its network is established and it controls the engagement; weak to attrition, lost nodes and careless losses.
- Units cost more credits, energy and supply than the other factions' equivalents. Energy is the main bottleneck for advanced units and abilities.
- Last Fist = conventional combined arms. Bloomhost = swarm and creep. Axiarchs = elite units, shields, warp-in, power network.

2. SHIELDS
- Every Axiarch unit and building has shield points on top of health. Damage hits shields first; any overflow goes to health. Damage modifiers (armor types, corrosion) apply before the split.
- Shields regenerate after a few seconds without taking damage, faster inside a friendly power field. Shields never restore health, and Axiarch health does not regenerate on its own.
- Show shields as a separate cyan bar above the health bar, plus a brief shimmer when hit.
- In code, keep unit shields clearly separate from the HQ invulnerability shield and Last Fist's Emergency Shield.
- The storm deals normal damage to shields and health. No special interaction.

3. POWER FIELD (the Warp Matrix)
- A zone system modeled on Bloomhost creep; reuse its spread and recede code where possible. All radii, growth and recede rates go in one constants block.
- Sources: the Axis (base field), each Continuum Spire (enlarges the base field), and each field node the Axiarchs hold (a forward field around that node).
- It grows and recedes gradually. A node's field recedes when the node is lost.
- Inside a friendly field: units can warp in there, and shields regenerate faster. Nothing else depends on the field. No building power-down: the base is always powered by the Axis.
- Visual: subtle geometric lines and a faint cyan glow, cached and redrawn only on change like creep. It must never cover units, bars, effects or UI.
- Fog: enemy fields are hidden by fog like creep. Fields grant no vision.

4. WARP-IN PRODUCTION
- Training stays a single tap in the Train tab. Cost and supply are paid on tap. When production finishes, the unit warps in at the warp point with a short visible channel (about 2 s shimmer) instead of walking out of its building.
- Warp point: by default, the front edge of the friendly field (the point furthest toward the enemy along the lane). The player can tap a "Set warp point" control, then tap a spot inside the friendly field to move it.
- If the warp point ends up outside the field (e.g., a node is lost), it snaps back to the default.
- Units only warp inside a friendly field. A unit never arrives on top of enemies, buildings or invalid ground: it shifts to the nearest valid spot, and if there is none, it warps in at the Axis.
- Enemies see the warp channel only inside their own vision.
- The AI always uses the default warp point.

5. BUILDINGS (8 pads)
Pads are dark geometric stone platforms with faint glyphs; empty pads look like dormant stone. Each side's pads match its own faction. T1–T3 art for every building.
- Axis (HQ): the base field source. HQ shield and defeat rules unchanged; its weapon works like the existing HQ weapon.
- Matter Loom (refinery role: credits).
- Singularity Well (reactor role: energy).
- Continuum Spire (habitat role: supply). Also enlarges the base field.
- Genesis Gate (light ground production). Base unit: Shardling. Paths: Riftwalk Doctrine (T2 Riftstalker, T3 Parallax) or Lattice Doctrine (T2 Lancer, T3 Astral Marksman).
- Architectum (heavy ground production). Base unit: Bastion. Paths: Rupture Doctrine (T2 Rift Mortar, T3 Worldbreaker) or Dominion Doctrine (T2 Gravemantle, T3 Eventide).
- Celestial Array (air production). Base unit: Wraithwing. Paths: Swarm Calculus (T2 Prismwing, T3 Shardstorm) or Ascendant Calculus (T2 Voidcarrier, T3 Astral Sovereign).
- Null Lance (defence role). Hits ground and air. T1: single-target precision beam. T2 "Split Lattice": splits its attack across up to 3 nearby targets at lower damage each. T3 "Event Horizon": longer range, heavier hits, more building damage, slower attack. No power-field bonus.
Trees use the existing system: path chosen at the T1→T2 upgrade, locked per building, reset by selling. The base unit stays available on both paths.

6. UNITS
Targets: G = ground units, A = aircraft, B = buildings. All units have shields. Every unit needs a distinct original silhouette.
Genesis Gate
- Shardling (base): cheap by Axiarch standards; fast melee; captures nodes. G, B. Countered by focus fire and splash.
- Riftstalker (Riftwalk T2): melee hunter. Short phase-step toward a target, reusing the Leaper leap code (range limit, cooldown). Bonus damage vs light armor. G, B. Countered by focus fire and heavy frontline units.
- Parallax (Riftwalk T3): stronger hunter whose phase-step lands just behind the target. Its hits apply "disrupt" (target deals less damage for about 2 s; no stacking, capped). G, B.
- Lancer (Lattice T2): medium-range energy bolts. A, G, B. A main source of mobile anti-air. Countered by melee and splash.
- Astral Marksman (Lattice T3): very long range with a slow, clearly visible charge-up before each shot. Reduced damage vs buildings. G, B. Countered by fast attackers.
Architectum
- Bastion (base): heavy, slow frontline with large shields. Timed distortion brace reducing incoming damage, reusing the Bulwark brace code. G, B.
- Rift Mortar (Rupture T2): reuses Artillery mechanics: long range, minimum range, splash. G, B.
- Worldbreaker (Rupture T3): heavy siege. Impacts leave a short distortion zone that deals light damage, reusing the Ruinmaw acid-patch system with its hard cap. G, B.
- Gravemantle (Dominion T2): low damage. Aura slows nearby enemy ground units; capped and never stacks with other slows. G.
- Eventide (Dominion T3): every so often, a visible gravity pulse pulls nearby enemy ground units a short distance inward. Long cooldown, never pulls units into buildings or invalid ground, no effect on aircraft. G.
Celestial Array
- Wraithwing (base): fast flyer. A, G, B. The base source of mobile anti-air, available on both paths. Countered by anti-air.
- Prismwing (Swarm T2): fragile, cheaper flyer. Shield link: when a Prismwing's shield takes damage, half of it is spread evenly across the shields of up to 3 other Prismwings nearby. Shields only, never health. G, B.
- Shardstorm (Swarm T3): swarm-killer flyer. Its beam chains from the target to up to 3 more enemies nearby, with reduced damage on each jump. Reuse the Split Lattice multi-target code. A, G.
- Voidcarrier (Ascendant T2): heavy, slow flyer with slow powerful projectiles. Prefers buildings, reusing the Brood Tyrant targeting. G, B.
- Astral Sovereign (Ascendant T3): huge, very slow flyer with heavy area damage, prioritizing structures. Modeled on the Worldrender. G, B.

7. COMMANDER ABILITIES
Three abilities sharing one cooldown, using the existing system. Costs, cooldowns and unlocks are mapped from Last Fist equivalents.
- Mass Warp (↔ Repair Pulse): tap an area. Up to 8 of your own units in it warp to your warp point after a visible ~2 s channel. Enemies see the channel only within their vision. Creates no units.
- Shield Overcharge (↔ Emergency Shield): tap an area. Your units in it get much faster shield regen plus capped damage reduction for a short time. No health restore, no invulnerability. It expires correctly with pause, speed changes and save/load.
- Purification Beam (↔ Orbital Strike, HQ T2 unlock): tap a spot on the lane. After a visible warning, a beam sweeps along a strip of the lane over about 1.5 s, dealing heavy damage to ground units and buildings. No effect on aircraft. Existing HQ shield rules apply.

8. VISUALS
Obsidian and black stone, floating geometric slabs, carved glyphs, rotating rings, cyan and pale blue energy with restrained violet. Clean, deliberate animation; nothing mechanical or organic. Procedural art drawn like the rest of the game, cheap on a phone. Silhouettes readable at 667x375.

9. DEFERRED
Warping outside the field; building power-down; Shardling phasing through units; separate Phase Anchors (merged into the field); special storm interactions; the Axiarch AI quality pass (moved to AI training); performance check (before the App Store).

10. BUILD ORDER (one batch per session; never implement beyond the current batch)
(Numbering: main reached v2.24 with the title screen before this faction began, so the batches run v2.25–v2.29.)
1. v2.25 Framework: setup menu; all 8 buildings with pads and T1–T3 art; shields; base units (Shardling, Bastion, Wraithwing) walking out of their buildings for now; Null Lance T1–T3; production paths locked; abilities locked; minimal AI; saves.
2. v2.26 Power field and warp-in production.
3. v2.27 Genesis Gate and Architectum trees.
4. v2.28 Commander abilities.
5. v2.29 Celestial Array tree, plus the close-out docs.
Each batch's finish line: npm test passes, the Last Fist and Bloomhost behavior checks are unchanged, one SIM match of Axiarchs vs Last Fist (Hard) runs to the end, a browser check of new UI, and screenshots of new visuals. No performance runs, matrices or per-personality runs.

11. DEFINITION OF DONE
- Axiarchs can be selected and played; Last Fist and Bloomhost are unchanged.
- All 8 buildings work in their roles; all three production buildings have two-path trees.
- Shields work as in section 2.
- The power field grows, recedes and is hidden by fog.
- Warp-in is always valid and never duplicates units or skips costs.
- All three abilities work and share one cooldown.
- Temporary effects clean up correctly.
- Every unit's targets match section 6.
- Saves load correctly, old saves included.
- The minimal AI plays all content without cheating.
- Usable at 667x375.

=== STATS TABLE (first-pass numbers; implementation record, not tuned) ===

v2.25 framework. Set by comparing with the Last Fist equivalent of each role (cost per supply, damage per credit), as section 0 asks. Code: `BDEF_AX`, the Axiarch entries of `UDEF`, `SHIELD` and the new weapon tables in index.html.

Shields (section 2): `SHIELD` = recharge 10% of maximum per second after 4 s without damage. The power field's faster rate comes in v2.26. Damage modifiers (armor, corrosion, the Bastion's brace, Last Fist's Emergency Shield) apply first; then shields take the hit and any overflow goes to HP. Shields never restore HP. Axiarch HP never regenerates on its own: Axiarch buildings don't self-repair (paid Repair still works). The storm hits shields first, like any damage. Unit shields are `shp`/`maxShp`, kept apart from the HQ shield (`shielded`) and the Emergency Shield (`shT`).

Buildings: same roles, costs, build times, upgrade costs, income and supply as Last Fist. HP is 80% of Last Fist's; shields are 30% of Last Fist's HP. Both scale with the tier (×1.25 / ×1.5; the Axis ×1.3 / ×1.6, like the HQ).

| Axiarchs | Role | Cost | HP + shields (T1) | Tier effects (T1 / T2 / T3) | Last Fist equivalent |
|---|---|---|---|---|---|
| Axis | HQ | – | 2,240 + 840 | Axis lance 32 / 42 / 55 damage, 390 / 430 / 470 range, hits air (the HQ gun); +3 credits, +1 energy/s; 12 supply | Command HQ (2,800 HP) |
| Matter Loom | Refinery | 150/0 | 416 + 156 | +4 / +6 / +9 credits/s | Refinery (520 HP) |
| Singularity Well | Reactor | 125/0 | 368 + 138 | +2 / +3 / +4.5 energy/s | Reactor (460 HP) |
| Continuum Spire | Habitat | 100/0 | 336 + 126 | +10 / +16 / +22 supply (enlarges the field from v2.26) | Habitat (420 HP) |
| Genesis Gate | Light ground production | 150/0 | 512 + 192 | Shardlings; stays T1 until v2.27 ("Doctrine paths coming soon") | Barracks (640 HP) |
| Architectum | Heavy ground production (needs a Genesis Gate) | 300/50 | 656 + 246 | Bastions; stays T1 until v2.27 | War Factory (820 HP) |
| Celestial Array | Air production (needs a Genesis Gate) | 350/150 | 560 + 210 | Wraithwings; stays T1 until v2.29 | Tech Lab (700 HP) |
| Null Lance | Defence | 200/50 | 720 + 270 | T1: one beam, 30 damage every 1.0 s (30/s), 260 range. T2 Split Lattice: up to 3 beams of 20 every 0.85 s (24/s each, 71/s at most), 280 range. T3 Event Horizon: 92 every 1.6 s (58/s), 330 range. All hit air | Turret: 27 / 42 / 63 damage/s, 250 / 280 / 310 range |

Units:

| Unit | From | Cost | Supply | HP + shields | Damage / cooldown (dps) | Range | Speed | Armor | Hits | Traits | Last Fist equivalent |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Shardling | Genesis Gate T1 | 80/20 | 2 | 80 + 60 | 11 / 0.6 s (18) | 22 (melee) | 50 | light | ground, buildings | Fast melee; closes on enemies it can see within 150; captures nodes | Rifleman 50/0, 1, 70 HP, 10 dps |
| Bastion | Architectum T1 | 280/90 | 4 | 620 + 420 | 36 / 1.6 s (22.5) | 100 | 23 | vehicle | ground, buildings | Distortion brace (the Bulwark's): the first hit after its cooldown cuts damage 40% for 3 s, every 12 s | Tank 200/40, 3, 560 HP, 25 dps |
| Wraithwing | Celestial Array T1 | 260/120 | 3 | 160 + 140 | 20 / 0.8 s (25) | 140 | 86 | air | aircraft, ground, buildings | Fast flyer; the base mobile anti-air | Gunship 225/100, 3, 230 HP, 25 dps |

Ratios: credits+energy per supply: Shardling 50 (Rifleman 50), Bastion 93 (Tank 80), Wraithwing 127 (Gunship 108). HP+shields per 100 credits+energy: Shardling 140 (Rifleman 140), Bastion 281 (Tank 233), Wraithwing 79 (Gunship 71).

Weapon tables (light / heavy / vehicle / air / building): blade (Shardling) 1.1 / 0.9 / 0.6 / 0 / 0.6; pulse (Bastion) 0.9 / 1.1 / 1.1 / 0 / 1.0; phase (Wraithwing) 1.0 / 0.85 / 1.1 / 1.0 / 0.7; lance (Null Lance T1–T2) 1.0 / 1.0 / 0.9 / 1.1 / 0.3; horizon (Null Lance T3) 1.0 / 1.1 / 1.2 / 1.0 / 0.8.

AI (minimal): the Axiarch units read the personalities' Last Fist tastes through their counterparts (Shardling ↔ Rifleman, Bastion ↔ Tank, Wraithwing ↔ Gunship), with scores in the same style. The AI skips the locked production upgrades and has no abilities to cast. Everything else (build order by role, Null Lances by the Turret rules, nodes, attacks) is the existing logic, unchanged.

Not in v2.25 (per section 10): the power field and warp-in (v2.26; units walk out of their buildings for now), the Genesis Gate and Architectum trees (v2.27), commander abilities (v2.28; shown locked as "Soon"), the Celestial Array tree (v2.29).

=== v2.26 POWER FIELD AND WARP-IN (implementation record; not tuned) ===

Power field (section 3), all numbers in `FIELD` (index.html, SIM section, next to `updateField`). It is built on the creep zone code: `zoneStep` now does the grow and recede step for both creep and the field.

| Constant | Value | Meaning |
|---|---|---|
| axisR | 230 | base field radius around the Axis |
| spireAdd | 40 | added to the base field by each finished Continuum Spire |
| maxR | 400 | the base field's largest radius |
| nodeR | 140 | forward field around each node the Axiarchs hold |
| grow | 7 per second | radius growth (the base field takes about 33 s) |
| nodeGrow | ×1.5 | growth multiplier for a node's field |
| recede | 10 per second | radius lost once the source is gone (node lost, Axis destroyed) |
| regen | 25% of max per second | shield recharge inside the friendly field (outside: `SHIELD.rate`, 10%) |
| front | 0.85 | how far out along the field's front edge the default warp point sits |

Nothing else depends on the field: no building power-down, no vision. The enemy's field is remembered as last seen and drawn only on ground the player has seen, like creep (`fog.field`). It is painted into a cached canvas only when it changes: a faint cyan glow, a lattice of diamonds and spokes, and a team-coloured edge.

Warp-in (section 4), numbers in `WARP`:
- Training is one tap: cost and supply are paid on tap, as before. When production finishes, an Axiarch unit doesn't walk out. It starts a 2 s warp channel (`WARP.ch`) at the warp point, and it counts toward supply while warping.
- Warp point: by default, the front edge of the field (the point furthest toward the enemy). "Set warp point" is the first card on the Train tab: tap it, then tap a spot inside your field. A point that ends up outside the field snaps back to the default, with a message.
- Valid spot: on the lane, inside the field, at least 26 from any enemy, clear of every building, and not on another warp in progress. The search runs outward in rings 18 apart (up to 7 rings). If nothing is valid, the unit warps in at the Axis. The spot is checked again on arrival.
- Enemy warp channels are drawn and heard only inside the player's vision. Units still warping in when the match ends never arrive.
- The AI never sets a warp point, so it always uses the default.

Saves v23 store the field, the warps in progress and each side's warp point. Older saves start with no field and grow it.
