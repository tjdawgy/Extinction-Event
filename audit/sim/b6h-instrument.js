// Batch 6h (v2.98): read-only counters run inside a match's SIM context (load.js opts.instrument), switched on with EE_B6H=1
// in audit/sim/audit6a.js. Nothing here draws a random number or changes what the SIM reads.
//   node: every Bloomhost node-assault decision (6g's aiNode6g and 6h's aiNode6h through the NODE6H.log hook): the candidate node,
//     the defence it counted, the force it needed and had, launched or held back; each launched group's units by type, how it
//     ended, and what killed each of its units (a unit's or building's type, by weapon; "gun" for any building)
//   swarm: per side, peak Bloomhost units alive, Bloomhost damage dealt by melee and by other units, Mites spawned, Warden damage
//     prevented, Pounces, Tunnel uses (the side.h6 counters), units trained per type is in audit6a's own record
module.exports = `
(function () {
  const R = this.__sim.b6h = { ev: [], dead: [], dmg: [{ melee: 0, other: 0 }, { melee: 0, other: 0 }], grp: {} };
  let cur = null;
  if (typeof NODE6H !== 'undefined') NODE6H.log = (g, o) => {
    o.t = Math.round(g.t);
    if (o.k === 'go') R.grp[o.s] = { ids: new Set(o.ids), t: g.t, node: o.node };
    if (o.k === 'end' && R.grp[o.s]) { o.dur = Math.round(g.t - R.grp[o.s].t); R.grp[o.s] = null; }
    R.ev.push(o);
  };
  const d1 = damage1;
  damage1 = function (g, e, amt, weapon, fromSide, src) {
    const a = src && src.kind ? src : (HIT6G.by ? ctlEnt(g, HIT6G.by) : null), prev = cur;
    cur = a ? (a.kind === 'b' ? 'gun:' + a.type : a.type) : weapon;
    const h0 = e.hp + (e.shp || 0);
    try { return d1.apply(this, arguments); } finally {
      const dealt = Math.max(0, h0 - Math.max(0, e.hp) - (e.shp || 0));
      if (a && a.kind === 'u' && fromSide >= 0 && fromSide < 2 && UDEF[a.type].fac === 'bloomhost') R.dmg[fromSide][UDEF[a.type].melee ? 'melee' : 'other'] += dealt;
      cur = prev;
    }
  };
  const k0 = kill;
  kill = function (g, e, by, weapon) {
    if (e.kind === 'u' && !e.dead) for (let s = 0; s < 2; s++) { const G = R.grp[s]; if (G && G.ids.has(e.id)) R.dead.push({ s, t: Math.round(g.t), node: G.node, type: e.type, by: cur || weapon }); }
    return k0.apply(this, arguments);
  };
  R.sum = g => [0, 1].map(s => ({ h6: g.sides[s].h6 || null, dmg: R.dmg[s], ev: R.ev.filter(x => x.s === s), dead: R.dead.filter(x => x.s === s) }));
})();
`;
