// v2.98 (batch 6h): switches-on counterparts of the tests held b6h, b6hbody or b6hnode off (pin6h in tests/load-sim.js). Each
// pinned test's intent, checked with every switch on, in batch 6h's rules. The pinned tests and why:
//  - b6hbody (unit bodies push units apart, so a unit no longer stands exactly where it was put or stacks on another, and a
//    standing unit makes way for one on the move): abilities "Orbital Strike" (and switches-on-6c's), ax-abilities "Mass Warp"
//    (and 6c's), bloomhost-sig "Rootheart T3", controls "new units gather" and "Retreat", controls-ui and controls-refine-ui's
//    gathering tests, micro "a type order", "Regroup" and "save and resume mid-Regroup", multilane "lane orders",
//    orders-weapons "a unit that warps in while the army is on Hold", rework-3b "Dreadthorn", rework-4b "Leviathan",
//    rework-6g's Emergency Brood counterpart, techlab "Interceptor rework" (aircraft separate lightly).
//  - b6h (the Bloomhost ground rework): bh-trees "Larva Pit and Evolution Chamber" (the Spitter needs no path), bloomhost-sig
//    "Mites" and "saves v29" (Mites live 10 s, at most 30), rework-2b's two Ruinmaw tests (the tunnel from the creep),
//    rework-3a's switch test and its Leaper AI aims (6h's values and target order), rework-5b's AI (no Acidic path just for
//    Spitters), rework-6b's b6art test (6h's Leaper order), bloomhost-ui's Train cards; rework-5b "swarm surge" holds b6h and
//    b6hbody off (the loose swarm's spacing pushes the lead unit).
//  - b6hnode: rework-6g's node assault (6h's assault replaces it; tests/rework-6h.test.js).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');
const sim = loadSim();
const allOn = () => ['b6h', 'b6hbody', 'b6hnode'].every(k => sim.REWORK[k]);
const range = (f = ['bloomhost', 'lastfist'], seed = 41) => sim.rangeGame({ seed, factions: f });
const step = (g, s) => { for (let i = 0; i < Math.round(s * 60); i++) sim.rangeStep(g); };
const gap = (a, b) => Math.hypot(a.u - b.u, (a.v - b.v) * sim.DY);
const minGap = us => { let m = 1e9; for (const a of us) for (const b of us) if (a !== b && a.hp > 0 && b.hp > 0) m = Math.min(m, gap(a, b)); return m; };
const allowed = (a, b) => sim.body6hR(a.type) + sim.body6hR(b.type) - 10; // bodies: never closer than their radii less the allowance (and the loose spacing)

test('every switch is on here', () => assert.ok(allOn()));

// controls "new units gather" (:43), controls-ui (:164) and controls-refine-ui (:36): each in its own space, holding near the rally point
test('bodies: new units gather at the base rally point, each in its own space, and hold there', () => {
  const g = sim.newGame('normal', { seed: 9, factions: ['lastfist', 'axiarchs'] }); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9;
  sim.directControl(g, 0); g.sides[0].res.c = g.sides[0].res.e = 1e5;
  sim.tryBuild(g, 0, 'barracks', 0); for (const b of g.ents) if (b.kind === 'b' && b.side === 0) { b.built = true; b.progress = 1; b.hp = b.maxHp; }
  for (let i = 0; i < 5; i++) sim.tryTrain(g, 0, 'rifle');
  for (let i = 0; i < 60 * 40; i++) sim.update(g, sim.TICK);
  const us = g.ents.filter(e => e.kind === 'u' && e.side === 0 && e.hp > 0), B = sim.ctlBase ? sim.ctlBase(0) : { u: sim.rallyU(0, g), v: 0 };
  assert.ok(us.length >= 5); assert.ok(us.every(e => e.po && e.po.o === 'hold'), 'every one holds');
  assert.ok(minGap(us) >= 2 * sim.body6hR('rifle') - 3, `each its own space (${minGap(us).toFixed(1)})`);
  assert.ok(us.every(e => Math.hypot(e.u - B.u, e.v - B.v) < 140), 'beside the rally point');
});

// controls "Retreat" (:96): back to the base holding fire, then Hold
test('bodies: Retreat ends in Hold near the base rally point', () => {
  const g = range(['lastfist', 'axiarchs']); g.sides[0].manual = true;
  const us = sim.rangeUnits(g, 0, 'rifle', 900, 0, 6); step(g, 0.2);
  sim.command(g, 0, us.map(e => e.id), 'retreat'); step(g, 30);
  assert.ok(us.every(e => e.po.o === 'hold'), us.map(e => e.po.o).join());
});

