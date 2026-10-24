=== BLOOMHOST DESIGN DOC ===
EXTINCTION EVENT — BLOOMHOST FACTION DESIGN & IMPLEMENTATION PLAN

1. Project Overview

I am developing a mobile RTS game called Extinction Event, inspired by the classic Flash game Colony. The game is a single-file HTML/JavaScript game designed for landscape play on an iPhone.

I want to add a second playable faction called BLOOMHOST.

The existing human/industrial faction is called LAST FIST. Bloomhost must feel fundamentally different from Last Fist in its visuals, army composition, battlefield behavior, economy strategy, upgrades, and commander abilities.

This is not a simple reskin. I want a genuinely different RTS playstyle.

Most important instructions

* Preserve all existing game functionality, including Last Fist, AI behavior, difficulty levels, saves, loading, upgrades, combat, fog of war, field nodes, commander abilities, match reporting, and the Extinction Event endgame.
* Do not rewrite working systems unnecessarily.
* Inspect the current code and understand its architecture before making changes.
* Reuse existing systems where possible, but extend them cleanly to support faction-specific mechanics.
* Do not make Bloomhost stronger simply by giving it excessive health or damage. Its strength should come from its unique mechanics and tactical options.
* Keep the game mobile-friendly. The interface must remain readable and usable on an iPhone in landscape mode.
* Do not introduce unnecessary complexity, external dependencies, or a separate resource economy.
* If a mechanic is technically difficult or risks breaking an existing system, explain the issue and recommend a simpler implementation before proceeding.
* Use the existing game's actual code and data as the source of truth. Do not assume that example values in this document match current code.
* Preserve compatibility with existing saved games. Old saves must still load as Last Fist games with their existing state intact.

Before changing the code, briefly summarize how the current faction, unit production, upgrade trees, damage model, commander abilities, and save system work. Identify the relevant code structures and any implementation risks. Then implement the faction in controlled steps, testing after each major step.

2. Bloomhost's Identity

Bloomhost is a hostile, rapidly spreading alien ecosystem.

Last Fist is an industrial military faction built around firearms, machinery, combined arms, and specialized equipment.

Bloomhost is built around living organisms, biological evolution, swarm tactics, regeneration, and territory control.

The player should feel like they are commanding a growing infestation rather than a conventional army.

Core gameplay identity

Spread. Establish organic territory across the battlefield.
Regenerate. Recover health outside combat, especially while standing on creep.
Overwhelm. Use cheap melee creatures, surrounding attacks, and specialized organisms to break enemy formations.
Evolve. Choose different production-building upgrade paths to specialize the army.
Exploit weaknesses. Use acid, heavy organisms, aerial attacks, and tactical abilities to overcome specific enemy compositions.

Important weaknesses

Bloomhost must have meaningful counters.

* Melee creatures can struggle against disciplined ranged formations.
* Splash damage and area-denial attacks should punish tightly clustered swarms.
* Cheap organisms should be individually fragile.
* Advanced organisms should require meaningful resource and supply investment.
* Bloomhost must be vulnerable when its approach is poorly planned.
* Regeneration must not make units effectively immortal during combat.

Bloomhost should not win every matchup by spamming its cheapest unit.

The player should need to consider composition, positioning, territory, upgrades, and timing.

3. Shared Game Structure

Bloomhost uses the existing battlefield and base-building architecture.

Preserve the existing:

* Side-scrolling battlefield and lane.
* Eight building pads around each faction's HQ.
* HQ shield mechanic: the HQ remains protected while another building on that side is alive.
* Credits, energy, and population/supply systems.
* Three capturable field nodes.
* Fog of war and unit vision.
* Tier 1, Tier 2, and Tier 3 building upgrades.
* Two-branch production-building upgrade trees.
* Sell and repair functionality.
* Unit stances and army management.
* AI difficulty settings and personality types.
* Commander ability interface.
* Match timer, Extinction Event storm, and match-end reporting.

Bloomhost must be a legitimate playable faction with its own production choices and AI behavior.

Do not create a completely separate game mode for it.

Resources

Initially, Bloomhost uses the same credits and energy resources as Last Fist.

Do not add Biomass or any additional resource in this version.

Its uniqueness comes from creep, regeneration, swarm behavior, biological units, and evolution paths rather than an additional economy system.

Supply

Use the existing supply system and hard cap.

Skitterlings and other cheap creatures may use less supply than Last Fist's equivalent units, but their supply costs must be balanced against their actual combat effectiveness.

Do not simply allow unlimited numbers of creatures.

4. Bloomhost's Signature Mechanic: Creep

Creep is the most important faction-specific system.

It is a visible organic layer that gradually spreads across the battlefield as Bloomhost establishes itself.

The battlefield should visibly become more infested as the Bloomhost player expands.

Creep generation

* The Hive generates creep around the Bloomhost base.
* Other Bloomhost buildings gradually contribute to nearby creep growth.
* Captured field nodes accelerate creep expansion in their surrounding area.
* Creep should spread gradually, not instantly cover the entire battlefield.
* Creep should be represented visually using a lightweight organic ground effect, such as branching veins, fleshy patches, or subtle bioluminescent growth.
* The effect should be visible against the battlefield and readable on a small phone screen.
* Creep should not obscure units, health bars, selection indicators, projectiles, or important interface elements.

