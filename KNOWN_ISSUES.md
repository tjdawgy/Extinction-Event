# Known issues

Issues found during testing that are deliberately deferred. Each lists the step that should address it.

## Resolved in v2.6

### Stalemates and timeouts
- The Extinction Event (from 20:00) and the 27:00 limit end every match. v2.6, 20 matches per row: zero timeouts in the AI ladder, the same-personality ladder and every bot row; the longest match was 23:12, none ran past 26:00, and the score decided 0–3 matches per row.
- This also removes the flake in `AI vs AI match on <difficulty> plays to a finish` (`tests/sim.test.js`): the match can no longer reach 30 minutes.

## Open

### The Aggressor still loses to the eco bot
- Step 6 gave it an ability-based answer (it strikes Turrets and defenders dug in under the enemy HQ before pushing), and it beats the turtle bot 10–0 on Normal and Hard and the calibrated rush 16–4 on Hard.
- Against the eco bot (Refinery-heavy, no Turrets) it still loses: v2.6, 10 matches each, 4–6 on Normal and 0–10 on Hard (v2.5: 1–9 and 0–7; v2.1: 0–9 and 0–8).

### Narrow Normal-vs-Hard margins in two mirrors
- With both sides the same personality, Normal beats Hard about 4 times in 10 for the Economist and the Trickster: v2.6, 60 matches each, 25–35 for both (v2.4 Economist: 31–42 over 80). Hard still wins the majority, but a single 20-match row can come out even.
