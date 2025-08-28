import { log } from "./audit.js";
import { speak } from "./voice.js";

// Simple mock live price
function mockLive(symbol) {
  const base = 1000 + Math.floor(Math.random() * 500);
  const chg = Math.random() * 4 - 2; // +/- 2%
  const price = +(base * (1 + chg / 100)).toFixed(2);
  return price;
}

// Store
const storeKey = "jarvis.paper.v1";
function getStore() {
  return JSON.parse(localStorage.getItem(storeKey) || '{"positions":{}}');
}
function saveStore(s) {
  localStorage.setItem(storeKey, JSON.stringify(s));
}

// Public: record trade & recompute avg
export function recordTrade(sym, qty, side) {
  const symbol = sym.toUpperCase();
  const s = getStore();
  const pos = s.positions[symbol] || { qty: 0, avg: 0 };
  const px = mockLive(symbol);

  if (side === "buy") {
    const newQty = pos.qty + qty;
    const newAvg = newQty > 0 ? (pos.avg * pos.qty + px * qty) / newQty : 0;
    pos.qty = newQty;
    pos.avg = +newAvg.toFixed(2);
  } else {
    // sell
    pos.qty = Math.max(0, pos.qty - qty);
    // avg remains; if position closed, reset avg
    if (pos.qty === 0) pos.avg = 0;
  }

  s.positions[symbol] = pos;
  saveStore(s);
  dispatchPortfolioUpdated();
}

// Public: render portfolio table
export function renderPortfolio() {
  const tbody = document.getElementById("pfBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  const s = getStore();
  const symbols = Object.keys(s.positions).sort();
  if (!symbols.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No positions yet.";
    td.style.color = "#9db7d8";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  symbols.forEach((sym) => {
    const pos = s.positions[sym];
    const price = mockLive(sym);
    const pnlPct =
      pos.qty > 0 && pos.avg > 0 ? ((price - pos.avg) / pos.avg) * 100 : 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${sym}</td>
      <td>${pos.qty}</td>
      <td>${pos.avg ? pos.avg.toFixed(2) : "-"}</td>
      <td>${price.toFixed(2)}</td>
      <td class="${pnlPct >= 0 ? "pnlg" : "pnlr"}">${pnlPct.toFixed(2)}%</td>
    `;
    tbody.appendChild(tr);
  });
}

// Public: clear portfolio
export function clearPortfolio() {
  localStorage.setItem(storeKey, '{"positions":{}}');
  renderPortfolio();
  speak("Portfolio cleared.");
  log("info", "Portfolio cleared");
  dispatchPortfolioUpdated();
}

// Public: announce one random position P&L
export function announceOnePosition() {
  const s = getStore();
  const symbols = Object.keys(s.positions);
  if (!symbols.length) return;
  const sym = symbols[Math.floor(Math.random() * symbols.length)];
  const pos = s.positions[sym];
  if (pos.qty <= 0 || pos.avg <= 0) return;
  const price = mockLive(sym);
  const pnlPct = ((price - pos.avg) / pos.avg) * 100;
  const dir = pnlPct >= 0 ? "up" : "down";
  speak(`${sym} position is ${dir} ${Math.abs(pnlPct).toFixed(1)} percent.`);
  log("info", `${sym} P&L ${pnlPct.toFixed(2)}%`);
}

// Event bridge
function dispatchPortfolioUpdated() {
  window.dispatchEvent(new Event("portfolio_updated"));
}
