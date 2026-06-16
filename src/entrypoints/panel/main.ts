import type { ExtractedStyles, TechCategory, FullKitResult, KitExtractionProgress } from "../../types/elementor";
import {
  generateTemplateExport,
  generateKitExport,
  downloadTemplateJSON,
  downloadKitJSON,
  downloadCSS,
  copyToClipboard,
  generateImportInstructions,
} from "../../utils/elementorExporter";
import { extractFullKit, buildKitJSON, buildKitFilename } from "../../utils/extractors/kitBuilder";
import { downloadJSON as downloadJSONFile } from "../../utils/downloader";
import { t, setLang, getLang, applyTranslations, type Lang } from "../../utils/i18n";
import { setTheme, getTheme } from "../../utils/theme";

let currentData: ExtractedStyles | null = null;
let techData: TechCategory[] = [];
let currentTabUrl: string = "";
let fullKitData: FullKitResult | null = null;

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

async function loadSettings() {
  const data = await chrome.storage.local.get(["elespy:settings"]);
  const settings = data["elespy:settings"] || {
    lang: "fa",
    theme: "light",
    autoCopy: false,
  };

  setLang(settings.lang as Lang);
  setTheme(settings.theme as "light" | "dark");
  applyTranslations();

  updateLangButtons(settings.lang);
  updateThemeButtons(settings.theme);
}

async function saveSettings(key: string, value: unknown) {
  const data = await chrome.storage.local.get(["elespy:settings"]);
  const settings = data["elespy:settings"] || {};
  settings[key] = value;
  await chrome.storage.local.set({ "elespy:settings": settings });
}

function updateLangButtons(lang: string) {
  document.getElementById("btn-lang-fa")?.classList.toggle("active", lang === "fa");
  document.getElementById("btn-lang-en")?.classList.toggle("active", lang === "en");
}

function updateThemeButtons(theme: string) {
  document.getElementById("btn-theme-light")?.classList.toggle("active", theme === "light");
  document.getElementById("btn-theme-dark")?.classList.toggle("active", theme === "dark");
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  initTabs();
  initEventListeners();
  initSettings();
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
        document.querySelectorAll(".tab-panel").forEach((p) => {
          p.classList.remove("active");
        });
        document.getElementById(`tab-${tabName}`)?.classList.add("active");
      }
    });
  });
}

function initSettings() {
  document.getElementById("btn-settings")?.addEventListener("click", () => {
    document.getElementById("settings-overlay")!.style.display = "flex";
  });

  document.getElementById("btn-close-settings")?.addEventListener("click", () => {
    document.getElementById("settings-overlay")!.style.display = "none";
  });

  document.getElementById("settings-overlay")?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).id === "settings-overlay") {
      document.getElementById("settings-overlay")!.style.display = "none";
    }
  });

  document.getElementById("btn-lang-fa")?.addEventListener("click", () => {
    setLang("fa");
    saveSettings("lang", "fa");
    updateLangButtons("fa");
    applyTranslations();
  });

  document.getElementById("btn-lang-en")?.addEventListener("click", () => {
    setLang("en");
    saveSettings("lang", "en");
    updateLangButtons("en");
    applyTranslations();
  });

  document.getElementById("btn-theme-light")?.addEventListener("click", () => {
    setTheme("light");
    saveSettings("theme", "light");
    updateThemeButtons("light");
  });

  document.getElementById("btn-theme-dark")?.addEventListener("click", () => {
    setTheme("dark");
    saveSettings("theme", "dark");
    updateThemeButtons("dark");
  });
}

