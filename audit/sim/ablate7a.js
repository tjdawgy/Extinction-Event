#!/usr/bin/env node
// Phase 7a A/B: each rule of a Hard candidate on vs off (leave one out), against the Greedy bot (greedyrun.js: 3 x 3
// faction pairings, the same seeds for every variant) and optionally against the Default field (hardsearch.js: same
// faction, paired seeds). Prints AI wins per variant.
//   node audit/sim/ablate7a.js --base='{"ai":"hard","persona":"boomer","fix":{...}}' --drop=read,contest [--n=6] [--seed=90000] [--vsDefault=0]
const { greedy, fmt } = require('./greedyrun');
const { search } = require('./hardsearch');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
(async () => {
  const base = JSON.parse(arg('base')), drops = (arg('drop') || '').split(',').filter(Boolean), n = +(arg('n') || 6), seed = +(arg('seed') || 90000), nd = +(arg('vsDefault') || 0);
  const variants = [['full', base], ...drops.map(k => [`-${k}`, Object.assign({}, base, { fix: Object.assign({}, base.fix, { [k]: false }) })])];
  for (const [name, v] of variants) {
    const r = await greedy(v, { n, seed });
    let line = `${name}: vs Greedy ${fmt(r)}`;
    if (nd) { const d = []; for (const f of ['lastfist', 'bloomhost', 'axiarchs']) { const x = (await search(f, [v], { n: nd, seed: 70000 }))[0]; d.push(`${f} ${x.w}-${x.l}-${x.d}`); } line += ` | vs Default ${d.join(', ')}`; }
    console.log(line);
  }
})().catch(e => { console.error(e); process.exit(1); });
