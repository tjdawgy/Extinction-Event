# Batch 6d, A1: why the Turtle and the Economist lose (selfplay6d-base, 162 matches, 0 errors)

Per side (each match gives two). "Base attack": the AI's first strategy move of mode all or siege (its army sent at the enemy base); "field push": its first push of any mode (field, node, all, siege). "Lost before a base attack": losses in which the side never sent a base attack. Idle production: game seconds in which at least one finished production building stood with an empty queue, not upgrading, with supply room. Floating: seconds with 1,000+ credits banked.

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 108 | 73-23-12 | 3:34 | 4:01 | 2 of 23 | 40% | 13% | 54% |
| economist | 108 | 36-60-12 | 4:00 | 4:39 | 4 of 60 | 56% | 12% | 35% |
| turtle | 108 | 37-63-8 | 4:22 | 6:00 | 8 of 63 | 65% | 3% | 30% |

Against the Boomer only:

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 36 | 15-15-6 | 3:23 | 4:00 | 2 of 15 | 38% | 11% | 47% |
| economist | 36 | 1-32-3 | 3:59 | 4:49 | 4 of 32 | 56% | 2% | 16% |
| turtle | 36 | 7-26-3 | 4:07 | 5:25 | 4 of 26 | 70% | 0% | 19% |

## Income and army value over time (medians per side; income = credits + energy per second; army = credits + energy of living units)

**Income** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 24 (108) | 30 (108) | 38 (108) | 42 (108) | 42 (106) | 43 (91) | 41 (72) | 42 (59) |
| economist | 16 (108) | 18 (108) | 26 (108) | 33 (108) | 35 (107) | 35 (97) | 34 (78) | 33 (68) |
| turtle | 14 (108) | 14 (108) | 14 (108) | 19 (108) | 22 (107) | 27 (106) | 29 (98) | 29 (85) |

**Army value** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 123 (108) | 590 (108) | 1380 (108) | 1523 (108) | 1994 (106) | 2645 (91) | 3078 (72) | 3425 (59) |
| economist | 123 (108) | 240 (108) | 743 (108) | 1310 (108) | 1636 (107) | 1905 (97) | 2340 (78) | 2545 (68) |
| turtle | 123 (108) | 160 (108) | 400 (108) | 728 (108) | 985 (107) | 1460 (106) | 1680 (98) | 2170 (85) |

**Bank (credits)** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 185 (108) | 152 (108) | 347 (108) | 862 (108) | 764 (106) | 608 (91) | 570 (72) | 575 (59) |
| economist | 86 (108) | 97 (108) | 153 (108) | 491 (108) | 616 (107) | 784 (97) | 621 (78) | 450 (68) |
| turtle | 188 (108) | 130 (108) | 73 (108) | 95 (108) | 117 (107) | 280 (106) | 552 (98) | 518 (85) |

Turtle and Economist against a Boomer, paired in the same match (median of own minus the Boomer's):

| personality | 2 inc | 3 inc | 4 inc | 5 inc | 6 inc | 8 inc | 10 inc | 12 inc | 2 army | 3 army | 4 army | 5 army | 6 army | 8 army |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| economist | -8 | -8 | -14 | -13 | -14 | -19 | -19 | -15 | 36 | -386 | -825 | -292 | -1003 | -1895 |
| turtle | -10 | -12 | -24 | -26 | -24 | -23 | -22 | -24 | 33 | -395 | -948 | -832 | -1435 | -1599 |

## What they spend on (medians per side over the match; credits + energy)

| personality | earned | units | buildings | upgrades | units share | Refineries built | Turrets built | Habitats built | tier 2 at | tier 3 at | supply used/cap at 6:00 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| boomer | 26343 | 15858 | 2255 | 6590 | 63% | 3 | 1 | 3 | 0:59 | 3:19 | 33/34 |
| economist | 26341 | 16013 | 2568 | 6000 | 66% | 2 | 1 | 2 | 2:04 | 3:41 | 24/28 |
| turtle | 22541 | 14053 | 2473 | 5560 | 66% | 2 | 2 | 2 | 2:32 | 6:42 | 19/28 |

Per faction (win rate; median income at 6:00; first base attack):

| faction | boomer | economist | turtle |
|---|---|---|---|
| lastfist | 33/36; 43; 4:00 | 19/36; 37; 4:46 | 18/36; 23; 5:25 |
| bloomhost | 20/36; 43; 4:05 | 10/36; 33; 4:19 | 9/36; 19; 6:01 |
| axiarchs | 20/36; 40; 4:01 | 7/36; 35; 4:52 | 10/36; 26; 6:02 |

How the losses happen (lost sides): match length; own army at the end of the last full minute; enemy's:

| personality | losses | median length | own army, last minute | enemy army, last minute | losses under 10:00 |
|---|---|---|---|---|---|
| boomer | 23 | 16:03 | 0 | 4760 | 4 |
| economist | 60 | 10:49 | 213 | 4305 | 25 |
| turtle | 63 | 14:29 | 0 | 4769 | 9 |

