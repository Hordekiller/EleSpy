import type { ExtractedStyles } from "../../types/elementor";
import { copyToClipboard } from "../../utils/elementorExporter";

let currentData: ExtractedStyles | null = null;

document.addEventListener("DOMContentLoaded", async () => {
  const serverInfo = document.getElementById("server-info")!;
  const cdnInfo = document.getElementById("cdn-info")!;
  const wpStatus = document.getElementById("wp-status")!;
  const elementorStatus = document.getElementById("elementor-status")!;
  const kitId = document.getElementById("kit-id")!;
  const elementorActions = document.getElementById("elementor-actions")!;
  const btnExtract = document.getElementById("btn-extract")!;
  const btnCopyJson = document.getElementById("btn-copy-json")!;
  const btnCopyCss = document.getElementById("btn-copy-css")!;
  const outputArea = document.getElementById("output-area")!;
  const outputText = document.getElementById("output-text") as HTMLTextAreaElement;
  const btnOpenPanel = document.getElementById("btn-open-panel")!;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      serverInfo.textContent = "No active tab";
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    } catch {
      // Content script already injected
    }

    chrome.tabs.sendMessage(tab.id, { type: "detect" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        serverInfo.textContent = "Cannot detect";
        serverInfo.classList.add("warning");
        return;
      }

      wpStatus.textContent = response.isWordPress ? "Yes" : "No";
      wpStatus.classList.add(response.isWordPress ? "success" : "danger");

      elementorStatus.textContent = response.isElementor ? "Yes" : "No";
      elementorStatus.classList.add(response.isElementor ? "success" : "danger");

      kitId.textContent = response.kitId || "-";

      if (response.isElementor) {
        elementorActions.style.display = "block";
      }

      serverInfo.textContent = "Detected";
      serverInfo.classList.add("success");
      cdnInfo.textContent = "Checking...";
    });

    chrome.tabs.sendMessage(
      tab.id,
      { type: "extract" },
      (extractResponse: { success?: boolean; data?: ExtractedStyles }) => {
        if (extractResponse?.success && extractResponse.data) {
          currentData = extractResponse.data;

          serverInfo.textContent = currentData.server.server;
          cdnInfo.textContent = currentData.server.cdn || "None";

          btnCopyJson.style.display = "inline-flex";
          btnCopyCss.style.display = "inline-flex";
        }
      }
    );
  } catch (err) {
    serverInfo.textContent = "Error";
    serverInfo.classList.add("danger");
  }

  btnExtract.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) return;

    btnExtract.textContent = "Extracting...";
    (btnExtract as HTMLButtonElement).disabled = true;

    chrome.tabs.sendMessage(
      tab.id,
      { type: "extract" },
      (response: { success?: boolean; data?: ExtractedStyles }) => {
        btnExtract.textContent = "Extract Styles";
        (btnExtract as HTMLButtonElement).disabled = false;

        if (response?.success && response.data) {
          currentData = response.data;
          outputArea.style.display = "block";
          outputText.value = JSON.stringify(response.data, null, 2);
          btnCopyJson.style.display = "inline-flex";
          btnCopyCss.style.display = "inline-flex";
        }
      }
    );
  });

  btnCopyJson.addEventListener("click", () => {
    if (currentData) {
      copyToClipboard(JSON.stringify(currentData, null, 2));
      btnCopyJson.textContent = "Copied!";
      setTimeout(() => {
        btnCopyJson.textContent = "Copy JSON";
      }, 2000);
    }
  });

  btnCopyCss.addEventListener("click", () => {
    if (currentData?.generatedCSS) {
      copyToClipboard(currentData.generatedCSS);
      btnCopyCss.textContent = "Copied!";
      setTimeout(() => {
        btnCopyCss.textContent = "Copy CSS";
      }, 2000);
    }
  });

  btnOpenPanel.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
  });
});
