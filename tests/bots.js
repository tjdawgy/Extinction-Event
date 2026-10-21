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
    const threat = units(g, 1 - s).some(u => Math.abs(u.u - sim.hqU(s)) < 650);
    const enemyAir = units(g, 1 - s).filter(u => sim.UDEF[u.type].air).length;
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

const BOTS = { rush: rushBot, turtle: turtleBot };

// Play one match: bot on side 0 against the AI on side 1
function playMatch(sim, diffKey, botName, { maxT = 1800 } = {}) {
  const g = sim.newGame(diffKey);
  const bot = BOTS[botName](sim);
  while (!g.over && g.t < maxT) { sim.update(g, STEP); bot(g, 0, STEP); }
  return { winner: g.over ? g.winner : -1, t: g.t, stats: g.sides.map(s => ({ ...s.stats })), attacks: bot.log.attacks, g };
}

module.exports = { rushBot, turtleBot, BOTS, playMatch, STEP };