function initEventListeners() {
  document.getElementById("btn-refresh")?.addEventListener("click", loadData);

  document.getElementById("btn-export-json")?.addEventListener("click", () => {
    if (!currentData) return;
    const templateExport = generateTemplateExport(currentData);
    downloadTemplateJSON(templateExport, currentTabUrl);
    showNotification(t("notify.downloaded"));
  });

  document.getElementById("btn-export-kit")?.addEventListener("click", () => {
    if (fullKitData) {
      const kitJSON = buildKitJSON(fullKitData);
      downloadJSONFile(kitJSON, buildKitFilename());
    } else if (currentData) {
      const kitExport = generateKitExport(currentData);
      downloadKitJSON(kitExport);
    }
    showNotification(t("notify.downloaded"));
  });

  document.getElementById("btn-export-css-all")?.addEventListener("click", () => {
    if (!currentData) return;
    downloadCSS(currentData.generatedCSS);
    showNotification(t("notify.downloaded"));
  });

  document.getElementById("btn-copy-full")?.addEventListener("click", () => {
    if (!fullKitData && !currentData) return;
    const data = fullKitData || currentData;
    copyToClipboard(JSON.stringify(data, null, 2));
    showNotification(t("notify.copied"));
  });

  document.getElementById("btn-copy-vars")?.addEventListener("click", () => {
    if (!currentData?.cssVariables) return;
    const css = Object.entries(currentData.cssVariables)
      .map(([k, v]) => `${k}: ${v};`)
      .join("\n");
    copyToClipboard(css);
    showNotification(t("notify.copied"));
  });

  document.getElementById("btn-copy-kit")?.addEventListener("click", () => {
    if (!currentData) return;
    const templateExport = generateTemplateExport(currentData);
    copyToClipboard(JSON.stringify(templateExport, null, 2));
    showNotification(t("notify.copied"));
  });

  document
    .getElementById("btn-copy-instructions")
    ?.addEventListener("click", () => {
      const instructions = generateImportInstructions();
      copyToClipboard(instructions);
      showNotification(t("notify.copied"));
    });

  document.querySelectorAll(".btn-copy-section").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = (btn as HTMLElement).getAttribute("data-section");
      if (!section || !fullKitData) return;
      const json = getSectionJSON(section);
      if (json) {
        copyToClipboard(json);
        showNotification(t("notify.copied"));
      }
    });
  });

  document.querySelectorAll(".btn-download-section").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = (btn as HTMLElement).getAttribute("data-section");
      if (!section || !fullKitData) return;
      const json = getSectionJSON(section);
      if (json) {
        const hostname = window.location.hostname.replace(/[^a-zA-Z0-9.-]/g, "");
        downloadJSONFile(JSON.parse(json), `elespy-${hostname}-${section}.json`);
        showNotification(t("notify.downloaded"));
      }
    });
  });

  document.getElementById("btn-extract-full")?.addEventListener("click", async () => {
    const progressEl = document.getElementById("extraction-progress");
    if (progressEl) progressEl.style.display = "block";

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      await ensureContentScript(tab.id);
      await new Promise((r) => setTimeout(r, 300));

      const response = (await sendMessageToTab(tab.id, { type: "extract:full-kit" })) as {
        success?: boolean;
        data?: FullKitResult;
        error?: string;
      } | null;

      if (response?.success && response.data) {
        fullKitData = response.data;
        showNotification(t("notify.extracted"));
        updateFullExportUI(fullKitData);
      } else {
        showNotification(response?.error || t("notify.error"));
      }
    } catch {
      showNotification(t("notify.error"));
    }
  });

  // Live section selection
  document.getElementById("btn-detect-sections")?.addEventListener("click", async () => {
    const sectionsListEl = document.getElementById("sections-list");
    if (!sectionsListEl) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      await ensureContentScript(tab.id);
      await new Promise((r) => setTimeout(r, 300));

      const response = (await sendMessageToTab(tab.id, { type: "getSections" })) as {
        success?: boolean;
        data?: Array<{ id: string; sectionType: string; title: string; rect?: { top: number; width: number } }>;
        error?: string;
      } | null;

      if (response?.success && response.data && response.data.length > 0) {
        sectionsListEl.style.display = "block";
        sectionsListEl.innerHTML = "";

        // Group by section type
        const headers = response.data.filter((s: { sectionType: string }) => s.sectionType === "header");
        const footers = response.data.filter((s: { sectionType: string }) => s.sectionType === "footer");
        const sections = response.data.filter((s: { sectionType: string }) => s.sectionType === "section");
        const popups = response.data.filter((s: { sectionType: string }) => s.sectionType === "popup");

        if (headers.length > 0) {
          sectionsListEl.innerHTML += `<div class="section-group"><h4>هدرها</h4>${headers.map((s: { id: string; title: string }) => `<label class="section-item"><input type="checkbox" value="${s.id}"> ${s.title}</label>`).join("")}</div>`;
        }
        if (footers.length > 0) {
          sectionsListEl.innerHTML += `<div class="section-group"><h4>فوترها</h4>${footers.map((s: { id: string; title: string }) => `<label class="section-item"><input type="checkbox" value="${s.id}"> ${s.title}</label>`).join("")}</div>`;
        }
        if (sections.length > 0) {
          sectionsListEl.innerHTML += `<div class="section-group"><h4>بخش‌ها</h4>${sections.map((s: { id: string; title: string }) => `<label class="section-item"><input type="checkbox" value="${s.id}"> ${s.title}</label>`).join("")}</div>`;
        }
        if (popups.length > 0) {
          sectionsListEl.innerHTML += `<div class="section-group"><h4>پاپ‌آپ‌ها</h4>${popups.map((s: { id: string; title: string }) => `<label class="section-item"><input type="checkbox" value="${s.id}"> ${s.title}</label>`).join("")}</div>`;
        }

        if (response.data.length === 0) {
          sectionsListEl.innerHTML = `<p>${t("export.no-sections")}</p>`;
        }

        showNotification(t("notify.detected"));
      } else {
        showNotification(response?.error || t("notify.no-sections"));
      }
    } catch {
      showNotification(t("notify.error"));
    }
  });
}

