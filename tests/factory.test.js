// War Factory tree (v2.14): Siege (Artillery, Titan) or Assault (Flame Tank, Hydra), the Flame Tank's burst strip, the
// Hydra's air preference, longer air range and gun swing, the AI's default paths, saves and v13 migration. SIM only.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const same = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
function base(nFactory = 2) {
  const g = sim.newGame('normal');
  for (const s of [0, 1]) { g.sides[s].aiT = 1e9; g.sides[s].res.c = g.sides[s].res.e = 1e5; }
  g.t = 300;
  for (const k of ['barracks', 'refinery', ...Array(nFactory).fill('factory'), 'habitat', 'habitat', 'habitat']) {
    sim.tryBuild(g, 0, k); for (const b of g.ents) if (b.kind === 'b') { b.built = true; b.progress = 1; }
  }
  sim.setStance(g, 0, 'hold');
  return { g, fac: g.ents.filter(e => e.type === 'factory') };
}
const finishUp = (g, b) => { b.upProg = 0.9999; step(g, 0.2); };
// a quiet field for unit checks: no AI, both sides see everything
function field() {
  const g = sim.newGame('normal');
  for (const s of [0, 1]) { g.sides[s].aiT = 1e9; g.fog[s].exp.fill(1); g.fog[s].vis.fill(1); }
  g.t = 300;
  return g;
}

test('the War Factory picks Siege or Assault at T2; Siege unlocks Artillery (T2) and Titan (T3), Assault the Flame Tank (T2) and Hydra (T3)', () => {
  same(Object.keys(sim.TREES.factory).filter(k => k.length === 1), ['A', 'B']);
  assert.strictEqual(sim.TREES.factory.A.name, 'Siege'); assert.strictEqual(sim.TREES.factory.B.name, 'Assault');
  same(['artillery', 'titan', 'flame', 'hydra'].map(k => sim.UNIT_PATH[k].b + sim.UNIT_PATH[k].p + sim.UDEF[k].tier), ['factoryA2', 'factoryA3', 'factoryB2', 'factoryB3']);
  const { g, fac: [a, b] } = base();
  assert.ok(sim.tryTrain(g, 0, 'tank').ok, 'T1 Tanks from any War Factory');
  assert.match(sim.tryUpgrade(g, 0, a).msg, /Choose a path/);
  assert.match(sim.tryTrain(g, 0, 'flame').msg, /Requires War Factory T2 · Assault/);
  sim.tryUpgrade(g, 0, a, 'A'); sim.tryUpgrade(g, 0, b, 'B'); finishUp(g, a); finishUp(g, b);
  assert.deepStrictEqual([a.path, b.path], ['A', 'B']);
  assert.ok(sim.tryTrain(g, 0, 'artillery').ok && sim.tryTrain(g, 0, 'flame').ok);
  assert.ok(!sim.tryTrain(g, 0, 'titan').ok && !sim.tryTrain(g, 0, 'hydra').ok, 'T3 units need T3');
  assert.ok(a.queue.includes('artillery') && !a.queue.includes('flame') && b.queue.includes('flame') && !b.queue.includes('artillery'));
  sim.tryUpgrade(g, 0, a); sim.tryUpgrade(g, 0, b); finishUp(g, a); finishUp(g, b);
  assert.ok(sim.tryTrain(g, 0, 'titan').ok && sim.tryTrain(g, 0, 'hydra').ok);
  assert.ok(a.queue.includes('titan') && b.queue.includes('hydra'));
  assert.ok(sim.tryTrain(g, 0, 'tank').ok, 'Tanks still come from both');
});

