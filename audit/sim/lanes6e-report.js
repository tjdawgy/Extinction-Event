// Batch 6e (v2.95), Part A: tables from audit/sim/lanes6e.js's lanes.jsonl (one or two runs: before and after).
//   node audit/sim/lanes6e-report.js dirA [dirB]
// Per faction and map: wins; how its ground army sits over the lanes (top lane's share by position, time-weighted over
// samples with 300+ in the lanes; by assignment u.lane too); army in the top / second / third lane by phase; the value in
// capture and raid groups; losses taken outnumbered (its own value within 300 of the dead unit under 2/3 of the enemy's
// there) and of those, while its whole army was at least the enemy's (piecemeal: ahead overall, behind on the spot);
// buildings lost per match (base / forward pads), when the first base building fell, and in its weaker or stronger lane.
const fs = require('fs'), path = require('path');
const NAME = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' };
const load = d => fs.readFileSync(path.join(d, 'lanes.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const pct = x => isFinite(x) ? Math.round(x * 100) + '%' : '-', r0 = x => isFinite(x) ? Math.round(x) : '-';
const fmt = t => t == null ? '-' : `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;
function wilson(w, n) { if (!n) return [0, 0]; const z = 1.96, p = w / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [(c - h) / d, (c + h) / d]; }
function stats(ms, fac, map) {
  const o = { n: 0, w: 0, l: 0, d: 0, top: 0, topW: 0, topA: 0, topAW: 0, ph: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], busy: 0, tot: 0, lost: 0, out: 0, piece: 0, bl: 0, blF: 0, fb: [], peak: 0, armyMean: 0, armyN: 0 };
  for (const m of ms) {
    if (m.map !== map) continue;
    for (let s = 0; s < 2; s++) {
      const S = m.sides[s]; if (S.fac !== fac) continue;
      o.n++; if (m.winner === s) o.w++; else if (m.winner === 1 - s) o.l++; else o.d++;
      for (const x of S.ser) {
        const tot = x.pos.reduce((a, b) => a + b, 0), totA = x.asg.reduce((a, b) => a + b, 0);
        o.busy += x.busy; o.tot += tot + x.busy + x.air;
        o.armyMean += tot + x.busy + x.air; o.armyN++;
        if (tot >= 300) { o.top += Math.max(...x.pos) / tot * tot; o.topW += tot; }
        if (totA >= 300) { o.topA += Math.max(...x.asg) / totA * totA; o.topAW += totA; }
        const ph = x.t < 300 ? 0 : x.t < 600 ? 1 : x.t < 900 ? 2 : 3, srt = x.pos.slice().sort((a, b) => b - a);
        for (let k = 0; k < 3; k++) o.ph[ph][k] += srt[k] || 0; o.ph[ph][3]++;
      }
      for (const L of S.loss) { o.lost += L[1]; if (L[3] < L[4] * 2 / 3) { o.out += L[1]; if (L[5] >= L[6]) o.piece += L[1]; } }
      const base = S.bl.filter(b => !b[3]); o.bl += base.length; o.blF += S.bl.filter(b => b[3]).length;
      if (base.length) o.fb.push(base[0][0]);
    }
  }
  return o;
}
const dirs = process.argv.slice(2), runs = dirs.map(load);
const out = [];
out.push(`## Lane play: ${dirs.map(d => path.basename(d)).join(' → ')}`, '', `Matches: ${runs.map(r => r.length + ' (' + r.filter(m => m.err).length + ' errors)').join(', ')}.`, '');
for (const map of ['twolane', 'threelane']) {
  const nl = map === 'twolane' ? 2 : 3;
  out.push(`### ${map === 'twolane' ? 'Two-Lane' : 'Three-Lane'}`, '');
  out.push('| faction | run | W-L-D | win (95%) | top lane share, by position | by assignment | mean army | in capture/raid groups | lost outnumbered | of it ahead overall (piecemeal) | base buildings lost / match | forward pads lost / match | first base building lost (median) |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) runs.forEach((ms, i) => {
    const o = stats(ms, fac, map); if (!o.n) return; const [a, b] = wilson(o.w, o.n), fb = o.fb.sort((x, y) => x - y);
    out.push(`| ${NAME[fac]} | ${path.basename(dirs[i])} | ${o.w}-${o.l}-${o.d} | ${pct(o.w / o.n)} (${Math.round(a * 100)}-${Math.round(b * 100)}) | ${pct(o.top / o.topW)} | ${pct(o.topA / o.topAW)} | ${r0(o.armyMean / o.armyN)} | ${pct(o.busy / o.tot)} | ${pct(o.out / o.lost)} | ${pct(o.piece / o.lost)} | ${(o.bl / o.n).toFixed(1)} | ${(o.blF / o.n).toFixed(1)} | ${fb.length ? fmt(fb[fb.length >> 1]) + ' (' + fb.length + ' of ' + o.n + ')' : '-'} |`);
  });
  out.push('', `Mean ground army value in its top / second${nl > 2 ? ' / third' : ''} lane (by position), by phase:`, '', '| faction | run | 0-5 min | 5-10 min | 10-15 min | 15+ min |', '|---|---|---|---|---|---|');
  for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) runs.forEach((ms, i) => {
    const o = stats(ms, fac, map); if (!o.n) return;
    out.push(`| ${NAME[fac]} | ${path.basename(dirs[i])} | ${o.ph.map(p => p[3] ? p.slice(0, nl).map(v => r0(v / p[3])).join(' / ') : '-').join(' | ')} |`);
  });
  out.push('');
}
console.log(out.join('\n'));
