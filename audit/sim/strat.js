// Phase 7b: scripted strategy bots. One bot = an opening plus a mid-game branch. Like the Greedy bot (greedy.js) it plays a
// side through the player's own controls only (tryBuild, tryUpgrade, tryTrain, trySell, setStance, giveOrder, useAbility)
// and sees only what its side can see.
//
// Openings (the first ~4 minutes):
//   greedy   three economy buildings first, every Refinery to T2, one node runner, no army until 2:30 (as greedy.js)
//   rush     two Barracks before any economy, the basic unit nonstop, attacks at about 400 of army and keeps streaming in
//   turtle   Barracks, Refinery, a Turret on the front pad, a second Refinery, HQ T2 and a second Turret; the army holds
//            under its guns
//   contain  two Refineries and two Barracks; at about 450 of army it walks to just outside the enemy HQ's (and Turrets')
//            reach and parks there; every new unit joins it
// Mid-game branches (from the end of the opening):
//   timing   three Refineries and a War Factory; gathers short of the middle node and attacks as one at a set army value
//   contain  parks the army just outside the enemy guns, reinforced steadily; all in once clearly stronger or at its army limit
//   tech     Turrets, HQ to T3, the siege path to T3 (Titan-class units); holds until its army is at the limit, then attacks
//   air      two Tech Labs, mostly flyers, a small ground escort; attacks at a set army value
// Defence (every bot): with enemies near its base it pulls new units back under the HQ gun and holds there; it breaks out
// together once its army near home is clearly stronger than what it sees ('break', a correctly defending player). The
// 'naive' defence (the Greedy bot's: retreat to the rally flag and fight from there) is kept for the containment tests.
//
// stratBot(S, { opener, branch, defend, jitter }) returns a function (g, s, dt) to call after every update(g, dt).
const U = { // unit types per faction role
  lastfist:  { basic: 'rifle', b2: { A: 'heavy', B: 'rifle' }, b3: { A: 'sniper' }, veh: 'tank', f2: { A: 'artillery', B: 'flame' }, f3: { A: 'titan', B: 'hydra' }, air: 'aircraft', t2: { A: 'interceptor', B: 'medic' }, t3: { A: 'leviathan' } },
  bloomhost: { basic: 'skitterling', b2: { A: 'leaper', B: 'spitter' }, b3: { A: 'ravager', B: 'bilecaster' }, veh: 'bulwark', f2: { A: 'bilelobber', B: 'thornback' }, f3: { A: 'ruinmaw', B: 'dreadthorn' }, air: 'razorwing', t2: { A: 'needlewing', B: 'broodtyrant' }, t3: { A: 'cloudwing', B: 'worldrender' } },
  axiarchs:  { basic: 'shardling', b2: { A: 'riftstalker', B: 'lancer' }, b3: { A: 'parallax', B: 'marksman' }, veh: 'bastion', f2: { A: 'riftmortar', B: 'gravemantle' }, f3: { A: 'worldbreaker', B: 'eventide' }, air: 'wraithwing', t2: { A: 'prismwing', B: 'voidcarrier' }, t3: { A: 'shardstorm', B: 'sovereign' } },
};
// Per branch: production paths (actual path letters per faction), unit shares, build list (count-based, after the opening's),
// upgrades in order, and the army value it attacks with
const PATHS = {
  timing:  { lastfist: { barracks: 'A', factory: 'B', techlab: 'A' }, bloomhost: { barracks: 'B', factory: 'B', techlab: 'B' }, axiarchs: { barracks: 'B', factory: 'B', techlab: 'B' } },
  tech:    { lastfist: { barracks: 'A', factory: 'A', techlab: 'B' }, bloomhost: { barracks: 'B', factory: 'A', techlab: 'B' }, axiarchs: { barracks: 'B', factory: 'A', techlab: 'B' } },
  air:     { lastfist: { barracks: 'A', factory: 'B', techlab: 'A' }, bloomhost: { barracks: 'B', factory: 'B', techlab: 'B' }, axiarchs: { barracks: 'B', factory: 'B', techlab: 'B' } },
};
PATHS.contain = PATHS.timing;
const MIX = { // role → share; resolved to unit types with the faction's paths
  timing:  { basic: 3, b2: 2, veh: 2, f2: 1 },
  contain: { basic: 3, b2: 2, veh: 2, f2: 1 },
  tech:    { b2: 2, b3: 1, veh: 2, f3: 2, f2: 1 },
  air:     { air: 3, t2: 1, t3: 1, b2: 1, basic: 1 },
};
const BUILD = {
  timing:  ['refinery', 'refinery', 'refinery', 'barracks', 'reactor', 'habitat', 'factory', 'habitat'],
  contain: ['refinery', 'refinery', 'barracks', 'reactor', 'habitat', 'barracks', 'factory', 'refinery'],
  tech:    ['refinery', 'refinery', 'barracks', 'turret', 'reactor', 'habitat', 'factory', 'reactor'],
  air:     ['refinery', 'refinery', 'barracks', 'reactor', 'habitat', 'techlab', 'techlab', 'refinery'],
};
const UPG = {
  timing:  [['refinery', 2], ['habitat', 2], ['barracks', 2], ['factory', 2], ['reactor', 2], ['hq', 2], ['habitat', 3], ['refinery', 3], ['factory', 3], ['reactor', 3], ['barracks', 3]],
  tech:    [['hq', 2], ['turret', 2], ['refinery', 2], ['factory', 2], ['reactor', 2], ['habitat', 2], ['factory', 3], ['hq', 3], ['reactor', 3], ['barracks', 2], ['habitat', 3], ['barracks', 3], ['refinery', 3], ['turret', 3]],
  air:     [['techlab', 2], ['refinery', 2], ['reactor', 2], ['habitat', 2], ['techlab', 3], ['reactor', 3], ['habitat', 3], ['refinery', 3], ['barracks', 2], ['hq', 2]],
};
UPG.contain = UPG.timing;
const ATTACK_V = { timing: 2000, contain: 450, tech: 1e9, air: 2200 };
const OPEN = {
  greedy:  { build: ['refinery', 'refinery', 'refinery', 'barracks', 'reactor', 'habitat'], upg: [['refinery', 2], ['habitat', 2]], end: 150 },
  rush:    { build: ['barracks', 'refinery', 'barracks', 'habitat', 'refinery'], upg: [['habitat', 2]], end: 240 },
  turtle:  { build: ['barracks', 'refinery', 'turret', 'refinery', 'reactor', 'habitat', 'turret'], upg: [['hq', 2], ['turret', 2], ['refinery', 2]], end: 240 },
  contain: { build: ['barracks', 'refinery', 'refinery', 'barracks', 'reactor', 'habitat'], upg: [['refinery', 2]], end: 200 },
};
const DEFAULT_BRANCH = { greedy: 'timing', rush: 'timing', turtle: 'tech', contain: 'contain' };
const RUSH_V = 400, CONTAIN_V = 450;

