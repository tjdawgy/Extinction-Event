// Batch 6f (v2.96), Part A: how often an all-in base attack stood past the enemy HQ (read from a selfplay-6c run with
// audit/sim/audit6a.js's edge counters: ser.allIn, ser.edge, ser.edgeIdle, ser.edgeAt).
//   node audit/sim/edge6f-report.js <dir> [<dir2> ...]
// edge: seconds with half or more of the side's ground army (value) over 100 past the enemy HQ during an all-in base attack;
// edgeIdle: of those, seconds with no enemy building or unit it could see within 300 of any of those units.
// A match is "affected" for a side with 20 or more edge seconds.
const fs = require('fs'), path = require('path');
const F = ['lastfist', 'bloomhost', 'axiarchs'], NAME = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' }, MAPS = ['classic', 'twolane', 'threelane'];
for (const dir of process.argv.slice(2)) {
  const M = fs.readFileSync(path.join(dir, 'matches.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
  const out = [`### Base attacks standing past the enemy HQ: ${path.basename(dir)} (${M.length} matches)`, '',
    '| faction | map | sides | all-in seconds | sides affected (20+ s) | edge seconds (all) | of them idle | median edge s (affected) | affected sides: W-L-D |', '|---|---|---|---|---|---|---|---|---|'];
  for (const f of F) for (const map of [...MAPS, 'all']) {
    let n = 0, ai = 0, aff = 0, ed = 0, idle = 0; const meds = [], wld = [0, 0, 0];
    for (const m of M) { if (map !== 'all' && m.map !== map) continue; m.sides.forEach((sd, s) => { if (sd.fac !== f) return; n++; const Z = sd.ser || {}; ai += Z.allIn || 0; ed += Z.edge || 0; idle += Z.edgeIdle || 0;
      if ((Z.edge || 0) >= 20) { aff++; meds.push(Z.edge); wld[m.winner === s ? 0 : m.winner === 1 - s ? 1 : 2]++; } }); }
    meds.sort((a, b) => a - b);
    out.push(`| ${map === 'all' ? '**' + NAME[f] + '**' : NAME[f]} | ${map} | ${n} | ${ai} | ${aff} (${n ? Math.round(100 * aff / n) : 0}%) | ${ed} | ${idle} | ${meds.length ? meds[meds.length >> 1] : '-'} | ${wld.join('-')} |`);
  }
  console.log(out.join('\n') + '\n');
}
