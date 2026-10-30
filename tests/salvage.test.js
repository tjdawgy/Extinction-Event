// Salvage (v2.30, docs/LASTFIST.md): Last Fist's signature mechanic. A non-temporary unit of either side that dies within
// SALVAGE.r of a Last Fist unit or building (never the dying unit itself) gives that Last Fist side SALVAGE.pct of its credit
// cost, rounded, at most SALVAGE.cap per side per game minute. Temporary units and buildings give nothing; each side of a
// mirror salvages on its own; the "+N" pop-up is shown only to the salvaging side's player, where they can see; pct 0
// switches it all off; saves v27 keep the totals and this minute's cap. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const U = sim.UDEF, S = sim.SALVAGE, MID = sim.L / 2;
const quiet = (f0 = 'lastfist', f1 = 'bloomhost') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; g.t = 30; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 1000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; e.cd = 1e6; return e; };
const seeAll = g => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } };
const credits = g => Array.from(g.sides, s => s.res.c);
const scraps = g => g.fx.filter(f => f.k === 'scrap');
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };

test('the SALVAGE block holds every number: 10%, within 200, at most 200 credits per side per game minute', () => {
  assert.deepStrictEqual({ ...S }, { pct: 0.1, r: 200, cap: 200, per: 60 });
});

test('an enemy unit destroyed near a Last Fist unit gives 10% of its credit cost, rounded; the enemy (Bloomhost) gets nothing', () => {
  const g = quiet(); seeAll(g);
  put(g, 0, 'rifle', MID);
  const foe = put(g, 1, 'bulwark', MID + 100), c0 = credits(g);
  sim.kill(g, foe, 0);
  assert.deepStrictEqual(credits(g), [c0[0] + Math.round(U.bulwark.cost.c * 0.1), c0[1]]); // 190 → 19
  const nw = put(g, 1, 'needlewing', MID + 50); sim.kill(g, nw, 0); // 70 → 7
  assert.strictEqual(g.sides[0].salv.tot, 19 + 7);
  assert.strictEqual(g.log.tot[0].salv, 26, 'recorded for the match report');
  assert.strictEqual(g.sides[1].salv.tot, 0);
});

test('a Last Fist unit lost near other Last Fist forces gives the same 10% (own losses count); a nearby building counts as forces', () => {
  const g = quiet(); seeAll(g);
  put(g, 0, 'rifle', MID);
  const tank = put(g, 0, 'tank', MID + 120), c0 = credits(g)[0];
  sim.kill(g, tank, 1);
  assert.strictEqual(credits(g)[0], c0 + 20, 'Tank 200 → 20');
  // the HQ alone: its edge, not its centre, is what counts (effDist)
  const h = quiet(); const hq = h.sides[0].hq, r = put(h, 0, 'rifle', hq.u + hq.half + 190), c1 = credits(h)[0];
  sim.kill(h, r, 1);
  assert.strictEqual(credits(h)[0], c1 + 5, 'Rifleman 50 → 5, next to the HQ');
});

test('a lone unit dying with no other Last Fist forces nearby gives nothing; nor does anything just outside 200', () => {
  const g = quiet(); seeAll(g);
  const lone = put(g, 0, 'tank', MID), foe = put(g, 1, 'bulwark', MID + 30), c0 = credits(g);
  sim.kill(g, lone, 1);
  assert.deepStrictEqual(credits(g), c0, 'the dying unit is never "nearby" for its own death');
  put(g, 0, 'rifle', MID + 30 - 201); // 201 away from the Bulwark
  sim.kill(g, foe, 0);
  assert.deepStrictEqual(credits(g), c0, 'out of range');
  const foe2 = put(g, 1, 'bulwark', MID + 30 - 201 + 200); // exactly 200
  sim.kill(g, foe2, 0);
  assert.strictEqual(credits(g)[0], c0[0] + 19, '200 is in range');
  assert.strictEqual(scraps(g).length, 1);
});

