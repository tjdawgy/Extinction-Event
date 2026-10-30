// Match log and post-match report (v2.9): what is recorded, that every number matches the game exactly, unit
// grouping (60 s or 10 units), the size cap, the condensed timeline and copied text, endings, saves. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');
const { playMatch } = require('./bots');
const { CALIBRATED } = require('./rush-variants-list');

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const sim = loadSim({ random: mulberry(99) });
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
const same = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m); // arrays from the SIM sandbox are another realm's
const META = { version: sim.VERSION, diff: 'Normal', persona: 'The Turtle', result: 'Victory, enemy HQ destroyed' };

// Every recorded number must agree with the game itself
function checkExact(g, label) {
  const L = g.log, T = L.tot;
  for (const s of [0, 1]) {
    const t = T[s], sd = g.sides[s], spent = i => Object.values(t.spent).reduce((a, b) => a + b[i], 0);
    // money is conserved: start + earned + sales + salvage (v2.30) - spent = what is left
    assert.ok(Math.abs(300 + t.earn[0] + t.sold[0] + t.salv - spent(0) - sd.res.c) < 1e-6, `${label} side ${s} credits: ${300 + t.earn[0] + t.sold[0] + t.salv - spent(0)} vs ${sd.res.c}`);
    assert.strictEqual(t.salv, sd.salv.tot, `${label} side ${s} salvage`);
    assert.ok(Math.abs(60 + t.earn[1] + t.sold[1] + (t.salvE || 0) - spent(1) - sd.res.e) < 1e-6, `${label} side ${s} energy`); // + Salvage Yard energy (v2.32)
    assert.strictEqual(sum(t.lost), sd.stats.lost, `${label} side ${s} units lost`);
    assert.strictEqual(sum(t.killed), sd.stats.kills, `${label} side ${s} kills`);
    const of = (code, k) => L.ev.filter(e => e[1] === s && e[2] === code && (k === undefined || e[3] === k));
    for (const k of Object.keys(sim.UDEF)) {
      assert.strictEqual(of('T', k).reduce((a, e) => a + e[4], 0), t.trained[k] || 0, `${label} side ${s} ${k} trained`);
      assert.strictEqual(of('K', k).reduce((a, e) => a + e[4], 0), t.lost[k] || 0, `${label} side ${s} ${k} lost`);
    }
    assert.strictEqual(of('F').length, sum(t.bBuilt), `${label} buildings finished`);
    assert.strictEqual(of('D').length, sum(t.bLost), `${label} buildings destroyed`);
    assert.strictEqual(of('V').length, t.bUp, `${label} upgrades`);
    assert.strictEqual(of('S').length, t.bSold, `${label} sold`);
    assert.strictEqual(of('N').length, t.nodeCap, `${label} nodes captured`);
    assert.strictEqual(of('L').length, t.nodeLost, `${label} nodes lost`);
    for (const k of ['shield', 'strike', 'repair']) {
      const A = of('A', k);
      assert.strictEqual(A.length, t.ab[k][0], `${label} ${k} uses`);
      assert.ok(Math.abs(A.reduce((a, e) => a + e[4], 0) - t.ab[k][1]) <= A.length, `${label} ${k} effect: casts add up to the total (each rounded)`);
      if (k === 'strike') assert.strictEqual(A.reduce((a, e) => a + e[5], 0), t.ab.strike[2], `${label} strike kills`);
    }
  }
  assert.ok(L.ev.length <= sim.LOG_CAP, `${label}: ${L.ev.length} events`);
  for (let i = 1; i < L.ev.length; i++) assert.ok(L.ev[i][0] >= L.ev[i - 1][0], `${label}: events in time order`);
  // unit groups: 60 s or 10 units at most, unless the cap had to merge them
  if (!L.merged) for (const e of L.ev) if (e[2] === 'T' || e[2] === 'K') assert.ok(e[4] <= sim.LOG_N && e[5] - e[0] <= sim.LOG_SPAN, `${label}: group ${JSON.stringify(e)}`);
  // the condensed timeline keeps every key event and every unit, within the line target
  for (const s of [0, 1]) {
    const lines = sim.logLines(g, s), keys = L.ev.filter(e => (e[1] === s || e[1] === -1) && e[2] !== 'T' && e[2] !== 'K').length;
    const paired = lines.filter(l => l.paired), of = c => L.ev.filter(e => e[1] === s && e[2] === c).length;
    assert.strictEqual(lines.filter(l => l.key).length + paired.length, keys, `${label} side ${s}: every key event listed (a start and its finish share a line)`);
    assert.strictEqual(paired.filter(l => l.code === 'B').length + lines.filter(l => l.code === 'F').length, of('F'), `${label}: every finished building accounted for`);
    assert.strictEqual(paired.filter(l => l.code === 'U').length + lines.filter(l => l.code === 'V').length, of('V'), `${label}: every finished upgrade accounted for`);
    for (const l of paired) assert.match(l.txt, l.code === 'B' ? /^[A-Z][\w ]+ \d\d:\d\d → \d\d:\d\d$/ : /^[A-Z][\w ]+ T[23]( · [A-Z][\w ]+)? \d\d:\d\d → \d\d:\d\d$/, `${label}: ${l.txt}`);
    for (const l of paired) assert.ok(l.t1 >= l.t, `${label}: finish after start`);
    assert.ok(lines.length <= Math.max(sim.LINE_MAX, keys + 20), `${label} side ${s}: ${lines.length} lines, ${keys} key events`);
    for (const k of Object.keys(sim.UDEF)) assert.strictEqual(lines.filter(l => l.code === 'T' && l.type === k).reduce((a, l) => a + l.n, 0), L.tot[s].trained[k] || 0, `${label} ${k} in lines`);
    for (let i = 1; i < lines.length; i++) assert.ok(lines[i].t >= lines[i - 1].t, `${label}: lines in time order`);
  }
  // copied text: header, then one chronological list, each line tagged; same lines as the screen
  const txt = sim.logText(g, META).split('\n'), at = txt.indexOf('TIMELINE'), tl = txt.slice(at + 1).filter(l => !l.startsWith('('));
  assert.ok(txt[0].includes(`v${sim.VERSION}`) && txt[0].includes('Normal') && txt[0].includes('The Turtle') && txt[1].includes(META.result) && txt[1].includes(sim.mmss(g.t)), txt.slice(0, 2).join(' / '));
  for (const l of tl) assert.match(l, /^\d\d:\d\d \[(ME|ENEMY|ALL)\] \S/);
  const raw = s => sim.logLines(g, s, false), glob = raw(0).filter(l => ['W', 'X', 'E'].includes(l.code)).length;
  assert.strictEqual(tl.length, raw(0).length + raw(1).length - glob, `${label}: copied lines = every line, unit groups never widened`);
  for (const l of tl) { const m = l.match(/×(\d+), (\d\d):(\d\d)–(\d\d):(\d\d)$/); if (m) assert.ok(+m[1] <= 10 && (m[4] * 60 + +m[5]) - (m[2] * 60 + +m[3]) <= 61, `${label}: copied group within 60 s / 10 units: ${l}`); }
  for (let i = 1; i < tl.length; i++) assert.ok(tl[i].slice(0, 5) >= tl[i - 1].slice(0, 5), `${label}: copied text in time order`);
}

