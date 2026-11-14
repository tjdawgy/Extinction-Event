# Known issues

Issues found during testing that are deliberately deferred. Each lists the step that should address it.

## Faction rework batch 2a (v2.82): Artillery, Gorebore, Severance
- **What:** docs/FACTION_REWORK.md "Batch 2" (first three units), behind `REWORK` (src/sim/rework.js), stored per game as `g.rw` (`b2a`, `artDeploy`, `artTelegraph`; all on by default; saved only when `b2a` is on, so a save from before loads with the batch off). Artillery: deploys 2 s before firing, packs up 1.5 s before moving (`u.dep`, `artDeploy`), shells marked on the ground from firing to impact, at least 1.6 s (`g.mk`, `telegraph`), AI units step out (`markDodge`). Gorebore (`gorebore`, replaces the Bile Lobber): burrows when moving with burrow ready (`u.bur`, `u.gone` 1: untargetable, unhurt, can't be exiled), trail drawn from where it has been (render only), erupts under its target (70 within 45), 4 s exposed, burrow again 10 s after. Severance (`severance`, replaces the Rift Mortar): rift orb every 12 s (projectile weapon `exile`, speed 120, range 300), 20 damage then 4 s exile (`u.exT`, `u.gone` 2: frozen, untargetable, timed effects shifted on return, `EX_TIMERS`), 6 s immunity, a weak bolt between. Departures from the design are listed in docs/FACTION_REWORK.md under Batch 2.
- **Off = v2.81:** every pinned fingerprint in tests/determinism.test.js matches with `REWORK.b2a` false; the same three matches with it on are recorded (FP_V282, FP_V282_BA, LF_BH_V282).
- **Checks:** tests/rework-2a.test.js; self-play Hard vs Hard on Classic, Two-Lane and Three-Lane, all six faction pairings each (18 matches), to the end without errors (eruptions, exiles and telegraphed shells all used by the AI; the Last Fist siege push still happens); screenshots docs/screenshots/rework2a-*.png (tests/rework-2a-shots.js); frame time with six of each on screen in headless Chromium: median 16.7 ms (60 fps cap). tests/slow/ai-stats.test.js: the Bloomhost Turtle's Emergency Brood now shows up in 25% of 20 matches (40% with the batch off: its Gorebores are hard to kill, so fewer emergencies), so that bar went from 25% to 15%; nothing else in the slow suite changed.
- **Open (for playtest, no tuning done):** the Gorebore surfaces quietly when it stops underground with no target, so a Gorebore on Hold flickers down and up as it repositions; a Gorebore's eruption snaps it under a moving target, which can look like a short jump; the Severance aims at a group's centre with no lead, so a marching column often walks out of the orb (by design the counter is to keep moving, but the AI's orbs land mostly on fights); markers from a salvo overlap into one big shape; at 667×375 in Compare the strips are small, but markers, trails and exile rings stay readable; path and step names in the UI follow the new-game default even on an old save resumed with the batch off. Bloomhost lost its only long-range unit: expect it to need attention in the balance pass.

## Test Range (v2.81, faction rework batch 1)
- **What:** a sandbox from the main menu for watching units fight on the real SIM (docs/FACTION_REWORK.md, batch 1; README "Test Range"). Each row is an ordinary game (`rangeGame`, src/sim/testrange.js) stepped by the ordinary `update`, with no HQs in play (kept off the map and out of `g.ents`, so it never ends), no nodes, no storm, no fog (`g.range`), both AIs idle and both sides under direct control. Attack sends each unit at the nearest enemy it can hurt with the real target order (`rangeOrders`, every 30 ticks); Hold is the real Hold; `side.hush` (Enemies fight back off) stops a side's units, guns and auras; `side.manual` (Control blue myself) hands blue to the game's own controls. Compare: up to three rows, each its own game (units, shots and effects can't cross; the render effects pools are swapped per row). Reset rebuilds every row from the recorded spots with the same seed (a first Start does too, so the first run is exactly what Reset replays). Setups: up to 5 by name in localStorage `extinctionEvent.range`.
- **Matches unchanged:** the new SIM checks (`g.range` in `updateVision` and `updateBaseHeal`, `side.hush` in `updateUnit`, the building gun and `updateAuras`) read flags no match sets; the determinism fingerprints and every other test pass unchanged.
- **Tests:** tests/testrange.test.js (SIM), tests/testrange-ui.test.js (browser, 667×375); screenshots by tests/testrange-shots.js (docs/screenshots/testrange-*.png).
- **Open (for playtest):** the field is Classic's lane (1,700 long, 230 deep), so groups placed far apart in depth still fight along it; placed buildings are T1 only; a side's faction-wide rules (Salvage, creep, the power field) follow the faction of the first thing placed on that side in that row; the info card covers part of a single row's field at 667×375 (close it with ×); Compare strips are small at 667×375 (three rows of about 58 px), readable for comparing but not for detail; in Compare the drag scrolls all rows together. Mid-run placements and player orders are not replayed by Reset (it replays the setup from 0:00).

## Target follow-up (v2.80, Phase 1): after a target dies under an enemy defence
- **What:** when the enemy a group was sent at (a tap on an enemy) dies, the SIM checks whether any enemy static defence (any finished enemy building with a gun: the HQ's gun, Turrets, bunkers and each faction's equivalents; `ctlGuns`, `ctlReach`, which follows each gun's tier, anti-air range and the damage table) can reach any unit of the group. If one can, the whole group (`ctlFollow`: the units given that target) falls back toward its own base along the lane it is in to just outside the reach of every enemy defence (`CTRL.safe` 24 plus the unit's footprint past each range), each to its own spot (spacing), holding fire on the way like Retreat (`po.back`; otherwise it stops to fight the defence it is leaving) and holds there. If none can, each unit holds where it is, as before. Player side only (direct control); docs/CONTROLS.md.
- **Tests:** tests/controls.test.js (Classic, Two-Lane, Three-Lane: falls back, every unit outside every defence and within a footprint and 60 of the nearest reach, spaced out; no defence: holds where it is); tests/controls-refine-ui.test.js (Two-Lane in the browser with a real tap on the enemy).
- **The AI is unchanged:** audit/sim/ai-identity.js against v2.79's index.html, the 14 seeded Hard matches (every map, every condition), identical at every checkpoint (audit/logs-p1/follow-v280/ai-identity.txt).
- **Open (for playtest):** a group falling back holds fire even if enemy units chase it out of the defence's reach; it fights again once it holds. The out-of-sight case (the target slips away and is gone) still holds where it was last seen.

## Army controls redesign (v2.73–v2.75, Phase 1): select, then command; refined in v2.76+ after the Three-Lane playtest
- **Refinements (v2.76+, docs/CONTROLS.md):** the playtest on Three-Lane found taps working well and asked for: no lane flags and no active lane (one base rally point), Attack picking a lane, units always engaging while moving (Retreat excepted), spacing instead of stacking, a rectangle box instead of the lasso, double-tap selecting only on-screen units of the type, a tap on an enemy to target it, and three control groups.
- **v2.76, the SIM part (src/sim/control.js):** `side.flags`, `side.active`, `setFlag`, `setActiveLane`, `flagHome`, `flagSpot`, `updateFlagHeal` removed. The base rally point is the map's rally point (`ctlBase`; Classic and both lane maps (460, 0) and its mirror, where the lanes meet). Trained units gather there (`ctlTrained` → `ctlSettle`), a forward Barracks' beside it, arrivals (warp-ins, Brood, Mites, offspring) where they appear (`ctlArrive`); Retreat goes there (`ctlRetreat`, each unit to its own spot, holding fire, ignoring enemies, back along the lane it is in). Healing: `updateBaseHeal`, within `CTRL.healR` 150 of the point (measured as on screen, so the whole cluster heals), plus held depots as before. **Spacing:** `ctlPack` gives each unit its own spot: footprint `ctlFoot` = the type's height × 0.4 (7 to 22), neighbours at least both footprints + 4 apart as on screen (x, y × 0.5), aircraft and ground apart, never on closed ground or off the map, never on a spot another unit of the side holds or is heading for; the nearest units take the middle; Hold packs each unit nearest where it stands. **Engaging:** a unit on 'go' or 'target' is 'adv' in `updateUnit`: anything in weapon range stops it to fight, melee units close on prey within their chase range, a Titan plants for it; Retreat alone holds fire. **Target** (`command(…, 'target', id)`): an enemy unit, building or relic guard the side can see; fired at first when in reach (`ctlCanHit`; a planted Titan too), others met on the way are fought; out of sight it goes where the target was last seen; dead or gone, the unit holds where it is (in its own space). **Attack with a lane** (`command(…, 'attack', k)`): a ground unit off that lane first crosses to it (`po.ju`, fighting on the way), then attacks down it. **Control groups:** `side.groups` (three id lists, saved with the match), `setGroup`, `groupUnits` (the dead drop out). **Old saves:** `ctlTidy` removes v2.73–v2.75's flags and active lane (units retreating to a flag get a spot at the base rally point; units holding by a flag stay); older saves map as before, Retreat to the base rally point. Direct-side units take the lane they stand in when they appear (`ctlSpawn`), not the alternating `laneNew` (a retreating unit with the wrong lane got stuck by the north-west wall in testing).
- **v2.77, the Attack lane picker and targets (src/ui/controls.js):** on a lane map Attack opens `#lpick` above the Attack button: the lanes stacked north to south, 44 pt each, the lane most of the selection is nearest (`laneAt` per unit, ties north) highlighted and marked "nearest"; a lane attacks down it (`command(…, 'attack', k)`; units off that lane cross over first); a tap anywhere else only closes it (the selection stays); pausing closes it. Classic: Attack at once. With units selected, a tap on an enemy unit or relic guard you can see (nearer the tap than any of yours) or on an enemy building (unless one of yours is within 12 px under the tap) targets it, with a red reticle; nothing selected: nothing. SIM: units on the move (a spot, the crossing to a lane, a target) pass relic guards by unless a guard is the target (in testing, a South-to-North crossing walked past the west relic and stopped to fight its guards).
- **v2.78, selection (src/ui/controls.js, src/ui/panel-alerts-input.js):** the lasso is gone: hold until the ring fills (260 ms, as before), then drag; a dashed box runs from the corner where the finger went down to where it is, with handles and a live count of your units inside; on release the units whose body or feet are inside are added (`boxSelect`); a box under 14 px is a tap; a quick drag still scrolls. Double-tap a unit: your units of its type whose body or feet are on screen (right of the column, below the top bar, above the bottom panel: `fieldView`) are added at once; a third tap is just a tap. The tutorial's step is a box.
- **v2.79, control groups and teaching:** three slots (1, 2, 3) at the right end of the bottom panel, 46×68 px, in the building view and beside the command bar (which now stops 151 px short of the right end and, at 667 wide, drops its "Tap the ground" hint). Hold a slot 450 ms: a green bar fills, then the slot flashes and a toast says "Group 2: 4 units" (with nothing selected the toast explains how); tap: the group replaces the selection; a second tap within 350 ms jumps the camera to the group's centre. The count is the group's living units; the dead drop out; nothing is added. Saved with the match (`side.groups`). The tutorial's Army chapter: the box, a hold-to-save step, groups, targets, the lane picker; the Codex Army controls and the lane-map tip rewritten. The lane picker drops its title and closes up when it would reach the top bar (667×375).
- **v2.76–v2.79 checks:** AI identity vs v2.75 on all 14 cases after the SIM changes of v2.76 and v2.77 (audit/logs-p1/controls-v276, controls-v277); npm test and npm run test:slow per SIM step; tests/controls.test.js (SIM), tests/controls-refine-ui.test.js (browser: rally point and spacing, engaging and Retreat, All and lanes, the lane picker, targets, double-tap on screen, the box, groups incl. save and load, slot fit at both sizes on every map), the fit test in tests/controls-ui.test.js covers the slots; screenshots docs/screenshots/controls-{threelane,classic}-{rally,box,picker,groups,target}-*.png (no picker on Classic).
- **Awkward points (refinements; found while building, not measured with players):**
  - **Units in the base belong to no lane:** within 140 of the rally point (where the lanes meet) units count toward All only, so freshly trained units show as All 10, North 0, Centre 0, South 0. Accurate, but a player may expect them under a lane.
  - **Engaging on the move can stall a move:** a unit sent somewhere fights anything in range on the way, so a group sent past a defended spot stops there; Retreat is the only way through. On the way they walk past relic guards (only guards they target are fought), else a lane crossing next to a relic turned into a relic fight.
  - **A target dying leaves the group where it stood,** possibly inside enemy gun range (by design: "Hold where they are").
  - **The lane picker covers part of the field** above the command bar for a moment (3 × 44 pt); at 667×375 it fills the space between the top bar and the command bar exactly.
  - **Group slots take 151 px** from the card strip and the command bar; at 667 wide the bar's hint is hidden and Retreat sits next to slot 1. Holding a slot with a selection overwrites it without asking.
  - **Hold now steps stacked units apart,** so a few may walk a step after Hold before standing still.
  - **Double-tap adds** (rather than replacing) so two types can be combined; clear with × first for one type only.
  - **A tap near your own units with a selection** prefers whichever unit (yours or the enemy's) is nearest the finger; an enemy building wins unless one of yours is within 12 px under the tap.
- **The AI plays exactly as v2.75:** everything above is behind `side.direct` or in a direct-only order; `titanSiege` lost the 'go' case (only a direct side ever had it) and gained an optional target. audit/sim/ai-identity.js against v2.75's index.html: see audit/logs-p1/controls-v276/ai-identity.txt.
- **Design:** docs/CONTROLS.md (replaces docs/SPLIT_ARMY.md and the v2.62 rally flags and Send damaged home). The player selects units, then tells them where to go or what to do; nothing moves on its own; the only automatic behaviours are Attack, Hold and Retreat.
- **SIM (v2.73, src/sim/control.js):** direct control is a mode of one side (`side.direct`, switched on by `directControl`; the game's UI does it for the player at every match start, resume and tutorial match; AI sides and the audit bots never have it). Each unit has its own order `u.po` (`command(g, s, ids, o, u, v)`): **go** (walk to the spot holding fire, the selection spread in a sunflower `CTRL.gap` apart, then Hold there; the unit joins the lane nearest the spot), **attack** (down the lane nearest the unit when ordered, to the enemy base; Classic: the single lane), **hold** (stop; fight what is in reach; melee steps out within the usual hold distance), **retreat** (to its lane's base flag holding fire, then Hold). One base flag per lane (`side.flags`, `flagHome`: the map's rally point, on lane maps 40 further out on each lane), movable within the old flag limits (`setFlag`). The active lane (`side.active`, `setActiveLane`): trained units walk to its flag and hold; a forward Barracks' units hold beside it (`ctlFwdSpot`); warp-ins, Brood, Mites and other arrivals hold where they appear. Healing: `CTRL.heal` 3%/s once unhurt `CTRL.calm` 3 s within `CTRL.healR` 80 of a base flag (`updateFlagHeal`), and held repair depots as before; nothing sends a unit home. Old saves: Hold (stance, group, type or squad) holds where the unit stands, Attack attacks, Retreat and units sent home retreat, a Regroup walks to its flag and holds; the old flags, orders and squad state are cleared.
- **The AI plays exactly as before:** audit/sim/ai-identity.js plays 14 seeded Hard-vs-Hard matches (Classic plain and with heavy fog, rich centre, scarce; Two-Lane and Three-Lane plain and with all four conditions) in this build and in v2.72 and compares a hash of the whole state every 100 ticks: identical at every checkpoint in all 14 (293–818 checkpoints each; audit/logs-p1/controls-v273/ai-identity.txt). The AI never relied on Send damaged home (it never set `u.medHome`), so nothing had to move into the AI.
- **UI (v2.74, src/ui/controls.js):** the left column (All, then North / Centre / South stacked as on the map, each with its unit count; from below the top bar to the bottom of the screen, 52 px wide, so four 44 pt entries fit at 667×375; the bottom panel starts to its right and the camera can scroll the field's left edge clear of it, `V.lpad`); tap a lane: the active lane (gold edge and ⚑; the Train tab's first item reads "Training to South"); double-tap: its units. Selecting: tap a unit (more taps add; hit radius 26 px around its body or feet, nearest wins), double-tap a unit (its whole type), hold 260 ms until a ring fills then draw a loop (a lasso; a quick drag still scrolls; a stroke with almost no area selects along it), All. Only the player's units: enemies and relic guards are never candidates. Selected units carry a pulsing ring. The command bar takes the bottom panel's place while anything is selected: "N selected ×", Attack, Hold, Retreat, and the hint "Tap the ground to move them there"; the selection clears after an order. With nothing selected, a tap on empty ground does nothing (buildings, pads and flags still open). A base flag: tap it with nothing selected, then the ground.
- **Removed:** the Army tab (group and type chips, Hold / Attack / Retreat / Regroup), the top-bar Regroup and Hold / Attack / Retreat buttons, the Rally button and Forward flags, Send damaged home, squad chips, minimap squad badges, the squad and unit-chip long-press menus, the Split Army tips (one lane-map tip instead, `extinctionEvent.tips` key `lanes`). The SIM keeps `setStance`, `giveOrder` and lane orders for the AI and the audit bots.
- **Layout changes:** Build and Train tabs side by side (each a full-height target); the top bar 46 px tall so speed and pause are 44 pt; alerts and the Overdrive badge moved right of the column; the building panel 3 px lower so its path picker stays clear of the taller top bar at 667×375.
- **v2.75, the old SIM removed:** `useRally`, `setRally`, `flagPt`, `sqFlag`, `rallyOf`, `setLaneNew`, `sendDamagedHome`, `medDepot`, `DAMAGED` and every `u.medHome` path; `rallyU` is the map's rally point. The AI never used them (repeated on v2.75: all 14 cases identical to v2.72 at every checkpoint, audit/logs-p1/controls-v275/ai-identity.txt). tests/army-controls.test.js removed; split-army.test.js keeps the engine's lane orders, which the AI and bots use.
- **Awkward points to refine** (found while building; none measured with players yet):
  - **The lasso needs a 260 ms hold** before drawing, because a one-finger drag already scrolls. Natural for a long loop, slow for a quick grab. Alternatives: two-finger scroll with a one-finger lasso, or a lasso button.
  - **Generous unit taps win over everything:** a tap near your own units selects one even when you meant an enemy beside them, a flag they are waiting at, or a node they stand on. Moving a base flag that has units waiting at it means tapping the flag's cloth, above them. With units selected, a tap on your own building is a move order there, not the building panel (clear the selection first).
  - **The command bar replaces Build and Train** while anything is selected: building means clearing the selection (×) or giving the order first.
  - **Moving holds fire** (so damaged units can be pulled out); there is no "attack-move" to a spot, only Attack down a lane. A selection sent across the field will not shoot back until it arrives.
  - **"The lane they're in" is the nearest lane's centre line** when the order is given. Near the bases, where the lanes meet, a unit can count as a lane the player didn't mean (ties go north first); the column's counts follow the same rule (and a moved unit counts toward the lane of its destination).
  - **New units only hold:** a base attacked while the army waits at the flags is defended only by what is in range. Losing a unit to the lack of automatic retreat is now the player's to prevent.
  - **Classic keeps the full column width** for a single All button (58 px of the bottom panel), for one layout on every map.
  - **The top bar grew 6 px** (46) so speed and pause are 44 pt; the battlefield is 6 px shorter.
- **Tests:** tests/controls.test.js (SIM), tests/controls-ui.test.js (browser, real taps and drags; 44 pt targets and fit at both sizes on every map; every node, relic, depot, a meteor spot and the HQ brought clear of the controls; the HQ clear of the column in the home view), tests/threelane-ui.test.js (the column with three lanes, orders per lane, the active lane, the tip), tests/tutorial.test.js (the new lasso and double-tap steps are played with real gestures); screenshots tests/controls-shots.js → docs/screenshots/controls-*.png. Removed: tests/army-controls-ui.test.js, tests/split-army-ui.test.js, tests/micro-ui.test.js, tests/micro-shots.js.

## Battlefield conditions (v2.72, Phase 1)
- **Rules** (src/sim/conditions.js, `COND`, docs/PHASE1_DESIGNS.md Proposal F; `g.cond`, chosen per match, the same for both sides; a map lists what it allows in `conditions`):
  - **Heavy fog:** every sight radius ×0.6 (units, buildings, nodes), watchtowers ×0.8; explored ground fades back to unexplored after 60 s out of view. AI: scouts twice as often.
  - **Rich centre:** the centre node pays 3× on Two-Lane and Three-Lane (Two-Lane's usual 1.5×), the middle node 2× on Classic. AI: capture groups from 1:00 (usually 2:30), and on Classic a 0.8× edge to take the field.
  - **Scarce resources:** Refineries and income nodes pay 0.6×, each side starts with 200 credits (the HQ's own income as usual; the storm unchanged). AI: wants armies 0.6× the size before attacking.
  - **Meteor strikes** (Two-Lane, Three-Lane): from 5:00, every 45 s a meteor falls on a random open spot on a lane (from the match's seeded stream: a replay repeats the spots): a red warning circle for 4 s that fills as it nears, the meteor streaking down, then 260 damage to every ground unit and 420 to every building within 90 (both sides; less toward the edge; not aircraft; a shielded HQ untouched). AI units step out of a circle; a player's units stay where they are told.
- **Choosing them:** on the map-select screen, a row of toggles under the map cards (the picked map's conditions plus Random condition, which picks one of them when the match starts) and a line describing the last one tapped; none by default; remembered in localStorage `extinctionEvent.cond`. The screen was tightened to fit at 667×375 (shorter thumbnails, smaller title). In the match the conditions show as small icons down the minimap's right edge (and a meteor's spot as a red ring); the post-match Overview lists them; the Codex's How to Play has a section. Saves keep them (only when a match has any, so older saves and the pinned replays are unchanged).
- **Every condition reaches a result** (Hard vs Hard, 40 matches each, mixed factions, sides alternating; audit/sim/ladder.js --cond=…; audit/logs-p1/conditions-v272/):

  | Map | Condition | A–B–draw | median | decided before 20:00 | draws | no fight | sides |
  |---|---|---|---|---|---|---|---|
  | Classic | heavy fog | 16–22–2 | 10:44 | 87.5% | 5.0% | 0.0% | 17–21 |
  | Classic | rich centre | 19–21–0 | 11:41 | 97.5% | 0.0% | 0.0% | 17–23 |
  | Classic | scarce | 18–15–7 | 19:23 | 57.5% | 17.5% | 0.0% | 19–14 |
  | Two-Lane | heavy fog | 22–12–6 | 17:01 | 65.0% | 15.0% | 0.0% | 14–20 |
  | Two-Lane | rich centre | 22–14–4 | 15:05 | 80.0% | 10.0% | 0.0% | 15–21 |
  | Two-Lane | scarce | 22–13–5 | 19:26 | 57.5% | 12.5% | 0.0% | 18–17 |
  | Two-Lane | meteors | 18–18–4 | 12:30 | 82.5% | 10.0% | 0.0% | 18–18 |
  | Three-Lane | heavy fog | 18–16–6 | 16:28 | 72.5% | 15.0% | 0.0% | 18–16 |
  | Three-Lane | rich centre | 23–15–2 | 11:30 | 92.5% | 5.0% | 0.0% | 15–23 |
  | Three-Lane | scarce | 15–18–7 | 18:53 | 65.0% | 17.5% | 0.0% | 13–20 |
  | Three-Lane | meteors | 19–18–3 | 15:41 | 87.5% | 7.5% | 0.0% | 15–22 |

  Draws under 25% on every map that allows each condition ✓ (highest: scarce, 17.5%). Scarce makes matches long (medians 18:53–19:26): smaller armies take longer to break a base. 40 matches each, so side splits like 13–20 are within chance.
- **Faction shares under conditions** (cross-faction, ~18 games per faction, so ±12 points; not tuned): heavy fog on Classic is hard on Bloomhost (2–16, 11%; Last Fist 82%); scarce on Classic and Three-Lane favours Last Fist (68%, 82%); on Three-Lane Last Fist leads under every condition (66–82%). Two-Lane stays within 36–62% for every faction. For the balance pass.
- **Harness fix before measuring:** the first condition runs were invalid. An edit to audit/sim/match.js put a comment in the middle of the `newGame` options and dropped side 0's AI, so the right side won every Classic match in ~4 minutes. Caught by the impossible numbers, fixed, all eleven re-run. Only the condition runs used the broken file.
- **Tests:** tests/conditions.test.js (allowed per map, heavy fog's sight and fading, rich centre's yield, scarce's start and pay, meteors seeded and hitting both sides but not aircraft or what is outside, AI units step out and a player's don't, the AI's earlier centre, saves), tests/conditions-ui.test.js (the toggles on screen at both sizes and remembered, Random, the match's conditions, a meteor's circle, the post-match line; screenshots docs/screenshots/conditions-*.png).

## Repair depot and guarded relic (v2.71, Phase 1)
- **Rules** (src/sim/nodes-special.js, docs/PHASE1_DESIGNS.md Proposal E; `NODE_TYPES.repair` and `.relic` are live):
  - **Repair depot:** captured like any node; its holder's units within its radius heal `REPAIR.heal` (3%, the base flag's rate) of their health a second once unhurt for 3 s; no income. **Send damaged home** goes to the nearest depot the side holds when that is nearer than the base flag (`medDepot`), and heals there.
  - **Guarded relic:** a neutral camp: a Titan and two Tanks (`RELIC.guards`) that never move and fire at anything (either side) within `RELIC.aggro` (100) of the relic. They belong to no side (`NEUTRAL`, `g.guards`, outside `g.ents`: no vision, intel, army value or score), are in both sides' target lists, draw in neutral gold and heal slowly once left alone. With every guard dead, standing on the relic captures it once: 800 credits to its holder, then it is spent. A toast tells the player; the match log records it.
  - `SPECIAL.on` / `.repair` / `.relic` switch them off (the comparison below). Saves keep the guards and spent relics.
- **Maps:** Three-Lane only (map v2): a depot in each outer lane beside its watchtower, (1150, ±470); a relic at each end of the north wall, (740, −200) and (1560, −200), in a pocket made by starting the walls at x 820 instead of 700, about 200 from every lane's centre so passing armies aren't drawn in. (At (650, −230), the first spot tried, armies walking the lanes killed the guards in passing.) Not on Classic or Two-Lane, as designed. A v1 Three-Lane save no longer loads.
- **The AI:** depots join the capture groups (Normal, Hard) beside the watchtowers; an unguarded relic too; a guarded relic only when it has no push on, no threat at home, nothing it knows of within 400 of the relic and an army 3× the guards': a group worth 2× the guards (its nearest healthy ground units) goes, and gives up when hurt to half, after 90 s or when the army attacks (`aiRelic`, `RELIC_AI`; not Easy). In test matches relics fell between 6:42 and 11:54.
- **Effect on Three-Lane** (Hard vs Hard, 100 matches each on the same seeds and map v2; audit/logs-p1/special-v271/):

  | Set | draws | median | Last Fist | Bloomhost | Axiarchs | sides |
  |---|---|---|---|---|---|---|
  | neither | 15.0% | 12:52 | 56.8% | 50.0% | 43.2% | 39–46 |
  | depots only | 11.0% | 13:29 | 58.0% | 51.1% | 40.9% | 42–47 |
  | relics only | 13.0% | 13:20 | 63.6% | 58.0% | 28.4% | 39–48 |
  | both (shipped) | 11.0% | 13:34 | 61.4% | 60.2% | 28.4% | 38–51 |

  Draws move within the noise of 100 matches (11–15%). **The relics hurt the Axiarchs**: 28.4% whenever relics are on, 41–43% without (about 1.4 standard deviations; consistent across the two pairs). Likely cause, not yet traced: the costly, shield-reliant Axiarch army loses more to the guards' splash, and the 800 credits buy the cheaper factions more. Depots change no share beyond noise. For the balance pass (not tuned).
- **Tests:** tests/special-nodes.test.js (placement, depot healing and its limits, Send damaged home to a depot, guards neutral and fixed and in reach only, capture once after the guards, the AI's rules, saves), tests/special-nodes-ui.test.js (guards, relic and depot drawn, the relic toast; screenshots docs/screenshots/special-*.png at both sizes).

## Three-Lane with crossings (v2.70, Phase 1): targets met (Easy's median aside)
- **The map** (src/sim/maps-threelane.js, docs/PHASE1_DESIGNS.md Proposal D): 2300 × 1120, mirrored, army cap 120; Classic's bases at x 220 and 2080; lanes north (−400), centre (0) and south (+400), 230 wide, the outer two splitting from the centre just past each base; two walls (four pieces) between the outer lanes and the centre, each with one gap, 140 wide, at x 1150 where the rich centre node (1.5×) sits; six income nodes ((650, ±400), (800, 0) and mirrors), two watchtowers at (1150, ±340) (moved in from ±400 so each sees its lane and its crossing), six forward posts (one per lane per side, Turret and Barracks roles). `validateMap` passes, symmetry included. On the map-select screen with a thumbnail drawn from the data (it scrolls sideways at 667 wide).
- **Performance check first** (audit/sim/perf-lanes.js, audit/logs-p1/threelane-v270/perf.md, headless Chromium at both iPhone sizes, normal CPU and 4× throttling): at a realistic load (60 units a side) Three-Lane keeps true speed everywhere, its frames costing ~15% more than Two-Lane's at 50 a side (30–40% more at 4×). Only a worst case of 120 units a side (twice what the supply allows) at 4× falls below true speed (0.89–0.96×). **Cap 120 kept**; 110 is the fallback if a real older iPhone struggles.
- **Three squads (minimal, the army controls are being redesigned next):** the squad column keeps its 84 px: All on top, N, C and S as three chips below (`.asq.l3`); long-press a squad: move it to either other lane, new units North / Centre / South / Alternate; long-press a unit chip: send that type to any lane; three minimap badges, spread along the minimap and letters only when it is too narrow for counts (667 wide); a Three-Lane first-time tip (`split3`), Codex and tutorial text. Orders, Regroup and Rally per squad work unchanged (they were written for any number of lanes).
- **The AI** (`aiLanes3`, `LANE3`, `aiCapture3` in src/sim/ai.js; Two-Lane's `aiLanes` untouched): an enemy unit belongs to the lane whose centre line is nearest; reinforcements go where the enemy is (round-robin over three when nothing is known); a losing lane is helped from a neighbour first (the centre helps either outer lane through its crossing: the flank); a base attack goes down the lane where the enemy army is and, meeting a much stronger army near a crossing (1.25× its own), switches to the quieter neighbour instead of retreating; a watchtower lost raises a 40 s alarm for its lane (reinforcements and a shift go there); two capture groups at once on Normal and Hard (`side.capT2`, never the same node or unit); forward pads in three lanes (Normal 2, Hard 3). The Two-Lane rules carry over: breakthrough, the late-game commit, the forward-Barracks rally, and v2.69's base-breaking.
- **Results** (audit/sim/ladder.js --map=threelane, 100 matches each, mixed factions, sides alternating; audit/logs-p1/threelane-v270/):

  | Matchup | A–B–draw | median | decided before 20:00 | draws | no fight | sides (left–right) |
  |---|---|---|---|---|---|---|
  | hard vs hard | 44–47–9 | 14:08 | 72.0% | 9.0% | 0.0% | 45–46 |
  | normal vs normal | 35–52–13 | 16:50 | 75.0% | 13.0% | 0.0% | 41–46 |
  | easy vs easy | 37–49–14 | 18:56 | 63.0% | 14.0% | 0.0% | 43–43 |

  Against the targets: draws under 25% ✓, no fight under 5% ✓, sides even ✓, median 12–18 ✓ for Hard and Normal, Easy 18:56 ✗ (Easy is slow by design on every map: Classic 19:24, Two-Lane 19:03). A 48-match first sample read 29–15 for the left side; the remaining 52 seeds read 16–31, so the 100 are even.
- **Faction win shares** (cross-faction; not tuned): Hard Last Fist 61.4%, Bloomhost 46.6%, Axiarchs 42.0%; Normal 73.9 / 39.8 / 36.4%; Easy 48.9 / 50.0 / 51.1%. Last Fist leads on the long fronts at Normal and Hard, as on Classic. For the balance pass.
- **Tests:** tests/threelane.test.js (the map against the design, crossings and walls in the navigation grid, a unit crossing at the gap, reinforcements, the neighbour flank, the crossing switch, the watchtower alarm, two capture groups, forward pads per difficulty), tests/threelane-ui.test.js (map select, the squad column on screen and tappable at both sizes, orders per squad, the menus, badges, a fight at a crossing, the tip; screenshots docs/screenshots/threelane-*.png), tests/slow/threelane-match.test.js (six Hard matches: all over by 27:00, at least 4 at an HQ, all three lanes, the centre and a watchtower, forward pads and two capture groups in most, nobody in a wall).

## Base-breaking (v2.69, Phase 1): the Two-Lane draw fix, targets met
- **Why matches drew** (traced, v2.68): the side that won the mid-field reached the enemy base with a strung-out army (in one drawn match the winner had 4,000 army value but only 7–15 units near the enemy base at a time), the HQ gun killed it piecemeal, and the loser, its HQ shielded by any building, rebuilt every loss until the storm decided the match.
- **What shipped** (`BREAK` in src/sim/game.js; each part switches off on its own, `setBreak(false)` gives v2.68's rules; every map):
  - **a. AI base-breaking** (`aiBreak` in src/sim/ai.js, `bbFocus` in src/sim/fog-update.js; AI only, no rule change): an all-in base attack gathers at the stage, just outside the enemy HQ gun's range as last seen (`side.bbStage`), until 70% of its ground army is there (or 35 s after the first arrive); goes in with its siege units 4 s ahead (`side.bbLead`); gathers again when the wave inside is under 30% of what went in and the next one is worth 350; and aims at the buildings that keep the HQ shielded (a target-score bonus, production buildings most), then the bare HQ. On a lane map it also builds its next Habitat when the army it fields is nearly full, not only the whole limit: Easy fields 70% of its limit, so it never reached the Habitat trigger and sat at 28 supply for ten minutes with 10,000 credits banked (Classic's Easy is unchanged).
  - **b. Power failing** (`BREAK.power`, `powMul`): from 15:00 every building gun (HQ, Turrets and each faction's Turret role, node bunkers) loses 15% of its damage each minute, down to 25% (19:00 on), the same for both sides; not in the tutorial. The AI counts failing guns for less. The player sees a "Power failing: base guns at N%" alert once per step and, on each gun, a dark flicker, sparks and an amber bolt badge (`drawPowerFail`). Storm endings stay draws.
  - **c. Rubble** (`BREAK.rubble`, `rubbleAt`, `padOpen`): a destroyed building's pad (base, signature or forward) can't be built on again for 60 s; selling leaves none. Drawn as debris with a ring that empties as it clears (`drawRubble`); building there says "Rubble: this pad clears in N s". The AI counts rubble as no free pad.
  - **d. Production shield** (`BREAK.prod`, `refreshShields`): the HQ is shielded only while a finished production building (the Barracks, War Factory and Tech Lab roles) stands in its base. HQ descriptions, the menu's how-to, the panel line, the tutorial and a new Codex section (How to Play, "Breaking a base") say so.
  - **e. A bigger army cap on lane maps** was not needed and not tried.
- **Each option alone and together** (Two-Lane, 48 matches, seeds 8000–8047, v2.68's draws on these seeds: Hard 33.3%; audit/logs-p1/basebreak-v269/experiments.md):

  | Set | Hard draws (median) | Normal draws (median) | Easy draws (median) |
  |---|---|---|---|
  | a | 27.1% (15:06) | | |
  | b | 12.5% (16:02) | 29.2% (20:13) | 31.3% (21:06) |
  | c | 27.1% (13:51) | | |
  | d | 33.3% (15:34) | | |
  | a + b | 10.4% (15:06) | 29.2% (19:32) | 22.9% (20:40) |
  | a + b + c | 12.5% (11:55) | 16.7% (18:06) | 25.0% (21:18) |
  | a + b + c + d | 6.3% (12:52) | 8.3% (15:53) | 25.0% (21:13) |
  | the same + Easy's Habitat rule | | | 14.6% (19:13) |
  | a + b + d (+ the Habitat rule) | 12.5% (14:28) | 18.8% (18:29) | 18.8% (19:08) |

  No smaller set meets every target: b alone or a + b leave Normal and Easy at 23–31%; without c Normal's median is 18:29; without d (a + b + c) Normal's is 18:06 and Easy draws 25%. So all four ship.
- **Results, Two-Lane** (audit/sim/ladder.js --map=twolane, 100 matches each, mixed factions, sides alternating; audit/logs-p1/basebreak-v269/twolane.md):

  | Matchup | A–B–draw | median | decided before 20:00 | draws | no fight | sides (left–right) |
  |---|---|---|---|---|---|---|
  | hard vs hard | 37–55–8 | 13:33 | 77.0% | 8.0% (v2.68 39%) | 0.0% | 41–51 |
  | normal vs normal | 44–50–6 | 16:41 | 72.0% | 6.0% (v2.68 58%) | 0.0% | 46–48 |
  | easy vs easy | 39–44–17 | 19:03 | 60.0% | 17.0% (v2.68 46%) | 0.0% | 41–42 |

  Against the targets: draws under 25% ✓ on all three; no fight under 5% ✓; sides even ✓ (Hard 41–51 is within chance, p ≈ 0.3); median 12–18 min ✓ for Hard and Normal, **✗ for Easy (19:03)**. Easy is slow by design since v2.64 (Classic's Easy vs Easy median was 19:46 then and is 19:24 now); a faster Easy would mean a less gentle one, which is the balance pass's call.
- **Classic, before and after** (100 matches each, the same seeds; "before" is this build with `setBreak(false)`, i.e. v2.68; audit/logs-p1/basebreak-v269/classic*.md):

  | Matchup | before: draws, median | after: draws, median | after: sides |
  |---|---|---|---|
  | hard vs hard | 24.0%, 13:32 | 3.0%, 12:32 | 39–58 |
  | normal vs normal | 22.0%, 14:45 | 4.0%, 14:03 | 50–46 |
  | easy vs easy | 21.0%, 20:06 | 7.0%, 19:24 | 45–48 |

  Draws no worse ✓; median 12–18 ✓ for Hard and Normal, Easy 19:24 (was 20:06). Classic Hard's sides, 39–58, are about two standard deviations from even (p ≈ 0.05); before they were 37–39. Logged for the balance pass, not tuned.
- **The difficulty ladder** (100 matches each; audit/logs-p1/basebreak-v269/*-ladder.md):

  | Matchup | Classic | Two-Lane |
  |---|---|---|
  | Hard vs Normal | 79–21–0, 79.0% (v2.61: 82.8%) | 60–25–15, 67.5% (v2.67, 30 matches: 76.7%) |
  | Normal vs Easy | 83–17–0, 83.0% (v2.64: 90.0%) | 65–29–6, 68.0% (v2.67, 30 matches: 88.3%) |

  The ladder is still ordered on both maps, but flatter: on Classic a defending Easy/Normal no longer holds out to the storm (no draws at all now), and on Two-Lane Easy builds Habitats and fields a real army. Normal beats Easy below the 85–90% band v2.64 set for Classic; for the balance pass.
- **Faction win shares** (cross-faction matches, (wins + draws/2) / games; not tuned):

  | Faction | Two-Lane Hard | Normal | Easy | Classic Hard (before → after) | Normal | Easy |
  |---|---|---|---|---|---|---|
  | lastfist | 51.1% | 53.4% | 38.6% | 62.5% → 69.3% | 71.6% → 78.4% | 42.0% → 44.3% |
  | bloomhost | 51.1% | 37.5% | 48.9% | 33.0% → 33.0% | 35.2% → 39.8% | 46.6% → 42.0% |
  | axiarchs | 47.7% | 59.1% | 62.5% | 54.5% → 47.7% | 43.2% → 31.8% | 61.4% → 63.6% |

  Two-Lane Hard is the most even it has been (v2.68: 53/39/58). On Classic, base-breaking helps Last Fist most (Hard 69%, Normal 78%): its Artillery, Titans and Orbital Strike break bases best. For the balance pass.
- **Spawn sides on Classic, checked further:** the slow spawn test (50 seeded Hard mirrors per faction) failed once for Bloomhost, right side ahead 34 of 50. Switching each part off on those seeds still gave 31–34 for the right, so no one part causes it, and no rule here depends on the side. More seeds: Bloomhost seeds 51–150 48–52; seeds 1–100 Last Fist 54–46, Bloomhost 42–58, Axiarchs 47–53 (pooled 143–157); v2.68 on Bloomhost seeds 1–150 73–77. Seeds 1–50 were an outlier: with almost every match now decided, 50 matches let a fair coin pass 60% about one time in eight per faction. The test now plays 100 per faction (seeds 1–100).
- **Slow test raised back:** tests/slow/twolane-ai.test.js asks for 4 of its 6 seeded Hard mirrors to end at an HQ again (v2.68: half).
- **Tests:** tests/base-break.test.js (power steps, floor, both sides, the tutorial and off; a Turret's shot and the AI's estimate; rubble blocks only its pad, clears, none from selling; the shield with and without a production building of each role; the stage, the lead, the next wave; the target preference), tests/base-break-ui.test.js (the alert once per step, the rubble message, screenshots at both iPhone sizes in docs/screenshots/basebreak-*.png). Tests that build a Refinery to shield an HQ keep the old shield rule (`BREAK.prod.on = false` at the top of the file); the pinned replays use `setBreak(false)`.

## Two-Lane draw fix (v2.68, Phase 1): targets not met (met in v2.69, above)
- **a. Forward-Barracks rally** (`fwdRally`, `FWD_RALLY` in src/sim/game.js; player and AI, every faction): a unit trained at a Barracks-role building on a forward pad (Barracks, Larva Pit, Genesis Gate; an Axiarch warp-in included) starts at that lane's Forward flag, on that lane, and uses the flag as home (`u.fwdHome`) while its side holds the post; when the post is lost, home is the base's flag again. `FWD_RALLY.on = false` gives v2.67's behaviour.
- **b. Late-game commit** (`LANE_AI.late` in src/sim/ai.js; every difficulty, lane maps only): from 15:00, if not under attack at home and its army is at least 0.8× all it knows of the enemy's, the AI sends its whole army down one lane (the lane where the enemy army is). `LANE_AI.late.on = false` gives v2.67.
- **c. A shorter map** was tried (1,900 long instead of 2,200: nodes, towers, forward posts and the ridge moved in; it validated cleanly) and is **not** shipped: it shortened matches without reducing draws.
- **Results with a + b** (audit/sim/ladder.js --map=twolane, 100 matches per matchup, mixed factions, sides alternating; audit/logs-p1/twolane-v268.md and .json):

  | Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
  |---|---|---|---|---|---|---|
  | hard vs hard | 25–36–39 | 44.5% | 17:20 | 55.0% | 39.0% | 0.0% |
  | normal vs normal | 18–24–58 | 47.0% | 21:50 | 34.0% | 58.0% | 0.0% |
  | easy vs easy | 23–31–46 | 46.0% | 21:40 | 28.0% | 46.0% | 0.0% |

  Against the targets: **draws under 25%: not met** on any difficulty (Hard 39%, Normal 58%, Easy 46%); **median 12–18 min: Hard only** (17:20; Normal and Easy run to the storm, 21:40–21:50); no fight 0% ✓; spawn sides even ✓ (left–right: Hard 27–34, Normal 21–21, Easy 24–30, all within chance). On the same 100 seeds v2.67 drew 36 Hard mirrors (now 39); v2.67's 30-match Normal and Easy runs drew 60% each.
- **Each option alone and together** (Hard vs Hard, 48 matches, the same seeds): a only 35.4% draws (median 16:04); b only 35.4% (17:20; Normal 58.3%, Easy 52.1%); a + b 33.3% (16:04); a + b on the 1,900 map 35.4% (13:48; Normal 50.0%, Easy 43.8%). None comes near 25%.
- **Why (diagnosis, from traced matches):** the side that wins the mid-field fight reaches the enemy base with a supply-limited army (e.g. 41 of 56 supply) and stalls at the edge of the HQ gun, while the base, still shielded by its buildings, rebuilds every loss; the storm then decides the match. Neither length nor an earlier commit changes that, and a diagnostic run with a thinner economy (Classic-like: cap 80, no rich centre, two nodes worth nothing) drew more (Hard 47.9%, Normal 68.8%). Levers not tried, for approval: a bigger army cap or cheaper supply on lane maps, letting a base's shield fall once its production buildings are gone, or AI rules for breaking a base (target the shield buildings first, wait for reinforcements at the gun's edge).
- **Kept anyway:** a and b are small, each was asked for, and neither made anything worse; a is a real player feature on the forward pads. Both switch off.
- **Faction win shares** (cross-faction matches; not tuned, for the balance pass):

  | Faction | Two-Lane Hard | Two-Lane Normal | Two-Lane Easy | Classic Hard |
  |---|---|---|---|---|
  | lastfist | 53.4% | 47.7% | 40.9% | 58.4% |
  | bloomhost | 38.6% | 43.2% | 54.5% | 37.1% |
  | axiarchs | 58.0% | 59.1% | 54.5% | 54.5% |

  Classic plays exactly as v2.67 (below), so its figures are v2.67's 200-match run.
- **Classic is unchanged:** against v2.67's index.html (audit/sim/classic-identity.js), Hard three full seeded matches (799, 284, 777 checkpoints), Normal and Easy one each (448 and 751): identical at every checkpoint.
- **Browser tests made robust to timing:** the Sell test allows the income earned between its two taps; the old-save test stops the running match before planting the save (the page's autosave on pagehide could overwrite it). An old bulk edit had put a comment mid-line in 71 test lines, commenting out what followed (several waits among them); the comment now ends the line.
- **Slow test changed:** tests/slow/twolane-ai.test.js asked for 4 of its 6 seeded Hard mirrors to end at an HQ; with a + b these seeds give 3 (v2.67: 4), as expected at a 39% draw rate. It now asks for at least half.
- **Tests:** tests/twolane-ai.test.js (a for each faction: start at the flag on the right lane, home cleared when the post is lost; a switched off; b at 15:05 on every difficulty, not before 15:00, not when clearly behind, not under attack).

## AI on two lanes (v2.67, Phase 1)
- **The lane layer** (`aiLanes` in src/sim/ai.js, `LANE_AI`; runs only on a lane map, so Classic plays exactly as before), on top of each difficulty's usual plan:
  - **Splitting:** new units go to the lane that needs them most (the enemy it knows of there against its own squad), alternating when neither does.
  - **Shifting (Normal, Hard):** a lane losing (its squad under 0.75× the enemy there) while the other has a clear surplus sends part of the surplus over, nearest the base or the crossing first, at most every 20 s.
  - **The centre and the watchtowers:** capture groups of up to 3 fast ground units take the centre node (in the crossing, off both lanes; all difficulties) and the watchtowers (Normal, Hard) when the army can spare them; they come back hurt, done, or after 60 s.
  - **Forward pads (Normal 1, Hard 2):** with 1,000 banked (above the supply rule's 800, so the army's supply comes first) and no threat at home, a Turret then a Barracks on a forward pad it holds on its own half, at most one every 90 s.
  - **Base attacks go down one lane, all of it:** the lane where the enemy army is, so it fights that army together instead of passing it in the other lane (both sides then raced each other's bases and nobody won).
  - **Breakthrough (Normal, Hard):** clearly stronger than all it knows of (Hard 1.3× falling to 1.0× by the storm warning, Normal 1.5× → 1.1×) and not under attack at home, it goes all in. The usual "gathered" and "winnable fight here" checks are written for one lane and kept a stronger split army at home on the long two-lane field.
  - **Easy is simpler:** splitting and the centre only (no shifting, watchtowers, forward pads or breakthrough).
- **Rule change found while testing:** buildings on forward pads no longer keep their HQ shielded (only the base's buildings do). A forward Turret far out on a lane kept the HQ invulnerable after the whole base had fallen.
- **Navigation fixes found while testing:** lane-following could step a unit into the closed band beside the ridge, and the "never inside a wall" guard pushed it back up: a clump of units could hover at the crossing's corner for the rest of the match. Lane-following now hands over to navigation whenever its next step is closed, and the guard picks the nearest open cell. 2D fog lookups are inlined (a Two-Lane tick is about twice as fast, identical results).
- **Harness bug (fixed):** an edit to audit/sim/match.js for `mapId` dropped each side's difficulty, so side 0 played Normal against Hard; it showed up as a huge spawn-side bias. Every run before the fix was discarded; results now record each side's difficulty and map (`diffs`, `map`), and tests/ladder.test.js checks them.
- **Results: Hard vs Hard on Two-Lane** (audit/sim/ladder.js --map=twolane, 200 matches, mixed factions, sides alternating; audit/logs-p1/twolane-v267.md and .json):

  | Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
  |---|---|---|---|---|---|---|
  | hard vs hard | 57–69–74 | 47.0% | 16:53 | 57.0% | 37.0% | 0.0% |

  Spawn sides: left 72, right 54, draws 74; left share of decided 57.1%.

  Against the targets: median 16:53 (12–18 ✓), 57.0% decided before 20:00 (at least 50% ✓), 0% no fight (under 5% ✓), sides 72–54 of the decided matches (57/43; about what chance gives at this size, p ≈ 0.11, so roughly even ✓), **draws 37.0% (under 25% ✗, not met)**. For comparison, Classic with the same build: Hard vs Hard 72–81–47, median 13:27, 23.5% draws, sides 78–75. Why Two-Lane draws more: evenly matched armies meet mid-field and trade until the storm; after a won fight the survivors have about 1,700 to walk to the enemy base while the loser rebuilds at home. Levers not tried yet: a shorter map (the approved design is 2,200 long), forward Barracks the AI rallies new units from, or a later-game rule that sends everything down one lane earlier.
- **Measured build:** the runs above were made just before one small fix moved into v2.66: a ground unit that would appear on the ridge (an Axiarch warp-in there) now starts on the nearest open ground instead of being moved there on its first step, one tick later. It is the same spot one tick earlier; the numbers were not re-run for it.
- **What was tried** (24-match samples): the lane layer alone 54–58% draws; plus one-lane attacks at the weaker lane and the HQ-shield rule 42%; plus breakthroughs 42%; attacks at the enemy army 50%; plus the navigation fix 29%; a 45 s breakthrough commitment 38% (dropped). The 200-match run is the last configuration.
- **The difficulty ladder on Two-Lane** (30 matches per matchup):

  | Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
  |---|---|---|---|---|---|---|
  | hard vs normal | 17–1–12 | 76.7% | 13:13 | 56.7% | 40.0% | 0.0% |
  | normal vs easy | 24–1–5 | 88.3% | 14:38 | 76.7% | 16.7% | 0.0% |
  | normal vs normal | 6–6–18 | 50.0% | 21:50 | 36.7% | 60.0% | 0.0% |
  | easy vs easy | 5–7–18 | 46.7% | 21:56 | 16.7% | 60.0% | 0.0% |

  Hard beats Normal 76.7% and Normal beats Easy 88.3% (the same ordering as on Classic), but Normal vs Normal and Easy vs Easy draw 60% of the time on Two-Lane (Classic: 22% and 17.5%): Easy and Normal have no breakthrough rule (Normal's needs 1.5×), and their cautious attack edges rarely fire on the long field. 30 matches each (a Two-Lane ladder takes hours), so each figure is ±9 points.

- **Faction win shares** (cross-faction matches only; audit/sim/shares.js):

  | Faction | Two-Lane | Classic |
  |---|---|---|
  | lastfist | 42.7% | 58.4% |
  | bloomhost | 45.5% | 37.1% |
  | axiarchs | 61.9% | 54.5% |

  On Two-Lane the Axiarchs lead (probably their warp-in, which puts new units at the front without the long walk; not measured); on Classic Last Fist leads and Bloomhost trails, as before.

- **Classic is unchanged:** Hard against v2.60 (three full seeded matches, every 100 ticks) identical at every checkpoint (799, 284 and 777 checkpoints); Normal and Easy against v2.64 (one full seeded match each) identical (508 and 761 checkpoints).
- **Tests:** tests/twolane-ai.test.js (reinforcements, shifting not on Easy, capture groups for the centre then a watchtower, forward pads per difficulty, one-lane attacks at the enemy army, breakthrough per difficulty, Classic never runs the layer), tests/twolane.test.js (+ the HQ shield and forward pads), tests/ladder.test.js (the harness plays the named difficulty and map), tests/slow/twolane-ai.test.js.

## Split Army (v2.66, Phase 1)
- **As docs/SPLIT_ARMY.md.** Squads are lanes: on a lane map every unit belongs to the squad of its lane (`u.lane`). The Army tab gets a squad column (84 px, left of Hold / Attack / Retreat / Regroup): All on top, N and S below, each with a unit count. With a squad selected (`side.squad`), the four orders act on that squad only (`giveOrder(…, 'lane', …)`); its Regroup gathers it at its lane's Forward flag; Rally switches it between the Base flag and its own Forward flag (`useRally(…, lane)`, `R.sq`). A squad and a unit chip are never both selected. All commands everyone as before (on a lane map the army's Rally sends each squad to its own lane's flag).
- **Flags on a lane map** (`flagPt`, `flagSpots`): the Base flag in the middle where the lanes leave the base, and a Forward flag on each lane (at the forward flag's x on that lane's centre line); moving a flag moves both lanes' copies, and squads on a Regroup to it follow. A move order onto the ridge goes to the nearest open ground (`navOpen`).
- **Long-press** (450 ms): a squad chip → "Move North squad to South" (`setLane(…, 'lane', …)`; it walks round through the crossing or past its base) and "New units: North / Alternate / South" (`setLaneNew`; Alternate is the default); a unit chip → "Send all Riflemen to North / South". The menu opens above the chip, on screen, and closes on any tap outside it.
- **Aircraft** belong to a squad and follow its orders; they keep over their lane's centre line just ahead of them and fly straight over the ridge (on a grid map they now move at full speed in any direction).
- **Minimap badges** "N 13" / "S 11" on each lane; tapping one selects that squad (and opens the Army tab).
- **First-time tip:** the first match a player starts on a lane map shows a short card about squads and the long-press actions, once (localStorage `extinctionEvent.tips`).
- **Codex and tutorial:** a Split Army section in the Codex's How to Play tab; the tutorial's Army chapter has a note step about squads on Two-Lane (the tutorial itself plays Classic).
- **Classic:** nothing changes for the player: there are no lanes, so no squad column, no badges, no tip; the rally flags behave as in v2.62.
- **Fixes found while testing:** a ground unit never appears on the ridge (an Axiarch warp-in or a Bloomhost brood placed there moves to the nearest open ground); on Two-Lane a tap inside a forward pad goes to the pad before a rally flag standing on it.
- **Tests:** tests/split-army.test.js (squad orders, per-lane flags and squad rally, moving a squad round the ridge, new-unit lane, aircraft over the ridge, move orders off the ridge, Classic unchanged), tests/split-army-ui.test.js (both iPhone sizes: the squad column on screen, uncovered and tappable; squad orders; both long-press menus; the minimap badge; the tip once; Classic without squads).

## Two-Lane map (v2.65, Phase 1)
- **The map** (src/sim/maps-twolane.js, as docs/TWO_LANE.md): 2200 × 900, mirrored left to right, army cap 100. Classic's base layout (the west base is Classic's, number for number; the east its mirror), two lanes 230 wide at depth ±280 that split past the bases, and a ridge of two blockers between them with one gap, the centre crossing at x 1100. Nodes: four income nodes (700/1500, ±280), the rich centre node (1100, 0) at 1.5× yield (`yieldMul`), two watchtowers (1100, ±150; sight 600), four forward pads (880/1320, ±280) with two build pads each. Passes `validateMap`, symmetry included; the symmetry check now also compares each node with its image (radius, yield, sight, forward pads and what they allow).
- **Maps are chosen per match** (`useMap`, `newGame(…, { map })`): every value derived from the map (`L`, `POP_MAX`, `LANE_V`, `DV_W`, the fog grid, `cellOf`, `NODE_U`, the forward pads, the navigation grid, node names, the ground, the camera's range, the creep and fog canvases) is a `let` that a hook in `MAP_HOOKS` recomputes. A save's map becomes the current one when it is resumed (a save from a map this build doesn't have, or another version of it, is still refused).
- **Ground navigation** (`NAV`, src/sim/units.js): a 20-unit grid marks ground within 14 of a blocker as closed; a ground unit whose straight line crosses closed ground follows an A* path (string-pulled, kept until its target moves 40 or 2 s pass); lane-following applies only when the target is on the unit's lane; on a grid map units move at full speed in any direction; a unit that ends a step on closed ground is put back on the nearest open cell. Aircraft fly over. Classic has no blockers, so none of it runs there.
- **Node types** (`NODE_TYPES`; Classic's nodes keep exactly their old keys): **income** (× `yieldMul`), **watchtower** (no income; its holder sees `sight` around it), **forwardPad** (no income; its holder may build the Turret or Barracks role on its two pads: Last Fist Turret and Barracks, Bloomhost Maw and Larva Pit, Axiarch Null Lance and Genesis Gate; build slots `FWD_SLOT + k`, `fwdOk`, `fwdAt`; a building there stays if the post is lost, and a pad takes one building whoever built it). All three are captured the same way. Fortification Depot bunkers stand on income nodes only.
- **Camera and minimap:** on a deep map the view pans up and down too (`cam.y`, `CAMY`: from just above the horizon to just below the field; drag, the minimap, alert jumps); Classic keeps `cam.y` at 0. The minimap shows the whole depth on a deep map: both lanes, the ridge, the fog by cell, nodes at their depth and the view's frame.
- **Drawing:** each lane's worn track, the ridge as a low rocky plateau (in the cached ground), watchtowers (a lattice mast with a lamp that sweeps once held), forward pads (plain plates, dashed while nobody holds the post, and their capture post), the rich node's second crystal, node zones as circles; grid fog (from v2.63). Every fog check in the renderer now passes depth, so effects in one lane don't show through the other lane's fog.
- **Map select:** after New match, before the match: one card per map with its name, description and a thumbnail the game draws from the map data (lanes, ridge, bases, nodes); Classic is the default; the last choice is remembered (localStorage `extinctionEvent.map`); fits at 858×396 and 667×375. The tutorial always plays Classic; the resume line names a non-Classic map.
- **What the AI does on it so far:** the v2.61 AI unchanged (it alternates new units between the lanes); it doesn't use forward pads or watchtowers on purpose. That is item 4 (AI on two lanes).
- **Classic plays the same:** audit/sim/classic-identity.js against v2.60 (seed 202, 453 checkpoints) identical; the replay fingerprints unchanged.
- **Tests:** tests/twolane.test.js (layout and validation incl. symmetry faults, switching maps both ways, never inside the ridge and round through the crossing, watchtower sight and no income, the rich node's 1.5×, forward pads for all three factions, saves carrying their map, Classic's nodes untouched), tests/twolane-ui.test.js (map select fits at both sizes with Classic preselected and thumbnails drawn, vertical drag, minimap depth, tapping and building on a held forward pad, the choice remembered, Classic after Two-Lane), tests/slow/twolane-match.test.js (three Hard-vs-Hard matches end by 27:00, nobody inside the ridge). The browser tests now pass through map select (Classic) after New match.

## Gentler Easy (v2.64, Phase 1)
- **Decision after v2.63:** Easy should be gentle again for new players; keep the bug fixes so it plays properly; accept Normal beating Easy 85–90%; Easy vs Easy must still reach a result (draws under 25%, no-fight under 5%). Hard beating Normal 82.8% is accepted (Hard is not weakened).
- **Easy's settings** (`LADDER.easy` in src/sim/core.js; v2.61 → v2.64): decisions every **2.0 s** (1.3; DIFF's old Easy 2.5), **70%** of its army limit (90%; old 60%), attack edge **1.6× falling to 0.8×** from 13:00 to the storm warning (1.4× → 0.9×), the centre node at 1.3× (1.15×), from 6:00 and never into a known stronger army (as before), no raids, top tier T2. The v2.60/v2.61 fixes stay (the scout runs, the capped estimate, the supply rule with T2 Habitats).
- **Ladder** (audit/sim/ladder.js, 200 matches each, mixed factions, seeds 8000–8199; audit/logs-p1/ladder-v264.md and .json; the Hard vs Normal and Normal vs Normal rows don't involve Easy, so they are v2.61's, unchanged):

  | Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
  |---|---|---|---|---|---|---|
  | hard vs normal (v2.61) | 152–21–27 | 82.8% | 8:00 | 83.0% | 13.5% | 0.0% |
  | normal vs easy | 172–12–16 | 90.0% | 12:28 | 89.0% | 8.0% | 0.0% |
  | normal vs normal (v2.61) | 90–66–44 | 56.0% | 14:43 | 74.5% | 22.0% | 0.0% |
  | easy vs easy | 87–78–35 | 52.3% | 19:46 | 54.5% | 17.5% | 0.0% |

- **Against v2.60's Easy** (40 mixed-faction matches, v2.64 Easy vs v2.60 Easy, the `default260` preset): 29–4–7, a 81.3% share for the new Easy (v2.61 Easy: 36–0–4). Gentler than v2.61, but still stronger than v2.60's Easy, which never scouted, misread the enemy army and stood at 28 supply all match (the bugs the fixes removed).
- **Screening** (100 matches each; the first 100 of the 200 above are the same matches): Easy deciding every 1.8 s with 75% of its army and a 1.6× → 0.9× edge gave Normal 84.5% and Easy-vs-Easy 14% draws (Normal's share just under the band); the chosen settings gave 89.5% and 21%.

## Multi-lane engine (v2.63, Phase 1; no new playable map)
- **2D fog performance check first** (docs/MAP_FORMAT.md; audit/sim/fog-bench.js, headless Chromium, CPU throttled 4×, 6 s per run; today's fog = one row of 10-wide cells along the lane drawn as a gradient; 2D grid = 20×20 cells over the whole field, sight circles filled row by row, drawn as a one-pixel-per-cell alpha image redrawn only when vision changes; raw numbers in audit/logs-p1/fog-v263.json):

  | Screen | Phase | Units | Vision per tick: today / 2D grid (mean, p95 ms) | Fog drawing per frame: today / 2D grid (mean, p95 ms) | Frame time, today's run / 2D run (mean ms, fps) |
  |---|---|---|---|---|---|
  | 858×396 | early | 0 | 0.05, 0.4 / 0.10, 0.7 | 0.03, 0.1 / 0.20, 0.9 | 75 (13.7) / 54 (18.8) |
  | 858×396 | battle | 35 | 0.16, 0.9 / 0.32, 1.0 | 0.04, 0.3 / 0.23, 0.9 | 116 (9) / 95 (10.8) |
  | 667×375 | early | 0 | 0.05, 0.2 / 0.08, 0.6 | 0.03, 0.1 / 0.17, 0.9 | 53 (19.2) / 42 (24.3) |
  | 667×375 | battle | 35 | 0.19, 1.0 / 0.35, 1.2 | 0.05, 0.2 / 0.19, 0.8 | 95 (10.7) / 73 (14) |

  Verdict: **the grid is cheap enough; no alternative needed.** The 2D grid adds about 0.03–0.17 ms to a vision update and 0.15–0.19 ms to drawing a frame, against frames of 42–116 ms in this throttled headless browser (software rendering: the frame is the whole game's drawing, not fog). That is under 1% of a frame in every case, so a player can't notice it. The frame-time columns come from separate runs and differ by more than the fog costs (the 2D runs came second, on a warmed-up page): read the fog's own timings, not the frame difference. Both vision figures in a row come from the same ticks (today's fog drives the game, the grid runs beside it). On a deeper map the cost per unit stays the same (a sight circle covers the same rows); only clearing the grid grows with the map (a 2400×1400 map is 8,500 cells, a few microseconds).
- **What a map can now ask of the engine** (src/sim/maps.js; Classic asks for none of it, so `MAP_2D` and `MAP_LANED` are false there and every Classic path is the old code):
  - **2D fog** (`fog: 'grid'`, `fogCell`): `FOG_NX × FOG_NY` cells; `cellOf(u, v)`, `cellsLit(vis, u, half, v, vh)` and the reveal take depth; sight is a circle; enemy visibility in targeting (`ixScan`), ghosts, creep, power field, intel, abilities and the AI's ability aim all pass depth. The renderer draws grid fog as the alpha image the check measured (`drawFog2`).
  - **True distance** (`depthW: 1`): targeting already used `DV_W`; it now comes from the map (Classic 0.4). Node capture uses true distance on grid maps (troops on another lane at the node's x don't take it).
  - **Lanes** (`MAP_LANED`: more than one lane, or a lane off depth 0): every new unit gets `u.lane` (`laneNew`: alternate between lanes, or `side.laneNew`); a ground unit far from its target walks along its lane's centre line (`laneY`) at full speed keeping its own offset (`moveLane`, `LANE_GO`), heads back to its lane first when off it, and moves freely near its target. Lane paths are polylines whose x only grows; blockers and the navigation grid for open maps are the next step.
  - **Lane orders:** `setLane(g, s, scope, key, lane)` moves units between lanes (scope `all` also sets the lane for new units; `lane`; `type`); `giveOrder(g, s, 'lane', lane, order)` gives Hold, Attack, Retreat or Regroup to every unit on one lane (`side.orders.lanes`, `unitOrder(side, type, lane)`). Refused on Classic.
  - **Nodes from the map:** a non-Classic map places its nodes once (`NODE_U` from `MAP.nodes`; Classic keeps its `setMech7c` switch).
  - **The save records the map:** save v31 adds `map: { id, v }`; a save from another map or another version of it is refused (a pre-v31 save counts as Classic v1).
- **Classic plays the same:** audit/sim/classic-identity.js plays three full seeded Hard-vs-Hard matches (seeds 201–203, one per faction pairing) in this build and in v2.60's index.html and compares a hash of the whole game state every 100 ticks: 799, 284 and 777 checkpoints, all identical, to the end of each match (Last Fist vs Bloomhost 22:11 storm draw, Bloomhost vs Axiarchs 7:53 Axiarchs win, Axiarchs vs Last Fist 21:34 storm draw). Left out of the hash: the match log, the save's `v` and `map`, and each side's persona (v2.61 adds the `ladder` flag to Hard's; its choices are unchanged, which the hashes prove).
- **Replay fingerprints:** the pinned fingerprints hash the serialized save, and save v31 adds the `map` key and changes `v` from 30 to 31. That is the only change: with `map` left out and `v` read as 30 (tests/determinism.test.js `saveV30`, the pinned tests in hardhuman.test.js and tactics.test.js), every recorded fingerprint matches unchanged.
- **Test-only two-lane map** (tests/maps/twolane-test.js, not the Two-Lane design): Classic's bases and pads, two lanes 230 wide that split past the pads and run 260 above and below the centre line, three income nodes (680, 260), (850, −260), (1020, 260), 2D fog, true distance. The test kit loads it into the SIM's sandbox (`loadSim({ map })`, `EE_MAP_DATA`); the game has no way to load it, and tests/multilane.test.js checks index.html doesn't contain it and that the game's MAPS is Classic alone.
- **Two AIs play it to a finish** (tests/slow/multilane-match.test.js, Hard vs Hard, three faction pairings): all three end with an HQ destroyed: Bloomhost beat Last Fist at 15:37, the Axiarchs beat Bloomhost at 12:53, Last Fist beat the Axiarchs at 19:15 (at the harness's 1/30 s step, seeds 100–102 gave one HQ win and two storm draws); both sides fought on both lanes in every match (the AI alternates its new units between lanes; it has no lane strategy yet: that is the map-aware AI step).
- **Tests:** tests/multilane.test.js (map valid and test-only, grid fog hides the other lane, no shots across the gap, units alternate lanes and keep to them through the split, lane orders hold one lane while the other attacks, true-distance capture, the save's map and refusals, Classic units carry no lane); tests/slow/multilane-match.test.js.
- **Open:** blockers and the navigation grid (open maps); lane-aware AI; drawing a multi-lane map (the renderer's ground, minimap and camera are Classic's); the player's Split Army controls (proposal pending).

## Army controls on Classic (v2.62, Phase 1)
- **Two rally flags:** a Base flag (where the map's rally point was, 240 out from the HQ) and a Forward flag (`RALLY.fwdOut` 560 out, just past the player's own field node at 460). The active flag is where idle and new units gather and where Retreat goes. The Army tab's **Rally** button shows the active flag; one tap makes the other flag active and sends the whole army there (a Regroup to the flag; units engage within the melee Hold distance as with any Regroup). **Moving a flag:** tap it on the battlefield (the banner reads "Base flag / Forward flag: tap the battlefield where it goes"), then tap the ground; flags stay between `RALLY.min` (120) out from the HQ and `RALLY.past` (250) beyond the centre; the army follows a moved flag it is standing at. Both flags are drawn (the inactive one faded, the forward one orange with an F).
- **Send damaged home:** every unit under **40% health** (`DAMAGED.thr`) walks back to the Base flag holding its fire (as on Retreat), heals **3% of its HP a second** there once unhurt for 3 s (`DAMAGED.heal`, `calm`), and rejoins its group's order or the army's stance at **95%** (`done`): from 40% that is about 18 s of healing plus the walk. The button shows how many units it would send ("Damaged 3"). Why 40%: low enough that a unit is worth saving (it would die in the next exchange) and high enough that it can still walk out of a fight; healing only happens for units sent home, so it is a decision, not passive regeneration.
- **Scope:** the player's side only. The AI doesn't use them; a side that never touches them has no `side.rally`, so AI-vs-AI matches play exactly as before. The state (`side.rally`, `u.medHome`) is saved with the match.
- **Layout:** a third column in the Army tab, right of Hold / Attack / Retreat / Regroup, 84 px wide (two buttons stacked); checked at 858×396 and 667×375 (tests/army-controls-ui.test.js: on screen, nothing covering them, clear of the ability buttons, tappable size). At 667 wide the unit chips have less room and scroll, as they already did.
- **Tutorial:** the Army chapter has three new steps (open the Army tab; the two flags and how to move them; Send damaged home with its threshold read from `DAMAGED.thr`).
- **Tests:** tests/army-controls.test.js (SIM: no state until used, Rally sends and holds, flag limits and the army following a moved flag, damaged units hold fire, heal and rejoin, the AI never uses them), tests/army-controls-ui.test.js (both iPhone sizes).

## Difficulty ladder (v2.61, Phase 1)
- **The v2.60 fixes now apply to every difficulty.** The Default preset (Easy and Normal) gains `scoutGo` (the scout really runs while its side sits on Retreat), `estFix` (the capped estimate of an unseen army) and `supply` (trade a spare building for a Habitat when supply-blocked with money banked), plus `est` (use the estimate at all: without it, an Easy or Normal AI that had seen nothing treated the enemy army as zero and attacked into it), `press` and `raid` with each difficulty's own settings. The supply rule now asks for every Habitat at the side's top tier (Easy stops at T2: before, an Easy AI stood at 28 supply all match).
- **How hard each difficulty plays is set on purpose** (`LADDER` in src/sim/core.js, read through `aiDiff` by any preset with the `ladder` rule; the pinned presets `default260`, `hard259`, `v239`, `legacy`... don't have it and play their recorded DIFF):

  | | Easy | Normal | Hard |
  |---|---|---|---|
  | Decisions (DIFF delay × dial) | every 1.3 s (DIFF had 2.5) | every 0.8 s | every 0.6 s (Bloomhost 1.0; unchanged) |
  | Army it fills | 90% of the limit (DIFF had 60%) | 100% | 100% |
  | Top tier | T2 | T3 | T3 |
  | Unit handling (`smart`), Refineries | 0.35 (DIFF 0.2), 2 (DIFF 1) | 0.65, 2 | 0.65, 2 |
  | Attack edge (press): early → late, from | 1.4× → 0.9×, from 6:00, and never into a known stronger army | 1.2× → 0.55× (from 12:00 to the storm warning), from 4:30 | 1.15× → 0.75×, from 4:00 (v2.60) |
  | Raids | none | every 110 s, up to 3 units | every 75 s, up to 4 (v2.60) |
  | Hard's defensive rules | none | breakout, shield, power, fill, counter, nowave | all (v2.60) |

  Easy is still the slowest, smallest, most cautious side and never raids; Normal sits between. Note: Easy's decision speed, army share, unit handling and Refineries went **up** from DIFF's: with the bug fixes in place, the old Easy numbers made it lose to Normal over 90% of the time, so to bring Normal-beats-Easy into 70–80% Easy had to be given more than before. Against a person, v2.61 Easy is therefore a stronger opponent than v2.60 Easy (measured: v2.61 Easy against v2.60 Easy, 40 mixed-faction matches, 36–0–4; Normal, by contrast, plays about as well as before: v2.61 Normal against v2.60 Normal, 40 matches, 12–8–20).
- **Results** (audit/sim/ladder.js: 200 matches per matchup, mixed factions (all nine pairings in turn), sides alternating, seeds 8000–8199, to 27:00; audit/logs-p1/ladder-v261.md and .json):

  | Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
  |---|---|---|---|---|---|---|
  | hard vs normal | 152–21–27 | 82.8% | 8:00 | 83.0% | 13.5% | 0.0% |
  | normal vs easy | 138–40–22 | 74.5% | 12:24 | 86.0% | 11.0% | 0.0% |
  | normal vs normal | 90–66–44 | 56.0% | 14:43 | 74.5% | 22.0% | 0.0% |
  | easy vs easy | 99–88–13 | 52.8% | 13:09 | 79.0% | 6.5% | 0.0% |

  Before (v2.60, the same tool, 40 matches each): Hard beat Normal 90%, Normal beat Easy 91.3%, Normal vs Normal 30% draws, Easy vs Easy 32.5% draws.
  Met: Normal beats Easy (74.5%), both mirror draw rates (22%, 6.5%), no-fight (0% everywhere). **Not met: Hard beats Normal 82.8%, 2.8 points above the 70–80% band** (see the tuning history). **Accepted (decision after v2.63):** Hard is not weakened to bring it into the band.
- **Tuning history** (22 configurations, so the next pass doesn't repeat them): Hard vs Normal stayed at 80–84% over 200 matches across every Normal setting tried (decision speed 0.6–0.8, attack edges and their late fall-off, raids, with or without Hard's `contest` and `power` rules), so it's mostly Hard's v2.60 rules, not Normal's settings; lower would take a weaker Hard or a much stronger Normal. Normal-vs-Normal draws were the touchy number: 30.5% with Normal deciding every 0.7 s (and giving up on a perfect edge at 15:00), 22% at 0.8 s with the usual 18:00 (a quicker Normal defends well enough to stall another Normal); dropping Normal's `power` rule looked better on 100 seeds (35% → 27%) but not over 200 (30.5%); `contest` raised them (33%). The runs are deterministic: the same settings give the same table (checked: l13 and the final run match exactly).
- **Tutorial:** unaffected. Its practice match switches the enemy AI off (`tutStart`), so nothing in it relies on how Easy or Normal play; tests/tutorial.test.js passes.
- **Tests:** tests/ladder.test.js (the fixes on every difficulty and absent from the pinned presets; the ladder's ordering; a supply-blocked Easy side still grows past one T2 Habitat). Tests that pinned v2.60's Default behaviour now name the `default260` preset (attack, fog bar, hardhuman, tactics).

## AI attack decisions: the stalemate fix (v2.60, Phase 1)
- **Problem (v2.56 baseline):** two Hard AIs reached 20:00 undecided 80–96% of the time, and 23–56% of those matches had no fight at all.
- **Diagnosis (why two Hard AIs never finished each other), from traces of v2.59 Hard vs Hard:**
  1. **It never saw the enemy.** The scout rule sends a unit toward the enemy base, but `updateUnit` ran any unit on its side's Retreat stance home first (and held its fire), and an AI sits on Retreat whenever it isn't attacking. Before v2.55 the left side sat on Hold, so it did scout; after the stance fix neither side did. 3 of 12 traced matches never saw an enemy unit in 20 minutes.
  2. **Unseen, the enemy army was a runaway guess.** `aiEstimate` (Hard's `est` rule) was 40% of every credit the enemy had ever earned, minus every kill. Unseen, it grew without limit: 13,542 against a real 2,320 at 19:00 (seed 2). Every attack rule needs its own army to beat that number by a margin, so no rule ever fired, not even "the storm is coming, everything in" (seed 31: estimate 10,272, real 1,853, own army capped at 2,363). Once fights happened, the subtracted kills drove it to 0 while the real army stood at 2,000–3,000, and the AI attacked into it. Fitted on 456 samples, the old estimate was off by 2,010 on average; a capped time curve is off by 566.
  3. **The armies couldn't grow, and the bank rebuilt every loss.** This turned out to be the main cause. Hard filled its 8 pads with production and economy and built one Habitat: 12 (HQ) + 22 (one T3 Habitat) = **34 supply** of the 80 allowed, all match, while the bank reached 5,000–7,600 credits. Every lost unit was rebuilt at once at home, so after the first two fixes the armies fought in the middle for 15 minutes and not one building fell (Bloomhost mirror, seed 3). The existing rules that trade a building for a Habitat fired only with no Habitat at all, or when 3× ahead.
  4. Not the cause (tested): the HQ gun's reach (back at v2.42's 430/470: no change), the siege line (turning every siege push into a full push: no change).
- **Changes (Hard only, `AI_PRESETS.hard.fix`; the `ATTACK` block in src/sim/ai-presets.js; `hard259` keeps v2.59's Hard; Easy and Normal play the Default preset, unchanged: three seeded Easy/Normal matches hash identically to v2.59):**
  - `scoutGo`: a Hard scout (and raiders) move on their own stance, so the scout really runs.
  - `estFix`: the unseen enemy army is min(250 + 4 × t, 2,500), or the last good look at it plus 8 a second (a look counts when it shows at least half the curve, or more than expected).
  - `supply`: at its army limit with 800+ banked, every Habitat at T3 and no free pad, it trades a spare Reactor, Refinery (a second one when 2,400+ banked) or an unneeded Turret for another Habitat.
  - `press`: from 4:00, a full push when its army is 1.15× the enemy's (falling to 0.75× from 14:00 to the storm warning at 19:30), or 1.035× with a 25% income lead; a push for the centre node at 0.85× while it doesn't hold it; a field push turns into a base push once the edge is there; a "siege" against an HQ gun of 500+ range is a full push (the siege line would be mid-field).
  - `raid`: with no push on, from 4:00 and every 75 s, up to 4 of its fastest ground units (at most 30% of the army) take the enemy's node, coming home when below half health, after 45 s, or when the army attacks.
  - Ablation on a quick sample (84 matches): `supply` alone gave a median of 11.9 min and 19% draws; all five give 13.9 min and 14%.
- **Results (audit/sim/baseline.js, the same seeds and sizes as the v2.56 baseline; full tables in audit/logs-p1/baseline-v260/):**

  | Matchup | v2.56 A–B–draw | v2.60 A–B–draw | median v2.56 → v2.60 | decided before 20:00 | draws | no fight |
  |---|---|---|---|---|---|---|
  | LF mirror | 23–18–159 | 79–74–47 | 23:54 → 15:16 | 19.5 → 73.0% | 79.5 → 23.5% | 56.0 → 0% |
  | BH mirror | 10–15–175 | 79–89–32 | 22:24 → 12:47 | 3.5 → 80.0% | 87.5 → 16.0% | 23.0 → 0% |
  | AX mirror | 32–29–139 | 66–79–55 | 23:49 → 14:09 | 13.5 → 68.5% | 69.5 → 27.5% | 49.5 → 0% |
  | LF Hard vs BH Hard | 9–4–67 | 52–20–8 | 22:26 → 14:01 | 10.0 → 85.0% | 83.8 → 10.0% | 32.5 → 0% |
  | LF Hard vs AX Hard | 7–8–65 | 29–31–20 | 23:51 → 13:10 | 15.0 → 71.3% | 81.3 → 25.0% | 51.3 → 0% |
  | BH Hard vs AX Hard | 5–22–53 | 28–42–10 | 22:24 → 10:30 | 21.3 → 85.0% | 66.3 → 12.5% | 32.5 → 0% |
  | LF Hard vs LF Default | 40–5–35 | 79–0–1 | 16:17 → 6:18 | 55.0 → 97.5% | 43.8 → 1.3% | 0% |
  | BH Hard vs BH Default | 43–1–36 | 77–1–2 | 21:30 → 6:45 | 43.8 → 97.5% | 45.0 → 2.5% | 0% |
  | AX Hard vs AX Default | 49–4–27 | 74–3–3 | 21:28 → 8:39 | 47.5 → 90.0% | 33.8 → 3.8% | 0% |

  - **Targets, Hard vs Hard (840 matches):** median 12–18 min: met in the mirrors (12:47–15:16) and two of three cross pairings (13:10, 14:01); Bloomhost vs Axiarchs is shorter (10:30). At least 50% decided before 20:00: met everywhere (68.5–85%). Under 5% with no fight: met (0%). Draws under 25%: met overall (172 of 840, 20.5%) and in four of six matchups; the Axiarch mirror is at 27.5% and Last Fist vs Axiarchs at 25.0%.
  - **Spawn sides stay even:** mirrors 79–74, 79–89, 66–79.
  - **Faction shares in Hard vs Hard moved:** Last Fist 59.4%, Bloomhost 35.6%, Axiarchs 55.0% (v2.56: 51.3 / 43.1 / 55.6). Bloomhost loses most of its matches now that matches are decided: a balance item for the Phase 1 balance pass (no stats changed here).
  - **Hard vs Default is now 94–99%** (was 72–78%): Hard is much stronger than Normal, so the difficulty gap widened. Hard against a human was not measured (no bot plays like one); its aggression is the new behaviour to watch in playtests.
  - **Tech and Contain:** 58.1% and 37.8% against the field, unchanged: the strategy field, triangle and Greedy-vs-Greedy sets are scripted bots that don't use the Hard AI, so they play identically (Tech within ≤60%, Contain still under 40%).
- **Tests:** tests/attack.test.js (each rule, Hard only, Default and hard259 unchanged); hardhuman.test.js's v2.41 `est` test and its Greedy scenario run on `hard259`.

## Classic in the map format (v2.59)
- **What:** src/sim/maps.js (a new build part before sim/core.js) holds `MAPS.classic` in the docs/MAP_FORMAT.md format: display fields, size 1700 × 400, army cap 80, `mirror-x` symmetry, two bases (HQ, face, 8 pads, signature pad, rally), the 1v1 mode, one lane 230 wide, three income nodes at 680 / 850 / 1020. `MAP` is the map every match plays; `g.map` points to it. The SIM now reads the map: `L`, `HQ_U`, `POP_MAX`, `LANE_V`, `NODE_R`, `dirOf`, `hqU`, `hqPos`, `slotPos`, `rallyU`, the node spots (`setMech7c(true)`; false still gives v2.42's 600 / 850 / 1100) and the node depth.
- **No gameplay change:** every coordinate is the exact double the v2.58 formulas gave (tests/maps.test.js compares each pad, HQ and signature pad with `tilePos` bit for bit). The pinned replay fingerprints all match (determinism, tactics, hardhuman), and three full seeded Hard matches on current rules (Last Fist/Bloomhost, Axiarchs/Last Fist, Bloomhost/Axiarchs) hash identically on v2.58 and v2.59 every 100 ticks to the end.
- **Validation:** `validateMap(m)` returns a list of problems; tests/maps.test.js runs it on every map (Classic: none) and breaks a copy of Classic once per check to show each is caught: overlapping pads or nodes, off the map, unknown node type or guard unit, army cap (20–200, whole), modes naming missing bases or leaving one out, a wall that cuts the bases apart (ground reachability on a 10-unit grid, inside lanes or anywhere on an open map), broken `mirror-x` symmetry for pads and nodes, an unpaired blocker on an open map, missing display fields, duplicate ids.
- **Not done yet (by design):** the save doesn't record the map (there is only one; adding the key now would change the pinned replay hashes; it comes with the second map). `NODE_TYPES` lists the five types; only `income` is live. The thumbnail drawing and the 2D fog come with the first new map.

## Test suite split (v2.58)
- `npm test` is the fast suite (tests/*.test.js), for every push. The long statistical tests moved to tests/slow/ and run with `npm run test:slow`: ai-stats (seeded AI rates, about 11 minutes alone), spawn-balance (150 Hard mirrors, about 9 minutes) and storm-limit (9 full AI-vs-AI matches, from extinction.test.js). Rule (CLAUDE.md): run test:slow too before any commit that touches the SIM or the AI.
- Measured per file (each alone, 4 at a time): the fast suite's longest file is now the tutorial's browser flow (about 5 minutes; functional, so it stays).

## Phase 0: index.html split (v2.57)
- **What:** the source is in src/ (33 parts: head.html, style.css, body.html, 12 in sim/, 7 in render/, 10 in ui/, end.html), cut at existing section comments. build.js joins them in its `PARTS` order, byte for byte (no dependencies, no transforms) and writes index.html, which stays committed and self-contained (GitHub Pages and the test kit read it as before). `npm run build`, `npm run check`.
- **Proof:** the first build of v2.57 was byte-identical to v2.57's single file (`cmp`, SHA-256 c01f3b28… both); `git diff` of index.html against v2.56 shows only the VERSION line; tests/determinism.test.js (the replay fingerprints back to v2.29) passes on the built file.
- **Guard:** tests/build.test.js fails if index.html differs from a fresh build (checked: one line appended to src/ui/main.js without building fails it), if a file in src/ isn't a part, or if the SIM / RENDER END markers move or repeat.
- **Rule:** edit src/, never index.html; build; commit both (CLAUDE.md, README "Editing and building"). One global scope as before: part order matters.

## Audit baseline (v2.56, after the stance fix): the current numbers
- **Why:** every AI-vs-AI figure measured before v2.55 (the audit phases 4–7c, the item 2 mirror check) was played with the side-0 Hold handicap: an AI-played left side kept the player's Hold stance until its first attack (KNOWN_ISSUES "Phase 0, item 2"). Paired and alternating runs cancelled the side bias in the faction shares, but every match had one handicapped side. Those figures are kept in their sections as history and marked; these are the current ones. The scripted strategy bots (triangle, field, Greedy vs Greedy) were never handicapped (both bot slots play on Hold), but their numbers also moved with the seeded random stream (v2.50) and storm draws (v2.48), so they are re-measured here too.
- **Run:** `node audit/sim/baseline.js --nm=200 --nh=40 --nd=40 --nt=12` on v2.55 code (seeds as in the script; AI sets to the 27:00 limit, bot sets to 30:00 as in stratrun.js). Full tables: audit/logs-p0/baseline/baseline.md, per match: baseline.json. "Share" = (wins + draws/2) / matches. "No fight" = both sides together dealt under 1,000 damage all match (a few shots); measured for the AI sets only (the bots always fight).

  | Matchup | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
  |---|---|---|---|---|---|---|
  | LF mirror (A = left) | 23–18–159 | 51.3% | 23:54 | 19.5% | 79.5% | 56.0% |
  | BH mirror (A = left) | 10–15–175 | 48.8% | 22:24 | 3.5% | 87.5% | 23.0% |
  | AX mirror (A = left) | 32–29–139 | 50.8% | 23:49 | 13.5% | 69.5% | 49.5% |
  | LF Hard vs BH Hard | 9–4–67 | 53.1% | 22:26 | 10.0% | 83.8% | 32.5% |
  | LF Hard vs AX Hard | 7–8–65 | 49.4% | 23:51 | 15.0% | 81.3% | 51.3% |
  | BH Hard vs AX Hard | 5–22–53 | 39.4% | 22:24 | 21.3% | 66.3% | 32.5% |
  | LF Hard vs LF Default | 40–5–35 | 71.9% | 16:17 | 55.0% | 43.8% | 0% |
  | BH Hard vs BH Default | 43–1–36 | 76.3% | 21:30 | 43.8% | 45.0% | 0% |
  | AX Hard vs AX Default | 49–4–27 | 78.1% | 21:28 | 47.5% | 33.8% | 0% |
  | Strategy field, every match | 157–141–46 | 52.3% | 6:27 | 86.0% | 13.4% | – |
  | Greedy vs Greedy: LF > BH / LF > AX / BH > AX | 8–12–4 / 12–12–0 / 6–18–0 | 41.7 / 50.0 / 25.0% | 6:26 / 5:05 / 6:10 | 83 / 100 / 100% | 17 / 0 / 0% | – |

  - Hard vs Hard faction shares (160 matches each): Last Fist 51.3%, Bloomhost 43.1%, Axiarchs 55.6% (v2.43 with the handicap: 43.8 / 64.6 / 41.7). Greedy vs Greedy faction shares: Last Fist 45.8%, Bloomhost 41.7%, Axiarchs 62.5% (v2.43: 47.9 / 41.7 / 60.4).
  - Strategy field, branches against the field: Timing 54.9% (88–71–13), Air 49.1% (76–79–17), **Tech 58.1%** (73–45–54, 31% draws), **Contain 37.8%** (61–103–8). Openings: Greedy 65.1%, Contain 58.8%, Standard 51.1%, Rush 46.7%, **Turtle 29.5%**. (v2.43: Tech 62.8%, Contain 35.5%, Turtle 29%.)
  - Triangle (24 per cell, A share): Rush > Greedy 91.7 / 100 / 50% (LF / BH / AX); Greedy > Turtle 100 / 100 / 95.8%; Turtle > Rush 100 / **0 / 0**%; Contain > Greedy 0 / 25 / 50%; Contain > Turtle 62.5 / 100 / 85.4%; Contain > Rush 58.3 / 83.3 / 87.5%. Still a switch per cell (scripted bots), and the Bloomhost and Axiarch Turtle still lose every game to Rush.
- **Answers:**
  - **Tech:** 58.1% against the field, now inside the ≤60% target (v2.43: 62.8%), but a third of its matches are draws (31%): Tech wins outright 73–45 and stalls often. Axiarch Tech per faction was not split out here.
  - **Contain:** 37.8%, still short of the ≥40% target (v2.43: 35.5%); it loses 61–103 outright.
  - **Stalemates to 20:00:** this is the main finding. Between two Hard AIs the match reaches 20:00 undecided 80–96% of the time (mirrors: 80.5 / 96.5 / 86.5%; cross-faction Hard: 85–90%), and 23–56% of them have no fight at all: both armies gather under their own HQ guns and neither AI's engage rule finds a fight it wins. Hard vs Default is decided before 20:00 44–55% of the time. The scripted bots, which always attack, are decided before 20:00 in 86% of field matches (median 6:27). With the left side no longer handicapped, Hard against Hard has nobody who attacks first.
- **Open:** the Hard-vs-Hard standoff is an AI issue (Phase 1 "AI learns the new maps" / the balance pass), not fixed here; Hard vs Default is 72–78%, under the 75% target for Last Fist; Contain < 40%; Turtle opening 29.5%; Axiarchs 62.5% in Greedy vs Greedy; Bloomhost and Axiarch Turtle lose every game to Rush.

## Phase 0: stance fix (v2.55)
- **What:** an AI-played side 0 (the audit harness, spectate mode) starts on Retreat like the AI's side 1 (`AUTO_STANCE.retreat`; false = v2.54). A human player still starts on Hold. One line in `newGame`; no other rule, AI or balance change. The pinned replays (tests/determinism, tactics, hardhuman) run with it off, as recorded.
- **Result, 200 Hard mirrors per faction to 27:00** (audit/sim/mirror.js, seeds 1–200, side 0 left; logs-p0/mirror-v255.*): Last Fist 23–18 (z 0.8), Bloomhost 10–15 (z −1.0), Axiarchs 32–29 (z 0.4); 159, 175 and 139 of 200 are storm draws. Before (v2.48, same seeds but the old random stream): 48–80, 23–52, 23–83.
- **Test:** tests/spawn-balance.test.js plays 50 seeded mirrors per faction (seeds 1–50, 27:00) on the harness's worker processes (about 9 minutes of the npm test run). It differs from the brief on purpose: with storm endings now draws, only 5–14 of 50 mirrors are decided, and a flat 60% of so few fails a fair game (seeds 1–50 give Last Fist 5–2 and Bloomhost 2–5). So each faction's check counts every match for the side that was ahead (the winner; in a draw the side ahead on the tie-break score, or whose HQ the storm did not take; at most 60%), and a fourth check pools the decided matches of all three (at most 60%). With the fix: ahead 29–21, 21–29, 28–22; decided 5–2, 2–5, 8–6, pooled 15–13. With `AUTO_STANCE.retreat` false the same test fails: ahead 24–26, 18–32, 20–30; decided 15–20, 2–20, 9–15, pooled 26–55 (68% for the right).
- **Side effect: standoffs.** With both AIs gathering under their HQ guns, many Hard-vs-Hard matches never fight: of seeds 31–36, Last Fist vs Bloomhost, three played to the storm with zero damage dealt by either side and one with 200 (one shot). The Hold handicap used to force fights (the left side's units stood forward). Measured in the v2.56 baseline. tests/stats.test.js moved to a seed with a fight (33); the seeded Axiarch-path scenario in tests/ax-trees.test.js runs with the switch off, like the other recorded scenarios.
- **Every earlier AI-vs-AI number carried the handicap** (see item 2); the new baseline (v2.56) replaces them.

## Phase 0, item 7: installable fullscreen app (v2.54)
- **What:** manifest.json (`display: fullscreen`, `orientation: landscape`, theme `#070b14`, background `#060914`, start and scope `./`), icons in icons/ drawn with the game's own art by tests/make-icons.js (192, 512, maskable 512, Apple 180), sw.js, and the Apple tags (title "Extinction", black-translucent status bar, touch icon). The service worker registers only over http(s) and never on the test kit's page.
- **Caching:** the page is network-first (every online launch gets the newest version and refreshes the cached copy; offline the cached copy plays). Icons, manifest and the title art are cache-first and refreshed in the background. The cache name (`extinction-event-v1`) only needs a bump if the list of cached files changes.
- **Tested:** tests/pwa.test.js serves the repo at `/Extinction-Event/` (how GitHub Pages serves main), checks the worker's scope, reloads with the network off and plays a match. Not tested on a real iPhone: iOS ignores `display: fullscreen` and opens a home-screen web app standalone (no Safari bars, the status bar over the game via black-translucent), and its Add to Home Screen uses the Apple touch icon.
- **Icon:** the Apple touch icon was `apple-touch-icon-2.PNG` (key art, not in-game art); it now points to icons/apple-touch-icon.png. The old file is still in the repo: change one line in the `<head>` to go back.

## Phase 0, item 6: alerts (v2.53)
- **What:** the "Alerts" block in the UI: `alertTick` (every UI refresh, 0.15 s) raises an alert for the HQ hit in the last 0.6 game s, any other building hit (keyed by a 160-wide strip of the base, so a battle in the base is one alert, not eight), and a field node the player owns or is capturing with enemy ground units it can see standing on it. Each key alerts at most once every 10 game seconds (`ALERT.gap`). An alert is a tappable toast (› marks it) in its own column at the left edge under the top bar (other toasts move to its right while it shows) and a ping on the minimap for 5 s; tapping the toast, or the minimap within 12 px of a ping, moves the camera there. While an ability, Regroup or a warp point is being aimed, alerts let taps through to the field (an alert in the middle of the screen swallowed an ability placement in tests/bloomhost-ui.test.js, which is why the column moved to the edge).
- **Changed:** the SIM's `alert` event (one per side every 10 s, "Your base is under attack", no place) no longer shows a toast; the event itself is unchanged. UI only: no SIM change.
- **Notes:** the HQ alert does not fire while its shield is up (the SIM ignores hits on a shielded HQ). Alerts are off in spectate mode. A contested-node alert uses only what the player can see, so it can't reveal a hidden army.

## Phase 0, item 5: post-match screen (v2.52)
- **Tabs:** Overview (the result table, key moments, Copy match log), Economy (four canvas line graphs from the stats tracker, both sides: credits income per minute (30 s average), energy income, army value, units alive; a totals table), Army (built / lost bars per unit type, damage dealt and to buildings, buildings built and destroyed), Enemy Timeline (`repEnemyEvents`: opening, buildings finished, first unit of each type, tech tiers with their path, strategy moves (attacks, sieges, feints, the AI's reads of turtle / rush / greed), production shifts (the unit role it spent most on per 2 minutes, when it changes), abilities, nodes).
- **Removed:** the Summary, Timeline (both sides' columns), Key moments and Stats tabs; their content moved into Overview and Army, and the full two-sided timeline stays in Copy match log.
- **Fixed on the way:** the match log printed the AI's reads (`G` turtle / rush / greed) as "Attack launched"; they now read "Read the enemy's …; changed plan".
- **Checked:** screenshots at 858×396 and 667×375 (tests/report-shots.js); tests/report-ui.test.js checks every tab at both sizes, that the Army table and Enemy Timeline show the recorded numbers and events, and that both lines are drawn on every graph. A match resumed from a save older than v2.51 has no stats record and says so on Economy and Army.

## Phase 0, item 4: stats tracker and match history (v2.51)
- **What:** the "Stats tracker" block (`STATS`, `g.stats`), fed by `lg`/`lgUnit` (every key event, units trained and lost), the income loop and Salvage (gathered per 10 s; sales not counted), and `damage1` (HP and shields actually taken off, to the attacker's side). It reads nothing back and draws no random numbers: tests/stats.test.js plays the same seed with and without it and gets the same match. Saved with the match (an older save starts its record at load).
- **History:** at the end of a match (not the tutorial or spectate) `statsSummary` (about 1–3 KB) is appended to localStorage `extinctionEvent.history`, the last 50 kept, every access in try/catch (tests/history-ui.test.js, including storage that throws). Nothing reads the history yet.
- **Bounds:** 200 samples per side (a 27:00 match takes 163) and 120 entries per timestamped list.

## Phase 0, item 3: deterministic simulation (v2.50)
- **What:** game logic draws every random number from `simRnd` (mulberry32) seeded per match: `newGame(diff, { seed })`, else a fresh seed; the seed is `g.seed`, the stream's state `g.rs`, saved and restored with the match. Visual-only randomness inside the SIM (particles, explosion debris, the idle-animation phase `anim` of units and buildings) draws from `fxRnd`, a second stream (`g.fs`) from the same seed, so effects can never change a match. Math.random is left to the UI (random faction pick, sound, render effects). `RNG.legacy = true` sends both back to Math.random in the old call order: the pinned replays in tests/determinism.test.js, tactics.test.js and hardhuman.test.js run that way and still match their recorded hashes; three seeded scenario tests (ax-abilities, signature, fog) run legacy or reseed.
- **Fixed tick:** `TICK` = 1/60 s is the SIM's step. The frame loop already ran fixed steps (v2.43); it now uses `TICK`, and 1–3× runs 1–3 times as many ticks per frame. The audit harness still steps 1/30 s (its results stay comparable with every earlier report; a switch to `TICK` would double its cost).
- **Test:** `node audit/sim/determinism.js` plays one match per faction pairing twice, in two VM contexts whose Math.random differ, at `TICK`, and compares a SHA-1 of the serialized state every 100 ticks: 6 seeds, 10 minutes each, all 360 hashes identical (one match ended at 4:59, identical to the end). tests/determinism.test.js has a short version (100 s, plus "another seed plays another match" and "a save keeps the streams").
- **Not exact:** a match resumed from a save is not tick-for-tick the same as the unsaved one (deserialize resets some AI timers, as before v2.50); the streams themselves are restored.
- **Balance re-run** (audit/sim/run.js, 40 matches per cell, 20:00 cap, seeds 1–40; before = v2.49, after = v2.50; A–B–draws):

  | Pairing | before | after |
  |---|---|---|
  | Last Fist Hard vs Bloomhost Hard | 6–13–21 | 8–12–20 |
  | Last Fist Hard vs Axiarch Hard | 5–6–29 | 6–4–30 |
  | Bloomhost Hard vs Axiarch Hard | 11–5–24 | 10–4–26 |
  | Last Fist Hard vs Default | 29–3–8 | 25–2–13 |
  | Bloomhost Hard vs Default | 27–1–12 | 29–1–10 |
  | Axiarch Hard vs Default | 25–1–14 | 25–1–14 |

  No cell moved by more than 5 of 40; every shift is inside what a different random stream gives (the matches are different matches, so they can't be identical). No big shift. Note how many Hard-vs-Hard matches run past 20:00 (21–30 of 40).

## Phase 0, item 2: mirror-match check, spawn side (v2.49, report only: nothing fixed)
- **Run:** `node audit/sim/mirror.js --n=200 --maxT=1620` on v2.48 (storm endings are draws): 200 Hard-vs-Hard matches per faction against itself, both sides `faction:hard:random` (Hard picks its opening per match), seeds 1–200, side 0 always on the left (u = 220, the player's slot, played by the autoplayer) and side 1 on the right (the normal AI slot). Raw results in audit/logs-p0/.

  | Mirror | left (side 0) wins | right (side 1) wins | draws | decided before 20:00 (L–R) | left share of decided |
  |---|---|---|---|---|---|
  | Last Fist | 48 | 80 | 72 | 44–77 | 37.5% (z −2.8) |
  | Bloomhost | 23 | 52 | 125 | 12–40 | 30.7% (z −3.4) |
  | Axiarchs | 23 | 83 | 94 | 3–61 | 21.7% (z −5.8) |

  The right side wins well above 50% in every mirror; for the Axiarchs almost every match decided before the storm goes to the right.
- **"Bloomhost wins 64.6% of mirror matches":** it is not a mirror. The number is from the v2.43 validation (audit/logs7c/final-validate-hard-dh.txt, audit/polish-report.md): Bloomhost's share of its **cross-faction** Hard-vs-Hard matches, 24 paired matches per pairing: 16 of 24 against Last Fist plus 15 of 24 against the Axiarchs = 31 of 48 = 64.6%. Bloomhost vs Bloomhost was never part of it.
- **Cause: the starting stance of the left side, not the map.** `newGame` gives side 0 the player's default stance, **Hold**, and side 1 the AI's default, **Retreat** (`stance: s === 0 ? 'hold' : 'retreat'`). When side 0 is played by the AI (the harness, spectate mode), it keeps Hold until its first attack (2–3 minutes in, sometimes never: one traced Axiarch match lost at 5:02 without ever leaving Hold). On Hold every new unit stands where it was made (`holdU` = its spawn spot, or for the Axiarchs where it warped in at the field's front edge), melee units engage only within 80 of that spot, and nothing gathers at the rally point under the HQ gun, so the left army is spread out and fights piecemeal; the right army gathers under its gun.
- **Proof:** the same 200 seeds per faction with one change, both sides starting on Retreat when side 0 is autoplayed (`stance: s === 0 && !opts.autoPlayer ? 'hold' : 'retreat'`, a copy of v2.48, 20:00 cap):

  | Mirror | as is: decided before 20:00 (L–R) | both on Retreat (L–R) |
  |---|---|---|
  | Last Fist | 44–77 (z −3.0) | 20–18 (z 0.3) |
  | Bloomhost | 12–40 (z −3.9) | 2–3 (z −0.4) |
  | Axiarchs | 3–61 (z −7.3) | 19–16 (z 0.5) |

  With the stance equal the spawn sides are even: 41 left, 37 right over the 600 matches. Ruled out by reading the code: the map is a mirror in u (HQs at 220 and 1480, nodes at 680 / 850 / 1020, pads by `tilePos` with the same v on both sides); fog cells line up symmetrically (L = 1700 is a multiple of the 10-wide cells); node capture and targeting have no side preference. Not separately measured: the AI update order (side 1's AI runs first each tick) and the first AI think (side 0 at 1.0 s, side 1 at 1.5 s); with the stance equal they leave no measurable bias in 600 matches.
- **What it touches:** human games are not affected (the player is side 0 and chooses the stance; the AI is always side 1 on Retreat). Every AI-vs-AI number is: spectate matches, and every audit result since the harness (v2.38). The runner alternates or pairs sides (run.js, the paired validations), so the bias cancels in the faction shares, but every match was played with one handicapped side, so those shares (including Bloomhost's 64.6% and the strategy-bot results where the bot sat on side 0) describe handicapped play. A second finding: with the handicap gone, a Hard mirror is mostly a standoff until the storm (decided before 20:00: Last Fist 38, Axiarchs 35, Bloomhost 5 of 200).
- **Fixed in v2.55** ("Phase 0: stance fix" above). **The fix as suggested then:** start an autoplayed side 0 on Retreat like the AI (one line in `newGame`; the player's side keeps Hold), then re-run the mirrors and the Hard-vs-Hard and Hard-vs-Default matrices, since every earlier AI-vs-AI number moves. The pinned replays in the tests would need re-recording or a legacy switch.

## Phase 0, item 1: storm endings are draws (v2.48)
- **What:** an ending the Extinction Event decides is now a **draw for both sides** (`EXT.draw`, true; false = v2.47's score tie-break): an HQ lost to the storm (`reason: 'storm'`), both HQs falling inside the 5 s window after 20:00 (`'both'`), and the 27:00 limit (`'limit'`). `g.winner` is −1 and `g.result.how` is `'draw'`; the remaining-strength score is still recorded and shown "for the record". An HQ destroyed by units after 20:00 still wins, and before 20:00 nothing changed (both HQs in the same tick still go to the score, kills, credits).
- **Why "both were told they won":** the match log's end line was written from the player's point of view and shown in both timeline columns ("Match ended: you won" under You and under Enemy). A draw now reads "Match ended: draw (the Extinction Event)" in both columns; the end screen's title reads **Draw** (amber).
- **Lessons tab:** there was nothing left to remove: v2.35 replaced it with the Stats tab, and no Lessons code remains (the only "lessons" in the file is the tutorial's text). Item 5 replaces the end screen's tabs.
- **Effect on the audit harness:** matches past 20:00 were already counted as draws at the default `maxT` of 1200; at `--maxT=1620` storm endings are now draws too. Tests updated for the new rule: extinction, report, browser (end screen), bots and sim (a Hard AI-vs-AI match may end in a storm draw).

## Tutorial (v2.46)
- **What:** seven chapters, each its own practice match as Last Fist: Controls (9 steps), Economy (8; the Build-tab step is skipped when that tab is already open), Building (7; the two signature-pad steps are skipped when the signature pad is off), Army (7), Upgrades (6), Combat (5), Factions (5, one per faction plus intro and close). Launched from the Codex's How to Play tab (any chapter, any time, checkmarks for completed ones) and a first-launch prompt (Play / Skip). Code: the "Tutorial" block in the UI section; `TUT_CH` holds the chapters and every bubble text (between the TUTORIAL TEXT markers; tests/live-text.test.js scans it for hard-coded numbers).
- **Practice match:** enemy AI off (`aiT`), only the tutorial sends units (the Combat chapter's wave); no storm and no time limit (`g.noStorm`, checked in `updateStorm` and `resolveEnd`, set only on tutorial matches); the player's HQ is kept above half health; never saved, never clears the save, no end screen. A normal match started afterwards has none of this (tests/tutorial.test.js checks).
- **Steps:** an explaining step holds the match still (`TUT.hold`, not the pause menu); an action step lets it run and advances when the game state shows the action done (tab, selection, stance, building, queue, node owner, upgrade, wave dead, HQ destroyed), with Next after 8 s. The highlight follows its target every frame; the bubble goes beside it (narrower when needed) and stays below the top bar. Skip ▸, Skip Chapter (the next chapter's own setup) and End Tutorial (pause menu, back to How to Play) work at every step (tested at both iPhone sizes).
- **Codex links:** Army "See stats" (unit:<first troop trained>), Upgrades "View in Codex" (tree:<building upgraded>), Factions "Open the Codex" (Last Fist tab, ends the chapter). From the tutorial the Codex's button reads Back to Tutorial and returns to the same step with the match still held.
- **Mid-match:** starting a chapter from the Codex during a real match asks "Leave this match and start the tutorial?"; Cancel closes the Codex back to the paused match; Yes leaves it (it stays saved: Resume match brings it back).
- **Storage:** `extinctionEvent.tutorial` ({ seen, done }), every access in try/catch; without storage the prompt shows once per page load and nothing is remembered. The test kit marks the prompt answered so other tests start at the main menu; the storage-key tests list the new key.
- **Flaky test fixed (test only):** "P11 Worldrender" (tests/redesign.test.js) looked for the 0.9 s feeding effect only at the end of a 5 s run, so it failed whenever the last drop landed earlier (1 of 30 runs on v2.45, 4 of 30 on v2.46: the same flaw); it now watches the whole 5 s (50 runs in a row passed). tests/codex.test.js expects the chapter list where the placeholder was.
- **Notes:** the Combat chapter is the longest (the army walks the whole lane to the enemy HQ; its length at 1× was not measured, the tests play at 3×); the 1–3× speed button works in the tutorial. Chapter texts are written for Last Fist only.

## Test reliability and live description numbers (v2.45)
- **Flaky tests fixed** (test code only; the game is unchanged): "AI siege under fog" (tests/fog.test.js) failed about 1 run in 4: on the first free pads the nearest building sat right at the edge of what the spotter sees from where the HQ gun stops it, so small random differences (rallyOff spread, salvo scatter, the HQ gun's timing) decided whether the Artillery ever got a target. Its buildings now stand on the front pads (4, 1, 6, 3) and the run is seeded (0 failures in 300 seeds before seeding). "rally on Attack" (tests/polish.test.js) failed about 1 run in 10: a lone Rifleman that rolled a rallyOff near −100 waited so far back it was still short of the check line 6 s after its release. Its units now wait at rallyOff −50 and the run is seeded (0 failures in 300 seeds at −50, 0 and −80). Both files route the SIM's Math.random through `rnd`, so only those two tests are pinned; 25 runs in a row of each passed.
- **Live description numbers:** building tiers, the upgrade-step texts that quote numbers, the ability tips and the unit tips (UNIT_TIPS) are getters that read the data, so a changed stat changes its text. tests/live-text.test.js scans the source for description literals with a digit or a number word and checks ten texts follow a changed value. Text differences from v2.44: the Last Fist Turret T2 read 42 damage/s, the data gives 42.5 (now "43"); number words became numbers ("doubled" → "2×", "half" → "50%", "three-shell salvos" → "salvos of 3 shells", the Skitterling's "Half supply" → "0.5 supply").
- **Code:** `b7Texts()` (which rewrote some texts when a balance layer changed) is a no-op; the Salvage Yard text line in `setBalance` is gone; Nanoweave's 1.2 and 0.85 are now `NANO.dmg` and `NANO.cut` (same values, used in the same six places).

## Codex (v2.44)
- **What:** a Codex screen (`#codex`, the "Codex" block in the UI section) from the main menu and the pause menu. Tabs: How to Play (`CODEX_HOWTO.html()`, a "Tutorial coming soon." placeholder for the tutorial task to replace), then one per faction: overview and signature mechanic (`FACTIONS[k].overview`, `.mech`, plus live numbers from SALVAGE / CREEP / SHIELD / FIELD), commander abilities, buildings with their upgrade trees (paths side by side; troop names link to the troop cards), the signature pair with the 1-of-2 note (signature pad wording only while `sigPadOn()`), troops (unlock, cost, strong/weak from UNIT_TIPS) and a troop stats table (sorts by any column; scrolls sideways inside its own box).
- **Data-driven:** nothing is copied: names, numbers, costs, trees and unlocks are read from BDEFS, TREE_SETS, UNIT_PATH and UDEF when a tab is drawn, after the balance layers have patched them. Checked: a copy of index.html with the Rifleman at 77 HP shows 77 in the table and card (the shipped file is unchanged), and tests/codex.test.js changes `UDEF.rifle.hp` live and reads it back.
- **Counts:** Last Fist 11 buildings (8 pad buildings with the HQ, 2 signature, the Node Bunker) and 13 units; Bloomhost 10 and 16 (with the Mite); Axiarchs 10 and 15. Every one has a `desc` and a drawn picture.
- **Deep link:** `openCodex(tab, item)`, tab `'how'` or a faction key, item `building:<role>`, `tree:<role>`, `unit:<type>`, `stats` or `mech` (or `b:`, `t:`, `u:`); scrolls the item into view and flashes it; returns false if the item isn't on that tab. Mid-match it pauses first (the pause menu sits underneath).
- **Portrait:** the Codex sits above the "Turn your phone sideways" screen, so it reads at 390 wide in portrait; the game itself stays landscape-only.
- **Caveats:** the upgrade nodes show each building's `tiers` sentences and the troop cards the UNIT_TIPS lines as written; where those sentences quote numbers, they are only as current as the text (the stats, costs and HP shown beside them are read from the numbers). Finding, not changed: the Mite's HP (24) and damage are fixed at 40% of the Skitterling's v2.33 values when UDEF.mite is defined, so later Skitterling patches (66 HP) don't reach it.

## Audit phase 7c: mechanics, strategy polish and the speed check (v2.43)
- **Handicap note (v2.56):** the AI-vs-AI figures in this section (Hard vs Hard, Hard vs Default, Hard vs Greedy, Default vs Legacy, mirrors) were measured with an AI-played side 0 on the player's Hold stance until its first attack ("Phase 0, item 2"). They are history; the current numbers are in "Audit baseline (v2.56)".
- **Report:** audit/polish-report.md. **Logs:** audit/logs7c/. **Screenshots:** audit/shots7c/. **Tools** (audit/sim): validate7c.js, speed7c.js, pace7c.js, round7c.sh, final7c.sh; stratrun.js's field sampling fixed; strat.js seeded and its Turtle fixed.
- **Mechanics** (`MECH7C`, `setMech7c(false)` = v2.42): rally point 240 out (inside the HQ gun; a player's new units on Attack go out in groups of 300 or after 15 s); melee units on Hold or a Regroup flag engage within 80 of their spot; field nodes at 680 / 850 / 1020 (outside every T1 HQ gun; the upgraded guns cover the own node); one signature pad per side outside the 8 pads (one of the two signature buildings at a time; sell to swap). The AI uses all four; Hard now builds a signature building (Yard / Rootheart / Beacon).
- **Retune** (`BALANCE7C`, `setBalance7c(false)` = v2.42): HQ gun T2/T3 range 530/560, T3 damage 54; Refinery 12 s; Skitterling 36; Bulwark 140 + 25; Rift Mortar 250 + 100; Worldbreaker 500 + 210; Null Lance T3 85; Tank 290 + 75; Normal always answers an infantry rush with a Turret. Six rounds, round 5 shipped.
- **Speed:** below 20 fps the 1× clock lost time (each frame capped at 50 ms; at 4× CPU throttling 0.25–0.33× in v2.35, v2.40 and v2.42 alike). Fixed with a fixed 1/60 s timestep and a 0.25 s catch-up cap (UI frame loop only; SIM and replays unchanged): 1.02× at 5 fps. The early game is also genuinely slower since v2.42's economy numbers (first unit 76 → 91 s for a greedy start).
- **Results:** Greedy vs Greedy 47.9 / 41.7 / 60.4%; mixed field 59.9 / 41.0 / 48.7% (v2.42: 71.7 / 20.8 / 55.9); Hard vs Hard 43.8 / 64.6 / 41.7% (handicapped; now 51.3 / 43.1 / 55.6%, see the baseline); every faction ≥3 viable openings (4 / 4 / 4) and ≥3 viable branches (4 / 3 / 3); containment as targeted (light Contain broken 24–0 ×3, heavy wins 24–0, 24–0, 20–4); nodes in the mixed field 2 → 69%, 3 → 72%, 1 → 48%; Hard vs Greedy 96 / 92 / 87.5%, vs Default 87.5 / 79.2 / 70.8%, vs the strategy bots 53–1; Normal beats the Rifleman rush 72–0.
- **Harness finding:** 7b's field paired each branch with one opponent branch (Tech always met Contain), so its "Tech 74% / Contain 26%" was one head-to-head. On the corrected field v2.42 measures Tech 58.7%, Contain 40.1%.
- **Open (targets not met, budget spent):**
  - **The triangle is not softer:** Greedy > Turtle 100% in every faction; **Bloomhost and Axiarch Turtle now lose every game to Rush** (v2.42: 92% / 58% wins). The Turtle no longer keeps its node for free, and the Turtle bot counter-attacks on partial vision. Scripted bots make every cell a switch (0% or 100%); measuring with adaptive bots is the next step.
  - Tech branch 62.8% (target ≤60), Contain branch 35.5% (target ≥40); both slightly worse than v2.42 on the corrected field. (v2.56: Tech 58.1%, Contain 37.8%.) Axiarch Tech 77.6%; Bloomhost and Axiarch Contain 27–28%.
  - The Turtle opening is weak everywhere (29% against the field).
  - Axiarchs 60.4% in Greedy vs Greedy (0.4 over; v2.56: 62.5%); **Bloomhost 64.6% in Hard vs Hard** (handicapped; v2.56: 43.1%, and most Hard-vs-Hard matches are draws: see the baseline).
  - **Axiarch Hard vs Default 70.8%** (handicapped; v2.56: 78.1%; Last Fist now the low one at 71.9%) (target 75%): its Turtle opening fell to 58% with the node change; the opening mix moved to Boomer 2/3, and dropping the Turtle from its list is the next step (not done: it would be tuned on the validation seeds).
  - Controlled node set: Bloomhost's 3-node bot loses to its 1-node bot (3–21).
  - Easy still loses most games to the Rifleman rush (as in v2.42).
- **Tests:** new tests/polish.test.js (SIM) and tests/polish-ui.test.js (browser, both iPhone sizes, three factions). Tests that pin v2.42 mechanics now call `setMech7c(false)` (determinism, tactics' v239 replays, hardhuman's Default replays, signature, bloomhost-sig, axiarchs-sig, their UI tests, ax-abilities); ai.test.js pins the new node positions; tactics' mass test stands its target beyond the Hold radius; orders-weapons' warp test waits out the rally batch; strategy.test.js checks the 7b layer with the 7c layer off.

## Audit phase 7b: balance and the strategy triangle (v2.42)
- **Handicap note (v2.56):** the AI-vs-AI figures in this section (Hard vs Hard, Hard vs Default, Hard vs Greedy, Default vs Legacy, mirrors) were measured with an AI-played side 0 on the player's Hold stance until its first attack ("Phase 0, item 2"). They are history; the current numbers are in "Audit baseline (v2.56)".
- **Report:** audit/strategy-report.md. **Diagnosis:** audit/strategy-diagnosis.md. **Logs:** audit/logs7b/. **Tools** (audit/sim): strat.js (Rush, Turtle, Contain, Standard and Greedy openings with timing, contain, tech and air branches), stratrun.js, diag7b.js, an7b.js, trace7b.js, duelx.js, hardsearch7b.js, validate7b.js, nodes7b.js.
- **Why Last Fist won identical play:** containment. Its all-ranged army parks at the edge of the enemy HQ gun, which barely reaches the defender's own node; melee defenders at the rally flag chase out of cover and die one by one; nodes and Salvage pay for the siege. Its Tank and Flame Tank also won every open duel.
- **Changes:** numbers only, in `BALANCE7B` (`setBalance7b(false)` = v2.41): Refinery 175 / 13 s / 420 HP; HQ gun 16 / 48 / 62 by tier; Turret 150 + 40, 9 s, tougher, Maw and Null Lance harder-hitting; nodes 4 + 1.5; Rifleman 45 credits, 6.5 damage; Heavy 135 + 40; Tank 280 + 70; Flame ×0.2 against vehicles; Skitterling 66 HP; Bulwark 840 HP, 28 damage; Spitter 70 + 20, range 165. Six rounds; round 6 (Skitterling speed, Bulwark cost, Rifleman range) broke the triangle and was reverted.
- **Results:**
  - Greedy vs Greedy: LF 52.5%, BH 40%, AX 57.5% (was 97.5 / 32.5 / 20). Hard vs Hard: LF 42.5%, BH 58.8%, AX 48.8% (was 84 / 35 / 31).
  - Triangle (24 per cell): Rush > Greedy 96 / 100 / 100%, Greedy > Turtle 100% ×3, Turtle > Rush 100 / 92 / 58%.
  - Contain: a correct defender breaks a light Contain 100 / 62.5 / 87.5%; a heavy Contain with a clear lead wins 100 / 100 / 62.5%.
  - Nodes: 2 nodes held at 4:00 win 72%, 3 win 60%, 0–1 win 34–38%.
  - Signature buildings: net gains for the Salvage Yard (Greedy/Timing 8–0, Contain 6–2), Fortification Depot (Greedy/Timing 7–1), Phase Beacon (Contain 7–1).
  - Hard vs Greedy 81% (83 / 71 / 88; was 62.7%), vs Default 95 / 97.5 / 90%; it varies its opening (Last Fist Boomer, Economist, Turtle; Bloomhost Boomer, Turtle; Axiarchs Turtle, Boomer) and adapts after scouting (`adapt`, `punish` on).
- **AI changes (Hard only; Default, so Easy and Normal, has none):** `breakout` (hold deep under the HQ gun when camped on, out together at 1.4×, a pressure Turret at once), `adapt`, `punish` back on, the `flood` dial at 0.4 (Flame Tanks against lighter mixes). v2.41's Hard is the `hard241` preset.
- **Open:**
  - **Bloomhost** has only 2 viable openings and 1 viable mid-game branch in the mixed field (target 3 each); in mixed bot play Last Fist is still on top (73.8%) and Bloomhost low (23.8%).
  - The **tech branch** is too strong (74%) and the **contain branch** too weak (26%) against the field: parking next to Turrets bleeds an army, and a maxed turtle meets attacks that die on its Turrets.
  - The triangle is steep (most cells 90–100%); the Axiarch Turtle > Rush cell is narrow (58%).
  - Last Fist moved from top to bottom in Hard vs Hard (still inside 40–60%): watch in playtests.
  - Easy and Normal play the unchanged Default AI on the new numbers: against the Greedy bot unchanged (Normal 1–53, Easy 0–54, before and after); against the phase 5 Rifleman rush Normal now loses 4 of 12 per faction (was 0 of 12).
  - Proposed mechanic changes (rally point inside the HQ gun, melee Hold engage radius, the third node, signature buildings off the pad budget, Turrets scaling with the HQ, AI rebuilding) are in the report, not implemented.
- **Tests:** new tests/strategy.test.js; tests that pin v2.41 numbers for a mechanic now call `setBalance7b(false)` (ax-abilities, bloomhost-sig, fog, regression, trees, tactics' v239 replays, determinism's balance-on fingerprints, hardhuman's Default replays). Intermittent, pre-existing: tests/fog.test.js "AI siege under fog" is unseeded and failed 1 of 6 runs on v2.41's index.html too.

## Audit phase 7a: Hard against human-style play (v2.41)
- **Handicap note (v2.56):** the AI-vs-AI figures in this section (Hard vs Hard, Hard vs Default, Hard vs Greedy, Default vs Legacy, mirrors) were measured with an AI-played side 0 on the player's Hold stance until its first attack ("Phase 0, item 2"). They are history; the current numbers are in "Audit baseline (v2.56)".
- **Report:** audit/hard-vs-human-report.md. **Logs:** audit/logs7a/. **Tools** (audit/sim): greedy.js (the Greedy bot), greedyrun.js, ablate7a.js, hardsearch7a.js, validate7a.js, shield7a.js, counter7a.js, botvbot.js.
- **Greedy bot:** a scripted copy of the opening that beat v2.40 Hard:
  - three Refineries by 0:22, all at T2 by about 1:45, a node runner on all three nodes;
  - no army until 2:30 (or until attacked);
  - then a mixed army that regroups at a flag before attacking, and uses abilities.
- **v2.40 Hard vs Greedy:** 11–115 (8.7%). **v2.41 Hard vs Greedy:** 79–47 (62.7%). Last Fist 33–9, Axiarchs 25–17, Bloomhost 21–21.
- **Target missed for Bloomhost and Axiarchs (≥70%):** both lose 1–13 to a Last Fist Greedy and win 20–8 and 24–4 against the other two bot factions.
  - Greedy vs Greedy (identical play) goes Last Fist 20–0 Bloomhost and 18–2 Axiarchs. So this looks like Last Fist faction strength, an input for 7b.
  - Stopped after one round, as briefed.
- **New Hard (`AI_PRESETS.hard`):**
  - the new Boomer opening (never rolled at random) for every faction;
  - reaction 0.6 (Bloomhost 1.0), no signature building;
  - the `HARD_FIX` rules: `read`, `contest`, `counter`, `nowave`, `shield`, `power`, `fill`, `est`.
  - `punish` (a timed attack on a greedy opening) measured worse (37 vs 41 of 54) and is off.
  - v2.40's Hard is the `hard240` preset.
- **Hard vs Default:** 39–1, 40–0, 38–2. **Easy and Normal:** unchanged bit for bit (Default replays hash as v2.40, tests/hardhuman.test.js); the new rules are Hard only.
- **Hard vs Hard** (40 paired each):
  - Last Fist 34–6 Bloomhost; Last Fist 33–7 Axiarchs; Bloomhost 22–18 Axiarchs.
  - Shares: Last Fist 84%, Bloomhost 35%, Axiarchs 31% (v2.40: 85 / 6 / 59).
- **Emergency Shield** (Hard, rule on vs off): 6 casts blocking 236 each, against 20 casts blocking 115 each, at the same record. **Interceptors** against a ground-only army: 0 against 44.
- **Open:**
  - The AI has no working punish of a greedy opening; it matches the economy instead.
  - Flame and splash appear only against light-heavy armies (over 55% light).
  - The army estimate (`est`) is coarse (a fixed 40% share).
  - Rebuilding inside a lost base was not done (low priority, as briefed).
- **Tests:**
  - New: tests/hardhuman.test.js.
  - tests/bh-spire.test.js's Bloomspire coverage test names `ai: 'default'` (a general-AI test in a Hard game).
  - **Intermittent, pre-existing:** tests/redesign.test.js "P11 Worldrender" is unseeded (`loadSim()`) and fails about 1 run in 4. It failed 3 of 8 on v2.40's index.html, so it was not caused by this phase. Fix: seed it.
  - The browser test "match start: GET READY" timed out once (4 s) while a simulation was loading the CPU; it passed on two reruns.

## Audit phase 6a: AI tactics and Hard mode (v2.40)
- **Handicap note (v2.56):** the AI-vs-AI figures in this section (Hard vs Hard, Hard vs Default, Hard vs Greedy, Default vs Legacy, mirrors) were measured with an AI-played side 0 on the player's Hold stance until its first attack ("Phase 0, item 2"). They are history; the current numbers are in "Audit baseline (v2.56)".
- **Report:** audit/ai-tactics-report.md. **Tools:** audit/sim tactics.js (paired rule A/B), hardsearch.js (strategy search); run.js gained `paired`.
- **Step 0:** v2.39 merged into main. One `npm test` run then showed 348 of 349 (failing test not identified; the rerun passed 349 of 349), and main was pushed before that result was read.
- **Kept in the Default preset** (every difficulty), rule on vs off over 48 same-faction matches:
  - `engage`: fight strength in Lanchester form (damage per second × health) against the known enemy at the target, plus guns. No attack it doesn't win by 1.25×; pull back and regroup when losing locally. 29–19 against v2.39.
  - `sig`: no signature building before 5:00. The plan keeps its economy; the signature building replaces a duplicate later. 29–19.
- **Measured and left off:**
  - `mass`, `defend` (v1 21–27, v2 22–26), `finish` (v1 21–27, v2 25–23), `hold` (25–23): neutral or worse.
  - `tech` as a fixed rule: 18–30. Kept as the `tech` dial.
  - `axf` (Axiarch shield recharge, looser Mass Warp): 10–22.
- **`v239` preset:** v2.39's Default, move for move (tests/tactics.test.js).
- **Hard preset** (`AI_PRESETS.hard`; Hard games use it unless a preset is named):
  - Per faction: the Economist opening, decisions every 0.6 of the interval, no signature building; Last Fist also the Air Power Tech Lab to T3 first.
  - Searched over 768 paired matches.
  - Validation, 40 paired same-faction matches each:

  | Hard vs | Last Fist | Bloomhost | Axiarchs |
  |---|---|---|---|
  | Default | 39–1 | 39–1 | 38–2 |
  | Legacy | 40–0 | 39–1 | 39–1 |
  | v2.39's Default | 37–3 | 38–2 | 39–1 |

- **Easy and Normal:** the new Default against v2.39's at the same difficulty, 26–22 on Normal and 23–25 on Easy, so no slowing was needed (`byDiff` stays empty). The scripted rush still loses all 36 on Normal.
- **Hard vs Hard** (40 paired matches each, the input for the final balance pass):
  - Last Fist 40–0 Bloomhost; Last Fist 28–12 Axiarchs; Bloomhost 5–35 Axiarchs.
  - Faction totals: Last Fist 85%, Axiarchs 59%, Bloomhost 6%.
- **Tests:**
  - New: tests/tactics.test.js (the v239 fingerprints, presets, aiPower, engage, mass hold, sig timing).
  - Tests of the general AI in Hard games name `ai: 'default'`.
  - Tests of v2.39's early signature-building AI name `ai: 'v239'`.
  - The Turtle-deadline test checks v2.39's even-army rule on `v239`, and the Default's with an edge.

## Audit phase 5: balance pass, conservative (v2.39)
- **Handicap note (v2.56):** the AI-vs-AI figures in this section (Hard vs Hard, Hard vs Default, Hard vs Greedy, Default vs Legacy, mirrors) were measured with an AI-played side 0 on the player's Hold stance until its first attack ("Phase 0, item 2"). They are history; the current numbers are in "Audit baseline (v2.56)".
- **Diagnosis:** audit/balance-diagnosis.md.
- **Changes and results:** audit/balance-report.md.
- **Tools:** audit/sim balance.js, analyze.js, instrument.js, ab2.js, duel.js, rush.js, s3.js (audit/README.md).
- **Why Last Fist won 77.5% cross-faction** (Default vs Default, random personalities):
  - Not economy: income is even at 4:00.
  - From 4 to 8 minutes it wins the first fights and holds the middle node with ranged units, while Bloomhost and Axiarch melee armies attack it in small groups.
  - By 6:00 it fields 2–3× their army and takes the nodes; then it breaks bases (about 10,800 building damage per match against their 3,700–3,800).
  - No single Last Fist unit carries it: removing the Tank, Heavy, Gunship or Flame Tank cost at most 2 wins in 30.
- **Changes** (the `BALANCE` block; `setBalance(false)` restores v2.38): costs and build times first, then two small stat fixes, no mechanic changes.
  - **Last Fist:**
    - Tank 200/40 → 260/60 and 11 → 13 s; Heavy 100/25 → 125/35.
    - Salvage 10% → 7%, the Yard 20% → 14%.
  - **Bloomhost:**
    - Bulwark 190/40 → 150/30 and 11 → 10 s.
    - Razorwing 170/70 → 140/50 and 170 → 200 HP.
    - Spitter 90/30 → 80/25; Leaper 90/20 → 80/20.
  - **Axiarchs:**
    - Shardling 80/20 → 65/15, 6 → 5 s and 60 → 75 shields.
    - Lancer 150/60 → 120/45; Prismwing 120/50 → 100/40.
    - Wraithwing 260/120 → 230/100; Bastion 280/90 → 260/85.
- **Results** (40 matches per pairing, 30-minute cap, no true draws):

  | Faction | Cross-faction, before → after | Same-personality sets, before → after |
  |---|---|---|
  | Last Fist | 77.5% → **63.8%** | 95.3% → 82.8% |
  | Bloomhost | 32.5% → **40.0%** | 23.4% → 23.4% |
  | Axiarchs | 40.0% → **46.3%** | 31.3% → 43.8% |

  - **The target (40–60%) was not met for Last Fist after the 5 allowed rounds; stopped as the brief requires.**
  - The rest is AI skill (the Phase 6 list under Audit). Sensitivity: every Bloomhost and Axiarch unit 20% cheaper, or +15% HP and shields, moved Last Fist by only 3–4 wins in 30.
- **Phase 2 buffs measured:**
  - **Flame Tank aim:** triples or quadruples the Flame Tank's damage, but 0 and +1 wins of 40.
  - **Instant Axis beam:** about +3 Axiarch wins of 40 in both pairings, within noise.
- **Matches open at 20:00:** 10–27% of Bloomhost and Axiarch matches (v2.38). All of them end by 22:30 through the storm. The causes are AI: finishing a base, army trading.
- **Tests:**
  - **Flaky tests fixed:** the Medicopter retreat test is seeded; the Sovereign beam scene waits up to 2 s (it failed 3 runs in 20 at v2.38 too).
  - **Pinned to the mechanic's own numbers:** the Salvage and signature tests run with `setBalance(false)`; a new test pins the v2.39 values.
  - **Determinism:** pinned replays run with the balance off and match unchanged; two new fingerprints record it on.
  - **Re-targeted, with the reason in the test:** the Bloomhost Economist Worldrender test now plays an Axiarch Turtle (it beats the Last Fist Turtle before any Worldrender now); the Axiarch abilities test plays 5 matches instead of 3.

## Audit phase 4: simulation harness and AI competence (v2.38)
- **Handicap note (v2.56):** the AI-vs-AI figures in this section (Hard vs Hard, Hard vs Default, Hard vs Greedy, Default vs Legacy, mirrors) were measured with an AI-played side 0 on the player's Hold stance until its first attack ("Phase 0, item 2"). They are history; the current numbers are in "Audit baseline (v2.56)".
- **Harness** (audit/sim, audit/README.md): headless, seeded matches on the real SIM, a parallel runner with JSON and markdown summaries, a unit-usage tool and the validation script.
- **One AI brain with dials and presets:**
  - **Legacy** is v2.37's AI exactly: all five replay fingerprints pass on it unchanged.
  - **Default** is the game's AI now.
- **Spectate mode:** tap the version on the start screen.
- **Statistical AI tests** (tests/ai-stats.test.js) replace five single-seed tests.
- **Validation** (audit/validation.md: 100 Default mirrors per faction, 40 Default vs Legacy per pairing):
  - 0 crashes. 79–91% of mirror matches end before 20:00. Mirror sides are near even.
  - **Default does not clearly beat Legacy:** 149–143 overall with 68 draws; same-faction pairings 16–18, 18–8, 16–14. Logged under Audit.
- **Fixed this phase** (the v2.37 AI gaps, below under Audit): unit scores for v2.37 roles, spotters for every long gun, the Titan leash, the Voidcarrier held behind the front, Skitterling-limit planning and Razorwings, basic timing for the Riftstalker, Wraithwing and Sovereign.
  - **Also fixed:** the AI banked 4,000–7,500 credits by 20:00, energy-starved with full pads. Default spends: credit-only units when energy is short, parallel upgrades, a Refinery traded for a Reactor.
  - **Also fixed:** big path units were almost never trained. They now go to the top once, with room saved: Worldrender 45% in the Economist test (was about 2%); Leviathan 10.5% and Hydra 15.5% of Default mirror sides (Legacy: 0% and 2%).
- **Test fixes:** the flaky Mite acid-burst test (the Tank shot the Mite before it expired) now keeps the Tank passive.

## Audit phase 3b: unit redesign (v2.37)
- **Implemented per audit/unit-roster.md** (section 6 is the item-by-item record):
  - P1–P7, P9–P16 as designed; P8 became Titan Siege lock; S1 Skitterlings at half supply with a limit of 60.
  - Numbers are first-pass placeholders for Phase 5.
  - `setRedesign(false)` restores every v2.36 value and switches the mechanics off; the determinism tests use it.
- **Targeting index first:** units sorted by lane position each tick, exact checks, ties in the old order.
  - Every replay and fingerprint test passed unchanged after it, before any mechanic changed.
  - With the redesign off, the main replay still matches v2.36 exactly.
  - A new Bloomhost vs Axiarchs replay (FP_V237) pins the redesign.
- **Corrosion rule changed:** the strongest running effect applies (cap 25%), and a weaker, longer one takes over when it ends. Nothing adds up. Before, a strong short hit plus a weak long one became strong and long.
- **Tests changed:**
  - **New tests:** tests/redesign.test.js.
  - **Re-seeded for half-supply Skitterlings:**
    - Bloomhost abilities test: seed 2 → 4.
    - Bloomhost base AI test: seed 6 → 11; 3 of seeds 1–33 pass, see Audit.
  - **Bloomspire AI test:** runs with the redesign off, as it already ran on the old retreat rule.
  - **Updated to the new behaviour:** the Sovereign beam (ax-array), Leviathan stats (techlab), the Bastion surge (axiarchs, ax-trees), the overcharge-with-brace cap (ax-abilities, now on the v2.36 Bastion), and the Bilecaster as a spotted long-range unit (fog).
- **Fixed while testing:** a phased Wraithwing kept walking (it could pass its target); it now holds still.
- **Performance:** see audit/unit-roster.md section 6, PERF.

## Audit phase 2: visual and audio identity (v2.36)
- **Last Fist:** the Flame Tank lost its fireball flash; it pours a continuous flamethrower jet (a flickering tapered cone plus licks of fire that start white-hot, redden, rise and smoke at the end; `vfxFlames`, `drawFlameCones`, particle kind 4). The HQ fires an industrial cannon round (an orange tracer, a hard muzzle flash, gun smoke, a burst with debris). Other Last Fist weapons and sounds are unchanged.
- **Bloomhost:** Spitter, Bilecaster and Ruinmaw shots are wobbling acid globs on a drawn arc with trailing droplets and drips; Brood Tyrant and Worldrender drops are globs; the Maw and the Hive fire bone spines (the Hive a volley of three). Hits splat: droplets and a short-lived green stain (`bhSplat`). Sounds: wet spits and squelches, chitters for claws and spines, organic thumps for slams, lobs and the Hive.
- **Axiarchs:** Lancer, Wraithwing, Prismwing and Astral Marksman shots are laser streaks with a white core; Bastion pulses, Gravemantle and Worldbreaker shots are energy orbs with a glow and a ring; hits flash with a ring and sparks; the Null Lance now has a muzzle flash. The Axis fires a beam (violet sheath, cyan beam, white core) instead of the shared HQ rocket. Sounds: zaps, hums (beams, void and rift weapons) and a shield ping when an Axiarch shield takes a hit. Before v2.36 no Bloomhost or Axiarch weapon had a sound.
- **HQ weapon stats:** the Axis lance keeps the HQ gun's damage, rate, range and damage multipliers at every tier (`DMG.hqbeam` = `DMG.hqgun`): DPS 29.1 / 42.0 / 61.1 at T1 / T2 / T3, before and after (0% change). It now lands at once, so no shot is wasted in flight on a target that dies first. The Last Fist and Bloomhost HQs keep their SIM gun unchanged (only the look and sound changed).
- **Flame Tank off-centre bug fixed** (found in v2.31): the burst's strip is centred on the chosen target's sideways position (`FLAME.aim`; false restores v2.35). Damage, rate, range and strip width unchanged. Measured: a Tank 30, 50 or 70 to the side now takes the full burst (tests/audit2.test.js). With `FLAME.aim` false the main determinism replay is exactly v2.35's; the main fingerprint was re-recorded.
- **Sound:** Bloomhost and Axiarch weapon sounds are matched in loudness (RMS) to the Last Fist average for their priority once baked (`sndLevel`, `SND.gain`); Last Fist's own sounds are untouched; all go through `sndPlay`, so Sound off silences them. Weapon sounds share a budget of starts per second by effect quality (`SND_RATE`: 6 / 11 / 16).
- **Performance** (tests/perf.js battle, 858×396 at 2×, a mixed army of all three factions on both sides, about 93 units, `--settle=14` so the sounds have finished baking): at 1× CPU 5.1 ms script per frame (v2.35: 4.3-5.5 over three runs); at 4× CPU and full quality 34.8 and 39.1 ms (v2.35: 31.8 and 35.9), about 10% more; with auto quality 32.9 and 37.3 (v2.35: 28.0 and 34.5). With sound off both versions measured the same (33.5 vs 32.7 ms at 4×): the rest is the doubled number of weapon sounds. Flame Tank fire has its own ceiling of 80 particles inside the 300-particle effect pool (`FIRE`), and each tank's stream thins as more burn at once. Baking twice as many sounds takes about 10 s at 4× CPU after the first tap (v2.35: 5 s); sounds play live-synthesised meanwhile.
- **Small fixes:** the building panel's health and shields stay on one line (a 316-wide panel for buildings with shields; every Axiarch building checked at 858 and 667 wide). Stats, Summary and the copied log count the starting 300 credits and 60 energy, sales and Salvage as gathered (`logGathered`), so spent can't exceed gathered; a note says what's counted.
- **No seed changes were needed:** the seeded Axiarch tests still pass with the Axis beam. One Null Lance test now holds the Axis's fire, since its beam lands in the same tick.

## Audit phase 1: quick fixes (v2.35)
- **Selected building:** a pulsing gold glow on its pad and gold brackets around it while its panel is open (`drawBuildingSel`); an empty pad being built on gets the same glow. The panel header shows the name and, under it, the pad (`Pad 1`–`Pad 8` in slot order, `HQ pad`, or `West/Centre/East node` for a node bunker).
- **Costly upgrades confirm on a second tap** (`upBigAt`, `upIsBig`): the top third of a faction's upgrade costs by credits + energy, ties kept whole so no more than a third qualify. With today's costs (the same for all three factions) the cut is 400: HQ T2 and T3, War Factory role T3, Tech Lab role T2 and T3. The first tap turns the button gold ("Tap to confirm", or "Confirm · c/e" with a path picked) for 2.5 s; an upgrade you can't afford skips the confirm and shows the usual shortfall.
- **Lessons tab removed** (`logLessons`, `repLessons` deleted). **Stats** takes its place: match length, army value every 15 s as a line graph (both sides), resources gathered and spent, Salvage recovered (Last Fist sides only), and units built and lost by type for each side. Summary, Timeline and Key moments are unchanged.
- **Retreating units hold their fire** until the retreat ends (back within 12 of the rally flag, or a new order). `RETREAT.fire` true restores the v2.34 rule; the two determinism replays pinned to older versions (v2.29 with Salvage and signature buildings off, Last Fist vs Bloomhost at v2.33) run with it and still match, so nothing else in the SIM changed. The main fingerprint is unchanged (no retreating unit had a target in that match). The rule applies to the AI's units too (its default stance, feints and Artillery pull-backs use Retreat); no AI code changed.
- **Tests re-seeded for the retreat rule:** the Bloomhost AI's abilities test (seed 7 → 2: with 7 it cast no Emergency Brood). The Bloomspire AI test runs on the v2.34 rule (`RETREAT.fire` true, seed 17 as before): with the new rule the Bloomhost AI still took Apex Bloom and trained Brood Tyrants, but trained no Worldrender in 74 seeded matches (seeds 1-80 against the Turtle autoplayer, 1-8 against the Economist and Trickster, several of them 20-minute matches it won). Logged under Audit for the AI training phase.
- **Bug sweep:** no crashes, softlocks, broken inputs or wrong results found (9 faction pairings played to the end in headless Chromium at iPhone landscape size with UI input during play, plus save, reload and Resume). Non-crucial findings, not fixed: listed under Open, "Found in the v2.35 bug sweep".

## Signature buildings, batch 3 (v2.34): complete
- The Axiarchs (docs/SIGNATURE_BUILDINGS.md section 4): the Phase Beacon (role `sigA`, the BEACON block) and the Echo Reliquary (`sigB`, the ECHO block). Every faction now has both; docs/SIGNATURE_BUILDINGS.md is marked complete with a stats table and the Definition of Done check.
- Spec interpretations made in v2.34: with no units the bubble sits on the Beacon; the anchor is re-picked every second and the bubble glides to it at 90 a second; a collapse removes the bubble at once (shatter and sound) and it re-forms by growing at the anchor; the 35% is measured against what the units inside had (their current shields plus health plus what they lost in the window), counting units that die inside and ignoring units that walk out; "warping into the bubble" is the normal warp channel arriving inside it (Mass Warp arrivals don't count); the echo re-warp takes the normal 2 s warp channel with no production time; echo cost is 50% of credits and energy, rounded; an echo is stored at the Reliquary's tier at the time of death and kept by its tier's limit; recovered units' Salvage is on the 50% credits paid.
- **Fixed in v2.34: the Build tab flashed** (since v2.32). A signature-building check left `locked` undefined for every other card and `classList.toggle('locked', undefined)` flips the class instead of setting it, so every UI refresh (about 7 a second) toggled every card. Now always a boolean; the badge text is written only when it changes. Test: tests/build-tab.test.js (10 game seconds at rest, no card rebuilt or restyled, all three factions).

## Signature buildings, batch 2 (v2.33)
- Bloomhost (docs/SIGNATURE_BUILDINGS.md section 3): the Brood Mound (role `sigA`) spawns Mites (`mite`, the MOUND block) and the Rootheart (`sigB`) strengthens creep (the ROOT block). The Axiarchs can't build either role until v2.34.
- Spec interpretations made in v2.33: the first clutch comes 20 s after the Mound finishes; when a clutch would pass the cap, only as many as fit hatch (none at the cap); T3 still spawns 3 Mites; Mites lost with the Mound live out their time; Mites have their own cap (Emergency Brood's TEMP.max and Cloudwing offspring don't count them, and they don't count against those); "cannot capture nodes" means they neither take nor contest a node; the acid burst does 50% of a Mite's damage (1.2) to enemy ground units within 40 and uses its own weapon table (`miteacid`: 0 to buildings and aircraft); the Rootheart's 15% slow uses the existing slow rule (the strongest slow applies, never added up), drawn as a green ring instead of the violet one; the snare's "outer strip" is the outer 16 of the creep's union (not inside any patch shrunk by 16), the units nearest the Bloomhost HQ first, and a snared unit can't leap either; the T3 pulse's first eruption is 15 s after the Rootheart reaches T3; Repair Pulse compares against the boosted creep regen, like the Medicopter.
- Saves v29: a Bloomhost side in an older save couldn't have these roles; any stray one is dropped and its pad freed.

## Signature buildings, batch 1 (v2.32)
- Shared rules (docs/SIGNATURE_BUILDINGS.md section 1) and the Last Fist pair (section 2): the Salvage Yard (role `sigA`) and the Fortification Depot (`sigB`) with node bunkers. Bloomhost (v2.33) and Axiarchs (v2.34) can't build either role yet.
- Spec interpretations made in v2.32: "economy up" for the AI is the difficulty's Refineries finished (2 on Normal and Hard, 1 on Easy), or every Refinery its plan has if that is fewer, and it holds the building while under pressure, like tech; "Salvage over the cap isn't wasted" means it starts Overdrive (no extra credits); Overdrive ends with the Yard; a bunker heal and a Medicopter heal don't add up (the faster one applies, like the other heals); a node going neutral counts as changing owner; bunkers don't keep the HQ shield up and can't be sold, upgraded or repaired (they still self-repair like any building and Repair Pulse heals them).
- `SIG.on` false switches signature buildings off for both sides (the AI never builds them); with that and `SALVAGE.pct` 0 a match still plays exactly as v2.29 (tests/determinism.test.js).

## Resolved in v2.31 (playtest bugs)

### Warped-in units ignored Hold
- **Bug:** with the army on Hold, an Axiarch unit that warped in at the warp point walked back toward its base.
- **Cause:** Hold works by giving each unit a hold spot (`holdU`, `holdV`) when the order is given (`setStance`, `giveOrder`). A unit that appears later has none, and a unit on Hold without a spot walks to the rally flag (`updateUnit`). For a trained Last Fist or Bloomhost unit that is next to its building; for a warp-in at a forward warp point it means walking back. Mass Warp kept a hold spot only for units that already had one; Emergency Brood Skitterlings and Cloudwing offspring had the same gap.
- **Fix:** `arriveOrders` gives every unit that appears away from its own building (warp-in, Mass Warp arrival, Emergency Brood, Cloudwing offspring) the army's current orders: on Hold (stance, group or type order) it holds where it arrived. Tests: `tests/orders-weapons.test.js`.
- **Bloomhost behaviour change:** brood and offspring on Hold now hold where they land instead of walking to the rally flag (and, being melee, no longer chase on Hold). The AI never sets Hold itself, but an autoplayer side (side 0 in tests) starts on the player's default Hold until its AI first changes stance (about 3 minutes in a seeded Hard match), so an autoplayer Axiarch side's early warp-ins now wait at the warp point. Seeded Hard comparisons against v2.30 (2 seeds each): Last Fist mirror, both Bloomhost-vs-Last-Fist orders, Bloomhost vs Axiarchs and Last Fist vs Axiarchs identical to the end; Axiarchs as the autoplayer side diverge from about 2:30. Last Fist is untouched (its fingerprint is unchanged).

### Gravemantles and Eventides never attacked buildings (and walked the whole lane)
- **Bug:** they walked the lane without stopping at enemy buildings, then sat at the far end of the enemy base.
- **Cause:** their weapon table (`DMG.grav`) gave buildings 0. Targeting (`acquire`) skips any target its weapon can't hurt, so a building never stopped them, and on Attack a unit with nothing to shoot walks to the lane end. They did shoot enemy units in range (low damage, so easy to miss).
- **Fix (design change, first-pass numbers):** `grav` building 0.5, so both now target ground units and buildings (G, B), keeping the slow aura and the pull pulse. docs/AXIARCHS.md section 6 and its stats table are updated.
- **Found by the all-units check:** the **Shardstorm** had the same bug (`DMG.storm` building 0). Fixed the same way: `storm` building 0.4 (A, G, B); its chain still never jumps to a building.
- **All-units check:** every unit of all three factions now has a weapon targeting can use and stops at enemy units and buildings, except the listed non-combat units (Medicopter, Recon Drone: no weapon, they stay with the army on Hold, Attack and Retreat) and the air-only Interceptor (it escorts its own aircraft or waits behind the front, never walking off alone). Tests: `tests/orders-weapons.test.js`.

## Resolved in v2.6

### Stalemates and timeouts
- The Extinction Event (from 20:00) and the 27:00 limit end every match. v2.6, 20 matches per row: zero timeouts in the AI ladder, the same-personality ladder and every bot row; the longest match was 23:12, none ran past 26:00, and the score decided 0–3 matches per row.
- This also removes the flake in `AI vs AI match on <difficulty> plays to a finish` (`tests/sim.test.js`): the match can no longer reach 30 minutes.

## Audit
Items for the strategy explorer and full balance audit. Logged only, nothing tuned. Details are in the version sections under Open.
- **AI siege push needs 2+ Artillery or Titans** (`aiUpdate`, `nSiege >= 2`), so a War Factory AI on Assault can never push. Likely cause of Siege beating Assault 83% (v2.14).
- **Leviathan almost never trained.** The AI sits near its army size limit holding 100–300 credits, so a 7-supply unit rarely fits. Supply is the problem, not only cost (v2.15). (The limit is not a fixed 34: the HQ gives 12, each Habitat 10/16/22 by tier, up to 80.)
- **Hydra under 1% of units trained** (v2.14).
- **Recon Drones lost and retrained:** 13–21% of Support units (v2.15).
- **Hard ≈ Normal on the ladder:** 19–21 over 40 at v2.15, 18–22 at main (v2.14).
- **Test bots always take path A** (Barracks, War Factory) **and Support** (Tech Lab), so bot data never covers Mass Deployment, Assault or Air Power.
- **Tech Lab AI default paths are provisional:** Economist and Trickster on Air Power, Aggressor and Turtle on Support.
- **Default AI (v2.38) is no better than Legacy at winning** (audit/validation.md):
  - **Overall:** 51% of decided matches; same-faction pairings 47%, 69% and 53%.
  - **What doesn't decide matches:** the unit-competence fixes, spending and grouped reinforcements each measured neutral within noise over 24–48 matches. Default even leads in army value at 10 minutes (about 1,000 vs 820) and in nodes held.
  - **What looks like it does:** army trading. Both AIs attack 13–19 times a match and rebuild, so supply stays at half the limit.
  - **For Phase 6:** engagement choice (when to fight, when to fall back), concentration, and finishing a base.
- (Phase 5, v2.39: tuned within the conservative rules; see audit/balance-report.md and "Audit phase 5" above.) **Faction balance in AI play (v2.38, Phase 5):** in Default vs Legacy, Last Fist beats Bloomhost and the Axiarchs about 88% of decided matches either way round, and the Axiarchs win only 9–32% against the other factions. Mirror draws: Bloomhost 22% and Axiarchs 21% reach 20:00 (Last Fist 9%).
- **For the final balance pass (from Phase 6a, audit/ai-tactics-report.md):**
  - **Hard vs Hard:** Last Fist 85%, Axiarchs 59%, Bloomhost 6%. The v2.39 Last Fist cuts are not overshot; Bloomhost is the faction in trouble.
  - **The Last Fist Aggressor's early push** beats the other factions' Aggressors 22–2 and 23–1 against every AI defence tried. It looks like the Rifleman vs Shardling/Skitterling exchange and two-Barracks throughput.
  - **Signature buildings** are worth less than the Refinery or Reactor slot they cost, for all three factions: the Hard search won more without them.
  - **The Economist opening dominates for all three factions** (85–90% against the Default field; the other openings 10–70%). Openings and node choices need numbers that make them viable (report: verdict on strategic variety).
- (Phase 6a, v2.40: addressed as below. Engagement choice and signature timing are fixed in the Default AI. Early-push defence, finishing, faction mechanics and massing were tried and measured neutral or worse; see audit/ai-tactics-report.md.) **Phase 6 (AI training): AI skill problems found in the Phase 5 diagnosis** (audit/balance-diagnosis.md). Not compensated with stat buffs:
  - **Piecemeal melee attacks into a ranged line (the main cause of the faction gap).** Bloomhost and Axiarch armies attack a Last Fist line holding the middle node in groups of 5–11 and die to it. In the traced Last Fist vs Bloomhost match (seed 50010), Bloomhost lost 40 units to Last Fist's 15 by 6:00. Their own HQ gun is their biggest damage dealer (about 6,000 per match). Cost and stat sensitivity runs confirm it: every Bloomhost and Axiarch unit 20% cheaper, or with 15% more HP and shields, moved Last Fist by only 3–4 wins of 30. Needs: concentration and engagement choice, especially for melee armies.
  - **Signature buildings hurt every AI.** Switched off (paired, 40 matches): Last Fist +6 wins, Bloomhost +10, the Axiarchs +6. The plan gives up a second Refinery or Reactor for one and builds it at 0:30–1:00 (`aiPlanWith`, `sigReady`).
  - **Commander abilities:**
    - Switched off, Last Fist gains 4 wins and Bloomhost 4; the Axiarchs lose 4.
    - Mass Warp is cast 0.01 times a match and Emergency Brood 0.33.
    - Last Fist's two Orbital Strikes a match (300 credits and 300 energy) seem to be worth less than the army they replace.
  - **Finishing a base:** at 19:00 in about half of the matches still open, the leading side has 1,500–3,800 army value, 25–34 supply and all three nodes against an empty enemy army, and still doesn't win before the storm.
  - **Rebuilding inside a lost base:** a Bloomhost AI rebuilt its Hatchery 13 times in a minute while its base fell (seed 50010, 6:30–7:00).
  - **Composition:**
    - The Default AI keeps Razorwings "always in the mix" (`aiSmartScores`): 20% of Bloomhost spending, even against Rifle and Heavy armies that shoot them down.
    - The Axiarch AI spends 44% on Shardlings.
  - **Axiarch power field:** the AI never sets a forward warp point and almost never casts Mass Warp. Its armies fight in the open, away from the field's shield regen.
  - **S3, bomber supply:** lowering it (Leviathan 6, Worldrender 7, Sovereign 7) changed no side's choice in 96 Economist matches. The AI never reaches the Bloomhost and Axiarch bombers' T3 before a match ends. Kept at 7, 8 and 9; re-check after the upgrade order is fixed.
  - **T3 capstones:** `AI_UPG` puts the Tech Lab role's T3 16th of 20, so the Worldrender (3.5% of Bloomhost sides), Cloudwing (2.8%) and Sovereign (0.7%) come at about the time matches end. Proposal: keep them late-game luxuries and fix the order in Phase 6.
  - **The scripted Rifleman rush** (tests/bots.js `rushBot`) wins 0 of 36 against the Default AI on Normal and on Hard (all three factions); on Easy only against Bloomhost (7 of 12 at v2.39, late wins). The v2.8 calibration predates the Default AI. Recalibrate the bot before using it to judge rush strength.
- **Units under 5% in Default mirrors:**
  - **Astral Sovereign (0%):** it needs the Celestial Array's Ascendant path at T3, which only the Economist and Trickster take, and matches end at about 13 minutes.
  - **Worldrender (2.5%):** the same reason. It reaches 45% when an Economist plays a long match (tests/ai-stats).
- **AI and the v2.37 unit redesign** (v2.38: the Default preset fixes the items marked fixed; Legacy keeps them). Gaps:
  - (Fixed in Default, v2.38.) **Unit scores still reflect the old roles.** The Bilecaster is scored as anti-light splash, though it is now a single-target marker. The Rift Mortar and Bile Lobber are scored as plain artillery. The Lancer's focus, the Wraithwing's phase and the Voidcarrier's field aren't valued at all.
  - (Fixed in Default, v2.38.) **Titans:** they plant and unplant on their own and the AI's pushes and retreats drive them. But the AI brings no spotter for the planted 280 reach (beyond the Titan's 240 sight), and its siege push spacing doesn't know Titans stop to plant.
  - (Fixed in Default, v2.38.) **Voidcarrier:** the AI never positions it. Warp-ins follow the frontmost field automatically, so an AI carrier deep in enemy ground can pull warp-ins into danger.
  - (Fixed in Default, v2.38.) **No timing play:** the Riftstalker (hit and fade), Wraithwing (phase) and Sovereign (charge) use only their automatic behaviour.
  - (Default v2.38: Razorwings in 57.5% of mirror sides; 35–40% when a Turtle builds its Bloomspire last.) **Bloomhost AI rarely trains Razorwings now:** with half-supply Skitterlings, only 3 of 33 seeded Hard matches (Turtle vs a Last Fist Aggressor) trained all three base units; most never trained a Razorwing.
  - (Fixed in Default, v2.38.) **Skitterling limit:** the AI doesn't plan its army around the 60 limit; it just stops choosing them at the limit.
- (Default v2.38: 45% of Economist matches, 2.5% of mirror sides.) **Bloomhost AI never trains a Worldrender under the v2.35 retreat rule** (0 of 74 seeded Hard matches; with v2.34's rule 1 of 42 seeds did at v2.32). Check in the AI training phase whether supply or the retreat change keeps it out (AI coverage).
- **Bot rows from v2.13–v2.14 are not comparable with later rows** (the bots never upgraded before the v2.15 fix).
- **Orbital Strike now hits aircraft (v2.16)** with the same 280/140 damage, HQ T2 unlock, cost and cooldown. Unmeasured: its effect on air armies (a Gunship has 230 HP and dies at the centre; a Leviathan has 1400).
- **Orbital Strike unlocks at HQ T2 instead of a War Factory (v2.16).** The AI's other personalities reach HQ T2 through their normal upgrade order; when, and how that changes their Strike use, is unmeasured.
- **The Aggressor against a fortified enemy (v2.16):** it now upgrades its HQ to T2 at once (for the Strike) and still builds a War Factory early (for Tanks). Without the early War Factory, defence strikes fell from 19 to 8–11 of 24 diagnostic matches (Hard Aggressor vs Hard Turtle autoplayer); with both, 17 of 24. Not tuned.
- **Tech Lab needs only a Barracks (v2.16):** in the 4-match smoke test the AI's first Tech Lab finished at 2:25–3:00. Earlier Gunships and Tech Lab paths are unmeasured.
- **Bloomhost first-pass numbers (v2.17)** are copies or ratio-matched versions of Last Fist's (table in docs/BLOOMHOST.md). Nothing measured: Skitterling melee and swarm bonus, Bulwark brace, Razorwing, the Maw's shorter range, and the AI's Bloomhost unit scores (copied from their Last Fist counterparts; personality tastes read through `AI_TWIN`).
- **Bloomhost has no mobile anti-air yet (v2.17):** Skitterling, Bulwark and Razorwing are ground-only, as the design doc describes them; only the Maw and the Hive hit aircraft. Check once the trees (v2.19, v2.21) are in.
- **Melee chase (v2.17):** melee units walk toward any enemy they can see within 150 (Razorwing 200) instead of only along their lane. Watch whether this lures swarms into Turrets or splits armies.
- **Creep numbers (v2.18)** are first guesses (table in docs/BLOOMHOST.md): radii 260 / 110 / 150, growth 6/s (×2 at nodes), recede 9/s, +20% speed, 1.5%/s regen after 5 s out of combat. The AI doesn't plan around creep yet (no AI changes this batch).
- **Bloomhost tree units (v2.19)** are first-pass numbers (table in docs/BLOOMHOST.md), with simple AI scores. Unmeasured: Leaper leap range and cooldown, corrosion levels and the 25% cap, Thornback retaliation (Last Fist has almost no melee, so it mostly matters in mirrors), the Dreadthorn burst trigger, Ruinmaw acid pools, and the AI's path translation (Specialists → Acidic, Mass Deployment → Predatory, Siege → Siege, Assault → Predator).
- **Bloomhost commander abilities (v2.20)** are first-pass numbers copied from their Last Fist counterparts (table in docs/BLOOMHOST.md). Unmeasured: Frenzy Bloom's +30% speed and +35% attack speed, Emergency Brood's 5 Skitterlings for 20 s (cap 8), Corrosive Bloom's 14 damage/s and 15% corrosion for 8 s, and the AI's timing through the Last Fist logic. In one Hard match the Bloomhost AI never cast Emergency Brood.
- **Bloomspire tree (v2.21)** is first-pass numbers (table in docs/BLOOMHOST.md). Unmeasured: the Needlewing pack bonus, Cloudwing offspring (2 every 14 s, 12 s, half damage, cap 6), the Brood Tyrant's and Worldrender's building damage, and the AI's "train each new Bloomspire unit once" rule.
- **The AI rarely reaches Bloomspire T3 (v2.21):** T3 Tech Lab/Bloomspire comes late in the shared upgrade order (`AI_UPG`). In the seed search for the AI test (Hard autoplayer Turtle vs a Bloomhost AI, 20 matches across all four personalities, then 26 more Turtle and Aggressor matches), the 4 matches that took Swarm Bloom never reached T3, so no Cloudwings were trained naturally. The Economist reached Apex T3 in 3 of 5. The Aggressor took a Bloomspire path in none of its 18 matches, the Turtle in 4 of 18.
- **AI training: the Bloomhost AI never casts Emergency Brood in normal matches (v2.22).** It picks Brood targets with the Repair Pulse's logic (damaged units or buildings), so it rarely finds a reason to cast. Neither v2.20 SIM match had a Brood cast; only the hand-picked seeded test match (seed 4, Turtle) shows one.
- **AI training: the Bloomhost AI rarely reaches production T3 (v2.22)**, so Cloudwings and other T3 units (Ravager, Bilecaster, Ruinmaw, Dreadthorn, Worldrender) are rarely trained. See the v2.21 Bloomspire T3 item. Even with a ready T3 Apex Bloomspire and 6,000 credits and energy, 3 of 40 seeded 90-second runs trained only one of the two Apex units, with Skitterlings filling the supply first (found at v2.22; the test now uses a fixed seed).
- **AI training: run an AI content coverage check** that every Bloomhost unit, ability and path is used by the AI at least once.
- **Before the App Store: run a Bloomhost performance check**, both in the early game and on a late-game save with large armies (creep, Cloudwing offspring and many units). The only measurement so far is one throttled run at v2.18.

- **Mass Deployment near the top of its win range** (58.8%, target 40–60%); **Riflemen about 37% of unit spending** (target about 35%) (v2.13).
- **Axiarch first-pass numbers (v2.25)** are ratio-matched against Last Fist (table in docs/AXIARCHS.md). Nothing has been measured: the shield values and regen rate (10%/s after 4 s), buildings at 80% HP plus 30% shields, no HP self-repair for Axiarch buildings, the Null Lance's three tiers, and the three base units' costs. The AI scores read through the Last Fist counterparts.
- **Axiarch AI and Null Lances (v2.25):** the AI builds Null Lances by the unchanged Turret rules. In the seeded 10-minute test (one match per personality) only the Turtle built one, as with Last Fist's Turrets.
- **Axiarch power field and warp-in numbers (v2.26)** are first guesses (table in docs/AXIARCHS.md): base field 230 (+40 per Spire, up to 400), node field 140, growth 7/s, recede 10/s, shield regen inside the field 25%/s, a 2 s warp channel. Unmeasured: how much the faster regen and forward warp-in at a held node are worth.
- **Axiarch tree units (v2.27)** are first-pass numbers (table in docs/AXIARCHS.md). Unmeasured: phase-step ranges and cooldowns, disrupt (30% for 2 s), the Marksman's 1.2 s charge, distortion zones sharing the acid-pool cap with Ruinmaw pools, the Gravemantle's 30% slow, and the Eventide pull (40 every 14 s). In a few seeded Hard matches the AI trained Lancers, Rift Mortars, Marksmen, Riftstalkers and Parallaxes, but no Gravemantles or Eventides even when on Dominion. v2.28: the AI now trains each path unit once (the Bloomspire rule on every Axiarch production path); with a prepared T3 Dominion Architectum it trains both. How often it reaches them in normal matches is unmeasured.
- **Axiarch commander abilities (v2.28)** are first-pass numbers (table in docs/AXIARCHS.md); costs, cooldowns and unlocks copied from Last Fist. Unmeasured: Mass Warp (8 units, 2 s channel; it rescues the most damaged first), Shield Overcharge (30%/s shield regen even under fire, 25% damage cut, 50% cap with the Bastion's brace, 7 s), the Purification Beam (240 damage along a 220 × 80 strip over 1.5 s after a 3 s warning; no aircraft).
- **AI training: the Axiarch AI rarely casts Mass Warp (v2.28).** Its rule (4 or more of its units below 40% health within the circle of one of them, at least 200 from the warp point) never came up in three seeded Hard matches (Turtle, Aggressor, Economist vs the Turtle autoplayer; 6 Overcharges and 1 Beam between them) or in the v2.28 SIM match (3 Overcharges, 2 Beams). Shields fall first and units below 40% health die quickly. The test casts it in a prepared scene.
- **Celestial Array tree (v2.29)** is first-pass numbers (table in docs/AXIARCHS.md). Unmeasured: the Prismwing shield link (half of its shield damage over up to 3 others within 110), the Shardstorm chain (3 jumps, ×0.7 each, within 90), the Voidcarrier's and Astral Sovereign's building damage (1.6× and 2.1×) and the Sovereign's 9 supply, and the AI's path mapping (Air Power → Ascendant, Support → Swarm). The AI trains all four in prepared scenes; how often it reaches the Celestial Array's T3 in normal matches is unmeasured (compare the Bloomspire T3 item).
- **Salvage (v2.30)** is first-pass numbers (the SALVAGE block, docs/LASTFIST.md): 10% of a dead unit's credit cost within 200 of any Last Fist unit or building, at most 200 credits per side per game minute. Unmeasured: what it is worth per matchup (in the v2.30 SIM match, Hard Last Fist vs Hard Bloomhost, Last Fist salvaged 571 credits over 7:32, about 6% of the 9,943 it earned from income); how often the cap binds; whether cheap Riflemen dying in their own lines pay back too much; the Last Fist mirror, where both sides salvage the same fight. The AI does not plan around it (no AI changes).
- **Seeded tests re-picked for Salvage (v2.30):** Salvage changes Last Fist play, so two hand-picked Bloomhost-vs-Last-Fist seeds no longer hit their scene. `the Bloomhost AI casts all three ...` (`tests/bh-abilities.test.js`) moved from seed 4 to 1 (10 of the first 30 seeds cast all three); `... picks a Bloomspire path ... and trains its units` (`tests/bh-spire.test.js`) from seed 3 to 23 (4 of 38 seeds trained a Worldrender, which fits the Bloomspire T3 item above).
- **Building damage for the Gravemantle, Eventide and Shardstorm (v2.31)** is first-pass: weapon tables `grav` building 0.5 and `storm` building 0.4 (they were 0, so they ignored buildings). Unmeasured.
- **Signature buildings, Last Fist (v2.32, docs/SIGNATURE_BUILDINGS.md)** are first-pass numbers from the spec, in the YARD and BUNKER blocks: Salvage Yard 20% (T1), cap ×2 plus energy worth half the credits (T2), Overdrive +25% production for 20 s on overflow (T3); node bunkers at half a T1 Turret (450 HP, 6 damage every 0.45 s, 250 range, ground only), ×2 damage and anti-air at Depot T3, a 2%/s heal on Barracks units from T2, a 45 s rebuild. Cost, build time, HP and upgrade costs copy the Barracks. Unmeasured: all of it. In the v2.32 SIM match (Hard Turtle Last Fist vs Hard Aggressor Bloomhost, Last Fist won at 13:33) the Depot went up at 0:29 and reached T3; 5 bunkers were placed (at most 3 at once) and healed 518 HP; Salvage brought 1,195 credits without a Yard. An earlier development run (Trickster, Yard to T2) salvaged 993 credits and 299 energy by 8:25. No Overdrive has happened in a match yet.
- **The signature building in the AI's build plan (v2.32):** it replaces the plan's last duplicate (a second Refinery, Reactor, Barracks or Turret; `aiPlanWith`), so every plan keeps every building type it had, the Tech Lab included. One unseeded 12-minute Hard Last Fist mirror per personality: a Tech Lab by 12:00 for 3 of 4 personalities, the same as with signature buildings off (the Aggressor builds none in 12 minutes either way). Where the plan gave up its second Refinery (Aggressor, Turtle) the trigger is its one planned Refinery, so they build it at about 0:30, the others at about 0:47. Unmeasured: what the lost duplicate costs each personality.
- **Seeded test re-picked for the signature buildings (v2.32):** the Last Fist autoplayer now builds its signature building, so `... picks a Bloomspire path ... and trains its units` (`tests/bh-spire.test.js`) moved from seed 23 to 42: seed 23's match now ends at 9:15 (a Bloomhost win) before any Worldrender; only seed 42 of 1-42 trains one (the Bloomspire T3 item above).
- **AI training: the Last Fist Turtle builds its Fortification Depot at about 0:29** because its plan gave up its second Refinery for it (`aiPlanWith` replaces the last duplicate; the trigger then needs only the one Refinery left). The design intent is that the Depot replaces Turrets, not economy. Review at AI training.
- **AI training: the Last Fist Aggressor builds no Tech Lab in 12 minutes**, with or without signature buildings (v2.32 check, one Hard mirror each way), leaving it without air or anti-air support. Review at AI training.
- **Salvage Yard strength (v2.32):** in a v2.32 development SIM match, Last Fist (Trickster) built the Yard at 1:08, salvaged 993 credits and 299 energy, and won at 8:25. Check the Yard plus early aggression for a dominant strategy.
- **Bloomhost signature buildings (v2.33)** are first-pass numbers from the spec, in the MOUND and ROOT blocks: Mites (24 HP, 2.4 damage every 0.5 s, speed 62, 30 s life, 2 per 20 s at T1, 3 at T2, at most 10), the T3 acid burst (1.2 damage within 40, ground units only), Rootheart creep ×1.5 growth and reach, a 15% slow on enemy ground units on creep, T2 regen ×1.5 (2.25%/s), the T3 snare (every 15 s, 1 s, at most 5, 10 s immunity, outer 16). Unmeasured: all of it. The acid burst is tiny by the spec (1.2 damage). In the v2.33 SIM matches: Bloomhost (Turtle) built the Rootheart at 0:28, reached T2, and lost to Last Fist at 16:03; Bloomhost (Aggressor) built the Brood Mound at 1:17 (T1), hatched 32 Mites (27 killed, 5 expired), and lost at 8:03; neither reached T3, so no burst or snare happened in a match.
- **Seeded tests re-picked for the Bloomhost signature buildings (v2.33):** the Bloomhost AI now builds its own, so three seeded Bloomhost matches no longer hit their scene (each still ends normally, with no error): `the Bloomhost AI casts all three ...` (`tests/bh-abilities.test.js`) seed 1 → 7 (no Corrosive Bloom with seed 1); `... picks a Bloomspire path ... and trains its units` (`tests/bh-spire.test.js`) seed 42 → 17 (no Worldrender with seed 42); `one Hard match, Bloomhost (Turtle) against Last Fist ...` (`tests/bloomhost.test.js`) seed 77 → 6 (with seed 77 it took Swarm Bloom and trained no Razorwing).
- **AI training: the Bloomhost Turtle builds its Rootheart at about 0:28**, the same early-trigger pattern as the Last Fist Turtle's Depot (its plan gave up a Goremound for it). Review at AI training.
- **Is the T3 Brood Mound worth buying? (v2.33)** T3 adds only the acid burst (1.2 damage, radius 40) and spawns the same 3 Mites as T2.
- **Last Fist beat Bloomhost in both v2.33 SIM matches** (16:03 and 8:03, one Hard match each with the Rootheart and the Brood Mound). Check the matchup.
- **The acid burst and the root snare have only been seen in tests and staged screenshots (v2.33)**, never in a real match: neither v2.33 SIM match reached T3.
- **Scene tests that depend on rare AI behaviour keep needing re-seeds** (`tests/bh-abilities.test.js`, `tests/bh-spire.test.js`, `tests/bloomhost.test.js`: re-seeded at v2.30, v2.32 and v2.33). Consider staged setups instead.
- **Axiarch signature buildings (v2.34)** are first-pass numbers from the spec (BEACON, ECHO). Unmeasured. In the v2.34 SIM matches: the Axiarch Aggressor built the Phase Beacon at 0:29 (T1 only); the bubble collapsed 28 times and was up only 49% of the match; Bloomhost won at 15:14. The Axiarch Turtle built the Echo Reliquary at 0:28, reached T3 and re-warped 31 echoes (never more than 1 stored: it spends each at once); the Axiarchs won at 19:19. Check whether the collapse rule (35% within 5 s) is far too easy to trip at the front, and the echo economy.
- **Seeded test re-picked for the Axiarch signature buildings (v2.34):** `the minimal AI plays the Axiarchs with each personality ...` (`tests/axiarchs.test.js`): the Aggressor's seed 1 → 2. With its Phase Beacon up at 0:28, seed 1's match changed: the Last Fist side destroyed its Architectum before it trained anything but Shardlings in 10 minutes (no error; the match plays on normally).
- **AI training: the Axiarch Aggressor and Turtle build their signature building at about 0:29**, the same early pattern as the other factions' Turtles (their plan gave up a duplicate Matter Loom).
- **The Beacon bubble in fog and on the minimap (v2.34):** an enemy bubble is remembered like any field patch where last seen; while it moves out of view the remembered one stays where it was last seen.
- **Mites in the match log (v2.33):** killed Mites count as units lost (and kills for the enemy) and appear in the timeline like Emergency Brood's Skitterlings; a Mound's steady clutches can lengthen the log. Expired ones are not counted.
- **Node bunkers in the score and the log (v2.32):** bunkers are buildings, so their HP counts in the tie-break score (`sideScore`) and a lost bunker gives a "Node Bunker destroyed" toast and a match-log line, including when a node changes hands.

### Axiarchs summary (v2.29)
Every Axiarch item for the audit and AI training, in one place (details in the Audit entries above and docs/AXIARCHS.md):
- **Numbers to audit (all first-pass, untuned):** buildings at 80% HP plus 30% shields, unit shields and their regen, the Null Lance's three tiers and the three base units (v2.25); the power field and warp-in (v2.26); the Genesis Gate and Architectum tree units with disrupt, slow, the Marksman's charge, distortion zones and the Eventide pull (v2.27); commander abilities (v2.28); the Celestial Array tree with the shield link and chain beam (v2.29).
- **Matchups to measure:** elite expensive units against Last Fist's combined arms and Bloomhost's swarms; whether shields plus field regen outweigh attrition; forward warp-in at held nodes; the Shardstorm and Lancer as the main mobile anti-air beside the Wraithwing.
- **AI:** the minimal AI only. Path mapping from Last Fist tastes (v2.27, v2.29); the "train each path unit once" rule (v2.28); Null Lances only by the Turret rules (only the Turtle builds them); Mass Warp almost never cast in normal matches (v2.28); production T3 rarely reached; the AI never sets a warp point; run an AI content coverage check that every Axiarch unit, ability and path is used at least once. The Axiarch AI quality pass is part of AI training.
- **Performance:** no measurement yet. Check the early game and a late-game save with large armies (field, shields, warps, chain beams) before the App Store.
- **Interface notes:** Axiarch weapons have no sounds of their own yet: most are silent, and the Bastion's shot (weapon `pulse`) borrows the Repair Pulse sound by name. The warp shimmer and the ability sounds play.

### Bloomhost summary (v2.22)
Every Bloomhost item for the audit and AI training, in one place (details in the Audit entries above, the Open sections below and docs/BLOOMHOST.md):
- **Numbers to audit (all first-pass, untuned):** base units and the Maw (v2.17), creep (v2.18), the Larva Pit and Evolution Chamber tree units with corrosion and acid pools (v2.19), commander abilities (v2.20), the Bloomspire tree with Cloudwing offspring (v2.21).
- **Matchups to measure (amendment C, section 8G):** whether melee units reach ranged targets, the swarm bonuses, splash against swarms, and creep's value.
- **Anti-air:** Spitters and Razorwings (amendment F, v2.19). Check this once the matchup tests are run.
- **Melee chase (v2.17):** check whether it lures swarms into Turrets or splits armies.
- **AI:** the path mapping from Last Fist tastes (v2.19, v2.21); the "train each new Bloomspire unit once" rule (v2.21); Emergency Brood unused; production T3 rarely reached; the content coverage check. The Bloomhost AI pass (amendment D batch 6) moved to the AI training phase.
- **Performance:** the early-game and late-game check before the App Store.
- **Interface notes:** Bloomhost attacks are silent (v2.17); remembered enemy creep has a hard edge (v2.18).

## Open

### Found in the v2.35 bug sweep (non-crucial, not fixed)
- (Fixed in v2.36: the Axiarch panel health text wrapping, and credits spent exceeding gathered.)
- **Army value samples stop at 120** (30 minutes, `logTick`); a longer match's graph ends early. Matches end by the Extinction Event's limit, so this shouldn't show in practice.


### (Resolved in v2.39: that part of the test runs on its own seeded SIM.) Flaky test: a Medicopter on Retreat (seen at v2.38)
- `every combat unit stops to fight ...` (tests/orders-weapons.test.js) is unseeded. About 1 run in 12, a Medicopter on Retreat ends up 40+ ahead of the retreating Riflemen it follows (it lags their centre as they run home).
- No AI code is involved. Fix: seed it, or measure against the infantry's centre.
- v2.39: 2 of 120 seeds failed: after the retreat the Medicopter settles about 60 ahead of the Rifleman (a steady hover over the infantry, not a lag). Seeded (mulberry 7).

### (Resolved in v2.38: the statistical tests in tests/ai-stats.test.js replace it.) Flaky test: the Aggressor's defence strike (seen at v2.29)
- `the AI uses abilities under the same rules ... each personality in its own way` (`tests/abilities.test.js`) is unseeded: it plays 3 random Last Fist matches per personality and needs at least one Aggressor Orbital Strike on defences. It failed once in a v2.29 `npm test` run, then passed 3 of 3 on v2.29 and 3 of 3 on v2.28. Last Fist play is identical between the two versions, so the change didn't cause it. Fix: seed it, or count over more matches.

### Creep: interface notes (v2.18)
- **Frame time with creep (one run each, 4× CPU throttle, Bloomhost vs Last Fist, both Hard AI):** first 2 game minutes 5.87 ms mean script time per frame, p95 11.2 (v2.17: 5.5, p95 9.5); minute 3 8.2 ms mean, p95 23.1 (no v2.17 figure for minute 3). A first v2.18 build that repainted the creep layer up to twice a second measured 6.8 ms mean and p95 19.7 over 3 minutes; it now repaints at most once a second. Single runs: not separated from noise.
- **Remembered enemy creep ends in a hard vertical edge** where the player's seen ground ends (it is clipped to seen fog cells, like the pad rule).
- **Fixed in v2.18:** Skitterlings, Bulwarks and Razorwings were missing from the Army tab's Infantry, Armor and Air groups and type names (v2.17), so group orders skipped them.

### Bloomhost framework: interface notes (v2.17)
- **The how-to text on the start screen is hidden on screens 440 points tall or less** (most phones in landscape), so Difficulty, You, Opponent and Start fit without scrolling. The same tips remain in the long-press card info.
- **The enemy HQ starts as a neutral "?" marker in every match** (Last Fist too) until it is first seen; before v2.17 its art showed from the start. Needed so the enemy's faction can't be read off its HQ.
- **Enemy pads are hidden until their ground has been in view**, for the same reason.
- **Bloomhost attacks are silent for now:** melee hits and the Maw's spines have no sound yet (only their flashes).

### Tech Lab tree: numbers for the later balance and AI audit (v2.15)
v2.15 was implementation only: no tuning, minimal AI. Measured, not tuned:
- **Forced-path matrix** (Hard, each personality against itself, one side on Air Power, the other on Support, 40 matches each, zero timeouts, longest 23:01). Air Power beat Support 96–64 overall (60%). Per personality, Air Power–Support: Aggressor 18–22, Economist 33–7, Trickster 22–18, Turtle 23–17.
  - The matrix ran on a build where the Leviathan and Recon Drone flew higher (z 118–130 and 130–145). Only their look changed before the push (z 88–98 and 104–114, so they stay below the top bar), plus shot travel time to them.
- **Leviathans are almost never trained** (0% of units everywhere). The AI keeps about 100–300 credits and an army near its limit, so a 480/240, 7-pop unit seldom fits; cheaper units win the scoring every time.
- **Recon Drones are lost and replaced often:** 13–21% of Support units by count (Economist 21%), 11–19% by value. That's despite the cap of 3 and waiting just behind the front, so the AI retrains them as they fall.
- **Medicopters:** 1–7% by value on Support. The AI trains one per 8 infantry, once it has 6.
- **Units trained, share by value** (per personality: Aggressor, Economist, Trickster, Turtle):
  - On Air Power: Interceptors 0%, 12%, 10%, 6%; Leviathans 0%.
  - On Support: Medicopters 0%, 1%, 7%, 2%; Recon Drones 0%, 19%, 11%, 12%.
  - The Aggressor never reached its Tech Lab upgrade before its matches ended.
- **The AI's Tech Lab defaults were chosen in v2.15 (not decided by design):**
  - Economist and Trickster on Air Power (both favour aircraft);
  - Aggressor on Support (Medicopters for its infantry);
  - Turtle on Support (keeps Nanoweave, which it had before trees).
- **Ladder sanity check:**
  - Easy lost 0–20 to Normal and 0–20 to Hard.
  - Normal vs Hard was 7–13 over 20 matches and 19–21 over 40 (main v2.14: 18–22 over 40).
  - Bot rows, v2.15 against main, both with the fixed bots: calibrated:normal 7–13 vs 8–12, calibrated:hard 2–18 vs 2–18, turtle:normal 1–19 vs 0–20, eco:normal 7–13 vs 9–11, eco:hard 9–11 vs 5–15.
  - Zero timeouts throughout.
- **Test bots fixed in v2.15:** `tests/bots.js` called `tryUpgrade` without a path. Since v2.13 its bots never upgraded a Barracks or War Factory, and they held money for the failed upgrade. They now take path A, and Support for the Tech Lab (what they had before trees). Bot rows from v2.13–v2.14 are therefore not comparable with later ones.
- **For the audit:**
  - the AI's economy and army limit against expensive units (Leviathan, Hydra);
  - Recon Drone losses;
  - Air Power at 60%;
  - the default paths;
  - Nanoweave on Support (watch whether a second Tech Lab becomes mandatory).

### War Factory tree: numbers for the later balance and AI audit (v2.14)
v2.14 was implementation only: no tuning, and the AI got minimal path support. Measured, not tuned:
- **Forced-path matrix** (Hard, each personality against itself, one side forced onto Siege and the other onto Assault, 40 matches each, zero timeouts, longest 23:09). Siege beat Assault 133–27 overall (83%). Per personality, Siege–Assault: Aggressor 23–17, Economist 38–2, Trickster 35–5, Turtle 37–3.
- **Likely main cause: the AI's base-attack logic.** The AI only launches a siege push with at least 2 Artillery or Titans (`aiUpdate`, strategy section: `nSiege >= 2`), so an Assault AI never sieges. It has to win field fights or wait for the late all-in.
- **Units trained, share by value** (per personality: Aggressor, Economist, Trickster, Turtle):
  - On Assault: Flame Tanks 6%, 6%, 16%, 6%; Hydras 0–1%. Hydras are rare at T3 (360/140).
  - On Siege: Artillery 2%, 9%, 11%, 10%; Titans 0%, 5%, 1%, 9%.
  - Riflemen: 47–48% for the Aggressor (both paths), 9–27% for the others.
- **Ladder sanity check:**
  - Easy lost 0–20 to Normal and 0–20 to Hard.
  - Normal vs Hard was 13–27 over 40 matches (main v2.13: 15–25).
  - The calibrated Rifleman rush won 9 of 20 on Normal (main: 16 of 40) and 1 of 20 on Hard.
  - Turtle and Eco bots lost 0–20.
  - Zero timeouts throughout.
- **For the audit:**
  - let an Assault AI siege with Flame Tanks and Hydras (or count Tanks), or add path-aware attack rules;
  - Hydra cost and T3 timing;
  - the default paths (Aggressor and Trickster on Assault);
  - re-check the Barracks matrix (Mass vs Specialists) now that Flame Tanks exist.

### Upgrade trees: re-check after the War Factory and Tech Lab trees (v2.13)
- **Mass Deployment sits near the top of the range.** In the forced-path matrix (Hard, each personality against itself, 40 matches each, 160 in total), Mass Deployment beat Specialists 94–66: a 58.8% win rate, inside the 40–60% target. Per personality (information only): Aggressor 24–16, Economist 17–23, Trickster 27–13, Turtle 26–14 for Mass.
- **Riflemen are about 37% of credits spent on units,** pooled over both paths, against a target of about 35%. That's about 50% on the Mass path alone, and 26% on main before trees. The figure is an estimate converted from value shares, weighting personalities equally.
- Accepted for v2.13. Re-check both numbers once Flame Tanks (a hard counter to massed infantry) and the Tech Lab tree land.

### Long matches run past 80 timeline lines per side (v2.10)
- Since v2.10 a build or upgrade and its finish share one line, which brought typical matches to 63–76 lines per side (median 72 over 8 AI matches). Long matches (14–22 minutes) still reach 85–156 lines, because key events are never merged or cut.

### Normal holds the calibrated Rifleman rush a little less often (v2.8)
- With one shared ability cooldown, AI Normal beats the calibrated rush in 61 of 100 matches (ladder 60 plus the per-personality rows 40), against 68 of 100 in v2.7. The gap is within about two standard deviations, so it may be noise; Easy, Normal and Hard keep their order (Normal vs Hard: 24–36 over 60, v2.7 20–40).

### The Aggressor still loses to the eco bot
- Step 6 gave it an ability-based answer (it strikes Turrets and defenders dug in under the enemy HQ before pushing), and it beats the turtle bot 10–0 on Normal and Hard and the calibrated rush 16–4 on Hard.
- Against the eco bot (Refinery-heavy, no Turrets) it still loses: v2.6, 10 matches each, 4–6 on Normal and 0–10 on Hard (v2.5: 1–9 and 0–7; v2.1: 0–9 and 0–8).

### Narrow Normal-vs-Hard margins in two mirrors
- With both sides the same personality, Normal beats Hard about 4 times in 10 for the Economist and the Trickster: v2.6, 60 matches each, 25–35 for both (v2.4 Economist: 31–42 over 80). Hard still wins the majority, but a single 20-match row can come out even.
