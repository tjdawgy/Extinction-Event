#!/usr/bin/env node
// Builds the game, index.html, from the files in src/ (v2.57). No dependencies and no transforms: the parts below are
// joined in this order, byte for byte, and written to index.html, which stays committed (GitHub Pages serves it, and it
// is still one self-contained file). Edit src/, then run `npm run build` (or `node build.js`) and commit both.
//   node build.js           write index.html
//   node build.js --check   exit 1 if index.html differs from a fresh build (npm test runs this check)
// The SIM / RENDER / UI section markers stay inside the parts, so the test kit and audit/sim slice the built file as before.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname, SRC = path.join(ROOT, 'src'), OUT = path.join(ROOT, 'index.html');
const PARTS = [
  'head.html', 'style.css', 'body.html', // <head> up to <style>; the CSS; </style>, the page markup and <script>
  // SIM: rules, combat, AI (ends at the SIM END marker)
  'sim/maps.js', // v2.59: the map data (docs/MAP_FORMAT.md), read by everything after it
  'sim/maps-twolane.js', // v2.65: the Two-Lane map (docs/TWO_LANE.md)
  'sim/maps-threelane.js', // v2.70: the Three-Lane map (docs/PHASE1_DESIGNS.md, Proposal D)
  'sim/core.js', 'sim/trees-balance.js', 'sim/ai-presets.js', 'sim/game.js', 'sim/fog-update.js', 'sim/units.js',
  'sim/creep-field-signature.js', 'sim/abilities.js', 'sim/storm-combat.js', 'sim/ai.js', 'sim/stats-log-save.js', 'sim/report.js',
  // RENDER: drawing (ends at the RENDER END marker)
  'render/core.js', 'render/buildings-lastfist.js', 'render/buildings-bloomhost.js', 'render/buildings-axiarchs-units.js',
  'render/backdrop.js', 'render/effects.js', 'render/minimap.js',
  // UI: HUD, input, menus, report, sound, main loop, Codex, tutorial
  'ui/core.js', 'ui/hud.js', 'ui/army-abilities.js', 'ui/panel-alerts-input.js', 'ui/menus.js', 'ui/report.js', 'ui/sound.js',
  'ui/main.js', 'ui/codex.js', 'ui/tutorial.js',
  'end.html', // </script></body></html>
];

const listed = () => { // every file in src/ must be a part, and every part must exist
  const all = [], walk = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else all.push(path.relative(SRC, p).split(path.sep).join('/')); } };
  walk(SRC);
  return { extra: all.filter(f => !PARTS.includes(f)), missing: PARTS.filter(f => !all.includes(f)) };
};
const build = () => PARTS.map(p => fs.readFileSync(path.join(SRC, p), 'utf8')).join('');

module.exports = { PARTS, build, listed, OUT };
if (require.main === module) {
  const L = listed();
  if (L.extra.length || L.missing.length) { console.error(`src/ and PARTS disagree. Not in PARTS: ${L.extra.join(', ') || 'none'}. Missing: ${L.missing.join(', ') || 'none'}`); process.exit(1); }
  const html = build();
  if (process.argv.includes('--check')) {
    const cur = fs.readFileSync(OUT, 'utf8');
    if (cur === html) { console.log(`index.html matches a fresh build (${PARTS.length} parts, ${Buffer.byteLength(html)} bytes)`); process.exit(0); }
    const a = cur.split('\n'), b = html.split('\n'); let i = 0; while (i < a.length && a[i] === b[i]) i++;
    console.error(`index.html differs from a fresh build of src/ from line ${i + 1}. Edit src/, not index.html, then run: npm run build`);
    process.exit(1);
  }
  fs.writeFileSync(OUT, html);
  console.log(`index.html built from ${PARTS.length} parts (${Buffer.byteLength(html)} bytes)`);
}
