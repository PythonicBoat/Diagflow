import { Message, DiagramHistoryEntry, AppSettings } from "@/types/diagflow";

const STORAGE_KEYS = {
  CHAT_HISTORY: "diagflow_chat_history",
  DIAGRAM_HISTORY: "diagflow_diagram_history",
  SETTINGS: "diagflow_settings",
  CURRENT_DIAGRAM: "diagflow_current_diagram",
  HISTORY_INDEX: "diagflow_history_index",
} as const;

export const storage = {
  // Chat History
  getChatHistory: (): Message[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    return data ? JSON.parse(data) : [];
  },

  saveChatHistory: (messages: Message[]) => {
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
  },

  // Diagram History
  getDiagramHistory: (): DiagramHistoryEntry[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DIAGRAM_HISTORY);
    return data ? JSON.parse(data) : [];
  },

  saveDiagramHistory: (history: DiagramHistoryEntry[]) => {
    localStorage.setItem(STORAGE_KEYS.DIAGRAM_HISTORY, JSON.stringify(history));
  },

  // Settings
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data
      ? JSON.parse(data)
      : {
          theme: "default",
          autoSave: true,
          animations: true,
          helpPanelDismissed: false,
        };
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Current Diagram
  getCurrentDiagram: (): string => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_DIAGRAM) || "";
  },

  saveCurrentDiagram: (code: string) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, code);
  },

  // History Index
  getHistoryIndex: (): number => {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY_INDEX);
    return data ? parseInt(data, 10) : -1;
  },

  saveHistoryIndex: (index: number) => {
    localStorage.setItem(STORAGE_KEYS.HISTORY_INDEX, index.toString());
  },

  // Clear all
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  },
};
