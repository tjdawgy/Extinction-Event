// Batch 6e (v2.95), Part A1: the loss and warp-point analysis behind A1.md, from audit/sim/lanes6e.js's lanes.jsonl.
//   node audit/sim/lanes6e-a1.js dir [dirB]
// Per faction and lane map: value lost per match; of it, units that died alone (no other unit of theirs within 300),
// in a group of under 3.5× their own value, and fresh (warped in or trained under 60 s before); for the Axiarchs where the
// warp point stood (from the HQ, against the middle of the ground army) and how far from it lone units died; and how much
// of the match the ground army's middle stood past the enemy HQ (a base attack walked to the map's edge).
const fs = require('fs'), path = require('path');
const NAME = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' };
const pct = x => isFinite(x) ? Math.round(x * 100) + '%' : '-';
const med = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
const out = [];
for (const dir of process.argv.slice(2)) {
  const ms = fs.readFileSync(path.join(dir, 'lanes.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
  out.push(`### ${path.basename(dir)}`, '', '| faction | map | sides | value lost / match | died alone | in a small group | of the alone, fresh (< 60 s) | of the alone, on "retreat" (holding) | warp point from HQ (median) | army middle from HQ (median) | warp point ahead of the army middle by 400+ | lone deaths: median from the warp point | samples past the enemy HQ |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const map of ['twolane', 'threelane']) for (const fac of ['lastfist', 'bloomhost', 'axiarchs']) {
    let n = 0, lost = 0, alone = 0, small = 0, fresh = 0, ret = 0, wps = [], mids = [], ahead = 0, samp = 0, dW = [], past = 0;
    for (const m of ms) { if (m.map !== map) continue; m.sides.forEach((S, s) => {
      if (S.fac !== fac) return; n++;
      for (const L of S.loss) { lost += L[1]; if (L[3] <= L[1] * 1.01) { alone += L[1]; if (L[9] < 60) fresh += L[1]; if (L[13] === 'retreat') ret += L[1]; if (L[12] >= 0) dW.push(L[12]); } else if (L[3] < L[1] * 3.5) small += L[1]; }
      const far = (map === 'twolane' ? 2200 : 2300) - 440; // the enemy HQ sits 220 from its edge (both maps); past it: from own HQ beyond L - 440 + 40
      for (const x of S.ser) { samp++; if (x.med != null && x.med > far + 40) past++; if (x.wp != null && x.med != null) { wps.push(x.wp); mids.push(x.med); if (x.wp - x.med >= 400) ahead++; } }
    }); }
    if (!n) continue;
    out.push(`| ${NAME[fac]} | ${map} | ${n} | ${Math.round(lost / n)} | ${pct(alone / lost)} | ${pct(small / lost)} | ${pct(fresh / alone)} | ${pct(ret / alone)} | ${med(wps) ?? '-'} | ${med(mids) ?? '-'} | ${wps.length ? pct(ahead / wps.length) : '-'} | ${med(dW) ?? '-'} | ${pct(past / samp)} |`);
  }
  out.push('');
}
console.log(out.join('\n'));
