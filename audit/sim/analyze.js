#!/usr/bin/env node
// Reads a balance-<tag>.json (balance.js --diag) and prints the diagnosis tables: economy and army curves per faction in
// each cross pairing, when the army gap opens, damage and kills by weapon per faction, abilities and signature buildings.
//   node audit/sim/analyze.js [tag]
const fs = require('fs'), path = require('path');
const tag = process.argv[2] || 'base', R = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', `balance-${tag}.json`)));
const FAC = ['lastfist', 'bloomhost', 'axiarchs'];
const sets = { ...R.cross, ...Object.fromEntries(Object.entries(R.persona).map(([k, v]) => ['p:' + k, v])) };
const sideOf = (m, k) => k === 'A' ? m.aSide : 1 - m.aSide;
// 1) curves per cross pairing: mean earned, army value, nodes at minute marks (matches still running)
console.log('## Curves (cross, random personalities): earned credits / army value / nodes held, mean over matches still running');
for (const key in R.cross) {
  const S = R.cross[key]; console.log(`\n${S.A} vs ${S.B}`);
  for (const t of [120, 240, 360, 480, 600, 780, 960, 1200]) {
    const rows = S.matches.filter(m => m.t >= t - 15).map(m => { const sm = m.samples.filter(x => x.t <= t).pop(); return [sideOf(m, 'A'), sideOf(m, 'B')].map(s => [sm.earned[s], sm.army[s], sm.nodes.filter(o => o === s).length, sm.pop[s]]); });
    if (!rows.length) continue;
    const avg = (i, j) => Math.round(rows.reduce((a, r) => a + r[i][j], 0) / rows.length * 10) / 10;
    console.log(`  ${String(t / 60).padStart(4)} min (${rows.length}): A earned ${avg(0, 0)} army ${avg(0, 1)} nodes ${avg(0, 2)} pop ${avg(0, 3)} | B earned ${avg(1, 0)} army ${avg(1, 1)} nodes ${avg(1, 2)} pop ${avg(1, 3)}`);
  }
}
// 2) damage dealt and value killed by weapon, per faction, all cross + persona sets, by 5-minute bucket
const agg = {};
for (const S of Object.values(sets)) for (const m of S.matches) for (const k of ['A', 'B']) {
  const sd = m[k], f = sd.faction, a = agg[f] || (agg[f] = { dmg: {}, kills: {}, n: 0 }); a.n++;
  if (!sd.diag) continue;
  for (const w in sd.diag.dmg) { const x = a.dmg[w] || (a.dmg[w] = [0, 0, 0, 0, 0, 0]); sd.diag.dmg[w].forEach((v, i) => x[i] += v); }
  for (const w in sd.diag.kills) { const x = a.kills[w] || (a.kills[w] = [0, 0, 0, 0, 0, 0]); sd.diag.kills[w].forEach((v, i) => x[i] += v); }
}
console.log('\n## Damage dealt per side per match by weapon (HP + shields removed), by 5-minute bucket, and value killed');
for (const f of FAC) {
  const a = agg[f]; if (!a) continue;
  console.log(`\n${f} (${a.n} sides)`);
  const ws = Object.keys(a.dmg).sort((x, y) => a.dmg[y].reduce((p, q) => p + q) - a.dmg[x].reduce((p, q) => p + q));
  for (const w of ws.slice(0, 22)) { const d = a.dmg[w]; const kw = w.replace(/>.$/, ''); console.log(`  ${w.padEnd(14)} total ${String(Math.round(d.reduce((p, q) => p + q) / a.n)).padStart(6)}  by bucket ${d.map(v => Math.round(v / a.n)).join(' / ')}${w.endsWith('>U') && a.kills[kw] ? `  killed value ${Math.round(a.kills[kw].reduce((p, q) => p + q) / a.n)}` : ''}`); }
}
// 3) trained and lost value per faction; abilities; signature effects
console.log('\n## Abilities used per side per match (count) and signature-building effects');
const ab = {};
for (const S of Object.values(sets)) for (const m of S.matches) for (const k of ['A', 'B']) {
  const sd = m[k], f = sd.faction, a = ab[f] || (ab[f] = { n: 0, ab: {}, eff: {}, salv: 0, mites: 0, echoes: 0, bk: 0, sig: {}, t3: {} }); a.n++;
  for (const x in sd.ab || {}) { a.ab[x] = (a.ab[x] || 0) + sd.ab[x][0]; a.eff[x] = (a.eff[x] || 0) + sd.ab[x][1]; }
  a.salv += sd.salvage; a.mites += (sd.mites || {}).n || 0; a.echoes += sd.echoes || 0; a.bk += sd.bkHeal || 0;
  for (const t in sd.tech) if (/^sig/.test(t) || /:T3$/.test(t)) { (a.t3[t] || (a.t3[t] = [])).push(sd.tech[t]); }
}
for (const f of FAC) {
  const a = ab[f]; console.log(`\n${f} (${a.n} sides): uses ${Object.entries(a.ab).filter(([, v]) => v).map(([k, v]) => `${k} ${(v / a.n).toFixed(2)} (effect ${Math.round(a.eff[k] / a.n)})`).join(', ')}; salvage ${Math.round(a.salv / a.n)}, mites ${(a.mites / a.n).toFixed(1)}, echoes ${(a.echoes / a.n).toFixed(1)}, bunker heal ${Math.round(a.bk / a.n)}`);
  for (const t of Object.keys(a.t3).sort()) { const v = a.t3[t].sort((x, y) => x - y); console.log(`    ${t.padEnd(18)} reached by ${(100 * v.length / a.n).toFixed(0)}% of sides, median at ${Math.floor(v[v.length >> 1] / 60)}:${String(v[v.length >> 1] % 60).padStart(2, '0')}`); }
}
// 4) match length distribution and when losers' armies collapse
console.log('\n## Decided-by time for each faction\'s losses (cross + persona)');
for (const f of FAC) { const ts = []; for (const S of Object.values(sets)) for (const m of S.matches) for (const k of ['A', 'B']) if (m[k].faction === f && m.result !== 'draw' && m.result !== k && m.A.faction !== m.B.faction) ts.push(m.t); ts.sort((a, b) => a - b); const q = p => { const t = ts[Math.floor(p * (ts.length - 1))]; return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }; if (ts.length) console.log(`  ${f}: ${ts.length} losses, quartiles ${q(0.25)} / ${q(0.5)} / ${q(0.75)}`); }
