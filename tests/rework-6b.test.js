// v2.92 (batch 6b, docs/FACTION_REWORK.md "Batch 6b"): Part A, the side-bias fix behind REWORK.b6side (per game, g.rw.b6side).
// Off: v2.91 exactly (tests/determinism.test.js pins it; a b6side-off save leaves the key and its streams out).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim, readHtml } = require('./load-sim');

test('b6side: on by default, per game, saved only when on (with its order stream and the AIs\' own streams), resumed as saved', () => {
  const s = loadSim();
  assert.strictEqual(s.rwInit().b6side, true);
  const g = s.newGame('hard', { seed: 5, autoPlayer: true, autoDiff: 'hard', factions: ['lastfist', 'axiarchs'] }); for (let i = 0; i < 600; i++) s.update(g, s.TICK);
  const o = JSON.parse(s.serialize(g, {}));
  assert.strictEqual(o.rw.b6side, true); assert.ok(Number.isInteger(o.os) && o.ar.length === 2);
  const h = s.deserialize(s.serialize(g, {})); assert.strictEqual(JSON.stringify([h.os, h.ar]), JSON.stringify([g.os, g.ar]));
  const g0 = s.newGame('hard', { seed: 5, rework: { b6side: false } }), o0 = JSON.parse(s.serialize(g0, {}));
  assert.ok(!('b6side' in o0.rw) && !('os' in o0) && !('ar' in o0), 'a b6side-off save is a v2.91 save');
  assert.strictEqual(s.deserialize(s.serialize(g0, {})).rw.b6side, false);
});

test('b6side: both AIs start deciding at the same time; off, side 1 half a second later (v2.91)', () => {
  const s = loadSim();
  const on = s.newGame('hard', { seed: 3, autoPlayer: true, autoDiff: 'hard' }), off = s.newGame('hard', { seed: 3, autoPlayer: true, autoDiff: 'hard', rework: { b6side: false } });
  assert.strictEqual(JSON.stringify(on.sides.map(x => x.aiT)), '[1,1]');
  assert.strictEqual(JSON.stringify(off.sides.map(x => x.aiT)), '[1,1.5]');
});

test('b6side: a faction\'s AI rolls the same dice in either slot (its personality and opening); off, the slot decides', () => {
  const s = loadSim(); let sameOn = 0, sameOff = 0, n = 0;
  for (let seed = 1; seed <= 40; seed++) for (const [a, b] of [['lastfist', 'bloomhost'], ['axiarchs', 'lastfist']]) {
    const P = rw => { const x = s.newGame('hard', { seed, autoPlayer: true, autoDiff: 'hard', factions: [a, b], rework: rw }), y = s.newGame('hard', { seed, autoPlayer: true, autoDiff: 'hard', factions: [b, a], rework: rw }); return [x.sides[0].persona.kind === y.sides[1].persona.kind, x.sides[1].persona.kind === y.sides[0].persona.kind]; };
    const on = P({}), off = P({ b6side: false }); n += 2;
    sameOn += on[0] + on[1]; sameOff += off[0] + off[1];
  }
  assert.strictEqual(sameOn, n, 'on: always the same personality whichever side it plays');
  assert.ok(sameOff < n, `off: the slot changes it (${sameOff} of ${n} the same)`);
});

test('b6side: spacing spots for a direct side are mirror images for the two sides (v2.91 walked both the same way)', () => {
  const s = loadSim(), W = s.cur().L;
  for (const rw of [{}, { b6side: false }]) {
    const g = s.rangeGame({ factions: ['lastfist', 'lastfist'], rework: rw });
    const a = [], b = [];
    for (let i = 0; i < 6; i++) { a.push(s.spawnUnit(g, 0, 'rifle', 600, 10)); b.push(s.spawnUnit(g, 1, 'rifle', W - 600, 10)); }
    const pa = s.ctlPack(g, 0, a, 600, 10, false), pb = s.ctlPack(g, 1, b, W - 600, 10, false);
    const mirrored = a.every((e, i) => { const p = pa.get(e.id), q = pb.get(b[i].id); return Math.abs(p[0] - (W - q[0])) < 1e-6 && Math.abs(p[1] - q[1]) < 1e-6; });
    assert.strictEqual(mirrored, !!(rw.b6side ?? true), rw.b6side === false ? 'off: both sides walk the ring the same way' : 'on: mirrored');
  }
});

