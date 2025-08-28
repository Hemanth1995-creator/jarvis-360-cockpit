export const $ = (s, r = document) => r.querySelector(s);

export function setStatus(txt) {
  const el = $("#modeState");
  if (el) el.textContent = txt;
}
