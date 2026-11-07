// v2.59: maps in the data format (docs/MAP_FORMAT.md). Classic is today's map, number for number; every map passes
// validateMap (reachability, no overlaps, known node types and units, a sensible army cap, the declared symmetry), and
// each check catches the fault it is for.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const copy = m => JSON.parse(JSON.stringify(m));
const has = (P, re) => P.some(p => re.test(p));

test('Classic holds the exact numbers the v2.58 formulas gave', () => {
  const M = sim.MAPS.classic;
  assert.strictEqual(sim.MAP, M);
  for (const s of [0, 1]) {
    const b = M.bases[s];
    const hq = sim.tilePos(s, sim.HQ_TILE[0], sim.HQ_TILE[1]); assert.ok(b.hq[0] === hq.u && b.hq[1] === hq.v, `base ${s} HQ`);
    const sg = sim.tilePos(s, sim.SIG_TILE[0], sim.SIG_TILE[1]); assert.ok(b.sigPad[0] === sg.u && b.sigPad[1] === sg.v, `base ${s} signature pad`);
    sim.PADS.forEach(([i, j], k) => { const p = sim.tilePos(s, i, j); assert.ok(b.pads[k][0] === p.u && b.pads[k][1] === p.v, `base ${s} pad ${k}: ${b.pads[k]} vs ${p.u},${p.v}`); });
    assert.strictEqual(b.rally[0], (s ? 1480 : 220) + (s ? -1 : 1) * 240); // MECH7C.rally out from the HQ
    assert.strictEqual(sim.dirOf(s), s ? -1 : 1);
  }
  assert.deepStrictEqual([sim.L, sim.HQ_U, sim.POP_MAX, sim.LANE_V, sim.NODE_R], [1700, 220, 80, 115, 70]);
  assert.strictEqual(JSON.stringify(M.nodes.map(n => n.at)), JSON.stringify([[680, 0], [850, 0], [1020, 0]])); // v2.43: 460 out from each HQ
  const g = sim.newGame('normal');
  assert.strictEqual(JSON.stringify(g.nodes.map(n => [n.u, n.v])), '[[680,0],[850,0],[1020,0]]');
  assert.strictEqual(g.map.id, 'classic');
  sim.setMech7c(false); try { assert.strictEqual(JSON.stringify(sim.newGame('normal').nodes.map(n => n.u)), '[600,850,1100]', 'v2.42 node spots'); } finally { sim.setMech7c(true); }
});

test('every map passes validation', () => {
  for (const [id, m] of Object.entries(sim.MAPS)) assert.deepStrictEqual([...sim.validateMap(m)], [], id);
});

test('validation catches each fault: overlap, off the map, unknown node type or unit, army cap, modes, reachability, symmetry, display', () => {
  const C = sim.MAPS.classic, V = m => [...sim.validateMap(m)];
  let m = copy(C); m.bases[0].pads[3] = [...m.bases[0].pads[2]]; assert.ok(has(V(m), /overlap/), 'two pads on one spot');
  m = copy(C); m.nodes[1].at = [750, 0]; assert.ok(has(V(m), /nodes west and centre overlap/), 'two nodes overlapping');
  m = copy(C); m.bases[1].pads[0] = [1750, 0]; assert.ok(has(V(m), /off the map/), 'a pad off the map');
  m = copy(C); m.nodes[1].type = 'goldmine'; assert.ok(has(V(m), /unknown type goldmine/));
  m = copy(C); m.nodes[1].type = 'relic'; m.nodes[1].guards = [{ unit: 'dragon', n: 1 }]; assert.ok(has(V(m), /unknown guard unit dragon/));
  m = copy(C); m.armyCap = 5; assert.ok(has(V(m), /armyCap 5/));
  m = copy(C); m.armyCap = 80.5; assert.ok(has(V(m), /armyCap/));
  m = copy(C); m.modes = { '1v1': [['west'], ['north']] }; assert.ok(has(V(m), /no base north/) && has(V(m), /base east: in no mode/));
  m = copy(C); m.blockers = [{ poly: [[840, -200], [860, -200], [860, 200], [840, 200]] }]; // a wall across the lane
  assert.ok(has(V(m), /can't be reached/), 'a wall across the lane cuts the bases apart');
  m = copy(C); m.bases[1].pads[5] = [1530, 75]; assert.ok(has(V(m), /symmetry: base/), 'one pad off its mirror');
  m = copy(C); m.nodes[2].at = [1000, 0]; assert.ok(has(V(m), /symmetry: node/), 'a node off its mirror');
  m = copy(C); m.symmetry = 'spiral'; assert.ok(has(V(m), /symmetry: spiral/));
  m = copy(C); m.display.name = ''; assert.ok(has(V(m), /display/));
  m = copy(C); m.bases.push(copy(m.bases[0])); assert.ok(has(V(m), /ids must be unique/));
  // a valid open map (no lanes) with a symmetric pair of blockers, and a rot180 two-lane layout, pass
  m = copy(C); m.id = 'open'; m.lanes = []; m.blockers = [{ poly: [[700, 60], [760, 60], [760, 190], [700, 190]] }, { poly: [[940, 60], [1000, 60], [1000, 190], [940, 190]] }];
  assert.deepStrictEqual(V(m), [], 'open map with mirrored blockers');
  m.blockers.pop(); assert.ok(has(V(m), /blocker 0 has no image/), 'an unpaired blocker breaks the mirror');
});
