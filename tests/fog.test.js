// Fog of war: vision, ghosts, spotters, last-known HQ, AI memory, saves
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const STEP = 1 / 30;
const run = (g, sec, each) => { for (let i = Math.round(sec / STEP); i > 0; i--) { sim.update(g, STEP); if (each && each(g) === false) return; } };
const quiet = (diff = 'normal') => { const g = sim.newGame(diff); g.sides[0].aiT = g.sides[1].aiT = 1e9; return g; };
const lit = (g, s, u) => g.fog[s].vis[sim.cellOf(u)] === 1;
const explored = (g, s, u) => g.fog[s].exp[sim.cellOf(u)] === 1;
const hold = (g, u) => { u.holdU = u.u; u.holdV = u.v; };
const unit = (g, s, type, u, v = 0) => { const e = sim.spawnUnit(g, s, type, u, v); g.sides[s].stance = 'hold'; hold(g, e); return e; };
const give = (g, s) => { g.sides[s].res.c = g.sides[s].res.e = 1e5; };

test('base vision always covers the HQ and Turret guns at every tier', () => {
  for (let t = 1; t <= 3; t++) {
    assert.ok(sim.BDEF.hq.gun[t].range < sim.B_SIGHT.hq, `HQ T${t}`);
    assert.ok(sim.BDEF.turret.gun[t].range < sim.B_SIGHT.turret, `Turret T${t}`);
  }
  const g = quiet();
  for (const s of [0, 1]) for (let du = 0; du <= sim.BDEF.hq.gun[3].range; du += 5) assert.ok(lit(g, s, sim.hqU(s) + (s ? -du : du)));
  const spotted = ['artillery', 'sniper', 'bilelobber', 'riftmortar', 'marksman', 'bilecaster']; // long range that needs spotters (v2.27: the Rift Mortar and Astral Marksman too; v2.37: the Bilecaster's bile dart)
  for (const t in sim.SIGHT) if (!spotted.includes(t)) assert.ok(sim.SIGHT[t] > sim.UDEF[t].range, `${t} sees past its range`);
  for (const t of spotted) assert.ok(sim.SIGHT[t] < sim.UDEF[t].range, `${t} outranges its sight`);
});

test('at the start the middle of the lane is dark to both sides; the enemy HQ is a known ghost', () => {
  const g = quiet();
  assert.ok(!lit(g, 0, 850) && !lit(g, 1, 850) && !explored(g, 0, 850));
  assert.ok(!sim.visibleTo(g, 0, g.sides[1].hq) && !sim.visibleTo(g, 1, g.sides[0].hq));
  assert.deepStrictEqual(Object.values(g.fog[0].ghosts).map(gh => gh.type), ['hq']);
  assert.ok(explored(g, 0, 1480));
});

test('scouting reveals as it moves; explored ground stays; ghosts keep last-known state; empty ghosts are cleared', () => {
  const g = quiet(); give(g, 1);
  assert.ok(sim.tryBuild(g, 1, 'refinery', 1)); run(g, 12); // enemy pad 1 (front of their base)
  const ref = g.ents.find(e => e.type === 'refinery' && e.side === 1);
  assert.ok(!sim.visibleTo(g, 0, ref) && !g.fog[0].ghosts[ref.id], 'not seen yet');
  const scout = sim.spawnUnit(g, 0, 'aircraft', 600, 0); sim.setStance(g, 0, 'attack');
  run(g, 25, () => (g.fog[0].ghosts[ref.id] ? false : undefined)); // until the scout has seen it
  assert.ok(g.fog[0].ghosts[ref.id], 'scout saw the Refinery');
  assert.ok(explored(g, 0, 1000) && explored(g, 0, 1200), 'ground it passed is explored');
  run(g, 30); // the scout dies to the enemy HQ or flies on; bring it home if alive
  if (scout.hp > 0) { scout.hp = 0; scout.dead = true; }
  run(g, STEP);
  assert.ok(!lit(g, 0, 1200) && explored(g, 0, 1200), 'explored but no longer visible');
  assert.ok(!sim.visibleTo(g, 0, ref));
  give(g, 1); assert.ok(sim.tryUpgrade(g, 1, ref).ok); run(g, 13);
  assert.strictEqual(ref.tier, 2); assert.strictEqual(g.fog[0].ghosts[ref.id].tier, 1, 'ghost does not learn about the upgrade');
  sim.kill(g, ref, 0); run(g, STEP);
  assert.ok(g.fog[0].ghosts[ref.id], 'destroyed out of sight: ghost remains');
  const scout2 = unit(g, 0, 'aircraft', ref.u, 0); run(g, STEP * 2);
  assert.ok(!g.fog[0].ghosts[ref.id], 'seen again: ghost removed');
  assert.ok(scout2);
});

