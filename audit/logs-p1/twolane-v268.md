# Two-Lane draw fix (v2.68): a + b, 100 matches per matchup

audit/sim/ladder.js --map=twolane --sets=hard-hard,normal-normal,easy-easy --n=100 (seeds from 8000, mixed factions, sides alternating).

| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 25–36–39 | 44.5% | 17:20 | 55.0% | 39.0% | 0.0% |
| normal vs normal | 18–24–58 | 47.0% | 21:50 | 34.0% | 58.0% | 0.0% |
| easy vs easy | 23–31–46 | 46.0% | 21:40 | 28.0% | 46.0% | 0.0% |

```
hard-hard (100 matches): left 27, right 34, draws 39; left share of decided 44.3%
  lastfist: 14–11–19 cross-faction, share 53.4%
  bloomhost: 9–19–16 cross-faction, share 38.6%
  axiarchs: 18–11–15 cross-faction, share 58.0%
  lastfist mirror (A–B–draw): 1–5–6
  bloomhost mirror (A–B–draw): 6–2–3
  axiarchs mirror (A–B–draw): 2–4–5
normal-normal (100 matches): left 21, right 21, draws 58; left share of decided 50.0%
  lastfist: 7–9–28 cross-faction, share 47.7%
  bloomhost: 7–13–24 cross-faction, share 43.2%
  axiarchs: 13–5–26 cross-faction, share 59.1%
  lastfist mirror (A–B–draw): 2–2–8
  bloomhost mirror (A–B–draw): 0–3–8
  axiarchs mirror (A–B–draw): 2–6–3
easy-easy (100 matches): left 24, right 30, draws 46; left share of decided 44.4%
  lastfist: 9–17–18 cross-faction, share 40.9%
  bloomhost: 14–10–20 cross-faction, share 54.5%
  axiarchs: 16–12–16 cross-faction, share 54.5%
  lastfist mirror (A–B–draw): 1–1–10
  bloomhost mirror (A–B–draw): 2–3–6
  axiarchs mirror (A–B–draw): 3–5–3
```

## Experiments (48 matches each, the same seeds)

### a
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 12–19–17 | 42.7% | 16:04 | 64.6% | 35.4% | 0.0% |

### b
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 14–17–17 | 46.9% | 17:20 | 58.3% | 35.4% | 0.0% |
| normal vs normal | 10–10–28 | 50.0% | 21:50 | 33.3% | 58.3% | 0.0% |
| easy vs easy | 8–15–25 | 42.7% | 21:50 | 25.0% | 52.1% | 0.0% |

### ab
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 14–18–16 | 45.8% | 16:04 | 62.5% | 33.3% | 0.0% |

### c
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 14–17–17 | 46.9% | 13:48 | 64.6% | 35.4% | 0.0% |
| normal vs normal | 14–10–24 | 54.2% | 21:45 | 47.9% | 50.0% | 0.0% |
| easy vs easy | 13–14–21 | 49.0% | 21:27 | 18.8% | 43.8% | 0.0% |

### econ
| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |
|---|---|---|---|---|---|---|
| hard vs hard | 9–16–23 | 42.7% | 21:36 | 45.8% | 47.9% | 0.0% |
| normal vs normal | 5–10–33 | 44.8% | 21:50 | 27.1% | 68.8% | 0.0% |
