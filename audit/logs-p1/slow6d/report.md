# Batch 6d: the three slow tests that failed, over 20 matches per switch set (audit/sim/slow6d.js)

## tests/slow/ai-stats.test.js: Bloomhost (Turtle, Default AI) abilities vs a Last Fist Turtle, Classic, seeds 100-119

The test plays 10 (seeds 100-109) and needs Frenzy Bloom ≥ 50%, Corrosive Bloom ≥ 45%, Emergency Brood ≥ 15%.

| switches | Frenzy Bloom | Corrosive Bloom | Emergency Brood | Corrosive, seeds 100-109 | Last Fist wins | median length |
|---|---|---|---|---|---|---|
| every switch on | 20/20 | 7/20 | 8/20 | 3/10 | 15/20 | 935 |
| b6ai off | 20/20 | 7/20 | 8/20 | 3/10 | 15/20 | 935 |
| b6d off | 20/20 | 10/20 | 8/20 | 5/10 | 17/20 | 925 |
| b6ai and b6d off | 20/20 | 10/20 | 8/20 | 5/10 | 17/20 | 925 |

## tests/ax-trees.test.js re-run with every switch on: an Axiarch Hard AI (Economist on even seeds, Trickster on odd) against a Last Fist Turtle, seeds 1-20

The test plays two matches (seed 9 Economist, seed 4 Trickster) and needs the union to hold both Barracks paths and both War Factory paths, with 3+ path units trained.

| switches | factory A | factory B | barracks A | barracks B | a pair (even seed + next odd) covers all four | Axiarchs win |
|---|---|---|---|---|---|---|
| every switch on | 7/20 | 8/20 | 8/20 | 17/20 | 1/9 | 5/20 |
| b6ai off | 10/20 | 10/20 | 8/20 | 17/20 | 3/9 | 17/20 |
| b6d off | 5/20 | 10/20 | 8/20 | 17/20 | 2/9 | 3/20 |
| b6ai and b6d off | 10/20 | 10/20 | 8/20 | 17/20 | 4/9 | 9/20 |

By personality (factory B, the path missing in the failed run):

| switches | Economist: factory B | Trickster: factory B |
|---|---|---|
| every switch on | 2/10 | 6/10 |
| b6ai off | 2/10 | 8/10 |
| b6d off | 3/10 | 7/10 |
| b6ai and b6d off | 5/10 | 5/10 |

## tests/slow/threelane-match.test.js: Hard vs Hard on Three-Lane, the test's pairing cycle, seeds 600-619

The test plays seeds 600-605 and needs every match over by 27:00, both sides on all three lanes, the centre and a watchtower taken, nobody in a wall; 4+ of 6 ended by an HQ, forward pads in 4+.

| switches | over by 27:00 | both sides used all three lanes | centre and a watchtower | nobody in a wall | ended by an HQ | forward pads | seeds 600-605: all three lanes |
|---|---|---|---|---|---|---|---|
| every switch on | 20/20 | 19/20 | 20/20 | 20/20 | 17/20 | 19/20 | 5/6 |
| b6ai off | 20/20 | 20/20 | 20/20 | 20/20 | 16/20 | 18/20 | 6/6 |
| b6d off | 20/20 | 19/20 | 20/20 | 20/20 | 19/20 | 18/20 | 5/6 |
| b6ai and b6d off | 20/20 | 20/20 | 20/20 | 20/20 | 18/20 | 18/20 | 6/6 |

Lanes used when not all three (side 0 / side 1; 0 north, 1 centre, 2 south):

- every switch on: seed 604 (bloomhost v lastfist, 1270 s) 01 / 012
- b6ai off: none
- b6d off: seed 604 (bloomhost v lastfist, 700 s) 01 / 012
- b6ai and b6d off: none
