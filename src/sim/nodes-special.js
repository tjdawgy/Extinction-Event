/* ---------- The repair depot and the guarded relic (v2.71, Phase 1): docs/PHASE1_DESIGNS.md, Proposal E ----------
   Repair depot (NODE_TYPES.repair): captured like any node; its holder's units within its radius heal REPAIR.heal% of their
   health a second (or the node's own heal) once unhurt for REPAIR.calm s (v2.75: the same rate as a base flag, CTRL). No
   income. The player saves damaged units by moving them to one (docs/CONTROLS.md).
   Guarded relic (NODE_TYPES.relic): a neutral camp. Its guards (RELIC.guards, or the node's own) stand on their spot, never
   move and fire at any unit that comes within RELIC.aggro of the relic (both sides alike). They are not in g.ents (they
   belong to no side: no vision, no intel, no army value, no score); they are in both sides' target lists (g.guards).
   With every guard dead, standing on the relic captures it once: its holder gets the reward (RELIC.reward credits) and the
   relic is spent. Guards slowly heal (RELIC.regen a second) once unhurt for RELIC.calm s, so chipping at them doesn't stick. */
const NEUTRAL = 2; // a guard's side: neither player
const REPAIR = { heal: 3, calm: 3 };
const SPECIAL = { on: true, repair: true, relic: true }; // on false (or repair / relic false): depots heal nothing; relics have no guards and can't be taken (the harness's comparison)
const RELIC = { aggro: 100, guards: [{ unit: 'titan', n: 1 }, { unit: 'tank', n: 2 }], reward: { c: 800 }, regen: 0.02, calm: 8 };
const sideBuff = (g, s) => !!(g.sides[s] && g.sides[s].buff); // NANO for side s (a guard has none)
function updateRepair(g, dt) {
  if (!SPECIAL.on || !SPECIAL.repair) return;
  for (const n of g.nodes) {
    if (n.type !== 'repair' || n.owner === null) continue;
    const r = n.r || NODE_R, h = (n.heal || REPAIR.heal) / 100;
    for (const e of g.ents) {
      if (e.kind !== 'u' || e.side !== n.owner || e.hp <= 0 || e.hp >= e.maxHp || g.t - e.lastHurt <= REPAIR.calm || Math.hypot(e.u - n.u, e.v - n.v) > r) continue;
      const h0 = e.hp; e.hp = Math.min(e.maxHp, e.hp + e.maxHp * h * dt);
      if (g.log) g.log.tot[n.owner].depotHeal = (g.log.tot[n.owner].depotHeal || 0) + e.hp - h0;
    }
  }
}
function mkGuard(g, n, type, k, of) {
  const d = UDEF[type], a = (k / of) * Math.PI * 2 + 0.5, r = of > 1 ? 34 : 0;
  return { id: g.nid++, kind: 'u', type, side: NEUTRAL, node: n.id, u: n.u + Math.cos(a) * r, v: n.v + Math.sin(a) * r * 0.8, z: 0, laneV: 0,
    hp: d.hp, maxHp: d.hp, cd: 0, face: 1, anim: 0, moving: false, rallyOff: 0, recoil: 0, hitT: 0, shT: 0, vet: 0, aimAir: 0, medAt: -1, tgt: 0, braceT: 0, braceCd: 0, lastHurt: -99, lastAct: -99,
    creepAt: -1, temp: 0, kid: 0, dis: 0, disT: 0, slow: 0, slowT: 0, chT: 0, chTgt: 0, shp: d.shp || 0, maxShp: d.shp || 0, shpT: -99, shpHit: -99, ovT: 0, frzT: 0, corr: 0, corrT: 0, burstCd: 0 };
}
function spawnGuards(g) { // at the start of a match: each relic's guards
  g.guards = [];
  if (!SPECIAL.on || !SPECIAL.relic) return;
  for (const n of g.nodes) {
    if (n.type !== 'relic') continue;
    const list = []; for (const gd of n.guards || RELIC.guards) for (let i = 0; i < gd.n; i++) list.push(gd.unit);
    list.forEach((t, k) => g.guards.push(mkGuard(g, n, t, k, list.length)));
  }
}
const relicGuarded = (g, n) => (g.guards || []).some(x => x.node === n.id && x.hp > 0);
const guardValue = (g, n) => armyValue((g.guards || []).filter(x => x.node === n.id && x.hp > 0));
function relicTaken(g, n, s) { // captured once: the reward, and the relic is spent
  const R = n.reward || RELIC.reward;
  g.sides[s].res.c += R.c || 0; g.sides[s].res.e += R.e || 0; n.spent = true;
  ev(g, { type: 'relic', side: s, c: R.c || 0 }); lg(g, s, 'R', n.id, R.c || 0);
}
function updateGuards(g, foes, dt) {
  if (!g.guards || !g.guards.length) return;
  for (const x of g.guards) if (x.hp > 0) { foes[0].push(x); foes[1].push(x); } // both sides may attack them
  for (const x of g.guards) {
    if (x.hp <= 0) continue;
    x.anim += dt; if (x.cd > 0) x.cd -= dt; if (x.hitT > 0) x.hitT -= dt; if (x.recoil > 0) x.recoil = Math.max(0, x.recoil - dt * 5);
    if (g.t - x.lastHurt > RELIC.calm) x.hp = Math.min(x.maxHp, x.hp + x.maxHp * RELIC.regen * dt);
    const d = UDEF[x.type], n = g.nodes[x.node];
    let best = null, bd = 1e9;
    for (const e of g.ents) {
      if (e.kind !== 'u' || e.hp <= 0 || e.phT > g.t) continue;
      const air = !!UDEF[e.type].air; if (air ? !d.hitsAir : d.hitsGround === false) continue;
      if (Math.hypot(e.u - n.u, e.v - n.v) > RELIC.aggro) continue;
      const dist = effDist(x, e); if (dist <= d.range && dist < bd) { bd = dist; best = e; }
    }
    x.tgt = best ? best.id : 0;
    if (best) { x.face = best.u >= x.u ? 1 : -1; x.aim = best; if (x.cd <= 0) { fire(g, x, best, d); x.cd = d.cd; } }
  }
}
