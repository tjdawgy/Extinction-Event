#!/usr/bin/env node
// Phase 7a: what the AI's defensive casts achieve. Last Fist Hard against the Greedy bot (all three bot factions), with the
// shield rule on and off: Emergency Shield casts, damage blocked in total and per cast, and wins.
//   node audit/sim/shield7a.js [--n=8] [--fix='{...}']
const { greedy } = require('./greedyrun');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
(async () => {
  const fix = JSON.parse(arg('fix') || '{}'), n = +(arg('n') || 8);
  for (const on of [false, true]) {
    const r = await greedy({ ai: 'hard', persona: arg('persona') || 'boomer', fix: Object.assign({}, fix, { shield: on }) }, { n, seed: 93000, factions: ['lastfist'], keep: true });
    let casts = 0, blocked = 0;
    for (const m of r.matches) { const a = m.sides[1].ab.shield; casts += a[0]; blocked += a[1]; }
    console.log(`shield rule ${on ? 'on' : 'off'}: ${casts} Emergency Shields in ${r.matches.length} matches, ${Math.round(blocked)} damage blocked (${casts ? Math.round(blocked / casts) : 0} per cast); AI wins ${r.tot.w}-${r.tot.l}`);
  }
})();
