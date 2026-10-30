# Extinction Event — working rules for Claude Code

## Current state
- Version: v2.35 (audit phase 1, quick fixes: selected-building glow and pad header, a confirm tap on costly upgrades, Stats replaced the Lessons tab, retreating units hold their fire; KNOWN_ISSUES.md "Audit phase 1"). v2.34 (signature buildings complete: batch 3, the Axiarch Phase Beacon and Echo Reliquary, plus the Build tab flashing fix. v2.33 batch 2: the Bloomhost Brood Mound with Mites and the Rootheart; v2.32 batch 1: shared rules, the Last Fist Salvage Yard and Fortification Depot with node bunkers; v2.31 playtest bug fixes; v2.30 Salvage; the Axiarchs completed at v2.29; title screen since v2.23, assets/title-screen.jpg).
- Factions: all three are complete. **Last Fist** (upgrade trees: Barracks v2.13, War Factory v2.14, Tech Lab v2.15), **Bloomhost** (framework v2.17, creep v2.18, Larva Pit and Evolution Chamber trees + anti-air v2.19, commander abilities + temporary units v2.20, Bloomspire tree v2.21; complete at v2.22) and **Axiarchs** (framework v2.25, power field and warp-in v2.26, Genesis Gate and Architectum trees v2.27, commander abilities v2.28, Celestial Array tree v2.29; complete at v2.29).
- Roadmap: done: Last Fist upgrade trees → Bloomhost → Axiarchs. Next, in order: Last Fist identity pass → strategy explorer + full balance audit + matchup testing → AI training (including the deferred Bloomhost and Axiarch AI items, AI coverage checks and performance checks) → campaign, multiplayer, App Store.
- Last Fist identity pass per docs/LASTFIST.md (v2.30–v2.33), then the audit. Done: v2.30 Salvage (the SALVAGE constants block; SALVAGE.pct 0 switches it off and plays exactly as v2.29). v2.31 went to playtest bug fixes (KNOWN_ISSUES.md "Resolved in v2.31"; the Flame Tank off-centre bug is logged under Open, awaiting approval). Next: the Last Fist polish batch (planned as v2.31 in docs/LASTFIST.md), which also covers the Salvage Yard and Fortification Depot art.
- Building signature buildings per docs/SIGNATURE_BUILDINGS.md section 7: v2.32 shared rules + Last Fist (Salvage Yard, Fortification Depot), v2.33 Bloomhost (Brood Mound, Rootheart), v2.34 Axiarchs (Phase Beacon, Echo Reliquary) + close-out docs. Then the Last Fist polish batch, then the audit. Done: v2.32 (roles `sigA`/`sigB`, the YARD, BUNKER and SIG blocks; `SIG.on` false switches them off; KNOWN_ISSUES.md "Signature buildings, batch 1"), v2.33 (the MOUND and ROOT blocks, the `mite` unit; "Signature buildings, batch 2"), v2.34 (the BEACON and ECHO blocks; "Signature buildings, batch 3"). Signature buildings are done (docs/SIGNATURE_BUILDINGS.md is marked complete, with a stats table). Next: the Last Fist polish batch, then the audit.
- Until the audit, implementation only: no balance tuning, no tactical AI work, and no matrices or ladders unless a prompt asks for them. The only AI changes allowed are the minimum the AI needs to build and use new content.
- No balance tuning, matchup testing, or tactical AI work until all three factions are in. Log findings under Audit in KNOWN_ISSUES.md.
- Bloomhost: complete (v2.17–v2.21; v2.22 closed it out with a Definition of Done check at the end of docs/BLOOMHOST.md). Its AI pass moved to the AI training phase; its balance, matchup and performance items are grouped under "Bloomhost summary" in KNOWN_ISSUES.md.
- Axiarchs: complete (v2.25–v2.29; v2.29 closed it out with a Definition of Done check at the end of docs/AXIARCHS.md). Their AI quality pass and performance check moved to the AI training phase; their balance, matchup and AI items are grouped under "Axiarchs summary" in KNOWN_ISSUES.md.
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
