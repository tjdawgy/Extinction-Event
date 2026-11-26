// v2.97 (batch 6g, docs/FACTION_REWORK.md "Batch 6g"): playtest fixes behind REWORK.b6g, src/sim/rework-6g.js: smart warp-in,
// Attack orders that end at the enemy HQ, units under fire responding, the Bloomhost AI contesting nodes, every AI fortifying
// the nodes it holds, the Purification Beam on any lane, the Wraithwing keeping its target. FP_V297 is in tests/determinism.test.js.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim, pin6h } = require('./load-sim');
const sim = loadSim();
const off = { b6g: false, b6h: false, b6hbody: false, b6hnode: false };
const quiet = g => { g.countdown = 0; for (const sd of g.sides) sd.aiT = 1e9; return g; }; // both AIs idle
const run = (g, secs) => { for (let i = 0; i < 60 * secs && !g.over; i++) { sim.update(g, sim.TICK); g.events.length = 0; } };
const finish = g => { for (const e of g.ents) if (e.kind === 'b') { e.built = true; e.progress = 1; e.hp = e.maxHp; } };

test('b6g is on by default, saved per game, and left out of a save when off', () => {
  assert.ok(sim.rwInit().b6g);
  const g = n => sim.newGame('hard', { seed: 5, factions: ['axiarchs', 'lastfist'], rework: n });
  const on = JSON.parse(sim.serialize(g(), {})), o = JSON.parse(sim.serialize(g(off), {}));
  assert.ok(on.rw.b6g); assert.ok(!('b6g' in o.rw), 'an off save is a v2.96 save');
  assert.ok(!sim.deserialize(JSON.stringify(o)).rw.b6g);
  const old = Object.assign({}, on); old.rw = Object.assign({}, on.rw); delete old.rw.b6g;
  assert.ok(!sim.deserialize(JSON.stringify(old)).rw.b6g, 'a v2.96 save resumes with b6g off');
});

// A Two-Lane game: the player (side 0, Axiarchs) holds its own north-west forward pad with a finished Genesis Gate on it
function gateGame(rework, setPoint) {
  sim.useMap('twolane');
  const g = quiet(sim.newGame('hard', { seed: 9, map: 'twolane', factions: ['axiarchs', 'lastfist'], rework }));
  sim.directControl(g, 0);
  const P = sim.cur().FWD_PADS, k = P.findIndex(p => sim.cur().MAP.nodes[p.node].id === 'fwn');
  g.nodes[P[k].node].owner = 0; g.nodes[P[k].node].prog = 100;
  g.sides[0].res.c = 9000; g.sides[0].res.e = 9000;
  assert.ok(sim.tryBuild(g, 0, 'barracks', sim.FWD_SLOT + k).ok, 'a Genesis Gate on the forward pad');
  finish(g); run(g, 20); // the power field grows around the base and the pad
  if (setPoint) { const R = sim.warp6f(g, 0); assert.ok(R && sim.setWarp(g, 0, R.u, R.v).ok, 'a warp point beside the base'); }
  return { g, pad: P[k].at };
}
test('b6g: a unit trained at a Genesis Gate on a node appears at the player\'s warp point (b6g off: at the pad\'s flag)', () => {
  for (const [rw, at] of [[undefined, 'warp'], [off, 'pad']]) {
    const { g, pad } = gateGame(rw, true), n0 = g.nodes.length, w = g.sides[0].warp;
    const gate = g.ents.find(e => e.kind === 'b' && e.side === 0 && e.slot >= sim.FWD_SLOT);
    gate.queue.push('shardling');
    const before = new Set(g.ents.map(e => e.id));
    run(g, sim.UDEF.shardling.time + 4);
    const nu = g.ents.find(e => e.kind === 'u' && e.side === 0 && e.type === 'shardling' && !before.has(e.id));
    assert.ok(nu, 'the Shardling arrived'); assert.strictEqual(g.nodes.length, n0);
    const dW = Math.hypot(nu.u - w.u, nu.v - w.v), dP = Math.hypot(nu.u - pad[0], nu.v - pad[1]);
    if (at === 'warp') assert.ok(dW < 60 && dP > 300, `at the warp point (${Math.round(dW)} from it, ${Math.round(dP)} from the pad)`);
    else assert.ok(dP < 120, `b6g off: at the pad's flag (${Math.round(dP)})`);
  }
  sim.useMap('classic');
});
test('b6g: the player\'s warp point is kept unless enemies stand within the safety distance; then the nearest safe field spot', () => {
  const { g } = gateGame(undefined, true), w = g.sides[0].warp;
  const p0 = sim.warp6g(g, 0); assert.ok(Math.hypot(p0.u - w.u, p0.v - w.v) < 1, 'kept');
  const e = sim.spawnUnit(g, 1, 'rifle', w.u + 40, w.v); sim.updateVision(g);
  const p1 = sim.warp6g(g, 0); assert.ok(Math.hypot(p1.u - e.u, p1.v - e.v) >= sim.B6G.safe, 'moved out of the danger');
  assert.ok(sim.safe6g(g, 0, p1.u, p1.v));
  sim.useMap('classic');
});
test('b6g: an AI\'s units warp in at a safe field spot behind its army, never within 150 of an enemy it sees or in a gun\'s reach', () => {
  const g = quiet(sim.newGame('hard', { seed: 4, factions: ['axiarchs', 'lastfist'] })); run(g, 30);
  const dir = 1, R = sim.ctlBase(0);
  for (let i = 0; i < 4; i++) sim.spawnUnit(g, 0, 'lancer', R.u + 80, R.v + (i - 1.5) * 20);
  const foe = sim.spawnUnit(g, 1, 'rifle', R.u + 220, R.v); sim.updateVision(g);
  const p = sim.warp6g(g, 0);
  assert.ok(Math.hypot(p.u - foe.u, p.v - foe.v) >= 150, `${Math.round(Math.hypot(p.u - foe.u, p.v - foe.v))} from the Marine`);
  assert.ok(sim.safe6g(g, 0, p.u, p.v) && dir * (p.u - foe.u) < 0);
});

