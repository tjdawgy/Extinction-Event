#!/usr/bin/env node
// Phase 7a: the counter rule's unit choices. Last Fist Hard against a ground-only Greedy bot (no aircraft) of each faction,
// counter rule on and off: anti-air-only units (Interceptors) trained, Flame Tanks and other splash units trained, and wins.
const { greedy } = require('./greedyrun');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
(async () => {
  const fix = JSON.parse(arg('fix') || '{}'), n = +(arg('n') || 8);
  for (const on of [false, true]) {
    const r = await greedy({ ai: 'hard', persona: arg('persona') || 'boomer', fix: Object.assign({}, fix, { counter: on }) }, { n, seed: 94000, factions: ['lastfist'], bot: { noAir: true }, keep: true });
    const t = {}; for (const m of r.matches) for (const k in m.sides[1].trained) t[k] = (t[k] || 0) + m.sides[1].trained[k];
    console.log(`counter rule ${on ? 'on' : 'off'}: Interceptors ${t.interceptor || 0}, Flame Tanks ${t.flame || 0}, Tanks ${t.tank || 0}, Artillery ${t.artillery || 0}, Riflemen ${t.rifle || 0} in ${r.matches.length} matches; AI wins ${r.tot.w}-${r.tot.l}`);
  }
})();
