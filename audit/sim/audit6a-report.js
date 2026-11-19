// Batch 6a (balance audit, v2.91): the tables for docs/BALANCE_AUDIT.md section 2 from audit/sim/audit6a.js's matches.jsonl.
//   node audit/sim/audit6a-report.js [dir]   (default audit/logs-p1/audit6a-v291); prints Markdown and writes <dir>/report.md
const fs = require('fs'), path = require('path');
const { loadSim } = require('./load');
const dir = process.argv[2] || path.join(__dirname, '..', 'logs-p1', 'audit6a-v291');
const M = fs.readFileSync(path.join(dir, 'matches.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
for (const m of M) for (const sd of m.sides) for (const k of ['dmg', 'dmgB', 'kills', 'kval']) { const o = sd[k]; if (o['?rupture']) { o.worldbreaker = (o.worldbreaker || 0) + o['?rupture']; delete o['?rupture']; } } // the Worldbreaker's crack and ridge land outside its own update (g.rup)
const NS = M.length * 2 / 3, NM = M.length, NP = M.length / 9; // v2.93 (batch 6c): sides per faction, matches, matches per pairing per map (any run size)
const S = loadSim(1), g0 = S.newGame('hard', { seed: 1 });
const F = ['lastfist', 'bloomhost', 'axiarchs'], FN = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' }, MAPS = ['classic', 'twolane', 'threelane'];
const out = [], say = s => out.push(s);
const table = (head, rows) => { say('| ' + head.join(' | ') + ' |'); say('|' + head.map(() => '---').join('|') + '|'); for (const r of rows) say('| ' + r.join(' | ') + ' |'); say(''); };
const mmss = t => { if (t == null) return '-'; t = Math.round(t); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const med = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const pct = (a, b) => b ? `${Math.round(100 * a / b)}%` : '-';
const winF = m => m.winner == null || m.winner < 0 ? null : m.f[m.winner];
const cost = t => { const c = S.rwD(g0, t).cost; return c.c + c.e; };
const ABN = { orbital: 'ability: Orbital Strike', beam: 'ability: Purification Beam', spores: 'ability: Corrosive Spores' };
const nm = t => t.startsWith('B:') ? 'building: ' + t.slice(2) : t.startsWith('?') ? ABN[t.slice(1)] || 'other: ' + t.slice(1) : t;

say(`${M.length} matches, ${M.filter(m => m.err).length} errors; version ${[...new Set(M.map(m => m.ver))].join(', ')}; every REWORK switch on: ${M.every(m => Object.values(m.rw).every(Boolean))}.`); say('');
// --- win rates ---
say('### 2.1 Win rates'); say('');
const rec = sel => { const ms = M.filter(sel); return ms; };
const facRow = (f, ms) => { const mine = ms.filter(m => m.f.includes(f)); const w = mine.filter(m => winF(m) === f).length, d = mine.filter(m => !winF(m)).length; return [FN[f], `${w}-${mine.length - w - d}-${d}`, pct(w, mine.length), pct(w, mine.length - d)]; };
table(['faction', `W-L-D (all ${NS} of its matches)`, 'win rate', 'of decided'], F.map(f => facRow(f, M)));
const pr = [];
for (const [a, b] of [['lastfist', 'bloomhost'], ['lastfist', 'axiarchs'], ['bloomhost', 'axiarchs']]) {
  const row = [`${FN[a]} vs ${FN[b]}`];
  for (const mp of [...MAPS, null]) { const ms = M.filter(m => m.f.includes(a) && m.f.includes(b) && (!mp || m.map === mp)); const w = ms.filter(m => winF(m) === a).length, l = ms.filter(m => winF(m) === b).length; row.push(`${w}-${l}-${ms.length - w - l}`); }
  pr.push(row);
}
say(`Per pairing (wins for the first-named faction - wins for the second - draws), per map and in total (${NP} matches per map, both side orders):`); say('');
table(['pairing', 'Classic', 'Two-Lane', 'Three-Lane', `total (${NP * 3})`], pr);
table(['faction', ...MAPS.map(m => m + ' W-L-D')], F.map(f => [FN[f], ...MAPS.map(mp => facRow(f, M.filter(m => m.map === mp))[1])]));
const s0 = M.filter(m => m.winner === 0).length, s1 = M.filter(m => m.winner === 1).length;
say(`Side: side 0 (the player's slot, left/bottom start) won ${s0}, side 1 won ${s1}, ${M.length - s0 - s1} draws.`); say('');
table(['map', 'side 0 wins', 'side 1 wins', 'draws'], MAPS.map(mp => { const ms = M.filter(m => m.map === mp); const a = ms.filter(m => m.winner === 0).length, b = ms.filter(m => m.winner === 1).length; return [mp, a, b, ms.length - a - b]; }));
table(['faction', 'as side 0 W-L-D', 'as side 1 W-L-D'], F.map(f => [0, 1].map(sd => { const ms = M.filter(m => m.f[sd] === f), w = ms.filter(m => m.winner === sd).length, d = ms.filter(m => !(m.winner >= 0)).length; return `${w}-${ms.length - w - d}-${d}`; })).map((r, i) => [FN[F[i]], ...r]));
const hows = {}; for (const m of M) { const k = m.how || 'unfinished'; hows[k] = (hows[k] || 0) + 1; }
say(`How matches ended: ${Object.entries(hows).map(([k, v]) => `${k} ${v}`).join(', ')}.`); say('');
// --- length ---
say('### 2.2 Match length'); say('');
const lenRow = (lab, ms) => { const t = ms.map(m => m.t); return [lab, ms.length, mmss(med(t)), `${mmss(Math.min(...t))} - ${mmss(Math.max(...t))}`, ms.filter(m => m.t < 300).length, ms.filter(m => m.t >= 1200).length]; };
table(['set', 'matches', 'median', 'range', 'under 5:00', '20:00 or more'], [...MAPS.map(mp => lenRow(mp, M.filter(m => m.map === mp))), ...[['lastfist', 'bloomhost'], ['lastfist', 'axiarchs'], ['bloomhost', 'axiarchs']].map(([a, b]) => lenRow(`${FN[a]} vs ${FN[b]}`, M.filter(m => m.f.includes(a) && m.f.includes(b)))), lenRow('all', M)]);
// --- tiers ---
say('### 2.3 Tiers reached'); say('');
say('T2 / T3: the first non-HQ building of the side to finish that tier; "T3 unit": the first unit of a T3 unlock on the field; "T3 air": the first T3 aircraft (Leviathan, Cloudwing or Worldrender, Shardstorm or Sovereign). Medians over the sides that got there; "never" counts the ' + NS + ' sides of each faction.'); say('');
const sides = []; for (const m of M) m.sides.forEach((sd, i) => sides.push(Object.assign({ m, i, won: m.winner === i }, sd)));
const tierRow = f => { const ss = sides.filter(s => s.fac === f); const col = k => { const v = ss.filter(s => s[k] != null).map(s => s[k]); return [mmss(med(v)), `${ss.length - v.length} (${pct(ss.length - v.length, ss.length)})`]; }; return [FN[f], ...col('tier2'), ...col('tier3'), ...col('t3unit'), ...col('t3air')]; };
table(['faction', 'any building T2 median', 'never', 'any building T3 median', 'never', 'T3 unit median', 'never', 'T3 air median', 'never'], F.map(tierRow));
const prodRow = f => { const ss = sides.filter(s => s.fac === f), col = ty => { const v = ss.map(s => s.paths.filter(p => !ty || p.type === ty).map(p => p.t)).filter(a => a.length).map(a => Math.min(...a)); return `${mmss(med(v))} (never ${ss.length - v.length})`; }; return [FN[f], col(null), col('barracks'), col('factory'), col('techlab')]; };
say('Production T2 (the first path a side chose; "never" of ' + NS + ' sides). A T3 production step shows as the first T3 unit above.'); say('');
table(['faction', 'any production building', 'Barracks role', 'War Factory role', 'Tech Lab role'], F.map(prodRow));
// --- units trained ---
say('### 2.4 Units trained, and what they did'); say('');
say('Per unit type over all ' + NM + ' matches: trained (temporary units such as Mites, hatchlings and Cloudwing offspring are never trained; they show only as damage), matches with at least one, spent (credits + energy at the per-game price; a brood counts 30 per Skitterling), damage dealt (HP plus shields removed, units and buildings), damage to buildings, kills (units), killed value, and damage and killed value per 100 spent. Ordered by faction, then damage per 100 spent.'); say('');
const U = {};
const u = (f, t) => U[f + '|' + t] || (U[f + '|' + t] = { f, t, n: 0, mt: 0, sp: 0, dmg: 0, dmgB: 0, k: 0, kv: 0, lost: 0 });
for (const s of sides) {
  for (const [t, n] of Object.entries(s.trained)) { const x = u(s.fac, t); x.n += n; x.mt++; x.sp += s.spentBy[t] || 0; }
  for (const [t, n] of Object.entries(s.lost || {})) u(s.fac, t).lost += n;
  for (const [t, v] of Object.entries(s.dmg)) u(s.fac, t).dmg += v;
  for (const [t, v] of Object.entries(s.dmgB)) u(s.fac, t).dmgB += v;
  for (const [t, v] of Object.entries(s.kills)) u(s.fac, t).k += v;
  for (const [t, v] of Object.entries(s.kval)) u(s.fac, t).kv += v;
}
const rowsU = Object.values(U).filter(x => !x.t.startsWith('B:') && !x.t.startsWith('?') && S.UDEF[x.t]);
for (const f of F) {
  const rs = rowsU.filter(x => x.f === f).sort((a, b) => (b.sp ? b.dmg / b.sp : -1) - (a.sp ? a.dmg / a.sp : -1));
  say(`**${FN[f]}** (${NS} sides)`); say('');
  table(['unit', 'trained', 'in matches', 'spent', 'damage', 'to buildings', 'kills', 'killed value', 'dmg / 100 spent', 'killed value / 100 spent', 'lost'], rs.map(x => [x.t, x.n, x.mt, Math.round(x.sp), Math.round(x.dmg), Math.round(x.dmgB), x.k, Math.round(x.kv), x.sp ? Math.round(100 * x.dmg / x.sp) : '(free)', x.sp ? Math.round(100 * x.kv / x.sp) : '-', x.lost]));
  const all = S.UNIT_ORDER.filter(t => (S.UDEF[t].fac || 'lastfist') === f && !S.UDEF[t].noTrain && t !== 'bilelobber' && t !== 'riftmortar');
  const rare = all.map(t => [t, (U[f + '|' + t] || {}).n || 0, (U[f + '|' + t] || {}).mt || 0]).filter(([, n, mt]) => mt <= 6);
  say(`Rare (trained in 6 or fewer of the ${NS} sides): ${rare.length ? rare.map(([t, n, mt]) => `${t} ${n} (${mt} sides)`).join(', ') : 'none'}.`); say('');
}
const other = Object.values(U).filter(x => x.t.startsWith('B:') || x.t.startsWith('?')).sort((a, b) => b.dmg - a.dmg);
say('Damage from buildings, abilities and other sources (per faction):'); say('');
table(['faction', 'source', 'damage', 'kills'], other.filter(x => x.dmg > 500).map(x => [FN[x.f], nm(x.t), Math.round(x.dmg), x.k]));
// --- paths ---
say('### 2.5 Path picks'); say('');
say('Every building that took a path, counted once per building (the first path the side took on that role in brackets).'); say('');
const P = {};
for (const s of sides) { const first = {}; for (const p of s.paths) { const k = s.fac + '|' + p.type; const o = P[k] || (P[k] = { f: s.fac, type: p.type, all: {}, first: {}, sides: 0 }); o.all[p.name] = (o.all[p.name] || 0) + 1; if (!first[p.type]) { first[p.type] = 1; o.first[p.name] = (o.first[p.name] || 0) + 1; o.sides++; } } }
table(['faction', 'building', 'sides with a path', 'paths taken (buildings)', 'first path of the side'], Object.values(P).sort((a, b) => (a.f + a.type).localeCompare(b.f + b.type)).map(o => [FN[o.f], o.type, `${o.sides} of ${NS}`, Object.entries(o.all).map(([k, v]) => `${k} ${v}`).join(', '), Object.entries(o.first).map(([k, v]) => `${k} ${v}`).join(', ')]));
// --- fast matches ---
say('### 2.6 Matches under 5:00'); say('');
const fast = M.filter(m => m.t < 300);
if (!fast.length) say('None.'); else table(['map', 'match', 'seed', 'end', 'winner', 'how', 'winner trained', 'loser trained'], fast.map(m => { const w = m.winner, top = sd => Object.entries(sd.trained).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n}`).join(', '); return [m.map, m.f.map(f => FN[f]).join(' vs '), m.seed, mmss(m.t), w >= 0 ? FN[m.f[w]] : '-', m.how, w >= 0 ? top(m.sides[w]) : '-', w >= 0 ? top(m.sides[1 - w]) : '-']; }));
// --- Bloomspire and personas (open flags) ---
say('### 2.7 Notes for the open flags'); say('');
const bh = sides.filter(s => s.fac === 'bloomhost'), spire = s => s.paths.filter(p => p.type === 'techlab');
const noT2Spire = bh.filter(s => !spire(s).length).length;
const vsLF = bh.filter(s => s.m.f.includes('lastfist')), lfAir = s => { const o = s.m.sides[1 - s.i]; return Object.entries(o.trained).filter(([t]) => S.UDEF[t].air && S.UDEF[t].weapon).reduce((a, [, n]) => a + n, 0); };
const swarmVsLF = vsLF.filter(s => spire(s).some(p => p.name === 'Swarm Bloom')), noAirLF = swarmVsLF.filter(s => lfAir(s) === 0);
say(`- Bloomspire: ${noT2Spire} of ${NS} Bloomhost sides never took a Bloomspire to T2 (${pct(noT2Spire, NS)}). Against Last Fist (${vsLF.length} sides): Swarm Bloom ${swarmVsLF.length}, Apex Bloom ${vsLF.filter(s => spire(s).some(p => p.name === 'Apex Bloom')).length}; of the Swarm Bloom sides, ${noAirLF.length} faced a Last Fist side that trained no armed aircraft all match.`);
const t3air = {}; for (const s of sides) for (const t of ['leviathan', 'cloudwing', 'worldrender', 'shardstorm', 'sovereign', 'broodtyrant', 'voidcarrier']) if (s.trained[t]) t3air[t] = (t3air[t] || 0) + 1;
say(`- Top-tier aircraft, sides that trained any: ${Object.entries(t3air).map(([t, n]) => `${t} ${n}`).join(', ') || 'none'} (of ${NS} sides per faction).`);
const pk = {}; for (const s of bh) pk.m = Math.max(pk.m || 0, s.peak);
say(`- Peak units alive (one side): Last Fist ${Math.max(...sides.filter(s => s.fac === 'lastfist').map(s => s.peak))}, Bloomhost ${pk.m}, Axiarchs ${Math.max(...sides.filter(s => s.fac === 'axiarchs').map(s => s.peak))}; medians ${F.map(f => FN[f] + ' ' + med(sides.filter(s => s.fac === f).map(s => s.peak))).join(', ')}.`);
const persona = {}; for (const s of sides) { const k = s.fac + '|' + s.persona; const o = persona[k] || (persona[k] = { n: 0, w: 0 }); o.n++; if (s.won) o.w++; }
say(`- Personas (sides, wins): ${Object.entries(persona).sort().map(([k, o]) => `${FN[k.split('|')[0]]} ${k.split('|')[1]} ${o.w}/${o.n}`).join('; ')}.`);
say('');
const txt = out.join('\n') + '\n'; fs.writeFileSync(path.join(dir, 'report.md'), txt); console.log(txt);
