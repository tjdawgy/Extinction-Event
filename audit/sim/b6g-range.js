// Batch 6g (v2.97): Test Range measurements for fix 3 (units under fire respond) and fix 7 (the Wraithwing keeps its target),
// each with b6g off and on, on the real SIM (rangeGame, rangeUnits, the sides' Hold and Attack modes), over seeds.
//   node audit/sim/b6g-range.js [--seeds 20] [--html file]
const { loadSim } = require('./load'), fs = require('fs'), path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('seeds', '20');
const H = `this.__sim.R6 = { rangeGame, rangeUnits, rangeStep, rangeOrders, TICK };`;
function run(name, b6g, seed, setup, T, done) {
  const S = loadSim(seed, { instrument: H, file: arg('html') }), R = S.R6;
  const g = R.rangeGame({ seed, factions: setup.f, rework: { b6g } });
  const U = setup.place(R, g); g.sides[0].mode = setup.m0; g.sides[1].mode = setup.m1;
  let t = 0; const out = { name, b6g, seed };
  while (t < T) { R.rangeStep(g); t += R.TICK; if (done && done(g, U)) break; }
  return Object.assign(out, setup.read(g, U, t));
}
const alive = (g, us) => us.filter(e => e.hp > 0 && g.ents.includes(e)).length;
const SC = {
  // 1) Bloomhost melee holding, Marines holding 115 away (inside a Marine's 120, outside every melee unit's hold reach)
  marines: { f: ['bloomhost', 'lastfist'], m0: 'hold', m1: 'hold', place: (R, g) => ({ a: R.rangeUnits(g, 0, 'skitterling', 600, 0, 6).concat(R.rangeUnits(g, 0, 'bulwark', 600, 0, 2)), b: R.rangeUnits(g, 1, 'rifle', 715, 0, 6) }),
    read: (g, U, t) => ({ t: Math.round(t), meleeLeft: alive(g, U.a), marinesLeft: alive(g, U.b), moved: U.a.filter(e => Math.abs(e.u - 600) > 40).length }) },
  // 2) the same melee holding, Last Fist's 2 Artillery 400 away behind a screen of 4 Marines (within the Artillery's 440, outside the leash)
  artillery: { f: ['bloomhost', 'lastfist'], m0: 'hold', m1: 'hold', place: (R, g) => ({ a: R.rangeUnits(g, 0, 'skitterling', 600, 0, 6).concat(R.rangeUnits(g, 0, 'bulwark', 600, 0, 2)), b: R.rangeUnits(g, 1, 'artillery', 1000, 0, 2).concat(R.rangeUnits(g, 1, 'rifle', 880, 0, 4)) }),
    read: (g, U, t) => ({ t: Math.round(t), meleeLeft: alive(g, U.a), meleeHp: Math.round(U.a.reduce((a, e) => a + Math.max(0, e.hp), 0)), farthest: Math.round(Math.min(...U.a.filter(e => e.hp > 0).map(e => e.u).concat([600]))) }) },
  // 3) 4 Wraithwings attacking 8 Marines on Hold: time until the Marines are dead
  wraith: { f: ['axiarchs', 'lastfist'], m0: 'attack', m1: 'hold', place: (R, g) => ({ a: R.rangeUnits(g, 0, 'wraithwing', 600, 0, 4), b: R.rangeUnits(g, 1, 'rifle', 800, 0, 8) }),
    read: (g, U, t) => ({ t: Math.round(t * 10) / 10, wwLeft: alive(g, U.a), marinesLeft: alive(g, U.b) }) },
  // 4) the same 4 Wraithwings on Hold beside 8 Marines on Hold (no target order: each picks its own targets, as in a match)
  wraithHold: { f: ['axiarchs', 'lastfist'], m0: 'hold', m1: 'hold', place: (R, g) => ({ a: R.rangeUnits(g, 0, 'wraithwing', 600, 0, 4), b: R.rangeUnits(g, 1, 'rifle', 720, 0, 8) }),
    read: (g, U, t) => ({ t: Math.round(t * 10) / 10, wwLeft: alive(g, U.a), marinesLeft: alive(g, U.b) }) },
};
const rows = [];
for (const b6g of [false, true]) for (let s = 1; s <= N; s++) {
  rows.push(run('marines', b6g, 9000 + s, SC.marines, 30));
  rows.push(run('artillery', b6g, 9100 + s, SC.artillery, 30));
  rows.push(run('wraith', b6g, 9200 + s, SC.wraith, 120, (g, U) => alive(g, U.b) === 0 || alive(g, U.a) === 0));
  rows.push(run('wraithHold', b6g, 9300 + s, SC.wraithHold, 120, (g, U) => alive(g, U.b) === 0 || alive(g, U.a) === 0));
}
const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; }, mean = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length * 10) / 10 : null;
const lines = [`# Batch 6g Test Range measurements (${N} seeds each, b6g off / on)`, ''];
for (const nm of ['marines', 'artillery', 'wraith', 'wraithHold']) for (const b of [false, true]) {
  const r = rows.filter(x => x.name === nm && x.b6g === b), keys = Object.keys(r[0]).filter(k => !['name', 'b6g', 'seed'].includes(k));
  lines.push(`- ${nm}, b6g ${b ? 'on' : 'off'}: ` + keys.map(k => `${k} mean ${mean(r.map(x => x[k]))} (median ${med(r.map(x => x[k]))})`).join(', '));
  if (nm.startsWith('wraith')) lines.push(`  all 8 Marines dead in ${r.filter(x => x.marinesLeft === 0).length}/${r.length}`);
}
console.log(lines.join('\n'));
const od = path.join(__dirname, '..', 'logs-p1', 'b6g'); fs.mkdirSync(od, { recursive: true });
fs.writeFileSync(path.join(od, 'range.md'), lines.join('\n') + '\n'); fs.writeFileSync(path.join(od, 'range.jsonl'), rows.map(r => JSON.stringify(r)).join('\n') + '\n');
