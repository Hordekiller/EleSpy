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
  value: string;
  name: string;
  id?: string;
}

export interface ElementorTypography {
  font_family: string;
  font_size: {
    unit: string;
    size: number;
    tabletSize?: number;
    mobileSize?: number;
  };
  font_weight: string;
  text_transform?: string;
  font_style?: string;
  text_decoration?: string;
  line_height?: {
    unit: string;
    size: number;
  };
  letter_spacing?: {
    unit: string;
    size: number;
  };
}

export interface ElementorKitSettings {
  global_colors: Record<string, ElementorColor>;
  global_typography: Record<string, ElementorTypography>;
  default_generic_fonts?: string;
  system_fonts?: string[];
  kit_colors?: ElementorColor[];
  kit_typography?: ElementorTypography[];
  css_vars: Record<string, string>;
}

export interface ElementorKit {
  id: string;
  title: string;
  settings: ElementorKitSettings;
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

export interface ElementorKitExport {
  version: string;
  title: string;
  type: "kit";
  data: {
    kit: {
      active_breakpoints: string[];
      conditions: Record<string, unknown>;
      settings: ElementorKitSettings;
    };
    global_styles: string;
    page_settings: Record<string, unknown>;
  };
}

export type ExtractionFormat = "json" | "css" | "variables" | "full";