test('temporary units (Emergency Brood Skitterlings, Cloudwing offspring) and buildings give nothing', () => {
  const g = quiet(); seeAll(g);
  put(g, 0, 'rifle', MID);
  const brood = put(g, 1, 'skitterling', MID + 40); brood.temp = g.t + 20; brood.tLife = 20; brood.tSrc = 'brood';
  const kid = put(g, 1, 'needlewing', MID + 40); kid.temp = g.t + 12; kid.tLife = 12; kid.tSrc = 'cloud'; kid.kid = 1;
  const c0 = credits(g);
  sim.kill(g, brood, 0); sim.kill(g, kid, 0);
  assert.deepStrictEqual(credits(g), c0);
  const b = g.sides[1].hq; put(g, 0, 'rifle', b.u - b.half - 20);
  sim.kill(g, b, 0); // the enemy HQ, with a Last Fist unit next to it
  assert.deepStrictEqual(credits(g), c0, 'buildings never give salvage');
  assert.strictEqual(g.sides[0].salv.tot, 0); assert.strictEqual(scraps(g).length, 0);
  // an expired temporary unit leaves without giving anything either
  const t2 = put(g, 1, 'skitterling', MID + 40); t2.temp = g.t + 0.01; t2.tLife = 1; t2.tSrc = 'brood';
  step(g, 0.1);
  assert.strictEqual(g.sides[0].salv.tot, 0);
});

test('the cap: at most 200 salvage credits per side per game minute; the rest is lost; the next minute starts again', () => {
  const g = quiet(); seeAll(g); g.t = 60;
  put(g, 0, 'rifle', MID);
  const c0 = credits(g)[0];
  for (let i = 0; i < 12; i++) sim.kill(g, put(g, 1, 'bulwark', MID + 50), 0); // 12 × 19 = 228
  assert.strictEqual(credits(g)[0], c0 + 200, 'capped at 200');
  assert.strictEqual(g.sides[0].salv.tot, 200);
  assert.strictEqual(scraps(g).at(-1).n, 200 - 10 * 19, 'the last paying kill shows what it really gave');
  const n = scraps(g).length;
  sim.kill(g, put(g, 1, 'bulwark', MID + 50), 0);
  assert.strictEqual(scraps(g).length, n, 'nothing to show once the minute is spent');
  g.t = 119.9; sim.kill(g, put(g, 1, 'bulwark', MID + 50), 0);
  assert.strictEqual(g.sides[0].salv.tot, 200, 'still the same game minute (60–120 s)');
  g.t = 120; sim.kill(g, put(g, 1, 'bulwark', MID + 50), 0);
  assert.strictEqual(g.sides[0].salv.tot, 219, 'a new minute');
  assert.strictEqual(g.log.tot[0].salv, 219);
});

test('storm deaths count like any other (no killer)', () => {
  const g = quiet(); seeAll(g);
  put(g, 0, 'rifle', MID);
  const foe = put(g, 1, 'bulwark', MID + 60), c0 = credits(g)[0];
  sim.damage(g, foe, 1e6, 'storm', -1);
  assert.ok(foe.dead);
  assert.strictEqual(credits(g)[0], c0 + 19);
});

test('mirror: each Last Fist side salvages on its own when it has forces in range', () => {
  const g = quiet('lastfist', 'lastfist'); seeAll(g);
  put(g, 0, 'rifle', MID - 100); put(g, 1, 'rifle', MID + 100);
  const c0 = credits(g);
  sim.kill(g, put(g, 1, 'tank', MID), 0);
  sim.kill(g, put(g, 0, 'tank', MID), 1);
  assert.deepStrictEqual(credits(g), [c0[0] + 40, c0[1] + 40], 'both sides take 20 from each Tank');
  sim.kill(g, put(g, 1, 'tank', MID - 250), 0); // only side 0's Rifleman is in range (150 away; side 1's is 350 away)
  assert.deepStrictEqual(credits(g), [c0[0] + 60, c0[1] + 40]);
  assert.deepStrictEqual(Array.from(g.sides, s => s.salv.tot), [60, 40]);
});

test('the pop-up: only the salvaging side\'s player sees it, and only where they can see; no event tells the opponent', () => {
  // the enemy (side 1) is Last Fist and salvages; the player (side 0) is Bloomhost and sees the whole field
  const g = quiet('bloomhost', 'lastfist'); seeAll(g); g.events.length = 0;
  put(g, 1, 'rifle', MID);
  sim.kill(g, put(g, 0, 'bulwark', MID - 40), 1);
  const f = scraps(g)[0];
  assert.ok(f && f.side === 1 && f.n === 19);
  assert.strictEqual(sim.scrapShown(g, f, 0), false, 'never drawn for the opponent, even in plain view');
  assert.strictEqual(sim.scrapShown(g, f, 1), true);
  assert.ok(!g.events.some(e => JSON.stringify(e).includes('salv') || JSON.stringify(e).includes('scrap')), JSON.stringify(g.events));
  // the player's own salvage: shown where they can see, hidden where they can't
  const h = quiet(); seeAll(h);
  put(h, 0, 'rifle', MID);
  sim.kill(h, put(h, 1, 'bulwark', MID + 40), 0);
  const p = scraps(h)[0];
  assert.strictEqual(sim.scrapShown(h, p, 0), true);
  h.fog[0].vis.fill(0);
  assert.strictEqual(sim.scrapShown(h, p, 0), false, 'not where the player can\'t see');
  step(h, 2); assert.strictEqual(scraps(h).length, 0, 'it fades');
});

