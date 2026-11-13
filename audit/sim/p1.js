#!/usr/bin/env node
// v2.80 (Phase 1 balance pass, docs/PHASE1_BALANCE_PLAN.md): runs the pass's measurement sets in batches and saves each set
// to its own file as soon as it finishes, so a container restart costs one set, not the run. A set already saved is
// skipped (delete its file to run it again).
//   node audit/sim/p1.js --plan=base|ab|verify [--tag=baseline] [--code='SIM changes'] [--only=regex] [--jobs=4] [--scale=1]
// Writes audit/logs-p1/balance/<tag>/<set>.json; audit/sim/p1report.js prints the tables.
// Sets:
//   L:<map>:<A>-<B>          AI vs AI (ladder.js's specs: match i gives side A the faction F[i % 3], B F[floor(i / 3) % 3],
//                            A on the left on even i), 27:00 limit, mixed factions
//   C:<map>:<cond>:hard-hard the same under one battlefield condition
//   T:<map>:tri              the strategy triangle (stratrun.js 'tri': each faction's mirror, Rush/Greedy/Turtle/Contain)
//   F:<map>:field            every opening x branch against a sampled field (stratrun.js 'field'), Tech vs Contain
// --code applies to every match (an A/B arm: e.g. --code='setBalance8(false)').
const fs = require('fs'), path = require('path');
const { runSpecs } = require('./run');
const { specsFor } = require('./stratrun');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const F = ['lastfist', 'bloomhost', 'axiarchs'], MAPS = ['classic', 'twolane', 'threelane'];
const CONDS = { classic: ['heavyFog', 'richCenter', 'scarce'], twolane: ['heavyFog', 'richCenter', 'scarce', 'meteors'], threelane: ['heavyFog', 'richCenter', 'scarce', 'meteors'] };

function ladderSpecs(mapId, da, db, n, seed, code, cond) {
  const specs = [];
  for (let i = 0; i < n; i++) {
    const A = { faction: F[i % 3], diff: da, persona: 'random' }, B = { faction: F[Math.floor(i / 3) % 3], diff: db, persona: 'random' }, sw = i % 2;
    specs.push({ seed: seed + i, diff: 'normal', maxT: 1620, mapId, code, cond, sides: sw ? [B, A] : [A, B], aSide: sw, fa: A.faction, fb: B.faction });
  }
  return specs;
}
// The plans: [name, () => specs]. scale multiplies every n (rounded to whole faction cycles where it matters).
function plan(name, scale, code, maps) {
  const S = [], k = x => Math.max(1, Math.round(x * scale));
  const nine = x => Math.max(18, Math.round(x * scale / 18) * 18); // whole cycles of the nine faction pairings, both sides
  for (const m of maps) {
    if (name === 'base' || name === 'verify') {
      S.push([`L:${m}:hard-hard`, () => ladderSpecs(m, 'hard', 'hard', nine(126), 8000, code)]);
      S.push([`L:${m}:normal-normal`, () => ladderSpecs(m, 'normal', 'normal', nine(126), 8000, code)]);
      S.push([`L:${m}:easy-easy`, () => ladderSpecs(m, 'easy', 'easy', nine(54), 8000, code)]);
      S.push([`L:${m}:hard-normal`, () => ladderSpecs(m, 'hard', 'normal', nine(90), 8000, code)]);
      S.push([`L:${m}:normal-easy`, () => ladderSpecs(m, 'normal', 'easy', nine(90), 8000, code)]);
      for (const c of CONDS[m]) S.push([`C:${m}:${c}:hard-hard`, () => ladderSpecs(m, 'hard', 'hard', nine(36), 9000, code, [c])]);
      S.push([`T:${m}:tri`, () => specsFor('tri', k(4), 97000, F, code, m).map(x => Object.assign(x, { kind: 'strat' }))]);
      S.push([`F:${m}:field`, () => specsFor('field', 1, 98000, F, code, m).map(x => Object.assign(x, { kind: 'strat' }))]);
    }
    if (name === 'ab') { // a faction-numbers round: Hard and Normal shares on every map, fewer matches
      S.push([`L:${m}:hard-hard`, () => ladderSpecs(m, 'hard', 'hard', nine(108), 8000, code)]);
      S.push([`L:${m}:normal-normal`, () => ladderSpecs(m, 'normal', 'normal', nine(108), 8000, code)]);
    }
  }
  return S;
}
const pick = r => ({ w: r.winner, t: r.t, how: r.how, reason: r.reason, sides: r.sides.map(s => ({ f: s.faction, dmg: s.dmg, alive: s.alive, trained: s.trained, lost: s.lost, earned: s.earned, bot: s.bot ? { mode: s.bot.mode, attacks: s.bot.attacks, firstAttack: s.bot.firstAttack } : undefined })) });
const specMeta = sp => sp.kind === 'strat' ? { cell: sp.cell, aSide: sp.aSide, A: sp.A, B: sp.B, fa: sp.fa, fb: sp.fb, f: sp.f, x: sp.x, y: sp.y } : { aSide: sp.aSide, fa: sp.fa, fb: sp.fb, seed: sp.seed };

(async () => {
  const name = arg('plan', 'base'), tag = arg('tag', name), code = arg('code'), only = arg('only') ? new RegExp(arg('only')) : null, jobs = +arg('jobs', 4), scale = +arg('scale', 1);
  const maps = arg('maps', MAPS.join(',')).split(',');
  const dir = path.join(__dirname, '..', 'logs-p1', 'balance', tag); fs.mkdirSync(dir, { recursive: true });
  for (const [set, mk] of plan(name, scale, code, maps)) {
    if (only && !only.test(set)) continue;
    const file = path.join(dir, set.replace(/:/g, '_') + '.json');
    if (fs.existsSync(file)) { console.error(`${set}: saved, skipped`); continue; }
    const specs = mk(), t0 = Date.now();
    const res = await runSpecs(specs, jobs, (d, N) => process.stderr.write(`\r${set}: ${d}/${N}`));
    const secs = Math.round((Date.now() - t0) / 1000);
    process.stderr.write(` (${secs} s)\n`);
    fs.writeFileSync(file + '.tmp', JSON.stringify({ set, code: code || null, version: res[0] && res[0].version, n: specs.length, secs, matches: res.map((r, i) => Object.assign(specMeta(specs[i]), pick(r))) }));
    fs.renameSync(file + '.tmp', file);
  }
})().catch(e => { console.error(e); process.exit(1); });
