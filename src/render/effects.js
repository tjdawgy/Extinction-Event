/* ---------- Combat effects (render only) ----------
   The SIM is left exactly as it is: these effects are worked out by watching its state each frame (a cooldown that
   jumps back up = a shot, a projectile that disappears = an impact, an entity that disappears with no hp = a death).
   They use their own random numbers, so they can never change a match. Everything is pooled and capped, follows the
   player's fog exactly (nothing is spawned or drawn for what the player can't see) and skips fights off screen.
   Quality steps down automatically when frames run long (see vfxQuality). */
const VFX_PARTS = 300, VFX_FX = 120, VFX_DECALS = 12, VFX_SMOKERS = 6;
// v2.36: Flame Tank fire (particle kind 4) has its own ceiling inside the pool, so a wall of Flame Tanks can't crowd out
// every other effect; each tank's stream thins as more of them burn at once (FIRE.rate is shared out)
const FIRE = { max: 80, rate: 110, share: 360, life: [0.28, 0.4] };
const QMUL = [0.3, 0.6, 1];                       // particle counts per quality level (0 low, 1 medium, 2 full)
const VFX = {
  g: null, lastT: -1, frame: 0, q: 2, lock: null, shake: 0, rnd: mulberry(4242),
  parts: [], np: 0, fx: [], nfx: 0, decals: [], smokers: [], wrecks: [], nfire: 0, flamers: new Set(),
  rec: new WeakMap(), seenFx: new WeakSet(), warpSeen: new WeakSet(), prevE: [], prevP: [], prevA: [], shots: [], nshots: 0, freeRec: [],
  reduced: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  gaps: [], gapAt: 0, slowFor: 0, fastFor: 0,
};
for (let i = 0; i < VFX_PARTS; i++) VFX.parts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 1, kind: 0, col: '', grav: 0, floor: 0, pri: 0 });
for (let i = 0; i < VFX_FX; i++) VFX.fx.push({ k: '', x: 0, y: 0, x2: 0, y2: 0, r: 0, r2: 0, t: 0, life: 1, col: null, w: 1, pri: 0 });
for (let i = 0; i < 64; i++) VFX.shots.push({ e: null, u: 0, v: 0, z: 0, w: '' });
const vr = (a, b) => a + VFX.rnd() * (b - a);
function sfx(name, x, size) { sndPlay(name, x, size); } // effects → sound (sndPlay is in the UI section)

// Soft glows drawn once into small canvases, then stamped (no gradients built during play)
function makeGlow(rgb) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const k = cv.getContext('2d'), gr = k.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.35, `rgba(${rgb},0.55)`); gr.addColorStop(1, `rgba(${rgb},0)`);
  k.fillStyle = gr; k.fillRect(0, 0, 64, 64); return cv;
}
const GLOW = { warm: makeGlow('255,214,140'), white: makeGlow('255,255,255'), cyan: makeGlow('150,235,255'), fire: makeGlow('255,150,60'), t0: makeGlow(TEAM[0].glow), t1: makeGlow(TEAM[1].glow), acid: makeGlow('155,225,93'), frenzy: makeGlow('255,120,210'), violet: makeGlow('180,140,255'), ember: makeGlow('255,80,30') }; // v2.36: violet for Axiarch rift energy, ember for burnt-out flame
function stamp(c, img, x, y, r, a) { if (a <= 0.01 || r <= 0) return; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - r, y - r, r * 2, r * 2); }

// Pools. Particle kinds: 0 smoke, 1 spark, 2 debris (falls and settles), 3 dust, 4 fire (v2.36). pri 1 = may push out pri 0.
function vPart(x, y, vx, vy, life, size, kind, col, grav, pri, floor) {
  const P_ = VFX.parts;
  let p = null;
  if (VFX.np < VFX_PARTS) p = P_[VFX.np++];
  else if (pri > 0) { for (let i = 0; i < VFX.np; i++) if (P_[i].pri === 0) { p = P_[i]; break; } }
  if (!p) return; // full: the least important effect is the one dropped
  if (p.kind === 4 && p.life > 0) VFX.nfire--; if (kind === 4) VFX.nfire++;
  p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = p.max = life; p.size = size; p.kind = kind; p.col = col; p.grav = grav || 0; p.pri = pri || 0; p.floor = floor ?? 1e9;
}
function vFx(k, x, y, r, life, col, pri, x2 = 0, y2 = 0, w = 1, delay = 0) {
  const F_ = VFX.fx;
  let f = null;
  if (VFX.nfx < VFX_FX) f = F_[VFX.nfx++];
  else { let lo = pri; for (let i = 0; i < VFX.nfx; i++) if (F_[i].pri < lo) { lo = F_[i].pri; f = F_[i]; } }
  if (!f) return;
  f.k = k; f.x = x; f.y = y; f.r = r; f.life = life; f.col = col; f.pri = pri; f.x2 = x2; f.y2 = y2; f.w = w; f.t = -delay;
}
function vCount(n) { return Math.max(n > 0 ? 1 : 0, Math.round(n * QMUL[VFX.q])); }

function vfxReset(g) {
  VFX.g = g; VFX.lastT = -1; VFX.np = 0; VFX.nfx = 0; VFX.nfire = 0; VFX.flamers.clear(); VFX.shake = 0; VFX.primed = false;
  VFX.decals.length = 0; VFX.smokers.length = 0; VFX.wrecks.length = 0; VFX.prevE.length = 0; VFX.prevP.length = 0; VFX.prevA.length = 0;
  VFX.rec = new WeakMap(); VFX.seenFx = new WeakSet();
}
const onView = x => Math.abs(x - cam.x) < V.cw / 2 / V.S + 80;
// What the screen shows of the field (v2.38): the player's fog, or for a spectator (dev menu) everything. Render only:
// the SIM keeps each side's own fog
function viewFog(g) {
  if (!g.spectate) return g.fog[0];
  if (!g._sf) { const one = () => new Uint8Array(FOG_N).fill(1); g._sf = Object.assign(Object.create(g.fog[0]), { vis: one(), seen: one(), exp: one(), ghosts: {} }); }
  return g._sf;
}

// One step: look for what happened since the last frame, then age every effect by the game time that passed
function vfxStep(g) {
  if (g !== VFX.g) vfxReset(g);
  const dt = VFX.lastT < 0 ? 0 : clamp(g.t - VFX.lastT, 0, 0.25);
  VFX.lastT = g.t;
  if (dt > 0) vfxScan(g, dt);
  const P_ = VFX.parts;
  for (let i = 0; i < VFX.np; i++) {
    const p = P_[i];
    p.life -= dt;
    if (p.life <= 0) { if (p.kind === 4) VFX.nfire--; const last = P_[--VFX.np]; P_[VFX.np] = p; P_[i] = last; i--; continue; }
    p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.y > p.floor) { p.y = p.floor; p.vy *= -0.3; p.vx *= 0.6; }
    if (p.kind === 0 || p.kind === 3) p.vx *= 0.97;
    else if (p.kind === 4) { p.vx *= 1 - 2.2 * dt; p.vy *= 1 - 2.2 * dt; } // flame licks slow and billow as they burn out
  }
  const F_ = VFX.fx;
  for (let i = 0; i < VFX.nfx; i++) {
    const f = F_[i];
    f.t += dt;
    if (f.t >= f.life) { const last = F_[--VFX.nfx]; F_[VFX.nfx] = f; F_[i] = last; i--; }
  }
  for (let i = VFX.decals.length - 1; i >= 0; i--) if ((VFX.decals[i].t += dt) > VFX.decals[i].life) VFX.decals.splice(i, 1);
  for (let i = VFX.wrecks.length - 1; i >= 0; i--) if ((VFX.wrecks[i].t += dt) > 1.2) VFX.wrecks.splice(i, 1);
  if (dt > 0) vfxFlames(g, dt);
  if (dt > 0 && g.t >= EXT.start && !g.over) vfxMeteors(g, dt);
  for (let i = VFX.smokers.length - 1; i >= 0; i--) {
    const s = VFX.smokers[i];
    s.t += dt; s.acc += dt;
    while (s.acc > 0.12) { s.acc -= 0.12; if (VFX.rnd() < QMUL[VFX.q]) vPart(s.x + vr(-s.w, s.w), s.y - vr(0, 6), vr(-6, 6), vr(-30, -16), vr(1.2, 2), vr(5, 9), 0, s.acc > 0.06 ? 'dark' : 'light', -6, 0); }
    if (s.t > s.life) VFX.smokers.splice(i, 1);
  }
  if (VFX.shake > 0) VFX.shake = Math.max(0, VFX.shake - dt * 18);
}

function vfxScan(g, dt) {
  const F = viewFog(g), lit = (u, v) => F.vis[cellOf(u, v)] === 1, frame = ++VFX.frame, R = VFX.rec;
  VFX.nshots = 0;
  for (const e of g.ents) {
    let r = R.get(e);
    if (!r) {
      r = { f: 0, cd: e.cd || 0, hp: e.hp, ghost: e.hp, ghostT: 0, step: 0 }; R.set(e, r);
      if (e.kind === 'u' && e.type === 'titan') r.step = titanStep(e);
      if (VFX.primed && e.kind === 'u' && e.side === 0) sfx('trained'); // one of yours just rolled out (not on load)
    }
    r.f = frame;
    const cd = e.cd || 0;
    if (cd > r.cd + 0.05) onFire(g, e, lit);
    r.cd = cd;
    if (e.maxShp && VFX.primed && (e.shp || 0) < (r.shp ?? 0) - 0.5 && lit(e.u, e.v)) { const w = P(e.u, e.v); if (onView(w.x)) sfx('shieldPing', w.x); } // v2.36: an Axiarch shield takes a hit
    r.shp = e.shp || 0;
    if (e.kind === 'u' && VFX.primed && lit(e.u, e.v)) { // v2.37: redesigned units' cues (siege lock, shield surge, phase)
      const x = P(e.u, e.v).x;
      if ((e.siege || 0) !== (r.siege || 0) && (e.siege === 1 || e.siege === 3) && onView(x)) sfx('siegeLock', x);
      if ((e.surgeT || 0) > (r.surgeT || 0) && onView(x)) sfx('shieldUp', x);
      if ((e.phT || 0) > (r.phT || 0) && onView(x)) sfx('phaseOut', x);
    }
    r.siege = e.siege || 0; r.surgeT = e.surgeT || 0; r.phT = e.phT || 0;
    if (e.hp < r.hp - 0.01) { r.ghost = Math.max(r.ghost, r.hp); r.ghostT = 0.35; }      // health just lost shows as a draining white chunk
    else if (r.ghostT > 0) r.ghostT -= dt;
    else r.ghost = Math.max(e.hp, r.ghost - e.maxHp * 0.8 * dt);
    r.hp = e.hp;
    if (e.kind === 'u' && e.type === 'titan') { const s = titanStep(e); if (s !== r.step) { r.step = s; if (e.moving) onStep(g, e, lit); } }
  }
  for (const e of VFX.prevE) { const r = R.get(e); if (r && r.f !== frame && e.hp <= 0) onDeath(g, e, lit); }
  VFX.prevE.length = 0; for (const e of g.ents) VFX.prevE.push(e);
  VFX.primed = true;
  for (const p of g.projs) {
    let r = R.get(p);
    if (!r) { r = VFX.freeRec.pop() || { f: 0, ou: 0, ov: 0, oz: 0, has: 0, wh: 0 }; r.has = 0; r.wh = 0; R.set(p, r); onShot(g, p, r, lit); }
    r.f = frame;
    if (p.weapon === 'shell' && !r.wh && p.t > p.T * 0.45 && lit(p.u, p.v)) { r.wh = 1; sfx('whistle', p.u); } // incoming, once the shell is in view
  }
  for (const p of VFX.prevP) { const r = R.get(p); if (r && r.f !== frame) { if (p.t <= 4) onImpact(g, p, lit); R.delete(p); VFX.freeRec.push(r); } }
  VFX.prevP.length = 0; for (const p of g.projs) VFX.prevP.push(p);
  for (const f of g.fx) if (!VFX.seenFx.has(f)) { VFX.seenFx.add(f); if (f.k === 'beam' && f.hq && lit(f.x2, (f.y2 ?? f.y) / DY) && onView(f.x2)) onHqBeam(f); else if ((f.k === 'blink' || f.k === 'devour') && lit(f.u) && onView(f.x)) sfx(f.k, f.x); else if (f.k === 'boom' && lit(f.x) && onView(f.x)) onBoom(f); else if (f.k === 'shatter' && lit(f.u)) sfx('shatter', f.x); } // v2.34: a collapse, heard where seen
  // commander abilities: casts, the strike's warning and its impact (also caught if the strike resolved and left between frames)
  for (const a of g.abil) {
    let r = R.get(a);
    if (!r) { r = { f: 0, boom: 0, warned: 0 }; R.set(a, r); if (VFX.primed) onAbilCast(g, a, lit); }
    r.f = frame;
    if (a.k === 'strike' && !r.warned && a.side !== 0 && lit(a.u, a.v)) { r.warned = 1; if (VFX.primed) { sfx('siren'); toast('Enemy orbital strike incoming!', 'bad'); } }
    if (a.k === 'strike' && a.done && !r.boom) { r.boom = 1; onStrike(g, a, lit); }
    if (a.k === 'beam') { // v2.28: the enemy's warning only where the player can see the strip; the sweep's sound likewise
      const seen = beamSeen(a, lit);
      if (!r.warned && a.side !== 0 && seen) { r.warned = 1; if (VFX.primed) { sfx('siren'); toast('Enemy beam incoming!', 'bad'); } }
      if (!r.boom && g.t >= a.t0 + ABIL.beam.delay) { r.boom = 1; if (seen) { sfx('orbital', a.u); if (onView(a.u) && VFX.q > 0 && !VFX.reduced) VFX.shake = Math.max(VFX.shake, 4); } }
    }
    if (a.k === 'mwarp' && a.done && !r.boom) { r.boom = 1; if (a.side === 0 || lit(a.wu, a.wv)) sfx('warp', a.wu); } // the arrival
  }
  for (const a of VFX.prevA) { const r = R.get(a); if (r && r.f !== frame && a.k === 'strike' && !r.boom) { r.boom = 1; onStrike(g, a, lit); } }
  for (const a of VFX.prevA) { const r = R.get(a); if (r && r.f !== frame && a.k === 'mwarp' && a.done && !r.boom) { r.boom = 1; if (a.side === 0 || lit(a.wu, a.wv)) sfx('warp', a.wu); } } // a Mass Warp that ended and left between frames (v2.28)
  VFX.prevA.length = 0; for (const a of g.abil) VFX.prevA.push(a);
}
const titanStep = u => Math.floor((u.anim * 3.2 - Math.PI / 2) / Math.PI);

