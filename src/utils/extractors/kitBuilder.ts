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
  const progress: KitExtractionProgress[] = [
    { step: "colors", status: "pending" },
    { step: "typography", status: "pending" },
    { step: "cssVariables", status: "pending" },
    { step: "siteSettings", status: "pending" },
    { step: "widgets", status: "pending" },
    { step: "templates", status: "pending" },
    { step: "customCSS", status: "pending" },
  ];

  callback?.(progress);

  try {
    const [colors, typography, cssVariables, siteSettings, widgets, templates, customCSS] =
      await Promise.allSettled([
        runWithProgress(extractColors, "colors", progress, callback),
        runWithProgress(extractTypography, "typography", progress, callback),
        runWithProgress(extractCSSVariables, "cssVariables", progress, callback),
        runWithProgress(extractSiteSettings, "siteSettings", progress, callback),
        runWithProgress(extractWidgets, "widgets", progress, callback),
        runWithProgress(extractTemplates, "templates", progress, callback),
        runWithProgress(extractCustomCSS, "customCSS", progress, callback),
      ]);

    return {
      success: true,
      data: {
        globalColors: colors.status === "fulfilled" ? colors.value : [],
        globalTypography: typography.status === "fulfilled" ? typography.value : [],
        cssVariables: cssVariables.status === "fulfilled" ? cssVariables.value : [],
        siteSettings: siteSettings.status === "fulfilled" ? siteSettings.value : {},
        widgets: widgets.status === "fulfilled" ? widgets.value : [],
        templates: templates.status === "fulfilled" ? templates.value : [],
        customCSS: customCSS.status === "fulfilled" ? customCSS.value : "",
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
    // Ensure content is a valid JSON string that Elementor expects
    let contentStr: string;
    try {
      // If it's already a string, use it; otherwise stringify
      contentStr = typeof t.content === "string" ? t.content : JSON.stringify(t.content);
    } catch {
      contentStr = "[]";
    }

    return {
      id: index + 1,
      title: t.title,
      type: t.type,
      status: "publish",
      content: contentStr,
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
      templates: result.templates,
      taxonomies: {},
      "wp-pages": [],
    },
  };
}

export function buildKitFilename(): string {
  const hostname = window.location.hostname.replace(/[^a-zA-Z0-9.-]/g, "");
  return `elespy-kit-${hostname}.json`;
}
