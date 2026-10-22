# Known issues

Issues found during testing that are deliberately deferred. Each lists the step that should address it.

## For Step 6 (commander abilities)

### The Aggressor is weak against turtling players
- Measured in v2.1 (`tests/personas.js`, 10 matches each): the Aggressor lost 0–9 to the eco bot (Refinery-heavy turtle) at Normal and 0–8 at Hard, while the Economist and Turtle won 10–0 and 5–0 / 6–0. It also has the thinnest margin against the calibrated rush at Hard (16–4 over 20).
- Cause: its answer to a defended base is a head-on attack into Turrets and the HQ gun.
- Plan: give it an ability-based answer in Step 6 (for example using the Orbital Strike on Turrets) rather than more head-on attacks.

### AI-vs-AI timeouts and eco-bot stalls
- AI-vs-AI ladder timeouts rose from 1/60 (1.7%, v2.0) to 11/240 (4.6%, v2.1, same-personality ladder over 20 matches per row).
- The eco bot still stalls some matches: v2.1 `tests/ladder.js` 20 matches, eco vs Normal 7–12 with 1 timeout, eco vs Hard 5–8 with 7 timeouts.
- Plan: in Step 6, check whether abilities end these stalemates; if not, consider a late-game escalation mechanic.
