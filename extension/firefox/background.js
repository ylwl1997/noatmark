// NoAtMark background service worker (MV3).
// Context menu: "Copy clean text (NoAtMark)" for selected text.
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({
      id: "noatmark-copy-clean",
      title: "Copy clean text (NoAtMark)",
      contexts: ["selection"],
    });
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "noatmark-copy-clean" && tab && tab.id != null) {
    chrome.tabs.sendMessage(tab.id, { type: "cleanSelection" }, function (res) {
      if (chrome.runtime.lastError) return; // content script not available
    });
  }
});

// Open the scanner on the site.
chrome.action.onClicked.addListener(function () {
  chrome.tabs.create({ url: "https://noatmark.com/" });
});
