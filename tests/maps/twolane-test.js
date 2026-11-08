// v2.63: a TEST-ONLY two-lane map. It proves the multi-lane engine (2D fog, lane movement, true-distance targeting and
// capture, lane orders, the save's map id) and never ships in the game: tests load it into the SIM's sandbox as
// EE_MAP_DATA. It is not the Two-Lane map design (that is a separate proposal). Bases and pads are Classic's, so the
// base code and art need nothing new; two lanes split past the pads and meet again before the other base.
const C = require('./classic-bases');
module.exports = {
  id: 'twolane-test', v: 1,
  display: { name: 'Two-lane test', desc: 'Engine test map. Not in the game.', thumb: { style: 'lanes', tint: '#333' } },
  size: { w: 1700, h: 800 },
  armyCap: 80,
  symmetry: 'mirror-x',
  bases: C.bases,
  modes: { '1v1': [['west'], ['east']] },
  lanes: [
    { id: 'north', path: [[0, 0], [400, 0], [580, -260], [1120, -260], [1300, 0], [1700, 0]], width: 230 },
    { id: 'south', path: [[0, 0], [400, 0], [580, 260], [1120, 260], [1300, 0], [1700, 0]], width: 230 },
  ],
  blockers: [],
  nodes: [
    { id: 'west', type: 'income', at: [680, 260], r: 70 },
    { id: 'centre', type: 'income', at: [850, -260], r: 70 },
    { id: 'east', type: 'income', at: [1020, 260], r: 70 },
  ],
  conditions: [],
  fog: 'grid', fogCell: 20, depthW: 1,
};
