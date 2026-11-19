// Batch 6c (v2.93), Part B1: the Test Range measurements for the four tuning items, each in both orientations over 10 seeds
// (20 runs a cell), with REWORK.b6c off and on (and the item's lever overridable for the search: --set k=v,...).
//   node audit/sim/b6c-range.js [bastion|brood|lev|diver ...] [--rw b6c=0] [--set barHp=300,broodCost=160,...] [--seeds 11-20]
// bastion: the cost to break a held Axiarch front of 2 Bastions + 4 Lancers (R4), Tanks + Marines (1:2) and Lancers, with the
//   barrier (b3b on) and without it (b3b off, the v2.84 Bastion: R4's "off" column), in 0.25 steps of the mix, the smallest that
//   wins 12+ of 20; the ratio with / without.
// brood: Skitterlings in broods at the brood price against equal-cost Marines, Shardlings and Lancers (R10): W-L and the share of
//   their value kept in the fights they win.
// lev: one Leviathan's damage per second against one Tank, 6 Tanks, 12 Marines and a Refinery (R1), unopposed over 90 s, against
//   the pre-rework Leviathan (b4b off, P10).
// diver: Leapers and Riftstalkers against equal-cost Marines (both attack), and their damage per 100 spent in that fight.
const { loadSim } = require('./load');
const INSTR = require('./audit6a-instrument');
const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const rng = s => { const [a, b] = s.split('-').map(Number); const o = []; for (let i = a; i <= (b ?? a); i++) o.push(i); return o; };
const SEEDS = rng(arg('seeds', '11-20'));
const RW = {}; for (const kv of (arg('rw', '') || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); RW[k] = v !== '0' && v !== 'false'; }
const S = loadSim(1, { instrument: INSTR + `;Object.assign(this.__sim, { B6C: typeof B6C === 'undefined' ? null : B6C, BROOD, BAR, LATCH, LEV, trainCost, rangeBuilding });` });
for (const kv of (arg('set', '') || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); if (!S.B6C) throw new Error('no B6C in this build'); S.B6C[k] = +v; }
const want = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const r0 = Math.round, r1 = x => Math.round(x * 10) / 10, r2 = x => Math.round(x * 100) / 100;
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
const reset = () => { const A = S.a6; for (const k of Object.keys(A)) A[k] = [{}, {}]; };
const game = (factions, rw, seed) => { reset(); return S.rangeGame({ seed, factions, rework: Object.assign({}, RW, rw) }); };
const ucost = (g, t) => t === 'skitterling' ? (c => (c.c + c.e) / S.BROOD.n)(S.trainCost(g, 'skitterling')) : (c => c.c + c.e)(S.rwD(g, t).cost);
const place = (g, s, type, u, v, n) => { const out = []; for (let i = 0; i < n; i++) out.push(S.rangeUnit(g, s, type, u + (i % 4) * 14 * (s ? 1 : -1), v + (Math.floor(i / 4) % 6) * 16 - 40)); return out; };
const run = (g, sec, stop) => { const n = Math.round(sec * 60); for (let i = 0; i < n; i++) { S.rangeStep(g); g.events.length = 0; if (stop && stop()) break; } return g.t; };
const alive = (g, s) => g.ents.filter(e => e.side === s && e.hp > 0 && e.kind === 'u');
const value = (g, s) => alive(g, s).filter(e => !e.temp).reduce((a, e) => a + ucost(g, e.type), 0);
// A fight in both orientations over SEEDS: A (side sA) against B; W-L for A, value kept by A in its wins (share), A's damage by type
function fight(factions, rw, A, B, o = {}) {
  const res = [];
  for (const seed of SEEDS) for (const flip of [0, 1]) {
    const g = game(flip ? [factions[1], factions[0]] : factions, rw, seed), sA = flip, sB = 1 - flip, at = u => flip ? 1280 - u : u;
    for (const [t, n, u, v] of A) place(g, sA, t, at(u ?? 480), v ?? 0, n);
    for (const [t, n, u, v] of B) place(g, sB, t, at(u ?? 800), v ?? 0, n);
    const v0 = value(g, sA);
    S.rangeMode(g, sA, 'attack'); S.rangeMode(g, sB, o.bHold ? 'hold' : 'attack');
    run(g, o.maxT || 150, () => !alive(g, 0).length || !alive(g, 1).length);
    const nA = alive(g, sA).length, nB = alive(g, sB).length;
    res.push({ win: nA && !nB ? 0 : nB && !nA ? 1 : -1, kept: value(g, sA) / v0, t: g.t, dmgA: Object.assign({}, S.a6.dmg[sA]), spentA: v0 });
  }
  const w = res.filter(r => r.win === 0), l = res.filter(r => r.win === 1);
  return { n: res.length, w: w.length, l: l.length, d: res.length - w.length - l.length, keptW: w.length ? w.reduce((a, r) => a + r.kept, 0) / w.length : null, res };
}
const out = [], say = s => { out.push(s); console.log(s); };
const table = (head, rows) => { say('| ' + head.join(' | ') + ' |'); say('|' + head.map(() => '---').join('|') + '|'); for (const r of rows) say('| ' + r.join(' | ') + ' |'); say(''); };
const T = {};
T.bastion = () => {
  const AXwith = [['bastion', 2, 820], ['lancer', 4, 860]];
  const armies = [['Tanks + Marines (1:2)', 'lastfist', [['tank', 1, 400], ['rifle', 2, 440]]], ['Lancers', 'axiarchs', [['lancer', 3, 420]]]];
  const scale = (A, k) => A.map(([t, n, u]) => [t, Math.max(1, Math.round(n * k)), u]);
  const g0 = game(['lastfist', 'axiarchs'], {}, 11), V = A => A.reduce((a, [t, n]) => a + n * ucost(g0, t), 0);
  const brk = (fac, rw, A) => { for (let k = 0.5; k <= 6; k += 0.25) { const f = fight([fac, 'axiarchs'], rw, scale(A, k), AXwith, { bHold: true }); if (f.w >= 12) return { v: V(scale(A, k)), k }; } return { v: null, k: '>6' }; };
  const rows = [];
  for (const [nm, fac, A] of armies) {
    const off = brk(fac, { b3b: false }, A), on = brk(fac, { b3b: true }, A);
    rows.push([nm, off.v ?? '>' + V(scale(A, 6)), on.v ?? '>' + V(scale(A, 6)), off.v && on.v ? `+${r0(100 * (on.v / off.v - 1))}%` : '-']);
  }
  say(`Bastion barrier (BAR.hp in play: ${S.B6C && RW.b6c !== false ? S.B6C.barHp : S.BAR.hp}): cost to break 2 Bastions + 4 Lancers (holding), 0.25 steps of the mix, 12+ of 20 wins`); say('');
  table(['attacking mix', 'barrier off (b3b off)', 'barrier on', 'barrier raises it by'], rows);
};
T.brood = () => {
  const rows = [];
  for (const [nm, fac, B] of [['18 Marines (810)', 'lastfist', [['rifle', 18, 800]]], ['10 Shardlings (800)', 'axiarchs', [['shardling', 10, 800]]], ['6 Lancers (990)', 'axiarchs', [['lancer', 6, 800]]]]) {
    const g0 = game(['bloomhost', fac], {}, 11), V = B.reduce((a, [t, n]) => a + n * ucost(g0, t), 0), per = ucost(g0, 'skitterling'), n = Math.round(V / per);
    const f = fight(['bloomhost', fac], {}, [['skitterling', n, 480]], B);
    rows.push([nm, `${n} at ${r1(per)}`, `${f.w}-${f.l}${f.d ? '-' + f.d : ''}`, `${r0(100 * f.w / f.n)}%`, f.keptW == null ? '-' : `${r0(100 * f.keptW)}%`]);
  }
  say(`Broods (one order: ${S.BROOD.n} Skitterlings; price in play ${ucost(game(['bloomhost', 'lastfist'], {}, 11), 'skitterling') * 4}) against equal-cost armies, both attack`); say('');
  table(['vs', 'Skitterlings (price each)', 'W-L', 'win share', 'value kept in wins'], rows);
};
// The brood fight at five army sizes (18 to 36 Marines, 10 to 20 Shardlings, 6 to 12 Lancers, in quarter steps), 20 runs each: a single
// size flips from 20-0 to 0-20 with one Skitterling more or less (the count is a whole number), so the share is read over sizes
T.brood3 = () => {
  const rows = [];
  for (const [nm, fac, t, n0] of [['Marines', 'lastfist', 'rifle', 18], ['Shardlings', 'axiarchs', 'shardling', 10], ['Lancers', 'axiarchs', 'lancer', 6]]) {
    let w = 0, l = 0, d = 0, keptW = 0, cells = [];
    for (const k of [1, 1.25, 1.5, 1.75, 2]) {
      const g0 = game(['bloomhost', fac], {}, 11), nb = Math.round(n0 * k), V = nb * ucost(g0, t), per = ucost(g0, 'skitterling'), n = Math.round(V / per);
      const f = fight(['bloomhost', fac], {}, [['skitterling', n, 480]], [[t, nb, 800]]);
      w += f.w; l += f.l; d += f.d; if (f.w) keptW += f.keptW * f.w; cells.push(`${n} vs ${nb}: ${f.w}-${f.l}`);
    }
    rows.push([nm, cells.join('; '), `${w}-${l}${d ? '-' + d : ''}`, `${r0(100 * w / (w + l + d))}%`, w ? `${r0(100 * keptW / w)}%` : '-']);
  }
  say(`Broods at five sizes (price in play ${ucost(game(['bloomhost', 'lastfist'], {}, 11), 'skitterling') * 4} a brood), both attack, 20 runs a size`); say('');
  table(['vs', 'Skitterlings vs foes: W-L per size', 'W-L (100)', 'win share', 'value kept in wins'], rows);
};
T.lev = () => {
  const rows = [];
  const tg = [['one Tank', [['tank', 1]]], ['6 Tanks, packed', [['tank', 6]]], ['12 Marines, packed', [['rifle', 12]]], ['one Refinery (building)', 'bld']];
  for (const [nm, list] of tg) {
    const row = [nm];
    for (const rw of [{ b4b: false }, {}]) {
      const ds = [];
      for (const seed of SEEDS.slice(0, 3)) {
        const g = game(['lastfist', 'lastfist'], rw, seed); g.sides[1].hush = true;
        S.rangeUnit(g, 0, 'leviathan', 450, 0);
        if (list === 'bld') { const b = S.rangeBuilding(g, 1, 'lastfist', 'refinery', 750, 0); b.hp = b.maxHp = 1e6; }
        else for (const [t, n] of list) place(g, 1, t, 750, 0, n).forEach(e => { e.hp = e.maxHp = 1e6; });
        S.rangeMode(g, 0, 'attack');
        run(g, 15); const d0 = S.a6.dmg[0].leviathan || 0; run(g, 90); ds.push(((S.a6.dmg[0].leviathan || 0) - d0) / 90);
      }
      row.push(r1(ds.reduce((a, b) => a + b, 0) / ds.length));
    }
    row.push(r2(row[2] / row[1])); rows.push(row);
  }
  say(`Leviathan damage per second (R1 setup; 3 seeds)`); say('');
  table(['target', 'pre-rework (b4b off) dmg/s', 'now dmg/s', 'now / pre-rework'], rows);
};
T.diver = () => {
  const rows = [];
  for (const [d, fac] of [['leaper', 'bloomhost'], ['riftstalker', 'axiarchs']]) {
    const g0 = game([fac, 'lastfist'], {}, 11), n = d === 'leaper' ? 9 : 5, V = n * ucost(g0, d), nm = Math.round(V / ucost(g0, 'rifle'));
    const f = fight([fac, 'lastfist'], {}, [[d, n, 480]], [['rifle', nm, 800]]);
    const dmg = f.res.reduce((a, r) => a + (r.dmgA[d] || 0), 0) / f.res.length;
    rows.push([`${n} ${d} (${V}) vs ${nm} Marines`, `${f.w}-${f.l}${f.d ? '-' + f.d : ''}`, r0(100 * dmg / V)]);
  }
  say('Divers head-on against equal-cost Marines (both attack)'); say('');
  table(['fight', 'diver W-L', 'diver damage per 100 spent'], rows);
};
say(`b6c-range on ${S.VERSION}; switches ${JSON.stringify(RW)}; B6C ${S.B6C ? JSON.stringify(S.B6C) : '(none)'}; seeds ${SEEDS.join(',')} × both orientations`); say('');
for (const k of (want.length ? want : Object.keys(T))) T[k]();
if (arg('out', null)) require('fs').writeFileSync(arg('out'), out.join('\n') + '\n');
