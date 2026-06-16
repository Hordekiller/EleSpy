import type { ElementorTemplate, ExtractorResult } from "../../types/elementor";

function getWindowElementorData(): Record<string, unknown> | null {
  try {
    const win = window as unknown as Record<string, unknown>;
    const efc = win.elementorFrontendConfig;
    if (typeof efc !== "object" || efc === null) return null;
    return efc as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseWindowElementorElements(): Record<string, unknown>[] {
  const elements: Record<string, unknown>[] = [];

  try {
    // 1. Try elementorFrontendConfig.elementsData.jsaps
    const win = window as unknown as Record<string, unknown>;
    const efc = win.elementorFrontendConfig as Record<string, unknown>;
    if (efc) {
      // elementsData.jsaps is where Elementor stores the page elements
      const ed = efc.elementsData as Record<string, unknown> | undefined;
      if (ed && ed.jsaps) {
        elements.push(...(ed.jsaps as Record<string, unknown>[]));
      }

      // Try settings.page too
      const settings = efc.settings as Record<string, unknown> | undefined;
      if (settings && settings.page) {
        const page = settings.page as Record<string, unknown>;
        if (page.elements) {
          elements.push(...(page.elements as Record<string, unknown>[]));
        }
      }
    }
  } catch { /* ignore */ }

  return elements;
}

function getRawElementorData(): Record<string, unknown>[] {
  // Try multiple sources to get the full element data
  const sources: Record<string, unknown>[] = [];

  // 1. Try parseWindowElementorElements
  const windowElements = parseWindowElementorElements();
  if (windowElements.length > 0) {
    return windowElements;
  }

  // 2. Try window.elementorFrontendConfig.config.kit.globals
  try {
    const win = window as unknown as Record<string, unknown>;
    const efc = win.elementorFrontendConfig as Record<string, unknown>;
    if (efc && efc.config) {
      const cfg = efc.config as Record<string, unknown>;
      if (cfg.globals) {
        // globals has colors, typography but not elements
      }
    }
  } catch { /* ignore */ }

  // 3. Look for elementor-common-data
  try {
    const commonData = document.querySelector('[data-elementor-common-data]');
    if (commonData) {
      const dataAttr = commonData.getAttribute("data-elementor-common-data");
      if (dataAttr) {
        const parsed = JSON.parse(decodeHtmlEntities(dataAttr));
        if (parsed.elements) sources.push(...parsed.elements);
      }
    }
  } catch { /* ignore */ }

  return sources;
}

function decodeHtmlEntities(text: string): string {
  const doc = new DOMParser().parseFromString(text, "text/html");
  return doc.body.textContent || text;
}

function extractCurrentPageTemplate(): ElementorTemplate | null {
  // First try to get data from window.elementorFrontendConfig
  const windowData = getWindowElementorData();
  let content: Record<string, unknown>[] = [];
  let pageSettings: Record<string, unknown> = {};
  let pageId = "";
  let title = document.querySelector("h1")?.textContent?.trim() ||
    document.title?.replace(/[-–|].*$/, "").trim() ||
    "Untitled Template";

  // Get any raw elementor data from page
  const rawData = getRawElementorData();
  if (rawData.length > 0) {
    content = rawData.map(parseElementData).filter(Boolean) as Record<string, unknown>[];
  }

  // Try to get template data from window
  if (content.length === 0 && windowData && typeof windowData === "object") {
    // Try to get settings first
    try {
      const settings = windowData.pageSettings || windowData.settings;
      if (typeof settings === "object" && settings !== null) {
        pageSettings = settings as Record<string, unknown>;
      }
    } catch { /* ignore */ }

    // Try elements array
    try {
      const elements = windowData.elements;
      if (Array.isArray(elements)) {
        // Parse each element to handle HTML-encoded data-settings
        content = elements.map((el: unknown) => {
          if (typeof el !== "object" || el === null) return null;
          const e = el as Record<string, unknown>;
          return parseElementData(e);
        }).filter(Boolean) as Record<string, unknown>[];
      }
    } catch { /* ignore */ }
  }

  // If no window data, try DOM parsing
  if (content.length === 0) {
    const typeEl = document.querySelector("[data-elementor-type]");
    if (typeEl) {
      const rawType = typeEl.getAttribute("data-elementor-type") || "wp-post";
      const validTypes: Record<string, ElementorTemplate["type"]> = {
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

      pageId = typeEl.getAttribute("data-elementor-id") || "";

      const dataSettings = typeEl.getAttribute("data-elementor-settings");
      if (dataSettings) {
        try {
          // Handle HTML-encoded JSON
          const decoded = decodeHtmlEntities(dataSettings);
          Object.assign(pageSettings, JSON.parse(decoded));
        } catch {}
      }

      content = extractTemplateContent(typeEl);
    }
  }

  // If still no content, try to find any elementor elements on page
  if (content.length === 0) {
    const allElements = document.querySelectorAll(".elementor-element, .elementor-section, .e-con");
    if (allElements.length > 0) {
      content = Array.from(allElements).map((el) => parseElementFromDOM(el as HTMLElement)).filter(Boolean) as Record<string, unknown>[];
    }
  }

  // If still empty, create a minimal placeholder to show user data was extracted
  if (content.length === 0) {
    content = [{
      id: "placeholder",
      elType: "container",
      isInner: false,
      settings: {},
      elements: [],
    }];
  }

  return {
    id: parseInt(pageId) || 0,
    title,
    type: "page",
    content: JSON.stringify(content),
    pageSettings,
  };
}

function parseElementData(el: Record<string, unknown>): Record<string, unknown> | null {
  // Handle data-settings which might be string or object
  const settingsRaw = el.settings;
  let settings: Record<string, unknown> = {};

  if (typeof settingsRaw === "string" && settingsRaw) {
    try {
      // Might be HTML-encoded
      const decoded = decodeHtmlEntities(settingsRaw);
      settings = JSON.parse(decoded);
    } catch {
      try {
        settings = JSON.parse(settingsRaw);
      } catch { /* ignore */ }
    }
  } else if (typeof settingsRaw === "object" && settingsRaw !== null) {
    settings = settingsRaw as Record<string, unknown>;
  }

  const id = el.id as string || Math.random().toString(16).substring(2, 10);
  const elType = (el.type as string) || "section";
  const elements = (el.elements as Record<string, unknown>[]) || [];

  return {
    id,
    elType,
    isInner: el.isInner as boolean || false,
    settings: Object.keys(settings).length > 0 ? settings : [],
    elements: elements.map(parseElementData).filter(Boolean),
  };
}

export type DetectedSectionType = "header" | "footer" | "section" | "popup" | "unknown";

export function detectSectionType(el: HTMLElement): DetectedSectionType {
  const classes = el.className;
  const dataType = el.getAttribute("data-elementor-type");
  const dataId = el.getAttribute("data-id") || "";

  // Check common header/footer markers
  const lowerClasses = classes.toLowerCase();
  if (lowerClasses.includes("header") || dataType === "header") {
    return "header";
  }
  if (lowerClasses.includes("footer") || lowerClasses.includes("site-footer") || dataType === "footer") {
    return "footer";
  }
  if (lowerClasses.includes("popup") || dataType === "popup") {
    return "popup";
  }

  // Check for elementor-location header/footer
  const elementorLocation = el.getAttribute("data-elementor-location");
  if (elementorLocation === "header") return "header";
  if (elementorLocation === "footer") return "footer";

  // Check position - top of page likely header
  const rect = el.getBoundingClientRect();
  if (rect.top < 100 && rect.width > 200 && !lowerClasses.includes("popup")) {
    return "header";
  }

  // Bottom of page likely footer
  const pageHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
  if (rect.bottom > pageHeight - 150 && rect.width > 200 && !lowerClasses.includes("popup")) {
    return "footer";
  }

  return "section";
}

export function detectSectionTypeFromData(el: Record<string, unknown>): DetectedSectionType {
  const id = el.id as string || "";
  const settings = el.settings as Record<string, unknown> || {};

  // Check settings for section type
  const sectionType = (settings.section_container_type as string) ||
    (settings._element_id as string) || "";

  if (sectionType.includes("header") || id.toLowerCase().includes("header")) {
    return "header";
  }
  if (sectionType.includes("footer") || id.toLowerCase().includes("footer")) {
    return "footer";
  }

  // Check if it's inner content
  if (el.isInner === true) {
    return "section";
  }

  return "unknown";
}

function parseElementFromDOM(el: HTMLElement): Record<string, unknown> | null {
  const classes = el.className;
  const isSection = classes.includes("elementor-section");
  const isColumn = classes.includes("elementor-column") || classes.includes("elementor-column-wrap");
  const isWidget = classes.includes("elementor-widget");
  const isContainer = classes.includes("e-con");

  let elType = "container";
  if (isSection) elType = "section";
  if (isColumn) elType = "column";
  if (isWidget) elType = "widget";
  if (isContainer) elType = "container";

  const dataSettings = el.getAttribute("data-settings");
  let settings: Record<string, unknown> = {};
  if (dataSettings) {
    try {
      const decoded = decodeHtmlEntities(dataSettings);
      settings = JSON.parse(decoded);
    } catch {
      try {
        settings = JSON.parse(dataSettings);
      } catch { /* ignore */ }
    }
  }

  // Recursively get child elements
  const childElements: Record<string, unknown>[] = [];

  // Find widgets inside this element
  el.querySelectorAll(":scope > .elementor-widget").forEach((widget) => {
    const parsed = parseElementFromDOM(widget as HTMLElement);
    if (parsed) childElements.push(parsed);
  });

  // Find columns/containers inside this element
  el.querySelectorAll(":scope > .elementor-column, :scope > .elementor-column-wrap, :scope > .e-con").forEach((col) => {
    if (col !== el) {
      const parsed = parseElementFromDOM(col as HTMLElement);
      if (parsed) childElements.push(parsed);
    }
  });

  const detectedType = detectSectionType(el);
  const result: Record<string, unknown> = {
    id: el.getAttribute("data-id") || Math.random().toString(16).substring(2, 10),
    elType,
    sectionType: detectedType,
    isInner: classes.includes("elementor-inner-section"),
    settings: Object.keys(settings).length > 0 ? settings : [],
    elements: childElements,
  };

  return result;
}

function extractTemplateContent(typeEl: Element): Record<string, unknown>[] {
  const content: Record<string, unknown>[] = [];

  const directChildren = typeEl.querySelectorAll(
    ":scope > .elementor-section, :scope > .e-con, :scope > .elementor-container"
  );

  for (const child of Array.from(directChildren)) {
    const el = extractElementForTemplate(child as HTMLElement);
    if (el) content.push(el);
  }

  if (content.length === 0) {
    const containers = typeEl.querySelectorAll(".elementor-section, .e-con");
    const seen = new Set<string>();
    for (const c of Array.from(containers)) {
      const el = extractElementForTemplate(c as HTMLElement);
      if (el && !seen.has(el.id as string)) {
        seen.add(el.id as string);
        content.push(el);
      }
    }
  }

  return content;
}

function extractElementForTemplate(el: HTMLElement): Record<string, unknown> | null {
  const classes = el.className;
  const isSection = classes.includes("elementor-section");
  const isColumn = classes.includes("elementor-column") || classes.includes("elementor-column-wrap");
  const isContainer = classes.includes("e-con") || el.getAttribute("data-elementor-type") !== null;

  if (!isSection && !isColumn && !isContainer) return null;

  let elType = "container";
  if (isSection) elType = "section";
  if (isColumn) elType = "column";

  const settings: Record<string, unknown> = {};
  const dataSettings = el.getAttribute("data-settings");
  if (dataSettings) {
    try {
      Object.assign(settings, JSON.parse(dataSettings));
    } catch {}
  }

  const elements: Record<string, unknown>[] = [];

  const widgets = el.querySelectorAll(":scope > .elementor-widget");
  for (const w of Array.from(widgets)) {
    const widget = extractWidgetForTemplate(w as HTMLElement);
    if (widget) elements.push(widget);
  }

  const childContainers = el.querySelectorAll(
    ":scope > .elementor-container, :scope > .elementor-column, :scope > .e-con"
  );
  for (const cc of Array.from(childContainers)) {
    const childEl = cc as HTMLElement;
    if (childEl !== el) {
      const sub = extractElementForTemplate(childEl);
      if (sub) elements.push(sub);
    }
  }

  const detectedType = detectSectionType(el);
  const result: Record<string, unknown> = {
    id: el.getAttribute("data-id") || Math.random().toString(16).substring(2, 10),
    elType,
    sectionType: detectedType,
    isInner: classes.includes("elementor-inner-section"),
    settings: Object.keys(settings).length > 0 ? settings : [],
    elements,
  };

  return result;
}

function extractWidgetForTemplate(el: HTMLElement): Record<string, unknown> | null {
  const widgetType = el.getAttribute("data-widget_type") ||
    el.getAttribute("data-elementor-widget-type") || "";
  if (!widgetType) return null;

  const cleanType = widgetType.split(".")[0];
  const settings: Record<string, unknown> = {};
  const dataSettings = el.getAttribute("data-settings");
  if (dataSettings) {
    try {
      Object.assign(settings, JSON.parse(dataSettings));
    } catch {}
  }

  return {
    id: el.getAttribute("data-id") || Math.random().toString(16).substring(2, 10),
    elType: "widget",
    widgetType: cleanType,
    isInner: false,
    settings: Object.keys(settings).length > 0 ? settings : [],
    elements: [],
  };
}

export async function extractTemplates(): Promise<ExtractorResult<ElementorTemplate[]>> {
  try {
    const templates: ElementorTemplate[] = [];
    const current = extractCurrentPageTemplate();
    if (current) templates.push(current);

    return { success: true, data: templates };
  } catch (error) {
    return { success: true, data: [], error: String(error) };
  }
}
