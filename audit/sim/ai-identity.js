#!/usr/bin/env node
// v2.73 (controls redesign): the AI must play exactly as an earlier build on every map, with and without conditions. Each
// case plays one seeded Hard-vs-Hard (or --diff) match to the end (or --ticks) in this build and in a reference copy of the
// game (--ref, e.g. v2.72's index.html) and compares a SHA-1 of the serialized state every 100 ticks (left out, as in
// classic-identity.js: the match log, the save's v and map, each side's persona).
//   node audit/sim/ai-identity.js --ref=path/to/v2.72/index.html [--ticks=97200] [--diff=hard] [--only=twolane] [--seeds=314,315]
const crypto = require('crypto');
const { loadSim } = require('./load');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const F = [['lastfist', 'bloomhost'], ['bloomhost', 'axiarchs'], ['axiarchs', 'lastfist']];
const CASES = [ // map, conditions, seed: every map plain, and every condition each map allows
  ['classic', [], 301], ['classic', ['heavyFog'], 302], ['classic', ['richCenter'], 303], ['classic', ['scarce'], 304],
  ['twolane', [], 311], ['twolane', ['heavyFog'], 312], ['twolane', ['richCenter'], 313], ['twolane', ['scarce'], 314], ['twolane', ['meteors'], 315],
  ['threelane', [], 321], ['threelane', ['heavyFog'], 322], ['threelane', ['richCenter'], 323], ['threelane', ['scarce'], 324], ['threelane', ['meteors'], 325],
];
function play(file, seed, map, cond, factions, ticks, diff) {
  const S = loadSim(seed, { file }), out = [];
  const g = S.newGame(diff, { seed, map, cond, autoPlayer: true, autoDiff: diff, factions });
  g.countdown = 0;
  for (let i = 1; i <= ticks && !g.over; i++) {
    S.update(g, S.TICK); g.events.length = 0;
    if (i % 100 === 0 || g.over) {
      const o = JSON.parse(S.serialize(g, {})); delete o.log; delete o.v; delete o.map;
      for (const sd of o.sides) delete sd.persona;
      out.push(crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex'));
    }
  }
  return { out, t: g.t, over: g.over, winner: g.winner, version: S.VERSION };
}
if (require.main === module) {
  const ref = arg('ref'); if (!ref) { console.error('--ref=<reference index.html> is required'); process.exit(2); }
  const ticks = +arg('ticks', 97200), diff = arg('diff', 'hard'), only = arg('only'), seeds = arg('seeds') ? arg('seeds').split(',').map(Number) : null; // --seeds: only these cases
  let bad = 0, n = 0;
  CASES.filter(c => !only || c[0] === only).forEach(([map, cond, seed], i) => {
    if (seeds && !seeds.includes(seed)) return;
    const fac = F[i % F.length], a = play(undefined, seed, map, cond, fac, ticks, diff), b = play(ref, seed, map, cond, fac, ticks, diff);
    const m = Math.max(a.out.length, b.out.length); let k = 0; n++;
    while (k < m && a.out[k] === b.out[k]) k++;
    const name = `${map}${cond.length ? ' + ' + cond.join(', ') : ''} (seed ${seed}, ${fac.join(' vs ')})`;
    if (k === m) console.log(`${name}: ${m} checkpoints match v${b.version} (${Math.floor(a.t / 60)}:${String(Math.round(a.t % 60)).padStart(2, '0')}, ${a.over ? `ended, winner ${a.winner}` : 'not ended'})`);
    else { bad++; console.log(`${name}: DIFFERENT from checkpoint ${k + 1} (tick ~${(k + 1) * 100})`); }
  });
  console.log(bad ? `FAIL: ${bad} of ${n} cases differ` : `PASS: all ${n} cases play exactly as the reference`);
  process.exit(bad ? 1 : 0);
}
module.exports = { play, CASES };
