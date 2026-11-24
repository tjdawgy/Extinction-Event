# Batch 6d, A1: why the Turtle and the Economist lose (selfplay6e-c3, 162 matches, 0 errors)

Per side (each match gives two). "Base attack": the AI's first strategy move of mode all or siege (its army sent at the enemy base); "field push": its first push of any mode (field, node, all, siege). "Lost before a base attack": losses in which the side never sent a base attack. Idle production: game seconds in which at least one finished production building stood with an empty queue, not upgrading, with supply room. Floating: seconds with 1,000+ credits banked.

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 108 | 42-57-9 | 3:28 | 4:02 | 0 of 57 | 43% | 7% | 43% |
| economist | 108 | 47-55-6 | 3:34 | 4:09 | 3 of 55 | 54% | 9% | 47% |
| turtle | 108 | 55-32-21 | 3:49 | 4:10 | 0 of 32 | 38% | 11% | 55% |

Against the Boomer only:

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 36 | 17-17-2 | 3:23 | 4:03 | 0 of 17 | 43% | 15% | 45% |
| economist | 36 | 17-19-0 | 3:34 | 4:10 | 0 of 19 | 57% | 9% | 38% |
| turtle | 36 | 23-6-7 | 3:39 | 4:14 | 0 of 6 | 41% | 11% | 56% |

## Income and army value over time (medians per side; income = credits + energy per second; army = credits + energy of living units)

**Income** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 22 (108) | 27 (108) | 35 (108) | 37 (108) | 38 (107) | 40 (95) | 38 (88) | 34 (76) |
| economist | 22 (108) | 27 (108) | 41 (108) | 44 (108) | 41 (107) | 38 (95) | 37 (76) | 37 (67) |
| turtle | 18 (108) | 30 (108) | 34 (108) | 39 (108) | 40 (108) | 38 (102) | 38 (90) | 39 (81) |

**Army value** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 123 (108) | 622 (108) | 1383 (108) | 1553 (108) | 1825 (107) | 2345 (95) | 2602 (88) | 2695 (76) |
| economist | 123 (108) | 575 (108) | 1310 (108) | 1742 (108) | 2030 (107) | 2091 (95) | 2291 (76) | 2300 (67) |
| turtle | 123 (108) | 452 (108) | 1120 (108) | 1394 (108) | 1468 (108) | 1850 (102) | 2289 (90) | 2370 (81) |

**Bank (credits)** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 185 (108) | 154 (108) | 287 (108) | 646 (108) | 642 (107) | 517 (95) | 575 (88) | 290 (76) |
| economist | 194 (108) | 126 (108) | 206 (108) | 765 (108) | 430 (107) | 599 (95) | 592 (76) | 287 (67) |
| turtle | 96 (108) | 115 (108) | 169 (108) | 530 (108) | 748 (108) | 515 (102) | 269 (90) | 266 (81) |

Turtle and Economist against a Boomer, paired in the same match (median of own minus the Boomer's):

| personality | 2 inc | 3 inc | 4 inc | 5 inc | 6 inc | 8 inc | 10 inc | 12 inc | 2 army | 3 army | 4 army | 5 army | 6 army | 8 army |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| economist | 0 | 0 | 3 | 4 | 1 | -7 | -6 | -2 | 27 | -29 | -125 | 223 | 89 | -468 |
| turtle | -5 | 1 | 3 | 2 | 5 | -1 | 7 | 12 | 22 | -105 | -27 | -119 | -241 | -644 |

## What they spend on (medians per side over the match; credits + energy)

| personality | earned | units | buildings | upgrades | units share | Refineries built | Turrets built | Habitats built | tier 2 at | tier 3 at | supply used/cap at 6:00 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| boomer | 25952 | 16403 | 2405 | 6110 | 67% | 3 | 1 | 2 | 0:59 | 3:18 | 28/28 |
| economist | 26050 | 15878 | 2475 | 6315 | 63% | 3 | 1 | 2 | 0:59 | 2:57 | 34/44 |
| turtle | 36275 | 22560 | 2255 | 6675 | 71% | 3 | 2 | 3 | 1:52 | 4:25 | 28/34 |

Per faction (win rate; median income at 6:00; first base attack):

| faction | boomer | economist | turtle |
|---|---|---|---|
| lastfist | 15/36; 35; 4:00 | 20/36; 45; 4:09 | 15/36; 41; 4:07 |
| bloomhost | 13/36; 40; 4:02 | 12/36; 41; 4:07 | 22/36; 40; 4:09 |
| axiarchs | 14/36; 37; 4:07 | 15/36; 32; 4:10 | 18/36; 36; 4:12 |

How the losses happen (lost sides): match length; own army at the end of the last full minute; enemy's:

| personality | losses | median length | own army, last minute | enemy army, last minute | losses under 10:00 |
|---|---|---|---|---|---|
| boomer | 57 | 13:41 | 48 | 4423 | 11 |
| economist | 55 | 13:51 | 0 | 4114 | 18 |
| turtle | 32 | 18:48 | 0 | 4678 | 6 |

