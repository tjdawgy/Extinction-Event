# Balance audit (batch 6a, v2.91): where balance stands after the faction rework

Measurement only. Nothing in the game changed: index.html is byte-identical to v2.91 (commit 2f53aaa), every REWORK switch is
at its default (on) unless a measurement says otherwise. Scripts and logs are under audit/ so every number here can be
re-run after tuning (section 6).

## 1. Open balance flags (inventory)

Every open balance item from KNOWN_ISSUES.md (each rework batch's "Open" list, the Watch list, the faction summaries) and
docs/FACTION_REWORK.md (batch notes and Watch list), duplicates merged. "M" says where this audit measures it (S = the
90-match self-play, section 2; R = a Test Range or scripted measurement, section 3).

| # | Flag | Source | M |
|---|------|--------|---|
| F1 | Artillery has both a 2 s deploy / 1.5 s pack (`artDeploy`) and telegraphed shells (`artTelegraph`, a marker at least 1.6 s before landing): two nerfs stacked on one unit | 2a (v2.82), FACTION_REWORK batch 2 | R7, S |
| F2 | The Severance aims at a group's centre with no lead: a marching column walks out of the orb; AI orbs land mostly on fights | 2a | S |
| F3 | Bloomhost lost its only long-range unit (Bile Lobber → Gorebore); "expect it to need the most attention" | 2a, Watch list | S |
| F4 | The Titan's reach dropped from 190 (280 planted: P8's siege lock +90) to 160 (breach plant within 100 of a building) | 2b (v2.83) | R6 |
| F5 | Titan cover (Last Fist infantry within 70 take 30% less from non-melee) makes infantry blobs with a Titan much tougher against Bloomhost and Axiarch ranged units | 2b | R6 |
| F6 | AI Ruinmaws dive into bases beside economy buildings and can die there with a full tunnel | 2b | S |
| F7 | The Leaper now hard-counters vehicles (latched: 10/s per Leaper, host 30% slower; Tanks and Titans lose 10-30 HP/s) | 3a (v2.84) | R5 |
| F8 | Hatched Skitterlings (a Leaper host dying) count toward the 60 Skitterling limit | 3a | (not measured) |
| F9 | AI Riftstalkers are rare (13 in 54 matches) and their blink home never happened in self-play | 3a, 3b | S |
| F10 | The Bastion's barrier (600 HP, 70 ahead, 90 wide) makes ranged armies (Marines, Heavies, Spitters, Lancers) much weaker against an Axiarch front; Artillery correspondingly stronger | 3b (v2.85) | R4 |
| F11 | The Shardling parry (every 4 s the next hit negated, 2× counter in melee) makes Shardlings much stronger early; an all-Shardling rush wins early (the Default Aggressor beat the Last Fist Turtle near 5:00 in 2 of 3 seeds) | 3b, tests/slow/ai-stats | R3 |
| F12 | The parry makes Skitterling swarms weak against Shardlings | 3b | R3 (indirectly), S |
| F13 | AI Dreadthorns are rare (the Bloomhost AI takes Burrowing Evolution): 2 in 54 natural matches | 3b | S |
| F14 | The Marksman's mark (+25%) counts every damage source of the marking side (buildings and abilities too); the AI marks often | 4a (v2.86) | S |
| F15 | The Wraithwing: splash never hits aircraft and its hops make non-specialist anti-air lose it; its only design counters are chain beams, instant beams and the anti-air specialists | 4a, Part 0 | S |
| F16 | The Bilecaster's 150 range is short against Marines and Lancers holding at range | 4a | S |
| F17 | The Gunship's 4 × 22 salvo then 3.4 s pause: about the old damage per second, front-loaded | 4a | S |
| F18 | The Leviathan's bombing runs: about a quarter of P10's damage per second against one target; its runs carry it 120 past the target, over defences | 4b (v2.87) | R1, S |
| F19 | The Astral Sovereign's judgement beam keeps P12's ×2.1 against buildings: 546 per shot | 4b | R2, S |
| F20 | Brood Tyrant pustules on a building the enemy never repairs add 18/s each building; a fall bursts them into Mites inside the base | 4b | S |
| F21 | A landed Worldrender below 35% takes off and never re-lands until healed | 4b | (not measured) |
| F22 | The Voidcarrier as pure support may feel dull | 4b, Watch list | S |
| F23 | Broods are cheap per health: 4 × 50 HP for 120 (v2.87: one at 40-60 HP for 60), and the AI fills its 60 Skitterlings fast (peak 46 units alive on Classic) | 5b (v2.88) | S |
| F24 | Swarm surge + creep + Frenzy Bloom make a Skitterling very fast (52 × 1.4 × creep × 1.3) | 5b | R8 |
| F25 | The Spitter is a big step up in anti-air (volleys, 15/s, 1.5× to aircraft, tracks hopping Wraithwings) | 5b | R9 |
| F26 | Kill frenzy chains through a big fight, so most of a swarm stays in frenzy | 5b | S (indirectly) |
| F27 | AI games rarely reach tier 3 air; the Bloomspire never reached T2 in 14 of 48 Bloomhost matches (5c), so Needlewings rarely meet aircraft | 5b, 5c, Audit (Leviathan almost never trained), faction summaries (production T3 rarely reached) | S |
| F28 | With b5c on the Bloomhost AI leans Swarm Bloom (75%) against every Last Fist enemy, even one that never flies | 5c (v2.90) | S |
| F29 | Axiarch control stacking (exile, walls, the Parallax swap) must not leave the opponent unable to play | Watch list | (not measured: needs playtest) |
| F30 | Hydra under 1% of units trained; Recon Drones lost and retrained (pre-rework Audit list) | Audit (v2.14-v2.15) | S |

Pre-rework items that the rework replaced (the Bile Lobber, the Rift Mortar, the old Leviathan and Sovereign, the
Riftstalker fade, the old Bastion surge) are left out; the pre-rework faction win shares (KNOWN_ISSUES "Audit baseline",
phases 5-7c) are superseded by section 2.
