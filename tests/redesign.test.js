// Unit redesign (v2.37, audit phase 3b, audit/unit-roster.md): one core mechanic per redesigned unit (P1-P16), Skitterlings
// at half supply with a limit of 60 (S1), the corrosion rule, and the REDESIGN switch that restores v2.36. SIM only (Node).
const test = require('node:test');
const assert = require('node:assert');
const { loadSim } = require('./load-sim');

const sim = loadSim();
const U = sim.UDEF;
const step = (g, secs) => { for (let i = 0; i < Math.round(secs * 30); i++) sim.update(g, 1 / 30); };
const quiet = (f0 = 'lastfist', f1 = 'lastfist') => { const g = sim.newGame('normal', { factions: [f0, f1] }); g.countdown = 0; g.t = 200; for (const s of g.sides) { s.aiT = 1e9; s.res.c = s.res.e = 9000; } sim.setStance(g, 0, 'hold'); sim.setStance(g, 1, 'hold'); return g; };
const put = (g, s, t, u, v = 0) => { const e = sim.spawnUnit(g, s, t, u, v); e.holdU = u; e.holdV = v; return e; };
const seeAll = g => { for (const f of g.fog) { f.vis.fill(1); f.exp.fill(1); } };
const fin = (g, s, k) => { assert.ok(sim.tryBuild(g, s, k).ok, k); const b = g.ents.filter(e => e.side === s && e.type === k).at(-1); b.built = true; b.progress = 1; b.hp = b.maxHp; b.shp = b.maxShp; return b; };
const MID = 850; // mid-lane (L 1700), out of both HQs' reach

test('setRedesign(false) restores every v2.36 value; true puts the redesign back', () => {
  const before = JSON.stringify(U);
  sim.setRedesign(false);
  assert.strictEqual(sim.REDESIGN.on, false);
  assert.deepStrictEqual([U.artillery.salvo, U.artillery.splash, U.bilecaster.splash, U.bilecaster.range, U.skitterling.pop, U.skitterling.max, U.bastion.brace.cut, U.sovereign.drop, U.sovereign.beam, U.voidcarrier.dmg],
    [undefined, 55, 40, 220, 1, undefined, 0.4, true, undefined, 72]);
  sim.setRedesign(true);
  assert.strictEqual(JSON.stringify(U), before);
  assert.ok(U.artillery.salvo && U.titan.siege && U.wraithwing.phase && U.bastion.surge && !U.bastion.brace);
});

test('corrosion: the strongest running effect applies (cap 25%); a weaker, longer one takes over when it ends; nothing adds up', () => {
  const g = quiet(), e = put(g, 1, 'heavy', MID);
  sim.corrode(g, e, { amt: 0.2, dur: 2 }); sim.corrode(g, e, { amt: 0.12, dur: 10 });
  assert.strictEqual(sim.corrNow(e, g.t), 0.2);
  assert.strictEqual(sim.corrNow(e, g.t + 3), 0.12, 'the weaker one after the strong one ends');
  assert.strictEqual(sim.corrNow(e, g.t + 11), 0);
  sim.corrode(g, e, { amt: 0.5, dur: 5 }); assert.strictEqual(sim.corrNow(e, g.t), 0.25, 'capped');
  // a strong short hit and a weak long one never make a strong long one (the pre-v2.37 rule did)
  const f = put(g, 1, 'heavy', MID + 30); sim.corrode(g, f, { amt: 0.15, dur: 3 }); sim.corrode(g, f, { amt: 0.12, dur: 5 });
  assert.strictEqual(sim.corrNow(f, g.t + 4), 0.12);
});

test('P1 Artillery: a salvo of 3 shells, a third of the damage each, landing one after another around the target', () => {
  const g = quiet(); seeAll(g); const a = put(g, 0, 'artillery', MID - 300), t = put(g, 1, 'tank', MID);
  sim.fire(g, a, t, U.artillery);
  const sh = g.projs.filter(p => p.weapon === 'shell');
  assert.strictEqual(sh.length, 3);
  assert.ok(sh.every(p => Math.abs(p.dmg - U.artillery.dmg / 3) < 1e-9 && p.splash === 40));
  assert.ok(sh[0].T < sh[1].T && sh[1].T < sh[2].T, 'staggered');
});