test('Flame Tank: no projectile; every enemy on the ground in the strip ahead takes the burst, nothing behind, beside or in the air', () => {
  const g = field(), d = sim.UDEF.flame;
  const f = sim.spawnUnit(g, 0, 'flame', 1000, 0); f.face = 1;
  const mk = (type, du, dv) => { const u = sim.spawnUnit(g, 1, type, 1000 + du, dv); return u; };
  const inA = mk('rifle', 40, 0), inB = mk('rifle', 90, 20), inC = mk('heavy', 60, -15), tank = mk('tank', 50, 5);
  const behind = mk('rifle', -30, 0), wide = mk('rifle', 50, d.strip + 10), far = mk('rifle', d.range + 20, 0), air = mk('aircraft', 40, 0);
  const hp0 = new Map(g.ents.map(e => [e, e.hp])), nP = g.projs.length;
  sim.flameBurst(g, f, d);
  assert.strictEqual(g.projs.length, nP, 'no projectile');
  const lost = e => hp0.get(e) - e.hp;
  assert.ok(Math.abs(lost(inA) - d.dmg * sim.DMG.flame.light) < 1e-9 && Math.abs(lost(inB) - d.dmg * sim.DMG.flame.light) < 1e-9, 'every Rifleman in the strip');
  assert.ok(Math.abs(lost(inC) - d.dmg * sim.DMG.flame.heavy) < 1e-9);
  assert.ok(Math.abs(lost(tank) - d.dmg * sim.DMG.flame.vehicle) < 1e-9, 'weak against vehicles');
  for (const e of [behind, wide, far, air]) assert.strictEqual(lost(e), 0);
  assert.strictEqual(sim.DMG.flame.air, 0); assert.strictEqual(d.hitsAir, false);
  // no lingering burn: a second later nobody has lost more
  const hp1 = new Map(g.ents.map(e => [e, e.hp])); f.hp = 0; step(g, 1);
  assert.ok([inA, inB, inC, tank].every(e => e.hp === hp1.get(e)), 'nothing lingers');
});

test('Flame Tank: it burns buildings in reach (0.6×) but never a shielded HQ; it fires on its own in a fight', () => {
  const g = field(), d = sim.UDEF.flame, hq = g.ents.find(e => e.side === 1 && e.type === 'hq');
  const f = sim.spawnUnit(g, 0, 'flame', hq.u - hq.half - 40, hq.v); f.face = 1;
  sim.tryBuild(g, 1, 'barracks'); const bar = g.ents.find(e => e.side === 1 && e.type === 'barracks'); bar.built = true; bar.progress = 1;
  sim.refreshShields && sim.refreshShields(g);
  assert.ok(hq.shielded, 'HQ shielded while the Barracks stands');
  const h0 = hq.hp; sim.flameBurst(g, f, d); assert.strictEqual(hq.hp, h0);
  bar.u = f.u + 50; bar.v = f.v; const b0 = bar.hp; sim.flameBurst(g, f, d);
  assert.ok(Math.abs(b0 - bar.hp - d.dmg * sim.DMG.flame.building) < 1e-9);
  // in play: a Flame Tank on Attack burns a Rifleman squad
  const g2 = field(); const f2 = sim.spawnUnit(g2, 0, 'flame', 1000, 0);
  const rs = [0, 1, 2].map(i => sim.spawnUnit(g2, 1, 'rifle', 1070 + i * 8, i * 6 - 6));
  for (const r of rs) { r.holdU = r.u; r.holdV = r.v; }
  sim.setStance(g2, 1, 'hold'); sim.setStance(g2, 0, 'hold'); f2.holdU = f2.u; f2.holdV = 0;
  step(g2, 1);
  assert.ok(rs.every(r => r.hp < r.maxHp), 'all three burned: ' + rs.map(r => r.hp.toFixed(0)).join(','));
});

test('Hydra: hits air out to 240 (ground 200), picks aircraft over closer ground targets, deals 0.3× to buildings', () => {
  const d = sim.UDEF.hydra;
  assert.strictEqual(d.range, 200); assert.strictEqual(d.airRange, 240); assert.strictEqual(sim.DMG.hydra.building, 0.3);
  assert.ok(d.hitsAir && d.preferAir);
  const g = field(), h = sim.spawnUnit(g, 0, 'hydra', 1000, 0); h.face = 1;
  const foes = () => g.ents.filter(e => e.side === 1 && e.kind === 'u');
  const ground = sim.spawnUnit(g, 1, 'rifle', 1080, 0);
  const plane = sim.spawnUnit(g, 1, 'aircraft', 1225, 0);
  assert.strictEqual(sim.acquire(g, h, d, foes()).best, plane, 'aircraft first, even farther away');
  plane.u = 1000 + 260; assert.strictEqual(sim.acquire(g, h, d, foes()).best, ground, 'beyond 240: the ground target');
  ground.u = 1000 + 220; assert.strictEqual(sim.acquire(g, h, d, foes()).best, null, 'ground beyond 200');
  // a Tank (ground range 175) can't reach an aircraft at 220 either way
  assert.ok(!sim.UDEF.tank.airRange);
});

