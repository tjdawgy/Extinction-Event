// Pulls the SIM section (rules, economy, combat, AI, save/load) out of index.html
// and evaluates it in a sandbox, so it can be tested without a browser.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML_PATH = path.join(__dirname, '..', 'index.html');

function readHtml() { return fs.readFileSync(process.env.EE_HTML || HTML_PATH, 'utf8'); } // EE_HTML: test another copy of the game

// opts.random: a replacement for Math.random inside the SIM (for deterministic comparisons)
function loadSim(opts = {}) {
  const html = readHtml();
  const start = html.indexOf('<script>');
  const end = html.indexOf('/* ===================== SIM END');
  if (start < 0 || end < 0) throw new Error('Could not find the SIM section in index.html');
  const src = html.slice(start + '<script>'.length, end);
  const exportsList = ['GAME_NAME', 'VERSION', 'SALVAGE', 'RETREAT', 'FLAME', 'REDESIGN', 'setRedesign', 'corrNow', 'corrode', 'DIST', 'titanSiege', 'volley', 'pierceLine', 'devour', 'acquire', 'indexFoes', 'unitCount', 'rallyU', 'warpPoint', 'onField', 'fire', 'damage', 'popUsed', 'hqU', 'START_RES', 'logGathered', 'salvage', 'YARD', 'BUNKER', 'SIG', 'paidOf', 'sigOf', 'overdrive', 'updateBunkers', 'bunkerHeal', 'BUILD_ORDER', 'AI_UPG', 'updateNodes', 'aiPlanWith', 'AI_PLAN', 'PERSONAS', 'MOUND', 'ROOT', 'updateMounds', 'updateRoots', 'creepRegen', 'moundOf', 'rootOf', 'zoneStep', 'updateCreep', 'slowU', 'UGROUPS', 'BDEF_BH', 'BDEF_AX', 'damage', 'BEACON', 'ECHO', 'beaconOf', 'relOf', 'beaconPatch', 'inBeacon', 'beaconAnchor', 'echoStore', 'echoCost', 'tryEcho', 'updateField', 'updateWarps', 'outMul', 'scrapShown', 'factionDesc', 'FACTIONS', 'DEFAULT_FACTION', 'factionName', 'abilUnlocked', 'BD', 'BDEFS', 'bdOf', 'fire', 'CREEP', 'onCreep', 'TREES_BH', 'CORR', 'ACID', 'addAcid', 'TEMP', 'SPAWN', 'updateSpawn', 'BDEF_AX', 'FACTION_KEYS', 'SHIELD', 'FIELD', 'WARP', 'onField', 'warpPoint', 'defaultWarp', 'setWarp', 'warpOk', 'warpSpot', 'startWarp', 'TREES_AX', 'AI_SIEGE', 'AI_ART', 'DISRUPT', 'SLOW', 'mwarpPick', 'aiMassWarpTarget', 'newAb', 'beamStep', 'chainBeam', 'shieldLink', 'treeOf', 'AI_PATH_MAP', 'disrupt', 'slowU', 'updateAuras', 'outMul', 'meleeHit', 'extraTargets', 'updateShields', 'prodLocked', 'updateStorm', 'finish', 'acquire', 'aiPathTo', 'GROUP_OF', 'PLURAL', 'UNIT_ORDER', 'COUNTDOWN', 'DIFF', 'BDEF', 'UDEF', 'DMG', 'PSPEED', 'L', 'NODE_U', 'NODE_R', 'NODE_INC',
    'REGEN_DELAY', 'SELL_RATE', 'SAVE_VER', 'newGame', 'update', 'tryBuild', 'tryTrain', 'tryUpgrade', 'trySell', 'tryRepair',
    'repairCost', 'sellValue', 'setStance', 'income', 'popCap', 'popUsed', 'spawnUnit', 'damage', 'kill', 'hqStatus',
    'rallyU', 'hqU', 'countB', 'hasBuilt', 'serialize', 'deserialize', 'SAVE_OK', 'FOG_CELL', 'FOG_N', 'SIGHT', 'B_SIGHT', 'B_SIGHT_DEF',
    'NODE_SIGHT', 'INTEL_TTL', 'cellOf', 'visibleTo', 'updateVision', 'aiUpdate', 'aiSpotter',
    'knownDefense', 'attackBar', 'FAIL_MARGIN', 'FAIL_MEMORY', 'TURRET_VAL', 'HQ_VAL', 'armyValue', 'PERSONAS', 'PERSONA_NAME', 'rollPersona', 'aiAbility', 'ABIL', 'ABIL_ORDER', 'abilityCheck', 'useAbility', 'hqPos', 'EXT', 'stormRate', 'sideScore', 'tieBreak', 'resolveEnd', 'repairHealable', 'refreshShields', 'UGROUPS', 'GROUP_OF', 'newOrders', 'unitOrder', 'giveOrder', 'updateOrders', 'slotOf', 'aiMicro', 'TREES', 'UNIT_PATH', 'DRILL', 'canMake', 'canTrain', 'pathMod', 'aiPickPath', 'unitLockMsg', 'ghostOf', 'acquire', 'flameBurst', 'updateUnit', 'SPOTTER_PREF', 'updateMedics', 'infantryCentre', 'supportSpot',
    'LOG_CAP', 'LOG_SPAN', 'LOG_N', 'LOG_GAP', 'LINE_MAX', 'newLog', 'lg', 'lgUnit', 'logCompact', 'logEvText', 'logLines', 'logText', 'logMoments', 'logBattles', 'mmss'];
  const M = Object.create(Math); if (opts.random) M.random = opts.random;
  const sandbox = { Math: M, JSON, Object, Array, Map, Set, Uint8Array, Float32Array, console };
  vm.createContext(sandbox);
  // names missing from an older copy of the game (EE_HTML) come back undefined instead of failing
  vm.runInContext(`${src}\n;this.__sim = { ${exportsList.map(n => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ')} };`, sandbox, { filename: 'index.html#sim' });
  return sandbox.__sim;
}

module.exports = { loadSim, readHtml, HTML_PATH };
