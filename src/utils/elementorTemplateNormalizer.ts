export type ElementorImportNode = Record<string, unknown> & {
  id: string;
  elType: "section" | "column" | "container" | "widget";
  isInner: boolean;
  settings: Record<string, unknown> | unknown[];
  elements: ElementorImportNode[];
  widgetType?: string;
};

export interface ElementorImportTemplate {
  [key: string]: unknown;
  title: string;
  type: string;
  version: string;
  page_settings: Record<string, unknown> | unknown[];
  content: ElementorImportNode[];
}

export interface ElementorTemplateLike {
  title?: unknown;
  type?: unknown;
  version?: unknown;
  page_settings?: unknown;
  pageSettings?: unknown;
  content?: unknown;
}

const validTemplateTypes = new Set([
  "page",
  "section",
  "header",
  "footer",
  "popup",
  "single",
  "archive",
  "search",
  "error-404",
]);

const validElementTypes = new Set(["section", "column", "container", "widget"]);

const sectionLikeTypes = new Set(["section", "container"]);

const supportedWidgets = new Set([
  "accordion",
  "alert",
  "audio",
  "button",
  "counter",
  "divider",
  "google_maps",
  "heading",
  "html",
  "icon",
  "icon-box",
  "icon-list",
  "image",
  "image-box",
  "image-carousel",
  "menu-anchor",
  "progress",
  "shortcode",
  "social-icons",
  "spacer",
  "star-rating",
  "tabs",
  "testimonial",
  "text-editor",
  "toggle",
  "video",
]);

