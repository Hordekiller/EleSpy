import type { ExtractorResult } from "../../types/elementor";

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

function extractFromFrontendConfig(): Record<string, unknown> | null {
  const config = getFrontendConfig();
  if (!config) return null;

  try {
    const settings = (config as Record<string, unknown>).settings;
    if (typeof settings === "object" && settings !== null) {
      return settings as Record<string, unknown>;
    }
  } catch {}

  return null;
}

function extractFromDOM(): Record<string, unknown> {
  const settings: Record<string, unknown> = {};

  try {
    const kitEl = document.querySelector("[data-elementor-type]");
    if (kitEl) {
      const dataSettings = kitEl.getAttribute("data-elementor-settings");
      if (dataSettings) {
        Object.assign(settings, JSON.parse(dataSettings));
      }
    }
  } catch {}

  try {
    const bodyClass = document.body.className;
    const widthMatch = bodyClass.match(/elementor-page-(-?\d+)/);
    if (widthMatch) {
      settings["_page_id"] = widthMatch[1];
    }
  } catch {}

  return settings;
}

function extractTypographySettings(): Record<string, unknown> {
  const typo: Record<string, unknown> = {};

  try {
    const body = document.body;
    const cs = getComputedStyle(body);
    typo["body_font_family"] = cs.fontFamily;
    typo["body_font_size"] = cs.fontSize;
    typo["body_font_weight"] = cs.fontWeight;
    typo["body_line_height"] = cs.lineHeight;
    typo["body_color"] = cs.color;
  } catch {}

  try {
    const h1 = document.querySelector("h1");
    if (h1) {
      const cs = getComputedStyle(h1);
      typo["h1_font_family"] = cs.fontFamily;
      typo["h1_font_size"] = cs.fontSize;
      typo["h1_font_weight"] = cs.fontWeight;
      typo["h1_color"] = cs.color;
    }
  } catch {}

  const headingTags = ["h2", "h3", "h4", "h5", "h6"];
  for (const tag of headingTags) {
    try {
      const el = document.querySelector(tag);
      if (el) {
        const cs = getComputedStyle(el);
        typo[`${tag}_font_family`] = cs.fontFamily;
        typo[`${tag}_font_size`] = cs.fontSize;
        typo[`${tag}_font_weight`] = cs.fontWeight;
        typo[`${tag}_color`] = cs.color;
      }
    } catch {}
  }

  return typo;
}

function extractLayoutSettings(): Record<string, unknown> {
  const layout: Record<string, unknown> = {};

  try {
    const main = document.querySelector(".elementor-section-wrap") ||
      document.querySelector("[data-elementor-type]");
    if (main) {
      const cs = getComputedStyle(main);
      layout["content_width"] = cs.maxWidth || cs.width;
    }
  } catch {}

  return layout;
}

export async function extractSiteSettings(): Promise<ExtractorResult<Record<string, unknown>>> {
  try {
    const fromConfig = extractFromFrontendConfig();
    const fromDOM = extractFromDOM();
    const typography = extractTypographySettings();
    const layout = extractLayoutSettings();

    const merged: Record<string, unknown> = {};
    if (fromConfig) Object.assign(merged, fromConfig);
    Object.assign(merged, fromDOM);
    merged["typography"] = typography;
    merged["layout"] = layout;

    return { success: true, data: merged };
  } catch (error) {
    return { success: true, data: extractFromDOM(), error: String(error) };
  }
}
