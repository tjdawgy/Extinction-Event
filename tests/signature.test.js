// Signature buildings, batch 1 (v2.32, docs/SIGNATURE_BUILDINGS.md sections 1, 2 and 5): the shared rules (one of each at a
// time, rebuild after a loss, no supply, Salvage only on what was paid), the Last Fist Salvage Yard (20%, T2 cap ×2 plus
// energy, T3 Overdrive) and Fortification Depot (node bunkers, the 45 s rebuild, the T2 heal, the T3 anti-air gun), the
// minimal AI, and saves v28. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim(); sim.setBalance(false); // v2.39: these tests pin the mechanic at its own numbers (v2.30 Salvage, v2.32 Yard and unit costs); the balance pass values are pinned in tests/salvage.test.js
const U = sim.UDEF, B = sim.BDEF, S = sim.SALVAGE, Y = sim.YARD, MID = sim.L / 2;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'lastfist', f1 = 'bloomhost') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; g.t = 30; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; e.cd = 1e6; return e; };
const seeAll = g => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } };
const fin = (g, s, type) => { const r = sim.tryBuild(g, s, type); assert.ok(r.ok, r.msg); const b = g.ents.filter(e => e.side === s && e.type === type).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };
const tier = (b, t) => { b.tier = t; };
const bunkers = (g, s = 0) => g.ents.filter(e => e.type === 'bunker' && e.side === s && e.hp > 0);
const hold = (g, n, s = 0) => { g.nodes[n].owner = s; g.nodes[n].prog = s === 0 ? 100 : -100; };

test('the signature buildings: Barracks cost, build time, HP and upgrade costs; Last Fist (v2.32), Bloomhost (v2.33) and the Axiarchs (v2.34); Build order lists both', () => {
  for (const k of ['sigA', 'sigB']) {
    assert.deepStrictEqual([B[k].cost, B[k].time, B[k].hp, B[k].half, B[k].up], [B.barracks.cost, B.barracks.time, B.barracks.hp, B.barracks.half, B.barracks.up], k);
    assert.ok(B[k].sig && !B[k].pop && !B[k].inc && !B[k].gun, `${k}: no supply, no income, no gun of its own`);
    assert.ok(sim.BUILD_ORDER.includes(k));
    assert.ok(sim.BD('bloomhost', k).sig, 'Bloomhost has its own (v2.33)'); assert.ok(sim.BD('axiarchs', k).sig, 'the Axiarchs theirs (v2.34)');
  }
  assert.deepStrictEqual([B.sigA.name, B.sigB.name], ['Salvage Yard', 'Fortification Depot']);
  const g = quiet('bloomhost', 'axiarchs');
  assert.strictEqual(sim.tryBuild(g, 0, 'sigA').ok, true); assert.strictEqual(sim.tryBuild(g, 1, 'sigB').ok, true); // every faction has both since v2.34
  sim.SIG.on = false; try { assert.strictEqual(sim.tryBuild(quiet(), 0, 'sigA').ok, false, 'SIG.on false: none'); } finally { sim.SIG.on = true; }
  assert.strictEqual(sim.tryBuild(quiet(), 0, 'bunker').ok, false, 'bunkers are never built by hand');
});

test('only one of each at a time ("already built"), both at once is fine; a destroyed or sold one can be rebuilt and starts at T1; 8 pads', () => {
  const g = quiet();
  assert.ok(sim.tryBuild(g, 0, 'sigA').ok);
  assert.match(sim.tryBuild(g, 0, 'sigA').msg, /already built/, 'under construction counts');
  assert.ok(sim.tryBuild(g, 0, 'sigB').ok, 'A and B are not exclusive');
  const y = g.ents.find(e => e.type === 'sigA'); y.built = true; tier(y, 3);
  assert.match(sim.tryBuild(g, 0, 'sigA').msg, /already built/);
  sim.kill(g, y, 1); step(g, 0.1);
  const r = sim.tryBuild(g, 0, 'sigA'); assert.ok(r.ok, r.msg);
  assert.strictEqual(g.ents.find(e => e.type === 'sigA' && e.hp > 0).tier, 1, 'rebuilt at T1');
  const d = g.ents.find(e => e.type === 'sigB'); d.built = true;
  assert.ok(sim.trySell(g, 0, d).ok); assert.ok(sim.tryBuild(g, 0, 'sigB').ok, 'sold, then rebuilt');
  assert.strictEqual(g.sides[0].slots.length, 8);
  assert.strictEqual(sim.popUsed(g, 0), 0, 'no supply');
});

