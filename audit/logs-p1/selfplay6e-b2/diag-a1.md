# Batch 6d, A1: why the Turtle and the Economist lose (selfplay6e-b2, 162 matches, 0 errors)

Per side (each match gives two). "Base attack": the AI's first strategy move of mode all or siege (its army sent at the enemy base); "field push": its first push of any mode (field, node, all, siege). "Lost before a base attack": losses in which the side never sent a base attack. Idle production: game seconds in which at least one finished production building stood with an empty queue, not upgrading, with supply room. Floating: seconds with 1,000+ credits banked.

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 108 | 50-46-12 | 3:28 | 4:02 | 2 of 46 | 42% | 11% | 49% |
| economist | 108 | 41-58-9 | 3:37 | 4:04 | 5 of 58 | 51% | 6% | 43% |
| turtle | 108 | 54-41-13 | 3:47 | 4:11 | 0 of 41 | 37% | 13% | 54% |

Against the Boomer only:

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 36 | 17-17-2 | 3:21 | 4:05 | 0 of 17 | 41% | 11% | 44% |
| economist | 36 | 9-24-3 | 3:27 | 4:04 | 1 of 24 | 59% | 5% | 32% |
| turtle | 36 | 20-9-7 | 3:38 | 4:08 | 0 of 9 | 31% | 14% | 55% |

## Income and army value over time (medians per side; income = credits + energy per second; army = credits + energy of living units)

**Income** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 22 (108) | 27 (108) | 37 (108) | 38 (108) | 38 (108) | 40 (99) | 40 (86) | 38 (75) |
| economist | 22 (108) | 27 (108) | 39 (108) | 43 (108) | 40 (107) | 37 (93) | 36 (72) | 36 (64) |
| turtle | 18 (108) | 30 (108) | 35 (108) | 39 (108) | 41 (107) | 38 (102) | 38 (84) | 37 (81) |

**Army value** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 123 (108) | 617 (108) | 1423 (108) | 1484 (108) | 1703 (108) | 2320 (99) | 2928 (86) | 3335 (75) |
| economist | 123 (108) | 575 (108) | 1310 (108) | 1724 (108) | 1880 (107) | 1960 (93) | 2098 (72) | 2680 (64) |
| turtle | 123 (108) | 450 (108) | 1120 (108) | 1394 (108) | 1487 (107) | 2060 (102) | 2207 (84) | 2000 (81) |

**Bank (credits)** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 188 (108) | 140 (108) | 282 (108) | 713 (108) | 603 (108) | 523 (99) | 637 (86) | 691 (75) |
| economist | 194 (108) | 126 (108) | 219 (108) | 797 (108) | 491 (107) | 521 (93) | 443 (72) | 251 (64) |
| turtle | 98 (108) | 123 (108) | 215 (108) | 611 (108) | 757 (107) | 437 (102) | 556 (84) | 551 (81) |

Turtle and Economist against a Boomer, paired in the same match (median of own minus the Boomer's):

| personality | 2 inc | 3 inc | 4 inc | 5 inc | 6 inc | 8 inc | 10 inc | 12 inc | 2 army | 3 army | 4 army | 5 army | 6 army | 8 army |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| economist | 0 | -1 | -3 | 2 | -4 | -11 | -11 | -7 | 31 | -25 | -111 | 159 | 26 | -908 |
| turtle | -4 | -1 | -2 | 5 | 5 | 1 | 7 | -2 | 29 | -121 | -146 | -20 | -172 | 35 |

## What they spend on (medians per side over the match; credits + energy)

| personality | earned | units | buildings | upgrades | units share | Refineries built | Turrets built | Habitats built | tier 2 at | tier 3 at | supply used/cap at 6:00 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| boomer | 27295 | 16264 | 2315 | 6110 | 66% | 3 | 1 | 2.5 | 0:59 | 3:19 | 28/34 |
| economist | 27239 | 14975 | 2445 | 6555 | 62% | 3 | 1 | 2 | 0:59 | 2:57 | 33/34 |
| turtle | 36038 | 23603 | 2410 | 6800 | 70% | 3 | 2 | 3 | 1:52 | 4:24 | 28/34 |

Per faction (win rate; median income at 6:00; first base attack):

| faction | boomer | economist | turtle |
|---|---|---|---|
| lastfist | 24/36; 39; 4:00 | 20/36; 44; 4:00 | 22/36; 42; 4:03 |
| bloomhost | 13/36; 38; 4:01 | 10/36; 40; 4:04 | 19/36; 41; 4:14 |
| axiarchs | 13/36; 37; 4:12 | 11/36; 36; 4:09 | 13/36; 38; 4:16 |

How the losses happen (lost sides): match length; own army at the end of the last full minute; enemy's:

| personality | losses | median length | own army, last minute | enemy army, last minute | losses under 10:00 |
|---|---|---|---|---|---|
| boomer | 46 | 13:34 | 122 | 4873 | 12 |
| economist | 58 | 14:14 | 0 | 4817 | 20 |
| turtle | 41 | 18:37 | 0 | 5225 | 9 |

