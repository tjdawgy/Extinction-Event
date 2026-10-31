#!/usr/bin/env node
// Phase 7a: the Greedy bot against itself, faction against faction: identical scripted play on both sides, so the result
// measures the factions (with this one style of play), not the AI. Each pairing plays n seeds with each faction on each side.
//   node audit/sim/botvbot.js [--n=10]
const { runSpecs } = require('./run');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
(async () => {
  const n = +(arg('n') || 10), F = ['lastfist', 'bloomhost', 'axiarchs'], specs = [];
  for (let i = 0; i < F.length; i++) for (let j = i; j < F.length; j++) for (let k = 0; k < n; k++) for (const sw of [0, 1]) {
    const a = F[i], b = F[j], s0 = sw ? b : a, s1 = sw ? a : b;
    specs.push({ seed: 95000 + k, diff: 'hard', maxT: 1800, sides: [{ faction: s0, bot: 'greedy' }, { faction: s1, bot: 'greedy', ai: 'default' }], a, b, aSide: sw });
  }
  const res = await runSpecs(specs, 4), out = {}, share = {};
  res.forEach((r, i) => { const { a, b, aSide } = specs[i], k = `${a} vs ${b}`, o = out[k] = out[k] || { a: 0, b: 0, d: 0, side0: 0 };
    if (r.winner < 0) o.d++; else if (r.winner === aSide) o.a++; else o.b++; if (r.winner === 0) o.side0++;
    if (a !== b && r.winner >= 0) { const w = r.winner === aSide ? a : b, l = w === a ? b : a; (share[w] = share[w] || [0, 0])[0]++; (share[l] = share[l] || [0, 0])[1]++; } });
  for (const k in out) console.log(`${k}: ${out[k].a}-${out[k].b}${out[k].d ? '-' + out[k].d : ''} (side 0 won ${out[k].side0})`);
  console.log('cross-faction win shares:', Object.entries(share).map(([f, [w, l]]) => `${f} ${Math.round(100 * w / (w + l))}%`).join(', '));
})().catch(e => { console.error(e); process.exit(1); });
