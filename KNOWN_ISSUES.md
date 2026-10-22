# Known issues

Issues found during testing that are deliberately deferred. Each lists the step that should address it.

## Open after Step 6 (v2.5)

### Stalemates are not ended by abilities: escalation decision pending
- Abilities did not reduce timeouts. v2.5, same-personality AI ladder (`tests/personas.js`, 20 matches per row): 11/240 timeouts (4.6%), the same as v2.1 (11/240). `tests/ladder.js` AI rows: 2/60 (v2.0: 1/60).
- The eco bot (Refinery-heavy turtle) still stalls many matches: v2.5 `tests/ladder.js` 20 matches, eco vs Normal 8–5 with 7 timeouts, eco vs Hard 5–11 with 4 timeouts (v2.1: 7–12 with 1, 5–8 with 7).
- Next: a late-game escalation mechanic was proposed in the Step 6 report and is waiting for approval. Nothing is implemented.
- Side effect: the unseeded test `AI vs AI match on <difficulty> plays to a finish` in `tests/sim.test.js` can fail when its random match hits the 30-minute limit (seen once in Step 5; it passes on rerun). Ending stalemates should remove the flake; seeding the test would only hide it.

### The Aggressor still loses to the eco bot
- Step 6 gave it an ability-based answer: it builds a War Factory when it meets Turrets or a failed attack, saves for the Orbital Strike, waits for it, and strikes Turrets or defenders dug in under the enemy HQ just before its army arrives (2.5–4.7 strikes per match on defences against the turtling bots). It also no longer walks into an infantry rush at its door.
- Result: it beats the turtle bot 10–0 (Normal) and 9–0 (Hard) and the calibrated rush 15–5 on Hard, but still loses to the eco bot: 1–9 (Normal) and 0–7 with 3 timeouts (Hard), 10 matches each (v2.1: 0–9 and 0–8). The eco bot has no Turrets: it out-earns the Aggressor and defends at home under its HQ gun.
- The Economist's Normal-vs-Hard margin is narrow, as it was before abilities: v2.5 pooled over 120 matches Normal 42–64 Hard; v2.4 over 80 matches 31–42. Single 20-match rows can come out even.
