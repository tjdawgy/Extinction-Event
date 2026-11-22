# Batch 6d, B1: why Last Fist wins (selfplay6d-base, 162 matches)

## Income (credits + energy per second), medians at minute (sides still playing)

| faction | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 15 |
|---|---|---|---|---|---|---|---|---|---|
| Last Fist | 16 | 23 | 27 | 34 | 36 | 33 | 37 | 38 | 32 |
| Bloomhost | 14 | 18 | 24 | 30 | 32 | 36 | 38 | 40 | 42 |
| Axiarchs | 20 | 25 | 29 | 31 | 32 | 32 | 31 | 32 | 32 |

## Army value (credits + energy of living units), medians at minute (sides still playing)

| faction | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 15 |
|---|---|---|---|---|---|---|---|---|---|
| Last Fist | 45 | 293 | 960 | 1405 | 1850 | 2415 | 3160 | 3460 | 3690 |
| Bloomhost | 123 | 247 | 851 | 1205 | 1342 | 1587 | 1885 | 2238 | 2210 |
| Axiarchs | 160 | 320 | 720 | 1050 | 1315 | 1795 | 1768 | 2055 | 2088 |

Paired in the same match (median of Last Fist minus the opponent), by opponent:

| opponent | measure | 2 | 3 | 4 | 5 | 6 | 8 | 10 |
|---|---|---|---|---|---|---|---|---|
| Bloomhost | income | 2 | 3 | 6 | 7 | 3 | -1 | 2 |
| Bloomhost | army | -78 | 19 | 156 | 427 | 724 | 1222 | 1143 |
| Axiarchs | income | 0 | 0 | -1 | -1 | -2 | -5 | -2 |
| Axiarchs | army | -115 | -95 | 138 | 195 | 310 | 510 | 620 |

## Economy and spending (medians per side over the match; credits + energy)

| faction | earned | per minute | units | buildings | upgrades | tier 2 at | tier 3 at | first T3 unit | peak units |
|---|---|---|---|---|---|---|---|---|---|
| Last Fist | 28393 | 1792 | 18563 | 2400 | 6640 | 1:58 | 3:33 | 7:22 | 31 |
| Bloomhost | 23857 | 1658 | 14163 | 2393 | 5740 | 2:15 | 3:53 | 7:22 | 29 |
| Axiarchs | 22104 | 1617 | 12823 | 2360 | 5570 | 2:09 | 3:59 | 7:50 | 15 |

## When matches are decided

"Decided at": the first minute after which the winner's army value stays ahead of the loser's at every later minute sample to the end ("lead never lost"). "Lead at decision": the winner's army minus the loser's then.

| pairing | winner | matches | decided at (median) | lead at decision | income lead then | match length |
|---|---|---|---|---|---|---|
| Last Fist vs Bloomhost | Last Fist | 39 | 3:00 | 430 | 10 | 14:19 |
| Last Fist vs Bloomhost | Bloomhost | 8 | 10:00 | 948 | 17 | 16:11 |
| Last Fist vs Axiarchs | Last Fist | 31 | 3:00 | 420 | 7 | 14:29 |
| Last Fist vs Axiarchs | Axiarchs | 17 | 7:00 | 440 | 11 | 10:33 |
| Bloomhost vs Axiarchs | Bloomhost | 31 | 6:00 | 399 | 11 | 15:11 |
| Bloomhost vs Axiarchs | Axiarchs | 20 | 3:00 | 379 | 11 | 11:49 |

## Damage matrix: who deals damage to what (totals over the run, per faction pairing; top dealers, each with its three main targets and its share of its side's damage)

