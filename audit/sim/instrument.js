// Diagnostic instrumentation (Phase 5): code run inside a match's SIM context (load.js opts.instrument). It wraps damage()
// and kill() to count, per side and attacking weapon, the HP plus shields actually removed and the value of units killed,
// in 5-minute buckets. Counting only: the wrapped functions run exactly as before and no random number is drawn, so a
// match plays identically with or without it.
module.exports = `
(function () {
  const D = this.__sim.diag = { dmg: [{}, {}], kills: [{}, {}], hqBeamWasted: 0 };
  const bucket = t => Math.min(5, Math.floor(t / 300)); // 0-5, 5-10, ..., 25+
  const add = (o, k, b, v) => { const a = o[k] || (o[k] = [0, 0, 0, 0, 0, 0]); a[b] += v; };
  let G = null;
  const dmg0 = damage, kill0 = kill;
  damage = function (g, e, amt, weapon, fromSide, src) {
    G = g;
    const h0 = Math.max(0, e.hp) + (e.shp || 0) + (e.osh || 0);
    dmg0.apply(this, arguments);
    const h1 = Math.max(0, e.hp) + (e.shp || 0) + (e.osh || 0);
    if (fromSide === 0 || fromSide === 1) add(D.dmg[fromSide], weapon + (e.kind === 'b' ? '>B' : '>U'), bucket(g.t), Math.max(0, h0 - h1));
  };
  kill = function (g, e, by, weapon) {
    if (!e.dead && e.kind === 'u' && (by === 0 || by === 1) && !e.temp) { const c = UDEF[e.type].cost; add(D.kills[by], weapon || '?', bucket(g.t), c.c + c.e); }
    return kill0.apply(this, arguments);
  };
}).call(this);
`;
