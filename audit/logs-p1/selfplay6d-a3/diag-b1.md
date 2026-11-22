# Batch 6d, B1: why Last Fist wins (selfplay6d-a3, 162 matches)

## Income (credits + energy per second), medians at minute (sides still playing)

| faction | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 15 |
|---|---|---|---|---|---|---|---|---|---|
| Last Fist | 23 | 30 | 38 | 45 | 42 | 41 | 42 | 38 | 36 |
| Bloomhost | 22 | 27 | 32 | 37 | 40 | 38 | 38 | 33 | 31 |
| Axiarchs | 22 | 33 | 38 | 40 | 40 | 39 | 39 | 34 | 32 |

## Army value (credits + energy of living units), medians at minute (sides still playing)

| faction | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 15 |
|---|---|---|---|---|---|---|---|---|---|
| Last Fist | 45 | 495 | 1573 | 1905 | 2040 | 2785 | 3810 | 4345 | 4348 |
| Bloomhost | 123 | 493 | 1189 | 1445 | 1445 | 1770 | 2181 | 2233 | 2315 |
| Axiarchs | 160 | 640 | 1070 | 1085 | 1423 | 1755 | 1930 | 1780 | 1895 |

Paired in the same match (median of Last Fist minus the opponent), by opponent:

| opponent | measure | 2 | 3 | 4 | 5 | 6 | 8 | 10 |
|---|---|---|---|---|---|---|---|---|
| Bloomhost | income | 2 | 3 | 8 | 9 | 3 | 5 | 6 |
| Bloomhost | army | -78 | 39 | 507 | 589 | 745 | 1285 | 2010 |
| Axiarchs | income | 2 | 0 | -1 | 7 | 5 | 1 | 4 |
| Axiarchs | army | -115 | -55 | 405 | 690 | 615 | 815 | 2065 |

## Economy and spending (medians per side over the match; credits + energy)

| faction | earned | per minute | units | buildings | upgrades | tier 2 at | tier 3 at | first T3 unit | peak units |
|---|---|---|---|---|---|---|---|---|---|
| Last Fist | 32372 | 2087 | 23105 | 2313 | 6905 | 0:59 | 3:19 | 7:08 | 35 |
| Bloomhost | 26905 | 1759 | 15823 | 2415 | 6360 | 0:59 | 3:09 | 8:15 | 29 |
| Axiarchs | 24636 | 1780 | 14010 | 2300 | 6100 | 0:59 | 3:27 | 6:05 | 14 |

## When matches are decided

"Decided at": the first minute after which the winner's army value stays ahead of the loser's at every later minute sample to the end ("lead never lost"). "Lead at decision": the winner's army minus the loser's then.

| pairing | winner | matches | decided at (median) | lead at decision | income lead then | match length |
|---|---|---|---|---|---|---|
| Last Fist vs Bloomhost | Last Fist | 43 | 5:00 | 600 | 6 | 15:21 |
| Last Fist vs Bloomhost | Bloomhost | 7 | 15:00 | 1379 | 4 | 21:02 |
| Last Fist vs Axiarchs | Last Fist | 40 | 3:00 | 403 | 4 | 13:01 |
| Last Fist vs Axiarchs | Axiarchs | 11 | 6:00 | 425 | 5 | 14:34 |
| Bloomhost vs Axiarchs | Bloomhost | 37 | 6:00 | 773 | 3 | 12:29 |
| Bloomhost vs Axiarchs | Axiarchs | 12 | 7:30 | 463 | -2 | 11:48 |

## Damage matrix: who deals damage to what (totals over the run, per faction pairing; top dealers, each with its three main targets and its share of its side's damage)

