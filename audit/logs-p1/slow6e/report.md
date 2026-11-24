# Batch 6e: the slow suite with b6elane and b6e on

`npm run test:slow` on v2.95 with every switch on: 24 of 25 passed (slow-suite-v295-first.txt). The failing test,
tests/slow/threelane-match.test.js, failed one check: "match 1: both sides used all three lanes" (seed 607, Axiarchs vs
Bloomhost: the Axiarch side reached lanes 0 and 1 only). Measured over 20 matches (seeds 600-619, the test's pairing cycle) under
four switch sets with `node audit/sim/slow6e.js --kind threelane` (threelane.jsonl; table: `node audit/sim/slow6e-report.js`):

| switch set | matches | both sides all three lanes | the Axiarch side all three lanes (sides) | other sides all three lanes (sides) | ended by an HQ | over by 27:00 | centre and a watchtower | nobody in a wall | forward pads | two capture groups at once | seeds failing a check of the test |
|---|---|---|---|---|---|---|---|---|---|---|---|
| on | 20 | 15 | 5 of 10 | 29 of 30 | 16 | 20 | 20 | 20 | 16 | 20 | 602, 605, 607, 611, 619 |
| lane0 | 20 | 20 | 10 of 10 | 30 of 30 | 15 | 20 | 20 | 20 | 17 | 20 | none |
| e0 | 20 | 11 | 2 of 10 | 28 of 30 | 17 | 20 | 20 | 20 | 20 | 20 | 602, 604, 605, 607, 608, 611, 614, 617, 619 |
| off | 20 | 19 | 10 of 10 | 29 of 30 | 17 | 20 | 20 | 20 | 19 | 20 | 604 |

(lane0: b6elane off; e0: b6e off; "seeds failing a check": over by 27:00, both sides all three lanes, the centre and a watchtower,
nobody in a wall.)

**Verdict: an intended effect of b6elane.** With it on, an Axiarch AI holds its army on one focus lane at a time with at most a
one-unit screen elsewhere, so its units reach all three lanes in 5 of 10 matches (2 of 10 with b6e off too); with b6elane off, 10
of 10. It always reaches at least two (it moves the army between lanes). Every other side uses all three lanes 29 of 30 times in
every set, and the other checks are unchanged (HQ endings 15-17 of 20, forward pads 16-20, two capture groups at once 20 of 20
in every set; the Axiarchs run one group, their opponents still two). Not seed variance (the Axiarch rate drops in every set
with b6elane on and in none with it off), not a regression (the lane play is what Part A asked for).

**Change:** tests/slow/threelane-match.test.js holds b6elane off (it passes on all 20 seeds that way, its own 606-611 included).
Its counterpart, tests/slow/switches-on-6e.test.js, plays the same six matches with every switch on and checks the same intent
for the batch 6e AI: every match over by 27:00, most by an HQ; every non-Axiarch side uses all three lanes; the Axiarch side moves
its army between lanes (two at least); the centre and a watchtower taken; nobody inside a wall; forward pads and two capture
groups at once in most matches.

Full suites after the change: fast-suite-v295.txt (npm test 782/782) and slow-suite-v295.txt (npm run test:slow).