The exact spread speed and radius should be tunable.

Use the existing battlefield coordinates and update system. Do not introduce a complicated grid or pathfinding system solely for creep if a simpler distance-based or zone-based implementation will work.

Creep benefits

Bloomhost units standing on creep receive:

1. Movement bonus: Start testing approximately 20–25% faster movement.
2. Regeneration: Units recover a small amount of health over time while on creep.
3. Vision bonus: A modest increase to vision range may be tested if it integrates cleanly with the current fog-of-war system.

These are starting design targets, not final balance values.

Regeneration should be stronger or more reliable on creep than away from it. To start, allow modest out-of-combat regeneration and test whether combat regeneration is necessary at all.

Do not allow health regeneration to stack uncontrollably with multiple sources.

Creep and enemies

Enemy units do not automatically take damage or suffer a movement penalty just because they stand on Bloomhost creep.

Creep is primarily a benefit to Bloomhost, not an automatic debuff against Last Fist.

Corrosive Bloom, the commander ability described later, provides the temporary enemy debuff.

Creep and fog of war

Creep is not a substitute for vision.

Visible creep may communicate that Bloomhost has established territory, but it must not reveal enemy units, hidden buildings, or enemy army composition through fog of war.

Do not accidentally bypass the existing vision and scouting rules.

Creep and nodes

Captured nodes should become valuable strategic locations because they generate resources and accelerate nearby creep growth.

This encourages Bloomhost to expand and fight for territory without making nodes mandatory for the faction to function.

Bloomhost must still be able to fight and operate away from creep.

Creep and the Extinction Event

Do not give Bloomhost special resistance to the endgame storm in the initial implementation.

The storm must remain a shared endgame pressure mechanic.
5. Building Roster

Use these building names and roles.

1. Hive — Headquarters

The central organism and heart of the colony.

* Functions as Bloomhost's HQ.
* Uses the existing HQ health, shield, and defeat mechanics.
* Generates the normal HQ resource income unless faction balance testing suggests a justified adjustment.
* Serves as the primary source of creep.
* Visually appears as a large, living alien structure rather than a mechanical base.

2. Goremound — Refinery

Bloomhost's credit-producing building.

* Fulfills the existing Refinery role.
* Processes minerals and biological matter into credits.
* Upgrades increase its credit production.
* Its appearance should become larger and more developed at higher tiers.

3. Pulse Organ — Reactor

Bloomhost's energy-producing building.

* Fulfills the existing Reactor role.
* Generates energy through biological/electrical pulses.
* Higher tiers should have visibly more developed glowing organs and branching veins.

4. Hatchery — Habitat

Increases population capacity.

* Uses the existing Habitat/supply-capacity system.
* Visually contains eggs, developing organisms, or organic growth chambers.
* Higher tiers should look more substantial.

5. Larva Pit — Basic Ground Production

Produces small swarm creatures and their specialized evolutionary forms.

This building has two upgrade paths:

* Predatory Evolution
* Acidic Evolution

The choice at Tier 2 locks this building into the selected path. Tier 3 deepens the chosen specialization.

A second Larva Pit can select the other path independently.

6. Evolution Chamber — Heavy Ground Production

Produces larger, heavier ground organisms.

This building has two upgrade paths:

* Siege Evolution
* Predator Evolution

Tier 3 deepens the selected path.

7. Maw — Defensive Building

A stationary living defensive organism.

* Fulfills the existing defensive turret role.
* Attacks enemies within range.
* Uses the existing defensive-building targeting and damage infrastructure where possible.
* Has meaningful weaknesses and must not become an invulnerable defensive structure.
* Visually resembles a threatening organic mouth or defensive organism embedded in the ground.

The exact attack profile and upgrades should be balanced against existing Last Fist turrets.

8. Bloomspire — Advanced and Aerial Production

A major biological production structure that produces flying organisms and advanced aerial strains.

It should look like a massive organic growth with chambers and membranes for developing airborne creatures.

This building has two upgrade paths:

* Swarm Bloom
* Apex Bloom

Tier 3 deepens the chosen path.

The Bloomspire should feel like an advanced biological production structure, not a conventional tower or a human aircraft factory.

6. Troop Roster and Evolution Trees

These are the intended creature roles and working names.

Use the existing unit system, including its attack logic, armor types, health bars, selection, stances, targeting, supply, and match-reporting functionality.

Do not invent an entirely separate combat engine for Bloomhost.

Exact health, damage, costs, range, speed, attack rate, and supply values should be determined by inspecting the current game's balance and then tuned through testing.

A. Larva Pit — Predatory Evolution

Tier 1: Skitterling

The basic Bloomhost swarm organism.

Role: Cheap melee unit, early pressure, node capture, and surrounding attacks.

Characteristics:

* Low cost and low individual durability.
* Fast movement.
* Attacks using claws and mandibles at close range.
* Becomes more dangerous when several Skitterlings surround the same target.
* Gains a modest coordinated-swarm damage bonus when multiple Skitterlings attack the same enemy.
* Vulnerable to splash damage and area denial.
* Benefits from creep's movement and regeneration bonuses.

