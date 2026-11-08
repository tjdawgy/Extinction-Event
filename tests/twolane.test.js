// v2.65 (Phase 1): the Two-Lane map (docs/TWO_LANE.md): its data and validation, switching maps per match, navigation
// around the ridge, the watchtower and forward-pad node types, the rich centre node, and saves that carry their map.
// The browser side (map select, camera, minimap) is in tests/twolane-ui.test.js; full AI matches in tests/slow/.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const quiet = (map = 'twolane', f = ['lastfist', 'lastfist']) => { const g = sim.newGame('normal', { map, seed: 5, factions: f }); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9; return g; };
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 60); i++) sim.update(g, sim.TICK); };
const clear = g => { g.ents = g.ents.filter(e => e.kind !== 'u'); };
const T = sim.MAPS.twolane;
test.afterEach(() => sim.useMap('classic'));

test('Two-Lane is valid (symmetry included) and laid out as docs/TWO_LANE.md says', () => {
  assert.strictEqual(sim.validateMap(T).length, 0, sim.validateMap(T).join('; '));
  assert.strictEqual(T.symmetry, 'mirror-x');
  assert.deepStrictEqual([T.size.w, T.size.h, T.armyCap], [2200, 900, 100]);
  assert.strictEqual(T.lanes.length, 2); assert.strictEqual(T.blockers.length, 2);
  const by = t => T.nodes.filter(n => n.type === t);
  assert.strictEqual(by('income').length, 5); assert.strictEqual(by('watchtower').length, 2); assert.strictEqual(by('forwardPad').length, 4);
  assert.strictEqual(T.nodes[1].at.join(), '1100,0'); assert.strictEqual(T.nodes[1].yieldMul, 1.5);
  for (const f of by('forwardPad')) assert.strictEqual(f.allow.join(), 'turret,barracks');
  const C = sim.MAPS.classic.bases[0]; assert.strictEqual(JSON.stringify(T.bases[0].pads), JSON.stringify(C.pads), 'the west base is Classic\'s');
  // the validator catches a broken mirror on this map too
  const m = JSON.parse(JSON.stringify(T)); m.nodes[9].pads[0] = [1390, -280]; assert.ok(sim.validateMap(m).some(p => /doesn't match its image/.test(p)));
  const m2 = JSON.parse(JSON.stringify(T)); m2.blockers[1].poly[0][0] += 30; assert.ok(sim.validateMap(m2).some(p => /blocker 1 has no image/.test(p)));
});

test('the map is per match: newGame({ map }) switches every derived value, and back again', () => {
  const g = quiet(); let c = sim.cur();
  assert.deepStrictEqual([c.MAP.id, c.L, c.POP_MAX, c.MAP_2D, c.MAP_LANED, g.nodes.length, c.FWD_PADS.length], ['twolane', 2200, 100, true, true, 11, 8]);
  assert.strictEqual(sim.popCap(g, 0) <= 100, true);
  const k = sim.newGame('normal', { map: 'classic' }); c = sim.cur();
  assert.deepStrictEqual([c.MAP.id, c.L, c.POP_MAX, c.MAP_2D, c.MAP_LANED, k.nodes.length, c.FWD_PADS.length], ['classic', 1700, 80, false, false, 3, 0]);
  assert.strictEqual(JSON.stringify(c.NODE_U), '[680,850,1020]', 'Classic\'s MECH7C node spots come back');
  assert.throws(() => sim.newGame('normal', { map: 'nowhere' }));
});

test('ground units never stand inside the ridge, and cross only at the crossing or past the bases', () => {
  const g = quiet(); clear(g);
  const u = sim.spawnUnit(g, 0, 'heavy', 820, -280); u.lane = 0;
  assert.ok(sim.navShut(800, 0) && !sim.navShut(1100, 0) && !sim.navShut(800, -280), 'ridge closed, crossing and lanes open');
  sim.giveOrder(g, 0, 'type', 'heavy', 'move', 820, 280); // straight south, through the ridge
  let inside = 0, viaCrossing = false, minU = 1e9;
  for (let t = 0; t < 40 * 60 && Math.hypot(u.u - 820, u.v - 280) > 30; t++) { sim.update(g, sim.TICK); if (sim.navShut(u.u, u.v)) inside++; minU = Math.min(minU, u.u); if (u.u > 1030 && u.u < 1170 && Math.abs(u.v) < 60) viaCrossing = true; }
  assert.strictEqual(inside, 0, 'never on closed ground');
  assert.ok(Math.hypot(u.u - 820, u.v - 280) <= 30, `arrived (${u.u.toFixed(0)}, ${u.v.toFixed(0)})`);
  assert.ok(viaCrossing || minU < 620, 'went round through the crossing (or behind the ridge\'s west tip)');
  const air = sim.spawnUnit(g, 0, 'aircraft', 820, -280); air.v = 0; air.u = 800; step(g, 0.1); assert.ok(sim.navShut(air.u, air.v), 'aircraft fly over it');
});

test('a watchtower: no income, and its holder sees 600 around it', () => {
  const g = quiet(); clear(g);
  const tw = g.nodes.find(n => n.type === 'watchtower'); assert.strictEqual(tw.sight, 600);
  const inc0 = sim.income(g, 0).c; tw.owner = 0; assert.strictEqual(sim.income(g, 0).c, inc0, 'no income');
  sim.updateVision(g); assert.ok(g.fog[0].vis[sim.cur().cellOf(tw.u + 550, tw.v)], 'sees 550 away');
  tw.owner = null; sim.updateVision(g); assert.ok(!g.fog[0].vis[sim.cur().cellOf(tw.u + 550, tw.v)]);
});

test('the rich centre node pays 1.5 times a normal node', () => {
  const g = quiet(), base = sim.income(g, 0).c;
  g.nodes[0].owner = 0; const one = sim.income(g, 0).c - base; g.nodes[0].owner = null;
  g.nodes[1].owner = 0; assert.ok(Math.abs(sim.income(g, 0).c - base - one * 1.5) < 1e-9);
  assert.strictEqual(sim.nodeInc(g.nodes[1]), 1.5); assert.strictEqual(sim.nodeInc(g.nodes[5]), 0);
});

test('forward pads: build there only while holding the post, only the Turret and Barracks roles (each faction\'s own)', () => {
  for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) {
    const g = quiet('twolane', [fac, fac]), FS = sim.FWD_SLOT; g.sides[0].res.c = g.sides[0].res.e = 5000;
    const k = sim.cur().FWD_PADS.findIndex(F => F.at[0] === 820 && F.at[1] === -280), slot = FS + k, post = g.nodes[sim.cur().FWD_PADS[k].node];
    assert.match(sim.tryBuild(g, 0, 'turret', slot).msg, /Capture/);
    post.owner = 0;
    assert.match(sim.tryBuild(g, 0, 'refinery', slot).msg, /fits a forward pad/);
    const r = sim.tryBuild(g, 0, 'turret', slot); assert.ok(r.ok, `${fac}: ${r.msg}`);
    const b = sim.fwdAt(g, slot); assert.ok(b && b.u === 820 && b.v === -280 && b.slot === slot);
    assert.ok(!g.sides[0].slots.includes(b), 'not one of the 8 home pads');
    assert.match(sim.tryBuild(g, 0, 'barracks', slot).msg, /in use/);
    assert.ok(sim.tryBuild(g, 0, 'barracks', slot + 1).ok, `${fac}: the other pad takes the Barracks role`);
    sim.trySell(g, 0, b); assert.ok(!sim.fwdAt(g, slot), 'sold: free again');
  }
});

test('a save carries its map: resuming a Two-Lane match switches to Two-Lane; Classic saves still load', () => {
  const g = quiet(); step(g, 2);
  const s = sim.serialize(g, {}); sim.newGame('normal', { map: 'classic' });
  const r = sim.deserialize(s); assert.ok(r); assert.strictEqual(sim.cur().MAP.id, 'twolane'); assert.strictEqual(r.nodes.length, 11);
  const o = JSON.parse(s); o.map.v = 99; assert.strictEqual(sim.deserialize(JSON.stringify(o)), null, 'another version of the map: refused');
  const k = sim.newGame('normal', { map: 'classic' }), ks = sim.serialize(k, {}); sim.useMap('twolane');
  assert.ok(sim.deserialize(ks)); assert.strictEqual(sim.cur().MAP.id, 'classic');
});

test('Classic is untouched: its nodes keep their old keys and no forward pads exist', () => {
  const g = sim.newGame('normal', { map: 'classic' });
  for (const n of g.nodes) assert.deepStrictEqual(Object.keys(n).sort(), ['c', 'id', 'owner', 'prog', 'u', 'v']);
  assert.strictEqual(sim.cur().FWD_PADS.length, 0); assert.strictEqual(sim.cur().NAV.on, false);
});
