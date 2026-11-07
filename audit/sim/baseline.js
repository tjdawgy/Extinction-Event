#!/usr/bin/env node
// Phase 0 (v2.56): the audit baseline after the stance fix. Plays every set and reports, per matchup: wins, win share
// ((wins + draws/2) / matches), median match length, the share decided before 20:00 and the share ending in a draw.
//   node audit/sim/baseline.js [--only=mirror,hvh,hvd,tri,field,gvg] [--nm=200] [--nh=20] [--nd=20] [--nt=12] [--jobs=4]
//        [--mirrorJson=out.json (mirror.js output for the same code: reused instead of replaying the mirrors)]
//        [--out=audit/logs-p0/baseline]
// mirror: each faction against itself, seeds 1..nm, side 0 always left. hvh: Hard vs Hard per cross-faction pairing,
// nh seeds paired (each seed with each faction on each side). hvd: Hard vs Default, same faction, nd seeds paired.
// AI sets end at 27:00 (the game's limit). tri / field / gvg: the strategy bots (stratrun.js sets, 30:00 cap as there).
const fs = require('fs'), path = require('path');
const { runSpecs } = require('./run');
const { specsFor } = require('./stratrun');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const F = ['lastfist', 'bloomhost', 'axiarchs'], SH = { lastfist: 'LF', bloomhost: 'BH', axiarchs: 'AX' };
const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : 0; };
const mm = t => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;
const NOFIGHT = 1000; // a match where both sides together dealt less than this (a few shots) never had a fight
const pct = (x, n) => n ? (100 * x / n).toFixed(1) : '–';
// rows: { key, a, b, matches: [{ r: 1 A won | -1 B won | 0 draw, t, early }] }
function stat(ms) {
  const n = ms.length, w = ms.filter(m => m.r > 0).length, l = ms.filter(m => m.r < 0).length, d = n - w - l;
  return { n, w, l, d, share: n ? (w + d / 2) / n : 0, med: med(ms.map(m => m.t)), early: ms.filter(m => m.r !== 0 && m.t < 1200).length, draws: d, quiet: ms.filter(m => m.dmg !== undefined && m.dmg < NOFIGHT).length, known: ms.filter(m => m.dmg !== undefined).length };
}
const row = (k, ms, A = 'A', B = 'B') => { const s = stat(ms); return { k, ...s, line: `| ${k} | ${s.w}–${s.l}–${s.d} | ${pct(s.w + s.d / 2, s.n)}% | ${mm(s.med)} | ${pct(s.early, s.n)}% | ${pct(s.d, s.n)}% | ${s.known ? pct(s.quiet, s.known) + '%' : '–'} |` }; };
const HEAD = '| Matchup | A–B–draw | A share | median length | decided before 20:00 | draws | no fight |\n|---|---|---|---|---|---|---|';
async function play(specs, label, jobs) {
  const t0 = Date.now();
  const res = await runSpecs(specs, jobs, (d, N) => process.stderr.write(`\r${label}: ${d}/${N}`));
  process.stderr.write(` (${Math.round((Date.now() - t0) / 1000)} s)\n`);
  return res.map((r, i) => { const as = specs[i].aSide || 0; return { r: r.winner < 0 ? 0 : r.winner === as ? 1 : -1, t: r.t, how: r.how, spec: specs[i], dmg: (r.sides[0].dmg || 0) + (r.sides[1].dmg || 0) }; });
}
(async () => {
  const only = arg('only', 'mirror,hvh,hvd,tri,field,gvg').split(','), jobs = +arg('jobs', 4), out = arg('out', path.join(__dirname, '..', 'logs-p0', 'baseline'));
  fs.mkdirSync(out, { recursive: true });
  const md = [], raw = {};
  const save = () => { fs.writeFileSync(path.join(out, 'baseline.md'), md.join('\n')); fs.writeFileSync(path.join(out, 'baseline.json'), JSON.stringify(raw)); }; // after every set, so a stopped run keeps what it finished
  const H = f => ({ faction: f, ai: 'hard', persona: 'random' }), D = f => ({ faction: f, ai: 'default', persona: 'random' });
  const mirrorSet = async () => {
    const nm = +arg('nm', 200), rows = [];
    let J = arg('mirrorJson') ? JSON.parse(fs.readFileSync(arg('mirrorJson'), 'utf8')) : null;
    for (const f of F) {
      let ms;
      if (J && J[f]) ms = J[f].seeds.map(([seed, winner, t]) => ({ r: winner < 0 ? 0 : winner === 0 ? 1 : -1, t }));
      else { const specs = []; for (let i = 0; i < nm; i++) specs.push({ seed: 1 + i, diff: 'hard', maxT: 1620, sides: [H(f), H(f)], aSide: 0 }); ms = await play(specs, `${f} mirror`, jobs); }
      raw['mirror ' + f] = ms.map(m => [m.r, m.t, m.dmg]); rows.push(row(`${SH[f]} mirror (A = left)`, ms));
    }
    md.push('### Hard mirrors (A = left spawn, side 0)', HEAD, ...rows.map(r => r.line), ''); save();
  };
  if (only.includes('mirror') && !arg('mirrorLast')) await mirrorSet();
  const paired = (a, b, n, seed) => { const s = []; for (let i = 0; i < n; i++) for (const sw of [0, 1]) s.push({ seed: seed + i, diff: 'hard', maxT: 1620, sides: sw ? [b, a] : [a, b], aSide: sw }); return s; };
  if (only.includes('hvh')) {
    const n = +arg('nh', 20), rows = [], fsh = {};
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      const ms = await play(paired(H(F[i]), H(F[j]), n, 5000 + 100 * i + 10 * j), `${F[i]} vs ${F[j]} hard`, jobs);
      raw[`hvh ${F[i]} ${F[j]}`] = ms.map(m => [m.r, m.t, m.spec.aSide]); rows.push(row(`${SH[F[i]]} Hard vs ${SH[F[j]]} Hard`, ms));
      for (const m of ms) { (fsh[F[i]] = fsh[F[i]] || []).push(m); (fsh[F[j]] = fsh[F[j]] || []).push({ r: -m.r, t: m.t, dmg: m.dmg }); }
    }
    md.push('### Hard vs Hard (paired: each seed with each faction on each side)', HEAD, ...rows.map(r => r.line), '', 'Faction shares across its two pairings:', HEAD, ...F.map(f => row(`${SH[f]} (A) vs the other two`, fsh[f]).line), ''); save();
  }
  if (only.includes('hvd')) {
    const n = +arg('nd', 20), rows = [];
    for (const f of F) { const ms = await play(paired(H(f), D(f), n, 6000 + F.indexOf(f) * 100), `${f} hard vs default`, jobs); raw['hvd ' + f] = ms.map(m => [m.r, m.t, m.spec.aSide]); rows.push(row(`${SH[f]} Hard vs ${SH[f]} Default`, ms)); }
    md.push('### Hard vs Default (same faction, paired)', HEAD, ...rows.map(r => r.line), ''); save();
  }
  const strat = async (set, n, title) => {
    const specs = specsFor(set, n, 97000, F), ms = await play(specs, set, jobs), cells = {};
    ms.forEach((m, i) => (cells[specs[i].cell] = cells[specs[i].cell] || []).push(m));
    raw[set] = ms.map((m, i) => [m.r, m.t, specs[i].cell, specs[i].A ? `${specs[i].fa} ${specs[i].A.opener}/${specs[i].A.branch}` : '', specs[i].B ? `${specs[i].fb} ${specs[i].B.opener}/${specs[i].B.branch}` : '']);
    if (set !== 'field') { md.push(`### ${title}`, HEAD, ...Object.entries(cells).map(([k, v]) => row(k, v).line), ''); save(); return; }
    const by = {}; // openings and branches against the field: each match counts for both bots
    ms.forEach((m, i) => { const sp = specs[i];
      for (const [k, r] of [['opening ' + sp.A.opener, m.r], ['opening ' + sp.B.opener, -m.r], ['branch ' + sp.A.branch, m.r], ['branch ' + sp.B.branch, -m.r]]) (by[k] = by[k] || []).push({ r, t: m.t, dmg: m.dmg }); });
    const all = row('every field match', ms);
    md.push(`### ${title}`, HEAD, all.line, ...Object.keys(by).sort().map(k => row(k + ' vs the field', by[k]).line), ''); save();
  };
  if (only.includes('tri')) await strat('tri', +arg('nt', 12), 'Strategy triangle (scripted bots, mirror per faction; A = the first opening)');
  if (only.includes('field')) await strat('field', 1, 'Strategy field (every opening x branch against a sampled field, all faction pairings)');
  if (only.includes('gvg')) await strat('gvg', +arg('nt', 12), 'Greedy vs Greedy (scripted, cross-faction)');
  if (only.includes('mirror') && arg('mirrorLast')) await mirrorSet();
  save();
  console.log(md.join('\n'));
})().catch(e => { console.error(e); process.exit(1); });
