import { detectAllTechnologies } from "../detectors";
import { extractFullKit } from "../utils/extractors/kitBuilder";
import { getAllElementorSections, extractSelectedSections } from "../utils/extractors/templateExtractor";
import { getPageExtractorScript } from "../utils/inject/pageExtractor";

// Helper: Extract CSS variables from DOM in content script context
function extractCSSVariablesFromDOM(): Record<string, string> {
  const variables: Record<string, string> = {};
  try {
    const rootStyles = getComputedStyle(document.documentElement);
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      if (prop.startsWith("--e-")) {
        variables[prop] = rootStyles.getPropertyValue(prop).trim();
      }
    }
  } catch (e) {
    console.log("[EleSpy] Could not read CSS variables:", e);
  }
  return variables;
}

// Helper: Extract DOM element data in content script context
function extractDOMElementsFromDOM(): Array<Record<string, unknown>> {
  const elements: Array<Record<string, unknown>> = [];
  try {
    const els = document.querySelectorAll('.elementor-element[data-id]');
    for (const el of Array.from(els)) {
      const htEl = el as HTMLElement;
      const id = htEl.getAttribute("data-id");
      if (!id) continue;

      const elementType = htEl.getAttribute("data-element_type");
      const widgetType = htEl.getAttribute("data-widget_type");
      const settingsRaw = htEl.getAttribute("data-settings");

      let settings = {};
      if (settingsRaw) {
        try {
          // Decode HTML entities
          const decoded = settingsRaw
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&amp;/g, '&');
          settings = JSON.parse(decoded);
        } catch { /* malformed - skip */ }
      }

      elements.push({
        id,
        elementType,
        widgetType,
        settings,
      });
    }
  } catch (e) {
    console.log("[EleSpy] Could not extract DOM elements:", e);
  }
  return elements;
}

function generateId(): string {
  return Math.random().toString(16).substring(2, 10);
}

