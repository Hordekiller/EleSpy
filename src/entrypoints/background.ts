import type { ExtractedStyles, ElementorKitExport } from "../types/elementor";
import { generateKitExport } from "../utils/elementorExporter";

export default defineBackground(() => {
  console.log("EleSpy background service worker started");

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

  chrome.runtime.onMessage.addListener(
    (
      request: {
        type: string;
        tabId?: number;
        format?: string;
        data?: unknown;
      },
      sender,
      sendResponse
    ) => {
      if (request.type === "getTabInfo") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            sendResponse({
              tabId: tabs[0].id,
              url: tabs[0].url,
              title: tabs[0].title,
            });
          } else {
            sendResponse({ error: "No active tab" });
          }
        });
        return true;
      }

      if (request.type === "injectContentScript" && request.tabId) {
        chrome.scripting
          .executeScript({
            target: { tabId: request.tabId },
            files: ["content.js"],
          })
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((err) => {
            sendResponse({ success: false, error: String(err) });
          });
        return true;
      }

      if (request.type === "sendToTab" && request.tabId) {
        chrome.tabs.sendMessage(
          request.tabId,
          { type: request.format || "detect" },
          (response) => {
            sendResponse(response);
          }
        );
        return true;
      }

      if (request.type === "downloadKit" && request.data) {
        const kitExport = request.data as ElementorKitExport;
        const blob = new Blob([JSON.stringify(kitExport, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({
          url,
          filename: `elespy-kit-${Date.now()}.json`,
          saveAs: true,
        });
        sendResponse({ success: true });
        return true;
      }

      if (request.type === "downloadCSS" && request.data) {
        const css = request.data as string;
        const blob = new Blob([css], { type: "text/css" });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({
          url,
          filename: `elespy-extracted-${Date.now()}.css`,
          saveAs: true,
        });
        sendResponse({ success: true });
        return true;
      }

      return false;
    }
  );
});
