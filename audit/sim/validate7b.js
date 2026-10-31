#!/usr/bin/env node
// Phase 7b validation, on seeds the search never used. The index.html it loads decides the numbers (EE_HTML: a copy of
// v2.41 for the "before" columns). Parts (--only): g Hard vs Greedy (3 x 3, n seeds), s Hard vs the Rush, Turtle and
// Contain bots (3 x 3 x 3, ns seeds), d Hard vs Default (same faction, paired, nd), h Hard vs Hard (paired, nh),
// e Easy and Normal (Default) vs Greedy (3 x 3, ne seeds), k which openings Hard picked.
//   node audit/sim/validate7b.js [--ai=hard] [--n=14] [--ns=2] [--nd=40] [--nh=40] [--ne=6] [--only=g,s,d,h,e,k]
const { greedy, fmt } = require('./greedyrun');
const { search } = require('./hardsearch');
const { stratField } = require('./hardsearch7b');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const F = ['lastfist', 'bloomhost', 'axiarchs'];
(async () => {
  const ai = arg('ai') || 'hard', n = +(arg('n') || 14), ns = +(arg('ns') || 2), nd = +(arg('nd') || 40), nh = +(arg('nh') || 40), ne = +(arg('ne') || 6), only = (arg('only') || 'g,s,d,h,e').split(',');
  const pr = (k, r) => console.log(`${k}: ${fmt(r)}\n  pairs (AI<bot): ${Object.entries(r.pairs).map(([p, x]) => `${p} ${x.w}-${x.l}${x.d ? '-' + x.d : ''}`).join(', ')}`);
  if (only.includes('g')) pr(`${ai} vs Greedy`, await greedy({ ai }, { n, seed: 96000 }));
  if (only.includes('s')) for (const f of F) { const r = await stratField(f, { ai, persona: 'random' }, ns, 98000); console.log(`${ai} vs strategy bots, ${f}: ${r.w}-${r.l}-${r.d} [${Object.entries(r.per).map(([k, x]) => k + ' ' + x.join('-')).join(', ')}]`); }
  if (only.includes('d')) for (const f of F) { const x = (await search(f, [{ ai }], { n: nd, seed: 76000 }))[0]; console.log(`${ai} vs Default, ${f}: ${x.w}-${x.l}-${x.d}`); }
  if (only.includes('h')) for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { const x = (await search(F[i], [{ ai }], { n: nh, seed: 77000, vs: { ai }, vsFaction: F[j] }))[0]; console.log(`${ai} vs ${ai}, ${F[i]} vs ${F[j]}: ${x.w}-${x.l}-${x.d}`); }
  if (only.includes('e')) for (const d of ['normal', 'easy']) pr(`Default (${d}) vs Greedy`, await greedy({ ai: 'default' }, { n: ne, seed: 96500, diff: d }));
  if (only.includes('k')) { const { loadSim } = require('./load'); const S = loadSim(1); for (const f of F) { const c = {}; for (let i = 0; i < 300; i++) { const g = S.newGame('hard', { factions: ['lastfist', f] }); const k = g.sides[1].persona.kind; c[k] = (c[k] || 0) + 1; } console.log(`openings Hard picks (300 rolls), ${f}: ${JSON.stringify(c)}`); } }
})().catch(e => { console.error(e); process.exit(1); });
