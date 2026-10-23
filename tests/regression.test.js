// Regression checklist from CLAUDE.md, tested on the SIM headlessly
const test = require('node:test');
const assert = require('node:assert');
const { loadSim, readHtml } = require('./load-sim');

const sim = loadSim();
const STEP = 1 / 30;
const run = (g, sec) => { for (let i = Math.round(sec / STEP); i > 0; i--) sim.update(g, STEP); };
function base(types = ['barracks']) { // a quiet game with finished buildings for side 0
  const g = sim.newGame('normal'); g.sides[1].aiT = 1e9;
  g.sides[0].res.c = g.sides[0].res.e = 1e5;
  for (const t of types) assert.ok(sim.tryBuild(g, 0, t).ok);
  run(g, 30);
  return g;
}
const find = (g, type, s = 0) => g.ents.find(e => e.kind === 'b' && e.side === s && e.type === type);

test('sell refunds 50% of everything spent, queued units in full; the HQ cannot be sold', () => {
  const g = base(['barracks', 'refinery']), side = g.sides[0];
  const ref = find(g, 'refinery');
  let c0 = side.res.c;
  assert.ok(sim.trySell(g, 0, ref).ok);
  assert.strictEqual(side.res.c - c0, 75, 'Refinery 150 → 75');
  assert.strictEqual(sim.SELL_RATE, 0.5);
  const b = find(g, 'barracks');
  assert.ok(sim.tryUpgrade(g, 0, b).ok); run(g, 15); // T2: +150 credits, +50 energy
  assert.ok(sim.tryTrain(g, 0, 'rifle').ok && sim.tryTrain(g, 0, 'rifle').ok);
  c0 = side.res.c; const e0 = side.res.e;
  assert.ok(sim.trySell(g, 0, b).ok);
  assert.strictEqual(side.res.c - c0, 150 + 100, '(150 + 150) / 2 + two queued Riflemen');
  assert.strictEqual(side.res.e - e0, 25);
  assert.strictEqual(side.slots.filter(Boolean).length, 0, 'pad is free again');
  assert.ok(!sim.trySell(g, 0, side.hq).ok);
});

test('paid repair costs 30% of missing HP and heals 6%/s', () => {
  const g = base(), side = g.sides[0], b = find(g, 'barracks');
  b.hp = b.maxHp * 0.5; b.lastHit = g.t;
  const c0 = side.res.c, cost = sim.repairCost(b);
  assert.strictEqual(cost, Math.ceil(b.maxHp * 0.5 * 0.3));
  assert.ok(sim.tryRepair(g, 0, b).ok);
  assert.strictEqual(c0 - side.res.c, cost);
  assert.ok(!sim.tryRepair(g, 0, b).ok, 'cannot pay twice for the same damage');
  run(g, 1);
  assert.ok(Math.abs(b.hp - b.maxHp * 0.56) < b.maxHp * 0.01, `~6%/s (${b.hp})`);
  run(g, 8);
  assert.strictEqual(b.hp, b.maxHp); assert.strictEqual(b.repair, 0);
});

test('self-repair starts 8s after the last hit at 1%/s', () => {
  const g = base(), b = find(g, 'barracks');
  b.hp = b.maxHp * 0.5; b.lastHit = g.t;
  run(g, sim.REGEN_DELAY - 0.5);
  assert.strictEqual(b.hp, b.maxHp * 0.5, 'nothing during the delay');
  run(g, 2.5);
  const healed = b.hp / b.maxHp - 0.5;
  assert.ok(healed > 0.015 && healed < 0.025, `about 2 s × 1% (${healed})`);
});

test('field node: one ground unit captures in 12.5s and adds +3 credits / +1 energy per second', () => {
  const g = sim.newGame('normal'); g.sides[1].aiT = 1e9;
  const n = g.nodes[1], inc0 = sim.income(g, 0);
  sim.spawnUnit(g, 0, 'rifle', n.u, 0); sim.setStance(g, 0, 'hold');
  run(g, 12);
  assert.strictEqual(n.owner, null, 'not yet');
  run(g, 1);
  assert.strictEqual(n.owner, 0);
  const inc1 = sim.income(g, 0);
  assert.deepStrictEqual([inc1.c - inc0.c, inc1.e - inc0.e], [sim.NODE_INC.c, sim.NODE_INC.e]);
  // contested: an enemy in the zone stops progress either way
  n.prog = 50; n.owner = null;
  sim.spawnUnit(g, 1, 'rifle', n.u + 10, 0);
  run(g, 1);
  assert.strictEqual(n.prog, 50);
});

test('HQ shield: no damage while another building stands, normal damage once they are gone', () => {
  const g = base(['refinery']), hq = g.sides[0].hq;
  assert.strictEqual(hq.shielded, true);
  sim.damage(g, hq, 500, 'cannon', 1);
  assert.strictEqual(hq.hp, hq.maxHp, 'shielded');
  sim.kill(g, find(g, 'refinery'), 1); run(g, STEP);
  assert.strictEqual(hq.shielded, false);
  assert.ok(g.events.some(e => e.type === 'shieldDown' && e.side === 0));
  sim.damage(g, hq, 500, 'cannon', 1);
  assert.strictEqual(hq.hp, hq.maxHp - 650, '500 × 1.3 cannon vs building');
});

