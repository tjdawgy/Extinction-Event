// Batch 6a (balance audit, v2.91): instrumentation run inside a match's SIM context (load.js opts.instrument). Counting only:
// it wraps updateUnit, updateBuilding, impact, damage and kill to credit every point of damage (HP plus shields actually
// removed) and every kill to the unit type (or building type) that caused it. No random number is drawn and nothing the
// SIM reads is changed (projectile tags live in a WeakMap outside the match state), so a match plays identically with
// or without it (checked by audit/sim/audit6a.js --identity).
//
// Attribution: while a unit or building updates, its type is "current" (melee, beams, flame, latches, charges, landings,
// abilities it fires); projectiles it creates are tagged with its type, and while a projectile lands its tag is current.
// Damage whose side differs from the current one (a Thornback's thorns, a Shardling's parry counter) and damage outside
// any update (acid and bile pools, pustules, meteors) is credited by weapon (WEAP) or left as "?weapon".
module.exports = `
(function () {
  const A = this.__sim.a6 = { dmg: [{}, {}], kills: [{}, {}], kval: [{}, {}], dmgB: [{}, {}], unk: [{}, {}], mat: [{}, {}] }; // mat (v2.94, batch 6d B1): damage by dealer type, then by target type (B:<type> a building)
  const WEAP = { thorns: 'thornback', parry: 'shardling', blade: 'shardling', pustule: 'broodtyrant', tyrglob: 'broodtyrant', bile: 'bilecaster',
    bileglob: 'bilecaster', acidpool: 'acid pools', miteacid: 'mite', exile: 'severance', sever: 'severance', erupt: 'gorebore', gorebite: 'gorebore',
    ruinbite: 'ruinmaw', ruinchew: 'ruinmaw', latch: 'leaper', trample: 'dreadthorn', landmaw: 'worldrender', rupture: 'worldbreaker', meteor: 'meteor', hqgun: 'B:hq', hqbeam: 'B:hq' };
  const TAG = new WeakMap(); // projectile -> the type that fired it (kept outside the SIM's state)
  let CUR = null; // { t: type tag, s: side }
  const tagOf = e => e.kind === 'b' ? 'B:' + e.type : e.type;
  const uu = updateUnit, ub = updateBuilding, im = impact, dm = damage, kl = kill;
  updateUnit = function (g, u, foes, dt) {
    const prev = CUR, n0 = g.projs.length; CUR = { t: tagOf(u), s: u.side };
    try { return uu.apply(this, arguments); } finally { for (let i = n0; i < g.projs.length; i++) if (!TAG.has(g.projs[i])) TAG.set(g.projs[i], CUR.t); CUR = prev; }
  };
  updateBuilding = function (g, b, foes, dt) {
    const prev = CUR, n0 = g.projs.length; CUR = { t: tagOf(b), s: b.side };
    try { return ub.apply(this, arguments); } finally { for (let i = n0; i < g.projs.length; i++) if (!TAG.has(g.projs[i])) TAG.set(g.projs[i], CUR.t); CUR = prev; }
  };
  impact = function (g, p, hit) {
    const prev = CUR, tg = TAG.get(p); CUR = tg ? { t: tg, s: p.side } : null;
    try { return im.apply(this, arguments); } finally { CUR = prev; }
  };
  const who = (weapon, side) => CUR && CUR.s === side ? CUR.t : WEAP[weapon] || '?' + weapon;
  const add = (o, k, v) => { o[k] = (o[k] || 0) + v; };
  damage = function (g, e, amt, weapon, fromSide, src) {
    const h0 = Math.max(0, e.hp) + (e.shp || 0) + (e.osh || 0);
    const r = dm.apply(this, arguments);
    const h1 = Math.max(0, e.hp) + (e.shp || 0) + (e.osh || 0);
    if ((fromSide === 0 || fromSide === 1) && h0 > h1) { const k = who(weapon, fromSide); add(A.dmg[fromSide], k, h0 - h1); add(A.mat[fromSide][k] || (A.mat[fromSide][k] = {}), tagOf(e), h0 - h1); if (e.kind === 'b') add(A.dmgB[fromSide], k, h0 - h1); }
    return r;
  };
  kill = function (g, e, by, weapon) {
    if (!e.dead && (by === 0 || by === 1) && e.kind === 'u') { const k = who(weapon, by), c = UDEF[e.type].cost; add(A.kills[by], k, 1); if (!e.temp) add(A.kval[by], k, c.c + c.e); }
    return kl.apply(this, arguments);
  };
  Object.assign(this.__sim, { treeOf, rwD, rangeGame, rangeUnits, rangeUnit, rangeBuilding, rangeMode, rangeStep, rangeRead, rangeOrders, command, ctlHold, effDist, trainCost });
}).call(this);
`;
