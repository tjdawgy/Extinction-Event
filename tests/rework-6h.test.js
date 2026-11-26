// v2.98 (batch 6h): the Bloomhost ground rework (REWORK.b6h), unit bodies (REWORK.b6hbody) and the Bloomhost node fix
// (REWORK.b6hnode), src/sim/rework-6h.js. Each mechanic on the real SIM in the Test Range (rangeGame) or a match; the switches
// off play as v2.97 (FP_V297 and every older set in tests/determinism.test.js; FP_V298 there too).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');
const sim = loadSim();
const ON = { b6h: true, b6hbody: true, b6hnode: true }, OFF = { b6h: false, b6hbody: false, b6hnode: false };
const range = (rw, f = ['bloomhost', 'lastfist'], seed = 77) => sim.rangeGame({ seed, factions: f, rework: Object.assign({}, sim.REWORK, rw) });
const step = (g, s) => { for (let i = 0; i < Math.round(s * 60); i++) sim.rangeStep(g); };
const alive = us => us.filter(e => e.hp > 0 && !e.dead).length;

test('switches: on by default, saved only when on; all three off is a v2.97 save', () => {
  const r = sim.rwInit(); assert.ok(r.b6h && r.b6hbody && r.b6hnode);
  const g = sim.newGame('normal', { seed: 5, rework: OFF }), o = JSON.parse(sim.serialize(g, {}));
  for (const k of ['b6h', 'b6hbody', 'b6hnode']) assert.ok(!(k in (o.rw || {})), k + ' left out of an off save');
  const g2 = sim.newGame('normal', { seed: 5 }), o2 = JSON.parse(sim.serialize(g2, {}));
  for (const k of ['b6h', 'b6hbody', 'b6hnode']) assert.strictEqual(o2.rw[k], true);
});

test('roster: the Spitter from T1 with no path; the Queen at Acidic T2; the Broodback replaces the Thornback (b6h off: v2.97)', () => {
  for (const [rw, on] of [[ON, true], [OFF, false]]) {
    const g = sim.newGame('normal', { seed: 3, factions: ['bloomhost', 'lastfist'], rework: Object.assign({}, sim.REWORK, rw) }); g.countdown = 0;
    const b = sim.mkBuilding(g, 0, 'barracks', 0); b.built = true; b.progress = 1; b.tier = 1;
    assert.strictEqual(sim.canMake(b, 'spitter', g), on, 'Spitter at a T1 Larva Pit');
    b.tier = 2; b.path = 'B';
    assert.strictEqual(sim.canMake(b, 'queen', g), on, 'Queen on Acidic Evolution T2');
    assert.strictEqual(sim.canMake(b, 'spitter', g), true, 'Spitter on Acidic Evolution');
    assert.strictEqual(sim.rwHas(g, 'thornback'), !on); assert.strictEqual(sim.rwHas(g, 'broodback'), on);
  }
  assert.strictEqual(sim.UDEF.bulwark.name, 'Chitin Warden'); assert.strictEqual(sim.TREES_BH.factory.B.name, 'Behemoth Evolution');
});

test('Pounce: a Ravager lunges at an enemy within 90 (2.5× speed, 0.4 s, every 4 s); never on a move order', () => {
  const g = range(ON); const [r] = sim.rangeUnits(g, 0, 'ravager', 600, 0, 1); sim.rangeUnits(g, 1, 'rifle', 680, 0, 1);
  g.sides[0].mode = 'attack'; g.sides[1].hush = true;
  let seen = 0; for (let i = 0; i < 90; i++) { sim.rangeStep(g); if (r.pcT > g.t) seen++; }
  assert.ok(seen > 0 && seen <= 26, `pounced (${seen} ticks)`); assert.ok(r.pcCd > g.t, 'its cooldown runs');
  const g2 = range(ON); const [r2] = sim.rangeUnits(g2, 0, 'ravager', 600, 0, 1); sim.rangeUnits(g2, 1, 'rifle', 680, 0, 1);
  g2.sides[0].manual = true; g2.sides[1].hush = true; sim.command(g2, 0, [r2.id], 'go', 700, 40);
  for (let i = 0; i < 90; i++) { sim.rangeStep(g2); assert.ok(!(r2.pcT > g2.t), 'no Pounce on a move order'); }
  const g3 = range(OFF); const [r3] = sim.rangeUnits(g3, 0, 'ravager', 600, 0, 1); sim.rangeUnits(g3, 1, 'rifle', 680, 0, 1); g3.sides[0].mode = 'attack';
  for (let i = 0; i < 90; i++) { sim.rangeStep(g3); assert.ok(!r3.pcT, 'b6h off: none'); }
});

