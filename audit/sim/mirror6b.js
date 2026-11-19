// Batch 6b, Part A1 (side bias, diagnosis): mirror fights in the Test Range. Identical armies in exactly mirrored
// positions (across the middle of the field, u = 850 on Classic), no AI, both sides on Attack, run to the end over several
// seeds in every combination of:
//   geom  'L' side 0 on the left (its own side of the map), 'R' side 0 on the right (the armies swap places)
//   order '0' side 0's units placed (and so listed in g.ents) first, '1' side 1's first
// so a win can be put down to the side number, the left/right geometry, or the order in the entity list.
// Ablations (each removes one candidate cause, to see whether the bias shrinks):
//   --abl none      the game as it is
//   --abl shuffle   g.ents shuffled (seeded) before every tick: no fixed update order, no fixed tie-break order
//   --abl defer     damage dealt during the unit/building update loop is held and applied after it (simultaneous)
//   --abl b6side    the game's own fix (REWORK.b6side on), when the build has it
//   --abl b6shuf    b6side on, and the entity list itself shuffled every tick too (positions in the list random, ids kept)
// A scenario's units fight with every REWORK switch at its default unless --rw sets some (e.g. --rw b6side=0).
//   node audit/sim/mirror6b.js [--abl none,shuffle,defer] [--seeds 1-8] [--only lancer,shardling] [--orders 0,1,i] [--json out.json]
//   --ai: both sides played the way the AI plays them (not under direct control: stance Attack, the AI's unit rules)
//   (--orders i: interleaved placement, side 0's unit then side 1's, so ids and list positions alternate)
const { loadSim, mulberry } = require('./load');
const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const rng = s => { const [a, b] = s.split('-').map(Number); const o = []; for (let i = a; i <= (b ?? a); i++) o.push(i); return o; };
const AIM = args.includes('--ai'), SEEDS = rng(arg('seeds', '1-8')), ABL = arg('abl', 'none,shuffle,defer').split(','), ONLY = arg('only', null);
const RW = {}; for (const kv of (arg('rw', '') || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); RW[k] = v !== '0' && v !== 'false'; }
// The defer ablation: while the unit/building loop of update() runs, damage1 calls are queued; they are applied, in the
// order they were dealt, just before the projectiles move (updateProjs, the first call after the loop).
const INSTR = `
(function () {
  const D = this.__sim.dfr = { on: false, loop: false, q: [] };
  const uu = updateUnit, ub = updateBuilding, d1 = damage1, up = updateProjs;
  updateUnit = function (g) { if (D.on) D.loop = true; return uu.apply(this, arguments); };
  updateBuilding = function (g) { if (D.on) D.loop = true; return ub.apply(this, arguments); };
  damage1 = function (g, e) { if (D.on && D.loop) { D.q.push(Array.from(arguments)); return; } return d1.apply(this, arguments); };
  updateProjs = function () { if (D.on) { D.loop = false; const q = D.q; D.q = []; for (const a of q) if (a[1].hp > 0 || a[1].kind === 'b') d1.apply(this, a); } return up.apply(this, arguments); };
  Object.assign(this.__sim, { rangeGame, rangeUnit, rangeMode, rangeStep, rangeCount, rwD, setStance });
}).call(this);`;
const S = loadSim(1, { instrument: INSTR });
const MID = 850, GAP = 170;
// [name, unit type, count, class]: melee, ranged, aircraft, ability units, and a mixed army
const SCEN = [
  ['lancer', [['lancer', 8]], 'ranged'],
  ['marine', [['rifle', 12]], 'ranged'],
  ['tank', [['tank', 4]], 'ranged'],
  ['spitter', [['spitter', 10]], 'ranged (volleys)'],
  ['shardling', [['shardling', 10]], 'melee (parry)'],
  ['skitterling', [['skitterling', 16]], 'melee (surge)'],
  ['bulwark', [['bulwark', 5]], 'melee'],
  ['gunship', [['aircraft', 4]], 'aircraft (salvo)'],
  ['razorwing', [['razorwing', 5]], 'aircraft'],
  ['wraithwing', [['wraithwing', 3]], 'aircraft (hops)'],
  ['leaper', [['leaper', 10]], 'ability (latch)'],
  ['riftstalker', [['riftstalker', 5]], 'ability (blink)'],
  ['artillery', [['artillery', 3], ['rifle', 6]], 'ability (deploy, shells)'],
  ['mixed LF', [['rifle', 8], ['heavy', 3], ['tank', 2]], 'mixed'],
  ['mixed AX', [['shardling', 6], ['lancer', 3], ['bastion', 1], ['riftstalker', 1]], 'mixed'],
  ['mixed BH', [['skitterling', 12], ['bulwark', 2], ['spitter', 4], ['leaper', 2]], 'mixed'],
];
const facOf = t => S.UDEF[t].fac || 'lastfist';
const cost = t => { const c = S.UDEF[t].cost; return c.c + c.e; };
function one(list, seed, geom, order, abl) {
  const fac = facOf(list[0][0]), rw = Object.assign({}, RW);
  if (abl === 'b6side' || abl === 'b6shuf') rw.b6side = true;
  const g = S.rangeGame({ seed, factions: [fac, fac], rework: rw });
  // side s stands at MID - GAP on the left or MID + GAP on the right; sign: which way its rows go back from its front
  const left = s => geom === 'L' ? s === 0 : s === 1;
  const place = s => {
    const L_ = left(s), base = L_ ? MID - GAP : MID + GAP, back = L_ ? -1 : 1;
    let i = 0;
    for (const [t, n] of list) for (let k = 0; k < n; k++, i++) {
      const e = S.rangeUnit(g, s, t, base + back * (i % 4) * 16, ((Math.floor(i / 4) % 6) - 2.5) * 18);
      e.face = -back; // facing the enemy, as a mirror would
    }
  };
  if (order === 'i') { const A = [], B = []; const g0 = g; // interleaved: A0, B0, A1, B1, … (ids and list positions alternate)
    const pl = (s, i, t) => { const L_ = left(s), base = L_ ? MID - GAP : MID + GAP, back = L_ ? -1 : 1; const e = S.rangeUnit(g0, s, t, base + back * (i % 4) * 16, ((Math.floor(i / 4) % 6) - 2.5) * 18); e.face = -back; };
    let i = 0; for (const [t, n] of list) for (let k = 0; k < n; k++, i++) { pl(0, i, t); pl(1, i, t); } }
  else if (order === '0') { place(0); place(1); } else { place(1); place(0); }
  if (AIM) { for (const e of g.ents) e.po = undefined; for (const s of [0, 1]) { g.sides[s].direct = false; g.sides[s].mode = null; S.setStance(g, s, 'attack'); } } // --ai: played as the AI plays them (stance Attack, the AI's unit rules)
  else { S.rangeMode(g, 0, 'attack'); S.rangeMode(g, 1, 'attack'); }
  S.dfr.on = abl === 'defer';
  const R = mulberry(seed * 7919 + 13);
  const alive = s => g.ents.filter(e => e.side === s && e.hp > 0 && e.kind === 'u');
  const n = 150 * 60;
  for (let k = 0; k < n; k++) {
    if (abl === 'shuffle' || abl === 'b6shuf') { const a = g.ents; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } }
    S.rangeStep(g); g.events.length = 0;
    if (!alive(0).length || !alive(1).length) break;
  }
  S.dfr.on = false;
  const v = s => alive(s).filter(e => !e.temp).reduce((a, e) => a + cost(e.type) * Math.max(0, e.hp) / e.maxHp, 0);
  const a0 = alive(0).length, a1 = alive(1).length;
  return { win: a0 && !a1 ? 0 : a1 && !a0 ? 1 : -1, v0: v(0), v1: v(1), t: g.t };
}
const out = {};
for (const [name, list, cls] of SCEN) {
  if (ONLY && !ONLY.split(',').includes(name)) continue;
  const army = list.reduce((a, [t, n]) => a + cost(t) * n, 0);
  for (const abl of ABL) {
    const cells = {}; let w0 = 0, w1 = 0, dr = 0, mg = 0, N = 0, wl = 0, wr = 0, wf = 0, ws = 0;
    for (const geom of ['L', 'R']) for (const order of (arg('orders', '0,1')).split(',')) {
      const c = cells[geom + order] = [0, 0, 0];
      for (const seed of SEEDS) {
        const r = one(list, seed, geom, order, abl); N++;
        if (r.win === 0) { w0++; c[0]++; } else if (r.win === 1) { w1++; c[1]++; } else { dr++; c[2]++; }
        mg += (r.v0 - r.v1) / army;
        if (r.win >= 0) {
          const wLeft = geom === 'L' ? r.win === 0 : r.win === 1; if (wLeft) wl++; else wr++;
          const wFirst = order === '0' || order === 'i' ? r.win === 0 : r.win === 1; if (wFirst) wf++; else ws++;
        }
      }
    }
    const row = { cls, army, abl, N, side0: w0, side1: w1, draws: dr, left: wl, right: wr, placedFirst: wf, placedSecond: ws, margin: Math.round(mg / N * 1000) / 10, cells };
    (out[name] || (out[name] = [])).push(row);
    const cs = Object.entries(cells).map(([k, c]) => `${k}:${c[0]}-${c[1]}${c[2] ? '-' + c[2] : ''}`).join(' ');
    console.log(`${name.padEnd(12)} ${abl.padEnd(7)} side0-side1 ${w0}-${w1}${dr ? '-' + dr : ''}  left-right ${wl}-${wr}  first-second ${wf}-${ws}  margin(side0, % of army) ${row.margin}  [${cs}]`);
  }
}
if (arg('json')) require('fs').writeFileSync(arg('json'), JSON.stringify({ version: S.VERSION, seeds: SEEDS, rw: RW, out }, null, 1));