**Last Fist against Bloomhost** (54 sides, 31226 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| B:hq | 15% | 4570 | 0 | bulwark 50%, ruinmaw 11%, razorwing 8% |
| tank | 14% | 2969 | 1326 | bulwark 39%, spitter 6%, ruinmaw 4% |
| aircraft | 13% | 3686 | 391 | bulwark 56%, thornback 5%, razorwing 5% |
| heavy | 12% | 2947 | 892 | bulwark 50%, razorwing 7%, needlewing 4% |
| rifle | 10% | 2585 | 511 | bulwark 18%, skitterling 11%, razorwing 11% |
| artillery | 9% | 1995 | 722 | bulwark 30%, spitter 16%, skitterling 7% |
| titan | 6% | 1052 | 931 | bulwark 34%, spitter 3%, gorebore 3% |
| sniper | 6% | 1346 | 414 | spitter 21%, bulwark 16%, skitterling 7% |
| ?orbital | 4% | 844 | 283 | bulwark 19%, spitter 18%, razorwing 8% |
| flame | 3% | 882 | 79 | leaper 17%, bulwark 17%, ravager 16% |

**Last Fist against Axiarchs** (54 sides, 32345 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| aircraft | 18% | 4986 | 775 | bastion 41%, shardling 9%, riftstalker 7% |
| tank | 14% | 2754 | 1893 | bastion 24%, shardling 11%, riftstalker 9% |
| B:hq | 14% | 4589 | 0 | bastion 35%, shardling 12%, lancer 10% |
| rifle | 12% | 3066 | 922 | shardling 26%, riftstalker 13%, bastion 8% |
| artillery | 7% | 1975 | 258 | bastion 39%, lancer 15%, gravemantle 11% |
| ?orbital | 7% | 1682 | 477 | bastion 29%, lancer 26%, gravemantle 5% |
| heavy | 6% | 1201 | 693 | bastion 33%, shardling 6%, titan 5% |
| hydra | 5% | 945 | 574 | bastion 20%, shardling 14%, prismwing 7% |
| sniper | 4% | 1074 | 310 | shardling 29%, lancer 20%, bastion 10% |
| flame | 4% | 740 | 396 | shardling 33%, bastion 10%, riftstalker 9% |

**Bloomhost against Last Fist** (54 sides, 15801 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| B:hq | 27% | 4247 | 0 | tank 24%, titan 22%, aircraft 12% |
| spitter | 15% | 1954 | 409 | rifle 18%, aircraft 14%, tank 14% |
| bulwark | 13% | 1230 | 836 | rifle 16%, heavy 13%, tank 12% |
| razorwing | 11% | 1535 | 140 | rifle 22%, tank 21%, titan 18% |
| needlewing | 6% | 837 | 44 | rifle 24%, aircraft 21%, tank 19% |
| B:turret | 4% | 672 | 0 | rifle 30%, heavy 13%, tank 13% |
| gorebore | 4% | 376 | 274 | rifle 26%, heavy 9%, tank 7% |
| skitterling | 3% | 322 | 231 | rifle 33%, heavy 12%, tank 7% |
| acid pools | 3% | 504 | 0 | heavy 41%, rifle 24%, tank 20% |
| ?spores | 2% | 394 | 0 | rifle 42%, heavy 23%, artillery 20% |

**Axiarchs against Last Fist** (54 sides, 19916 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| B:hq | 26% | 5255 | 0 | tank 27%, aircraft 16%, flame 14% |
| lancer | 16% | 2223 | 903 | rifle 18%, tank 12%, aircraft 10% |
| ?beam | 12% | 832 | 1562 | rifle 14%, heavy 8%, tank 6% |
| bastion | 11% | 1111 | 1038 | rifle 18%, flame 11%, tank 10% |
| B:turret | 7% | 1434 | 0 | rifle 38%, tank 13%, heavy 13% |
| shardling | 6% | 1034 | 252 | rifle 48%, titan 11%, tank 10% |
| riftstalker | 5% | 722 | 176 | rifle 30%, tank 27%, heavy 12% |
| wraithwing | 4% | 665 | 100 | rifle 26%, aircraft 16%, tank 16% |
| worldbreaker | 2% | 154 | 325 | rifle 18%, tank 6%, hydra 4% |
| marksman | 2% | 267 | 195 | rifle 27%, tank 11%, heavy 8% |

**Bloomhost against Axiarchs** (54 sides, 26274 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| spitter | 19% | 3448 | 1550 | shardling 20%, wraithwing 10%, lancer 8% |
| B:hq | 16% | 4100 | 0 | bastion 23%, shardling 13%, lancer 11% |
| razorwing | 15% | 3104 | 959 | shardling 21%, bastion 14%, lancer 12% |
| bulwark | 13% | 1592 | 1831 | shardling 21%, lancer 9%, bastion 6% |
| skitterling | 6% | 753 | 748 | shardling 19%, lancer 15%, bastion 9% |
| B:turret | 5% | 1364 | 0 | shardling 25%, lancer 22%, bastion 10% |
| needlewing | 4% | 906 | 219 | lancer 19%, shardling 17%, bastion 13% |
| ?spores | 3% | 814 | 0 | lancer 57%, shardling 15%, marksman 11% |
| leaper | 3% | 691 | 98 | bastion 25%, gravemantle 18%, shardling 16% |
| thornback | 3% | 290 | 458 | shardling 14%, lancer 12%, bastion 6% |

**Axiarchs against Bloomhost** (54 sides, 27733 damage per side):

| dealer | share | to units | to buildings | main targets |
|---|---|---|---|---|
| B:hq | 27% | 7387 | 0 | bulwark 47%, razorwing 12%, ruinmaw 6% |
| lancer | 20% | 4110 | 1498 | bulwark 23%, razorwing 14%, thornback 7% |
| B:turret | 14% | 3776 | 0 | bulwark 29%, razorwing 13%, ruinmaw 11% |
| shardling | 7% | 1665 | 194 | bulwark 42%, skitterling 18%, spitter 8% |
| wraithwing | 6% | 1549 | 197 | bulwark 35%, ruinmaw 10%, razorwing 8% |
| ?beam | 6% | 536 | 1100 | spitter 15%, bilecaster 5%, bulwark 4% |
| prismwing | 4% | 992 | 174 | bulwark 45%, thornback 10%, skitterling 7% |
| worldbreaker | 4% | 426 | 649 | bulwark 18%, leaper 7%, skitterling 6% |
| bastion | 3% | 594 | 260 | bulwark 40%, skitterling 6%, thornback 5% |
| marksman | 3% | 311 | 398 | thornback 11%, bulwark 9%, spitter 9% |

## Units: damage and killed value per 100 spent, trained, and their share of the faction's damage in matches it won

**Last Fist** (108 sides; damage in its wins 3441802):

| unit | damage per 100 spent | killed value per 100 spent | trained | sides | spent | share of damage in wins |
|---|---|---|---|---|---|---|
| rifle | 165 | 62 | 8441 | 108 | 379845 | 13% |
| aircraft | 211 | 65 | 1081 | 81 | 351325 | 13% |
| tank | 236 | 50 | 943 | 106 | 344195 | 17% |
| heavy | 208 | 53 | 1554 | 61 | 271950 | 13% |
| flame | 141 | 42 | 516 | 52 | 123840 | 4% |
| artillery | 375 | 75 | 480 | 50 | 112800 | 8% |
| titan | 266 | 42 | 145 | 41 | 84100 | 5% |
| sniper | 414 | 158 | 292 | 54 | 61320 | 6% |
| medic | 0 | 0 | 218 | 37 | 52320 | 0% |
| interceptor | 206 | 200 | 237 | 34 | 49770 | 2% |
| drone | 0 | 0 | 387 | 39 | 38700 | 0% |
| hydra | 485 | 160 | 77 | 39 | 38500 | 5% |
| leviathan | 144 | 8 | 38 | 25 | 27360 | 1% |

Damage from buildings and abilities (per side): B:hq 6631, ?orbital 2566, B:turret 1651.

**Bloomhost** (108 sides; damage in its wins 1582675):

| unit | damage per 100 spent | killed value per 100 spent | trained | sides | spent | share of damage in wins |
|---|---|---|---|---|---|---|
| bulwark | 130 | 36 | 2183 | 108 | 360195 | 18% |
| razorwing | 126 | 56 | 1727 | 91 | 328130 | 15% |
| skitterling | 82 | 25 | 5728 | 108 | 234848 | 8% |
| spitter | 244 | 118 | 2410 | 75 | 216900 | 21% |
| needlewing | 67 | 36 | 2055 | 57 | 205500 | 4% |
| leaper | 91 | 39 | 1021 | 38 | 102100 | 4% |
| bilecaster | 74 | 20 | 299 | 51 | 71760 | 2% |
| thornback | 97 | 22 | 311 | 51 | 68420 | 3% |
| gorebore | 118 | 47 | 213 | 37 | 48990 | 2% |
| dreadthorn | 69 | 19 | 90 | 37 | 46800 | 1% |
| ravager | 141 | 45 | 185 | 29 | 38850 | 2% |
| ruinmaw | 197 | 7 | 53 | 25 | 29150 | 2% |
| cloudwing | 57 | 18 | 63 | 28 | 20160 | 0% |
| broodtyrant | 246 | 44 | 28 | 19 | 13160 | 2% |
| worldrender | 245 | 1 | 9 | 8 | 7020 | 1% |

Damage from buildings and abilities (per side): B:hq 6822, B:turret 1720, ?spores 778, acid pools 749, mite 29.

**Axiarchs** (108 sides; damage in its wins 1365803):

| unit | damage per 100 spent | killed value per 100 spent | trained | sides | spent | share of damage in wins |
|---|---|---|---|---|---|---|
| shardling | 72 | 23 | 4698 | 108 | 375840 | 9% |
| lancer | 262 | 100 | 1585 | 86 | 261525 | 21% |
| bastion | 112 | 29 | 642 | 98 | 221490 | 9% |
| prismwing | 257 | 60 | 931 | 33 | 130340 | 19% |
| riftstalker | 74 | 28 | 625 | 29 | 118750 | 3% |
| wraithwing | 168 | 59 | 353 | 69 | 116490 | 4% |
| gravemantle | 74 | 18 | 197 | 37 | 65010 | 2% |
| severance | 58 | 11 | 182 | 48 | 56420 | 2% |
| marksman | 158 | 46 | 153 | 51 | 53550 | 3% |
| parallax | 66 | 14 | 139 | 23 | 43090 | 2% |
| worldbreaker | 348 | 48 | 50 | 33 | 35500 | 7% |
| voidcarrier | 84 | 43 | 39 | 27 | 20670 | 1% |
| eventide | 92 | 29 | 31 | 21 | 18600 | 1% |
| sovereign | 241 | 24 | 17 | 14 | 15300 | 2% |
| shardstorm | 357 | 141 | 20 | 11 | 8200 | 1% |

Damage from buildings and abilities (per side): B:hq 8391, B:turret 3214, ?beam 3020.