test('unit grouping: a group closes after 60 s or 10 units or a 45 s pause, so nonstop production shows its pace', () => {
  const g = sim.newGame('normal'), L = g.log, at = t => { g.t = t; };
  for (let i = 0; i < 25; i++) { at(120 + i * 4); sim.lgUnit(g, 0, 'T', 'rifle'); } // one every 4 s: groups of 10 (36 s each)
  for (let i = 0; i < 8; i++) { at(300 + i * 9); sim.lgUnit(g, 0, 'T', 'tank'); } // one every 9 s: closes at 60 s
  at(420); sim.lgUnit(g, 0, 'T', 'tank'); at(480); sim.lgUnit(g, 0, 'T', 'tank'); // a pause over 45 s
  const T = L.ev.filter(e => e[2] === 'T').map(e => [e[3], e[4], e[0], e[5]]);
  same(T.map(x => [x[0], x[1]]), [['rifle', 10], ['rifle', 10], ['rifle', 5], ['tank', 7], ['tank', 1], ['tank', 1], ['tank', 1]]);
  same(T.slice(0, 2).map(x => [x[2], x[3]]), [[120, 156], [160, 196]]);
  assert.strictEqual(sim.logEvText(L.ev[0], true), 'Rifleman ×10, 02:00–02:36');
  assert.strictEqual(sim.logEvText(L.ev[1], true), 'Rifleman ×10, 02:40–03:16');
});

