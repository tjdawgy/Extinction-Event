#!/usr/bin/env node
// Builds the game, index.html, from the files in src/ (v2.57). No dependencies and no transforms: the parts below are
// joined in this order, byte for byte, and written to index.html, which stays committed (GitHub Pages serves it, and it
// is still one self-contained file). Edit src/, then run `npm run build` (or `node build.js`) and commit both.
//   node build.js           write index.html
//   node build.js --out f   write the build to f instead (experiments)
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
  'sim/core.js', 'sim/trees-balance.js', 'sim/ai-presets.js', 'sim/game.js', 'sim/fog-update.js', 'sim/units.js', 'sim/control.js', // v2.73: direct control (docs/CONTROLS.md)
  'sim/creep-field-signature.js', 'sim/abilities.js', 'sim/storm-combat.js', 'sim/nodes-special.js', 'sim/conditions.js', 'sim/rework.js', 'sim/rework-2b.js', 'sim/rework-3a.js', 'sim/rework-3b.js', 'sim/rework-4a.js', 'sim/rework-4b.js', 'sim/rework-5b.js', 'sim/rework-5c.js', 'sim/rework-6b.js', 'sim/rework-6c.js', 'sim/rework-6d.js', 'sim/rework-6e.js', 'sim/rework-6f.js', 'sim/rework-6g.js', 'sim/rework-6h.js', 'sim/rework-6i.js', 'sim/ai.js', 'sim/stats-log-save.js', 'sim/testrange.js', 'sim/report.js', // v2.81: the Test Range's SIM helpers; v2.82: rework batch 2a; v2.83: batch 2b; v2.84: batch 3a; v2.85: batch 3b; v2.86: batch 4a; v2.87: batch 4b; v2.88: batch 5b; v2.89: batch 5a (Last Fist art); v2.90: batch 5c (the Bloomspire roll); v2.92: batch 6b (the side-bias fix); v2.93: batch 6c (the HQ shield rule, unit tuning)
  // RENDER: drawing (ends at the RENDER END marker)
  'render/core.js', 'render/buildings-lastfist.js', 'render/buildings-bloomhost.js', 'render/buildings-axiarchs-units.js', 'render/units-rework.js', 'render/units-rework-2b.js', 'render/units-rework-3a.js', 'render/units-rework-3b.js', 'render/units-rework-4a.js', 'render/units-rework-4b.js', 'render/units-rework-5b.js', 'render/units-rework-5a.js', 'render/units-rework-5c.js', 'render/units-rework-6h.js', 'render/buildings-rework-5d.js', // v2.98: batch 6h (the Queen, Broodback, Chitin Warden, Mite; effects)
   // v2.91: batch 5d (every building redrawn); v2.82: rework batch 2a art; v2.83: batch 2b; v2.84: batch 3a; v2.85: batch 3b; v2.88: batch 5b; v2.89: batch 5a (Last Fist art); v2.90: batch 5c (Axiarch art)
  'render/backdrop.js', 'render/effects.js', 'render/minimap.js',
  // UI: HUD, input, menus, report, sound, main loop, Codex, tutorial
  'ui/core.js', 'ui/hud.js', 'ui/army-abilities.js', 'ui/controls.js', 'ui/panel-alerts-input.js', 'ui/menus.js', 'ui/report.js', 'ui/sound.js',
  'ui/main.js', 'ui/codex.js', 'ui/testrange.js', 'ui/tutorial.js', // v2.81: the Test Range (before tutorial.js, which starts the frame loop)
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
  const oi = process.argv.indexOf('--out'); // v2.94: --out <file> writes a build elsewhere (experiments; audit/sim reads it via EE_HTML)
  if (oi > 0) { fs.writeFileSync(process.argv[oi + 1], html); console.log(`built to ${process.argv[oi + 1]}`); return; }
  fs.writeFileSync(OUT, html);
  console.log(`index.html built from ${PARTS.length} parts (${Buffer.byteLength(html)} bytes)`);
}