test('Salvage Yard T1: Salvage rises from 10% to 20%; T2 doubles the per-minute cap and returns half as much energy; lost, back to base', () => {
  const g = quiet(); seeAll(g); put(g, 0, 'rifle', MID);
  const kill = t => { const f = put(g, 1, t, MID + 60); const c0 = g.sides[0].res.c, e0 = g.sides[0].res.e; sim.kill(g, f, 0); return [g.sides[0].res.c - c0, g.sides[0].res.e - e0]; };
  assert.deepStrictEqual(kill('bulwark'), [Math.round(190 * 0.1), 0], 'no Yard: 10%');
  const y = fin(g, 0, 'sigA');
  assert.strictEqual(Y.pct, 0.2);
  assert.deepStrictEqual(kill('bulwark'), [38, 0], 'T1: 20%');
  g.sides[0].salv.n = S.cap - 10; assert.deepStrictEqual(kill('bulwark'), [10, 0], 'T1: the base cap of 200 still binds');
  tier(y, 2); assert.deepStrictEqual(kill('bulwark'), [38, 19], 'T2: cap 400, and energy worth half the credits');
  g.sides[0].salv.n = S.cap * Y.cap - 5; assert.deepStrictEqual(kill('bulwark'), [5, 2.5], 'T2: the doubled cap binds at 400');
  sim.kill(g, y, 1); g.sides[0].salv.n = 0;
  assert.deepStrictEqual(kill('bulwark'), [19, 0], 'the Yard destroyed: 10% again');
  const y2 = fin(g, 0, 'sigA'); tier(y2, 2); assert.ok(sim.trySell(g, 0, y2).ok);
  g.sides[0].salv.n = S.cap - 1; assert.deepStrictEqual(kill('bulwark'), [1, 0], 'sold: the base cap again');
});

test('Salvage counts only what was paid: temporary units, units carrying a paid price of 0 and bunkers give nothing, Yard or not', () => {
  const g = quiet(); seeAll(g); put(g, 0, 'rifle', MID); const y = fin(g, 0, 'sigA'); tier(y, 3);
  const brood = put(g, 1, 'skitterling', MID + 50); brood.temp = g.t + 20; brood.tSrc = 'brood'; sim.kill(g, brood, 0);
  const kid = put(g, 1, 'needlewing', MID + 50); kid.temp = g.t + 12; kid.tSrc = 'spawn'; sim.kill(g, kid, 0);
  const free = put(g, 1, 'bulwark', MID + 50); free.paid = 0; sim.kill(g, free, 0);
  const own = put(g, 0, 'tank', MID + 30); own.temp = g.t + 5; sim.kill(g, own, 1);
  assert.strictEqual(sim.paidOf(brood), 0); assert.strictEqual(sim.paidOf(put(g, 1, 'bulwark', 1500)), U.bulwark.cost.c);
  // a bunker is a building: never salvaged
  fin(g, 0, 'sigB'); hold(g, 1); step(g, 0.1); const bk = bunkers(g)[0]; assert.ok(bk); sim.kill(g, bk, 1);
  assert.strictEqual(g.sides[0].salv.tot, 0, 'nothing salvaged from any of them'); assert.strictEqual(g.fx.filter(f => f.k === 'scrap').length, 0, 'no pop-ups');
  assert.strictEqual(g.sides[0].od, 0, 'and no Overdrive from them');
  sim.kill(g, put(g, 1, 'bulwark', MID + 50), 0); assert.strictEqual(g.sides[0].salv.tot, 38, 'a paid unit still gives its 20%');
});

