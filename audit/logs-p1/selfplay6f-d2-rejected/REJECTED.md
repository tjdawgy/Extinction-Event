# Batch 6f, Part D2: the first change tried, measured and rejected

Change: the Bloomhost AI on lane maps plays batch 6e's one-army lane rule (aiLanes6e: one focus lane, at most a one-unit screen
elsewhere, every new unit there; one capture group on Three-Lane), behind b6fai, aimed at D1's cause 1 (Bloomhost's swarm split
on Three-Lane). Measured with every switch on (162 matches, seeds 600+; report6c.md):

| | Part B | with the change |
|---|---|---|
| Bloomhost on Three-Lane | 10-22-4, 28% (16-44) | 13-19-4, 36% (22-52) |
| Bloomhost vs Last Fist on Three-Lane | 4-11-3 | 0-15-3 |
| Bloomhost vs Axiarchs on Three-Lane | 6-11-1 | 13-4-1 |
| Last Fist on Three-Lane | 58% (42-73) | 25-5-6, 69% (53-82) |
| Axiarchs on Three-Lane | 44% | 9-23-4, 25% (14-41) |
| Axiarchs overall | 45% (36-55) | 44-57-7, 41% (32-50) |

It moved the Three-Lane spread from Bloomhost to the Axiarchs and widened Last Fist's lead: one packed Bloomhost lane beat the
Axiarchs' one lane but lost every match to Last Fist (whose volume, 77-100 supply on Three-Lane, wins a single-lane fight).
Rejected: the code is removed and the change does not count toward the shipped build. The second change (press6f) is measured
on its own (audit/logs-p1/selfplay6f-d2/).
