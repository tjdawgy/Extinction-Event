// Audit phase 7c (v2.43, audit/polish-report.md): the four mechanics behind MECH7C (setMech7c(false) plays as v2.42):
// the rally point inside the HQ gun's cover (and grouped reinforcements on Attack), melee units that engage within a short
// radius on Hold, each side's own field node inside its HQ gun's reach, and the dedicated signature pad. Also the
// BALANCE7C switch and the AI's use of the pad. SIM only (Node); the browser check is in tests/polish-ui.test.js.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const M = sim.MECH7C, L = sim.L;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'lastfist', f1 = 'bloomhost') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; g.t = 30; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const fin = (g, s, type) => { const r = sim.tryBuild(g, s, type); assert.ok(r.ok, r.msg); const b = g.ents.filter(e => e.side === s && e.type === type).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; return b; };

test('MECH7C: on by default; off restores the v2.42 rally point (300 out) and node positions (600, 850, 1100)', () => {
  assert.strictEqual(M.on, true);
  assert.deepStrictEqual([...sim.NODE_U], [sim.hqU(0) + M.node, L / 2, L - sim.hqU(0) - M.node]);
  assert.strictEqual(sim.rallyU(0), sim.hqU(0) + M.rally); assert.strictEqual(sim.rallyU(1), sim.hqU(1) - M.rally);
  sim.setMech7c(false);
  try {
    assert.deepStrictEqual([...sim.NODE_U], [600, L / 2, L - 600]);
    assert.strictEqual(sim.rallyU(0), sim.hqU(0) + 300);
    assert.deepStrictEqual([...sim.newGame('normal').nodes.map(n => n.u)], [600, L / 2, L - 600]);
  } finally { sim.setMech7c(true); }
  assert.deepStrictEqual([...sim.newGame('normal').nodes.map(n => n.u)], [...sim.NODE_U]);
});

test('rally point inside the HQ gun\'s T1 reach; every node outside the T1 gun, the third (enemy\'s) node inside its T2/T3 reach', () => {
  const gun = sim.BDEF.hq.gun;
  assert.ok(M.rally + 165 <= gun[1].range, 'a 165-range attacker (the longest basic range) hitting the rally point is inside the HQ gun');
  for (const s of [0, 1]) {
    const d = Math.abs(sim.NODE_U[s === 0 ? 0 : 2] - sim.hqU(s));
    assert.ok(d - sim.NODE_R >= gun[1].range, 'the whole node zone is outside the T1 gun');
    assert.ok(d - sim.NODE_R < gun[2].range && d < gun[3].range, 'the upgraded guns reach into it');
  }
});

test('melee on Hold: engages an enemy within holdR of its spot, never chases one further out; off (v2.42): never engages', () => {
  for (const on of [true, false]) {
    sim.setMech7c(on);
    try {
      const g = quiet('bloomhost', 'lastfist'), u0 = L / 2; // mid-lane: out of both HQ guns
      const sk = sim.spawnUnit(g, 0, 'skitterling', u0, 0); sim.setStance(g, 0, 'hold');
      const near = sim.spawnUnit(g, 1, 'rifle', u0 + 60, 0); near.holdU = near.u; near.holdV = 0; near.cd = 1e6;
      step(g, 3);
      if (on) assert.ok(near.hp < near.maxHp, 'the near Rifleman was attacked'); else assert.strictEqual(near.hp, near.maxHp, 'v2.42: a melee unit on Hold never engages');
      near.hp = 0; step(g, 3);
      assert.ok(Math.abs(sk.u - u0) < 6, 'back on its spot');
      const far = sim.spawnUnit(g, 1, 'rifle', u0 + 140, 0); far.holdU = far.u; far.holdV = 0; far.cd = 1e6;
      step(g, 3);
      assert.ok(Math.abs(sk.u - u0) < 6 && far.hp === far.maxHp, 'it does not chase out to 140');
    } finally { sim.setMech7c(true); }
  }
});

test('melee on a Regroup flag engages within holdR of its flag spot too', () => {
  const g = quiet('bloomhost', 'lastfist');
  const sk = sim.spawnUnit(g, 0, 'skitterling', 480, 0);
  assert.ok(sim.giveOrder(g, 0, 'all', null, 'move', 500, 0).ok);
  step(g, 2);
  const e = sim.spawnUnit(g, 1, 'rifle', 560, 0); e.holdU = e.u; e.holdV = 0; e.cd = 1e6;
  step(g, 3);
  assert.ok(e.hp < e.maxHp);
  assert.ok(Math.abs(sk.u - 500) < 120);
});

