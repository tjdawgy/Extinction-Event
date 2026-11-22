// Batch 6d (v2.94), Part B1: why Last Fist wins. Reads a persona-balanced self-play run (audit/sim/selfplay-6c.js) recorded
// with the v2.94 instrumentation (per side: income, army value and bank once a game minute; damage by dealer and target type).
//   node audit/sim/diag6d-b1.js [dir]   → <dir>/diag-b1.md
const fs = require('fs'), path = require('path');
const dir = process.argv[2] || path.join(__dirname, '..', 'logs-p1', 'selfplay6d-a3');
const M = fs.readFileSync(path.join(dir, 'matches.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(m => !m.err);
const F = ['lastfist', 'bloomhost', 'axiarchs'], FN = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' };
const out = [], say = s => out.push(s);
const table = (h, rows) => { say('| ' + h.join(' | ') + ' |'); say('|' + h.map(() => '---').join('|') + '|'); for (const r of rows) say('| ' + r.join(' | ') + ' |'); say(''); };
const med = a => { a = a.filter(x => x != null && !isNaN(x)); if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const sum = a => a.reduce((x, y) => x + y, 0);
const r0 = x => x == null ? '-' : Math.round(x);
const mmss = t => t == null ? '-' : `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;
const sides = []; for (const m of M) m.sides.forEach((s, i) => sides.push({ m, i, s, o: m.sides[1 - i], won: m.winner === i, lost: m.winner === 1 - i }));
say(`# Batch 6d, B1: why Last Fist wins (${path.basename(dir)}, ${M.length} matches)`); say('');
// 1. curves
const MIN = [2, 3, 4, 5, 6, 8, 10, 12, 15];
for (const [k, lab] of [['incM', 'Income (credits + energy per second)'], ['armyM', 'Army value (credits + energy of living units)']]) {
  say(`## ${lab}, medians at minute (sides still playing)`); say('');
  table(['faction', ...MIN.map(String)], F.map(f => [FN[f], ...MIN.map(mi => { const v = sides.filter(x => x.s.fac === f).map(x => x.s.ser[k][mi - 1]).filter(z => z != null); return `${r0(med(v))}`; })]));
}
say('Paired in the same match (median of Last Fist minus the opponent), by opponent:'); say('');
table(['opponent', 'measure', ...MIN.slice(0, 7).map(String)], ['bloomhost', 'axiarchs'].flatMap(op => ['incM', 'armyM'].map(k => [FN[op], k === 'incM' ? 'income' : 'army', ...MIN.slice(0, 7).map(mi => r0(med(sides.filter(x => x.s.fac === 'lastfist' && x.o.fac === op).map(x => x.s.ser[k][mi - 1] != null && x.o.ser[k][mi - 1] != null ? x.s.ser[k][mi - 1] - x.o.ser[k][mi - 1] : null))))])));
say('## Economy and spending (medians per side over the match; credits + energy)'); say('');
const s2 = a => a ? a[0] + a[1] : 0;
table(['faction', 'earned', 'per minute', 'units', 'buildings', 'upgrades', 'tier 2 at', 'tier 3 at', 'first T3 unit', 'peak units'], F.map(f => { const ss = sides.filter(x => x.s.fac === f);
  return [FN[f], r0(med(ss.map(x => s2(x.s.earn)))), r0(med(ss.map(x => s2(x.s.earn) / x.m.t * 60))), r0(med(ss.map(x => s2(x.s.spentU)))), r0(med(ss.map(x => s2(x.s.spentB)))), r0(med(ss.map(x => s2(x.s.spentUp)))), mmss(med(ss.map(x => x.s.tier2))), mmss(med(ss.map(x => x.s.tier3))), mmss(med(ss.map(x => x.s.t3unit))), r0(med(ss.map(x => x.s.peak)))]; }));
// 2. when matches are decided: the last minute at which the eventual winner's army value was not ahead
say('## When matches are decided'); say('');
say('"Decided at": the first minute after which the winner\'s army value stays ahead of the loser\'s at every later minute sample to the end ("lead never lost"). "Lead at decision": the winner\'s army minus the loser\'s then.'); say('');
const dec = m => { const W = m.sides[m.winner].ser.armyM, Lo = m.sides[1 - m.winner].ser.armyM, n = Math.min(W.length, Lo.length); let k = n; for (let i = n - 1; i >= 0; i--) { if (W[i] > Lo[i]) k = i; else break; } return k < n ? { t: (k + 1) * 60, lead: W[k] - Lo[k], incLead: m.sides[m.winner].ser.incM[k] - m.sides[1 - m.winner].ser.incM[k] } : null; };
const prs = [['lastfist', 'bloomhost'], ['lastfist', 'axiarchs'], ['bloomhost', 'axiarchs']];
table(['pairing', 'winner', 'matches', 'decided at (median)', 'lead at decision', 'income lead then', 'match length'], prs.flatMap(([a, b]) => [a, b].map(w => { const ms = M.filter(m => m.f.includes(a) && m.f.includes(b) && m.winner >= 0 && m.f[m.winner] === w); const d = ms.map(dec).filter(Boolean);
  return [`${FN[a]} vs ${FN[b]}`, FN[w], ms.length, mmss(med(d.map(x => x.t))), r0(med(d.map(x => x.lead))), r0(med(d.map(x => x.incLead))), mmss(med(ms.map(m => m.t)))]; })));
// 3. damage matrix
const cat = (t, U) => t.startsWith('B:') ? 'buildings' : t;
say('## Damage matrix: who deals damage to what (totals over the run, per faction pairing; top dealers, each with its three main targets and its share of its side\'s damage)'); say('');
for (const [a, b] of [['lastfist', 'bloomhost'], ['lastfist', 'axiarchs'], ['bloomhost', 'lastfist'], ['axiarchs', 'lastfist'], ['bloomhost', 'axiarchs'], ['axiarchs', 'bloomhost']]) {
  const ss = sides.filter(x => x.s.fac === a && x.o.fac === b), mat = {}, tot = {};
  for (const x of ss) for (const [d, row] of Object.entries(x.s.mat || {})) for (const [v, n] of Object.entries(row)) { const o = mat[d] || (mat[d] = {}); const c = cat(v); o[c] = (o[c] || 0) + n; tot[d] = (tot[d] || 0) + n; }
  const all = sum(Object.values(tot));
  say(`**${FN[a]} against ${FN[b]}** (${ss.length} sides, ${r0(all / ss.length)} damage per side):`); say('');
  table(['dealer', 'share', 'to units', 'to buildings', 'main targets'], Object.entries(tot).sort((p, q) => q[1] - p[1]).slice(0, 10).map(([d, n]) => { const row = mat[d], bu = row.buildings || 0;
    const tg = Object.entries(row).filter(([k]) => k !== 'buildings').sort((p, q) => q[1] - p[1]).slice(0, 3).map(([k, v]) => `${k} ${r0(100 * v / n)}%`).join(', ');
    return [d, r0(100 * n / all) + '%', r0((n - bu) / ss.length), r0(bu / ss.length), tg]; }));
}
// 4. per unit: damage per 100 spent, usage, share of the faction's damage in wins
say('## Units: damage and killed value per 100 spent, trained, and their share of the faction\'s damage in matches it won'); say('');
for (const f of F) {
  const ss = sides.filter(x => x.s.fac === f), U = {};
  for (const x of ss) for (const [t, sp] of Object.entries(x.s.spentBy)) { const o = U[t] || (U[t] = { sp: 0, dmg: 0, kv: 0, n: 0, sides: 0, dw: 0 }); o.sp += sp; o.dmg += x.s.dmg[t] || 0; o.kv += x.s.kval[t] || 0; o.n += x.s.trained[t] || 0; o.sides++; if (x.won) o.dw += x.s.dmg[t] || 0; }
  const winTot = sum(ss.filter(x => x.won).map(x => sum(Object.values(x.s.dmg))));
  say(`**${FN[f]}** (${ss.length} sides; damage in its wins ${r0(winTot)}):`); say('');
  table(['unit', 'damage per 100 spent', 'killed value per 100 spent', 'trained', 'sides', 'spent', 'share of damage in wins'], Object.entries(U).sort((p, q) => q[1].sp - p[1].sp).map(([t, o]) => [t, r0(100 * o.dmg / o.sp), r0(100 * o.kv / o.sp), o.n, o.sides, r0(o.sp), r0(100 * o.dw / Math.max(1, winTot)) + '%']));
  const bt = {}; for (const x of ss) for (const [t, n] of Object.entries(x.s.dmg)) if (!x.s.spentBy[t]) bt[t] = (bt[t] || 0) + n;
  say(`Damage from buildings and abilities (per side): ${Object.entries(bt).sort((p, q) => q[1] - p[1]).slice(0, 6).map(([t, n]) => `${t} ${r0(n / ss.length)}`).join(', ')}.`); say('');
}
fs.writeFileSync(path.join(dir, 'diag-b1.md'), out.join('\n') + '\n'); console.log(out.join('\n'));
