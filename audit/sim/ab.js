#!/usr/bin/env node
// A/B experiment (Phase 5): the same pairing on the same seeds, once as the game is and once with `code` run in every
// match's SIM context first (for example 'FLAME.aim = false'). Paired seeds, so the difference is the change alone.
// Reports wins, draws and the damage the named weapons dealt (diagnostics on).
//   node audit/sim/ab.js --a=lastfist --b=bloomhost --code="FLAME.aim=false" [--weapons=flame,hqgun] [--n=40] [--seed=50010] [--maxT=1800]
const { runSet } = require('./run');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const pct = (a, b) => b ? Math.round(1000 * a / b) / 10 : 0;
function weaponDmg(set, k, weapons) { // mean per match: weapon → [to units, to buildings], by side k (A or B)
  const out = {};
  for (const w of weapons) { let u = 0, b = 0; for (const m of set.matches) { const d = (m[k].diag || {}).dmg || {}; u += (d[w + '>U'] || []).reduce((x, y) => x + y, 0); b += (d[w + '>B'] || []).reduce((x, y) => x + y, 0); } out[w] = [Math.round(u / set.matches.length), Math.round(b / set.matches.length)]; }
  return out;
}
async function ab({ a, b, code, n = 40, seed = 50010, maxT = 1800, weapons = [], jobs = 4 }) {
  const side = f => ({ faction: f, ai: 'default', persona: 'random' }), res = {};
  for (const [k, c] of [['as is', undefined], ['changed', code]]) {
    const set = await runSet({ a: side(a), b: side(b), n, seed, maxT, jobs, diag: true, code: c });
    const w = set.summary.wins;
    res[k] = { wins: w, share: pct(w.A, w.A + w.B), A: weaponDmg(set, 'A', weapons), B: weaponDmg(set, 'B', weapons), len: set.summary.avgLength };
  }
  return res;
}
module.exports = { ab };
if (require.main === module) (async () => {
  const r = await ab({ a: arg('a'), b: arg('b'), code: arg('code'), n: +(arg('n') || 40), seed: +(arg('seed') || 50010), maxT: +(arg('maxT') || 1800), weapons: (arg('weapons') || '').split(',').filter(Boolean) });
  console.log(`${arg('a')} vs ${arg('b')}, change: ${arg('code')}`);
  for (const k in r) console.log(`  ${k.padEnd(8)} A–B–draw ${r[k].wins.A}–${r[k].wins.B}–${r[k].wins.draw} (A ${r[k].share}% of decided), mean length ${r[k].len} s; weapon damage per match [units, buildings]: A ${JSON.stringify(r[k].A)} B ${JSON.stringify(r[k].B)}`);
})().catch(e => { console.error(e); process.exit(1); });
