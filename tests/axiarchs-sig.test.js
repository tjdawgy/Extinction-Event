// Signature buildings, batch 3 (v2.34, docs/SIGNATURE_BUILDINGS.md section 4): the Axiarch Phase Beacon (a power-field bubble
// on the frontmost unit: the anchor rule, a node field's radius at T1 and ×1.5 at T2, no stacking, warp-in inside it, the
// collapse at 35% lost within 5 s for 15 s, the T3 warp-in bonus) and the Echo Reliquary (echoes of T2/T3 deaths only, 3 or 5
// kept with the oldest replaced, the 50% re-warp under supply and warp rules without a production building, the T3
// overshield, cleared with the Reliquary, saved and loaded, Salvage on the 50% paid), the minimal AI, and saves v30. SIM only.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const U = sim.UDEF, F = sim.FIELD, BK = sim.BEACON, E = sim.ECHO, MID = sim.L / 2;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'axiarchs', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; g.t = 30; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; e.cd = 1e6; return e; };
const fin = (g, s, type) => { const r = sim.tryBuild(g, s, type); assert.ok(r.ok, r.msg); const b = g.ents.filter(e => e.side === s && e.type === type).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; return b; };
const patch = g => sim.beaconPatch(g, 0);
const habitats = (g, n) => { for (let i = 0; i < n; i++) fin(g, 0, 'habitat'); };

test('the Phase Beacon and Echo Reliquary: Genesis Gate cost, time, HP, shields and upgrades', () => {
  const B = sim.BDEF_AX;
  for (const k of ['sigA', 'sigB']) assert.deepStrictEqual([B[k].cost, B[k].time, B[k].hp, B[k].shp, B[k].up], [B.barracks.cost, B.barracks.time, B.barracks.hp, B.barracks.shp, B.barracks.up], k);
  assert.deepStrictEqual([B.sigA.name, B.sigB.name], ['Phase Beacon', 'Echo Reliquary']);
  const g = quiet(); const b = fin(g, 0, 'sigA'); assert.ok(b.maxShp > 0, 'shields like every Axiarch building');
});

test('the Beacon anchor: the frontmost Axiarch ground unit; with none, the frontmost unit of any kind; with no units, the Beacon', () => {
  const g = quiet(); const bk = fin(g, 0, 'sigA');
  sim.beaconAnchor(g, 0, bk); assert.strictEqual(bk.au, bk.u, 'no units: the Beacon itself');
  const air = put(g, 0, 'wraithwing', 1000); sim.beaconAnchor(g, 0, bk); assert.strictEqual(bk.anc, air.id, 'only an aircraft: it');
  put(g, 0, 'shardling', 700); const g2 = put(g, 0, 'bastion', 820, 30); sim.beaconAnchor(g, 0, bk);
  assert.strictEqual(bk.anc, g2.id, 'the frontmost ground unit, even with an aircraft further forward'); assert.strictEqual(bk.av, 30);
  // the other side faces the other way: its front is the lowest u
  const h = quiet('lastfist', 'axiarchs'); h.sides[1].res.c = h.sides[1].res.e = 9000; const b2 = fin(h, 1, 'sigA');
  const a = put(h, 1, 'shardling', 900), b = put(h, 1, 'shardling', 1100); sim.beaconAnchor(h, 1, b2); assert.strictEqual(b2.anc, a.id); void b;
  // re-picked once a second; the bubble glides there
  const u = put(g, 0, 'bastion', 600); step(g, 0.1); g2.u = g2.holdU = 1050; step(g, BK.every + 0.1); assert.strictEqual(bk.au, 1050); void u;
  const p0 = patch(g).u; step(g, 1); assert.ok(Math.abs(patch(g).u - p0 - BK.move) < 1, `moved ${patch(g).u - p0}`);
});