test('P2 Bile Lobber: its splash corrodes for 3 s; P16 Bilecaster: one target, 280 range, corrosion for 14 s', () => {
  const g = quiet('bloomhost', 'lastfist'); seeAll(g); const l = put(g, 0, 'bilelobber', MID - 300), a = put(g, 1, 'rifle', MID), b = put(g, 1, 'rifle', MID + 15, 10);
  sim.fire(g, l, a, U.bilelobber); const p = g.projs.at(-1); p.tu = a.u; p.tv = a.v; step(g, 3);
  for (const e of [a, b]) assert.ok(e.corrT > 0 && Math.abs(e.corr - 0.15) < 1e-9 && e.corrT - g.t < 3, 'short area corrosion');
  const g2 = quiet('bloomhost', 'lastfist'); seeAll(g2); const c = put(g2, 0, 'bilecaster', MID - 225), x = put(g2, 1, 'heavy', MID), y = put(g2, 1, 'heavy', MID + 10, 6);
  step(g2, 4);
  assert.ok(sim.corrNow(x, g2.t) === 0.2 && x.corrT - g2.t > 9, 'long single-target corrosion');
  assert.strictEqual(sim.corrNow(y, g2.t), 0, 'no splash');
  assert.strictEqual(U.spitter.corrode.amt, 0.12, 'the Spitter is unchanged');
});

test('P3 Rift Mortar: lands exactly on the target (no scatter), tight splash, heavier hit', () => {
  const g = quiet('axiarchs', 'lastfist'); seeAll(g); const m = put(g, 0, 'riftmortar', MID - 300), t = put(g, 1, 'tank', MID, 20);
  for (let i = 0; i < 5; i++) sim.fire(g, m, t, U.riftmortar);
  assert.ok(g.projs.filter(p => p.weapon === 'rift').every(p => p.tu === t.u && p.tv === t.v && p.precise && p.splash === 20 && p.dmg === 100));
});

test('P4 Sniper: the round pierces up to 3 more units in a line behind its target, 60% of the last each', () => {
  const g = quiet(); seeAll(g); const sn = put(g, 0, 'sniper', MID - 200);
  const t = put(g, 1, 'rifle', MID), b1 = put(g, 1, 'rifle', MID + 40), b2 = put(g, 1, 'rifle', MID + 80), off = put(g, 1, 'rifle', MID + 40, 40);
  for (const e of [t, b1, b2, off]) e.hp = e.maxHp = 1e4;
  sn.cd = 1e6; for (const e of [t, b1, b2, off]) e.cd = 1e6; sim.fire(g, sn, t, U.sniper);
  let line = false; for (let i = 0; i < 15; i++) { sim.update(g, 1 / 30); if (g.fx.some(f => f.k === 'pierce')) line = true; }
  const lost = e => 1e4 - e.hp, base = U.sniper.dmg * sim.DMG.rail.light;
  assert.ok(Math.abs(lost(t) - base) < 1e-6 && Math.abs(lost(b1) - base * 0.6) < 1e-6 && Math.abs(lost(b2) - base * 0.36) < 1e-6, `${lost(t)} ${lost(b1)} ${lost(b2)}`);
  assert.strictEqual(lost(off), 0, 'off the line');
  assert.ok(line, 'the line is drawn');
});

test('P5 Riftstalker: phase-steps onto its prey, strikes once, then steps back to where it leapt from', () => {
  const g = quiet('axiarchs', 'lastfist'); seeAll(g); sim.setStance(g, 0, 'attack');
  const r = sim.spawnUnit(g, 0, 'riftstalker', MID - 100, 0), t = put(g, 1, 'sniper', MID, 0); t.hp = t.maxHp = 1e4; t.cd = 1e6;
  let leapt = null, struck = false, back = false;
  for (let i = 0; i < 30 * 4; i++) {
    sim.update(g, 1 / 30);
    if (r.leaping && leapt === null) leapt = { u: r.fu, v: r.fv };
    if (t.hp < 1e4) struck = true;
    if (struck && leapt && !r.leaping && Math.abs(r.u - leapt.u) < 3) { back = true; break; }
  }
  assert.ok(leapt && struck && back, JSON.stringify({ leapt, struck, back, u: r.u }));
  assert.ok(g.fx.some(f => f.k === 'blink'));
});

