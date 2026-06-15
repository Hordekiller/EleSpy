import type { TechItem } from "./types";

export function detectServers(): TechItem[] {
  const results: TechItem[] = [];
  const metaGenerator = document.querySelector('meta[name="generator"]');
  const generatorContent = metaGenerator?.getAttribute("content") || "";

  return results;
}

export function detectFromServerHeader(serverHeader: string): TechItem[] {
  const results: TechItem[] = [];
  const server = serverHeader.toLowerCase();

  if (server.includes("nginx")) {
    const versionMatch = server.match(/nginx\/([\d.]+)/);
    results.push({
      name: "Nginx",
      version: versionMatch?.[1],
      confidence: 100,
    });
  } else if (server.includes("apache")) {
    const versionMatch = server.match(/apache\/([\d.]+)/);
    results.push({
      name: "Apache",
      version: versionMatch?.[1],
      confidence: 100,
    });
  } else if (server.includes("litespeed")) {
    const versionMatch = server.match(/litespeed\/([\d.]+)/);
    results.push({
      name: "LiteSpeed",
      version: versionMatch?.[1],
      confidence: 100,
    });
  } else if (server.includes("microsoft-iis")) {
    const versionMatch = server.match(/microsoft-iis\/([\d.]+)/);
    results.push({
      name: "Microsoft IIS",
      version: versionMatch?.[1],
      confidence: 100,
    });
  } else if (server.includes("cloudflare")) {
    results.push({ name: "Cloudflare", confidence: 100 });
  } else if (server.includes("openresty")) {
    results.push({ name: "OpenResty", confidence: 100 });
  } else if (server.includes("caddy")) {
    results.push({ name: "Caddy", confidence: 100 });
  } else if (server.includes("gunicorn")) {
    results.push({ name: "Gunicorn", confidence: 100 });
  } else if (server.includes("uvicorn")) {
    results.push({ name: "Uvicorn", confidence: 100 });
  } else if (server.includes("envoy")) {
    results.push({ name: "Envoy", confidence: 100 });
  } else if (server.includes("traefik")) {
    results.push({ name: "Traefik", confidence: 100 });
  } else if (server.includes("h2o")) {
    results.push({ name: "H2O", confidence: 100 });
  } else if (server.includes("cherokee")) {
    results.push({ name: "Cherokee", confidence: 100 });
  } else if (server.includes("lighttpd")) {
    results.push({ name: "Lighttpd", confidence: 100 });
  } else if (server.includes("zeus")) {
    results.push({ name: "Zeus Web Server", confidence: 100 });
  } else if (server.includes("ibm_http_server")) {
    results.push({ name: "IBM HTTP Server", confidence: 100 });
  } else if (server.includes("ats")) {
    results.push({ name: "Apache Traffic Server", confidence: 100 });
  } else if (server.includes("varnish")) {
    results.push({ name: "Varnish", confidence: 100 });
  } else if (server.includes("squid")) {
    results.push({ name: "Squid", confidence: 100 });
  } else if (server.includes("haproxy")) {
    results.push({ name: "HAProxy", confidence: 100 });
  } else if (server.includes("pinpoint")) {
    results.push({ name: "Pinpoint", confidence: 100 });
  } else if (server.includes("tengine")) {
    results.push({ name: "Tengine", confidence: 100 });
  } else if (server && server !== "unknown") {
    results.push({
      name: server.split("/")[0].trim(),
      version: server.split("/")[1]?.trim(),
      confidence: 70,
    });
  }

  return results;
}

export function detectCDN(headers: Record<string, string>): TechItem[] {
  const results: TechItem[] = [];

  if (headers["cf-ray"] || headers["cf-cache-status"]) {
    results.push({ name: "Cloudflare", confidence: 100 });
  }

  if (headers["x-amz-cf-id"] || headers["x-amz-cf-pop"]) {
    results.push({ name: "Amazon CloudFront", confidence: 100 });
  }

  if (headers["x-fastly-request-id"]) {
    results.push({ name: "Fastly", confidence: 100 });
  }

  if (headers["x-akamai-transformed"] || headers["x-akamai-request-id"]) {
    results.push({ name: "Akamai", confidence: 100 });
  }

  if (headers["x-cdn"]?.includes("incapsula")) {
    results.push({ name: "Incapsula", confidence: 100 });
  }

  if (headers["x-sucuri-id"]) {
    results.push({ name: "Sucuri", confidence: 100 });
  }

  if (headers["x-cdn-debug"]) {
    results.push({ name: headers["x-cdn-debug"], confidence: 90 });
  }

  if (headers["via"]?.includes("varnish")) {
    const existing = results.find((r) => r.name === "Varnish");
    if (!existing) {
      results.push({ name: "Varnish", confidence: 80 });
    }
  }

  if (headers["x-varnish"]) {
    const existing = results.find((r) => r.name === "Varnish");
    if (!existing) {
      results.push({ name: "Varnish", confidence: 80 });
    }
  }

  if (headers["x-cache"]?.includes("hinet")) {
    results.push({ name: "HiNet CDN", confidence: 90 });
  }

  if (headers["x-cdn"]) {
    const cdnName = headers["x-cdn"];
    if (!results.find((r) => r.name.toLowerCase() === cdnName.toLowerCase())) {
      results.push({ name: cdnName, confidence: 80 });
    }
  }

  return results;
}