const widgetAliases: Record<string, string> = {
  editor: "text-editor",
  shortcode: "shortcode",
  shortcodes: "shortcode",
  form: "html",
  "nav-menu": "html",
  "theme-post-title": "heading",
  "theme-site-title": "heading",
  "theme-page-title": "heading",
  "theme-post-content": "text-editor",
  "woocommerce-menu-cart": "html",
  "woocommerce-products": "html",
  posts: "html",
  "loop-grid": "html",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createId(seed: string): string {
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

function uniqueId(seed: string, usedIds: Set<string>): string {
  let id = createId(seed);
  let attempt = 1;

  while (usedIds.has(id)) {
    id = createId(`${seed}:${attempt}`);
    attempt += 1;
  }

  usedIds.add(id);
  return id;
}

function normalizeId(value: unknown, fallback: string, usedIds: Set<string>): string {
  const fromValue = String(value || "")
    .replace(/[^a-fA-F0-9]/g, "")
    .slice(0, 7)
    .toLowerCase();

  if (fromValue && !usedIds.has(fromValue)) {
    usedIds.add(fromValue);
    return fromValue;
  }

  return uniqueId(fallback, usedIds);
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    return JSON.parse(trimmed);
  } catch {
    return [];
  }
}

function normalizeSettings(value: unknown): Record<string, unknown> | unknown[] {
  const parsed = parseMaybeJson(value);

  if (isRecord(parsed)) {
    const clean = Object.entries(parsed).reduce<Record<string, unknown>>((result, [key, setting]) => {
      if (setting !== undefined && setting !== null && setting !== "") result[key] = setting;
      return result;
    }, {});

    return Object.keys(clean).length ? clean : [];
  }

  return [];
}

function normalizeWidgetType(value: unknown, settings: Record<string, unknown> | unknown[]): string {
  const raw = String(value || "").split(".")[0].trim();
  const aliased = widgetAliases[raw] || raw;

  if (supportedWidgets.has(aliased)) return aliased;

  if (isRecord(settings)) {
    if ("title" in settings || "header_size" in settings) return "heading";
    if ("editor" in settings) return "text-editor";
    if ("image" in settings) return "image";
    if ("link" in settings || "text" in settings) return "button";
    if ("youtube_url" in settings || "vimeo_url" in settings || "video_url" in settings) return "video";
  }

  return "html";
}

function settingsToHtml(settings: Record<string, unknown> | unknown[]): string {
  if (!isRecord(settings)) return "";

  if (typeof settings.html === "string") return settings.html;
  if (typeof settings.editor === "string") return settings.editor;
  if (typeof settings.title === "string") return `<h2>${escapeHtml(settings.title)}</h2>`;
  if (typeof settings._text_preview === "string") return escapeHtml(settings._text_preview);

  return "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeElementType(value: unknown): ElementorImportNode["elType"] | null {
  const elType = String(value || "").trim();

  if (validElementTypes.has(elType)) return elType as ElementorImportNode["elType"];
  if (elType === "inner-section") return "section";

  return null;
}

function normalizeNode(
  value: unknown,
  usedIds: Set<string>,
  fallbackPath: string,
): ElementorImportNode | null {
  if (!isRecord(value)) return null;

  const elType = normalizeElementType(value.elType || value.type || value.elementType);
  if (!elType) return null;

  const settings = normalizeSettings(value.settings);
  const id = normalizeId(value.id, `${fallbackPath}:${elType}`, usedIds);
  const rawChildren = Array.isArray(value.elements) ? value.elements : [];
  const elements = rawChildren
    .map((child, index) => normalizeNode(child, usedIds, `${fallbackPath}:${id}:${index}`))
    .filter((child): child is ElementorImportNode => Boolean(child));

  if (elType === "widget") {
    const widgetType = normalizeWidgetType(value.widgetType || value.widget_type, settings);
    const widgetSettings =
      widgetType === "html" && isRecord(settings) && !settings.html
        ? { ...settings, html: settingsToHtml(settings) }
        : settings;

    return {
      id,
      elType,
      widgetType,
      isInner: false,
      settings: widgetSettings,
      elements: [],
    };
  }

  const normalizedSettings = isRecord(settings) ? { ...settings } : settings;

  if (elType === "column" && isRecord(normalizedSettings)) {
    if (!normalizedSettings._column_size) normalizedSettings._column_size = 100;
    if (!("_inline_size" in normalizedSettings)) normalizedSettings._inline_size = null;
  }

  return {
    id,
    elType,
    isInner: Boolean(value.isInner),
    settings: normalizedSettings,
    elements,
  };
}

function makeVirtualColumn(
  elements: ElementorImportNode[],
  usedIds: Set<string>,
  fallbackPath: string,
): ElementorImportNode {
  return {
    id: uniqueId(`${fallbackPath}:column`, usedIds),
    elType: "column",
    isInner: false,
    settings: {
      _column_size: 100,
      _inline_size: null,
    },
    elements,
  };
}

function makeVirtualSection(
  elements: ElementorImportNode[],
  usedIds: Set<string>,
  fallbackPath: string,
): ElementorImportNode {
  return {
    id: uniqueId(`${fallbackPath}:section`, usedIds),
    elType: "section",
    isInner: false,
    settings: [],
    elements: elements.every((element) => element.elType === "column")
      ? elements
      : [makeVirtualColumn(elements, usedIds, `${fallbackPath}:wrapped`)],
  };
}

function normalizeChildrenForSection(
  node: ElementorImportNode,
  usedIds: Set<string>,
  fallbackPath: string,
): ElementorImportNode {
  if (node.elType === "container") return node;
  if (node.elType !== "section") return node;

  const columns = node.elements.filter((child) => child.elType === "column");
  const nonColumns = node.elements.filter((child) => child.elType !== "column");

  return {
    ...node,
    elements: nonColumns.length
      ? [...columns, makeVirtualColumn(nonColumns, usedIds, `${fallbackPath}:${node.id}:orphans`)]
      : columns,
  };
}

function normalizeTopLevelContent(content: ElementorImportNode[], usedIds: Set<string>): ElementorImportNode[] {
  const result: ElementorImportNode[] = [];
  let orphans: ElementorImportNode[] = [];

  const flushOrphans = () => {
    if (!orphans.length) return;
    result.push(makeVirtualSection(orphans, usedIds, `top:${result.length}`));
    orphans = [];
  };

  content.forEach((node, index) => {
    const normalized = normalizeChildrenForSection(node, usedIds, `top:${index}`);

    if (sectionLikeTypes.has(normalized.elType)) {
      flushOrphans();
      result.push(normalized);
    } else {
      orphans.push(normalized);
    }
  });

  flushOrphans();
  return result;
}

export function normalizeElementorContent(content: unknown): ElementorImportNode[] {
  const usedIds = new Set<string>();
  const parsed = parseMaybeJson(content);
  const rawContent = Array.isArray(parsed) ? parsed : isRecord(parsed) ? [parsed] : [];
  const nodes = rawContent
    .map((node, index) => normalizeNode(node, usedIds, `root:${index}`))
    .filter((node): node is ElementorImportNode => Boolean(node));

  return normalizeTopLevelContent(nodes, usedIds);
}

export function normalizeElementorTemplate(template: ElementorTemplateLike): ElementorImportTemplate {
  const title = String(template.title || "EleSpy Extracted Template").slice(0, 120);
  const rawType = String(template.type || "page");
  const type = validTemplateTypes.has(rawType) ? rawType : "page";
  const pageSettings = normalizeSettings(template.page_settings ?? template.pageSettings);

  return {
    title,
    type,
    version: String(template.version || "0.4"),
    page_settings: pageSettings,
    content: normalizeElementorContent(template.content),
  };
}

export function stringifyElementorContent(content: unknown): string {
  return JSON.stringify(normalizeElementorContent(content));
}