async function loadData() {
  const techLoading = document.getElementById("tech-loading")!;
  const techResults = document.getElementById("tech-results")!;

  techLoading.style.display = "flex";
  techResults.style.display = "none";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      showNotification(t("notify.no-tab"));
      techLoading.style.display = "none";
      return;
    }

    currentTabUrl = tab.url || "";

    await ensureContentScript(tab.id);
    await new Promise((r) => setTimeout(r, 300));

    try {
      const detectAllResponse = (await sendMessageToTab(tab.id, {
        type: "detectAll",
      })) as { success?: boolean; data?: { categories?: TechCategory[] } } | null;

      if (detectAllResponse?.success && detectAllResponse.data?.categories) {
        techData = detectAllResponse.data.categories;
        renderTechCategories(techData);
        techLoading.style.display = "none";
        techResults.style.display = "block";
      } else {
        techLoading.querySelector("span")!.textContent = t("general.try-refresh");
      }
    } catch {
      techLoading.querySelector("span")!.textContent = t("general.try-refresh");
    }

    try {
      const extractResponse = (await sendMessageToTab(tab.id, {
        type: "extract",
      })) as { success?: boolean; data?: ExtractedStyles } | null;

      if (extractResponse?.success && extractResponse.data) {
        currentData = extractResponse.data;
        updateElementorUI(currentData);
        updateExportUI(currentData);
        updateImportUI(currentData);
      }
    } catch {
      // Extraction failed
    }
  } catch {
    techLoading.querySelector("span")!.textContent = t("notify.error");
  }
}

function getCategoryTranslation(categoryId: string): string {
  const key = `cat.${categoryId}`;
  const translated = t(key);
  return translated !== key ? translated : categoryId;
}

function renderTechCategories(categories: TechCategory[]) {
  const container = document.getElementById("tech-results")!;
  container.innerHTML = "";

  for (const category of categories) {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "tech-category";

    const hasItems = category.items.length > 0;
    const count = category.items.length;

    categoryDiv.innerHTML = `
      <div class="tech-category-header">
        <div class="category-icon">${getCategoryIcon(category.id)}</div>
        <div class="category-name">${getCategoryTranslation(category.id)}</div>
        <div class="category-count">${count}</div>
      </div>
      <div class="tech-items">
        ${
          hasItems
            ? category.items
                .map(
                  (item) => `
            <div class="tech-item">
              <span class="item-name">${item.name}</span>
              ${item.version ? `<span class="item-version">${item.version}</span>` : ""}
              <span class="item-confidence">${item.confidence}%</span>
            </div>
          `
                )
                .join("")
            : `<div class="tech-item no-items">${t("cat.not-detected")}</div>`
        }
      </div>
    `;

    container.appendChild(categoryDiv);
  }
}

function getCategoryIcon(categoryId: string): string {
  const icons: Record<string, string> = {
    server:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
    cdn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    cms: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
    "page-builder":
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
    theme: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>',
    language:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>',
    "js-framework":
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
    "ui-library":
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/></svg>',
    library:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
    analytics:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    marketing:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    fonts: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4,7 4,4 20,4 20,7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
    hosting:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
  };
  return icons[categoryId] || icons.server;
}

