# Audit tools

Files in this folder:
- `unit-roster.md`: the unit roster and redesign record (phases 3a and 3b).
- `validation.md`: the phase 4 validation results.
- `balance-diagnosis.md`, `balance-report.md`: the phase 5 balance pass (why the factions won, what changed, the results).
- `ai-tactics-report.md`: the phase 6a AI tactics rules (each A/B), the Hard-mode strategy search and the Hard-vs-Hard matrix.
- `hard-vs-human-report.md`: phase 7a, Hard against the scripted Greedy bot (human-style greedy play): the bot, each fix's A/B, the re-search, Hard vs Hard, Greedy vs Greedy. Raw logs in `logs7a/`.
- `sim/`: the simulation harness, described below.

## The simulation harness (`audit/sim/`)

The harness plays headless matches on the game's **real** logic. `load.js` cuts the SIM section (rules, combat, AI) out of `index.html` and runs it in a fresh Node VM context. Nothing is copied or rendered.

**Determinism:**
- Every match gets its own context, whose `Math.random` is a seeded generator, so a match is fully determined by its seed.
- Running the same spec twice gives identical results.
- A match still going at **20:00** of game time counts as a **draw**.

**Speed:** a full match takes about 6–10 s of CPU, so 100 matches take about 4 minutes on 4 cores.

### A side: `faction:preset:personality`
- **faction:** `lastfist`, `bloomhost` or `axiarchs`.
- **preset:** `default`, `legacy`, `v239` or `hard` (v2.40).
  - `default` is the game's AI since v2.38.
  - `legacy` is v2.37's AI, bit for bit (the replay fingerprint tests in `tests/determinism.test.js` prove it).
- **personality:** `aggressor`, `turtle`, `economist`, `trickster`, or `random` (rolled per match, as in the game).

### Run N matches: `run.js`
```
node audit/sim/run.js --a=lastfist:default:random --b=bloomhost:legacy:turtle --n=40 [--seed=1] [--jobs=4] [--diff=hard] [--maxT=1200] [--out=audit/sim/out/name]
```
- Match *i* uses seed `seed + i`.
- A plays from the left on even matches and from the right on odd ones, so map side doesn't count.
- Output: `name.json` (every match: winner, length, per side units trained, lost and alive, resources, Salvage, node time, AI log, and samples every 30 s) and `name.md`.
- The markdown summary covers:
  - win rates and draws, and the average match length;
  - units built and lost by type;
  - how often each unit is in a match, and in the **winning** armies;
  - mean bank, credits earned, army value and nodes held at 2, 5, 10, 15 and 20 minutes.

### Unit usage: `usage.js`
```
node audit/sim/usage.js --ai=default --n=24 [--json=out.json]
```
Mirror matches per faction, and the share of sides that trained each unit.

### Phase 4 validation: `validate.js`
```
node audit/sim/validate.js [--mirror=100] [--vs=40] [--jobs=4]
```
- **Default mirrors:** 100 per faction (crashes, endings, side balance, unit usage).
- **Default vs Legacy:** 40 matches for every faction pairing.
- Writes `audit/validation.md`. About an hour on 4 cores.

### Phase 5 balance tools
- **`balance.js`:** the balance matrix.
  ```
  node audit/sim/balance.js [--n=40] [--mirror=20] [--persona=8] [--diag] [--tag=name] [--code="UDEF.tank.cost={c:260,e:60};"]
  ```
  - Plays every cross-faction pairing, the mirrors, and each personality on both sides, on the Default AI.
  - The cap is 30 minutes: the Extinction Event decides every match by 27:00.
  - Endings are reported separately: HQ before 20:00, after 20:00, true draw.
  - Also reports units in winning armies.
  - `--code` runs an experiment's changes in every match first.
  - Writes `out/balance-<tag>.json` and `.md`.
- **`analyze.js <tag>`:** the diagnosis tables for a `--diag` run:
  - economy and army curves;
  - damage and value killed by weapon;
  - abilities and signature-building effects;
  - T2/T3 timing.
- **`instrument.js`:** the `--diag` counters. It wraps `damage()` and `kill()` inside the match's context; counting only, so a match plays identically.
- **`ab2.js`:** one pairing on the balance run's seeds, with a change. A paired A/B:
  ```
  node audit/sim/ab2.js lastfist bloomhost "FLAME.aim=false" flame 40
  ```
- **`ab.js`:** the same pairing on the same seeds, as is and with the change, in one command.
- **`duel.js`:** controlled fights, no AI: two equal-value (or equal-supply) armies meet mid-lane.
  ```
  node audit/sim/duel.js --a=rifle:3,tank:2 --b=skitterling:3,bulwark:2 --value=2000
  ```