function extractWidgetSettings(el: HTMLElement, widgetType: string): Record<string, unknown> {
  const settings: Record<string, unknown> = {};
  const dataSettings = el.getAttribute("data-settings");
  if (dataSettings) {
    try { Object.assign(settings, JSON.parse(dataSettings)); } catch {}
  }

  const container = el.querySelector(".elementor-widget-container");
  if (!container) return settings;

  switch (widgetType) {
    case "heading": {
      const title = container.querySelector("h1, h2, h3, h4, h5, h6");
      if (title) {
        settings["title"] = title.textContent || "";
        settings["header_size"] = title.tagName.toLowerCase();
        const cs = getComputedStyle(title);
        if (cs.textAlign && cs.textAlign !== "start") settings["align"] = cs.textAlign;
        if (cs.color) settings["title_color"] = cs.color;
        if (cs.fontFamily) settings["typography_typography"] = "custom";
        if (cs.fontFamily) settings["typography_font_family"] = cs.fontFamily;
        if (cs.fontSize) settings["typography_font_size"] = { unit: "px", size: parseInt(cs.fontSize), sizes: [] };
        if (cs.fontWeight && cs.fontWeight !== "400") settings["typography_font_weight"] = cs.fontWeight;
        if (cs.letterSpacing) settings["typography_letter_spacing"] = { unit: "px", size: parseInt(cs.letterSpacing) || 0, sizes: [] };
        if (cs.lineHeight && cs.lineHeight !== "normal") settings["typography_line_height"] = { unit: "em", size: parseFloat(cs.lineHeight) || 1.5, sizes: [] };
      }
      break;
    }
    case "text-editor":
    case "editor": {
      const textEl = container.querySelector(".elementor-widget-container");
      if (textEl) settings["editor"] = textEl.innerHTML;
      break;
    }
    case "button": {
      const btn = container.querySelector("a.elementor-button, .elementor-button");
      if (btn) {
        settings["text"] = btn.textContent?.trim() || "";
        const href = btn.getAttribute("href");
        if (href) settings["link"] = { url: href, is_external: false, nofollow: false };
        const cs = getComputedStyle(btn);
        if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") settings["background_color"] = cs.backgroundColor;
        if (cs.color) settings["button_text_color"] = cs.color;
        if (cs.borderRadius) settings["border_radius"] = { unit: "px", top: cs.borderRadius, right: cs.borderRadius, bottom: cs.borderRadius, left: cs.borderRadius, isLinked: true };
        if (cs.fontSize) settings["typography_font_size"] = { unit: "px", size: parseInt(cs.fontSize), sizes: [] };
      }
      break;
    }
    case "image": {
      const img = container.querySelector("img");
      if (img) {
        const src = img.getAttribute("src") || "";
        settings["image"] = { url: src, id: "" };
        settings["image_size"] = "full";
        if (img.alt) settings["image_alt"] = img.alt;
        const cs = getComputedStyle(img);
        if (cs.borderRadius && cs.borderRadius !== "0px") settings["border_radius"] = { unit: "px", top: cs.borderRadius, right: cs.borderRadius, bottom: cs.borderRadius, left: cs.borderRadius, isLinked: true };
      }
      break;
    }
    case "icon": {
      const iconEl = container.querySelector("i[class*='fa-'], i[class*='eicon-']");
      if (iconEl) {
        const classes = iconEl.className;
        const faMatch = classes.match(/fa-(?:solid|regular|brands)\s+fa-(\S+)/);
        if (faMatch) settings["selected_icon"] = { value: { prefix: "fa-solid ", name: faMatch[1] } };
      }
      const cs = getComputedStyle(container);
      if (cs.fontSize) settings["typography_font_size"] = { unit: "px", size: parseInt(cs.fontSize), sizes: [] };
      break;
    }
    case "divider": {
      settings["style"] = "solid";
      const wrapper = container.querySelector(".elementor-divider-separator");
      if (wrapper) {
        const cs = getComputedStyle(wrapper);
        if (cs.borderColor) settings["color"] = cs.borderColor;
        if (cs.borderWidth) settings["weight"] = { unit: "px", size: parseInt(cs.borderWidth), sizes: [] };
        if (cs.width && cs.width !== "100%") settings["width"] = { unit: "%", size: parseInt(cs.width), sizes: [] };
      }
      break;
    }
    case "spacer": {
      const spacerEl = container.querySelector(".elementor-widget-container");
      if (spacerEl) {
        const cs = getComputedStyle(spacerEl);
        if (cs.height) settings["space"] = { unit: "px", size: parseInt(cs.height), sizes: [] };
      }
      break;
    }
    case "google_maps": {
      const iframe = container.querySelector("iframe");
      if (iframe) {
        const src = iframe.getAttribute("src") || "";
        const latMatch = src.match(/!2d([\d.-]+)/);
        const lngMatch = src.match(/!3d([\d.-]+)/);
        if (latMatch && lngMatch) {
          settings["location"] = { place_id: "", address: "", lat: parseFloat(latMatch[1]), lng: parseFloat(lngMatch[1]) };
        }
      }
      break;
    }
    case "video": {
      const iframe = container.querySelector("iframe");
      if (iframe) {
        const src = iframe.getAttribute("src") || "";
        if (src.includes("youtube")) {
          settings["video_type"] = "youtube";
          const ytMatch = src.match(/embed\/([^?&]+)/);
          if (ytMatch) settings["video_url"] = { url: `https://www.youtube.com/watch?v=${ytMatch[1]}` };
        } else if (src.includes("vimeo")) {
          settings["video_type"] = "vimeo";
          const vimeoMatch = src.match(/video\/(\d+)/);
          if (vimeoMatch) settings["video_url"] = { url: `https://vimeo.com/${vimeoMatch[1]}` };
        }
      }
      break;
    }
    case "progress": {
      const progressEl = container.querySelector(".elementor-progress-wrapper");
      if (progressEl) {
        const cs = getComputedStyle(progressEl);
        if (cs.backgroundColor) settings["inner_background_color"] = { color: cs.backgroundColor };
        const bar = container.querySelector(".elementor-progress-bar");
        if (bar) {
          const barCs = getComputedStyle(bar);
          if (barCs.backgroundColor) settings["background_color"] = { color: barCs.backgroundColor };
          settings["percentage"] = bar.getAttribute("data-max") || "50";
        }
      }
      break;
    }
    case "tabs": {
      const tabTitles = container.querySelectorAll(".elementor-tab-title");
      if (tabTitles.length) {
        const tabs = Array.from(tabTitles).map((t, i) => ({
          tab_title: t.textContent?.trim() || `Tab ${i + 1}`,
          tab_content: "",
          _id: generateId(),
        }));
        settings["tabs"] = tabs;
      }
      break;
    }
    case "accordion": {
      const titles = container.querySelectorAll(".elementor-tab-title");
      if (titles.length) {
        const items = Array.from(titles).map((t, i) => ({
          tab_title: t.textContent?.trim() || `Item ${i + 1}`,
          tab_content: "",
          _id: generateId(),
        }));
        settings["tabs"] = items;
      }
      break;
    }
    case "icon-list": {
      const items = container.querySelectorAll(".elementor-icon-list-item");
      if (items.length) {
        settings["icon_list"] = Array.from(items).map(item => ({
          text: item.querySelector(".elementor-icon-list-text")?.textContent?.trim() || "",
          link: { url: (item.querySelector("a")?.getAttribute("href")) || "#" },
          _id: generateId(),
        }));
      }
      break;
    }
    case "social-icons": {
      const icons = container.querySelectorAll(".elementor-social-icon");
      if (icons.length) {
        settings["social_icon_list"] = Array.from(icons).map(icon => {
          const link = icon.closest("a");
          return {
            social: icon.className.match(/elementor-social-icon-(\S+)/)?.[1] || "share",
            link: { url: link?.getAttribute("href") || "#" },
            _id: generateId(),
          };
        });
      }
      break;
    }
    case "counter": {
      const numEl = container.querySelector(".elementor-counter-number-wrapper");
      if (numEl) {
        settings["starting_number"] = numEl.textContent?.trim() || "0";
        settings["ending_number"] = numEl.textContent?.trim() || "100";
      }
      const titleEl = container.querySelector(".elementor-counter-title");
      if (titleEl) settings["title"] = titleEl.textContent?.trim() || "";
      break;
    }
    case "testimonial": {
      const content = container.querySelector(".elementor-testimonial-content");
      if (content) settings["testimonial_content"] = content.textContent?.trim() || "";
      const name = container.querySelector(".elementor-testimonial-name");
      if (name) settings["testimonial_name"] = name.textContent?.trim() || "";
      const job = container.querySelector(".elementor-testimonial-job");
      if (job) settings["testimonial_job"] = job.textContent?.trim() || "";
      const img = container.querySelector(".elementor-testimonial-image img");
      if (img) settings["testimonial_image"] = { url: img.getAttribute("src") || "" };
      break;
    }
    case "alert": {
      const alertEl = container.querySelector(".elementor-alert");
      if (alertEl) {
        settings["alert_title"] = alertEl.querySelector(".elementor-alert-title")?.textContent?.trim() || "";
        settings["alert_description"] = alertEl.querySelector(".elementor-alert-description")?.textContent?.trim() || "";
        const cs = getComputedStyle(alertEl);
        if (cs.backgroundColor) settings["background_color"] = cs.backgroundColor;
      }
      break;
    }
    case "html": {
      const codeEl = container.querySelector("code, pre, .elementor-widget-container");
      if (codeEl) settings["html"] = codeEl.innerHTML;
      break;
    }
    case "shortcodes":
    case "shortcode": {
      settings["shortcode"] = container.textContent || "";
      break;
    }
    default: {
      const text = container.textContent?.trim();
      if (text && text.length < 500) settings["_text_preview"] = text.substring(0, 200);
      break;
    }
  }

  return settings;
}