test('P6 Bastion: no brace; when hit after its cooldown its shields surge back even under fire', () => {
  const g = quiet('axiarchs', 'lastfist'); const b = put(g, 0, 'bastion', MID); b.cd = 1e6;
  assert.strictEqual(U.bastion.brace, undefined); assert.ok(U.bulwark.brace, 'the Bulwark keeps its brace');
  b.shp = 50; sim.damage(g, b, 10, 'cannon', 1);
  assert.ok(b.surgeT > g.t);
  const s0 = b.shp; sim.damage(g, b, 5, 'cannon', 1); step(g, 1);
  assert.ok(b.shp > s0 + U.bastion.surge.rate * b.maxShp * 0.8 - 6, `surged ${s0} → ${b.shp}`);
  const cd = b.surgeCd; step(g, 3); sim.damage(g, b, 5, 'cannon', 1); assert.strictEqual(b.surgeCd, cd, 'no new surge inside the cooldown');
});

test('P7 Worldbreaker: its distortion zone disrupts enemy units inside (they deal 30% less) and no longer burns them', () => {
  const g = quiet('axiarchs', 'lastfist'), e = put(g, 1, 'tank', MID); e.cd = 1e6;
  g.acid.push({ side: 0, u: MID, v: 0, end: g.t + 4, kind: 'dist' });
  const h0 = e.hp; step(g, 1);
  assert.strictEqual(e.hp, h0, 'no damage');
  assert.ok(e.disT > g.t && Math.abs(e.dis - 0.3) < 1e-9, 'disrupted');
  g.acid.push({ side: 0, u: MID, v: 0, end: g.t + 4 }); step(g, 1); assert.ok(e.hp < h0, 'a Ruinmaw\'s acid pool still burns');
});

test('P8 Titan: plants (2 s) before firing, +90 range planted, can\'t move or be pulled, unplants (1.5 s) on Retreat or when idle', () => {
  const g = quiet(); seeAll(g); sim.setStance(g, 0, 'attack');
  const ti = sim.spawnUnit(g, 0, 'titan', MID - 225, 0), t = put(g, 1, 'tank', MID, 0); t.hp = t.maxHp = 1e5; t.cd = 1e6;
  step(g, 0.2); assert.strictEqual(ti.siege, 1, 'planting: the tank is inside planted reach (280) and sight (240), beyond mobile reach (190)');
  const u0 = ti.u; step(g, 2); assert.strictEqual(ti.siege, 2, 'planted'); assert.strictEqual(ti.u, u0, 'it doesn\'t move');
  step(g, 3); assert.ok(t.hp < 1e5, 'it fires from 225 away');
  sim.setStance(g, 0, 'retreat'); step(g, 0.2); assert.strictEqual(ti.siege, 3, 'unplanting');
  step(g, 1.5); assert.strictEqual(ti.siege, 0); step(g, 1); assert.ok(ti.u < u0, 'then it walks home');
  // idle: no target in reach for 4 s → unplants on its own
  const g2 = quiet(); seeAll(g2); const t2 = sim.spawnUnit(g2, 0, 'titan', MID - 200, 0), e2 = put(g2, 1, 'rifle', MID, 0); e2.cd = 1e6;
  step(g2, 2.5); assert.strictEqual(t2.siege, 2); e2.hp = 0; e2.dead = true; step(g2, 4.5); assert.ok(t2.siege === 3 || t2.siege === 0, 'unplants when idle');
});

