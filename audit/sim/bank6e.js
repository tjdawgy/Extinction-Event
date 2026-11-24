// Batch 6e (v2.95), Part B2: what each faction leaves unspent. Reads persona-balanced runs (audit/sim/selfplay-6c.js; the
// per-minute series of audit6a.js: credits banked bankM, energy banked eM (since v2.95), income incM, supply popM) and prints,
// per faction and run, the median credits and energy banked at each minute, the share of match time with 1000+ credits
// banked, production idle, and the energy share of what it spent on units.
//   node audit/sim/bank6e.js dirA [dirB ...]
const fs = require('fs'), path = require('path');
const NAME = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' };
const med = a => { a = a.filter(x => x != null); if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
const out = [], MIN = [2, 4, 6, 8, 10, 12, 15, 18];
for (const dir of process.argv.slice(2)) {
  const ms = fs.readFileSync(path.join(dir, 'matches.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(m => !m.err);
  out.push(`### ${path.basename(dir)}`, '', `Median credits / energy banked at the minute (sides still playing):`, '', `| faction | ${MIN.map(m => m + ':00').join(' | ')} | 1000+ credits banked (share of match) | production idle (share) | energy share of unit spending |`, `|---|${MIN.map(() => '---').join('|')}|---|---|---|`);
  for (const f of Object.keys(NAME)) {
    const cells = MIN.map(mi => { const c = [], e = []; for (const m of ms) m.sides.forEach(S => { if (S.fac !== f) return; const k = mi - 1; if (S.ser.bankM[k] != null) c.push(S.ser.bankM[k]); if (S.ser.eM && S.ser.eM[k] != null) e.push(S.ser.eM[k]); }); return `${med(c) ?? '-'} / ${med(e) ?? '-'}`; });
    let fl = 0, idle = 0, T = 0, sc = 0, se = 0;
    for (const m of ms) m.sides.forEach(S => { if (S.fac !== f) return; fl += S.ser.float; idle += S.ser.idle; T += m.t; });
    // energy share by what was trained, at the run's own prices (spentBy is credits + energy; the split from rwD isn't recorded, so
    // it is rebuilt from the unit counts and the run's switches below)
    out.push(`| ${NAME[f]} | ${cells.join(' | ')} | ${Math.round(fl / T * 100)}% | ${Math.round(idle / T * 100)}% | ${ESH(ms, f)} |`);
  }
  out.push('');
}
function ESH(ms, f) {
  const { loadSim } = require('./load'); const S = loadSim(1, { instrument: require('./audit6a-instrument') });
  let c = 0, e = 0;
  for (const m of ms) { const g = S.newGame('hard', { seed: 1, factions: ['axiarchs', 'lastfist'], rework: m.rw }); m.sides.forEach(sd => { if (sd.fac !== f) return; for (const [t, n] of Object.entries(sd.trained)) { const k = S.rwD(g, t).cost; c += k.c * n; e += k.e * n; } }); }
  return (e / (c + e) * 100).toFixed(1) + '%';
}
console.log(out.join('\n'));
