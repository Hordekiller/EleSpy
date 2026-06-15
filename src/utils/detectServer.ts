import type { ServerInfo } from "../types/elementor";

export async function detectServer(url: string): Promise<ServerInfo> {
  const result: ServerInfo = {
    server: "Unknown",
    technology: "Unknown",
    cdn: null,
    hosting: null,
    phpVersion: null,
    ssl: url.startsWith("https"),
  };

  try {
    const response = await fetch(url, { method: "HEAD" });
    const headers = response.headers;

    const server = headers.get("server");
    if (server) {
      result.server = server;
      if (server.toLowerCase().includes("cloudflare")) result.cdn = "Cloudflare";
      else if (server.toLowerCase().includes("nginx")) result.server = "Nginx";
      else if (server.toLowerCase().includes("apache")) result.server = "Apache";
      else if (server.toLowerCase().includes("litespeed")) result.server = "LiteSpeed";
    }

    const poweredBy = headers.get("x-powered-by");
    if (poweredBy) {
      result.technology = poweredBy;
      if (poweredBy.toLowerCase().includes("php")) {
        const phpMatch = poweredBy.match(/PHP\/([\d.]+)/);
        if (phpMatch) result.phpVersion = phpMatch[1];
      }
    }

    const via = headers.get("via");
    if (via) {
      if (via.toLowerCase().includes("cloudflare")) result.cdn = "Cloudflare";
      else if (via.toLowerCase().includes("akamai")) result.cdn = "Akamai";
      else if (via.toLowerCase().includes("fastly")) result.cdn = "Fastly";
      else if (via.toLowerCase().includes("varnish")) result.cdn = "Varnish";
    }

    const cfRay = headers.get("cf-ray");
    if (cfRay) result.cdn = "Cloudflare";

    const xCache = headers.get("x-cache");
    if (xCache && xCache.toLowerCase().includes("hit")) {
      result.cdn = result.cdn || "CDN Active";
    }

    const xServedBy = headers.get("x-served-by");
    if (xServedBy) {
      if (xServedBy.toLowerCase().includes("cache")) result.cdn = result.cdn || "CDN";
    }

    if (result.server === "Unknown" && result.technology === "Unknown") {
      const allHeaders = Object.fromEntries(headers.entries());
      if (allHeaders["x-varnish"]) result.cdn = "Varnish";
      if (allHeaders["x-backend-server"]) result.hosting = allHeaders["x-backend-server"];
    }
  } catch {
    result.server = "CORS Restricted";
  }

  return result;
}

export function detectServerFromDOM(): Partial<ServerInfo> {
  const metaGenerator = document.querySelector('meta[name="generator"]');
  const wpContent = document.querySelector('link[href*="/wp-content/"]');
  const cdnPatterns = [
    /cdn\.shopify\.com/,
    /fastly\.net/,
    /cloudfront\.net/,
    /akamaihd\.net/,
    /cloudflare\.com/,
  ];

  const links = Array.from(document.querySelectorAll("link[href]")).map(
    (el) => el.getAttribute("href") || ""
  );

  const scripts = Array.from(document.querySelectorAll("script[src]")).map(
    (el) => el.getAttribute("src") || ""
  );

  const allUrls = [...links, ...scripts];
  let cdn: string | null = null;

  for (const url of allUrls) {
    for (const pattern of cdnPatterns) {
      if (pattern.test(url)) {
        cdn = pattern.source.replace(/\\/g, "").replace(/\.\*/g, "");
        break;
      }
    }
    if (cdn) break;
  }

  return { cdn };
}
