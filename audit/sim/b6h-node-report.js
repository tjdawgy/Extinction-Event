// Batch 6h (v2.98), Part G: the Bloomhost node-contest report from the forced-turret scenario's matches (audit/sim/b6g-scen.js
// --set nodes, with the b6g and b6h counters). Every Bloomhost node-assault decision (launched or held back, the force against
// the threshold), each assault's units by type, how it ended and what killed its units; every group (capture groups, raids,
// assaults) sent at a node an enemy gun covers; retakes, enemy pad buildings destroyed, results.
//   node audit/sim/b6h-node-report.js <dir> [<dir2> ...]   (each dir holds a matches.jsonl)
const fs = require('fs'), path = require('path');
const dirs = process.argv.slice(2);
const pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '-', avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length) : 0;
const out = [];
for (const dir of dirs) {
  const M = fs.readFileSync(path.join(dir, 'matches.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
  const S = { evals: 0, launch: 0, ratios: [], held: { short: 0, few: 0 }, groups: 0, types: {}, ends: {}, killers: { gun: 0, unit: 0, other: 0 }, killT: {}, deadN: 0, retakes: 0, fpk: 0, res: [0, 0, 0], gg: 0, gWon: 0, gV: [], gGun: [], pre: { n: 0, v: [] } };
  for (const m of M) {
    const s = m.f.indexOf('bloomhost'); if (s < 0) continue;
    const H = (m.b6h || [])[s] || { ev: [], dead: [] }, G = (m.b6g || [])[s] || {};
    for (const e of H.ev) {
      if (e.k === 'eval') { S.evals++; S.ratios.push(e.have / e.need); if (!e.go) { if (e.have < e.need) S.held.short++; else S.held.few++; } }
      if (e.k === 'go') { S.launch++; for (const t of e.types) S.types[t] = (S.types[t] || 0) + 1; }
      if (e.k === 'end') S.ends[e.why] = (S.ends[e.why] || 0) + 1;
    }
    for (const d of H.dead) { S.deadN++; const k = String(d.by).startsWith('gun:') ? 'gun' : /^[a-z0-9]+$/.test(d.by) && d.by.length < 14 ? 'unit' : 'other'; S.killers[k]++; S.killT[d.by] = (S.killT[d.by] || 0) + 1; }
    S.retakes += G.retakes || 0; S.fpk += G.fpKilled || 0;
    for (const x of G.grp || []) if (x.guns > 0) { S.gg++; if (x.won) S.gWon++; S.gV.push(x.v); S.gGun.push(x.gunHp); }
    const w = m.winner === s ? 0 : m.winner == null || m.winner < 0 ? 2 : 1; S.res[w]++;
  }
  const q = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? [b[b.length >> 2], b[b.length >> 1], b[(b.length * 3) >> 2]].map(x => x.toFixed(2)).join(' / ') : '-'; };
  out.push(`## ${dir} (${M.length} matches)`, '',
    `- Results for Bloomhost (won-lost-drawn): ${S.res.join('-')}; retakes ${S.retakes}; enemy pad buildings destroyed ${S.fpk}.`,
    `- Assault decisions (6g's aiNode6g, or 6h's): ${S.evals} candidate checks, ${S.launch} launched (${pct(S.launch, S.evals)}); held back: ${S.held.short} short of force, ${S.held.few} too few units. Force it could send ÷ force needed (quartiles): ${q(S.ratios)}.`,
    `- Assault outcomes: ${Object.entries(S.ends).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}.`,
    `- Assault units by type: ${Object.entries(S.types).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}.`,
    `- Assault units killed: ${S.deadN} (by guns ${S.killers.gun}, by units ${S.killers.unit}, other ${S.killers.other}); top killers: ${Object.entries(S.killT).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(', ')}.`,
    `- Every group sent at a gun-covered node (capture groups, raids, assaults): ${S.gg}, ${S.gWon} took it (${pct(S.gWon, S.gg)}); mean group value ${avg(S.gV).toFixed(0)}, mean gun health there ${avg(S.gGun).toFixed(0)}.`, '');
}
console.log(out.join('\n'));
