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

**Batch 2a (Artillery, Gorebore, Severance): done in v2.82.** Code: src/sim/rework.js (switch block `REWORK` → `g.rw`:
`b2a`, `artDeploy`, `artTelegraph`; on by default; each Test Range row sets its own), art in src/render/units-rework.js.
Starting values as asked (ART, BORE, SEVER). Departures and choices the design left open:
- New internal ids `gorebore` and `severance` instead of renaming `bilelobber` / `riftmortar`: a game with b2a off (old
  saves, Test Range rows, the pinned replays) still trains the old units, so both must exist side by side. Path and step
  names (Burrowing Evolution, Severances) and the Codex follow the new-game default.
- Artillery: it keeps its three-shell salvo, so one shot makes three markers (each shell's own landing spot, the salvo's
  usual scatter). It packs up after 2 s with nothing to shoot (`ART.idle`), never on Hold. A marker is the shell's blast
  (radius = its splash, shaped like the blast: across the lane counts 0.6).
- Gorebore: surface speed kept at the Lobber's 22. Underground with no target it travels where its orders send it and
  surfaces quietly when it stops (no damage, no cooldown). The eruption also hits buildings (at 0.5×); buildings are its
  last choice of target. It picks targets it can see within 300 (on Hold or a move order: 160 of its spot / 170).
- Severance: the orb aims at a group's centre now (no lead on moving units). Aircraft can be exiled too; units still
  immune take the orb's 20 damage but are not exiled. While exiled, shields don't recharge and an exiled Medevac or
  aura unit does nothing. "About to fight its army" and "defenders around a building its army attacks" weight a group's
  supply ×1.5 each; a lone unit only at 4+ supply.
- AI: Gorebore and Severance have their own scores (Gorebore: the share of enemy ranged backline; Severance: a few per
  army, more against many units); neither counts as artillery or siege. Gorebores are left out of the "mass" hold-back.
  The siege push (2+ Artillery or Titans) still happens.
- **Fixed in v2.83 (from playtesting 2a):** v2.82 had AI units step out of shell markers the way they step out of meteor
  circles (`markDodge`). It made the Artillery useless and armies never advanced past it, so it is gone: no unit, AI or
  player, moves out of a marker on its own. Shells still land where they were aimed, with the marker and the 1.6 s
  minimum flight, so a player can still dodge on purpose by moving units. The meteor-warning dodge is unchanged.

### Artillery (Last Fist, War Factory Siege T2)

Stays the game's only true artillery and keeps its spotter relationship with the Recon Drone. Two built-in weaknesses,
each with its own on/off switch so both can be tried in the Test Range:

- **Deploy time:** it must set up before firing and pack up before moving. Deploying is automatic when it stops to fire
  (no extra taps).
- **Telegraphed shells:** a ground marker shows where each shell will land shortly before impact, so moving units can
  dodge. Nobody dodges automatically (v2.83): units walk on through the markers unless a player moves them out.

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

**Batch 2b (Titan, Ruinmaw, Worldbreaker): done in v2.83.** Code: src/sim/rework-2b.js (`REWORK.b2b` → `g.rw.b2b`; on by
default; each Test Range row has its own switch), art in src/render/units-rework-2b.js. Starting values as asked (`TITAN`,
`RUIN`, `WB`). The units keep their internal ids; with `b2b` on a game plays each through its own definition (`rwD`, a
copy of its UDEF entry), so UDEF never changes and a b2b-off game in the same page plays v2.82 exactly. Departures and
choices the design left open:
- Titan: its cannon range is 160 as asked (it was 190 mobile / 280 planted). It no longer shells buildings from range: on
  Attack or sent at a building it walks up to 100 (breach range) and plants there, so it never chips a building from 160
  at 1×. Cover is "not melee": every melee unit's weapon and the ground effects (eruptions, thorns, meteors, acid and
  spore pools, Mite bursts) are not covered; everything else is, building guns included. Planted, it still fires at
  units in its 160 range when no building is within 100; it unplants 2 s after the last building in reach.
