#!/usr/bin/env node
// Phase 7c validation, on seeds the tuning never used (the index.html it loads decides the numbers; EE_HTML: another copy).
// Parts (--only): g Hard vs Greedy (3 x 3, n seeds per pairing: 3n per Hard faction), d Hard vs Default (same faction,
// paired, nd), h Hard vs Hard (paired, nh per pairing), s Hard vs the Rush, Turtle and Contain bots (ns seeds), e Easy and
// Normal vs Greedy (ne seeds per pairing), r the phase 5 Rifleman rush against Normal and Easy (nr per faction),
// x the signature-building A/B: Hard as is against Hard with no signature building (sigAt 99999), vs Greedy, k the openings
// Hard picks.
//   node audit/sim/validate7c.js [--ai=hard] [--n=8] [--nd=12] [--nh=12] [--ns=2] [--ne=3] [--nr=24] [--only=g,d,h,s,e,r,x,k]
const { greedy, fmt } = require('./greedyrun');
const { search } = require('./hardsearch');
const { stratField } = require('./hardsearch7b');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const F = ['lastfist', 'bloomhost', 'axiarchs'];
(async () => {
  const ai = arg('ai') || 'hard', n = +(arg('n') || 8), nd = +(arg('nd') || 12), nh = +(arg('nh') || 12), ns = +(arg('ns') || 2), ne = +(arg('ne') || 3), nr = +(arg('nr') || 24);
  const only = (arg('only') || 'g,d,h,s,e,r,x,k').split(',');
  const pr = (k, r) => console.log(`${k}: ${fmt(r)}\n  pairs (AI<bot): ${Object.entries(r.pairs).map(([p, x]) => `${p} ${x.w}-${x.l}${x.d ? '-' + x.d : ''}`).join(', ')}`);
  if (only.includes('g')) pr(`${ai} vs Greedy`, await greedy({ ai }, { n, seed: 96600 }));
  if (only.includes('d')) for (const f of F) { const x = (await search(f, [{ ai }], { n: nd, seed: 76600 }))[0]; console.log(`${ai} vs Default, ${f}: ${x.w}-${x.l}-${x.d} (${x.share}%)`); }
  if (only.includes('h')) for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { const x = (await search(F[i], [{ ai }], { n: nh, seed: 77600, vs: { ai }, vsFaction: F[j] }))[0]; console.log(`${ai} vs ${ai}, ${F[i]} vs ${F[j]}: ${x.w}-${x.l}-${x.d}`); }
  if (only.includes('s')) for (const f of F) { const r = await stratField(f, { ai, persona: 'random' }, ns, 98600); console.log(`${ai} vs strategy bots, ${f}: ${r.w}-${r.l}-${r.d} [${Object.entries(r.per).map(([k, x]) => k + ' ' + x.join('-')).join(', ')}]`); }
  if (only.includes('e')) for (const d of ['normal', 'easy']) pr(`Default (${d}) vs Greedy`, await greedy({ ai: 'default' }, { n: ne, seed: 96500, diff: d }));
  if (only.includes('r')) { const { rush } = require('./rush'); for (const d of ['normal', 'easy']) { const r = rush(nr, d); for (const f in r) console.log(`Rifleman rush vs ${d} ${f}: rush wins ${r[f].w}, AI wins ${r[f].l}, draws ${r[f].d}`); } }
  if (only.includes('x')) { pr(`${ai} (signature building) vs Greedy`, await greedy({ ai }, { n, seed: 96800 })); pr(`${ai} without a signature building vs Greedy`, await greedy({ ai, dial: { sigAt: 99999 } }, { n, seed: 96800 })); }
  if (only.includes('k')) { const { loadSim } = require('./load'); const S = loadSim(1); for (const f of F) { const c = {}; for (let i = 0; i < 300; i++) { const g = S.newGame('hard', { factions: ['lastfist', f] }); const k = g.sides[1].persona.kind; c[k] = (c[k] || 0) + 1; } console.log(`openings Hard picks (300 rolls), ${f}: ${JSON.stringify(c)}`); } }
})().catch(e => { console.error(e); process.exit(1); });
