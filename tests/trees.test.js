// Upgrade trees (v2.13, Barracks): a path per building at T2, what each path unlocks, Mass Deployment pairs, Drilled
// Riflemen, selling resets the path, the AI's choice, saves and migration, ghosts and the match log. SIM only.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
function base(nBarracks = 2) {
  const g = sim.newGame('normal');
  for (const s of [0, 1]) { g.sides[s].aiT = 1e9; g.sides[s].res.c = g.sides[s].res.e = 1e5; }
  g.t = 200;
  for (let i = 0; i < nBarracks; i++) sim.tryBuild(g, 0, 'barracks');
  sim.tryBuild(g, 0, 'habitat'); sim.tryBuild(g, 0, 'habitat');
  for (const b of g.ents) if (b.kind === 'b') { b.built = true; b.progress = 1; }
  sim.setStance(g, 0, 'hold');
  return { g, bar: g.ents.filter(e => e.type === 'barracks') };
}
const finishUp = (g, b) => { b.upProg = 0.9999; step(g, 0.2); };

test('a Barracks picks its path at T2 (required), per building; T3 continues it; selling resets it', () => {
  const { g, bar: [a, b] } = base();
  assert.match(sim.tryUpgrade(g, 0, a).msg, /Choose a path/);
  assert.ok(sim.tryUpgrade(g, 0, a, 'A').ok); assert.ok(sim.tryUpgrade(g, 0, b, 'B').ok);
  assert.strictEqual(a.path, null, 'set when the upgrade finishes'); assert.strictEqual(a.upPath, 'A');
  finishUp(g, a); finishUp(g, b);
  assert.deepStrictEqual([a.tier, a.path, b.tier, b.path], [2, 'A', 2, 'B']);
  assert.ok(sim.tryUpgrade(g, 0, a, 'B').ok, 'T3 takes no path argument (ignored)'); finishUp(g, a);
  assert.deepStrictEqual([a.tier, a.path], [3, 'A'], 'T3 keeps the path');
  const slot = b.slot; sim.trySell(g, 0, b); step(g, 0.1);
  sim.tryBuild(g, 0, 'barracks', slot); const nb = g.ents.find(e => e.type === 'barracks' && e.slot === slot && e.hp > 0);
  assert.strictEqual(nb.path, null, 'rebuilt: no path');
});

test('what each path unlocks: Heavy (A, T2) and Sniper (A, T3); never from a Mass Deployment Barracks', () => {
  const { g, bar: [a, b] } = base();
  assert.match(sim.tryTrain(g, 0, 'heavy').msg, /Requires Barracks T2 · Specialists/);
  sim.tryUpgrade(g, 0, b, 'B'); finishUp(g, b);
  assert.ok(!sim.tryTrain(g, 0, 'heavy').ok, 'a Mass Barracks makes no Heavies');
  sim.tryUpgrade(g, 0, b); finishUp(g, b);
  assert.ok(!sim.tryTrain(g, 0, 'sniper').ok, 'nor Snipers at T3');
  sim.tryUpgrade(g, 0, a, 'A'); finishUp(g, a);
  assert.ok(sim.tryTrain(g, 0, 'heavy').ok);
  assert.ok(!sim.tryTrain(g, 0, 'sniper').ok, 'Sniper needs Specialists T3');
  sim.tryUpgrade(g, 0, a); finishUp(g, a);
  assert.ok(sim.tryTrain(g, 0, 'sniper').ok);
  assert.ok(a.queue.includes('heavy') && a.queue.includes('sniper') && !b.queue.length, 'queued at the Specialists Barracks');
});

test('Mass Deployment: a Rifleman order is a pair (double cost and army size), trained together in 1.5× the time; Riflemen go there first', () => {
  const { g, bar: [a, b] } = base();
  sim.tryUpgrade(g, 0, b, 'B'); finishUp(g, b);
  const c0 = g.sides[0].res.c, n0 = g.ents.filter(e => e.type === 'rifle').length;
  const r = sim.tryTrain(g, 0, 'rifle');
  assert.ok(r.ok); assert.strictEqual(r.msg, 'Riflemen ×2 queued');
  assert.strictEqual(c0 - g.sides[0].res.c, 100);
  assert.deepStrictEqual([...b.queue], ['rifle', 'rifle'], 'at the Mass Barracks'); assert.strictEqual(a.queue.length, 0);
  step(g, 4.2);
  assert.strictEqual(g.ents.filter(e => e.type === 'rifle').length - n0, 0, 'a pair takes 1.5× a Rifleman\'s time (6 s)');
  step(g, 2);
  assert.strictEqual(g.ents.filter(e => e.type === 'rifle').length - n0, 2, 'both at once after 6 s');
  // the queue still holds five at most: a pair needs two places
  for (let i = 0; i < 2; i++) sim.tryTrain(g, 0, 'rifle');
  b.queue.push('rifle');
  assert.match(sim.tryTrain(g, 0, 'rifle').msg, /queued/, 'goes to the T1 Barracks when the Mass one is full');
  assert.strictEqual(a.queue.length, 1);
});

