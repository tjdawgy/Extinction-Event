# Batch 6d, A1: why the Turtle and the Economist lose (selfplay6d-b3, 162 matches, 0 errors)

Per side (each match gives two). "Base attack": the AI's first strategy move of mode all or siege (its army sent at the enemy base); "field push": its first push of any mode (field, node, all, siege). "Lost before a base attack": losses in which the side never sent a base attack. Idle production: game seconds in which at least one finished production building stood with an empty queue, not upgrading, with supply room. Floating: seconds with 1,000+ credits banked.

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 108 | 51-45-12 | 3:28 | 4:01 | 3 of 45 | 45% | 11% | 50% |
| economist | 108 | 43-47-18 | 3:31 | 4:03 | 9 of 47 | 51% | 9% | 45% |
| turtle | 108 | 49-51-8 | 3:55 | 4:14 | 0 of 51 | 41% | 14% | 48% |

Against the Boomer only:

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 36 | 18-18-0 | 3:23 | 4:07 | 0 of 18 | 40% | 13% | 44% |
| economist | 36 | 10-17-9 | 3:28 | 4:05 | 3 of 17 | 53% | 5% | 33% |
| turtle | 36 | 17-16-3 | 3:51 | 4:23 | 0 of 16 | 36% | 14% | 47% |

## Income and army value over time (medians per side; income = credits + energy per second; army = credits + energy of living units)

**Income** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 22 (108) | 28 (108) | 37 (108) | 38 (108) | 38 (104) | 38 (95) | 39 (80) | 36 (74) |
| economist | 22 (108) | 30 (108) | 39 (108) | 47 (108) | 42 (99) | 40 (86) | 37 (76) | 37 (67) |
| turtle | 18 (108) | 27 (108) | 31 (108) | 38 (108) | 41 (107) | 38 (99) | 38 (90) | 37 (83) |

**Army value** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 123 (108) | 588 (108) | 1328 (108) | 1425 (108) | 1682 (104) | 2275 (95) | 2955 (80) | 2733 (74) |
| economist | 123 (108) | 576 (108) | 1308 (108) | 1790 (108) | 1935 (99) | 2174 (86) | 2899 (76) | 2645 (67) |
| turtle | 123 (108) | 450 (108) | 1114 (108) | 1260 (108) | 1440 (107) | 1750 (99) | 1715 (90) | 2280 (83) |

**Bank (credits)** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 185 (108) | 152 (108) | 355 (108) | 783 (108) | 652 (104) | 512 (95) | 632 (80) | 774 (74) |
| economist | 187 (108) | 122 (108) | 210 (108) | 778 (108) | 566 (99) | 548 (86) | 590 (76) | 417 (67) |
| turtle | 95 (108) | 81 (108) | 204 (108) | 478 (108) | 654 (107) | 687 (99) | 589 (90) | 729 (83) |

Turtle and Economist against a Boomer, paired in the same match (median of own minus the Boomer's):

| personality | 2 inc | 3 inc | 4 inc | 5 inc | 6 inc | 8 inc | 10 inc | 12 inc | 2 army | 3 army | 4 army | 5 army | 6 army | 8 army |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| economist | 0 | -1 | 2 | 7 | -1 | 2 | -8 | -6 | 14 | -52 | -140 | -23 | 353 | -95 |
| turtle | -4 | -1 | -5 | 4 | 3 | -7 | -2 | 1 | 11 | -105 | -266 | -180 | -443 | -590 |

## What they spend on (medians per side over the match; credits + energy)

| personality | earned | units | buildings | upgrades | units share | Refineries built | Turrets built | Habitats built | tier 2 at | tier 3 at | supply used/cap at 6:00 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| boomer | 27871 | 16935 | 2353 | 6415 | 66% | 3 | 1 | 3 | 0:59 | 3:19 | 28/34 |
| economist | 29417 | 18218 | 2413 | 6735 | 61% | 3 | 1 | 2 | 0:59 | 2:55 | 33/34 |
| turtle | 32141 | 19464 | 2383 | 6700 | 65% | 3 | 2 | 3 | 1:52 | 4:20 | 28/34 |

Per faction (win rate; median income at 6:00; first base attack):

| faction | boomer | economist | turtle |
|---|---|---|---|
| lastfist | 24/36; 38; 4:01 | 22/36; 44; 4:01 | 21/36; 41; 4:03 |
| bloomhost | 16/36; 38; 4:05 | 13/36; 41; 4:05 | 17/36; 38; 4:20 |
| axiarchs | 11/36; 39; 4:01 | 8/36; 39; 4:03 | 11/36; 41; 4:21 |

How the losses happen (lost sides): match length; own army at the end of the last full minute; enemy's:

| personality | losses | median length | own army, last minute | enemy army, last minute | losses under 10:00 |
|---|---|---|---|---|---|
| boomer | 45 | 13:53 | 0 | 4420 | 14 |
| economist | 47 | 12:04 | 0 | 3945 | 19 |
| turtle | 51 | 16:43 | 0 | 4814 | 6 |

