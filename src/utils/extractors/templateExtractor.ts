import type { ElementorTemplate, ExtractorResult } from "../../types/elementor";
import { normalizeElementorTemplate, stringifyElementorContent } from "../elementorTemplateNormalizer";

function getWindowElementorData(): Record<string, unknown> | null {
  // Try multiple ways to access Elementor config
  const sources = [
    () => (window as unknown as Record<string, unknown>).elementorFrontendConfig,
    () => (window as unknown as Record<string, unknown>)["elementorFrontendConfig"],
    () => {
      const configEl = document.querySelector("#elementor-config, [data-elementor-config]") as HTMLElement | null;
      if (configEl) {
        try {
          return JSON.parse(configEl.textContent || "");
        } catch {}
      }
      return null;
    },
    () => {
      const scripts = document.querySelectorAll('script[type*="elementor"]');
      for (const script of Array.from(scripts)) {
        try {
          const data = JSON.parse(script.textContent || "");
          if (data && typeof data === "object" && "config" in data) return data;
        } catch {}
      }
      return null;
    },
  ];
  for (const tryFn of sources) {
    try {
      const result = tryFn();
      if (typeof result === "object" && result !== null) return result as Record<string, unknown>;
    } catch {}
  }
  return null;
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

function parseSettingsAttribute(el: HTMLElement): Record<string, unknown> {
  const dataSettings = el.getAttribute("data-settings");
  if (!dataSettings) return {};

  try {
    return JSON.parse(decodeHtmlEntities(dataSettings));
  } catch {
    try {
      return JSON.parse(dataSettings);
    } catch {
      return {};
    }
  }
}

function cleanHtml(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html || "";
  template.content.querySelectorAll("script, noscript, style, link, meta").forEach((el) => el.remove());
  return template.innerHTML.trim();
}

function getWidgetContainer(el: HTMLElement): HTMLElement {
  return (
    (el.querySelector(":scope > .elementor-widget-container") as HTMLElement | null) ||
    (el.querySelector(".elementor-widget-container") as HTMLElement | null) ||
    el
  );
}

function isImportableDomElement(el: Element): boolean {
  const htEl = el as HTMLElement;
  const classes = htEl.className || "";

  return (
    classes.includes("elementor-section") ||
    classes.includes("elementor-column") ||
    classes.includes("elementor-widget") ||
    classes.includes("e-con") ||
    htEl.hasAttribute("data-element_type") ||
    htEl.hasAttribute("data-widget_type")
  );
}

function getDirectElementorChildren(root: Element): HTMLElement[] {
  const found: HTMLElement[] = [];

  const visit = (parent: Element) => {
    Array.from(parent.children).forEach((child) => {
      if (isImportableDomElement(child)) {
        found.push(child as HTMLElement);
      } else {
        visit(child);
      }
    });
  };

  visit(root);
  return Array.from(new Set(found));
}

function extractWidgetSettingsFromDOM(el: HTMLElement, widgetType: string): Record<string, unknown> {
  const settings = parseSettingsAttribute(el);
  const container = getWidgetContainer(el);
  const html = cleanHtml(container.innerHTML);

  switch (widgetType) {
    case "heading": {
      const heading = container.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading) {
        settings.title = heading.textContent?.trim() || "";
        settings.header_size = heading.tagName.toLowerCase();
      }
      break;
    }
    case "text-editor":
    case "editor":
      settings.editor = html;
      break;
    case "button": {
      const button = container.querySelector("a.elementor-button, .elementor-button, a[href]");
      settings.text = button?.textContent?.trim() || el.textContent?.trim() || "Click Here";
      const href = button?.getAttribute("href");
      if (href) {
        settings.link = {
          url: href,
          is_external: button?.getAttribute("target") === "_blank",
          nofollow: (button?.getAttribute("rel") || "").split(/\s+/).includes("nofollow"),
        };
      }
      break;
    }
    case "image": {
      const image = container.querySelector("img");
      if (image) {
        settings.image = {
          url: (image as HTMLImageElement).currentSrc || image.getAttribute("src") || "",
          id: "",
          size: "",
          alt: image.getAttribute("alt") || "",
          source: "library",
        };
        settings.image_size = "full";
      }
      break;
    }
    case "video": {
      const media = container.querySelector("iframe, video, embed") as HTMLIFrameElement | HTMLVideoElement | null;
      const source = media?.getAttribute("src") || ("currentSrc" in (media || {}) ? (media as HTMLVideoElement).currentSrc : "");
      if (source?.includes("youtube")) {
        settings.video_type = "youtube";
        settings.youtube_url = source;
      } else if (source?.includes("vimeo")) {
        settings.video_type = "vimeo";
        settings.vimeo_url = source;
      } else if (source) {
        settings.video_type = "hosted";
        settings.hosted_url = { url: source };
      }
      break;
    }
    case "tabs":
    case "accordion":
    case "toggle": {
      const titles = Array.from(container.querySelectorAll(".elementor-tab-title"));
      const contents = Array.from(container.querySelectorAll(".elementor-tab-content"));
      if (titles.length) {
        settings.tabs = titles.map((title, index) => ({
          tab_title: title.textContent?.trim() || `Item ${index + 1}`,
          tab_content: cleanHtml((contents[index] as HTMLElement | undefined)?.innerHTML || ""),
        }));
      }
      break;
    }
    case "icon-list": {
      const items = Array.from(container.querySelectorAll(".elementor-icon-list-item, li"));
      if (items.length) {
        settings.icon_list = items.map((item) => {
          const link = item.querySelector("a[href]");
          return {
            text: item.textContent?.trim() || "",
            link: { url: link?.getAttribute("href") || "" },
            selected_icon: { value: "fas fa-check", library: "fa-solid" },
          };
        });
      }
      break;
    }
    case "html":
      settings.html = html;
      break;
    default:
      if (!Object.keys(settings).length) {
        settings.html = html || el.textContent?.trim() || "";
      }
      break;
  }

  return settings;
}