**Last Fist against Bloomhost** (54 sides, 62581 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| tank | 21% | 9647 | 3574 | bulwark 49%, skitterling 5%, dreadthorn 4% |
| heavy | 13% | 6599 | 1747 | bulwark 58%, razorwing 5%, dreadthorn 3% |
| rifle | 11% | 5655 | 1389 | bulwark 26%, skitterling 16%, razorwing 11% |
| artillery | 11% | 5218 | 1822 | bulwark 42%, skitterling 8%, spitter 6% |
| titan | 10% | 4184 | 2002 | bulwark 45%, dreadthorn 3%, skitterling 3% |
| B:hq | 9% | 5462 | 0 | bulwark 57%, ruinmaw 15%, razorwing 9% |
| sniper | 8% | 4257 | 977 | bulwark 18%, spitter 18%, skitterling 9% |
| aircraft | 4% | 2163 | 270 | bulwark 63%, spitter 4%, skitterling 3% |
| ?orbital | 4% | 1696 | 598 | bulwark 28%, spitter 18%, bilecaster 6% |
| flame | 3% | 1595 | 260 | bulwark 36%, skitterling 17%, spitter 6% |

**Last Fist against Axiarchs** (54 sides, 44710 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| tank | 25% | 6671 | 4386 | bastion 24%, shardling 12%, lancer 7% |
| rifle | 16% | 4749 | 2314 | shardling 28%, riftstalker 12%, lancer 7% |
| artillery | 9% | 3437 | 721 | bastion 33%, lancer 20%, gravemantle 10% |
| titan | 8% | 1707 | 1693 | bastion 26%, shardling 6%, lancer 5% |
| B:hq | 7% | 3346 | 0 | bastion 55%, shardling 12%, riftstalker 7% |
| heavy | 7% | 1966 | 1320 | bastion 26%, shardling 8%, riftstalker 5% |
| sniper | 6% | 1991 | 761 | shardling 21%, riftstalker 14%, lancer 13% |
| ?orbital | 6% | 2046 | 518 | bastion 34%, lancer 17%, marksman 8% |
| flame | 5% | 1732 | 674 | riftstalker 24%, shardling 22%, lancer 11% |
| aircraft | 4% | 1593 | 316 | bastion 43%, lancer 10%, shardling 10% |

**Bloomhost against Last Fist** (54 sides, 36345 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| B:hq | 34% | 12244 | 0 | tank 30%, titan 21%, flame 14% |
| bulwark | 15% | 4205 | 1090 | rifle 21%, tank 17%, heavy 17% |
| spitter | 10% | 3273 | 455 | rifle 18%, tank 17%, heavy 16% |
| razorwing | 8% | 2643 | 160 | rifle 26%, tank 22%, titan 18% |
| acid pools | 7% | 2595 | 0 | titan 25%, rifle 23%, tank 21% |
| gorebore | 4% | 1088 | 385 | rifle 30%, tank 13%, heavy 12% |
| B:turret | 4% | 1423 | 0 | rifle 27%, heavy 23%, tank 16% |
| ?spores | 4% | 1400 | 0 | rifle 44%, heavy 18%, artillery 13% |
| bilecaster | 4% | 1159 | 172 | rifle 29%, titan 16%, heavy 16% |
| skitterling | 4% | 1024 | 275 | rifle 44%, heavy 18%, tank 8% |

**Axiarchs against Last Fist** (54 sides, 30385 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| B:hq | 36% | 10827 | 0 | tank 27%, flame 22%, titan 14% |
| lancer | 15% | 3205 | 1416 | rifle 21%, tank 14%, flame 11% |
| ?beam | 11% | 2222 | 1069 | rifle 25%, tank 13%, heavy 11% |
| bastion | 10% | 1751 | 1356 | tank 14%, rifle 13%, heavy 11% |
| B:turret | 8% | 2510 | 0 | rifle 36%, flame 26%, tank 13% |
| shardling | 6% | 1405 | 333 | rifle 52%, tank 11%, heavy 9% |
| marksman | 5% | 935 | 476 | rifle 21%, tank 15%, flame 10% |
| riftstalker | 4% | 956 | 163 | rifle 34%, tank 22%, heavy 12% |
| wraithwing | 1% | 392 | 5 | tank 25%, rifle 25%, titan 19% |
| gravemantle | 1% | 170 | 100 | rifle 21%, tank 14%, heavy 12% |

**Bloomhost against Axiarchs** (54 sides, 37728 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| bulwark | 22% | 4116 | 4253 | shardling 17%, bastion 8%, riftstalker 5% |
| spitter | 15% | 3869 | 1739 | shardling 18%, prismwing 8%, lancer 8% |
| B:hq | 13% | 4923 | 0 | bastion 25%, shardling 12%, lancer 12% |
| skitterling | 12% | 2231 | 2286 | shardling 17%, lancer 8%, marksman 6% |
| razorwing | 9% | 2635 | 897 | shardling 24%, bastion 14%, lancer 8% |
| ?spores | 5% | 1844 | 0 | lancer 52%, bastion 12%, gravemantle 11% |
| B:turret | 4% | 1396 | 0 | shardling 28%, lancer 20%, bastion 10% |
| thornback | 3% | 634 | 544 | shardling 15%, lancer 10%, marksman 9% |
| leaper | 3% | 951 | 226 | gravemantle 16%, shardling 15%, bastion 15% |
| bilecaster | 3% | 580 | 503 | riftstalker 12%, lancer 10%, marksman 10% |

**Axiarchs against Bloomhost** (54 sides, 42550 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| B:hq | 28% | 11809 | 0 | bulwark 62%, razorwing 7%, ruinmaw 6% |
| lancer | 18% | 5475 | 2365 | bulwark 34%, thornback 7%, razorwing 7% |
| B:turret | 10% | 4058 | 0 | bulwark 48%, ruinmaw 12%, skitterling 10% |
| marksman | 8% | 2663 | 638 | bulwark 22%, thornback 20%, bilecaster 10% |
| shardling | 8% | 2783 | 446 | bulwark 40%, skitterling 25%, thornback 4% |
| ?beam | 7% | 1610 | 1464 | bulwark 16%, spitter 12%, bilecaster 7% |
| bastion | 6% | 1930 | 596 | bulwark 50%, thornback 7%, skitterling 6% |
| wraithwing | 3% | 821 | 450 | bulwark 32%, ruinmaw 7%, ravager 6% |
| riftstalker | 3% | 1182 | 53 | bulwark 49%, skitterling 13%, bilecaster 8% |
| prismwing | 2% | 778 | 128 | bulwark 38%, ruinmaw 17%, thornback 11% |

## Units: damage and killed value per 100 spent, trained, and their share of the faction's damage in matches it won

**Last Fist** (108 sides; damage in its wins 4219914):

| unit | damage per 100 spent | killed value per 100 spent | trained | sides | spent | share of damage in wins |
|---|---|---|---|---|---|---|
| tank | 242 | 54 | 1487 | 108 | 542755 | 24% |
| rifle | 164 | 59 | 10317 | 108 | 464265 | 14% |
| heavy | 157 | 36 | 2280 | 69 | 399000 | 11% |
| flame | 107 | 38 | 898 | 54 | 215520 | 4% |
| titan | 262 | 55 | 341 | 49 | 197780 | 10% |
| aircraft | 139 | 39 | 519 | 28 | 168675 | 4% |
| artillery | 400 | 94 | 643 | 52 | 151105 | 10% |
| sniper | 362 | 151 | 568 | 60 | 119280 | 8% |
| hydra | 280 | 91 | 128 | 42 | 64000 | 4% |
| medic | 0 | 0 | 95 | 13 | 22800 | 0% |
| drone | 0 | 0 | 168 | 13 | 16800 | 0% |
| interceptor | 75 | 84 | 53 | 6 | 11130 | 0% |
| leviathan | 72 | 3 | 9 | 7 | 6480 | 0% |

Damage from buildings and abilities (per side): B:hq 4404, ?orbital 2429, B:turret 1336.

**Bloomhost** (108 sides; damage in its wins 1856794):

| unit | damage per 100 spent | killed value per 100 spent | trained | sides | spent | share of damage in wins |
|---|---|---|---|---|---|---|
| bulwark | 165 | 56 | 2716 | 108 | 448140 | 24% |
| skitterling | 107 | 33 | 7156 | 108 | 293396 | 12% |
| razorwing | 159 | 70 | 1135 | 62 | 215650 | 10% |
| spitter | 240 | 106 | 2330 | 76 | 209700 | 17% |
| bilecaster | 64 | 20 | 846 | 58 | 203040 | 4% |
| leaper | 101 | 42 | 999 | 43 | 99900 | 2% |
| gorebore | 139 | 63 | 368 | 44 | 84640 | 5% |
| thornback | 100 | 42 | 359 | 50 | 78980 | 3% |
| needlewing | 82 | 36 | 698 | 36 | 69800 | 2% |
| dreadthorn | 57 | 23 | 129 | 37 | 67080 | 1% |
| ruinmaw | 165 | 6 | 67 | 34 | 36850 | 2% |
| ravager | 121 | 45 | 137 | 29 | 28770 | 1% |
| cloudwing | 66 | 46 | 64 | 16 | 20480 | 1% |
| broodtyrant | 170 | 36 | 20 | 16 | 9400 | 1% |
| worldrender | 28 | 0 | 4 | 4 | 3120 | 0% |

Damage from buildings and abilities (per side): B:hq 8584, acid pools 1804, ?spores 1622, B:turret 1409, mite 26.

**Axiarchs** (108 sides; damage in its wins 950148):

| unit | damage per 100 spent | killed value per 100 spent | trained | sides | spent | share of damage in wins |
|---|---|---|---|---|---|---|
| shardling | 78 | 27 | 4309 | 108 | 344720 | 10% |
| lancer | 267 | 91 | 1525 | 76 | 251625 | 30% |
| bastion | 136 | 34 | 650 | 80 | 224250 | 19% |
| marksman | 125 | 42 | 580 | 49 | 203000 | 5% |
| riftstalker | 64 | 27 | 1040 | 43 | 197600 | 2% |
| gravemantle | 73 | 19 | 189 | 39 | 62370 | 2% |
| severance | 59 | 9 | 156 | 27 | 48360 | 1% |
| prismwing | 135 | 41 | 333 | 10 | 46620 | 1% |
| parallax | 62 | 20 | 134 | 31 | 41540 | 1% |
| wraithwing | 260 | 84 | 105 | 17 | 34650 | 1% |
| eventide | 154 | 40 | 52 | 27 | 31200 | 3% |
| worldbreaker | 200 | 42 | 28 | 17 | 19880 | 2% |
| sovereign | 371 | 52 | 6 | 3 | 5400 | 1% |
| shardstorm | 479 | 152 | 13 | 6 | 5330 | 1% |
| voidcarrier | 94 | 27 | 9 | 5 | 4770 | 0% |

Damage from buildings and abilities (per side): B:hq 11318, B:turret 3284, ?beam 3183.

