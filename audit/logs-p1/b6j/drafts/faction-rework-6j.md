## Batch 6j: the balance pass, the playtest fixes

**Batch 6j (v3.00).** Two switches in src/sim/rework-6j.js, per game in `g.rw`, on by default, saved only when on, each with a Test
Range switch ("Batch 6j fixes", "Batch 6j balance"): `REWORK.b6jfix` (Part A: the playtest fixes that change the SIM) and
`REWORK.b6j` (Part B: the AI fixes; Part D: every tuned value, `B6J`). Both off: v2.99 exactly (FP_V299 and every older set match).
Recorded: FP_V300 (every switch on). Drawing and UI fixes that can't change a match (A1, A4, the version label) have no switch.
Tests: tests/rework-6j.test.js, tests/rework-6j-ui.test.js, tests/switches-on-6j.test.js. Measurement scripts: audit/sim/b6j-diag.js
(per faction and personality: build, tiers, attacks, army and income over time), audit/sim/b6j-report.js (the Part C tables: unit
cost-efficiency, what deals the damage each faction takes, win rate by length, openers, tier-3 air, signature buildings),
audit/sim/b6j-range.js (the cost-equal Test Range checks). Logs: audit/logs-p1/b6j/ (the frozen builds each run played, range
checks, run logs), audit/logs-p1/selfplay6j-ab/, -r1/, -r2/, -r3/, -r3b/. The 6a instrument now credits damage dealt outside
`updateUnit` to its unit (a Gnatcloud's cloud, a Broodback's Bile Bloom, a Skywyrm's jaws and tendrils; before, they were "?").

### Step 0

- GitHub Pages: "pages build and deployment" run 109 built 0bfc85b (v2.99) and succeeded (2026-11-27 07:57 UTC).
- The version: the main menu already showed it (top right, `.ver`, the dev menu's tap target); the title screen now shows it too,
  small in its bottom-right corner (`#title .tver`).

### Part A: the playtest fixes

- **A1. Aircraft under the top bar (drawing only).** An aircraft flies at its SIM height `u.z` (an Interceptor 100-124 above the
  ground); near the field's top row that put its art behind the HUD ribbon (every aircraft at the top of Classic and Three-Lane was
  hidden at 667×375). Now `zVis(e)` caps the height it is drawn at so its art and health bar clear the top bar's lower edge at every
  phone size and vertical pan; `render()` lowers each aircraft's `z` for the frame and puts the SIM's value back (try/finally), and
  taps use the same height (`uScreen`). No SIM change, no switch. Screenshots: rework6j-air-classic, -air-threelane.
- **A2. The Queen and her Mites (b6jfix).** Reproduced: three Queens on a target order, packed, enemies in range, 20 s: Mites
  hatched 3-10 px from a Queen's centre (inside her body) and the body pass pushed the Queens 20-27 px off their spots (other
  Queens' Mites; a Queen's own Mites already passed through her). The order and target held in the SIM; what read as "cancels her
  attack" was the shove, and a tap meant for the enemy could land on a Mite in front of it. Now (`queenSpot6j`) each Mite hatches in
  front of her, toward her target (else her order's target, else her facing), clear of her body (queen body + Mite body + 6),
  left / centre / right in turn; in the body pass a Mite against a unit of its own side takes the whole push and moves nobody's
  held spot (`mitePush6j`); with units selected a tap never lands on your own Mites (it targets the enemy or moves the selection).
  Measured: the Queens drift ≤ 1.1 px, order and target unchanged every tick, every Mite ahead of her and at least 20 from her
  centre; the selection is untouched by births. Tests: rework-6j "A2" (SIM, with the v2.99 drift as the off case), rework-6j-ui "A2".
- **A3. The Purification Beam on any lane (b6jfix).** Reproduced as a player through the buttons: the aiming tap clamped every
  map to ±240 rows (`aimTap`), while Three-Lane's north and south lanes lie at about ±400. A tap on them became a spot at ±240, off
  the lane: "Purification Beam needs a spot on the lane", the aim stayed up, the next tap on the button cancelled it and the tap
  after fell through to the field ("Capture this forward pad first"). On Two-Lane the strip landed 40 off each lane's centre line
  (still in reach of a unit on the line, not of one beside it). 6g's fix had covered the SIM's check and the AI. Now the tap reaches
  a deep map's whole depth (`aimV6j`). Emergency Brood had v2.99's middle-of-the-map check (±LANE_V + 25) on the lane maps: any
  lane now (`brood6j`). The other abilities only shared the tap's clamp. Test: rework-6j-ui "A3" fires it through the buttons on
  every lane of both maps (it lands on the lane and hits a Tank there); screenshots rework6j-beam-twolane-north, -south,
  -threelane-north, -centre, -south.
- **A4. Train-card art.** Every unit card was drawn at a fixed scale (aircraft 1.1, ground by height) in a 56×32 canvas: 20 unit
  cards crossed an edge (Skywyrm, Talonmaw, Blightwing, Sovereign, Voidcarrier, Wraithwing, Dreadthorn, Gorebore, the old
  Bloomspire units, Bastion, Parallax, Shardling, Riftstalker, Ravager, Gnatcloud, Rift Mortar, Bile Lobber). Now (`fitUnitIcon`,
  `artBB`) a card keeps its old scale and place unless its art would cross the top or a side (a ground unit may stand on the
  bottom edge), then it shrinks to fit and is centred; the Test Range's icons use it too. The Codex already fitted its pictures to
  the drawn pixels (none clipped). Test: rework-6j-ui "A4" (no card or Codex picture of any unit touches an edge); screenshots
  rework6j-spire-swarm, -spire-apex.
- **A5. A sold brood (b6jfix).** A Larva Pit sold with a brood queued refunded one Skitterling's price (`trySell` used `unitCost6`;
  since 5b): now the brood's (`trainCost`), as 6i did for the Razorwing flock.