function stratBot(S, o = {}) {
  const opener = o.opener || 'greedy', branch = o.branch || DEFAULT_BRANCH[opener], defend = o.defend || 'break';
  const containV = o.containV || CONTAIN_V, armyAt = o.armyAt || 150; // containV: the army a Contain parks with (heavy Contain: 1200); armyAt: when a greedy opening starts its army
  let t = 0, mode = null, launchV = 0, peakV = 0, lastNode = -1, mid = false, jit = 1, rushDone = false, attackV = 0;
  const log = { attacks: 0, firstAttack: null, defends: 0, breaks: 0, abil: 0, contain: 0, sold: 0, mid: null };
  const val = us => us.reduce((a, u) => a + S.UDEF[u.type].cost.c + S.UDEF[u.type].cost.e * 1.5, 0);
  const bot = (g, s, dt) => {
    t -= dt; if (t > 0) return; t = 0.5;
    if (mode === null) { jit = o.jitter === false ? 1 : 0.9 + Math.random() * 0.2; mode = opener === 'greedy' ? 'eco' : opener === 'turtle' ? 'home' : 'build'; attackV = ATTACK_V[branch] * jit; }
    const side = g.sides[s], fac = S.facOf(side.faction), R = U[fac], dir = s === 0 ? 1 : -1, home = S.hqU(s), opp = 1 - s, oppHq = S.hqU(opp);
    const mine = g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && !e.temp);
    const seen = g.ents.filter(e => e.kind === 'u' && e.side === opp && e.hp > 0 && S.visibleTo(g, s, e));
    const threat = seen.filter(e => Math.abs(e.u - home) < 750 && !S.UDEF[e.type].support);
    const have = {}; for (const e of g.ents) if (e.kind === 'b' && e.side === s && e.hp > 0 && e.type !== 'bunker') have[e.type] = (have[e.type] || 0) + 1;
    const cap = S.popCap(g, s), used = S.popUsed(g, s), building = g.ents.filter(e => e.kind === 'b' && e.side === s && !e.built && e.hp > 0);
    const army = mine.filter(u => !S.UDEF[u.type].support), myV = val(army);
    if (!mid && g.t >= OPEN[opener].end && (opener !== 'rush' || rushDone || g.t >= 300)) { mid = true; log.mid = Math.round(g.t); }
    const paths = PATHS[mid ? branch : (opener === 'turtle' ? 'tech' : branch)][fac];
    // 1) buildings: the opening's list, then the branch's; with no free pad, sell a building the branch has no use for
    let reserve = 0;
    const lists = mid ? [BUILD[branch]] : [OPEN[opener].build];
    let next = null;
    for (const L of lists) { const need = {}; for (const b of L) { need[b] = (need[b] || 0) + 1; if ((have[b] || 0) < need[b]) { next = b; break; } } if (next) break; }
    if (next && (next === 'factory' || next === 'techlab') && !have.barracks) next = 'barracks';
    if (next && building.length < 2) {
      const r = S.tryBuild(g, s, next);
      if (!r.ok && /pads/.test(r.msg) && mid) { // full: sell a surplus building (more than the branch's list has)
        const want = {}; for (const b of BUILD[branch]) want[b] = (want[b] || 0) + 1;
        const spare = g.ents.find(e => e.kind === 'b' && e.side === s && e.hp > 0 && e.built && e.slot >= 0 && e.type !== 'hq' && (have[e.type] || 0) > (want[e.type] || 0) && !e.queue.length);
        if (spare && S.trySell(g, s, spare).ok) log.sold++;
      } else if (!r.ok) reserve = S.BD(side.faction, next).cost.c;
    }
    if (used >= cap - 3 && cap < S.POP_MAX && !building.some(b => b.type === 'habitat') && !g.ents.some(b => b.kind === 'b' && b.side === s && b.type === 'habitat' && b.upgrading)) {
      const hab = S.alive(g, s, 'habitat').find(b => b.built && b.tier < 3);
      if (hab) S.tryUpgrade(g, s, hab); else if (side.slots.some(x => !x)) S.tryBuild(g, s, 'habitat');
    }
    // 2) upgrades, one or two at a time (the rush upgrades nothing until its attack is over)
    const ups = g.ents.filter(b => b.kind === 'b' && b.side === s && b.upgrading && b.hp > 0).length;
    const ulist = mid ? UPG[branch] : OPEN[opener].upg;
    if (ups < (side.res.c > 600 ? 3 : 2)) for (const [type, tier] of ulist) {
      if (type === 'hq' && g.t < (opener === 'turtle' || branch === 'tech' ? 80 : 240)) continue;
      if (tier === 3 && g.t < 200) continue;
      const b = S.alive(g, s, type).find(x => x.built && !x.upgrading && x.tier < tier); if (!b) continue;
      const T = S.treeOf(side.faction, type);
      const r = S.tryUpgrade(g, s, b, T && b.tier === 1 ? paths[type] : undefined);
      if (!r.ok) reserve = Math.max(reserve, Math.min(200, S.BD(side.faction, type).up[b.tier + 1].c));
      break;
    }
    // 3) units: the opening's (runner, rush stream, a small defence) and from mid-game the branch's mix
    const resolve = (role) => { const x = R[role]; if (typeof x === 'string') return x; if (!x) return null; const bt = role[0] === 'b' ? 'barracks' : role[0] === 'f' ? 'factory' : 'techlab'; return x[paths[bt]] || null; };
    const mix = {};
    if (!mid && opener === 'rush') mix[R.basic] = 1;
    else if (!mid && opener === 'contain') { mix[R.basic] = 3; const b2 = resolve('b2'); if (b2) mix[b2] = 1; }
    else if (!mid && opener === 'turtle') { mix[R.basic] = 2; mix[R.veh] = 1; }
    else for (const [role, w] of Object.entries(MIX[mid ? branch : 'timing'])) { const ty = resolve(role); if (ty) mix[ty] = (mix[ty] || 0) + w; }
    const armyTime = (mid && g.t >= armyAt) || opener !== 'greedy' || g.t >= armyAt || threat.length > 0;
    if (opener === 'greedy' && have.barracks && mine.length < 1 && !mid) S.tryTrain(g, s, R.basic);
    if (armyTime) {
      const counts = {}; for (const u of mine) counts[u.type] = (counts[u.type] || 0) + 1;
      const keep = threat.length ? 0 : !mid && opener === 'rush' ? (have.barracks >= 2 ? 0 : reserve * 0.5) : reserve * (!mid && opener === 'contain' ? 1 : 0.5); // the rush trains nonstop once both Barracks stand
      for (let k = 0; k < 5; k++) {
        const opts = Object.keys(mix).filter(ty => S.canTrain(g, s, ty) && g.ents.some(b => b.side === s && b.kind === 'b' && S.canMake(b, ty) && b.queue.length < 2));
        if (!opts.length) { if (S.canTrain(g, s, R.basic) && side.res.c > 400) opts.push(R.basic); else break; }
        const tot = Object.values(counts).reduce((a, b) => a + b, 0) + 1, W = Object.values(mix).reduce((a, b) => a + b, 0) || 1;
        opts.sort((a, b) => (counts[a] || 0) / tot - (mix[a] || 0.5) / W - ((counts[b] || 0) / tot - (mix[b] || 0.5) / W));
        const pick = opts.find(ty => side.res.c - S.UDEF[ty].cost.c >= keep && side.res.e >= S.UDEF[ty].cost.e);
        if (!pick || !S.tryTrain(g, s, pick).ok) break;
        counts[pick] = (counts[pick] || 0) + 1;
      }
    }
    // 4) the army
    const guns = []; // enemy guns it knows of (HQ at its last seen tier, Turrets): it parks outside their reach
    for (const gh of Object.values(g.fog[s].ghosts)) if (gh.side === opp) { const bd = S.BD(gh.fac, gh.type), gun = bd && bd.gun && bd.gun[gh.tier || 1]; if (gun) guns.push(gh.u - dir * gun.range); }
    const hqGun = S.BD(g.sides[opp].faction, 'hq').gun[g.fog[s].lastHQ.tier || 1].range;
    const containU = dir > 0 ? Math.min(oppHq - hqGun - 45, ...guns.map(x => x - 45)) : Math.max(oppHq + hqGun + 45, ...guns.map(x => x + 45));
    const flagU = S.NODE_U[1] - dir * 90, homeU = home + dir * 110;
    const order = u => { if (side.stance === 'attack' || side.stance === 'retreat') S.setStance(g, s, 'hold'); if (!side.orders.all || side.orders.all.u !== u) S.giveOrder(g, s, 'all', null, 'move', u, 0, true); };
    const nearHome = army.filter(u => Math.abs(u.u - home) < 800), thV = val(threat);
    // defence first: enemies near the base
    if (threat.length && mode !== 'attack' && mode !== 'contain') {
      if (mode !== 'defend' && mode !== 'breakout') { log.defends++; mode = 'defend'; }
      if (defend === 'naive') { if (side.stance !== 'retreat' || side.orders.all) S.setStance(g, s, 'retreat'); }
      else if (mode === 'defend') {
        // hold deep in the base, under the HQ gun, until clearly stronger than what is outside; then out together
        if (side.stance !== 'hold') S.setStance(g, s, 'hold');
        order(homeU);
        if (val(nearHome) >= thV * 1.3 && val(nearHome) >= 250) { mode = 'breakout'; log.breaks++; }
      }
      if (mode === 'breakout') {
        const tgt = threat.reduce((a, e) => Math.abs(e.u - home) < Math.abs(a.u - home) ? e : a, threat[0]);
        order(Math.max(0, Math.min(S.L, Math.round(tgt.u))));
        if (val(nearHome) < thV * 0.8) mode = 'defend';
      }
    } else if (mode === 'defend' || mode === 'breakout') { mode = mid ? null : (opener === 'greedy' && g.t < 150 ? 'eco' : null); S.setStance(g, s, 'hold'); }
    if (mode === null || mode === 'build') {
      if (!mid) mode = opener === 'rush' ? 'build' : opener === 'turtle' ? 'home' : opener === 'contain' ? 'build' : 'gather';
      else mode = branch === 'contain' ? 'gather' : branch === 'tech' ? 'home' : 'gather';
    }
    if (mode === 'eco') { // the greedy runner walks the nodes (as greedy.js)
      const nodes = s === 0 ? [0, 1, 2] : [2, 1, 0], k = nodes.find(i => g.nodes[i].owner !== s);
      if (k !== undefined && army.length) { const u = g.nodes[k].u - dir * (k === nodes[2] ? 55 : 0); if (lastNode !== k || !side.orders.all) { S.giveOrder(g, s, 'all', null, 'move', u, 0); lastNode = k; } }
      if (g.t >= 150) { mode = 'gather'; lastNode = -1; }
    }
    if (mode === 'build') { // rush and contain openings: gather at home, then go
      order(home + dir * 300);
      if (opener === 'rush' && myV >= RUSH_V * jit && !rushDone) { S.setStance(g, s, 'attack'); mode = 'attack'; launchV = myV; peakV = myV; log.attacks++; if (log.firstAttack === null) log.firstAttack = g.t; }
      else if (opener === 'contain' && myV >= containV * jit) { mode = 'contain'; peakV = myV; log.contain++; if (log.firstAttack === null) log.firstAttack = g.t; }
      else if (rushDone) mode = 'gather';
    }
    if (mode === 'home') { // the turtle: hold under its guns; attack once at the army limit (or late)
      order(home + dir * 200);
      const at = used >= Math.min(S.POP_MAX, cap) - 4 && cap >= S.POP_MAX - 10;
      if ((mid && (at || g.t > 840) && myV > 1500) || (mid && branch !== 'tech')) { mode = branch === 'contain' ? 'contain' : 'gather'; }
      if (at && myV > 1500) { S.setStance(g, s, 'attack'); mode = 'attack'; launchV = myV; log.attacks++; if (log.firstAttack === null) log.firstAttack = g.t; }
    }
    if (mode === 'gather') {
      if (branch === 'contain' && mid && myV >= containV * jit) { mode = 'contain'; peakV = myV; log.contain++; }
      else {
        order(flagU);
        const there = army.filter(u => Math.abs(u.u - flagU) < 170);
        if (val(there) >= attackV || (used >= cap - 2 && cap >= S.POP_MAX - 4 && val(there) >= myV * 0.8)) {
          S.setStance(g, s, 'attack'); mode = 'attack'; launchV = myV; log.attacks++; if (log.firstAttack === null) log.firstAttack = g.t;
        }
      }
    }
    if (mode === 'contain') {
      order(containU);
      peakV = Math.max(peakV, myV);
      const theirV = val(seen.filter(e => Math.abs(e.u - oppHq) < 900));
      if ((myV >= Math.max(2500, theirV * 3) && used >= cap - 6) || (cap >= S.POP_MAX - 4 && used >= cap - 3)) { S.setStance(g, s, 'attack'); mode = 'attack'; launchV = myV; log.attacks++; }
      else if (myV < peakV * 0.35 && peakV > 300) { mode = 'gather'; peakV = 0; if (!mid) mid = true; } // the contain broke: regroup
    } else if (mode === 'attack') {
      if (myV < launchV * 0.4) {
        if (opener === 'rush' && !mid) { rushDone = true; }
        S.setStance(g, s, 'hold'); mode = branch === 'tech' && mid ? 'home' : 'gather'; attackV *= 1.15;
      } else launchV = Math.max(launchV * 0.98, Math.min(launchV, myV));
    }
    if (opener === 'rush' && !mid && g.t >= 240 && !rushDone) rushDone = true;
    // 5) commander abilities (as greedy.js)
    const ab = S.FACTIONS[fac].abil;
    for (const k of ab) {
      const A = S.ABIL[k], like = A.like || k; if (!S.abilityCheck(g, s, k).ok) continue;
      let tgt = null;
      if (like === 'shield') {
        for (const m of army) { const foes = seen.filter(e => Math.hypot(e.u - m.u, e.v - m.v) < 200).length, own = army.filter(q => Math.hypot(q.u - m.u, q.v - m.v) < A.r).length; if (foes >= 3 && own >= 4 && (!tgt || own > tgt.n)) tgt = { u: m.u, v: m.v, n: own }; }
      } else if (like === 'strike') {
        for (const e of seen) { if (k !== 'strike' && S.UDEF[e.type].air) continue; const n = seen.filter(x => Math.hypot(x.u - e.u, x.v - e.v) < A.r).length; if (n >= 4 && (!tgt || n > tgt.n)) tgt = { u: e.u, v: e.v, n }; }
      } else {
        const hurt = army.filter(m => m.hp < m.maxHp * 0.5);
        for (const m of hurt) { const n = hurt.filter(q => Math.hypot(q.u - m.u, q.v - m.v) < A.r).length; if (n >= 4 && (!tgt || n > tgt.n)) tgt = { u: k === 'brood' ? m.u - dir * 30 : m.u, v: m.v, n }; }
      }
      if (tgt && S.useAbility(g, s, k, tgt.u, tgt.v).ok) { log.abil++; break; }
    }
    log.mode = mode;
  };
  bot.log = log;
  return bot;
}
module.exports = { stratBot, OPEN, DEFAULT_BRANCH, MIX, BUILD, UPG, PATHS, U };
