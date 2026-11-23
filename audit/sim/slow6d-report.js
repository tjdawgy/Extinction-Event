// Tables for audit/sim/slow6d.js: per kind and switch set, the rate of each fact the slow test checks (20 seeds each).
const fs = require('fs'), path = require('path');
const dir = process.argv[2] || path.join(__dirname, '..', 'logs-p1', 'slow6d'), out = [];
const rate = (a, f) => `${a.filter(f).length}/${a.length}`;
const rows = k => { const f = path.join(dir, k + '.jsonl'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(JSON.parse) : []; };
const C = ['on', 'ai0', 'd0', 'off'], CN = { on: 'every switch on', ai0: 'b6ai off', d0: 'b6d off', off: 'b6ai and b6d off' };
const table = (h, rs) => { out.push('| ' + h.join(' | ') + ' |', '|' + h.map(() => '---').join('|') + '|', ...rs.map(r => '| ' + r.join(' | ') + ' |'), ''); };
out.push('# Batch 6d: the three slow tests that failed, over 20 matches per switch set (audit/sim/slow6d.js)', '');
let R = rows('corrosive'); out.push('## tests/slow/ai-stats.test.js: Bloomhost (Turtle, Default AI) abilities vs a Last Fist Turtle, Classic, seeds 100-119', '', 'The test plays 10 (seeds 100-109) and needs Frenzy Bloom ≥ 50%, Corrosive Bloom ≥ 45%, Emergency Brood ≥ 15%.', '');
table(['switches', 'Frenzy Bloom', 'Corrosive Bloom', 'Emergency Brood', 'Corrosive, seeds 100-109', 'Last Fist wins', 'median length'], C.map(c => { const a = R.filter(r => r.cfg === c), s = a.map(r => r.t).sort((x, y) => x - y);
  return [CN[c], rate(a, r => r.frenzy > 0), rate(a, r => r.corrosive > 0), rate(a, r => r.brood > 0), rate(a.filter(r => r.seed < 110), r => r.corrosive > 0), rate(a, r => r.winner === 0), s[s.length >> 1]]; }));
R = rows('axpaths'); out.push('## tests/ax-trees.test.js re-run with every switch on: an Axiarch Hard AI (Economist on even seeds, Trickster on odd) against a Last Fist Turtle, seeds 1-20', '', 'The test plays two matches (seed 9 Economist, seed 4 Trickster) and needs the union to hold both Barracks paths and both War Factory paths, with 3+ path units trained.', '');
table(['switches', 'factory A', 'factory B', 'barracks A', 'barracks B', 'a pair (even seed + next odd) covers all four', 'Axiarchs win'], C.map(c => { const a = R.filter(r => r.cfg === c), has = (r, p) => r.paths.includes(p);
  let pairs = 0, cov = 0; for (const r of a.filter(r => r.seed % 2 === 0)) { const o = a.find(x => x.seed === r.seed + 1); if (!o) continue; pairs++; const u = new Set([...r.paths, ...o.paths]); if (['barracksA', 'barracksB', 'factoryA', 'factoryB'].every(p => u.has(p))) cov++; }
  return [CN[c], rate(a, r => has(r, 'factoryA')), rate(a, r => has(r, 'factoryB')), rate(a, r => has(r, 'barracksA')), rate(a, r => has(r, 'barracksB')), `${cov}/${pairs}`, rate(a, r => r.winner === 1)]; }));
out.push('By personality (factory B, the path missing in the failed run):', '');
table(['switches', 'Economist: factory B', 'Trickster: factory B'], C.map(c => { const a = R.filter(r => r.cfg === c); return [CN[c], rate(a.filter(r => r.persona === 'economist'), r => r.paths.includes('factoryB')), rate(a.filter(r => r.persona === 'trickster'), r => r.paths.includes('factoryB'))]; }));
R = rows('threelane'); out.push('## tests/slow/threelane-match.test.js: Hard vs Hard on Three-Lane, the test\'s pairing cycle, seeds 600-619', '', 'The test plays seeds 600-605 and needs every match over by 27:00, both sides on all three lanes, the centre and a watchtower taken, nobody in a wall; 4+ of 6 ended by an HQ, forward pads in 4+.', '');
table(['switches', 'over by 27:00', 'both sides used all three lanes', 'centre and a watchtower', 'nobody in a wall', 'ended by an HQ', 'forward pads', 'seeds 600-605: all three lanes'], C.map(c => { const a = R.filter(r => r.cfg === c);
  return [CN[c], rate(a, r => r.over), rate(a, r => r.all3), rate(a, r => r.centre >= 1 && r.towers >= 1), rate(a, r => r.inside === 0), rate(a, r => r.hq), rate(a, r => r.fwd), rate(a.filter(r => r.seed < 606), r => r.all3)]; }));
out.push('Lanes used when not all three (side 0 / side 1; 0 north, 1 centre, 2 south):', '');
for (const c of C) out.push(`- ${CN[c]}: ${R.filter(r => r.cfg === c && !r.all3).map(r => `seed ${r.seed} (${r.f.join(' v ')}, ${r.t} s) ${r.lanes.join(' / ')}`).join('; ') || 'none'}`);
fs.writeFileSync(path.join(dir, 'report.md'), out.join('\n') + '\n'); console.log(out.join('\n'));