// The player's Attack order: six Tanks just outside the enemy base, the enemy HQ shielded by one finished building
function attackGame(map, rework, holder) {
  sim.useMap(map);
  const g = quiet(sim.newGame('hard', { seed: 3, map, factions: ['lastfist', 'lastfist'], rework }));
  sim.directControl(g, 0);
  g.ents = g.ents.filter(e => !(e.kind === 'b' && e.side === 1 && e.type !== 'hq'));
  if (holder) { // on the base pad furthest behind the HQ (the bug: a shielded HQ, its holder out of reach behind it)
    const n = sim.cur().MAP.bases[1].pads.length; let best = 0, bu = -1e9;
    for (let k = 0; k < n; k++) { const b = sim.mkBuilding(g, 1, 'refinery', k); if (b.u > bu) { bu = b.u; best = k; } g.ents = g.ents.filter(e => e !== b); g.sides[1].slots.fill(null); }
    sim.mkBuilding(g, 1, 'refinery', best); finish(g); }
  const hq = sim.hqU(1), us = [];
  for (let i = 0; i < 6; i++) { const u = sim.spawnUnit(g, 0, 'tank', hq - 700 + (i % 3) * 20, (i - 2.5) * 14); u.hp = u.maxHp = 5000; us.push(u); }
  run(g, 0.1);
  assert.ok(sim.command(g, 0, us.map(u => u.id), 'attack').ok);
  return { g, us, hq };
}
test('b6g: the player\'s Attack order ends at the enemy HQ, or at the building holding its shield, on every map (b6g off: the map\'s edge)', () => {
  for (const map of ['classic', 'twolane', 'threelane']) {
    for (const holder of [false, true]) {
      const { g, us, hq } = attackGame(map, undefined, holder);
      let far = -1e9; for (let i = 0; i < 60 * 70; i++) { sim.update(g, sim.TICK); g.events.length = 0; for (const u of us) far = Math.max(far, u.u); }
      const H = g.sides[1].hq, B = g.ents.find(e => e.kind === 'b' && e.side === 1 && e.type === 'refinery');
      assert.ok(far <= hq + sim.B6FAI.past + 80, `${map}${holder ? ' (shielded)' : ''}: no Tank went past the HQ (${Math.round(far - hq)} beyond it)`);
      if (holder) assert.ok(!B || B.hp < B.maxHp, `${map}: the holder was attacked`);
      else assert.ok(H.hp < H.maxHp, `${map}: the HQ was attacked`);
    }
    if (map === 'classic') continue; // Classic's pads all stand within reach of the lane: the walk past is a lane-map case
    const { g, us, hq } = attackGame(map, off, true);
    let far = -1e9; for (let i = 0; i < 60 * 70; i++) { sim.update(g, sim.TICK); g.events.length = 0; for (const u of us) far = Math.max(far, u.u); }
    assert.ok(far > hq + 150, `${map}, b6g off: the Tanks walk past the shielded HQ (${Math.round(far - hq)})`);
  }
  sim.useMap('classic');
});

