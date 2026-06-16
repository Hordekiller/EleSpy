import type { ElementorCSSVariable, ExtractorResult } from "../../types/elementor";

function processVariable(
  prop: string,
  value: string,
  source: string,
  collected: Map<string, ElementorCSSVariable>
): void {
  if (!prop.startsWith("--e-")) return;
  if (collected.has(prop)) return;
  collected.set(prop, { name: prop, value, source });
}

export async function extractCSSVariables(): Promise<ExtractorResult<ElementorCSSVariable[]>> {
  const collected = new Map<string, ElementorCSSVariable>();

  try {
    const rootStyles = getComputedStyle(document.documentElement);
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      if (prop.startsWith("--e-")) {
        const value = rootStyles.getPropertyValue(prop).trim();
        processVariable(prop, value, "computed", collected);
      }
    }
  } catch {}

  for (const sheet of Array.from(document.styleSheets)) {
    const source = (sheet as CSSStyleSheet).href || "inline";
    try {
      const rules = Array.from(sheet.cssRules || []);
      for (const rule of rules) {
        if (!(rule instanceof CSSStyleRule)) continue;
        // Search in all selectors
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          if (prop.startsWith("--e-")) {
            const value = rule.style.getPropertyValue(prop).trim();
            processVariable(prop, value, source, collected);
          }
        }
      }
    } catch {}
  }

  const styleTags = document.querySelectorAll("style");
  for (const tag of styleTags) {
    const text = tag.textContent || "";
    const regex = /(--e-[a-zA-Z0-9_-]+)\s*:\s*([^;]+)/g;
    let match = regex.exec(text);
    while (match) {
      processVariable(match[1], match[2].trim(), "inline-style", collected);
      match = regex.exec(text);
    }
  }

  return { success: true, data: Array.from(collected.values()) };
}
