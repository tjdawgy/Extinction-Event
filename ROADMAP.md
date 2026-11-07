# Extinction Event — Roadmap

Baseline: v2.47. Known balance issues are tracked in KNOWN_ISSUES.md.

## Guiding principle

Extinction Event is a genuinely strategic RTS built for a phone. Depth comes from decisions (what to build, where to fight, which tech path), not from tapping fast.

Every feature must pass one test: does this add a decision, or just a tap?

## Phase 0 — Fixes and foundations (v2.54)

- [x] **Tie fix.** When the extinction event ends a match, the result is a draw for both sides. It currently shows a win to both.
  *Done in v2.48: an ending the storm decides (an HQ lost to the storm, both HQs in the 5 s window, the 27:00 limit) is a draw (`EXT.draw`); "both told they won" was the match log's "you won" line shown in both timeline columns.*
- [x] **Remove the Lessons tab** from the end-of-game screen.
  *Done in v2.48: Lessons was already gone (Stats replaced it in v2.35); v2.52 replaced the whole tab set.*
- [x] **Mirror-match check.** Bloomhost reportedly wins 64.6% of Hard-vs-Hard mirror matches. If both sides really are Bloomhost, the split should be close to 50%. Check win rate by spawn side to find any map or spawn asymmetry, and report it before fixing anything.
  *Done in v2.49 (report only; audit/sim/mirror.js, KNOWN_ISSUES.md): 64.6% was Bloomhost's cross-faction Hard-vs-Hard share, not a mirror. In 200 mirrors per faction the right side wins every one (Last Fist 80–48, Bloomhost 52–23, Axiarchs 83–23) because an autoplayed side 0 starts on Hold instead of Retreat; with equal stances the sides are even. Fix awaits approval.*
- [x] **Deterministic simulation.**
  - Use a seeded random number generator for all game logic; visual-only randomness stays separate.
  - Run the simulation on a fixed tick, independent of frame rate and game speed.
  - The same seed plus the same inputs must always produce the same match. This unlocks replays, the daily challenge and multiplayer.

  *Done in v2.50: mulberry32 per match (`g.seed`, saved), visual effects on their own stream, `TICK` = 1/60 s with 1–3× running more ticks; audit/sim/determinism.js compares a state hash every 100 ticks (6 seeds × 10 min identical); balance re-run showed no big shifts.*
- [x] **Stats tracker.** One system records each match: income, army size and units alive over time; units built and lost by type; buildings built and destroyed; damage dealt; node captures; tech-path and signature-building choices with timestamps; ability uses; and the result. The post-match screen, match history, achievements and faction mastery all read from it.
  *Done in v2.51: `g.stats`, sampled every 10 s; a compact summary of each finished match goes to localStorage `extinctionEvent.history` (last 50).*
- [x] **Post-match screen**, replacing Lessons:
  - Overview
  - Economy graphs
  - Army breakdown
  - Enemy timeline: what they built, when they teched, when they switched strategy

  *Done in v2.52.*
- [x] **Alerts.** Warn when a node is contested and when the HQ or other buildings are under attack, with a tap to jump the camera to the alert. Throttle repeated warnings.
  *Done in v2.53: once per 10 s per location; the toast or its minimap ping jumps the camera.*
- [x] **Installable fullscreen.** Add a web app manifest, icons and a service worker so players can Add to Home Screen and play in fullscreen landscape, offline.
  *Done in v2.54: icons drawn from the game's art; offline play tested on a GitHub Pages-style path; not yet tried on a real iPhone.*
- [ ] **Decision: split index.html into modules?** A small build step could still output one HTML file. Decide this before Phase 1, because the map system will grow the code a lot.
  *Recommended: yes, a mechanical split into src/ files concatenated by a dependency-free script into the same committed index.html, first build byte-identical; awaiting your decision.*
- [ ] **Stance fix** (from the mirror check): an autoplayed side 0 starts on Retreat like the AI. Awaiting approval.
- [ ] **New audit baseline**: re-run the mirrors, Hard vs Hard and Hard vs Default after the stance fix, since every earlier AI-vs-AI number had one handicapped side.
- [ ] **index.html split**, if the decision above is yes.

## Phase 1 — Replayability

- [ ] **Map system.**
  - Each map defines its own paths, pads, nodes, army size limit and number of bases.
  - Support up to four bases from day one, for future 2v2 and free-for-all.
- [ ] **Maps.** Build them in this order:
  1. Classic — the current single lane, for short matches.
  2. Two-lane — two lanes with a contested center.
  3. Open field — no lanes, just obstacles you can flank around.
  4. Three-lane — a big map for long games, built last.