// A Skitterling mirror (12 against 12, exactly mirrored, both on Attack): in v2.91 the side whose units come first in the
// entity list won every seed; with b6side the update order is a fresh seeded shuffle each tick and that advantage is gone
test('b6side: in a mirrored fight, the side listed first no longer wins every time', () => {
  const s = loadSim();
  const run = (rw, seed) => {
    const g = s.rangeGame({ seed, factions: ['bloomhost', 'bloomhost'], rework: rw });
    for (let i = 0; i < 12; i++) s.rangeUnit(g, 0, 'skitterling', 680 - (i % 4) * 16, ((i >> 2) - 1) * 18);
    for (let i = 0; i < 12; i++) s.rangeUnit(g, 1, 'skitterling', 1020 + (i % 4) * 16, ((i >> 2) - 1) * 18);
    s.rangeMode(g, 0, 'attack'); s.rangeMode(g, 1, 'attack');
    const alive = k => g.ents.some(e => e.side === k && e.hp > 0);
    for (let k = 0; k < 60 * 60 && alive(0) && alive(1); k++) s.rangeStep(g);
    return alive(0) && !alive(1) ? 0 : alive(1) && !alive(0) ? 1 : -1;
  };
  const off = [], on = [];
  for (let seed = 1; seed <= 8; seed++) { off.push(run({ b6side: false }, seed)); on.push(run({}, seed)); }
  assert.ok(off.every(w => w === 0), `v2.91: side 0 (listed first) wins every seed: ${off}`);
  const w0 = on.filter(w => w === 0).length, w1 = on.filter(w => w === 1).length;
  assert.ok(w0 >= 2 && w1 >= 2, `on: both sides win some (${w0}-${w1})`);
});

// Part B, the Artillery counterplay behind REWORK.b6art (per game, g.rw.b6art)
test('b6art: on by default, per game, saved only when on; the Artillery plays by its per-game definition (UDEF untouched)', () => {
  const s = loadSim();
  assert.strictEqual(s.rwInit().b6art, true);
  const on = s.rangeGame({ factions: ['lastfist', 'lastfist'], rework: { b6d: false, b6elane: false, b6e: false, b6fai: false, b6f: false } }), off = s.rangeGame({ factions: ['lastfist', 'lastfist'], rework: { b6art: false, b6hq: false, b6c: false, b6d: false, b6elane: false, b6e: false, b6fai: false, b6f: false } }); // v2.94: batch 6d off (its Artillery salvo, tests/rework-6d.test.js)
  assert.strictEqual(s.rwD(on, 'artillery').dmg, s.ART6.dmg); assert.strictEqual(s.rwD(on, 'artillery').cd, s.ART6.cd);
  assert.strictEqual(s.rwD(off, 'artillery').dmg, 60); assert.strictEqual(s.rwD(off, 'artillery').cd, 3.2);
  assert.strictEqual(s.UDEF.artillery.dmg, 60, 'UDEF untouched'); assert.strictEqual(s.UDEF.artillery.minRange, 110, 'its minimum range kept');
  const g0 = s.newGame('normal', { seed: 5, rework: { b6art: false, b6hq: false, b6c: false } }); assert.ok(!('b6art' in JSON.parse(s.serialize(g0, {})).rw));
  assert.strictEqual(s.deserialize(s.serialize(g0, {})).rw.b6art, false);
  assert.strictEqual(JSON.parse(s.serialize(s.newGame('normal', { seed: 5 }), {})).rw.b6art, true);
});