test('a field node you hold gives vision while you hold it', () => {
  const g = quiet(); const n = g.nodes[1];
  const r = unit(g, 0, 'rifle', n.u); run(g, 13);
  assert.strictEqual(n.owner, 0);
  sim.kill(g, r, 1); run(g, STEP);
  assert.ok(lit(g, 0, n.u) && lit(g, 0, n.u + 200) && lit(g, 0, n.u - 200), 'node vision ±220');
  assert.ok(!lit(g, 0, n.u + 250));
  n.prog = 0; n.owner = null; run(g, STEP);
  assert.ok(!lit(g, 0, n.u), 'lost the node: vision gone');
});

test('enemies appear and disappear with vision; "spotted" at most once per 10 s', () => {
  const g = quiet();
  const foe = unit(g, 1, 'rifle', 1100);
  const spots = () => g.events.filter(e => e.type === 'spotted' && e.side === 0).length;
  run(g, 1);
  assert.ok(!sim.visibleTo(g, 0, foe)); assert.strictEqual(spots(), 0);
  foe.u = 700; hold(g, foe); run(g, STEP * 2);
  assert.ok(sim.visibleTo(g, 0, foe)); assert.strictEqual(spots(), 1);
  assert.strictEqual(sim.hqStatus(g, 1, 0).stale, true, 'their HQ is still out of sight');
  foe.u = 1100; hold(g, foe); run(g, STEP * 2);
  assert.ok(!sim.visibleTo(g, 0, foe));
  foe.u = 700; hold(g, foe); run(g, 3);
  assert.strictEqual(spots(), 1, 'within 10 s: no second toast');
  foe.u = 1100; hold(g, foe); run(g, 8);
  foe.u = 700; hold(g, foe); run(g, STEP * 2);
  assert.strictEqual(spots(), 2, 'after 10 s: spotted again');
});

test('Artillery and Snipers do not fire beyond sight until a spotter arrives', () => {
  for (const [type, gap] of [['artillery', 400], ['sniper', 250]]) {
    const g = quiet();
    const gun = unit(g, 0, type, 700), foe = unit(g, 1, 'heavy', 700 + gap);
    run(g, 6);
    assert.strictEqual(foe.hp, foe.maxHp, `${type}: target in range but unseen, no shots`);
    assert.ok(!sim.visibleTo(g, 0, foe));
    unit(g, 0, 'rifle', 700 + gap - 150); // spotter: sight 170, outside the Heavy's 130 range
    run(g, 8);
    assert.ok(foe.hp < foe.maxHp, `${type}: spotted target gets hit (${foe.hp})`);
    assert.ok(gun.hp > 0);
  }
});

test('enemy HQ readout shows last-known health and shield until seen', () => {
  const g = quiet(); const hq1 = g.sides[1].hq;
  assert.deepStrictEqual({ ...sim.hqStatus(g, 1, 0) }, { hp: 2800, maxHp: 2800, frac: 1, state: 'exposed', stale: true });
  hq1.hp = 1000;
  assert.strictEqual(sim.hqStatus(g, 1, 0).hp, 2800, 'damage out of sight does not leak');
  assert.strictEqual(sim.hqStatus(g, 1).hp, 1000, 'true value without a viewer');
  unit(g, 0, 'aircraft', 1250); run(g, STEP * 2);
  const seenNow = sim.hqStatus(g, 1, 0);
  assert.ok(!seenNow.stale && Math.abs(seenNow.hp - hq1.hp) < 1e-9 && seenNow.state === 'exposed', 'in view: the real value');
  g.ents = g.ents.filter(e => !(e.side === 0 && e.kind === 'u')); const last = hq1.hp; hq1.hp = 500; run(g, STEP);
  assert.ok(Math.abs(sim.hqStatus(g, 1, 0).hp - last) < 1 && sim.hqStatus(g, 1, 0).stale, 'out of view again: remembers what it last saw (not the 500 it has now)');
});

