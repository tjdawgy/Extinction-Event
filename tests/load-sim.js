// Pulls the SIM section (rules, economy, combat, AI, save/load) out of index.html
// and evaluates it in a sandbox, so it can be tested without a browser.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML_PATH = path.join(__dirname, '..', 'index.html');

function readHtml() { return fs.readFileSync(process.env.EE_HTML || HTML_PATH, 'utf8'); } // EE_HTML: test another copy of the game

// opts.random: a replacement for Math.random inside the SIM (for deterministic comparisons)
// opts.map: a map object (tests/maps/) the SIM plays instead of Classic (v2.63: EE_MAP_DATA; never in the game)
function loadSim(opts = {}) {
  const html = readHtml();
  const start = html.indexOf('<script>');
  const end = html.indexOf('/* ===================== SIM END');
  if (start < 0 || end < 0) throw new Error('Could not find the SIM section in index.html');
  const src = html.slice(start + '<script>'.length, end);
  const exportsList = ['GAME_NAME', 'VERSION', 'BREAK', 'setBreak', 'COND', 'COND_KEYS', 'hasCond', 'setupConds', 'updateMeteors', 'meteorDodge', 'meteorSpot', 'payMul', 'sightMul', 'NEUTRAL', 'REPAIR', 'RELIC', 'SPECIAL', 'RELIC_AI', 'updateRepair', 'medDepot', 'spawnGuards', 'relicGuarded', 'guardValue', 'updateGuards', 'aiRelic', 'aiCapture3', 'powMul', 'rubbleAt', 'padOpen', 'padsOpen', 'aiBreak', 'bbFocus', 'MAPS', 'MAP', 'useMap', 'MAP_HOOKS', 'setLaneNew', 'flagPt', 'laneY', 'aiLanes', 'aiCapture', 'aiForward', 'LANE_AI', 'FWD_RALLY', 'fwdRally', 'UNIT_ORDER', 'canTrain', 'sqFlag', 'navOpen', 'laneTv', 'FWD_PADS', 'FWD_SLOT', 'fwdOk', 'fwdAt', 'NAV', 'navShut', 'navPath', 'navClear', 'nodeInc', 'income', 'NODE_SIGHT', 'MAP_2D', 'MAP_LANED', 'laneY', 'laneIx', 'laneNew', 'setLane', 'laneTv', 'moveToward', 'LANE_GO', 'FOG_NX', 'FOG_NY', 'cellsLit', 'effDist', 'NODE_TYPES', 'MAP_RULES', 'validateMap', 'PADS', 'HQ_TILE', 'SIG_TILE', 'tilePos', 'NODE_R', 'dirOf', 'HQ_U', 'POP_MAX', 'LANE_V', 'AUTO_STANCE', 'RALLY', 'DAMAGED', 'rallyOf', 'setRally', 'useRally', 'sendDamagedHome', 'homeFlagU', 'rallyU0', 'ATTACK', 'LADDER', 'LADDER_D', 'aiDiff', 'aiFix', 'aiRaid', 'aiEnemyIncome', 'aiEstimate', 'updateVision', 'RNG', 'TICK', 'simRnd', 'fxRnd', 'seedGame', 'STATS', 'newStats', 'statsSummary', 'BALANCE', 'setBalance', 'BALANCE7B', 'setBalance7b', 'BALANCE7C', 'setBalance7c', 'MECH7C', 'setMech7c', 'SIG_SLOT', 'sigOnPad', 'playerSide', 'updateRallyWait', 'slotPos', 'SLOT_COUNT', 'HARD_FIX', 'HARD_FIX_7B', 'AI_TACTICS', 'AI_SIG_LATE', 'AI_TECH', 'aiPower', 'aiGunsNear', 'SALVAGE', 'RETREAT', 'FLAME', 'REDESIGN', 'setRedesign', 'corrNow', 'corrode', 'DIST', 'titanSiege', 'volley', 'pierceLine', 'devour', 'acquire', 'indexFoes', 'unitCount', 'rallyU', 'warpPoint', 'onField', 'fire', 'damage', 'popUsed', 'hqU', 'START_RES', 'logGathered', 'AI_PRESETS', 'AI_DIALS', 'rollPersona', 'aiShieldTarget', 'aiEstimate', 'aiRead', 'PERSONA_EXTRA', 'aiLightShare', 'aiPickPath', 'NODE_INC', 'salvage', 'YARD', 'BUNKER', 'SIG', 'paidOf', 'sigOf', 'overdrive', 'updateBunkers', 'bunkerHeal', 'BUILD_ORDER', 'AI_UPG', 'updateNodes', 'aiPlanWith', 'AI_PLAN', 'PERSONAS', 'MOUND', 'ROOT', 'updateMounds', 'updateRoots', 'creepRegen', 'moundOf', 'rootOf', 'zoneStep', 'updateCreep', 'slowU', 'UGROUPS', 'BDEF_BH', 'BDEF_AX', 'damage', 'BEACON', 'ECHO', 'beaconOf', 'relOf', 'beaconPatch', 'inBeacon', 'beaconAnchor', 'echoStore', 'echoCost', 'tryEcho', 'updateField', 'updateWarps', 'outMul', 'scrapShown', 'factionDesc', 'FACTIONS', 'DEFAULT_FACTION', 'factionName', 'abilUnlocked', 'BD', 'BDEFS', 'bdOf', 'fire', 'CREEP', 'onCreep', 'TREES_BH', 'CORR', 'ACID', 'addAcid', 'TEMP', 'SPAWN', 'updateSpawn', 'BDEF_AX', 'FACTION_KEYS', 'SHIELD', 'FIELD', 'WARP', 'onField', 'warpPoint', 'defaultWarp', 'setWarp', 'warpOk', 'warpSpot', 'startWarp', 'TREES_AX', 'AI_SIEGE', 'AI_ART', 'DISRUPT', 'SLOW', 'mwarpPick', 'aiMassWarpTarget', 'newAb', 'beamStep', 'chainBeam', 'shieldLink', 'treeOf', 'AI_PATH_MAP', 'disrupt', 'slowU', 'updateAuras', 'outMul', 'meleeHit', 'extraTargets', 'updateShields', 'prodLocked', 'updateStorm', 'finish', 'acquire', 'aiPathTo', 'GROUP_OF', 'PLURAL', 'UNIT_ORDER', 'COUNTDOWN', 'DIFF', 'BDEF', 'UDEF', 'DMG', 'PSPEED', 'L', 'NODE_U', 'NODE_R', 'NODE_INC',
    'REGEN_DELAY', 'SELL_RATE', 'SAVE_VER', 'newGame', 'update', 'tryBuild', 'tryTrain', 'tryUpgrade', 'trySell', 'tryRepair',
    'repairCost', 'sellValue', 'setStance', 'income', 'popCap', 'popUsed', 'spawnUnit', 'damage', 'kill', 'hqStatus',
    'rallyU', 'hqU', 'countB', 'hasBuilt', 'serialize', 'deserialize', 'SAVE_OK', 'FOG_CELL', 'FOG_N', 'SIGHT', 'B_SIGHT', 'B_SIGHT_DEF',
    'NODE_SIGHT', 'INTEL_TTL', 'cellOf', 'visibleTo', 'updateVision', 'aiUpdate', 'aiSpotter',
    'knownDefense', 'attackBar', 'FAIL_MARGIN', 'FAIL_MEMORY', 'TURRET_VAL', 'HQ_VAL', 'armyValue', 'PERSONAS', 'PERSONA_NAME', 'rollPersona', 'aiAbility', 'ABIL', 'ABIL_ORDER', 'abilityCheck', 'useAbility', 'hqPos', 'EXT', 'stormRate', 'sideScore', 'tieBreak', 'resolveEnd', 'repairHealable', 'refreshShields', 'UGROUPS', 'GROUP_OF', 'newOrders', 'unitOrder', 'giveOrder', 'updateOrders', 'slotOf', 'aiMicro', 'TREES', 'UNIT_PATH', 'DRILL', 'canMake', 'canTrain', 'pathMod', 'aiPickPath', 'unitLockMsg', 'ghostOf', 'acquire', 'flameBurst', 'updateUnit', 'SPOTTER_PREF', 'updateMedics', 'infantryCentre', 'supportSpot',
    'LOG_CAP', 'LOG_SPAN', 'LOG_N', 'LOG_GAP', 'LINE_MAX', 'newLog', 'lg', 'lgUnit', 'logCompact', 'logEvText', 'logLines', 'logText', 'logMoments', 'logBattles', 'mmss'];
  const M = Object.create(Math); if (opts.random) M.random = opts.random;
  const sandbox = { Math: M, JSON, Object, Array, Map, Set, Uint8Array, Float32Array, console, EE_MAP_DATA: opts.map ? JSON.parse(JSON.stringify(opts.map)) : undefined };
  vm.createContext(sandbox);
  // names missing from an older copy of the game (EE_HTML) come back undefined instead of failing
  vm.runInContext(`${src}\n;this.__sim = { ${exportsList.map(n => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ')}, cur: () => { try { return { MAP, L, POP_MAX, FOG_N, FWD_PADS, MAP_2D, MAP_LANED, NODE_U, NAV, cellOf }; } catch (e) { return {}; } } };`, sandbox, { filename: 'index.html#sim' }); // cur (v2.65): the current map's values (the exports above are taken at load)
  return sandbox.__sim;
}

module.exports = { loadSim, readHtml, HTML_PATH };
