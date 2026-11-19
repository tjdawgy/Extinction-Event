// Batch 6c (v2.93), Part A2: why the Artillery's hit rate on moving targets fell with b6side (R7: 70% → 51% against moving
// Marines, 54% → 45% against moving Tanks). R7's setup exactly (audit/sim/audit6a-range.js R7: 2 Artillery at u 400 as
// side 0, the targets at 700 as side 1, made unkillable, ordered every 5 s to walk between (700, -40) and (860, 40); 3
// seeds; 120 s), with b6side's three Test Range parts switched apart: the entity-list shuffle (side6Order) and the
// mirrored spacing (ctlFree's dir). Besides the hit share it records how the targets move: the share of target-ticks spent
// walking, the group's spread, and for each shell the distance from where it was aimed to where its target stood when it landed.
//   node audit/sim/arthit6c.js   (writes audit/logs-p1/arthit6c/arthit.txt)
const fs = require('fs'), path = require('path');
const { loadSim } = require('./load');
const INSTR = require('./audit6a-instrument');
const EXTRA = `
(function () {
  const X = this.__sim.x6 = { shells: 0, shellHit: 0, miss: [], noShuffle: false, dir1: false };
  const so = side6Order; side6Order = function (g) { if (!X.noShuffle) return so.apply(this, arguments); };
  const cf = ctlFree; ctlFree = function (T, air, r, pu, pv, ok, dir) { return cf.call(this, T, air, r, pu, pv, ok, X.dir1 ? 1 : dir); };
  const im = impact; impact = function (g, p, hit) {
    if (p.weapon !== 'shell') return im.apply(this, arguments);
    let before = 0, near = 1e9; for (const e of g.ents) if (e.side !== p.side && e.hp > 0) { before += e.hp + (e.shp || 0); near = Math.min(near, Math.hypot(e.u - p.tu, e.v - p.tv)); }
    const r = im.apply(this, arguments); let after = 0; for (const e of g.ents) if (e.side !== p.side) after += Math.max(0, e.hp) + (e.shp || 0);
    X.shells++; if (after < before - 0.01) X.shellHit++; X.miss.push(near); return r;
  };
}).call(this);`;
const S = loadSim(1, { instrument: INSTR + EXTRA });
const out = [], say = s => { out.push(s); console.log(s); };
const r0 = x => Math.round(x), r1 = x => Math.round(x * 10) / 10;
const place = (g, s, type, u, v, n) => { const o = []; for (let i = 0; i < n; i++) o.push(S.rangeUnit(g, s, type, u + (i % 4) * 14 * (s ? 1 : -1), v + (Math.floor(i / 4) % 6) * 16 - 40)); return o; };
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
function run(tt, variant) {
  let sh = 0, hit = 0, mv = 0, tk = 0, spreadU = 0, spreadV = 0, sp = 0, miss = [], dmg = 0;
  for (const seed of [11, 12, 13]) {
    const X = S.x6; X.shells = 0; X.shellHit = 0; X.miss = []; X.noShuffle = variant.noShuffle; X.dir1 = variant.dir1;
    for (const k of Object.keys(S.a6)) S.a6[k] = [{}, {}];
    const g = S.rangeGame({ seed, factions: ['lastfist', 'lastfist'], rework: { b6side: variant.b6side } });
    const A = place(g, 0, 'artillery', 400, 0, 2), T = place(g, 1, tt, 700, 0, tt === 'rifle' ? 6 : 2); T.forEach(e => { e.hp = e.maxHp = 1e6; });
    S.rangeMode(g, 1, 'hold'); for (const a of A) a.po = { o: 'target', id: T[0].id, u: T[0].u, v: T[0].v };
    let k = 0; const last = new Map(T.map(e => [e.id, [e.u, e.v]]));
    for (let i = 0; i < 120 * 60; i++) {
      if (i % 300 === 0) { k++; S.command(g, 1, T.map(e => e.id), 'go', k % 2 ? 860 : 700, k % 2 ? 40 : -40); }
      if (i % 30 === 0) for (const a of A) if (!a.po || a.po.o !== 'target') a.po = { o: 'target', id: T[0].id, u: T[0].u, v: T[0].v };
      S.rangeStep(g); g.events.length = 0;
      for (const e of T) { const l = last.get(e.id); if (Math.hypot(e.u - l[0], e.v - l[1]) > 1e-3) mv++; tk++; last.set(e.id, [e.u, e.v]); }
      if (i % 60 === 0) { const us = T.map(e => e.u), vs = T.map(e => e.v), m = a => a.reduce((x, y) => x + y, 0) / a.length; spreadU += Math.sqrt(m(us.map(x => (x - m(us)) ** 2))); spreadV += Math.sqrt(m(vs.map(x => (x - m(vs)) ** 2))); sp++; }
    }
    sh += X.shells; hit += X.shellHit; miss = miss.concat(X.miss); dmg += S.a6.dmg[0].artillery || 0;
  }
  return { hit: r0(100 * hit / sh), shells: r0(sh / 3), moving: r0(100 * mv / tk), sdU: r1(spreadU / sp), sdV: r1(spreadV / sp), missMed: r1(med(miss)), far: r0(100 * miss.filter(d => d > 30).length / miss.length), dpm: r0(dmg / 3 / 2) };
}
const V = [
  ['b6side off (v2.91)', { b6side: false }],
  ['b6side on (v2.92)', { b6side: true }],
  ['on, shuffle off', { b6side: true, noShuffle: true }],
  ['on, spacing not mirrored', { b6side: true, dir1: true }],
  ['on, both off (= off?)', { b6side: true, noShuffle: true, dir1: true }],
];
say('| variant | target | hit share | shells/run | target-ticks moving | spread u | spread v | median distance aim → nearest target at landing | shells landing >30 from any target | damage/min |');
say('|---|---|---|---|---|---|---|---|---|---|');
for (const [nm, v] of V) for (const tt of ['rifle', 'tank']) { const r = run(tt, v); say(`| ${nm} | ${tt === 'rifle' ? '6 Marines, moving' : '2 Tanks, moving'} | ${r.hit}% | ${r.shells} | ${r.moving}% | ${r.sdU} | ${r.sdV} | ${r.missMed} | ${r.far}% | ${r.dpm} |`); }
say('');
say('The unit every Artillery is ordered onto (the first target; R7 re-targets it every 0.5 s): its share of ticks standing still, of ticks under a go order (still walking to its spot), and its path per 5 s leg (3 seeds):'); say('');
say('| target | spacing | standing still | walking | path per leg |'); say('|---|---|---|---|---|');
for (const tt of ['rifle', 'tank']) for (const [nm, v] of [['b6side off', { b6side: false }], ['b6side on', { b6side: true }], ['on, not mirrored', { b6side: true, dir1: true }]]) {
  let still = 0, tot = 0, dist = 0, go = 0;
  for (const seed of [11, 12, 13]) {
    S.x6.noShuffle = false; S.x6.dir1 = !!v.dir1;
    const g = S.rangeGame({ seed, factions: ['lastfist', 'lastfist'], rework: { b6side: v.b6side } });
    const T = place(g, 1, tt, 700, 0, tt === 'rifle' ? 6 : 2); S.rangeMode(g, 1, 'hold'); let k = 0, p = [T[0].u, T[0].v];
    for (let i = 0; i < 120 * 60; i++) {
      if (i % 300 === 0) { k++; S.command(g, 1, T.map(e => e.id), 'go', k % 2 ? 860 : 700, k % 2 ? 40 : -40); }
      S.rangeStep(g); g.events.length = 0;
      const d = Math.hypot(T[0].u - p[0], T[0].v - p[1]); dist += d; if (d < 0.05) still++; tot++; p = [T[0].u, T[0].v]; if (T[0].po && T[0].po.o === 'go') go++;
    }
  }
  say(`| ${tt === 'rifle' ? '6 Marines' : '2 Tanks'} | ${nm} | ${r0(100 * still / tot)}% | ${r0(100 * go / tot)}% | ${r0(dist / 72)} |`);
}
const dir = path.join(__dirname, '..', 'logs-p1', 'arthit6c'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'arthit.txt'), out.join('\n') + '\n');
