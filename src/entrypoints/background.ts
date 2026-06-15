export default defineBackground(() => {
  console.log("EleSpy background started");

  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      chrome.storage.local.set({
        "elespy:settings": {
          autoCopy: false,
          defaultFormat: "json",
          theme: "light",
        },
      });
    }
  });

  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => {});

  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    }
  });
});
