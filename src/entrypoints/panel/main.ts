import type { ExtractedStyles } from "../../types/elementor";
import {
  generateKitExport,
  downloadKitJSON,
  downloadCSS,
  copyToClipboard,
  generateImportInstructions,
} from "../../utils/elementorExporter";

let currentData: ExtractedStyles | null = null;
let activeTab = "detect";

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initEventListeners();
  loadData();
});

function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const tabName = tab.getAttribute("data-tab");
      if (tabName) {
        activeTab = tabName;
        document.querySelectorAll(".tab-panel").forEach((p) => {
          p.classList.remove("active");
        });
        document.getElementById(`tab-${tabName}`)?.classList.add("active");
      }
    });
  });
}

function initEventListeners() {
  document.getElementById("btn-refresh")?.addEventListener("click", loadData);

  document.getElementById("btn-export-json")?.addEventListener("click", () => {
    if (!currentData) return;
    const kitExport = generateKitExport(currentData);
    downloadKitJSON(kitExport);
    showNotification("Kit JSON downloaded!");
  });

  document.getElementById("btn-export-css")?.addEventListener("click", () => {
    if (!currentData) return;
    downloadCSS(currentData.generatedCSS);
    showNotification("CSS downloaded!");
  });

  document.getElementById("btn-copy-full")?.addEventListener("click", () => {
    if (!currentData) return;
    copyToClipboard(JSON.stringify(currentData, null, 2));
    showNotification("Full data copied to clipboard!");
  });

  document.getElementById("btn-copy-vars")?.addEventListener("click", () => {
    if (!currentData?.cssVariables) return;
    const css = Object.entries(currentData.cssVariables)
      .map(([k, v]) => `${k}: ${v};`)
      .join("\n");
    copyToClipboard(css);
    showNotification("CSS variables copied!");
  });

  document.getElementById("btn-copy-kit")?.addEventListener("click", () => {
    if (!currentData) return;
    const kitExport = generateKitExport(currentData);
    copyToClipboard(JSON.stringify(kitExport, null, 2));
    showNotification("Kit JSON copied! Paste in Elementor > Tools > Import/Export Kit");
  });

  document
    .getElementById("btn-copy-instructions")
    ?.addEventListener("click", () => {
      if (!currentData) return;
      const kitExport = generateKitExport(currentData);
      const instructions = generateImportInstructions(kitExport);
      copyToClipboard(instructions);
      showNotification("Instructions copied!");
    });
}

async function loadData() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      showNotification("No active tab found");
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

    chrome.tabs.sendMessage(
      tab.id,
      { type: "detect" },
      (response: {
        isWordPress?: boolean;
        isElementor?: boolean;
        kitId?: string | null;
      }) => {
        if (chrome.runtime.lastError || !response) {
          showNotification("Cannot detect - refresh the page");
          return;
        }

        updateDetectionUI(response);
      }
    );

    chrome.tabs.sendMessage(
      tab.id,
      { type: "extract" },
      (response: { success?: boolean; data?: ExtractedStyles }) => {
        if (response?.success && response.data) {
          currentData = response.data;
          updateServerUI(currentData);
          updateStylesUI(currentData);
          updateExportUI(currentData);
          updateImportUI(currentData);
        }
      }
    );
  } catch {
    showNotification("Error loading data");
  }
}

function updateDetectionUI(data: {
  isWordPress?: boolean;
  isElementor?: boolean;
  kitId?: string | null;
}) {
  const wpEl = document.getElementById("p-wp")!;
  const elEl = document.getElementById("p-elementor")!;
  const kitEl = document.getElementById("p-kit-id")!;

  wpEl.textContent = data.isWordPress ? "Yes" : "No";
  wpEl.className = `info-value ${data.isWordPress ? "success" : "danger"}`;

  elEl.textContent = data.isElementor ? "Yes" : "No";
  elEl.className = `info-value ${data.isElementor ? "success" : "danger"}`;

  kitEl.textContent = data.kitId || "-";
  kitEl.className = `info-value ${data.kitId ? "success" : ""}`;
}

function updateServerUI(data: ExtractedStyles) {
  const serverEl = document.getElementById("p-server")!;
  const cdnEl = document.getElementById("p-cdn")!;
  const sslEl = document.getElementById("p-ssl")!;
  const proEl = document.getElementById("p-elementor-pro")!;

  serverEl.textContent = data.server.server;
  cdnEl.textContent = data.server.cdn || "None";
  sslEl.textContent = data.server.ssl ? "Yes" : "No";
  sslEl.className = `info-value ${data.server.ssl ? "success" : "danger"}`;
  proEl.textContent = data.elementor.hasPro ? "Yes" : "No";
  proEl.className = `info-value ${data.elementor.hasPro ? "success" : "danger"}`;
}

function updateStylesUI(data: ExtractedStyles) {
  const colorsContainer = document.getElementById("p-colors")!;
  const typoContainer = document.getElementById("p-typography")!;
  const varsContainer = document.getElementById("p-css-vars")!;

  colorsContainer.innerHTML = "";
  for (const [name, color] of Object.entries(data.globalColors)) {
    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    swatch.innerHTML = `
      <div class="swatch" style="background-color: ${color.value}"></div>
      <div class="color-info">
        <span class="color-name">${color.name}</span>
        <span class="color-value">${color.value}</span>
      </div>
    `;
    swatch.addEventListener("click", () => {
      copyToClipboard(color.value);
      showNotification(`Copied: ${color.value}`);
    });
    colorsContainer.appendChild(swatch);
  }

  typoContainer.innerHTML = "";
  for (const [name, typo] of Object.entries(data.globalTypography)) {
    const item = document.createElement("div");
    item.className = "typography-item";
    const fontFamily =
      typeof typo === "object" && typo !== null
        ? (typo as { font_family?: string }).font_family || "Unknown"
        : "Unknown";
    item.innerHTML = `
      <div class="typo-name">${name}</div>
      <div class="typo-preview" style="font-family: '${fontFamily}'">${fontFamily}</div>
      <div class="typo-details">${fontFamily}</div>
    `;
    typoContainer.appendChild(item);
  }

  const varsText = Object.entries(data.cssVariables)
    .map(([k, v]) => `${k}: ${v};`)
    .join("\n");
  varsContainer.textContent = varsText || "No CSS variables found";
}

function updateExportUI(data: ExtractedStyles) {
  const preview = document.getElementById("export-preview");
  if (preview) {
    const kitExport = generateKitExport(data);
    preview.textContent = JSON.stringify(kitExport, null, 2);
  }
}

function updateImportUI(data: ExtractedStyles) {
  const instructions = document.getElementById("import-instructions");
  if (instructions) {
    const kitExport = generateKitExport(data);
    const text = generateImportInstructions(kitExport);
    instructions.innerHTML = text
      .split("\n")
      .map((line) => {
        if (line.startsWith("===")) return `<strong>${line}</strong>`;
        if (line.startsWith("Method"))
          return `<strong>${line}</strong>`;
        if (/^\d+\./.test(line)) return `<li>${line.replace(/^\d+\.\s*/, "")}</li>`;
        if (line.startsWith("-")) return `<li style="margin-right: 16px">${line}</li>`;
        return line;
      })
      .join("<br>");
  }
}

function showNotification(text: string) {
  const notification = document.getElementById("notification")!;
  const notificationText = document.getElementById("notification-text")!;
  notificationText.textContent = text;
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}