test('the bubble: a node field\'s radius at T1, 1.5× at T2; a normal field zone that never stacks; units warp in inside it', () => {
  const g = quiet(); const bk = fin(g, 0, 'sigA'); put(g, 0, 'bastion', 1000);
  step(g, 30); assert.strictEqual(patch(g).R, F.nodeR); assert.ok(Math.abs(patch(g).r - F.nodeR) < 1e-6, 'T1: a node field');
  bk.tier = 2; step(g, 30); assert.strictEqual(patch(g).R, F.nodeR * BK.r2); assert.ok(Math.abs(patch(g).r - F.nodeR * BK.r2) < 1e-6, 'T2: 1.5×');
  assert.ok(sim.onField(g, 0, 1000, 0) && sim.inBeacon(g, 0, 1000, 0));
  // no stacking: shield regen inside the bubble and a node's field together is the plain field rate
  g.field[0].push({ k: 'n9', u: 1000, v: 0, r: 100, R: 100, node: true });
  const s = put(g, 0, 'shardling', 1000, 10); s.shp = 0; s.shpT = -99; const before = s.shp; sim.updateShields(g, 1);
  assert.ok(Math.abs(s.shp - before - Math.min(s.maxShp, s.maxShp * F.regen)) < 1e-9, 'the field rate, once');
  g.field[0] = g.field[0].filter(p => p.k !== 'n9');
  // warp-in: a warp point inside the bubble (far from the Axis) works, and the unit appears inside it
  assert.ok(sim.setWarp(g, 0, 1020, 20).ok, 'a warp point inside the bubble');
  sim.startWarp(g, 0, 'shardling'); step(g, sim.WARP.ch + 0.1);
  const w = g.ents.filter(e => e.type === 'shardling').at(-1); assert.ok(w && sim.inBeacon(g, 0, w.u, w.v), 'arrived inside the bubble');
});

test('collapse: the units inside lose 35% of their combined shields plus health within 5 s; it is gone for 15 s, then re-forms at the anchor', () => {
  const g = quiet(); fin(g, 0, 'sigA'); const a = put(g, 0, 'bastion', 1000), b = put(g, 0, 'bastion', 1010, 20); step(g, 30);
  const total = () => a.hp + a.shp + b.hp + b.shp;
  // a slow loss: 30% spread over 10 s never collapses it
  const t0 = total(); for (let i = 0; i < 10; i++) { a.shp -= t0 * 0.03; step(g, 1); a.shpT = g.t; b.shpT = g.t; }
  assert.ok(patch(g), 'slow losses: still up');
  a.shp = a.maxShp; b.shp = b.maxShp; step(g, BK.window + 0.5);
  // a fast loss within 2 s
  const t1 = total(); a.shp = 0; a.shpT = g.t; step(g, 1); a.hp -= Math.max(0, t1 * 0.4 - a.maxShp); a.shpT = b.shpT = g.t; step(g, 1); // 40% within 2 s (shields inside the field recharge fast, so a bare 35% can be offset)
  assert.ok(!patch(g), 'collapsed: the bubble is gone at once'); const bk = sim.beaconOf(g, 0);
  assert.ok(Math.abs(bk.col - g.t - BK.down) < 1.1, 'for 15 s'); assert.ok(g.fx.some(f => f.k === 'shatter'), 'the shatter');
  step(g, BK.down - 2); assert.ok(!patch(g), 'still down');
  step(g, 2.5); const p = patch(g); assert.ok(p, 're-forms'); assert.ok(Math.abs(p.u - Math.max(a.u, b.u)) < 1 + BK.move * 0.1, 'at the anchor');
});

