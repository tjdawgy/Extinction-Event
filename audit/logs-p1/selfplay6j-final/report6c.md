## Persona-balanced self-play: selfplay6j-final

324 matches, 0 errors; version 2.99; switches: {} off, the rest on.

Design check (sides per faction and personality): axiarchs boomer 72, axiarchs economist 72, axiarchs turtle 72, bloomhost boomer 72, bloomhost economist 72, bloomhost turtle 72, lastfist boomer 72, lastfist economist 72, lastfist turtle 72.

### Faction win rates (95% Wilson intervals)

| faction | W-L-D | win rate | of decided |
|---|---|---|---|
| Last Fist | 93-101-22 | 43% (37-50) | 48% (41-55) |
| Bloomhost | 99-100-17 | 46% (39-52) | 50% (43-57) |
| Axiarchs | 105-96-15 | 49% (42-55) | 52% (45-59) |

Natural mix (each match weighted by the chance Hard's own dice give those two personalities: equal thirds (b6ai); effective matches in brackets):

| faction | win rate, natural mix | draws | effective matches |
|---|---|---|---|
| Last Fist | 43% (37-50) | 10% | 216 |
| Bloomhost | 46% (39-52) | 8% | 216 |
| Axiarchs | 49% (42-55) | 7% | 216 |

Per pairing (first-named faction; win rate of all, then of decided):

| pairing | map | W-L-D | win rate | of decided |
|---|---|---|---|---|
| Last Fist vs Bloomhost | classic | 25-8-3 | 69% (53-82) | 76% (59-87) |
| Last Fist vs Bloomhost | twolane | 7-23-6 | 19% (10-35) | 23% (12-41) |
| Last Fist vs Bloomhost | threelane | 22-11-3 | 61% (45-75) | 67% (50-80) |
| Last Fist vs Bloomhost | **all** | 54-42-12 | 50% (41-59) | 56% (46-66) |
| Last Fist vs Axiarchs | classic | 9-25-2 | 25% (14-41) | 26% (15-43) |
| Last Fist vs Axiarchs | twolane | 14-19-3 | 39% (25-55) | 42% (27-59) |
| Last Fist vs Axiarchs | threelane | 16-15-5 | 44% (30-60) | 52% (35-68) |
| Last Fist vs Axiarchs | **all** | 39-59-10 | 36% (28-46) | 40% (31-50) |
| Bloomhost vs Axiarchs | classic | 18-18-0 | 50% (34-66) | 50% (34-66) |
| Bloomhost vs Axiarchs | twolane | 20-13-3 | 56% (40-70) | 61% (44-75) |
| Bloomhost vs Axiarchs | threelane | 19-15-2 | 53% (37-68) | 56% (39-71) |
| Bloomhost vs Axiarchs | **all** | 57-46-5 | 53% (43-62) | 55% (46-65) |

Per faction and map:

| faction | map | W-L-D | win rate | of decided |
|---|---|---|---|---|
| Last Fist | classic | 34-33-5 | 47% (36-59) | 51% (39-62) |
| Last Fist | twolane | 21-42-9 | 29% (20-41) | 33% (23-46) |
| Last Fist | threelane | 38-26-8 | 53% (41-64) | 59% (47-71) |
| Bloomhost | classic | 26-43-3 | 36% (26-48) | 38% (27-49) |
| Bloomhost | twolane | 43-20-9 | 60% (48-70) | 68% (56-78) |
| Bloomhost | threelane | 30-37-5 | 42% (31-53) | 45% (33-57) |
| Axiarchs | classic | 43-27-2 | 60% (48-70) | 61% (50-72) |
| Axiarchs | twolane | 32-34-6 | 44% (34-56) | 48% (37-60) |
| Axiarchs | threelane | 30-35-7 | 42% (31-53) | 46% (35-58) |

Sides: side 0 won 129, side 1 won 168, 27 draws; side 1 share of decided 57% (51-62). Per map: classic 43-60-5, twolane 40-56-12, threelane 46-52-10.

### Personalities

| personality | W-L-D | win rate | of decided |
|---|---|---|---|
| boomer | 100-102-14 | 46% (40-53) | 50% (43-56) |
| economist | 106-95-15 | 49% (42-56) | 53% (46-60) |
| turtle | 91-100-25 | 42% (36-49) | 48% (41-55) |

| faction | personality | W-L-D | win rate | of decided |
|---|---|---|---|---|
| Last Fist | boomer | 31-37-4 | 43% (32-55) | 46% (34-57) |
| Last Fist | economist | 36-28-8 | 50% (39-61) | 56% (44-68) |
| Last Fist | turtle | 26-36-10 | 36% (26-48) | 42% (30-54) |
| Bloomhost | boomer | 34-36-2 | 47% (36-59) | 49% (37-60) |
| Bloomhost | economist | 34-34-4 | 47% (36-59) | 50% (38-62) |
| Bloomhost | turtle | 31-30-11 | 43% (32-55) | 51% (39-63) |
| Axiarchs | boomer | 35-29-8 | 49% (37-60) | 55% (43-66) |
| Axiarchs | economist | 36-33-3 | 50% (39-61) | 52% (41-64) |
| Axiarchs | turtle | 34-34-4 | 47% (36-59) | 50% (38-62) |

Personality against personality (row personality's win rate, all factions):

|  | boomer | economist | turtle |
|---|---|---|---|
| boomer | 47% (36-59) | 50% (39-61) | 42% (31-53) |
| economist | 42% (31-53) | 46% (35-57) | 60% (48-70) |
| turtle | 53% (41-64) | 36% (26-48) | 38% (27-49) |

### Length and how matches ended

| set | matches | median length | under 5:00 | 20:00 or more | ended by HQ destruction |
|---|---|---|---|---|---|
| classic | 108 | 11:35 | 0 | 16 | 95% (90-98) |
| twolane | 108 | 18:21 | 0 | 40 | 89% (82-94) |
| threelane | 108 | 17:44 | 0 | 35 | 91% (84-95) |
| **all** | 324 | 15:53 | 0 | 91 | 92% (88-94) |

How matches ended: hq 297, draw 27 (HQ destroyed 92% (88-94)).


