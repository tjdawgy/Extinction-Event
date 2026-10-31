#!/usr/bin/env node
// Phase 7a validation, on seeds the search never used: v2.40's Hard (hard240) and v2.41's Hard against the Greedy bot (3 x 3
// faction pairings, n seeds each); v2.41's Hard against the Default field (same faction, paired, nd matches); Hard vs Hard
// across factions (paired, nh matches per pairing). Prints each result as it lands.
//   node audit/sim/validate7a.js [--n=14] [--nd=40] [--nh=40]
const { greedy, fmt } = require('./greedyrun');
const { search } = require('./hardsearch');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const F = ['lastfist', 'bloomhost', 'axiarchs'];
(async () => {
  const n = +(arg('n') || 14), nd = +(arg('nd') || 40), nh = +(arg('nh') || 40), only = (arg('only') || 'g240,g,d,h').split(',');
  const pr = (k, r) => console.log(`${k}: ${fmt(r)}\n  pairs (AI<bot): ${Object.entries(r.pairs).map(([p, x]) => `${p} ${x.w}-${x.l}${x.d ? '-' + x.d : ''}`).join(', ')}`);
  if (only.includes('g240')) pr('Hard v2.40 vs Greedy', await greedy({ ai: 'hard240' }, { n, seed: 96000 }));
  if (only.includes('g')) pr('Hard v2.41 vs Greedy', await greedy({ ai: 'hard' }, { n, seed: 96000 }));
  if (only.includes('d')) for (const f of F) { const x = (await search(f, [{ ai: 'hard' }], { n: nd, seed: 76000 }))[0]; console.log(`Hard v2.41 vs Default, ${f}: ${x.w}-${x.l}-${x.d}`); }
  if (only.includes('h')) for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { const x = (await search(F[i], [{ ai: 'hard' }], { n: nh, seed: 77000, vs: { ai: 'hard' }, vsFaction: F[j] }))[0]; console.log(`Hard vs Hard, ${F[i]} vs ${F[j]}: ${x.w}-${x.l}-${x.d}`); }
})().catch(e => { console.error(e); process.exit(1); });