Skitterlings must not be so fragile that ranged enemies kill them before they can contribute.

They should reach melee range often enough for their low cost and close-range damage to matter.

Tier 2: Leaper

Unlocked through Predatory Evolution.

A specialized hunter with powerful hind legs that can leap a short distance toward an enemy.

* Designed to close gaps and pressure vulnerable ranged units.
* Leap has a cooldown and cannot be used continuously.
* Must obey valid target and movement rules.
* Cannot simply teleport through the entire battlefield.
* Should have a clear counter, such as splash damage or focused fire.

Tier 3: Ravager

The advanced form of the predatory branch.

* A stronger melee hunter.
* Excels at attacking isolated targets and lightly armored enemies.
* Should punish exposed support and ranged units.
* Remains vulnerable to concentrated defensive fire.

This path prioritizes closing the distance and hunting exposed enemies.

B. Larva Pit — Acidic Evolution

Tier 2: Spitter

A ranged organism that launches corrosive projectiles.

* Attacks from a safer distance than Skitterlings.
* Deals modest damage and applies a temporary armor-weakening effect.
* Has limited durability.
* Performs poorly if enemies reach it in melee.
* Provides support for Skitterlings and heavier creatures.

Corrosion must have a cap, duration, and clear visual feedback. It must not stack indefinitely.

Tier 3: Bilecaster

A larger, more specialized ranged organism.

* Launches corrosive attacks with splash damage against ground units.
* Particularly effective against clustered enemies.
* Applies a stronger or more reliable corrosion effect than the Spitter.
* Has low enough durability to remain vulnerable to direct attacks.
* Should not replace the Evolution Chamber's dedicated siege role.

This path prioritizes weakening enemy formations and preparing them for a swarm assault.

C. Evolution Chamber — Siege Evolution

Tier 1: Bulwark

A heavy, armored ground organism.

* High health.
* Slow movement.
* Modest damage.
* Acts as a frontline anchor that absorbs incoming fire.
* Can briefly brace itself to reduce frontal incoming damage, if directional damage is feasible within the current combat system.
* Vulnerable to appropriate armor-piercing attacks and being surrounded.

The Bulwark must help other creatures survive the approach to enemy lines.

If directional armor would require excessive changes to the combat engine, use a simpler temporary defensive stance instead.

Tier 2: Bile Lobber

A biological artillery creature.

* Attacks from long range by launching arcing bile projectiles.
* Deals damage to ground units and buildings.
* Has splash damage.
* Has a minimum firing range.
* Has low health and requires protection.
* Should be able to threaten static defenses without automatically winning every siege.

Reuse the existing artillery or projectile mechanics if possible.

Tier 3: Ruinmaw

A powerful siege organism.

* Deals heavy damage to buildings and clustered ground units.
* Its attacks can leave a short-lived damaging acid patch on the ground.
* Acid patches create temporary area denial.
* Has a slow attack cycle and high investment cost.
* Vulnerable to fast attackers reaching it.

The area-denial effect must be short-lived, visually readable, and inexpensive to calculate.

D. Evolution Chamber — Predator Evolution

Tier 2: Thornback

A close-range bruiser with thick armor and defensive spines.

* Designed to survive at the front of the swarm.
* Deals meaningful close-range damage.
* Enemies attacking it at close range receive a small amount of retaliatory damage.
* Retaliation is limited and must not create infinite damage loops.
* Not intended to be a ranged unit or a siege organism.

Thornback is a troop name, not a building name.

Tier 3: Dreadthorn

A larger, more dangerous Thornback evolution.

* Strong frontline melee creature.
* Its spines can release a short-range retaliatory burst when it takes substantial damage.
* The burst has a long cooldown.
* Effective against tightly packed infantry.
* Vulnerable to ranged focus and dedicated counters.

The defensive retaliation should create an interesting choice for the opponent, not punish every attack so severely that Dreadthorn becomes impossible to kill.

E. Bloomspire — Swarm Bloom

Tier 1: Razorwing

The basic aerial hunter.

* Fast flying organism.
* Lightly armored.
* Attacks ground targets with diving strikes or short-range biological attacks.
* Can reposition rapidly to threaten exposed units.
* Vulnerable to dedicated anti-air units and concentrated fire.
* Must not replace ground units as the universal best answer to every situation.

Tier 2: Needlewing

A cheap, fragile flying organism designed to operate in groups.

* Low individual health.
* Fast movement.
* Modest individual damage.
* Gains a limited coordinated-attack bonus when multiple Needlewings target the same enemy.
* Vulnerable to anti-air attacks and splash damage.

Tier 3: Cloudwing

An advanced swarm flyer.

* Attacks in groups and specializes in overwhelming vulnerable targets.
* Periodically releases a small number of temporary offspring.
* The offspring deal minor damage and expire after a limited time.
* Offspring should not create permanent, unlimited army growth.
* The number of offspring, duration, and cooldown must be capped.

This path prioritizes numerous, fragile flying creatures.

F. Bloomspire — Apex Bloom

Tier 2: Brood Tyrant

A large, expensive aerial organism.

