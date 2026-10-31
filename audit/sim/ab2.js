#!/usr/bin/env node
// Runs one cross pairing with an experiment's code on the balance run's seeds (balance.js: seed 50000 + 100·i(A) + 10·i(B)),
// so it pairs match for match with balance-base. Prints wins and named weapons' damage per match.
//   node audit/sim/ab2.js lastfist bloomhost "FLAME.aim=false" flame [n]
const { runSet } = require('./run');
const [a, b, code, weapons = '', n = '40'] = process.argv.slice(2), FAC = ['lastfist', 'bloomhost', 'axiarchs'];
(async () => {
  const side = f => ({ faction: f, ai: 'default', persona: 'random' });
  const set = await runSet({ a: side(a), b: side(b), n: +n, seed: 50000 + 100 * FAC.indexOf(a) + 10 * FAC.indexOf(b), maxT: 1800, diag: true, code: code === '-' ? undefined : code, quiet: true });
  const w = set.summary.wins, dm = k => Object.fromEntries(weapons.split(',').filter(Boolean).map(x => [x, Math.round(set.matches.reduce((s, m) => s + (((m[k].diag || {}).dmg || {})[x + '>U'] || []).reduce((p, q) => p + q, 0) + (((m[k].diag || {}).dmg || {})[x + '>B'] || []).reduce((p, q) => p + q, 0), 0) / set.matches.length)]));
  console.log(`${a} vs ${b} [${code}]: ${w.A}-${w.B}-${w.draw} (A ${Math.round(1000 * w.A / (w.A + w.B)) / 10}%), length ${set.summary.avgLength} s, dmg A ${JSON.stringify(dm('A'))} B ${JSON.stringify(dm('B'))}`);
})();
