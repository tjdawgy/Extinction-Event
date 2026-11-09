# Three-Lane army-cap performance check (v2.70)

audit/sim/perf-lanes.js: the real page in headless Chromium at 858×396 and 667×375 (tests/browser-kit.js), n units a side
spawned in a mixed ground army spread over every lane, both on Attack so they meet mid-map; 8 s window after 1.5 s warm-up;
CPU throttling through Chrome DevTools (4× ≈ an older iPhone). speed: game seconds per real second (1.0 = true speed; the
frame loop runs extra fixed ticks to keep it). Headless Chromium draws in software, so absolute frame rates are far below
a phone's; the comparison between maps is what counts.

| map | units a side | size | throttle | speed | fps | mean frame ms | worst ms |
|---|---|---|---|---|---|---|---|
| Two-Lane | 50 | 858×396 | 1× | 1.004 | 47.4 | 21.1 | 50 |
| Two-Lane | 50 | 858×396 | 4× | 1.020 | 8.1 | 123.4 | 167 |
| Two-Lane | 50 | 667×375 | 1× | 1.002 | 56.4 | 17.7 | 33 |
| Two-Lane | 50 | 667×375 | 4× | 1.018 | 8.9 | 111.9 | 167 |
| Three-Lane | 60 | 858×396 | 1× | 1.003 | 41.0 | 24.4 | 50 |
| Three-Lane | 60 | 858×396 | 4× | 1.029 | 5.7 | 174.0 | 250 |
| Three-Lane | 60 | 667×375 | 1× | 1.004 | 48.9 | 20.5 | 34 |
| Three-Lane | 60 | 667×375 | 4× | 1.025 | 6.9 | 145.5 | 200 |
| Three-Lane | 50 | 858×396 | 4× | 1.023 | 7.1 | 141.1 | 183 |
| Three-Lane | 50 | 667×375 | 4× | 1.017 | 8.2 | 121.7 | 167 |
| Two-Lane (worst case) | 100 | 858×396 | 1× | 1.004 | 36.8 | 27.2 | 50 |
| Two-Lane (worst case) | 100 | 858×396 | 4× | 1.017 | 5.3 | 189.1 | 283 |
| Two-Lane (worst case) | 100 | 667×375 | 1× | 1.003 | 41.1 | 24.3 | 50 |
| Two-Lane (worst case) | 100 | 667×375 | 4× | 1.021 | 5.2 | 192.0 | 267 |
| Three-Lane (worst case) | 120 | 858×396 | 1× | 1.007 | 30.0 | 33.4 | 50 |
| Three-Lane (worst case) | 120 | 858×396 | 4× | 0.892 | 3.6 | 277.7 | 383 |
| Three-Lane (worst case) | 120 | 667×375 | 1× | 1.005 | 36.1 | 27.7 | 50 |
| Three-Lane (worst case) | 120 | 667×375 | 4× | 0.959 | 4.0 | 252.5 | 350 |

Realistic loads (cap 100 ≈ 50 units a side, cap 120 ≈ 60; units take 1–6 supply): Three-Lane keeps true speed everywhere;
its frames cost about 15% more than Two-Lane's at normal CPU and 30–40% more at 4×, about 14% of it the bigger map itself
(50 units a side on both). Only the worst case (120 units a side, double what the supply allows) at 4× throttling falls
below true speed (0.89–0.96×). Kept: army cap 120. If a real older iPhone struggles, 110 is the fallback.
