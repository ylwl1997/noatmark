// NoAtMark content script — auto-clean on copy (opt-in) + context-menu handler.
// scan-core.js defines global.NoAtMarkExt before this runs.
(function () {
  "use strict";
  var ext = (typeof NoAtMarkExt !== "undefined") ? NoAtMarkExt : null;
  if (!ext) return;

  // Optional: auto-strip invisible characters from anything copied to clipboard.
  chrome.storage.sync.get({ autoClean: false }, function (cfg) {
    if (!cfg.autoClean) return;
    document.addEventListener("copy", function (e) {
      var sel = window.getSelection ? window.getSelection().toString() : "";
      if (!sel) return;
      var cleaned = ext.stripInvisible(sel);
      if (cleaned === sel) return;
      e.preventDefault();
      e.clipboardData.setData("text/plain", cleaned);
    });
  });

  // Handle the context-menu "Copy clean text" command.
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg && msg.type === "cleanSelection") {
      var sel = window.getSelection ? window.getSelection().toString() : "";
      var cleaned = ext.stripInvisible(sel);
      var count = sel.length - cleaned.length;
      navigator.clipboard.writeText(cleaned).then(function () {
        sendResponse({ ok: true, count: count });
      }, function () {
        sendResponse({ ok: false });
      });
      return true; // async response
    }
  });
})();
