import type { ExtractorResult } from "../../types/elementor";

function extractGlobalCustomCSS(): string {
  const parts: string[] = [];

  const sheets = Array.from(document.styleSheets);
  for (const sheet of sheets) {
    try {
      const href = (sheet as CSSStyleSheet).href || "";
      if (href.includes("elementor") && !href.includes("frontend")) {
        const rules = Array.from(sheet.cssRules || []);
        const css = rules.map((r) => r.cssText).join("\n");
        if (css.trim()) parts.push(`/* Source: ${href} */\n${css}`);
      }
    } catch {}
  }

  return parts.join("\n\n");
}

function extractPerPageCustomCSS(): string {
  const parts: string[] = [];

  const styleTags = document.querySelectorAll("style");
  for (const tag of styleTags) {
    const text = tag.textContent || "";
    if (text.includes("elementor-widget") || text.includes(".elementor-element")) {
      const cssRules = text.split("}").filter((r) => r.trim());
      for (const rule of cssRules) {
        if (rule.includes(".elementor-element-")) {
          parts.push(rule + "}");
        }
      }
    }
  }

  return parts.join("\n\n");
}

function extractPerWidgetCustomCSS(): string {
  const parts: string[] = [];
  const seen = new Set<string>();

  const sheets = Array.from(document.styleSheets);
  for (const sheet of sheets) {
    try {
      const rules = Array.from(sheet.cssRules || []);
      for (const rule of rules) {
        if (rule instanceof CSSStyleRule && rule.selectorText) {
          const match = rule.selectorText.match(/\.elementor-element-([a-zA-Z0-9]+)/);
          if (match) {
            const id = match[1];
            if (!seen.has(id)) {
              seen.add(id);
              parts.push(rule.cssText);
            }
          }
        }
      }
    } catch {}
  }

  return parts.join("\n\n");
}

function extractThemeBuilderCSS(): string {
  const parts: string[] = [];

  try {
    const styleTags = document.querySelectorAll("style");
    for (const tag of styleTags) {
      const text = tag.textContent || "";
      if (text.includes("elementor-location") || text.includes("elementor-nav-menu")) {
        parts.push(text);
      }
    }
  } catch {}

  return parts.join("\n\n");
}

export async function extractCustomCSS(): Promise<ExtractorResult<string>> {
  try {
    const global = extractGlobalCustomCSS();
    const perPage = extractPerPageCustomCSS();
    const perWidget = extractPerWidgetCustomCSS();
    const themeBuilder = extractThemeBuilderCSS();

    const allCSS = [
      "/* === Global Custom CSS === */",
      global,
      "\n/* === Per-Page Custom CSS === */",
      perPage,
      "\n/* === Per-Widget Custom CSS === */",
      perWidget,
      "\n/* === Theme Builder CSS === */",
      themeBuilder,
    ].filter((s) => s.trim()).join("\n\n");

    return { success: true, data: allCSS };
  } catch (error) {
    return { success: true, data: "", error: String(error) };
  }
}
