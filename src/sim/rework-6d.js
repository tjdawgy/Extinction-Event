/* ---------- Batch 6d, Part A (v2.94, docs/FACTION_REWORK.md "Batch 6d"): the AI personality fix (REWORK.b6ai) ----------
   Stored per game in g.rw (rwB6ai). Off: v2.93's AI exactly; nothing below runs or is saved. On, for the Hard preset only
   (Easy and Normal keep their pools and their personalities' play):
   - Hard's personality pool is Boomer, Economist and Turtle in equal thirds for every faction (B6AI.pool; v2.93: Last Fist
     Boomer 2/4, Economist 1/4, Turtle 1/4; Bloomhost Boomer 3/4, Turtle 1/4; the Axiarchs Boomer 2/3, Turtle 1/3).
   - Why the two lost (audit/logs-p1/selfplay6d-base/diag-a1.md): both took only Hard's two Refineries (the Economist's plan
     names three, the cap cut it to two) and upgraded them late, so from 4:00 they earned 25-50% less than the Boomer and
     fielded less; the Economist then sat at its supply cap with money banked, the Turtle starved with idle production.
   - b6aiPersona: their plans and dials when rolled (no random numbers of its own, so the dice that follow are unchanged):
     the Economist: a third Refinery (refDelta), Refineries to T2 at once and on to T3, a Habitat upgrade early (supply);
     the Turtle: its Refineries to T2 and T3 early (two Refineries upgraded beat three on its eight pads with a Turret), its
     Turret and HQ upgrades after them, a lower edge before a base attack (attackEdge), and its deadline earlier.
   - aiB6ai (each AI decision): the Economist spends what passes B6AI.eco.cap (no floating) and attacks once its army leads
     (B6AI.eco.lead); the Turtle attacks once its army passes B6AI.turtle.army or the time B6AI.turtle.at with an even
     army, and counterattacks right after a defence it won (enemies were in its base within B6AI.turtle.won s, none now,
     its army at least B6AI.turtle.counter of theirs). The Boomer is unchanged. */