// The Test Range: side 0 Bloomhost melee on Hold, side 1 Last Fist on Hold
function rangeRun(rework, place, secs) {
  const g = sim.rangeGame({ seed: 77, factions: ['bloomhost', 'lastfist'], rework });
  const U = place(g); const seen = { c: 0, p: 0 };
  for (let i = 0; i < 60 * secs; i++) { sim.rangeStep(g); for (const e of U.a) if (e.r6) seen[e.r6.m]++; }
  return Object.assign(U, { g, seen });
}
const alive = (g, us) => us.filter(e => e.hp > 0 && g.ents.includes(e)).length;
test('b6g: Bloomhost melee on Hold under fire from Marines out of their reach charge them (b6g off: they stand)', () => {
  const place = g => ({ a: sim.rangeUnits(g, 0, 'skitterling', 600, 0, 6).concat(sim.rangeUnits(g, 0, 'bulwark', 600, 0, 2)), b: sim.rangeUnits(g, 1, 'rifle', 715, 0, 6) });
  const on = rangeRun(undefined, place, 30), o = rangeRun(off, place, 30);
  assert.ok(on.seen.c > 0 && o.seen.c === 0 && o.seen.p === 0);
  assert.ok(alive(on.g, on.b) < alive(o.g, o.b), `Marines left: ${alive(on.g, on.b)} with b6g, ${alive(o.g, o.b)} without`);
});
test('b6g: under Artillery fire from beyond the leash (behind a screen) they pull back out of its reach, then return to their spot', () => {
  const place = g => ({ a: sim.rangeUnits(g, 0, 'skitterling', 600, 0, 6), b: sim.rangeUnits(g, 1, 'artillery', 1000, 0, 2).concat(sim.rangeUnits(g, 1, 'rifle', 880, 0, 4)) });
  const g = sim.rangeGame({ seed: 77, factions: ['bloomhost', 'lastfist'] }), U = place(g);
  let backed = false, min = 1e9, back = false; const was = new Set();
  for (let i = 0; i < 60 * 25; i++) { sim.rangeStep(g); for (const e of U.a) if (e.hp > 0) { if (e.r6 && e.r6.m === 'p') { backed = true; was.add(e.id); } min = Math.min(min, e.u); if (was.has(e.id) && !e.r6 && Math.abs(e.u - 600) < 40) back = true; } }
  assert.ok(backed, 'a pull back'); assert.ok(min <= 1000 - 440 - 20, `out of the Artillery's 440 (${Math.round(1000 - min)} from it)`);
  assert.ok(back, 'back at its spot afterwards');
});
test('b6g: the response never overrides a move order', () => {
  const g = sim.rangeGame({ seed: 5, factions: ['bloomhost', 'lastfist'] });
  const a = sim.rangeUnits(g, 0, 'skitterling', 600, 0, 4); sim.rangeUnits(g, 1, 'artillery', 1000, 0, 2);
  sim.command(g, 0, a.map(e => e.id), 'go', 300, 60);
  for (let i = 0; i < 60 * 8; i++) { sim.rangeStep(g); for (const e of a) assert.ok(!e.r6, 'no response on the way'); }
});

