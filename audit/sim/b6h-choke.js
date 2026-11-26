// Batch 6h (v2.98), Part E: unit bodies (b6hbody) in chokes and lanes, and their cost.
//   choke: 30 mixed ground units (10 Skitterlings, 6 Marines, 6 Tanks, 4 Chitin Wardens, 2 Titans, 2 Dreadthorns) under direct
//     control, sent with one move order through each map's narrowest passage (Classic: along its one lane; Two-Lane: across the
//     ridge's only crossing; Three-Lane: through the north wall's gap at the centre node); 30 s later: how many arrived, how many are
//     stuck (still on its move order and moved under 5 px in the last 5 s). Arrived: at its own spot of the move (each unit gets
//     one, spread out; it then holds). b6hbody on and off. No enemy (both AIs idle).
//   perf: a heavy fight in the Test Range (60 Skitterlings + 30 Mites against 40 Last Fist units: 16 Marines, 8 Heavies, 8 Tanks,
//     4 Flame Tanks, 4 Artillery), the SIM's time per tick over 20 s of fighting, b6hbody on and off (b6h on in both); median of
//     the per-run means over --reps runs. Node on this machine, not an iPhone.
//   node audit/sim/b6h-choke.js [--reps 5] [--out audit/logs-p1/b6h/bodies.md]
const { loadSim } = require('./load'), fs = require('fs'), path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const H = `this.__sim.C6 = { directControl, command, spawnUnit, ctlHold, navShut: (u, v) => NAV.on && navShut(u, v), rangeGame, rangeUnits, rangeStep, TICK, useMap, body6h };`;
const MIX = [['skitterling', 10], ['rifle', 6], ['tank', 6], ['bulwark', 4], ['titan', 2], ['dreadthorn', 2]];
const CH = { classic: { from: [700, 0], to: [1100, 0] }, twolane: { from: [1100, -300], to: [1100, 300] }, threelane: { from: [1150, -420], to: [1150, 60] } };
function choke(map, body, seed) {
  const S = loadSim(seed, { instrument: H }), C = S.C6; Object.assign(S.REWORK, { b6hbody: body });
  const g = S.newGame('hard', { seed, map, factions: ['bloomhost', 'lastfist'] }); g.countdown = 0;
  for (const s of g.sides) s.aiT = 1e9;
  C.directControl(g, 0);
  const [fu, fv] = CH[map].from, [tu, tv] = CH[map].to, us = [];
  let k = 0;
  for (const [t, n] of MIX) for (let i = 0; i < n; i++, k++) { let u = fu + ((k % 6) - 2.5) * 18, v = fv + (Math.floor(k / 6) - 2) * 22; if (C.navShut(u, v)) { u = fu; v = fv; } const e = C.spawnUnit(g, 0, t, u, v); C.ctlHold(e, e.u, e.v); us.push(e); }
  C.command(g, 0, us.map(e => e.id), 'go', tu, tv);
  const hist = [];
  for (let i = 0; i < 60 * 30; i++) { S.update(g, S.TICK); g.events.length = 0; if (i % 60 === 0) hist.push(us.map(e => [e.u, e.v])); }
  const last = hist[hist.length - 5] || hist[0];
  let arrived = 0, stuck = 0;
  us.forEach((e, i) => { if (!e.po || e.po.o !== 'go') arrived++; /* at its own spot of the move: it holds there */ else if (Math.hypot(e.u - last[i][0], e.v - last[i][1]) < 5) stuck++; });
  return { map, body, arrived, stuck, far: us.length - arrived - stuck };
}
function perf(body, seed) {
  const S = loadSim(seed, { instrument: H }), C = S.C6;
  const g = C.rangeGame({ seed, factions: ['bloomhost', 'lastfist'], rework: Object.assign({}, S.REWORK, { b6hbody: body }) });
  C.rangeUnits(g, 0, 'skitterling', 560, 0, 60); C.rangeUnits(g, 0, 'mite', 600, 0, 30);
  for (const [t, n, u] of [['rifle', 16, 900], ['heavy', 8, 930], ['tank', 8, 980], ['flame', 4, 960], ['artillery', 4, 1150]]) C.rangeUnits(g, 1, t, u, 0, n);
  g.sides[0].mode = 'attack'; g.sides[1].mode = 'hold';
  for (let i = 0; i < 120; i++) C.rangeStep(g); // warm up (the JIT, the first contact)
  const t0 = process.hrtime.bigint(); let n = 0;
  for (let i = 0; i < 60 * 20; i++) { C.rangeStep(g); n++; }
  const tick = Number(process.hrtime.bigint() - t0) / 1e6 / n;
  // the body pass alone on the state reached (dt 0: it measures every push, moves nothing), 200 calls
  const t1 = process.hrtime.bigint(); for (let i = 0; i < 200; i++) C.body6h(g, 0);
  return { tick, pass: Number(process.hrtime.bigint() - t1) / 1e6 / 200, units: g.ents.filter(e => e.kind === 'u' && e.hp > 0).length };
}
const reps = +arg('reps', '5'), lines = ['# Batch 6h: unit bodies in chokes, and their cost', ''];
lines.push('## Chokes (30 mixed units, one move order, 30 s; 3 seeds)', '', '| map | b6hbody | arrived | stuck | still on the way |', '|---|---|---|---|---|');
for (const map of ['classic', 'twolane', 'threelane']) for (const body of [true, false]) {
  const R = [1, 2, 3].map(s => choke(map, body, 4000 + s));
  lines.push(`| ${map} | ${body ? 'on' : 'off'} | ${R.map(r => r.arrived).join(' / ')} | ${R.map(r => r.stuck).join(' / ')} | ${R.map(r => r.far).join(' / ')} |`);
}
lines.push('', `## SIM time per tick, heavy scene (60 Skitterlings + 30 Mites vs 40 Last Fist units), ${reps} runs each`, '', 'The fight itself differs with bodies on (units spread out, fewer reach a target at once), so the whole tick is compared and the', 'body pass is also timed alone (on the state reached after 20 s, with bodies on: every pair checked, nothing moved).', '', '| b6hbody | ms per tick, each run | median | body pass alone, ms (median) | units left |', '|---|---|---|---|---|');
const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
const P = { on: [], off: [] };
for (let r = 0; r < reps; r++) for (const body of [false, true]) P[body ? 'on' : 'off'].push(perf(body, 5000 + r));
for (const k of ['off', 'on']) lines.push(`| ${k} | ${P[k].map(x => x.tick.toFixed(3)).join(', ')} | ${med(P[k].map(x => x.tick)).toFixed(3)} | ${k === 'on' ? med(P[k].map(x => x.pass)).toFixed(3) : '-'} | ${P[k].map(x => x.units).join(', ')} |`);
const mOn = med(P.on.map(x => x.tick)), mOff = med(P.off.map(x => x.tick)), pass = med(P.on.map(x => x.pass));
lines.push('', `Whole tick, bodies on / off: ${(mOn / mOff * 100 - 100).toFixed(1)}%. The body pass alone: ${pass.toFixed(3)} ms a tick, ${(pass / mOff * 100).toFixed(1)}% of a bodies-off tick (target: no more than +25%).`);
const out = arg('out', null); if (out) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, lines.join('\n') + '\n'); }
console.log(lines.join('\n'));
