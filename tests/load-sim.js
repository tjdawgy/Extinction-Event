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
  const exportsList = ['GAME_NAME', 'VERSION', 'DIFF', 'BDEF', 'UDEF', 'newGame', 'update', 'tryBuild', 'tryTrain',
    'tryUpgrade', 'trySell', 'tryRepair', 'setStance', 'income', 'popCap', 'popUsed', 'serialize', 'deserialize'];
  const sandbox = { Math, JSON, Object, Array, Map, console };
  vm.createContext(sandbox);
  vm.runInContext(`${src}\n;this.__sim = { ${exportsList.join(', ')} };`, sandbox, { filename: 'index.html#sim' });
  return sandbox.__sim;
}

module.exports = { loadSim, readHtml, HTML_PATH };
