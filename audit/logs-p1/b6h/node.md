# Batch 6h, Part G: the Bloomhost node contest in the forced-turret scenario (audit/sim/b6g-scen.js --set nodes, 36 matches each)

Runs: nodes-diag = v2.97 (all three 6h switches off; the same 36 matches 6g measured); nodes-nofix = b6h and b6hbody on, b6hnode off;
nodes-after = b6hnode v1 (whole-army assault, raw power, no capture groups at guarded nodes); nodes-v2 = v1 with its power at building rate;
nodes-v3 = a strike group, building-breakers first, edge 1.2, building-breaker scores; nodes-v4 (shipped) = v2 with v3's scores and the capture groups and raids allowed again.
Tables: audit/sim/b6h-node-report.js.

## audit/logs-p1/b6h/nodes-diag (36 matches)

- Results for Bloomhost (won-lost-drawn): 1-30-5; retakes 94; enemy pad buildings destroyed 1059.
- Assault decisions (6g's aiNode6g, or 6h's): 9558 candidate checks, 88 launched (0.9%); held back: 9466 short of force, 4 too few units. Force it could send ÷ force needed (quartiles): 0.15 / 0.26 / 0.40.
- Assault outcomes: allin 24, hurt 5, threat 38, won 4, calledOff 17.
- Assault units by type: bulwark 353, skitterling 104, spitter 77, leaper 38, gorebore 30, thornback 25, bilecaster 19, dreadthorn 9, ravager 6, ruinmaw 5.
- Assault units killed: 122 (by guns 48, by units 74, other 0); top killers: gun:turret 48, titan 14, heavy 12, tank 12, rifle 11, artillery 7, aircraft 5, sniper 5.
- Every group sent at a gun-covered node (capture groups, raids, assaults): 1037, 52 took it (5.0%); mean group value 289, mean gun health there 3124.

## audit/logs-p1/b6h/nodes-nofix (36 matches)

- Results for Bloomhost (won-lost-drawn): 3-23-10; retakes 146; enemy pad buildings destroyed 1039.
- Assault decisions (6g's aiNode6g, or 6h's): 9832 candidate checks, 127 launched (1.3%); held back: 9704 short of force, 1 too few units. Force it could send ÷ force needed (quartiles): 0.19 / 0.30 / 0.45.
- Assault outcomes: threat 43, allin 42, calledOff 26, hurt 9, won 7.
- Assault units by type: bulwark 458, skitterling 160, spitter 154, bilecaster 72, queen 53, broodback 39, gorebore 38, dreadthorn 22, leaper 14, ruinmaw 7.
- Assault units killed: 208 (by guns 115, by units 93, other 0); top killers: gun:turret 114, titan 17, tank 17, heavy 14, sniper 13, artillery 10, aircraft 8, rifle 8.
- Every group sent at a gun-covered node (capture groups, raids, assaults): 1299, 65 took it (5.0%); mean group value 325, mean gun health there 3031.

## audit/logs-p1/b6h/nodes-after (36 matches)

- Results for Bloomhost (won-lost-drawn): 3-27-6; retakes 129; enemy pad buildings destroyed 824.
- Assault decisions (6g's aiNode6g, or 6h's): 5998 candidate checks, 475 launched (7.9%); held back: 5514 short of force, 9 too few units. Force it could send ÷ force needed (quartiles): 0.34 / 0.53 / 0.78.
- Assault outcomes: hurt 175, calledOff 106, threat 157, won 32, time 5.
- Assault units by type: spitter 1610, skitterling 1475, bulwark 1172, queen 239, bilecaster 210, gorebore 132, broodback 128, leaper 73, ruinmaw 37, dreadthorn 31, ravager 6.
- Assault units killed: 2095 (by guns 1128, by units 967, other 0); top killers: gun:turret 1124, rifle 184, tank 174, sniper 151, flame 119, orbital 80, heavy 65, aircraft 64.
- Every group sent at a gun-covered node (capture groups, raids, assaults): 644, 87 took it (13.5%); mean group value 929, mean gun health there 2424.

## audit/logs-p1/b6h/nodes-v2 (36 matches)

- Results for Bloomhost (won-lost-drawn): 3-29-4; retakes 138; enemy pad buildings destroyed 904.
- Assault decisions (6g's aiNode6g, or 6h's): 10359 candidate checks, 469 launched (4.5%); held back: 9861 short of force, 29 too few units. Force it could send ÷ force needed (quartiles): 0.33 / 0.50 / 0.72.
- Assault outcomes: calledOff 126, hurt 131, threat 171, won 38, time 3.
- Assault units by type: spitter 1634, skitterling 1567, bulwark 1248, queen 258, bilecaster 192, broodback 166, gorebore 110, leaper 92, dreadthorn 52, ruinmaw 47, ravager 9.
- Assault units killed: 2074 (by guns 1073, by units 1001, other 0); top killers: gun:turret 1069, sniper 215, rifle 177, tank 157, flame 105, aircraft 77, heavy 75, artillery 59.
- Every group sent at a gun-covered node (capture groups, raids, assaults): 632, 99 took it (15.7%); mean group value 989, mean gun health there 2344.

## audit/logs-p1/b6h/nodes-v3 (36 matches)

- Results for Bloomhost (won-lost-drawn): 0-29-7; retakes 97; enemy pad buildings destroyed 937.
- Assault decisions (6g's aiNode6g, or 6h's): 9175 candidate checks, 515 launched (5.6%); held back: 8647 short of force, 13 too few units. Force it could send ÷ force needed (quartiles): 0.29 / 0.45 / 0.67.
- Assault outcomes: calledOff 196, hurt 137, won 17, threat 159, time 3, dead 1.
- Assault units by type: bulwark 1094, skitterling 944, spitter 761, broodback 246, gorebore 218, queen 214, bilecaster 139, leaper 40, dreadthorn 30, ruinmaw 11, ravager 6.
- Assault units killed: 1317 (by guns 674, by units 643, other 0); top killers: gun:turret 674, tank 141, rifle 108, sniper 105, flame 60, heavy 57, titan 50, artillery 46.
- Every group sent at a gun-covered node (capture groups, raids, assaults): 696, 73 took it (10.5%); mean group value 763, mean gun health there 2360.

## audit/logs-p1/b6h/nodes-v4 (36 matches)

- Results for Bloomhost (won-lost-drawn): 2-28-6; retakes 144; enemy pad buildings destroyed 988.
- Assault decisions (6g's aiNode6g, or 6h's): 9187 candidate checks, 486 launched (5.3%); held back: 8690 short of force, 11 too few units. Force it could send ÷ force needed (quartiles): 0.29 / 0.47 / 0.68.
- Assault outcomes: calledOff 138, hurt 147, threat 156, won 41, time 1.
- Assault units by type: spitter 1834, bulwark 1314, skitterling 1173, broodback 265, leaper 213, gorebore 190, queen 187, bilecaster 185, dreadthorn 45, ravager 28, ruinmaw 17.
- Assault units killed: 2121 (by guns 1147, by units 974, other 0); top killers: gun:turret 1137, sniper 217, tank 185, rifle 149, artillery 87, heavy 81, aircraft 80, flame 71.
- Every group sent at a gun-covered node (capture groups, raids, assaults): 1500, 105 took it (7.0%); mean group value 581, mean gun health there 3043.

