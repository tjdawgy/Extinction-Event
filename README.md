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
| `tests/bots.test.js` | Scripted Rifleman-rush and turtle/tech bots play full matches |
| `tests/browser.test.js` | Real page in headless Chromium at 858×396 with simulated safe areas: countdown UI, HQ readouts, two-tap Sell, saves, resume paused, no main-canvas resizes during play, fog leaks (minimap, toasts, node progress), v5 save resume |

The SIM tests load the SIM section of `index.html` in Node with no dependencies. The browser test needs Playwright (`npm i -D playwright && npx playwright install chromium`) and skips itself if it isn't installed.

Other tools:

- `node tests/balance.js [matches=20] [ai,rush,turtle] [difficulties]`: win counts, timeouts and match lengths for AI vs AI and bot vs AI.
- `node tests/screenshot.js [outDir] [--narrow]`: PNGs of the title, intro, countdown, play, HQ states and victory at 858×396 (or 667×375). The default output folder, `tests/screenshots/`, is git-ignored.

The version shown on the title screen is `VERSION` near the top of the script in `index.html`. Bump it with every change.
