# Map data format (Phase 1)

Approved after Phase 0 (v2.57), with two additions: display fields for a map-select screen, and a performance check
of the 2D fog grid. Status: the format is defined here; Classic is the first map ported to it (ROADMAP.md Phase 1).

## Principles

- **A map is data, not code.** Each map is one plain JS object in its own file, `src/sim/maps/<id>.js`, listed in
  `build.js`, so the game stays one self-contained `index.html` with nothing loaded over the network.
- **The SIM reads the map only through `g.map`.** A save stores the map's `id` and `v`; a replay needs the same
  map version.
- **Rules live in code, placement lives in maps.** How a node type behaves (income, vision, healing, guards) is one
  shared table in the SIM (`NODE_TYPES`). A map places nodes and may override a value (`yield`, `r`, `sight`, `heal`),
  so a rule can't drift between maps and a new node type never touches existing maps.
- **Bases are places; teams come from modes.** One four-base map serves 1v1, 2v2 and free-for-all.
- **Every map is validated by a test**, including its declared symmetry (the Phase 0 stance bug showed how easily a
  "mirror" stops being one).

## Coordinates

`x` runs along the battlefield from 0 to `size.w`. `y` is depth, centred on 0 (from `-size.h / 2` to `size.h / 2`).
These are today's `u` and `v`, so Classic keeps every current number.

## The object

```js
MAPS.twolane = {
  id: 'twolane', v: 1,
  display: {                              // the map-select screen (future)
    name: 'Two-Lane',
    desc: 'Two lanes and a contested centre. Split your army or win one lane hard.',
    thumb: { style: 'lanes', tint: '#2a3b52' },  // hints only: the game draws the thumbnail from the map data
  },
  size: { w: 2400, h: 1400 },
  armyCap: 80,                            // replaces POP_MAX
  symmetry: 'rot180',                     // 'mirror-x' | 'rot180' | 'rot90' | 'none'
  bases: [                                // 2 to 4; the order is the slot order
    { id: 'w', hq: [220, 700], face: [1, 0], pads: [[x, y], ...], sigPad: [x, y], rally: [460, 700] },
    { id: 'e', hq: [2180, -700], face: [-1, 0], pads: [...], sigPad: [x, y], rally: [1940, -700] },
  ],
  modes: { '1v1': [['w'], ['e']] },       // four-base maps add '2v2' and 'ffa'
  lanes: [                                // [] = an open map
    { id: 'north', path: [[x, y], ...], width: 230 },
    { id: 'south', path: [[x, y], ...], width: 230 },
  ],
  blockers: [ { poly: [[x, y], ...] } ],  // walls and obstacles; open maps rely on these
  nodes: [
    { id: 'c',  type: 'income',     at: [1200, 0], r: 70, yield: { c: 6, e: 2 } },
    { id: 't1', type: 'watchtower', at: [x, y], sight: 600 },
    { id: 'f1', type: 'forwardPad', at: [x, y], pads: [[x, y], [x, y]], allow: ['turret', 'barracks'] },
    { id: 'r1', type: 'repair',     at: [x, y], heal: 6 },
    { id: 'g1', type: 'relic',      at: [x, y], guards: [{ unit: 'titan', n: 1 }], reward: { c: 800 } },
  ],
  conditions: ['heavyFog', 'richCenter', 'scarce', 'meteors'],  // the battlefield conditions this map allows
  ai: { stage: { w: [[x, y]] }, chokes: [[x, y]] },              // optional hints for the AI
};
```

| Field | Meaning |
|---|---|
| `display.name`, `display.desc` | Shown on the map-select screen. |
| `display.thumb` | Hints for the thumbnail (style, tint). The game draws it from the map data itself (lanes, blockers, bases, nodes), the way the Codex pictures are drawn, so it can never disagree with the map. |
| `armyCap` | The army size limit on this map (supply). |
| `bases[]` | HQ position, facing, the 8 build pads, the signature pad, the rally point. 2 to 4 bases. |
| `modes` | Which bases form each team, per mode. |
| `lanes[]` | Movement corridors (a path and a width), used for movement and for the AI's lane choices. |
| `blockers[]` | Ground that units can't cross. An open map has no lanes and builds a coarse navigation grid from these at load. |
| `nodes[]` | Node placement; `type` must be in `NODE_TYPES`; a forward pad lists its own build pads. |

## Validation (a test per map)

- Every base can reach every other base on the ground.
- Pads, signature pads and nodes are clear of blockers and don't overlap each other.
- Every node `type` is in `NODE_TYPES`, and every unit a node names (relic guards) exists.
- `armyCap` is sensible (20 to 200), and the number of bases matches the modes.
- The declared `symmetry` holds for HQs, pads, signature pads, rally points, lanes and nodes.

## Fog: a 2D grid, with a performance check

Today's fog is one row of 10-wide cells along `x` (the lane). Multi-lane and open maps need a 2D grid. Before the
first multi-lane map ships, measure the 2D fog against today's at iPhone resolution (858×396 and 667×375, headless
Chromium with CPU throttling, as audit/sim/speed7c.js does): the vision update per tick and the fog drawing per frame,
early game and in a large battle. Report frame time and game seconds per real second for both; the 2D grid must not
cost the frame rate a player can notice. If it does, coarsen the cells or update vision less often than every tick.

## Order of work

1. Classic in this format with no gameplay change (the replay fingerprints prove it), plus the validation tests.
2. The 2D fog and the navigation grid, with the performance check above.
3. Two-lane, then open field, then three-lane (ROADMAP.md Phase 1).
