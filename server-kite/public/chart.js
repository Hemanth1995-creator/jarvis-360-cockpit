import { log } from "./audit.js";

const canvas = document.getElementById("radar");
const ctx = canvas.getContext("2d");

// ---------- responsive canvas ----------
function fitCanvas() {
  const wrap = canvas.parentElement;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cssW = wrap.clientWidth;
  const cssH = Math.max(360, Math.round(cssW * 0.6));
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function dpr() {
  return Math.max(1, window.devicePixelRatio || 1);
}
const ro = new ResizeObserver(() => fitCanvas());
ro.observe(canvas.parentElement);
window.addEventListener("orientationchange", fitCanvas);
fitCanvas();

// ---------- state ----------
let mode = "radar"; // start with reactor only; chart appears after symbol selection
let glow = true;
let t = 0;
let series = [];
let activeSymbol = null; // NO symbol initially

// ---------- data ----------
function genSeries(n = 220) {
  const out = [];
  let y = 100 + Math.random() * 20;
  for (let i = 0; i < n; i++) {
    y += Math.sin(i / 10) * 0.6 + (Math.random() * 2 - 1) * 0.8;
    out.push(Math.max(1, y));
  }
  return out;
}

// ---------- arc reactor (transparent, cinematic) ----------
function drawArcReactor(alphaMul = 1) {
  const W = canvas.parentElement.clientWidth;
  const H = Math.max(360, Math.round(W * 0.6));
  const cx = W / 2,
    cy = H / 2;

  // soft main halo
  let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.45);
  g.addColorStop(0, `rgba(103,209,255,${0.1 * alphaMul})`);
  g.addColorStop(1, "rgba(103,209,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(W, H) * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // inner core pulse
  const coreR = 56 + Math.sin(t / 12) * 6;
  g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2);
  g.addColorStop(0, `rgba(120,230,255,${0.4 * alphaMul})`);
  g.addColorStop(1, "rgba(120,230,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  // thin rings
  ctx.lineWidth = 1;
  ctx.strokeStyle = `rgba(103,209,255,${0.28 * alphaMul})`;
  [0.18, 0.3, 0.42].forEach((rf) => {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(W, H) * rf, 0, Math.PI * 2);
    ctx.stroke();
  });

  // rotating spokes
  const spokes = 6;
  const ang = (t / 40) % (Math.PI * 2);
  ctx.strokeStyle = `rgba(103,209,255,${0.12 * alphaMul})`;
  for (let i = 0; i < spokes; i++) {
    const a = ang + i * ((Math.PI * 2) / spokes);
    const r1 = Math.min(W, H) * 0.12;
    const r2 = Math.min(W, H) * 0.44;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }
}

// ---------- radar (idle mode) ----------
function drawRadar() {
  const W = canvas.width,
    H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  drawArcReactor(glow ? 0.9 : 0.5);
}

// ---------- price chart (with transparent reactor underlay) ----------
function drawPriceChart() {
  const W = canvas.parentElement.clientWidth;
  const H = Math.max(360, Math.round(W * 0.6));
  ctx.clearRect(0, 0, W, H);

  // reactor underlay (soft)
  drawArcReactor(glow ? 0.4 : 0.18);

  // axes
  ctx.strokeStyle = "rgba(29,44,69,.85)";
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 20, W - 60, H - 60);

  if (!series.length) series = genSeries(220);

  const min = Math.min(...series);
  const max = Math.max(...series);
  const X = (i) => 40 + i * ((W - 60) / (series.length - 1));
  const Y = (v) => 20 + (max - v) * ((H - 60) / Math.max(1, max - min));

  // gridlines
  ctx.strokeStyle = "rgba(29,44,69,.45)";
  ctx.beginPath();
  for (let g = 0; g <= 4; g++) {
    const y = 20 + g * ((H - 60) / 4);
    ctx.moveTo(40, y);
    ctx.lineTo(W - 20, y);
  }
  ctx.stroke();

  // symbol label
  ctx.fillStyle = "#9db7d8";
  ctx.font = "12px system-ui,Segoe UI,Roboto";
  ctx.fillText(`Symbol: ${activeSymbol}`, 48, 36);

  // line
  ctx.lineWidth = 2;
  ctx.shadowBlur = glow ? 14 : 0;
  ctx.shadowColor = "rgba(103,209,255,.65)";
  const grad = ctx.createLinearGradient(0, 20, 0, H - 40);
  grad.addColorStop(0, "#67d1ff");
  grad.addColorStop(1, "#1b8cff");
  ctx.strokeStyle = grad;

  ctx.beginPath();
  series.forEach((v, i) =>
    i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))
  );
  ctx.stroke();

  // fill
  const fill = ctx.createLinearGradient(0, 20, 0, H - 40);
  fill.addColorStop(0, "rgba(27,140,255,.15)");
  fill.addColorStop(1, "rgba(27,140,255,0)");
  ctx.lineTo(X(series.length - 1), H - 40);
  ctx.lineTo(40, H - 40);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// ---------- public API ----------
export function drawLoop() {
  fitCanvas();
  if (mode === "radar") drawRadar();
  else drawPriceChart();
  t += 1.6;
  requestAnimationFrame(drawLoop);
}
export function openChart(symbol) {
  const sym = (symbol || activeSymbol || "").toUpperCase();
  if (!sym) {
    log("warn", "No symbol selected. Chart remains hidden.");
    return false;
  }
  activeSymbol = sym;
  if (!series.length) series = genSeries(220);
  mode = "price";
  log("info", `Opening chart for ${activeSymbol}`);
  return true;
}
export function toggleGlow() {
  glow = !glow;
  log("info", `Glow ${glow ? "enabled" : "disabled"}`);
}
export function shuffleData() {
  if (!activeSymbol) {
    log("warn", "Select a sector first.");
    return;
  }
  if (mode !== "price") mode = "price";
  series = genSeries(220);
  log("info", "Chart refreshed");
}
export function setActiveSymbol(sym) {
  activeSymbol = (sym || "").toUpperCase() || null;
}
export function hasActiveSymbol() {
  return !!activeSymbol;
}
export function getActiveSymbol() {
  return activeSymbol;
}
