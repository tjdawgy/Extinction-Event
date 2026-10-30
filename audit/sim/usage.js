#!/usr/bin/env node
// Unit usage: in how many matches each side trains each of its faction's units (mirror matches, one preset).
//   node audit/sim/usage.js --ai=default --n=24 [--seed=1] [--jobs=4] [--json=out.json]
const { runSet } = require('./run');
const { loadSim } = require('./load');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
async function usage(ai, n, seed, jobs) {
  const S = loadSim(1), out = {};
  for (const f of ['lastfist', 'bloomhost', 'axiarchs']) {
    const set = await runSet({ a: `${f}:${ai}:random`, b: `${f}:${ai}:random`, n, seed, jobs });
    const sides = set.matches.flatMap(m => [m.A, m.B]), units = Object.keys(S.UDEF).filter(t => (S.UDEF[t].fac || 'lastfist') === f && !S.UDEF[t].noTrain);
    out[f] = { matches: n, sides: sides.length, wins: set.summary.wins, avgLength: set.summary.avgLength, timeouts: set.summary.timeouts, units: {} };
    for (const t of units) { const k = sides.filter(s => s.trained[t] > 0).length; out[f].units[t] = { sides: k, pct: Math.round(1000 * k / sides.length) / 10, total: sides.reduce((a, s) => a + (s.trained[t] || 0), 0) }; }
  }
  return out;
}
module.exports = { usage };
if (require.main === module) (async () => {
  const r = await usage(arg('ai') || 'default', +(arg('n') || 24), +(arg('seed') || 1), +(arg('jobs') || 4));
  if (arg('json')) require('fs').writeFileSync(arg('json'), JSON.stringify(r, null, 1));
  for (const f in r) { console.log(`${f}: ${r[f].matches} mirror matches, wins ${JSON.stringify(r[f].wins)}, timeouts ${r[f].timeouts}`); for (const t in r[f].units) console.log(`  ${t.padEnd(12)} ${String(r[f].units[t].pct).padStart(5)}% of sides, ${r[f].units[t].total} trained`); }
})();
