/* ---------- Two-Lane (v2.65): docs/TWO_LANE.md ----------
   Two lanes split by a ridge, with one crossing in the middle where the rich centre node sits. Bases are Classic's
   layout (the west base is Classic's, number for number; the east base its mirror across x = 1100), so building works
   as on Classic. Node order: 0 west-north, 1 centre, 2 east-north (the three spots the AI knows from Classic: its own,
   the centre, the enemy's), then the south income nodes, the watchtowers and the forward pads. */
MAPS.twolane = (() => {
  const W = 2200, mx = p => [W - p[0], p[1]], wb = MAPS.classic.bases[0];
  const north = [[0, 0], [400, 0], [580, -280], [1620, -280], [1800, 0], [2200, 0]];
  const ridgeW = [[600, 0], [700, -150], [1030, -150], [1030, 150], [700, 150]];
  return {
    id: 'twolane', v: 1,
    display: { name: 'Two-Lane', desc: 'Two lanes split by a ridge, with a rich centre node at the only crossing. Split your army or win one lane hard.', thumb: { style: 'lanes', tint: '#2a3b52' } },
    size: { w: W, h: 900 },
    armyCap: 100,
    symmetry: 'mirror-x',
    bases: [
      { id: 'west', hq: wb.hq, face: [1, 0], sigPad: wb.sigPad, rally: wb.rally, pads: wb.pads },
      { id: 'east', hq: mx(wb.hq), face: [-1, 0], sigPad: mx(wb.sigPad), rally: mx(wb.rally), pads: wb.pads.map(mx) },
    ],
    modes: { '1v1': [['west'], ['east']] },
    lanes: [
      { id: 'north', path: north, width: 230 },
      { id: 'south', path: north.map(([x, y]) => [x, -y]), width: 230 },
    ],
    blockers: [{ id: 'ridgeW', poly: ridgeW }, { id: 'ridgeE', poly: ridgeW.map(mx).reverse() }],
    nodes: [
      { id: 'wn', name: 'north-west', type: 'income', at: [700, -280], r: 70 },
      { id: 'c', name: 'centre', type: 'income', at: [1100, 0], r: 70, yieldMul: 1.5 }, // the rich centre node, in the crossing
      { id: 'en', name: 'north-east', type: 'income', at: [1500, -280], r: 70 },
      { id: 'ws', name: 'south-west', type: 'income', at: [700, 280], r: 70 },
      { id: 'es', name: 'south-east', type: 'income', at: [1500, 280], r: 70 },
      { id: 'tn', name: 'north watchtower', type: 'watchtower', at: [1100, -150], r: 45, sight: 600 },
      { id: 'ts', name: 'south watchtower', type: 'watchtower', at: [1100, 150], r: 45, sight: 600 },
      { id: 'fwn', name: 'north-west forward pad', type: 'forwardPad', at: [880, -280], r: 40, pads: [[820, -280], [940, -280]], allow: ['turret', 'barracks'] },
      { id: 'fws', name: 'south-west forward pad', type: 'forwardPad', at: [880, 280], r: 40, pads: [[820, 280], [940, 280]], allow: ['turret', 'barracks'] },
      { id: 'fen', name: 'north-east forward pad', type: 'forwardPad', at: [1320, -280], r: 40, pads: [[1380, -280], [1260, -280]], allow: ['turret', 'barracks'] },
      { id: 'fes', name: 'south-east forward pad', type: 'forwardPad', at: [1320, 280], r: 40, pads: [[1380, 280], [1260, 280]], allow: ['turret', 'barracks'] },
    ],
    conditions: ['heavyFog', 'richCenter', 'scarce', 'meteors'], // v2.72
    fog: 'grid', fogCell: 20, depthW: 1,
    ai: { lanes: true },
  };
})();