test('Hydra: switching between ground and air targets costs 0.4 s before the next shot', () => {
  const g = field(), d = sim.UDEF.hydra, h = sim.spawnUnit(g, 0, 'hydra', 1000, 0);
  sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); h.holdU = h.u; h.holdV = 0;
  const r = sim.spawnUnit(g, 1, 'heavy', 1100, 0); r.holdU = r.u; r.holdV = 0; r.hp = r.maxHp = 1e6;
  step(g, 1);
  assert.strictEqual(h.aimAir, 0);
  const p = sim.spawnUnit(g, 1, 'aircraft', 1150, 0); p.hp = p.maxHp = 1e6;
  h.cd = 0; const foes = g.ents.filter(e => e.side === 1);
  sim.updateUnit(g, h, foes, 1 / 30);
  assert.strictEqual(h.aimAir, 1, 'guns up');
  assert.ok(h.cd >= d.swing - 1e-9, `cooldown ${h.cd} includes the 0.4 s swing`);
  const cd0 = h.cd; sim.updateUnit(g, h, foes, 1 / 30);
  assert.ok(h.cd < cd0, 'no second swing while it keeps the same target type');
});

test('the AI: Aggressor and Trickster default to Assault, Turtle and Economist to Siege; Assault AIs train Flame Tanks', () => {
  const g = sim.newGame('hard'), b = { type: 'factory', side: 1, kind: 'b', hp: 1 };
  for (const kind of ['aggressor', 'trickster', 'turtle', 'economist']) {
    const P = sim.rollPersona(kind), want = kind === 'aggressor' || kind === 'trickster' ? 'B' : 'A';
    assert.strictEqual(P.paths.factory, want, kind);
    assert.strictEqual(sim.aiPickPath(g, 1, b, P, []), want, kind + ' picks its default');
  }
  let flames = 0, hydras = 0, assault = 0;
  for (let m = 0; m < 3; m++) {
    const g2 = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'aggressor', autoPersona: 'aggressor' });
    for (let i = 0; i < 30 * 900 && !g2.over; i++) sim.update(g2, 1 / 30);
    for (const s of [0, 1]) { const T = g2.log.tot[s].trained; flames += T.flame || 0; hydras += T.hydra || 0; }
    assault += g2.log.ev.filter(e => e[2] === 'U' && e[3] === 'factory' && e[6] === 'B').length;
  }
  assert.ok(assault > 0, 'Assault upgrades happen');
  assert.ok(flames > 0, `Flame Tanks trained (${flames}; Hydras ${hydras})`);
});

test('saves keep War Factory paths and Hydra aim; a v13 save migrates (T2+ War Factory → Siege, upgrade in progress → Siege)', () => {
  const { g, fac: [a, b] } = base();
  sim.tryUpgrade(g, 0, a, 'B'); finishUp(g, a); sim.tryUpgrade(g, 0, b, 'B');
  const h = sim.spawnUnit(g, 0, 'hydra', 900, 0); h.aimAir = 1;
  const g2 = sim.deserialize(sim.serialize(g, {}));
  const [a2, b2] = g2.ents.filter(e => e.type === 'factory');
  same([a2.path, b2.upPath], ['B', 'B']);
  assert.strictEqual(g2.ents.find(e => e.type === 'hydra').aimAir, 1);
  const o = JSON.parse(sim.serialize(g, {})); o.v = 13;
  for (const e of o.ents) if (e.type === 'factory') { delete e.path; delete e.upPath; }
  for (const e of o.ents) delete e.aimAir;
  const g3 = sim.deserialize(JSON.stringify(o)), [a3, b3] = g3.ents.filter(e => e.type === 'factory');
  same([a3.tier, a3.path, b3.path, b3.upPath], [2, 'A', null, 'A']);
  assert.ok(g3.ents.filter(e => e.kind === 'u').every(u => u.aimAir === 0));
  assert.strictEqual(g3.ents.find(e => e.type === 'barracks').path, null, 'Barracks untouched');
});

test('the match log counts what killed your units', () => { // v2.35: the Lessons tab (and its Flame Tank lesson) is gone
  const g = field();
  for (let i = 0; i < 13; i++) { const r = sim.spawnUnit(g, 0, 'rifle', 900, 0); sim.kill(g, r, 1, 'flame'); }
  assert.strictEqual(g.log.tot[0].lostTo.flame, 13);
});
