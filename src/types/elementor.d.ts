export interface ElementorBreakpoints {
  mobile: number;
  mobile_extra: number;
  tablet: number;
  tablet_extra: number;
  desktop: number;
  widescreen: number;
  ultrawide: number;
}

export interface ElementorColor {
  _id: string;
  title: string;
  color: string;
  value?: string;
  name?: string;
  id?: string;
}

export interface ElementorTypography {
  _id: string;
  title: string;
  typography_typography: string;
  typography_font_family: string;
  typography_font_size: { unit: string; size: number };
  typography_font_weight: string;
  typography_line_height: { unit: string; size: number };
  typography_letter_spacing: { unit: string; size: number };
  typography_font_style: string;
  typography_text_decoration: string;
  typography_text_transform: string;
  font_family?: string;
  font_size?: {
    unit: string;
    size: number;
    tabletSize?: number;
    mobileSize?: number;
  };
  font_weight?: string;
  text_transform?: string;
  font_style?: string;
  text_decoration?: string;
  line_height?: { unit: string; size: number };
  letter_spacing?: { unit: string; size: number };
}

export interface ElementorCSSVariable {
  name: string;
  value: string;
  source: string;
}

export interface ElementorKitSettings {
  global_colors: Record<string, ElementorColor>;
  global_typography: Record<string, ElementorTypography>;
  default_generic_fonts?: string;
  system_fonts?: string[];
  kit_colors?: ElementorColor[];
  kit_typography?: ElementorTypography[];
  css_vars: Record<string, string>;
  typography?: {
    default_typography?: Record<string, ElementorTypography>;
  };
  layout?: {
    content_width?: { unit: string; size: number };
    element_gap?: string;
  };
  lightbox?: Record<string, unknown>;
  buttons?: Record<string, unknown>;
  images?: Record<string, unknown>;
  form_fields?: Record<string, unknown>;
  woocommerce?: Record<string, unknown>;
}

export interface ElementorKit {
  id: string;
  title: string;
  settings: ElementorKitSettings;
}

export interface ElementorWidget {
  id: string;
  widgetType: string;
  elType: "widget";
  isInner: boolean;
  settings: Record<string, unknown>;
  customCSS: string;
  classes: string[];
  responsiveSettings: {
    tablet?: Partial<Record<string, unknown>>;
    mobile?: Partial<Record<string, unknown>>;
  };
  elements: ElementorWidget[];
}

export interface ElementorElement {
  id: string;
  elType: "section" | "column" | "container" | "widget";
  isInner: boolean;
  settings: Record<string, unknown> | unknown[];
  elements: Array<ElementorElement | ElementorWidget>;
  widgetType?: string;
}

export interface ElementorWidgetData {
  id: string;
  elType: string;
  widgetType?: string;
  settings: Record<string, unknown>;
  elements: ElementorWidgetData[];
}

export interface ElementorSectionData {
  id: string;
  elType: "section" | "container";
  settings: Record<string, unknown>;
  elements: ElementorWidgetData[];
}

export interface ElementorPageData {
  id: string;
  type: string;
  settings: Record<string, unknown>;
  elements: ElementorSectionData[];
}

export interface ElementorData {
  isElementor: boolean;
  version: string | null;
  kitId: string | null;
  pageId: string | null;
  isEditMode: boolean;
  hasPro: boolean;
  kit: ElementorKit | null;
  pageData: ElementorPageData | null;
}

export interface ServerInfo {
  server: string;
  technology: string;
  cdn: string | null;
  hosting: string | null;
  phpVersion: string | null;
  ssl: boolean;
}

export interface ExtractedStyles {
  template?: Record<string, unknown>;
  server: ServerInfo;
  elementor: ElementorData;
  kit: ElementorKit | null;
  cssVariables: Record<string, string>;
  globalColors: Record<string, ElementorColor>;
  globalTypography: Record<string, ElementorTypography>;
  inlineStyles: string[];
  stylesheetUrls: string[];
  generatedCSS: string;
  rawCSS: string;
}

export interface ElementorTemplate {
  id: number;
  title: string;
  type: "page" | "section" | "header" | "footer" | "popup" | "single" | "archive" | "search" | "error-404";
  content: string;
  pageSettings: Record<string, unknown>;
  conditions?: ElementorCondition[];
}

export interface ElementorCondition {
  type: string;
  value: string;
  name?: string;
}

export interface ElementorKitExport {
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

export interface ElementorFullKitExport {
  version: string;
  title: string;
  plugins: Array<{ name: string; slug: string; version: string }>;
  "site-settings": {
    settings: Record<string, unknown>;
  };
  content: Array<{
    id: number;
    title: string;
    type: string;
    status: string;
    content: string;
    "export_link_element_data": Record<string, unknown>;
  }>;
  "wp-content": {
    templates: ElementorTemplate[];
    taxonomies: Record<string, unknown>;
    "wp-pages": Array<Record<string, unknown>>;
  };
}

export interface ExtractorResult<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface KitExtractionProgress {
  step: string;
  status: "pending" | "running" | "done" | "error";
  count?: number;
  error?: string;
}

export interface FullKitResult {
  globalColors: ElementorColor[];
  globalTypography: ElementorTypography[];
  cssVariables: ElementorCSSVariable[];
  siteSettings: Record<string, unknown>;
  widgets: ElementorWidget[];
  templates: ElementorTemplate[];
  customCSS: string;
}

export type ExtractionFormat = "json" | "css" | "variables" | "full";

export type TechCategory = {
  id: string;
  name: string;
  items: Array<{
    name: string;
    version?: string;
    confidence: number;
  }>;
};
