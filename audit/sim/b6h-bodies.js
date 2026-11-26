// Batch 6h (v2.98): the body-size table behind BODY6H (src/sim/rework-6h.js). Reads each ground unit's drawn footprint from the
// built game's RENDER section: its shadow radius (UVIS.w, else the renderer's fallback max(8, h × 0.7)) and its sprite box width
// (SPR_BOX), in art units (× US = 1.3 screen px). footprint = max(shadow radius, 0.3 × box width: legs, barrels and tails
// reach past the body); classes: small ≤ 11.5, medium ≤ 16, large ≤ 22, huge above. Prints the table as markdown and checks it against BODY6H.
//   node audit/sim/b6h-bodies.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
const a = html.indexOf('<script>'), b = html.indexOf('/* ===================== RENDER END');
const stub = 'const document = { createElement: () => ({ getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) }) }) }; const window = {}; const navigator = { userAgent: "" }; const localStorage = { getItem: () => null, setItem() {} }; const location = { search: "" };';
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Map, Set, Uint8Array, Float32Array, Float64Array, Int32Array });
let src = html.slice(a + 8, b);
try { vm.runInContext(stub + src + ';this.__r = { UVIS, SPR_BOX, UDEF, BODY6H, bodyClass6h, BODY6H_R, US };', ctx); } catch (e) { console.error('load failed:', e.message); process.exit(1); }
const { UVIS, SPR_BOX, UDEF, BODY6H, BODY6H_R, US } = ctx.__r;
const rows = [];
for (const t of Object.keys(UDEF)) {
  const d = UDEF[t]; if (d.air || t === 'bilelobber' || t === 'riftmortar' || t === 'thornback') continue;
  const sh = UVIS[t] ? UVIS[t].w : Math.max(8, d.h * 0.7), bw = SPR_BOX[t] ? SPR_BOX[t][2] : null, fp = Math.max(sh, bw ? bw * 0.3 : 0);
  const cl = fp <= 11.5 ? 'small' : fp <= 16 ? 'medium' : fp <= 22 ? 'large' : 'huge';
  rows.push({ t, name: d.name, sh: +sh.toFixed(1), bw, fp: +fp.toFixed(1), cl, set: BODY6H[t] });
}
console.log('| unit | shadow radius | sprite box width | footprint | class | radius px | in BODY6H |\n|---|---|---|---|---|---|---|');
for (const r of rows.sort((x, y) => x.fp - y.fp)) console.log(`| ${r.name} | ${r.sh} | ${r.bw ?? '-'} | ${r.fp} | ${r.cl} | ${BODY6H_R[r.set]} | ${r.set}${r.set !== r.cl ? ' (differs)' : ''} |`);
