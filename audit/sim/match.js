// One headless match on the real SIM (load.js), fully determined by its seed. Returns what the runner aggregates.
// spec: { seed, sides: [A, B], diff, maxT, sample }, A/B: { faction, ai: 'default'|'legacy', persona: kind|'random' }.
// Side 0 is the player's slot played by the autoplayer, side 1 the normal AI: both run the same AI brain.
// A match still going at maxT game seconds (20 minutes by default) counts as a draw.
const { loadSim } = require('./load');
const INSTRUMENT = require('./instrument');

function runMatch(spec) {
  const { seed, sides, diff = 'hard', maxT = 1200, sample = 30 } = spec;
  const S = loadSim(seed, { file: spec.file, map: spec.map, instrument: (spec.diag ? INSTRUMENT : '') + (spec.code ? `\n;${spec.code}` : '') || undefined }); // code: an experiment's changes to SIM values (audit only)
  const per = p => (p && p !== 'random' ? p : undefined);
  if (sides[1].bot && !sides[0].bot) throw new Error('a scripted bot on side 1 needs one on side 0 (bot against bot)');
  const { mulberry } = require('./load');
  const mkBot = (x, k) => x.bot === 'strat' ? require('./strat').stratBot(S, Object.assign({ rnd: mulberry((seed | 0) * 2 + 1 + k) }, x.botOpts || {})) : require('./greedy').greedyBot(S, x.botOpts || {}); // Phase 7b: 'strat' (strat.js), else Greedy
  const bot = sides[0].bot ? mkBot(sides[0], 0) : null; // Phase 7a: a scripted bot (Greedy) in the player's slot
  const bot1 = sides[1].bot ? mkBot(sides[1], 1) : null; // bot against bot: side 1's AI is switched off
  const g = S.newGame(sides[1].diff || diff, { seed, autoPlayer: !bot, autoDiff: sides[0].diff || diff, // v2.61: a side may name its own difficulty (the ladder)
    factions: [sides[0].faction, sides[1].faction],
    autoAi: sides[0].ai, ai: sides[1].ai, autoPersona: per(sides[0].persona), persona: per(sides[1].persona) });
  g.countdown = 0;
  if (bot1) g.sides[1].bot = true; // v2.43: a side the AI brain doesn't run (the rally rule treats it as a player's)
  if (bot1 && spec.holdStart !== false) S.setStance(g, 1, 'hold'); // v2.42 (phase 7b): a bot on side 1 starts on Hold like the player's side, not on the AI's Retreat (which holds fire)
  // optional per-side dial overrides (A.dial: { scout: 0, fix: { leash: false } }) for experiments
  for (let i = 0; i < 2; i++) { const o = sides[i].dial, P = g.sides[i].persona; if (o && P && P.dial) { for (const k in o) if (k === 'paths') P.paths = Object.assign({}, P.paths, o.paths); else if (k !== 'fix') P.dial[k] = o[k]; if (o.fix && P.dial.fix) Object.assign(P.dial.fix, o.fix); } }
  const samples = [];
  const tech = [{}, {}]; // first game time each side had a finished production building at T2 / T3 (by role and path), and its signature buildings
  const techScan = () => {
    for (const e of g.ents) if (e.kind === 'b' && e.built && e.hp > 0 && (e.side === 0 || e.side === 1)) {
      const k = e.type + (e.path ? ':' + e.path : '') + ':T' + e.tier;
      if (e.tier >= 2 || e.type === 'sigA' || e.type === 'sigB') { if (tech[e.side][k] === undefined) tech[e.side][k] = Math.round(g.t); }
    }
  };
  const take = () => {
    techScan();
    const army = [0, 0];
    for (const e of g.ents) if (e.kind === 'u' && e.hp > 0) army[e.side] += S.UDEF[e.type].cost.c + S.UDEF[e.type].cost.e;
    samples.push({ t: Math.round(g.t), bank: g.sides.map(sd => Math.round(sd.res.c)), energy: g.sides.map(sd => Math.round(sd.res.e)),
      earned: g.log.tot.map(T => Math.round(T.earn[0])), army, nodes: g.nodes.map(n => n.owner), pop: [0, 1].map(s => S.popUsed(g, s)), cap: [0, 1].map(s => S.popCap(g, s)) });
  };
  take();
  let next = sample;
  while (!g.over && g.t < maxT) {
    S.update(g, 1 / 30);
    if (bot) bot(g, 0, 1 / 30);
    if (bot1) { g.sides[1].aiT = 1e12; bot1(g, 1, 1 / 30); }
    g.events.length = 0;
    if (g.t >= next) { take(); next += sample; }
  }
  const draw = !g.over || g.winner < 0;
  const res = {
    seed, t: Math.round(g.t), winner: draw ? -1 : g.winner, how: g.over ? (g.result || {}).how : 'timeout', timeout: !g.over,
    reason: g.over ? (g.result || {}).reason : undefined, score: g.over && g.result && g.result.score ? [...g.result.score] : undefined, loser: g.over && g.result ? g.result.loser : undefined, // v2.55: the side whose HQ the storm took in a storm draw // v2.48: a storm draw keeps the score for the record
    sides: [0, 1].map(s => {
      const T = g.log.tot[s], P = g.sides[s].persona || {}, alive = {};
      for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && !e.temp) alive[e.type] = (alive[e.type] || 0) + 1;
      const spent = Object.values(T.spent).reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
      return { faction: g.sides[s].faction, ai: P.preset || 'legacy', persona: P.kind, trained: T.trained, lost: T.lost, alive,
        earned: [Math.round(T.earn[0]), Math.round(T.earn[1])], spent: spent.map(Math.round), salvage: Math.round(T.salv || 0),
        nodeTime: Math.round(T.nodeTime), dmg: g.stats ? Math.round(g.stats.sides[s].dmg) : undefined /* v2.56: damage dealt (the stats tracker) */, buildings: T.bBuilt, tech: tech[s], killed: T.killed, lostTo: T.lostTo || {}, ab: T.ab, mites: T.mites, echoes: T.echoes || 0, bkHeal: Math.round(T.bkHeal || 0), od: T.od || 0,
        bot: s === 0 ? (bot ? bot.log : undefined) : (bot1 ? bot1.log : undefined),
        diag: S.diag ? { dmg: S.diag.dmg[s], kills: S.diag.kills[s] } : undefined, aiLog: g.sides[s].aiLog ? { attacks: g.sides[s].aiLog.attacks, firstAttack: g.sides[s].aiLog.firstAttack, abil: g.sides[s].aiLog.abil || {} } : null };
    }),
    samples,
  };
  return res;
}
module.exports = { runMatch };
