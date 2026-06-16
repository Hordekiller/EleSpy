import type { ElementorTypography, ExtractorResult } from "../../types/elementor";

interface ElementorFrontendKitGlobals {
  typography?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

function getFrontendConfig(): Record<string, unknown> | null {
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

function getElementorDataElements(): Record<string, unknown> | null {
  try {
    const dataEl = document.querySelector("[data-elementor-common-data]");
    if (dataEl) {
      const data = dataEl.getAttribute("data-elementor-common-data");
      if (data) {
        return JSON.parse(decodeURIComponent(data));
      }
    }
  } catch {}
  return null;
}

function parseTypography(raw: Record<string, unknown>): ElementorTypography {
  const getStr = (key: string): string => {
    const val = raw[key];
    return typeof val === "string" ? val : "";
  };
  const getObj = (key: string): { unit: string; size: number } => {
    const val = raw[key];
    if (typeof val === "object" && val !== null && "unit" in val && "size" in val) {
      return val as { unit: string; size: number };
    }
    return { unit: "px", size: 16 };
  };

  return {
    _id: getStr("_id"),
    title: getStr("title"),
    typography_typography: getStr("typography_typography") || "custom",
    typography_font_family: getStr("typography_font_family"),
    typography_font_size: getObj("typography_font_size"),
    typography_font_weight: getStr("typography_font_weight") || "400",
    typography_line_height: getObj("typography_line_height"),
    typography_letter_spacing: getObj("typography_letter_spacing"),
    typography_font_style: getStr("typography_font_style"),
    typography_text_decoration: getStr("typography_text_decoration"),
    typography_text_transform: getStr("typography_text_transform"),
  };
}

function extractFromFrontendConfig(): ElementorTypography[] {
  const typography: ElementorTypography[] = [];
  const config = getFrontendConfig();

  // Try alternative data sources first if config is empty
  if (!config) {
    const altData = getElementorDataElements();
    if (altData && altData.globals) {
      const globals = altData.globals as Record<string, unknown>;
      if (globals.typography && Array.isArray(globals.typography)) {
        for (const t of globals.typography as Array<Record<string, unknown>>) {
          if (typeof t === "object" && t !== null && "_id" in t) {
            typography.push(parseTypography(t));
          }
        }
      }
    }
    return typography;
  }

  try {
    const kit = (config as Record<string, unknown>).config;
    if (typeof kit === "object" && kit !== null) {
      const kitObj = kit as Record<string, unknown>;
      const globals = kitObj.globals;
      if (typeof globals === "object" && globals !== null) {
        const globalsObj = globals as ElementorFrontendKitGlobals;
        const typoList = globalsObj.typography;
        if (Array.isArray(typoList)) {
          for (const t of typoList) {
            if (typeof t === "object" && t !== null && "_id" in t) {
              typography.push(parseTypography(t));
            }
          }
        }
      }
    }

    // Also try settings.page.typography
    if (typography.length === 0) {
      const settings = config.settings as Record<string, unknown> | undefined;
      if (settings && typeof settings === "object") {
        const pageSettings = settings.page as Record<string, unknown> | undefined;
        if (pageSettings && Array.isArray(pageSettings.typography)) {
          for (const t of pageSettings.typography as Array<Record<string, unknown>>) {
            if (typeof t === "object" && t !== null && "_id" in t) {
              typography.push(parseTypography(t));
            }
          }
        }
      }
    }
  } catch {}

  return typography;
}

function extractFromCSSVariables(): ElementorTypography[] {
  const typography: ElementorTypography[] = [];
  const typoMap = new Map<string, Partial<ElementorTypography>>();

  const processVariable = (prop: string, value: string) => {
    const ffMatch = prop.match(/--e-global-typography-([a-zA-Z_-]+)-font-family/);
    if (ffMatch) {
      const id = ffMatch[1];
      if (!typoMap.has(id)) typoMap.set(id, { _id: id, title: id });
      typoMap.get(id)!.typography_font_family = value;
    }

    const fsMatch = prop.match(/--e-global-typography-([a-zA-Z_-]+)-font-size/);
    if (fsMatch) {
      const id = fsMatch[1];
      if (!typoMap.has(id)) typoMap.set(id, { _id: id, title: id });
      typoMap.get(id)!.typography_font_size = { unit: "px", size: parseInt(value) || 16 };
    }

    const fwMatch = prop.match(/--e-global-typography-([a-zA-Z_-]+)-font-weight/);
    if (fwMatch) {
      const id = fwMatch[1];
      if (!typoMap.has(id)) typoMap.set(id, { _id: id, title: id });
      typoMap.get(id)!.typography_font_weight = value;
    }

    const lhMatch = prop.match(/--e-global-typography-([a-zA-Z_-]+)-line-height/);
    if (lhMatch) {
      const id = lhMatch[1];
      if (!typoMap.has(id)) typoMap.set(id, { _id: id, title: id });
      typoMap.get(id)!.typography_line_height = { unit: "em", size: parseFloat(value) || 1.5 };
    }

    const lsMatch = prop.match(/--e-global-typography-([a-zA-Z_-]+)-letter-spacing/);
    if (lsMatch) {
      const id = lsMatch[1];
      if (!typoMap.has(id)) typoMap.set(id, { _id: id, title: id });
      typoMap.get(id)!.typography_letter_spacing = { unit: "px", size: parseFloat(value) || 0 };
    }
  };

  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (!(rule instanceof CSSStyleRule)) continue;
          // Search in all selectors
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            if (prop.includes("--e-global-typography-")) {
              processVariable(prop, rule.style.getPropertyValue(prop).trim());
            }
          }
        }
      } catch {}
    }
  } catch {}

  try {
    const rootStyles = getComputedStyle(document.documentElement);
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      if (prop.includes("--e-global-typography-")) {
        processVariable(prop, rootStyles.getPropertyValue(prop).trim());
      }
    }
  } catch {}

  for (const [id, partial] of typoMap) {
    typography.push({
      _id: id,
      title: partial.title || id,
      typography_typography: "custom",
      typography_font_family: partial.typography_font_family || "",
      typography_font_size: partial.typography_font_size || { unit: "px", size: 16 },
      typography_font_weight: partial.typography_font_weight || "400",
      typography_line_height: partial.typography_line_height || { unit: "em", size: 1.5 },
      typography_letter_spacing: partial.typography_letter_spacing || { unit: "px", size: 0 },
      typography_font_style: partial.typography_font_style || "",
      typography_text_decoration: partial.typography_text_decoration || "",
      typography_text_transform: partial.typography_text_transform || "",
    });
  }

  // If no global typography found, extract from used fonts in page
  if (typography.length === 0) {
    return extractFromDOMFonts();
  }

  return typography;
}

