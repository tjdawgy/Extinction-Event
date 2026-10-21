// Pulls the SIM section (rules, economy, combat, AI, save/load) out of index.html
// and evaluates it in a sandbox, so it can be tested without a browser.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML_PATH = path.join(__dirname, '..', 'index.html');

function readHtml() { return fs.readFileSync(HTML_PATH, 'utf8'); }

function loadSim() {
  const html = readHtml();
  const start = html.indexOf('<script>');
  const end = html.indexOf('/* ===================== SIM END');
  if (start < 0 || end < 0) throw new Error('Could not find the SIM section in index.html');
  const src = html.slice(start + '<script>'.length, end);
  const exportsList = ['GAME_NAME', 'VERSION', 'COUNTDOWN', 'DIFF', 'BDEF', 'UDEF', 'DMG', 'PSPEED', 'L', 'NODE_U', 'NODE_R', 'NODE_INC',
    'REGEN_DELAY', 'SELL_RATE', 'SAVE_VER', 'newGame', 'update', 'tryBuild', 'tryTrain', 'tryUpgrade', 'trySell', 'tryRepair',
    'repairCost', 'sellValue', 'setStance', 'income', 'popCap', 'popUsed', 'spawnUnit', 'damage', 'kill', 'hqStatus',
    'rallyU', 'hqU', 'countB', 'hasBuilt', 'serialize', 'deserialize'];
  const sandbox = { Math, JSON, Object, Array, Map, console };
  vm.createContext(sandbox);
  vm.runInContext(`${src}\n;this.__sim = { ${exportsList.join(', ')} };`, sandbox, { filename: 'index.html#sim' });
  return sandbox.__sim;
}

module.exports = { loadSim, readHtml, HTML_PATH };