* High investment cost and significant supply requirement.
* Slow compared with Razorwings.
* Attacks ground units and buildings with heavy biological projectiles.
* Prefers buildings when choosing a target, unless the player has issued a different order.
* Vulnerable to dedicated anti-air forces.
* Should feel like a major investment without being an automatic victory.

Tier 3: Worldrender

A massive aerial siege organism.

* Very high cost and supply investment.
* Slow movement and a slow attack cycle.
* Deals heavy damage to buildings and splash damage to ground units.
* Prioritizes structures when appropriate.
* Vulnerable to anti-air specialists and focused fire.
* Must not be able to attack other aircraft if that would eliminate the counterplay intended for it.

This path prioritizes a few devastating aerial organisms rather than a large swarm.

7. Bloomhost's Commander Abilities

Bloomhost has three commander abilities.

They share one cooldown pool, just as the existing game uses a shared cooldown for Last Fist's commander abilities.

Using one ability locks all three for the appropriate shared cooldown duration.

The player must choose between empowering the existing army, creating temporary reinforcements, or weakening the enemy before an attack.

Do not add a fourth ability in this implementation.

Ability 1: Frenzy Bloom

Role: Offensive breakthrough.

Bloomhost triggers a biological frenzy in friendly organisms within a selected target area.

Effect:

* Friendly Bloomhost units in the affected area gain increased movement speed and attack speed.
* The effect lasts for a short duration.
* It does not increase maximum health or provide invulnerability.
* The ability is most useful when an army is ready to engage.
* It should reward good timing rather than allow the player to win a battle simply by activating it.

The visual effect should make affected organisms look more aggressive, with a visible biological pulse or glow.

Ability 2: Emergency Brood

Role: Tactical reinforcements.

A brood pod is launched toward a selected valid friendly battlefield position.

After a short warning and landing animation, the pod opens and releases a limited group of temporary Skitterlings.

Rules:

* Temporary creatures have a limited lifespan.
* They consume no permanent population supply, but their count and lifetime must be tightly capped.
* They use the normal unit targeting, movement, and attack systems.
* They can distract defenders, contest a node, or buy time for the main army.
* They must not spawn directly on top of enemy units or inside invalid locations.
* The ability needs a visible warning so the opponent has some opportunity to react.
* If the pod lands on creep, consider giving it one additional temporary creature as a small synergy bonus. Only implement this if it is straightforward and well balanced.

Emergency Brood must not create permanent units or provide an unlimited source of free supply.

Ability 3: Corrosive Bloom

Role: Area debuff and coordinated attack setup.

The player selects a target area. A visible cloud of corrosive spores affects enemy ground units in that area.

Effect:

* Enemy ground units take light damage over time.
* Affected enemies suffer a temporary armor reduction.
* The effect has a clear duration and radius.
* It encourages the player to follow up with Skitterlings, Thornbacks, or other attacking organisms.
* Enemies can retreat out of the area.
* It does not affect aircraft in the initial version.
* The corrosion effect is capped and does not stack indefinitely.

Use a clear visual warning and ground effect so the enemy can recognize the affected area.

Commander ability balance

The exact resource costs, cooldown durations, radius, damage, and effect strength should be established after inspecting the existing game.

Do not simply copy Last Fist's values without considering Bloomhost's economy and combat style.

All three abilities should create tactical opportunities, not automatic victories.
8. Critical Combat Balance: Melee Units Must Reach Their Targets

This is one of the most important requirements for Bloomhost.

Last Fist has ranged infantry, snipers, tanks, artillery, and other units capable of attacking before melee creatures reach them.

If Bloomhost's melee units die before reaching their targets, the faction will not be fun or viable.

Do not solve this by making every Bloomhost unit excessively durable.

Use several complementary mechanics.

A. Creep movement bonus

The movement bonus on creep should help melee units close the distance.

Start testing around 20–25% additional movement speed on creep.

Make the value tunable.

B. Skitterling approach durability

Test a modest defensive bonus while Skitterlings are approaching an enemy or during the opening part of an engagement.

Possible implementation: a short approach-defense window that reduces incoming damage.

Rules:

* It must have a limited duration.
* It must not refresh continuously while the unit remains under fire.
* It must not provide permanent damage reduction.
* It should help Skitterlings reach melee range without making them unusually durable once they are engaged.

If adding a new approach state is too complex, first test whether movement bonuses, target behavior, and frontline support are sufficient.

C. Specialized gap closers

Leapers have a short-range leap ability that helps them reach ranged enemies.

Razorwings can use their aerial mobility to threaten exposed targets.

Do not make every creature equally mobile. Choosing the correct evolutionary branch should matter.

D. Frontline protection

Bulwarks and Thornbacks provide a durable frontline while smaller creatures close in.

This is essential to Bloomhost's combined-arms strategy.

E. Combat movement and kiting

Inspect the existing targeting and movement behavior.

Avoid situations where ranged units can retreat indefinitely while firing at melee creatures that can never catch them.

Possible solutions include:

* Movement-speed differences between unit classes.
* Firing or movement trade-offs for selected ranged units, if the current combat system supports them.
* Better swarm spreading so multiple melee units can reach and attack the same target without stacking on top of one another.
* Leap or aerial mobility for specialized creatures.
* Splash damage and area denial as counters to tightly packed swarms.

