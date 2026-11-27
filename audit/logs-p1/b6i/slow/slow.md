# Batch 6i: the slow suite's first run (v2.99, quiet machine, clean tree)

`npm run test:slow`: 23 of 26 passed (52 min; 6h's took about 21: the air units and longer matches). The three failures, classified:

1. tests/slow/ai-stats.test.js "Bloomhost AI (Turtle vs a Last Fist Aggressor)": "Razorwings in 0% of matches (needs ≥ 15%)". Intended:
   with b6i the Razorwing is a flock with its own id (razor6). Held b6i off (`rework: { b6i: false }` in its matches); counterpart in
   tests/slow/switches-on-6i.test.js (Razorwing flocks, the same seeds).
2. tests/slow/ai-stats.test.js "Bloomhost AI (Economist): the Bloomspire path, Brood Tyrants and Worldrenders": "Brood Tyrants in 0%".
   Intended: there are none with b6i. Held b6i off; counterpart in tests/slow/switches-on-6i.test.js (the path, a T2 and a T3
   Bloomspire unit, none of the cut four).
3. tests/slow/switches-on-6c.test.js "on: Hard vs Hard on Two-Lane": "match 5: a watchtower was taken". Seed variance: over 20 matches
   (seeds 520-539, the test's own pairing rotation; audit/sim/b6i-slow.js, towers-on.jsonl, towers-off.jsonl) a watchtower was taken in
   19 with every switch on and 20 with b6i and b6iresp off; every match ended by 27:00 either way. The one without, the test's own seed
   525, is a Bloomhost win over the Axiarchs at 9:03, before either side reached a tower. The check now also accepts a match decided
   before 10:00.
Bloomhost base AI (b6i) (20 matches): Skitterlings 100%, Razorwing flocks 100%, never the old Razorwing 100%
Bloomspire (b6i) (20 matches): a Bloomspire path taken 100%, a T2 Bloomspire unit (Gnatcloud or Talonmaw) 100%, a T3 one (Blightwing or Skywyrm) 85%, none of the cut four 100%
