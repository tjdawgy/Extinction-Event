# Pre-rework baseline (partial, v2.80)

**Pre-rework:** measured on v2.80, before the faction rework. Kept for reference only; the Phase 1 balance pass will run
its own baseline after the rework.

The run was stopped after one complete set: `L_classic_hard-hard.json`, 126 Hard vs Hard matches on Classic (mixed
factions, seeds 8000–8125, `node audit/sim/p1.js --plan=base --tag=baseline`). Summary (`node audit/sim/p1report.js
audit/logs-p1/balance/baseline`):

| Set | n | A–B–draw | median (Q1–Q3) | decided < 20:00 | draws | no fight | left–right | LF / BH / AX cross-faction |
|---|---|---|---|---|---|---|---|---|
| classic hard-hard | 126 | 60–62–4 | 12:22 (8:44–17:28) | 89.7% | 3.2% | 0.0% | 50–72 | 67.0 / 38.4 / 44.6% |

Speed on this container: 126 Classic matches in 586 s on 3 workers (about 14 core-seconds a match).
