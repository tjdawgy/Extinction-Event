# Extinction Event roadmap

> Note: this file was created from the Phase 0 list in the session prompt, because ROADMAP.md was not in the
> repository when the session started. Replace it with the full roadmap (Phase 1 onward) and keep the checkmarks.

## Phase 0

- [x] 1. **Tie fix + remove Lessons.** When the Extinction Event ends a match, both sides get "Draw" (both were told
  they won). Remove the Lessons tab from the end-of-game screen.
  *Done in v2.48 (Lessons was already gone since v2.35; see KNOWN_ISSUES.md).*
- [x] 2. **Mirror-match check (report only).** At least 200 Hard-vs-Hard matches per faction against itself on
  audit/sim, wins by spawn side; confirm what "Bloomhost wins 64.6% of mirror matches" means; if one spawn side
  wins well above 50%, find the cause. Findings in KNOWN_ISSUES.md; nothing fixed.
  *Done in v2.49: the right side wins every Hard mirror because an autoplayed side 0 starts on Hold; the fix awaits approval (KNOWN_ISSUES.md).*
- [x] 3. **Deterministic simulation.** A seeded PRNG (mulberry32) per match for all game logic; visual-only effects
  on a separate generator. A fixed tick; 1–3× changes ticks per frame, not tick length. A same-seed test in
  audit/sim comparing a state hash every 100 ticks. Re-run the balance suite and report shifts.
- [x] 4. **Stats tracker.** One module recording per side: credits income, energy, army size and units alive every
  10 s; units built and lost by type; buildings built and destroyed; damage dealt; node captures; tech-path
  choices, signature building and ability uses with timestamps; result, faction, difficulty, match length. A
  compact summary of each finished match saved to a match history in localStorage (try/catch).
- [x] 5. **Post-match screen (replaces Lessons).** Tabs Overview, Economy (canvas line graphs of income and army
  size, both sides), Army (built/lost by unit type), Enemy Timeline (what they built, when they teched, when they
  changed strategy). Fits landscape iPhone, matches the UI style.
- [x] 6. **Alerts.** Node contested; HQ or any building under attack. Tapping an alert or its minimap ping jumps
  the camera there. Each alert type at most once every 10 s per location.
- [ ] 7. **Installable fullscreen.** manifest.json (landscape, fullscreen, theme colors), app icons drawn from
  in-game art, a service worker caching index.html for offline play, Apple home-screen meta tags. Works on GitHub
  Pages from main.