Do not make all Last Fist ranged units bad at retreating. Snipers and selected specialist units should retain their intended strengths.

F. Swarm attack behavior

When multiple Skitterlings attack a target, they should spread around it where practical.

Avoid having the entire swarm occupy the same position or queue behind a single unit.

Make sure collision, spacing, and target selection do not prevent a large swarm from dealing its intended damage.

G. Required matchup tests

Before finalizing melee stats, test at least:

1. Ten Skitterlings against a comparable investment of Last Fist Riflemen.
2. Ten Skitterlings attacking Riflemen while standing on creep.
3. Skitterlings supported by a Bulwark against Riflemen.
4. Skitterlings attacking a Rifleman-and-Artillery defensive composition.
5. Leapers against Snipers or other ranged specialists.
6. Thornbacks against clustered infantry.
7. Bloomhost swarms against Tanks and flame-based counters.

Observe how many creatures reach melee range, how much damage they deal before dying, and whether the outcome depends on positioning and unit composition.

The goal is not to make Skitterlings beat every enemy army head-on. The goal is to ensure their low cost, mobility, and melee damage are meaningful.

9. Upgrade System Requirements

Preserve the existing Tier 1 → Tier 2 → Tier 3 building upgrade structure.

At Tier 2, the player chooses one of two evolutionary branches. That choice locks the building into the selected path. Tier 3 improves that branch.

The choice is made per building, not globally for the faction.

Examples:

* One Larva Pit can specialize in Predatory Evolution while a second specializes in Acidic Evolution.
* One Evolution Chamber can specialize in Siege Evolution while a second specializes in Predator Evolution.
* One Bloomspire can specialize in Swarm Bloom while a second specializes in Apex Bloom.

Selling a building should follow the existing game's reset and refund rules.

Do not allow a building to switch branches for free after the choice has been made.

Upgrade presentation

The player must understand:

* Which branch each building has chosen.
* Which units the branch unlocks.
* What the next tier changes.
* What each upgrade costs.
* Whether an upgrade is currently affordable.
* Whether the upgrade is locked behind another requirement.

Use the existing interface wherever possible, with faction-specific names and descriptions.

10. Faction Visual Identity

Bloomhost must be visually distinct from Last Fist.

Visual direction

* Organic, alien, biological, and threatening.
* Chitin, membranes, tendrils, eggs, sacs, mandibles, claws, and bioluminescent veins.
* Distinct silhouettes for different unit roles.
* Living structures that become more developed as they upgrade.
* Creep that visually spreads across the battlefield.
* Biological attack effects such as acid projectiles, spores, bile, and living pods.

Avoid making every unit a generic insect with a different size.

Each organism needs a recognizable silhouette and a clear visual role.

Examples:

* Skitterlings: small, fast, low-to-the-ground melee creatures.
* Leapers: powerful hind legs and a predatory silhouette.
* Spitters: visible acid sacs and a ranged attack posture.
* Bulwarks: large, heavy, plated organisms.
* Bile Lobbers: specialized artillery anatomy.
* Thornbacks: prominent defensive spines.
* Razorwings: sleek flying predators.
* Needlewings: smaller, fragile flyers designed for group attacks.
* Brood Tyrants: large, intimidating aerial organisms.
* Worldrenders: enormous, slow aerial siege creatures.

Visual and technical constraints

* Keep unit silhouettes readable at mobile scale.
* Use lightweight animations and effects compatible with the current game.
* Avoid excessive particles or animations that reduce frame rate.
* Do not block health bars, projectiles, or selection indicators.
* Use existing rendering techniques where possible.
* If custom art assets are not available, use coherent procedural shapes and animations rather than introducing unrelated placeholder imagery.

11. AI Support

Bloomhost must work as both a player faction and an AI faction.

Inspect how the current AI selects buildings, produces units, chooses upgrades, captures nodes, uses commander abilities, and responds to threats.

Extend that behavior to support Bloomhost's mechanics.

The AI should:

* Build the appropriate Bloomhost economy and production structures.
* Use the existing supply and resource rules.
* Select sensible evolutionary branches.
* Produce a mixture of units based on the enemy composition and its chosen strategy.
* Value field nodes and the benefits of creep.
* Avoid endlessly producing only Skitterlings.
* Use Bulwarks and Thornbacks to support melee approaches.
* Produce ranged acid organisms, siege organisms, or aerial units when appropriate.
* Use commander abilities at useful moments.
* Respect fog of war and information limits.
* Continue using the existing Easy, Normal, and Hard difficulty differences.

Do not give the AI hidden credits, energy, supply, vision, or combat bonuses to compensate for missing behavior.

Difficulty should come from differences in decision quality, timing, and execution, consistent with the existing game.

If a full Bloomhost AI is too large to implement safely in one pass, identify the minimum viable AI behavior needed for the faction to function and then improve it incrementally.

12. Matchups and Faction Balance

Bloomhost should be a viable alternative to Last Fist, not a strict upgrade.

Last Fist should retain its strengths in conventional combined arms, flexible ranged damage, and specialized military units.

