#!/usr/bin/env node
// Phase 6a A/B: side A and side B play the same faction (each faction in turn), random personalities, Hard, seeded, each
// seed played twice with the sides swapped (paired), 30-minute cap. Each side is a preset plus optional overrides of its competence rules (fix) and dials.
//   node audit/sim/tactics.js --a='{"ai":"default"}' --b='{"ai":"default","fix":{"mass":false}}' [--n=16] [--seed=60000] [--factions=lastfist,bloomhost,axiarchs] [--diff=hard]
// Prints A's wins per faction and in total.
const { runSet } = require('./run');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const side = (f, o) => ({ faction: f, ai: o.ai || 'default', persona: o.persona || 'random', dial: Object.assign({}, o.dial || {}, o.fix ? { fix: o.fix } : {}) });
async function tactics(A, B, { n = 16, seed = 60000, factions = ['lastfist', 'bloomhost', 'axiarchs'], diff = 'hard', vsFaction } = {}) {
  const out = { per: {}, w: 0, l: 0, d: 0 };
  for (const f of factions) {
    const set = await runSet({ a: side(f, A), b: side(vsFaction || f, B), n, seed: seed + 100 * factions.indexOf(f), maxT: 1800, diff, quiet: true, paired: true }); // each seed with A on both sides
    const w = set.summary.wins; out.per[f] = w; out.w += w.A; out.l += w.B; out.d += w.draw;
  }
  out.share = Math.round(1000 * out.w / Math.max(1, out.w + out.l)) / 10;
  return out;
}
module.exports = { tactics };
if (require.main === module) (async () => {
  const A = JSON.parse(arg('a') || '{}'), B = JSON.parse(arg('b') || '{}');
  const r = await tactics(A, B, { n: +(arg('n') || 16), seed: +(arg('seed') || 60000), factions: (arg('factions') || 'lastfist,bloomhost,axiarchs').split(','), diff: arg('diff') || 'hard' });
  console.log(`A ${JSON.stringify(A)} vs B ${JSON.stringify(B)}: ${Object.entries(r.per).map(([f, w]) => `${f} ${w.A}-${w.B}${w.draw ? '-' + w.draw : ''}`).join(', ')}; total ${r.w}-${r.l}-${r.d} (A ${r.share}%)`);
})().catch(e => { console.error(e); process.exit(1); });
