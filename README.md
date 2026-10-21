# Extinction Event

A single-file mobile real-time strategy game. Open `index.html` in a browser (best in landscape on a phone).

## Tests

```
npm test
```

Runs the game simulation headlessly (building, training, upgrades, save/load, and full AI-vs-AI matches on every difficulty). If Playwright is installed it also loads the page in headless Chromium, starts a match and checks for errors; otherwise that test is skipped.

The version shown on the title screen is `VERSION` near the top of the script in `index.html`. Bump it with every change.
