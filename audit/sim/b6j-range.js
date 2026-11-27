// Batch 6j (v3.00, Part D): cost-equal Test Range checks on the real SIM over seeds (target: each side wins 35-65%).
//   node audit/sim/b6j-range.js [--seeds 20] [--only name] [--html file] [--rw b6j=0] [--out audit/logs-p1/b6j/range.md]
// gnat4: 4 Gnatclouds (480 credits, 160 energy) attacking 10 Marines (480) on Hold; gnat4b: both attacking; gnat1: one cloud
// attacking 10 Marines (6i's check); wwGs: 2 Wraithwings (460/200) against 2 Gunships (aircraft, about the same value), both attacking; wwMar: 2
// Wraithwings attacking 13 Marines (624, about their value in credits and energy) on Hold; titanLn / titanSp: 2 Titans
// (840/320) against 7 Lancers (840/315) or 13 Spitters (910/260), both attacking. Units are spread over a row.
const { loadSim } = require('./load'), fs = require('fs'), path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('seeds', '20'), ONLY = arg('only', null), RW = {}; for (const kv of (arg('rw', '') || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); RW[k] = v !== '0'; }
const H = `this.__sim.R6 = { rangeGame, rangeUnits, rangeStep, TICK, UDEF, rwShow: typeof rwShow === 'function' ? rwShow : null };`;
const alive = (g, us) => us.filter(e => e.hp > 0 && g.ents.includes(e) && !e.dead).length;
const val = (S, us) => us.reduce((a, e) => a + S.UDEF[e.type].cost.c + S.UDEF[e.type].cost.e, 0);
const SC = {
  gnat4: { f: ['bloomhost', 'lastfist'], m: ['attack', 'hold'], a: ['needlewing', 4, 640], b: ['rifle', 10, 820] },
  gnat4b: { f: ['bloomhost', 'lastfist'], m: ['attack', 'attack'], a: ['needlewing', 4, 640], b: ['rifle', 10, 900] },
  gnat1: { f: ['bloomhost', 'lastfist'], m: ['attack', 'hold'], a: ['needlewing', 1, 640], b: ['rifle', 10, 820] },
  wwGs: { f: ['axiarchs', 'lastfist'], m: ['attack', 'attack'], a: ['wraithwing', 2, 600], b: ['aircraft', 2, 900] },
  wwMar: { f: ['axiarchs', 'lastfist'], m: ['attack', 'hold'], a: ['wraithwing', 2, 640], b: ['rifle', 13, 820] },
  titanLn: { f: ['lastfist', 'axiarchs'], m: ['attack', 'attack'], a: ['titan', 2, 600], b: ['lancer', 7, 900] },
  titanSp: { f: ['lastfist', 'bloomhost'], m: ['attack', 'attack'], a: ['titan', 2, 600], b: ['spitter', 13, 900] },
};
function run(name, sc, seed) {
  const S = loadSim(seed, { instrument: H + (arg('code') ? '\n' + arg('code') : ''), file: arg('html') }), R = S.R6; // --code: an ablation (a SIM constant set before the fight)
  const g = R.rangeGame({ seed, factions: sc.f, rework: Object.assign({}, S.REWORK, RW) });
  const A = R.rangeUnits(g, 0, sc.a[0], sc.a[2], 0, sc.a[1]), B = R.rangeUnits(g, 1, sc.b[0], sc.b[2], 0, sc.b[1]);
  g.sides[0].mode = sc.m[0]; g.sides[1].mode = sc.m[1];
  let t = 0; while (t < 90 && alive(g, A) && alive(g, B)) { R.rangeStep(g); t += R.TICK; }
  return { name, seed, t: Math.round(t), aLeft: alive(g, A), bLeft: alive(g, B), aVal: val(S, A), bVal: val(S, B), win: alive(g, B) === 0 && alive(g, A) > 0 ? 1 : 0, lose: alive(g, A) === 0 && alive(g, B) > 0 ? 1 : 0 };
}
const rows = [];
for (const k of Object.keys(SC)) if (!ONLY || ONLY.split(',').includes(k)) for (let s = 0; s < N; s++) rows.push(run(k, SC[k], 7300 + s));
const lines = [`# Batch 6j Test Range cost-equal checks (${N} seeds each${Object.keys(RW).length ? ', ' + JSON.stringify(RW) : ', every switch on'})`, '', '| scene | first side wins | second side wins | neither | first side left | second side left | mean time (s) | values (first / second) |', '|---|---|---|---|---|---|---|---|'];
for (const k of Object.keys(SC)) {
  const r = rows.filter(x => x.name === k); if (!r.length) continue;
  const m = f => (r.reduce((a, x) => a + f(x), 0) / r.length).toFixed(1);
  lines.push(`| ${k} | ${r.filter(x => x.win).length}/${r.length} | ${r.filter(x => x.lose).length}/${r.length} | ${r.filter(x => !x.win && !x.lose).length} | ${m(x => x.aLeft)} | ${m(x => x.bLeft)} | ${m(x => x.t)} | ${r[0].aVal} / ${r[0].bVal} |`);
}
const out = arg('out', null);
if (out) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, lines.join('\n') + '\n'); }
console.log(lines.join('\n'));
