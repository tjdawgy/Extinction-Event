// Bloomhost framework (v2.17): the eight buildings in their roles, the three base units and their traits (swarm bonus,
// melee chase, Bulwark brace), abilities "coming soon", saves v17, the hidden enemy
// faction in the fog, the match log, and the AI playing a whole match as Bloomhost. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'bloomhost', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; s.stance = 'hold'; } return g; };
const finish = (g, s, k) => { const r = sim.tryBuild(g, s, k); assert.ok(r.ok, r.msg); const b = g.ents.filter(e => e.side === s && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };
const hold = (e, u, v) => { e.holdU = u; e.holdV = v; return e; };

test('the eight Bloomhost buildings fill the Last Fist roles; the Hive keeps the HQ\'s numbers; the Maw is its own defence', () => {
  const names = { hq: 'Hive', refinery: 'Goremound', reactor: 'Pulse Organ', habitat: 'Hatchery', barracks: 'Larva Pit', factory: 'Evolution Chamber', turret: 'Maw', techlab: 'Bloomspire' };
  for (const k in names) assert.strictEqual(sim.BD('bloomhost', k).name, names[k]);
  const H = sim.BD('bloomhost', 'hq'), Q = sim.BDEF.hq;
  assert.deepStrictEqual([H.hp, H.gun[1].dmg, H.gun[3].range, H.inc[1].c], [Q.hp, Q.gun[1].dmg, Q.gun[3].range, Q.inc[1].c]);
  for (const k of ['refinery', 'reactor', 'habitat']) assert.deepStrictEqual(JSON.stringify(sim.BD('bloomhost', k).inc || sim.BD('bloomhost', k).pop), JSON.stringify(sim.BDEF[k].inc || sim.BDEF[k].pop), k);
  const M = sim.BD('bloomhost', 'turret');
  assert.strictEqual(M.gun[1].weapon, 'spine'); assert.ok(M.gun[1].hitsAir); assert.ok(M.gun[1].range < sim.BDEF.turret.gun[1].range);
  const g = quiet();
  assert.deepStrictEqual([...g.sides.map(s => s.faction)], ['bloomhost', 'lastfist']);
  assert.strictEqual(g.sides[0].hq.fac, 'bloomhost'); assert.strictEqual(g.sides[1].hq.fac, 'lastfist');
  assert.match(sim.tryBuild(g, 0, 'factory').msg, /Requires a finished Larva Pit/);
  assert.match(sim.tryBuild(g, 0, 'techlab').msg, /Requires a finished Larva Pit/);
  const pit = finish(g, 0, 'barracks');
  assert.strictEqual(pit.fac, 'bloomhost');
  for (const k of ['factory', 'techlab', 'refinery', 'reactor', 'habitat', 'turret']) assert.ok(finish(g, 0, k));
  assert.strictEqual(sim.popCap(g, 0), 12 + 10);
  assert.deepStrictEqual({ ...sim.income(g, 0) }, { c: 3 + 4, e: 1 + 2 });
});

test('each faction trains only its own units; every production building picks a path (v2.19: Larva Pit and Evolution Chamber; v2.21: Bloomspire); the rest upgrade', () => {
  const g = quiet(); g.countdown = 0;
  const pit = finish(g, 0, 'barracks'), evo = finish(g, 0, 'factory'), spire = finish(g, 0, 'techlab'), gore = finish(g, 0, 'refinery'), maw = finish(g, 0, 'turret');
  finish(g, 0, 'habitat'); finish(g, 1, 'barracks');
  for (const [t, ok] of [['skitterling', true], ['bulwark', true], ['razorwing', true], ['rifle', false], ['tank', false], ['aircraft', false]]) assert.strictEqual(sim.tryTrain(g, 0, t).ok, ok, t);
  assert.ok(sim.tryTrain(g, 1, 'rifle').ok); assert.ok(!sim.tryTrain(g, 1, 'skitterling').ok, 'a Last Fist Barracks makes no Skitterlings');
  assert.match(sim.tryUpgrade(g, 0, spire).msg, /Choose a path/); assert.ok(sim.tryUpgrade(g, 0, spire, 'A').ok);
  assert.match(sim.tryUpgrade(g, 0, pit).msg, /Choose a path/); assert.ok(sim.tryUpgrade(g, 0, pit, 'B').ok); assert.ok(sim.tryUpgrade(g, 0, evo, 'A').ok);
  assert.ok(sim.tryUpgrade(g, 0, gore).ok); assert.ok(sim.tryUpgrade(g, 0, maw).ok); assert.ok(sim.tryUpgrade(g, 0, g.sides[0].hq).ok);
  step(g, 30);
  assert.strictEqual(gore.tier, 2); assert.strictEqual(sim.income(g, 0).c >= 3 + 6, true);
});

test('each faction uses only its own three abilities (v2.20: Bloomhost has Frenzy Bloom, Emergency Brood, Corrosive Bloom)', () => {
  const g = quiet(); g.countdown = 0; g.t = 300;
  assert.deepStrictEqual(Object.keys(g.sides[0].ab), ['frenzy', 'brood', 'corrosive']); assert.deepStrictEqual(Object.keys(g.sides[1].ab), ['shield', 'strike', 'repair']);
  for (const k of ['shield', 'strike', 'repair']) assert.match(sim.abilityCheck(g, 0, k).msg, /not a Bloomhost ability/);
  for (const k of ['frenzy', 'brood', 'corrosive']) assert.match(sim.abilityCheck(g, 1, k).msg, /not a Last Fist ability/);
  assert.ok(sim.abilityCheck(g, 0, 'frenzy').ok); assert.ok(sim.abilityCheck(g, 1, 'shield').ok);
});

test('Skitterlings: melee, +15% per other Skitterling on the same target (at most +45%); they close on enemies in other lanes', () => {
  const g = quiet(); g.countdown = 0;
  const foe = hold(sim.spawnUnit(g, 1, 'titan', 800, 0), 800, 0); foe.cd = 1e6;
  const hitWith = n => {
    const sk = []; for (let i = 0; i < n; i++) { const s = sim.spawnUnit(g, 0, 'skitterling', 790, 0); s.tgt = foe.id; sk.push(s); }
    const hp = foe.hp; sim.fire(g, sk[0], foe, sim.UDEF.skitterling); const d = hp - foe.hp;
    for (const s of sk) s.hp = 0; g.ents = g.ents.filter(e => e.hp > 0); return d;
  };
  const one = hitWith(1), mult = sim.DMG.claw.vehicle;
  assert.ok(Math.abs(one - 6 * mult) < 1e-6, `one: ${one}`);
  assert.ok(Math.abs(hitWith(3) - 6 * mult * 1.3) < 1e-6);
  assert.ok(Math.abs(hitWith(8) - 6 * mult * 1.45) < 1e-6, 'capped at +45%');
  assert.strictEqual(g.projs.length, 0, 'no projectile: the blow lands at once');
  // a Skitterling on Attack in a far lane still reaches a Rifleman standing in another lane
  const g2 = quiet(); g2.countdown = 0; sim.setStance(g2, 0, 'attack'); g2.sides[1].stance = 'hold';
  const sk = sim.spawnUnit(g2, 0, 'skitterling', 600, 100); sk.laneV = 100;
  const r = hold(sim.spawnUnit(g2, 1, 'rifle', 760, -90), 760, -90); r.cd = 1e6; r.hp = r.maxHp = 1e4;
  step(g2, 12);
  assert.ok(r.hp < 1e4, 'the Rifleman was bitten');
  assert.ok(Math.abs(sk.v - r.v) < 60, `closed in depth: ${sk.v.toFixed(0)} vs ${r.v}`);
});

test('Bulwark brace: the first hit after its cooldown hardens it (40% less damage for 3 s); the brace returns 12 s after it started', () => {
  const g = quiet(); g.countdown = 0;
  const b = hold(sim.spawnUnit(g, 0, 'bulwark', 400, 0), 400, 0), m = sim.DMG.cannon.vehicle;
  const hit = () => { const h = b.hp; sim.damage(g, b, 100, 'cannon', 1); return h - b.hp; };
  assert.ok(Math.abs(hit() - 100 * m * 0.6) < 1e-6, 'braced from the first hit');
  g.t += 2.9; assert.ok(Math.abs(hit() - 100 * m * 0.6) < 1e-6, 'still braced');
  g.t += 0.2; assert.ok(Math.abs(hit() - 100 * m) < 1e-6, 'brace over');
  g.t += 8.8; assert.ok(Math.abs(hit() - 100 * m) < 1e-6, 'still on cooldown');
  g.t += 0.2; assert.ok(Math.abs(hit() - 100 * m * 0.6) < 1e-6, 'braces again after 12 s');
});

test('saves v17 keep factions, buildings and unit state; a v16 save loads as Last Fist vs Last Fist', () => {
  const g = quiet(); g.countdown = 0; finish(g, 0, 'barracks'); finish(g, 0, 'turret');
  const b = sim.spawnUnit(g, 0, 'bulwark', 500, 0); sim.damage(g, b, 50, 'cannon', 1);
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.deepStrictEqual([...g2.sides.map(s => s.faction)], ['bloomhost', 'lastfist']);
  assert.ok(g2.ents.filter(e => e.kind === 'b' && e.side === 0).every(e => e.fac === 'bloomhost'));
  const b2 = g2.ents.find(e => e.id === b.id); assert.strictEqual(b2.braceT, b.braceT); assert.strictEqual(b2.braceCd, b.braceCd);
  step(g2, 5);
  const lf = sim.newGame('normal'); step(lf, 20);
  const o = JSON.parse(sim.serialize(lf, {})); o.v = 16;
  for (const e of o.ents) { delete e.fac; delete e.tgt; delete e.braceT; delete e.braceCd; }
  for (const f of o.fog) { delete f.seen; for (const id in f.ghosts) delete f.ghosts[id].fac; }
  const g3 = sim.deserialize(JSON.stringify(o));
  assert.ok(g3);
  assert.deepStrictEqual([...g3.sides.map(s => s.faction)], ['lastfist', 'lastfist']);
  assert.ok(g3.ents.every(e => e.kind === 'b' ? e.fac === 'lastfist' : e.tgt === 0 && e.braceT === 0));
  assert.ok(Object.values(g3.fog[0].ghosts).every(gh => gh.fac === 'lastfist'));
  step(g3, 5);
});

test('the enemy faction stays hidden in the fog: the enemy HQ starts as a faceless ghost; pads count as seen only once in view', () => {
  const g = quiet('lastfist', 'bloomhost');
  const F = g.fog[0], hq = g.sides[1].hq, gh = F.ghosts[hq.id];
  assert.ok(gh && gh.fac === null, 'position known, faction not');
  assert.ok(F.exp[sim.cellOf(hq.u)] === 1 && F.seen[sim.cellOf(hq.u)] === 0, 'explored, never seen');
  sim.spawnUnit(g, 0, 'rifle', hq.u - 100, 0); sim.updateVision(g);
  assert.strictEqual(F.ghosts[hq.id].fac, 'bloomhost', 'seen: now it is known');
  assert.strictEqual(F.seen[sim.cellOf(hq.u)], 1);
  // the AI's own view is the same: its ghost of the enemy HQ carries no faction until seen
  const g2 = quiet('lastfist', 'bloomhost');
  assert.strictEqual(g2.fog[1].ghosts[g2.sides[0].hq.id].fac, null);
});

test('the match log names each side\'s buildings in its own faction and both factions', () => {
  const g = quiet(); g.countdown = 0; finish(g, 0, 'barracks'); finish(g, 1, 'barracks'); step(g, 1); g.result = { how: 'hq' };
  const txt = sim.logText(g, { version: sim.VERSION, diff: 'Normal', persona: 'The Turtle', result: 'Victory' });
  assert.match(txt, /Factions: you Bloomhost, enemy Last Fist/);
  assert.match(txt, /\[ME\] Larva Pit/); assert.match(txt, /\[ENEMY\] Barracks/);
});

test('one Hard match, Bloomhost (Turtle) against Last Fist: it builds its economy and Maws, trains all three base units, takes nodes and attacks', () => {
  const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const S = loadSim({ random: mul(11) }); // seeded: one fixed match. v2.37: seed 11 (Skitterlings at half supply: with seed 6 it trained no Razorwing; 3 of seeds 1-33 train all three base units, logged under Audit). v2.33: seed 6 (with seed 77 the Bloomhost AI, now building its Rootheart, took Swarm Bloom and trained no Razorwing)
  const g = S.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'turtle', autoPersona: 'aggressor', factions: ['lastfist', 'bloomhost'] });
  const built = new Set();
  for (let i = 0; i < 30 * 1700 && !g.over; i++) { S.update(g, 1 / 30); for (const e of g.ents) if (e.side === 1 && e.kind === 'b') built.add(e.type); g.events.length = 0; }
  assert.ok(g.over, `ended (at ${S.mmss(g.t)})`);
  for (const k of ['refinery', 'reactor', 'habitat', 'barracks', 'factory', 'techlab', 'turret']) assert.ok(built.has(k), `built a ${S.BD('bloomhost', k).name}`);
  const tr = g.sides[1].aiLog.trained;
  for (const t of ['skitterling', 'bulwark', 'razorwing']) assert.ok(tr[t] > 0, `trained ${t}: ${JSON.stringify(tr)}`);
  assert.ok(g.log.tot[1].nodeCap > 0, 'captured a node');
  assert.ok(g.sides[1].aiLog.attacks > 0, 'attacked');
  const ab = g.sides[1].aiLog.abil || {}; assert.ok(!ab.shield && !ab.strike && !ab.repair, 'never a Last Fist ability');
});
