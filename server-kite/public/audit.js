import { $ } from "./utils.js";

const logEl = $("#log");
const rows = [];

export function log(level, msg) {
  const row = document.createElement("div");
  row.className = "row";
  const badge = document.createElement("span");
  badge.className = `badge ${level}`;
  badge.textContent = level.toUpperCase();
  const text = document.createElement("span");
  const ts = new Date().toLocaleTimeString();
  text.textContent = ` ${msg} • ${ts}`;
  row.appendChild(badge);
  row.appendChild(text);
  logEl.appendChild(row);
  rows.push(`[${ts}] ${level.toUpperCase()} ${msg}`);
  logEl.scrollTop = logEl.scrollHeight;
}

export function clearLog() {
  logEl.innerHTML = "";
}

export function exportLog() {
  const blob = new Blob([rows.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jarvis_audit_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