function extractContainerSettings(el: HTMLElement): Record<string, unknown> {
  const settings: Record<string, unknown> = {};
  const dataSettings = el.getAttribute("data-settings");
  if (dataSettings) {
    try { Object.assign(settings, JSON.parse(dataSettings)); } catch {}
  }

  const cs = getComputedStyle(el);
  if (cs.flexDirection) settings["flex_direction"] = cs.flexDirection;
  if (cs.justifyContent && cs.justifyContent !== "flex-start") settings["justify_content"] = cs.justifyContent;
  if (cs.alignItems && cs.alignItems !== "stretch") settings["align_items"] = cs.alignItems;
  if (cs.gap && cs.gap !== "0px") settings["gap"] = { unit: "px", size: parseInt(cs.gap), sizes: [] };
  if (cs.paddingTop || cs.paddingRight || cs.paddingBottom || cs.paddingLeft) {
    settings["padding"] = {
      unit: "px",
      top: Math.round(parseInt(cs.paddingTop) || 0).toString(),
      right: Math.round(parseInt(cs.paddingRight) || 0).toString(),
      bottom: Math.round(parseInt(cs.paddingBottom) || 0).toString(),
      left: Math.round(parseInt(cs.paddingLeft) || 0).toString(),
      isLinked: false,
    };
  }
  if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") {
    settings["background_background"] = "classic";
    settings["background_color"] = cs.backgroundColor;
  }
  if (cs.backgroundImage && cs.backgroundImage !== "none") {
    const bgMatch = cs.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
    if (bgMatch) settings["background_image"] = { url: bgMatch[1] };
  }

  return settings;
}

