// app.js

let isAutoPilot = false;

window.onload = function () {
  // Line 1: DOM references
  const modeToggle = document.getElementById("modeToggle");
  const voiceBtn = document.getElementById("voiceBtn");
  const stopVoiceBtn = document.getElementById("stopVoiceBtn");

  // Line 2: Load config values
  const {
    defaultStock,
    defaultTradeAmount,
    voiceRate,
    voicePitch,
    voiceVolume,
  } = config;

  // Line 3: Mode toggle logic
  modeToggle.addEventListener("click", () => {
    isAutoPilot = !isAutoPilot;
    modeToggle.textContent = isAutoPilot ? "Auto-Pilot Mode" : "Manual Mode";
    console.log(`Mode switched to: ${isAutoPilot ? "Auto-Pilot" : "Manual"}`);
  });

  // Line 4: Voice button logic
  voiceBtn.addEventListener("click", () => {
    speak("Voice command activated. Listening...");
  });

  // Line 5: Stop voice button logic
  stopVoiceBtn.addEventListener("click", () => {
    speechSynthesis.cancel();
  });

  // Line 6: Load audit tab
  loadAuditTab();

  // Line 7: Render default chart and simulate trade
  renderChart(defaultStock);
  executeTrade(defaultStock, defaultTradeAmount, "buy");

  // Line 8: Populate left panel with sector buttons
  document.getElementById("leftPanel").innerHTML = `
    <h2>Sectors</h2>
    <button onclick="renderChart('INFY')">INFY</button>
    <button onclick="renderChart('TCS')">TCS</button>
    <button onclick="renderChart('HDFC')">HDFC</button>
  `;
};

// Line 9: Speak function
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1; // ✅ Fixed here
  utterance.pitch = 1; // You can adjust as needed
  utterance.volume = 1; // Full volume
  speechSynthesis.speak(utterance);
}