test('P8 Titan in AI play: the AI\'s Titans plant and unplant on their own', () => {
  const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const S = loadSim({ random: mul(3) });
  const g = S.newGame('hard', { autoPlayer: true, autoDiff: 'hard', persona: 'aggressor', autoPersona: 'turtle', factions: ['lastfist', 'lastfist'] });
  g.countdown = 0; for (const s of [0, 1]) for (let i = 0; i < 3; i++) S.spawnUnit(g, s, 'titan', S.rallyU(s) + (i - 1) * 20, (i - 1) * 30); // the AI moves them with its own pushes and retreats
  const seen = new Set(); let fired = 0;
  for (let i = 0; i < 30 * 600 && !g.over; i++) { S.update(g, 1 / 30); for (const e of g.ents) if (e.type === 'titan') { seen.add(e.siege || 0); } for (const p of g.projs) if (p.weapon === 'siege' && !p.seen) { p.seen = 1; fired++; } }
  assert.ok(seen.has(1) && seen.has(2) && seen.has(3), `states seen ${[...seen]}`);
  assert.ok(fired > 0, 'and they fire');
});

test('P10 Leviathan: a line of 4 smaller bombs along its path; P12 Sovereign: a 2 s charge, then one beam, no splash', () => {
  const g = quiet(); seeAll(g); const lv = put(g, 0, 'leviathan', MID - 20), t = put(g, 1, 'tank', MID);
  lv.face = 1; sim.fire(g, lv, t, U.leviathan);
  const bs = g.projs.filter(p => p.weapon === 'bomb').sort((a, b) => a.tu - b.tu);
  assert.strictEqual(bs.length, 4); assert.ok(bs.every(p => p.dmg === 35)); assert.ok(bs[3].tu - bs[0].tu > 60, 'spread along the lane');
  const g2 = quiet('axiarchs', 'lastfist'); seeAll(g2); fin(g2, 1, 'barracks');
  const sv = put(g2, 0, 'sovereign', MID), b = fin(g2, 1, 'refinery'); sv.u = b.u; sv.holdU = b.u; sv.v = b.v; sv.holdV = b.v;
  const h0 = b.hp; step(g2, 1.5); assert.strictEqual(b.hp, h0, 'still charging');
  step(g2, 1); assert.ok(b.hp < h0, 'then the beam lands'); assert.ok(g2.fx.some(f => f.k === 'beam' && f.hq && f.w === 5));
  assert.ok(!g2.projs.some(p => p.weapon === 'sovereign'), 'no projectile');
});

test('P11 Worldrender: heals 30% of its building damage, at most 40 HP per second', () => {
  const g = quiet('bloomhost', 'lastfist'); seeAll(g); fin(g, 1, 'barracks'); const b = fin(g, 1, 'refinery'); b.hp = b.maxHp = 1e5;
  g.sides[1].hq.cd = 1e9; const w = put(g, 0, 'worldrender', b.u, b.v); w.hp = 1000; w.cd = 0;
  step(g, 5);
  const healed = w.hp - 1000;
  assert.ok(healed > 0 && healed <= 40 * 5 + 40 + 1e-6, `healed ${healed}`);
  assert.ok(g.fx.some(f => f.k === 'devour'));
});

test('P13 Wraithwing: phases out for 1 s when hit (untouchable, untargetable, no shots), then not again for 8 s', () => {
  const g = quiet('axiarchs', 'lastfist'); seeAll(g); const w = put(g, 0, 'wraithwing', MID); w.cd = 1e6;
  sim.damage(g, w, 10, 'rifle', 1);
  assert.ok(w.phT > g.t);
  const h = w.hp + w.shp; sim.damage(g, w, 50, 'rifle', 1); assert.strictEqual(w.hp + w.shp, h, 'untouchable while phased');
  const r = put(g, 1, 'rifle', MID + 60); assert.strictEqual(sim.acquire(g, r, U.rifle, [w]).best, null, 'untargetable');
  step(g, 1.1); const h2 = w.hp + w.shp; sim.damage(g, w, 10, 'rifle', 1); assert.ok(w.hp + w.shp < h2, 'hit again after it'); assert.ok(!(w.phT > g.t), 'no new phase inside the cooldown');
});

test('P14 Lancer: +15% per consecutive hit on the same target, up to +60%; a new target starts over', () => {
  const g = quiet('axiarchs', 'lastfist'); seeAll(g); const l = put(g, 0, 'lancer', MID - 100), a = put(g, 1, 'tank', MID), b = put(g, 1, 'tank', MID + 20);
  const d = [];
  for (let i = 0; i < 6; i++) { sim.fire(g, l, a, U.lancer); d.push(g.projs.at(-1).dmg); }
  sim.fire(g, l, b, U.lancer); d.push(g.projs.at(-1).dmg);
  const base = U.lancer.dmg;
  assert.deepStrictEqual(d.map(x => +(x / base).toFixed(2)), [1, 1.15, 1.3, 1.45, 1.6, 1.6, 1]);
});

