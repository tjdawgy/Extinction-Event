# Batch 6g: an Axiarch scripted player (AI macro, direct-control units), before / after

before: audit/logs-p1/b6g/player-before/matches.jsonl (18 matches); after: audit/logs-p1/b6g/player-after/matches.jsonl (18 matches)

## Axiarch warp-ins

| run | map | who | warp-ins | died within 15 s | within 150 of an enemy | in an enemy weapon's reach | from a forward Gate (died) |
|---|---|---|---|---|---|---|---|
| before | classic | player (6 sides) | 267 | 54 (20.2%) | 18.7% | 27.3% | 0 (0) |
| before | twolane | player (6 sides) | 601 | 131 (21.8%) | 20.5% | 28.3% | 3 (3) |
| before | threelane | player (6 sides) | 560 | 132 (23.6%) | 24.1% | 26.8% | 0 (0) |
| before | all | player (18 sides) | 1428 | 317 (22.2%) | 21.6% | 27.5% | 3 (3) |
| after | classic | player (6 sides) | 254 | 50 (19.7%) | 21.7% | 18.5% | 0 (0) |
| after | twolane | player (6 sides) | 628 | 69 (11.0%) | 2.9% | 6.5% | 0 (0) |
| after | threelane | player (6 sides) | 718 | 115 (16.0%) | 4.3% | 16.6% | 0 (0) |
| after | all | player (18 sides) | 1600 | 234 (14.6%) | 6.5% | 12.9% | 0 (0) |

## Node play per faction (per side and match)

| run | faction | sides | pad buildings built | of them turrets | captures | retakes | enemy pad buildings destroyed | fortified holds: n, mean s | unfortified holds: n, mean s | nodes held at 6 / 10 / 14 min |
|---|---|---|---|---|---|---|---|---|---|---|
| before | lastfist | 6 | 3.00 | 2.67 | 8.83 | 2.67 | 1.00 | 6, 684 | 47, 411 | 6.3 / 7.0 / 6.7 |
| before | bloomhost | 6 | 1.50 | 1.33 | 7.17 | 3.00 | 0.17 | 3, 304 | 40, 245 | 6.0 / 7.0 / - |
| before | axiarchs | 12 | 0.83 | 0.75 | 6.00 | 2.08 | 1.92 | 3, 477 | 69, 261 | 1.8 / 1.8 / 3.0 |
| after | lastfist | 6 | 6.33 | 6.00 | 11.17 | 4.83 | 1.00 | 14, 521 | 53, 410 | 6.2 / 8.5 / 9.4 |
| after | bloomhost | 6 | 1.83 | 1.67 | 8.17 | 3.83 | 3.17 | 8, 403 | 41, 338 | 5.2 / 6.3 / 7.5 |
| after | axiarchs | 12 | 2.50 | 2.17 | 7.00 | 2.50 | 2.67 | 12, 330 | 72, 213 | 2.3 / 1.6 / 2.0 |

(lane maps only: Classic has no forward pad; Last Fist node bunkers are left out of "pad buildings")

## Bloomhost groups sent at a node an enemy gun covers

| run | groups | node taken | mean group value | mean gun health there |
|---|---|---|---|---|
| before | 0 | 0 (-) | - | - |
| after | 66 | 0 (0.0%) | 276 | 1189 |

## Base attacks standing past the enemy HQ (6f's counters: half the ground army over 100 beyond it, 20 s or more)

| run | sides with an edge stand | seconds | of them with nothing in sight |
|---|---|---|---|
| before | 1 | 120 | 0 |
| after | 0 | 0 | 0 |

## Results

| run | faction | won-lost-drawn |
|---|---|---|
| before | lastfist | 5-2-2 |
| before | bloomhost | 6-3-0 |
| before | axiarchs | 5-11-2 |
| after | lastfist | 5-3-1 |
| after | bloomhost | 6-3-0 |
| after | axiarchs | 6-11-1 |
