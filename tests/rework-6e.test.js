// v2.95 (batch 6e, docs/FACTION_REWORK.md "Batch 6e"): Axiarch lane play (REWORK.b6elane) and the Axiarch energy costs
// (REWORK.b6e), src/sim/rework-6e.js. Fingerprints (FP_V295A, FP_V295) are in tests/determinism.test.js.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { loadSim } = require('./load-sim');
const sim = loadSim();
const J = x => x === undefined ? x : JSON.parse(JSON.stringify(x));
const same = (a, b, m) => assert.deepStrictEqual(J(a), J(b), m);
const game = (rework, o = {}) => sim.newGame(o.diff || 'hard', Object.assign({ seed: 5, factions: ['axiarchs', 'lastfist'], rework }, o));
const AX = Object.keys(sim.UDEF).filter(t => sim.UDEF[t].fac === 'axiarchs' && sim.UDEF[t].cost && sim.UDEF[t].cost.c + sim.UDEF[t].cost.e > 0);

test('b6elane and b6e are on by default, saved per game, and left out of a save when off', () => {
  const r = sim.rwInit(); assert.ok(r.b6elane && r.b6e);
  const on = JSON.parse(sim.serialize(game(), {})), off = JSON.parse(sim.serialize(game({ b6elane: false, b6e: false, b6fai: false, b6f: false, b6g: false }), {}));
  assert.ok(on.rw.b6elane && on.rw.b6e);
  assert.ok(!('b6elane' in off.rw) && !('b6e' in off.rw), 'an off save is a v2.94 save');
  const b = sim.deserialize(JSON.stringify(off)); assert.ok(!b.rw.b6elane && !b.rw.b6e);
  const c = sim.deserialize(JSON.stringify(on)); assert.ok(c.rw.b6elane && c.rw.b6e);
  const old = Object.assign({}, on); old.rw = Object.assign({}, on.rw); delete old.rw.b6elane; delete old.rw.b6e; // a v2.94 save
  const d = sim.deserialize(JSON.stringify(old)); assert.ok(!d.rw.b6elane && !d.rw.b6e, 'a v2.94 save resumes with both off');
});

test('b6e (b6f off): every Axiarch unit keeps its total cost, energy at most 20% of it (rounded to 5); the Shardling unchanged; the Marine 48 (Part C); other units unchanged', () => {
  const on = game({ b6f: false, b6g: false }) /* v2.96: b6f undoes the conversion (tests/rework-6f.test.js) */, off = game({ b6e: false, b6fai: false, b6f: false, b6g: false });
  for (const t of AX) {
    const a = sim.UDEF[t].cost, b = sim.rwD(on, t).cost;
    assert.strictEqual(b.c + b.e, a.c + a.e, `${t}: total kept`);
    assert.ok(b.e <= Math.round(0.2 * (a.c + a.e) / 5) * 5 && b.e <= a.e, `${t}: energy ${b.e} of ${a.c + a.e}`);
    same(sim.rwD(off, t).cost, a, `${t}: off is v2.94's cost`);
    same(sim.trainCost(on, t), b); same(sim.trainCost(off, t), a);
  }
  same(sim.rwD(on, 'shardling').cost, sim.UDEF.shardling.cost, 'the Shardling (19% energy) is unchanged');
  for (const t of ['tank', 'heavy', 'bulwark', 'spitter']) same(sim.rwD(on, t).cost, sim.UDEF[t].cost, t);
  same(sim.rwD(on, 'rifle').cost, { c: 48, e: 0 }, 'Part C: the Marine 48 credits'); same(sim.rwD(off, 'rifle').cost, sim.UDEF.rifle.cost, 'off: 45');
  same(sim.trainCost(on, 'rifle'), { c: 48, e: 0 });
  same(J(sim.B6E.cost.lancer), { c: 130, e: 35 }); same(J(sim.UDEF.lancer.cost), { c: 120, e: 45 }, 'UDEF untouched');
});

test('b6e (b6f off): training, refunds, echoes and the Codex use the converted price', () => {
  sim.REWORK.b6f = false; sim.REWORK.b6g = false; // v2.96: b6f undoes the conversion (tests/rework-6f.test.js); restored at the end
  const g = game(undefined, { seed: 7 }); g.countdown = 0;
  const s = 0, side = g.sides[s];
  sim.tryBuild(g, s, 'barracks'); for (const e of g.ents) if (e.kind === 'b' && e.side === s) { e.built = true; e.hp = e.maxHp; }
  for (const e of g.ents) if (e.kind === 'b' && e.side === s && e.type === 'barracks') { e.tier = 2; e.path = 'A'; }
  side.res.c = 5000; side.res.e = 5000;
  const t = sim.UNIT_ORDER.find(x => sim.UDEF[x].fac === 'axiarchs' && sim.UDEF[x].from === 'barracks' && sim.B6E.cost[x] && sim.canTrain && sim.tryTrain(J(g) && g, s, x).ok);
  assert.ok(t, 'an Axiarch Barracks unit with a converted cost trains');
  const k = sim.B6E.cost[t];
  assert.strictEqual(5000 - side.res.c, k.c); assert.strictEqual(5000 - side.res.e, k.e);
  const b = g.ents.find(e => e.kind === 'b' && e.side === s && e.queue && e.queue.length);
  const c0 = side.res.c, e0 = side.res.e, sv = sim.sellValue(b); sim.trySell(g, s, b); sim.trySell(g, s, b);
  assert.strictEqual(side.res.c - c0 - sv.c, k.c, 'a sold queue refunds the converted credits'); assert.strictEqual(side.res.e - e0 - sv.e, k.e);
  same(sim.echoCost('lancer', g), { c: 65, e: 18 }); same(sim.echoCost('lancer', game({ b6e: false, b6fai: false, b6f: false, b6g: false })), { c: 60, e: 23 }, 'off: half v2.94\'s');
  same(sim.rwShow(null, 'lancer').cost, sim.B6E.cost.lancer, 'the Codex shows the new-game default');
  same(sim.rwShow(game({ b6e: false, b6fai: false, b6f: false, b6g: false }), 'lancer').cost, sim.UDEF.lancer.cost, 'an info card shows its game\'s price');
  sim.REWORK.b6e = false; same(sim.rwShow(null, 'lancer').cost, sim.UDEF.lancer.cost); same(sim.rwShow(null, 'riftstalker').shp, 110); sim.REWORK.b6e = true;
  same(sim.rwShow(null, 'riftstalker').shp, 160, 'the Codex shows the Riftstalker\'s batch 6e shields'); same(sim.rwShow(null, 'rifle').cost, { c: 48, e: 0 });
  sim.REWORK.b6f = true;
});

