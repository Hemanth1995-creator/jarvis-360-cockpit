import { $, setStatus } from "./utils.js";
import { log } from "./audit.js";
import {
  drawLoop,
  openChart,
  shuffleData,
  toggleGlow,
  setActiveSymbol,
  hasActiveSymbol,
  getActiveSymbol,
} from "./chart.js";
import {
  applyLanguage,
  profile,
  safeStartASR,
  hardStopAll,
  updateHUD,
  setAutoMode,
  speak,
} from "./voice.js";
import { handleIntent } from "./intents.js";
import {
  renderPortfolio,
  clearPortfolio,
  announceOnePosition,
} from "./portfolio.js";

// ---- Greeting (after audio unlock) ----
function greeting() {
  const h = new Date().getHours();
  let part = "day";
  if (h < 5) part = "night";
  else if (h < 12) part = "morning";
  else if (h < 17) part = "afternoon";
  else if (h < 21) part = "evening";
  else part = "night";
  speak(`Hello, sir. Good ${part}.`);
}

// ---- Boot ----
drawLoop();
log("info", "Jarvis booted. Tap/press any key to unlock audio.");
updateHUD();
window.addEventListener("audio_unlocked", greeting, { once: true });

// ---- Language ----
const langSelect = $("#langSelect");
langSelect.value = profile.ttsLang || "en-IN";
langSelect.addEventListener("change", (e) => applyLanguage(e.target.value));
setTimeout(() => applyLanguage(langSelect.value), 400);

// ---- Tabs ----
const tabLog = $("#tabLog");
const tabPf = $("#tabPf");
const logView = $("#logView");
const pfView = $("#pfView");
function setTab(which) {
  const onLog = which === "log";
  tabLog.classList.toggle("active", onLog);
  tabPf.classList.toggle("active", !onLog);
  logView.hidden = !onLog;
  pfView.hidden = onLog;
  if (!onLog) renderPortfolio();
}
tabLog.addEventListener("click", () => setTab("log"));
tabPf.addEventListener("click", () => setTab("pf"));
setTab("log");

// Re-render portfolio on updates
window.addEventListener("portfolio_updated", renderPortfolio);

// ---- Sector / symbol state ----
let activeSymbol = null;
const activeEl = $("#activeSymbol");
const symInput = $("#symInput");
if (activeEl) activeEl.textContent = "—";
if (symInput) symInput.value = "";

// Sector chips click → set symbol + open chart immediately
document.querySelectorAll(".sector-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeSymbol = btn.dataset.sym;
    setActiveSymbol(activeSymbol);
    if (activeEl) activeEl.textContent = activeSymbol;
    if (symInput) symInput.value = activeSymbol;
    log("info", `Active symbol → ${activeSymbol} (chart opened)`);
    speak(`${activeSymbol} selected.`);
    openChart(activeSymbol);
  });
});

// Symbol input Enter → open chart (in Portfolio tab)
if (symInput) {
  symInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const sym = (symInput.value || "").toUpperCase();
      if (!sym) {
        speak("Please type a symbol or pick a sector.");
        return;
      }
      activeSymbol = sym;
      setActiveSymbol(sym);
      if (activeEl) activeEl.textContent = sym;
      log("info", `Active symbol → ${sym} (chart opened)`);
      speak(`${sym} selected.`);
      openChart(sym);
    }
  });
}

// ---- Quick Actions (route through intents for TTS) ----
$("#qaOpen").addEventListener("click", () => {
  const sym = (symInput?.value || activeSymbol || "").toUpperCase();
  if (!sym) {
    speak("Please select a sector first.");
    return;
  }
  handleIntent("open chart");
});
$("#qaShuffle").addEventListener("click", () => {
  const sym = (symInput?.value || activeSymbol || "").toUpperCase();
  if (!sym) {
    speak("Please select a sector first.");
    return;
  }
  handleIntent("shuffle");
});
$("#qaGlow").addEventListener("click", () => handleIntent("toggle glow"));
$("#qaTrend").addEventListener("click", () => {
  const sym = (symInput?.value || activeSymbol || "").toUpperCase();
  if (!sym) {
    speak("Please select a sector first.");
    return;
  }
  handleIntent("chart trend");
});
$("#qaProfit").addEventListener("click", () => {
  const sym = (symInput?.value || activeSymbol || "").toUpperCase();
  if (!sym) {
    speak("Please select a sector first.");
    return;
  }
  handleIntent("profit chance");
});
$("#qaHelp").addEventListener("click", () => handleIntent("help"));
$("#qaClear").addEventListener("click", () => {
  document.getElementById("log").innerHTML = "";
  speak("Audit log cleared.");
});
$("#qaSpeak").addEventListener("click", () => safeStartASR());
$("#qaStop").addEventListener("click", () => hardStopAll());

