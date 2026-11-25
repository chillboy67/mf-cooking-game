// Sizzle & Serve — everything the player sees, drawn on one canvas.
// The kitchen is drawn, not photographed: every ingredient, station and
// ticket is a small canvas illustration made from shapes.

import { INGREDIENTS, PREP, RECIPES, TARGET_COINS, MAX_STRIKES } from './data.js';
import { cookedNameOf } from './logic.js';

export const W = 1280;
export const H = 800;

// Fixed layout; input.js hit-tests against these same rectangles.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  muteBtn: { x: 1212, y: 12, w: 52, h: 40 },
  tickets: { x: 20, y: 70, w: 1240, h: 120 },
  crates: { x: 20, y: 216, w: 300, h: 340 },
  stations: { x: 340, y: 216, w: 600, h: 340 },
  plate: { x: 960, y: 216, w: 300, h: 220 },
  serveBtn: { x: 990, y: 452, w: 240, h: 56 },
  trashBtn: { x: 990, y: 516, w: 240, h: 40 },
  message: { x: 20, y: 576, w: 1240, h: 40 },
  held: { x: 20, y: 628, w: 1240, h: 44 },
  help: { x: 20, y: 740, w: 1240, h: 48 },
  startBtn: { x: 490, y: 560, w: 300, h: 64 },
  restartBtn: { x: 490, y: 580, w: 300, h: 64 },
};

const CRATE_IDS = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'potato', 'dough', 'sauce'];
const STATION_IDS = ['grill', 'fryer', 'board', 'oven'];

export function crateRect(i) {
  const col = i % 2, row = Math.floor(i / 2);
  return { x: LAYOUT.crates.x + col * 150, y: LAYOUT.crates.y + row * 85, w: 142, h: 77 };
}

export function stationRect(i) {
  const col = i % 2, row = Math.floor(i / 2);
  return { x: LAYOUT.stations.x + col * 300, y: LAYOUT.stations.y + row * 170, w: 292, h: 162 };
}