export function detectHosting(html: string, headers: Record<string, string>): TechItem[] {
  const results: TechItem[] = [];

  const hostingPatterns = [
    { name: "Cloudways", patterns: [/cloudways/i] },
    { name: "SiteGround", patterns: [/siteground/i, /sg-cachepress/i] },
    { name: "WP Engine", patterns: [/wpengine/i, /wp-engine/i] },
    { name: "Kinsta", patterns: [/kinsta/i] },
    { name: "Flywheel", patterns: [/flywheel/i] },
    { name: "Pagely", patterns: [/pagely/i] },
    { name: "Bluehost", patterns: [/bluehost/i] },
    { name: "HostGator", patterns: [/hostgator/i] },
    { name: "GoDaddy", patterns: [/godaddy/i] },
    { name: "DigitalOcean", patterns: [/digitalocean/i] },
    { name: "Linode", patterns: [/linode/i] },
    { name: "Vultr", patterns: [/vultr/i] },
    { name: "Heroku", patterns: [/heroku/i] },
    { name: "Netlify", patterns: [/netlify/i] },
    { name: "Vercel", patterns: [/vercel/i] },
    { name: "AWS", patterns: [/amazonaws/i, /aws/i] },
    { name: "Google Cloud", patterns: [/googleapis/i, /google cloud/i] },
    { name: "Azure", patterns: [/azure/i, /microsoft\.com/i] },
  ];

  for (const pattern of hostingPatterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(html) || regex.test(JSON.stringify(headers))) {
        results.push({ name: pattern.name, confidence: 80 });
        break;
      }
    }
  }

  return results;
}

export function detectLanguages(
  headers: Record<string, string>,
  html: string
): TechItem[] {
  const results: TechItem[] = [];

  if (headers["x-powered-by"]) {
    const poweredBy = headers["x-powered-by"];
    if (poweredBy.includes("PHP")) {
      const versionMatch = poweredBy.match(/PHP\/([\d.]+)/);
      results.push({
        name: "PHP",
        version: versionMatch?.[1],
        confidence: 100,
      });
    } else if (poweredBy.includes("Express")) {
      results.push({ name: "Express", confidence: 100 });
    } else if (poweredBy.includes("ASP.NET")) {
      results.push({ name: "ASP.NET", confidence: 100 });
    } else if (poweredBy.includes("Ruby")) {
      results.push({ name: "Ruby", confidence: 100 });
    } else if (poweredBy.includes("Python")) {
      results.push({ name: "Python", confidence: 100 });
    } else if (poweredBy.includes("Node.js")) {
      results.push({ name: "Node.js", confidence: 100 });
    }
  }

  if (headers["set-cookie"]?.includes("PHPSESSID")) {
    if (!results.find((r) => r.name === "PHP")) {
      results.push({ name: "PHP", confidence: 80 });
    }
  }

  if (headers["set-cookie"]?.includes("JSESSIONID")) {
    results.push({ name: "Java", confidence: 90 });
  }

  if (headers["set-cookie"]?.includes("ASP.NET_SessionId")) {
    if (!results.find((r) => r.name === "ASP.NET")) {
      results.push({ name: "ASP.NET", confidence: 90 });
    }
  }

  if (html.includes("django") || html.includes("csrfmiddlewaretoken")) {
    results.push({ name: "Django", confidence: 80 });
  }

  if (html.includes("laravel") || html.includes("laravel_session")) {
    results.push({ name: "Laravel", confidence: 80 });
  }

  if (html.includes("rails") || html.includes("csrf-token")) {
    results.push({ name: "Ruby on Rails", confidence: 70 });
  }

  if (html.includes("next/") || html.includes("__next")) {
    results.push({ name: "Next.js", confidence: 90 });
  }

  if (html.includes("nuxt/") || html.includes("__nuxt")) {
    results.push({ name: "Nuxt.js", confidence: 90 });
  }

  return results;
}

export function detectSSL(url: string): TechItem[] {
  const results: TechItem[] = [];

  if (url.startsWith("https://")) {
    results.push({ name: "SSL", confidence: 100 });
  }

  return results;
}
