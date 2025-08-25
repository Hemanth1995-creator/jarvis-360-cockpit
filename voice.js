// voice.js

if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
  alert("Speech recognition is not supported in this browser.");
}

let isListening = false;

window.SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = false;
recognition.lang = "en-IN";

// Start voice recognition
document.getElementById("voiceBtn").addEventListener("click", () => {
  if (!isListening) {
    recognition.start();
    isListening = true;
  }
});

// Handle voice result
recognition.addEventListener("result", (e) => {
  const transcript = Array.from(e.results)
    .map((result) => result[0].transcript)
    .join("")
    .toLowerCase()
    .trim();

  console.log("Voice command:", transcript);
  speak(`You said: ${transcript}`);

  // Command parsing
  if (transcript.includes("auto-pilot")) {
    isAutoPilot = true;
    document.getElementById("modeToggle").textContent = "Auto-Pilot Mode";
    speak("Auto-Pilot mode activated.");
  } else if (transcript.includes("manual")) {
    isAutoPilot = false;
    document.getElementById("modeToggle").textContent = "Manual Mode";
    speak("Manual mode activated.");
  } else if (transcript.includes("activate weekend mode")) {
    speak("Weekend mode activated. Let’s celebrate your profits!");
    triggerCelebration();
  } else {
    speak("Command not recognized. Please try again.");
  }
});

// Reset listening flag when recognition ends
recognition.addEventListener("end", () => {
  isListening = false;
});

// Celebration animation
function triggerCelebration() {
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.animationDuration = `${Math.random() * 2 + 1}s`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3000);
  }
}

// Stop voice recognition
document.getElementById("stopVoiceBtn").addEventListener("click", () => {
  recognition.stop();
  speechSynthesis.cancel();
  isListening = false;
});
