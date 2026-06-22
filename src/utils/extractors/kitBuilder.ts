import type {
  ElementorColor,
  ElementorTypography,
  ElementorCSSVariable,
  ElementorTemplate,
  ElementorWidget,
  FullKitResult,
  ExtractorResult,
} from "../../types/elementor";
import { extractColors } from "./colorExtractor";
import { extractTypography } from "./typographyExtractor";
import { extractCSSVariables } from "./cssVariableExtractor";
import { extractSiteSettings } from "./siteSettingsExtractor";
import { extractWidgets } from "./widgetExtractor";
import { extractTemplates } from "./templateExtractor";
import { extractCustomCSS } from "./customCSSExtractor";
import { normalizeElementorTemplate, stringifyElementorContent } from "../elementorTemplateNormalizer";

export interface KitExtractionProgress {
  step: string;
  status: "pending" | "running" | "done" | "error";
  count?: number;
  error?: string;
}

export type ProgressCallback = (progress: KitExtractionProgress[]) => void;

async function runWithProgress<T>(
  fn: () => Promise<ExtractorResult<T>>,
  step: string,
  progress: KitExtractionProgress[],
  callback?: ProgressCallback
): Promise<T> {
  if (!Array.isArray(progress)) {
    const result = await fn();
    return result.data;
  }
  const entry = progress.find((p) => p.step === step);
  if (entry) {
    entry.status = "running";
    callback?.(progress);
  }

  const result = await fn();

  if (entry) {
    if (result.success) {
      entry.status = "done";
      if (Array.isArray(result.data)) {
        entry.count = result.data.length;
      }
    } else {
      entry.status = "error";
      entry.error = result.error;
    }
    callback?.(progress);
  }

  return result.data;
}

export async function extractFullKit(
  callback?: ProgressCallback
): Promise<ExtractorResult<FullKitResult>> {
  // Simple direct extraction without complex progress tracking
  try {
    // Run all extractors in parallel
    const results = await Promise.all([
      extractColors(),
      extractTypography(),
      extractCSSVariables(),
      extractSiteSettings(),
      extractWidgets(),
      extractTemplates(),
      extractCustomCSS(),
    ]);

    const [colors, typography, cssVariables, siteSettings, widgets, templates, customCSS] = results;

    // Call callback if provided
    if (callback) {
      callback([
        { step: "colors", status: "done", count: Array.isArray(colors.data) ? colors.data.length : 0 },
        { step: "typography", status: "done", count: Array.isArray(typography.data) ? typography.data.length : 0 },
        { step: "cssVariables", status: "done", count: Array.isArray(cssVariables.data) ? cssVariables.data.length : 0 },
        { step: "siteSettings", status: "done" },
        { step: "widgets", status: "done", count: Array.isArray(widgets.data) ? widgets.data.length : 0 },
        { step: "templates", status: "done", count: Array.isArray(templates.data) ? templates.data.length : 0 },
        { step: "customCSS", status: "done", count: customCSS.data ? 1 : 0 },
      ]);
    }

    return {
      success: true,
      data: {
        globalColors: colors.data || [],
        globalTypography: typography.data || [],
        cssVariables: cssVariables.data || [],
        siteSettings: siteSettings.data || {},
        widgets: widgets.data || [],
        templates: templates.data || [],
        customCSS: customCSS.data || "",
      },
    };
  } catch (error) {
    return { success: false, data: getDefaultResult(), error: String(error) };
  }
}

function getDefaultResult(): FullKitResult {
  return {
    globalColors: [],
    globalTypography: [],
    cssVariables: [],
    siteSettings: {},
    widgets: [],
    templates: [],
    customCSS: "",
  };
}