test('P15 Ravager: a kill frenzies it for 4 s; the next kill refreshes it, never stacks', () => {
  const g = quiet('bloomhost', 'lastfist'); const r = put(g, 0, 'ravager', MID);
  const a = put(g, 1, 'rifle', MID + 10); a.hp = 1; sim.damage(g, a, 50, 'maul', 0, r);
  assert.ok(Math.abs(r.frzT - (g.t + 4)) < 1e-9);
  step(g, 1); const b = put(g, 1, 'rifle', MID + 10); b.hp = 1; sim.damage(g, b, 50, 'maul', 0, r);
  assert.ok(Math.abs(r.frzT - (g.t + 4)) < 1e-9, 'refreshed to 4 s, not 4 + 3');
});

test('P9 Voidcarrier: carries a power field that follows it; the default warp point moves to it; the field collapses when it dies', () => {
  const g = quiet('axiarchs', 'lastfist'); const c = put(g, 0, 'voidcarrier', 900, 0); c.cd = 1e6;
  step(g, 14);
  const p = g.field[0].find(q => q.k === 'vc' + c.id);
  assert.ok(p && p.r > 100 && p.u === c.u, 'grown, centred on the carrier');
  c.u = 1000; c.holdU = 1000; step(g, 0.1); assert.strictEqual(p.u, c.u, 'it moves with it');
  const w = sim.warpPoint(g, 0); assert.ok(Math.abs(w.u - c.u) < 130, `warp point at the carrier (${w.u})`);
  assert.ok(sim.onField(g, 0, c.u, c.v), 'shields recharge there like in the field');
  c.hp = 0; c.dead = true; step(g, 0.1);
  assert.ok(!g.field[0].some(q => q.k === 'vc' + c.id), 'collapsed'); assert.ok(g.fx.some(f => f.k === 'shatter'));
});

test('S1 Skitterlings: half supply each; at most 60 alive or queued per side; the AI never stalls on the limit', () => {
  assert.strictEqual(U.skitterling.pop, 0.5);
  const g = quiet('bloomhost', 'lastfist'); fin(g, 0, 'barracks'); for (let i = 0; i < 4; i++) fin(g, 0, 'habitat');
  for (let i = 0; i < 59; i++) sim.spawnUnit(g, 0, 'skitterling', 400 + i, 0);
  assert.strictEqual(sim.popUsed(g, 0), 29.5);
  assert.ok(sim.tryTrain(g, 0, 'skitterling').ok, 'the 60th');
  const r = sim.tryTrain(g, 0, 'skitterling'); assert.ok(!r.ok && /At most 60/.test(r.msg), r.msg);
  // an AI at the limit goes on training other units
  const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const S = loadSim({ random: mul(5) }), h = S.newGame('hard', { factions: ['lastfist', 'bloomhost'] }); h.countdown = 0; h.sides[0].aiT = 1e9; h.sides[1].res.c = h.sides[1].res.e = 1e5;
  for (const k of ['barracks', 'factory', 'habitat', 'habitat', 'habitat', 'habitat', 'refinery']) { S.tryBuild(h, 1, k); for (const b of h.ents) if (b.kind === 'b' && b.side === 1) { b.built = true; b.progress = 1; b.hp = b.maxHp; } }
  for (let i = 0; i < 60; i++) S.spawnUnit(h, 1, 'skitterling', S.hqU(1) - 200 - i, 0);
  for (let i = 0; i < 30 * 120; i++) S.update(h, 1 / 30);
  const other = h.ents.filter(e => e.side === 1 && e.kind === 'u' && e.type !== 'skitterling' && !e.temp).length;
  assert.ok(other > 0, 'other units trained');
  assert.ok(S.unitCount(h, 1, 'skitterling') <= 60 + 8, 'Skitterlings stay at the limit (Emergency Brood ones come on top, up to 8)');
});