const MUZ_COL = { spine: null, claw: null, talon: null, slam: null, rend: null, maul: null, gore: null, acid: null, bile: null, lob: null, ruin: null, rifle: 'warm', gatling: 'warm', flak: 'warm', rail: 'cyan', rocket: 'fire', missile: 'fire', cannon: 'warm', siege: 'white', shell: 'fire', hqgun: null, flame: 'fire', hydra: 'warm', bomb: 'fire' };
function onFire(g, e, lit) {
  const gun = e.kind === 'b' ? bdOf(e).gun && bdOf(e).gun[e.tier] : UDEF[e.type];
  if (!gun) return;
  const m = muzzle(e), w = P(m.u, m.v, m.z), wpn = gun.weapon;
  if (VFX.nshots < VFX.shots.length) { const s = VFX.shots[VFX.nshots++]; s.e = e; s.u = m.u; s.v = m.v; s.z = m.z; s.w = wpn; }
  if (!lit(m.u, m.v) || !onView(w.x)) return; // firing in the fog stays hidden
  const face = e.face || (e.side ? -1 : 1), col = MUZ_COL[wpn] ? GLOW[MUZ_COL[wpn]] : GLOW['t' + e.side];
  sfx(wpn === 'hqgun' && facOf(e.fac) === 'bloomhost' ? 'hqspine' : wpn, w.x);
  switch (wpn) {
    case 'rifle': vFx('flash', w.x, w.y, 6, 0.08, col, 1); break;
    case 'gatling': vFx('flash', w.x - 3, w.y, 6, 0.07, col, 1); vFx('flash', w.x + 3, w.y - 1, 6, 0.07, col, 1, 0, 0, 1, 0.08); break;
    case 'flak': vFx('flash', w.x, w.y - 1.5, 5, 0.05, col, 1); vFx('flash', w.x, w.y + 1.5, 5, 0.05, col, 1, 0, 0, 1, 0.06); break;
    case 'flame': { // v2.36: no fireball; the nozzle glows and vfxFlames keeps the stream burning while it fires
      const r = VFX.rec.get(e); if (r) { r.fireT = g.t; VFX.flamers.add(e); }
      vFx('flash', w.x + face * 4, w.y, 8, 0.2, GLOW.warm, 1);
      break;
    }
    case 'bomb': vFx('flash', w.x, w.y, 8, 0.12, col, 1); break; // the Leviathan's bay opens
    case 'hydra': vFx('flash', w.x, w.y, 6, 0.06, col, 1); vFx('flash', w.x - 4, w.y + 3, 6, 0.06, col, 1, 0, 0, 1, 0.05); break;
    case 'rail': vFx('flash', w.x, w.y, 9, 0.12, col, 2); break;
    case 'rocket': // backblast out of the launcher's rear
      vFx('flash', w.x, w.y, 7, 0.08, col, 1);
      for (let i = vCount(3); i > 0; i--) vPart(w.x - face * 22, w.y + vr(-2, 2), -face * vr(20, 50), vr(-12, 4), vr(0.4, 0.7), vr(3, 5), 0, 'light', -4, 0);
      break;
    case 'missile': vFx('flash', w.x, w.y, 6, 0.07, col, 1); break;
    case 'cannon':
      vFx('flash', w.x + face * 3, w.y, 11, 0.09, col, 1); vFx('flash', w.x, w.y, 5, 0.09, GLOW.white, 1);
      for (let i = vCount(3); i > 0; i--) vPart(w.x + face * 4, w.y, face * vr(10, 30), vr(-14, 2), vr(0.5, 0.9), vr(3, 5), 0, 'light', -5, 0);
      break;
    case 'siege': // the Titan's twin cannon: one flash per barrel
      for (const dz of [-2.5, 2.5]) { const q = P(m.u, m.v, m.z + dz * US); vFx('flash', q.x + face * 3, q.y, 12, 0.1, GLOW.warm, 2); vFx('flash', q.x, q.y, 5, 0.1, col, 2); }
      for (let i = vCount(4); i > 0; i--) vPart(w.x + face * 4, w.y, face * vr(10, 40), vr(-18, 2), vr(0.6, 1), vr(4, 6), 0, 'light', -5, 0);
      break;
    case 'shell':
      vFx('flash', w.x, w.y, 14, 0.12, col, 2); vFx('flash', w.x, w.y, 6, 0.12, GLOW.white, 2);
      for (let i = vCount(5); i > 0; i--) vPart(w.x, w.y, vr(-25, 25), vr(-30, -5), vr(0.6, 1.1), vr(4, 7), 0, 'light', -4, 0);
      break;
    case 'hqgun':
      if (facOf(e.fac) === 'bloomhost') { // v2.36: the Hive looses a volley of spines with a wet spray
        vFx('flash', w.x, w.y, 12, 0.14, GLOW.acid, 2);
        for (let i = vCount(5); i > 0; i--) vPart(w.x, w.y, vr(-40, 40), vr(-60, -10), vr(0.3, 0.6), vr(1.4, 2.4), 1, '#9be15d', 220, 0, w.y + 60);
      } else { // Last Fist: an industrial cannon (v2.36): a hard flash, a ring and a puff of gun smoke
        vFx('flash', w.x, w.y, 16, 0.1, GLOW.warm, 2); vFx('flash', w.x, w.y, 6, 0.1, GLOW.white, 2); vFx('ring', w.x, w.y, 4, 0.3, '#ffd9a0', 1, 20, 0, 2);
        for (let i = vCount(4); i > 0; i--) vPart(w.x + vr(-3, 3), w.y, vr(-22, 22), vr(-30, -8), vr(0.7, 1.2), vr(4, 7), 0, 'light', -6, 0);
      }
      break;
    case 'hqbeam': vFx('flash', w.x, w.y, 18, 0.2, GLOW.violet, 2); vFx('flash', w.x, w.y, 8, 0.16, GLOW.white, 2); vFx('ring', w.x, w.y, 3, 0.35, RIFT, 1, 16, 0, 1.6); break; // the Axis lance charges and fires (v2.36)
    case 'lance': case 'horizon': vFx('flash', w.x, w.y, wpn === 'horizon' ? 12 : 8, 0.14, GLOW.cyan, 1); break; // the Null Lance (v2.36: it had no muzzle effect)
    case 'spine': vFx('flash', w.x, w.y, 6, 0.07, GLOW.acid, 1); break; // the Maw spits
    case 'acid': case 'bile': case 'lob': case 'ruin': case 'glob': vFx('flash', w.x, w.y, wpn === 'acid' ? 5 : 9, 0.1, GLOW.acid, 1); break; // a spray of acid (v2.19); the Brood Tyrant's glob (v2.21)
    case 'crush': vFx('flash', w.x, w.y, 10, 0.14, GLOW.acid, 1); break; // the Worldrender's sac opens
    case 'bolt': case 'astral': case 'prism': case 'storm': case 'pulse': vFx('flash', w.x, w.y, wpn === 'astral' ? 10 : wpn === 'pulse' ? 9 : 6, 0.1, GLOW.cyan, 1); vFx('flash', w.x, w.y, 3, 0.08, GLOW.white, 1); break; // Axiarch shots (v2.27; v2.29 Prismwing, Shardstorm; v2.36 the Bastion's pulse)
    case 'breaker': case 'grav': case 'rift': case 'phase': vFx('flash', w.x, w.y, wpn === 'breaker' ? 10 : 7, 0.12, GLOW.violet, 1); vFx('flash', w.x, w.y, 3, 0.08, GLOW.white, 1); break; // rift weapons in violet (v2.36: the Wraithwing's phase bolt too)
    case 'void': case 'sovereign': vFx('flash', w.x, w.y, wpn === 'sovereign' ? 12 : 9, 0.14, GLOW.cyan, 1); vFx('ring', w.x, w.y, 2, 0.25, RIFT, 1, 12, 0, 1.4); break; // a Voidcarrier's orb, a Sovereign's mass released (v2.29)
    case 'riftblade': case 'parallax':
    case 'claw': case 'talon': case 'slam': case 'rend': case 'maul': case 'gore': case 'needle': // a bite or a blow: a short bright snap at the jaws
      vFx('flash', w.x + face * 3, w.y, wpn === 'slam' ? 10 : 5, 0.08, GLOW['t' + e.side], 1); break;
  }
}
function onShot(g, p, r, lit) { // pair a new projectile with the shot that made it, for beams and trails
  let best = null, bd = 90;
  for (let i = 0; i < VFX.nshots; i++) { const s = VFX.shots[i]; if (s.e.side !== p.side || s.w !== p.weapon) continue; const d = Math.abs(s.u - p.u) + Math.abs(s.v - p.v); if (d < bd) { bd = d; best = s; } }
  if (!best) return;
  r.ou = best.u; r.ov = best.v; r.oz = best.z; r.has = 1;
  if (p.weapon === 'rail' && lit(best.u, best.v) && lit(p.tu, p.tv)) { // the beam is drawn only when both ends are in view
    const a = P(best.u, best.v, best.z), b = P(p.tu, p.tv, p.tz);
    if (onView(a.x) || onView(b.x)) vFx('beam', a.x, a.y, 0, 0.2, null, 2, b.x, b.y, 2.4);
  }
}
function onImpact(g, p, lit) {
  const u = p.tu, v = p.tv, z = p.weapon === 'shell' ? 0 : p.tz; // where it hit (homing shots end on their target)
  if (!lit(u, v)) return;
  const w = P(u, v, z);
  if (!onView(w.x)) return;
  const ground = P(u, v, 0).y;
  switch (p.weapon) {
    case 'rifle': case 'gatling': vFx('flash', w.x, w.y, 3.5, 0.05, GLOW.white, 0); break;
    case 'rail':
      vFx('flash', w.x, w.y, 8, 0.12, GLOW.cyan, 1); vFx('ring', w.x, w.y, 2, 0.25, '#bff4ff', 1, 12, 0, 1.4);
      for (let i = vCount(4); i > 0; i--) vPart(w.x, w.y, vr(-60, 60), vr(-70, 10), vr(0.15, 0.3), 1.3, 1, '#c9f6ff', 220, 0, ground);
      break;
    case 'rocket': case 'missile': vFx('ring', w.x, w.y, 3, 0.25, '#ffd9a0', 0, 16, 0, 1.4); break;
    case 'hqgun':
      if (facOf(g.sides[p.side].faction) === 'bloomhost') { bhSplat(w, ground, 3); sfx('splat', w.x); break; } // v2.36: the volley splashes
      vFx('flash', w.x, w.y, 13, 0.15, GLOW.fire, 1); vFx('ring', w.x, w.y, 3, 0.3, '#ffd9a0', 1, 22, 0, 1.6); // the cannon round bursts (v2.36)
      for (let i = vCount(4); i > 0; i--) vPart(w.x, w.y, vr(-60, 60), vr(-70, -10), vr(0.4, 0.7), vr(1.4, 2.2), 2, '#2a3648', 300, 0, ground);
      break;
    case 'bolt': case 'phase': case 'prism': case 'astral': case 'pulse': case 'grav': { // Axiarch energy: a clean flash, a ring and a few sparks (v2.36)
      const vio = p.weapon === 'phase' || p.weapon === 'grav', big = p.weapon === 'astral' || p.weapon === 'pulse';
      vFx('flash', w.x, w.y, big ? 10 : 6, 0.12, vio ? GLOW.violet : GLOW.cyan, 1); vFx('ring', w.x, w.y, 2, 0.22, vio ? RIFT : '#bff4ff', 0, big ? 16 : 10, 0, 1.2);
      for (let i = vCount(big ? 4 : 2); i > 0; i--) vPart(w.x, w.y, vr(-70, 70), vr(-70, 20), vr(0.12, 0.25), 1.2, 1, vio ? '#dcc8ff' : '#d8f8ff', 160, 0, ground);
      break;
    }
    case 'spine': bhSplat(w, ground, 1); break;
    case 'cannon':
      vFx('ring', w.x, w.y, 4, 0.3, '#ffd9a0', 1, 22, 0, 1.6);
      for (let i = vCount(4); i > 0; i--) vPart(w.x, ground - 1, vr(-20, 20), vr(-18, -4), vr(0.6, 1), vr(3, 6), 3, '', -2, 0);
      break;
    case 'siege':
      vFx('ring', w.x, ground, 6, 0.4, '#ffe2b0', 2, 40, 1, 2.2);
      for (let i = vCount(5); i > 0; i--) vPart(w.x, w.y, vr(-70, 70), vr(-90, -30), vr(0.6, 1.1), vr(1.8, 3), 2, '#2a3648', 300, 1, ground);
      for (let i = vCount(4); i > 0; i--) vPart(w.x, ground - 1, vr(-26, 26), vr(-16, -4), vr(0.8, 1.3), vr(4, 7), 3, '', -2, 0);
      break;
    case 'shell': // artillery: shockwave across the ground, dust and debris
      vFx('ring', w.x, ground, 8, 0.45, '#ffe2b0', 2, 62, 1, 2.4);
      vFx('flash', w.x, ground - 6, 22, 0.16, GLOW.fire, 2);
      for (let i = vCount(6); i > 0; i--) vPart(w.x + vr(-10, 10), ground - 1, vr(-34, 34), vr(-22, -6), vr(0.9, 1.5), vr(5, 9), 3, '', -2, 0);
      for (let i = vCount(4); i > 0; i--) vPart(w.x, ground - 2, vr(-80, 80), vr(-110, -40), vr(0.7, 1.2), vr(1.8, 3), 2, '#2a3648', 320, 1, ground);
      break;
    case 'void': case 'sovereign': // a dark burst ringed with violet (v2.29)
      vFx('ring', w.x, p.weapon === 'sovereign' ? ground : w.y, 4, 0.45, RIFT, 1, p.weapon === 'sovereign' ? 70 : 28, p.weapon === 'sovereign' ? 1 : 0, 2);
      vFx('flash', w.x, w.y, p.weapon === 'sovereign' ? 26 : 12, 0.18, GLOW.cyan, 2);
      break;
    case 'prism': vFx('flash', w.x, w.y, 4, 0.08, GLOW.cyan, 0); break;
    case 'rift': case 'breaker': // a violet burst (v2.27)
      vFx('ring', w.x, p.weapon === 'rift' ? ground : w.y, 3, 0.35, RIFT, 1, p.weapon === 'rift' ? 30 : 22, p.weapon === 'rift' ? 1 : 0, 1.6);
      break;
    case 'acid': case 'bile': case 'ruin': case 'lob': case 'glob': case 'crush': // a splash of acid (v2.19); v2.36 a wet splat that drips and stains the ground
      vFx('ring', w.x, p.weapon === 'lob' ? ground : w.y, 3, 0.3, '#9be15d', 1, p.weapon === 'acid' ? 10 : 24, p.weapon === 'lob' ? 1 : 0, 1.4);
      bhSplat(w, ground, p.weapon === 'acid' ? 2 : p.weapon === 'crush' ? 5 : 3);
      sfx('splat', w.x);
      break;
    case 'flak': // anti-air airburst
      for (let i = vCount(3); i > 0; i--) vPart(w.x + vr(-4, 4), w.y + vr(-4, 4), vr(-10, 10), vr(-8, 4), vr(0.5, 0.8), vr(2.5, 4), 0, 'light', -2, 0);
      break;
  }
}
// The Flame Tank's cone (v2.36): a tapered, flickering body of fire from the nozzle to the end of the stream, so the
// licks drawn over it read as one continuous jet. One small path per burning tank per frame.
function drawFlameCones(c) {
  c.globalCompositeOperation = 'lighter';
  for (const e of VFX.flamers) {
    const r = VFX.rec.get(e), S = r && r.stream; if (!S) continue;
    const fl = 0.8 + 0.2 * Math.sin(VFX.frame * 1.7 + e.id), L1 = S.len * (0.92 + 0.08 * fl), nx = -S.dy, ny = S.dx, ex = S.x + S.dx * L1, ey = S.y + S.dy * L1;
    for (const [w0, w1, a, col] of [[3, 15, 0.22, '255,120,40'], [1.5, 7, 0.4, '255,200,110'], [0.6, 2.5, 0.55, '255,245,210']]) {
      c.fillStyle = `rgba(${col},${a * fl})`; c.beginPath();
      c.moveTo(S.x + nx * w0, S.y + ny * w0); c.lineTo(ex + nx * w1, ey + ny * w1);
      c.quadraticCurveTo(ex + S.dx * w1 * 0.8, ey + S.dy * w1 * 0.8, ex - nx * w1, ey - ny * w1); c.lineTo(S.x - nx * w0, S.y - ny * w0); c.closePath(); c.fill();
    }
    stamp(c, GLOW.fire, S.x, S.y, 7 * fl, 0.9); stamp(c, GLOW.fire, ex, ey, 16 * fl, 0.5); // the nozzle and the end of the jet
  }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
// A Bloomhost splat (v2.36): a burst of droplets that fall to the ground and a short-lived green stain (n: size, 1-5)
function bhSplat(w, ground, n) {
  vFx('flash', w.x, w.y, 4 + n * 2, 0.12, GLOW.acid, 0);
  for (let i = vCount(2 + n); i > 0; i--) vPart(w.x, w.y, vr(-25, 25) * (1 + n * 0.2), vr(-55, -10), vr(0.35, 0.7), vr(1.2, 2.2), 1, i % 2 ? '#9be15d' : '#c4f58e', 240, 0, ground + vr(-2, 3));
  if (n >= 2) addDecal(w.x, ground, 3 + n * 2.4, 4, 'acid');
}
// The Axis lance lands (v2.36): a violet-white flare where the beam meets its target
function onHqBeam(f) {
  vFx('flash', f.x2, f.y2, 14, 0.25, GLOW.violet, 2); vFx('flash', f.x2, f.y2, 6, 0.2, GLOW.white, 2); vFx('ring', f.x2, f.y2, 3, 0.35, RIFT, 1, 22, 0, 1.6);
  for (let i = vCount(4); i > 0; i--) vPart(f.x2, f.y2, vr(-80, 80), vr(-80, 20), vr(0.15, 0.3), 1.4, 1, '#e6dcff', 180, 0, f.y2 + 30);
}
// The Flame Tank's stream (v2.36): while a tank keeps firing (it fires every 0.25 s), fire pours from the nozzle to its
// target: licks of flame that start white-hot, redden, rise and break up into smoke at the far end. FIRE caps the total.
function vfxFlames(g, dt) {
  if (!VFX.flamers.size) return;
  const F = viewFog(g), each = Math.min(FIRE.rate, FIRE.share / VFX.flamers.size) * QMUL[VFX.q];
  for (const e of VFX.flamers) {
    const r = VFX.rec.get(e);
    if (!r || e.hp <= 0 || g.t - (r.fireT ?? -9) > 0.34) { VFX.flamers.delete(e); continue; }
    const m = muzzle(e), w = P(m.u, m.v, m.z);
    r.stream = null;
    if (F.vis[cellOf(m.u, m.v)] !== 1 || !onView(w.x)) continue;
    const t = e.tgt ? g.ents.find(x => x.id === e.tgt && x.hp > 0) : null, face = e.face || dirOf(e.side);
    const tp = t ? P(t.u, t.v, Math.min(8, aimZ(t))) : { x: w.x + face * UDEF.flame.range, y: w.y + 4 };
    let dx = tp.x - w.x, dy = tp.y - w.y; const d = Math.max(1, Math.hypot(dx, dy)), len = Math.min(d + 6, UDEF.flame.range + 12); dx /= d; dy /= d;
    r.stream = { x: w.x, y: w.y, dx, dy, len, t: g.t }; // the cone drawn under the licks (drawFlameCone)
    r.fireAcc = (r.fireAcc || 0) + each * dt;
    for (; r.fireAcc >= 1; r.fireAcc--) {
      if (VFX.nfire >= FIRE.max) { r.fireAcc = 0; break; }
      const sp = vr(230, 300), life = len / sp * vr(0.85, 1.1), sx = vr(-0.24, 0.24);
      vPart(w.x + vr(-1.5, 1.5), w.y + vr(-1.5, 1.5), (dx - dy * sx) * sp, (dy + dx * sx) * sp, Math.max(FIRE.life[0], Math.min(FIRE.life[1], life)), vr(2.6, 4.2), 4, '', -60, 0);
    }
    if (VFX.rnd() < 6 * dt * QMUL[VFX.q]) vPart(w.x + dx * len, w.y + dy * len - 4, vr(-8, 8), vr(-26, -12), vr(0.6, 1), vr(4, 7), 0, 'dark', -8, 0); // smoke off the end
  }
}
function onBoom(f) { // every blast from the SIM gets a shockwave and a sound; bigger ones throw debris
  sfx('boom', f.x, f.r);
  if (f.r >= 18) vFx('ring', f.x, f.y, f.r * 0.3, 0.35 + f.r / 160, '#ffe2b0', 1, f.r * 1.6, 0, 1.8);
  if (f.r >= 28) for (let i = vCount(Math.min(8, f.r / 6)); i > 0; i--) vPart(f.x, f.y, vr(-90, 90), vr(-120, -30), vr(0.6, 1.2), vr(1.8, 3.2), 2, '#2a3648', 320, 1, f.y + vr(4, 14));
}
function onStep(g, u, lit) { // a Titan's foot lands
  const w = P(u.u, u.v);
  if (!lit(u.u, u.v) || !onView(w.x)) return;
  sfx('step', w.x);
  for (let i = vCount(3); i > 0; i--) vPart(w.x + u.face * vr(-6, 16), w.y - 1, vr(-22, 22), vr(-10, -2), vr(0.6, 1), vr(3, 6), 3, '', -1, 0);
  if (VFX.q > 0 && !VFX.reduced) VFX.shake = Math.max(VFX.shake, 0.9);
}
function onDeath(g, e, lit) {
  if (!lit(e.u, e.v)) return;
  const w = P(e.u, e.v);
  if (!onView(w.x)) return;
  if (e.kind === 'b') { // the building collapses over 1.2 s, with staggered blasts, a smoke column and a scorch mark
    const d = BDEF[e.type];
    VFX.wrecks.push({ b: e, t: 0 });
    for (let i = 0; i < 4; i++) { const q = P(e.u + vr(-e.half, e.half) * 0.6, e.v + vr(-e.half, e.half) * 0.6, vr(8, e.h * 0.6)); vFx('boom', q.x, q.y, vr(26, 44), 0.6, null, 3, 0, 0, 1, 0.15 + i * 0.28); }
    for (let i = vCount(10); i > 0; i--) vPart(w.x + vr(-12, 12), w.y - vr(10, 30), vr(-110, 110), vr(-160, -50), vr(0.8, 1.5), vr(2, 4), 2, i % 2 ? '#3e4b65' : '#2a3648', 300, 1, w.y + vr(-6, 10));
    if (VFX.smokers.length < VFX_SMOKERS) VFX.smokers.push({ x: w.x, y: w.y - d.h * BS * 0.3, w: d.half * BS * 0.6, t: 0, acc: 0, life: 4 });
    addDecal(w.x, w.y + 4, d.half * BS * 1.5, 25);
    sfx('collapse', w.x);
    return;
  }
  const d = UDEF[e.type];
  if (d.fac === 'bloomhost') { for (let i = vCount(d.air ? 5 : 4); i > 0; i--) vPart(w.x, w.y - (e.z || 0) - 4, vr(-45, 45), vr(-50, -5), vr(0.5, 0.9), vr(1.4, 2.6), 2, i % 2 ? '#6e3448' : '#4a3d63', 260, 1, w.y); addDecal(w.x, w.y, d.pop >= 3 ? 14 : 7, 10); return; } // organisms burst, no wreckage
  if (d.air) { for (let i = vCount(5); i > 0; i--) vPart(w.x, w.y - e.z, vr(-50, 50), vr(-40, 10), vr(0.8, 1.4), vr(1.6, 2.8), 2, '#3e4b65', 260, 1, w.y); return; }
  if (e.type === 'titan') { // the walker goes down in stages
    for (let i = 0; i < 2; i++) vFx('boom', w.x + vr(-14, 14), w.y - vr(20, 50), 40, 0.7, null, 3, 0, 0, 1, 0.2 + i * 0.3);
    addDecal(w.x, w.y, 30, 20);
  } else if (e.type === 'tank' || e.type === 'artillery') addDecal(w.x, w.y, 18, 14);
  if (d.armor === 'vehicle') for (let i = vCount(6); i > 0; i--) vPart(w.x, w.y - 10, vr(-80, 80), vr(-120, -40), vr(0.7, 1.2), vr(1.8, 3), 2, '#2a3648', 320, 1, w.y + vr(-3, 4));
}
// Abilities. What the player may see: their own casts anywhere; enemy casts only on ground in view.
const abilSeen = (a, lit) => a.side === 0 || lit(a.u, a.v);
function onAbilCast(g, a, lit) {
  if (!abilSeen(a, lit)) return;
  const w = P(a.u, a.v);
  if (a.k === 'shield') { vFx('ring', w.x, w.y, 10, 0.5, '#9fe6ff', 2, ABIL.shield.r, 1, 2.5); sfx('shieldUp', w.x); }
  else if (a.k === 'repair') { vFx('ring', w.x, w.y, 10, 0.6, '#9dffbe', 2, ABIL.repair.r, 1, 2.5); sfx('pulse', w.x); }
  else if (a.k === 'frenzy') { vFx('ring', w.x, w.y, 10, 0.5, '#ff9ae0', 2, ABIL.frenzy.r, 1, 2.5); sfx('shieldUp', w.x); } // v2.20
  else if (a.k === 'corrosive') { vFx('ring', w.x, w.y, 10, 0.7, '#c4f58e', 2, ABIL.corrosive.r, 1, 2.2); sfx('pulse', w.x); }
  else if (a.k === 'brood') sfx('whistle', w.x); // the pod is on its way (drawn by drawAbilities)
  else if (a.k === 'overcharge') { vFx('ring', w.x, w.y, 10, 0.5, '#bff4ff', 2, ABIL.overcharge.r, 1, 2.5); sfx('shieldUp', w.x); } // v2.28
  else if (a.k === 'mwarp') sfx('warp', w.x); // the channel (drawn by drawAbilities); the arrival is heard where it is seen
  else if (a.side === 0) sfx('uplink');
}
// The Purification Beam's strip (v2.28): its two ends along the lane, the start being the end away from the target side
const beamEnds = a => { const h = ABIL.beam.len / 2 * dirOf(a.side); return [a.u - h, a.u + h]; };
// What the player may see of an enemy ability that covers more than one spot (v2.28): any of its points in view
const beamSeen = (a, lit) => a.side === 0 || beamEnds(a).some(u => lit(u, a.v)) || lit(a.u, a.v);
function onStrike(g, a, lit) { // the blast is drawn where the player may see it; hidden units caught in it show nothing
  if (!abilSeen(a, lit)) return;
  const w = P(a.u, a.v), R0 = ABIL.strike.r;
  vFx('flash', w.x, w.y - 10, 70, 0.35, GLOW.white, 3); vFx('flash', w.x, w.y - 6, 52, 0.7, GLOW.fire, 3);
  vFx('ring', w.x, w.y, 12, 0.6, '#fff1d0', 3, R0 * 1.5, 1, 3.4); vFx('ring', w.x, w.y, 6, 0.9, '#ffb070', 3, R0 * 2.1, 1, 2);
  vFx('boom', w.x, w.y - 8, 46, 0.8, null, 3);
  for (let i = vCount(12); i > 0; i--) vPart(w.x, w.y - 4, vr(-140, 140), vr(-190, -60), vr(0.8, 1.5), vr(2, 3.6), 2, i % 2 ? '#3e4b65' : '#2a3648', 320, 1, w.y + vr(-8, 10));
  for (let i = vCount(8); i > 0; i--) vPart(w.x + vr(-R0, R0) * 0.7, w.y - 1, vr(-40, 40), vr(-26, -6), vr(1, 1.6), vr(6, 10), 3, '', -2, 0);
  addDecal(w.x, w.y + 2, R0 * 0.8, 25);
  if (VFX.smokers.length < VFX_SMOKERS) VFX.smokers.push({ x: w.x, y: w.y, w: 20, t: 0, acc: 0, life: 3 });
  sfx('orbital', w.x);
  if (onView(w.x) && VFX.q > 0 && !VFX.reduced) VFX.shake = Math.max(VFX.shake, 6);
}
// Drawn straight from the SIM's ability list, outside the pools, so the quality fallback can never cut a strike warning
function drawAbilities(c, g, lit, time) {
  for (const a of g.abil) {
    if (a.k === 'beam') { if (beamSeen(a, lit)) drawBeamStrip(c, g, a, time); continue; } // v2.28
    if (a.k === 'mwarp') { drawMassWarp(c, g, a, lit, time); continue; }
    if (!abilSeen(a, lit)) continue;
    const w = P(a.u, a.v), A = ABIL[a.k], ry = DY;
    if (a.k === 'repair') {
      const k = clamp((g.t - a.t0) / A.dur, 0, 1), fade = Math.min(1, (a.end - g.t) * 2);
      c.globalAlpha = 0.14 * fade; c.fillStyle = '#5dff8a'; c.beginPath(); c.ellipse(w.x, w.y, A.r, A.r * ry, 0, 0, 7); c.fill();
      c.globalAlpha = 0.6 * fade; c.strokeStyle = '#9dffbe'; c.lineWidth = 1.5; c.stroke();
      if (VFX.rnd() < 0.5 * QMUL[VFX.q]) { const an = VFX.rnd() * 7, rr_ = Math.sqrt(VFX.rnd()) * A.r; vPart(w.x + Math.cos(an) * rr_, w.y + Math.sin(an) * rr_ * ry, 0, vr(-30, -15), vr(0.5, 0.9), 1.8, 1, '#9dffbe', 0, 0); }
      c.globalAlpha = 1;
    } else if (a.k === 'corrosive') { // the spore cloud (v2.20): a drifting green haze with rising spores
      const fade = Math.min(1, (a.end - g.t) * 1.5, (g.t - a.t0) * 3);
      c.globalAlpha = 0.2 * fade; c.fillStyle = '#9be15d'; c.beginPath(); c.ellipse(w.x, w.y, A.r, A.r * ry, 0, 0, 7); c.fill();
      c.globalAlpha = 0.14 * fade; for (let i = 0; i < 4; i++) { const an = time * 0.6 + i * 1.6, rr_ = A.r * 0.45; c.beginPath(); c.ellipse(w.x + Math.cos(an) * rr_, w.y - 8 + Math.sin(an) * rr_ * ry, A.r * 0.5, A.r * 0.3, 0, 0, 7); c.fill(); }
      c.globalAlpha = 0.65 * fade; c.strokeStyle = '#c4f58e'; c.lineWidth = 1.4; c.setLineDash([5, 5]); c.beginPath(); c.ellipse(w.x, w.y, A.r, A.r * ry, 0, 0, 7); c.stroke(); c.setLineDash([]);
      if (VFX.rnd() < 0.7 * QMUL[VFX.q]) { const an = VFX.rnd() * 7, rr_ = Math.sqrt(VFX.rnd()) * A.r; vPart(w.x + Math.cos(an) * rr_, w.y + Math.sin(an) * rr_ * ry, vr(-6, 6), vr(-26, -10), vr(0.6, 1.1), 2, 1, '#c4f58e', 0, 0); }
      c.globalAlpha = 1;
    } else if (a.k === 'brood' && !a.done) { // the brood pod falling (v2.20): a landing ring that tightens, the pod above it
      const left = Math.max(0, a.end - g.t), k = 1 - left / A.delay, pulse = 0.6 + 0.4 * Math.sin(time * 10);
      c.strokeStyle = `rgba(232,210,168,${0.5 + 0.4 * pulse})`; c.lineWidth = 2; c.setLineDash([6, 5]); c.beginPath(); c.ellipse(w.x, w.y, A.r, A.r * ry, 0, 0, 7); c.stroke(); c.setLineDash([]);
      c.beginPath(); c.ellipse(w.x, w.y, A.r * (1 - k * 0.7), A.r * (1 - k * 0.7) * ry, 0, 0, 7); c.stroke();
      const py = w.y - 260 * (1 - k) - 8;
      c.fillStyle = '#6e3448'; c.beginPath(); c.ellipse(w.x, py, 7, 10, 0, 0, 7); c.fill();
      c.fillStyle = '#d9c7a6'; c.beginPath(); c.ellipse(w.x - 2, py - 3, 2.5, 4, 0, 0, 7); c.fill();
    } else if (a.k === 'strike' && !a.done) {
      const left = Math.max(0, a.end - g.t), k = 1 - left / A.delay, pulse = 0.6 + 0.4 * Math.sin(time * 12);
      c.fillStyle = `rgba(255,90,60,${0.1 + 0.12 * k})`; c.beginPath(); c.ellipse(w.x, w.y, A.r, A.r * ry, 0, 0, 7); c.fill();
      c.strokeStyle = `rgba(255,110,80,${0.55 + 0.45 * pulse})`; c.lineWidth = 2.4; c.setLineDash([8, 6]); c.stroke(); c.setLineDash([]);
      c.strokeStyle = 'rgba(255,220,200,0.85)'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(w.x, w.y, A.r * (1 - k), A.r * (1 - k) * ry, 0, 0, 7); c.stroke();
      c.beginPath(); c.moveTo(w.x - 10, w.y); c.lineTo(w.x + 10, w.y); c.moveTo(w.x, w.y - 6); c.lineTo(w.x, w.y + 6); c.stroke();
      if (left < 0.7) { // the beam locks on
        const b = 1 - left / 0.7, top = w.y - 600;
        c.strokeStyle = `rgba(255,200,170,${0.25 + 0.5 * b})`; c.lineWidth = 2 + b * 5; c.beginPath(); c.moveTo(w.x, top); c.lineTo(w.x, w.y); c.stroke();
      }
      c.fillStyle = '#fff'; c.font = '700 14px -apple-system,system-ui,sans-serif'; c.textAlign = 'center';
      c.fillText(left.toFixed(1), w.x, w.y - A.r * ry - 8);
    }
  }
}
// Purification Beam (v2.28): during the warning, the strip outlined in pale violet-white with a countdown; then a column
// of light sweeps along it, leaving a fading scorched band behind the head
function drawBeamStrip(c, g, a, time) {
  const A = ABIL.beam, [u0, u1] = beamEnds(a), y0 = P(0, a.v - A.w).y, y1 = P(0, a.v + A.w).y, lo = Math.min(u0, u1), wdt = Math.abs(u1 - u0);
  const warm = g.t - a.t0, left = A.delay - warm;
  if (left > 0) {
    const k = clamp(warm / A.delay, 0, 1), pulse = 0.6 + 0.4 * Math.sin(time * 12);
    c.fillStyle = `rgba(200,225,255,${0.08 + 0.12 * k})`; c.fillRect(lo, y0, wdt, y1 - y0);
    c.strokeStyle = `rgba(190,215,255,${0.55 + 0.45 * pulse})`; c.lineWidth = 2; c.setLineDash([8, 6]); c.strokeRect(lo, y0, wdt, y1 - y0); c.setLineDash([]);
    c.strokeStyle = 'rgba(235,245,255,0.85)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(u0, y0); c.lineTo(u0, y1); c.stroke(); // where the sweep starts
    const ax = u0 + (u1 - u0) * 0.5, ay = (y0 + y1) / 2, d = Math.sign(u1 - u0); // an arrow along the sweep
    c.beginPath(); c.moveTo(ax - d * 14, ay); c.lineTo(ax + d * 10, ay); c.moveTo(ax + d * 4, ay - 5); c.lineTo(ax + d * 10, ay); c.lineTo(ax + d * 4, ay + 5); c.stroke();
    c.fillStyle = '#fff'; c.font = '700 14px -apple-system,system-ui,sans-serif'; c.textAlign = 'center'; c.fillText(left.toFixed(1), a.u, y0 - 8);
    if (left < 0.7) { const b = 1 - left / 0.7; c.strokeStyle = `rgba(215,200,255,${0.25 + 0.5 * b})`; c.lineWidth = 2 + b * 5; c.beginPath(); c.moveTo(u0, y0 - 600); c.lineTo(u0, (y0 + y1) / 2); c.stroke(); } // the beam descends
    return;
  }
  const at = a.done ? 1 : a.at, hx = u0 + (u1 - u0) * at, fade = a.done ? clamp((a.end - g.t) * 4 + 0.3, 0, 1) : 1;
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = `rgba(170,150,255,${0.22 * fade})`; c.fillRect(Math.min(u0, hx), y0, Math.abs(hx - u0), y1 - y0); // the burned band
  if (!a.done) {
    const gr = c.createLinearGradient(0, y0 - 420, 0, (y0 + y1) / 2);
    gr.addColorStop(0, 'rgba(200,190,255,0)'); gr.addColorStop(1, 'rgba(235,240,255,0.9)');
    c.fillStyle = gr; c.fillRect(hx - 7, y0 - 420, 14, (y1 - y0) / 2 + 420);
    c.fillStyle = 'rgba(255,255,255,0.95)'; c.fillRect(hx - 2, y0 - 420, 4, (y1 - y0) / 2 + 420);
    stamp(c, GLOW.white, hx, (y0 + y1) / 2, A.w * 1.1, 0.9); stamp(c, GLOW.cyan, hx, (y0 + y1) / 2, A.w * 1.6, 0.7);
    if (VFX.rnd() < 0.8 * QMUL[VFX.q]) vPart(hx + vr(-4, 4), vr(y0, y1), vr(-30, 30), vr(-90, -30), vr(0.3, 0.6), 2, 1, '#e6ecff', 0, 0);
  }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
// Mass Warp (v2.28): the channel on each chosen unit (a pale column, like a warp-in) and a ring at the cast spot; a matching
// glow at the warp point. Enemy parts show only where the player can see them; the units themselves are drawn only in view.
function drawMassWarp(c, g, a, lit, time) {
  if (a.done) return;
  const k = clamp((g.t - a.t0) / ABIL.mwarp.ch, 0, 1), mine = a.side === 0;
  c.globalCompositeOperation = 'lighter';
  if (mine || lit(a.u, a.v)) { const w = P(a.u, a.v), r = ABIL.mwarp.r * (1 - 0.3 * k); c.strokeStyle = `rgba(${TEAM[a.side].glow},${0.3 + 0.4 * k})`; c.lineWidth = 1.6; c.setLineDash([6, 6]); c.beginPath(); c.ellipse(w.x, w.y, r, r * DY, 0, 0, 7); c.stroke(); c.setLineDash([]); }
  for (const id of a.ids) {
    const e = g.ents.find(x => x.id === id && x.hp > 0);
    if (!e || !(mine || visibleTo(g, 0, e))) continue;
    const p = P(e.u, e.v), h = (UDEF[e.type].air ? e.z + 30 : 34) + 12 * k;
    const gr = c.createLinearGradient(0, p.y, 0, p.y - h); gr.addColorStop(0, `rgba(160,230,255,${0.2 + 0.5 * k})`); gr.addColorStop(1, 'rgba(160,230,255,0)');
    c.fillStyle = gr; c.fillRect(p.x - 7 - 3 * k, p.y - h, 14 + 6 * k, h);
    c.strokeStyle = `rgba(225,248,255,${0.4 + 0.5 * k})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(p.x, p.y, 12 - 4 * k, (12 - 4 * k) * 0.42, 0, 0, 7); c.stroke();
  }
  if (mine || lit(a.wu, a.wv)) { const p = P(a.wu, a.wv), r = 18 + 10 * k; stamp(c, GLOW.cyan, p.x, p.y - 10, r, 0.3 + 0.5 * k); c.strokeStyle = `rgba(225,248,255,${0.4 + 0.5 * k})`; c.lineWidth = 1.4; c.beginPath(); c.ellipse(p.x, p.y, r, r * 0.42, 0, 0, 7); c.stroke(); }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
// Shield Overcharge on a unit (v2.28): its shield shell glows bright and steady, with sparks running over it
function drawOvercharge(c, u, w, t) {
  const h = visH(u.type) * US, r = Math.max(10, h * 0.75), y = w.y - u.z, k = 0.5 + 0.5 * Math.sin(t * 10 + u.id), fade = Math.min(1, u.ovT - t);
  c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.cyan, w.x, y - h * 0.5, Math.max(14, h * 1.1), (0.45 + 0.2 * k) * fade); c.globalCompositeOperation = 'source-over';
  c.globalAlpha = (0.6 + 0.3 * k) * fade; c.strokeStyle = '#d8f8ff'; c.lineWidth = 1.6;
  c.beginPath(); c.ellipse(w.x, y - h * 0.5, r * 0.85, r, 0, 0, 7); c.stroke();
  c.strokeStyle = '#7fe0ff'; c.lineWidth = 1; c.beginPath(); c.ellipse(w.x, y - h * 0.5, r * 0.85, r, 0, t * 4 + u.id, t * 4 + u.id + 1.2); c.stroke();
  c.globalAlpha = 1;
}
// Shield bubble: drawn once per team into a small canvas, then stamped (no paths or colour strings per unit per frame)
const BUBBLE = [0, 1].map(s => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 96;
  const k = cv.getContext('2d'); k.beginPath(); k.ellipse(48, 48, 45, 45, 0, 0, 7);
  k.fillStyle = `rgba(${TEAM[s].glow},0.18)`; k.fill(); k.strokeStyle = `rgba(${TEAM[s].glow},1)`; k.lineWidth = 3; k.stroke();
  return cv;
});
// Axiarch tree effects on a unit (v2.27)
function drawAxFx(c, g, u, w) {
  const d = UDEF[u.type], y = w.y - u.z;
  if (d.aura) { // the Gravemantle's aura: a faint violet ring on the ground at its reach
    c.strokeStyle = `rgba(${RIFTA},${0.18 + 0.08 * Math.sin(VFX.lastT * 2 + u.id)})`; c.lineWidth = 1.2; c.setLineDash([4, 6]);
    c.beginPath(); c.ellipse(w.x, w.y, d.aura.r, d.aura.r * DY, 0, 0, 7); c.stroke(); c.setLineDash([]);
  }
  if (d.charge && u.chT > g.t) { // the Astral Marksman charging: a thin line to its target and a growing light at the lens
    const t = g.ents.find(e => e.id === u.chTgt), k = 1 - (u.chT - g.t) / d.charge;
    if (t) { const m = muzzle(u), a = P(m.u, m.v, m.z), b = P(t.u, t.v, aimZ(t)); c.strokeStyle = `rgba(200,235,255,${0.15 + 0.45 * k})`; c.lineWidth = 0.8 + k; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.cyan, a.x, a.y, 3 + 7 * k, 0.9); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  }
  if (u.snT > g.t) { const r = Math.max(8, visH(u.type) * 0.6) * US; c.strokeStyle = '#7a5434'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + u.id; c.beginPath(); c.moveTo(w.x + Math.cos(a) * r, w.y + Math.sin(a) * r * 0.35); c.quadraticCurveTo(w.x + Math.cos(a) * r * 0.3, w.y - 6, w.x + Math.cos(a + 1) * 2, w.y - 9); c.stroke(); } } // snared (v2.33): roots wrap its feet
  if (u.slowT > g.t && u.slowK === 'creep') { const r = Math.max(8, visH(u.type) * 0.6) * US; c.strokeStyle = 'rgba(140,200,90,0.55)'; c.lineWidth = 1.1; c.setLineDash([2, 3]); c.beginPath(); c.ellipse(w.x, w.y, r, r * 0.35, 0, 0, 7); c.stroke(); c.setLineDash([]); } // slowed by a Rootheart's creep (v2.33)
  else if (u.slowT > g.t) { const r = Math.max(8, visH(u.type) * 0.6) * US; c.strokeStyle = `rgba(${RIFTA},0.6)`; c.lineWidth = 1.2; for (const k of [1, 0.6]) { c.beginPath(); c.ellipse(w.x, w.y, r * k, r * k * 0.35, 0, 0, 7); c.stroke(); } } // slowed: violet ripples at the feet
  if (u.disT > g.t) { c.strokeStyle = `rgba(${RIFTA},0.85)`; c.lineWidth = 1.2; const h = visH(u.type) * US; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(w.x + s * 5, y - h - 6); c.lineTo(w.x + s * 2, y - h - 3); c.lineTo(w.x + s * 5, y - h); } c.stroke(); } // disrupted: broken brackets
}
// An Eventide's gravity pulse (v2.27): a violet ring that closes in on it
// A Salvage pop-up (v2.30): "+N" with a small scrap plate, muted yellow on charcoal, rising and fading
// A Phase Beacon bubble collapsing (v2.34): the field's edge breaks into pale shards that fly outward and fade, with a flash
function drawShatter(c, f) {
  const k = f.t / f.life, a = 1 - k, R = f.r * (1 + 0.25 * k);
  c.globalAlpha = a;
  c.strokeStyle = `rgba(${AXC.pale},0.8)`; c.lineWidth = 2; c.setLineDash([14, 10]); c.lineDashOffset = k * 40;
  c.beginPath(); c.ellipse(f.x, f.y, R, R * DY, 0, 0, 7); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
  c.fillStyle = 'rgba(160,225,255,0.9)';
  for (let i = 0; i < 18; i++) {
    const t0 = i / 18 * Math.PI * 2, d = f.r * (0.85 + 0.5 * k), x = f.x + Math.cos(t0) * d, y = f.y + Math.sin(t0) * d * DY - k * 18 * ((i % 3) + 1), s2 = 3 + (i % 3);
    c.beginPath(); c.moveTo(x, y - s2); c.lineTo(x + s2 * 0.5, y); c.lineTo(x, y + s2 * 0.6); c.lineTo(x - s2 * 0.5, y); c.closePath(); c.fill();
  }
  if (k < 0.25) { c.fillStyle = `rgba(210,240,255,${0.35 * (1 - k / 0.25)})`; c.beginPath(); c.ellipse(f.x, f.y, f.r, f.r * DY, 0, 0, 7); c.fill(); }
  c.globalAlpha = 1;
}
// A killed Mite's acid burst (v2.33): a green splash ring with droplets, the burst radius on the ground
function drawAcidBurst(c, f) {
  const k = f.t / f.life, R = f.r * (0.4 + 0.6 * Math.min(1, k * 2.2));
  c.globalAlpha = 1 - k;
  c.fillStyle = 'rgba(150,230,60,0.22)'; c.beginPath(); c.ellipse(f.x, f.y + 4, R, R * 0.4, 0, 0, 7); c.fill();
  c.strokeStyle = '#b6ff5a'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#d8ff9a';
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, d = R * 0.8; c.beginPath(); c.arc(f.x + Math.cos(a) * d, f.y + 4 + Math.sin(a) * d * 0.4 - Math.sin(Math.PI * k) * 10, 1.8, 0, 7); c.fill(); }
  c.globalAlpha = 1;
}
// A Rootheart's snare pulse (v2.33): root spikes burst up all along the creep's outer edge and coil around each snared unit
function drawRoots(c, f, lit) {
  const k = f.t / f.life, up = Math.sin(Math.PI * Math.min(1, k * 1.6)), inAny = (u, v) => f.rim.some(p => Math.hypot(u - p.u, v - p.v) < p.r - 1);
  c.globalAlpha = Math.min(1, 1.4 - k);
  const spikeAt = (x, y, h, wd) => { c.fillStyle = '#5a3d2b'; c.beginPath(); c.moveTo(x - wd, y); c.quadraticCurveTo(x - 1, y - h * 0.6, x + 1.5, y - h); c.quadraticCurveTo(x + 1, y - h * 0.5, x + wd, y); c.closePath(); c.fill(); c.fillStyle = 'rgba(140,200,90,0.8)'; c.fillRect(x, y - h * 0.7, 1.2, 1.2); };
  for (const p of f.rim) for (let a = 0; a < Math.PI * 2; a += 22 / Math.max(22, p.r)) {
    const u = p.u + Math.cos(a) * p.r, v = p.v + Math.sin(a) * p.r;
    if (Math.abs(v) > LANE_V + 60 || !lit(u, v) || inAny(u, v)) continue;
    const w = P(u, v); spikeAt(w.x, w.y, (8 + ((a * 7) % 3) * 3) * up, 2.4);
  }
  for (const s of f.at) if (lit(s.u, s.v)) { const w = P(s.u, s.v); for (const dx of [-7, -2, 4, 8]) spikeAt(w.x + dx, w.y + 2, 16 * up, 3); }
  c.globalAlpha = 1;
}
function drawScrap(c, f) {
  const k = f.t / f.life, x = f.x, y = f.y - 14 - 22 * k;
  c.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3;
  c.fillStyle = '#2b2d2f'; c.fillRect(x - 21, y - 9, 10, 8); c.fillStyle = '#9aa0a6'; c.fillRect(x - 20, y - 8, 8, 6); // the plate: riveted steel
  c.fillStyle = '#d98c2b'; c.fillRect(x - 20, y - 8, 8, 2); c.fillStyle = '#2b2d2f'; c.fillRect(x - 19, y - 5, 1.5, 1.5); c.fillRect(x - 14.5, y - 5, 1.5, 1.5);
  c.font = '700 12px -apple-system,system-ui,sans-serif'; c.textAlign = 'left'; c.lineWidth = 3; c.strokeStyle = '#1d1f21';
  c.strokeText('+' + f.n, x - 8, y); c.fillStyle = '#f2d36b'; c.fillText('+' + f.n, x - 8, y);
  if (f.e) { const tx = x - 6 + c.measureText('+' + f.n).width, et = ' +' + Math.round(f.e); c.strokeText(et, tx, y); c.fillStyle = '#5dffb0'; c.fillText(et, tx, y); } // Salvage Yard T2 (v2.32): the energy
  c.globalAlpha = 1;
}
function drawPull(c, f) {
  const k = f.t / f.life, r = f.r * (1 - k);
  c.strokeStyle = `rgba(${RIFTA},${0.7 * (1 - k)})`; c.lineWidth = 2.4; c.beginPath(); c.ellipse(f.x, f.y, r, r * DY, 0, 0, 7); c.stroke();
  c.strokeStyle = `rgba(230,215,255,${0.5 * (1 - k)})`; c.lineWidth = 1; c.beginPath(); c.ellipse(f.x, f.y, r * 0.7, r * 0.7 * DY, 0, 0, 7); c.stroke();
}
// A Null Lance beam (v2.25): a pale core inside a cyan glow, fading over its short life
function drawBeam(c, f) {
  const k = 1 - f.t / f.life;
  if (f.hq) { // the Axis lance (v2.36): a wide violet sheath, a cyan beam and a white-hot core that thins as it fades
    const j = Math.sin(f.t * 90) * 0.6; // a slight shimmer
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    c.strokeStyle = `rgba(${RIFTA},${0.3 * k})`; c.lineWidth = f.w * 4.2 + j; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.stroke();
    c.strokeStyle = `rgba(110,215,255,${0.6 * k})`; c.lineWidth = f.w * 1.8; c.stroke();
    c.strokeStyle = `rgba(255,255,255,${0.95 * k})`; c.lineWidth = f.w * 0.7 * k + 0.4; c.stroke();
    stamp(c, GLOW.violet, f.x, f.y, 10 + f.w * 2, 0.9 * k); stamp(c, GLOW.cyan, f.x2, f.y2, 8 + f.w * 3, k);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.lineCap = 'butt';
    return;
  }
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  c.strokeStyle = `rgba(80,200,255,${0.35 * k})`; c.lineWidth = f.w * 3; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.stroke();
  c.strokeStyle = `rgba(225,248,255,${0.9 * k})`; c.lineWidth = f.w; c.stroke();
  stamp(c, GLOW.cyan, f.x2, f.y2, 4 + f.w * 2, 0.8 * k);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
// Axiarch shields taking a hit (v2.25): a brief pale-cyan shell that flares and fades (not the Emergency Shield's bubble)
function drawShpHit(c, x, y, h, k) {
  const r = Math.max(10, h * 0.75);
  c.globalAlpha = 0.55 * (1 - k); c.strokeStyle = '#9fe8ff'; c.lineWidth = 1.4;
  c.beginPath(); c.ellipse(x, y - h * 0.5, r * 0.8, r * 0.95, 0, 0, 7); c.stroke();
  c.fillStyle = 'rgba(150,230,255,0.12)'; c.fill(); c.globalAlpha = 1;
}
function drawShield(c, u, t) { // a shimmering bubble around a shielded unit, fading in its last second
  const d = UDEF[u.type], w = P(u.u, u.v), h = visH(u.type) * US, rx = Math.max(12, h * 0.55) + (d.air ? 10 : 0), ry = h * 0.62;
  c.globalAlpha = Math.min(1, u.shT - t) * (0.55 + 0.2 * Math.sin(t * 9 + u.id));
  c.drawImage(BUBBLE[u.side], w.x - rx, w.y - u.z - h * 0.45 - ry, rx * 2, ry * 2);
  c.globalAlpha = 1;
}
// Player targeting: the circle, the units it will cover, red where it isn't allowed
function drawAim(c, g) {
  if (!aim || !aim.placed) return;
  const A = ABIL[aim.k], w = P(aim.u, aim.v), col = aim.ok ? AB_COL[aim.k] : '#ff4d4d';
  if (aim.k === 'beam') { // v2.28: the strip it will sweep, and which way
    const v = clamp(aim.v, -LANE_V, LANE_V), [u0, u1] = beamEnds({ u: aim.u, side: 0 }), y0 = P(0, v - A.w).y, y1 = P(0, v + A.w).y;
    c.globalAlpha = 0.16; c.fillStyle = col; c.fillRect(Math.min(u0, u1), y0, Math.abs(u1 - u0), y1 - y0);
    c.globalAlpha = 1; c.strokeStyle = col; c.lineWidth = 2.4; c.setLineDash([8, 6]); c.strokeRect(Math.min(u0, u1), y0, Math.abs(u1 - u0), y1 - y0); c.setLineDash([]);
    c.globalAlpha = 0.5; c.lineWidth = 1.2; c.beginPath(); c.ellipse(w.x, w.y, A.r, A.r * DY, 0, 0, 7); c.stroke(); c.globalAlpha = 1; // tap inside to confirm
    return;
  }
  if (aim.ok && aim.k === 'mwarp') { // v2.28: the units that will warp, and where to
    const wp = warpPoint(g, 0), q = P(wp.u, wp.v); c.strokeStyle = col; c.lineWidth = 1.2; c.globalAlpha = 0.9;
    for (const e of mwarpPick(g, 0, aim.u, aim.v)) { const p = P(e.u, e.v); c.beginPath(); c.ellipse(p.x, p.y, 9, 4, 0, 0, 7); c.stroke(); }
    c.setLineDash([3, 5]); c.beginPath(); c.moveTo(w.x, w.y); c.lineTo(q.x, q.y); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  }
  if (aim.ok && (aim.k === 'shield' || aim.k === 'repair' || aim.k === 'frenzy' || aim.k === 'overcharge')) { // abilities on your own units: show who is covered
    c.strokeStyle = col; c.lineWidth = 1.2; c.globalAlpha = 0.9;
    for (const e of g.ents) if (e.side === 0 && e.hp > 0 && (e.kind === 'u' || aim.k === 'repair') && inAbil(e, aim.u, aim.v, A.r)) { const p = P(e.u, e.v); c.beginPath(); c.ellipse(p.x, p.y, e.kind === 'b' ? e.half * BS : 9, (e.kind === 'b' ? e.half * BS : 9) * 0.45, 0, 0, 7); c.stroke(); }
  }
  c.globalAlpha = 0.16; c.fillStyle = col; c.beginPath(); c.ellipse(w.x, w.y, A.r, A.r * DY, 0, 0, 7); c.fill();
  c.globalAlpha = 1; c.strokeStyle = col; c.lineWidth = 2.4; c.setLineDash([8, 6]); c.stroke(); c.setLineDash([]);
  c.lineWidth = 1.6; c.beginPath(); c.moveTo(w.x - 10, w.y); c.lineTo(w.x + 10, w.y); c.moveTo(w.x, w.y - 6); c.lineTo(w.x, w.y + 6); c.stroke();
}
// Off-screen strikes the player can see (their own, or an enemy one on ground in view): an arrow at the screen edge
function drawStrikeAlerts(c, g, lit, time) {
  const hw = V.cw / 2 / V.S, top = V.ft, bot = V.fb;
  let n = 0;
  for (const a of g.abil) {
    if (!(a.k === 'strike' || a.k === 'beam') || a.done || !(a.k === 'beam' ? beamSeen(a, lit) : abilSeen(a, lit)) || Math.abs(a.u - cam.x) < hw - 20) continue; // v2.28: the Beam too
    const right = a.u > cam.x, y = (top + bot) / 2, x = right ? V.cw - 145 : 75, k = 0.6 + 0.4 * Math.sin(time * 10);
    c.fillStyle = a.side === 0 ? `rgba(255,140,90,${k})` : `rgba(255,70,70,${k})`;
    c.beginPath(); const d = right ? 1 : -1; c.moveTo(x + d * 16, y); c.lineTo(x - d * 4, y - 14); c.lineTo(x - d * 4, y + 14); c.closePath(); c.fill();
    c.fillStyle = '#fff'; c.font = '700 12px -apple-system,system-ui,sans-serif'; c.textAlign = 'center';
    c.fillText(`${Math.max(0, (a.k === 'beam' ? a.t0 + ABIL.beam.delay : a.end) - g.t).toFixed(1)}s`, x + d * 2, y + 30);
    n++;
  }
  return n;
}
// The Extinction Event: meteors fall on buildings the player can see (own base always; enemy buildings only in view)
function vfxMeteors(g, dt) {
  VFX.metAcc = (VFX.metAcc || 0) + dt * (1.6 + (g.t - EXT.start) / 60) * QMUL[VFX.q]; // more as the storm grows
  if (VFX.metAcc < 1) return;
  VFX.metAcc -= 1;
  const F = viewFog(g), bs = g.ents.filter(e => e.kind === 'b' && e.hp > 0 && F.vis[cellOf(e.u, e.v)] && onView(e.u));
  if (!bs.length) return;
  const b = bs[Math.floor(VFX.rnd() * bs.length)], w = P(b.u + vr(-b.half, b.half) * 0.6, b.v + vr(-b.half, b.half) * 0.6, vr(4, b.h * 0.5));
  vFx('meteor', w.x + vr(60, 120), w.y - 320, 0, 0.5, null, 3, w.x, w.y, 3.5);
  vFx('boom', w.x, w.y, vr(24, 36), 0.6, null, 2, 0, 0, 1, 0.5);
  vFx('ring', w.x, w.y, 4, 0.4, '#ffb070', 1, 30, 1, 1.6, 0.45);
  sfx('meteor', w.x);
}
function addDecal(x, y, r, life, col) { if (VFX.decals.length >= VFX_DECALS) VFX.decals.shift(); VFX.decals.push({ x, y, r, t: 0, life, col }); } // col 'acid': a Bloomhost stain (v2.36)

// Quality fallback: if over 30% of frames take longer than 33 ms for 2 seconds, step down a level;
// after 6 smooth seconds (under 10% slow frames), step back up. Gaps over 250 ms (tab switches) are ignored.
function vfxQuality(gap, playing) {
  if (VFX.lock !== null) { VFX.q = VFX.lock; return; }
  if (!playing || gap > 250) return;
  VFX.gaps.push(gap);
  VFX.gapAt += gap;
  if (VFX.gapAt < 1000) return;
  const slow = VFX.gaps.filter(x => x > 33.4).length / VFX.gaps.length;
  VFX.gaps.length = 0; VFX.gapAt = 0;
  if (slow > 0.3) { VFX.fastFor = 0; if (++VFX.slowFor >= 2 && VFX.q > 0) { VFX.q--; VFX.slowFor = 0; } }
  else if (slow < 0.1) { VFX.slowFor = 0; if (++VFX.fastFor >= 6 && VFX.q < 2) { VFX.q++; VFX.fastFor = 0; } }
  else { VFX.slowFor = 0; VFX.fastFor = 0; }
}

// Drawing
// Artillery landing marker: only while the shell itself can be seen, and only on ground in view, so it can never
// give away a gun firing from the fog
const showLanding = (p, lit) => lit(p.u, p.v) && lit(p.tu, p.tv);
function drawBoom(c, x, y, r, k) {
  c.globalCompositeOperation = 'lighter';
  stamp(c, GLOW.fire, x, y, r * (0.9 + k * 0.8), (1 - k) * 0.7);
  if (k < 0.35) stamp(c, GLOW.white, x, y, r * 0.45, 1 - k / 0.35);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.fillStyle = `rgba(255,170,80,${(1 - k) * 0.55})`; c.beginPath(); c.arc(x, y, r * (0.35 + k * 0.75), 0, 7); c.fill();
}
// Rings under the selected units (v2.74), flags where an older match's Regroup orders are still on their way
function drawSelection(c, g, time) { // v2.74: a ring under each selected unit (docs/CONTROLS.md)
  if (typeof SELN === 'undefined' || !SELN.size) return;
  const a = 0.7 + 0.25 * Math.sin(time * 6);
  c.strokeStyle = `rgba(127,227,255,${a})`; c.lineWidth = 2;
  for (const e of g.ents) {
    if (e.kind !== 'u' || e.side !== 0 || e.hp <= 0 || !SELN.has(e.id)) continue;
    const w = P(e.u, e.v), r = (UDEF[e.type].air ? 13 : UDEF[e.type].pop >= 3 ? 17 : 10) * US;
    c.beginPath(); c.ellipse(w.x, w.y, r, r * 0.45, 0, 0, 7); c.stroke();
  }
}
// The selected building or pad (v2.35, audit): a pulsing gold glow on its pad (under), brackets around the building (over),
// on for as long as the building panel shows it. top: the bracket pass, drawn after everything on the field
function drawBuildingSel(c, g, time, top) {
  const b = sel && sel.side === 0 && sel.hp > 0 && g.ents.includes(sel) ? sel : null;
  if (!b && !(selPad >= 0)) return;
  const d = b ? bdOf(b) : null, a = 0.5 + 0.5 * Math.sin(time * 5);
  const at = !b ? slotPos(0, selPad) : b.type === 'hq' ? hqPos(0) : b.slot >= 0 && !d.noPad ? slotPos(0, b.slot) : b, w = P(at.u, at.v);
  c.save();
  c.shadowColor = 'rgba(255,211,77,0.95)'; c.shadowBlur = 5 + 9 * a;
  c.strokeStyle = `rgba(255,211,77,${0.45 + 0.55 * a})`; c.lineWidth = 2.6;
  if (!top) {
    const h = (b && b.type === 'hq' ? HQ_PAD_H : b && d.noPad ? d.half * 0.9 : PAD_H) + 2;
    poly(c, [pt(-h, -h), pt(h, -h), pt(h, h), pt(-h, h)].map(([x, y]) => [w.x + x, w.y + y])); c.stroke();
  } else if (b) {
    const q = P(b.u, b.v), hw = 2 * d.half * IX * BS + 4, x0 = q.x - hw, x1 = q.x + hw, y0 = q.y - (d.half + d.h) * BS - 8, y1 = q.y + d.half * BS + 4, n = Math.min(12, hw * 0.4);
    c.beginPath();
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x1, y1, -1, -1], [x0, y1, 1, -1]]) { c.moveTo(x + sx * n, y); c.lineTo(x, y); c.lineTo(x, y + sy * n); }
    c.stroke();
  }
  c.restore();
}
function drawFlags(c, g, time) {
  const O = g.sides[0].orders; if (!O) return;
  for (const o of [O.all, ...Object.values(O.groups), ...Object.values(O.types)]) {
    if (!o || o.o !== 'move' || o.done) continue;
    const RL = g.sides[0].rally; if (RL && o === O.all && Math.abs(o.u - RL[RL.at]) < 1) continue; // v2.62: the army heading to its rally flag: that flag marks it
    const w = P(o.u, o.v), wave = Math.sin(time * 5) * 1.5;
    c.setLineDash([5, 5]); c.strokeStyle = 'rgba(159,230,255,0.55)'; c.lineWidth = 1.3;
    c.beginPath(); c.ellipse(w.x, w.y, 40, 40 * DY * 0.9, 0, 0, 7); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#d9e6f5'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(w.x, w.y); c.lineTo(w.x, w.y - 30); c.stroke();
    c.fillStyle = TEAM[0].main; c.beginPath(); c.moveTo(w.x, w.y - 30); c.lineTo(w.x + 15, w.y - 25 + wave); c.lineTo(w.x, w.y - 20); c.closePath(); c.fill();
  }
}
function drawDecals(c) {
  for (const d of VFX.decals) {
    const a = 0.45 * Math.min(1, (d.life - d.t) / 4);
    c.fillStyle = d.col === 'acid' ? `rgba(120,190,60,${a * 0.8})` : `rgba(12,10,8,${a})`; c.beginPath(); c.ellipse(d.x, d.y, d.r, d.r * 0.42, 0, 0, 7); c.fill();
  }
}
function drawWrecks(c, time) {
  for (const w of VFX.wrecks) {
    const b = w.b, k = w.t / 1.2, p = P(b.u, b.v), base = p.y + (BDEF[b.type].half + 6) * BS;
    c.save();
    c.beginPath(); c.rect(p.x - 200, p.y - 300, 400, base - p.y + 300); c.clip();
    c.globalAlpha = 1 - k * k; c.translate(0, k * k * 46 * BS);
    drawBuilding(c, b, time);
    c.restore();
  }
}
function drawVfx(c) {
  const P_ = VFX.parts;
  // smoke and dust first, then sparks and debris
  for (let i = 0; i < VFX.np; i++) {
    const p = P_[i];
    if (p.kind !== 0 && p.kind !== 3) continue;
    const k = p.life / p.max;
    if (p.kind === 3) { c.fillStyle = '#7a6a55'; c.globalAlpha = 0.4 * k; }
    else { c.fillStyle = p.col === 'light' ? '#aaaabf' : '#282834'; c.globalAlpha = (p.col === 'light' ? 0.3 : 0.55) * k; }
    c.beginPath(); c.arc(p.x, p.y, p.size * (1.8 - k), 0, 7); c.fill();
  }
  let fire = 0;
  for (let i = 0; i < VFX.np; i++) {
    const p = P_[i];
    if (p.kind === 0 || p.kind === 3) continue;
    if (p.kind === 4) { fire++; continue; }
    c.globalAlpha = p.kind === 2 ? Math.min(1, p.life / p.max * 3) : p.life / p.max;
    c.fillStyle = p.col; c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  if (fire) drawFlameCones(c);
  if (fire) { // flame (v2.36): soft additive licks that grow, redden and flicker as they age; a white-hot core near the nozzle
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < VFX.np; i++) {
      const p = P_[i];
      if (p.kind !== 4) continue;
      const k = p.life / p.max, age = 1 - k, fl = 0.75 + 0.25 * Math.sin(p.x * 0.7 + p.life * 60);
      stamp(c, age < 0.55 ? GLOW.fire : GLOW.ember, p.x, p.y, p.size * (1.6 + age * 4.2), (age < 0.55 ? 0.7 : 0.45) * k * fl);
      if (age < 0.18) stamp(c, GLOW.warm, p.x, p.y, p.size * 0.9, 0.9 * fl);
    }
    c.globalCompositeOperation = 'source-over';
  }
  c.globalAlpha = 1;
  const F_ = VFX.fx;
  for (let i = 0; i < VFX.nfx; i++) {
    const f = F_[i];
    if (f.t < 0) continue;
    const k = f.t / f.life;
    if (f.k === 'flash') {
      c.globalCompositeOperation = 'lighter'; stamp(c, f.col, f.x, f.y, f.r * (1 - k * 0.4), 1 - k); c.globalCompositeOperation = 'source-over';
    } else if (f.k === 'ring') {
      const e = 1 - (1 - k) * (1 - k), r = f.r + (f.x2 - f.r) * e;
      c.globalAlpha = (1 - k) * 0.75; c.strokeStyle = f.col || TEAM[0].light; c.lineWidth = f.w * (1 - k) + 0.4;
      c.beginPath(); c.ellipse(f.x, f.y, r, f.y2 ? r * 0.42 : r, 0, 0, 7); c.stroke();
    } else if (f.k === 'beam') {
      c.globalAlpha = 1 - k; c.lineCap = 'round';
      c.strokeStyle = 'rgba(120,220,255,0.45)'; c.lineWidth = f.w * 2.6 * (1 - k * 0.5); c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.stroke();
      c.strokeStyle = '#e8fbff'; c.lineWidth = f.w * (1 - k * 0.6); c.stroke();
      c.lineCap = 'butt';
    } else if (f.k === 'boom') drawBoom(c, f.x, f.y, f.r, k);
    else if (f.k === 'meteor') { // a burning rock streaking down to its target
      const hx = f.x + (f.x2 - f.x) * k, hy = f.y + (f.y2 - f.y) * k, k0 = Math.max(0, k - 0.3), tx = f.x + (f.x2 - f.x) * k0, ty = f.y + (f.y2 - f.y) * k0;
      c.globalAlpha = 0.85; c.strokeStyle = '#ffb070'; c.lineWidth = f.w; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty); c.lineTo(hx, hy); c.stroke(); c.lineCap = 'butt';
      c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.fire, hx, hy, 11, 1); stamp(c, GLOW.white, hx, hy, 4, 1); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
  }
  c.globalAlpha = 1;
}

// Faction weapons in flight (v2.36, audit phase 2). Render only: flight paths stay the SIM's. Axiarch shots are lasers
// (a streak with a white core) or energy orbs; Bloomhost shots are wobbling globs on a drawn arc that drip as they fly, or
// bone spines; each HQ has its own: a Last Fist cannon round, a Bloomhost spine volley (the Axis fires a beam, drawBeam).
const AX_LASER = { bolt: [26, '120,220,255', 1.6], phase: [22, RIFTA, 1.6], prism: [14, '200,245,255', 1.2], astral: [70, '150,235,255', 2.2] }; // streak length, glow, core width
const AX_ORB = { pulse: [3.4, 'cyan', '#bff4ff'], grav: [2.6, 'violet', RIFT], breaker: [3.6, 'violet', RIFT] }; // radius, glow, ring
const BH_GLOB = { acid: [2, 1], bile: [3, 1], ruin: [4, 1], glob: [3.6, 0], crush: [5.2, 0] }; // radius, drawn arc (the rest fall)
function projDir(a, b, side) { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); return d > 0.01 ? [dx / d, dy / d] : [side ? -1 : 1, 0]; }
function projArc(p) { // the height of a glob's drawn arc: 0 at launch and landing, highest halfway
  const r = VFX.rec.get(p); if (!r || !r.has) return 0;
  const d0 = Math.hypot(p.u - r.ou, p.v - r.ov), d1 = Math.hypot(p.tu - p.u, p.tv - p.v);
  return Math.sin(Math.PI * d0 / Math.max(1, d0 + d1)) * Math.min(40, (d0 + d1) * 0.12);
}
function drawSpine(c, x, y, dx, dy, len, w = 1.7) {
  c.strokeStyle = '#e9dcbc'; c.lineWidth = w; c.beginPath(); c.moveTo(x - dx * len, y - dy * len); c.lineTo(x, y); c.stroke();
  c.strokeStyle = '#7b5a3c'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - dx * len, y - dy * len); c.lineTo(x - dx * len * 0.55, y - dy * len * 0.55); c.stroke();
  c.fillStyle = '#c4f58e'; c.beginPath(); c.arc(x, y, 1.1, 0, 7); c.fill();
}
function drawFacProj(c, g, p, a, b, wp, time) {
  if (wp === 'hqgun') {
    const [dx, dy] = projDir(a, b, p.side);
    if (facOf(g.sides[p.side].faction) === 'bloomhost') { // three spines abreast
      for (const o of [-1, 0, 1]) drawSpine(c, b.x - dy * o * 7 - dx * Math.abs(o) * 6, b.y + dx * o * 7 - dy * Math.abs(o) * 6, dx, dy, 18, 2.4);
      return true;
    }
    c.lineCap = 'round'; c.strokeStyle = 'rgba(255,170,70,0.85)'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(b.x - dx * 16, b.y - dy * 16); c.lineTo(b.x, b.y); c.stroke();
    c.strokeStyle = '#fff1c8'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(b.x - dx * 9, b.y - dy * 9); c.lineTo(b.x, b.y); c.stroke(); c.lineCap = 'butt';
    c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.fire, b.x, b.y, 8, 0.9); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    return true;
  }
  const las0 = AX_LASER[wp], las = las0 && p.fc ? [las0[0] * (1 + 0.25 * p.fc), las0[1], las0[2] * (1 + 0.22 * p.fc)] : las0; // P14 (v2.37): a Lancer's focus builds a longer, thicker bolt
  if (las) {
    const [dx, dy] = projDir(a, b, p.side), r = VFX.rec.get(p);
    let len = las[0]; if (r && r.has) { const o = P(r.ou, r.ov, r.oz); len = Math.min(len, Math.hypot(b.x - o.x, b.y - o.y)); }
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    c.strokeStyle = `rgba(${las[1]},0.35)`; c.lineWidth = las[2] * 3.2; c.beginPath(); c.moveTo(b.x - dx * len, b.y - dy * len); c.lineTo(b.x, b.y); c.stroke();
    c.strokeStyle = `rgba(${las[1]},0.9)`; c.lineWidth = las[2] * 1.6; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = las[2] * 0.6; c.beginPath(); c.moveTo(b.x - dx * len * 0.6, b.y - dy * len * 0.6); c.lineTo(b.x, b.y); c.stroke();
    stamp(c, wp === 'phase' ? GLOW.violet : GLOW.cyan, b.x, b.y, 3 + las[2] * 2, 0.9);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.lineCap = 'butt';
    return true;
  }
  const orb = AX_ORB[wp];
  if (orb) {
    const [dx, dy] = projDir(a, b, p.side), R = orb[0];
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = orb[1] === 'violet' ? `rgba(${RIFTA},0.4)` : 'rgba(120,220,255,0.4)'; c.lineWidth = R * 1.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(b.x - dx * R * 4, b.y - dy * R * 4); c.lineTo(b.x, b.y); c.stroke(); c.lineCap = 'butt';
    stamp(c, GLOW[orb[1]], b.x, b.y, R * 3.6, 0.95);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(b.x, b.y, R * 0.6, 0, 7); c.fill();
    c.strokeStyle = orb[2]; c.lineWidth = 1; c.beginPath(); c.arc(b.x, b.y, R + 1.2 + Math.sin(time * 18 + p.t * 20) * 0.6, 0, 7); c.stroke();
    return true;
  }
  if (wp === 'spine') { const [dx, dy] = projDir(a, b, p.side); drawSpine(c, b.x, b.y, dx, dy, 11); return true; }
  const gl = BH_GLOB[wp];
  if (gl) {
    const h = gl[1] ? projArc(p) : 0, R = gl[0], x = b.x, y = b.y - h, wob = 1 + 0.18 * Math.sin(time * 22 + p.t * 31);
    const [dx, dy] = projDir(a, b, p.side);
    if (h > 2) { const gy = P(p.u, p.v, 0).y; c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(b.x, Math.max(gy, b.y), R * 1.1, R * 0.45, 0, 0, 7); c.fill(); } // its shadow below
    c.fillStyle = 'rgba(155,225,93,0.45)'; for (const k of [2.2, 3.8]) { c.beginPath(); c.arc(x - dx * R * k, y - dy * R * k + k, R * (0.75 - k * 0.12), 0, 7); c.fill(); } // trailing droplets
    c.save(); c.translate(x, y); c.rotate(Math.atan2(dy, dx)); c.scale(wob * 1.25, 1 / wob);
    c.fillStyle = wp === 'ruin' || wp === 'crush' ? '#5f9a32' : '#7fc548'; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill();
    c.fillStyle = '#d6ff9a'; c.beginPath(); c.arc(R * 0.25, -R * 0.3, R * 0.42, 0, 7); c.fill();
    c.restore();
    c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.acid, x, y, R * 2.6, 0.45); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    if (VFX.rnd() < 0.06 * QMUL[VFX.q]) vPart(x, y + R, vr(-8, 8), vr(0, 20), vr(0.3, 0.5), 1.4, 1, '#9be15d', 260, 0, P(p.u, p.v, 0).y); // a drip falls away
    return true;
  }
  return false;
}
function render(c, g, time, sel, selPad) {
  const { cw, ch, dpr, S, A } = V;
  if (!cw) return;
  SPR.budget = 16; BCACHE.budget = 6;
  const hy = (HORIZON - YB()) * S + A;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawSky(c, time, hy, g && g.t >= EXT.warn ? Math.round(12 * clamp((g.t - EXT.warn) / (EXT.start + 60 - EXT.warn), 0, 1)) : 0); // the sky reddens for the Extinction Event
  let sx = 0, sy = 0;
  if (g) vfxStep(g);
  const shake = g && VFX.q > 0 ? g.shake + VFX.shake : 0; // no shake at the lowest quality level
  if (shake > 0) { sx = vr(-1, 1) * shake; sy = vr(-1, 1) * shake; }
  c.setTransform(dpr * S, 0, 0, dpr * S, dpr * (cw / 2 - cam.x * S + sx), dpr * (A - YB() * S + sy));
  drawRidge(c, BG.far, 0.25, '#1a1a3c', 'rgba(170,150,240,0.35)');
  drawRidge(c, BG.near, 0.5, '#13152c', 'rgba(120,110,200,0.2)');
  if (groundCache) c.drawImage(groundCache, GB.x0, GB.y0, GB.x1 - GB.x0, GB.y1 - GB.y0); else drawGround(c);
  if (!g) return;
  // Everything below is drawn from the player's point of view: enemies only inside friendly vision
  const F = viewFog(g), seen = e => e.side === 0 || !!g.spectate || visibleTo(g, 0, e), lit = (x, y) => F.vis[cellOf(x, y)] === 1; // v2.65: depth too (a grid map)
  const ghosts = Object.values(F.ghosts).filter(gh => !cellsLit(F.vis, gh.u, gh.half, gh.v));
  drawCreep(c, g, F); // under everything on the field (v2.18)
  drawField(c, g, F); // the Axiarch power field (v2.26), also under everything

  for (let s = 0; s < 2; s++) {
    const fac = g.sides[s].faction, hpos = hqPos(s), hp = P(hpos.u, hpos.v);
    // v2.17: enemy pads stay hidden until their ground has been in view (their look would give the faction away)
    if (s === 0 || cellsLit(F.seen, hpos.u, HQ_PAD_H, hpos.v)) drawPad(c, hp.x, hp.y, HQ_PAD_H, s, false, time, sel && sel.type === 'hq' && sel.side === s, fac);
    for (let i = 0; i < SLOT_COUNT; i++) {
      const p = slotPos(s, i), w = P(p.u, p.v), b = g.sides[s].slots[i];
      if (s === 1 && !cellsLit(F.seen, p.u, PAD_H, p.v)) continue;
      // enemy pads look occupied only as far as the player knows (in view, or a remembered ghost)
      const known = s === 0 ? b : (b && seen(b)) || ghosts.some(gh => gh.slot === i);
      drawPad(c, w.x, w.y, PAD_H, s, !known, time, s === 0 && (selPad === i || (sel && sel === b)), fac);
      if (!b && rubbleAt(g, s, i) && (s === 0 || lit(p.u, p.v))) drawRubble(c, w.x, w.y, (g.sides[s].rubble[i] - g.t) / BREAK.rubble.t, i + s * 8); // v2.69 (c)
    }
    if (sigPadOn() && SIG.on && BD(fac, 'sigA')) { // v2.43: the signature pad, marked in gold
      const p = slotPos(s, SIG_SLOT), w = P(p.u, p.v), b = sigOnPad(g, s);
      if (s === 0 || cellsLit(F.seen, p.u, PAD_H, p.v)) {
        const known = s === 0 ? b : (b && seen(b)) || ghosts.some(gh => gh.slot === SIG_SLOT);
        drawPad(c, w.x, w.y, PAD_H, s, !known, time, s === 0 && (selPad === SIG_SLOT || (sel && sel === b)), fac);
        drawSigPadMark(c, w.x, w.y, PAD_H, !known, time, s === 0 && !g.spectate);
      }
    }
  }
  for (let k = 0; k < FWD_PADS.length; k++) { // v2.65: forward pads (both sides build there; the holder of its node may)
    const Q = FWD_PADS[k], owner = g.nodes[Q.node].owner, b = fwdAt(g, FWD_SLOT + k);
    if (!cellsLit(F.seen, Q.at[0], PAD_H, Q.at[1]) && !(b && b.side === 0)) continue;
    drawFwdPad(c, k, owner, !(b && seen(b)), time, selPad === FWD_SLOT + k || (sel && sel === b));
  }
  for (const n of g.nodes) drawNodeZone(c, n, time, lit(n.u, n.v));
  for (const b of g.ents) if (b.type === 'bunker' && b.hp > 0 && b.tier >= 2 && seen(b)) drawHealRing(c, b, time); // v2.32: Depot T2
  for (const a of g.acid) if (lit(a.u, a.v)) drawAcidPool(c, a, g.t);
  drawDecals(c);
  drawMeteor(c, g, time); // v2.72: a meteor's warning circle, then its fall
  if (g) { drawSelection(c, g, time); drawBuildingSel(c, g, time, false); }
  drawWrecks(c, time);
  // everything on the field, back to front
  const list = g.ents.filter(seen);
  for (const gh of ghosts) list.push({ kind: 'ghost', u: gh.u, v: gh.v, gh });
  for (const n of g.nodes) list.push({ kind: 'node', u: n.u, v: n.v - 1, n });
  for (const x of g.guards || []) if (x.hp > 0 && (g.spectate || visibleTo(g, 0, x))) list.push(x); // v2.71: relic guards (neutral gold)
  if (g.sides[0].direct && !g.over) g.sides[0].flags.forEach((f, k) => list.push({ kind: 'flag', u: f.u, v: f.v, lane: k, on: k === g.sides[0].active })); // v2.74: a base flag per lane (the active lane's brighter)
  else if (!g.sides[0].direct && g.sides[0].stance !== 'attack') list.push({ kind: 'flag', u: rallyU(0, g) + 30, v: -20, on: true }); // spectating: the rally point
  list.sort((a, b) => (a.v - b.v) || (a.u - b.u));
  for (const e of list) {
    if (e.kind === 'b') drawBuilding(c, e, time);
    else if (e.kind === 'ghost') drawGhost(c, e.gh);
    else if (e.kind === 'u') drawUnit(c, e);
    else if (e.kind === 'node') drawNode(c, e.n, time);
    else {
      const w = P(e.u, e.v), moving = typeof flagMv !== 'undefined' && flagMv === e.lane;
      c.globalAlpha = moving ? 0.5 + 0.4 * Math.sin(time * 8) : e.on ? 1 : 0.7;
      c.strokeStyle = M.h; c.lineWidth = 1.5; c.beginPath(); c.moveTo(w.x, w.y); c.lineTo(w.x, w.y - 34); c.stroke();
      c.fillStyle = TEAM[0].main; c.beginPath(); c.moveTo(w.x, w.y - 34);
      for (let i = 0; i <= 5; i++) c.lineTo(w.x + i * 3.4, w.y - 34 + Math.sin(time * 5 + i) * 1.3);
      for (let i = 5; i >= 0; i--) c.lineTo(w.x + i * 3.4, w.y - 25 + Math.sin(time * 5 + i) * 1.3);
      c.closePath(); c.fill();
      if (e.on && MAP_LANED) { c.strokeStyle = '#ffd34d'; c.lineWidth = 1.4; c.stroke(); } // v2.74: the active lane's flag, edged in gold as in the left column
      if (MAP_LANED && e.lane != null) { c.fillStyle = '#04121c'; c.font = '800 7px -apple-system,system-ui,sans-serif'; c.textAlign = 'center'; c.fillText(MAP.lanes[e.lane].id[0].toUpperCase(), w.x + 8.5, w.y - 27.5); }
      c.globalAlpha = 1;
    }
  }
  drawBuildingSel(c, g, time, true);
  drawFog(c, F);
  for (const p of g.projs) {
    if (p.side !== 0 && !lit(p.u, p.v)) continue;
    const a = P(p.pu, p.pv, p.pz), b = P(p.u, p.v, p.z), wp = p.weapon;
    if (drawFacProj(c, g, p, a, b, wp, time)) continue; // faction weapons (v2.36)
    if (wp === 'rifle' || wp === 'flak' || wp === 'gatling' || wp === 'rail' || wp === 'spine' || wp === 'bolt' || wp === 'astral') {
      c.strokeStyle = wp === 'rail' || wp === 'astral' || wp === 'bolt' ? '#bff4ff' : wp === 'flak' ? '#ffe9a8' : wp === 'gatling' ? '#ffd38a' : wp === 'spine' ? '#d6ff9a' : '#fff3b0';
      c.lineWidth = wp === 'rail' || wp === 'astral' ? 2 : wp === 'gatling' || wp === 'bolt' ? 1.5 : 1.2;
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      if (wp === 'rail' || wp === 'astral' || wp === 'bolt') { c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.cyan, b.x, b.y, 5, 0.9); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    } else if (wp === 'cannon' || wp === 'siege') {
      const big = wp === 'siege';
      c.strokeStyle = 'rgba(255,220,140,0.75)'; c.lineWidth = big ? 3.2 : 2.2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      c.globalCompositeOperation = 'lighter'; stamp(c, big ? GLOW.white : GLOW.warm, b.x, b.y, big ? 8 : 6, 0.85); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(b.x, b.y, big ? 3 : 2.2, 0, 7); c.fill();
    } else if (wp === 'prism') { // a Prismwing's shard of light (v2.29)
      c.strokeStyle = '#bff4ff'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    } else if (wp === 'void' || wp === 'sovereign') { // a Voidcarrier's slow dark orb, a Sovereign's falling mass (v2.29)
      const big = wp === 'sovereign' ? 5 : 4;
      c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.cyan, b.x, b.y, big * 2.6, 0.45); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.fillStyle = '#0c0e19'; c.beginPath(); c.arc(b.x, b.y, big, 0, 7); c.fill();
      c.strokeStyle = RIFT; c.lineWidth = 1.4; c.beginPath(); c.arc(b.x, b.y, big + 1, 0, 7); c.stroke();
    } else if (wp === 'breaker' || wp === 'grav') { // Worldbreaker and Gravemantle/Eventide shots (v2.27): a violet orb
      c.strokeStyle = `rgba(${RIFTA},0.55)`; c.lineWidth = wp === 'breaker' ? 3 : 2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      c.fillStyle = RIFT; c.beginPath(); c.arc(b.x, b.y, wp === 'breaker' ? 3.4 : 2.2, 0, 7); c.fill();
    } else if (wp === 'acid' || wp === 'bile' || wp === 'ruin' || wp === 'glob' || wp === 'crush') { // Bloomhost acid (v2.19): a green glob with a short trail
      const big = wp === 'crush' ? 4.4 : wp === 'ruin' || wp === 'glob' ? 3.2 : wp === 'bile' ? 2.6 : 1.8;
      c.strokeStyle = 'rgba(155,225,93,0.55)'; c.lineWidth = big; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      c.fillStyle = wp === 'ruin' ? '#6fae3a' : '#c4f58e'; c.beginPath(); c.arc(b.x, b.y, big, 0, 7); c.fill();
    } else if (wp === 'rift') { // the Rift Mortar's shot (v2.27): a violet orb on the shell's arc, the same landing ring
      const gp = P(p.u, p.v, 0);
      if (showLanding(p, lit)) { const t = P(p.tu, p.tv, 0), k = clamp(p.t / p.T, 0, 1), R = p.precise ? 14 - 4 * k : 26 - 8 * k; c.strokeStyle = p.precise ? RIFT : TEAM[p.side].main; c.globalAlpha = 0.2 + 0.5 * k; c.lineWidth = 1.2; c.beginPath(); c.ellipse(t.x, t.y, R, R * 0.42, 0, 0, 7); c.stroke();
        if (p.precise) { c.beginPath(); for (const s of [-1, 1]) { c.moveTo(t.x + s * (R + 2), t.y); c.lineTo(t.x + s * (R + 8), t.y); c.moveTo(t.x, t.y + s * (R * 0.42 + 1)); c.lineTo(t.x, t.y + s * (R * 0.42 + 5)); } c.stroke(); } // P3 (v2.37): a precise strike's crosshair
        c.globalAlpha = 1; }
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(gp.x, gp.y, 4, 1.6, 0, 0, 7); c.fill();
      c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.cyan, b.x, b.y, 7, 0.6); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.fillStyle = RIFT; c.beginPath(); c.arc(b.x, b.y, 3.2, 0, 7); c.fill(); c.fillStyle = '#efe6ff'; c.beginPath(); c.arc(b.x - 1, b.y - 1, 1.1, 0, 7); c.fill();
    } else if (wp === 'lob') { // the Bile Lobber's arcing glob, with the same landing ring as a shell
      const gp = P(p.u, p.v, 0);
      if (showLanding(p, lit)) { const t = P(p.tu, p.tv, 0), k = clamp(p.t / p.T, 0, 1); c.strokeStyle = TEAM[p.side].main; c.globalAlpha = 0.2 + 0.5 * k; c.lineWidth = 1.2; c.beginPath(); c.ellipse(t.x, t.y, 26 - 8 * k, (26 - 8 * k) * 0.42, 0, 0, 7); c.stroke(); c.globalAlpha = 1; }
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(gp.x, gp.y, 4, 1.6, 0, 0, 7); c.fill();
      c.fillStyle = '#9be15d'; c.beginPath(); c.arc(b.x, b.y, 3.4, 0, 7); c.fill(); c.fillStyle = '#e4ffc8'; c.beginPath(); c.arc(b.x - 1, b.y - 1, 1.2, 0, 7); c.fill();
    } else if (wp === 'shell') {
      const gp = P(p.u, p.v, 0);
      if (showLanding(p, lit)) {
        const t = P(p.tu, p.tv, 0), k = clamp(p.t / p.T, 0, 1);
        c.strokeStyle = TEAM[p.side].main; c.globalAlpha = 0.2 + 0.5 * k; c.lineWidth = 1.2;
        c.beginPath(); c.ellipse(t.x, t.y, 26 - 8 * k, (26 - 8 * k) * 0.42, 0, 0, 7); c.stroke(); c.globalAlpha = 1;
      }
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(gp.x, gp.y, 4, 1.6, 0, 0, 7); c.fill();
      c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.fire, b.x, b.y, 9, 0.8); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.fillStyle = '#ffe2a8'; c.beginPath(); c.arc(b.x, b.y, 2.4, 0, 7); c.fill();
    } else if (wp === 'hqgun') {
      c.globalCompositeOperation = 'lighter'; stamp(c, GLOW['t' + p.side], b.x, b.y, 8, 1); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(b.x, b.y, 2.3, 0, 7); c.fill();
    } else { // rocket, missile
      c.strokeStyle = 'rgba(255,170,80,0.7)'; c.lineWidth = wp === 'rocket' ? 2.2 : 1.5; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      c.globalCompositeOperation = 'lighter'; stamp(c, GLOW.fire, b.x, b.y, wp === 'rocket' ? 6 : 4.5, 0.9); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.fillStyle = p.side === 0 ? '#bff2ff' : '#ffd0d0'; c.beginPath(); c.arc(b.x, b.y, 2, 0, 7); c.fill();
    }
  }
  const thin = VFX.q === 0; // lowest quality: half the SIM's smoke is drawn
  for (let i = 0; i < g.parts.length; i++) {
    const p = g.parts[i];
    if (!lit(p.x, p.y / DY) || (thin && p.smoke && i % 2)) continue; // smoke, sparks and debris give away activity
    const k = p.life / p.max;
    if (p.smoke) {
      c.fillStyle = p.light ? '#aaaabe' : '#282834'; c.globalAlpha = (p.light ? 0.3 : 0.55) * k;
      c.beginPath(); c.arc(p.x, p.y, p.size * (1.8 - k), 0, 7); c.fill();
    } else { c.globalAlpha = k; c.fillStyle = p.color; c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); }
  }
  c.globalAlpha = 1;
  for (const f of g.fx) { // the SIM's blasts (its muzzle flashes are replaced by the per-weapon ones in drawVfx)
    if (f.k === 'beam') { if (lit(f.x, f.y / DY) || lit(f.x2, (f.y2 ?? f.y) / DY)) drawBeam(c, f); continue; } // Null Lance beams (v2.25), only where the player can see
    if (f.k === 'pull') { if (lit(f.x, f.y / DY)) drawPull(c, f); continue; } // Eventide pulses (v2.27)
    if (f.k === 'scrap') { if (scrapShown(g, f, 0)) drawScrap(c, f); continue; }
    if (f.k === 'acidburst') { if (lit(f.u, f.v)) drawAcidBurst(c, f); continue; }
    if (f.k === 'shatter') { if (lit(f.u, f.v)) drawShatter(c, f); continue; } // a Phase Beacon bubble collapsing (v2.34) // a killed Mite (v2.33)
    if (f.k === 'pierce') { if (lit(f.u, f.v)) drawPierce(c, f); continue; } // P4 (v2.37)
    if (f.k === 'blink') { if (lit(f.u, f.v)) drawBlink(c, f); continue; } // P5 (v2.37)
    if (f.k === 'devour') { if (lit(f.u, f.v)) drawDevour(c, f); continue; } // P11 (v2.37)
    if (f.k === 'roots') { drawRoots(c, f, lit); continue; } // a Rootheart's snare pulse (v2.33), only where the player can see // Salvage (v2.30): the player's own, where they can see
    if (f.k !== 'boom' || !lit(f.x, f.y / DY)) continue;
    drawBoom(c, f.x, f.y, f.r, f.t / f.life);
  }
  c.globalAlpha = 1;
  drawVfx(c);
  drawAbilities(c, g, lit, time);
  drawWarps(c, g, lit, time);
  drawFlags(c, g, time);
  drawAim(c, g);
  c.font = '600 11px -apple-system,system-ui,sans-serif'; c.textAlign = 'center';
  const barMin = (V.ft - V.A) / V.S + YB() + 12 / V.S; // highest world row that clears the top bar (with room for tier pips)
  for (const e of (g.guards && g.guards.length ? g.ents.concat(g.guards.filter(x => x.hp > 0)) : g.ents)) { // v2.71: and the relic guards
    if (!seen(e)) continue;
    if (e.kind === 'b') {
      const x = P(e.u, e.v).x, top = Math.max(bTop(e) - 8, barMin), hq = e.type === 'hq';
      bar(c, x, top, hq ? 84 : 52, e.hp / e.maxHp, hq ? 5 : 3.5, lostF(e));
      const sy = e.maxShp ? top - 4.5 : top; // Axiarch shields (v2.25): a cyan bar above the health bar, pips above that
      if (e.maxShp) shpBar(c, x, sy, hq ? 84 : 52, e.shp / e.maxShp, 2.6);
      if (e.built) for (let i = 0; i < 3; i++) {
        c.beginPath(); c.arc(x - 8 + i * 8, sy - 6, 2.4, 0, 7);
        if (i < e.tier) { c.fillStyle = '#ffd34d'; c.fill(); } else { c.strokeStyle = 'rgba(255,211,77,0.4)'; c.lineWidth = 1; c.stroke(); }
      }
      if (e.built && e.queue.length) {
        const w = P(e.u, e.v), y = w.y + BDEF[e.type].half * BS + 5;
        c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(w.x - 22, y, 44, 3.5);
        c.fillStyle = TEAM[e.side].main; c.fillRect(w.x - 22, y, 44 * e.prodT / UDEF[e.queue[0]].time, 3.5);
      }
    } else if (e.shT > g.t || e.hp < e.maxHp || e.temp || e.shp < e.maxShp || e.ovT > g.t || e.oshT > g.t || e.bkT > g.t) {
      const d = UDEF[e.type], w = P(e.u, e.v), y = w.y - e.z - visH(e.type) * US - 9, bw = d.air ? 28 : Math.max(18, d.h * 0.9 + 6);
      if (e.shT > g.t) { // shield timer: a ring that empties as the shield runs out
        c.strokeStyle = TEAM[e.side].light; c.lineWidth = 1.6; c.beginPath(); c.arc(w.x - bw / 2 - 5, y + 1, 3.2, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * clamp((e.shT - g.t) / ABIL.shield.dur, 0, 1)); c.stroke();
      }
      if (e.ovT > g.t) { // Shield Overcharge timer (v2.28): a pale-cyan ring that empties as it runs out
        c.strokeStyle = '#bff4ff'; c.lineWidth = 1.6; c.beginPath(); c.arc(w.x - bw / 2 - 5, y + 1, 3.2, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * clamp((e.ovT - g.t) / ABIL.overcharge.dur, 0, 1)); c.stroke();
      }
      if (e.oshT > g.t && e.osh > 0) { const of = e.osh / (e.maxShp * ECHO.osh); c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect(w.x - bw / 2 - 1, y - 9, bw + 2, 3); c.fillStyle = '#f0f8ff'; c.fillRect(w.x - bw / 2, y - 8, bw * clamp(of, 0, 1), 1.6); } // an Echo overshield (v2.34): a white bar over the shields
      if (e.bkT > g.t) { c.fillStyle = `rgba(${AXC.pale},0.9)`; c.beginPath(); const bx = w.x + bw / 2 + 5, by = y - 3; c.moveTo(bx, by - 4); c.lineTo(bx + 3, by); c.lineTo(bx, by + 2); c.lineTo(bx - 3, by); c.closePath(); c.fill(); } // a Beacon T3 warp-in: +20% damage (v2.34)
      if (e.temp) { // a temporary unit (v2.20): a ring that empties as its lifetime runs out
        c.strokeStyle = '#e8d2a8'; c.lineWidth = 1.6; c.beginPath(); c.arc(w.x + bw / 2 + 5, y + 1, 3.2, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * clamp((e.temp - g.t) / (e.tLife || ABIL.brood.life), 0, 1)); c.stroke();
      }
      if (e.maxShp) { bar(c, w.x, y, bw, e.hp / e.maxHp, 2.4, lostF(e)); shpBar(c, w.x, y - 4, bw, e.shp / e.maxShp, 2); continue; } // Axiarch: both bars while either is down (v2.25)
      if (e.hp >= e.maxHp) continue;
      bar(c, w.x, w.y - e.z - visH(e.type) * US - 9, d.air ? 28 : Math.max(18, d.h * 0.9 + 6), e.hp / e.maxHp, 2.4, lostF(e));
    }
  }
  c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); // screen space
  drawStrikeAlerts(c, g, lit, time);
}

