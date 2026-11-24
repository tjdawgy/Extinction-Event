// Batch 6e (v2.95), Part C1: tables from audit/sim/early6e.js's early.jsonl (one or two runs).
//   node audit/sim/early6e-report.js dirA [dirB]
const fs = require('fs'), path = require('path');
const NAME = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' }, F = Object.keys(NAME);
const load = d => fs.readFileSync(path.join(d, 'early.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(m => !m.err);
const r0 = x => x == null || !isFinite(x) ? '-' : Math.round(x), pct = x => isFinite(x) ? Math.round(x * 100) + '%' : '-';
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const med = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
const fmt = t => t == null ? '-' : `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;
function wilson(w, n) { if (!n) return [0, 0]; const z = 1.96, p = w / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [(c - h) / d, (c + h) / d]; }
const out = [];
for (const dir of process.argv.slice(2)) {
  const ms = load(dir);
  for (const m of ms) { // the first cluster of losses (gap 20 s) with 300+ value lost
    m.fight = null; let cl = [];
    const close = () => { const lost = [0, 0], types = [{}, {}]; for (const x of cl) { lost[x[1]] += x[2]; types[x[1]][x[3]] = (types[x[1]][x[3]] || 0) + 1; }
      if (lost[0] + lost[1] >= 300) { const t0 = cl[0][0], a = m.army[Math.floor(t0 / 5)] || null; m.fight = { t0, t1: cl[cl.length - 1][0], lost, types, win: lost[0] < lost[1] ? 0 : lost[1] < lost[0] ? 1 : -1, army: a }; } cl = []; };
    for (const x of m.loss) { if (m.fight) break; if (cl.length && x[0] - cl[cl.length - 1][0] > 20) close(); cl.push(x); }
    if (!m.fight && cl.length) close();
  }
  out.push(`### ${path.basename(dir)} (${ms.length} matches to 6:00)`, '');
  out.push('Per faction (every side), mean at each time: army value / income a second (credits + energy) / field nodes held:', '', '| faction | 2:00 | 3:00 | 4:00 | 5:00 |', '|---|---|---|---|---|');
  for (const f of F) {
    const row = [0, 1, 2, 3].map(i => { const xs = []; for (const m of ms) m.f.forEach((ff, s) => { if (ff === f && m.snap[s][i]) xs.push(m.snap[s][i]); }); return `${r0(mean(xs.map(x => x.v)))} / ${mean(xs.map(x => x.inc)).toFixed(1)} / ${mean(xs.map(x => x.nodes)).toFixed(2)}`; });
    out.push(`| ${NAME[f]} | ${row.join(' | ')} |`);
  }
  out.push('', 'Army at 4:00 by unit type (mean count per side; types at 0.3 or more):', '', '| faction | units |', '|---|---|');
  for (const f of F) { const n = {}; let k = 0; for (const m of ms) m.f.forEach((ff, s) => { if (ff !== f || !m.snap[s][2]) return; k++; for (const [t, c] of Object.entries(m.snap[s][2].n)) n[t] = (n[t] || 0) + c; });
    out.push(`| ${NAME[f]} | ${Object.entries(n).map(([t, c]) => [t, c / k]).filter(x => x[1] >= 0.3).sort((a, b) => b[1] - a[1]).map(([t, c]) => `${t} ${c.toFixed(1)}`).join(', ')} |`); }
  out.push('', 'Per pairing (first named): the first field fight (the first cluster of units lost 250+ from both HQs, ended by 20 s with none lost, in which 300+ value is lost): won by (lost less), median start, each side\'s army when it started (mean), value lost (mean); field nodes held at 5:00 (mean); army and income at 4:00 (mean):', '',
    '| pairing | map | fights | first named won (95%) | start (median) | armies at start | lost | nodes at 5:00 | army at 4:00 | income at 4:00 |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const [a, b] of [['lastfist', 'bloomhost'], ['lastfist', 'axiarchs'], ['bloomhost', 'axiarchs']]) for (const map of ['classic', 'twolane', 'threelane', 'all']) {
    let n = 0, w = 0, t0 = [], arm = [[], []], lost = [[], []], nodes = [[], []], v4 = [[], []], i4 = [[], []];
    for (const m of ms) { if (map !== 'all' && m.map !== map) continue; const sa = m.f.indexOf(a), sb = m.f.indexOf(b); if (sa < 0 || sb < 0) continue;
      if (m.snap[sa][3]) { nodes[0].push(m.snap[sa][3].nodes); nodes[1].push(m.snap[sb][3].nodes); }
      if (m.snap[sa][2]) { v4[0].push(m.snap[sa][2].v); v4[1].push(m.snap[sb][2].v); i4[0].push(m.snap[sa][2].inc); i4[1].push(m.snap[sb][2].inc); }
      const F2 = m.fight; if (!F2 || F2.win < 0) continue; n++; if (F2.win === sa) w++; t0.push(F2.t0);
      if (F2.army) { arm[0].push(F2.army[sa]); arm[1].push(F2.army[sb]); } lost[0].push(F2.lost[sa]); lost[1].push(F2.lost[sb]); }
    const [lo, hi] = wilson(w, n);
    out.push(`| ${NAME[a]} vs ${NAME[b]} | ${map === 'all' ? '**all**' : map} | ${n} | ${w}-${n - w}, ${pct(w / n)} (${Math.round(lo * 100)}-${Math.round(hi * 100)}) | ${fmt(med(t0))} | ${r0(mean(arm[0]))} / ${r0(mean(arm[1]))} | ${r0(mean(lost[0]))} / ${r0(mean(lost[1]))} | ${mean(nodes[0]).toFixed(2)} / ${mean(nodes[1]).toFixed(2)} | ${r0(mean(v4[0]))} / ${r0(mean(v4[1]))} | ${mean(i4[0]).toFixed(1)} / ${mean(i4[1]).toFixed(1)} |`);
  }
  // who won the first fight, and the match? (only if a full-match run is given with --full dir)
  out.push('');
}
console.log(out.join('\n'));
