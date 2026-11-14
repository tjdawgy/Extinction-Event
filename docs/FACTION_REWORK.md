# Faction rework

**Goal:** make Last Fist, Bloomhost and the Axiarchs feel like three genuinely different armies to play and to fight
against. Gameplay uniqueness first, looks second.

**Core decision: break the mirror.** Not every faction gets every battlefield role. Each faction owns jobs nobody else
does and deliberately lacks others. The building skeleton stays (three production buildings, two paths each, two units
per path) because the UI and AI rely on it; what fills it changes.

## Rules for every rework batch

- Starting values only. No balance tuning loops until all three unit batches are in; then one balance pass.
- Each batch's changes sit behind one switch block (like SALVAGE or BALANCE7C). Once a batch ships, its new behavior is ON
  in normal matches so it can be playtested; switching it off restores the previous behavior, so old and new can be
  compared in the Test Range.
- New unit abilities are automatic, driven by the unit's own logic, unless a unit's entry below says the player chooses
  something. No hidden extra buttons or gestures.
- All randomness in new mechanics uses the game's seeded SIM random generator, so replays, determinism tests and Test
  Range Reset repeat exactly.
- The AI must use every new mechanic sensibly (not perfectly). Where the AI maps a unit to a Last Fist counterpart, give
  units with no counterpart their own rules.
- Update each changed unit's desc, Codex entry, tutorial text if it mentions the unit, and UNIT_TIPS. Text must read
  numbers live, as now.
- Every new mechanic needs readable visuals: the enemy must be able to see what is happening and react. Each effect must
  stay readable at 667×375 in a crowded fight; each batch includes a screenshot of every new effect at that size,
  mid-fight.
- Art for each reworked unit is redrawn in the same batch, in the new art style (see Art direction).

## Faction identities

### Last Fist: coordinated firepower

- **Owns:** the only true long-range artillery, with spotters; air superiority; true bombing; healing and support; units
  that are stronger together (cover, suppression, escorts).
- **Lacks:** regeneration, swarming, teleporting. Lost units stay lost (Salvage softens it).
- **Feels like:** set up a position, coordinate, grind forward.

### Bloomhost: overwhelming biology

- **Owns:** numbers, burrowing and ambush, spawning, sacrifice, area denial (creep, acid), attrition and healing on creep.
- **Lacks:** any long-range precision (no artillery, no snipers). It must get close: flood, ambush, or wear the enemy
  down.
- **Feels like:** a tide that keeps coming and hits from where you did not expect.

### Axiarchs: control of space

- **Owns:** teleporting and displacement, beams, shields, removing enemies from the fight, walls and barriers, warp-in
  at the front.
- **Lacks:** cheap units, swarms, health regeneration. Few units, each expensive to lose. Map healing (repair depots and
  the base rally point) still applies to Axiarch units: it is a map feature, not faction regeneration.
- **Feels like:** a small elite force that decides where the fight happens.

## Batch 2: Artillery and siege

### Artillery (Last Fist, War Factory Siege T2)

Stays the game's only true artillery and keeps its spotter relationship with the Recon Drone. Two built-in weaknesses,
each with its own on/off switch so both can be tried in the Test Range:

- **Deploy time:** it must set up before firing and pack up before moving. Deploying is automatic when it stops to fire
  (no extra taps).
- **Telegraphed shells:** a ground marker shows where each shell will land shortly before impact, so moving units can
  dodge. The AI dodges markers the way it already dodges meteor warnings.

**Counter:** flank it, catch it moving, Gorebores, keep moving under fire.

### Gorebore (Bloomhost, replaces the Bile Lobber; Evolution Chamber, path renamed Burrowing Evolution, T2)

Burrows and tunnels toward the enemy backline, preferring artillery, snipers and other ranged backline units. While
burrowed it cannot be shot but leaves a moving dirt trail anyone with vision can see. It erupts under its target with
burst damage around it, stays surfaced and exposed for a few seconds, then burrows again (cooldown) to escape or move to
the next target. No minimum range, no arcing shots.

**Counter:** watch for trails, move the threatened units, keep guards beside the backline, kill it while surfaced.

### Severance (Axiarchs, replaces the Rift Mortar; Architectum Rupture T2)

