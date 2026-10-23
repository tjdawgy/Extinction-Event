# Extinction Event

A single-file mobile real-time strategy game. Open `index.html` in a browser (best in landscape on a phone).

## Tests

```
npm test
```

| File | What it covers |
|---|---|
| `tests/sim.test.js` | Name and version, building/training/upgrading, save round-trip, AI-vs-AI matches on every difficulty |
| `tests/countdown.test.js` | GET READY freeze (resources, construction, production, upgrades, units, nodes, repair, AI), clock starts at GO, HQ readout states |
| `tests/regression.test.js` | Two-tap-sell refund, paid repair and self-repair, field nodes, HQ shield, stances, save keys and format, bad saves |
| `tests/fog.test.js` | Fog of war: base vision vs gun range, scouting, ghosts, node vision, enemies entering and leaving view, spotters for Artillery and Snipers, last-known enemy HQ, AI memory, AI decisions using only its vision, AI siege with spotters, v6 saves and v5 migration |
| `tests/ai.test.js` | No AI resource advantages, node placement inside HQ range, the HQ's weapon, and the AI's rules: rush response, holding upgrades under threat, Habitat recovery, no Interceptor race |
| `tests/personality.test.js` | AI personalities: all four at every difficulty, variation within each style, the Aggressor turning to economy after failed attacks, the Economist defending when outgunned, Trickster feints, the Turtle's attack deadline, saved and migrated with the match |
| `tests/abilities.test.js` | Commander abilities: cost, cooldown, unlock and countdown rules; targeting limits (view for Shield and Repair, explored ground for the Orbital Strike); Shield strength, duration and no stacking; strike delay, falloff and immunities; Repair Pulse rate and how it combines with paid Repair; save/resume mid-cooldown and mid-effect, v7 migration; AI use per personality |
| `tests/extinction.test.js` | The Extinction Event: storm schedule and damage (HQ shield ignored, units untouched), no self-repair or Repair Pulse on buildings and half-rate paid Repair in the storm, ending (at once before 20:00, 5 s window after, same-tick falls, the 27:00 limit), tie-breaks down to a draw, save/resume mid-storm and in the end window, AI matches always ending by 27:00 |
| `tests/buildings.test.js` | Building art (headless Chromium): every building at every tier, team and gun angle stays on its pad and below its health bar; cached bodies match live drawing; the drawn tier is always the gameplay tier (built, upgrading, under construction, ghosts, wrecks, sold, rebuilt, loaded saves); the body cache stays bounded and is not redrawn while the zoom holds |
| `tests/determinism.test.js` | A seeded AI-vs-AI match must match a recorded fingerprint, so the rules only change on purpose |
| `tests/bots.test.js` | Scripted Rifleman-rush and turtle/tech bots play full matches |
| `tests/browser.test.js` | Real page in headless Chromium at 858×396 with simulated safe areas: countdown UI, HQ readouts, two-tap Sell, saves, resume paused, no main-canvas resizes during play, fog leaks (minimap, toasts, node progress), v5 save resume, the AI personality hidden during play and revealed after, unit sprite cache, effects fog safety and caps, sound toggle and voice limits, ability buttons and panels never overlapping (858×396 and 667×375), ability targeting, enemy strikes in the fog, the Extinction Event warning banner, meteors only where the player can see, end-screen wording and every overlay opening at its top |

The SIM tests load the SIM section of `index.html` in Node with no dependencies. The browser test needs Playwright (`npm i -D playwright && npx playwright install chromium`) and skips itself if it isn't installed.

Other tools:

- `node tests/balance.js [matches=20] [ai,rush,turtle] [difficulties]`: win counts, timeouts and match lengths for AI vs AI and bot vs AI.
- `node tests/ladder.js [matches=20] [rows]`: the difficulty ladder (AI vs AI for each pair, sides swapped halfway) and every bot against every difficulty.
- `node tests/personas.js <matches> <rows>`: results and measured behavior per AI personality (first attack, attacks, feints, Refineries, Turrets, node time, first upgrade, ability use, unit mix, and how many matches the score decided or ran past 26:00). Rows are `<bot>:<difficulty>:<personality>` or `ai:<diffA>-<diffB>:<personality>`.
- `node tests/rush-variants.js [matches] [difficulty] [filters]`: Rifleman-rush variants against the AI (the calibrated rush is `CALIBRATED` in `tests/rush-variants-list.js`).
- `node tests/duel.js [matches] [filters]`: the calibrated rush against smart-defender bots, with no AI and equal economies.
- `node tests/difficulty-options.js [matches] [current|no-bonus]`: kept for the record of the Step 3 decision on AI bonuses.
- `node tests/perf.js [battle] [memory] [--secs=15] [--rates=1,4,6] [--quality=2|1|0|auto] [--abilities] [--storm] [--bases]`: frame timing in a large battle (both armies near the population cap, mid-map, in view) at each Chromium CPU throttle rate, and JS heap after GC across 15 game minutes of AI-vs-AI play. `--bases` fills all eight pads per side at T3 and fights beside the player's base. Set `EE_HTML=path` to measure another copy of the game (for before/after comparisons); the SIM test tools (`personas.js`, `ladder.js`) honour it too.
- `node tests/ability-shots.js [outDir] [--narrow] [--tag=name]`: each commander ability's targeting, warning and effect, the off-screen strike alert, and the ability buttons next to the building and info panels.
- `node tests/storm-shots.js [outDir] [--narrow] [--tag=name]`: the Extinction Event countdown, the 30-second warning, the storm over the player's base and the score end screen.
- `node tests/fx-shots.js [outDir] [--narrow] [--tag=name]`: combat-effect screenshots (each unit idle, moving, firing and impacting; building destruction; hidden artillery at the fog edge; a large battle), stepping the game one tick at a time so shots repeat.
- `node tests/building-sheet.js [outDir] [--narrow] [--tag=name]`: every building at T1, T2 and T3 for both teams (enlarged; skipped with `--narrow`), then in game: both bases at each tier, upgrades during combat, a collapse, the storm, ability effects, ghosts under fog and the building panel. Also honours `EE_HTML`.
- `node tests/unit-sheet.js [outDir] [--tag=name] [--narrow]`: a sheet of all eight units (both teams, idle and walking, enlarged and at game size) and a large-battle screenshot. Also honours `EE_HTML`.
- `node tests/screenshot.js [outDir] [--narrow]`: PNGs of the title, intro, countdown, play, HQ states and victory at 858×396 (or 667×375). The default output folder, `tests/screenshots/`, is git-ignored.

The version shown on the title screen is `VERSION` near the top of the script in `index.html`. Bump it with every change.
