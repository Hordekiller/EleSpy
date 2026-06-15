import type { ExtractedStyles } from "../types/elementor";
import { detectServer } from "./detectServer";
import { detectElementor } from "./detectElementor";

export async function extractStyles(): Promise<ExtractedStyles> {
  const url = window.location.href;

  const [server, elementor] = await Promise.all([
    detectServer(url),
    Promise.resolve(detectElementor()),
  ]);

  const cssVariables = extractAllCSSVariables();
  const inlineStyles = extractInlineStyles();
  const stylesheetUrls = extractStylesheetUrls();
  const rawCSS = extractRawCSS();
  const generatedCSS = generateCleanCSS(elementor.cssVariables || {});

  return {
    server,
    elementor,
    kit: elementor.kit,
    cssVariables,
    globalColors: elementor.kit?.settings.global_colors || {},
    globalTypography: elementor.kit?.settings.global_typography || {},
    inlineStyles,
    stylesheetUrls,
    generatedCSS,
    rawCSS,
  };
}

function extractAllCSSVariables(): Record<string, string> {
  const variables: Record<string, string> = {};
  const rootStyles = getComputedStyle(document.documentElement);

  for (let i = 0; i < rootStyles.length; i++) {
    const prop = rootStyles[i];
    if (prop.startsWith("--")) {
      variables[prop] = rootStyles.getPropertyValue(prop).trim();
    }
  }

  const sheets = Array.from(document.styleSheets);
  for (const sheet of sheets) {
    try {
      const rules = Array.from(sheet.cssRules || []);
      for (const rule of rules) {
        if (rule instanceof CSSStyleRule) {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            if (prop.startsWith("--") && !variables[prop]) {
              variables[prop] = rule.style.getPropertyValue(prop).trim();
            }
          }
        }
      }
    } catch {
      // Cross-origin stylesheet
    }
  }

  return variables;
}

function extractInlineStyles(): string[] {
  const styles: string[] = [];

  const styleTags = document.querySelectorAll("style");
  for (const tag of styleTags) {
    const text = tag.textContent || "";
    if (text.includes("elementor") || text.includes("--e-global-")) {
      styles.push(text);
    }
  }

  return styles;
}

function extractStylesheetUrls(): string[] {
  const urls: string[] = [];
  const links = document.querySelectorAll('link[rel="stylesheet"]');

  for (const link of links) {
    const href = link.getAttribute("href");
    if (href && (href.includes("elementor") || href.includes("wp-content"))) {
      urls.push(href);
    }
  }

  return urls;
}

function extractRawCSS(): string {
  const parts: string[] = [];

  const styleTags = document.querySelectorAll("style");
  for (const tag of styleTags) {
    const text = tag.textContent || "";
    if (text.includes("elementor") || text.includes("--e-global-")) {
      parts.push(text);
    }
  }

  const sheets = Array.from(document.styleSheets);
  for (const sheet of sheets) {
    try {
      const href = (sheet as CSSStyleSheet).href || "";
      if (href.includes("elementor")) {
        const rules = Array.from(sheet.cssRules || []);
        const css = rules.map((r) => r.cssText).join("\n");
        parts.push(css);
      }
    } catch {
      // Cross-origin
    }
  }

  return parts.join("\n\n");
}

function generateCleanCSS(cssVariables: Record<string, string>): string {
  const lines: string[] = [":root {"];

  const sorted = Object.entries(cssVariables).sort(([a], [b]) => a.localeCompare(b));
  for (const [key, value] of sorted) {
    lines.push(`  ${key}: ${value};`);
  }

  lines.push("}");
  return lines.join("\n");
}
