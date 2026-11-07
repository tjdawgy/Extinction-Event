// v2.55 (Phase 0 stance fix): spawn sides are even. 50 seeded Hard mirrors per faction (seeds 1-50, side 0 always on the
// left, both sides Hard with random openings, to the 27:00 limit), on the audit harness's worker processes, 4 at a time.
// Most Hard mirrors end in a storm draw (v2.48), so only 5-14 of 50 are decided, too few for a 60% limit to mean
// anything (a fair 5-2 is 71%). So each match counts for one side: the winner, or in a draw the side that was ahead (the
// remaining-strength score the tie-break recorded, or the side whose HQ the storm did not take). Neither side may take
// more than 60% of those; the plain decided counts are printed, and pooled over the three factions (the last test) neither
// side may win more than 60% of them. Before the fix the right side won 61 of 64 decided
// Axiarch mirrors (an AI-played side 0 started on Hold).
const test = require('node:test');
const assert = require('node:assert');
const { runSpecs } = require('../../audit/sim/run');

const N = 50, MAX = 0.6, DEC = [0, 0]; // DEC: decided matches over all three factions, by side
const ahead = r => r.winner >= 0 ? r.winner : r.score && r.score[0] !== r.score[1] ? (r.score[0] > r.score[1] ? 0 : 1) : r.loser === 0 || r.loser === 1 ? 1 - r.loser : -1;
for (const f of ['lastfist', 'bloomhost', 'axiarchs']) {
  test(`${f} Hard mirror: neither spawn side comes out ahead in more than 60% of ${N} seeded matches`, { timeout: 1200000 }, async () => {
    const side = { faction: f, ai: 'hard', persona: 'random' }, specs = [];
    for (let i = 0; i < N; i++) specs.push({ seed: 1 + i, diff: 'hard', maxT: 1620, sides: [side, side] });
    const res = await runSpecs(specs, 4);
    const w = [0, 0], a = [0, 0];
    for (const r of res) { if (r.winner >= 0) { w[r.winner]++; DEC[r.winner]++; } const k = ahead(r); if (k >= 0) a[k]++; }
    const n = a[0] + a[1];
    console.log(`# ${f}: decided left ${w[0]} – right ${w[1]}; ahead at the end (decided or draw) left ${a[0]} – right ${a[1]} of ${N}`);
    assert.ok(n >= N * 0.8, `${n} of ${N} matches have a side ahead`);
    for (const s of [0, 1]) assert.ok(a[s] / n <= MAX, `${f}: side ${s} ahead in ${a[s]} of ${n} (${(100 * a[s] / n).toFixed(1)}%)`);
  });
}
// The decided matches pooled over the three factions (about 30 on these seeds): neither side wins more than 60% of them.
// Measured: 15-13 with the fix (v2.55), 62-63 on v2.60's Hard (more matches are decided); 26-55 (68% for the right) with AUTO_STANCE.retreat false.
test('all three mirrors together: neither spawn side wins more than 60% of the decided matches', () => {
  const n = DEC[0] + DEC[1];
  assert.ok(n >= 20, `${n} decided`);
  for (const s of [0, 1]) assert.ok(DEC[s] / n <= MAX, `side ${s} won ${DEC[s]} of ${n} decided (${(100 * DEC[s] / n).toFixed(1)}%)`);
});
