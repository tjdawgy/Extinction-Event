// v2.95 (batch 6e): the switches-on counterpart of the slow test pinned to b6elane off (audit/logs-p1/slow6e/report.md).
//
// tests/slow/threelane-match.test.js pins b6elane off: with batch 6e's Axiarch lane play on, an Axiarch AI keeps its army on one
// focus lane at a time (with at most a one-unit screen elsewhere), so over a match its units reach all three lanes in only 5 of 10
// matches (10 of 10 with b6elane off; every other side 29 of 30 either way, and every other check unchanged over 20 seeds). The
// intent, checked here with every switch on and the same six seeded matches: every match ends by 27:00, most by an HQ falling;
// every other faction's side uses all three lanes; the Axiarch side moves its one army between lanes (two lanes at least); the
// centre and a watchtower are taken; nobody stands inside a wall; forward pads and two capture groups at once in most matches
// (the Axiarchs run one capture group; their opponent still runs two).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('../load-sim');

const sim = loadSim();
const F = ['lastfist', 'bloomhost', 'axiarchs'];
test('on (6e): Hard vs Hard on Three-Lane: decided matches; the other factions use all three lanes, the Axiarchs move one army between lanes (every switch on)', () => {
  assert.ok(Object.values(sim.REWORK).every(v => v === true), 'every switch on');
  let hq = 0, both = 0, fwdUsed = 0;
  for (let m = 0; m < 6; m++) {
    const fac = [F[m % 3], F[(m + 1 + (m >> 2)) % 3]];
    const g = sim.newGame('hard', { map: 'threelane', seed: 606 + m, autoPlayer: true, autoDiff: 'hard', factions: m % 2 ? fac.reverse() : fac });
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
    g.sides.forEach((sd, s) => {
      if (sd.faction === 'axiarchs') assert.ok(lanes[s].size >= 2, `match ${m}: the Axiarch side moved its army between lanes (${[...lanes[s]]})`);
      else assert.strictEqual(lanes[s].size, 3, `match ${m}: ${sd.faction} used all three lanes (${[...lanes[s]]})`);
    });
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