test('AI memory: it remembers units it saw, fading over 45 s, and forgets them when the spot is empty', () => {
  const g = quiet(); const f = g.fog[1];
  // An AI rifle at 780 sees 610–950 (its HQ only sees from 960); the player's rifle stands at 920, just out of rifle range
  let eye = unit(g, 1, 'rifle', 780); const r = unit(g, 0, 'rifle', 920); run(g, STEP);
  assert.ok(f.intel[r.id] && f.intel[r.id].u === 920, 'seen and remembered');
  sim.kill(g, eye, 0); r.u = 400; hold(g, r); run(g, 20);
  assert.ok(f.intel[r.id], 'still remembered after leaving sight');
  assert.strictEqual(f.intel[r.id].u, 920, 'at its last-known spot, not where it really is');
  assert.ok(!sim.visibleTo(g, 1, r));
  run(g, 26);
  assert.ok(!f.intel[r.id], 'forgotten after 45 s');
  eye = unit(g, 1, 'rifle', 780); r.u = 920; hold(g, r); run(g, STEP);
  assert.ok(f.intel[r.id]);
  sim.kill(g, eye, 0); r.u = 400; hold(g, r); run(g, STEP);
  unit(g, 1, 'rifle', 780); run(g, STEP); // it looks at that spot again: empty
  assert.ok(!f.intel[r.id], 'spot in view and empty: forgotten');
});

test('AI decisions use only its own vision (identical choices whatever is hidden from it)', () => {
  // Each game gets its own seeded random stream, so both see exactly the same random numbers
  let seed = 0;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const det = loadSim({ random: () => rnd() });
  const make = extra => {
    seed = 42; const g = det.newGame('hard');
    if (extra) for (let i = 0; i < extra.n; i++) { const t = det.spawnUnit(g, 0, 'tank', extra.u + i * 8, 0); t.holdU = t.u; t.holdV = t.v; }
    g.sides[0].stance = 'hold'; g.sides[0].aiT = 1e9;
    g.seed = 7; return g;
  };
  const step = g => { seed = g.seed; det.update(g, STEP); g.seed = seed; };
  const aiState = g => JSON.stringify({ res: g.sides[1].res, stance: g.sides[1].stance, push: g.sides[1].pushTo,
    ents: g.ents.filter(e => e.side === 1).map(e => [e.kind, e.type, e.tier, Math.round(e.u * 100), e.queue ? e.queue.join() : '']) });
  const A = make(null), B = make({ n: 12, u: 280 }); // B: a big army hidden inside the player's base
  let steps = 0;
  for (; steps < 90 * 30; steps++) {
    step(A); step(B);
    if (B.ents.some(e => e.side === 0 && e.kind === 'u' && det.visibleTo(B, 1, e))) break;
    assert.strictEqual(aiState(B), aiState(A), `AI diverged at ${steps * STEP}s while the army was hidden`);
  }
  assert.ok(steps * STEP >= 30, `compared for ${(steps * STEP).toFixed(1)} s of hidden army`);
  // Control: the same army where the AI can see it changes its decisions
  const C = make({ n: 12, u: 1000 }), A2 = make(null);
  let differs = false;
  for (let i = 0; i < 60 * 30 && !differs; i++) { step(C); step(A2); differs = aiState(C) !== aiState(A2); }
  assert.ok(differs, 'a visible army does change what the AI does');
});

test('AI siege under fog: a spotter walks up and Artillery hits the player\'s buildings', () => {
  const setup = withSpotter => {
    const g = quiet(); give(g, 0);
    for (const t of ['barracks', 'refinery', 'reactor', 'habitat']) assert.ok(sim.tryBuild(g, 0, t).ok);
    run(g, 16);
    for (let i = 0; i < 3; i++) sim.spawnUnit(g, 1, 'artillery', 1180 - i * 15, 0);
    if (withSpotter) { sim.spawnUnit(g, 1, 'aircraft', 1190, 0); sim.spawnUnit(g, 1, 'heavy', 1195, 0); sim.spawnUnit(g, 1, 'heavy', 1200, 0); }
    const side = g.sides[1];
    side.stance = 'attack'; side.pushMode = 'siege'; side.pushTo = sim.hqU(0) + (sim.BDEF.hq.gun[1].range + 25); // the AI's siege line vs a T1 HQ (u 635)
    return g;
  };
  const hpOf = g => g.ents.filter(e => e.kind === 'b' && e.side === 0 && e.type !== 'hq').reduce((a, b) => a + b.hp, 0);
  const g = setup(true), hp0 = hpOf(g); const spotters = new Set();
  run(g, 70, () => { const sp = g.ents.find(e => e.id === g.sides[1].spotter); if (sp) spotters.add(sp.type + sp.id); });
  assert.ok(spotters.size >= 1, `spotters sent forward: ${[...spotters].join(', ')}`);
  assert.ok(g.ents.filter(e => e.side === 1 && e.type === 'artillery').length === 3, 'no Artillery wandered into the HQ\'s range');
  assert.ok(Math.abs(g.sides[1].pushTo - 635) < 1);
  assert.ok(hpOf(g) < hp0 * 0.8, `siege damaged the base (${Math.round(hpOf(g))} of ${Math.round(hp0)} HP left)`);
  const lone = setup(false), hpL = hpOf(lone);
  run(lone, 70);
  assert.strictEqual(hpOf(lone), hpL, 'without a spotter the Artillery cannot see the base and does not fire');
});

