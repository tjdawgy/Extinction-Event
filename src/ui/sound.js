/* ---------- Sound (Web Audio, generated in code; no files) ----------
   One AudioContext, a master gain and a compressor so big fights don't clip. Each sound is 2–5 short-lived nodes
   that are disconnected when they end; nothing loops, so nothing can get stuck. At most 14 sounds play at once:
   small arms may use 9 of them, cannons and blasts 12, game events all 14. Each sound also has its own cap and a
   minimum gap. Battle sounds are panned by screen position, fade at the screen edge and are silent off screen; they
   come only from the effects code, which already skips anything hidden in the fog. iOS: audio starts on the first
   tap, is suspended in the background and resumed on return (or on the next tap). */
const SOUND_KEY = 'extinctionEvent.sound';
const SND = { ctx: null, master: null, noise: null, bufs: {}, gain: {}, tok: 4, tokT: 0, live_v: [], on: true, voices: 0, live: 0, per: {}, last: {}, rnd: mulberry(77), played: 0, dropped: 0 };
try { SND.on = localStorage.getItem(SOUND_KEY) !== 'off'; } catch (e) {}
const SND_MAX = 14, SND_ROOM = [[3, 8, 14], [6, 10, 14], [9, 12, 14]]; // room per priority, by effect quality level (low, medium, full)

function sndInit() {
  if (SND.ctx || !SND.on) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    const ctx = new AC(), comp = ctx.createDynamicsCompressor(), master = ctx.createGain();
    comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
    master.gain.value = 0.7; master.connect(comp); comp.connect(ctx.destination);
    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = SND.rnd() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, 22050); s.connect(ctx.destination); s.start(0); // iOS unlock
    SND.ctx = ctx; SND.master = master; SND.noise = nb;
    sndBake();
  } catch (e) { SND.ctx = null; } // no audio: the game plays on silently
}
// Every sound is rendered once into a buffer (off the main audio graph), so playing one costs three nodes:
// a buffer source, a gain and a pan. Until a buffer is ready, that sound is synthesised live.
async function sndBake() {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, sr = SND.ctx.sampleRate;
  if (!OAC) return;
  const jobs = [];
  for (const name of Object.keys(SFX)) if (name === 'boom') for (const sz of [12, 30, 50]) jobs.push([`boom:${sz}`, name, sz]); else jobs.push([name, name, 0]);
  for (const [key, name, size] of jobs) {
    try {
      const oc = new OAC(1, Math.ceil(sr * 1.6), sr), v = voice(oc, 0, 1, 0, oc.destination);
      SFX[name][4](v, size);
      const buf = await oc.startRendering(), d = buf.getChannelData(0);
      let n = d.length; while (n > 1 && Math.abs(d[n - 1]) < 1e-4) n--;
      const out = SND.ctx.createBuffer(1, n, sr); out.copyToChannel(d.subarray(0, n), 0);
      SND.bufs[key] = out;
    } catch (e) { return; } // keep synthesising live
  }
  sndLevel();
}
function sndWake() { sndInit(); if (SND.ctx && SND.ctx.state !== 'running' && !document.hidden) SND.ctx.resume().catch(() => {}); }
for (const t of ['pointerdown', 'touchend', 'keydown']) document.addEventListener(t, sndWake, { capture: true, passive: true });
document.addEventListener('visibilitychange', () => {
  if (!SND.ctx) return;
  if (document.hidden) SND.ctx.suspend().catch(() => {}); else SND.ctx.resume().catch(() => {});
});
// Backstop: one sweep a second disconnects any voice whose 'ended' event never came (no timer per sound)
setInterval(() => {
  if (!SND.ctx || !SND.live_v.length) return;
  const now = SND.ctx.currentTime;
  SND.live_v = SND.live_v.filter(v => { if (now > v.end + 1.5) { v.done(); return false; } return !v.ended; });
}, 1000);
function sndSet(on) {
  SND.on = on;
  try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (e) {}
  if (on) sndWake();
  if (SND.master) SND.master.gain.value = on ? 0.7 : 0;
}
const sndLabel = () => `Sound: ${SND.on ? 'On' : 'Off'}`;