Fires a slow, visible rift orb at a spot (no minimum range). Every enemy unit in a small circle is exiled for about 4
seconds: frozen, untouchable, unable to act; then they snap back. Units returning from exile cannot be exiled again for a
few seconds (no permanent lockdown). Units only, not buildings. Low damage, long cooldown. It is a tool for splitting an
army: exile the half you do not want to fight now, or exile the defenders while your units hit what they guarded.

**Counter:** spread out, punish it in its long cooldown.

### Titan (Last Fist, War Factory Siege T3)

Walking cover. Friendly infantry near it take less damage from ranged attacks; infantry advance in its shadow. When it
plants beside an enemy building, its cannon does heavy building damage at short range. It no longer plants for extra
range (that would copy the Artillery's deploy).

**Counter:** kill or scatter its infantry, hit it while planted, Heavies and aircraft.

### Ruinmaw (Bloomhost, Evolution Chamber Burrowing Evolution T3)

Living tunnel. A colossal worm that tunnels under the enemy (same visible-trail rule as the Gorebore) and surfaces where
the player chooses. Surfaced, it is a gate: Bloomhost ground units sent into its tunnel entrance at home pour out of its
mouth. It also chews any building it surfaces beside. Killing it collapses the tunnel and drops whatever is inside. It no
longer leaves acid pools (those move to the Bilecaster).

**Player control** (the one rework unit the player steers): select the Ruinmaw and tap a spot to choose where it tunnels
and surfaces. While it is surfaced, a tunnel entrance shows at the Bloomhost base; select ground units and tap the
entrance to send them through, and they come out of the Ruinmaw's mouth. If the player gives no order, it tunnels toward
the nearest enemy building on its own. The AI chooses its own surfacing spots.

**Counter:** track the trail, kill it fast once it surfaces.

### Worldbreaker (Axiarchs, Architectum Rupture T3)

Fault line. It slams the ground and a rupture races forward in a straight line, damaging everything along it, with heavy
building damage. The crack becomes a short-lived wall enemy ground units cannot cross. With Severance, it decides where
the fight happens.

**Counter:** do not line up, reach it from the side; slow, cannot hit aircraft.

## Batch 3: Divers and melee

### Leaper (Bloomhost, Larva Pit Predatory T2)

Parasite. Springs onto a target and latches on, preferring big targets (vehicles, walkers). While latched it eats the
target over time and slows it. If the host dies with a Leaper on it, two temporary Skitterlings hatch.

**Counter:** shoot it off fast (it can be hit while latched).

### Riftstalker (Axiarchs, Genesis Gate Riftwalk T2)

The game's only backline assassin. Keeps its teleport strike onto ranged units; blinks back home when its shields break;
on a kill it can chain-blink to another target in range.

**Counter:** burst it before it fades; keep something sturdy beside the backline.

### Parallax (Axiarchs, Genesis Gate Riftwalk T3)

Guardian swap. No longer dives. When a nearby ally drops low, it swaps places with it: the wounded unit lands where the
Parallax stood, the armored Parallax takes its place in the fight. Its blows still weaken enemy fire.

**Counter:** spread damage instead of focusing one unit, or kill the Parallax first.

### Ravager (Bloomhost, Larva Pit Predatory T3)

Devourer. Eats fallen units (enemy or its own) to heal and grow bigger and stronger, up to three stacks. Replaces the
kill frenzy.

**Counter:** kill it early, before it feeds.

### Dreadthorn (Bloomhost, Evolution Chamber Predator T3)

Charger. Tramples through the enemy line in a straight charge, damaging and knocking units aside, then needs time to
recover. Replaces the spine burst.

**Counter:** spread out, punish the recovery.

### Bastion (Axiarchs, Architectum base unit)

Shield barrier. Projects a barrier in front of it that blocks enemy shots for allies behind it (blocks outright, not a
damage reduction). Loses the brace, which stays unique to the Bulwark.

**Counter:** melee, lobbed shells that arc over, flanking.

### Shardling (Axiarchs, Genesis Gate base unit)

Parry. Every few seconds it completely blocks one hit and instantly strikes back. A pricey duelist, not a cheap raider.

### Bulwark (Bloomhost, Evolution Chamber base unit)

Keeps its brace (now unique) and regenerates faster on creep.

### Thornback (Bloomhost, Evolution Chamber Predator T2)

Unchanged (thorns). It holds the line; the Dreadthorn breaks it.

## Batch 4: Ranged and air

### Sniper (Last Fist, Barracks Specialists T3)

Suppressing fire. Keeps its piercing shot; hits pin infantry in place briefly.

### Astral Marksman (Axiarchs, Genesis Gate Lattice T3)

Marker. Its charged shot marks the target; every Axiarch unit deals extra damage to it for a few seconds.

### Bilecaster (Bloomhost, Larva Pit Acidic T3)

Acid flood. Mid-range spray that leaves a lasting corrosive pool (area denial). No longer a long-range single-target
unit.

### Gunship (Last Fist, Tech Lab base unit)

Missile salvos. A burst of four missiles, then a reload.

### Wraithwing (Axiarchs, Celestial Array base unit)

Blink raider. Moves in short teleport hops instead of flying, firing a bolt each time it lands; anti-air keeps losing
track of it. Replaces phase-on-hit.

**Counter:** splash and chaining anti-air.

### Leviathan (Last Fist, Tech Lab Air Power T3)

Bombing runs. Flies over a target dropping a line of bombs along its path, then circles back. Depends on Interceptor
escorts.

### Brood Tyrant (Bloomhost, Bloomspire Apex T2)

Infester. Its globs stick to buildings as pustules (up to three per building) that rot the building over time; if the
building falls with pustules on it, they burst into Mites. Paid Repair clears pustules.

### Worldrender (Bloomhost, Bloomspire Apex T3)

Lands on a building and devours it, dealing huge damage and healing while it feeds. While landed it is a ground target:
every ground unit can hit it.

### Voidcarrier (Axiarchs, Celestial Array Ascendant T2)

Stays a flying power node. Loses its building-killing attack and building preference; gets a light defensive weapon.

### Astral Sovereign (Axiarchs, Celestial Array Ascendant T3)

Judgement beam, as its description promises. Locks onto one target from long range with a visible beam, charges a few
seconds, then fires massive single-target damage at a unit or building. If its shields break while charging, the shot
fails. Replaces the bomb drop.

## Unchanged (already distinct)

Rifleman, Heavy, Tank, Flame Tank, Hydra, Interceptor, Medicopter, Recon Drone, Mite, Skitterling, Spitter, Razorwing,
Needlewing, Cloudwing, Thornback, Lancer, Gravemantle, Eventide, Prismwing, Shardstorm.

## Watch list

Check in the Test Range and playtests; adjust only in the balance pass unless something is broken.

- Axiarch control stacking: exile, walls and the Parallax swap together must not leave the opponent feeling unable to
  play. If a unit can be chained between Axiarch control effects, add a shared immunity window.
- Subtle mechanics (Shardling parry, Marksman mark, Gunship salvos, Bulwark creep regen) must still be visible in a
  crowded fight on a phone.
- The Voidcarrier as pure support may feel dull; note it if so.
- Bloomhost loses all long-range options and was already the weakest faction; expect it to need the most attention in
  the balance pass.

## Art direction

The game adopts a richer art style for units: shading (gradients), dark outlines, a light rim along top edges, glowing
eyes, cores and visors, and faction-specific anatomy:

- **Last Fist:** scavenged military. Olive and steel, rust-orange fuel tanks, hazard stripes, gas masks, exposed pistons,
  smoking exhausts.
- **Bloomhost:** no straight lines. Overlapping carapace plates, sinewy limbs, pulsing glow sacs, drool, spore vents.
- **Axiarchs:** nothing touches. Floating obsidian shards held together by thin lines of light; halos, light banners,
  orbiting rings.

Team color covers much of each unit (armor, carapace, stone), not just trim, so sides read at a glance, including mirror
matches.

Units stay cached as poses (the sprite cache), so richer drawing costs little per frame; check performance on aircraft
and live-drawn poses.

Each batch redraws its reworked units in this style. Ty may provide Forge design codes (from the Forge prototype) as
visual references. A final art batch after batch 4 redraws the unchanged units and the buildings to match.

## Batch order

1. Test Range and this doc.
2. Artillery and siege: Artillery, Gorebore, Severance, Titan, Ruinmaw, Worldbreaker.
3. Divers and melee: Leaper, Riftstalker, Parallax, Ravager, Dreadthorn, Bastion, Shardling, Bulwark.
4. Ranged and air: Sniper, Astral Marksman, Bilecaster, Gunship, Wraithwing, Leviathan, Brood Tyrant, Worldrender,
   Voidcarrier, Astral Sovereign.
5. Art batch: unchanged units and buildings in the new style.

Then: the paused balance pass, with all three factions reworked.