- **A6. The "signature pad".** In the game it is the ninth pad of each base, just past the HQ at the base's outer corner
  (`SIG_SLOT`, `MAP.bases[s].sigPad`; since v2.43): only a signature building stands there, one of the faction's two at a time
  (Last Fist: Salvage Yard or Fortification Depot; Bloomhost: Brood Mound or Rootheart; the Axiarchs: Phase Beacon or Echo Reliquary).
  The tutorial's Building chapter, the empty-pad card ("Signature pad") and the build cards ("★ SIG PAD") name it. The Hard AI uses it:
  every personality builds a signature building there from 5:00 (`HARD_SIG_7C`), in 94% of sides (6i's 162 matches: Last Fist 32 /
  33 / 36 of 36 Boomer / Economist / Turtle sides, Bloomhost 36 / 35 / 34, the Axiarchs 32 / 30 / 34; the rest lost or under
  pressure before). It always builds the same one per faction (the preset names it: the Salvage Yard, the Rootheart, the Phase
  Beacon); the Fortification Depot, Brood Mound and Echo Reliquary are never chosen. Used, so not changed (reported).

### Part B: the AI fixes (b6j)

- **B1. The Last Fist Turtle and Boomer** (6i: 28% and 25%). Evidence (audit/logs-p1/b6j/diag-6i.md, audit/sim/b6j-diag.js): the
  Boomer fielded the largest army of any side at 9 and 12 minutes (3,490 / 3,530) and won 25%; the Turtle never built a Tech Lab
  (0 of 36: batch 6d's plan) and its army stalled near 2,200; Last Fist sides that made two or more "siege" pushes won 10 of 42
  (24%), the rest 44%; the Boomer made 4.5 a match, the Turtle 3.6, the Economist (56%) 0.5. The bug: a siege push stops the whole
  army just outside the enemy HQ gun (`siegeLine`, its range + 25) for its siege guns to shell the base; v2.99 counted any two
  siege units (`AI_SIEGE`: Artillery and Titans) without asking what they could reach. Two Titans (reach 160 since 2b) parked 555
  from the HQ with nothing in reach, and since 6c the HQ can't be hurt while another building stands. Fixed (`siegeN6j`): a siege
  needs two Artillery-type guns and a known enemy building (not the HQ) within their reach of the line; else the attack goes in.
  The Turtle's missing Tech Lab: it grows one late as 6i's Bloomhost Turtle grows its Bloomspire (`plan6i`, `turtle6i`). Upgrades
  and composition: no logic bug found (the Boomer upgrades its economy first by design; its unit tastes favour Tanks and Heavies).
  After Parts A-B (162, audit/logs-p1/selfplay6j-ab/): Last Fist 36% → 44%, its Boomer 36%, Turtle 39%; siege pushes 2.9 → 1.6 a Last Fist side and match (each now with Artillery in reach of a known building).
- **B2. Tier-3 air.** The fixed order (AI_UPG) puts the air building's T3 16th of 20; with b6j, from 8:00, with the air building,
  three Refineries and 60% of the step's credits, its T2 and T3 go first (`air6j`). That changed little (Parts A-B: tier-3 air
  in 6 / 32 / 13 of 108 Last Fist / Bloomhost / Axiarch sides, 6i 3 / 33 / 12): a probe found the real limit was having an air
  building at all (Last Fist's Economist built a Tech Lab in 11 of 36 sides, the Axiarch Turtle in 0 of 36: the plan's last item
  after the pads fill). So every Last Fist and Axiarch personality without one grows one late the same way (`late6j`; round 1 on).
  Last Fist's Leviathan, unlocked, was still rarely trained (its score falls with the enemy's anti-air, and every Bloomspire unit
  and the Spitter hit aircraft): from round 3 a side with none scores its first at least 1.6 (`aiScores6j`). Results in the table
  below.
