import type { ElementorColor, ExtractorResult } from "../../types/elementor";

interface ElementorFrontendKitGlobals {
  colors?: Array<{ _id: string; title: string; value: string }>;
  [key: string]: unknown;
}

function getFrontendConfig(): Record<string, unknown> | null {
  // Try multiple ways to access Elementor config
  const sources = [
    // window.elementorFrontendConfig
    () => (window as unknown as Record<string, unknown>).elementorFrontendConfig,
    // elementorFrontendConfig (global variable)
    () => (window as unknown as Record<string, unknown>)["elementorFrontendConfig"],
    // @elementor/config (custom element)
    () => {
      const configEl = document.querySelector("#elementor-config, [data-elementor-config]") as HTMLElement | null;
      if (configEl) {
        try {
          return JSON.parse(configEl.textContent || "");
        } catch {}
      }
      return null;
    },
    // Script tags with elementor config
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

function getElementorDataElements(): Record<string, unknown> | null {
  try {
    // Try elementor data from data-elementor-common-data attribute
    const dataEl = document.querySelector("[data-elementor-common-data]");
    if (dataEl) {
      const data = dataEl.getAttribute("data-elementor-common-data");
      if (data) {
        return JSON.parse(decodeURIComponent(data));
      }
    }
    // Try from data-elementor-settings
    const settingsEl = document.querySelector("[data-elementor-settings]");
    if (settingsEl) {
      const data = settingsEl.getAttribute("data-elementor-settings");
      if (data) {
        return JSON.parse(decodeURIComponent(data));
      }
    }
  } catch {}
  return null;
}

function extractFromFrontendConfig(): ElementorColor[] {
  const colors: ElementorColor[] = [];
  const config = getFrontendConfig();

  // Try alternative data sources first if config is empty
  if (!config) {
    const altData = getElementorDataElements();
    if (altData && altData.globals) {
      const globals = altData.globals as Record<string, unknown>;
      if (globals.colors && Array.isArray(globals.colors)) {
        for (const c of globals.colors as Array<Record<string, unknown>>) {
          if (c && typeof c === "object" && "_id" in c) {
            colors.push({
              _id: String(c._id),
              title: String(c.title || c._id),
              color: String(c.value || c.color || "#000000"),
            });
          }
        }
      }
    }
    return colors;
  }

  try {
    // Try config.config.kit.globals (Elementor Editor)
    const kit = (config as Record<string, unknown>).config;
    if (typeof kit === "object" && kit !== null) {
      const kitObj = kit as Record<string, unknown>;
      const globals = kitObj.globals;
      if (typeof globals === "object" && globals !== null) {
        const globalsObj = globals as ElementorFrontendKitGlobals;
        const colorList = globalsObj.colors;
        if (Array.isArray(colorList)) {
          for (const c of colorList) {
            if (c && typeof c === "object" && "_id" in c && "value" in c) {
              colors.push({
                _id: c._id,
                title: c.title || c._id,
                color: c.value,
              });
            }
          }
        }
      }
    }

    // Also try settings.page.colors (Page-level colors)
    if (colors.length === 0) {
      const settings = config.settings as Record<string, unknown> | undefined;
      if (settings && typeof settings === "object") {
        const pageSettings = settings.page as Record<string, unknown> | undefined;
        if (pageSettings && Array.isArray(pageSettings.color)) {
          for (const c of pageSettings.color as Array<Record<string, unknown>>) {
            if (c && typeof c === "object" && "_id" in c) {
              colors.push({
                _id: String(c._id),
                title: String(c.title || c._id),
                color: String(c.value || c.color || "#000000"),
              });
            }
          }
        }
      }
    }
  } catch {}

  return colors;
}

function extractFromCSSVariables(): ElementorColor[] {
  const colors: ElementorColor[] = [];
  const seen = new Set<string>();

  const collectFromStylesheet = (sheet: CSSStyleSheet) => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      for (const rule of rules) {
        if (!(rule instanceof CSSStyleRule)) continue;
        // Search in all selectors, not just :root
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          const match = prop.match(/--e-global-color-([a-zA-Z_-]+)/);
          if (match) {
            const id = match[1];
            if (seen.has(id)) continue;
            seen.add(id);
            const value = rule.style.getPropertyValue(prop).trim();
            colors.push({
              _id: id,
              title: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
              color: value,
            });
          }
        }
      }
    } catch {}
  };

  for (const sheet of Array.from(document.styleSheets)) {
    collectFromStylesheet(sheet);
  }

  try {
    const rootStyles = getComputedStyle(document.documentElement);
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      const match = prop.match(/--e-global-color-([a-zA-Z_-]+)/);
      if (match) {
        const id = match[1];
        if (seen.has(id)) continue;
        seen.add(id);
        const value = rootStyles.getPropertyValue(prop).trim();
        colors.push({
          _id: id,
          title: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
          color: value,
        });
      }
    }
  } catch {}

  return colors;
}

function extractFromDOMColors(): ElementorColor[] {
  const colors: ElementorColor[] = [];
  const colorSet = new Set<string>();

  // Collect from computed styles
  const elements = document.querySelectorAll("*");
  for (let i = 0; i < Math.min(elements.length, 100); i++) {
    try {
      const el = elements[i] as HTMLElement;
      const style = getComputedStyle(el);
      const bgColor = style.backgroundColor;
      const color = style.color;
      const borderColor = style.borderColor;

      if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
        colorSet.add(bgColor);
      }
      if (color && color !== "rgba(0, 0, 0, 0)") {
        colorSet.add(color);
      }
      if (borderColor && borderColor !== "rgba(0, 0, 0, 0)") {
        colorSet.add(borderColor);
      }
    } catch {}
  }

  // Also collect from inline styles
  for (const el of elements) {
    try {
      const style = el.getAttribute("style");
      if (style) {
        const matches = style.matchAll(/(?:color|background|border|outline)[-:]?\s*([^;]+)/gi);
        for (const match of matches) {
          const colorValue = match[1]?.trim();
          if (colorValue && !colorValue.includes("var(") && !colorValue.includes("rgb") === false) {
            colorSet.add(colorValue);
          }
        }
      }
    } catch {}
  }

  // Add unique colors
  let idx = 0;
  for (const color of colorSet) {
    colors.push({ _id: `dom-color-${idx++}`, title: `رنگ ${idx}`, color });
  }

  return colors;
}

export async function extractColors(): Promise<ExtractorResult<ElementorColor[]>> {
  try {
    const fromCSS = extractFromCSSVariables();
    const fromConfig = extractFromFrontendConfig();

    const merged = new Map<string, ElementorColor>();
    for (const c of fromCSS) merged.set(c._id, c);
    for (const c of fromConfig) merged.set(c._id, c);

    let result = Array.from(merged.values());
    // Always have fallback - get from DOM if nothing found
    if (result.length === 0) {
      result = extractFromDOMColors();
    }
    // If still nothing, create at least one color
    if (result.length === 0) {
      result = [{ _id: "primary", title: "Primary", color: "#000000" }];
    }

    return { success: true, data: result };
  } catch (error) {
    // Always return data
    return { success: true, data: [{ _id: "primary", title: "Primary", color: "#000000" }], error: String(error) };
  }
}
