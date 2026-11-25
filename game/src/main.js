// Sizzle & Serve — boot and frame loop.
// A fixed 1280×800 kitchen, scaled to the window; the game runs on
// requestAnimationFrame and needs no network at all.

import { newGame } from './state.js';
import { tick } from './logic.js';
import { draw, W, H } from './render.js';
import { handleClick, handleKey } from './input.js';
import { makeAudio } from './audio.js';
import { shotState } from './shots.js';
import { TARGET_COINS } from './data.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 1) || 1;

// Seeded RNG for order spawns: the same shift plays the same way twice.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(seed);
const audio = makeAudio();

let state = shot ? shotState(shot, seed) : newGame(seed);
state.target = TARGET_COINS;
state.audio = audio;
state.sfx = (name) => audio.play(name);
state.start = () => {
  state = newGame(seed);
  state.target = TARGET_COINS;
  state.audio = audio;
  state.sfx = (name) => audio.play(name);
  state.start = startFn;
  state.restart = startFn;
  state.screen = 'playing';
  audio.unlock();
  audio.play('click');
};
const startFn = state.start;
state.restart = startFn;

function fit() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', fit);
fit();

canvas.addEventListener('click', (e) => handleClick(state, canvas, e.clientX, e.clientY));
window.addEventListener('keydown', (e) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
  handleKey(state, e.key);
});

let last = performance.now();
let announced = '';
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  tick(state, dt, rng);
  draw(ctx, state);
  // Keep screen readers in the loop without spamming them.
  const line = state.screen === 'playing'
    ? `Coins ${state.coins}, ${state.orders.length} orders waiting, ${Math.ceil(state.shiftLeft)} seconds left.`
    : state.screen === 'over'
      ? (state.won ? 'Shift complete, you won.' : 'Shift over.')
      : 'Sizzle and Serve title screen. Press Enter to start.';
  if (line !== announced) { statusEl.textContent = line; announced = line; }
  requestAnimationFrame(frame);
}

// A screenshot state renders once and stays put; a live game loops.
if (shot) {
  draw(ctx, state);
} else {
  requestAnimationFrame(frame);
}
