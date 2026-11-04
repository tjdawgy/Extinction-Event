// v2.45: description texts never quote a hard-coded stat number. Every number a unit, building, upgrade, ability or faction
// description shows is read from the data when the text is read (getters), so a changed stat changes its text too.
// Two checks: the source has no description literal with a digit (tier names T1-T3 aside), and the texts follow the data.
const test = require('node:test');
const assert = require('node:assert');
const { loadSim, readHtml } = require('./load-sim');

const SRC = readHtml();
const STR = String.raw`'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"`; // a plain quoted string (template strings are the live ones)
const digits = s => /\d/.test(s.replace(/\bT[1-3]\b/g, '')); // "T2 units" names a tier, not a stat
const NUMWORD = /\b(half|double|doubled|twice|triple|three|four|five|six|seven|eight|nine|ten)\b/i;

test('no description literal in the source quotes a hard-coded number', () => {
  const bad = []; let seen = 0, seenT = 0;
  // desc, txt, tip, overview and the faction mechanic's txt: one quoted string each
  for (const m of SRC.matchAll(new RegExp(String.raw`\b(desc|txt|tip|overview):\s*(${STR})`, 'g'))) { seen++; if (digits(m[2]) || NUMWORD.test(m[2])) bad.push(`${m[1]}: ${m[2]}`); }
  // tiers: [null, '...', '...', '...'] literals
  for (const m of SRC.matchAll(/\btiers:\s*\[null,([^\]]*)\]/g)) for (const s of m[1].match(new RegExp(STR, 'g')) || []) { seenT++; if (digits(s) || NUMWORD.test(s)) bad.push(`tiers: ${s}`); }
  assert.ok(seen > 100 && seenT > 20, `the scan found the literals (${seen} descriptions, ${seenT} tier texts)`);
  // UNIT_TIPS: the plain [strong, weak] entries (the getters build theirs from the data)
  const a = SRC.indexOf('const UNIT_TIPS = {'), b = SRC.indexOf('\n};\n', a), tips = SRC.slice(a, b);
  assert.ok(a > 0 && b > a, 'UNIT_TIPS found');
  for (const line of tips.split('\n')) { const t = line.trim(); if (t.startsWith('get ') || t.startsWith('//')) continue; for (const s of t.replace(/\/\/.*$/, '').match(new RegExp(STR, 'g')) || []) if (digits(s) || NUMWORD.test(s)) bad.push(`UNIT_TIPS: ${s}`); }
  assert.deepStrictEqual(bad, []);
});

test('every description text reads as words and numbers (nothing undefined)', () => {
  const sim = loadSim(), all = [];
  for (const f in sim.BDEFS) for (const k in sim.BDEFS[f]) { const d = sim.BDEFS[f][k]; all.push([`${f}.${k}.desc`, d.desc]); for (let t = 1; t <= 3; t++) all.push([`${f}.${k}.tiers[${t}]`, d.tiers[t]]); }
  for (const k in sim.UDEF) all.push([`UDEF.${k}.desc`, sim.UDEF[k].desc]);
  for (const S of [sim.TREES, sim.TREES_BH, sim.TREES_AX]) for (const b in S) for (const p in S[b]) S[b][p].steps.forEach((st, i) => { if (st) all.push([`${b}.${p}.${i}`, st.txt]); });
  for (const k in sim.ABIL) all.push([`ABIL.${k}`, sim.ABIL[k].tip]);
  for (const k in sim.FACTIONS) all.push([`FACTIONS.${k}`, sim.FACTIONS[k].overview], [`FACTIONS.${k}.mech`, sim.FACTIONS[k].mech.txt]);
  const bad = all.filter(([, s]) => typeof s !== 'string' || !s || /undefined|NaN|null/.test(s)).map(([k]) => k);
  assert.deepStrictEqual(bad, []);
});

test('the texts follow the data: change a number and its description changes with it', () => {
  const sim = loadSim();
  const cases = [
    [() => sim.BDEF.refinery.inc[2], 'c', 7, () => sim.BDEF.refinery.tiers[2], '+7 credits/s'],
    [() => sim.BDEF.hq.gun[3], 'range', 777, () => sim.BDEF.hq.tiers[3], '777 range'],
    [() => sim.BDEF_AX.turret.gun[2], 'split', 5, () => sim.BDEF_AX.turret.tiers[2], 'up to 5 beams'],
    [() => sim.YARD, 'od', 0.4, () => sim.BDEF.sigA.tiers[3], '+40%'],
    [() => sim.MOUND.n, 1, 4, () => sim.BDEF_BH.sigA.tiers[1], 'Spawns 4 Mites'],
    [() => sim.ECHO, 'cost', 0.6, () => sim.BDEF_AX.sigB.tiers[1], '60% of its cost'],
    [() => sim.DRILL, 'hp', 1.5, () => sim.TREES.barracks.B.steps[3].txt, '+50% HP'],
    [() => sim.UDEF.drone, 'max', 4, () => sim.TREES.techlab.B.steps[2].txt, 'at most 4'],
    [() => sim.ABIL.strike, 'dmg', 333, () => sim.ABIL.strike.tip, '333 damage'],
    [() => sim.TEMP, 'max', 9, () => sim.ABIL.brood.tip, 'at most 9'],
  ];
  for (const [obj, key, v, txt, want] of cases) {
    const o = obj(), was = o[key], before = txt();
    o[key] = v;
    try { assert.ok(txt().includes(want), `${want} in "${txt()}"`); } finally { o[key] = was; }
    assert.strictEqual(txt(), before, 'back to the original text');
  }
});

// v2.46: the tutorial's bubble texts (the TUTORIAL TEXT block) follow the same rule: every string and template string in it,
// with its ${...} parts (live values) taken out, has no digit and no number word
function literals(src) {
  const out = []; let i = 0;
  const skipExpr = () => { let d = 1; i += 2; while (i < src.length && d) { const c = src[i]; if (c === '{') d++; else if (c === '}') d--; else if (c === '`' || c === "'" || c === '"') { readStr(c); continue; } i++; } };
  const readStr = q => { let s = ''; i++; while (i < src.length && src[i] !== q) { if (src[i] === '\\') { s += src[i + 1]; i += 2; continue; } if (q === '`' && src[i] === '$' && src[i + 1] === '{') { s += ' '; skipExpr(); continue; } s += src[i++]; } i++; out.push(s); };
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 2; continue; }
    if (c === '`' || c === "'" || c === '"') { readStr(c); continue; }
    i++;
  }
  return out;
}
test('the tutorial texts quote no hard-coded number', () => {
  const a = SRC.indexOf('/* TUTORIAL TEXT START'), b = SRC.indexOf('/* TUTORIAL TEXT END */');
  assert.ok(a > 0 && b > a, 'the tutorial text block is marked');
  const lits = literals(SRC.slice(SRC.indexOf('*/', a) + 2, b)), words = lits.filter(s => / [a-z]+ [a-z]+ /i.test(s)); // the sentences (selectors and keys aside)
  assert.ok(words.length > 40, `the scan found the texts (${words.length})`);
  assert.deepStrictEqual(lits.filter(s => digits(s) || NUMWORD.test(s)), []);
  // the scanner itself: a digit in a template's text is caught, one inside ${...} is not
  assert.deepStrictEqual(literals("x(`a ${n + 2} b`, 'c 3', `d ${f(`e`)} f`)").filter(s => digits(s)), ['c 3']);
});
