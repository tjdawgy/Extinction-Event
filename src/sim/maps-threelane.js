/* ---------- Three-Lane with crossings (v2.70): docs/PHASE1_DESIGNS.md, Proposal D ----------
   Three lanes (north, centre, south) between Classic's bases at x 220 and 2080 (the west base is Classic's, number for
   number; the east base its mirror across x = 1150). Two walls split the outer lanes from the centre, each with one gap at
   the middle (x 1150, 140 wide), so all three lanes meet at the rich centre node. Node order: 0 the west centre-lane node,
   1 the rich centre, 2 the east centre-lane node (the three spots the AI knows from Classic), then the outer income nodes,
   the watchtowers and the forward pads. */
MAPS.threelane = (() => {
  const W = 2300, mx = p => [W - p[0], p[1]], fy = p => [p[0], -p[1]], wb = MAPS.classic.bases[0];
  const north = [[0, 0], [400, 0], [600, -400], [1700, -400], [1900, 0], [2300, 0]];
  const wallNW = [[820, -200], [880, -280], [1080, -280], [1080, -120], [880, -120]]; // v2 (v2.71): starts at x 820 (was 700), leaving the pocket for the relic
  const fwd = (id, name, x, y) => ({ id, name, type: 'forwardPad', at: [x, y], r: 40, pads: x < W / 2 ? [[x - 60, y], [x + 60, y]] : [[x + 60, y], [x - 60, y]], allow: ['turret', 'barracks'] });
  return {
    id: 'threelane', v: 2, // v2 (v2.71): repair depots and relics; the walls start 120 further from the bases
    display: { name: 'Three-Lane', desc: 'North, centre and south lanes; the walls between them open at a rich centre node. Flank through the gaps.', thumb: { style: 'lanes', tint: '#2e3a4a' } },
    size: { w: W, h: 1120 },
    armyCap: 120,
    symmetry: 'mirror-x',
    bases: [
      { id: 'west', hq: wb.hq, face: [1, 0], sigPad: wb.sigPad, rally: wb.rally, pads: wb.pads },
      { id: 'east', hq: mx(wb.hq), face: [-1, 0], sigPad: mx(wb.sigPad), rally: mx(wb.rally), pads: wb.pads.map(mx) },
    ],
    modes: { '1v1': [['west'], ['east']] },
    lanes: [
      { id: 'north', path: north, width: 230 },
      { id: 'centre', path: [[0, 0], [W, 0]], width: 230 },
      { id: 'south', path: north.map(fy), width: 230 },
    ],
    blockers: [
      { id: 'wallNW', poly: wallNW }, { id: 'wallNE', poly: wallNW.map(mx).reverse() },
      { id: 'wallSW', poly: wallNW.map(fy).reverse() }, { id: 'wallSE', poly: wallNW.map(p => fy(mx(p))) },
    ],
    nodes: [
      { id: 'wc', name: 'centre-west', type: 'income', at: [800, 0], r: 70 },
      { id: 'c', name: 'centre', type: 'income', at: [1150, 0], r: 70, yieldMul: 1.5 },
      { id: 'ec', name: 'centre-east', type: 'income', at: [1500, 0], r: 70 },
      { id: 'wn', name: 'north-west', type: 'income', at: [650, -400], r: 70 },
      { id: 'ws', name: 'south-west', type: 'income', at: [650, 400], r: 70 },
      { id: 'en', name: 'north-east', type: 'income', at: [1650, -400], r: 70 },
      { id: 'es', name: 'south-east', type: 'income', at: [1650, 400], r: 70 },
      { id: 'tn', name: 'north watchtower', type: 'watchtower', at: [1150, -340], r: 45, sight: 600 },
      { id: 'ts', name: 'south watchtower', type: 'watchtower', at: [1150, 340], r: 45, sight: 600 },
      fwd('fwn', 'north-west forward pad', 820, -400), fwd('fwc', 'centre-west forward pad', 960, 0), fwd('fws', 'south-west forward pad', 820, 400),
      { id: 'rn', name: 'north repair depot', type: 'repair', at: [1150, -470], r: 55, heal: 3 }, // v2.71 (Proposal E): one in each outer lane, beside the watchtower
      { id: 'rs', name: 'south repair depot', type: 'repair', at: [1150, 470], r: 55, heal: 3 },
      { id: 'gw', name: 'west relic', type: 'relic', at: [740, -200], r: 45, guards: [{ unit: 'titan', n: 1 }, { unit: 'tank', n: 2 }], reward: { c: 800 } }, // v2.71: off the lanes, in the pocket at the base end of the north wall, about 200 from every lane's centre
      { id: 'ge', name: 'east relic', type: 'relic', at: [1560, -200], r: 45, guards: [{ unit: 'titan', n: 1 }, { unit: 'tank', n: 2 }], reward: { c: 800 } },
      fwd('fen', 'north-east forward pad', 1480, -400), fwd('fec', 'centre-east forward pad', 1340, 0), fwd('fes', 'south-east forward pad', 1480, 400),
    ],
    conditions: ['heavyFog', 'richCenter', 'scarce', 'meteors'], // v2.72
    fog: 'grid', fogCell: 20, depthW: 1,
    ai: { lanes: true },
  };
})();