test('T3: units that warp into the bubble arrive with full shields and +20% damage for 8 s; outside it, or below T3, no bonus', () => {
  const g = quiet(); const bk = fin(g, 0, 'sigA'); put(g, 0, 'bastion', 1000); step(g, 30); bk.tier = 3;
  assert.ok(sim.setWarp(g, 0, 1010, 30).ok); sim.startWarp(g, 0, 'shardling'); step(g, sim.WARP.ch + 0.1);
  const w = g.ents.filter(e => e.type === 'shardling').at(-1);
  assert.ok(w.bkT > g.t && Math.abs(w.bkT - g.t - BK.dmgDur) < 0.2, 'the bonus for 8 s'); assert.strictEqual(w.shp, w.maxShp, 'full shields');
  assert.ok(Math.abs(sim.outMul(g, w) - (1 + BK.dmg)) < 1e-12, '+20% damage');
  const foe = put(g, 1, 'tank', w.u + 15); foe.hp = foe.maxHp = 1e5; const h0 = foe.hp; sim.fire(g, w, foe, U.shardling);
  assert.ok(Math.abs((h0 - foe.hp) - U.shardling.dmg * sim.DMG.blade.vehicle * 1.2) < 1e-6, 'its blows hit 20% harder');
  step(g, BK.dmgDur); assert.strictEqual(sim.outMul(g, w), 1, 'gone after 8 s');
  // outside the bubble (at the Axis): none; T2: none
  g.sides[0].warp = null; const ax = g.field[0].find(p => p.k === 'axis'); assert.ok(sim.setWarp(g, 0, ax.u + 40, ax.v + 60).ok);
  sim.startWarp(g, 0, 'shardling'); step(g, sim.WARP.ch + 0.1); const o = g.ents.filter(e => e.type === 'shardling').at(-1); assert.ok(!(o.bkT > g.t), 'outside: no bonus');
  bk.tier = 2; assert.ok(sim.setWarp(g, 0, 1010, -30).ok); sim.startWarp(g, 0, 'shardling'); step(g, sim.WARP.ch + 0.1);
  assert.ok(!(g.ents.filter(e => e.type === 'shardling').at(-1).bkT > g.t), 'T2: no bonus');
});

test('echoes: only Axiarch T2/T3 deaths, never temporary or recovered units; 3 kept at T1 and 5 at T2, the oldest replaced', () => {
  const g = quiet(); const rel = fin(g, 0, 'sigB');
  const die = (t, f) => { const e = put(g, 0, t, 900); if (f) f(e); sim.kill(g, e, 1); };
  die('shardling'); assert.deepStrictEqual([...(rel.ech || [])], [], 'T1 units: no echo');
  die('riftstalker', e => { e.temp = g.t + 9; }); die('lancer', e => { e.echo = 1; }); assert.deepStrictEqual([...(rel.ech || [])], [], 'temporary and recovered: never');
  const foe = put(g, 1, 'heavy', 900); sim.kill(g, foe, 0); assert.deepStrictEqual([...(rel.ech || [])], [], 'never the enemy\'s');
  for (const t of ['riftstalker', 'lancer', 'parallax', 'riftmortar']) die(t);
  assert.deepStrictEqual([...rel.ech], ['lancer', 'parallax', 'riftmortar'], 'T1: 3, the oldest replaced');
  rel.tier = 2; for (const t of ['eventide', 'marksman', 'prismwing']) die(t);
  assert.deepStrictEqual([...rel.ech], ['parallax', 'riftmortar', 'eventide', 'marksman', 'prismwing'], 'T2: 5');
  const h = quiet(); const e = put(h, 0, 'riftstalker', 900); sim.kill(h, e, 1); assert.ok(!h.ents.some(x => x.ech), 'no Reliquary: nothing stored');
});