// ---- Portfolio actions ----
$("#btnLive")?.addEventListener("click", () => {
  const sym = (symInput.value || activeSymbol || "").toUpperCase();
  if (!sym) {
    speak("Please select a sector first.");
    return;
  }
  handleIntent(`live status ${sym}`);
});
$("#btnBuy")?.addEventListener("click", () => {
  const sym = (symInput.value || activeSymbol || "").toUpperCase();
  if (!sym) {
    speak("Please select a sector first.");
    return;
  }
  const qty = Math.max(1, parseInt($("#qtyInput").value || "1", 10));
  handleIntent(`paper buy ${qty} ${sym}`);
});
$("#btnSell")?.addEventListener("click", () => {
  const sym = (symInput.value || activeSymbol || "").toUpperCase();
  if (!sym) {
    speak("Please select a sector first.");
    return;
  }
  const qty = Math.max(1, parseInt($("#qtyInput").value || "1", 10));
  handleIntent(`paper sell ${qty} ${sym}`);
});
$("#btnClearPf")?.addEventListener("click", () => clearPortfolio());

// ---- Manual transcript fallback ----
const manualText = $("#manualText");
const manualSend = $("#manualSend");
function sendManual() {
  const v = manualText.value.trim();
  if (!v) return;
  manualText.value = "";
  log("info", `Manual: "${v}"`);
  handleIntent(v);
}
manualSend?.addEventListener("click", sendManual);
manualText?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendManual();
});

// ---- Auto-Pilot: Stepper loop (includes P&L announce if positions exist) ----
let autoTimer = null;
let stepIdx = 0;
const steps = [
  () => {
    if (hasActiveSymbol()) {
      openChart(getActiveSymbol());
      speak("Opening chart.");
    } else {
      speak("Please select a sector first.");
    }
  },
  () => {
    if (hasActiveSymbol()) handleIntent("chart trend");
  },
  () => {
    if (hasActiveSymbol()) handleIntent("profit chance");
  },
  () => {
    if (hasActiveSymbol()) {
      const sym = getActiveSymbol();
      handleIntent(`live status ${sym}`);
    }
  },
  () => {
    if (hasActiveSymbol()) {
      shuffleData();
      speak("Refreshing data.");
    }
  },
  () => {
    announceOnePosition();
  },
];

function startAutoStepper(intervalMs = 6000) {
  if (autoTimer) return;
  stepIdx = 0;
  log("info", "Auto-Pilot engaged (stepper)");
  speak("Auto pilot engaged.");
  autoTimer = setInterval(() => {
    try {
      steps[stepIdx % steps.length]();
      stepIdx++;
    } catch (err) {
      console.error(err);
      log("err", "Auto step error: " + (err.message || err));
    }
  }, intervalMs);
}
function stopAuto() {
  if (!autoTimer) return;
  clearInterval(autoTimer);
  autoTimer = null;
  log("info", "Auto-Pilot disengaged");
  speak("Auto pilot disengaged.");
}

// ---- Mode buttons ----
$("#btnManual").addEventListener("click", () => {
  setAutoMode(false);
  stopAuto();
  updateHUD();
  log("info", "Manual mode");
});
$("#btnAuto").addEventListener("click", () => {
  setAutoMode(true);
  startAutoStepper(6000);
  updateHUD();
});

// ---- Shortcuts ----
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "m") {
    e.preventDefault();
    $("#qaSpeak").click();
  }
  if (e.ctrlKey && e.key === ".") {
    e.preventDefault();
    $("#qaStop").click();
  }
  if (e.ctrlKey && e.key === "/") {
    e.preventDefault();
    $("#qaHelp").click();
  }
  if (e.ctrlKey && e.key.toLowerCase() === "l") {
    e.preventDefault();
    $("#btnAuto").click();
  }
});

// ---- Safety: stop auto when hidden/unload ----
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopAuto();
});
window.addEventListener("beforeunload", () => stopAuto());

// ---- ASR final handler (if supported) ----
window.__onFinal = (finalText) => handleIntent(finalText);

// ---- Uptime ----
const appStart = Date.now();
setInterval(
  () =>
    ($("#uptime").textContent =
      Math.floor((Date.now() - appStart) / 1000) + "s"),
  1000
);