function updateElementorUI(data: ExtractedStyles) {
  const elEl = document.getElementById("p-elementor")!;
  const proEl = document.getElementById("p-elementor-pro")!;
  const kitEl = document.getElementById("p-kit-id")!;
  const colorsContainer = document.getElementById("p-colors")!;
  const typoContainer = document.getElementById("p-typography")!;
  const varsContainer = document.getElementById("p-css-vars")!;

  elEl.textContent = data.elementor.isElementor ? t("general.yes") : t("general.no");
  elEl.className = `info-value ${data.elementor.isElementor ? "success" : "danger"}`;

  proEl.textContent = data.elementor.hasPro ? t("general.yes") : t("general.no");
  proEl.className = `info-value ${data.elementor.hasPro ? "success" : "danger"}`;

  kitEl.textContent = data.elementor.kitId || "-";
  kitEl.className = `info-value ${data.elementor.kitId ? "success" : ""}`;

  colorsContainer.innerHTML = "";
  if (Object.keys(data.globalColors).length === 0) {
    colorsContainer.innerHTML = `<div class="tech-item no-items">${t("general.no-colors")}</div>`;
  }
  for (const [name, color] of Object.entries(data.globalColors)) {
    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    const colorValue = color.color || (color as unknown as Record<string, string>).value || "";
    const colorName = color.title || (color as unknown as Record<string, string>).name || name;
    swatch.innerHTML = `
      <div class="swatch" style="background-color: ${colorValue}"></div>
      <div class="color-info">
        <span class="color-name">${colorName}</span>
        <span class="color-value">${colorValue}</span>
      </div>
    `;
    swatch.addEventListener("click", () => {
      copyToClipboard(colorValue);
      showNotification(t("notify.copied"));
    });
    colorsContainer.appendChild(swatch);
  }

  typoContainer.innerHTML = "";
  if (Object.keys(data.globalTypography).length === 0) {
    typoContainer.innerHTML = `<div class="tech-item no-items">${t("general.no-typography")}</div>`;
  }
  for (const [name, typo] of Object.entries(data.globalTypography)) {
    const item = document.createElement("div");
    item.className = "typography-item";
    const fontFamily =
      typeof typo === "object" && typo !== null
        ? (typo as { typography_font_family?: string; font_family?: string }).typography_font_family ||
          (typo as { font_family?: string }).font_family || "Unknown"
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
  varsContainer.textContent = varsText || t("general.no-css-variables");
}

function updateExportUI(data: ExtractedStyles) {
  const preview = document.getElementById("export-preview");
  if (preview) {
    const templateExport = generateTemplateExport(data);
    preview.textContent = JSON.stringify(templateExport, null, 2);
  }
}

function updateImportUI(_data: ExtractedStyles) {
  const instructions = document.getElementById("import-instructions");
  if (instructions) {
    const text = generateImportInstructions();
    instructions.innerHTML = text
      .split("\n")
      .map((line) => {
        if (line.startsWith("===")) return `<strong>${line}</strong>`;
        if (line.startsWith("---"))
          return `<strong>${line.replace(/---/g, "")}</strong>`;
        if (/^\d+\./.test(line))
          return `<li>${line.replace(/^\d+\.\s*/, "")}</li>`;
        if (line.startsWith("-"))
          return `<li style="margin-right: 16px">${line}</li>`;
        return line;
      })
      .join("<br>");
  }
}

function updateFullExportUI(data: FullKitResult) {
  const sections = [
    { id: "colors", container: "export-colors", json: JSON.stringify(data.globalColors, null, 2) },
    { id: "typography", container: "export-typography", json: JSON.stringify(data.globalTypography, null, 2) },
    { id: "css", container: "export-css", json: JSON.stringify(data.cssVariables, null, 2) },
    { id: "widgets", container: "export-widgets", json: JSON.stringify(data.widgets, null, 2) },
    { id: "templates", container: "export-templates", json: JSON.stringify(data.templates, null, 2) },
    { id: "customcss", container: "export-customcss", json: data.customCSS },
  ];

  for (const section of sections) {
    const sectionEl = document.getElementById(`section-${section.id}`);
    const containerEl = document.getElementById(section.container);
    if (sectionEl && containerEl) {
      sectionEl.style.display = "block";
      containerEl.textContent = section.json;
    }
  }
}

function getSectionJSON(section: string): string | null {
  if (!fullKitData) return null;
  switch (section) {
    case "colors": return JSON.stringify(fullKitData.globalColors, null, 2);
    case "typography": return JSON.stringify(fullKitData.globalTypography, null, 2);
    case "css": return JSON.stringify(fullKitData.cssVariables, null, 2);
    case "widgets": return JSON.stringify(fullKitData.widgets, null, 2);
    case "templates": return JSON.stringify(fullKitData.templates, null, 2);
    case "customcss": return fullKitData.customCSS;
    default: return null;
  }
}

function renderExtractionProgress(progress: KitExtractionProgress[]) {
  const container = document.getElementById("extraction-progress");
  if (!container) return;

  container.innerHTML = progress.map((p) => {
    const statusIcon = p.status === "done" ? "✅" : p.status === "error" ? "❌" : p.status === "running" ? "⏳" : "⬜";
    const countText = p.count !== undefined ? ` (${p.count})` : "";
    const errorText = p.error ? `<span class="error-text">${p.error}</span>` : "";
    return `<div class="progress-item"><span>${statusIcon}</span> <span>${p.step}</span>${countText}${errorText}</div>`;
  }).join("");
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
