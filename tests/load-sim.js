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
  const exportsList = ['GAME_NAME', 'VERSION', 'COUNTDOWN', 'DIFF', 'BDEF', 'UDEF', 'DMG', 'PSPEED', 'L', 'NODE_U', 'NODE_R', 'NODE_INC',
    'REGEN_DELAY', 'SELL_RATE', 'SAVE_VER', 'newGame', 'update', 'tryBuild', 'tryTrain', 'tryUpgrade', 'trySell', 'tryRepair',
    'repairCost', 'sellValue', 'setStance', 'income', 'popCap', 'popUsed', 'spawnUnit', 'damage', 'kill', 'hqStatus',
    'rallyU', 'hqU', 'countB', 'hasBuilt', 'serialize', 'deserialize', 'SAVE_OK', 'FOG_CELL', 'FOG_N', 'SIGHT', 'B_SIGHT', 'B_SIGHT_DEF',
    'NODE_SIGHT', 'INTEL_TTL', 'cellOf', 'visibleTo', 'updateVision', 'aiUpdate', 'aiSpotter',
    'knownDefense', 'attackBar', 'FAIL_MARGIN', 'FAIL_MEMORY', 'TURRET_VAL', 'HQ_VAL', 'armyValue', 'PERSONAS', 'PERSONA_NAME', 'rollPersona', 'aiAbility', 'ABIL', 'ABIL_ORDER', 'abilityCheck', 'useAbility', 'hqPos', 'EXT', 'stormRate', 'sideScore', 'tieBreak', 'resolveEnd'];
  const M = Object.create(Math); if (opts.random) M.random = opts.random;
  const sandbox = { Math: M, JSON, Object, Array, Map, Set, Uint8Array, Float32Array, console };
  vm.createContext(sandbox);
  // names missing from an older copy of the game (EE_HTML) come back undefined instead of failing
  vm.runInContext(`${src}\n;this.__sim = { ${exportsList.map(n => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ')} };`, sandbox, { filename: 'index.html#sim' });
  return sandbox.__sim;
}

module.exports = { loadSim, readHtml, HTML_PATH };