- **B3. The Skywyrm at fortified nodes.** 6i's node assault already takes a Skywyrm first (its building rate sorts it first) at 50%
  health or more; now from 30% (`wyrm6j`). How often one is there follows B2.
- **B4. Other AI findings** (reported, not changed): the "siege" push also fires with no siege units at all (`go(siegeLine, 'siege')`
  on a bold edge; it waits up to 50 s at the line before going in; rare outside Last Fist, 0.1 a match); the Leviathan's counter
  rule (above); the Last Fist Turtle's Tech Lab path is Support (Medevacs, Drones) by design, so it never has tier-3 air; the
  signature building choice is fixed per faction (A6); Gnatclouds are sent one at a time "at the thickest clump" (`aiRework6i`), so
  in matches they rarely stack as they do in the Test Range check (below).

### Part C: diagnosis (6i's run and the Parts A-B run; audit/logs-p1/b6j/diag-6i.md, audit/logs-p1/selfplay6j-ab/b6j.md)

PART_C

### Part D: tuning (b6j; docs/BALANCE_AUDIT.md section 18 has every table)

PART_D

### Tests

TESTS

### Departures

- A1 changes only where an aircraft is drawn and tapped; its SIM height (and where its shots start) is unchanged.
- A2's rule that a Mite takes the whole push applies to every Mite against its own side (the Brood Mound's and Blight's too).
- A3: the aim reaches the whole depth of every deep map (the abilities' own checks decide what is allowed there).
- B2's late air building (`late6j`) and the first-Leviathan score are AI logic changes measured inside the tuning rounds (from
  round 1 and round 3), not in the Parts A-B run; the tables say so where it matters.
- The Gnatcloud's check sits on a cliff: the outcome of four identical clouds over a clump of Marines flips over a few hundredths
  of a damage point (3.05: 38%, 3.075: 55%, 3.1: 68% over 40 seeds).