- Ruinmaw: 1500 HP, heavy armour (a unit field `u.arm`, since UDEF keeps v2.82's), speed 30 underground. It has no
  burrow cooldown (it digs whenever it moves). The Tunnel is a command in the command bar (as asked) rather than tapping
  the entrance (as this doc first said); the entrance is drawn beside the Hive while a gate is open. Units out of its
  mouth step 44 ahead of it to a spot each (spacing) and hold there (the player's) or fight around it for 20 s (the
  AI's). A player's units that reach the entrance while the gate is shut wait there; an AI's give up. A player's
  Ruinmaw with no order holds (direct control: nothing moves on its own), unlike this doc's "tunnels toward the nearest
  enemy building on its own"; the AI picks spots.
- Worldbreaker: the crack runs through its target out to its full range (210), not just to the target: ending at the
  target would hit nothing but the nearest unit, since the target is the nearest. An AI's ridge shot ends at the spot
  the AI chose (wbAim). The player's ridge forms at the crack's end. A ridge never spans the lane: at least 50 of open
  ground is left at one end (lane edge or wall). Enemy ground units whose way crosses a ridge walk to the nearer open end
  at full speed (on Classic too, where sideways movement is otherwise slower) and a step that would cross is undone.
  Burrowed units pass under it; aircraft over it; its own side through it.
- AI: Titans: Last Fist infantry more than 60 ahead of the nearest Titan wait for it on the attack. Ruinmaws: own score
  (more with more Bloomhost ground units, at most two), own persona tastes, not a siege unit; they surface beside the
  least defended enemy Refinery, Reactor or Habitat the AI knows of (else 160 behind the enemy front on a flank), send
  up to 8 ground units from home through at a time (10 in the tunnel at most), go home underground under 35% health.
  Worldbreakers: own score (more against melee and light armies) and tastes; ridges before a melee charge, between a
  retreating army and the enemy, else 60 behind the target.

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

**Player control** (the one rework unit the player steers): select the Ruinmaw and tap a spot (a normal move order) to
choose where it tunnels and surfaces. While it is surfaced, a tunnel entrance shows at the Bloomhost base and a
**Tunnel** command appears in the command bar for selected Bloomhost ground units: they walk to the entrance, and 3 s
later come out of the Ruinmaw's mouth, one every 0.5 s. Moving the Ruinmaw closes the gate (units inside come back out at
the entrance); if it dies, units inside are lost. The AI chooses its own surfacing spots. (v2.83 as built; see Batch 2b.)

**Counter:** track the trail, kill it fast once it surfaces.

### Worldbreaker (Axiarchs, Architectum Rupture T3)

Fault line. It slams the ground and a rupture races forward in a straight line, damaging everything along it, with heavy
building damage. Every 12 s the crack ends in a short-lived ridge across the lane that enemy ground units cannot cross
and must walk around (it never spans the whole lane). With Severance, it decides where
the fight happens.

**Counter:** do not line up, reach it from the side; slow, cannot hit aircraft.

## Batch 3: Divers and melee

**Batch 3a (Leaper, Riftstalker, Parallax, Ravager): done in v2.84.** Code: src/sim/rework-3a.js (`REWORK.b3a` → `g.rw.b3a`;
on by default; each Test Range row has its own "Batch 3a" switch), art in src/render/units-rework-3a.js. Starting values as
asked (`LATCH`, `RS`, `SWAP`, `RAV`). The units keep their ids and play through per-game definitions (`rwD`); UDEF is
untouched, so a b3a-off game plays v2.83 exactly (a b3a-off save leaves the key out: byte for byte a v2.83 save).
Departures and choices the design left open:
- Target orders: a Leaper or Riftstalker given a direct target (a tap on an enemy; also the Test Range's Attack, which
  targets each unit at the nearest enemy) leaps onto that target rather than its preferred one. Before, no unit leapt at
  all under a target order.
- Leaper: no minimum leap distance for a latch (the old leap needed 45). With three Leapers on the best host, others pick
  the next host or bite as before. It feeds in bites every 0.5 s (5 each), not every frame, so the host doesn't flash
  constantly. Hatched Skitterlings count toward the Skitterling limit (60) like Emergency Brood's.
- Riftstalker: the strike takes the ranged unit with the longest range in reach (45-130), then the nearest; with none, it
  still steps onto other prey as before. After a chain blink it strikes at once (attack cooldown cut to 0.15 s). "Out on a
  strike" runs from the step until it starts fading back; only then do breaking shields blink it home (shields already
  at 0 when it stepped don't count).
- Parallax: "health" is HP (not shields) for both the ally's 30% and its own 40%. Another Parallax can be saved. After a
  swap an AI's wounded unit falls back for 3 s; a player's unit on Hold holds at its new spot.
- Ravager: "out of combat" is nothing in weapon or chase range and unhurt for 2 s. It walks in until its jaw is over the
  pile (14 in front of it); one Ravager claims a pile; a pile being eaten doesn't expire mid-feed.
- AI: AI_TWIN is unchanged (b3a-off games read it); with b3a on the four use their own persona tastes (`RW3A_TASTE`) and
  scores (Leaper: the share of big enemy ground units; Riftstalker: the enemy's ranged and far share; Parallax: how many
  expensive units it has, at most one Parallax per two; Ravager: light and heavy armies). Codex counters come from UNIT_TIPS.

**Batch 3b (Dreadthorn, Bastion, Shardling, Bulwark): done in v2.85**, with a fix to 3a first (Part 0, below). Code:
src/sim/rework-3b.js (`REWORK.b3b` → `g.rw.b3b`; on by default; each Test Range row has its own "Batch 3b" switch), art in
src/render/units-rework-3b.js. Starting values as asked (`TRAMPLE`, `BAR`, `PARRY`, `BULK`). As in 3a the units keep their ids
and play through per-game definitions (`rwD`, `RW3B_D`); UDEF is untouched, so a b3b-off game plays v2.84 exactly (the pinned
fingerprints match, a seeded Test Range skirmish hashes as on v2.84's build, and a b3b-off save leaves the key out).
- **Part 0 (the 3a Riftstalker, v2.85):** self-play showed its blink home never triggered, because the fade after every
  strike brought it back before its shields could break. With b3a on it no longer fades back: it stays and fights its
  target, and blinks home (`rsHome`) when its shields break, or when it has no chain target and nothing in reach (after a
  kill at once; otherwise after 0.5 s with nothing in reach, `RS.idle`, so a target stepping just out of reach is followed).
  Ordered to retreat or move, it is no longer out on a strike. The AI strikes with half its shields or more (`RS.aiShp`; was
  75%). Chain blinks unchanged. The three pinned 3a matches (FP_V284C*) contain no Riftstalker strike, so they are
  unchanged; a seeded Test Range skirmish with Riftstalkers pins the new behaviour (tests/rework-3b.test.js).
Departures and choices the design left open:
- Dreadthorn: the cooldown runs from the charge's start. It picks, among enemy ground units 80-200 away, the one whose line
  tramples the most enemy supply (within 18 of its path); an AI's charge needs 3 supply on the line (three Marines, or one
  unit of 3+ supply such as a Tank), a player's takes any. It doesn't start a charge while something is already in its melee
  reach (it fights), nor on Hold at enemies further than the usual hold reach from its spot. A target order (a tap on an
  enemy) charges at that unit from 40 to 200 (40: not from point-blank). It stops at any building, an enemy Worldbreaker
  ridge, a wall or the field's edge. The knock is a 0.25 s slide sideways, away from its path (never into a wall).
  Aircraft, burrowed, tunnelling and exiled units are not hit; a latched Leaper is hit but not knocked. Slows don't slow a
  charge already running; a snare stops one starting. The charge's blows come from the Dreadthorn, so a Thornback's thorns
  and a Shardling's parry answer it.
- Bastion: it loses the surge and the brace (it had the brace with the unit redesign off). "Shots" are every projectile that
  flies straight (bullets, rockets, missiles, bolts, the Severance's orb, building guns) and every beam. Lobbed shells (the
  Artillery's salvo, the Bile Lobber's and Rift Mortar's in b2a-off games), bombs dropped from above, flame, cracks,
  eruptions, meteors, acid and melee pass. The wall stands 44 high: a shot crossing above it (aircraft firing from height at
  something far behind it, fire at aircraft overhead) passes. A blocked shot does its full damage to the wall (no armour
  multiplier, no splash). It faces the nearest enemy it can see within 260 that is not an aircraft (none: toward the enemy
  base). While its Bastion is exiled the wall is down.
- Shardling: "the attacker is in its melee reach" means in melee with it: within the Shardling's own reach (22), or a melee
  attacker within that attacker's own reach (most melee units reach further than 22). A ranged hit from further away is
  parried without a counter. An acid pool's steady burn doesn't spend the parry (it would every tick). Ready when it spawns.
- Bulwark: "in combat" is the existing creep rule (hurt, or attacking, within the last 5 s). Out of combat 3× the creep
  regeneration (a Rootheart T2's faster regeneration included), never stacking with a Medevac's heal.
- AI: Bastions: each screens up to six of the side's nearest ranged ground units, standing 40 ahead of their front when it
  has nothing in reach; on the attack, a ranged unit not at least 20 behind its nearest Bastion waits for it (it fights what
  is in reach). Bulwarks: while the side is not attacking, each holds a spot at the front of the creep patch nearest the
  rally point and chases only enemies on its creep or within 50 of its spot. Dreadthorns: the 3-supply rule above. All four
  have their own scores and persona tastes (`RW3B_TASTE`; AI_TWIN unchanged for b3b-off games). The Bloomhost AI still takes
  Burrowing Evolution on its one Evolution Chamber (its path choice is unchanged), so its Dreadthorns are rare (see
  KNOWN_ISSUES.md).
- Art is drawn the new way in b3b-off games too, as in earlier batches.

### Leaper (Bloomhost, Larva Pit Predatory T2)

Parasite. Springs onto a target and latches on, preferring big targets (vehicles, walkers). While latched it eats the
target over time and slows it. If the host dies with a Leaper on it, two temporary Skitterlings hatch.

**Counter:** shoot it off fast (it can be hit while latched).

### Riftstalker (Axiarchs, Genesis Gate Riftwalk T2)

The game's only backline assassin. Keeps its teleport strike onto ranged units and stays to fight there (v2.85: no fade
back after each strike); blinks back home when its shields break or it runs out of targets; on a kill it can chain-blink to
another target in range.

**Counter:** break its shields fast; keep something sturdy beside the backline.

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

**Batch 4a (Sniper, Astral Marksman, Bilecaster, Gunship, Wraithwing): done in v2.86**, with a fix to the AI's path choice
first (Part 0, below). Code: src/sim/rework-4a.js (`REWORK.b4a` → `g.rw.b4a`; on by default; each Test Range row has its own
"Batch 4a" switch), art in src/render/units-rework-4a.js. Starting values as asked (`PIN`, `MARK`, `BILE`, `SALVO`, `HOP`). As in
3a and 3b the units keep their ids (the Gunship's is `aircraft`) and play through per-game definitions (`rwD`, `RW4A_D`); UDEF is
untouched, so a b4a-off game plays v2.85 exactly (the pinned fingerprints match, seeded Test Range skirmishes hash as on v2.85's
build, and a b4a-off save leaves the key out).
- **Part 0 (the AI's paths, v2.86):** with b4a on a Normal or Hard AI rolls each production building's T2 path once per match
  (`aiPathRoll`, `side.pRoll`, drawn from the match's seeded stream the first time that building type goes to T2): the
  persona's path `PATHROLL.keep` (60%) of the time, the other otherwise. The roll replaces the persona's default inside
  `aiPickPath`, so the counter rules (armoured enemies: Specialists; an infantry flood: Assault) still come first and a second
  copy still takes the path the first lacks. Easy is unchanged.
Departures and choices the design left open:
- Sniper: "infantry" is light armour on the ground (the Leaper, Skitterling, Spitter, Shardling and the rest; a latched Leaper
  too). Pinned, a unit can't walk, leap, latch, strike (Riftstalker), charge (Dreadthorn) or swap (Parallax); a Dreadthorn's
  knock still slides it. A parried hit still pins.
- Marksman: the +25% is on all damage the marking side deals to the marked target while that side is Axiarch, building guns and
  abilities included (damage is applied by side, not by source). The Marksmen themselves don't switch to marks (they place
  them); other Axiarch units switch to the nearest target their side has marked that is already in their weapon's reach (no
  chasing; melee only within melee reach). A target order (a tap on an enemy) still wins.
- Bilecaster: the glob is lobbed on an arc like a shell (it passes over a Bastion's barrier), lands where the target stood
  (no lead, no scatter), and does its 20 to every enemy within 30 (buildings ×0.5, no aircraft). The pools are units-only
  (not buildings or aircraft), burn as `acidpool` (a Shardling's parry ignores it, as with the Ruinmaw's pools), and corrode by
  the existing rule (the strongest corrosion applies, at most +25%). They don't count toward the Ruinmaw pools' cap of 6.
- Gunship: the missiles leave its two pods in turn; a salvo cut short (its target dies) continues with the missiles left on the
  next target; the reload has the usual ±10% spread. The info card's damage per second uses the average cadence.
- Wraithwing: it hops only when it has somewhere to go; in a fight it hops every 0.9 s to a spot about 84 from its target
  (seeded), firing on each landing: the landing bolt is its only attack. Speed changes (slows, Frenzy) don't change its
  hops. "Can't re-acquire" also covers target orders. Instant beams still hit it.
- AI (sides it plays; the player's units target as usual): Snipers aim at the light unit with the most infantry in the line
  behind it; Marksmen at the most expensive unit in reach (one their side already marked counts less; mid-charge they keep
  their target); Gunships open each salvo on the most expensive vehicle in reach and keep it through the salvo; Bilecasters at
  the spot with the most enemy ground units within 40 (those fighting count 1.5×; less where a pool of theirs already is);
  Wraithwings with half their health and shields or more raid the known economy building (Refinery, Reactor, Habitat) with
  the fewest known defences within 260, unless enemies are within 520 of their HQ. All five have their own scores; the
  Marksman, Bilecaster and Wraithwing have persona tastes (`RW4A_TASTE`; the Sniper and Gunship keep the Last Fist personas'
  own). AI_TWIN is unchanged for b4a-off games.
- Text: the Gunship and Wraithwing are base units, so they have no path step text; the other three's steps are updated.
- Art is drawn the new way in b4a-off games too, as in earlier batches.

**Batch 4b (Leviathan, Brood Tyrant, Worldrender, Voidcarrier, Astral Sovereign): done in v2.87**, with a Wraithwing counter fix
for 4a first (Part 0, below). Code: src/sim/rework-4b.js (`REWORK.b4b` → `g.rw.b4b`; on by default; each Test Range row has its own
"Batch 4b" switch), art in src/render/units-rework-4b.js. Starting values as asked (`LEV`, `TYR`, `PUS`, `LAND`, `VC`, `SOV`). The
units keep their ids and play through per-game definitions (`rwD`, `RW4B_D`); UDEF is untouched, so a b4b-off game plays v2.86
exactly (the pinned fingerprints match, seeded Test Range skirmishes hash as on v2.86's build, and a b4b-off save leaves the key out).
- **Part 0 (the Wraithwing's counters, part of b4a, v2.87):** with b4a on, anti-air specialists (a weapon that hits only aircraft,
  `hitsGround: false`: the Interceptor; or one that prefers them, `preferAir`: the Hydra) and every building gun ignore a Wraithwing's
  0.4 s re-acquire delay after a hop (`aaTrack`, read by the target search and `ctlCanHit`). Shots already in flight at it still miss
  when it hops. Its counters are now dedicated anti-air, defences and chaining beams (Codex, desc and UNIT_TIPS updated).
Departures and choices the design left open:
- Part 0: "every defensive building" is every building with a gun: Turrets, Maws, Null Lances, bunkers and HQ guns. No Bloomhost or
  Axiarch unit has either flag (the Bloomhost's air answers are its Maws and Hive). The v2.86 determinism matches with 4a on are
  unchanged by it (no Wraithwing hops into anti-air in them); 4a's seeded skirmish with Wraithwings against a Hydra is re-recorded.
- Leviathan: a target within `LEV.reach` (160) starts a run (P10's reach was 40, right below it). The run follows its target until
  the first bomb falls, then the line is fixed; each bomb is P10's (35, splash 40) and falls slower (`LEV.fall`, so the line can be
  seen coming). The turn is a 2 s half circle toward its target's side (toward the middle near an edge). Retreat ends a run. At its
  speed (24) a pass with the 120 carry-on and the turn takes about 12 s, so against one target it does about a quarter of P10's
  damage per second (flagged for the balance pass, not tuned). AI escorts: an AI's Interceptors with no air target of their own fly
  with the nearest Leviathan on any stance; the old escort on Attack (Leviathans and Gunships) is kept.
- Brood Tyrant: the 30 to a building is the hit's 40 scaled by 30/40, so damage buffs apply to it as to the unit hit; a hit on a
  building splashes ground units only. A pustule belongs to the side whose glob stuck it. Any paid Repair running clears them (checked
  every tick, so the moment Repair starts). The Mites spawn around the building's edge (tSrc 'pus', the Mound's 30 s life); they
  count against neither the Mound's cap nor the temporary-unit cap, and they don't burst into acid (that is the Mound's T3).
- Worldrender: it lands when the building it is attacking is within its range (50) and settles against the building's edge during
  the 1.5 s. Coming down it is still an aircraft; from touchdown until it is airborne again (take-off included) it is a heavy ground
  target. First bite at touchdown, then every 2 s; the healing uses its own budget like P11's. It also takes off when ordered
  elsewhere (a move, Retreat, another target). Below 35% it doesn't land; it fights with its drop from the air. The AI: with units
  in reach an AI's Worldrender fights them from the air; otherwise it picks the most valuable building within 300 and lands on it.
- Voidcarrier: the bolt hits buildings too (×1.0). The AI keeps it over the middle of its six front-most ground units, 40 behind them.
- Astral Sovereign: "its shields break" is the hit that takes them from above 0 to 0; with its shields already down it charges and
  fires. The damage table is P12's (`DMG.sovereign`: buildings ×2.1). No building preference: a player's Sovereign targets as any
  unit does. The AI aims at the most expensive target in reach (by cost), at buildings in a base attack or a siege push; mid-charge it
  keeps its target (a new target restarts the charge, as for the Marksman).
- AI: own scores for all five (the Leviathan's lower until it has two Interceptors each; Interceptors scored up while it has
  Leviathans) and tastes for four (`RW4B_TASTE`; the Leviathan keeps the Last Fist personas' own). AI_TWIN is unchanged for b4b-off games.
- Art: all five are aircraft and draw live, as every aircraft does (no pose cache); the Leviathan is drawn 1.25× and the Worldrender
  1.35× the old art's size. Art is drawn the new way in b4b-off games too.

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

**Counter:** dedicated anti-air and defences (they track it through its hops, v2.87) and chaining beams. (Was: splash and
chaining anti-air; splash never hits aircraft in this engine.)

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

## Batch 5b: the Bloomhost swarm pass

**Batch 5b (broods, swarm surge, kill frenzy, Spitter volleys, Needlewing anti-air; eight Bloomhost units redrawn): done in v2.88.**
Goal: Bloomhost plays as a scary, fast, deadly swarm with a real answer to aircraft. Code: src/sim/rework-5b.js (`REWORK.b5b` →
`g.rw.b5b`; on by default; each Test Range row has its own "Batch 5b" switch), art in src/render/units-rework-5b.js. Starting values as
asked (`BROOD`, `SURGE`, `KFRENZY`, `QUILL`); no tuning. The units keep their ids and play through per-game definitions (`rwD`,
`RW5B_D`: the Skitterling, Spitter and Needlewing); UDEF is untouched, so a b5b-off game plays v2.87 exactly (the pinned fingerprints
match, seeded Test Range skirmishes hash as on v2.87's build, and a b5b-off save leaves the key out).
- **Broods (Skitterling):** one order at the Larva Pit is one queue slot, 120 credits, 6 s, and hatches 4 Skitterlings of 50 health.
- **Swarm surge (every Bloomhost ground unit):** +5% speed for every other Bloomhost ground unit of its side within 80, up to +40%.
- **Kill frenzy (every Bloomhost unit):** an enemy unit dying within 120 makes them attack 30% faster for 4 s; refreshed, not stacked.
- **Spitter:** volleys of 3 quills 0.12 s apart, 6 each, a volley every 1.2 s, range 150, air and ground, corrosion kept; 1.5× to
  aircraft, aircraft first.
- **Needlewing:** hits aircraft too, swarm bonus kept.
- **Counters (Codex, from UNIT_TIPS):** the swarm is strong in numbers and against lone units; weak to splash (Tanks, Flame Tanks,
  Worldbreaker lines, Shardstorm chains) and to walls and barriers.

Departures and choices the brief left open:
- There is no batch 5a yet: the brief's "v2.88 (or whatever version 5a ended on)" is v2.87, so b5b off plays v2.87 and this batch is v2.88.
- Broods: the 60-alive limit counts a queued brood as 4 (as the queue counted single Skitterlings before), so a brood may start while 57
  or fewer are alive or queued. At hatching only the Skitterlings alive count (the brood itself has left the queue): what fits hatches,
  each missing one refunds 30 credits (a quarter of the brood). Supply counts the brood's 2 (4 × ½) from the moment it is queued, as for
  any unit. Every Skitterling in a b5b game has 50 health (Emergency Brood's and those hatched by a Leaper's host too). The info card
  shows 120 credits for a brood of 4 (30 each) and the 6 s; the Codex table lists 30 per Skitterling. The AI orders broods two at a time.
- Swarm surge: "within 80" is the game's reach distance (depth weighted, as every weapon range); counted once a tick for each side.
  Burrowed, exiled and tunnelling units neither count nor gain it; latched Leapers don't gain it (a latched Leaper rides its host);
  charging and dazed Dreadthorns move by their own rules. Temporary units (Mites, hatchlings) count and gain it. Aircraft never.
- Kill frenzy: any enemy unit's death counts (temporary units and Mites too; buildings don't). It speeds the attack cooldown, so it
  multiplies with Frenzy Bloom; timers of their own (a landed Worldrender's bites, a Leaper's latch bites, a Cloudwing's offspring,
  leaps and charges) are unchanged.
- Spitter: "every 1.2 s" is one volley starting every 1.2 s: 0.96 s after the third quill (with the usual ±10%), so 15 damage a second
  before armour (the old acid spit was 11). Its weapon is a new 'quill' with the acid table on the ground (air 1.5 instead of 1.1).
  "Aircraft first" uses the Hydra's rule (`preferAir`), so, like the Hydra and the Interceptor, it also keeps tracking a hopping
  Wraithwing (batch 4b's Part 0 said no Bloomhost unit had either flag; now the Spitter does). A volley cut short when its target dies
  goes on at the next target.
- Needlewing: a new weapon table 'needle5' (the Needlewing's, with air 1.0). The Cloudwing itself stays ground-only; its offspring are
  Needlewings and hit aircraft too.
- AI (sides it plays): broods are scored as the swarm's backbone (higher, falling as the 60 fill), lower against splash armies; a
  Bloomhost attack waits for a bigger wave (×1.25) and moves as a pack: on the attack, its ground units more than 90 ahead of the swarm's
  median wait, Spitters 20 behind the median (they fight what is in reach); enemy aircraft (12% or more of what it knows of the enemy
  army) raise Spitters (+3 × that share) and Needlewings (+2.2 ×), and steer a Larva Pit's T2 to Acidic Evolution and a Bloomspire's to
  Swarm Bloom (the Bloomspire also when it has seen an enemy air production building at T2) unless one already has that path. AI_TWIN
  and the other scores are unchanged for b5b-off games.
- Art: the Dreadthorn has a new body (a long, low charger: heavy horns thrust forward, a lean muscular body, a spined back, a whip tail
  and powerful hind legs; nothing like the Bulwark's shell; its charge dust and daze kept). Skitterling (a small eight-legged biter with
  a glowing maw under two team carapace plates), Spitter (hunched, a swollen green acid sac, a bony quill launcher on its back that
  tilts up at aircraft), Mite (a tiny tick with a team shield plate), Thornback (a knuckle-walking brawler bristling with thorns) are
  cached as poses; Needlewing (a dart with buzzing membrane wings and a long needle tail), Cloudwing (a larger flyer with glowing brood
  pouches, which open when it releases offspring) and Razorwing (bat wings on bone fingers, bone talons that thrust forward in a dive)
  draw live, as every aircraft does. Effects: the quills (three quick green streaks), a faint streak in the side's colour behind units
  at half surge or more, a red pulse (red tinted toward each side's colour) when a unit enters a kill frenzy and a faint red glint while
  it lasts. The art is drawn the new way in b5b-off games too.

## Batch 5a: Last Fist art and the Marine rename

**Batch 5a (all 13 Last Fist units redrawn, the Rifleman renamed Marine, three oversized flyers resized, aircraft poses cached): done
in v2.89.** Art and text only: nothing in the SIM changes, so there is no switch block. Every pinned fingerprint (the old sets and
FP_V288G*) matches; self-play (audit/sim/selfplay-5a.js: Hard vs Hard, all six pairings on Classic, Two-Lane and Three-Lane, seed 7)
on this build and on v2.88's gives 18 identical matches, 0 errors, at 4,918 state hashes taken every 100 ticks. Art in src/render/units-rework-5a.js.
- **Marine:** the Rifleman's player-facing name everywhere (unit and train cards, info card, Codex, UNIT_TIPS, counters, Barracks tier
  and Mass Deployment texts, the queue toast, Test Range labels, the tutorial, which reads the name live). The internal id stays
  `rifle`, so saves, tests and fingerprints don't move. Its desc reads "powered-armor trooper with a gauss rifle"; the Medevac's
  "thruster medevac craft" (no helicopters).
- **Art direction (Last Fist):** a future frontier army, replacing "scavenged military" for this faction. Infantry in powered armour
  (angular plates, glowing visor slits in the side's colour, a big team pauldron, backpack power units, gauss rifles with glowing coil
  rings); vehicles and walkers in gunmetal with the team colour on their largest panels (track skirts, turret tops, carapaces), exposed
  pistons, sensor masts, stencilled serials, hazard stripes, scorch marks, chipped edges and patched plates; aircraft driven by
  thrusters (tapered pale-blue jets, nacelles, hard-edged hulls; no rotors anywhere).
- **The 13 units:** Marine (compact, pauldron and backpack), Heavy (a broad exosuit, a shoulder rocket rack over a sunk helm), Sniper
  (lean, a stealth cape, one big round optic, a very long four-coil rail), Tank (team track skirts, an angular turret, a long gauss
  cannon), Artillery (a tracked gauss howitzer, its piston stabilisers and deploy poses kept), Titan (batch 2b's strider legs and plant
  poses under a new angular hull with a visor-slit head, a sensor mast, a shoulder missile pod and a coil cannon), Flame Tank (a low
  crawler on six road wheels on piston arms, two glowing fuel tanks, a flared projector), Hydra (a four-legged spider walker, twin
  rotary gauss cannons that tilt up at aircraft), Gunship (a VTOL with two vectored nacelles and pod-mounted missiles), Interceptor (a
  forward-swept dart, twin afterburners), Leviathan (a flying fortress: a thick plated hull, four thruster pods, dorsal and ventral
  turret blisters, a bomb bay whose doors swing open on a run), Medevac (a pale medevac hull, a big green cross, lift thrusters and
  a glowing heal emitter where its beams start), Recon Drone (a small sensor wedge on two ion pods).
- **Effects lined up:** every barrel, rack, pod, bay and emitter sits on the SIM's own MUZ point (unchanged), so tracers, rockets,
  rail rounds, shells, flames, missiles (Gunship salvos), Hydra fire, Leviathan bombs, the Medevac's heal beams and the Sniper's
  charge glow start at the new art. The Sniper's pin and the Marksman's mark are drawn over the target and are unchanged.
- **Size fix:** the Leviathan, Worldrender and Sovereign were 103, 125 and 95 art units across against an air shadow 77 across; each is
  now about 85 (Leviathan 83, Worldrender 88, Sovereign 84), each scaled about the point its shots leave, so bombs, the maw and the beam
  start where the SIM fires them. Hit radius and every SIM value unchanged.
- **Aircraft pose cache:** aircraft are cut into the poses of their animation cycle and drawn once per pose, side and colours into
  the sprite cache (`AIR_CYC`, `AIR_BOX`, `airPose`), like ground units. The cache key carries the draw function and the colours
  (`sprArtKey`, ground units too), so changing either draws fresh poses; a zoom change clears it as before.
  Air scene (47 aircraft): render() median 2.0 → 1.0 ms, frame interval 95th percentile 33.3 → 16.8 ms
  (audit/logs-p1/rework5a-v289/perf.txt).

Departures and choices the brief left open:
- **Leviathan resize:** the Leviathan's art was redrawn in this batch, so its "before" is the new art at batch 4b's 1.25× and its
  "after" at 1×; the Worldrender and Sovereign keep batch 4b's art, scaled to 0.7 and 0.88 of their old drawn size.
- **Cached and live aircraft:** only aircraft whose whole animation shares one cycle are cached (every Last Fist aircraft, Razorwing,
  Needlewing, Brood Tyrant, Wraithwing, Prismwing, Shardstorm), so a loop never jumps. The Cloudwing, Worldrender, Voidcarrier and
  Sovereign mix slow motions with no common cycle and still draw live, as does any aircraft mid-recoil, a landing Worldrender and a
  charging Sovereign. The Leviathan's open bay is its own pose.
- **Dead code kept:** the old draw functions (dRifle and the rest in buildings-axiarchs-units.js, dTitan2, dArt2, dSniper4, dGun4,
  dLev4) stay in the source, unused, as earlier batches left theirs.
- **Historical text:** dated audit reports and logs (audit/*.md reports, audit/logs*) keep "Rifleman" as they were written; the living
  docs, README, KNOWN_ISSUES, CLAUDE.md, tests and the audit scripts say Marine.

## Batch 5c: Axiarch art, the Needlewing AI fix, the Medevac rename

**Batch 5c (the last five Axiarch units redrawn, the Bloomspire AI fix behind `REWORK.b5c`, the Medicopter renamed Medevac): done in
v2.90.** Art in src/render/units-rework-5c.js; the AI fix in src/sim/rework-5c.js (`REWORK.b5c` → `g.rw.b5c`, on by default; each Test
Range row has a "Batch 5c" switch). Art and text need no switch. With `b5c` off the game plays exactly as v2.89: every pinned fingerprint
(the old sets and FP_V288G*) matches, and self-play (audit/sim/selfplay-5c.js `--identity`: Hard vs Hard, all six pairings on Classic,
Two-Lane and Three-Lane, seed 7) on this build with the switch off and on v2.89's index.html gives 18 identical matches at 4,918 state
hashes, 0 errors. With every batch on: FP_V290, FP_V290_BA, LF_BH_V290. No balance change: no unit stat, no batch 5b value, nothing of
another faction.
- **Axiarch art:** the Lancer, Gravemantle, Eventide, Prismwing and Shardstorm are redrawn in the reworked Axiarch language (the
  Shardling, Bastion, Riftstalker, Parallax, Marksman, Severance, Worldbreaker, Wraithwing, Voidcarrier and Sovereign): floating obsidian
  slabs with dark outlines, big team-stone slabs lit from above, nothing touching (thin lines of light), glowing rhombus cores, visor
  slits, rings and crowns. Lancer: a slim shard knight with a light banner streaming from its back and a long lance with three focus rings
  and a crystal tip. Gravemantle: a hunched walker under a mantle of two great team slabs, a low cowl with a visor, three stones orbiting
  it, a violet gravity orb on a projector arm, a dashed gravity well on the ground. Eventide: a heavy hull on four slab legs carrying an
  upright gate ring of eight segments (team stone on the upper ones) around a singularity, a crown of three shards, a forward prong with
  its orb. Prismwing: a faceted team-stone dart with an obsidian keel, team-glass fins that beat, a link node and a floating tail shard.
  Shardstorm: an obsidian crystal core with a team facet inside a turning ring of five shards (team on the near side), an emitter spike
  forward. Every shot still leaves the SIM's MUZ point (unchanged); the art is built around it (the lance tip, the two gravity orbs, the
  Prismwing's lens, the Shardstorm's spike).
- **AI fix (b5c on):** a Normal or Hard Bloomhost AI's first Bloomspire T2 path is one roll from the match's seeded stream, kept for the
  match (`aiBloomRoll5c`, `side.pRoll.techlab`): Swarm Bloom `AI5C.lean` (75%) of the time when enemy air is expected, the persona's
  split otherwise (its path `PATHROLL.keep`, 60%, the other 40%). Enemy air is expected (`aiAirExpected5c`) when batch 5b's own signal for
  the Bloomspire says so (`aiAirSignal5b`, factored out of `aiPath5b` unchanged: aircraft it knows of, or an enemy air production building
  seen at T2), when it has seen an enemy aircraft at any time this match (`side.air5c`, noted at each AI decision by `aiNote5c`), when it
  has seen any enemy air production building, or when the enemy is Last Fist.
- **Medevac:** the Medicopter's player-facing name everywhere (unit and train cards, info card, Codex, the Support path's step, UNIT_TIPS,
  Test Range labels); plural Medevacs. The internal id stays `medic`. Its desc reads "Unarmed thruster craft that heals nearby infantry…"
  (was "thruster medevac craft").

Departures and choices the brief left open:
- **The 60/40 split was already there:** batch 4a's roll (`aiPathRoll`) already covered the Bloomspire, but batch 5b's rule then forced
  Swarm Bloom whenever aircraft were known, and before any were known the personas mostly roll Apex Bloom (three of the five personas
  have the Last Fist Air Power taste, which maps to Apex Bloom). With b5c on, the Bloomspire's first pick is one roll that replaces both, so
  the persona's 60/40 applies when no air is expected and 75% Swarm Bloom when it is (even when aircraft are already known, where 5b
  always took Swarm Bloom: Apex Bloom stays possible, as asked). Batch 5b's Larva Pit rule (Acidic Evolution for Spitters), its scores
  and the second-copy rule (a second Bloomspire takes the path the first lacks) are unchanged. Easy keeps its persona's taste.
- **"Air production building or air tech":** every faction's third production building (Tech Lab, Bloomspire, Celestial Array) builds
  aircraft from T1, so any enemy one seen, at any tier, counts; its T2 path is its air tech, so that is covered too. Seen means seen through
  the fog (a remembered building), never read from the enemy's state; the enemy's faction is known from the start, as for a player.
- **Needlewings at aircraft need the Bloomspire at T2 and an enemy that flies:** the brief changes only the pick. Across seeds 7-10
  (48 matches with Bloomhost), 14 never took a Bloomspire to T2, and some Swarm Bloom matches met no aircraft; strikes on aircraft
  came in 11 matches. Nothing else in the AI was changed for this.
- **Aircraft cache:** the Prismwing and Shardstorm were already in batch 5a's `AIR_CYC` (Prismwing 9, 8 poses; Shardstorm 2.2, 24 poses);
  the new art keeps those cycles (the fins beat on sin(9t), the ring turns at 2.2t with five-fold symmetry), so both stay cached. The
  Prismwing's box grew to fit its tail shard; the Lancer, Gravemantle and Eventide got new sprite boxes; every pose fits its box
  (tests/browser.test.js). Health bars and shadows follow the new heights (`UVIS`: Lancer 38, Gravemantle 34, Eventide 58).
- **Old draw functions kept:** dLancer, dGravemantle, dEventide, dPrism and dShardstorm stay in the source, unused, as earlier batches
  left theirs.
- **Historical text:** dated audit reports and logs (audit/*.md reports, audit/logs7*) keep "Medicopter" as written; the living docs,
  README, KNOWN_ISSUES, tests and the game say Medevac.

## Unchanged (already distinct)

Marine, Heavy, Tank, Flame Tank, Hydra, Interceptor, Medevac, Recon Drone, Mite, Razorwing, Cloudwing, Thornback, Lancer,
Gravemantle, Eventide, Prismwing, Shardstorm. (Every one of them is now drawn in the new style: Last Fist in batch 5a, the Bloomhost ones
in 5b, the Axiarch five in 5c; their mechanics are unchanged.) (The Skitterling, Spitter and Needlewing changed in batch 5b, the swarm pass; the Mite,
Razorwing, Cloudwing and Thornback kept their mechanics there but were redrawn, and gained swarm surge and kill frenzy.)

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

- **Last Fist:** a future frontier army (since batch 5a, v2.89; was "scavenged military"). Powered-armour infantry (angular plates,
  glowing visor slits, pauldrons, backpack power units, gauss rifles with coil rings), heavy angular vehicles and walkers in gunmetal
  (exposed pistons, sensor masts, stencils, hazard stripes, scorched and patched plates), thruster aircraft (no rotors). No camo,
  modern helmets, helicopters or present-day vehicles.
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
2. Artillery and siege: Artillery, Gorebore, Severance (2a, done v2.82), Titan, Ruinmaw, Worldbreaker (2b, done v2.83).
3. Divers and melee: Leaper, Riftstalker, Parallax, Ravager (3a, done v2.84), Dreadthorn, Bastion, Shardling, Bulwark (3b, done
   v2.85).
4. Ranged and air: Sniper, Astral Marksman, Bilecaster, Gunship, Wraithwing (4a, done v2.86), Leviathan, Brood Tyrant, Worldrender,
   Voidcarrier, Astral Sovereign (4b, done v2.87). Every reworked unit is in.
5. The Bloomhost swarm pass (5b, done v2.88): broods, swarm surge, kill frenzy, Spitter volleys, Needlewing anti-air; eight Bloomhost
   units redrawn.
   Last Fist art and the Marine rename (5a, done v2.89, after 5b): all 13 Last Fist units redrawn, the Rifleman renamed Marine, the
   Leviathan, Worldrender and Sovereign resized, aircraft poses cached.
   Axiarch art, the Needlewing AI fix, the Medevac rename (5c, done v2.90): the last five Axiarch units redrawn, the Bloomspire's roll
   behind `REWORK.b5c`.
6. Art batch: unchanged units and buildings in the new style.

Then: the paused balance pass, with all three factions reworked.
