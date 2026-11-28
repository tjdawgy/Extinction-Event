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

## Batch 5d: every building redrawn

**Batch 5d (every building of all three factions redrawn with strong team colour; damage stages; the building cache keyed by art,
colours and damage stage): done in v2.91.** Art and docs only: nothing in the SIM changes, so there is no switch block. Every pinned
fingerprint (the old sets, FP_V288G* and FP_V290*) matches; self-play (audit/sim/selfplay-5d.js: Hard vs Hard, all six pairings on
Classic, Two-Lane and Three-Lane, seed 7) on this build and on v2.90's index.html is identical, run once with `b5c` off and once with it
on (figures in KNOWN_ISSUES.md). Art in src/render/buildings-rework-5d.js, loaded after the unit art; it replaces the entries of
BART, BART_BH and BART_AX, so every place that draws a building (the field, card icons, the Codex, the Test Range) draws the new art.

**Inventory** (footprint = BDEF `half`, the pad's half-width in art units; `h` = the drawn height the SIM aims at and the health
bar sits over; guns turn about the SIM's `muzzle()` point; all unchanged):

| Faction | Building (role) | Job | half / h | Gun (muzzle) | Visual states |
|---|---|---|---|---|---|
| Last Fist | Command HQ (hq) | HQ, defence | 44 / 104 | gauss cannon, pt(4, −4, 79) | construction, T1-T3, damage, gun turns |
| | Refinery | economy | 32 / 62 | | construction, T1-T3, damage, ore belt and flare (live) |
| | Reactor | economy (energy) | 30 / 60 | | construction, T1-T3, damage, plasma window (live) |
| | Habitat | supply | 32 / 40 | | construction, T1-T3 (2-4 modules), damage, lit windows |
| | Barracks | production | 32 / 56 | | construction, T1-T3, path badge, damage, blast door opens while training |
| | War Factory (factory) | production | 36 / 50 | | construction, T1-T3, path badge, damage, door rolls up while building |
| | Tech Lab (techlab) | production (air) | 30 / 96 | | construction, T1-T3, path badge, damage, pad lights and thruster wash while building |
| | Turret | defence | 26 / 46 | gauss gun, pt(0, 0, 38) | construction, T1-T3 (1, 2, 4 barrels), damage, gun turns |
| | Salvage Yard (sigA) | signature | 32 / 46 | (T3 roof gun, decorative) | construction, T1-T3, damage, crane, Overdrive furnace |
| | Fortification Depot (sigB) | signature | 32 / 48 | (T3 anti-air gun, decorative) | construction, T1-T3, damage, radar, med light |
| | Node Bunker (bunker) | defence (on nodes) | 14 / 26 | gauss gun, pt(0, 0, 20) | T1-T3 (Depot's tier), damage, heal light, gun turns |
| Bloomhost | Hive (hq) | HQ, defence | 44 / 56 | spine launcher, pt(0, 0, 83) | construction, T1-T3, damage, beating mouth |
| | Goremound (refinery) | economy | 32 / 30 | | construction, T1-T3, damage, spores (live) |
| | Pulse Organ (reactor) | economy (energy) | 30 / 24 | | construction, T1-T3, damage, beating heart (live) |
| | Hatchery (habitat) | supply | 32 / 6 | | construction, T1-T3 (3-5 eggs), damage, glowing eggs |
| | Larva Pit (barracks) | production | 32 / 12 | | construction, T1-T3, path badge, damage, mandibles open while spawning |
| | Evolution Chamber (factory) | production | 36 / 16 | | construction, T1-T3, path badge, damage, seam gapes while growing |
| | Bloomspire (techlab) | production (air) | 30 / 52 | | construction, T1-T3, path badge, damage, hatching mouth opens while growing |
| | Maw (turret) | defence | 26 / 18 | jaws, pt(0, 0, 30) (SIM point 38: see departures) | construction, T1-T3, damage, jaws turn and gape |
| | Brood Mound (sigA) | signature | 32 / 22 | | construction, T1-T3, damage, eggs brighten toward the next clutch |
| | Rootheart (sigB) | signature | 32 / 30 | | construction, T1-T3, damage, beating heart |
| Axiarchs | Axis (hq) | HQ, defence | 44 / 70 | lance, pt(0, 0, 83) | construction, T1-T3 (obelisks, crown), damage, rings and lance |
| | Matter Loom (refinery) | economy | 32 / 40 | | construction, T1-T3, damage, turning cube |
| | Singularity Well (reactor) | economy (energy) | 30 / 46 | | construction, T1-T3 (5-7 shards), damage, pulsing sphere |
| | Continuum Spire (habitat) | supply | 32 / 30 | | construction, T1-T3 (1-3 towers), damage, cores |
| | Genesis Gate (barracks) | production | 32 / 44 | | construction, T1-T3, path badge, damage, portal flares while forming |
| | Architectum (factory) | production | 36 / 40 | | construction, T1-T3, path badge, damage, hovering slab lowers and a light column while forming |
| | Celestial Array (techlab) | production (air) | 30 / 70 | | construction, T1-T3, path badge, damage, rings, core swells while forming |
| | Null Lance (turret) | defence | 26 / 40 | prism, pt(0, 0, 38) | construction, T1-T3 (orbiting shards, ring), damage, prism turns |
| | Phase Beacon (sigA) | signature | 32 / 50 | | construction, T1-T3, damage, lens dark while collapsed |
| | Echo Reliquary (sigB) | signature | 32 / 46 | | construction, T1-T3, damage, a mote per stored echo |

No faction has walls, barriers or creep structures that are buildings: the Bastion's barrier, Worldbreaker ridges, tunnels and creep are
unit effects or ground, drawn elsewhere and unchanged. Paths do not change a body (unchanged): the path badge (`drawPathMark`) shows the
path, as before.

- **Last Fist:** a future frontier army base. Every building is a prefab armoured module whose walls are the team colour (T.face), under
  gunmetal angular caps and foundations; blast doors in hazard frames, glowing visor-slit windows, stencils, chipped edges, landing pads
  with thruster scorch (Tech Lab, HQ T2+), sensor masts, floodlights with beams, gauss guns with glowing coil rings (HQ, Turret, bunker,
  the Yard's and Depot's T3 guns), prefab barrier blocks (no sandbags anywhere now). Roles: HQ a fortress under a command tower;
  Barracks a troop module with a door that rolls up while it trains; War Factory a hangar with a great door and a gantry; Tech Lab a
  hangar and control tower with a landing pad; Refinery team silos and a flare stack; Reactor a team containment tower in cooling fins;
  Habitat stacked living modules with rows of lit windows; Turret an armoured octagon under a gauss gun.
- **Bloomhost:** living structures grown out of the creep. Flesh mounds under team-coloured carapace (lit from above, plate seams with a
  lit lip), bone spines, sacs with a team glow, team veins running into the creep bed, orifices and mandibles. Producing buildings open:
  the Larva Pit's mandibles splay and larvae wriggle up, the Evolution Chamber's seam gapes, the Bloomspire's hatching mouth opens.
- **Axiarchs:** floating obsidian and team-stone slabs that never touch, held by lines of light; rhombus cores, turning rings, a crown on
  the Axis at T3, a gate (the Genesis Gate), a hovering forge slab (the Architectum), shard rings (the Singularity Well).
- **Team colour:** each faction's largest surfaces are the team colour (Last Fist module walls, Bloomhost carapace, Axiarch team stone),
  so a zoomed-out base reads blue or red at once (docs/screenshots/rework5d-match).
- **Damage (new for every building):** from health only (`dmgStage`: 0 above 66%, 1 above 33%, 2 at or below), drawn on the faces of
  each building's main mass (`DMG5_AT`, building-local points) into the cached body: Last Fist scorch and cracks, at stage 2 torn holes
  glowing from inside and bent plates, plus a live flame; Bloomhost bruised, wilting patches with ooze, at stage 2 weeping wounds and a
  live drip; Axiarch cracked stone and chipped corners, at stage 2 broken seams and a crack whose light flickers. The SIM's smoke under
  50% health is unchanged.
- **Building cache:** bodies were already cached per type, tier and team (BCACHE, v2.7). The key now also carries the faction, the
  damage stage and the art and colours drawn (`bKey`, `bArtKey`: which draw function, `T.main`, `T.hull`, `T.light`, `T.glow`), so a
  change to any of them draws a fresh body; a zoom step clears it, as before; `BCACHE.on` false draws every body live (used by the
  pixel check). Construction shows the cached T1 body revealed by a clip under the faction's scaffold, as before (no extra key needed).
  Live parts on top: guns, doors, pulses, rings, lights.

Departures and choices the brief left open:
- **The Maw's jaws turn 8 below the SIM's turret muzzle** (pt(0, 0, 30); the SIM fires from 38): the Maw's health bar sits 44 above
  its foot (its BDEF h is 18, which the SIM aims at and can't change), and jaws turning about 38 would cross it. Every other gun (the
  three HQs, the Turret, the Null Lance, the node bunker) now turns exactly about its SIM muzzle point (before this batch the Last Fist
  HQ's gun sat 2-14 off it by tier, the Hive's and the Axis's 3-9, the Null Lance's 2-8); tests/rework-5d.test.js checks the pivots.
- **No damage while under construction or for a ghost:** a building being built has low health by design, so it shows its scaffold, not
  damage; a remembered ghost has no known health and shows none.
- **Path changes stay on the badge:** no body changes with the path (none did before); the path badge is unchanged.
- **The node bunker is not in the Test Range gallery:** the Test Range places only pad buildings; the bunker is in the art gallery test
  and appears on held nodes in matches.
- **Old draw functions kept:** the v2.7-v2.34 building functions stay in the source, unused, as earlier batches left theirs.

## Batch 6b: the side-bias fix, then Artillery counterplay

**Batch 6b (v2.92): two switches, done in order.** `REWORK.b6side` (Part A, a bug fix: no unit, cost, AI strategy or balance
value changed) and `REWORK.b6art` (Part B, the Artillery). Both are stored per game in `g.rw`, on by default, saved only when on
(a save with both off is a v2.91 save), with Test Range switches (Setup → Rework switches: "Batch 6b side", "Batch 6b Artillery").
Code: src/sim/rework-6b.js. With both off the game is v2.91 exactly: every pinned fingerprint matches (the old sets, FP_V288G*,
FP_V290*), and the Test Range hashes 5c pinned with b5c off run with both new switches off too. Recorded: FP_V292 (b6side on, b6art
off) and FP_V292A (both on), tests/determinism.test.js. Tests: tests/rework-6b.test.js.

### Part A: why side 1 won 55 to 26 (diagnosis)

Scripts: audit/sim/mirror6b.js (Test Range mirror fights: identical armies in exactly mirrored positions, no AI or the AI's unit
rules (`--ai`), run with side 0 on the left and on the right, and with either side placed first; ablations that remove one
candidate at a time) and audit/sim/sidebias6b.js (Hard vs Hard matches with one candidate removed by a patch to the SIM source).
Logs: audit/logs-p1/side6b/. Each cause, its evidence, and how much it explains:

1. **Entity order decided mirror fights.** `update()` ran every unit and building in the order of `g.ents`, and damage lands at once,
   so the entity listed first moved, aimed and struck first every tick and the other side always answered what had already happened;
   target ties went to the earlier entry too. In 24-seed mirrors the side placed first won Marines 88-8, Skitterlings 96-0, Leapers
   96-0, Riftstalkers 96-0, Spitters 94-2 (runs: 4 per seed), and lost Shardlings 24-72 (the parry rewards striking second). Side
   number and left/right made no difference at all (the paired cells mirror exactly), so this is the Test Range's "0-5 one way":
   the harness placed side A first in both orientations. Ablations: shuffling the update order each tick evened Skitterlings,
   Bulwarks and Riftstalkers; holding all damage to the end of the loop (simultaneous damage) changed nothing, so the cause is the
   order, not immediate damage. Shuffling only the update order left Leapers at 2:1 for the side placed second; shuffling the list
   itself fixed that (positions in the list, not ids). In matches the list interleaves by creation time, so this is noise for
   either side there rather than a lean, but it decided every Test Range comparison.
2. **AI order and start.** Side 1's AI always decided first within a tick, and side 0's first decision came at 1 s, side 1's at
   1.5 s (`aiT: 1 + s * 0.5`): side 0 started every match half a second ahead. On v2.91, Two-Lane mirror matches with seeds 1-4 went
   9-1 to side 0 (sidebias-v291-twolane-mirrors.jsonl), including matches where both sides rolled the same personality.
3. **AI dice from the shared stream, in side order.** Both AIs drew their personality and opening from the match's one stream, side 1
   first. Over 5,000 seeds the draws are unbiased (the Turtle about 25% for Last Fist and Bloomhost and 33% for the Axiarchs on either side, as their kinds lists say), but the paired design of the 6a
   audit plays each pairing both ways *with the same seed*, so the slot decided the dice: with seeds 7-11 side 1 never rolled the
   Turtle and side 0 rolled it 30 times (the Turtle won 4 of those 30). That alone accounts for most of the 55-26: matches with no
   Turtle went 22-31 (side 1 58% of decided), the rest 4-24. Seeds 1-4 leaned the other way (cause 2). Both are seed luck routed
   through the slot, which is the bug.
4. **Spacing (direct control).** `ctlFree`, the search for a free spot when a directly controlled unit steps apart, walked its rings
   from the same angle for both sides, so both drifted east: toward the enemy for the west side, away for the east. With causes 1-3
   fixed, Marine mirrors were then won by the army on the right 17-7 in every orientation. Affects the player's side and the Test
   Range only (the AI is never under direct control).
5. **Ruled out:** map geometry (Classic, Two-Lane and Three-Lane are exact mirrors across x, pads, nodes, lanes, walls, forward pads
   and relics, index by index; the fog and navigation grids mirror cell for cell), range and distance checks (all symmetric:
   `effDist`, the targeting index's inclusive bounds), projectile flight and hits, income, the storm and `resolveEnd`. Two AI
   tie-breaks prefer lane or node index 0 for both sides (the north lane, the west relic), which is the same physical spot for both,
   not a side preference.

### Part A: the fix (b6side)

- **The entity list in a fresh seeded random order each tick** (`side6Order`, drawn from the game's own order stream `g.os`): the
  update loop and every other pass over the list that tick (target lists and their ties, kills, splash, the AI's reads) see it, so
  neither side and no list position goes first or wins a tie more often. The UI reads units by id where order showed (control
  groups `groupUnits`, `myUnits`, overlapping-building taps), as the list was in id order before.
- **Both AIs start at 1 s, and a seeded coin decides which decides first each tick** (`side6Ai`).
- **Each AI rolls from its own stream** (`g.ar[s]`, `RNG.ai`), seeded from the match seed and the side's *faction*, never its slot
  (`side6Seed`): a faction's AI gets the same dice whichever side it plays, and the AIs' rolls no longer depend on each other's or the
  fight's. In a mirror match both AIs roll the same dice (the fairest mirror; a player only ever faces one AI).
- **Spacing mirrored per side** (`ctlFree`'s `dir`).
- No handicaps or compensating bonuses. Departure: the Test Range "0-5" lean turned out to be placement order, which the harness also
  reproduces; `audit6a-range.js --oneway` now runs one orientation (10 seeds instead of 5 × both).

### Part A: results (b6side on, b6art off)

- Test Range mirrors, 24 seeds, side placed first vs second (v2.91 → b6side): Marines 88-8 → 56-40, Skitterlings 96-0 → 48-48,
  Spitters 94-2 → 48-48, Bulwarks 68-28 → 40-56, Shardlings 24-72 → 68-28, Leapers 96-0 → 68-28, Riftstalkers 96-0 → 64-32, Lancers
  36-60 → 52-40, mixed Last Fist 24-72 → 48-48; left/right even in every scenario. The three that stayed lopsided were checked on 48
  more seeds: Shardlings 22-26, Leapers 26-22, Riftstalkers 27-21 (noise; with b6side the paired runs mirror exactly, so a seed's
  spawn rolls count twice). AI-mode mirrors (both sides played as the AI plays) even too (mixed Axiarchs 27-21, mixed Bloomhost
  24-24 / 25-23 on seeds 25-72).
- Self-play, audit6a.js (90 Hard vs Hard, seeds 7-11, b6art off; audit/logs-p1/audit6b-side/): side 0 41, side 1 39, 10 draws
  (v2.91: 26-55-9); side 1 49% of decided; Classic 14-14, Two-Lane 11-14 (56%), Three-Lane 16-11 (41%); 0 errors.
- Faction rates moved, but by the dice, not the mechanics: with the dice keyed by faction, each faction's personality at a seed is the
  same in all its matches, and seeds 7-11 gave Last Fist the Boomer in 4 of 5 (never the Economist, which lost to Bloomhost at seeds 10
  and 11 on v2.91) and the Axiarchs and Bloomhost the Turtle in 2 of 5. Last Fist 40-12-8 (67%), Bloomhost 23-30-7, Axiarchs
  17-38-5; per personality Last Fist Boomer 32 of 48, Bloomhost Boomer 16 of 36, Axiarch Boomer 10 of 36. Faction rates from five
  seeds now rest on five personality draws per faction; more seeds are needed before reading them as balance.

### Part B: Artillery counterplay (b6art)

The owner's playtest: Artillery is still too strong, and Bloomhost and Axiarchs have nothing with its range. The design intent: it
stays Last Fist's only true long-range unit and its best backline unit; the answer is getting close (Bloomhost speed, tunnels and
Leapers; Axiarch blinks), not long-range units for the others and not auto-dodging.

**Values before (v2.91, the runtime UDEF with the redesign and balance layers):** cost 175 credits + 60 energy (235); 150 HP; range
440; **minimum range 110 already** (a quarter of its reach; enemies inside it can't be shot, and it holds still); deploy 2 s, pack
1.5 s, packs after 2 s with nothing in reach (`ART`); a salvo of 3 shells every 3.2 s (± 10%), **60 damage per salvo (20 a shell)**,
the shells spread 30 around the aim point, 0.12 s apart; splash radius 40, full damage at the centre falling to half at the edge;
flight 0.7 s + distance / 520 (1.55 s at full range), at least 1.6 s with the telegraph, each shell's spot marked from firing to
impact. The Bastion's barrier does not stop its shells (arcing shells, bombs, ground attacks and melee pass; batch 3b); unchanged.

**Changes (behind b6art; per-game definition `RW6A_D`, read through `rwD`; UDEF untouched):**
- Shell damage **60 → 45 per salvo** (15 a shell). Reload, range, minimum range, splash radius and falloff unchanged.
- An AI's divers take a **deployed** enemy Artillery (deploying or deployed) within their reach first (`art6Pick`): Leapers (the
  leap and the aim; v2.91 took the heaviest host, so a Tank before an Artillery), Riftstalkers (the strike and the aim; they
  already took the longest-range unit, so this mainly adds the aim), Gorebores (what they burrow toward; they already ranked
  minimum-range units first) and Dreadthorns (the charge, given the AI's supply rule). A player's units go where they are sent.
- The minimum range was there already and is kept (the targets didn't call for more).

**Measurements (audit/sim/art6b.js, logs in audit/logs-p1/art6b/):** equal cost, Last Fist holding (its Artillery set up), the
other side advancing from beyond its reach, both played the way the AI plays them, 10 seeds × both orientations (20 runs). Armies in
the proportions the Hard AI spends on ground units in the 6a self-play, about 4,750 each, plus an Artillery-heavy Last Fist line (six
Artillery behind Marines, Heavies and Tanks: the playtest's case).

| fight (Last Fist W-L, 20 runs) | b6art off | b6art on (45) |
|---|---|---|
| typical Last Fist vs typical Bloomhost | 0-20 | 0-20 |
| typical Last Fist vs typical Axiarchs | 10-10 | 6-14 |
| Artillery-heavy Last Fist vs Bloomhost | 0-20 | 0-20 |
| Artillery-heavy Last Fist vs Axiarchs | 20-0 | 14-6 |
| Artillery damage per 100 spent, all four | 436 | 382 |

The sweep that chose 45 (same fights; Last Fist win % typical vs Bloomhost / typical vs Axiarchs / heavy vs Bloomhost / heavy vs
Axiarchs; Artillery damage per 100 spent): off 0/70/0/100, 442 (before the last Part A refinement); 50: 0/30/0/85, 398; 45:
0/30/0/70, 382; 40: 0/15/0/50, 355; 60 with a 4.0 s reload: 0/35/0/80, 401; 40 with 4.8 s: 0/0/0/5, 254.

Diver strikes (four Artillery set up behind a Tank and two Marines, 1,395, holding; equal-cost divers advancing; 20 runs):

| divers | b6art off | b6art on |
|---|---|---|
| 14 Leapers (1,400) | line 0-20, every Artillery dead by 18.4 s, divers keep 595 | 0-20, 17.7 s, divers keep 945 |
| 6 Gorebores (1,380) | 0-20, 19.9 s, 1,380 | 0-20, 19.9 s, 1,380 (they already went for it) |
| 7 Riftstalkers (1,330) | line 8-12, Artillery all dead by 58.9 s, divers keep 399 | 6-14, 39.9 s, 523 |

Self-play with both switches on (audit6a.js, 90 Hard vs Hard, seeds 7-11, audit/logs-p1/audit6b-art/): 0 errors; side 0 40, side 1 42,
8 draws (51%); Classic 15-14, Two-Lane 11-13, Three-Lane 14-15; Last Fist 40-14-6 (67%), Bloomhost 25-29-6 (42%), Axiarchs 17-39-4
(28%); Artillery 433 trained in 45 of 60 Last Fist sides (b6side alone: 443 in 45; v2.91: 279 in 29), **383 damage and 75 killed value
per 100 spent** (b6side alone 453 / 116; v2.91 492 / 112): third in Last Fist after the Hydra (446) and the Sniper (440), ahead of everything in the other factions (Ruinmaw 303, Worldbreaker 314, Spitter 259, Lancer 242).

**Targets, and why two are not met:**
- *Efficiency about 300:* 382 in the Test Range (436 before), 383 in self-play. Getting to 300 needs about 33 a salvo, and at 40
  Last Fist already loses its typical army fight against the Axiarchs 3-17. The equal-cost target came first.
- *Neither side above about 65% at equal cost:* against the Axiarchs, 70% / 70% the two ways (typical: Axiarchs 14-6; heavy: Last Fist
  14-6), the closest any single value came; 50 left the heavy line at 85%, 40 the typical army at 15%. Against Bloomhost Last Fist
  loses 0-20 with b6art off and on, both mixes: Spitters (range 165, outranging Marines 120 and Heavies 130), Bulwarks and Gorebores win
  it, and Artillery mostly kills Skitterlings before they arrive. Weakening Artillery can't bring that fight to 65%, and no other unit
  was to be tuned (the Spitter is ranked 3 in docs/BALANCE_AUDIT.md "After batch 6b").
- *Divers:* the line still loses every Leaper and Gorebore strike (telegraphed shells land where a fast diver was); with b6art the
  Leapers lose a third less of their value and the Riftstalkers kill the Artillery 19 s sooner.

**Departures:** the minimum range was not added (it existed at a quarter of the range); the splash falloff was kept (the swarm fight
fails in Bloomhost's favour, not Last Fist's); Dreadthorns were added to the diver list (a charge is a dive); Ruinmaws were not (they
open a tunnel for the army, they don't strike).

## Batch 6c: faction measurement, the HQ shield rule, first unit tuning, start side and team colours

**Batch 6c (v2.93): three parts, in order.** Part A measured (no game change), Part B added two switches, `REWORK.b6hq` (the HQ
shield rule) and `REWORK.b6c` (unit tuning), both in src/sim/rework-6c.js, per game in `g.rw`, on by default, saved only when on,
with Test Range switches ("Batch 6c HQ shield", "Batch 6c tuning"). With both off the game is v2.92 exactly: every pinned set
matches under its own switches (the old sets, FP_V288G* … FP_V292A; the pinned replays now set b6hq and b6c off), and two modern
matches (Hard vs Hard, every rule of today) hash as on v2.92's build (FP_V292M). Recorded: FP_V293H (b6hq on, b6c off) and FP_V293
(both on), tests/determinism.test.js. Part C (start side, team colours) changes no match: the same six Hard vs Hard matches on
every map are identical to the Part B build at every one of 4,426 checkpoints (audit/sim/identity6c.js,
audit/logs-p1/identity6c/). Tests: tests/rework-6c.test.js, tests/start-side-6c.test.js, tests/switches-on-6c.test.js,
tests/slow/switches-on-6c.test.js.

### Part A: measurement

- **Persona-balanced self-play** (audit/sim/selfplay-6c.js; personalities set from the harness through newGame's `autoPersona` and
  `persona`, no game code): each faction plays Boomer, Economist and Turtle equally often against each personality of the other,
  on each map, against each opponent, from both sides: 162 Hard vs Hard matches, 0 errors. Faction win rates (95% Wilson
  intervals): Last Fist 60% (51-69), Bloomhost 44% (35-54), Axiarchs 32% (24-42). Per personality: Boomer 71%, Economist 36%,
  Turtle 30%. Tables in docs/BALANCE_AUDIT.md section 10 and audit/logs-p1/selfplay6c-a1/.
- **Artillery hit rate (R7, 70% → 51% with b6side):** the mirrored spacing (`ctlFree` dir), not the shuffle: R7's moving targets
  are side 1, and the mirrored ring walk gives the aimed-at unit a farther spot at each end of its walk, so it never stands still
  (13% → 0% of ticks) and shells, which aim where it is when fired, miss more. Spacing unmirrored: 67% (audit/sim/arthit6c.js).
- **Slow suite on v2.92:** 15 of 15 (audit/logs-p1/pinned6c/slow-suite-v292.txt).
- **Tests pinned to switches off:** 171 test blocks pin a switch; 21 are fingerprints (covered by the all-on sets), 36 already test
  both sides of their switch, the rest got switches-on counterparts: 87 re-run with every switch held on and 23 rewritten for the
  reworked rules in tests/switches-on-6c.test.js, 5 long AI-match tests and the Two-Lane AI test in tests/slow/switches-on-6c.test.js
  (inventory: audit/logs-p1/pinned6c/pinned-tests.md).

### Part B0: the HQ shield rule (b6hq)

**Before (v2.92, `refreshShields` in src/sim/game.js, every tick):** a side's HQ was shielded only while (1) another building of
that side stood that was finished (`built`), not a Node Bunker (`bunker`) and not on a forward pad (`slot >= FWD_SLOT`), **and**
(2) with `BREAK.prod` on (v2.69 (d), the default) a finished production building (Barracks, War Factory or Tech Lab role, any
faction's) stood in the base. Signature buildings, Refineries, Reactors, Habitats and Turrets counted for (1) but never for (2).
No timer; the storm ignores the shield (it burns buildings directly) and the tutorial's HQ can't fall. **Why it dropped early in
the owner's games:** rule (2). Once the enemy's production buildings were gone the shield fell while its Refineries, Reactors,
Habitats, Turrets and signature building still stood.

**After (b6hq on):** the HQ is shielded while at least one other finished building of that side stands (`hqHolds`): not the HQ,
not a building on a field node (the Node Bunker, and anything on a forward pad, which is a node), not one under construction. It
drops when none is left and comes back when one is finished; the same rule for both sides. The count (`hqHolders`) is drawn on
the HQ's shield (a badge on the side facing the field) for both HQs, on the shield icon in the top bar and in the HQ's readout
("Shielded · 3"); an enemy HQ out of sight shows its ghost, without a count. **AI:** an AI base attack's target bonus (`bbFocus`)
now treats every finished building as a shield holder (the extra 40 the production buildings had goes to all of them); a shielded
HQ can't be targeted or hurt, so the AI breaks the holders first. Texts (the HQ's description, the start screen, the Codex's
"Breaking a base", the tutorial) follow the switch. **Effect** (persona-balanced self-play, b6hq on, b6c off, against A1): median
length 13:58 → 14:35, ended by an HQ destroyed 91% → 91% (148 of 162 both; audit/logs-p1/selfplay6c-b0/).

### Part B1: unit tuning (b6c)

Measured with audit/sim/b6c-range.js (Test Range, 10 seeds × both orientations, 20 runs a cell; before/after in
audit/logs-p1/b6c-range/), each lever through per-game values (`B6C`, `barHp`, `broodCost`, `latchDps`, `rwD`), UDEF untouched.

| item | lever | before | after | measurement before → after | target | met |
|---|---|---|---|---|---|---|
| Bastion barrier | `BAR.hp` | 600 | 300 | Tanks + Marines need 865 without the barrier (b3b off); with it 2,230 (+158%) → 1,320 (+53%). Lancers 495 → 825 (+67%) → 495 (+0%) | +40-60%, never over +110% | yes (Tanks + Marines) |
| Broods | `BROOD.cost` | 120 | 164 | against equal-cost Marines at five army sizes (100 runs): 100-0 keeping 67% → 58-42 keeping 29% in wins; Shardlings 100-0 → 98-2 (31% kept); Lancers 100-0 → 100-0 (68% kept) | Marines 40-60%, under 50% kept | yes |
| Leviathan | its run bombs' damage | 35 | 90 | damage per second against one Tank 6.8 → 17.6 (pre-rework 26.3: 0.26 → 0.67); 6 Tanks 0.64, 12 Marines 0.63, a Refinery 0.62 of pre-rework | 60-70% | yes |
| Leaper | `LATCH.dps` | 10 | 55 | self-play damage per 100 spent 36 → 91; head-on against equal-cost Marines it already won 20-0 before (its leap and bite; the latch only acts on hosts) and still does | at least about 100, not beating Marines head-on | no (91; and the head-on condition was already broken before) |
| Riftstalker | its blade's damage, then its armour table | 18 (×0.9 heavy, ×0.6 vehicle) | 23 (×1.5 heavy, ×1.4 vehicle; light ×1.5 kept) | self-play 40 → 74; head-on against Marines 0-20 → 0-20 | at least about 100, not beating Marines head-on | no (74) |

The brood fight flips from 20-0 to 0-20 with a single Skitterling more or less at one army size (counts are whole numbers), so its
share is read over five sizes (18 to 36 Marines). The divers' second value: a 24 blade one-shots a Marine (36 health at ×1.5), and
5 Riftstalkers then beat 21 Marines 20-0, so 23 is the most the named lever can give without breaking the head-on rule; the rest
went into its blade against heavy and vehicle armour (`riftblade6`, its own weapon entry, v2.92's untouched), which a Marine fight
never uses. Higher values (Leaper 70, Riftstalker ×2.0) measured no better in a Classic probe (54 matches, noise larger than the
change): the divers die before they deal damage (Leapers 247 of 254 lost there), and more damage per hit does not buy more hits.

### Part B2: self-play with both on (audit/logs-p1/selfplay6c-b2/)

162 matches, 0 errors. Last Fist 60% → 65% (55-73), Bloomhost 44% → 36% (28-46), Axiarchs 32% → 34% (26-44): Bloomhost and the
Axiarchs are outside 40-60% (reported, not tuned further). Median length 13:58 → 15:06; ended by an HQ 91% → 90%. Damage per 100
spent (usage: trained, sides): Bastion 116 → 112 (586 → 642, 91 → 98 sides); Skitterling 124 → 82 (7,028 → 5,728); Leviathan 81 → 144
(26 → 38, 22 → 25 sides; tier-3 units in the same run: Shardstorm 357, Worldbreaker 348, Titan 266, Brood Tyrant 246, Worldrender
245, Sovereign 241, Ruinmaw 197, Voidcarrier 84, Cloudwing 57); Leaper 36 → 91 (505 → 1,021); Riftstalker 40 → 74 (571 → 625).
Bloomhost's drop comes mostly against Last Fist: 31% → 17% of decided (Last Fist 31-14-9 → 39-8-7), after the brood price. Details: docs/BALANCE_AUDIT.md
section 11.

### Part C: start side and team colours

- **Start side** (C1): on the battlefield screen (the match setup before Play; the main setup has no room left at 667×375), beside
  Play: **Start: Left / Right / ?** (Random; Left/Right, the maps run east-west) and a **Colour** button that steps through Random
  and the eight colours. Both remembered (`extinctionEvent.start`, `extinctionEvent.color`). The default is Left: **side 0**, the
  side the player has always played. The thumbnails show your start base in blue. The view is never flipped.
- **Either side** (C2): the player's side is `g.me` (absent = 0, so a default game, its save and every hash are v2.92's). The SIM:
  which side the AI runs (`aiUpdate` / `side6Ai` for the side that isn't `g.me`), its personality, difficulty (`aiDiff`) and the
  starting stances, `playerSide`, the screen shake's fog, the match log's "you" (report.js), the stats summary (`me`), save and load.
  The UI and render read `myS()` / `foeS()` (src/ui/core.js) for: the start camera (`homeX`: the right-hand base looks left) and
  the intro; selection, taps, the box, double-tap, All, control groups, lanes, commands and targets (src/ui/controls.js); direct
  control (`ctlStart`); building on pads, the signature pad and forward pads, cards, upgrades, Repair, Sell, Echoes, the warp point,
  abilities and their aim previews; fog (`viewFog`), enemy pads, creep and field drawn from what you have seen, tunnels, markers,
  projectiles and effects in the fog; the HUD (resources, supply, the HQ readout and its count, Overdrive), alerts and toasts,
  sounds for your events, the minimap (the enemy HQ's last-seen bar); the post-match screens (Victory/Defeat, You/Enemy columns,
  graphs, army tables, the enemy timeline, the copied log). The 6b spacing (`ctlFree`'s dir) already mirrors by side. Positional
  uses (dirOf, hqU, gun facing, node capture direction, Ruinmaw edges) stay by side number. The tutorial stays on the left (it never
  passes `me`); the Test Range keeps blue as the side you can command.
- **Team colours** (C3, src/render/core.js `PALETTE`, `palRoll`, `setTeams`): Blue and Red exactly as before; Green (emerald
  #14c98a, bluer and darker than the lime acid), Gold (#ffb82e), Purple (#a05cff), Pink (#ff38b4), Pearl (#ece2d0, dark edges and
  a dark outline), Onyx (#24232c, a bright outline and white-violet light lines; on Axiarchs the glowing lines carry it). Onyx
  passed the readability screenshots and ships. **Excluded pairs:** Blue/Purple, Red/Pink, Pink/Purple, Red/Green (colour-blind),
  Blue/Green (both cool and cyan-leaning at phone size; a tritan confusion pair). A match rolls two allowed colours from the UI's
  own `Math.random`, never the SIM's streams; the player may pick theirs (the opponent then gets a random allowed one). Stored as
  `g.tc` (side 0's key, side 1's) with saves, never read by the SIM, left out of every hash (a SIM-only game never has it).
  `setTeams` fills TEAM[0..1] per match (the relic guards turn slate when a team is Gold) and remakes what was drawn once from them
  (team glows, shield bubbles, the ground's base glows, creep and field canvases; remembered for up to four pairs so Test Range rows
  switch cheaply); the sprite, aircraft and building caches already key on the colours, so a new pair draws fresh poses, bounded
  by their existing budgets. The Test Range lets each row pick each side's colour or Random.
- **Test runs (v2.93):** npm test 764 of 764, npm run test:slow 26 of 26 (audit/logs-p1/pinned6c/fast-suite-v293.txt, slow-suite-v293.txt).
- **Checks** (C4): tests/start-side-6c.test.js (five matches against Hard from each side with several pairs on all three maps:
  your units only, your fog, build, train, a fight, Victory; Defeat from the right; a save on the right resumes there with its
  colours; the setup fits and remembers; 10,000 rolls never an excluded pair and never touching the match streams);
  audit/sim/identity6c.js (6 of 6 identical); screenshots docs/screenshots/colors6c-*.png (tests/colors6c-shots.js).

### Departures

- The Start and Colour choices sit on the battlefield screen, not the first setup screen (no room at 667×375 without scrolling).
- The Leaper and Riftstalker targets (about 100 per 100 spent) are not met (91, 74); the Leaper already beat equal-cost Marines
  head-on before the change. The Riftstalker used a second value (its armour table), explained above.
- Bloomhost and the Axiarchs land outside 40-60% with both switches on; not tuned further, as asked.
- The Test Range kept the side names Blue and Red in its texts whatever colours a row picks (renamed Left and Right in batch 6d).

## Batch 6d: the AI personality fix, then faction balance

**Batch 6d (v2.94): three parts, in order.** Part A fixed the two losing Hard personalities behind `REWORK.b6ai`, Part B tuned four
values behind `REWORK.b6d`; both in src/sim/rework-6d.js, per game in `g.rw`, on by default, saved only when on, with Test Range
switches ("Batch 6d AI", "Batch 6d balance"). With both off the game is v2.93 exactly: every pinned set matches under its own
switches (the old sets, FP_V292M, FP_V293H, FP_V293; every older replay now sets b6ai and b6d off). Recorded: FP_V294A (b6ai on,
b6d off) and FP_V294 (both on), tests/determinism.test.js. Part C changes no match. Measured with 6c's persona-balanced self-play
(audit/sim/selfplay-6c.js, 162 Hard vs Hard matches), now with per-side time series (audit/sim/audit6a.js: income, army, bank and
supply every minute; idle production, banking, attack stance; Salvage; damage by dealer and target). Tests: tests/rework-6d.test.js,
tests/shield6d-ui.test.js, tests/testrange-sides6d.test.js.

### Part A1: why the Turtle and the Economist lost (audit/logs-p1/selfplay6d-base/A1.md)

On v2.93 (162 matches, identical to 6c's run): Boomer 68%, Economist 33%, Turtle 34%; against the Boomer the Economist went 1-32-3
and the Turtle 7-26-3. Both took only Hard's two Refineries (the Economist's plan names three; Hard's cap of 2 plus its `refDelta`
of 0 cut the third) and upgraded them late: income at 4:00 Boomer 38, Economist 26, Turtle 14; first tier 3 at 3:19, 3:41 and
6:42. The Boomer's first base attack (4:01) met armies half its size (1,380 against 743 and 400). Production stood idle 56% and 65%
of the match (Boomer 40%) for lack of credits, energy and supply (the Turtle at 19/28 supply at 6:00, the Economist near its cap
with money banked); the AI's `calm` rule held every upgrade while an enemy was near. The Turtle attacked the base two minutes
later than the Boomer (6:00), spent 30% of the match on attack stance (54%) and lost 8 of 63 without ever attacking the base.
**Correction:** 6c's "natural mix" weighted the Axiarchs' Hard pool as 2/3 Turtle; the code's pool (since v2.43) is Boomer,
Boomer, Turtle. With the true pool v2.93's normal-play figures are Last Fist 60%, Bloomhost 40%, Axiarchs 29% (6c said 19%).

### Part A2: the fix (b6ai)

Hard only (Easy and Normal keep their pools and play); the Boomer is unchanged.

| | v2.93 | b6ai |
|---|---|---|
| Hard pools | Last Fist Boomer, Boomer, Economist, Turtle; Bloomhost Boomer ×3, Turtle; Axiarchs Boomer, Boomer, Turtle | every faction Boomer, Economist, Turtle (`B6AI.pool`) |
| Economist plan | Barracks, Refinery ×3 (the third cut by the cap), Reactor, War Factory, Habitat, Tech Lab | the Boomer's opening: Refinery ×3, Barracks, Reactor, Habitat, War Factory, Tech Lab, `refDelta` 1 |
| Economist economy | upgrades shift -30 to -60 s, first: Refinery T2, Tech Lab T2, Refinery T3; army limit 50-60% to 2:30 | shift -75 s; Refineries T2 ×3, Reactor T2, Habitat T2, Barracks T2, Refineries T3, Reactor T3, Habitat T3 …; army limit 35% to 2:30 |
| Economist spending and attack | buys what it can past 900 credits | past 600 (`B6AI.eco.cap`); a base attack from 5:00 once its army is 1.1× the enemy's it knows of and at least 900 (`lead`, `min`) |
| Turtle plan | Barracks, Refinery ×2, Turret, Reactor, Habitat, War Factory, Tech Lab | Refinery, Barracks, Refinery, Turret, Refinery, Reactor, Habitat, War Factory (`refDelta` 1; no Tech Lab: a ground fortress) |
| Turtle economy | first upgrades Turret T2, HQ T2; army limit 100% | Refineries T2 ×3, Habitat T2, Turret T2, Reactor T2, Barracks T2, War Factory T2, HQ T2, then T3s; shift -60 s; army limit 35% to 2:30 |
| Turtle attack | a 1.2-1.4× edge, a 1.1-1.3× wave, a deadline of 11:00-14:00 | edge 1.0; deadline 9:00; a base attack at 2,500 army value with an even army (`army`), from 9:00 at 0.9× (`at`), and right after a defence it won: enemies in its base in the last 25 s, none now, its army at least theirs and 600 (`won`, `counter`) |
| both, under threat | no upgrades while an enemy is near (`calm`) | they keep upgrading (`B6AI.calmUp`) |

Tried first and measured worse (61 matches against the Boomer, of a planned 72): only a third Refinery, earlier upgrades, the spend cap and the
attack rules, keeping the old openings: Economist 7-19-3, Turtle 4-22-4 against the Boomer (energy and supply still ran out).

### Part A3: measured (audit/logs-p1/selfplay6d-a3/A3.md; b6ai on, b6d off)

Personalities (target 40-60%: met): Boomer 68% → 44% (35-53), Economist 33% → 52% (43-61), Turtle 34% → 44% (35-53); against the
Boomer 17-16-3 each. Factions: Last Fist 77% (68-84), Bloomhost 41% (32-50), Axiarchs 21% (15-30) (normal play the same: equal pools).

### Part B1: why Last Fist won (audit/logs-p1/selfplay6d-a3/B1.md)

1. **Volume:** it earned 17-18% more a minute (2,087 against 1,759 and 1,780; Salvage 12% of its earnings, 14 Overdrive starts) and
   spent 73% on units (60%, 55%): 32% more on units than either opponent, while trading worse per credit (killed value per 100
   spent 71 and 69, against 104 and 101 for its opponents). The income gap opens at 3:00-4:00, when the first field fight decides
   who holds the three field nodes (in a traced Boomer mirror Last Fist held all three at 4:00: 33 credits a second against 21).
2. **The Tank:** 24% of its damage in matches it won, its most-funded unit (542,755 spent), the top dealer against both
   opponents' front lines (49% of it into Bulwarks, 24% into Bastions) and their buildings.
3. **The Axiarchs can't turn income into an army:** their units are 26% energy by cost (19% for the others); they bank 1,000+ for
   22% of the match; peak army 14; their most-funded units fail (Shardling 78 damage per 100 spent on 344,720 spent, Riftstalker
   64); 5 and 3 wins of 36 on Two-Lane and Three-Lane.
4. **Artillery:** 400 damage per 100 spent, the most of any unit massed, beyond its targets' reach.

### Part B2: the four values (b6d)

Per game through `B6D` (`b6Yard` for the Salvage Yard, `rwD` and `rw6dSpawn` for units; UDEF untouched). Screened first on
54-match Latin-square subsets (each faction plays each personality once per map and side), against the same matches of A3:

| package | Last Fist | Bloomhost | Axiarchs |
|---|---|---|---|
| A3 (none) | 81% | 33% | 25% |
| Yard 0.07, Tank 36, Artillery 36 (on 50 matches) | 77% | 42% | 28% |
| … and Shardling damage 14 | 69% | 47% | 28% |
| Yard 0.07, Tank 34, Artillery 34, Shardling damage 15 | 72% | 44% | 28% |
| Yard 0.07, Tank 34, Artillery 34, Shardling health 120 | 67% | 36% | 33% |

| value | cause | before | after | effect (A3 → B3) |
|---|---|---|---|---|
| Salvage Yard share (`B6D.yard.pct`) | 1 | 0.14 | 0.07 | Salvage 191 → 108 credits a minute, Overdrive starts 14 → 0; Last Fist earns 2,089 → 2,002 a minute |
| Tank damage (`B6D.unit.tank.dmg`) | 2 | 42 | 32 | 242 → 179 damage per 100 spent; 24% → 17% of Last Fist's winning damage |
| Shardling health (`B6D.unit.shardling.hp`; shields 75 kept) | 3 | 80 | 120 | 78 → 105 damage per 100 spent; 10% → 12% of the Axiarchs' winning damage |
| Artillery salvo (`B6D.unit.artillery.dmg`; deploy, telegraph, range kept) | 4 | 45 (b6art; 60 before 6b) | 34 | 400 → 361 damage per 100 spent |

Identities kept: the Artillery stays Last Fist's only long-range unit (440 range, deploy and telegraph untouched); the Bloomhost are
untouched; the Axiarchs' Shardling stays a 2-supply, shielded duelist with its parry. 6c's tuning is untouched (B1 did not point there).

### Part B3: measured (audit/logs-p1/selfplay6d-b3/B3.md; both on)

162 matches, 0 errors. Last Fist 62% (53-71), Bloomhost 43% (34-52), Axiarchs 28% (20-37): Bloomhost inside 42-58%, Last Fist and
the Axiarchs not. Pairings: Last Fist vs Bloomhost 65% (51-76), vs the Axiarchs 59% (46-71), Bloomhost vs the Axiarchs 63%
(50-75): all within 35-65%. On Classic the three are level (47 / 39 / 50%); the Axiarchs win 17% on each lane map. Personalities
with both on: 47 / 40 / 45%. Median length 15:21 → 16:34.

### Slow tests after b6ai and b6d (audit/logs-p1/slow6d/report.md, audit/sim/slow6d.js: each over 20 matches, every switch on, b6ai off, b6d off, both off)

- **Bloomhost abilities** (tests/slow/ai-stats.test.js, the Default AI, so b6ai plays no part): Corrosive Bloom in 7 of 20 with
  every switch on, 10 of 20 with b6d off (the test's own ten seeds: 3 and 5); Frenzy Bloom 20/20 and Emergency Brood 8/20 either way.
  Seed variance at a bar set when the rate was 90% (v2.38): v2.93 already sat on it (50%). The bar is 25% now.
- **Axiarch path mapping** (tests/ax-trees.test.js, re-run with every switch on in tests/slow/switches-on-6c.test.js): an intended
  effect of b6ai. The Axiarch Hard AI faces a forced Last Fist Turtle, which with b6ai on is the batch 6d Hard Turtle: the Axiarchs
  win 5 of 20 there (17 of 20 with b6ai off) and fall before reaching their T2 paths (a seed pair covering all four paths 1/9 against
  4/9). The test now holds b6ai and b6d off; its counterpart, tests/slow/switches-on-6d.test.js, checks the same mapping with every
  switch on against a Last Fist Turtle on Normal (b6ai is Hard only): every match takes a Barracks and a War Factory path, all four
  over six seeds, path units trained.
- **Three-Lane** (tests/slow/threelane-match.test.js): seed variance. Both sides use all three lanes in 19 or 20 of 20 matches under
  every switch set and end by an HQ in 17 of 20 with every switch on (18 with b6ai and b6d off), but the one two-lane match (seed 604,
  a Bloomhost Turtle holding two lanes at home with b6ai on) and all three non-HQ endings fell on the test's own seeds 600-605. The
  test moves to seeds 606-611 (the same pairing cycle), where every original check passes in every match.

### Part C: small fixes (no gameplay change, no switch)

- **C1, the enemy shield count:** the enemy HQ's count (on its shield and in its info card) counts only the holders the player has
  seen finished, as the fog remembers them (its ghosts; `hqHoldersShown`, `HQ_SEEN`, kept by the UI, never read by the SIM); "?" when
  the shield is up and none is known. The player's own count stays exact. On Classic a view of the enemy HQ always shows its front
  pads too (one-dimensional fog), so "?" with the HQ in view shows on the lane maps (screenshots: docs/screenshots/rework6d-shield-*.png).
- **C2, Test Range labels:** the sides are Left and Right everywhere in the Test Range (bar, setup, info card, tool line, toasts);
  the Team colours list keeps colour names (rework6d-testrange-*.png).
- **C3, flaky browser tests:** the controls test's commands (tests/controls-ui.test.js) waited a fixed time after a click; it now
  waits for the selection and for each order to land. The start-side fight (tests/start-side-6c.test.js) tapped an enemy that real
  time had already killed under load; the enemies now spawn just out of reach and the tap picks one still standing. Both reproduced
  under a self-play load, both pass under it now.

### Departures

- The faction target (42-58%) is met for Bloomhost only; Last Fist (62%) and the Axiarchs (28%) are outside. Four values were the
  limit. The Axiarchs' gap is the lane maps (17% on each; 50% on Classic). Next lever: the Axiarch AI on lane maps (keep a small
  army on one lane and move it as one), then their energy squeeze (an Axiarch Reactor yield or their units' energy costs).
- The Turtle no longer builds a Tech Lab (its eight pads go to three Refineries and a Turret); it plays as a ground fortress.
- b6ai's personality changes apply to Hard only; Easy and Normal Turtles and Economists play as before.

## Batch 6e: Axiarch lane play and energy, then Last Fist's early edge

**Batch 6e (v2.95): three parts, in order.** Part A fixed the Axiarch AI on the lane maps behind `REWORK.b6elane`; Part B converted
Axiarch energy costs into credits and made one further Axiarch change behind `REWORK.b6e`; Part C (Last Fist was still at 61%) set
one Last Fist value, also behind `b6e`. Both switches in src/sim/rework-6e.js, per game in `g.rw`, on by default, saved only when
on, with Test Range switches ("Batch 6e lanes", "Batch 6e costs"). With both off the game is v2.94 exactly: every pinned set
matches under its own switches (the old sets, FP_V294A, FP_V294; every older replay now sets b6elane and b6e off). Recorded:
FP_V295A (b6elane on, b6e off) and FP_V295 (both on), tests/determinism.test.js. Measured with 6c's persona-balanced self-play
(audit/sim/selfplay-6c.js, 162 Hard vs Hard matches) and three new tracers: audit/sim/lanes6e.js (the army per lane, losses alone,
the warp point), audit/sim/early6e.js (the opening to 6:00) and audit/sim/bank6e.js (credits and energy banked). Tests:
tests/rework-6e.test.js, tests/costs6e-ui.test.js.

### Part A1: how the AIs use the lanes (audit/logs-p1/lanes6e-base/A1.md)

The premise did not hold: no faction splits its army much. Every 10 s over the 108 lane-map matches, the top lane held 93% of the
Axiarchs' ground army on Two-Lane and 91% on Three-Lane (Last Fist 93/90%, Bloomhost 89/85%). What the Axiarchs did differently:
18% (Two-Lane) and 20% (Three-Lane) of the value they lost died **alone** (no other Axiarch unit within 300), against 4-6% for the
others; 73-83% of those were under a minute old, and 72-77% died while the army held at home. Every Axiarch unit warps in at the
warp point, by default the front edge of the frontmost power-field patch: on the lane maps the centre node or a forward pad,
999-1,049 from the HQ (median), while the army's middle stood 458-738 from it and the warp point was 400+ ahead of it 35-45% of
the time. New units appeared in the enemy's path and died there. A second fault, in every faction's AI: an all-in base attack
walks to the map's edge behind the enemy base and stands there out of sight of what the enemy rebuilds (the Axiarchs' army stood
past the enemy HQ in 6-7% of samples; in one trial a 3× army stood there 12 minutes and the match was drawn). Reported for all,
changed for the Axiarchs only.

### Part A2: the fix (b6elane)

An Axiarch AI on a lane map (every difficulty; Classic has no lanes and plays as before), in place of the lane AI's reinforcement
and shift rules (`aiLanes6e`, called from `aiLanes` and `aiLanes3`):

| rule | v2.94 | b6elane |
|---|---|---|
| where the army goes | new units to the lane that needs them, a surplus shifted to a losing lane | one focus lane (`side.la.fc`): every ground unit but at most one cheap screen (150 or less) per other lane, and every new unit |
| which lane | (per lane) | the lane under the most dangerous attack (enemy value in its own half, weighted up to 2× near the HQ, 150+); else the lane where it can win (the most enemy value its army beats 1.15×), else the least enemy; held 25 s unless a threat elsewhere is 1.5× the current lane's |
| the warp point | the front edge of the frontmost field patch | the field spot on the focus lane nearest the middle of the army there, never more than 60 ahead of it (`lane6eWarp`; the player's "Set warp point" mechanism, `side.warp`) |
| a lane switch | units walk | the warp point moves at once; Mass Warp (an existing ability) is cast on the biggest group still on the old lane when ready (`aiMassWarp6e`), the rest walk |
| an all-in base attack | down one lane, to the map's edge | down one lane, to the enemy HQ plus 60 (`lane6eEnd`, `side.end6e`) |
| capture groups (Three-Lane) | two at once | one |

Base attacks keep v2.94's one-lane rule. No unit values change; no new ability.

### Part A3: measured (audit/logs-p1/selfplay6e-a3/A3.md; b6elane on, b6e off)

Axiarchs 28% (20-37) → 45% (36-55): Two-Lane 17% → 39%, Three-Lane 17% → 47%, Classic unchanged (the 54 Classic matches are
identical to 6d's). Last Fist 62% → 54%, Bloomhost 43% → 35%. Pairings: Last Fist vs Bloomhost 65% (unchanged), vs the Axiarchs
59% → 43%, Bloomhost vs the Axiarchs 63% → 48%. Personalities 46 / 42 / 46%. Lone deaths 18% → 8% and 20% → 9%; the warp point 400+
ahead of the army 35% → 16% and 45% → 3% of the time; the top lane's share 93% → 90% and 91% → 95%.

### Part B1: the energy conversion and one further change (b6e)

Every Axiarch unit's energy at most 20% of its total cost (rounded to 5), the rest onto its credits; totals unchanged, the
Shardling (19%) unchanged (`B6E.cost`, played through `trainCost`, `rwD`, `rwShow`, `echoCost`, a sold queue's refund; UDEF
untouched; the AI's `armyValue` keeps UDEF's numbers):

| unit | v2.94 | b6e |
|---|---|---|
| Shardling | 65 / 15 | unchanged |
| Riftstalker | 140 / 50 | 150 / 40 |
| Lancer | 120 / 45 | 130 / 35 |
| Prismwing | 100 / 40 | 110 / 30 |
| Bastion | 260 / 85 | 275 / 70 |
| Parallax | 220 / 90 | 250 / 60 |
| Severance | 220 / 90 | 250 / 60 |
| Rift Mortar (b2a off) | 250 / 100 | 280 / 70 |
| Gravemantle | 230 / 100 | 265 / 65 |
| Wraithwing | 230 / 100 | 265 / 65 |
| Astral Marksman | 240 / 110 | 280 / 70 |
| Shardstorm | 280 / 130 | 330 / 80 |
| Voidcarrier | 360 / 170 | 425 / 105 |
| Eventide | 420 / 180 | 480 / 120 |
| Worldbreaker | 500 / 210 | 570 / 140 |
| Astral Sovereign | 600 / 300 | 720 / 180 |

Energy share of Axiarch unit spending 25.9% → 20.0% (Last Fist 19.3%, Bloomhost 19.2%). **Measured alone it made the Axiarchs
worse: 45% → 34% (26-44)** (audit/logs-p1/selfplay6e-b2/B2.md). From 8:00 they were short of credits instead (median 255-363
banked at 8:00-10:00, 188-326 later) with energy unspent (415-1,381 from 10:00), and their spending moved from the Bastion and
Prismwing to the units the old energy price had held back (Marksman, Riftstalker, Severance, Gravemantle, Wraithwing), none of
which trades better. Under 42%, so one further change: not the Singularity Well's energy yield (energy was no longer short), but
the unit failing its role with the most spent on it, the **Riftstalker: shields 110 → 160** (`B6E.unit`, `rw6eSpawn`): 98 damage and
39 killed value per 100 spent, 3% of the damage in Axiarch wins; its rule blinks it home when its shields break, so it left or
died before it killed.

### Part B2: measured (audit/logs-p1/selfplay6e-b3/B2.md; both on)

Last Fist 61% (52-70), Bloomhost 34% (26-44), Axiarchs 39% (30-48) (Two-Lane 39%, Three-Lane 31%). Riftstalker 98 → 120 damage per
100 spent (5% of winning damage). Damage per 100 spent for every changed unit is in B2.md.

### Part C1: Last Fist's early edge (audit/logs-p1/early6e-c1/C1.md)

At 4:00 Last Fist fields 1,566 (13.5 Marines, 39% of it by value; 1.6 Heavies, 1.3 Tanks) against Bloomhost's 1,235 and the
Axiarchs' 1,146, earns 37.4 a second (33.2, 38.8) and holds 2.09 nodes (1.19, 2.24); it wins the first field fight (300+ value
lost, from 3:20) against Bloomhost 61% and against the Axiarchs 33%. Joined with the full matches: against the Axiarchs the 4:00
army decides (1.2× bigger: 25-6; 1.2× smaller: 0-7); against Bloomhost the opening does not (Last Fist wins 15-3 after losing the
first fight, 14-3 with fewer nodes at 5:00, 14-1 with armies within 20% at 4:00): 6d's reading no longer holds. What Last Fist has
over both is volume: it spends 1,389-1,401 a minute on units against 1,246 and 1,098, from a little more income and a larger
share on units (69-70% against 65% and 58%).

### Part C2/C3: one value, measured (audit/logs-p1/selfplay6e-c3/C3.md)

| value | before | after |
|---|---|---|
| Marine credits (`B6E.cost.rifle`, behind b6e) | 45 | 48 |

Screened on a Latin-square subset first (Marine 50: Last Fist 64% → 39% there; +5 overshot). Measured with every switch on: Last
Fist 46% (37-56), Bloomhost 44% (35-53), Axiarchs 44% (35-53); every pairing 46%; the Axiarchs 44% on Two-Lane and 42% on Three-
Lane; personalities Boomer 39% (30-48), Economist 44%, Turtle 51%. The opening hardly moved (Last Fist's 4:00 army 1,566 → 1,525,
first fight vs Bloomhost 61% → 56%); the gap closes later in the match. The second allowed change was not used.

### Tests after b6elane and b6e

- Fast suite: the pinned older switch sets hold b6elane and b6e off (determinism, the rework and 6d tests and the rest). Five
  tests checked prices against v2.94's numbers; each now checks the same intent against the game's price (`trainCost`,
  `echoCost`): an echo costs half the unit's price (tests/axiarchs-sig.test.js, tests/axiarchs-sig-ui.test.js), a sold queue
  refunds its units in full (tests/regression.test.js), a Mass Deployment order costs two Marines (tests/trees.test.js, and its
  switches-on rerun). tests/rework-3a.test.js's "b3a off plays the plain UDEF entry" holds b6e off too (b6e's Riftstalker price and
  shields sit on top of any batch).
- Slow suite: tests/slow/threelane-match.test.js failed "both sides used all three lanes" on one match. Over 20 seeds and four
  switch sets (audit/logs-p1/slow6e/report.md, audit/sim/slow6e.js) it is an intended effect of b6elane: the Axiarch side reaches
  all three lanes in 5 of 10 matches with it on, 10 of 10 off; every other side and check is unchanged. The test holds b6elane off;
  tests/slow/switches-on-6e.test.js checks the same intent with every switch on (the Axiarchs move one army between two lanes or
  more, every other side uses all three).

### Departures

- A1 found no army split; the fix is the warp point (plus the one-lane rule asked for, and the base attack's end), not a split.
- The conversion did its job on the numbers (20%) and hurt the Axiarchs (45% → 34% alone); it is kept as asked, with the
  Riftstalker change and the Part C Marine price behind the same switch. Next lever if the Axiarchs slip: a share near 24%.
- Part C's change is the Marine's price, not the 3:00-4:00 fight: C1 found the fight decides neither Last Fist pairing.
- The Boomer personality is at 39% (30-48), one point under its 40-60% target; not tuned (no Part C change was aimed at it).
- New map spread (not a target): Bloomhost 67% on Classic and 22% on Three-Lane; Last Fist 31% on Classic.

## Batch 6f: base attacks for every AI, the Axiarch prices undone, player warp-in, the maps

**Batch 6f (v2.96): four parts, in order.** Both switches in src/sim/rework-6f.js, per game in `g.rw`, on by default, saved only
when on, with Test Range switches ("Batch 6f AI", "Batch 6f prices"): `REWORK.b6fai` (AI behaviour: Part A and Part D's change) and
`REWORK.b6f` (values and the player's warp point: Parts B and C). With both off the game is v2.95 exactly: every pinned set
matches under its own switches (the old sets, FP_V295A, FP_V295; every older replay now sets b6fai and b6f off). Recorded:
FP_V296A (b6fai on, b6f off) and FP_V296 (both on), tests/determinism.test.js. Measured with 6c's persona-balanced self-play
(audit/sim/selfplay-6c.js, 162 Hard vs Hard matches; `--seedBase` for other seeds) after each part. Tests:
tests/rework-6f.test.js, tests/rework-6f-ui.test.js.

### Part A: base attacks for every AI (b6fai; audit/logs-p1/selfplay6f-a/A.md)

Every AI-played side (never the player's own Attack order), every faction and map, Classic included: an all-in base attack walks
to the enemy HQ and 60 beyond it (`end6f`, units.js), not to the map's edge behind the base; b6elane's own end point (the same
spot) comes first where it is set. How often the edge happened at v2.95 (new read-only counters in audit/sim/audit6a.js,
audit/sim/edge6f-report.js: a side "at the edge" for 20+ s with half its ground army over 100 past the enemy HQ): Last Fist 0 of
108 sides, Bloomhost 5 (Two-Lane 1, Three-Lane 4; 298 s), the Axiarchs 3 (all on Classic, outside 6e's lane-map fix; 733 s); the
affected sides went 6-0-2, and nearly every such second had an enemy in sight. After: none idle (2 Classic Axiarch sides still
counted, fighting buildings on the enemy's back pads, 121 past its HQ). Win rates moved within the noise (46 / 44 / 44% →
44 / 45 / 45%).

### Part B: the Axiarch energy conversion undone (b6f; audit/logs-p1/selfplay6f-b/B.md)

Every Axiarch unit costs v2.94's credits and energy again (b6e's `B6E.cost` entries for Axiarch units skipped by `rw6eCost` and
`rwShow` when b6f is on: training, rwD, the Codex and info cards, echoes, a sold queue's refund). Kept, still behind b6e: the
Riftstalker's shields 160, the Marine 48 credits.

| unit | v2.95 (b6e) | b6f (= v2.94) |
|---|---|---|
| Riftstalker | 150 / 40 | 140 / 50 |
| Lancer | 130 / 35 | 120 / 45 |
| Prismwing | 110 / 30 | 100 / 40 |
| Bastion | 275 / 70 | 260 / 85 |
| Parallax, Severance | 250 / 60 | 220 / 90 |
| Gravemantle, Wraithwing | 265 / 65 | 230 / 100 |
| Astral Marksman | 280 / 70 | 240 / 110 |
| Shardstorm | 330 / 80 | 280 / 130 |
| Voidcarrier | 425 / 105 | 360 / 170 |
| Eventide | 480 / 120 | 420 / 180 |
| Worldbreaker | 570 / 140 | 500 / 210 |
| Astral Sovereign | 720 / 180 | 600 / 300 |

Axiarchs 45% (36-55) with both on (45% with b6f off): no Riftstalker step was needed (the 58% trigger was not reached). Their bank
at 12:00: 196 credits / 648 energy → 624 / 210; energy back to 25.9% of their unit spending.

### Part C: the player's Axiarch warp-in (b6f)

How it worked: a human Axiarch player's trained units warp in at the warp point: the spot set with the Train tab's "Warp point"
card while it stays inside the field, else the default, the front edge of the frontmost field patch, where every new unit then
held alone (`ctlArrive`). The player could move it with the card; there is no other rally point to set (since v2.76 the base
rally point is the map's). Batch 6e's change (`lane6eWarp`) was the AI's only and never touched the player. Changed under b6f:
a player with no warp point of its own (none set, or the set one left the field) warps in at the field spot nearest the base
rally point (`warp6f`, `warpAt`; nearest the producing building only if no field spot is found), and Mass Warp and the warp mark
use the same point; not while a Phase Beacon's bubble stands (warping in at the front is the Beacon's purpose); a set point is
kept. The card reads "Base · tap to set" (was "Front"). Checked in the browser (tests/rework-6f-ui.test.js, screenshot
warp6f-base.png): with its own node and the centre held, a Shardling trained by tapping its card appeared beside the base rally
flag; at the set point when one was set; at the front edge with b6f off.

### Part D1: the map diagnosis (audit/logs-p1/lanes6f-d1/D1.md)

From the Part B build: the self-play and a lane trace of the same 162 matches (audit/sim/maps6f-report.js). Ranked causes:
(1) Bloomhost's AI splits its swarm on Three-Lane (1.38 lanes holding 20%+ of its army, 7% in capture and raid groups; outnumbered in
its main lane 59% of samples; 40% of its losses outnumbered); (2) Last Fist's press attacks into a Turtle on Classic (0-12 against
the Turtle there, every other cell ordinary: its Hard AI's press rule launched all-ins on army strength alone into Turrets and an
HQ gun on the short map, never counting the base's defences); (3) Last Fist's volume on the big maps (it sells buildings for
Habitats and fields 77-100 supply on Three-Lane).

### Part D2: two changes tried, one kept (audit/logs-p1/selfplay6f-d2/D2.md)

| change | aimed at | result | kept |
|---|---|---|---|
| the Bloomhost AI plays 6e's one-army lane rule on lane maps | cause 1 | Bloomhost on Three-Lane 28 → 36%, but 0-15 there against Last Fist; Last Fist 69% and the Axiarchs 25% on Three-Lane, the Axiarchs 41% overall | no (removed) |
| a press base attack needs its army ≥ (the enemy army known + the base's known defences) × 1 (`press6f`, `B6FAI.press`, b6fai) | cause 2 | every faction-map 36-53% (Last Fist on Classic 31 → 42%, Bloomhost on Classic 67 → 50%, on Three-Lane 28 → 42%); Last Fist vs the Turtle on Classic only 0-12 → 2-10 | yes |

### Final confirmation (audit/logs-p1/selfplay6f-final/: seeds 600+ and 1000+, 324 matches, every switch on)

Last Fist 108-81-27, 50% (43-57); Bloomhost 93-104-19, 43% (37-50); the Axiarchs 90-106-20, 42% (35-48). Per map (Classic /
Two-Lane / Three-Lane): Last Fist 47 / 46 / 57%, Bloomhost 49 / 42 / 39%, the Axiarchs 49 / 40 / 36%. Pairings: Last Fist vs
Bloomhost 56%, vs the Axiarchs 44%, Bloomhost vs the Axiarchs 54%. Personalities: Boomer 41%, Economist 45%, Turtle 49%. Every
target is met on its point estimate; the Axiarchs sit at the 42% floor (38% on the second seed set alone) and are the next item.

### Tests after b6fai and b6f

- Fast suite: every pinned older switch set holds b6fai and b6f off (determinism, the rework tests and the rest; FP_V295 and
  every older set match). Changed for an intended effect: tests/rework-6e.test.js's b6e price checks and tests/costs6e-ui.test.js
  hold b6f off (b6f undoes that conversion; tests/rework-6f.test.js and tests/rework-6f-ui.test.js check v2.94's prices with it
  on); tests/axiarchs-ui.test.js reads "Base" on the warp card (the player's new default). tests/rework-2a.test.js's switch list
  gains b6fai and b6f.
- Slow suite: see KNOWN_ISSUES.md "Batch 6f" for the run and any test measured over 20 matches.

### Departures

- Part A's bug was rarer than 6e suggested (8 of 324 sides at v2.95, the affected sides 6-0-2); the fix is kept as a correctness fix.
  The player's own Attack order still walks to the map's edge (the request covered the AI only).
- Part C: the player could already move the warp point (the card); only the default changed, because it repeated the AI's fault.
- Part D: one change ships, not two. The first tried was measured and removed; the second's gains are not concentrated on the
  matchup it targets (Last Fist vs the Turtle on Classic 2-10), so part of its effect is the reshuffle any AI rule causes.

## Batch 6g: playtest fixes (smart warp-in, attack orders, units under fire, node play, the Purification Beam, the Wraithwing)

**Batch 6g (v2.97): seven fixes from the owner's iPhone playtest against Hard (8 matches, every faction and map).** One switch,
`REWORK.b6g` (src/sim/rework-6g.js), per game in `g.rw`, on by default, saved only when on, with a Test Range switch ("Batch 6g
fixes"). With it off the game is v2.96 exactly: every pinned set matches under its own switches (the old sets, FP_V296A, FP_V296;
every older set now holds b6g off), and the v2.96 build's own self-play replays tick for tick (audit/logs-p1/selfplay6g-base/:
162 of 162 matches identical in winner and length to 6f's seeds-600 run). Recorded: FP_V297 (every switch on),
tests/determinism.test.js. No unit value changed. Measured with read-only counters (audit/sim/b6g-instrument.js, through
audit/sim/audit6a.js with `EE_B6G=1`), scenario runs (audit/sim/b6g-scen.js), Test Range runs (audit/sim/b6g-range.js) and 6c's
persona-balanced self-play; tables from audit/sim/b6g-report.js. Logs: audit/logs-p1/b6g/, selfplay6g-base/, selfplay6g-after/.
Tests: tests/rework-6g.test.js, tests/rework-6g-ui.test.js.

### The live build and phone caching

GitHub Pages' last deployment ("pages build and deployment" run 106) built cb32198, v2.96 (this session can't reach
tjdawgy.github.io itself: the host is outside its network policy; the run was read from the GitHub API). One way a phone could keep
an older version: the service worker (sw.js) fetched the page network-first, but through the browser's HTTP cache, and GitHub
Pages serves index.html with `max-age=600`, so for up to 10 minutes after a deploy an online phone could be handed the previous
copy, and the service worker then cached that copy. Fixed: the page is fetched with `cache: 'no-cache'` (revalidated with the
server every time; a navigation request can't be copied with options, so it is fetched by URL), and the cache is renamed
(`extinction-event-v2`) so every installed copy drops the old one once. Not fixable from the page: an installed app that stays
open in the background keeps the version it loaded until it is closed and reopened (the version label on the title screen shows
which one is running).

### 1. Smart warp-in (the Axiarchs, the AI and the player)

Where new Axiarch units appeared at v2.96 (traced in every match of the v2.96 self-play; audit/logs-p1/b6g/warp.md): every unit
from a base Gate warped in at its side's warp point (startWarp → warpAt): for the AI v2.94's front edge of the frontmost field
patch, or on the lane maps under b6elane a field spot beside the middle of its army on its focus lane; for a human player with no
point of its own the field spot nearest the base rally point (6f), else the point set with the Train tab's card. A Genesis Gate on
a forward pad skipped all of that: its units warped in at the pad's forward flag (fwdRally), the AI's and the player's alike: the
owner's "units spawn at the gate instead of my warp point". And on the lane maps a warp spot had to lie within LANE_V (115) of the
map's middle line (warpOk), so a point in an outer lane slid along rings toward the middle or fell back to the Axis.
Measured in every match of the v2.96 self-play (162 Hard vs Hard; audit/logs-p1/b6g/selfplay.md): of 9,738 Axiarch AI warp-ins,
2,291 (23.5%) died within 15 s; 27.5% arrived within 150 of an enemy unit and 34.5% inside an enemy weapon's reach. Classic was
worst (43.0% dead within 15 s, 65.9% in reach: the front edge of the field is the fight on the short map); Two-Lane 16.1%,
Three-Lane 17.8%, where forward Gates' units died 61 of 288 (21%). A scripted Axiarch player (the AI's macro, its units under
direct control with no warp point set, 18 matches, audit/logs-p1/b6g/player.md): 22.2% dead within 15 s, 27.5% in reach.

Changed (b6g, `warp6g`, used by startWarp for every Gate, base or forward, and for echoes): the AI's units warp in at the field
spot nearest the rear of its main army (`rear6g`: the densest group of its ground fighters, the fifth rearmost of them, 80 further
home) that is safe (`safe6g`: no enemy unit it can see within 240 (`B6G.aiSafe`), no enemy weapon it can see or remembers
reaching the spot plus 60); with no army (under 2 ground fighters) or no safe spot within 600 of that rear, the safe spot nearest
its base rally point. Its reinforcement gathering point (aiSmartArmy's Axiarch `backU`) is the same point. A player's units warp in
at the player's own warp point for every Gate, forward pads included, unless an enemy it can see stands within 150 (`B6G.safe`)
or an enemy weapon reaches the spot (+20): then at the nearest safe field spot; with no point set, at 6f's spot beside the base
rally point under the same rule. The spot is checked again when the 2 s channel ends. A Phase Beacon bubble keeps v2.96's point
for the AI and for a player without a point of its own. On the lane maps a warp spot may lie anywhere on open ground. The warp
mark the player sees shows the spot the next unit takes (`warpMark6g`).
After (b6g on, the same 162 matches): 18.2% died within 15 s (Classic 43.0 → 25.8%, Two-Lane 16.1 → 19.0%, Three-Lane 17.8 →
12.6%); arriving within 150 of an enemy 27.5 → 9.4%, in an enemy weapon's reach 34.5 → 16.6%; forward-Gate arrivals 393 → 0. The
scripted player: 22.2 → 14.6% dead within 15 s, in reach 27.5 → 12.9%, within 150 of an enemy 21.6 → 6.5%. Two-Lane's death share
did not fall: fewer arrive in the fight (in reach 25.2 → 17.7%), but units warping in beside the army's rear on the outer lanes (now
allowed) walk into its fight within the 15 s. tests/rework-6g.test.js: a unit from a Genesis Gate on a forward pad appears at the
player's warp point (b6g off: at the pad's flag); a set point is kept until an enemy stands within 150, then the nearest safe spot;
the AI's spot is 150+ clear of a Marine near its army (screenshots rework6g-warp-behind, rework6g-node-gate).

### 2. Attack orders stop at the enemy HQ (the player and every AI)

At v2.96 the player's Attack order walked each unit down its lane to the map's edge (units.js: `L` or 0; 6f's `end6f` covered the
AI only), and an army that did stop at the HQ (6e's `end6e`, 6f's `end6f`) stood beside an HQ it couldn't hurt while its shield
was up, with the buildings holding it on pads out of reach. Changed (`end6g`, every all-in attack: the player's Attack order and
an AI's base attack with no push line): while the enemy HQ's shield is down, the attack ends at the HQ plus 60 (6f's spot); while
it is up, at the building holding it that the side knows of (in sight or remembered from the fog) nearest each unit; none known,
the HQ. The player's attacking units also take the HQ and the shield's holders first (`bbFocus`, as the AI's base attack does).
Every AI path was checked again: raids, capture groups, the relic group and scouts aim at their own spots; field and siege pushes
stop at a line short of the base; the base attack's staging point is outside the HQ gun; breakthroughs and the late commit are
all-in attacks with no push line (`end6g`). The one remaining case was the shielded HQ with its holders behind it, fixed above.
6f's edge counters: no side stood past the enemy HQ at v2.96 (6f's fix); with b6g one side of 324 (an Axiarch side on Two-Lane, 347 s),
fighting shield holders on the base's back pads with enemies in sight all the time, the case end6g sends it to. tests/rework-6g.test.js: on Classic, Two-Lane and Three-Lane, six Tanks given Attack just outside
the enemy base never pass the HQ by more than 140 and hit the HQ (unshielded) or the building holding its shield; with b6g off on
the lane maps they walk past a shielded HQ to the edge (screenshot rework6g-attack-hq).

### 3. Units under fire respond (every faction, the AI and the player)

At v2.96 a standing or attack-moving unit did nothing about an enemy shooting it from beyond its reach: melee units chase only
within their chase range (150-160) and, on Hold, only within 80 of their spot, so Marines (range 120) and Artillery (440) behind a
screen shot Bloomhost melee to pieces. Changed (`hurt6g`, `fire6g`): every hit records who dealt it (projectiles carry their
shooter, `p.by`). A unit that is holding (the player's Hold, an AI on Hold or on Retreat at home) or attacking down a lane with
nothing in reach (the player's Attack once on its lane, an AI's attack stance), hit in the last 0.6 s by an enemy it can't hit
from where it stands: charges it if its weapon can hurt it and it is in sight within 250 of where the unit stood (gives up after
8 s or 310 from that spot, and fights whatever comes into reach first); otherwise pulls back toward its rally point holding fire,
until it is 40 beyond that enemy's reach or 6 s pass, then waits 5 s before it pulls back again. Then it takes up its order again.
Never on a move, target or retreat order, never siege-locked, deployed, burrowed or support units; an attacking unit never pulls
back from a building ahead of it (the HQ gun outranges every unit; pulling back from it would undo every base attack). Test Range
(audit/sim/b6g-range.js, 20 seeds each; audit/logs-p1/b6g/range.md): 6 Skitterlings and 2 Bulwarks on Hold with 6 Marines on Hold 115 away: Marines left after 30 s 2 → 0 (b6g off / on); the same
melee under 2 Artillery 400 away behind 4 Marines: they pull back out of the Artillery's 440 and return to their spot, health left
1,366 → 1,391 of 1,560 (a small gain: each return walks them back into its reach, as the rule says; held units that stayed back
would lose their spot) (screenshot rework6g-melee-charge).

### 4. The Bloomhost AI contests nodes

Diagnosis (audit/logs-p1/b6g/nodes-before/: Last Fist vs Bloomhost on Two-Lane and Three-Lane, both sides, every personality
pair, 36 matches; the Last Fist side takes its own half's nodes and turrets every forward pad it holds as soon as it can pay,
audit-only forcing, `EE_B6G_FORCE=lfturret`; the Last Fist AI's own logic untouched): the Bloomhost AI had no rule of its own for a guarded node: its capture groups (aiCapture: 3 units, need = the enemy
units it knows near the node × 1.3 + 150) and raids (aiRaid: 4 fast units) never count buildings; they only go for the centre,
the watchtowers, the depots and Classic's node 0/2, so a lost outer node or forward pad was never a target of its own, and nothing
aimed at the turrets. Of 935 groups it sent at a node an enemy gun covered, 45 (4.8%) took it; mean group value 218 against
3,137 of gun health there (2 Turrets). Army size: 2-4 units; target choice: whatever node the capture rule names, turrets last
(units score first); timing: every 15 s from 2:30, whatever the guns. Bloomhost lost 32 of 36 (1-32-3).
Changed (`aiNode6g`, Normal and Hard): see the code comment in src/sim/rework-6g.js; in short, an assault (`side.capN`) at a node an
enemy gun guards (or an outer node it lost on a lane map), only when it can send 1.4× the defence it knows or presumes (every gun
it can see or remembers within 340, 2.2 × its cost × tier; a forward pad it can't see counted as a turret; plus the enemy units
near it × 1.3), at least 450 and 4 units, building-breakers first (the weapons with the highest building multiplier); the group
gathers out of the guns' reach, then goes in aiming at the guns (`u.n6f`). A node it lost comes first.
Measured on the same 36 matches (audit/logs-p1/b6g/nodes.md): Bloomhost retook a node in 26 → 29 of 36 matches (87 → 94 retakes in
all), destroyed pad buildings in 35 of 36 either way (1,170 → 1,059; 32.5 → 29.4 a match; the forced Last Fist rebuilds them as fast
as it can pay), and went 1-32-3 → 1-30-5. Its groups at a guarded node: 935 → 1,037, 4.8% → 5.0% taking it (mean value 218 → 289).
The assault rarely fires (the Bloomhost army is seldom 1.4× a two-Turret node with Last Fist's army near), so the fix changes
what it attempts more than what it achieves here; this forced scenario (every own-half node and pad held and turreted from the
start) is far harder than the owner's own play. Not met: a clear rise in retakes and turret kills.

### 5. Every AI fortifies the nodes it holds

What each AI built on nodes at v2.96: on the lane maps `aiForward` (Normal and Hard) put its faction's turret (Turret, Maw, Null
Lance) and then its production building (Barracks, Larva Pit, Genesis Gate) on forward pads of nodes it held on its own half,
every 90 s with 1,000 banked, at most 1 (Normal) or 2 (Hard; 2 and 3 on Three-Lane) in all; Last Fist's node bunkers come with
its Fortification Depot on every income node it holds; Classic has no pad on any node, so nothing else can be built there.
Changed (`aiFort6g` replaces aiForward's turret choice): every 20 s, no threat at home, its turret on a free pad of a node it holds
when the node is safe (no enemy unit it knows within 450 in the last 15 s, no enemy gun it knows reaching the pad) and it can pay
with a reserve left (Boomer 500, Economist 300, Turtle 150): contested nodes first (an enemy seen near it in the last 90 s), then
the nearest the enemy; per personality at most 1 / 1 / 2 per node and 2 / 3 / 5 in all (Boomer / Economist / Turtle; the Boomer only
on contested nodes; Normal capped at aiForward's old total); its one forward production building stays as before.
Measured (lane maps, 108 matches each way; audit/logs-p1/b6g/selfplay.md): forward-pad turrets a side and match, Last Fist 1.74 →
4.56, Bloomhost 1.25 → 3.76, the Axiarchs 1.17 → 2.44; nodes fortified a side and match 0.99 / 0.75 / 0.64 → 1.68 / 1.40 / 1.07; by
personality, turrets Boomer 1.17 → 2.51, Economist 1.40 → 3.56, Turtle 1.58 → 4.69. A hold of a node lasted 472-494 s when fortified
and 240-293 s when not (448-474 and 232-281 at v2.96: holds that get fortified are longer, before and after). Nodes held at 6 / 10 /
14 minutes: Last Fist 4.2 / 4.8 / 5.7 → 4.1 / 5.1 / 5.6, Bloomhost 4.3 / 5.9 / 7.1 → 4.7 / 6.1 / 6.5, the Axiarchs 3.6 / 3.5 / 3.1 →
3.8 / 3.6 / 3.8 (screenshot rework6g-fortified-node).

### 6. The Purification Beam on any lane

What limited it: its strip had to be centred within LANE_V + 25 of the map's middle line (abilityCheck: "needs a spot on the lane")
and its centre was clamped to ±LANE_V (useAbility, the AI's aiStrikeTarget, the aiming strip). LANE_V is half the width of the map's
first lane (115): right for Classic's one lane; on Three-Lane only the centre lane lies there (the outer lanes run at up to ±400),
and on Two-Lane neither lane does away from the bases. Its range was never the limit (any explored ground). Changed: on a lane map
the strip may be centred anywhere within a lane's half width + 25 of any lane's centre line and stays where it was aimed (same
strip, damage and sweep); the AI scores and aims it on every lane (`beamV6g`). Classic unchanged. tests: aimed at the north lane on
Three-Lane, a Tank there takes the full 240; with b6g off, refused (screenshot rework6g-beam-lane).

### 7. The Wraithwing keeps its target

At v2.96 a Wraithwing (batch 4a: hops every 0.9 s, a bolt on each landing) took acquire's best target afresh every tick and at every
landing, and its landing bolts ignored a player's target order. Changed (`ww6g`): it keeps its target (`u.wwK`) through every hop
while it is alive, in sight and in reach when it lands; a target order sets the kept target. Hops, timing and the 0.4 s untargetable
window are unchanged. Test Range: 4 Wraithwings attacking 8 Marines (target orders): all 8 dead in 7.8 → 7.6 s (mean, 20 seeds); on Hold beside them (each
picking its own targets, as in a match) 8.2 → 7.8 s. The kill time was already short in a clean Test Range fight; the kept target
mostly removes the spread of bolts over the group (tests: at most 2 switches from a living target in 20 s, b6g on).

### Measured: persona-balanced self-play (audit/logs-p1/selfplay6g-after/, against selfplay6g-base/ (v2.96, b6g off); 162 each, 0 errors)

| faction | v2.96 (seeds 600+) | b6g on | 6f's 324 |
|---|---|---|---|
| Last Fist | 52-43-13, 48% (39-57) | 47-44-17, 44% (35-53) | 50% (43-57) |
| Bloomhost | 46-54-8, 43% (34-52) | 40-58-10, 37% (29-46) | 43% (37-50) |
| Axiarchs | 49-50-9, 45% (36-55) | 56-41-11, 52% (43-61) | 42% (35-48) |

Per map (Classic / Two-Lane / Three-Lane), b6g on: Last Fist 33 / 44 / 53%, Bloomhost 53 / 31 / 28%, the Axiarchs 56 / 56 / 44%.
Pairings: Last Fist vs Bloomhost 50%, Last Fist vs the Axiarchs 37%, Bloomhost vs the Axiarchs 39%. Personalities: Boomer 33%
(25-43), Economist 49%, Turtle 50% (v2.96: 39 / 46 / 51%); Bloomhost's Boomer 7-29 (19%; 28% at v2.96). Median length 16:02 (v2.96
15:05; Classic 11:32 → 9:58), draws 15 → 19, ended by an HQ 91 → 88%. Bloomhost (37%) is under 40%: its losses come on the lane
maps (Two-Lane 36 → 31%, Three-Lane 42 → 28%), mostly to the Axiarchs (26-26-2 → 21-31-2), whose warp-ins now survive, and from
its Boomer against Turtles that fortify more. Read as ±10 points
(single 162-match runs moved up to 14 points between seed sets in 6f). No unit value was tuned.

### Tests after b6g

- Fast suite: every pinned older switch set now also holds b6g off (determinism, rework tests and others; FP_V296 and every older
  set match). Failing with b6g on, each a deterministic scenario (one run decides it, no seed variance), each an intended effect,
  held b6g off with a counterpart in tests/rework-6g.test.js that checks the same intent with it on: tests/axiarchs-field.test.js's
  three warp-point tests (an AI side warps in at the safe spot, not the field's front edge); tests/controls.test.js's "a target"
  (the other Marine, shot at from beyond its reach, charges; one Tank is still re-spacing 3 s after the kill: Hold after 8 s);
  tests/orders-weapons.test.js's Emergency Brood test (the enemy Tank, shot by a Cloudwing it can't hit, pulls back and the offspring
  follow it: counterpart with a Hydra, which can shoot back); the forward-pad tests in tests/twolane-ai.test.js and
  tests/threelane.test.js (aiFort6g's caps by personality: counterpart checks Easy none, Normal within the old cap, Hard by
  personality, one forward production building on its own half); twolane-ai's forward-Barracks test for the Axiarchs (a forward
  Gate's unit warps in at a safe spot: counterpart). tests/rework-6f.test.js's b6fai-off and b6f-off cases hold b6g off too (b6g's
  end6g and warp6g supersede them). Two regressions found by the suite and fixed: a unit hit by a shielded enemy HQ charged it (it
  can't hurt it; orders-weapons' "every combat unit stops to fight" and its 6c twin), and an attacking unit passing beside the HQ
  pulled back from it; now nothing charges a shielded or untargetable enemy and an attacking unit never responds to a building.
  tests/rework-2a.test.js's switch list gains b6g.
- Slow suite: 26/26 after one bar change: tests/slow/ai-stats.test.js's Bloomhost Skitterlings 100% → 90% (95% over 20 matches with
  b6g on and with it off: seed variance; audit/logs-p1/b6g/slow.md). `npm test` 815/815, `npm run test:slow` 26/26 on v2.97.

### Departures

- Fix 4 is in and tested (an assault only with 1.4× the defence it knows or presumes, building-breakers first, lost nodes first,
  aimed at the guns), but in the forced-turret scenario it barely moves the outcome: retakes 87 → 94, pad buildings destroyed
  1,170 → 1,059, Bloomhost 1-32-3 → 1-30-5. Tried along the way and replaced: turrets weighed at 2.2× their cost (assaults of 8
  units against 2 Turrets, lost), assaults at undefended nodes too (split the army on Classic: matches 700 → 1,100 s).
- Fix 3 follows the rule as written, so a unit on Hold pulled out of an Artillery's reach walks back into it after 5 s; an
  attacking unit is exempt from pulling back from a building ahead of it (the HQ gun would otherwise turn back every base attack).
- Fix 7 is real but small in the Test Range (8 Marines: 8.2 → 7.8 s on Hold); the owner's "takes forever" was not reproduced there.
- The AI's warp spot keeps a wider berth than the player's (240 and weapon reach + 60, against 150 and + 20), after the first
  measurement left Two-Lane warp-in deaths up (16 → 19%); the narrower rule is the spec's floor, and both meet it.
- The forced-turret scenario first let Last Fist re-take its nodes all match (every Bloomhost retake undone at once); it was rerun
  with the forcing limited to the first 5:00, as "early" asks.


## Batch 6h: the Bloomhost ground rework, unit bodies, the Bloomhost node fix

**Batch 6h (v2.98).** Three switches in src/sim/rework-6h.js, per game in `g.rw`, on by default, saved only when on, each with a
Test Range switch ("Batch 6h Bloomhost", "Batch 6h bodies", "Batch 6h nodes"): `REWORK.b6h` (parts A-D, F), `REWORK.b6hbody`
(part E), `REWORK.b6hnode` (part G). All three off: v2.97 exactly (FP_V297 and every older set match; the forced-turret scenario
at v2.97's rules reproduces 6g's numbers to the match: 94 retakes, 1,059 pad buildings destroyed, 1-30-5). Recorded: FP_V298
(every switch on). Art: src/render/units-rework-6h.js. Tests: tests/rework-6h.test.js, tests/rework-6h-ui.test.js. Measurement
scripts: audit/sim/b6h-range.js (Test Range), b6h-choke.js (chokes and cost), b6h-bodies.js (the body table), b6h-instrument.js
and b6h-node-report.js (node decisions, `EE_B6H=1`), b6h-report.js (swarm metrics). Logs: audit/logs-p1/b6h/.

### Step 0

- GitHub Pages: "pages build and deployment" run 107 built f0bb5a9 (v2.97) and succeeded (2026-11-26 12:47 UTC).
- The roster in the code matched the brief, with one source of Mites the brief doesn't list: a Brood Tyrant's pustules burst into
  Mites when the building dies (batch 4b). They count toward the new cap of 30 and use the new Mite.

### The roster with b6h on

| building | start | path A (T2 / T3) | path B (T2 / T3) |
|---|---|---|---|
| Larva Pit | Skitterling, **Spitter** | Predatory Evolution: Leaper (reworked) / Ravager (+Pounce) | Acidic Evolution: **Queen** (new) / Bilecaster |
| Evolution Chamber | **Chitin Warden** (the Bulwark reworked) | Burrowing Evolution: Gorebore (+Pounce) / Ruinmaw (reworked) | **Behemoth Evolution**: **Broodback** (new, replaces the Thornback) / Dreadthorn (+Pounce) |
| Bloomspire | Razorwing | Swarm Bloom: Needlewing / Cloudwing | Apex Bloom: Brood Tyrant / Worldrender |
| Brood Mound | Mite (free; the Queen and pustules make them too) | | |

### Part A: faction-wide (b6h)

- **Pounce** (`pounce6h`, `B6H.pounce`): the Ravager, the Chitin Warden, the Broodback, a surfaced Gorebore and a Dreadthorn whose
  charge is recovering lunge at an enemy ground unit within 90 they are not yet in contact with (nothing in reach), while
  attacking, attack-moving, on a target order or engaged on Hold (within the Hold reach of their spot): 2.5× speed for 0.4 s,
  every 4 s (`u.pcT`, `u.pcCd`). Never on a move order (a player's 'go', a Regroup) or a retreat. Visual: the unit crouches and
  stretches forward while it lunges, a streak in its side's colour behind it, a dust puff where it started.
- **The loose swarm** (`LOOSE6H`, `B6H.loose`): Skitterlings, Spitters, Leapers, Queens and Mites keep 10 px more between them
  while moving or idle (5 px each on top of the body), normal body spacing once they fight. Passive spacing only: nothing reads
  shells. With b6hbody off it runs as its own light separation among those five (radius 4 + 5).
- **The Mite** (`B6H.mite`; the one type, `UDEF.mite` played through rwD): **30 HP, speed 64, bite 4 every 0.6 s (range 20)**;
  its bite corrodes like the Spitter's acid (the Spitter's own corrode: +12% damage taken for 5 s; same strongest-wins,
  second-slot rules, never past the 25% cap); lives **10 s**; no supply, outside the 60-alive limit, never captures. At most
  **30** alive per side from every source (the Brood Mound at its unchanged rate, the Queen, pustules); at the cap the Mound's
  Mites wait (owed, `m.mq`, at most one spawn's worth) and the Queen's timer waits; pustules burst into what fits. New art: a
  tick under a big carapace in its side's colour with a green corrosive bite.

### Part B: the Larva Pit (b6h)

- **The Spitter** is trained from T1 with no path (`canMake`; its stats unchanged: 70/20, 110 HP, quill volleys, anti-air).
- **The Queen** (new, `queen`, Acidic Evolution T2 where the Spitter was): **150/50, army 3, 260 HP, speed 26, bile bolt range
  150, 10 every 1.4 s, air and ground, corrodes** (the Spitter's corrode). While an enemy (a unit or a gun building) she can see
  is within 300 she births a Mite every 2.5 s, up to 6 of her own alive (within the side's 30): a bile arc from her hand to the
  new Mite. Her Mites (`u.qm`) fight her target or enemies within 250 of her, never stray past 250, and guard a ring around her
  when there is nothing to fight (a player's own order for a Mite comes first). The AI keeps Queens behind the melee on the
  attack and pulls one back for 3 s when she loses 20% of her health in 3 s. No limit on Queens.
- **The Leaper** (Predatory T2): leap range **140 → 260**, cooldown **7 → 10 s**; targets in order Artillery and deployed siege,
  then ranged units (range 100+), then vehicles, walkers and big units, then any other ground unit (`latchTier6h`); airborne it
  passes over bodies; landing stuns every enemy ground unit within 40 for **0.6 s** (the Dreadthorn's daze, `u.dzT`; stars over
  them); it latches onto any ground unit, eating **55/s** on vehicles, walkers and big units and **30/s** on small ones. Kept:
  3 per host, the 30% host slow, Skitterlings hatching when a host dies. It leaps only at what its side can see.
- **The Ravager and the Bilecaster**: unchanged; the Ravager gets Pounce.

### Part C: the Evolution Chamber (b6h)

- **The Chitin Warden** (the Bulwark, id `bulwark` kept; name, description and art follow b6h): 140/25, 840 HP, brace and creep
  regeneration kept, Pounce. **Aura, radius 140: Bloomhost units inside take 40% less area damage; a second Warden adds
  nothing** (`u.wd6`, `ward6hCut` in damage1). A faint plate shimmer over units inside it. New art: an upright guardian behind a
  wall of overlapping team plates with two shield-like forelimbs (the Dreadthorn is a long, low charger).
- **Area damage** (`AREA6H`): splash on anyone but the primary target (splashHit and its variants), plus every attack whose effect
  is an area. Every source in the game:
  splash on others than the target hit (splashHit): the Tank's cannon (26), the Titan's siege gun (34), the Bilecaster's dart
  (b4a off: its glob), the Ruinmaw's v2.82 acid hit, the Brood Tyrant's glob (24; batch 4b's splash on ground units too), the Rift
  Mortar's shot; whole-area shots (every unit hit counts): Artillery shells (each salvo shell, splash 40), the Bile Lobber's lob, the
  Leviathan's bombs and carpet (40), the Worldrender's crush (70), the Astral Sovereign's falling mass (b4b off), the Rift Mortar's
  rift; the Flame Tank's strip; the Purification Beam's sweep; the Orbital Strike; meteors; the Worldbreaker's crack (rupture); the
  Severance's rift orb (exile); the Bilecaster's bile glob and pools; the Ruinmaw's v2.82 acid pools and the Worldbreaker's
  distortion zones (acidpool); Spore Cloud (spores); the Gorebore's eruption; the Dreadthorn's spine burst (b3b off) and trample;
  the Mound's Mite acid burst; batch 6h's eruption and Bile Bloom; the Sniper's pierce through the units behind its target; the
  Shardstorm's chain jumps (not its first target). Not area: every single-target shot, beam and bite (Marines, Heavies, Null
  Lance and Axis lance, Lancer, Marksman, the judgement beam, melee), a Leaper's latch, pustules (buildings only).
- **The Broodback** (new, `broodback`, Behemoth Evolution T2; the path renamed from Predator Evolution; the Thornback is gone with
  b6h): **180/40, army 3, 520 HP, speed 22 (80% of the Thornback's 28), bite 12 every 1.2 s (range 30), Pounce**. Dying it bursts
  into **3 Skitterlings** (fewer at the 60-alive limit) that take its order (a player's order copied; an AI's hold spot), and
  leaves a **Bile Bloom** (radius 50, 6 s): enemies inside take **10/s** (area damage), Bloomhost units inside attack **+20%**
  faster and move **+15%** faster. The AI's Broodbacks lead a push: the swarm waits behind the frontmost.
- **The Ruinmaw** (400/150, 1,500 HP unchanged): surfacing erupts: **120 damage to enemy ground units within 70, knocked 30
  aside**; it can dive again **15 s** after surfacing; every **8 s** surfaced it swallows an adjacent enemy ground unit (never a
  huge one) for **3 s at 80/s**, spat out alive at the end or when it dives or dies. **Tunnel**: the Tunnel button (Bloomhost
  ground units selected, a Ruinmaw surfaced): the selected units standing on their own creep burrow where they stand and travel to
  it at **300 px/s, at least 2 s**, coming out of its mouth **two a second**; units off creep stay ("N not on creep stayed"). If
  it dives or dies with units inside, they come up where they went down. **Rally**: select a surfaced Ruinmaw alone and tap Rally:
  every Larva Pit and Evolution Chamber of yours sends its new ground units into the tunnel from the building (`b.rm6`; tap again
  to rally home); while the Ruinmaw is down (moving) new units appear at the building as usual. A dirt trail runs from where each
  unit went down to the Ruinmaw while it travels; nothing is instant.
- **The Gorebore and the Dreadthorn**: unchanged, with Pounce (the Gorebore surfaced only, the Dreadthorn only while its charge
  recovers).

### Part D: the Bloomhost AI (b6h, every personality and difficulty)

Openers rolled once a match by personality (`aiOpen6h`, `OPEN6H`: swarm / Spitters / mixed; Boomer 45/25/30%, Economist
30/35/35%, Turtle 20/50/30%), leaning the first 5:00 of its scores; Queens scored for anti-air and infantry (fewer once there is one
per 8 swarm units) and kept behind the melee, pulling back when focused; Chitin Wardens wanted whenever the enemy fields area
damage (one per 12 army supply); Broodbacks scored as the push's front and leading it; Leapers dive the backline (siege and ranged
first; the AI aims them at tier 0-1 targets); the Ruinmaw also surfaces beside the enemy-held node its guns cover least, the army
on its creep tunnels through, and production rallies to it while it holds its spot (`aiRuin6h`); the Thornback's scores became
the Broodback's (`thornback` in the flood rule too); the Larva Pit no longer takes Acidic Evolution just for anti-air (the Spitter
is there from the start).

Measured over the 162-match self-play with every switch on (audit/logs-p1/selfplay6h-on/b6h.md; per Bloomhost side and match):
Queens 4.1 (Boomer 2.0, Economist 4.6, Turtle 5.8), Broodbacks 4.9, Chitin Wardens 27.5, Leapers 12.8, Spitters 27.2, Skitterlings
56.7 (broods count 4), Gorebores 2.9, Ruinmaws 0.8; Tunnel trips 18.2 units a match (a Tunnel in 30 of 108 Bloomhost sides: Boomer
13, Economist 9, Turtle 8), 7.9 units rallied to a Ruinmaw, 3.6 eruptions, 0.5 swallows; Queens pulled back when focused 5.9 times.
Openers (Boomer / Economist / Turtle): swarm 20 / 6 / 4, Spitters 10 / 16 / 14, mixed 6 / 14 / 18. The Thornback is never trained.

### Part E: unit bodies (b6hbody, every faction)

Every ground unit has a body from its drawn footprint (audit/sim/b6h-bodies.js reads the render's shadow radius and sprite box:
footprint = max(shadow radius, 0.3 × box width), classes small ≤ 11.5, medium ≤ 16, large ≤ 22, huge above), radius in screen px
small 7, medium 10, large 14, huge 20, mass 1 / 2 / 4 / 9 (`BODY6H`). Each tick (`body6h`, after the units move) ground units
closer than the sum of their radii less 2 px (allies and enemies alike) are pushed apart by half the overlap, shared by mass, at
most 70 px/s: soft, so movement stays smooth. A unit fighting from where it stands holds its line (mass × 3); a standing unit
makes way for one on the move (mass × 0.5, and its hold spot moves with the push, so it doesn't shove back). A melee unit and its
target are never pushed apart, so melee stops at the target's edge. Aircraft separate lightly from each other (15%) and fly over
ground units; burrowed, exiled, tunnelling, leaping and latched units have no body. Buildings unchanged. A spatial grid (40 px
cells) keeps the cost flat. A unit on a move whose spot bodies keep it from (within 3 body radii, no closer for 1.5 s) has arrived
(`bodyNear6h`). Formations (ctlPack, so Test Range placement and every player's move) space units by at least their bodies.

The body table (audit/sim/b6h-bodies.js; art units; radius in screen px):

| unit | shadow radius | sprite box width | footprint | class | radius px | in BODY6H |
|---|---|---|---|---|---|---|
| Marine | 9 | 26 | 9 | small | 7 | small |
| Mite | 7 | 30 | 9 | small | 7 | small |
| Sniper | 9 | 33 | 9.9 | small | 7 | small |
| Shardling | 8 | 36 | 10.8 | small | 7 | small |
| Skitterling | 9 | 38 | 11.4 | small | 7 | small |
| Lancer | 10 | 38 | 11.4 | small | 7 | small |
| Heavy | 12 | 28 | 12 | medium | 10 | medium |
| Leaper | 11 | 42 | 12.6 | medium | 10 | medium |
| Riftstalker | 9 | 42 | 12.6 | medium | 10 | medium |
| Parallax | 12 | 42 | 12.6 | medium | 10 | medium |
| Astral Marksman | 9 | 42 | 12.6 | medium | 10 | medium |
| Spitter | 11 | 44 | 13.2 | medium | 10 | medium |
| Severance | 10 | 48 | 14.4 | medium | 10 | medium |
| Queen | 11 | 48 | 14.4 | medium | 7 | small (differs) |
| Bilecaster | 15 | 41 | 15 | medium | 10 | medium |
| Gorebore | 12.6 | 50 | 15 | medium | 10 | medium |
| Flame Tank | 12.6 | 52 | 15.6 | medium | 10 | medium |
| Bastion | 15 | 52 | 15.6 | medium | 10 | medium |
| Gravemantle | 17 | 50 | 17 | large | 14 | large |
| Tank | 14 | 57 | 17.1 | large | 14 | large |
| Chitin Warden | 18 | 58 | 18 | large | 14 | large |
| Eventide | 18 | 48 | 18 | large | 14 | large |
| Hydra | 15 | 63 | 18.9 | large | 14 | large |
| Worldbreaker | 20 | 56 | 20 | large | 14 | large |
| Artillery | 12.6 | 68 | 20.4 | large | 14 | large |
| Ravager | 17 | 68 | 20.4 | large | 14 | large |
| Broodback | 21 | 72 | 21.6 | large | 14 | large |
| Titan | 19 | 94 | 28.2 | huge | 20 | huge |
| Dreadthorn | 26 | 106 | 31.8 | huge | 20 | huge |
| Ruinmaw | 28 | 112 | 33.6 | huge | 20 | huge |

**Chokes** (audit/sim/b6h-choke.js, audit/logs-p1/b6h/bodies.md; 30 mixed ground units: 10 Skitterlings, 6 Marines, 6 Tanks, 4
Wardens, 2 Titans, 2 Dreadthorns, one move order through each map's narrowest passage: Classic along its lane, Two-Lane across the
ridge's only crossing, Three-Lane through the north wall's gap; 30 s; 3 seeds): with bodies 0 stuck on every map (arrived 28-29 /
27-29 / 29 of 30, the rest slow Titans and Wardens still walking); without, 30 of 30. The first version left 1-2 units stuck in the
lane maps' gaps (standing units shoving back, and units circling a spot others held): standing units now make way for units on
the move, and a unit blocked within three body radii of its spot for 1.5 s has arrived.

**Cost** (the same script; a Test Range fight of 60 Skitterlings and 30 Mites against 40 Last Fist units, the SIM's time per tick
over 20 s, 5 runs each, Node on this machine, not an iPhone): whole tick 0.944 ms bodies off, 0.514 ms on (the fight itself
differs: with bodies the swarm reaches the line a few at a time, against Flame Tanks it burns before contact, so fewer units fight
at once); the body pass alone, timed on the state reached (130 units): **0.089 ms a tick, 9.4% of a bodies-off tick** (target: no
more than 25%). This is the first swarm-scene frame-time measurement; the render's cost on a phone was not measured.

### Part G: the Bloomhost node contest (b6hnode)

**Diagnosis** (audit/logs-p1/b6h/node.md, the forced-turret scenario at v2.97's rules: every Bloomhost node-assault decision logged
through the read-only `NODE6H.log` hook, what killed each unit; 36 matches, reproducing 6g's 94 retakes, 1,059 pad buildings
destroyed and 1-30-5 exactly):
- 6g's assault (aiNode6g) almost never went: 88 launches in 9,558 checks (0.9%); the force it could send was a median 0.26 of
  what its rule asked (1.4 × a defence that values each Turret at 4 × its cost × tier; quartiles 0.15 / 0.26 / 0.40);
- the few that went were mostly recalled before they arrived: by a threat seen near home (38) or an all-in attack starting (24),
  or called off at the gathering point (17); 4 won;
- meanwhile the capture groups and raids (3-4 units) kept walking into the guns one group at a time: 1,037 groups at a gun-covered
  node, 5.0% took it (mean group value 289 against about 3,100 health of guns there);
- what killed the assault units: Turrets 48, units 74 (Titans, Heavies, Tanks).
The main cause: the threshold is rarely met, so what does reach a guarded node is piecemeal.

**The fix tried, four ways** (36 matches each; every other switch on; retakes / enemy pad buildings destroyed / Bloomhost W-L-D):

| run | b6hnode | retakes | pad buildings destroyed | Bloomhost |
|---|---|---|---|---|
| v2.97 (all off) | - | 94 | 1,059 | 1-30-5 |
| b6h and b6hbody on, b6hnode off | off | 146 (+55%) | 1,039 (-2%) | 3-23-10 |
| v1: the whole army by fighting power, no capture groups or raids at guarded nodes | on | 129 | 824 | 3-27-6 |
| v2: v1, its own damage counted at its weapons' building rate | on | 138 | 904 | 3-29-4 |
| v3: a strike group (building-breakers first, 1.2 × the defence), building-breaker scores | on | 97 | 937 | 0-29-7 |
| v4: v2's assault, v3's scores, capture groups and raids allowed | on | 144 (+53%) | 988 (-7%) | 2-28-6 |
| **v4 on the final build (shipped; one body rule changed after: standing units make way for any unit on the move)** | on | **126 (+34%)** | **1,008 (-5%)** | 3-29-4 |

Shipped (`aiNode6h`, `NODE6`): every 5 s, with no danger inside its own base, a Normal or Hard Bloomhost AI weighs each enemy-held
node an enemy gun guards by fighting power (damage per second × health, aiPower; the guns it sees or remembers and a forward pad it
can't see as a Turret, the enemy units near the node) against its own army's, its damage counted at its weapons' building rate for
the guns' share of the defence (`myPow6h`), and sends its whole available ground army (up to 40, building-breakers first) when it
out-powers the defence 1.5 times; the army gathers out of the guns' reach, goes in only if it still out-powers them, focuses the
guns once within reach, and stays until the node, its guns and its pad buildings are down; only danger inside its base, losing 65%
of its health, or 150 s call it off (a threat near home or an all-in attack no longer recall it). Its Ruinmaw surfaces beside the
node and the army on its creep tunnels there. With two or more enemy Turrets known at enemy-held nodes its unit scores lean to
building-breakers (Gorebore +0.6, Ruinmaw +0.4, Bilecaster +0.3, Broodback +0.2). Capture groups and raids are unchanged.

**Target not met**: on the final build retakes +34% (+53% on the build before the last body change: the same rules, 18 retakes
apart, about the scenario's noise) and pad buildings destroyed -5% (asked: +50% each). Why: the unit rework itself already raised
retakes (146 with b6hnode off) and none of the behaviour fixes raised pad kills above the b6hnode-off run; Turrets killed 1,137 of
the 2,121 units the v4 assaults lost; the reworked army is Spitters, Skitterlings and Wardens (assault units by type: Spitter 1,834,
Warden 1,314, Skitterling 1,173), whose weapons do little to buildings (the scores' lean to building-breakers raised Gorebores and
Broodbacks but not enough); and the forced Last Fist rebuilds every pad Turret as soon as it can pay, so holding a node also leaves
fewer Turrets to kill there. Raising pad kills further needs building damage (unit numbers), which this batch doesn't tune.


### Part F: art, Codex, tips (b6h)

- Art (src/render/units-rework-6h.js, cached as poses): the **Queen** (a standing, hunched, plague-ridden woman in rags under a team
  shawl; one swollen bile hand glowing in her side's colour; Mites crawling down her rags), the **Mite** (a tick under a big team
  carapace, a green corrosive bite), the **Chitin Warden** (an upright guardian behind a wall of overlapping team plates, two
  shield-like forelimbs, raised while bracing; nothing like the Dreadthorn's long, low charger), the **Broodback** (a hunched beast
  with translucent egg sacs in its side's colour, a curled Skitterling in each). The Warden's and the Mite's art follows the game's
  b6h (the pose cache key carries which). Effects: Pounce (crouch and stretch, a team-coloured streak, a dust puff), the Leaper's
  landing stun (a dust ring, stars over the stunned), the Bile Bloom (a bubbling pool with a dashed rim in the side's colour), the
  eruption (a heaving ring of earth and chunks), the swallow and the spit, the tunnel (a dirt line from where each unit went down to
  the Ruinmaw while it travels, a burst where it comes up), the Queen's births (a bile arc to the new Mite), the Warden's aura (a
  faint plate shimmer over units inside it), the Queen's bile bolt. Screenshots at 667×375: docs/screenshots/rework6h-queen,
  -pounce-warden, -leap-stun, -brood, -ruinmaw, -bodies, -codex.
- Codex (follows the new-game default): the Spitter listed as a Larva Pit unit "from the start" (its T1 node: "Spawns Skitterlings
  (in broods) and Spitters"), Acidic Evolution's T2 the Queen, Behemoth Evolution (Broodback, Dreadthorn), the Chitin Warden's name
  and description, the Mite's and the Leaper's descriptions; the Thornback is gone from it. With b6h off it shows v2.97's.
- Tips (UNIT_TIPS, numbers read live): Pounce (on the Warden, Ravager, Gorebore, Dreadthorn), the Warden's aura, the Broodback,
  the Queen, the Ruinmaw's Tunnel and Rally, the Mite, the Leaper, the Spitter from the start; the tutorial's Tunnel line.
- UI: the Tunnel button sends only units on your creep and says how many stayed; a **Rally** button appears with one surfaced
  Ruinmaw selected (every Larva Pit and Evolution Chamber of yours sends its new ground units through the tunnel to it; again to
  rally home). The command bar fits four buttons at 667 wide.

### Part H: Test Range (audit/sim/b6h-range.js, 20 seeds each; audit/logs-p1/b6h/range.md)

| scene | b6h, b6hbody on | switches off (v2.97) |
|---|---|---|
| One Artillery salvo into 20 Skitterlings (standing still) | 0 killed, 66 HP lost | 0 killed, 141 HP lost |
| the same with a Chitin Warden among them | 0 killed, 55 HP lost (9 taken off by the aura) | - |
| 28 Tanks against 19 Bastions (both attacking), 12 s in | nearest neighbour 25.7 px (Tanks), 17.9 (Bastions); the Tanks cover 116 × 115 px; all Tanks dead at 51 s | 7.1 and 1.1 px; 48 × 65 px; 44 s |
| 3 Leapers sent at 6 Marines with an Artillery behind them | every Leaper's first host the Artillery (3 of 3, 20 of 20 seeds); 1 stunned on landing | every first host a Marine |
| 2 Broodbacks and 4 Skitterlings attacking 12 Marines | 3 Skitterlings burst out, 1 Bile Bloom; the Marines all dead at 35 s | - |
| a Queen attacking 8 Marines holding 170 away | she outranges them (150 against 120): 24 Mites born, 6.9 Marines killed in 60 s, she survives 18 of 20 | - |
| the same Queen holding, the 8 Marines attacking her | she dies in 6 s, 3 Mites born, no Marine killed | - |
| a Ruinmaw surfacing beside 6 Marines, then 10 Skitterlings on creep tunnelling | the eruption killed all 6 (120 against 70 HP); the 10 out of its mouth 7.1 s after the order | - |

A salvo kills no Skitterling (three shells of 15 against 50 HP); the spacing (the loose swarm and bodies) halves what one salvo takes
off a group, and the Warden's aura takes off a further 17% of it.

### Tests

`npm test` 841/841 and `npm run test:slow` 26/26 on v2.98 (quiet machine; audit/logs-p1/b6h/fast-suite-v298.txt, slow-suite-v298.txt; the slow suite passed on its first run). The first fast run failed 44; fixed as regressions: a melee unit held off its target's edge by bodies (orders-weapons "every combat unit stops to fight"), a unit pushed through a Worldbreaker ridge, the new art outside its sprite boxes (browser "unit sprite cache"), the Rally button's aria-label naming Bloomhost buildings to a Last Fist player (bloomhost-ui "the enemy faction stays out of the UI"), a test edit of mine (salvage), and rework-6b's v2.91 mirror set now holding batch 6h off; held off as intended effects with `pin6h` (tests/load-sim.js) and checked with every switch on in tests/switches-on-6h.test.js (13 tests) or tests/rework-6h*.test.js: b6hbody (bodies move units off exact spots): abilities and 6c's "Orbital Strike", ax-abilities and 6c's "Mass Warp", bloomhost-sig "Rootheart T3", controls "new units gather" and "Retreat", controls-ui and controls-refine-ui gathering, micro's type-order, Regroup and save tests, multilane "lane orders", orders-weapons warp-in on Hold, rework-3b "Dreadthorn", rework-4b "Leviathan", rework-6g's brood counterpart, techlab "Interceptor rework"; b6h: bh-trees "Larva Pit and Evolution Chamber", bloomhost-sig "Mites" and "saves v29", rework-2b's two Ruinmaw tests, rework-3a's switch and AI tests, rework-5b's AI test, rework-6b's b6art test, bloomhost-ui's Train cards; b6h and b6hbody: rework-5b "swarm surge"; b6hnode: rework-6g's node-assault test. Six re-runs left switches-on-6c's list for the same reasons. FP_V297 and every older set match with the three off; FP_V298 recorded.

### Departures

- The Spitter keeps its internal id and stats; the Chitin Warden keeps the Bulwark's id (`bulwark`), the Mite its own; the Queen and
  the Broodback are new ids, so a b6h-off game (old saves, replays) still has the Thornback and no Queen.
- The Ruinmaw's rally is set for all your Larva Pits and Evolution Chambers at once from the Ruinmaw (one button, one tap on a
  phone), not building by building; the SIM keeps it per building (`b.rm6`).
- The loose swarm's extra spacing applies only between units of the same side; Pounce counts a target order as attacking.
- The Leaper leaps only at what its side can see (its leap range, 260, is beyond its sight of 180).
- The Queen's Mites guard a ring clear of her body, and she and her own Mites never push each other.
- Part G's targets were not met; four behaviour-only versions were measured (Part G) and the brief's rule followed: no unit value
  changed.
- The bodies-off self-play ran on the build before the last one-line body change (the every-switch-on run replayed identically
  across that change; the node scenario did not, reported both).

## Batch 6i: the Bloomhost air rework, the under-fire response rework

**Batch 6i (v2.99).** Two switches in src/sim/rework-6i.js, per game in `g.rw`, on by default, saved only when on, each with a Test
Range switch ("Batch 6i air", "Batch 6i response"): `REWORK.b6i` (parts A-D: the Bloomspire roster, its AI, art and texts, the
Chitin Warden quota) and `REWORK.b6iresp` (part E: units under fire). Both off: v2.98 exactly (FP_V298 and every older set match).
Recorded: FP_V299 (every switch on). Art: src/render/units-rework-6i.js. Tests: tests/rework-6i.test.js, tests/rework-6i-ui.test.js,
tests/switches-on-6i.test.js. Measurement scripts: audit/sim/b6i-range.js (Test Range), audit/sim/b6i-report.js (the air tables of a
self-play run). Logs: audit/logs-p1/b6i/, audit/logs-p1/selfplay6i-on/.

### Step 0

- GitHub Pages: "pages build and deployment" run 108 built 16ef576 (v2.98) and succeeded (2026-11-26 21:34 UTC).
- The Bloomspire roster in the code matched the brief: Razorwing (T1, no path); Swarm Bloom: Needlewing T2, Cloudwing T3; Apex Bloom:
  Brood Tyrant T2, Worldrender T3 (TREES_BH.techlab). Other places that name the four cut units: the AI's base scores (ai.js) and the
  Default AI's smart scores, batch 4b's scores, aims and tastes for the Brood Tyrant and Worldrender (`aim4b`, `RW4B_TASTE`), batch 5b's
  Needlewing anti-air (`RW5B_D`, `aiScores5b`, the Bloomspire lean in `aiPath5b`), batch 5c's Bloomspire roll (`aiBloomRoll5c`, which
  leaned to Swarm Bloom as the anti-air path), the Cloudwing's offspring (`updateSpawn`, `SPAWN`), the Brood Tyrant's pustules (batch 4b
  `tyrImpact`, `pusBurst`: a building that falls with pustules bursts into Mites, counted in the Mite cap of 30 since 6h), spawn heights
  (`spawnUnit`), shadows and death blasts (render, `kill`), body classes (`BODY6H_A`), the Worldrender's Test Range readout, UNIT_TIPS,
  the Codex (through UNIT_ORDER and the trees), the art (units-rework-4b, -5a, -5b; AIR_CYC, AIR_BOX), and tests (bh-spire, rework-4b,
  rework-5b, rework-5a/5c, bloomhost, bloomhost-ui, signature, salvage, determinism, slow ai-stats and others). The tutorial names none.

### The Bloomhost roster with b6i on (ground and air)

| building | start | path A (T2 / T3) | path B (T2 / T3) |
|---|---|---|---|
| Larva Pit | Skitterling (broods of 4), Spitter | Predatory Evolution: Leaper / Ravager | Acidic Evolution: Queen / Bilecaster |
| Evolution Chamber | Chitin Warden | Burrowing Evolution: Gorebore / Ruinmaw | Behemoth Evolution: Broodback / Dreadthorn |
| Bloomspire | **Razorwing** (flocks of 3) | Swarm Bloom: **Gnatcloud** / **Blightwing** | Apex Bloom: **Talonmaw** / **Skywyrm** |
| Brood Mound | Mite (free; Queens and Blight make them too) | | |

| unit | cost (credits / energy) | army size | HP | speed | attack | air / ground |
|---|---|---|---|---|---|---|
| Skitterling | 120 a brood of 4 (b6c's brood price) | 0.5 each | 50 | as before | claw | ground |
| Spitter | 70 / 20 | 2 | 110 | as before | quill volleys, range 150 | both |
| Queen | 150 / 50 | 3 | 260 | 26 | bile bolt 10 / 1.4 s, range 150; Mites | both |
| Leaper | as before | | | | leap 260 / 10 s, latch | ground |
| Ravager | as before (+Pounce) | | | | | ground |
| Bilecaster | as before | | | | bile glob, pools | ground |
| Chitin Warden | 140 / 25 | as before | 840 | | slam; aura: 40% less area damage | ground |
| Gorebore | 170 / 60 | 3 | 300 | 22 | burrow, eruption (+Pounce) | ground |
| Ruinmaw | 400 / 150 | as before | 1,500 | | eruption, swallow, Tunnel | ground |
| Broodback | 180 / 40 | 3 | 520 | 22 | bite 12 / 1.2 s; bursts | ground |
| Dreadthorn | as before (+Pounce) | | | | charge | ground |
| **Razorwing** (a bird) | **150 / 50 a flock of 3** | **1** | **90** | 95, +5% per Razorwing within 80 (up to +40%) | dive **6 / 0.75 s**, range 50 (talon table; **1.25× to aircraft**) | both |
| **Gnatcloud** | **120 / 40** | **2** | **220** | **55** | **8/s to every enemy within 40** (units, aircraft, buildings; clouds stack) | both |
| **Blightwing** | **220 / 90** | **3** | **320** | **60** | **spore cone every 3 s: 15, range 120, 50°, Blight 8 s** | both (and buildings) |
| **Talonmaw** | **200 / 70** | **3** | **480** | **90** | **claws 20 / 1 s, range 40; Snatch; Rend** | both |
| **Skywyrm** | **480 / 220** | **7** | **1,600** | **22** | **acid spew 45 / 2.2 s, range 200, radius 40, 2.5× to buildings; tendrils; jaws 30 / 1 s** | spew ground and buildings; tendrils and jaws air and ground |
| Mite | free | 0 | 30 | 64 | bite 4 / 0.6 s, corrodes; 10 s | ground |

### Part A: the Bloomspire roster (b6i)

The four cut units are not trainable, not used by the AI and not in the Codex; each new unit takes its slot (`rwType`, `RW6I_SWAP`:
razorwing → `razor6`, needlewing → `gnatcloud`, cloudwing → `blightwing`, broodtyrant → `talonmaw`, worldrender → `skywyrm`; new ids, so a
b6i-off game, an old save or a replay still has the old five). The Brood Tyrant's pustule Mite source goes with it (no Brood Tyrants).

- **A1. The Razorwing** (`razor6`, named Razorwing): one Bloomspire order is a flock of **3** birds (`flockTrain6i`, `flockN6i`): **150
  credits, 50 energy**, one queue slot, 10 s; each bird army size **1**, **90 HP** (a queued flock counts 3 against supply). Flock speed:
  **+5%** for every other Razorwing of its side within **80**, up to **+40%** (`u.fl6N`, counted each tick in update6i). A melee dive at
  ground units and aircraft, weapon `talon6`: the old talon table (light 1.1, heavy and vehicles 0.9, buildings 0.6) with **1.25 to
  aircraft**. Per bird **6 damage every 0.75 s** (8 a second): a flock of 3 does **24 a second, 120% of the old Razorwing's 20** (15 /
  0.75 s). The Test Range places a Razorwing as a flock of three.
- **A2. The Gnatcloud** (Swarm Bloom T2): 120 / 40, army size 2, 220 HP, speed 55. It flies onto its target (`gnat6i`, range 14): every
  enemy unit, aircraft and building within **40** takes **8 a second** (weapon `gnat6`, every armour 1.0; area damage); clouds stack. It
  takes **50% less from single-target hits** and full damage from area damage: 6h's AREA6H list, plus a splash shell's own target
  (`A6I.sp`). Departure: a Gnatcloud hangs low over what it eats, so **ground splash and flame weapons can target and hit it** (Tanks,
  Titans, Artillery, Flame Tanks, Bilecasters and the like, `gnLow6i`; it counts as light armour to weapons that can't hit aircraft,
  `gnArm6i`), and ground splash catches it (`splashHit`, the Flame Tank's strip); without this no area damage could ever reach it (the
  brief's Tank-splash check needs it). Art: particles (46 specks orbiting in a cloud, a third in its side's colour, a glowing heart and
  a faint ground haze the size of its reach), drawn live, a few dozen rectangles a frame.
- **A3. The Blightwing** (Swarm Bloom T3): 220 / 90, army size 3, 320 HP, speed 60. Every **3 s** a spore cone (`cone6i`): range **120**,
  **50°**, **15** to every enemy ground unit, aircraft and building in it (area damage); units are **blighted for 8 s** (refreshed, never
  stacked; buildings take the damage but aren't blighted). An enemy unit that dies blighted bursts into **2 Mites** for the Blightwing's
  side (`blightDie6i`, within the side's cap of 30 with the Brood Mound's and the Queen's). Blighted units shed drifting green spores.
- **A4. The Talonmaw** (Apex Bloom T2): 200 / 70, army size 3, 480 HP, speed 90. Claws **20 every 1 s** at air and ground. **Snatch**
  (every **8 s**, small ground units: the body class small, `snatchOk6i`): it lifts the unit out of the fight (`u.sn6`, gone, untargetable,
  drawn in its talons) and eats it at **40/s**; if the Talonmaw takes **25%** of its maximum health while carrying it drops the prey, which
  lands stunned **0.5 s**; a kill heals it **50% of the prey's maximum health, at most 25% of its own** a meal. **Rend** (every **6 s**,
  medium, large and huge ground units and vehicles): a dive for **60**, and the target takes **+15% damage from Bloomhost for 6 s**
  (`rendAmp6i`); no heal. It picks by the target's size and claws between; with an ability ready for a target within 150 it dives at
  **2×** speed. AI Talonmaws hunt (within 220) small units for Snatch and bigger ones for Rend.
- **A5. The Skywyrm** (Apex Bloom T3): 480 / 220, army size 7, 1,600 HP, speed 22. **Acid spew** every **2.2 s**: a lobbed glob at range
  **200** for **45** within **40** (area damage, ground units and buildings, **2.5× to buildings and Turrets**, weapon `spew6`; it prefers
  buildings, `preferB`). **Tendrils** every **6 s**: an enemy aircraft within **180** is dragged to its jaws over **1.5 s** (`u.dr6`,
  helpless meanwhile) and bitten for **70**. **Jaws**: **30 every 1 s** to the nearest enemy unit, air or ground, beside its jaws (45).
- **A6. Mites**: Blight's Mites count toward the side's 30 with the Brood Mound's and the Queen's (one counter, `miteCount6h`).

### Part B: the Bloomhost air AI (b6i, every personality and difficulty)

Scores (`aiScores6i`, tastes `RW6I_TASTE`): Razorwing flocks for anti-air and early harassment (enemy air raises them, +0.4 before
7:00); Gnatclouds against packed armies and aircraft; Blightwings against infantry and mixed armies; Talonmaws against light units and
vehicles; Skywyrms against turtles and fortified nodes (+0.2 per known turret at an enemy node, up to four; +0.6 more when b6hnode
counts the enemy nodes fortified) and aircraft. Behaviour (`aiRework6i`, the unit steps): **Razorwing raids** (six or more birds at 60%
health while the army is home: they fly at the enemy's nearest Refinery or held node no known gun covers, for up to 35 s, back when the
flock is down to 3, half its health or an attack starts); **Gnatclouds** at the thickest clump of enemies they can see within 220,
aircraft counting double; **Blightwings** wait 60 behind the median of the swarm on the attack; **Talonmaws** hunt small units to snatch
and vehicles to rend; the **Skywyrm** joins 6h's node assault (`aiNode6h`'s pool now takes it; its 2.5× building rate sorts it first as
the building-breaker) and its scores lean to it when the enemy's nodes are fortified. Two path fixes for the new roster: the Bloomspire
roll (5c) and 5b's path rule no longer lean to Swarm Bloom "for anti-air" (every Bloomspire unit hits aircraft); the batch 6d Turtle's
plan had no Tech Lab and its eight items fill every pad once its first Habitat stands, so a Bloomhost Turtle never had a Bloomspire: it
now **grows one late** (`turtle6i`, `plan6i`): its opening is unchanged, its plan ends with a Bloomspire, and from 8:00, with every pad
taken, 300 energy banked beyond the Bloomspire's price and no enemy within 500 of its HQ, it sells its lowest Reactor and grows the
Bloomspire on that pad. Two earlier versions were measured and rejected (the Bloomspire in place of its third Refinery: a third less
income from 3:00 and the Turtle won 4 of 36; in place of its Reactor: it never found a pad, 14 of 36, no air; see Part F). Easy never reaches T3 (its maximum tier is 2, unchanged), so it uses the Razorwing, the
Gnatcloud and the Talonmaw.

### Part D: the Chitin Warden quota (b6i)

6h's rule (`aiScores6h`) wanted about one Warden per 12 army supply against area damage, but it was a floor, not a quota: at or over the
quota it kept `Math.max(score, 0.9)`, and the Warden's own base score (about 1.6-2.3, a generic tank) stayed; and it counted only the
Wardens alive, not those queued, so several were queued at once. With b6i (`ward6i`): the Wardens alive **and queued** are counted;
at the quota its score drops to 0.4; under it, against area damage, 1.6 + 1.5 × the enemy's splash share as before. No Warden value
changed.

### Part E: units under fire (b6iresp, every faction, the AI and the player)

What was wrong (6g's fix 3, `fire6g`): a unit holding or attack-moving that was hit by an enemy it couldn't hit from where it stood
either charged it (within 250) or, if it couldn't hurt it at all, pulled back out of its reach. In play, Tanks on Hold ran from aircraft
they can't shoot, and units chased long guns across the map. With b6iresp on, `fire6i` replaces it (6g's `hurt6g`, which records who
hurt a unit, still runs; b6iresp needs b6g):
1. **No pull-back**, ever. Retreating is the player's order or the AI's army-level decision.
2. A unit answers only an attacker **within its own reach + 80** (a melee unit: **100**).
3. Only one it **can hurt** (`hits6g`: the right weapon for air or ground, a damage table that touches its armour). A Tank hit by
   aircraft does nothing different.
4. Long guns beyond that distance (Artillery, Snipers, anything firing from further) get **no automatic response**.
5. On **Hold** the leash is **100** from its held spot (it goes no further, and its Hold walks it back afterwards); on **Attack** or an
   attack-move the leash is **250**. A charge also ends after 8 s, when the attacker dies, leaves sight or would take it past its leash.
6. Kept from 6g: never on a move order or a Retreat (an AI's Retreat at home counts as holding, as in 6g); attackers that are shielded,
   untargetable (phased, just after a Wraithwing's hop) or buildings are ignored.
With b6iresp off, 6g's behaviour is unchanged. Counter: `side.r6i.charge` (self-play).

### Part C: art, Codex, tips (b6i)

- Art (src/render/units-rework-6i.js, the Bloomhost style with team colour on the largest surfaces): the **Razorwing** flock bird (the
  batch 5b bat-winged Razorwing at 72% size, its wing membranes and back plate in its side's colour); the **Gnatcloud** (particles: a
  churning cloud of specks, a third in its side's colour, a glowing heart, a faint ground haze the size of its reach; drawn live, cheap);
  the **Blightwing** (a bloated moth: team eye-spots on its wings, glowing team spore sacs on its abdomen, feathered antennae, a spore puff
  when it fires); the **Talonmaw** (a raptor with team wing membranes, a team crest, a hooked beak and hooked bone talons thrust forward in
  a dive); the **Skywyrm** (a long sinuous serpent with a team plate and glow on every segment, team fins, writhing tendrils at its
  throat, a wide fanged maw with acid in it and dripping). Razorwings, Blightwings and Talonmaws are cached as aircraft poses (AIR_CYC,
  AIR_BOX); the Gnatcloud and the Skywyrm draw live. Effects: the prey hanging in a Talonmaw's talons (drawn smaller as it is eaten,
  dripping), the drop (a dust ring), Rend (three slashes; a scar in the Talonmaw side's colour on the target while it lasts), Blight
  (green spores drifting up from a blighted unit; a burst where Mites come out), the spore cone, a tendril (a writhing line from the jaws
  to the dragged aircraft) and the bite, the acid spew (a lobbed green glob and a splash with a dashed rim in the side's colour).
  Screenshots at 667×375: docs/screenshots/rework6i-flock, -gnatcloud, -blight, -snatch, -rend, -skywyrm, -codex.
- Codex (follows the new-game default): the Bloomspire's tree (Gnatclouds and Blightwings on Swarm Bloom, Talonmaws and Skywyrms on Apex
  Bloom), its description and T1 line ("Grows Razorwing flocks"); every new unit's card; the Razorwing's card and the stats table show a
  flock's price ("150 credits, 50 energy for a flock of 3", army size 1 each); the four cut units are gone from it. With b6i off it
  shows v2.98's. The Train card reads "FLOCK ×3"; the info card gives the flock's price.
- Tips (UNIT_TIPS, numbers read live): the five units. The tutorial names none of the cut units (nothing to change).

### Part F1: Test Range (audit/sim/b6i-range.js, 20 seeds each; audit/logs-p1/b6i/range.md)

| scene | every switch on | v2.98 (the switch off) |
|---|---|---|
| 3 Razorwing flocks (450 / 150) (600 in all) against 2 Gunships (650), both attacking | the flocks win in 6 s, 8 of 9 birds left (588 HP of 810) | 3 single Razorwings (570 in all): win in 13 s, 1.2 left (148 HP) |
| 3 Razorwing flocks against 3 Interceptors (450 / 180) | the Interceptors win in 6 s, all 3 left (356 HP of 570): flak (1.8× to aircraft) owns the air | - |
| a Gnatcloud attacking 10 Marines (holding) | the cloud dies in 7 s; 82 damage eaten, no Marine killed | - |
| the same with a Tank among the Marines | the cloud dies in 5 s (the Tank shells it); 46 eaten | - |
| 2 Blightwings behind 8 Skitterlings attacking 10 Marines, 60 s | 3.4 Mites born from blighted kills (2-8), up to 2 alive at once; 6.3 Marines left; 3 units blighted | - |
| a Talonmaw attacking 8 Marines | 2 snatched and eaten, 4 Marines killed in all; the Talonmaw dies at 15 s (no drop) | - |
| a Talonmaw attacking a Tank | 4 Rends; the Tank dies at 21 s; the Talonmaw unhurt (a Tank can't hit it) | - |
| a Talonmaw and 2 Skitterlings attacking 2 Tanks | 7 Rends; both Tanks dead at 43 s | - |
| a Skywyrm attacking two T1 Turrets and a Refinery (a turreted node) | the Refinery down at 20 s, the Turrets at 31 and 36 s; the Skywyrm survives with 87 of 1,600 | a Worldrender: Turrets down at 35 and 58 s, the Refinery at 68 s; 756 left |
| a Skywyrm holding, 2 Gunships attacking it, 60 s | 2 tendril drags, 6 jaws bites; 1 Gunship killed; the Skywyrm left with 108 HP | - |
| 4 Tanks on Hold, 2 Prismwings (which they can't hit) attacking, 25 s | moved 0 (b6iresp) | moved 174 (6g's pull-back) |
| 6 Marines on Hold, an Artillery 380 away (beyond 120 + 80), 25 s | moved 0, 3.6 Marines killed | moved 125 (pulled back), 1.8 killed |
| a Ravager on Hold, a Marine 95 away shooting it | charges (out 71), kills it at 2.0 s, back on its spot (1 px) | the same (6g charged too) |

### Part F2: self-play (audit/logs-p1/selfplay6i-on/: report6c.md, b6i.md, b6h.md; 162 matches, every switch on, seeds 600+, `EE_B6H=1`)

No unit value was tuned (Bloomhost's balance pass is the next batch). Factions: Last Fist 39-54-15, **36%** (28-46); Bloomhost 46-53-9,
**43%** (34-52); the Axiarchs 60-38-10, **56%** (46-65). Personalities: Boomer 43%, Economist 51%, Turtle 41%. Full tables (maps,
pairings, faction × personality, lengths) in docs/BALANCE_AUDIT.md section 17.

Units trained per Bloomhost side and match: Skitterling 56.7, Spitter 28.5, Chitin Warden 18.4 (6h: 27.5), Razorwing 14.5 birds (4.8
flocks), Leaper 11.5, Bilecaster 8.3, Broodback 8.1, Gnatcloud 7.4, Gorebore 4.3, Queen 4.0, Talonmaw 1.9, Ravager 1.2, Dreadthorn 1.1,
Ruinmaw 0.7, Blightwing 0.4, Skywyrm 0.2. By personality (Razorwing birds / Gnatcloud / Blightwing / Talonmaw / Skywyrm): Boomer 19.5 /
8.3 / 0.3 / 2.9 / 0.2; Economist 20.0 / 8.6 / 0.5 / 2.3 / 0.3; Turtle 4.0 / 5.3 / 0.4 / 0.4 / 0.1.

**Tier-3 air** (the open flag): Bloomhost sides that trained a Blightwing or a Skywyrm: **33 of 108 (31%)**: 18 a Blightwing, 15 a
Skywyrm; Boomer 12 of 36, Economist 11, Turtle 10; median first tier-3 aircraft 12:20 (the Turtle's 16:13). In 6h's run the
Cloudwing and the Worldrender were trained 0.4 and 0.1 times per side and match. Last Fist sides 3 of 108, the Axiarchs 12 of 108. The
Bloomspire's paths (sides that took one): Swarm Bloom 37, Apex Bloom 32. Why it stays at a third: the AI upgrades in a fixed order
(AI_UPG) and the Bloomspire's T3 is 15th of 20 (after the Refineries, Habitats, Larva Pit and Evolution Chamber reach T3), and the
median match lasts 14:32; that is the AI's priority, not a logic bug. Two logic bugs that blocked Bloomhost air were fixed (Part B): the
Bloomspire roll's lean to Swarm Bloom "for anti-air" (14 Swarm against 3 Apex in the first 52 matches; 37 / 32 after) and the Turtle that
never had a Bloomspire.

Air mechanics per Bloomhost side and match: Gnatcloud damage 532; units blighted 2.0, Mites born from Blight 1.0; Snatches 1.5 (1.2
eaten, 0.3 dropped); Rends 3.5; tendril drags 0.1, jaws bites 0.4, acid spews landed 5.2; Razorwing raids 1.4.

The 6h swarm metrics (per Bloomhost side and match; 6h's run in brackets): peak Bloomhost units alive 36.4 (37.4); share of Bloomhost
damage by melee 54.4% (61.4%); Mites spawned 148.3 (165.4), 147.3 by Queens, 1.0 by Blight; damage taken off by Wardens' auras 2,721
(2,991); Pounces 79.0 (96.2); Tunnel trips 20.1 (18.2). Openers (Boomer / Economist / Turtle): swarm 20 / 6 / 4, Spitters 10 / 16 / 14,
mixed 6 / 14 / 18; Bloomhost won 40% / 63% / 43% of the matches it opened with Spitters (6h: 40 / 75 / 71%).

Under-fire charges (b6iresp) per side and match: Last Fist 24.5, Bloomhost 79.7, the Axiarchs 55.2.

**The Bloomhost Turtle** (36 sides each, the same seeds; audit/logs-p1/b6i/):

| run | Bloomhost Turtle W-L-D | Wardens | air units | income at 3 / 7 / 11 min (credits per 10 s) |
|---|---|---|---|---|
| 6h (v2.98, every switch on) | 19-13-4 | 39.1 | 0 | 226 / 292 / 338 |
| 6i, first version: its Bloomspire in place of its third Refinery (selfplay-v1-refinery) | 4-30-2 | 9.5 | 18.3 | 154 / 226 / 235 |
| the same, the Warden fix off (turtle-nowardfix) | 4-31-1 | 14.7 | 20.7 | 154 / 250 / 243 |
| the same, no Bloomspire for the Turtle (turtle-noplan) | 14-17-5 | 22.1 | 0 | 226 / 285 / 291 |
| its Bloomspire in place of its Reactor (turtle-reactor: never found a pad) | 14-17-5 | 22.6 | 0 | 210 / 296 / 295 |
| **shipped: the late Bloomspire (selfplay6i-on)** | **14-18-4** | 22.0 | 10.2 | - |

The first version cost the Turtle a third of its income (its third Refinery was never built) and it won 4 of 36; the Warden fix alone
was not the cause. The first 162-match run with that version: Last Fist 44%, Bloomhost 33%, the Axiarchs 59%, the Bloomhost Turtle 11%
(audit/logs-p1/b6i/selfplay-v1-refinery/).

### Part F3: the node scenario (audit/sim/b6g-scen.js --set nodes, 36 matches, every switch on; audit/logs-p1/b6i/nodes/, node.md)

| run | retakes | enemy pad buildings destroyed | Bloomhost W-L-D |
|---|---|---|---|
| 6h shipped (v2.98) | 126 | 1,008 | 3-29-4 |
| 6i, the first Turtle plan (nodes-v1-refinery) | 88 | 851 | 0-33-3 |
| **6i shipped** | **121** | **977** | **0-30-6** |

Assault decisions: 409 launched in 10,482 checks (3.9%);
assault units by type: Spitter 1,338, Skitterling 1,196, Warden 909, Broodback 321, Bilecaster 243, Queen 181, Gorebore 113, Leaper 87,
Dreadthorn 57, Ravager 13, Ruinmaw 12, **Skywyrm 6** (it joins first when there is one; 3 to 4 Skywyrms are trained in these 36 matches);
assault units killed 1,867 (Turrets 1,045). The Skywyrm is the building-breaker when one is up, but Bloomhost rarely has one in this
scenario, so the numbers stay near 6h's (retakes -4%, pad kills -3%).

### Part F4: the bug bar

No faction below 30% or above 70% (36 / 43 / 56%). Every new unit is built by the AI. None wins absurdly in the Test Range (F1). Found and
fixed while measuring (mechanics and AI use, no values): the Bloomspire roll's lean to Swarm Bloom; the Turtle with no Bloomspire (and the
rejected version that cost it a third of its income); a queued Razorwing flock refunded at one bird's price when its Bloomspire is sold
(`trySell`); the Gnatcloud out of reach of all area damage. Flags in docs/BALANCE_AUDIT.md section 17.7.

### Tests

`npm test` 870/870 and `npm run test:slow` 28/28 on v2.99 (quiet machine, clean tree, the final commit; audit/logs-p1/b6i/fast-suite-v299.txt,
slow-suite-v299.txt). Fingerprints: with b6i and b6iresp off FP_V298 and every older set match (tests/determinism.test.js holds both off in
every older set); FP_V299 recorded with every switch on.

How the suites got there (each failure measured and classified; no unit value changed to pass a test):
- The first fast run (861 tests) failed 23. Fixed as regressions: the spore cone without a projectile speed (orders-weapons' weapon check;
  `PSPEED.spore6`), "three" in the Razorwing's description (live-text), the switch lists of older test sets (rework-2a's expected JSON,
  the seeded skirmishes of rework-3b, -4a, -4b, -5b, hardhuman, attack's v2.59 run, tactics' v2.39 replay: each now holds b6i and
  b6iresp off like the other new keys), the index.html not rebuilt after the version bump. Seed variance: ai.test's "Easy keeps spending
  on upgrades under threat" (unseeded; 20 of 20 with every switch on). Held off as intended effects with `pin6i` (tests/load-sim.js; the
  same helper as pin6h) and checked with every switch on in tests/switches-on-6i.test.js or tests/rework-6i*.test.js: b6i: bh-spire's path
  test and its AI path test (the old four), bloomhost's "each faction trains only its own units" (the old Razorwing), bloomhost-ui's match as
  Bloomhost (the Bloomspire picker; held off in the page), rework-4b's Brood Tyrant and Worldrender tests, rework-5b's swarm surge (a
  Needlewing as its aircraft), Needlewing and AI tests (the anti-air path), rework-5c's two Bloomspire-roll tests (the lean to Swarm Bloom
  is gone); b6iresp: rework-6g's two under-fire tests (beyond reach + 80 they now stand; the pull-back is gone).
- The first slow run (26) failed 3: ai-stats' Bloomhost base AI (Razorwings) and Bloomspire Economist (Brood Tyrants, Worldrenders) checks
  are intended (new ids; held b6i off; counterparts in tests/slow/switches-on-6i.test.js with rates measured over 20: Razorwing flocks
  100%, a Bloomspire path 100%, a T2 unit 100%, a T3 one 85%); switches-on-6c's Two-Lane test failed "a watchtower was taken", then "most
  matches decided by an HQ falling": seed variance over 20 matches (an HQ fell in 16 of 20 with every switch on and with b6i and b6iresp
  off; a tower in 19 and 20), moved to seeds 532-537 with every check unchanged (audit/logs-p1/b6i/slow/slow.md).
- Tests added: tests/rework-6i.test.js (12), tests/rework-6i-ui.test.js (7, screenshots), tests/switches-on-6i.test.js (9),
  tests/slow/switches-on-6i.test.js (2).

### Departures

- New internal ids (`razor6`, `gnatcloud`, `blightwing`, `talonmaw`, `skywyrm`), so a b6i-off game, an old save or a replay keeps the old
  five; the Razorwing's id differs from its slot's (`razorwing`), its name is the same.
- The Gnatcloud can be targeted and hit by ground splash and flame weapons (light armour to them): otherwise, as an aircraft, it could
  never take area damage at all. A splash shell aimed at it counts as area damage for its own target too.
- Rend's +15% applies to damage from any Bloomhost side (the Talonmaw's own side in a match; either side in a Bloomhost mirror).
- Blight's Mites burst from any enemy unit that dies blighted, Mites included (the cap of 30 bounds it).
- The Skywyrm's spew prefers buildings (it is the siege unit); its jaws and tendrils pick their own targets.
- Under-fire responses keep 6g's eligibility: an AI's Retreat at home counts as holding (leash 100). b6iresp works through 6g's records
  of who hurt a unit, so it needs b6g on.
- Easy never reaches T3 (its maximum tier is 2), so it never trains a Blightwing or a Skywyrm.

## Batch 6j: the balance pass, the playtest fixes

**Batch 6j (v3.00).** Two switches in src/sim/rework-6j.js, per game in `g.rw`, on by default, saved only when on, each with a Test
Range switch ("Batch 6j fixes", "Batch 6j balance"): `REWORK.b6jfix` (Part A: the playtest fixes that change the SIM) and
`REWORK.b6j` (Part B: the AI fixes; Part D: every tuned value, `B6J`). Both off: v2.99 exactly (FP_V299 and every older set match).
Recorded: FP_V300 (every switch on). Drawing and UI fixes that can't change a match (A1, A4, the version label) have no switch.
Tests: tests/rework-6j.test.js, tests/rework-6j-ui.test.js, tests/switches-on-6j.test.js. Measurement scripts: audit/sim/b6j-diag.js
(per faction and personality: build, tiers, attacks, army and income over time), audit/sim/b6j-report.js (the Part C tables: unit
cost-efficiency, what deals the damage each faction takes, win rate by length, openers, tier-3 air, signature buildings),
audit/sim/b6j-range.js (the cost-equal Test Range checks). Logs: audit/logs-p1/b6j/ (the frozen builds each run played, range
checks, run logs), audit/logs-p1/selfplay6j-ab/, -r1/, -r2/, -r3/, -r3b/. The 6a instrument now credits damage dealt outside
`updateUnit` to its unit (a Gnatcloud's cloud, a Broodback's Bile Bloom, a Skywyrm's jaws and tendrils; before, they were "?").

### Step 0

- GitHub Pages: "pages build and deployment" run 109 built 0bfc85b (v2.99) and succeeded (2026-11-27 07:57 UTC).
- The version: the main menu already showed it (top right, `.ver`, the dev menu's tap target); the title screen now shows it too,
  small in its bottom-right corner (`#title .tver`).

### Part A: the playtest fixes

- **A1. Aircraft under the top bar (drawing only).** An aircraft flies at its SIM height `u.z` (an Interceptor 100-124 above the
  ground); near the field's top row that put its art behind the HUD ribbon (every aircraft at the top of Classic and Three-Lane was
  hidden at 667×375). Now `zVis(e)` caps the height it is drawn at so its art and health bar clear the top bar's lower edge at every
  phone size and vertical pan; `render()` lowers each aircraft's `z` for the frame and puts the SIM's value back (try/finally), and
  taps use the same height (`uScreen`). No SIM change, no switch. Screenshots: rework6j-air-classic, -air-threelane.
- **A2. The Queen and her Mites (b6jfix).** Reproduced: three Queens on a target order, packed, enemies in range, 20 s: Mites
  hatched 3-10 px from a Queen's centre (inside her body) and the body pass pushed the Queens 20-27 px off their spots (other
  Queens' Mites; a Queen's own Mites already passed through her). The order and target held in the SIM; what read as "cancels her
  attack" was the shove, and a tap meant for the enemy could land on a Mite in front of it. Now (`queenSpot6j`) each Mite hatches in
  front of her, toward her target (else her order's target, else her facing), clear of her body (queen body + Mite body + 6),
  left / centre / right in turn; in the body pass a Mite against a unit of its own side takes the whole push and moves nobody's
  held spot (`mitePush6j`); with units selected a tap never lands on your own Mites (it targets the enemy or moves the selection).
  Measured: the Queens drift ≤ 1.1 px, order and target unchanged every tick, every Mite ahead of her and at least 20 from her
  centre; the selection is untouched by births. Tests: rework-6j "A2" (SIM, with the v2.99 drift as the off case), rework-6j-ui "A2".
- **A3. The Purification Beam on any lane (b6jfix).** Reproduced as a player through the buttons: the aiming tap clamped every
  map to ±240 rows (`aimTap`), while Three-Lane's north and south lanes lie at about ±400. A tap on them became a spot at ±240, off
  the lane: "Purification Beam needs a spot on the lane", the aim stayed up, the next tap on the button cancelled it and the tap
  after fell through to the field ("Capture this forward pad first"). On Two-Lane the strip landed 40 off each lane's centre line
  (still in reach of a unit on the line, not of one beside it). 6g's fix had covered the SIM's check and the AI. Now the tap reaches
  a deep map's whole depth (`aimV6j`). Emergency Brood had v2.99's middle-of-the-map check (±LANE_V + 25) on the lane maps: any
  lane now (`brood6j`). The other abilities only shared the tap's clamp. Test: rework-6j-ui "A3" fires it through the buttons on
  every lane of both maps (it lands on the lane and hits a Tank there); screenshots rework6j-beam-twolane-north, -south,
  -threelane-north, -centre, -south.
- **A4. Train-card art.** Every unit card was drawn at a fixed scale (aircraft 1.1, ground by height) in a 56×32 canvas: 20 unit
  cards crossed an edge (Skywyrm, Talonmaw, Blightwing, Sovereign, Voidcarrier, Wraithwing, Dreadthorn, Gorebore, the old
  Bloomspire units, Bastion, Parallax, Shardling, Riftstalker, Ravager, Gnatcloud, Rift Mortar, Bile Lobber). Now (`fitUnitIcon`,
  `artBB`) a card keeps its old scale and place unless its art would cross the top or a side (a ground unit may stand on the
  bottom edge), then it shrinks to fit and is centred; the Test Range's icons use it too. The Codex already fitted its pictures to
  the drawn pixels (none clipped). Test: rework-6j-ui "A4" (no card or Codex picture of any unit touches an edge); screenshots
  rework6j-spire-swarm, -spire-apex.
- **A5. A sold brood (b6jfix).** A Larva Pit sold with a brood queued refunded one Skitterling's price (`trySell` used `unitCost6`;
  since 5b): now the brood's (`trainCost`), as 6i did for the Razorwing flock.
- **A6. The "signature pad".** In the game it is the ninth pad of each base, just past the HQ at the base's outer corner
  (`SIG_SLOT`, `MAP.bases[s].sigPad`; since v2.43): only a signature building stands there, one of the faction's two at a time
  (Last Fist: Salvage Yard or Fortification Depot; Bloomhost: Brood Mound or Rootheart; the Axiarchs: Phase Beacon or Echo Reliquary).
  The tutorial's Building chapter, the empty-pad card ("Signature pad") and the build cards ("★ SIG PAD") name it. The Hard AI uses it:
  every personality builds a signature building there from 5:00 (`HARD_SIG_7C`), in 94% of sides (6i's 162 matches: Last Fist 32 /
  33 / 36 of 36 Boomer / Economist / Turtle sides, Bloomhost 36 / 35 / 34, the Axiarchs 32 / 30 / 34; the rest lost or under
  pressure before). It always builds the same one per faction (the preset names it: the Salvage Yard, the Rootheart, the Phase
  Beacon); the Fortification Depot, Brood Mound and Echo Reliquary are never chosen. Used, so not changed (reported).

### Part B: the AI fixes (b6j)

- **B1. The Last Fist Turtle and Boomer** (6i: 28% and 25%). Evidence (audit/logs-p1/b6j/diag-6i.md, audit/sim/b6j-diag.js): the
  Boomer fielded the largest army of any side at 9 and 12 minutes (3,490 / 3,530) and won 25%; the Turtle never built a Tech Lab
  (0 of 36: batch 6d's plan) and its army stalled near 2,200; Last Fist sides that made two or more "siege" pushes won 10 of 42
  (24%), the rest 44%; the Boomer made 4.5 a match, the Turtle 3.6, the Economist (56%) 0.5. The bug: a siege push stops the whole
  army just outside the enemy HQ gun (`siegeLine`, its range + 25) for its siege guns to shell the base; v2.99 counted any two
  siege units (`AI_SIEGE`: Artillery and Titans) without asking what they could reach. Two Titans (reach 160 since 2b) parked 555
  from the HQ with nothing in reach, and since 6c the HQ can't be hurt while another building stands. Fixed (`siegeN6j`): a siege
  needs two Artillery-type guns and a known enemy building (not the HQ) within their reach of the line; else the attack goes in.
  The Turtle's missing Tech Lab: it grows one late as 6i's Bloomhost Turtle grows its Bloomspire (`plan6i`, `turtle6i`). Upgrades
  and composition: no logic bug found (the Boomer upgrades its economy first by design; its unit tastes favour Tanks and Heavies).
  After Parts A-B (162, audit/logs-p1/selfplay6j-ab/): Last Fist 36% → 44%, its Boomer 36%, Turtle 39%; siege pushes 2.9 → 1.6 a Last Fist side and match (each now with Artillery in reach of a known building).
- **B2. Tier-3 air.** The fixed order (AI_UPG) puts the air building's T3 16th of 20; with b6j, from 8:00, with the air building,
  three Refineries and 60% of the step's credits, its T2 and T3 go first (`air6j`). That changed little (Parts A-B: tier-3 air
  in 6 / 32 / 13 of 108 Last Fist / Bloomhost / Axiarch sides, 6i 3 / 33 / 12): a probe found the real limit was having an air
  building at all (Last Fist's Economist built a Tech Lab in 11 of 36 sides, the Axiarch Turtle in 0 of 36: the plan's last item
  after the pads fill). So every Last Fist and Axiarch personality without one grows one late the same way (`late6j`; round 1 on).
  Last Fist's Leviathan, unlocked, was still rarely trained (its score falls with the enemy's anti-air, and every Bloomspire unit
  and the Spitter hit aircraft): from round 3 a side with none scores its first at least 1.6 (`aiScores6j`). Results in the table
  below.
- **B3. The Skywyrm at fortified nodes.** 6i's node assault already takes a Skywyrm first (its building rate sorts it first) at 50%
  health or more; now from 30% (`wyrm6j`). How often one is there follows B2.
- **B4. Other AI findings** (reported, not changed): the "siege" push also fires with no siege units at all (`go(siegeLine, 'siege')`
  on a bold edge; it waits up to 50 s at the line before going in; rare outside Last Fist, 0.1 a match); the Leviathan's counter
  rule (above); the Last Fist Turtle's Tech Lab path is Support (Medevacs, Drones) by design, so it never has tier-3 air; the
  signature building choice is fixed per faction (A6); Gnatclouds are sent one at a time "at the thickest clump" (`aiRework6i`), so
  in matches they rarely stack as they do in the Test Range check (below).

### Part C: diagnosis (6i's run and the Parts A-B run; audit/logs-p1/b6j/diag-6i.md, audit/logs-p1/selfplay6j-ab/b6j.md)

Baseline 6i's run (Last Fist 36%, Bloomhost 43%, the Axiarchs 56%) and the Parts A-B run (162, every switch on: Last Fist 44% (35-54),
Bloomhost 39% (30-48), the Axiarchs 51% (42-60); personalities 41 / 48 / 45%). Per faction (the full tables in docs/BALANCE_AUDIT.md
section 18.4):
- Last Fist: Snipers and Hydras the most efficient (146-157 value killed per 100 spent), the Heavy (32) and Tank (42) the least of its
  fighting units; a quarter of the damage its units take comes from HQ guns; it wins 62% of matches of 15-20 minutes, 21% under 10.
  AI logic: the siege push, the Turtle's Tech Lab, tier-3 air (Part B). Numbers: the Heavy, the Tank, the Titan's reach (Part D).
- Bloomhost: the Spitter the most efficient unit (130-138), the Broodback (8-11) and Gnatcloud (12-16, corrected attribution) the
  least; even across match lengths. Numbers: the Broodback, the Spitter, the Gnatcloud. AI use: Gnatclouds sent one at a time.
- The Axiarchs: the Lancer the most efficient unit in the game (137-143); 71% under 15 minutes, 10-15% past 20 (an early-game
  faction; Classic its best map at 64%). Numbers: the Lancer.
- The checks asked for: Last Fist against the Axiarchs 31% (6i) / 46% (A-B), on Classic 33 / 33%, on Two-Lane 31 / 44%; the Axiarchs on
  Classic 64 / 64%; the Gnatcloud (four clouds beat 10 Marines 20-0; one dies without a kill); the Wraithwing (45-66 per 100, as the
  Prismwing; wins against Gunships, loses to Marines: not weak); Spitter openers by personality (40 / 50 / 50% after A-B, 40 / 88 /
  50% after round 1); the Titan's reach (it decides the Titan against the Lancer: 0-20 at 160, 8-12 at 190).

### Part D: tuning (b6j; docs/BALANCE_AUDIT.md section 18 has every table)

Three rounds, each measured with 162 matches; the last confirmed with 324 (two seed sets). Every change (docs/BALANCE_AUDIT.md
section 18.1):

| round | unit | stat | old -> new |
|---|---|---|---|
| 1 | Titan | range | 160 -> 190 |
| 1 | Lancer | damage | 16 -> 15 |
| 1 | Broodback | bite | 12 -> 24 |
| 1 | Gnatcloud | damage a second | 8 -> 3 |
| 2 | Titan | range | 190 -> 180 |
| 2 | Heavy | damage | 16 -> 19 |
| 2 | Tank | damage | 32 -> 36 |
| 2 | Spitter | quill damage | 6 -> 5 |
| 3 | Gnatcloud | damage a second | 3 -> 3.075 |
| 3 | Lancer | damage | 15 -> 14 |

Final (324): Last Fist 43% (37-50), Bloomhost 46% (39-52), the Axiarchs 49% (42-55); personalities 46 / 49 / 42%; pairings 50 / 36 /
53%; Spitter openers 61 / 60 / 60%. Missed: Last Fist on Two-Lane 29% (20-41) (its pairing with Bloomhost there 7-23-6; two
ablations explain neither change alone); the Titan against equal-value Lancers 20-0 in the Test Range after round 3's Lancer cut
(11-9 after round 2). The Gnatcloud's clouds-attack check 11-9 (20 seeds) and 22-18 (40), but its efficiency in matches stays
Bloomhost's lowest (6 per 100 spent). The node scenario (36): Bloomhost destroyed 895 enemy pad buildings (6i 977; the target of +30% missed), retakes 120 (121), Bloomhost 1-26-9; Skywyrms in assaults 4 times (6i 6).

### Tests

TESTS

### Departures

- A1 changes only where an aircraft is drawn and tapped; its SIM height (and where its shots start) is unchanged.
- A2's rule that a Mite takes the whole push applies to every Mite against its own side (the Brood Mound's and Blight's too).
- A3: the aim reaches the whole depth of every deep map (the abilities' own checks decide what is allowed there).
- B2's late air building (`late6j`) and the first-Leviathan score are AI logic changes measured inside the tuning rounds (from
  round 1 and round 3), not in the Parts A-B run; the tables say so where it matters.
- The Gnatcloud's check sits on a cliff: the outcome of four identical clouds over a clump of Marines flips over a few hundredths
  of a damage point (3.05: 38%, 3.075: 55%, 3.1: 68% over 40 seeds).

## Unchanged (already distinct)

Marine, Heavy, Tank, Flame Tank, Hydra, Interceptor, Medevac, Recon Drone, Mite, Razorwing, Cloudwing, Thornback, Lancer,
Gravemantle, Eventide, Prismwing, Shardstorm. (Batch 6h, with b6h on: the Mite reworked and redrawn, the Thornback replaced by the Broodback.) (Batch 6i, with b6i on: the Razorwing reworked into flocks, the Cloudwing replaced by the Blightwing.) (Every one of them is now drawn in the new style: Last Fist in batch 5a, the Bloomhost ones
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
visual references. A final art batch after batch 4 redraws the unchanged units and the buildings to match (units: batches 5a-5c;
buildings: batch 5d, v2.91, with team colour on their largest surfaces).

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
6. Art batch: unchanged units and buildings in the new style (units in 5a-5c; every building in 5d, done v2.91).

7. Batch 6a (v2.91): the balance audit (docs/BALANCE_AUDIT.md). Batch 6b (v2.92): the side-bias fix (`b6side`) and Artillery counterplay
   (`b6art`). Batch 6c (v2.93): the HQ shield rule (`b6hq`) and the first unit tuning (`b6c`). Batch 6d (v2.94): the AI
   personality fix (`b6ai`) and four faction values (`b6d`). Batch 6e (v2.95): Axiarch lane play (`b6elane`), the Axiarch
   energy costs, the Riftstalker's shields and the Marine's price (`b6e`). Batch 6f (v2.96): base attacks for every AI and the press
   rule's base defences (`b6fai`), the Axiarch prices undone and the player's warp-in (`b6f`). Batch 6g (v2.97): the playtest fixes
   (`b6g`): smart warp-in, attack orders, units under fire, node play, the Purification Beam, the Wraithwing. Batch 6h (v2.98): the Bloomhost
   ground rework (`b6h`: Pounce, the loose swarm, the Mite, the Spitter from the start, the Queen, the Leaper, the Chitin Warden,
   the Broodback, the Ruinmaw and its Tunnel, the AI), unit bodies for every faction (`b6hbody`), the Bloomhost node contest
   (`b6hnode`). Batch 6i (v2.99): the Bloomhost air
   rework (`b6i`: the Razorwing flock, the Gnatcloud, Blightwing, Talonmaw and Skywyrm, the air AI, the Chitin Warden quota) and the
   under-fire response rework (`b6iresp`). Batch 6j (v3.00): the playtest fixes (`b6jfix`) and the AI fixes and the full balance
   pass (`b6j`; docs/BALANCE_AUDIT.md section 18).

Then: the paused balance pass, with all three factions reworked.
