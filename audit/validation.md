# Phase 4 validation (v2.38)

Run with `node audit/sim/validate.js --mirror=100 --vs=40`. Hard difficulty, random personalities, real SIM, seeded. A match still going at 20:00 is a draw. Sides alternate (A on the left in even matches, on the right in odd ones). 26 minutes on 4 processes.

Crashes: **0**.

## Default vs Default (mirror)

| Faction | Matches | Side A wins | Side B wins | Draws (20:00) | Ended | Average length | Left side wins |
|---|---|---|---|---|---|---|---|
| Last Fist | 100 | 51 (51%) | 40 (40%) | 9 (9%) | 91 | 12:54 | 59.3% of decided |
| Bloomhost | 100 | 42 (42%) | 36 (36%) | 22 (22%) | 78 | 13:14 | 52.6% of decided |
| Axiarchs | 100 | 34 (34%) | 45 (45%) | 21 (21%) | 79 | 13:26 | 46.8% of decided |

## Default vs Legacy

Rows: the Default side's faction; columns: the Legacy side's faction. Each cell: Default wins – Legacy wins – draws, and Default's share of the decided matches.

| Default \ Legacy | Last Fist | Bloomhost | Axiarchs |
|---|---|---|---|
| Last Fist | 16–18–6 (47.1%) | 32–4–4 (88.9%) | 30–4–6 (88.2%) |
| Bloomhost | 8–27–5 (22.9%) | 18–8–14 (69.2%) | 16–16–8 (50%) |
| Axiarchs | 3–31–6 (8.8%) | 10–21–9 (32.3%) | 16–14–10 (53.3%) |

Overall: Default 149, Legacy 143, draws 68 (Default 51% of decided matches).

## Unit usage (Default, mirror matches)

Share of Default sides (2 per mirror match, 200 per faction) that trained each unit at least once; total trained in brackets. Flagged: under 5%.

**Last Fist**

| Unit | Sides that trained it | Trained | |
|---|---|---|---|
| Rifleman | 100% | 10189 |  |
| Heavy | 77.5% | 2570 |  |
| Sniper | 36.5% | 217 |  |
| Tank | 81.5% | 1525 |  |
| Artillery | 35.5% | 190 |  |
| Titan | 18.5% | 52 |  |
| Gunship | 51% | 535 |  |
| Interceptor | 41.5% | 446 |  |
| Leviathan | 10.5% | 29 |  |
| Medicopter | 8.5% | 68 |  |
| Recon Drone | 10.5% | 203 |  |
| Flame Tank | 34% | 391 |  |
| Hydra | 15.5% | 58 |  |

**Bloomhost**

| Unit | Sides that trained it | Trained | |
|---|---|---|---|
| Skitterling | 99.5% | 12315 |  |
| Bulwark | 81.5% | 1545 |  |
| Razorwing | 57.5% | 1279 |  |
| Leaper | 48% | 1282 |  |
| Ravager | 15.5% | 110 |  |
| Spitter | 68.5% | 2228 |  |
| Bilecaster | 34% | 168 |  |
| Bile Lobber | 28.5% | 106 |  |
| Ruinmaw | 14.5% | 37 |  |
| Thornback | 33.5% | 159 |  |
| Dreadthorn | 12% | 40 |  |
| Needlewing | 9.5% | 358 |  |
| Cloudwing | 6% | 15 |  |
| Brood Tyrant | 25% | 54 |  |
| Worldrender | 2.5% | 5 | **under 5%** |

**Axiarchs**

| Unit | Sides that trained it | Trained | |
|---|---|---|---|
| Shardling | 100% | 6087 |  |
| Bastion | 60% | 271 |  |
| Wraithwing | 50.5% | 274 |  |
| Riftstalker | 41% | 944 |  |
| Parallax | 11% | 36 |  |
| Lancer | 72% | 1366 |  |
| Astral Marksman | 27.5% | 100 |  |
| Rift Mortar | 44% | 213 |  |
| Worldbreaker | 13% | 40 |  |
| Gravemantle | 27.5% | 121 |  |
| Eventide | 9.5% | 24 |  |
| Prismwing | 15.5% | 659 |  |
| Shardstorm | 8% | 45 |  |
| Voidcarrier | 18.5% | 41 |  |
| Astral Sovereign | 0% | 0 | **under 5%** |