function extractElementorPageData(): Record<string, unknown> {
  const typeEl = document.querySelector("[data-elementor-type]");
  if (!typeEl) return {};

  const pageSettings: Record<string, unknown> = {};
  const dataSettings = typeEl.getAttribute("data-elementor-settings");
  if (dataSettings) {
    try { Object.assign(pageSettings, JSON.parse(dataSettings)); } catch {}
  }

  const pageId = typeEl.getAttribute("data-elementor-id") || "";
  const rawType = typeEl.getAttribute("data-elementor-type") || "wp-post";

  const validTypes: Record<string, string> = {
    "wp-post": "page",
    "wp-page": "page",
    page: "page",
    post: "page",
    section: "section",
    header: "header",
    footer: "footer",
    "error-404": "error-404",
    popup: "popup",
    "wp-template": "page",
    "wp-post-template": "page",
  };
  const pageType = validTypes[rawType] || "page";

  return {
    id: pageId,
    type: pageType,
    settings: pageSettings,
  };
}

function extractWidgetElement(el: HTMLElement): Record<string, unknown> | null {
  const widgetType =
    el.getAttribute("data-widget_type") ||
    el.getAttribute("data-elementor-widget-type") ||
    el.getAttribute("data-elementor-widget") ||
    "";

  if (!widgetType) return null;

  const cleanType = widgetType.split(".")[0];

  const widgetSettings = extractWidgetSettings(el, cleanType);
  const settingsValue: Record<string, unknown> | unknown[] =
    Object.keys(widgetSettings).length > 0 ? widgetSettings : [];

  return {
    id: el.getAttribute("data-id") || generateId(),
    elType: "widget",
    widgetType: cleanType,
    isInner: false,
    settings: settingsValue,
    elements: [],
  };
}

function extractElement(el: HTMLElement): Record<string, unknown> | null {
  const tag = el.tagName.toLowerCase();
  const classes = el.className;
  const isSection = classes.includes("elementor-section");
  const isColumn = classes.includes("elementor-column") || classes.includes("elementor-column-wrap");
  const isRow = classes.includes("elementor-row");
  const isContainer = classes.includes("e-con") || el.getAttribute("data-elementor-type") !== null;

  if (!isSection && !isColumn && !isRow && !isContainer) return null;

  let elType = "container";
  if (isSection) elType = "section";
  if (isColumn) elType = "column";
  if (isRow) elType = "section";

  const containerSettings = extractContainerSettings(el);
  const elementSettings: Record<string, unknown> | unknown[] =
    Object.keys(containerSettings).length > 0 ? containerSettings : [];

  const element: Record<string, unknown> = {
    id: el.getAttribute("data-id") || generateId(),
    elType,
    isInner: classes.includes("elementor-inner-section") || false,
    settings: elementSettings,
    elements: [],
  };

  const childWidgets = el.querySelectorAll(
    ":scope > .elementor-widget"
  );
  const childContainers = el.querySelectorAll(
    ":scope > .elementor-container, :scope > .elementor-column, :scope > .elementor-column-wrap, :scope > .elementor-row, :scope > .e-con, :scope > .e-con-inner"
  );

  const childElements = (element.elements as Record<string, unknown>[]);

  for (const cw of Array.from(childWidgets)) {
    const widgetEl = cw as HTMLElement;
    if (!widgetEl.closest(".elementor-widget-wrap") || widgetEl.closest(".elementor-widget-wrap") === el.querySelector(":scope > .elementor-widget-wrap")) {
      const widget = extractWidgetElement(widgetEl);
      if (widget) childElements.push(widget);
    }
  }

  for (const cc of Array.from(childContainers)) {
    const childEl = cc as HTMLElement;
    if (childEl !== el) {
      const sub = extractElement(childEl);
      if (sub) childElements.push(sub);
    }
  }

  if (childElements.length === 0) {
    const widgetWrap = el.querySelector(".elementor-widget-wrap");
    if (widgetWrap) {
      const innerWidgets = widgetWrap.querySelectorAll(":scope > .elementor-widget");
      for (const iw of Array.from(innerWidgets)) {
        const widget = extractWidgetElement(iw as HTMLElement);
        if (widget) childElements.push(widget);
      }
    }
  }

  return element;
}

