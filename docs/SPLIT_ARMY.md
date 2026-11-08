# Split Army (Phase 1)

Approved after v2.63 (Proposal B), with two changes: aircraft belong to a squad and follow its orders, flying over
the ridge; and a first-time tip on Two-Lane, with Split Army added where the controls are explained. Engine: lane
orders (`giveOrder(…, 'lane', …)`, `setLane`) from v2.63.

## Controls

```
 Army tab today:   [Build/Train][Army][unit chips ...........] [Hold   ][Attack ] [Rally]
                                                               [Retreat][Regroup] [Send ]
 On Two-Lane:      [Build/Train][Army][unit chips ....] [ All 24  ] [Hold   ][Attack ] [Rally]
                                                        [N 13][S 11] [Retreat][Regroup] [Send ]
 Long-press a squad chip: "Move North squad to South" · "New units: North / Alternate / South"
 Long-press a unit chip:  "Send all Riflemen to North / South"
 Minimap: badges "N 13" / "S 11" on each lane; tap one to select that squad.
```

- **Squads are lanes.** On a two-lane map every unit belongs to the North or South squad (its lane). No separate squad
  numbers to manage: the squad is where the unit is going.
- **Aircraft** belong to a squad like everything else and follow its orders; they fly straight over the ridge instead
  of walking the lane.
- **Squad chips:** one column, about 84 px wide (the Rally column's width), just left of the order buttons: All on
  top, N and S side by side below it, each with a unit count. One tap selects; the selection stays until changed.
  All is the default.
- **The four orders act on the selected squad:**
  - **Hold:** that squad stops where it is and fights what comes within reach.
  - **Attack:** that squad pushes along its own lane toward the enemy base.
  - **Retreat:** that squad walks back along its lane to the Base flag, holding fire.
  - **Regroup:** that squad gathers at its lane's Forward flag (each lane has its own Forward flag; the Base flag is
    shared).
  - With All selected they act on the whole army, as today. The top-bar Regroup stays whole-army.
- **Moving units between squads (long-press):**
  - A squad chip → "Move North squad to South": that squad walks to the other lane (through the centre crossing or
    its own base, whichever is nearer).
  - A unit chip → "Send all Riflemen to North / South": every unit of that type.
  - A squad chip → "New units: North / Alternate / South": where new units go. Alternate (the default) fills both
    lanes evenly with no input.
- **Rally and Send damaged home** keep working: Rally switches the selected squad between the Base flag and its lane's
  Forward flag; Send damaged home covers both squads.
- **Classic:** nothing changes for the player. Only the All squad exists, so the squad column doesn't appear.
- **Fit:** the squad column takes about 84 px from the unit-chip row, which already scrolls at 667 wide; the order
  buttons and the Rally column don't move. Checked at 858×396 and 667×375 (on screen, nothing covered, tappable
  sizes).

## Teaching it

- **First-time tip:** the first time a player starts a Two-Lane match, a short tip explains squads (All / N / S, orders
  act on the selected squad) and the long-press actions. Shown once (remembered in localStorage).
- **Codex / tutorial:** Split Army is added wherever the controls are explained (the Codex's How to Play, and the
  tutorial's Army chapter as a note that applies on lane maps).

Not in this design: more than two squads, free-form squads (drag-select), squads on Classic.
