#!/usr/bin/env node
// Phase 0 item 2 (v2.48): Hard-vs-Hard mirror matches per faction, wins by spawn side.
//   node audit/sim/mirror.js [--n=200] [--seed=1] [--jobs=4] [--maxT=1620] [--factions=lastfist,bloomhost,axiarchs] [--code=...] [--out=file.json]
// Side 0 spawns on the left (u = HQ_U, the player's slot, played by the autoplayer); side 1 on the right (the normal AI).
// Both sides run the same Hard brain with random openings. Match i uses seed + i. A storm ending is a draw (v2.48);
// for draws the remaining-strength score says who was ahead.
const fs = require('fs');
const { runSpecs } = require('./run');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
(async () => {
  const n = +arg('n', 200), seed = +arg('seed', 1), jobs = +arg('jobs', 4), maxT = +arg('maxT', 1620), code = arg('code');
  const F = arg('factions', 'lastfist,bloomhost,axiarchs').split(','), all = {};
  for (const f of F) {
    const side = { faction: f, ai: 'hard', persona: 'random' }, specs = [];
    for (let i = 0; i < n; i++) specs.push({ seed: seed + i, diff: 'hard', maxT, code, sides: [side, side] });
    const t0 = Date.now();
    const res = await runSpecs(specs, jobs, (d, N) => process.stderr.write(`\r${f} mirror: ${d}/${N}`));
    process.stderr.write(` (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
    const w = [0, 0], how = {}, ahead = [0, 0], early = [0, 0], open = { 0: {}, 1: {} }, openW = { 0: {}, 1: {} };
    let draws = 0, tSum = 0;
    for (const r of res) {
      tSum += r.t; how[r.how] = (how[r.how] || 0) + 1;
      if (r.winner >= 0) { w[r.winner]++; if (r.t < 1200) early[r.winner]++; } else { draws++; if (r.score) ahead[r.score[0] > r.score[1] ? 0 : r.score[1] > r.score[0] ? 1 : 0]++; }
      for (const s of [0, 1]) { const p = r.sides[s].persona; open[s][p] = (open[s][p] || 0) + 1; if (r.winner === s) openW[s][p] = (openW[s][p] || 0) + 1; }
    }
    const dec = w[0] + w[1], z = dec ? (w[0] - dec / 2) / Math.sqrt(dec / 4) : 0;
    all[f] = { n, wins: w, draws, early, drawAhead: ahead, how, meanT: Math.round(tSum / n), z: +z.toFixed(2), openings: open, openingWins: openW, seeds: res.map(r => [r.seed, r.winner, r.t, r.how]) };
    console.log(`${f}: left (side 0) ${w[0]} – right (side 1) ${w[1]}, draws ${draws} (ahead at the end: left ${ahead[0]}, right ${ahead[1]}); decided before 20:00 ${early[0]}–${early[1]}; left share of decided ${dec ? (100 * w[0] / dec).toFixed(1) : '–'}% (z ${z.toFixed(2)}); mean ${Math.round(tSum / n)} s; endings ${JSON.stringify(how)}`);
  }
  if (arg('out')) fs.writeFileSync(arg('out'), JSON.stringify(all, null, 1));
})();
