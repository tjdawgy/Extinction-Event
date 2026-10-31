#!/usr/bin/env node
// Rifleman rush check (Phase 5): the scripted Rifleman rush (tests/bots.js rushBot: two Barracks at once, a third later,
// Riflemen only, attacks at about 8 alive) as Last Fist on side 0 against the Default AI of each faction (Normal unless --diff; random
// personality), seeded, 30-minute cap. "Viable but not dominant": it should win some, not most.
//   node audit/sim/rush.js [--n=20] [--diff=normal] [--code="UDEF.tank.cost = ..."]
const { loadSim } = require('../../tests/load-sim');
const { mulberry } = require('./load');
const { BOTS, STEP } = require('../../tests/bots');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
function rush(n, diff = 'normal', mod) {
  const out = {};
  for (const f of ['lastfist', 'bloomhost', 'axiarchs']) {
    let w = 0, l = 0, d = 0; const wt = [];
    for (let i = 0; i < n; i++) {
      const sim = loadSim({ random: mulberry(70000 + i) }); if (mod) mod(sim);
      const g = sim.newGame(diff, { factions: ['lastfist', f], ai: 'default' }), bot = BOTS.rush(sim);
      g.countdown = 0;
      while (!g.over && g.t < 1800) { sim.update(g, STEP); bot(g, 0, STEP); }
      if (g.over && g.winner === 0) { w++; wt.push(g.t); } else if (g.over && g.winner === 1) l++; else d++;
    }
    wt.sort((a, b) => a - b);
    out[f] = { w, l, d, median: wt.length ? Math.round(wt[wt.length >> 1]) : null };
  }
  return out;
}
module.exports = { rush };
if (require.main === module) { const r = rush(+(arg('n') || 20), arg('diff') || 'normal', arg('code') ? new Function('sim', 'const UDEF = sim.UDEF;' + arg('code')) : null); for (const f in r) console.log(`rush vs ${f}: rush wins ${r[f].w}, AI wins ${r[f].l}, draws ${r[f].d}${r[f].median ? `, median rush win ${Math.floor(r[f].median / 60)}:${String(r[f].median % 60).padStart(2, '0')}` : ''}`); }