test('rally on Attack: a player\'s new units wait at the rally point until the group there is worth batchV (or batchT seconds), then go together', () => {
  const g = quiet('lastfist', 'lastfist');
  const front = sim.spawnUnit(g, 0, 'tank', 900, 0); // the army already out in the field
  sim.setStance(g, 0, 'attack'); step(g, 1); // the army the Attack order found goes at once
  const r = sim.rallyU(0), a = sim.spawnUnit(g, 0, 'rifle', r, 0);
  step(g, 4);
  const atRally = u => u < r + 30 && u > r - 130; // the rally point, spread back by each unit's own offset (rallyOff)
  assert.ok(atRally(a.u), `one Rifleman (45) waits at the rally point: ${Math.round(a.u)} vs ${r}`);
  const more = []; for (let i = 0; i < 6; i++) more.push(sim.spawnUnit(g, 0, 'rifle', r - 10, (i - 3) * 10)); // 7 x 45 = 315 >= 300
  const a0 = a.u; step(g, 4);
  assert.ok(a.u > a0 + 60 && more.every(x => x.u > r + 40), 'the group left together');
  // a lone unit still goes after batchT seconds
  const b = sim.spawnUnit(g, 0, 'rifle', r, 0); step(g, M.batchT - 2); assert.ok(atRally(b.u)); step(g, 6); assert.ok(b.u > r + 40);
  void front;
});

test('rally batching is the player\'s side only (the AI groups its own reinforcements)', () => {
  const g = sim.newGame('normal'); assert.strictEqual(sim.playerSide(g, 0), true); assert.strictEqual(sim.playerSide(g, 1), false);
  const h = sim.newGame('normal', { autoPlayer: true }); assert.strictEqual(sim.playerSide(h, 0), false);
});

test('signature pad: a signature building goes on it (not on the 8 pads), one of the two at a time; selling frees it for the other at full price', () => {
  for (const f of ['lastfist', 'bloomhost', 'axiarchs']) {
    const g = quiet(f, 'lastfist'), side = g.sides[0];
    for (const t of ['refinery', 'refinery', 'refinery', 'reactor', 'reactor', 'habitat', 'habitat', 'barracks']) fin(g, 0, t);
    assert.ok(side.slots.every(Boolean), 'all 8 pads full');
    const c0 = side.res.c, r = sim.tryBuild(g, 0, 'sigA');
    assert.ok(r.ok, r.msg);
    const a = g.ents.find(e => e.type === 'sigA' && e.side === 0);
    assert.strictEqual(a.slot, sim.SIG_SLOT); assert.strictEqual(sim.sigOnPad(g, 0), a);
    assert.strictEqual(side.slots.length, sim.SLOT_COUNT, 'the 8 pads stay 8');
    assert.strictEqual(c0 - side.res.c, sim.BD(f, 'sigA').cost.c);
    assert.match(sim.tryBuild(g, 0, 'sigB').msg, /signature pad holds/);
    a.built = true;
    assert.ok(sim.trySell(g, 0, a).ok);
    sim.update(g, 1 / 30);
    const c1 = side.res.c; assert.ok(sim.tryBuild(g, 0, 'sigB').ok, 'the other one, after selling');
    assert.strictEqual(c1 - side.res.c, sim.BD(f, 'sigB').cost.c, 'normal cost');
    assert.strictEqual(sim.sigOnPad(g, 0).type, 'sigB');
  }
});

test('signature pad: no regular building fits it; a signature building never goes on a regular pad, even one picked', () => {
  const g = quiet();
  assert.match(sim.tryBuild(g, 0, 'refinery', sim.SIG_SLOT).msg, /Only a signature building/);
  assert.ok(sim.tryBuild(g, 0, 'sigB', 3).ok);
  assert.strictEqual(g.ents.find(e => e.type === 'sigB').slot, sim.SIG_SLOT); assert.strictEqual(g.sides[0].slots[3], null);
  const p = sim.slotPos(0, sim.SIG_SLOT), q = sim.slotPos(1, sim.SIG_SLOT);
  assert.ok(p.u > sim.hqU(0) && q.u < sim.hqU(1), 'just past the HQ, toward the field'); assert.strictEqual(p.u - sim.hqU(0), sim.hqU(1) - q.u, 'mirrored');
  for (let k = 0; k < sim.SLOT_COUNT; k++) { const o = sim.slotPos(0, k); assert.ok(Math.hypot(o.u - p.u, o.v - p.v) > 60, `clear of pad ${k + 1}`); }
});

