export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  base64: string;
  source: "upload" | "clipboard";
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  attachments?: Attachment[];
}

export interface DiagramHistoryEntry {
  code: string;
  prompt: string;
  timestamp: number;
}

export interface AppSettings {
  geminiApiKey?: string;
  theme: "default" | "forest" | "dark" | "neutral";
  autoSave: boolean;
  animations: boolean;
  helpPanelDismissed: boolean;
}

export interface DiagramResponse {
  explanation: string;
  code: string;
  suggestions: string[];
}

export type MermaidTheme = "default" | "forest" | "dark" | "neutral";
