#!/usr/bin/env node
// v2.63 (multi-lane engine): Classic must play exactly as an earlier build. Each seed is played to the end (or --ticks) in
// this build and in a reference copy of the game (--ref, e.g. v2.60's index.html), Hard against Hard, and a SHA-1 of the
// serialized state is compared every 100 ticks. Left out of the hash, because they are records or labels, not play:
//   log (the match log), v and map (the save format: v31 adds the map's id and version), and each side's persona
//   (v2.61 marks Hard's persona with the ladder flag; Hard's choices are unchanged, which the hashes then prove).
//   node audit/sim/classic-identity.js --ref=path/to/v2.60/index.html [--seeds=201,202,203] [--ticks=97200]
const crypto = require('crypto');
const { loadSim } = require('./load');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const F = [['lastfist', 'bloomhost'], ['bloomhost', 'axiarchs'], ['axiarchs', 'lastfist']];
function play(file, seed, factions, ticks) {
  const S = loadSim(seed, { file }), out = [];
  const g = S.newGame('hard', { seed, autoPlayer: true, autoDiff: 'hard', factions });
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
  const ticks = +arg('ticks', 97200), seeds = (arg('seeds') || '201,202,203').split(',').map(Number);
  let bad = 0;
  seeds.forEach((seed, i) => {
    const fac = F[i % F.length], a = play(undefined, seed, fac, ticks), b = play(ref, seed, fac, ticks);
    const n = Math.max(a.out.length, b.out.length); let k = 0;
    while (k < n && a.out[k] === b.out[k]) k++;
    if (k === n) console.log(`seed ${seed} ${fac.join(' vs ')}: ${n} checkpoints match v${b.version} (${Math.round(a.t)} s, ${a.over ? `ended, winner ${a.winner}` : 'not ended'})`);
    else { bad++; console.log(`seed ${seed} ${fac.join(' vs ')}: DIFFERENT from checkpoint ${k + 1} (tick ~${(k + 1) * 100})`); }
  });
  console.log(bad ? `FAIL: ${bad} of ${seeds.length} seeds differ` : `PASS: all ${seeds.length} seeds play exactly as the reference`);
  process.exit(bad ? 1 : 0);
}
module.exports = { play };
