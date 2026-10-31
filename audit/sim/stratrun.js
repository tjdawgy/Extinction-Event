#!/usr/bin/env node
// Phase 7b: strategy matrices with the scripted bots (strat.js; Greedy-vs-Greedy uses greedy.js, the phase 7a bot).
// Every cell plays n seeds with each bot on each side. Win share = (wins + draws / 2) / matches.
//   node audit/sim/stratrun.js --set=tri|gvg|field|contain|branch|nodes [--n=8] [--seed=97000] [--factions=lastfist,...]
//        [--code="SIM changes"] [--tag=name] [--jobs=4]
//   tri:     per faction (mirror), the triangle pairs and Contain against each opening (default branches)
//   gvg:     greedy.js against greedy.js, every cross-faction pairing (identical scripted play)
//   field:   every opening x branch against every other, all faction pairings (sampled), for opening and branch shares
//   contain: a light and a heavy Contain against a correct ('break') and a naive defender, per faction (mirror)
//   nodes:   a greedy timing player holding 3, 2 or 1 field nodes against fewer (mirror)
//   sig:     each opening/branch with signature building A or B against the same without (mirror)
// Writes out/strat-<set>-<tag>.json and prints the tables.
const fs = require('fs'), path = require('path');
const { runSpecs } = require('./run');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const F = ['lastfist', 'bloomhost', 'axiarchs'], OPENERS = ['rush', 'greedy', 'turtle', 'contain'], BRANCHES = ['timing', 'contain', 'tech', 'air'];
const share = x => x.n ? Math.round(1000 * (x.w + x.d / 2) / x.n) / 10 : 0;
const add = (o, k, r) => { const x = o[k] = o[k] || { w: 0, l: 0, d: 0, n: 0 }; x.n++; if (r > 0) x.w++; else if (r < 0) x.l++; else x.d++; };
function specsFor(set, n, seed, factions, code) {
  const out = [];
  const pair = (fa, A, fb, B, meta) => { for (let k = 0; k < n; k++) for (const sw of [0, 1]) {
    const a = { faction: fa, bot: A.bot || 'strat', botOpts: A }, b = { faction: fb, bot: B.bot || 'strat', botOpts: B };
    out.push(Object.assign({ seed: seed + k, diff: 'hard', maxT: 1800, code, sides: sw ? [b, a] : [a, b], aSide: sw }, meta)); } };
  if (set === 'tri') for (const f of factions) {
    for (const [x, y] of [['rush', 'greedy'], ['greedy', 'turtle'], ['turtle', 'rush'], ['contain', 'greedy'], ['contain', 'turtle'], ['contain', 'rush']])
      pair(f, { opener: x }, f, { opener: y }, { cell: `${f} ${x}>${y}`, x, y, f });
  }
  if (set === 'gvg') for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) pair(F[i], { bot: 'greedy' }, F[j], { bot: 'greedy' }, { cell: `${F[i]}>${F[j]}`, fa: F[i], fb: F[j] });
  if (set === 'contain') for (const f of factions) for (const def of ['break', 'naive']) {
    // light: a Contain opening (parks at about 450) against a standard opening; heavy: a greedy economy that parks at 1,200
    // against a defender whose army starts at 5:00 (a clear army lead)
    pair(f, { opener: 'contain', branch: 'contain' }, f, { opener: 'standard', branch: 'timing', defend: def }, { cell: `${f} light-contain>${def}`, f });
    pair(f, { opener: 'greedy', branch: 'contain', containV: 1200 }, f, { opener: 'greedy', branch: 'timing', defend: def, armyAt: 300 }, { cell: `${f} heavy-contain>${def}`, f });
  }
  if (set === 'nodes') for (const f of factions) { // a greedy timing player that holds 1, 2 or 3 nodes, against the same with fewer
    pair(f, { opener: 'greedy', nodes: 3 }, f, { opener: 'greedy', nodes: 1 }, { cell: `${f} nodes3>nodes1`, f });
    pair(f, { opener: 'greedy', nodes: 2 }, f, { opener: 'greedy', nodes: 1 }, { cell: `${f} nodes2>nodes1`, f });
    pair(f, { opener: 'greedy', nodes: 3 }, f, { opener: 'greedy', nodes: 2 }, { cell: `${f} nodes3>nodes2`, f });
  }
  if (set === 'sig') for (const f of factions) for (const [op, br] of [['greedy', 'timing'], ['turtle', 'tech'], ['contain', 'contain'], ['greedy', 'air']]) for (const sg of ['A', 'B'])
    pair(f, { opener: op, branch: br, sig: sg }, f, { opener: op, branch: br }, { cell: `${f} ${op}/${br} sig${sg}>none`, f });
  if (set === 'field') { // every opening and every branch against a sampled field: all faction pairings
    const bots = []; for (const o of OPENERS) for (const b of BRANCHES) bots.push({ opener: o, branch: b });
    let k = 0;
    for (const fa of factions) for (const fb of F) for (const A of bots) { const B = bots[(k * 7 + 3) % bots.length]; k++; if (A.opener === B.opener && A.branch === B.branch) continue;
      pair(fa, A, fb, B, { cell: 'field', A, B, fa, fb }); }
  }
  return out;
}
async function main() {
  const set = arg('set') || 'tri', n = +(arg('n') || 8), seed = +(arg('seed') || 97000), factions = (arg('factions') || F.join(',')).split(','), code = arg('code');
  const specs = specsFor(set, n, seed, factions, code);
  const t0 = Date.now();
  const res = await runSpecs(specs, +(arg('jobs') || 4), (d, N) => process.stderr.write(`\r${set}: ${d}/${N}`));
  process.stderr.write(` (${Math.round((Date.now() - t0) / 1000)} s)\n`);
  const cells = {}, fshare = {}, oshare = {}, bshare = {}, ofshare = {}, bfshare = {}, lens = {};
  res.forEach((r, i) => {
    const sp = specs[i], as = sp.aSide, rr = r.winner < 0 ? 0 : r.winner === as ? 1 : -1;
    add(cells, sp.cell, rr); (lens[sp.cell] = lens[sp.cell] || []).push(r.t);
    if (set === 'gvg') { add(fshare, sp.fa, rr); add(fshare, sp.fb, -rr); }
    if (set === 'nodes') for (const f of factions) { // a greedy timing player that holds 1, 2 or 3 nodes, against the same with fewer
    pair(f, { opener: 'greedy', nodes: 3 }, f, { opener: 'greedy', nodes: 1 }, { cell: `${f} nodes3>nodes1`, f });
    pair(f, { opener: 'greedy', nodes: 2 }, f, { opener: 'greedy', nodes: 1 }, { cell: `${f} nodes2>nodes1`, f });
    pair(f, { opener: 'greedy', nodes: 3 }, f, { opener: 'greedy', nodes: 2 }, { cell: `${f} nodes3>nodes2`, f });
  }
  if (set === 'sig') for (const f of factions) for (const [op, br] of [['greedy', 'timing'], ['turtle', 'tech'], ['contain', 'contain'], ['greedy', 'air']]) for (const sg of ['A', 'B'])
    pair(f, { opener: op, branch: br, sig: sg }, f, { opener: op, branch: br }, { cell: `${f} ${op}/${br} sig${sg}>none`, f });
  if (set === 'field') {
      add(oshare, sp.A.opener, rr); add(oshare, sp.B.opener, -rr); add(bshare, sp.A.branch, rr); add(bshare, sp.B.branch, -rr);
      add(ofshare, sp.fa + ' ' + sp.A.opener, rr); add(ofshare, sp.fb + ' ' + sp.B.opener, -rr);
      add(bfshare, sp.fa + ' ' + sp.A.branch, rr); add(bfshare, sp.fb + ' ' + sp.B.branch, -rr);
      if (sp.fa !== sp.fb) { add(fshare, sp.fa, rr); add(fshare, sp.fb, -rr); }
    }
  });
  const fmt = (o) => Object.entries(o).map(([k, x]) => `  ${k}: ${x.w}-${x.l}${x.d ? '-' + x.d : ''} (${share(x)}%)${lens[k] ? ' median ' + Math.round(lens[k].sort((a, b) => a - b)[lens[k].length >> 1] / 6) / 10 + ' min' : ''}`).join('\n');
  console.log(`set ${set}, n ${n} per side, seed ${seed}${code ? ', code: ' + code : ''}`);
  console.log(fmt(cells));
  if (Object.keys(fshare).length) console.log('faction shares (cross-faction):\n' + fmt(fshare));
  if (set === 'nodes') for (const f of factions) { // a greedy timing player that holds 1, 2 or 3 nodes, against the same with fewer
    pair(f, { opener: 'greedy', nodes: 3 }, f, { opener: 'greedy', nodes: 1 }, { cell: `${f} nodes3>nodes1`, f });
    pair(f, { opener: 'greedy', nodes: 2 }, f, { opener: 'greedy', nodes: 1 }, { cell: `${f} nodes2>nodes1`, f });
    pair(f, { opener: 'greedy', nodes: 3 }, f, { opener: 'greedy', nodes: 2 }, { cell: `${f} nodes3>nodes2`, f });
  }
  if (set === 'sig') for (const f of factions) for (const [op, br] of [['greedy', 'timing'], ['turtle', 'tech'], ['contain', 'contain'], ['greedy', 'air']]) for (const sg of ['A', 'B'])
    pair(f, { opener: op, branch: br, sig: sg }, f, { opener: op, branch: br }, { cell: `${f} ${op}/${br} sig${sg}>none`, f });
  if (set === 'field') { console.log('openings vs field:\n' + fmt(oshare)); console.log('branches vs field:\n' + fmt(bshare)); console.log('faction x opening:\n' + fmt(ofshare)); console.log('faction x branch:\n' + fmt(bfshare)); }
  const d = path.join(__dirname, 'out'); fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, `strat-${set}-${arg('tag') || 'x'}.json`), JSON.stringify({ specs, res: res.map(r => ({ winner: r.winner, t: r.t, how: r.how, sides: r.sides.map(s => ({ faction: s.faction, bot: s.bot, earned: s.earned, trained: s.trained, nodeTime: s.nodeTime, salvage: s.salvage, buildings: s.buildings })), samples: r.samples })) }));
}
module.exports = { specsFor };
if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
