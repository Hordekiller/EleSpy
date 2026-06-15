import type { TechItem, DetectorPattern } from "./types";

export function detectFromPatterns(
  html: string,
  scripts: string[],
  patterns: DetectorPattern[]
): TechItem[] {
  const results: TechItem[] = [];

  for (const pattern of patterns) {
    for (const regex of pattern.patterns) {
      const match = html.match(regex);
      if (match) {
        let version: string | undefined;
        if (pattern.version) {
          const versionMatch = html.match(pattern.version);
          if (versionMatch) version = versionMatch[1];
        }
        results.push({
          name: pattern.name,
          version,
          confidence: pattern.confidence,
        });
        break;
      }
    }
  }

  return results;
}

export function detectFromScripts(
  html: string,
  scriptPatterns: { name: string; scripts: RegExp[]; variable?: string; confidence: number; version?: RegExp }[]
): TechItem[] {
  const results: TechItem[] = [];

  for (const pattern of scriptPatterns) {
    for (const regex of pattern.scripts) {
      if (regex.test(html)) {
        let version: string | undefined;
        if (pattern.version) {
          const versionMatch = html.match(pattern.version);
          if (versionMatch) version = versionMatch[1];
        }
        results.push({
          name: pattern.name,
          version,
          confidence: pattern.confidence,
        });
        break;
      }
    }
  }

  return results;
}

export function detectFromBody(
  html: string,
  patterns: { name: string; patterns: RegExp[]; confidence: number }[]
): TechItem[] {
  const results: TechItem[] = [];

  for (const pattern of patterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(html)) {
        results.push({
          name: pattern.name,
          confidence: pattern.confidence,
        });
        break;
      }
    }
  }

  return results;
}

export function detectFromHeaders(
  headers: Record<string, string>,
  detectors: { name: string; header: string; patterns: RegExp[]; confidence: number; version?: RegExp }[]
): TechItem[] {
  const results: TechItem[] = [];

  for (const detector of detectors) {
    const headerValue = headers[detector.header.toLowerCase()];
    if (headerValue) {
      for (const pattern of detector.patterns) {
        if (pattern.test(headerValue)) {
          let version: string | undefined;
          if (detector.version) {
            const versionMatch = headerValue.match(detector.version);
            if (versionMatch) version = versionMatch[1];
          }
          results.push({
            name: detector.name,
            version,
            confidence: detector.confidence,
          });
          break;
        }
      }
    }
  }

  return results;
}

export function detectFromMeta(
  html: string,
  detectors: { name: string; selector: string; patterns: RegExp[]; confidence: number; version?: RegExp }[]
): TechItem[] {
  const results: TechItem[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  for (const detector of detectors) {
    const elements = doc.querySelectorAll(detector.selector);
    for (const el of elements) {
      const content = el.getAttribute("content") || el.textContent || "";
      for (const pattern of detector.patterns) {
        if (pattern.test(content)) {
          let version: string | undefined;
          if (detector.version) {
            const versionMatch = content.match(detector.version);
            if (versionMatch) version = versionMatch[1];
          }
          results.push({
            name: detector.name,
            version,
            confidence: detector.confidence,
          });
          break;
        }
      }
    }
  }

  return results;
}

export function detectGlobalVars(html: string, varNames: string[]): TechItem[] {
  const results: TechItem[] = [];

  for (const varName of varNames) {
    if (html.includes(`window.${varName}`) || html.includes(`${varName} =`)) {
      results.push({
        name: varName,
        confidence: 80,
      });
    }
  }

  return results;
}

export function mergeResults(...results: TechItem[][]): TechItem[] {
  const merged = new Map<string, TechItem>();

  for (const items of results) {
    for (const item of items) {
      const existing = merged.get(item.name);
      if (!existing || item.confidence > existing.confidence) {
        merged.set(item.name, item);
      }
    }
  }

  return Array.from(merged.values());
}