Bloomhost should excel at establishing territory, exploiting creep, regenerating outside combat, and creating coordinated swarm assaults.

Intended strategic choices

Swarm pressure: Use Skitterlings and Predatory Evolution to pressure nodes and exploit isolated units.
Corrosive assault: Use Spitters or Bilecasters to weaken a formation, then send in melee creatures.
Armored push: Use Bulwarks and Thornbacks to absorb fire and create opportunities for smaller creatures.
Siege assault: Use Bile Lobbers and Ruinmaws to threaten static defenses and buildings.
Aerial swarm: Use Razorwings, Needlewings, and Cloudwings to overwhelm vulnerable targets.
Apex assault: Invest heavily in Brood Tyrants and Worldrenders to threaten buildings with expensive aerial siege organisms.

These strategies should have different strengths and weaknesses.

Do not tune the entire faction around one dominant build.

Balance testing

Use the existing AI difficulty modes and combat logging or match-reporting systems to test faction matchups.

Pay attention to:

* Time to first meaningful attack.
* Time needed to capture nodes.
* Unit survival during the approach to ranged targets.
* Economic investment versus combat effectiveness.
* Supply efficiency.
* Effectiveness against splash damage.
* Effectiveness of creep bonuses.
* Value of Tier 2 and Tier 3 investments.
* Whether the AI can respond sensibly to different Bloomhost branches.
* Whether commander abilities create meaningful opportunities without deciding fights automatically.

Keep numerical values easy to tune.

13. Save Compatibility and Implementation Safety

The existing game already has working functionality and saved state. Adding Bloomhost must not break it.

Requirements:

* Existing saves must load as Last Fist games with their current state preserved.
* Faction identity must be explicitly represented in the game state for new matches.
* Save and restore must correctly handle Bloomhost buildings, unit types, evolutionary branches, creep state, and commander cooldowns.
* If an older save does not contain faction or creep data, initialize safe defaults without corrupting the save.
* Do not reset or discard existing player progress.
* Ensure selling, repairing, upgrading, and destroying Bloomhost buildings update creep appropriately.
* Ensure temporary Emergency Brood creatures expire and are cleaned up correctly.
* Ensure temporary offspring and corrosive ground effects have limits and cannot leak indefinitely into later matches.
* Ensure commander cooldowns and faction-specific effects pause or resume consistently with the existing pause and speed controls.
* Ensure the Extinction Event storm affects Bloomhost buildings and units according to existing game rules unless a future, explicitly approved design change says otherwise.

Do not remove any existing functionality to make Bloomhost easier to implement.

14. Implementation Sequence

Work incrementally.

Phase 1: Inspect the existing game
Identify the current structures responsible for: faction definitions and selection; building types and costs; unit definitions and combat; upgrade branches; resource and supply calculations; fog of war; field nodes; commander abilities; AI decisions; save/load; rendering and mobile UI. Summarize the findings and any risks before changing the code.

Phase 2: Add the Bloomhost faction framework
Add faction identity, the eight building names, initial unit definitions, and faction-specific production branches. Ensure the faction can be selected and started without breaking Last Fist.

Phase 3: Implement creep
Implement visual creep spread, movement bonuses, regeneration, and node interaction. Test that creep does not bypass fog of war or reveal enemy positions.

Phase 4: Implement units and evolution trees
Add the unit roster and both Tier 2/Tier 3 branches for each production building. Verify all units work with the existing targeting, damage, health, supply, stances, and reporting systems.

Phase 5: Implement commander abilities
Add Frenzy Bloom, Emergency Brood, and Corrosive Bloom using the existing shared-cooldown architecture. Test targeting, effects, cooldowns, resource costs, pause behavior, and cleanup.

Phase 6: Implement AI support
Ensure Bloomhost AI can build an economy, select upgrades, produce units, contest nodes, use abilities, and respond to Last Fist.

Phase 7: Balance and polish
Test the required matchups, tune costs and stats, improve visuals, and confirm the faction is readable and fun on an iPhone.

15. Definition of Done

Bloomhost is not complete merely because its buildings and units appear on screen.

It is complete when:

* The player can select Bloomhost and start a new match.
* Last Fist remains fully functional.
* Bloomhost's buildings have the correct roles and upgrade paths.
* All three production buildings have independent two-branch evolution trees.
* Creep spreads, is visually readable, and provides the intended bonuses.
* Creep does not reveal hidden enemies through fog of war.
* Melee units can realistically reach ranged targets under appropriate conditions.
* Swarm units have clear strengths and weaknesses.
* The Maw works as a defensive building.
* All three commander abilities work and share the correct cooldown pool.
* Temporary units and effects are cleaned up correctly.
* Bloomhost AI functions without cheating.
* Existing saves still work.
* The game remains usable and performant on an iPhone in landscape mode.
* The Extinction Event endgame still works correctly.
* Match reporting and other existing systems continue to function.

At the end, provide a concise implementation report describing:

1. What was added.
2. Which existing files or code sections changed.
3. How the faction and upgrade trees work.
4. How creep and commander abilities work.
5. Which tests were actually performed and their results.
6. Any known bugs, balance issues, or unfinished features.
7. Any recommended next steps.

