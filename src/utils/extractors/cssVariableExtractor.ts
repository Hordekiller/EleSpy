import type { ElementorCSSVariable, ExtractorResult } from "../../types/elementor";

export async function extractCSSVariables(): Promise<ExtractorResult<ElementorCSSVariable[]>> {
  const results: ElementorCSSVariable[] = [];
  const seen = new Set<string>();

  // 1. Collect from computed styles on documentElement
  try {
    const rootStyles = getComputedStyle(document.documentElement);
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      if (prop.startsWith("--e-") && !seen.has(prop)) {
        seen.add(prop);
        const value = rootStyles.getPropertyValue(prop).trim();
        results.push({ name: prop, value, source: "computed" });
      }
    }
  } catch {}

  // 2. Collect from all stylesheets
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules || []);
      for (const rule of rules) {
        if (!(rule instanceof CSSStyleRule)) continue;
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          if (prop.startsWith("--e-") && !seen.has(prop)) {
            seen.add(prop);
            const value = rule.style.getPropertyValue(prop).trim();
            results.push({ name: prop, value, source: "stylesheet" });
          }
        }
      }
    } catch {}
  }

  // 3. Fallback: collect ALL CSS variables if none found
  if (results.length === 0) {
    try {
      const elements = document.querySelectorAll("*");
      for (let i = 0; i < Math.min(elements.length, 50); i++) {
        try {
          const el = elements[i] as HTMLElement;
          const style = getComputedStyle(el);
          for (let j = 0; j < style.length; j++) {
            const prop = style[j];
            if (prop.startsWith("--") && !seen.has(prop)) {
              seen.add(prop);
              const value = style.getPropertyValue(prop).trim();
              results.push({ name: prop, value, source: "fallback" });
            }
          }
        } catch {}
      }
    } catch {}
  }

  return { success: true, data: results };
}