// One diver of side 1 at 900, a Tank and a deployed Artillery of side 0 the same distance away: an AI's diver takes the Artillery
// (with b6art), a player's (direct control) or a b6art-off game's takes what it took before
function diverPick(s, type, rw, ai) {
  const g = s.rangeGame({ seed: 4, factions: ['lastfist', type === 'riftstalker' ? 'axiarchs' : 'bloomhost'], rework: rw });
  const t = s.rangeUnit(g, 0, 'tank', 760, -40), a = s.rangeUnit(g, 0, 'artillery', 760, 40), sn = s.rangeUnit(g, 0, 'sniper', 760, 0); a.dep = 2;
  const u = s.rangeUnit(g, 1, type, 900, 0); if (ai) g.sides[1].direct = false;
  const foes = g.ents.filter(e => e.side === 0);
  if (type === 'leaper') return s.latchPick(g, u, foes, 200);
  if (type === 'riftstalker') return s.rsPick(g, u, foes, u.u, u.v, 0, 200);
  if (type === 'gorebore') return s.borePick(g, u, foes, u.u, u.v, 300);
  return null;
}
test('b6art: an AI\'s Leaper, Riftstalker and Gorebore take a deployed Artillery in reach first; a player\'s and b6art-off ones as before', () => {
  const s = loadSim();
  for (const type of ['leaper', 'riftstalker', 'gorebore']) {
    assert.strictEqual(diverPick(s, type, {}, true).type, 'artillery', `${type}, AI, b6art on`);
    const was = diverPick(s, type, { b6art: false, b6hq: false, b6c: false }, true).type;
    assert.strictEqual(diverPick(s, type, {}, false).type, was, `${type}, a player's: as before (${was})`);
  }
  assert.strictEqual(diverPick(s, 'leaper', { b6art: false, b6hq: false, b6c: false }, true).type, 'tank', 'v2.91: a Leaper took the heaviest host');
  assert.strictEqual(diverPick(s, 'riftstalker', { b6art: false, b6hq: false, b6c: false }, true).type, 'artillery', 'v2.91: a Riftstalker already struck the longest-range unit');
  // not deployed (moving): no preference
  const g = s.rangeGame({ seed: 4, factions: ['lastfist', 'bloomhost'] }); s.rangeUnit(g, 0, 'tank', 760, -40); const a = s.rangeUnit(g, 0, 'artillery', 760, 40); a.dep = 0;
  const u = s.rangeUnit(g, 1, 'leaper', 900, 0); g.sides[1].direct = false;
  assert.strictEqual(s.latchPick(g, u, g.ents.filter(e => e.side === 0), 200).type, 'tank');
});

test('b6art: an AI\'s Dreadthorn charges at a deployed Artillery in reach', () => {
  const s = loadSim();
  const g = s.rangeGame({ seed: 4, factions: ['lastfist', 'bloomhost'] });
  for (let i = 0; i < 4; i++) s.rangeUnit(g, 0, 'rifle', 760, -60 + i * 10);
  const a = s.rangeUnit(g, 0, 'artillery', 760, 60); a.dep = 2;
  const u = s.rangeUnit(g, 1, 'dreadthorn', 900, 0); g.sides[1].direct = false; u.po = undefined;
  s.setStance(g, 1, 'attack');
  const foes = g.ents.filter(e => e.side === 0);
  assert.ok(s.trampleGo(g, u, s.rwD(g, 'dreadthorn'), 'attack', null, foes, null, g.sides[1]), 'it charges');
  assert.ok(u.crV > 0, `toward the Artillery (south), not the Marines: heading ${u.crU.toFixed(2)}, ${u.crV.toFixed(2)}`);
});

test('Test Range: a switch for each part of batch 6b', () => {
  const HTML = readHtml();
  assert.match(HTML, /\['b6side', 'Batch 6b side'\]/); assert.match(HTML, /\['b6art', 'Batch 6b Artillery'\]/);
});
