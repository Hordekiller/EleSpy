export interface ExtensionMessage {
  type: string;
  payload: unknown;
}

export interface ExtractionRequest {
  type: "extract";
  format: "json" | "css" | "variables" | "full";
}

export interface DetectionRequest {
  type: "detect";
}

export type BackgroundMessage = ExtractionRequest | DetectionRequest;

export interface ExtractionResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface StorageData {
  lastUrl: string;
  lastExtraction: unknown;
  settings: {
    autoCopy: boolean;
    defaultFormat: string;
    theme: "light" | "dark";
  };
}
