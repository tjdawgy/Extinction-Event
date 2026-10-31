#!/usr/bin/env node
// Phase 6a Hard-mode strategy search. Each candidate is an opening (a fixed personality: its build plan, paths and tastes)
// plus dial overrides; it plays n paired matches (each seed twice, sides swapped) against a field: the Default preset with
// random personalities, same faction, Hard, 30-minute cap. No resource bonus and no extra information: dials only change
// decisions. Prints and saves each candidate's win share.
//   node audit/sim/hardsearch.js --faction=axiarchs --cands='[{"persona":"economist"},{"persona":"turtle","dial":{"nodes":3}}]' [--n=20] [--seed=70000] [--vs='{"ai":"default"}'] [--out=name]
const fs = require('fs'), path = require('path');
const { runSet } = require('./run');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const side = (f, o) => ({ faction: f, ai: o.ai || 'default', persona: o.persona || 'random', dial: Object.assign({}, o.dial || {}, o.fix ? { fix: o.fix } : {}) });
async function search(faction, cands, { n = 20, seed = 70000, vs = { ai: 'default' }, vsFaction } = {}) {
  const out = [];
  for (const c of cands) {
    const set = await runSet({ a: side(faction, c), b: side(vsFaction || faction, vs), n, seed, maxT: 1800, quiet: true, paired: true });
    const w = set.summary.wins; out.push({ c, w: w.A, l: w.B, d: w.draw, share: Math.round(1000 * w.A / Math.max(1, w.A + w.B)) / 10, len: set.summary.avgLength });
    console.log(`${faction} ${JSON.stringify(c)}: ${w.A}-${w.B}-${w.draw} (${out.at(-1).share}%)`);
  }
  return out;
}
module.exports = { search };
if (require.main === module) (async () => {
  const f = arg('faction'), r = await search(f, JSON.parse(arg('cands')), { n: +(arg('n') || 20), seed: +(arg('seed') || 70000), vs: JSON.parse(arg('vs') || '{"ai":"default"}'), vsFaction: arg('vsFaction') });
  if (arg('out')) { const d = path.join(__dirname, 'out'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, `hard-${arg('out')}.json`), JSON.stringify(r, null, 1)); }
})().catch(e => { console.error(e); process.exit(1); });