test('a re-warp: 50% of the cost, normal supply and warp rules, consumes the echo, no production building or path needed', () => {
  const g = quiet(); const rel = fin(g, 0, 'sigB'); step(g, 30); rel.ech = ['riftstalker', 'parallax']; // the Axis field grown
  assert.ok(!g.ents.some(e => e.type === 'barracks'), 'no Genesis Gate at all');
  const k = sim.echoCost('parallax'); assert.deepStrictEqual({ ...k }, { c: Math.round(U.parallax.cost.c * E.cost), e: Math.round(U.parallax.cost.e * E.cost) });
  const c0 = g.sides[0].res.c, e0 = g.sides[0].res.e;
  const r = sim.tryEcho(g, 0, 1); assert.ok(r.ok, r.msg);
  assert.deepStrictEqual([c0 - g.sides[0].res.c, e0 - g.sides[0].res.e], [k.c, k.e], 'half the cost');
  assert.deepStrictEqual([...rel.ech], ['riftstalker'], 'consumed as the warp starts');
  assert.strictEqual(g.warps.length, 1); assert.strictEqual(sim.popUsed(g, 0), U.parallax.pop, 'counts toward supply while warping');
  step(g, sim.WARP.ch + 0.1); const p = g.ents.find(e => e.type === 'parallax');
  assert.ok(p && p.echo === 1 && p.paid === k.c && sim.onField(g, 0, p.u, p.v), 'arrives in the field after the warp channel');
  // supply: a full army refuses and keeps the echo
  const big = quiet(); const rel2 = fin(big, 0, 'sigB'); rel2.ech = ['eventide'];
  while (sim.popUsed(big, 0) + U.eventide.pop <= sim.popCap(big, 0)) put(big, 0, 'bastion', 300);
  assert.match(sim.tryEcho(big, 0, 0).msg, /Army is full/); assert.deepStrictEqual([...rel2.ech], ['eventide']);
  habitats(big, 2); big.sides[0].res.c = 0; assert.match(sim.tryEcho(big, 0, 0).msg, /more credits/);
});

test('T3: recovered units arrive with an overshield of 30% of max shields for 20 s that never regenerates', () => {
  const g = quiet(); const rel = fin(g, 0, 'sigB'); rel.tier = 3; rel.ech = ['bastion', 'gravemantle'];
  assert.ok(sim.tryEcho(g, 0, 1).ok); step(g, sim.WARP.ch + 0.1); const u = g.ents.find(e => e.type === 'gravemantle');
  assert.ok(Math.abs(u.osh - u.maxShp * E.osh) < 1e-9 && Math.abs(u.oshT - g.t - E.oshDur) < 0.2);
  const s0 = u.shp, h0 = u.hp; sim.damage(g, u, 50, 'rifle', 1); const took = 50 * sim.DMG.rifle.heavy;
  assert.ok(Math.abs(u.osh - (u.maxShp * E.osh - took)) < 1e-9 && u.shp === s0 && u.hp === h0, 'it takes the hit first');
  const o1 = u.osh; step(g, 8); assert.strictEqual(u.osh, o1, 'never regenerates');
  step(g, E.oshDur); const s1 = u.shp; sim.damage(g, u, 20, 'rifle', 1); assert.ok(u.shp < s1, 'after 20 s it is gone: shields take hits again');
  rel.tier = 2; assert.ok(sim.tryEcho(g, 0, 0).ok); step(g, sim.WARP.ch + 0.1); assert.ok(!(g.ents.find(e => e.type === 'bastion').osh > 0), 'T2: none');
});

