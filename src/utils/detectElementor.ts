import type { ElementorData, ElementorKit } from "../types/elementor";

export function detectElementor(): ElementorData {
  const result: ElementorData = {
    isElementor: false,
    version: null,
    kitId: null,
    pageId: null,
    isEditMode: false,
    hasPro: false,
    kit: null,
    pageData: null,
  };

  const body = document.body;
  const bodyClasses = body.className;

  const elementorPage =
    bodyClasses.includes("elementor-page") ||
    !!document.querySelector('[data-elementor-type]') ||
    !!document.querySelector(".elementor-widget-wrap");

  const elementorEdit = bodyClasses.includes("elementor-editor-active") ||
    bodyClasses.includes("elementor-editor-preview");

  const elementorKit = bodyClasses.match(/elementor-kit-(\d+)/);
  if (elementorKit) result.kitId = elementorKit[1];

  const elementorPageId = bodyClasses.match(/page-(\d+)/);
  if (elementorPageId) result.pageId = elementorPageId[1];

  const elementorType = document.querySelector("[data-elementor-type]");
  if (elementorType) {
    const pageType = elementorType.getAttribute("data-elementor-type");
    if (pageType) result.pageId = result.pageId || pageType;
  }

  const proIndicators = document.querySelectorAll(
    '.elementor-widget[data-settings*="motion_fx"], .elementor-widget-theme-post-content, .elementor-widget-n-tabs'
  );
  result.hasPro = proIndicators.length > 0;

  result.isElementor = elementorPage;
  result.isEditMode = elementorEdit;

  const kit = extractKitData();
  result.kit = kit;

  const pageData = extractPageData();
  result.pageData = pageData;

  return result;
}

function extractKitData(): ElementorKit | null {
  const kitId = document.body.className.match(/elementor-kit-(\d+)/);
  if (!kitId) return null;

  const kit: ElementorKit = {
    id: kitId[1],
    title: `Kit ${kitId[1]}`,
    settings: {
      global_colors: extractGlobalColors(),
      global_typography: extractGlobalTypography(),
      css_vars: extractCSSVariables(),
    },
  };

  return kit;
}

function extractGlobalColors() {
  const colors: Record<string, { value: string; name: string }> = {};
  const colorVars = document.documentElement;

  const rootStyles = getComputedStyle(colorVars);
  const varNames = [
    "primary",
    "secondary",
    "text",
    "accent",
    "e-primary",
    "e-secondary",
    "e-text",
    "e-accent",
  ];

  for (const name of varNames) {
    const value = rootStyles.getPropertyValue(`--e-global-color-${name}`).trim();
    if (value) {
      colors[name] = { value, name: name.charAt(0).toUpperCase() + name.slice(1) };
    }
  }

  const allStyles = document.querySelectorAll("style");
  for (const style of allStyles) {
    const text = style.textContent || "";
    const matches = text.matchAll(
      /--e-global-color-([a-zA-Z_-]+)\s*:\s*([^;]+)/g
    );
    for (const match of matches) {
      const varName = match[1];
      const varValue = match[2].trim();
      if (!colors[varName]) {
        colors[varName] = {
          value: varValue,
          name: varName.charAt(0).toUpperCase() + varName.slice(1),
        };
      }
    }
  }

  return colors;
}

function extractGlobalTypography() {
  const typography: Record<string, Record<string, unknown>> = {};
  const rootStyles = getComputedStyle(document.documentElement);

  const fontVars = ["primary", "secondary", "text", "accent"];

  for (const name of fontVars) {
    const family = rootStyles
      .getPropertyValue(`--e-global-typography-${name}-font-family`)
      .trim();
    if (family) {
      typography[name] = {
        font_family: family,
        font_size: {
          unit: "px",
          size: parseInt(
            rootStyles
              .getPropertyValue(`--e-global-typography-${name}-font-size`)
              .trim() || "16"
          ),
        },
      };
    }
  }

  const allStyles = document.querySelectorAll("style");
  for (const style of allStyles) {
    const text = style.textContent || "";
    const familyMatches = text.matchAll(
      /--e-global-typography-([a-zA-Z_-]+)-font-family\s*:\s*([^;]+)/g
    );
    for (const match of familyMatches) {
      const varName = match[1];
      if (!typography[varName]) {
        typography[varName] = { font_family: match[2].trim() };
      }
    }
  }

  return typography;
}

function extractCSSVariables(): Record<string, string> {
  const variables: Record<string, string> = {};
  const rootStyles = getComputedStyle(document.documentElement);

  const sheets = Array.from(document.styleSheets);
  for (const sheet of sheets) {
    try {
      const rules = Array.from(sheet.cssRules || []);
      for (const rule of rules) {
        if (rule instanceof CSSStyleRule && rule.selectorText === ":root") {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            if (prop.startsWith("--e-global-")) {
              variables[prop] = rule.style.getPropertyValue(prop).trim();
            }
          }
        }
      }
    } catch {
      // Cross-origin stylesheet
    }
  }

  for (let i = 0; i < rootStyles.length; i++) {
    const prop = rootStyles[i];
    if (prop.startsWith("--e-global-")) {
      if (!variables[prop]) {
        variables[prop] = rootStyles.getPropertyValue(prop).trim();
      }
    }
  }

  return variables;
}

function extractPageData() {
  const typeElement = document.querySelector("[data-elementor-type]");
  if (!typeElement) return null;

  const settingsStr = typeElement.getAttribute("data-elementor-settings");
  let settings: Record<string, unknown> = {};
  if (settingsStr) {
    try {
      settings = JSON.parse(settingsStr);
    } catch {
      // Invalid JSON
    }
  }

  return {
    id: typeElement.getAttribute("data-elementor-id") || "unknown",
    type: typeElement.getAttribute("data-elementor-type") || "wp-post",
    settings,
    elements: [],
  };
}

function getKitVersion(): string | null {
  const versionScript = document.querySelector(
    'script[src*="elementor"]'
  ) as HTMLScriptElement | null;
  if (versionScript) {
    const match = versionScript.src.match(/ver=([\d.]+)/);
    if (match) return match[1];
  }

  const meta = document.querySelector('meta[name="generator"]');
  if (meta) {
    const content = meta.getAttribute("content") || "";
    const match = content.match(/Elementor\s+([\d.]+)/);
    if (match) return match[1];
  }

  return null;
}
