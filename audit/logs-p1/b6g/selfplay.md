# Batch 6g: persona-balanced self-play (162 Hard vs Hard), v2.96 (b6g off) / v2.97 (b6g on)

before: audit/logs-p1/selfplay6g-base/matches.jsonl (162 matches); after: audit/logs-p1/selfplay6g-after/matches.jsonl (162 matches)

## Axiarch warp-ins

| run | map | who | warp-ins | died within 15 s | within 150 of an enemy | in an enemy weapon's reach | from a forward Gate (died) |
|---|---|---|---|---|---|---|---|
| before | classic | AI (36 sides) | 2469 | 1061 (43.0%) | 53.3% | 65.9% | 0 (0) |
| before | twolane | AI (36 sides) | 3710 | 598 (16.1%) | 19.0% | 25.2% | 105 (5) |
| before | threelane | AI (36 sides) | 3559 | 632 (17.8%) | 18.4% | 22.3% | 288 (61) |
| before | all | AI (108 sides) | 9738 | 2291 (23.5%) | 27.5% | 34.5% | 393 (66) |
| after | classic | AI (36 sides) | 2459 | 635 (25.8%) | 12.1% | 17.1% | 0 (0) |
| after | twolane | AI (36 sides) | 3809 | 724 (19.0%) | 11.2% | 17.7% | 0 (0) |
| after | threelane | AI (36 sides) | 3864 | 488 (12.6%) | 5.9% | 15.2% | 0 (0) |
| after | all | AI (108 sides) | 10132 | 1847 (18.2%) | 9.4% | 16.6% | 0 (0) |

## Node play per faction (per side and match)

| run | faction | sides | pad buildings built | of them turrets | captures | retakes | enemy pad buildings destroyed | fortified holds: n, mean s | unfortified holds: n, mean s | nodes held at 6 / 10 / 14 min |
|---|---|---|---|---|---|---|---|---|---|---|
| before | lastfist | 72 | 2.08 | 1.74 | 11.72 | 5.01 | 1.50 | 76, 471 | 768, 247 | 4.2 / 4.8 / 5.7 |
| before | bloomhost | 72 | 1.63 | 1.25 | 9.53 | 4.74 | 1.21 | 57, 474 | 629, 281 | 4.3 / 5.9 / 7.1 |
| before | axiarchs | 72 | 1.40 | 1.17 | 7.96 | 3.28 | 1.36 | 41, 448 | 532, 232 | 3.6 / 3.5 / 3.1 |
| after | lastfist | 72 | 4.85 | 4.56 | 11.07 | 5.06 | 3.18 | 127, 472 | 670, 240 | 4.1 / 5.1 / 5.6 |
| after | bloomhost | 72 | 4.04 | 3.76 | 9.90 | 4.75 | 2.28 | 101, 494 | 612, 293 | 4.7 / 6.1 / 6.5 |
| after | axiarchs | 72 | 2.79 | 2.44 | 8.15 | 3.49 | 3.56 | 76, 488 | 511, 240 | 3.8 / 3.6 / 3.8 |

(lane maps only: Classic has no forward pad; Last Fist node bunkers are left out of "pad buildings")

## Bloomhost groups sent at a node an enemy gun covers

| run | groups | node taken | mean group value | mean gun health there |
|---|---|---|---|---|
| before | 156 | 2 (1.3%) | 307 | 1466 |
| after | 391 | 3 (0.8%) | 331 | 2782 |

## Base attacks standing past the enemy HQ (6f's counters: half the ground army over 100 beyond it, 20 s or more)

| run | sides with an edge stand | seconds | of them with nothing in sight |
|---|---|---|---|
| before | 0 | 0 | 0 |
| after | 1 | 347 | 0 |

## Results

| run | faction | won-lost-drawn |
|---|---|---|
| before | lastfist | 52-43-13 |
| before | bloomhost | 46-54-8 |
| before | axiarchs | 49-50-9 |
| after | lastfist | 47-44-17 |
| after | bloomhost | 40-58-10 |
| after | axiarchs | 56-41-11 |
