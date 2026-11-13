# Army controls (Phase 1): select, then command

Replaces [SPLIT_ARMY.md](SPLIT_ARMY.md) (v2.66) and the v2.62 army controls (two rally flags, Send damaged home).

*Built in v2.73 (the SIM: src/sim/control.js), v2.74 (the UI: src/ui/controls.js) and v2.75 (the old rally flags and Send damaged home removed from the SIM). Numbers: the lasso arms after a 260 ms hold; a unit's tap area is 26 px around its body or feet; a moved selection spreads 14 apart; base flags heal within 80; lane maps put each lane's base flag 40 beyond the map's rally point, on the lane. KNOWN_ISSUES.md "Army controls redesign".*

The old controls were clunky on multi-lane maps: commands lived in the Army tab, too many orders overlapped (the global
stance, group and type orders, squad orders, Regroup, Rally, Send damaged home), and key actions hid in long-presses.

**The principle:** the player selects units, then tells them where to go or what to do. Nothing moves on its own; the only
automatic behaviours are Attack, Hold and Retreat.

## Screen layout (landscape)

```
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │ [credits] [energy] [army]  [HQ]  [ minimap · condition icons ]  [1×] [II]     │  top bar
 ├──────┬──────────────────────────────────────────────────────────────┬───────┤
 │ All  │                                                              │ abil 1│
 │  24  │                                                              │       │
 │ N  9 │                       battlefield                            │ abil 2│
 │ C  7 │                                                              │       │
 │ S  8 │                                                              │ abil 3│
 │      ├──────────────────────────────────────────────────────────────┴───────┤
 │      │ [Build][Train · to N] [cards ...........................]            │  bottom panel
 └──────┴──────────────────────────────────────────────────────────────────────┘
 While units are selected the bottom panel shows the command bar instead:
 │      │ [12 selected ×]  [ Attack ] [ Hold ] [ Retreat ]   tap the ground to move │
```

- **Left edge:** an **All** button, then one entry per lane (N, C, S), stacked to match the map (north on top), each
  showing the lane name and its unit count. The column runs from below the top bar to the bottom of the screen, so the
  four entries fit at 44 pt each at 667×375; the bottom panel starts to its right.
- **Right edge:** commander abilities (unchanged).
- **Bottom panel:** building and training only (Build and Train tabs). The Army tab is gone.
- **Top bar:** resources, the HQ's health, the minimap with condition icons, speed and pause. The top-bar Regroup button
  and the Hold / Attack / Retreat stance buttons are gone.
- **Command bar:** appears only while units are selected, in place of the bottom panel's contents (same spot, same
  height). It never covers the battlefield, so it can't cover the selected units, and it sits where the thumbs already
  are. Building and training come back as soon as the selection is cleared (after an order, or with the tag's ×).

## Selecting units

Only your own units; never enemies or the neutral relic guards.

- **Lasso:** press and hold on the battlefield for a moment (a ring fills under the finger), then draw a loop: the units
  inside it are selected (added to the selection). A quick drag still scrolls the camera, as before; the short hold is
  what tells a lasso from a scroll. A loop that isn't closed is closed for you; a stroke with almost no area selects the
  units along it.
- **Tap a unit** to select it; tap more units to add them. The hit area is generous (about 26 pt around each unit's body,
  aircraft at their drawn height), and a tap picks the nearest of your units under it.
- **Double-tap a unit** to select all your units of that type.
- **Double-tap a lane name** to select all units in that lane.
- **Tap All** to select your whole army.
- **A tag** shows "N selected" with a small × to clear. The selection clears after an order.
- **With nothing selected,** tapping empty ground does nothing (buildings, pads and flags still open as before).

## Commands for the selected units

- **Tap a spot on the battlefield:** they move there and hold. They hold their fire while moving (so damaged units can be
  pulled out of a fight), spread around the spot, and fight anything in range once there.
- **Attack:** they advance down the lane they're in and fight their way to the enemy base. On Classic, down the single
  lane. "The lane they're in" is the lane nearest each unit when the order is given.
- **Hold:** they stop and fight anything in range (melee units step out to enemies close to the spot they hold).
- **Retreat:** they return to their lane's base flag, holding fire, and hold there.

A unit has exactly one order. Units that were never ordered (new units) hold.

## Healing

- **Send damaged home is gone,** and so is any automatic sending of damaged units. Saving damaged units is the player's
  job: select them and move them.
- Units still heal at their side's **base flags** and at **held repair depots**, at the existing rates (3% of their
  health a second once unhurt for 3 s), whenever the player has moved them there.

## New units

- One lane is the **active lane**, clearly highlighted in the left column. Tap a lane name to make it active. The bottom
  panel shows "Training to N" (or C or S) on the Train tab.
- Trained units gather at the active lane's base flag and **wait on Hold** until the player orders them.
- Units trained at a **forward Barracks** (each faction's Barracks role on a forward pad) gather beside it instead and wait
  on Hold.
- Units that appear somewhere else (an Axiarch warp-in at the warp point, Emergency Brood, Mites, Cloudwing offspring)
  hold where they appear.

## Flags

Each lane keeps **one base flag**, tappable and movable: tap it (with nothing selected), then tap where it goes. The
Front (forward) flags and the Rally toggle are gone. On Classic there is one base flag.

## Removed

Hold / Attack / Retreat / Regroup as army-wide buttons (the top-bar stance and Regroup buttons and the Army tab's order
buttons), the Base / Front / Push concept (two rally flags, the Rally button), Send damaged home, squad chips, minimap
squad badges, squad long-press menus and the unit-chip long-press "send to lane".

## Classic

The All button and a unit count (no lane entries), plus all selection methods and commands. Retreat goes to the one base
flag.

## Rules for the build

- **The AI doesn't use these controls and plays the same.** Direct control is a mode of the player's side only
  (`directControl`); AI sides keep their stance, group and lane orders. Proven with seeded AI-vs-AI matches identical
  before and after on every map, with and without conditions.
- **Old saves load:** a save from before this change has its orders mapped onto the new ones: Hold (the stance or a group,
  type or squad order) holds where the unit stands, Attack attacks, Retreat and units sent home retreat to their lane's
  base flag, a Regroup moves to its flag and holds.
- **Touch targets** at least 44 pt, fitting at 858×396 and 667×375 on Classic, Two-Lane and Three-Lane without covering
  nodes, relics, depots, meteor warnings or the Power-failing badges.
- **Teaching it:** the tutorial's Army chapter, the Codex's How to Play controls section, and one first-time tip on lane
  maps.
