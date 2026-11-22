# Batch 6d, B1: why Last Fist wins (selfplay6d-base, 114 matches)

## Income (credits + energy per second), medians at minute (sides still playing)

| faction | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 15 |
|---|---|---|---|---|---|---|---|---|---|
| Last Fist | 18 | 25 | 29 | 36 | 36 | 32 | 37 | 38 | 32 |
| Bloomhost | 14 | 18 | 24 | 30 | 32 | 35 | 32 | 34 | 33 |
| Axiarchs | 22 | 25 | 31 | 30 | 32 | 32 | 31 | 30 | 30 |

## Army value (credits + energy of living units), medians at minute (sides still playing)

| faction | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 15 |
|---|---|---|---|---|---|---|---|---|---|
| Last Fist | 45 | 383 | 1135 | 1498 | 1910 | 2460 | 3168 | 3533 | 3455 |
| Bloomhost | 123 | 288 | 875 | 1183 | 1293 | 1380 | 1630 | 2133 | 1917 |
| Axiarchs | 160 | 400 | 770 | 1123 | 1370 | 1925 | 1855 | 2285 | 2650 |

Paired in the same match (median of Last Fist minus the opponent), by opponent:

| opponent | measure | 2 | 3 | 4 | 5 | 6 | 8 | 10 |
|---|---|---|---|---|---|---|---|---|
| Bloomhost | income | 2 | 4 | 7 | 9 | 7 | -1 | 3 |
| Bloomhost | army | -78 | 68 | 315 | 560 | 773 | 1388 | 1459 |
| Axiarchs | income | 0 | 0 | -7 | -2 | -7 | -8 | -5 |
| Axiarchs | army | -115 | -60 | 145 | 188 | 310 | -15 | 85 |

## Economy and spending (medians per side over the match; credits + energy)

| faction | earned | per minute | units | buildings | upgrades | tier 2 at | tier 3 at | first T3 unit | peak units |
|---|---|---|---|---|---|---|---|---|---|
| Last Fist | 27395 | 1792 | 17280 | 2240 | 6530 | 1:49 | 3:32 | 7:10 | 31 |
| Bloomhost | 23692 | 1589 | 13868 | 2360 | 4890 | 2:16 | 3:55 | 7:22 | 27 |
| Axiarchs | 21811 | 1600 | 12185 | 2285 | 5160 | 2:05 | 3:53 | 7:56 | 14 |

## When matches are decided

"Decided at": the first minute after which the winner's army value stays ahead of the loser's at every later minute sample to the end ("lead never lost"). "Lead at decision": the winner's army minus the loser's then.

| pairing | winner | matches | decided at (median) | lead at decision | income lead then | match length |
|---|---|---|---|---|---|---|
| Last Fist vs Bloomhost | Last Fist | 32 | 3:00 | 361 | 11 | 14:10 |
| Last Fist vs Bloomhost | Bloomhost | 6 | 9:00 | 387 | 17 | 14:54 |
| Last Fist vs Axiarchs | Last Fist | 18 | 3:00 | 275 | 9 | 14:27 |
| Last Fist vs Axiarchs | Axiarchs | 13 | 7:00 | 435 | 10 | 10:33 |
| Bloomhost vs Axiarchs | Bloomhost | 20 | 6:30 | 206 | 11 | 14:49 |
| Bloomhost vs Axiarchs | Axiarchs | 15 | 3:00 | 382 | 8 | 15:06 |

## Damage matrix: who deals damage to what (totals over the run, per faction pairing; top dealers, each with its three main targets and its share of its side's damage)

