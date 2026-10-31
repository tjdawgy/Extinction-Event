# Phase 7a development probes (printed to the terminal, copied here)

Small runs (Hard against the Greedy bot, 3 x 3 faction pairings, `n` seeds each from 90000) used to find the direction.
They used the code as it stood at that point; the final numbers are in validate.txt.

| Probe | AI wins vs Greedy |
|---|---|
| v2.40 Hard (baseline, n=12) | 8-100 (baseline-hard.txt) |
| v2.40 Hard + read, contest, counter, nowave, shield, power (Economist opening, n=6) | 3-51 (r1-allon.txt) |
| same rules, Aggressor opening (n=3) | 0-27 |
| same rules, Trickster opening (n=3) | 2-25 |
| same rules, Turtle opening (n=3) | 3-24 |
| Default preset, no new rules (n=3) | 3-24 |
| Boomer opening + those rules (n=3) | 11-16 |
| Boomer opening, no new rules (n=3) | 10-17 |
| Boomer + rules + fill (n=3) | 14-13 |
| Boomer + rules + fill, read off (n=3) | 17-10 |
| read's push aimed at the field instead of the base, read on / off (n=4) | 21-15 / 23-13 |
| + est (read off, n=4) | 26-10 |
| + nowave v2 (remembers the army that turned it back, n=4) | 24-12 |
| Bloomhost Hard only (n=8 per bot faction): Boomer / Economist / Turtle / Aggressor | 9-15 / 6-18 / 2-22 / 0-24 |
| power v2 (energy under a fifth of credit income), Bloomhost only (n=8) | 13-11 |
| attackAt dial 0 / 240 / 330 (n=4) | 29-7 / 23-13 / 23-13 |

Against the Default field (hardsearch.js, 20 paired per faction, vsdefault-probe1.txt): Boomer + rules 20-0, 20-0, 20-0
(v2.40 Hard: 20-0, 20-0, 19-1).
