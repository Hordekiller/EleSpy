import type { ExtractedStyles } from "../../types/elementor";
import { copyToClipboard } from "../../utils/elementorExporter";

let currentData: ExtractedStyles | null = null;

function sendMessageToTab(
  tabId: number,
  message: Record<string, unknown>
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const maxRetries = 3;
    let attempt = 0;

    function trySend() {
      attempt++;
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          if (attempt < maxRetries) {
            setTimeout(trySend, 300 * attempt);
          } else {
            reject(new Error(chrome.runtime.lastError.message));
          }
          return;
        }
        resolve(response);
      });
    }

    trySend();
  });
}

async function ensureContentScript(tabId: number): Promise<boolean> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["/content-scripts/content.js"],
    });
    return true;
  } catch {
    return false;
  }
}

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

  let tabId: number | undefined;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      serverInfo.textContent = "No active tab";
      return;
    }

    tabId = tab.id;

    const url = tab.url || "";
    try {
      const resp = await fetch(url, { method: "HEAD" });
      const server = resp.headers.get("server") || "Unknown";
      serverInfo.textContent = server;

      const via = resp.headers.get("via") || "";
      const cfRay = resp.headers.get("cf-ray");
      cdnInfo.textContent = cfRay
        ? "Cloudflare"
        : via
          ? via.split(",")[0].trim()
          : "None";
    } catch {
      serverInfo.textContent = "CORS restricted";
      cdnInfo.textContent = "Cannot detect";
    }

    await ensureContentScript(tabId);
    await new Promise((r) => setTimeout(r, 200));

    try {
      const detectResponse = (await sendMessageToTab(tabId, {
        type: "detect",
      })) as {
        isWordPress?: boolean;
        isElementor?: boolean;
        kitId?: string | null;
      } | null;

      if (detectResponse) {
        wpStatus.textContent = detectResponse.isWordPress ? "Yes" : "No";
        wpStatus.classList.add(detectResponse.isWordPress ? "success" : "danger");

        elementorStatus.textContent = detectResponse.isElementor ? "Yes" : "No";
        elementorStatus.classList.add(
          detectResponse.isElementor ? "success" : "danger"
        );

        kitId.textContent = detectResponse.kitId || "-";

        if (detectResponse.isElementor) {
          elementorActions.style.display = "block";
        }
      } else {
        wpStatus.textContent = "No response";
        wpStatus.classList.add("warning");
        elementorStatus.textContent = "No response";
        elementorStatus.classList.add("warning");
      }
    } catch (err) {
      wpStatus.textContent = "Error";
      wpStatus.classList.add("danger");
      elementorStatus.textContent = "Error";
      elementorStatus.classList.add("danger");
    }
  } catch (err) {
    serverInfo.textContent = "Error";
    serverInfo.classList.add("danger");
  }

  btnExtract.addEventListener("click", async () => {
    if (!tabId) return;

    btnExtract.textContent = "Extracting...";
    (btnExtract as HTMLButtonElement).disabled = true;

    try {
      await ensureContentScript(tabId);
      await new Promise((r) => setTimeout(r, 200));

      const response = (await sendMessageToTab(tabId, {
        type: "extract",
      })) as { success?: boolean; data?: ExtractedStyles } | null;

      btnExtract.textContent = "Extract Styles";
      (btnExtract as HTMLButtonElement).disabled = false;

      if (response?.success && response.data) {
        currentData = response.data;
        outputArea.style.display = "block";
        outputText.value = JSON.stringify(response.data, null, 2);
        btnCopyJson.style.display = "inline-flex";
        btnCopyCss.style.display = "inline-flex";
      }
    } catch {
      btnExtract.textContent = "Extract Styles";
      (btnExtract as HTMLButtonElement).disabled = false;
    }
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