function mapColorsToKit(colors: ElementorColor[]): {
  system_colors: Array<{ id: string; color: string }>;
  custom_colors: Array<{ id: string; color: string; title: string }>;
} {
  const systemIds = ["primary", "secondary", "text", "accent"];
  const defaults = ["#61CE70", "#D33333", "#54595F", "#7A7A7A"];

  const systemColors: Array<{ id: string; color: string }> = [];
  const customColors: Array<{ id: string; color: string; title: string }> = [];

  for (let i = 0; i < systemIds.length; i++) {
    const found = colors.find((c) => c._id === systemIds[i]);
    systemColors.push({ id: systemIds[i], color: found?.color || defaults[i] });
  }

  for (const c of colors) {
    if (!systemIds.includes(c._id)) {
      customColors.push({ id: c._id, color: c.color, title: c.title });
    }
  }

  return { system_colors: systemColors, custom_colors: customColors };
}

function mapTypographyToKit(typo: ElementorTypography[]): {
  system_typography: Array<Record<string, unknown>>;
  custom_typography: Array<Record<string, unknown>>;
} {
  const systemIds = ["primary", "secondary", "text", "1_primary"];
  const systemTypo: Array<Record<string, unknown>> = [];
  const customTypo: Array<Record<string, unknown>> = [];

  for (let i = 0; i < systemIds.length; i++) {
    const found = typo[i];
    systemTypo.push({
      id: systemIds[i],
      label: "Default",
      color: "",
      typography_typography: found?.typography_typography || "custom",
      typography_font_family: found?.typography_font_family || "",
      typography_font_size: found?.typography_font_size || { unit: "px", size: 16 },
      typography_font_size_tablet: { unit: "px", size: 16 },
      typography_font_size_mobile: { unit: "px", size: 14 },
    });
  }

  for (const t of typo) {
    if (!systemIds.includes(t._id)) {
      customTypo.push({
        id: t._id,
        label: t.title,
        color: "",
        typography_typography: "custom",
        typography_font_family: t.typography_font_family,
        typography_font_size: t.typography_font_size,
        typography_font_weight: t.typography_font_weight,
        typography_line_height: t.typography_line_height,
        typography_letter_spacing: t.typography_letter_spacing,
      });
    }
  }

  return { system_typography: systemTypo, custom_typography: customTypo };
}

export function buildKitJSON(result: FullKitResult): Record<string, unknown> {
  const colors = mapColorsToKit(result.globalColors);
  const typo = mapTypographyToKit(result.globalTypography);

  // Build proper Elementor Kit format - content must be JSON string
  const content = result.templates.map((t, index) => {
    const normalizedTemplate = normalizeElementorTemplate({
      title: t.title,
      type: t.type,
      pageSettings: t.pageSettings,
      content: t.content,
    });

    return {
      id: index + 1,
      title: normalizedTemplate.title,
      type: normalizedTemplate.type,
      status: "publish",
      content: stringifyElementorContent(normalizedTemplate.content),
      "export_link_element_data": {},
    };
  });

  return {
    version: "1.0",
    title: `EleSpy Export — ${typeof window !== "undefined" ? window.location.hostname : "site"}`,
    plugins: [
      { name: "Elementor", slug: "elementor", version: "3.x.x" },
    ],
    "site-settings": {
      settings: {
        ...result.siteSettings,
        // Include design tokens at proper locations for Elementor kit
        system_colors: colors.system_colors,
        custom_colors: colors.custom_colors,
        system_typography: typo.system_typography,
        custom_typography: typo.custom_typography,
      },
    },
    content,
    "wp-content": {
      templates: result.templates.map((template) => {
        const normalized = normalizeElementorTemplate({
          title: template.title,
          type: template.type,
          pageSettings: template.pageSettings,
          content: template.content,
        });

        return {
          ...template,
          title: normalized.title,
          type: normalized.type as typeof template.type,
          content: stringifyElementorContent(normalized.content),
          pageSettings: normalized.page_settings as Record<string, unknown>,
        };
      }),
      taxonomies: {},
      "wp-pages": [],
    },
  };
}

export function buildKitFilename(): string {
  const hostname = window.location.hostname.replace(/[^a-zA-Z0-9.-]/g, "");
  return `elespy-kit-${hostname}.json`;
}
