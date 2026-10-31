// Phase 7a: the scripted "Greedy" bot, modelled on how a human beat v2.40 Hard (three matches, one per faction, won in
// 7-9 minutes on 1.6-1.8x Hard's income). It plays side 0 (the player's slot) through the player's own controls only
// (tryBuild, tryUpgrade, tryTrain, setStance, giveOrder, useAbility) and sees only what side 0 can see.
//   0:00-0:21  three economy buildings (Refineries or their faction's role)
//   ~0:30      a Barracks, one or two cheap units that walk the three field nodes to take them
//   to ~1:00   every Refinery to T2, then a Reactor and a Habitat
//   to ~2:30   minimal army: only the node runners, unless it is attacked (then it trains at once and defends)
//   2:00+      War Factory and Tech Lab, production upgrades, Habitat upgrades; from 2:30 a mixed army
//   army       gathers at a regroup flag short of the middle node; attacks once the army there is big enough, casts
//              its abilities in the fight, falls back and regroups when the attack has lost most of its strength
// greedyBot(S, opts) returns a function (g, s, dt) to call after every update(g, dt).
const COMP = { // a mixed army per faction: unit types and target shares; paths for its production buildings
  lastfist: { units: { rifle: 3, heavy: 2, tank: 2, flame: 1, aircraft: 1.5 }, paths: { barracks: 'A', factory: 'B', techlab: 'B' } },
  bloomhost: { units: { skitterling: 3, spitter: 2, bulwark: 2, thornback: 1, razorwing: 1.5 }, paths: { barracks: 'B', factory: 'B', techlab: 'A' } },
  axiarchs: { units: { shardling: 3, lancer: 2, bastion: 2, gravemantle: 1, wraithwing: 1.5 }, paths: { barracks: 'B', factory: 'B', techlab: 'A' } },
};
const RUNNER = { lastfist: 'rifle', bloomhost: 'skitterling', axiarchs: 'shardling' };
const ORDER = ['refinery', 'refinery', 'refinery', 'barracks', 'reactor', 'habitat', 'factory', 'techlab'];
const UPG = [['refinery', 2], ['habitat', 2], ['barracks', 2], ['factory', 2], ['reactor', 2], ['hq', 2], ['techlab', 2], ['habitat', 3], ['refinery', 3], ['reactor', 3], ['factory', 3], ['barracks', 3]];
function greedyBot(S, o = {}) {
  const armyAt = o.armyAt || 150, attackV = o.attackV || 1600, runners = o.runners || 1;
  let t = 0, phase = 'eco', launchV = 0, lastNode = -1;
  const log = { attacks: 0, firstAttack: null, defends: 0, abil: 0 };
  const val = us => us.reduce((a, u) => a + S.UDEF[u.type].cost.c + S.UDEF[u.type].cost.e * 1.5, 0);
  const bot = (g, s, dt) => {
    t -= dt; if (t > 0) return; t = 0.5;
    const side = g.sides[s], fac = S.facOf(side.faction), C = COMP[fac], dir = s === 0 ? 1 : -1, home = S.hqU(s), opp = 1 - s;
    const mine = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && !e.temp);
    const seen = g.ents.filter(e => e.kind === 'u' && e.side === opp && e.hp > 0 && S.visibleTo(g, s, e));
    const threat = seen.filter(e => Math.abs(e.u - home) < 700 && !S.UDEF[e.type].support);
    const have = {}; for (const e of g.ents) if (e.kind === 'b' && e.side === s && e.hp > 0) have[e.type] = (have[e.type] || 0) + 1;
    const cap = S.popCap(g, s), used = S.popUsed(g, s), build = g.ents.filter(e => e.kind === 'b' && e.side === s && !e.built && e.hp > 0);
    const armyTime = g.t >= armyAt || threat.length > 0; // greed ends at 2:30, or as soon as it is attacked
    // 1) the build order, count-based (a lost building is rebuilt); credits are saved for the next one
    let reserve = 0;
    const need = {}; let next = null;
    for (const b of ORDER) { need[b] = (need[b] || 0) + 1; if ((have[b] || 0) < need[b]) { next = b; break; } }
    // the War Factory and Tech Lab wait for the economy (or an attack)
    if (next && (next === 'factory' || next === 'techlab') && g.t < 100 && !threat.length) next = null;
    if (next && (next !== 'barracks' || (have.refinery || 0) >= 3)) { const r = S.tryBuild(g, s, next); if (!r.ok && build.length < 2) reserve = S.BD(side.faction, next).cost.c; }
    if (used >= cap - 3 && cap < S.POP_MAX && !build.some(b => b.type === 'habitat') && !g.ents.some(b => b.kind === 'b' && b.side === s && b.type === 'habitat' && b.upgrading)) {
      const hab = S.alive(g, s, 'habitat').find(b => b.built && b.tier < 3);
      if (hab) S.tryUpgrade(g, s, hab); else if (side.slots.some(x => !x)) S.tryBuild(g, s, 'habitat');
    }
    // 2) upgrades: Refineries first (all T2 by about 1:00), then production and supply; one or two at a time
    const ups = g.ents.filter(b => b.kind === 'b' && b.side === s && b.upgrading && b.hp > 0).length;
    if (ups < (side.res.c > 600 ? 3 : 2)) for (const [type, tier] of UPG) {
      if (type === 'hq' && g.t < 240) continue;
      if (tier === 3 && g.t < 200) continue;
      const b = S.alive(g, s, type).find(x => x.built && !x.upgrading && x.tier < tier); if (!b) continue;
      const T = S.treeOf(side.faction, type);
      const r = S.tryUpgrade(g, s, b, T && b.tier === 1 ? C.paths[type] : undefined);
      if (!r.ok && type === 'refinery' && tier === 2) reserve = Math.max(reserve, 120);
      break;
    }
    // 3) units: the node runners first; the army from 2:30 (or when attacked), mixed to the faction's target shares
    const runnerT = RUNNER[fac];
    if (have.barracks && mine.length < runners && side.res.c - S.UDEF[runnerT].cost.c >= reserve * 0.5) S.tryTrain(g, s, runnerT);
    if (armyTime) {
      const counts = {}; for (const u of mine) counts[u.type] = (counts[u.type] || 0) + 1;
      for (let k = 0; k < 4; k++) {
        const opts = Object.keys(C.units).filter(ty => S.canTrain(g, s, ty) && g.ents.some(b => b.side === s && b.kind === 'b' && S.canMake(b, ty) && b.queue.length < 2));
        if (!opts.length) break;
        const tot = Object.values(counts).reduce((a, b) => a + b, 0) + 1;
        opts.sort((a, b) => (counts[a] || 0) / tot - C.units[a] / 10 - ((counts[b] || 0) / tot - C.units[b] / 10));
        const pick = opts.find(ty => side.res.c - S.UDEF[ty].cost.c >= (threat.length ? 0 : reserve * 0.5) && side.res.e >= S.UDEF[ty].cost.e);
        if (!pick || !S.tryTrain(g, s, pick).ok) break;
        counts[pick] = (counts[pick] || 0) + 1;
      }
    }
    // 4) the army: defend, walk the nodes, gather at the flag, attack, fall back
    const army = mine.filter(u => !S.UDEF[u.type].support), myV = val(army);
    const flagU = S.NODE_U[1] - dir * 90;
    if (threat.length && phase !== 'attack') {
      if (side.stance !== 'retreat' || side.orders.all) { S.setStance(g, s, 'retreat'); log.defends++; }
      phase = 'defend';
    } else if (phase === 'defend') { phase = armyTime ? 'gather' : 'eco'; S.setStance(g, s, 'hold'); }
    if (phase === 'eco') {
      // the runners walk the nodes: own, middle, the enemy's (standing at its near edge, just outside the HQ gun)
      const nodes = s === 0 ? [0, 1, 2] : [2, 1, 0];
      const k = nodes.find(i => g.nodes[i].owner !== s);
      if (k !== undefined && army.length) {
        const u = g.nodes[k].u - dir * (k === nodes[2] ? 55 : 0);
        if (lastNode !== k || !side.orders.all) { S.giveOrder(g, s, 'all', null, 'move', u, 0); lastNode = k; }
      } else if (k === undefined && army.length && lastNode !== -2) { S.giveOrder(g, s, 'all', null, 'move', S.NODE_U[1], 0); lastNode = -2; }
      if (armyTime) { phase = 'gather'; lastNode = -1; }
    }
    if (phase === 'gather') {
      if (!side.orders.all || side.orders.all.u !== flagU) S.giveOrder(g, s, 'all', null, 'move', flagU, 0);
      const there = army.filter(u => Math.abs(u.u - flagU) < 160);
      if (val(there) >= attackV || (used >= cap - 2 && cap >= S.POP_MAX - 4 && val(there) >= val(army) * 0.8)) {
        S.setStance(g, s, 'attack'); phase = 'attack'; launchV = myV; log.attacks++; if (log.firstAttack === null) log.firstAttack = g.t;
      }
    } else if (phase === 'attack') {
      if (myV < launchV * 0.4) { S.setStance(g, s, 'retreat'); phase = 'gather'; }
      else launchV = Math.max(launchV * 0.98, Math.min(launchV, myV) + 0); // reinforcements don't raise the bar
    }
    // 5) commander abilities, aimed like a player: a shield-type on its fighting cluster, a strike-type on the densest
    // enemy clump it can see, a heal or recall type on a hurt group
    const ab = S.FACTIONS[fac].abil;
    for (const k of ab) {
      const A = S.ABIL[k], like = A.like || k; if (!S.abilityCheck(g, s, k).ok) continue;
      let tgt = null;
      if (like === 'shield') {
        for (const m of army) {
          const foes = seen.filter(e => Math.hypot(e.u - m.u, e.v - m.v) < 200).length, own = army.filter(o => Math.hypot(o.u - m.u, o.v - m.v) < A.r).length;
          if (foes >= 3 && own >= 4 && (!tgt || own > tgt.n)) tgt = { u: m.u, v: m.v, n: own };
        }
      } else if (like === 'strike') {
        for (const e of seen) { if (k !== 'strike' && S.UDEF[e.type].air) continue; const n = seen.filter(x => Math.hypot(x.u - e.u, x.v - e.v) < A.r).length; if (n >= 4 && (!tgt || n > tgt.n)) tgt = { u: e.u, v: e.v, n }; }
      } else { // repair-type: a hurt group (Emergency Brood: in front of its own army when it is fighting)
        const hurt = army.filter(m => m.hp < m.maxHp * 0.5);
        for (const m of hurt) { const n = hurt.filter(o => Math.hypot(o.u - m.u, o.v - m.v) < A.r).length; if (n >= 4 && (!tgt || n > tgt.n)) tgt = { u: k === 'brood' ? m.u - dir * 30 : m.u, v: m.v, n }; }
      }
      if (tgt && S.useAbility(g, s, k, tgt.u, tgt.v).ok) { log.abil++; break; }
    }
  };
  bot.log = log;
  return bot;
}
module.exports = { greedyBot, COMP };