Do not claim that something was tested if it was not actually tested.

The ultimate goal is a faction that feels like a living, spreading alien infestation, with meaningful tactical choices and strong counterplay, while preserving the existing game's working systems and mobile performance.

=== AMENDMENTS — these override the design doc above wherever they conflict ===

A. LOOK AND FEEL
- Art direction: inspired by the general style of StarCraft's Zerg — chitin, carapace, claws, membranes, pulsing organic structures, creep — but every design must be original. Do not copy any Blizzard unit, building, or name.
- Building pads: Last Fist keeps its industrial pads. Bloomhost's 8 pads are organic: fleshy, creep-covered mounds or root beds that look like part of the creep, not concrete or steel. Empty Bloomhost pads look like dormant growth. Each side's pads match its own faction.
- Procedural art drawn the same way current art is drawn. Readable at phone scale.

B. UPGRADE PATH STRUCTURE (match Last Fist's tree system in code)
- Each production building has one base unit available on both paths: Larva Pit → Skitterling, Evolution Chamber → Bulwark, Bloomspire → Razorwing.
- The path choice happens at the same upgrade step where Last Fist picks its path, and it locks the building. Reuse Last Fist's tree system. Do not build a new one.

C. OUT OF SCOPE UNTIL ALL THREE FACTIONS ARE IN
- No balance tuning, matchup testing, or stat iteration. Set first-pass numbers by comparing against Last Fist equivalents (cost per supply, damage per credit), log them, and move on. Section 8G, section 12 balance testing, and Phase 7 are deferred to the audit, which happens after the third faction. Log every open balance question under "Audit" in KNOWN_ISSUES.md.
- Do not change Last Fist unit behavior (e.g., kiting) to help Bloomhost.
- Deferred: the Skitterling approach-defense window, the creep vision bonus, Bulwark directional bracing (use a simple timed brace instead), and the Emergency Brood creep bonus.
- AI: only the minimum needed for the AI to play Bloomhost — build its economy, pick paths, train from every building, capture nodes, use abilities. Smarter tactics come in the AI training phase. No AI cheating.

D. BUILD ORDER — one batch per session, each with its own prompt. Never implement beyond the current batch.
1. v2.17 Framework: match setup menu (see E), all 8 Bloomhost buildings with organic pads and tier art, base units (Skitterling, Bulwark, Razorwing), the Maw, saves, and minimal AI using base units.
2. v2.18 Creep.
3. v2.19 Larva Pit and Evolution Chamber trees.
4. v2.20 Commander abilities, including the temporary-unit system (Cloudwing reuses it later).
5. v2.21 Bloomspire tree.
6. v2.22 Bloomhost AI pass plus smoke tests.
Each batch's finish line: npm test passes, a short AI smoke test with no errors or timeouts, and performance within noise of the previous version.

E. MATCH SETUP AND HIDDEN ENEMY FACTION
- Match setup menu, in this order: 1) AI difficulty (Easy / Normal / Hard), 2) your faction (Last Fist / Bloomhost / Random), 3) opponent faction (Last Fist / Bloomhost / Random). Mirror matches are allowed. Remember the last choices. Must fit and be tappable at 667x375.
- If you pick Random for yourself, your faction is shown when the match starts.
- The opponent's faction is never revealed by the UI: no name, color, icon, toast, or log line gives it away during the match. You learn it only by scouting (seeing their units, buildings, or creep in your vision).
- Fog of war hides the enemy's buildings, pads, and creep until seen, the same as units. This overrides any part of the design doc that says creep is visible through fog.
- Commander ability effects and sounds from the enemy must not reveal their faction unless they happen inside your vision.
- The post-match report and match log reveal both factions.
- Old saves load as Last Fist vs Last Fist.

F. ANTI-AIR (decided, implement in v2.19): Bloomhost needs mobile anti-air. Spitters (Acidic path) and Razorwings (Bloomspire base unit) both hit air and ground targets. Do not implement before v2.19.

=== v2.17 FIRST-PASS STATS (implementation record; not tuned) ===

Set by comparing with the Last Fist equivalent of each role (cost per supply, damage per credit), as amendment C asks. These are starting numbers for the audit, not balanced values. Code: `BDEF_BH` and the Bloomhost entries of `UDEF` in index.html.

Buildings (same roles, costs, build times, HP, income and supply as Last Fist unless noted):

