// v2.82 (docs/FACTION_REWORK.md batch 2a): Artillery deploy and telegraphed shells, the Gorebore, the Severance, and the
// per-game switch block (REWORK → g.rw). Played on Test Range games (the real SIM, no HQs, no fog).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const step = (s, g, sec) => { for (let i = 0; i < Math.round(sec * 60); i++) s.rangeStep(g); };

test('switches: per game; b2a off keeps the Bile Lobber and Rift Mortar, on gives the Gorebore and Severance', () => {
  const s = loadSim();
  assert.strictEqual(JSON.stringify(s.rwInit()), JSON.stringify({ b2a: true, artDeploy: true, artTelegraph: true, b2b: true, b3a: true, b3b: true, b4a: true, b4b: true, b5b: true, b5c: true, b6side: true, b6art: true, b6hq: true, b6c: true }), 'the new default is on (v2.83: b2b too; v2.84: b3a; v2.85: b3b)');
  const on = s.rangeGame({ factions: ['bloomhost', 'axiarchs'] }), off = s.rangeGame({ factions: ['bloomhost', 'axiarchs'], rework: { b2a: false } });
  assert.strictEqual(s.rangeUnit(on, 0, 'bilelobber', 600, 0).type, 'gorebore');
  assert.strictEqual(s.rangeUnit(off, 0, 'gorebore', 600, 0).type, 'bilelobber');
  assert.strictEqual(s.rangeUnit(on, 1, 'riftmortar', 900, 0).type, 'severance');
  assert.strictEqual(s.rangeUnit(off, 1, 'severance', 900, 0).type, 'riftmortar');
  assert.ok(s.rwHas(on, 'gorebore') && !s.rwHas(on, 'bilelobber') && s.rwHas(off, 'bilelobber') && !s.rwHas(off, 'severance'));
  assert.strictEqual(s.UNIT_PATH.gorebore.path.name, 'Burrowing Evolution');
  // trained from the same Evolution Chamber path: only the one this game has
  const g = s.newGame('normal', { factions: ['bloomhost', 'axiarchs'], seed: 3 }), g0 = s.newGame('normal', { factions: ['bloomhost', 'axiarchs'], seed: 3, rework: { b2a: false } });
  for (const G of [g, g0]) { const b = s.spawnUnit(G, 0, 'skitterling', 0, 0); b.kind = 'b'; b.type = 'factory'; b.fac = 'bloomhost'; b.built = true; b.tier = 2; b.path = 'A'; b.queue = []; }
  assert.ok(s.canTrain(g, 0, 'gorebore') && !s.canTrain(g, 0, 'bilelobber'));
  assert.ok(s.canTrain(g0, 0, 'bilelobber') && !s.canTrain(g0, 0, 'gorebore'));
});

test('Artillery deploy: it deploys before it fires and packs up before it moves; off: it fires at once', () => {
  const s = loadSim();
  for (const dep of [true, false]) {
    const g = s.rangeGame({ factions: ['lastfist', 'lastfist'], rework: { artDeploy: dep, artTelegraph: false } });
    const a = s.rangeUnit(g, 0, 'artillery', 640, 0); s.rangeUnits(g, 1, 'rifle', 1000, 0, 4);
    g.sides[1].hush = true; s.rangeMode(g, 0, 'attack');
    step(s, g, 0.5);
    if (dep) {
      assert.strictEqual(a.dep, 1, 'deploying'); assert.strictEqual(g.projs.length, 0, 'no shot while deploying');
      step(s, g, s.ART.deploy); assert.strictEqual(a.dep, 2, 'deployed');
      step(s, g, 0.4); assert.ok(g.projs.length > 0, 'fires once deployed');
      const u0 = a.u; g.sides[0].mode = 'hold'; s.command(g, 0, [a.id], 'retreat'); // (Hold: the range's Attack would re-target it)
      step(s, g, 0.5); assert.strictEqual(a.dep, 3, 'packing up'); assert.strictEqual(a.u, u0, 'does not move while packing');
      step(s, g, s.ART.pack + 0.1); assert.ok(!a.dep, 'packed'); step(s, g, 0.5); assert.ok(a.u < u0, 'then moves');
    } else { assert.ok(!a.dep); assert.ok(g.projs.length > 0, 'fires at once'); }
  }
});

test('Telegraphed shells: a marker from firing to impact, at least ART.fly s; a unit that steps out takes nothing', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['lastfist', 'lastfist'], rework: { artDeploy: false } });
  const a = s.rangeUnit(g, 0, 'artillery', 640, 0), r = s.rangeUnit(g, 1, 'heavy', 1000, 0);
  g.sides[1].hush = true; s.rangeMode(g, 0, 'attack');
  let n = 0; while (!g.projs.length && n++ < 600) s.rangeStep(g);
  assert.ok(g.mk && g.mk.length === g.projs.length && g.projs.length > 0, 'one marker per shell');
  for (const p of g.projs) { assert.ok(p.T >= s.ART.fly - 1e-9, 'flight time'); assert.ok(g.mk.some(m => m.u === p.tu && m.v === p.tv && m.r === p.splash), 'the marker is where the shell lands'); }
  r.u = 1300; r.holdU = 1300; // stepped out of every marker before impact
  step(s, g, 0.2); g.sides[0].hush = true; step(s, g, 3);
  assert.strictEqual(r.hp, r.maxHp, 'no damage outside the marker');
  assert.strictEqual(g.mk.length, 0, 'markers cleared at impact');
  // v2.83: no unit steps out of a marker on its own (the AI's marker dodge of v2.82 is gone); the meteor dodge stays
  assert.strictEqual(s.markDodge, undefined, 'no marker dodge');
  const h = s.newGame('normal', { seed: 3, countdown: 0 }); h.sides[1].aiT = 1e9; h.sides[1].stance = 'hold';
  const run = sec => { for (let i = 0; i < sec * 60; i++) s.update(h, s.TICK); };
  const q = s.spawnUnit(h, 1, 'rifle', s.rallyU(1, h), 0); run(6);
  const at = [q.u, q.v]; h.mk = [{ u: q.u, v: q.v, r: 40, side: 0, t0: h.t, t1: h.t + 3 }]; run(1.5);
  assert.ok(Math.hypot(q.u - at[0], q.v - at[1]) < 2, 'an AI unit inside an enemy marker stays where it was');
});