test('signature pad off (v2.42): both signature buildings at once, on regular pads', () => {
  sim.setMech7c(false);
  try {
    const g = quiet();
    assert.ok(sim.tryBuild(g, 0, 'sigA').ok); assert.ok(sim.tryBuild(g, 0, 'sigB').ok);
    assert.ok(g.ents.filter(e => e.type === 'sigA' || e.type === 'sigB').every(e => e.slot >= 0 && e.slot < 8));
  } finally { sim.setMech7c(true); }
});

test('saves: a building on the signature pad survives save and resume; an older save with one on a regular pad still loads and blocks the other', () => {
  const g = quiet(); fin(g, 0, 'barracks'); const y = fin(g, 0, 'sigA'); step(g, 1);
  const h = sim.deserialize(sim.serialize(g, {}));
  const y2 = h.ents.find(e => e.id === y.id);
  assert.strictEqual(y2.slot, sim.SIG_SLOT); assert.ok(h.sides[0].slots.every(b => !b || b.type !== 'sigA'));
  assert.strictEqual(sim.sigOnPad(h, 0).id, y.id);
  step(h, 1);
  // an older (v2.42) save: the Yard on pad 5
  sim.setMech7c(false); let s;
  try { const o = quiet(); fin(o, 0, 'barracks'); fin(o, 0, 'sigA'); s = sim.serialize(o, {}); } finally { sim.setMech7c(true); }
  const old = sim.deserialize(s);
  assert.ok(old, 'loads');
  const yy = old.ents.find(e => e.type === 'sigA'); assert.ok(yy.slot >= 0 && yy.slot < 8, 'it stays on its pad');
  assert.strictEqual(old.sides[0].slots[yy.slot], yy);
  old.sides[0].res.c = 5000; old.sides[0].res.e = 5000;
  assert.match(sim.tryBuild(old, 0, 'sigB').msg, /sell it/, 'one at a time still holds');
  step(old, 1);
});

test('the AI builds its signature building on the signature pad and keeps all 8 pads for its plan', () => {
  const g = sim.newGame('normal', { autoPlayer: true, autoDiff: 'normal', factions: ['lastfist', 'axiarchs'], ai: 'default', autoAi: 'default', persona: 'economist', autoPersona: 'aggressor' });
  g.countdown = 0;
  for (let i = 0; i < 30 * 600 && !g.over; i++) sim.update(g, 1 / 30);
  for (const s of [0, 1]) {
    const sg = g.ents.filter(e => e.kind === 'b' && e.side === s && (e.type === 'sigA' || e.type === 'sigB'));
    assert.ok(sg.every(e => e.slot === sim.SIG_SLOT), 'only on the signature pad');
  }
  assert.ok([0, 1].some(s => sim.sigOnPad(g, s)), 'at least one AI built one by 10:00');
});

test('Hard builds a signature building now that it costs no pad', () => {
  for (const f of ['lastfist', 'bloomhost', 'axiarchs']) {
    const P = sim.rollPersona(undefined, 'hard', f, 'hard');
    assert.ok(P.dial.sigAt < 1200, `${f}: sigAt ${P.dial.sigAt}`);
    assert.ok(['sigA', 'sigB'].includes(P.dial.sig), `${f}: names its signature building`);
  }
});

test('BALANCE7C: setBalance7c(false) restores every v2.42 value; setBalance7b(false) and setBalance(false) take it off and put it back', () => {
  const B = sim.BALANCE7C; assert.strictEqual(B.on, true);
  const get = p => { const k = p.split('.'), R = { UDEF: sim.UDEF, BDEF: sim.BDEF, BDEF_BH: sim.BDEF_BH, BDEF_AX: sim.BDEF_AX, NODE_INC: sim.NODE_INC, DMG: sim.DMG }; let o = R[k[0]]; for (let i = 1; i < k.length; i++) o = o[k[i]]; return JSON.stringify(o); };
  const on = B.patches.map(([p]) => get(p));
  B.patches.forEach(([p, v], i) => assert.strictEqual(on[i], JSON.stringify(v), p));
  sim.setBalance7c(false);
  const off = B.patches.map(([p]) => get(p));
  B.patches.forEach(([p], i) => assert.strictEqual(off[i], JSON.stringify(B.orig[i]), p));
  sim.setBalance7c(true);
  sim.setBalance7b(false); assert.strictEqual(B.on, false); sim.setBalance7b(true); assert.strictEqual(B.on, true);
  sim.setBalance(false); assert.strictEqual(B.on, false); sim.setBalance(true); assert.strictEqual(B.on, true);
  B.patches.forEach(([p], i) => assert.strictEqual(get(p), on[i], p));
});