// A voice: a gain (and a stereo pan where supported) into the master; sources are added by the recipe
function voice(ctx, t, vol, pan, dest = SND.master) {
  const v = { ctx, t, nodes: [], end: t, last: null, out: ctx.createGain() };
  v.out.gain.value = vol;
  let tail = v.out;
  if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; v.out.connect(p); tail = p; v.nodes.push(p); }
  tail.connect(dest); v.nodes.push(v.out);
  return v;
}
function env(v, g, at, dur, peak) {
  g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(peak, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
}
function tone(v, type, f0, f1, dur, peak, delay = 0) {
  const { ctx } = v, at = v.t + delay, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, at); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, at + dur);
  env(v, g, at, dur, peak); o.connect(g); g.connect(v.out); o.start(at); o.stop(at + dur + 0.02);
  v.nodes.push(o, g); if (at + dur + 0.02 >= v.end) { v.end = at + dur + 0.02; v.last = o; } return o;
}
function hiss(v, filter, f0, f1, q, dur, peak, delay = 0) {
  const { ctx } = v, at = v.t + delay, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = SND.noise; f.type = filter; f.Q.value = q;
  f.frequency.setValueAtTime(f0, at); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, at + dur);
  env(v, g, at, dur, peak); s.connect(f); f.connect(g); g.connect(v.out);
  s.start(at, SND.rnd() * 0.5); s.stop(at + dur + 0.02);
  v.nodes.push(s, f, g); if (at + dur + 0.02 >= v.end) { v.end = at + dur + 0.02; v.last = s; } return s;
}
// A hum: an oscillator whose pitch wavers (an LFO on its frequency), for Axiarch beams and fields (v2.36)
function hum(v, type, f, dur, peak, rate, depth, delay = 0) {
  const { ctx } = v, at = v.t + delay, o = tone(v, type, f, f, dur, peak, delay), l = ctx.createOscillator(), lg = ctx.createGain();
  l.frequency.value = rate; lg.gain.value = depth; l.connect(lg); lg.connect(o.frequency); l.start(at); l.stop(at + dur + 0.02);
  v.nodes.push(l, lg); return o;
}
// A chitter: a few very short clicks of filtered noise, close together (Bloomhost, v2.36)
function chitter(v, f, n, gap, peak, delay = 0) { for (let i = 0; i < n; i++) hiss(v, 'bandpass', f * (1 + 0.12 * (i % 2)), f * 0.8, 6, 0.018, peak * (1 - i * 0.15), delay + i * gap); }
// name: [priority 0 small arms / 1 heavy / 2 events, per-sound cap, min gap s, global (plays without a position), recipe]
// v2.36: Bloomhost (wet squelches, chitters, organic thumps) and Axiarch (zaps, hums, shield pings) weapons have their own;
// SFX_FAC lists them, and their loudness is matched to Last Fist's (sndLevel)
const SFX = {
  rifle:    [0, 2, 0.07, 0, v => hiss(v, 'bandpass', 2400, 1600, 1.2, 0.05, 0.5)],
  gatling:  [0, 2, 0.12, 0, v => { hiss(v, 'bandpass', 1800, 1300, 1.4, 0.045, 0.5); hiss(v, 'bandpass', 1800, 1300, 1.4, 0.045, 0.45, 0.08); }],
  hydra:    [0, 2, 0.12, 0, v => { hiss(v, 'bandpass', 2200, 1500, 1.4, 0.04, 0.45); hiss(v, 'bandpass', 2200, 1500, 1.4, 0.04, 0.4, 0.07); }],
  flame:    [0, 2, 0.24, 0, v => { hiss(v, 'lowpass', 1400, 500, 0.9, 0.26, 0.55); }],
  bomb:     [0, 2, 0.6, 0, v => { tone(v, 'sine', 1300, 380, 0.7, 0.22); }], // a falling whistle (v2.15)
  flak:     [0, 2, 0.1, 0, v => { tone(v, 'triangle', 520, 300, 0.05, 0.35); tone(v, 'triangle', 520, 300, 0.05, 0.3, 0.06); }],
  rail:     [1, 2, 0.1, 0, v => { hiss(v, 'highpass', 3000, 3000, 0.7, 0.06, 0.5); tone(v, 'sine', 1500, 350, 0.18, 0.25); }],
  rocket:   [1, 2, 0.08, 0, v => hiss(v, 'bandpass', 600, 2400, 1.5, 0.3, 0.45)],
  missile:  [0, 2, 0.1, 0, v => hiss(v, 'bandpass', 900, 2600, 1.5, 0.14, 0.4)],
  cannon:   [1, 2, 0.08, 0, v => { tone(v, 'sine', 110, 45, 0.3, 0.9); hiss(v, 'lowpass', 900, 300, 0.7, 0.18, 0.5); }],
  siege:    [1, 1, 0.15, 0, v => { tone(v, 'sine', 90, 35, 0.35, 0.9); tone(v, 'sine', 90, 35, 0.35, 0.8, 0.07); hiss(v, 'lowpass', 700, 200, 0.7, 0.25, 0.5); tone(v, 'square', 140, 120, 0.08, 0.06); }],
  shell:    [1, 2, 0.15, 0, v => { tone(v, 'sine', 70, 35, 0.35, 0.9); hiss(v, 'lowpass', 500, 200, 0.7, 0.25, 0.5); }],
  whistle:  [0, 1, 0.3, 0, v => tone(v, 'sine', 1500, 600, 0.7, 0.12)],
  warp:     [1, 2, 0.3, 0, v => { tone(v, 'sine', 300, 1200, 0.9, 0.12); tone(v, 'triangle', 600, 2400, 0.8, 0.05, 0.15); }], // a rising shimmer (v2.26)
  boom:     [1, 2, 0.06, 0, (v, s) => { const d = 0.25 + s / 80; hiss(v, 'lowpass', 400 + s * 20, 120, 0.7, d, 0.7); if (s > 28) tone(v, 'sine', 60, 30, d, 0.8); }],
  step:     [0, 1, 0.25, 0, v => { tone(v, 'sine', 55, 35, 0.16, 0.7); hiss(v, 'lowpass', 220, 150, 0.7, 0.1, 0.3); }],
  collapse: [2, 1, 0.3, 0, v => { hiss(v, 'lowpass', 320, 90, 0.7, 1.2, 0.8); tone(v, 'sine', 45, 25, 1, 0.8); }],
  hqgun:    [1, 1, 0.2, 0, v => { const o = tone(v, 'sawtooth', 220, 60, 0.28, 0.25); tone(v, 'sine', 90, 40, 0.2, 0.6); return o; }],
  built:    [2, 1, 0.3, 1, v => { tone(v, 'triangle', 660, 660, 0.12, 0.5); tone(v, 'triangle', 990, 990, 0.16, 0.5, 0.1); }],
  upgrade:  [2, 1, 0.3, 1, v => { [523, 659, 784].forEach((f, i) => tone(v, 'triangle', f, f, 0.14, 0.45, i * 0.09)); }],
  trained:  [2, 1, 0.25, 1, v => tone(v, 'sine', 880, 880, 0.07, 0.3)],
  node:     [2, 1, 0.5, 1, v => { tone(v, 'triangle', 523, 523, 0.45, 0.35); tone(v, 'triangle', 784, 784, 0.45, 0.3, 0.05); }],
  alarm:    [2, 1, 1, 1, v => { [700, 520, 700, 520].forEach((f, i) => tone(v, 'triangle', f, f, 0.13, 0.4, i * 0.15)); }],
  ping:     [2, 1, 1, 1, v => { tone(v, 'sine', 1200, 1200, 0.35, 0.3); tone(v, 'sine', 1200, 1200, 0.25, 0.12, 0.18); }],
  victory:  [2, 1, 2, 1, v => { [523, 659, 784, 1047].forEach((f, i) => tone(v, 'triangle', f, f, i === 3 ? 0.6 : 0.16, 0.5, i * 0.14)); }],
  shieldUp: [1, 1, 0.5, 0, v => { tone(v, 'sine', 300, 900, 0.35, 0.3); tone(v, 'triangle', 600, 1200, 0.3, 0.12, 0.05); }],
  pulse:    [1, 1, 0.5, 0, v => { [392, 523, 659].forEach((f, i) => tone(v, 'sine', f, f * 1.01, 0.6, 0.22, i * 0.06)); }],
  uplink:   [2, 1, 1, 1, v => { tone(v, 'square', 220, 880, 0.5, 0.08); tone(v, 'sine', 440, 1760, 0.5, 0.15, 0.05); }],
  siren:    [2, 1, 1.5, 1, v => { tone(v, 'sawtooth', 600, 900, 0.35, 0.12); tone(v, 'sawtooth', 900, 600, 0.35, 0.12, 0.35); tone(v, 'sawtooth', 600, 900, 0.35, 0.12, 0.7); }],
  orbital:  [2, 2, 0.3, 0, v => { hiss(v, 'highpass', 2500, 800, 0.7, 0.12, 0.6); tone(v, 'sine', 80, 26, 1.1, 1); hiss(v, 'lowpass', 900, 80, 0.7, 1.3, 0.9); }],
  rumble:   [2, 1, 3, 1, v => { hiss(v, 'lowpass', 160, 60, 0.7, 1.5, 0.9); tone(v, 'sine', 42, 30, 1.5, 0.7); }],
  shatter:  [1, 1, 0.6, 0, v => { hiss(v, 'highpass', 4200, 2200, 1.3, 0.5, 0.45); [1760, 1320, 990].forEach((f, i) => tone(v, 'triangle', f, f * 0.7, 0.25, 0.12, i * 0.07)); }], // a Phase Beacon bubble collapses (v2.34)
  meteor:   [1, 1, 0.7, 0, v => { hiss(v, 'bandpass', 2400, 500, 1.2, 0.35, 0.35); tone(v, 'sine', 70, 35, 0.35, 0.6, 0.3); }],
  defeat:   [2, 1, 2, 1, v => { [440, 349, 294, 220].forEach((f, i) => tone(v, 'triangle', f, f, i === 3 ? 0.7 : 0.22, 0.45, i * 0.2)); }],
  // Bloomhost (v2.36)
  acid:     [0, 2, 0.12, 0, v => { hiss(v, 'bandpass', 1100, 420, 2.2, 0.09, 0.55); tone(v, 'sine', 320, 140, 0.08, 0.3); }], // a wet spit
  bile:     [1, 2, 0.15, 0, v => { hiss(v, 'bandpass', 800, 260, 2, 0.16, 0.6); tone(v, 'sine', 210, 80, 0.14, 0.45); }],
  ruin:     [1, 2, 0.18, 0, v => { hiss(v, 'lowpass', 700, 180, 1.2, 0.22, 0.6); tone(v, 'sine', 140, 50, 0.2, 0.7); }],
  glob:     [1, 2, 0.2, 0, v => { hiss(v, 'bandpass', 600, 200, 2, 0.2, 0.55); tone(v, 'sine', 170, 60, 0.18, 0.55); }],
  crush:    [1, 1, 0.4, 0, v => { tone(v, 'sine', 90, 32, 0.4, 0.85); hiss(v, 'lowpass', 500, 120, 0.9, 0.35, 0.6); }], // a sac bursts
  lob:      [1, 2, 0.2, 0, v => { tone(v, 'sine', 120, 45, 0.22, 0.75); hiss(v, 'bandpass', 500, 200, 1.6, 0.18, 0.5); }], // an organic thump
  spine:    [0, 2, 0.1, 0, v => { chitter(v, 3200, 2, 0.03, 0.55); hiss(v, 'bandpass', 900, 500, 2, 0.05, 0.3); }],
  hqspine:  [1, 1, 0.2, 0, v => { chitter(v, 2900, 3, 0.035, 0.6); tone(v, 'sine', 130, 50, 0.22, 0.7); hiss(v, 'bandpass', 700, 250, 2, 0.15, 0.45); }],
  splat:    [0, 2, 0.1, 0, v => { hiss(v, 'bandpass', 700, 240, 2.4, 0.12, 0.6); tone(v, 'sine', 230, 90, 0.1, 0.35); }], // a wet squelch on impact
  claw:     [0, 2, 0.1, 0, v => chitter(v, 3600, 3, 0.025, 0.5)],
  talon:    [0, 2, 0.1, 0, v => chitter(v, 3400, 2, 0.03, 0.5)],
  needle:   [0, 2, 0.1, 0, v => chitter(v, 4200, 2, 0.022, 0.45)],
  rend:     [0, 2, 0.1, 0, v => { chitter(v, 3000, 2, 0.03, 0.45); hiss(v, 'bandpass', 900, 400, 2, 0.07, 0.4); }],
  slam:     [1, 2, 0.15, 0, v => { tone(v, 'sine', 95, 40, 0.18, 0.8); hiss(v, 'lowpass', 400, 150, 0.8, 0.12, 0.45); }],
  maul:     [1, 2, 0.12, 0, v => { tone(v, 'sine', 110, 45, 0.15, 0.7); hiss(v, 'bandpass', 700, 300, 1.6, 0.1, 0.45); }],
  gore:     [1, 2, 0.12, 0, v => { tone(v, 'sine', 100, 42, 0.16, 0.75); chitter(v, 2600, 2, 0.03, 0.35, 0.03); }],
  // Axiarchs (v2.36)
  bolt:     [0, 2, 0.1, 0, v => { tone(v, 'square', 1900, 420, 0.07, 0.18); tone(v, 'sine', 2600, 1200, 0.09, 0.3); }], // a zap
  phase:    [0, 2, 0.1, 0, v => { tone(v, 'sawtooth', 1400, 300, 0.08, 0.16); tone(v, 'sine', 900, 1800, 0.08, 0.25); }],
  prism:    [0, 2, 0.1, 0, v => { tone(v, 'sine', 3200, 1600, 0.06, 0.3); tone(v, 'triangle', 2400, 2400, 0.05, 0.15, 0.02); }],
  astral:   [1, 2, 0.2, 0, v => { tone(v, 'sine', 3400, 260, 0.3, 0.45); hiss(v, 'highpass', 4000, 2500, 0.8, 0.12, 0.3); tone(v, 'square', 600, 150, 0.12, 0.08); }],
  pulse:    [1, 2, 0.15, 0, v => { tone(v, 'sine', 620, 180, 0.2, 0.55); tone(v, 'triangle', 1240, 360, 0.12, 0.2); }], // the Bastion's pulse
  grav:     [1, 2, 0.15, 0, v => { hum(v, 'sine', 160, 0.22, 0.6, 22, 30); tone(v, 'sine', 900, 300, 0.1, 0.2); }],
  breaker:  [1, 2, 0.2, 0, v => { hum(v, 'sawtooth', 120, 0.25, 0.25, 18, 25); tone(v, 'sine', 240, 60, 0.25, 0.6); }],
  rift:     [1, 2, 0.2, 0, v => { tone(v, 'sine', 300, 90, 0.3, 0.6); hum(v, 'triangle', 600, 0.2, 0.2, 14, 60); }],
  void:     [1, 1, 0.3, 0, v => { hum(v, 'sine', 70, 0.45, 0.75, 6, 8); tone(v, 'triangle', 280, 140, 0.3, 0.2); }], // a deep hum
  sovereign:[1, 1, 0.4, 0, v => { hum(v, 'sine', 55, 0.6, 0.85, 5, 7); tone(v, 'sine', 1200, 300, 0.35, 0.25); }],
  storm:    [1, 2, 0.15, 0, v => { hiss(v, 'highpass', 5000, 3000, 1, 0.1, 0.4); tone(v, 'square', 1600, 500, 0.08, 0.15); }], // crackle
  lance:    [1, 2, 0.15, 0, v => { tone(v, 'sawtooth', 1200, 500, 0.12, 0.2); hum(v, 'sine', 440, 0.18, 0.35, 30, 20); }],
  horizon:  [1, 2, 0.25, 0, v => { tone(v, 'sawtooth', 900, 200, 0.25, 0.25); hum(v, 'sine', 220, 0.35, 0.5, 18, 15); }],
  hqbeam:   [1, 1, 0.2, 0, v => { hum(v, 'sawtooth', 110, 0.36, 0.3, 9, 6); tone(v, 'sine', 880, 1760, 0.2, 0.3); tone(v, 'sine', 1760, 600, 0.3, 0.25, 0.08); }], // the Axis lance: a hum and a zap
  blade:    [0, 2, 0.1, 0, v => { tone(v, 'sine', 2400, 900, 0.06, 0.3); hiss(v, 'highpass', 3500, 3500, 1, 0.04, 0.25); }],
  riftblade:[0, 2, 0.1, 0, v => { tone(v, 'triangle', 1800, 500, 0.08, 0.3); hum(v, 'sine', 500, 0.08, 0.2, 40, 60); }],
  parallax: [0, 2, 0.1, 0, v => { tone(v, 'sine', 500, 2400, 0.07, 0.3); tone(v, 'sine', 2400, 700, 0.07, 0.25, 0.06); }],
  phaseOut: [1, 1, 0.3, 0, v => { tone(v, 'sine', 1800, 300, 0.25, 0.3); hum(v, 'triangle', 700, 0.2, 0.15, 30, 200); }], // a Wraithwing phases out (v2.37)
  blink:    [0, 2, 0.2, 0, v => { tone(v, 'sine', 400, 2200, 0.1, 0.3); tone(v, 'sine', 2200, 900, 0.08, 0.2, 0.08); }],  // a Riftstalker steps away (v2.37)
  devour:   [0, 1, 0.3, 0, v => { hiss(v, 'bandpass', 500, 900, 2, 0.25, 0.4); tone(v, 'sine', 140, 220, 0.25, 0.4); }],  // a Worldrender feeds (v2.37)
  siegeLock:[1, 1, 0.3, 0, v => { hiss(v, 'highpass', 2500, 1200, 0.8, 0.35, 0.35); tone(v, 'square', 90, 60, 0.08, 0.3, 0.3); tone(v, 'sine', 60, 40, 0.25, 0.7, 0.32); }], // hydraulics and a clank (v2.37)
  shieldPing: [0, 1, 0.15, 0, v => { tone(v, 'sine', 1600, 1600, 0.12, 0.3); tone(v, 'sine', 2400, 2350, 0.1, 0.15, 0.02); }], // a shield takes a hit
};
const SFX_FAC = { // which sounds belong to which faction's weapons, for loudness matching (sndLevel)
  lastfist: ['rifle', 'gatling', 'hydra', 'flame', 'bomb', 'flak', 'rail', 'rocket', 'missile', 'cannon', 'siege', 'shell', 'hqgun'],
  bloomhost: ['devour', 'acid', 'bile', 'ruin', 'glob', 'crush', 'lob', 'spine', 'hqspine', 'splat', 'claw', 'talon', 'needle', 'rend', 'slam', 'maul', 'gore'],
  axiarchs: ['phaseOut', 'blink', 'bolt', 'phase', 'prism', 'astral', 'pulse', 'grav', 'breaker', 'rift', 'void', 'sovereign', 'storm', 'lance', 'horizon', 'hqbeam', 'blade', 'riftblade', 'parallax', 'shieldPing'],
};
// Loudness matching (v2.36): once the sounds are baked, each Bloomhost and Axiarch weapon sound gets a gain that brings its
// loudness (RMS) to the Last Fist average for its priority. Last Fist's own sounds are left as they were. Kept within
// 0.4-2.5× so a quiet click isn't blown up into a bang.
function sndLevel() {
  const rms = n => { const b = SND.bufs[n]; if (!b) return 0; const d = b.getChannelData(0); let q = 0; for (let i = 0; i < d.length; i++) q += d[i] * d[i]; return Math.sqrt(q / Math.max(1, d.length)); };
  const ref = {};
  for (const n of SFX_FAC.lastfist) { const r = rms(n), pr = SFX[n][0]; if (r > 0) (ref[pr] || (ref[pr] = [])).push(r); }
  for (const f of ['bloomhost', 'axiarchs']) for (const n of SFX_FAC[f]) {
    const r = rms(n), L = ref[SFX[n][0]] || ref[0]; if (!r || !L) continue;
    SND.gain[n] = clamp(L.reduce((a, b) => a + b, 0) / L.length / r, 0.4, 2.5);
  }
}
const SND_VOL = { 0: 0.22, 1: 0.32, 2: 0.4 };
// v2.36: with every faction's weapons now audible, weapon sounds (priorities 0 and 1) share a budget of starts per second
// (a token bucket), by effect quality level (low, medium, full): at full, about what v2.35 played per second in a full
// battle; a slow phone that steps its effects down also plays fewer weapon sounds
const SND_RATE = { per: [6, 11, 16], burst: 4 };
function sndPlay(name, x, size) {
  const r = SFX[name], ctx = SND.ctx;
  if (!r || !SND.on || !ctx || ctx.state !== 'running') return false;
  const [pri, cap, gap, global, fn] = r, now = ctx.currentTime;
  let vol = SND_VOL[pri] * (SND.gain[name] || 1), pan = 0; // v2.36: matched loudness (sndLevel)
  if (!global) { // position: pan across the screen, fade at the edges, silent off screen
    const off = (x - cam.x) / (V.cw / 2 / V.S || 1);
    if (Math.abs(off) > 1.15) return false;
    vol *= 1 - 0.6 * clamp((Math.abs(off) - 0.8) / 0.35, 0, 1); pan = clamp(off * 0.6, -0.8, 0.8);
  }
  if (pri < 2) { SND.tok = Math.min(SND_RATE.burst, SND.tok + (now - SND.tokT) * SND_RATE.per[VFX.q]); SND.tokT = now; }
  if (now - (SND.last[name] ?? -9) < gap || (SND.per[name] || 0) >= cap || SND.voices >= SND_ROOM[VFX.q][pri] || (pri < 2 && SND.tok < 1)) { SND.dropped++; return false; }
  if (pri < 2) SND.tok--;
  SND.last[name] = now; SND.per[name] = (SND.per[name] || 0) + 1; SND.voices++; SND.played++;
  const v = voice(ctx, now + 0.005, vol, pan), buf = SND.bufs[name === 'boom' ? `boom:${size < 20 ? 12 : size < 40 ? 30 : 50}` : name];
  if (buf) { // the usual path: play the baked buffer, a little detuned so repeats don't sound identical
    const src = ctx.createBufferSource(), rate = pri === 0 ? 0.94 + SND.rnd() * 0.12 : 0.97 + SND.rnd() * 0.06;
    src.buffer = buf; src.playbackRate.value = rate; src.connect(v.out); src.start(v.t);
    v.nodes.push(src); v.last = src; v.end = v.t + buf.duration / rate;
  } else fn(v, size || 0);
  SND.live += v.nodes.length;
  const done = () => { // every node of the voice is disconnected when it ends
    if (v.ended) return; v.ended = true;
    for (const n of v.nodes) { try { n.disconnect(); } catch (e) {} }
    SND.live -= v.nodes.length; SND.voices--; SND.per[name]--;
  };
  if (v.last) v.last.onended = done; else done();
  v.done = done; SND.live_v.push(v); // swept below in case 'ended' never arrives
  return true;
}

// Match history (v2.51, Phase 0 item 4): a compact summary of each finished match (statsSummary), newest last, at most
// HISTORY_MAX. Spectated AI-vs-AI matches and the tutorial are not recorded. Every access in try/catch: without storage
// nothing is remembered and nothing breaks.
const HISTORY_KEY = 'extinctionEvent.history', HISTORY_MAX = 50;
function loadHistory() { try { const a = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function saveHistory(g) {
  try {
    if (!g || !g.over || g.tut || g.auto || g.histSaved) return;
    g.histSaved = true;
    const sm = statsSummary(g, { at: Date.now() }); if (!sm) return;
    const a = loadHistory(); a.push(sm); while (a.length > HISTORY_MAX) a.shift();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(a));
  } catch (e) {}
}

