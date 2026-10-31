#!/usr/bin/env node
// Phase 7a Hard strategy search: the 6a search (hardsearch.js) with the Greedy bot added to the opponent field. Each
// candidate (an opening and dials, with the v2.41 rules) plays the Greedy bot of all three factions (greedyrun.js, n seeds
// each) and the Default field of its own faction (paired, nd matches). Score: the mean of the two win shares.
//   node audit/sim/hardsearch7a.js --faction=bloomhost --cands='[{"persona":"boomer","dial":{"delay":0.6}}]' [--n=6] [--nd=10] [--fix='{...}']
const { greedy } = require('./greedyrun');
const { search } = require('./hardsearch');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
(async () => {
  const f = arg('faction'), cands = JSON.parse(arg('cands')), n = +(arg('n') || 6), nd = +(arg('nd') || 10), fix = JSON.parse(arg('fix') || '{}');
  for (const c of cands) {
    const side = { ai: 'hard', persona: c.persona, dial: c.dial || {}, fix: Object.assign({}, fix, c.fix || {}) };
    const g = await greedy(side, { n, seed: +(arg('seed') || 92000), factions: [f] }), gw = g.tot.w / (g.tot.w + g.tot.l + g.tot.d);
    const d = (await search(f, [side], { n: nd, seed: 72000 }))[0], dw = d.w / (d.w + d.l + d.d);
    console.log(`${f} ${JSON.stringify(c)}: Greedy ${g.tot.w}-${g.tot.l}-${g.tot.d} (${Math.round(gw * 100)}%) [${Object.entries(g.pairs).map(([k, x]) => k.split('<')[1] + ' ' + x.w + '-' + x.l).join(', ')}], Default ${d.w}-${d.l}-${d.d} (${Math.round(dw * 100)}%), score ${Math.round(50 * (gw + dw))}`);
  }
})().catch(e => { console.error(e); process.exit(1); });
