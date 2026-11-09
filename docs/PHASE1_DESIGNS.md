# Phase 1 designs: Three-Lane with crossings, repair depot and guarded relic, battlefield conditions

Design proposals sent after v2.68. Approved: Proposals D, E and F (each is built in its own Phase 1 item).

## Proposal D — Three-Lane with crossings

*Built in v2.70 (src/sim/maps-threelane.js). Changes from the sketch: the watchtowers sit at (1150, ±340), on the lane's inner side, so each sees its crossing too; the forward posts at (820, ±400) and (960, 0) and mirrors (clear of the lane nodes). KNOWN_ISSUES.md "Three-Lane".*

```
 y
-560 ┌──────────────────────────────────────────────────────────────────────────────┐
-400 │      ╱═══N1══F═════════════▲T═══════════════F══N2═══╲                       │  north lane
     │     ╱  ████████ wall ███  ╳gap  ███ wall ████████  ╲                       │
   0 │ [W HQ]════C1═══F════════╳══ ◆◆ C ══╳════════F═══C2════[E HQ]               │  centre lane
     │     ╲  ████████ wall ███  ╳gap  ███ wall ████████  ╱                       │
+400 │      ╲═══S1══F═════════════▲T═══════════════F══S2═══╱                       │  south lane
+560 └──────────────────────────────────────────────────────────────────────────────┘
     0    220  460 650 800      1000   1150   1300     1500 1650 1840  2080 2300   x
  N1 S1 C1 / N2 S2 C2: income nodes   C: rich centre   F: forward pads   ▲T: watchtowers   ╳: crossings (gaps)
```

- **Size: 2300 × 1120, mirrored left to right.** What item 1 taught: length is not what causes draws. Shortening Two-Lane from 2,200 to 1,900 cut Hard's median from 16:04 to 13:48 but left draws the same (35%), and a thinner economy made them worse (48%). Draws come from the winner's army being too small to break a base that keeps rebuilding. Three lanes add choice, not distance: the centre lane is a straight line between the HQs (2,060), the outer lanes curve out and back. Bases are Classic's layout at x 220 and 2080. So Three-Lane keeps Two-Lane's length and raises the cap (below) rather than shrinking the map; its third lane spreads armies thinner, so whatever fixes base-breaking on Two-Lane must come first.
- **Lanes:** north (−400), centre (0), south (+400), each 230 wide; the outer lanes split from the centre just past each base and rejoin before the other. Two walls (blockers) separate the outer lanes from the centre.
- **Crossings:** each wall has one gap at the middle (x 1150), so all three lanes meet at the centre: an army can switch lanes or hit a lane from the side. The gaps are 140 wide, like Two-Lane's crossing.
- **Nodes:**
  - Six income nodes, one per lane per half: (650, −400), (800, 0), (650, +400) and their mirrors. The centre lane's are further out (800) because the centre is the shortest road.
  - The rich centre node (1150, 0), 1.5×, where the three lanes meet.
  - Two watchtowers on the outer lanes at the middle (1150, ±400), each seeing its lane and the crossing beside it.
- **Forward pads:** one per lane per side (the centre lane gets one too), just past each side's own lane node: (800, ±400), (950, 0) and mirrors; two pads each, Turret and Barracks roles, with the v2.68 forward-Barracks rally.
- **Army cap: 120.** Three fronts.
- **Split Army with three squads (N, C, S):**
  - The squad column keeps its size: All on top, then N, C, S as three small chips side by side below it (about 26 px each, the same 84 px column). If that proves too tight to tap at 667 wide, N/C/S stack vertically and All moves to a long-press on any chip.
  - Long-press a squad: "Move to North / Centre / South" (the other two lanes), "New units: North / Centre / South / Alternate" (Alternate: round-robin).
  - Long-press a unit chip: "Send all Riflemen to North / Centre / South".
  - Minimap: three badges, one per lane.
  - The orders act on the selected squad exactly as on Two-Lane.
