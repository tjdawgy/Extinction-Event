#!/usr/bin/env node
// Phase 0 item 3 (v2.50): the same seed must play the same match. Each seed is played twice in two fresh VM contexts
// whose Math.random differ (so only the game's own seeded streams can make them agree), at the game's fixed tick
// (TICK, 1/60 s), and a SHA-1 of the serialized game state (the match log left out: it is a record) is compared every
// 100 ticks. Any difference fails, and names the first tick where the two runs part.
//   node audit/sim/determinism.js [--seeds=1,2,3] [--ticks=36000] [--diff=hard]
// The default plays one match per faction pairing (6 seeds, mirrors and cross-faction), up to 10 minutes of game time each.
const crypto = require('crypto');
const { loadSim } = require('./load');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const F = ['lastfist', 'bloomhost', 'axiarchs'], PAIRS = [];
for (let i = 0; i < 3; i++) for (let j = i; j < 3; j++) PAIRS.push([F[i], F[j]]);

function hashes(seed, factions, ticks, diff, noise) {
  const S = loadSim(noise), out = [];
  const g = S.newGame(diff, { seed, autoPlayer: true, autoDiff: diff, factions });
  g.countdown = 0;
  for (let i = 1; i <= ticks && !g.over; i++) {
    S.update(g, S.TICK); g.events.length = 0;
    if (i % 100 === 0) { const o = JSON.parse(S.serialize(g, {})); delete o.log; out.push(crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex')); }
  }
  return { out, t: g.t, over: g.over, winner: g.winner };
}
function check(seed, factions, ticks, diff) {
  const a = hashes(seed, factions, ticks, diff, 1000 + seed), b = hashes(seed, factions, ticks, diff, 777777 + seed);
  const n = Math.max(a.out.length, b.out.length);
  for (let k = 0; k < n; k++) if (a.out[k] !== b.out[k]) return { ok: false, tick: (k + 1) * 100, a, b };
  return { ok: true, n, a };
}
if (require.main === module) {
  const ticks = +arg('ticks', 36000), diff = arg('diff', 'hard');
  const seeds = arg('seeds') ? arg('seeds').split(',').map(Number) : PAIRS.map((_, i) => 101 + i);
  let bad = 0;
  seeds.forEach((seed, i) => {
    const fac = PAIRS[i % PAIRS.length], r = check(seed, fac, ticks, diff);
    if (r.ok) console.log(`seed ${seed} ${fac.join(' vs ')}: ${r.n} hashes match (${Math.round(r.a.t)} s${r.a.over ? `, ended, winner ${r.a.winner}` : ''})`);
    else { bad++; console.log(`seed ${seed} ${fac.join(' vs ')}: DIFFERENT from tick ${r.tick}`); }
  });
  console.log(bad ? `FAIL: ${bad} of ${seeds.length} seeds diverged` : `PASS: all ${seeds.length} seeds identical`);
  process.exit(bad ? 1 : 0);
}
module.exports = { check, hashes };