**Last Fist against Bloomhost** (42 sides, 21650 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| tank | 15% | 2312 | 977 | bulwark 43%, thornback 5%, spitter 4% |
| B:hq | 12% | 2613 | 0 | bulwark 53%, ruinmaw 13%, razorwing 5% |
| aircraft | 12% | 2260 | 262 | bulwark 56%, razorwing 5%, dreadthorn 5% |
| heavy | 11% | 1861 | 611 | bulwark 50%, razorwing 7%, titan 4% |
| rifle | 11% | 1922 | 549 | bulwark 19%, skitterling 12%, razorwing 9% |
| artillery | 10% | 1370 | 786 | bulwark 24%, spitter 14%, thornback 6% |
| sniper | 7% | 982 | 447 | spitter 17%, bulwark 16%, skitterling 7% |
| titan | 6% | 720 | 569 | bulwark 37%, thornback 3%, ruinmaw 3% |
| ?orbital | 4% | 641 | 232 | bulwark 19%, spitter 16%, razorwing 8% |
| hydra | 3% | 521 | 232 | bulwark 36%, razorwing 12%, needlewing 5% |

**Last Fist against Axiarchs** (36 sides, 24260 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| aircraft | 19% | 4040 | 641 | bastion 40%, riftstalker 11%, shardling 9% |
| B:hq | 14% | 3396 | 0 | bastion 45%, gravemantle 9%, shardling 8% |
| tank | 14% | 2386 | 912 | bastion 26%, riftstalker 16%, shardling 14% |
| rifle | 12% | 2292 | 682 | shardling 28%, riftstalker 22%, bastion 10% |
| ?orbital | 10% | 1888 | 419 | lancer 30%, bastion 29%, gravemantle 6% |
| heavy | 7% | 1097 | 563 | bastion 40%, shardling 7%, riftstalker 4% |
| artillery | 5% | 1082 | 218 | bastion 38%, gravemantle 16%, riftstalker 13% |
| flame | 4% | 579 | 353 | shardling 30%, bastion 12%, lancer 8% |
| B:turret | 4% | 898 | 0 | bastion 33%, shardling 18%, riftstalker 12% |
| hydra | 3% | 527 | 176 | bastion 27%, shardling 15%, voidcarrier 9% |

**Bloomhost against Last Fist** (42 sides, 10902 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| B:hq | 34% | 3704 | 0 | tank 23%, titan 18%, aircraft 13% |
| bulwark | 13% | 799 | 623 | rifle 19%, tank 11%, heavy 9% |
| spitter | 12% | 1144 | 198 | rifle 21%, tank 18%, titan 12% |
| razorwing | 8% | 828 | 52 | rifle 28%, tank 14%, titan 13% |
| needlewing | 5% | 517 | 8 | aircraft 30%, rifle 29%, tank 14% |
| B:turret | 4% | 483 | 0 | rifle 40%, heavy 14%, titan 12% |
| skitterling | 4% | 243 | 177 | rifle 38%, tank 7%, heavy 6% |
| acid pools | 3% | 341 | 0 | heavy 44%, tank 24%, rifle 24% |
| gorebore | 3% | 173 | 157 | rifle 28%, heavy 10%, tank 7% |
| leaper | 3% | 231 | 48 | tank 28%, rifle 27%, titan 8% |

**Axiarchs against Last Fist** (36 sides, 15583 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| B:hq | 21% | 3319 | 0 | tank 20%, flame 20%, aircraft 19% |
| lancer | 15% | 1489 | 874 | rifle 20%, flame 13%, aircraft 9% |
| bastion | 13% | 892 | 1065 | rifle 17%, flame 13%, tank 6% |
| ?beam | 13% | 789 | 1166 | rifle 19%, heavy 10%, tank 6% |
| B:turret | 8% | 1276 | 0 | rifle 50%, tank 11%, aircraft 10% |
| riftstalker | 6% | 699 | 203 | rifle 33%, tank 27%, heavy 12% |
| shardling | 6% | 628 | 236 | rifle 52%, tank 10%, heavy 8% |
| wraithwing | 4% | 491 | 58 | rifle 26%, aircraft 20%, tank 20% |
| worldbreaker | 3% | 136 | 367 | rifle 14%, tank 4%, titan 4% |
| marksman | 3% | 208 | 254 | rifle 26%, tank 10%, titan 3% |

**Bloomhost against Axiarchs** (36 sides, 21096 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| spitter | 19% | 2827 | 1218 | shardling 21%, wraithwing 12%, lancer 8% |
| bulwark | 15% | 1440 | 1759 | shardling 22%, lancer 9%, bastion 5% |
| razorwing | 14% | 2249 | 751 | shardling 23%, bastion 15%, lancer 11% |
| B:hq | 13% | 2843 | 0 | bastion 22%, prismwing 15%, shardling 11% |
| skitterling | 7% | 653 | 735 | shardling 18%, lancer 14%, bastion 8% |
| needlewing | 6% | 1088 | 270 | lancer 19%, shardling 17%, bastion 15% |
| B:turret | 5% | 1142 | 0 | shardling 24%, gravemantle 15%, wraithwing 13% |
| thornback | 3% | 289 | 343 | shardling 16%, lancer 11%, bastion 7% |
| leaper | 3% | 565 | 62 | bastion 31%, shardling 23%, lancer 18% |
| acid pools | 3% | 606 | 0 | shardling 36%, lancer 30%, bastion 20% |

**Axiarchs against Bloomhost** (36 sides, 23552 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| B:hq | 26% | 6210 | 0 | bulwark 52%, razorwing 11%, ruinmaw 9% |
| B:turret | 18% | 4173 | 0 | bulwark 31%, ruinmaw 13%, razorwing 11% |
| lancer | 14% | 2418 | 857 | bulwark 28%, razorwing 10%, thornback 7% |
| wraithwing | 8% | 1766 | 206 | bulwark 37%, ruinmaw 12%, skitterling 8% |
| shardling | 7% | 1444 | 95 | bulwark 50%, skitterling 19%, spitter 7% |
| ?beam | 6% | 403 | 927 | spitter 13%, bilecaster 5%, bulwark 3% |
| prismwing | 6% | 1169 | 134 | bulwark 54%, thornback 9%, ravager 8% |
| bastion | 3% | 495 | 144 | bulwark 43%, ruinmaw 7%, dreadthorn 6% |
| worldbreaker | 3% | 161 | 476 | bulwark 20%, thornback 2%, skitterling 2% |
| gravemantle | 2% | 296 | 143 | bulwark 47%, spitter 7%, skitterling 6% |

## Units: damage and killed value per 100 spent, trained, and their share of the faction's damage in matches it won

**Last Fist** (78 sides; damage in its wins 2301528):

| unit | damage per 100 spent | killed value per 100 spent | trained | sides | spent | share of damage in wins |
|---|---|---|---|---|---|---|
| rifle | 163 | 62 | 6171 | 78 | 277695 | 14% |
| aircraft | 203 | 59 | 736 | 57 | 239200 | 12% |
| tank | 247 | 55 | 649 | 77 | 236885 | 18% |
| heavy | 219 | 55 | 1096 | 44 | 191800 | 13% |
| flame | 124 | 36 | 388 | 41 | 93120 | 3% |
| artillery | 362 | 69 | 345 | 33 | 81075 | 9% |
| titan | 267 | 50 | 92 | 25 | 53360 | 5% |
| sniper | 461 | 161 | 172 | 37 | 36120 | 6% |
| medic | 0 | 0 | 148 | 25 | 35520 | 0% |
| interceptor | 211 | 198 | 137 | 22 | 28770 | 1% |
| hydra | 472 | 155 | 51 | 28 | 25500 | 5% |
| drone | 0 | 0 | 251 | 27 | 25100 | 0% |
| leviathan | 185 | 7 | 23 | 14 | 16560 | 1% |

Damage from buildings and abilities (per side): B:hq 5816, ?orbital 2812, B:turret 1578.

**Bloomhost** (78 sides; damage in its wins 1003610):

| unit | damage per 100 spent | killed value per 100 spent | trained | sides | spent | share of damage in wins |
|---|---|---|---|---|---|---|
| bulwark | 127 | 35 | 1661 | 78 | 274065 | 21% |
| razorwing | 122 | 58 | 1074 | 64 | 204060 | 15% |
| skitterling | 86 | 26 | 4268 | 78 | 174988 | 9% |
| needlewing | 70 | 38 | 1432 | 42 | 143200 | 6% |
| spitter | 242 | 115 | 1531 | 48 | 137790 | 20% |
| leaper | 87 | 41 | 773 | 27 | 77300 | 4% |
| bilecaster | 79 | 21 | 194 | 32 | 46560 | 3% |
| thornback | 95 | 22 | 208 | 35 | 45760 | 3% |
| dreadthorn | 65 | 21 | 59 | 25 | 30680 | 1% |
| gorebore | 109 | 34 | 132 | 25 | 30360 | 2% |
| ravager | 114 | 33 | 122 | 20 | 25620 | 2% |
| ruinmaw | 225 | 7 | 35 | 17 | 19250 | 2% |
| cloudwing | 53 | 12 | 39 | 18 | 12480 | 0% |
| broodtyrant | 208 | 58 | 12 | 9 | 5640 | 1% |
| worldrender | 100 | 5 | 2 | 2 | 1560 | 0% |

Damage from buildings and abilities (per side): B:hq 6973, B:turret 1760, acid pools 750, ?spores 528, mite 7.

**Axiarchs** (72 sides; damage in its wins 1100667):

| unit | damage per 100 spent | killed value per 100 spent | trained | sides | spent | share of damage in wins |
|---|---|---|---|---|---|---|
| shardling | 76 | 24 | 3059 | 72 | 244720 | 8% |
| lancer | 273 | 95 | 924 | 53 | 152460 | 19% |
| bastion | 119 | 30 | 433 | 67 | 149385 | 8% |
| riftstalker | 71 | 26 | 528 | 21 | 100320 | 2% |
| prismwing | 369 | 84 | 590 | 22 | 82600 | 23% |
| wraithwing | 188 | 65 | 244 | 47 | 80520 | 4% |
| gravemantle | 88 | 21 | 144 | 24 | 47520 | 2% |
| parallax | 58 | 11 | 117 | 17 | 36270 | 1% |
| severance | 56 | 10 | 109 | 30 | 33790 | 1% |
| marksman | 141 | 45 | 96 | 31 | 33600 | 2% |
| worldbreaker | 392 | 42 | 29 | 19 | 20590 | 6% |
| voidcarrier | 64 | 29 | 29 | 18 | 15370 | 0% |
| eventide | 95 | 31 | 24 | 15 | 14400 | 0% |
| sovereign | 301 | 27 | 12 | 9 | 10800 | 2% |
| shardstorm | 445 | 173 | 13 | 7 | 5330 | 1% |

Damage from buildings and abilities (per side): B:hq 7870, B:turret 3637, ?beam 3150.

