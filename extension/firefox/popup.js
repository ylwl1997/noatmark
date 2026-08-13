// NoAtMark popup logic.
(function () {
  "use strict";
  var ext = (typeof NoAtMarkExt !== "undefined") ? NoAtMarkExt : null;
  var input = document.getElementById("input");
  var result = document.getElementById("result");
  var autoClean = document.getElementById("autoClean");

  function report(html, cls) {
    result.innerHTML = '<span class="' + cls + '">' + html + '</span>';
  }

  document.getElementById("scan").addEventListener("click", function () {
    var text = input.value;
    if (!text) { report("Paste some text first", "warn"); return; }
    var n = ext.scanHidden(text);
    if (n === 0) report("&#x2705; No invisible characters found", "ok");
    else report("&#x26A0;&#xFE0F; " + n + " invisible character(s) found", "warn");
  });

  document.getElementById("clean").addEventListener("click", function () {
    var text = input.value;
    if (!text) { report("Paste some text first", "warn"); return; }
    var cleaned = ext.stripInvisible(text);
    var n = text.length - cleaned.length;
    navigator.clipboard.writeText(cleaned).then(function () {
      if (n === 0) report("&#x2705; Clean text copied (" + text.length + " chars)", "ok");
      else report("&#x2705; Copied — stripped " + n + " invisible character(s)", "ok");
    }, function () {
      report("Clipboard blocked — clean text is below", "warn");
      input.value = cleaned;
    });
  });

  // toggle auto-clean on copy
  chrome.storage.sync.get({ autoClean: false }, function (cfg) {
    autoClean.checked = !!cfg.autoClean;
  });
  autoClean.addEventListener("change", function () {
    chrome.storage.sync.set({ autoClean: autoClean.checked });
    report(autoClean.checked ? "Auto-clean enabled" : "Auto-clean disabled", "ok");
  });
})();