test('Overdrive (Yard T3): overflow starts +25% production for 20 s; new overflow restarts the timer, never stacks above +25%; it expires', () => {
  const g = quiet(); seeAll(g); put(g, 0, 'rifle', MID); const y = fin(g, 0, 'sigA'); fin(g, 0, 'barracks'); const fac = fin(g, 0, 'factory');
  const overflow = () => { const S0 = g.sides[0].salv; S0.m = Math.floor(g.t / S.per); S0.n = S.cap * Y.cap; sim.kill(g, put(g, 1, 'bulwark', MID + 40), 0); };
  tier(y, 2); overflow(); assert.strictEqual(g.sides[0].od, 0, 'T2: overflow is simply lost');
  tier(y, 3); overflow();
  assert.ok(Math.abs(g.sides[0].od - (g.t + Y.odDur)) < 1e-9 && sim.overdrive(g, 0));
  // production: a Tank (11 s) is 25% faster
  assert.ok(sim.tryTrain(g, 0, 'tank').ok);
  step(g, 1); const p1 = fac.prodT; assert.ok(Math.abs(p1 - 1.25) < 0.02, `prodT after 1 s: ${p1}`);
  step(g, 4); overflow(); const t1 = g.t; overflow();
  assert.ok(Math.abs(g.sides[0].od - (t1 + Y.odDur)) < 1e-9, 'refreshed to 20 s from now, not added up');
  const p2 = fac.prodT; step(g, 1); assert.ok(Math.abs(fac.prodT - p2 - 1.25) < 0.02 || fac.queue.length === 0, 'still +25%, never more');
  step(g, Y.odDur + 0.5); assert.ok(!sim.overdrive(g, 0), 'expired');
  assert.ok(sim.tryTrain(g, 0, 'tank').ok); const p3 = fac.prodT; step(g, 1); assert.ok(Math.abs(fac.prodT - p3 - 1) < 0.02, 'normal speed again');
  overflow(); assert.ok(sim.overdrive(g, 0)); sim.kill(g, y, 1); assert.ok(!sim.overdrive(g, 0), 'the Yard lost: no Overdrive');
  // an enemy's production is never affected
  const h = quiet('bloomhost', 'lastfist'); h.sides[0].od = h.t + 20; assert.ok(!sim.overdrive(h, 0));
});

test('a bunker appears when a node is captured (and at once on nodes already held when the Depot finishes); a node changing owner destroys it', () => {
  const g = quiet(); seeAll(g); hold(g, 0);
  const d = fin(g, 0, 'sigB'); d.built = false; d.progress = 0.5; step(g, 0.1);
  assert.strictEqual(bunkers(g).length, 0, 'not while the Depot is under construction');
  d.progress = 1; step(g, 0.1);
  assert.strictEqual(bunkers(g).length, 1, 'the held node gets one at once');
  const b0 = bunkers(g)[0]; assert.strictEqual(b0.node, 0); assert.strictEqual(b0.slot, -1, 'no pad'); assert.strictEqual(b0.maxHp, B.turret.hp / 2);
  // capture the middle node with Riflemen: the bunker appears the moment it is taken
  const n = g.nodes[1]; for (let i = 0; i < 3; i++) put(g, 0, 'rifle', n.u + i * 5, i * 10);
  let seen = false; for (let i = 0; i < 30 * 20 && !seen; i++) { sim.update(g, 1 / 30); if (n.owner === 0) { seen = true; assert.ok(bunkers(g).some(b => b.node === 1), 'placed the same tick'); } }
  assert.ok(seen, 'node captured');
  // the enemy retakes it: as soon as the owner changes (to neutral first), the bunker is gone
  for (const e of g.ents) if (e.kind === 'u' && e.side === 0) e.hp = 0;
  for (let i = 0; i < 4; i++) put(g, 1, 'skitterling', n.u + i * 5, i * 10);
  let gone = false; for (let i = 0; i < 30 * 40 && !gone; i++) { sim.update(g, 1 / 30); if (n.owner !== 0) { gone = true; assert.ok(!bunkers(g).some(b => b.node === 1), 'destroyed with the change'); } }
  assert.ok(gone, 'node lost');
  assert.strictEqual(g.sides[0].slots.filter(Boolean).length, 1, 'bunkers never take a pad');
});