test('a build or upgrade and its finish share one line, matched by building (two at once, an unfinished one, an old log without ids)', () => {
  const g = sim.newGame('normal'), L = g.log, at = t => { g.t = t; };
  at(2); sim.lg(g, 0, 'B', 'refinery', 7); at(5); sim.lg(g, 0, 'B', 'refinery', 9); at(14); sim.lg(g, 0, 'F', 'refinery', 9); at(16); sim.lg(g, 0, 'F', 'refinery', 7);
  at(310); sim.lg(g, 0, 'U', 'refinery', 2, 7); at(322); sim.lg(g, 0, 'V', 'refinery', 2, 7);
  at(400); sim.lg(g, 0, 'B', 'turret', 12); at(405); sim.lg(g, 0, 'D', 'turret', 1, 1);
  at(500); sim.lg(g, 0, 'B', 'reactor'); at(512); sim.lg(g, 0, 'F', 'reactor'); // saved before ids were recorded
  same(sim.logLines(g, 0).map(l => l.txt), ['Refinery 00:02 → 00:16', 'Refinery 00:05 → 00:14', 'Refinery T2 05:10 → 05:22', 'Turret started (not finished)', 'Turret destroyed', 'Reactor 08:20 → 08:32']);
  assert.match(sim.logText(g, META), /\n00:02 \[ME\] Refinery 00:02 → 00:16\n00:05 \[ME\] Refinery 00:05 → 00:14\n05:10 \[ME\] Refinery T2 05:10 → 05:22\n/);
});

test('the log is capped at 1200 events; unit groups never grow past 60 s / 10 units, and key events are kept', () => {
  const g = sim.newGame('normal'), L = g.log;
  for (let i = 0; i < 2000; i++) { g.t = i * 50; if (i % 3 === 0) sim.lg(g, i % 2, 'B', 'refinery'); else sim.lgUnit(g, i % 2, 'T', i % 4 < 2 ? 'rifle' : 'heavy'); }
  assert.ok(L.ev.length <= sim.LOG_CAP, `${L.ev.length} events`);
  assert.strictEqual(L.ev.filter(e => e[2] === 'B').length, 667, 'every key event kept');
  assert.ok(L.dropped > 0, 'the oldest unit lines go first');
  for (const e of L.ev) if (e[2] === 'T') assert.ok(e[4] <= 10 && e[5] - e[0] <= 60, JSON.stringify(e));
  // neighbouring groups that still fit are joined before anything is dropped
  const h = sim.newGame('normal'), M = h.log;
  for (let i = 0; i < 1300; i++) { h.t = i; if (i % 2) sim.lg(h, 0, 'G', 'all'); else { sim.lgUnit(h, 1, 'T', 'rifle'); M.open = {}; } } // each unit its own group
  assert.ok(M.ev.length <= sim.LOG_CAP && M.merged > 0);
  for (const e of M.ev) if (e[2] === 'T') assert.ok(e[4] <= 10 && e[5] - e[0] <= 60, JSON.stringify(e));
});

