import { MermaidTheme } from "@/types/diagflow";

export interface MermaidConfig {
  theme: MermaidTheme;
  themeVariables?: Record<string, string>;
}

export const getMermaidConfig = (theme: MermaidTheme): MermaidConfig => {
  const configs: Record<MermaidTheme, MermaidConfig> = {
    default: {
      theme: "default",
      themeVariables: {
        primaryColor: "#a78bfa",
        primaryTextColor: "#fff",
        primaryBorderColor: "#8b5cf6",
        lineColor: "#60a5fa",
        secondaryColor: "#7dd3fc",
        tertiaryColor: "#c084fc",
        fontSize: "16px",
        fontFamily: "Inter, system-ui, sans-serif",
      },
    },
    forest: {
      theme: "forest",
      themeVariables: {
        primaryColor: "#34d399",
        primaryTextColor: "#fff",
        primaryBorderColor: "#10b981",
        lineColor: "#6ee7b7",
        fontSize: "16px",
        fontFamily: "Inter, system-ui, sans-serif",
      },
    },
    dark: {
      theme: "dark",
      themeVariables: {
        darkMode: "true",
        primaryColor: "#8b5cf6",
        primaryTextColor: "#fff",
        primaryBorderColor: "#6d28d9",
        lineColor: "#a78bfa",
        fontSize: "16px",
        fontFamily: "Inter, system-ui, sans-serif",
      },
    },
    neutral: {
      theme: "neutral",
      themeVariables: {
        primaryColor: "#64748b",
        primaryTextColor: "#fff",
        primaryBorderColor: "#475569",
        lineColor: "#94a3b8",
        fontSize: "16px",
        fontFamily: "Inter, system-ui, sans-serif",
      },
    },
  };

  return configs[theme];
};

export const initializeMermaid = async (theme: MermaidTheme = "default") => {
  // Dynamically import mermaid
  const mermaid = (await import("mermaid")).default;
  
  const config = getMermaidConfig(theme);
  
  mermaid.initialize({
    startOnLoad: false,
    theme: config.theme,
    themeVariables: config.themeVariables,
    securityLevel: "loose",
    flowchart: {
      htmlLabels: true,
      curve: "basis",
      padding: 20,
      nodeSpacing: 50,
      rankSpacing: 50,
    },
  });

  return mermaid;
};

export const renderDiagram = async (
  code: string,
  elementId: string,
  theme: MermaidTheme = "default"
): Promise<void> => {
  const mermaid = await initializeMermaid(theme);
  
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id ${elementId} not found`);
    }

    // Clear previous content
    element.innerHTML = "";
    
    // Generate unique ID for this render
    const graphId = `mermaid-${Date.now()}`;
    
    // Render the diagram
    const { svg } = await mermaid.render(graphId, code);
    element.innerHTML = svg;
  } catch (error) {
    console.error("Mermaid rendering error:", error);
    throw error;
  }
};