test('b6g: the Purification Beam may be aimed at an outer lane on Three-Lane and hits there with full damage (b6g off: refused)', () => {
  sim.useMap('threelane');
  for (const rw of [undefined, off]) {
    const g = quiet(sim.newGame('hard', { seed: 6, map: 'threelane', factions: ['axiarchs', 'lastfist'], rework: rw }));
    const A = sim.ABIL.beam, sd = g.sides[0]; sd.res.c = sd.res.e = 9000; sd.ab.beam = 0;
    for (const b of g.ents) if (b.kind === 'b' && b.side === 0 && b.type === 'hq') b.tier = 3;
    for (const f of g.fog) f.exp.fill(1);
    const ln = sim.cur().MAP.lanes.find(l => l.id === 'north'), u = 1200, v = sim.laneY(ln, u);
    sim.directControl(g, 1); const foe = sim.spawnUnit(g, 1, 'tank', u, v); foe.hp = foe.maxHp = 5000; foe.po = { o: 'hold' }; foe.holdU = u; foe.holdV = v;
    const r = sim.useAbility(g, 0, 'beam', u, v);
    if (rw) { assert.ok(!r.ok && /lane/.test(r.msg), 'off: refused (' + r.msg + ')'); continue; }
    assert.ok(r.ok, r.msg);
    run(g, A.delay + A.sweep + 0.5);
    assert.ok(Math.abs(5000 - foe.hp - A.dmg * sim.DMG.beam.vehicle) < 1, `the Tank took ${5000 - foe.hp}`);
  }
  sim.useMap('classic');
});

test('b6g: a Wraithwing keeps its target through its hops while it lives and stays in reach', () => {
  const g = sim.rangeGame({ seed: 8, factions: ['axiarchs', 'lastfist'] });
  const [w] = sim.rangeUnits(g, 0, 'wraithwing', 600, 0, 1);
  const m = sim.rangeUnits(g, 1, 'rifle', 700, 0, 2), d = sim.rwD(g, 'wraithwing');
  w.wwK = m[0].id;
  assert.strictEqual(sim.ww6g(g, w, d, m[1]), m[0], 'kept');
  m[0].hp = 0; assert.strictEqual(sim.ww6g(g, w, d, m[1]), m[1], 'dead: the next');
  assert.strictEqual(w.wwK, m[1].id);
  // in a fight its bolts go to one Marine until it dies
  const g2 = sim.rangeGame({ seed: 8, factions: ['axiarchs', 'lastfist'] });
  const ws = sim.rangeUnits(g2, 0, 'wraithwing', 600, 0, 1), ms = sim.rangeUnits(g2, 1, 'rifle', 760, 0, 6); g2.sides[0].mode = 'attack';
  let sw = 0, last = 0;
  for (let i = 0; i < 60 * 20; i++) { sim.rangeStep(g2); const t = ws[0].tgt; if (t && last && t !== last) { const L0 = ms.find(e => e.id === last); if (L0 && L0.hp > 0) sw++; } if (t) last = t; }
  assert.ok(sw <= 2, `switched from a living target ${sw} times`);
});

test('b6g: every AI fortifies a safe forward pad it holds with its turret; per personality caps; not with enemies near', () => {
  sim.useMap('twolane');
  for (const [fac, kind] of [['lastfist', 'turtle'], ['bloomhost', 'economist'], ['axiarchs', 'turtle']]) {
    const g = quiet(sim.newGame('hard', { seed: 12, map: 'twolane', factions: [fac, 'lastfist'], autoPlayer: true, autoDiff: 'hard', autoPersona: kind, persona: 'turtle' }));
    g.sides[0].persona.kind = kind; g.sides[0].res.c = g.sides[0].res.e = 5000;
    sim.tryBuild(g, 0, 'barracks'); finish(g);
    const P = sim.cur().FWD_PADS, k = P.findIndex(p => sim.cur().MAP.nodes[p.node].id === 'fwn'); g.nodes[P[k].node].owner = 0;
    g.sides[0].la = { t: -99, sh: -99, fw: -99 }; g.sides[0].n6 = { t: -99, own: [], lost: {}, hot: {} };
    const D = { label: 'Hard' };
    sim.aiFort6g(g, 0, D, false);
    const tur = () => g.ents.filter(e => e.kind === 'b' && e.side === 0 && e.slot >= sim.FWD_SLOT && e.type === 'turret');
    assert.strictEqual(tur().length, 1, `${fac}: a turret on the pad`);
    g.sides[0].la.f6 = -99; sim.aiFort6g(g, 0, D, false);
    assert.strictEqual(tur().length, kind === 'turtle' ? 2 : 1, `${fac} ${kind}: per node ${sim.B6G5.per[kind]}`);
    // enemies near the node: nothing more
    const g2 = quiet(sim.newGame('hard', { seed: 12, map: 'twolane', factions: [fac, 'lastfist'], autoPlayer: true, autoDiff: 'hard' })); g2.sides[0].persona.kind = 'turtle'; g2.sides[0].res.c = g2.sides[0].res.e = 5000;
    sim.tryBuild(g2, 0, 'barracks'); finish(g2); g2.nodes[P[k].node].owner = 0; g2.sides[0].la = { t: -99 };
    g2.fog[0].intel[999] = { type: 'rifle', u: P[k].at[0] + 100, v: P[k].at[1], t: g2.t };
    sim.aiFort6g(g2, 0, D, false);
    assert.strictEqual(g2.ents.filter(e => e.kind === 'b' && e.side === 0 && e.slot >= sim.FWD_SLOT).length, 0, `${fac}: not while enemies are near`);
  }
  sim.useMap('classic');
});