test('Gorebore: burrows, can\'t be hurt underground, erupts under the backline unit first, then is exposed and on cooldown', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['bloomhost', 'lastfist'] });
  const b = s.rangeUnit(g, 0, 'gorebore', 640, 0);
  const near = s.rangeUnit(g, 1, 'rifle', 820, 0), art = s.rangeUnit(g, 1, 'artillery', 900, 20);
  g.sides[1].hush = true; g.sides[0].mode = 'hold'; b.po = { o: 'attack' }; // attack down the lane: it picks its own target
  step(s, g, 0.3);
  assert.strictEqual(b.bur, 1); assert.strictEqual(b.gone, 1);
  const hp = b.hp; s.damage(g, b, 500, 'shell', 1); assert.strictEqual(b.hp, hp, 'untouchable underground');
  let n = 0; while (b.bur && n++ < 1200) s.rangeStep(g);
  assert.ok(!b.bur, 'surfaced');
  assert.ok(art.hp < art.maxHp || art.hp <= 0, 'erupted under the Artillery'); assert.ok(Math.hypot(b.u - art.u, b.v - art.v) < 20);
  assert.ok(b.surfT - g.t > s.BORE.expose - 0.1 && b.burCd - g.t > s.BORE.cd - 0.1, 'exposed, burrow on cooldown');
  s.damage(g, b, 10, 'rifle', 1); assert.ok(b.hp < hp, 'hurt while surfaced');
});

test('Severance: a slow orb; enemy units hit take its damage, then are frozen, untouchable and paused; immune after; never a lone small unit', () => {
  const s = loadSim();
  const g = s.rangeGame({ factions: ['axiarchs', 'lastfist'] });
  const sv = s.rangeUnit(g, 0, 'severance', 700, 0);
  const lone = s.rangeUnit(g, 1, 'rifle', 900, 0); g.sides[1].hush = true; g.sides[0].hush = false;
  sv.po = { o: 'hold' }; step(s, g, 2);
  assert.ok(!g.projs.some(p => p.weapon === 'exile'), 'no orb at a lone Marine');
  s.rangeRemove(g, lone);
  const us = s.rangeUnits(g, 1, 'rifle', 920, 0, 5);
  let n = 0; while (!g.projs.some(p => p.weapon === 'exile') && n++ < 120) s.rangeStep(g);
  const orb = g.projs.find(p => p.weapon === 'exile'); assert.ok(orb, 'fires at the group'); assert.strictEqual(orb.speed, s.SEVER.speed);
  const pos = us.map(e => [e.u, e.v]); us[0].corr = 0.1; us[0].corrT = g.t + 10;
  n = 0; while (!us.some(e => e.exT > g.t) && n++ < 400) s.rangeStep(g);
  const ex = us.filter(e => e.exT > g.t); assert.ok(ex.length >= 3, 'the group is exiled');
  for (const e of ex) { assert.ok(e.hp < e.maxHp, 'took the orb\'s damage first'); assert.strictEqual(e.gone, 2); }
  const c0 = us[0].corrT, hp0 = ex[0].hp; s.damage(g, ex[0], 50, 'rifle', 0); assert.strictEqual(ex[0].hp, hp0, 'untouchable');
  step(s, g, 2); ex.forEach(e => { const i = us.indexOf(e); assert.strictEqual(JSON.stringify([e.u, e.v]), JSON.stringify(pos[i]), 'frozen'); });
  step(s, g, s.SEVER.dur);
  assert.ok(ex.every(e => !e.gone && e.exImm > g.t), 'back, immune');
  if (us[0].exS !== undefined) assert.ok(Math.abs(us[0].corrT - (c0 + s.SEVER.dur)) < 1e-6, 'corrosion paused for the exile');
});

test('saves: the switches are saved only with b2a (or b2b, v2.83) on; a save without them plays as before the rework', () => {
  const s = loadSim();
  const g = s.newGame('normal', { seed: 5 }), o = JSON.parse(s.serialize(g, {}));
  assert.strictEqual(JSON.stringify(o.rw), JSON.stringify({ b2a: true, artDeploy: true, artTelegraph: true, b2b: true, b3a: true, b3b: true, b4a: true, b4b: true, b5b: true, b5c: true, b6side: true, b6art: true, b6hq: true, b6c: true }));
  const g0 = s.newGame('normal', { seed: 5, rework: { b2a: false, b2b: false, b3a: false, b3b: false, b4a: false, b4b: false, b5b: false, b5c: false, b6side: false, b6art: false, b6hq: false, b6c: false } }), o0 = JSON.parse(s.serialize(g0, {}));
  assert.ok(!('rw' in o0) && !('mk' in o0));
  assert.strictEqual(s.deserialize(s.serialize(g0, {})).rw.b2a, false);
  assert.strictEqual(s.deserialize(s.serialize(g, {})).rw.b2a, true);
});
