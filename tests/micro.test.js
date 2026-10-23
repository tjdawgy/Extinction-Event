// Unit micro controls (v2.12): group and type orders, which order wins, newly trained units, Regroup (arrival, the
// flag, replacement), the global stance clearing orders, countdown and game-over blocking, saves, the AI's micro. SIM only.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const same = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);
function quiet() { // AI off, a small army of each group near home, holding
  const g = sim.newGame('normal');
  for (const s of [0, 1]) { g.sides[s].aiT = 1e9; g.sides[s].res.c = g.sides[s].res.e = 1e5; }
  g.t = 200;
  const u0 = sim.rallyU(0);
  const mk = (t, n) => Array.from({ length: n }, (_, i) => sim.spawnUnit(g, 0, t, u0 + i * 12, (i % 3 - 1) * 40));
  const army = { rifle: mk('rifle', 3), heavy: mk('heavy', 2), tank: mk('tank', 2), artillery: mk('artillery', 1), aircraft: mk('aircraft', 1) };
  sim.setStance(g, 0, 'hold');
  return { g, army, u0 };
}
const moved = (list, from) => list.every(u => Math.abs(u.u - from.get(u)) > 30);
const still = (list, from) => list.every(u => Math.abs(u.u - from.get(u)) < 3);
const snapshot = g => new Map(g.ents.filter(e => e.kind === 'u').map(e => [e, e.u]));

test('a type order moves only that type; a group order only that group; the rest keep the global stance', () => {
  const { g, army } = quiet();
  let at = snapshot(g);
  assert.ok(sim.giveOrder(g, 0, 'type', 'tank', 'attack').ok);
  step(g, 4);
  assert.ok(moved(army.tank, at), 'tanks advance');
  assert.ok(still([...army.rifle, ...army.heavy, ...army.artillery], at), 'everyone else holds');
  at = snapshot(g);
  assert.ok(sim.giveOrder(g, 0, 'group', 'inf', 'attack').ok);
  step(g, 4);
  assert.ok(moved([...army.rifle, ...army.heavy], at), 'infantry advance');
  assert.ok(still(army.artillery, at), 'artillery (Armor group, no order of its own) holds');
});

test('the most recent order wins where a group and a type order both cover a unit; a global stance clears them all', () => {
  const { g } = quiet(), S = g.sides[0];
  sim.giveOrder(g, 0, 'group', 'arm', 'retreat'); sim.giveOrder(g, 0, 'type', 'tank', 'attack');
  assert.strictEqual(sim.unitOrder(S, 'tank').o, 'attack', 'type order is newer');
  assert.strictEqual(sim.unitOrder(S, 'artillery').o, 'retreat', 'the group order still covers the others');
  sim.giveOrder(g, 0, 'group', 'arm', 'hold');
  assert.strictEqual(sim.unitOrder(S, 'tank').o, 'hold', 'the group order is newer now');
  sim.giveOrder(g, 0, 'all', null, 'move', 900, 0);
  assert.strictEqual(sim.unitOrder(S, 'rifle').o, 'move', 'a whole-army Regroup is the newest of all');
  sim.setStance(g, 0, 'attack');
  for (const t of Object.keys(sim.UDEF)) assert.strictEqual(sim.unitOrder(S, t), null, `${t}: back on the global stance`);
  same([S.orders.all, Object.keys(S.orders.groups), Object.keys(S.orders.types)], [null, [], []]);
});

test('newly trained units follow their type order, else their group order, else the global stance', () => {
  const g = sim.newGame('normal'), S = g.sides[0]; // a fresh game: room in the army
  for (const sd of g.sides) { sd.aiT = 1e9; sd.res.c = sd.res.e = 1e5; } g.t = 200; sim.setStance(g, 0, 'hold');
  for (const k of ['barracks', 'factory']) { sim.tryBuild(g, 0, k); for (const b of g.ents) if (b.type === k) { b.built = true; b.progress = 1; } }
  sim.giveOrder(g, 0, 'group', 'inf', 'attack'); sim.giveOrder(g, 0, 'type', 'rifle', 'retreat');
  const before = new Set(g.ents);
  assert.ok(sim.tryTrain(g, 0, 'rifle').ok); assert.ok(sim.tryTrain(g, 0, 'tank').ok);
  step(g, 25);
  const fresh = g.ents.filter(e => e.kind === 'u' && !before.has(e));
  const r = fresh.find(e => e.type === 'rifle'), t = fresh.find(e => e.type === 'tank');
  assert.ok(r && t, 'both trained');
  assert.strictEqual(sim.unitOrder(S, r.type).o, 'retreat', 'Rifleman: its type order');
  assert.strictEqual(sim.unitOrder(S, 'heavy').o, 'attack', 'Heavy: the Infantry order');
  assert.strictEqual(sim.unitOrder(S, t.type), null, 'Tank: the global stance (hold)');
  assert.ok(Math.abs(r.u - sim.rallyU(0)) < 115, `the new Rifleman goes to the rally flag (retreat): ${(r.u - sim.rallyU(0)).toFixed(0)}`); // each unit has its own spot up to 100 behind the flag
});

