// Loads the game's REAL SIM section (rules, combat, AI) out of index.html into a fresh, isolated VM context: no copy of
// the logic, no rendering. The context has its own native Math with Math.random replaced by a seeded generator, so a
// match is fully determined by its seed. One context per match: nothing leaks between matches.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML = path.join(__dirname, '..', '..', 'index.html');
let SRC = null; // the SIM source, read once per process
function simSource(file) {
  if (SRC && !file) return SRC;
  const html = fs.readFileSync(file || process.env.EE_HTML || HTML, 'utf8');
  const a = html.indexOf('<script>'), b = html.indexOf('/* ===================== SIM END');
  if (a < 0 || b < 0) throw new Error('SIM section not found in index.html');
  const src = html.slice(a + '<script>'.length, b);
  if (!file) SRC = src;
  return src;
}
// mulberry32: the same generator the test kit uses
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const EXPORTS = ['VERSION', 'BALANCE', 'setBalance', 'YARD', 'newGame', 'update', 'UDEF', 'BDEF', 'BD', 'FACTIONS', 'FACTION_KEYS', 'PERSONAS', 'AI_PRESETS', 'UNIT_ORDER', 'popUsed', 'popCap', 'armyValue', 'income', 'setRedesign', 'REDESIGN', 'RETREAT', 'FLAME', 'SALVAGE', 'SIG', 'serialize', 'EXT', 'L', 'hqU', 'facOf', 'ABIL', 'tryBuild', 'tryTrain', 'tryUpgrade', 'setStance', 'giveOrder', 'useAbility', 'abilityCheck', 'canTrain', 'canMake', 'countB', 'alive', 'visibleTo', 'treeOf', 'NODE_U', 'POP_MAX', 'AI_TACTICS', 'DIFF'];
// opts.instrument: extra code run in the match's context after the SIM loads (audit/sim/instrument.js; diagnostics only:
// it may wrap SIM functions to count things, never change what they do)
function loadSim(seed, opts = {}) {
  const ctx = vm.createContext({ console });
  vm.runInContext(`Math.random = (${mulberry.toString()})(${seed | 0});`, ctx);
  vm.runInContext(`${simSource(opts.file)}\n;this.__sim = { ${EXPORTS.map(n => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ')} };`, ctx, { filename: 'index.html#sim' });
  if (opts.instrument) vm.runInContext(opts.instrument, ctx, { filename: 'instrument.js' });
  return ctx.__sim;
}
module.exports = { loadSim, simSource, mulberry };
