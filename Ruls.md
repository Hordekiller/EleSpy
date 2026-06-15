[6/15/26 9:46 PM] aDmin: # EleSpy — Full Elementor Export Feature Implementation

## Project Context

You are working on EleSpy, a browser extension (Manifest V3, Chrome + Firefox) built with:
- WXT Framework v0.17
- TypeScript (strict mode, no any)
- webext-bridge for message passing between contexts
- Entry points: src/entrypoints/popup/, src/entrypoints/panel/, src/entrypoints/content.ts, src/entrypoints/background.ts
- Types in src/types/, utilities in src/utils/

The extension currently has partial Elementor export. Your task is to implement a complete, production-grade Elementor export system that covers every layer of an Elementor site's design and content.

---

## Goal

Implement a full Elementor export pipeline that extracts everything from a target Elementor site and packages it into a valid, importable Elementor Kit JSON — identical in structure to what Elementor Pro's native "Export Kit" produces.

The exported Kit must be directly importable via:
WordPress Admin → Elementor → Tools → Import/Export Kit

---

## What Must Be Extracted & Exported

### 1. Global Design Tokens

#### 1a. Global Colors
Extract all entries from elementor-globals or the Elementor Kit settings stored in window.elementorFrontendConfig or the REST API at /wp-json/elementor/v1/globals.

Each color must include:
{
  _id: string;        // e.g. "primary"
  title: string;      // e.g. "Primary"
  color: string;      // hex, rgba, or hsl value
}
Also extract custom colors defined outside the kit (from inline styles on <html> or :root as --e-global-color-* CSS variables).

#### 1b. Global Typography
Extract all typography presets:
{
  _id: string;
  title: string;
  typography_typography: string;         // "custom"
  typography_font_family: string;
  typography_font_size: { unit: string; size: number };
  typography_font_weight: string;
  typography_line_height: { unit: string; size: number };
  typography_letter_spacing: { unit: string; size: number };
  typography_font_style: string;
  typography_text_decoration: string;
  typography_text_transform: string;
}
#### 1c. All CSS Variables
Scan document.styleSheets for all --e-global-* custom properties declared on :root or html. Capture variable name, value, and source stylesheet URL.

Also capture:
- --e-global-color-*
- --e-global-typography-*
- Any other --e-* prefixed variables used by the active theme/kit

---

### 2. Site Settings (Global Kit Settings)

Extract the full Elementor site settings object. This is usually available in:
- window.elementorFrontendConfig.settings.page
- Or via REST: /wp-json/elementor/v1/kit-settings (if accessible)

Must include:
- Typography defaults: body font, body size, body weight, headings (H1–H6)
- Layout: content width, element gap
- Lightbox settings
- Buttons: default background, text color, border radius, padding
- Images: border radius, opacity, CSS filters
- Form fields: styling
- WooCommerce settings if present

---

### 3. Widget Styles

For every Elementor widget rendered on the current page, extract:

{
  widgetType: string;       // e.g. "heading", "button", "image"
  elementId: string;        // Elementor element ID (data-id attribute)
  settings: Record<string, unknown>;  // All widget settings from elementorFrontendConfig
  customCSS: string;        // Widget-level custom CSS if any
  classes: string[];        // Applied CSS classes
  responsiveSettings: {
    tablet?: Partial<WidgetSettings>;
    mobile?: Partial<WidgetSettings>;
  };
}
Extract from:
- window.elementorFrontendConfig.elements (if available)
- Or by parsing data-settings attributes on .elementor-element nodes
- Include section, column, and widget hierarchy

---

### 4. Page Templates

For each page/template detected on the current site:
[6/15/26 9:46 PM] aDmin: {
  id: number;
  title: string;
  type: "page" | "section" | "header" | "footer" | "popup" | "single" | "archive" | "search" | "error-404";
  content: ElementorElement[];  // Full Elementor JSON structure
  pageSettings: Record<string, unknown>;
  conditions?: ElementorCondition[];  // Pro: display conditions
}
Extract the page's Elementor JSON from:
- window.elementorFrontendConfig.elementsData (current page)
- Or data-elementor-id + REST API: /wp-json/wp/v2/elementor_library/{id}?context=edit
- Parse the full nested element tree: sections → columns → widgets

---

### 5. Custom CSS

Collect all custom CSS in layers:
1. Global Custom CSS (Elementor → Settings → Custom CSS)
2. Per-page Custom CSS (Page Settings → Custom CSS)
3. Per-widget Custom CSS (Advanced → Custom CSS per element)
4. Theme Builder CSS (if Pro)

---

## Kit JSON Output Format

The final exported file must follow the official Elementor Kit schema:

{
  "version": "1.0",
  "title": "EleSpy Export — {siteDomain}",
  "plugins": [
    { "name": "Elementor", "slug": "elementor", "version": "3.x.x" }
  ],
  "site-settings": {
    "settings": { ...globalKitSettings }
  },
  "content": [
    {
      "id": 0,
      "title": "Page/Template Title",
      "type": "page",
      "status": "publish",
      "content": "[elementor-content-json]",
      "export_link_element_data": {}
    }
  ],
  "wp-content": {
    "templates": [...],
    "taxonomies": {},
    "wp-pages": [...]
  }
}
The `content field for each page must be the **same JSON string format** Elementor uses internally (the _elementor_data post meta value).

---

## Implementation Plan

### Step 1 — Create Types

Create src/types/elementor.ts with full TypeScript interfaces for:
- ElementorKit
- ElementorKitSettings
- ElementorColor
- ElementorTypography
- ElementorElement (recursive: Section → Column → Widget)
- ElementorWidget
- ElementorTemplate
- ElementorCondition
- ElementorCSSVariable
- ExportManifest

No any. Use unknown with type guards where necessary.

---

### Step 2 — Create Extractor Utilities

Create the following files in src/utils/extractors/:

**colorExtractor.ts**
- Read window.elementorFrontendConfig.config.kit.globals.colors
- Fallback: parse :root CSS variables matching --e-global-color-*
- Return ElementorColor[]

**typographyExtractor.ts**
- Read window.elementorFrontendConfig.config.kit.globals.typography
- Fallback: parse --e-global-typography-* CSS variables
- Return ElementorTypography[]

**cssVariableExtractor.ts**
- Iterate all document.styleSheets
- Collect all --e-* custom property declarations
- Handle cross-origin stylesheet errors gracefully (try/catch per sheet)
- Return ElementorCSSVariable[]

**siteSettingsExtractor.ts**
- Read window.elementorFrontendConfig.settings
- Map to Elementor Kit settings schema
- Return ElementorKitSettings

**widgetExtractor.ts**
- Query all .elementor-element[data-id] DOM nodes
- Parse data-settings attribute (JSON.parse)
- Map widget type from data-element_type
- Extract responsive classes (elementor-hidden-*)
- Return ElementorWidget[] with hierarchy preserved

**templateExtractor.ts**
- Read window.elementorFrontendConfig.elementsData for current page
- If REST API accessible: fetch /wp-json/wp/v2/elementor_library to list all templates
- For each: fetch /wp-json/wp/v2/elementor_library/{id}?context=edit and read elementor_data
- Return ElementorTemplate[]

**customCSSExtractor.ts**
- Find <style id="elementor-frontend-inline-css"> and parse
- Find per-page inline styles
- Find per-widget inline styles (.elementor-element-{id} scoped CSS)
- Return structured CSS string per scope

**kitBuilder.ts**
- Accept all extractor outputs
- Assemble the final ElementorKit JSON object
- Validate required fields
- Serialize to JSON string
- Export function: buildKitJSON(data: ExtractorResults): string`

---

### Step 3 — Content Script Integration
[6/15/26 9:46 PM] aDmin: In src/entrypoints/content.ts, add a message handler for "extract:full-kit":

import { onMessage } from "webext-bridge/content-script";
import { extractFullKit } from "../utils/extractors/kitBuilder";

onMessage("extract:full-kit", async () => {
  try {
    const kit = await extractFullKit();
    return { success: true, data: kit };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});
The extractFullKit() function must run all extractors in parallel using Promise.allSettled and gracefully handle partial failures (e.g., REST API blocked, no Pro features).

---

### Step 4 — Side Panel UI

In src/entrypoints/panel/, add a "Full Export" section with:

- "Extract Everything" button → triggers extract:full-kit message
- Progress indicator showing each extractor's status:
  - ✅ Global Colors (N found)
  - ✅ Typography Presets (N found)
  - ✅ CSS Variables (N found)
  - ✅ Site Settings
  - ✅ Widget Styles (N widgets)
  - ✅ Page Templates (N templates)
  - ✅ Custom CSS
- Export as Kit JSON button → kitBuilder.buildKitJSON() → trigger download
- Export as CSS Only button → concatenated CSS variables download
- Copy to Clipboard button for Kit JSON

---

### Step 5 — Download Handler

In src/utils/downloader.ts:

export const downloadJSON = (data: object, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const downloadCSS = (css: string, filename: string): void => {
  const blob = new Blob([css], { type: "text/css" });
  // same pattern
};
---

## Edge Cases to Handle

- Elementor Free vs Pro: Kit export format differs slightly. Detect Pro by checking window.elementorProFrontend existence. Adjust schema accordingly.
- Cross-origin stylesheets: Wrap cssRule iteration in try/catch per stylesheet.
- REST API access: May be blocked. Gracefully degrade — export only what's available from the DOM and window globals.
- Dynamic content: Use MutationObserver if Elementor renders elements lazily (e.g., popup widgets).
- Large pages: Widget extraction on pages with 100+ elements must remain non-blocking. Use requestIdleCallback or chunked processing.
- **No elementorFrontendConfig**: Site may be using Elementor with SCRIPT_DEBUG off. Fallback to DOM parsing onlyEncoded datata**: data-settings may be HTML-entity-encoded. Use DOMParser or innerHTML trick to decode before JSON.parse.

---

## Constraints & Rules (from project Ruls.md)

- **No any** — use unknown with proper type guards
- All async functions use async/await, no raw .then() chains
- Minimize DOM queries — cache querySelectorAll results
- Keep content script lightweight — heavy processing in background if needed
- Follow Conventional Commits: feat: implement full elementor kit export
- File names in kebab-case
- Constants in UPPER_SNAKE_CASE
- Run npm run typecheck && npm run lint before finishing

---

## Definition of Done

- [ ] All 7 extractors implemented and typed
- [ ] kitBuilder.ts assembles valid Elementor Kit JSON
- [ ] Kit JSON passes import in Elementor 3.x+ without errors
- [ ] Side panel shows extraction progress and all export buttons
- [ ] Download works for both Kit JSON and CSS
- [ ] Clipboard copy works
- [ ] Graceful degradation when REST API is unavailable
- [ ] No TypeScript errors (npm run typecheck passes)
- [ ] No lint errors (npm run lint passes)
- [ ] Tested on a real Elementor Free site and a real Elementor Pro site