function extractFullTemplate(): {
  title: string;
  type: string;
  version: string;
  page_settings: Record<string, unknown> | unknown[];
  content: Record<string, unknown>[];
} {
  const hostname = window.location.hostname;
  const title =
    document.querySelector("h1")?.textContent?.trim() ||
    document.title?.replace(/[-–|].*$/, "").trim() ||
    `Template from ${hostname}`;

  const pageData = extractElementorPageData();

  const content: Record<string, unknown>[] = [];

  const typeEl = document.querySelector("[data-elementor-type]");
  if (typeEl) {
    const directChildren = typeEl.querySelectorAll(
      ":scope > .elementor-section, :scope > .e-con, :scope > .elementor-container"
    );

    for (const child of Array.from(directChildren)) {
      const el = extractElement(child as HTMLElement);
      if (el) content.push(el);
    }

    if (content.length === 0) {
      const containers = typeEl.querySelectorAll(".elementor-section, .e-con");
      const seen = new Set<string>();
      for (const c of Array.from(containers)) {
        const el = extractElement(c as HTMLElement);
        if (el && !seen.has(el.id as string)) {
          seen.add(el.id as string);
          content.push(el);
        }
      }
    }

    if (content.length === 0) {
      const mainContainer: Record<string, unknown> = {
        id: generateId(),
        elType: "container",
        isInner: false,
        settings: {},
        elements: [],
      };

      const widgets = typeEl.querySelectorAll(".elementor-widget");
      for (const w of Array.from(widgets)) {
        const widget = extractWidgetElement(w as HTMLElement);
        if (widget) (mainContainer.elements as Record<string, unknown>[]).push(widget);
      }

      if ((mainContainer.elements as Record<string, unknown>[]).length > 0) {
        content.push(mainContainer);
      }
    }
  }

  const pageSettings = pageData.settings || {};
  const hasPageSettings = pageSettings && typeof pageSettings === "object" && Object.keys(pageSettings).length > 0;

  return {
    title,
    type: String(pageData.type || "page"),
    version: "0.4",
    page_settings: (hasPageSettings ? pageSettings : []) as Record<string, unknown> | unknown[],
    content,
  };
}

function extractAllStyles() {
  const cssVariables: Record<string, string> = {};
  const inlineStyles: string[] = [];
  const stylesheetUrls: string[] = [];

  try {
    const rootStyles = getComputedStyle(document.documentElement);
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      if (prop.startsWith("--")) {
        cssVariables[prop] = rootStyles.getPropertyValue(prop).trim();
      }
    }
  } catch {}

  document.querySelectorAll("style").forEach((tag) => {
    const text = tag.textContent || "";
    if (text.includes("elementor") || text.includes("--e-global-") || text.includes("--e-")) {
      inlineStyles.push(text);
    }
  });

  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (href && (href.includes("elementor") || href.includes("wp-content"))) {
      stylesheetUrls.push(href);
    }
  });

  let sheets: CSSStyleSheet[] = [];
  try {
    sheets = Array.from(document.styleSheets);
  } catch (e) {
    // Cross-origin stylesheets may not be accessible
    console.log("[EleSpy] Could not access document.styleSheets:", e);
  }

  for (const sheet of sheets) {
    try {
      const rules = Array.from(sheet.cssRules || []);
      for (const rule of rules) {
        if (rule instanceof CSSStyleRule && rule.selectorText === ":root") {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            if (prop.startsWith("--e-global-") || prop.startsWith("--e-")) {
              cssVariables[prop] = rule.style.getPropertyValue(prop).trim();
            }
          }
        }
      }
    } catch {}
  }

  const globalColors: Record<string, { _id: string; title: string; color: string }> = {};
  const globalTypography: Record<string, { _id: string; title: string; font_family?: string; font_size?: { unit: string; size: number } }> = {};

  for (const [key, value] of Object.entries(cssVariables)) {
    const colorMatch = key.match(/--e-global-color-([a-zA-Z_-]+)/);
    if (colorMatch) {
      const name = colorMatch[1];
      if (!globalColors[name]) {
        globalColors[name] = { _id: name, title: name.charAt(0).toUpperCase() + name.slice(1), color: value };
      }
    }

    const typoMatch = key.match(/--e-global-typography-([a-zA-Z_-]+)-font-family/);
    if (typoMatch) {
      const name = typoMatch[1];
      if (!globalTypography[name]) globalTypography[name] = { _id: name, title: name.charAt(0).toUpperCase() + name.slice(1) };
      globalTypography[name].font_family = value;
    }

    const sizeMatch = key.match(/--e-global-typography-([a-zA-Z_-]+)-font-size/);
    if (sizeMatch) {
      const name = sizeMatch[1];
      if (!globalTypography[name]) globalTypography[name] = { _id: name, title: name.charAt(0).toUpperCase() + name.slice(1) };
      globalTypography[name].font_size = { unit: "px", size: parseInt(value) || 16 };
    }
  }

  const generatedCSSLines = [":root {"];
  const sorted = Object.entries(cssVariables).sort(([a], [b]) => a.localeCompare(b));
  for (const [key, value] of sorted) {
    generatedCSSLines.push(`  ${key}: ${value};`);
  }
  generatedCSSLines.push("}");

  const template = extractFullTemplate();

  return {
    template,
    server: {
      server: "Unknown",
      technology: "Unknown",
      cdn: null,
      hosting: null,
      phpVersion: null,
      ssl: window.location.protocol === "https:",
    },
    elementor: {
      isElementor: !!document.body.className.match(/elementor/) ||
        !!document.querySelector("[data-elementor-type]") ||
        !!document.querySelector(".elementor-widget"),
      version: null,
      kitId: (document.body.className.match(/elementor-kit-(\d+)/) || [])[1] || null,
      pageId: null,
      isEditMode: document.body.className.includes("elementor-editor"),
      hasPro: !!document.querySelector('.elementor-widget[data-settings*="motion_fx"]'),
      kit: null,
      pageData: null,
    },
    kit: null,
    cssVariables,
    globalColors,
    globalTypography,
    inlineStyles,
    stylesheetUrls,
    generatedCSS: generatedCSSLines.join("\n"),
    rawCSS: inlineStyles.join("\n\n"),
  };
}

