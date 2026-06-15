import type {
  ElementorKitExport,
  ExtractedStyles,
  ElementorKitSettings,
} from "../types/elementor";

export function generateKitExport(styles: ExtractedStyles): ElementorKitExport {
  const settings: ElementorKitSettings = {
    global_colors: styles.globalColors,
    global_typography: styles.globalTypography,
    css_vars: styles.cssVariables,
  };

  return {
    version: "3.0",
    title: `Extracted Kit - ${window.location.hostname}`,
    type: "kit",
    data: {
      kit: {
        active_breakpoints: ["mobile", "mobile_extra", "tablet", "tablet_extra", "desktop", "widescreen"],
        conditions: {},
        settings,
      },
      global_styles: styles.generatedCSS,
      page_settings: {},
    },
  };
}

export function downloadKitJSON(kitExport: ElementorKitExport): void {
  const blob = new Blob([JSON.stringify(kitExport, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `elespy-kit-${kitExport.data.kit.settings.global_colors.primary?.value?.replace("#", "") || "export"}.json`;
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
  a.download = filename || "elespy-extracted.css";
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

export function generateImportInstructions(kitExport: ElementorKitExport): string {
  const hostname = window.location.hostname;
  const colorCount = Object.keys(kitExport.data.kit.settings.global_colors).length;
  const typoCount = Object.keys(kitExport.data.kit.settings.global_typography).length;
  const varCount = Object.keys(kitExport.data.kit.settings.css_vars).length;

  return `
=== EleSpy Import Instructions ===

Source: ${hostname}
Colors: ${colorCount} | Typography: ${typoCount} | CSS Variables: ${varCount}

Method 1: Elementor Kit Import
1. Save the downloaded .json file
2. Go to WordPress Admin > Elementor > Tools > Import/Export Kit
3. Click "Import Kit"
4. Select the downloaded .json file
5. Choose what to import (Colors, Typography, Global Settings)
6. Click "Import"

Method 2: Manual CSS Import
1. Copy the CSS variables
2. Go to WordPress Admin > Elementor > Settings > Custom CSS
3. Paste the CSS variables in the "Custom CSS" field
4. Save changes

Method 3: Theme Customizer
1. Copy the CSS variables
2. Go to Appearance > Customize > Additional CSS
3. Paste the CSS variables
4. Publish

Note: Some settings may require Elementor Pro for full compatibility.
`.trim();
}