test('a destroyed bunker is rebuilt after 45 s only while the node is still held; the Depot lost or sold destroys every bunker', () => {
  const g = quiet(); seeAll(g); hold(g, 0); hold(g, 2); const d = fin(g, 0, 'sigB'); step(g, 0.1);
  assert.strictEqual(bunkers(g).length, 2);
  const at = b => bunkers(g).find(x => x.node === b);
  sim.kill(g, at(0), 1); step(g, sim.BUNKER.rebuild - 1); assert.ok(!at(0), 'not before 45 s');
  step(g, 1.2); assert.ok(at(0), 'back after 45 s');
  sim.kill(g, at(2), 1); step(g, 10); hold(g, 2, 1); step(g, sim.BUNKER.rebuild); assert.ok(!at(2), 'node lost meanwhile: never rebuilt');
  hold(g, 2, 0); step(g, 0.1); assert.ok(at(2), 'retaken: placed at once');
  sim.kill(g, d, 1); step(g, 0.1); assert.strictEqual(bunkers(g).length, 0, 'the Depot destroyed: all bunkers go');
  const d2 = fin(g, 0, 'sigB'); step(g, 0.1); assert.strictEqual(bunkers(g).length, 2, 'a new Depot places them again');
  assert.ok(sim.trySell(g, 0, d2).ok); step(g, 0.1); assert.strictEqual(bunkers(g).length, 0, 'sold: all bunkers go');
});

test('bunkers: half a T1 Turret, ground only; Depot T3 doubles damage and hits aircraft; T2 heals Barracks units 2%/s in range; no HQ shield, no selling', () => {
  const G = B.bunker.gun;
  assert.deepStrictEqual([G[1].dmg, G[1].hitsAir, G[2].dmg, G[3].dmg, G[3].hitsAir, G[1].range], [B.turret.gun[1].dmg / 2, false, B.turret.gun[1].dmg / 2, B.turret.gun[1].dmg, true, B.turret.gun[1].range]);
  const g = quiet(); seeAll(g); hold(g, 1); const d = fin(g, 0, 'sigB'); step(g, 0.1);
  const bk = bunkers(g)[0];
  const air = put(g, 1, 'razorwing', bk.u + 60); air.hp = air.maxHp = 1e5;
  step(g, 3); assert.strictEqual(air.hp, 1e5, 'T1: aircraft untouched');
  tier(d, 3); step(g, 3); assert.ok(air.hp < 1e5, 'T3: it hits aircraft'); assert.strictEqual(bk.tier, 3, 'the bunker follows the Depot at once');
  air.hp = 0; step(g, 0.1);
  // heal: a wounded Rifleman and Sniper in range heal 2%/s; a Tank (War Factory) does not; nobody out of range
  tier(d, 2); const r = put(g, 0, 'rifle', bk.u + 100), sn = put(g, 0, 'sniper', bk.u - 50), tk = put(g, 0, 'tank', bk.u + 80), far = put(g, 0, 'rifle', bk.u + 400);
  for (const e of [r, sn, tk, far]) { e.hp = e.maxHp * 0.5; e.lastHurt = g.t; }
  step(g, 1);
  assert.ok(Math.abs(r.hp - r.maxHp * (0.5 + sim.BUNKER.heal)) < 0.5, `Rifleman healed ${r.hp}`);
  assert.ok(Math.abs(sn.hp - sn.maxHp * (0.5 + sim.BUNKER.heal)) < 0.5, 'Sniper healed');
  assert.ok(tk.hp <= tk.maxHp * 0.5 + 1e-6, 'a Tank is not a Barracks unit'); assert.ok(far.hp <= far.maxHp * 0.5 + 1e-6, 'out of range');
  tier(d, 1); r.hp = r.maxHp * 0.5; step(g, 1); assert.ok(r.hp <= r.maxHp * 0.5 + 1e-6, 'T1 does not heal');
  // the HQ shield: bunkers don't count
  const h = quiet(); hold(h, 0); const d3 = fin(h, 0, 'sigB'); step(h, 0.1); assert.ok(h.sides[0].hq.shielded);
  d3.hp = 0; d3.dead = true; h.ents = h.ents.filter(e => e.hp > 0); assert.ok(bunkers(h).length === 1); sim.refreshShields(h);
  assert.ok(!h.sides[0].hq.shielded, 'a bunker alone does not keep the HQ shielded');
  for (const f of [sim.trySell, sim.tryUpgrade, sim.tryRepair]) { bk.hp = bk.maxHp / 2; assert.strictEqual(f(g, 0, bk).ok, false, f.name); }
});