// Live section selection - create and inject tooltip
function createSelectionTooltip(): void {
  // Remove existing if any
  const existing = document.getElementById("elespy-selection-tooltip");
  if (existing) existing.remove();

  const tooltip = document.createElement("div");
  tooltip.id = "elespy-selection-tooltip";
  Object.assign(tooltip.style, {
    position: "fixed",
    zIndex: "999999",
    background: "#1a1a1a",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontFamily: "system-ui, sans-serif",
    maxWidth: "300px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    display: "none",
    pointerEvents: "auto",
    cursor: "pointer",
  });

  // Copy button
  const copyBtn = document.createElement("button");
  Object.assign(copyBtn.style, {
    background: "#6366f1",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    marginTop: "8px",
    width: "100%",
  });
  copyBtn.textContent = "Copy Section";

  // Paste button
  const pasteBtn = document.createElement("button");
  Object.assign(pasteBtn.style, {
    background: "#22c55e",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    marginTop: "8px",
    width: "100%",
  });
  pasteBtn.textContent = "Paste to Elementor";

  tooltip.appendChild(copyBtn);
  tooltip.appendChild(pasteBtn);
  document.body.appendChild(tooltip);

  let currentSection: PageSection | null = null;

  // Store ref for access
  (window as unknown as { _elespyTooltip?: { tooltip: HTMLElement; copyBtn: HTMLElement; pasteBtn: HTMLElement; section: PageSection | null } })._elespyTooltip = {
    tooltip: tooltip as HTMLElement,
    copyBtn: copyBtn as HTMLElement,
    pasteBtn: pasteBtn as HTMLElement,
    get section() { return currentSection; },
    set section(v) { currentSection = v; },
  };

  // Copy click handler
  copyBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (currentSection) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(currentSection.element, null, 2));
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy Section"; }, 1500);
      } catch { copyBtn.textContent = "Copy Failed"; }
    }
  });

  // Paste click handler - trigger Elementor paste
  pasteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (currentSection) {
      // Dispatch custom event that Elementor can listen for
      const event = new CustomEvent("elespy:paste-section", {
        detail: { section: currentSection.element },
        bubbles: true,
      });
      document.dispatchEvent(event);

      // Try to paste to clipboard for manual paste
      try {
        await navigator.clipboard.writeText(JSON.stringify(currentSection.element, null, 2));
        pasteBtn.textContent = "Copied! Ready to paste";
        setTimeout(() => { pasteBtn.textContent = "Paste to Elementor"; }, 2000);
      } catch {}
    }
  });

  // Hide on outside click
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!tooltip.contains(target)) {
      tooltip.style.display = "none";
    }
  });

  // Track current section and element
  (window as unknown as { _elespyCurrentSection?: PageSection | null })._elespyCurrentSection = null;
}

// Get current section info
interface PageSection {
  id: string;
  sectionType: string;
  title: string;
  element: Record<string, unknown>;
  rect?: { top: number; left: number; width: number; height: number };
}

