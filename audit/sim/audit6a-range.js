// Batch 6a (balance audit, v2.91, measurement only): the targeted measurements for docs/BALANCE_AUDIT.md section 3. Each one is
// the smallest Test Range setup (src/sim/testrange.js: the real SIM, no HQs, nodes, storm or fog; both sides under direct
// control, Attack = each unit goes for the nearest enemy it can hurt) that measures one open flag, run with the REWORK
// switch involved off and on where there is one, over several seeds (a Test Range game's seed drives every roll). Damage
// and kills per unit type come from audit/sim/audit6a-instrument.js (counting only). The Shardling rush (R3) is a real
// match: the scripted rush bot (audit/sim/strat.js 'rush': two Gates, Shardlings nonstop, attack at about 400 of army)
// against the Hard AI.
//   node audit/sim/audit6a-range.js [R1 R2 ...]   (all when none named); prints the tables and writes
//        audit/logs-p1/audit6a-v291/range.txt (and range.json) when run with no names
const fs = require('fs'), path = require('path');
const { loadSim } = require('./load');
const INSTR = require('./audit6a-instrument');
const EXTRA = `
(function () {
  const X = this.__sim.x6 = { bw: 0, bwRaw: 0, bwShots: 0, shells: 0, shellHit: 0, firstHit: null };
  const bd = bwDamage; bwDamage = function (g, B, amt) { const h0 = Math.max(0, B.bwHp); const r = bd.apply(this, arguments); X.bw += Math.max(0, h0 - Math.max(0, B.bwHp)); X.bwRaw += amt; X.bwShots++; return r; };
  const im = impact; impact = function (g, p, hit) {
    if (p.weapon !== 'shell') return im.apply(this, arguments);
    let before = 0; for (const e of g.ents) if (e.side !== p.side && e.hp > 0) before += e.hp + (e.shp || 0);
    const r = im.apply(this, arguments); let after = 0; for (const e of g.ents) if (e.side !== p.side) after += Math.max(0, e.hp) + (e.shp || 0);
    X.shells++; if (after < before - 0.01) X.shellHit++; return r;
  };
  Object.assign(this.__sim, { bwDamage, BAR, CREEP, ABIL, onCreep, LEV, SOV, TITAN, ART, SURGE, BROOD, hpMul, bdOf, refreshShields: typeof refreshShields === 'undefined' ? null : refreshShields });
}).call(this);`;
const S = loadSim(1, { instrument: INSTR + EXTRA });
const F = ['lastfist', 'bloomhost', 'axiarchs'], FN = { lastfist: 'Last Fist', bloomhost: 'Bloomhost', axiarchs: 'Axiarchs' };
const ONEWAY = process.argv.includes('--oneway'), OUTDIR = (i => i > 0 ? process.argv[i + 1] : null)(process.argv.indexOf('--out')); // v2.92 (batch 6b): --oneway: one orientation (the side bias is fixed with b6side), seeds 11-20 so each cell still has 10 runs; --out dir
const ORI = ONEWAY ? '10 seeds, one orientation' : '5 seeds × both orientations';
const SEEDS = ONEWAY ? [11, 12, 13, 14, 15, 16, 17, 18, 19, 20] : [11, 12, 13, 14, 15];
const cost = t => { const c = S.UDEF[t].cost; return c.c + c.e; };
const r0 = x => Math.round(x), r1 = x => Math.round(x * 10) / 10, r2 = x => Math.round(x * 100) / 100;
const reset = () => { const A = S.a6; for (const k of Object.keys(A)) A[k] = [{}, {}]; const X = S.x6; for (const k of Object.keys(X)) X[k] = k === 'firstHit' ? null : 0; };
const game = (factions, rework, seed = 11) => { reset(); const g = S.rangeGame({ seed, factions, rework }); return g; };
const place = (g, s, type, u, v, n) => { const out = []; for (let i = 0; i < n; i++) out.push(S.rangeUnit(g, s, type, u + (i % 4) * 14 * (s ? 1 : -1), v + (Math.floor(i / 4) % 6) * 16 - 40)); return out; };
const tough = es => es.forEach(e => { e.hp = e.maxHp = 1e6; });
const run = (g, sec, stop) => { const n = Math.round(sec * 60); for (let i = 0; i < n; i++) { S.rangeStep(g); g.events.length = 0; if (stop && stop()) break; } return g.t; };
const alive = (g, s) => g.ents.filter(e => e.side === s && e.hp > 0 && e.kind === 'u');
const value = (g, s) => alive(g, s).filter(e => !e.temp).reduce((a, e) => a + cost(e.type), 0);
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
const out = [], J = {};
const say = s => { out.push(s); console.log(s); };
const table = (head, rows) => { say('| ' + head.join(' | ') + ' |'); say('|' + head.map(() => '---').join('|') + '|'); for (const r of rows) say('| ' + r.join(' | ') + ' |'); say(''); };
// a fight to the end (or maxT), every seed in both orientations (--oneway: A as side 0 only) (A on the left as side 0, then A on the right as side 1:
// the Test Range has a small side bias, a mirror of 8 Lancers went 0-5 one way); counts are A's: wins-losses(-draws) of
// 2 × seeds, time median, value left (credits + energy, averaged), damage dealt per side and per type (A first)
function fight(factions, rework, A, B, o = {}) {
  const res = [];
  for (const seed of o.seeds || SEEDS) for (const flip of ONEWAY ? [0] : [0, 1]) {
    const g = game(flip ? [factions[1], factions[0]] : factions, rework, seed), sA = flip, sB = 1 - flip, at = u => flip ? 1280 - u : u;
    for (const [t, n, u, v] of A) place(g, sA, t, at(u ?? 480), v ?? 0, n);
    for (const [t, n, u, v] of B) place(g, sB, t, at(u ?? 800), v ?? 0, n);
    S.rangeMode(g, sA, 'attack'); S.rangeMode(g, sB, o.bHold ? 'hold' : 'attack');
    run(g, o.maxT || 150, () => !alive(g, 0).length || !alive(g, 1).length);
    const nA = alive(g, sA).length, nB = alive(g, sB).length;
    res.push({ seed, flip, t: r1(g.t), win: nA && !nB ? 0 : nB && !nA ? 1 : -1, left: [value(g, sA), value(g, sB)], dmg: [sum(S.a6.dmg[sA]), sum(S.a6.dmg[sB])], dmgBy: [Object.assign({}, S.a6.dmg[sA]), Object.assign({}, S.a6.dmg[sB])], bw: S.x6.bw, bwRaw: S.x6.bwRaw });
  }
  const w0 = res.filter(r => r.win === 0).length, w1 = res.filter(r => r.win === 1).length, med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }, avg = f => r0(res.reduce((a, r) => a + f(r), 0) / res.length);
  return { res, w0, w1, draw: res.length - w0 - w1, t: med(res.map(r => r.t)), left0: avg(r => r.left[0]), left1: avg(r => r.left[1]), dmg0: avg(r => r.dmg[0]), dmg1: avg(r => r.dmg[1]), bw: avg(r => r.bw), bwRaw: avg(r => r.bwRaw) };
}
const fmt = f => [`${f.w0}-${f.w1}${f.draw ? '-' + f.draw : ''}`, f.t, f.left0, f.left1];

