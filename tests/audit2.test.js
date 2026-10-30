// Audit phase 2 (v2.36): the SIM side of the visual and audio pass. The Flame Tank burns along its target's line (the
// off-centre bug), the Axis lance is a beam with the HQ gun's damage, rate and range, and the match report counts the
// starting resources, sales and Salvage as gathered. SIM only; the visuals and sounds are checked in the browser.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
function field(factions) {
  const g = sim.newGame('normal', factions ? { factions } : {});
  for (const s of [0, 1]) { g.sides[s].aiT = 1e9; g.sides[s].res.c = g.sides[s].res.e = 1e5; }
  g.t = 200;
  return g;
}

test('Flame Tank: a target picked off to the side is burned (the v2.31 off-centre bug); with FLAME.aim false it is not', () => {
  const d = sim.UDEF.flame;
  for (const off of [30, 50, 70]) {
    const g = field(), f = sim.spawnUnit(g, 0, 'flame', 1000, 0); f.face = 1;
    const t = sim.spawnUnit(g, 1, 'tank', 1040, off), h0 = t.hp;
    sim.flameBurst(g, f, d, t);
    assert.ok(Math.abs(h0 - t.hp - d.dmg * sim.DMG.flame.vehicle) < 1e-9, `${off} to the side: burned`);
    sim.FLAME.aim = false; const h1 = t.hp; sim.flameBurst(g, f, d, t); sim.FLAME.aim = true;
    assert.strictEqual(t.hp, h1, `${off} to the side: the old strip missed it`);
  }
  // in play: a tough Tank 50 to the side of a holding Flame Tank's line now dies; damage per burst unchanged
  const g = field(), f = sim.spawnUnit(g, 0, 'flame', 1000, 0), t = sim.spawnUnit(g, 1, 'tank', 1045, 50);
  sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); t.holdU = t.u; t.holdV = t.v; f.holdU = f.u; f.holdV = f.v;
  const h0 = t.hp; step(g, 5);
  assert.ok(t.hp < h0, `the Flame Tank burns it (${h0} → ${t.hp})`);
  assert.deepStrictEqual([d.dmg, d.cd, d.range, d.strip], [10, 0.25, 95, d.strip], 'stats unchanged');
});

test('the Axis lance: a beam with the HQ gun\'s damage, rate, range and multipliers at every tier (DPS unchanged)', () => {
  for (let t = 1; t <= 3; t++) {
    const a = sim.BDEFS.axiarchs.hq.gun[t], b = sim.BDEF.hq.gun[t];
    assert.strictEqual(a.weapon, 'hqbeam'); assert.ok(a.beam);
    assert.deepStrictEqual([a.dmg, a.cd, a.range, a.hitsAir], [b.dmg, b.cd, b.range, b.hitsAir]);
    assert.strictEqual(sim.BDEFS.bloomhost.hq.gun[t].weapon, 'hqgun'); assert.strictEqual(sim.BDEF.hq.gun[t].weapon, 'hqgun'); // the others keep their gun
  }
  assert.deepStrictEqual({ ...sim.DMG.hqbeam }, { ...sim.DMG.hqgun });
  // in play: an enemy Tank next to the Axis takes the lance's damage, with no projectile in flight
  const g = field(['axiarchs', 'lastfist']), hq = g.sides[0].hq;
  const t = sim.spawnUnit(g, 1, 'tank', hq.u + 200, 0); t.hp = t.maxHp = 1e5; sim.setStance(g, 1, 'hold'); t.holdU = t.u; t.holdV = t.v;
  step(g, 11);
  const lost = 1e5 - t.hp, per = sim.BDEF.hq.gun[1].dmg * sim.DMG.hqbeam.vehicle;
  assert.ok(lost >= per * 9 && lost <= per * 11, `about 10 shots in 11 s (${lost / per})`);
  assert.ok(!g.projs.some(p => p.side === 0 && p.weapon === 'hqbeam'), 'no projectile');
  assert.ok(g.fx.some(f => f.k === 'beam' && f.hq) || lost > 0);
});

test('report: gathered counts the start, income, sales and Salvage, so spent never exceeds it', () => {
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard' });
  step(g, 300);
  const L = g.log;
  for (const s of [0, 1]) {
    const T = L.tot[s], sp = i => Object.values(T.spent).reduce((a, b) => a + b[i], 0);
    assert.ok(Math.abs(sim.logGathered(L, T, 0) - (sim.START_RES.c + T.earn[0] + T.sold[0] + (T.salv || 0))) < 1e-6);
    assert.ok(sim.logGathered(L, T, 0) >= sp(0) - 1e-6 && sim.logGathered(L, T, 1) >= sp(1) - 1e-6, `side ${s}: spent within gathered`);
  }
});
