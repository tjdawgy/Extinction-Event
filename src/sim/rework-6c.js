/* ---------- Batch 6c, Part B0 (v2.93, docs/FACTION_REWORK.md "Batch 6c"): the HQ shield rule (REWORK.b6hq) ----------
   Stored per game in g.rw (rwB6hq). Off: v2.92's rule exactly (refreshShields: another finished base building, AND, with
   BREAK.prod, a finished production building (Barracks, War Factory or Tech Lab role) in the base); nothing below runs or is
   saved. On: a side's HQ is shielded while at least one other finished building of that side stands (hqHolds): not the HQ, not
   a building on a field node (the Node Bunker; a forward pad is a node too), not one still under construction. It drops as soon
   as none is left and comes back when one is finished again; the same for both sides. The HQ shows how many hold it up
   (hqHolders; drawn on the shield). The AI's base attack aims at the holders first (bbFocus: every holder alike, production
   or not), so it breaks the shield before it commits to the HQ (a shielded HQ can't be targeted or hurt anyway). */
const rwB6hq = g => !!(g && g.rw && g.rw.b6hq);
const hqHolds = b => b.kind === 'b' && b.type !== 'hq' && b.type !== 'bunker' && !(b.slot >= FWD_SLOT) && b.hp > 0 && b.built;
function hqHolders(g, s) { let n = 0; for (const b of g.ents) if (b.side === s && hqHolds(b)) n++; return n; }
// The rule in words, for the HQ's description, the Codex, the setup tips and the tutorial (rw: a game's switches or REWORK)
const hqShieldTxt = (rw, your = 'your') => (rw || REWORK).b6hq ? `Shielded while any other finished building stands in ${your} base (node bunkers and forward pads don't count)` : `Shielded while a production building stands in ${your} base`;

/* ---------- Batch 6c, Part B1 (v2.93): the first unit tuning (REWORK.b6c) ----------
   Stored per game in g.rw (rwB6c). Off: v2.92's numbers; nothing below changes anything. On, each lever named by the batch:
   - barHp: the Bastion barrier's health (BAR.hp 600), so it raises the cost to break a held front by about 40-60%, not 158%;
   - broodCost: one brood order's price (BROOD.cost 120);
   - levDmg: each Leviathan run bomb's damage (P10's 35), toward 60-70% of the pre-rework Leviathan's damage per second;
   - latchDps: a latched Leaper's damage per second (LATCH.dps 10); rsDmg: the Riftstalker's blade (18).
   The values and the measurements behind them are in docs/FACTION_REWORK.md "Batch 6c" (audit/sim/b6c-range.js). */
const rwB6c = g => !!(g && g.rw && g.rw.b6c);
const B6C = { barHp: 300, broodCost: 164, levDmg: 90, latchDps: 55, rsDmg: 23, rsHeavy: 1.5, rsVeh: 1.4 }; // v2.92: 600, 120, 35, 10, 18, 0.9, 0.6 (docs/FACTION_REWORK.md "Batch 6c")
// The Riftstalker's blade against armour with b6c on (a weapon of its own, so v2.92's riftblade is untouched): light stays 1.5 (a
// Marine must still take two blows, so it never wins head-on against Marines), heavy and vehicle from B6C (the second lever)
DMG.riftblade6 = Object.defineProperties({ light: DMG.riftblade.light, air: DMG.riftblade.air, building: DMG.riftblade.building }, { heavy: { get: () => B6C.rsHeavy, enumerable: true }, vehicle: { get: () => B6C.rsVeh, enumerable: true } });
const barHp = g => rwB6c(g) ? B6C.barHp : BAR.hp;
const broodCost = g => rwB6c(g) ? B6C.broodCost : BROOD.cost;
const latchDps = g => rwB6c(g) ? B6C.latchDps : LATCH.dps;
// The HQ's description follows the new-game default (the Codex and the info card): batch 6c's rule when b6hq is on
for (const D of [BDEF.hq, BDEF_BH.hq, BDEF_AX.hq]) {
  const d0 = D.desc;
  Object.defineProperty(D, 'desc', { get: () => d0.replace(/Shielded while a production building stands in (your|the) base/, (m, w) => hqShieldTxt(REWORK, w)), enumerable: true, configurable: true });
}