function extractCurrentPageTemplate(): ElementorTemplate | null {
  // First try to get data from window.elementorFrontendConfig
  const windowData = getWindowElementorData();
  let content: Record<string, unknown>[] = [];
  let pageSettings: Record<string, unknown> = {};
  let pageId = "";
  const title = document.querySelector("h1")?.textContent?.trim() ||
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
    ...toImportableTemplateFields({ title, type: "page", content, pageSettings }),
  } as ElementorTemplate;
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
  const elType = (el.elType as string) || (el.type as string) || "section";
  const elements = (el.elements as Record<string, unknown>[]) || [];

  const result: Record<string, unknown> = {
    id,
    elType,
    isInner: el.isInner as boolean || false,
    settings: Object.keys(settings).length > 0 ? settings : [],
    elements: elements.map(parseElementData).filter(Boolean),
  };

  if (elType === "widget") {
    result.widgetType = (el.widgetType as string) || "html";
  }

  return result;
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

  const settings: Record<string, unknown> = parseSettingsAttribute(el);

  const childElements: Record<string, unknown>[] = [];

  getDirectElementorChildren(el).forEach((child) => {
    const parsed = child.className.includes("elementor-widget")
      ? extractWidgetForTemplate(child)
      : parseElementFromDOM(child);
    if (parsed) childElements.push(parsed);
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

  const directChildren = getDirectElementorChildren(typeEl);

  for (const child of directChildren) {
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
  Object.assign(settings, parseSettingsAttribute(el));

  const elements: Record<string, unknown>[] = [];

  getDirectElementorChildren(el).forEach((childEl) => {
    const child = childEl.className.includes("elementor-widget")
      ? extractWidgetForTemplate(childEl)
      : extractElementForTemplate(childEl);
    if (child) elements.push(child);
  });

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
  const cleanType = widgetType.split(".")[0];
  const settings = extractWidgetSettingsFromDOM(el, cleanType || "html");

  return {
    id: el.getAttribute("data-id") || Math.random().toString(16).substring(2, 10),
    elType: "widget",
    widgetType: cleanType || "html",
    isInner: false,
    settings: Object.keys(settings).length > 0 ? settings : [],
    elements: [],
  };
}

function toImportableTemplateFields(input: {
  title: string;
  type: ElementorTemplate["type"];
  content: unknown;
  pageSettings?: Record<string, unknown>;
}): Omit<ElementorTemplate, "id"> {
  const normalized = normalizeElementorTemplate({
    title: input.title,
    type: input.type,
    pageSettings: input.pageSettings || {},
    content: input.content,
  });

  return {
    title: normalized.title,
    type: normalized.type as ElementorTemplate["type"],
    content: stringifyElementorContent(normalized.content),
    pageSettings: normalized.page_settings as Record<string, unknown>,
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

export interface PageSection {
  id: string;
  sectionType: DetectedSectionType;
  title: string;
  element: Record<string, unknown>;
  rect?: { top: number; left: number; width: number; height: number };
}

function getAllSectionsFromDOM(): PageSection[] {
  const sections: PageSection[] = [];

  // Find all elementor sections, containers, and columns
  const selectors = [
    ".elementor-section",
    ".elementor-container",
    ".e-con",
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of Array.from(elements)) {
      const htEl = el as HTMLElement;
      const id = htEl.getAttribute("data-id") || "";
      if (!id) continue;

      const sectionType = detectSectionType(htEl);
      const rect = htEl.getBoundingClientRect();

      // Get title from settings or generate
      let title = sectionType;
      const dataSettings = htEl.getAttribute("data-settings");
      if (dataSettings) {
        try {
          const settings = JSON.parse(dataSettings);
          title = settings.section_title || settings._section_title || title;
        } catch {}
      }

      sections.push({
        id,
        sectionType,
        title: `${title} (#${id})`,
        element: parseElementFromDOM(htEl) || {},
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      });
    }
  }

  return sections;
}

export function getAllElementorSections(): PageSection[] {
  // Try window data first
  try {
    const win = window as unknown as Record<string, unknown>;
    const efc = win.elementorFrontendConfig as Record<string, unknown> | undefined;
    if (efc && efc.elementsData) {
      const elementsData = efc.elementsData as Record<string, unknown>;
      if (elementsData.jsaps) {
        // Already have window data, but need to map to sections
      }
    }
  } catch {}

  // Fall back to DOM
  return getAllSectionsFromDOM();
}

// Map DetectedSectionType to valid ElementorTemplate.type
function mapToValidTemplateType(detected: DetectedSectionType): ElementorTemplate["type"] {
  const validTypes: ElementorTemplate["type"][] = ["page", "section", "header", "footer", "popup", "single", "archive", "search", "error-404"];
  if (validTypes.includes(detected as ElementorTemplate["type"])) {
    return detected as ElementorTemplate["type"];
  }
  // Default "unknown" to "section"
  return "section";
}

export function extractSelectedSections(sectionIds: string[]): ElementorTemplate[] {
  const templates: ElementorTemplate[] = [];

  if (sectionIds.length === 0) {
    // If no specific sections requested, extract all
    const allSections = getAllElementorSections();
    for (const section of allSections) {
      templates.push({
        id: section.id as unknown as number,
        ...toImportableTemplateFields({
          title: section.title,
          type: mapToValidTemplateType(section.sectionType),
          content: [section.element],
          pageSettings: {},
        }),
      } as ElementorTemplate);
    }
  } else {
    // Extract specific sections by ID
    for (const id of sectionIds) {
      const el = document.querySelector(`[data-id="${id}"]`) as HTMLElement | null;
      if (el) {
        const sectionType = detectSectionType(el);
        templates.push({
          id: id as unknown as number,
          ...toImportableTemplateFields({
            title: `${sectionType} (#${id})`,
            type: mapToValidTemplateType(sectionType),
            content: [parseElementFromDOM(el) || {}],
            pageSettings: {},
          }),
        } as ElementorTemplate);
      }
    }
  }

  return templates;
}
