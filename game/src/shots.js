// Sizzle & Serve — deterministic states for screenshots.
// ?shot=start  → the title screen
// ?shot=play   → mid-shift: two tickets, food cooking, a dish mid-assembly,
//                the timer running and a plate ready to serve
// ?shot=end    → the shift-end screen after a win
// A fixed seed keeps the renders identical every time they are taken.

import { newGame, spawnOrder, serveOrder } from './state.js';
import { TARGET_COINS, RECIPES } from './data.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shotState(shot, seed) {
  const rng = mulberry32(seed || 1);
  const state = newGame(seed || 1);
  state.target = TARGET_COINS;

  if (shot === 'start') {
    state.screen = 'title';
    return state;
  }

  if (shot === 'end') {
    state.screen = 'over';
    state.coins = 132;
    state.served = 11;
    state.failed = 1;
    state.strikes = 1;
    state.bestCombo = 4;
    state.combo = 3;
    state.shiftLeft = 0;
    state.won = true;
    return state;
  }

  // play: a busy kitchen mid-shift
  state.screen = 'playing';
  state.time = 96;
  state.shiftLeft = 84;
  state.coins = 61;
  state.served = 5;
  state.combo = 2;
  state.bestCombo = 3;
  spawnOrder(state, rng);
  spawnOrder(state, rng);
  spawnOrder(state, rng);
  // The cover ticket is always the Sunny Burger, so the plate reads as a
  // dish mid-assembly (bun, patty, lettuce — one tomato short).
  state.orders[0].recipe = RECIPES[0];
  // one ticket nearly out of patience, for the rush
  state.orders[0].patience = 9;
  // grill: a patty almost done; fryer: fries done and waiting
  state.stations.grill.item = 'patty';
  state.stations.grill.progress = 0.8;
  state.stations.fryer.item = 'potato';
  state.stations.fryer.progress = 1;
  state.stations.fryer.done = true;
  // board: lettuce mid-chop
  state.stations.board.item = 'lettuce';
  state.stations.board.chops = 2;
  state.stations.board.chopsNeeded = 3;
  // plate: a burger mid-assembly, one tomato short of the first ticket
  const first = state.orders[0];
  state.plate = first.recipe.items.slice(0, first.recipe.items.length - 1);
  state.message = 'One more item and the Sunny Burger is ready to serve!';
  state.messageTimer = 30;
  state.selectedOrder = first.id;
  return state;
}

export { serveOrder };
