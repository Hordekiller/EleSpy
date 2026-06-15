export interface TechItem {
  name: string;
  version?: string;
  confidence: number;
  icon?: string;
  url?: string;
}

export interface TechCategory {
  id: string;
  name: string;
  icon: string;
  items: TechItem[];
}

export interface DetectionResult {
  url: string;
  title: string;
  categories: TechCategory[];
  timestamp: number;
}

export interface DetectorPattern {
  name: string;
  patterns: RegExp[];
  version?: RegExp;
  confidence: number;
  url?: string;
}

export interface HeaderDetector {
  name: string;
  header: string;
  patterns: RegExp[];
  version?: RegExp;
  confidence: number;
}

export interface MetaDetector {
  name: string;
  selector: string;
  attribute?: string;
  patterns: RegExp[];
  version?: RegExp;
  confidence: number;
}

export interface ScriptDetector {
  name: string;
  scripts: RegExp[];
  variable?: string;
  version?: RegExp;
  confidence: number;
}

export interface BodyDetector {
  name: string;
  patterns: RegExp[];
  confidence: number;
}

export interface CookieDetector {
  name: string;
  patterns: RegExp[];
  confidence: number;
}
