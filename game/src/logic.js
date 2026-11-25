// Sizzle & Serve — the cooking rules: stations tick, food burns, plates fill.
// Called once per frame from the main loop with the elapsed seconds.

import { PREP, BURN_GRACE, STATIONS } from './data.js';
import { spawnOrder, spawnInterval, failOrder, endShift, shiftStatus } from './state.js';

export function cookedNameOf(rawId) {
  if (PREP[rawId] && PREP[rawId].cookedName) return PREP[rawId].cookedName;
  // Items that need no prep keep their plain name, capitalised.
  return rawId ? rawId[0].toUpperCase() + rawId.slice(1) : rawId;
}

// Put a raw ingredient on its station, or pick a finished item back up.
// Returns a short note for the player, or null when nothing happened.
export function useStation(state, stationId) {
  const st = state.stations[stationId];
  const sfx = state.sfx;
  if (!st) return null;

  // Take a finished item off the station.
  if (st.done && !st.burnt) {
    state.held = st.item;
    state.heldPrepared = true;
    clearStation(st);
    sfx && sfx('pickup');
    return null;
  }
  // Burnt food goes in the bin, not on a plate.
  if (st.burnt) {
    clearStation(st);
    state.message = 'Burnt! Tossed in the bin.';
    state.messageTimer = 1.6;
    sfx && sfx('trash');
    return null;
  }
  if (st.item) return null; // station busy, wait for it

  // Place the held raw ingredient on its matching station.
  const held = state.held;
  if (!held || state.heldPrepared) return null;
  const prep = PREP[held];
  if (!prep || prep.station !== stationId) {
    state.message = `${heldName(held)} doesn't go on the ${STATIONS[stationId].name}.`;
    state.messageTimer = 1.6;
    return null;
  }
  st.item = held;
  st.progress = 0;
  st.done = false;
  st.burnt = false;
  st.burnTimer = 0;
  if (stationId === 'board') {
    st.chops = 0;
    st.chopsNeeded = prep.chops;
  }
  state.held = null;
  state.heldPrepared = false;
  sfx && sfx(stationId === 'board' ? 'chop' : 'sizzle');
  return null;
}

function heldName(id) {
  return id ? id[0].toUpperCase() + id.slice(1) : 'Nothing';
}

function clearStation(st) {
  st.item = null;
  st.progress = 0;
  st.done = false;
  st.burnt = false;
  st.burnTimer = 0;
  st.chops = 0;
  st.chopsNeeded = 0;
}

// One chop on the board. Returns true when the item is ready.
export function chop(state) {
  const st = state.stations.board;
  if (!st.item || st.done) return false;
  st.chops += 1;
  state.sfx && state.sfx('chop');
  if (st.chops >= st.chopsNeeded) {
    st.done = true;
    state.sfx && state.sfx('ding');
  }
  return st.done;
}

// Add the held prepared item to the plate.
export function addToPlate(state) {
  if (!state.held || !state.heldPrepared) return false;
  state.plate.push(state.held);
  state.held = null;
  state.heldPrepared = false;
  state.sfx && state.sfx('plate');
  return true;
}

// Empty the plate into the bin (a wrong mix can't be served).
export function trashPlate(state) {
  if (state.plate.length === 0 && !state.held) return;
  state.plate = [];
  state.held = null;
  state.heldPrepared = false;
  state.message = 'Plate cleared.';
  state.messageTimer = 1.2;
  state.sfx && state.sfx('trash');
}

export function tick(state, dt, rng) {
  if (state.screen !== 'playing') return;
  state.time += dt;
  state.shiftLeft = Math.max(0, state.shiftLeft - dt);
  if (state.messageTimer > 0) state.messageTimer -= dt;
  if (state.flash > 0) state.flash -= dt;

  // New orders arrive on a quickening schedule.
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 && state.orders.length < 4) {
    spawnOrder(state, rng);
    state.spawnTimer = spawnInterval(state.time);
  }

  // Patience drains; a ticket that hits zero walks out (a strike).
  for (const order of [...state.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) failOrder(state, order, 'walked');
  }

  // Stations cook; finished food burns if left sitting.
  for (const id of ['grill', 'fryer', 'oven']) {
    const st = state.stations[id];
    if (!st.item || st.done) {
      if (st.done && !st.burnt) {
        st.burnTimer += dt;
        if (st.burnTimer > BURN_GRACE) {
          st.burnt = true;
          state.message = `The ${cookedNameOf(st.item)} burnt on the ${STATIONS[id].name}!`;
          state.messageTimer = 2;
          state.sfx && state.sfx('burn');
        }
      }
      continue;
    }
    st.progress += dt / STATIONS[id].cookSecs;
    if (st.progress >= 1) {
      st.progress = 1;
      st.done = true;
      st.burnTimer = 0;
      state.sfx && state.sfx('ding');
    }
  }

  const status = shiftStatus(state);
  if (status !== 'playing') endShift(state);
}
