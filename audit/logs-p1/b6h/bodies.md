# Batch 6h: unit bodies in chokes, and their cost

## Chokes (30 mixed units, one move order, 30 s; 3 seeds)

| map | b6hbody | arrived | stuck | still on the way |
|---|---|---|---|---|
| classic | on | 28 / 29 / 28 | 0 / 0 / 0 | 2 / 1 / 2 |
| classic | off | 30 / 30 / 30 | 0 / 0 / 0 | 0 / 0 / 0 |
| twolane | on | 27 / 29 / 29 | 0 / 0 / 0 | 3 / 1 / 1 |
| twolane | off | 30 / 30 / 30 | 0 / 0 / 0 | 0 / 0 / 0 |
| threelane | on | 29 / 29 / 29 | 0 / 0 / 0 | 1 / 1 / 1 |
| threelane | off | 30 / 30 / 30 | 0 / 0 / 0 | 0 / 0 / 0 |

## SIM time per tick, heavy scene (60 Skitterlings + 30 Mites vs 40 Last Fist units), 5 runs each

The fight itself differs with bodies on (units spread out, fewer reach a target at once), so the whole tick is compared and the
body pass is also timed alone (on the state reached after 20 s, with bodies on: every pair checked, nothing moved).

| b6hbody | ms per tick, each run | median | body pass alone, ms (median) | units left |
|---|---|---|---|---|
| off | 0.940, 0.970, 0.818, 1.012, 0.944 | 0.944 | - | 23, 24, 24, 23, 24 |
| on | 0.491, 0.529, 0.542, 0.514, 0.491 | 0.514 | 0.089 | 40, 40, 40, 40, 40 |

Whole tick, bodies on / off: -45.6%. The body pass alone: 0.089 ms a tick, 9.4% of a bodies-off tick (target: no more than +25%).
