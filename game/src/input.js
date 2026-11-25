// Sizzle & Serve — mouse and keyboard input.
// Clicks are hit-tested against the same layout rectangles render.js draws.

import { INGREDIENTS } from './data.js';
import { LAYOUT, W, H, crateRect, stationRect, ticketRect } from './render.js';
import { useStation, chop, addToPlate, trashPlate } from './logic.js';
import { plateMatches, serveOrder, failOrder } from './state.js';

const CRATE_IDS = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'potato', 'dough', 'sauce'];
const STATION_IDS = ['grill', 'fryer', 'board', 'oven'];

function inside(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function toGame(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * W,
    y: ((clientY - rect.top) / rect.height) * H,
  };
}

function pickIngredient(state, id) {
  if (state.held) return; // one thing in hand at a time
  state.held = id;
  state.heldPrepared = false;
  state.sfx && state.sfx('click');
}

function tryServe(state) {
  if (state.plate.length === 0) return;
  // Serve the first ticket whose recipe the plate matches, oldest first.
  const match = state.orders.find((o) => plateMatches(state, o.recipe));
  if (match) {
    state.sfx && state.sfx('serve');
    serveOrder(state, match);
  } else {
    const first = state.orders[0];
    if (first) {
      state.sfx && state.sfx('walkout');
      failOrder(state, first, 'wrong');
    }
  }
}

export function handleClick(state, canvas, clientX, clientY) {
  const { x, y } = toGame(canvas, clientX, clientY);
  state.audio && state.audio.unlock();

  if (inside(LAYOUT.muteBtn, x, y)) {
    state.muted = !state.muted;
    state.audio && state.audio.setMuted(state.muted);
    return;
  }

  if (state.screen === 'title') {
    if (inside(LAYOUT.startBtn, x, y)) state.start();
    return;
  }
  if (state.screen === 'over') {
    if (inside(LAYOUT.restartBtn, x, y)) state.restart();
    return;
  }

  // Tickets: click one to mark it, then Serve sends the plate to it.
  for (let i = 0; i < state.orders.length; i++) {
    if (inside(ticketRect(i), x, y)) {
      const order = state.orders[i];
      state.selectedOrder = order.id;
      if (state.plate.length > 0) {
        if (plateMatches(state, order.recipe)) {
          state.sfx && state.sfx('serve');
          serveOrder(state, order);
        } else {
          state.sfx && state.sfx('walkout');
          failOrder(state, order, 'wrong');
        }
      }
      return;
    }
  }

  // Ingredient crates.
  for (let i = 0; i < CRATE_IDS.length; i++) {
    if (inside(crateRect(i), x, y)) { pickIngredient(state, CRATE_IDS[i]); return; }
  }

  // Stations.
  for (let i = 0; i < STATION_IDS.length; i++) {
    if (inside(stationRect(i), x, y)) {
      const id = STATION_IDS[i];
      if (id === 'board' && state.stations.board.item && !state.stations.board.done) {
        chop(state);
      } else {
        useStation(state, id);
      }
      return;
    }
  }

  // Plate: add the held prepared item.
  if (inside(LAYOUT.plate, x, y)) { addToPlate(state); return; }

  // Serve / trash buttons.
  if (inside(LAYOUT.serveBtn, x, y)) { tryServe(state); return; }
  if (inside(LAYOUT.trashBtn, x, y)) { trashPlate(state); return; }
}

export function handleKey(state, key) {
  const k = key.toLowerCase();
  if (k === 'm') {
    state.muted = !state.muted;
    state.audio && state.audio.setMuted(state.muted);
    return;
  }
  if (state.screen === 'title' && (k === 'enter' || k === ' ')) { state.start(); return; }
  if (state.screen === 'over' && (k === 'enter' || k === ' ')) { state.restart(); return; }
  if (state.screen !== 'playing') return;

  if (k === ' ') { tryServe(state); return; }
  if (k === 't') { trashPlate(state); return; }
  if (k === 'c') { // chop with the keyboard too
    if (state.stations.board.item && !state.stations.board.done) chop(state);
    return;
  }
  const ing = Object.values(INGREDIENTS).find((v) => v.key === k);
  if (ing) {
    const id = Object.keys(INGREDIENTS).find((keyId) => INGREDIENTS[keyId] === ing);
    pickIngredient(state, id);
  }
}
