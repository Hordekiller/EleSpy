/**
 * Injected Script - Runs in page context to access window.*
 * This script is injected as a string into the page to read page-level globals
 */

/**
 * Returns the source code of the page extractor script
 * This function must be self-contained - no imports, no external references
 */
export function getPageExtractorScript(): string {
  return `
    (function() {
      const config = window.elementorFrontendConfig;
      const pro = window.elementorProFrontend;

      if (!config) {
        window.postMessage({
          type: "ELESPY_DATA",
          success: false,
          error: "elementorFrontendConfig not found — not an Elementor page"
        }, "*");
        return;
      }

      const kit = config.kit || {};
      const kitSettings = kit.settings || {};

      const payload = {
        version: config.version || null,
        isPro: !!pro,
        kitId: kit.id || null,

        // Global Colors
        colors: kitSettings.custom_colors || [],

        // Global Typography
        typography: kitSettings.custom_typography || [],

        // Site Settings (everything else in kitSettings)
        siteSettings: kitSettings,

        // Full page element tree
        elementsData: config.elementsData || [],

        // Raw config for anything we missed
        rawConfig: {
          settings: config.settings || {},
          config: config.config || {},
        }
      };

      window.postMessage({ type: "ELESPY_DATA", success: true, payload }, "*");
    })();
  `;
}