import { extractStyles } from "../utils/styleExtractor";
import { copyToClipboard } from "../utils/elementorExporter";

let extractionData: unknown = null;

chrome.runtime.onMessage.addListener(
  (request: { type: string; format?: string }, _sender, sendResponse) => {
    if (request.type === "detect") {
      const isWordPress =
        !!document.querySelector('meta[name="generator"]*[content*="WordPress"]') ||
        !!document.querySelector('link[href*="/wp-content/"]');
      const isElementor =
        !!document.body.className.includes("elementor-page") ||
        !!document.querySelector("[data-elementor-type]") ||
        !!document.querySelector(".elementor-widget-wrap");

      const kitMatch = document.body.className.match(/elementor-kit-(\d+)/);

      sendResponse({
        isWordPress,
        isElementor,
        kitId: kitMatch ? kitMatch[1] : null,
        url: window.location.href,
      });
      return true;
    }

    if (request.type === "extract") {
      extractStyles()
        .then((data) => {
          extractionData = data;
          sendResponse({ success: true, data });
        })
        .catch((err) => {
          sendResponse({ success: false, error: String(err) });
        });
      return true;
    }

    if (request.type === "copy") {
      const text =
        typeof request.format === "string" && extractionData
          ? JSON.stringify(extractionData, null, 2)
          : "";
      copyToClipboard(text).then((ok) => {
        sendResponse({ success: ok });
      });
      return true;
    }

    if (request.type === "getExtraction") {
      sendResponse({ data: extractionData });
      return true;
    }

    return false;
  }
);
