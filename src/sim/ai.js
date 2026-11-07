/* ---------- Enemy AI: same economy, same rules, same upgrades as the player ---------- */
// Known base defenses: the enemy HQ gun plus remembered Turrets, each at its last-seen tier
const HQ_VAL = 400, TURRET_VAL = 300;
function knownDefense(g, s) {
  const f = g.fog[s];
  return HQ_VAL * f.lastHQ.tier + Object.values(f.ghosts).reduce((a, b) => a + (b.type === 'turret' ? TURRET_VAL * b.tier : 0), 0);
}
// After a base attack fails, the next one needs a clearly bigger army; the bar fades out so nobody waits forever
const FAIL_MARGIN = 1.3, FAIL_MEMORY = 150;
function attackBar(g, s) {
  const side = g.sides[s];
  return side.failV ? side.failV * Math.max(0, 1 - (g.t - side.failT) / FAIL_MEMORY) : 0;
}
// The AI's path for a building going to T2. Easy: the personality's taste. Normal and Hard: an armored or airborne
// enemy (as this side has seen it) calls for Specialists (Heavies); a second copy takes the path the first lacks.
function aiPickPath(g, s, b, P, theirs) {
  if (g.forcePath && g.forcePath[s] && g.forcePath[s][b.type]) return g.forcePath[s][b.type]; // test hook (forced-path matrix)
  const fac = g.sides[s].faction, to = p => aiPathTo(fac, b.type, p); // decided in Last Fist terms, then translated (Bloomhost, v2.19)
  const D = aiDiff(g, s), def = (P.paths && P.paths[b.type]) || 'A';
  if (D.label === 'Easy') return to(def);
  const have = g.ents.filter(e => e !== b && e.side === s && e.type === b.type && e.hp > 0).map(e => aiPathFrom(fac, b.type, e.path || e.upPath)).filter(Boolean);
  if (b.type === 'barracks' && aiArmorShare(theirs) > 0.35 && !have.includes('A')) return to('A');
  if (b.type === 'factory' && aiFix(P, 'counter') && theirs.length >= 5 && aiLightShare(theirs) >= (aiDials(P).flood || 0.55) && !have.includes('B')) return to('B'); // v2.41 (counter): an infantry flood, the Assault path (Flame Tanks)
  if (have.length && have.includes(def)) return to(def === 'A' ? 'B' : 'A');
  return to(def);
}
const aiLightShare = theirs => { let a = 0, t = 0; for (const u of theirs) { const d = UDEF[u.type], v = (d.cost.c + d.cost.e) * u.w; t += v; if (d.armor === 'light') a += v; } return t ? a / t : 0; };
const aiArmorShare = theirs => { let a = 0, t = 0; for (const u of theirs) { const d = UDEF[u.type], v = (d.cost.c + d.cost.e) * u.w; t += v; if (d.armor === 'vehicle' || (d.air && d.hitsGround !== false)) a += v; } return t ? a / t : 0; };
function freeProducer(g, s, unit) { return g.ents.some(e => e.side === s && canMake(e, unit) && e.queue.length < 1); }