test('full matches: every recorded number matches the game (AI personalities, rush, turtle and eco bots)', () => {
  for (const [label, run] of [
    ['AI turtle vs normal', () => { const g = sim.newGame('normal', { autoPlayer: true, autoDiff: 'hard', persona: 'turtle', autoPersona: 'aggressor' }); for (let i = 0; i < 30 * 1800 && !g.over; i++) sim.update(g, 1 / 30); return g; }],
    ['AI trickster vs economist', () => { const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'trickster', autoPersona: 'economist' }); for (let i = 0; i < 30 * 1800 && !g.over; i++) sim.update(g, 1 / 30); return g; }],
    ['calibrated rush', () => playMatch(sim, 'normal', 'rushx', { botOpts: CALIBRATED }).g],
    ['turtle bot', () => playMatch(sim, 'normal', 'turtle').g],
    ['eco bot', () => playMatch(sim, 'hard', 'turtle', { botOpts: { plan: ['refinery', 'refinery', 'barracks', 'refinery', 'reactor', 'factory', 'habitat', 'techlab'] } }).g],
  ]) {
    const g = run();
    assert.ok(g.over, label);
    checkExact(g, label);
    const E = g.log.ev[g.log.ev.length - 1];
    same([E[2], E[3], E[4]], ['E', g.result.how, g.winner], `${label}: the end is the last event`);
    if (g.result.how === 'hq') assert.ok(g.log.ev.some(e => e[2] === 'D' && e[3] === 'hq' && e[1] === 1 - g.winner), `${label}: the fallen HQ is recorded`);
    for (const m of sim.logMoments(g)) assert.ok(m.t >= 0 && m.t <= g.t + 0.1, `${label}: moment in the match`);
    assert.ok(sim.logLessons(g).length >= 1);
  }
});

test('endings: HQ kill, the Extinction Event, a score decision and a draw are each recorded', () => {
  const quiet = t => { const g = sim.newGame('normal'); for (const s of [0, 1]) { g.sides[s].aiT = 1e9; g.sides[s].stance = 'hold'; } g.t = t; g.log.next = Math.ceil(t / 15) * 15; return g; };
  let g = quiet(600); sim.kill(g, g.sides[1].hq, 0); sim.update(g, 1 / 30);
  same(g.log.ev.slice(-2).map(e => e[2]), ['D', 'E']); assert.strictEqual(g.log.ev.at(-1)[3], 'hq');
  g = quiet(1165); step(g, 40); sim.kill(g, g.sides[1].hq, -1); step(g, 5.5);
  same(g.log.ev.filter(e => e[1] === -1).map(e => e[2]), ['W', 'X', 'E']); assert.strictEqual(g.log.ev.at(-1)[3], 'storm');
  assert.ok(g.log.ev.some(e => e[2] === 'D' && e[3] === 'hq' && e[5] === -1), 'destroyed by the storm');
  assert.ok(g.log.tot[0].storm > 0 && g.log.tot[1].storm > 0, 'storm damage recorded');
  g = quiet(1500); sim.tieBreak(g, 'limit'); assert.strictEqual(g.log.ev.at(-1)[3], 'draw');
  assert.strictEqual(sim.logLines(g, 0).at(-1).txt, 'Match ended: mutual extinction');
  g = quiet(1500); g.sides[0].hq.hp -= 1; sim.tieBreak(g, 'limit'); same(g.log.ev.at(-1).slice(2), ['E', 'score', 1]);
  assert.strictEqual(sim.logLines(g, 1).at(-1).txt, 'Match ended: you lost', 'always the player\'s view');
});

test('save and resume keep the log; a v10 save starts an empty log and the report says what was missed', () => {
  const g = sim.newGame('hard', { autoPlayer: true, autoDiff: 'normal', persona: 'economist' });
  step(g, 300);
  assert.ok(!g.over, 'saved mid-match');
  const before = JSON.stringify(g.log), g2 = sim.deserialize(sim.serialize(g, {}));
  assert.strictEqual(JSON.stringify(g2.log), before, 'identical after loading');
  step(g2, 60);
  assert.ok(g2.log.ev.length > JSON.parse(before).ev.length, 'keeps recording after loading');
  const o = JSON.parse(sim.serialize(g, {})); o.v = 10; delete o.log;
  const g3 = sim.deserialize(JSON.stringify(o));
  assert.ok(g3.log && g3.log.from === g.t && g3.log.ev.length === 0);
  step(g3, 30);
  assert.match(sim.logText(g3, META), /Recorded from 05:00 \(resumed from an older save\); earlier events are not included\./);
});
