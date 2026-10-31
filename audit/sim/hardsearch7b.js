#!/usr/bin/env node
// Phase 7b Hard strategy search: hardsearch7a.js plus the step 2 bots in the field. Each candidate (an opening and dials,
// with the Hard preset's rules) plays the Greedy bot of all three factions (n seeds each), the Default field of its own
// faction (nd paired matches) and the Rush, Turtle and Contain bots of all three factions (ns seeds each). Score: the
// mean of the three win shares.
//   node audit/sim/hardsearch7b.js --faction=bloomhost --cands='[{"persona":"boomer","dial":{"delay":0.6}}]' [--n=4] [--nd=10] [--ns=2] [--fix='{...}']
const { greedy } = require('./greedyrun');
const { search } = require('./hardsearch');
const { runSpecs } = require('./run');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const F = ['lastfist', 'bloomhost', 'axiarchs'];
async function stratField(f, side, ns, seed) {
  const specs = [];
  for (const bf of F) for (const op of ['rush', 'turtle', 'contain']) for (let i = 0; i < ns; i++)
    specs.push({ seed: seed + i, diff: 'hard', maxT: 1800, sides: [{ faction: bf, bot: 'strat', botOpts: { opener: op } }, { faction: f, ai: 'hard', persona: side.persona || 'random', dial: Object.assign({}, side.dial || {}, side.fix ? { fix: side.fix } : {}) }], op });
  const res = await runSpecs(specs, 4), per = {};
  let w = 0, l = 0, d = 0;
  res.forEach((r, i) => { const k = specs[i].op, o = per[k] = per[k] || [0, 0]; if (r.winner === 1) { w++; o[0]++; } else if (r.winner === 0) { l++; o[1]++; } else d++; });
  return { w, l, d, per };
}
module.exports = { stratField };
if (require.main === module) (async () => {
  const f = arg('faction'), cands = JSON.parse(arg('cands')), n = +(arg('n') || 4), nd = +(arg('nd') || 10), ns = +(arg('ns') || 2), fix = JSON.parse(arg('fix') || '{}');
  for (const c of cands) {
    const side = { ai: 'hard', persona: c.persona, dial: c.dial || {}, fix: Object.assign({}, fix, c.fix || {}) };
    const g = await greedy(side, { n, seed: +(arg('seed') || 92000), factions: [f] }), gw = g.tot.w / (g.tot.w + g.tot.l + g.tot.d);
    const d = (await search(f, [side], { n: nd, seed: 72000 }))[0], dw = d.w / (d.w + d.l + d.d);
    const st = await stratField(f, side, ns, 93000), sw = st.w / (st.w + st.l + st.d);
    console.log(`${f} ${JSON.stringify(c)}: Greedy ${g.tot.w}-${g.tot.l}-${g.tot.d} (${Math.round(gw * 100)}%), Default ${d.w}-${d.l}-${d.d} (${Math.round(dw * 100)}%), bots ${st.w}-${st.l}-${st.d} (${Math.round(sw * 100)}%) [${Object.entries(st.per).map(([k, x]) => k + ' ' + x.join('-')).join(', ')}], score ${Math.round(100 * (gw + dw + sw) / 3)}`);
  }
})().catch(e => { console.error(e); process.exit(1); });