test('SALVAGE.pct 0 switches it off completely: no credits, no pop-ups, no totals', () => {
  const S0 = loadSim(); S0.SALVAGE.pct = 0;
  const g = S0.newGame('normal', { factions: ['lastfist', 'lastfist'] }); g.countdown = 0; g.t = 30; for (const f of g.fog) f.vis.fill(1);
  const a = S0.spawnUnit(g, 0, 'rifle', MID, 0), b = S0.spawnUnit(g, 1, 'rifle', MID + 50, 0); a.cd = b.cd = 1e6;
  const c0 = Array.from(g.sides, s => s.res.c);
  S0.kill(g, S0.spawnUnit(g, 1, 'tank', MID + 20, 0), 0); S0.kill(g, S0.spawnUnit(g, 0, 'tank', MID + 20, 0), 1);
  assert.deepStrictEqual(Array.from(g.sides, s => s.res.c), c0);
  assert.deepStrictEqual(Array.from(g.sides, s => s.salv.tot), [0, 0]); assert.strictEqual(g.fx.filter(f => f.k === 'scrap').length, 0);
  assert.doesNotMatch(S0.factionDesc('lastfist'), /Salvage/, 'nor does the setup menu mention it');
  assert.match(sim.factionDesc('lastfist'), /Salvage: any unit destroyed near your forces returns 10% of its credit cost/);
});

test('saves v27 keep the totals and this minute\'s cap; a v26 save starts both at 0; the match report and log show it', () => {
  assert.ok(sim.SAVE_VER >= 27); // v28 (v2.32) loads the same way
  const g = quiet(); seeAll(g); g.t = 70;
  put(g, 0, 'rifle', MID);
  for (let i = 0; i < 10; i++) sim.kill(g, put(g, 1, 'bulwark', MID + 50), 0); // 190 this minute
  const g2 = sim.deserialize(sim.serialize(g, {}));
  assert.deepStrictEqual({ ...g2.sides[0].salv }, { tot: 190, m: 1, n: 190 });
  sim.kill(g2, put(g2, 1, 'bulwark', MID + 50), 0);
  assert.strictEqual(g2.sides[0].salv.tot, 200, 'the cap carries over: only 10 more this minute');
  assert.strictEqual(g2.log.tot[0].salv, 200);
  const o = JSON.parse(sim.serialize(g, {})); o.v = 26; for (const s of o.sides) delete s.salv; for (const T of o.log.tot) delete T.salv;
  const g3 = sim.deserialize(JSON.stringify(o));
  assert.deepStrictEqual(Array.from(g3.sides, s => ({ ...s.salv })), [{ tot: 0, m: -1, n: 0 }, { tot: 0, m: -1, n: 0 }]);
  assert.strictEqual(g3.log.tot[0].salv, 0);
  sim.kill(g3, put(g3, 1, 'bulwark', MID + 50), 0);
  assert.strictEqual(g3.sides[0].salv.tot, 19, 'and works after loading');
  const txt = sim.logText(g2, { version: sim.VERSION, diff: 'Normal', persona: 'Turtle', result: 'Victory' });
  assert.match(txt, /You: credits .*; salvage 200 credits/);
  assert.doesNotMatch(txt.split('\n').find(l => l.startsWith('Enemy:')), /salvage/, 'Bloomhost has no salvage line');
});

test('a full Last Fist vs Bloomhost match salvages, and the money still adds up', () => {
  const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const S1 = loadSim({ random: mul(11) });
  const g = S1.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'turtle', autoPersona: 'aggressor', factions: ['lastfist', 'bloomhost'] });
  for (let i = 0; i < 30 * 600 && !g.over; i++) S1.update(g, 1 / 30);
  assert.ok(g.sides[0].salv.tot > 0, 'Last Fist salvaged');
  assert.strictEqual(g.sides[1].salv.tot, 0, 'Bloomhost never does');
  assert.strictEqual(g.log.tot[0].salv, g.sides[0].salv.tot);
});