// micro "a type order" (:24), "Regroup" (:69), "save and resume" (:102), multilane "lane orders" (:60), orders-weapons warp-in (:28),
// rework-6g's brood (:239): units told to hold stay near their spots (bodies push them apart, a few px at most when they stand alone)
test('bodies: units on Hold stay where they are, pushed only as far as their bodies need', () => {
  const g = range(['lastfist', 'axiarchs']); g.sides[0].manual = true;
  const lone = sim.rangeUnits(g, 0, 'tank', 600, 0, 1)[0], pack = sim.rangeUnits(g, 0, 'rifle', 900, 0, 8), u0 = lone.u, v0 = lone.v;
  const P0 = pack.map(e => [e.u, e.v]); step(g, 10);
  assert.ok(Math.hypot(lone.u - u0, lone.v - v0) < 1, 'alone: not moved');
  pack.forEach((e, i) => assert.ok(Math.hypot(e.u - P0[i][0], e.v - P0[i][1]) < 2 * sim.body6hR('rifle'), `within a body of its spot (${i})`));
  assert.ok(minGap(pack) >= 2 * sim.body6hR('rifle') - 3);
});

// abilities "Orbital Strike" (:108) and switches-on-6c's: 280 at the centre, less at the edge, aircraft too
test('bodies: the Orbital Strike hits a lone unit at its centre for 280', () => {
  const g = sim.newGame('normal', { seed: 3 }); g.countdown = 0; g.t = 130; for (const s of g.sides) { s.aiT = 1e9; s.stance = 'hold'; }
  for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); }
  g.sides[0].hq.tier = 2; g.sides[0].res.c = g.sides[0].res.e = 5000; for (const k of ['shield', 'strike', 'repair']) g.sides[0].ab[k] = 0;
  const c = sim.spawnUnit(g, 1, 'titan', 1000, 0); c.holdU = 1000; c.holdV = 0; const e = sim.spawnUnit(g, 1, 'titan', 1060, 0); e.holdU = 1060; e.holdV = 0;
  const h0 = [c.hp, e.hp]; assert.ok(sim.useAbility(g, 0, 'strike', 1000, 0).ok);
  for (let i = 0; i < 60 * 3.1; i++) sim.update(g, sim.TICK);
  assert.ok(Math.abs(h0[0] - c.hp - 280) < 1, `centre ${h0[0] - c.hp}`); assert.ok(h0[1] - e.hp > 0 && h0[1] - e.hp < 280, 'less toward the edge');
});

// ax-abilities "Mass Warp" (:47) and switches-on-6c's: they arrive at the warp point, the count unchanged, never on top of each other
test('bodies: Mass Warp arrivals stand apart by their bodies', () => {
  const g = sim.newGame('normal', { seed: 5, factions: ['axiarchs', 'lastfist'] }); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9;
  g.sides[0].hq.tier = 2; g.sides[0].res.c = g.sides[0].res.e = 9000;
  const us = []; for (let i = 0; i < 6; i++) us.push(sim.spawnUnit(g, 0, 'shardling', 400 + i * 30, 0));
  for (let i = 0; i < 60 * 30; i++) sim.update(g, sim.TICK);
  const n0 = g.ents.filter(e => e.kind === 'u' && e.side === 0).length, r = sim.useAbility(g, 0, 'mwarp');
  for (let i = 0; i < 60 * 4; i++) sim.update(g, sim.TICK);
  const mine = g.ents.filter(e => e.kind === 'u' && e.side === 0 && e.hp > 0);
  assert.strictEqual(mine.length, n0, 'the count never changes');
  if (r.ok) assert.ok(minGap(mine) >= 2 * sim.body6hR('shardling') - 3, `apart (${minGap(mine).toFixed(1)})`);
});

// bloomhost-sig "Rootheart T3" (:118): snared units can't walk (a body push may still nudge them)
test('bodies: a snared unit does not walk; it still fights', () => {
  const g = range(['bloomhost', 'lastfist']); g.sides[0].hush = true;
  const [m] = sim.rangeUnits(g, 1, 'rifle', 800, 0, 1); m.snT = 1e9; m.po = { o: 'go', u: 400, v: 0 }; const u0 = m.u;
  step(g, 3); assert.ok(Math.abs(m.u - u0) < 1, 'not walking');
});

// rework-3b "Dreadthorn" (:85): its charge hits the units in its path
test('bodies: a Dreadthorn\'s charge hits ground units standing in its path', () => {
  const g = range(['bloomhost', 'lastfist']); g.sides[1].hush = true;
  const [d] = sim.rangeUnits(g, 0, 'dreadthorn', 600, 0, 1); const ts = [sim.rangeUnit(g, 1, 'heavy', 720, 0), sim.rangeUnit(g, 1, 'heavy', 760, 30)];
  g.sides[0].mode = 'attack'; const h0 = ts.map(e => e.hp); let charged = 0;
  for (let i = 0; i < 60 * 4; i++) { sim.rangeStep(g); if (d.crg) charged = 1; }
  assert.ok(charged, 'it charged'); assert.ok(ts.some((e, i) => h0[i] - e.hp >= 50), 'the trample hit');
});