const R = {};
// ---- R1: Leviathan damage per second, single target and groups, b4b off (v2.86's P10 carpet) and on (bombing runs) ----
R.R1 = () => {
  say('### R1. Leviathan damage per second (one Leviathan, unopposed: the target side does not act; targets made unkillable to measure a steady rate over 90 s)');
  const rows = [];
  const tg = [['one Tank', [['tank', 1]]], ['6 Tanks, packed', [['tank', 6]]], ['12 Marines, packed', [['rifle', 12]]], ['one Refinery (building)', 'bld']];
  for (const [nm, list] of tg) {
    const row = [nm];
    for (const b4b of [false, true]) {
      const ds = [];
      for (const seed of SEEDS.slice(0, 3)) {
        const g = game(['lastfist', 'lastfist'], { b4b }, seed); g.sides[1].hush = true;
        S.rangeUnit(g, 0, 'leviathan', 450, 0);
        if (list === 'bld') { const b = S.rangeBuilding(g, 1, 'lastfist', 'refinery', 750, 0); b.hp = b.maxHp = 1e6; }
        else for (const [t, n] of list) tough(place(g, 1, t, 750, 0, n));
        S.rangeMode(g, 0, 'attack');
        run(g, 15); const d0 = S.a6.dmg[0].leviathan || 0; run(g, 90); ds.push(((S.a6.dmg[0].leviathan || 0) - d0) / 90);
      }
      row.push(r1(ds.reduce((a, b) => a + b, 0) / ds.length));
    }
    row.push(r2(row[2] / row[1]));
    rows.push(row);
  }
  table(['target', 'b4b off (P10) dmg/s', 'b4b on (runs) dmg/s', 'on / off'], rows);
  J.R1 = rows;
};
// ---- R2: Sovereign time to kill each faction's HQ (T1 and T3) and a mid-size building; references ----
R.R2 = () => {
  say('### R2. Astral Sovereign: time to kill a building (one attacker, the building\'s side does not act: no HQ gun, no repair; seconds from the start, 1 seed: the beam has no random part)');
  const rows = [];
  const kill = (att, fac, role, tier, rw, hush = true) => {
    const g = game([S.UDEF[att].fac || 'lastfist', fac], rw, 11); g.sides[1].hush = hush;
    const b = S.rangeBuilding(g, 1, fac, role, 820, 0);
    if (tier > 1) { const d = S.bdOf(b); b.tier = tier; b.maxHp = b.hp = d.hp * S.hpMul(d, tier); if (b.maxShp) b.maxShp = b.shp = d.shp * S.hpMul(d, tier); }
    const u = S.rangeUnit(g, 0, att, 820 - Math.min(300, S.rwD(g, att).range + 40), 0);
    S.rangeMode(g, 0, 'attack');
    run(g, 600, () => b.hp <= 0 || u.hp <= 0);
    return b.hp <= 0 ? r0(g.t) : u.hp <= 0 ? 'died' : '>600';
  };
  for (const fac of F) for (const [role, tier, nm] of [['hq', 1, 'HQ T1'], ['hq', 3, 'HQ T3'], ['barracks', 1, 'Barracks-role T1'], ['turret', 1, 'Turret-role T1']]) {
    rows.push([`${FN[fac]} ${nm}`, kill('sovereign', fac, role, tier, { b4b: false }), kill('sovereign', fac, role, tier, {}), kill('leviathan', fac, role, tier, {}), kill('worldrender', fac, role, tier, {}), kill('titan', fac, role, tier, {}), kill('worldbreaker', fac, role, tier, {})]);
  }
  table(['building', 'Sovereign b4b off (P12)', 'Sovereign b4b on (beam)', 'Leviathan', 'Worldrender', 'Titan', 'Worldbreaker'], rows);
  // the HQ firing back (T1 and T3 guns)
  const rows2 = [];
  for (const fac of F) for (const tier of [1, 3]) rows2.push([`${FN[fac]} HQ T${tier}, its gun firing`, kill('sovereign', fac, 'hq', tier, {}, false), kill('leviathan', fac, 'hq', tier, {}, false), kill('titan', fac, 'hq', tier, {}, false)]);
  table(['building', 'Sovereign', 'Leviathan', 'Titan'], rows2);
  J.R2 = { rows, rows2 };
};
// ---- R3: the all-Shardling rush (a real match: rush bot vs the Hard AI), b3b off and on ----
R.R3 = () => {
  const { runMatch } = require('./match');
  say('### R3. All-Shardling rush (audit/sim/strat.js rush opening for the Axiarchs: two Genesis Gates, Shardlings nonstop until its attack is over, then the timing branch) against the Hard AI, Classic, seeds 1-10, to 20:00');
  const rows = [];
  for (const foe of F) for (const b3b of [false, true]) {
    const rs = [];
    for (let seed = 1; seed <= 10; seed++) {
      const m = runMatch({ seed, sides: [{ faction: 'axiarchs', bot: 'strat', botOpts: { opener: 'rush' } }, { faction: foe }], diff: 'hard', maxT: 1200, sample: 600, code: `REWORK.b3b = ${b3b};` });
      const tr = m.sides[0].trained, other = Object.keys(tr).filter(t => t !== 'shardling');
      rs.push({ w: m.winner, t: m.t, shard: tr.shardling || 0, other: other.reduce((a, t) => a + tr[t], 0), early: m.winner === 0 && m.t <= 480 });
    }
    const w = rs.filter(r => r.w === 0), l = rs.filter(r => r.w === 1), med = a => a.length ? a.map(r => r.t).sort((x, y) => x - y)[Math.floor(a.length / 2)] : '-';
    const mmss = t => t === '-' ? '-' : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    rows.push([`vs ${FN[foe]} Hard`, b3b ? 'on' : 'off', `${w.length}-${l.length}-${rs.length - w.length - l.length}`, rs.filter(r => r.early).length, mmss(med(w)), mmss(med(l)), rs.filter(r => r.w === 0 && r.other === 0).length]);
    J['R3_' + foe + b3b] = rs;
  }
  table(['opponent', 'b3b (parry)', 'rush W-L-D', 'won by 8:00', 'median win time', 'median loss time', 'won with Shardlings only'], rows);
};
// ---- R4: ranged armies against an Axiarch front with and without Bastions, b3b off and on ----
// The Axiarch front holds (an attacker walks into it). For each attacking mix: the outcome at a fixed size, and the
// smallest multiple of the mix (×0.5 steps up to ×4) that wins at least 6 of 10 against each front: the cost to break it.
R.R4 = () => {
  say(`### R4. Ranged armies attacking a held Axiarch front, with and without Bastions (2 Bastions + 4 Lancers = 1350 against 8 Lancers = 1320; ${ORI}; "absorbed" = barrier HP lost, "blocked" = raw damage of the shots and beams it stopped; "cost to break" = the smallest multiple of the mix, in 0.5 steps, that wins 6+ of 10)`);
  const AXwith = [['bastion', 2, 820], ['lancer', 4, 860]], AXno = [['lancer', 8, 860]];
  const armies = [['Last Fist: Marines + Heavies (5:2)', 'lastfist', [['rifle', 5, 420], ['heavy', 2, 380]]], ['Last Fist: Artillery + Marines (1:2)', 'lastfist', [['artillery', 1, 360], ['rifle', 2, 440]]],
    ['Last Fist: Tanks + Marines (1:2)', 'lastfist', [['tank', 1, 400], ['rifle', 2, 440]]], ['Bloomhost: Spitters', 'bloomhost', [['spitter', 5, 420]]], ['Bloomhost: Skitterlings (broods)', 'bloomhost', [['skitterling', 12, 440]]], ['Axiarchs: Lancers', 'axiarchs', [['lancer', 3, 420]]]];
  const scale = (A, k) => A.map(([t, n, u]) => [t, Math.max(1, Math.round(n * k)), u]), V = A => A.reduce((a, [t, n]) => a + n * cost(t), 0);
  const brk = (fac, rw, A, D) => { for (let k = 0.5; k <= 4; k += 0.5) { const f = fight([fac, 'axiarchs'], rw, scale(A, k), D, { bHold: true }); if (f.w0 >= 6) return { v: V(scale(A, k)), f }; } return { v: '>' + V(scale(A, 4)), f: null }; };
  const rows = [];
  for (const [nm, fac, A] of armies) for (const b3b of [false, true]) {
    const w = brk(fac, { b3b }, A, AXwith), n = brk(fac, { b3b }, A, AXno);
    rows.push([nm, b3b ? 'on' : 'off', w.v, w.f ? w.f.bw : '-', w.f ? w.f.bwRaw : '-', n.v, typeof w.v === 'number' && typeof n.v === 'number' ? r2(w.v / n.v) : '-']);
  }
  table(['attacking mix', 'b3b', 'cost to break 2 Bastions + 4 Lancers', 'barrier absorbed (that fight)', 'blocked (raw)', 'cost to break 8 Lancers', 'Bastion front / Lancer front'], rows);
  J.R4 = rows;
};
// ---- R5: Leapers against each faction's vehicles, cost for cost, b3a off and on (and Skitterlings for reference) ----
R.R5 = () => {
  say(`### R5. Leapers against vehicles, cost for cost (both sides attack; ${ORI}; W-L for the Leapers; values in credits + energy)`);
  const rows = [];
  const vs = [['lastfist', 'tank', 4], ['lastfist', 'titan', 2], ['lastfist', 'hydra', 2], ['bloomhost', 'bulwark', 9], ['axiarchs', 'bastion', 4], ['axiarchs', 'eventide', 2]];
  for (const [fac, veh, n] of vs) {
    const V = n * cost(veh), nl = Math.round(V / cost('leaper')), ns = Math.round(V / 30);
    const row = [`${n} ${S.PLURAL ? veh : veh} (${V})`];
    for (const b3a of [false, true]) { const f = fight(['bloomhost', fac], { b3a }, [['leaper', nl, 480]], [[veh, n, 800]]); row.push(`${nl} Leapers: ${f.w0}-${f.w1}${f.draw ? '-' + f.draw : ''}`, f.t, f.left0, f.left1); }
    const fs_ = fight(['bloomhost', fac], {}, [['skitterling', ns, 480]], [[veh, n, 800]]); row.push(`${ns} Skitterlings: ${fs_.w0}-${fs_.w1}${fs_.draw ? '-' + fs_.draw : ''}`, fs_.left0, fs_.left1);
    rows.push(row);
  }
  table(['vehicles', 'b3a off', 'time', 'Leapers left', 'vehicles left', 'b3a on', 'time', 'Leapers left', 'vehicles left', 'reference (b5b broods)', 'Skitterlings left', 'vehicles left'], rows);
  J.R5 = rows;
};
// ---- R6: the Titan's reach before and after (b2b off: range 190, planted +90; on: 160, breach plant at 100) ----
R.R6 = () => {
  say('### R6. Titan reach and fights, b2b off (v2.82: range 190, plants for +90 = 280 against buildings) and on (160; plants within 100 of a building, ×2.5 to it; infantry cover)');
  const rows = [];
  // a) engagement distance against a stationary Tank and a Turret: where its first hit lands from
  for (const b2b of [false, true]) {
    for (const [nm, fac, role] of [['Last Fist Turret', 'lastfist', 'turret'], ['Bloomhost Maw', 'bloomhost', 'turret'], ['Axiarch Null Lance', 'axiarchs', 'turret'], ['Last Fist HQ T1 (gun firing)', 'lastfist', 'hq']]) {
      const g = game(['lastfist', fac], { b2b }, 11);
      const b = S.rangeBuilding(g, 1, fac, role, 900, 0), t = S.rangeUnit(g, 0, 'titan', 400, 0);
      S.rangeMode(g, 0, 'attack');
      let first = null; const d0 = () => sum(S.a6.dmgB[0]);
      run(g, 300, () => { if (first == null && d0() > 0) first = r0(S.effDist(t, b)); return b.hp <= 0 || t.hp <= 0; });
      rows.push([b2b ? 'on' : 'off', nm, first ?? '-', b.hp <= 0 ? r0(g.t) : t.hp <= 0 ? 'Titan died' : '>300', r0(Math.max(0, t.hp)) + ' / ' + t.maxHp]);
    }
  }
  table(['b2b', 'target', 'distance at first hit', 'time to kill (s)', 'Titan HP left'], rows);
  // b) Titan + infantry against ranged armies (cover), cost for cost
  const rows2 = [];
  const LF = [['titan', 1, 470], ['rifle', 10, 430]]; // 580 + 450 = 1030
  for (const [nm, fac, B] of [['11 Spitters (990)', 'bloomhost', [['spitter', 11, 820]]], ['6 Lancers (990)', 'axiarchs', [['lancer', 6, 820]]], ['3 Tanks (1095)', 'lastfist', [['tank', 3, 820]]]]) {
    const row = [nm];
    for (const b2b of [false, true]) { const f = fight(['lastfist', fac], { b2b }, LF, B); row.push(`${f.w0}-${f.w1}${f.draw ? '-' + f.draw : ''}`, f.t, f.left0, f.left1); }
    const f = fight(['lastfist', fac], {}, [['rifle', 23, 430]], B); row.push(`${f.w0}-${f.w1}${f.draw ? '-' + f.draw : ''}`, f.left0, f.left1);
    rows2.push(row);
  }
  table(['Titan + 10 Marines (1030) vs', 'b2b off W-L', 'time', 'LF left', 'foe left', 'b2b on W-L', 'time', 'LF left', 'foe left', 'reference: 23 Marines (1035) W-L', 'LF left', 'foe left'], rows2);
  J.R6 = { rows, rows2 };
};
// ---- R7: Artillery hit rate against stationary and moving targets, deploy and telegraph switches ----
R.R7 = () => {
  say('### R7. Artillery hit rate (2 Artillery at 300 from the targets, 120 s; a shell "hits" when it takes HP or shields off any enemy; targets unkillable; moving targets walk back and forth over 160, turning every 5 s)');
  const rows = [];
  for (const [nm, rw] of [['deploy off, telegraph off (v2.81)', { artDeploy: false, artTelegraph: false }], ['deploy on, telegraph off', { artTelegraph: false }], ['deploy off, telegraph on', { artDeploy: false }], ['deploy on, telegraph on (default)', {}]]) {
    const row = [nm];
    for (const [tt, mv] of [['rifle', false], ['rifle', true], ['tank', false], ['tank', true]]) {
      let sh = 0, hit = 0, dmg = 0;
      for (const seed of SEEDS.slice(0, 3)) {
        const g = game(['lastfist', 'lastfist'], rw, seed);
        const A = place(g, 0, 'artillery', 400, 0, 2), T = place(g, 1, tt, 700, 0, tt === 'rifle' ? 6 : 2); tough(T);
        S.rangeMode(g, 1, 'hold'); for (const a of A) a.po = { o: 'target', id: T[0].id, u: T[0].u, v: T[0].v };
        let k = 0;
        for (let i = 0; i < 120 * 60; i++) {
          if (mv && i % 300 === 0) { k++; S.command(g, 1, T.map(e => e.id), 'go', k % 2 ? 860 : 700, k % 2 ? 40 : -40); }
          if (i % 30 === 0) for (const a of A) if (!a.po || a.po.o !== 'target') a.po = { o: 'target', id: T[0].id, u: T[0].u, v: T[0].v };
          S.rangeStep(g); g.events.length = 0;
        }
        sh += S.x6.shells; hit += S.x6.shellHit; dmg += S.a6.dmg[0].artillery || 0;
      }
      row.push(`${r0(100 * hit / Math.max(1, sh))}% (${r0(sh / 3)}), ${r0(dmg / 3 / 120 * 60)}/min`);
    }
    rows.push(row);
  }
  table(['switches', 'vs 6 Marines, standing', 'vs 6 Marines, moving', 'vs 2 Tanks, standing', 'vs 2 Tanks, moving'], rows);
  say('(cells: shells that hit, the shells fired per run in brackets, damage per minute of the pair)'); say('');
  J.R7 = rows;
};
// ---- R8: Skitterling speed with surge, creep and Frenzy Bloom against each faction's fastest units ----
R.R8 = () => {
  say('### R8. Ground speed over 300 of open lane (measured in the SIM: units ordered to walk; units per second)');
  const rows = [];
  const speed = (type, n, o = {}) => {
    const g = game([S.UDEF[type].fac || 'lastfist', 'lastfist'], o.rw || {}, 11);
    if (o.creep) { for (const u of [300, 450, 600, 750, 900]) S.rangeBuilding(g, 0, 'bloomhost', 'refinery', u, -70); run(g, 30); }
    const us = place(g, 0, type, 360, 0, n);
    S.command(g, 0, us.map(e => e.id), 'go', 1000, 0);
    const lead = us[0]; let t0 = null, x0 = 0;
    for (let i = 0; i < 60 * 60; i++) {
      if (o.frenzy) for (const e of us) e.frzT = g.t + 1;
      S.rangeStep(g); g.events.length = 0;
      if (t0 == null && lead.u >= 450) { t0 = g.t; x0 = lead.u; }
      if (t0 != null && lead.u >= 750) return r1((lead.u - x0) / (g.t - t0));
    }
    return '-';
  };
  for (const [nm, t, n, o] of [['Skitterling, alone (b5b off: v2.87)', 'skitterling', 1, { rw: { b5b: false } }], ['Skitterling, alone', 'skitterling', 1, {}], ['Skitterling, pack of 12 (full surge)', 'skitterling', 12, {}],
    ['Skitterling, pack of 12 on creep', 'skitterling', 12, { creep: true }], ['Skitterling, pack of 12 on creep + Frenzy Bloom', 'skitterling', 12, { creep: true, frenzy: true }], ['Skitterling, alone, creep + Frenzy Bloom, b5b off', 'skitterling', 1, { creep: true, frenzy: true, rw: { b5b: false } }],
    ['Leaper, pack of 12, creep + Frenzy Bloom', 'leaper', 12, { creep: true, frenzy: true }], ['Marine (Last Fist fastest ground)', 'rifle', 1, {}], ['Flame Tank', 'flame', 1, {}], ['Shardling (Axiarch fastest ground)', 'shardling', 1, {}], ['Riftstalker', 'riftstalker', 1, {}]])
    rows.push([nm, S.rwD(S.rangeGame({}), t).speed, speed(t, n, o)]);
  table(['unit', 'listed speed', 'measured'], rows);
  say(`Fastest aircraft for comparison (listed): Recon Drone ${S.UDEF.drone.speed}, Interceptor ${S.UDEF.interceptor.speed}, Needlewing ${S.UDEF.needlewing.speed}, Razorwing ${S.UDEF.razorwing.speed}, Prismwing ${S.UDEF.prismwing.speed}, Wraithwing ${S.UDEF.wraithwing.speed} (plus hops). Creep ×${S.CREEP.speed}, surge up to +${S.SURGE.max * 100}%, Frenzy Bloom ×${S.ABIL.frenzy.speed}.`); say('');
  J.R8 = rows;
};
// ---- R9: Spitter anti-air, cost for cost, b5b off and on ----
R.R9 = () => {
  say(`### R9. Spitters against aircraft, cost for cost (both sides attack; ${ORI}); the Hydra and Lancer as other factions' anti-air for reference`);
  const rows = [];
  const air = [['lastfist', 'aircraft', 3], ['lastfist', 'interceptor', 5], ['lastfist', 'leviathan', 1], ['bloomhost', 'razorwing', 5], ['bloomhost', 'broodtyrant', 2], ['axiarchs', 'wraithwing', 3], ['axiarchs', 'prismwing', 7], ['axiarchs', 'shardstorm', 2], ['axiarchs', 'voidcarrier', 2]];
  for (const [fac, t, n] of air) {
    const V = n * cost(t), ns = Math.round(V / cost('spitter'));
    const row = [`${n} ${t} (${V})`];
    for (const b5b of [false, true]) {
      const f = fight(['bloomhost', fac], { b5b }, [['spitter', ns, 480]], [[t, n, 800]]);
      const dpc = r1(f.res.reduce((a, r) => a + (r.dmgBy[0].spitter || 0) / r.t, 0) / f.res.length / (ns * cost('spitter')) * 1000);
      row.push(`${ns}: ${f.w0}-${f.w1}${f.draw ? '-' + f.draw : ''}`, f.t, f.left0, f.left1, dpc);
    }
    const nh = Math.max(1, Math.round(V / cost('hydra'))), fh = fight(['lastfist', fac], {}, [['hydra', nh, 480]], [[t, n, 800]]);
    const nl = Math.round(V / cost('lancer')), fl = fight(['axiarchs', fac], {}, [['lancer', nl, 480]], [[t, n, 800]]);
    row.push(`${nh} Hydra: ${fh.w0}-${fh.w1}${fh.draw ? '-' + fh.draw : ''}, ${fh.t} s, ${fh.left0} left`, `${nl} Lancers: ${fl.w0}-${fl.w1}${fl.draw ? '-' + fl.draw : ''}, ${fl.t} s, ${fl.left0} left`);
    rows.push(row);
  }
  table(['aircraft', 'b5b off: Spitters W-L', 'time', 'Spitters left', 'air left', 'Spitter dmg/s per 1000 spent', 'b5b on: Spitters W-L', 'time', 'Spitters left', 'air left', 'Spitter dmg/s per 1000 spent', 'Hydras (Last Fist)', 'Lancers (Axiarchs)'], rows);
  J.R9 = rows;
};
// ---- R10: early fights the parry and broods change: Shardlings against each faction's tier-1 infantry, cost for cost ----
R.R10 = () => {
  say(`### R10. Shardlings against tier-1 armies, cost for cost (about 800 each side; both attack; ${ORI}), b3b off and on; and broods against them, b5b off and on`);
  const rows = [];
  for (const [nm, fac, B] of [['18 Marines (810)', 'lastfist', [['rifle', 18, 800]]], ['27 Skitterlings, b5b on (810)', 'bloomhost', [['skitterling', 27, 800]]], ['5 Bulwarks (825)', 'bloomhost', [['bulwark', 5, 800]]], ['2 Tanks + 2 Marines (820)', 'lastfist', [['tank', 2, 800], ['rifle', 2, 800]]]]) {
    const row = [nm];
    for (const b3b of [false, true]) { const f = fight(['axiarchs', fac], { b3b }, [['shardling', 10, 480]], B); row.push(`${f.w0}-${f.w1}${f.draw ? '-' + f.draw : ''}`, f.t, f.left0, f.left1); }
    rows.push(row);
  }
  table(['10 Shardlings (800) vs', 'b3b off W-L', 'time', 'Shardlings left', 'foe left', 'b3b on W-L', 'time', 'Shardlings left', 'foe left'], rows);
  const rows2 = [];
  for (const [nm, fac, B] of [['18 Marines (810)', 'lastfist', [['rifle', 18, 800]]], ['10 Shardlings (800)', 'axiarchs', [['shardling', 10, 800]]], ['2 Tanks + 2 Marines (820)', 'lastfist', [['tank', 2, 800], ['rifle', 2, 800]]], ['6 Lancers (990)', 'axiarchs', [['lancer', 6, 800]]]]) {
    const row = [nm];
    const V = B.reduce((a, [t, n]) => a + n * cost(t), 0);
    for (const b5b of [false, true]) { const n = Math.round(V / (b5b ? 30 : 60)); const f = fight(['bloomhost', fac], { b5b }, [['skitterling', n, 480]], B); row.push(`${n}: ${f.w0}-${f.w1}${f.draw ? '-' + f.draw : ''}`, f.t, f.left0, f.left1); }
    rows2.push(row);
  }
  table(['Skitterlings (same cost) vs', 'b5b off (60 each) W-L', 'time', 'Skitterlings left', 'foe left', 'b5b on (30 each, broods) W-L', 'time', 'Skitterlings left', 'foe left'], rows2);
  J.R10 = { rows, rows2 };
};

const want = process.argv.slice(2).filter(a => /^R\d+$/.test(a)), list = want.length ? want : Object.keys(R);
say(`Batch 6a targeted measurements on ${S.VERSION} (${new Date().toISOString().slice(0, 10)}); seeds ${SEEDS.join(', ')} unless a table says otherwise.`); say('');
for (const k of list) { const t0 = Date.now(); R[k](); console.error(`${k}: ${((Date.now() - t0) / 1000).toFixed(0)} s`); }
if (!want.length) { const dir = OUTDIR || path.join(__dirname, '..', 'logs-p1', 'audit6a-v291'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'range.txt'), out.join('\n') + '\n'); fs.writeFileSync(path.join(dir, 'range.json'), JSON.stringify(J)); }
