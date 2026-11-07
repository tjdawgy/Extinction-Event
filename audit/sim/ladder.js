#!/usr/bin/env node
// v2.61 (Phase 1, difficulty ladder): AI vs AI across difficulties with mixed factions. Each matchup plays n seeds; match i
// gives side A a faction and side B another (all nine faction pairings in turn) and A takes the left on even matches.
// Each side plays its difficulty's own preset (Hard: hard; Easy and Normal: default). Reports wins, A's share
// ((wins + draws/2) / n), median length, decided before 20:00, draws and no-fight matches (both sides under 1,000 damage).
//   node audit/sim/ladder.js [--sets=hard-normal,normal-easy,normal-normal,easy-easy] [--n=200] [--seed=8000] [--jobs=4] [--json=out.json]
const fs = require('fs');
const { runSpecs } = require('./run');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const F = ['lastfist', 'bloomhost', 'axiarchs'];
const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : 0; };
const mm = t => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;
(async () => {
  const sets = arg('sets', 'hard-normal,normal-easy,normal-normal,easy-easy').split(','), n = +arg('n', 200), seed = +arg('seed', 8000), jobs = +arg('jobs', 4), out = {};
  console.log('| Matchup (A vs B) | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |\n|---|---|---|---|---|---|---|');
  for (const set of sets) {
    const [da, db] = set.split('-'), specs = [];
    for (let i = 0; i < n; i++) {
      const A = { faction: F[i % 3], diff: da, persona: 'random' }, B = { faction: F[Math.floor(i / 3) % 3], diff: db, persona: 'random' }, sw = i % 2;
      specs.push({ seed: seed + i, diff: 'normal', maxT: 1620, sides: sw ? [B, A] : [A, B], aSide: sw });
    }
    const t0 = Date.now(), res = await runSpecs(specs, jobs, (d, N) => process.stderr.write(`\r${set}: ${d}/${N}`));
    process.stderr.write(` (${Math.round((Date.now() - t0) / 1000)} s)\n`);
    const ms = res.map((r, i) => ({ r: r.winner < 0 ? 0 : r.winner === specs[i].aSide ? 1 : -1, t: r.t, dmg: (r.sides[0].dmg || 0) + (r.sides[1].dmg || 0) }));
    const w = ms.filter(m => m.r > 0).length, l = ms.filter(m => m.r < 0).length, d = n - w - l;
    const row = { w, l, d, share: (w + d / 2) / n, med: med(ms.map(m => m.t)), early: ms.filter(m => m.r && m.t < 1200).length / n, draws: d / n, quiet: ms.filter(m => m.dmg < 1000).length / n };
    out[set] = { ...row, matches: ms };
    const p = x => (100 * x).toFixed(1) + '%';
    console.log(`| ${da} vs ${db} | ${w}–${l}–${d} | ${p(row.share)} | ${mm(row.med)} | ${p(row.early)} | ${p(row.draws)} | ${p(row.quiet)} |`);
  }
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out));
})().catch(e => { console.error(e); process.exit(1); });