export function ticketRect(i) {
  return { x: LAYOUT.tickets.x + i * 310, y: LAYOUT.tickets.y, w: 300, h: 128 };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// --- food illustrations -------------------------------------------------

export function drawIngredient(ctx, id, cx, cy, s, prepared) {
  ctx.save();
  ctx.translate(cx, cy);
  const u = s / 40; // unit scale
  ctx.lineWidth = 2 * u;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  switch (id) {
    case 'bun':
      ctx.fillStyle = '#e8b06a';
      ctx.beginPath(); ctx.arc(0, 2 * u, 17 * u, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f7d9a0';
      ctx.fillRect(-17 * u, 2 * u, 34 * u, 6 * u);
      ctx.fillStyle = '#fff3d6';
      for (const [sx, sy] of [[-8, -8], [0, -12], [8, -8]]) { ctx.beginPath(); ctx.arc(sx * u, sy * u, 1.6 * u, 0, 7); ctx.fill(); }
      break;
    case 'patty':
      ctx.fillStyle = prepared ? '#6e3b2c' : '#a85b4a';
      rr(ctx, -18 * u, -7 * u, 36 * u, 14 * u, 7 * u); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (const sx of [-10, 0, 10]) { ctx.beginPath(); ctx.arc(sx * u, 0, 2 * u, 0, 7); ctx.fill(); }
      break;
    case 'lettuce':
      ctx.fillStyle = '#7cc24a';
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const x = -18 * u + i * 6 * u, y = (i % 2 ? -6 : 4) * u;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineTo(18 * u, 10 * u); ctx.lineTo(-18 * u, 10 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    case 'tomato':
      ctx.fillStyle = '#e2483d';
      ctx.beginPath(); ctx.arc(0, 0, 15 * u, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f2827a';
      ctx.beginPath(); ctx.arc(0, 0, 8 * u, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd9d4';
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * 5 * u, Math.sin(a) * 5 * u, 1.6 * u, 0, 7); ctx.fill(); }
      break;
    case 'cheese':
      ctx.fillStyle = '#f7c948';
      ctx.beginPath(); ctx.moveTo(-17 * u, 8 * u); ctx.lineTo(17 * u, 8 * u); ctx.lineTo(0, -12 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d9a41f';
      for (const [sx, sy] of [[-6, 2], [5, 3], [0, -4]]) { ctx.beginPath(); ctx.arc(sx * u, sy * u, 1.8 * u, 0, 7); ctx.fill(); }
      break;
    case 'potato':
      ctx.fillStyle = '#f0d089';
      for (let i = -1; i <= 1; i++) {
        ctx.save(); ctx.translate(i * 11 * u, 0); ctx.rotate(i * 0.12);
        rr(ctx, -4 * u, -16 * u, 8 * u, 32 * u, 3 * u); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      ctx.fillStyle = '#d43d2a';
      rr(ctx, -20 * u, 12 * u, 40 * u, 10 * u, 4 * u); ctx.fill(); ctx.stroke();
      break;
    case 'dough':
      ctx.fillStyle = '#f3e3c2';
      ctx.beginPath(); ctx.arc(0, 0, 16 * u, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e0c48f';
      ctx.beginPath(); ctx.arc(0, 0, 10 * u, 0, 7); ctx.fill();
      break;
    case 'sauce':
      ctx.fillStyle = '#c0392b';
      ctx.beginPath(); ctx.arc(0, 2 * u, 13 * u, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8735f';
      ctx.beginPath(); ctx.arc(-4 * u, -2 * u, 5 * u, 0, 7); ctx.fill();
      break;
    default:
      ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(0, 0, 12 * u, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// --- screens ------------------------------------------------------------

function drawTopBar(ctx, state) {
  const b = LAYOUT.topBar;
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  text(ctx, '🍳 SIZZLE & SERVE', 20, 32, 24, '#ffd166');
  text(ctx, `Coins ${state.coins} / ${TARGET_COINS}`, 330, 32, 20, '#fff');
  const mm = Math.floor(state.shiftLeft / 60), ss = Math.floor(state.shiftLeft % 60);
  const timerColor = state.shiftLeft < 30 ? '#ff6b5e' : '#fff';
  text(ctx, `⏱ ${mm}:${String(ss).padStart(2, '0')}`, 560, 32, 20, timerColor);
  text(ctx, `Served ${state.served}`, 700, 32, 18, '#bfe3a8');
  text(ctx, `Combo x${state.combo}`, 830, 32, 18, '#ffd166');
  // strikes as little broken plates
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < state.strikes ? '#ff6b5e' : 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(990 + i * 30, 32, 10, 0, 7); ctx.fill();
    if (i < state.strikes) { ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(990 + i * 30 - 6, 26); ctx.lineTo(990 + i * 30 + 6, 38); ctx.stroke(); }
  }
  text(ctx, 'Strikes', 940, 12, 11, '#cbb', 'left');
  const m = LAYOUT.muteBtn;
  ctx.fillStyle = '#4a3a2a'; rr(ctx, m.x, m.y, m.w, m.h, 8); ctx.fill();
  text(ctx, state.muted ? '🔇' : '🔊', m.x + m.w / 2, m.y + m.h / 2 + 1, 20, '#fff', 'center');
}

function drawTicket(ctx, order, i, selected) {
  const r = ticketRect(i);
  const frac = Math.max(0, order.patience / order.maxPatience);
  const urgent = frac < 0.35;
  ctx.fillStyle = selected ? '#fff3c4' : '#fdf6e3';
  rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
  ctx.lineWidth = selected ? 3 : 1.5;
  ctx.strokeStyle = urgent ? '#e2483d' : '#c9a86a';
  ctx.stroke();
  text(ctx, `#${order.id}  ${order.recipe.name}`, r.x + 14, r.y + 22, 17, '#3a2a18');
  text(ctx, `$${order.recipe.price}  ·  ${order.recipe.blurb}`, r.x + 14, r.y + 44, 12, '#7a6a55');
  // required items as little pictures
  order.recipe.items.forEach((id, k) => {
    drawIngredient(ctx, id, r.x + 28 + k * 44, r.y + 82, 30, true);
  });
  // patience bar
  ctx.fillStyle = '#e8ddc8';
  rr(ctx, r.x + 14, r.y + 108, r.w - 28, 10, 5); ctx.fill();
  ctx.fillStyle = urgent ? '#e2483d' : frac < 0.6 ? '#f7c948' : '#7cc24a';
  if (frac > 0) { rr(ctx, r.x + 14, r.y + 108, (r.w - 28) * frac, 10, 5); ctx.fill(); }
}

function drawCrates(ctx, state) {
  text(ctx, 'INGREDIENTS — click to pick up (keys 1–8)', LAYOUT.crates.x, LAYOUT.crates.y - 12, 13, '#8a7a66');
  CRATE_IDS.forEach((id, i) => {
    const r = crateRect(i);
    const ing = INGREDIENTS[id];
    const heldHere = state.held === id && !state.heldPrepared;
    ctx.fillStyle = heldHere ? '#ffe9a8' : '#f3e9d2';
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.lineWidth = heldHere ? 3 : 1.5;
    ctx.strokeStyle = heldHere ? '#e8a13a' : '#c9b896';
    ctx.stroke();
    drawIngredient(ctx, id, r.x + 34, r.y + r.h / 2, 34, false);
    text(ctx, ing.name, r.x + 62, r.y + 24, 15, '#3a2a18');
    const prep = PREP[id];
    text(ctx, prep ? (prep.station === 'board' ? `Chop ×${prep.chops}` : `Cook ${prep.cookSecs}s`) : 'Ready to plate', r.x + 62, r.y + 48, 12, '#8a7a66');
    text(ctx, ing.key, r.x + r.w - 16, r.y + 16, 12, '#b09a7a', 'center');
  });
}

function drawStation(ctx, state, id, i) {
  const r = stationRect(i);
  const st = state.stations[id];
  const names = { grill: '🔥 Grill', fryer: '🍟 Fryer', board: '🔪 Chopping Board', oven: '♨️ Oven' };
  ctx.fillStyle = st.burnt ? '#5a2a22' : '#e9dfc9';
  rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = '#b09a7a'; ctx.stroke();
  text(ctx, names[id], r.x + 16, r.y + 22, 16, st.burnt ? '#ffb3a3' : '#3a2a18');
  const cx = r.x + r.w / 2, cy = r.y + 88;
  if (!st.item) {
    text(ctx, id === 'board' ? 'Click a chopped item here' : 'Empty — click with an ingredient', cx, cy, 13, '#9a8a72', 'center');
  } else if (st.burnt) {
    drawIngredient(ctx, st.item, cx, cy - 8, 40, true);
    text(ctx, 'BURNT! Click to bin it.', cx, r.y + 138, 14, '#ffb3a3', 'center');
  } else if (st.done) {
    drawIngredient(ctx, st.item, cx, cy - 8, 44, true);
    text(ctx, `${cookedNameOf(st.item)} — ready! Click to take.`, cx, r.y + 138, 14, '#2f7d32', 'center');
  } else if (id === 'board') {
    drawIngredient(ctx, st.item, cx, cy - 8, 40, false);
    text(ctx, `Chopping… ${st.chops}/${st.chopsNeeded} — click to chop!`, cx, r.y + 138, 14, '#7a5a1e', 'center');
    ctx.fillStyle = '#d9c9a8'; rr(ctx, r.x + 30, r.y + 118, r.w - 60, 8, 4); ctx.fill();
    ctx.fillStyle = '#e8a13a'; rr(ctx, r.x + 30, r.y + 118, (r.w - 60) * (st.chops / st.chopsNeeded), 8, 4); ctx.fill();
  } else {
    drawIngredient(ctx, st.item, cx, cy - 8, 40, false);
    const pct = Math.round(st.progress * 100);
    text(ctx, `Cooking… ${pct}%`, cx, r.y + 118, 14, '#7a5a1e', 'center');
    ctx.fillStyle = '#d9c9a8'; rr(ctx, r.x + 30, r.y + 138, r.w - 60, 10, 5); ctx.fill();
    ctx.fillStyle = '#e8735f'; rr(ctx, r.x + 30, r.y + 138, (r.w - 60) * st.progress, 10, 5); ctx.fill();
  }
}

function drawPlateArea(ctx, state) {
  const p = LAYOUT.plate;
  text(ctx, 'YOUR PLATE', p.x, p.y - 12, 13, '#8a7a66');
  ctx.fillStyle = '#fdf6e3';
  rr(ctx, p.x, p.y, p.w, p.h, 12); ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = '#c9b896'; ctx.stroke();
  // the plate itself
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + 118, 110, 62, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#d9c9a8'; ctx.lineWidth = 3; ctx.stroke();
  if (state.plate.length === 0) {
    text(ctx, 'Empty plate — add cooked items', p.x + p.w / 2, p.y + 118, 13, '#9a8a72', 'center');
  } else {
    // stack the plated items so the dish reads mid-assembly
    state.plate.forEach((id, k) => {
      drawIngredient(ctx, id, p.x + p.w / 2, p.y + 118 - state.plate.length * 4 + k * 9, 40, true);
    });
    text(ctx, state.plate.map((id) => cookedNameOf(id)).join(' + '), p.x + p.w / 2, p.y + 196, 12, '#3a2a18', 'center');
  }
  const s = LAYOUT.serveBtn;
  const canServe = state.plate.length > 0;
  ctx.fillStyle = canServe ? '#4caf50' : '#b9b09a';
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  text(ctx, 'SERVE  (Space)', s.x + s.w / 2, s.y + s.h / 2, 20, '#fff', 'center');
  const t = LAYOUT.trashBtn;
  ctx.fillStyle = '#8a7a66'; rr(ctx, t.x, t.y, t.w, t.h, 10); ctx.fill();
  text(ctx, '🗑 Clear plate  (T)', t.x + t.w / 2, t.y + t.h / 2, 15, '#fff', 'center');
}

function drawBottom(ctx, state) {
  const m = LAYOUT.message;
  if (state.messageTimer > 0 && state.message) {
    ctx.fillStyle = 'rgba(43,33,24,0.9)';
    rr(ctx, m.x, m.y, m.w, m.h, 10); ctx.fill();
    text(ctx, state.message, m.x + 16, m.y + m.h / 2, 16, '#ffd166');
  }
  const h = LAYOUT.held;
  if (state.held) {
    const label = state.heldPrepared ? cookedNameOf(state.held) : INGREDIENTS[state.held].name;
    ctx.fillStyle = '#fff3c4';
    rr(ctx, h.x, h.y, 300, h.h, 10); ctx.fill();
    drawIngredient(ctx, state.held, h.x + 30, h.y + h.h / 2, 30, state.heldPrepared);
    text(ctx, `Holding: ${label}`, h.x + 56, h.y + h.h / 2, 15, '#3a2a18');
    text(ctx, state.heldPrepared ? 'Click the plate to add it.' : 'Click its station to cook it.', h.x + 320, h.y + h.h / 2, 14, '#8a7a66');
  } else {
    text(ctx, 'Nothing in hand — click an ingredient crate to start.', h.x, h.y + h.h / 2, 15, '#8a7a66');
  }
  const help = LAYOUT.help;
  ctx.fillStyle = '#efe6d2';
  rr(ctx, help.x, help.y, help.w, help.h, 10); ctx.fill();
  text(ctx, 'How to play:  1) Click an ingredient   2) Cook it on its station (chop on the board)   3) Add it to the plate   4) Serve the matching ticket before its patience runs out!',
    help.x + 14, help.y + help.h / 2, 14, '#5a4a38');
}

function drawTitle(ctx, state) {
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 0, W, H);
  // warm kitchen glow
  const g = ctx.createRadialGradient(W / 2, 260, 40, W / 2, 260, 520);
  g.addColorStop(0, 'rgba(255, 190, 90, 0.35)');
  g.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  text(ctx, '🍳', W / 2, 150, 90, '#fff', 'center');
  text(ctx, 'SIZZLE & SERVE', W / 2, 260, 64, '#ffd166', 'center');
  text(ctx, 'A tiny kitchen, a big rush. Cook to order, serve before the patience runs out.', W / 2, 320, 20, '#f3e9d2', 'center');
  text(ctx, `One ${180 / 60}-minute shift · reach ${TARGET_COINS} coins to win · ${MAX_STRIKES} strikes and the kitchen closes.`, W / 2, 352, 17, '#cbb894', 'center');
  // menu preview
  const x0 = W / 2 - 300;
  RECIPES.forEach((r, i) => {
    const y = 400 + i * 30;
    text(ctx, `${r.name} — $${r.price}`, x0, y, 16, '#fff');
    text(ctx, r.items.map((id) => INGREDIENTS[id].name).join(' + '), x0 + 300, y, 14, '#cbb894');
  });
  const b = LAYOUT.startBtn;
  ctx.fillStyle = '#4caf50'; rr(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill();
  text(ctx, 'START SHIFT  (Enter)', b.x + b.w / 2, b.y + b.h / 2, 24, '#fff', 'center');
  text(ctx, 'Mouse to cook · keys 1–8 grab ingredients · Space serves · T clears the plate · M mutes', W / 2, 660, 15, '#cbb894', 'center');
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(20,14,8,0.82)';
  ctx.fillRect(0, 0, W, H);
  const won = state.won;
  text(ctx, won ? '🎉 SHIFT COMPLETE!' : '💔 SHIFT OVER', W / 2, 220, 56, won ? '#ffd166' : '#ff8a7a', 'center');
  text(ctx, won
    ? `You served ${state.served} dishes and banked ${state.coins} coins — the crowd goes wild!`
    : state.strikes >= 3
      ? `Three strikes — the kitchen closed early with ${state.coins} coins.`
      : `Time! You banked ${state.coins} coins, short of the ${TARGET_COINS} target.`,
    W / 2, 300, 20, '#f3e9d2', 'center');
  text(ctx, `Dishes served: ${state.served}   ·   Failed orders: ${state.failed}   ·   Best combo: x${state.bestCombo}`, W / 2, 360, 18, '#cbb894', 'center');
  const b = LAYOUT.restartBtn;
  ctx.fillStyle = '#4caf50'; rr(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill();
  text(ctx, 'PLAY AGAIN  (Enter)', b.x + b.w / 2, b.y + b.h / 2, 22, '#fff', 'center');
}

export function draw(ctx, state) {
  // kitchen backdrop
  ctx.fillStyle = '#f7efdd';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e8dcc0';
  ctx.fillRect(0, 64, W, 4);
  if (state.screen === 'title') { drawTitle(ctx, state); return; }
  drawTopBar(ctx, state);
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — the first ticket is coming…', LAYOUT.tickets.x, LAYOUT.tickets.y + 60, 16, '#9a8a72');
  }
  state.orders.forEach((o, i) => drawTicket(ctx, o, i, state.selectedOrder === o.id));
  drawCrates(ctx, state);
  STATION_IDS.forEach((id, i) => drawStation(ctx, state, id, i));
  drawPlateArea(ctx, state);
  drawBottom(ctx, state);
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 209, 102, ${Math.min(0.25, state.flash)})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.screen === 'over') drawOver(ctx, state);
}
