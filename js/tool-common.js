/* NoAtMark shared tool UI helpers — small utilities every tool page reuses. */
(function () {
  "use strict";

  /** Copy text to clipboard with a fallback. Resolves true on success. */
  function copyText(text) {
    if (!navigator.clipboard) return fallbackCopy(text);
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => fallbackCopy(text));
  }

  function fallbackCopy(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return Promise.resolve(true);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  /** Flash a button's label for 1.6s (e.g. "Copied!"). */
  function flash(btn, text) {
    const prev = btn.textContent;
    btn.textContent = text;
    setTimeout(() => (btn.textContent = prev), 1600);
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  window.NoAtMarkTool = { copyText, flash, esc };
})();