test('the Mite: its bite corrodes like Spitter acid, it lives 10 s, and a side has at most 30', () => {
  const g = range(ON); const ms = sim.rangeUnits(g, 0, 'mite', 600, 0, 1); const [t] = sim.rangeUnits(g, 1, 'heavy', 625, 0, 1);
  g.sides[0].mode = 'attack'; g.sides[1].hush = true; step(g, 2);
  assert.ok(sim.corrNow(t, g.t) > 0, 'corroded by the bite'); assert.ok(sim.corrNow(t, g.t) <= sim.rwD(g, 'spitter').corrode.amt + 1e-9);
  assert.strictEqual(ms[0].maxHp, sim.B6H.mite.hp);
  // the Queen's: at most 6 of hers, and the side's cap
  const g2 = range(ON); const [q] = sim.rangeUnits(g2, 0, 'queen', 600, 0, 1); sim.rangeUnits(g2, 1, 'tank', 860, 0, 1);
  g2.sides[0].mode = 'hold'; g2.sides[1].hush = true; step(g2, 30);
  const mine = g2.ents.filter(e => e.qm === q.id && e.hp > 0);
  assert.ok(mine.length >= 1 && mine.length <= sim.B6H.queen.own, `${mine.length} Mites of hers alive`);
  for (const m of mine) { assert.ok(m.temp && m.temp - g2.t <= sim.B6H.mite.life + 1e-6, 'lives at most 10 s'); assert.strictEqual(sim.UDEF.mite.pop, 0); assert.ok(m.noCap); }
  const g3 = range(ON); sim.rangeUnits(g3, 0, 'mite', 400, 0, 30); const qs = sim.rangeUnits(g3, 0, 'queen', 600, 0, 2); sim.rangeUnits(g3, 1, 'tank', 860, 0, 1);
  g3.sides[1].hush = true; step(g3, 6);
  assert.ok(sim.miteCount6h(g3, 0) <= sim.B6H.mite.cap, 'never past 30'); assert.ok(!g3.ents.some(e => qs.some(q => e.qm === q.id)), 'at the cap she waits');
});

test('the Leaper leaps over Marines onto Artillery (range 260), stuns where it lands, eats small hosts at 30/s', () => {
  const g = range(ON); const ls = sim.rangeUnits(g, 0, 'leaper', 520, 0, 1); sim.rangeUnits(g, 1, 'rifle', 640, 0, 6); const [a] = sim.rangeUnits(g, 1, 'artillery', 730, 0, 1);
  g.sides[0].manual = true; g.sides[1].hush = true; sim.command(g, 0, ls.map(e => e.id), 'attack');
  let host = null, stun = 0; for (let i = 0; i < 60 * 6 && !host; i++) { sim.rangeStep(g); stun = Math.max(stun, g.ents.filter(e => e.st6 > g.t).length); if (ls[0].lt) host = sim.ctlEnt(g, ls[0].lt); }
  assert.ok(host && host.type === 'artillery', 'its host is the Artillery'); assert.ok(stun >= 1, 'the landing stunned');
  assert.strictEqual(sim.rwD(g, 'leaper').leap.range, 260); assert.strictEqual(sim.rwD(g, 'leaper').leap.cd, 10);
  const g2 = range(ON); const [l2] = sim.rangeUnits(g2, 0, 'leaper', 600, 0, 1); const [m] = sim.rangeUnits(g2, 1, 'rifle', 760, 0, 1);
  g2.sides[1].hush = true; g2.sides[0].mode = 'attack'; step(g2, 4);
  assert.ok(l2.lt === m.id || m.hp <= 0, 'it latches onto a Marine (any ground unit)');
});

