import type { ElementorWidget, ExtractorResult } from "../../types/elementor";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function extractWidgetSettings(el: HTMLElement, widgetType: string): Record<string, unknown> {
  const settings: Record<string, unknown> = {};
  const dataSettings = el.getAttribute("data-settings");
  if (dataSettings) {
    try {
      Object.assign(settings, JSON.parse(dataSettings));
    } catch {}
  }

  const container = el.querySelector(".elementor-widget-container");
  if (!container) return settings;

  const cs = getComputedStyle(el);
  if (cs.paddingTop && cs.paddingTop !== "0px") {
    settings["_padding_top"] = cs.paddingTop;
  }
  if (cs.marginTop && cs.marginTop !== "0px") {
    settings["_margin_top"] = cs.marginTop;
  }

  if (widgetType === "heading") {
    const heading = container.querySelector("h1, h2, h3, h4, h5, h6");
    if (heading) {
      settings["title"] = heading.textContent || "";
      settings["header_size"] = heading.tagName.toLowerCase();
    }
  } else if (widgetType === "button") {
    const btn = container.querySelector("a.elementor-button, .elementor-button");
    if (btn) {
      settings["text"] = btn.textContent?.trim() || "";
      const href = btn.getAttribute("href");
      if (href) settings["link"] = { url: href };
    }
  } else if (widgetType === "image") {
    const img = container.querySelector("img");
    if (img) {
      settings["image"] = { url: img.getAttribute("src") || "", id: "" };
    }
  }

  return settings;
}

function extractCustomCSS(el: HTMLElement): string {
  const id = el.getAttribute("data-id");
  if (!id) return "";

  try {
    const sheets = Array.from(document.styleSheets);
    const cssParts: string[] = [];
    const selector = `.elementor-element-${id}`;

    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule && rule.selectorText && rule.selectorText.includes(selector)) {
            cssParts.push(rule.cssText);
          }
        }
      } catch {}
    }

    return cssParts.join("\n");
  } catch {
    return "";
  }
}

function extractResponsiveClasses(el: HTMLElement): { tablet: boolean; mobile: boolean } {
  const classes = el.className;
  return {
    tablet: classes.includes("elementor-hidden-tablet") || classes.includes("elementor-hidden-tablet_extra"),
    mobile: classes.includes("elementor-hidden-mobile") || classes.includes("elementor-hidden-mobile_extra"),
  };
}

function extractWidget(el: HTMLElement): ElementorWidget | null {
  const widgetType = el.getAttribute("data-widget_type") ||
    el.getAttribute("data-elementor-widget-type") ||
    el.getAttribute("data-elementor-widget") ||
    "";

  if (!widgetType) return null;

  const cleanType = widgetType.split(".")[0];
  const settings = extractWidgetSettings(el, cleanType);
  const customCSS = extractCustomCSS(el);
  const responsive = extractResponsiveClasses(el);
  const classes = Array.from(el.classList);

  return {
    id: el.getAttribute("data-id") || generateId(),
    widgetType: cleanType,
    elType: "widget",
    isInner: el.classList.contains("elementor-widget-child"),
    settings,
    customCSS,
    classes,
    responsiveSettings: {
      tablet: responsive.tablet ? {} : undefined,
      mobile: responsive.mobile ? {} : undefined,
    },
    elements: [],
  };
}

function extractElementsFromDOM(parent: Element): ElementorWidget[] {
  const widgets: ElementorWidget[] = [];
  const widgetElements = parent.querySelectorAll(".elementor-widget[data-id]");

  for (const el of Array.from(widgetElements)) {
    const widget = extractWidget(el as HTMLElement);
    if (widget) widgets.push(widget);
  }

  return widgets;
}

function extractFromFrontendConfig(): ElementorWidget[] {
  const widgets: ElementorWidget[] = [];

  // Try multiple ways to get Elementor config
  let efc: Record<string, unknown> | null = null;
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
  ];
  for (const tryFn of sources) {
    try {
      const result = tryFn();
      if (typeof result === "object" && result !== null) {
        efc = result as Record<string, unknown>;
        break;
      }
    } catch {}
  }
  if (!efc) return widgets;

  try {

    const config = efc as Record<string, unknown>;
    const elements = config.elements;
    if (typeof elements !== "object" || elements === null) return widgets;

    const processElement = (el: Record<string, unknown>): void => {
      if (typeof el !== "object" || el === null) return;
      if ("widgetType" in el && typeof el.widgetType === "string") {
        widgets.push({
          id: typeof el.id === "string" ? el.id : generateId(),
          widgetType: el.widgetType,
          elType: "widget",
          isInner: typeof el.isInner === "boolean" ? el.isInner : false,
          settings: typeof el.settings === "object" && el.settings !== null
            ? el.settings as Record<string, unknown> : {},
          customCSS: typeof el.customCSS === "string" ? el.customCSS : "",
          classes: [],
          responsiveSettings: {},
          elements: [],
        });
      }
      if (Array.isArray(el.elements)) {
        for (const child of el.elements) {
          processElement(child as Record<string, unknown>);
        }
      }
    };

    if (Array.isArray(elements)) {
      for (const el of elements) {
        processElement(el as Record<string, unknown>);
      }
    }
  } catch {}

  return widgets;
}

export async function extractWidgets(): Promise<ExtractorResult<ElementorWidget[]>> {
  try {
    const fromConfig = extractFromFrontendConfig();
    const fromDOM = extractElementsFromDOM(document.body);

    const merged = new Map<string, ElementorWidget>();
    for (const w of fromDOM) merged.set(w.id, w);
    for (const w of fromConfig) {
      if (!merged.has(w.id)) merged.set(w.id, w);
    }

    return { success: true, data: Array.from(merged.values()) };
  } catch (error) {
    return { success: true, data: extractElementsFromDOM(document.body), error: String(error) };
  }
}
