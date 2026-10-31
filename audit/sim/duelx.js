#!/usr/bin/env node
// Phase 7b: duel.js with an experiment's SIM changes: node audit/sim/duelx.js "<code>" a b value [n]
const { fight } = require('./duel');
const [code, a, b, value = 2000, n = 6] = process.argv.slice(2);
const { loadSim } = require('../../tests/load-sim');
const facOf = sp => { const sim = loadSim(); return sim.UDEF[sp.split(',')[0].split(':')[0]].fac || 'lastfist'; };
const mod = sim => { if (code) new Function('sim', 'with (sim) {' + code + '}')(sim); };
let wa = 0, wb = 0, la = 0, lb = 0;
for (let i = 0; i < +n; i++) { const r = fight(a, b, { value: +value, seed: 100 + i, facA: facOf(a), facB: facOf(b), mod }); if (r.v[0] > r.v[1]) wa++; else if (r.v[1] > r.v[0]) wb++; la += r.v[0] / r.v0[0]; lb += r.v[1] / r.v0[1]; }
console.log(`${a} vs ${b} @${value}: ${wa}-${wb}, kept ${Math.round(100 * la / n)}% vs ${Math.round(100 * lb / n)}%`);