test('stances: Attack advances, Hold stays put, Retreat returns to the rally flag', () => {
  const g = sim.newGame('normal'); g.sides[1].aiT = 1e9;
  const us = [0, 1, 2].map(i => sim.spawnUnit(g, 0, 'rifle', 560 + i * 10, 0));
  sim.setStance(g, 0, 'attack'); run(g, 3);
  assert.ok(us.every((u, i) => u.u > 560 + i * 10 + 90), 'moved forward ~38/s');
  sim.setStance(g, 0, 'hold'); const held = us.map(u => u.u); run(g, 3);
  assert.deepStrictEqual(us.map(u => u.u), held);
  sim.setStance(g, 0, 'retreat'); run(g, 6);
  assert.ok(us.every(u => Math.abs(u.u - sim.rallyU(0)) < 110), 'back at the rally flag');
  assert.ok(us.every((u, i) => u.u < held[i]));
});

test('acquire() skips targets the weapon cannot damage: a Turret never locks onto a building', () => {
  const g = base(['turret']), tur = find(g, 'turret');
  g.sides[1].res.c = g.sides[1].res.e = 1e5;
  assert.ok(sim.tryBuild(g, 1, 'refinery').ok);
  const ref = find(g, 'refinery', 1);
  ref.u = tur.u + 120; ref.v = tur.v; // well inside gatling range
  g.sides[0].hq.u = -5000; // move our HQ gun out of the picture
  const hp0 = ref.hp;
  run(g, 2);
  assert.strictEqual(tur.aim, null, 'Turret never aimed at the building');
  assert.strictEqual(g.projs.length, 0);
  assert.ok(ref.hp >= hp0);
  sim.spawnUnit(g, 1, 'rifle', tur.u + 150, tur.v);
  run(g, 1);
  assert.ok(tur.aim && Math.abs(tur.aim.u - (tur.u + 150)) < 60, 'it still shoots units');
});

test('Nanoweave description matches what it does (units and defenses)', () => {
  assert.strictEqual(sim.BDEF.techlab.tiers[3], 'Nanoweave: your units and defenses deal 20% more damage and take 15% less');
});

test('save keys stay colonyMobile.save and colonyMobile.diff (plus the separate sound key); save format is v12 and still reads v5–v11', () => {
  const html = readHtml();
  assert.match(html, /const SAVE_KEY = 'colonyMobile\.save';/);
  assert.match(html, /localStorage\.getItem\('colonyMobile\.diff'\)/);
  assert.match(html, /localStorage\.setItem\('colonyMobile\.diff', diffKey\)/);
  const keys = new Set([...html.matchAll(/localStorage\.\w+Item\(([^,)]+)/g)].map(m => m[1].trim()));
  assert.deepStrictEqual([...keys].sort(), ["'colonyMobile.diff'", 'SAVE_KEY', 'SOUND_KEY']); // v2.4 adds only the sound setting
  assert.match(html, /const SOUND_KEY = 'extinctionEvent\.sound';/);
  assert.strictEqual(sim.SAVE_VER, 12);
  assert.deepStrictEqual([...sim.SAVE_OK], [5, 6, 7, 8, 9, 10, 11, 12]);
  const o = JSON.parse(sim.serialize(sim.newGame('easy'), {}));
  assert.strictEqual(o.v, 12);
  assert.deepStrictEqual(Object.keys(o).sort(), ['abil', 'diffKey', 'endHold', 'ents', 'extra', 'fog', 'log', 'nid', 'nodes', 'projs', 'sides', 't', 'v']);
});

test('old or broken saves never load into a bad state', () => {
  const g = sim.newGame('normal');
  const o = JSON.parse(sim.serialize(g, {}));
  assert.strictEqual(sim.deserialize(JSON.stringify({ ...o, v: 4 })), null, 'v4 and older rejected');
  assert.strictEqual(sim.deserialize(JSON.stringify({ ...o, sides: o.sides.map(s => ({ ...s, hq: 99999 })) })), null, 'missing HQ rejected');
  assert.throws(() => sim.deserialize('{not json'), 'garbage throws; resumeGame() and peekSave() wrap it in try/catch');
  assert.match(readHtml(), /try \{ g = deserialize\(localStorage\.getItem\(SAVE_KEY\)\); \} catch \(e\) \{ g = null; \}/);
});

test('v2.11: spamming construction starts never shields the HQ: only finished buildings count', () => {
  const g = sim.newGame('normal'); for (const s of [0, 1]) g.sides[s].aiT = 1e9;
  g.sides[0].res.c = g.sides[0].res.e = 1e5;
  for (let i = 0; i < 6; i++) sim.tryBuild(g, 0, 'habitat');
  sim.update(g, 1 / 30);
  const hq = g.sides[0].hq;
  assert.strictEqual(hq.shielded, false, 'six buildings under construction: no shield');
  const hp = hq.hp; sim.damage(g, hq, 500, 'cannon', 1); assert.ok(hq.hp < hp, 'the HQ takes damage');
  for (let i = 0; i < 30 * 9; i++) sim.update(g, 1 / 30); // a Habitat takes 8 s
  assert.strictEqual(hq.shielded, true, 'once one is finished the shield is up');
});
