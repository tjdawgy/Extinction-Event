// Bot vs bot (no AI): the calibrated Rifleman rush (side 0) against smart-defender variants (side 1).
// Equal start and income on both sides. Answers: can a well-played counter beat this rush?
//   node tests/duel.js [matches=20] [defender name filters...]
const { loadSim } = require('./load-sim');
const { BOTS, duel } = require('./bots');
const { CALIBRATED } = require('./rush-variants-list');
const sim = loadSim();
const P2 = ['barracks', 'refinery', 'barracks', 'refinery', 'turret', 'factory', 'habitat', 'refinery'];
const DEFENDERS = {
  'D1 B,Tur,R,Fac (Tanks)':                       {},
  'D2 B,R,B,R,Tur, 12 Riflemen, then Tanks':       { plan: P2, riflesFirst: 12 },
  'D3 = D2, holding its near node':                { plan: P2, riflesFirst: 12, holdDist: 420 },
  'D4 mirror: B,R,B,R,B,R, Riflemen, mid node':    { plan: ['barracks', 'refinery', 'barracks', 'refinery', 'barracks', 'refinery', 'habitat', 'factory'], riflesFirst: 40, holdDist: 630 },
  'D5 B,R,Tur,Tur,R,Fac':                          { plan: ['barracks', 'refinery', 'turret', 'turret', 'refinery', 'factory', 'habitat'], riflesFirst: 6 },
  'D6 B,R,Fac,R early Tanks':                      { plan: ['barracks', 'refinery', 'factory', 'refinery', 'habitat', 'turret'], riflesFirst: 4 },
  'D7 rush economy, 12+ at home, then near node':  { plan: ['barracks', 'refinery', 'barracks', 'barracks', 'refinery', 'refinery', 'turret', 'factory'], riflesFirst: 40, holdDist: 420, holdMin: 12 },
  'D8 = D7 holding just inside HQ range (380)':    { plan: ['barracks', 'refinery', 'barracks', 'barracks', 'refinery', 'refinery', 'turret', 'factory'], riflesFirst: 40, holdDist: 380, holdMin: 12 },
  'D9 = D7 + counterattack at 30 units':           { plan: ['barracks', 'refinery', 'barracks', 'barracks', 'refinery', 'refinery', 'turret', 'factory'], riflesFirst: 40, holdDist: 420, holdMin: 12, attackArmy: 30 },
  'D10 = D7 + Tanks after 20 Riflemen, attack 30': { plan: ['barracks', 'refinery', 'barracks', 'barracks', 'refinery', 'refinery', 'turret', 'factory'], riflesFirst: 20, holdDist: 420, holdMin: 12, attackArmy: 30 },
};
const n = +(process.argv[2] || 20), pick = process.argv.slice(3);
const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
console.log(`Calibrated rush (side 0) vs smart defenders (side 1), equal start and income, ${n} matches each (20-minute cap)\n`);
for (const [name, opts] of Object.entries(DEFENDERS)) {
  if (pick.length && !pick.some(p => name.includes(p))) continue;
  let w = 0, l = 0, to = 0; const len = [];
  for (let i = 0; i < n; i++) { const r = duel(sim, s => BOTS.rushx(s, CALIBRATED), s => BOTS.defender(s, opts), { maxT: 1200 }); if (r.winner === 0) w++; else if (r.winner === 1) l++; else to++; len.push(r.t); }
  len.sort((a, b) => a - b);
  console.log(`${name.padEnd(44)} rush wins ${String(w).padStart(2)}  defender wins ${String(l).padStart(2)}  timeouts ${to}  median ${fmt(len[len.length >> 1])}`);
}
