// Batch 6h (v2.98): Test Range measurements for the Bloomhost ground rework (b6h) and unit bodies (b6hbody), on the real SIM
// (rangeGame, rangeUnits, rangeBuilding, the sides' Hold and Attack modes and the real commands), over seeds.
//   node audit/sim/b6h-range.js [--seeds 20] [--only name] [--html file] [--out audit/logs-p1/b6h/range.md]
const { loadSim } = require('./load'), fs = require('fs'), path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('seeds', '20'), ONLY = arg('only', null);
const H = `this.__sim.R6 = { rangeGame, rangeUnits, rangeUnit, rangeBuilding, rangeStep, rangeOrders, TICK, command, ctlEnt, onCreep, B6H, DV_W, DY };`;
const OFF = { b6h: false, b6hbody: false, b6hnode: false };
function run(name, rw, seed, sc) {
  const S = loadSim(seed, { instrument: H, file: arg('html') }), R = S.R6;
  const g = R.rangeGame({ seed, factions: sc.f, rework: Object.assign({}, S.REWORK, rw) });
  const U = sc.place(R, g, S); g.sides[0].mode = sc.m0; g.sides[1].mode = sc.m1;
  if (sc.hush) g.sides[sc.hush - 1].hush = true;
  if (sc.manual) for (const s of sc.manual) g.sides[s].manual = true;
  let t = 0; const st = {};
  while (t < sc.T) { if (sc.tick) sc.tick(R, g, U, t, st, S); R.rangeStep(g); t += R.TICK; if (sc.done && sc.done(g, U, t, st)) break; }
  return Object.assign({ name, seed, rw: rw.b6h === false && rw.b6hbody === false ? 'off' : JSON.stringify(rw) }, sc.read(g, U, t, st, S));
}
const alive = (g, us) => us.filter(e => e.hp > 0 && g.ents.includes(e)).length;
const ids = us => us.map(e => e.id);
// spread: mean distance to the nearest same-side unit on screen (u, v × DY), and the box the side covers
function spread(g, s) {
  const us = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && !e.gone);
  if (us.length < 2) return { nn: 0, w: 0, h: 0, n: us.length };
  let nn = 0; for (const a of us) { let m = 1e9; for (const b of us) if (b !== a) m = Math.min(m, Math.hypot(a.u - b.u, (a.v - b.v) * 0.5)); nn += m; }
  const U = us.map(e => e.u), V = us.map(e => e.v * 0.5);
  return { nn: +(nn / us.length).toFixed(1), w: Math.round(Math.max(...U) - Math.min(...U)), h: Math.round(Math.max(...V) - Math.min(...V)), n: us.length };
}
const SC = {
  // 1) one Artillery salvo into 20 Skitterlings standing still (they don't fight back), with and without a Chitin Warden among them
  salvo: (ward) => ({ f: ['bloomhost', 'lastfist'], m0: 'hold', m1: 'hold', hush: 1, T: 6.2,
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'skitterling', 700, 0, 20), w: ward ? R.rangeUnits(g, 0, 'bulwark', 700, 0, 1) : [], b: R.rangeUnits(g, 1, 'artillery', 1080, 0, 1) }),
    read: (g, U) => ({ kills: 20 - alive(g, U.a), hpLost: Math.round(U.a.length * U.a[0].maxHp - U.a.reduce((x, e) => x + Math.max(0, e.hp), 0)), hpLeft: Math.round(U.a.reduce((x, e) => x + Math.max(0, e.hp), 0)), prevented: Math.round((g.sides[0].h6 || {}).ward || 0) }) }),
  // 2) 28 Tanks against 19 Bastions, both attacking: how far apart the units stand 12 s in, and who wins
  tanks: { f: ['lastfist', 'axiarchs'], m0: 'attack', m1: 'attack', T: 90,
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'tank', 520, 0, 28), b: R.rangeUnits(g, 1, 'bastion', 880, 0, 19) }),
    tick: (R, g, U, t, st) => { if (!st.s && t >= 12) st.s = [spread(g, 0), spread(g, 1)]; },
    done: (g, U) => alive(g, U.a) === 0 || alive(g, U.b) === 0,
    read: (g, U, t, st) => ({ t: Math.round(t), tanks: alive(g, U.a), bastions: alive(g, U.b), nn12: st.s ? `${st.s[0].nn} / ${st.s[1].nn}` : '-', box12: st.s ? `${st.s[0].w}x${st.s[0].h} / ${st.s[1].w}x${st.s[1].h}` : '-' }) },
  // 3) 3 Leapers sent to attack; 6 Marines hold in front of a deployed-to-be Artillery: what do they land on first?
  leap: { f: ['bloomhost', 'lastfist'], m0: 'hold', m1: 'hold', T: 20, manual: [0],
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'leaper', 520, 0, 3), m: R.rangeUnits(g, 1, 'rifle', 640, 0, 6), art: R.rangeUnits(g, 1, 'artillery', 720, 0, 1) }),
    tick: (R, g, U, t, st) => {
      if (!st.go) { st.go = 1; R.command(g, 0, ids(U.a), 'attack'); }
      for (const e of U.a) if ((e.ltH || e.lt) && !st['f' + e.id]) { const H = R.ctlEnt(g, e.ltH || e.lt); st['f' + e.id] = H ? H.type : '?'; }
      st.stun = Math.max(st.stun || 0, g.ents.filter(e => e.side === 1 && e.st6 > g.t).length);
    },
    read: (g, U, t, st) => { const f = U.a.map(e => st['f' + e.id] || 'none'); return { first: f.join(','), onArt: f.filter(x => x === 'artillery').length, stunnedMax: st.stun || 0, artHp: Math.round(Math.max(0, U.art[0].hp)), leapers: alive(g, U.a), marines: alive(g, U.m) }; } },
  // 4) 2 Broodbacks and 4 Skitterlings attacking 12 Marines: the bursts and the Bile Blooms
  brood: { f: ['bloomhost', 'lastfist'], m0: 'attack', m1: 'hold', T: 60,
    place: (R, g) => ({ a: R.rangeUnits(g, 0, 'broodback', 560, 0, 2).concat(R.rangeUnits(g, 0, 'skitterling', 540, 0, 4)), b: R.rangeUnits(g, 1, 'rifle', 760, 0, 12) }),
    tick: (R, g, U, t, st) => { st.skit = Math.max(st.skit || 0, g.ents.filter(e => e.side === 0 && e.type === 'skitterling' && e.hp > 0).length); st.bloom = Math.max(st.bloom || 0, (g.bp6 || []).length); },
    done: (g) => !g.ents.some(e => e.side === 1 && e.hp > 0) || !g.ents.some(e => e.side === 0 && e.hp > 0),
    read: (g, U, t, st) => { const h = g.sides[0].h6 || {}; return { t: Math.round(t), burst: h.burst || 0, blooms: h.blooms || 0, marines: alive(g, U.b), bloomhost: g.ents.filter(e => e.side === 0 && e.kind === 'u' && e.hp > 0).length }; } },
  // 5) one Queen (with the Mites she births) attacking 8 Marines holding 170 away
  queen: { f: ['bloomhost', 'lastfist'], m0: 'attack', m1: 'hold', T: 60,
    place: (R, g) => ({ q: R.rangeUnits(g, 0, 'queen', 600, 0, 1), b: R.rangeUnits(g, 1, 'rifle', 770, 0, 8) }),
    tick: (R, g, U, t, st) => { st.mx = Math.max(st.mx || 0, g.ents.filter(e => e.side === 0 && e.type === 'mite' && e.hp > 0).length); },
    done: (g, U) => alive(g, U.b) === 0 || alive(g, U.q) === 0,
    read: (g, U, t, st) => { const h = g.sides[0].h6 || {}; return { t: Math.round(t), queen: alive(g, U.q), qHp: Math.round(Math.max(0, U.q[0].hp)), mites: h.qMites || 0, mitesMax: st.mx || 0, marines: alive(g, U.b) }; } },
  // 6) a Ruinmaw surfaces beside 6 Marines (the eruption), then 10 Skitterlings on creep (a Bloomhost Refinery's, grown 15 s) tunnel to it
  ruin: { f: ['bloomhost', 'lastfist'], m0: 'hold', m1: 'hold', T: 50, manual: [0],
    place: (R, g) => { const ref = R.rangeBuilding(g, 0, 'bloomhost', 'refinery', 220, 0); return { ref, r: R.rangeUnits(g, 0, 'ruinmaw', 900, 0, 1), k: R.rangeUnits(g, 0, 'skitterling', 230, 0, 10), b: R.rangeUnits(g, 1, 'rifle', 1010, 0, 6) }; },
    tick: (R, g, U, t, st) => {
      const Rm = U.r[0];
      if (!st.go && t >= 15) { st.go = 1; R.command(g, 0, [Rm.id], 'go', 985, 0); } // the creep grows first (15 s)
      if (!st.up && st.go && !Rm.bur && Rm.dvCd > g.t) { st.up = t; st.hp0 = U.b.reduce((x, e) => x + Math.max(0, e.hp), 0); }
      if (st.up && !st.tn && t > st.up + 0.5) { st.onCreep = U.k.filter(e => R.onCreep(g, 0, e.u, e.v)).length; const r = R.command(g, 0, ids(U.k), 'tunnel'); st.tn = t; st.msg = r.msg; }
      if (st.tn) { const out = U.k.filter(e => e.hp > 0 && !e.tn && !e.gone && Math.abs(e.u - Rm.u) < 140).length; if (out >= (st.onCreep || 10) && !st.allOut) st.allOut = t; }
    },
    read: (g, U, t, st) => { const h = g.sides[0].h6 || {}; return { surfacedAt: st.up ? +(st.up - 15).toFixed(1) : null, erupt: h.erupt || 0, marinesAfter: alive(g, U.b), onCreep: st.onCreep, msg: st.msg, allOutAfter: st.allOut && st.tn ? +(st.allOut - st.tn).toFixed(1) : null, swallowed: h.swallow || 0 }; } },
};
const rows = [];
const want = n => !ONLY || ONLY.split(',').includes(n);
for (let s = 1; s <= N; s++) {
  if (want('salvo')) { rows.push(run('salvo', {}, 6100 + s, SC.salvo(false))); rows.push(run('salvo+warden', {}, 6100 + s, SC.salvo(true))); rows.push(run('salvo', OFF, 6100 + s, SC.salvo(false))); }
  if (want('tanks')) { rows.push(run('tanks', {}, 6200 + s, SC.tanks)); rows.push(run('tanks', { b6hbody: false }, 6200 + s, SC.tanks)); }
  if (want('leap')) { rows.push(run('leap', {}, 6300 + s, SC.leap)); rows.push(run('leap', OFF, 6300 + s, SC.leap)); }
  if (want('brood')) rows.push(run('brood', {}, 6400 + s, SC.brood));
  if (want('queen')) rows.push(run('queen', {}, 6500 + s, SC.queen));
  if (want('ruin')) rows.push(run('ruin', {}, 6600 + s, SC.ruin));
}
const by = {}; for (const r of rows) (by[r.name + ' ' + r.rw] || (by[r.name + ' ' + r.rw] = [])).push(r);
const mean = a => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : null;
const lines = [`# Batch 6h Test Range measurements (${N} seeds each; rw: the switches changed from the new-game default)`, ''];
for (const k in by) {
  const R = by[k], keys = Object.keys(R[0]).filter(x => !['name', 'seed', 'rw'].includes(x));
  lines.push(`## ${k}`, '', '| ' + keys.join(' | ') + ' |', '|' + keys.map(() => '---').join('|') + '|');
  lines.push('| ' + keys.map(x => typeof R[0][x] === 'number' ? 'mean ' + mean(R.map(r => r[x]).filter(v => typeof v === 'number')) : '') + ' |');
  for (const r of R.slice(0, 5)) lines.push('| ' + keys.map(x => r[x] == null ? '-' : String(r[x])).join(' | ') + ' |');
  if (R.length > 5) lines.push(`(first 5 of ${R.length} seeds shown)`);
  lines.push('');
}
const out = arg('out', null);
if (out) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, lines.join('\n') + '\n'); fs.writeFileSync(out.replace(/\.md$/, '.json'), JSON.stringify(rows)); }
console.log(lines.join('\n'));
