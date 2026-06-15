export function extractCSSVariablesFromSheet(
  sheet: CSSStyleSheet
): Record<string, string> {
  const variables: Record<string, string> = {};

  try {
    const rules = Array.from(sheet.cssRules || []);
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          if (prop.startsWith("--")) {
            variables[prop] = rule.style.getPropertyValue(prop).trim();
          }
        }
      }
    }
  } catch {
    // Cross-origin stylesheet
  }

  return variables;
}

export function extractCSSVariablesFromAllSheets(): Record<string, string> {
  const variables: Record<string, string> = {};
  const sheets = Array.from(document.styleSheets);

  for (const sheet of sheets) {
    const sheetVars = extractCSSVariablesFromSheet(sheet as CSSStyleSheet);
    Object.assign(variables, sheetVars);
  }

  return variables;
}

export function minifyCSS(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .trim();
}

export function formatCSS(css: string): string {
  let formatted = "";
  let indent = 0;

  const lines = css
    .replace(/\s+/g, " ")
    .replace(/\s*([{}])\s*/g, "$1\n")
    .split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed === "}") {
      indent--;
    }

    formatted += "  ".repeat(indent) + trimmed + "\n";

    if (trimmed.endsWith("{")) {
      indent++;
    }
  }

  return formatted.trim();
}

export function getVariableValue(
  variableName: string,
  el?: Element
): string | null {
  const style = getComputedStyle(el || document.documentElement);
  const value = style.getPropertyValue(variableName).trim();
  return value || null;
}

export function setVariable(
  name: string,
  value: string,
  el?: Element
): void {
  const target = el || document.documentElement;
  (target as HTMLElement).style.setProperty(name, value);
}

export function removeVariable(name: string, el?: Element): void {
  const target = el || document.documentElement;
  (target as HTMLElement).style.removeProperty(name);
}