- **What the AI needs beyond Two-Lane:**
  - Splitting across three lanes (where the enemy is, round-robin when unknown).
  - Choosing an attack lane among three, and using the crossings: an attack that meets a strong army in one lane can switch to a neighbour at the crossing instead of retreating, and a side can flank a lane fight from the centre.
  - Capture groups for two watchtowers and the centre at once, and forward pads in three lanes.
  - Defence: noticing an attack in a lane it isn't watching (a watchtower lost is a warning).
  - The Two-Lane rules carry over: the one-lane attack, the breakthrough, the late-game commit (v2.68) and the forward-Barracks rally.

## Proposal E — the repair depot and the guarded relic

*Built in v2.71 (src/sim/nodes-special.js) on Three-Lane (map v2). Changes from the sketch: guards are a Titan and two Tanks; relics sit at both ends of the north wall, (740, −200) and (1560, −200), in a pocket made by starting the walls 120 nearer the centre, so passing armies don't fight the guards; depots at (1150, ±470). KNOWN_ISSUES.md "Repair depot and guarded relic".*

- **Repair depot** (`NODE_TYPES.repair`, `heal`): a capturable node. Its holder's units within its radius heal `heal`% of their health a second while they haven't been hurt for 3 s (the same rule as Send damaged home at the base flag); no income.
  - It gives Send damaged home a second, nearer target: damaged units go to the nearest held depot instead of the base flag.
  - **Maps:** Three-Lane (one in each outer lane, at the middle, replacing nothing: it sits beside the watchtowers), and an optional swap for a lane income node on Two-Lane later. Not on Classic.
- **Guarded relic** (`NODE_TYPES.relic`, `guards`, `reward`): a neutral camp: a few strong neutral units (`guards`, e.g. one Titan, or a matching unit per faction at the same strength) that defend their spot and never leave it. Kill the guards and stand on the relic to capture it once: its holder gets `reward` (e.g. 800 credits, or a free T2 unit) and the relic is spent.
  - It rewards a mid-game detour: an army that takes it isn't fighting the enemy for a minute.
  - **Maps:** Three-Lane (one at the far end of each wall, off the lanes, reached through a short side path: two relics, mirrored). Not on Classic or Two-Lane.
  - **AI:** takes a relic when its army is idle and clearly stronger than the guards, never during a fight.

## Proposal F — battlefield conditions

*Built in v2.72 (src/sim/conditions.js). Changes from the sketch: the icons sit on the minimap's right edge (the top bar has no room beside it); a meteor deals 260 to ground units and 420 to buildings within 90, less toward the edge, and spares aircraft. KNOWN_ISSUES.md "Battlefield conditions".*

Conditions are rules for one match, chosen on the map-select screen (a row of toggles under the map cards; none by default). A map lists the conditions it allows (`conditions` in MAP_FORMAT.md). The match shows its conditions as small icons by the minimap, and the post-match screen lists them.

| Condition | What it does | Maps |
|---|---|---|
| Heavy fog | Every sight radius × 0.6; watchtowers × 0.8; explored ground fades back to unexplored after 60 s without vision. Scouting and watchtowers matter more. | All |
| Rich centre | The centre node pays 3× (Two-Lane, Three-Lane) or the middle node 2× (Classic); the AI values it accordingly. | All |
| Scarce resources | Refineries and nodes pay 0.6×, start credits 200; armies are smaller and every loss hurts. The storm stays where it is, so matches are still bounded. | All |
| Meteor strikes | From 5:00, every 45 s a meteor falls on a random open spot (a warning circle for 4 s first), dealing heavy damage in a radius to units and buildings of both sides. Spots are drawn from the match's seeded stream, so a replay repeats them. | Two-Lane, Three-Lane (Classic is too narrow to dodge) |

- **How a player picks them:** on the map-select card's row of toggles (each with a one-line description), or "Random condition" (one chosen at the start). The last choice is remembered like the map.
- **AI:** each condition comes with its small adjustments (fog: scout more often; rich centre: contest it earlier; scarce: lower army targets; meteors: never stand still in a warning circle).
- **Daily challenge (Phase 3):** the same seeded map and condition for everyone, as the roadmap plans.
