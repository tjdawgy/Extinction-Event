// Batch 6e (v2.95), Part C1: the opening against the result. Joins audit/sim/early6e.js's early.jsonl with the full matches of a
// persona-balanced run on the same build (audit/sim/selfplay-6c.js; the first 6:00 of a match are the same game) and prints, per
// pairing, the match record of the first-named faction by what happened in the opening: the first field fight won or lost (300+
// value lost, as early6e-report.js), more or fewer field nodes at 5:00, a bigger or smaller army at 4:00 and 5:00.
//   node audit/sim/early6e-join.js earlyDir fullDir
const fs = require('fs'), path = require('path');
const rd = (d, f) => fs.readFileSync(path.join(d, f), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const E = rd(process.argv[2], 'early.jsonl'), M = rd(process.argv[3], 'matches.jsonl');
const key = (map, f, seed, p) => [map, f.join(), seed, p.join()].join('|');
const R = new Map(M.map(m => [key(m.map, m.f, m.seed, [m.sides[0].persona, m.sides[1].persona]), m]));
for (const m of E) { m.fight = null; let cl = []; const close = () => { const lost = [0, 0]; for (const x of cl) lost[x[1]] += x[2]; if (lost[0] + lost[1] >= 300) m.fight = { win: lost[0] < lost[1] ? 0 : 1 }; cl = []; };
  for (const x of m.loss) { if (m.fight) break; if (cl.length && x[0] - cl[cl.length - 1][0] > 20) close(); cl.push(x); } if (!m.fight && cl.length) close(); }
const NAME = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' };
const out = ['| pairing | opening (first named) | match W-L-D |', '|---|---|---|'];
for (const [a, b] of [['lastfist', 'bloomhost'], ['lastfist', 'axiarchs'], ['bloomhost', 'axiarchs']]) {
  const T = {}; const add = (k, r) => { const o = T[k] || (T[k] = [0, 0, 0]); o[r]++; };
  for (const m of E) { const sa = m.f.indexOf(a), sb = m.f.indexOf(b); if (sa < 0 || sb < 0) continue; const r = R.get(key(m.map, m.f, m.seed, m.p)); if (!r) continue;
    const res = r.winner === sa ? 0 : r.winner === sb ? 1 : 2; add('all', res);
    if (m.fight) add(m.fight.win === sa ? 'won the first fight' : 'lost the first fight', res);
    const s5a = m.snap[sa][3], s5b = m.snap[sb][3]; if (s5a && s5b) add(s5a.nodes > s5b.nodes ? 'more nodes at 5:00' : s5a.nodes < s5b.nodes ? 'fewer nodes at 5:00' : 'as many nodes at 5:00', res);
    for (const [i, t] of [[2, '4:00'], [3, '5:00']]) { const x = m.snap[sa][i], y = m.snap[sb][i]; if (x && y) add(x.v >= y.v * 1.2 ? `army 1.2× or more at ${t}` : y.v >= x.v * 1.2 ? `army 1.2× smaller at ${t}` : `armies within 20% at ${t}`, res); }
  }
  for (const k of Object.keys(T)) out.push(`| ${NAME[a]} vs ${NAME[b]} | ${k} | ${T[k].join('-')} |`);
}
console.log(out.join('\n'));
