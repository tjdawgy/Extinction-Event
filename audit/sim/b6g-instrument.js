// Batch 6g (v2.97): read-only counters run inside a match's SIM context (load.js opts.instrument), plus two audit-only
// drivers that the harness may switch on (a scripted direct-control player, a Last Fist forced to turret every pad).
// Counting never draws a random number nor changes what the SIM reads. Exposed as this.__sim.b6g:
//   warps: every unit that finished warping in { id, s, type, t, u, v, fwd (from a forward Gate's flag), d15 (died within 15 s) }
//   tick(g): called by the harness once a game second: resolves warp deaths, node spells, forward-pad buildings
//   sum(g): the per-side summary
module.exports = `
(function () {
  const R = this.__sim.b6g = { warps: [], fpb: new Map(), spells: [], open: {}, last: {}, caps: [], ctl: [], fort: [{}, {}] };
  const H = this.__sim.b6gH = { directControl, command, FWD_PADS: () => FWD_PADS, FWD_SLOT, tryBuild, fwdAt, setWarp: typeof setWarp === 'function' ? setWarp : null };
  const uw = updateWarps;
  updateWarps = function (g) {
    const n0 = g.ents.length, pend = g.warps.filter(w => g.t >= w.end).map(w => !!w.fwd);
    const r = uw.apply(this, arguments);
    let i = 0; for (let k = n0; k < g.ents.length; k++) { const e = g.ents[k]; if (e.kind === 'u') {
      let ne = 1e9, inR = 0; // the nearest enemy unit, and whether any enemy unit or building gun reaches the spot
      for (const f of g.ents) { if (f.side === e.side || f.hp <= 0 || f.side === NEUTRAL) continue; const dd = Math.hypot(f.u - e.u, f.v - e.v);
        if (f.kind === 'u') { if (dd < ne) ne = dd; const fd = UDEF[f.type]; if (fd.dmg && dd <= (fd.range || 0) + 20) inR = 1; }
        else if (f.kind === 'b' && f.built) { const gn = bdOf(f).gun && bdOf(f).gun[f.tier]; if (gn && dd <= gn.range + f.half) inR = 1; } }
      R.warps.push({ id: e.id, s: e.side, type: e.type, t: g.t, u: Math.round(e.u), v: Math.round(e.v), fwd: !!pend[i++], d15: null, ne: Math.round(ne), inR, hq: Math.round(Math.abs(e.u - hqU(e.side))) }); } }
    return r;
  };
  const fpNode = b => b.slot >= FWD_SLOT && FWD_PADS[b.slot - FWD_SLOT] ? FWD_PADS[b.slot - FWD_SLOT].node : (b.type === 'bunker' ? b.node : null);
  R.tick = g => {
    const alive = new Set(); for (const e of g.ents) if (e.hp > 0) alive.add(e.id);
    for (const w of R.warps) if (w.d15 === null) { if (!alive.has(w.id)) w.d15 = g.t - w.t <= 15 ? 1 : 0; else if (g.t - w.t > 15) w.d15 = 0; }
    // forward-pad buildings (and Last Fist node bunkers): built, lost
    for (const e of g.ents) if (e.kind === 'b' && e.hp > 0 && (e.slot >= FWD_SLOT || e.type === 'bunker') && !R.fpb.has(e.id)) R.fpb.set(e.id, { id: e.id, s: e.side, type: e.type, node: fpNode(e), t: g.t, dead: null, bunker: e.type === 'bunker' });
    for (const b of R.fpb.values()) if (b.dead === null && !alive.has(b.id)) b.dead = g.t;
    // node spells: who holds each node, and whether the holder had a building on it during the spell
    g.nodes.forEach((n, i) => {
      if (n.type === 'relic') return;
      const o = n.owner, sp = R.open[i];
      if (sp && sp.s !== o) { sp.end = g.t; R.spells.push(sp); R.open[i] = null; }
      if (o !== null && o !== undefined && !R.open[i]) {
        const prev = R.last[i]; R.open[i] = { node: i, type: n.type || 'income', s: o, start: g.t, end: null, fort: false, retake: prev === 1 - o };
        R.caps.push({ node: i, s: o, t: g.t, retake: prev === 1 - o, type: n.type || 'income' }); R.last[i] = o;
      }
      const cur = R.open[i];
      if (cur && !cur.fort) for (const e of g.ents) if (e.kind === 'b' && e.hp > 0 && e.side === cur.s && fpNode(e) === i && !e.bunker && e.type !== 'bunker' && e.built) { cur.fort = true; break; }
    });
    if (Math.round(g.t) % 60 === 0) { const c = [0, 0]; for (const n of g.nodes) if (n.owner === 0 || n.owner === 1) c[n.owner]++; R.ctl.push(c); }
  };
  R.sum = g => {
    const spells = R.spells.concat(Object.values(R.open).filter(Boolean).map(sp => Object.assign({}, sp, { end: g.t })));
    return [0, 1].map(s => {
      const W = R.warps.filter(w => w.s === s), F = [...R.fpb.values()].filter(b => b.s === s && !b.bunker), FE = [...R.fpb.values()].filter(b => b.s === 1 - s && !b.bunker);
      const sp = spells.filter(x => x.s === s && x.type !== 'watchtower');
      const dur = a => a.reduce((t, x) => t + (x.end - x.start), 0);
      return {
        warps: W.length, warpD15: W.filter(w => w.d15 === 1).length, warpFwd: W.filter(w => w.fwd).length, warpFwdD15: W.filter(w => w.fwd && w.d15 === 1).length, warpNear150: W.filter(w => w.ne < 150).length, warpInR: W.filter(w => w.inR).length, warpHqMed: W.length ? W.map(w => w.hq).sort((a, b) => a - b)[W.length >> 1] : null,
        fpBuilt: F.length, fpTypes: F.reduce((o, b) => (o[b.type] = (o[b.type] || 0) + 1, o), {}), fpNodes: new Set(F.map(b => b.node)).size,
        fpKilled: FE.filter(b => b.dead !== null).length, // enemy pad buildings destroyed (or sold)
        caps: R.caps.filter(c => c.s === s && c.type !== 'watchtower').length, retakes: R.caps.filter(c => c.s === s && c.retake && c.type !== 'watchtower').length,
        spellsF: sp.filter(x => x.fort).length, holdF: dur(sp.filter(x => x.fort)), spellsU: sp.filter(x => !x.fort).length, holdU: dur(sp.filter(x => !x.fort)),
        ctl: R.ctl.map(c => c[s]), wl: W.map(w => [Math.round(w.t), w.u, w.v, w.fwd ? 1 : 0, w.d15, w.ne, w.inR, w.hq]),
      };
    });
  };
})();
`;
