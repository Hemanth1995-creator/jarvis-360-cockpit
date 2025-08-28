import { $ } from "./utils.js";
import { log } from "./audit.js";

export let isListening = false;
export let isSpeaking = false;
export let autoModeEnabled = false;
export function setAutoMode(v) {
  autoModeEnabled = !!v;
}

const profileKey = "jarvis.pro.profile.v1";
export let profile = JSON.parse(localStorage.getItem(profileKey) || "{}");
profile.ttsLang ||= "en-IN";
profile.rate ||= 1;
profile.pitch ||= 1;
profile.volume ||= 1;
export function saveProfile() {
  localStorage.setItem(profileKey, JSON.stringify(profile));
}

// ------- Audio unlock & TTS queue -------
let audioUnlocked = false;
const ttsQueue = [];

function unlockAudioOnce() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    speechSynthesis.resume?.();
  } catch {}
  log("info", "Audio unlocked");
  while (ttsQueue.length) {
    _speakNow(ttsQueue.shift());
  }
  window.dispatchEvent(new Event("audio_unlocked"));
  window.removeEventListener("pointerdown", unlockAudioOnce);
  window.removeEventListener("keydown", unlockAudioOnce);
  window.removeEventListener("touchstart", unlockAudioOnce);
}
window.addEventListener("pointerdown", unlockAudioOnce);
window.addEventListener("keydown", unlockAudioOnce);
window.addEventListener("touchstart", unlockAudioOnce);

function pickVoiceFor(lang) {
  const vs = speechSynthesis.getVoices() || [];
  return (
    vs.find((v) => v.lang === lang) ||
    vs.find((v) => v.lang?.startsWith(lang.split("-")[0])) ||
    vs[0] ||
    null
  );
}
function _speakNow(text) {
  try {
    speechSynthesis.cancel();
  } catch {}
  const u = new SpeechSynthesisUtterance(text);
  u.lang = profile.ttsLang;
  u.voice = window.__voice || pickVoiceFor(u.lang);
  if (!u.voice) {
    u.lang = "en-US";
    u.voice = pickVoiceFor(u.lang);
  }
  window.__voice = u.voice;
  u.rate = profile.rate;
  u.pitch = profile.pitch;
  u.volume = profile.volume;

  isSpeaking = true;
  updateHUD();
  u.onend = () => {
    isSpeaking = false;
    updateHUD();
  };
  setTimeout(() => speechSynthesis.speak(u), 0);
  log("info", `TTS: "${text}"`);
}
export function speak(text) {
  if (!audioUnlocked) {
    log("warn", "Audio locked; queued TTS");
    ttsQueue.push(text);
    return;
  }
  _speakNow(text);
}

// Experimental browser ASR (optional)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null,
  asrActive = false,
  asrStarting = false;

export function safeStartASR() {
  if (!SR) {
    log("warn", "Browser ASR unavailable. Use Quick Actions or Manual.");
    return;
  }
  if (asrStarting || asrActive) {
    log("warn", "ASR already active");
    return;
  }
  recognition = new SR();
  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    asrStarting = false;
    asrActive = true;
    isListening = true;
    updateHUD();
    log("info", "ASR started");
  };
  recognition.onend = () => {
    asrActive = false;
    isListening = false;
    updateHUD();
    log("info", "ASR ended");
    if (autoModeEnabled) setTimeout(safeStartASR, 400);
  };
  recognition.onerror = (e) => {
    asrStarting = false;
    asrActive = false;
    isListening = false;
    updateHUD();
    log(e.error === "no-speech" ? "warn" : "err", "ASR error: " + e.error);
  };
  recognition.onresult = (e) => {
    let final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) final += r[0].transcript.trim() + " ";
    }
    final = final.trim();
    if (!final) return;
    log("info", `Heard: "${final}"`);
    window.__onFinal?.(final);
  };

  try {
    asrStarting = true;
    recognition.start();
    log("info", "ASR start requested");
  } catch (err) {
    asrStarting = false;
    log("warn", "ASR start blocked: " + (err.message || err));
  }
}

export function hardStopAll() {
  try {
    recognition && recognition.abort();
  } catch {}
  try {
    speechSynthesis.cancel();
  } catch {}
  isListening = false;
  isSpeaking = false;
  asrActive = false;
  asrStarting = false;
  updateHUD();
  log("info", "Stopped mic & speech");
}

export function applyLanguage(lang) {
  profile.ttsLang = lang;
  saveProfile();
  const msg = lang.startsWith("hi")
    ? "नमस्ते सर।"
    : lang.startsWith("ta")
    ? "வணக்கம் ஐயா."
    : lang.startsWith("te")
    ? "నమస్తే సర్."
    : "Hello, sir.";
  speak(msg);
  log("info", "Voice → " + (window.__voice?.name || "system") + " • " + lang);
}

export function updateHUD() {
  $("#asrState").textContent = isListening ? "listening" : "idle";
  $("#ttsState").textContent = isSpeaking ? "speaking" : "idle";
  $("#modeState").textContent = autoModeEnabled ? "auto" : "manual";
}

// prime voices
try {
  speechSynthesis.getVoices();
} catch {}
