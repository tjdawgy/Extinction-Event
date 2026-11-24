// Batch 6e (v2.95), Part C1: the opening (read only). The persona-balanced design of audit/sim/selfplay-6c.js (162 Hard vs
// Hard, the same seeds), each match played to 6:00 only. Per side at 2:00, 3:00, 4:00 and 5:00: army value (credits +
// energy of its live units), units alive by type, income a second (credits + energy), field nodes held; and the first
// field fight: the first cluster of units lost away from both bases (250+ from each HQ; a cluster ends when 20 s pass with
// none lost) in which 300+ value is lost; each side's value lost (the winner lost less), its start and end, each side's army
// when it started (audit/sim/early6e-report.js computes it from the raw losses, `loss`; `fight` is the first cluster of any size).
//   node audit/sim/early6e.js [--out dir] [--rw b6e=0] [--jobs 4]      writes <out>/early.jsonl
const { fork } = require('child_process'), fs = require('fs'), path = require('path');
const END = 360, AT = [120, 180, 240, 300];
if (process.argv[2] === '--one') {
  const [map, f0, f1, seed, rwArg, p0, p1] = process.argv.slice(3);
  const RW = {}; for (const kv of (rwArg || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); RW[k] = v !== '0' && v !== 'false'; }
  const { loadSim } = require('./load');
  const INSTR = `(function(){ const T = this.__sim.ea6e = { loss: [] }; const kl = kill;
    kill = function (g, e, by, weapon) {
      if (!e.dead && e.kind === 'u' && (e.side === 0 || e.side === 1) && !e.temp) { const c = rwD(g, e.type).cost; T.loss.push([g.t, e.side, c.c + c.e, Math.min(Math.abs(e.u - hqU(0)), Math.abs(e.u - hqU(1))), e.type]); }
      return kl.apply(this, arguments);
    };
    Object.assign(this.__sim, { rwD });
  }).call(this);`;
  const S = loadSim(+seed, { instrument: INSTR }); Object.assign(S.REWORK, RW);
  const g = S.newGame('hard', { seed: +seed, map, autoPlayer: true, autoDiff: 'hard', factions: [f0, f1], autoPersona: p0 || undefined, persona: p1 || undefined }); g.countdown = 0;
  const snap = [[], []], val = s => { let v = 0; const n = {}; for (const e of g.ents) if (e.kind === 'u' && e.side === s && e.hp > 0 && !e.temp) { const c = S.rwD(g, e.type).cost; v += c.c + c.e; n[e.type] = (n[e.type] || 0) + 1; } return [v, n]; };
  let k = 0, err = null; const armyAt = []; // army value every second (for the fight's start)
  try {
    while (!g.over && g.t < END) {
      S.update(g, S.TICK); g.events.length = 0;
      if (++k % 60 === 0) {
        const sec = Math.round(g.t); armyAt[sec] = [val(0)[0], val(1)[0]];
        if (AT.includes(sec)) for (let s = 0; s < 2; s++) { const [v, n] = val(s), inc = S.income(g, s); snap[s].push({ t: sec, v, n, inc: Math.round((inc.c + inc.e) * 10) / 10, incC: Math.round(inc.c * 10) / 10, nodes: g.nodes.filter(x => x.owner === s).length, res: [Math.round(g.sides[s].res.c), Math.round(g.sides[s].res.e)] }); }
      }
    }
  } catch (e) { err = String(e && e.stack || e); }
  // the first field fight: losses more than 250 from both HQs
  const L = S.ea6e.loss.filter(x => x[3] > 250); let fight = null;
  if (L.length) {
    const t0 = L[0][0]; let t1 = t0; for (const x of L) { if (x[0] - t1 > 20) break; t1 = x[0]; }
    const lost = [0, 0], types = [{}, {}]; for (const x of L) if (x[0] <= t1) { lost[x[1]] += x[2]; types[x[1]][x[4]] = (types[x[1]][x[4]] || 0) + 1; }
    fight = { t0: Math.round(t0), t1: Math.round(t1), lost, types, win: lost[0] < lost[1] ? 0 : lost[1] < lost[0] ? 1 : -1, army: armyAt[Math.floor(t0)] || null };
  }
  process.send({ map, f: [f0, f1], seed: +seed, p: [p0, p1], over: g.over, winner: g.over ? g.winner : null, err, snap, fight, loss: L.map(x => [Math.round(x[0] * 10) / 10, x[1], x[2], x[4]]), army: armyAt.filter((_, i) => i % 5 === 0) });
  process.exit(0);
}
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const F = ['lastfist', 'bloomhost', 'axiarchs'], P = ['boomer', 'economist', 'turtle'], ALLMAPS = ['classic', 'twolane', 'threelane'];
const out = arg('out', path.join(__dirname, '..', 'logs-p1', 'early6e')), J = +arg('jobs', '4'), rw = arg('rw', '');
fs.mkdirSync(out, { recursive: true });
const jobs = [];
for (const map of ALLMAPS) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (a !== b) for (let pa = 0; pa < 3; pa++) for (let pb = 0; pb < 3; pb++) {
  const [lo, hi, plo, phi] = a < b ? [a, b, pa, pb] : [b, a, pb, pa];
  const pairIdx = lo === 0 ? hi - 1 : 2, seed = 600 + pairIdx * 27 + ALLMAPS.indexOf(map) * 9 + plo * 3 + phi;
  jobs.push({ map, f0: F[a], f1: F[b], p0: P[pa], p1: P[pb], seed });
}
const file = path.join(out, 'early.jsonl'); if (fs.existsSync(file)) fs.unlinkSync(file);
let next = 0, n = 0, live = 0;
(function go() {
  while (live < J && next < jobs.length) {
    const j = jobs[next++]; live++;
    const c = fork(__filename, ['--one', j.map, j.f0, j.f1, String(j.seed), rw, j.p0, j.p1]);
    c.on('message', m => { fs.appendFileSync(file, JSON.stringify(m) + '\n'); if (++n % 20 === 0 || m.err) console.log(n, m.err || ''); });
    c.on('exit', () => { live--; go(); });
  }
})();
