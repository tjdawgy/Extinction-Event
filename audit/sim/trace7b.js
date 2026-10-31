#!/usr/bin/env node
// Phase 7b: one bot match traced every 15 s: army value and position, deaths by type and place (whose half), nodes, bank.
//   node audit/sim/trace7b.js <factionA> <factionB> [seed] [botA json] [botB json] [code]
const { loadSim } = require('./load');
const [fa, fb, seed = 95000, ba = '{"bot":"greedy"}', bb = '{"bot":"greedy"}', code] = process.argv.slice(2);
const S = loadSim(+seed, code ? { instrument: code } : {});
const mk = (j) => { const o = JSON.parse(j); return o.bot === 'strat' ? require('./strat').stratBot(S, o) : require('./greedy').greedyBot(S, o); };
const bots = [mk(ba), mk(bb)];
const g = S.newGame('hard', { factions: [fa, fb] }); g.countdown = 0;
const deaths = [];
const k0 = S.update;
let lastHp = new Map();
let next = 0;
while (!g.over && g.t < 1800) {
  const before = new Map(g.ents.filter(e => e.kind === 'u').map(e => [e.id, e]));
  S.update(g, 1 / 30); bots[0](g, 0, 1 / 30); g.sides[1].aiT = 1e12; bots[1](g, 1, 1 / 30); g.events.length = 0;
  const now = new Set(g.ents.map(e => e.id));
  for (const [id, e] of before) if (!now.has(id) && !e.temp) deaths.push({ t: g.t, side: e.side, type: e.type, u: Math.round(e.u) });
  if (g.t >= next) {
    next += 15;
    const line = [0, 1].map(s => { const us = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && !e.temp); const v = us.reduce((a, e) => a + S.UDEF[e.type].cost.c + S.UDEF[e.type].cost.e, 0); const mu = us.length ? Math.round(us.reduce((a, e) => a + e.u, 0) / us.length) : '-'; return `${v}@${mu} b${Math.round(g.sides[s].res.c)} ${g.sides[s].stance}`; });
    const d = deaths.filter(x => x.t > g.t - 15); const ds = [0, 1].map(s => d.filter(x => x.side === s).map(x => x.type[0] + x.type[1] + '@' + x.u).join(','));
    console.log(`${Math.round(g.t)}s  A ${line[0]} | B ${line[1]} | nodes ${g.nodes.map(n => n.owner === null ? '-' : n.owner).join('')} | A lost ${ds[0]} | B lost ${ds[1]}`);
  }
}
console.log('winner', g.winner, Math.round(g.t), JSON.stringify(bots.map(b => b.log)));
