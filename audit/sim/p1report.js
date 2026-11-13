#!/usr/bin/env node
// v2.80: the Phase 1 balance pass's tables from the set files p1.js saved.
//   node audit/sim/p1report.js audit/logs-p1/balance/<tag> [--md=out.md] [--wins]
// Ladder and condition sets: result, median and quartiles of length, decided before 20:00, draws, no fight (both sides
// under 1,000 damage), spawn sides, how decided matches ended; per faction its cross-faction share ((wins + draws/2) /
// games) and each mirror by side. Strategy sets: the triangle per faction (A's share), openings and branches against the
// field. --wins: the units alive in winning armies, per faction and map.
const fs = require('fs'), path = require('path');
const dir = process.argv[2], mdOut = (process.argv.find(x => x.startsWith('--md=')) || '').slice(5), wins = process.argv.includes('--wins');
const F = ['lastfist', 'bloomhost', 'axiarchs'], AB = { lastfist: 'LF', bloomhost: 'BH', axiarchs: 'AX' };
const mm = t => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`, pct = x => (100 * x).toFixed(1) + '%';
const q = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(p * b.length))] : 0; };
const out = [], P = s => out.push(s);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
const sets = files.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const order = s => { const [k, m] = s.set.split(':'); return 'LCTF'.indexOf(k) * 10 + ['classic', 'twolane', 'threelane'].indexOf(m); };
sets.sort((a, b) => order(a) - order(b) || a.set.localeCompare(b.set));
const lad = sets.filter(s => s.set[0] === 'L' || s.set[0] === 'C');
if (lad.length) {
  P('| Set | n | A–B–draw | A share | median (Q1–Q3) | decided < 20:00 | draws | no fight | left–right (decided) | LF / BH / AX cross-faction | mirrors LF / BH / AX (left–right–draw) | won after 20:00 |');
  P('|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const S of lad) {
    const M = S.matches, n = M.length;
    let w = 0, l = 0, d = 0, left = 0, right = 0, early = 0, quiet = 0, storm = 0; const fac = {}, mir = {}, ts = [];
    for (const m of M) {
      const r = m.w < 0 ? 0 : m.w === m.aSide ? 1 : -1; ts.push(m.t);
      if (r > 0) w++; else if (r < 0) l++; else d++;
      if (m.w === 0) left++; else if (m.w === 1) right++;
      if (r && m.t < 1200) early++;
      if ((m.sides[0].dmg || 0) + (m.sides[1].dmg || 0) < 1000) quiet++;
      if (m.w >= 0 && m.t >= 1200) storm++;
      const add = (f, k) => { const o = fac[f] || (fac[f] = { w: 0, l: 0, d: 0 }); o[k]++; };
      if (m.fa === m.fb) { const o = mir[m.fa] || (mir[m.fa] = [0, 0, 0]); o[m.w < 0 ? 2 : m.w]++; continue; }
      if (r > 0) { add(m.fa, 'w'); add(m.fb, 'l'); } else if (r < 0) { add(m.fa, 'l'); add(m.fb, 'w'); } else { add(m.fa, 'd'); add(m.fb, 'd'); }
    }
    const fs_ = F.map(f => { const o = fac[f]; return o ? pct((o.w + o.d / 2) / (o.w + o.l + o.d)).replace('%', '') : '–'; }).join(' / ');
    const ms = F.map(f => mir[f] ? mir[f].join('–') : '–').join(' / ');
    P(`| ${S.set.replace(/^[LC]:/, '')} | ${n} | ${w}–${l}–${d} | ${pct((w + d / 2) / n)} | ${mm(q(ts, 0.5))} (${mm(q(ts, 0.25))}–${mm(q(ts, 0.75))}) | ${pct(early / n)} | ${pct(d / n)} | ${pct(quiet / n)} | ${left}–${right} | ${fs_} | ${ms} | ${storm} |`);
  }
  P('');
}
for (const S of sets.filter(s => s.set[0] === 'T')) {
  const cells = {};
  for (const m of S.matches) { const r = m.w < 0 ? 0 : m.w === m.aSide ? 1 : -1, c = cells[m.cell] || (cells[m.cell] = { w: 0, l: 0, d: 0, t: [] }); c[r > 0 ? 'w' : r < 0 ? 'l' : 'd']++; c.t.push(m.t); }
  P(`**${S.set}** (A's share; n per cell ${Object.values(cells)[0] ? Object.values(cells)[0].w + Object.values(cells)[0].l + Object.values(cells)[0].d : 0})`, '');
  const edges = ['rush>greedy', 'greedy>turtle', 'turtle>rush', 'contain>greedy', 'contain>turtle', 'contain>rush'];
  P('| Edge | ' + F.map(f => AB[f]).join(' | ') + ' |'); P('|---|---|---|---|');
  for (const e of edges) P(`| ${e} | ` + F.map(f => { const c = cells[`${f} ${e}`]; return c ? `${pct((c.w + c.d / 2) / (c.w + c.l + c.d))} (${c.w}–${c.l}–${c.d})` : '–'; }).join(' | ') + ' |');
  P('');
}
for (const S of sets.filter(s => s.set[0] === 'F')) {
  const br = {}, op = {}, bf = {}, add = (o, k, r) => { const x = o[k] || (o[k] = { w: 0, l: 0, d: 0 }); x[r > 0 ? 'w' : r < 0 ? 'l' : 'd']++; };
  const ts = [];
  for (const m of S.matches) {
    const r = m.w < 0 ? 0 : m.w === m.aSide ? 1 : -1; ts.push(m.t);
    add(br, m.A.branch, r); add(br, m.B.branch, -r); add(op, m.A.opener, r); add(op, m.B.opener, -r);
    add(bf, AB[m.fa] + ' ' + m.A.branch, r); add(bf, AB[m.fb] + ' ' + m.B.branch, -r);
  }
  const fmt = o => Object.entries(o).sort().map(([k, x]) => `${k} ${pct((x.w + x.d / 2) / (x.w + x.l + x.d))} (${x.w}–${x.l}–${x.d})`).join('; ');
  P(`**${S.set}** (${S.matches.length} matches, median ${mm(q(ts, 0.5))})`, '', `- branches vs the field: ${fmt(br)}`, `- openings vs the field: ${fmt(op)}`, `- faction × branch: ${fmt(bf)}`, '');
}
if (wins) for (const S of lad.filter(s => /hard-hard|normal-normal/.test(s.set) && s.set[0] === 'L')) {
  const by = {};
  for (const m of S.matches) { if (m.w < 0) continue; const sd = m.sides[m.w], o = by[sd.f] || (by[sd.f] = {}); for (const [t, k] of Object.entries(sd.alive || {})) o[t] = (o[t] || 0) + k; }
  P(`**${S.set}: units alive in winning armies**`, '');
  for (const f of F) if (by[f]) { const tot = Object.values(by[f]).reduce((a, b) => a + b, 0); P(`- ${AB[f]}: ` + Object.entries(by[f]).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t, k]) => `${t} ${Math.round(100 * k / tot)}%`).join(', ')); }
  P('');
}
const txt = out.join('\n'); console.log(txt); if (mdOut) fs.writeFileSync(mdOut, txt + '\n');
