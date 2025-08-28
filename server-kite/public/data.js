import { log } from "./audit.js";

const BASE = "http://localhost:5001";

export async function getOHLC(symbol) {
  const url = `${BASE}/api/ohlc?symbol=${encodeURIComponent(
    symbol
  )}&interval=day`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`OHLC ${r.status}`);
  const j = await r.json();
  log("info", `OHLC via ${j.provider}${j.note ? " • " + j.note : ""}`);
  return j;
}

export async function getTop5(cap) {
  const url = `${BASE}/api/top5?cap=${encodeURIComponent(cap)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Top5 ${r.status}`);
  const j = await r.json();
  log("info", `Top5(${cap}) via ${j.provider}${j.note ? " • " + j.note : ""}`);
  return j.items || [];
}

export async function getQuote(symbols) {
  const url = `${BASE}/api/quote?symbols=${encodeURIComponent(
    symbols.join(",")
  )}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Quote ${r.status}`);
  const j = await r.json();
  log("info", `Quote via ${j.provider}${j.note ? " • " + j.note : ""}`);
  return j.data || {};
}
