/* ---------- Main loop ---------- */
let uiT = 0, saveT = 5;
// v2.43 (audit phase 7c, the speed check): a fixed timestep. Real time since the last frame (at most CATCH_UP seconds of it,
// so a stall or a hidden tab can't make the game spiral) goes into an accumulator, and the SIM steps SIM_STEP game
// seconds at a time until it has caught up. Before, each frame advanced the game by at most 50 ms of real time: below
// 20 frames a second the game ran slower than 1x (at 6 fps, a third of real time). The SIM itself is unchanged.
const SIM_STEP = TICK, CATCH_UP = 0.25; // v2.50: the SIM's own fixed tick (TICK); speed changes how many run per frame
let simAcc = 0;