test('losing the Reliquary loses every echo; echoes and warping echoes survive save and load; Salvage counts the 50% paid', () => {
  const g = quiet(); const rel = fin(g, 0, 'sigB'); rel.ech = ['lancer', 'marksman', 'riftmortar'];
  assert.ok(sim.tryEcho(g, 0, 0).ok, 'one warping');
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.deepStrictEqual([...g2.ents.find(e => e.type === 'sigB').ech], ['marksman', 'riftmortar']);
  assert.ok(g2.warps.length === 1 && g2.warps[0].echo === 1, 'the warping echo too'); step(g2, sim.WARP.ch + 0.1);
  assert.strictEqual(g2.ents.find(e => e.type === 'lancer').echo, 1, 'arrives as a recovered unit after loading');
  sim.kill(g, rel, 1); step(g, 0.1); assert.strictEqual(g.ents.find(e => e.type === 'sigB'), undefined);
  const r2 = fin(g, 0, 'sigB'); assert.ok(!(r2.ech && r2.ech.length), 'a new Reliquary starts empty');
  // Salvage: Last Fist kills a recovered Riftstalker next to its own units: 10% of the 50% paid
  const h = quiet('lastfist', 'axiarchs'); h.sides[1].res.c = h.sides[1].res.e = 9000; put(h, 0, 'rifle', MID);
  const n = put(h, 1, 'riftstalker', MID + 50); sim.kill(h, n, 0); const full = h.sides[0].salv.tot;
  const rcv = put(h, 1, 'riftstalker', MID + 50); rcv.echo = 1; rcv.paid = sim.echoCost('riftstalker').c; sim.kill(h, rcv, 0);
  assert.strictEqual(full, Math.round(U.riftstalker.cost.c * sim.SALVAGE.pct)); assert.strictEqual(h.sides[0].salv.tot - full, Math.round(rcv.paid * sim.SALVAGE.pct), 'on the 50% paid');
});

test('the minimal AI (Axiarchs): the Aggressor builds the Beacon, the Turtle the Reliquary, and spends an echo when it can afford one and has room', () => {
  for (const [persona, want] of [['aggressor', 'sigA'], ['turtle', 'sigB']]) {
    const S = loadSim({ random: (() => { let a = 3; return () => (a = (a * 16807) % 2147483647) / 2147483647; })() });
    const g = S.newGame('hard', { factions: ['lastfist', 'axiarchs'], persona, ai: 'v239' }); /* v2.40: v2.39's minimal signature AI (the Default builds it after 5:00, tests/tactics.test.js) */ g.countdown = 0; g.sides[0].aiT = 1e9;
    let at = null; for (let i = 0; i < 30 * 300 && at === null; i++) { S.update(g, 1 / 30); if (S.countB(g, 1, want)) at = g.t; }
    assert.ok(at !== null, `${persona}: ${want}`);
  }
  const g = sim.newGame('hard', { factions: ['lastfist', 'axiarchs'], persona: 'turtle', ai: 'v239' }); g.countdown = 0; g.sides[0].aiT = 1e9; g.t = 300;
  const side = g.sides[1]; side.res.c = side.res.e = 3000;
  const f1 = k => { const r = sim.tryBuild(g, 1, k); assert.ok(r.ok, r.msg); const b = g.ents.filter(e => e.side === 1 && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };
  f1('habitat'); f1('habitat'); const rel = f1('sigB'); rel.ech = ['lancer', 'parallax'];
  side.aiT = 0; sim.aiUpdate(g, 1, 1 / 30);
  assert.ok(rel.ech.length < 2 && g.warps.some(w => w.side === 1 && w.echo), `spent an echo: ${rel.ech}`);
});

test('saves v30; an older save with a stray Axiarch signature building drops it and frees its pad', () => {
  assert.strictEqual(sim.SAVE_VER, 30); assert.ok(sim.SAVE_OK.includes(29) && sim.SAVE_OK.includes(30));
  const g = quiet(); fin(g, 0, 'sigA'); fin(g, 0, 'sigB'); put(g, 0, 'bastion', 900); step(g, 5);
  const g2 = sim.deserialize(sim.serialize(g, {})); assert.ok(g2.field[0].some(p => p.k === 'beacon'), 'the bubble is saved like any field patch');
  const o = JSON.parse(sim.serialize(g, {})); o.v = 29;
  const g3 = sim.deserialize(JSON.stringify(o));
  assert.ok(!g3.ents.some(e => e.type === 'sigA' || e.type === 'sigB') && !g3.field[0].some(p => p.k === 'beacon'));
  assert.ok(sim.tryBuild(g3, 0, 'sigA').ok, 'and can build one now');
});
