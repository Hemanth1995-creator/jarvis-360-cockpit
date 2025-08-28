import { log } from "./audit.js";
import { speak } from "./voice.js";
import { openChart, shuffleData } from "./chart.js";

let ioSocket = null;
let latestToken = null;
let lastSeries = [];

export async function kiteLogin() {
  const r = await fetch("http://localhost:5050/kite/login");
  const { url } = await r.json();
  const w = window.open(url, "kiteLogin", "width=600,height=700");
  const poll = setInterval(async () => {
    try {
      const s = await (await fetch("http://localhost:5050/kite/status")).json();
      if (s.loggedIn) {
        clearInterval(poll);
        w && w.close();
        log("info", `Kite connected as ${s.user} • PaperMode=${s.paperMode}`);
        speak("Market link established.");
        connectSocket();
      }
    } catch {}
  }, 1200);
}

async function connectSocket() {
  if (ioSocket) return;
  const { io } = await import(
    "https://cdn.socket.io/4.7.5/socket.io.esm.min.js"
  );
  ioSocket = io("http://localhost:5050", { transports: ["websocket"] });

  ioSocket.on("connect", () => log("info", "Market socket connected"));
  ioSocket.on("ticks", (ticks) => {
    // Basic demo: take first tick and push to chart series
    if (!ticks || !ticks.length) return;
    const t = ticks[0];
    // t.last_price available, but our chart is synthetic; for demo, refresh series periodically
    // Later: maintain rolling series from last_price
    if (Math.random() < 0.2) shuffleData();
  });
  ioSocket.on("paperOrder", (o) => {
    log("info", `Paper ${o.side.toUpperCase()} ${o.symbol} x${o.qty}`);
    speak(`Paper ${o.side} ${o.symbol} ${o.qty}`);
  });
}

export async function marketSearch(q) {
  const r = await fetch(
    `http://localhost:5050/kite/search/${encodeURIComponent(q)}`
  );
  return await r.json();
}

export async function placeOrder(symbol, qty, side) {
  const r = await fetch("http://localhost:5050/kite/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, qty, side }),
  });
  return await r.json();
}