test('the Chitin Warden: Bloomhost units within 140 take 40% less area damage; direct hits unchanged; two do not stack', () => {
  const hit = (n, w, ward) => { const g = range(ON); const [k] = sim.rangeUnits(g, 0, 'bulwark', 600, 0, 1); const ws = ward ? sim.rangeUnits(g, 0, 'bulwark', 640, 0, n - 1) : []; if (!ward) { k.hp = 0; k.dead = true; g.ents = g.ents.filter(e => e !== k); }
    const [s] = sim.rangeUnits(g, 0, 'skitterling', 660, 0, 1); g.sides[0].hush = true; g.sides[1].hush = true; sim.rangeStep(g); const h0 = s.hp; sim.damage(g, s, 20, w, 1); return h0 - s.hp; };
  const area = hit(1, 'shell', false), cut = hit(1, 'shell', true), two = hit(3, 'shell', true);
  assert.ok(Math.abs(cut - area * 0.6) < 1e-6, `area damage cut 40% (${area} → ${cut})`); assert.ok(Math.abs(two - cut) < 1e-6, 'a second Warden adds nothing');
  assert.ok(Math.abs(hit(1, 'rifle', true) - hit(1, 'rifle', false)) < 1e-6, 'a direct hit unchanged');
});

test('the Broodback bursts into 3 Skitterlings that keep its order, and leaves a Bile Bloom', () => {
  const g = range(ON); const [b] = sim.rangeUnits(g, 0, 'broodback', 600, 0, 1); sim.rangeUnits(g, 1, 'rifle', 760, 0, 3);
  g.sides[0].manual = true; g.sides[1].hush = true; sim.command(g, 0, [b.id], 'attack'); step(g, 0.5);
  const n0 = g.ents.filter(e => e.type === 'skitterling').length; sim.damage(g, b, 1e6, 'rifle', 1); sim.rangeStep(g);
  const k = g.ents.filter(e => e.type === 'skitterling' && e.hp > 0);
  assert.strictEqual(k.length - n0, sim.B6H.brood.n); assert.ok(k.every(e => e.po && e.po.o === 'attack'), 'they carry on its Attack order');
  assert.strictEqual((g.bp6 || []).length, 1); assert.ok(k.some(e => e.bb6 === g.t), 'a Bloomhost unit inside is quickened');
});

