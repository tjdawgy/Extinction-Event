// v2.94 (batch 6d): switches-on counterparts of the slow tests pinned to batch 6d off (audit/logs-p1/slow6d/report.md).
//
// tests/ax-trees.test.js:150 ("the AI maps its Last Fist paths onto the Axiarchs and trains path units") pins b6ai and b6d off:
// its Axiarch Hard AI faces a forced Last Fist Turtle, which with b6ai on is the batch 6d Hard Turtle and wins 15 of 20 there,
// mostly before the Axiarchs reach their T2 paths (an intended effect). The intent, checked here with every switch on: the
// Axiarch Hard AI (Economist and Trickster) takes a Barracks-role and a War Factory-role path in every match, both of each over
// the matches, and trains path units. Its Last Fist opponent plays on Normal (b6ai is Hard only, so it plays v2.93's Turtle).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('../load-sim');
const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

test('on (6d): the Axiarch Hard AI maps its Last Fist paths onto the Axiarchs and trains path units (every switch on)', () => {
  const pathUnits = new Set(['riftstalker', 'parallax', 'lancer', 'marksman', 'severance', 'worldbreaker', 'gravemantle', 'eventide']);
  const all = new Set(), units = new Set();
  for (let seed = 1; seed <= 6; seed++) {
    const S = loadSim({ random: mul(seed) }); assert.ok(Object.values(S.REWORK).every(v => v === true), 'every switch on');
    const g = S.newGame('hard', { autoPlayer: true, autoDiff: 'normal', persona: seed % 2 ? 'trickster' : 'economist', autoPersona: 'turtle', factions: ['lastfist', 'axiarchs'] });
    const paths = new Set();
    for (let i = 0; i < 30 * 1700 && !g.over; i++) { S.update(g, 1 / 30); for (const e of g.ents) if (e.side === 1 && e.kind === 'b' && e.path) paths.add(e.type + e.path); g.events.length = 0; }
    assert.ok(g.over, `seed ${seed}: the match ends`);
    assert.ok([...paths].some(p => p.startsWith('barracks')) && [...paths].some(p => p.startsWith('factory')), `seed ${seed}: a Barracks and a War Factory path (${[...paths]})`);
    for (const p of paths) all.add(p);
    for (const t in g.sides[1].aiLog.trained) if (pathUnits.has(t)) units.add(t);
  }
  assert.ok(['barracksA', 'barracksB', 'factoryA', 'factoryB'].every(p => all.has(p)), `paths taken: ${[...all]}`);
  assert.ok(units.size >= 3, `path units trained: ${[...units]}`);
});
