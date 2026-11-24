// Batch 6f (v2.96), Part D1: why results swing by map. Joins one persona-balanced self-play run (audit/sim/selfplay-6c.js,
// matches.jsonl: audit6a's per-minute army value and income, damage by type, spending) with the lane trace of the same 162
// matches (audit/sim/lanes6e.js --maps classic,twolane,threelane, lanes.jsonl: army per lane, nodes, every unit and
// building lost). Read only.
//   node audit/sim/maps6f-report.js <selfplay dir> <lanes dir>
// Per faction and map: W-L-D, by opponent; army value and income (median) at 4/8/12/16 min, own vs the opponent's; nodes held
// (mean) at 4/8/12 min; the top lane's share of its ground army; damage by unit type (top five, share); how its losses
// happen: value lost outnumbered (its own within 300 of the dead unit under 2/3 of the enemy's), alone (no own unit within
// 300), in its own half vs the enemy's half, during its own attack stance; buildings lost per match.
const fs = require('fs'), path = require('path');
const [dirM, dirL] = process.argv.slice(2);
const F = ['lastfist', 'bloomhost', 'axiarchs'], NAME = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' }, MAPS = ['classic', 'twolane', 'threelane'];
const rd = (d, f) => fs.readFileSync(path.join(d, f), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const M = rd(dirM, 'matches.jsonl'), Ls = dirL ? rd(dirL, 'lanes.jsonl') : [];
const key = (map, f0, f1, seed) => [map, f0, f1, seed].join();
const LI = new Map(Ls.map(m => [key(m.map, m.f[0], m.f[1], m.seed), m]));
const med = a => { const b = a.filter(x => x != null).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const pct = x => x == null || !isFinite(x) ? '-' : Math.round(100 * x) + '%', r0 = x => x == null ? '-' : Math.round(x);
function wilson(w, n) { if (!n) return [0, 0]; const z = 1.96, p = w / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [(c - h) / d, (c + h) / d]; }
const wr = (w, n) => { const [a, b] = wilson(w, n); return `${pct(w / n)} (${Math.round(a * 100)}-${Math.round(b * 100)})`; };
const out = [`## Map diagnosis: ${path.basename(dirM)}${dirL ? ' + ' + path.basename(dirL) : ''}`, '', `${M.length} matches; ${Ls.length} lane traces (matched by map, factions and seed: ${M.filter(m => LI.has(key(m.map, m.f[0], m.f[1], m.seed)) && LI.get(key(m.map, m.f[0], m.f[1], m.seed)).winner === m.winner && LI.get(key(m.map, m.f[0], m.f[1], m.seed)).t === Math.round(m.t)).length} identical winner and length).`, ''];
const T = { wl: [], ec: [], nd: [], dm: [], ls: [] };
out.push('### Win rates by opponent and map', '', '| faction | vs | classic | twolane | threelane |', '|---|---|---|---|---|');
for (const f of F) for (const o of F) if (o !== f) {
  const cells = MAPS.map(map => { let w = 0, l = 0, d = 0; for (const m of M) { if (m.map !== map) continue; m.sides.forEach((sd, s) => { if (sd.fac !== f || m.sides[1 - s].fac !== o) return; if (m.winner === s) w++; else if (m.winner === 1 - s) l++; else d++; }); } return `${w}-${l}-${d}, ${wr(w, w + l + d)}`; });
  out.push(`| ${NAME[f]} | ${NAME[o]} | ${cells.join(' | ')} |`);
}
out.push('', '### Economy and army (median; own / opponent)', '', '| faction | map | income 4 / 8 / 12 min | army value 4 / 8 / 12 / 16 min | spent on units per min | nodes held 4 / 8 / 12 min (own / opp) |', '|---|---|---|---|---|---|');
for (const f of F) for (const map of MAPS) {
  const inc = [3, 7, 11].map(() => [[], []]), arm = [3, 7, 11, 15].map(() => [[], []]), sp = [], nd = [24, 48, 72].map(() => [[], []]);
  for (const m of M) { if (m.map !== map) continue; m.sides.forEach((sd, s) => { if (sd.fac !== f) return; const o = m.sides[1 - s];
    [3, 7, 11].forEach((k, i) => { inc[i][0].push(sd.ser.incM[k]); inc[i][1].push(o.ser.incM[k]); });
    [3, 7, 11, 15].forEach((k, i) => { arm[i][0].push(sd.ser.armyM[k]); arm[i][1].push(o.ser.armyM[k]); });
    sp.push((sd.spentU[0] + sd.spentU[1]) / Math.max(1, m.t / 60));
    const L = LI.get(key(m.map, m.f[0], m.f[1], m.seed)); if (L) { const ser = L.sides[s].ser; [24, 48, 72].forEach((k, i) => { const x = ser.find(z => Math.abs(z.t - k * 10) < 6); if (x) { nd[i][0].push(x.nodes.filter(n => n === s).length); nd[i][1].push(x.nodes.filter(n => n === 1 - s).length); } }); }
  }); }
  out.push(`| ${NAME[f]} | ${map} | ${inc.map(p => `${r0(med(p[0]))}/${r0(med(p[1]))}`).join(' · ')} | ${arm.map(p => `${r0(med(p[0]))}/${r0(med(p[1]))}`).join(' · ')} | ${r0(med(sp))} | ${nd.map(p => `${p[0].length ? mean(p[0]).toFixed(1) : '-'}/${p[1].length ? mean(p[1]).toFixed(1) : '-'}`).join(' · ')} |`);
}
out.push('', '### Lanes (lane traces): the top lane\'s share of its ground army (300+ in the lanes); samples where the enemy has more in its main lane than it has', '', '| faction | map | top lane share | outnumbered in its main lane |', '|---|---|---|---|');
for (const f of F) for (const map of MAPS) {
  let top = 0, topW = 0, n = 0, outN = 0;
  for (const L of Ls) { if (L.map !== map) continue; L.sides.forEach((S, s) => { if (S.fac !== f) return; for (const x of S.ser) { const tot = x.pos.reduce((a, b) => a + b, 0); if (tot < 300) continue; const k = x.pos.indexOf(Math.max(...x.pos)); top += x.pos[k]; topW += tot; n++; if (x.en[k] > x.pos[k]) outN++; } }); }
  out.push(`| ${NAME[f]} | ${map} | ${pct(top / topW)} | ${pct(outN / n)} |`);
}
out.push('', '### Who does the damage (share of the faction\'s damage, top five types)', '', '| faction | map | damage per match | top types |', '|---|---|---|---|');
for (const f of F) for (const map of MAPS) {
  const D = {}; let n = 0;
  for (const m of M) { if (m.map !== map) continue; for (const sd of m.sides) { if (sd.fac !== f) continue; n++; for (const [t, v] of Object.entries(sd.dmg)) D[t] = (D[t] || 0) + v; } }
  const tot = Object.values(D).reduce((a, b) => a + b, 0), top = Object.entries(D).sort((a, b) => b[1] - a[1]).slice(0, 5);
  out.push(`| ${NAME[f]} | ${map} | ${r0(tot / n)} | ${top.map(([t, v]) => `${t} ${pct(v / tot)}`).join(', ')} |`);
}
out.push('', '### How it loses its army (lane traces; value lost per match and its share)', '', '| faction | map | lost per match | outnumbered | alone (no own unit within 300) | under a minute old | in its own half | in the enemy half while attacking | buildings lost per match (forward pads) |', '|---|---|---|---|---|---|---|---|---|');
for (const f of F) for (const map of MAPS) {
  let n = 0, lost = 0, outn = 0, alone = 0, young = 0, own = 0, atk = 0, bl = 0, blF = 0;
  for (const L of Ls) { if (L.map !== map) continue; const half = L.map === 'classic' ? 850 : L.map === 'twolane' ? 1100 : 1150; L.sides.forEach((S, s) => { if (S.fac !== f) return; n++;
    for (const x of S.loss) { const v = x[1]; lost += v; if (x[3] < x[4] * 2 / 3) outn += v; if (x[3] <= v) alone += v; if (x[9] < 60) young += v; if (x[7] < half) own += v; else if (x[13] === 'attack') atk += v; }
    bl += S.bl.length; blF += S.bl.filter(b => b[3]).length; }); }
  out.push(`| ${NAME[f]} | ${map} | ${r0(lost / n)} | ${pct(outn / lost)} | ${pct(alone / lost)} | ${pct(young / lost)} | ${pct(own / lost)} | ${pct(atk / lost)} | ${(bl / n).toFixed(1)} (${(blF / n).toFixed(1)}) |`);
}
out.push('', '### How matches end, per faction and map (wins and losses: by HQ, median length)', '', '| faction | map | wins: median length | losses: median length | draws |', '|---|---|---|---|---|');
const fmt = t => t == null ? '-' : `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;
for (const f of F) for (const map of MAPS) {
  const w = [], l = []; let d = 0;
  for (const m of M) { if (m.map !== map) continue; m.sides.forEach((sd, s) => { if (sd.fac !== f) return; if (m.winner === s) w.push(m.t); else if (m.winner === 1 - s) l.push(m.t); else d++; }); }
  out.push(`| ${NAME[f]} | ${map} | ${w.length}: ${fmt(med(w))} | ${l.length}: ${fmt(med(l))} | ${d} |`);
}
console.log(out.join('\n'));
