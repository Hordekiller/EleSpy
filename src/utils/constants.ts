export const EXTENSION_NAME = "EleSpy";
export const EXTENSION_VERSION = "1.0.0";

export const COLORS = {
  primary: "#92003B",
  secondary: "#2271b1",
  accent: "#ff6b35",
  success: "#28a745",
  danger: "#dc3545",
  warning: "#ffc107",
  info: "#17a2b8",
  dark: "#343a40",
  light: "#f8f9fa",
  white: "#ffffff",
  black: "#000000",
} as const;

export const ELEMENTOR_SELECTORS = {
  body: {
    isPage: ".elementor-page",
    isKit: /elementor-kit-(\d+)/,
    isPageId: /page-(\d+)/,
    isEditorActive: ".elementor-editor-active",
    isEditorPreview: ".elementor-editor-preview",
  },
  data: {
    type: "[data-elementor-type]",
    id: "[data-elementor-id]",
    settings: "[data-elementor-settings]",
  },
  styles: {
    kit: 'style[id*="elementor"]',
    inline: 'style:not([id*="elementor"])',
    link: 'link[href*="elementor"]',
    cssVars: ":root",
  },
  widgets: {
    container: ".elementor-container",
    section: ".elementor-section, .elementor-container",
    widget: ".elementor-widget",
    widgetWrap: ".elementor-widget-wrap",
    column: ".elementor-column",
    row: ".elementor-row",
  },
} as const;

export const MESSAGE_TYPES = {
  EXTRACT: "extract",
  DETECT: "detect",
  COPY: "copy",
  DOWNLOAD: "download",
} as const;

export const STORAGE_KEYS = {
  LAST_URL: "elespy:lastUrl",
  LAST_EXTRACTION: "elespy:lastExtraction",
  SETTINGS: "elespy:settings",
} as const;

export const DEFAULT_SETTINGS = {
  autoCopy: false,
  defaultFormat: "json" as const,
  theme: "light" as const,
};