test('the Ruinmaw: surfacing erupts (120 within 70, knocked aside), it stays up 15 s; Tunnel from creep; Rally; up where they went down when it dies', () => {
  const g = range(ON); sim.rangeBuilding(g, 0, 'bloomhost', 'refinery', 220, 0); const [R] = sim.rangeUnits(g, 0, 'ruinmaw', 900, 0, 1);
  const ks = sim.rangeUnits(g, 0, 'skitterling', 230, 0, 6), far = sim.rangeUnits(g, 0, 'skitterling', 600, 0, 2); const [m] = sim.rangeUnits(g, 1, 'heavy', 990, 0, 1);
  g.sides[0].manual = true; g.sides[1].hush = true; step(g, 15);
  const h0 = m.hp; sim.command(g, 0, [R.id], 'go', 960, 0);
  for (let i = 0; i < 60 * 6 && !(R.dvCd > g.t); i++) sim.rangeStep(g);
  assert.ok(R.dvCd > g.t, 'it surfaced'); assert.ok(h0 - m.hp >= 119, `the eruption hit (${h0 - m.hp})`);
  const r = sim.command(g, 0, ks.concat(far).map(e => e.id), 'tunnel');
  assert.ok(r.ok && /2 not on creep/.test(r.msg), r.msg); assert.ok(ks.every(e => e.tn && e.tn.ph === 1)); assert.ok(far.every(e => !e.tn));
  const lb = sim.rangeBuilding(g, 0, 'bloomhost', 'barracks', 260, 60); assert.ok(sim.setRally6h(g, 0, lb.id, R.id).ok); assert.strictEqual(lb.rm6, R.id);
  sim.rangeStep(g); const k0 = ks[0], eu = k0.tn.eu; sim.damage(g, R, 1e7, 'rifle', 1); sim.rangeStep(g);
  assert.ok(ks.every(e => e.hp > 0 && !e.tn && !e.gone), 'nobody inside dies'); assert.strictEqual(k0.u, eu, 'up where it went down');
});

test('bodies: ground units stop overlapping; air flies over them; burrowed units ignore them (b6hbody); off: they stack', () => {
  const spread = rw => { const g = range(rw, ['lastfist', 'axiarchs']); const us = []; for (let i = 0; i < 12; i++) us.push(sim.rangeUnit ? null : null);
    const ts = []; for (let i = 0; i < 12; i++) { const e = sim.spawnUnit(g, 0, 'tank', 700, 0); sim.ctlHold(e, 700, 0); ts.push(e); }
    g.sides[0].hush = true; step(g, 3); let m = 1e9; for (const a of ts) for (const b of ts) if (a !== b) m = Math.min(m, Math.hypot(a.u - b.u, (a.v - b.v) * sim.DY)); return m; };
  const on = spread(ON), off = spread(OFF);
  assert.ok(on >= 2 * sim.BODY6H_R.large - 6, `Tanks apart with bodies (${on.toFixed(1)})`); assert.ok(off < 1, 'stacked without');
  assert.strictEqual(sim.bodyClass6h('titan'), 'huge'); assert.strictEqual(sim.bodyClass6h('rifle'), 'small');
});

test('b6hnode: the Bloomhost AI assaults a guarded node only with the power to win it (its damage at building rate), with its army', () => {
  const setup = (n0) => {
    const g = sim.newGame('hard', { seed: 11, map: 'twolane', factions: ['bloomhost', 'lastfist'], autoPlayer: true, autoDiff: 'hard' }); g.countdown = 0; g.t = 400;
    const n = g.nodes[1]; n.owner = 1; const t = sim.mkBuilding(g, 1, 'turret', -1); t.u = n.u + 40; t.v = n.v; t.built = true; t.progress = 1; t.hp = t.maxHp;
    sim.spawnUnit(g, 0, 'drone', n.u, n.v); sim.updateVision(g);
    const mine = []; for (let i = 0; i < n0; i++) mine.push(sim.spawnUnit(g, 0, i % 3 ? 'skitterling' : 'gorebore', sim.hqU(0) + 200, (i % 5 - 2) * 20));
    g.sides[0].n6 = { t: -99, f: -99, own: [], lost: {}, hot: {} };
    sim.aiNode6g(g, 0, { label: 'Hard' }, g.ents.filter(e => e.kind === 'u' && e.side === 0 && e.hp > 0), [], false, 3000);
    return { g, n, side: g.sides[0] };
  };
  assert.ok(sim.nodeGuarded6h(setup(0).g, 0, setup(0).n), 'the centre is guarded');
  const big = setup(30); assert.ok(big.side.capN && big.side.capN.h6 && big.side.capN.node === 1, 'a strong army goes'); assert.ok(big.side.capN.ids.length >= 20, 'with its army');
  const small = setup(5); assert.ok(!small.side.capN, 'too weak: it waits');
});