| Bloomhost | Role | Cost (credits/energy) | HP | Build time | Tier effects (T1 / T2 / T3) | Last Fist equivalent |
|---|---|---|---|---|---|---|
| Hive | HQ | – | 2,800 (×1.3, ×1.6 at T2, T3) | – | Spine launcher 32 / 42 / 55 damage, 390 / 430 / 470 range, hits air; +3 credits, +1 energy/s; 12 supply | Command HQ (identical numbers) |
| Goremound | Refinery | 150/0 | 520 | 10 s | +4 / +6 / +9 credits/s | Refinery |
| Pulse Organ | Reactor | 125/0 | 460 | 12 s | +2 / +3 / +4.5 energy/s | Reactor |
| Hatchery | Habitat | 100/0 | 420 | 8 s | +10 / +16 / +22 supply | Habitat |
| Larva Pit | Basic ground production | 150/0 | 640 | 14 s | Skitterlings; stays T1 until v2.19 ("Evolution paths coming soon") | Barracks |
| Evolution Chamber | Heavy ground production (needs a Larva Pit) | 300/50 | 820 | 20 s | Bulwarks; stays T1 until v2.19 | War Factory (needs a Barracks) |
| Bloomspire | Air production (needs a Larva Pit) | 350/150 | 700 | 26 s | Razorwings; stays T1 until v2.21 | Tech Lab (needs a Barracks) |
| Maw | Defence | 200/50 | 1,000 (Turret 900) | 12 s | Spines 27 / 40 / 58 damage/s, 220 / 245 / 270 range (Turret 250 / 280 / 310), hits air; no damage to buildings | Turret: same damage per second, +11% HP, 30–40 less range |

Upgrade costs and times are the Last Fist ones for every role. Drawn heights (health bars, aim points) are lower than Last Fist's: Hive 56, Goremound 30, Pulse Organ 24, Hatchery 6, Larva Pit 12, Evolution Chamber 16, Maw 18, Bloomspire 52.

Units:

| Unit | From | Cost | Supply | HP | Damage / cooldown (dps) | Range | Speed | Armor | Hits | Traits | Last Fist equivalent |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Skitterling | Larva Pit T1 | 40/0 | 1 | 60 | 6 / 0.5 s (12) | 20 (melee) | 52 | light | ground | +15% damage per other Skitterling attacking the same target, up to +45%; closes on enemies it can see within 150; sight 170; trains in 3 s | Rifleman: 50/0, 1 supply, 70 HP, 10 dps, 120 range, speed 38, hits air |
| Bulwark | Evolution Chamber T1 | 190/40 | 3 | 760 | 26 / 1.6 s (16) | 34 (melee) | 24 | vehicle | ground | Brace: the first hit after its cooldown hardens it, 40% less damage for 3 s, every 12 s; closes within 150; sight 190 | Tank: 200/40, 3 supply, 560 HP, 25 dps with splash, 160 range, speed 31 |
| Razorwing | Bloomspire T1 | 170/70 | 2 | 170 | 15 / 0.75 s (20) | 50 (diving strikes) | 95 | air | ground only | Closes within 200; sight 250 | Gunship: 225/100, 3 supply, 230 HP, 25 dps, 140 range, speed 72, hits air |

Ratios: credits+energy per supply: Skitterling 40 (Rifleman 50), Bulwark 77 (Tank 80), Razorwing 120 (Gunship 108). Damage per second per 100 credits+energy: Skitterling 30 (Rifleman 20), Bulwark 7 (Tank 10), Razorwing 8.3 (Gunship 7.7). HP per 100: Skitterling 150 (Rifleman 140), Bulwark 330 (Tank 233), Razorwing 71 (Gunship 71).

New weapon damage tables (multiplier by target armor: light / heavy / vehicle / air / building): claw (Skitterling) 1.0 / 0.7 / 0.45 / 0 / 0.5; slam (Bulwark) 1.1 / 1.0 / 0.8 / 0 / 0.9; talon (Razorwing) 1.1 / 0.9 / 0.9 / 0 / 0.6; spine (Maw) 1.0 / 0.8 / 0.8 / 1.0 / 0.

Not in v2.17 (per amendment D): creep (v2.18), the Larva Pit and Evolution Chamber trees (v2.19), commander abilities (v2.20, shown as "Coming soon"), the Bloomspire tree (v2.21). Deferred by amendment C: the Skitterling approach-defense window, the creep vision bonus, directional bracing, the Emergency Brood creep bonus.

=== v2.18 CREEP (implementation record; not tuned) ===

All numbers are in the `CREEP` constant in index.html (SIM section, next to `updateCreep`).

| Constant | Value | Meaning |
|---|---|---|
| hiveR | 260 | creep radius around the Hive (world units; the lane is 1,700 long) |
| bldR | 110 | around every other finished Bloomhost building |
| nodeR | 150 | around a field node Bloomhost holds |
| grow | 6 per second | how fast a patch's radius grows toward its target (the Hive's takes about 43 s) |
| nodeGrow | ×2 | growth multiplier around a held node |
| recede | 9 per second | how fast a patch shrinks once its building is sold or destroyed, or its node is lost |
| speed | ×1.2 | movement for Bloomhost ground units on their own creep |
| regen | 1.5% of max HP per second | on creep, out of combat only |
| calm | 5 s | out of combat = no damage taken and no attack made for this long |

Model: one circular patch per source, on the existing u/v coordinates (no grid, no pathfinding). A unit is on creep when it stands inside any of its side's patches. Aircraft get nothing (they are not on the ground). Regeneration never stacks: with a faster heal running on the same unit (a Medicopter), only that one applies, and a Repair Pulse uses the faster of its own rate and the creep's. No vision bonus (deferred), no effect on enemy units, no change to the storm.

Fog: the enemy's creep is remembered as last seen (like building ghosts) and drawn only on ground the player has had in view, like enemy pads. Creep grants no vision. Saves v18 store both; older saves start with no creep and grow it.