test('Drilled Riflemen (Mass Deployment T3): +35% HP, +10% damage, capture nodes 1.5× faster', () => {
  const { g, bar: [, b] } = base();
  sim.tryUpgrade(g, 0, b, 'B'); finishUp(g, b); sim.tryUpgrade(g, 0, b); finishUp(g, b);
  sim.tryTrain(g, 0, 'rifle'); step(g, 6.2);
  const vets = g.ents.filter(e => e.type === 'rifle' && e.vet);
  assert.strictEqual(vets.length, 2);
  assert.ok(Math.abs(vets[0].maxHp - 70 * 1.35) < 1e-9 && vets[0].hp === vets[0].maxHp);
  // capture: 4 Drilled Riflemen fill a node 1.5× faster (sqrt of the weights) than 4 plain ones
  const rate = vet => { const h = sim.newGame('normal'); h.sides[0].aiT = h.sides[1].aiT = 1e9; const n = h.nodes[1];
    for (let i = 0; i < 4; i++) { const u = sim.spawnUnit(h, 0, 'rifle', n.u + i * 5, 0); u.vet = vet; u.holdU = u.u; u.holdV = 0; }
    sim.setStance(h, 0, 'hold'); step(h, 2); return n.prog; };
  assert.ok(Math.abs(rate(1) / rate(0) - Math.sqrt(1.5)) < 0.02, `${rate(1)} vs ${rate(0)}`);
});

test('the AI: Easy follows its personality; Normal and Hard switch to Specialists against armor; a second copy takes the other path', () => {
  const P = kind => ({ kind, paths: { barracks: kind === 'aggressor' || kind === 'trickster' ? 'B' : 'A' } });
  const g = sim.newGame('easy'); const b = { type: 'barracks', side: 1, kind: 'b', hp: 1 };
  assert.strictEqual(sim.aiPickPath(g, 1, b, P('aggressor'), []), 'B');
  assert.strictEqual(sim.aiPickPath(g, 1, b, P('turtle'), []), 'A');
  const tanks = [{ type: 'tank', w: 1 }, { type: 'tank', w: 1 }, { type: 'rifle', w: 1 }];
  const h = sim.newGame('hard');
  assert.strictEqual(sim.aiPickPath(h, 1, b, P('aggressor'), []), 'B');
  assert.strictEqual(sim.aiPickPath(h, 1, b, P('aggressor'), tanks), 'A', 'armor: Specialists for Heavies');
  h.sides[1].res.c = h.sides[1].res.e = 1e5; sim.tryBuild(h, 1, 'barracks'); const first = h.ents.find(e => e.side === 1 && e.type === 'barracks'); first.path = 'A';
  assert.strictEqual(sim.aiPickPath(h, 1, b, P('turtle'), []), 'B', 'the second Barracks takes the other path');
  const f = sim.newGame('hard', { forcePath: [null, { barracks: 'B' }] });
  assert.strictEqual(sim.aiPickPath(f, 1, b, P('turtle'), tanks), 'B', 'forced (matrix test hook)');
});

test('saves keep paths; a v12 save migrates (T2/T3 Barracks → Specialists, an upgrade in progress → Specialists)', () => {
  const { g, bar: [a, b] } = base();
  sim.tryUpgrade(g, 0, a, 'B'); finishUp(g, a); sim.tryUpgrade(g, 0, b, 'A');
  const g2 = sim.deserialize(sim.serialize(g, {}));
  const [a2, b2] = g2.ents.filter(e => e.type === 'barracks');
  assert.deepStrictEqual([a2.path, b2.upPath], ['B', 'A']);
  const o = JSON.parse(sim.serialize(g, {})); o.v = 12;
  for (const e of o.ents) { delete e.path; delete e.upPath; delete e.vet; }
  const g3 = sim.deserialize(JSON.stringify(o)), [a3, b3] = g3.ents.filter(e => e.type === 'barracks');
  assert.deepStrictEqual([a3.path, b3.path, b3.upPath], ['A', null, 'A']);
  assert.ok(g3.ents.filter(e => e.kind === 'u').every(u => u.vet === 0));
  assert.ok(g3.ents.filter(e => e.kind === 'b' && e.type !== 'barracks').every(e => e.path === null));
});

test('ghosts remember the path; the match log names it', () => {
  const { g, bar: [a] } = base(1);
  sim.tryUpgrade(g, 0, a, 'A'); finishUp(g, a);
  const gh = sim.ghostOf ? sim.ghostOf(a) : null;
  if (gh) assert.strictEqual(gh.path, 'A');
  const lines = sim.logLines(g, 0).map(l => l.txt);
  assert.ok(lines.some(t => /^Barracks T2 · Specialists \d\d:\d\d → \d\d:\d\d$/.test(t)), lines.join(' | '));
});
