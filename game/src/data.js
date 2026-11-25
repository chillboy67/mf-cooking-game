// Sizzle & Serve — recipe and ingredient data.
// Every dish is an original invention for this game; no real-world brand or
// existing game's menu is copied here.

export const INGREDIENTS = {
  bun:     { name: 'Bun',      color: '#e8b06a', dark: '#b97f3a', key: '1', station: null },
  patty:   { name: 'Patty',    color: '#a85b4a', dark: '#7c3f31', key: '2', station: 'grill' },
  lettuce: { name: 'Lettuce',  color: '#7cc24a', dark: '#4d8a2a', key: '3', station: 'board' },
  tomato:  { name: 'Tomato',   color: '#e2483d', dark: '#a92c24', key: '4', station: 'board' },
  cheese:  { name: 'Cheese',   color: '#f7c948', dark: '#d9a41f', key: '5', station: null },
  potato:  { name: 'Potato',   color: '#f0d089', dark: '#c9a44e', key: '6', station: 'fryer' },
  dough:   { name: 'Dough',    color: '#f3e3c2', dark: '#cbb27f', key: '7', station: 'oven' },
  sauce:   { name: 'Sauce',    color: '#c0392b', dark: '#8e241a', key: '8', station: null },
};

// station: which station cooks it, cookSecs: time on the station, chops: chops
// needed on the board. cookedName is what the item is called once prepared.
export const PREP = {
  patty:   { station: 'grill', cookSecs: 4, cookedName: 'Grilled Patty' },
  potato:  { station: 'fryer', cookSecs: 5, cookedName: 'Crispy Fries' },
  lettuce: { station: 'board', chops: 3,  cookedName: 'Chopped Lettuce' },
  tomato:  { station: 'board', chops: 3,  cookedName: 'Chopped Tomato' },
  dough:   { station: 'oven',  cookSecs: 6, cookedName: 'Flatbread' },
};

// A recipe lists the prepared items a plate must hold, in any order.
export const RECIPES = [
  { id: 'burger', name: 'Sunny Burger', price: 14,
    items: ['bun', 'patty', 'lettuce', 'tomato'],
    blurb: 'The house classic.' },
  { id: 'melt', name: 'Cheesy Melt', price: 12,
    items: ['bun', 'patty', 'cheese'],
    blurb: 'Extra cheese, no questions.' },
  { id: 'salad', name: 'Garden Salad', price: 9,
    items: ['lettuce', 'tomato', 'cheese'],
    blurb: 'Light, crunchy, quick.' },
  { id: 'fries', name: 'Crispy Fries', price: 7,
    items: ['potato'],
    blurb: 'Golden and salty.' },
  { id: 'flatbread', name: 'Margherita Flatbread', price: 13,
    items: ['dough', 'sauce', 'cheese'],
    blurb: 'Oven-baked, tomato-bright.' },
];

export const STATIONS = {
  grill:  { name: 'Grill',  cookSecs: 4 },
  fryer:  { name: 'Fryer',  cookSecs: 5 },
  board:  { name: 'Chopping Board', chops: 3 },
  oven:   { name: 'Oven',   cookSecs: 6 },
};

export const SHIFT_SECONDS = 180;   // one shift lasts 3 minutes
export const TARGET_COINS = 120;    // reach this by the end of the shift to win
export const MAX_STRIKES = 3;       // three failed orders ends the shift early
export const ORDER_PATIENCE = 45;   // seconds before a ticket walks out
export const BURN_GRACE = 6;        // seconds after done before food burns
