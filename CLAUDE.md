# Extinction Event — working rules for Claude Code

## Current state
- Version: v2.21.
- Factions: **Last Fist** (upgrade trees done: Barracks v2.13, War Factory v2.14, Tech Lab v2.15) and **Bloomhost** (framework v2.17, creep v2.18, Larva Pit and Evolution Chamber trees + anti-air v2.19, commander abilities + temporary units v2.20, Bloomspire tree v2.21).
- Roadmap, in order: finish all Last Fist upgrade trees → Bloomhost faction → third faction → strategy explorer + full balance audit + matchup testing → AI training → campaign, multiplayer, App Store.
- Until the audit, implementation only: no balance tuning, no tactical AI work, and no matrices or ladders unless a prompt asks for them. The only AI changes allowed are the minimum the AI needs to build and use new content.
- No balance tuning, matchup testing, or tactical AI work until all three factions are in. Log findings under Audit in KNOWN_ISSUES.md.
- Bloomhost: v2.17 framework done (setup menu, hidden enemy faction, 8 buildings, base units, minimal AI); v2.18 creep done; v2.19 Larva Pit and Evolution Chamber trees and anti-air done; v2.20 commander abilities and the temporary-unit system done; v2.21 Bloomspire tree done. Next: v2.22 Bloomhost AI pass plus smoke tests per docs/BLOOMHOST.md amendment D.
- Until the audit, testing is functional only: npm test, one SIM match to confirm a full match runs, one browser check of anything with new UI, and screenshots of new visuals. No matrices, ladders, per-personality runs, or repeated performance runs unless a prompt asks for them. Performance runs only at the end of a faction or when a prompt asks.
- Workflow: each batch is a new session that starts by reading CLAUDE.md and KNOWN_ISSUES.md.

## What this is
A mobile real-time strategy game (formerly Colony Mobile) in a single self-contained HTML file (index.html). It plays in landscape on iPhone with no build step or dependencies, and no network once loaded. The code is organized into marked sections: SIM (rules, combat, AI), RENDER (drawing) and UI (HUD, input, menus).

## Rules for every session
- Before changing anything, confirm you can push to main. If you can't, stop and tell me.
- Commit before changing anything, so every step can be rolled back.
- Bump the VERSION constant (v1.1, v1.2, …) with every change you push.
- Inspect the actual code before proposing changes. Do not guess values; cite code locations.
- Explain the plan and wait for my approval before large changes.
- Change only what the step asks. Do not rewrite unrelated systems.
- Keep the game a single self-contained HTML file with no external dependencies.
- Report exactly what you tested, what passed, and what could not be verified. Never claim a test passed unless you ran it.

## Features that must keep working (regression checklist)
- Hold, Attack and Retreat stances; 1–3× speed; pause; Easy, Normal and Hard difficulty.
- Overview minimap inside the top bar (tap or drag to jump).
- Top bar sits BELOW the viewer's top strip. The Claude artifact viewer swallows taps in that strip, so nothing interactive may go there. Sky and scenery may fill it.
- Build by tapping an empty pad then a card, or just a card. Tap the same spot again to cycle through overlapping buildings.
- Building upgrades T1–T3, two-tap Sell (50% refund), paid Repair plus slow self-repair, Turret building.
- Field nodes (capture for income) and the HQ shield (HQ is invulnerable while any other building stands).
- Long-press a card for unit or building info.
- Auto-save and resume via localStorage keys `colonyMobile.save` and `colonyMobile.diff`. Never rename these keys.

## Testing
- Run `npm test` before every push. It must pass.
- The test kit lives in tests/ and loads the SIM section headlessly in Node.
- Every balance claim must come from test scripts, reported as win counts over at least 20 matches.

## Step discipline
- Implement one step at a time. Do not start the next step until the current one is complete and tested.
- Before each step, briefly explain what exists, what you intend to change, and any risks or design decisions that need my approval.
- If a major design decision is unresolved, ask me before implementing it rather than silently choosing.
- If you discover a problem that requires a change to an earlier step, explain why before making a major change.
- Test the actual game after implementation. In reports, separate automated tests, manual tests, and what could not be verified. Do not claim success based on code inspection alone.
- End each step with a concise report of changes, tests performed, results, and remaining issues.
- Goal: make Extinction Event a genuinely strategic, replayable RTS where army composition, economy, scouting, positioning and player decisions matter.