// Live hover handler
function initLiveSelection(): void {
  createSelectionTooltip();

  const tooltip = document.getElementById("elespy-selection-tooltip") as HTMLElement | null;
  if (!tooltip) return;

  let hoveredElement: HTMLElement | null = null;
  let highlightEl: HTMLElement | null = null;

  function cleanup() {
    if (highlightEl) {
      highlightEl.style.outline = "";
      highlightEl = null;
    }
  }

  function showTooltip(x: number, y: number, section: PageSection) {
    const tooltipWidth = 200;
    const tooltipHeight = 120;

    // Position next to cursor, avoid overflow
    let left = x + 15;
    let top = y + 15;

    if (left + tooltipWidth > window.innerWidth - 20) {
      left = x - tooltipWidth - 15;
    }
    if (top + tooltipHeight > window.innerHeight - 20) {
      top = y - tooltipHeight - 15;
    }

    // Update content
    const info = document.createElement("div");
    info.innerHTML = `
      <div style="margin-bottom:8px;font-weight:600;color:#a5b4fc;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">${section.sectionType}</div>
      <div style="font-weight:500;margin-bottom:4px;">${section.title || section.id}</div>
      <div style="color:#9ca3af;font-size:11px;">ID: ${section.id}</div>
    `;

    // Insert before buttons
    if (!tooltip) return;
    const copyBtn = tooltip.querySelector("button:first-child")!;
    const pasteBtn = tooltip.querySelector("button:last-child")!;
    if (copyBtn && pasteBtn) {
      tooltip.insertBefore(info, copyBtn);

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.style.display = "block";
    }

    // Store current section
    (window as unknown as { _elespyCurrentSection?: PageSection | null })._elespyCurrentSection = section;
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = "none";
  }

  function getHoveredSection(target: HTMLElement): PageSection | null {
    // Find closest elementor element
    let el: HTMLElement | null = target.closest(".elementor-section, .elementor-container, .e-con, .elementor-column") as HTMLElement | null;

    if (!el) return null;

    const id = el.getAttribute("data-id");
    if (!id) return null;

    const rect = el.getBoundingClientRect();
    const sectionType = el.classList.contains("elementor-section") ? "section" :
      el.classList.contains("e-con") ? "container" :
        el.classList.contains("elementor-column") ? "column" : "element";

    const dataSettings = el.getAttribute("data-settings");
    let title = sectionType;
    try {
      if (dataSettings) {
        const settings = JSON.parse(dataSettings);
        title = settings.section_title || settings._section_title || title;
      }
    } catch {}

    // Get element content structure
    const element: Record<string, unknown> = { id, elType: sectionType };

    // Add widget info
    const widgets = el.querySelectorAll(":scope > .elementor-widget");
    if (widgets.length > 0) {
      (element as { widgets?: string[] }).widgets = Array.from(widgets).map(w =>
        w.getAttribute("data-widget_type")?.split(".")[0] || "unknown"
      ).filter(Boolean);
    }

    return {
      id,
      sectionType,
      title,
      element,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    };
  }

  function highlightSection(el: HTMLElement) {
    cleanup();
    if (!el) return;
    highlightEl = el;
    el.style.outline = "2px solid #6366f1";
    el.style.outlineOffset = "-2px";
  }

  // Mouse move - track hover
  document.addEventListener("mousemove", (e) => {
    const target = e.target as HTMLElement;
    const section = getHoveredSection(target);

    if (section) {
      if (hoveredElement !== target) {
        hoveredElement = target;
        highlightSection(section.element as unknown as HTMLElement);
      }
      showTooltip(e.clientX, e.clientY, section);
    } else {
      cleanup();
      hoveredElement = null;
      hideTooltip();
    }
  }, { passive: true });

  // Click - show more info and keep open
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const section = getHoveredSection(target);

    if (section && tooltip.style.display === "none") {
      showTooltip(e.clientX, e.clientY, section);
    }
  }, { passive: true });
}

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    let extractionData: unknown = null;
    let techDetectionData: unknown = null;

    function detectWordPress(): boolean {
      if (document.querySelector('meta[name="generator"]*[content*="WordPress"]')) return true;
      if (document.querySelector('link[href*="/wp-content/"]')) return true;
      if (document.querySelector('script[src*="/wp-includes/"]')) return true;
      if (document.querySelector('link[href*="/wp-includes/"]')) return true;
      return false;
    }

    function detectElementor(): boolean {
      if (document.body.className.includes("elementor-page")) return true;
      if (document.querySelector("[data-elementor-type]")) return true;
      if (document.querySelector(".elementor-widget-wrap")) return true;
      if (document.querySelector(".elementor-widget")) return true;
      if (document.querySelector(".elementor-section")) return true;
      if (document.querySelector(".elementor-column")) return true;
      if (document.querySelector('link[href*="/elementor/"]')) return true;
      if (document.querySelector('script[src*="elementor"]')) return true;
      return false;
    }

    function detectKitId(): string | null {
      const match = document.body.className.match(/elementor-kit-(\d+)/);
      return match ? match[1] : null;
    }

    chrome.runtime.onMessage.addListener(
      (
        request: { type: string; format?: string; sectionIds?: string[] },
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: unknown) => void
      ) => {
        if (request.type === "detect") {
          sendResponse({
            isWordPress: detectWordPress(),
            isElementor: detectElementor(),
            kitId: detectKitId(),
            url: window.location.href,
          });
          return true;
        }

        if (request.type === "detectAll") {
          detectAllTechnologies(window.location.href)
            .then((data) => {
              techDetectionData = data;
              sendResponse({ success: true, data });
            })
            .catch((err) => {
              sendResponse({ success: false, error: String(err) });
            });
          return true;
        }

        if (request.type === "extract") {
          try {
            const data = extractAllStyles();
            extractionData = data;
            sendResponse({ success: true, data });
          } catch (err) {
            sendResponse({ success: false, error: String(err) });
          }
          return true;
        }

        if (request.type === "copy") {
          if (extractionData) {
            navigator.clipboard.writeText(JSON.stringify(extractionData, null, 2))
              .then(() => sendResponse({ success: true }))
              .catch(() => sendResponse({ success: false }));
          } else {
            sendResponse({ success: false });
          }
          return true;
        }

        if (request.type === "getExtraction") {
          sendResponse({ data: extractionData });
          return true;
        }

        if (request.type === "extract:full-kit") {
          console.log("[EleSpy] Starting full kit extraction...");
          extractFullKit()
            .then((result) => {
              console.log("[EleSpy] Extraction result:", result);
              sendResponse({ success: true, data: result });
            })
            .catch((err) => {
              console.log("[EleSpy] Extraction error:", err);
              sendResponse({ success: false, error: String(err) });
            });
          return true;
        }

        // Extract elementor data using injected script - CORRECT architecture
        if (request.type === "extract:elementor") {
          console.log("[EleSpy] Starting extracted elementor data...");

          // Step 1: Create a promise that resolves when we get the data from injected script
          const extractionPromise = new Promise((resolve) => {
            // Handler for message from injected script
            const handler = (event: MessageEvent) => {
              if (event.source !== window) return;
              if (!event.data || event.data.type !== "ELESPY_DATA") return;

              // Clean up listener
              window.removeEventListener("message", handler);

              if (!event.data.success) {
                resolve({ success: false, error: event.data.error || "Extraction failed" });
                return;
              }

              // Got data from page's window - now combine with CSS variables and DOM data
              resolve({
                success: true,
                data: {
                  ...event.data.payload,
                  // CSS variables from content script context
                  cssVariables: extractCSSVariablesFromDOM(),
                  // DOM elements from content script context
                  domElements: extractDOMElementsFromDOM(),
                }
              });
            };

            // Step 2: Listen for the response
            window.addEventListener("message", handler);

            // Step 3: Inject the script into the page
            const script = document.createElement("script");
            script.textContent = getPageExtractorScript();
            (document.head || document.documentElement).appendChild(script);
            script.remove();

            // Step 4: Timeout safety - 5 seconds
            setTimeout(() => {
              window.removeEventListener("message", handler);
              resolve({ success: false, error: "Extraction timed out" });
            }, 5000);
          });

          extractionPromise
            .then((result) => {
              console.log("[EleSpy] Extracted elementor data:", result);
              sendResponse(result);
            })
            .catch((err) => {
              console.log("[EleSpy] Extraction error:", err);
              sendResponse({ success: false, error: String(err) });
            });
          return true;
        }

        // Live section selection - get all elementor sections/containers for selection
        if (request.type === "getSections") {
          const sections = getAllElementorSections();
          sendResponse({ success: true, data: sections });
          return true;
        }

        // Extract selected sections by IDs
        if (request.type === "extractSections") {
          const sectionIds = request.sectionIds as string[] | undefined;
          const sections = extractSelectedSections(sectionIds || []);
          sendResponse({ success: true, data: sections });
          return true;
        }

        // Start live section selection mode
        if (request.type === "startLiveSelection") {
          try {
            initLiveSelection();
            sendResponse({ success: true });
          } catch (err) {
            sendResponse({ success: false, error: String(err) });
          }
          return true;
        }

        // Stop live selection
        if (request.type === "stopLiveSelection") {
          try {
            const tooltip = document.getElementById("elespy-selection-tooltip");
            if (tooltip) tooltip.remove();
            const highlight = document.querySelectorAll("[style*='outline: 2px solid #6366f1']");
            highlight.forEach(el => { (el as HTMLElement).style.outline = ""; });
            sendResponse({ success: true });
          } catch (err) {
            sendResponse({ success: false, error: String(err) });
          }
          return true;
        }

        return false;
      }
    );
  },
});
