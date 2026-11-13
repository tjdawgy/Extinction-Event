# Army controls (Phase 1): select, then command

Replaces [SPLIT_ARMY.md](SPLIT_ARMY.md) (v2.66) and the v2.62 army controls (two rally flags, Send damaged home).

*Built in v2.73 (the SIM: src/sim/control.js), v2.74 (the UI: src/ui/controls.js) and v2.75 (the old rally flags and Send
damaged home removed from the SIM). Refined after the first playtest on Three-Lane (v2.76 onward); this document describes
the refined design. What changed after the playtest: the lane flags and the active lane are gone (one base rally point),
Attack picks a lane, units always engage while moving (Retreat excepted), units spread out instead of stacking, a rectangle
box replaces the lasso, double-tap selects only what is on screen, a tap on an enemy targets it, and three control groups.
KNOWN_ISSUES.md "Army controls redesign".*

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
 │      │ [Build][Train] [cards .....................................] [1][2][3] │  bottom panel + groups
 └──────┴──────────────────────────────────────────────────────────────────────┘
 While units are selected the bottom panel shows the command bar instead (the group slots stay):
 │      │ [12 selected ×]  [ Attack ] [ Hold ] [ Retreat ]  tap the ground… [1][2][3] │
```

- **Left edge:** an **All** button, then one entry per lane (N, C, S), stacked to match the map (north on top), each
  showing the lane name and its unit count. The column runs from below the top bar to the bottom of the screen, so the
  four entries fit at 44 pt each at 667×375; the bottom panel starts to its right. On Classic, just All.
- **Right edge:** commander abilities (unchanged).
- **Bottom panel:** building and training only (Build and Train tabs). The Army tab is gone.
- **Control group slots:** three small slots (1, 2, 3) at the right end of the bottom panel, where the right thumb rests,
  in both the building view and the command bar. They take room from the card strip and the command bar's hint, never
  from the battlefield.
- **Top bar:** resources, the HQ's health, the minimap with condition icons, speed and pause.
- **Command bar:** appears only while units are selected, in place of the bottom panel's contents (same spot, same
  height). It never covers the battlefield, so it can't cover the selected units, and it sits where the thumbs already
  are. Building and training come back as soon as the selection is cleared (after an order, or with the tag's ×).
  Unchanged by the refinements.

## Selecting units

Only your own units; never enemies or the neutral relic guards. Every way of selecting adds to the selection; the tag's ×
clears it.

- **Tap a unit** to select it; tap more units to add them. The hit area is generous (about 26 pt around each unit's body,
  aircraft at their drawn height), and a tap picks the nearest of your units under it.
- **Double-tap a unit** to select all your units of that type **visible on screen** (not the ones scrolled out of view).
  There is no triple tap and no waiting for more taps: the first tap selects at once, the second (within 350 ms, on the
  same type) widens it.
- **Rectangle box:** press and hold on the battlefield for a moment (a ring fills under the finger, as before), then drag:
  a box is drawn from the corner where the finger went down to where it is now, like a mouse on a computer. On release the
  units inside the box are selected. A quick drag still scrolls the camera; the short hold is what tells a box from a
  scroll. The lasso is gone.
- **All** (top of the left column) selects your whole army.
- **Tap a lane** in the left column to select all your units in that lane (one tap; no double-tap). A unit is in the lane
  whose centre line is nearest to where it stands; units in the base (between the HQ and the base rally point, where the
  lanes meet) count toward All only.
- **A tag** shows "N selected" with a small × to clear. The selection clears after an order.
- **With nothing selected,** tapping empty ground or an enemy does nothing (your buildings and pads still open as before).

## Commands for the selected units

- **Tap a spot on the battlefield:** they move there and hold. On the way they **stop to fight** enemies they meet (an
  enemy in weapon range; melee units close on one nearby), then carry on. Once there they spread into a loose cluster
  around the spot (see Spacing) and fight anything in range.
- **Tap an enemy** (a unit, a building or a relic guard you can see): they go and attack that target, fighting enemies
  they meet on the way. Once it is dead they **Hold** where they are. If it slips out of sight they go to where it was last
  seen and hold there if it is gone.
- **Attack:**
  - On a multi-lane map, tapping Attack shows the lanes (N, C, S) as buttons, stacked as on the map, with the lane nearest
    the selected units highlighted (the lane most of them are nearest; ties go north first). Tapping a lane sends the
    units to it and they attack down it, fighting their way to the enemy base. Tapping anywhere else cancels (that tap
    does nothing else) and keeps the selection.
  - On Classic, Attack goes down the single lane at once.
- **Hold:** they stop and fight anything in range (melee units step out to enemies close to the spot they hold). Units
  standing on top of each other step apart into their own spaces.
- **Retreat:** they return to the **base rally point**, holding their fire and ignoring enemies, and hold there. Retreat is
  the only order that ignores enemies.

A unit has exactly one order. Units that were never ordered (new units) hold.

## Spacing

Units never stack into one spot. Wherever they gather (the base rally point, a tapped spot, a depot, beside a forward
Barracks, where Hold finds them) each unit takes its own space in a loose cluster:

- Each unit type has a footprint sized from its body (small infantry close together, Titans and other big units further
  apart); two units stand at least the sum of their footprints apart, measured as they appear on screen.
- Spots are never inside walls or other blockers, never off the map, and never on a spot another of your units is already
  holding or heading for. Aircraft and ground units are spaced separately (aircraft fly above).
- The nearest units take the spots nearest the point, so a cluster forms around it, growing outward as more arrive.

## Healing

- **Send damaged home is gone,** and so is any automatic sending of damaged units. Saving damaged units is the player's
  job: select them and move them (or Retreat them).
- Units heal at the **base rally point** (anywhere in the cluster around it) and at **held repair depots**, at the existing
  rates (3% of their health a second once unhurt for 3 s), whenever the player has moved them there.

## New units

- Trained units gather at **one rally point in the middle of the player's base** (the map's rally point, where the lanes
  meet) and **wait on Hold** until the player orders them, each in its own space.
- Units trained at a **forward Barracks** (each faction's Barracks role on a forward pad) gather beside it instead and
  wait on Hold.
- Units that appear somewhere else (an Axiarch warp-in at the warp point, Emergency Brood, Mites, Cloudwing offspring)
  hold where they appear, stepping apart if they would stack.
- There are no lane flags, no active lane and no "Training to N": the lane is chosen when the player gives Attack.

## Control groups

- **Three slots** (1, 2, 3) at the right end of the bottom panel, each at least 44 pt.
- **Hold a slot** (about half a second) to save the current selection into it; the slot flashes and a toast confirms
  ("Group 2: 12 units"). With nothing selected, holding a slot only explains how.
- **Tap a slot** to select that group (it replaces the current selection). **Double-tap** it to jump the camera to the
  group (the first tap has already selected it; no waiting).
- Each slot shows its unit count. Dead units drop out; new units are never added on their own. An empty slot shows a dash.
- Groups are saved with the match and survive save and load.

## Removed

Hold / Attack / Retreat / Regroup as army-wide buttons (the top-bar stance and Regroup buttons and the Army tab's order
buttons), the Base / Front / Push concept (two rally flags, the Rally button), Send damaged home, squad chips, minimap
squad badges, squad long-press menus and the unit-chip long-press "send to lane". After the playtest: every lane's base
flag and moving them, the active lane and "Training to N", the lasso, and double-tapping a lane.

## Classic

The All button and a unit count (no lane entries), plus all selection methods, commands and control groups. Attack goes
down the single lane without a picker. Retreat goes to the base rally point.

## Rules for the build

- **The AI doesn't use these controls and plays the same.** Direct control is a mode of the player's side only
  (`directControl`); AI sides keep their stance, group and lane orders. Spacing and engaging while moving live in the
  direct-control code only, not in the shared movement the AI uses. Proven with seeded AI-vs-AI matches identical before
  and after on every map, with and without conditions.
- **Old saves load:** a save from before v2.73 has its orders mapped onto the new ones (Hold holds where the unit stands,
  Attack attacks, Retreat and units sent home retreat to the base rally point, a Regroup moves to its flag and holds). A
  save from v2.73–v2.75 has its lane flags and active lane removed; units walking to or waiting at a flag keep their spot
  or are sent to the base rally point.
- **Touch targets** at least 44 pt, fitting at 858×396 and 667×375 on Classic, Two-Lane and Three-Lane without covering
  nodes, relics, depots, meteor warnings or the Power-failing badges.
- **Teaching it:** the tutorial's Army chapter, the Codex's How to Play controls section, and one first-time tip on lane
  maps.