test('the minimal AI (Last Fist): the Aggressor and Trickster build the Salvage Yard, the Turtle and Economist the Depot, then upgrade it', () => {
  for (const [persona, want, other] of [['aggressor', 'sigA', 'sigB'], ['trickster', 'sigA', 'sigB'], ['turtle', 'sigB', 'sigA'], ['economist', 'sigB', 'sigA']]) {
    const g = sim.newGame('hard', { factions: ['lastfist', 'lastfist'], persona, ai: 'v239' }); g.countdown = 0; g.sides[0].aiT = 1e9; // v2.40: v2.39's minimal signature AI
    let firstAt = null;
    for (let i = 0; i < 30 * 600 && !g.over; i++) { sim.update(g, 1 / 30); if (firstAt === null && sim.countB(g, 1, want)) firstAt = g.t; }
    assert.ok(firstAt !== null, `${persona} built its ${want}`);
    assert.ok(sim.hasBuilt(g, 1, 'barracks') && sim.hasBuilt(g, 1, 'refinery'));
    assert.strictEqual(sim.countB(g, 1, other), 0, `${persona} never builds the other one`);
    assert.ok(g.ents.filter(e => e.side === 1 && e.type === want).length <= 1);
  }
  assert.ok(sim.AI_UPG.some(([t, n]) => t === 'sigA' && n === 3) && sim.AI_UPG.some(([t, n]) => t === 'sigB' && n === 3), 'upgraded through the normal order');
  // upgrades: an AI with its building finished and money to spare takes it to T3 like any other
  for (const persona of ['trickster', 'turtle']) {
    const g = sim.newGame('hard', { factions: ['lastfist', 'lastfist'], persona, ai: 'v239' }); g.countdown = 0; g.sides[0].aiT = 1e9; g.t = 400;
    g.sides[1].res.c = g.sides[1].res.e = 20000; const want = persona === 'turtle' ? 'sigB' : 'sigA'; for (const k of ['barracks', 'refinery', 'refinery', 'habitat', 'factory', 'reactor', want]) fin(g, 1, k);
    for (const b of g.ents) if (b.side === 1 && b.kind === 'b') b.tier = b.type === want ? 1 : 3;
    g.sides[1].res.c = g.sides[1].res.e = 20000;
    for (let i = 0; i < 30 * 120; i++) sim.update(g, 1 / 30);
    assert.strictEqual(g.ents.find(e => e.side === 1 && e.type === want).tier, 3, `${persona} upgraded its ${want}`);
  }
  sim.SIG.on = false; // switched off, no AI builds them
  try { const g = sim.newGame('hard', { factions: ['lastfist', 'axiarchs'], persona: 'turtle', ai: 'v239' }); g.countdown = 0; g.sides[0].aiT = 1e9;
    for (let i = 0; i < 30 * 300; i++) sim.update(g, 1 / 30);
    assert.ok(!g.ents.some(e => e.side === 1 && (e.type === 'sigA' || e.type === 'sigB')), 'SIG.on false: none'); } finally { sim.SIG.on = true; }
});