test('Regroup: units walk to the flag and hold there; the flag is done when all have arrived; a new order replaces it', () => {
  const { g, army, u0 } = quiet(), S = g.sides[0];
  assert.ok(sim.giveOrder(g, 0, 'group', 'arm', 'move', u0 + 400, 60).ok);
  const ord = S.orders.groups.arm;
  step(g, 2);
  assert.strictEqual(ord.done, false, 'still on the way');
  step(g, 30);
  assert.strictEqual(ord.done, true, 'all arrived: the flag goes');
  for (const u of [...army.tank, ...army.artillery]) assert.ok(Math.abs(u.u - (u0 + 400)) < 50 && Math.abs(u.v - 60) < 50, `${u.type} at the flag`);
  const at = snapshot(g); step(g, 5);
  assert.ok(still([...army.tank, ...army.artillery], at), 'they hold there');
  assert.ok(still(army.rifle, at), 'the infantry never moved');
  // replaced: a new Regroup for the same group takes over, the old flag is gone
  sim.giveOrder(g, 0, 'group', 'arm', 'move', u0 + 100, -40);
  assert.notStrictEqual(S.orders.groups.arm, ord);
  assert.strictEqual(S.orders.groups.arm.done, false);
  // a whole-army Regroup: everyone, the newest order
  sim.giveOrder(g, 0, 'all', null, 'move', u0 + 250, 0); step(g, 40);
  assert.strictEqual(S.orders.all.done, true);
  for (const u of g.ents.filter(e => e.kind === 'u' && e.side === 0)) assert.ok(Math.abs(u.u - (u0 + 250)) < 50, `${u.type} regrouped`);
});

test('no orders during GET READY or after the match; Regroup must target the battlefield', () => {
  const g = sim.newGame('normal', { countdown: 3 });
  assert.strictEqual(sim.giveOrder(g, 0, 'type', 'rifle', 'attack').msg, 'Wait for GO');
  assert.strictEqual(sim.giveOrder(g, 0, 'all', null, 'move', 500, 0).msg, 'Wait for GO');
  const { g: h } = quiet();
  assert.match(sim.giveOrder(h, 0, 'all', null, 'move', -50, 0).msg, /battlefield/);
  assert.match(sim.giveOrder(h, 0, 'group', 'navy', 'hold').msg, /Unknown/);
  h.over = true;
  assert.match(sim.giveOrder(h, 0, 'type', 'rifle', 'hold').msg, /over/);
});

test('save and resume mid-Regroup keep orders, the selection and the flag; a v11 save starts with no group orders', () => {
  const { g, u0 } = quiet(), S = g.sides[0];
  S.sel = 'g:arm';
  sim.giveOrder(g, 0, 'group', 'arm', 'move', u0 + 400, 0); sim.giveOrder(g, 0, 'type', 'rifle', 'attack');
  step(g, 2);
  const g2 = sim.deserialize(sim.serialize(g, {})), S2 = g2.sides[0];
  assert.strictEqual(S2.sel, 'g:arm');
  assert.strictEqual(S2.orders.groups.arm.o, 'move'); assert.strictEqual(S2.orders.groups.arm.done, false);
  assert.strictEqual(sim.unitOrder(S2, 'rifle').o, 'attack');
  step(g2, 30);
  assert.strictEqual(S2.orders.groups.arm.done, true, 'the Regroup finishes after loading');
  const o = JSON.parse(sim.serialize(g, {})); o.v = 11; for (const sd of o.sides) { delete sd.orders; delete sd.sel; }
  const g3 = sim.deserialize(JSON.stringify(o));
  assert.ok(g3 && g3.sides.every(sd => sd.sel === null && !sd.orders.all && !Object.keys(sd.orders.groups).length && !Object.keys(sd.orders.types).length));
  step(g3, 1); // and it plays on
});

test('orders are in the match log; the AI pulls its Artillery back when enemies it can see come close, then lets it go', () => {
  const { g } = quiet();
  sim.giveOrder(g, 0, 'type', 'tank', 'attack');
  const e = g.log.ev.at(-1);
  assert.strictEqual(e[2], 'O');
  assert.strictEqual(sim.logEvText(e, true), 'Order: Tanks attack');
  // AI micro (side 1, Normal): Artillery under threat gets a retreat order, counted in the log, then cleared once safe
  const h = sim.newGame('normal'); h.sides[0].aiT = 1e9; h.t = 300;
  const a = sim.spawnUnit(h, 1, 'artillery', 1500, 0), foe = sim.spawnUnit(h, 0, 'rifle', 1420, 0);
  foe.holdU = foe.u; foe.holdV = 0; sim.updateVision(h);
  sim.aiMicro(h, 1, sim.DIFF.normal, [a]);
  assert.strictEqual(sim.unitOrder(h.sides[1], 'artillery').o, 'retreat');
  assert.strictEqual(h.log.tot[1].micro, 1);
  assert.ok(!h.log.ev.some(x => x[2] === 'O'), 'counted, not listed');
  sim.kill(h, foe, 1); h.t += 7; sim.updateVision(h);
  sim.aiMicro(h, 1, sim.DIFF.normal, [a]);
  assert.strictEqual(sim.unitOrder(h.sides[1], 'artillery'), null, 'released');
  sim.aiMicro(h, 1, sim.DIFF.easy, [a]); // Easy never micros
  assert.strictEqual(sim.unitOrder(h.sides[1], 'artillery'), null);
});
