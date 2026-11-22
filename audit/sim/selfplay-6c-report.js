// Batch 6c (v2.93): tables for the persona-balanced self-play (audit/sim/selfplay-6c.js), with 95% confidence intervals.
//   node audit/sim/selfplay-6c-report.js [dir] [--vs otherDir]   writes <dir>/report6c.md (and runs audit6a-report.js for the
//   6a tables: tiers, units trained, damage per credit, path picks, fast matches → <dir>/report.md)
// Win rate = wins / all matches (a draw is not a win); "of decided" = wins / (wins + losses). Intervals: Wilson score, 95%.
// "Natural mix": each match weighted by how likely the two personalities are under Hard's own per-faction rolls
// (AI_PRESETS.hard byFac kinds; a personality a faction never rolls weighs 0), so the balanced design also estimates the
// faction rates the game's own dice would give.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const args = process.argv.slice(2), vsI = args.indexOf('--vs'), VS = vsI >= 0 ? args[vsI + 1] : null;
const dir = args.find((a, i) => !a.startsWith('--') && !(vsI >= 0 && i === vsI + 1)) || path.join(__dirname, '..', 'logs-p1', 'selfplay6c-a1');
const load = d => fs.readFileSync(path.join(d, 'matches.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const M = load(dir), MV = VS ? load(VS) : null;
const F = ['lastfist', 'bloomhost', 'axiarchs'], FN = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' }, MAPS = ['classic', 'twolane', 'threelane'], P = ['boomer', 'economist', 'turtle'];
// v2.94 (batch 6d): the Axiarchs' Hard pool is Boomer, Boomer, Turtle (src/sim/ai-presets.js, since v2.43); 6c's tables used 1/3
// Boomer, 2/3 Turtle by mistake. With b6ai on, every faction's pool is equal thirds (B6AI.pool)
const NAT0 = { lastfist: { boomer: 0.5, economist: 0.25, turtle: 0.25 }, bloomhost: { boomer: 0.75, economist: 0, turtle: 0.25 }, axiarchs: { boomer: 2 / 3, economist: 0, turtle: 1 / 3 } };
const NAT6 = Object.fromEntries(['lastfist', 'bloomhost', 'axiarchs'].map(f => [f, { boomer: 1 / 3, economist: 1 / 3, turtle: 1 / 3 }]));
let NAT = NAT0;
const out = [], say = s => out.push(s);
const table = (head, rows) => { say('| ' + head.join(' | ') + ' |'); say('|' + head.map(() => '---').join('|') + '|'); for (const r of rows) say('| ' + r.join(' | ') + ' |'); say(''); };
const wilson = (k, n) => { if (!n) return [0, 0]; const z = 1.96, p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const pc = x => Math.round(100 * x);
const ci = (k, n) => { if (!n) return '-'; const [a, b] = wilson(k, n); return `${pc(k / n)}% (${pc(a)}-${pc(b)})`; };
const winF = m => m.winner == null || m.winner < 0 ? null : m.f[m.winner];
const mmss = t => { if (t == null) return '-'; t = Math.round(t); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const med = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const rec = (ms, f) => { const mine = ms.filter(m => m.f.includes(f)), w = mine.filter(m => winF(m) === f).length, d = mine.filter(m => !winF(m)).length; return { n: mine.length, w, d, l: mine.length - w - d }; };
const row = (lab, r) => [lab, `${r.w}-${r.l}-${r.d}`, ci(r.w, r.n), ci(r.w, r.w + r.l)];
function report(M, title) {
  NAT = M[0] && M[0].rw && M[0].rw.b6ai ? NAT6 : NAT0;
  say(`## ${title}`); say('');
  say(`${M.length} matches, ${M.filter(m => m.err).length} errors; version ${[...new Set(M.map(m => m.ver))].join(', ')}; switches: ${JSON.stringify(Object.fromEntries(Object.entries(M[0].rw).filter(([, v]) => !v)))} off, the rest on.`); say('');
  const pp = {}; for (const m of M) m.sides.forEach(s => { const k = s.fac + ' ' + s.persona; pp[k] = (pp[k] || 0) + 1; });
  say(`Design check (sides per faction and personality): ${Object.entries(pp).sort().map(([k, v]) => `${k} ${v}`).join(', ')}.`); say('');
  say('### Faction win rates (95% Wilson intervals)'); say('');
  table(['faction', 'W-L-D', 'win rate', 'of decided'], F.map(f => row(FN[f], rec(M, f))));
  say(`Natural mix (each match weighted by the chance Hard\'s own dice give those two personalities: ${NAT === NAT6 ? 'equal thirds (b6ai)' : 'the v2.93 pools'}; effective matches in brackets):`); say('');
  const natRows = F.map(f => { let W = 0, D = 0, N = 0, W2 = 0; for (const m of M.filter(m => m.f.includes(f))) { const w = m.sides.reduce((a, s) => a * NAT[s.fac][s.persona], 1); N += w; W2 += w * w; if (winF(m) === f) W += w; else if (!winF(m)) D += w; } const neff = N * N / W2; const p = W / N; const [a, b] = wilson(p * neff, neff); return [FN[f], `${pc(p)}% (${pc(a)}-${pc(b)})`, `${pc(D / N)}%`, Math.round(neff)]; });
  table(['faction', 'win rate, natural mix', 'draws', 'effective matches'], natRows);
  say('Per pairing (first-named faction; win rate of all, then of decided):'); say('');
  const prs = [['lastfist', 'bloomhost'], ['lastfist', 'axiarchs'], ['bloomhost', 'axiarchs']];
  table(['pairing', 'map', 'W-L-D', 'win rate', 'of decided'], prs.flatMap(([a, b]) => [...MAPS, null].map(mp => { const ms = M.filter(m => m.f.includes(a) && m.f.includes(b) && (!mp || m.map === mp)); const r = rec(ms, a); return [`${FN[a]} vs ${FN[b]}`, mp || '**all**', `${r.w}-${r.l}-${r.d}`, ci(r.w, r.n), ci(r.w, r.w + r.l)]; })));
  say('Per faction and map:'); say('');
  table(['faction', 'map', 'W-L-D', 'win rate', 'of decided'], F.flatMap(f => MAPS.map(mp => { const r = rec(M.filter(m => m.map === mp), f); return [FN[f], mp, `${r.w}-${r.l}-${r.d}`, ci(r.w, r.n), ci(r.w, r.w + r.l)]; })));
  const s0 = M.filter(m => m.winner === 0).length, s1 = M.filter(m => m.winner === 1).length;
  say(`Sides: side 0 won ${s0}, side 1 won ${s1}, ${M.length - s0 - s1} draws; side 1 share of decided ${ci(s1, s0 + s1)}. Per map: ${MAPS.map(mp => { const ms = M.filter(m => m.map === mp), a = ms.filter(m => m.winner === 0).length, b = ms.filter(m => m.winner === 1).length; return `${mp} ${a}-${b}-${ms.length - a - b}`; }).join(', ')}.`); say('');
  say('### Personalities'); say('');
  const sides = []; for (const m of M) m.sides.forEach((s, i) => sides.push({ m, i, fac: s.fac, p: s.persona, won: m.winner === i, draw: !(m.winner >= 0) }));
  const prow = (lab, ss) => { const w = ss.filter(s => s.won).length, d = ss.filter(s => s.draw).length; return [lab, `${w}-${ss.length - w - d}-${d}`, ci(w, ss.length), ci(w, ss.length - d)]; };
  table(['personality', 'W-L-D', 'win rate', 'of decided'], P.map(p => prow(p, sides.filter(s => s.p === p))));
  table(['faction', 'personality', 'W-L-D', 'win rate', 'of decided'], F.flatMap(f => P.map(p => { const r = prow(p, sides.filter(s => s.fac === f && s.p === p)); return [FN[f], ...r]; })));
  say('Personality against personality (row personality\'s win rate, all factions):'); say('');
  table(['', ...P], P.map(a => [a, ...P.map(b => { const ss = sides.filter(s => s.p === a && s.m.sides[1 - s.i].persona === b); return ci(ss.filter(s => s.won).length, ss.length); })]));
  say('### Length and how matches ended'); say('');
  const hows = {}; for (const m of M) { const k = m.how || 'unfinished'; hows[k] = (hows[k] || 0) + 1; }
  const hq = M.filter(m => m.how === 'hq').length;
  table(['set', 'matches', 'median length', 'under 5:00', '20:00 or more', 'ended by HQ destruction'], [...MAPS.map(mp => M.filter(m => m.map === mp)), M].map((ms, i) => [i < 3 ? MAPS[i] : '**all**', ms.length, mmss(med(ms.map(m => m.t))), ms.filter(m => m.t < 300).length, ms.filter(m => m.t >= 1200).length, ci(ms.filter(m => m.how === 'hq').length, ms.length)]));
  say(`How matches ended: ${Object.entries(hows).map(([k, v]) => `${k} ${v}`).join(', ')} (HQ destroyed ${ci(hq, M.length)}).`); say('');
}
report(M, `Persona-balanced self-play: ${path.basename(dir)}`);
if (MV) report(MV, `For comparison: ${path.basename(VS)}`);
const txt = out.join('\n') + '\n'; fs.writeFileSync(path.join(dir, 'report6c.md'), txt); console.log(txt);
try { execFileSync('node', [path.join(__dirname, 'audit6a-report.js'), dir], { stdio: 'ignore' }); } catch (e) { console.error('audit6a-report failed', e.message); }
