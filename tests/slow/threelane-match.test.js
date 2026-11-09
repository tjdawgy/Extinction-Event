// v2.70 (Phase 1, Three-Lane): six Hard-vs-Hard matches on Three-Lane, one per faction pairing and both sides. Every match
// ends by 27:00, at least 4 of 6 at an HQ; both sides use all three lanes; the centre node, a watchtower and a forward pad
// are used; the AI runs both capture groups at once at some point; no ground unit ever stands inside a wall.
// (The 100-match numbers are in KNOWN_ISSUES.md "Three-Lane".)
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('../load-sim');

const sim = loadSim();
const F = ['lastfist', 'bloomhost', 'axiarchs'];
test('Hard vs Hard on Three-Lane: decided matches, all three lanes, the crossings and the centre', () => {
  let hq = 0, both = 0, fwdUsed = 0;
  for (let m = 0; m < 6; m++) {
    const fac = [F[m % 3], F[(m + 1 + (m >> 2)) % 3]];
    const g = sim.newGame('hard', { map: 'threelane', seed: 600 + m, autoPlayer: true, autoDiff: 'hard', factions: m % 2 ? fac.reverse() : fac });
    g.countdown = 0;
    const lanes = [new Set(), new Set()], centre = new Set(), towers = new Set(); let fwd = 0, inside = 0, two = 0;
    for (let i = 0; i < 60 * (sim.EXT.limit + 5) && !g.over; i++) {
      sim.update(g, sim.TICK); g.events.length = 0;
      if (i % 300 === 0) {
        for (const e of g.ents) {
          if (e.kind === 'u' && e.hp > 0 && e.lane != null && e.u > 700 && e.u < 1600) lanes[e.side].add(e.lane);
          if (e.kind === 'u' && e.hp > 0 && !sim.UDEF[e.type].air && !e.leaping && sim.navShut(e.u, e.v)) inside++;
          if (e.kind === 'b' && e.slot >= sim.FWD_SLOT) fwd++;
        }
        if (g.nodes[1].owner !== null) centre.add(g.nodes[1].owner);
        for (const n of g.nodes) if (n.type === 'watchtower' && n.owner !== null) towers.add(n.owner);
        if (g.sides.some(s => s.capT && s.capT2)) two++;
      }
    }
    assert.ok(g.over && g.t <= sim.EXT.limit + 0.1, `match ${m}: over by 27:00 (${g.t.toFixed(0)} s)`);
    assert.ok(lanes.every(L => L.size === 3), `match ${m}: both sides used all three lanes`);
    assert.ok(centre.size >= 1 && towers.size >= 1, `match ${m}: the centre and a watchtower were taken`);
    assert.strictEqual(inside, 0, `match ${m}: nobody inside a wall`);
    if (fwd > 0) fwdUsed++;
    if (two > 0) both++;
    if (g.winner >= 0 && g.result && g.result.how === 'hq') hq++;
  }
  assert.ok(hq >= 4, `most matches are decided by an HQ falling (${hq} of 6)`);
  assert.ok(fwdUsed >= 4, `forward pads built on in most matches (${fwdUsed} of 6)`);
  assert.ok(both >= 4, `two capture groups at once in most matches (${both} of 6)`);
});
