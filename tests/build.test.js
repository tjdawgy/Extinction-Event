// v2.57: index.html is built from src/ (build.js). The committed index.html must be exactly what a fresh build of src/
// gives, and every file in src/ must be one of the build's parts: an edit made to index.html directly, or to src/
// without `npm run build`, fails here.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { build, listed, PARTS, OUT } = require('../build');

test('every file in src/ is a build part and every part exists', () => {
  const L = listed();
  assert.deepStrictEqual(L.extra, [], 'files in src/ that build.js does not list');
  assert.deepStrictEqual(L.missing, [], 'parts listed in build.js that are missing');
  assert.strictEqual(new Set(PARTS).size, PARTS.length, 'no part twice');
});

test('the committed index.html is exactly a fresh build of src/ (run `npm run build` after editing src/)', () => {
  const fresh = build(), cur = fs.readFileSync(OUT, 'utf8');
  if (cur !== fresh) {
    const a = cur.split('\n'), b = fresh.split('\n'); let i = 0; while (i < a.length && a[i] === b[i]) i++;
    assert.fail(`index.html differs from a fresh build from line ${i + 1}: edit src/, then run npm run build`);
  }
});

test('the section markers the test kit and audit/sim slice by are where they were: one SIM, RENDER and UI section', () => {
  const html = build(), at = s => html.indexOf(s);
  assert.ok(at('<script>') > 0 && at('<script>') < at('SIM END') && at('SIM END') < at('RENDER END') && at('RENDER END') < at('</script>'));
  assert.strictEqual(html.split('===================== SIM END').length, 2);
  assert.strictEqual(html.split('===================== RENDER END').length, 2);
});
