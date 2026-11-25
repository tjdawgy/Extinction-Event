# Batch 6f, Part A: base attacks for every AI (REWORK.b6fai)

Persona-balanced self-play (audit/sim/selfplay-6c.js, 162 Hard vs Hard matches, seeds 600+, 0 errors). Before: v2.95 with
the read-only edge counters (audit/logs-p1/selfplay6f-a0/, all 162 matches identical to 6e's selfplay6e-c3 run). After:
b6fai on, b6f off (this folder). Tables: report6c.md (95% Wilson intervals), edge.md (audit/sim/edge6f-report.js).

## How often the edge bug happened (v2.95)

A side counts as standing at the edge in a second when half or more of its ground army (by value) stands over 100 past the
enemy HQ during an all-in base attack; a side is affected with 20 or more such seconds in a match.

| faction | sides affected (of 108) | edge seconds | of them with nothing in sight within 300 | affected sides W-L-D |
|---|---|---|---|---|
| Last Fist | 0 | 11 | 0 | - |
| Bloomhost | 5 (1 Two-Lane, 4 Three-Lane) | 298 | 13 | 4-0-1 |
| Axiarchs | 3 (all Classic: 6e's fix is lane maps only) | 733 | 13 | 2-0-1 |

Rarer than 6e's v2.94 trace suggested: by v2.95 a side that reaches the edge has nearly always won the fight already, and
almost every edge second had an enemy in sight.

## After (b6fai on)

| faction | sides affected | edge seconds | idle |
|---|---|---|---|
| Last Fist | 0 | 0 | 0 |
| Bloomhost | 0 | 17 | 0 |
| Axiarchs | 2 (Classic, both won) | 271 | 0 |

The two Classic Axiarch sides left were fighting buildings on the enemy's back pads (Classic's farthest pad stands 121 past the
HQ), not standing idle: every edge second had a target in sight.

## Win rates (95% Wilson intervals; W-L-D)

| | v2.95 | b6fai on |
|---|---|---|
| Last Fist | 50-47-11, 46% (37-56) | 48-49-11, 44% (35-54) |
| Bloomhost | 47-47-14, 44% (35-53) | 49-48-11, 45% (36-55) |
| Axiarchs | 47-50-11, 44% (35-53) | 49-49-10, 45% (36-55) |
| LF vs BH | 46% (34-59) | 46% (34-59) |
| LF vs AX | 46% (34-59) | 43% (30-56) |
| BH vs AX | 46% (34-59) | 48% (35-61) |
| Boomer | 39% (30-48) | 39% (30-48) |
| Economist | 44% (35-53) | 44% (35-53) |
| Turtle | 51% (42-60) | 53% (43-62) |

Per map (Classic / Two-Lane / Three-Lane): Last Fist 31 / 53 / 56% → 31 / 50 / 53%; Bloomhost 67 / 42 / 22% → 67 / 42 / 28%;
Axiarchs 44 / 44 / 42% → 47 / 47 / 42%. Every difference is inside the noise (about ±10 points a faction, ±15 a map).
