import type { ElementorColor, ExtractorResult } from "../../types/elementor";

interface ElementorFrontendKitGlobals {
  colors?: Array<{ _id: string; title: string; value: string }>;
  [key: string]: unknown;
}

function getFrontendConfig(): Record<string, unknown> | null {
  try {
    const win = window as unknown as Record<string, unknown>;
    const efc = win.elementorFrontendConfig;
    if (typeof efc === "object" && efc !== null) return efc as Record<string, unknown>;
  } catch {}
  return null;
}

function extractFromFrontendConfig(): ElementorColor[] {
  const colors: ElementorColor[] = [];
  const config = getFrontendConfig();
  if (!config) return colors;

  try {
    const kit = (config as Record<string, unknown>).config;
    if (typeof kit !== "object" || kit === null) return colors;
    const kitObj = kit as Record<string, unknown>;
    const globals = kitObj.globals;
    if (typeof globals !== "object" || globals === null) return colors;
    const globalsObj = globals as ElementorFrontendKitGlobals;
    const colorList = globalsObj.colors;
    if (!Array.isArray(colorList)) return colors;

    for (const c of colorList) {
      if (c && typeof c === "object" && "_id" in c && "value" in c) {
        colors.push({
          _id: c._id,
          title: c.title || c._id,
          color: c.value,
        });
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
        if (rule.selectorText !== ":root" && rule.selectorText !== "html") continue;
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

export async function extractColors(): Promise<ExtractorResult<ElementorColor[]>> {
  try {
    const fromConfig = extractFromFrontendConfig();
    const fromCSS = extractFromCSSVariables();

    const merged = new Map<string, ElementorColor>();
    for (const c of fromCSS) merged.set(c._id, c);
    for (const c of fromConfig) merged.set(c._id, c);

    return { success: true, data: Array.from(merged.values()) };
  } catch (error) {
    return { success: true, data: extractFromCSSVariables(), error: String(error) };
  }
}