test('every personality and difficulty, all three factions (v2.33 Bloomhost, v2.34 Axiarchs): the build plan with its signature building keeps every building type it had without it', () => {
  const S2 = loadSim({ random: (() => { let a = 11; return () => (a = (a * 16807) % 2147483647) / 2147483647; })() });
  const plans = new Map(); // every plan variant each personality can roll, plus the shared plan used under pressure
  for (let i = 0; i < 200; i++) for (const k of S2.PERSONAS) { const P = S2.rollPersona(k); plans.set(k + ':' + P.plan.join(','), { k, plan: P.plan }); }
  for (const k of S2.PERSONAS) plans.set(k + ':pressed', { k, plan: S2.AI_PLAN });
  assert.ok(plans.size >= 12, `${plans.size} plans`);
  for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) for (const diff of Object.keys(S2.DIFF)) for (const { k, plan } of plans.values()) {
    const sig = k === 'aggressor' || k === 'trickster' ? 'sigA' : 'sigB', withSig = S2.aiPlanWith(plan, sig);
    assert.ok(S2.BD(fac, sig) && S2.BD(fac, sig).sig, `${fac} has ${sig}`);
    for (const t of new Set(plan)) assert.ok(withSig.includes(t), `${diff} ${k}: ${plan.join(' ')} → ${withSig.join(' ')} lost ${t}`);
    assert.ok(withSig.includes('techlab') && withSig.includes(sig), `${diff} ${k}`);
    assert.strictEqual(withSig.length, plan.length, 'still 8 buildings: one duplicate gave way');
    assert.strictEqual(withSig.filter(t => t === sig).length, 1);
  }
  assert.strictEqual(S2.aiPlanWith(S2.AI_PLAN, null), S2.AI_PLAN, 'no signature building (SIG.on false): the plan is unchanged');
  // and the plan the AI actually follows, per faction: a seeded Hard match each, the building types it built are the plan's
  for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) for (const persona of S2.PERSONAS) {
    const S3 = loadSim({ random: (() => { let a = 5; return () => (a = (a * 16807) % 2147483647) / 2147483647; })() });
    const g = S3.newGame('hard', { factions: ['lastfist', fac], persona, ai: 'v239' }); /* v2.40: v2.39's minimal signature AI */ g.countdown = 0; g.sides[0].aiT = 1e9;
    for (let i = 0; i < 30 * 240; i++) S3.update(g, 1 / 30);
    const want = persona === 'aggressor' || persona === 'trickster' ? 'sigA' : 'sigB';
    assert.ok(S3.countB(g, 1, want) === 1, `${fac} ${persona} built its ${want} by 4:00`);
  }
});

test('saves v28 keep Overdrive, bunkers and rebuild timers; a v27 save loads with none of them and plays on', () => {
  assert.ok(sim.SAVE_VER >= 28); assert.ok(sim.SAVE_OK.includes(27) && sim.SAVE_OK.includes(28)); // v29 (v2.33) loads the same way
  const g = quiet(); seeAll(g); hold(g, 0); hold(g, 1); const y = fin(g, 0, 'sigA'); tier(y, 3); const d = fin(g, 0, 'sigB'); tier(d, 2); step(g, 0.1);
  g.sides[0].od = g.t + 12; sim.kill(g, bunkers(g).find(b => b.node === 1), 1); const due = d.bk[1];
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.strictEqual(g2.sides[0].od, g.sides[0].od); assert.ok(sim.overdrive(g2, 0));
  assert.strictEqual(g2.ents.filter(e => e.type === 'bunker' && e.hp > 0).length, 1);
  const d2 = g2.ents.find(e => e.type === 'sigB'); assert.strictEqual(d2.bk[1], due);
  step(g2, sim.BUNKER.rebuild + 0.2); assert.strictEqual(g2.ents.filter(e => e.type === 'bunker' && e.hp > 0).length, 2, 'the timer runs on after loading');
  // a v27 save: no od field, no bk timers
  const h = quiet(); const o = JSON.parse(sim.serialize(h, {})); o.v = 27; for (const s of o.sides) delete s.od;
  const h2 = sim.deserialize(JSON.stringify(o)); assert.ok(h2); assert.strictEqual(h2.sides[0].od, 0); assert.ok(!sim.overdrive(h2, 0));
  hold(h2, 0); fin(h2, 0, 'sigB'); step(h2, 0.2); assert.strictEqual(h2.ents.filter(e => e.type === 'bunker').length, 1, 'plays on with the new buildings');
});
