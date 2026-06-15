import type { TechItem, TechCategory, DetectionResult } from "./types";
import { detectFromServerHeader, detectCDN, detectHosting, detectLanguages, detectSSL } from "./server";
import { detectCMS, detectPageBuilder, detectTheme } from "./cms";
import { detectJSFrameworks, detectUILibraries, detectLibraries } from "./javascript";
import { detectAnalytics, detectMarketing, detectFonts } from "./analytics";

export async function detectAllTechnologies(
  url: string
): Promise<DetectionResult> {
  const categories: TechCategory[] = [];

  let html = "";
  let serverHeader = "";
  let headers: Record<string, string> = {};

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    serverHeader = response.headers.get("server") || "";
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    html = await response.text();
  } catch {
    html = document.documentElement.outerHTML;
    serverHeader = "";
    headers = {};
  }

  const sslItems = detectSSL(url);
  categories.push({
    id: "server",
    name: "Server",
    icon: "server",
    items: [...sslItems, ...detectFromServerHeader(serverHeader)],
  });

  const cdnItems = detectCDN(headers);
  categories.push({
    id: "cdn",
    name: "CDN",
    icon: "globe",
    items: cdnItems,
  });

  const cmsItems = detectCMS(html);
  categories.push({
    id: "cms",
    name: "CMS",
    icon: "layout",
    items: cmsItems,
  });

  const builderItems = detectPageBuilder(html);
  categories.push({
    id: "page-builder",
    name: "Page Builder",
    icon: "pen-tool",
    items: builderItems,
  });

  const themeItems = detectTheme(html);
  categories.push({
    id: "theme",
    name: "Theme",
    icon: "palette",
    items: themeItems,
  });

  const languageItems = detectLanguages(headers, html);
  categories.push({
    id: "language",
    name: "Programming Language",
    icon: "code",
    items: languageItems,
  });

  const frameworkItems = detectJSFrameworks(html);
  categories.push({
    id: "js-framework",
    name: "JavaScript Framework",
    icon: "cpu",
    items: frameworkItems,
  });

  const uiItems = detectUILibraries(html);
  categories.push({
    id: "ui-library",
    name: "UI Framework / CSS",
    icon: "layers",
    items: uiItems,
  });

  const libraryItems = detectLibraries(html);
  categories.push({
    id: "library",
    name: "JavaScript Library",
    icon: "package",
    items: libraryItems,
  });

  const analyticsItems = detectAnalytics(html);
  categories.push({
    id: "analytics",
    name: "Analytics",
    icon: "bar-chart",
    items: analyticsItems,
  });

  const marketingItems = detectMarketing(html);
  categories.push({
    id: "marketing",
    name: "Marketing",
    icon: "megaphone",
    items: marketingItems,
  });

  const fontItems = detectFonts(html);
  categories.push({
    id: "fonts",
    name: "Fonts & Icons",
    icon: "type",
    items: fontItems,
  });

  const hostingItems = detectHosting(html, headers);
  categories.push({
    id: "hosting",
    name: "Hosting",
    icon: "server",
    items: hostingItems,
  });

  return {
    url,
    title: document.title,
    categories,
    timestamp: Date.now(),
  };
}
