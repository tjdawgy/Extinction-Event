# Two-Lane map (Phase 1)

Approved after v2.63 (Proposal A), with two changes: forward pads take each faction's own Turret and Barracks, and a
map-select screen comes before each match. Format: docs/MAP_FORMAT.md. Engine: the multi-lane engine of v2.63.

## Layout

```
 y
-450 ┌──────────────────────────────────────────────────────────────────────────┐
-280 │      ╱═════════N1══F══════════════════════════F══N2═════════╲          │  north lane (230 wide)
     │     ╱                         ╲ ▲T  ╱                         ╲         │
   0 │ [W HQ]+pads  r      ███ ridge ███ C ███ ridge ███      r  pads+[E HQ]  │  centre crossing, x 1100
     │     ╲                         ╱ ▲T  ╲                         ╱         │
+280 │      ╲═════════S1══F══════════════════════════F══S2═════════╱          │  south lane
+450 └──────────────────────────────────────────────────────────────────────────┘
     0     220   460  700  880          1100          1320  1500  1740  1980  2200   x
  N1 N2 S1 S2: income nodes   C: rich centre node   F: forward pads   ▲T: watchtowers   r: Base rally flags
```

- **Size and shape:** 2200 × 900 (Classic: 1700 × 400). Mirror symmetry left to right (`mirror-x`), so north is north
  for both players.
- **Bases:** Classic's base layout (HQ, the same 8 home pads, the signature pad) at x 220 and 1980, so building works
  as on Classic. The Base rally flag sits where the lanes split (x 460 / 1740).
- **Lanes:** north at depth −280 and south at +280, 230 wide (Classic's width), splitting just past each base and
  joining again before the other. Between them a ridge (a blocker) with one gap in the middle, the **centre crossing**
  (x 1100, about 140 wide): the only way to switch lanes away from the bases. Ground units can't cross the ridge;
  aircraft fly over it.
- **Nodes (4 income, 1 rich centre, 2 watchtowers):**
  - Four lane nodes, one per lane on each half: (700, ±280) and (1500, ±280). Normal yield, Classic's 70 radius.
  - The **rich centre node** in the crossing at (1100, 0): 1.5× yield, reachable from both lanes; holding it is the
    contest the map is built around.
  - Two **watchtowers** at the crossing's ends, (1100, −150) and (1100, +150): captured like a node; once held, each
    shows the middle of its lane (sight 600) and the centre node. New node type `watchtower`.
- **Forward pads:** two per lane per side, just past each side's own lane node: (880, ±280) for the west, (1320,
  ±280) for the east. They take the **Turret and Barracks roles**, so each faction builds its own: Last Fist Turret
  and Barracks, Bloomhost Maw and Larva Pit, Axiarch Null Lance and Genesis Gate. New node type `forwardPad`. They let a
  side hold a lane without walking every unit from the base.
- **Army cap: 100** (Classic 80). Two fronts split the army, so a bigger cap keeps each lane's fight worth having.

## Map-select screen

Before each match, after the faction pick: one card per map, built from the map's `display` fields (MAP_FORMAT.md).

```
 ┌──────────────────────────── Choose a battlefield ────────────────────────────┐
 │  ┌─────────────────────────┐   ┌─────────────────────────┐                     │
 │  │ [thumbnail: one lane]    │   │ [thumbnail: two lanes,  │                     │
 │  │                          │   │  ridge, centre node]    │                     │
 │  │ Classic        ✓ default │   │ Two-Lane                │                     │
 │  │ One lane with field ...  │   │ Two lanes and a ...     │                     │
 │  └─────────────────────────┘   └─────────────────────────┘                     │
 │  [ Back ]                                                      [ Play ▸ ]      │
 └────────────────────────────────────────────────────────────────────────────────┘
```

- **Name and short description** from `display.name` / `display.desc`.
- **Thumbnail drawn by the game** from the map data (lanes, ridge and other blockers, bases, nodes), like the Codex
  pictures, so it can't disagree with the map.
- **Classic is the default** (preselected, and what a resumed or quick match uses); the last choice is remembered.
- Fits landscape iPhone at 858×396 and 667×375; the cards scroll sideways when more maps arrive.

## What it needs beyond v2.63

- The ridge as a blocker, with ground navigation that routes around it (MAP_FORMAT.md "blockers").
- The `watchtower` and `forwardPad` node types.
- A camera that pans up and down as well as along, and a minimap that shows both lanes.
- The map-select screen.
- A lane-aware AI (which lane to push, when to shift, holding the centre, using forward pads and watchtowers).
