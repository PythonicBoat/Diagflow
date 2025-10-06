import { useEffect, useRef, useState } from "react";
import { renderDiagram } from "@/lib/mermaid";
import { MermaidTheme } from "@/types/diagflow";
import { AlertCircle } from "lucide-react";

interface DiagramViewerProps {
  code: string;
  theme?: MermaidTheme;
  zoom?: number;
}

export function DiagramViewer({ code, theme = "default", zoom = 1 }: DiagramViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const render = async () => {
      if (!code || !containerRef.current) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await renderDiagram(code, "diagram-svg-container", theme);
      } catch (err) {
        console.error("Diagram render error:", err);
        setError(err instanceof Error ? err.message : "Failed to render diagram");
      } finally {
        setIsLoading(false);
      }
    };

    render();
  }, [code, theme]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center p-8 overflow-auto"
      style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
    >
      {error && (
        <div className="glass-panel p-6 max-w-md text-center space-y-3">
          <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold">Rendering Error</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {!error && isLoading && code && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Rendering diagram...</p>
        </div>
      )}

      {!error && !code && (
        <div className="text-center space-y-3 max-w-md">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold">No Diagram Yet</h3>
          <p className="text-sm text-muted-foreground">
            Start a conversation with Archie to generate your first system diagram
          </p>
        </div>
      )}

      <div 
        id="diagram-svg-container" 
        className="animate-scale-in"
        style={{ display: error || !code ? 'none' : 'block' }}
      />
    </div>
  );
}