- **`rush.js`:** the scripted Rifleman rush (tests/bots.js) against each faction's Default AI.
  ```
  node audit/sim/rush.js --n=12 --diff=normal
  ```
- **`s3.js`:** whether the bombers' supply keeps the AI from training them (Economist sides, as is and with lower supply).

### Phase 6a AI tools
- **`tactics.js`:** an A/B of AI rules. Same-faction matchups (each faction in turn), paired seeds (each seed with the sides swapped).
  ```
  node audit/sim/tactics.js --a='{"fix":{"hold":true}}' --b='{}' [--n=16] [--diff=hard]
  ```
  - A side is `{ ai, persona, fix, dial }`.
  - The `v239` preset is v2.39's Default exactly, the baseline.
- **`hardsearch.js`:** scores Hard-mode candidates (an opening and dials) against the Default field with random personalities.
  ```
  node audit/sim/hardsearch.js --faction=axiarchs --cands='[{"persona":"economist","dial":{"delay":0.6}}]' --n=20
  ```
- **`runSet({ paired: true })`:** plays each seed twice with the sides swapped.

### Phase 7a tools (Hard against human-style play)
- **`greedy.js`:** the Greedy bot (`greedyBot(S, opts)`). It plays a side through the player's own controls; `noAir` gives it a ground-only army.
  - In a match spec, `{ faction, bot: 'greedy', botOpts }` on side 0, or on both sides for bot against bot.
- **`greedyrun.js`:** an AI on side 1 against the bot on side 0, all 3 × 3 faction pairings.
  ```
  node audit/sim/greedyrun.js --ai='{"ai":"hard"}' --n=10 [--seed=90000] [--factions=bloomhost] [--bot='{"noAir":true}']
  ```
- **`ablate7a.js`:** a candidate with each named rule off in turn (leave-one-out), against Greedy.
- **`hardsearch7a.js`:** the strategy search with Greedy in the field. Score: the mean of the Greedy and Default win shares.
  - A candidate's `dial.paths` overrides its production paths.
- **`validate7a.js`:** the phase 7a validation (v2.40 and v2.41 Hard vs Greedy, vs Default, Hard vs Hard).
- **`shield7a.js`, `counter7a.js`:** what the defensive casts block, and anti-air and splash choices.
- **`botvbot.js`:** Greedy against Greedy per faction pairing: faction strength with the play held identical.
- **Presets:** `hard` is v2.41's Hard; `hard240` is v2.40's Hard exactly.

### Experiments
A side can override its preset's dials, for example to switch one competence rule off:
```js
const { runSet } = require('./audit/sim/run');
runSet({ a: { faction: 'axiarchs', ai: 'default', persona: 'random', dial: { late: 900, fix: { leash: false } } },
         b: 'axiarchs:legacy:random', n: 48 }).then(r => console.log(r.summary.wins));
```
`runMatch(spec)` in `match.js` plays one match and returns its result object.

## The AI: one brain, presets and dials
All AI sides run the same brain (`aiUpdate` and its helpers in `index.html`). Three layers decide how it plays:
- **Dials** (`AI_DIALS`):
  - **nodes to hold (1/2/3):** `nodes`.
  - **economy vs army spending:** `eco` (extra Refineries).
  - **bank vs spend threshold:** `bank`.
  - **attack timing and minimum army:** `attackAt`, `minArmy`.
  - **unit composition weights:** `comp`.
  - **defense investment:** `turrets`.
  - **signature building timing:** `sigAt`.
  - **selling buildings:** `sell`.
  - **scouting frequency:** `scout`.
  - **retreat threshold:** `retreat`.
  - **reaction delay:** `delay`.
  - **late game:** `late`.
- **Presets** (`AI_PRESETS`): `legacy` holds the constants v2.37's AI used, with no competence rules. `default` adds the competence rules (`fix`: unit roles, room for big units, path units, spotters, Titan leash, Voidcarrier spot, unit timing, spending).
  - v2.40: `default` also has the tactics rules `engage` and `sig` (`AI_TACTICS`).
  - `v239` is v2.39's Default exactly.
  - `hard` is the Default plus per-faction strategies (`byFac`: opening, dials); Hard games use it.
  - A preset can also carry per-difficulty dials (`byDiff`).
- **Personalities** (`rollPersona`): the style: build plan, attack edges, unit tastes, paths.

## Spectating in the game
On the start screen, tap the version number (top right) for the dev menu:
- Pick each side's faction, preset and personality, and a speed (1×, 2× or 4×).
- The spectator sees the whole field; nothing can be built or ordered.
- A spectated match is never saved, so the player's save is left alone.
- Pause → Main menu leaves.
