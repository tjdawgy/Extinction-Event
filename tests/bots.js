// Scripted players that drive side 0 through the same actions the UI uses
// (tryBuild / tryTrain / tryUpgrade / setStance). The built-in AI plays side 1.
const STEP = 1 / 30;

const units = (g, s, type) => g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0 && (!type || e.type === type));
const building = (g, s, type) => g.ents.filter(e => e.kind === 'b' && e.side === s && e.type === type && e.hp > 0);
const constructing = (g, s) => g.ents.filter(e => e.kind === 'b' && e.side === s && !e.built && e.hp > 0);

// Run fn every `sec` seconds of game time
function every(sec, fn) { let t = 0; return (g, s, dt) => { t -= dt; if (t <= 0) { t = sec; fn(g, s); } }; }

// Rifleman rush: two Barracks straight away, a third later, Riflemen only, attack at ~8 alive
function rushBot(sim, { attackAt = 8, regroupAt = 3 } = {}) {
  let attacking = false;
  const log = { attacks: 0 };
  const bot = every(0.5, (g, s) => {
    const side = g.sides[s], nB = building(g, s, 'barracks').length, rifles = units(g, s, 'rifle').length;
    const cap = sim.popCap(g, s), used = sim.popUsed(g, s);
    if (nB < 2) sim.tryBuild(g, s, 'barracks');
    else {
      if (used >= cap - 1 && cap < 80 && !constructing(g, s).some(b => b.type === 'habitat')) sim.tryBuild(g, s, 'habitat');
      for (let k = 0; k < 3; k++) if (!sim.tryTrain(g, s, 'rifle').ok) break;
      if (nB < 3 && rifles >= 4 && side.res.c >= 200) sim.tryBuild(g, s, 'barracks');
      if (building(g, s, 'refinery').length < 1 && side.res.c >= 260) sim.tryBuild(g, s, 'refinery');
    }
    if (!attacking && rifles >= attackAt) { sim.setStance(g, s, 'attack'); attacking = true; log.attacks++; }
    else if (attacking && rifles < regroupAt) { sim.setStance(g, s, 'retreat'); attacking = false; }
  });
  bot.log = log;
  return bot;
}

// Configurable Rifleman rush, for calibrating against how a human rushes. Uses only the player's controls.
//   order:     build order, each item built as soon as affordable (credits are saved for it)
//   attackAt:  attack the enemy base once this many Riflemen are alive (1 = stream from the first one)
//   attackT:   ...or once this much time has passed (whichever comes first)
//   holdU:     before the base attack, push to this point and Hold there (field nodes = income)
//   regroupAt: fall back below this many (0 = never retreat; reinforcements keep streaming)
//   habitat:   add Habitats when the army is full; queue: Riflemen kept queued per Barracks
function rushXBot(sim, o = {}) {
  const { order = ['barracks', 'barracks', 'barracks'], attackAt = 1, attackT = 1e9, holdU = null, regroupAt = 0, habitat = true, queue = 2 } = o;
  let phase = holdU === null ? 'build' : 'field', step = 0;
  const log = { attacks: 0 };
  const bot = every(0.5, (g, s) => {
    const side = g.sides[s], B = building(g, s, 'barracks'), army = units(g, s, 'rifle');
    const cap = sim.popCap(g, s), used = sim.popUsed(g, s);
    // build order (count-based, so lost buildings are rebuilt)
    const have = {}; for (const e of g.ents) if (e.kind === 'b' && e.side === s && e.hp > 0) have[e.type] = (have[e.type] || 0) + 1;
    const need = {}; let next = null;
    for (const t of order) { need[t] = (need[t] || 0) + 1; if ((have[t] || 0) < need[t]) { next = t; break; } }
    let reserve = 0;
    if (next) { if (!sim.tryBuild(g, s, next).ok) reserve = sim.BDEF[next].cost.c; }
    if (habitat && used >= cap - 1 && cap < 80 && !constructing(g, s).some(b => b.type === 'habitat')) sim.tryBuild(g, s, 'habitat');
    for (let k = 0; k < 6; k++) {
      const ready = B.filter(b => b.built && b.hp > 0);
      if (!ready.length || Math.min(...ready.map(b => b.queue.length)) >= queue || side.res.c - 50 < reserve || !sim.tryTrain(g, s, 'rifle').ok) break;
    }
    // army control
    const n = army.length, front = n ? Math.max(...army.map(u => u.u)) : 0;
    if (phase === 'field') {
      if (n >= 3 && side.stance !== 'attack' && front < holdU - 40) sim.setStance(g, s, 'attack');
      if (side.stance === 'attack' && front >= holdU) sim.setStance(g, s, 'hold');
      if (n >= attackAt || g.t >= attackT) { phase = 'attack'; }
    }
    if (phase !== 'field') {
      if (side.stance !== 'attack' && (n >= attackAt || g.t >= attackT) && n > 0) { sim.setStance(g, s, 'attack'); log.attacks++; }
      else if (side.stance === 'attack' && regroupAt && n < regroupAt) sim.setStance(g, s, 'retreat');
    }
  });
  bot.log = log;
  return bot;
}