- [ ] **Node types:**
  - Credit or energy — income, as now.
  - Watchtower — clears fog in a wide radius.
  - Forward pad — capture it to build there. This replaces adding more pads at the home base.
  - Repair depot — heals units nearby.
  - Guarded relic — neutral defenders, big payoff.
- [ ] **Battlefield conditions** (optional per match): heavy fog, rich center nodes, scarce resources, meteor strikes.
- [ ] **Army control:**
  - Split Army — assign squads to lanes. This ships with multi-lane maps.
  - Two rally points — one defensive, one forward.
  - "Send damaged home" button.
- [ ] **AI learns the new maps.** Expect real tuning time for each layout.
- [ ] **Balance pass.**
  - Extend the sim harness to run on every map.
  - Fix the Tech vs Contain spread.
  - Check faction win rates per map.
  - Target 10–15 minute matches.

## Phase 2 — Feel

- [ ] **12 AI personalities**, built on the map-aware AI.
  - Faction flavor: Bloomhost swarms and is opportunistic, Axiarchs are patient and punishing, Last Fist is methodical.
  - Variety within each faction: rusher, boomer, turtle and others.
  - Re-run the sim harness across maps × personalities.
- [ ] **Combat polish pass:**
  - weapons and explosions that show their damage radius
  - visible damage states
  - unit-specific deaths
  - building destruction that feels satisfying
  - weapon sounds you can tell apart without looking
  - big arrivals for Titans, Sovereigns and Worldrenders
  - light screen shake only
- [ ] **Wreckage and craters** as simple ground decals; check performance on older iPhones.
- [ ] **Signature buildings as commitments.** Each should change how you play, not just be the strongest building.

## Phase 3 — Strategic depth

- [ ] **Commanders.** Two or three per existing faction, each with different abilities and one passive. These are play styles within the faction (for example, a Last Fist armor commander versus an air commander). Future factions are not commanders.
- [ ] **Practice mode** with handicaps and AI sliders.
- [ ] **Extend the sim harness** to cover commanders.

## Phase 4 — Reasons to come back

- [ ] **Achievements:** vs AI, faction, campaign, and later multiplayer. Tie these into Game Center after the App Store release.
- [ ] **Faction mastery:** wins and milestones tracked per faction.
- [ ] **Unlockable player portraits**, drawn by the game itself the way the Codex pictures are.
- [ ] **Match history and personal records.**
- [ ] **Daily challenge:** the same seeded map and condition for everyone, with cosmetic rewards. This replaces login-style daily rewards.
- [ ] **Challenge scenarios**, such as "survive 10 minutes" or "win without Refinery upgrades."

## Phase 5 — Story campaign

- [ ] **Vance storyline:** three faction perspectives, scripted objectives and unusual conditions, built from Phase 1 parts (maps, node types, conditions, AI).
  - No training campaign; the tutorial covers onboarding.

## Phase 6 — App Store

- [ ] Wrap the game in a native app shell (for example, Capacitor).
- [ ] Apple developer account, privacy policy, App Store screenshots.
- [ ] Performance testing on older iPhones.
- [ ] Cloud saves, if saves should follow players between devices.
- [ ] Trademark and App Store name check for "Extinction Event."

## Phase 7 — Multiplayer (after the App Store release)

- [ ] **Lockstep multiplayer** built on the deterministic simulation, plus a small matchmaking server.
- [ ] Build in this order:
  1. 1v1 with friends
  2. Ranked play with a rating system
  3. 2v2 and 1v1v1v1 on four-base maps

## Phase 8 — New factions (post-launch)

Full factions, each with its own mechanic:

- Iron Plague — infected humans
- Infected Axiarch faction — needs a new name before release, because "Blood Angels" is a Warhammer 40K trademark
- Rusted Legion — a broken-down order that sacrifices its own units for power
- Templars — needs an identity distinct from the Axiarchs

Each new faction raises the number of matchups to balance: 4 factions have 10, 5 have 15, 6 have 21, 7 have 28. Extend the sim harness for every faction added.

## Decided against

- Account XP levels and login rewards. Mastery, portraits and the daily challenge do this better.
- Unit loadouts. Commanders give the same feel and are easier to balance.
- Focus fire and select-by-type. Too fiddly on a phone.
- Async or turn-based multiplayer. It doesn't fit a real-time RTS.
- More pads at the home base. Forward pads on the map are used instead.
- Training campaign. The tutorial covers onboarding.
