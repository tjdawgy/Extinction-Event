# Batch 6h: unit bodies in chokes, and their cost

## Chokes (30 mixed units, one move order, 30 s; 3 seeds)

| map | b6hbody | arrived | stuck | still on the way |
|---|---|---|---|---|
| classic | on | 28 / 29 / 29 | 0 / 0 / 0 | 2 / 1 / 1 |
| classic | off | 30 / 30 / 30 | 0 / 0 / 0 | 0 / 0 / 0 |
| twolane | on | 25 / 28 / 28 | 2 / 0 / 0 | 3 / 2 / 2 |
| twolane | off | 30 / 30 / 30 | 0 / 0 / 0 | 0 / 0 / 0 |
| threelane | on | 26 / 25 / 27 | 2 / 1 / 1 | 2 / 4 / 2 |
| threelane | off | 30 / 30 / 30 | 0 / 0 / 0 | 0 / 0 / 0 |

## SIM time per tick, heavy scene (60 Skitterlings + 30 Mites vs 40 Last Fist units), 5 runs each

The fight itself differs with bodies on (units spread out, fewer reach a target at once), so the whole tick is compared and the
body pass is also timed alone (on the state reached after 20 s, with bodies on: every pair checked, nothing moved).

| b6hbody | ms per tick, each run | median | body pass alone, ms (median) | units left |
|---|---|---|---|---|
| off | 0.930, 0.818, 0.937, 0.980, 0.869 | 0.930 | - | 23, 24, 24, 23, 24 |
| on | 0.552, 0.483, 0.474, 0.489, 0.537 | 0.489 | 0.093 | 40, 40, 40, 40, 40 |

Whole tick, bodies on / off: -47.4%. The body pass alone: 0.093 ms a tick, 10.1% of a bodies-off tick (target: no more than +25%).