// Turtle / tech: economy and a Turret first, upgrades and heavy units, attack only with a near-full army
const TURTLE_PLAN = ['refinery', 'reactor', 'barracks', 'turret', 'refinery', 'factory', 'habitat', 'techlab'];
const TURTLE_UPG = [['turret', 2], ['refinery', 2], ['reactor', 2], ['hq', 2], ['factory', 2], ['habitat', 2], ['techlab', 2],
  ['barracks', 2], ['turret', 3], ['refinery', 3], ['reactor', 3], ['hq', 3], ['factory', 3], ['techlab', 3], ['habitat', 3], ['barracks', 3]];
const TURTLE_UNITS = ['titan', 'aircraft', 'tank', 'heavy', 'rifle'];
function turtleBot(sim, { attackFill = 0.85 } = {}) {
  let attacking = false, launched = 0, trained = 0;
  const log = { attacks: 0 };
  const bot = every(0.5, (g, s) => {
    const side = g.sides[s], cap = sim.popCap(g, s), used = sim.popUsed(g, s);
    // 1) build the plan in order, at most two at a time
    const need = {}; let want = null;
    for (const t of TURTLE_PLAN) { need[t] = (need[t] || 0) + 1; if (building(g, s, t).length < need[t]) { want = t; break; } }
    const reserve = { c: 0, e: 0 }; // money set aside for the next building or upgrade
    if (want && constructing(g, s).length < 2 && (!sim.BDEF[want].req || sim.hasBuilt(g, s, sim.BDEF[want].req))) {
      if (!sim.tryBuild(g, s, want).ok) Object.assign(reserve, sim.BDEF[want].cost);
    }
    // 2) one upgrade at a time once the base is up (or if money piles up)
    if ((!want || side.res.c > 600) && !g.ents.some(b => b.kind === 'b' && b.side === s && b.upgrading && b.hp > 0)) {
      for (const [type, tier] of TURTLE_UPG) {
        const b = building(g, s, type).find(x => x.built && x.tier < tier);
        if (!b) continue;
        if (!sim.tryUpgrade(g, s, b).ok && !want) { const up = sim.BDEF[type].up[b.tier + 1]; reserve.c = up.c; reserve.e = up.e; }
        break;
      }
    }
    // 3) the best unit it can afford without eating the reserve (anything goes when enemies are near the base)
    const seen = units(g, 1 - s).filter(u => sim.visibleTo(g, s, u)); // fog of war: only what the bot can see
    const threat = seen.some(u => Math.abs(u.u - sim.hqU(s)) < 650);
    const enemyAir = seen.filter(u => sim.UDEF[u.type].air).length;
    const order = enemyAir >= 3 ? ['interceptor', ...TURTLE_UNITS] : trained % 4 === 3 ? ['aircraft', ...TURTLE_UNITS] : TURTLE_UNITS;
    const unlocked = t => building(g, s, sim.UDEF[t].from).some(b => b.built && b.tier >= sim.UDEF[t].tier);
    if (threat) { for (const t of order) if (sim.tryTrain(g, s, t).ok) { trained++; break; } }
    else {
      const best = order.find(unlocked); // save up for the best unit rather than filling up on cheap ones
      const c = best && sim.UDEF[best].cost;
      if (best && side.res.c - c.c >= reserve.c && side.res.e - c.e >= reserve.e && sim.tryTrain(g, s, best).ok) trained++;
    }
    // 4) hold at home; attack with a nearly full army, fall back when it is cut down
    const army = units(g, s).length;
    if (!attacking && used >= 24 && used >= cap * attackFill) { sim.setStance(g, s, 'attack'); attacking = true; launched = army; log.attacks++; }
    else if (attacking && army < launched * 0.4) { sim.setStance(g, s, 'retreat'); attacking = false; }
    else if (!attacking && side.stance === 'retreat' && units(g, s).every(u => Math.abs(u.u - sim.rallyU(s)) < 120)) sim.setStance(g, s, 'hold');
  });
  bot.log = log;
  return bot;
}