test('saves: v6 keeps fog, ghosts and AI memory; v5 saves load with fog from current vision only', () => {
  const g = quiet(); give(g, 1);
  sim.tryBuild(g, 1, 'refinery', 1); run(g, 12);
  const sc = sim.spawnUnit(g, 0, 'aircraft', 900, 0); sc.holdU = 1150; sc.holdV = 0; g.sides[0].stance = 'hold';
  run(g, 5);
  unit(g, 0, 'rifle', 1060); run(g, STEP); // AI sees this one
  const o = JSON.parse(sim.serialize(g, {}));
  const g2 = sim.deserialize(JSON.stringify(o));
  for (const k of [0, 1]) {
    assert.strictEqual(Array.from(g2.fog[k].exp).join(''), Array.from(g.fog[k].exp).join(''));
    assert.deepStrictEqual(Object.keys(g2.fog[k].ghosts).sort(), Object.keys(g.fog[k].ghosts).sort());
    assert.deepStrictEqual(Object.keys(g2.fog[k].intel).sort(), Object.keys(g.fog[k].intel).sort());
    assert.deepStrictEqual({ ...g2.fog[k].lastHQ }, { ...g.fog[k].lastHQ });
  }
  assert.strictEqual(g2.events.length, 0);
  // v5: no fog in the file
  delete o.fog; o.v = 5;
  const g5 = sim.deserialize(JSON.stringify(o));
  assert.ok(g5, 'v5 save loads');
  for (const k of [0, 1]) {
    const inView = g5.ents.filter(e => e.side !== k && e.kind === 'u' && sim.visibleTo(g5, k, e)).map(e => String(e.id)).sort();
    assert.deepStrictEqual(Object.keys(g5.fog[k].intel).sort(), inView, 'memory holds only what is in view right now');
    assert.deepStrictEqual(Object.values(g5.fog[k].ghosts).map(x => x.type).filter(t => t !== 'hq'), Object.values(g5.ents).filter(e => e.side !== k && e.kind === 'b' && e.type !== 'hq' && sim.visibleTo(g5, k, e)).map(e => e.type), 'ghosts only for what is in view now');
    const exp = Array.from(g5.fog[k].exp), vis = Array.from(g5.fog[k].vis);
    const hqCells = new Set(); const ehq = g5.sides[1 - k].hq;
    for (let i = sim.cellOf(ehq.u - ehq.half - 40); i <= sim.cellOf(ehq.u + ehq.half + 40); i++) hqCells.add(i);
    assert.ok(exp.every((x, i) => !x || vis[i] || hqCells.has(i)), 'explored = current vision + known enemy start');
  }
  assert.strictEqual(g5.t, g.t);
});

test('a big explosion out of the player\'s sight does not shake the screen', () => {
  const g = quiet();
  const t = sim.spawnUnit(g, 1, 'titan', 1100, 0); run(g, STEP);
  sim.kill(g, t, 0);
  assert.strictEqual(g.shake, 0, 'Titan died in fog: no shake');
  const t2 = sim.spawnUnit(g, 1, 'titan', 600, 0); run(g, STEP);
  sim.kill(g, t2, 0);
  assert.ok(g.shake > 0, 'in view: shake');
});

test('AI defense estimate counts the enemy HQ and remembered Turrets at their last-seen tiers', () => {
  const g = quiet();
  assert.strictEqual(sim.knownDefense(g, 1), sim.HQ_VAL * 1, 'only the HQ is known at the start');
  give(g, 0); assert.ok(sim.tryBuild(g, 0, 'turret', 4).ok); run(g, 13); // front pad
  const tur = g.ents.find(e => e.type === 'turret');
  assert.strictEqual(sim.knownDefense(g, 1), sim.HQ_VAL, 'a Turret the AI has not seen does not count');
  const eye = unit(g, 1, 'aircraft', tur.u + 200); run(g, STEP);
  assert.strictEqual(sim.knownDefense(g, 1), sim.HQ_VAL + sim.TURRET_VAL * 1);
  sim.kill(g, eye, 0); assert.ok(sim.tryUpgrade(g, 0, tur).ok); run(g, 13);
  assert.strictEqual(tur.tier, 2);
  assert.strictEqual(sim.knownDefense(g, 1), sim.HQ_VAL + sim.TURRET_VAL, 'still the tier it last saw');
});

