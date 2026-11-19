// Batch 6b, Part B (Artillery counterplay): the Test Range measurements for docs/BALANCE_AUDIT.md "After batch 6b".
// Every fight is equal cost (credits + energy; a Skitterling counts 30, a brood's price per Skitterling), run in both
// orientations (Last Fist as side 0 on the left, then as side 1 on the right) over several seeds, with both sides played the
// way the AI plays them (not under direct control: the AI's own unit rules run, so AI divers pick their targets as the AI
// does); the Test Range's no-HQ, no-fog field (src/sim/testrange.js). Damage per unit type from audit6a-instrument.js.
//   A. Army fights: a typical AI Last Fist ground army (a front line of Marines, Heavies and Tanks with Artillery behind it)
//      holding, against a typical AI Bloomhost or Axiarch ground army advancing on it (army mixes from the batch 6a self-play's
//      units trained). W-L for Last Fist, time, value left (credits + energy) per side, Artillery damage per 100 spent.
//   D. Diver strikes: four Artillery with a screen of four Marines, holding, against equal-cost Leapers, Gorebores or
//      Riftstalkers advancing from beyond the Artillery's reach. W-L for the Artillery line, Artillery left, time.
//   Artillery damage per 100 spent over all army fights (HP and shields removed by its shells / its cost × 100).
//   node audit/sim/art6b.js [--rw b6art=0,b6side=1] [--seeds 11-20] [--json out.json] [--only A|D]
const { loadSim } = require('./load');
const INSTR = require('./audit6a-instrument');
const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const rng = s => { const [a, b] = s.split('-').map(Number); const o = []; for (let i = a; i <= (b ?? a); i++) o.push(i); return o; };
const SEEDS = rng(arg('seeds', '11-20')), ONLY = arg('only', null);
const RW = {}; for (const kv of (arg('rw', '') || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); RW[k] = v !== '0' && v !== 'false'; }
const S = loadSim(1, { instrument: INSTR + `;Object.assign(this.__sim, { rangeGame, rangeUnit, rangeStep, setStance, rwD });` });
const cost = (g, t) => t === 'skitterling' ? 30 : (c => c.c + c.e)(S.rwD(g, t).cost);
const sum = o => Object.values(o).reduce((a, b) => a + b, 0), r1 = x => Math.round(x * 10) / 10;
const reset = () => { const A = S.a6; for (const k of Object.keys(A)) A[k] = [{}, {}]; };
// an army: [type, n, u (its own side's distance from the left edge, mirrored for the right side), v spread]
const LF_ARMY = [['rifle', 10, 520], ['heavy', 3, 500], ['tank', 2, 540], ['artillery', 3, 400]]; // 2410
const BH_ARMY = [['skitterling', 14, 1150], ['bulwark', 4, 1130], ['spitter', 8, 1190], ['leaper', 4, 1160], ['gorebore', 1, 1200]]; // 2430
const AX_ARMY = [['shardling', 9, 1150], ['lancer', 5, 1190], ['bastion', 2, 1130], ['riftstalker', 1, 1160]]; // 2425
const LINE = [['artillery', 4, 400], ['rifle', 4, 470]]; // 1120
const DIVERS = { leaper: [['leaper', 11, 1150]], gorebore: [['gorebore', 5, 1150]], riftstalker: [['riftstalker', 6, 1150]] }; // 1100, 1150, 1140
const W = 1700; // Classic's width: the right side's spots mirror the left's (u → W - u)
function fight(facs, A, B, seed, flip, maxT = 200) {
  reset();
  const g = S.rangeGame({ seed, factions: flip ? [facs[1], facs[0]] : facs, rework: RW }), sA = flip ? 1 : 0, sB = 1 - sA;
  const at = (s, u) => s === 0 ? u : W - u; // A is written for the left side, B for the right (u given as on the left: mirrored)
  const place = (s, list, own) => { for (const [t, n, u] of list) for (let i = 0; i < n; i++) { const uu = own ? u : W - u; const e = S.rangeUnit(g, s, t, at(s, uu - (i % 4) * 14), ((Math.floor(i / 4) % 6) - 2.5) * 22); e.po = undefined; } };
  place(sA, A, true); place(sB, B, false);
  for (const s of [0, 1]) { g.sides[s].direct = false; g.sides[s].mode = null; } // played as the AI plays: stances, the AI's unit rules
  S.setStance(g, sA, 'hold'); S.setStance(g, sB, 'attack');
  const alive = s => g.ents.filter(e => e.side === s && e.hp > 0 && e.kind === 'u' && !e.temp);
  const n = maxT * 60; let k = 0;
  for (; k < n; k++) { S.rangeStep(g); g.events.length = 0; if (!alive(0).length || !alive(1).length) break; }
  const a = alive(sA).length, b = alive(sB).length, val = s => alive(s).reduce((x, e) => x + cost(g, e.type), 0);
  const nArt = A.concat(B).filter(x => x[0] === 'artillery').reduce((x, y) => x + y[1], 0);
  return { win: a && !b ? 1 : b && !a ? -1 : 0, t: g.t, leftA: val(sA), leftB: val(sB), art: S.a6.dmg[sA].artillery || 0, artSpent: nArt * cost(g, 'artillery'),
    artLeft: alive(sA).filter(e => e.type === 'artillery').length, dmgA: Object.assign({}, S.a6.dmg[sA]), dmgB: Object.assign({}, S.a6.dmg[sB]) };
}
function series(facs, A, B) {
  const R = []; for (const seed of SEEDS) for (const flip of [0, 1]) R.push(Object.assign(fight(facs, A, B, seed, flip), { seed, flip }));
  const w = R.filter(r => r.win > 0).length, l = R.filter(r => r.win < 0).length, med = a => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
  const avg = f => Math.round(R.reduce((x, r) => x + f(r), 0) / R.length);
  const byFlip = f => [0, 1].map(fl => R.filter(r => r.flip === fl && r.win > 0).length + '-' + R.filter(r => r.flip === fl && r.win < 0).length);
  return { n: R.length, w, l, d: R.length - w - l, pct: Math.round(100 * w / R.length), t: r1(med(R.map(r => r.t))), leftA: avg(r => r.leftA), leftB: avg(r => r.leftB), art: R.reduce((x, r) => x + r.art, 0), artSpent: R.reduce((x, r) => x + r.artSpent, 0), artLeft: r1(R.reduce((x, r) => x + r.artLeft, 0) / R.length), byFlip: byFlip(), runs: R.map(r => ({ seed: r.seed, flip: r.flip, win: r.win, t: r1(r.t), leftA: r.leftA, leftB: r.leftB, art: Math.round(r.art), artLeft: r.artLeft })) };
}
const out = { version: S.VERSION, rw: RW, seeds: SEEDS, armies: { LF_ARMY, BH_ARMY, AX_ARMY, LINE, DIVERS }, A: {}, D: {} };
const g0 = S.rangeGame({ rework: RW }), val = L => L.reduce((x, [t, n]) => x + n * cost(g0, t), 0);
console.log(`v${S.VERSION} rw ${JSON.stringify(RW)} seeds ${SEEDS[0]}-${SEEDS[SEEDS.length - 1]} x both orientations`);
if (!ONLY || ONLY === 'A') {
  let art = 0, spent = 0;
  for (const [nm, fac, B] of [['vs Bloomhost', 'bloomhost', BH_ARMY], ['vs Axiarchs', 'axiarchs', AX_ARMY]]) {
    const r = series(['lastfist', fac], LF_ARMY, B); out.A[nm] = r; art += r.art; spent += r.artSpent;
    console.log(`A ${nm}: Last Fist (${val(LF_ARMY)}, holding) vs ${val(B)} advancing: LF ${r.w}-${r.l}${r.d ? '-' + r.d : ''} (${r.pct}%; as side 0 ${r.byFlip[0]}, as side 1 ${r.byFlip[1]}), median ${r.t} s, left LF ${r.leftA} / foe ${r.leftB}, Artillery dmg/100 spent ${Math.round(100 * r.art / r.artSpent)}, Artillery left ${r.artLeft} of 3`);
  }
  out.artPer100 = Math.round(100 * art / spent);
  console.log(`Artillery damage per 100 spent (both army fights): ${out.artPer100}`);
}
if (!ONLY || ONLY === 'D') for (const [nm, B] of Object.entries(DIVERS)) {
  const fac = nm === 'riftstalker' ? 'axiarchs' : 'bloomhost', r = series(['lastfist', fac], LINE, B); out.D[nm] = r;
  console.log(`D ${nm}: Artillery line (${val(LINE)}) vs ${val(B)}: line ${r.w}-${r.l}${r.d ? '-' + r.d : ''} (as side 0 ${r.byFlip[0]}, as side 1 ${r.byFlip[1]}), median ${r.t} s, Artillery left ${r.artLeft} of 4, value left line ${r.leftA} / divers ${r.leftB}, Artillery dmg/100 spent ${Math.round(100 * r.art / r.artSpent)}`);
}
if (arg('json')) require('fs').writeFileSync(arg('json'), JSON.stringify(out, null, 1));
