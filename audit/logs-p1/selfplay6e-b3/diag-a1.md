# Batch 6d, A1: why the Turtle and the Economist lose (selfplay6e-b3, 162 matches, 0 errors)

Per side (each match gives two). "Base attack": the AI's first strategy move of mode all or siege (its army sent at the enemy base); "field push": its first push of any mode (field, node, all, siege). "Lost before a base attack": losses in which the side never sent a base attack. Idle production: game seconds in which at least one finished production building stood with an empty queue, not upgrading, with supply room. Floating: seconds with 1,000+ credits banked.

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 108 | 49-46-13 | 3:28 | 4:01 | 2 of 46 | 43% | 11% | 49% |
| economist | 108 | 40-59-9 | 3:37 | 4:04 | 4 of 59 | 52% | 6% | 43% |
| turtle | 108 | 56-40-12 | 3:47 | 4:11 | 0 of 40 | 41% | 13% | 53% |

Against the Boomer only:

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 36 | 16-16-4 | 3:21 | 4:03 | 0 of 16 | 48% | 11% | 49% |
| economist | 36 | 9-24-3 | 3:27 | 4:04 | 0 of 24 | 59% | 5% | 31% |
| turtle | 36 | 21-9-6 | 3:38 | 4:15 | 0 of 9 | 36% | 17% | 55% |

## Income and army value over time (medians per side; income = credits + energy per second; army = credits + energy of living units)

**Income** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 22 (108) | 27 (108) | 37 (108) | 38 (108) | 38 (108) | 41 (95) | 41 (80) | 38 (70) |
| economist | 22 (108) | 27 (108) | 39 (108) | 43 (108) | 41 (107) | 36 (93) | 36 (71) | 35 (66) |
| turtle | 18 (108) | 30 (108) | 34 (108) | 39 (108) | 41 (107) | 38 (102) | 37 (87) | 37 (80) |

**Army value** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 123 (108) | 617 (108) | 1415 (108) | 1507 (108) | 1680 (108) | 2460 (95) | 2833 (80) | 3118 (70) |
| economist | 123 (108) | 575 (108) | 1310 (108) | 1724 (108) | 1831 (107) | 1960 (93) | 2245 (71) | 2522 (66) |
| turtle | 123 (108) | 450 (108) | 1118 (108) | 1394 (108) | 1460 (107) | 2050 (102) | 2145 (87) | 1900 (80) |

**Bank (credits)** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 188 (108) | 140 (108) | 287 (108) | 710 (108) | 614 (108) | 523 (95) | 640 (80) | 746 (70) |
| economist | 194 (108) | 126 (108) | 219 (108) | 800 (108) | 476 (107) | 521 (93) | 432 (71) | 215 (66) |
| turtle | 98 (108) | 123 (108) | 215 (108) | 611 (108) | 749 (107) | 468 (102) | 588 (87) | 579 (80) |

Turtle and Economist against a Boomer, paired in the same match (median of own minus the Boomer's):

| personality | 2 inc | 3 inc | 4 inc | 5 inc | 6 inc | 8 inc | 10 inc | 12 inc | 2 army | 3 army | 4 army | 5 army | 6 army | 8 army |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| economist | 0 | -1 | -3 | 2 | -4 | -14 | -12 | -12 | 31 | -25 | -111 | 159 | 41 | -730 |
| turtle | -4 | -1 | -3 | 4 | 3 | -1 | 1 | -1 | 29 | -121 | -146 | -77 | -317 | -133 |

## What they spend on (medians per side over the match; credits + energy)

| personality | earned | units | buildings | upgrades | units share | Refineries built | Turrets built | Habitats built | tier 2 at | tier 3 at | supply used/cap at 6:00 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| boomer | 26131 | 15847 | 2298 | 6110 | 66% | 3 | 1 | 2 | 0:59 | 3:19 | 28/34 |
| economist | 27087 | 14938 | 2465 | 6405 | 61% | 3 | 1 | 2 | 0:59 | 2:57 | 33/34 |
| turtle | 33558 | 22145 | 2325 | 6800 | 68% | 3 | 2 | 3 | 1:52 | 4:24 | 28/34 |

Per faction (win rate; median income at 6:00; first base attack):

| faction | boomer | economist | turtle |
|---|---|---|---|
| lastfist | 24/36; 39; 4:00 | 20/36; 45; 4:00 | 22/36; 42; 4:03 |
| bloomhost | 11/36; 38; 4:01 | 7/36; 41; 4:04 | 19/36; 39; 4:17 |
| axiarchs | 14/36; 37; 4:07 | 13/36; 36; 4:09 | 15/36; 38; 4:16 |

How the losses happen (lost sides): match length; own army at the end of the last full minute; enemy's:

| personality | losses | median length | own army, last minute | enemy army, last minute | losses under 10:00 |
|---|---|---|---|---|---|
| boomer | 46 | 13:00 | 0 | 4665 | 14 |
| economist | 59 | 14:38 | 0 | 4730 | 22 |
| turtle | 40 | 18:00 | 0 | 5118 | 7 |

