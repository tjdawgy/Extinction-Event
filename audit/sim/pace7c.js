#!/usr/bin/env node
// Phase 7c (Part C): early-game pacing, v2.41 numbers (setBalance7b(false)) against v2.42/v2.43. The same scripted Greedy
// opening (greedy.js) and the Hard AI's opening, mirror matches, per faction: when the first Barracks, the first unit and
// the third Refinery finish, and credits earned by 1:00, 2:00, 3:00 and 5:00. Means over n seeds.
//   node audit/sim/pace7c.js [--n=6]
const { loadSim } = require('./load');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const n = +(arg('n') || 6), F = ['lastfist', 'bloomhost', 'axiarchs'];
const row = (label, setup, who) => {
  const acc = {}; let k = 0;
  for (const f of F) for (let i = 0; i < n; i++) {
    const S = loadSim(91000 + i); setup(S);
    const bot = who === 'greedy' ? require('./greedy').greedyBot(S, {}) : null;
    const g = S.newGame('hard', who === 'greedy' ? { factions: [f, f] } : { autoPlayer: true, autoDiff: 'hard', factions: [f, f], ai: 'hard', autoAi: 'hard' }); g.countdown = 0;
    const T = {}; const mark = (key, t) => { if (T[key] === undefined) T[key] = t; };
    while (g.t < 300 && !g.over) {
      S.update(g, 1 / 30); if (bot) { bot(g, 0, 1 / 30); g.sides[1].aiT = 1e12; }
      const b = g.ents.filter(e => e.kind === 'b' && e.side === 0 && e.built && e.hp > 0);
      if (b.some(e => e.type === 'barracks')) mark('barracks', g.t);
      if (g.ents.some(e => e.kind === 'u' && e.side === 0)) mark('unit', g.t);
      if (b.filter(e => e.type === 'refinery').length >= 3) mark('ref3', g.t);
      for (const s of [60, 120, 180, 300]) if (g.t >= s) mark('e' + s, g.log.tot[0].earn[0]);
    }
    for (const key in T) (acc[key] = acc[key] || []).push(T[key]); k++;
  }
  const m = key => acc[key] ? Math.round(acc[key].reduce((a, b) => a + b, 0) / acc[key].length) : '-';
  console.log(`${label.padEnd(26)} Barracks ${m('barracks')} s, first unit ${m('unit')} s, 3rd Refinery ${m('ref3')} s (${(acc.ref3 || []).length}/${k}), earned 1:00 ${m('e60')}, 2:00 ${m('e120')}, 3:00 ${m('e180')}, 5:00 ${m('e300')}`);
};
for (const who of ['greedy', 'hard']) {
  row(`${who}, v2.41 numbers`, S => { S.setBalance7b(false); S.setMech7c(false); }, who);
  row(`${who}, v2.42 numbers`, S => { S.setBalance7c(false); S.setMech7c(false); }, who);
  row(`${who}, v2.43`, () => {}, who);
}
