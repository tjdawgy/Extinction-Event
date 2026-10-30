# Audit tools

Files in this folder:
- `unit-roster.md`: the unit roster and redesign record (phases 3a and 3b).
- `validation.md`: the phase 4 validation results.
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
- **preset:** `default` or `legacy`.
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
- **Personalities** (`rollPersona`): the style: build plan, attack edges, unit tastes, paths.

## Spectating in the game
On the start screen, tap the version number (top right) for the dev menu:
- Pick each side's faction, preset and personality, and a speed (1×, 2× or 4×).
- The spectator sees the whole field; nothing can be built or ordered.
- A spectated match is never saved, so the player's save is left alone.
- Pause → Main menu leaves.
