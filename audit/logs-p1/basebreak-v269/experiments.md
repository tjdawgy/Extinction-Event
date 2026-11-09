# Base-breaking (v2.69): the experiments, Two-Lane, 48 matches each (seeds 8000–8047, the same as v2.68's)

node audit/sim/ladder.js --map=twolane --n=48 --code='BREAK...on=true' (each part on its own, then in combination; v2.68's a + b, i.e. every BREAK part off, drew 33.3% of Hard mirrors on these seeds). 'abcd + Easy supply' is the shipped set.

## a
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 18–17–13 | 51.0% | 15:06 | 68.8% | 27.1% | 0.0% |

## b
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 20–22–6 | 47.9% | 16:02 | 72.9% | 12.5% | 0.0% |

## c
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 16–19–13 | 46.9% | 13:51 | 70.8% | 27.1% | 0.0% |

## d
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 14–18–16 | 45.8% | 15:34 | 62.5% | 33.3% | 0.0% |

## b (Normal, Easy)
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| normal vs normal | 16–18–14 | 47.9% | 20:13 | 47.9% | 29.2% | 0.0% |
| easy vs easy | 14–19–15 | 44.8% | 21:06 | 37.5% | 31.3% | 0.0% |

## ab
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 21–22–5 | 49.0% | 15:06 | 75.0% | 10.4% | 0.0% |
| normal vs normal | 20–14–14 | 56.3% | 19:32 | 56.3% | 29.2% | 0.0% |
| easy vs easy | 20–17–11 | 53.1% | 20:40 | 37.5% | 22.9% | 0.0% |

## abc
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 22–20–6 | 52.1% | 11:55 | 85.4% | 12.5% | 0.0% |
| normal vs normal | 14–26–8 | 37.5% | 18:06 | 66.7% | 16.7% | 0.0% |
| easy vs easy | 17–19–12 | 47.9% | 21:18 | 33.3% | 25.0% | 0.0% |

## abcd
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 24–21–3 | 53.1% | 12:52 | 85.4% | 6.3% | 0.0% |
| normal vs normal | 19–25–4 | 43.8% | 15:53 | 70.8% | 8.3% | 0.0% |
| easy vs easy | 16–20–12 | 45.8% | 21:13 | 41.7% | 25.0% | 0.0% |

## abcd + the Easy Habitat rule (Easy)
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| easy vs easy | 19–22–7 | 46.9% | 19:13 | 62.5% | 14.6% | 0.0% |

## abd + the Easy Habitat rule
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 21–21–6 | 50.0% | 14:28 | 75.0% | 12.5% | 0.0% |
| normal vs normal | 16–23–9 | 42.7% | 18:29 | 68.8% | 18.8% | 0.0% |
| easy vs easy | 16–23–9 | 42.7% | 19:08 | 56.3% | 18.8% | 0.0% |
