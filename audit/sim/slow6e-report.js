// Batch 6e (v2.95): the Three-Lane slow test over 20 seeds under four switch sets (audit/sim/slow6e.js → audit/logs-p1/slow6e/threelane.jsonl).
//   node audit/sim/slow6e-report.js [dir]
const fs = require('fs'), path = require('path');
const dir = process.argv[2] || path.join(__dirname, '..', 'logs-p1', 'slow6e');
const M = fs.readFileSync(path.join(dir, 'threelane.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const out = ['| switch set | matches | both sides all three lanes | the Axiarch side all three lanes (sides) | other sides all three lanes (sides) | ended by an HQ | over by 27:00 | centre and a watchtower | nobody in a wall | forward pads | two capture groups at once | seeds failing a check of the test |', '|---|---|---|---|---|---|---|---|---|---|---|---|'];
for (const cfg of ['on', 'lane0', 'e0', 'off']) {
  const ms = M.filter(m => m.cfg === cfg).sort((a, b) => a.seed - b.seed); if (!ms.length) continue;
  let ax = 0, axN = 0, ot = 0, otN = 0;
  for (const m of ms) m.f.forEach((f, s) => { const all = m.lanes[s].length === 3; if (f === 'axiarchs') { axN++; if (all) ax++; } else { otN++; if (all) ot++; } });
  const c = k => ms.filter(k).length;
  const bad = ms.filter(m => !m.over || !m.all3 || !(m.centre >= 1 && m.towers >= 1) || m.inside).map(m => m.seed);
  out.push(`| ${cfg} | ${ms.length} | ${c(m => m.all3)} | ${ax} of ${axN} | ${ot} of ${otN} | ${c(m => m.hq)} | ${c(m => m.over)} | ${c(m => m.centre >= 1 && m.towers >= 1)} | ${c(m => !m.inside)} | ${c(m => m.fwd)} | ${c(m => m.two)} | ${bad.join(', ') || 'none'} |`);
}
console.log(out.join('\n'));
