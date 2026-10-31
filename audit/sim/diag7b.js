#!/usr/bin/env node
// Phase 7b diagnosis: Greedy against Greedy, cross-faction, with the damage counters on (instrument.js). Writes every match
// (samples every 30 s, kills by weapon, units trained and lost, Salvage) to out/diag7b-<tag>.json for analysis.
//   node audit/sim/diag7b.js [--n=10] [--tag=base] [--code="..."] [--bot='{}']
const fs = require('fs'), path = require('path');
const { runSpecs } = require('./run');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
(async () => {
  const n = +(arg('n') || 10), F = ['lastfist', 'bloomhost', 'axiarchs'], specs = [], code = arg('code'), botOpts = JSON.parse(arg('bot') || '{}');
  for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) for (let k = 0; k < n; k++) for (const sw of [0, 1]) {
    const a = F[i], b = F[j];
    specs.push({ seed: 95000 + k, diff: 'hard', maxT: 1800, diag: true, code, sides: [{ faction: sw ? b : a, bot: 'greedy', botOpts }, { faction: sw ? a : b, bot: 'greedy', botOpts }], a, b, aSide: sw });
  }
  const res = await runSpecs(specs, 4);
  const out = res.map((r, i) => Object.assign(r, { a: specs[i].a, b: specs[i].b, aSide: specs[i].aSide }));
  const d = path.join(__dirname, 'out'); fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, `diag7b-${arg('tag') || 'base'}.json`), JSON.stringify(out));
  const share = {};
  for (const r of out) { if (r.winner < 0) continue; const w = r.sides[r.winner].faction, l = r.sides[1 - r.winner].faction; (share[w] = share[w] || [0, 0])[0]++; (share[l] = share[l] || [0, 0])[1]++; }
  console.log('cross-faction shares:', Object.entries(share).map(([f, [w, l]]) => `${f} ${w}-${l}`).join(', '), 'draws', out.filter(r => r.winner < 0).length);
})().catch(e => { console.error(e); process.exit(1); });
