import { detectAllTechnologies } from "../detectors";
import { extractFullKit } from "../utils/extractors/kitBuilder";

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

  const sheets = Array.from(document.styleSheets);
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
        request: { type: string; format?: string },
        _sender,
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
          extractFullKit()
            .then((result) => {
              sendResponse({ success: true, data: result });
            })
            .catch((err) => {
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

        return false;
      }
    );
  },
});
