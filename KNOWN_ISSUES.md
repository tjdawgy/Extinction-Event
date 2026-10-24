# Known issues

Issues found during testing that are deliberately deferred. Each lists the step that should address it.

## Resolved in v2.6

### Stalemates and timeouts
- The Extinction Event (from 20:00) and the 27:00 limit end every match. v2.6, 20 matches per row: zero timeouts in the AI ladder, the same-personality ladder and every bot row; the longest match was 23:12, none ran past 26:00, and the score decided 0–3 matches per row.
- This also removes the flake in `AI vs AI match on <difficulty> plays to a finish` (`tests/sim.test.js`): the match can no longer reach 30 minutes.

## Audit
Items for the strategy explorer and full balance audit. Logged only, nothing tuned. Details are in the version sections under Open.
- **AI siege push needs 2+ Artillery or Titans** (`aiUpdate`, `nSiege >= 2`), so a War Factory AI on Assault can never push. Likely cause of Siege beating Assault 83% (v2.14).
- **Leviathan almost never trained.** The AI sits near its army size limit holding 100–300 credits, so a 7-supply unit rarely fits. Supply is the problem, not only cost (v2.15). (The limit is not a fixed 34: the HQ gives 12, each Habitat 10/16/22 by tier, up to 80.)
- **Hydra under 1% of units trained** (v2.14).
- **Recon Drones lost and retrained:** 13–21% of Support units (v2.15).
- **Hard ≈ Normal on the ladder:** 19–21 over 40 at v2.15, 18–22 at main (v2.14).
- **Test bots always take path A** (Barracks, War Factory) **and Support** (Tech Lab), so bot data never covers Mass Deployment, Assault or Air Power.
- **Tech Lab AI default paths are provisional:** Economist and Trickster on Air Power, Aggressor and Turtle on Support.
- **Bot rows from v2.13–v2.14 are not comparable with later rows** (the bots never upgraded before the v2.15 fix).
- **Orbital Strike now hits aircraft (v2.16)** with the same 280/140 damage, HQ T2 unlock, cost and cooldown. Unmeasured: its effect on air armies (a Gunship has 230 HP and dies at the centre; a Leviathan has 1400).
- **Orbital Strike unlocks at HQ T2 instead of a War Factory (v2.16).** The AI's other personalities reach HQ T2 through their normal upgrade order; when, and how that changes their Strike use, is unmeasured.
- **The Aggressor against a fortified enemy (v2.16):** it now upgrades its HQ to T2 at once (for the Strike) and still builds a War Factory early (for Tanks). Without the early War Factory, defence strikes fell from 19 to 8–11 of 24 diagnostic matches (Hard Aggressor vs Hard Turtle autoplayer); with both, 17 of 24. Not tuned.
- **Tech Lab needs only a Barracks (v2.16):** in the 4-match smoke test the AI's first Tech Lab finished at 2:25–3:00. Earlier Gunships and Tech Lab paths are unmeasured.
- **Mass Deployment near the top of its win range** (58.8%, target 40–60%); **Riflemen about 37% of unit spending** (target about 35%) (v2.13).

## Open

### Tech Lab tree: numbers for the later balance and AI audit (v2.15)
v2.15 was implementation only: no tuning, minimal AI. Measured, not tuned:
- **Forced-path matrix** (Hard, each personality against itself, one side on Air Power, the other on Support, 40 matches each, zero timeouts, longest 23:01). Air Power beat Support 96–64 overall (60%). Per personality, Air Power–Support: Aggressor 18–22, Economist 33–7, Trickster 22–18, Turtle 23–17.
  - The matrix ran on a build where the Leviathan and Recon Drone flew higher (z 118–130 and 130–145). Only their look changed before the push (z 88–98 and 104–114, so they stay below the top bar), plus shot travel time to them.
- **Leviathans are almost never trained** (0% of units everywhere). The AI keeps about 100–300 credits and an army near its limit, so a 480/240, 7-pop unit seldom fits; cheaper units win the scoring every time.
- **Recon Drones are lost and replaced often:** 13–21% of Support units by count (Economist 21%), 11–19% by value. That's despite the cap of 3 and waiting just behind the front, so the AI retrains them as they fall.
- **Medicopters:** 1–7% by value on Support. The AI trains one per 8 infantry, once it has 6.
- **Units trained, share by value** (per personality: Aggressor, Economist, Trickster, Turtle):
  - On Air Power: Interceptors 0%, 12%, 10%, 6%; Leviathans 0%.
  - On Support: Medicopters 0%, 1%, 7%, 2%; Recon Drones 0%, 19%, 11%, 12%.
  - The Aggressor never reached its Tech Lab upgrade before its matches ended.
- **The AI's Tech Lab defaults were chosen in v2.15 (not decided by design):**
  - Economist and Trickster on Air Power (both favour aircraft);
  - Aggressor on Support (Medicopters for its infantry);
  - Turtle on Support (keeps Nanoweave, which it had before trees).