function aiUpdate(g, s, dt) {
  const side = g.sides[s];
  side.aiT -= dt;
  if (side.aiT > 0) return;
  const D = aiDiff(g, s);
  side.aiT = D.delay * aiDials(side.persona).delay * rand(0.8, 1.2); // v2.38: the reaction-delay dial (legacy 1)
  const opp = 1 - s, dir = dirOf(s), fog = g.fog[s], oppTier = fog.lastHQ.tier;

  const mine = [];
  for (const e of g.ents) if (e.hp > 0 && e.kind === 'u' && e.side === s) mine.push(e);
  // The enemy army as this side knows it: units it has seen, fading out over INTEL_TTL seconds
  const theirs = Object.values(fog.intel).map(m => ({ type: m.type, u: m.u, w: Math.max(0, 1 - (g.t - m.t) / INTEL_TTL), fresh: g.t - m.t <= THREAT_MEMORY }));
  const myV = armyValue(mine);
  let thV = armyValue(theirs);
  // v2.41 (est): the enemy army it hasn't seen still exists: at least what the economy it has scouted could have paid for
  if (aiFix(side.persona, 'est')) thV = Math.max(thV, aiEstimate(g, s));
  const near = theirs.filter(u => u.fresh && Math.abs(u.u - hqU(s)) < 650);
  const threat = near.length > 0;
  const danger = near.some(u => Math.abs(u.u - hqU(s)) < 430); // enemies inside the base, not just nearby
  const nearLight = armyValue(near.filter(u => UDEF[u.type].armor === 'light'));
  const lightThreat = threat && nearLight >= armyValue(near) * 0.5;
  const infantryRush = lightThreat && nearLight >= 400; // a real rush (about 8 Riflemen), not a couple of scouts
  const calm = D.calmTech && threat, saving = D.calmSave && threat; // threat-aware: hold tech; save for counters
  // v2.40 (hold): an early push by a mostly light (infantry) army at least 0.8× its strength: stay home under the HQ gun, put
  // up the defence and the vehicle building, save for the counter (Tank, Bulwark, Bastion) instead of feeding the basic unit
  const theirLight = theirs.filter(e => e.fresh && UDEF[e.type].armor === 'light');
  const holdEarly = aiFix(side.persona, 'hold') && g.t < 480 && theirLight.length >= 4 && armyValue(theirLight) >= armyValue(theirs.filter(e => e.fresh)) * 0.5 && aiPower(mine) < aiPower(theirs.filter(e => e.fresh)) * 1.25;
  if (aiFix(side.persona, 'hold')) side.defU = holdEarly ? hqU(s) + dir * 170 : (side.defU === undefined ? undefined : null);
  // v2.42 (breakout): a camp at its base (fresh enemy fighters within 750 of the HQ). Weaker there: hold deep under the HQ gun
  const bo = aiFix(side.persona, 'breakout'), camp = bo ? theirs.filter(e => e.fresh && Math.abs(e.u - hqU(s)) < 750 && !UDEF[e.type].support) : [];
  const campV = armyValue(camp), homeArmy = bo ? mine.filter(u => Math.abs(u.u - hqU(s)) < 800 && !UDEF[u.type].support && !UDEF[u.type].air) : [];
  if (bo) {
    // a camp it saw in the last 15 s still counts (holding deep, it loses sight of the camp)
    if (camp.length && campV >= 150) { if (side.pressT === undefined) side.pressT = g.t; side.campT = g.t; side.campP = aiPower(camp); side.campU = camp.reduce((a, e) => a + e.u, 0) / camp.length; }
    else if (!(g.t - (side.campT ?? -99) < 15)) side.pressT = undefined;
    const camped = g.t - (side.campT ?? -99) < 15;
    side.boHold = camped && aiPower(homeArmy) < side.campP * 1.4;
    if (side.boHold) side.defU = hqU(s) + dir * 140; else if (!holdEarly && side.defU != null) side.defU = null;
  }
  if (side.spotsRush === undefined) side.spotsRush = simRnd() < D.turret; // reaction quality, decided once per match
  const cap = popCap(g, s);
  let used = popUsed(g, s);
  const reserve = { c: 0, e: 0 };
  const fill = D.armyCap + (1 - D.armyCap) * clamp((g.t - 720) / 480, 0, 1); // share of the army limit it uses
  const P = side.persona || (side.persona = rollPersona()), dl = aiDials(P), smart = aiSmart(P); // v2.38: the preset's dials and competence
  // v2.41 (read): what its scouting says about the opponent's opening; a greedy one is punished (army first) for up to 2:30
  const rd = aiFix(P, 'read');
  if (rd) aiRead(g, s, thV);
  const punishOn = rd && side.greedT !== undefined && !side.punished && g.t < side.greedT + 150;
  const fillNow = g.t < (aiFix(P, 'fill') ? 150 : 300) && !threat && !punishOn && !(aiFix(P, 'fill') && thV >= myV * 0.7 && thV > 0) ? Math.min(fill, P.earlyFill) : fill; // a greedy opening fields less until 5:00 (unless threatened)
  const log = side.aiLog || (side.aiLog = { firstAttack: null, attacks: 0, feints: 0, firstUpgrade: null, trained: {} });
  if (danger) side.lastDanger = g.t;
  // Adapting: an Aggressor whose attacks keep failing turns to economy for a while;
  // an Economist that finds itself outgunned near home drops its greed and defends
  const ecoMood = (side.moodUntil || 0) > g.t;
  const defend = P.kind === 'economist' && threat && myV < thV * 0.6;
  // Under real pressure every personality drops its style and plays the standard defense (the safety floor)
  const pressed = threat && (infantryRush || myV < thV * 0.8);
  const sig = SIG.on && bdS(g, s, 'sigA') ? (dl.sig || (P.kind === 'aggressor' || P.kind === 'trickster' ? 'sigA' : 'sigB')) : null; // v2.43: a preset can name its signature building (dial sig)
  const sigLate = aiFix(P, 'sig'), planBase = pressed ? AI_PLAN : P.plan; // v2.40 (sig): the plan keeps its economy; the signature building comes later
  const sigPad = sigPadOn(); // v2.43: the signature building has its own pad: no plan pad given up for it
  const plan = sigLate || sigPad ? planBase : aiPlanWith(planBase, sig);
  const sigDup = sigLate && sig ? planBase[aiPlanWith(planBase, '#').indexOf('#')] : null; // the duplicate it trades for the signature building once that pays
  const sigReady = !!sig && g.t >= (sigLate ? Math.max(dl.sigAt, AI_SIG_LATE) : dl.sigAt) && !(calm || defend) && !countB(g, s, sig) && hasBuilt(g, s, 'barracks') && alive(g, s, 'refinery').filter(b => b.built).length >= Math.min(D.refineries, plan.filter(t => t === 'refinery').length);
  const ad = rd && aiFix(P, 'adapt'); // v2.42 (adapt): read the opening and answer it
  if (ad && g.t < 240) {
    if (side.turtleT === undefined && Object.values(fog.ghosts).some(gh => gh.side !== s && gh.type === 'turret')) { side.turtleT = g.t; lg(g, s, 'G', 'turtle', 0); }
    if (side.rushT === undefined && g.t < 180 && armyValue(theirs.filter(e => e.fresh)) >= 250 && armyValue(mine) < 250) { side.rushT = g.t; lg(g, s, 'G', 'rush', 0); }
  }
  const refCap = clamp(D.refineries + P.refDelta + dl.eco + (ecoMood ? 1 : 0) - (defend && P.refDelta > 0 ? P.refDelta : 0) + (ad && side.turtleT !== undefined ? 1 : 0), 1, 4);

  // 1) Economy and tech
  const constructing = g.ents.filter(e => e.kind === 'b' && e.side === s && !e.built && e.hp > 0);
  const freePad = side.slots.some(x => !x);
  let want = null, wantPad = -1, planIdx = -1;
  const inc0 = income(g, s), starved = aiFix(P, 'power') && g.t > 120 && side.res.e < 100 && inc0.e < inc0.c * 0.2; // v2.41 (power): energy starved (under a fifth of its credit income)
  if (cap < POP_MAX && used >= cap - 3 && !constructing.some(b => b.type === 'habitat') && freePad) want = 'habitat';
  else if (starved && hasBuilt(g, s, 'barracks') && countB(g, s, 'reactor') < 3 && freePad && !constructing.some(b => b.type === 'reactor')) want = 'reactor'; // v2.41 (power)
  else if (holdEarly && hasBuilt(g, s, 'barracks') && countB(g, s, 'turret') < 1 && freePad) { want = 'turret'; wantPad = side.slots[4] ? -1 : 4; } // v2.40 (hold)
  else if (holdEarly && hasBuilt(g, s, 'barracks') && countB(g, s, 'factory') < 1 && freePad) want = 'factory'; // v2.40 (hold): the vehicle counter
  else if (ad && side.rushT !== undefined && g.t < 300 && hasBuilt(g, s, 'barracks') && countB(g, s, 'turret') < 1 && freePad) { want = 'turret'; wantPad = side.slots[4] ? -1 : 4; } // v2.42 (adapt): an early army seen, a Turret now
  else if (bo && side.pressT !== undefined && g.t - side.pressT > 5 && hasBuilt(g, s, 'barracks') && countB(g, s, 'turret') < (campV > 900 ? 2 : 1) && freePad) { want = 'turret'; wantPad = side.slots[4] ? -1 : 4; } // v2.42 (breakout): pressure, a Turret at once
  else if (side.spotsRush && infantryRush && countB(g, s, 'turret') < (armyValue(near) > 800 ? 2 : 1)) { want = 'turret'; wantPad = side.slots[4] ? -1 : 4; } // front pad
  else if (calm && hasBuilt(g, s, 'barracks') && countB(g, s, 'factory') < 1) want = 'factory'; // the Tank counter to an infantry rush
  else if (P.kind === 'aggressor' && D.label !== 'Easy' && !threat && hasBuilt(g, s, 'barracks') && countB(g, s, 'factory') < 1 && aiFortified(g, s)) want = 'factory'; // a fortified enemy: Tanks to crack it (HQ T2 for the Orbital Strike, below)
  else if (D.eco && !defend && side.res.e > ENERGY_PLENTY * 2 && side.res.c < 300 && countB(g, s, 'refinery') < 4 &&
    (countB(g, s, 'habitat') > 0 || side.slots.filter(x => !x).length >= 2)) want = 'refinery'; // turn spare energy into credits (leaving room for a Habitat)
  else if (D.eco && side.res.e < 120 && side.res.c > 800 && countB(g, s, 'reactor') < 3 &&
    (countB(g, s, 'habitat') > 0 || side.slots.filter(x => !x).length >= 2)) want = 'reactor'; // credits to spare but no energy: another Reactor
  // its signature building (v2.32), once its economy (the difficulty's Refineries, or all its plan has if fewer) and first
  // production building are up, and not while under pressure (like tech); it takes the pad of a duplicate the plan gave up for it (aiPlanWith)
  else if (sigReady && (sigPad ? !sigOnPad(g, s) : freePad || !sigLate || aiSigRoom(g, s, sigDup, sig))) want = sig;
  else if (dl.turrets && !threat && countB(g, s, 'turret') < dl.turrets && hasBuilt(g, s, 'barracks') && side.slots.filter(x => !x).length >= 2) want = 'turret'; // the defense dial (v2.38)
  else {
    const need = {};
    for (const t of plan) {
      if (t === sig && !sigReady) continue; // placed by the branch above, never before its trigger
      if (t === 'refinery' && (need.refinery || 0) >= refCap) continue;
      if (t === 'reactor' && side.res.e > ENERGY_PLENTY) continue; // energy to spare: no new Reactor
      if ((calm || defend) && (t === 'techlab' || t === 'reactor')) continue;  // no tech while under pressure
      if (punishOn && (t === 'techlab' || (t === 'refinery' && (need.refinery || 0) >= 2))) continue; // v2.41 (read): army first while punishing
      need[t] = (need[t] || 0) + 1;
      if (countB(g, s, t) < need[t]) { want = t; planIdx = plan.indexOf(t); if (t === 'turret' && !side.slots[4]) wantPad = 4; break; }
    }
  }
  // A fortified enemy: the Aggressor gets HQ T2 at once, which unlocks the Orbital Strike (until v2.16 it built a War Factory)
  if (P.kind === 'aggressor' && D.label !== 'Easy' && abList(side).includes('strike') && !threat && side.hq.tier < 2 && !side.hq.upgrading && aiFortified(g, s)) {
    const r = tryUpgrade(g, s, side.hq);
    if (!r.ok) { const up = bdS(g, s, 'hq').up[2]; reserve.c = Math.max(reserve.c, up.c); reserve.e = Math.max(reserve.e, up.e); }
  }
  // No Habitat and no free pad: the army is stuck at the HQ's 12. Sell a spare Reactor or extra Refinery to make room.
  if (!freePad && countB(g, s, 'habitat') === 0 && cap < POP_MAX && D.eco && dl.sell) {
    const spare = alive(g, s, 'reactor').find(b => side.res.e > ENERGY_PLENTY) || (countB(g, s, 'refinery') > 2 && alive(g, s, 'refinery')[0]);
    if (spare) { trySell(g, s, spare); want = 'habitat'; }
  }
  // v2.40 (finish): clearly winning (after 10:00, the enemy army it knows of under a third of its own), rich, at its army limit, every Habitat at T3 and no free pad: sell a building that has done its job (a
  // Reactor while energy is plentiful, a third Refinery, a Turret when not threatened) for another Habitat, so the bank
  // becomes army instead of sitting idle while it grinds down a base
  if (aiFix(P, 'finish') && g.t > 600 && thV < myV * 0.33 && !freePad && cap < POP_MAX && used >= cap * fill - 3 && side.res.c > 1200 && !constructing.length && alive(g, s, 'habitat').every(b => b.tier >= 3)) {
    const spare = (side.res.e > 400 && countB(g, s, 'reactor') > 1 && alive(g, s, 'reactor')[0]) || (countB(g, s, 'refinery') > 2 && alive(g, s, 'refinery')[0]) || (!threat && alive(g, s, 'turret')[0]);
    if (spare) { trySell(g, s, spare); want = 'habitat'; }
  }
  // v2.60 (supply, ATTACK.supply): at its army limit with money banked, every Habitat at T3 and no free pad, trade a
  // building that has done its job for another Habitat, winning or not (before, only 'finish' did this, when 3x ahead):
  // two Hard AIs stood at 34 supply with 5,000+ banked, so every loss was rebuilt at once and no army could grow
  if (aiFix(P, 'supply') && g.t > ATTACK.supply.from && !freePad && cap < POP_MAX && used >= cap * fill - 3 && side.res.c > ATTACK.supply.bank && !constructing.length && alive(g, s, 'habitat').every(b => b.tier >= Math.min(3, D.maxTier))) { // v2.61: its own top tier (Easy stops at T2)
    const rich = side.res.c > ATTACK.supply.bank * 3;
    const spare = (side.res.e > 400 && countB(g, s, 'reactor') > 1 && alive(g, s, 'reactor')[0]) || (countB(g, s, 'refinery') > (rich ? 1 : 2) && alive(g, s, 'refinery')[0]) || (!threat && alive(g, s, 'turret')[0]);
    if (spare) { trySell(g, s, spare); want = 'habitat'; }
  }
  // Credits piling up with no energy and no free pad: trade an extra Refinery for a Reactor
  if (!freePad && D.eco && dl.sell && side.res.e < 120 && side.res.c > (starved && alive(g, s, 'reactor').every(b => b.tier >= 3) ? 600 : 1500) && countB(g, s, 'refinery') > (aiFix(P, 'spend') && countB(g, s, 'reactor') < 2 ? 1 : 2) && !constructing.length) { // v2.38 (Default): also with 2 Refineries while it has under 2 Reactors
    trySell(g, s, alive(g, s, 'refinery')[0]); want = 'reactor';
  }
  if (!want && D.label === 'Hard' && !g.forcePath && freePad && !constructing.length && income(g, s).c >= 25 && aiArmorShare(theirs) > 0.35) {
    const bar = alive(g, s, 'barracks');
    if (bar.length && bar.length < 2 && bar.every(b => aiPathFrom(side.faction, 'barracks', b.path || b.upPath) === 'B')) want = 'barracks'; // then its T2 upgrade takes Specialists
  }
  if (want && (side.slots.some(x => !x) || (sigPad && want === sig)) && (constructing.length < 2 || (bo && want === 'turret' && side.pressT !== undefined))) { // v2.42 (breakout): the pressure Turret doesn't wait for other construction
    const d = bdS(g, s, want);
    if (!d.req || hasBuilt(g, s, d.req)) {
      const r = tryBuild(g, s, want, wantPad);
      if (!r.ok && (!threat || saving) && !(P.unitsFirst && planIdx >= 4 && !threat) && !(punishOn && want !== 'habitat' && want !== 'barracks')) reserve.c = d.cost.c, reserve.e = d.cost.e;
    }
  }

  // The Extinction Event: keep the HQ standing first (paid Repair is all that works in the storm)
  if (g.t >= EXT.start && side.hq.hp > 0 && side.hq.hp < side.hq.maxHp * 0.9 && !(side.hq.repair > 0) && side.res.c > 150) tryRepair(g, s, side.hq);
  // Repair a badly damaged building when the coast is clear
  if (!threat && side.res.c > 600) {
    const hurt = g.ents.find(b => b.kind === 'b' && b.side === s && b.type !== 'bunker' && b.built && b.hp > 0 && !(b.repair > 0) && b.hp < b.maxHp * 0.6);
    if (hurt) tryRepair(g, s, hurt);
  }

  // 2) Upgrades; a calm AI holds them while threatened; Reactor upgrades wait until energy runs short
  const upgrading = g.ents.some(b => b.kind === 'b' && b.side === s && b.upgrading && b.hp > 0);
  const floating = side.res.c > 700 && side.res.e > 200;
  const buildDone = !want || !freePad || constructing.length > 0;
  const rich2 = aiFix(P, 'spend') && side.res.c > 1500 && g.ents.filter(b => b.kind === 'b' && b.side === s && b.upgrading && b.hp > 0).length < 2; // v2.38 (Default): rich, a second upgrade at once
  const tf = dl.tech || (aiFix(P, 'tech') ? AI_TECH[P.kind] : null), techFocus = tf ? [[tf, 2], [tf, 3]] : []; // v2.40 (tech): its strategy's building goes to T3 right after T2 (the tech dial: the Hard preset's searched order)
  if (g.t >= D.upStart + P.upShift - (ecoMood ? 30 : 0) && (!upgrading || rich2) && (buildDone || floating) && (!(calm || defend) || floating) && !(punishOn && !floating) && !(D.maxTier < 3 && simRnd() < 0.5)) {
    const energyShort = (side.res.e < 120 && side.res.c > 800) || starved; // v2.41 (power): starved, the Reactor upgrade first
    for (const [type, tier] of [...(energyShort ? [['reactor', 2], ['reactor', 3]] : []), ...(rich2 ? [['habitat', 2], ['habitat', 3], ['reactor', 2], ['reactor', 3]] : []), ...P.upgFirst, ...techFocus, ...AI_UPG]) {
      if (rich2 && upgrading && alive(g, s, type).some(x => x.upgrading)) continue;
      if (tier > D.maxTier) continue;
      if (type === 'reactor' && side.res.e > ENERGY_PLENTY) continue;
      if (prodLocked(side.faction, type)) continue; // no paths yet (Axiarch production, v2.25)
      const b = alive(g, s, type).find(x => x.built && x.tier < tier);
      if (!b) continue;
      const r = tryUpgrade(g, s, b, b.tier === 1 && TREES[type] ? aiPickPath(g, s, b, P, theirs) : undefined);
      if (r.ok && log.firstUpgrade === null) log.firstUpgrade = g.t;
      if (!r.ok && !floating) { const up = bdOf(b).up[b.tier + 1]; reserve.c = Math.max(reserve.c, up.c * 0.8); reserve.e = Math.max(reserve.e, up.e * 0.8); }
      break;
    }
  }

  // The Aggressor's answer to a fortified enemy: keep enough back for an Orbital Strike on its known defences
  if (P.kind === 'aggressor' && D.label !== 'Easy' && !threat && abilUnlocked(g, s, ABIL.strike) && side.ab.strike - g.t < 15 && aiFortified(g, s) && (side.stance === 'attack' || side.ab.strike > g.t)) {
    reserve.c = Math.max(reserve.c, ABIL.strike.cost.c); reserve.e = Math.max(reserve.e, ABIL.strike.cost.e);
  }
  // 3) Army: counter what the opponent fields, bring siege guns against a turtle
  // Echoes (v2.34, minimal): an Axiarch AI warps an echo back whenever it can afford one and has supply room (oldest first)
  const rel = relOf(g, s);
  if (rel && rel.ech && rel.ech.length) for (let i = 0; i < rel.ech.length; i++) if (tryEcho(g, s, i).ok) { used = popUsed(g, s); break; }
  const types = UNIT_ORDER.filter(t => canTrain(g, s, t) && !(UDEF[t].max && UDEF[t].pop < 1 && unitCount(g, s, t) >= UDEF[t].max)); // v2.37: not a type at its limit (S1; the drone keeps its own rule)
  if (rd && g.t > 30 && g.t < 240 && side.greedT === undefined && !mine.length && !g.ents.some(b => b.side === s && b.kind === 'b' && b.queue && b.queue.length)) { // v2.41 (read): a scout of its own
    const c = types.filter(t => !UDEF[t].air && UDEF[t].cost.c <= 100).sort((a, b) => UDEF[a].cost.c - UDEF[b].cost.c)[0];
    if (c && tryTrain(g, s, c).ok) { log.trained[c] = (log.trained[c] || 0) + 1; used = popUsed(g, s); }
  }
  const turtle = theirs.length > 2 && theirs.filter(u => Math.abs(u.u - hqU(opp)) < 560).length / theirs.length > 0.6;
  if (types.length) {
    const comp = { light: 0, heavy: 0, vehicle: 0, air: 0 };
    let tot = 0;
    // Interceptors can't touch the ground, so only ground-attacking aircraft count as an air threat
    // (counting them made both sides race to build Interceptors against each other's Interceptors)
    for (const u of theirs) { const d = UDEF[u.type], v = (d.cost.c + d.cost.e) * u.w; comp[d.armor === 'air' && d.hitsGround === false ? 'harmless' : d.armor] = (comp[d.armor === 'air' && d.hitsGround === false ? 'harmless' : d.armor] || 0) + v; tot += v; }
    if (tot > 0) for (const k in comp) comp[k] /= tot;
    const antiAir = theirs.length ? theirs.filter(u => UDEF[u.type].hitsAir).length / theirs.length : 0.5;
    const airV = theirs.reduce((a, u) => a + (UDEF[u.type].air && UDEF[u.type].hitsGround !== false ? (UDEF[u.type].cost.c + UDEF[u.type].cost.e) * u.w : 0), 0);
    const myInterceptV = mine.reduce((a, u) => a + (u.type === 'interceptor' ? UDEF.interceptor.cost.c + UDEF.interceptor.cost.e : 0), 0);
    const nArt = mine.filter(u => AI_ART.includes(u.type)).length;
    const nFront = mine.filter(u => !UDEF[u.type].air && !AI_ART.includes(u.type)).length;
    const nInf = mine.filter(u => GROUP_OF[u.type] === 'inf').length, nMed = mine.filter(u => u.type === 'medic').length, nDrone = mine.filter(u => u.type === 'drone').length;
    const sc = {
      rifle: 0.9 + comp.light * 0.6 + comp.air * 0.8 - comp.vehicle * 0.7 - comp.heavy * 0.5 - (types.length > 3 ? 0.4 : 0),
      heavy: 0.9 + comp.vehicle * 1.6 + comp.air * 1.6 + comp.heavy * 0.6,
      sniper: 0.8 + comp.light * 1.4 + comp.heavy * 1.0 - comp.vehicle * 1.0 - comp.air * 0.6,
      tank: 1.3 + comp.light * 1.2 + comp.heavy * 0.9 - comp.air * 0.9,
      artillery: (nFront >= 3 && nArt < Math.max(2, nFront / 2.5)) ? 1.1 + comp.light * 0.5 + (turtle ? 0.8 : 0) + (oppTier - 1) * 0.3 : 0.1,
      titan: 1.2 + comp.vehicle * 0.8 + comp.heavy * 0.8 + comp.light * 0.4 - comp.air * 1.2 + (turtle ? 0.4 : 0),
      aircraft: 1.2 + comp.vehicle * 1.2 + comp.heavy * 0.4 - comp.air * 0.3 + (antiAir < 0.45 ? 0.9 : 0),
      // only while its Interceptors don't already outnumber the enemy's ground-attack aircraft
      interceptor: comp.air > 0.12 && myInterceptV < airV * 1.2 ? 1 + comp.air * 3.2 : 0.05,
      flame: 1.3 + comp.light * 2.2 + comp.heavy * 0.6 - comp.vehicle * 1.0 - comp.air * 0.8, // simple scoring for now (v2.14)
      hydra: 1.4 + comp.air * 2.0 + comp.light * 0.7 - comp.vehicle * 0.8,
      leviathan: 1.7 + comp.vehicle * 0.5 + (turtle ? 0.8 : 0) - antiAir * 1.2, // simple scoring for now (v2.15)
      medic: nInf >= 6 && nMed < nInf / 8 ? 0.9 + nInf / Math.max(1, mine.length) * 1.2 : 0.05,
      drone: nDrone < 1 ? 1.0 : 0.05,
      // Bloomhost (v2.17): scored like their Last Fist counterparts; Skitterlings can't hit aircraft
      skitterling: 0.9 + comp.light * 0.5 - comp.vehicle * 0.6 - comp.heavy * 0.3 - comp.air * 0.4 - (types.length > 2 ? 0.3 : 0),
      bulwark: 1.3 + comp.light * 1.0 + comp.heavy * 0.7 - comp.air * 0.9,
      razorwing: 1.2 + comp.vehicle * 1.0 + comp.light * 0.4 + comp.air * 0.6 + (antiAir < 0.45 ? 0.9 : 0), // v2.19: it hits aircraft too
      // Bloomhost tree units (v2.19): simple scores in the style of their Last Fist counterparts
      leaper: 1.0 + comp.light * 0.8 - comp.vehicle * 0.6 - comp.air * 0.4,
      ravager: 1.2 + comp.light * 1.2 + comp.heavy * 0.3 - comp.vehicle * 0.6 - comp.air * 0.5,
      spitter: 1.0 + comp.air * 2.0 + comp.heavy * 0.5 + comp.vehicle * 0.3,
      bilecaster: 1.1 + comp.light * 1.4 + comp.heavy * 0.6 - comp.air * 0.6,
      bilelobber: (nFront >= 3 && nArt < Math.max(2, nFront / 2.5)) ? 1.1 + comp.light * 0.5 + (turtle ? 0.8 : 0) + (oppTier - 1) * 0.3 : 0.1,
      ruinmaw: 1.2 + comp.vehicle * 0.8 + comp.heavy * 0.8 + comp.light * 0.4 - comp.air * 1.2 + (turtle ? 0.4 : 0),
      thornback: 1.3 + comp.light * 1.0 + comp.heavy * 0.6 - comp.air * 0.8,
      dreadthorn: 1.4 + comp.light * 1.4 + comp.heavy * 0.6 - comp.air * 0.9,
      // Bloomspire tree (v2.21): simple scores; none of the four hits aircraft
      needlewing: 1.0 + comp.light * 0.6 + comp.vehicle * 0.4 - comp.air * 0.6 + (antiAir < 0.45 ? 0.7 : 0),
      cloudwing: 1.3 + comp.light * 0.8 + comp.vehicle * 0.4 - comp.air * 0.6 + (antiAir < 0.45 ? 0.8 : 0),
      broodtyrant: 1.5 + comp.vehicle * 0.6 + (turtle ? 0.8 : 0) - antiAir * 1.0 - comp.air * 0.5,
      worldrender: 1.7 + comp.vehicle * 0.5 + (turtle ? 0.8 : 0) - antiAir * 1.2 - comp.air * 0.5,
      // Axiarch base units (v2.25): scored like their Last Fist counterparts
      shardling: 0.9 + comp.light * 0.5 - comp.vehicle * 0.5 - comp.air * 0.4 - (types.length > 2 ? 0.3 : 0),
      bastion: 1.3 + comp.light * 1.0 + comp.heavy * 0.7 - comp.air * 0.9,
      wraithwing: 1.2 + comp.vehicle * 1.0 + comp.light * 0.4 + comp.air * 0.6 + (antiAir < 0.45 ? 0.9 : 0),
      // Axiarch tree units (v2.27): simple scores in the style of their Last Fist counterparts
      riftstalker: 1.0 + comp.light * 0.9 - comp.vehicle * 0.6 - comp.air * 0.4,
      parallax: 1.2 + comp.light * 1.1 + comp.heavy * 0.4 - comp.vehicle * 0.5 - comp.air * 0.5,
      lancer: 1.0 + comp.air * 2.0 + comp.heavy * 0.5 + comp.vehicle * 0.3,
      marksman: 0.8 + comp.light * 1.4 + comp.heavy * 1.0 - comp.vehicle * 1.0 - comp.air * 0.6,
      riftmortar: (nFront >= 3 && nArt < Math.max(2, nFront / 2.5)) ? 1.1 + comp.light * 0.5 + (turtle ? 0.8 : 0) + (oppTier - 1) * 0.3 : 0.1,
      worldbreaker: 1.2 + comp.vehicle * 0.8 + comp.heavy * 0.8 + comp.light * 0.4 - comp.air * 1.2 + (turtle ? 0.4 : 0),
      gravemantle: 1.3 + comp.light * 1.6 + comp.heavy * 0.6 - comp.vehicle * 0.6 - comp.air * 0.8,
      eventide: 1.4 + comp.light * 1.2 + comp.heavy * 0.6 - comp.air * 0.9,
      // Celestial Array tree (v2.29): simple scores in the style of the Bloomspire's
      prismwing: 1.0 + comp.light * 0.6 + comp.vehicle * 0.4 - comp.air * 0.6 + (antiAir < 0.45 ? 0.7 : 0),
      shardstorm: 1.2 + comp.air * 1.4 + comp.light * 0.8 + (antiAir < 0.45 ? 0.6 : 0),
      voidcarrier: 1.5 + comp.vehicle * 0.6 + (turtle ? 0.8 : 0) - antiAir * 1.0 - comp.air * 0.5,
      sovereign: 1.7 + comp.vehicle * 0.5 + (turtle ? 0.8 : 0) - antiAir * 1.2 - comp.air * 0.5,
    };
    if (!threat) for (const t of types) { const b = P.bias[t] || P.bias[AI_TWIN[t]]; if (b && sc[t] > 0) sc[t] *= b; } // the personality's taste in units (threats are answered on merit)
    for (const t of types) if (dl.comp[t] !== undefined) sc[t] *= dl.comp[t]; // the composition dial (v2.38; legacy has none)
    if (smart) aiSmartScores(g, s, sc, types, { comp, antiAir, theirs, mine, nFront, turtle, log, threat, P }); // v2.38: the Default AI values v2.37 roles
    if (holdEarly) for (const t of types) { if (t === 'tank' || t === 'bulwark' || t === 'bastion') sc[t] *= 1.6; if (t === 'shardling' || t === 'skitterling') sc[t] *= 0.6; } // v2.40 (hold)
    // Bloomspire path units (v2.21, minimal): one the AI has never trained goes to the top once, so it saves for it (its
    // simple score sits below the Razorwing's, which would otherwise always win)
    if (facOf(side.faction) === 'bloomhost') { const best = Math.max(...types.map(t => sc[t])); for (const t of types) if (UNIT_PATH[t] && UNIT_PATH[t].b === 'techlab' && !log.trained[t]) sc[t] = best + 0.1; }
    // Axiarchs (v2.28): the same rule on every production path (Genesis Gate, Architectum, and the Celestial Array's once it has one)
    if (facOf(side.faction) === 'axiarchs') { const best = Math.max(...types.map(t => sc[t])); for (const t of types) if (UNIT_PATH[t] && !log.trained[t]) sc[t] = best + 0.1; }
    // v2.41 (counter): no anti-air-only unit until it has seen enemy aircraft that hit the ground; an infantry flood (light
    // units over 55% of what it knows of) calls for splash and flame over more of its own basic infantry
    if (aiFix(P, 'counter')) for (const t of types) {
      const d = UDEF[t];
      if (d.hitsGround === false && !d.support && comp.air <= 0.12) sc[t] = 0.05;
      else if (comp.light >= (dl.flood || 0.55) && theirs.length >= 5) { /* v2.42: the flood share is a dial (flood; v2.41 0.55) */ if (d.splash || d.weapon === 'flame' || t === 'thornback' || t === 'gravemantle') sc[t] *= 1.4; else if (t === 'rifle' || t === 'skitterling' || t === 'shardling') sc[t] *= 0.7; }
    }
    const spend = aiFix(P, 'spend'), noAA = aiFix(P, 'counter') && comp.air <= 0.12;
    const fits = t => used + UDEF[t].pop <= cap * fillNow && (freeProducer(g, s, t) || (spend && side.res.c > 900 && g.ents.some(e => e.side === s && canMake(e, t) && e.queue.length < 3))); // v2.38 (Default): rich, it queues up to 3
    const top = types.filter(fits).sort((a, b) => sc[b] - sc[a])[0];
    // v2.38 (Default): a big unit it has never trained, which its army is too full to fit, gets room: it stops training
    // smaller units for up to 75 s while losses free supply (never while threatened)
    let saveRoom = false;
    if (aiFix(P, 'room') && !threat) {
      const want = types.slice().sort((a, b) => sc[b] - sc[a])[0];
      if (want && UDEF[want].pop >= 4 && !log.trained[want] && !fits(want) && freeProducer(g, s, want) && used + UDEF[want].pop > cap * fillNow) {
        if (side.saveFor !== want) { side.saveFor = want; side.saveT = g.t; }
        saveRoom = g.t - side.saveT < 75;
      } else side.saveFor = null;
    }
    // Save for the better unit unless the enemy is already in the base (a calm AI keeps saving while merely threatened)
    const mustSpend = defend || (saving ? danger && !(lightThreat && hasBuilt(g, s, 'factory')) : threat); // vs infantry, Tanks beat trickled Riflemen
    for (let k = 0; k < D.trainPer && !saveRoom; k++) {
      const cand = types.filter(t => { const d = UDEF[t]; return fits(t) && side.res.c - d.cost.c >= reserve.c && side.res.e - d.cost.e >= reserve.e && !(noAA && d.hitsGround === false && !d.support); }); // v2.41 (counter): not even as a spare buy
      if (!cand.length) break;
      const flush = spend && side.res.c > 900; // v2.38 (Default): credits piling up: buy what it can afford now instead of waiting
      if (top && !cand.includes(top) && !mustSpend && !flush && (saving || simRnd() < 0.6)) break;
      if (flush && side.res.e < 80) { const free = cand.filter(t => UDEF[t].cost.e <= 10); if (free.length) cand.splice(0, cand.length, ...free); } // energy-starved: credit-only units
      let pick;
      if (simRnd() < D.smart) pick = cand.slice().sort((a, b) => sc[b] - sc[a])[0];
      else {
        let sum = 0;
        const w = cand.map(t => { const v = Math.max(0.05, sc[t]) ** 2; sum += v; return v; });
        let r = simRnd() * sum; pick = cand[0];
        for (let i = 0; i < cand.length; i++) { r -= w[i]; if (r <= 0) { pick = cand[i]; break; } }
      }
      if (!tryTrain(g, s, pick).ok) break;
      log.trained[pick] = (log.trained[pick] || 0) + 1;
      used = popUsed(g, s);
    }
  }

  // 4) Strategy: hold the near node, take the field, siege just outside the enemy guns, or go all in
  const hqGun = BDEF.hq.gun[oppTier], hqVal = knownDefense(g, s);
  const rich = side.res.c > dl.bank;
  const nSiege = mine.filter(u => AI_SIEGE.includes(u.type)).length;
  const ae = P.attackEdge * (ecoMood ? 1.2 : 1); // how much of an edge this personality wants before a base attack
  const wave = Math.min(3600, 400 + g.t * 4) * D.wave * P.wave * (ecoMood ? 1.3 : 1);
  const full = used >= cap * fill - 2, since = g.t - side.stanceAt; // full by its own army limit
  // A failed base attack raises the bar for the next one, unless the army is maxed out with money banked to refill it
  const late = g.t > dl.late; // after 18 minutes (the late dial, v2.38), stop waiting for a perfect edge
  const bold = myV >= attackBar(g, s) || (full && (rich || side.res.c > 1000)) || late;
  const siegeLine = hqU(opp) - dir * (hqGun.range + 25), fieldLine = L / 2 + dir * 20, farLine = g.nodes[s === 0 ? g.nodes.length - 1 : 0].u; // farLine: the enemy's own node (the nodes dial at 3, v2.38)
  const myNode = g.nodes[s === 0 ? 0 : g.nodes.length - 1];
  // enemies camping on or near our node, as far as we know
  const atNode = theirs.filter(u => u.fresh && Math.abs(u.u - myNode.u) < NODE_R + 160);
  const nodeLost = myNode.owner === opp || atNode.length > 0;
  const failed = () => {
    if (!side.launchV) return;
    side.failV = side.launchV * FAIL_MARGIN; side.failT = g.t; side.launchV = 0;
    side.fails = (side.fails || 0) + 1;
    if (punishOn) side.punished = true; // v2.41 (read): the punish attack is spent
    if (nw) side.regroupT = Math.max(side.regroupT || 0, g.t + 20); // v2.41 (nowave): regroup before the next push of any kind
    if (P.kind === 'aggressor' && side.fails >= 2) { side.moodUntil = g.t + rand(180, 240); side.fails = 0; } // rethink: economy first
  };
  // v2.40 (defend): an enemy army inside the base (within 450 of the HQ) that is stronger than its own: rally inside the HQ's cover (170 out, within
  // reach of the HQ gun but beyond an attacker's reach from outside it) and hold there, so attackers fight under the gun
  if (aiFix(P, 'defend')) { const near0 = theirs.filter(e => e.fresh && Math.abs(e.u - hqU(s)) < 450); side.defU = danger && aiPower(mine) < aiPower(near0) ? hqU(s) + dir * 170 : null; }
  // v2.40 (engage): is the fight it is about to start, or is in, winnable? Its army's strength against the enemy units it knows
  // of at the target (all of them for a base attack) and the known guns there (weighted 0.6: buildings can't chase)
  const engage = aiFix(P, 'engage') && !late && g.t < EXT.warn;
  const fightAt = (u, all, own = mine) => { const foes = all ? theirs : theirs.filter(e => Math.abs(e.u - u) < 350); return aiPower(own) / Math.max(1, aiPower(foes, aiGunsNear(g, s, u, 60).map(b => ({ dps: b.dps * 0.6, hp: b.hp })))); };
  if (holdEarly && side.stance === 'attack' && side.pushMode !== 'all') { side.stance = 'retreat'; side.pushTo = null; side.pushMode = null; side.stanceAt = g.t; } // v2.40 (hold): back under the gun
  const nw = aiFix(P, 'nowave');
  // v2.41 (nowave): most of the army (70% of its value) within 250 of its middle unit, so a push leaves together
  const gathered = () => { const gr = mine.filter(u => !UDEF[u.type].support && !UDEF[u.type].air && u.id !== side.scoutId); if (gr.length < 2) return true; const xs = gr.map(u => u.u).sort((a, b) => a - b), med = xs[xs.length >> 1]; return armyValue(gr.filter(u => Math.abs(u.u - med) < 250)) >= armyValue(gr) * 0.7; };
  const go = (pushTo, mode, force) => {
    if (mode === 'siege' && aiFix(P, 'press') && hqGun.range >= ATTACK.press.siegeMax) { pushTo = null; mode = 'all'; } // v2.60 (press): a siege line outside a long HQ gun is mid-field: go in
    if (nw && !force && side.stance !== 'attack' && (side.regroupT > g.t || !gathered() || myV < (side.beatV || 0) * 1.2 * Math.max(0, 1 - (g.t - side.beatT) / 120) ||
      (mode === 'field' && (fightAt(pushTo, true) < 1.25 || myV < thV)))) return; // v2.41 (nowave): regrouped, gathered, 1.2x the army that last turned it back, stronger than all it expects
    if (holdEarly && side.stance !== 'attack' && !(mode === 'all' && fightAt(hqU(opp), true) >= 1.5)) return; // v2.40 (hold): stay home under the gun
    if (engage && !force && side.stance !== 'attack' && (mode === 'node' ? fightAt(pushTo, false) < 1 : side.regroupT > g.t || fightAt(pushTo === null ? hqU(opp) : pushTo, mode === 'all' || mode === 'siege') < 1.25)) return; // not a fight it wins: build up instead
    const was = side.stance; side.stance = 'attack'; side.pushTo = pushTo; side.pushMode = mode; side.stanceAt = g.t;
    side.launchV = mode === 'all' || mode === 'siege' ? myV : 0;
    if (was === 'attack') return;
    // Trickster: some pushes are feints that pull back; two feints in a row and the next push is real
    let feint = 0;
    if (P.feint && (side.feintStreak || 0) < 2 && simRnd() < P.feint) { side.feintUntil = g.t + rand(8, 15); side.feintStreak = (side.feintStreak || 0) + 1; side.launchV = 0; log.feints++; feint = 1; }
    else { side.feintStreak = 0; log.attacks++; if (log.firstAttack === null) log.firstAttack = g.t; if (P.kind === 'trickster') P.wave = rand(0.8, 1.3); }
    ev(g, { type: 'aiAttack', side: s, mode }); lg(g, s, 'G', mode, feint);
  };
  // weak spots it can see: a field node the enemy holds with little around it, or an enemy that just spent its army on us
  const oppNode = g.nodes[1]; // the middle node (the enemy's own node sits under its HQ guns)
  const contest = aiFix(P, 'contest'); // v2.41 (contest): every personality, from a smaller army, also a node the enemy is still taking
  const weakNode = (P.opportunist || contest) && oppNode.owner !== s && (oppNode.owner === opp || (contest && oppNode.c[opp] > 0)) && myV >= (contest ? 150 : 250) &&
    armyValue(theirs.filter(u => Math.abs(u.u - oppNode.u) < NODE_R + 200)) < myV * 0.5;
  const punish = P.opportunist && side.lastDanger !== undefined && g.t - side.lastDanger < 20 && !threat && myV >= 300 && myV >= thV * 1.2;
  // The Aggressor against a fortified base: if its Orbital Strike is only seconds away, wait for it rather than walk in head-on
  const strikeWait = side.ab.strike - g.t, holdForStrike = P.kind === 'aggressor' && D.label !== 'Easy' && !threat && !late && strikeWait > 0 && strikeWait < 12 && aiFortified(g, s) && hasBuilt(g, s, 'factory');
  // v2.60 (press, ATTACK.press): attack when clearly ahead on army or economy, fight for the centre node at parity, and
  // need a smaller edge as the storm nears
  const PR = D.press ? Object.assign({}, ATTACK.press, D.press) : null; // v2.61: each difficulty's own edges (DIFF.press; none = the rule is off)
  const pr = aiFix(P, 'press') && !!PR && g.t >= PR.from && !(side.regroupT > g.t) && !holdForStrike;
  const prNeed = PR ? lerp(PR.edge, PR.edgeLate, clamp((g.t - PR.late0) / (EXT.warn - PR.late0), 0, 1)) : 1;
  const ecoAhead = pr && income(g, s).c >= (side.estInc || 1e9) * PR.eco;
  const prSafe = !PR || !PR.power || aiPower(mine) >= aiPower(theirs); // v2.61: a cautious difficulty never presses into a known army stronger than its own
  const prPush = pr && prSafe && myV >= dl.minArmy && (myV >= thV * prNeed || (ecoAhead && myV >= thV * prNeed * 0.9));
  const prField = pr && prSafe && g.nodes[1].owner !== s && myV >= 250 && myV >= thV * PR.field * prNeed / PR.edge;
  if (bo && side.boHold && side.stance === 'attack' && side.pushMode !== 'all' && side.pushMode !== 'siege') { side.stance = 'retreat'; side.pushTo = null; side.pushMode = null; side.stanceAt = g.t; } // v2.42 (breakout): back under the gun
  if (bo && side.boHold && side.stance !== 'attack') { /* v2.42 (breakout): hold and gather; no push while camped on */ }
  else if (bo && g.t - (side.campT ?? -99) < 15 && side.stance !== 'attack' && g.t < EXT.warn) { // stronger now: out together, at the camp
    go(clamp(side.campU, 0, L), 'field', true); side.regroupT = 0; side.campT = -99;
  }
  else if (side.stance !== 'attack' && g.t >= EXT.warn && myV >= 200 && myV >= thV * 0.7) go(null, 'all'); // the storm is coming: everything in
  else if (side.stance !== 'attack' && punishOn && aiFix(P, 'punish') && g.t >= 105 && myV >= 400 && aiPower(mine) >= aiPower(theirs) * 1.5) go(fieldLine, 'field', true); // v2.41 (read): the timed push on a greedy opening: the field and its nodes, then the base once clearly stronger
  else if (side.stance !== 'attack' && prPush) go(nSiege >= 2 ? siegeLine : null, nSiege >= 2 ? 'siege' : 'all', true); // v2.60 (press)
  else if (side.stance !== 'attack' && prField) go(fieldLine, 'field', true); // v2.60 (press): the centre node, at parity
  else if (side.stance !== 'attack' && holdForStrike) { /* wait */ }
  else if (side.stance !== 'attack') {
    if (g.t < dl.attackAt && !late) { if (D.nodes && nodeLost && myV >= 250 && myV >= armyValue(atNode) * 1.15) go(myNode.u, 'node'); } // the attack-timing dial (v2.38): before it, only its own node
    else if (bold && myV >= dl.minArmy && ((myV >= (thV + hqVal) * 1.35 * ae && myV >= wave * 0.6) || (full && myV > (thV + hqVal) * 1.05 * ae))) go(null, 'all');
    else if (bold && nSiege >= 2 && myV >= thV * 0.95 * ae && (myV >= wave * 0.7 || full)) go(siegeLine, 'siege');
    else if (bold && myV >= wave && myV > thV * 1.15 * ae) go(siegeLine, 'siege');
    else if (bold && rich && full && myV >= thV * 0.85) go(null, 'all'); // money in the bank refills the army, so commit
    else if ((g.t > P.deadline && myV >= 500 && myV >= thV * 0.9) || (late && myV >= 400 && myV >= thV * 0.8)) go(nSiege >= 2 ? siegeLine : null, nSiege >= 2 ? 'siege' : 'all'); // a Turtle must attack eventually; nobody sits forever
    else if (bold && punish) go(null, 'all'); // their army just broke against our base
    else if (D.nodes && nodeLost && myV >= (contest ? 150 : 250) && myV >= armyValue(atNode) * 1.15) go(myNode.u, 'node'); // win back our node, all together
    else if (P.kind === 'aggressor' && lightThreat && myV < thV * 1.3) { /* an infantry rush at the door: hold the base until clearly stronger */ }
    else if (weakNode && dl.nodes >= 2) go(fieldLine, 'field');
    else if (dl.nodes >= 2 && myV >= D.fieldMin && myV >= thV * D.fieldEdge * (threat ? Math.max(1, P.fieldEdge) : P.fieldEdge)) go(dl.nodes >= 3 && myV >= thV * 1.5 ? farLine : fieldLine, 'field'); // take and hold the field nodes (the nodes dial, v2.38)
  } else if (side.feintUntil && g.t >= side.feintUntil) {
    side.feintUntil = 0; side.stance = 'retreat'; side.pushTo = null; side.pushMode = null; side.launchV = 0; side.stanceAt = g.t; // the feint pulls back
  } else if (engage && since > 4 && g.front[s] !== null && fightAt(g.front[s] + dir * 150, false, mine.filter(u => Math.abs(g.front[s] - u.u) < 400)) < 0.6) {
    failed(); // v2.40 (engage): losing where it is fighting: pull back together and regroup before trying again
    side.stance = 'retreat'; side.pushTo = null; side.pushMode = null; side.stanceAt = g.t; side.regroupT = g.t + (nw ? 20 : 12);
    if (nw) { side.beatV = armyValue(theirs.filter(u => Math.abs(u.u - g.front[s]) < 450)); side.beatT = g.t; } // v2.41 (nowave): the army that turned it back
  } else if (since > 6 && myV < thV * (late ? 0.5 : dl.retreat)) {
    failed();
    if (nw) { side.regroupT = Math.max(side.regroupT || 0, g.t + 20); side.beatV = thV; side.beatT = g.t; } // v2.41 (nowave)
    side.stance = 'retreat'; side.pushTo = null; side.pushMode = null; side.stanceAt = g.t;
  } else if (side.pushTo === null && since > 10 && thV < 200 && myV < hqVal * 1.2 && !rich) {
    failed();
    side.stance = 'retreat'; side.pushMode = null; side.stanceAt = g.t; // too few to crack the base defenses: regroup instead of trickling in
  } else if ((side.pushMode === 'field' || side.pushMode === 'node') && prPush) { // v2.60 (press): from the field on to their base
    const sg = nSiege >= 2 && hqGun.range < ATTACK.press.siegeMax; side.pushTo = sg ? siegeLine : null; side.pushMode = sg ? 'siege' : 'all'; side.launchV = myV; side.stanceAt = g.t; lg(g, s, 'G', side.pushMode, 0);
  } else if (side.pushMode === 'field' || side.pushMode === 'node') {
    if (bold && nSiege >= 2 && myV >= thV && (myV >= wave * 0.7 || full)) { side.pushTo = siegeLine; side.pushMode = 'siege'; side.launchV = myV; side.stanceAt = g.t; ev(g, { type: 'aiAttack', side: s, mode: 'siege' }); lg(g, s, 'G', 'siege'); }
    else if (bold && myV >= dl.minArmy && ((myV >= (thV + hqVal) * 1.35 && myV >= wave * 0.6) || (full && myV > (thV + hqVal) * 1.05))) { side.pushTo = null; side.pushMode = 'all'; side.launchV = myV; side.stanceAt = g.t; }
    else if (side.pushMode === 'node' && !nodeLost && myNode.owner === s && myV >= 300 && myV >= thV * 0.9) { side.pushTo = fieldLine; side.pushMode = 'field'; side.stanceAt = g.t; }
  } else if (side.pushTo !== null && bold && (myV > (thV + hqVal) * 1.3 || (since > 50 && myV > thV * 1.1))) {
    side.pushTo = null; side.pushMode = 'all'; side.stanceAt = g.t;
  }
  if (aiFix(P, 'raid') && D.raid) aiRaid(g, s, mine, myV, D.raid); // v2.60; v2.61: per difficulty (DIFF.raid)
  aiAbility(g, s, P, { mine, theirs, threat, myV, thV });
  aiMicro(g, s, D, mine);
  if (smart) aiSmartArmy(g, s, mine, dl, P); // v2.38: the Default AI's unit handling
}
// Spotters: siege guns can't fire at what their side can't see, so while sieging, one unit walks up until
// its sight reaches the front of the enemy base (as far as this side knows where that is). Seeing the base
// means entering its HQ's range, so sturdy units go first; a fallen spotter is replaced on the next tick.
const SPOTTER_PREF = ['drone', 'titan', 'tank', 'heavy', 'aircraft', 'interceptor', 'rifle', 'sniper', 'ruinmaw', 'dreadthorn', 'bulwark', 'thornback', 'razorwing', 'ravager', 'skitterling', 'leaper'];
function aiSpotter(g, s) {
  if (aiFix(g.sides[s].persona, 'spot')) { aiSmartSpotter(g, s); return; } // v2.38: the Default AI spots for every long gun
  const side = g.sides[s], dir = dirOf(s), opp = 1 - s;
  const sieging = side.stance === 'attack' && side.pushTo !== null && side.pushMode === 'siege';
  const mine = sieging ? g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0) : [];
  if (!sieging || !mine.some(u => AI_ART.includes(u.type))) { side.spotter = null; side.spotU = null; return; }
  let sp = mine.find(u => u.id === side.spotter);
  if (!sp) for (const t of SPOTTER_PREF) { sp = mine.find(u => u.type === t); if (sp) break; }
  if (!sp) { side.spotter = null; side.spotU = null; return; }
  // Nearest known edge of the enemy base, measured towards us (x = -dir * u grows towards our side)
  let front = -dir * hqU(opp) + 160;
  const gh = Object.values(g.fog[s].ghosts);
  if (gh.length) front = Math.max(...gh.map(b => -dir * b.u + b.half));
  side.spotter = sp.id;
  side.spotU = clamp(-dir * (front + SIGHT[sp.type] - 15), 0, L);
}

