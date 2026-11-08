# Open Field map (Phase 1)

**Shelved: replaced by Three-Lane with crossings; kept for reference.** Proposal C, sent after v2.67 (design only, never
built).

```
 y
-500 ┌────────────────────────────────────────────────────────────────────────────┐
     │         ▓▓▓ rocks          N1 ◆                    ◆ N2          ▓▓▓        │
-300 │   F ▢▢     ▓▓▓▓▓        ▲T           ░░░░░           ▲T       ▓▓▓▓▓   ▢▢ F  │  north flank
     │                ▓▓       ████████     ░ C ░     ████████       ▓▓          │
   0 │ [W HQ]+pads      r      ██ mesa █   ░░◆◆░░   █ mesa ██      r   pads+[E HQ]│  the bowl (centre)
     │                ▓▓       ████████     ░░░░░     ████████       ▓▓          │
+300 │   F ▢▢     ▓▓▓▓▓        ▲T           ░░░░░           ▲T       ▓▓▓▓▓   ▢▢ F  │  south flank
     │         ▓▓▓ rocks          S1 ◆                    ◆ S2          ▓▓▓        │
+500 └────────────────────────────────────────────────────────────────────────────┘
     0     220   460  620     840  1000     1250     1500  1660    1880  2040  2500   x
  ◆ income nodes   C: rich centre (two crystals)   ▲T: watchtowers   F ▢▢: forward pads   ███ mesas   ▓▓ rock fields   ░ open bowl
```

- **The idea:** no lanes at all. Two big mesas split the middle into three routes (north flank, the centre bowl,
  south flank), and smaller rock fields near each base make the routes out of a base matter. Every route is open
  ground, so an army can go anywhere; the obstacles decide how long it takes and what it can see on the way.
- **Size and shape:** 2500 × 1000, mirrored left to right (`mirror-x`), `fog: 'grid'`, true distance. No `lanes`: ground
  units move by the navigation grid alone (built in v2.65).
- **Bases:** Classic's base layout at x 220 and 2280 (2500 − 220), as on Two-Lane, so building is the same everywhere.
- **Obstacles (blockers):** two mesas (about 420 × 300) at x 840–1260 and 1240–1660, leaving a bowl between them;
  four rock fields (irregular, about 200 × 150) near each base at depth ±300, which split each base's exit into
  three; small boulder clusters inside the bowl that break up straight lines of fire.
- **Nodes:** four income nodes on the flanks (1000, ±420) and (1500, ±420), far from the centre so holding one means
  sending part of the army out wide; the rich centre node (1250, 0) in the bowl at 1.5×; two watchtowers on the mesas'
  inner corners (840/1660, ±200), each seeing the bowl and one flank; four forward pads in the base exits
  (330, ±330) and (2170, ±330) (each faction's Turret and Barracks roles, as on Two-Lane).
- **Army cap: 100.**
- **Split Army on an open map:** squads can't be lanes here, so the two squads become **routes**: the map lists its
  routes (`ai.routes`: north, centre, south, each a path of waypoints), each squad is given one (long-press the squad:
  "Send to North / Centre / South"), and Attack sends it along that route's waypoints. The controls stay the same as
  on Two-Lane (All, and two squad chips, now labelled A and B). This is the one real design question for this map:
  routes keep squads as simple as lanes, at the cost of not letting players draw their own path.
- **AI:** the same lane layer, reading `ai.routes` instead of lanes: it splits its army between two of the three
  routes (or concentrates on one), takes the centre and the watchtowers with capture groups, and uses the forward
  pads in its exits.
- **What it needs beyond v2.67:** routes in the map format and in the squad code; flanking-aware targeting (units on
  open ground spread out instead of filing along a lane); blockers drawn as tall mesas (the Two-Lane ridge is a low
  plateau); a bigger minimap frame (the map is 2.5× Classic's length). Performance: the open map has more ground to
  cover with fog and navigation (2500 × 1000 at 20 per cell is 6,300 cells), about 1.3× Two-Lane's grid.