test('b6g: the Bloomhost AI sends a group worth more than a turreted node\'s defence, building-breakers first, and aims at the guns', pin6h(['b6hnode'], () => { // v2.98 (batch 6h): held b6hnode off (intended); counterpart in tests/switches-on-6h.test.js
  sim.useMap('twolane');
  const g = quiet(sim.newGame('hard', { seed: 13, map: 'twolane', factions: ['bloomhost', 'lastfist'] }));
  const P = sim.cur().FWD_PADS, k = P.findIndex(p => sim.cur().MAP.nodes[p.node].id === 'fwn'), n = g.nodes[P[k].node];
  n.owner = 1; g.sides[1].res.c = g.sides[1].res.e = 5000; sim.tryBuild(g, 1, 'barracks'); finish(g);
  const b = sim.mkBuilding(g, 1, 'turret', sim.FWD_SLOT + k); finish(g);
  g.fog[0].ghosts[b.id] = { id: b.id, side: 1, type: 'turret', u: b.u, v: b.v, half: b.half, tier: 1 };
  const D = { label: 'Hard' }, mine = () => g.ents.filter(e => e.kind === 'u' && e.side === 0 && e.hp > 0);
  for (let i = 0; i < 3; i++) sim.spawnUnit(g, 0, 'skitterling', 500, -200);
  sim.aiNode6g(g, 0, D, mine(), [], false, sim.armyValue(mine()));
  assert.ok(!g.sides[0].capN, 'too small an army: no assault');
  for (let i = 0; i < 8; i++) sim.spawnUnit(g, 0, 'skitterling', 500, -200);
  for (let i = 0; i < 10; i++) sim.spawnUnit(g, 0, 'gorebore', 500, -200);
  g.sides[0].n6.t = -99;
  const df = sim.defense6g(g, 0, n, []); assert.strictEqual(df.guns.length + df.guess, 2, 'the known turret, and the pad it can\'t see counted as one');
  sim.aiNode6g(g, 0, D, mine(), [], false, sim.armyValue(mine()));
  const T = g.sides[0].capN; assert.ok(T, 'an assault'); assert.strictEqual(T.node, P[k].node);
  const us = mine().filter(e => T.ids.includes(e.id));
  assert.ok(sim.armyValue(us) >= sim.defense6g(g, 0, n, []).v * sim.B6G4.edge, 'worth the edge over the defence');
  assert.ok(us.length >= 4 && us.every(e => e.type === 'gorebore'), 'the building-breakers (Gorebores) go first');
  assert.strictEqual(T.ph, 'gather');
  sim.useMap('classic');
}));

