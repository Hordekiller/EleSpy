import type { ElementorTemplate, ExtractorResult } from "../../types/elementor";

function extractCurrentPageTemplate(): ElementorTemplate | null {
  const typeEl = document.querySelector("[data-elementor-type]");
  if (!typeEl) return null;

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
  const type = validTypes[rawType] || "page";

  const pageId = typeEl.getAttribute("data-elementor-id") || "";
  const title = document.querySelector("h1")?.textContent?.trim() ||
    document.title?.replace(/[-–|].*$/, "").trim() ||
    "Untitled Template";

  const pageSettings: Record<string, unknown> = {};
  const dataSettings = typeEl.getAttribute("data-elementor-settings");
  if (dataSettings) {
    try {
      Object.assign(pageSettings, JSON.parse(dataSettings));
    } catch {}
  }

  const content = extractTemplateContent(typeEl);

  return {
    id: parseInt(pageId) || 0,
    title,
    type,
    content: JSON.stringify(content),
    pageSettings,
  };
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

  const result: Record<string, unknown> = {
    id: el.getAttribute("data-id") || Math.random().toString(36).substring(2, 10),
    elType,
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
    id: el.getAttribute("data-id") || Math.random().toString(36).substring(2, 10),
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