- **Ladder sanity check:**
  - Easy lost 0–20 to Normal and 0–20 to Hard.
  - Normal vs Hard was 7–13 over 20 matches and 19–21 over 40 (main v2.14: 18–22 over 40).
  - Bot rows, v2.15 against main, both with the fixed bots: calibrated:normal 7–13 vs 8–12, calibrated:hard 2–18 vs 2–18, turtle:normal 1–19 vs 0–20, eco:normal 7–13 vs 9–11, eco:hard 9–11 vs 5–15.
  - Zero timeouts throughout.
- **Test bots fixed in v2.15:** `tests/bots.js` called `tryUpgrade` without a path. Since v2.13 its bots never upgraded a Barracks or War Factory, and they held money for the failed upgrade. They now take path A, and Support for the Tech Lab (what they had before trees). Bot rows from v2.13–v2.14 are therefore not comparable with later ones.
- **For the audit:**
  - the AI's economy and army limit against expensive units (Leviathan, Hydra);
  - Recon Drone losses;
  - Air Power at 60%;
  - the default paths;
  - Nanoweave on Support (watch whether a second Tech Lab becomes mandatory).

### War Factory tree: numbers for the later balance and AI audit (v2.14)
v2.14 was implementation only: no tuning, and the AI got minimal path support. Measured, not tuned:
- **Forced-path matrix** (Hard, each personality against itself, one side forced onto Siege and the other onto Assault, 40 matches each, zero timeouts, longest 23:09). Siege beat Assault 133–27 overall (83%). Per personality, Siege–Assault: Aggressor 23–17, Economist 38–2, Trickster 35–5, Turtle 37–3.
- **Likely main cause: the AI's base-attack logic.** The AI only launches a siege push with at least 2 Artillery or Titans (`aiUpdate`, strategy section: `nSiege >= 2`), so an Assault AI never sieges. It has to win field fights or wait for the late all-in.
- **Units trained, share by value** (per personality: Aggressor, Economist, Trickster, Turtle):
  - On Assault: Flame Tanks 6%, 6%, 16%, 6%; Hydras 0–1%. Hydras are rare at T3 (360/140).
  - On Siege: Artillery 2%, 9%, 11%, 10%; Titans 0%, 5%, 1%, 9%.
  - Riflemen: 47–48% for the Aggressor (both paths), 9–27% for the others.
- **Ladder sanity check:**
  - Easy lost 0–20 to Normal and 0–20 to Hard.
  - Normal vs Hard was 13–27 over 40 matches (main v2.13: 15–25).
  - The calibrated Rifleman rush won 9 of 20 on Normal (main: 16 of 40) and 1 of 20 on Hard.
  - Turtle and Eco bots lost 0–20.
  - Zero timeouts throughout.
- **For the audit:**
  - let an Assault AI siege with Flame Tanks and Hydras (or count Tanks), or add path-aware attack rules;
  - Hydra cost and T3 timing;
  - the default paths (Aggressor and Trickster on Assault);
  - re-check the Barracks matrix (Mass vs Specialists) now that Flame Tanks exist.

### Upgrade trees: re-check after the War Factory and Tech Lab trees (v2.13)
- **Mass Deployment sits near the top of the range.** In the forced-path matrix (Hard, each personality against itself, 40 matches each, 160 in total), Mass Deployment beat Specialists 94–66: a 58.8% win rate, inside the 40–60% target. Per personality (information only): Aggressor 24–16, Economist 17–23, Trickster 27–13, Turtle 26–14 for Mass.
- **Riflemen are about 37% of credits spent on units,** pooled over both paths, against a target of about 35%. That's about 50% on the Mass path alone, and 26% on main before trees. The figure is an estimate converted from value shares, weighting personalities equally.
- Accepted for v2.13. Re-check both numbers once Flame Tanks (a hard counter to massed infantry) and the Tech Lab tree land.

### Long matches run past 80 timeline lines per side (v2.10)
- Since v2.10 a build or upgrade and its finish share one line, which brought typical matches to 63–76 lines per side (median 72 over 8 AI matches). Long matches (14–22 minutes) still reach 85–156 lines, because key events are never merged or cut.

### Normal holds the calibrated Rifleman rush a little less often (v2.8)
- With one shared ability cooldown, AI Normal beats the calibrated rush in 61 of 100 matches (ladder 60 plus the per-personality rows 40), against 68 of 100 in v2.7. The gap is within about two standard deviations, so it may be noise; Easy, Normal and Hard keep their order (Normal vs Hard: 24–36 over 60, v2.7 20–40).

### The Aggressor still loses to the eco bot
- Step 6 gave it an ability-based answer (it strikes Turrets and defenders dug in under the enemy HQ before pushing), and it beats the turtle bot 10–0 on Normal and Hard and the calibrated rush 16–4 on Hard.
- Against the eco bot (Refinery-heavy, no Turrets) it still loses: v2.6, 10 matches each, 4–6 on Normal and 0–10 on Hard (v2.5: 1–9 and 0–7; v2.1: 0–9 and 0–8).

### Narrow Normal-vs-Hard margins in two mirrors
- With both sides the same personality, Normal beats Hard about 4 times in 10 for the Economist and the Trickster: v2.6, 60 matches each, 25–35 for both (v2.4 Economist: 31–42 over 80). Hard still wins the majority, but a single 20-match row can come out even.
