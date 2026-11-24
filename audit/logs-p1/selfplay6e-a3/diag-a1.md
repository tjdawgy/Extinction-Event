# Batch 6d, A1: why the Turtle and the Economist lose (selfplay6e-a3, 162 matches, 0 errors)

Per side (each match gives two). "Base attack": the AI's first strategy move of mode all or siege (its army sent at the enemy base); "field push": its first push of any mode (field, node, all, siege). "Lost before a base attack": losses in which the side never sent a base attack. Idle production: game seconds in which at least one finished production building stood with an empty queue, not upgrading, with supply room. Floating: seconds with 1,000+ credits banked.

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 108 | 50-45-13 | 3:31 | 4:04 | 3 of 45 | 44% | 11% | 47% |
| economist | 108 | 45-49-14 | 3:35 | 4:03 | 10 of 49 | 49% | 9% | 45% |
| turtle | 108 | 50-51-7 | 3:49 | 4:11 | 0 of 51 | 42% | 13% | 50% |

Against the Boomer only:

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 36 | 17-17-2 | 3:20 | 4:05 | 0 of 17 | 43% | 15% | 45% |
| economist | 36 | 10-18-8 | 3:27 | 4:05 | 3 of 18 | 53% | 10% | 33% |
| turtle | 36 | 18-15-3 | 3:38 | 4:17 | 0 of 15 | 41% | 13% | 49% |

## Income and army value over time (medians per side; income = credits + energy per second; army = credits + energy of living units)

**Income** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 22 (108) | 28 (108) | 37 (108) | 38 (108) | 38 (104) | 40 (95) | 38 (83) | 37 (77) |
| economist | 22 (108) | 27 (108) | 38 (108) | 43 (108) | 41 (99) | 39 (84) | 37 (73) | 34 (65) |
| turtle | 18 (108) | 30 (108) | 34 (108) | 38 (108) | 39 (107) | 37 (99) | 37 (86) | 36 (78) |

**Army value** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 123 (108) | 617 (108) | 1363 (108) | 1448 (108) | 1725 (104) | 2515 (95) | 2810 (83) | 2905 (77) |
| economist | 123 (108) | 575 (108) | 1300 (108) | 1688 (108) | 1865 (99) | 2174 (84) | 2725 (73) | 3028 (65) |
| turtle | 123 (108) | 450 (108) | 1120 (108) | 1299 (108) | 1480 (107) | 1955 (99) | 2068 (86) | 2300 (78) |

**Bank (credits)** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 188 (108) | 165 (108) | 355 (108) | 737 (108) | 690 (104) | 665 (95) | 676 (83) | 739 (77) |
| economist | 194 (108) | 126 (108) | 218 (108) | 774 (108) | 580 (99) | 574 (84) | 727 (73) | 468 (65) |
| turtle | 98 (108) | 108 (108) | 217 (108) | 727 (108) | 797 (107) | 724 (99) | 589 (86) | 612 (78) |

Turtle and Economist against a Boomer, paired in the same match (median of own minus the Boomer's):

| personality | 2 inc | 3 inc | 4 inc | 5 inc | 6 inc | 8 inc | 10 inc | 12 inc | 2 army | 3 army | 4 army | 5 army | 6 army | 8 army |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| economist | 0 | -2 | -4 | 2 | -1 | -3 | -6 | -6 | 31 | -41 | -171 | -18 | 96 | -403 |
| turtle | -4 | -1 | -3 | 6 | 3 | -2 | 1 | 0 | 29 | -121 | -146 | -10 | -330 | -48 |

## What they spend on (medians per side over the match; credits + energy)

| personality | earned | units | buildings | upgrades | units share | Refineries built | Turrets built | Habitats built | tier 2 at | tier 3 at | supply used/cap at 6:00 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| boomer | 28324 | 17922 | 2333 | 6570 | 67% | 3 | 1 | 3 | 0:59 | 3:19 | 28/31 |
| economist | 28797 | 15270 | 2420 | 6440 | 61% | 3 | 1 | 2 | 0:59 | 2:57 | 33/34 |
| turtle | 30924 | 17158 | 2375 | 6710 | 64% | 3 | 2 | 3 | 1:52 | 4:24 | 29/34 |

Per faction (win rate; median income at 6:00; first base attack):

| faction | boomer | economist | turtle |
|---|---|---|---|
| lastfist | 21/36; 40; 4:00 | 21/36; 45; 4:01 | 16/36; 41; 4:03 |
| bloomhost | 12/36; 38; 4:06 | 10/36; 41; 4:03 | 16/36; 39; 4:17 |
| axiarchs | 17/36; 35; 4:05 | 14/36; 39; 4:13 | 18/36; 37; 4:18 |

How the losses happen (lost sides): match length; own army at the end of the last full minute; enemy's:

| personality | losses | median length | own army, last minute | enemy army, last minute | losses under 10:00 |
|---|---|---|---|---|---|
| boomer | 45 | 13:48 | 0 | 4796 | 12 |
| economist | 49 | 11:12 | 0 | 4730 | 21 |
| turtle | 51 | 16:42 | 0 | 4859 | 8 |