// Smart defender: the best counter to a Rifleman rush we could script, with the player's controls only.
// Barracks for early Riflemen, a Turret on the front pad, then economy and a War Factory for Tanks
// (splash, and 1,867 effective HP against rifle fire). Holds under the HQ and Turret, counterattacks with Tanks.
//   plan: build order; turretPad: pad for the first Turret; holdDist: hold this far out from the HQ
//   (a node), else at the rally flag; holdMin: only walk out with at least this many units;
//   riflesFirst: keep this many Riflemen before spending on Tanks
function defenderBot(sim, o = {}) {
  const { plan = ['barracks', 'turret', 'refinery', 'factory', 'refinery', 'habitat', 'reactor'], attackTanks = 5, attackArmy = 1e9, turretPad = 4, holdDist = null, holdMin = 3, riflesFirst = 0 } = o;
  let attacking = false, launched = 0;
  const log = { attacks: 0 };
  const bot = every(0.5, (g, s) => {
    const side = g.sides[s], cap = sim.popCap(g, s), used = sim.popUsed(g, s);
    const have = {}; for (const e of g.ents) if (e.kind === 'b' && e.side === s && e.hp > 0) have[e.type] = (have[e.type] || 0) + 1;
    const need = {}; let next = null;
    for (const t of plan) { need[t] = (need[t] || 0) + 1; if ((have[t] || 0) < need[t]) { next = t; break; } }
    const seen = units(g, 1 - s).filter(u => sim.visibleTo(g, s, u));
    const threat = seen.some(u => Math.abs(u.u - sim.hqU(s)) < 700);
    const reserve = { c: 0, e: 0 };
    if (next && (!sim.BDEF[next].req || sim.hasBuilt(g, s, sim.BDEF[next].req))) {
      const r = sim.tryBuild(g, s, next, next === 'turret' ? turretPad : -1);
      if (!r.ok) Object.assign(reserve, sim.BDEF[next].cost);
    }
    if (used >= cap - 2 && cap < 80 && !constructing(g, s).some(b => b.type === 'habitat')) sim.tryBuild(g, s, 'habitat');
    const hurt = g.ents.find(b => b.kind === 'b' && b.side === s && b.built && b.hp > 0 && !(b.repair > 0) && b.hp < b.maxHp * 0.5);
    if (hurt && !threat) sim.tryRepair(g, s, hurt);
    // Tanks once possible; Riflemen while waiting or under pressure
    const tanks = sim.hasBuilt(g, s, 'factory'), nRifle = units(g, s, 'rifle').length;
    const can = t => side.res.c - sim.UDEF[t].cost.c >= reserve.c && side.res.e - sim.UDEF[t].cost.e >= reserve.e;
    if (tanks && nRifle >= riflesFirst && can('tank')) sim.tryTrain(g, s, 'tank');
    else if ((!tanks || threat || nRifle < riflesFirst) && (threat || can('rifle'))) for (let k = 0; k < 3; k++) if (!sim.tryTrain(g, s, 'rifle').ok) break;
    // hold at home; counterattack with a Tank core
    const army = units(g, s), nTank = army.filter(u => u.type === 'tank').length;
    if (!attacking && (nTank >= attackTanks || army.length >= attackArmy)) { sim.setStance(g, s, 'attack'); attacking = true; launched = army.length; log.attacks++; }
    else if (attacking && army.length < launched * 0.4) { sim.setStance(g, s, 'retreat'); attacking = false; }
    else if (!attacking && side.stance === 'retreat' && army.every(u => Math.abs(u.u - sim.rallyU(s)) < 120)) sim.setStance(g, s, 'hold');
    else if (!attacking && holdDist !== null && army.length >= holdMin) { // walk out to the node, then hold there
      const dir = s === 0 ? 1 : -1, spot = sim.hqU(s) + dir * holdDist, front = dir > 0 ? Math.max(...army.map(u => u.u)) : Math.min(...army.map(u => u.u));
      if (side.stance !== 'attack' && dir * (spot - front) > 40) sim.setStance(g, s, 'attack');
      else if (side.stance === 'attack' && dir * (front - spot) >= 0) sim.setStance(g, s, 'hold');
    }
  });
  bot.log = log;
  return bot;
}

const BOTS = { rush: rushBot, turtle: turtleBot, rushx: rushXBot, defender: defenderBot };

// Bot vs bot: botA plays side 0, botB side 1; the built-in AI is switched off
function duel(sim, makeA, makeB, { maxT = 1800 } = {}) {
  const g = sim.newGame('normal'), A = makeA(sim), B = makeB(sim);
  g.sides[1].res = { c: 300, e: 60 }; g.diff = { ...g.diff, inc: 1 }; // a bot duel is even: no AI starting or income bonus
  while (!g.over && g.t < maxT) { g.sides[1].aiT = 1e9; sim.update(g, STEP); A(g, 0, STEP); B(g, 1, STEP); }
  return { winner: g.over ? g.winner : -1, t: g.t, g };
}

// Play one match: bot on side 0 against the AI on side 1 (botName, or a factory sim => bot)
function playMatch(sim, diffKey, botName, { maxT = 1800, botOpts } = {}) {
  const g = sim.newGame(diffKey);
  const bot = typeof botName === 'function' ? botName(sim) : BOTS[botName](sim, botOpts);
  while (!g.over && g.t < maxT) { sim.update(g, STEP); bot(g, 0, STEP); }
  return { winner: g.over ? g.winner : -1, t: g.t, stats: g.sides.map(s => ({ ...s.stats })), attacks: bot.log.attacks, g };
}

module.exports = { rushBot, turtleBot, rushXBot, defenderBot, BOTS, playMatch, duel, STEP, every, units, building, constructing };
