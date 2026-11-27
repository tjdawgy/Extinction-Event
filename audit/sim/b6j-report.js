// v3.00 (batch 6j, Part C): the diagnosis tables of a persona-balanced self-play run (audit/sim/selfplay-6c.js). Per faction:
// each unit's cost-efficiency (damage dealt and enemy value killed per 100 credits+energy spent on it), what deals the damage
// its units take (by the enemy's unit type), win rate by match length, and its weakest and strongest units; the Spitter
// openers by personality (6h's counters, EE_B6H=1); tier-3 air per faction; signature buildings. node audit/sim/b6j-report.js <run dir>
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const ms = fs.readFileSync(path.join(dir, 'matches.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
const F = ['lastfist', 'bloomhost', 'axiarchs'], NAME = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' };
const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '-';
const out = [];
const p = s => out.push(s);
p(`# Batch 6j diagnosis: ${dir} (${ms.length} matches)\n`);
for (const f of F) {
  const U = {}, taken = {}, len = { '<10': [0, 0], '10-15': [0, 0], '15-20': [0, 0], '20+': [0, 0] }; let sides = 0, totTaken = 0;
  for (const m of ms) m.sides.forEach((s, i) => {
    if (s.fac !== f) return; sides++;
    const o = m.sides[1 - i];
    for (const [t, n] of Object.entries(s.trained || {})) { const u = U[t] || (U[t] = { n: 0, sp: 0, dmg: 0, kv: 0, k: 0 }); u.n += n; }
    for (const [t, c] of Object.entries(s.spentBy || {})) { const u = U[t] || (U[t] = { n: 0, sp: 0, dmg: 0, kv: 0, k: 0 }); u.sp += c; }
    for (const [t, d] of Object.entries(s.dmg || {})) if (U[t]) U[t].dmg += d;
    for (const [t, v] of Object.entries(s.kval || {})) if (U[t]) U[t].kv += v;
    for (const [dealer, row] of Object.entries(o.mat || {})) for (const [tgt, d] of Object.entries(row)) if (!tgt.startsWith('B:')) { taken[dealer] = (taken[dealer] || 0) + d; totTaken += d; }
    const L = m.t / 60, b = L < 10 ? '<10' : L < 15 ? '10-15' : L < 20 ? '15-20' : '20+'; len[b][1]++; if (m.winner === i) len[b][0]++;
  });
  p(`## ${NAME[f]} (${sides} sides)\n`);
  p('| unit | trained a side | spent a side | damage per 100 spent | value killed per 100 spent |\n|---|---|---|---|---|');
  const rows = Object.entries(U).filter(([t, u]) => u.sp > 0 && !t.startsWith('B:')).sort((a, b) => b[1].sp - a[1].sp);
  for (const [t, u] of rows) p(`| ${t} | ${(u.n / sides).toFixed(1)} | ${Math.round(u.sp / sides)} | ${Math.round(100 * u.dmg / u.sp)} | ${Math.round(100 * u.kv / u.sp)} |`);
  const big = rows.filter(([t, u]) => u.sp / sides >= 200).map(([t, u]) => [t, 100 * u.kv / u.sp]).sort((a, b) => a[1] - b[1]);
  p(`\nWeakest (value killed per 100 spent, units with 200+ spent a side): ${big.slice(0, 3).map(([t, v]) => `${t} ${Math.round(v)}`).join(', ')}; strongest: ${big.slice(-3).reverse().map(([t, v]) => `${t} ${Math.round(v)}`).join(', ')}.\n`);
  p('What deals the damage its units take (enemy dealer, share of all damage to its units): ' + Object.entries(taken).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t, d]) => `${t} ${pct(d, totTaken)}`).join(', ') + '.\n');
  p('Win rate by match length: ' + Object.entries(len).map(([b, [w, n]]) => `${b} min ${w}/${n} (${pct(w, n)})`).join(', ') + '.\n');
}
// Spitter openers (6h's counters: m.b6h.open per side when EE_B6H=1)
const op = {};
for (const m of ms) m.sides.forEach((s, i) => { const o = m.b6h && m.b6h[i] && m.b6h[i].h6 && m.b6h[i].h6.open; if (s.fac !== 'bloomhost' || !o) return; const k = s.persona + ' ' + o; const r = op[k] || (op[k] = [0, 0]); r[1]++; if (m.winner === i) r[0]++; });
if (Object.keys(op).length) p('## Bloomhost openers (wins / sides)\n\n' + Object.entries(op).sort().map(([k, [w, n]]) => `- ${k}: ${w}/${n} (${pct(w, n)})`).join('\n') + '\n');
// tier-3 air and signature buildings
p('## Tier-3 air and the signature pad\n');
for (const f of F) {
  const per = {}; for (const m of ms) m.sides.forEach(s => { if (s.fac !== f) return; const r = per[s.persona] || (per[s.persona] = { n: 0, air: 0, sig: 0, long: 0, airLong: 0 }); r.n++; if (s.t3air != null) r.air++; const b = s.ser.bBuilt || {}; if (b.sigA || b.sigB) r.sig++; if (m.t >= 900) { r.long++; if (s.t3air != null) r.airLong++; } });
  p(`- ${NAME[f]}: tier-3 air ${Object.values(per).reduce((a, r) => a + r.air, 0)} of ${Object.values(per).reduce((a, r) => a + r.n, 0)} sides (in matches of 15:00+: ${Object.values(per).reduce((a, r) => a + r.airLong, 0)} of ${Object.values(per).reduce((a, r) => a + r.long, 0)}); by personality ` + Object.entries(per).map(([k, r]) => `${k} ${r.air}/${r.n}`).join(', ') + '; a signature building ' + Object.entries(per).map(([k, r]) => `${k} ${r.sig}/${r.n}`).join(', '));
}
const txt = out.join('\n'); console.log(txt); if (process.argv[3]) fs.writeFileSync(process.argv[3], txt + '\n');
