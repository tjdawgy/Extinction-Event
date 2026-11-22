# Batch 6d, A1: why the Turtle and the Economist lose (selfplay6d-a3, 162 matches, 0 errors)

Per side (each match gives two). "Base attack": the AI's first strategy move of mode all or siege (its army sent at the enemy base); "field push": its first push of any mode (field, node, all, siege). "Lost before a base attack": losses in which the side never sent a base attack. Idle production: game seconds in which at least one finished production building stood with an empty queue, not upgrading, with supply room. Floating: seconds with 1,000+ credits banked.

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 108 | 47-49-12 | 3:28 | 4:01 | 6 of 49 | 38% | 12% | 48% |
| economist | 108 | 56-48-4 | 3:36 | 4:04 | 9 of 48 | 50% | 10% | 48% |
| turtle | 108 | 47-53-8 | 3:56 | 4:12 | 1 of 53 | 36% | 16% | 48% |

Against the Boomer only:

| personality | sides | W-L-D | first field push | first base attack | lost before a base attack | idle production | floating | attack stance |
|---|---|---|---|---|---|---|---|---|
| boomer | 36 | 15-15-6 | 3:23 | 4:00 | 2 of 15 | 38% | 11% | 47% |
| economist | 36 | 17-16-3 | 3:28 | 4:03 | 2 of 16 | 52% | 7% | 40% |
| turtle | 36 | 17-16-3 | 3:52 | 4:21 | 1 of 16 | 33% | 19% | 49% |

## Income and army value over time (medians per side; income = credits + energy per second; army = credits + energy of living units)

**Income** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 22 (108) | 28 (108) | 36 (108) | 38 (107) | 39 (100) | 39 (92) | 39 (80) | 37 (71) |
| economist | 22 (108) | 30 (108) | 39 (108) | 47 (108) | 43 (96) | 40 (84) | 40 (65) | 34 (57) |
| turtle | 18 (108) | 27 (108) | 32 (108) | 36 (107) | 40 (104) | 38 (100) | 38 (91) | 38 (84) |

**Army value** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 123 (108) | 588 (108) | 1353 (108) | 1455 (107) | 1721 (100) | 2427 (92) | 2985 (80) | 3289 (71) |
| economist | 123 (108) | 575 (108) | 1310 (108) | 1842 (108) | 2008 (96) | 2297 (84) | 3065 (65) | 3290 (57) |
| turtle | 123 (108) | 450 (108) | 1079 (108) | 1270 (107) | 1388 (104) | 1790 (100) | 2210 (91) | 2245 (84) |

**Bank (credits)** at minute (sides still playing):

| personality | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| boomer | 185 (108) | 152 (108) | 283 (108) | 702 (107) | 578 (100) | 601 (92) | 707 (80) | 628 (71) |
| economist | 187 (108) | 123 (108) | 206 (108) | 770 (108) | 556 (96) | 419 (84) | 823 (65) | 694 (57) |
| turtle | 95 (108) | 81 (108) | 197 (108) | 513 (107) | 717 (104) | 644 (100) | 724 (91) | 634 (84) |

Turtle and Economist against a Boomer, paired in the same match (median of own minus the Boomer's):

| personality | 2 inc | 3 inc | 4 inc | 5 inc | 6 inc | 8 inc | 10 inc | 12 inc | 2 army | 3 army | 4 army | 5 army | 6 army | 8 army |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| economist | 0 | -1 | 2 | 8 | 5 | -1 | -1 | 2 | 14 | -47 | -105 | 171 | 146 | -98 |
| turtle | -4 | -1 | -3 | -1 | 1 | -4 | -1 | 0 | 11 | -105 | -266 | -250 | -417 | -200 |

## What they spend on (medians per side over the match; credits + energy)

| personality | earned | units | buildings | upgrades | units share | Refineries built | Turrets built | Habitats built | tier 2 at | tier 3 at | supply used/cap at 6:00 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| boomer | 28152 | 16767 | 2355 | 6675 | 65% | 3 | 1 | 2 | 0:59 | 3:19 | 28/28 |
| economist | 24275 | 14214 | 2340 | 6190 | 60% | 3 | 1 | 2 | 0:59 | 2:55 | 34/44 |
| turtle | 33595 | 20118 | 2355 | 6665 | 67% | 3 | 2 | 3 | 1:52 | 4:19 | 27/34 |

Per faction (win rate; median income at 6:00; first base attack):

| faction | boomer | economist | turtle |
|---|---|---|---|
| lastfist | 27/36; 41; 4:00 | 32/36; 46; 4:02 | 24/36; 41; 4:04 |
| bloomhost | 16/36; 38; 4:05 | 14/36; 41; 4:05 | 14/36; 38; 4:16 |
| axiarchs | 4/36; 37; 4:01 | 10/36; 40; 4:06 | 9/36; 40; 4:26 |

How the losses happen (lost sides): match length; own army at the end of the last full minute; enemy's:

| personality | losses | median length | own army, last minute | enemy army, last minute | losses under 10:00 |
|---|---|---|---|---|---|
| boomer | 49 | 13:38 | 0 | 4855 | 17 |
| economist | 48 | 12:21 | 0 | 4090 | 21 |
| turtle | 53 | 16:54 | 0 | 5013 | 6 |

