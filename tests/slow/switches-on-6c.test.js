// v2.93 (batch 6c, Part A2): switches-on counterparts of the LONG tests pinned to rework switches off (full AI matches), which
// are too slow for tests/switches-on-6c.test.js (the fast suite's counterparts; inventory: audit/logs-p1/pinned6c/pinned-tests.md).
// 1. Five AI-match tests re-run from their own files on a SIM whose switches all stay on (writes to REWORK ignored).
// 2. tests/slow/twolane-ai.test.js (pinned with b6side and b6art off): the same intent with every switch on, over its own seeds.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const Module = require('module');
const LS = require('../load-sim');
const loadSim = LS.loadSim;
function heldOn(opts) {
  const s = loadSim(opts), R = s.REWORK;
  for (const k of Object.keys(R)) Object.defineProperty(R, k, { get: () => true, set: () => {}, enumerable: true, configurable: true });
  return s;
}
function rerun(file, names) {
  const found = new Set(), real = Module._load;
  const fake = (name, opts, fn) => {
    if (typeof opts === 'function') { fn = opts; opts = {}; }
    const n = names.find(x => name.startsWith(x)); if (!n) return;
    found.add(n); test(`on: ${name}`, opts, (...a) => fn(...a));
  };
  LS.loadSim = heldOn;
  Module._load = function (req) { return req === 'node:test' ? fake : real.apply(this, arguments); };
  try { require(path.join(__dirname, '..', file)); } finally { Module._load = real; LS.loadSim = loadSim; }
  test(`on: ${file}: every listed test found for the re-run`, () => assert.deepStrictEqual(names.filter(n => !found.has(n)), []));
}
rerun('abilities.test.js', ['v2.11: Repair Pulse is never wasted by the AI']); // tests/abilities.test.js:181
rerun('ax-abilities.test.js', ['the AI casts all three under one shared cooldown']); // tests/ax-abilities.test.js:203
// v2.94: tests/ax-trees.test.js:150 is pinned with batch 6d off (an intended effect: with b6ai on the forced Last Fist Turtle is the
// batch 6d Hard Turtle and wins before the Axiarch AI reaches its T2 paths); its switches-on counterpart is tests/slow/switches-on-6d.test.js
rerun('bh-trees.test.js', ['the AI maps its Last Fist path taste onto Bloomhost']); // tests/bh-trees.test.js:138
rerun('stats.test.js', ['a full AI-vs-AI match: samples every 10 s']); // tests/stats.test.js:15

// tests/slow/twolane-ai.test.js with every switch on: six Hard-vs-Hard Two-Lane matches (one per pairing and side order) end by
// 27:00, both sides use both lanes, the centre and a watchtower are taken, nobody stands in the ridge, forward pads are built on in
// most, and most end by an HQ falling. Seeds TWO_ON (its own; with b6side on each faction's AI has its own dice).
const TWO_ON = 520;
test('on: Hard vs Hard on Two-Lane: decided matches, both lanes, the centre and forward pads (every switch on)', () => {
  const sim = loadSim(); assert.ok(Object.values(sim.REWORK).every(v => v === true));
  const F = ['lastfist', 'bloomhost', 'axiarchs'];
  let hq = 0, fwdUsed = 0;
  for (let m = 0; m < 6; m++) {
    const fac = [F[m % 3], F[(m + 1 + (m >> 2)) % 3]];
    const g = sim.newGame('hard', { map: 'twolane', seed: TWO_ON + m, autoPlayer: true, autoDiff: 'hard', factions: m % 2 ? fac.reverse() : fac });
    g.countdown = 0;
    const lanes = [new Set(), new Set()], centre = new Set(), towers = new Set(); let fwd = 0, inside = 0;
    for (let i = 0; i < 60 * (sim.EXT.limit + 5) && !g.over; i++) {
      sim.update(g, sim.TICK); g.events.length = 0;
      if (i % 300 === 0) {
        for (const e of g.ents) {
          if (e.kind === 'u' && e.hp > 0 && e.lane != null && e.u > 600 && e.u < 1600) lanes[e.side].add(e.lane);
          if (e.kind === 'u' && e.hp > 0 && !sim.UDEF[e.type].air && !e.leaping && sim.navShut(e.u, e.v)) inside++;
          if (e.kind === 'b' && e.slot >= sim.FWD_SLOT) fwd++;
        }
        if (g.nodes[1].owner !== null) centre.add(g.nodes[1].owner);
        for (const n of g.nodes) if (n.type === 'watchtower' && n.owner !== null) towers.add(n.owner);
      }
    }
    assert.ok(g.over && g.t <= sim.EXT.limit + 0.1, `match ${m}: over by 27:00 (${g.t.toFixed(0)} s)`);
    assert.ok(lanes.every(L => L.size === 2), `match ${m}: both sides used both lanes`);
    assert.ok(centre.size >= 1, `match ${m}: the centre node was taken`);
    assert.ok(towers.size >= 1, `match ${m}: a watchtower was taken`);
    if (fwd > 0) fwdUsed++;
    assert.strictEqual(inside, 0, `match ${m}: nobody inside the ridge`);
    if (g.winner >= 0 && g.result && g.result.how === 'hq') hq++;
  }
  assert.ok(hq >= 4, `most matches are decided by an HQ falling (${hq} of 6)`);
  assert.ok(fwdUsed >= 4, `forward pads built on in most matches (${fwdUsed} of 6)`);
  sim.useMap('classic');
});
