#!/usr/bin/env node
// S3 (unit roster): do the bombers' supply costs (Leviathan 7, Worldrender 8, Astral Sovereign 9) keep the AI from training
// them? Economist sides on both ends (the personality that techs furthest), every cross pairing, as is and with lower
// supply. Reports how many sides trained each bomber and the wins of the bomber's faction.
//   node audit/sim/s3.js [--n=16] [--code="UDEF.leviathan.pop=6;UDEF.worldrender.pop=7;UDEF.sovereign.pop=7"]
const { runSet } = require('./run');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const BOMBER = { lastfist: 'leviathan', bloomhost: 'worldrender', axiarchs: 'sovereign' }, PAIRS = [['lastfist', 'bloomhost'], ['lastfist', 'axiarchs'], ['bloomhost', 'axiarchs']];
(async () => {
  const n = +(arg('n') || 16), low = arg('code') || 'UDEF.leviathan.pop=6;UDEF.worldrender.pop=7;UDEF.sovereign.pop=7';
  for (const [k, code] of [['as is', undefined], ['lower supply', low]]) {
    const t = {}; for (const f in BOMBER) t[f] = { sides: 0, trained: 0, wins: 0, games: 0 };
    for (const [a, b] of PAIRS) {
      const set = await runSet({ a: { faction: a, ai: 'default', persona: 'economist' }, b: { faction: b, ai: 'default', persona: 'economist' }, n, seed: 80000, maxT: 1800, code, quiet: true });
      for (const m of set.matches) for (const s of ['A', 'B']) { const f = m[s].faction, x = t[f]; x.sides++; if (m[s].trained[BOMBER[f]]) x.trained++; x.games++; if (m.result === s) x.wins++; }
    }
    console.log(`${k}: ` + Object.entries(t).map(([f, x]) => `${BOMBER[f]} trained by ${x.trained}/${x.sides} ${f} sides (${f} won ${x.wins}/${x.games})`).join('; '));
  }
})().catch(e => { console.error(e); process.exit(1); });