// rework-4b "Leviathan" (:69) and techlab "Interceptor rework" (:52): the escort stays with its Leviathan
test('bodies: an AI Interceptor escorts its Leviathan (aircraft separate lightly)', () => {
  const g = sim.newGame('normal', { seed: 2 }); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9;
  const lv = sim.spawnUnit(g, 0, 'leviathan', 700, 0), ic = sim.spawnUnit(g, 0, 'interceptor', 640, 0);
  sim.setStance(g, 0, 'attack'); for (let i = 0; i < 60 * 8; i++) sim.update(g, sim.TICK);
  assert.ok(Math.hypot(ic.u - lv.u, ic.v - lv.v) < 70, `with it (${Math.hypot(ic.u - lv.u, ic.v - lv.v).toFixed(0)})`);
});

// rework-5b "swarm surge" (:53): the surge reads its neighbours within 80, up to 8
test('b6h: the swarm surge still counts the Bloomhost ground units within 80 (up to +40%)', () => {
  const g = range(['bloomhost', 'lastfist']); g.sides[0].manual = true;
  const lead = sim.rangeUnit(g, 0, 'skitterling', 300, 0); for (let i = 0; i < 10; i++) sim.rangeUnit(g, 0, 'skitterling', 290 - (i % 4) * 9, (Math.floor(i / 4) - 1) * 12);
  sim.rangeStep(g); const near = g.ents.filter(e => e !== lead && e.type === 'skitterling' && Math.hypot(e.u - lead.u, e.v - lead.v) <= 80).length;
  assert.strictEqual(lead.sgN, Math.min(8, near));
});

// bh-trees (:17): a path at T2 still locks the Larva Pit (its Leapers or Queens), the Spitter aside
test('b6h: the Larva Pit\'s path locks its T2 units; the Spitter trains on either path', () => {
  const g = sim.newGame('normal', { seed: 3, factions: ['bloomhost', 'lastfist'] }); g.countdown = 0;
  const b = sim.mkBuilding(g, 0, 'barracks', 0); b.built = true; b.progress = 1; b.tier = 2; b.path = 'A';
  assert.ok(sim.canMake(b, 'leaper', g)); assert.ok(!sim.canMake(b, 'queen', g)); assert.ok(sim.canMake(b, 'spitter', g));
  b.path = 'B'; assert.ok(!sim.canMake(b, 'leaper', g)); assert.ok(sim.canMake(b, 'queen', g)); assert.ok(sim.canMake(b, 'spitter', g));
});

// bloomhost-sig "Mites" (:34) and "saves v29" (:154): the Mound's Mites keep its rate; they live 10 s; a save keeps them and its timer
test('b6h: the Brood Mound spawns at its rate, its Mites live 10 s, and a save keeps them', () => {
  const g = sim.newGame('normal', { seed: 4, factions: ['bloomhost', 'lastfist'] }); g.countdown = 0; for (const s of g.sides) s.aiT = 1e9;
  const m = sim.mkBuilding(g, 0, 'sigA', -1); m.u = 400; m.v = 0; m.built = true; m.progress = 1; m.tier = 2; m.hp = m.maxHp;
  for (let i = 0; i < 60 * 21; i++) sim.update(g, sim.TICK);
  const ms = g.ents.filter(e => e.type === 'mite' && e.side === 0 && e.hp > 0);
  assert.strictEqual(ms.length, sim.MOUND.n[2]); assert.ok(ms.every(e => Math.abs(e.temp - e.tLife - (g.t - (g.t - (e.temp - e.tLife)))) < 1e-6 && e.tLife === sim.B6H.mite.life));
  const g2 = sim.deserialize(sim.serialize(g, {})); assert.ok(g2); assert.strictEqual(g2.ents.filter(e => e.type === 'mite' && e.hp > 0).length, ms.length);
  for (let i = 0; i < 60 * 11; i++) sim.update(g2, sim.TICK);
  assert.ok(!g2.ents.some(e => ms.some(x => x.id === e.id) && e.hp > 0), 'gone after 10 s');
});

// rework-3a (:153) and rework-6b's b6art test (:94): an AI's Leapers aim at the backline (Artillery first)
test('b6h: a Leaper (an AI\'s aims too) ranks Artillery, then ranged units, then big ones', () => {
  const g = sim.newGame('hard', { seed: 6, factions: ['bloomhost', 'lastfist'], autoPlayer: true, autoDiff: 'hard' }); g.countdown = 0;
  const t = sim.spawnUnit(g, 1, 'tank', 900, 0), a = sim.spawnUnit(g, 1, 'artillery', 1000, 0), b = sim.spawnUnit(g, 1, 'bulwark', 900, 40), k = sim.spawnUnit(g, 1, 'skitterling', 900, -40);
  assert.deepStrictEqual([a, t, b, k].map(e => sim.latchTier6h(g, e)), [0, 1, 2, 3], 'Artillery, then ranged (the Tank), then big, then the rest');
});