test('b6e: a Riftstalker spawns with 160 shields (110 off); a Marine order costs 48', () => {
  const g = game(), g0 = game({ b6e: false, b6fai: false, b6f: false, b6g: false });
  assert.strictEqual(sim.spawnUnit(g, 0, 'riftstalker', 300, 0).maxShp, 160); assert.strictEqual(sim.spawnUnit(g0, 0, 'riftstalker', 300, 0).maxShp, 110);
  const h = sim.newGame('hard', { seed: 3, factions: ['lastfist', 'axiarchs'] }); h.countdown = 0;
  sim.tryBuild(h, 0, 'barracks'); for (const e of h.ents) if (e.kind === 'b' && e.side === 0) { e.built = true; e.hp = e.maxHp; }
  const c0 = h.sides[0].res.c; assert.ok(sim.tryTrain(h, 0, 'rifle').ok); assert.strictEqual(c0 - h.sides[0].res.c, 48);
});

const hashRun = (rework, map, secs, fac = ['axiarchs', 'lastfist']) => {
  const s2 = loadSim({ random: (() => { let a = 99; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })() });
  const g = s2.newGame('hard', { seed: 11, map, autoPlayer: true, autoDiff: 'hard', factions: fac, rework }); g.countdown = 0;
  for (let i = 0; i < 60 * secs && !g.over; i++) { s2.update(g, s2.TICK); g.events.length = 0; }
  const o = JSON.parse(s2.serialize(g, {})); delete o.log; delete o.stats; delete o.rw;
  return { h: crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex'), g, s2 };
};

test('b6elane: Classic plays exactly as with it off (it acts on lane maps only)', () => {
  assert.strictEqual(hashRun({ b6e: false, b6fai: false, b6f: false, b6g: false }, 'classic', 240).h, hashRun({ b6e: false, b6fai: false, b6f: false, b6g: false, b6elane: false }, 'classic', 240).h);
});

test('b6elane: on Two-Lane the Axiarch AI holds one focus lane, its new units go there, its warp point stands beside the army; Last Fist is untouched', () => {
  const { g, s2 } = hashRun(undefined, 'twolane', 420);
  const sd = g.sides[0]; assert.ok(sd.la && (sd.la.fc === 0 || sd.la.fc === 1), 'a focus lane');
  if (sd.stance !== 'attack' || (sd.pushMode !== 'all' && sd.pushMode !== 'siege')) assert.strictEqual(sd.laneNew, sd.la.fc, 'new units take the focus lane');
  const busy = new Set([sd.scoutId, ...(sd.capT ? sd.capT.ids : []), ...(sd.raid ? sd.raid.ids : [])]);
  const army = g.ents.filter(e => e.kind === 'u' && e.side === 0 && e.hp > 0 && !busy.has(e.id) && !s2.UDEF[e.type].support && e.lane != null);
  const off = army.filter(u => u.lane !== sd.la.fc);
  assert.ok(army.length >= 4, `an army (${army.length})`);
  assert.ok(off.length <= 1, `at most a one-unit screen on the other lane (${off.length})`);
  if (sd.warp) { assert.ok(s2.onField(g, 0, sd.warp.u, sd.warp.v), 'the warp point is on its field'); assert.strictEqual(s2.laneOfPt(sd.warp.u, sd.warp.v), sd.la.fc, 'on the focus lane'); }
  assert.ok(!g.sides[1].la || g.sides[1].la.fc === undefined, 'Last Fist never takes a focus lane');
  assert.ok(g.sides[1].end6e === undefined);
  assert.strictEqual(s2.lane6eEnd(g, 0), s2.hqU(1) + s2.LANE6E.past, 'a base attack ends just past the enemy HQ');
});

test('b6elane off: a Two-Lane match never sets a focus lane, warp point or attack end', () => {
  const { g } = hashRun({ b6elane: false }, 'twolane', 300);
  for (const sd of g.sides) { assert.ok(!sd.la || sd.la.fc === undefined); assert.ok(sd.end6e === undefined); assert.ok(!sd.warp); }
});
