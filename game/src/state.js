// Sizzle & Serve — game state: orders, plate, score, shift clock.
// Pure data plus the small rules that mutate it; rendering lives in render.js.

import { RECIPES, ORDER_PATIENCE, SHIFT_SECONDS, TARGET_COINS, MAX_STRIKES } from './data.js';

let nextOrderId = 1;

export function newGame(seed) {
  return {
    seed,
    screen: 'title', // title | playing | over
    time: 0,         // seconds since the shift started
    shiftLeft: SHIFT_SECONDS,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    failed: 0,
    strikes: 0,
    orders: [],      // { id, recipe, patience, maxPatience, born }
    plate: [],       // prepared item ids currently on the plate
    held: null,      // raw ingredient id in hand, or a prepared item id
    heldPrepared: false,
    stations: {
      grill: { item: null, progress: 0, done: false, burnt: false, burnTimer: 0 },
      fryer: { item: null, progress: 0, done: false, burnt: false, burnTimer: 0 },
      board: { item: null, chops: 0, chopsNeeded: 0, done: false },
      oven:  { item: null, progress: 0, done: false, burnt: false, burnTimer: 0 },
    },
    spawnTimer: 2.5,
    message: '',
    messageTimer: 0,
    won: false,
    muted: false,
    flash: 0,        // screen flash timer for feedback
  };
}

export function pickRecipe(rng, elapsed) {
  // Early on only the simple dishes appear; the full menu unlocks as the
  // shift heats up, so the player learns one station at a time.
  const pool = elapsed < 30 ? RECIPES.slice(0, 3)
    : elapsed < 75 ? RECIPES.slice(0, 4)
    : RECIPES;
  return pool[Math.floor(rng() * pool.length)];
}

export function spawnOrder(state, rng) {
  const recipe = pickRecipe(rng, state.time);
  state.orders.push({
    id: nextOrderId++,
    recipe,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
  });
  if (state.orders.length > 4) state.orders.shift();
}

export function spawnInterval(elapsed) {
  // Orders arrive faster as the shift goes on: the rush builds.
  if (elapsed < 30) return 14;
  if (elapsed < 75) return 11;
  if (elapsed < 120) return 9;
  return 7.5;
}

export function plateMatches(state, recipe) {
  if (state.plate.length !== recipe.items.length) return false;
  const have = [...state.plate].sort().join(',');
  const want = [...recipe.items].sort().join(',');
  return have === want;
}

export function serveOrder(state, order) {
  const tip = Math.round((order.patience / order.maxPatience) * 6);
  const comboBonus = state.combo >= 2 ? 2 : 0;
  const earned = order.recipe.price + tip + comboBonus;
  state.coins += earned;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.plate = [];
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.message = `Served ${order.recipe.name}! +${earned} coins${comboBonus ? ' (combo!)' : ''}`;
  state.messageTimer = 2.2;
  state.flash = 0.25;
  return earned;
}

export function failOrder(state, order, reason) {
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.failed += 1;
  state.strikes += 1;
  state.combo = 0;
  state.message = reason === 'walked'
    ? `A customer walked out — ${order.recipe.name} was too slow!`
    : `Wrong dish sent back!`;
  state.messageTimer = 2.5;
  state.flash = 0.4;
}

export function endShift(state) {
  state.screen = 'over';
  state.won = state.coins >= TARGET_COINS && state.strikes < MAX_STRIKES;
}

export function shiftStatus(state) {
  if (state.strikes >= MAX_STRIKES) return 'closed';
  if (state.shiftLeft <= 0) return 'time';
  return 'playing';
}

export { TARGET_COINS, MAX_STRIKES, SHIFT_SECONDS };
