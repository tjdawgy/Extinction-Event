// Batch 6d (v2.94), Part A1: why the Turtle and the Economist lose. Reads a persona-balanced self-play run made with the
// series instrumentation (audit/sim/selfplay-6c.js → audit6a.js --one, which since v2.94 records per side: income, army
// value, bank and supply once a game minute; seconds of idle production, of 1000+ credits banked, of attack stance; the
// AI's strategy moves with times). Report only.
//   node audit/sim/diag6d-a1.js [dir]   → <dir>/diag-a1.md
const fs = require('fs'), path = require('path');
const dir = process.argv[2] || path.join(__dirname, '..', 'logs-p1', 'selfplay6d-base');
const M = fs.readFileSync(path.join(dir, 'matches.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const P = ['boomer', 'economist', 'turtle'], F = ['lastfist', 'bloomhost', 'axiarchs'];
const out = [], say = s => out.push(s);
const table = (h, rows) => { say('| ' + h.join(' | ') + ' |'); say('|' + h.map(() => '---').join('|') + '|'); for (const r of rows) say('| ' + r.join(' | ') + ' |'); say(''); };
const med = a => { a = a.filter(x => x != null && !isNaN(x)); if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const mmss = t => { if (t == null) return "-"; t = Math.round(t); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const r0 = x => x == null ? '-' : Math.round(x);
const sides = []; for (const m of M) m.sides.forEach((s, i) => sides.push({ m, i, s, o: m.sides[1 - i], won: m.winner === i, lost: m.winner === 1 - i, draw: !(m.winner >= 0) }));
const base = x => x.s.ser.strat.find(e => e[1] === 'all' || e[1] === 'siege');
const field = x => x.s.ser.strat.find(e => e[1] === 'field' || e[1] === 'all' || e[1] === 'siege');
say(`# Batch 6d, A1: why the Turtle and the Economist lose (${path.basename(dir)}, ${M.length} matches, ${M.filter(m => m.err).length} errors)`); say('');
say('Per side (each match gives two). "Base attack": the AI\'s first strategy move of mode all or siege (its army sent at the enemy base); "field push": its first push of any mode (field, node, all, siege). "Lost before a base attack": losses in which the side never sent a base attack. Idle production: game seconds in which at least one finished production building stood with an empty queue, not upgrading, with supply room. Floating: seconds with 1,000+ credits banked.'); say('');
const row = (lab, ss) => {
  const w = ss.filter(x => x.won).length, l = ss.filter(x => x.lost).length;
  const lb = ss.filter(x => x.lost && !(base(x) && base(x)[0] < x.m.t)).length;
  return [lab, ss.length, `${w}-${l}-${ss.length - w - l}`, mmss(med(ss.map(x => field(x)?.[0]))), mmss(med(ss.map(x => base(x)?.[0]))), `${lb} of ${l}`,
    r0(med(ss.map(x => x.s.ser.idle / x.m.t * 100))) + '%', r0(med(ss.map(x => x.s.ser.float / x.m.t * 100))) + '%', r0(med(ss.map(x => x.s.ser.atk / x.m.t * 100))) + '%'];
};
table(['personality', 'sides', 'W-L-D', 'first field push', 'first base attack', 'lost before a base attack', 'idle production', 'floating', 'attack stance'],
  P.map(p => row(p, sides.filter(x => x.s.persona === p))));
say('Against the Boomer only:'); say('');
table(['personality', 'sides', 'W-L-D', 'first field push', 'first base attack', 'lost before a base attack', 'idle production', 'floating', 'attack stance'],
  P.map(p => row(p, sides.filter(x => x.s.persona === p && x.o.persona === 'boomer'))));
say('## Income and army value over time (medians per side; income = credits + energy per second; army = credits + energy of living units)'); say('');
const at = (x, k, i) => { const a = x.s.ser[k]; return i < a.length ? a[i] : null; };
const MIN = [2, 3, 4, 5, 6, 8, 10, 12];
for (const k of ['incM', 'armyM', 'bankM']) {
  say(`**${{ incM: 'Income', armyM: 'Army value', bankM: 'Bank (credits)' }[k]}** at minute (sides still playing):`); say('');
  table(['personality', ...MIN.map(String)], P.map(p => [p, ...MIN.map(mi => { const v = sides.filter(x => x.s.persona === p).map(x => at(x, k, mi - 1)); return `${r0(med(v))} (${v.filter(z => z != null).length})`; })]));
}
say('Turtle and Economist against a Boomer, paired in the same match (median of own minus the Boomer\'s):'); say('');
table(['personality', ...MIN.map(m => `${m} inc`), ...MIN.slice(0, 6).map(m => `${m} army`)], ['economist', 'turtle'].map(p => { const ss = sides.filter(x => x.s.persona === p && x.o.persona === 'boomer');
  return [p, ...MIN.map(mi => r0(med(ss.map(x => at(x, 'incM', mi - 1) != null && x.o.ser.incM[mi - 1] != null ? at(x, 'incM', mi - 1) - x.o.ser.incM[mi - 1] : null)))), ...MIN.slice(0, 6).map(mi => r0(med(ss.map(x => at(x, 'armyM', mi - 1) != null && x.o.ser.armyM[mi - 1] != null ? at(x, 'armyM', mi - 1) - x.o.ser.armyM[mi - 1] : null))))]; }));
say('## What they spend on (medians per side over the match; credits + energy)'); say('');
const sum2 = a => a ? a[0] + a[1] : 0;
table(['personality', 'earned', 'units', 'buildings', 'upgrades', 'units share', 'Refineries built', 'Turrets built', 'Habitats built', 'tier 2 at', 'tier 3 at', 'supply used/cap at 6:00'],
  P.map(p => { const ss = sides.filter(x => x.s.persona === p); return [p, r0(med(ss.map(x => sum2(x.s.earn)))), r0(med(ss.map(x => sum2(x.s.spentU)))), r0(med(ss.map(x => sum2(x.s.spentB)))), r0(med(ss.map(x => sum2(x.s.spentUp)))),
    r0(med(ss.map(x => 100 * sum2(x.s.spentU) / Math.max(1, sum2(x.s.spentU) + sum2(x.s.spentB) + sum2(x.s.spentUp))))) + '%',
    med(ss.map(x => x.s.ser.bBuilt.refinery || 0)), med(ss.map(x => x.s.ser.bBuilt.turret || 0)), med(ss.map(x => x.s.ser.bBuilt.habitat || 0)), mmss(med(ss.map(x => x.s.tier2))), mmss(med(ss.map(x => x.s.tier3))),
    (() => { const v = ss.map(x => x.s.ser.popM[5]).filter(Boolean); return `${r0(med(v.map(a => a[0])))}/${r0(med(v.map(a => a[1])))}`; })()]; }));
say('Per faction (win rate; median income at 6:00; first base attack):'); say('');
table(['faction', ...P], F.map(f => [f, ...P.map(p => { const ss = sides.filter(x => x.s.fac === f && x.s.persona === p); const w = ss.filter(x => x.won).length; return `${w}/${ss.length}; ${r0(med(ss.map(x => at(x, 'incM', 5))))}; ${mmss(med(ss.map(x => base(x)?.[0])))}`; })]));
say('How the losses happen (lost sides): match length; own army at the end of the last full minute; enemy\'s:'); say('');
table(['personality', 'losses', 'median length', 'own army, last minute', 'enemy army, last minute', 'losses under 10:00'], P.map(p => { const ss = sides.filter(x => x.s.persona === p && x.lost);
  return [p, ss.length, mmss(med(ss.map(x => x.m.t))), r0(med(ss.map(x => x.s.ser.armyM.at(-1)))), r0(med(ss.map(x => x.o.ser.armyM.at(-1)))), ss.filter(x => x.m.t < 600).length]; }));
fs.writeFileSync(path.join(dir, 'diag-a1.md'), out.join('\n') + '\n'); console.log(out.join('\n'));
