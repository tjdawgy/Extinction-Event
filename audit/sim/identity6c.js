// Batch 6c (v2.93), Part C4: AI self-play is unaffected by the start-side and colour work. The same Hard vs Hard matches (every
// switch at its default) on this build and on the Part B build (EE_B: another index.html, Part C's SIM changes left out), the
// state hashed every 100 ticks (log and stats left out, as in the 6a identity check); they must be identical.
//   EE_B=/path/to/partB/index.html node audit/sim/identity6c.js
const crypto = require('crypto'), { loadSim, simSource } = require('./load');
const B = process.env.EE_B; if (!B) throw new Error('EE_B: the Part B build');
const play = (file, map, fac, seed) => {
  const S = loadSim(seed, { file }); const g = S.newGame('hard', { seed, map, autoPlayer: true, autoDiff: 'hard', factions: fac }); g.countdown = 0;
  const hs = []; for (let k = 1; !g.over && g.t < 1700; k++) { S.update(g, S.TICK); g.events.length = 0; if (k % 100 === 0) { const o = JSON.parse(S.serialize(g, {})); delete o.log; delete o.stats; hs.push(crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 12)); } }
  return { hs, t: Math.round(g.t), w: g.winner };
};
let ok = 0, n = 0;
for (const [map, fac, seed] of [['classic', ['lastfist', 'bloomhost'], 7], ['classic', ['axiarchs', 'lastfist'], 8], ['twolane', ['bloomhost', 'axiarchs'], 9], ['twolane', ['lastfist', 'axiarchs'], 10], ['threelane', ['axiarchs', 'bloomhost'], 11], ['threelane', ['bloomhost', 'lastfist'], 12]]) {
  const a = play(undefined, map, fac, seed), b = play(B, map, fac, seed), same = a.hs.length === b.hs.length && a.hs.every((h, i) => h === b.hs[i]);
  n++; if (same) ok++;
  console.log(`${map} ${fac.join(' vs ')} seed ${seed}: ${a.t} s, winner ${a.w}; ${a.hs.length} checkpoints; ${same ? 'identical' : 'DIFFERENT'}`);
}
console.log(`${ok} of ${n} identical`);
