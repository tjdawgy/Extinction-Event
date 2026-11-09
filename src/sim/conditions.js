/* ---------- Battlefield conditions (v2.72, Phase 1): docs/PHASE1_DESIGNS.md, Proposal F ----------
   Rules for one match, chosen on the map-select screen (g.cond; a map lists the ones it allows, `conditions`). None by
   default; every one is the same for both sides.
   - heavyFog: every sight radius × sight (nodes and buildings too), a watchtower's × tower; explored ground fades back to
     unexplored after fade seconds without vision (updateVision). The AI scouts twice as often.
   - richCenter: the centre node pays lanes × (Two-Lane, Three-Lane) or classic × (Classic) instead of its usual yield. The
     AI contests it earlier (its capture groups from capFrom, on Classic a smaller edge to take the field).
   - scarce: Refineries and income nodes pay pay ×, each side starts with start credits. The AI wants armies army × the size
     before attacking. The storm is unchanged, so matches stay bounded.
   - meteors (Two-Lane, Three-Lane): from `from`, every `every` seconds a meteor falls on a random open spot on a lane
     (from the match's seeded stream, so a replay repeats it): a warning circle for warn seconds, then dmg to every ground
     unit and bdmg to every building (both sides; a shielded HQ excepted) within r, less towards the edge. AI units never
     stand still in a warning circle (they step out of it); a player's units stay where they are told. */
const COND = {
  heavyFog: { sight: 0.6, tower: 0.8, fade: 60 },
  richCenter: { lanes: 3, classic: 2, capFrom: 60, field: 0.8 },
  scarce: { pay: 0.6, start: 200, army: 0.6 },
  meteors: { from: 300, every: 45, warn: 4, r: 90, dmg: 260, bdmg: 420, edge: 0.4 },
};
const COND_KEYS = ['heavyFog', 'richCenter', 'scarce', 'meteors'];
const hasCond = (g, k) => !!(g && g.cond && g.cond[k]);
function setupConds(g, list) { // at newGame: the conditions asked for that this map allows
  g.cond = {};
  for (const k of COND_KEYS) if ((list || []).includes(k) && (MAP.conditions || []).includes(k)) g.cond[k] = true; // in COND_KEYS order
  if (g.cond.richCenter && g.nodes[1] && !g.nodes[1].type) g.nodes[1].mul = MAP_LANED ? COND.richCenter.lanes : COND.richCenter.classic;
  if (g.cond.scarce) for (const sd of g.sides) sd.res.c = COND.scarce.start;
  if (g.cond.meteors) g.meteor = { next: COND.meteors.from, at: null };
}
const sightMul = g => hasCond(g, 'heavyFog') ? COND.heavyFog.sight : 1;
const payMul = (g, what) => hasCond(g, 'scarce') && (what === 'refinery' || what === 'node') ? COND.scarce.pay : 1;
function meteorSpot(g) { // a random open spot on a lane (simRnd: the match's stream)
  for (let k = 0; k < 20; k++) {
    const ln = MAP.lanes[Math.floor(simRnd() * MAP.lanes.length)], u = L * (0.12 + 0.76 * simRnd()), v = laneY(ln, u) + (simRnd() * 2 - 1) * ln.width * 0.4;
    if (!NAV.on || !navShut(u, v)) return { u, v };
  }
  return { u: L / 2, v: 0 };
}
function updateMeteors(g) {
  const M = g.meteor, C = COND.meteors; if (!M) return;
  if (!M.at && g.t >= M.next) { const p = meteorSpot(g); M.at = { u: p.u, v: p.v, t: g.t + C.warn, t0: g.t }; ev(g, { type: 'meteorWarn', u: p.u, v: p.v }); }
  if (M.at && g.t >= M.at.t) {
    const { u, v } = M.at; M.at = null; M.next = g.t + C.every - C.warn; M.n = (M.n || 0) + 1;
    const w = P(u, v, 0); fxBoom(g, w.x, w.y, 70); for (let i = 0; i < 4; i++) { const q = P(u + fxRand(-40, 40), v + fxRand(-30, 30), fxRand(0, 30)); fxBoom(g, q.x, q.y, fxRand(30, 50)); }
    g.shake = Math.max(g.shake || 0, 6);
    for (const e of g.ents.slice()) {
      if (e.hp <= 0 || (e.kind === 'u' && UDEF[e.type].air)) continue;
      const d = Math.hypot(e.u - u, e.v - v) - (e.kind === 'b' ? e.half : 0); if (d > C.r) continue;
      const k = 1 - (1 - C.edge) * clamp(d / C.r, 0, 1);
      damage(g, e, (e.kind === 'b' ? C.bdmg : C.dmg) * k, 'meteor', -1);
    }
    ev(g, { type: 'meteor', u, v });
  }
}
// an AI's ground unit inside a warning circle: where it steps to (just outside it, away from the centre), else null
function meteorDodge(g, u) {
  const A = g.meteor && g.meteor.at; if (!A) return null;
  const dx = u.u - A.u, dv = u.v - A.v, d = Math.hypot(dx, dv), R = COND.meteors.r + 25; if (d >= R) return null;
  const k = d > 1 ? R / d : 1; return d > 1 ? [clamp(A.u + dx * k, 0, L), A.v + dv * k] : [clamp(A.u + R * dirOf(u.side) * -1, 0, L), A.v];
}
