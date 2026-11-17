// v2.89 (faction rework batch 5a: Last Fist art, the Marine rename, the size fix, aircraft pose caching). Art and text only:
// the rename keeps the internal id, nothing else in the SIM moves (tests/determinism.test.js pins every fingerprint), and the
// new art and the pose cache live in the RENDER section. These checks read the built index.html.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim, readHtml } = require('./load-sim');
const HTML = readHtml();
const R0 = HTML.indexOf('/* ===================== SIM END'), RENDER = HTML.slice(R0, HTML.indexOf('/* ===================== RENDER END', R0) > 0 ? HTML.indexOf('/* ===================== RENDER END', R0) : undefined);

test('the Rifleman is the Marine in every text; its internal id stays rifle', () => {
  const s = loadSim();
  assert.strictEqual(s.UDEF.rifle.name, 'Marine');
  assert.ok(!/rifleman|riflemen/i.test(HTML), 'no "Rifleman" or "Riflemen" anywhere in the built game');
  assert.match(HTML, /const PLURAL = \{ rifle: 'Marines'/);
  assert.match(HTML, /'Marines ×2 queued'/);
  assert.match(HTML, /tiers: \[null, 'Trains Marines'/);
});

test('every Last Fist unit has new art; the oversized flyers are scaled about their muzzle points', () => {
  for (const [t, f] of [['rifle', 'dMarine'], ['heavy', 'dHeavy5'], ['sniper', 'dSniper5'], ['tank', 'dTank5'], ['artillery', 'dArt5'], ['titan', 'dTitan5'], ['flame', 'dFlame5'], ['hydra', 'dHydra5'],
    ['aircraft', 'dGun5'], ['interceptor', 'dInter5'], ['leviathan', 'dLev5'], ['medic', 'dMedic5'], ['drone', 'dDrone5']])
    assert.ok(new RegExp(`DRAW_U\\.${t} = ${f};`).test(HTML), `${t} is drawn by ${f}`);
  assert.match(HTML, /ART5\.lev = 1\.0;/);
  assert.match(HTML, /const ART5_WR = 0\.7, ART5_SOV = 0\.88;/);
  assert.ok(RENDER.includes('c.translate(0, 10); c.scale(ART5.lev'), 'the Leviathan scales about its bay (MUZ.leviathan (0, -10): art y +10)');
  assert.match(HTML, /leviathan: \[0, -10\][^\n]*worldrender: \[0, -8\][^\n]*sovereign: \[0, -8\] \};/, 'the SIM muzzles are unchanged');
});

test('aircraft poses: each cached type has a cycle and a box; the cache key carries the art and the colours', () => {
  const cyc = RENDER.match(/const AIR_CYC = \{([^}]*)\}/)[1], box = RENDER.match(/const AIR_BOX = \{([^}]*)\}/)[1];
  const types = [...cyc.matchAll(/(\w+): \[/g)].map(m => m[1]);
  for (const t of ['aircraft', 'interceptor', 'leviathan', 'medic', 'drone']) assert.ok(types.includes(t), `${t} is cached`);
  for (const t of ['cloudwing', 'worldrender', 'voidcarrier', 'sovereign']) assert.ok(!types.includes(t), `${t} draws live (no common cycle)`);
  for (const t of types) assert.ok(new RegExp(`\\b${t}: \\[-`).test(box), `${t} has a box`);
  assert.match(RENDER, /const key = p\.key \+ sprArtKey\(u\.type, T\);/);
  assert.match(RENDER, /return '\|' \+ id \+ T\.main \+ T\.hull \+ T\.light \+ T\.glow;/);
});
