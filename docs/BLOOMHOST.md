=== BLOOMHOST DESIGN DOC ===
[PASTE THE FULL GROK/CHATGPT DOC HERE]

=== AMENDMENTS — these override the design doc above wherever they conflict ===

A. LOOK AND FEEL
- Art direction: inspired by the general style of StarCraft's Zerg — chitin, carapace, claws, membranes, pulsing organic structures, creep — but every design must be original. Do not copy any Blizzard unit, building, or name.
- Building pads: Last Fist keeps its industrial pads. Bloomhost's 8 pads are organic: fleshy, creep-covered mounds or root beds that look like part of the creep, not concrete or steel. Empty Bloomhost pads look like dormant growth. Each side's pads match its own faction.
- Procedural art drawn the same way current art is drawn. Readable at phone scale.

B. UPGRADE PATH STRUCTURE (match Last Fist's tree system in code)
- Each production building has one base unit available on both paths: Larva Pit → Skitterling, Evolution Chamber → Bulwark, Bloomspire → Razorwing.
- The path choice happens at the same upgrade step where Last Fist picks its path, and it locks the building. Reuse Last Fist's tree system. Do not build a new one.

C. OUT OF SCOPE UNTIL ALL THREE FACTIONS ARE IN
- No balance tuning, matchup testing, or stat iteration. Set first-pass numbers by comparing against Last Fist equivalents (cost per supply, damage per credit), log them, and move on. Section 8G, section 12 balance testing, and Phase 7 are deferred to the audit, which happens after the third faction. Log every open balance question under "Audit" in KNOWN_ISSUES.md.
- Do not change Last Fist unit behavior (e.g., kiting) to help Bloomhost.
- Deferred: the Skitterling approach-defense window, the creep vision bonus, Bulwark directional bracing (use a simple timed brace instead), and the Emergency Brood creep bonus.
- AI: only the minimum needed for the AI to play Bloomhost — build its economy, pick paths, train from every building, capture nodes, use abilities. Smarter tactics come in the AI training phase. No AI cheating.

D. BUILD ORDER — one batch per session, each with its own prompt. Never implement beyond the current batch.
1. v2.17 Framework: match setup menu (see E), all 8 Bloomhost buildings with organic pads and tier art, base units (Skitterling, Bulwark, Razorwing), the Maw, saves, and minimal AI using base units.
2. v2.18 Creep.
3. v2.19 Larva Pit and Evolution Chamber trees.
4. v2.20 Commander abilities, including the temporary-unit system (Cloudwing reuses it later).
5. v2.21 Bloomspire tree.
6. v2.22 Bloomhost AI pass plus smoke tests.
Each batch's finish line: npm test passes, a short AI smoke test with no errors or timeouts, and performance within noise of the previous version.

E. MATCH SETUP AND HIDDEN ENEMY FACTION
- Match setup menu, in this order: 1) AI difficulty (Easy / Normal / Hard), 2) your faction (Last Fist / Bloomhost / Random), 3) opponent faction (Last Fist / Bloomhost / Random). Mirror matches are allowed. Remember the last choices. Must fit and be tappable at 667x375.
- If you pick Random for yourself, your faction is shown when the match starts.
- The opponent's faction is never revealed by the UI: no name, color, icon, toast, or log line gives it away during the match. You learn it only by scouting (seeing their units, buildings, or creep in your vision).
- Fog of war hides the enemy's buildings, pads, and creep until seen, the same as units. This overrides any part of the design doc that says creep is visible through fog.
- Commander ability effects and sounds from the enemy must not reveal their faction unless they happen inside your vision.
- The post-match report and match log reveal both factions.
- Old saves load as Last Fist vs Last Fist.