test('AI remembers a failed base attack: no new base attack until its army clearly beats the last one; the bar fades', () => {
  const g = sim.newGame('easy'); g.sides[0].aiT = 1e9; g.t = 200;
  const side = g.sides[1], army = () => g.ents.filter(e => e.side === 1 && e.kind === 'u');
  const spawn = (n, type) => { for (let i = 0; i < n; i++) sim.spawnUnit(g, 1, type, 1200 - i * 5, 0); };
  const value = () => army().reduce((a, u) => a + sim.UDEF[u.type].cost.c + sim.UDEF[u.type].cost.e * 1.5, 0);
  const tick = () => { side.aiT = 0; sim.aiUpdate(g, 1, STEP); };
  spawn(4, 'tank'); // 4 × 260 = 1040
  // it is attacking the base with 1040, then sees a much bigger army and pulls back
  side.stance = 'attack'; side.pushTo = null; side.stanceAt = g.t - 20; side.launchV = value();
  for (let i = 0; i < 8; i++) g.fog[1].intel[9000 + i] = { type: 'titan', u: 700, t: g.t };
  tick();
  assert.strictEqual(side.stance, 'retreat');
  assert.strictEqual(side.failV, 1040 * sim.FAIL_MARGIN);
  assert.strictEqual(sim.attackBar(g, 1), 1040 * 1.3);
  // the big army is forgotten (thV 0): 1040 would normally be plenty for an all-in, but it is below the bar
  g.fog[1].intel = {}; side.stanceAt = g.t - 20;
  for (let i = 0; i < 5; i++) { tick(); assert.ok(!(side.stance === 'attack' && side.pushTo !== sim.L / 2 - 20), `no base attack below the bar (pushTo ${side.pushTo})`); g.t += 1; }
  // half-way through the memory the bar has halved, so the same army goes again
  g.t = side.failT + sim.FAIL_MEMORY / 2;
  assert.ok(Math.abs(sim.attackBar(g, 1) - 1040 * 1.3 / 2) < 1e-6);
  side.stance = 'retreat'; side.stanceAt = g.t - 20; tick();
  assert.ok(side.stance === 'attack' && side.pushTo !== sim.L / 2 - 20, 'attacks again once the bar has faded below its army');
  g.t = side.failT + sim.FAIL_MEMORY + 1;
  assert.strictEqual(sim.attackBar(g, 1), 0, 'fully faded');
  // a big enough army goes straight away
  const g2 = sim.newGame('easy'); g2.sides[0].aiT = 1e9; g2.t = 200; g2.sides[1].failV = 1352; g2.sides[1].failT = 200;
  for (let i = 0; i < 6; i++) sim.spawnUnit(g2, 1, 'tank', 1200 - i * 5, 0); // 1560 > 1352
  g2.sides[1].aiT = 0; g2.sides[1].stanceAt = 180; sim.aiUpdate(g2, 1, STEP);
  assert.ok(g2.sides[1].stance === 'attack' && g2.sides[1].pushTo !== sim.L / 2 - 20, 'a clearly bigger army attacks');
});

test('a maxed-out AI with money banked is not held back by a failed-attack bar it can never beat', () => {
  const g = sim.newGame('easy'); g.sides[0].aiT = 1e9; g.t = 400;
  const side = g.sides[1];
  side.failV = 99999; side.failT = g.t; // an impossible bar
  while (sim.popUsed(g, 1) < sim.popCap(g, 1) - 1) sim.spawnUnit(g, 1, 'rifle', 1200, 0);
  side.res.c = 3000; side.stanceAt = g.t - 30; side.aiT = 0;
  sim.aiUpdate(g, 1, STEP);
  assert.ok(side.stance === 'attack' && side.pushTo !== sim.L / 2 - 20, 'full army + 3000 credits: commits anyway');
  const g2 = sim.newGame('easy'); g2.sides[0].aiT = 1e9; g2.t = 400;
  g2.sides[1].failV = 99999; g2.sides[1].failT = g2.t;
  while (sim.popUsed(g2, 1) < sim.popCap(g2, 1) - 1) sim.spawnUnit(g2, 1, 'rifle', 1200, 0);
  g2.sides[1].res.c = 500; g2.sides[1].stanceAt = g2.t - 30; g2.sides[1].aiT = 0;
  sim.aiUpdate(g2, 1, STEP);
  assert.ok(!(g2.sides[1].stance === 'attack' && g2.sides[1].pushTo !== sim.L / 2 - 20), 'full but poor: still waits');
});
