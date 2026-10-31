#!/usr/bin/env node
// Phase 7a: an AI against the scripted Greedy bot (audit/sim/greedy.js). The bot plays side 0, the player's slot, as a
// human does; the AI plays side 1 on the given difficulty. Every pairing of the bot's faction and the AI's faction (3 x 3),
// n seeds each, 30-minute cap. Prints the AI's wins per AI faction and per pairing.
//   node audit/sim/greedyrun.js [--ai='{"ai":"hard"}'] [--n=10] [--seed=90000] [--diff=hard] [--factions=lastfist,bloomhost,axiarchs] [--bot='{"attackV":1600}'] [--out=name]
// As a module: greedy(aiSide, opts) → { per: { aiFaction: { w, l, d } }, pairs, matches }
const fs = require('fs'), path = require('path');
const { runSpecs } = require('./run');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const F = ['lastfist', 'bloomhost', 'axiarchs'];
async function greedy(ai = { ai: 'hard' }, { n = 10, seed = 90000, diff = 'hard', factions = F, botFactions = F, bot = {}, jobs = 4, keep = false } = {}) {
  const specs = [];
  for (const af of factions) for (const bf of botFactions) for (let i = 0; i < n; i++)
    specs.push({ seed: seed + i, diff, maxT: 1800, sides: [{ faction: bf, bot: 'greedy', botOpts: bot }, { faction: af, ai: ai.ai || 'hard', persona: ai.persona || 'random', dial: Object.assign({}, ai.dial || {}, ai.fix ? { fix: ai.fix } : {}) }], af, bf });
  const res = await runSpecs(specs, jobs);
  const per = {}, pairs = {};
  res.forEach((r, i) => {
    const { af, bf } = specs[i], k = r.winner === 1 ? 'w' : r.winner === 0 ? 'l' : 'd';
    (per[af] = per[af] || { w: 0, l: 0, d: 0 })[k]++;
    (pairs[`${af}<${bf}`] = pairs[`${af}<${bf}`] || { w: 0, l: 0, d: 0 })[k]++;
  });
  const tot = Object.values(per).reduce((a, x) => ({ w: a.w + x.w, l: a.l + x.l, d: a.d + x.d }), { w: 0, l: 0, d: 0 });
  return { per, pairs, tot, matches: keep ? res.map((r, i) => Object.assign(r, { af: specs[i].af, bf: specs[i].bf })) : undefined };
}
const fmt = r => `${Object.entries(r.per).map(([f, x]) => `${f} ${x.w}-${x.l}${x.d ? '-' + x.d : ''}`).join(', ')}; total ${r.tot.w}-${r.tot.l}${r.tot.d ? '-' + r.tot.d : ''} (AI ${Math.round(1000 * r.tot.w / Math.max(1, r.tot.w + r.tot.l + r.tot.d)) / 10}%)`;
module.exports = { greedy, fmt };
if (require.main === module) (async () => {
  const ai = JSON.parse(arg('ai') || '{"ai":"hard"}');
  const r = await greedy(ai, { n: +(arg('n') || 10), seed: +(arg('seed') || 90000), diff: arg('diff') || 'hard', factions: (arg('factions') || F.join(',')).split(','), botFactions: (arg('bots') || F.join(',')).split(','), bot: JSON.parse(arg('bot') || '{}'), keep: !!arg('out') });
  console.log(`AI ${JSON.stringify(ai)} vs Greedy: ${fmt(r)}`);
  console.log('pairs (AI<bot):', Object.entries(r.pairs).map(([k, x]) => `${k} ${x.w}-${x.l}${x.d ? '-' + x.d : ''}`).join(', '));
  if (arg('out')) { const d = path.join(__dirname, 'out'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, `greedy-${arg('out')}.json`), JSON.stringify(r, null, 1)); }
})().catch(e => { console.error(e); process.exit(1); });