// Counterparts of tests pinned to b6g off (tests/axiarchs-field.test.js, tests/controls.test.js), the same intent with it on
test('b6g (counterpart of axiarchs-field): a trained unit warps in at the safe point after a visible channel, paid once, counted in supply, never onto enemies', () => {
  const g = quiet(sim.newGame('normal', { factions: ['axiarchs', 'lastfist'] })); for (const sd of g.sides) sd.res.c = sd.res.e = 9000;
  sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); run(g, 60);
  assert.ok(sim.tryBuild(g, 0, 'barracks').ok); finish(g);
  const c0 = g.sides[0].res.c; assert.ok(sim.tryTrain(g, 0, 'shardling').ok); assert.strictEqual(g.sides[0].res.c, c0 - sim.UDEF.shardling.cost.c);
  const pop = sim.popUsed(g, 0); run(g, sim.UDEF.shardling.time + 0.1);
  assert.strictEqual(g.warps.length, 1, 'channelling'); assert.strictEqual(sim.popUsed(g, 0), pop, 'counted in supply');
  const w = g.warps[0], p = sim.warp6g(g, 0); assert.ok(Math.hypot(w.u - p.u, w.v - p.v) < 4 * sim.WARP.step, 'at the safe point'); assert.ok(sim.safe6g(g, 0, w.u, w.v));
  for (let i = 0; i < 60 * 10 && g.warps.length; i++) sim.update(g, sim.TICK);
  assert.strictEqual(g.ents.filter(e => e.kind === 'u' && e.side === 0 && e.type === 'shardling').length, 1, 'exactly one unit');
  const foe = sim.spawnUnit(g, 1, 'tank', p.u, p.v); foe.holdU = p.u; foe.holdV = p.v; sim.updateVision(g);
  sim.startWarp(g, 0, 'shardling'); const w2 = g.warps.at(-1);
  assert.ok(Math.hypot(w2.u - foe.u, w2.v - foe.v) >= sim.B6G.safe, 'away from the enemy standing on the old point');
});
test('b6g (counterpart of controls "a target"): they attack the target first, kill it, then hold where they are, not past it', () => {
  const g = quiet(sim.newGame('normal', { map: 'classic', seed: 7, factions: ['lastfist', 'lastfist'] })); sim.directControl(g, 0);
  const us = [0, 1, 2].map(i => sim.spawnUnit(g, 0, 'tank', 600 + i * 8, 0));
  const t = sim.spawnUnit(g, 1, 'rifle', 820, 40); g.sides[1].stance = 'hold'; t.holdU = 900; t.holdV = 40; t.dmg = 0;
  const other = sim.spawnUnit(g, 1, 'rifle', 900, -40); other.holdU = 900; other.holdV = -40; sim.updateVision(g);
  assert.ok(sim.command(g, 0, us.map(u => u.id), 'target', t.id).ok);
  let first = null; for (let i = 0; i < 60 * 30 && t.hp > 0; i++) { sim.update(g, sim.TICK); if (!first && us.some(u => u.tgt)) first = us.find(u => u.tgt).tgt; }
  assert.strictEqual(first, t.id, 'the target first'); assert.ok(t.hp <= 0, 'killed');
  run(g, 8); for (const u of us) { assert.strictEqual(u.po.o, 'hold', 'then Hold'); assert.ok(u.u < 820, 'where they are, not on past it'); }
});
test('b6g (counterpart of orders-weapons "Emergency Brood ... on Hold"): Brood Skitterlings and Cloudwing offspring on Hold stay where they appear', pin6h(['b6hbody'], () => { // v2.98 (batch 6h): held b6hbody off (intended); counterpart in tests/switches-on-6h.test.js
  const g = quiet(sim.newGame('normal', { factions: ['bloomhost', 'lastfist'] })); for (const sd of g.sides) sd.res.c = sd.res.e = 9000;
  sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold');
  const see = () => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } }; see();
  for (const k in g.sides[0].ab) g.sides[0].ab[k] = 0;
  assert.ok(sim.useAbility(g, 0, 'brood', 700, 0).ok); for (let i = 0; i < 30 * (sim.ABIL.brood.delay + 0.1); i++) sim.update(g, 1 / 30);
  const brood = g.ents.filter(e => e.side === 0 && e.tSrc === 'brood'), at = brood.map(e => ({ u: e.u, v: e.v }));
  for (let i = 0; i < 30 * 10; i++) sim.update(g, 1 / 30);
  brood.forEach((e, i) => assert.ok(Math.hypot(e.u - at[i].u, e.v - at[i].v) < 2, `brood ${i} stayed`));
  const c = sim.spawnUnit(g, 0, 'cloudwing', 900, 0); c.holdU = 900; c.holdV = 0; c.hp = c.maxHp = 1e6;
  const t = sim.spawnUnit(g, 1, 'hydra', 930, 0); t.holdU = 930; t.holdV = 0; t.hp = t.maxHp = 1e6; t.cd = 1e6; // a Hydra can hit the Cloudwing: no reason to pull back
  for (let i = 0; i < 30 * 5 && !g.ents.some(e => e.tSrc === 'cloud'); i++) { sim.update(g, 1 / 30); see(); }
  const kids = g.ents.filter(e => e.tSrc === 'cloud'); assert.ok(kids.length > 0, 'offspring released');
  const kAt = kids.map(k => ({ u: k.u, v: k.v })); for (let i = 0; i < 30 * 6; i++) { sim.update(g, 1 / 30); see(); }
  kids.forEach((k, i) => assert.ok(k.hp <= 0 || Math.hypot(k.u - kAt[i].u, k.v - kAt[i].v) < 2, `offspring ${i} stayed`));
}));
test('b6g (counterpart of the forward-pad tests in twolane-ai and threelane): Easy builds none, Normal stays within aiForward\'s cap, Hard by personality; one forward production building on its own half', () => {
  for (const [map, cap] of [['twolane', { normal: 1 }], ['threelane', { normal: 2 }]]) {
    sim.useMap(map);
    for (const diff of ['hard', 'normal', 'easy']) for (const kind of ['boomer', 'economist', 'turtle']) {
      const g = quiet(sim.newGame(diff, { map, seed: 9, factions: ['lastfist', 'lastfist'], autoPlayer: true, autoDiff: diff })); g.t = 300;
      const side = g.sides[1]; side.res.c = side.res.e = 9000; if (side.persona) side.persona.kind = kind;
      assert.ok(sim.tryBuild(g, 1, 'barracks').ok); finish(g);
      for (const n of g.nodes) if (n.type === 'forwardPad') { n.owner = 1; n.prog = -100; }
      side.n6 = { t: -99, own: [], lost: {}, hot: {} }; for (const i in g.nodes) side.n6.hot[i] = g.t; // contested, so the Boomer fortifies too
      for (let k = 0; k < 8; k++) { side.la = Object.assign(side.la || {}, { fw: -99, t: -99, f6: -99 }); sim.aiFort6g(g, 1, sim.aiDiff(g, 1), false); }
      const fw = g.ents.filter(x => x.side === 1 && x.slot >= sim.FWD_SLOT), tur = fw.filter(x => x.type === 'turret'), bar = fw.filter(x => x.type === 'barracks');
      if (diff === 'easy') { assert.strictEqual(fw.length, 0, `${map} easy: none`); continue; }
      const want = diff === 'hard' ? Math.min(sim.B6G5.total[kind], sim.cur().FWD_PADS.length) : Math.min(sim.B6G5.total[kind], cap.normal);
      assert.ok(tur.length <= want && tur.length >= 1, `${map} ${diff} ${kind}: ${tur.length} turrets (at most ${want})`);
      assert.ok(bar.length <= 1 && bar.every(b => b.u > sim.cur().L / 2), `${map} ${diff} ${kind}: one forward production building, on its own half`);
    }
  }
  sim.useMap('classic');
});
test('b6g (counterpart of twolane-ai "a: units trained at a forward Barracks"): an Axiarch AI\'s forward Gate warps its unit in at a safe spot, not at the forward flag', () => {
  sim.useMap('twolane');
  const g = quiet(sim.newGame('hard', { map: 'twolane', seed: 9, factions: ['axiarchs', 'lastfist'], autoPlayer: true, autoDiff: 'hard' }));
  g.ents = g.ents.filter(e => e.kind !== 'u'); const side = g.sides[0]; side.res.c = side.res.e = 9000;
  const F = sim.cur().FWD_PADS, k = F.findIndex(f => f.at[0] === 820 && f.at[1] === 280), post = g.nodes[F[k].node]; post.owner = 0; post.prog = 100;
  run(g, 20);
  assert.ok(sim.tryBuild(g, 0, 'barracks', sim.FWD_SLOT + k).ok);
  const bar = sim.fwdAt(g, sim.FWD_SLOT + k); bar.built = true; bar.hp = bar.maxHp; bar.progress = 1;
  const foe = sim.spawnUnit(g, 1, 'rifle', F[k].at[0] + 80, F[k].at[1]); foe.holdU = foe.u; foe.holdV = foe.v; foe.cd = 1e9; sim.updateVision(g);
  bar.queue.push('shardling'); bar.prodT = 1e9; sim.update(g, sim.TICK);
  const w = g.warps.at(-1); assert.ok(w && !w.fwd, 'a warp through warp6g');
  assert.ok(Math.hypot(w.u - foe.u, w.v - foe.v) >= sim.B6G.safe && sim.safe6g(g, 0, w.u, w.v), `safe: ${Math.round(Math.hypot(w.u - foe.u, w.v - foe.v))} from the Marine`);
  sim.useMap('classic');
});