function extractFromDOMFonts(): ElementorTypography[] {
  const typography: ElementorTypography[] = [];
  const fontMap = new Map<string, { family: string; sizes: Set<number> }>();

  // Scan all elements with computed styles
  const elements = document.querySelectorAll("*");
  const sampleSize = Math.min(elements.length, 100);

  for (let i = 0; i < sampleSize; i++) {
    try {
      const el = elements[i] as HTMLElement;
      const style = getComputedStyle(el);
      const fontFamily = style.fontFamily?.replace(/['"]/g, "").trim();
      const fontSize = parseInt(style.fontSize);

      if (fontFamily && fontSize) {
        if (!fontMap.has(fontFamily)) {
          fontMap.set(fontFamily, { family: fontFamily, sizes: new Set() });
        }
        fontMap.get(fontFamily)!.sizes.add(fontSize);
      }
    } catch {}
  }

  let idx = 0;
  for (const [family, data] of fontMap) {
    const sizes = Array.from(data.sizes).sort((a, b) => b - a);
    typography.push({
      _id: `custom-${idx++}`,
      title: family,
      typography_typography: "custom",
      typography_font_family: family,
      typography_font_size: { unit: "px", size: sizes[0] || 16 },
      typography_font_weight: "400",
      typography_line_height: { unit: "em", size: 1.5 },
      typography_letter_spacing: { unit: "px", size: 0 },
      typography_font_style: "",
      typography_text_decoration: "",
      typography_text_transform: "",
    });
  }

  return typography;
}

export async function extractTypography(): Promise<ExtractorResult<ElementorTypography[]>> {
  try {
    // Priority: CSS variables are most reliable on frontend
    const fromCSS = extractFromCSSVariables();
    const fromConfig = extractFromFrontendConfig();

    const merged = new Map<string, ElementorTypography>();
    for (const t of fromCSS) merged.set(t._id, t);
    for (const t of fromConfig) merged.set(t._id, t);

    let result = Array.from(merged.values());
    // Fallback to DOM if no global typography found
    if (result.length === 0) {
      result = extractFromDOMFonts();
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: true, data: extractFromDOMFonts(), error: String(error) };
  }
}
