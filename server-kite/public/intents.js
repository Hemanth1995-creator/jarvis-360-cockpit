import { speak } from "./voice.js";
import { log } from "./audit.js";
import {
  openChart,
  shuffleData,
  toggleGlow,
  hasActiveSymbol,
} from "./chart.js";
import { recordTrade } from "./portfolio.js";

const HELP_TEXT = [
  "Quick actions: open chart, shuffle, toggle glow, chart trend, profit chance.",
  "Trading: live status <symbol>, paper buy <qty> <symbol>, paper sell <qty> <symbol>.",
  "Use the Portfolio tab to review positions.",
].join(" ");

function trendFromMock() {
  const v = Math.random();
  if (v > 0.66) return "Uptrend";
  if (v > 0.33) return "Sideways";
  return "Downtrend";
}

function mockLive(symbol) {
  const base = 1000 + Math.floor(Math.random() * 500);
  const chg = Math.random() * 4 - 2;
  return {
    price: +(base * (1 + chg / 100)).toFixed(2),
    changePct: chg.toFixed(2),
  };
}

export function helpText() {
  return HELP_TEXT;
}

export function handleIntent(raw) {
  const text = String(raw || "").trim();
  const t = text.toLowerCase();
  if (!t) return;

  // ----- Core UI -----
  if (/^open chart|^show chart|^display chart/.test(t)) {
    if (!hasActiveSymbol()) {
      speak("Please select a sector first.");
      return;
    }
    openChart();
    speak("Opening chart.");
    return;
  }
  if (/shuffle|random/.test(t)) {
    if (!hasActiveSymbol()) {
      speak("Please select a sector first.");
      return;
    }
    shuffleData();
    speak("Shuffling chart.");
    return;
  }
  if (/toggle glow|glow|neon/.test(t)) {
    toggleGlow();
    speak("Toggling glow.");
    return;
  }
  if (/help|what can you do|options/.test(t)) {
    speak(HELP_TEXT);
    return;
  }
  if (/clear log|clear logs/.test(t)) {
    document.getElementById("log").innerHTML = "";
    speak("Audit log cleared.");
    return;
  }
  if (/stop/.test(t)) {
    speak("Stopping listening.");
    return;
  }

  // ----- Trading (mock) -----
  const mLive = t.match(/live status\s+([a-z]+)/);
  if (mLive) {
    const sym = mLive[1].toUpperCase();
    const { price, changePct } = mockLive(sym);
    speak(`${sym} trading at ${price}, change ${changePct} percent.`);
    log("info", `Live ${sym}: ${price} (${changePct}%)`);
    return;
  }

  const mBuy = t.match(/paper buy\s+(\d+)\s+([a-z]+)/);
  if (mBuy) {
    const qty = parseInt(mBuy[1], 10);
    const sym = mBuy[2].toUpperCase();
    recordTrade(sym, qty, "buy");
    speak(`Paper buy order: ${qty} of ${sym}.`);
    log("info", `Paper BUY ${sym} x${qty}`);
    return;
  }

  const mSell = t.match(/paper sell\s+(\d+)\s+([a-z]+)/);
  if (mSell) {
    const qty = parseInt(mSell[1], 10);
    const sym = mSell[2].toUpperCase();
    recordTrade(sym, qty, "sell");
    speak(`Paper sell order: ${qty} of ${sym}.`);
    log("info", `Paper SELL ${sym} x${qty}`);
    return;
  }

  if (/chart trend|trend now|trend status/.test(t)) {
    if (!hasActiveSymbol()) {
      speak("Please select a sector first.");
      return;
    }
    const tr = trendFromMock();
    speak(`Current chart indicates ${tr}.`);
    log("info", `Trend: ${tr}`);
    return;
  }

  if (/profit chance|chance of profit|win chance/.test(t)) {
    if (!hasActiveSymbol()) {
      speak("Please select a sector first.");
      return;
    }
    const pct = (60 + Math.random() * 30).toFixed(0);
    speak(`Estimated profit chance is ${pct} percent.`);
    log("info", `Profit chance ~${pct}% (mock)`);
    return;
  }

  // ----- Fallback -----
  speak("I heard " + text);
}