/* ---------- The Default AI's competence (v2.38, audit phase 4) ----------
   Rules only the Default preset uses (aiSmart). They know the v2.37 units: what each is for, what it needs (vision,
   room, timing) and where it should stand. No new rules for the units themselves: they act through the same orders,
   spotter, hold and stance hooks the player's units obey. */
// Unit scores for v2.37 roles (on top of the shared scores; threats keep being answered on merit)
function aiSmartScores(g, s, sc, types, c) {
  const { comp, antiAir, theirs, mine, nFront, turtle, log, P } = c, has = t => types.includes(t), n = t => mine.filter(u => u.type === t).length;
  if (!aiFix(P, 'scores')) { if (aiFix(P, 'pathUnits')) aiPathUnitsFirst(sc, types, log, c.threat); return; }
  const aaRapid = theirs.length ? theirs.filter(u => ['interceptor', 'hydra', 'spitter', 'lancer', 'razorwing', 'shardstorm', 'rifle'].includes(u.type)).length / theirs.length : 0.3;
  const set = (t, v) => { if (has(t)) sc[t] = v; };
  // long guns: each for the targets its v2.37 mechanic is made for
  set('artillery', nFront >= 3 && n('artillery') < Math.max(2, nFront / 3) ? 1.1 + comp.light * 0.8 + comp.heavy * 0.3 + (turtle ? 0.8 : 0) : 0.1); // salvo: clumps and bases
  set('riftmortar', nFront >= 3 && n('riftmortar') < Math.max(2, nFront / 3) ? 1.1 + comp.vehicle * 0.9 + comp.heavy * 0.5 - comp.light * 0.4 + (turtle ? 0.6 : 0) : 0.1); // precision: single high-value targets
  set('bilelobber', nFront >= 4 && n('bilelobber') < Math.max(2, nFront / 4) ? 1.0 + comp.heavy * 0.6 + comp.vehicle * 0.5 + (turtle ? 0.5 : 0) : 0.1); // softening: with a front to exploit it
  set('bilecaster', 0.9 + comp.heavy * 1.0 + comp.vehicle * 0.8 + (nFront >= 4 ? 0.3 : 0) - comp.air * 0.6 - comp.light * 0.3); // a single-target marker: tough targets
  set('sniper', 0.8 + comp.light * 1.6 + comp.heavy * 0.9 - comp.vehicle * 1.0 - comp.air * 0.6); // pierce: infantry in lines
  set('lancer', 1.0 + comp.air * 1.8 + comp.vehicle * 0.9 + comp.heavy * 0.7 - comp.light * 0.3); // focus: tough single targets and air
  set('wraithwing', 1.2 + comp.vehicle * 1.0 + comp.light * 0.4 + (1 - aaRapid) * 0.6 + (antiAir < 0.45 ? 0.6 : 0)); // phase: strong against slow anti-air
  set('ravager', 1.2 + comp.light * 1.6 + comp.heavy * 0.2 - comp.vehicle * 0.7 - comp.air * 0.5); // frenzy on kills: light swarms
  if (has('voidcarrier')) sc.voidcarrier = 1.5 + (n('voidcarrier') ? -0.8 : 0.4) + (turtle ? 0.4 : 0) - antiAir * 0.8; // one field carrier for the push
  if (has('sovereign')) sc.sovereign = 1.6 + (turtle ? 1.0 : 0.3) - antiAir * 1.0; // judgement: one building at a time
  if (has('leviathan')) sc.leviathan = 1.6 + (turtle ? 1.0 : 0.3) - antiAir * 1.0; // carpet: buildings in a row
  if (has('worldrender')) sc.worldrender = 1.6 + (turtle ? 1.0 : 0.3) - antiAir * 1.0; // devour: sustained base attack
  // Skitterlings: plan around the limit of 60; Razorwings, its early flyer, always in the mix (anti-air and raids)
  if (has('skitterling') && UDEF.skitterling.max) sc.skitterling *= clamp(1 - unitCount(g, s, 'skitterling') / UDEF.skitterling.max, 0.05, 1);
  if (has('razorwing')) sc.razorwing = Math.max(sc.razorwing, 1.1 + comp.air * 1.2 + (n('razorwing') < 2 + Math.floor(g.t / 180) ? 0.6 : 0));
  if (aiFix(P, 'pathUnits')) aiPathUnitsFirst(sc, types, log, c.threat);
}
// a path unit it has never trained goes to the top once, so it saves for it (the Bloomspire's rule, v2.21, on every path)
function aiPathUnitsFirst(sc, types, log, threat) {
  if (threat) return;
  const best = Math.max(...types.map(t => sc[t]));
  for (const t of types) if (UNIT_PATH[t] && !log.trained[t]) sc[t] = Math.max(sc[t], best + 0.1);
}
// v2.40 (engage): fighting strength in Lanchester form, total damage per second × total health, of units ({ type, w }: w the
// weight of a fading sighting) and of known enemy guns (fog ghosts of buildings with a gun: Turrets, HQs, bunkers) within
// range of a point. Only what this side has seen counts.
// v2.41 (read): a greedy opening, as this side has seen it before 4:00: three or more economy buildings (Refineries and
// Reactors, their faction's roles), a Refinery already at T2, or two field nodes taken, while the enemy army it knows of is
// worth under 350. Marked once (side.greedT); only what its own units have seen counts (fog ghosts, intel, node owners).
function aiRead(g, s, thV) {
  const side = g.sides[s];
  if (side.greedT !== undefined || g.t > 240) return;
  let eco = 0, up = 0;
  for (const gh of Object.values(g.fog[s].ghosts)) if (gh.side !== s) { if (gh.type === 'refinery' || gh.type === 'reactor') eco++; if (gh.type === 'refinery' && gh.tier >= 2) up++; }
  const nodes = g.nodes.filter(n => n.owner === 1 - s).length;
  if (thV < 350 && (eco >= 3 || up >= 1 || nodes >= 2)) { side.greedT = g.t; lg(g, s, 'G', 'greed', eco); }
}
// v2.41 (est): the enemy army it should expect, from what it has seen of the enemy economy: the HQ, the Refineries it has
// seen (their last-seen tiers; none seen yet: as much as its own) and the field nodes the enemy holds, summed over time;
// 40% of that, phased in from 2:00 to 3:30 (no greedy opening has an army before then), less the value of enemy units it
// has destroyed
function aiEstimate(g, s) {
  const side = g.sides[s], f = g.fog[s], dt = g.t - (side.estT === undefined ? 0 : side.estT);
  side.estT = g.t;
  if (aiFix(side.persona, 'estFix')) { // v2.60: from time and from the last good look at its army (ATTACK.est)
    const E = ATTACK.est, curve = Math.min(E.cap, E.base + E.rate * g.t);
    let seen = 0; for (const e of g.ents) if (e.kind === 'u' && e.side !== s && e.hp > 0 && !e.temp && visibleTo(g, s, e)) seen += UDEF[e.type].cost.c + UDEF[e.type].cost.e;
    const last = side.estSeen ? side.estSeen.v + E.rebuild * (g.t - side.estSeen.t) : Infinity;
    if (seen >= E.seen * curve || (side.estSeen && seen >= last)) side.estSeen = { v: seen, t: g.t }; // a good share of what an army that size would be, or more than it expected: trust what it sees
    side.estInc = aiEnemyIncome(g, s);
    return Math.min(curve, side.estSeen ? side.estSeen.v + E.rebuild * (g.t - side.estSeen.t) : curve);
  }
  let inc = BDEF.hq.inc[1].c, refs = 0;
  for (const gh of Object.values(f.ghosts)) if (gh.side !== s && gh.type === 'refinery') { refs++; inc += BD(gh.fac, 'refinery').inc[gh.tier || 1].c; }
  if (!refs) inc = income(g, s).c - NODE_INC.c * g.nodes.filter(n => n.owner === s).length;
  inc += NODE_INC.c * g.nodes.filter(n => n.owner === 1 - s).length;
  side.estE = (side.estE || 0) + inc * dt;
  let killed = 0;
  if (g.log) { const K = g.log.tot[s].killed; for (const t in K) { const d = UDEF[t]; if (d) killed += (d.cost.c + d.cost.e * 1.5) * K[t]; } }
  return Math.max(0, 0.4 * (side.estE + START_RES.c) * clamp((g.t - 120) / 90, 0, 1) - killed);
}
// v2.60 (raid, ATTACK.raid): with no push on, a few of its fastest ground units (at most share of its army) take the enemy's
// own node, or the centre if it already holds theirs; they come home when hurt, after dur seconds, or when the army attacks
function aiRaid(g, s, mine, myV, dr) {
  const side = g.sides[s], R = Object.assign({}, ATTACK.raid, dr && dr !== true ? dr : {});
  if (side.raid) {
    const live = mine.filter(u => side.raid.ids.includes(u.id)), hp = live.reduce((a, u) => a + u.hp, 0);
    side.raid.ids = live.map(u => u.id);
    if (!live.length || g.t > side.raid.until || side.stance === 'attack' || hp < side.raid.hp0 * R.minHp) { side.raid = null; side.raidT = g.t; }
    return;
  }
  if (side.stance === 'attack' || g.t < R.at || g.t - (side.raidT ?? -1e9) < R.every) return;
  const theirNode = g.nodes[s === 0 ? g.nodes.length - 1 : 0], tgt = theirNode.owner === s ? g.nodes[1] : theirNode;
  if (tgt.owner === s) return;
  const fast = mine.filter(u => { const d = UDEF[u.type]; return !d.air && !d.support && !d.siege && !d.noCap && !u.temp && u.id !== side.scoutId; }).sort((a, b) => UDEF[b.type].speed - UDEF[a.type].speed);
  const ids = []; let v = 0, hp0 = 0;
  for (const u of fast) { const c = UDEF[u.type].cost.c + UDEF[u.type].cost.e; if (ids.length >= R.n || v + c > myV * R.share) continue; ids.push(u.id); v += c; hp0 += u.hp; }
  side.raidT = g.t;
  if (ids.length < 2) return;
  side.raid = { ids, u: tgt.u, until: g.t + R.dur, hp0 };
  lg(g, s, 'G', 'raid', 0);
}
// v2.60: the enemy's credit income as this side can know it: its HQ, the Refineries it has seen, and the nodes it holds
function aiEnemyIncome(g, s) {
  let inc = BDEF.hq.inc[1].c;
  for (const gh of Object.values(g.fog[s].ghosts)) if (gh.side !== s && gh.type === 'refinery') inc += BD(gh.fac, 'refinery').inc[gh.tier || 1].c;
  return inc + NODE_INC.c * g.nodes.filter(n => n.owner === 1 - s).length;
}
// sig: make room for the signature building by selling one of the duplicates the plan has (never the only one of a type)
function aiSigRoom(g, s, dup, sig) {
  if (!dup) return false;
  const xs = alive(g, s, dup).filter(b => b.built && !b.upgrading);
  if (xs.length < 2 || g.sides[s].res.c < bdS(g, s, sig).cost.c + 100) return false;
  xs.sort((a, b) => a.tier - b.tier); trySell(g, s, xs[0]);
  return true;
}
function aiPower(units, guns) {
  let dps = 0, hp = 0;
  for (const x of units) { const d = UDEF[x.type], w = x.w === undefined ? 1 : x.w; if (!d || d.support) continue; dps += (d.dmg || 0) / (d.cd || 1) * w; hp += (d.hp + (d.shp || 0)) * w; }
  for (const b of guns || []) { dps += b.dps; hp += b.hp; }
  return dps * hp;
}
function aiGunsNear(g, s, u, r) { // known enemy buildings with a gun whose reach covers u (within r more)
  const out = [];
  for (const gh of Object.values(g.fog[s].ghosts)) {
    if (gh.side === s) continue;
    const bd = BD(gh.fac, gh.type), gun = bd && bd.gun && bd.gun[gh.tier || 1];
    if (!gun || Math.abs(gh.u - u) > gun.range + r) continue;
    out.push({ dps: gun.dmg / gun.cd * (gun.split || 1), hp: bd.hp * hpMul(bd, gh.tier || 1) + (bd.shp || 0) });
  }
  return out;
}
// Where its units stand and when they act: the Titans' leash, the Voidcarrier's spot, scouting and unit timing
function aiSmartArmy(g, s, mine, dl, P) {
  const side = g.sides[s], dir = dirOf(s), opp = 1 - s, ground = mine.filter(u => !UDEF[u.type].air);
  // Titans plant to fire; the rest of an attacking army stays within reach of the rearmost one, so it isn't fought alone
  const ti = mine.filter(u => UDEF[u.type].siege);
  side.leash = aiFix(P, 'leash') && side.stance === 'attack' && ti.length ? ti.reduce((a, u) => dir * u.u < dir * a ? u.u : a, ti[0].u) + dir * 200 : null;
  // the Voidcarrier floats just behind the ground front, so warp-ins land behind the line, not in front of it
  const fr = ground.filter(u => !UDEF[u.type].support).reduce((a, u) => a === null || dir * u.u > dir * a ? u.u : a, null);
  side.vcU = aiFix(P, 'carrier') && mine.some(u => UDEF[u.type].node) && fr !== null ? clamp(fr - dir * 110, 0, L) : null;
  side.backU = clamp(rallyU(s) + dir * 120, 0, L);
  // v2.40 (axf): an Axiarch unit with its shields gone and its health low steps back into the power field (the warp point,
  // the field's front edge) to recharge at the field's rate instead of dying outside it
  if (aiFix(P, 'axf') && facOf(side.faction) === 'axiarchs') {
    const wp = warpPoint(g, s); side.backU = wp.u;
    for (const u of mine) if (u.maxShp && !UDEF[u.type].air && !u.siege && u.shp < u.maxShp * 0.1 && u.hp < u.maxHp * 0.55 && !onField(g, s, u.u, u.v) && Math.abs(u.u - wp.u) < 400 && !(u.aiBack > g.t)) u.aiBack = g.t + 2.5;
  }
  // v2.40 (mass): an attacking army moves as one. Ground fighters more than 120 ahead of the army's median hold (they fight
  // what is in reach, never chase) until the rest is with them; stragglers far behind the front don't hold the push back
  if (aiFix(P, 'mass') && side.stance === 'attack' && fr !== null) {
    const grp = ground.filter(u => !UDEF[u.type].support && !UDEF[u.type].siege && u.id !== side.spotter && u.id !== side.scoutId && dir * (fr - u.u) < 600);
    if (grp.length >= 3) {
      const xs = grp.map(u => dir * u.u).sort((a, b) => a - b), med = xs[xs.length >> 1];
      for (const u of grp) if (dir * u.u > med + 120) u.aiWait = g.t + 1.5;
    }
  }
  // v2.40 (defend): rallied inside the HQ's cover, ground units hold there: they fight what comes in reach, never chase out
  if (side.defU != null && side.stance !== 'attack') for (const u of ground) if (!UDEF[u.type].siege && Math.abs(u.u - side.defU) < 140) u.aiWait = g.t + 1.5;
  // reinforcements in groups: while it attacks, new units gather at the rally point until they are worth 400 together,
  // then march as one instead of walking to the front one by one
  if (aiFix(P, 'batch') && side.stance === 'attack' && fr !== null) {
    const back = mine.filter(u => !UDEF[u.type].support && !UDEF[u.type].siege && !UDEF[u.type].node && u.id !== side.spotter && u.id !== side.scoutId && dir * (fr - u.u) > 350 && dir * (u.u - side.backU) < 150);
    const v = back.reduce((a, u) => a + UDEF[u.type].cost.c + UDEF[u.type].cost.e, 0);
    if (v < 400 && !(side.lastDanger !== undefined && g.t - side.lastDanger < 15)) for (const u of back) u.aiBack = g.t + 1.5;
  }
  // scouting: every dl.scout seconds, with nothing fresh seen, its fastest cheap unit runs to just outside the enemy base
  if (dl.scout) {
    const sc = mine.find(u => u.id === side.scoutId);
    if (sc && (Math.abs(sc.u - side.scoutU) < 30 || g.t - side.scoutT > 30)) { side.scoutId = null; side.scoutU = null; }
    else if (!sc) { side.scoutId = null; side.scoutU = null; }
    const fresh = Object.values(g.fog[s].intel).some(m => g.t - m.t <= 20);
    const read = aiFix(P, 'read') && side.greedT === undefined && g.t < 240; // v2.41 (read): early scouting, to the edge of the enemy HQ's gun, where it sees the buildings
    if (!side.scoutId && (!fresh || read) && side.stance !== 'attack' && (read ? g.t >= 35 && g.t - (side.scoutT || -99) > 30 : g.t - (side.scoutT || 0) > dl.scout)) {
      const c = mine.filter(u => !UDEF[u.type].siege && UDEF[u.type].cost.c <= 150 && u.id !== side.spotter).sort((a, b) => UDEF[b.type].speed - UDEF[a.type].speed || a.id - b.id)[0];
      if (c) { side.scoutId = c.id; side.scoutU = clamp(hqU(opp) - dir * (read ? 420 : 560), 0, L); side.scoutT = g.t; }
    }
  }
  // timing: a Riftstalker leaps only with its shields nearly full; a Wraithwing whose phase is spent backs off when hurt;
  // a Sovereign under anti-air with its shields down backs off until they recharge
  if (aiFix(P, 'timing')) for (const u of mine) {
    const d = UDEF[u.type];
    if (d.fade && u.maxShp && u.shp < u.maxShp * 0.75) u.aiHold = g.t + 1.5;
    if (d.phase && u.phCd > g.t && u.hp + u.shp < (u.maxHp + u.maxShp) * 0.45) u.aiBack = g.t + 2.5;
    if (u.type === 'sovereign' && u.maxShp && u.shp < u.maxShp * 0.25) {
      const aa = g.ents.some(e => e.side === opp && e.hp > 0 && e.kind === 'u' && UDEF[e.type].hitsAir && Math.abs(e.u - u.u) < 240 && visibleTo(g, s, e));
      if (aa) u.aiBack = g.t + 2.5;
    }
  }
}
// Spotters for every long gun (Default): while attacking with units that reach past their own sight (Artillery, Bile
// Lobbers, Rift Mortars, Marksmen, Snipers, Bilecasters, planted Titans), one other unit walks just far enough ahead of
// the frontmost of them for its sight to cover that reach, never more than 80 ahead of the rest of the army
const SMART_SPOT = ['drone', 'aircraft', 'razorwing', 'needlewing', 'prismwing', 'wraithwing', 'interceptor', 'tank', 'bulwark', 'bastion', 'heavy', 'spitter', 'lancer', 'rifle', 'skitterling', 'shardling'];
function aiSmartSpotter(g, s) {
  const side = g.sides[s], dir = dirOf(s);
  side.spotAny = true;
  const reach = u => { const d = UDEF[u.type]; return d.siege ? d.range + d.siege.reach : d.range; };
  const mine = side.stance === 'attack' ? g.ents.filter(e => e.kind === 'u' && e.side === s && e.hp > 0) : [];
  const longs = mine.filter(u => UDEF[u.type].weapon && !UDEF[u.type].air && reach(u) > SIGHT[u.type] + 10);
  if (!longs.length) { side.spotter = null; side.spotU = null; return; }
  const lead = longs.reduce((a, u) => dir * u.u > dir * a.u ? u : a, longs[0]);
  const ok = u => !longs.includes(u) && !UDEF[u.type].siege && u.id !== side.scoutId;
  let sp = mine.find(u => u.id === side.spotter && ok(u));
  if (!sp) for (const t of SMART_SPOT) { sp = mine.find(u => u.type === t && ok(u)); if (sp) break; }
  if (!sp) sp = mine.find(ok);
  if (!sp) { side.spotter = null; side.spotU = null; return; }
  side.spotter = sp.id;
  const rest = mine.filter(u => u !== sp && !UDEF[u.type].air), front = rest.length ? rest.reduce((a, u) => dir * u.u > dir * a ? u.u : a, rest[0].u) : lead.u;
  const want = lead.u + dir * Math.max(0, reach(lead) - SIGHT[sp.type] + 20);
  side.spotU = clamp(dir > 0 ? Math.min(want, front + 80) : Math.max(want, front - 80), 0, L);
}

