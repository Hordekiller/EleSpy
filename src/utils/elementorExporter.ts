import type { ExtractedStyles } from "../types/elementor";
import { normalizeElementorTemplate, type ElementorImportTemplate } from "./elementorTemplateNormalizer";

interface ElementorKitExport {
  version: string;
  title: string;
  type: string;
  data: {
    system_colors: Array<{ id: string; color: string }>;
    custom_colors: Array<{ id: string; color: string; title: string }>;
    system_typography: Array<Record<string, unknown>>;
    custom_typography: Array<Record<string, unknown>>;
    default_generic_fonts: string;
  };
}

export function generateTemplateExport(styles: ExtractedStyles): ElementorImportTemplate {
  if (styles.template && (styles.template as Record<string, unknown>).content) {
    return normalizeElementorTemplate(styles.template);
  }

  return normalizeElementorTemplate({
    title: "EleSpy Extracted Template",
    type: "page",
    version: "0.4",
    page_settings: [],
    content: [],
  });
}

export function generateKitExport(styles: ExtractedStyles): ElementorKitExport {
  const systemColors: Array<{ id: string; color: string }> = [];
  const customColors: Array<{ id: string; color: string; title: string }> = [];
  const systemTypo: Array<Record<string, unknown>> = [];
  const customTypo: Array<Record<string, unknown>> = [];

  const systemColorIds = ["primary", "secondary", "text", "accent"];
  const systemColorDefaults = ["#61CE70", "#D33333", "#54595F", "#7A7A7A"];

  for (let i = 0; i < systemColorIds.length; i++) {
    const id = systemColorIds[i];
    const extracted = styles.globalColors[id];
    systemColors.push({ id, color: extracted?.value || systemColorDefaults[i] });
  }

  for (const [name, color] of Object.entries(styles.globalColors)) {
    if (!systemColorIds.includes(name)) {
      customColors.push({ id: name, color: color.color || color.value || "", title: color.title || color.name || name });
    }
  }

  const systemTypoIds = ["primary", "secondary", "text", "1_primary"];
  for (let i = 0; i < systemTypoIds.length; i++) {
    const id = systemTypoIds[i];
    const entries = Object.values(styles.globalTypography);
    const extracted = entries[i];
    const fontFamily = typeof extracted === "object" && extracted !== null
      ? (extracted as { font_family?: string }).font_family || "" : "";
    systemTypo.push({
      id,
      label: "Default",
      color: "",
      typography_typography: fontFamily ? "custom" : "",
      typography_font_family: fontFamily,
      typography_font_size: { unit: "px", size: 16, sizes: [] },
      typography_font_size_tablet: { unit: "px", size: 16, sizes: [] },
      typography_font_size_mobile: { unit: "px", size: 14, sizes: [] },
    });
  }

  for (const [name, typo] of Object.entries(styles.globalTypography)) {
    if (!systemTypoIds.includes(name)) {
      const fontFamily = typeof typo === "object" && typo !== null
        ? (typo as { font_family?: string }).font_family || "" : "";
      const fontSize = typeof typo === "object" && typo !== null
        ? (typo as { font_size?: { size: number } }).font_size?.size || 16 : 16;
      customTypo.push({
        id: name,
        label: name.charAt(0).toUpperCase() + name.slice(1),
        color: "",
        typography_typography: "custom",
        typography_font_family: fontFamily,
        typography_font_size: { unit: "px", size: fontSize, sizes: [] },
      });
    }
  }

  return {
    version: "1.0",
    title: `EleSpy Kit - ${window.location.hostname}`,
    type: "kit",
    data: {
      system_colors: systemColors,
      custom_colors: customColors,
      system_typography: systemTypo,
      custom_typography: customTypo,
      default_generic_fonts: "",
    },
  };
}

export function downloadTemplateJSON(template: Record<string, unknown>, siteUrl?: string): void {
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const title = (template.title as string) || "template";
  const safeTitle = title.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, "").replace(/\s+/g, "-").substring(0, 50);
  let hostname = "";
  if (siteUrl) {
    try { hostname = new URL(siteUrl).hostname; } catch {}
  }
  const namePrefix = hostname ? `${hostname}-${safeTitle}` : safeTitle;
  a.download = `elespy-${namePrefix}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadKitJSON(kitExport: ElementorKitExport): void {
  const blob = new Blob([JSON.stringify(kitExport, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `elespy-kit-${window.location.hostname}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCSS(css: string, filename?: string): void {
  const blob = new Blob([css], { type: "text/css" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `elespy-${window.location.hostname}.css`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
}

export function generateImportInstructions(): string {
  return `
=== EleSpy Import Instructions ===

--- Method 1: Template Import (Page Layout) ---
1. Download "Template JSON" from Export tab
2. Go to WordPress Admin > Elementor > Templates > Saved Templates
3. Click "Import Templates"
4. Select the downloaded .json file
5. Template appears in your Library
6. Edit any page > Click folder icon > My Templates > Insert

--- Method 2: Kit Import (Colors + Typography) ---
1. Download "Kit JSON" from Export tab
2. Go to WordPress Admin > Elementor > Tools
3. Click "Import/Export Kit" tab
4. Click "Start Import"
5. Select the downloaded .json file
6. Choose what to import
7. Click "Import"

--- Method 3: CSS Variables (Manual) ---
1. Copy CSS Variables from Export tab
2. Go to WordPress Admin > Elementor > Settings
3. Paste in "Custom CSS" field
4. Save

--- Method 4: Theme Customizer ---
1. Copy CSS Variables from Export tab
2. Go to Appearance > Customize > Additional CSS
3. Paste and Publish

Note: Template import preserves page layout and widgets.
Kit import preserves global design system.
`.trim();
}
