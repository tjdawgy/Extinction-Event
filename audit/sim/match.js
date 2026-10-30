// One headless match on the real SIM (load.js), fully determined by its seed. Returns what the runner aggregates.
// spec: { seed, sides: [A, B], diff, maxT, sample }, A/B: { faction, ai: 'default'|'legacy', persona: kind|'random' }.
// Side 0 is the player's slot played by the autoplayer, side 1 the normal AI: both run the same AI brain.
// A match still going at maxT game seconds (20 minutes by default) counts as a draw.
const { loadSim } = require('./load');

function runMatch(spec) {
  const { seed, sides, diff = 'hard', maxT = 1200, sample = 30 } = spec;
  const S = loadSim(seed, { file: spec.file });
  const per = p => (p && p !== 'random' ? p : undefined);
  const g = S.newGame(diff, { autoPlayer: true, autoDiff: diff, factions: [sides[0].faction, sides[1].faction],
    autoAi: sides[0].ai, ai: sides[1].ai, autoPersona: per(sides[0].persona), persona: per(sides[1].persona) });
  g.countdown = 0;
  const samples = [];
  const take = () => {
    const army = [0, 0];
    for (const e of g.ents) if (e.kind === 'u' && e.hp > 0) army[e.side] += S.UDEF[e.type].cost.c + S.UDEF[e.type].cost.e;
    samples.push({ t: Math.round(g.t), bank: g.sides.map(sd => Math.round(sd.res.c)), energy: g.sides.map(sd => Math.round(sd.res.e)),
      earned: g.log.tot.map(T => Math.round(T.earn[0])), army, nodes: g.nodes.map(n => n.owner) });
  };
  take();
  let next = sample;
  while (!g.over && g.t < maxT) {
    S.update(g, 1 / 30);
    g.events.length = 0;
    if (g.t >= next) { take(); next += sample; }
  }
  const draw = !g.over || g.winner < 0;
  const res = {
    seed, t: Math.round(g.t), winner: draw ? -1 : g.winner, how: g.over ? (g.result || {}).how : 'timeout', timeout: !g.over,
    sides: [0, 1].map(s => {
      const T = g.log.tot[s], P = g.sides[s].persona || {}, alive = {};
      for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && !e.temp) alive[e.type] = (alive[e.type] || 0) + 1;
      const spent = Object.values(T.spent).reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
      return { faction: g.sides[s].faction, ai: P.preset || 'legacy', persona: P.kind, trained: T.trained, lost: T.lost, alive,
        earned: [Math.round(T.earn[0]), Math.round(T.earn[1])], spent: spent.map(Math.round), salvage: Math.round(T.salv || 0),
        nodeTime: Math.round(T.nodeTime), buildings: T.bBuilt, aiLog: g.sides[s].aiLog ? { attacks: g.sides[s].aiLog.attacks, firstAttack: g.sides[s].aiLog.firstAttack, abil: g.sides[s].aiLog.abil || {} } : null };
    }),
    samples,
  };
  return res;
}
module.exports = { runMatch };