const rwB6ai = g => !!(g && g.rw && g.rw.b6ai);
const B6AI = {
  pool: ['boomer', 'economist', 'turtle'], calmUp: true,
  // the Economist: the Boomer's greedy opening (three Refineries first, a small army until 2:30), then its own tech paths and
  // unit tastes, Refineries on to T3 (it out-earns), money spent past cap, and a base attack once its army leads by lead
  eco: { plan: ['refinery', 'refinery', 'refinery', 'barracks', 'reactor', 'habitat', 'factory', 'techlab'], refDelta: 1, upShift: -75, earlyFill: 0.35, cap: 600, lead: 1.1, min: 900, from: 300,
    upgFirst: [['refinery', 2], ['refinery', 2], ['refinery', 2], ['reactor', 2], ['habitat', 2], ['barracks', 2], ['refinery', 3], ['reactor', 3], ['habitat', 3], ['refinery', 3], ['factory', 2], ['refinery', 3], ['techlab', 2]] },
  // the Turtle: a Turret on the front pad by its fourth building, three Refineries, no Tech Lab (a ground fortress: it fights
  // near home with what its Barracks and War Factory make), a small army until 2:30 under the Turret and HQ gun, the Turret
  // and its economy upgraded early, and attacks on an army size, a time, or right after a defence it won
  turtle: { plan: ['refinery', 'barracks', 'refinery', 'turret', 'refinery', 'reactor', 'habitat', 'factory'], refDelta: 1, earlyFill: 0.35, upShift: -60, attackEdge: 1, deadline: 540,
    army: 2500, armyEdge: 1, at: 540, atEdge: 0.9, won: 25, counter: 1, counterMin: 600,
    upgFirst: [['refinery', 2], ['refinery', 2], ['refinery', 2], ['habitat', 2], ['turret', 2], ['reactor', 2], ['barracks', 2], ['factory', 2], ['hq', 2], ['refinery', 3], ['reactor', 3], ['habitat', 3]] },
};
function b6aiPersona(P) {
  const k = P.kind === 'economist' ? B6AI.eco : P.kind === 'turtle' ? B6AI.turtle : null;
  if (!k) return;
  P.b6 = 1; // the batch 6d rules apply to this personality (saved with it)
  for (const f of ['refDelta', 'upShift', 'earlyFill', 'attackEdge', 'deadline']) if (k[f] !== undefined) P[f] = k[f];
  if (k.plan) P.plan = k.plan.slice();
  P.upgFirst = k.upgFirst.map(a => a.slice());
}
// The credit level above which the AI buys what it can now (v2.38's flush at 900; the batch 6d Economist at B6AI.eco.cap)
// v2.94: the batch 6d Turtle and Economist keep upgrading while merely threatened (B6AI.calmUp; v2.93 held every upgrade)
const b6aiCalmUp = (g, P) => !!(B6AI.calmUp && rwB6ai(g) && P && P.b6);
const b6aiFlush = (g, P) => rwB6ai(g) && P && P.b6 && P.kind === 'economist' ? B6AI.eco.cap : 900;
// A batch 6d push this decision, or null: [pushTo, mode] with pushTo null for the enemy base. c: the decision's numbers
function aiB6ai(g, s, P, c) {
  if (!rwB6ai(g) || !P || !P.b6) return null;
  const side = g.sides[s], base = c.nSiege >= 2 ? [c.siegeLine, 'siege'] : [null, 'all'];
  if (P.kind === 'economist') {
    const E = B6AI.eco;
    if (g.t >= E.from && c.myV >= E.min && c.myV >= c.thV * E.lead && !c.threat) return base;
    return null;
  }
  const T = B6AI.turtle;
  if (!c.threat && side.lastDanger !== undefined && g.t - side.lastDanger < T.won && c.myV >= T.counterMin && c.myV >= c.thV * T.counter) return base; // a defence won: out after them
  if (c.myV >= T.army && c.myV >= c.thV * T.armyEdge) return base;
  if (g.t >= T.at && c.myV >= 500 && c.myV >= c.thV * T.atEdge) return base;
  return null;
}

/* ---------- Batch 6d, Part B (v2.94): faction balance (REWORK.b6d) ----------
   Stored per game in g.rw (rwB6d). Off: v2.93's numbers; nothing below changes anything. On: B6D's values, each aimed at one
   cause found in Part B1 (docs/BALANCE_AUDIT.md "After batch 6d"):
   - yard: Salvage Yard values (YARD's keys) read through b6Yard;
   - unit: per-unit values played through the per-game definition (rwD) and, for health and shields, set when a unit appears
     (rw6dSpawn); UDEF untouched. */
const rwB6d = g => !!(g && g.rw && g.rw.b6d);
// Each value names the B1 cause it answers (audit/logs-p1/selfplay6d-a3/B1.md); v2.93's value in the comment
const B6D = {
  yard: { pct: 0.07 },        // 1. Last Fist's income edge: the Salvage Yard's share of a kill's price (YARD.pct 0.14 with BALANCE; base Salvage 0.07)
  unit: {
    tank: { dmg: 32 },        // 2. the Tank carries Last Fist's army through both front lines (42)
    shardling: { hp: 120 },   // 3. the Axiarchs' most-funded unit fails its front-line role (80; shields 75 unchanged)
    artillery: { dmg: 34 },   // 4. Artillery, the most efficient unit massed, unanswered at range (45 a salvo with b6art; deploy and telegraph unchanged)
  },
};
const b6Yard = (g, k) => rwB6d(g) && B6D.yard[k] !== undefined ? B6D.yard[k] : YARD[k];
const rw6dUnit = (g, t) => rwB6d(g) ? B6D.unit[t] || null : null;
function rw6dSpawn(g, u) {
  const o = B6D.unit[u.type]; if (!o) return;
  if (o.hp !== undefined) { u.hp = u.maxHp = o.hp; }
  if (o.shp !== undefined) { u.shp = u.maxShp = o.shp; }
}
